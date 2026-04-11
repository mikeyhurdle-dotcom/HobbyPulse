// ---------------------------------------------------------------------------
// Board Game DB — Supabase query helpers for the board_games table
// ---------------------------------------------------------------------------

import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BoardGame {
  id: string;
  bgg_id: number;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  year_published: number | null;
  min_players: number | null;
  max_players: number | null;
  play_time_min: number | null;
  play_time_max: number | null;
  min_age: number | null;
  complexity: number | null;
  bgg_rank: number | null;
  bgg_rating: number | null;
  designers: string[];
  publishers: string[];
  categories: string[];
  mechanics: string[];
  amazon_asin: string | null;
  zatu_url: string | null;
}

export interface BoardGameFilters {
  search?: string;
  players?: number;
  complexityMin?: number;
  complexityMax?: number;
  playTimeMax?: number;
  category?: string;
  mechanic?: string;
}

export type BoardGameSort = "rank" | "rating" | "alpha" | "newest" | "complexity";

// ---------------------------------------------------------------------------
// List games with filtering, sorting, and pagination
// ---------------------------------------------------------------------------

export async function listGames(
  filters: BoardGameFilters = {},
  sort: BoardGameSort = "rank",
  page: number = 1,
  pageSize: number = 48,
): Promise<{ games: BoardGame[]; total: number }> {
  let query = supabase
    .from("board_games")
    .select("*", { count: "exact" });

  // Filters
  if (filters.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }

  if (filters.players) {
    query = query
      .lte("min_players", filters.players)
      .gte("max_players", filters.players);
  }

  if (filters.complexityMin !== undefined) {
    query = query.gte("complexity", filters.complexityMin);
  }
  if (filters.complexityMax !== undefined) {
    query = query.lte("complexity", filters.complexityMax);
  }

  if (filters.playTimeMax) {
    query = query.lte("play_time_min", filters.playTimeMax);
  }

  if (filters.category) {
    query = query.contains("categories", [filters.category]);
  }

  if (filters.mechanic) {
    query = query.contains("mechanics", [filters.mechanic]);
  }

  // Sorting
  switch (sort) {
    case "rank":
      query = query.order("bgg_rank", { ascending: true, nullsFirst: false });
      break;
    case "rating":
      query = query.order("bgg_rating", { ascending: false, nullsFirst: false });
      break;
    case "alpha":
      query = query.order("title", { ascending: true });
      break;
    case "newest":
      query = query.order("year_published", { ascending: false, nullsFirst: false });
      break;
    case "complexity":
      query = query.order("complexity", { ascending: false, nullsFirst: false });
      break;
  }

  // Pagination
  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error("listGames error:", error.message);
    return { games: [], total: 0 };
  }

  return {
    games: (data ?? []) as BoardGame[],
    total: count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Get a single game by slug
// ---------------------------------------------------------------------------

export async function getGameBySlug(slug: string): Promise<BoardGame | null> {
  const { data, error } = await supabase
    .from("board_games")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return data as BoardGame;
}

// ---------------------------------------------------------------------------
// Get top games (for generateStaticParams, homepage, etc.)
// ---------------------------------------------------------------------------

export async function getTopGameSlugs(limit: number = 100): Promise<string[]> {
  const { data } = await supabase
    .from("board_games")
    .select("slug")
    .not("bgg_rank", "is", null)
    .order("bgg_rank", { ascending: true })
    .limit(limit);

  return (data ?? []).map((g) => g.slug);
}

// ---------------------------------------------------------------------------
// Get trending games (BGG hot list)
// ---------------------------------------------------------------------------

export async function getTrendingGames(limit: number = 6): Promise<BoardGame[]> {
  const { data } = await supabase
    .from("board_games")
    .select("*")
    .not("bgg_rank", "is", null)
    .order("bgg_rank", { ascending: true })
    .limit(limit);

  return (data ?? []) as BoardGame[];
}

// ---------------------------------------------------------------------------
// Search games (autocomplete)
// ---------------------------------------------------------------------------

export async function searchGames(
  query: string,
  limit: number = 8,
): Promise<Pick<BoardGame, "slug" | "title" | "thumbnail_url" | "bgg_rating" | "year_published">[]> {
  const { data } = await supabase
    .from("board_games")
    .select("slug, title, thumbnail_url, bgg_rating, year_published")
    .ilike("title", `%${query}%`)
    .order("bgg_rank", { ascending: true, nullsFirst: false })
    .limit(limit);

  return (data ?? []) as Pick<BoardGame, "slug" | "title" | "thumbnail_url" | "bgg_rating" | "year_published">[];
}

// ---------------------------------------------------------------------------
// Get all unique categories across all games
// ---------------------------------------------------------------------------

export async function getAllCategories(): Promise<string[]> {
  const { data } = await supabase
    .from("board_games")
    .select("categories")
    .not("categories", "eq", "{}");

  if (!data) return [];

  const cats = new Set<string>();
  for (const row of data) {
    for (const c of (row as { categories: string[] }).categories) {
      cats.add(c);
    }
  }
  return Array.from(cats).sort();
}
