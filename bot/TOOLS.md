# TOOLS.md — PulseBot API & Integration Reference

## Supabase (Primary Data Store)

- **URL:** `https://nspgvdytqsvnmbitbmey.supabase.co`
- **Region:** eu-west-2 (London)
- **Auth:** Service role key (bypasses RLS for writes)
- **Anon key:** For public reads only

### Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `verticals` | warhammer, simracing | id, slug, name |
| `channels` | YouTube channels to monitor | youtube_channel_id, vertical_id, last_polled_at |
| `battle_reports` | Ingested videos | youtube_video_id, title, description, parsed_at, parse_confidence |
| `content_lists` | Parsed army lists / setups | battle_report_id, category_id, player_name, total_points |
| `list_items` | Units within a list | content_list_id, name, quantity, points |
| `categories` | Factions / sims / hardware types | vertical_id, name, slug, colour, keywords |
| `products` | Canonical purchasable items | vertical_id, name, slug, rrp_pence |
| `listings` | Specific retailer offers | product_id, source, price_pence, condition, affiliate_url |
| `price_history` | Price tracking over time | listing_id, price_pence, recorded_at |
| `live_streams` | Active Twitch/YouTube streams | vertical_id, platform, stream_id, viewer_count, is_live |
| `price_alerts` | User price drop subscriptions | email, product_id, target_price_pence, is_active |
| `newsletter_subscribers` | Email list | email, vertical, subscribed_at |
| `product_name_cache` | Normalisation cache (reduces Haiku calls) | raw_name, normalised_name |

### Common Queries

```
# Get all channels for a vertical
GET /rest/v1/channels?vertical_id=eq.{id}&select=*

# Get unparsed videos
GET /rest/v1/battle_reports?parsed_at=is.null&vertical_id=eq.{id}&order=published_at.desc&limit=20

# Upsert a video (on conflict youtube_video_id)
POST /rest/v1/battle_reports with Prefer: resolution=merge-duplicates

# Get live streams
GET /rest/v1/live_streams?is_live=eq.true&vertical_id=eq.{id}

# Get active price alerts
GET /rest/v1/price_alerts?is_active=eq.true

# Count newsletter subscribers
GET /rest/v1/newsletter_subscribers?select=count&vertical=eq.{slug}

# Insert price history
POST /rest/v1/price_history
```

---

## GitHub (Code Repository)

- **Repo:** `mikeyhurdle-dotcom/HobbyPulse`
- **Clone on VPS:** `/root/.openclaw/workspace-pulsebot/hobbypulse/` (see Git Workflow below)
- **Tool:** `python3 /root/.openclaw/shared-tools/github_api.py`
- **Also:** direct `git` CLI from the cloned repo

### Git Workflow (How to Ship Code)

```bash
# 1. Navigate to repo
cd /root/.openclaw/workspace-pulsebot/hobbypulse/

# 2. Ensure you're on latest main
git checkout main && git pull origin main

# 3. Create feature branch
git checkout -b hawk/descriptive-name

# 4. Make changes (edit files, write code)

# 5. Test the build
npm run build

# 6. Commit and push
git add -A
git commit -m "feat: description of change"
git push origin hawk/descriptive-name

# 7. Create PR (first month — for Mikey review)
python3 /root/.openclaw/shared-tools/github_api.py create-pr \
  --repo mikeyhurdle-dotcom/HobbyPulse \
  --head hawk/descriptive-name \
  --base main \
  --title "feat: description" \
  --body "What and why"

# 8. After first month (trusted) — merge small fixes directly to main
git checkout main && git merge hawk/descriptive-name && git push origin main
```

**Vercel auto-deploys on push to `main`** — both TabletopWatch and SimRaceWatch.

### Verify Deploys

```bash
python3 /root/.openclaw/shared-tools/vercel_check.py list --project hobbypulse
python3 /root/.openclaw/shared-tools/vercel_check.py list --project simracewatch
```

Wait for READY status before reporting changes as live.

---

## Blog Publishing (Filesystem-Based)

Blog posts are markdown files in the git repo. To publish:

1. Write markdown file with YAML frontmatter to `content/blog/{vertical}/{slug}.md`
2. Commit and push (via git workflow above)
3. Vercel redeploys → post is live

### Frontmatter Schema

```yaml
---
title: "Post Title Here"
excerpt: "One-line description for listing page and meta tags"
publishedAt: 2026-04-16
author: TabletopWatch   # or SimRaceWatch
tags:
  - buying-guide
  - space-marines
heroImage: /images/blog/optional-hero.jpg
draft: false   # set true for review, false to publish
---

Markdown content here...
```

### Blog File Naming

