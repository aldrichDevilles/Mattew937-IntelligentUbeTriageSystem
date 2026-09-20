import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../db/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("batches")
    .select("*, farmers(name, phone_number)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ batches: data });
}
