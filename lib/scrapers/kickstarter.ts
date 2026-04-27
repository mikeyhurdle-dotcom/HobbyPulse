// ---------------------------------------------------------------------------
// Kickstarter scraper — board game crowdfunding feed via Kicktraq
// ---------------------------------------------------------------------------
// Kicktraq's tabletop-games category page lists every active campaign with
// funding %, backer count, raised vs goal, time left, image, and blurb.
// We pull two views:
//   - ?sort=end — ending soon (deadline ascending)
//   - ?sort=new — newly launched (used to keep the "live" feed fresh)
// Recently-funded is harder to source from the public site; the cron marks
// stale rows as "ended" once their ends_at slips past 24h ago, which gives
// us a "recently funded" slice without a separate fetch.
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
  funded_amount: number | null;
  goal_amount: number | null;
  currency: string;
  funded_percent: number | null;
  backers: number | null;
  ends_at: string | null;
  status: "live" | "ending_soon" | "recently_funded" | "late_pledge" | "ended";
}

const KICKTRAQ_BASE = "https://www.kicktraq.com";
const TABLETOP_CATEGORY = "/categories/games/tabletop%20games/";

const SOURCE_PAGES: { path: string; status: KickstarterProject["status"] }[] = [
  { path: `${TABLETOP_CATEGORY}?sort=end`, status: "ending_soon" },
  { path: `${TABLETOP_CATEGORY}?sort=new`, status: "live" },
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
  const cleaned = raw.replace(/\s+/g, "");
  const m = cleaned.match(/(CA\$|A\$|HK\$|NZ\$|US\$|[£$€¥])\s*([\d,]+)/);
  if (!m) return { amount: null, currency: "USD" };
  const sym = m[1];
  const num = Number.parseInt(m[2].replace(/,/g, ""), 10);
  if (Number.isNaN(num)) return { amount: null, currency: "USD" };
  const currency =
    sym === "£" ? "GBP" :
    sym === "€" ? "EUR" :
    sym === "¥" ? "JPY" :
    sym === "CA$" ? "CAD" :
    sym === "A$" ? "AUD" :
    sym === "HK$" ? "HKD" :
    sym === "NZ$" ? "NZD" :
    "USD";
  return { amount: num * 100, currency };
}

function parsePercent(raw: string): number | null {
  const m = raw.match(/(\d+(?:\.\d+)?)\s*%/);
  if (!m) return null;
  const num = Number.parseFloat(m[1]);
  return Number.isFinite(num) ? num : null;
}

function parseInteger(raw: string): number | null {
  const m = raw.replace(/,/g, "").match(/-?\d+/);
  if (!m) return null;
  const num = Number.parseInt(m[0], 10);
  return Number.isNaN(num) ? null : num;
}

function parseEndsIn(raw: string, nowMs: number = Date.now()): string | null {
  // Kicktraq prints "time left: 4 days, 12 hours, 30 minutes"
  // and "0 days, 0 hours, 0 minutes (closing/closed)" for ended.
  if (/closing|closed/i.test(raw)) return null;
  const days = raw.match(/(\d+)\s*day/i);
  const hours = raw.match(/(\d+)\s*hour/i);
  const mins = raw.match(/(\d+)\s*minute/i);
  const ms =
    (days ? Number.parseInt(days[1], 10) : 0) * 86_400_000 +
    (hours ? Number.parseInt(hours[1], 10) : 0) * 3_600_000 +
    (mins ? Number.parseInt(mins[1], 10) : 0) * 60_000;
  if (ms <= 0) return null;
  return new Date(nowMs + ms).toISOString();
}

async function fetchPage(path: string): Promise<string> {
  const res = await fetch(`${KICKTRAQ_BASE}${path}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`Kicktraq ${path} returned ${res.status}`);
  }
  return res.text();
}

function parseListing(html: string, status: KickstarterProject["status"]): KickstarterProject[] {
  const $ = cheerio.load(html);
  const projects: KickstarterProject[] = [];

  $("div.project").each((_, el) => {
    const $project = $(el);

    // Skip non-tabletop entries that occasionally bleed into the feed
    const catText = $project.find(".project-cat").text().toLowerCase();
    if (catText && !catText.includes("tabletop")) return;

    const $titleLink = $project.find(".project-infobox h2 a").first();
    const title = $titleLink.text().trim();
    const href = $titleLink.attr("href") ?? "";
    if (!title || !href) return;

    // /projects/<creator>/<slug>/  → external_id = "<creator>/<slug>"
    const m = href.match(/\/projects\/([^/]+\/[^/?#]+)/);
    if (!m) return;
    const externalId = m[1];
    const slugBase = externalId.split("/").slice(-1)[0];
    const slug = slugify(slugBase) || slugify(title);

    const url = `https://www.kickstarter.com/projects/${externalId}`;

    const image_url = $project.find(".project-image img").first().attr("src") ?? null;

    // "Race, strategize, and outplay your rivals..." sits in a <div> immediately
    // after the h2 inside .project-infobox.
    const blurbDivs = $project.find(".project-infobox > div");
    let blurb: string | null = null;
    blurbDivs.each((_, b) => {
      const $b = $(b);
      if (blurb) return;
      const text = $b.text().trim();
      if (text && !$b.hasClass("project-cat") && !$b.hasClass("project-infobits")) {
        blurb = text.slice(0, 280);
      }
    });

    const detailsText = $project.find(".project-details").text();
    const fundedMatch = detailsText.match(/Funding:\s*([^\s]+)\s*of\s*([^\s(]+)\s*\(([^)]+)\)/i);
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

    if (funded_percent == null) {
      // Fallback to the big % badge on the pledgilizer
      funded_percent = parsePercent($project.find(".project-pledgilizer-mid h4").text());
    }

    const backersMatch = detailsText.match(/Backers:\s*(\d[\d,]*)/i);
    const backers = backersMatch ? parseInteger(backersMatch[1]) : null;

    const timeLeftMatch = detailsText.match(/time left:\s*([^\n]+)/i);
    const timeLeft = timeLeftMatch ? timeLeftMatch[1] : "";
    const ends_at = parseEndsIn(timeLeft);

    // Creator slug is the first part of the kicktraq path; not guaranteed to
    // be a display name but better than nothing.
    const creator = externalId.split("/")[0]?.replace(/-/g, " ") || null;

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
 * Fetch and parse Kicktraq's tabletop feeds, dedupe by external_id (first
 * source wins so ending_soon stays labelled ending_soon even if the project
 * also appears in the live/newest feed).
 */
export async function fetchKickstarterProjects(): Promise<KickstarterProject[]> {
  const seen = new Map<string, KickstarterProject>();

  for (const source of SOURCE_PAGES) {
    try {
      const html = await fetchPage(source.path);
      const parsed = parseListing(html, source.status);
      for (const p of parsed) {
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
