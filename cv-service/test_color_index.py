"""
Sanity tests for color_index.py on synthetic images. Run:  python test_color_index.py

Passing means the pipeline logic works. It does NOT mean it is accurate on real
ube: that needs real photos and calibration of CAL in color_index.py.
"""
import numpy as np

from color_index import analyze
from make_synthetic import make_slice, to_jpeg_bytes

failures = []


def check(name: str, ok: bool, detail: str = ""):
    print(f"[{'PASS' if ok else 'FAIL'}] {name} {detail}")
    if not ok:
        failures.append(name)


def run(**kw):
    return analyze(to_jpeg_bytes(make_slice(**kw)))


# 1. Score rises monotonically with pigment, and hits the ends of the scale
levels = [0.0, 0.25, 0.5, 0.75, 1.0]
scores = [run(t=t, seed=1).pigment_score for t in levels]
check("score increases with pigment", all(x < y for x, y in zip(scores, scores[1:])), str(scores))
check("deep purple scores high (>85)", scores[-1] > 85, f"({scores[-1]})")
check("pale flesh scores low (<15)", scores[0] < 15, f"({scores[0]})")

# 2. Robust to white-balance error (background correction)
base = run(t=0.8, seed=2).pigment_score
for cast in [(4, -6), (-5, 5), (6, 6), (-6, -4)]:
    s = run(t=0.8, cast=cast, seed=2).pigment_score
    check(f"colour cast {cast} changes score by <=6", abs(s - base) <= 6, f"(base {base}, got {s})")

# 3. Robust to where the slice sits and how big it is
for center, radius in [((250, 200), 120), ((400, 260), 170), ((320, 240), 100)]:
    s = run(t=0.8, center=center, radius=radius, seed=3).pigment_score
    check(f"position/size {center} r={radius}", abs(s - base) <= 5, f"(base {base}, got {s})")

# 4. Exposure and glare
s = run(t=0.8, dL=8, seed=4).pigment_score
check("brighter exposure (+8 L) changes score by <=8", abs(s - base) <= 8, f"({s} vs {base})")
r = run(t=0.8, highlight=True, seed=5)
check("glare spot ignored", abs(r.pigment_score - base) <= 4, f"({r.pigment_score} vs {base})")

# 5. Defect flags
clean = run(t=0.9, seed=6)
check("clean deep-purple slice has no defects", clean.defects == [], str(clean.defects))
check("browning flagged", "browning" in run(t=0.9, brown=0.30, seed=7).defects)
check("rot flagged", "rot" in run(t=0.8, rot=0.35, seed=8).defects)
check("orange lookalike flagged not_ube", "not_ube" in run(orange=True, seed=9).defects)
check("pale flesh flagged", "pale_flesh" in run(t=0.05, seed=10).defects)

# 6. Confidence behaves sensibly
good = run(t=0.9, seed=11)
cropped = run(t=0.9, center=(40, 240), radius=150, seed=12)
check("good photo has high confidence (>=0.85)", good.confidence >= 0.85, f"({good.confidence})")
check("cropped slice has lower confidence", cropped.confidence < good.confidence, f"({cropped.confidence} vs {good.confidence})")

# 7. Garbage in: empty image and undecodable bytes
empty = analyze(to_jpeg_bytes(np.full((480, 640, 3), 128, np.uint8)))
check("empty image -> not_ube, low confidence", "not_ube" in empty.defects and empty.confidence <= 0.1)
try:
    analyze(b"this is not an image")
    check("undecodable bytes raise ValueError", False)
except ValueError:
    check("undecodable bytes raise ValueError", True)

print()
print("ALL PASSED" if not failures else f"{len(failures)} FAILED: {failures}")
raise SystemExit(1 if failures else 0)