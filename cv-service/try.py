"""
Try the colour index on any photo(s) of a sliced tuber:

    python try_it.py photo1.jpg photo2.jpg

Prints the score/defects and writes an annotated copy to ./debug_out/ where
the green outline is the detected slice and the blue tint is the region that
was actually measured.
"""
import sys
from pathlib import Path

import cv2

import color_index

if len(sys.argv) < 2:
    raise SystemExit("usage: python try_it.py <image> [<image> ...]")

out = Path(__file__).parent / "debug_out"
out.mkdir(exist_ok=True)

print(f"{'file':32} {'score':>6} {'conf':>5}  defects")
for p in sys.argv[1:]:
    try:
        r = color_index.analyze(Path(p).read_bytes())
    except (ValueError, OSError) as e:
        print(f"{Path(p).name:32} ERROR: {e}")
        continue
    cv2.imwrite(str(out / f"{Path(p).stem}_debug.png"), r.overlay)
    print(f"{Path(p).name:32} {r.pigment_score:6.1f} {r.confidence:5.2f}  {','.join(r.defects) or '-'}")
print(f"\nAnnotated images written to {out}")