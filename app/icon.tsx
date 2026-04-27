import { ImageResponse } from "next/og";
import { getSiteBrand, getSiteVertical } from "@/lib/site";

// Route-level icon generation — Next.js wires this up as a favicon
// automatically. Using ImageResponse avoids committing PNG assets.
export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 512, height: 512 };

export default function Icon() {
  const brand = getSiteBrand();
  const config = getSiteVertical();
  const accent = config.slug === "tabletop" ? "#3a9a9a" : "#d13a2c";
  const initials = brand.siteName
    .replace(/[^A-Z]/g, "")
    .slice(0, 2) || brand.siteName.slice(0, 2).toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          borderRadius: "80px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "80%",
            height: "80%",
            borderRadius: "60px",
            backgroundColor: accent,
            fontSize: "220px",
            fontWeight: 900,
            color: "#0a0a0a",
            letterSpacing: "-10px",
            fontFamily: "sans-serif",
          }}
        >
          {initials}
        </div>
      </div>
    ),
    { ...size },
  );
}
