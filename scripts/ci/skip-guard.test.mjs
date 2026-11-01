// Tests for scripts/ci/skip-guard.mjs (HV2-B09, HV2-010, EG-1 to EG-3, EG-9 planted failures).
// Run: node --test scripts/ci/skip-guard.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { evaluate, parseDb, checkAllowlist, readWorkspaces, readDbFiles, parseArgs, main } from './skip-guard.mjs';

const SCRIPT = fileURLToPath(new URL('./skip-guard.mjs', import.meta.url));
const INFO = 'ℹ'; // the sign node:test's spec reporter prints before each count
const TODAY = '2026-11-01';

const WS = [
  { name: '@scribe/core', path: 'packages/core', hasTest: true, mayBeEmpty: false },
  { name: '@scribe/api', path: 'packages/api', hasTest: true, mayBeEmpty: false },
  { name: '@scribe/web', path: 'apps/web', hasTest: true, mayBeEmpty: true },
];
const DB = ['rls.test.mjs', 'sync.test.mjs'];
const ev = (inputs, allow = []) => evaluate(inputs, { allow, workspaces: WS, dbFiles: DB, today: TODAY });
const entry = (o = {}) => ({ suite: 'packages/api', count: 2, reason: 'needs a pending migration', owner: 'qa', expires: '2026-12-01', ...o });

const core = (skipped = 0) => [
  '> @scribe/core@0.1.0 test', '> vitest run', '',
  ' Test Files  4 passed (4)',
  skipped ? `      Tests  38 passed | ${skipped} skipped (${38 + skipped})` : '      Tests  38 passed (38)', '',
].join('\n');
const api = (skipped = 0) => [
  '> @scribe/api@0.1.0 test', '> vitest run', '',
  skipped ? `      Tests  10 passed | ${skipped} skipped (${10 + skipped})` : '      Tests  10 passed (10)', '',
].join('\n');
// The earlier failure: describe.skipIf skipped all 157 drift checks and vitest exited 0.
const PR34 = ['> @scribe/api@0.1.0 test', '> vitest run', '', ' \u001b[2mTest Files\u001b[22m  \u001b[33m1 skipped\u001b[39m (1)',
  '      Tests  \u001b[33m157 skipped\u001b[39m (157)', ''].join('\n');
const dbFile = (name, body) => `\n=== ${name} (12 migrations) ===\n${body}\n`;
const DB_RLS = dbFile('rls.test.mjs', 'PASS  a\nPASS  b\n\nALL PASSED (2 checks)');
const DB_SYNC = dbFile('sync.test.mjs', 'PASS  a\n\nALL PASSED (1 checks)');

test('[HV2-010] EG-1: a clean run passes', () => {
  assert.deepEqual(ev([core() + api(), DB_RLS + DB_SYNC]).problems, []);
});

test('[HV2-010] EG-1: skipped above the allowlist fails; at it passes; unlisted means zero', () => {
  const log = core() + api(3);
  assert.match(ev([log], [entry({ count: 2 })]).problems.join('\n'), /packages\/api: 3 skipped, 2 allowed/);
  assert.deepEqual(ev([core() + api(2)], [entry({ count: 2 })]).problems, []);
  assert.match(ev([core() + api(1)]).problems.join('\n'), /packages\/api: 1 skipped, 0 allowed \(not in the allowlist\)/);
});

test('[HV2-010] the 157 skipped log of the earlier failure fails, with and without an allowlist entry of 157', () => {
  const log = core() + PR34;
  const bare = ev([log]).problems.join('\n');
  assert.match(bare, /packages\/api: 157 skipped, 0 allowed/);
  assert.match(bare, /packages\/api: zero tests passed/);
  assert.match(ev([log], [entry({ count: 157 })]).problems.join('\n'), /zero tests passed/);
});

