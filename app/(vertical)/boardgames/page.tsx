import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { getSiteVertical, getSiteBrand } from "@/lib/site";
import {
  listAllArticles,
  listArticles,
  articleTypeLabels,
  articleTypeRoutes,
  type ArticleType,
} from "@/lib/boardgame-articles";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const brand = getSiteBrand();
  return {
    title: `Board Games | ${brand.siteName}`,
    description:
      "Board game reviews, best-of lists, head-to-head comparisons, and how-to-play guides.",
    openGraph: {
      title: `Board Games | ${brand.siteName}`,
      description:
        "Board game reviews, best-of lists, head-to-head comparisons, and how-to-play guides.",
      type: "website",
    },
  };
}

const sections: { type: ArticleType; description: string; icon: string }[] = [
  {
    type: "reviews",
    description: "In-depth reviews of the best board games, with honest verdicts and who each game is for.",
    icon: "★",
  },
  {
    type: "best",
    description: "Curated lists of the best board games by category, player count, and budget.",
    icon: "🏆",
  },
  {
    type: "versus",
    description: "Head-to-head comparisons to help you decide which game to buy.",
    icon: "⚔",
  },
  {
    type: "how-to-play",
    description: "Clear, structured rules guides so you can start playing faster.",
    icon: "📖",
  },
];

const tools = [
  {
    label: "Watch Videos",
    href: "/boardgames/watch",
    description: "Reviews, playthroughs, how-to-play guides, and top lists from 20+ channels.",
    icon: "▶",
  },
  {
    label: "Browse All Games",
    href: "/boardgames/games",
    description: "500+ board games with ratings, player counts, and where to buy.",
    icon: "🎲",
  },
  {
    label: "What Should I Play?",
    href: "/boardgames/recommend",
    description: "Answer 4 questions and get personalised game recommendations.",
    icon: "🎯",
  },
  {
    label: "Compare Games",
    href: "/boardgames/compare",
    description: "Side-by-side comparison of any two games.",
    icon: "⚖",
  },
  {
    label: "Upcoming Releases",
    href: "/boardgames/releases",
    description: "Board game release calendar with pre-order links.",
    icon: "📅",
  },
  {
    label: "News",
    href: "/boardgames/news",
    description: "Latest news and announcements from top board game channels.",
    icon: "📰",
  },
];

export default function BoardGamesLandingPage() {
  const config = getSiteVertical();
  if (config.slug !== "tabletop") redirect("/");

  const brand = getSiteBrand();
  const latestArticles = listAllArticles().slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      <Nav active="boardgames" />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div
            className="absolute inset-0 opacity-30 dark:opacity-20"
            style={{
              background:
                "radial-gradient(ellipse 80% 50% at 50% -20%, var(--vertical-accent), transparent)",
            }}
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              Board Games
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Reviews, best-of lists, comparisons, and how-to-play guides —
              everything you need to find your next favourite game.
            </p>
          </div>
        </section>

        {/* Tool cards — directory, recommender, compare */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((t) => (
              <Link key={t.href} href={t.href} className="group">
                <Card className="h-full border-border bg-card hover:border-[var(--vertical-accent)]/40 transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl">{t.icon}</span>
                      <h2 className="text-base font-bold tracking-tight group-hover:text-[var(--vertical-accent-light)] transition-colors">
                        {t.label}
                      </h2>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Section cards */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sections.map((s) => {
              const count = listArticles(s.type).length;
              return (
                <Link
                  key={s.type}
                  href={`/boardgames/${articleTypeRoutes[s.type]}`}
                  className="group"
                >
                  <Card className="h-full border-border bg-card hover:border-[var(--vertical-accent)]/40 transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl">{s.icon}</span>
                        <h2 className="text-base font-bold tracking-tight group-hover:text-[var(--vertical-accent-light)] transition-colors">
                          {articleTypeLabels[s.type]}
                        </h2>
                        {count > 0 && (
                          <Badge variant="secondary" className="ml-auto text-[10px]">
                            {count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {s.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Latest articles */}
        {latestArticles.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Latest Articles
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {latestArticles.map((article) => (
                <Link
                  key={`${article.articleType}-${article.slug}`}
                  href={`/boardgames/${articleTypeRoutes[article.articleType]}/${article.slug}`}
                  className="group"
                >
                  <Card className="h-full border-border bg-card hover:border-[var(--vertical-accent)]/40 transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {articleTypeLabels[article.articleType]}
                        </Badge>
                        {article.tags?.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-[10px]"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-[var(--vertical-accent-light)] transition-colors">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                          {article.excerpt}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {latestArticles.length === 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
            <Card className="border-border bg-card">
              <CardContent className="p-8 text-center">
                <p className="text-lg font-medium mb-2">
                  Content coming soon
                </p>
                <p className="text-sm text-muted-foreground">
                  We&apos;re building out our board game coverage. Check back shortly for
                  reviews, best-of lists, and more.
                </p>
              </CardContent>
            </Card>
          </section>
        )}
      </main>
    </div>
  );
}
