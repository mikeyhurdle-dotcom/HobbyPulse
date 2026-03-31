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

export interface VerticalBrand {
  siteName: string;
  tagline: string;
  domain: string;
}

export interface VerticalConfig {
  slug: string;
  name: string;
  description: string;
  brand: VerticalBrand;
  theme: VerticalTheme;
  channels: string[];
  retailers: VerticalRetailer[];
  categories: string[];
  watchDescription: string;
  dealsDescription: string;
  liveDescription: string;
  twitchGameIds: string[];
  liveSearchTerms: string[];
}

export const verticals: Record<string, VerticalConfig> = {
  warhammer: {
    slug: "warhammer",
    name: "Warhammer 40K",
    description: "Battle reports, army lists, and second-hand deals",
    brand: {
      siteName: "TabletopWatch",
      tagline: "Battle reports, army lists, and the best miniature deals",
      domain: "tabletopwatch.com",
    },
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
      "Art of War 40k",
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
    twitchGameIds: ["518030"],
    liveSearchTerms: ["warhammer 40k", "40k battle report"],
  },
  simracing: {
    slug: "simracing",
    name: "Sim Racing",
    description: "Race replays, setup guides, wheels, pedals, and rigs",
    brand: {
      siteName: "SimPitStop",
      tagline: "Race replays, setup guides, and the best hardware deals",
      domain: "simpitstop.com",
    },
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
      "Dan Suzuki",
      "Ermin Hamidovic",
      "Sim Racing Garage",
      "Chris Haye",
      "Karl Gosling",
      "Will Ford",
      "Sim Racing Corner",
      "Laurence Dusoswa",
    ],
    retailers: [
      { name: "Fanatec", url: "https://fanatec.com", affiliateParam: "ref" },
      { name: "Digital Motorsport", url: "https://digital-motorsports.com" },
      { name: "Sim-Lab", url: "https://sim-lab.eu" },
      { name: "Trak Racer", url: "https://trakracer.com", affiliateParam: "ref" },
      { name: "Moza Racing", url: "https://mozaracing.com" },
      { name: "Simagic", url: "https://simagic.com" },
      { name: "Amazon", url: "https://www.amazon.co.uk", affiliateParam: "tag" },
      { name: "eBay", url: "https://www.ebay.co.uk", affiliateParam: "campid" },
    ],
    categories: [
      "iRacing",
      "ACC",
      "LMU",
      "F1",
      "AC",
      "Wheels",
      "Pedals",
      "Rigs & Cockpits",
      "Monitors & VR",
      "Shifters & Handbrakes",
    ],
    watchDescription:
      "Race replays, setup guides, hardware reviews, and tutorials from the sim racing community.",
    dealsDescription:
      "Compare prices on sim racing hardware — wheels, pedals, rigs, and monitors from all major retailers.",
    liveDescription:
      "Live sim racing streams from Twitch and YouTube — updated every 5 minutes.",
    twitchGameIds: ["28080", "506438", "2067888735"],
    liveSearchTerms: ["sim racing", "iracing", "acc", "assetto corsa", "f1 24"],
  },
};

/** Ordered array of all vertical configs (useful for iteration). */
export const verticalList: VerticalConfig[] = Object.values(verticals);
