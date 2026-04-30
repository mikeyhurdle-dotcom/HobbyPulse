# HobbyPulse — Claude Code Rules

## Pivot 2026-04-30 — read this first

Per `bot/COMPETITIVE-VIABILITY-2026-04-30.md`, Mikey decided on 2026-04-30:

1. **TabletopWatch → minimal-mode.** Quill is the named narrator. Two retention surfaces: **Friday board-game deals newsletter** (powered by 22K UK listings) and **quarterly Top 50** by Quill. No miniatures content. No evergreen drafting outside the Friday roundup. See `bot/FRIDAY-NEWSLETTER-SPEC-2026-04-30.md` and `bot/TOP-50-DRAFT-2026-04-30.md`.
2. **SimRaceWatch → quietly sunset.** Domain serves last-state static content as an archive. Deals scraper stays passive on free tier. No 301 redirect (preserves optionality). Content crons short-circuit via `isSrwSunset()` in `lib/site.ts`. **Do not draft, post, or publish for SRW.**
3. **Miniatures cut from TabletopWatch entirely** — no Warhammer / 40K / AoS / Kill Team / Old World / MESBG content. `/miniatures/*` URLs are dead. Element Games, Troll Trader, and Magic Madhouse scrapers were removed. The deals view filters out any miniatures product still in the database.

## Project Overview

Multi-niche hobby content + deals platform. Same codebase deployed as separate branded sites per vertical via `NEXT_PUBLIC_SITE_VERTICAL` env var.

- **TabletopWatch** (tabletop) — UK board-game reviews, deals, Kickstarter tracker, Friday newsletter, quarterly Top 50. Quill is the narrator.
- **SimRaceWatch** (simracing) — **SUNSET 2026-04-30**. Last-state archive. Deals scraper still runs passive.

## Tech Stack

- Next.js 15 (App Router), React 19, TypeScript, Tailwind v4
- Supabase (project: nspgvdytqsvnmbitbmey, eu-west-2 London)
- Claude Haiku for content parsing
- Vercel hosting (two projects: hobbypulse + simracewatch)
- Resend on `alerts@tabletopwatch.com` for newsletter (planned, see Friday newsletter spec)
- PulseBot (Hawk) on OpenClaw VPS for autonomous data operations

## Key Files

- `config/verticals.ts` — single source of truth for all vertical-specific config (brand, theme, channels, retailers)
- `lib/site.ts` — `getSiteVertical()`, `getSiteBrand()`, `isSrwSunset()` resolve current deployment
- `lib/supabase.ts` — anon client (public reads only)
- `lib/normalise.ts` — product name normalisation (cache-first, Haiku fallback). Uses service role key.
- `lib/scrapers/` — retailer scrapers. Tabletop: Wayland Games (disabled, awaiting feed) + Goblin Gaming (Shopify). Simracing: Moza + Trak Racer (Shopify). Element Games / Troll Trader / Magic Madhouse removed in 2026-04-30 pivot.
- `lib/scrapers/shopify.ts` — generic Shopify scraper used by Goblin Gaming, Moza, Trak Racer
- `lib/ebay.ts` — eBay Browse API client with OAuth token caching
- `lib/parser.ts` — vertical-aware Claude Haiku content parser
- `lib/affiliate.ts` — centralised affiliate URL wrapping with UTM tracking
- `app/api/cron/deals/route.ts` — deals scraping cron (batch support required)
- `app/api/test/route.ts` — automated test suite
- `bot/SOUL.md` — PulseBot personality and schedule (Hawk)
- `bot/sites/tabletopwatch.md` + `bot/sites/tabletopwatch-voice.md` — TTW direction + voice rules (Quill)
- `bot/FRIDAY-NEWSLETTER-SPEC-2026-04-30.md` — 3-phase newsletter build spec
- `components.json` — shadcn/ui configuration

## Architecture

- Routes are flat: `/watch`, `/deals`, `/live`, `/blog`, `/boardgames`, `/kickstarter`, `/watch/[videoId]`, `/deals/[productSlug]`. No `/miniatures/*` (deleted 2026-04-30).
- Route group `app/(vertical)/` contains all vertical pages
- No `[vertical]` URL param — vertical comes from env var
- Cron endpoints under `app/api/cron/` (youtube, parse, transcripts, deals, live, price-alerts, discover, board-game-transcripts). Content crons short-circuit on SRW via `isSrwSunset()`.
- All crons protected by `Authorization: Bearer {CRON_SECRET}`

## UI & Design

- **shadcn/ui** component library (Button, Card, Badge, Input, Select, Sheet, Skeleton, Tabs, etc.)
- **next-themes** for light/dark mode toggle (default: dark, respects system preference)
- Per-vertical theming via `--vertical-accent` CSS variable injected at root layout level
- **TabletopWatch palette:** warm teal accent (`oklch(0.62 0.10 200)`) — board-game-friendly, not gothic-warhammer
- **SimRaceWatch palette:** racing red accent (`oklch(0.577 0.245 27.325)`) on charcoal backgrounds (frozen — sunset)
- Fonts: Syne (display), DM Sans (body), IBM Plex Mono (data)
- Mobile: hamburger menu via shadcn Sheet, single-row collapsed filters
- **Never show winner/spoiler badges** on video pages — ruins the viewing experience
- All monetisation features gracefully degrade when env vars are unset

## Deals Pipeline

- **Scrapers (tabletop):** Wayland Games (disabled, Cloudflare 403 — re-enable when feed lands) + Goblin Gaming (Shopify) + eBay Browse API. Element Games / Troll Trader / Magic Madhouse removed 2026-04-30 (Warhammer-only).
- **Scrapers (simracing):** Moza Racing (Shopify), Trak Racer (Shopify), eBay. Still running passive — feeds the existing dataset.
- **Normalisation cache:** `product_name_cache` table in Supabase. Check cache → fuzzy match → Haiku fallback. Reduces Haiku calls from 18K/month to ~50.
- **Miniatures filter:** `app/(vertical)/deals/page.tsx` filters out any product whose name matches a Warhammer / 40K / AoS / MESBG keyword on TabletopWatch.
- **Price drop detection:** cron compares previous vs new price, flags drops ≥10% in `priceDrops[]` response
- **Batch support:** cron must be called with `?batch=0` through `?batch=N` (5 terms per batch) to avoid Vercel 300s timeout
- **Search terms:** 20 board-game terms for tabletop, 28 sim-racing terms (in `app/api/cron/deals/route.ts`)
- Uses **service role key** for writes (anon key is read-only due to RLS)

## Testing

- **Automated test suite:** `GET /api/test` — protected by CRON_SECRET
- **Build flow test:** `GET /api/test/build`
- **Price alert test:** `GET /api/test/price-alert`
- **Manual testing plan:** `TESTING-PLAN.md`

## Linear

- Personal workspace, team `HobbyPulse` (key PULSE), project "HobbyPulse" with `p1-next` label for the next deliverable.

## Strategic Decisions

- **TabletopWatch is board-games-only post 2026-04-30** — miniatures cut entirely. The deals-data moat (22K UK listings) plus Quill-led editorial is the wedge.
- **SimRaceWatch is sunset post 2026-04-30** — preserved as a static archive while the data-pool stays warm. Re-evaluate at 2027-01-31 unless metrics force a kill before then.
- Brand name must NOT include "Warhammer" or any GW trademark.
- PulseBot replaces most Vercel crons for smarter, more frequent data operations. **Don't add new Vercel crons** — hit cron-job limit; new periodic jobs go on Hawk via openclaw cron.
- No user authentication in v1 — revenue from ads + affiliate links + (planned) newsletter.
