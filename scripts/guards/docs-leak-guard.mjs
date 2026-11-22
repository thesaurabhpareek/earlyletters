#!/usr/bin/env node
// Docs-leak guard. Fails when an exported app bundle or web build carries planning docs (docs/**, any .md, or prose lines from them).
// Not wired into CI yet: .github is a founder-only path (D-121 to D-123 follow-ups name the one-line wiring into the seam-guard job).
//   node scripts/guards/docs-leak-guard.mjs --repo <root> [--ios <expo export dir>] [--web <apps/web/.next>] [--min-sentinels <n>]
// iOS export must be: expo export --platform ios --no-bytecode --dump-sourcemap --output-dir <dir>
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const repo = path.resolve(opt('--repo') ?? '.');
const targets = [['ios', opt('--ios')], ['web', opt('--web')]].filter(([, d]) => d);
// Shared copy that is meant to ship (store text, policy text the app shows). Everything else under docs/ must not.
const SHIPS_BY_DESIGN = ['docs/store/', 'docs/legal/privacy-policy.md', 'docs/legal/data-policy.md', 'docs/legal/in-app-disclosures.md', 'docs/emails/'];
const MIN = 60, MAX = 200, MIN_SENTINELS = Number(opt('--min-sentinels') ?? 1000);
const fail = []; const note = (m) => console.log(m);

const walk = (d, o = []) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === 'cache' || e.name === 'node_modules' || e.name === '.git') continue;
    const p = path.join(d, e.name);
    e.isDirectory() ? walk(p, o) : o.push(p);
  }
  return o;
};
const rel = (p) => path.relative(repo, p).split(path.sep).join('/');

// 1. Sentinels: distinctive lines of every planning doc.
const docs = walk(path.join(repo, 'docs')).filter((f) => f.endsWith('.md')).map(rel)
  .filter((f) => !SHIPS_BY_DESIGN.some((a) => f.startsWith(a)));
const sentinels = new Map();
for (const f of docs) { let fence = false; for (const line of fs.readFileSync(path.join(repo, f), 'utf8').split('\n')) {
  if (/^\s*```/.test(line)) { fence = !fence; continue; }
  if (fence) continue; // quoted code is not prose, and shipped code legitimately matches it
  const s = line.replace(/^#+\s*/, '').replace(/^[-*]\s*/, '').trim();
  if (s.length >= MIN && s.length <= MAX && !s.includes('|') && !sentinels.has(s)) sentinels.set(s, f);
} }
note(`docs md files ${docs.length}, sentinels ${sentinels.size}`);
if (sentinels.size < MIN_SENTINELS) fail.push(`only ${sentinels.size} sentinels (< ${MIN_SENTINELS}): the scan would prove little`);

const brand = fs.readFileSync(path.join(repo, 'packages/brand/index.ts'), 'utf8').match(/name:\s*['"]([^'"]+)['"]/)?.[1] ?? 'Early Letters';
const scanText = (text) => { const h = []; for (const [s, f] of sentinels) if (text.includes(s)) h.push([f, s.slice(0, 70)]); return h; };
// Self-test: the scanner must catch a planted sentinel.
if (scanText(`xx ${[...sentinels.keys()][0]} yy`).length !== 1) fail.push('self-test: planted sentinel not found');

for (const [kind, dir] of targets) {
  const files = walk(path.resolve(dir));
  const text = files.filter((f) => /\.(js|hbc|json|html|txt|rsc|css)$/.test(f) && !/\.(nft\.json|map)$/.test(f));
  const blob = text.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  note(`${kind}: ${files.length} files, ${blob.length} chars`);
  // A. File assertions.
  for (const f of files) if (/\.(md|mdx|markdown)$/i.test(f)) fail.push(`${kind}: markdown file in output: ${f}`);
  // B. Positive control: the search can see the bundle.
  if (!blob.includes(brand)) fail.push(`${kind}: control failed, product name "${brand}" not found`);
  // C. Sentinel assertion.
  for (const [f, s] of scanText(blob)) fail.push(`${kind}: text from ${f}: "${s}"`);
  // D. Source paths (iOS source map, web trace files).
  const refs = [];
  for (const f of files.filter((x) => x.endsWith('.map'))) refs.push(...(JSON.parse(fs.readFileSync(f, 'utf8')).sources ?? []));
  for (const f of files.filter((x) => x.endsWith('.nft.json'))) refs.push(...(JSON.parse(fs.readFileSync(f, 'utf8')).files ?? []));
  const bad = refs.filter((s) => !s.includes('node_modules') && (/(^|\/)docs\//.test(s) || /\.(md|mdx)$/i.test(s)));
  for (const s of bad) fail.push(`${kind}: source path ${s}`);
  note(`${kind}: ${refs.length} source paths checked`);
  if (kind === 'ios' && !refs.length) fail.push('ios: no source map, run expo export with --dump-sourcemap');
}
if (fail.length) { for (const m of fail) console.error('::error::docs-leak ' + m); process.exit(1); }
note('docs-leak guard: clean');
