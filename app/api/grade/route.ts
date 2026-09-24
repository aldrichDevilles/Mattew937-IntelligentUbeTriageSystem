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
    const location = formData.get("location") as string;

    if (files.length === 0) {
      return NextResponse.json({ error: "No photos provided" }, { status: 400 });
    }
    
    // 2. Validate the new text inputs
    if (!farmerName || !phoneNumber || Number.isNaN(volumeKg)) {
      return NextResponse.json(
        { error: "Farmer name, phone number, and a numeric volume are required" },
        { status: 400 },
      );
    }

    // 3. CREATE THE FARMER FIRST
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

    const farmerId = newFarmer.id;

    // 4. RUN THE VISION MODEL INFERENCE
    const images = await Promise.all(
      files.map(async (f) => ({
        name: f.name,
        bytes: Buffer.from(await f.arrayBuffer()),
      })),
    );

    const cv = await gradeBatch(images);

    // 5. UPLOAD THE FIRST PHOTO TO SUPABASE STORAGE FOR THE LEDGER THUMBNAIL
    const photoFile = files[0];
    let publicUrl = null;

    if (photoFile) {
      // Convert the file into a buffer that Supabase can upload
      const arrayBuffer = await photoFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Create a unique filename (e.g., batch-173829183-photo.jpg)
      const fileName = `batch-${Date.now()}-${photoFile.name}`;

      // Upload to the Supabase Storage bucket named "batch-images"
      const { error: uploadError } = await supabaseAdmin
        .storage
        .from("batch-images") 
        .upload(fileName, buffer, {
          contentType: photoFile.type,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
      } else {
        // Generate the viewable URL to save in your database
        const { data: urlData } = supabaseAdmin
          .storage
          .from("batch-images")
          .getPublicUrl(fileName);
          
        publicUrl = urlData.publicUrl;
      }
    }

    // 6. INSERT THE BATCH
    const { data: batch, error: batchError } = await supabaseAdmin
      .from("batches")
      .insert({
        farmer_id: farmerId,
        volume_kg: volumeKg,
        anthocyanin_score: cv.pigmentScore,
        grade: LETTER_GRADE[cv.grade],
        status: "graded",
        graded_at: new Date().toISOString(),
        location: location, 
        image_url: publicUrl,
      })
      .select()
      .single();

    if (batchError) {
      console.error("Batch Creation Error:", batchError);
      return NextResponse.json({ error: "Failed to log batch" }, { status: 500 });
    }

    // 7. SEND SMS RECEIPT
    const smsResult = await sendGradeSms(farmerId, batch);

    return NextResponse.json({ success: true, batch, sms: smsResult, cv });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}