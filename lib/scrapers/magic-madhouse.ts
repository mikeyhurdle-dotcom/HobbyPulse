// ---------------------------------------------------------------------------
// Magic Madhouse Scraper (BigCommerce)
// ---------------------------------------------------------------------------
// Magic Madhouse runs on BigCommerce Cornerstone/Stencil. Their search page
// is fully client-rendered (no product data in HTML), and their GraphQL
// storefront requires an auth token. Instead, we scrape the server-rendered
// Games Workshop brand page, which lists all GW products paginated 24/page.
//
// On the first scrape() call in a given serverless invocation we fetch
// the first N pages and cache the results at module scope. Subsequent
// scrape() calls within the same invocation filter the cached product
// list by keyword — no re-fetching.
// ---------------------------------------------------------------------------

import * as cheerio from "cheerio";
import type { Scraper, ScrapedProduct } from "./index";

const BASE_URL = "https://www.magicmadhouse.co.uk";
const BRAND_PATH = "/brands/games-workshop/";
const PAGES_TO_FETCH = 5; // ~120 products (24/page)
const FETCH_TIMEOUT_MS = 10_000;

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

// ---------------------------------------------------------------------------
// Module-scope cache (persists for the duration of one serverless invocation)
// ---------------------------------------------------------------------------

let cachedCatalogue: ScrapedProduct[] | null = null;
let cachePromise: Promise<ScrapedProduct[]> | null = null;

async function fetchPage(pageNum: number): Promise<ScrapedProduct[]> {
  const url = `${BASE_URL}${BRAND_PATH}?page=${pageNum}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`Magic Madhouse page ${pageNum} HTTP ${res.status}`);
      return [];
    }

    const html = await res.text();
    return extractProductsFromHtml(html);
  } catch (err) {
    console.error(
      `Magic Madhouse page ${pageNum} fetch failed:`,
      err instanceof Error ? err.message : String(err),
    );
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function extractProductsFromHtml(html: string): ScrapedProduct[] {
  const $ = cheerio.load(html);
  const products: ScrapedProduct[] = [];

  $("li.product article.card").each((_i, el) => {
    const $card = $(el);

    // Name + URL
    const titleLink = $card.find("h4.card-title a").first();
    const name = titleLink.text().trim();
    const href = titleLink.attr("href")?.trim();
    if (!name || !href) return;

    // Normalise URL (brand page uses bare apex; prefer www for consistency
    // with our affiliate/UTM wrapping).
    const sourceUrl = href
      .replace(/^https:\/\/magicmadhouse\.co\.uk/, "https://www.magicmadhouse.co.uk")
      .split("?")[0];

    // Price
    const priceText = $card
      .find("span[data-product-price-with-tax]")
      .first()
      .text()
      .trim();
    const pricePence = parsePricePence(priceText);
    if (pricePence === null) return;

    // Image (lazyload or eager)
    const img = $card.find("img.card-image").first();
    const imageUrl =
      img.attr("data-src") ?? img.attr("src") ?? null;

    // Stock
    const inStock = $card.find(".price-section.out-of-stock").length === 0;

    products.push({
      name,
      price_pence: pricePence,
      currency: "GBP",
      condition: "new",
      source_url: sourceUrl,
      image_url: imageUrl,
      in_stock: inStock,
      source: "Magic Madhouse",
    });
  });

  return products;
}

function parsePricePence(priceStr: string): number | null {
  const cleaned = priceStr.replace(/[^0-9.]/g, "");
  const value = parseFloat(cleaned);
  if (isNaN(value) || value <= 0) return null;
  return Math.round(value * 100);
}

async function loadCatalogue(): Promise<ScrapedProduct[]> {
  if (cachedCatalogue) return cachedCatalogue;
  if (cachePromise) return cachePromise;

  cachePromise = (async () => {
    const pages = Array.from({ length: PAGES_TO_FETCH }, (_, i) => i + 1);
    const results = await Promise.all(pages.map(fetchPage));
    const flat = results.flat();

    // Deduplicate by source_url
    const seen = new Set<string>();
    const deduped = flat.filter((p) => {
      if (seen.has(p.source_url)) return false;
      seen.add(p.source_url);
      return true;
    });

    cachedCatalogue = deduped;
    return deduped;
  })();

  return cachePromise;
}

// ---------------------------------------------------------------------------
// Scraper implementation
// ---------------------------------------------------------------------------

export class MagicMadhouseScraper implements Scraper {
  readonly name = "Magic Madhouse";

  async scrape(keyword: string): Promise<ScrapedProduct[]> {
    const catalogue = await loadCatalogue();
    if (catalogue.length === 0) return [];

    // Simple case-insensitive substring match on name.
    // Most GW product names include the faction or starter box label
    // (e.g. "Warhammer 40,000 - Imperial Knights: Knight Destrier"),
    // which aligns with our search terms.
    const needle = keyword.toLowerCase();
    const tokens = needle.split(/\s+/).filter((t) => t.length >= 3);

    return catalogue.filter((p) => {
      const haystack = p.name.toLowerCase();
      // Require every meaningful token to appear
      return tokens.every((t) => haystack.includes(t));
    });
  }
}
