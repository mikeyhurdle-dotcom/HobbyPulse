// ---------------------------------------------------------------------------
// Troll Trader Scraper — thetrolltrader.com
// ---------------------------------------------------------------------------
// Troll Trader specialises in second-hand / new-on-sprue (NOS) miniatures,
// so condition detection is important here.
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
          "Mozilla/5.0 (compatible; HobbyPulse/1.0; +https://hobbypulse.com)",
        Accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`Troll Trader scrape failed: ${res.status}`);
      return [];
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const products: ScrapedProduct[] = [];

    // Troll Trader uses a Shopify-based storefront
    $(".product-card, .grid-product").each((_i, el) => {
      try {
        const $el = $(el);
        const name =
          $el.find(".product-card__title, .grid-product__title").text().trim();
        const priceText = $el
          .find(".product-card__price, .grid-product__price")
          .first()
          .text()
          .trim();
        const href =
          $el.find("a").first().attr("href") ?? "";
        const imgSrc =
          $el.find("img").first().attr("src") ??
          $el.find("img").first().attr("data-src") ??
          null;
        const soldOut = $el
          .find(".product-card__sold-out, .badge--sold-out, .sold-out")
          .length > 0;

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
          source: this.name,
        });
      } catch {
        // Skip malformed product entries
      }
    });

    return products;
  }
}

function parsePricePence(priceStr: string): number | null {
  const cleaned = priceStr.replace(/[^0-9.]/g, "");
  const value = parseFloat(cleaned);
  if (isNaN(value)) return null;
  return Math.round(value * 100);
}

/**
 * Detect product condition from the title.
 * Troll Trader typically labels items as NOS, painted, etc.
 */
function detectCondition(
  title: string,
): "new" | "used" | "nos" | "painted" | "recasted" {
  const lower = title.toLowerCase();
  if (lower.includes("nos") || lower.includes("new on sprue")) return "nos";
  if (lower.includes("painted") || lower.includes("pro painted")) return "painted";
  if (lower.includes("nib") || lower.includes("new in box") || lower.includes("sealed"))
    return "new";
  if (lower.includes("recast")) return "recasted";
  // Default for Troll Trader — most items are used/stripped
  return "used";
}

function normaliseImageUrl(src: string | null): string | null {
  if (!src) return null;
  // Shopify sometimes uses protocol-relative URLs
  if (src.startsWith("//")) return `https:${src}`;
  return src;
}
