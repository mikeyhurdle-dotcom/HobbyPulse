import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { getSiteVertical, getSiteBrand } from "@/lib/site";
import type { Metadata } from "next";

const config = getSiteVertical();
const brand = getSiteBrand();

export const metadata: Metadata = {
  title: `About`,
  description: `${brand.siteName} — ${brand.tagline}. Free content aggregation, price comparison, and live streams for hobbyists.`,
  openGraph: {
    title: `About | ${brand.siteName}`,
    description: brand.tagline,
  },
};

export default function AboutPage() {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.siteName,
    url: `https://${brand.domain}`,
    description: brand.tagline,
    potentialAction: {
      "@type": "SearchAction",
      target: `https://${brand.domain}/deals?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <JsonLd data={websiteSchema} />
      <Nav active="" />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight mb-8">
          About {brand.siteName}
        </h1>

        <div className="space-y-6 text-muted-foreground">
          <p className="text-lg text-foreground">
            {brand.tagline}
          </p>

          <p>
            {brand.siteName} is a content and deals platform built for hobbyists.
            We aggregate the best YouTube content, compare prices across retailers,
            and show you live streams — all in one place.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8">
            What we do
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {config.slug === "tabletop" && (
              <div className="p-4 rounded-xl border border-border bg-secondary/50">
                <h3 className="font-semibold text-foreground mb-2">Board Games</h3>
                <p className="text-sm">
                  Browse 500+ games, watch reviews and playthroughs, get personalised recommendations, and compare games side by side.
                </p>
              </div>
            )}
            <div className="p-4 rounded-xl border border-border bg-secondary/50">
              <h3 className="font-semibold text-foreground mb-2">Watch</h3>
              <p className="text-sm">
                {config.watchDescription}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-secondary/50">
              <h3 className="font-semibold text-foreground mb-2">Deals</h3>
              <p className="text-sm">
                {config.dealsDescription}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-secondary/50">
              <h3 className="font-semibold text-foreground mb-2">Live</h3>
              <p className="text-sm">
                {config.liveDescription}
              </p>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-foreground mt-8">
            How it works
          </h2>

          <p>
            We monitor {config.channels.length} YouTube channels for new content,
            automatically extract structured data using AI, and compare prices
            across {config.retailers.length} retailers — all updated daily.
          </p>

          <p>
            Every outbound link to a retailer is an affiliate link. When you make
            a purchase through our links, we earn a small commission at no extra
            cost to you. This is how we keep the site free.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8">
            Built by hobbyists
          </h2>

          <p>
            {brand.siteName} is a side project built with love for the hobby community.
            We use the same tools we build — because we&apos;re hobbyists too.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8">
            Operated by
          </h2>

          <p>
            {brand.siteName} is operated by Mikey Hurdle as an independent
            side project. We are not affiliated with, sponsored by, or endorsed
            by any retailer, game publisher, or rights holder referenced on
            this site. All trademarks and content belong to their respective
            owners.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8">
            Data sources &amp; transparency
          </h2>

          <p>
            All video data is fetched from official YouTube RSS feeds and the
            YouTube Data API. Live streams are fetched from the Twitch Helix
            API and the YouTube search API. Deal prices are scraped from
            publicly accessible retailer pages and the eBay Browse API. We
            record a snapshot of every listing&apos;s price on every scrape so
            we can show you accurate price history charts.
          </p>

          <p>
            We do not accept payment to promote specific products or
            retailers. The sort order on our deals pages is always either
            price, savings, or recency — never paid placement.
          </p>

          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-sm">
              Questions? Suggestions? Visit our{" "}
              <a
                href="/contact"
                className="text-[var(--vertical-accent-light)] hover:underline"
              >
                contact page
              </a>{" "}
              or email hello@{brand.domain}.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