- Filename = URL slug: `best-combat-patrols-2026.md` → `/blog/best-combat-patrols-2026`
- Use lowercase kebab-case only
- Keep slugs descriptive for SEO

### Verticals

| Vertical | Directory | Author name |
|----------|-----------|-------------|
| TabletopWatch | `content/blog/warhammer/` | TabletopWatch |
| SimRaceWatch | `content/blog/simracing/` | SimRaceWatch |

---

## Social Media

### Buffer API (Scheduled Posting)

> **Setup required:** Mikey needs to create Buffer account + connect social channels.

- **API endpoint:** `https://api.bufferapp.com/1/`
- **GraphQL endpoint:** For queue management
- **Auth:** API key (will be stored at `/root/.openclaw/secrets/buffer-api-key`)
- **Pattern:** See Sheepy's `buffer_dump_queue.py` and Fox's `fox_content_pipeline_v4.py` for reference

### Direct Twitter/X API (Alternative)

> **Setup required:** Mikey needs to create developer account + app.

- **API v2 endpoint:** `https://api.twitter.com/2/`
- **Auth:** OAuth 2.0 bearer token
- **Keys:** Store at `/root/.openclaw/secrets/twitter-*`

### Social Posting Pattern

```
1. Generate post copy (text + hashtags)
2. Optionally generate brand card image (hawk_brand_card.py)
3. Schedule via Buffer API or post directly via Twitter API
4. Log to Supabase (social_posts table — create if needed)
5. Track engagement (likes, clicks) at next check
```

---

## YouTube Data API v3

- **Base URL:** `https://www.googleapis.com/youtube/v3`
- **Auth:** API key via query param `key=`
- **Daily Quota:** 10,000 units

### Endpoints Used

| Endpoint | Cost | Purpose |
|----------|------|---------|
| `search?part=snippet&channelId={id}&type=video&order=date&publishedAfter={iso}` | 100 units | Find new videos from a channel |
| `videos?part=snippet,contentDetails,statistics&id={ids}` | 1 unit | Get video details (batch up to 50) |
| `search?part=snippet&eventType=live&type=video&q={query}` | 100 units | Find live broadcasts |
| `search?part=snippet&type=channel&q={name}` | 100 units | Find a channel by name |

### Quota Strategy
- Use **RSS feeds** (zero quota) for channel monitoring via `lib/youtube-rss.ts`
- Only use API for video details and live stream searches
- Batch video detail requests (up to 50 IDs per call = 1 unit)

---

## Twitch Helix API

- **Base URL:** `https://api.twitch.tv/helix`
- **Auth:** OAuth client_credentials → Bearer token
- **Token endpoint:** `https://id.twitch.tv/oauth2/token`
- **Rate limit:** 800 req/min (generous)

### Game IDs
- Warhammer 40K: Space Marine 2: `518030`
- iRacing: `28080`
- ACC: `506438`
- F1 24: `2067888735`

---

## eBay Browse API

- **Base URL:** `https://api.ebay.com/buy/browse/v1`
- **Auth:** OAuth client_credentials → Bearer token
- **Marketplace:** `EBAY_GB`
- **Affiliate wrapping:** Append `?mkevt=1&mkcid=1&mkrid=710-53481-19255-0&campid={EBAY_CAMPAIGN_ID}`

---

## Resend Email API

- **Base URL:** `https://api.resend.com`
- **Auth:** Bearer token
- **From addresses:** `alerts@tabletopwatch.com`, `alerts@simracewatch.com`
- **Uses:** Price alert emails, newsletter sends

---

## HobbyPulse Vercel Endpoints

Both sites share the same API. Auth via `Authorization: Bearer {CRON_SECRET}`.

| Site | Base URL |
|------|----------|
| TabletopWatch | `https://tabletopwatch.com` |
| SimRaceWatch | `https://simracewatch.com` |

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/cron/youtube` | GET | Trigger YouTube video ingest |
| `/api/cron/parse` | GET | Trigger content parsing |
| `/api/cron/deals` | GET | Trigger deals scrape (**must use batches**: `?batch=0` through `?batch=N-1`) |
| `/api/cron/live` | GET | Trigger live stream poll |
| `/api/cron/price-alerts` | GET | Trigger price alert check |
| `/api/bot-heartbeat` | POST | Report bot health |
| `/api/build` | POST | Parse army list + find deals |
| `/api/price-alert` | POST | Create a price alert |
| `/api/test` | GET | Run automated test suite (18 checks TW, 16 checks SRW) |
| `/api/newsletter` | POST | Subscribe email to newsletter |

---

## Shared Tools (from /root/.openclaw/shared-tools/)

These are available to all OpenClaw agents including Hawk:

| Tool | Purpose |
|------|---------|
| `browse.py` | Fetch and read web pages (competitor research, trend scanning) |
| `supabase_query.py` | Full Supabase REST wrapper (query any table) |
| `github_api.py` | GitHub API operations (PRs, issues, file reads) |
| `vercel_check.py` | Check Vercel deployment status |
| `vault_edit.py` | Read/write to Stormlight Archive vault |
| `linear_task.py` | Create Linear issues (for tracking work) |
| `brand_card.py` | Generate branded social images (adapt for HobbyPulse palette) |
| `send_email.py` | Send emails via SMTP |

---

## Revenue Tracking Endpoints

### Google AdSense API (Setup Required)

> **Mikey needs to:** Generate AdSense API credentials and store at `/root/.openclaw/secrets/adsense-*`

- **API:** `https://adsense.googleapis.com/v2/`
- **Scopes:** `adsense.readonly`
- **Useful endpoints:** `accounts/{id}/reports:generate` for revenue data

