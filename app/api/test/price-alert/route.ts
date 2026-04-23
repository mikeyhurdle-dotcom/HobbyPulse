// ---------------------------------------------------------------------------
// Test endpoint: Price Alert flow — /api/test/price-alert
// ---------------------------------------------------------------------------
// Exercises the price alert creation flow: find a product → create alert.
// Protected by CRON_SECRET. Does NOT send real emails.
//
// Usage: GET /api/test/price-alert?product=<search term>
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSiteVertical } from "@/lib/site";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key",
);

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const searchTerm = url.searchParams.get("product") || "Combat Patrol";
  const config = getSiteVertical();

  // Step 1: Find the vertical ID
  const { data: verticalRow } = await supabase
    .from("verticals")
    .select("id")
    .eq("slug", config.slug)
    .single();

  if (!verticalRow) {
    return NextResponse.json({ test: "price-alert", status: "FAIL", error: "Vertical not found" });
  }

  // Step 2: Find a product matching the search term
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug")
    .eq("vertical_id", verticalRow.id)
    .ilike("name", `%${searchTerm}%`)
    .limit(1);

  if (!products || products.length === 0) {
    return NextResponse.json({
      test: "price-alert",
      status: "FAIL",
      error: `No product found matching "${searchTerm}"`,
    });
  }

  const product = products[0];

  // Step 3: Get best listing price for this product
  const { data: listings } = await supabase
    .from("listings")
    .select("price_pence, source, source_url, condition, in_stock")
    .eq("product_id", product.id)
    .order("price_pence", { ascending: true })
    .limit(5);

  const bestListing = listings?.[0] ?? null;

  // Step 4: Create a test alert (with test email, will be cleaned up)
  const testEmail = "test@hobbypulse.test";
  const targetPrice = bestListing
    ? Math.round(bestListing.price_pence * 0.9)
    : 5000;

  const { error: alertError } = await supabase
    .from("price_alerts")
    .insert({
      email: testEmail,
      product_id: product.id,
      target_price_pence: targetPrice,
      is_active: false, // Inactive so it never sends
    });

  // Step 5: Clean up test alert
  await supabase
    .from("price_alerts")
    .delete()
    .eq("email", testEmail)
    .eq("product_id", product.id);

  const checks = {
    productFound: true,
    productName: product.name,
    productSlug: product.slug,
    listingCount: listings?.length ?? 0,
    bestPrice: bestListing?.price_pence ?? null,
    bestSource: bestListing?.source ?? null,
    bestCondition: bestListing?.condition ?? null,
    inStock: bestListing?.in_stock ?? null,
    alertCreated: !alertError,
    alertCleaned: true,
    targetPrice,
  };

  return NextResponse.json({
    test: "price-alert",
    status: checks.productFound && checks.listingCount > 0 && checks.alertCreated ? "PASS" : "FAIL",
    checks,
  });
}
