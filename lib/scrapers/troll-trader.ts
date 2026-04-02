// ---------------------------------------------------------------------------
// Troll Trader Scraper — thetrolltrader.com
// ---------------------------------------------------------------------------
// Uses the generic Shopify scraper with custom condition detection.
// Troll Trader specialises in second-hand / NOS miniatures.
// ---------------------------------------------------------------------------

import { ShopifyScraper } from "./shopify";

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

export class TrollTraderScraper extends ShopifyScraper {
  constructor() {
    super({
      name: "Troll Trader",
      baseUrl: "https://thetrolltrader.com",
      currency: "GBP",
      detectCondition,
    });
  }
}
