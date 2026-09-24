"""
Batch evaluation for the ube CV pipeline (color_index + sprout_index).

Run from cv-service/, in the same Python environment as uvicorn:

  python evaluate.py photos                      # 1st run
  python evaluate.py photos --labels labels.csv  # after you have labelled

1st run writes:
  results.csv          one row per photo: tier, score, defects, sprout result, debug numbers
  labels_template.csv  fill in the true_* columns BEFORE looking at results.csv
  overlays/            what the analyzers saw (<file>_color.png, <file>_sprout.png)

The calibrate/test split in the template is assigned once (fixed seed) and is
never overwritten. Tune rules on 'calibrate' rows only; score 'test' rows once.

This is NOT training: nothing here changes the rules automatically.
"""
import argparse
import csv
import random
from collections import Counter, defaultdict
from pathlib import Path

import cv2

import color_index
import sprout_index
from main import grade_tuber  # the same tier rule the service uses

EXTS = {".jpg", ".jpeg", ".png", ".webp"}
TIERS = ["seed", "industrial", "reject"]
FIELDS = ["file", "error", "tier", "pigment_score", "defects", "confidence",
          "dark_frac", "brown_frac", "purple_frac", "glare_frac", "area_frac",
          "median_purple_chroma", "median_chroma", "median_hue_deg", "bg_a", "bg_b",
          "sprout_status", "sprout_regions", "sprout_reach", "sprout_ratio"]
LABEL_FIELDS = ["file", "split", "true_tier", "rot", "sprouted"]


def analyze_file(path: Path, overlay_dir: Path) -> dict:
    row = {k: "" for k in FIELDS}
    row["file"] = path.name
    data = path.read_bytes()
    try:
        c = color_index.analyze(data)
        s = sprout_index.analyze_sprouts(data)
    except ValueError as e:
        row["error"] = str(e)
        return row
    d = c.debug
    bg = d.get("bg_lab", ["", "", ""])
    row.update(
        tier=grade_tuber(c.pigment_score, c.defects),
        pigment_score=c.pigment_score,
        defects=";".join(c.defects),
        confidence=c.confidence,
        dark_frac=d.get("dark_frac", ""),
        brown_frac=d.get("brown_frac", ""),
        purple_frac=d.get("purple_frac", ""),
        glare_frac=d.get("glare_frac", ""),
        area_frac=d.get("area_frac", ""),
        median_purple_chroma=d.get("median_purple_chroma", ""),
        median_chroma=d.get("median_chroma", ""),
        median_hue_deg=d.get("median_hue_deg", ""),
        bg_a=bg[1], bg_b=bg[2],
        sprout_status=s.status,
        sprout_regions=s.sprout_count,
        sprout_reach=s.longest_rel,
        sprout_ratio=s.sprout_ratio,
    )
    if c.overlay is not None:
        cv2.imwrite(str(overlay_dir / f"{path.name}_color.png"), c.overlay)
    if s.overlay is not None:
        cv2.imwrite(str(overlay_dir / f"{path.name}_sprout.png"), s.overlay)
    return row


def write_csv(path, fieldnames, rows):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)


def make_template(files, path: Path):
    if path.exists():
        print(f"{path} already exists, not overwriting (this keeps your split fixed).")
        return
    names = sorted(p.name for p in files)
    shuffled = names[:]
    random.Random(42).shuffle(shuffled)
    half = (len(shuffled) + 1) // 2
    split = {n: ("calibrate" if i < half else "test") for i, n in enumerate(shuffled)}
    write_csv(path, LABEL_FIELDS,
              [{"file": n, "split": split[n], "true_tier": "", "rot": "", "sprouted": ""} for n in names])


def yn(v):
    v = (v or "").strip().lower()
    if v in ("yes", "y", "true", "1"):
        return True
    if v in ("no", "n", "false", "0"):
        return False
    return None


