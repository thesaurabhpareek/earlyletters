#!/usr/bin/env node
/**
 * Repo lint (BRIEF CI-LINT). Boring on purpose: a handful of regex rules over tracked source files, no new dependency.
 * Report-only by default; a shrink-only baseline (docs/ops/lint-baseline.json) is the allowance per rule per file.
 *
 *   node scripts/lint/lint.mjs                      report, exit 0 (exit 2 if it could not run)
 *   node scripts/lint/lint.mjs --enforce            exit 1 if any count is above the baseline (new file or rule included)
 *   node scripts/lint/lint.mjs --write-baseline     write the baseline from the current tree (only ever lowers it in review)
 *   --baseline <path>                               read another baseline (the workflow passes the BASE branch copy)
 *
 * Output is rule names, paths and counts only. It never prints a matching line, so a secret or a person's words in
 * source cannot leak into a CI log. Comment-only lines are skipped.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const BASELINE_PATH = 'docs/ops/lint-baseline.json';
const CODE = /\.(?:ts|tsx|mjs|js)$/;
const SKIP = (p) => p.startsWith('scripts/lint/') || p.split('/').includes('__fixtures__') || p.split('/').includes('generated');
const APP = (p) => /^(?:apps\/mobile\/(?:src|app)|packages\/[^/]+\/src)\//.test(p) && !/\.(?:test|spec)\.[tj]sx?$/.test(p) && !p.split('/').includes('test');

/** Each rule: id, which paths it covers, the pattern. Each is tested on its own (lint.test.mjs). */
export const RULES = [
  { id: 'no-debugger', applies: () => true, re: /^\s*debugger\s*;?\s*$/ },
  { id: 'no-focused-test', applies: () => true, re: /\b(?:test|it|describe)\.only\s*\(/ },
  { id: 'no-ts-suppress', applies: () => true, re: /@ts-(?:ignore|nocheck)\b/ },
  { id: 'no-eval', applies: (p) => APP(p), re: /\beval\s*\(|\bnew Function\s*\(/ },
  { id: 'no-console-in-app', applies: (p) => APP(p), re: /\bconsole\.(?:log|debug|info|warn|error)\s*\(/ },
];

const isComment = (l) => /^\s*(?:\/\/|\/\*|\*)/.test(l) && !/^\s*\*\/?\s*debugger/.test(l);

/** Counts per rule per file for one file's text. Pure. */
export function lintText(path, text) {
  const out = {};
  const lines = text.split('\n');
  for (const r of RULES) {
    if (!r.applies(path)) continue;
    let n = 0;
    for (const l of lines) if (!isComment(l) && r.re.test(l)) n++;
    if (n) out[r.id] = n;
  }
  return out;
}

/** current: { path: { rule: n } }. baseline the same. Returns the rows above the baseline and the rows below it. */
export function compare(current, baseline) {
  const over = [], under = [];
  const paths = new Set([...Object.keys(current), ...Object.keys(baseline)]);
  for (const p of [...paths].sort()) {
    const rules = new Set([...Object.keys(current[p] || {}), ...Object.keys(baseline[p] || {})]);
    for (const rule of [...rules].sort()) {
      const now = current[p]?.[rule] || 0, was = baseline[p]?.[rule] || 0;
      if (now > was) over.push({ path: p, rule, now, was });
      else if (now < was) under.push({ path: p, rule, now, was });
    }
  }
  return { over, under };
}

export function scan(files, read) {
  const current = {};
  for (const p of files) {
    if (!CODE.test(p) || SKIP(p)) continue;
    const c = lintText(p, read(p));
    if (Object.keys(c).length) current[p] = c;
  }
  return current;
}

export function report({ over, under }, enforce) {
  const lines = [];
  for (const r of over) lines.push(`${enforce ? 'FAIL' : 'over'} ${r.rule} ${r.path} ${r.now} > baseline ${r.was}`);
  for (const r of under) lines.push(`shrunk ${r.rule} ${r.path} ${r.now} < baseline ${r.was} (lower the baseline in this PR)`);
  lines.push(`${over.length} over, ${under.length} shrunk`);
  return lines;
}

export function main(argv, io = {}) {
  const log = io.log || console.log;
  const tracked = io.files || (() => execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8', maxBuffer: 64e6 }).split('\0').filter(Boolean));
  const read = io.read || ((p) => { try { return readFileSync(p, 'utf8'); } catch { return ''; } });
  const bi = argv.indexOf('--baseline');
  const basePath = bi >= 0 ? argv[bi + 1] : BASELINE_PATH;
  try {
    const current = scan(tracked(), read);
    if (argv.includes('--write-baseline')) {
      writeFileSync(io.out || BASELINE_PATH, JSON.stringify(current, null, 2) + '\n');
      log(`wrote ${Object.keys(current).length} files`);
      return 0;
    }
    let baseline = {};
    try { baseline = JSON.parse((io.readBaseline || ((p) => readFileSync(p, 'utf8')))(basePath)); }
    catch { log(`no baseline at ${basePath}: every finding counts as new`); }
    const enforce = argv.includes('--enforce');
    const res = compare(current, baseline);
    for (const l of report(res, enforce)) log(l);
    return enforce && res.over.length ? 1 : 0;
  } catch (e) {
    log(`could not run: ${e.message}`);
    return 2;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) process.exit(main(process.argv.slice(2)));
