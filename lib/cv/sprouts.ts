import type { CvImageInput } from "./types";

export interface SproutResult {
  tubers: {
    index: number;
    status: "none" | "budding" | "sprouting" | "overgrown" | "unknown";
    sproutCount: number;
    longestRel: number;
    confidence: number;
  }[];
  modelVersion: string;
  experimental: boolean;
}

/** Never throws: sprouts are optional info and must not break grading. */
export async function analyzeSprouts(
  images: CvImageInput[],
): Promise<SproutResult | null> {
  if (images.length === 0 || process.env.CV_MODE !== "service") return null;
  try {
    const baseUrl = process.env.CV_SERVICE_URL ?? "http://localhost:8000";
    const form = new FormData();
    for (const img of images) {
      form.append("images", new Blob([new Uint8Array(img.bytes)]), img.name);
    }
    const res = await fetch(`${baseUrl}/sprouts`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      console.error("Sprout service failed:", res.status);
      return null;
    }
    return (await res.json()) as SproutResult;
  } catch (err) {
    console.error("Sprout service error:", err);
    return null;
  }
}
