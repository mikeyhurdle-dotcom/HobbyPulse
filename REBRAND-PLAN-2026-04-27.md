# TabletopWatch board-game-first rebrand — execute plan

> **Status**: drafted 2026-04-27, ready to execute
> **Owner**: Mikey + Claude (one fresh context window per phase, ideally)
> **Resumability**: re-read this doc at any point. Tick `[x]` as phases complete. The "WHY" and decisions are baked in here so a fresh Claude session can pick up cold.
> **One PR per phase.** Easy to revert if a phase breaks.

---

## CONTEXT — read this first if you're a fresh session

### What we're doing
TabletopWatch (the "warhammer" vertical of HobbyPulse) was originally a Warhammer 40K niche site. On 2026-04-11 we did a partial pivot to board games (8 feature sprints). On 2026-04-27 audit, we found the pivot was half-done — board-game-first visually, but Warhammer-first underneath (slug still `warhammer`, code paths fork on `slug === "warhammer"`, palette is Imperial Gold, killer feature `/build` and `/armies` are warhammer-only). This doc finishes the pivot.

### Strategic decisions (locked in 2026-04-27, do not relitigate)
1. **Kill `/build` (Build My Army Cheap) and `/armies` (tournament lists)** — warhammer-only, no board game equivalent, replaced by Kickstarter tracker as the new differentiator
2. **Keep the name "TabletopWatch"** — it's neutral enough, doesn't fight the rebrand
3. **Killer feature: Kickstarter tracker** — board game crowdfunding, late-pledge affiliate links. Genuine gap in the market.
4. **Warmer mascot feel** — palette swap from amber-gold-on-navy to something warmer/playful. Specific palette + mascot to be picked in Phase 3.
5. **Demote miniatures to a sub-section** — `/miniatures`, not a top-nav peer
6. **Multi-site Hawk architecture** — Hawk runs both TabletopWatch AND SimRaceWatch (and future sites) from one workspace, per-site context loaded on demand via `sites/<site>.md` pattern. Auto-load context stays ~16KB regardless of site count.

### Fleet state (already done 2026-04-27)
- Hoid retired, Sheepy demoted to Gemini, Hawk is sole Codex Pro consumer
- `hawk-codex-reauth-reminder` cron created (Mon 09:00 London)
- `hawk-bg-draft-generator-am`/`-pm` confirmed intentional, not duplicates
- OpenClaw skill updated to reflect all of this — trust the skill for fleet truth

### Out of scope (do NOT do these in this rebrand)
- Don't touch SimRaceWatch product/UX — it gets cron parity only, no rebrand
- Don't change blog post URLs — preserve SEO
- Don't touch the deals scrapers (they already work for both verticals)
- Don't restructure Supabase schema unless absolutely required
- Don't redesign the homepage from scratch — surgical edits only

---

## PHASE 0 — PulseBot briefing (do BEFORE any code changes)

> **Why first**: Hawk is producing content right now. If we change the codebase before briefing Hawk, it'll keep generating warhammer-leaning content while we pivot underneath.

### 0.1 — Slim Hawk's `SOUL.md`
- [ ] Read current `/root/.openclaw/workspace-pulsebot/SOUL.md` (2.9KB)
- [ ] Rewrite with multi-site mandate: "You are the autonomous business operator for the HobbyPulse network. You operate multiple sites listed in `REFERENCE.md`. For any task, first identify the site, then read `sites/<site>.md` for context and current direction. Preserve content production rhythm — what you've been doing is good, just keep producing for the right site with the right voice."
- [ ] Keep voice rules slim — no per-site detail
- [ ] Target ≤3KB final size

### 0.2 — Restructure Hawk's `REFERENCE.md` as the routing index
- [ ] Read current `REFERENCE.md` (6.0KB)
- [ ] Rewrite as a thin index:
  ```
  ## Sites operated
  - tabletopwatch — board-game-first (post 2026-04-27 pivot), miniatures as a niche subsection. Read sites/tabletopwatch.md for direction.
  - simracewatch — sim racing hardware deals + content. Read sites/simracewatch.md for direction.
  
  ## How to use
  Cron messages will name the site. Read sites/<site>.md FIRST, then act.
  ```
