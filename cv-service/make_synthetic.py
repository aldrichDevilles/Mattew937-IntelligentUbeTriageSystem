"""
Synthetic sliced-ube images for testing the CV pipeline WITHOUT real tubers.

These are drawn in CIELAB with known colours, so we know the ground truth:
  t = 0.0 -> pale/whitish flesh ... t = 1.0 -> deep purple flesh.

Run `python make_synthetic.py` to write sample JPGs into ./samples/ that you can
also upload through your app to test the whole flow (scan -> grade -> SMS).

IMPORTANT: this only proves the pipeline logic is sound (segmentation, monotonic
response, colour-cast robustness, defect flags). It says nothing about accuracy
on real ube. Real photos are still needed to calibrate CAL in color_index.py.
"""
from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np


def make_slice(
    t: float = 1.0,
    cast: tuple = (0.0, 0.0),   # (a*, b*) white-balance error added to the WHOLE image
    dL: float = 0.0,            # exposure shift added to the whole image
    brown: float = 0.0,         # fraction of the core covered by a browning blotch
    rot: float = 0.0,           # fraction of the core covered by a very dark patch
    orange: bool = False,       # orange-flesh lookalike (e.g. sweet potato)
    radius: int = 150,
    center: tuple = (320, 240),
    highlight: bool = False,
    seed: int = 0,
    shape: tuple = (480, 640),
) -> np.ndarray:
    rng = np.random.default_rng(seed)
    H, W = shape
    cx, cy = center
    lab = np.zeros((H, W, 3), np.float32)
    lab[...] = (55, 0, 0)  # matte gray lightbox background

    axes_outer = (radius, int(radius * 0.8))
    axes_inner = (int(radius * 0.88), int(radius * 0.8 * 0.88))
    outer = np.zeros((H, W), np.uint8)
    inner = np.zeros((H, W), np.uint8)
    cv2.ellipse(outer, (cx, cy), axes_outer, 15, 0, 360, 255, -1)
    cv2.ellipse(inner, (cx, cy), axes_inner, 15, 0, 360, 255, -1)

    flesh = (65, 25, 50) if orange else (85 - 45 * t, 3 + 32 * t, 6 - 30 * t)
    lab[outer > 0] = (30, 10, 5)      # skin ring
    lab[inner > 0] = flesh

    # gentle radial shading so the flesh isn't perfectly flat
    yy, xx = np.mgrid[0:H, 0:W]
    r = np.hypot(xx - cx, yy - cy) / radius
    lab[..., 0] += np.where(inner > 0, -4.0 * r, 0.0).astype(np.float32)

    def blotch(frac: float, colour: tuple):
        if frac <= 0:
            return
        s = np.sqrt(frac)
        m = np.zeros((H, W), np.uint8)
        cv2.ellipse(m, (cx, cy), (max(2, int(0.7 * radius * s)), max(2, int(0.7 * radius * 0.8 * s))), 15, 0, 360, 255, -1)
        lab[(m > 0) & (inner > 0)] = colour

    blotch(brown, (45, 8, 18))
    blotch(rot, (14, 4, 4))

    if highlight:
        hm = np.zeros((H, W), np.uint8)
        cv2.circle(hm, (cx - 40, cy - 30), 14, 255, -1)
        lab[hm > 0] = (98, 0, 0)

    lab[..., 0] += dL
    lab[..., 1] += cast[0]
    lab[..., 2] += cast[1]

    bgr = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
    bgr = np.clip(bgr, 0, 1)
    bgr = cv2.GaussianBlur(bgr, (3, 3), 0)
    bgr = bgr + rng.normal(0, 0.008, bgr.shape).astype(np.float32)
    return (np.clip(bgr, 0, 1) * 255).astype(np.uint8)


def to_jpeg_bytes(img: np.ndarray) -> bytes:
    ok, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 92])
    assert ok
    return buf.tobytes()


SAMPLES = {
    # names use the same hints as the mock, so they also work in mock mode
    "sack1_seed_1.jpg": dict(t=0.95, seed=1),
    "sack1_seed_2.jpg": dict(t=0.90, seed=2, center=(300, 250), radius=140),
    "sack1_seed_3.jpg": dict(t=1.00, seed=3, center=(340, 230), radius=155),
    "sack2_industrial_1.jpg": dict(t=0.66, seed=4),
    "sack2_industrial_2.jpg": dict(t=0.70, seed=5),
    "sack2_industrial_3.jpg": dict(t=0.62, seed=6),
    "sack3_reject_pale.jpg": dict(t=0.05, seed=7),
    "sack3_reject_rot.jpg": dict(t=0.80, rot=0.35, seed=8),
    "sack4_browning.jpg": dict(t=0.90, brown=0.30, seed=9),
    "sack5_not_ube_orange.jpg": dict(orange=True, seed=10),
    "sack6_warm_cast.jpg": dict(t=0.90, cast=(4, 6), seed=11),
    "sack6_glare.jpg": dict(t=0.90, highlight=True, seed=12),
}

if __name__ == "__main__":
    out = Path(__file__).parent / "samples"
    out.mkdir(exist_ok=True)
    for name, kwargs in SAMPLES.items():
        cv2.imwrite(str(out / name), make_slice(**kwargs))
    print(f"Wrote {len(SAMPLES)} synthetic samples to {out}")