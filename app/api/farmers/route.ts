import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../db/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("farmers")
    .select("id, name")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ farmers: data });
}
