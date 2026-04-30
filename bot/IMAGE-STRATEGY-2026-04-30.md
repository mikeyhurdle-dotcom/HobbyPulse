# Hawk's Blog Image Strategy — 2026-04-30

Owner: Mikey (decision pending). Drafted by: Claude Code review session.
Scope: hero images for `/blog/*` posts on TabletopWatch + SimRaceWatch.
Status: **proposal awaiting Mikey approval** before Hawk changes any code or pipeline.

---

## 0. Current state (verified)

- **All 12 blog posts have NO images.** Confirmed by `grep -l "coverImage\|heroImage\|^image:" content/blog/{tabletop,simracing}/*.md` — zero hits.
- **`heroImage` is already supported in frontmatter.** `lib/blog.ts:21` declares it on `BlogPostFrontmatter`. `app/(vertical)/blog/[slug]/page.tsx:39` uses it for OpenGraph + Twitter card meta.
- **BUT the post body never renders the hero visually.** The detail page only emits the meta tag — no `<img>` / `<Image>` in the article header. The blog index (`app/(vertical)/blog/page.tsx`) also doesn't show a thumbnail. **Implementation gap: even once we attach `heroImage`, readers won't see anything until we add a render hook in both pages.** Cheap fix (~15 min, one PR).
- **`public/` has only logos** (`tabletopwatch-logo.svg`, `simracewatch-logo.svg`). No image asset folders. We need to pick a convention.
- **Standing rule** (`feedback_image_gen_one_at_a_time.md`): one image per AI prompt. No bundling. Carries through to anything Hawk runs.

---

## 1. Recommendation (one paragraph)

**Go HYBRID (Option 1).** Use curated stock from Unsplash/Pexels (free, CC0-style) for "buyer's friend" product round-ups, deal posts, and hardware reviews where authentic photography of real components beats any AI render. Use Hawk-driven DALL·E for editorial pieces — rules explainers, "best of" lists with a unifying theme, strategy guides, late-pledge Kickstarter roundups — where ownable hero art compounds brand equity over time. Why: stock dodges the over-rendered "AI-image" tells that Google's helpful-content updates increasingly downrank, while AI-gen on editorial gives TabletopWatch + SimRaceWatch their own visual signature in a sea of wirecutter-clones. Cost is near-zero (Unsplash free + Codex Pro budget Hawk already has), Hawk owns the pipeline end-to-end, and the per-post decision rule is mechanical (article blueprint → image source) so Hawk doesn't have to think about it. The one change Mikey signs off on: budget five minutes per post for Hawk to fetch + name + commit the image alongside the markdown, and a render-hook PR so the `heroImage` actually shows up.

---

## 2. Per-option deep dive

### Option 1 — HYBRID (recommended)

| Dimension | Detail |
|---|---|
| **Speed to implement** | ~1 day. Render-hook PR (~30 min) + Hawk drafter prompt updates (~1 hr) + per-site image rulebook in `sites/<site>.md` (~1 hr). Then it just runs. |
| **Ongoing cost** | £0. Unsplash free tier covers stock; DALL·E rides Codex Pro quota Hawk already burns. |
| **Brand consistency** | Strong. AI-gen on editorial gives owned visual identity per site; stock on reviews gives credibility. Per-site style rules constrain both halves. |
| **AI-detection risk** | Low. AI used only on editorial/non-product pieces; product reviews use real photography. Even if Google's classifiers downrank AI hero images, they hit only the editorial layer, not the high-intent commercial pages. |
| **Maintenance** | Per-post Hawk decision: "is this a product review/deals post? → stock. Is this a strategy/best-of/explainer? → AI". Rule lives in `sites/<site>.md`; Hawk reads it before drafting. |
| **Pros** | Best of both. Lowest AI-tells where they matter most (commercial). Brand-distinct on editorial. Free. |
| **Cons** | Two pipelines instead of one. Hawk has to make a per-post choice (mitigated by article blueprint → image-source mapping). Stock licences need attribution comments in markdown for safety. |

