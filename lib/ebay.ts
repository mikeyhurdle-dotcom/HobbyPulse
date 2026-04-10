// ---------------------------------------------------------------------------
// eBay Browse API Client
// ---------------------------------------------------------------------------
// Uses the eBay Browse API (search endpoint) with OAuth client_credentials
// flow. All outbound links are wrapped with eBay Partner Network tracking.
// ---------------------------------------------------------------------------

const EBAY_API_BASE = "https://api.ebay.com";
const EBAY_AUTH_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const EBAY_APP_ID = process.env.EBAY_APP_ID!;
const EBAY_APP_SECRET = process.env.EBAY_APP_SECRET!;
const EBAY_CAMPAIGN_ID = process.env.EBAY_CAMPAIGN_ID ?? "";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EbayImage {
  imageUrl: string;
  height?: number;
  width?: number;
}

export interface EbayPrice {
  value: string;
  currency: string;
}

export interface EbaySeller {
  username: string;
  feedbackPercentage: string;
  feedbackScore: number;
}

export interface EbayItemSummary {
  itemId: string;
  title: string;
  image?: EbayImage;
  price: EbayPrice;
  condition: string;
  conditionId: string;
  itemWebUrl: string;
  seller: EbaySeller;
  categories?: { categoryId: string; categoryName: string }[];
  thumbnailImages?: EbayImage[];
  itemLocation?: { country: string; postalCode?: string };
}

export interface EbaySearchResponse {
  href: string;
  total: number;
  next?: string;
  limit: number;
  offset: number;
  itemSummaries?: EbayItemSummary[];
}

export interface EbayProduct {
  itemId: string;
  title: string;
  pricePence: number;
  currency: string;
  condition: string;
  imageUrl: string | null;
  itemUrl: string;
  affiliateUrl: string;
  sellerUsername: string;
  sellerFeedback: number;
}

export interface EbaySearchOptions {
  keyword: string;
  categoryId?: string;
  condition?: "NEW" | "USED" | "UNSPECIFIED";
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}

// ---------------------------------------------------------------------------
// OAuth token cache
// ---------------------------------------------------------------------------

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const credentials = Buffer.from(`${EBAY_APP_ID}:${EBAY_APP_SECRET}`).toString("base64");

  const res = await fetch(EBAY_AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`eBay OAuth error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
    token_type: string;
  };

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.token;
}

// ---------------------------------------------------------------------------
// Affiliate URL wrapper
// ---------------------------------------------------------------------------

export function wrapAffiliateUrl(itemUrl: string): string {
  if (!EBAY_CAMPAIGN_ID) return itemUrl;
  const url = new URL("https://rover.ebay.com/rover/1/710-53481-19255-0/1");
  url.searchParams.set("campid", EBAY_CAMPAIGN_ID);
  url.searchParams.set("toolid", "10001");
  url.searchParams.set("customid", "hobbypulse");
  url.searchParams.set("mpre", itemUrl);
  return url.toString();
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export async function searchEbay(options: EbaySearchOptions): Promise<EbayProduct[]> {
  const token = await getAccessToken();
  const limit = options.limit ?? 20;

  const url = new URL(`${EBAY_API_BASE}/buy/browse/v1/item_summary/search`);
  url.searchParams.set("q", options.keyword);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("fieldgroups", "MATCHING_ITEMS");

  // Filters
  const filters: string[] = [];

  if (options.categoryId) {
    url.searchParams.set("category_ids", options.categoryId);
  }

  if (options.condition) {
    const conditionMap: Record<string, string> = {
      NEW: "NEW",
      USED: "USED",
      UNSPECIFIED: "UNSPECIFIED",
    };
    filters.push(`conditionIds:{${conditionMap[options.condition]}}`);
  }

  if (options.minPrice !== undefined || options.maxPrice !== undefined) {
    const min = options.minPrice ?? 0;
    const max = options.maxPrice ?? 999999;
    filters.push(`price:[${min}..${max}]`);
    filters.push("priceCurrency:GBP");
  }

  // Always filter to UK marketplace
  url.searchParams.set("filter", ["deliveryCountry:GB", ...filters].join(","));

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_GB",
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`eBay Browse API error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as EbaySearchResponse;

  if (!data.itemSummaries) return [];

  return data.itemSummaries
    .filter((item) => !isJunkListing(item.title))
    .map((item): EbayProduct => {
      const priceGbp = parseFloat(item.price.value);
      const pricePence = Math.round(priceGbp * 100);

      return {
        itemId: item.itemId,
        title: item.title,
        pricePence,
        currency: item.price.currency,
        condition: normaliseEbayCondition(item.condition),
        imageUrl: upgradeEbayImageUrl(item.image?.imageUrl ?? null),
        itemUrl: item.itemWebUrl,
        affiliateUrl: wrapAffiliateUrl(item.itemWebUrl),
        sellerUsername: item.seller.username,
        sellerFeedback: item.seller.feedbackScore,
      };
    });
}

// ---------------------------------------------------------------------------
// Junk listing filter
// ---------------------------------------------------------------------------
// eBay sellers are sneaky — titles like "Starter Set Complete Accessories
// Bundle - No Models" or listings for individual sprues/bits that look like
// full kits. Filter these out so we don't mislead users.
// ---------------------------------------------------------------------------

const JUNK_PATTERNS: RegExp[] = [
  /\bno models?\b/i,
  /\bno mini(ature)?s?\b/i,
  /\bno figures?\b/i,
  /\baccessories only\b/i,
  /\bcards only\b/i,
  /\brulebook only\b/i,
  /\brules only\b/i,
  /\bbook only\b/i,
  /\bbits\b/i,
  /\bspares?\b/i,
  /\bsprue (leftover|spare|bit)/i,
  /\bleftover/i,
  /\bsingle model\b/i,
  /\b(1|one)\s*x?\s*model\b/i,
  /\bempty box\b/i,
  /\bbox only\b/i,
  /\btransfer sheet\b/i,
  /\bdecal sheet\b/i,
  /\binstruction(s)?\b/i,
  /\bbase(s)? only\b/i,
  /\btoken(s)?\b/i,
  /\bdice only\b/i,
];

function isJunkListing(title: string): boolean {
  return JUNK_PATTERNS.some((pattern) => pattern.test(title));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normaliseEbayCondition(condition: string): string {
  const lower = condition.toLowerCase();
  if (lower.includes("new")) return "new";
  if (lower.includes("used")) return "used";
  if (lower.includes("not specified") || lower.includes("unspecified")) return "used";
  return "used";
}

/**
 * Upgrade eBay image URLs from thumbnails to high-res.
 * eBay Browse API returns s-l225 (225px) by default.
 * Replace with s-l500 for crisp product images.
 */
function upgradeEbayImageUrl(url: string | null): string | null {
  if (!url) return null;
  return url.replace(/\/s-l\d+\./, "/s-l500.");
}
