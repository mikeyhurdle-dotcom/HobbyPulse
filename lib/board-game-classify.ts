// ---------------------------------------------------------------------------
// Board game video classifier
// ---------------------------------------------------------------------------
// Determines the content type of a board game YouTube video based on its
// title and description. Used by the board game discovery cron to tag
// videos for downstream article generation.
// ---------------------------------------------------------------------------

export type BoardGameContentType =
  | "review"
  | "top-list"
  | "how-to-play"
  | "comparison"
  | "playthrough"
  | "news"
  | "other";

const REVIEW_PATTERNS = [
  /\breview\b/i,
  /\breviewed\b/i,
  /\bshould you buy\b/i,
  /\bis it (any )?good\b/i,
  /\bworth (it|buying|getting)\b/i,
  /\bfirst impressions?\b/i,
  /\bbuyer'?s? guide\b/i,
];

const TOP_LIST_PATTERNS = [
  /\btop\s+\d+\b/i,
  /\bbest\s+(of|board|strategy|co-?op|solo|family|party|deck|card)\b/i,
  /\bworst\s+\d+\b/i,
  /\branking\b/i,
  /\bfavou?rite(s)?\s+(board|games?)\b/i,
  /\bmost\s+(underrated|overrated|anticipated)\b/i,
  /\bgift\s+guide\b/i,
  /\bessential\s+(board\s+)?games?\b/i,
];

const HOW_TO_PLAY_PATTERNS = [
  /\bhow\s+to\s+play\b/i,
  /\brules?\s+(explained|overview|guide|summary|breakdown)\b/i,
  /\blearn\s+to\s+play\b/i,
  /\bteach(ing)?\s+(you\s+)?(to\s+play|the\s+rules?)\b/i,
  /\bin\s+\d+\s+minutes?\b/i, // "Catan in 5 minutes"
  /\bquick\s+start\b/i,
  /\bsetup\s+(&|and)\s+play\b/i,
];

const COMPARISON_PATTERNS = [
  /\bvs\.?\b/i,
  /\bversus\b/i,
  /\bcompared\b/i,
  /\bcomparison\b/i,
  /\bwhich\s+(should|one|is\s+better)\b/i,
  /\bor\b.*\bwhich\b/i,
  /\bbattle\s+of\b/i,
];

const PLAYTHROUGH_PATTERNS = [
  /\bplaythrough\b/i,
  /\bplay[\s-]?through\b/i,
  /\blet'?s\s+play\b/i,
  /\bfull\s+game\b/i,
  /\bgameplay\b/i,
  /\bplaying\b.*\bfor\s+the\s+first\s+time\b/i,
];

const NEWS_PATTERNS = [
  /\bnews\b/i,
  /\bannounce(ment|d)?\b/i,
  /\bkickstarter\b/i,
  /\bgamefound\b/i,
  /\bcoming\s+soon\b/i,
  /\bgen\s+con\b/i,
  /\bessen\s+spiel\b/i,
  /\buk\s+games?\s+expo\b/i,
];

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

/**
 * Classify a board game video by content type based on title (and optionally description).
 * Priority order: how-to-play > comparison > top-list > review > playthrough > news > other
 */
export function classifyBoardGameVideo(
  title: string,
  description?: string,
): BoardGameContentType {
  // Title is the strongest signal
  if (matchesAny(title, HOW_TO_PLAY_PATTERNS)) return "how-to-play";
  if (matchesAny(title, COMPARISON_PATTERNS)) return "comparison";
  if (matchesAny(title, TOP_LIST_PATTERNS)) return "top-list";
  if (matchesAny(title, REVIEW_PATTERNS)) return "review";
  if (matchesAny(title, PLAYTHROUGH_PATTERNS)) return "playthrough";
  if (matchesAny(title, NEWS_PATTERNS)) return "news";

  // Fall back to description if title wasn't conclusive
  if (description) {
    const desc = description.slice(0, 500); // Only check first 500 chars
    if (matchesAny(desc, HOW_TO_PLAY_PATTERNS)) return "how-to-play";
    if (matchesAny(desc, REVIEW_PATTERNS)) return "review";
    if (matchesAny(desc, TOP_LIST_PATTERNS)) return "top-list";
  }

  return "other";
}

/**
 * Extract the game name from a video title.
 * Strips common suffixes like "Review", "How to Play", etc.
 */
export function extractGameName(title: string): string | null {
  // Common patterns: "Game Name Review", "How to Play Game Name", "Game Name vs Game Name"
  let cleaned = title;

  // Remove channel-specific prefixes (e.g., "Dice Tower Reviews:")
  cleaned = cleaned.replace(/^[^:]+:\s*/i, "");

  // Remove suffixes
  const suffixes = [
    /\s*[-–—|]\s*(review|first impressions?|buyer'?s? guide|rules?\s+explained).*$/i,
    /\s*(review|first impressions?)$/i,
    /\s*[-–—|]\s*(is it (any )?good|should you buy|worth it).*$/i,
    /^how\s+to\s+play\s+/i,
    /\s*[-–—|]\s*(how\s+to\s+play|rules?\s+(explained|overview|guide)).*$/i,
    /\s*[-–—|]\s*(full\s+)?playthrough.*$/i,
    /\s*\(.*?\)\s*$/,
  ];

  for (const suffix of suffixes) {
    cleaned = cleaned.replace(suffix, "");
  }

  cleaned = cleaned.trim();
  return cleaned.length > 2 ? cleaned : null;
}
