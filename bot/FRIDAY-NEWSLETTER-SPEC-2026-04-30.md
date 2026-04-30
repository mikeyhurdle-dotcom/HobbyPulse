# Friday Newsletter — Implementation Spec (2026-04-30)

Owner: Mikey + Hawk. Companion docs: `bot/COMPETITIVE-VIABILITY-2026-04-30.md`, `bot/sites/tabletopwatch.md`, `bot/sites/tabletopwatch-voice.md`.

---

## Goal

Turn the 22,686 UK board-game listings TabletopWatch already tracks into a **weekly value-exchange surface** that earns a calendar slot in readers' weeks. Subscribers get a curated drop of the week's strongest UK board-game deals plus one short opinionated editorial from **Quill**; TabletopWatch gets a retention asset that doesn't depend on Google ranking, doesn't compete with SU&SD video, and turns ad-blocked and HCU-affected pageviews into recurring touchpoints.

Per the viability doc, this is **one of the two retention plays the minimal-mode pivot leaves alive** (the other is the quarterly Top 50). If the newsletter doesn't compound to >500 subscribers by month 6, the minimal-mode bet failed and we wind down.

## Why now

- The deals data already exists. We're not building a content product, we're surfacing one.
- Resend is already configured for `alerts@tabletopwatch.com` (used for price alerts). Adding a newsletter list is a 1–2-hour incremental build, not a green-field project.
- Google traffic is pre-revenue and possibly post-HCU permanently soft. A newsletter is the only direct-to-reader surface that compounds without depending on rankings.
- Quill (mascot-as-narrator) gives the newsletter a recognisable voice without a fictional-editor layer.

## Out of scope (this spec)

- A paid tier (defer until the free list is >2,000 subs).
- A separate iOS/Android app.
- Cross-vertical (sim racing) — SRW is sunset.
- Onboarding sequences beyond a confirmation email + one welcome email.
- Anything multi-language.

---

## Stack

- **Email send:** Resend on `alerts@tabletopwatch.com`. Already configured for price alerts. We re-use the same domain, add a new `from: friday@tabletopwatch.com` (or keep `alerts@`). DKIM/SPF already valid on `tabletopwatch.com`.
- **List storage:** new Supabase table `email_subscribers` keyed by `(vertical, email)`. Stores: id, email, vertical, status (`pending` / `active` / `unsubscribed` / `bounced`), confirmed_at, source, unsubscribe_token. Ships with RLS so the anon client can only insert — reads + updates use the service-role key from server actions.
- **Signup component:** new `components/newsletter-form.tsx` (note: a stub already exists on the homepage — this spec finishes it). Uses a server action to `INSERT … status='pending'`, fires a Resend confirmation email with a one-click confirm link.
- **Confirmation route:** `/api/subscribe/confirm?token=…` flips `status` to `active` and sets `confirmed_at`. **Double-opt-in is mandatory** — DKIM/sender reputation depends on it.
- **Unsubscribe route:** `/api/subscribe/unsubscribe?token=…` flips `status` to `unsubscribed`. Linked from every email's footer.
- **Editorial layer:** Hawk drafts in `bot/newsletter-drafts/<YYYY-MM-DD>.md`. Mikey reviews + flips a `status: ready` flag. A cron (or manual Hawk command) reads the ready draft, renders to HTML, calls Resend's bulk API.
- **Templating:** Phase 1 ships plain HTML (we own the markup, no vendor lock-in). Phase 3 evaluates Resend's React Email components if the rendering chore becomes painful.

## Cadence

- **Friday 17:00 London** — send time. Email comes through right at end-of-week, prime time for weekend buying decisions.
- **Friday 09:00 London** — Hawk's draft generator runs. Pulls the previous 7 days of price drops + scraped listings + top-rated new arrivals.
- **Friday 09:30–16:30** — Mikey reviews the draft, edits Quill's editorial paragraph, approves or kills.
- **Friday 17:00** — cron triggers the bulk send via Resend.
- **Saturday morning** — open-rate / click-rate snapshot. Anything anomalous lands in Tycho's tightbeam.

If the Top 50 quarterly fires that week (Jan / Apr / Jul / Oct end-of-month), the newsletter leads with the Top 50 update instead of the editorial; deals drop to a short list.

## Format proposal

