import { createClient } from '@supabase/supabase-js';

const url = 'https://jfrliyluipjnffjrztfv.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmcmxpeWx1aXBqbmZmanJ6dGZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NTg1NzIsImV4cCI6MjA5ODUzNDU3Mn0.7_-Pyzw4g3iV3qO0_mCTfJmx6trxL5Z-wybyRZCt4lM';

const supabase = createClient(url, key);

async function test() {
  const { data: products, error: pErr } = await supabase
    .from("products")
    .select("name, created_at, status, scheduled_for, show_pre_launch, deleted_at")
    .is("deleted_at", null)
    .neq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(10);
  
  console.log("Products:", products?.length, pErr);
  if (products && products.length > 0) {
    console.log("Sample product status:", products[0].status);
  }

  const { data: profiles, error: prErr } = await supabase
    .from("profiles")
    .select("username, created_at")
    .not("username", "is", null)
    .limit(10);
  
  console.log("Profiles:", profiles?.length, prErr);
}

test();
