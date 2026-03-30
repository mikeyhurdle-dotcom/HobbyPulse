import { ImageResponse } from "next/og";
import { getSiteBrand, getSiteVertical } from "@/lib/site";
import { supabase } from "@/lib/supabase";

export const runtime = "edge";
export const alt = "Product Deal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ productSlug: string }>;
}) {
  const { productSlug } = await params;
  const brand = getSiteBrand();
  const config = getSiteVertical();

  const { data: verticalRow } = await supabase
    .from("verticals")
    .select("id")
    .eq("slug", config.slug)
    .single();

  const { data: rawProduct } = await supabase
    .from("products")
    .select(
      "name, rrp_pence, listings ( price_pence, source )",
    )
    .eq("vertical_id", verticalRow?.id ?? "")
    .eq("slug", productSlug)
    .single();

  const product = rawProduct as any;
  const name = product?.name ?? "Product";
  const listings = product?.listings ?? [];

  const bestPrice = listings.reduce(
    (best: number | null, l: any) =>
      best === null || l.price_pence < best ? l.price_pence : best,
    null,
  );

  const rrp = product?.rrp_pence ?? null;
  const savingsPercent =
    rrp && bestPrice && rrp > bestPrice
      ? Math.round(((rrp - bestPrice) / rrp) * 100)
      : null;

  const sourceCount = new Set(listings.map((l: any) => l.source)).size;
  const priceStr = bestPrice !== null ? `\u00A3${(bestPrice / 100).toFixed(2)}` : "";

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

        {/* Middle: product name + price */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              fontSize: "44px",
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.1,
              maxWidth: "900px",
            }}
          >
            {name.length > 60 ? name.slice(0, 60) + "..." : name}
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "20px" }}>
            {priceStr && (
              <div style={{ fontSize: "64px", fontWeight: 800, color: "#22c55e" }}>
                {priceStr}
              </div>
            )}
            {savingsPercent !== null && savingsPercent > 0 && (
              <div
                style={{
                  padding: "8px 20px",
                  borderRadius: "24px",
                  backgroundColor: "#22c55e",
                  color: "#ffffff",
                  fontSize: "28px",
                  fontWeight: 700,
                }}
              >
                Save {savingsPercent}%
              </div>
            )}
          </div>
        </div>

        {/* Bottom: source count */}
        <div style={{ display: "flex", fontSize: "20px", color: "#71717a" }}>
          Compare prices from {sourceCount} source{sourceCount !== 1 ? "s" : ""}
        </div>
      </div>
    ),
    { ...size },
  );
}
