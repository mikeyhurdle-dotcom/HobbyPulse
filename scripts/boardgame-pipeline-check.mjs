import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const contentRoot = path.join(root, 'content', 'boardgames');
const requiredDirs = ['reviews', 'best', 'versus', 'how-to-play'];
const includeAll = process.argv.includes('--all');
const queuePath = path.join(root, 'config', 'boardgame-article-queue.json');
const queue = fs.existsSync(queuePath) ? JSON.parse(fs.readFileSync(queuePath, 'utf8')) : null;
const queuedSlugs = new Set(
  queue
    ? Object.values(queue.groups || {}).flat().map((e) => e.slug)
    : [],
);
const requiredHeadings = ['## SEO Title', '## Meta Description', '## At a Glance', '## Where to Buy', '## Related Articles'];
const forbiddenPatterns = [
  /in\s+today'?s\s+fast-?paced\s+world/i,
  /whether\s+you'?re\s+a\s+seasoned\s+veteran\s+or\s+a\s+newcomer/i,
  /dive\s+into\s+the\s+exciting\s+world\s+of/i,
];

let failures = 0;

for (const dir of requiredDirs) {
  const full = path.join(contentRoot, dir);
  if (!fs.existsSync(full)) {
    console.log(`❌ Missing directory: content/boardgames/${dir}`);
    failures++;
    continue;
  }

  const files = fs.readdirSync(full).filter((f) => f.endsWith('.md'));
  if (files.length === 0) {
    console.log(`⚠️ No markdown files in content/boardgames/${dir}`);
    continue;
  }

  for (const file of files) {
    const raw = fs.readFileSync(path.join(full, file), 'utf8');
    const slug = file.replace(/\.md$/, '');
    const isDraft = /\bdraft:\s*true\b/i.test(raw);
    const isQueued = queuedSlugs.has(slug);
    if (!includeAll && !(isDraft && isQueued)) continue;

    const missing = requiredHeadings.filter((h) => !raw.toLowerCase().includes(h.toLowerCase()));
    if (missing.length) {
      console.log(`❌ ${dir}/${file} missing headings: ${missing.join(', ')}`);
      failures++;
    }

    const noWhoSkip = !/who\s+should\s+skip|skip\s+if/i.test(raw);
    const noTradeoff = !/what\s+doesn'?t|downsides?|trade-?off|caveat/i.test(raw);
    const noRec = !/best\s+for:|you'?ll\s+love\s+it\s+if|look\s+elsewhere\s+if/i.test(raw);

    if (noWhoSkip || noTradeoff || noRec) {
      console.log(`❌ ${dir}/${file} voice lint failed:${noWhoSkip ? ' who-should-skip' : ''}${noTradeoff ? ' tradeoff' : ''}${noRec ? ' recommendation' : ''}`);
      failures++;
    }

    for (const p of forbiddenPatterns) {
      if (p.test(raw)) {
        console.log(`❌ ${dir}/${file} contains banned AI phrase: ${p}`);
        failures++;
      }
    }

    if (!/\]\(\/boardgames\/(reviews|best|versus|how-to-play)\//i.test(raw)) {
      console.log(`⚠️ ${dir}/${file} has no internal boardgames links in Related Articles`);
    }
    if (!/amazon|zatu|wayland/i.test(raw)) {
      console.log(`⚠️ ${dir}/${file} has no retailer mentions in Where to Buy`);
    }
  }
}

if (failures > 0) {
  console.log(`\nPipeline check failed with ${failures} issue(s).`);
  process.exit(1);
}

console.log('\n✅ Boardgame pipeline check passed.');
