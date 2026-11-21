#!/usr/bin/env node
// PR size reporter, warn only (retro package R2-06, IMP-82). It reports; it never fails a build.
//
// Why: CODE-R02 (docs/engineering/01-code-and-change.md:31) caps a PR at 400 changed lines and 20 files,
// not counting "the lockfile, generated files and test data files". It has no check (gap CODE-G1), and
// the retro found 72 of 141 merged PRs over it. This script measures merged PRs so the founder can set
// a threshold from data. It is not wired into CI or package.json on purpose.
//
// Usage (repo root):
//   node scripts/qa/pr-size.mjs --since 2026-10-16 --until 2026-10-28T03:56:00Z
//   node scripts/qa/pr-size.mjs --since 2026-10-16 --save /tmp/prs.json   (also writes the fetched data)
//   node scripts/qa/pr-size.mjs --fixture /tmp/prs.json --lines 800 --files 30
// Options: --repo owner/name (default thesaurabhpareek/earlyletters), --base develop|main (default: all),
//   --lines N (default 400), --files N (default 20), --json (machine-readable output).
// Live mode calls `gh api` (read only): one list call per 100 closed PRs, then two calls per merged PR.
//
// Measures. "Raw" is GitHub's own count for the PR: additions plus deletions and changed_files. "Product
// only" is the same count over files classified as product code. A PR breaches a measure when its lines
// exceed --lines OR its files exceed --files (the shape of CODE-R02).
//
// Classification, by path, first match wins. Each rule cites what it is based on in this repo.
//  1. lockfile: a file whose name is a package manager lockfile (package-lock.json at the root is the
//     only one tracked today; the others are listed so a new one is not counted as product code).
//  2. generated: files a script writes, plus built and binary assets that nobody reviews line by line.
//     - paths marked "GENERATED" or "do not edit" in their own header: apps/mobile/src/generated/**
//       (licences.json), packages/design-tokens/dist/** (tokens.*.css), packages/brand/registry.json,
//       apps/mobile/src/uniwind-types.d.ts, docs/TRACE.md (scripts/trace.mjs), docs/store/app-store.md
//       (scripts/brand/store-listing.ts);
//     - packages/brand/assets/** outside a source/ folder: rendered by the build.mjs scripts in each
//       source/ folder (for example packages/brand/assets/logo/primary/source/build.mjs, line 1);
//     - binary and media files anywhere (images, fonts, audio, video, pdf): GitHub reports 0 lines.
//  3. tests: test code and test data, which CODE-R02 excludes as "golden corpora, fixtures".
//     A path segment test, tests, __tests__, __golden__, __snapshots__, __fixtures__, fixtures, golden
//     e2e or e2e-web (apps/mobile/test, supabase/tests, packages/core/test/golden, apps/mobile/e2e,
//     packages/emails/test/fixtures, apps/mobile/test/__golden__, apps/mobile/e2e-web journey flows),
//     or a file named *.test.*, *.spec.* or *.snap (scripts/agents/*.test.mjs, packs/__tests__).
//  4. docs: anything under docs/, and any .md, .mdx or .txt file elsewhere (README.md, CLAUDE.md,
//     .claude/agents/*.md, agents/*/*.md, packages/content/VOICE.md).
//  5. product: everything else. That includes apps/, packages/*/src, supabase/migrations and functions,
//     scripts/, .github/ workflows, agents/roster.json and config files: code a reviewer must read.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';

export const CATEGORIES = ['product', 'tests', 'docs', 'generated', 'lockfile'];

const LOCKFILES = new Set(['package-lock.json', 'npm-shrinkwrap.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb', 'bun.lock', 'deno.lock', 'Podfile.lock', 'Gemfile.lock']);
const GENERATED_FILES = new Set(['packages/brand/registry.json', 'apps/mobile/src/uniwind-types.d.ts', 'docs/TRACE.md', 'docs/store/app-store.md']);
const GENERATED_DIRS = ['apps/mobile/src/generated/', 'packages/design-tokens/dist/'];
const BINARY = /\.(png|jpe?g|gif|webp|heic|ico|icns|ttf|otf|woff2?|wav|m4a|mp3|mp4|mov|caf|pdf|zip|bin|onnx|gguf)$/i;
const TEST_SEGMENTS = new Set(['test', 'tests', '__tests__', '__golden__', '__snapshots__', '__fixtures__', 'fixtures', 'golden', 'e2e', 'e2e-web']);
const TEST_NAME = /\.(test|spec)\.[a-z]+$|\.snap$/i;
const DOC_EXT = /\.(md|mdx|txt)$/i;

