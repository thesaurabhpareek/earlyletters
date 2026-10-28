#!/usr/bin/env node
// Skip-count guard (retro package R2-08, IMP-54). Warn only by default.
//
// Why: PR #34's API drift test used `describe.skipIf(...)` and skipped all
// 157 drift checks while a migration was pending. The suite still exited 0,
// so CI stayed green with nothing checked. This script reads the summary that
// a test runner prints and warns when a suite skipped too much or ran nothing.
//
// What it reads (from a file argument, or stdin when no file is given):
//   - node:test spec reporter summary lines: "<info sign> tests 3", "<info sign> pass 1",
//     "<info sign> skipped 1", "<info sign> todo 1" (the info sign is U+2139).
//   - node:test TAP reporter summary lines: "# tests 3", "# pass 1", ...
//   - vitest summary line: "Tests  1 passed | 2 skipped | 1 todo (4)".
// Several summaries in one input (for example the whole `npm test` log, one
// summary per workspace) are checked one by one. The nearest preceding npm
// header line ("> @scribe/core@0.1.0 test") names each suite in the report.
// ANSI colour codes are stripped first.
//
// What it warns about, per suite:
//   - skipped plus todo tests above a share of the suite's total (default 0.2,
//     change with --threshold <0..1>);
//   - zero executed tests (pass plus fail is 0). Neither runner prints an
//     assertion count, so "zero executed tests" is the closest check this
//     script can make for "zero assertions";
//   - no recognisable summary in the whole input (the log may be truncated or
//     the runner may not have started).
//
// Exit codes: 0 by default, even with warnings. With --strict, 1 when there
// is any warning. 2 for a usage error or an unreadable file.
//
// Usage:
//   npm test 2>&1 | node scripts/qa/skip-guard.mjs
//   node scripts/qa/skip-guard.mjs test.log --threshold 0.1
//   node --test --test-reporter=tap some.test.mjs | node scripts/qa/skip-guard.mjs --strict
//
// How CI could call it later (not wired in by this change): in a workflow
// step, keep the test's own exit code and pipe a copy of its log through the
// guard, for example
//   set -o pipefail
//   npm test 2>&1 | tee test.log
//   node scripts/qa/skip-guard.mjs test.log            # warn only at first
//   node scripts/qa/skip-guard.mjs test.log --strict   # once the baseline is clean
// The same applies to `npm run test:db` once its runner prints a summary in a
// format listed above.
//
// Tests: node --test scripts/qa/skip-guard.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const DEFAULT_THRESHOLD = 0.2;

