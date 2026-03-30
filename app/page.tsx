import Link from "next/link";
import { Nav } from "@/components/nav";
import { JsonLd } from "@/components/json-ld";
import { getSiteVertical, getSiteBrand } from "@/lib/site";
import { websiteSchema } from "@/lib/structured-data";

// ---------------------------------------------------------------------------
// Home / Vertical Landing Page
// ---------------------------------------------------------------------------

export default function HomePage() {
  const config = getSiteVertical();
  const brand = getSiteBrand();

  const quickLinks = [
    {
      label: "Watch",
      href: "/watch",
      description: config.watchDescription,
      icon: "▶",
    },
    {
      label: "Deals",
      href: "/deals",
      description: config.dealsDescription,
      icon: "£",
    },
    {
      label: "Live",
      href: "/live",
      description: config.liveDescription,
      icon: "●",
    },
  ];

  return (
    <>
      <JsonLd data={websiteSchema()} />
      <Nav active="" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            {brand.siteName}
          </h1>
          <p className="text-[var(--muted)] text-lg">{brand.tagline}</p>
        </div>

        {/* Placeholder stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { label: "Videos", value: "--", icon: "▶" },
            { label: "Deals", value: "--", icon: "£" },
            { label: "Live Now", value: "--", icon: "●" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--vertical-accent)]/10 text-[var(--vertical-accent-light)] text-lg">
                  {stat.icon}
                </span>
                <div>
                  <p className="text-2xl font-bold tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-xs text-[var(--muted)]">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent videos placeholder */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold tracking-tight">
              Recent Videos
            </h2>
            <Link
              href="/watch"
              className="text-sm text-[var(--vertical-accent-light)] hover:underline"
            >
              View all &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
              >
                <div className="aspect-video bg-[var(--surface-hover)] animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-[var(--surface-hover)] rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-[var(--surface-hover)] rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:bg-[var(--surface-hover)] hover:border-[var(--border-light)] transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg">{link.icon}</span>
                <h3 className="text-lg font-bold tracking-tight group-hover:text-[var(--vertical-accent-light)] transition-colors">
                  {link.label}
                </h3>
              </div>
              <p className="text-sm text-[var(--muted)]">{link.description}</p>
            </Link>
          ))}
        </div>

        {/* Channels list */}
        <div className="mt-10">
          <h2 className="text-xl font-bold tracking-tight mb-4">
            Tracked Channels
          </h2>
          <div className="flex flex-wrap gap-2">
            {config.channels.map((channel) => (
              <span
                key={channel}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)]"
              >
                {channel}
              </span>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