### Option 2 — ALL-AI via Hawk (fallback)

| Dimension | Detail |
|---|---|
| **Speed to implement** | ~half-day. Single image-gen function in Hawk's tool chest, called per post. |
| **Ongoing cost** | Codex Pro quota — Hawk is already at the ceiling some days. Adding ~2 image generations per day = manageable but not free in token-budget terms. |
| **Brand consistency** | Highest **if** the style guide is enforced ruthlessly. Risk of drift toward generic DALL·E aesthetics without a tight prompt template. |
| **AI-detection risk** | Highest. Google's December 2024 "site-wide AI image use" signal hits commerce pages especially hard (per multiple SEO post-mortems through 2025). With AdSense already under review (per `bot/MEMORY.md`), gratuitous AI hero use on the deals layer is a measurable revenue risk. |
| **Maintenance** | Single pipeline. One prompt template per site. Easier to audit. |
| **Pros** | Operationally simplest. Total brand control. Fastest to ship. |
| **Cons** | AI tells on product reviews look bad to a human reader who's there to spend £80. Repetitive aesthetic if prompt template gets lazy. AdSense review risk. |

### Option 3 — ALL STOCK (rejected)

| Dimension | Detail |
|---|---|
| **Speed to implement** | Fastest. ~2 hrs total. |
| **Ongoing cost** | £0 free tier; ~£10-15/month if we ever upgrade to Pexels Plus/Adobe Stock for less generic shots. |
| **Brand consistency** | Weakest. TabletopWatch and SimRaceWatch will look interchangeable with every other affiliate-marketing site running the same Unsplash queries. |
| **AI-detection risk** | None. |
| **Maintenance** | Lowest. |
| **Pros** | Zero risk, zero cost, zero learning curve. |
| **Cons** | Brand identity = zero. Same hero image as every wirecutter clone. We lose the Hawk "ownable visual signature" angle entirely. **Killing it for this reason.** |

---

## 3. Image-style rulebook (per site)

Hawk reads this before generating or fetching any image. Format mirrors the voice rules in `sites/<site>.md` — forbidden looks vs required vibes vs preferred subject matter.

### 3a. TabletopWatch image style

**Forbidden looks (do NOT generate or fetch):**
1. Over-rendered fantasy art (dragons, wizards, glowing runes) — that's the *old* Imperial Gold vibe we left
2. Generic "happy diverse group of people having fun" stock photos — reads as corporate marketing collateral
3. Isometric digital-board-game art (Catan-Universe screenshot aesthetic)
4. Dragons / orcs / armour photography with no specific game referent
5. Faux-metal sheen, gothic ornament, "for the Emperor" tone
6. Anime stylisation
7. Top-down "perfectly arranged" board-game photography that looks like a press kit (we want lived-in, not staged)
8. Hyper-saturated colour grading — TabletopWatch is warm + natural, not Instagram-filter
9. Crystals, foil, holographic edges (NFT-aesthetic) — kills the warm-living-room vibe
10. Black-and-white "moody" filtering — undermines the inviting tone
11. Overhead drone-style shots of game stores
12. Any image where Warhammer-only iconography dominates (we pivoted board-game-first; miniatures route to `/miniatures`, never the homepage hero)
13. Cartoon dice with faces / googly eyes — reads kids-entertainment, not enthusiast
14. "Hand reaching dramatically toward camera" stock-photo trope
15. Anything photographed against pure-white seamless backdrops — too sterile, wrong vibe

**Required vibes:**
1. Warm wood-tones (oak / pine / walnut) on the table surface
2. Soft natural light, ideally late-afternoon / golden-hour through a window
3. Real-game-feel: cards, meeples, dice, tokens, cubes, wooden bits all visible and used
4. Top-down or three-quarter angle (no extreme low angles, no "epic" framing)
5. Shallow depth-of-field where it suits — one piece in sharp focus, the rest softening
6. Textures: cardboard tray edges, linen tablecloths, wood-grain, a half-drunk mug of tea visible at the edge
7. Hands in the shot are welcome — placing a card, holding a die, mid-move — but never staring directly at the camera

