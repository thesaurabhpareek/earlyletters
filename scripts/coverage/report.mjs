#!/usr/bin/env node
/**
 * Merges every workspace's `coverage/coverage-summary.json` (vitest
 * `json-summary` reporter) into one Markdown table, plus the least covered
 * files across the repo. Reads files only; run `npm run test:coverage` first.
 *
 *   node scripts/coverage/report.mjs              the per-workspace table
 *   node scripts/coverage/report.mjs --files 25   plus the 25 least covered files
 *   node scripts/coverage/report.mjs --json       the merged numbers as JSON
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Workspaces with a coverage config, in the order they are run and listed. */
export const WORKSPACES = [
  { short: 'core', name: '@scribe/core', dir: 'packages/core' },
  { short: 'mobile', name: '@scribe/mobile', dir: 'apps/mobile' },
  { short: 'content', name: '@scribe/content', dir: 'packages/content' },
  { short: 'api', name: '@scribe/api', dir: 'packages/api' },
  { short: 'analytics', name: '@scribe/analytics', dir: 'packages/analytics' },
  { short: 'design-tokens', name: '@scribe/design-tokens', dir: 'packages/design-tokens' },
  { short: 'emails', name: '@scribe/emails', dir: 'packages/emails' },
  { short: 'brand', name: '@scribe/brand', dir: 'packages/brand' },
  { short: 'experiments', name: '@scribe/experiments', dir: 'experiments' },
];

const METRICS = ['statements', 'branches', 'functions', 'lines'];

function readSummary(ws) {
  const file = join(ROOT, ws.dir, 'coverage', 'coverage-summary.json');
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, 'utf8'));
}

const pct = (m) => (m.total === 0 ? 100 : (m.covered / m.total) * 100);
const fmt = (n) => `${n.toFixed(2)}%`;

/** The merged numbers: per workspace totals and every file. */
export function collect() {
  const rows = [];
  const files = [];
  const all = Object.fromEntries(METRICS.map((m) => [m, { total: 0, covered: 0 }]));
  for (const ws of WORKSPACES) {
    const s = readSummary(ws);
    if (!s) {
      rows.push({ ...ws, missing: true });
      continue;
    }
    const totals = {};
    for (const m of METRICS) {
      totals[m] = { total: s.total[m].total, covered: s.total[m].covered, pct: pct(s.total[m]) };
      all[m].total += s.total[m].total;
      all[m].covered += s.total[m].covered;
    }
    rows.push({ ...ws, totals });
    for (const [path, f] of Object.entries(s)) {
      if (path === 'total') continue;
      const rel = relative(ROOT, path).split('\\').join('/');
      files.push({
        workspace: ws.short,
        path: rel,
        ...Object.fromEntries(METRICS.map((m) => [m, { total: f[m].total, covered: f[m].covered, pct: pct(f[m]) }])),
      });
    }
  }
  const merged = Object.fromEntries(METRICS.map((m) => [m, { ...all[m], pct: pct(all[m]) }]));
  return { rows, files, merged };
}

/** Least covered files first: by line coverage, then statements, then more lines uncovered first. */
export function leastCovered(files, n) {
  return [...files]
    .filter((f) => f.lines.total > 0)
    .sort(
      (a, b) =>
        a.lines.pct - b.lines.pct ||
        a.statements.pct - b.statements.pct ||
        b.lines.total - b.lines.covered - (a.lines.total - a.lines.covered) ||
        a.path.localeCompare(b.path),
    )
    .slice(0, n);
}

export function report({ files = 0 } = {}) {
  const { rows, files: every, merged } = collect();
  const lines = ['| Workspace | Statements | Branches | Functions | Lines |', '|---|---|---|---|---|'];
  for (const r of rows) {
    if (r.missing) {
      lines.push(`| ${r.name} | (not run) | | | |`);
      continue;
    }
    lines.push(`| ${r.name} | ${fmt(r.totals.statements.pct)} | ${fmt(r.totals.branches.pct)} | ${fmt(r.totals.functions.pct)} | ${fmt(r.totals.lines.pct)} |`);
  }
  if (rows.some((r) => !r.missing)) {
    lines.push(`| **All (merged)** | ${fmt(merged.statements.pct)} | ${fmt(merged.branches.pct)} | ${fmt(merged.functions.pct)} | ${fmt(merged.lines.pct)} |`);
  }
  if (files > 0) {
    lines.push('', `Least covered files (${files}):`, '', '| File | Lines | Branches | Functions | Uncovered lines |', '|---|---|---|---|---|');
    for (const f of leastCovered(every, files)) {
      lines.push(`| ${f.path} | ${fmt(f.lines.pct)} | ${fmt(f.branches.pct)} | ${fmt(f.functions.pct)} | ${f.lines.total - f.lines.covered} of ${f.lines.total} |`);
    }
  }
  return lines.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args.includes('--json')) {
    console.log(JSON.stringify(collect(), null, 2));
  } else {
    const i = args.indexOf('--files');
    console.log(report({ files: i >= 0 ? Number(args[i + 1] ?? '25') || 25 : 0 }));
  }
}
