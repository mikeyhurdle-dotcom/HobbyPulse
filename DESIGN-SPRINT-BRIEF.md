---
type: brief
project: HobbyPulse
created: 2026-03-31
---

# Design Sprint Brief — shadcn + Light/Dark Mode

## Goal

Redesign TabletopWatch + SimRaceWatch from generic AI-generated dark template to a polished, professional "clean data product with personality" — reusable across all verticals.

## Direction

**Clean data product** — Linear meets Steam. Not immersive/themed. Content is the star.

- Clean layout with excellent typography and spacing
- Light/dark mode toggle (shadcn native)
- Per-vertical accent colour + subtle themed touches
- Micro-animations (hover, transitions, loading shimmer)
- One hero element per vertical (gradient, pattern, or texture)

## Implementation Plan

### Step 1: Install shadcn/ui
- `npx shadcn@latest init` in the project
- Configure for Next.js App Router + Tailwind v4
- Set up the theme with CSS variables for light/dark

### Step 2: Colour Palette (not default Tailwind)
Use tweakcn.com to generate:

**TabletopWatch:**
- Light: warm off-white background, navy/slate accents
- Dark: dark navy (#0c1222), amber/gold accent (#d4a843)
- NOT purple — that's the AI-generated default

**SimRaceWatch:**
- Light: clean white, charcoal accents
- Dark: dark charcoal (#141414), racing red (#dc2626)

### Step 3: Light/Dark Mode Toggle
- Add theme provider (next-themes)
- Toggle in nav bar
- Respect system preference
- All components use CSS variables that swap

### Step 4: Redesign Pages (priority order)

**Home page:**
- Hero section with brand name, tagline, subtle gradient background
- "What we do" section with icons/illustrations (not just text cards)
- Live stats (real numbers, not "--" placeholders)
- Featured battle reports (3 cards with real data)
- CTA to Build My Army Cheap (tabletop) or Setups (sim racing)

**Watch page:**
- Simplify filters — collapse into one smart row, not three
- Improve card design — more white space, better typography hierarchy
- Game system colour coding stays (it works)
- Remove "Include Shorts" toggle — just never show shorts

**Video detail page:**
- Better layout for army lists — tabbed or accordion
- Winner badge more prominent
- Key moments in a timeline/highlight format
- Cleaner sidebar

**Nav:**
- Add light/dark toggle
- Better mobile nav (hamburger or bottom tabs)

### Step 5: shadcn Components to Use
- Button, Card, Badge, Input, Select, Dropdown, Dialog
- Tabs (for army list display)
- Toggle (for light/dark)
- Skeleton (for loading states)
- Tooltip (for rules version info)

### Step 6: Magic UI Enhancements
- Shimmer border on featured cards
- Animated gradient on hero section
- Number ticker for live stats

## What NOT to Change
- The data pipeline, API routes, cron jobs — backend stays untouched
- The game system colour coding — it works well
- The content type classification — tested and working
- URL structure — /watch, /deals, /live, /build, /setups

## Current Pain Points (from audit)
- Generic purple accent = screams "AI template"
- No logo or brand mark
- Empty states shown to users ("No deals yet", "No army lists")
- Three rows of filters overwhelm new visitors
- Placeholder stats ("--") on home page
- No onboarding for first-time visitors
- Cards are functional but bland

## Reference Sites
- Linear (linear.app) — clean, professional, excellent dark mode
- Steam — soft grays, content-focused, gaming context
- Tabletop Tactics (tabletoptactics.tv) — dark navy + red, premium feel
- Vercel dashboard — clean data presentation

## Deliverable
Both sites should look like a product someone paid for, not a developer side project. The data underneath is world-class — the design needs to match.