**Preferred subject matter (high-priority):**
1. Actual recognisable game components (Wingspan birds, Catan resource cards, Splendor gem chips, Carcassonne tiles)
2. Hands placing pieces mid-game (not end-of-game victory shots)
3. Close-up details of card art with the table softly out of focus behind
4. Stack of game boxes on a shelf (good for "best of" round-ups)
5. A single meeple / pawn isolated against soft warm bokeh (great for column thumbnails)
6. Kickstarter-pledge-tier mock-ups where applicable (for crowdfunding round-ups)
7. Empty board mid-setup (works as "how to play" hero — instructional vibe)

**Palette anchor (matches `sites/tabletopwatch.md` §7):**
- Terracotta, warm teal, cream, bright accents
- Wooden-meeple texture
- Daylit-living-room energy
- Light-mode default — thumbnails MUST also read on dark mode (Hawk to verify with a cheap light/dark eye-test on the contact sheet before committing)

**Source rules (which option to pick per blueprint):**
- `best-list` (best-of, budget, gift-guide) → **stock** preferred. Real photography of real components beats AI here.
- `how-to-play` → **stock** preferred. Empty-board-mid-setup shots are abundant on Unsplash.
- `review` (single-game review) → **stock**. Specific game components must be real.
- `versus` (game A vs game B) → **AI** acceptable. A unifying composition is hard to find on stock.
- `Kickstarter roundup` → **AI** preferred. Crowdfunding pledge-tier mockups are ownable visual signatures.
- `editorial / opinion / "the state of board games in 2026"` → **AI**. Editorial gets the brand-signature treatment.

### 3b. SimRaceWatch image style

**Forbidden looks (do NOT generate or fetch):**
1. Cartoonish racing (Mario Kart energy) — alienates the actual sim-racer audience
2. Generic motorsport stock photos (F1 paddock crowds, helmet close-ups with sponsor logos blurred) — wrong audience, that's motorsport-fan, not sim-racer
3. NFT-aesthetic chrome + neon
4. Cropped F1 broadcast shots (rights-holder risk + wrong audience)
5. "Driver in real car putting on helmet" stock — we're a sim hardware site, not a real-motorsport site
6. Glossy showroom shots of a wheel against a white seamless backdrop (per `sites/simracewatch.md` §7: "paddock + telemetry, not glossy showroom")
7. Hyper-saturated motion-blur over-rendered — reads arcade
8. Empty cockpit shot with no screens lit — feels staged
9. Person from waist up with hands on a steering wheel facing camera — corporate-marketing trope
10. Anything with a Ferrari / Mercedes / Red Bull livery that we can't license
11. "Esports gamer in front of RGB-backlit setup" with peripheral-brand logos visible
12. Top-down shot of a desk with a wheel sitting unused — looks like a return listing
13. Any image where the driver's face is the focal point (we're hardware-led, not personality-led)
14. Cartoon checkered flags / generic "race" iconography
15. Stock cliché "hand pointing at telemetry on screen" with someone's blurred shoulder in foreground

**Required vibes:**
1. High-contrast lighting — screen-glow against ambient darkness, not flat fluorescent
2. Motion blur where appropriate (replay / on-track) but never gratuitous
3. Rig-and-screen aesthetics — the sim setup IS the shot
4. Cockpit POV when feasible (looking past the wheel toward the screens)
5. Hardware close-ups — wheel rim macro, pedal-set side angle, base-mount detail
6. Telemetry / overlay UI visible on screen (lap delta, tyre temps, FFB graphs)
7. Charcoal + racing-red colour palette (matches site theme)
8. Low-key lighting, paddock-greys, single warm light source rather than overhead even-fill