def pct(a, b):
    return f"{a}/{b} ({100 * a / b:.0f}%)" if b else "n/a"


def summarize(results, labels):
    seen = {r["file"] for r in results}
    missing = [f for f in labels if f not in seen]
    if missing:
        print("Labelled but not found in the photo folder:", ", ".join(missing))

    groups = defaultdict(list)
    for r in results:
        lab = labels.get(r["file"])
        if lab and not r["error"]:
            groups[(lab.get("split") or "unsplit").strip().lower()].append((r, lab))

    for split, pairs in sorted(groups.items()):
        print(f"\n=== {split.upper()}  ({len(pairs)} photos) ===")
        wrong = []

        tier = [(f["file"], (l.get("true_tier") or "").strip().lower(), f["tier"])
                for f, l in pairs if (l.get("true_tier") or "").strip()]
        if tier:
            print("Tier agreement:", pct(sum(t == p for _, t, p in tier), len(tier)))
            table = Counter((t, p) for _, t, p in tier)
            header = "true \\ predicted"
            print(f"{header:<18}" + "".join(f"{t:>12}" for t in TIERS))
            for t in TIERS:
                print(f"{t:<18}" + "".join(f"{table[(t, p)]:>12}" for p in TIERS))
            wrong += [f"{n}: tier true={t} predicted={p}" for n, t, p in tier if t != p]

        rot = [(f["file"], yn(l.get("rot")), "rot" in f["defects"].split(";"))
               for f, l in pairs if yn(l.get("rot")) is not None]
        if rot:
            fa = sum(1 for _, t, p in rot if p and not t)
            miss = sum(1 for _, t, p in rot if t and not p)
            print(f"Rot flag: correct {pct(sum(t == p for _, t, p in rot), len(rot))}, "
                  f"false alarms {fa}, missed {miss}")
            wrong += [f"{n}: rot true={t} predicted={p}" for n, t, p in rot if t != p]

        sp = [(f["file"], yn(l.get("sprouted")), f["sprout_status"] not in ("none", "unknown", ""))
              for f, l in pairs if yn(l.get("sprouted")) is not None]
        if sp:
            fa = sum(1 for _, t, p in sp if p and not t)
            miss = sum(1 for _, t, p in sp if t and not p)
            print(f"Sprouts detected: correct {pct(sum(t == p for _, t, p in sp), len(sp))}, "
                  f"false alarms {fa}, missed {miss}")
            wrong += [f"{n}: sprouted true={t} predicted={p}" for n, t, p in sp if t != p]

        if wrong:
            print("Disagreements (check overlays/ for these):")
            for w in wrong:
                print("  -", w)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("photos", help="folder of ube photos")
    ap.add_argument("--labels", help="filled-in labels CSV (from labels_template.csv)")
    ap.add_argument("--out", default="results.csv")
    a = ap.parse_args()

    folder = Path(a.photos)
    files = sorted(p for p in folder.iterdir() if p.suffix.lower() in EXTS)
    if not files:
        raise SystemExit(f"No images found in {folder}")

    overlay_dir = Path("overlays")
    overlay_dir.mkdir(exist_ok=True)
    results = [analyze_file(p, overlay_dir) for p in files]
    write_csv(a.out, FIELDS, results)
    print(f"Analyzed {len(results)} photos -> {a.out} (overlays in {overlay_dir}/)")
    bad = [r["file"] for r in results if r["error"]]
    if bad:
        print("Could not read:", ", ".join(bad))

    if a.labels:
        with open(a.labels, newline="", encoding="utf-8-sig") as f:
            labels = {r["file"]: r for r in csv.DictReader(f)}
        summarize(results, labels)
    else:
        make_template(files, Path("labels_template.csv"))
        print("Next: copy labels_template.csv to labels.csv, fill in the true_* columns "
              "without looking at results.csv, then rerun with --labels labels.csv")


if __name__ == "__main__":
    main()