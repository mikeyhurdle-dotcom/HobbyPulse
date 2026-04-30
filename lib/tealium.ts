// ---------------------------------------------------------------------------
// Tealium iQ Tag Manager — server-resolved + client-emitted helpers.
// ---------------------------------------------------------------------------
// Account/profile/env get baked into the utag.js URL. The data layer
// shape is deliberately small and stable — tags configured inside
// Tealium iQ will map these to vendor-specific conventions (GA4, Hotjar,
// Meta CAPI, etc) without us touching code again.
// ---------------------------------------------------------------------------

export const TEALIUM_ACCOUNT = "services-mikey-gilson";
export const TEALIUM_PROFILE = "hobbypulse";
export const TEALIUM_ENV = "prod";

export const TEALIUM_UTAG_URL = `//tags.tiqcdn.com/utag/${TEALIUM_ACCOUNT}/${TEALIUM_PROFILE}/${TEALIUM_ENV}/utag.js`;

export interface TealiumDataLayer extends Record<string, unknown> {
  site: string;        // "tabletopwatch" | "simracewatch"
  vertical: string;    // "tabletop" | "simracing" — the runtime slug
  page_type: string;   // home | watch | deals | boardgames | game_detail | kickstarter | blog | etc
  page_path: string;
  environment: string;
}

/**
 * Derive a page_type from a pathname. Kept as plain string buckets so
 * Tealium load rules can match without regex on every property.
 */
export function pageTypeFromPath(pathname: string): string {
  if (pathname === "/" || pathname === "") return "home";

  const segments = pathname.replace(/^\/+/, "").split("/");
  const head = segments[0];
  const rest = segments.slice(1);

  switch (head) {
    case "watch":
      return rest.length > 0 ? "watch_detail" : "watch";
    case "deals":
      if (rest[0] === "c") return "deals_category";
      return rest.length > 0 ? "product_detail" : "deals";
    case "boardgames":
      if (rest[0] === "games") return rest.length > 1 ? "game_detail" : "game_directory";
      if (rest[0] === "reviews") return rest.length > 1 ? "review_detail" : "reviews";
      if (rest[0] === "best") return rest.length > 1 ? "best_detail" : "best";
      if (rest[0] === "versus") return rest.length > 1 ? "versus_detail" : "versus";
      if (rest[0] === "how-to-play") return rest.length > 1 ? "howtoplay_detail" : "howtoplay";
      if (rest[0] === "watch") return "boardgames_watch";
      if (rest[0] === "recommend") return "recommend";
      if (rest[0] === "compare") return "compare";
      if (rest[0] === "releases") return "boardgames_releases";
      if (rest[0] === "news") return "boardgames_news";
      return "boardgames";
    case "kickstarter":
      return rest.length > 0 ? "kickstarter_detail" : "kickstarter";
    case "blog":
      return rest.length > 0 ? "blog_post" : "blog";
    case "live":
      return "live";
    case "channels":
      return rest.length > 0 ? "channel_detail" : "channels";
    case "trending":
      return "trending";
    case "setups":
      return "setups";
    case "releases":
      return "releases";
    case "about":
    case "faq":
    case "contact":
    case "privacy":
      return head;
    default:
      return "other";
  }
}

/**
 * Build the data-layer object we want to attach to every utag.view().
 * `site` is whichever brand domain we're deployed under, `vertical`
 * is the env-controlled runtime slug.
 */
export function buildDataLayer(opts: {
  vertical: string;
  domain: string;
  pathname: string;
  environment?: string;
}): TealiumDataLayer {
  const site = opts.domain.replace(/^www\./, "").replace(/\..*$/, "");
  return {
    site,
    vertical: opts.vertical,
    page_type: pageTypeFromPath(opts.pathname),
    page_path: opts.pathname,
    environment: opts.environment ?? "production",
  };
}

declare global {
  interface Window {
    utag?: {
      view?: (data: Record<string, unknown>) => void;
      link?: (data: Record<string, unknown>) => void;
    };
    utag_data?: Record<string, unknown>;
  }
}
