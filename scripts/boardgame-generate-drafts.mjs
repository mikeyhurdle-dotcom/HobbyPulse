import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const queuePath = path.join(root, 'config', 'boardgame-article-queue.json');
const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));

const mapDir = {
  review: 'reviews',
  'best-list': 'best',
  versus: 'versus',
  'how-to-play': 'how-to-play',
};

const existingByType = {};
for (const type of Object.values(mapDir)) {
  const d = path.join(root, 'content', 'boardgames', type);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  existingByType[type] = fs.readdirSync(d).filter((f) => f.endsWith('.md')).map((f) => ({
    slug: f.replace(/\.md$/, ''),
    title: f.replace(/[-_]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()),
    type,
  }));
}

const internalPool = Object.entries(existingByType).flatMap(([type, rows]) => rows.map((r) => ({ ...r, type })));

function routeForType(type) {
  return type;
}

function linksFor(slug, title, selfType) {
  const tokens = new Set(title.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 3));
  return internalPool
    .filter((r) => !(r.slug === slug && r.type === selfType))
    .map((r) => {
      const score = r.title.toLowerCase().split(/[^a-z0-9]+/).filter((t) => tokens.has(t)).length;
      return { r, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => `- [${x.r.title}](/boardgames/${routeForType(x.r.type)}/${x.r.slug})`);
}

function articleBody(entry) {
  const title = entry.title;
  const g = title.replace(/\s*\(.*\)$/,'').replace(/\s*:\s*.*/, '').replace(/^How to Play\s+/i, '').replace(/\s+Review.*/i, '').trim();
  const common = [
    '## SEO Title',
    `${title} | Tabletop Watch — Board Games & Miniatures`,
    '',
    '## Meta Description',
    `${title} broken down with practical buying advice, trade-offs, and a clear recommendation for UK players.`,
    '',
    '## At a Glance',
    '- **Players:** 1-4 (varies by edition)',
    '- **Play time:** 45-90 minutes',
    '- **Age:** 12+',
    '- **Complexity:** Medium',
    '- **Price range:** £25-£60',
    '',
  ];

  let middle = [];
  if (entry.template === 'best-list') {
    middle = [
      '## Why This List Matters',
      `If you are buying ${g} style games tonight, these are the picks that stay on tables instead of sitting on shelves.`,
      '',
      '## Top Picks',
      `1. **${g} Pick #1** — Why it made the list: clear teach and replay value. Best for: mixed groups. Skip if: you want heavy conflict.`,
      `2. **${g} Pick #2** — Why it made the list: stronger strategic depth. Best for: regular game nights. Skip if: analysis paralysis kills your fun.`,
      `3. **${g} Pick #3** — Why it made the list: quick setup and good table talk. Best for: weeknights. Skip if: you only want 2+ hour games.`,
      '',
      "## What Doesn't Work For Everyone",
      'The main trade-off is depth versus teach time. Some picks are easier to table but cap out sooner for hobby-heavy groups.',
      '',
      '## Who Should Skip These Picks',
      'Skip this list if your group only wants campaign-scale games with deep asymmetry every session.',
      '',
      '## How We Chose These Games',
      `We prioritised repeat plays, teach clarity, and whether players still ask for a rematch after game three.`,
      '',
    ];
  } else if (entry.template === 'versus') {
    middle = [
      '## The Contenders',
      `This matchup is close on paper, but the play feel is different once the turns start.`,
      '',
      '## Head-to-Head',
      '| Factor | Game A | Game B |',
      '|---|---|---|',
      '| Player Count | 1-4 | 2-4 |',
      '| Play Time | 60-90m | 45-75m |',
      '| Complexity | Medium-heavy | Medium |',
      '| Cost | £45-£60 | £30-£50 |',
      '',
      '## Which One Should You Buy?',
      `Best for: Game A suits groups that enjoy long arcs and engine planning. Best for: Game B suits groups that want faster turns and lower teach friction.`,
      '',
      '## What Doesn\'t Translate from Hype',
      'The caveat: high review scores hide table-fit problems. One game can feel brilliant at 2 and flat at 4, so match the player count first.',
      '',
      '## Who Should Skip Each',
      '- **Game A:** Skip if your group avoids 90-minute games.',
      '- **Game B:** Skip if you want dense long-term planning every turn.',
      '',
    ];
  } else if (entry.template === 'how-to-play') {
    middle = [
      '## Overview',
      `This teach is built to get ${g} to table quickly without missing the rules people usually forget.`,
      '',
      '## Components',
      'Main board, player boards, tokens, cards, scoring aid.',
      '',
      '## Setup',
      '1. Build the central board and place shared components.',
      '2. Give each player starting resources and hand size.',
      '3. Reveal starting objective cards and first-player marker.',
      '',
      '## Objective',
      'Score the most points by converting actions into efficient turns and end-round bonuses.',
      '',
      '## Turn Structure',
      '1. Choose one action.',
      '2. Resolve immediate effects.',
      '3. Trigger passive bonuses.',
      '4. Refill open markets or displays if required.',
      '',
      '## Key Rules',
      '- If timing conflicts happen, active player resolves first.',
      '- End-round scoring can break ties on objective progress.',
      '- Resource caps matter; over-collecting is often a trap.',
      '',
      '## Scoring',
      'Points come from board state, card combos, and objective completion. Most new players under-score by forgetting passive triggers.',
      '',
      '## What Doesn\'t Click at First',
      'Big caveat: first plays can feel slow if everyone reads every card. Use open-hand learning in round one to cut downtime.',
      '',
      '## Tips for Your First Game',
      'Best for: first-time teachers running a clean first session without rules stalls.',
      '- Prioritise one scoring lane instead of three.',
      '- Spend early turns building action economy.',
      '- Watch opponent tempo, not just your own combo.',
      '- Skip risky pivots in the final round unless they score immediately.',
      '',
      '## Who Should Skip This Game',
      'Skip if your group hates icon-heavy games or prefers pure luck-driven party games.',
      '',
    ];
  } else {
    middle = [
      '## Overview',
      `This review focuses on table feel: how ${g} actually plays after the first honeymoon session.`,
      '',
      '## How It Plays',
      'Core loop, decision tension, and where turns can bog down.',
      '',
      '## What Works',
      '- Strong decision density without overwhelming new players.',
      '- Good replayability from variable setup and objectives.',
      '',
      "## What Doesn't",
      '- Trade-off: teach time is longer than lighter alternatives.',
      '- Setup overhead can kill momentum on short weeknight sessions.',
      '',
      "## Who It's For",
      "You'll love it if your group enjoys tactical planning and post-game discussion.",
      'Look elsewhere if your table wants instant chaos over optimization.',
      '',
      '## Who Should Skip',
      'Skip if your table rarely commits to 60+ minute strategy sessions.',
      '',
      '## Verdict',
      'A strong buy for the right group profile; not an automatic recommendation for everyone.',
      '',
    ];
  }

  const links = linksFor(entry.slug, entry.title, mapDir[entry.template]);
  const related = links.length ? links : ['- [Best Board Games for Couples](/boardgames/best/best-board-games-for-couples)'];

  return [
    ...common,
    ...middle,
    '## Where to Buy',
    '- Amazon: https://www.amazon.co.uk/s?k=board+game',
    '- Zatu: https://www.board-game.co.uk/',
    '- Wayland Games: https://www.waylandgames.co.uk/',
    '',
    '## Related Articles',
    ...related,
    '',
  ].join('\n');
}

const groupsOrder = ['pillar', 'versus', 'how-to-play'];
const generated = [];

for (const g of groupsOrder) {
  const picks = (queue.groups[g] || []).slice(0, 3);
  for (const entry of picks) {
    const dir = mapDir[entry.template];
    const file = path.join(root, 'content', 'boardgames', dir, `${entry.slug}.md`);
    if (fs.existsSync(file)) continue;

    const frontmatter = [
      '---',
      `title: "${entry.title.replace(/"/g, "'")}"`,
      `excerpt: "${entry.title.replace(/"/g, "'")} with practical buyer guidance and clear trade-offs for UK players."`,
      `publishedAt: ${new Date().toISOString().slice(0,10)}`,
      'author: TabletopWatch',
      `articleType: ${dir}`,
      'tags:',
      '  - board-games',
      '  - buying-guide',
      `amazonAsin: "B0DUMMY${Math.floor(Math.random()*900+100)}"`,
      'zatuUrl: "https://www.board-game.co.uk/"',
      'waylandUrl: "https://www.waylandgames.co.uk/"',
      'draft: true',
      '---',
      '',
    ].join('\n');

    fs.writeFileSync(file, `${frontmatter}${articleBody(entry)}\n`);
    generated.push(path.relative(root, file));

    internalPool.push({ slug: entry.slug, title: entry.title, type: dir });
  }
}

console.log(`Generated ${generated.length} draft boardgame articles.`);
for (const f of generated) console.log(`- ${f}`);
