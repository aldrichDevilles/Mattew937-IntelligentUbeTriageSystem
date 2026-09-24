import { supabaseAdmin } from "../db/supabase";

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

function nameWithLocation(name: string, location?: string | null): string {
  return location ? `${name} (${location})` : name;
}

export function buildGradeMessage(
  farmerName: string,
  location: string | null | undefined,
  batch: any,
): string {
  const grade = String(batch.grade);
  const info = GRADE_TEXT[grade];
  const rate = RATES_PHP_PER_KG[grade];
  const kg = Number(batch.volume_kg);
  const score = Number(batch.anthocyanin_score ?? 0).toFixed(1);

  const displayName = nameWithLocation(farmerName, location);

  if (!info || rate === undefined) {
    return `Hi ${displayName}, your ube batch graded ${grade} (score ${score}). Est. value based on current buyer rates.`;
  }

  const body = (name: string) =>
    `Hi ${name}, your ube batch is Grade ${grade} (${info.label}): ${kg}kg scored ${score}/100. ` +
    `${info.outcome} Est. PHP ${money(kg * rate)} (PHP ${rate}/kg).`;

  let msg = body(displayName);
  if (msg.length > SMS_MAX) {
    // First fallback: shorten name, keep location
    msg = body(nameWithLocation(shortName(farmerName), location));
  }
  if (msg.length > SMS_MAX) {
    // Still too long: drop location entirely to fit the SMS limit
    msg = body(shortName(farmerName));
  }
  return msg;
}
export async function sendGradeSms(farmerId: string, batch: any) {
  const { data: farmer } = await supabaseAdmin
    .from("farmers")
    .select("phone_number, name, location")
    .eq("id", farmerId)
    .single();

  if (!farmer) return { message: null, delivered: false };

  const message = buildGradeMessage(farmer.name, farmer.location, batch);

  // Evaluate inside function to pick up env updates dynamically
  if (process.env.USE_MOCK_SMS === "true") {
    console.log(`[MOCK SMS] To: ${farmer.phone_number} - ${message}`);
    await supabaseAdmin
      .from("batches")
      .update({ status: "sms_sent" })
      .eq("id", batch.id);
    return { message, delivered: true, mocked: true };
  }

  const apiKey = process.env.SMSMOBILEAPI_KEY;
  if (!apiKey) {
    console.error("SMSMOBILEAPI_KEY is missing in .env.local");
    return { message, delivered: false, error: "Missing API Key" };
  }

  // Ensure recipient phone number removes spaces or hyphens
  const recipient = farmer.phone_number?.replace(/[\s-]/g, "") || "";

  const params = new URLSearchParams({
    apikey: apiKey,
    recipients: recipient,
    message: message,
  });

  // Explicit AbortController timeout to prevent undici connect timeouts
  // Allow up to 25 seconds for the SMS gateway to respond during queue backups
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);
  try {
    const res = await fetch("https://api.smsmobileapi.com/sendsms/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        // Bypasses Cloudflare block dropping default Node fetch requests
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "*/*",
      },
      body: params.toString(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await res.json();
    const delivered = res.ok && data?.result?.error === 0;

    if (delivered) {
      await supabaseAdmin
        .from("batches")
        .update({ status: "sms_sent" })
        .eq("id", batch.id);
    } else {
      console.error(
        "SMSMobileAPI returned failure response:",
        JSON.stringify(data),
      );
    }

    return { message, delivered, mocked: false, apiResponse: data };
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error("SMS Fetch Failed / Timed out:", err?.message || err);
    return {
      message,
      delivered: false,
      error: err?.message || "Network Error",
    };
  }
}
