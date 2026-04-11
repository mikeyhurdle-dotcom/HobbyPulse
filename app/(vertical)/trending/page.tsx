import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { ProductImage } from "@/components/product-image";
import { PriceDropBadge } from "@/components/price-drop-badge";
import { ShareButtons } from "@/components/share-buttons";
import { JsonLd } from "@/components/json-ld";
import { supabase } from "@/lib/supabase";
import { getSiteVertical, getSiteBrand } from "@/lib/site";
import { getTopPriceDropsForVertical, DEFAULT_LOOKBACK_DAYS } from "@/lib/price-drops";
import { wrapAffiliateUrl } from "@/lib/affiliate";
import { TrendingDown, ArrowRight } from "lucide-react";

// Refresh the page once per hour. Drop data doesn't change minute-to-minute.
export const revalidate = 3600;

export function generateMetadata(): Metadata {
  const brand = getSiteBrand();
  const config = getSiteVertical();
  const isSimRacing = config.slug === "simracing";
  const title = isSimRacing
    ? "Top Sim Racing Hardware Deals This Week"
    : "Top Tabletop Price Drops This Week";
  const description = isSimRacing
    ? "The biggest price drops on sim racing wheels, pedals, rigs and monitors in the last 7 days — updated hourly."
    : "The biggest price drops on board games and miniatures in the last 7 days — tracked across every major UK retailer.";

  const url = `https://${brand.domain}/trending`;
  const ogUrl = `${url}/opengraph-image`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: brand.siteName,
      type: "website",
      images: [{ url: ogUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

function formatPrice(pence: number): string {
  return `\u00A3${(pence / 100).toFixed(2)}`;
}

export default async function TrendingPage() {
  const config = getSiteVertical();
  const brand = getSiteBrand();

  const { data: verticalRow } = await supabase
    .from("verticals")
    .select("id")
    .eq("slug", config.slug)
    .single();

  const verticalId = verticalRow?.id;

  const drops = verticalId
    ? await getTopPriceDropsForVertical(verticalId, 24, DEFAULT_LOOKBACK_DAYS)
    : [];

  const baseUrl = `https://${brand.domain}`;
  const pageUrl = `${baseUrl}/trending`;
  const isSimRacing = config.slug === "simracing";
  const title = isSimRacing
    ? "Top Sim Racing Hardware Deals This Week"
    : "Top Tabletop Price Drops This Week";
  const shareTitle = isSimRacing
    ? `${drops.length} sim racing hardware deals dropped this week on ${brand.siteName}`
    : `${drops.length} tabletop deals dropped in price this week on ${brand.siteName}`;

  // Derive headline stats for the hero
  const biggestDrop = drops[0]?.dropPercent ?? 0;
  const totalSaved = drops.reduce((acc, d) => acc + (d.oldPrice - d.newPrice), 0);

  // JSON-LD collection page
  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    url: pageUrl,
    description: `Top ${drops.length} price drops in the last ${DEFAULT_LOOKBACK_DAYS} days, tracked hourly.`,
    hasPart: drops.slice(0, 10).map((d) => ({
      "@type": "Product",
      name: d.productName,
      url: `${baseUrl}/deals/${d.productSlug}`,
      offers: {
        "@type": "Offer",
        price: (d.newPrice / 100).toFixed(2),
        priceCurrency: "GBP",
        availability: "https://schema.org/InStock",
        seller: { "@type": "Organization", name: d.source },
      },
    })),
  };

  return (
    <>
      <JsonLd data={collectionLd} />
      <Nav active="deals" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--danger)] mb-4">
            <TrendingDown className="w-3.5 h-3.5" />
            Trending this week
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            {title}
          </h1>
          <p className="text-[var(--muted)] max-w-3xl">
            The biggest price drops tracked across every major retailer in the
            last {DEFAULT_LOOKBACK_DAYS} days. Updated hourly. Click through
            to compare prices, see the drop history, or set a price alert.
          </p>

          {/* Stats row */}
          {drops.length > 0 && (
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-medium">Price drops</p>
                <p className="text-2xl font-bold">{drops.length}</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-medium">Biggest drop</p>
                <p className="text-2xl font-bold text-[var(--danger)]">-{biggestDrop}%</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-medium">Total savings</p>
                <p className="text-2xl font-bold text-[var(--success)]">{formatPrice(totalSaved)}</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-medium">Window</p>
                <p className="text-2xl font-bold">{DEFAULT_LOOKBACK_DAYS}d</p>
              </div>
            </div>
          )}

          <div className="mt-5">
            <ShareButtons url={pageUrl} title={shareTitle} />
          </div>
        </div>

        {/* Drops grid */}
        {drops.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center">
            <p className="text-[var(--muted)] text-lg mb-1">
              No significant price drops in the last {DEFAULT_LOOKBACK_DAYS} days.
            </p>
            <p className="text-[var(--muted)] text-sm">
              Check back tomorrow — fresh data is scraped every morning.
            </p>
            <Link
              href="/deals"
              className="inline-flex items-center gap-1 text-[var(--vertical-accent)] text-sm font-medium mt-4 hover:underline"
            >
              Browse all deals <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {drops.map((d) => {
              const buyUrl = wrapAffiliateUrl(d.affiliateUrl || d.sourceUrl, "trending");
              return (
                <article
                  key={d.productId}
                  className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:border-[var(--border-light)] transition-all"
                >
                  <div className="relative aspect-[4/3] bg-[var(--surface-hover)]">
                    {d.productImageUrl ? (
                      <ProductImage
                        src={d.productImageUrl}
                        alt={d.productName}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-contain p-3"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--muted)] text-sm">
                        No image
                      </div>
                    )}
                    <span className="absolute top-3 left-3">
                      <PriceDropBadge dropPercent={d.dropPercent} size="md" />
                    </span>
                  </div>

                  <div className="p-4 space-y-3">
                    <Link
                      href={`/deals/${d.productSlug}`}
                      className="block"
                    >
                      <h3 className="font-medium leading-snug line-clamp-2 group-hover:text-[var(--vertical-accent-light)] transition-colors">
                        {d.productName}
                      </h3>
                    </Link>

                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-[var(--success)]">
                        {formatPrice(d.newPrice)}
                      </span>
                      <span className="text-sm text-[var(--muted)] line-through">
                        {formatPrice(d.oldPrice)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center rounded-full border border-[var(--border-light)] px-2 py-0.5 font-medium text-[var(--muted)]">
                        {d.source}
                      </span>
                      <span className="text-[var(--success)] font-semibold">
                        Save {formatPrice(d.oldPrice - d.newPrice)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Link
                        href={`/deals/${d.productSlug}`}
                        className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium hover:bg-[var(--surface-hover)] transition-colors"
                      >
                        Compare
                      </Link>
                      <a
                        href={buyUrl}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-[var(--vertical-accent)] px-3 py-2 text-xs font-medium text-white hover:opacity-90 transition-opacity"
                      >
                        Buy at {d.source}
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
          <p className="text-sm text-[var(--muted)] mb-3">
            Want to know the moment something drops? Set a price alert on any product.
          </p>
          <Link
            href="/deals"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--vertical-accent)] hover:underline"
          >
            Browse all deals <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>
    </>
  );
}
