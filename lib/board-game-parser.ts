// ---------------------------------------------------------------------------
// Board game article generator
// ---------------------------------------------------------------------------
// Uses Claude Haiku to generate full markdown articles from YouTube video
// transcripts. Handles four article types: review, best-list, how-to-play,
// and versus. Mirrors the pattern from lib/parser.ts.
// ---------------------------------------------------------------------------

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = "claude-haiku-4-5-20251001";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GeneratedArticle {
  title: string;
  slug: string;
  meta_description: string;
  content: string;
  article_type: "review" | "best-list" | "versus" | "how-to-play";
  confidence: number;
}

interface VideoInput {
  title: string;
  description: string;
  transcript: string;
  channelName: string;
  videoId: string;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function cleanResponse(text: string): string {
  return text
    .replace(/```json\s*/g, "")
    .replace(/```markdown\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();
}

// ---------------------------------------------------------------------------
// Review article generator
// ---------------------------------------------------------------------------

const REVIEW_SYSTEM = `You are an expert board game reviewer writing for TabletopWatch, a board game content site.
You generate SEO-optimised review articles from YouTube video transcripts.

Given a video transcript of a board game review, generate a complete article in JSON format:

{
  "title": "SEO-optimised title, e.g. 'Wingspan Review — A Beautiful Engine Builder Worth Your Time'",
  "slug": "url-slug-like-this",
  "meta_description": "150-160 character SEO meta description including the game name",
  "content": "Full markdown article body (1200-2000 words)",
  "article_type": "review",
  "confidence": 0.0-1.0,
  "game_metadata": {
    "playerCount": "1-5",
    "playTime": "40-70 minutes",
    "ageRating": "10+",
    "complexity": "2.4/5",
    "priceRange": "£30-£45"
  }
}

Article structure for the "content" field:
1. ## Overview — what the game is, theme, designer/publisher if known
2. ## How It Plays — core mechanics explained clearly
3. ## What Works — pros, best aspects
4. ## What Doesn't — cons, limitations (be honest)
5. ## Who It's For — target audience with "You'll love it if..." / "Look elsewhere if..." format
6. ## The Verdict — final recommendation with rating out of 10
7. ## Where to Buy — mention Amazon and Zatu as UK retailers

Rules:
- Write in a warm, knowledgeable, opinionated tone. Not corporate.
- Credit the source video/channel naturally in the opening paragraph.
- Extract REAL game details from the transcript — don't invent mechanics or rules.
- If the transcript is too noisy to extract useful content, set confidence below 0.3.
- Game metadata fields should be extracted from the transcript or left as null if not mentioned.
- Return ONLY valid JSON, no markdown fences, no explanation outside the JSON.`;

export async function generateReview(
  video: VideoInput,
): Promise<GeneratedArticle | null> {
  if (!video.transcript || video.transcript.length < 200) return null;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: REVIEW_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Generate a review article from this video.\n\nVideo: "${video.title}" by ${video.channelName}\n\n--- DESCRIPTION ---\n${video.description.slice(0, 1000)}\n--- END DESCRIPTION ---\n\n--- TRANSCRIPT ---\n${video.transcript.slice(0, 12000)}\n--- END TRANSCRIPT ---`,
      },
    ],
  });

  return parseArticleResponse(message, "review");
}

// ---------------------------------------------------------------------------
// Best-of list article generator
// ---------------------------------------------------------------------------

const BEST_LIST_SYSTEM = `You are an expert board game content writer for TabletopWatch, a board game content site.
You generate SEO-optimised "best of" list articles from YouTube video transcripts.

Given a video transcript of a "top games" or "best games" list video, generate a complete article in JSON format:

{
  "title": "SEO-optimised title, e.g. 'Best Strategy Board Games for 2 Players (2026)'",
  "slug": "url-slug-like-this",
  "meta_description": "150-160 character SEO meta description",
  "content": "Full markdown article body (1500-2500 words)",
  "article_type": "best-list",
  "confidence": 0.0-1.0
}

Article structure for the "content" field:
1. ## Why [Category] Games? — brief intro on why this category matters
2. ## 1. [Game Name] — for each game: 100-200 word entry with:
   - What makes it great
   - "Why it made the list:" — specific reason
   - "Best for:" — target player type
3. (Repeat for each game, numbered)
4. ## How We Chose These Games — brief methodology
5. ## Where to Buy — mention Amazon and Zatu as UK retailers

Rules:
- Extract the ACTUAL games mentioned in the transcript — don't substitute or add games.
- Keep the same ranking order as the source video.
- Credit the source channel naturally.
- Write concise, opinionated entries. Each game needs a clear reason to be on the list.
- If the transcript is too noisy or lists fewer than 3 games, set confidence below 0.3.
- Return ONLY valid JSON.`;

export async function generateBestOfList(
  video: VideoInput,
): Promise<GeneratedArticle | null> {
  if (!video.transcript || video.transcript.length < 200) return null;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: BEST_LIST_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Generate a best-of list article from this video.\n\nVideo: "${video.title}" by ${video.channelName}\n\n--- DESCRIPTION ---\n${video.description.slice(0, 1000)}\n--- END DESCRIPTION ---\n\n--- TRANSCRIPT ---\n${video.transcript.slice(0, 12000)}\n--- END TRANSCRIPT ---`,
      },
    ],
  });

  return parseArticleResponse(message, "best-list");
}

// ---------------------------------------------------------------------------
// How-to-play guide generator
// ---------------------------------------------------------------------------