test('[HV2-010] a planted skip in a node:test run fails (TAP and spec reporters)', () => {
  const tap = ['> @scribe/core@0.1.0 test', '# tests 5', '# suites 0', '# pass 4', '# fail 0', '# cancelled 0', '# skipped 1', '# todo 0', '# duration_ms 9'].join('\n');
  assert.match(ev([tap + '\n' + api()]).problems.join('\n'), /packages\/core: 1 skipped, 0 allowed/);
  const spec = ['> @scribe/core@0.1.0 test', `${INFO} tests 5`, `${INFO} pass 4`, `${INFO} fail 0`, `${INFO} skipped 0`, `${INFO} todo 1`, `${INFO} duration_ms 9`].join('\n');
  assert.match(ev([spec + '\n' + api()]).problems.join('\n'), /packages\/core: 1 skipped/);
});

test('[HV2-010] several summaries of one workspace are summed (api runs vitest twice)', () => {
  const r = ev([core() + api(1) + '\n      Tests  2 passed | 1 skipped (3)\n']);
  assert.match(r.problems.join('\n'), /packages\/api: 2 skipped, 0 allowed/);
});

test('[HV2-010] EG-2: an expected workspace with no summary fails; empty input fails; no-tests workspace is exempt', () => {
  assert.match(ev([core()]).problems.join('\n'), /packages\/api: no summary found/);
  assert.match(ev(['']).problems.join('\n'), /no test summary found in the input/);
  assert.ok(!ev([core() + api()]).problems.join('\n').includes('apps/web'));
});

test('[HV2-010] db runner: auth_config style summary counts its ok lines', () => {
  const rows = parseDb(dbFile('auth_config.test.mjs', 'ok   a\nok   b\nAll auth config checks passed.') + dbFile('perf.test.mjs', 'Node.js v22.22.0'));
  assert.deepEqual(rows.map((r) => [r.suite, r.pass, r.found]), [['db:auth_config.test.mjs', 2, true], ['db:perf.test.mjs', 0, false]]);
});

test('[HV2-010] EG-2: a db log missing a file, or a file cut off without a summary, fails', () => {
  assert.match(ev([core() + api(), DB_RLS]).problems.join('\n'), /db:sync\.test\.mjs: no summary/);
  const cut = DB_RLS + dbFile('sync.test.mjs', 'PASS  a\nFAIL  b');
  assert.match(ev([core() + api(), cut]).problems.join('\n'), /db:sync\.test\.mjs: no summary/);
});

test('[HV2-010] db runner: summaries, failures and SKIP lines are read per file', () => {
  const rows = parseDb(DB_RLS + dbFile('sync.test.mjs', 'SKIP  later\nFAIL  x\n\n1 FAILED (4 passed)'));
  assert.deepEqual(rows.map((r) => [r.suite, r.pass, r.fail, r.skipped, r.found]), [['db:rls.test.mjs', 2, 0, 0, true], ['db:sync.test.mjs', 4, 1, 1, true]]);
  assert.match(ev([core() + api(), DB_RLS + dbFile('sync.test.mjs', 'SKIP  later\n\nALL PASSED (3 checks)')]).problems.join('\n'), /db:sync\.test\.mjs: 1 skipped, 0 allowed/);
  assert.match(ev([core() + api(), DB_RLS + dbFile('sync.test.mjs', 'ALL PASSED (0 checks)')]).problems.join('\n'), /db:sync\.test\.mjs: zero tests passed/);
});

test('[HV2-010] EG-3: an expired entry fails, and so does one with a missing field', () => {
  const log = core() + api(2);
  assert.match(ev([log], [entry({ expires: '2026-10-31' })]).problems.join('\n'), /expired on 2026-10-31/);
  assert.deepEqual(ev([log], [entry({ expires: TODAY })]).problems, []);
  for (const f of ['suite', 'count', 'reason', 'owner', 'expires']) {
    const e = entry(); delete e[f];
    assert.match(checkAllowlist([e], TODAY).join('\n'), new RegExp(`missing ${f}`));
  }
  assert.match(checkAllowlist([entry({ expires: '1 Dec' })], TODAY).join('\n'), /YYYY-MM-DD/);
  assert.match(checkAllowlist([entry(), entry()], TODAY).join('\n'), /listed twice/);
  assert.match(checkAllowlist({}, TODAY).join('\n'), /JSON array/);
});

