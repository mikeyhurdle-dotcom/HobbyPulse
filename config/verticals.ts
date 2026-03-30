// ---------------------------------------------------------------------------
// Vertical Config — single source of truth for all vertical-specific data
// ---------------------------------------------------------------------------

export interface VerticalRetailer {
  name: string;
  url: string;
  affiliateParam?: string;
}

export interface VerticalTheme {
  accent: string;
  accentLight: string;
}

export interface VerticalConfig {
  slug: string;
  name: string;
  description: string;
  theme: VerticalTheme;
  channels: string[];
  retailers: VerticalRetailer[];
  categories: string[];
  watchDescription: string;
  dealsDescription: string;
  liveDescription: string;
}

export const verticals: Record<string, VerticalConfig> = {
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
      { name: "Games Workshop", url: "https://www.games-workshop.com", affiliateParam: "ref" },
      { name: "Element Games", url: "https://elementgames.co.uk", affiliateParam: "ref" },
      { name: "Wayland Games", url: "https://www.waylandgames.co.uk", affiliateParam: "ref" },
      { name: "Troll Trader", url: "https://thetrolltrader.com" },
      { name: "eBay", url: "https://www.ebay.co.uk", affiliateParam: "campid" },
    ],
    categories: [
      "Space Marines",
      "Chaos Space Marines",
      "Aeldari",
      "Tyranids",
      "Orks",
      "Necrons",
      "Death Guard",
      "Tau Empire",
      "Adeptus Mechanicus",
      "Imperial Knights",
    ],
    watchDescription:
      "Battle reports and content — enriched with structured army lists.",
    dealsDescription:
      "Compare prices across retailers and find the best deals on miniatures.",
    liveDescription:
      "Live streams from Twitch and YouTube — updated every 5 minutes.",
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
      { name: "Fanatec", url: "https://fanatec.com", affiliateParam: "ref" },
      { name: "Digital Motorsport", url: "https://digital-motorsports.com" },
      { name: "Amazon", url: "https://www.amazon.co.uk", affiliateParam: "tag" },
    ],
    categories: ["iRacing", "ACC", "LMU", "F1", "AC"],
    watchDescription:
      "Race replays, setup guides, and tutorials from the community.",
    dealsDescription:
      "Compare prices on sim racing hardware — wheels, pedals, and rigs.",
    liveDescription:
      "Live sim racing streams from Twitch and YouTube — updated every 5 minutes.",
  },
};

/** Ordered array of all vertical configs (useful for iteration). */
export const verticalList: VerticalConfig[] = Object.values(verticals);
