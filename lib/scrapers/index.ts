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

export { ElementGamesScraper, WaylandGamesScraper, TrollTraderScraper };

/**
 * Get all scrapers for a given vertical.
 * Returns only scrapers relevant to that vertical's retailer list.
 */
export function getScrapersForVertical(vertical: string): Scraper[] {
  if (vertical === "warhammer") {
    return [
      new ElementGamesScraper(),
      new WaylandGamesScraper(),
      new TrollTraderScraper(),
    ];
  }

  // Other verticals can be added later
  return [];
}
