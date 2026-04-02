---
type: decisions
project: HobbyPulse
created: 2026-03-30
---

# HobbyPulse — Strategic Decisions Log

Key decisions made during build sessions on 2026-03-30 and 2026-03-31 and their rationale.

---

## 1. Separate brands per vertical (not one unified site)

**Decision:** Each hobby vertical gets its own domain, brand, and Vercel deployment rather than living under one "HobbyPulse" umbrella site.

**Rationale:**
- SEO is the primary traffic engine — niche domains with concentrated topical authority rank significantly faster than generalist sites
- A domain like "TabletopWatch" tells a Warhammer player exactly why they should care; "HobbyPulse" is vague
- Each site can be sold independently if one takes off
- Community identity — feels purpose-built, not a generic aggregator

**Implementation:** Same codebase, same Supabase database. Each Vercel project sets `NEXT_PUBLIC_SITE_VERTICAL` to select its config. Adding a new vertical is just a config block + new Vercel project.

**Current brands:**
| Vertical | Brand | Domain (TBD) |
|----------|-------|-------------|
| Tabletop (40K, AoS, etc.) | TabletopWatch (working name) | tabletopwatch.com |
| Sim Racing | SimRaceWatch | simracewatch.com |

---

## 2. Tabletop games grouped together, Sim Racing separate

**Decision:** All tabletop/miniature games (Warhammer 40K, Age of Sigmar, Kill Team, Horus Heresy, etc.) share one site. Sim Racing is a completely separate site.

**Rationale:**
- Tabletop hobbyists cross-buy across games — someone painting Death Guard probably also plays AoS. Cross-sell opportunities within one site.
- Same retailers serve all tabletop games (Element Games, Wayland, Troll Trader, eBay)
- Sim Racing is a completely different audience, different retailers, different content
- No cross-sell between someone buying plastic miniatures and someone buying a Fanatec wheelbase

**Future expansion:** More tabletop games added as sub-categories within the same deployment. Could also verticalise further — Kill Team, Horus Heresy, Star Wars Legion, Marvel Crisis Protocol all share the same engine.

---

## 3. Avoid "Warhammer" in the brand name

**Decision:** Do not use "Warhammer" or any Games Workshop trademark in the site name, domain, or branding.

**Rationale:**
- GW is notoriously aggressive with IP enforcement
- A name like "WarhammerWatch" would be a legal risk
- GW tolerates sites that drive sales to their products, but not ones that trade on their brand name
- A generic tabletop name also allows expansion beyond GW games
- Working name "TabletopWatch" is safe and descriptive

**Brand name confirmed: TabletopWatch** (tabletopwatch.com). Domain available. Researched on 2026-03-31 — HobbyForge, DiceHammer, WarTable all taken by existing companies. TabletopWatch is clean, broad, and "watch" works on two levels (watch videos + watch prices).

---

## 4. PulseBot over Vercel crons

**Decision:** Replace Vercel cron jobs with an autonomous bot (PulseBot / Hawk) running on the existing OpenClaw VPS.

**Rationale:**
- Vercel Hobby plan limits crons to once daily — completely inadequate for live stream polling (needs every 5 min) and YouTube monitoring (needs every few hours)
- The VPS already runs 9 SMASHD bots with zero issues — adding PulseBot is marginal cost
- A bot can be smarter than crons: triage videos before parsing, detect price drops, generate content, discover new channels
- Free LLM stack (Gemini Flash + Groq + Mistral) means near-zero running cost
- PulseBot reports to Mikey via Telegram — same pattern as all SMASHD bots

**Architecture:** PulseBot can either call the Vercel API endpoints (which do the work server-side) or hit Supabase directly. The Vercel crons remain as a fallback.

---

## 5. Next.js over Vite (SSR/SSG for SEO)

**Decision:** Use Next.js 15 with App Router, not Vite/SPA.

**Rationale:**
- All traffic comes from Google — every page must be crawlable
- SSG for deals pages (regenerated via cron), SSR for dynamic content
- Same patterns as SMASHD (knowledge transfer)
- Vercel hosting optimised for Next.js

---

## 6. New Supabase instance (separate from SMASHD)

**Decision:** Create a dedicated Supabase project for HobbyPulse, not share the SMASHD database.

**Rationale:**
- Clean separation of data and billing
- Different RLS policies (HobbyPulse is public read, SMASHD has user auth)
- Can scale independently
- Located in London (eu-west-2) for UK-centric content

---

## 7. Claude Haiku for parsing, not on-bot

