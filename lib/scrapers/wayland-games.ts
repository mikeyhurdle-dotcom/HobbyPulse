// ---------------------------------------------------------------------------
// Wayland Games Scraper — waylandgames.co.uk
// ---------------------------------------------------------------------------
// STATUS: DISABLED — Wayland Games is behind Cloudflare protection and returns
// 403 on all automated requests. Keeping the scraper structure in place so it
// can be re-enabled if we find a workaround (e.g. API access, RSS feed,
// or affiliate data feed).
// ---------------------------------------------------------------------------

import type { Scraper, ScrapedProduct } from "./index";

export class WaylandGamesScraper implements Scraper {
  readonly name = "Wayland Games";

  async scrape(_keyword: string): Promise<ScrapedProduct[]> {
    // Wayland Games blocks automated requests with Cloudflare (403).
    // Return empty until we have an alternative approach:
    // - Affiliate data feed (ask when signing up for affiliate programme)
    // - Google Shopping API as a proxy
    // - Manual price entry via admin
    return [];
  }
}
