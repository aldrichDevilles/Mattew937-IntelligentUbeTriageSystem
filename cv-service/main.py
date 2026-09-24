"""
CV service for the Intelligent Ube Triage System.

Returns the same JSON shape as lib/cv/types.ts (BatchGradeResult).
Pigment score + defect flags come from color_index.py (CIELAB colour analysis).
Later: add a trained defect classifier next to it inside analyze_tuber().

Run:
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000
"""
import os

# Must run before numpy / scikit-learn are imported, so keep these above them.
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("OMP_NUM_THREADS", "1")

import statistics
from typing import List

from fastapi import FastAPI, File, HTTPException, UploadFile

import color_index
import rot_model
import sprout_index
app = FastAPI(title="Ube CV Service")

MODEL_VERSION = "color-index-0.2-rotmodel" if rot_model.ACTIVE else "color-index-0.1"

# Keep in sync with lib/cv/rubric.ts. PLACEHOLDER thresholds pending expert review.
SEED_MIN = 75
INDUSTRIAL_MIN = 45
SEVERE = {"rot", "not_ube"}
MAX_SPREAD = 20
MIN_CONFIDENCE = 0.6
ROT_THRESHOLD = 0.5  # model probability at or above this counts as rot
ROT_REVIEW_LOW = 0.30  # provisional; tune on calibrate-split CV

def grade_tuber(pigment: float, defects: List[str]) -> str:
    if any(d in SEVERE for d in defects):
        return "reject"
    if pigment >= SEED_MIN and not defects:
        return "seed"
    if pigment >= INDUSTRIAL_MIN:
        return "industrial"
    return "reject"


def analyze_tuber(name: str, data: bytes, index: int) -> dict:
    try:
        result = color_index.analyze(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"{name}: {e}")

    defects = list(result.defects)
    rule_rot = "rot" in defects
    p = rot_model.rot_probability(result.debug)
    needs_review = False
    if p is not None:
        defects = [d for d in defects if d != "rot"]
        if p >= ROT_THRESHOLD:
            defects.append("rot")           # both agree or model alone: reject
        elif rule_rot or p >= ROT_REVIEW_LOW:
            defects.append("rot_suspect")   # uncertain: human check
            needs_review = True

    return {
        "index": index,
        "grade": grade_tuber(result.pigment_score, defects),
        "pigmentScore": result.pigment_score,
        "defects": defects,
        "confidence": result.confidence,
        "rotProbability": None if p is None else round(p, 3),
        "needsReview": needs_review,
    }

def roll_up(tubers: List[dict]) -> dict:
    scores = [t["pigmentScore"] for t in tubers]
    mean = statistics.fmean(scores)
    spread = statistics.pstdev(scores)
    severe = sum(1 for t in tubers if any(d in SEVERE for d in t["defects"]))
    any_defect = any(t["defects"] for t in tubers)

    if severe >= len(tubers) / 2:
        grade = "reject"
    elif mean >= SEED_MIN and not any_defect:
        grade = "seed"
    elif mean >= INDUSTRIAL_MIN:
        grade = "industrial"
    else:
        grade = "reject"

    confidence = max(0.0, min(t["confidence"] for t in tubers) - min(0.3, spread / 100))
    return {
        "grade": grade,
        "pigmentScore": round(mean, 1),
        "confidence": round(confidence, 2),
        "pigmentSpread": round(spread, 1),
        "needsResample": spread > MAX_SPREAD or confidence < MIN_CONFIDENCE
                         or any(t.get("needsReview") for t in tubers),
        "tubers": tubers,
        "source": "service",
        "modelVersion": MODEL_VERSION,
    }


@app.get("/health")
def health():
    return {"status": "ok", "modelVersion": MODEL_VERSION}

@app.post("/sprouts")
async def sprouts(images: List[UploadFile] = File(...)):
    out = []
    for i, f in enumerate(images):
        name = f.filename or f"image_{i}"
        try:
            r = sprout_index.analyze_sprouts(await f.read())
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"{name}: {e}")
        out.append({
            "index": i,
            "status": r.status,
            "sproutCount": r.sprout_count,
            "longestRel": r.longest_rel,
            "confidence": r.confidence,
        })
    return {"tubers": out, "modelVersion": "sprout-index-0.1", "experimental": True} 


@app.post("/grade")
async def grade(images: List[UploadFile] = File(...)):
    if not images:
        raise HTTPException(status_code=400, detail="At least one image is required")
    tubers = []
    for i, f in enumerate(images):
        tubers.append(analyze_tuber(f.filename or f"image_{i}", await f.read(), i))
    return roll_up(tubers)