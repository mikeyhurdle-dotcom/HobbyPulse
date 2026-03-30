// ---------------------------------------------------------------------------
// Affiliate Link Middleware
// ---------------------------------------------------------------------------
// Centralised affiliate URL wrapping. Appends the correct affiliate param
// based on the URL domain, plus UTM tracking params.
// ---------------------------------------------------------------------------

import { getSiteBrand } from "@/lib/site";

interface AffiliateConfig {
  /** Domain substring to match against the URL */
  domain: string;
  /** Env var key holding the affiliate ID */
  envKey: string;
  /** Query param name to append */
  param: string;
}

const AFFILIATE_CONFIGS: AffiliateConfig[] = [
  { domain: "ebay.co.uk", envKey: "EBAY_CAMPAIGN_ID", param: "campid" },
  { domain: "ebay.com", envKey: "EBAY_CAMPAIGN_ID", param: "campid" },
  { domain: "elementgames.co.uk", envKey: "ELEMENT_GAMES_AFFILIATE_REF", param: "ref" },
  { domain: "waylandgames.co.uk", envKey: "WAYLAND_GAMES_AFFILIATE_REF", param: "ref" },
  { domain: "amazon.co.uk", envKey: "AMAZON_ASSOCIATES_TAG", param: "tag" },
  { domain: "amazon.com", envKey: "AMAZON_ASSOCIATES_TAG", param: "tag" },
];

/**
 * Wrap a URL with affiliate parameters (if configured) and UTM tracking.
 *
 * @param url - The raw product / listing URL
 * @param source - A human-readable source label, e.g. "deals-page", "build-army"
 * @returns The URL with affiliate + UTM params appended, or the raw URL if no config
 */
export function wrapAffiliateUrl(url: string, source: string): string {
  try {
    const parsed = new URL(url);
    const brand = getSiteBrand();

    // Find matching affiliate config
    const config = AFFILIATE_CONFIGS.find((c) =>
      parsed.hostname.includes(c.domain),
    );

    if (config) {
      const affiliateId = process.env[config.envKey];
      if (affiliateId) {
        parsed.searchParams.set(config.param, affiliateId);
      }
    }

    // UTM tracking
    parsed.searchParams.set("utm_source", brand.siteName.toLowerCase().replace(/\s+/g, "-"));
    parsed.searchParams.set("utm_medium", "affiliate");
    parsed.searchParams.set("utm_campaign", source);

    return parsed.toString();
  } catch {
    // Invalid URL — return as-is
    return url;
  }
}