/** Category of one changed file path (repo-relative, forward slashes). */
export function classify(path) {
  const segs = path.split('/');
  const name = basename(path);
  if (LOCKFILES.has(name)) return 'lockfile';
  if (GENERATED_FILES.has(path) || GENERATED_DIRS.some((d) => path.startsWith(d))) return 'generated';
  if (path.startsWith('packages/brand/assets/') && !segs.includes('source')) return 'generated';
  if (BINARY.test(name)) return 'generated';
  if (TEST_NAME.test(name) || segs.slice(0, -1).some((s) => TEST_SEGMENTS.has(s))) return 'tests';
  if (segs[0] === 'docs' || DOC_EXT.test(name)) return 'docs';
  return 'product';
}

/**
 * One PR, as fetched: { number, base, merged_at, additions, deletions, changed_files, files: [{ filename, additions, deletions }] }.
 * Returns { number, base, merged_at, lines, files, split: { <category>: { lines, files } } }.
 */
export function summarize(pr) {
  const split = Object.fromEntries(CATEGORIES.map((c) => [c, { lines: 0, files: 0 }]));
  for (const f of pr.files ?? []) {
    const s = split[classify(f.filename)];
    s.lines += (f.additions ?? 0) + (f.deletions ?? 0);
    s.files += 1;
  }
  const listed = (pr.files ?? []).length;
  return {
    number: pr.number,
    base: pr.base,
    merged_at: pr.merged_at,
    lines: pr.additions + pr.deletions,
    files: pr.changed_files,
    split,
    incomplete: listed !== pr.changed_files,
  };
}

/** Nearest-rank percentile (p in 0..100) of a list of numbers. */
export function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.max(1, Math.ceil((p / 100) * sorted.length));
  return sorted[rank - 1];
}

/** Lines and files for a summary on one measure: 'raw' or 'product'. */
export function measure(s, which) {
  return which === 'raw' ? { lines: s.lines, files: s.files } : s.split.product;
}

/** How many summaries break a threshold on a measure. */
export function breaches(summaries, which, maxLines, maxFiles) {
  let lines = 0, files = 0, either = 0;
  for (const s of summaries) {
    const m = measure(s, which);
    const l = m.lines > maxLines, f = m.files > maxFiles;
    if (l) lines++;
    if (f) files++;
    if (l || f) either++;
  }
  return { total: summaries.length, lines, files, either };
}

export function inRange(pr, since, until, base) {
  if (!pr.merged_at) return false;
  const t = Date.parse(pr.merged_at);
  if (since && t < Date.parse(since)) return false;
  if (until && t > Date.parse(until)) return false;
  return !base || pr.base === base;
}

function stats(values) {
  return { median: percentile(values, 50), p75: percentile(values, 75), p90: percentile(values, 90), max: values.length ? Math.max(...values) : 0 };
}

