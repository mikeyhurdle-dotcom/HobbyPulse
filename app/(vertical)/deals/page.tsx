import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { ProductImage } from "@/components/product-image";
import { AdBetweenContent } from "@/components/ad-slot";
import { supabase } from "@/lib/supabase";
import { getSiteVertical, getSiteBrand } from "@/lib/site";
import { getSavings } from "@/lib/gw-rrp";
import { getPriceDropsForListings } from "@/lib/price-drops";
import { PriceDropBadge } from "@/components/price-drop-badge";
import { TrendingDown } from "lucide-react";

export function generateMetadata(): Metadata {
  const brand = getSiteBrand();
  const config = getSiteVertical();
  const title = "Deals & Price Comparison";
  const url = `https://${brand.domain}/deals`;
  return {
    title,
    description: config.dealsDescription,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | ${brand.siteName}`,
      description: config.dealsDescription,
      url,
      siteName: brand.siteName,
      type: "website",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${brand.siteName}`,
      description: config.dealsDescription,
      images: ["/opengraph-image"],
    },
  };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Listing {
  id: string;
  source: string;
  price_pence: number;
  currency: string;
  condition: string;
  in_stock: boolean;
  affiliate_url: string | null;
  source_url: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  rrp_pence: number | null;
  listings: Listing[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(pence: number): string {
  return `\u00A3${(pence / 100).toFixed(2)}`;
}

function conditionLabel(c: string): string {
  const map: Record<string, string> = {
    new: "New",
    used: "Used",
    nos: "NOS",
    painted: "Painted",
    recasted: "Recast",
  };
  return map[c] ?? c;
}

function conditionColour(c: string): string {
  const map: Record<string, string> = {
    new: "var(--success)",
    nos: "#3b82f6",
    used: "var(--muted)",
    painted: "#f59e0b",
    recasted: "var(--danger)",
  };
  return map[c] ?? "var(--muted)";
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    condition?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const { q, condition, sort, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const PAGE_SIZE = 48;
  const config = getSiteVertical();

  // Get vertical ID
  const { data: verticalRow } = await supabase
    .from("verticals")
    .select("id")
    .eq("slug", config.slug)
    .single();

  const verticalId = verticalRow?.id;

  // Build query — fetch products with their listings
  let query = supabase
    .from("products")
    .select(
      `id, name, slug, image_url, rrp_pence,
       listings ( id, source, price_pence, currency, condition, in_stock, affiliate_url, source_url )`,
    )
    .eq("vertical_id", verticalId ?? "");

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  query = query.limit(500);

  const { data: rawProducts } = await query;
  let products = (rawProducts ?? []) as unknown as Product[];

  // Filter by condition if specified
  if (condition && condition !== "all") {
    products = products
      .map((p) => ({
        ...p,
        listings: p.listings.filter((l) => l.condition === condition),
      }))
      .filter((p) => p.listings.length > 0);
  }

  // Fetch recent price drops for all listings currently visible on this page.
  // One chunked query reused across every card.
  const allListingIds = products.flatMap((p) => p.listings.map((l) => l.id));
  const dropsByListing = await getPriceDropsForListings(allListingIds);

  // Top categories for the chip row — only show ones that actually have listings.
  const { data: catRows } = await supabase
    .from("categories")
    .select("slug, name, products!inner(id)")
    .eq("vertical_id", verticalId ?? "")
    .limit(200);

  type CatRow = { slug: string; name: string; products: { id: string }[] };
  const topCategories = ((catRows ?? []) as unknown as CatRow[])
    .map((c) => ({ slug: c.slug, name: c.name, count: c.products?.length ?? 0 }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  // Calculate best price, savings, and best drop for each product
  const enriched = products.map((product) => {
    const bestListing = product.listings.reduce<Listing | null>((best, l) => {
      if (!best || l.price_pence < best.price_pence) return l;
      return best;
    }, null);

    const bestPrice = bestListing?.price_pence ?? 0;
    const savings = getSavings(bestPrice, product.name);
    const rrp = product.rrp_pence ?? savings?.rrp ?? null;

    // Biggest drop across any of this product's listings in the last 7 days
    let bestDropPercent = 0;
    for (const l of product.listings) {
      const d = dropsByListing.get(l.id);
      if (d && d.dropPercent > bestDropPercent) bestDropPercent = d.dropPercent;
    }

    return {
      ...product,
      bestPrice,
      rrp,
      savingsPercent: savings?.percent ?? null,
      sourceCount: new Set(product.listings.map((l) => l.source)).size,
      bestDropPercent,
    };
  });

  // Sort
  const allSorted = [...enriched].sort((a, b) => {
    switch (sort) {
      case "price-asc":
        return a.bestPrice - b.bestPrice;
      case "price-desc":
        return b.bestPrice - a.bestPrice;
      case "savings":
        return (b.savingsPercent ?? 0) - (a.savingsPercent ?? 0);
      case "newest":
      default:
        return 0;
    }
  });

  const totalProducts = allSorted.length;
  const totalPages = Math.ceil(totalProducts / PAGE_SIZE);
  const sorted = allSorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <>
      <Nav active="deals" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Deals</h1>
            <p className="text-[var(--muted)]">
              {config.dealsDescription}
            </p>
          </div>
          <Link
            href="/trending"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-[var(--danger)] hover:underline whitespace-nowrap mt-1"
          >
            <TrendingDown className="w-4 h-4" />
            Top drops this week
          </Link>
        </div>

        {/* Category chip row — each chip is an SEO-indexable landing page */}
        {topCategories.length > 0 && (
          <nav className="mb-6" aria-label="Browse by category">
            <div className="flex flex-wrap gap-2">
              {topCategories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/deals/c/${c.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-[var(--vertical-accent)]/50 hover:text-[var(--vertical-accent-light)] transition-all"
                >
                  {c.name}
                  <span className="text-muted-foreground">{c.count}</span>
                </Link>
              ))}
            </div>
          </nav>
        )}

        {/* Filter bar */}
        <form className="flex flex-wrap gap-3 mb-8">
          {/* Search */}
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search products..."
            className="flex-1 min-w-[200px] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--vertical-accent)] focus:border-transparent"
          />

          {/* Condition */}
          <select
            name="condition"
            defaultValue={condition ?? "all"}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--vertical-accent)]"
          >
            <option value="all">All Conditions</option>
            <option value="new">New</option>
            <option value="used">Used</option>
            <option value="nos">New on Sprue</option>
            <option value="painted">Painted</option>
          </select>

          {/* Sort */}
          <select
            name="sort"
            defaultValue={sort ?? "newest"}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--vertical-accent)]"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="savings">Best Savings</option>
          </select>

          <button
            type="submit"
            className="rounded-lg bg-[var(--vertical-accent)] px-5 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            Filter
          </button>
        </form>

        {/* Ad slot */}
        <AdBetweenContent className="mb-8" />

        {/* Product grid */}
        {sorted.length === 0 ? (
          q ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No deals match your search.</p>
              <p className="text-muted-foreground text-sm mt-1">
                Try a different search term.
              </p>
            </div>
          ) : null
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sorted.map((product) => (
              <Link
                key={product.id}
                href={`/deals/${product.slug}`}
                className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:border-[var(--border-light)] hover:bg-[var(--surface-hover)] transition-all"
              >
                {/* Product image */}
                <div className="relative aspect-square bg-[var(--surface-hover)]">
                  {product.image_url ? (
                    <ProductImage
                      src={product.image_url}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-contain p-2"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--muted)] text-sm">
                      No image
                    </div>
                  )}

                  {/* Price-drop badge — priority, surfaces real recent drops */}
                  {product.bestDropPercent > 0 && (
                    <span className="absolute top-2 left-2">
                      <PriceDropBadge dropPercent={product.bestDropPercent} />
                    </span>
                  )}

                  {/* RRP savings badge */}
                  {product.savingsPercent !== null &&
                    product.savingsPercent > 0 && (
                      <span className="absolute top-2 right-2 bg-[var(--success)] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        -{product.savingsPercent}%
                      </span>
                    )}
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-[var(--vertical-accent-light)] transition-colors">
                    {product.name}
                  </h3>

                  {/* Price */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-[var(--success)]">
                      {formatPrice(product.bestPrice)}
                    </span>
                    {product.rrp && product.rrp > product.bestPrice && (
                      <span className="text-xs text-[var(--muted)] line-through">
                        {formatPrice(product.rrp)}
                      </span>
                    )}
                  </div>

                  {/* Source badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(
                      new Set(product.listings.map((l) => l.source)),
                    ).map((source) => (
                      <span
                        key={source}
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border border-[var(--border-light)] text-[var(--muted)]"
                      >
                        {source}
                      </span>
                    ))}
                  </div>

                  {/* Condition badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(
                      new Set(product.listings.map((l) => l.condition)),
                    ).map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border"
                        style={{
                          borderColor: conditionColour(c),
                          color: conditionColour(c),
                        }}
                      >
                        {conditionLabel(c)}
                      </span>
                    ))}
                  </div>

                  {/* Listing count */}
                  <p className="text-[10px] text-[var(--muted)]">
                    {product.listings.length} listing
                    {product.listings.length !== 1 ? "s" : ""} from{" "}
                    {product.sourceCount} source
                    {product.sourceCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>

        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            {currentPage > 1 && (
              <Link
                href={`/deals?${new URLSearchParams({
                  ...(q ? { q } : {}),
                  ...(condition ? { condition } : {}),
                  ...(sort ? { sort } : {}),
                  page: String(currentPage - 1),
                }).toString()}`}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
              >
                Previous
              </Link>
            )}
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} ({totalProducts} products)
            </span>
            {currentPage < totalPages && (
              <Link
                href={`/deals?${new URLSearchParams({
                  ...(q ? { q } : {}),
                  ...(condition ? { condition } : {}),
                  ...(sort ? { sort } : {}),
                  page: String(currentPage + 1),
                }).toString()}`}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </main>
    </>
  );
}
