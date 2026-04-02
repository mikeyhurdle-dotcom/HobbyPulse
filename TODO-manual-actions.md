# HobbyPulse — Manual Actions Required

Updated 2026-03-31. Check these off as you go.

## Architecture

- **HobbyPulse** = parent entity owning all vertical sites
- **TabletopWatch** (tabletopwatch.com) — tabletop gaming (40K, AoS, Old World, Kill Team)
- **SimRaceWatch** (simracewatch.com) — sim racing
- Same codebase, same Supabase DB, different Vercel projects
- **PulseBot** (Hawk 🦅) on OpenClaw VPS — autonomous data engine

## API Keys — Current Status

### Connected and Working
- [x] `YOUTUBE_API_KEY` — Own GCP project "HobbyPulse", fresh 10K quota
- [x] `SUPABASE_SERVICE_ROLE_KEY` — Both projects
- [x] `CRON_SECRET` — Both projects
- [x] `ANTHROPIC_API_KEY` — HobbyPulse workspace, Haiku parsing working
- [x] `TWITCH_CLIENT_ID` + `TWITCH_CLIENT_SECRET` — Both projects, 14 streams found

### Pending
- [ ] `EBAY_APP_ID` + `EBAY_APP_SECRET` — Developer account pending approval (~1 business day). Check developer.ebay.com
- [ ] `EBAY_CAMPAIGN_ID` — Sign up at partnernetwork.ebay.co.uk once dev account approved
- [ ] `SUPADATA_API_KEY` — Sign up at supadata.ai for automated transcript fetching (~$0.50/month). Eliminates manual transcript script. (TEA-95)

### Optional (features gracefully degrade)
- [ ] `NEXT_PUBLIC_ADSENSE_PUB_ID` + ad slot IDs — Apply at adsense.google.com (needs custom domain)
- [ ] `ELEMENT_GAMES_AFFILIATE_REF` — Apply at Element Games
- [ ] `WAYLAND_GAMES_AFFILIATE_REF` — Apply at Wayland Games
- [ ] `AMAZON_ASSOCIATES_TAG` — associates.amazon.co.uk
- [ ] `RESEND_API_KEY` — resend.com (free 100/day) for price alerts
- [ ] `NEXT_PUBLIC_GA4_ID` — Google Analytics
- [ ] `NEXT_PUBLIC_POSTHOG_KEY` — PostHog analytics

## Domains to Buy
- [ ] **tabletopwatch.com** — confirmed available 2026-03-31
- [ ] **simracewatch.com** — confirmed available 2026-03-31
- [ ] Configure custom domains in Vercel once purchased

## Affiliate Programme Sign-ups
- [ ] eBay Partner Network (partnernetwork.ebay.co.uk)
- [ ] Element Games affiliate
- [ ] Wayland Games affiliate
- [ ] Amazon Associates (associates.amazon.co.uk)
- [ ] Fanatec (for SimRaceWatch — check if programme exists)
- [ ] Google AdSense (needs custom domain + content)

## One-Time Setup Tasks
- [x] Seed tabletop YouTube channels (10 channels, 161 videos)
- [x] Seed sim racing YouTube channels (14 channels, 199 videos)
- [x] Trigger first YouTube poll (working — RSS-based)
- [x] Trigger first parse — 19 army lists, 215 units, 5 winners
- [x] Seed sim racing products (68 products across 16 manufacturers)
- [x] Seed AoS/Old World/Kill Team factions (49 factions)
- [x] Seed sim racing categories (15 categories)
- [x] Deploy PulseBot to VPS (@Hobbypulsebot paired)
- [ ] Apply price_alerts migration (supabase/migrations/003_price_alerts.sql) — already applied
- [ ] Run transcript fetcher periodically: `python3 scripts/fetch-transcripts.py` (until Supadata is set up)
- [ ] Trigger first deals scrape (needs eBay API keys)
- [ ] Re-seed "Art of War 40k" channel (removed wrong channel, correct one not yet added)

## Future Data Sources to Integrate
- [ ] **Faction win rates** — scrape Stat Check / 40KStats / The Honest Wargamer for tournament win rates. Placeholder UI built (FactionMeta component). (TEA to be created)
- [ ] **Pastebin/external links** — some channels (Tabletop Titans) post army lists on Pastebin. Future enhancement to follow those links.

## Linear Backlog Summary
- TEA-79: Evaluate Beauty/Skincare (Low — parked)
- TEA-80: Complete API keys & affiliate sign-ups (High)
- TEA-84: Add more tabletop games — AoS, KT done, 30K/OPR next (Low)
- TEA-85: Pillar blog content for SEO (Low)
- TEA-87: Apply for Google AdSense (Medium — needs domain)
- TEA-95: Replace transcript script with Supadata API (High)