- [ ] Move detailed cron audit + tools index out of REFERENCE.md (those belong in TOOLS.md or per-site files)
- [ ] Target ≤2KB final size

### 0.3 — Migrate `EDITORIAL-VOICE-GUIDE.md` → `bot/sites/tabletopwatch.md` AND VPS workspace
- [ ] Read current `EDITORIAL-VOICE-GUIDE.md` (6.2KB)
- [ ] Rewrite preserving the voice work, but baking in the pivot decisions:
  - Board games are the lead category
  - Miniatures (warhammer) is a niche corner — content still welcome but not the main beat
  - **DO NOT generate** /build (army builder) or /armies (tournament lists) content — those features are being killed
  - **NEW killer feature in flight**: Kickstarter tracker — generate Kickstarter-related content (project roundups, late pledge alerts, "what's funding now" posts)
  - Visual identity is shifting to warmer/playful — when generating image prompts or thumbnail descriptions, lean warm/inviting (terracotta, teal, bright accents) NOT grim-dark/Imperial Gold
  - Affiliate priority order: Amazon (live), Zatu/Magic Madhouse/Chaos Cards/365Games (pending applications)
- [ ] Save to repo at `bot/sites/tabletopwatch.md` AND scp to `/root/.openclaw/workspace-pulsebot/sites/tabletopwatch.md` on VPS
- [ ] Target ≤4KB final size

### 0.4 — Migrate `SIMRACE-EDITORIAL-VOICE-GUIDE.md` → `bot/sites/simracewatch.md`
- [ ] Read current `SIMRACE-EDITORIAL-VOICE-GUIDE.md` (1.8KB)
- [ ] Save unchanged content to `bot/sites/simracewatch.md` AND scp to VPS at `/root/.openclaw/workspace-pulsebot/sites/simracewatch.md`
- [ ] Target ≤4KB final size (likely well under)

### 0.5 — Archive the old root-level voice guides
- [ ] On VPS: `mv workspace-pulsebot/EDITORIAL-VOICE-GUIDE.md workspace-pulsebot/_archive/EDITORIAL-VOICE-GUIDE.md.pre-pivot-2026-04-27`
- [ ] On VPS: `mv workspace-pulsebot/SIMRACE-EDITORIAL-VOICE-GUIDE.md workspace-pulsebot/_archive/SIMRACE-EDITORIAL-VOICE-GUIDE.md.pre-pivot-2026-04-27`
- [ ] Same in repo (move to `bot/_archive/`)

### 0.6 — Audit Hawk's `MEMORY.md`, `HEARTBEAT.md`, `TOOLS.md`
- [ ] Strip per-site detail from MEMORY.md (cross-site facts only). Per-site facts go in sites/ files.
- [ ] Confirm HEARTBEAT.md is self-contained (voice rules + chatId inline) since heartbeat sessions only auto-load HEARTBEAT.md
- [ ] TOOLS.md: confirm tools listed are vertical-agnostic (deals scrapers, blog generator, Haiku parser — all generic). Remove anything warhammer-specific.

### 0.7 — Add SimRaceWatch cron parity
> Hawk currently has 9 board-game-flavored crons but minimal sim-racing crons. Add equivalents.

- [ ] `hawk-srw-content-queue` — daily 06:30 London (offset from bg-content-queue at 06:15)
- [ ] `hawk-srw-draft-generator-am` — daily 09:00 (offset from bg at 08:45)
- [ ] `hawk-srw-deals-roundup` — weekly Fri 09:00 (offset from bg-deals-roundup Fri 08:00)
- [ ] `hawk-srw-weekly-planner` — weekly Mon 08:00 (offset from bg-weekly-planner Mon 07:30)
- [ ] All with `--message` that names the site: "Daily/weekly task for SimRaceWatch. Read sites/simracewatch.md, then run [task]."

