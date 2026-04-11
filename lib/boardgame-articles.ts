// ---------------------------------------------------------------------------
// Board game article loader
// ---------------------------------------------------------------------------
// Filesystem-backed board game content. Articles live in
// `content/boardgames/{article_type}/*.md` with YAML frontmatter.
// Mirrors the blog loader pattern from lib/blog.ts.
// ---------------------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type ArticleType = "reviews" | "best" | "versus" | "how-to-play";

export interface BoardGameArticleFrontmatter {
  title: string;
  excerpt: string;
  publishedAt: string;
  author: string;
  articleType: ArticleType;
  tags?: string[];
  heroImage?: string;
  // Game metadata (primarily for reviews)
  playerCount?: string; // e.g. "1-5"
  playTime?: string; // e.g. "40-70 minutes"
  ageRating?: string; // e.g. "10+"
  complexity?: string; // e.g. "2.4/5"
  priceRange?: string; // e.g. "£30-£45"
  // Affiliate links
  amazonAsin?: string; // e.g. "B07YQ1P4YJ"
  zatuUrl?: string; // full Zatu product URL
  draft?: boolean;
}

export interface BoardGameArticleSummary extends BoardGameArticleFrontmatter {
  slug: string;
}

export interface BoardGameArticle extends BoardGameArticleSummary {
  content: string;
}

const CONTENT_ROOT = path.join(process.cwd(), "content", "boardgames");

function getTypeDir(articleType: ArticleType): string {
  return path.join(CONTENT_ROOT, articleType);
}

function readArticleFile(
  articleType: ArticleType,
  filename: string,
): BoardGameArticle | null {
  const fullPath = path.join(getTypeDir(articleType), filename);
  if (!fs.existsSync(fullPath)) return null;

  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);

  // Coerce YAML dates to ISO-8601 strings (same as lib/blog.ts)
  const rawPublished = (data as Record<string, unknown>).publishedAt;
  const publishedAt: string | null =
    rawPublished instanceof Date
      ? rawPublished.toISOString().slice(0, 10)
      : typeof rawPublished === "string"
        ? rawPublished
        : null;

  const fm = data as Partial<BoardGameArticleFrontmatter>;
  if (!fm.title || !publishedAt) return null;
  if (fm.draft) return null;

  return {
    slug: filename.replace(/\.md$/, ""),
    title: fm.title,
    excerpt: fm.excerpt ?? "",
    publishedAt,
    author: fm.author ?? "TabletopWatch",
    articleType,
    tags: fm.tags ?? [],
    heroImage: fm.heroImage,
    playerCount: fm.playerCount,
    playTime: fm.playTime,
    ageRating: fm.ageRating,
    complexity: fm.complexity,
    priceRange: fm.priceRange,
    amazonAsin: fm.amazonAsin,
    zatuUrl: fm.zatuUrl,
    content,
  };
}

/**
 * List all published articles for a given type, newest first.
 * Returns summaries (no content body) for listing pages.
 */
export function listArticles(articleType: ArticleType): BoardGameArticleSummary[] {
  const dir = getTypeDir(articleType);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));

  const articles = files
    .map((f) => readArticleFile(articleType, f))
    .filter((a): a is BoardGameArticle => a !== null)
    .map(({ content: _content, ...summary }) => summary);

  return articles.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/**
 * Load a single article by type and slug.
 * Returns null if the article doesn't exist or is a draft.
 */
export function getArticle(
  articleType: ArticleType,
  slug: string,
): BoardGameArticle | null {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  return readArticleFile(articleType, `${slug}.md`);
}

/**
 * Return all slugs for a given article type — used by generateStaticParams.
 */
export function listSlugs(articleType: ArticleType): string[] {
  return listArticles(articleType).map((a) => a.slug);
}

/**
 * List all published articles across every type, newest first.
 */
export function listAllArticles(): BoardGameArticleSummary[] {
  const types: ArticleType[] = ["reviews", "best", "versus", "how-to-play"];
  const all = types.flatMap((t) => listArticles(t));
  return all.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/** Human-readable labels for article types. */
export const articleTypeLabels: Record<ArticleType, string> = {
  reviews: "Reviews",
  best: "Best Of",
  versus: "Versus",
  "how-to-play": "How to Play",
};

/** URL path segment for each article type. */
export const articleTypeRoutes: Record<ArticleType, string> = {
  reviews: "reviews",
  best: "best",
  versus: "versus",
  "how-to-play": "how-to-play",
};
