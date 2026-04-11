import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { getSiteVertical, getSiteBrand } from "@/lib/site";
import { GameRecommender } from "@/components/game-recommender";

export async function generateMetadata(): Promise<Metadata> {
  const brand = getSiteBrand();
  return {
    title: `What Should I Play? | ${brand.siteName}`,
    description:
      "Answer 4 quick questions and get personalised board game recommendations based on player count, complexity, play time, and vibe.",
    openGraph: {
      title: `What Should I Play? | ${brand.siteName}`,
      description:
        "Answer 4 quick questions and get personalised board game recommendations.",
      type: "website",
    },
  };
}

export default async function RecommendPage({
  searchParams,
}: {
  searchParams: Promise<{
    players?: string;
    complexity?: string;
    time?: string;
    vibe?: string;
  }>;
}) {
  const config = getSiteVertical();
  if (config.slug !== "warhammer") redirect("/");

  const params = await searchParams;

  // If query params exist, pass them as initial answers (shareable URLs)
  const initialAnswers =
    params.players || params.complexity || params.time || params.vibe
      ? {
          players: params.players,
          complexity: params.complexity,
          time: params.time,
          vibe: params.vibe,
        }
      : undefined;

  return (
    <div className="min-h-screen bg-background">
      <Nav active="boardgames" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            What Should I Play?
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Answer 4 quick questions and we&apos;ll recommend the perfect board
            games for your group.
          </p>
        </div>
        <GameRecommender initialAnswers={initialAnswers} />
      </main>
    </div>
  );
}
