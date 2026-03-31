// ---------------------------------------------------------------------------
// YouTube Transcript Fetcher
// Extracts auto-generated captions from YouTube videos without an API key.
// ---------------------------------------------------------------------------

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const MAX_WORDS = 15_000;

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string; // "asr" = auto-generated
  name?: { simpleText?: string };
}

/**
 * Fetch the transcript (auto-captions) for a YouTube video.
 * Returns the full transcript as plain text (no timestamps), or null if
 * no captions are available.
 *
 * Truncates to 15,000 words to keep Haiku costs reasonable.
 */
export async function fetchTranscript(
  videoId: string,
): Promise<string | null> {
  try {
    // 1. Fetch the video page
    const pageUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const res = await fetch(pageUrl, {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!res.ok) {
      console.warn(`YouTube page fetch failed for ${videoId}: ${res.status}`);
      return null;
    }

    const html = await res.text();

    // 2. Extract playerResponse JSON from the page
    const playerResponse = extractPlayerResponse(html);
    if (!playerResponse) {
      return null;
    }

    // 3. Find caption tracks
    const captionTracks: CaptionTrack[] | undefined =
      playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!captionTracks || captionTracks.length === 0) {
      return null;
    }

    // 4. Pick the best track — prefer manual English, then auto English, then first available
    const track = pickBestTrack(captionTracks);
    if (!track) {
      return null;
    }

    // 5. Fetch the timedtext XML
    const captionRes = await fetch(track.baseUrl, {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!captionRes.ok) {
      console.warn(
        `Caption track fetch failed for ${videoId}: ${captionRes.status}`,
      );
      return null;
    }

    const xml = await captionRes.text();

    // 6. Parse XML to plain text
    const plainText = parseTimedTextXml(xml);
    if (!plainText) {
      return null;
    }

    // 7. Truncate to MAX_WORDS
    return truncateToWords(plainText, MAX_WORDS);
  } catch (err) {
    console.warn(
      `Failed to fetch transcript for ${videoId}:`,
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractPlayerResponse(html: string): any | null {
  // YouTube embeds the player response as:
  //   var ytInitialPlayerResponse = {...};
  const marker = "var ytInitialPlayerResponse = ";
  const startIdx = html.indexOf(marker);
  if (startIdx === -1) return null;

  const jsonStart = startIdx + marker.length;

  // Find the end of the JSON object — scan for matching braces
  let depth = 0;
  let i = jsonStart;
  for (; i < html.length; i++) {
    if (html[i] === "{") depth++;
    else if (html[i] === "}") {
      depth--;
      if (depth === 0) break;
    }
  }

  if (depth !== 0) return null;

  const jsonStr = html.slice(jsonStart, i + 1);

  try {
    return JSON.parse(jsonStr);
  } catch {
    console.warn("Failed to parse ytInitialPlayerResponse JSON");
    return null;
  }
}

function pickBestTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  // Prefer manual English captions
  const manualEn = tracks.find(
    (t) => t.languageCode.startsWith("en") && t.kind !== "asr",
  );
  if (manualEn) return manualEn;

  // Fall back to auto-generated English
  const autoEn = tracks.find(
    (t) => t.languageCode.startsWith("en") && t.kind === "asr",
  );
  if (autoEn) return autoEn;

  // Fall back to any English
  const anyEn = tracks.find((t) => t.languageCode.startsWith("en"));
  if (anyEn) return anyEn;

  // Fall back to first available track
  return tracks[0] ?? null;
}

function parseTimedTextXml(xml: string): string | null {
  // Extract text content from <text> elements
  // Format: <text start="0.0" dur="2.5">Hello world</text>
  const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/g;
  const segments: string[] = [];

  let match: RegExpExecArray | null;
  while ((match = textRegex.exec(xml)) !== null) {
    let text = match[1];

    // Decode HTML entities
    text = text
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));

    // Strip any remaining HTML tags
    text = text.replace(/<[^>]+>/g, "");

    // Clean up whitespace
    text = text.trim();

    if (text) {
      segments.push(text);
    }
  }

  if (segments.length === 0) return null;

  return segments.join(" ");
}

function truncateToWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ");
}
