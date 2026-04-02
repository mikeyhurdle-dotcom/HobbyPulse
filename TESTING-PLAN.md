# HobbyPulse — User Journey Testing Plan

## Overview

End-to-end testing from the perspective of a new user discovering the site. Covers both TabletopWatch (hobbypulse.vercel.app) and SimPitStop (simpitstop.vercel.app).

---

## Journey 1: Watch a Battle Report → Find Deals on Units

**Persona:** Warhammer player who wants to copy a winning army list at the best price.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1.1 | Open hobbypulse.vercel.app | Hero section visible with "Browse Battle Reports" CTA, real stats (not "--"), 6 featured videos |
| 1.2 | Click "Browse Battle Reports" | Watch page loads with filters — search bar, faction dropdown, game system pills, content type pills |
| 1.3 | Click "40K" game system pill | URL updates to `?game=40k`, only 40K videos shown, pill is highlighted |
| 1.4 | Click a video card | Video detail page loads with YouTube embed, title, game system + content type badges |
| 1.5 | Check sidebar — army lists visible? | If parsed: army list cards with faction badge, player name, unit rows, points. If not parsed: section hidden entirely (no "not yet" message) |
| 1.6 | Check winner badge | If winner detected: gold trophy badge at top of page + "Winner" tag on the winning list |
| 1.7 | Click a unit name (e.g. "Intercessors") | Navigates to `/deals?q=Intercessors` — deals page with search pre-filled |
| 1.8 | Click the book icon on a unit | Opens Wahapedia datasheet in new tab |
| 1.9 | Click "Buy This Army" button | Navigates to `/build?list=...` with army list pre-filled in textarea |
| 1.10 | On Build page, click "Find Best Prices" | Results table shows each unit with best price, RRP, savings %, source, buy link |
| 1.11 | Click "Buy" on a unit | Opens retailer page in new tab (affiliate URL with tracking params) |
| 1.12 | Click "Copy Shopping List" | Clipboard contains formatted list with unit names, quantities, prices |

**Pass criteria:** Complete flow from video → army list → deals → purchase link without errors or empty states.

---

## Journey 2: Browse Deals → Set Price Alert

**Persona:** Budget-conscious hobbyist looking for the cheapest Combat Patrol box.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 2.1 | Click "Deals" in nav | Deals page loads with product grid (not empty) |
| 2.2 | Type "Combat Patrol" in search, click Filter | Grid filters to Combat Patrol products only |
| 2.3 | Sort by "Price: Low to High" | Products reorder, cheapest first |
| 2.4 | Click a product card | Product detail page with price comparison table |
| 2.5 | Check price table | Multiple retailers listed, sorted by price. Best price row highlighted green. Each row shows source, price, condition, savings %, stock status, "Buy" button |
| 2.6 | Check "Last scraped" times | Should show relative times (e.g. "2h ago"), not empty |
| 2.7 | Scroll to "Set a Price Alert" | Form visible with email input + target price (pre-filled at 90% of best) |
| 2.8 | Enter email and submit | Success message: "We'll email you when [product] drops below £X.XX" |
| 2.9 | Click "Buy" on best price row | Opens retailer page in new tab |

**Pass criteria:** Products have real prices from real retailers. Price alert saves successfully. Buy links work.

---

## Journey 3: Sim Racing — Watch Replay → Find Setup → Shop Hardware

**Persona:** Sim racer who wants to copy a fast driver's car setup and upgrade their rig.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 3.1 | Open simpitstop.vercel.app | Hero section with "Browse Replays" CTA, real stats, featured videos |
| 3.2 | Click "Car Setups" in nav | Setups page loads with filter dropdowns (Sim, Car, Track) |
| 3.3 | Filter by sim (e.g. "iRacing") | Grid filters to iRacing setups only |
| 3.4 | Click a setup card | Navigates to video detail page |
| 3.5 | Check sidebar — car setup visible? | Setup card with sim badge (colored), car name, track, setup data grid (suspension, brake bias, etc.) |
| 3.6 | Click "Copy Setup" button | Button text changes to "Copied!", clipboard has formatted setup text |
| 3.7 | Check "Hardware mentioned" section | If hardware detected: clickable pills linking to `/deals?q=[hardware]` |
| 3.8 | Click a hardware pill | Navigates to deals page with search pre-filled for that hardware |
| 3.9 | Browse sim racing deals | Products from Moza Racing + Trak Racer with real prices |

**Pass criteria:** Setup data displays correctly. Copy works. Hardware links connect to deals with real products.

---

## Journey 4: Mobile Experience

