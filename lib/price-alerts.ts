// ---------------------------------------------------------------------------
// Price Alerts — create + check/send
// ---------------------------------------------------------------------------

import { createClient } from "@supabase/supabase-js";
import { sendPriceAlert } from "@/lib/email";
import { wrapAffiliateUrl } from "@/lib/affiliate";

// Admin client (service role) for writes — falls back to anon for dev
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase env configuration");
  }

  return createClient(supabaseUrl, supabaseKey);
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Create a new price alert.
 *
 * @param email - User email
 * @param productId - Product UUID
 * @param targetPricePence - Target price in pence
 */
export async function createPriceAlert(
  email: string,
  productId: string,
  targetPricePence: number,
): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();

  const { error } = await supabaseAdmin.from("price_alerts").insert({
    email,
    product_id: productId,
    target_price_pence: targetPricePence,
    is_active: true,
  });

  if (error) {
    throw new Error(`Failed to create price alert: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Check & Send
// ---------------------------------------------------------------------------

interface AlertRow {
  id: string;
  email: string;
  target_price_pence: number;
  product_id: string;
  products: {
    id: string;
    name: string;
    slug: string;
    listings: {
      price_pence: number;
      source_url: string;
      source: string;
    }[];
  };
}

/**
 * Find active alerts where the current best price is at or below the
 * target price, send notification emails, and update last_notified_at.
 */
export async function checkAndSendAlerts(): Promise<{ sent: number }> {
  const supabaseAdmin = getSupabaseAdmin();

  // Fetch active alerts with product + listings
  const { data: alerts, error } = await supabaseAdmin
    .from("price_alerts")
    .select(
      `id, email, target_price_pence, product_id,
       products ( id, name, slug, listings ( price_pence, source_url, source ) )`,
    )
    .eq("is_active", true)
    .or("last_notified_at.is.null,last_notified_at.lt." + new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  if (error || !alerts) {
    console.error("Failed to fetch alerts:", error?.message);
    return { sent: 0 };
  }

  let sent = 0;

  for (const rawAlert of alerts) {
    const alert = rawAlert as unknown as AlertRow;
    if (!alert.products?.listings?.length) continue;

    // Find best price
    const bestListing = alert.products.listings.reduce((best, l) =>
      l.price_pence < best.price_pence ? l : best,
    );

    if (bestListing.price_pence > alert.target_price_pence) continue;

    // Build affiliate deal URL
    const dealUrl = wrapAffiliateUrl(bestListing.source_url, "price-alert");

    try {
      await sendPriceAlert(
        alert.email,
        alert.products.name,
        bestListing.price_pence,
        alert.target_price_pence,
        dealUrl,
      );

      // Update last_notified_at
      await supabaseAdmin
        .from("price_alerts")
        .update({ last_notified_at: new Date().toISOString() })
        .eq("id", alert.id);

      sent++;
    } catch (err) {
      console.error(`Failed to send alert ${alert.id}:`, err);
    }
  }

  return { sent };
}
