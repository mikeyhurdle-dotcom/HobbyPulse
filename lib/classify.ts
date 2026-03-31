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
export function isBattleReport(title: string, durationSeconds: number, vertical: string = "warhammer"): boolean {
  const t = title.toLowerCase();

  let titleMatch = false;

  if (vertical === "simracing") {
    // Sim racing: races, onboards, race replays
    titleMatch =
      t.includes("race") ||
      t.includes("onboard") ||
      t.includes("hotlap") ||
      t.includes("hot lap") ||
      t.includes("qualifying") ||
      t.includes("race replay") ||
      (t.includes("lap") && (t.includes("iracing") || t.includes("acc") || t.includes("f1")));
  } else {
    // Tabletop: battle reports
    const hasBattleReportKeyword =
      t.includes("battle report") ||
      t.includes("batrep") ||
      t.includes("bat rep");

    const hasVsPattern = / v(?:s)? /i.test(title);

    titleMatch = hasBattleReportKeyword || hasVsPattern;
  }

  // If we have duration info, enforce minimum length
  if (durationSeconds > 0) {
    const minDuration = vertical === "simracing" ? 300 : 900; // 5min for races, 15min for batreps
    return titleMatch && durationSeconds > minDuration;
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
export function classifyVideo(title: string, durationSeconds: number, vertical: string = "warhammer"): VideoType {
  const t = title.toLowerCase();

  // Battle report / race — strict check (vertical-aware)
  if (isBattleReport(title, durationSeconds, vertical)) {
    return "battle-report";
  }

  // Review / unboxing / comparison
  if (
    t.includes("review") ||
    t.includes("unboxing") ||
    t.includes("first look") ||
    t.includes("comparison") ||
    t.includes("worth it")
  ) {
    return "review";
  }

  if (vertical === "simracing") {
    // Sim racing specific: setup guides = tactics
    if (
      t.includes("setup") ||
      t.includes("settings") ||
      t.includes("guide") ||
      t.includes("tutorial") ||
      t.includes("how to") ||
      t.includes("tips") ||
      t.includes("faster") ||
      t.includes("improve")
    ) {
      return "tactics";
    }

    // Sim racing news
    if (
      t.includes("update") ||
      t.includes("patch") ||
      t.includes("new content") ||
      t.includes("dlc") ||
      t.includes("announcement") ||
      t.includes("release") ||
      t.includes("new car") ||
      t.includes("new track")
    ) {
      return "news";
    }
  } else {
    // Tabletop painting
    if (
      t.includes("how to paint") ||
      t.includes("painting") ||
      t.includes("speed paint") ||
      t.includes("contrast")
    ) {
      return "painting";
    }

    // Tabletop tactics
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

    // Tabletop lore
    if (
      t.includes("lore") ||
      t.includes("explained") ||
      t.includes("history") ||
      t.includes("who is")
    ) {
      return "lore";
    }

    // Tabletop news
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
  }

  return "other";
}

/** A video shorter than 2 minutes is a Short. */
export function isShort(durationSeconds: number): boolean {
  return durationSeconds < 120;
}

// ---------------------------------------------------------------------------
// Game system classifier
// ---------------------------------------------------------------------------

/**
 * Classify the game system from a video title.
 *
 * Rules are evaluated in priority order — first match wins.
 * Default is "40k".
 */
export function classifyGameSystem(title: string, vertical: string = "warhammer"): string {
  const t = ` ${title.toLowerCase()} `;

  if (vertical === "simracing") {
    // Sim racing game/sim detection
    if (t.includes("iracing") || t.includes("i racing")) return "iracing";
    if (t.includes("assetto corsa competizione") || t.includes(" acc ")) return "acc";
    if (t.includes("le mans ultimate") || t.includes(" lmu ")) return "lmu";
    if (t.includes(" f1 ") || t.includes("f1 24") || t.includes("f1 25") || t.includes("formula 1")) return "f1";
    if (t.includes("assetto corsa") && !t.includes("competizione")) return "ac";
    if (t.includes("rfactor") || t.includes("rf2")) return "rf2";
    if (t.includes("automobilista") || t.includes(" ams2 ") || t.includes(" ama2 ")) return "ams2";
    if (t.includes("gran turismo") || t.includes(" gt7 ")) return "gt7";
    if (t.includes("rennsport")) return "rennsport";

    // Hardware (not a sim, but a category)
    if (
      t.includes("wheel") || t.includes("pedal") || t.includes("rig") ||
      t.includes("cockpit") || t.includes("monitor") || t.includes("fanatec") ||
      t.includes("moza") || t.includes("simagic") || t.includes("sim-lab") ||
      t.includes("trak racer")
    ) return "hardware";

    return "simracing"; // generic sim racing
  }

  // Tabletop game system detection
  if (
    t.includes("age of sigmar") ||
    t.includes(" aos ") ||
    (t.includes("sigmar") && !t.includes("warhammer"))
  ) return "aos";

  if (
    t.includes("old world") ||
    t.includes(" tow ") ||
    t.includes("warhammer fantasy")
  ) return "tow";

  if (t.includes("kill team") || t.includes("killteam")) return "kt";

  if (
    t.includes("horus heresy") ||
    t.includes(" 30k ") ||
    t.includes("heresy")
  ) return "30k";

  if (
    t.includes("grimdark future") ||
    t.includes("age of fantasy") ||
    t.includes("one page rules") ||
    t.includes(" opr ")
  ) return "opr";

  return "40k";
}
