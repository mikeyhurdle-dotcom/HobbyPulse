import type { ComponentProps } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Hosts and query patterns that mark a link as affiliate / sponsored.
// Tealium iQ's delegate listener fires `affiliate_click` only for anchors
// with `rel*="sponsored"`, and Google's webmaster guidance requires the
// attribute on monetised outbound links.
const AFFILIATE_HOST_PATTERNS: RegExp[] = [
  /(^|\.)amazon\.co\.uk$/i,
  /(^|\.)amazon\.com$/i,
  /(^|\.)ebay\.co\.uk$/i,
  /(^|\.)ebay\.com$/i,
  /(^|\.)rover\.ebay\.com$/i,
  /(^|\.)awin1\.com$/i,
  /(^|\.)partnerize\.com$/i,
  /(^|\.)prf\.hn$/i,
  /(^|\.)impact\.com$/i,
  /(^|\.)elementgames\.co\.uk$/i,
  /(^|\.)waylandgames\.co\.uk$/i,
  /(^|\.)goblingaming\.co\.uk$/i,
  /(^|\.)magicmadhouse\.co\.uk$/i,
  /(^|\.)board-game\.co\.uk$/i,
  /(^|\.)zatu\.co\.uk$/i,
  /(^|\.)backerkit\.com$/i,
  /(^|\.)trakracer\.com$/i,
  /(^|\.)mozaracing\.com$/i,
  /(^|\.)simagic\.com$/i,
];

const AFFILIATE_QUERY_TOKENS = [
  "tag=",
  "mkrid=",
  "mkcid=",
  "campid=",
  "?aff=",
  "&aff=",
  "?ref=",
  "&ref=",
  "tabletopwatch-21",
  "simracewatch-21",
];

function isAffiliateUrl(href: string): boolean {
  if (!href) return false;
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return false;
  }
  if (!/^https?:$/.test(url.protocol)) return false;

  const host = url.hostname;
  if (AFFILIATE_HOST_PATTERNS.some((re) => re.test(host))) return true;

  const lower = href.toLowerCase();
  if (AFFILIATE_QUERY_TOKENS.some((tok) => lower.includes(tok))) return true;

  return false;
}

type MarkdownAnchorProps = ComponentProps<"a"> & { node?: unknown };

function MarkdownAnchor({
  href,
  children,
  node: _node,
  ...rest
}: MarkdownAnchorProps) {
  const target = href ?? "";
  const sponsored = isAffiliateUrl(target);

  if (sponsored) {
    return (
      <a
        href={target}
        rel="sponsored noopener"
        target="_blank"
        {...rest}
      >
        {children}
      </a>
    );
  }

  // External non-affiliate links still get noopener for safety; internal
  // links pass through unchanged.
  const isExternal = /^https?:/i.test(target);
  if (isExternal) {
    return (
      <a href={target} rel="noopener" target="_blank" {...rest}>
        {children}
      </a>
    );
  }

  return (
    <a href={target} {...rest}>
      {children}
    </a>
  );
}

export function BlogMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{ a: MarkdownAnchor }}
    >
      {content}
    </ReactMarkdown>
  );
}
