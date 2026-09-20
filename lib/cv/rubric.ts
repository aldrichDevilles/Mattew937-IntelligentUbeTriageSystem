import type {
  BatchGradeResult,
  DefectFlag,
  TuberResult,
  UbeGrade,
} from "./types";

/**
 * PLACEHOLDER RUBRIC
 */
export const RUBRIC = {
  /** Mean pigment score needed for seed-grade (and no defects on any tuber). */
  seedMinPigment: 75,
  /** Mean pigment score needed for industrial-grade. */
  industrialMinPigment: 45,
  /** Defects that automatically make a tuber a reject. */
  severeDefects: ["rot", "not_ube"] as DefectFlag[],
  /** If pigment std-dev across the sample exceeds this, ask for a resample. */
  maxPigmentSpread: 20,
  /** If batch confidence falls below this, ask for a resample. */
  minConfidence: 0.6,
};

/** Grade a single tuber from its pigment score and defects. */
export function gradeTuber(
  pigmentScore: number,
  defects: DefectFlag[],
): UbeGrade {
  if (defects.some((d) => RUBRIC.severeDefects.includes(d))) return "reject";
  if (pigmentScore >= RUBRIC.seedMinPigment && defects.length === 0)
    return "seed";
  if (pigmentScore >= RUBRIC.industrialMinPigment) return "industrial";
  return "reject";
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function stdDev(xs: number[]): number {
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}

/**
 * Roll per-tuber results up into one batch grade.
 * Used by every grader, so mock and real results are graded identically.
 */
export function rollUpBatch(
  tubers: TuberResult[],
  meta: { source: BatchGradeResult["source"]; modelVersion: string },
): BatchGradeResult {
  if (tubers.length === 0) {
    throw new Error("rollUpBatch needs at least one tuber result");
  }

  const pigmentScore = mean(tubers.map((t) => t.pigmentScore));
  const pigmentSpread = stdDev(tubers.map((t) => t.pigmentScore));
  const severeCount = tubers.filter((t) =>
    t.defects.some((d) => RUBRIC.severeDefects.includes(d)),
  ).length;
  const anyDefect = tubers.some((t) => t.defects.length > 0);

  let grade: UbeGrade;
  if (severeCount >= tubers.length / 2) {
    grade = "reject"; // half or more of the sample is unusable
  } else if (pigmentScore >= RUBRIC.seedMinPigment && !anyDefect) {
    grade = "seed";
  } else if (pigmentScore >= RUBRIC.industrialMinPigment) {
    grade = "industrial";
  } else {
    grade = "reject";
  }

  const spreadPenalty = Math.min(0.3, pigmentSpread / 100);
  const confidence = Math.max(
    0,
    Math.min(...tubers.map((t) => t.confidence)) - spreadPenalty,
  );

  return {
    grade,
    pigmentScore: Math.round(pigmentScore * 10) / 10,
    confidence: Math.round(confidence * 100) / 100,
    pigmentSpread: Math.round(pigmentSpread * 10) / 10,
    needsResample:
      pigmentSpread > RUBRIC.maxPigmentSpread ||
      confidence < RUBRIC.minConfidence,
    tubers,
    source: meta.source,
    modelVersion: meta.modelVersion,
  };
}
