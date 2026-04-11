// ---------------------------------------------------------------------------
// BoardGameGeek XML API v2 Client
// ---------------------------------------------------------------------------
// BGG uses XML, not JSON. We parse XML responses into structured game data.
// Rate limited to ~2 requests/second — callers should batch accordingly.
// ---------------------------------------------------------------------------

export interface BggGame {
  bggId: number;
  title: string;
  description: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  yearPublished: number | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  playTimeMin: number | null;
  playTimeMax: number | null;
  minAge: number | null;
  complexity: number | null;
  bggRank: number | null;
  bggRating: number | null;
  designers: string[];
  publishers: string[];
  categories: string[];
  mechanics: string[];
}

const BGG_API = "https://boardgamegeek.com/xmlapi2";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractText(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`);
  const m = xml.match(re);
  return m ? decodeEntities(m[1].trim()) : "";
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const re = new RegExp(`<${tag}[^>]*?${attr}="([^"]*)"`, "i");
  const m = xml.match(re);
  return m ? m[1] : "";
}

function extractAllAttr(xml: string, tag: string, attr: string): string[] {
  const re = new RegExp(`<${tag}[^>]*?${attr}="([^"]*)"`, "gi");
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) results.push(m[1]);
  return results;
}

function extractLinkedValues(xml: string, type: string): string[] {
  const re = new RegExp(
    `<link\\s+type="${type}"[^>]*?value="([^"]*)"`,
    "gi",
  );
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) results.push(decodeEntities(m[1]));
  return results;
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#10;/g, "\n")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function parsePrimaryName(itemXml: string): string {
  const m = itemXml.match(
    /<name\s+type="primary"[^>]*?value="([^"]*)"/,
  );
  return m ? decodeEntities(m[1]) : "";
}

function parseFloat2(val: string): number | null {
  const n = parseFloat(val);
  return isNaN(n) ? null : Math.round(n * 100) / 100;
}

function parseInt2(val: string): number | null {
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

// ---------------------------------------------------------------------------
// Parse a single <item> block from BGG XML
// ---------------------------------------------------------------------------

function parseGameItem(itemXml: string): BggGame | null {
  const idMatch = itemXml.match(/<item\s[^>]*id="(\d+)"/);
  if (!idMatch) return null;

  const bggId = parseInt(idMatch[1], 10);
  const title = parsePrimaryName(itemXml);
  if (!title) return null;

  const description = extractText(itemXml, "description");
  const imageUrl = extractText(itemXml, "image") || null;
  const thumbnailUrl = extractText(itemXml, "thumbnail") || null;

  const yearPublished = parseInt2(extractAttr(itemXml, "yearpublished", "value"));
  const minPlayers = parseInt2(extractAttr(itemXml, "minplayers", "value"));
  const maxPlayers = parseInt2(extractAttr(itemXml, "maxplayers", "value"));
  const playTimeMin = parseInt2(extractAttr(itemXml, "minplaytime", "value"));
  const playTimeMax = parseInt2(extractAttr(itemXml, "maxplaytime", "value"));
  const minAge = parseInt2(extractAttr(itemXml, "minage", "value"));

  // Complexity (weight)
  const weightMatch = itemXml.match(
    /<averageweight[^>]*value="([^"]*)"/,
  );
  const complexity = weightMatch ? parseFloat2(weightMatch[1]) : null;

  // BGG rating
  const ratingMatch = itemXml.match(
    /<average[^>]*value="([^"]*)"/,
  );
  const bggRating = ratingMatch ? parseFloat2(ratingMatch[1]) : null;

  // BGG rank — look for the "Board Game Rank" subtype
  let bggRank: number | null = null;
  const rankMatch = itemXml.match(
    /<rank[^>]*name="boardgame"[^>]*value="(\d+)"/,
  );
  if (rankMatch) bggRank = parseInt(rankMatch[1], 10);

  const designers = extractLinkedValues(itemXml, "boardgamedesigner");
  const publishers = extractLinkedValues(itemXml, "boardgamepublisher");
  const categories = extractLinkedValues(itemXml, "boardgamecategory");
  const mechanics = extractLinkedValues(itemXml, "boardgamemechanic");

  return {
    bggId,
    title,
    description,
    imageUrl,
    thumbnailUrl,
    yearPublished,
    minPlayers,
    maxPlayers,
    playTimeMin,
    playTimeMax,
    minAge,
    complexity,
    bggRank,
    bggRating,
    designers,
    publishers,
    categories,
    mechanics,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch full details for one or more BGG game IDs.
 * BGG allows up to 20 IDs per request when using stats=1.
 */
export async function fetchBggGames(bggIds: number[]): Promise<BggGame[]> {
  if (bggIds.length === 0) return [];

  const ids = bggIds.join(",");
  const url = `${BGG_API}/thing?id=${ids}&stats=1&type=boardgame`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`BGG API error: ${res.status} ${res.statusText}`);
  }

  const xml = await res.text();

  // Split into individual <item>...</item> blocks
  const items: string[] = [];
  const re = /<item\s[^>]*type="boardgame"[\s\S]*?<\/item>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) !== null) {
    items.push(match[0]);
  }

  return items.map(parseGameItem).filter((g): g is BggGame => g !== null);
}

/**
 * Fetch a single game by BGG ID.
 */
export async function fetchBggGame(bggId: number): Promise<BggGame | null> {
  const games = await fetchBggGames([bggId]);
  return games[0] ?? null;
}

/**
 * Fetch the BGG "Hot" list (trending games).
 * Returns up to 50 IDs with basic info; we then batch-fetch full details.
 */
export async function fetchBggHotList(): Promise<number[]> {
  const url = `${BGG_API}/hot?type=boardgame`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`BGG Hot list error: ${res.status}`);

  const xml = await res.text();
  return extractAllAttr(xml, "item", "id").map(Number).filter(Boolean);
}

/**
 * Fetch the top N ranked board games from BGG.
 *
 * BGG doesn't have a direct "top ranked" API endpoint — we scrape the
 * browse page to get game IDs, then fetch details via the XML API.
 * Returns BGG IDs in rank order.
 */
export async function fetchBggTopRankedIds(count: number = 500): Promise<number[]> {
  const ids: number[] = [];
  const perPage = 100; // BGG browse pages show 100 items

  for (let page = 1; ids.length < count; page++) {
    const url = `https://boardgamegeek.com/browse/boardgame/page/${page}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent": "TabletopWatch/1.0 (board game directory)",
      },
    });

    if (!res.ok) {
      console.error(`BGG browse page ${page} error: ${res.status}`);
      break;
    }

    const html = await res.text();

    // Extract game IDs from /boardgame/NNNNN links
    const re = /\/boardgame\/(\d+)\//g;
    const pageIds = new Set<number>();
    let match: RegExpExecArray | null;
    while ((match = re.exec(html)) !== null) {
      pageIds.add(parseInt(match[1], 10));
    }

    if (pageIds.size === 0) break;

    for (const id of pageIds) {
      if (ids.length >= count) break;
      if (!ids.includes(id)) ids.push(id);
    }

    // Rate limit: wait 1.5s between page fetches
    if (ids.length < count) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  return ids;
}

/**
 * Generate a URL-friendly slug from a game title.
 */
export function slugifyGame(title: string): string {
  return title
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
