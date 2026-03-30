import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { AdSidebar } from "@/components/ad-slot";
import { supabase } from "@/lib/supabase";
import { getSiteVertical } from "@/lib/site";

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
       view_count, duration_seconds, parse_confidence,
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

  return (
    <>
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
            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-snug">
                {battleReport.title}
              </h1>
              <div className="flex items-center gap-3">
                {battleReport.channels?.thumbnail_url && (
                  <img
                    src={battleReport.channels.thumbnail_url}
                    alt={battleReport.channels.name ?? ""}
                    className="w-8 h-8 rounded-full"
                  />
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
      </main>
    </>
  );
}
