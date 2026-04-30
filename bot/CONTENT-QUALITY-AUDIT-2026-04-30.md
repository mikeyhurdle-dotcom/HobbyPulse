# Content Quality Audit — 2026-04-30

Run by: Claude Code (mikey.gilson@tealium.com sandbox)
Auditor model: Opus 4.7 (1M context)
Scope: Hawk's editorial output in `content/blog/{tabletop,simracing}` + a representative sampling of the 35 `content/boardgames/*` template files.
Companion: `bot/CONTENT-PIPELINE-AUDIT-2026-04-30.md` (pipeline-side findings).

Scoring rubric: 10 dimensions, each 0–3. Sum:
- **0–6 → keep** (publish / minor edit pass)
- **7–15 → rewrite** (bones are fine, voice needs human-level pass)
- **16+ → kill** (delete, not worth saving)

The 10 dimensions: (1) generic listicle intros, (2) padding adverbs/hedges, (3) three-sentence-paragraph rhythm, (4) vague benefit claims with no concrete number/example, (5) empty closing paragraphs, (6) listicle items identical in structure, (7) hedging weasel-words, (8) AI metaphor crutches, (9) filler-only Pros/Cons, (10) zero concrete personal experience / first-person opinion.

---

## 1. Executive summary

**Total posts audited in `content/blog/`:** 12 (6 TabletopWatch + 6 SimRaceWatch).
**Boardgames templates sampled:** 5 of 35.