**Preferred subject matter (high-priority):**
1. Wheelbase + pedal close-ups (hero shots for hardware reviews)
2. Multi-screen sim setup wide shot (cockpit-style rig with triple monitors lit up)
3. ACC / iRacing / LMU / AMS2 / F1-game UI screen captures (legit for setup guides)
4. Wheel-rim macro with leather/alcantara texture visible
5. Garage / setup-screen overlays from inside the sim (legit because in-game UI is not broadcast IP)
6. Pedal-set isolated shot under directional light (great for "load-cell upgrade" guides)
7. Cable management close-up of a real rig (signals authenticity to the audience)
8. A driver's hands on the wheel (no face) mid-corner — telemetry visible on the screen ahead

**Palette anchor (matches `sites/simracewatch.md` §7):**
- Charcoal + racing-red accent on dark mode default
- Paddock + telemetry, not glossy showroom
- Low-light cockpit shots, screen-glow on a driver's face (face NOT focal — mood lighting), wheel-rim macro, paddock greys

**Source rules (which option to pick per persona):**
- "Upgrade Coach" (best-of, budget upgrades) → **stock** preferred. Real hardware close-ups beat AI.
- "Setup Engineer" (how-to / setup tutorials) → **AI** acceptable for unifying compositions; in-game screenshots even better when the post is sim-specific.
- "Blunt Reviewer" (single-product reviews) → **stock**. Must show the actual product.
- "Versus / comparison" → **AI**. Composition hard to find natively.
- "Deals roundup" → **stock collage** preferred (multiple real product shots) OR **AI** if we want a single-mood hero.
- "Editorial / industry takes" → **AI**. Brand-signature treatment.

---

## 4. Implementation plan

### 4a. Pipeline changes (what Hawk does differently)

For each blog draft Hawk writes:

1. **Identify article blueprint** (already happens — Hawk reads `sites/<site>.md`).
2. **Apply image source rule** (new — from §3 above): `blueprint → stock | AI`.
3. **Generate / fetch one image** following the per-site rulebook:
   - **Stock path**: Hawk uses a new `bot/tools/stock_image.py` helper that hits Unsplash API (free, 50 req/hr) with a curated query string drawn from the post's tags + a per-site filter list. Helper downloads the image, writes attribution to a sibling `.attribution.json`.
   - **AI path**: Hawk calls DALL·E via existing Codex tool with the per-site prompt template. **One image per prompt** (per `feedback_image_gen_one_at_a_time.md`). Helper saves the result.
4. **Save image** to `public/blog/<vertical>/<slug>.webp` (convert to WebP for size + Lighthouse). Naming convention matches the markdown slug 1:1.
5. **Add `heroImage: /blog/<vertical>/<slug>.webp`** to the markdown frontmatter as part of the same draft commit.
6. **Hawk PR includes both** the markdown + the `public/blog/...` image binary in a single commit.

### 4b. Code changes (one PR, ~30 min)

Render the hero in two places that currently ignore it:

**`app/(vertical)/blog/[slug]/page.tsx`** — add a `<figure>` above the `<header>` block (or just below the title) that renders `post.heroImage` via `next/image`, with `alt={post.title}`.

**`app/(vertical)/blog/page.tsx`** — add a thumbnail in each list item if `post.heroImage` is set. Keep the listing readable when it's missing (graceful degrade — half the existing posts will not have one until they're back-filled).

### 4c. New tool: `bot/tools/stock_image.py`

```
Args: --site (tabletop|simrace) --slug <slug> --tags "tag1,tag2"
Behaviour:
  1. Build query: per-site allow-list query template + post tags
  2. Hit Unsplash /search/photos
  3. Apply per-site forbidden-keyword reject filter (drop any result with banned tags)
  4. Pick first non-rejected result
  5. Download → resize → convert to WebP → save to public/blog/<site>/<slug>.webp
  6. Write public/blog/<site>/<slug>.webp.attribution.json with photographer + URL + Unsplash licence note
  7. Print the heroImage path so Hawk can drop it into frontmatter
```

### 4d. New tool: `bot/tools/ai_image.py`

