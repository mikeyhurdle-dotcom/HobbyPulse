---
type: audit
project: HobbyPulse
created: 2026-03-31
---

# HobbyPulse — Website Audit Report

**Audited by:** Claude (as external agency review)
**Date:** 2026-03-31
**Sites:** TabletopWatch (hobbypulse.vercel.app) + SimPitStop (simpitstop.vercel.app)

---

## Executive Summary

| Category | TabletopWatch | SimPitStop | Score |
|----------|:---:|:---:|:---:|
| **SEO Technical** | Good | Good | 7/10 |
| **Content Quality** | Promising | Early | 6/10 |
| **Usability / UX** | Functional | Functional | 5/10 |
| **Visual Design** | Generic | Generic | 3/10 |
| **Mobile Experience** | Responsive | Responsive | 6/10 |
| **Performance** | Fast | Fast | 8/10 |
| **Conversion / Revenue** | Not yet live | Not yet live | 2/10 |
| **Overall** | | | **5.3/10** |

The platform has strong technical foundations and a genuinely differentiated data offering (structured army lists, transcript-powered insights, cross-system recommendations). However, the visual design looks template-generated, there's no brand identity, and several pages are empty or show placeholders. Not ready for a public launch.

---

## 1. SEO Technical Audit — 7/10

### Strengths
- Dynamic sitemap with 327 URLs (tabletopwatch.com) — excellent crawl surface
- Schema.org structured data: VideoObject, Product, WebSite, BreadcrumbList
- Auto-generated OG images for all video and deal pages
- robots.txt correctly blocks /api/ and /admin/
- SSR/SSG correctly applied — dynamic pages are server-rendered, static pages pre-built
- Clean URL structure: /watch, /deals, /live, /watch/{videoId}
- Per-page metadata with generateMetadata() — titles, descriptions, OpenGraph

### Issues
- **No custom domain** — currently on .vercel.app which has zero domain authority. Google treats subdomains of vercel.app as low-authority. **Critical blocker for SEO.**
- **Sitemap references tabletopwatch.com** but that domain doesn't exist yet — Google will get 404s if it tries to crawl the sitemap URLs
- **No canonical tags** — potential duplicate content issues between hobbypulse.vercel.app and the future custom domain
- **No Google Search Console** verification — site isn't being actively indexed
- **No internal linking strategy** — video pages don't link to related videos or deals effectively (components exist but data is sparse)
- **Title tags could be richer** — "Battle Reports | TabletopWatch" is fine but adding faction names would help: "Death Guard vs Orks Battle Report | TabletopWatch"

### Recommendations
1. Buy and configure custom domains immediately (biggest SEO blocker)
2. Add canonical tags pointing to custom domain
3. Submit sitemaps to Google Search Console
4. Enrich video page titles with faction names from parsed data

---

## 2. Content Quality — 6/10

### TabletopWatch

| Content | Count | Quality |
|---------|:-----:|---------|
| Video pages | 161 | Good — real YouTube videos with thumbnails, views, dates |
| Parsed army lists | 19 | Excellent — structured data with units, points, factions |
| Winners identified | 5 | Unique — no competitor has this |
| Key tactical moments | 5 | Unique — transcript-powered |
| Deal products | 0 | Empty — eBay API pending |
| Blog posts | 0 | None yet |
| Live streams | 9 | Real data, refreshing |

### SimPitStop

| Content | Count | Quality |
|---------|:-----:|---------|
| Video pages | 184 | Good — real content from 13 channels |
| Car setups | 90 | Mostly hardware mentions (valuable for deals), few actual setups |
| Deal products | 68 (seeded, no live prices) | Products exist but no retailer pricing |
| Live streams | 60 | Strong — Twitch + YouTube |

### Issues
- **Deals page is completely empty** on both sites — "No deals found yet" is a terrible first impression
- **"No parsed army lists yet"** shows on many video detail pages — feels broken
- **Many videos classified as "other"** — 85 on SimPitStop, 15 on TabletopWatch. These feel like filler.
- **Wrong channel data cleaned up** but some videos from before the fix may still show irrelevant content
- **No editorial voice** — the site is pure data, no personality or opinion

### Recommendations
1. Don't launch until deals page has real data (eBay API blocker)
2. Hide the army lists section on video pages that have no parsed data (show nothing rather than "not yet")
3. Consider curating the "other" content more aggressively — or don't show it at all
4. Add an editorial layer — even a one-liner like "Classic Orks mirror match from Winters SEO" adds personality

---

## 3. Usability / UX — 5/10

