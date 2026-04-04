// ---------------------------------------------------------------------------
// Element Games Scraper — elementgames.co.uk
// ---------------------------------------------------------------------------
// Element Games uses a custom storefront. Search is at /search?q=
// Products are listed as cards with image, title, price, and stock status.
// ---------------------------------------------------------------------------

import * as cheerio from "cheerio";
import type { Scraper, ScrapedProduct } from "./index";

const BASE_URL = "https://www.elementgames.co.uk";
const AFFILIATE_REF = process.env.ELEMENT_GAMES_AFFILIATE_REF ?? "";

export class ElementGamesScraper implements Scraper {
  readonly name = "Element Games";

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
      console.error(`Element Games scrape failed: ${res.status} for ${searchUrl}`);
      return [];
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const products: ScrapedProduct[] = [];

    // Element Games wraps each product in .search_item or similar card containers.
    // We look for product links that point to product pages and extract data
    // from the surrounding structure.
    const selectors = [
      ".search_item",
      ".product-card",
      ".product-item",
      '[class*="product"]',
    ];

    // Find the selector that matches
    let $items = $([]);
    for (const sel of selectors) {
      $items = $(sel);
      if ($items.length > 0) break;
    }

    // Fallback: find product links by URL pattern and walk up to parent card
    if ($items.length === 0) {
      const productLinks = $('a[href*="/games-workshop/"], a[href*="/warhammer"]');
      const parents = new Set<cheerio.Element>();
      productLinks.each((_i, el) => {
        // Walk up to a reasonable container
        const parent =
          $(el).closest('[class*="product"], [class*="search"], [class*="card"], [class*="item"]').get(0) ??
          $(el).parent().parent().get(0);
        if (parent) parents.add(parent);
      });
      $items = $(Array.from(parents));
    }

    $items.each((_i, el) => {
      try {
        const $el = $(el);
        const text = $el.text();

        // Find the product link
        const $link =
          $el.find('a[href*="/games-workshop/"]').first().length > 0
            ? $el.find('a[href*="/games-workshop/"]').first()
            : $el.find("a[href]").first();

        const href = $link.attr("href") ?? "";
        if (!href || href === "/" || href === "#") return;

        // Product name: try heading, then link text, then img alt
        const name =
          $el.find("h2, h3, h4").first().text().trim() ||
          $el.find("a").first().text().trim() ||
          $el.find("img").first().attr("alt")?.trim() ||
          "";

        if (!name || name.length < 3) return;

        // Price: find all price-like text in the element
        const priceMatch = text.match(/£(\d+\.\d{2})/g);
        if (!priceMatch || priceMatch.length === 0) return;

        // If multiple prices, the last/lowest is usually the discounted price
        const prices = priceMatch.map((p) => parsePricePence(p)).filter((p): p is number => p !== null);
        if (prices.length === 0) return;
        const bestPrice = Math.min(...prices);

        // Image
        const imgSrc =
          $el.find("img").first().attr("src") ??
          $el.find("img").first().attr("data-src") ??
          null;

        // Stock status: Element Games uses colour-coded button images.
        // green-button = in stock, blue-button = backorder, red-button = unavailable
        // The text includes ALL statuses (hidden via CSS), so we check images instead.
        const hasGreenButton =
          $el.find('img[src*="green-button"]').length > 0;
        const hasRedButton =
          $el.find('img[src*="red-button"]').length > 0;
        const inStock = hasGreenButton;
        const outOfStock = hasRedButton && !hasGreenButton;

        const sourceUrl = href.startsWith("http") ? href : `${BASE_URL}/${href.replace(/^\//, "")}`;

        products.push({
          name,
          price_pence: bestPrice,
          currency: "GBP",
          condition: "new",
          source_url: appendAffiliate(sourceUrl),
          image_url: normaliseImageUrl(imgSrc),
          in_stock: inStock && !outOfStock,
          source: this.name,
        });
      } catch {
        // Skip malformed entries
      }
    });

    return deduplicateByUrl(products);
  }
}

function parsePricePence(priceStr: string): number | null {
  const cleaned = priceStr.replace(/[^0-9.]/g, "");
  const value = parseFloat(cleaned);
  if (isNaN(value)) return null;
  return Math.round(value * 100);
}

function appendAffiliate(url: string): string {
  if (!AFFILIATE_REF) return url;
  try {
    const u = new URL(url);
    u.searchParams.set("ref", AFFILIATE_REF);
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Normalise and upgrade Element Games image URLs.
 * Search results serve `-small.jpg` thumbnails (~150px).
 * Replace with `-large.jpg` for high-res product images.
 */
function normaliseImageUrl(src: string | null): string | null {
  if (!src) return null;
  let url = src;
  if (url.startsWith("//")) url = `https:${url}`;
  else if (url.startsWith("/")) url = `${BASE_URL}${url}`;

  // Upgrade -small to -large
  url = url.replace(/-small\./, "-large.");

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
