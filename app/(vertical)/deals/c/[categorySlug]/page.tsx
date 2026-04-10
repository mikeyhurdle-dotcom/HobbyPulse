import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { ProductImage } from "@/components/product-image";
import { PriceDropBadge } from "@/components/price-drop-badge";
import { JsonLd } from "@/components/json-ld";
import { supabase } from "@/lib/supabase";
import { getSiteBrand, getSiteVertical } from "@/lib/site";
import { getSavings } from "@/lib/gw-rrp";
import { getPriceDropsForListings } from "@/lib/price-drops";
import { ArrowLeft, TrendingDown } from "lucide-react";

export const revalidate = 3600;

interface Listing {
  id: string;
  source: string;
  price_pence: number;
  currency: string;
  condition: string;
  in_stock: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  rrp_pence: number | null;
  listings: Listing[];
}

function formatPrice(pence: number): string {
  return `\u00A3${(pence / 100).toFixed(2)}`;
}

async function getCategoryData(categorySlug: string) {
  const config = getSiteVertical();

  const { data: verticalRow } = await supabase
    .from("verticals")
    .select("id")
    .eq("slug", config.slug)
    .single();

  const verticalId = verticalRow?.id;
  if (!verticalId) return null;

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("vertical_id", verticalId)
    .eq("slug", categorySlug)
    .single();

  if (!category) return null;

  const { data: rawProducts } = await supabase
    .from("products")
    .select(
      `id, name, slug, image_url, rrp_pence,
       listings ( id, source, price_pence, currency, condition, in_stock )`,
    )
    .eq("vertical_id", verticalId)
    .eq("category_id", category.id)
    .limit(120);

  const products = (rawProducts ?? []) as unknown as Product[];
  return { category, products };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}): Promise<Metadata> {
  const { categorySlug } = await params;
  const brand = getSiteBrand();
  const data = await getCategoryData(categorySlug);

  if (!data) return { title: "Category not found" };

  const { category, products } = data;
  const title = `${category.name} Deals & Price Comparison`;
  const description = `${products.length} ${category.name} listings compared across every major retailer on ${brand.siteName}. Find the best price, track price drops, set alerts.`;
  const url = `https://${brand.domain}/deals/c/${categorySlug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | ${brand.siteName}`,
      description,
      url,
      siteName: brand.siteName,
      type: "website",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${brand.siteName}`,
      description,
      images: ["/opengraph-image"],
    },
  };
}

export default async function CategoryDealsPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;
  const data = await getCategoryData(categorySlug);
  if (!data) notFound();

  const { category, products } = data;
  const brand = getSiteBrand();

  // Fetch price drops for every listing in view (one chunked query).
  const allListingIds = products.flatMap((p) => p.listings.map((l) => l.id));
  const dropsByListing = await getPriceDropsForListings(allListingIds);

  const enriched = products
    .map((product) => {
      const best = product.listings.reduce<Listing | null>((b, l) => {
        if (!b || l.price_pence < b.price_pence) return l;
        return b;
      }, null);
      const bestPrice = best?.price_pence ?? 0;
      const savings = getSavings(bestPrice, product.name);
      const rrp = product.rrp_pence ?? savings?.rrp ?? null;

      let bestDrop = 0;
      for (const l of product.listings) {
        const d = dropsByListing.get(l.id);
        if (d && d.dropPercent > bestDrop) bestDrop = d.dropPercent;
      }

      return {
        ...product,
        bestPrice,
        rrp,
        savingsPercent: savings?.percent ?? null,
        bestDropPercent: bestDrop,
      };
    })
    .filter((p) => p.bestPrice > 0)
    .sort((a, b) => {
      // Prioritise products with drops, then by savings %, then by price.
      if (a.bestDropPercent !== b.bestDropPercent) return b.bestDropPercent - a.bestDropPercent;
      if ((b.savingsPercent ?? 0) !== (a.savingsPercent ?? 0))
        return (b.savingsPercent ?? 0) - (a.savingsPercent ?? 0);
      return a.bestPrice - b.bestPrice;
    });

  const avgPrice =
    enriched.length > 0
      ? Math.round(enriched.reduce((acc, p) => acc + p.bestPrice, 0) / enriched.length)
      : 0;
  const cheapest = enriched[0]?.bestPrice ?? 0;

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.name} Deals`,
    itemListElement: enriched.slice(0, 20).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://${brand.domain}/deals/${p.slug}`,
      name: p.name,
    })),
  };

  return (
    <>
      <JsonLd data={itemListLd} />
      <Nav active="deals" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/deals"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All deals
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {category.name} Deals
        </h1>
        <p className="text-muted-foreground mb-6 max-w-3xl">
          {enriched.length} {category.name} listings compared across every major
          retailer. Sorted to show the biggest price drops and savings first.
        </p>

        {/* Stats row */}
        {enriched.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Listings
              </p>
              <p className="text-2xl font-bold">{enriched.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Cheapest
              </p>
              <p className="text-2xl font-bold text-[var(--success)]">
                {formatPrice(cheapest)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Average
              </p>
              <p className="text-2xl font-bold">{formatPrice(avgPrice)}</p>
            </div>
          </div>
        )}

        {/* Grid */}
        {enriched.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <p className="text-muted-foreground text-lg mb-2">
              No {category.name} deals found.
            </p>
            <p className="text-muted-foreground text-sm">
              We haven&apos;t tracked any listings in this category yet — check
              back soon, or browse{" "}
              <Link
                href="/deals"
                className="text-[var(--vertical-accent-light)] hover:underline"
              >
                all deals
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {enriched.map((product) => (
              <Link
                key={product.id}
                href={`/deals/${product.slug}`}
                className="group rounded-xl border border-border bg-card overflow-hidden hover:border-[var(--border-light)] transition-all"
              >
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
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                      No image
                    </div>
                  )}
                  {product.bestDropPercent > 0 && (
                    <span className="absolute top-2 left-2">
                      <PriceDropBadge dropPercent={product.bestDropPercent} />
                    </span>
                  )}
                  {product.savingsPercent !== null && product.savingsPercent > 0 && (
                    <span className="absolute top-2 right-2 bg-[var(--success)] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      -{product.savingsPercent}%
                    </span>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-[var(--vertical-accent-light)] transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-[var(--success)]">
                      {formatPrice(product.bestPrice)}
                    </span>
                    {product.rrp && product.rrp > product.bestPrice && (
                      <span className="text-xs text-muted-foreground line-through">
                        {formatPrice(product.rrp)}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {product.listings.length} listing
                    {product.listings.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Footer CTA */}
        {enriched.some((p) => p.bestDropPercent > 0) && (
          <div className="mt-10 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/5 p-5 flex items-center gap-3">
            <TrendingDown className="w-5 h-5 text-[var(--danger)] shrink-0" />
            <p className="text-sm text-muted-foreground flex-1">
              Some of these just dropped in price. See every drop on the{" "}
              <Link
                href="/trending"
                className="text-[var(--danger)] font-semibold hover:underline"
              >
                trending page
              </Link>
              .
            </p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
