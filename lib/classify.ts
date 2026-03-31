// ---------------------------------------------------------------------------
// Video content type classification
// ---------------------------------------------------------------------------

export type VideoType =
  | "battle-report"
  | "news"
  | "tactics"
  | "painting"
  | "review"
  | "lore"
  | "other";

export const VIDEO_TYPE_CONFIG: Record<
  VideoType,
  { label: string; colour: string; icon: string }
> = {
  "battle-report": { label: "Battle Report", colour: "#22c55e", icon: "\u2694\uFE0F" },
  news:            { label: "News",          colour: "#3b82f6", icon: "\uD83D\uDCF0" },
  tactics:         { label: "Tactics",       colour: "#f59e0b", icon: "\uD83D\uDCCA" },
  painting:        { label: "Painting",      colour: "#ec4899", icon: "\uD83C\uDFA8" },
  review:          { label: "Review",        colour: "#a855f7", icon: "\uD83D\uDCE6" },
  lore:            { label: "Lore",          colour: "#06b6d4", icon: "\uD83D\uDCD6" },
  other:           { label: "Other",         colour: "var(--muted)", icon: "\uD83D\uDCFA" },
};

// ---------------------------------------------------------------------------
// Strict battle report detection — used by the cron to decide whether to
// fetch full video details from the YouTube API.
// ---------------------------------------------------------------------------

/**
 * Strict check: is this title + duration likely a real battle report?
 *
 * A battle report MUST have:
 * - Title contains faction-vs-faction pattern (" vs " or " v ") OR
 *   title contains "battle report" / "batrep" / "bat rep"
 * - AND duration > 900 seconds (15+ minutes)
 *
 * Duration of 0 means unknown (e.g. from RSS where we don't have duration yet)
 * — in that case we only check the title pattern.
 */
export function isBattleReport(title: string, durationSeconds: number): boolean {
  const t = title.toLowerCase();

  const hasBattleReportKeyword =
    t.includes("battle report") ||
    t.includes("batrep") ||
    t.includes("bat rep");

  const hasVsPattern = / v(?:s)? /i.test(title);

  const titleMatch = hasBattleReportKeyword || hasVsPattern;

  // If we have duration info, enforce minimum length
  if (durationSeconds > 0) {
    return titleMatch && durationSeconds > 900;
  }

  // No duration available (RSS pre-filter) — title match only
  return titleMatch;
}

// ---------------------------------------------------------------------------
// Full classifier — assigns a content type to any video
// ---------------------------------------------------------------------------

/**
 * Classify a video based on its title and duration.
 *
 * Rules are evaluated in priority order — the first match wins.
 * Battle report classification is now strict (delegates to isBattleReport).
 */
export function classifyVideo(title: string, durationSeconds: number): VideoType {
  const t = title.toLowerCase();

  // Battle report — strict check
  if (isBattleReport(title, durationSeconds)) {
    return "battle-report";
  }

  // Review / unboxing
  if (
    t.includes("review") ||
    t.includes("unboxing") ||
    t.includes("first look")
  ) {
    return "review";
  }

  // Painting
  if (
    t.includes("how to paint") ||
    t.includes("painting") ||
    t.includes("speed paint") ||
    t.includes("contrast")
  ) {
    return "painting";
  }

  // Tactics / competitive
  if (
    t.includes("tactics") ||
    t.includes("guide") ||
    t.includes("tier list") ||
    t.includes("meta") ||
    t.includes("win rate") ||
    t.includes("tournament") ||
    t.includes("top") ||
    t.includes("list")
  ) {
    return "tactics";
  }

  // Lore
  if (
    t.includes("lore") ||
    t.includes("explained") ||
    t.includes("history") ||
    t.includes("who is")
  ) {
    return "lore";
  }

  // News
  if (
    t.includes("reveal") ||
    t.includes("confirmed") ||
    t.includes("announced") ||
    t.includes("new") ||
    t.includes("incoming") ||
    t.includes("release") ||
    t.includes("price")
  ) {
    return "news";
  }

  return "other";
}

/** A video shorter than 2 minutes is a Short. */
export function isShort(durationSeconds: number): boolean {
  return durationSeconds < 120;
}