**Persona:** User browsing on phone during commute.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 4.1 | Open site on mobile viewport (375px) | Layout is single-column, text readable, no horizontal scroll |
| 4.2 | Tap hamburger menu icon | Side sheet slides in with nav links (Watch, Deals, Build/Setups, Live) |
| 4.3 | Tap a nav link | Sheet closes, page navigates |
| 4.4 | Check Watch page filters | Search bar full-width, dropdowns stack or wrap. Game system pills scroll horizontally |
| 4.5 | Tap theme toggle (sun/moon icon) | Theme switches between light and dark. All text remains readable. No broken contrast. |
| 4.6 | Open a video detail page | Video embed scales to full width. Army lists/setups stack below video (not side-by-side) |
| 4.7 | Check deals grid | Cards stack to single column on narrow screens |
| 4.8 | Check footer | Footer text wraps cleanly, links accessible |

**Pass criteria:** All features accessible on mobile. No horizontal overflow. Tap targets large enough (44px+).

---

## Journey 5: Light/Dark Mode

**Persona:** User who prefers light mode.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 5.1 | Load site (default dark) | Dark background, light text, amber/gold accent (TabletopWatch) or red accent (SimPitStop) |
| 5.2 | Click theme toggle | Switches to light mode — light background, dark text, same accent colours |
| 5.3 | Navigate to Watch page | Light theme persists across navigation |
| 5.4 | Check video cards in light mode | Thumbnails, badges, text all have good contrast |
| 5.5 | Check deals page in light mode | Price text (green), condition badges, savings badges all readable |
| 5.6 | Refresh page | Theme preference persists (stored in localStorage) |
| 5.7 | Check system preference | If OS is set to light mode and no manual toggle, site defaults to light |

**Pass criteria:** Both themes fully functional. No invisible text, broken borders, or unreadable elements.

---

## Journey 6: Live Streams

**Persona:** User looking for something to watch right now.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 6.1 | Click "Live" in nav | Live page loads. If streams active: grouped cards. If none: clean empty message. |
| 6.2 | Check live indicator in nav | Red pulsing dot on "Live" tab |
| 6.3 | Check stream cards | Thumbnail with LIVE badge, platform badge (Twitch purple / YouTube red), viewer count |
| 6.4 | Click a stream card | Opens external platform (Twitch/YouTube) in new tab |
| 6.5 | Check stream grouping | Related streams grouped by common keywords (e.g. "iRacing" or "40K") |

**Pass criteria:** Live streams display when active. External links work. Empty state is clean (no broken layout).

---

## Journey 7: Cross-Vertical Verification

Both sites use the same codebase. Verify differences are correct.

| Check | TabletopWatch | SimPitStop |
|-------|:---:|:---:|
| Brand name in nav | TabletopWatch | SimPitStop |
| Accent colour | Amber/gold | Racing red |
| Nav tabs | Watch, Deals, Build, Live | Watch, Setups, Deals, Live |
| Home hero CTA | "Browse Battle Reports" + "Build My Army Cheap" | "Browse Replays" + "Car Setups" |
| Watch page title | "Battle Reports" | "Races & Replays" |
| Video sidebar | Army lists (units, points, factions) | Car setups (sim, car, track, settings) |
| Game system pills | 40K, AoS, Old World, Kill Team, 30K, OPR | iRacing, ACC, F1, LMU, AC, etc. |
| Deals sources | Element Games, Troll Trader, eBay | Moza Racing, Trak Racer, eBay |
| `/build` page | Accessible — army list parser | Redirects to `/watch` |
| `/setups` page | Not in nav | Accessible — setup browser |

---

## Edge Cases to Verify

| Scenario | Expected |
|----------|----------|
| Video with no parsed army lists | Sidebar shows nothing (no "not yet" message) |
| Video with winner detected | Trophy badge prominent at top + on winning list card |
| Deals page with no products matching search | "No deals match your search" message |
| Deals page with no products at all | Empty (no "coming soon" message) |
| Product with only 1 listing | Price table shows 1 row, still marked as "Best Price" |
| Product with all listings out of stock | Red stock indicators, buy buttons still functional |
| Build page with invalid army list text | Error message displayed, form not submitted |
| Price alert with invalid email | Form validation prevents submission |
| Very long video title | Truncated with line-clamp, no layout break |
| Channel with no avatar | Gray circle with "?" placeholder |

---

## Data Health Checks

Run these periodically to verify the pipeline is working:

```sql
-- Product counts per vertical
SELECT v.slug, count(p.id) as products
FROM verticals v LEFT JOIN products p ON p.vertical_id = v.id
GROUP BY v.slug;

-- Listing freshness (should be < 24h old)
SELECT source, max(last_scraped_at), count(*) as listings
FROM listings GROUP BY source;

-- Cache effectiveness
SELECT resolved_by, count(*) FROM product_name_cache GROUP BY resolved_by;

-- Price history being recorded
SELECT date(recorded_at), count(*) FROM price_history
GROUP BY date(recorded_at) ORDER BY 1 DESC LIMIT 7;
```

---

*Created 2026-04-02 — covers design sprint + deals pipeline launch.*
