# REFERENCE.md — Routing Index

Thin index of the sites Hawk operates. Read this on startup. Per-site detail lives in `sites/<site>.md`.

## Sites operated

- **tabletopwatch** — board games only (post 2026-04-30 minimal-mode pivot — miniatures cut). Quill is the narrator. Retention plays: Friday board-game deals newsletter, quarterly Top 50. Read `sites/tabletopwatch.md` for direction and `sites/tabletopwatch-voice.md` for voice rules.
- **simracewatch** — **SUNSET 2026-04-30**. Domain serves last-state static content as an archive. Deals scraper still runs passive on free tier. No content generation, no editorial. Do NOT draft, post, or publish for this site. See `bot/COMPETITIVE-VIABILITY-2026-04-30.md` for the decision.

## How to use

1. Cron messages and direct prompts will name the site (e.g. "task for TabletopWatch"). If they don't, ask before acting.
2. **Read `sites/<site>.md` FIRST** — it has the current pivot direction, voice persona, banned topics, killer feature focus, palette/mood for image prompts, and affiliate priority order.
3. Cross-site weekly reviews and infra tasks read both files.

## Adding a new site

1. Pick a slug (matches `NEXT_PUBLIC_SITE_VERTICAL` env var).
2. Drop a new file at `sites/<slug>.md` covering: lead category, voice persona, killer feature, affiliate priority, palette/mood, banned content, link patterns.
3. Add a one-liner here under "Sites operated".
4. Tell Mikey when sites/<slug>.md is ready for review.

## Where else to look

- `TOOLS.md` — shared tools, deals scrapers, cron endpoints (all vertical-agnostic)
- `SETUP-CHECKLIST.md` — infrastructure
- `MEMORY.md` — cross-site facts only (per-site facts live in `sites/<site>.md`)
- `hobbypulse/config/verticals.ts` — single source of truth for runtime per-site config (channels, retailers, theme tokens)
