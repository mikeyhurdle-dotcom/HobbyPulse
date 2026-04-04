// ---------------------------------------------------------------------------
// Generic Shopify Scraper
// ---------------------------------------------------------------------------
// Many sim racing and hobby retailers run on Shopify. Product data is embedded
// in <script> tags as JSON (var meta, searchResultsData) rather than in HTML.
// This scraper extracts from those JSON sources, with an HTML fallback.
//
// Used by: Troll Trader, Moza Racing, Trak Racer (and any future Shopify store)
// ---------------------------------------------------------------------------

import * as cheerio from "cheerio";
import type { Scraper, ScrapedProduct } from "./index";

type Condition = ScrapedProduct["condition"];

interface ShopifyScraperConfig {
  /** Display name used as `source` in listings */
  name: string;
  /** Base URL (no trailing slash) */
  baseUrl: string;
  /** Currency code (default: GBP) */
  currency?: string;
  /** Function to detect condition from product title (default: always "new") */
  detectCondition?: (title: string) => Condition;
}

export class ShopifyScraper implements Scraper {
  readonly name: string;
  private baseUrl: string;
  private currency: string;
  private detectCondition: (title: string) => Condition;

  constructor(config: ShopifyScraperConfig) {
    this.name = config.name;
    this.baseUrl = config.baseUrl;
    this.currency = config.currency ?? "GBP";
    this.detectCondition = config.detectCondition ?? (() => "new");
  }

