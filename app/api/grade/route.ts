import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../db/supabase";
import { sendGradeSms } from "../../../lib/sms";

const USE_STUB = process.env.USE_STUB_MODEL === "true";

async function callCVModel(imageBuffer: Buffer) {
  if (USE_STUB) {
    return { anthocyanin_score: Math.random() * 100, grade: "A" };
  }

  const res = await fetch(process.env.CV_MODEL_ENDPOINT!, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: new Uint8Array(imageBuffer),
  });
  if (!res.ok) throw new Error(`CV model error: ${res.status}`);
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;
    const farmerId = formData.get("farmer_id") as string;
    const volumeKg = Number(formData.get("volume_kg"));

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { anthocyanin_score, grade } = await callCVModel(buffer);

    const { data: batch, error } = await supabaseAdmin
      .from("batches")
      .insert({
        farmer_id: farmerId,
        volume_kg: volumeKg,
        anthocyanin_score,
        grade,
        status: "graded",
        graded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    const smsResult = await sendGradeSms(farmerId, batch);

    return NextResponse.json({ success: true, batch, sms: smsResult });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
