# Linear Cleanup Playbook — HobbyPulse Pivot Wrap-up

**Created**: 2026-04-30, while Linear MCP was failing in the originating Claude Code session.
**Purpose**: Self-contained instructions so the HobbyPulse pivot Linear cleanup can be executed by any future Claude Code session (or by Mikey directly) once Linear MCP is operational again.
**Workspace**: Personal account (mikeyhurdle@gmail.com) → `linear.app/playsmashd-ltd` → team PULSE → project "HobbyPulse"
**Estimated time**: ~5 minutes total (paste this entire file as the prompt to a Claude Code session with Linear MCP connected, or work through the phases manually).

---

## Context — already done (do NOT repeat)

- ✅ PR #10 ("🎯 Strategic pivot — minimal-mode TTW + sunset SRW + miniatures cut") merged to main as commit `222ea9c`. URL: https://github.com/mikeyhurdle-dotcom/HobbyPulse/commit/222ea9c
- ✅ OpenClaw VPS: all 4 `hawk-srw-*` jobs disabled in `/root/.openclaw/cron/jobs.json` with a sunset note. Backup saved at `jobs.json.bak-pre-srw-sunset-2026-04-30`. Gateway confirmed healthy.
- ✅ Strategy docs:
  - `bot/COMPETITIVE-VIABILITY-2026-04-30.md` — the kill/minimal/commit decision rationale
  - `bot/FRIDAY-NEWSLETTER-SPEC-2026-04-30.md` — newsletter spec (Phase 1/2/3)
  - `bot/TOP-50-DRAFT-2026-04-30.md` — Top 50 draft, Quill-bylined

---

## What still needs to happen — 5 phases

### Phase 1 — Verify Linear MCP is connected

Verify Linear MCP shows ✓ Connected under `/mcp`. If it's still failing, stop and tell Mikey — don't proceed with the rest until it's back.

---

### Phase 2 — Demote the HobbyPulse project

Find the HobbyPulse project in PULSE team. Set:

- Priority → No priority (or P4 / Low if "No priority" isn't an option)
- Label → add `paused` (create the label if it doesn't exist; alternative `minimal-mode`)
- Description → APPEND (don't overwrite) a pivot summary with:
  - Link to commit `222ea9c` on https://github.com/mikeyhurdle-dotcom/HobbyPulse/commit/222ea9c
  - Pivot decision date: 2026-04-30
  - Lifecycle: minimal-mode (Friday newsletter + Top 50 only)
  - Review-by date: 2027-01-31

---

### Phase 3 — Find + bulk-cancel matching open PULSE issues

List ALL open PULSE issues. Show Mikey which match any of these terms BEFORE cancelling anything:

```
warhammer | miniatures | 40k | simracewatch | SRW | moza | trak racer |
fanatec | sim-lab | wheel base | iracing | army builder | /build | /armies
```

**Wait for Mikey's go/no-go before bulk-cancelling.**

Cancel reason for all bulk-cancelled tickets:
> Won't do — pivot 2026-04-30 (commit 222ea9c)

---

### Phase 4 — Demote remaining open tickets

For any remaining open PULSE tickets that AREN'T directly about the Friday newsletter or Top 50, demote to P4 (Low priority). The only P1/P2 priority work going forward is:

1. Phase 1 newsletter (signup + double-opt-in)
2. Top 50 publication to `/top-50`
3. Pre-send scrub of the 6 TTW affiliate drafts (Goblin chase, Wayland chase, Chaos Cards, 365Games, Kienda, BackerKit)

Everything else stays open but P4 — visible if Mikey ever revisits but not crowding the priority view.

---

### Phase 5 — Create 5 new issues

Create these in PULSE team → HobbyPulse project:

#### Issue 1 — P2
- **Title**: `[HobbyPulse] Phase 1 newsletter — signup + double-opt-in`
- **Priority**: P2 (High)
- **Description**: Link `bot/FRIDAY-NEWSLETTER-SPEC-2026-04-30.md` (Phase 1 section). Resend on `alerts@tabletopwatch.com`, `email_subscribers` table, signup component on home + footer + every blog post. Estimate ~2 hr.
- **Labels**: `claude-ready`, `revenue`, `growth`

#### Issue 2 — P2
- **Title**: `[HobbyPulse] Wire Top 50 to /top-50 public page`
- **Priority**: P2 (High)
- **Description**: Draft already at `bot/TOP-50-DRAFT-2026-04-30.md`, Quill-bylined. Build the public `/top-50` route, render the markdown with proper meta tags + sitemap entry + signup CTA at bottom. Estimate ~2 hr.
- **Labels**: `claude-ready`, `growth`

#### Issue 3 — P3
- **Title**: `[HobbyPulse] Pre-send scrub Wayland chase email — remove Element/Troll/MagicMadhouse refs`
- **Priority**: P3 (Medium)
- **Description**: The Wayland chase email in `bot/AFFILIATE-APPLICATIONS-DRAFTS-2026-04-30.md` references Element Games / Troll Trader / Magic Madhouse as "we'd feature you alongside" — but those scrapers are being removed in the miniatures cut. Update the email body before sending. Estimate ~10 min.
- **Labels**: `owner:mikey`

#### Issue 4 — P4
- **Title**: `[HobbyPulse] 2-week SRW sunset health check`
- **Priority**: P4 (Low)
- **Due date**: 2026-05-14
- **Description**: Verify SRW crons still disabled, no SRW Hawk content has slipped through, simracewatch.com static archive still serving last-state OK, deals scraper still passive (no errors). Decide whether to flip to 301 redirect to TTW or extend the static archive period.

#### Issue 5 — P3
- **Title**: `[HobbyPulse] 2027-01-31 minimal-mode review per viability doc exit signals`
- **Priority**: P3 (Medium)
- **Due date**: 2027-01-31
- **Description**: Review against the exit signals defined in `bot/COMPETITIVE-VIABILITY-2026-04-30.md`. Decide: continue minimal mode, kill HobbyPulse entirely, or commit further. Should have ~9 months of data + Friday newsletter performance to inform the call.

---

## Acceptance for the whole cleanup

- [ ] HobbyPulse project demoted with label + appended description
- [ ] Bulk-cancel list shown to Mikey + executed after his go/no-go
- [ ] Remaining open tickets demoted to P4 (except the 3 P2 priority items defined above)
- [ ] 5 new issues created with correct priorities, labels, due dates, descriptions
- [ ] One-line confirmation back to Mikey that all 5 phases landed cleanly

After Linear is done, drop a one-line confirmation and the HobbyPulse pivot is fully parked.

---

## How to use this file

When Linear MCP is back up:
- **Option A**: paste the entirety of this file as a Claude Code prompt and let it execute the 5 phases
- **Option B**: work through the phases manually in Linear's web UI (each phase is self-contained with all the data needed)

Either way, this file is the source of truth for what the pivot wrap-up requires.
