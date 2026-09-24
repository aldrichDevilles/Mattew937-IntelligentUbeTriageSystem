"""
Sprout analyzer for ONE whole-tuber photo on the same matte gray lightbox
used by color_index.py (reuses its decode / LAB / segmentation helpers).

Pipeline:
  1. Decode + LAB + segment the tuber (same as color_index)
  2. Colour-cast correct using the neutral background
  3. Find the tuber BODY by morphologically opening the mask with a kernel
     sized to the tuber (this removes anything thin sticking out of it)
  4. Sprouts = foreground pixels that protrude past the body, kept only if
     they are coloured (shadow / background gradient has almost no chroma)
  5. Connected components -> sprout regions (drop specks)
  6. Measure region count, area ratio, and how far the longest shoot sticks out
  7. Map to a status + sprout_score (0-100)

WHY SHAPE, NOT COLOUR: the first version looked for green or cream pixels. On
a real sprouted ube photo the shoots were muted olive/yellow-brown (a* ~ 0,
b* ~ +15), so a "green" rule found nothing. Protrusion + chroma catches any
coloured shoot, including purple/pink ones.

LIMITS (checked on ONE photo only; everything here is a guess until calibrated):
  - Sprouts that touch each other merge into one region, so the count is
    approximate. Treat it as "regions", not an exact number of shoots.
  - Rootlets, dirt clumps or anything else coloured that sticks out will also
    be counted.
  - The status cutoffs (budding / sprouting / overgrown) are placeholders.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import cv2
import numpy as np

from color_index import decode, _to_lab, _segment

SPROUT_CAL = {
    "fg_delta_e": 10.0,         # LAB distance from background to count as foreground
    "body_open_frac": 0.4,      # opening kernel = this * tuber inscribed radius
    "body_margin_px": 9,        # grow the body slightly so its own edge isn't counted
    "chroma_min": 8.0,          # mean a*/b* chroma of a region; below = shadow / bg gradient
    "min_sprout_area_frac": 0.002,  # of tuber body area
    "min_sprout_px": 60,
    "min_reach_rel": 0.06,      # a region must stick out at least this far (x tuber length)
    "budding_max_rel": 0.12,    # how far the longest shoot sticks out / tuber length
    "sprouting_max_rel": 0.30,
    "status_score": {"none": 25.0, "budding": 100.0, "sprouting": 85.0, "overgrown": 40.0},
}


@dataclass
class SproutAnalysis:
    sprout_count: int          # number of sprout regions (adjacent shoots may merge)
    sprout_ratio: float        # sprout pixel area / tuber body area
    longest_rel: float         # how far the longest shoot sticks out / tuber length
    status: str                # none | budding | sprouting | overgrown | unknown
    sprout_score: float
    confidence: float
    debug: dict = field(default_factory=dict)
    overlay: np.ndarray | None = None


def _ellipse(k: int) -> np.ndarray:
    return cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))


def analyze_sprouts(data: bytes) -> SproutAnalysis:
    bgr = decode(data)
    h, w = bgr.shape[:2]
    lab = _to_lab(bgr)

    mask, bg = _segment(lab)
    if mask is None:
        return SproutAnalysis(0, 0.0, 0.0, "unknown", 0.0, 0.05,
                              {"note": "no tuber found in image"}, bgr)

    corr = lab.copy()
    corr[..., 1] -= bg[1]
    corr[..., 2] -= bg[2]
    chroma = np.hypot(corr[..., 1], corr[..., 2])

    # tuber body = mask with thin protrusions opened away
    r = float(cv2.distanceTransform(mask, cv2.DIST_L2, 5).max())
    ksz = max(9, int(SPROUT_CAL["body_open_frac"] * r) | 1)
    body_raw = cv2.morphologyEx(mask, cv2.MORPH_OPEN, _ellipse(ksz))
    if body_raw.sum() == 0:
        body_raw = mask
    body = cv2.dilate(body_raw, _ellipse(SPROUT_CAL["body_margin_px"]))

    # foreground that sticks out past the body
    dist = np.linalg.norm(cv2.GaussianBlur(lab, (3, 3), 0) - bg, axis=2)
    prot = ((dist > SPROUT_CAL["fg_delta_e"]) & (body == 0)).astype(np.uint8)
    prot = cv2.morphologyEx(prot, cv2.MORPH_CLOSE, _ellipse(5))

    tcnts, _ = cv2.findContours(body_raw, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    (_, (rw, rh), _) = cv2.minAreaRect(max(tcnts, key=cv2.contourArea))
    tuber_len = max(rw, rh, 1.0)
    tuber_area = float(body_raw.sum())
    # distance of every outside pixel from the body: measures how far a shoot
    # really sticks out, even if it merges with a strip of rim along the edge
    reach_map = cv2.distanceTransform((body == 0).astype(np.uint8), cv2.DIST_L2, 5)

    n, labels, stats, _ = cv2.connectedComponentsWithStats(prot, connectivity=8)
    min_px = max(SPROUT_CAL["min_sprout_px"], SPROUT_CAL["min_sprout_area_frac"] * tuber_area)

    sprouts = []  # (area_px, length_px, contour)
    for i in range(1, n):
        area = int(stats[i, cv2.CC_STAT_AREA])
        if area < min_px:
            continue
        comp = labels == i
        if float(chroma[comp].mean()) < SPROUT_CAL["chroma_min"]:
            continue  # shadow or background gradient, not a coloured shoot
        reach = float(reach_map[comp].max())
        if reach < SPROUT_CAL["min_reach_rel"] * tuber_len:
            continue  # hugs the tuber edge (rim / skin sliver), doesn't stick out
        cnts, _ = cv2.findContours(comp.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        c = max(cnts, key=cv2.contourArea)
        sprouts.append((area, reach, c))

    count = len(sprouts)
    ratio = sum(s[0] for s in sprouts) / tuber_area
    longest_rel = (max(s[1] for s in sprouts) / tuber_len) if sprouts else 0.0

    if count == 0:
        status = "none"
    elif longest_rel < SPROUT_CAL["budding_max_rel"]:
        status = "budding"
    elif longest_rel < SPROUT_CAL["sprouting_max_rel"]:
        status = "sprouting"
    else:
        status = "overgrown"
    score = SPROUT_CAL["status_score"][status]

    conf = 0.85
    ys, xs = np.where(mask > 0)
    if ys.min() <= 1 or xs.min() <= 1 or ys.max() >= h - 2 or xs.max() >= w - 2:
        conf -= 0.15  # tuber or a shoot cropped by the frame edge
    area_frac = tuber_area / (h * w)
    if area_frac < 0.05 or area_frac > 0.85:
        conf -= 0.25
    if count > 12:
        conf -= 0.20  # probably noise, not sprouts
    conf = float(np.clip(conf, 0.05, 0.95))

    overlay = bgr.copy()
    cv2.drawContours(overlay, tcnts, -1, (0, 255, 0), 2)
    for _, _, c in sprouts:
        cv2.drawContours(overlay, [c], -1, (0, 0, 255), 2)
    label = f"regions {count}  {status}  conf {conf:.2f}"
    cv2.putText(overlay, label, (10, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 4)
    cv2.putText(overlay, label, (10, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    debug = {
        "tuber_area_frac": round(area_frac, 3),
        "tuber_len_px": round(float(tuber_len), 1),
        "protrusion_px": int(prot.sum()),
        "regions_kept": count,
    }
    return SproutAnalysis(count, round(ratio, 4), round(longest_rel, 3), status,
                          score, round(conf, 2), debug, overlay)