**Score distribution (blog only):**
- ✅ keep: **3** (both `welcome.md` files, plus the TTW Friday deals roundup)
- 🔧 rewrite: **9** (the 4 unflipped drafts + 5 published Hawk evergreens)
- 🗑 kill: **0** (none of Hawk's blog content is unsalvageable; voice is clean of banned phrases — the slop is structural, not phrase-level)

**Per-site breakdown:**
| Site | Files | Keep | Rewrite | Kill |
|---|---|---|---|---|
| TabletopWatch blog | 6 | 2 (welcome, Friday-deals) | 4 | 0 |
| SimRaceWatch blog | 6 | 1 (welcome) | 5 | 0 |
| Boardgames templates | 35 (5 sampled) | 0 | 0 | **35 (recommend wholesale delete of the 20 pure-template files; convert 15 part-content ones to drafts pending Hawk rewrite)** |

**Headline finding:** Hawk passes the banned-phrase voice filter (no "fast-paced world", no "seasoned veteran", no "tapestry"). His slop is **structural** — every post is the same skeleton: 3-bullet "Fast Verdict" → "Best for / Skip if" → "Trade-off to be honest about" → "Final Word / Final Verdict". Every claim is a category abstraction ("durable scoring bodies", "stable platform", "consistency upgrade"). **Zero specific games named in the 40K detachment posts. Zero specific tracks named in the iRacing posts. Zero specific lap-time numbers in the MOZA/SIMAGIC post.** That's the entire problem.

---

## 2. The 4 unflipped drafts — explicit verdicts

These are the priority. Pipeline audit says they merged into main with `draft:true` and never flipped. Verdicts:

### a) `content/blog/tabletop/armageddon-detachments-2026-what-to-buy-and-what-to-skip.md`
- **Score: 11 → 🔧 rewrite before flipping.**
- Hawk doesn't name a single Space Marine or Ork unit. The post talks about "the new character/support piece", "headline reveal unit", "Speedwaaagh momentum" without specifying *what* the Speedwaaagh detachment unit is, what the SM character is, or what the Jump Pack Chaplain replaces. A reader who doesn't already know the news learns nothing actionable.
- Pads with one fake data hook: "TabletopWatch's internal stack is healthy right now (latest TabletopWatch test: 3,444 products, fresh listings, and active price tracking)" — that's pipeline metadata, not a buying signal. Cut.
- **Verdict: do not flip. Hawk needs to add: (i) actual unit names, (ii) actual GBP price points, (iii) which detachment names we're actually talking about.** Until then it's a generic "buy fundamentals first" essay with an Armageddon-shaped headline.

### b) `content/blog/tabletop/warhammer-40k-11th-edition-detachment-changes-what-to-buy-first.md`
- **Score: 13 → 🔧 rewrite or kill (this one is borderline).**
- Worst of the four. The title promises "what actually changed" — the post says "the pattern is clear" then never describes a single rule, datasheet, or detachment by name. Buy-first lists send readers to generic Amazon search URLs (`amazon.co.uk/s?k=warhammer+40k+character+kit`) — those aren't ASIN-tagged, can't be tracked, and break the "≥3 affiliate links, ordered by priority" rule from `bot/sites/tabletopwatch.md`.
- Also: there are TWO posts with near-identical titles in `content/blog/tabletop/`: `...detachment-changes-what-to-buy-first.md` (this one, draft) AND `...detachment-changes-what-to-buy-now.md` (live). The live one is the better post. **Recommend killing this draft outright** — it's a near-duplicate of the published one and worse on every dimension.
- **Verdict: kill. It's a duplicate-and-worse of the live post.**

### c) `content/blog/simracing/iracing-track-list-2026-season-2-rookie-priority-buy-order.md`
- **Score: 12 → 🔧 rewrite before flipping.**
- Same disease: a track buying guide with **zero track names**. Talks about "Tier 1 — Must-Buy Foundations", "high-overlap road circuits", "mid-speed technical circuits" — never names Spa, Suzuka, Imola, Mid-Ohio, anything. Reader leaves with no purchase decision made.
- Also: the post links to `[iRacing tracks on eBay UK](.../iracing+gift+card)` which is misleading — eBay doesn't sell iRacing track DLC; only gift cards. The shopping links don't match the buying advice.
- Note: there's a near-duplicate published post (`iracing-season-2-2026-track-list-priority-buys.md`) with similar problems. Both posts cover the same topic; only this one is in draft. **Recommend keeping one (rewritten with actual track names), killing the other.**
- **Verdict: do not flip. Rewrite with actual S2 track names + concrete car/series overlap, OR kill in favour of the published twin.**

### d) `content/blog/simracing/moza-vs-simagic-2026-upgrade-timing-guide.md`
- **Score: 8 → 🔧 light rewrite, then flip.** Best of the four drafts.
- Does name actual products (MOZA Drift Masters partnership, P700 pedals, EVO Ultra 28Nm) — that's the bar. Has a concrete scenario ("0.4–0.8s of your league split pace"). Has validation checks ("10-lap stints at equal fuel and conditions").
- Slop tells: still leans on the same skeleton (Fast Verdict → Best for / Skip if → Trade-off → Final Recommendation by Driver Type). The "Supabase Snapshot: Why This Is a Compare-Don't-Rush Week" section is pure padding ("483 products tracked, 20/20 sampled products with active listings") — same fake-data-hook tic as the Armageddon post.
- **Verdict: rewrite to cut the Supabase telemetry padding section, then flip live.** This one is actually almost ready.

**Summary of the four:** 1 to flip after a 10-min edit (MOZA/SIMAGIC), 2 to rewrite before flipping (Armageddon, iRacing rookie), 1 to kill outright (the duplicate 11th-ed detachment post).

---

## 3. Per-post table

| File | Slug | Score | Verdict | Top slop tells |
|---|---|---|---|---|
| `content/blog/tabletop/welcome.md` | welcome | 2 | ✅ keep | Tiny structural padding; otherwise human-voiced and useful. "Cheapest way to start X" framing is specific. |
| `content/blog/tabletop/this-weeks-best-deals-warhammer-board-games-april-24-2026.md` | this-weeks-best-deals... | 4 | ✅ keep | Actual GBP numbers, real eBay listings, real % drops. One small slop tic: "exactly the type of movement we care about" → could be tighter. |
| `content/blog/tabletop/new40k-chaplain-jump-pack-and-ork-detachments-what-to-buy-first.md` | new40k-chaplain... | 9 | 🔧 rewrite | "buy fundamentals first" advice with no faction-specific units; "amazon.co.uk/s?k=warhammer+40k" generic search links (no ASINs). |
| `content/blog/tabletop/warhammer-40k-11th-edition-detachment-changes-what-to-buy-now.md` | ...what-to-buy-now | 10 | 🔧 rewrite | Same skeleton as the duplicate draft; "Buy paths by player type" structure is template-like; vague "scoring core / delivery / support character" language with no datasheet names. |
| `content/blog/tabletop/armageddon-detachments-2026-what-to-buy-and-what-to-skip.md` | armageddon... | 11 | 🔧 rewrite (DRAFT) | "Speedwaaagh momentum" without naming the unit; fake-data padding ("TabletopWatch's internal stack is healthy right now (3,444 products)"); skeleton-identical to the other 40K posts. |
| `content/blog/tabletop/warhammer-40k-11th-edition-detachment-changes-what-to-buy-first.md` | ...what-to-buy-first | 13 | 🗑 kill (DRAFT, dup) | Near-duplicate of the live `-now` post but worse; only generic Amazon search URLs; zero unit names. |
| `content/blog/simracing/welcome.md` | welcome | 2 | ✅ keep | Names Moza R5, CSL DD, Simagic Alpha Mini explicitly. This is what the rest should aspire to. |
| `content/blog/simracing/best-sim-racing-upgrades-under-200.md` | best-sim-racing-upgrades-under-200 | 9 | 🔧 rewrite | Strong Upgrade Coach persona but ZERO specific products named — "load cell brake feel" never points at a specific Heusinkveld / Simagic / Asetek pedal. Generic Amazon search URLs (no ASINs). |
| `content/blog/simracing/iracing-season-2-2026-track-list-priority-buys.md` | iracing-season-2-2026-track-list-priority-buys | 11 | 🔧 rewrite | "Tier 1 — Must-Buy Foundations" without naming a single track. "60% / 25% / 15% budget split" but applied to nothing concrete. |
| `content/blog/simracing/this-weeks-best-sim-racing-deals-april-24-2026.md` | this-weeks-best-sim-racing-deals | 5 | ✅ keep (light edit) | Good — real numbers, named products (MOZA R21 Ultra at £329, Heusinkveld Sim Pedals Ultimate+ -35%). One slop tic: "this is the kind of move worth tracking" closing-paragraph flavour. |
| `content/blog/simracing/iracing-track-list-2026-season-2-rookie-priority-buy-order.md` | ...rookie-priority-buy-order | 12 | 🔧 rewrite (DRAFT) | Same disease as the published twin: zero tracks named. "Marketplace options: sim racing track setup gear on Amazon UK" link is nonsense (eBay doesn't sell iRacing DLC). |
| `content/blog/simracing/moza-vs-simagic-2026-upgrade-timing-guide.md` | moza-vs-simagic-2026... | 8 | 🔧 light rewrite (DRAFT) | Best of the unflipped drafts — does name P700 + EVO Ultra. But the "Supabase Snapshot" middle section ("483 products tracked, 20/20 sampled") is fake-data padding. |

---

## 4. Patterns across the corpus

### What Hawk does RIGHT (preserve)
- **Banned-phrase filter is clean.** No "fast-paced world", no "tapestry", no "navigate the landscape". Voice rules from `bot/sites/*.md` are respected at the phrase level.
- **Persona is consistent within posts.** Once a post commits to "Buyer's Friend" or "Upgrade Coach" tone, it stays there. No persona drift mid-article.
- **"Best for / Skip if" structure is genuinely useful** when the post has actually concrete subjects (e.g., the deals roundup posts). The structure isn't the problem; the abstraction is.
- **Trade-offs are named.** Most posts include explicit "the downside is…" or "the caveat is…". This is the half of the voice rules Hawk consistently nails.
- **Honest "skip if you" recommendations** appear in every post. Hawk understands the editorial POV requirement from `bot/sites/tabletopwatch.md` §5.

### Hawk's #1 slop tell — **abstraction laundering**
Every Hawk evergreen replaces specifics with category-words. Pattern:

> "Buy core units that gain value from your detachment package."
> *(Which units? What detachment? Which faction?)*

> "Mid-speed technical circuits that teach braking discipline."
> *(Spa? Suzuka? Mid-Ohio? Brands Hatch?)*

> "If a combo is all over socials, prices inflate and nerf risk rises."
> *(Which combo? Which prices?)*

This is the AI-shaped variant of the "vague benefit claims" rule (rubric dimension #4). Hawk doesn't reach for "tapestry" or "elevate your experience" — but he reaches for "core unit", "support character", "high-overlap circuit" with the same emptiness. Reader leaves with nothing they could put in a basket.

### Hawk's #2 slop tell — **the same skeleton, eight times**
Every evergreen post has this exact structure:

1. Cold open ("Games Workshop gave us exactly the kind of week…")
2. Fast Verdict (3 bullets)
3. Section 1: "What Changed (and What Didn't)" — 3-item ordered list of fundamentals
4. Section 2: "Best for / Skip if / Trade-off to be honest about"
5. Section 3: Buy order (numbered 1–4)
6. Section 4: Concrete Scenario (template: "you're on round X against player Y, if your spend went into Z…")
7. Section 5: "Who Should Skip Entirely"
8. Section 6: "Final Recommendation" / "Final Word"
9. Footer: "If you want, we'll do faction-specific follow-ups…"

Once you see the shape, every post collapses into the same shape. The reader can predict the next H2 within two articles. **This is the "three-sentence-paragraph rhythm" slop tell (rubric #3) writ large at the section level.**

### Hawk's #3 slop tell — **fake-data hooks**
Three posts inject pipeline telemetry as if it were market analysis:

- Armageddon: "TabletopWatch's internal stack is healthy right now (3,444 products, fresh listings, and active price tracking)…"
- MOZA/SIMAGIC: "SimRaceWatch's latest system checks show: 483 products tracked, 20/20 sampled products with active listings…"
- 11th-ed-detachments-now: "Browse live tabletop deals" (the only one that uses the data hook honestly)

The first two are the bot bragging about itself. They tell a reader nothing about whether to buy. **Cut these every time** — the deals-roundup posts are proof Hawk can use real data when he has it; he doesn't need to fake it.

### Hawk's #4 slop tell — **affiliate link sloppiness**
Voice rule from `bot/sites/tabletopwatch.md` §8: "Every post: ≥3 affiliate links, ordered by priority. UTM-tagged via `lib/affiliate.ts`."

Reality:
- The 6 evergreen posts use **generic Amazon search URLs** (`amazon.co.uk/s?k=warhammer+40k`). These are not ASIN-tagged, not UTM-wrapped, and won't earn affiliate commission. Per `lib/affiliate.ts` they should be wrapped — but the posts don't go through that wrapper.
- The 2 deals roundup posts use real eBay rover links + retailer-direct URLs (Goblin Gaming, Trak Racer). Those are correct.
- Two SimRacing posts link `[iRacing tracks on eBay UK](.../iracing+gift+card)` — eBay doesn't sell iRacing DLC, only gift cards. The link doesn't match the advice.

This is a separate fix from "voice", but it's adjacent: if Hawk had to specify a real product, the affiliate link would be specific too. **Abstraction at the editorial level breeds abstraction at the affiliate-link level.**

### What this means for the parallel voice-rules work
If you're building voice rules off this audit, the rules to add (in priority order):

1. **No category nouns where a proper noun fits.** Rejection trigger: any of {"core unit", "support character", "high-overlap circuit", "stable platform", "the new character", "the headline reveal"} appears without a named example within 1 paragraph.
2. **No fake-data hooks.** Rejection trigger: "TabletopWatch's internal stack…", "SimRaceWatch's latest system checks show…", "products tracked", "X/Y sampled products" — these are ops telemetry, not editorial.
3. **No two posts with identical section sequence.** Add a structural diversity check — if a post matches the 9-step skeleton above, force at least one section into a different shape (a comparison table, a single long argument, a single-question Q&A, etc).
4. **Affiliate link rule:** if a post recommends an item, the link must be ASIN-tagged or rover-wrapped. Generic `/s?k=...` searches fail QA.
5. **Keep:** banned-phrase filter, "Best for / Skip if" structure, persona consistency, "skip if" recommendation, trade-off requirement.

---

## 5. The 35 boardgames templates — sampling result

Sampled 5 representative files across `best/`, `versus/`, `how-to-play/`, `reviews/`:

| File | Slop level | Notes |
|---|---|---|
| `best/best-2-player-board-games-for-couples.md` | Pure template slop | Literal "Best 2-Player Board Games for Couples Pick #1/#2/#3" placeholders. `amazonAsin: "B0DUMMY368"`. Wayland Games URL despite Wayland being disabled in CLAUDE.md. |
| `versus/azul-vs-sagrada.md` | Pure template slop | Literal "Game A" / "Game B" in body. Never actually mentions Azul or Sagrada outside the title. |
| `best/best-board-games-christmas-2026.md` | Pure stub | Body is "*Content to be generated by the article pipeline.*" — 819 chars total. |
| `reviews/wingspan.md` | NOT slop | Genuinely written human review with specific bird-card mechanics, real ASIN, real Zatu URL. **Keep.** |
| `best/2025-board-game-award-winners-worth-buying.md` | NOT slop | Hawk-shipped real article — names Vantage, Star Trek: Captain's Chair, Moon Colony Bloodbath, Hot Streak, etc. Real publisher links (Stonemaier, WizKids). **Keep.** |

**Distribution:** I grepped `Pick #1|Game A|Game B|Content to be generated|DUMMY` across all 35 → **20 files match** (pure templates). The remaining **15 have real content** (or at least real product names + structured argumentation), though many of them have the same skeleton-slop disease as the blog posts.

### Recommendation: split, don't bulk-delete

The previous audit's "wholesale delete + script removal" recommendation is **half-right**. Refined:

1. **Delete immediately** (20 files): the pure templates with `Pick #1` / `Game A` / `B0DUMMY*` placeholders. They will never be safe to flip live and they pollute the content tree.
2. **Keep but flag** (15 files): the boardgames articles with actual content. These need the same audit pass as the blog posts (skeleton-slop, abstraction-laundering, affiliate-link sloppiness). Score-wise they'd land in the 🔧 rewrite bucket, not 🗑 kill.
3. **Delete the script** (`scripts/boardgame-generate-drafts.mjs`): consistent with previous audit. The missing `config/boardgame-article-queue.json` means it's already half-broken; finish the job.
4. **Keep `wingspan.md` and `2025-board-game-award-winners-worth-buying.md` as voice exemplars** — they're closer to the bar Hawk should be hitting on every post.

---

## 6. Action list (priority-ordered for tomorrow)

1. **Kill** `content/blog/tabletop/warhammer-40k-11th-edition-detachment-changes-what-to-buy-first.md` (duplicate-and-worse of the live `-now` post). 30s job.
2. **Edit + flip** `content/blog/simracing/moza-vs-simagic-2026-upgrade-timing-guide.md` — cut the "Supabase Snapshot" middle section, then `draft: false`. ~10 min.
3. **Rewrite + flip** `content/blog/tabletop/armageddon-detachments-2026-what-to-buy-and-what-to-skip.md` — Hawk needs to add actual unit names (the SM character, the Speedwaaagh detachment, the Jump Pack Chaplain). Recommend regenerating with strict prompt: "name every unit referenced; include 1 GBP price per unit named". ~30 min Hawk + 10 min review.
4. **Rewrite or kill** `content/blog/simracing/iracing-track-list-2026-season-2-rookie-priority-buy-order.md` — overlaps with the published `iracing-season-2-2026-track-list-priority-buys.md`. Pick one, rewrite with actual track names, kill the other. ~30 min.
5. **Bulk delete** the 20 pure-template `content/boardgames/*` files matching the placeholder grep. Delete `scripts/boardgame-generate-drafts.mjs`. ~5 min.
6. **Audit pass** on the 4 published TTW evergreens + 2 published SRW evergreens — same disease, lower urgency since they're already live. Plan a Hawk re-run with stricter "name every product" prompt. ~half a day.
7. **Voice rules update** — feed §4 of this audit into whatever voice-rules work is happening in parallel. The four high-leverage additions are the abstraction-laundering rule, the fake-data-hook rule, the structural-diversity rule, and the affiliate-link specificity rule.

---

## 7. Caveats / what I didn't audit

- **Did not load the live HTML versions.** Audit is against the markdown source. If the renderer modifies content (it shouldn't), live reality may differ.
- **Did not audit the `/boardgames` content tree exhaustively** — sampled 5 of 35 per scope. Recommendation extrapolates from the sample + grep counts.
- **Did not score `bot/CONTENT-QUEUE.md` queued titles** — those are titles, not posts. They're in the pipeline-side audit.
- **Voice rule #1 (banned phrases) was the only existing automated check.** Everything else in this audit is pattern-recognised by hand. Worth turning rule #1–4 from §4 into a pre-flight script before Hawk's next merge.
