// ---------------------------------------------------------------------------
// Kickstarter scraper — board game crowdfunding feed via Kicktraq
// ---------------------------------------------------------------------------
// Kicktraq aggregates Kickstarter project data including funding %, days left,
// backer counts, and pledge tier info. We scrape three pages: end-soon, hot,
// and recently-funded — then normalise into the kickstarter_projects shape.
//
// If Kicktraq's HTML changes or starts blocking, swap the data source by
// editing fetchProjectsFromSource(). The downstream cron + UI don't care.
// ---------------------------------------------------------------------------

import * as cheerio from "cheerio";

export interface KickstarterProject {
  external_id: string;
  slug: string;
  title: string;
  url: string;
  image_url: string | null;
  creator: string | null;
  blurb: string | null;
  funded_amount: number | null;     // pence (or cent equivalent of currency)
  goal_amount: number | null;
  currency: string;
  funded_percent: number | null;
  backers: number | null;
  ends_at: string | null;            // ISO
  status: "live" | "ending_soon" | "recently_funded" | "late_pledge" | "ended";
}

const KICKTRAQ_BASE = "https://www.kicktraq.com";

// Map Kicktraq listing pages → status we'll store
const SOURCE_PAGES: { path: string; status: KickstarterProject["status"] }[] = [
  { path: "/categories/games/tabletop+games/end-soon/?sort=end&filter=trending", status: "ending_soon" },
  { path: "/categories/games/tabletop+games/hottest/?filter=trending", status: "live" },
  { path: "/categories/games/tabletop+games/most-funded/?days=7", status: "recently_funded" },
];

const USER_AGENT =
  "Mozilla/5.0 (compatible; TabletopWatch/1.0; +https://tabletopwatch.com)";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function parseMoney(raw: string): { amount: number | null; currency: string } {
  // Examples: "$123,456", "£12,345", "€9,876", "CA$50,000"
  const m = raw.match(/([£$€¥])\s?([\d,]+)/);
  if (!m) return { amount: null, currency: "USD" };
  const sym = m[1];
  const num = Number.parseInt(m[2].replace(/,/g, ""), 10);
  if (Number.isNaN(num)) return { amount: null, currency: "USD" };
  const currency =
    sym === "£" ? "GBP" : sym === "€" ? "EUR" : sym === "¥" ? "JPY" : "USD";
  // Store as smallest currency unit (pence/cents) for parity with listings.price_pence
  return { amount: num * 100, currency };
}

function parsePercent(raw: string): number | null {
  const m = raw.match(/(\d+(?:\.\d+)?)\s*%/);
  if (!m) return null;
  const num = Number.parseFloat(m[1]);
  return Number.isFinite(num) ? num : null;
}

function parseInteger(raw: string): number | null {
  const cleaned = raw.replace(/,/g, "").match(/-?\d+/);
  if (!cleaned) return null;
  const num = Number.parseInt(cleaned[0], 10);
  return Number.isNaN(num) ? null : num;
}

/**
 * Best-effort end-date parser. Kicktraq prints things like
 * "Ends in 4 days, 12 hours" — we convert to absolute time using "now".
 */
function parseEndsAt(raw: string, nowMs: number = Date.now()): string | null {
  const days = raw.match(/(\d+)\s*day/i);
  const hours = raw.match(/(\d+)\s*hour/i);
  if (!days && !hours) return null;
  const ms =
    (days ? Number.parseInt(days[1], 10) : 0) * 86_400_000 +
    (hours ? Number.parseInt(hours[1], 10) : 0) * 3_600_000;
  if (ms <= 0) return null;
  return new Date(nowMs + ms).toISOString();
}

async function fetchPage(path: string): Promise<string> {
  const res = await fetch(`${KICKTRAQ_BASE}${path}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
  });
  if (!res.ok) {
    throw new Error(`Kicktraq ${path} returned ${res.status}`);
  }
  return res.text();
}

function parseListing(html: string, status: KickstarterProject["status"]): KickstarterProject[] {
  const $ = cheerio.load(html);
  const projects: KickstarterProject[] = [];

  // Kicktraq's project list items use h2 titles linking to /projects/<creator>/<slug>
  $("h2 > a[href*='/projects/']").each((_, el) => {
    const $a = $(el);
    const href = $a.attr("href") ?? "";
    const title = $a.text().trim();
    if (!title || !href) return;

    const externalIdMatch = href.match(/\/projects\/([^/]+\/[^/?#]+)/);
    if (!externalIdMatch) return;
    const externalId = externalIdMatch[1];
    const slug = slugify(`${externalId.split("/").slice(-1)[0]}-${title}`);

    // Walk up to the project block and collect siblings — Kicktraq's structure
    // changes occasionally; defensively read what we can.
    const $block = $a.closest("div");
    const blockText = $block.text();

    const fundedMatch = blockText.match(/Funding:\s*([£$€¥]?\s?[\d,]+)\s*of\s*([£$€¥]?\s?[\d,]+)\s*\(([^)]+)\)/i);
    let funded_amount: number | null = null;
    let goal_amount: number | null = null;
    let funded_percent: number | null = null;
    let currency = "USD";
    if (fundedMatch) {
      const f = parseMoney(fundedMatch[1]);
      const g = parseMoney(fundedMatch[2]);
      funded_amount = f.amount;
      goal_amount = g.amount;
      currency = f.currency;
      funded_percent = parsePercent(fundedMatch[3]);
    }

    const backersMatch = blockText.match(/(\d[\d,]*)\s*backers?/i);
    const backers = backersMatch ? parseInteger(backersMatch[1]) : null;

    const endsRaw =
      blockText.match(/Ends?\s+in\s+([^.\n]+)/i)?.[1] ??
      blockText.match(/Ended\s+(\d+\s*\w+\s*ago)/i)?.[0] ??
      "";
    const ends_at = endsRaw ? parseEndsAt(endsRaw) : null;

    const creator = $block.find("a[href*='/profile/']").first().text().trim() || null;
    const image_url = $block.find("img").first().attr("src") ?? null;
    const blurbEl = $block.find("p").first().text().trim();
    const blurb = blurbEl.length > 0 ? blurbEl.slice(0, 280) : null;

    const url = href.startsWith("http") ? href : `${KICKTRAQ_BASE}${href}`;

    projects.push({
      external_id: externalId,
      slug,
      title,
      url,
      image_url,
      creator,
      blurb,
      funded_amount,
      goal_amount,
      currency,
      funded_percent,
      backers,
      ends_at,
      status,
    });
  });

  return projects;
}

/**
 * Fetch and parse the three Kicktraq feeds, dedupe by external_id (newest
 * status wins by source order), and return a flat list ready for upsert.
 */
export async function fetchKickstarterProjects(): Promise<KickstarterProject[]> {
  const seen = new Map<string, KickstarterProject>();

  for (const source of SOURCE_PAGES) {
    try {
      const html = await fetchPage(source.path);
      const parsed = parseListing(html, source.status);
      for (const p of parsed) {
        // SOURCE_PAGES order matters: ending_soon first, live, recently_funded.
        // First write wins so a project that's ending_soon stays labelled
        // ending_soon even if it also appears in the hottest feed.
        if (!seen.has(p.external_id)) {
          seen.set(p.external_id, p);
        }
      }
    } catch (err) {
      console.warn(`[kickstarter] ${source.path}:`, err instanceof Error ? err.message : err);
    }
  }

  return Array.from(seen.values());
}
