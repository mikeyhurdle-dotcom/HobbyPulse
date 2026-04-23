// ---------------------------------------------------------------------------
// Admin — Backfill RRP on existing products
// ---------------------------------------------------------------------------
// One-shot endpoint to populate rrp_pence on products that match the static
// RRP table in lib/gw-rrp.ts. Safe to re-run — only updates NULLs by default,
// or all products with ?force=true.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getGwRrp } from "@/lib/gw-rrp";

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Missing Supabase env configuration" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "true";

  // Fetch products — only NULLs unless forced
  let query = supabase.from("products").select("id, name, rrp_pence");
  if (!force) {
    query = query.is("rrp_pence", null);
  }

  const { data: products, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let matched = 0;
  let skipped = 0;
  const updates: { name: string; rrpPence: number }[] = [];

  for (const product of products ?? []) {
    const rrp = getGwRrp(product.name);
    if (rrp === null) {
      skipped++;
      continue;
    }

    const { error: updateError } = await supabase
      .from("products")
      .update({ rrp_pence: rrp })
      .eq("id", product.id);

    if (!updateError) {
      matched++;
      updates.push({ name: product.name, rrpPence: rrp });
    }
  }

  return NextResponse.json({
    ok: true,
    total: (products ?? []).length,
    matched,
    skipped,
    updates,
  });
}
