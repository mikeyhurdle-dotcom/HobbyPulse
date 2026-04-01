// ---------------------------------------------------------------------------
// Troll Trader Scraper — thetrolltrader.com
// ---------------------------------------------------------------------------
// Troll Trader runs on Shopify with client-side rendering. Product data is
// embedded in <script> tags as JSON rather than in HTML elements.
// We parse the meta.products array and searchResultsData for product info.
// ---------------------------------------------------------------------------

import * as cheerio from "cheerio";
import type { Scraper, ScrapedProduct } from "./index";

const BASE_URL = "https://thetrolltrader.com";

export class TrollTraderScraper implements Scraper {
  readonly name = "Troll Trader";

  async scrape(keyword: string): Promise<ScrapedProduct[]> {
    const searchUrl = `${BASE_URL}/search?q=${encodeURIComponent(keyword)}`;

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
      console.error(`Troll Trader scrape failed: ${res.status}`);
      return [];
    }

    const html = await res.text();
    const products: ScrapedProduct[] = [];

    // Strategy 1: Parse searchResultsData from script tags (most complete)
    const searchDataProducts = extractSearchResultsData(html);
    if (searchDataProducts.length > 0) return searchDataProducts;

    // Strategy 2: Parse var meta = {...} from script tags
    const metaProducts = extractMetaProducts(html);
    if (metaProducts.length > 0) return metaProducts;

    // Strategy 3: Fall back to HTML parsing (may still work for some pages)
    return extractFromHtml(html);
  }
}

// ---------------------------------------------------------------------------
// Strategy 1: searchResultsData JSON
// ---------------------------------------------------------------------------

interface SearchResultVariant {
  price: { amount: number; currencyCode: string };
  product: {
    title: string;
    url: string;
    id: string;
  };
  image?: { src: string };
}

function extractSearchResultsData(html: string): ScrapedProduct[] {
  const products: ScrapedProduct[] = [];

  // Look for productVariants in any script tag
  const variantPattern = /"productVariants"\s*:\s*\[/;
  const match = html.match(variantPattern);
  if (!match) return [];

  // Extract the containing JSON object
  const startIdx = html.lastIndexOf("{", match.index!);
  if (startIdx === -1) return [];

  // Find the matching closing brace
  const jsonStr = extractJsonObject(html, startIdx);
  if (!jsonStr) return [];

  try {
    const data = JSON.parse(jsonStr);
    const variants: SearchResultVariant[] = data?.searchResult?.productVariants ?? data?.productVariants ?? [];

    for (const v of variants) {
      if (!v.product?.title || !v.price?.amount) continue;

      const name = v.product.title;
      const pricePence = Math.round(v.price.amount * 100);
      const url = v.product.url
        ? `${BASE_URL}${v.product.url.split("?")[0]}`
        : "";

      if (!url) continue;

      products.push({
        name,
        price_pence: pricePence,
        currency: v.price.currencyCode ?? "GBP",
        condition: detectCondition(name),
        source_url: url,
        image_url: normaliseImageUrl(v.image?.src ?? null),
        in_stock: true, // If it appears in search results, assume in stock
        source: "Troll Trader",
      });
    }
  } catch {
    // JSON parsing failed
  }

  return deduplicateByUrl(products);
}

// ---------------------------------------------------------------------------
// Strategy 2: var meta = {...} JSON
// ---------------------------------------------------------------------------

interface MetaProduct {
  id: number;
  handle: string;
  vendor: string;
  type: string;
  variants: {
    id: number;
    price: number;
    name: string;
    sku: string;
  }[];
}

function extractMetaProducts(html: string): ScrapedProduct[] {
  const products: ScrapedProduct[] = [];

  // Look for var meta = {...}
  const metaMatch = html.match(/var\s+meta\s*=\s*(\{[\s\S]*?\});/);
  if (!metaMatch) return [];

  try {
    const meta = JSON.parse(metaMatch[1]);
    const metaProducts: MetaProduct[] = meta?.products ?? [];

    for (const mp of metaProducts) {
      const variant = mp.variants?.[0];
      if (!variant?.name || !variant?.price) continue;

      const name = variant.name;
      // Troll Trader meta prices are in pence (integer)
      const pricePence = variant.price < 100 ? Math.round(variant.price * 100) : variant.price;
      const url = mp.handle ? `${BASE_URL}/products/${mp.handle}` : "";

      if (!url) continue;

      products.push({
        name,
        price_pence: pricePence,
        currency: "GBP",
        condition: detectCondition(name),
        source_url: url,
        image_url: null, // Meta data doesn't include images
        in_stock: true,
        source: "Troll Trader",
      });
    }
  } catch {
    // JSON parsing failed
  }

  return deduplicateByUrl(products);
}

// ---------------------------------------------------------------------------
// Strategy 3: HTML fallback
// ---------------------------------------------------------------------------

function extractFromHtml(html: string): ScrapedProduct[] {
  const $ = cheerio.load(html);
  const products: ScrapedProduct[] = [];

  $(".product-card, .grid-product, .product-item, [class*='product']").each((_i, el) => {
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
        : `${BASE_URL}${href}`;

      products.push({
        name,
        price_pence: pricePence,
        currency: "GBP",
        condition: detectCondition(name),
        source_url: sourceUrl,
        image_url: normaliseImageUrl(imgSrc),
        in_stock: !soldOut,
        source: "Troll Trader",
      });
    } catch {
      // Skip
    }
  });

  return deduplicateByUrl(products);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parsePricePence(priceStr: string): number | null {
  const cleaned = priceStr.replace(/[^0-9.]/g, "");
  const value = parseFloat(cleaned);
  if (isNaN(value)) return null;
  return Math.round(value * 100);
}

function detectCondition(
  title: string,
): "new" | "used" | "nos" | "painted" | "recasted" {
  const lower = title.toLowerCase();
  if (lower.includes("nos") || lower.includes("new on sprue")) return "nos";
  if (lower.includes("painted") || lower.includes("pro painted")) return "painted";
  if (lower.includes("nib") || lower.includes("new in box") || lower.includes("sealed"))
    return "new";
  if (lower.includes("recast")) return "recasted";
  return "used";
}

function normaliseImageUrl(src: string | null): string | null {
  if (!src) return null;
  if (src.startsWith("//")) return `https:${src}`;
  return src;
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
