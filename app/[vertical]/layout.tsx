import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getVertical, getAllVerticals } from "@/lib/verticals";

// ---------------------------------------------------------------------------
// Static params — tell Next.js which vertical slugs to pre-render
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  return getAllVerticals().map((v) => ({ vertical: v.slug }));
}

// ---------------------------------------------------------------------------
// Dynamic metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vertical: string }>;
}): Promise<Metadata> {
  const { vertical: slug } = await params;
  const config = getVertical(slug);

  if (!config) {
    return { title: "Not Found | HobbyPulse" };
  }

  return {
    title: `${config.name} | HobbyPulse`,
    description: config.description,
  };
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export default async function VerticalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ vertical: string }>;
}) {
  const { vertical: slug } = await params;
  const config = getVertical(slug);

  if (!config) {
    notFound();
  }

  return (
    <div
      className="min-h-screen"
      data-vertical={slug}
      style={
        {
          "--vertical-accent": config.theme.accent,
          "--vertical-accent-light": config.theme.accentLight,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
