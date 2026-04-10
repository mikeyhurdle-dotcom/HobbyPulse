import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { supabase } from "@/lib/supabase";
import { getSiteBrand, getSiteVertical } from "@/lib/site";
import { Trophy, ArrowRight, Users } from "lucide-react";

// Sim racing doesn't use army lists — this route redirects.
import { redirect } from "next/navigation";

export const revalidate = 3600;

export function generateMetadata(): Metadata {
  const brand = getSiteBrand();
  const config = getSiteVertical();
  if (config.slug === "simracing") return { title: "Not found" };

  const title = "Tournament-Winning Warhammer Army Lists — Cheapest to Build";
  const description =
    "Every winning Warhammer 40K army list we've tracked, ranked by total build cost. See exactly how much the winning armies cost to buy, compared across every retailer.";
  const url = `https://${brand.domain}/armies`;

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

interface WinningListRow {
  id: string;
  player_name: string | null;
  winner: string | null;
  detachment: string | null;
  total_points: number | null;
  categories: { name: string; slug: string; colour: string | null } | null;
  battle_reports: {
    id: string;
    youtube_video_id: string;
    title: string;
    thumbnail_url: string | null;
    view_count: number;
    channels: { name: string | null } | null;
  } | null;
  list_items: { name: string; quantity: number }[];
}

function formatPrice(pence: number): string {
  return `\u00A3${(pence / 100).toFixed(2)}`;
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default async function ArmiesHubPage() {
  const config = getSiteVertical();
  if (config.slug === "simracing") redirect("/setups");

  const brand = getSiteBrand();

  // Fetch lists where a winner was recorded — we treat these as
  // "tournament-calibre" lists worth curating.
  const { data: rawLists } = await supabase
    .from("content_lists")
    .select(
      `id, player_name, winner, detachment, total_points,
       categories ( name, slug, colour ),
       battle_reports!inner ( id, youtube_video_id, title, thumbnail_url, view_count, channels ( name ) ),
       list_items ( name, quantity )`,
    )
    .not("winner", "is", null)
    .order("total_points", { ascending: false })
    .limit(60);

  // Filter to lists where the winner actually matches the player — i.e. this
  // is the winning player's list, not the loser's. Normalise names so minor
  // capitalisation / whitespace differences don't lose results.
  const normalise = (s: string | null) => (s ?? "").trim().toLowerCase();
  const lists = ((rawLists ?? []) as unknown as WinningListRow[]).filter((l) => {
    if (!l.battle_reports || (l.list_items ?? []).length === 0) return false;
    if (!l.winner || !l.player_name) return false;
    return normalise(l.winner) === normalise(l.player_name);
  });

  // Dedupe by battle report + faction so we don't show the same army twice
  // if there are multiple parsed lists per video.
  const seen = new Set<string>();
  const deduped = lists.filter((l) => {
    const key = `${l.battle_reports?.youtube_video_id}|${l.categories?.slug ?? "unknown"}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Group by faction for the hub view
  const byFaction = new Map<
    string,
    { factionName: string; factionSlug: string; colour: string | null; lists: WinningListRow[] }
  >();
  for (const l of deduped) {
    const slug = l.categories?.slug ?? "unknown";
    const name = l.categories?.name ?? "Unknown Faction";
    if (!byFaction.has(slug)) {
      byFaction.set(slug, {
        factionName: name,
        factionSlug: slug,
        colour: l.categories?.colour ?? null,
        lists: [],
      });
    }
    byFaction.get(slug)!.lists.push(l);
  }

  const factions = [...byFaction.values()].sort((a, b) => b.lists.length - a.lists.length);
  const totalLists = deduped.length;

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Tournament-Winning Warhammer Army Lists",
    url: `https://${brand.domain}/armies`,
    description: `${totalLists} winning army lists curated from battle reports across ${factions.length} factions.`,
    hasPart: deduped.slice(0, 20).map((l) => ({
      "@type": "CreativeWork",
      name: `${l.categories?.name ?? "Army"} — ${l.player_name} — ${l.total_points}pts`,
      url: `https://${brand.domain}/armies/${l.id}`,
    })),
  };

  return (
    <>
      <JsonLd data={collectionLd} />
      <Nav active="" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--vertical-accent)]/40 bg-[var(--vertical-accent)]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--vertical-accent-light)] mb-4">
          <Trophy className="w-3.5 h-3.5" />
          Curated winning armies
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          Tournament-Winning Army Lists
        </h1>
        <p className="text-muted-foreground max-w-3xl mb-8">
          Every winning list we&apos;ve tracked, grouped by faction. Each army
          links to the source battle report, shows the exact cheapest price to
          build, and lets you buy every unit in two clicks.
        </p>

        {totalLists === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <p className="text-muted-foreground">
              No winning lists parsed yet — check back after the next content sweep.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {factions.map((f) => (
              <section key={f.factionSlug}>
                <div className="flex items-center justify-between mb-4">
                  <h2
                    className="text-xl font-bold tracking-tight"
                    style={{ color: f.colour ?? undefined }}
                  >
                    {f.factionName}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({f.lists.length} list{f.lists.length !== 1 ? "s" : ""})
                    </span>
                  </h2>
                  <Link
                    href={`/deals/c/${f.factionSlug}`}
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    Deals <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {f.lists.slice(0, 6).map((l) => {
                    const br = l.battle_reports!;
                    return (
                      <Link
                        key={l.id}
                        href={`/armies/${l.id}`}
                        className="group rounded-xl border border-border bg-card overflow-hidden hover:border-[var(--vertical-accent)]/40 transition-all"
                      >
                        <div className="relative aspect-video bg-muted">
                          {br.thumbnail_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={br.thumbnail_url}
                              alt={br.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-[var(--vertical-accent)] text-white text-[10px] font-bold px-2 py-0.5"
                            >
                              <Trophy className="w-2.5 h-2.5" />
                              Winner
                            </span>
                            <span className="text-[10px] font-[family-name:var(--font-mono)] text-white bg-black/60 rounded px-1.5 py-0.5">
                              {l.total_points ?? "?"} pts
                            </span>
                          </div>
                        </div>
                        <div className="p-4 space-y-1">
                          <h3 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-[var(--vertical-accent-light)] transition-colors">
                            {br.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {l.player_name && (
                              <span className="inline-flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {l.player_name}
                              </span>
                            )}
                            {br.view_count > 0 && <span>· {formatViews(br.view_count)} views</span>}
                          </div>
                          {l.detachment && (
                            <p className="text-xs text-muted-foreground truncate">{l.detachment}</p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
