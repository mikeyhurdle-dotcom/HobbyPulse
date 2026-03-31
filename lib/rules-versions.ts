import { supabase } from "@/lib/supabase";

export interface RulesVersion {
  id: string;
  game_system: string;
  version_name: string;
  effective_date: string;
  notes: string | null;
  is_current: boolean;
}

/**
 * Get the current rules version for a game system.
 */
export async function getCurrentVersion(
  gameSystem: string,
): Promise<RulesVersion | null> {
  const { data } = await supabase
    .from("rules_versions")
    .select("id, game_system, version_name, effective_date, notes, is_current")
    .eq("game_system", gameSystem)
    .eq("is_current", true)
    .single();

  return (data as RulesVersion) ?? null;
}

/**
 * Get which rules version was active when a video was published.
 *
 * Finds the latest version whose effective_date is on or before the given date.
 */
export async function getVersionAtDate(
  gameSystem: string,
  date: string,
): Promise<RulesVersion | null> {
  const { data } = await supabase
    .from("rules_versions")
    .select("id, game_system, version_name, effective_date, notes, is_current")
    .eq("game_system", gameSystem)
    .lte("effective_date", date)
    .order("effective_date", { ascending: false })
    .limit(1)
    .single();

  return (data as RulesVersion) ?? null;
}

/**
 * Check if a video's rules are still current.
 *
 * Returns true if the video was published after the current version's
 * effective date.
 */
export async function isCurrentRules(
  gameSystem: string,
  publishedAt: string,
): Promise<boolean> {
  const current = await getCurrentVersion(gameSystem);
  if (!current) return false;

  return new Date(publishedAt) >= new Date(current.effective_date);
}
