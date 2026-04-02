# PulseBot — VPS Deployment Guide

## Prerequisites

- SSH access to OpenClaw VPS: `ssh -i ~/.ssh/vps_openclaw root@77.42.20.44`
- Telegram bot token from @BotFather (create @HobbyPulseBot)
- API keys configured (see TOOLS.md)

## Step 1: Create Workspace

```bash
ssh -i ~/.ssh/vps_openclaw root@77.42.20.44

mkdir -p /root/.openclaw/workspace-pulsebot
```

## Step 2: Upload Workspace Files

From your local machine:

```bash
scp -i ~/.ssh/vps_openclaw \
  bot/SOUL.md bot/TOOLS.md bot/IDENTITY.md bot/MEMORY.md \
  root@77.42.20.44:/root/.openclaw/workspace-pulsebot/
```

## Step 3: Register Bot in OpenClaw Config

Edit `/root/.openclaw/openclaw.json` and add PulseBot to the agents array:

```json
{
  "id": "pulsebot",
  "name": "PulseBot",
  "telegram_bot_token": "<token from BotFather>",
  "workspace": "/root/.openclaw/workspace-pulsebot/",
  "model": "google/gemini-2.5-flash",
  "fallback_models": [
    "groq/llama-3.3-70b-versatile"
  ]
}
```

## Step 4: Configure API Keys

Create `/root/.openclaw/agents/pulsebot/agent/auth-profiles.json`:

```json
{
  "youtube": {
    "api_key": "<YOUTUBE_API_KEY>"
  },
  "twitch": {
    "client_id": "<TWITCH_CLIENT_ID>",
    "client_secret": "<TWITCH_CLIENT_SECRET>"
  },
  "ebay": {
    "app_id": "<EBAY_APP_ID>",
    "app_secret": "<EBAY_APP_SECRET>",
    "campaign_id": "<EBAY_CAMPAIGN_ID>"
  },
  "supabase": {
    "url": "https://nspgvdytqsvnmbitbmey.supabase.co",
    "service_role_key": "<SUPABASE_SERVICE_ROLE_KEY>"
  },
  "resend": {
    "api_key": "<RESEND_API_KEY>"
  },
  "vercel": {
    "cron_secret": "<CRON_SECRET>",
    "tabletop_url": "https://tabletopwatch.com",
    "simracewatch_url": "https://simracewatch.com"
  }
}
```

## Step 5: Register Telegram Bot

1. Message @BotFather on Telegram
2. `/newbot` → name: `HobbyPulse Bot` → username: `HobbyPulseBot`
3. Copy the token into the openclaw config

## Step 6: Start Gateway

```bash
openclaw gateway start
```

## Step 7: Pair Telegram

1. Message @HobbyPulseBot on Telegram
2. On the VPS: `openclaw pairing approve telegram <CODE>`

## Step 8: Verify

```bash
# Check gateway health
openclaw gateway health

# Check logs
tail -f /tmp/openclaw/openclaw-$(date +%Y-%m-%d).log
```

Send "status" to @HobbyPulseBot on Telegram — it should respond with current health.

## Maintenance

```bash
# Update workspace files (no restart needed)
nano /root/.openclaw/workspace-pulsebot/SOUL.md

# Restart after openclaw.json changes
openclaw gateway start

# View logs
journalctl -u openclaw-gateway -f

# Check model routing
openclaw models status
```

## Model Routing (Matching SMASHD Pattern)

| Priority | Provider | Limit | Cost |
|----------|----------|-------|------|
| Primary | `google/gemini-2.5-flash` | 500 req/day, 15 RPM | Free |
| Fallback | `groq/llama-3.3-70b-versatile` | 14,400 req/day | Free |

**No paid safety net** — if both free providers are down, PulseBot pauses and alerts Mikey.
**No Anthropic on PulseBot** — Claude Haiku is used server-side via the Vercel API routes only.