```
Args: --site (tabletop|simrace) --slug <slug> --prompt-context "<post excerpt>"
Behaviour:
  1. Load per-site prompt template from sites/<site>-image-prompt-template.txt
     (NEW FILE — derived from the rulebook above; one file per site so prompts
     don't drift)
  2. Inject post context into the template (the "scene" line)
  3. Call DALL·E (one image only per call — never bundles)
  4. Save raw output → resize → WebP → public/blog/<site>/<slug>.webp
  5. Write public/blog/<site>/<slug>.webp.attribution.json noting "AI-generated, DALL·E, prompt: ..."
```

### 4e. Frontmatter contract

```yaml
---
title: ...
excerpt: ...
publishedAt: 2026-05-01
author: TabletopWatch
tags: [...]
heroImage: /blog/tabletop/<slug>.webp        # NEW — required going forward
heroImageSource: stock | ai                   # NEW — for analytics + audits
heroImageAttribution: "Photo by Jane Doe on Unsplash" | "AI-generated, DALL·E"
---
```

### 4f. Cron-side change

The `hawk-bg-draft-generator-am` and `hawk-bg-draft-generator-pm` cron prompts (per Hawk's OpenClaw cron config — see `~/.claude/skills/openclaw-support/SKILL.md` lines 294-295) need a new step inserted between "draft markdown" and "open PR":

```
After drafting the markdown:
  1. Read sites/<site>.md §image-style rules
  2. Decide blueprint → image source (stock|AI)
  3. Run bot/tools/<source>_image.py --site <vertical> --slug <slug> ...
  4. Add heroImage line to the markdown frontmatter
  5. git add both files
  6. Commit + open PR
```

### 4g. Back-fill of existing 12 posts

Out of scope for v1 of this strategy. Recommended as a separate one-shot Hawk session **after** the live draft pipeline is proven for ~5 new posts. Listed as an open question below.

---

## 5. Open questions for Mikey

1. **Approve the hybrid recommendation, or push to all-AI / all-stock?** Default if no objection: hybrid.
2. **Back-fill the 12 existing blog posts with hero images?** Lifts SEO + reader-experience instantly but burns ~40 mins of Hawk Codex time. Recommend yes, queued for a single batch session **after** the pipeline is proven on 5 new posts.
3. **Budget for paid stock library (Adobe Stock, Pexels Plus, Envato)?** Not needed for v1. Mention only because it's the obvious upgrade path if Unsplash queries return same-old-thing for sim racing (the niche is shallower than tabletop on free stock platforms).
4. **Open-Graph card priority — do we want different artwork for OG/Twitter cards** vs the in-article hero? Default: same image, ratio-cropped. (Cheap to do differently later if we care.)
5. **Image render position — at the very top above the title, or below the title and excerpt?** Cheap to flip; default proposal is **below the title block, above the body** (industry standard, doesn't compete with the title for first attention).
6. **Should TabletopWatch hero images appear on `/boardgames/*` template articles too**, or strictly `/blog/*`? Strictly `/blog/*` for now (the 35 boardgames templates are flagged as deletion candidates per the 2026-04-30 audit anyway).
7. **AdSense review interaction**: are we sure mixing AI-gen heroes onto the editorial layer doesn't risk the AdSense review-in-progress (per `bot/MEMORY.md`)? Worth a manual check before flipping the AI half on.
8. **Mascot integration timing** — TabletopWatch's fox mascot (Quill, per `bot/REBRAND-MASCOTS.md`) lands in Phase 3 of the rebrand. Should Quill appear in any blog hero images, or stay strictly in homepage / 404 / empty-state territory until the brand has stabilised? Recommend **strict separation** until the mascot has earned recognition independent of editorial content.

---

## 6. Decision log

- **2026-04-30** — drafted by Claude Code review session, awaiting Mikey approval.
- *(empty — fill on approval)*

---

*End of strategy doc. No code or pipeline changes have been made. Awaiting Mikey's call on §5.*