  async scrape(keyword: string): Promise<ScrapedProduct[]> {
    const searchUrl = `${this.baseUrl}/search?q=${encodeURIComponent(keyword)}`;

    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`${this.name} scrape failed: ${res.status}`);
      return [];
    }

    const html = await res.text();

    // Strategy 1: searchResultsData JSON (most complete — has prices + images)
    const searchResults = this.extractSearchResultsData(html);
    if (searchResults.length > 0) return searchResults;

    // Strategy 2: var meta = {...} JSON
    const metaResults = this.extractMetaProducts(html);
    if (metaResults.length > 0) return metaResults;

    // Strategy 3: HTML fallback
    return this.extractFromHtml(html);
  }

  // -------------------------------------------------------------------------
  // Strategy 1: searchResultsData / productVariants JSON
  // -------------------------------------------------------------------------

  private extractSearchResultsData(html: string): ScrapedProduct[] {
    const products: ScrapedProduct[] = [];

    const variantPattern = /"productVariants"\s*:\s*\[/;
    const match = html.match(variantPattern);
    if (!match) return [];

    const startIdx = html.lastIndexOf("{", match.index!);
    if (startIdx === -1) return [];

    const jsonStr = extractJsonObject(html, startIdx);
    if (!jsonStr) return [];

    try {
      const data = JSON.parse(jsonStr);
      const variants =
        data?.searchResult?.productVariants ??
        data?.productVariants ??
        [];

      for (const v of variants) {
        if (!v.product?.title || !v.price?.amount) continue;

        const name = v.product.title;
        const amount = typeof v.price.amount === "number"
          ? v.price.amount
          : parseFloat(v.price.amount);
        if (isNaN(amount) || amount <= 0) continue;

        const pricePence = Math.round(amount * 100);
        const url = v.product.url
          ? `${this.baseUrl}${v.product.url.split("?")[0]}`
          : "";
        if (!url) continue;

        products.push({
          name,
          price_pence: pricePence,
          currency: v.price.currencyCode ?? this.currency,
          condition: this.detectCondition(name),
          source_url: url,
          image_url: normaliseImageUrl(v.image?.src ?? null),
          in_stock: true,
          source: this.name,
        });
      }
    } catch {
      // JSON parsing failed
    }

    return deduplicateByUrl(products);
  }

  // -------------------------------------------------------------------------
  // Strategy 2: var meta = {...} JSON
  // -------------------------------------------------------------------------

  private extractMetaProducts(html: string): ScrapedProduct[] {
    const products: ScrapedProduct[] = [];

    const metaMatch = html.match(/var\s+meta\s*=\s*(\{[\s\S]*?\});/);
    if (!metaMatch) return [];

    // Build a map of product handle → image URL from HTML product cards
    const imageMap = this.extractImageMapFromHtml(html);

    try {
      const meta = JSON.parse(metaMatch[1]);
      const metaProducts = meta?.products ?? [];

      for (const mp of metaProducts) {
        const variant = mp.variants?.[0];
        if (!variant?.name || !variant?.price) continue;

        const name = variant.name;
        // Shopify meta prices are in smallest currency unit (pence/cents)
        const pricePence = typeof variant.price === "number"
          ? variant.price
          : parseInt(String(variant.price), 10);
        const handle = mp.handle ?? "";
        const url = handle
          ? `${this.baseUrl}/products/${handle}`
          : "";
        if (!url) continue;

        products.push({
          name,
          price_pence: pricePence,
          currency: this.currency,
          condition: this.detectCondition(name),
          source_url: url,
          image_url: imageMap.get(handle) ?? null,
          in_stock: true,
          source: this.name,
        });
      }
    } catch {
      // JSON parsing failed
    }

    return deduplicateByUrl(products);
  }

  /**
   * Extract a map of product handle → image URL from HTML product cards.
   * Used to enrich Strategy 2 (var meta) which lacks images.
   */
  private extractImageMapFromHtml(html: string): Map<string, string> {
    const $ = cheerio.load(html);
    const map = new Map<string, string>();

    $("a[href*='/products/']").each((_i, el) => {
      const href = $(el).attr("href") ?? "";
      const handleMatch = href.match(/\/products\/([^?#/]+)/);
      if (!handleMatch) return;

      const handle = handleMatch[1];
      if (map.has(handle)) return;

      // Look for an image within or near this link
      const img =
        $(el).find("img").first().attr("src") ??
        $(el).find("img").first().attr("data-src") ??
        $(el).parent().find("img").first().attr("src") ??
        null;

      if (img) {
        map.set(handle, normaliseImageUrl(img) ?? "");
      }
    });

    return map;
  }

  // -------------------------------------------------------------------------
  // Strategy 3: HTML fallback
  // -------------------------------------------------------------------------

  private extractFromHtml(html: string): ScrapedProduct[] {
    const $ = cheerio.load(html);
    const products: ScrapedProduct[] = [];

    $(
      ".product-card, .grid-product, .product-item, [class*='product']",
    ).each((_i, el) => {
      try {
        const $el = $(el);
        const name =
          $el.find("[class*='title'], h2, h3").first().text().trim() ||
          $el.find("a").first().text().trim();
        const priceText = $el.find("[class*='price']").first().text().trim();
        const href = $el.find("a").first().attr("href") ?? "";
        const imgSrc =
          $el.find("img").first().attr("src") ??
          $el.find("img").first().attr("data-src") ??
          null;
        const soldOut =
          $el.find("[class*='sold-out'], [class*='sold_out']").length > 0;

        if (!name || !priceText) return;

        const pricePence = parsePricePence(priceText);
        if (pricePence === null) return;

        const sourceUrl = href.startsWith("http")
          ? href
          : `${this.baseUrl}${href}`;

        products.push({
          name,
          price_pence: pricePence,
          currency: this.currency,
          condition: this.detectCondition(name),
          source_url: sourceUrl,
          image_url: normaliseImageUrl(imgSrc),
          in_stock: !soldOut,
          source: this.name,
        });
      } catch {
        // Skip
      }
    });

    return deduplicateByUrl(products);
  }
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function parsePricePence(priceStr: string): number | null {
  const cleaned = priceStr.replace(/[^0-9.]/g, "");
  const value = parseFloat(cleaned);
  if (isNaN(value)) return null;
  return Math.round(value * 100);
}

/**
 * Normalise and upgrade Shopify CDN image URLs to high-res versions.
 * Shopify serves thumbnails by default (e.g. _100x100, _small, _compact).
 * We strip the size suffix and request a 600px wide version via query param.
 */
function normaliseImageUrl(src: string | null): string | null {
  if (!src) return null;
  let url = src.startsWith("//") ? `https:${src}` : src;

  // Strip Shopify size suffixes like _100x100, _small, _medium, _large, _grande, _compact
  // Pattern: _<digits>x<digits> or _<named_size> before the file extension
  url = url.replace(
    /(_(?:\d+x\d+|pico|icon|thumb|small|compact|medium|large|grande|original|master))(\.\w+)(\?.*)?$/,
    "$2$3",
  );

  // Append width param for Shopify CDN (cdn.shopify.com) to get a crisp 600px image
  if (url.includes("cdn.shopify.com")) {
    const sep = url.includes("?") ? "&" : "?";
    url = `${url}${sep}width=600`;
  }

  return url;
}

function deduplicateByUrl(products: ScrapedProduct[]): ScrapedProduct[] {
  const seen = new Set<string>();
  return products.filter((p) => {
    if (seen.has(p.source_url)) return false;
    seen.add(p.source_url);
    return true;
  });
}

/**
 * Extract a JSON object from a string starting at a given index.
 * Handles nested braces.
 */
function extractJsonObject(str: string, startIdx: number): string | null {
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIdx; i < str.length && i < startIdx + 50000; i++) {
    const ch = str[i];

    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) {
        return str.slice(startIdx, i + 1);
      }
    }
  }

  return null;
}