```
Subject: This week's UK board game deals — <topline buy / topline drop>
Preheader: <one-sentence summary of biggest signal>

[ Quill's avatar / signature ]

  Quill's pick of the week
  ────────────────────────
  <60–90 word editorial paragraph signed by Quill — opinionated,
   trade-off-aware, anchored on ONE specific deal or release. Voice
   per bot/sites/tabletopwatch-voice.md.>
  → [Buy at <retailer>]    £<price> / £<rrp>

  Top 5 deals this week
  ─────────────────────
  Auto-pulled from Supabase priceDrops where dropPercent >= 10 in the
  last 7 days, ranked by best signal. Each row: image, name, price /
  RRP, retailer, [Buy] CTA. Skip rows for products that match the
  miniature-keyword filter (board-games-only post-pivot).

  Worth knowing
  ─────────────
  3 short bullets — Kickstarter ending soon, a notable new release,
  a price-history note ("last time this dropped was Christmas"), etc.

  [ Optional: Top 50 update — Q-end weeks only ]

  Footer
  ──────
  - Manage your subscription / unsubscribe
  - Why you're getting this
  - Reply if you want to talk to a human (Mikey reads them)
```

Subject-line pattern (week-by-week): `<one specific verb>` + `<game/retailer>` + `<price signal>`. Examples: "Spirit Island just dropped to £62 (worth knowing)", "Cascadia is £29 at Zatu — and four other Friday picks", "Three Kickstarters end Sunday — back, late-pledge, or skip?". Avoid date-formatted headlines ("Friday April 24 deals"); they age badly in inboxes.

## Editorial pipeline

```
[ Friday 09:00 — Hawk draft generator ]
        │
        │ Reads:
        │   - Supabase price_drops (last 7 days, dropPercent >= 10)
        │   - Supabase products (newest 7 days, board-game category)
        │   - content/blog/tabletop/* (last 14 days, for backlinks)
        │   - bot/newsletter-drafts/* (last 4 weeks, dedupe vs prior issues)
        │
        ▼
   Writes to bot/newsletter-drafts/<YYYY-MM-DD>.md
   YAML frontmatter:
       status: draft | ready
       subject: …
       preheader: …
       quills_pick:
         product_slug: …
         editorial: |
           <60-90 words, Quill voice>
       deals: [list of 5 product slugs]
       worth_knowing: [3 bullet objects]
       top50_update: optional, only set on Q-end weeks
        │
        ▼
[ Friday 09:30–16:30 — Mikey review ]
   - Reads draft, edits editorial, possibly swaps deals.
   - Flips status: ready when happy (single field change in YAML).
        │
        ▼
[ Friday 17:00 — send pipeline ]
   - Cron looks for status: ready in bot/newsletter-drafts/*
   - Renders to HTML via templates/newsletter.html
   - Calls Resend bulk-send API for vertical='tabletop' && status='active'
   - Records send result + open / click webhook to Supabase newsletter_sends
   - Renames draft to bot/newsletter-drafts/_sent/<date>.md
        │
        ▼
[ Saturday — telemetry ]
   - Open rate, click rate, unsubscribe count snapshot
   - Tightbeam to Tycho
```

## Phased implementation

The spec does NOT ship as one big PR. Three phases, each independently shippable.

### Phase 1 — Subscriber capture (1–2 hours, ships immediately)

**Goal:** Start collecting subscribers TODAY, even if there's no send pipeline yet. The compounding curve only starts once the form is live.

**Deliverables:**
- `email_subscribers` Supabase table + migration
- `components/newsletter-form.tsx` finished (replaces the stub on the homepage; also rendered in footer + at the bottom of every blog post)
- Server action `subscribeToNewsletter(email, vertical, source)` — inserts pending row, fires Resend confirmation email
- `/api/subscribe/confirm` route — flips status to active, redirects to `/blog?confirmed=1`
- `/api/subscribe/unsubscribe` route — flips status to unsubscribed
- Confirmation email template (plain HTML, signed by Quill)
- Privacy-policy line: "We use your email only to send the Friday newsletter. One-click unsubscribe."

**Acceptance criteria:**
- [ ] Visiting any page, dropping an email, and clicking confirm produces an `active` row in `email_subscribers`
- [ ] Resend dashboard shows the confirmation email delivered
- [ ] Unsubscribe link from the confirmation email flips `status` to `unsubscribed`
- [ ] Form gracefully degrades if Resend env vars are unset (says "newsletter coming soon" instead of erroring)
- [ ] No subscriber row is ever created without `status='pending'` first

**Done = ready to ship.** No editorial pipeline yet — we're just capturing.

### Phase 2 — Manual draft + send (3–4 hours, ships when Phase 1 has 50+ active subscribers)

**Goal:** Turn the captured list into a real send. Manual pipeline first — Hawk drafts, Mikey reviews + sends from Resend dashboard. No automation yet.

**Deliverables:**
- Hawk's draft generator: reads Supabase, writes `bot/newsletter-drafts/<date>.md` with the YAML frontmatter shape above
- HTML template at `templates/newsletter.html` (mobile-friendly, dark-mode-friendly inlined CSS)
- A `scripts/render-newsletter.mjs` that takes a draft path and outputs ready-to-paste HTML
- Mikey's send workflow: paste the rendered HTML into Resend's compose UI, select audience `tabletop / active`, send.
- A `newsletter_sends` Supabase table to record manual sends (subject, sent_at, recipient_count)

