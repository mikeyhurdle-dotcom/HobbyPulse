# Tycho — Vercel cron heartbeat setup

This branch instruments every HobbyPulse Vercel cron route with Tycho heartbeats so the dashboard at `http://tycho-vps:8083` shows real ingestion activity (and missed-cycle alerts) for each scheduled function.

## What changed in this branch

1. **`lib/tycho.ts`** — heartbeat helper exporting `tychoHeartbeat(uuid, handler)` which wraps an async function with start + finish pings.
2. **`app/api/cron/*/route.ts`** — 8 route files now call `tychoHeartbeat(...)` around their existing handler body. Auth guards stay outside the wrap so unauthenticated requests don't waste a heartbeat.
3. **`.github/workflows/tycho-watchdog.yml`** — every-5-min off-VPS check that curls Tycho's `/healthz` via the Tailscale Funnel and fails the workflow (→ default GitHub email-on-failure to repo owner) if Tycho is down.

## What you need to do after merging

### 1. Add 17 environment variables to the HobbyPulse Vercel project

Each Vercel cron job has its own Tycho UUID. Set these on:

> **Vercel dashboard → hobbypulse project → Settings → Environment Variables → "Add New"**

Paste each value into "Value" and the corresponding key into "Key". Set environment to **"Production"** (other environments don't run the cron schedule). Save each. Then redeploy main once so the new env vars are picked up.

```
TYCHO_UUID_YOUTUBE_INGEST=9ce561d7c1d047d1a8b4bd098de8c067
TYCHO_UUID_PARSE_CONTENT=9e213526f4764412b386e79b61159cab
TYCHO_UUID_TRANSCRIPTS=5bf8df77c7c541b48380f023e2089492
TYCHO_UUID_DEALS_BATCH_0=2cc05096e3dc4bcfafb8408b16d3ff85
TYCHO_UUID_DEALS_BATCH_1=d3971f68fbd04da197900c1d524851ac
TYCHO_UUID_DEALS_BATCH_2=8278eb13bf5246738fd884a88317ba71
TYCHO_UUID_DEALS_BATCH_3=11e6d2d75b6f47dfbe9b6131cf3e2cd3
TYCHO_UUID_DEALS_BATCH_4=e668d8f3dae64ee49efbb9043ea10bc7
TYCHO_UUID_DEALS_BATCH_5=af11f5e0967d44dd8b83b5a8eafbc877
TYCHO_UUID_DEALS_BATCH_6=09b40776819b4fafb62be3558c4dee21
TYCHO_UUID_DEALS_BATCH_7=240cf94688174e42bc65d98693bfdad7
TYCHO_UUID_DEALS_BATCH_8=9c75ac2a63774aaf925823e7c85906ed
TYCHO_UUID_LIVE_FALLBACK=47c56cc74b0d490382fcfa3b2c3c2d50
TYCHO_UUID_PRICE_ALERTS_AM=2243c0a4fd754965856f39ed87088e2f
TYCHO_UUID_PRICE_ALERTS_PM=6552411bc1a14cc8ae8db6e25978fd05
TYCHO_UUID_DISCOVER=06bd4b162a804490b0b3c15d6268d960
TYCHO_UUID_BOARD_GAME_CONTENT=30447f6f504448dbb242e5542ec2f821
```

(The UUIDs are not secret — they're effectively public ids that grant write access only to the corresponding Tycho job's heartbeat surface. Keeping them as env vars is for cleanliness, not security.)

### 2. Verify the cron heartbeats land

After the next scheduled fire of any cron (within an hour), open `http://tycho-vps:8083/project/HobbyPulse` and confirm sparklines populate on the Vercel cron cards.

For an immediate test: **manually trigger** any cron from Vercel dashboard → Functions → cron, or curl with the CRON_SECRET. A heartbeat should land within seconds of the response.

### 3. Confirm the GitHub Actions watchdog ran

Open **GitHub → Actions → "Tycho watchdog"**. The first run fires at the next 5-min boundary after this branch merges. Each run should be ~5 sec, exit 0. If it fails, you'll get a GitHub email — that's the watchdog working.

## Per-route Tycho UUID mapping

| Route | Schedule (UTC) | Tycho UUID env var | Notes |
|---|---|---|---|
| `/api/cron/youtube` | `0 6 * * *` | `TYCHO_UUID_YOUTUBE_INGEST` | |
| `/api/cron/parse` | `0 7 * * *` | `TYCHO_UUID_PARSE_CONTENT` | |
| `/api/cron/transcripts` | `30 7 * * *` | `TYCHO_UUID_TRANSCRIPTS` | |
| `/api/cron/deals?batch=N` | `(0,3,6,9,12,15,18,21,24) 2 * * *` | `TYCHO_UUID_DEALS_BATCH_<N>` | Route reads `?batch` query param to pick which UUID to ping |
| `/api/cron/live` | `0 12 * * *` | `TYCHO_UUID_LIVE_FALLBACK` | The Vercel daily-noon fallback. The 5-min Twitch + hourly YouTube live-pollers run from VPS crontab and use different UUIDs. |
| `/api/cron/price-alerts` | `0 8 * * *` and `0 18 * * *` | `TYCHO_UUID_PRICE_ALERTS_AM` / `_PM` | Route picks AM or PM based on UTC hour at request time. |
| `/api/cron/discover` | `0 8 * * 0` | `TYCHO_UUID_DISCOVER` | Sunday-only. |
| `/api/cron/board-game-content` | `15 6 * * *` | `TYCHO_UUID_BOARD_GAME_CONTENT` | |

Routes NOT in this branch's wrap because they're not scheduled by Vercel cron:

- `/api/cron/kickstarter` — fired by `hawk-kickstarter-sync` OpenClaw cron via curl from the VPS; already heartbeat-instrumented at the OpenClaw cron payload layer
- `/api/cron/board-game-youtube`, `/api/cron/board-game-import` — not in `vercel.json`'s cron schedule, appear to be on-demand routes

## Rollback

If anything in this branch goes wrong post-merge, revert the merge commit. The Vercel cron functions return to their pre-branch behaviour. Tycho keeps running fine — the heartbeats just stop landing for the 17 Vercel jobs (everything else continues unchanged).
