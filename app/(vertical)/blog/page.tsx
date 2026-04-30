import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Nav } from "@/components/nav";
import { listPosts, formatPostDate } from "@/lib/blog";
import { getSiteVertical, getSiteBrand } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const brand = getSiteBrand();
  const url = `https://${brand.domain}/blog`;
  return {
    title: `Blog | ${brand.siteName}`,
    description: `Editorial posts, buying guides, and opinions from ${brand.siteName}.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${brand.siteName} Blog`,
      description: `Editorial posts, buying guides, and opinions from ${brand.siteName}.`,
      url,
      type: "website",
    },
  };
}

export default function BlogIndexPage() {
  const vertical = getSiteVertical();
  const brand = getSiteBrand();
  const posts = listPosts(vertical.slug);

  return (
    <div className="min-h-screen bg-background">
      <Nav active="blog" />

      <main className="mx-auto max-w-4xl px-4 py-12 md:py-16">
        <header className="mb-10 border-b border-border pb-8">
          <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            Blog
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Editorial posts, buying guides, and honest takes from {brand.siteName}.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="text-muted-foreground">
            No posts yet. Check back soon.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {posts.map((post) => (
              <li key={post.slug} className="py-6 first:pt-0 last:pb-0">
                <article>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group block focus:outline-none"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      {post.heroImage && (
                        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border border-border bg-secondary sm:w-48 sm:flex-shrink-0">
                          <Image
                            src={post.heroImage}
                            alt={post.title}
                            fill
                            sizes="(min-width: 640px) 12rem, 100vw"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <time
                          dateTime={post.publishedAt}
                          className="text-xs uppercase tracking-wider text-muted-foreground"
                        >
                          {formatPostDate(post.publishedAt)}
                        </time>
                        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight transition-colors group-hover:text-[var(--vertical-accent)]">
                          {post.title}
                        </h2>
                        {post.excerpt && (
                          <p className="mt-2 text-muted-foreground">
                            {post.excerpt}
                          </p>
                        )}
                        {post.tags && post.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
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
                      </div>
                    </div>
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
