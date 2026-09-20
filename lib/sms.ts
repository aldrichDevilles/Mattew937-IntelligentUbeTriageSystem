import { supabaseAdmin } from "../db/supabase";

const USE_MOCK_SMS = process.env.USE_MOCK_SMS === "true";

export async function sendGradeSms(farmerId: string, batch: any) {
  const { data: farmer } = await supabaseAdmin
    .from("farmers")
    .select("phone_number, name")
    .eq("id", farmerId)
    .single();

  if (!farmer) return { message: null, delivered: false };

  const message = `Hi ${farmer.name}, your ube batch graded ${batch.grade} (score ${batch.anthocyanin_score.toFixed(1)}). Est. value based on current buyer rates.`;

  if (USE_MOCK_SMS) {
    console.log(`[MOCK SMS] To: ${farmer.phone_number} — ${message}`);
    await supabaseAdmin
      .from("batches")
      .update({ status: "sms_sent" })
      .eq("id", batch.id);
    return { message, delivered: true, mocked: true };
  }

  const params = new URLSearchParams({
    apikey: process.env.SMSMOBILEAPI_KEY!,
    recipients: farmer.phone_number,
    message,
  });

  const res = await fetch("https://api.smsmobileapi.com/sendsms/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const data = await res.json();
  const delivered = res.ok && data?.result?.error === 0;

  if (delivered) {
    await supabaseAdmin
      .from("batches")
      .update({ status: "sms_sent" })
      .eq("id", batch.id);
  } else {
    console.error("SMSMobileAPI failed:", JSON.stringify(data));
  }

  return { message, delivered, mocked: false };
}
