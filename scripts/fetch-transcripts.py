#!/usr/bin/env python3
"""
Fetch YouTube transcripts for battle reports and store in Supabase.

Must run from a non-cloud IP (local machine, not VPS/Vercel).
YouTube blocks cloud provider IPs from fetching transcripts.

Usage:
    python3 scripts/fetch-transcripts.py

Requires:
    pip3 install youtube-transcript-api supabase
"""

import os
import sys

try:
    from youtube_transcript_api import YouTubeTranscriptApi
    from supabase import create_client
except ImportError:
    print("Install dependencies: pip3 install youtube-transcript-api supabase")
    sys.exit(1)

# Config
SUPABASE_URL = "https://nspgvdytqsvnmbitbmey.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
MAX_WORDS = 15000
BATCH_SIZE = 20

if not SUPABASE_KEY:
    env_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env.local")
    if os.path.exists(env_file):
        with open(env_file) as f:
            for line in f:
                if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                    SUPABASE_KEY = line.split("=", 1)[1].strip().strip('"')
    if not SUPABASE_KEY:
        print("Set SUPABASE_SERVICE_ROLE_KEY env var or ensure .env.local exists")
        sys.exit(1)


def fetch_transcript(video_id):
    """Fetch YouTube auto-captions. Returns plain text or None."""
    try:
        ytt = YouTubeTranscriptApi()
        transcript = ytt.fetch(video_id)
        text = " ".join([snippet.text for snippet in transcript])
        words = text.split()
        if len(words) > MAX_WORDS:
            words = words[:MAX_WORDS]
        return " ".join(words)
    except Exception as e:
        print(f"  x {video_id}: {e}")
        return None


def main():
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Get videos without transcripts — prioritise battle reports and long videos
    result = (
        sb.table("battle_reports")
        .select("id, youtube_video_id, title, content_type, duration_seconds")
        .is_("transcript", "null")
        .gt("duration_seconds", 900)
        .order("view_count", desc=True)
        .limit(BATCH_SIZE)
        .execute()
    )

    videos = result.data
    if not videos:
        print("No videos need transcripts. All caught up!")
        return

    print(f"Fetching transcripts for {len(videos)} videos...\n")

    success = 0
    failed = 0

    for v in videos:
        vid_id = v["youtube_video_id"]
        title = v["title"][:70]
        mins = v["duration_seconds"] // 60
        print(f"  [{v['content_type']:15s}] ({mins}min) {title}")

        transcript = fetch_transcript(vid_id)

        if transcript:
            word_count = len(transcript.split())
            sb.table("battle_reports").update({
                "transcript": transcript,
                "has_transcript": True,
            }).eq("id", v["id"]).execute()
            print(f"    -> {word_count} words stored")
            success += 1
        else:
            # Mark as attempted
            sb.table("battle_reports").update({
                "has_transcript": True,
            }).eq("id", v["id"]).execute()
            failed += 1

    print(f"\nDone! {success} transcripts fetched, {failed} failed.")
    if success > 0:
        print("Now reset parsed_at and run the parse cron to re-parse with transcripts.")


if __name__ == "__main__":
    main()
