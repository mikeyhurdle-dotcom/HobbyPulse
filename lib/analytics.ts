// ---------------------------------------------------------------------------
// Client-side analytics event helpers
// ---------------------------------------------------------------------------
// These fire GA4 custom events via gtag(). They no-op if GA4 is not loaded.
// ---------------------------------------------------------------------------

"use client";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function gtag(...args: unknown[]) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag(...args);
  }
}

/** Track an outbound / affiliate click */
export function trackOutboundClick(url: string, source: string) {
  gtag("event", "outbound_click", {
    event_category: "affiliate",
    event_label: url,
    source,
  });
}

/** Track a search action */
export function trackSearch(query: string, vertical: string) {
  gtag("event", "search", {
    search_term: query,
    vertical,
  });
}

/** Track a "Build My Army" calculation */
export function trackBuildArmy(unitCount: number, totalCost: number) {
  gtag("event", "build_army", {
    unit_count: unitCount,
    total_cost_pence: totalCost,
  });
}
