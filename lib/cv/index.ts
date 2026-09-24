import { mockGradeBatch } from "./mock";
import type { BatchGradeResult, CvImageInput } from "./types";

export * from "./types";
export { RUBRIC } from "./rubric";

/**
 * The one function the rest of the app calls.
 *
 * Env vars (.env.local):
 *   USE_STUB_MODEL=true  legacy flag, forces the mock (kept so old setups work)
 *   CV_MODE=mock         (ult) use the placeholder grader
 *   CV_MODE=service      call the Python service
 *   CV_SERVICE_URL=http://localhost:8000
 */
export async function gradeBatch(
  images: CvImageInput[],
): Promise<BatchGradeResult> {
  if (images.length === 0) {
    throw new Error("gradeBatch needs at least one image");
  }

  const mode =
    process.env.USE_STUB_MODEL === "true"
      ? "mock"
      : (process.env.CV_MODE ?? "mock");

  if (mode === "mock") {
    return mockGradeBatch(images);
  }

  if (mode === "service") {
    const baseUrl = process.env.CV_SERVICE_URL ?? "http://localhost:8000";
    const form = new FormData();
    for (const img of images) {
      form.append("images", new Blob([new Uint8Array(img.bytes)]), img.name);
    }

    const res = await fetch(`${baseUrl}/grade`, { method: "POST", body: form });
    if (!res.ok) {
      throw new Error(`CV service returned ${res.status}: ${await res.text()}`);
    }
    return (await res.json()) as BatchGradeResult;
  }

  throw new Error(`Unknown CV_MODE "${mode}". Use "mock" or "service".`);
}
