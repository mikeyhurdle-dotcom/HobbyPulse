import Link from "next/link";
import { Nav } from "@/components/nav";
import { supabase } from "@/lib/supabase";
import { getSiteVertical } from "@/lib/site";
import { getSavings } from "@/lib/gw-rrp";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Listing {
  id: string;
  source: string;
  source_url: string;
  price_pence: number;
  currency: string;
  condition: string;
  in_stock: boolean;
  affiliate_url: string | null;
  last_scraped_at: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  rrp_pence: number | null;
  manufacturer: string | null;
  listings: Listing[];
}

interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
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

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Unknown";
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ productSlug: string }>;
}) {
  const { productSlug } = await params;
  const config = getSiteVertical();

  // Get vertical ID
  const { data: verticalRow } = await supabase
    .from("verticals")
    .select("id")
    .eq("slug", config.slug)
    .single();

  const verticalId = verticalRow?.id;

  // Fetch product with listings
  const { data: rawProduct } = await supabase
    .from("products")
    .select(
      `id, name, slug, image_url, rrp_pence, manufacturer,
       listings ( id, source, source_url, price_pence, currency, condition, in_stock, affiliate_url, last_scraped_at )`,
    )
    .eq("vertical_id", verticalId ?? "")
    .eq("slug", productSlug)
    .single();

  const product = rawProduct as unknown as Product | null;

  if (!product) {
    return (
      <>
        <Nav active="deals" />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="text-center py-16">
            <p className="text-[var(--muted)] text-lg">Product not found.</p>
            <Link
              href="/deals"
              className="text-[var(--vertical-accent)] text-sm mt-2 inline-block hover:underline"
            >
              Back to deals
            </Link>
          </div>
        </main>
      </>
    );
  }

  // Sort listings by price ascending
  const sortedListings = [...product.listings].sort(
    (a, b) => a.price_pence - b.price_pence,
  );

  const bestPrice = sortedListings[0]?.price_pence ?? 0;
  const savings = getSavings(bestPrice, product.name);
  const rrp = product.rrp_pence ?? savings?.rrp ?? null;

  // Fetch related products (same vertical, excluding current)
  const { data: rawRelated } = await supabase
    .from("products")
    .select("id, name, slug, image_url")
    .eq("vertical_id", verticalId ?? "")
    .neq("slug", productSlug)
    .limit(4);

  const relatedProducts = (rawRelated ?? []) as unknown as RelatedProduct[];

  return (
    <>
      <Nav active="deals" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[var(--muted)] mb-6">
          <Link
            href="/deals"
            className="hover:text-[var(--foreground)] transition-colors"
          >
            Deals
          </Link>
          <span>/</span>
          <span className="text-[var(--foreground)]">{product.name}</span>
        </nav>

        {/* Product header */}
        <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] gap-8 mb-12">
          {/* Image */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 aspect-square flex items-center justify-center">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-[var(--muted)]">No image available</span>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            {product.manufacturer && (
              <span className="text-xs uppercase tracking-wider text-[var(--muted)]">
                {product.manufacturer}
              </span>
            )}
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-[var(--success)]">
                {formatPrice(bestPrice)}
              </span>
              {rrp && rrp > bestPrice && (
                <>
                  <span className="text-lg text-[var(--muted)] line-through">
                    RRP {formatPrice(rrp)}
                  </span>
                  {savings && savings.percent > 0 && (
                    <span className="inline-flex items-center rounded-full bg-[var(--success)]/10 text-[var(--success)] px-3 py-1 text-sm font-bold">
                      Save {savings.percent}%
                    </span>
                  )}
                </>
              )}
            </div>

            <p className="text-sm text-[var(--muted)]">
              {sortedListings.length} listing{sortedListings.length !== 1 ? "s" : ""} from{" "}
              {new Set(sortedListings.map((l) => l.source)).size} source
              {new Set(sortedListings.map((l) => l.source)).size !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Price comparison table */}
        <section className="mb-12">
          <h2 className="text-xl font-bold tracking-tight mb-4">
            Price Comparison
          </h2>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[1fr_100px_100px_100px_80px_120px] gap-4 px-4 py-3 border-b border-[var(--border)] text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
              <span>Source</span>
              <span>Price</span>
              <span>Condition</span>
              <span>Savings</span>
              <span>Stock</span>
              <span></span>
            </div>

            {/* Rows */}
            {sortedListings.map((listing, i) => {
              const listingSavings = rrp
                ? { saving: rrp - listing.price_pence, percent: Math.round(((rrp - listing.price_pence) / rrp) * 100) }
                : null;
              const isBest = i === 0;
              const buyUrl = listing.affiliate_url || listing.source_url;

              return (
                <div
                  key={listing.id}
                  className={`grid grid-cols-1 sm:grid-cols-[1fr_100px_100px_100px_80px_120px] gap-2 sm:gap-4 px-4 py-3 items-center border-b border-[var(--border)] last:border-b-0 ${
                    isBest ? "bg-[var(--success)]/5" : ""
                  }`}
                >
                  {/* Source */}
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{listing.source}</span>
                    {isBest && (
                      <span className="text-[10px] font-bold text-[var(--success)] uppercase">
                        Best Price
                      </span>
                    )}
                    <span className="text-[10px] text-[var(--muted)] sm:hidden">
                      {timeAgo(listing.last_scraped_at)}
                    </span>
                  </div>

                  {/* Price */}
                  <span
                    className={`font-bold text-sm ${isBest ? "text-[var(--success)]" : ""}`}
                  >
                    {formatPrice(listing.price_pence)}
                  </span>

                  {/* Condition */}
                  <span>
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border"
                      style={{
                        borderColor: conditionColour(listing.condition),
                        color: conditionColour(listing.condition),
                      }}
                    >
                      {conditionLabel(listing.condition)}
                    </span>
                  </span>

                  {/* Savings */}
                  <span className="text-sm">
                    {listingSavings && listingSavings.percent > 0 ? (
                      <span className="text-[var(--success)]">
                        -{listingSavings.percent}%
                      </span>
                    ) : (
                      <span className="text-[var(--muted)]">--</span>
                    )}
                  </span>

                  {/* Stock */}
                  <span>
                    {listing.in_stock ? (
                      <span className="inline-flex items-center gap-1 text-[var(--success)] text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                        In stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[var(--danger)] text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--danger)]" />
                        Out
                      </span>
                    )}
                  </span>

                  {/* Buy button */}
                  <a
                    href={buyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center justify-center rounded-lg px-4 py-1.5 text-xs font-medium transition-opacity hover:opacity-90 ${
                      isBest
                        ? "bg-[var(--success)] text-white"
                        : "bg-[var(--surface-raised)] text-[var(--foreground)] border border-[var(--border)]"
                    }`}
                  >
                    Buy
                  </a>
                </div>
              );
            })}
          </div>
        </section>

        {/* Price history placeholder */}
        <section className="mb-12">
          <h2 className="text-xl font-bold tracking-tight mb-4">
            Price History
          </h2>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
            <p className="text-[var(--muted)]">Price history coming soon</p>
            <p className="text-xs text-[var(--muted)] mt-1">
              We are tracking prices daily. Charts will appear once enough data
              is collected.
            </p>
          </div>
        </section>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section>
            <h2 className="text-xl font-bold tracking-tight mb-4">
              Related Products
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relatedProducts.map((related) => (
                <Link
                  key={related.id}
                  href={`/deals/${related.slug}`}
                  className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:border-[var(--border-light)] hover:bg-[var(--surface-hover)] transition-all"
                >
                  <div className="aspect-square bg-[var(--surface-hover)] flex items-center justify-center">
                    {related.image_url ? (
                      <img
                        src={related.image_url}
                        alt={related.name}
                        className="w-full h-full object-contain p-2"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-[var(--muted)] text-xs">
                        No image
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-xs font-medium leading-snug line-clamp-2 group-hover:text-[var(--vertical-accent-light)] transition-colors">
                      {related.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
