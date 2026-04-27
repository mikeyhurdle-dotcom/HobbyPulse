// ---------------------------------------------------------------------------
// AI-generated video summaries (SEO content)
// ---------------------------------------------------------------------------
// YouTube's transcript endpoint aggressively blocks unauthenticated clients
// (Vercel datacenter IPs in particular). Rather than fighting proxies, we
// generate unique per-video summaries with Claude Haiku using the data we
// already have: title, description, channel, faction, parsed army lists.
//
// The output fills the same role as a transcript — unique indexable text on
// every /watch/[id] page — while also giving us editorial quality and the
// ability to inject keyword-dense framing around the faction + game system.
//
// Stored in the `video_transcripts` table with `source='ai-summary'`.
// ---------------------------------------------------------------------------

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-service-role-key",
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface SummaryInput {
  battleReportId: string;
  title: string;
  description: string | null;
  channelName: string | null;
  gameSystem: string | null;
  factions: string[];
  armyLists: { playerName: string | null; factionName: string | null; units: string[] }[];
  vertical: "tabletop" | "simracing";
}

function buildPrompt(input: SummaryInput): string {
  const isSimRacing = input.vertical === "simracing";
  const contentType = isSimRacing ? "sim racing video" : "Warhammer battle report";
  const audienceNoun = isSimRacing ? "sim racers" : "wargamers";

  const armyContext = input.armyLists.length
    ? input.armyLists
        .map((a, i) => {
          const faction = a.factionName ?? `Army ${i + 1}`;
          const player = a.playerName ? ` (${a.playerName})` : "";
          const units = a.units.slice(0, 15).join(", ");
          return `${faction}${player}: ${units}`;
        })
        .join("\n")
    : "";

  const factionContext = input.factions.length
    ? `Factions featured: ${input.factions.join(" vs ")}.`
    : "";

  return `You are writing an SEO summary for a ${contentType} page on a hobby content aggregator site. The goal is to produce unique, keyword-dense, genuinely useful prose that describes what ${audienceNoun} will find in this video. This text is indexed by Google — it must be unique to this video and factually grounded in the provided data only. Do not invent match outcomes, scores, or claims not supported by the inputs.

VIDEO METADATA
Title: ${input.title}
Channel: ${input.channelName ?? "Unknown"}
Game system: ${input.gameSystem ?? "Unknown"}
${factionContext}
${armyContext ? `\nARMY LISTS\n${armyContext}` : ""}
${input.description ? `\nVIDEO DESCRIPTION (YouTube)\n${input.description.slice(0, 800)}` : ""}

WRITING RULES
- 350 to 500 words, plain prose (no headings, no markdown, no bullet lists).
- Write three to five short paragraphs.
- Paragraph 1: what this video is and which factions / game system it covers.
- Paragraph 2: the notable units or characters featured in the armies (use unit names verbatim).
- Paragraph 3: why this ${contentType} is worth watching — the channel's reputation, the scale of the game, the matchup dynamics. Do not speculate on who wins.
- Paragraph 4 (optional): practical takeaway — what a viewer can learn or take away for their own ${isSimRacing ? "setup or races" : "army building or list writing"}.
- Natural tone. Do not start with "In this video". Vary sentence openers.
- Include the faction names, game system name, and at least 3 unit names from the army lists (if provided) verbatim so they're indexed.

Respond with ONLY the prose summary — no preamble, no closing remarks.`;
}

/**
 * Generate a summary for a single video. Returns null on hard failure so the
 * caller can stamp a retry-safe stub.
 */
export async function generateVideoSummary(
  input: SummaryInput,
): Promise<{ text: string } | null> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 900,
      messages: [{ role: "user", content: buildPrompt(input) }],
    });

    const block = response.content[0];
    if (!block || block.type !== "text") return null;
    const text = block.text.trim();
    if (text.length < 200) return null;
    return { text };
  } catch {
    return null;
  }
}

/** Upsert an AI summary into the transcripts table. */
export async function saveVideoSummary(
  battleReportId: string,
  text: string,
): Promise<{ saved: boolean; error?: string }> {
  const { error } = await admin
    .from("video_transcripts")
    .upsert(
      {
        battle_report_id: battleReportId,
        language: "en",
        text,
        segment_count: 0,
        source: "ai-summary",
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "battle_report_id,language" },
    );
  if (error) return { saved: false, error: error.message };
  return { saved: true };
}
