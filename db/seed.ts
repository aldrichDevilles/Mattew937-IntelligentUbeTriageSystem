import { supabaseAdmin } from "./supabase";

async function seed() {
  const { data: farmers } = await supabaseAdmin
    .from("farmers")
    .insert([
      { name: "Juan Dela Cruz", phone_number: "+639989984989" },
      { name: "Maria Santos", phone_number: "+639995789711" },
      { name: "Pedro Reyes", phone_number: "+639191234567" },
      { name: "Ana Bautista", phone_number: "+639201234567" },
      { name: "Carlos Mendoza", phone_number: "+639211234567" },
    ])
    .select();

  if (!farmers) {
    console.error("Farmer insert failed");
    return;
  }

  await supabaseAdmin.from("batches").insert([
    {
      farmer_id: farmers[0].id,
      volume_kg: 50,
      anthocyanin_score: 88,
      grade: "A",
      status: "graded",
    },
    {
      farmer_id: farmers[1].id,
      volume_kg: 30,
      anthocyanin_score: 61,
      grade: "B",
      status: "graded",
    },
    {
      farmer_id: farmers[2].id,
      volume_kg: 45,
      anthocyanin_score: 92,
      grade: "A",
      status: "graded",
    },
    {
      farmer_id: farmers[3].id,
      volume_kg: 25,
      anthocyanin_score: 55,
      grade: "B",
      status: "graded",
    },
    {
      farmer_id: farmers[4].id,
      volume_kg: 60,
      anthocyanin_score: 40,
      grade: "C",
      status: "graded",
    },
  ]);

  console.log("Seeded.");
}

seed();
