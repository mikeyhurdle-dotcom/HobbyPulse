---
type: project
status: active
project: HobbyPulse
created: 2026-03-30
tags:
  - project
  - side-project
  - hobbypulse
  - passive-income
  - warhammer
  - sim-racing
aliases:
  - The Hobby
  - HobbyPulse
---

# HobbyPulse — Multi-Niche Watch + Deals Engine

> "In the grim darkness of the far future, there is only war... and overpaying for plastic miniatures."

## What Is This?

A "second screen" content and deals platform for hobby communities. Not a social network — a passive-income utility site that aggregates YouTube content with structured metadata, compares prices across retailers, and shows live streams. Built once as a reusable engine, deployed across multiple hobby verticals.

- **Revenue target:** £500/month from display ads + affiliate links
- **Traffic target:** ~40,000 monthly page views across all verticals
- **Effort:** ~15 evenings to MVP, then passive maintenance via cron jobs

## Origin Story

Explored in a brainstorming session on 2026-03-30, starting from "what concepts from [[Smashd]] could transfer to other hobbies?" The watch page concept from Smashd, combined with a deals/price comparison angle, turned out to be a powerful pattern that works across multiple niches.

Key insight: the same engine (YouTube monitoring → AI metadata extraction → deals crawling → affiliate links) works for Warhammer 40K, sim racing, mechanical keyboards, 3D printing, and potentially more. Each vertical is just a config file.

## Core Features

### 1. Watch Page

Curated battle report / content videos from YouTube, enriched with structured metadata parsed by Claude Haiku. For Warhammer, that means army lists broken down into units with points costs. For sim racing, car setups and track details. Each unit links to the Deals page for purchasing.

**The thing nobody else has:** "Show me every Death Guard vs Space Marines battle report at 2000 points in the last 3 months" — with both army lists structured and searchable.

### 2. Deals Page

Cross-source price comparison for hobby gear. Aggregates eBay, specialist retailers (Element Games, Troll Trader, Wayland Games), and manufacturer RRPs. Shows savings percentage, condition (new/used/NOS/painted), and wraps every outbound link in an affiliate code.

**Killer feature:** "Build My Army Cheap" — paste a full army list, get an optimised shopping cart showing the cheapest way to buy every unit across all sources.

### 3. Live Page

Aggregated live streams from Twitch and YouTube. Polls every 5 minutes. Shows all currently live Warhammer / sim racing / hobby streams in one grid. Tournament weekends get event mode grouping related streams.

## Launch Verticals

| Vertical | Watch Content | Deals Angle | Affiliate AOV | SEO Surface |
|----------|--------------|-------------|---------------|-------------|
| Warhammer 40K | Battle reports + army lists | Second-hand models, retailer comparison | £30-80/box | ~1,000 pages (factions × units) |
| Sim Racing | Race replays, setup guides | Wheels, pedals, rigs, monitors | £200-3,000 | ~500 pages (sims × hardware) |
| Mechanical Keyboards | Build streams, sound tests | Switches, keycaps, cases, PCBs | £50-500 | ~400 pages |
| 3D Printing (future) | Print timelapses, guides | Printers, filament, resin | £200-1,000 | ~300 pages |
| Beauty/Skincare (evaluate) | Tutorials, routines | Product comparison, dupes | £10-50 | High competition |

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js 15 (App Router) | SSR/SSG for SEO — every page must be crawlable |
| Frontend | React 19 + TypeScript | Same patterns as [[Smashd]] |
| Styling | Tailwind CSS v4 | Dark-first design |
| Backend | NEW Supabase instance | Separate from Smashd — London region |
| Hosting | Vercel | Free tier → Pro |
| AI | Claude Haiku API | List parsing + product normalisation |
| Scraping | Cheerio | Retailer product pages |
| APIs | YouTube Data v3, Twitch Helix, eBay Browse | All free tier |
| Email | Resend | Price alerts (Phase 4) |
| Analytics | PostHog + GA4 | SEO tracking |

**Key decision:** Next.js instead of Vite because SEO drives all traffic. SSG for deals pages (regenerated nightly), SSR for dynamic content.

## Revenue Model

Combined RPM of ~£12.50 per 1,000 page views:

- Display ads (AdSense): ~£10 RPM
- Affiliate conversions: ~£2.50 per 1K views (2% CTR, 5% conversion, £50 AOV, 5% commission)

| Monthly Page Views | Revenue | Timeline |
|-------------------|---------|----------|
| 10K | £125 | Months 5-6 |
| 20K | £250 | Months 7-9 |
| 40K | £500 | Months 12-15 |
| 100K | £1,250 | Year 2 |

Monthly costs at scale: ~£48 (Vercel Pro £20 + Supabase Pro £25 + Claude API £2 + domain £1)
Net profit at £500 target: ~£452/month

## Competitor Landscape

### Warhammer — Nobody does Watch + Deals combined

