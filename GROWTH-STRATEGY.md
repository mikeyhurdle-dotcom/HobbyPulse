---
type: strategy
project: HobbyPulse
created: 2026-03-31
---

# HobbyPulse — Growth & Traffic Strategy

## Principle

SEO is the primary engine. Social is the accelerant. Never pay for traffic — the economics don't support it at our RPM (£12.50 per 1K views). Focus on organic discovery through genuinely useful content and tools.

## Phase 1: Foundation (Now → Domain Purchase)

**Goal:** Get the sites indexed and build initial SEO surface.

| Action | Owner | Automated? |
|--------|:-----:|:----------:|
| Buy tabletopwatch.com + simracewatch.com | Mikey | No |
| Configure custom domains in Vercel | Claude | — |
| Submit to Google Search Console | Mikey | No |
| Ensure sitemaps + robots.txt are correct | Done | — |
| Schema.org structured data on all pages | Done | — |
| OG images auto-generated | Done | — |
| Continue ingesting content (videos, transcripts, army lists) | PulseBot | Yes |

**SEO surface at launch:**
- TabletopWatch: ~161 video pages, 65 products, faction pages
- SimRaceWatch: ~199 video pages, 68 products, sim/hardware pages
- Total: ~500+ indexable pages from day one

## Phase 2: Reddit Launch (Week 1 After Domain)

**Goal:** Drive initial traffic spike and backlinks from high-authority subreddits.

### TabletopWatch — Reddit Launch Posts

**Post 1: r/Warhammer40k (850K members)**
- Title: "I built a free tool that finds the cheapest way to buy any army list"
- Content: Demo the Build My Army Cheap feature. Paste a popular competitive list, show the price breakdown. Link to /build.
- Angle: Genuinely useful tool, not a sales pitch.

**Post 2: r/Warhammer40k or r/WarhammerCompetitive**
- Title: "I made a site that aggregates battle reports from 10+ channels with searchable army lists"
- Content: Show how you can filter by faction, see who won, browse structured lists. Link to /watch.
- Angle: "I was frustrated that I couldn't search for Death Guard battle reports across all channels"

**Post 3: r/ageofsigmar**
- Title: "TabletopWatch now covers AoS — cross-channel battle reports with army lists"
- Content: Same angle but AoS-specific.

### SimRaceWatch — Reddit Launch Posts

**Post 1: r/simracing (700K members)**
- Title: "I built a site that extracts what hardware YouTubers are using and compares prices"
- Content: Show hardware detection from video descriptions. "In this video, Boosted Media uses a Simucube 2 Pro + Heusinkveld Sprints — here's the best price across 8 retailers"
- Angle: "I wanted to know what gear creators actually use without watching the whole video"

**Post 2: r/iRacing or r/ACCompetizione**
- Title: "SimRaceWatch — race replays from 14 channels filtered by sim, plus live streams and hardware deals"
- Content: Show the Watch page filtered by iRacing, the live streams page, and a hardware deal.

### Reddit Rules
- Each post must provide genuine value, not just link dropping
- Include screenshots or demos in the post
- Respond to every comment personally
- Only post once per subreddit — don't spam
- Wait at least a week between posts across subreddits
- Don't use alt accounts — post from your main Reddit account
- Mikey reviews and posts all Reddit content (not automated)

## Phase 3: Social Media Automation (Ongoing)

**Goal:** Consistent presence on Twitter/X with zero manual effort.

### PulseBot Auto-Posts (to be built)

| Post Type | Frequency | Template |
|-----------|:---------:|---------|
| New battle report | When ingested | "New battle report: {title} by {channel} — {faction1} vs {faction2} at {points}pts. Watch + army lists: {link}" |
| Price drop detected | When found | "Price drop: {product} now £{price} at {retailer} ({savings}% off RRP). Compare prices: {link}" |
| Weekly trending factions | Monday | "This week's most popular factions in battle reports: 1. {faction1} 2. {faction2} 3. {faction3}. Browse all: {link}" |
| New channel discovered | When flagged | "New battle report channel discovered: {channel} ({subs} subs). Check them out: {link}" |
| Live stream highlight | When >100 viewers | "{streamer} is live streaming {game} with {viewers} viewers. Watch: {link}" |

### Twitter Account Setup
- TabletopWatch: @TabletopWatch (or @TabletopWatchHQ)
- SimRaceWatch: @SimRaceWatch

### Implementation
- PulseBot drafts tweets → posts to Twitter via API
- All automated, no manual review needed (factual data, not opinion)
- Track engagement to refine what resonates

## Phase 4: SEO Content Engine (Month 2+)

**Goal:** Rank for buyer-intent keywords that drive affiliate revenue.

### Auto-Generated Content (PulseBot)

| Content | Frequency | Data Source |
|---------|:---------:|------------|
| "Cheapest deals this week" | Weekly | Deals scraper price drops |
| "Trending factions this month" | Monthly | Army list parser data |
| "New releases price comparison" | On release | Deals scraper + GW announcements |
| "{Faction} army building guide" | Quarterly | Parsed army lists + deals data |

### Manual Content (Mikey reviews PulseBot drafts)

| Content | Frequency | Target Keyword |
|---------|:---------:|----------------|
| "Cheapest way to start {faction}" | Per faction | Buyer intent |
| "Best {retailer} alternatives" | Quarterly | Comparison shopping |
| "{Game system} for beginners" | Per game | New player acquisition |
| "Best sim racing {product category}" | Per category | Buyer intent |

Full content plan in CONTENT-STRATEGY.md.

## Phase 5: Community Building (Month 6+)

**Goal:** Turn visitors into return users.

| Feature | Value | Effort |
|---------|-------|:------:|
| Price alerts (already built) | Users come back when prices drop | Done |
| Email newsletter | Weekly digest of new battle reports + deals | Medium |
| "Submit a battle report" form | Users become content scouts | Low |
| Discord server | Community discussion | Medium |
| User accounts + saved lists | Personal army list collection | High |

## Traffic Projections

| Month | SEO | Reddit | Social | Total |
|:-----:|:---:|:------:|:------:|:-----:|
| 1 | 500 | 5,000 (launch posts) | 200 | 5,700 |
| 2 | 1,500 | 1,000 | 500 | 3,000 |
| 3 | 3,000 | 500 | 800 | 4,300 |
| 6 | 8,000 | 1,000 | 2,000 | 11,000 |
| 12 | 25,000 | 2,000 | 5,000 | 32,000 |

Revenue at 32K monthly views: ~£400/month (£12.50 RPM combined ads + affiliates)

## Key Metrics to Track

- Google Search Console: impressions, clicks, average position
- PostHog/GA4: page views, sessions, bounce rate
- Affiliate: clicks, conversions, revenue per source
- Social: followers, engagement, referral traffic
- Content: videos ingested, army lists parsed, deals tracked

## What NOT to Do

- Don't pay for ads — ROI negative at our RPM
- Don't spam Reddit — one great post beats ten mediocre ones
- Don't create fake social engagement — organic only
- Don't neglect SEO for quick traffic — SEO compounds, social doesn't
- Don't launch on Reddit before the site is polished — first impressions matter

---

*Created 2026-03-31*
