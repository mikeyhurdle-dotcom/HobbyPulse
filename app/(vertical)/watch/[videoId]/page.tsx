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
import { getGameSystem, SIMRACING_SYSTEMS } from "@/config/game-systems";
import { RulesBadge } from "@/components/rules-badge";
import { FactionMeta } from "@/components/faction-meta";
import { wahapediaLink } from "@/lib/external-links";
import { CopySetupButton } from "@/components/copy-setup-button";
import { ArrowLeft, Trophy, ShoppingCart, BookOpen, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  winner: string | null;
  key_moments: string | null;
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

interface CarSetup {
  id: string;
  sim: string;
  car: string;
  track: string | null;
  setup_data: Record<string, string>;
  hardware_mentioned: string[] | null;
  confidence: number;
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
         id, player_name, detachment, total_points, list_index, winner, key_moments,
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

  const sortedLists = [...(battleReport.content_lists ?? [])].sort(
    (a, b) => a.list_index - b.list_index,
  );
  for (const list of sortedLists) {
    list.list_items?.sort((a, b) => a.sort_order - b.sort_order);
  }

  const isSimRacing = config.slug === "simracing";
  let carSetups: CarSetup[] = [];
  if (isSimRacing) {
    const { data: setups } = await supabase
      .from("car_setups")
      .select("id, sim, car, track, setup_data, hardware_mentioned, confidence")
      .eq("battle_report_id", battleReport.id)
      .order("confidence", { ascending: false });
    if (setups) {
      carSetups = setups as CarSetup[];
    }
  }

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
  const gameSystemId = battleReport.game_system ?? classifyGameSystem(battleReport.title);
  const gs = getGameSystem(gameSystemId);
  const ct = classifyVideo(battleReport.title, battleReport.duration_seconds);
  const ctCfg = VIDEO_TYPE_CONFIG[ct];
  const winnerList = sortedLists.find((l) => l.winner);
  const hasArmyLists = sortedLists.length > 0 && sortedLists.some((l) => (l.list_items ?? []).length > 0);

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
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Watch
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ============================================================= */}
          {/* Video column                                                   */}
          {/* ============================================================= */}
          <div className="lg:col-span-2 space-y-5">
            {/* YouTube embed */}
            <div className="aspect-video rounded-xl overflow-hidden border border-border bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${battleReport.youtube_video_id}`}
                title={battleReport.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              />
            </div>

            {/* Title + meta */}
            <div>
              {/* Winner badge — prominent */}
              {winnerList?.winner && (
                <div className="inline-flex items-center gap-2 rounded-lg bg-success/15 border border-success/30 px-3 py-2 text-sm font-bold text-success mb-3">
                  <Trophy className="w-4 h-4" />
                  {winnerList.winner} wins!
                </div>
              )}

              <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-snug mb-3">
                {battleReport.title}
              </h1>

              {/* Badges row */}
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <Badge
                  className="border-0 text-xs"
                  style={{ backgroundColor: gs.colour, color: "#fff" }}
                >
                  {gs.icon} {gs.name}
                </Badge>
                <Badge
                  className="border-0 text-xs"
                  style={{ backgroundColor: ctCfg.colour, color: "#fff" }}
                >
                  {ctCfg.icon} {ctCfg.label}
                </Badge>
                <RulesBadge
                  gameSystem={gameSystemId}
                  publishedAt={battleReport.published_at}
                />
              </div>

              {/* Channel info */}
              <div className="flex items-center gap-3">
                {battleReport.channels?.thumbnail_url ? (
                  <img
                    src={battleReport.channels.thumbnail_url}
                    alt={battleReport.channels.name ?? ""}
                    className="w-9 h-9 rounded-full"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs shrink-0">
                    ?
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">
                    {battleReport.channels?.name ?? "Unknown channel"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatViews(battleReport.view_count)} · {formatDate(battleReport.published_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Key moments */}
            {sortedLists.some((l) => l.key_moments) && (
              <Card className="border-border bg-card">
                <CardContent className="p-4">
                  <h3 className="text-sm font-bold mb-2">Key Moments</h3>
                  <div className="space-y-2">
                    {sortedLists
                      .filter((l) => l.key_moments)
                      .map((l) => (
                        <p key={l.id} className="text-sm text-muted-foreground leading-relaxed">
                          {l.key_moments}
                        </p>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description (collapsible) */}
            {battleReport.description && (
              <details className="group">
                <summary className="flex items-center gap-2 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  <span className="transition-transform group-open:rotate-90">&#9654;</span>
                  Video Description
                </summary>
                <Card className="mt-2 border-border bg-card">
                  <CardContent className="p-4">
                    <pre className="text-xs text-muted-foreground font-[family-name:var(--font-body)] whitespace-pre-wrap break-words leading-relaxed">
                      {battleReport.description}
                    </pre>
                  </CardContent>
                </Card>
              </details>
            )}
          </div>

          {/* ============================================================= */}
          {/* Sidebar                                                        */}
          {/* ============================================================= */}
          <div className="space-y-5">
            {isSimRacing ? (
              <>
                {/* Car Setups */}
                {carSetups.length > 0 && (
                  <>
                    <h2 className="text-lg font-bold tracking-tight">Car Setups</h2>
                    {carSetups.map((setup) => {
                      const simKey = setup.sim.toLowerCase().replace(/\s+/g, "");
                      const simSystem = SIMRACING_SYSTEMS[simKey];
                      const simColour = simSystem?.colour ?? "var(--vertical-accent)";

                      const setupLines = Object.entries(setup.setup_data ?? {})
                        .filter(([, v]) => v !== undefined && v !== "")
                        .map(([k, v]) => {
                          const label = k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
                          return `${label}: ${v}`;
                        });
                      const copyText = [
                        `Sim: ${setup.sim}`,
                        `Car: ${setup.car}`,
                        setup.track ? `Track: ${setup.track}` : null,
                        "",
                        ...setupLines,
                      ]
                        .filter((l) => l !== null)
                        .join("\n");

                      return (
                        <Card key={setup.id} className="border-border bg-card overflow-hidden">
                          <div className="px-4 py-3 border-b border-border bg-secondary">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className="border-0 text-[10px]" style={{ backgroundColor: simColour, color: "#fff" }}>
                                {setup.sim}
                              </Badge>
                              <span className="text-sm font-medium">{setup.car}</span>
                            </div>
                            {setup.track && (
                              <p className="text-xs text-muted-foreground mt-1">{setup.track}</p>
                            )}
                          </div>

                          {Object.keys(setup.setup_data ?? {}).length > 0 && (
                            <CardContent className="p-4">
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                {Object.entries(setup.setup_data ?? {})
                                  .filter(([, v]) => v !== undefined && v !== "")
                                  .map(([key, value]) => {
                                    const label = key
                                      .replace(/([A-Z])/g, " $1")
                                      .replace(/^./, (s) => s.toUpperCase());
                                    return (
                                      <div key={key} className="min-w-0">
                                        <p className="text-[10px] text-muted-foreground truncate">{label}</p>
                                        <p className="text-sm font-medium font-[family-name:var(--font-mono)]">{value}</p>
                                      </div>
                                    );
                                  })}
                              </div>
                              <div className="mt-3">
                                <CopySetupButton text={copyText} />
                              </div>
                            </CardContent>
                          )}

                          {setup.hardware_mentioned && setup.hardware_mentioned.length > 0 && (
                            <div className="px-4 py-3 border-t border-border">
                              <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider font-medium">
                                Hardware mentioned
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {setup.hardware_mentioned.map((hw) => (
                                  <Link
                                    key={hw}
                                    href={`/deals?q=${encodeURIComponent(hw)}`}
                                    className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium border border-border text-muted-foreground hover:text-foreground hover:border-[var(--vertical-accent)] transition-colors"
                                  >
                                    {hw}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </>
                )}
              </>
            ) : (
              <>
                {/* Army Lists — only show if we have parsed data */}
                {hasArmyLists && (
                  <>
                    <h2 className="text-lg font-bold tracking-tight">Army Lists</h2>

                    {sortedLists.map((list) => {
                      if ((list.list_items ?? []).length === 0) return null;

                      const armyListText = (list.list_items ?? [])
                        .map((item) =>
                          `${item.quantity > 1 ? `${item.quantity}x ` : ""}${item.name} [${item.points} pts]`,
                        )
                        .join("\n");

                      const isWinner = list.winner != null;

                      return (
                        <div key={list.id} className="space-y-2">
                          <Card className={`border-border bg-card overflow-hidden ${isWinner ? "ring-1 ring-success/30" : ""}`}>
                            {/* List header */}
                            <div className="px-4 py-3 border-b border-border bg-secondary">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {list.categories && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px]"
                                      style={{
                                        borderColor: list.categories.colour ?? undefined,
                                        color: list.categories.colour ?? undefined,
                                        backgroundColor: list.categories.colour
                                          ? `${list.categories.colour}15`
                                          : undefined,
                                      }}
                                    >
                                      {list.categories.name}
                                    </Badge>
                                  )}
                                  {list.player_name && (
                                    <span className="text-sm font-medium">
                                      {list.player_name}
                                    </span>
                                  )}
                                  {isWinner && (
                                    <Badge className="border-0 bg-success/15 text-success text-[10px]">
                                      <Trophy className="w-3 h-3 mr-0.5" />
                                      Winner
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs font-[family-name:var(--font-mono)] text-muted-foreground">
                                  {list.total_points} pts
                                </span>
                              </div>
                              {list.detachment && (
                                <p className="text-xs text-muted-foreground mt-1">{list.detachment}</p>
                              )}
                              {list.categories && (
                                <div className="mt-2">
                                  <FactionMeta
                                    factionName={list.categories.name}
                                    gameSystem={gameSystemId}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Unit rows */}
                            <div className="divide-y divide-border">
                              {(list.list_items ?? []).map((item) => (
                                <div
                                  key={item.id}
                                  className="px-4 py-2.5 hover:bg-secondary/50 transition-colors"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <span className="flex items-center gap-1.5">
                                        <Link
                                          href={`/deals?q=${encodeURIComponent(item.name)}`}
                                          className="text-sm font-medium hover:text-[var(--vertical-accent-light)] transition-colors"
                                          title={`Find deals for ${item.name}`}
                                        >
                                          {item.quantity > 1 && (
                                            <span className="text-muted-foreground mr-1">
                                              {item.quantity}x
                                            </span>
                                          )}
                                          {item.name}
                                        </Link>
                                        <a
                                          href={`/deals?q=${encodeURIComponent(item.name)}`}
                                          className="opacity-40 hover:opacity-100 transition-opacity shrink-0"
                                          title={`Find deals for ${item.name}`}
                                        >
                                          <DollarSign className="w-3 h-3" />
                                        </a>
                                        <a
                                          href={wahapediaLink(item.name, gameSystemId)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="opacity-40 hover:opacity-100 transition-opacity shrink-0"
                                          title={`View ${item.name} datasheet on Wahapedia`}
                                        >
                                          <BookOpen className="w-3 h-3" />
                                        </a>
                                      </span>

                                      {item.enhancements && item.enhancements.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {item.enhancements.map((enh, i) => (
                                            <span
                                              key={i}
                                              className="text-[10px] text-[var(--vertical-accent-light)] bg-[var(--vertical-accent-glow)] rounded px-1.5 py-0.5"
                                            >
                                              {enh}
                                            </span>
                                          ))}
                                        </div>
                                      )}

                                      {item.wargear && item.wargear.length > 0 && (
                                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                          {item.wargear.join(", ")}
                                        </p>
                                      )}
                                    </div>
                                    <span className="text-xs font-[family-name:var(--font-mono)] text-muted-foreground whitespace-nowrap">
                                      {item.points} pts
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </Card>

                          {/* Buy This Army CTA */}
                          <Link
                            href={`/build?list=${encodeURIComponent(armyListText)}`}
                            className="flex items-center justify-center gap-2 w-full rounded-lg bg-[var(--vertical-accent)] px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Buy This Army
                          </Link>
                        </div>
                      );
                    })}
                  </>
                )}
              </>
            )}

            {/* Parse confidence — subtle */}
            {battleReport.parse_confidence != null &&
              battleReport.parse_confidence > 0 && hasArmyLists && (
                <p className="text-[10px] text-muted-foreground text-center">
                  Parse confidence: {Math.round(battleReport.parse_confidence * 100)}%
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
          currentGameSystem={gameSystemId}
          factionSlugs={uniqueCategorySlugs}
        />
      </main>
    </>
  );
}
