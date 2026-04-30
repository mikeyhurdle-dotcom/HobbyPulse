# Spinning up a new vertical

Runbook for adding a new branded site (vertical #3, #4, …) on top of the
HobbyPulse codebase. The pattern here is the **actually-current** one as of
2026-04-30 — derived from `config/verticals.ts`, `bot/sites/*.md`, and the
2026-04-27 board-game-first rebrand. If something below disagrees with the
code, the code wins — fix this doc.

> **Goal:** half a day end-to-end, mechanical, no hand-wringing.
> One codebase, one `NEXT_PUBLIC_SITE_VERTICAL`, two-and-counting Vercel
> projects pointed at the same repo.

---

## TL;DR — the 8-step pattern

1. **Pick a slug** (must match `NEXT_PUBLIC_SITE_VERTICAL`).
2. **Add a config block** in `config/verticals.ts`.
3. **Buy the domain.**
4. **Create a new Vercel project**, point it at the same repo, set the env var.
5. **Add the theme tokens** (accent / accentLight / accentGlow + decide light or dark default).
6. **Write `bot/sites/<slug>.md`** (voice, persona, killer feature, affiliate priorities, palette/mood) and brief Hawk.
7. **Pick a killer feature** — the differentiator that makes the site worth visiting (and the affiliate engine).
8. **Wire redirects + per-vertical conditionals** (Next.js `redirects()` / `rewrites()`, plus the handful of `slug === "<x>"` branches scattered across the app).

Each step is expanded below. Steps 1, 2, 5, 6 are pure-code; 3, 4, 7 need
human/business input; 8 is the "find the conditional landmines" sweep.

---

## 0. Before you start

Read these to ground yourself:

- `config/verticals.ts` — the one source of truth for runtime per-site config.
- `lib/site.ts` — `getSiteVertical()` resolves the active config from the env var.
- `app/layout.tsx` — injects `--vertical-accent*` CSS variables from the active theme.
- `bot/sites/tabletopwatch.md` and `bot/sites/simracewatch.md` — the two existing voice docs (use whichever matches your new vertical's energy as the template).
- `REBRAND-PLAN-2026-04-27.md` — the most recent end-to-end pivot. It's the closest thing we have to "what a full vertical change looks like".
- `MEMORY.md` rule **`feedback_no_vercel_crons.md`** — new periodic jobs go on Hawk (OpenClaw VPS), **never** in `vercel.json`. The cron list is already at the platform limit.

If any of those have moved on since this runbook was written, trust them and patch this doc on the way out.

---

## 1. Pick a slug

The slug is the short identifier the codebase keys off everywhere. It
**must** match the value of `NEXT_PUBLIC_SITE_VERTICAL` you're going to set
in the new Vercel project.

Constraints:

- Lowercase, no spaces, no punctuation. Existing examples: `tabletop`, `simracing`.
- Distinct from the `siteName` (which is the brand you ship to users —
  `TabletopWatch`, `SimRaceWatch`). Slug is internal; siteName is external.
- Don't reuse a slug that's been retired (e.g. `warhammer` was renamed to
  `tabletop` on 2026-04-27 — see `REBRAND-PLAN-2026-04-27.md` for why).
- Avoid trademarks in either the slug or the siteName.

Note that `lib/site.ts` defaults `getSiteVertical()` to `"tabletop"` when no
env var is set — that's the local-dev fallback, not a real default. Pick a
real slug for production.

---

## 2. Add a config block in `config/verticals.ts`

Open `config/verticals.ts` and add a new entry to the `verticals` record.
Use the existing `tabletop` and `simracing` blocks as the spec.

The `VerticalConfig` interface today requires:

```ts
{
  slug: string;                  // matches NEXT_PUBLIC_SITE_VERTICAL
  name: string;                  // human-readable category, e.g. "Tabletop Gaming"
  description: string;           // one-liner shown in metadata
  brand: {
    siteName: string;            // user-facing brand
    tagline: string;
    domain: string;              // e.g. "newvertical.com"
    logo?: string;               // path to /public/<slug>-logo.svg
  };
  theme: {
    accent: string;              // OKLCH
    accentLight: string;         // OKLCH
    accentGlow: string;          // OKLCH with alpha, used for shadows/halos
  };
  channels: string[];            // primary YouTube channel names ingested by /api/cron/youtube
  miniatureChannels?: string[];  // optional secondary channel set (tabletop uses this for the niche miniatures corner)
  retailers: VerticalRetailer[]; // shown in deals; affiliateParam optional
  categories: string[];          // drives the faction/category filter on /watch + /deals
  watchDescription: string;      // /watch hero copy
  dealsDescription: string;      // /deals hero copy
  liveDescription: string;       // /live hero copy
  twitchGameIds: string[];       // pulled from Twitch dev console, feeds /api/cron/live
  liveSearchTerms: string[];     // YouTube live search terms
  discoverySearchTerms: string[];// keywords for /api/cron/discover (channel auto-discovery)
}
```

Practical tips:

- **Channels list** doesn't have to be exhaustive day one — start with 8–15
  high-signal channels you're confident about, let `/api/cron/discover`
  surface the rest.
- **Retailers** drive the deals scrapers. Only include retailers you have a
  scraper for or plan to add. Existing scrapers live in `lib/scrapers/` —
  Element Games (HTML), Shopify generic (Troll Trader / Moza / Trak Racer),
  eBay Browse API. Re-use the Shopify generic for any new Shopify-on-domain
  retailer.
- **`twitchGameIds`** — fetch from <https://dev.twitch.tv/console> against
  the relevant Game category. Strings, even though they're numeric.
- **`categories`** — these are the chips/filters users see on `/watch` and
  `/deals`. Keep it tight (≤12). They don't have to map 1-to-1 to backend
  facets; the watch page treats them as a freeform faction filter.

Add the new key to the `verticals` record (TypeScript will keep you honest:
`Record<string, VerticalConfig>`). The `verticalList` export updates
automatically.

---

## 3. Buy the domain

Anything that lines up with the `siteName`. Conventions so far:

- TabletopWatch → `tabletopwatch.com`
- SimRaceWatch → `simracewatch.com`

Once the domain resolves, add it as `brand.domain` in the config block.
That's what `app/layout.tsx` uses to build `metadataBase`, so it controls
canonical URLs, OG image absolute URLs, sitemap host, etc.

---

## 4. Create a new Vercel project

Two Vercel projects already point at this repo (`hobbypulse` + `simracewatch`).
The new vertical is project #3.

Steps:

1. Vercel dashboard → New Project → import the same `HobbyPulse` repo.
2. Set **`NEXT_PUBLIC_SITE_VERTICAL`** = your slug (must exactly match
   step 1) on Production, Preview, and Development.
3. Copy across the rest of the env vars from the existing project (Supabase
   keys, Anthropic key, CRON_SECRET, eBay creds, Tealium account, AdSense
   ID, etc.). See `MEMORY.md` → `reference_env_vars.md` for the canonical
   list.
4. Connect the production domain from step 3.
5. **Do not** enable any new Vercel cron jobs. The repo is at the platform
   cron-job limit and the rule is `feedback_no_vercel_crons.md`: periodic
   jobs go on Hawk's OpenClaw cron, not `vercel.json`.

Trigger a deploy. The first deploy will fail closed if `NEXT_PUBLIC_SITE_VERTICAL`
doesn't match a key in `verticals` — `lib/site.ts` throws on unknown slugs.

---

## 5. Theme tokens

Theming is per-vertical via three OKLCH custom properties injected at the
`<body>` level in `app/layout.tsx`:

```tsx
style={{
  "--vertical-accent": config.theme.accent,
  "--vertical-accent-light": config.theme.accentLight,
  "--vertical-accent-glow": config.theme.accentGlow,
}}
```

Existing palettes for reference:

- TabletopWatch: warm teal `oklch(0.62 0.10 200)` — light mode default, warm/playful, post-2026-04-27 rebrand.
- SimRaceWatch: racing red `oklch(0.577 0.245 27.325)` — dark mode default, paddock-and-telemetry mood.

Pick an accent that:

- Reads on both light and dark backgrounds.
- Is distinct from the existing two so users immediately know which site
  they're on.
- Doesn't fight the mascot/brand mood you'll codify in step 6.

**Light vs dark default.** Today, `app/layout.tsx` hardcodes:

```ts
const defaultTheme = config.slug === "tabletop" ? "light" : "dark";
```

When you add the third vertical, **add your slug to that branch** rather
than letting it fall through to the `: "dark"` default by accident. Or
better, refactor it into a `defaultTheme` field on `VerticalConfig` — that
refactor is fair game during the spin-up if you've got 10 minutes for it.

**Logo.** Drop a `/public/<slug>-logo.svg` and reference it as
`brand.logo: "/<slug>-logo.svg"`. Match the proportions of the existing
two SVGs (see `c96111d` for the viewBox lesson — text gets clipped if
the viewBox is too tight; give it breathing room).

**`globals.css`** does **not** currently fork per vertical. Both verticals
share the same surface tokens; only `--vertical-accent*` differs. Don't
add slug-conditional CSS unless you genuinely need it — prefer setting the
right OKLCH values in `config.theme`.

---

## 6. Write `bot/sites/<slug>.md` and brief Hawk

Hawk (PulseBot, on the OpenClaw VPS) operates every site from the same
workspace. The routing index is `bot/REFERENCE.md`; per-site detail lives
in `bot/sites/<slug>.md`. Hawk reads `sites/<slug>.md` **before** drafting
content, briefing image gen, or shipping code for the site.

Copy `bot/sites/tabletopwatch.md` or `bot/sites/simracewatch.md` as the
template. Both follow the same 10-section shape:

1. Direction (lead category, killer feature, killed/banned features)
2. Voice — north star (one-line "what every article must do for the reader")
3. Personas + article blueprints (1 persona per article, mandatory sections per blueprint)
4. Anti-AI rules (banned phrases, required realism)
5. Editorial POV — every article must answer 4 questions
6. Brand language + meta title format
7. Visual identity (image prompt mood — "lean into" + "avoid")
8. Affiliate priority (ordered list)
9. Pre-publish QA checklist
10. Final principle (one-line)

Target ≤4KB. Slim is the point — Hawk loads this on demand.

Then:

- Add a **one-liner** to `bot/REFERENCE.md` under "Sites operated".
- `scp bot/sites/<slug>.md root@vps:/root/.openclaw/workspace-pulsebot/sites/<slug>.md`
  so the live bot picks it up. (Do the same for `REFERENCE.md`.)
- Send a test ping to `@Hobbypulsebot`: *"What sites do you operate?"* —
  it should answer naming all three.

Do **not** put per-site detail in `SOUL.md`, `MEMORY.md`, or
`HEARTBEAT.md`. Those are auto-loaded and per-site facts there bloat every
session.

### Cron parity for the new site

When TabletopWatch went board-game-first, we added SimRaceWatch cron
parity on Hawk's VPS (Phase 0.7 of `REBRAND-PLAN-2026-04-27.md`). Repeat
that pattern for the new vertical: **four crons minimum**, all named
`hawk-<slug>-*`, all with `--message` that names the site so Hawk picks
the right `sites/<slug>.md`:

- `hawk-<slug>-content-queue` — daily, offset from existing site times
- `hawk-<slug>-draft-generator-am` — daily AM
- `hawk-<slug>-deals-roundup` — weekly Friday
- `hawk-<slug>-weekly-planner` — weekly Monday

Use `openclaw cron` from the OpenClaw skill — never `vercel.json`.

Pause Hawk's draft-generator and content-queue crons while you're doing
heavy multi-phase work on the new site (`feedback_rebrand_day_load.md`).
The Codex Pro daily quota is shared across the fleet and rebrand days
exhaust it.

---

## 7. Pick a killer feature

A vertical with no differentiator is a generic content site that nobody
visits. The two existing verticals each have one:

- **TabletopWatch** → Kickstarter tracker (board-game crowdfunding +
  late-pledge affiliate links). Genuine market gap. Phase 4 of the rebrand.
- **SimRaceWatch** → setup guides per sim title + Friday hardware deals
  roundup. Less feature, more rhythm — but the Friday roundup is the
  fixture readers come back for.

For the new vertical, decide on **one** killer feature *before* writing
content. It shapes:

- Which routes you scaffold under `app/(vertical)/` (Kickstarter tracker
  added `/kickstarter`).
- Which scrapers you need (`lib/scrapers/<feature>.ts`).
- Which Supabase table to migrate.
- Which hero CTA goes on the homepage.
- Which affiliate programs are worth applying to.

The questions to ask:

1. Is there a **search-volume gap** on Google for this vertical that
   nobody is owning?
2. Is there an **affiliate path** — does someone pay a referral fee for
   the action this feature drives users towards?
3. Can the **scraper run unattended** on Hawk without hand-holding?
4. Does it produce **content surface area** Hawk can keep feeding?

If the answer to any of those is no, pick a different killer feature.
Don't ship the site without one.

---

## 8. Redirects + per-vertical conditionals

Two layers of vertical-conditional logic exist in the codebase. New
verticals usually need to opt in (or out) of both.

### 8a. `next.config.ts` — redirects + rewrites

Today `next.config.ts` runs a `isTabletop` check and applies a set of
miniatures redirects:

```ts
const miniaturesPrefixes = ["watch", "channels", "trending"];
// /watch → /miniatures/watch (and the reverse via rewrites)
```

If your new vertical needs vertical-specific URL nesting (its own
sub-section, redirect of legacy paths, etc.), follow the same shape:

- Gate behind a slug check (`isSimRacing`, `is<NewSlug>`) at the top of
  the file.
- Return `[]` from `redirects()` / `rewrites()` when the deployment isn't
  yours — Next.js applies all returned rules unconditionally.
- Keep the rules **idempotent** (a permanent redirect followed by a
  rewrite that undoes it is the existing TabletopWatch trick — old URLs
  send a 308, internal links keep working).

### 8b. `slug === "<x>"` branches scattered across the app

Before merging, run:

```bash
grep -rn 'slug === ' app/ components/ lib/ next.config.ts
```

You'll find ~25 conditional branches today. Known hotspots:

- `app/layout.tsx` — default theme
- `app/manifest.ts` / `app/icon.tsx` / `app/apple-icon.tsx` — accent + categories
- `app/opengraph-image.tsx` and `app/(vertical)/trending/opengraph-image.tsx` — OG art
- `app/sitemap.ts` — vertical-specific routes
- `app/llms.txt/route.ts` — LLM-facing site description
- `app/page.tsx` — homepage hero copy
- `app/(vertical)/about/`, `contact/`, `faq/`, `releases/`, `watch/`,
  `channels/`, `trending/`, `deals/` — assorted persona/copy forks
- `app/api/test/route.ts` — health-check suite has slug-conditional checks
  (18 for TabletopWatch, 16 for SimRaceWatch) — add the new vertical's
  count and any vertical-specific assertions

For each match, decide:

- Does the existing `tabletop`/`simracing` branch fit? Add your slug to it.
- Or do you need a third branch? Add it explicitly — don't let it fall
  through silently.

A `// TODO: refactor to per-vertical config` lurking here is fine if the
branch is short. If you find yourself adding more than one or two new
slug branches per file, lift the value onto `VerticalConfig` instead.

### Optional but recommended

- `lib/tealium.ts` — analytics account/profile per vertical.
- `lib/parser.ts` — Claude Haiku content parser is vertical-aware via
  the active config; usually nothing to change, but verify the prompt
  still makes sense for the new niche.
- `lib/affiliate.ts` — UTM tagging + retailer-to-affiliate-link wrapping;
  add the new retailers' affiliate IDs once approved.

---

## Acceptance — when is the new vertical "spun up"?

Tick all of these before declaring the vertical live:

- [ ] `pnpm build` clean on a feature branch with `NEXT_PUBLIC_SITE_VERTICAL=<slug>`.
- [ ] `pnpm dev` locally renders the homepage with the right name, tagline, accent, logo.
- [ ] Vercel project deploys READY on the production domain (per `feedback_check_deploys.md` — verify, don't assume).
- [ ] `GET /api/test` returns all checks green on production.
- [ ] `bot/sites/<slug>.md` exists in repo + on the VPS, and Hawk answers correctly when asked which sites it operates.
- [ ] Four `hawk-<slug>-*` crons scheduled on OpenClaw with offsets that don't collide with the other sites.
- [ ] Killer feature scaffolded (route exists, scraper runs once, table populated, even if data is sparse day one).
- [ ] At least one affiliate program live; applications submitted for the rest.
- [ ] One-liner added to `bot/REFERENCE.md`.
- [ ] Service worker `CACHE_VERSION` bumped if you changed homepage hero / brand / palette (`feedback_bump_sw_on_rebrand.md`).
- [ ] At least one seed blog post live so the homepage isn't empty.

---

## Anti-patterns (don't do these)

- **Don't add `slug === "<newslug>"` branches without a paired refactor TODO.**
  The existing two-vertical fork is a smell that's manageable; three is the
  point at which a `VerticalConfig` field starts paying for itself.
- **Don't add cron jobs to `vercel.json`.** Already at the limit. Hawk owns
  cadence. (`feedback_no_vercel_crons.md`)
- **Don't put per-site facts in `bot/SOUL.md`, `bot/MEMORY.md`, or
  `bot/HEARTBEAT.md`.** They auto-load every session. `bot/sites/<slug>.md`
  is the only place per-site detail belongs.
- **Don't skip the killer feature step.** A vertical without one is a
  generic content site. Pick the differentiator before scaffolding.
- **Don't reuse a retired slug** (e.g. `warhammer`). Old conditionals,
  redirects, and analytics partitions key off it.
- **Don't include a trademark in the slug or `siteName`** (e.g. anything
  ending in "Warhammer"). The same rule that pushed us off `warhammer` to
  `tabletop` applies here.
- **Don't enable the new Vercel project on the existing repo's preview
  comments without a guard.** Preview deploys without `NEXT_PUBLIC_SITE_VERTICAL`
  set fall back to `tabletop`, which is misleading on a SimRace PR.

---

## Future: a `scaffold-vertical.sh` script

PULSE-10's nice-to-have is a script that does steps 2 + 5 + 6 mechanically:

```
scripts/scaffold-vertical.sh <slug> "<Site Name>" "<domain>"
```

It would:

- Append a stub block to `config/verticals.ts` with placeholder OKLCH values.
- Create `bot/sites/<slug>.md` from a template.
- Add the one-liner to `bot/REFERENCE.md`.
- Print the manual follow-ups (domain, Vercel project, killer feature, redirects sweep).

Not built yet — the manual path above is the source of truth until it is.

---

## Source

- `config/verticals.ts` — runtime config interface
- `lib/site.ts` — env-var resolver
- `app/layout.tsx` — theme injection + default-theme fork
- `next.config.ts` — vertical-conditional redirects/rewrites
- `bot/sites/tabletopwatch.md`, `bot/sites/simracewatch.md` — voice doc templates
- `bot/SOUL.md`, `bot/REFERENCE.md` — Hawk's routing index
- `REBRAND-PLAN-2026-04-27.md` — most recent end-to-end vertical change
- `MEMORY.md` — `feedback_no_vercel_crons.md`, `feedback_check_deploys.md`,
  `feedback_rebrand_day_load.md`, `feedback_bump_sw_on_rebrand.md`