**🛑 DECISION POINT — REVIEW REQUIRED:** Before pushing the new SOUL.md / REFERENCE.md / sites/*.md to the VPS, show drafts to Mikey for voice + tone approval.

### 0.8 — Validate
- [ ] `openclaw doctor` clean
- [ ] Send test ping to @Hobbypulsebot: "What sites do you operate?" — should answer naming both, mentioning sites/ pattern
- [ ] Verify no per-site detail leaked into auto-load files (MEMORY.md grep for "warhammer", "kickstarter", "trak racer", "moza" — all should miss)

---

## PHASE 1 — Demolition (codebase, kill warhammer-only features)

> **Why next**: clean slate before renaming/flipping defaults. Easier to find dead code refs after demolition.

### 1.1 — Delete `/build` route
- [ ] `rm -r app/(vertical)/build/`
- [ ] `rm -r app/api/build/` if exists
- [ ] Find + remove all `<Link href="/build">` in components
- [ ] Remove "Build My Army" / "Build" entries from `components/SiteHeader.tsx` nav arrays
- [ ] Remove the homepage "Quick Nav" card pointing to /build (in `app/(vertical)/page.tsx`)
- [ ] Delete army-builder components: `grep -r "ArmyBuilder\|BuildMyArmy" components/ app/` → remove all
- [ ] Update `app/api/test/route.ts` — remove the build-related health check from the 18-check suite

### 1.2 — Delete `/armies` route
- [ ] `rm -r app/(vertical)/armies/`
- [ ] Remove tournament list scraping if it exists (`lib/scrapers/tournaments.ts` or similar)
- [ ] Remove "Armies" / "Tournament Lists" nav entries
- [ ] Update `app/api/test` checks accordingly

### 1.3 — Demote `/watch` default filter
- [ ] In `app/(vertical)/watch/page.tsx`: change default category filter from `battle-report` → `all`
- [ ] Update meta + page title from "Battle Reports" → "Videos" (or "Watch" — whatever reads cleanest)
- [ ] Faction filter: only render if vertical is `tabletop` AND user actively picks "miniatures" filter

### 1.4 — Move warhammer channels into `miniatures` sub-array
- [ ] In `config/verticals.ts`: rename `boardGameChannels` array → primary `channels` array
- [ ] Move existing warhammer channels (11) into a new `miniatureChannels` sub-array
- [ ] Update `app/api/cron/youtube/route.ts` to ingest from BOTH arrays but tag videos correctly

### 1.5 — Validate Phase 1
- [ ] `pnpm build` — must pass with zero TS errors
- [ ] `pnpm dev` — visit `/`, `/watch`, `/deals` — no broken links to /build or /armies
- [ ] `curl localhost:3000/build` → expect 404
- [ ] `curl localhost:3000/armies` → expect 404
- [ ] `GET /api/test` → all checks pass (count will drop since build/armies checks removed)
- [ ] Commit: `feat(tabletop): kill /build + /armies, demote miniatures defaults`
- [ ] Push, verify Vercel deploy READY (per `feedback_check_deploys.md` rule)

---

## PHASE 2 — Rename slug + flip defaults

> **Why this is one phase, not two**: rename and conditional inversion go together. Splitting risks half-renamed state on production.

### 2.1 — Rename vertical slug
- [ ] In `config/verticals.ts`: change `slug: "warhammer"` → `slug: "tabletop"` for the TabletopWatch vertical config object
- [ ] **DO NOT change `NEXT_PUBLIC_SITE_VERTICAL` env var name** — only its value. Vercel project env: change value `warhammer` → `tabletop` for the hobbypulse Vercel project (NOT the simracewatch project)
- [ ] Update `lib/site.ts` `getSiteVertical()` if any string literal `"warhammer"` is hardcoded

### 2.2 — Find/replace + invert all `slug === "warhammer"` checks
- [ ] `grep -r 'slug === "warhammer"' app/ components/ lib/` — list every occurrence
- [ ] For each: rename the literal `"warhammer"` → `"tabletop"`, AND consider whether the conditional logic should INVERT (board games become the default, miniatures becomes the conditional opt-in)
- [ ] Specific files known to have this pattern: `app/(vertical)/page.tsx`, `app/(vertical)/about/page.tsx`, `components/SiteHeader.tsx`, `lib/external-lists.ts`

### 2.3 — Rewrite hero + meta copy for board-game-first
- [ ] In `app/(vertical)/page.tsx` hero section:
  - Headline: "Your guide to tabletop gaming — board games first" (or similar)
  - Sub: "Reviews, video guides, deals, and the latest from Kickstarter"
  - Primary CTA: "Browse Board Games" (current)
  - Secondary CTA: "Watch Reviews" (rename from "Watch Videos")
- [ ] In `config/verticals.ts`:
  - `description`: "Board games, reviews, deals, Kickstarter tracker, and the best of tabletop video"
  - `tagline`: keep current (already board-game-led)
- [ ] Update OG image alt text + meta description in `app/(vertical)/layout.tsx`

### 2.4 — Move `/miniatures` to a sub-section
- [ ] Confirm `/miniatures` already exists as a route. If not, create `app/(vertical)/miniatures/page.tsx` with the warhammer/miniatures content currently on the homepage
- [ ] Remove "Miniatures" tab from top nav — replace with a `/miniatures` link in the footer or a "Categories" dropdown
- [ ] Homepage: keep the "Miniatures Content" section but demote it (smaller, lower on the page)

### 2.5 — Validate Phase 2
- [ ] `pnpm build` — must pass
- [ ] `pnpm dev` — visit `/` — confirm hero is board-game-first
- [ ] Visit `/miniatures` — confirm warhammer content is here
- [ ] Search codebase for residual `"warhammer"` string literals: `grep -r '"warhammer"' app/ components/ lib/ config/` → expect only test/migration refs, no runtime conditionals
- [ ] `GET /api/test` — all checks pass
- [ ] Commit: `feat(tabletop): rename slug warhammer→tabletop, flip defaults to board-game-first`
- [ ] Push, change Vercel env var (`NEXT_PUBLIC_SITE_VERTICAL`: `warhammer` → `tabletop`), trigger redeploy, verify Vercel deploy READY

---

## PHASE 3 — Visual rebrand (parallel with Phase 4)

### 3.1 — Mascot direction
**🛑 DECISION POINT — BLOCKING:** Mikey picks one of three options before continuing.

Claude will draft three mascot concepts in `bot/REBRAND-MASCOTS.md`:
- **Option A**: Meeple-shaped character (literal board game piece anthropomorphised — instantly readable as "board games")
- **Option B**: Friendly fox/owl/raccoon "game master" character (warmer, more personality, less on-the-nose)
- **Option C**: Abstract dice cluster with a face (modern/playful, easier to use as a logomark)

- [ ] Mikey picks A, B, or C — or asks for a fourth direction
- [ ] If approved, Claude generates 3 visual mood-board PNGs (or describes prompts for an external designer/AI image gen)

### 3.2 — Palette
**🛑 DECISION POINT — BLOCKING:** Mikey picks before continuing.

Default proposal (override possible):
- **Background**: cream/off-white (`oklch(0.97 0.005 90)`) light mode default; deep warm charcoal (`oklch(0.22 0.01 50)`) dark mode
- **Accent**: terracotta (`oklch(0.65 0.15 40)`) OR warm teal (`oklch(0.62 0.10 200)`)
- **Display font**: keep Syne (works for both vibes)
- **Body font**: keep DM Sans

- [ ] Mikey picks accent (terracotta vs teal vs other)
- [ ] Mikey confirms light mode default (board game audience prefers light, wargamers prefer dark)

### 3.3 — Apply palette
- [ ] Update `app/globals.css` `--vertical-accent` for tabletop slug
- [ ] Update Tailwind config if needed
- [ ] Regenerate favicon (use new accent on white)
- [ ] Regenerate OG default image (`public/og-default.png`)
- [ ] Update social cards in `app/(vertical)/opengraph-image.tsx`
- [ ] Switch default theme from `dark` to `light` in `next-themes` config (still respects system preference)

### 3.4 — Validate Phase 3
- [ ] Visual sweep at `/`, `/watch`, `/deals`, `/blog`, `/miniatures` — palette consistent
- [ ] Test light + dark mode toggle
- [ ] OG image previews in Twitter/Discord look right
- [ ] Commit: `feat(tabletop): warmer palette + new mascot, light mode default`
- [ ] Push, verify Vercel deploy READY

---

## PHASE 4 — Kickstarter tracker (parallel with Phase 3)

### 4.1 — Pick data source
**🛑 DECISION POINT — DEFAULT-AND-OVERRIDE:** Claude defaults to Kicktraq scrape unless Mikey says otherwise.

- **Kicktraq scrape** (default — easier, no API key, may break)
- **Kickstarter discover API** (cleaner but undocumented, may need scraping anyway)
- **BackerKit late pledge integration** (for late-pledge affiliate links — separate from primary tracker)

### 4.2 — Data model
- [ ] New Supabase table `kickstarter_projects` (columns: id, title, url, image, creator, category="tabletop_games", funded_amount, goal_amount, backers, days_left, ends_at, late_pledge_url, late_pledge_open, last_synced)
- [ ] Migration in `supabase/migrations/`
- [ ] Add to `lib/supabase.ts` types

### 4.3 — Scraper + cron
- [ ] `lib/scrapers/kickstarter.ts` — pulls top board game projects from chosen source
- [ ] `app/api/cron/kickstarter/route.ts` — runs hourly, populates `kickstarter_projects` table
- [ ] Add cron to Vercel (`vercel.ts`) and to Hawk's VPS crontab as backup
- [ ] Protect with `Authorization: Bearer ${CRON_SECRET}`

### 4.4 — Routes
- [ ] `app/(vertical)/kickstarter/page.tsx` — landing: live + ending-soon + recently-funded grids
- [ ] `app/(vertical)/kickstarter/[projectSlug]/page.tsx` — per-project: funding %, days left, pledge tiers description, "Back this project" affiliate-wrapped CTA, "Late pledge" CTA when applicable
- [ ] Add filters: category (only board games for now, but design for future expansion), funding status
- [ ] Add to top nav as "Kickstarter" with a small "NEW" badge

### 4.5 — Affiliate wrapping
- [ ] Update `lib/affiliate.ts` to wrap Kickstarter URLs (Kickstarter doesn't have a direct affiliate program — use UTM tracking instead for analytics)
- [ ] BackerKit late pledge URLs: many have referral programs — research and wire up

### 4.6 — Hero CTA on homepage
- [ ] Add "🚀 Track live Kickstarter campaigns" CTA to homepage hero, links to `/kickstarter`
- [ ] Add `KickstarterFeaturedCard` component to homepage showing 3 hottest projects ending soonest

### 4.7 — Validate Phase 4
- [ ] Migration applies cleanly
- [ ] Cron populates rows (verify in Supabase)
- [ ] Visit `/kickstarter` — projects render
- [ ] Visit a project detail page — affiliate CTA works
- [ ] `GET /api/test` — add Kickstarter health check, all pass
- [ ] Commit: `feat(tabletop): Kickstarter tracker — live + ending-soon + late-pledge`
- [ ] Push, verify Vercel deploy READY

---

## PHASE 5 — Content seed + monetisation pickup

### 5.1 — Seed 5 board game blog posts
Hawk can draft these via existing `hawk-bg-draft-generator-am/-pm` crons. Mikey approves before publishing.

- [ ] "Best 2-player board games of 2026"
- [ ] "Games like Wingspan: 7 alternatives if you loved it"
- [ ] "The 10 best gateway board games to introduce non-gamers"
- [ ] "Board game Kickstarters worth backing right now (April 2026)"
- [ ] "Catan vs Carcassonne: which classic is right for you?"

For each: target ≥1500 words, internal links to `/deals`, `/kickstarter`, `/boardgames/games/*` pages, alt text on all images, schema.org BlogPosting markup.

### 5.2 — Affiliate program applications
Mikey applies (Claude can draft application copy if needed):

- [ ] **Zatu Games** affiliate: zatu.co.uk/affiliate (UK-focused, high-conversion board game retailer)
- [ ] **Magic Madhouse** affiliate
- [ ] **Chaos Cards** affiliate
- [ ] **365Games** affiliate
- [ ] **Kienda** affiliate (UK board game club)
- [ ] **BackerKit** late pledge referral program (research)

For each: positioning angle = "TabletopWatch is a content-led tabletop gaming site with X monthly visitors, here's our editorial calendar, here's our existing Amazon affiliate performance"

### 5.3 — Price comparison widget
- [ ] On `app/(vertical)/boardgames/games/[slug]/page.tsx`: add `<PriceComparisonStrip />` component showing best price across active retailers (Amazon, Zatu, Magic Madhouse — only those with live affiliate links)
- [ ] Use existing scrapers — no new scraper code needed
- [ ] Highlight "lowest price" with the accent colour

### 5.4 — Validate Phase 5
- [ ] 5 blog posts live + indexed
- [ ] Affiliate programs: at least 2 approved + wired up
- [ ] Price comparison widget renders for ≥10 board games (gated on having ≥2 retailer prices)
- [ ] Commit: `feat(tabletop): content seed + price comparison widget`
- [ ] Push, verify deploy

---

## PHASE 6 — Lock in autonomous cadence (the "hands off" test)

> **Why last**: prove the system runs itself before declaring victory.

### 6.1 — Cron audit
- [ ] List all Hawk crons: `openclaw cron list --all | grep pulsebot`
- [ ] Verify each cron has a clear single-site purpose (or is a cross-site weekly review)
- [ ] Disable any redundant crons
- [ ] Confirm `hawk-codex-reauth-reminder` fires Mon 09:00 London

### 6.2 — Escalation rules in SOUL.md
- [ ] Add to Hawk's SOUL.md (top section): "Telegram-ping Mikey only for: affiliate program rejections, scraper breakage that lasts >12h, weekly summary every Sunday 19:00, anything earning >£50/month milestone, Codex reauth reminder. Otherwise stay silent."

### 6.3 — 7-day hands-off test
**🛑 USER ACTION:** Mikey commits to NOT touching the codebase or PulseBot for 7 days. Just observe Telegram + dashboard.

- [ ] Set start date: __________
- [ ] Daily check (passive only): visit site, check `/blog`, `/kickstarter`, `/deals` — content fresh? deals updating? any errors?
- [ ] End-of-week review: how many blog posts published? how many Kickstarter projects tracked? any Telegram pings? any scraper breakages? Codex token still valid?
- [ ] Lessons → bot/sites/tabletopwatch.md updates

### 6.4 — Final validation
- [ ] All 6 phases checked off
- [ ] Site is genuinely board-game-first (visitor on `/` doesn't see warhammer until they actively click into `/miniatures`)
- [ ] Hawk produces ≥3 board game posts per week unattended
- [ ] Kickstarter tracker has live data
- [ ] At least 1 new affiliate program live + earning
- [ ] Mikey hasn't been pinged on Telegram more than 3 times in the test week (excluding the weekly summary)

---

## EMERGENCY ROLLBACK

If a phase breaks production:
1. `git revert <phase-commit-sha>` on the relevant branch, push
2. Wait for Vercel deploy READY
3. Check `/api/test` returns all green
4. Investigate root cause before re-attempting
5. The OpenClaw config backup at `/root/.openclaw/openclaw.json.bak-2026-04-27` is the pre-fleet-shake-up snapshot if anything in the bot setup needs reverting

If Hawk goes off the rails after Phase 0 briefing:
1. SSH to VPS
2. Check `_archive/` for the pre-pivot voice guides — copy back if needed
3. Restart gateway: `openclaw gateway restart`

---

## SESSION HANDOFF NOTES

When starting a new context window mid-rebrand:
1. Read this doc top to bottom
2. Check the box state — find the next unchecked item
3. Read `bot/sites/tabletopwatch.md` (current pivot direction)
4. Read the OpenClaw skill (current fleet state)
5. Read `MEMORY.md` `project_fleet_2026_04_27.md` (why Hawk is solo Codex)
6. Pick up from the next unchecked phase

When the rebrand is complete:
1. Move this doc to `bot/_archive/REBRAND-PLAN-2026-04-27-COMPLETE.md`
2. Save a memory note: `project_board_game_first_complete.md`
3. Update `MEMORY.md` index