**Decision:** Use Claude Haiku via the Anthropic API in Vercel server-side routes only. PulseBot uses free LLMs (Gemini, Groq, Mistral).

**Rationale:**
- Haiku is the best parser for structured data extraction (army lists, car setups)
- At ~$0.50/month estimated usage, it's negligible cost
- PulseBot stays on free models to protect Anthropic credits
- Server-side parsing means results are cached in Supabase — no repeated API calls

---

## 8. "Build My Army Cheap" as the killer feature

**Decision:** Prioritise the paste-an-army-list-get-an-optimised-shopping-cart feature as the primary differentiator.

**Rationale:**
- Nobody else does this — it's the moat
- Combines two things users already do manually (write army lists + shop around for models)
- Every unit in the shopping cart is an affiliate link — direct revenue path
- Works for any tabletop game, not just 40K
- Natural SEO content: "cheapest way to build a Death Guard army" etc.

---

## 9. Revenue model: ads + affiliates (no user accounts in v1)

**Decision:** No user authentication in v1. Revenue from AdSense display ads + affiliate links on all outbound retailer URLs.

**Rationale:**
- Minimises complexity — no auth flows, no user data, no GDPR headaches
- Price alerts use email-only (no account needed)
- Affiliate revenue starts from day one (once affiliate programmes are approved)
- Can add user accounts later if needed for premium features

---

## 10. TabletopWatch brand name confirmed

**Decision:** TabletopWatch (tabletopwatch.com)

**Rationale:**
- Domain available (.com, .co.uk, all major TLDs)
- No existing companies using the name
- "Watch" works on two levels: watch videos + watch prices/deals
- Broad enough for all tabletop games, not just Warhammer
- SEO-friendly — "tabletop watch" is a natural search phrase
- Competitors researched: HobbyForge (taken), DiceHammer (taken), WarTable (taken), MiniWatch (parked)

---

## 11. HobbyPulse as parent entity

**Decision:** HobbyPulse is the parent brand/business entity. Individual sites are brands underneath it.

**Rationale:**
- One business registration covers all verticals
- One set of affiliate accounts (eBay Partner Network, Amazon Associates, etc.)
- One AdSense account with multiple domains
- Each site can be sold independently if one takes off
- Structure: HobbyPulse → TabletopWatch, SimRaceWatch, [future verticals]

---

## 12. RSS feeds over YouTube search API

**Decision:** Use free YouTube RSS feeds for channel monitoring instead of the search API.

**Rationale:**
- YouTube search.list costs 100 quota units per channel per poll
- RSS feeds are free and unlimited — returns latest 15 videos per channel
- Reduced daily quota from ~3,000 units to ~350 units (90% saving)
- YouTube API only used for video details (1 unit per 50 videos)
- Enables polling every 2 hours without quota concerns

---

## 13. Transcript extraction for richer data

**Decision:** Fetch YouTube auto-captions and feed them to Haiku alongside descriptions for dramatically richer data extraction.

**Rationale:**
- Description-only parsing: 2 army lists from 20 videos
- With transcripts: 10 army lists from 8 videos (5x improvement)
- Extracts data nobody else has: who won, key tactical moments, spoken army lists
- Cost: ~$0.014 per video (~$7/month at 500 videos)
- YouTube blocks cloud IPs from fetching captions — use Supadata API (~$0.50/month) for automated access

---

## 14. Faction win rates from tournament data

**Decision:** Scrape publicly available tournament win rate data (Stat Check, 40KStats, The Honest Wargamer) to show alongside battle reports.

**Rationale:**
- Adds context: "Death Guard currently has a 48% win rate this season"
- Public data — tournament results are reported openly
- Richer than our own data (tournaments are competitive, not casual)
- Placeholder UI already built (FactionMeta component)
- Implementation: scrape existing meta sites, not calculate our own (yet)

---

## 15. SimRaceWatch value proposition: car setups + hardware detection

**Decision:** The sim racing killer feature is car setup extraction and hardware-from-video detection, NOT just a filtered YouTube feed.

**Rationale:**
- Without setup extraction, SimRaceWatch is just YouTube with a different skin
- Car setup extraction = the sim racing equivalent of army list parsing
- Hardware mentions link every product to the deals page (affiliate revenue)
- 90 hardware setups extracted from first batch of 184 videos
- Dedicated /setups page for browsing by sim, car, track
- No competitor combines video content + hardware deals + setup extraction

---

*Updated 2026-03-31*
