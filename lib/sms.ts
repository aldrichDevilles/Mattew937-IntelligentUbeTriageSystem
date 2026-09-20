import { supabaseAdmin } from "../db/supabase";

const USE_MOCK_SMS = process.env.USE_MOCK_SMS === "true";

/**
 * PLACEHOLDER buyer rates in PHP per kg. THESE ARE NOT REAL PRICES.
 * Replace with real buyer rates (from a processor or coop) before
 * showing these numbers to anyone as a real valuation.
 * Keys are the letter grades stored in batches.grade.
 */
export const RATES_PHP_PER_KG: Record<string, number> = {
  A: 120,
  B: 90,
  C: 40,
};

/** What each grade means to a farmer, in plain words. */
const GRADE_TEXT: Record<string, { label: string; outcome: string }> = {
  A: { label: "Seed", outcome: "Top quality, kept as planting stock." },
  B: { label: "Industrial", outcome: "Sold to processors." },
  C: { label: "Below standard", outcome: "Ask your coop agent to rescan." },
};

const SMS_MAX = 160; // one GSM-7 text. Avoid non-GSM characters (like the peso sign)

const money = (n: number) => Math.round(n).toLocaleString("en-US");

/** "Juan Dela Cruz" -> "Juan"; "Ma. Cristina Santos" -> "Ma. Cristina" */
function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[0].endsWith(".") && parts[1]
    ? `${parts[0]} ${parts[1]}`
    : parts[0];
}

export function buildGradeMessage(farmerName: string, batch: any): string {
  const grade = String(batch.grade);
  const info = GRADE_TEXT[grade];
  const rate = RATES_PHP_PER_KG[grade];
  const kg = Number(batch.volume_kg);
  const score = Number(batch.anthocyanin_score ?? 0).toFixed(1);

  // Unknown grade: fall back to the original plain wording
  if (!info || rate === undefined) {
    return `Hi ${farmerName}, your ube batch graded ${grade} (score ${score}). Est. value based on current buyer rates.`;
  }

  const body = (name: string) =>
    `Hi ${name}, your ube batch is Grade ${grade} (${info.label}): ${kg}kg scored ${score}/100. ` +
    `${info.outcome} Est. PHP ${money(kg * rate)} (PHP ${rate}/kg).`;

  let msg = body(farmerName);
  if (msg.length > SMS_MAX) msg = body(shortName(farmerName)); // long name: shorten it
  return msg;
}

export async function sendGradeSms(farmerId: string, batch: any) {
  const { data: farmer } = await supabaseAdmin
    .from("farmers")
    .select("phone_number, name")
    .eq("id", farmerId)
    .single();

  if (!farmer) return { message: null, delivered: false };

  const message = buildGradeMessage(farmer.name, batch);

  if (USE_MOCK_SMS) {
    console.log(`[MOCK SMS] To: ${farmer.phone_number} - ${message}`);
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
