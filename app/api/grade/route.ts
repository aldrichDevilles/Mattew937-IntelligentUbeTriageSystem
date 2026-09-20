import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../db/supabase";
import { sendGradeSms } from "../../../lib/sms";
import { gradeBatch, type UbeGrade } from "../../../lib/cv";

/**
 * The CV module grades as seed / industrial / reject.
 * Your DB and sendGradeSms were built around letter grades ("A"), so we
 * map at the boundary and nothing downstream has to change.
 * TODO: confirm this mapping (and what sms.ts prints) with the team.
 */
const LETTER_GRADE: Record<UbeGrade, string> = {
  seed: "A",
  industrial: "B",
  reject: "C",
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Accepts several photos under "images" (a sample of ~3 tubers),
    // and still accepts the old single "image" field.
    const files = [
      ...formData.getAll("images"),
      ...formData.getAll("image"),
    ].filter((f): f is File => f instanceof File && f.size > 0);
    const farmerId = formData.get("farmer_id") as string;
    const volumeKg = Number(formData.get("volume_kg"));

    if (files.length === 0) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }
    if (!farmerId || Number.isNaN(volumeKg)) {
      return NextResponse.json(
        { error: "farmer_id and a numeric volume_kg are required" },
        { status: 400 },
      );
    }

    const images = await Promise.all(
      files.map(async (f) => ({
        name: f.name,
        bytes: Buffer.from(await f.arrayBuffer()),
      })),
    );

    const cv = await gradeBatch(images);

    const { data: batch, error } = await supabaseAdmin
      .from("batches")
      .insert({
        farmer_id: farmerId,
        volume_kg: volumeKg,
        anthocyanin_score: cv.pigmentScore,
        grade: LETTER_GRADE[cv.grade],
        status: "graded",
        graded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    const smsResult = await sendGradeSms(farmerId, batch);

    // `cv` is returned for the scan terminal UI (per-tuber results, resample
    // warning, mock-vs-real source). It isn't stored: no schema change needed.
    return NextResponse.json({ success: true, batch, sms: smsResult, cv });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