- **Listhammer / Stat Check / 40K Stats** — tournament meta stats only, no video content
- **SN Battle Reports / Tabletop Titans** — single creators, no cross-channel aggregation
- **Troll Trader / Element Games** — single retailer, no price comparison
- **eBay** — vast but noisy, no Warhammer-specific UX
- **Game Fortress** — closest competitor but low traction, no deals angle

### Sim Racing — Fragmented tools, no unified layer

- **Track Titan / Delta** — AI coaching, not content aggregation
- **SimGrid / Grid Finder** — league management, not watch + deals
- **Coach Dave Academy** — coaching-focused, paywalled

### Key Gap

Nobody aggregates content + structured metadata + price comparison across sources. That three-layer combination is the moat.

## Build Phases

All tracked in Linear under "The Hobby" project on the Tealium Tools team, tagged Side Project (red label).

### Phase 0: Setup (TEA-63)

- TEA-64: Scaffold Next.js 15 + React 19 + TS
- TEA-65: Create NEW Supabase project + multi-vertical schema
- TEA-66: Deploy to Vercel + domain + env vars
- TEA-67: Brand palette + dark-first app shell

### Phase 1: Watch Page (TEA-68)

- TEA-69: YouTube API channel monitoring (11 initial channels, 6hr cron)
- TEA-70: Claude Haiku list parser (description text → structured data)
- TEA-71: Watch page UI (video grid, detail view, faction filters, search)
- TEA-72: Seed 40K factions reference data

### Phase 1.5: Multi-Niche Architecture (TEA-73)

- Vertical-agnostic engine via config layer
- Dynamic routing: /[vertical]/watch, /[vertical]/deals

### Phase 2: Deals Crawler (TEA-74)

- eBay Browse API + affiliate wrapping
- Retailer scrapers (Troll Trader, Element Games, Wayland)
- GW RRP baseline for savings calculation
- Claude Haiku product normalisation

### Phase 3: Live Page (TEA-75)

- Twitch API + YouTube live broadcast aggregation
- Tournament event mode

### Phase 4: Monetisation (TEA-76)

- AdSense, eBay Partner Network, Element/Wayland affiliates
- Amazon Associates, sim racing affiliates
- "Buy These Units" CTA on watch pages
- Price alerts via Resend
- "Build My Army Cheap" feature

### Phase 5: Sim Racing Vertical (TEA-77)

- Validates multi-niche architecture
- Jimmy Broadbent, Jardier, Dave Cam channels
- Fanatec, Digital Motorsport, Amazon affiliates

### Phase 6: SEO + Analytics (TEA-78)

- Dynamic sitemaps, Schema.org structured data
- Auto-generated OG images
- Google Search Console, GA4 + PostHog
- Pillar blog content

### Phase 7: Evaluate Beauty Vertical (TEA-79)

- High risk: SEO saturated, not our domain
- Narrow angle only: "what products are in this video" + buy links

## Key Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| GW IP enforcement | High | Don't use GW imagery/rules. Link to products, don't reproduce. GW tolerates sites that drive sales |
| Scraper breakage | Medium | API-first where possible (eBay, YouTube, Twitch). Abstraction layers per source |
| Low initial traffic | Medium | SEO is slow. Supplement with Reddit (r/Warhammer40k 850K, r/simracing 700K+) |
| Solo founder capacity | Medium | Engine is passive after setup. Cron jobs do the work |
| Competition from GW | Low | GW's digital track record is poor. My Warhammer is a login, not a content platform |

## Market Context

### Warhammer 40K

- GW revenue: £0.83B TTM (record, up 17% core)
- ~790K active My Warhammer users, ~248K Warhammer+ subscribers
- Estimated 2.4M UK players, 3-4M globally
- Space Marine 2 driving new hobbyist recruitment
- Second-hand market massive and completely fragmented

### Sim Racing

- Verstappen just rebranded Team Redline → Verstappen Sim Racing (March 2026)
- F1 Esports growing, iRacing special events draw thousands
- Hardware is expensive (£200-3000+) — excellent affiliate AOV
- Tools exist (Track Titan, SimGrid) but nobody does watch + deals

## Design Direction

Dark-first, card-grid layout. Fonts: Syne (display), DM Sans (body), IBM Plex Mono (data). Bento-style stat bars. Faction badge chips on thumbnails. Price comparison cards with savings in green. Interactive prototype built as HTML reference.

## Artifacts

- **Project brief:** warhammer-platform-brief.md (full competitor analysis, data models, cost analysis)
- **Prototype:** hobbypulse-prototype.html (interactive dark-mode UI mockup)
- **Linear project:** The Hobby
- **Linear docs:** Tech Stack Reference, Revenue Model

## Related Notes

- [[Smashd]] — sister project, source of the watch page and affiliate patterns
- [[Deuce Switch]] — Smashd codebase, shares tech stack DNA

---

*Created 2026-03-30 from a brainstorming session exploring how Smashd concepts could transfer to other hobby communities. Started with Warhammer 40K, expanded to a multi-niche passive income engine.*
