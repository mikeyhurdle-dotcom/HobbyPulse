import { verticals, verticalList } from "@/config/verticals";
import type { VerticalConfig } from "@/config/verticals";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Config helpers (no DB call — fast, always available)
// ---------------------------------------------------------------------------

/** Return the vertical config for the given slug, or null if it doesn't exist. */
export function getVertical(slug: string): VerticalConfig | null {
  return verticals[slug] ?? null;
}

/** Return every registered vertical config. */
export function getAllVerticals(): VerticalConfig[] {
  return verticalList;
}

/** Return true when `slug` matches a known vertical. */
export function isValidVertical(slug: string): boolean {
  return slug in verticals;
}

// ---------------------------------------------------------------------------
// Supabase helpers (async — hits the DB)
// ---------------------------------------------------------------------------

export interface VerticalRow {
  id: string;
  slug: string;
  name: string;
}

/**
 * Fetch the vertical row from the Supabase `verticals` table.
 * Returns null when the slug isn't found in the DB.
 */
export async function getVerticalFromDb(
  slug: string,
): Promise<VerticalRow | null> {
  const { data } = await supabase
    .from("verticals")
    .select("id, slug, name")
    .eq("slug", slug)
    .single();

  return (data as VerticalRow | null) ?? null;
}
