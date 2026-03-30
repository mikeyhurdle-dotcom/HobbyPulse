// ---------------------------------------------------------------------------
// Element Games Scraper — elementgames.co.uk
// ---------------------------------------------------------------------------

import * as cheerio from "cheerio";
import type { Scraper, ScrapedProduct } from "./index";

const BASE_URL = "https://www.elementgames.co.uk";
const AFFILIATE_REF = process.env.ELEMENT_GAMES_AFFILIATE_REF ?? "";

export class ElementGamesScraper implements Scraper {
  readonly name = "Element Games";

  async scrape(keyword: string): Promise<ScrapedProduct[]> {
    const searchUrl = `${BASE_URL}/catalogsearch/result/?q=${encodeURIComponent(keyword)}`;

    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; HobbyPulse/1.0; +https://hobbypulse.com)",
        Accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`Element Games scrape failed: ${res.status}`);
      return [];
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const products: ScrapedProduct[] = [];

    $(".product-item").each((_i, el) => {
      try {
        const $el = $(el);
        const name = $el.find(".product-item-link").text().trim();
        const priceText = $el.find(".price").first().text().trim();
        const href = $el.find(".product-item-link").attr("href") ?? "";
        const imgSrc =
          $el.find(".product-image-photo").attr("src") ??
          $el.find(".product-image-photo").attr("data-src") ??
          null;
        const stockText = $el.find(".stock").text().trim().toLowerCase();

        if (!name || !priceText) return;

        const pricePence = parsePricePence(priceText);
        if (pricePence === null) return;

        const sourceUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;

        products.push({
          name,
          price_pence: pricePence,
          currency: "GBP",
          condition: "new",
          source_url: appendAffiliate(sourceUrl),
          image_url: imgSrc,
          in_stock: !stockText.includes("out of stock"),
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

function appendAffiliate(url: string): string {
  if (!AFFILIATE_REF) return url;
  const u = new URL(url);
  u.searchParams.set("ref", AFFILIATE_REF);
  return u.toString();
}
