// ---------------------------------------------------------------------------
// Games Workshop RRP Baseline
// ---------------------------------------------------------------------------
// Static lookup of GW recommended retail prices (in pence).
// Used to calculate savings vs RRP for third-party retailer listings.
// ---------------------------------------------------------------------------

interface RrpEntry {
  name: string;
  rrpPence: number;
  keywords: string[];
}

// ---------------------------------------------------------------------------
// RRP Table — popular kits (prices in pence, GBP)
// ---------------------------------------------------------------------------

const RRP_TABLE: RrpEntry[] = [
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

/**
 * Look up the GW RRP for a product by name (fuzzy match).
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

  // 2. Try keyword match — best match = most keywords matched
  let bestMatch: RrpEntry | null = null;
  let bestScore = 0;

  for (const entry of RRP_TABLE) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (input.includes(kw)) {
        score += kw.length; // longer keyword matches are worth more
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  // Require at least one keyword to match
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
