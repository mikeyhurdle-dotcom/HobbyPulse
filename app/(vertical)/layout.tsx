import type { Metadata } from "next";
import { getSiteVertical } from "@/lib/site";
import { getMetaTitleSuffix } from "@/lib/seo";

// ---------------------------------------------------------------------------
// Dynamic metadata
// ---------------------------------------------------------------------------

export async function generateMetadata(): Promise<Metadata> {
  const config = getSiteVertical();

  return {
    title: {
      default: getMetaTitleSuffix(),
      template: `%s | ${getMetaTitleSuffix()}`,
    },
    description: config.brand.tagline,
  };
}

// ---------------------------------------------------------------------------
// Layout — injects vertical theme CSS variables
// ---------------------------------------------------------------------------

export default function VerticalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = getSiteVertical();

  return (
    <div
      className="min-h-screen"
      data-vertical={config.slug}
      style={
        {
          "--vertical-accent": config.theme.accent,
          "--vertical-accent-light": config.theme.accentLight,
          "--vertical-accent-glow": config.theme.accentGlow,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
