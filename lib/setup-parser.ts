import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedSetup {
  sim: string;
  car: string;
  track: string | null;
  setupData: {
    frontRideHeight?: string;
    rearRideHeight?: string;
    frontCamber?: string;
    rearCamber?: string;
    frontToe?: string;
    rearToe?: string;
    tyrePressureFl?: string;
    tyrePressureFr?: string;
    tyrePressureRl?: string;
    tyrePressureRr?: string;
    brakeBias?: string;
    frontArb?: string;
    rearArb?: string;
    frontWing?: string;
    rearWing?: string;
    tractionControl?: string;
    abs?: string;
    [key: string]: string | undefined;
  };
  hardwareMentioned: string[];
  rawText: string;
  confidence: number;
}

// ---------------------------------------------------------------------------
// Known hardware brands for simple scanning
// ---------------------------------------------------------------------------

const HARDWARE_BRANDS: Record<string, string[]> = {
  Fanatec: [
    "CSL DD", "DD Pro", "GT DD Pro", "ClubSport DD", "ClubSport DD+",
    "CSL Elite", "Podium DD1", "Podium DD2", "CSL Pedals", "ClubSport Pedals V3",
    "CSL Universal Hub", "McLaren GT3 V2", "Formula V2.5", "BMW GT2 V2",
    "QR1", "QR2", "ClubSport Shifter SQ",
  ],
  Moza: [
    "R5", "R9", "R12", "R16", "R21", "CRP", "SRP", "HGP",
    "KS", "FSR", "GS", "CS", "RS", "R5 Bundle",
  ],
  Simagic: [
    "Alpha", "Alpha Mini", "Alpha U", "FX", "FX Pro", "P-HPB",
    "P1000", "P2000", "GT1", "GT4", "GTC",
  ],
  Asetek: [
    "Invicta", "Forte", "La Prima", "SimSports",
  ],
  Logitech: [
    "G29", "G920", "G923", "G Pro", "PRO Racing Wheel", "PRO Racing Pedals",
  ],
  Thrustmaster: [
    "T300", "T300 RS", "T500 RS", "TS-XW", "TS-PC", "T-LCM",
    "T818", "SF1000", "T248",
  ],
  Heusinkveld: [
    "Sprint", "Sim Pedals Sprint", "Ultimate", "Ultimate+", "Sim Handbrake",
  ],
  "Sim-Lab": [
    "P1-X", "GT1 Evo", "WS-Pro", "Vario Vesa",
  ],
  "Trak Racer": [
    "TR160", "TR80", "TR120", "RS6", "TR8 Pro", "Alpine Racing TRX",
  ],
  "Next Level Racing": [
    "GT Track", "F-GT", "F-GT Elite", "GTElite", "Wheel Stand 2.0", "GT Lite",
  ],
  Playseat: [
    "Trophy", "Evolution", "Challenge X", "Formula Intelligence",
  ],
  Samsung: [
    "Odyssey G9", "G7", "G95T", "Neo G9", "Odyssey OLED G9",
  ],
  Pimax: [
    "Crystal", "Crystal Light", "8KX", "5K Super",
  ],
  "Meta Quest": [
    "Quest 3", "Quest 3S", "Quest Pro",
  ],
};

// ---------------------------------------------------------------------------
// Haiku prompt for setup extraction
// ---------------------------------------------------------------------------

const SETUP_SYSTEM_PROMPT = `You are an expert sim racing content parser. Your job is to extract car setup data and hardware mentions from YouTube video descriptions.

Setup data can appear in several formats:
- **Structured**: labelled fields like "Front Ride Height: 54mm", "Tyre Pressure FL: 27.5 psi"
- **Table format**: columns of setting names and values
- **Prose**: "I'm running 27.5 psi all round with -3.5 camber on the front"
- **Setup codes**: some sims use numeric setup strings

For each setup you find, extract:
1. **sim** — the sim/game (e.g. "iRacing", "ACC", "Assetto Corsa Competizione", "LMU", "F1 24", "rFactor 2")
2. **car** — the car model (e.g. "Porsche 911 GT3 R", "Mercedes AMG GT3 Evo", "Dallara P217")
3. **track** — the track/circuit (e.g. "Spa-Francorchamps", "Nurburgring Nordschleife", "Monza"). null if not mentioned.
4. **setupData** — an object with any of these keys (all optional, use camelCase):
   - frontRideHeight, rearRideHeight
   - frontCamber, rearCamber
   - frontToe, rearToe
   - tyrePressureFl, tyrePressureFr, tyrePressureRl, tyrePressureRr
   - brakeBias
   - frontArb, rearArb (anti-roll bar)
   - frontWing, rearWing
   - tractionControl, abs
   - Any other setup fields found, using camelCase keys
5. **hardwareMentioned** — array of specific hardware products mentioned (wheel bases, pedals, rigs, monitors, VR headsets). Include brand + model.
6. **rawText** — the raw text segment containing setup data
7. **confidence** — 0.0 to 1.0

Return a JSON array of setups. If no setup data AND no hardware found, return [].

IMPORTANT:
- Many descriptions just have social links and sponsor info. Return [] for those.
- A casual mention of a sim name is NOT a setup. There must be actual setup values or detailed hardware info.
- Hardware mentions can exist without a car setup — still include them as a separate entry with sim="Hardware", car="N/A", empty setupData.
- Be strict about confidence: only return entries with confidence >= 0.3
- Return ONLY valid JSON, no markdown code fences, no explanation.`;