const ANSI = /\u001b\[[0-9;?]*[ -\/]*[@-~]/g;
const NODE_LINE = /^\s*(#|ℹ)\s+(tests|suites|pass|fail|cancelled|skipped|todo|duration_ms)\s+(\d+(?:\.\d+)?)\s*$/;
const VITEST_LINE = /^\s*Tests\s+(.+?)\s+\((\d+)\)\s*$/;
const VITEST_PART = /^(\d+)\s+(passed|failed|skipped|todo)$/;
const NPM_HEADER = /^> (\S*@\S*)\s+\S+\s*$/; // "> @scribe/core@0.1.0 test", not "> vitest run"

function emptyCounts() {
  return { tests: 0, pass: 0, fail: 0, cancelled: 0, skipped: 0, todo: 0 };
}

// Turn runner output into a list of suite summaries.
export function parseSummaries(text) {
  const summaries = [];
  let label = null;
  let node = null; // node:test block being collected

  const flushNode = () => {
    if (node) summaries.push(node);
    node = null;
  };

  for (const rawLine of String(text).split(/\r?\n/)) {
    const line = rawLine.replace(ANSI, '');

    const header = NPM_HEADER.exec(line);
    if (header) {
      flushNode();
      label = header[1];
      continue;
    }

    const n = NODE_LINE.exec(line);
    if (n) {
      const [, sign, key, value] = n;
      if (key === 'tests') {
        flushNode();
        node = {
          format: sign === '#' ? 'node-tap' : 'node-spec',
          label,
          ...emptyCounts(),
        };
      }
      if (!node) continue; // a stray count line without "tests" first
      if (key === 'duration_ms') {
        flushNode();
      } else if (key !== 'suites') {
        node[key] = Number(value);
      }
      continue;
    }

    const v = VITEST_LINE.exec(line);
    if (v) {
      const parts = v[1].split('|').map((p) => p.trim());
      const counts = emptyCounts();
      let ok = true;
      for (const part of parts) {
        const m = VITEST_PART.exec(part);
        if (!m) {
          ok = false;
          break;
        }
        const key = { passed: 'pass', failed: 'fail', skipped: 'skipped', todo: 'todo' }[m[2]];
        counts[key] += Number(m[1]);
      }
      if (!ok) continue;
      counts.tests = Number(v[2]);
      flushNode();
      summaries.push({ format: 'vitest', label, ...counts });
    }
  }
  flushNode();
  return summaries;
}

// Return warnings (strings) for a list of summaries.
export function evaluate(summaries, { threshold = DEFAULT_THRESHOLD } = {}) {
  const warnings = [];
  if (summaries.length === 0) {
    warnings.push('no test summary found in the input; nothing was checked');
    return warnings;
  }
  summaries.forEach((s, i) => {
    const name = `${s.label ?? `suite ${i + 1}`} (${s.format})`;
    const executed = s.pass + s.fail;
    const notRun = s.skipped + s.todo;
    const counts = `${s.tests} tests: ${s.pass} passed, ${s.fail} failed, ${s.skipped} skipped, ${s.todo} todo`;
    if (executed === 0) {
      warnings.push(`${name}: zero executed tests (${counts})`);
    }
    if (s.tests > 0 && notRun / s.tests > threshold) {
      const share = Math.round((notRun / s.tests) * 100);
      warnings.push(
        `${name}: ${share}% of tests skipped or todo, above the ${Math.round(threshold * 100)}% threshold (${counts})`,
      );
    }
  });
  return warnings;
}

export function parseArgs(argv) {
  const opts = { strict: false, threshold: DEFAULT_THRESHOLD, file: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--strict') opts.strict = true;
    else if (a === '--threshold') {
      const t = Number(argv[++i]);
      if (!Number.isFinite(t) || t < 0 || t > 1) throw new Error('--threshold needs a number from 0 to 1');
      opts.threshold = t;
    } else if (a === '-h' || a === '--help') opts.help = true;
    else if (a.startsWith('-') && a !== '-') throw new Error(`unknown option ${a}`);
    else if (opts.file === null) opts.file = a;
    else throw new Error('only one input file is allowed');
  }
  return opts;
}

// Run the guard on text. Returns { code, out } so tests need no process.
export function run(text, opts) {
  const summaries = parseSummaries(text);
  const warnings = evaluate(summaries, opts);
  const lines = [`skip-guard: checked ${summaries.length} suite summary(ies)`];
  for (const w of warnings) lines.push(`skip-guard: WARNING ${w}`);
  if (warnings.length === 0) lines.push('skip-guard: ok');
  const code = warnings.length > 0 && opts.strict ? 1 : 0;
  return { code, out: lines.join('\n') + '\n' };
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    process.stderr.write(`skip-guard: ${err.message}\n`);
    process.exit(2);
  }
  if (opts.help) {
    process.stdout.write('usage: node scripts/qa/skip-guard.mjs [file|-] [--threshold 0..1] [--strict]\n');
    return;
  }
  let text;
  try {
    text = readFileSync(opts.file && opts.file !== '-' ? opts.file : 0, 'utf8');
  } catch (err) {
    process.stderr.write(`skip-guard: cannot read input: ${err.message}\n`);
    process.exit(2);
  }
  const { code, out } = run(text, opts);
  process.stdout.write(out);
  process.exitCode = code;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
