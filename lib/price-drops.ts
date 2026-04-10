// ---------------------------------------------------------------------------
// Price drop detection
// ---------------------------------------------------------------------------
// Shared helper for computing recent price drops from the price_history table.
// Used by:
//   - /deals listing page (drop badge on cards)
//   - /trending page (top drops this week, SEO surface)
//
// Drops are computed by comparing each listing's earliest price in the
// lookback window to its latest price. A drop is reported when:
//   - the price actually went down (not just noise), AND
//   - the drop is ≥ MIN_DROP_PERCENT
// ---------------------------------------------------------------------------

import { supabase } from "@/lib/supabase";

export const DEFAULT_LOOKBACK_DAYS = 7;
export const MIN_DROP_PERCENT = 10;

export interface PriceDropInfo {
  listingId: string;
  productId: string | null;
  oldPrice: number;
  newPrice: number;
  dropPercent: number;
  recordedAt: string;
}

/**
 * Compute price drops for an explicit set of listing IDs.
 * Returns a Map keyed by listingId so callers can look up drops inline.
 * Caller owns the product/listing fetch; this only touches price_history.
 */
export async function getPriceDropsForListings(
  listingIds: string[],
  lookbackDays = DEFAULT_LOOKBACK_DAYS,
): Promise<Map<string, PriceDropInfo>> {
  const drops = new Map<string, PriceDropInfo>();
  if (listingIds.length === 0) return drops;

  const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

  // Chunk to stay under PostgREST URL length limits.
  const CHUNK = 100;
  const rows: {
    listing_id: string;
    price_pence: number;
    recorded_at: string;
  }[] = [];

  for (let i = 0; i < listingIds.length; i += CHUNK) {
    const chunk = listingIds.slice(i, i + CHUNK);
    const { data } = await supabase
      .from("price_history")
      .select("listing_id, price_pence, recorded_at")
      .in("listing_id", chunk)
      .gte("recorded_at", since)
      .order("recorded_at", { ascending: true });
    if (data) rows.push(...(data as typeof rows));
  }

  // Bucket by listing_id to find first & last price per listing.
  const buckets = new Map<
    string,
    { first: { price: number; at: string }; last: { price: number; at: string } }
  >();
  for (const row of rows) {
    const existing = buckets.get(row.listing_id);
    if (!existing) {
      buckets.set(row.listing_id, {
        first: { price: row.price_pence, at: row.recorded_at },
        last: { price: row.price_pence, at: row.recorded_at },
      });
      continue;
    }
    // Rows are ordered oldest first, so keep updating `last`.
    existing.last = { price: row.price_pence, at: row.recorded_at };
  }

  for (const [listingId, { first, last }] of buckets) {
    if (last.price >= first.price) continue;
    const dropPercent = Math.round(((first.price - last.price) / first.price) * 100);
    if (dropPercent < MIN_DROP_PERCENT) continue;
    drops.set(listingId, {
      listingId,
      productId: null,
      oldPrice: first.price,
      newPrice: last.price,
      dropPercent,
      recordedAt: last.at,
    });
  }

  return drops;
}

export interface ProductDrop {
  productId: string;
  productName: string;
  productSlug: string;
  productImageUrl: string | null;
  source: string;
  oldPrice: number;
  newPrice: number;
  dropPercent: number;
  affiliateUrl: string | null;
  sourceUrl: string;
}

/**
 * Top price drops across an entire vertical in the lookback window.
 * Deduped by product (keeps the biggest drop per product) and sorted
 * by drop % descending. Used by the /trending page.
 */
export async function getTopPriceDropsForVertical(
  verticalId: string,
  limit = 24,
  lookbackDays = DEFAULT_LOOKBACK_DAYS,
): Promise<ProductDrop[]> {
  // 1. Fetch all listings for this vertical along with the product info we
  //    need for rendering. We filter at the product level via an inner join.
  const { data: rawListings } = await supabase
    .from("listings")
    .select(
      `id, source, price_pence, affiliate_url, source_url,
       products!inner ( id, name, slug, image_url, vertical_id )`,
    )
    .eq("products.vertical_id", verticalId)
    .limit(5000);

  type ListingRow = {
    id: string;
    source: string;
    price_pence: number;
    affiliate_url: string | null;
    source_url: string;
    products: {
      id: string;
      name: string;
      slug: string;
      image_url: string | null;
    } | null;
  };

  const listings = (rawListings ?? []) as unknown as ListingRow[];
  if (listings.length === 0) return [];

  const listingMap = new Map<string, ListingRow>();
  for (const l of listings) listingMap.set(l.id, l);

  // 2. Compute drops for every listing in the vertical.
  const drops = await getPriceDropsForListings(
    listings.map((l) => l.id),
    lookbackDays,
  );

  // 3. Join drops back to products, dedupe per product (biggest drop wins).
  const byProduct = new Map<string, ProductDrop>();
  for (const drop of drops.values()) {
    const listing = listingMap.get(drop.listingId);
    if (!listing || !listing.products) continue;
    const existing = byProduct.get(listing.products.id);
    if (existing && existing.dropPercent >= drop.dropPercent) continue;
    byProduct.set(listing.products.id, {
      productId: listing.products.id,
      productName: listing.products.name,
      productSlug: listing.products.slug,
      productImageUrl: listing.products.image_url,
      source: listing.source,
      oldPrice: drop.oldPrice,
      newPrice: drop.newPrice,
      dropPercent: drop.dropPercent,
      affiliateUrl: listing.affiliate_url,
      sourceUrl: listing.source_url,
    });
  }

  return [...byProduct.values()]
    .sort((a, b) => b.dropPercent - a.dropPercent)
    .slice(0, limit);
}
