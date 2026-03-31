import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { AdSidebar } from "@/components/ad-slot";
import { JsonLd } from "@/components/json-ld";
import { RelatedVideos } from "@/components/related-videos";
import { CrossSystemRecommendations } from "@/components/cross-system-recommendations";
import { supabase } from "@/lib/supabase";
import { getSiteVertical, getSiteBrand } from "@/lib/site";
import { videoSchema, breadcrumbSchema } from "@/lib/structured-data";
import { classifyVideo, classifyGameSystem, VIDEO_TYPE_CONFIG } from "@/lib/classify";
import { getGameSystem } from "@/config/game-systems";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ListItem {
  id: string;
  name: string;
  quantity: number;
  points: number;
  enhancements: string[] | null;
  wargear: string[] | null;
  sort_order: number;
}

interface ContentList {
  id: string;
  player_name: string | null;
  detachment: string | null;
  total_points: number;
  list_index: number;
  categories: {
    name: string;
    slug: string;
    colour: string | null;
  } | null;
  list_items: ListItem[];
}

interface BattleReport {
  id: string;
  youtube_video_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  published_at: string;
  view_count: number;
  duration_seconds: number;
  game_system: string | null;
  parse_confidence: number | null;
  channels: {
    name: string;
    thumbnail_url: string | null;
  } | null;
  content_lists: ContentList[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatViews(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M views`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K views`;
  return `${count} views`;
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ videoId: string }>;
}): Promise<Metadata> {
  const { videoId } = await params;
  const brand = getSiteBrand();

  const { data: report } = await supabase
    .from("battle_reports")
    .select(
      `title, description,
       channels ( name ),
       content_lists ( categories ( name ), total_points )`,
    )
    .eq("youtube_video_id", videoId)
    .single();

  if (!report) return { title: "Video Not Found" };

  const r = report as any;
  const factions = [
    ...new Set(
      (r.content_lists ?? [])
        .map((l: any) => l.categories?.name)
        .filter(Boolean),
    ),
  ] as string[];
  const points = r.content_lists?.[0]?.total_points ?? "";
  const factionStr = factions.length >= 2 ? `${factions[0]} vs ${factions[1]}` : factions[0] ?? "";
  const desc = `Watch ${r.title} by ${r.channels?.name ?? "Unknown"}${factionStr ? ` \u2014 ${factionStr}` : ""}${points ? ` at ${points}pts` : ""}`;

  return {
    title: r.title,
    description: desc,
    openGraph: {
      title: `${r.title} | ${brand.siteName}`,
      description: desc,
      type: "video.other",
    },
    twitter: { card: "summary_large_image" },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = await params;
  const config = getSiteVertical();

  const { data: report } = await supabase
    .from("battle_reports")
    .select(
      `id, youtube_video_id, title, description, thumbnail_url, published_at,
       view_count, duration_seconds, game_system, parse_confidence,
       channels ( name, thumbnail_url ),
       content_lists (
         id, player_name, detachment, total_points, list_index,
         categories ( name, slug, colour ),
         list_items ( id, name, quantity, points, enhancements, wargear, sort_order )
       )`,
    )
    .eq("youtube_video_id", videoId)
    .single();

  if (!report) {
    notFound();
  }

  const battleReport = report as unknown as BattleReport;

  // Sort content_lists by list_index, and list_items by sort_order
  const sortedLists = [...(battleReport.content_lists ?? [])].sort(
    (a, b) => a.list_index - b.list_index,
  );
  for (const list of sortedLists) {
    list.list_items?.sort((a, b) => a.sort_order - b.sort_order);
  }

  // Collect unique category slugs, then resolve to IDs for the related videos query
  const uniqueCategorySlugs = [
    ...new Set(
      (battleReport.content_lists ?? [])
        .map((l) => l.categories?.slug)
        .filter(Boolean) as string[],
    ),
  ];

  const categoryIdsForRelated: string[] = [];
  if (uniqueCategorySlugs.length > 0) {
    const { data: cats } = await supabase
      .from("categories")
      .select("id")
      .in("slug", uniqueCategorySlugs);
    if (cats) {
      categoryIdsForRelated.push(...cats.map((c) => c.id));
    }
  }

  const brand = getSiteBrand();
  const baseUrl = `https://${brand.domain}`;

  return (
    <>
      <JsonLd data={videoSchema(battleReport)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: baseUrl },
          { name: "Watch", url: `${baseUrl}/watch` },
          { name: battleReport.title, url: `${baseUrl}/watch/${battleReport.youtube_video_id}` },
        ])}
      />
      <Nav active="watch" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Back link */}
        <Link
          href="/watch"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-6"
        >
          <span>&larr;</span>
          <span>Back to Watch</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video column */}
          <div className="lg:col-span-2 space-y-4">
            {/* YouTube embed */}
            <div className="aspect-video rounded-xl overflow-hidden border border-[var(--border)] bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${battleReport.youtube_video_id}`}
                title={battleReport.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              />
            </div>

            {/* Title + meta */}
            <div
              className="space-y-2 rounded-lg pl-4"
              style={{
                borderLeftWidth: "4px",
                borderLeftStyle: "solid",
                borderLeftColor: getGameSystem(battleReport.game_system ?? classifyGameSystem(battleReport.title)).colour,
              }}
            >
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-snug">
                  {battleReport.title}
                </h1>
                {(() => {
                  const gs = getGameSystem(battleReport.game_system ?? classifyGameSystem(battleReport.title));
                  return (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: gs.colour }}
                    >
                      <span>{gs.icon}</span>
                      <span>{gs.name}</span>
                    </span>
                  );
                })()}
                {(() => {
                  const ct = classifyVideo(battleReport.title, battleReport.duration_seconds);
                  const cfg = VIDEO_TYPE_CONFIG[ct];
                  return (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: cfg.colour }}
                    >
                      <span>{cfg.icon}</span>
                      <span>{cfg.label}</span>
                    </span>
                  );
                })()}
              </div>
              <div className="flex items-center gap-3">
                {battleReport.channels?.thumbnail_url ? (
                  <img
                    src={battleReport.channels.thumbnail_url}
                    alt={battleReport.channels.name ?? ""}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[var(--surface-hover)] flex items-center justify-center text-[var(--muted)] text-xs shrink-0">
                    ?
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">
                    {battleReport.channels?.name ?? "Unknown channel"}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {formatViews(battleReport.view_count)} -{" "}
                    {formatDate(battleReport.published_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Description (collapsible) */}
            {battleReport.description && (
              <details className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                <summary className="px-4 py-3 text-sm font-medium cursor-pointer hover:bg-[var(--surface-hover)] transition-colors">
                  Video Description
                </summary>
                <div className="px-4 pb-4">
                  <pre className="text-xs text-[var(--muted)] font-[family-name:var(--font-body)] whitespace-pre-wrap break-words leading-relaxed">
                    {battleReport.description}
                  </pre>
                </div>
              </details>
            )}
          </div>

          {/* Army lists sidebar */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold tracking-tight">Army Lists</h2>

            {sortedLists.length === 0 ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
                <p className="text-sm text-[var(--muted)]">
                  No parsed army lists yet.
                </p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Lists are automatically extracted from video descriptions.
                </p>
              </div>
            ) : (
              sortedLists.map((list) => {
                // Build the raw text for "Buy This Army" pre-fill
                const armyListText = (list.list_items ?? [])
                  .map((item) =>
                    `${item.quantity > 1 ? `${item.quantity}x ` : ""}${item.name} [${item.points} pts]`,
                  )
                  .join("\n");

                return (
                  <div key={list.id} className="space-y-2">
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                      {/* List header */}
                      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-hover)]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {list.categories && (
                              <span
                                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border"
                                style={{
                                  borderColor:
                                    list.categories.colour ?? "var(--border-light)",
                                  color: list.categories.colour ?? "var(--muted)",
                                  backgroundColor: list.categories.colour
                                    ? `${list.categories.colour}15`
                                    : "transparent",
                                }}
                              >
                                {list.categories.name}
                              </span>
                            )}
                            {list.player_name && (
                              <span className="text-sm font-medium">
                                {list.player_name}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-[family-name:var(--font-mono)] text-[var(--muted)]">
                            {list.total_points} pts
                          </span>
                        </div>
                        {list.detachment && (
                          <p className="text-xs text-[var(--muted)] mt-1">
                            {list.detachment}
                          </p>
                        )}
                      </div>

                      {/* Unit table */}
                      <div className="divide-y divide-[var(--border)]">
                        {(list.list_items ?? []).map((item) => (
                          <div
                            key={item.id}
                            className="px-4 py-2.5 hover:bg-[var(--surface-hover)] transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={`/deals?q=${encodeURIComponent(item.name)}`}
                                  className="text-sm font-medium hover:text-[var(--vertical-accent-light)] transition-colors"
                                >
                                  {item.quantity > 1 && (
                                    <span className="text-[var(--muted)] mr-1">
                                      {item.quantity}x
                                    </span>
                                  )}
                                  {item.name}
                                </Link>

                                {/* Enhancements */}
                                {item.enhancements && item.enhancements.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {item.enhancements.map((enh, i) => (
                                      <span
                                        key={i}
                                        className="text-[10px] text-[var(--accent-light)] bg-[var(--accent-glow)] rounded px-1.5 py-0.5"
                                      >
                                        {enh}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Wargear */}
                                {item.wargear && item.wargear.length > 0 && (
                                  <p className="text-[10px] text-[var(--muted)] mt-0.5 truncate">
                                    {item.wargear.join(", ")}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs font-[family-name:var(--font-mono)] text-[var(--muted)] whitespace-nowrap">
                                {item.points} pts
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Buy This Army CTA */}
                    {(list.list_items ?? []).length > 0 && (
                      <Link
                        href={`/build?list=${encodeURIComponent(armyListText)}`}
                        className="flex items-center justify-center gap-2 w-full rounded-xl bg-[var(--vertical-accent)] px-4 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity"
                      >
                        <span>{"\u00A3"}</span>
                        <span>Buy This Army</span>
                      </Link>
                    )}
                  </div>
                );
              })
            )}

            {/* Parse confidence */}
            {battleReport.parse_confidence != null &&
              battleReport.parse_confidence > 0 && (
                <p className="text-[10px] text-[var(--muted)] text-center">
                  Parse confidence:{" "}
                  {Math.round(battleReport.parse_confidence * 100)}%
                </p>
              )}

            {/* Sidebar ad */}
            <AdSidebar className="mt-4" />
          </div>
        </div>
        {/* Related videos */}
        <RelatedVideos
          currentVideoId={battleReport.youtube_video_id}
          categoryIds={categoryIdsForRelated}
        />

        {/* Cross-system recommendations */}
        <CrossSystemRecommendations
          currentGameSystem={battleReport.game_system ?? classifyGameSystem(battleReport.title)}
          factionSlugs={uniqueCategorySlugs}
        />
      </main>
    </>
  );
}
