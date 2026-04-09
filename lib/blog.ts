// ---------------------------------------------------------------------------
// Blog post loader
// ---------------------------------------------------------------------------
// Filesystem-backed blog. Posts live in `content/blog/{vertical}/*.md` with
// YAML frontmatter. Git-versioned, zero DB overhead, easy to author in any
// editor. Per-vertical scoping means TabletopWatch and SimRaceWatch can
// publish independent editorial without cross-contamination.
// ---------------------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export interface BlogPostFrontmatter {
  title: string;
  excerpt: string;
  publishedAt: string;
  author: string;
  tags?: string[];
  heroImage?: string;
  draft?: boolean;
}

export interface BlogPostSummary extends BlogPostFrontmatter {
  slug: string;
}

export interface BlogPost extends BlogPostSummary {
  content: string;
}

const CONTENT_ROOT = path.join(process.cwd(), "content", "blog");

function getVerticalDir(vertical: string): string {
  return path.join(CONTENT_ROOT, vertical);
}

function readPostFile(vertical: string, filename: string): BlogPost | null {
  const fullPath = path.join(getVerticalDir(vertical), filename);
  if (!fs.existsSync(fullPath)) return null;

  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);

  // gray-matter auto-parses bare YAML dates (e.g. `publishedAt: 2026-04-09`)
  // into JS Date objects. Coerce to ISO-8601 date strings so downstream
  // .localeCompare() / rendering logic has a stable string contract.
  const rawPublished = (data as Record<string, unknown>).publishedAt;
  const publishedAt: string | null =
    rawPublished instanceof Date
      ? rawPublished.toISOString().slice(0, 10)
      : typeof rawPublished === "string"
        ? rawPublished
        : null;

  const frontmatter = data as Partial<BlogPostFrontmatter>;
  if (!frontmatter.title || !publishedAt) return null;
  if (frontmatter.draft) return null;

  return {
    slug: filename.replace(/\.md$/, ""),
    title: frontmatter.title,
    excerpt: frontmatter.excerpt ?? "",
    publishedAt,
    author: frontmatter.author ?? "TabletopWatch",
    tags: frontmatter.tags ?? [],
    heroImage: frontmatter.heroImage,
    content,
  };
}

/**
 * List all published posts for a vertical, newest first.
 * Returns summaries (no content body) for the listing page.
 */
export function listPosts(vertical: string): BlogPostSummary[] {
  const dir = getVerticalDir(vertical);
  if (!fs.existsSync(dir)) return [];

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"));

  const posts = files
    .map((f) => readPostFile(vertical, f))
    .filter((p): p is BlogPost => p !== null)
    .map(({ content: _content, ...summary }) => summary);

  return posts.sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );
}

/**
 * Load a single post by slug for the current vertical.
 * Returns null if the post doesn't exist or is marked as a draft.
 */
export function getPost(vertical: string, slug: string): BlogPost | null {
  // Slug is user-supplied via the URL — whitelist characters to prevent
  // directory traversal (e.g. `../secret`).
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  return readPostFile(vertical, `${slug}.md`);
}

/**
 * Return all slugs for a vertical — used by generateStaticParams.
 */
export function listSlugs(vertical: string): string[] {
  return listPosts(vertical).map((p) => p.slug);
}

/**
 * Format a YYYY-MM-DD string as "9 Apr 2026" (en-GB).
 */
export function formatPostDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
