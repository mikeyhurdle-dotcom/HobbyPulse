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
  accentGlow: string;
}

export interface VerticalBrand {
  siteName: string;
  tagline: string;
  domain: string;
  logo?: string; // path to SVG in /public, e.g. "/tabletopwatch-logo.svg"
}

export interface VerticalConfig {
  slug: string;
  name: string;
  description: string;
  brand: VerticalBrand;
  theme: VerticalTheme;
  channels: string[];
  miniatureChannels?: string[];
  retailers: VerticalRetailer[];
  categories: string[];
  watchDescription: string;
  dealsDescription: string;
  liveDescription: string;
  twitchGameIds: string[];
  liveSearchTerms: string[];
  discoverySearchTerms: string[];
}

export const verticals: Record<string, VerticalConfig> = {
  tabletop: {
    slug: "tabletop",
    name: "Tabletop Gaming",
    description: "Board games first — reviews, video guides, deals, and the latest from Kickstarter. Plus a niche corner for miniatures.",
    brand: {
      siteName: "TabletopWatch",
      tagline: "Your guide to tabletop gaming — board games first",
      domain: "tabletopwatch.com",
      logo: "/tabletopwatch-logo.svg",
    },
    theme: {
      accent: "oklch(0.62 0.10 200)",       // warm teal
      accentLight: "oklch(0.72 0.09 200)",  // lighter teal
      accentGlow: "oklch(0.62 0.10 200 / 0.15)",
    },
    channels: [
      "The Dice Tower",
      "Shut Up & Sit Down",
      "Watch It Played",
      "No Pun Included",
      "Rahdo Runs Through",
      "BoardGameCo",
      "3 Minute Board Games",
      "Actualol",
      "Quackalope",
      "Before You Play",
      "Nights Around a Table",
      "The Brothers Murph",
      "Shelfside",
      "Gaming Rules!",
      "One Stop Co-op Shop",
      "JonGetsGames",
      "The Game Boy Geek",
      "Tantrum House",
      "Meeple University",
      "So Very Wrong About Games",
    ],
    miniatureChannels: [
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
      { name: "Goblin Gaming", url: "https://www.goblingaming.co.uk" },
      { name: "Magic Madhouse", url: "https://www.magicmadhouse.co.uk" },
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
      "Board game reviews, playthroughs, and how-to-play guides from 20+ channels.",
    dealsDescription:
      "Compare prices across retailers and find the best deals on board games and miniatures.",
    liveDescription:
      "Live streams from Twitch and YouTube — updated every 5 minutes.",
    twitchGameIds: ["518030"],
    liveSearchTerms: ["warhammer 40k", "40k battle report"],
    discoverySearchTerms: [
      "warhammer 40k battle report",
      "40k batrep",
      "warhammer 40000 vs",
      "age of sigmar battle report",
      "aos batrep",
      "old world battle report",
      "warhammer fantasy battle report",
      "kill team battle report",
    ],
  },
  simracing: {
    slug: "simracing",
    name: "Sim Racing",
    description: "Race replays, setup guides, wheels, pedals, and rigs",
    brand: {
      siteName: "SimRaceWatch",
      tagline: "Hardware deals, setup guides, and race replays — from sim racers who post their lap times.",
      domain: "simracewatch.com",
      logo: "/simracewatch-logo.svg",
    },
    theme: {
      accent: "oklch(0.577 0.245 27.325)",   // racing red
      accentLight: "oklch(0.65 0.22 25)",     // lighter red
      accentGlow: "oklch(0.577 0.245 27.325 / 0.15)",
    },
    channels: [
      "Jimmy Broadbent",
      "Jardier",
      "Dave Cam",
      "Aris Drives",
      "Coach Dave Academy",
      "Boosted Media",
      "Dan Suzuki",
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
    discoverySearchTerms: [
      "sim racing race replay",
      "iracing race onboard",
      "acc race highlights",
    ],
  },
};

/** Ordered array of all vertical configs (useful for iteration). */
export const verticalList: VerticalConfig[] = Object.values(verticals);
