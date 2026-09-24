"""
Entry-level ML baseline for the ube pipeline.

Instead of hand-picking cutoffs (like "rot if more than 15% of pixels are dark"),
let a small model learn the decision from the numbers the analyzers already
produce (results.csv) and your labels (labels.csv). Same evaluation discipline
as evaluate.py: the model only ever learns from 'calibrate' rows, and the
'test' rows are scored once, at the end.

Needs:  pip install scikit-learn numpy

  python train_baseline.py --target rot              # cross-validation on 'calibrate' rows only
  python train_baseline.py --target rot --final      # score the locked 'test' rows ONCE
  python train_baseline.py --target sprouted

Run evaluate.py first (it writes results.csv) and fill in labels.csv.
This is a pilot: with a few dozen photos the numbers are noisy. Report counts,
not a claim of accuracy.
"""
import argparse
import csv

import joblib
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import LeaveOneOut, StratifiedKFold, cross_val_predict
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier, export_text

FEATURE_NAMES = {
    "rot": ["dark_frac", "brown_frac", "purple_frac", "median_purple_chroma",
            "median_chroma", "hue_sin", "hue_cos"],
    "sprouted": ["sprout_regions", "sprout_reach", "sprout_ratio"],
}


def yn(v):
    v = (v or "").strip().lower()
    if v in ("yes", "y", "true", "1"):
        return True
    if v in ("no", "n", "false", "0"):
        return False
    return None


def features(r, target):
    """Turn one results.csv row into numbers. None if the analyzer measured nothing."""
    try:
        if target == "rot":
            hue = np.radians(float(r["median_hue_deg"]))  # circular, so use sin/cos
            base = [float(r[k]) for k in ("dark_frac", "brown_frac", "purple_frac",
                                          "median_purple_chroma", "median_chroma")]
            return base + [float(np.sin(hue)), float(np.cos(hue))]
        return [float(r[k]) for k in ("sprout_regions", "sprout_reach", "sprout_ratio")]
    except (ValueError, KeyError):
        return None


def current_rule(r, target):
    """What the hand-written rules currently say, for comparison."""
    if target == "rot":
        return "rot" in r["defects"].split(";")
    return r["sprout_status"] not in ("none", "unknown", "")


def load(results_path, labels_path, target):
    with open(results_path, newline="", encoding="utf-8-sig") as f:
        results = {r["file"]: r for r in csv.DictReader(f)}
    with open(labels_path, newline="", encoding="utf-8-sig") as f:
        labels = list(csv.DictReader(f))
    rows, skipped = [], 0
    for lab in labels:
        r = results.get(lab["file"])
        y = yn(lab.get(target))
        x = features(r, target) if r and not r.get("error") else None
        if r is None or y is None or x is None:
            skipped += 1
            continue
        rows.append({"file": lab["file"], "split": (lab.get("split") or "").strip().lower(),
                     "x": x, "y": y, "rule": current_rule(r, target)})
    return rows, skipped


def counts(y, p):
    y, p = np.asarray(y, bool), np.asarray(p, bool)
    return {"n": len(y), "correct": int((y == p).sum()),
            "false_alarms": int((p & ~y).sum()), "missed": int((~p & y).sum())}


def show(name, c):
    print(f"  {name:<18} correct {c['correct']}/{c['n']}   "
          f"false alarms {c['false_alarms']}   missed {c['missed']}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--target", choices=list(FEATURE_NAMES), default="rot")
    ap.add_argument("--results", default="results.csv")
    ap.add_argument("--labels", default="labels.csv")
    ap.add_argument("--final", action="store_true", help="score the locked test rows (do this once)")
    a = ap.parse_args()
    names = FEATURE_NAMES[a.target]

    rows, skipped = load(a.results, a.labels, a.target)
    train = [r for r in rows if r["split"] == "calibrate"]
    test = [r for r in rows if r["split"] == "test"]
    print(f"Target: {a.target}   usable photos: {len(rows)} "
          f"(calibrate {len(train)}, test {len(test)}), skipped {skipped} (no label or nothing measured)")

    y = np.array([r["y"] for r in train], dtype=bool)
    if len(train) < 10 or y.sum() < 3 or (~y).sum() < 3:
        print("Not enough labeled photos yet. Need at least 10 in the calibrate split, "
              "with at least 3 of each answer (yes and no). Add more photos and labels.")
        return
    X = np.array([r["x"] for r in train])

    models = {
        "logistic": make_pipeline(StandardScaler(),
                                  LogisticRegression(class_weight="balanced", max_iter=1000)),
        "tree (depth 2)": DecisionTreeClassifier(max_depth=2, class_weight="balanced", random_state=0),
    }

    n_min = int(min(y.sum(), (~y).sum()))
    cv = LeaveOneOut() if len(train) < 30 else StratifiedKFold(n_splits=min(5, n_min), shuffle=True, random_state=0)
    print(f"\nCross-validation on the calibrate rows ({type(cv).__name__}):")
    show("current rule", counts(y, [r["rule"] for r in train]))
    for name, m in models.items():
        show(name, counts(y, cross_val_predict(m, X, y, cv=cv)))

    for m in models.values():
        m.fit(X, y)

    print("\nWhat the logistic model learned (bigger = pushes towards 'yes', standardized):")
    coefs = models["logistic"][-1].coef_[0]
    for n, c in sorted(zip(names, coefs), key=lambda t: -abs(t[1])):
        print(f"  {n:<22} {c:+.2f}")
    print("\nTree rules (readable thresholds):")
    print(export_text(models["tree (depth 2)"], feature_names=names))

    joblib.dump({"model": models["logistic"], "features": names, "target": a.target},
                f"{a.target}_model.joblib")
    print(f"Saved {a.target}_model.joblib (not used by the service yet).")

    if a.final:
        if not test:
            print("\nNo test rows to score.")
            return
        yt = np.array([r["y"] for r in test], dtype=bool)
        Xt = np.array([r["x"] for r in test])
        print(f"\nTEST rows (scored once, {len(test)} photos). Do not tune after seeing this:")
        show("current rule", counts(yt, [r["rule"] for r in test]))
        for name, m in models.items():
            show(name, counts(yt, m.predict(Xt)))
    else:
        print("\nTest rows untouched. When you are done tuning, run again with --final (once).")


if __name__ == "__main__":
    main()