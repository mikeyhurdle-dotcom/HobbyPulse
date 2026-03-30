---
type: reference
project: HobbyPulse
created: 2026-03-30
---

# HobbyPulse — Architecture Overview

## System Diagram

```
                    ┌──────────────────────────────┐
                    │     GitHub Repository         │
                    │  mikeyhurdle-dotcom/HobbyPulse│
                    └──────────┬───────────────────┘
                               │
                    ┌──────────┴───────────────────┐
                    │         Same Codebase          │
                    ├────────────────┬───────────────┤
                    │                │               │
              ┌─────▼─────┐  ┌──────▼──────┐        │
              │ Vercel #1  │  │  Vercel #2  │        │
              │ TabletopW. │  │ SimPitStop  │        │
              │ VERTICAL=  │  │ VERTICAL=   │        │
              │ warhammer  │  │ simracing   │        │
              └─────┬──────┘  └──────┬──────┘        │
                    │                │               │
                    └────────┬───────┘               │
                             │                       │
                    ┌────────▼────────┐              │
                    │    Supabase     │              │
                    │  nspgvdytqsv... │              │
                    │  (London)       │              │
                    └────────▲────────┘              │
                             │                       │
                    ┌────────┴────────┐              │
                    │   PulseBot 🦅   │              │
                    │   (OpenClaw)    │              │
                    │  VPS 77.42.20.44│              │
                    │   @Hobbypulsebot│              │
                    └─────────────────┘              │
```

## Components

### Vercel Projects (Frontend + API)
- **TabletopWatch** (hobbypulse.vercel.app) — `NEXT_PUBLIC_SITE_VERTICAL=warhammer`
- **SimPitStop** (simpitstop.vercel.app) — `NEXT_PUBLIC_SITE_VERTICAL=simracing`
- Next.js 15, App Router, React 19, TypeScript, Tailwind v4
- SSG for static pages, SSR for dynamic content
- API routes for crons, build, price alerts, heartbeat

### Supabase (Backend)
- Project: `nspgvdytqsvnmbitbmey` (eu-west-2 London)
- 12 tables: verticals, categories, channels, battle_reports, content_lists, list_items, products, listings, price_history, live_streams, price_alerts, ops_bot_health
- RLS: public read on all tables, service_role writes
- No user auth in v1

### PulseBot (Autonomous Agent)
- Codename: Hawk 🦅
- Runs on OpenClaw gateway (VPS 77.42.20.44)
- Telegram: @Hobbypulsebot
- Model: Gemini Flash (free) → Groq fallback → Mistral safety net
- Replaces Vercel crons with smarter, more frequent polling
- Reports to Mikey via Telegram

## Data Flow

```
YouTube Channels ──► PulseBot/Cron ──► battle_reports ──► Watch Page
                                           │
                                     Haiku Parser
                                           │
                                    content_lists + list_items
                                           │
                                    Faction filters, army lists UI

Retailers ──► PulseBot/Cron ──► products + listings ──► Deals Page
         (Element, Wayland,         │
          Troll Trader, eBay)  price_history
                                    │
                              Price alerts → Resend emails

Twitch/YouTube ──► PulseBot/Cron ──► live_streams ──► Live Page
```

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/cron/youtube` | GET | Ingest videos from YouTube channels |
| `/api/cron/parse` | GET | Parse video descriptions with Claude Haiku |
| `/api/cron/deals` | GET | Scrape retailers for prices |
| `/api/cron/live` | GET | Poll Twitch + YouTube for live streams |
| `/api/cron/price-alerts` | GET | Check and send price drop emails |
| `/api/seed-channels` | POST | One-time YouTube channel seeding |
| `/api/build` | POST | Build My Army Cheap — parse list + find deals |
| `/api/price-alert` | POST | Create a price alert subscription |
| `/api/bot-heartbeat` | POST | PulseBot health reporting |

All cron/seed endpoints protected by `Authorization: Bearer {CRON_SECRET}`.

## External APIs

| API | Purpose | Auth | Quota |
|-----|---------|------|-------|
| YouTube Data v3 | Video ingest + live search | API key | 10K units/day |
| Twitch Helix | Live stream polling | OAuth client_credentials | 800 req/min |
| eBay Browse | Product search + deals | OAuth client_credentials | Generous |
| Anthropic (Haiku) | Army list parsing + product normalisation | API key | Pay per token (~$0.50/mo) |
| Resend | Price alert emails | API key | 100/day free |

## Scraper Stack

| Retailer | Method | Library |
|----------|--------|---------|
| Element Games | HTML scraping | Cheerio |
| Wayland Games | HTML scraping | Cheerio |
| Troll Trader | HTML scraping | Cheerio |
| eBay | REST API | Fetch |

## Cost at Scale

| Service | Free Tier | Pro Tier |
|---------|-----------|----------|
| Vercel (×2) | Free | £20/mo each |
| Supabase | Free | £25/mo |
| Claude Haiku | ~£2/mo | ~£2/mo |
| VPS (shared w/ SMASHD) | £0 marginal | — |
| Domains (×2) | — | ~£2/mo |
| **Total** | **~£2/mo** | **~£69/mo** |

---

*Created 2026-03-30*
