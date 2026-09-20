"""
Colour-index analyzer for ONE sliced-ube photo (cross-section on a matte gray
lightbox background).

Pipeline:
  1. Decode + downscale
  2. Convert to CIELAB (perceptual colour space)
  3. Segment the slice: anything clearly different from the background colour
     (estimated from the image border) is the slice
  4. Keep only the inner "core" of the slice (drops the skin ring and edges)
  5. Correct colour cast: the background is supposed to be neutral gray, so any
     a*/b* offset in it is a white-balance error we subtract from the flesh
  6. Pigment score = median purple-axis chroma of the core, mapped to 0-100
  7. Heuristic defect flags (browning / rot / not_ube / pale_flesh)

STATUS: every number in CAL is a starting guess validated only on synthetic
images (see test_color_index.py). Calibrate on real photos before trusting it.
The defect flags are simple colour heuristics, to be replaced or backed by a
trained classifier once you have labelled data.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import cv2
import numpy as np

CAL = {
    "max_side": 640,            # downscale so the longest side is at most this
    "seg_delta_e": 12.0,        # min LAB distance from background to count as slice
    "core_erode_frac": 0.30,    # ignore the outer 30% of the slice radius (skin, edge blur)
    "highlight_L": 92.0,        # pixels brighter than this are glare, ignored
    "purple_axis_deg": -40.0,   # direction of "ube purple" in the a*/b* plane
    "chroma_min": 5.0,          # purple chroma that maps to score 0
    "chroma_max": 45.0,         # purple chroma that maps to score 100
    "min_core_px": 1500,
    # defect heuristics
    "pale_score": 25.0,
    "brown_hue": (20.0, 90.0),
    "brown_chroma": (8.0, 32.0),
    "brown_L": (15.0, 65.0),
    "brown_frac_flag": 0.12,
    "rot_L": 22.0,
    "rot_frac_flag": 0.15,
    "purple_hue": (250.0, 355.0),
    "not_ube_chroma": 18.0,
    "not_ube_purple_frac": 0.20,
    "not_ube_max_brown_frac": 0.40,
}


@dataclass
class Analysis:
    pigment_score: float
    defects: list
    confidence: float
    debug: dict = field(default_factory=dict)
    overlay: np.ndarray | None = None  # BGR image for eyeballing segmentation


def decode(data: bytes) -> np.ndarray:
    img = cv2.imdecode(np.frombuffer(data, dtype=np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")
    h, w = img.shape[:2]
    scale = CAL["max_side"] / max(h, w)
    if scale < 1:
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    return img


def _to_lab(bgr: np.ndarray) -> np.ndarray:
    # float32 input in [0,1] gives true CIELAB: L 0-100, a/b roughly -127..127
    return cv2.cvtColor(bgr.astype(np.float32) / 255.0, cv2.COLOR_BGR2LAB)


def _segment(lab: np.ndarray):
    """Return (filled slice mask uint8 0/1 or None, background LAB colour)."""
    h, w = lab.shape[:2]
    blur = cv2.GaussianBlur(lab, (5, 5), 0)
    m = max(2, int(0.04 * min(h, w)))
    border = np.concatenate([
        blur[:m].reshape(-1, 3), blur[-m:].reshape(-1, 3),
        blur[:, :m].reshape(-1, 3), blur[:, -m:].reshape(-1, 3),
    ])
    bg = np.median(border, axis=0)

    dist = np.linalg.norm(blur - bg, axis=2)
    mask = (dist > CAL["seg_delta_e"]).astype(np.uint8)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None, bg
    biggest = max(contours, key=cv2.contourArea)
    if cv2.contourArea(biggest) < 0.01 * h * w:
        return None, bg
    filled = np.zeros((h, w), np.uint8)
    cv2.drawContours(filled, [biggest], -1, 1, thickness=-1)  # fills holes too
    return filled, bg


def _frac(x: np.ndarray) -> float:
    return float(x.mean()) if x.size else 0.0


def analyze(data: bytes) -> Analysis:
    bgr = decode(data)
    h, w = bgr.shape[:2]
    lab = _to_lab(bgr)

    mask, bg = _segment(lab)
    if mask is None:
        return Analysis(0.0, ["not_ube"], 0.05, {"note": "no slice found in image"}, bgr)

    # --- core region (drop skin ring / blurry edge) ---
    dt = cv2.distanceTransform(mask, cv2.DIST_L2, 5)
    core = dt > CAL["core_erode_frac"] * dt.max()

    # --- colour-cast correction using the (supposedly neutral) background ---
    corr = lab.copy()
    corr[..., 1] -= bg[1]
    corr[..., 2] -= bg[2]

    L, a, b = corr[..., 0], corr[..., 1], corr[..., 2]
    glare = core & (L > CAL["highlight_L"])
    use = core & ~glare
    n_core = int(use.sum())
    if n_core < 50:
        return Analysis(0.0, ["not_ube"], 0.05, {"note": "slice too small or all glare"}, bgr)

    Lp, ap, bp = L[use], a[use], b[use]

    # --- pigment score ---
    theta = np.radians(CAL["purple_axis_deg"])
    purple_chroma = ap * np.cos(theta) + bp * np.sin(theta)
    med_pc = float(np.median(purple_chroma))
    score = float(np.clip((med_pc - CAL["chroma_min"]) / (CAL["chroma_max"] - CAL["chroma_min"]), 0, 1) * 100)

    # --- defect heuristics ---
    chroma = np.hypot(ap, bp)
    hue = np.degrees(np.arctan2(bp, ap)) % 360
    brown = (
        (hue >= CAL["brown_hue"][0]) & (hue <= CAL["brown_hue"][1])
        & (chroma >= CAL["brown_chroma"][0]) & (chroma <= CAL["brown_chroma"][1])
        & (Lp >= CAL["brown_L"][0]) & (Lp <= CAL["brown_L"][1])
    )
    dark = Lp < CAL["rot_L"]
    purple = (hue >= CAL["purple_hue"][0]) & (hue <= CAL["purple_hue"][1]) & (chroma > 8)
    brown_frac, dark_frac, purple_frac = _frac(brown), _frac(dark), _frac(purple)
    med_chroma = float(np.hypot(np.median(ap), np.median(bp)))

    defects = []
    if brown_frac > CAL["brown_frac_flag"]:
        defects.append("browning")
    if dark_frac > CAL["rot_frac_flag"]:
        defects.append("rot")
    if (med_chroma >= CAL["not_ube_chroma"]
            and purple_frac < CAL["not_ube_purple_frac"]
            and brown_frac < CAL["not_ube_max_brown_frac"]):
        defects.append("not_ube")
    elif score < CAL["pale_score"] and "rot" not in defects:
        defects.append("pale_flesh")

    # --- confidence: how much should we trust this measurement? ---
    conf = 0.95
    area_frac = float(mask.sum()) / (h * w)
    if area_frac < 0.05 or area_frac > 0.85:
        conf -= 0.30  # slice too small / fills the frame
    ys, xs = np.where(mask > 0)
    if ys.min() <= 1 or xs.min() <= 1 or ys.max() >= h - 2 or xs.max() >= w - 2:
        conf -= 0.15  # slice touches the image edge (probably cropped)
    if n_core < CAL["min_core_px"]:
        conf -= 0.40
    glare_frac = float(glare.sum()) / max(1, int(core.sum()))
    if glare_frac > 0.08:
        conf -= 0.10
    if float(np.std(purple_chroma)) > 12:
        conf -= 0.10  # very uneven flesh colour
    conf = float(np.clip(conf, 0.05, 0.95))

    debug = {
        "median_purple_chroma": round(med_pc, 1),
        "median_chroma": round(med_chroma, 1),
        "median_hue_deg": round(float(np.degrees(np.arctan2(np.median(bp), np.median(ap))) % 360), 1),
        "brown_frac": round(brown_frac, 3),
        "dark_frac": round(dark_frac, 3),
        "purple_frac": round(purple_frac, 3),
        "glare_frac": round(glare_frac, 3),
        "area_frac": round(area_frac, 3),
        "bg_lab": [round(float(v), 1) for v in bg],
    }

    # --- debug overlay: green outline = slice, blue tint = measured core ---
    overlay = bgr.copy()
    tint = overlay.copy()
    tint[use] = (255, 120, 0)
    overlay = cv2.addWeighted(tint, 0.35, overlay, 0.65, 0)
    cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(overlay, cnts, -1, (0, 255, 0), 2)
    label = f"score {score:.0f}  conf {conf:.2f}  {','.join(defects) or 'no defects'}"
    cv2.putText(overlay, label, (10, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 4)
    cv2.putText(overlay, label, (10, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    return Analysis(round(score, 1), defects, round(conf, 2), debug, overlay)