// ---------------------------------------------------------------------------
// Product Normalisation — Cache-first with Haiku fallback
// ---------------------------------------------------------------------------
// Flow: basicNormalise → cache lookup → fuzzy match → Haiku (last resort)
// Results are saved to product_name_cache so the same title is never sent
// to Haiku twice. After the first cron run seeds the cache, 95%+ of
// lookups resolve instantly via DB.
// ---------------------------------------------------------------------------

import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";

const anthropic = new Anthropic();

export interface NormalisationResult {
  canonicalName: string;
  confidence: number;
  resolvedBy: "cache" | "fuzzy" | "haiku" | "basic";
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function normaliseProduct(
  rawTitle: string,
  vertical: string,
  source: string,
): Promise<NormalisationResult> {
  const normalised = basicNormalise(rawTitle);

  // Get vertical ID (cached per-process via module scope)
  const verticalId = await getVerticalId(vertical);
  if (!verticalId) {
    return { canonicalName: normalised, confidence: 0.3, resolvedBy: "basic" };
  }

  // Step 1: Cache lookup — instant, free
  const cached = await cacheGet(verticalId, normalised, source);
  if (cached) {
    return {
      canonicalName: cached.canonical_name,
      confidence: cached.confidence,
      resolvedBy: "cache",
    };
  }

  // Step 2: Fuzzy match against existing products
  const fuzzyMatch = await fuzzyMatchProduct(verticalId, normalised);
  if (fuzzyMatch) {
    // Save to cache for next time
    await cachePut(verticalId, normalised, source, fuzzyMatch, "fuzzy", 0.85);
    return { canonicalName: fuzzyMatch, confidence: 0.85, resolvedBy: "fuzzy" };
  }

  // Step 3: Haiku fallback — only for genuinely unknown products
  try {
    const haikuResult = await normaliseWithHaiku(normalised, vertical, verticalId);
    // Save to cache
    await cachePut(
      verticalId,
      normalised,
      source,
      haikuResult.canonicalName,
      "haiku",
      haikuResult.confidence,
    );
    return { ...haikuResult, resolvedBy: "haiku" };
  } catch {
    // Haiku failed — use basic normalisation and cache it
    await cachePut(verticalId, normalised, source, normalised, "basic", 0.3);
    return { canonicalName: normalised, confidence: 0.3, resolvedBy: "basic" };
  }
}

// ---------------------------------------------------------------------------
// Cache operations
// ---------------------------------------------------------------------------

async function cacheGet(
  verticalId: string,
  rawTitle: string,
  source: string,
): Promise<{ canonical_name: string; confidence: number } | null> {
  const { data } = await supabase
    .from("product_name_cache")
    .select("canonical_name, confidence")
    .eq("vertical_id", verticalId)
    .eq("raw_title", rawTitle)
    .eq("source", source)
    .single();

  return data;
}

async function cachePut(
  verticalId: string,
  rawTitle: string,
  source: string,
  canonicalName: string,
  resolvedBy: string,
  confidence: number,
): Promise<void> {
  await supabase.from("product_name_cache").upsert(
    {
      vertical_id: verticalId,
      raw_title: rawTitle,
      source,
      canonical_name: canonicalName,
      resolved_by: resolvedBy,
      confidence,
    },
    { onConflict: "vertical_id,raw_title,source" },
  );
}

// ---------------------------------------------------------------------------
// Fuzzy matching against existing products table
// ---------------------------------------------------------------------------

async function fuzzyMatchProduct(
  verticalId: string,
  normalised: string,
): Promise<string | null> {
  // Extract significant keywords (3+ chars, skip common words)
  const stopWords = new Set([
    "the", "and", "for", "with", "new", "set", "kit", "box", "pack",
  ]);
  const keywords = normalised
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stopWords.has(w));

  if (keywords.length === 0) return null;

  // Search products by the longest/most specific keyword first
  const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
  const primaryKeyword = sortedKeywords[0];

  const { data: candidates } = await supabase
    .from("products")
    .select("name")
    .eq("vertical_id", verticalId)
    .ilike("name", `%${primaryKeyword}%`)
    .limit(20);

  if (!candidates || candidates.length === 0) return null;

  // Score each candidate by how many keywords match
  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const candidateLower = candidate.name.toLowerCase();

    // Exact match (case-insensitive)
    if (candidateLower === normalised.toLowerCase()) {
      return candidate.name;
    }

    // Keyword overlap score
    let score = 0;
    for (const kw of keywords) {
      if (candidateLower.includes(kw)) {
        score += kw.length; // Longer keyword matches are worth more
      }
    }

    // Require at least 60% of keyword characters to match
    const totalKeywordLength = keywords.reduce((sum, kw) => sum + kw.length, 0);
    const matchRatio = score / totalKeywordLength;

    if (matchRatio > 0.6 && score > bestScore) {
      bestScore = score;
      bestMatch = candidate.name;
    }
  }

  return bestMatch;
}

// ---------------------------------------------------------------------------
// Haiku normalisation (expensive — only for cache misses)
// ---------------------------------------------------------------------------

async function normaliseWithHaiku(
  normalised: string,
  vertical: string,
  verticalId: string,
): Promise<{ canonicalName: string; confidence: number }> {
  // Fetch a small set of existing product names for context
  const { data: existingProducts } = await supabase
    .from("products")
    .select("name")
    .eq("vertical_id", verticalId)
    .limit(100);

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

${knownNames.length > 0 ? `Known products in our database:\n${knownNames.join("\n")}` : ""}

Raw title: "${normalised}"

Respond in EXACTLY this JSON format, no other text:
{"canonicalName": "Product Name Here", "confidence": 0.9}`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  const parsed = JSON.parse(text) as { canonicalName: string; confidence: number };
  return {
    canonicalName: parsed.canonicalName || normalised,
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
  };
}

// ---------------------------------------------------------------------------
// Basic normalisation (regex — free, instant)
// ---------------------------------------------------------------------------

function basicNormalise(title: string): string {
  return title
    .replace(
      /\b(new|pre-order|preorder|in stock|free shipping|free p&p|bnib|bnob|nib|nob|nos|sale|clearance|last one|limited stock)\b/gi,
      "",
    )
    .replace(/\s*-\s*$/, "")
    .replace(/^\s*-\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Vertical ID cache (process-level, avoids repeated DB lookups)
// ---------------------------------------------------------------------------

const verticalIdCache = new Map<string, string>();

async function getVerticalId(slug: string): Promise<string | null> {
  if (verticalIdCache.has(slug)) return verticalIdCache.get(slug)!;

  const { data } = await supabase
    .from("verticals")
    .select("id")
    .eq("slug", slug)
    .single();

  if (data?.id) {
    verticalIdCache.set(slug, data.id);
    return data.id;
  }

  return null;
}