**Acceptance criteria:**
- [ ] Friday 09:00 Hawk command produces a draft file ready for review
- [ ] The draft passes the voice-rulebook QA (Quill voice, no banned phrases, has a "skip if")
- [ ] Mikey can render + send in <30 minutes, end-to-end
- [ ] Send is recorded in `newsletter_sends`
- [ ] Open rate >25% on first three sends (industry benchmark for opt-in lists)

**Done = manual but real.** Don't move to Phase 3 until this has run for 4+ weeks and the format has settled.

### Phase 3 — Full automation + analytics (2–3 hours, ships when Phase 2 has been manually run for ~4 weeks)

**Goal:** Remove Mikey from the send loop. Hawk drafts → Mikey approves (single YAML flip) → cron sends.

**Deliverables:**
- Cron at `app/api/cron/newsletter-send/route.ts` — runs Friday 17:00 London via openclaw cron (NOT Vercel — see CLAUDE.md feedback rule), iterates `bot/newsletter-drafts/*` looking for `status: ready` for the current Friday, renders + sends
- Resend webhook handler at `app/api/webhooks/resend/route.ts` — records open / click / bounce events into `newsletter_events`
- Analytics dashboard: a simple `/admin/newsletter` page showing open rate, click rate, unsubscribe rate by send (auth-gated)
- Auto-archive: on successful send, draft moves to `bot/newsletter-drafts/_sent/<date>.md` so Hawk doesn't re-pick it up
- Failure path: if Resend send returns >5% bounce rate, cron pings Mikey on Telegram instead of completing silently

**Acceptance criteria:**
- [ ] Three consecutive Fridays send automatically without Mikey touching anything except the YAML flip
- [ ] Bounce rate stays <2% (means double-opt-in is doing its job)
- [ ] Click rate >5% on the deals block (means the curation is real)
- [ ] If Hawk's draft generator fails or Mikey doesn't flip `ready`, no email goes out (graceful degradation)
- [ ] Analytics dashboard renders the last 12 sends with the four core metrics

**Done = fire-and-forget.** Mikey can be on holiday and the newsletter still ships, or noticeably doesn't ship if he didn't approve.

---

## Open questions for Mikey

1. **Brand colour palette in the newsletter** — do we mirror the site's warm-teal accent (`oklch(0.62 0.10 200)`) or use a softer paper-cream palette that reads better in inboxes? Suggest the latter; inbox dark-mode rendering is unpredictable.
2. **Plain HTML vs Resend's React Email components** — the spec defaults to plain HTML for Phase 1 + 2. React Email is worth evaluating in Phase 3 if the rendering script gets messy. Confirm preference.
3. **Free-only or eventual paid tier?** — the spec assumes free-only. A paid tier ("Quill's full Top 50 with rationale, monthly retailer access" or similar) is a Phase 4+ question. Worth flagging now so the email_subscribers schema doesn't need migrating later — suggest adding a `tier` column (default `free`) day one even though it's unused.
4. **Footer signature** — Quill alone, "Quill (with Mikey)", or just the site brand? Suggest Quill alone for the editorial paragraph; brand for the unsubscribe block.
5. **GDPR / DPA wording** — Mikey's existing privacy policy probably covers this but we should add a one-line "we use Resend (US-based) as our email processor" disclosure if it doesn't already mention it. Confirm before Phase 1 ships.
6. **Source attribution** — should the form pass `source` (homepage / blog-post-slug / footer) so we can see which surface drives the most signups? Suggest yes; it's free data.
7. **Quarterly Top 50 newsletter format** — when the Top 50 update fires, does it replace the regular send (lead-with-Top-50, no deals block) or augment it (Top 50 banner, deals shorter)? Suggest replace; otherwise the send becomes too long.

---

## What "good" looks like at month 6

- ≥ 500 active subscribers
- Open rate ≥ 30% sustained
- Click-through rate ≥ 5% on the deals block
- Bounce rate ≤ 2%
- Unsubscribe rate ≤ 0.5% per send
- ≥ 3 reader replies per send (signal that someone read it as content, not just opened it)

If by month 6 we're at <100 subs and <20% open rate, the minimal-mode bet failed. Wind down per the viability doc's exit signals.

## What's deliberately deferred

- The actual Phase 1 implementation (signup component + table + double-opt-in) — this PR ships only the spec.
- The first Top 50 publication — already drafted at `bot/TOP-50-DRAFT-2026-04-30.md` (now under Quill's byline) but not yet wired to a public page. That's a separate PR.
- The SRW 301 redirect — Mikey explicitly chose to defer this to preserve optionality. Re-evaluate at 2027-01-31 alongside the broader minimal-mode review.
