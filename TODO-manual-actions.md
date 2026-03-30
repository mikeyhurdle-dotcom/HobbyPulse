# HobbyPulse — Manual Actions Required

Things Claude can't do for you. Check these off as you go.

## API Keys & Env Vars (set in Vercel)

- [ ] `YOUTUBE_API_KEY` — Google Cloud Console → YouTube Data API v3. Newt Bot may already have one for Paddle Live — reuse or create a new key in the same GCP project
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — Supabase dashboard → Settings → API → service_role key (the secret one, NOT anon)
- [ ] `ANTHROPIC_API_KEY` — console.anthropic.com → API Keys. Used by Haiku for army list parsing + product normalisation
- [ ] `CRON_SECRET` — any random string (e.g. `openssl rand -hex 32`). Protects all cron endpoints
- [ ] `EBAY_APP_ID` — eBay Developer Program → Application Keys → Production App ID
- [ ] `EBAY_APP_SECRET` — same place, Production Cert ID (secret)
- [ ] `EBAY_CAMPAIGN_ID` — eBay Partner Network → Campaigns → your campaign ID

## Optional Affiliate Env Vars

- [ ] `ELEMENT_GAMES_AFFILIATE_REF` — sign up at Element Games affiliate programme
- [ ] `WAYLAND_GAMES_AFFILIATE_REF` — sign up at Wayland Games affiliate programme

## One-Time Setup Tasks

- [ ] **Seed YouTube channels** — once `YOUTUBE_API_KEY` + `SUPABASE_SERVICE_ROLE_KEY` + `CRON_SECRET` are set, hit `POST /api/seed-channels` with header `Authorization: Bearer <CRON_SECRET>` to populate the 11 Warhammer channels
- [ ] **Trigger first YouTube poll** — hit `GET /api/cron/youtube` with same auth header, or wait for the 6hr cron
- [ ] **Trigger first parse** — hit `GET /api/cron/parse` with same auth header after videos are ingested
- [ ] **Trigger first deals scrape** — hit `GET /api/cron/deals` with same auth header
- [ ] **Custom domain** — buy a domain and configure in Vercel when ready

## Duplicate Linear Issues (cleaned up)

- [x] PLA-346 — marked as Duplicate
- [x] PLA-348 — marked as Duplicate

## Twitch API (needed for Phase 3)

- [ ] `TWITCH_CLIENT_ID` — Twitch Developer Console → Register App → Client ID
- [ ] `TWITCH_CLIENT_SECRET` — same place, Client Secret
