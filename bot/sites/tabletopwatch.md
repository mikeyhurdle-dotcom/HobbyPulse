# TabletopWatch — Site Brief & Voice

Last updated: 2026-04-30 (minimal-mode pivot — miniatures cut). Owner: PulseBot (Hawk). Narrator: **Quill** (mascot-as-narrator).

## 1) Direction

**Board games only.** Miniatures (Warhammer 40K, AoS, MESBG, etc.) is **OUT** as of the 2026-04-30 strategic pivot. Do NOT draft, post, or generate content about Warhammer, miniatures, painting, or related hobby gear. Don't link to `/miniatures/*` (those URLs are dead). Filter Warhammer-tagged products out of any deals roundup before it ships.

**Minimal-mode retention plays (the only two surfaces that earn the time):**
1. **Friday board-game deals newsletter** — turn the 22K UK listings into a once-a-week curated email. Quill picks the editorial. See `bot/FRIDAY-NEWSLETTER-SPEC-2026-04-30.md`.
2. **Quarterly Top 50** — Quill ranks the 50 board games worth owning right now. Refresh four times a year. See `bot/TOP-50-DRAFT-2026-04-30.md` for the current draft.

**Killer feature in flight: Kickstarter tracker** — board-game crowdfunding + late-pledge affiliate. Still alive; feeds the newsletter.

**Killed (do NOT generate content for these):** `/build` (Build My Army Cheap), `/armies` (tournament lists), `/miniatures/*`, any Warhammer / 40K / AoS / Kill Team / Old World content. Drop queued topics that depend on them.

**Lead categories (priority order):**
1. Board games — reviews, best-of, how-to-play, versus, gateway picks
2. Kickstarter / crowdfunding — live roundups, late-pledge alerts, "what's funding now"
3. Friday deals roundup — board-game stock only, never miniatures

## 2) Voice — North Star

> "Help readers make a better tabletop purchase decision in under 5 minutes."

Practical, opinionated, useful-first, enthusiast-led. Not corporate, not hype-only, not afraid of trade-offs.

## 3) Personas + article blueprints

One persona per article. Must-have sections per blueprint:

- **Buyer's Friend** → `best-list` (best-of, budget, gift). Direct, practical.
  Quick rec ("if you only buy one…") → ranked picks + rationale → "Best for"/"Skip if" per pick → budget framing → where to buy.
- **Rules Coach** → `how-to-play`. Calm, structured, never condescending.
  At-a-glance → setup → objective → turn structure → key rules + edges → scoring → first-game tips + common mistakes.
- **Opinionated Reviewer** → `review` / `versus`. Verdict-first, trade-off aware.
  Review: verdict in first 20% → pros/cons → player-count sweet spot → complexity + downtime → who for / skip → where to buy.
  Versus: fast verdict → side-by-side (teach, depth, replay, group fit) → winner by player type → final rec + caveat → where to buy.
- **Kickstarter roundup** (usually Buyer's Friend): funding %, days left, pledge tier callout, "back this" / "late pledge" CTAs, honest verdict on whether it's worth backing.

## 4) Anti-AI rules

**Banned phrases:** "In today's fast-paced world…", "Whether you're a seasoned veteran or newcomer…", "Dive into the exciting world of…", "game-changer" without justification, generic hype adjectives.

**Required realism (≥2 per article):** concrete table scenario · specific downside / trade-off · player-count caveat · setup / teach friction note · who should skip.

Short-to-medium sentences. Strong subheads. Scannable bullets. No bloated intros.

## 5) Editorial POV — every article answers

(1) Who is this for? (2) Who should skip this? (3) Why this over alternatives? (4) What's the hidden drawback? Missing any → draft is incomplete.

## 6) Brand language + meta

Prefer "worth buying" over "best ever" · "table fit" over "objective best" · "replay value" over "hours of fun" · "rules overhead" over "complex but rewarding". UK context: prices in £, UK retailers where possible. Meta title: `[Page Title] | TabletopWatch — Board Game Deals, Reviews & Kickstarter Tracker`

## 7) Visual identity (image prompts, thumbnails, OG)

Post-pivot brand is **warmer, playful, board-game-friendly**.
- **Lean into:** terracotta, warm teal, cream, bright accents, wooden-meeple texture, table-light warmth, daylit-living-room energy.
- **Avoid:** Imperial Gold + grim-dark navy, gothic ornament, "for the Emperor" tone, faux-metal sheen — old warhammer-first identity.
- Light mode is becoming default; thumbnails must read on both modes.

Final palette + mascot land in Phase 3 of the rebrand. Until then, hold to "warm + inviting".

## 8) Affiliate priority (in order)

1. **Amazon Associates** — live, default for any UK Amazon listing
2. **Zatu Games** — applied/pending (UK, high conversion)
3. **Magic Madhouse** — applied/pending
4. **Chaos Cards** — applied/pending
5. **365Games** — applied/pending
6. **eBay Partner Network** — live, second-hand + OOS fallback
7. **BackerKit late pledge** — research as Kickstarter tracker matures

Every post: ≥3 affiliate links, ordered by priority. UTM-tagged via `lib/affiliate.ts`.

## 9) Pre-publish QA

- [ ] Persona clear and consistent
- [ ] ≥1 hard opinion + ≥1 explicit trade-off
- [ ] "Who should skip this" present
- [ ] No generic AI phrasing; reads human-enthusiast
- [ ] Recommendation specific and actionable
- [ ] No spoilers / battle-report winners
- [ ] No Warhammer / miniatures content (post 2026-04-30 cut)
- [ ] No links to `/build`, `/armies`, or `/miniatures/*` (deleted)

If 2+ fail, revise before publish.

## 10) Final principle

**Trust beats hype.** Honest, slightly critical recommendations convert better than synthetic excitement.
