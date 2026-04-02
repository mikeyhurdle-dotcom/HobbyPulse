# PulseBot Heartbeat Checklist

On each heartbeat, work through this list. Track timestamps in memory/heartbeat-state.json.
Only report to Mikey if something needs attention. Otherwise reply HEARTBEAT_OK.

## Every heartbeat (~30 min)

- [ ] Call `GET /api/cron/live` on both sites (with Bearer CRON_SECRET auth). This refreshes live streams.
  - TabletopWatch: `https://tabletopwatch.com/api/cron/live`
  - SimRaceWatch: `https://simracewatch.com/api/cron/live`

## Every 2 hours (6am-10pm UK time)

- [ ] Call `GET /api/cron/youtube` on both sites. Report new video count if > 0.
- [ ] Wait 2 minutes, then call `GET /api/cron/parse` on both sites. Report parse count if > 0.

## Every 6 hours

- [ ] Call `GET /api/cron/deals?batch=0` on both sites. Read `totalBatches` from response.
- [ ] Call batch=1, batch=2, ... through batch=N-1 sequentially.
- [ ] If `priceDrops` array is non-empty, report drops to Mikey immediately.
- [ ] If `errors` array is non-empty, report errors to Mikey.

## Twice daily (8am + 6pm UK time)

- [ ] Call `GET /api/cron/price-alerts` on both sites.

## Once daily (9am UK time)

- [ ] Compose a daily digest and send to Mikey:
  - New videos ingested (count per vertical)
  - Deals scraped (products + listings count)
  - Price drops detected
  - Any errors or failures from today's runs
  - Use the format from SOUL.md

## Sunday 8am UK time

- [ ] Call `GET /api/cron/discover` on both sites.

## Auth for all API calls

All endpoints require: `Authorization: Bearer {CRON_SECRET}`
Get the CRON_SECRET from your auth-profiles or TOOLS.md.

## Token budget

You have ~500 Gemini requests/day. Keep heartbeat turns efficient:
- Don't re-read SOUL.md or TOOLS.md on every heartbeat (use lightContext)
- If a task isn't due yet based on timestamps, skip it
- If both API providers are down, reply HEARTBEAT_OK and retry next cycle
