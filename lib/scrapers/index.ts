// ---------------------------------------------------------------------------
// Retailer Scraper Framework
// ---------------------------------------------------------------------------

export interface ScrapedProduct {
  name: string;
  price_pence: number;
  currency: string;
  condition: "new" | "used" | "nos" | "painted" | "recasted";
  source_url: string;
  image_url: string | null;
  in_stock: boolean;
  source: string;
  /** Manufacturer RRP in pence, if the retailer shows it (e.g. Element Games oldprice). */
  rrp_pence?: number;
}

export interface Scraper {
  /** Retailer name (used as `source` in listings) */
  readonly name: string;

  /** Scrape products matching a keyword search */
  scrape(keyword: string): Promise<ScrapedProduct[]>;
}

// ---------------------------------------------------------------------------
// Re-export all scrapers
// ---------------------------------------------------------------------------

import { ElementGamesScraper } from "./element-games";
import { WaylandGamesScraper } from "./wayland-games";
import { TrollTraderScraper } from "./troll-trader";
import { ShopifyScraper } from "./shopify";
import { MagicMadhouseScraper } from "./magic-madhouse";

export { ElementGamesScraper, WaylandGamesScraper, TrollTraderScraper, ShopifyScraper, MagicMadhouseScraper };

/**
 * Get all scrapers for a given vertical.
 * Returns only scrapers relevant to that vertical's retailer list.
 */
export function getScrapersForVertical(vertical: string): Scraper[] {
  if (vertical === "tabletop") {
    return [
      new ElementGamesScraper(),
      new WaylandGamesScraper(),
      new TrollTraderScraper(),
      // Goblin Gaming — Shopify, UK GW discounter. Added 2026-04-09 ahead of
      // affiliate application so we can demonstrate existing traffic.
      new ShopifyScraper({
        name: "Goblin Gaming",
        baseUrl: "https://www.goblingaming.co.uk",
        currency: "GBP",
      }),
      // Magic Madhouse — BigCommerce, scrapes /brands/games-workshop/.
      // Added 2026-04-09 to expand retailer coverage before applying to
      // their affiliate programme. Search is client-rendered so we can't
      // use keyword-based search; instead we cache the full GW brand
      // catalogue per invocation and filter in-memory.
      new MagicMadhouseScraper(),
    ];
  }

  if (vertical === "simracing") {
    return [
      // Moza Racing — Shopify, direct-to-consumer (EUR prices)
      new ShopifyScraper({
        name: "Moza Racing",
        baseUrl: "https://mozaracing.com",
        currency: "EUR",
      }),
      // Trak Racer — Shopify, rigs & cockpits (GBP)
      new ShopifyScraper({
        name: "Trak Racer",
        baseUrl: "https://trakracer.com",
        currency: "GBP",
      }),
    ];
  }

  return [];
}
