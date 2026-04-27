# TabletopWatch Mascot — The Fox

Decided 2026-04-27 (Phase 3.1 of board-game-first rebrand). Mikey picked **Option B** — a friendly animal "game master" character — and chose **fox** as the species.

## Concept

A friendly fox **game master** — the host who runs the table. Slightly tilted ears, a warm half-smile, and a lit-up "I just had a great idea about this turn" look. Character first, prop second; the fox is the brand voice, not just a logo accessory.

## Personality

- **Warm + curious** — leans forward, makes eye contact, never bored
- **Plays fair, plays hard** — knows the rules, will help you learn them, will also crush you
- **Gently teasing** — landing-page taglines and CTAs can have a wink to them
- **Not gimmicky** — no dumb hat, no exaggerated "QUIRKY" expression. Confident, not goofy

Vibe reference points (in case you brief a designer or AI):
- Disney's *Robin Hood* fox (warmth + cleverness, not the smugness)
- The Owl from Blizzard's old loot icons (friendly authority)
- Dice Tower's founder energy (hobbyist enthusiast who's been at it 20 years)

**Avoid:** swords, armour, gothic anything (that's Imperial Gold territory we just left). No anime stylisation. No "epic" framing. Friendly community member, not slayer.

## Visual brief

- **Body shape**: stocky, plush, easy to read at 32×32 (favicon size). Big round ears, big eyes, small triangle nose. NOT fashion-runway "slender fox".
- **Fur**: warm rust orange (matches future warm-teal accent — complementary, not clashing)
- **Outline**: clean dark line, no painterly noise. Should hold up flat on cream backgrounds and inverted on charcoal.
- **Pose**: 3/4 view, paws around / on a board game piece (meeple in one paw, dice in the other is fine), looking *up at the viewer* (welcoming) not *off into the distance* (heroic).
- **Style**: friendly modern flat illustration with selective shading. Think contemporary children's book hero crossed with a clean app mascot — not 2015 corporate-flat, not deep-shaded fantasy.

## Palette (from Phase 3.2)

- **Accent**: warm teal `oklch(0.62 0.10 200)` ≈ hex `#3a9a9a`
- **Mascot fur**: rust orange (~`#c46a3a`) — complementary to teal on the colour wheel
- **Backgrounds**: cream `#fafafa` light mode, warm charcoal `#1a1815` dark mode
- **Light mode is default** for TabletopWatch (board game audience). System preference still respected.

## Naming

Open question. Some options to throw at Mikey when ready:
- **Quill** — friendly, suggests "took a note", a fox character could hold a feather pen at the table
- **Foxy** — too generic, skip
- **Reynard** — classic fox name from European folklore (the trickster game-master archetype)
- **Pip** — short, warm, mascot-coded
- **Beck** — short, modern, easy to brand

Recommendation: **Quill** if you want the "note taker / scribe" angle (fits a watch/review site nicely); **Reynard** if you want gravitas + folklore.

## Where the mascot lives

- Hero illustration on `/` (right-hand side, looking at the headline)
- Empty-state illustrations (no results in /watch, /deals)
- 404 page
- Email newsletter header
- Social avatars on Bluesky/Threads/Instagram (square crop of the head)
- Favicon — simplified head only (no body, no props) at 32×32 / 512×512

## Production path

This brief feeds an external image-gen tool or a designer. Suggested prompt skeleton for AI image gen:

> Friendly modern flat illustration of a stocky rust-orange fox character, 3/4 view, big round ears and big eyes, small triangle nose, warm half-smile. Confident but welcoming, looking directly at the viewer. Holding a wooden meeple in one paw, a colourful 6-sided die in the other. Clean dark linework, selective soft shading. Cream background `#fafafa`. Style: contemporary children's book hero meets clean app mascot. Not fantasy, not anime, not corporate-flat. No armour, no weapons, no gothic motifs. Should read clearly at 32×32 favicon size when cropped to head only.

Generate variations at:
1. Hero-size (1200×800 transparent PNG)
2. Avatar (1024×1024 transparent PNG, head only)
3. Favicon (512×512, simplified head, transparent)

## Status

- [x] Direction chosen (animal game master)
- [x] Species chosen (fox)
- [x] Palette chosen (warm teal accent, light default)
- [ ] Hero illustration generated
- [ ] Avatar generated
- [ ] Favicon (replace `app/icon.tsx` ImageResponse with the fox head)
- [ ] Name chosen (recommend Quill)
- [ ] Wired into homepage hero
- [ ] Wired into 404 + empty states

The first three boxes are this commit. The remaining boxes need actual artwork — handled separately from the code rebrand.
