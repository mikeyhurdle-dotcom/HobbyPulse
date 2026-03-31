// ---------------------------------------------------------------------------
// Faction Affinities — maps equivalent factions across game systems
// ---------------------------------------------------------------------------

export interface FactionAffinity {
  name: string; // "Nurgle" - the thematic link
  factions: { gameSystem: string; categorySlug: string; categoryName: string }[];
}

export const FACTION_AFFINITIES: FactionAffinity[] = [
  {
    name: "Nurgle",
    factions: [
      { gameSystem: "40k", categorySlug: "death-guard", categoryName: "Death Guard" },
      { gameSystem: "aos", categorySlug: "maggotkin-of-nurgle", categoryName: "Maggotkin of Nurgle" },
      { gameSystem: "tow", categorySlug: "chaos-daemons-tow", categoryName: "Chaos Daemons" },
    ],
  },
  {
    name: "Tzeentch",
    factions: [
      { gameSystem: "40k", categorySlug: "thousand-sons", categoryName: "Thousand Sons" },
      { gameSystem: "aos", categorySlug: "disciples-of-tzeentch", categoryName: "Disciples of Tzeentch" },
    ],
  },
  {
    name: "Khorne",
    factions: [
      { gameSystem: "40k", categorySlug: "world-eaters", categoryName: "World Eaters" },
      { gameSystem: "aos", categorySlug: "blades-of-khorne", categoryName: "Blades of Khorne" },
    ],
  },
  {
    name: "Elves",
    factions: [
      { gameSystem: "40k", categorySlug: "aeldari", categoryName: "Aeldari" },
      { gameSystem: "aos", categorySlug: "lumineth-realm-lords", categoryName: "Lumineth Realm-lords" },
      { gameSystem: "tow", categorySlug: "high-elves", categoryName: "High Elves" },
    ],
  },
  {
    name: "Dark Elves",
    factions: [
      { gameSystem: "40k", categorySlug: "drukhari", categoryName: "Drukhari" },
      { gameSystem: "aos", categorySlug: "daughters-of-khaine", categoryName: "Daughters of Khaine" },
      { gameSystem: "tow", categorySlug: "dark-elves", categoryName: "Dark Elves" },
    ],
  },
  {
    name: "Greenskins",
    factions: [
      { gameSystem: "40k", categorySlug: "orks", categoryName: "Orks" },
      { gameSystem: "aos", categorySlug: "ironjawz", categoryName: "Ironjawz" },
      { gameSystem: "tow", categorySlug: "orcs-goblins", categoryName: "Orcs & Goblins" },
      { gameSystem: "kt", categorySlug: "ork-kommandos", categoryName: "Ork Kommandos" },
    ],
  },
  {
    name: "Undead",
    factions: [
      { gameSystem: "40k", categorySlug: "necrons", categoryName: "Necrons" },
      { gameSystem: "aos", categorySlug: "ossiarch-bonereapers", categoryName: "Ossiarch Bonereapers" },
      { gameSystem: "tow", categorySlug: "tomb-kings", categoryName: "Tomb Kings" },
    ],
  },
  {
    name: "Chaos Warriors",
    factions: [
      { gameSystem: "40k", categorySlug: "chaos-space-marines", categoryName: "Chaos Space Marines" },
      { gameSystem: "aos", categorySlug: "slaves-to-darkness", categoryName: "Slaves to Darkness" },
      { gameSystem: "tow", categorySlug: "warriors-of-chaos", categoryName: "Warriors of Chaos" },
      { gameSystem: "kt", categorySlug: "legionaries-kt", categoryName: "Legionaries" },
    ],
  },
  {
    name: "Space Marines / Stormcast",
    factions: [
      { gameSystem: "40k", categorySlug: "space-marines", categoryName: "Space Marines" },
      { gameSystem: "aos", categorySlug: "stormcast-eternals", categoryName: "Stormcast Eternals" },
      { gameSystem: "tow", categorySlug: "the-empire", categoryName: "The Empire" },
    ],
  },
  {
    name: "Bugs / Lizards",
    factions: [
      { gameSystem: "40k", categorySlug: "tyranids", categoryName: "Tyranids" },
      { gameSystem: "aos", categorySlug: "seraphon", categoryName: "Seraphon" },
      { gameSystem: "tow", categorySlug: "lizardmen", categoryName: "Lizardmen" },
    ],
  },
];

// Given a category slug and game system, find related factions in OTHER game systems
export function findAffineFactions(
  categorySlug: string,
  gameSystem: string,
): { gameSystem: string; categorySlug: string; categoryName: string }[] {
  for (const affinity of FACTION_AFFINITIES) {
    const match = affinity.factions.find(
      (f) => f.categorySlug === categorySlug && f.gameSystem === gameSystem,
    );
    if (match) {
      return affinity.factions.filter((f) => f.gameSystem !== gameSystem);
    }
  }
  return [];
}
