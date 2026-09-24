import { supabaseAdmin } from "./supabase";

async function seed() {
  // 1. Seed Farmers
  const { data: farmers, error: farmerError } = await supabaseAdmin
    .from("farmers")
    .insert([
      { name: "Juan Dela Cruz", phone_number: "+639989984989" },
      { name: "Maria Santos", phone_number: "+639995789711" },
      { name: "Pedro Reyes", phone_number: "+639191234567" },
      { name: "Ana Bautista", phone_number: "+639201234567" },
      { name: "Carlos Mendoza", phone_number: "+639211234567" },
    ])
    .select();

  if (farmerError || !farmers) {
    console.error("Farmer insert failed:", farmerError);
    return;
  }

  // 2. Seed Batches and capture the returned rows
  const { data: batches, error: batchError } = await supabaseAdmin
    .from("batches")
    .insert([
      { farmer_id: farmers[0].id, volume_kg: 50, anthocyanin_score: 88, grade: "A", status: "graded" },
      { farmer_id: farmers[1].id, volume_kg: 30, anthocyanin_score: 61, grade: "B", status: "graded" },
      { farmer_id: farmers[2].id, volume_kg: 45, anthocyanin_score: 92, grade: "A", status: "graded" },
      { farmer_id: farmers[3].id, volume_kg: 25, anthocyanin_score: 55, grade: "B", status: "graded" },
      { farmer_id: farmers[4].id, volume_kg: 60, anthocyanin_score: 40, grade: "C", status: "graded" },
    ])
    .select();

  if (batchError || !batches) {
    console.error("Batch insert failed:", batchError);
    return;
  }

  // 3. Seed Transactions using the generated batch IDs
  const { error: transactionError } = await supabaseAdmin
    .from("transactions")
    .insert([
      { batch_id: batches[0].id, buyer_name: "Premium Foods Corp", price_per_kg: 120.00 },
      { batch_id: batches[1].id, buyer_name: "Local Bakery", price_per_kg: 85.50 },
      { batch_id: batches[2].id, buyer_name: "Export Quality Inc", price_per_kg: 125.00 },
      { batch_id: batches[3].id, buyer_name: "Ube Halaya Makers", price_per_kg: 80.00 },
      { batch_id: batches[4].id, buyer_name: "Livestock Feed Co", price_per_kg: 35.00 },
    ]);

  if (transactionError) {
    console.error("Transaction insert failed:", transactionError);
    return;
  }

  console.log("Database successfully seeded.");
}

seed();