const HOW_TO_PLAY_SYSTEM = `You are an expert board game rules writer for TabletopWatch, a board game content site.
You generate clear, structured how-to-play guides from YouTube video transcripts.

Given a video transcript of a rules explanation or "how to play" video, generate a complete article in JSON format:

{
  "title": "SEO-optimised title, e.g. 'How to Play Catan — Complete Beginner's Guide'",
  "slug": "url-slug-like-this",
  "meta_description": "150-160 character SEO meta description",
  "content": "Full markdown article body (1500-2500 words)",
  "article_type": "how-to-play",
  "confidence": 0.0-1.0,
  "game_metadata": {
    "playerCount": "3-4",
    "playTime": "60-90 minutes",
    "ageRating": "10+",
    "complexity": "2.3/5",
    "priceRange": "£25-£35"
  }
}

Article structure for the "content" field:
1. ## Overview — what the game is, theme, 2-3 sentence hook
2. ## Components — what's in the box
3. ## Setup — step-by-step setup instructions
4. ## Objective — how you win
5. ## Turn Structure — what happens on each turn, clearly numbered/bulleted
6. ## Key Rules — important rules people commonly miss or get wrong
7. ## Scoring — how scoring/victory points work
8. ## Tips for Your First Game — 3-5 practical tips for beginners
9. ## Where to Buy — mention Amazon and Zatu

Rules:
- Accuracy is CRITICAL. Extract real rules from the transcript — never invent rules.
- Use numbered lists and clear formatting for step-by-step instructions.
- Write for someone who has never played the game before.
- If the transcript doesn't contain enough rule detail, set confidence below 0.3.
- Credit the source video for the rules explanation.
- Return ONLY valid JSON.`;

export async function generateHowToPlay(
  video: VideoInput,
): Promise<GeneratedArticle | null> {
  if (!video.transcript || video.transcript.length < 300) return null;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: HOW_TO_PLAY_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Generate a how-to-play guide from this video.\n\nVideo: "${video.title}" by ${video.channelName}\n\n--- DESCRIPTION ---\n${video.description.slice(0, 1000)}\n--- END DESCRIPTION ---\n\n--- TRANSCRIPT ---\n${video.transcript.slice(0, 14000)}\n--- END TRANSCRIPT ---`,
      },
    ],
  });

  return parseArticleResponse(message, "how-to-play");
}

// ---------------------------------------------------------------------------
// Versus / comparison article generator
// ---------------------------------------------------------------------------

const VERSUS_SYSTEM = `You are an expert board game comparison writer for TabletopWatch, a board game content site.
You generate SEO-optimised comparison articles from YouTube video transcripts.

Given a video transcript comparing two or more board games, generate a complete article in JSON format:

{
  "title": "SEO-optimised title, e.g. 'Wingspan vs Everdell — Which Nature Game Should You Buy?'",
  "slug": "url-slug-like-this",
  "meta_description": "150-160 character SEO meta description",
  "content": "Full markdown article body (1200-2000 words)",
  "article_type": "versus",
  "confidence": 0.0-1.0
}

Article structure for the "content" field:
1. ## The Contenders — brief overview of each game
2. ## [Game A] at a Glance — player count, play time, complexity, theme
3. ## [Game B] at a Glance — same format
4. ## Head-to-Head Comparison — markdown table comparing key factors (complexity, play time, player count, replayability, price, theme, accessibility)
5. ## When to Choose [Game A] — specific scenarios where Game A is better
6. ## When to Choose [Game B] — specific scenarios where Game B is better
7. ## The Verdict — clear recommendation based on player type
8. ## Where to Buy — both games, Amazon and Zatu

Rules:
- Be fair to both games. Present genuine trade-offs.
- Extract real comparisons from the transcript — don't invent opinions.
- The verdict should recommend DIFFERENT games for DIFFERENT players, not just pick a winner.
- If the transcript doesn't actually compare games meaningfully, set confidence below 0.3.
- Credit the source video.
- Return ONLY valid JSON.`;

export async function generateVersus(
  video: VideoInput,
): Promise<GeneratedArticle | null> {
  if (!video.transcript || video.transcript.length < 200) return null;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: VERSUS_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Generate a comparison article from this video.\n\nVideo: "${video.title}" by ${video.channelName}\n\n--- DESCRIPTION ---\n${video.description.slice(0, 1000)}\n--- END DESCRIPTION ---\n\n--- TRANSCRIPT ---\n${video.transcript.slice(0, 12000)}\n--- END TRANSCRIPT ---`,
      },
    ],
  });

  return parseArticleResponse(message, "versus");
}

// ---------------------------------------------------------------------------
// Response parser (shared)
// ---------------------------------------------------------------------------

function parseArticleResponse(
  message: Anthropic.Message,
  expectedType: GeneratedArticle["article_type"],
): GeneratedArticle | null {
  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  try {
    const cleaned = cleanResponse(text);
    const parsed = JSON.parse(cleaned);

    if (!parsed.title || !parsed.content) return null;
    if (typeof parsed.confidence === "number" && parsed.confidence < 0.3)
      return null;

    return {
      title: parsed.title,
      slug: parsed.slug || slugify(parsed.title),
      meta_description: parsed.meta_description || "",
      content: parsed.content,
      article_type: expectedType,
      confidence: parsed.confidence ?? 0.5,
    };
  } catch {
    console.error(
      "Failed to parse board game article response:",
      text.slice(0, 200),
    );
    return null;
  }
}

// ---------------------------------------------------------------------------
// Auto-dispatch by content type
// ---------------------------------------------------------------------------

export async function generateArticle(
  video: VideoInput,
  contentType: "review" | "top-list" | "how-to-play" | "comparison",
): Promise<GeneratedArticle | null> {
  switch (contentType) {
    case "review":
      return generateReview(video);
    case "top-list":
      return generateBestOfList(video);
    case "how-to-play":
      return generateHowToPlay(video);
    case "comparison":
      return generateVersus(video);
    default:
      return null;
  }
}
