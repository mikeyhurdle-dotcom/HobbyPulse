# PulseBot Memory (cross-site only)

Per-site facts (channels, pillars, affiliate priorities, voice) live in `sites/<site>.md`. This file is cross-site and infrastructure only.

## Mission

Autonomous business operator for the HobbyPulse network. Job: make every site profitable through content, social, deals curation, code, and revenue tracking. Network target: £500/month combined.

## Network facts

- Project launched: 2026-03-30
- **Role upgraded watchdog → business operator: 2026-04-16**
- **Board-game-first pivot for tabletopwatch: 2026-04-27** (see `sites/tabletopwatch.md`)
- **Fleet shake-up 2026-04-27:** Hoid retired, Sheepy demoted to Gemini, Hawk is sole Codex Pro consumer
- Sites operated: see `REFERENCE.md`. Add new sites by dropping a `sites/<slug>.md` file.
- Same codebase, same Supabase DB, separate Vercel projects per site
- Supabase project: nspgvdytqsvnmbitbmey (eu-west-2 London)
- GitHub repo: mikeyhurdle-dotcom/HobbyPulse
- Blog: filesystem markdown in `content/blog/{vertical}/`
- Revenue model: affiliate + AdSense + email newsletter

## Cross-site scraper status

| Source | Status | Used by |
|--------|--------|---------|
| Element Games | Working | tabletopwatch |
| Troll Trader (Shopify) | Working | tabletopwatch |
| Moza Racing (Shopify) | Working | simracewatch |
| Trak Racer (Shopify) | Working | simracewatch |
| eBay Browse API | Working | both |
| Wayland Games | Disabled (Cloudflare 403) | tabletopwatch |

## Cross-site affiliate status

| Program | Status | Env Var |
|---------|--------|---------|
| eBay Partner Network | Active | EBAY_CAMPAIGN_ID |
| Amazon Associates | Active | AMAZON_ASSOCIATES_TAG |

Per-site affiliate priority order lives in `sites/<site>.md`. Pending applications are tracked there.

## Network revenue baseline (2026-04-16)

- Monthly page views: ~0 (sites are new)
- Affiliate revenue: £0
- AdSense: under review (both sites verified)
- Newsletter subscribers: 0

## Approval gates (first month)

- Blog posts: Draft → PR → Mikey approves → merge
- Code changes: Branch → PR → Mikey approves → merge
- Social posts: auto-publish, weekly quality review
- After trust established: merge small fixes directly, publish blog posts directly

## Open infra items

- AdSense under Google review — no ad revenue until approved
- Social media accounts not yet created — Buffer setup pending
- Revenue tracking APIs not configured (AdSense API, Search Console)
- Codex reauth ritual: every Monday 09:00 London (`hawk-codex-reauth-reminder` cron)
