export interface Vertical {
  slug: string;
  name: string;
  description: string;
  theme: {
    accent: string;
    accentLight: string;
  };
  channels: string[];
  retailers: string[];
  categories: string[];
}

export const verticals: Record<string, Vertical> = {
  warhammer: {
    slug: "warhammer",
    name: "Warhammer 40K",
    description: "Battle reports, army lists, and second-hand deals",
    theme: {
      accent: "#7c3aed",
      accentLight: "#a78bfa",
    },
    channels: [
      "Tabletop Titans",
      "PlayOn Tabletop",
      "MWG Studios",
      "Winters SEO",
      "Auspex Tactics",
      "Art of War",
      "Mordian Glory",
      "Guerrilla Miniature Games",
      "The Honest Wargamer",
      "Striking Scorpion 82",
      "Tabletop Tactics",
    ],
    retailers: [
      "Games Workshop",
      "Element Games",
      "Wayland Games",
      "Troll Trader",
      "eBay",
    ],
    categories: [],
  },
  simracing: {
    slug: "simracing",
    name: "Sim Racing",
    description: "Race replays, setup guides, wheels and rigs",
    theme: {
      accent: "#dc2626",
      accentLight: "#f87171",
    },
    channels: [
      "Jimmy Broadbent",
      "Jardier",
      "Dave Cam",
      "Aris Drives",
      "Coach Dave Academy",
      "Boosted Media",
    ],
    retailers: [
      "Fanatec",
      "Digital Motorsport",
      "Amazon",
    ],
    categories: ["iRacing", "ACC", "LMU", "F1", "AC"],
  },
};
