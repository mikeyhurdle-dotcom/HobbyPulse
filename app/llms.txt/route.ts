// ---------------------------------------------------------------------------
// llms.txt — AI agent discoverability
// ---------------------------------------------------------------------------
// Serves a plain-text description of the site tailored to the current vertical.
// See https://llmstxt.org for the specification.
// ---------------------------------------------------------------------------

import { getSiteVertical, getSiteBrand } from "@/lib/site";

export const dynamic = "force-dynamic";

export function GET() {
  const config = getSiteVertical();
  const brand = getSiteBrand();

  const content = config.slug === "tabletop"
    ? `# ${brand.siteName}

> ${brand.tagline}

${brand.siteName} is a content and deals aggregator for the Warhammer tabletop hobby community.

## What this site offers

- **Watch**: Battle reports and hobby content from ${config.channels.length} YouTube channels, enriched with AI-extracted army lists (factions, units, points values).
- **Deals**: Price comparison across ${config.retailers.length} UK retailers (${config.retailers.map(r => r.name).join(", ")}). Updated daily with price drop detection.
- **Live**: Aggregated live streams from Twitch and YouTube for Warhammer 40K, Age of Sigmar, and The Old World.

## Content types

- Battle reports with structured army lists
- Painting tutorials and hobby guides
- Product reviews and unboxings
- Tactics and meta analysis

## Factions covered

${config.categories.map(c => `- ${c}`).join("\n")}

## API

This site does not currently offer a public API. Content is available through the web interface.

## Contact

hello@${brand.domain}
`
    : `# ${brand.siteName}

> ${brand.tagline}

${brand.siteName} is a content and deals aggregator for the sim racing community.

## What this site offers

- **Watch**: Race replays, setup guides, and hardware reviews from ${config.channels.length} YouTube channels, enriched with AI-extracted car setups.
- **Deals**: Price comparison across ${config.retailers.length} retailers (${config.retailers.map(r => r.name).join(", ")}). Updated daily with price drop detection.
- **Live**: Aggregated live sim racing streams from Twitch and YouTube.
- **Setups**: Browse car setups extracted from creator content, filterable by sim, car, and track.

## Content types

- Race replays and onboard footage
- Hardware reviews and comparisons
- Setup guides and tutorials
- Sim racing news and updates

## Categories

${config.categories.map(c => `- ${c}`).join("\n")}

## API

This site does not currently offer a public API. Content is available through the web interface.

## Contact

hello@${brand.domain}
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
