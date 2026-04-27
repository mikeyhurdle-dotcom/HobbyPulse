import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { JsonLd } from "@/components/json-ld";
import { BuyLinks } from "@/components/buy-links";
import { PriceComparisonStrip } from "@/components/price-comparison-strip";
import { getSiteVertical, getSiteBrand } from "@/lib/site";
import { getGameBySlug, getTopGameSlugs } from "@/lib/board-game-db";
import { getRetailerPricesForTitle } from "@/lib/price-comparison";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Clock,
  Brain,
  Star,
  Calendar,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";

export const revalidate = 3600;

// Pre-render top 100 games at build time
export async function generateStaticParams() {
  const slugs = await getTopGameSlugs(100);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const brand = getSiteBrand();
  const game = await getGameBySlug(slug);

  if (!game) {
    return { title: `Game Not Found | ${brand.siteName}` };
  }

  const playerText =
    game.min_players && game.max_players
      ? `${game.min_players}-${game.max_players} players`
      : "";
  const timeText = game.play_time_min ? `${game.play_time_min}-${game.play_time_max} min` : "";
  const desc = [
    game.description?.slice(0, 150),
    playerText,
    timeText,
    game.bgg_rating ? `Rated ${game.bgg_rating}/10 on BGG` : "",
  ]
    .filter(Boolean)
    .join(". ");

  return {
    title: `${game.title} | ${brand.siteName}`,
    description: desc,
    openGraph: {
      title: `${game.title} | ${brand.siteName}`,
      description: desc,
      type: "website",
      images: game.image_url ? [{ url: game.image_url }] : undefined,
    },
  };
}

function complexityLabel(c: number): string {
  if (c < 2) return "Light";
  if (c < 3) return "Medium";
  if (c < 4) return "Heavy";
  return "Very Heavy";
}