test('[HV2-010] EG-3: an entry above the real count fails, so the count stays exact', () => {
  assert.match(ev([core() + api(1)], [entry({ count: 2 })]).problems.join('\n'), /allowlist says 2 skipped but the logs show 1/);
  assert.match(ev([core() + api()], [entry({ count: 2 })]).problems.join('\n'), /allowlist says 2 skipped but the logs show 0/);
  assert.match(ev([core() + api()], [entry({ suite: 'packages/gone', count: 1 })]).problems.join('\n'), /packages\/gone: allowlist says 1/);
});

test('readWorkspaces and readDbFiles read a repo layout', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skipg-'));
  const w = (rel, text) => { fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true }); fs.writeFileSync(path.join(root, rel), text); };
  w('package.json', JSON.stringify({ workspaces: ['apps/*', 'packages/*', 'experiments'] }));
  w('packages/core/package.json', JSON.stringify({ name: '@scribe/core', scripts: { test: 'vitest run' } }));
  w('apps/web/package.json', JSON.stringify({ name: '@scribe/web', scripts: { test: 'vitest run --passWithNoTests' } }));
  w('experiments/package.json', JSON.stringify({ name: '@scribe/experiments' }));
  w('supabase/tests/rls.test.mjs', '');
  w('supabase/tests/harness.mjs', '');
  assert.deepEqual(readWorkspaces(root).map((x) => [x.path, x.hasTest, x.mayBeEmpty]), [['apps/web', true, true], ['packages/core', true, false], ['experiments', false, false]]);
  assert.deepEqual(readDbFiles(root), ['rls.test.mjs']);
});

test('CLI: exit codes, files, stdin and the allowlist file (planted skip turns the run red)', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skipg-'));
  const w = (rel, text) => { fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true }); fs.writeFileSync(path.join(root, rel), text); };
  w('package.json', JSON.stringify({ workspaces: ['packages/*'] }));
  w('packages/core/package.json', JSON.stringify({ name: '@scribe/core', scripts: { test: 'vitest run' } }));
  w('test.log', core());
  w('planted.log', core(1));
  w('docs/qa/skip-allowlist.json', JSON.stringify([entry({ suite: 'packages/core', count: 1 })]));
  const run = (args, input) => spawnSync(process.execPath, [SCRIPT, '--root', root, '--today', TODAY, ...args], { encoding: 'utf8', input });
  assert.equal(run([path.join(root, 'test.log')]).status, 1, 'allowlist entry of 1 but 0 skipped');
  assert.equal(run([path.join(root, 'planted.log')]).status, 0);
  fs.writeFileSync(path.join(root, 'docs/qa/skip-allowlist.json'), '[]');
  const red = run([path.join(root, 'planted.log')]);
  assert.equal(red.status, 1);
  assert.match(red.stdout, /FAIL packages\/core: 1 skipped, 0 allowed/);
  assert.equal(run([path.join(root, 'test.log')]).status, 0);
  assert.equal(run(['-'], core()).status, 0);
  assert.equal(run([path.join(root, 'missing.log')]).status, 2);
  assert.equal(run(['--bogus']).status, 2);
});

test('parseArgs and main reject bad usage', () => {
  assert.throws(() => parseArgs(['--today', 'soon']), /YYYY-MM-DD/);
  assert.throws(() => parseArgs(['--nope']), /unknown option/);
  let err = '';
  assert.equal(main(['--today', 'x'], { err: (s) => { err += s; } }), 2);
  assert.match(err, /skip-guard/);
});
