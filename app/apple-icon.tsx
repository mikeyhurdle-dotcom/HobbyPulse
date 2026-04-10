import { ImageResponse } from "next/og";
import { getSiteBrand, getSiteVertical } from "@/lib/site";

// Apple touch icon — iOS home screen picks this up instead of the manifest
// icon. Matching layout to `app/icon.tsx` but sized per the Apple guideline.
export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 180, height: 180 };

export default function AppleIcon() {
  const brand = getSiteBrand();
  const config = getSiteVertical();
  const accent = config.slug === "warhammer" ? "#c89f56" : "#d13a2c";
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
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "90%",
            height: "90%",
            borderRadius: "24px",
            backgroundColor: accent,
            fontSize: "80px",
            fontWeight: 900,
            color: "#0a0a0a",
            letterSpacing: "-3px",
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
