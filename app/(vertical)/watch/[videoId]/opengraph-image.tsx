import { ImageResponse } from "next/og";
import { getSiteBrand, getSiteVertical } from "@/lib/site";
import { supabase } from "@/lib/supabase";

export const runtime = "edge";
export const alt = "Video";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = await params;
  const brand = getSiteBrand();
  const config = getSiteVertical();

  const { data: report } = await supabase
    .from("battle_reports")
    .select(
      `title, view_count, published_at,
       channels ( name ),
       content_lists ( categories ( name, colour ) )`,
    )
    .eq("youtube_video_id", videoId)
    .single();

  const title = (report as any)?.title ?? "Video";
  const channelName = (report as any)?.channels?.name ?? "";
  const viewCount = (report as any)?.view_count ?? 0;
  const publishedAt = (report as any)?.published_at
    ? new Date((report as any).published_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  // Extract unique faction names
  const factions: string[] = [];
  const seen = new Set<string>();
  for (const list of (report as any)?.content_lists ?? []) {
    const name = list?.categories?.name;
    if (name && !seen.has(name)) {
      seen.add(name);
      factions.push(name);
    }
  }

  const viewStr =
    viewCount >= 1_000_000
      ? `${(viewCount / 1_000_000).toFixed(1)}M views`
      : viewCount >= 1_000
        ? `${(viewCount / 1_000).toFixed(1)}K views`
        : `${viewCount} views`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          backgroundColor: "#0a0a0a",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top: brand */}
        <div style={{ display: "flex", fontSize: "24px", fontWeight: 700, color: config.theme.accentLight }}>
          {brand.siteName}
        </div>

        {/* Middle: title + factions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontSize: "48px",
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.1,
              letterSpacing: "-1px",
              maxWidth: "1000px",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title.length > 80 ? title.slice(0, 80) + "..." : title}
          </div>

          {factions.length > 0 && (
            <div style={{ display: "flex", gap: "12px" }}>
              {factions.slice(0, 4).map((f) => (
                <div
                  key={f}
                  style={{
                    padding: "6px 16px",
                    borderRadius: "20px",
                    border: `2px solid ${config.theme.accent}`,
                    color: config.theme.accentLight,
                    fontSize: "18px",
                    fontWeight: 600,
                  }}
                >
                  {f}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom: channel + meta */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: "20px", color: "#a1a1aa", fontWeight: 500 }}>
            {channelName}
          </div>
          <div style={{ display: "flex", gap: "24px", fontSize: "18px", color: "#71717a" }}>
            <span>{viewStr}</span>
            <span>{publishedAt}</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
