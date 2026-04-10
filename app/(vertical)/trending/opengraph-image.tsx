import { ImageResponse } from "next/og";
import { getSiteBrand, getSiteVertical } from "@/lib/site";

export const runtime = "edge";
export const alt = "Top price drops this week";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TrendingOgImage() {
  const brand = getSiteBrand();
  const config = getSiteVertical();
  const isSimRacing = config.slug === "simracing";
  const headline = isSimRacing
    ? "Top Sim Racing Deals This Week"
    : "Top Miniature Price Drops This Week";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px",
          backgroundColor: "#0a0a0a",
          fontFamily: "sans-serif",
          backgroundImage:
            "radial-gradient(circle at 85% 15%, rgba(239, 68, 68, 0.18) 0%, transparent 50%)",
        }}
      >
        {/* Top — brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "26px",
            fontWeight: 700,
            color: config.theme.accentLight,
          }}
        >
          {brand.siteName}
        </div>

        {/* Middle — headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              width: "fit-content",
              padding: "8px 18px",
              borderRadius: "999px",
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              border: "2px solid rgba(239, 68, 68, 0.5)",
              color: "#fca5a5",
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            📉 Trending This Week
          </div>

          <div
            style={{
              fontSize: "72px",
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.05,
              letterSpacing: "-2px",
              maxWidth: "1050px",
            }}
          >
            {headline}
          </div>
        </div>

        {/* Bottom — tagline */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", fontSize: "22px", color: "#a1a1aa" }}>
            Updated hourly · Tracked across every major retailer
          </div>
          <div
            style={{
              width: "90px",
              height: "6px",
              backgroundColor: config.theme.accent,
              borderRadius: "3px",
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