/** Plain-text report. */
export function report(summaries, { maxLines, maxFiles, since, until, base }) {
  const pct = (n) => (summaries.length ? `${Math.round((100 * n) / summaries.length)}%` : 'n/a');
  const out = [];
  out.push(`Merged PRs: ${summaries.length} (merged ${since ?? 'any'} to ${until ?? 'now'}, base ${base ?? 'any'})`);
  out.push(`Threshold: more than ${maxLines} lines or more than ${maxFiles} files`);
  out.push('');
  out.push('Distribution (changed lines = additions + deletions; nearest-rank percentiles)');
  out.push('measure     median    p75    p90    max | files median  p90  max');
  for (const [label, get] of [['raw', (s) => measure(s, 'raw')], ...CATEGORIES.map((c) => [c, (s) => s.split[c]])]) {
    const l = stats(summaries.map((s) => get(s).lines));
    const f = stats(summaries.map((s) => get(s).files));
    out.push(`${label.padEnd(10)} ${[l.median, l.p75, l.p90, l.max].map((v) => String(v).padStart(6)).join(' ')} | ${[f.median, f.p90, f.max].map((v) => String(v).padStart(6)).join(' ')}`);
  }
  const totals = Object.fromEntries(CATEGORIES.map((c) => [c, summaries.reduce((a, s) => a + s.split[c].lines, 0)]));
  const all = Object.values(totals).reduce((a, b) => a + b, 0);
  out.push(`Share of all changed lines: ${CATEGORIES.map((c) => `${c} ${all ? Math.round((100 * totals[c]) / all) : 0}%`).join(', ')}`);
  out.push('');
  for (const which of ['raw', 'product']) {
    const b = breaches(summaries, which, maxLines, maxFiles);
    out.push(`Breach (${which === 'raw' ? 'raw' : 'product code only'}): ${b.either} of ${b.total} (${pct(b.either)}); over lines ${b.lines}, over files ${b.files}`);
  }
  out.push('');
  out.push('Product-only breach rate at other thresholds (lines or files):');
  for (const [l, f] of [[400, 20], [600, 25], [800, 30], [1200, 40], [2000, 60]]) {
    const b = breaches(summaries, 'product', l, f);
    out.push(`  ${String(l).padStart(5)} / ${String(f).padStart(2)}: ${b.either} of ${b.total} (${pct(b.either)})`);
  }
  const incomplete = summaries.filter((s) => s.incomplete).map((s) => `#${s.number}`);
  if (incomplete.length) out.push(`\nFile list shorter than changed_files (split undercounts): ${incomplete.join(', ')}`);
  return out.join('\n');
}

// Pages by number: `gh api --paginate` follows Link headers, which name repositories/<id> paths that some
// proxies refuse. Stops at the first page with fewer than 100 items.
function ghPages(path) {
  const all = [];
  for (let page = 1; ; page++) {
    const items = JSON.parse(execFileSync('gh', ['api', `${path}&page=${page}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
    all.push(...items);
    if (items.length < 100) return all;
  }
}

/** Fetches merged PRs in range from GitHub REST, with their file lists. Read only. */
export function fetchLive(repo, since, until, base) {
  const list = ghPages(`repos/${repo}/pulls?state=closed&per_page=100`)
    .map((p) => ({ number: p.number, merged_at: p.merged_at, base: p.base.ref }))
    .filter((p) => inRange(p, since, until, base));
  return list.map((p) => {
    const full = JSON.parse(execFileSync('gh', ['api', `repos/${repo}/pulls/${p.number}`], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }));
    const files = ghPages(`repos/${repo}/pulls/${p.number}/files?per_page=100`)
      .map((f) => ({ filename: f.filename, additions: f.additions, deletions: f.deletions }));
    return { number: p.number, base: p.base, merged_at: p.merged_at, additions: full.additions, deletions: full.deletions, changed_files: full.changed_files, files };
  }).sort((a, b) => a.number - b.number);
}

function main(argv) {
  const opt = (n, d = null) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
  const repo = opt('repo', 'thesaurabhpareek/earlyletters');
  const since = opt('since'), until = opt('until'), base = opt('base');
  const maxLines = Number(opt('lines', 400)), maxFiles = Number(opt('files', 20));
  const fixture = opt('fixture');
  const prs = (fixture ? JSON.parse(readFileSync(fixture, 'utf8')) : fetchLive(repo, since, until, base))
    .filter((p) => inRange(p, since, until, base));
  if (opt('save')) writeFileSync(opt('save'), JSON.stringify(prs, null, 1));
  const summaries = prs.map(summarize);
  if (argv.includes('--json')) {
    console.log(JSON.stringify({ summaries, raw: breaches(summaries, 'raw', maxLines, maxFiles), product: breaches(summaries, 'product', maxLines, maxFiles) }, null, 1));
  } else {
    console.log(report(summaries, { maxLines, maxFiles, since, until, base }));
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main(process.argv.slice(2));
