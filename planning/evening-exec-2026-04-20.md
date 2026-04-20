# Evening Execution Report Notes (2026-04-20)

## SEO hygiene checks
- `/miniatures/*` route references are confined to miniatures nav/home/sitemap code paths.
- No boardgames markdown internal links were found pointing to `/miniatures/*`.
- Sitemap currently includes boardgames section roots + article detail pages (`reviews`, `best`, `versus`, `how-to-play`) + tools pages and game detail routes.

## Affiliate readiness checks
- New queue-generated boardgame drafts include frontmatter placeholders:
  - `amazonAsin`
  - `zatuUrl`
  - `waylandUrl`
- Where-to-Buy sections are present in generated drafts.
- Buy link component sends outbound tracking via `trackAffiliateClick(...)` and wraps URLs with affiliate + UTM parameters.

## Cron tuning
- Added `/api/cron/board-game-content` schedule in `vercel.json`.
- SimRace cron blueprint captured in `planning/simrace/simracewatch-cron-blueprint.json` with actionable-only alerts policy.
