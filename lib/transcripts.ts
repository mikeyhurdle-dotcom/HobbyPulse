// ---------------------------------------------------------------------------
// YouTube transcript fetching
// ---------------------------------------------------------------------------
// Uses the `youtube-transcript` package which scrapes the same public
// endpoint the YouTube web player uses to load captions. No API key required.
// Auto-generated captions are fine for SEO — we're indexing the words, not
// transcribing for humans.
// ---------------------------------------------------------------------------

import { YoutubeTranscript } from "youtube-transcript";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export interface TranscriptResult {
  battleReportId: string;
  text: string;
  segmentCount: number;
  language: string;
}

/**
 * Fetch a YouTube transcript and normalise it to a single text blob.
 * Returns null if no transcript is available (common for newer uploads or
 * channels that disable captions).
 */
export async function fetchTranscript(
  youtubeVideoId: string,
): Promise<{ text: string; segmentCount: number; language: string } | null> {
  try {
    const segments = await YoutubeTranscript.fetchTranscript(youtubeVideoId, {
      lang: "en",
    });
    if (!segments || segments.length === 0) return null;

    // Join segments with spaces. The package returns HTML-encoded entities
    // like &amp; and &#39; — decode them for clean SEO text.
    const raw = segments.map((s) => s.text).join(" ");
    const decoded = raw
      .replace(/&amp;/g, "&")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return {
      text: decoded,
      segmentCount: segments.length,
      language: "en",
    };
  } catch {
    // YouTube transcript endpoint is flaky — treat failures as "no transcript"
    return null;
  }
}

/** Upsert a transcript row. Idempotent on (battle_report_id, language). */
export async function saveTranscript(
  battleReportId: string,
  text: string,
  segmentCount: number,
  language = "en",
): Promise<{ saved: boolean; error?: string }> {
  const { error } = await admin
    .from("video_transcripts")
    .upsert(
      {
        battle_report_id: battleReportId,
        language,
        text,
        segment_count: segmentCount,
        source: "youtube",
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "battle_report_id,language" },
    );

  if (error) return { saved: false, error: error.message };
  return { saved: true };
}

/**
 * Fetch + save in one go. Returns a discriminated union so callers can tell
 * "no transcript available" apart from "DB write failed".
 */
export async function fetchAndSaveTranscript(
  battleReportId: string,
  youtubeVideoId: string,
): Promise<
  | { status: "saved"; segmentCount: number }
  | { status: "no_transcript" }
  | { status: "error"; error: string }
> {
  const fetched = await fetchTranscript(youtubeVideoId);
  if (!fetched) return { status: "no_transcript" };
  const saved = await saveTranscript(
    battleReportId,
    fetched.text,
    fetched.segmentCount,
    fetched.language,
  );
  if (!saved.saved) return { status: "error", error: saved.error ?? "unknown" };
  return { status: "saved", segmentCount: fetched.segmentCount };
}
