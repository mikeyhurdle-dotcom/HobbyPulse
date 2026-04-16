# Hawk Upgrade — Mikey's Setup Checklist

Everything Hawk needs from you to become the autonomous business operator for HobbyPulse. Ordered by priority — do the top items first, everything else can follow.

---

## 🔴 Critical (Hawk can't operate without these)

### 1. MiniMax OAuth on VPS (~5 min)

Gives Hawk a coding-capable model for blog writing and code changes.

```bash
ssh -i ~/.ssh/vps_openclaw root@77.42.20.44

# Run MiniMax OAuth flow
openclaw onboard --auth-choice minimax-global-oauth

# Verify
openclaw models list --provider minimax-portal
```

Then update Hawk's model config in `openclaw.json`:
```json
{
  "model": {
    "primary": "minimax-portal/MiniMax-M2.7",
    "fallbacks": [
      "google/gemini-2.5-flash",
      "groq/llama-3.3-70b-versatile",
      "google/gemini-2.0-flash-lite"
    ]
  }
}
```

Run `openclaw doctor` to validate, then `openclaw gateway restart`.

### 2. Clone HobbyPulse Repo on VPS (~10 min)

Hawk needs git access to write blog posts and code changes.

```bash
ssh -i ~/.ssh/vps_openclaw root@77.42.20.44

# Generate deploy key for Hawk
ssh-keygen -t ed25519 -f /root/.ssh/hobbypulse-deploy -N "" -C "hawk-pulsebot"

# Copy the public key
cat /root/.ssh/hobbypulse-deploy.pub
```

Then:
1. Go to GitHub → `mikeyhurdle-dotcom/HobbyPulse` → Settings → Deploy Keys
2. Add the public key with **write access** enabled
3. Clone:

```bash
# Configure SSH to use the deploy key for this repo
cat >> /root/.ssh/config << 'EOF'
Host github-hobbypulse
  HostName github.com
  User git
  IdentityFile /root/.ssh/hobbypulse-deploy
EOF

# Clone into Hawk's workspace
cd /root/.openclaw/workspace-pulsebot/
git clone git@github-hobbypulse:mikeyhurdle-dotcom/HobbyPulse.git hobbypulse
cd hobbypulse

# Set git identity
git config user.name "PulseBot (Hawk)"
git config user.email "hawk@hobbypulse.bot"

# Install dependencies (for build testing)
npm install
```

### 3. Enable Native Heartbeat for Hawk (~5 min)

Currently Hawk has no heartbeat — it only runs on the daily watchdog cron. Enable native heartbeat so it polls proactively.

In `openclaw.json`, add to Hawk's agent config:

```json
{
  "heartbeat": {
    "every": "60m",
    "target": "last",
    "session": "isolated",
    "activeHours": {
      "start": "06:00",
      "end": "22:00",
      "timezone": "Europe/London"
    },
    "ackMaxChars": 500
  }
}
```

Run `openclaw doctor` then `openclaw gateway restart`.

