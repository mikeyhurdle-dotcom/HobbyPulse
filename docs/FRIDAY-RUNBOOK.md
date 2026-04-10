# HobbyPulse Activation Runbook

**Last updated:** 2026-04-08 after the big autonomous build session
**Goal:** Turn on revenue. Everything is wired. This runbook is pure execution — signup, paste, deploy.

Target time: **~60 min** if eBay Partner Network account already exists. Add ~1 day if you need to wait on affiliate program approvals.

---

## ✅ Already done (do NOT redo)

Since the last version of this runbook, a huge amount landed autonomously:

**Infrastructure & data**
- 6-batch deals cron (all 25 warhammer + 28 sim racing search terms refresh daily)
- Test suite bugs fixed (TW now reports 18/18 honest)
- Category backfill: 668 warhammer + 244 simracing products classified into 85/15 categories
- Video summaries: AI-generated SEO text for every battle report (runs daily via cron)
- PulseBot deployed on OpenClaw VPS (confirmed)

**Revenue surfaces live on both sites**
- `/trending` — top price drops this week (new SEO surface)
- `/deals/c/[category]` — ~60 new indexable landing pages across both sites
- `/channels` + `/channels/[slug]` — 24 creator pages for outreach
- `/armies` + `/armies/[id]` — tournament-winning list collection (warhammer)
- `/releases` — upcoming launch calendar (empty until seeded, see Step 7 below)
- `/contact` — AdSense-friendly contact surface
- Share buttons on every deal + video page
- Army cost badge + "Build this army" deep-link on battle reports
- Autoplay next video with countdown overlay
- Sticky "buy at cheapest" bar on deal detail pages
- Homepage "Dropping Right Now" carousel
- Price drop badges on /deals listings
- Full OG image metadata, JSON-LD everywhere, sitemap (450+ URLs)
- PWA: installable on iOS + Android with home-screen icons

**Analytics**
- Vercel Analytics + Speed Insights live, collecting now
- 5 custom events firing: `affiliate_click`, `newsletter_signup`, `price_alert_created`, `build_calculated`, `search`
- Affiliate click tracking is **delegated** — works on every `<a>` with `utm_medium=affiliate` automatically

**Env vars already set on BOTH projects** (verified 2026-04-08):
- Supabase URL + anon + service role
- CRON_SECRET
- ANTHROPIC_API_KEY
- YOUTUBE_API_KEY
- TWITCH_CLIENT_ID + TWITCH_CLIENT_SECRET
- EBAY_APP_ID + EBAY_APP_SECRET
- AdSense publisher ID + 3 ad slot IDs
- NEXT_PUBLIC_SITE_VERTICAL (simpitstop only — hobbypulse uses default)

---

## 🎯 What's actually left for YOU to do

Ordered by revenue impact. The first 3 are critical path — everything else is nice-to-have.

### 🥇 Priority 1 — Affiliate signups + env vars (critical path)

This is the one session that actually starts earning money.

#### Step 1: eBay Partner Network (10 min, assuming account exists)

1. Log into https://partnernetwork.ebay.com/
2. Create campaign → name: **"TabletopWatch"** → copy numeric Campaign ID
3. Create a second campaign → **"SimRaceWatch"** → copy that Campaign ID (or reuse the first)

```bash
cd /Users/mikey.gilson@tealium.com/StormlightArchive/Projects/Personal/HobbyPulse

# TabletopWatch (hobbypulse project, currently linked)
vercel env add EBAY_CAMPAIGN_ID production
# paste the TW Campaign ID

# SimRaceWatch (switch link)
cd /tmp && mkdir -p vercel-simpit && cd vercel-simpit && vercel link --project simpitstop --yes
vercel env add EBAY_CAMPAIGN_ID production
# paste the SRW Campaign ID

# Back home
cd /Users/mikey.gilson@tealium.com/StormlightArchive/Projects/Personal/HobbyPulse && vercel link --project hobbypulse --yes
```

#### Step 2: Element Games affiliate (10 min)

The biggest Warhammer discounter. Email `affiliate@elementgames.co.uk` if there's no public signup page. Once you have a ref code:

```bash
vercel env add ELEMENT_GAMES_AFFILIATE_REF production
# (applies to TabletopWatch only — SimRaceWatch doesn't sell Warhammer)
```

#### Step 3: Amazon Associates UK (5 min to apply, ~24h to approve)

