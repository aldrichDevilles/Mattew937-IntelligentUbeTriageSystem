/**
 * CV contract for the Intelligent Ube Triage System.
 *
 * Every grader (mock, Python service, Roboflow, ...) must return a
 * BatchGradeResult. The rest of the app (grade route, dashboard, SMS)
 * only depends on these types, so swapping the grader never breaks it.
 */

/** seed = route to nurseries, industrial = route to processors, reject = neither */
export type UbeGrade = "seed" | "industrial" | "reject";

/** Things color alone can't tell you. Extend as your classifier learns more. */
export type DefectFlag =
  | "browning"
  | "rot"
  | "rot_suspect"
  | "damage"
  | "pale_flesh"
  | "not_ube";

/** A single input photo (one cross-section image). */
export interface CvImageInput {
  name: string;
  bytes: Buffer;
}

export interface TuberResult {
  /** Position in the submitted sample (0-based). */
  index: number;
  grade: UbeGrade;
  /** 0-100. Placeholder for the anthocyanin index (CIELAB chroma-based later). */
  pigmentScore: number;
  defects: DefectFlag[];
  /** 0-1 */
  confidence: number;
  /** 0-1 confidence from the learned rot model. Null/absent if the model was unavailable. */
  rotProbability?: number | null;
  /** True when the rule and the model disagree on rot. A human should look. */
  needsReview?: boolean;
}

export interface BatchGradeResult {
  grade: UbeGrade;
  /** Mean pigment score across the sampled tubers, 0-100. */
  pigmentScore: number;
  /** 0-1. Lowest tuber confidence, penalized when tubers disagree. */
  confidence: number;
  /** Std-dev of pigment scores across the sample. High = tubers disagree. */
  pigmentSpread: number;
  /** True when the sample is too inconsistent to trust. Ask the agent to resample. */
  needsResample: boolean;
  tubers: TuberResult[];
  /** Which grader produced this. Show it in the UI so nobody mistakes mock for real. */
  source: "mock" | "service";
  modelVersion: string;
}
