// ---------------------------------------------------------------------------
// External List Fetching
// ---------------------------------------------------------------------------
// Many YouTube channels (notably Tabletop Titans) don't put army lists
// directly in their video description — they link to Pastebin instead.
// This module detects those links, fetches the raw list text, and appends
// it to the description so the Haiku parser has actual list data to work
// with rather than just a sponsor blurb and a URL.
// ---------------------------------------------------------------------------

const PASTEBIN_REGEX = /https?:\/\/(?:www\.)?pastebin\.com\/(?:raw\/)?([a-zA-Z0-9]{6,12})/gi;

/** Hard cap so a single giant paste can't blow Haiku's token budget. */
const MAX_CHARS_PER_PASTE = 10_000;

/** Don't fetch more than this many pastes per video (prevents abuse / runaway). */
const MAX_PASTES_PER_VIDEO = 4;

/** Per-fetch timeout. Pastebin is usually fast; if it isn't, skip and move on. */
const FETCH_TIMEOUT_MS = 5_000;

interface FetchedPaste {
  id: string;
  content: string;
}

/**
 * Extract unique pastebin IDs from a description.
 * Returns them in order of first appearance, capped at MAX_PASTES_PER_VIDEO.
 */
function extractPastebinIds(description: string): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];

  for (const match of description.matchAll(PASTEBIN_REGEX)) {
    const id = match[1];
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= MAX_PASTES_PER_VIDEO) break;
  }

  return ids;
}

/**
 * Fetch a single Pastebin raw paste. Returns null on any failure
 * (network, 404, empty body, suspiciously large).
 */
async function fetchPaste(id: string): Promise<FetchedPaste | null> {
  const rawUrl = `https://pastebin.com/raw/${id}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(rawUrl, {
      signal: controller.signal,
      // Pastebin serves raw text with a minimal User-Agent check on some regions.
      headers: { "User-Agent": "TabletopWatch/1.0 (+https://tabletopwatch.com)" },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const text = await res.text();
    if (!text || text.trim().length < 20) return null;

    // Pastebin returns HTML on deleted/private pastes rather than 404.
    // Cheap sniff: if it looks like HTML, it's not a list.
    if (/<html|<!doctype/i.test(text.slice(0, 200))) return null;

    return {
      id,
      content: text.slice(0, MAX_CHARS_PER_PASTE),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Enrich a video description by fetching any linked Pastebin army lists
 * and appending them as clearly-labelled sections. The returned string
 * can be passed directly to the parser.
 *
 * If no pastebin links are present, or all fetches fail, the original
 * description is returned unchanged.
 */
export async function enrichDescriptionWithExternalLists(
  description: string,
): Promise<{ enriched: string; fetchedCount: number }> {
  if (!description) return { enriched: description, fetchedCount: 0 };

  const ids = extractPastebinIds(description);
  if (ids.length === 0) return { enriched: description, fetchedCount: 0 };

  const results = await Promise.all(ids.map(fetchPaste));
  const fetched = results.filter((r): r is FetchedPaste => r !== null);

  if (fetched.length === 0) return { enriched: description, fetchedCount: 0 };

  const sections = fetched
    .map(
      (p) =>
        `\n\n--- LINKED ARMY LIST (pastebin/${p.id}) ---\n${p.content}\n--- END LINKED LIST ---`,
    )
    .join("");

  return {
    enriched: description + sections,
    fetchedCount: fetched.length,
  };
}
