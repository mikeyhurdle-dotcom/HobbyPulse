import { ImageResponse } from "next/og";
import { getSiteBrand, getSiteVertical } from "@/lib/site";

export const runtime = "edge";
export const alt = "HobbyPulse";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  const brand = getSiteBrand();
  const config = getSiteVertical();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0a0a0a",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              fontSize: "72px",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-2px",
            }}
          >
            {brand.siteName}
          </div>
          <div
            style={{
              fontSize: "28px",
              color: "#a1a1aa",
              maxWidth: "800px",
              textAlign: "center",
            }}
          >
            {brand.tagline}
          </div>
          <div
            style={{
              marginTop: "24px",
              width: "80px",
              height: "4px",
              backgroundColor: config.theme.accent,
              borderRadius: "2px",
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
