import { Nav } from "@/components/nav";
import { getSiteVertical, getSiteBrand } from "@/lib/site";
import type { Metadata } from "next";

const config = getSiteVertical();
const brand = getSiteBrand();

export const metadata: Metadata = {
  title: `About | ${brand.siteName}`,
};

export default function AboutPage() {
  return (
    <>
      <Nav active="" />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight mb-8">
          About {brand.siteName}
        </h1>

        <div className="space-y-6 text-[var(--muted)]">
          <p className="text-lg text-[var(--foreground)]">
            {brand.tagline}
          </p>

          <p>
            {brand.siteName} is a content and deals platform built for hobbyists.
            We aggregate the best YouTube content, compare prices across retailers,
            and show you live streams — all in one place.
          </p>

          <h2 className="text-xl font-semibold text-[var(--foreground)] mt-8">
            What we do
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
              <h3 className="font-semibold text-[var(--foreground)] mb-2">Watch</h3>
              <p className="text-sm">
                {config.watchDescription}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
              <h3 className="font-semibold text-[var(--foreground)] mb-2">Deals</h3>
              <p className="text-sm">
                {config.dealsDescription}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
              <h3 className="font-semibold text-[var(--foreground)] mb-2">Live</h3>
              <p className="text-sm">
                {config.liveDescription}
              </p>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-[var(--foreground)] mt-8">
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

          <h2 className="text-xl font-semibold text-[var(--foreground)] mt-8">
            Built by hobbyists
          </h2>

          <p>
            {brand.siteName} is a side project built with love for the hobby community.
            We use the same tools we build — because we're hobbyists too.
          </p>

          <div className="mt-8 pt-8 border-t border-[var(--border)]">
            <p className="text-sm">
              Questions? Suggestions? Reach out at hello@{brand.domain}
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
