# HobbyPulse — Claude Code Rules

## Project Overview

Multi-niche hobby content + deals platform. Same codebase deployed as separate branded sites per vertical via `NEXT_PUBLIC_SITE_VERTICAL` env var.

- **TabletopWatch** (warhammer) — Warhammer 40K battle reports, army lists, miniature deals
- **SimPitStop** (simracing) — Sim racing replays, setup guides, hardware deals

## Tech Stack

- Next.js 15 (App Router), React 19, TypeScript, Tailwind v4
- Supabase (project: nspgvdytqsvnmbitbmey, eu-west-2 London)
- Claude Haiku for content parsing
- Vercel hosting (two projects: hobbypulse + simpitstop)
- PulseBot (Hawk) on OpenClaw VPS for autonomous data operations

## Key Files

- `config/verticals.ts` — single source of truth for all vertical-specific config (brand, theme, channels, retailers)
- `lib/site.ts` — `getSiteVertical()` and `getSiteBrand()` resolve current deployment
- `lib/supabase.ts` — anon client (public reads only)
- `lib/normalise.ts` — product name normalisation (cache-first, Haiku fallback). Uses service role key.
- `lib/scrapers/` — retailer scrapers (Element Games, Troll Trader, Shopify generic, Wayland disabled)
- `lib/scrapers/shopify.ts` — generic Shopify scraper used by Troll Trader, Moza, Trak Racer
- `lib/ebay.ts` — eBay Browse API client with OAuth token caching
- `lib/parser.ts` — vertical-aware Claude Haiku content parser
- `lib/affiliate.ts` — centralised affiliate URL wrapping with UTM tracking
- `lib/gw-rrp.ts` — static RRP database (~100 products) for savings calculations
- `app/api/cron/deals/route.ts` — deals scraping cron (batch support required)
- `app/api/test/route.ts` — automated test suite
- `bot/SOUL.md` — PulseBot personality and schedule
- `components.json` — shadcn/ui configuration

## Architecture

- Routes are flat: `/watch`, `/deals`, `/live`, `/build`, `/watch/[videoId]`, `/deals/[productSlug]`
- Route group `app/(vertical)/` contains all vertical pages
- No `[vertical]` URL param — vertical comes from env var
- 5 cron endpoints under `app/api/cron/` (youtube, parse, deals, live, price-alerts)
- All crons protected by `Authorization: Bearer {CRON_SECRET}`

## UI & Design

- **shadcn/ui** component library (Button, Card, Badge, Input, Select, Sheet, Skeleton, Tabs, etc.)
- **next-themes** for light/dark mode toggle (default: dark, respects system preference)
- Per-vertical theming via `--vertical-accent` CSS variable injected at root layout level
- **TabletopWatch palette:** amber/gold accent (`oklch(0.72 0.14 75)`) on navy backgrounds
- **SimPitStop palette:** racing red accent (`oklch(0.577 0.245 27.325)`) on charcoal backgrounds
- Fonts: Syne (display), DM Sans (body), IBM Plex Mono (data)
- Mobile: hamburger menu via shadcn Sheet, single-row collapsed filters
- **Never show winner/spoiler badges** on video pages — ruins the viewing experience
- All monetisation features gracefully degrade when env vars are unset

## Deals Pipeline

- **Scrapers:** Element Games (HTML), Troll Trader (Shopify JSON), Moza Racing (Shopify JSON), Trak Racer (Shopify JSON), eBay Browse API
- **Wayland Games:** disabled (Cloudflare 403). Re-enable when affiliate data feed available.
- **Normalisation cache:** `product_name_cache` table in Supabase. Check cache → fuzzy match → Haiku fallback. Reduces Haiku calls from 18K/month to ~50.
- **Price drop detection:** cron compares previous vs new price, flags drops ≥10% in `priceDrops[]` response
- **Batch support:** cron must be called with `?batch=0` through `?batch=N` (5 terms per batch) to avoid Vercel 300s timeout
- **Search terms:** 25 for warhammer, 28 for sim racing (in `app/api/cron/deals/route.ts`)
- Uses **service role key** for writes (anon key is read-only due to RLS)

## Testing

- **Automated test suite:** `GET /api/test` — 18 checks (TabletopWatch), 16 checks (SimPitStop). Protected by CRON_SECRET.
- **Build flow test:** `GET /api/test/build` — exercises army list parsing → deal matching
- **Price alert test:** `GET /api/test/price-alert` — exercises alert creation flow
- **Manual testing plan:** `TESTING-PLAN.md` — 7 user journeys with step-by-step checks

## Linear

- Project: "The Hobby" on Tealium Tools team
- Label: "Side Project"
- Issues prefixed with `[HobbyPulse]`

## Strategic Decisions

- Tabletop games grouped on one site (cross-sell), sim racing separate (different audience)
- Brand name must NOT include "Warhammer" or any GW trademark
- PulseBot replaces Vercel crons for smarter, more frequent data operations
- No user authentication in v1 — revenue from ads + affiliate links
- "Build My Army Cheap" is the killer differentiator feature
