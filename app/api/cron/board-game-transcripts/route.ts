import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchTranscript } from "@/lib/youtube-transcript";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ---------------------------------------------------------------------------
// GET /api/cron/board-game-transcripts
//
// Fetches YouTube transcripts for board-game videos that don't have them yet
// (up to 5 per run). Article generation is owned by Hawk's
// hawk-bg-draft-generator-am/-pm crons, which produce filesystem markdown
// posts via PRs against content/blog/tabletop/.
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdminClient();
  const stats = {
    transcriptsFetched: 0,
    transcriptsFailed: 0,
    errors: [] as string[],
  };

  const { data: noTranscriptVideos } = await supabase
    .from("board_game_videos")
    .select("id, youtube_video_id, title")
    .eq("has_transcript", false)
    .neq("content_type", "other")
    .neq("content_type", "playthrough")
    .neq("content_type", "news")
    .order("published_at", { ascending: false })
    .limit(5);

  for (const video of noTranscriptVideos ?? []) {
    try {
      const transcript = await fetchTranscript(video.youtube_video_id);

      if (transcript && transcript.length > 100) {
        await supabase
          .from("board_game_videos")
          .update({
            transcript,
            has_transcript: true,
          })
          .eq("id", video.id);

        stats.transcriptsFetched++;
      } else {
        await supabase
          .from("board_game_videos")
          .update({ has_transcript: false })
          .eq("id", video.id);

        stats.transcriptsFailed++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      stats.errors.push(`Transcript ${video.youtube_video_id}: ${message}`);
      stats.transcriptsFailed++;
    }
  }

  return NextResponse.json({
    success: true,
    ...stats,
    errors: stats.errors.length > 0 ? stats.errors : undefined,
  });
}
