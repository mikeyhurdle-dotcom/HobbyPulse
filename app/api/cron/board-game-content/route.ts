import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchTranscript } from "@/lib/youtube-transcript";
import { generateArticle } from "@/lib/board-game-parser";
import type { BoardGameContentType } from "@/lib/board-game-classify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// ---------------------------------------------------------------------------
// Admin Supabase client (service role — bypasses RLS)
// ---------------------------------------------------------------------------
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// Map video content_type to article generator content_type
const GENERATABLE_TYPES: Record<string, "review" | "top-list" | "how-to-play" | "comparison"> = {
  review: "review",
  "top-list": "top-list",
  "how-to-play": "how-to-play",
  comparison: "comparison",
};

// ---------------------------------------------------------------------------
// GET /api/cron/board-game-content
//
// Two-phase pipeline:
// Phase 1: Fetch transcripts for videos that don't have them yet (up to 5)
// Phase 2: Generate articles from videos with transcripts (up to 3)
//
// Keeping limits low to stay within Vercel 300s timeout and Haiku costs.
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
    articlesGenerated: 0,
    articlesFailed: 0,
    errors: [] as string[],
  };

  // ========================================================================
  // Phase 1: Fetch transcripts for videos missing them
  // ========================================================================
  const { data: noTranscriptVideos } = await supabase
    .from("board_game_videos")
    .select("id, youtube_video_id, title")
    .eq("has_transcript", false)
    .neq("content_type", "other") // Only fetch transcripts for classifiable videos
    .neq("content_type", "playthrough") // Playthroughs are too long, skip
    .neq("content_type", "news") // News doesn't generate good articles
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
        // Mark as attempted so we don't retry forever
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

  // ========================================================================
  // Phase 2: Generate articles from videos with transcripts
  // ========================================================================
  const { data: readyVideos } = await supabase
    .from("board_game_videos")
    .select(
      "id, youtube_video_id, title, description, transcript, content_type, board_game_channels(channel_name)",
    )
    .eq("has_transcript", true)
    .eq("article_generated", false)
    .in("content_type", Object.keys(GENERATABLE_TYPES))
    .order("published_at", { ascending: false })
    .limit(3);

  for (const video of readyVideos ?? []) {
    const articleType = GENERATABLE_TYPES[video.content_type];
    if (!articleType) continue;

    const channelRaw = video.board_game_channels as
      | { channel_name: string }
      | { channel_name: string }[]
      | null;
    const channelName = Array.isArray(channelRaw)
      ? channelRaw[0]?.channel_name ?? "Unknown Channel"
      : channelRaw?.channel_name ?? "Unknown Channel";

    try {
      const article = await generateArticle(
        {
          title: video.title,
          description: video.description ?? "",
          transcript: video.transcript ?? "",
          channelName,
          videoId: video.youtube_video_id,
        },
        articleType,
      );

      if (article) {
        // Save article to board_game_articles table
        const { data: inserted, error: insertError } = await supabase
          .from("board_game_articles")
          .upsert(
            {
              slug: article.slug,
              title: article.title,
              meta_description: article.meta_description,
              content: article.content,
              article_type: article.article_type,
              source_video_ids: [video.youtube_video_id],
              source_channels: [channelName],
              status: "draft", // Always draft — needs human review
              published_at: new Date().toISOString(),
            },
            { onConflict: "slug" },
          )
          .select("id")
          .single();

        if (insertError) {
          stats.errors.push(
            `Insert article for ${video.youtube_video_id}: ${insertError.message}`,
          );
          stats.articlesFailed++;
          continue;
        }

        // Link video to article
        await supabase
          .from("board_game_videos")
          .update({
            article_generated: true,
            article_id: inserted?.id ?? null,
          })
          .eq("id", video.id);

        stats.articlesGenerated++;
      } else {
        // Haiku couldn't generate a useful article — mark as attempted
        await supabase
          .from("board_game_videos")
          .update({ article_generated: true })
          .eq("id", video.id);

        stats.articlesFailed++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      stats.errors.push(`Generate ${video.youtube_video_id}: ${message}`);
      stats.articlesFailed++;
    }
  }

  return NextResponse.json({
    success: true,
    ...stats,
    errors: stats.errors.length > 0 ? stats.errors : undefined,
  });
}
