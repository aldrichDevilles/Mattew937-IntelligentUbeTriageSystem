import { supabaseAdmin } from "./supabase";

async function seed() {
  // Clear existing data first so re-running this script never creates duplicates
  await supabaseAdmin
    .from("batches")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  await supabaseAdmin
    .from("farmers")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  const { data: farmers, error: farmerError } = await supabaseAdmin
    .from("farmers")
    .insert([
      {
        name: "Juan Dela Cruz",
        phone_number: "+639989984989",
        location: "Lucena City",
      },
      {
        name: "Maria Santos",
        phone_number: "+639995789711",
        location: "Tayabas",
      },
      {
        name: "Pedro Reyes",
        phone_number: "+639191234567",
        location: "Candelaria",
      },
      {
        name: "Ana Bautista",
        phone_number: "+639201234567",
        location: "Sariaya",
      },
      {
        name: "Carlos Mendoza",
        phone_number: "+639211234567",
        location: "Lucban",
      },
    ])
    .select();

  if (farmerError) {
    console.error("Farmer insert failed:", farmerError);
    return;
  }
  if (!farmers) {
    console.error("Farmer insert returned no data");
    return;
  }

  const { error: batchError } = await supabaseAdmin.from("batches").insert([
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

  if (batchError) {
    console.error("Batch insert failed:", batchError);
    return;
  }

  console.log("Seeded cleanly.");
}

seed();
