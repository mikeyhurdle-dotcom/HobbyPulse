"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  TEALIUM_UTAG_URL,
  buildDataLayer,
  pageTypeFromPath,
} from "@/lib/tealium";

interface TealiumProps {
  vertical: string;
  domain: string;
}

/**
 * Loads Tealium iQ utag.js once, sets the initial data layer before utag
 * boots, and emits utag.view() on every client-side route change so SPA
 * navigations are counted (otherwise only the first hit is tracked).
 *
 * Click-attribution: a single capture-phase delegated listener on
 * <document> watches for clicks on anchors with rel*="sponsored" and
 * fires utag.link() with affiliate context. That covers every existing
 * affiliate link without modifying components.
 */
export function Tealium({ vertical, domain }: TealiumProps) {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  // Initial data layer — populated synchronously so utag.js can read it
  // when it boots. Subsequent navigations call utag.view() with fresh data.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.utag_data = buildDataLayer({ vertical, domain, pathname });
  }, [vertical, domain, pathname]);

  // SPA route-change pageviews
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.utag?.view) return;
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;
    window.utag.view(buildDataLayer({ vertical, domain, pathname }));
  }, [pathname, vertical, domain]);

  // Affiliate-click delegation
  useEffect(() => {
    if (typeof window === "undefined") return;

    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[rel*='sponsored']") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (!window.utag?.link) return;

      const href = anchor.href || "";
      let outboundDomain = "";
      try {
        outboundDomain = new URL(href).hostname.replace(/^www\./, "");
      } catch {
        // Ignore malformed URLs — utag.link still fires with what we have
      }

      // Loose retailer label sniff — Tealium load rules can refine.
      const retailer = inferRetailer(outboundDomain);

      window.utag.link({
        tealium_event: "affiliate_click",
        site: window.utag_data?.site,
        vertical,
        page_type: pageTypeFromPath(pathname),
        page_path: pathname,
        outbound_url: href,
        outbound_domain: outboundDomain,
        retailer,
      });
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true } as EventListenerOptions);
  }, [vertical, pathname]);

  return (
    <Script
      id="tealium-utag"
      strategy="afterInteractive"
      src={TEALIUM_UTAG_URL}
    />
  );
}

function inferRetailer(host: string): string {
  if (!host) return "unknown";
  if (host.includes("amazon.")) return "amazon";
  if (host.includes("ebay.")) return "ebay";
  if (host.includes("kickstarter.")) return "kickstarter";
  if (host.includes("backerkit.")) return "backerkit";
  if (host.includes("elementgames")) return "element_games";
  if (host.includes("waylandgames")) return "wayland_games";
  if (host.includes("goblingaming")) return "goblin_gaming";
  if (host.includes("magicmadhouse")) return "magic_madhouse";
  if (host.includes("zatu") || host.includes("board-game.co.uk")) return "zatu";
  if (host.includes("trolltrader")) return "troll_trader";
  if (host.includes("mozaracing")) return "moza";
  if (host.includes("trakracer")) return "trak_racer";
  if (host.includes("fanatec")) return "fanatec";
  return host.split(".")[0] || "unknown";
}
