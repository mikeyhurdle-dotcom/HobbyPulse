import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { getSiteVertical, getSiteBrand } from "@/lib/site";
import {
  listGames,
  type BoardGameSort,
} from "@/lib/board-game-db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Brain, Star } from "lucide-react";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const brand = getSiteBrand();
  return {
    title: `Board Game Directory | ${brand.siteName}`,
    description:
      "Browse 500+ board games with ratings, complexity, player counts, and where to buy. Find your next favourite game.",
    openGraph: {
      title: `Board Game Directory | ${brand.siteName}`,
      description:
        "Browse 500+ board games with ratings, complexity, player counts, and where to buy.",
      type: "website",
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

export default async function GamesDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    players?: string;
    complexity?: string;
    time?: string;
    category?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const config = getSiteVertical();
  if (config.slug !== "tabletop") redirect("/");

  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const PAGE_SIZE = 48;

  // Parse filters
  const players = params.players ? parseInt(params.players, 10) || undefined : undefined;

  let complexityMin: number | undefined;
  let complexityMax: number | undefined;
  if (params.complexity) {
    const ranges: Record<string, [number, number]> = {
      light: [0, 2],
      medium: [2, 3],
      heavy: [3, 4],
      "very-heavy": [4, 5],
    };
    const range = ranges[params.complexity];
    if (range) {
      complexityMin = range[0];
      complexityMax = range[1];
    }
  }

  let playTimeMax: number | undefined;
  if (params.time) {
    const times: Record<string, number> = {
      "30": 30,
      "60": 60,
      "120": 120,
    };
    playTimeMax = times[params.time];
  }

  const sort = (params.sort as BoardGameSort) || "rank";

  const { games, total } = await listGames(
    {
      search: params.q,
      players,
      complexityMin,
      complexityMax,
      playTimeMax,
      category: params.category,
    },
    sort,
    currentPage,
    PAGE_SIZE,
  );

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Build pagination URL helper
  function pageUrl(p: number): string {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.players) sp.set("players", params.players);
    if (params.complexity) sp.set("complexity", params.complexity);
    if (params.time) sp.set("time", params.time);
    if (params.category) sp.set("category", params.category);
    if (params.sort) sp.set("sort", params.sort);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/boardgames/games${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav active="boardgames" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Board Game Directory
        </h1>
        <p className="text-muted-foreground mb-6">
          Browse {total > 0 ? `${total.toLocaleString()} games` : "games"} ranked by BoardGameGeek.
        </p>

        {/* Filter bar */}
        <form className="flex flex-wrap gap-3 mb-8">
          <input
            type="text"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search games..."
            className="flex-1 min-w-[200px] rounded-lg border border-border bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vertical-accent)]"
          />

          <select
            name="players"
            defaultValue={params.players ?? ""}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vertical-accent)]"
          >
            <option value="">Any Players</option>
            <option value="1">Solo (1)</option>
            <option value="2">2 Players</option>
            <option value="3">3 Players</option>
            <option value="4">4 Players</option>
            <option value="5">5+ Players</option>
          </select>

          <select
            name="complexity"
            defaultValue={params.complexity ?? ""}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vertical-accent)]"
          >
            <option value="">Any Complexity</option>
            <option value="light">Light (1-2)</option>
            <option value="medium">Medium (2-3)</option>
            <option value="heavy">Heavy (3-4)</option>
            <option value="very-heavy">Very Heavy (4-5)</option>
          </select>

          <select
            name="time"
            defaultValue={params.time ?? ""}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vertical-accent)]"
          >
            <option value="">Any Length</option>
            <option value="30">Under 30 min</option>
            <option value="60">Under 1 hour</option>
            <option value="120">Under 2 hours</option>
          </select>

          <select
            name="sort"
            defaultValue={params.sort ?? "rank"}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vertical-accent)]"
          >
            <option value="rank">BGG Rank</option>
            <option value="rating">Highest Rated</option>
            <option value="alpha">A-Z</option>
            <option value="newest">Newest</option>
            <option value="complexity">Most Complex</option>
          </select>

          <button
            type="submit"
            className="rounded-lg bg-[var(--vertical-accent)] px-5 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            Filter
          </button>
        </form>

        {/* Game grid */}
        {games.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No games found.</p>
            <p className="text-muted-foreground text-sm mt-1">
              {params.q
                ? "Try a different search term or adjust your filters."
                : "Games will appear here once the BGG import cron has run."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {games.map((game) => (
              <Link
                key={game.id}
                href={`/boardgames/games/${game.slug}`}
                className="group"
              >
                <Card className="h-full overflow-hidden border-border bg-card hover:border-[var(--vertical-accent)]/40 transition-all">
                  <div className="relative aspect-square bg-muted">
                    {game.thumbnail_url ? (
                      <img
                        src={game.thumbnail_url}
                        alt={game.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        No image
                      </div>
                    )}
                    {game.bgg_rank && (
                      <span className="absolute top-1.5 left-1.5 bg-black/75 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        #{game.bgg_rank}
                      </span>
                    )}
                  </div>
                  <CardContent className="p-3 space-y-1.5">
                    <h3 className="text-xs font-medium leading-snug line-clamp-2 min-h-[32px] group-hover:text-[var(--vertical-accent-light)] transition-colors">
                      {game.title}
                    </h3>

                    {/* Rating */}
                    {game.bgg_rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-[11px] font-semibold">
                          {game.bgg_rating.toFixed(1)}
                        </span>
                      </div>
                    )}

                    {/* Meta row */}
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                      {game.min_players != null && game.max_players != null && (
                        <span className="inline-flex items-center gap-0.5">
                          <Users className="w-2.5 h-2.5" />
                          {game.min_players === game.max_players
                            ? game.min_players
                            : `${game.min_players}-${game.max_players}`}
                        </span>
                      )}
                      {game.play_time_min != null && (
                        <span className="inline-flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {game.play_time_min === game.play_time_max
                            ? `${game.play_time_min}m`
                            : `${game.play_time_min}-${game.play_time_max}m`}
                        </span>
                      )}
                    </div>

                    {/* Complexity badge */}
                    {game.complexity != null && (
                      <Badge
                        variant="outline"
                        className="text-[9px] py-0 px-1.5"
                        style={{
                          borderColor: complexityColour(game.complexity),
                          color: complexityColour(game.complexity),
                        }}
                      >
                        <Brain className="w-2 h-2 mr-0.5" />
                        {complexityLabel(game.complexity)}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            {currentPage > 1 && (
              <Link
                href={pageUrl(currentPage - 1)}
                className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
              >
                Previous
              </Link>
            )}
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} ({total} games)
            </span>
            {currentPage < totalPages && (
              <Link
                href={pageUrl(currentPage + 1)}
                className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
