# Affiliate program application copy — TabletopWatch

Drafted 2026-04-27 (Phase 5.2 of board-game-first rebrand). Copy is reusable across programs — swap the retailer name and the program-specific notes. Mikey applies; reapply with the same copy if rejected.

## Pitch in one paragraph (the angle)

TabletopWatch is a content-led tabletop gaming review and deals site for UK board game players. We pivoted board-game-first in April 2026 (the site previously skewed toward miniatures). Lead categories: board game reviews, gateway / "best of" lists, versus comparisons, how-to-play guides, and a live Kickstarter tracker. Voice is enthusiast, opinionated, and trade-off-aware (we always tell readers when to skip a pick). UK pricing, UK retailers, no thin "buy now" pages — every product link sits in a ranked context with rationale.

## Programs to apply to

In priority order. Apply, then drop the resulting affiliate ID into the Vercel env var listed.

| Program | Application URL | Env var |
|---------|----------------|---------|
| **Zatu Games** | https://www.board-game.co.uk/affiliate-programme/ (or contact via `affiliates@zatugames.com`) | `ZATU_AFFILIATE_REF` |
| **Magic Madhouse** | https://www.magicmadhouse.co.uk/affiliates (or `affiliates@magicmadhouse.co.uk`) | `MAGIC_MADHOUSE_AFFILIATE_REF` |
| **Chaos Cards** | https://www.chaoscards.co.uk/affiliates (or `affiliates@chaoscards.co.uk`) | `CHAOS_CARDS_AFFILIATE_REF` |
| **365Games** | https://www.365games.co.uk/affiliates | `GAMES_365_AFFILIATE_REF` |
| **Kienda** | https://www.kienda.co.uk/contact (UK board-game club / discount retailer) | `KIENDA_AFFILIATE_REF` |
| **BackerKit** | https://www.backerkit.com/help/articles/marketing-and-promotion (research per-publisher referral programs — not always centrally managed) | `BACKERKIT_REFERRAL_CODE` |

If any of these change URL: search `<retailer> affiliate program 2026` and apply via the form they list. AWIN, Impact, and Partnerize host some of these (Zatu is on AWIN as of last check).

---

## Application copy — short form (<500 chars)

> TabletopWatch is a UK board-game review and deals site (tabletopwatch.com). Board-game-first content: reviews, gateway lists, versus comparisons, how-to-plays, and a live Kickstarter tracker. UK audience, UK pricing, every product link sits in ranked editorial context. Currently active on Amazon Associates and eBay Partner Network. Looking to add **{{retailer}}** as a priority retailer for our reviews and price-comparison widgets.

---

## Application copy — long form (when the form asks for editorial details)

> **Site**: TabletopWatch — https://tabletopwatch.com
>
> **What we do**: TabletopWatch is a UK-focused board-game content + deals site. We publish board-game reviews, "best of" gateway lists, versus comparisons (e.g. Catan vs Carcassonne), how-to-play guides, and weekly deals roundups. We also operate a live Kickstarter tracker that surfaces board-game crowdfunding campaigns by funding %, days remaining, and late-pledge availability.
>
> **Audience**: UK and EU board-game enthusiasts, gateway-game shoppers, and Kickstarter backers. We pivoted board-game-first in April 2026 — miniatures content has been demoted to a niche corner at /miniatures. Content cadence: 3+ board-game posts per week, weekly Friday deals roundup, hourly Kickstarter tracker refresh.
>
> **How we'd promote {{retailer}}**:
>
> - In-line affiliate links on every "best X for Y" list and review where {{retailer}} stocks the product
> - Per-product price-comparison widget on /boardgames/games/{slug} pages — {{retailer}} would appear as a compared retailer with the lowest price highlighted
> - Weekly deals roundup features {{retailer}}'s deepest discounts from the previous 7 days
> - Kickstarter Tracker post-funding "where to buy at retail" links route to {{retailer}} where applicable
>
> **Existing performance**:
>
> - Amazon Associates and eBay Partner Network — active
> - {{share monthly visit / click numbers when you have them — leave blank for first application}}
>
> **Editorial standards**: Every review and list discloses affiliate relationships. We mark out-of-stock items rather than hiding them. Posts include explicit "skip if" guidance — we don't push products that don't fit the reader. UK pricing in £.
>
> **Contact**: hello@tabletopwatch.com

---

## When you get approved

1. Copy the affiliate ID / ref code into the relevant Vercel env var (Production scope).
2. Trigger a redeploy (or wait for Hawk's next deploy-relevant push).
3. The `lib/affiliate.ts` middleware picks it up automatically — every product link going to that retailer will start carrying the param.
4. Sanity-check by clicking a product link on production and confirming the affiliate param is in the URL.
5. Tick the program off in `MEMORY.md` (`reference_env_vars.md`) so future sessions know it's live.

## When you get rejected

Don't redo the form same day. Wait at least 30 days, sharpen the editorial calendar evidence (screenshots of recent posts, traffic numbers if better), and reapply with the long form. Most rejections are "audience too small" rather than "wrong fit" — give it a quarter.
