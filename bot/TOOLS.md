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

# Insert price history
POST /rest/v1/price_history
```

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
- 11 tabletop channels × 100 units = 1,100 per poll
- 14 sim racing channels × 100 units = 1,400 per poll
- Video details batched = ~50 units per poll
- Total per poll: ~2,550 units
- 4 polls/day = ~10,200 — tight on free tier
- **Optimisation:** Use RSS feeds (no quota) for channel monitoring, only use API for video details

## Twitch Helix API

- **Base URL:** `https://api.twitch.tv/helix`
- **Auth:** OAuth client_credentials → Bearer token
- **Token endpoint:** `https://id.twitch.tv/oauth2/token`
- **Rate limit:** 800 req/min (generous)

### Endpoints

| Endpoint | Purpose |
|----------|---------|
| `streams?game_id={ids}` | Get live streams for game categories |
| `games?name={name}` | Resolve game name to ID |

### Game IDs
- iRacing: `28080`
- ACC: `506438`
- F1 24: `2067888735`
- Space Marine 2: `518030`

## eBay Browse API

- **Base URL:** `https://api.ebay.com/buy/browse/v1`
- **Auth:** OAuth client_credentials → Bearer token
- **Token endpoint:** `https://api.ebay.com/identity/v1/oauth2/token`
- **Marketplace:** `EBAY_GB`

### Endpoints

| Endpoint | Purpose |
|----------|---------|
| `item_summary/search?q={query}&filter=buyingOptions:{FIXED_PRICE}` | Search products |

### Affiliate URL Wrapping
Append `?mkevt=1&mkcid=1&mkrid=710-53481-19255-0&campid={EBAY_CAMPAIGN_ID}` to item URLs.

## Retailer Scrapers

All use HTTP GET + HTML parsing (cheerio-style).

| Retailer | Search URL Pattern | Selector Notes |
|----------|-------------------|----------------|
| Element Games | `https://elementgames.co.uk/catalogsearch/result/?q={query}` | `.product-item` cards, Magento layout |
| Wayland Games | `https://www.waylandgames.co.uk/search?s={query}` | `.product-miniature` cards |
| Troll Trader | `https://thetrolltrader.com/search?q={query}` | `.product-card` cards, Shopify layout |
| Fanatec | `https://fanatec.com/eu-en/search?sSearch={query}` | Product listing |
| Sim-Lab | `https://sim-lab.eu/search?q={query}` | Shopify layout |

## Resend Email API

- **Base URL:** `https://api.resend.com`
- **Auth:** Bearer token
- **Endpoint:** `POST /emails`
- **From:** `alerts@tabletopwatch.com` or `alerts@simpitstop.com`

```json
{
  "from": "PulseBot <alerts@tabletopwatch.com>",
  "to": ["user@example.com"],
  "subject": "Price Drop Alert: Combat Patrol Tyranids",
  "html": "<html>..."
}
```

## HobbyPulse Vercel Endpoints

Both sites have the same API endpoints. Auth via `Authorization: Bearer {CRON_SECRET}`.

| Site | Base URL |
|------|----------|
| TabletopWatch | `https://hobbypulse.vercel.app` |
| SimPitStop | `https://simpitstop.vercel.app` |

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/cron/youtube` | GET | Trigger YouTube video ingest |
| `/api/cron/parse` | GET | Trigger content parsing |
| `/api/cron/deals` | GET | Trigger deals scrape |
| `/api/cron/live` | GET | Trigger live stream poll |
| `/api/cron/price-alerts` | GET | Trigger price alert check |
| `/api/seed-channels` | POST | One-time channel seeding |
| `/api/bot-heartbeat` | POST | Report bot health |
| `/api/build` | POST | Parse army list + find deals |
| `/api/price-alert` | POST | Create a price alert |

## Environment Variables (in auth-profiles.json)

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
TABLETOP_BASE_URL
SIMPITSTOP_BASE_URL
```
