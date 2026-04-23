import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { getSiteVertical } from "@/lib/site";
import { listArticles } from "@/lib/boardgame-articles";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { withMetaTitle } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: withMetaTitle("Board Game Reviews"),
    description:
      "In-depth board game reviews with honest verdicts, player counts, complexity ratings, and who each game is for.",
  };
}

export default function ReviewsIndexPage() {
  const config = getSiteVertical();
  if (config.slug !== "warhammer") redirect("/");

  const articles = listArticles("reviews");

  return (
    <div className="min-h-screen bg-background">
      <Nav active="boardgames" />

      <main className="mx-auto max-w-4xl px-4 py-12 md:py-16">
        <Link
          href="/boardgames"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Board Games
        </Link>

        <header className="mb-10 border-b border-border pb-8">
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight md:text-5xl">
            Reviews
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            In-depth board game reviews with honest verdicts.
          </p>
        </header>

        {articles.length === 0 ? (
          <p className="text-muted-foreground">
            No reviews yet. Check back soon.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {articles.map((article) => (
              <li key={article.slug} className="py-6 first:pt-0 last:pb-0">
                <article>
                  <Link
                    href={`/boardgames/reviews/${article.slug}`}
                    className="group block"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {article.playerCount && (
                        <Badge variant="secondary" className="text-[10px]">
                          {article.playerCount} players
                        </Badge>
                      )}
                      {article.complexity && (
                        <Badge variant="secondary" className="text-[10px]">
                          Complexity: {article.complexity}
                        </Badge>
                      )}
                      {article.tags?.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight transition-colors group-hover:text-[var(--vertical-accent)]">
                      {article.title}
                    </h2>
                    {article.excerpt && (
                      <p className="mt-2 text-muted-foreground">
                        {article.excerpt}
                      </p>
                    )}
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
