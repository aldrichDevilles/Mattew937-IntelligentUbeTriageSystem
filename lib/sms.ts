import { supabaseAdmin } from "../db/supabase";

export async function sendGradeSms(farmerId: string, batch: any) {
  const { data: farmer } = await supabaseAdmin
    .from("farmers")
    .select("phone_number, name")
    .eq("id", farmerId)
    .single();

  if (!farmer) return;

  const message = `Hi ${farmer.name}, your ube batch graded ${batch.grade} (score ${batch.anthocyanin_score.toFixed(1)}). Est. value based on current buyer rates.`;

  const params = new URLSearchParams({
    apikey: process.env.SEMAPHORE_API_KEY!,
    number: farmer.phone_number,
    message,
    sendername: process.env.SEMAPHORE_SENDER_NAME || "SEMAPHORE",
  });

  const res = await fetch("https://api.semaphore.co/api/v4/messages", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!res.ok) {
    console.error("Semaphore SMS failed:", await res.text());
    return;
  }

  await supabaseAdmin
    .from("batches")
    .update({ status: "sms_sent" })
    .eq("id", batch.id);
}