// ---------------------------------------------------------------------------
// Parser client
// ---------------------------------------------------------------------------

const client = new Anthropic();

export async function parseSimRacingContent(
  description: string,
): Promise<ParsedSetup[]> {
  if (!description || description.trim().length < 20) {
    return [];
  }

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    system: SETUP_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Extract car setups and hardware mentions from this YouTube video description:\n\n---\n${description}\n---`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  try {
    const cleaned = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    const parsed: ParsedSetup[] = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((s) => s.confidence >= 0.3)
      .map((s) => ({
        sim: s.sim ?? "Unknown",
        car: s.car ?? "Unknown",
        track: s.track ?? null,
        setupData: s.setupData ?? {},
        hardwareMentioned: Array.isArray(s.hardwareMentioned)
          ? s.hardwareMentioned
          : [],
        rawText: s.rawText ?? "",
        confidence: s.confidence ?? 0,
      }));
  } catch {
    console.error("Failed to parse Haiku setup response:", text.slice(0, 200));
    return [];
  }
}

// ---------------------------------------------------------------------------
// Transcript-enhanced sim racing parser
// ---------------------------------------------------------------------------

const TRANSCRIPT_SETUP_PROMPT = `You are an expert sim racing content parser. You have access to both the YouTube video description AND the auto-generated transcript.

Your job is to extract richer data by combining both sources:

1. **Car setups** — from description AND transcript. Spoken values like "I'm running 21.5 psi front, 21.8 rear" or "I dropped the ride height to 52mm" should be captured.
2. **Hardware impressions** — from transcript. Phrases like "the Moza R5 feels really good" or "better than the CSL DD" are valuable. Include brand + model + impression.
3. **Lap times and race results** — from transcript. "My best lap was a 1:48.3" or "I finished P3".
4. **Track-specific tips** — from transcript. "Turn 3 you need to brake earlier" or "kerb on the exit of T7 is very aggressive".

For each setup/block you find, extract:
- sim, car, track, setupData (all optional fields, camelCase keys), hardwareMentioned, rawText, confidence
- **hardwareImpressions** — array of strings with brief impressions (e.g. "Moza R5 — feels better than CSL DD for FFB detail")
- **lapTimes** — array of strings (e.g. "1:48.345 — best lap")
- **trackTips** — array of strings (e.g. "Brake earlier into T3, avoid kerb at T7 exit")

Return a JSON array. If no setup data AND no hardware found, return [].

IMPORTANT:
- Return ONLY valid JSON, no markdown code fences, no explanation.
- Be strict about confidence: only return entries with confidence >= 0.3
- The transcript may be noisy (auto-generated) — extract what you can, don't hallucinate.`;

export async function parseSimRacingWithTranscript(
  description: string,
  transcript: string,
): Promise<ParsedSetup[]> {
  if (
    (!description || description.trim().length < 20) &&
    (!transcript || transcript.trim().length < 50)
  ) {
    return [];
  }

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    system: TRANSCRIPT_SETUP_PROMPT,
    messages: [
      {
        role: "user",
        content: `Extract car setups, hardware impressions, and race data from this video.\n\n--- DESCRIPTION ---\n${description}\n--- END DESCRIPTION ---\n\n--- TRANSCRIPT ---\n${transcript}\n--- END TRANSCRIPT ---`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  try {
    const cleaned = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    const parsed: ParsedSetup[] = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((s) => s.confidence >= 0.3)
      .map((s) => ({
        sim: s.sim ?? "Unknown",
        car: s.car ?? "Unknown",
        track: s.track ?? null,
        setupData: s.setupData ?? {},
        hardwareMentioned: Array.isArray(s.hardwareMentioned)
          ? s.hardwareMentioned
          : [],
        rawText: s.rawText ?? "",
        confidence: s.confidence ?? 0,
      }));
  } catch {
    console.error(
      "Failed to parse Haiku transcript setup response:",
      text.slice(0, 200),
    );
    return [];
  }
}

// ---------------------------------------------------------------------------
// Simple hardware mention scanner (no LLM needed)
// ---------------------------------------------------------------------------

export function parseHardwareMentions(description: string): string[] {
  if (!description || description.trim().length < 10) {
    return [];
  }

  const lowerDesc = description.toLowerCase();
  const found: string[] = [];

  for (const [brand, products] of Object.entries(HARDWARE_BRANDS)) {
    for (const product of products) {
      const fullName = `${brand} ${product}`;
      // Check for "Brand Product" or just "Product" (for distinctive names)
      if (lowerDesc.includes(fullName.toLowerCase())) {
        found.push(fullName);
      } else if (
        product.length >= 5 &&
        lowerDesc.includes(product.toLowerCase())
      ) {
        // Only match short product names if they're distinctive enough
        found.push(`${brand} ${product}`);
      }
    }
  }

  // Deduplicate
  return [...new Set(found)];
}
