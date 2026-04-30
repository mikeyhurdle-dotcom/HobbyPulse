import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { BlogMarkdown } from "@/components/blog-markdown";
import { getPost, listSlugs, formatPostDate } from "@/lib/blog";
import { getSiteVertical, getSiteBrand } from "@/lib/site";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const vertical = getSiteVertical();
  return listSlugs(vertical.slug).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const vertical = getSiteVertical();
  const brand = getSiteBrand();
  const post = getPost(vertical.slug, slug);

  if (!post) {
    return { title: `Not found | ${brand.siteName}` };
  }

  const url = `https://${brand.domain}/blog/${post.slug}`;

  return {
    title: `${post.title} | ${brand.siteName}`,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author],
      images: post.heroImage ? [{ url: post.heroImage }] : undefined,
    },
    twitter: {
      card: post.heroImage ? "summary_large_image" : "summary",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const vertical = getSiteVertical();
  const post = getPost(vertical.slug, slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav active="blog" />

      <main className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <Link
          href="/blog"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to blog
        </Link>

        <article>
          {post.heroImage && (
            <figure className="mb-8 overflow-hidden rounded-lg border border-border bg-secondary">
              <Image
                src={post.heroImage}
                alt={post.title}
                width={1200}
                height={675}
                priority
                className="h-auto w-full object-cover"
              />
            </figure>
          )}
          <header className="mb-10 border-b border-border pb-8">
            <time
              dateTime={post.publishedAt}
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
              {formatPostDate(post.publishedAt)} · {post.author}
            </time>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-5xl">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-4 text-lg text-muted-foreground">
                {post.excerpt}
              </p>
            )}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div
            className="
              max-w-none text-foreground leading-relaxed
              [&_p]:my-5 [&_p]:text-base md:[&_p]:text-lg
              [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:font-display [&_h2]:text-2xl md:[&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:tracking-tight
              [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:font-display [&_h3]:text-xl md:[&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:tracking-tight
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
            <BlogMarkdown content={post.content} />
          </div>
        </article>
      </main>
    </div>
  );
}