Apply at https://affiliate-program.amazon.co.uk/. **Amazon usually needs existing traffic** — so submit the application, but don't block on approval. If approved:

```bash
# TabletopWatch
vercel env add AMAZON_ASSOCIATES_TAG production    # e.g. tabletopwatch-21

# SimRaceWatch
cd /tmp/vercel-simpit && vercel link --project simpitstop --yes
vercel env add AMAZON_ASSOCIATES_TAG production    # e.g. simracewatch-21
cd /Users/mikey.gilson@tealium.com/StormlightArchive/Projects/Personal/HobbyPulse && vercel link --project hobbypulse --yes
```

#### Step 4: Fix the Resend gap on hobbypulse (2 min)

`RESEND_API_KEY` is set on simpitstop but not hobbypulse — price alert emails silently fail on TabletopWatch.

```bash
# Pull the key from simpitstop
cd /tmp/vercel-simpit && vercel link --project simpitstop --yes
vercel env pull --environment=production .env.pulled
grep RESEND_API_KEY .env.pulled
# Copy that value

# Add to hobbypulse
cd /Users/mikey.gilson@tealium.com/StormlightArchive/Projects/Personal/HobbyPulse && vercel link --project hobbypulse --yes
vercel env add RESEND_API_KEY production
# paste the value you just grabbed

rm /tmp/vercel-simpit/.env.pulled
```

#### Step 5: Redeploy both sites (5 min)

Env vars don't apply until next deploy.

```bash
# TabletopWatch
cd /Users/mikey.gilson@tealium.com/StormlightArchive/Projects/Personal/HobbyPulse && vercel deploy --prod --yes

# SimRaceWatch
cd /tmp/vercel-simpit && vercel link --project simpitstop --yes && vercel deploy --prod --yes

# Back home
cd /Users/mikey.gilson@tealium.com/StormlightArchive/Projects/Personal/HobbyPulse && vercel link --project hobbypulse --yes
```

#### Step 6: Smoke test (3 min)

```bash
# Tests should still be green
curl -s -H "Authorization: Bearer $(grep CRON_SECRET .env.local | cut -d= -f2 | tr -d '\"')" https://tabletopwatch.com/api/test | python3 -c "import json,sys; print(json.loads(sys.stdin.read())['summary'])"
curl -s -H "Authorization: Bearer $(grep CRON_SECRET .env.local | cut -d= -f2 | tr -d '\"')" https://simracewatch.com/api/test | python3 -c "import json,sys; print(json.loads(sys.stdin.read())['summary'])"
```

**Manual click test:**
1. Open https://tabletopwatch.com/deals
2. Click an eBay card — the destination URL should contain `campid=YOUR_CAMPAIGN_ID`
3. Open https://tabletopwatch.com/trending and click a "Buy at eBay" button — same check
4. Same on https://simracewatch.com/deals

---

### 🥈 Priority 2 — SEO kickoff (10 min, massive passive payoff)

Google won't index your new pages until you tell it they exist. This is the single most impactful non-revenue task.

#### Google Search Console

1. Open https://search.google.com/search-console
2. Add property → **URL prefix** → `https://tabletopwatch.com` → verify via DNS TXT record (copy/paste the TXT record into your domain registrar)
3. Same for `https://simracewatch.com`
4. Once verified, go to **Sitemaps** → paste `https://tabletopwatch.com/sitemap.xml` → Submit
5. Same for simracewatch
6. In **URL Inspection**, paste `/trending`, `/armies`, `/channels` and click "Request Indexing" for each (gives Google a nudge)

#### Bing Webmaster Tools (2 min)

1. Open https://www.bing.com/webmasters
2. Import from Google Search Console (one click) — adds both properties and sitemaps automatically

---

### 🥉 Priority 3 — Seed the releases calendar (5-10 min, OR skip entirely)

The `/releases` page exists but is empty. It shows a helpful empty state, so skipping is fine. If you want it populated for Friday:

```bash
# Set CRON_SECRET in your shell
export CRON_SECRET="$(grep CRON_SECRET .env.local | cut -d= -f2 | tr -d '\"')"

# Example: add the Space Marines 11th Edition Codex (check current GW coming soon page for real data)
curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Space Marines Codex 11th Edition",
    "description": "Updated rules and datasheets for every Space Marines chapter in 11th Edition.",
    "release_date": "2026-06-14",
    "category_slug": "space-marines",
    "retailer": "Element Games",
    "rrp_pence": 3500,
    "pre_order_url": "https://elementgames.co.uk/...",
    "image_url": "https://..."
  }' \
  https://tabletopwatch.com/api/admin/releases
```

