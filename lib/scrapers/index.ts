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

import { WaylandGamesScraper } from "./wayland-games";
import { ShopifyScraper } from "./shopify";

export { WaylandGamesScraper, ShopifyScraper };

/**
 * Get all scrapers for a given vertical.
 * Returns only scrapers relevant to that vertical's retailer list.
 *
 * 2026-04-30 pivot: TabletopWatch is board-games-only. Element Games,
 * Troll Trader, and Magic Madhouse (which only scrapes
 * /brands/games-workshop/) were removed because they're Warhammer-only
 * sources. Wayland Games covers board games too and stays — currently
 * disabled by Cloudflare 403 anyway, re-enable when a feed is available.
 */
export function getScrapersForVertical(vertical: string): Scraper[] {
  if (vertical === "tabletop") {
    return [
      new WaylandGamesScraper(),
      // Goblin Gaming — Shopify, UK board-game retailer. Search returns
      // whatever matches the term, so board-game search terms only surface
      // board-game stock.
      new ShopifyScraper({
        name: "Goblin Gaming",
        baseUrl: "https://www.goblingaming.co.uk",
        currency: "GBP",
      }),
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
