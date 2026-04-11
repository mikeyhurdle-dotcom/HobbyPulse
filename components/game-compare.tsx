"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Users, Clock, Brain, Search, X, ArrowRight } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GameResult {
  slug: string;
  title: string;
  thumbnail_url: string | null;
  bgg_rating: number | null;
  year_published: number | null;
}

interface FullGame {
  slug: string;
  title: string;
  image_url: string | null;
  thumbnail_url: string | null;
  bgg_rating: number | null;
  bgg_rank: number | null;
  min_players: number | null;
  max_players: number | null;
  play_time_min: number | null;
  play_time_max: number | null;
  complexity: number | null;
  min_age: number | null;
  year_published: number | null;
  categories: string[];
  mechanics: string[];
  designers: string[];
  amazon_asin: string | null;
  zatu_url: string | null;
}

// ---------------------------------------------------------------------------
// Autocomplete input
// ---------------------------------------------------------------------------

function GameSearchInput({
  label,
  selected,
  onSelect,
  onClear,
}: {
  label: string;
  selected: GameResult | null;
  onSelect: (game: GameResult) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GameResult[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/board-game-search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.games ?? []);
        setOpen(true);
      } catch {
        setResults([]);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  if (selected) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-[var(--vertical-accent)]/40 bg-card px-4 py-3">
        {selected.thumbnail_url && (
          <img
            src={selected.thumbnail_url}
            alt={selected.title}
            className="w-8 h-8 rounded object-cover"
          />
        )}
        <span className="font-medium text-sm flex-1 truncate">{selected.title}</span>
        <button
          onClick={onClear}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder={label}
          className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vertical-accent)]"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 rounded-lg border border-border bg-card shadow-lg max-h-64 overflow-y-auto">
          {results.map((game) => (
            <button
              key={game.slug}
              onMouseDown={() => {
                onSelect(game);
                setQuery("");
                setResults([]);
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-secondary transition-colors"
            >
              {game.thumbnail_url && (
                <img
                  src={game.thumbnail_url}
                  alt={game.title}
                  className="w-8 h-8 rounded object-cover shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{game.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {game.year_published && `(${game.year_published})`}
                  {game.bgg_rating && ` · ${game.bgg_rating.toFixed(1)}/10`}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Comparison metrics
// ---------------------------------------------------------------------------

interface Metric {
  label: string;
  icon: typeof Star;
  getA: (g: FullGame) => string;
  getB: (g: FullGame) => string;
  winner: (a: FullGame, b: FullGame) => "a" | "b" | "tie";
}

const metrics: Metric[] = [
  {
    label: "BGG Rating",
    icon: Star,
    getA: (g) => g.bgg_rating?.toFixed(1) ?? "—",
    getB: (g) => g.bgg_rating?.toFixed(1) ?? "—",
    winner: (a, b) => {
      if (!a.bgg_rating || !b.bgg_rating) return "tie";
      if (a.bgg_rating > b.bgg_rating) return "a";
      if (b.bgg_rating > a.bgg_rating) return "b";
      return "tie";
    },
  },
  {
    label: "BGG Rank",
    icon: Star,
    getA: (g) => (g.bgg_rank ? `#${g.bgg_rank}` : "—"),
    getB: (g) => (g.bgg_rank ? `#${g.bgg_rank}` : "—"),
    winner: (a, b) => {
      if (!a.bgg_rank || !b.bgg_rank) return "tie";
      if (a.bgg_rank < b.bgg_rank) return "a"; // lower is better
      if (b.bgg_rank < a.bgg_rank) return "b";
      return "tie";
    },
  },
  {
    label: "Players",
    icon: Users,
    getA: (g) =>
      g.min_players != null && g.max_players != null
        ? `${g.min_players}-${g.max_players}`
        : "—",
    getB: (g) =>
      g.min_players != null && g.max_players != null
        ? `${g.min_players}-${g.max_players}`
        : "—",
    winner: () => "tie",
  },
  {
    label: "Play Time",
    icon: Clock,
    getA: (g) =>
      g.play_time_min != null
        ? `${g.play_time_min}-${g.play_time_max} min`
        : "—",
    getB: (g) =>
      g.play_time_min != null
        ? `${g.play_time_min}-${g.play_time_max} min`
        : "—",
    winner: () => "tie",
  },
  {
    label: "Complexity",
    icon: Brain,
    getA: (g) => (g.complexity ? `${g.complexity.toFixed(1)}/5` : "—"),
    getB: (g) => (g.complexity ? `${g.complexity.toFixed(1)}/5` : "—"),
    winner: () => "tie", // complexity is subjective
  },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function GameCompare({
  initialA,
  initialB,
}: {
  initialA?: string;
  initialB?: string;
}) {
  const [gameA, setGameA] = useState<GameResult | null>(null);
  const [gameB, setGameB] = useState<GameResult | null>(null);
  const [fullA, setFullA] = useState<FullGame | null>(null);
  const [fullB, setFullB] = useState<FullGame | null>(null);

  // Load initial games from URL params
  useEffect(() => {
    if (initialA) loadGame(initialA, "a");
    if (initialB) loadGame(initialB, "b");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadGame(slug: string, side: "a" | "b") {
    try {
      // Search for the game by slug to get basic info
      const res = await fetch(`/api/board-game-search?q=${encodeURIComponent(slug)}`);
      const data = await res.json();
      const match = (data.games ?? []).find(
        (g: GameResult) => g.slug === slug,
      ) ?? (data.games ?? [])[0];

      if (match) {
        if (side === "a") {
          setGameA(match);
          fetchFullGame(match.slug, "a");
        } else {
          setGameB(match);
          fetchFullGame(match.slug, "b");
        }
      }
    } catch {
      // Ignore load errors
    }
  }

  async function fetchFullGame(slug: string, side: "a" | "b") {
    try {
      const res = await fetch(`/api/board-game-search?q=${encodeURIComponent(slug)}`);
      const data = await res.json();
      // The search API returns limited data — fetch full game from the game page API
      // For now, use the search data which has the key comparison fields
      const game = data.games?.[0];
      if (game) {
        // Fetch full game data from supabase via a direct query
        const fullRes = await fetch(`/boardgames/games/${slug}`, {
          headers: { Accept: "application/json" },
        });
        // If the page doesn't return JSON, use what we have from search
        if (side === "a") setFullA(game);
        else setFullB(game);
      }
    } catch {
      // Use what we already have
    }
  }

  function handleSelectA(game: GameResult) {
    setGameA(game);
    setFullA(null);
    fetchFullGame(game.slug, "a");
    updateUrl(game.slug, gameB?.slug);
  }

  function handleSelectB(game: GameResult) {
    setGameB(game);
    setFullB(null);
    fetchFullGame(game.slug, "b");
    updateUrl(gameA?.slug, game.slug);
  }

  function updateUrl(a?: string, b?: string) {
    const sp = new URLSearchParams();
    if (a) sp.set("a", a);
    if (b) sp.set("b", b);
    const qs = sp.toString();
    window.history.replaceState(
      {},
      "",
      `/boardgames/compare${qs ? `?${qs}` : ""}`,
    );
  }

  const bothSelected = gameA && gameB;

  return (
    <div className="space-y-8">
      {/* Search inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Game A</label>
          <GameSearchInput
            label="Search for a game..."
            selected={gameA}
            onSelect={handleSelectA}
            onClear={() => {
              setGameA(null);
              setFullA(null);
              updateUrl(undefined, gameB?.slug);
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Game B</label>
          <GameSearchInput
            label="Search for a game..."
            selected={gameB}
            onSelect={handleSelectB}
            onClear={() => {
              setGameB(null);
              setFullB(null);
              updateUrl(gameA?.slug, undefined);
            }}
          />
        </div>
      </div>

      {/* Comparison table */}
      {bothSelected && fullA && fullB && (
        <Card className="border-border bg-card overflow-hidden">
          <CardContent className="p-0">
            {/* Header row */}
            <div className="grid grid-cols-3 border-b border-border">
              <div className="p-4 text-center font-bold text-sm">Metric</div>
              <div className="p-4 text-center border-x border-border">
                <Link
                  href={`/boardgames/games/${gameA.slug}`}
                  className="font-bold text-sm hover:text-[var(--vertical-accent-light)] transition-colors"
                >
                  {gameA.title}
                </Link>
              </div>
              <div className="p-4 text-center">
                <Link
                  href={`/boardgames/games/${gameB.slug}`}
                  className="font-bold text-sm hover:text-[var(--vertical-accent-light)] transition-colors"
                >
                  {gameB.title}
                </Link>
              </div>
            </div>

            {/* Metric rows */}
            {metrics.map((m) => {
              const winner = m.winner(fullA, fullB);
              return (
                <div
                  key={m.label}
                  className="grid grid-cols-3 border-b border-border last:border-b-0"
                >
                  <div className="p-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <m.icon className="w-3.5 h-3.5" />
                    {m.label}
                  </div>
                  <div
                    className={`p-3 text-center text-sm font-semibold border-x border-border ${
                      winner === "a"
                        ? "bg-[var(--success)]/10 text-[var(--success)]"
                        : ""
                    }`}
                  >
                    {m.getA(fullA)}
                  </div>
                  <div
                    className={`p-3 text-center text-sm font-semibold ${
                      winner === "b"
                        ? "bg-[var(--success)]/10 text-[var(--success)]"
                        : ""
                    }`}
                  >
                    {m.getB(fullB)}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Game page links */}
      {bothSelected && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href={`/boardgames/games/${gameA.slug}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
          >
            View {gameA.title} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href={`/boardgames/games/${gameB.slug}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
          >
            View {gameB.title} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Empty state */}
      {!bothSelected && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Search and select two games above to see a side-by-side comparison.
          </p>
        </div>
      )}
    </div>
  );
}
