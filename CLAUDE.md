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

- `config/verticals.ts` — single source of truth for all vertical-specific config
- `lib/site.ts` — `getSiteVertical()` and `getSiteBrand()` resolve current deployment
- `lib/supabase.ts` — anon client (public reads)
- `lib/parser.ts` — vertical-aware Claude Haiku content parser
- `lib/affiliate.ts` — centralised affiliate URL wrapping with UTM tracking
- `bot/SOUL.md` — PulseBot personality and schedule

## Architecture

- Routes are flat: `/watch`, `/deals`, `/live`, `/build`, `/watch/[videoId]`, `/deals/[productSlug]`
- Route group `app/(vertical)/` contains all vertical pages
- No `[vertical]` URL param — vertical comes from env var
- 5 cron endpoints under `app/api/cron/` (youtube, parse, deals, live, price-alerts)
- All crons protected by `Authorization: Bearer {CRON_SECRET}`

## Conventions

- Dark-first design using CSS custom properties (--background, --surface, --border, etc.)
- Per-vertical theming via `--vertical-accent` injected at root layout level
- Fonts: Syne (display), DM Sans (body), IBM Plex Mono (data)
- All monetisation features gracefully degrade when env vars are unset

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
