import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { supabase } from "@/lib/supabase";
import { getSiteBrand, getSiteVertical } from "@/lib/site";
import { wrapAffiliateUrl } from "@/lib/affiliate";
import { Calendar, ArrowRight, Bell } from "lucide-react";

export const revalidate = 3600;

export function generateMetadata(): Metadata {
  const brand = getSiteBrand();
  const config = getSiteVertical();
  const isSimRacing = config.slug === "simracing";

  const title = isSimRacing
    ? "Upcoming Sim Racing Hardware Releases"
    : "Upcoming Warhammer Releases & Pre-Orders";
  const description = isSimRacing
    ? "Every upcoming sim racing hardware launch we're tracking. Get alerted the moment a pre-order drops below RRP."
    : "Every upcoming Warhammer release with live pre-order price tracking. Know the moment it drops below RRP at Element Games, Troll Trader, or eBay.";

  const url = `https://${brand.domain}/releases`;

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

interface Release {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  release_date: string | null;
  image_url: string | null;
  pre_order_url: string | null;
  retailer: string | null;
  rrp_pence: number | null;
  current_best_pence: number | null;
  notes: string | null;
  status: string;
  categories: { name: string; slug: string } | null;
}

function formatPrice(pence: number): string {
  return `\u00A3${(pence / 100).toFixed(2)}`;
}

function formatDate(d: string | null): string {
  if (!d) return "Date TBD";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function daysUntil(d: string | null): number | null {
  if (!d) return null;
  const ms = new Date(d).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export default async function ReleasesPage() {
  const config = getSiteVertical();
  const brand = getSiteBrand();

  const { data: verticalRow } = await supabase
    .from("verticals")
    .select("id")
    .eq("slug", config.slug)
    .single();

  const { data: rawReleases } = verticalRow
    ? await supabase
        .from("releases")
        .select(
          `id, name, slug, description, release_date, image_url, pre_order_url,
           retailer, rrp_pence, current_best_pence, notes, status,
           categories ( name, slug )`,
        )
        .eq("vertical_id", verticalRow.id)
        .in("status", ["upcoming", "live"])
        .order("release_date", { ascending: true, nullsFirst: false })
    : { data: [] };

  const releases = (rawReleases ?? []) as unknown as Release[];

  const isSimRacing = config.slug === "simracing";
  const title = isSimRacing
    ? "Upcoming Sim Racing Hardware Releases"
    : "Upcoming Warhammer Releases";

  const eventsLd = releases
    .filter((r) => r.release_date)
    .map((r) => ({
      "@context": "https://schema.org",
      "@type": "Product",
      name: r.name,
      description: r.description ?? undefined,
      image: r.image_url ?? undefined,
      releaseDate: r.release_date,
      offers: r.current_best_pence
        ? {
            "@type": "Offer",
            price: (r.current_best_pence / 100).toFixed(2),
            priceCurrency: "GBP",
            availability: "https://schema.org/PreOrder",
            seller: { "@type": "Organization", name: r.retailer ?? "Unknown" },
          }
        : undefined,
    }));

  return (
    <>
      {eventsLd.map((ld, i) => (
        <JsonLd key={i} data={ld} />
      ))}
      <Nav active="" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--vertical-accent)]/40 bg-[var(--vertical-accent)]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--vertical-accent-light)] mb-4">
          <Calendar className="w-3.5 h-3.5" />
          Release calendar
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">{title}</h1>
        <p className="text-muted-foreground max-w-3xl mb-8">
          Every upcoming release we&apos;re tracking. Set a price alert on any
          item and we&apos;ll email you the moment a pre-order drops below RRP at
          any of our tracked retailers.
        </p>

        {releases.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-1">
              No releases tracked yet.
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Releases are seeded via the admin API. PulseBot will auto-scrape
              upcoming launches in a future update.
            </p>
            <Link
              href="/trending"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--vertical-accent)] hover:underline"
            >
              Browse current deals instead
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {releases.map((r) => {
              const days = daysUntil(r.release_date);
              const savings =
                r.rrp_pence && r.current_best_pence && r.rrp_pence > r.current_best_pence
                  ? Math.round(((r.rrp_pence - r.current_best_pence) / r.rrp_pence) * 100)
                  : 0;

              const buyUrl = r.pre_order_url
                ? wrapAffiliateUrl(r.pre_order_url, "releases")
                : null;

              return (
                <article
                  key={r.id}
                  className="group rounded-xl border border-border bg-card overflow-hidden hover:border-[var(--vertical-accent)]/40 transition-all"
                >
                  <div className="relative aspect-[4/3] bg-[var(--surface-hover)]">
                    {r.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.image_url}
                        alt={r.name}
                        className="w-full h-full object-contain p-4"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        No image
                      </div>
                    )}
                    {days !== null && days > 0 && (
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-[var(--vertical-accent)] text-white text-[10px] font-bold px-2 py-0.5">
                        <Calendar className="w-2.5 h-2.5" />
                        {days}d away
                      </span>
                    )}
                    {days !== null && days <= 0 && (
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-[var(--success)] text-white text-[10px] font-bold px-2 py-0.5">
                        Live now
                      </span>
                    )}
                    {savings > 0 && (
                      <span className="absolute top-3 right-3 bg-[var(--success)] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        -{savings}%
                      </span>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold leading-snug line-clamp-2">{r.name}</h3>
                    <p className="text-xs text-muted-foreground">{formatDate(r.release_date)}</p>
                    {r.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>
                    )}

                    <div className="flex items-baseline gap-2 pt-1">
                      {r.current_best_pence && (
                        <span className="text-lg font-bold text-[var(--success)]">
                          {formatPrice(r.current_best_pence)}
                        </span>
                      )}
                      {r.rrp_pence && r.rrp_pence > (r.current_best_pence ?? 0) && (
                        <span className="text-xs text-muted-foreground line-through">
                          RRP {formatPrice(r.rrp_pence)}
                        </span>
                      )}
                    </div>

                    {buyUrl ? (
                      <a
                        href={buyUrl}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="block text-center rounded-lg bg-[var(--vertical-accent)] text-white text-xs font-semibold py-2 hover:opacity-90 transition-opacity"
                      >
                        Pre-order at {r.retailer ?? "retailer"}
                      </a>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Bell className="w-3 h-3" />
                        Awaiting pre-order link
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <section className="mt-12 rounded-xl border border-border bg-card p-6 text-center">
          <Bell className="w-8 h-8 text-[var(--vertical-accent)] mx-auto mb-2" />
          <h2 className="text-base font-bold mb-1">Never miss a release</h2>
          <p className="text-sm text-muted-foreground mb-3 max-w-md mx-auto">
            Join our newsletter and get a weekly digest of upcoming launches,
            price drops, and the cheapest places to pre-order.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-[var(--vertical-accent)] hover:underline"
          >
            Sign up on the homepage
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
