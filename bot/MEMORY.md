# PulseBot Memory

## Mission

You are the autonomous business operator for HobbyPulse. Your job is to make TabletopWatch and SimRaceWatch profitable through content creation, social media, deals curation, code improvements, and revenue tracking. Target: £500/month.

## Key Facts

- Project launched: 2026-03-30
- **Role upgraded from watchdog to business operator: 2026-04-16**
- Two sites: TabletopWatch (warhammer + board games) + SimRaceWatch (simracing)
- Same codebase, same Supabase DB, different Vercel projects
- Supabase project ID: nspgvdytqsvnmbitbmey (eu-west-2 London)
- GitHub repo: mikeyhurdle-dotcom/HobbyPulse
- Blog: filesystem-based markdown in `content/blog/{vertical}/`
- Revenue model: affiliate commissions + AdSense + email newsletter

## Channel Registry

### Tabletop (11 channels)
Tabletop Titans, PlayOn Tabletop, MWG Studios, Winters SEO, Auspex Tactics, Art of War, Mordian Glory, Guerrilla Miniature Games, The Honest Wargamer, Striking Scorpion 82, Tabletop Tactics

### Sim Racing (14 channels)
Jimmy Broadbent, Jardier, Dave Cam, Aris Drives, Coach Dave Academy, Boosted Media, Dan Suzuki, Ermin Hamidovic, Sim Racing Garage, Chris Haye, Karl Gosling, Will Ford, Sim Racing Corner, Laurence Dusoswa

### Board Game Channels (20 channels)
Check `config/verticals.ts` for the full list — added during board game pivot (2026-04-11)

## Scraper Status

| Source | Status | Vertical |
|--------|--------|----------|
| Element Games | Working | Tabletop |
| Troll Trader (Shopify) | Working | Tabletop |
| Moza Racing (Shopify) | Working | Sim Racing |
| Trak Racer (Shopify) | Working | Sim Racing |
| eBay Browse API | Working | Both |
| Wayland Games | Disabled (Cloudflare 403) | Tabletop |

## Affiliate Status

| Program | Status | Env Var |
|---------|--------|---------|
| eBay Partner Network | Active | EBAY_CAMPAIGN_ID |
| Amazon Associates | Active | AMAZON_ASSOCIATES_TAG |
| Element Games | Rejected | ELEMENT_GAMES_AFFILIATE_REF |
| Goblin Gaming | Applied, pending | GOBLIN_GAMING_AFFILIATE_REF |
| Wayland Games | Applied, pending | WAYLAND_GAMES_AFFILIATE_REF |
| Magic Madhouse | Applied, pending | MAGIC_MADHOUSE_AFFILIATE_REF |

## Revenue Baseline (2026-04-16)

- Monthly page views: ~0 (sites are new, minimal SEO indexed)
- Affiliate revenue: £0
- AdSense: Under review (both sites verified, awaiting approval)
- Newsletter subscribers: 0
- Blog posts published: 2 (welcome posts only)

## Content Strategy

### TabletopWatch Pillars
1. "Build X Army Under £150" buying guides (affiliate driver)
2. Combat Patrol reviews and comparisons
3. New GW/board game release coverage
4. Weekly deals roundup (Friday)
5. Board game reviews + "coming soon" previews
6. Second-hand buying guides
7. Meta/tournament roundups

### SimRaceWatch Pillars
1. Hardware comparison guides (Moza vs Fanatec vs Simagic)
2. "Best sim racing X under £Y" guides
3. New hardware launch coverage
4. Weekly deals roundup (Friday)
5. Setup guides per sim title
6. Rig build guides

## Approval Gates (First Month)

- Blog posts: Draft → PR → Mikey approves → merge to main
- Code changes: Branch → PR → Mikey approves → merge
- Social posts: Auto-publish (but Mikey reviews quality weekly)
- After trust established: merge small fixes directly, publish blog posts directly

## Issues / Notes

- Wayland Games scraper disabled (Cloudflare 403) — re-enable when affiliate data feed available
- Fanatec, Sim-Lab scrapers not yet built (sim racing expansion targets)
- AdSense under Google review — no ad revenue until approved
- Social media accounts not yet created — need Buffer setup
- Revenue tracking APIs not yet configured (AdSense API, Search Console)
