import { supabaseAdmin } from "./supabase";

async function seed() {
  const { data: farmers } = await supabaseAdmin
    .from("farmers")
    .insert([
      { name: "Juan Dela Cruz", phone_number: "+639XXXXXXXXX" },
      { name: "Maria Santos", phone_number: "+639XXXXXXXXX" },
    ])
    .select();

  await supabaseAdmin.from("batches").insert([
    {
      farmer_id: farmers![0].id,
      volume_kg: 50,
      anthocyanin_score: 88,
      grade: "A",
      status: "graded",
    },
    {
      farmer_id: farmers![1].id,
      volume_kg: 30,
      anthocyanin_score: 61,
      grade: "B",
      status: "graded",
    },
  ]);

  console.log("Seeded.");
}

seed();
