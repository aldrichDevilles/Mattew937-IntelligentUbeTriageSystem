import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../db/supabase";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("farmers")
      .select("id, name")
      .order("name");

    if (error) {
      console.error("Supabase Query Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ farmers: data });
  } catch (err: any) {
    console.error("Unhandled API Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
