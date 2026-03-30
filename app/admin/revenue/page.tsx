// ---------------------------------------------------------------------------
// Admin: Revenue Dashboard — /admin/revenue
// ---------------------------------------------------------------------------
// Simple analytics page showing affiliate link stats grouped by source.
// No auth required for now.
// ---------------------------------------------------------------------------

import { supabase } from "@/lib/supabase";
import { getSiteVertical } from "@/lib/site";
import { wrapAffiliateUrl } from "@/lib/affiliate";

interface ListingRow {
  id: string;
  source: string;
  source_url: string;
  affiliate_url: string | null;
  price_pence: number;
  product_id: string;
}

interface SourceStats {
  source: string;
  totalListings: number;
  totalProducts: number;
  sampleAffiliateUrl: string | null;
  estimatedClicks: string;
}

export default async function RevenuePage() {
  const config = getSiteVertical();

  // Get vertical ID
  const { data: verticalRow } = await supabase
    .from("verticals")
    .select("id")
    .eq("slug", config.slug)
    .single();

  const verticalId = verticalRow?.id;

  // Fetch all listings for this vertical (via products join)
  const { data: products } = await supabase
    .from("products")
    .select("id, listings ( id, source, source_url, affiliate_url, price_pence, product_id )")
    .eq("vertical_id", verticalId ?? "");

  // Flatten listings
  const allListings: ListingRow[] = [];
  for (const product of (products ?? []) as unknown as {
    id: string;
    listings: ListingRow[];
  }[]) {
    for (const listing of product.listings ?? []) {
      allListings.push(listing);
    }
  }

  // Group by source
  const sourceMap = new Map<string, { listings: ListingRow[]; productIds: Set<string> }>();
  for (const listing of allListings) {
    if (!sourceMap.has(listing.source)) {
      sourceMap.set(listing.source, { listings: [], productIds: new Set() });
    }
    const group = sourceMap.get(listing.source)!;
    group.listings.push(listing);
    group.productIds.add(listing.product_id);
  }

  const stats: SourceStats[] = [...sourceMap.entries()].map(([source, data]) => {
    // Wrap a sample URL with affiliate params
    const sampleUrl = data.listings[0]?.affiliate_url || data.listings[0]?.source_url;
    const sampleAffiliateUrl = sampleUrl
      ? wrapAffiliateUrl(sampleUrl, "admin-preview")
      : null;

    return {
      source,
      totalListings: data.listings.length,
      totalProducts: data.productIds.size,
      sampleAffiliateUrl,
      estimatedClicks: "--", // placeholder until real click tracking
    };
  });

  // Sort by listings count descending
  stats.sort((a, b) => b.totalListings - a.totalListings);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-2">
        Revenue Dashboard
      </h1>
      <p className="text-[var(--muted)] mb-8">
        Affiliate link stats for {config.brand.siteName}. Click tracking coming soon.
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
          <p className="text-2xl font-bold">{stats.length}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Sources</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
          <p className="text-2xl font-bold">{allListings.length}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Total Listings</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
          <p className="text-2xl font-bold">
            {new Set(allListings.map((l) => l.product_id)).size}
          </p>
          <p className="text-xs text-[var(--muted)] mt-1">Products</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
          <p className="text-2xl font-bold text-[var(--muted)]">--</p>
          <p className="text-xs text-[var(--muted)] mt-1">Est. Clicks</p>
        </div>
      </div>

      {/* Source breakdown table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1fr_100px_100px_100px_1fr] gap-4 px-4 py-3 border-b border-[var(--border)] text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
          <span>Source</span>
          <span>Products</span>
          <span>Listings</span>
          <span>Est. Clicks</span>
          <span>Sample Affiliate URL</span>
        </div>

        {stats.length === 0 ? (
          <div className="px-4 py-8 text-center text-[var(--muted)] text-sm">
            No listings found yet.
          </div>
        ) : (
          stats.map((stat) => (
            <div
              key={stat.source}
              className="grid grid-cols-1 sm:grid-cols-[1fr_100px_100px_100px_1fr] gap-2 sm:gap-4 px-4 py-3 items-center border-b border-[var(--border)] last:border-b-0"
            >
              <span className="font-medium text-sm">{stat.source}</span>
              <span className="text-sm">{stat.totalProducts}</span>
              <span className="text-sm">{stat.totalListings}</span>
              <span className="text-sm text-[var(--muted)]">
                {stat.estimatedClicks}
              </span>
              <span className="text-xs text-[var(--muted)] truncate">
                {stat.sampleAffiliateUrl ?? "No URL"}
              </span>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
