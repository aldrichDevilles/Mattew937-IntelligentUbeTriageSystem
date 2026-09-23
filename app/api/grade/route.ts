import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../db/supabase";
import { sendGradeSms } from "../../../lib/sms";
import { gradeBatch, type UbeGrade } from "../../../lib/cv";

const LETTER_GRADE: Record<UbeGrade, string> = {
  seed: "A",
  industrial: "B",
  reject: "C",
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // 1. Extract the specific keys we defined in the new frontend FormData
    const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
    const farmerName = formData.get("farmerName") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const volumeKg = Number(formData.get("volume"));
    
    // Note: If you want to store pricePerKilo, ensure your 'farmers' or 'batches' table has a column for it.
    // const pricePerKilo = Number(formData.get("pricePerKilo"));

    if (files.length === 0) {
      return NextResponse.json({ error: "No photos provided" }, { status: 400 });
    }
    
    // 2. Validate the new text inputs instead of the old farmer_id
    if (!farmerName || !phoneNumber || Number.isNaN(volumeKg)) {
      return NextResponse.json(
        { error: "Farmer name, phone number, and a numeric volume are required" },
        { status: 400 },
      );
    }

    // 3. CREATE THE FARMER FIRST
    // We insert the new farmer and immediately return their generated row to get the ID
    const { data: newFarmer, error: farmerError } = await supabaseAdmin
      .from("farmers")
      .insert({
        name: farmerName,
        phone_number: phoneNumber,
      })
      .select()
      .single();

    if (farmerError) {
      console.error("Farmer Creation Error:", farmerError);
      return NextResponse.json({ error: `DB Error: ${farmerError.message}` }, { status: 500 });
    }

    // Extract the newly generated UUID
    const farmerId = newFarmer.id;

    // 4. RUN THE VISION MODEL INFERENCE
    const images = await Promise.all(
      files.map(async (f) => ({
        name: f.name,
        bytes: Buffer.from(await f.arrayBuffer()),
      })),
    );

    const cv = await gradeBatch(images);

    // 5. INSERT THE BATCH
    // We now use the farmerId we just generated in step 3
    const { data: batch, error: batchError } = await supabaseAdmin
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

    if (batchError) {
      console.error("Batch Creation Error:", batchError);
      return NextResponse.json({ error: "Failed to log batch" }, { status: 500 });
    }

    // 6. SEND SMS RECEIPT
    const smsResult = await sendGradeSms(farmerId, batch);

    return NextResponse.json({ success: true, batch, sms: smsResult, cv });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}