### Google Search Console API (Setup Required)

> **Mikey needs to:** Enable Search Console API and share property access with a service account

- **API:** `https://searchconsole.googleapis.com/`
- **Useful:** Search analytics (queries, clicks, impressions, CTR, position)
- **Properties:** `sc-domain:tabletopwatch.com`, `sc-domain:simracewatch.com`

### Affiliate Dashboards (Manual Until API Access)

| Program | Dashboard | API Available? |
|---------|-----------|---------------|
| eBay Partner Network | partner.ebay.com | Yes (reporting API) |
| Amazon Associates | affiliate-program.amazon.co.uk | Limited (PA-API for products, no revenue API) |
| Element Games | Via ShareASale or direct | Depends on program |
| Others | TBD | TBD |

For now, Mikey will share revenue numbers weekly. Long-term, automate via APIs where possible.

---

## Codebase Key Paths

| Path | What |
|------|------|
| `config/verticals.ts` | Vertical config — brands, themes, channels, retailers (SINGLE SOURCE OF TRUTH) |
| `lib/site.ts` | `getSiteVertical()` + `getSiteBrand()` |
| `lib/scrapers/` | Retailer scrapers (Element, Troll Trader, Shopify generic, Moza, Trak Racer) |
| `lib/scrapers/shopify.ts` | Generic Shopify scraper (reuse for new Shopify retailers) |
| `lib/blog.ts` | Blog post loader (filesystem-based, gray-matter frontmatter) |
| `lib/affiliate.ts` | Affiliate URL wrapping with UTM tracking |
| `lib/normalise.ts` | Product name normalisation (cache → fuzzy → Haiku fallback) |
| `lib/parser.ts` | Content parsing (army lists, setups) via Claude Haiku |
| `lib/setup-parser.ts` | Sim racing content parser (hardware detection, setup extraction) |
| `lib/youtube-rss.ts` | Zero-quota YouTube RSS feed polling |
| `lib/classify.ts` | Video classification heuristics (isBattleReport, isShort) |
| `lib/ebay.ts` | eBay Browse API client with OAuth token caching |
| `lib/gw-rrp.ts` | Static RRP database (~100 products) for savings % |
| `lib/external-lists.ts` | Pastebin army list fetcher |
| `content/blog/warhammer/` | TabletopWatch blog posts |
| `content/blog/simracing/` | SimRaceWatch blog posts |
| `app/(vertical)/` | All page routes |
| `app/api/cron/` | Cron endpoints (youtube, parse, deals, live, price-alerts) |
| `app/api/test/` | Automated test suite |
| `components/` | Shared UI components (shadcn/ui) |
| `scripts/` | Utility scripts (fetch-transcripts.py) |

---

## Environment Variables

### On VPS (auth-profiles.json)

```
YOUTUBE_API_KEY
TWITCH_CLIENT_ID
TWITCH_CLIENT_SECRET
EBAY_APP_ID
EBAY_APP_SECRET
EBAY_CAMPAIGN_ID
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
CRON_SECRET
```

### On Vercel (both projects)

```
NEXT_PUBLIC_SITE_VERTICAL    # "warhammer" or "simracing"
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY            # Claude Haiku for server-side parsing
CRON_SECRET
RESEND_API_KEY
AMAZON_ASSOCIATES_TAG
EBAY_CAMPAIGN_ID
ELEMENT_GAMES_AFFILIATE_REF
# + other affiliate refs as approved
```

---

## Secrets Location (VPS)

All secrets live at `/root/.openclaw/secrets/`. Read from disk, never inline in workspace files.

```
/root/.openclaw/secrets/hobbypulse-cron-secret
/root/.openclaw/secrets/youtube-api-key
/root/.openclaw/secrets/supabase-service-role-key
# + new secrets as added (buffer-api-key, twitter-*, adsense-*, etc.)
```
