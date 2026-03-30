# HobbyPulse — Manual Actions Required

Things Claude can't do for you. Check these off as you go.

## Architecture Decision

- **Tabletop games** (40K, AoS, Kill Team, etc.) = ONE deployment, shared domain (brand TBD — "TabletopWatch" or similar)
- **Sim Racing** = SEPARATE deployment as SimPitStop (simpitstop.com)
- Each deploy uses `NEXT_PUBLIC_SITE_VERTICAL` env var to select config
- Brand name for tabletop site needs workshopping — avoid using "Warhammer" in the name

## API Keys & Env Vars (set in Vercel)

### Required for core functionality
- [ ] `YOUTUBE_API_KEY` — Google Cloud Console → YouTube Data API v3. Newt Bot may already have one for Paddle Live — reuse or create a new key in the same GCP project
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — Supabase dashboard → Settings → API → service_role key (the secret one, NOT anon)
- [ ] `ANTHROPIC_API_KEY` — console.anthropic.com → API Keys. Used by Haiku for army list parsing + product normalisation + Build My Army Cheap
- [ ] `CRON_SECRET` — any random string (e.g. `openssl rand -hex 32`). Protects all cron endpoints

### Required for deals & live
- [ ] `EBAY_APP_ID` — eBay Developer Program → Application Keys → Production App ID
- [ ] `EBAY_APP_SECRET` — same place, Production Cert ID (secret)
- [ ] `EBAY_CAMPAIGN_ID` — eBay Partner Network → Campaigns → your campaign ID
- [ ] `TWITCH_CLIENT_ID` — Twitch Developer Console → Register App → Client ID
- [ ] `TWITCH_CLIENT_SECRET` — same place, Client Secret

### Monetisation (all optional — features gracefully degrade)
- [ ] `NEXT_PUBLIC_ADSENSE_PUB_ID` — apply at adsense.google.com (needs live site with content first)
- [ ] `NEXT_PUBLIC_AD_SLOT_SIDEBAR` — AdSense ad unit ID for sidebar (300x250)
- [ ] `NEXT_PUBLIC_AD_SLOT_BETWEEN` — AdSense ad unit ID for between-content (728x90)
- [ ] `NEXT_PUBLIC_AD_SLOT_MOBILE` — AdSense ad unit ID for mobile footer (320x50)
- [ ] `ELEMENT_GAMES_AFFILIATE_REF` — sign up at Element Games affiliate programme
- [ ] `WAYLAND_GAMES_AFFILIATE_REF` — sign up at Wayland Games affiliate programme
- [ ] `AMAZON_ASSOCIATES_TAG` — associates.amazon.co.uk
- [ ] `RESEND_API_KEY` — resend.com (free tier: 100 emails/day) — for price alerts

## Affiliate Programme Sign-ups

- [ ] **eBay Partner Network** — partnernetwork.ebay.co.uk
- [ ] **Element Games** — apply on their site
- [ ] **Wayland Games** — apply on their site
- [ ] **Amazon Associates** — associates.amazon.co.uk
- [ ] **Google AdSense** — adsense.google.com (needs live content first)
- [ ] **Fanatec** — check for affiliate programme (for SimPitStop)
- [ ] **Digital Motorsport** — check for affiliate programme

## One-Time Setup Tasks

- [ ] **Run Supabase migration** — apply `supabase/migrations/003_price_alerts.sql` to create price_alerts table
- [ ] **Seed YouTube channels** — POST `/api/seed-channels` with `Authorization: Bearer <CRON_SECRET>`
- [ ] **Trigger first YouTube poll** — GET `/api/cron/youtube` with same auth
- [ ] **Trigger first parse** — GET `/api/cron/parse` after videos ingested
- [ ] **Trigger first deals scrape** — GET `/api/cron/deals`
- [ ] **Buy domain(s)** — tabletopwatch.com (or final brand), simpitstop.com
- [ ] **Create second Vercel project** for SimPitStop (same repo, `NEXT_PUBLIC_SITE_VERTICAL=simracing`)

## Brand Workshopping (parked)

Tabletop site name candidates — needs to be:
- Not trademark-infringing (no "Warhammer", "Games Workshop", "Citadel")
- SEO-friendly for tabletop gaming
- Broad enough for 40K + AoS + Kill Team + other games
- Options to explore: TabletopWatch, MiniWatch, WarTableTop, PaintedDice, HobbyForge, etc.

## Duplicate Linear Issues (cleaned up)

- [x] PLA-346 — marked as Duplicate
- [x] PLA-348 — marked as Duplicate