Verify: `openclaw system heartbeat last` (should show Hawk's last fire after 1hr).

---

## 🟡 Important (Enables content distribution)

### 4. Create Social Media Accounts (~20 min)

Create Twitter/X accounts for both sites:
- `@TabletopWatch` (or `@TabletopWatchUK` if taken)
- `@SimRaceWatch` (or similar)

Options for posting:
- **Buffer** (recommended): Create account at buffer.com, connect both Twitter accounts. Store API key at `/root/.openclaw/secrets/buffer-api-key`.
- **Direct Twitter API**: Create developer account at developer.twitter.com, create an app, store keys at `/root/.openclaw/secrets/twitter-api-key`, `twitter-api-secret`, `twitter-access-token`, `twitter-access-secret`.

### 5. Set Up Hawk's Cron Schedule (~10 min)

Replace the single daily watchdog cron with a full business operator schedule:

```bash
ssh -i ~/.ssh/vps_openclaw root@77.42.20.44

# Blog generation — Mon + Thu 7am UK
openclaw cron add --name "hawk-blog-draft" --agent pulsebot \
  --cron "0 7 * * 1,4" --tz "Europe/London" --session isolated \
  --description "Generate blog post drafts for both verticals" \
  --message "Time for blog content. Research trending topics in both verticals, then write one blog post per vertical. Create a branch, commit the markdown files, push, and create a PR. Notify Mikey via Telegram with post titles and PR links."

# Friday deals roundup — Fri 8am UK
openclaw cron add --name "hawk-deals-roundup" --agent pulsebot \
  --cron "0 8 * * 5" --tz "Europe/London" --session isolated \
  --description "Weekly deals roundup blog post" \
  --message "Generate this week's deals roundup blog post for both verticals. Query Supabase for best deals, biggest price drops, and new stock this week. Write the roundup posts with affiliate links, commit, push, and create PRs."

# Weekly business review — Sun 7pm UK
openclaw cron add --name "hawk-weekly-review" --agent pulsebot \
  --cron "0 19 * * 0" --tz "Europe/London" --session isolated \
  --description "Weekly business review to Mikey" \
  --message "Compile the weekly business review. Pull all metrics: page views, affiliate clicks, subscriber count, content published, social engagement. Format per the SOUL.md template and send to Mikey via Telegram."

# SEO audit — Mon 6am UK
openclaw cron add --name "hawk-seo-audit" --agent pulsebot \
  --cron "0 6 * * 1" --tz "Europe/London" --session isolated \
  --description "Weekly SEO opportunity scan" \
  --message "Run the weekly SEO audit. Check Google Search Console (if available) for keyword opportunities. Scan competitor sites and Reddit for trending topics. Log findings to daily memory note and factor into this week's blog planning."

# Competitor scan — Wed 7am UK
openclaw cron add --name "hawk-competitor-scan" --agent pulsebot \
  --cron "0 7 * * 3" --tz "Europe/London" --session isolated \
  --description "Mid-week competitor and trend scan" \
  --message "Scan competitor sites, Reddit (r/Warhammer40k, r/boardgames, r/simracing), and BoardGameGeek hotness for trending topics and content gaps. Log opportunities to daily memory note."
```

Keep the existing `pulsebot-daily-watchdog` cron — it still handles the morning ops digest.

---

## 🟢 Nice to Have (Enables revenue tracking & optimisation)

### 6. Google Search Console API Access (~15 min)

Lets Hawk see what keywords are driving traffic and find SEO opportunities.

1. Go to Google Cloud Console → APIs & Services → Enable "Search Console API"
2. Create a service account (or reuse Hoid's `hoid-agent@hoid-491007.iam.gserviceaccount.com`)
3. In Search Console → Settings → Users and permissions → Add service account email as "Full" user
4. Store credentials at `/root/.openclaw/secrets/gsc-service-account.json`

### 7. Google AdSense API Access (~15 min)

Lets Hawk track ad revenue automatically.

1. AdSense dashboard → Account → API access → Enable
2. Create OAuth credentials in Google Cloud Console
3. Store at `/root/.openclaw/secrets/adsense-credentials.json`

### 8. Vercel Analytics API (~5 min)

Check if Vercel Web Analytics has an API — if so, store token at `/root/.openclaw/secrets/vercel-analytics-token`.

### 9. Top Up OpenRouter (~2 min, optional)

If you want MiniMax M2.5 via OpenRouter as a fallback (in addition to the native OAuth):
1. Go to openrouter.ai → billing → add £5
2. This gives months of usage at MiniMax prices ($0.12/M input tokens)

### 10. Reddit Account for Hawk (optional, low priority)

If you want Hawk to participate in hobby communities (share blog posts, answer questions):
1. Create a Reddit account (e.g., `u/TabletopWatchBot` or `u/HobbyPulseBot`)
2. Be transparent it's a bot — Reddit communities respect honesty
3. Only share genuinely useful content, never spam

---

## Summary of Time Investment

| Item | Time | Impact |
|------|------|--------|
| MiniMax OAuth | 5 min | Unlocks coding + content creation |
| Git repo clone | 10 min | Unlocks blog publishing + code changes |
| Enable heartbeat | 5 min | Unlocks proactive operation |
| Social accounts | 20 min | Unlocks audience building |
| Cron schedule | 10 min | Unlocks automated content calendar |
| GSC API | 15 min | Unlocks SEO intelligence |
| AdSense API | 15 min | Unlocks revenue tracking |
| **Total** | **~80 min** | **Full autonomous operation** |

The first 3 items (20 min) are critical — everything else can be done incrementally over the next week.
