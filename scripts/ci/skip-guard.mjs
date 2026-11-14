#!/usr/bin/env node
// Skip-count guard with an expiring allowlist (HV2-B09, HV2-010, EG-1 to EG-3).
//
// Why: a suite once skipped all 157 drift checks and CI stayed green (retro RC6, R2-08). The
// older warn-only script scripts/qa/skip-guard.mjs reads a share of skipped tests. This one
// fails the build: a suite may skip only what docs/qa/skip-allowlist.json names, exactly, until
// the entry expires.
//
// It reads captured log text, so no suite changes how it runs. Three summary formats:
//   - vitest:    "Tests  A failed | B passed | C skipped (N)", one or more per workspace
//   - node:test: "# skipped N" / "# todo N" (TAP) or the spec reporter's "<info sign> skipped N"
//   - db runner: supabase/tests/run.mjs prints "=== file.test.mjs (N migrations) ===" and the
//     file ends with "ALL PASSED (N checks)" or "F FAILED (P passed)". The db harness has no skip
//     feature, so a db file's skipped count is the number of lines that start with "SKIP"; a db
//     file with no summary line (crashed or cut off) fails. auth_config.test.mjs has its own
//     harness: its "ok   <name>" lines are counted and "All auth config checks passed." is its summary.
// The vitest and node:test parsing is shared with scripts/qa/skip-guard.mjs. A workspace is named
// by the "> @scope/name@version script" header npm prints before its run, mapped to its path
// ("apps/mobile") through the workspace package.json files. A node:test summary printed after the
// last workspace (the root scripts in `npm test`) is counted under that last workspace.
//
// It FAILS (exit 1) when, for any suite:
//   1. skipped (skipped plus todo) is above the allowlist count, unlisted meaning 0 (EG-1);
//   2. no summary is found for an expected suite, or no summary at all (EG-2). Expected suites:
//      every workspace with a test script when the input has any workspace header (except scripts
//      with --passWithNoTests), and every supabase/tests/*.test.mjs when it has any db header;
//   3. an allowlist entry lacks suite, count, reason, owner or expires, is past its expiry, or
//      its count differs from the real skipped count (EG-3);
//   4. zero tests passed.
// Exit 2 is a usage or unreadable-input error. Failed tests are the runner's own exit code to
// report; use `set -o pipefail` when piping through tee.
//
// Usage (see docs/qa/skip-allowlist.json for the entry shape):
//   npm test 2>&1 | tee test.log
//   npm run test:db 2>&1 | tee db.log
//   node scripts/ci/skip-guard.mjs --allow docs/qa/skip-allowlist.json test.log db.log
// Pass every log of one run in a single call: an entry whose suite is in no log is stale and fails.
// Options: --allow <file> (default docs/qa/skip-allowlist.json), --root <dir> (default the repo
// root, where workspaces and supabase/tests are read), --today YYYY-MM-DD (tests only: refused
// unless SKIP_GUARD_TEST_TODAY=1, because any other date turns expiry off; CI must not set either).
// An entry's expires must be a real date no more than 60 days after today.
// Not wired into package.json or any workflow; the CI patch is a founder-applied proposal (B20).
//
// Tests: node --test scripts/ci/skip-guard.test.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSummaries } from '../qa/skip-guard.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..');
const ANSI = /\u001b\[[0-9;?]*[ -\/]*[@-~]/g;
const DB_HEADER = /^=== (\S+\.test\.mjs) \(\d+ migrations\) ===\s*$/;
const DB_OK = /^ALL PASSED \((\d+) checks\)\s*$/;
// auth_config.test.mjs has its own harness: "ok   <name>" lines and "All auth config checks passed."
const DB_OK_WORDS = /^All .+ checks passed\.\s*$/;
const DB_BAD = /^(\d+) FAILED \((\d+) passed\)\s*$/;
const FIELDS = ['suite', 'count', 'reason', 'owner', 'expires'];
// An entry may not run longer than this from today, so a renewal needs a fresh review (EG-3).
export const MAX_EXPIRY_DAYS = 60;

/** Parse YYYY-MM-DD as a real calendar date (UTC). Returns epoch ms, or null when invalid. */
export function parseDay(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(typeof s === 'string' ? s : '');
  if (!m) return null;
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(t);
  const back = `${String(d.getUTCFullYear()).padStart(4, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  return back === s ? t : null;
}

/** Workspace package name to path, and which workspaces are expected to print a summary. */
export function readWorkspaces(root) {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const dirs = [];
  for (const g of pkg.workspaces || []) {
    if (g.endsWith('/*')) {
      const base = path.join(root, g.slice(0, -2));
      if (fs.existsSync(base)) for (const d of fs.readdirSync(base).sort()) dirs.push(`${g.slice(0, -2)}/${d}`);
    } else dirs.push(g);
  }
  const out = [];
  for (const rel of dirs) {
    const f = path.join(root, rel, 'package.json');
    if (!fs.existsSync(f)) continue;
    const p = JSON.parse(fs.readFileSync(f, 'utf8'));
    const test = p.scripts && p.scripts.test;
    out.push({ name: p.name, path: rel, hasTest: !!test, mayBeEmpty: !!test && /--passWithNoTests/.test(test) });
  }
  return out;
}

/** Db test files that supabase/tests/run.mjs would run. */
export function readDbFiles(root) {
  const dir = path.join(root, 'supabase', 'tests');
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.test.mjs')).sort() : [];
}

/** Db runner log to one summary per file: { suite: 'db:<file>', pass, fail, skipped, found }. */
export function parseDb(text) {
  const out = [];
  let cur = null;
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.replace(ANSI, '');
    const h = DB_HEADER.exec(line);
    if (h) { cur = { suite: `db:${h[1]}`, pass: 0, fail: 0, skipped: 0, found: false, okLines: 0 }; out.push(cur); continue; }
    if (!cur) continue;
    const ok = DB_OK.exec(line);
    const bad = DB_BAD.exec(line);
    if (ok) { cur.pass = Number(ok[1]); cur.found = true; }
    else if (bad) { cur.fail = Number(bad[1]); cur.pass = Number(bad[2]); cur.found = true; }
    else if (DB_OK_WORDS.test(line)) { cur.pass = cur.okLines; cur.found = true; }
    else if (/^ok\s/.test(line)) cur.okLines++;
    else if (/^SKIP\b/.test(line)) cur.skipped++;
  }
  return out;
}

/** Sum workspace summaries by suite path. Unlabelled summaries get the label `?`. */
export function collectSuites(text, workspaces) {
  const byName = new Map(workspaces.map((w) => [w.name, w.path]));
  const suites = new Map();
  const add = (suite, s) => {
    const c = suites.get(suite) || { suite, pass: 0, fail: 0, skipped: 0, found: true };
    c.pass += s.pass; c.fail += s.fail; c.skipped += (s.skipped || 0) + (s.todo || 0);
    suites.set(suite, c);
  };
  const sums = parseSummaries(text);
  // npm prints "> @scope/name@1.2.3 test"; the label keeps the version, the package name does not.
  const nameOf = (label) => label.replace(/@[^@/]*$/, '');
  for (const s of sums) add(s.label ? (byName.get(nameOf(s.label)) || nameOf(s.label)) : '?', s);
  const sawWorkspace = sums.some((s) => s.label && byName.has(nameOf(s.label)));
  const db = parseDb(text);
  for (const d of db) suites.set(d.suite, d);
  return { suites, sawWorkspace, sawDb: db.length > 0 };
}

/** Allowlist problems: shape and expiry. `today` is YYYY-MM-DD. */
export function checkAllowlist(list, today) {
  const problems = [];
  if (!Array.isArray(list)) return ['allowlist must be a JSON array'];
  const seen = new Set();
  list.forEach((e, i) => {
    const at = `allowlist entry ${i + 1}${e && e.suite ? ` (${e.suite})` : ''}`;
    if (!e || typeof e !== 'object') { problems.push(`${at}: not an object`); return; }
    for (const f of FIELDS) {
      const v = e[f];
      if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) problems.push(`${at}: missing ${f}`);
    }
    if (e.count !== undefined && !(Number.isInteger(e.count) && e.count >= 0)) problems.push(`${at}: count must be a whole number`);
    if (e.expires !== undefined && e.expires !== null && e.expires !== '' && typeof e.expires === 'string' && e.expires.trim() !== '') {
      const t = parseDay(e.expires);
      const now = parseDay(today);
      if (t === null) problems.push(`${at}: expires must be a real date in YYYY-MM-DD form`);
      else if (now !== null && t < now) problems.push(`${at}: expired on ${e.expires}; fix the skip or renew with a new reason`);
      else if (now !== null && t > now + MAX_EXPIRY_DAYS * 86400000) problems.push(`${at}: expires ${e.expires} is more than ${MAX_EXPIRY_DAYS} days away; renew in shorter steps`);
    } else if (e.expires !== undefined && e.expires !== null && typeof e.expires !== 'string') problems.push(`${at}: expires must be a real date in YYYY-MM-DD form`);
    if (e.suite) { if (seen.has(e.suite)) problems.push(`${at}: listed twice`); seen.add(e.suite); }
  });
  return problems;
}

/**
 * Evaluate one run. `inputs` is an array of log texts. Returns { problems, suites }.
 */
export function evaluate(inputs, { allow = [], workspaces = [], dbFiles = [], today }) {
  const problems = [];
  const all = new Map();
  let sawWorkspace = false;
  let sawDb = false;
  for (const text of inputs) {
    const r = collectSuites(text, workspaces);
    sawWorkspace ||= r.sawWorkspace;
    sawDb ||= r.sawDb;
    for (const [k, v] of r.suites) {
      const c = all.get(k);
      if (c) { c.pass += v.pass; c.fail += v.fail; c.skipped += v.skipped; c.found ||= v.found; } else all.set(k, { ...v });
    }
  }
  if (all.size === 0) problems.push('no test summary found in the input; nothing was checked');
  problems.push(...checkAllowlist(allow, today));

  const expected = [];
  if (sawWorkspace) for (const w of workspaces) if (w.hasTest && !w.mayBeEmpty) expected.push(w.path);
  if (sawDb) for (const f of dbFiles) expected.push(`db:${f}`);
  for (const e of expected) {
    const s = all.get(e);
    if (!s || !s.found) problems.push(`${e}: no summary found in the logs (suite did not run, or the log is cut off)`);
  }
  const allowBy = new Map((Array.isArray(allow) ? allow : []).filter((e) => e && e.suite).map((e) => [e.suite, e]));
  for (const s of all.values()) {
    if (!s.found) continue;
    const entry = allowBy.get(s.suite);
    const allowed = entry && Number.isInteger(entry.count) ? entry.count : 0;
    if (s.skipped > allowed) problems.push(`${s.suite}: ${s.skipped} skipped, ${allowed} allowed${entry ? '' : ' (not in the allowlist)'}`);
    if (s.pass === 0) problems.push(`${s.suite}: zero tests passed (${s.fail} failed, ${s.skipped} skipped)`);
  }
  for (const e of allowBy.values()) {
    const s = all.get(e.suite);
    if (Number.isInteger(e.count) && e.count > (s ? s.skipped : 0)) {
      problems.push(`${e.suite}: allowlist says ${e.count} skipped but the logs show ${s ? s.skipped : 0}; lower the count or remove the entry`);
    }
  }
  return { problems, suites: [...all.values()] };
}

export function parseArgs(argv, env = process.env) {
  const o = { allow: 'docs/qa/skip-allowlist.json', root: REPO, today: new Date().toISOString().slice(0, 10), files: [], help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--allow') o.allow = argv[++i];
    else if (a === '--root') o.root = path.resolve(argv[++i]);
    else if (a === '--today') { o.today = argv[++i]; o.todayGiven = true; }
    else if (a === '-h' || a === '--help') o.help = true;
    else if (a.startsWith('-') && a !== '-') throw new Error(`unknown option ${a}`);
    else o.files.push(a);
  }
  if (o.todayGiven && env.SKIP_GUARD_TEST_TODAY !== '1') throw new Error('--today is for tests only and would turn expiry off; set SKIP_GUARD_TEST_TODAY=1 to use it');
  if (parseDay(o.today) === null) throw new Error('--today needs a real date in YYYY-MM-DD form');
  if (!o.allow) throw new Error('--allow needs a file');
  return o;
}

export function main(argv = process.argv.slice(2), { stdin = () => fs.readFileSync(0, 'utf8'), env = process.env, out = (s) => process.stdout.write(s), err = (s) => process.stderr.write(s) } = {}) {
  let o;
  try { o = parseArgs(argv, env); } catch (e) { err(`skip-guard: ${e.message}\n`); return 2; }
  if (o.help) { out('usage: node scripts/ci/skip-guard.mjs [--allow file] [--root dir] [--today YYYY-MM-DD] <log>... (or stdin)\n'); return 0; }
  let inputs;
  let allow;
  try {
    inputs = o.files.length ? o.files.map((f) => (f === '-' ? stdin() : fs.readFileSync(f, 'utf8'))) : [stdin()];
    const af = path.resolve(o.root, o.allow);
    allow = fs.existsSync(af) ? JSON.parse(fs.readFileSync(af, 'utf8')) : [];
  } catch (e) { err(`skip-guard: cannot read input: ${e.message}\n`); return 2; }
  let workspaces;
  let dbFiles;
  try { workspaces = readWorkspaces(o.root); dbFiles = readDbFiles(o.root); } catch (e) { err(`skip-guard: cannot read workspaces: ${e.message}\n`); return 2; }
  const { problems, suites } = evaluate(inputs, { allow, workspaces, dbFiles, today: o.today });
  const skipped = suites.reduce((n, s) => n + s.skipped, 0);
  out(`skip-guard: ${suites.length} suites, ${suites.reduce((n, s) => n + s.pass, 0)} passed, ${skipped} skipped\n`);
  for (const s of suites.filter((x) => x.skipped)) out(`skip-guard: skipped ${s.skipped} in ${s.suite}\n`);
  for (const p of problems) out(`skip-guard: FAIL ${p}\n`);
  if (!problems.length) out('skip-guard: ok\n');
  return problems.length ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) process.exitCode = main();
