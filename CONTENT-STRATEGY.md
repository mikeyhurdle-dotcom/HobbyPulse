---
type: strategy
project: HobbyPulse
created: 2026-03-31
---

# TabletopWatch — SEO Content Strategy

## Principle

Every blog post should answer a question people are Googling AND link directly to our Watch or Deals pages. Content is the top of the funnel; affiliate links are the conversion.

## Priority 1: Buyer Intent Posts (highest affiliate conversion)

| Post | Data Source | Links To |
|------|-----------|----------|
| "Cheapest way to start Warhammer 40K in 2026" | Deals scraper — cheapest starter sets across retailers | /deals (starter sets) |
| "Every Combat Patrol box ranked by value" | RRP baseline + deals scraper — points-per-pound analysis | /deals (each box) |
| "Best second-hand 40K deals right now" | Deals scraper — biggest savings vs RRP | /deals (filtered by savings) |
| "Element Games vs Wayland Games — which is cheaper?" | Deals scraper — head-to-head price comparison across products | /deals (both retailers) |
| "{Faction} army on a budget — cheapest way to build 2000pts" | Build My Army Cheap engine | /build |

## Priority 2: Decision Posts (new player acquisition)

| Post | Data Source | Links To |
|------|-----------|----------|
| "{Faction} vs {Faction} — which army should you pick?" | Battle report data — win rates, play style from parsed lists | /watch (filtered by factions) |
| "Best Warhammer 40K faction for beginners in 2026" | Battle report frequency + Combat Patrol value | /watch + /deals |
| "Is Warhammer 40K worth starting in 2026?" | Market data, community size, cost analysis | /deals (starter sets) |

## Priority 3: Meta/Competitive Posts (engaged hobbyist retention)

| Post | Data Source | Links To |
|------|-----------|----------|
| "Top 10 battle report channels on YouTube" | Our channel data — sub counts, upload frequency, content quality | /watch |
| "Warhammer 40K meta report — {month} 2026" | Parsed army lists — which factions appear most, trending units | /watch (faction filter) |
| "Most popular army lists this week" | Content parser data — aggregated list appearances | /watch |

## Priority 4: SimPitStop Content (separate site)

| Post | Data Source | Links To |
|------|-----------|----------|
| "Best sim racing wheel under £300 in 2026" | Deals scraper — wheel pricing | /deals |
| "Fanatec vs Moza — which ecosystem to choose?" | RRP data + deals | /deals |
| "iRacing vs ACC for beginners" | Watch data — which sim has more content | /watch |
| "Best sim racing rig for small spaces" | Deals — rig pricing + specs | /deals |

## Auto-Generation via PulseBot

PulseBot can draft these posts weekly from real data:
- "This week's cheapest deals" — auto-generated from price drops
- "Trending factions this week" — auto-generated from battle report parsing
- "New battle report channels discovered" — from the discovery system

Drafts sent to Mikey via Telegram for review before publishing.

## Implementation

- Add `/blog` route with MDX or Supabase-stored content
- Schema.org Article structured data on each post
- Internal links from blog → /watch and /deals pages
- PulseBot generates drafts, Mikey approves
- Tracked in Linear as TEA-85

## SEO Targets

- Long-tail keywords with buyer intent
- Target featured snippets (comparison tables, ranked lists)
- Each post should target 1 primary keyword + 2-3 secondary
- Update posts monthly with fresh pricing data (PulseBot can do this)
