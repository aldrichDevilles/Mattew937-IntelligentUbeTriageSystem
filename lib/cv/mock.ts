import { createHash } from "crypto";
import { gradeTuber, rollUpBatch } from "./rubric";
import type {
  BatchGradeResult,
  CvImageInput,
  DefectFlag,
  TuberResult,
} from "./types";

/**
 * MOCK GRADER. No computer vision happens here.
 *
 * - Deterministic: the same image bytes always give the same result,
 *   so a demo is repeatable and bugs are reproducible.
 * - Controllable: put a hint in the filename to force an outcome on stage.
 *     "seed"       -> high pigment, no defects   (seed-grade)
 *     "industrial" -> mid pigment, no defects    (industrial-grade)
 *     "reject"     -> low pigment + rot          (reject)
 *     "browning"   -> adds a browning defect
 *   e.g. sack12_seed_1.jpg
 */

export const MOCK_MODEL_VERSION = "mock-0.1";

function mockTuber(input: CvImageInput, index: number): TuberResult {
  const digest = createHash("sha256").update(input.bytes).digest();
  const unit = (i: number) => digest[i] / 255; // 0..1, stable per image

  const name = input.name.toLowerCase();
  let pigmentScore = 30 + unit(0) * 65; // 30..95
  const defects: DefectFlag[] = [];

  if (unit(1) < 0.08) defects.push("browning"); // ~8% of random images

  if (name.includes("seed")) pigmentScore = 82 + unit(2) * 10;
  else if (name.includes("industrial")) pigmentScore = 52 + unit(2) * 15;
  else if (name.includes("reject")) {
    pigmentScore = 15 + unit(2) * 20;
    defects.push("rot");
  }
  if (name.includes("browning") && !defects.includes("browning"))
    defects.push("browning");

  pigmentScore = Math.round(pigmentScore * 10) / 10;

  return {
    index,
    grade: gradeTuber(pigmentScore, defects),
    pigmentScore,
    defects,
    confidence: Math.round((0.7 + unit(3) * 0.25) * 100) / 100, // 0.70..0.95
  };
}

export async function mockGradeBatch(
  images: CvImageInput[],
): Promise<BatchGradeResult> {
  // Fake a little inference latency so the UI's loading state gets exercised.
  await new Promise((resolve) => setTimeout(resolve, 600));

  const tubers = images.map((img, i) => mockTuber(img, i));
  return rollUpBatch(tubers, {
    source: "mock",
    modelVersion: MOCK_MODEL_VERSION,
  });
}
