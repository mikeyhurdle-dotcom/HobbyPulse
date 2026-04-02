---
type: reference
project: HobbyPulse
created: 2026-03-30
aliases:
  - PulseBot
  - Hawk
---

# PulseBot (Hawk 🦅)

The autonomous data engine behind HobbyPulse. Manages both TabletopWatch and SimRaceWatch from a single bot on the OpenClaw VPS.

## Quick Reference

| Field | Value |
|-------|-------|
| Codename | Hawk 🦅 |
| Platform | OpenClaw (Telegram) |
| Telegram | @Hobbypulsebot |
| VPS | 77.42.20.44 |
| Workspace | `/root/.openclaw/workspace-pulsebot/` |
| Primary Model | `google/gemini-2.5-flash` |
| Fallback 1 | `groq/llama-3.3-70b-versatile` |
| Fallback 2 | `openrouter/qwen/qwen3-235b-a22b-2507` |
| Deployed | 2026-03-30 |

## What It Does

| Task | Frequency | Description |
|------|-----------|-------------|
| YouTube ingest | Every 2 hours | Poll 25 channels across both verticals for new videos |
| Content parsing | After ingest | AI-powered extraction of army lists (tabletop) and car setups (sim racing) |
| Deals scraping | Every 6 hours | Scrape 8+ retailers, detect price drops >10% |
| Live stream poll | Every 5 minutes | Twitch + YouTube live stream aggregation |
| Price alerts | Twice daily | Check user price targets, send Resend email notifications |
| Daily digest | 9am | Telegram report to Mikey — videos, deals, price drops, errors |
| Weekly SEO content | Monday 7am | Generate blog posts from trending content |
| Channel discovery | Sunday 8am | Find new YouTube channels to monitor |
| Health check | Every 30 min | Heartbeat to both Vercel dashboards |

## Intelligence (vs dumb crons)

- **Video triage** — skips painting tutorials, unboxings, vlogs. Only parses battle reports and reviews.
- **Deal detection** — tracks price trends, flags products trending downward, alerts on suspiciously low prices.
- **Content opportunities** — flags videos with >10K views in 24hr, identifies meta trends when multiple creators cover the same faction.
- **Channel discovery** — searches YouTube for new relevant channels weekly.

## Relationship to SMASHD Bots

PulseBot is completely independent from the SMASHD bot ecosystem. It runs on the same VPS and OpenClaw gateway but has no communication with SmashdBot, ScoutBot, or any other SMASHD agent.

## Files

| File | Purpose |
|------|---------|
| `SOUL.md` | Personality, schedule, intelligence rules, reporting format |
| `TOOLS.md` | Full API reference — endpoints, tables, auth |
| `IDENTITY.md` | Bot identity card |
| `MEMORY.md` | Session persistence — updated every session |
| `VPS-SETUP.md` | Deployment guide for OpenClaw |

## Maintenance

```bash
# SSH into VPS
ssh -i ~/.ssh/vps_openclaw root@77.42.20.44

# Edit personality (no restart needed)
nano /root/.openclaw/workspace-pulsebot/SOUL.md

# Check gateway health
openclaw gateway health

# View logs
tail -f /tmp/openclaw/openclaw-$(date +%Y-%m-%d).log

# Restart gateway (only after openclaw.json changes)
openclaw gateway start
```

---

*Created 2026-03-30 during the HobbyPulse build session.*
