import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { getSiteVertical, getSiteBrand } from "@/lib/site";
import { GameCompare } from "@/components/game-compare";

export async function generateMetadata(): Promise<Metadata> {
  const brand = getSiteBrand();
  return {
    title: `Compare Board Games | ${brand.siteName}`,
    description:
      "Compare any two board games side by side — ratings, player count, play time, complexity, and more.",
    openGraph: {
      title: `Compare Board Games | ${brand.siteName}`,
      description:
        "Compare any two board games side by side — ratings, complexity, and more.",
      type: "website",
    },
  };
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const config = getSiteVertical();
  if (config.slug !== "warhammer") redirect("/");

  const params = await searchParams;

  return (
    <div className="min-h-screen bg-background">
      <Nav active="boardgames" />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Compare Board Games
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Search for two games and see how they stack up side by side.
          </p>
        </div>
        <GameCompare initialA={params.a} initialB={params.b} />
      </main>
    </div>
  );
}
