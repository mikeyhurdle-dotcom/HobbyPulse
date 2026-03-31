---
type: reference
project: HobbyPulse
created: 2026-03-30
updated: 2026-03-31
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
              ┌─────▼─────┐  ┌──────▼──────┐
              │ Vercel #1  │  │  Vercel #2  │
              │ TabletopW. │  │ SimPitStop  │
              │ warhammer  │  │ simracing   │
              └─────┬──────┘  └──────┬──────┘
                    │                │
                    └────────┬───────┘
                             │
                    ┌────────▼────────┐
                    │    Supabase     │
                    │  London (eu-w2) │
                    └────────▲────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────┴───┐  ┌──────┴──────┐  ┌────┴──────┐
     │ PulseBot   │  │ Your Mac    │  │ Supadata  │
     │ (VPS)      │  │ (transcripts│  │ (future)  │
     │ @Hobbypulse│  │  for now)   │  │           │
     └────────────┘  └─────────────┘  └───────────┘
```

## Parent Entity

**HobbyPulse** — the parent brand that owns all vertical sites:
- TabletopWatch (tabletopwatch.com) — tabletop gaming
- SimPitStop (simpitstop.com) — sim racing
- Future verticals as separate branded sites

## Components

### Vercel Projects (Frontend + API)
- **TabletopWatch** (hobbypulse.vercel.app) — `NEXT_PUBLIC_SITE_VERTICAL=warhammer`
- **SimPitStop** (simpitstop.vercel.app) — `NEXT_PUBLIC_SITE_VERTICAL=simracing`
- Next.js 15, App Router, React 19, TypeScript, Tailwind v4

### Supabase (Backend)
- Project: `nspgvdytqsvnmbitbmey` (eu-west-2 London)
- 15 tables: verticals, categories, channels, battle_reports, content_lists, list_items, products, listings, price_history, live_streams, price_alerts, ops_bot_health, discovered_videos, channel_candidates, car_setups
- RLS: public read on all tables, service_role writes

### PulseBot (Autonomous Agent)
- Codename: Hawk 🦅 — runs on OpenClaw VPS (77.42.20.44)
- Telegram: @Hobbypulsebot
- Model: Gemini Flash → Groq → Mistral (no Anthropic on bot)

## Content Pipeline

### Video Ingestion (RSS + Discovery)

```
Monitored Channels (25)
├── RSS feeds (free, unlimited) → detect new videos
├── YouTube API (details only, ~50 units/day) → duration, views, stats
├── Classifier → game system + content type
└── Supabase battle_reports table

Discovery Search (daily, ~300 quota)
├── YouTube search for battle report keywords
├── Unknown channel → discovered_videos + channel_candidates
├── Battle report from unknown channel → also added to battle_reports
└── 3+ battle reports from same channel → flagged as hot candidate
    └── Admin reviews at /admin/discovery → approve → permanent RSS monitoring
```

### Transcript Pipeline

```
Your Mac (or Supadata API in future)
├── Fetch YouTube auto-captions (free, YouTube blocks cloud IPs)
├── ~15,000 words per video (truncated)
└── Store in battle_reports.transcript column

Parse Cron (Vercel)
├── Reads description + stored transcript
├── Claude Haiku extracts:
│   ├── Tabletop: army lists, winner, key moments, faction, points
│   └── Sim racing: car setups, hardware mentions, sim, car, track
└── Results: content_lists + list_items (tabletop) or car_setups (simracing)
```

### Deals Pipeline (needs eBay API — pending approval)

```
Retailers → Scrapers (Cheerio) → products + listings → price_history
├── Tabletop: Element Games, Wayland Games, Troll Trader, eBay
├── Sim Racing: Fanatec, Sim-Lab, Moza, eBay
└── Price drops → price alerts → Resend emails
```

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/cron/youtube` | GET | RSS-based video ingest (~50 API units) |
| `/api/cron/parse` | GET | Haiku parsing (army lists or car setups) |
| `/api/cron/deals` | GET | Retailer scraping |
| `/api/cron/live` | GET | Twitch + YouTube live streams |
| `/api/cron/discover` | GET | YouTube search for new battle reports |
| `/api/cron/price-alerts` | GET | Check and send price drop emails |
| `/api/seed-channels` | POST | Seed YouTube channels |
| `/api/build` | POST | Build My Army Cheap |
| `/api/price-alert` | POST | Create price alert |
| `/api/bot-heartbeat` | POST | PulseBot health |
| `/api/channels/candidates` | GET | List channel candidates |
| `/api/channels/approve` | POST | Approve/dismiss channel |

## Pages per Vertical

| Page | TabletopWatch | SimPitStop |
|------|:---:|:---:|
| `/` | Home/landing | Home/landing |
| `/watch` | Battle Reports (default) | Races & Replays (all content default) |
| `/watch/[videoId]` | YouTube + army lists + winner | YouTube + car setups + hardware |
| `/deals` | Miniature deals | Hardware deals |
| `/deals/[slug]` | Price comparison | Price comparison |
| `/live` | Live streams | Live streams |
| `/build` | Build My Army Cheap | 404 (not applicable) |
| `/setups` | 404 | Browse car setups |
| `/about` | About | About |
| `/privacy` | Privacy policy | Privacy policy |
| `/admin/revenue` | Affiliate dashboard | Affiliate dashboard |
| `/admin/discovery` | Channel candidates | Channel candidates |

## Game Systems

### Tabletop (colour-coded)
| System | Colour | Badge |
|--------|--------|-------|
| Warhammer 40K | Purple `#7c3aed` | 40K |
| Age of Sigmar | Gold `#d97706` | AoS |
| The Old World | Deep Red `#991b1b` | TOW |
| Kill Team | Teal `#0d9488` | KT |
| Horus Heresy | Steel Blue `#475569` | 30K |
| One Page Rules | Orange `#ea580c` | OPR |

### Sim Racing (colour-coded)
| System | Colour | Badge |
|--------|--------|-------|
| iRacing | Blue `#1E40AF` | iR |
| ACC | Red `#DC2626` | ACC |
| LMU | Amber `#D97706` | LMU |
| F1 | Red `#EF4444` | F1 |
| Hardware | Grey `#78716C` | HW |

## External APIs

| API | Purpose | Auth | Cost |
|-----|---------|------|------|
| YouTube Data v3 | Video details (RSS does discovery) | API key | Free (10K units/day, using ~350) |
| Twitch Helix | Live stream polling | OAuth client_credentials | Free |
| eBay Browse | Product search + deals | OAuth client_credentials | Free (pending approval) |
| Anthropic Haiku | Army list parsing + setup extraction | API key | ~$7-14/month |
| Supadata (future) | YouTube transcripts | API key | ~$0.50/month |
| Resend (future) | Price alert emails | API key | Free (100/day) |

## Monthly Costs

| Service | Current | At Scale |
|---------|:-------:|:--------:|
| Vercel (×2) | Free | £40/mo (Pro) |
| Supabase | Free | £25/mo (Pro) |
| Claude Haiku | ~£2/mo | ~£12/mo |
| Supadata (future) | — | ~£0.50/mo |
| VPS (shared w/ SMASHD) | £0 | £0 |
| Domains (×2) | — | ~£2/mo |
| **Total** | **~£2/mo** | **~£80/mo** |

---

*Updated 2026-03-31*
