import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Nav } from "@/components/nav";
import { getArticle, listSlugs } from "@/lib/boardgame-articles";
import { getSiteVertical } from "@/lib/site";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { withMetaTitle } from "@/lib/seo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return listSlugs("versus").map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle("versus", slug);

  if (!article) return { title: "Not found" };

  return {
    title: withMetaTitle(article.title),
    description: article.excerpt,
    openGraph: {
      title: withMetaTitle(article.title),
      description: article.excerpt,
      type: "article",
      publishedTime: article.publishedAt,
      authors: [article.author],
    },
    twitter: {
      card: "summary",
      title: withMetaTitle(article.title),
      description: article.excerpt,
    },
  };
}

export default async function VersusDetailPage({ params }: PageProps) {
  const config = getSiteVertical();
  if (config.slug !== "warhammer") redirect("/");

  const { slug } = await params;
  const article = getArticle("versus", slug);
  if (!article) notFound();

  return (
    <div className="min-h-screen bg-background">
      <Nav active="boardgames" />

      <main className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <Link
          href="/boardgames/versus"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to comparisons
        </Link>

        <article>
          <header className="mb-10 border-b border-border pb-8">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="secondary" className="text-[10px]">
                Versus
              </Badge>
              {article.tags?.map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight md:text-5xl">
              {article.title}
            </h1>
            {article.excerpt && (
              <p className="mt-4 text-lg text-muted-foreground">
                {article.excerpt}
              </p>
            )}
          </header>

          <div
            className="
              max-w-none text-foreground leading-relaxed
              [&_p]:my-5 [&_p]:text-base md:[&_p]:text-lg
              [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:font-[family-name:var(--font-display)] [&_h2]:text-2xl md:[&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:tracking-tight
              [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:font-[family-name:var(--font-display)] [&_h3]:text-xl md:[&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:tracking-tight
              [&_ul]:my-5 [&_ul]:pl-6 [&_ul]:list-disc
              [&_ol]:my-5 [&_ol]:pl-6 [&_ol]:list-decimal
              [&_li]:my-2
              [&_strong]:font-semibold [&_strong]:text-foreground
              [&_em]:italic
              [&_a]:text-[var(--vertical-accent)] [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:opacity-80
              [&_blockquote]:my-6 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--vertical-accent)] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
              [&_code]:rounded [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:font-mono
              [&_hr]:my-10 [&_hr]:border-border
              [&_table]:my-6 [&_table]:w-full [&_table]:border-collapse
              [&_th]:border [&_th]:border-border [&_th]:bg-secondary [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold
              [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2
            "
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {article.content}
            </ReactMarkdown>
          </div>
        </article>
      </main>
    </div>
  );
}