### Strengths
- Clear navigation: Watch / Deals / Live / Build (tabletop) or Setups (sim racing)
- Filter system is comprehensive: game system, content type, faction, search, sort
- Game system colour coding makes scanning easy
- Video cards show relevant metadata: thumbnail, duration, channel, views, date, game badge
- Rules staleness badge is genuinely useful ("Points may have changed")

### Issues
- **Filter overload** — there are THREE rows of filters (search bar, game system pills, content type pills) plus faction dropdown and sort. For a first-time visitor this is overwhelming.
- **No onboarding** — a new visitor has no idea what this site is or why they should use it instead of YouTube. There's no "here's what we do" above the fold on /watch.
- **The home page is weak** — three feature cards with "View all →" links, placeholder stats showing "--", and skeleton loading cards. Doesn't sell the value proposition.
- **"Build My Army Cheap" is hidden** — the killer feature is buried in the nav. It should be prominently featured on the home page and watch pages.
- **Empty deals page** — a user clicking "Deals" sees nothing. This is the primary revenue page and it's empty.
- **No breadcrumbs** visible on video detail pages (Schema.org breadcrumbs exist but aren't rendered in UI)
- **No loading states on filters** — changing a filter does a full page reload. Should feel snappier.
- **"Include Shorts" toggle** is confusing — most users won't know what this means

### Recommendations
1. Simplify the filter UI — collapse game system and content type into a single row with smart defaults
2. Add a hero section on /watch explaining the value: "Every battle report, every army list, every faction — in one place"
3. Feature "Build My Army Cheap" prominently on the home page with a demo
4. Remove or hide empty pages until data exists
5. Add loading/skeleton states when filters change
6. Remove "Include Shorts" — just never show shorts

---

## 4. Visual Design — 3/10

### The Problem
The site looks like it was generated by AI. This is the single biggest issue and will kill credibility with the target audience (hobbyists who care deeply about aesthetics — they literally paint miniatures for fun).

### Specific Issues
- **Generic dark theme** — #09090b background with purple accent is the default AI/template look. No personality.
- **No logo** — just the word "TabletopWatch" in Syne font. Needs a proper wordmark or icon.
- **No brand imagery** — no hero images, no illustrations, no photography. The site is entirely text and YouTube thumbnails.
- **No visual differentiation** from any other dark-themed Next.js site
- **Card design is functional but bland** — no texture, no depth, no visual interest beyond the game system colour stripe
- **The purple accent** (#7c3aed) is literally the default Tailwind violet. It screams "template."
- **No dark mode nuance** — the background is near-black (#09090b) but there's no gradient, no subtle texture, no warmth. Compare to Tabletop Tactics' navy-black (#091219) which feels intentional.
- **Typography is fine but underutilised** — Syne is a distinctive display font but it's only used for headings. The overall typographic rhythm is flat.
- **SimPitStop looks identical** to TabletopWatch but red instead of purple — there's no visual identity per brand

### What Good Looks Like
- **Tabletop Tactics** — dark navy, red accents, bold imagery, feels premium and intentional
- **Warhammer Guild** — dark green-black with gold accents, very on-brand for the community
- **YouTube** — their dark mode uses #0f0f0f with careful contrast ratios and consistent spacing

### Recommendations
1. **Commission a logo** for each brand (Fiverr, 99designs, or AI-generated as a starting point)
2. **Choose a colour palette that isn't the Tailwind default** — TabletopWatch could use dark navy + amber/gold. SimPitStop could use dark charcoal + racing red.
3. **Add a hero image or illustration** to the home page — even a stylised background pattern would help
4. **Add subtle texture** — a noise overlay, gradient mesh, or subtle pattern breaks the flat black monotony
5. **Use the fonts more expressively** — larger headings, tighter tracking, bolder weights
6. **This should be a design sprint before any public launch** — the current look will undermine the genuinely great data underneath

---

## 5. Mobile Experience — 6/10

### Strengths
- Responsive grid: 1 column mobile, 2 tablet, 3 desktop
- Touch-friendly tap targets on cards and filters
- Sticky nav works well on mobile
- Video embeds scale correctly

### Issues
- **Three filter rows on mobile** take up most of the screen above the fold — you have to scroll past filters to see any content
- **Game system pills overflow horizontally** — scrollable but no visual indicator that there's more to scroll
- **The ad mobile footer** (sticky bottom bar) would compete with the nav on small screens
- **No mobile-specific navigation** — no hamburger menu, no bottom tab bar. The horizontal nav items get cramped on small phones.

### Recommendations
1. Collapse filters behind a "Filters" button on mobile — show only the most important filter (game system) inline
2. Add scroll indicators (fade edges) on horizontal pill bars
3. Consider a bottom tab bar for mobile navigation (Watch/Deals/Live)

---

## 6. Performance — 8/10

### Strengths
- Next.js 15 with Turbopack — fast builds and optimised output
- Static pages pre-rendered (home, about, privacy, live)
- Dynamic pages server-rendered with streaming
- Images lazy-loaded
- Fonts loaded via next/font (no FOUT)
- No client-side JavaScript frameworks beyond React hydration
- Vercel edge network for CDN delivery

### Issues
- **No image optimisation** — YouTube thumbnails are loaded directly from yt3.ggpht.com. Should use next/image for automatic optimisation.
- **No cache headers** on dynamic pages — /watch reloads fresh from Supabase on every request
- **327 URLs in sitemap** but no pagination — Googlebot will crawl all at once

### Recommendations
1. Use next/image for all thumbnails (WebP conversion, lazy loading, srcset)
2. Add ISR (Incremental Static Regeneration) to /watch and /deals pages with 5-minute revalidation
3. Split sitemap if it exceeds 1000 URLs

---

## 7. Conversion / Revenue Readiness — 2/10

### Issues
- **Deals page is empty** — the primary revenue driver has no data
- **No affiliate links active** — eBay pending, Element/Wayland not signed up, Amazon not configured
- **Ad slots render nothing** — ADSENSE_PUB_ID not set
- **Price alerts can't send** — Resend not configured
- **Build My Army Cheap** can't function — needs deals data in DB
- **No custom domain** — can't apply for AdSense on .vercel.app
- **No email capture** — no newsletter signup, no way to build an audience

### What's Ready (code-wise)
- Ad slot components built and will auto-render when configured
- Affiliate URL wrapping middleware built
- Price alert form built
- Build My Army Cheap UI built
- Revenue admin dashboard built

### Recommendations
1. This is entirely an API keys + sign-ups blocker — all code is ready
2. Priority: eBay API → domain → AdSense → affiliate sign-ups
3. Add a newsletter signup to capture emails before monetisation is live

---

## 8. Competitive Edge Assessment

### What's Genuinely Unique (no competitor has this)

| Feature | Value | Status |
|---------|-------|--------|
| Cross-channel battle report aggregation with structured army lists | **Very High** | Working — 19 lists, 215 units |
| Winner identification from transcripts | **Very High** | Working — 5 winners identified |
| Key tactical moments extraction | **High** | Working — detailed play-by-play |
| Cross-game system recommendations (faction affinity) | **High** | Built, needs more data |
| Build My Army Cheap (paste list → shopping cart) | **Very High** | Built, needs deals data |
| Game system colour-coded mixed feed | **Medium** | Working |
| Rules version staleness badge | **Medium** | Working |
| Sim racing hardware-from-video detection | **High** | Working — 90 setups |

### The Gap
The data is exceptional. The presentation is not. A competitor with mediocre data but polished design would currently beat us on first impression. The entire value proposition is hidden behind a generic dark template.

---

## Priority Actions (Ranked)

| Priority | Action | Impact | Effort |
|:--------:|--------|:------:|:------:|
| 1 | **Buy domains + configure** | Unlocks SEO + AdSense | Low (manual) |
| 2 | **Get eBay API live** | Unlocks deals page (primary revenue) | Low (waiting) |
| 3 | **Design sprint** — logo, colours, hero images | Unlocks credibility for launch | Medium |
| 4 | **Hide empty/broken states** | Stops the site looking unfinished | Low (code) |
| 5 | **Simplify filter UX** | Better first impression | Medium (code) |
| 6 | **Submit to Google Search Console** | Start indexing | Low (manual) |
| 7 | **Reddit launch posts** | First traffic spike | Low (manual) |
| 8 | **Newsletter signup** | Build audience before monetisation | Low (code) |

---

## Summary

**The data engine is world-class. The presentation is not ready for launch.**

The transcript-powered army list extraction, winner detection, and cross-system recommendations are genuinely unique — no other site in the tabletop or sim racing space offers this. The architecture is sound, scalable, and cost-efficient.

But the site currently looks like a developer prototype, not a consumer product. The generic dark theme, empty deals page, placeholder stats, and overwhelming filter UI would cause most visitors to bounce before discovering the value underneath.

**Recommendation:** Invest in a focused design sprint (2-3 days) before any public launch or Reddit posts. The data deserves better packaging.

---

*Audit completed 2026-03-31*
