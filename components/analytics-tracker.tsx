"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { track } from "@vercel/analytics";

/**
 * Global analytics bridge. Mounts once in the root layout and handles two
 * behaviours that would otherwise need to be repeated across many files:
 *
 *  1. **Delegated affiliate click tracking** — every wrapped affiliate URL
 *     carries `utm_medium=affiliate` thanks to `wrapAffiliateUrl()`. We listen
 *     at the document level and fire a `affiliate_click` event whenever an
 *     anchor with that marker is clicked. Zero changes needed to the ~20+
 *     affiliate link usages across the codebase.
 *
 *  2. **Search tracking** — when the user lands on /deals with a `?q=` param
 *     (the result of submitting the search form), we fire a `search` event
 *     once per distinct query.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // --- Delegated affiliate click listener -----------------------------------
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      // Walk up from the click target looking for an anchor.
      let el = event.target as HTMLElement | null;
      while (el && el !== document.body) {
        if (el.tagName === "A") break;
        el = el.parentElement;
      }
      if (!el || el.tagName !== "A") return;

      const href = (el as HTMLAnchorElement).href;
      if (!href) return;

      let url: URL;
      try {
        url = new URL(href);
      } catch {
        return;
      }

      // Our affiliate wrapper always stamps this exact marker.
      if (url.searchParams.get("utm_medium") !== "affiliate") return;

      track("affiliate_click", {
        domain: url.hostname.replace(/^www\./, ""),
        campaign: url.searchParams.get("utm_campaign") ?? "unknown",
        source_page: window.location.pathname,
      });
    }

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  // --- Search event on /deals?q=... -----------------------------------------
  useEffect(() => {
    if (pathname !== "/deals") return;
    const q = searchParams.get("q");
    if (!q || q.trim().length === 0) return;
    track("search", {
      query: q.slice(0, 100),
      page: pathname,
    });
  }, [pathname, searchParams]);

  return null;
}
