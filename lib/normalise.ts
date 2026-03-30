// ---------------------------------------------------------------------------
// Product Normalisation — Claude Haiku
// ---------------------------------------------------------------------------
// Uses Claude Haiku to normalise scraped product titles into canonical names
// that can be matched against the products table in Supabase.
// ---------------------------------------------------------------------------

import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";

const anthropic = new Anthropic();

interface NormalisationResult {
  canonicalName: string;
  confidence: number;
}

/**
 * Normalise a raw scraped product title into a canonical product name.
 * Uses Claude Haiku for intelligent matching and returns a confidence score.
 */
export async function normaliseProduct(
  rawTitle: string,
  vertical: string,
): Promise<NormalisationResult> {
  // Fetch existing product names from Supabase for this vertical
  const { data: verticalRow } = await supabase
    .from("verticals")
    .select("id")
    .eq("slug", vertical)
    .single();

  const verticalId = verticalRow?.id;

  const { data: existingProducts } = await supabase
    .from("products")
    .select("name")
    .eq("vertical_id", verticalId ?? "")
    .limit(200);

  const knownNames = (existingProducts ?? []).map((p) => p.name);

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-20250414",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `You are a product name normaliser for the ${vertical} hobby.

Given a raw product title from a retailer, return the canonical product name.

Rules:
- Strip retailer-specific prefixes/suffixes (e.g. "NEW", "PRE-ORDER", "Free Shipping")
- Standardise to the official manufacturer product name
- Remove edition numbers unless they distinguish different products
- Keep faction/army names where relevant
- If the product is clearly identifiable, return high confidence (0.8-1.0)
- If ambiguous, return lower confidence (0.3-0.7)

Known products in our database:
${knownNames.length > 0 ? knownNames.join("\n") : "(none yet)"}

Raw title: "${rawTitle}"

Respond in EXACTLY this JSON format, no other text:
{"canonicalName": "Product Name Here", "confidence": 0.9}`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  try {
    const parsed = JSON.parse(text) as NormalisationResult;
    return {
      canonicalName: parsed.canonicalName || rawTitle,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
    };
  } catch {
    // Fallback: basic cleanup
    return {
      canonicalName: basicNormalise(rawTitle),
      confidence: 0.3,
    };
  }
}

/**
 * Basic string-level normalisation fallback.
 */
function basicNormalise(title: string): string {
  return title
    .replace(
      /\b(new|pre-order|preorder|in stock|free shipping|free p&p|bnib|bnob|nib|nob|nos)\b/gi,
      "",
    )
    .replace(/\s*-\s*$/, "")
    .replace(/^\s*-\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}
