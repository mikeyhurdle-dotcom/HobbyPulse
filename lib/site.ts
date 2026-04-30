// ---------------------------------------------------------------------------
// Site Config Resolver — reads SITE_VERTICAL env var to determine which
// vertical this deployment is locked to.
// ---------------------------------------------------------------------------

import { verticals } from "@/config/verticals";
import type { VerticalConfig, VerticalBrand } from "@/config/verticals";

const DEFAULT_VERTICAL = "tabletop";

/**
 * Return the VerticalConfig for the current deployment.
 * Reads `NEXT_PUBLIC_SITE_VERTICAL` (available client + server) or
 * `SITE_VERTICAL` (server only). Falls back to "tabletop" for local dev.
 */
export function getSiteVertical(): VerticalConfig {
  const slug =
    process.env.NEXT_PUBLIC_SITE_VERTICAL ??
    process.env.SITE_VERTICAL ??
    DEFAULT_VERTICAL;

  const config = verticals[slug];
  if (!config) {
    throw new Error(
      `Unknown SITE_VERTICAL "${slug}". Valid values: ${Object.keys(verticals).join(", ")}`,
    );
  }
  return config;
}

/**
 * Return brand info for the current deployment (site name, tagline, domain).
 */
export function getSiteBrand(): VerticalBrand {
  return getSiteVertical().brand;
}

/**
 * SimRaceWatch was sunset on 2026-04-30 per the strategic pivot
 * (`bot/COMPETITIVE-VIABILITY-2026-04-30.md`). Content-generation crons
 * (youtube ingest, parse, transcripts, discover, live) should no-op when
 * the deployment vertical is `simracing`. The deals scraper still runs
 * (kept passive on free tier — data preserved as optionality).
 *
 * To unsunset: remove the `isSrwSunset()` guard from the affected crons
 * (or flip this function to always return false).
 */
export function isSrwSunset(): boolean {
  return getSiteVertical().slug === "simracing";
}
