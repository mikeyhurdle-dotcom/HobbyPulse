export type PipelineTemplate = "review" | "best-list" | "how-to-play" | "versus";

interface TemplateContext {
  gameTitle: string;
  sourceChannelName?: string;
  articleSlug?: string;
}

const REQUIRED_HEADINGS = [
  "## At a Glance",
  "## Where to Buy",
  "## Related Articles",
];

function hasHeading(content: string, heading: string) {
  return content.toLowerCase().includes(heading.toLowerCase());
}

export function buildTemplateMarkdown(template: PipelineTemplate, ctx: TemplateContext): string {
  const game = ctx.gameTitle || "This Game";
  const source = ctx.sourceChannelName ? `\n_Source: ${ctx.sourceChannelName}_\n` : "";

  const sharedTop = [
    "## At a Glance",
    "- **Players:** TBD",
    "- **Play time:** TBD",
    "- **Age:** TBD",
    "- **Complexity:** TBD",
    "- **Price range:** TBD",
    "",
  ];

  const bodyByType: Record<PipelineTemplate, string[]> = {
    review: [
      "## Overview",
      `What ${game} is about, and why people are talking about it.${source}`,
      "",
      "## How It Plays",
      "Core loop, turn flow, and key mechanisms.",
      "",
      "## What Works",
      "",
      "## What Doesn't",
      "",
      "## Who It's For",
      "",
      "## Who Should Skip",
      "",
      "## Verdict",
      "",
    ],
    "best-list": [
      "## Why This List Matters",
      "",
      "## Top Picks",
      "1. **Game Name** — Why it made the list. Best for: __. Skip if: __.",
      "2. **Game Name** — Why it made the list. Best for: __. Skip if: __.",
      "3. **Game Name** — Why it made the list. Best for: __. Skip if: __.",
      "",
      "## How We Chose These Games",
      "",
    ],
    "how-to-play": [
      "## Overview",
      "",
      "## Components",
      "",
      "## Setup",
      "",
      "## Objective",
      "",
      "## Turn Structure",
      "",
      "## Key Rules",
      "",
      "## Scoring",
      "",
      "## Tips for Your First Game",
      "",
    ],
    versus: [
      "## The Contenders",
      "",
      "## Head-to-Head",
      "| Factor | Game A | Game B |",
      "|---|---|---|",
      "| Player Count | TBD | TBD |",
      "| Play Time | TBD | TBD |",
      "| Complexity | TBD | TBD |",
      "",
      "## Which One Should You Buy?",
      "",
      "## Who Should Skip Each",
      "- **Game A:** Skip if ...",
      "- **Game B:** Skip if ...",
      "",
    ],
  };

  return [...sharedTop, ...bodyByType[template], "## Where to Buy", "- Amazon: TBD", "- Zatu: TBD", "- Wayland Games: TBD", "", "## Related Articles", "- _Added by internal-linking helper_"].join("\n");
}

export function enforceArticleTemplate(content: string): string {
  let out = content.trim();
  for (const heading of REQUIRED_HEADINGS) {
    if (!hasHeading(out, heading)) {
      out += `\n\n${heading}\nTBD`;
    }
  }

  if (!hasHeading(out, "## At a Glance")) {
    out += "\n\n## At a Glance\n- **Players:** TBD\n- **Play time:** TBD\n- **Age:** TBD\n- **Complexity:** TBD\n- **Price range:** TBD";
  }

  return out;
}

export interface InternalLinkCandidate {
  slug: string;
  title: string;
  article_type: PipelineTemplate;
}

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function routeForType(type: PipelineTemplate): string {
  switch (type) {
    case "review":
      return "reviews";
    case "best-list":
      return "best";
    case "how-to-play":
      return "how-to-play";
    case "versus":
      return "versus";
  }
}

export function buildInternalLinks(
  articleTitle: string,
  articleType: PipelineTemplate,
  existing: InternalLinkCandidate[],
): string[] {
  const titleTokens = new Set(tokenize(articleTitle));

  return existing
    .filter((row) => row.article_type !== articleType)
    .map((row) => {
      const score = tokenize(row.title).reduce(
        (acc, token) => (titleTokens.has(token) ? acc + 1 : acc),
        0,
      );
      return { row, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((x) => `- [${x.row.title}](/boardgames/${routeForType(x.row.article_type)}/${x.row.slug})`);
}

export function injectInternalLinks(content: string, links: string[]): string {
  if (links.length === 0) return content;
  const section = `## Related Articles\n${links.join("\n")}`;

  if (/##\s+Related Articles/i.test(content)) {
    return content.replace(/##\s+Related Articles[\s\S]*$/i, section);
  }

  return `${content}\n\n${section}`;
}

export function lintEditorialVoice(content: string): { ok: boolean; missing: string[] } {
  const checks: Array<{ name: string; pass: boolean }> = [
    {
      name: "who-should-skip",
      pass: /who\s+should\s+skip|skip\s+if/i.test(content),
    },
    {
      name: "explicit-tradeoff",
      pass: /what\s+doesn'?t|downsides?|trade-?off|caveat/i.test(content),
    },
    {
      name: "concrete-recommendation",
      pass: /best\s+for:|you'?ll\s+love\s+it\s+if|look\s+elsewhere\s+if/i.test(content),
    },
    {
      name: "forbidden-generic-intro",
      pass: !/in\s+today'?s\s+fast-?paced\s+world|whether\s+you'?re\s+a\s+seasoned\s+veteran\s+or\s+a\s+newcomer|dive\s+into\s+the\s+exciting\s+world\s+of/i.test(content),
    },
  ];

  const missing = checks.filter((c) => !c.pass).map((c) => c.name);
  return { ok: missing.length === 0, missing };
}
