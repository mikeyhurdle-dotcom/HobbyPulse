import Link from "next/link";
import Image from "next/image";
import { Nav } from "@/components/nav";
import { JsonLd } from "@/components/json-ld";
import { getSiteVertical, getSiteBrand } from "@/lib/site";
import { websiteSchema } from "@/lib/structured-data";
import { supabase } from "@/lib/supabase";
import { classifyGameSystem, isShort } from "@/lib/classify";
import { getGameSystem } from "@/config/game-systems";
import { Play, TrendingUp, Radio, ArrowRight, Zap, Dice5, Star, Users, Clock, Rocket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewsletterForm } from "@/components/newsletter-form";
import { ProductImage } from "@/components/product-image";
import { PriceDropBadge } from "@/components/price-drop-badge";
import { getTopPriceDropsForVertical, type ProductDrop } from "@/lib/price-drops";
import { wrapAffiliateUrl } from "@/lib/affiliate";
import { TrendingDown } from "lucide-react";
import { listAllArticles, articleTypeLabels, articleTypeRoutes } from "@/lib/boardgame-articles";
import { getFeaturedGame, getHomeTrendingGames } from "@/lib/featured-game";
import type { BoardGame } from "@/lib/board-game-db";
import {
  getEndingSoonHero,
  formatPercent,
  daysLeft,
  type KickstarterRow,
} from "@/lib/kickstarter";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FeaturedVideo {
  id: string;
  youtube_video_id: string;
  title: string;
  thumbnail_url: string | null;
  published_at: string;
  view_count: number;
  duration_seconds: number;
  game_system: string | null;
  channels: { name: string; thumbnail_url: string | null }[];
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getHomeData() {
  const config = getSiteVertical();

  // Resolve vertical UUID
  const { data: verticalRow } = await supabase
    .from("verticals")
    .select("id")
    .eq("slug", config.slug)
    .single();

  const verticalId = verticalRow?.id;

  const isTabletopFetch = config.slug === "tabletop";

  const [
    videosRes,
    liveRes,
    topDrops,
    featuredGame,
    trendingGames,
    bgVideoCountRes,
    bgLatestRes,
    bgGameCountRes,
    kickstarterHero,
  ] = await Promise.all([
    supabase
      .from("battle_reports")
      .select("id, youtube_video_id, title, thumbnail_url, published_at, view_count, duration_seconds, game_system, channels(name, thumbnail_url)")
      .eq("vertical_id", verticalId ?? "")
      .order("published_at", { ascending: false })
      .limit(200),
    supabase
      .from("live_streams")
      .select("id", { count: "exact", head: true })
      .eq("vertical_id", verticalId ?? "")
      .eq("is_live", true)
      .gte("last_seen_at", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()),
    verticalId ? getTopPriceDropsForVertical(verticalId, 6) : Promise.resolve([] as ProductDrop[]),
    isTabletopFetch ? getFeaturedGame() : Promise.resolve(null),
    isTabletopFetch ? getHomeTrendingGames(6) : Promise.resolve([] as BoardGame[]),
    // Board game video stats (TabletopWatch only)
    isTabletopFetch
      ? supabase.from("board_game_videos").select("id", { count: "exact", head: true })
      : Promise.resolve({ count: 0 }),
    isTabletopFetch
      ? supabase
          .from("board_game_videos")
          .select("id, youtube_video_id, title, thumbnail_url, published_at, duration_seconds, view_count, content_type, board_game_channels(channel_name)")
          .order("published_at", { ascending: false })
          .limit(6)
      : Promise.resolve({ data: [] }),
    isTabletopFetch
      ? supabase.from("board_games").select("id", { count: "exact", head: true })
      : Promise.resolve({ count: 0 }),
    isTabletopFetch ? getEndingSoonHero(3) : Promise.resolve([] as KickstarterRow[]),
  ]);

  const allVideos = (videosRes.data ?? []).filter(
    (v: { duration_seconds: number; title: string }) =>
      !isShort(v.duration_seconds) && !v.title.toLowerCase().includes("#shorts"),
  );

  // Pick featured: latest 6 non-short videos
  const featured = allVideos.slice(0, 6);

  return {
    totalVideos: allVideos.length,
    liveNow: liveRes.count ?? 0,
    featured,
    channels: config.channels.length,
    topDrops,
    featuredGame,
    trendingGames,
    bgVideoCount: bgVideoCountRes.count ?? 0,
    bgLatestVideos: ((bgLatestRes.data ?? []) as unknown as {
      id: string;
      youtube_video_id: string;
      title: string;
      thumbnail_url: string | null;
      published_at: string;
      duration_seconds: number | null;
      view_count: number | null;
      content_type: string | null;
      board_game_channels: { channel_name: string } | null;
    }[]),
    bgGameCount: bgGameCountRes.count ?? 0,
    kickstarterHero,
  };
}

// Revalidate the homepage hourly so drops stay fresh without per-request DB load
export const revalidate = 3600;

function formatPrice(pence: number): string {
  return `\u00A3${(pence / 100).toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// Helper: format view count
// ---------------------------------------------------------------------------

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Home Page
// ---------------------------------------------------------------------------

export default async function HomePage() {
  const config = getSiteVertical();
  const brand = getSiteBrand();
  const data = await getHomeData();

  const isTabletop = config.slug === "tabletop";
  const ctaLink = isTabletop ? "/boardgames/recommend" : "/setups";
  const ctaLabel = isTabletop ? "What Should I Play?" : "Car Setups";
  const ctaDescription = isTabletop
    ? "Answer 4 quick questions and get personalised board game recommendations."
    : "Browse car setups extracted from the best sim racers.";

  // Board game articles for TabletopWatch homepage
  const boardGameArticles = isTabletop ? listAllArticles().slice(0, 3) : [];

  return (
    <>
      <JsonLd data={websiteSchema()} />
      <Nav active="" />
      <main>
        {/* ============================================================= */}
        {/* Hero Section                                                   */}
        {/* ============================================================= */}
        <section className="relative overflow-hidden border-b border-border">
          {/* Gradient background */}
          <div
            className="absolute inset-0 opacity-30 dark:opacity-20"
            style={{
              background: `radial-gradient(ellipse 80% 50% at 50% -20%, var(--vertical-accent), transparent)`,
            }}
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <div className="max-w-2xl">
              <h1 className="mb-4">
                {brand.logo ? (
                  <Image
                    src={brand.logo}
                    alt={brand.siteName}
                    width={600}
                    height={150}
                    className="h-16 sm:h-24 lg:h-32 w-auto"
                    priority
                  />
                ) : (
                  <span className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                    {brand.siteName}
                  </span>
                )}
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed">
                {isTabletop
                  ? "Your guide to tabletop gaming \u2014 board games first. Reviews, video guides, deals, and the latest from Kickstarter."
                  : brand.tagline}
              </p>
              <div className="flex flex-wrap gap-3">
                {isTabletop ? (
                  <>
                    <Link
                      href="/boardgames"
                      className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold bg-[var(--vertical-accent)] text-white hover:opacity-90 transition-opacity"
                    >
                      <Dice5 className="w-4 h-4" />
                      Browse Board Games
                    </Link>
                    <Link
                      href="/boardgames/watch"
                      className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold border border-border bg-background hover:bg-secondary transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      Watch Reviews
                    </Link>
                    <Link
                      href="/kickstarter"
                      className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold border border-[var(--vertical-accent)]/40 bg-[var(--vertical-accent-glow)] text-[var(--vertical-accent)] hover:bg-[var(--vertical-accent)] hover:text-white transition-colors"
                    >
                      <Rocket className="w-4 h-4" />
                      Track live Kickstarters
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/watch"
                      className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold bg-[var(--vertical-accent)] text-white hover:opacity-90 transition-opacity"
                    >
                      <Play className="w-4 h-4" />
                      Browse Replays
                    </Link>
                    <Link
                      href={ctaLink}
                      className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold border border-border bg-background hover:bg-secondary transition-colors"
                    >
                      <Zap className="w-4 h-4" />
                      {ctaLabel}
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-border/50">
              {isTabletop && data.bgGameCount > 0 && (
                <div>
                  <p className="text-3xl font-bold tracking-tight font-[family-name:var(--font-mono)]">
                    {data.bgGameCount.toLocaleString()}+
                  </p>
                  <p className="text-sm text-muted-foreground">Games Reviewed</p>
                </div>
              )}
              <div>
                <p className="text-3xl font-bold tracking-tight font-[family-name:var(--font-mono)]">
                  {isTabletop && data.bgVideoCount > 0
                    ? data.bgVideoCount.toLocaleString()
                    : data.totalVideos.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isTabletop ? "Board Game Videos" : "Race Replays"}
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold tracking-tight font-[family-name:var(--font-mono)]">
                  {isTabletop ? config.channels.length : data.channels}
                </p>
                <p className="text-sm text-muted-foreground">Channels Tracked</p>
              </div>
              {data.liveNow > 0 && (
                <div>
                  <p className="text-3xl font-bold tracking-tight font-[family-name:var(--font-mono)] text-danger">
                    {data.liveNow}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
                    Live Now
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ============================================================= */}
        {/* Top Drops Right Now                                            */}
        {/* ============================================================= */}
        {data.topDrops.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 border-b border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--danger)] mb-2">
                  <TrendingDown className="w-3 h-3" />
                  Price drops
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Dropping Right Now
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Biggest price drops tracked in the last 7 days.
                </p>
              </div>
              <Link
                href={isTabletop ? "/miniatures/trending" : "/trending"}
                className="inline-flex items-center gap-1 text-sm font-medium text-[var(--danger)] hover:underline whitespace-nowrap"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {data.topDrops.map((d: ProductDrop) => {
                const buyUrl = wrapAffiliateUrl(d.affiliateUrl || d.sourceUrl, "home-drops");
                return (
                  <div
                    key={d.productId}
                    className="group rounded-xl border border-border bg-card overflow-hidden hover:border-[var(--danger)]/40 transition-all"
                  >
                    <Link href={`/deals/${d.productSlug}`} className="block">
                      <div className="relative aspect-square bg-[var(--surface-hover)]">
                        {d.productImageUrl ? (
                          <ProductImage
                            src={d.productImageUrl}
                            alt={d.productName}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                            className="object-contain p-2"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--muted)] text-[10px]">
                            No image
                          </div>
                        )}
                        <span className="absolute top-1.5 left-1.5">
                          <PriceDropBadge dropPercent={d.dropPercent} />
                        </span>
                      </div>
                    </Link>
                    <div className="p-2.5 space-y-1.5">
                      <Link href={`/deals/${d.productSlug}`}>
                        <h3 className="text-[11px] font-medium leading-snug line-clamp-2 group-hover:text-[var(--vertical-accent-light)] transition-colors min-h-[28px]">
                          {d.productName}
                        </h3>
                      </Link>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-bold text-[var(--success)]">
                          {formatPrice(d.newPrice)}
                        </span>
                        <span className="text-[10px] text-[var(--muted)] line-through">
                          {formatPrice(d.oldPrice)}
                        </span>
                      </div>
                      <a
                        href={buyUrl}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="block text-center rounded-md bg-[var(--vertical-accent)] text-white text-[10px] font-semibold py-1.5 hover:opacity-90 transition-opacity"
                      >
                        Buy at {d.source}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ============================================================= */}
        {/* Featured Game of the Week (TabletopWatch only)                 */}
        {/* ============================================================= */}
        {isTabletop && data.featuredGame && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 border-b border-border">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--vertical-accent)]/40 bg-[var(--vertical-accent)]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--vertical-accent-light)] mb-3">
              <Star className="w-3 h-3" />
              Game of the Week
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <Link href={`/boardgames/games/${data.featuredGame.slug}`}>
                  <div className="rounded-xl border border-border bg-card overflow-hidden hover:border-[var(--vertical-accent)]/40 transition-all">
                    {data.featuredGame.image_url ? (
                      <img
                        src={data.featuredGame.image_url}
                        alt={data.featuredGame.title}
                        className="w-full aspect-square object-contain p-4 bg-white"
                      />
                    ) : (
                      <div className="w-full aspect-square flex items-center justify-center bg-muted text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                </Link>
              </div>
              <div className="md:col-span-2 flex flex-col justify-center">
                <Link href={`/boardgames/games/${data.featuredGame.slug}`}>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 hover:text-[var(--vertical-accent-light)] transition-colors">
                    {data.featuredGame.title}
                  </h2>
                </Link>
                {data.featuredGame.year_published && (
                  <span className="text-sm text-muted-foreground mb-3">
                    ({data.featuredGame.year_published})
                  </span>
                )}
                <div className="flex flex-wrap gap-4 mb-4">
                  {data.featuredGame.bgg_rating != null && (
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-semibold">{data.featuredGame.bgg_rating.toFixed(1)}/10</span>
                    </div>
                  )}
                  {data.featuredGame.min_players != null && data.featuredGame.max_players != null && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      {data.featuredGame.min_players}-{data.featuredGame.max_players} players
                    </div>
                  )}
                  {data.featuredGame.play_time_min != null && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {data.featuredGame.play_time_min}-{data.featuredGame.play_time_max} min
                    </div>
                  )}
                </div>
                {data.featuredGame.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                    {data.featuredGame.description}
                  </p>
                )}
                <Link
                  href={`/boardgames/games/${data.featuredGame.slug}`}
                  className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold bg-[var(--vertical-accent)] text-white hover:opacity-90 transition-opacity self-start"
                >
                  View Game <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================= */}
        {/* Trending Games (TabletopWatch only)                            */}
        {/* ============================================================= */}
        {isTabletop && data.trendingGames.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Top Ranked Games
              </h2>
              <Link
                href="/boardgames/games"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Browse all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {data.trendingGames.map((game: BoardGame) => (
                <Link
                  key={game.id}
                  href={`/boardgames/games/${game.slug}`}
                  className="group rounded-xl border border-border bg-card overflow-hidden hover:border-[var(--vertical-accent)]/40 transition-all"
                >
                  <div className="relative aspect-square bg-muted">
                    {game.thumbnail_url ? (
                      <img
                        src={game.thumbnail_url}
                        alt={game.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">
                        No image
                      </div>
                    )}
                    {game.bgg_rank && (
                      <span className="absolute top-1.5 left-1.5 bg-black/75 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        #{game.bgg_rank}
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <h3 className="text-[11px] font-medium leading-snug line-clamp-2 group-hover:text-[var(--vertical-accent-light)] transition-colors min-h-[28px]">
                      {game.title}
                    </h3>
                    {game.bgg_rating != null && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                        <span className="text-[10px] font-semibold">{game.bgg_rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ============================================================= */}
        {/* Latest Board Game Videos (TabletopWatch only)                  */}
        {/* ============================================================= */}
        {isTabletop && data.bgLatestVideos.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Latest Board Game Videos
              </h2>
              <Link
                href="/boardgames/watch"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Watch all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.bgLatestVideos.map((video) => {
                const ctLabel: Record<string, { label: string; colour: string }> = {
                  review: { label: "Review", colour: "#3b82f6" },
                  "top-list": { label: "Top List", colour: "#8b5cf6" },
                  "how-to-play": { label: "How to Play", colour: "#22c55e" },
                  comparison: { label: "Comparison", colour: "#f59e0b" },
                  playthrough: { label: "Playthrough", colour: "#ec4899" },
                  news: { label: "News", colour: "#06b6d4" },
                  other: { label: "Other", colour: "#6b7280" },
                };
                const ct = ctLabel[video.content_type ?? "other"] ?? ctLabel.other;
                return (
                  <a
                    key={video.id}
                    href={`https://www.youtube.com/watch?v=${video.youtube_video_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <Card className="overflow-hidden border-border bg-card hover:border-[var(--vertical-accent)]/40 transition-all">
                      <div className="relative aspect-video bg-muted">
                        {video.thumbnail_url && (
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        )}
                        <Badge
                          className="absolute top-2 left-2 text-[10px] border-0"
                          style={{ backgroundColor: `${ct.colour}dd`, color: "#fff" }}
                        >
                          {ct.label}
                        </Badge>
                        {video.duration_seconds != null && video.duration_seconds > 0 && (
                          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-medium font-[family-name:var(--font-mono)] bg-black/75 text-white">
                            {(() => {
                              const m = Math.floor(video.duration_seconds! / 60);
                              const s = video.duration_seconds! % 60;
                              return `${m}:${s.toString().padStart(2, "0")}`;
                            })()}
                          </span>
                        )}
                      </div>
                      <CardContent className="p-3.5">
                        <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-[var(--vertical-accent-light)] transition-colors">
                          {video.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          {video.board_game_channels?.channel_name && (
                            <span>{video.board_game_channels.channel_name}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* ============================================================= */}
        {/* Board Game Articles (TabletopWatch only)                       */}
        {/* ============================================================= */}
        {isTabletop && boardGameArticles.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Latest Board Game Articles
              </h2>
              <Link
                href="/boardgames"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {boardGameArticles.map((article) => (
                <Link
                  key={`${article.articleType}-${article.slug}`}
                  href={`/boardgames/${articleTypeRoutes[article.articleType]}/${article.slug}`}
                  className="group"
                >
                  <Card className="h-full overflow-hidden border-border bg-card hover:border-[var(--vertical-accent)]/40 transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {articleTypeLabels[article.articleType]}
                        </Badge>
                      </div>
                      <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-[var(--vertical-accent-light)] transition-colors">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                          {article.excerpt}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ============================================================= */}
        {/* Kickstarter Featured (TabletopWatch only)                      */}
        {/* ============================================================= */}
        {isTabletop && data.kickstarterHero.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-[var(--vertical-accent)]" />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Ending soon on Kickstarter
                </h2>
                <span className="ml-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wider bg-[var(--vertical-accent)] text-white">
                  NEW
                </span>
              </div>
              <Link
                href="/kickstarter"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Open tracker
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.kickstarterHero.map((p) => {
                const days = daysLeft(p.ends_at);
                return (
                  <Link key={p.id} href={`/kickstarter/${p.slug}`} className="group">
                    <Card className="overflow-hidden border-border bg-card hover:border-[var(--vertical-accent)]/40 transition-all">
                      {p.image_url && (
                        <div className="relative aspect-video bg-muted overflow-hidden">
                          <img
                            src={p.image_url}
                            alt={p.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {p.funded_percent != null && (
                            <Badge
                              className="absolute top-2 left-2 text-[10px] border-0"
                              style={{
                                backgroundColor:
                                  p.funded_percent >= 100
                                    ? "var(--success)"
                                    : "var(--vertical-accent)",
                                color: "#fff",
                              }}
                            >
                              {formatPercent(p.funded_percent)} funded
                            </Badge>
                          )}
                          {days != null && (
                            <Badge className="absolute top-2 right-2 text-[10px] border-0 bg-black/75 text-white">
                              {days === 0
                                ? "Final hours"
                                : days === 1
                                  ? "1 day left"
                                  : `${days} days left`}
                            </Badge>
                          )}
                        </div>
                      )}
                      <CardContent className="p-4 space-y-1">
                        <h3 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-[var(--vertical-accent-light)] transition-colors">
                          {p.title}
                        </h3>
                        {p.creator && (
                          <p className="text-xs text-muted-foreground truncate">by {p.creator}</p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ============================================================= */}
        {/* Featured Content                                               */}
        {/* ============================================================= */}
        {data.featured.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                {isTabletop ? "Miniatures Content" : "Latest Replays"}
              </h2>
              <Link
                href={isTabletop ? "/miniatures/watch" : "/watch"}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.featured.map((video: FeaturedVideo) => {
                const gameSystem = classifyGameSystem(video.title);
                const gs = getGameSystem(gameSystem);
                return (
                  <Link
                    key={video.id}
                    href={`${isTabletop ? "/miniatures" : ""}/watch/${video.youtube_video_id}`}
                    className="group"
                  >
                    <Card className="overflow-hidden border-border bg-card hover:border-[var(--vertical-accent)]/40 transition-all">
                      <div className="relative aspect-video bg-muted">
                        {video.thumbnail_url && (
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        )}
                        {/* Duration badge */}
                        {(video.duration_seconds) > 0 && (
                          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-medium font-[family-name:var(--font-mono)] bg-black/75 text-white">
                            {formatDuration(video.duration_seconds)}
                          </span>
                        )}
                        {/* Game system badge */}
                        {gs && (
                          <Badge
                            variant="secondary"
                            className="absolute top-2 left-2 text-[10px]"
                            style={{ backgroundColor: gs.colour, color: "#fff" }}
                          >
                            {gs.shortName}
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-3.5">
                        <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-[var(--vertical-accent-light)] transition-colors">
                          {video.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          {video.channels?.[0]?.name && <span>{video.channels[0].name}</span>}
                          {(video.view_count) > 0 && (
                            <>
                              <span>·</span>
                              <span>{formatViews(video.view_count)} views</span>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ============================================================= */}
        {/* Feature Highlight: Build / Setups CTA                          */}
        {/* ============================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <Card className="border-border bg-card overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row items-center gap-6 p-6 sm:p-8">
                <div
                  className="flex items-center justify-center w-14 h-14 rounded-xl shrink-0"
                  style={{ backgroundColor: "var(--vertical-accent)", opacity: 0.15 }}
                >
                  <Zap className="w-7 h-7 text-[var(--vertical-accent)]" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-lg font-bold tracking-tight mb-1">
                    {ctaLabel}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {ctaDescription}
                  </p>
                </div>
                <Link
                  href={ctaLink}
                  className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold bg-[var(--vertical-accent)] text-white hover:opacity-90 transition-opacity shrink-0"
                >
                  Try it <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ============================================================= */}
        {/* Quick Navigation                                               */}
        {/* ============================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
          <div className={`grid grid-cols-1 gap-4 ${isTabletop ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"}`}>
            {(isTabletop
              ? [
                  {
                    label: "Games",
                    href: "/boardgames/games",
                    description:
                      "Browse 500+ board games with ratings, complexity, and where to buy.",
                    icon: Dice5,
                  },
                  {
                    label: "Reviews",
                    href: "/boardgames",
                    description:
                      "In-depth reviews, best-of lists, and how-to-play guides.",
                    icon: Star,
                  },
                  {
                    label: "Deals",
                    href: "/deals",
                    description: config.dealsDescription,
                    icon: TrendingUp,
                  },
                  {
                    label: "Miniatures",
                    href: "/miniatures/watch",
                    description: config.watchDescription,
                    icon: Play,
                  },
                ]
              : [
                  {
                    label: "Watch",
                    href: "/watch",
                    description: config.watchDescription,
                    icon: Play,
                  },
                  {
                    label: "Live",
                    href: "/live",
                    description: config.liveDescription,
                    icon: Radio,
                  },
                  {
                    label: "Deals",
                    href: "/deals",
                    description: config.dealsDescription,
                    icon: TrendingUp,
                  },
                ]
            ).map((link) => (
              <Link key={link.href} href={link.href} className="group">
                <Card className="h-full border-border bg-card hover:border-[var(--vertical-accent)]/40 transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <link.icon className="w-5 h-5 text-[var(--vertical-accent-light)]" />
                      <h3 className="text-base font-bold tracking-tight group-hover:text-[var(--vertical-accent-light)] transition-colors">
                        {link.label}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {link.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* ============================================================= */}
        {/* Tracked Channels                                               */}
        {/* ============================================================= */}
        <section className="border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <div className={isTabletop && config.miniatureChannels && config.miniatureChannels.length > 0 ? "mb-8" : ""}>
              <h2 className="text-lg font-bold tracking-tight mb-4">
                {isTabletop ? "Board Game Channels" : "Tracked Channels"}
              </h2>
              <div className="flex flex-wrap gap-2">
                {config.channels.map((channel) => (
                  <Badge key={channel} variant="secondary" className="text-xs">
                    {channel}
                  </Badge>
                ))}
              </div>
            </div>
            {isTabletop && config.miniatureChannels && config.miniatureChannels.length > 0 && (
              <div className="opacity-75">
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">
                    Miniatures Corner
                  </h3>
                  <Link href="/miniatures/watch" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Browse miniatures →
                  </Link>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {config.miniatureChannels.map((channel) => (
                    <Badge key={channel} variant="outline" className="text-[10px] font-normal">
                      {channel}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ============================================================= */}
        {/* Newsletter Signup                                              */}
        {/* ============================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
          <NewsletterForm vertical={config.slug} />
        </section>
      </main>
    </>
  );
}
