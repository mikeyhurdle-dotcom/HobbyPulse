# Content Queue — Hawk drafting priority

Decided 2026-04-27 (Phase 5.1 of board-game-first rebrand). Hawk drafts via the existing `hawk-bg-draft-generator-am` / `-pm` crons. Mikey approves before merge.

## Top 5 board-game blog posts (TabletopWatch)

Drafting priority order. Each post: ≥1500 words, ≥3 affiliate links per the priority order in `sites/tabletopwatch.md`, schema.org BlogPosting markup, alt text on every image, internal links to `/deals`, `/kickstarter`, and `/boardgames/games/<slug>` where relevant. No banned AI phrases. Pre-publish QA from `sites/tabletopwatch.md` section 9 must pass.

### 1. "Best 2-player board games of 2026"
- Persona: **Buyer's Friend**
- Type: `best-list`
- Hook: someone who specifically wants 2-player games (couples, partners, dedicated 2-player groups)
- Must-haves:
  - "If you only buy one…" quick-rec block at the top
  - 7–10 ranked picks with rationale
  - Per pick: "Best for / Skip if" + budget framing
  - At least one explicit trade-off (e.g. teach time vs replay value)
  - Internal links to each game's `/boardgames/games/<slug>` page
  - 3+ affiliate links following priority order: Amazon → Zatu → Magic Madhouse / Chaos Cards / 365Games (use whichever are live by publish time)
- SEO target: "best 2 player board games 2026"

### 2. "Games like Wingspan: 7 alternatives if you loved it"
- Persona: **Buyer's Friend**
- Type: `best-list`
- Hook: "you played Wingspan, what next" — high commercial intent
- Must-haves:
  - First paragraph names 1–2 things people actually loved about Wingspan (engine builder + theme + accessibility) so picks make sense
  - 7 picks, each with: "Most like Wingspan if you loved its X", "Different but adjacent because Y"
  - At least one pick that's a step UP in complexity, one that's lighter
  - Player-count caveats per pick
  - Internal links to game pages + a "Build a 5-game gateway shelf" CTA pointing at /boardgames

### 3. "The 10 best gateway board games to introduce non-gamers"
- Persona: **Buyer's Friend**
- Type: `best-list`
- Hook: someone with non-gamer friends or family — biggest evergreen-traffic potential
- Must-haves:
  - Quick rec for the "absolute first game"
  - 10 ranked picks
  - Per pick: setup time + teach time in minutes, player-count sweet spot, one-line "what this teaches a new player"
  - Concrete "non-gamer scenario" for at least 2 picks ("your in-laws after Christmas dinner")
  - Skip-if for at least 3 picks
  - Affiliate links + internal `/boardgames/games/<slug>` links
- SEO target: "best gateway board games 2026", "board games for non-gamers"

### 4. "Board game Kickstarters worth backing right now (April 2026)"
- Persona: **Buyer's Friend** (with verdict-style backbone of the Reviewer)
- Type: Kickstarter roundup (per `sites/tabletopwatch.md` section 3)
- Hook: discovery + curation — saves people from doom-scrolling Kicktraq
- Must-haves:
  - 5–8 currently-live picks with funding %, days left, pledge tier callout
  - Honest verdict on each: "worth backing" / "wait for retail" / "skip"
  - At least one explicit trade-off (e.g. shipping cost surprise, late-pledge availability)
  - Internal links to `/kickstarter/<slug>` for each pick
  - "Back this campaign" CTA that wraps the Kickstarter URL via lib/affiliate.ts
  - Note: link to /kickstarter at top + bottom for the live tracker
- IMPORTANT: regenerate / refresh this post each month — link to the rolling tracker for live data

### 5. "Catan vs Carcassonne: which classic is right for you?"
- Persona: **Opinionated Reviewer**
- Type: `versus`
- Hook: timeless decision, evergreen traffic, beats out the existing wave of warhammer-adjacent comparison content
- Must-haves:
  - Fast verdict in the first 20% (one-line answer per player type)
  - Side-by-side comparison: teach time, depth, replay value, player-count fit, scaling
  - Winner by player type (e.g. "first-time gamers / families with younger kids / serious-but-light-strategy crowd")
  - Final rec with caveat
  - Where to buy block at the end
  - Internal links to `/boardgames/games/catan` and `/boardgames/games/carcassonne`
- SEO target: "catan vs carcassonne", "is catan or carcassonne better"

## How Hawk drafts these

The two existing crons cover this:
- `hawk-bg-draft-generator-am` (08:45 London) — picks top 2 queued topics
- `hawk-bg-draft-generator-pm` (17:30 London) — picks one comparison/how-to + one best-list/review

When Hawk runs them:
1. Read this file and `sites/tabletopwatch.md`.
2. Pick the top unworked title from the queue above.
3. Draft to a feature branch (`hawk/blog-<slug>`), commit, push, open a PR.
4. Mikey reviews + merges.

Once a post lands on `main` and is live, mark it `[x]` here so the next draft run picks the next title.

## Status

- [ ] 1. Best 2-player board games of 2026
- [ ] 2. Games like Wingspan: 7 alternatives if you loved it
- [ ] 3. The 10 best gateway board games to introduce non-gamers
- [ ] 4. Board game Kickstarters worth backing right now (April 2026)
- [ ] 5. Catan vs Carcassonne: which classic is right for you?
