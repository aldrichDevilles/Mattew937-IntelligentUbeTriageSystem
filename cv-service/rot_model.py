import math
import os
from pathlib import Path

_HERE = Path(__file__).parent


def _load_env_file():
    # repo-root .env.local (shared with the Next app), then cv-service/.env as a fallback.
    # setdefault means a variable already set in the terminal wins, then the first file found.
    for p in (_HERE.parent / ".env.local", _HERE / ".env"):
        if not p.exists():
            continue
        for line in p.read_text(encoding="utf-8-sig").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


_load_env_file()

ENABLED = os.environ.get("ROT_MODEL_ENABLED", "false").strip().lower() in ("1", "true", "yes", "on")

_bundle = None
if ENABLED:
    try:
        import joblib  # only imported when the model is switched on

        _bundle = joblib.load(_HERE / "rot_model.joblib")
    except Exception as e:  # missing file, sklearn mismatch, etc.
        print(f"[rot_model] enabled but load failed, using rule only: {e}")
else:
    print("[rot_model] disabled (ROT_MODEL_ENABLED is not true), using rule only")

ACTIVE = _bundle is not None


def _row(debug: dict) -> list:
    """Same 7 features as train_baseline.features(), in the order saved in the bundle."""
    hue = math.radians(float(debug["median_hue_deg"]))
    vals = {
        "dark_frac": debug["dark_frac"],
        "brown_frac": debug["brown_frac"],
        "purple_frac": debug["purple_frac"],
        "median_purple_chroma": debug["median_purple_chroma"],
        "median_chroma": debug["median_chroma"],
        "hue_sin": math.sin(hue),
        "hue_cos": math.cos(hue),
    }
    return [float(vals[k]) for k in _bundle["features"]]


def rot_probability(debug: dict):
    """P(rot), or None when the model is off, failed to load, or nothing was measured."""
    if not ACTIVE:
        return None
    try:
        return float(_bundle["model"].predict_proba([_row(debug)])[0][1])
    except (KeyError, ValueError, TypeError):
        return None  # e.g. "no slice found" leaves debug without these keys