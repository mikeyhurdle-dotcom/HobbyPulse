import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { supabase } from "@/lib/supabase";
import { getSiteVertical, getSiteBrand } from "@/lib/site";
import { wrapAffiliateUrl } from "@/lib/affiliate";
import { Calendar, ArrowRight, ArrowLeft, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const brand = getSiteBrand();
  return {
    title: `Upcoming Board Game Releases | ${brand.siteName}`,
    description:
      "Board game release calendar — upcoming retail launches, Kickstarter deliveries, and expansions with pre-order links.",
    openGraph: {
      title: `Upcoming Board Game Releases | ${brand.siteName}`,
      description:
        "Board game release calendar — upcoming launches and pre-order links.",
      type: "website",
    },
  };
}

interface Release {
  id: string;
  title: string;
  slug: string;
  release_date: string | null;
  release_type: string;
  status: string;
  pre_order_url: string | null;
  retailer: string | null;
  rrp_pence: number | null;
  image_url: string | null;
  notes: string | null;
  game_id: string | null;
}

function formatPrice(pence: number): string {
  return `\u00A3${(pence / 100).toFixed(2)}`;
}

function daysUntil(d: string | null): number | null {
  if (!d) return null;
  const ms = new Date(d).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function formatMonthYear(d: string): string {
  return new Date(d).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const typeColours: Record<string, string> = {
  retail: "var(--success)",
  kickstarter: "#8b5cf6",
  expansion: "#f59e0b",
};

export default async function BoardGameReleasesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const config = getSiteVertical();
  if (config.slug !== "warhammer") redirect("/");

  const params = await searchParams;
  const filterType = params.type;

  let query = supabase
    .from("board_game_releases")
    .select("*")
    .in("status", ["upcoming", "live"])
    .order("release_date", { ascending: true, nullsFirst: false });

  if (filterType && filterType !== "all") {
    query = query.eq("release_type", filterType);
  }

  const { data: rawReleases } = await query;
  const releases = (rawReleases ?? []) as Release[];

  // Group by month
  const grouped = new Map<string, Release[]>();
  for (const r of releases) {
    const key = r.release_date
      ? formatMonthYear(r.release_date)
      : "Date TBD";
    const arr = grouped.get(key) ?? [];
    arr.push(r);
    grouped.set(key, arr);
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav active="boardgames" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/boardgames"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Board Games
        </Link>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--vertical-accent)]/40 bg-[var(--vertical-accent)]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--vertical-accent-light)] mb-3">
              <Calendar className="w-3.5 h-3.5" />
              Release Calendar
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
              Upcoming Board Game Releases
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Track upcoming board game launches, Kickstarter deliveries, and
              expansion releases. Pre-order links when available.
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <nav className="mb-8 flex gap-1 border-b border-border" aria-label="Release type">
          {[
            { key: "all", label: "All" },
            { key: "retail", label: "Retail" },
            { key: "kickstarter", label: "Kickstarter" },
            { key: "expansion", label: "Expansions" },
          ].map((t) => (
            <Link
              key={t.key}
              href={`/boardgames/releases${t.key === "all" ? "" : `?type=${t.key}`}`}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                (filterType ?? "all") === t.key
                  ? "border-[var(--vertical-accent)] text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        {releases.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-1">
              No upcoming releases tracked yet.
            </p>
            <p className="text-xs text-muted-foreground">
              Releases will appear here as they&apos;re added. Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {Array.from(grouped.entries()).map(([month, items]) => (
              <div key={month}>
                <h2 className="text-lg font-bold tracking-tight mb-4 sticky top-16 bg-background/80 backdrop-blur-sm py-2 z-10">
                  {month}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((r) => {
                    const days = daysUntil(r.release_date);
                    const buyUrl = r.pre_order_url
                      ? wrapAffiliateUrl(r.pre_order_url, "bg-releases")
                      : null;

                    return (
                      <article
                        key={r.id}
                        className="group rounded-xl border border-border bg-card overflow-hidden hover:border-[var(--vertical-accent)]/40 transition-all"
                      >
                        <div className="relative aspect-[16/10] bg-muted">
                          {r.image_url ? (
                            <img
                              src={r.image_url}
                              alt={r.title}
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
                          <Badge
                            variant="outline"
                            className="absolute top-3 right-3 text-[10px]"
                            style={{
                              borderColor: typeColours[r.release_type] ?? "var(--border)",
                              color: typeColours[r.release_type] ?? "var(--muted)",
                            }}
                          >
                            {r.release_type}
                          </Badge>
                        </div>
                        <div className="p-4 space-y-2">
                          <h3 className="font-semibold leading-snug line-clamp-2">
                            {r.title}
                          </h3>
                          {r.release_date && (
                            <p className="text-xs text-muted-foreground">
                              {formatDate(r.release_date)}
                            </p>
                          )}
                          {r.notes && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {r.notes}
                            </p>
                          )}
                          {r.rrp_pence && (
                            <p className="text-sm font-bold">
                              {formatPrice(r.rrp_pence)}
                            </p>
                          )}
                          {buyUrl ? (
                            <a
                              href={buyUrl}
                              target="_blank"
                              rel="noopener noreferrer sponsored"
                              className="block text-center rounded-lg bg-[var(--vertical-accent)] text-white text-xs font-semibold py-2 hover:opacity-90 transition-opacity"
                            >
                              Pre-order{r.retailer ? ` at ${r.retailer}` : ""}
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
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <section className="mt-12 rounded-xl border border-border bg-card p-6 text-center">
          <Bell className="w-8 h-8 text-[var(--vertical-accent)] mx-auto mb-2" />
          <h2 className="text-base font-bold mb-1">Never miss a release</h2>
          <p className="text-sm text-muted-foreground mb-3 max-w-md mx-auto">
            Join our newsletter for weekly release digests and pre-order alerts.
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
    </div>
  );
}