function complexityColour(c: number): string {
  if (c < 2) return "var(--success)";
  if (c < 3) return "#3b82f6";
  if (c < 4) return "#f59e0b";
  return "var(--danger)";
}

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const config = getSiteVertical();
  if (config.slug !== "tabletop") redirect("/");

  const { slug } = await params;
  const brand = getSiteBrand();
  const game = await getGameBySlug(slug);

  if (!game) notFound();

  // Resolve tabletop vertical_id (used for the price comparison join)
  const { data: verticalRow } = await supabase
    .from("verticals")
    .select("id")
    .eq("slug", "tabletop")
    .single();

  const retailerPrices = verticalRow
    ? await getRetailerPricesForTitle(game.title, verticalRow.id)
    : [];

  // Build buy links
  const buyLinks = [];
  if (game.amazon_asin) {
    buyLinks.push({ retailer: "Amazon", url: "", asin: game.amazon_asin });
  }
  if (game.zatu_url) {
    buyLinks.push({ retailer: "Zatu Games", url: game.zatu_url });
  }

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: game.title,
    description: game.description ?? undefined,
    image: game.image_url ?? undefined,
    url: `https://${brand.domain}/boardgames/games/${game.slug}`,
    aggregateRating: game.bgg_rating
      ? {
          "@type": "AggregateRating",
          ratingValue: game.bgg_rating,
          bestRating: 10,
          worstRating: 1,
          ratingCount: 1, // BGG aggregate
        }
      : undefined,
    brand: game.publishers?.[0]
      ? { "@type": "Organization", name: game.publishers[0] }
      : undefined,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <Nav active="boardgames" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <Link
          href="/boardgames/games"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Directory
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: Image */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                {game.image_url ? (
                  <img
                    src={game.image_url}
                    alt={game.title}
                    className="w-full aspect-square object-contain p-4 bg-white"
                  />
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center text-muted-foreground bg-muted">
                    No image
                  </div>
                )}
              </div>

              {/* Buy links */}
              {buyLinks.length > 0 && (
                <div className="mt-4">
                  <BuyLinks
                    gameName={game.title}
                    links={buyLinks}
                    source="game-page"
                  />
                </div>
              )}

              {/* Price comparison across active retailers */}
              {retailerPrices.length >= 2 && (
                <div className="mt-4">
                  <PriceComparisonStrip
                    prices={retailerPrices}
                    source={`game-page:${game.slug}`}
                  />
                </div>
              )}

              {/* BGG link */}
              <a
                href={`https://boardgamegeek.com/boardgame/${game.bgg_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
              >
                View on BoardGameGeek
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Right column: Details */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
                {game.title}
              </h1>
              {game.year_published && (
                <span className="text-sm text-muted-foreground">
                  ({game.year_published})
                </span>
              )}
            </div>

            {/* At a Glance */}
            <Card className="border-border bg-card">
              <CardContent className="p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                  At a Glance
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {game.bgg_rating != null && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10">
                        <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                      </div>
                      <div>
                        <p className="text-lg font-bold">
                          {game.bgg_rating.toFixed(1)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          BGG Rating
                        </p>
                      </div>
                    </div>
                  )}

                  {game.bgg_rank != null && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--vertical-accent)]/10">
                        <span className="text-sm font-bold text-[var(--vertical-accent)]">
                          #
                        </span>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{game.bgg_rank}</p>
                        <p className="text-[10px] text-muted-foreground">
                          BGG Rank
                        </p>
                      </div>
                    </div>
                  )}

                  {game.min_players != null && game.max_players != null && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10">
                        <Users className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-lg font-bold">
                          {game.min_players === game.max_players
                            ? game.min_players
                            : `${game.min_players}-${game.max_players}`}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Players
                        </p>
                      </div>
                    </div>
                  )}

                  {game.play_time_min != null && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/10">
                        <Clock className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-lg font-bold">
                          {game.play_time_min === game.play_time_max
                            ? `${game.play_time_min}`
                            : `${game.play_time_min}-${game.play_time_max}`}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Minutes
                        </p>
                      </div>
                    </div>
                  )}

                  {game.complexity != null && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/10">
                        <Brain className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-lg font-bold">
                          {game.complexity.toFixed(1)}/5
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          <Badge
                            variant="outline"
                            className="text-[9px] py-0 px-1"
                            style={{
                              borderColor: complexityColour(game.complexity),
                              color: complexityColour(game.complexity),
                            }}
                          >
                            {complexityLabel(game.complexity)}
                          </Badge>
                        </p>
                      </div>
                    </div>
                  )}

                  {game.min_age != null && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-500/10">
                        <Calendar className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-lg font-bold">{game.min_age}+</p>
                        <p className="text-[10px] text-muted-foreground">
                          Min Age
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {game.description && (
              <Card className="border-border bg-card">
                <CardContent className="p-5">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    About
                  </h2>
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                    {game.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Designers & Publishers */}
            {(game.designers.length > 0 || game.publishers.length > 0) && (
              <Card className="border-border bg-card">
                <CardContent className="p-5 space-y-4">
                  {game.designers.length > 0 && (
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Designers
                      </h2>
                      <div className="flex flex-wrap gap-1.5">
                        {game.designers.map((d) => (
                          <Badge key={d} variant="secondary" className="text-xs">
                            {d}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {game.publishers.length > 0 && (
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Publishers
                      </h2>
                      <div className="flex flex-wrap gap-1.5">
                        {game.publishers.map((p) => (
                          <Badge key={p} variant="outline" className="text-xs">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Categories & Mechanics */}
            {(game.categories.length > 0 || game.mechanics.length > 0) && (
              <Card className="border-border bg-card">
                <CardContent className="p-5 space-y-4">
                  {game.categories.length > 0 && (
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Categories
                      </h2>
                      <div className="flex flex-wrap gap-1.5">
                        {game.categories.map((c) => (
                          <Link
                            key={c}
                            href={`/boardgames/games?category=${encodeURIComponent(c)}`}
                          >
                            <Badge
                              variant="secondary"
                              className="text-xs hover:bg-[var(--vertical-accent)]/20 transition-colors cursor-pointer"
                            >
                              {c}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {game.mechanics.length > 0 && (
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Mechanics
                      </h2>
                      <div className="flex flex-wrap gap-1.5">
                        {game.mechanics.map((m) => (
                          <Badge key={m} variant="outline" className="text-xs">
                            {m}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
