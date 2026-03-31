---
type: strategy
project: HobbyPulse
created: 2026-03-31
---

# TabletopWatch — Game System Expansion Plan

## Architecture

All games live on one site (TabletopWatch). Each game is a "game system" with its own:
- Colour code (instant visual scanning)
- Factions/categories in Supabase
- YouTube channels (many overlap across GW games)
- Discovery search terms
- Parser prompt variant

The Watch page defaults to a mixed feed with game system badges. Users can filter by game system. Cross-system recommendations based on faction affinity drive discovery.

## Colour System

| Game System | Colour | Hex | Badge Text |
|-------------|--------|-----|-----------|
| Warhammer 40K | Purple | `#7c3aed` | 40K |
| Age of Sigmar | Gold | `#d97706` | AoS |
| The Old World | Deep Red | `#991b1b` | TOW |
| Kill Team | Teal | `#0d9488` | KT |
| Horus Heresy | Steel Blue | `#475569` | 30K |
| One Page Rules | Orange | `#ea580c` | OPR |
| Star Wars Legion | Yellow | `#eab308` | SWL |
| BattleTech | Green | `#16a34a` | BT |

Visual treatment per card:
- 4px coloured left border on the card
- Game badge pill on thumbnail (top-left, game colour background)
- Hover glow matches game colour
- Filter pills use game colour when active

## Faction Affinities (Cross-System Recommendations)

| 40K | AoS | Old World | Kill Team |
|-----|-----|-----------|-----------|
| Death Guard / Nurgle Daemons | Maggotkin of Nurgle | Nurgle Daemons | Death Guard KT |
| Thousand Sons / Tzeentch Daemons | Disciples of Tzeentch | Tzeentch Daemons | Thousand Sons KT |
| World Eaters / Khorne Daemons | Blades of Khorne | Khorne Daemons | World Eaters KT |
| Aeldari | Lumineth Realm-lords | High Elves | Aeldari KT |
| Drukhari | Daughters of Khaine | Dark Elves | Hand of the Archon KT |
| Orks | Ironjawz / Kruleboyz | Orcs & Goblins | Ork Kommandos KT |
| Tyranids | — | — | Brood Coven KT |
| Necrons | Ossiarch Bonereapers | Tomb Kings | Hierotek Circle KT |
| Space Marines | Stormcast Eternals | The Empire | Space Marine KT |
| Chaos Space Marines | Slaves to Darkness | Warriors of Chaos | Legionaries KT |
| Imperial Knights | — | Bretonnian Knights | — |
| T'au | — | — | Pathfinder KT |

## Expansion Phases

### Sprint 1 (today): GW Core Games
- Age of Sigmar — factions, channels, parser update
- The Old World — factions, channels
- Kill Team — factions (subset of 40K factions)
- Game system colour coding in UI
- Game system filter on Watch page
- Cross-system recommendation component

### Sprint 2 (next session): Extended Universe
- Horus Heresy (30K)
- One Page Rules (Grimdark Future + Age of Fantasy)
- Update discovery search terms per game

### Sprint 3 (future): Non-GW Games
- Star Wars Legion / Shatterpoint
- BattleTech
- Evaluate based on traffic data

## Channels by Game

### Already monitored (produce multi-game content)
- Tabletop Titans — 40K, AoS
- Tabletop Tactics — 40K, AoS, Old World, Kill Team
- MiniWarGaming — 40K, AoS, One Page Rules, Kill Team
- Guerrilla Miniature Games — 40K, AoS, Old World, many others
- Winters SEO — 40K primarily
- PlayOn Tabletop — 40K, AoS
- Striking Scorpion 82 — 40K, AoS, Kill Team

### Need to add
- **AoS specific:** Rerolling Ones, AoS Coach, Warhammer Weekly
- **Old World specific:** Loremaster of Sotek, The Old World Lives
- **Kill Team specific:** Glass Half Dead, Can You Roll a Crit
- **One Page Rules:** OPR official channel, MiniWarGaming OPR series

## Data Model

The `battle_reports` table needs a `game_system` column (text). Values: "40k", "aos", "tow", "kt", "30k", "opr", etc.

The classifier (`lib/classify.ts`) needs game system detection from title keywords:
- "age of sigmar" / "AoS" / "sigmar" → aos
- "old world" / "TOW" / "warhammer fantasy" → tow
- "kill team" / "killteam" → kt
- "horus heresy" / "30k" / "heresy" → 30k
- "grimdark future" / "age of fantasy" / "OPR" / "one page rules" → opr
- Default if none match → 40k (since most channels are 40K-primary)
