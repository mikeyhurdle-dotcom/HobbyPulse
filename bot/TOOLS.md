# TOOLS.md — Quick Reference

## Supabase
- **URL:** `https://nspgvdytqsvnmbitbmey.supabase.co`
- **Auth:** Service role key (bypasses RLS). Read REFERENCE.md for table schema.

## Git Repo (for blog posts + code changes)
- **Local clone:** `/root/.openclaw/workspace-pulsebot/hobbypulse/`
- **Remote:** `mikeyhurdle-dotcom/HobbyPulse`
- **Deploy key:** configured, push access enabled
- **Vercel auto-deploys** on push to `main`
- **Blog posts:** write markdown to `content/blog/{vertical}/{slug}.md`, commit, push
- Create feature branches (`hawk/description`), run `npm run build` before pushing

## Vercel Endpoints (auth: Bearer CRON_SECRET)
| Site | Base URL |
|------|----------|
| TabletopWatch | `https://tabletopwatch.com` |
| SimRaceWatch | `https://simracewatch.com` |

Key endpoints: `/api/cron/youtube`, `/api/cron/parse`, `/api/cron/deals?batch=N`, `/api/cron/live`, `/api/cron/price-alerts`, `/api/bot-heartbeat`, `/api/test`

**Deals must use batches:** `?batch=0` through `?batch=N-1` (5 terms each). Response has `totalBatches`.

## Shared Tools (`/root/.openclaw/shared-tools/`)
`browse.py` (web pages), `supabase_query.py`, `github_api.py`, `vercel_check.py`, `vault_edit.py`, `linear_task.py`, `send_email.py`

## Email
- **Resend API** for price alerts: `alerts@tabletopwatch.com`, `alerts@simracewatch.com`

## Secrets
All at `/root/.openclaw/secrets/` — read from disk, never inline.

## Full Reference
Read `REFERENCE.md` for: Supabase table schemas, YouTube/Twitch/eBay API details, scraper architecture, affiliate config, codebase paths, revenue tracking endpoints.