Full API: `GET` / `POST` / `PATCH?id=` / `DELETE?id=` at `/api/admin/releases`. All require `Bearer $CRON_SECRET`.

**Pro move:** spend 5 minutes browsing the GW "Coming Soon" page + Fanatec's "New Releases" page, and batch-seed 5-10 items. Each becomes an indexable page with schema.org Product markup.

---

### 🔧 Priority 4 — Nice-to-haves (skip if short on time)

#### GA4 property (only if you want it alongside Vercel Analytics)

Vercel Analytics + our 5 custom events already cover 95% of what you need. GA4 is only worth adding if you want funnel reports Google-style.

```bash
# Create at https://analytics.google.com → copy the G-XXXXXXXXXX id
vercel env add NEXT_PUBLIC_GA4_ID production          # on hobbypulse
# then switch to simpitstop and repeat
```

#### SimRaceWatch-specific affiliate programs

Only worth doing once SRW has proven traffic:
- **Fanatec**: footer → affiliate program → `FANATEC_AFFILIATE_REF`
- **Trak Racer**: Shopify Collabs or email `partnerships@trakracer.com`
- **Moza Racing**: email `affiliate@mozaracing.com`

Each follows the same `vercel env add ... production` pattern.

---

## 📊 Post-activation: weekly 15-minute check-in

Every Sunday evening:

1. **Vercel Analytics dashboard** — top pages, top events, traffic trend
   - https://vercel.com/mikey-hurdles-projects/hobbypulse/analytics
   - https://vercel.com/mikey-hurdles-projects/simpitstop/analytics
2. **Affiliate earnings** — eBay EPN, Element Games, Amazon (once approved)
3. **Vercel deploy health** — any failed deploys? Any cron errors?
4. **Test suite spot check:**
   ```bash
   curl -s -H "Authorization: Bearer $CRON_SECRET" https://tabletopwatch.com/api/test | python3 -c "import json,sys; print(json.loads(sys.stdin.read())['summary'])"
   curl -s -H "Authorization: Bearer $CRON_SECRET" https://simracewatch.com/api/test | python3 -c "import json,sys; print(json.loads(sys.stdin.read())['summary'])"
   ```
5. **PulseBot heartbeat** — `curl https://tabletopwatch.com/api/bot-heartbeat` (GET with the secret if it's still gated)
6. **One action** — based on what you saw, pick the single highest-leverage 10-min task for the week

---

## 🆘 Reference — env vars current state (2026-04-08)

| Env var | hobbypulse (TW) | simpitstop (SRW) | Who sets it |
|---|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | ✅ | ✅ | done |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | ✅ | ✅ | done |
| SUPABASE_SERVICE_ROLE_KEY | ✅ | ✅ | done |
| CRON_SECRET | ✅ | ✅ | done |
| ANTHROPIC_API_KEY | ✅ | ✅ | done |
| YOUTUBE_API_KEY | ✅ | ✅ | done |
| TWITCH_CLIENT_ID / SECRET | ✅ | ✅ | done |
| EBAY_APP_ID / SECRET | ✅ | ✅ | done |
| NEXT_PUBLIC_ADSENSE_PUB_ID + slots | ✅ | ✅ | done (waiting on Google review) |
| RESEND_API_KEY | ❌ | ✅ | **YOU — Step 4** |
| EBAY_CAMPAIGN_ID | ❌ | ❌ | **YOU — Step 1** |
| ELEMENT_GAMES_AFFILIATE_REF | ❌ | n/a | **YOU — Step 2** |
| AMAZON_ASSOCIATES_TAG | ❌ | ❌ | **YOU — Step 3** |
| NEXT_PUBLIC_GA4_ID | ❌ | ❌ | optional |
| FANATEC_AFFILIATE_REF | n/a | ❌ | optional, later |
| TRAK_RACER_REF | n/a | ❌ | optional, later |
| MOZA_AFFILIATE_REF | n/a | ❌ | optional, later |

Note: NEXT_PUBLIC_SITE_VERTICAL is set explicitly on simpitstop but not hobbypulse. Hobbypulse picks warhammer via default — no action needed unless you notice weirdness.
