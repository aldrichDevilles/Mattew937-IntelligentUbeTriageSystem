import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../db/supabase";
import { sendGradeSms } from "../../../lib/sms";
import { gradeBatch, type UbeGrade } from "../../../lib/cv";
import { analyzeSprouts } from "../../../lib/cv/sprouts";

const LETTER_GRADE: Record<UbeGrade, string> = {
  seed: "A",
  industrial: "B",
  reject: "C",
};

async function uploadImages(files: File[], batchId: string): Promise<string[]> {
  const urls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${batchId}/${i}.${ext}`;

    const { error } = await supabaseAdmin.storage
      .from("batch-images")
      .upload(path, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (error) {
      console.error("Image upload failed:", error);
      continue;
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("batch-images")
      .getPublicUrl(path);

    urls.push(publicUrlData.publicUrl);
  }

  return urls;
}

/**
 * Turn whatever gradeBatch threw into a sensible HTTP status + message.
 * NOTE: I haven't seen how gradeBatch throws, so this checks err.status first
 * and then falls back to matching the message text. Adjust the regexes once
 * you've triggered each failure and seen the real message.
 */
function classifyCvError(err: unknown): { status: number; message: string } {
  const e = err as {
    status?: number;
    message?: string;
    cause?: { code?: string };
  };
  const msg = e?.message ?? "";
  const code = e?.cause?.code ?? "";
  console.error("[cv error]", { status: e?.status, code, msg, err });

  // Python returned 400: an image could not be decoded
  if (e?.status === 400 || /\b400\b|decode/i.test(msg)) {
    return {
      status: 422,
      message:
        "One of the photos could not be read. Please retake it and try again.",
    };
  }

  // Service unreachable / down / timed out
  if (
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    /fetch failed|ECONNREFUSED|ENOTFOUND|timeout|timed out/i.test(msg)
  ) {
    return {
      status: 503,
      message:
        "The grading service is unavailable right now. Please try again shortly.",
    };
  }

  // Anything else from the CV layer (5xx from Python, bad response, etc.)
  return {
    status: 502,
    message: "The grading service returned an unexpected error.",
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Support field names from both the new frontend form and cURL/API payloads
    const files = [
      ...formData.getAll("photos"),
      ...formData.getAll("images"),
      ...formData.getAll("image"),
    ].filter((f): f is File => f instanceof File && f.size > 0);

    const farmerName = formData.get("farmerName") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const volumeKg = Number(formData.get("volume"));
    const location = formData.get("location") as string;

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No photos provided" },
        { status: 400 },
      );
    }

    // 2. Validate the new text inputs
    if (!farmerName || !phoneNumber || Number.isNaN(volumeKg)) {
      return NextResponse.json(
        { error: "No photos provided" },
        { status: 400 },
      );
    } // 1. validation (keep as is)
    if (
      !farmerName ||
      !phoneNumber ||
      !Number.isFinite(volumeKg) ||
      volumeKg <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Farmer name, phone number, and a volume greater than 0 are required",
        },
        { status: 400 },
      );
    }

    // 2. CREATE THE FARMER FIRST
    const { data: newFarmer, error: farmerError } = await supabaseAdmin
      .from("farmers")
      .insert({ name: farmerName, phone_number: phoneNumber })
      .select()
      .single();

    if (farmerError) {
      console.error("Farmer Creation Error:", farmerError);
      return NextResponse.json(
        { error: `DB Error: ${farmerError.message}` },
        { status: 500 },
      );
    }
    const farmerId = newFarmer.id;

    // 3. RUN CV (moved below the farmer insert)
    const images = await Promise.all(
      files.map(async (f) => ({
        name: f.name,
        bytes: Buffer.from(await f.arrayBuffer()),
      })),
    );

    let cv;
    try {
      cv = await gradeBatch(images);
    } catch (cvErr) {
      console.error("CV grading failed:", cvErr);
      // don't leave an orphan farmer row behind
      await supabaseAdmin.from("farmers").delete().eq("id", farmerId);
      const { status, message } = classifyCvError(cvErr);
      return NextResponse.json({ error: message }, { status });
    }

    // 4. SPROUTS (optional whole-tuber photos)
    const wholeFiles = formData
      .getAll("whole_photos")
      .filter((f): f is File => f instanceof File && f.size > 0);
    const wholeImages = await Promise.all(
      wholeFiles.map(async (f) => ({
        name: f.name,
        bytes: Buffer.from(await f.arrayBuffer()),
      })),
    );
    const sprouts = await analyzeSprouts(wholeImages);

    // INSERT THE BATCH
    const { data: batch, error: batchError } = await supabaseAdmin
      .from("batches")
      .insert({
        farmer_id: farmerId,
        volume_kg: volumeKg,
        anthocyanin_score: cv.pigmentScore,
        sprout_result: sprouts, // jsonb, display-only; null if none supplied
        grade: LETTER_GRADE[cv.grade],
        status: "graded",
        graded_at: new Date().toISOString(),
        location: location,
      })
      .select()
      .single();

    if (batchError) {
      console.error("Batch Creation Error:", batchError);
      return NextResponse.json(
        { error: "Failed to log batch" },
        { status: 500 },
      );
    }
    // UPLOAD IMAGES TO STORAGE & UPDATE BATCH
    const imageUrls = await uploadImages(files, batch.id);
    if (imageUrls.length > 0) {
      await supabaseAdmin
        .from("batches")
        .update({ image_url: imageUrls[0] }) // primary image
        .eq("id", batch.id);
      batch.image_url = imageUrls[0];
    }

    // SEND SMS RECEIPT
    // Don't send a grade text for a batch the CV itself flagged as unreliable
    const smsResult = cv.needsResample
      ? { message: null, delivered: false, skipped: "needs_resample" }
      : await sendGradeSms(farmerId, batch);

    // RETURN FULL RESPONSE
    return NextResponse.json({
      success: true,
      batch,
      sms: smsResult,
      cv,
      imageUrls, // full set of image URLs for UI galleries
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
