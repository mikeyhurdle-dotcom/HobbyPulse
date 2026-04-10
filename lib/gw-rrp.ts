// ---------------------------------------------------------------------------
// RRP Baseline — manufacturer recommended retail prices
// ---------------------------------------------------------------------------
// Static lookup of RRPs (in pence) for tabletop and sim racing products.
// Used to calculate savings vs RRP for third-party retailer listings.
// ---------------------------------------------------------------------------

interface RrpEntry {
  name: string;
  rrpPence: number;
  keywords: string[];
}

// ---------------------------------------------------------------------------
// Tabletop RRP Table — GW products (prices in pence, GBP)
// ---------------------------------------------------------------------------

const TABLETOP_RRP: RrpEntry[] = [
  // Combat Patrols
  { name: "Combat Patrol: Space Marines", rrpPence: 8500, keywords: ["combat patrol", "space marines"] },
  { name: "Combat Patrol: Orks", rrpPence: 8500, keywords: ["combat patrol", "orks"] },
  { name: "Combat Patrol: Tyranids", rrpPence: 8500, keywords: ["combat patrol", "tyranids"] },
  { name: "Combat Patrol: Necrons", rrpPence: 8500, keywords: ["combat patrol", "necrons"] },
  { name: "Combat Patrol: Death Guard", rrpPence: 8500, keywords: ["combat patrol", "death guard"] },
  { name: "Combat Patrol: Aeldari", rrpPence: 8500, keywords: ["combat patrol", "aeldari", "eldar"] },
  { name: "Combat Patrol: Thousand Sons", rrpPence: 8500, keywords: ["combat patrol", "thousand sons"] },
  { name: "Combat Patrol: T'au Empire", rrpPence: 8500, keywords: ["combat patrol", "tau", "t'au"] },
  { name: "Combat Patrol: Adeptus Mechanicus", rrpPence: 8500, keywords: ["combat patrol", "admech", "adeptus mechanicus"] },
  { name: "Combat Patrol: Blood Angels", rrpPence: 8500, keywords: ["combat patrol", "blood angels"] },
  { name: "Combat Patrol: Dark Angels", rrpPence: 8500, keywords: ["combat patrol", "dark angels"] },
  { name: "Combat Patrol: Drukhari", rrpPence: 8500, keywords: ["combat patrol", "drukhari", "dark eldar"] },

  // Character models
  { name: "Lion El'Jonson", rrpPence: 4250, keywords: ["lion el'jonson", "lion el jonson"] },
  { name: "Roboute Guilliman", rrpPence: 4250, keywords: ["roboute guilliman", "guilliman"] },
  { name: "Abaddon the Despoiler", rrpPence: 4250, keywords: ["abaddon", "despoiler"] },
  { name: "Commissar Yarrick", rrpPence: 2250, keywords: ["commissar yarrick", "yarrick"] },
  { name: "Ghazghkull Thraka", rrpPence: 4000, keywords: ["ghazghkull", "thraka"] },
  { name: "The Silent King", rrpPence: 9500, keywords: ["silent king", "szarekh"] },
  { name: "Mortarion", rrpPence: 9500, keywords: ["mortarion"] },
  { name: "Magnus the Red", rrpPence: 9500, keywords: ["magnus the red", "magnus"] },

  // Common unit kits
  { name: "Intercessors", rrpPence: 3750, keywords: ["intercessors"] },
  { name: "Assault Intercessors", rrpPence: 3750, keywords: ["assault intercessors"] },
  { name: "Terminators", rrpPence: 4000, keywords: ["terminators", "terminator squad"] },
  { name: "Bladeguard Veterans", rrpPence: 3250, keywords: ["bladeguard veterans", "bladeguard"] },
  { name: "Eradicators", rrpPence: 3250, keywords: ["eradicators"] },
  { name: "Hellblasters", rrpPence: 3750, keywords: ["hellblasters"] },
  { name: "Redemptor Dreadnought", rrpPence: 4500, keywords: ["redemptor dreadnought", "redemptor"] },
  { name: "Ballistus Dreadnought", rrpPence: 4000, keywords: ["ballistus dreadnought", "ballistus"] },
  { name: "Leman Russ Battle Tank", rrpPence: 4000, keywords: ["leman russ"] },
  { name: "Kabalite Warriors", rrpPence: 2750, keywords: ["kabalite warriors"] },

  // Starter / big boxes
  { name: "Leviathan", rrpPence: 15000, keywords: ["leviathan"] },
  { name: "Ultimate Starter Set", rrpPence: 13000, keywords: ["ultimate starter set"] },
];

// ---------------------------------------------------------------------------
// Sim Racing RRP Table — hardware (prices in pence, GBP)
// ---------------------------------------------------------------------------

