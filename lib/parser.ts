import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedUnit {
  name: string;
  qty: number;
  points: number;
  enhancements: string[];
  wargear: string[];
}

export interface ParsedList {
  faction: string;
  detachment: string;
  units: ParsedUnit[];
  total_points: number;
  player_name: string | null;
  raw_text: string;
  confidence: number;
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPTS: Record<string, string> = {
  warhammer: `You are an expert Warhammer 40,000 army list parser. Your job is to extract structured army list data from YouTube video descriptions.

Army lists can appear in several formats:
- **BattleScribe** format: structured with headers like "++ Battalion Detachment ++", unit entries with point costs in brackets
- **New Recruit** format: similar structure but may use different delimiters, often with "Points:" labels
- **Hand-typed** format: informal lists with unit names and points, sometimes just a simple list

For each army list you find, extract:
1. **faction** — the faction/army name (e.g. "Space Marines", "Orks", "Aeldari")
2. **detachment** — the detachment name if specified (e.g. "Gladius Task Force", "Waaagh! Tribe")
3. **units** — each unit with:
   - name: the unit name
   - qty: number of models/units (default 1 if not specified)
   - points: point cost (0 if not specified)
   - enhancements: any enhancements/relics/warlord traits attached
   - wargear: any specific wargear options mentioned
4. **total_points** — the total points for the list (sum if not explicitly stated)
5. **player_name** — the player name if mentioned near the list
6. **raw_text** — the raw text segment that contains this list
7. **confidence** — how confident you are this is a real army list (0.0 to 1.0)

Return a JSON array of army lists. If the description contains NO army lists, return an empty array [].

IMPORTANT:
- Many video descriptions do NOT contain army lists — they may just have social links, sponsor info, etc. Return [] in that case.
- A list of unit names with points IS an army list. Random mentions of factions or units in prose are NOT.
- Be strict about confidence: only return lists with confidence >= 0.3
- Return ONLY valid JSON, no markdown code fences, no explanation.`,

  simracing: `You are an expert sim racing content parser. Your job is to extract structured setup and hardware data from YouTube video descriptions.

Content can include:
- **Car setups**: sim, car, track, setup details (tyre pressures, camber, ride height, etc.)
- **Hardware reviews**: product names, specs, prices mentioned
- **Race results**: finishing positions, lap times, incidents

For each structured data block you find, extract:
1. **faction** — the sim/game name (e.g. "iRacing", "ACC", "F1 24") or hardware category (e.g. "Wheels", "Pedals")
2. **detachment** — the car or product name (e.g. "Porsche 911 GT3 R", "Fanatec CSL DD")
3. **units** — each detail/component with:
   - name: the setting name or component (e.g. "Front Ride Height", "Brake Bias", "Wheelbase", "Pedals")
   - qty: 1 (default)
   - points: numeric value if applicable (0 otherwise)
   - enhancements: any modifiers or notes
   - wargear: any specific specs or options
4. **total_points** — 0 (not applicable)
5. **player_name** — the driver/reviewer name if mentioned
6. **raw_text** — the raw text segment
7. **confidence** — how confident you are this is structured content (0.0 to 1.0)

Return a JSON array. If the description contains NO structured setup/hardware data, return [].

IMPORTANT:
- Many descriptions just have social links and sponsor info. Return [] for those.
- Only extract genuine setup data, hardware specs, or race results — not casual mentions.
- Return ONLY valid JSON, no markdown code fences, no explanation.`,
};

const DEFAULT_PROMPT = SYSTEM_PROMPTS.warhammer;

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

const client = new Anthropic();

export async function parseArmyList(
  description: string,
  vertical: string = "warhammer",
): Promise<ParsedList[]> {
  if (!description || description.trim().length < 20) {
    return [];
  }

  const systemPrompt = SYSTEM_PROMPTS[vertical] ?? DEFAULT_PROMPT;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Extract army lists from this YouTube video description:\n\n---\n${description}\n---`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  try {
    // Strip any accidental markdown fences
    const cleaned = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    const parsed: ParsedList[] = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) return [];

    // Filter low-confidence results and normalise
    return parsed
      .filter((list) => list.confidence >= 0.3)
      .map((list) => ({
        faction: list.faction ?? "Unknown",
        detachment: list.detachment ?? "",
        units: (list.units ?? []).map((u: ParsedUnit) => ({
          name: u.name ?? "Unknown Unit",
          qty: u.qty ?? 1,
          points: u.points ?? 0,
          enhancements: Array.isArray(u.enhancements) ? u.enhancements : [],
          wargear: Array.isArray(u.wargear) ? u.wargear : [],
        })),
        total_points: list.total_points ?? 0,
        player_name: list.player_name ?? null,
        raw_text: list.raw_text ?? "",
        confidence: list.confidence ?? 0,
      }));
  } catch {
    console.error("Failed to parse Haiku response:", text.slice(0, 200));
    return [];
  }
}
