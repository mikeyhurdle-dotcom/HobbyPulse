import Link from "next/link";
import { Nav } from "@/components/nav";
import { JsonLd } from "@/components/json-ld";
import { getSiteVertical, getSiteBrand } from "@/lib/site";
import { websiteSchema } from "@/lib/structured-data";
import { supabase } from "@/lib/supabase";
import { classifyGameSystem, isShort } from "@/lib/classify";
import { getGameSystem } from "@/config/game-systems";
import { Play, TrendingUp, Radio, ArrowRight, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewsletterForm } from "@/components/newsletter-form";
import { ProductImage } from "@/components/product-image";
import { PriceDropBadge } from "@/components/price-drop-badge";
import { getTopPriceDropsForVertical, type ProductDrop } from "@/lib/price-drops";
import { wrapAffiliateUrl } from "@/lib/affiliate";
import { TrendingDown } from "lucide-react";

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

  const [videosRes, liveRes, topDrops] = await Promise.all([
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
      .eq("is_live", true),
    verticalId ? getTopPriceDropsForVertical(verticalId, 6) : Promise.resolve([] as ProductDrop[]),
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

  const isTabletop = config.slug === "warhammer";
  const ctaLink = isTabletop ? "/build" : "/setups";
  const ctaLabel = isTabletop ? "Build My Army Cheap" : "Car Setups";
  const ctaDescription = isTabletop
    ? "Paste an army list, find every unit at the best price."
    : "Browse car setups extracted from the best sim racers.";

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
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
                {brand.siteName}
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed">
                {brand.tagline}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/watch"
                  className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold bg-[var(--vertical-accent)] text-white hover:opacity-90 transition-opacity"
                >
                  <Play className="w-4 h-4" />
                  Browse {isTabletop ? "Battle Reports" : "Replays"}
                </Link>
                <Link
                  href={ctaLink}
                  className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold border border-border bg-background hover:bg-secondary transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  {ctaLabel}
                </Link>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-border/50">
              <div>
                <p className="text-3xl font-bold tracking-tight font-[family-name:var(--font-mono)]">
                  {data.totalVideos.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isTabletop ? "Battle Reports" : "Race Replays"}
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold tracking-tight font-[family-name:var(--font-mono)]">
                  {data.channels}
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
                href="/trending"
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
        {/* Featured Content                                               */}
        {/* ============================================================= */}
        {data.featured.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Latest {isTabletop ? "Reports" : "Replays"}
              </h2>
              <Link
                href="/watch"
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
                    href={`/watch/${video.youtube_video_id}`}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
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
            ].map((link) => (
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
            <h2 className="text-lg font-bold tracking-tight mb-4">
              Tracked Channels
            </h2>
            <div className="flex flex-wrap gap-2">
              {config.channels.map((channel) => (
                <Badge key={channel} variant="secondary" className="text-xs">
                  {channel}
                </Badge>
              ))}
            </div>
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