const SIMRACING_RRP: RrpEntry[] = [
  // Fanatec Wheelbases
  { name: "Fanatec CSL DD", rrpPence: 34995, keywords: ["csl dd", "fanatec csl"] },
  { name: "Fanatec CSL DD Pro", rrpPence: 44995, keywords: ["csl dd pro"] },
  { name: "Fanatec GT DD Pro", rrpPence: 59995, keywords: ["gt dd pro"] },
  { name: "Fanatec ClubSport DD", rrpPence: 74995, keywords: ["clubsport dd"] },
  { name: "Fanatec ClubSport DD+", rrpPence: 99995, keywords: ["clubsport dd+"] },

  // Moza Wheelbases
  { name: "Moza R5", rrpPence: 24999, keywords: ["moza r5"] },
  { name: "Moza R9", rrpPence: 44999, keywords: ["moza r9"] },
  { name: "Moza R12", rrpPence: 59999, keywords: ["moza r12"] },
  { name: "Moza R16", rrpPence: 89999, keywords: ["moza r16"] },
  { name: "Moza R21", rrpPence: 119999, keywords: ["moza r21"] },

  // Simagic
  { name: "Simagic Alpha Mini", rrpPence: 39999, keywords: ["simagic alpha mini"] },
  { name: "Simagic Alpha", rrpPence: 74999, keywords: ["simagic alpha"] },
  { name: "Simagic Alpha U", rrpPence: 109999, keywords: ["simagic alpha u"] },

  // Fanatec Pedals
  { name: "Fanatec CSL Pedals", rrpPence: 7995, keywords: ["csl pedals"] },
  { name: "Fanatec CSL Pedals LC", rrpPence: 13995, keywords: ["csl pedals lc", "csl loadcell"] },
  { name: "Fanatec ClubSport Pedals V3", rrpPence: 35995, keywords: ["clubsport pedals v3"] },

  // Moza Pedals
  { name: "Moza CRP Pedals", rrpPence: 19999, keywords: ["moza crp"] },
  { name: "Moza SRP Pedals", rrpPence: 29999, keywords: ["moza srp"] },

  // Wheels
  { name: "Fanatec CSL Steering Wheel", rrpPence: 9995, keywords: ["csl steering wheel", "csl wheel"] },
  { name: "Fanatec ClubSport RS", rrpPence: 29995, keywords: ["clubsport rs"] },
  { name: "Moza ES Steering Wheel", rrpPence: 14999, keywords: ["moza es wheel"] },
  { name: "Moza GS Steering Wheel", rrpPence: 19999, keywords: ["moza gs wheel"] },

  // Rigs
  { name: "Sim-Lab GT1 Evo", rrpPence: 49900, keywords: ["sim-lab gt1", "gt1 evo"] },
  { name: "Sim-Lab P1-X", rrpPence: 59900, keywords: ["sim-lab p1-x", "p1-x"] },
  { name: "Trak Racer TR160", rrpPence: 44900, keywords: ["trak racer tr160", "tr160"] },
  { name: "Trak Racer TR80", rrpPence: 29900, keywords: ["trak racer tr80", "tr80"] },
  { name: "Next Level Racing F-GT", rrpPence: 34999, keywords: ["f-gt", "next level racing"] },
  { name: "Playseat Trophy", rrpPence: 49999, keywords: ["playseat trophy"] },

  // Monitors
  { name: "Samsung Odyssey G9", rrpPence: 99999, keywords: ["odyssey g9", "samsung g9"] },
  { name: "Samsung Odyssey Neo G9", rrpPence: 179999, keywords: ["odyssey neo g9", "neo g9"] },
  { name: "Dell AW3423DWF", rrpPence: 79999, keywords: ["aw3423dwf", "dell ultrawide"] },

  // VR
  { name: "Meta Quest 3", rrpPence: 47999, keywords: ["quest 3", "meta quest 3"] },
  { name: "Pimax Crystal", rrpPence: 159999, keywords: ["pimax crystal"] },
];

// ---------------------------------------------------------------------------
// Fuzzy match
// ---------------------------------------------------------------------------

function normalise(str: string): string {
  return str
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^a-z0-9' ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Combined RRP table — searched in order. */
const RRP_TABLE: RrpEntry[] = [...TABLETOP_RRP, ...SIMRACING_RRP];

/**
 * Look up the RRP for a product by name (fuzzy match).
 * Returns the price in pence, or null if no match found.
 */
export function getGwRrp(productName: string): number | null {
  const input = normalise(productName);

  // 1. Try exact name match
  for (const entry of RRP_TABLE) {
    if (normalise(entry.name) === input) {
      return entry.rrpPence;
    }
  }

  // 2. Try keyword match — best match = most keywords matched.
  // To avoid false positives (e.g. "Death Guard Green" paint matching the
  // Combat Patrol: Death Guard entry), we require ALL keywords of the winning
  // entry to appear in the product name. Single-keyword entries must also
  // appear as a distinct phrase (not a substring of an unrelated word).
  let bestMatch: RrpEntry | null = null;
  let bestScore = 0;

  for (const entry of RRP_TABLE) {
    let score = 0;
    let allMatched = true;
    for (const kw of entry.keywords) {
      if (input.includes(kw)) {
        score += kw.length;
      } else {
        allMatched = false;
      }
    }
    // Only consider entries where every keyword matched
    if (allMatched && score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  if (bestMatch && bestScore > 0) {
    return bestMatch.rrpPence;
  }

  return null;
}

/**
 * Calculate savings vs GW RRP.
 */
export function getSavings(
  pricePence: number,
  productName: string,
): { rrp: number; saving: number; percent: number } | null {
  const rrp = getGwRrp(productName);
  if (rrp === null) return null;

  const saving = rrp - pricePence;
  const percent = rrp > 0 ? Math.round((saving / rrp) * 100) : 0;

  return { rrp, saving, percent };
}
