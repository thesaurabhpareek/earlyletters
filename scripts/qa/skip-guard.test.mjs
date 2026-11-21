// Tests for scripts/qa/skip-guard.mjs (retro package R2-08).
// Run: node --test scripts/qa/skip-guard.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseSummaries, evaluate, parseArgs, run, DEFAULT_THRESHOLD } from './skip-guard.mjs';

const SCRIPT = fileURLToPath(new URL('./skip-guard.mjs', import.meta.url));
const INFO = '\u2139'; // the sign node:test's spec reporter prints before each count

// Reconstruction of PR #34's packages/api drift run: `describe.skipIf(reason)`
// skipped every drift check and vitest still exited 0. The 157 count is from
// the lens (a) review quoted in retro panel 02; the timing lines are made up.
const PR34_VITEST = [
  '> @scribe/api@0.1.0 test',
  '> vitest run',
  '',
  ' RUN  v3.2.7 /repo/packages/api',
  '',
  ' \u001b[2mTest Files\u001b[22m  \u001b[33m1 skipped\u001b[39m (1)',
  '      Tests  \u001b[33m157 skipped\u001b[39m (157)',
  '   Start at  10:00:00',
  '   Duration  300ms',
  '',
].join('\n');

const VITEST_CLEAN = [
  '> @scribe/core@0.1.0 test',
  ' Test Files  4 passed (4)',
  '      Tests  38 passed (38)',
].join('\n');

const VITEST_MIXED = ' Test Files  1 failed | 1 passed (2)\n      Tests  1 passed | 2 skipped | 1 todo (4)\n';

const NODE_SPEC = [
  `${INFO} tests 3`,
  `${INFO} suites 0`,
  `${INFO} pass 1`,
  `${INFO} fail 0`,
  `${INFO} cancelled 0`,
  `${INFO} skipped 1`,
  `${INFO} todo 1`,
  `${INFO} duration_ms 69.836844`,
].join('\n');

const NODE_TAP_CLEAN = [
  '1..5',
  '# tests 5',
  '# suites 0',
  '# pass 5',
  '# fail 0',
  '# cancelled 0',
  '# skipped 0',
  '# todo 0',
  '# duration_ms 97.6',
].join('\n');

const NODE_TAP_EMPTY = '1..0\n# tests 0\n# suites 0\n# pass 0\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n# duration_ms 5\n';

test('parses the #34 reproduction as one vitest suite with 157 skipped and 0 passed', () => {
  const [s, ...rest] = parseSummaries(PR34_VITEST);
  assert.equal(rest.length, 0);
  assert.deepEqual(s, {
    format: 'vitest',
    label: '@scribe/api@0.1.0',
    tests: 157,
    pass: 0,
    fail: 0,
    cancelled: 0,
    skipped: 157,
    todo: 0,
  });
});

test('warns on the #34 case: zero executed and 100% skipped', () => {
  const w = evaluate(parseSummaries(PR34_VITEST));
  assert.equal(w.length, 2);
  assert.match(w[0], /@scribe\/api.*zero executed tests/);
  assert.match(w[1], /100% of tests skipped or todo/);
});

test('#34 case: exit 0 by default, 1 with --strict', () => {
  assert.equal(run(PR34_VITEST, parseArgs([])).code, 0);
  const strict = run(PR34_VITEST, parseArgs(['--strict']));
  assert.equal(strict.code, 1);
  assert.match(strict.out, /WARNING/);
});

test('a clean vitest suite passes', () => {
  const r = run(VITEST_CLEAN, parseArgs(['--strict']));
  assert.equal(r.code, 0);
  assert.match(r.out, /skip-guard: ok/);
});

test('vitest mixed counts are summed and checked against the threshold', () => {
  const [s] = parseSummaries(VITEST_MIXED);
  assert.equal(s.pass, 1);
  assert.equal(s.skipped, 2);
  assert.equal(s.todo, 1);
  assert.equal(s.tests, 4);
  assert.equal(evaluate([s]).length, 1); // 75% not run
  assert.equal(evaluate([s], { threshold: 0.8 }).length, 0);
});

test('node:test spec reporter summary is parsed', () => {
  const [s] = parseSummaries(NODE_SPEC);
  assert.equal(s.format, 'node-spec');
  assert.equal(s.tests, 3);
  assert.equal(s.skipped, 1);
  assert.equal(s.todo, 1);
  const w = evaluate([s]);
  assert.equal(w.length, 1);
  assert.match(w[0], /67% of tests skipped or todo/);
});

test('node:test TAP summaries: clean passes, empty warns', () => {
  const [clean] = parseSummaries(NODE_TAP_CLEAN);
  assert.equal(clean.format, 'node-tap');
  assert.deepEqual(evaluate([clean]), []);
  const w = evaluate(parseSummaries(NODE_TAP_EMPTY));
  assert.equal(w.length, 1);
  assert.match(w[0], /zero executed tests/);
});

test('several summaries in one log are checked one by one with npm labels', () => {
  const log = [VITEST_CLEAN, PR34_VITEST, '> scribe@ test', NODE_TAP_CLEAN].join('\n');
  const sums = parseSummaries(log);
  assert.deepEqual(
    sums.map((s) => s.label),
    ['@scribe/core@0.1.0', '@scribe/api@0.1.0', 'scribe@'],
  );
  const w = evaluate(sums);
  assert.equal(w.length, 2);
  assert.ok(w.every((x) => x.startsWith('@scribe/api')));
});

test('a skip share at the threshold is allowed, above it warns', () => {
  const at = { format: 'vitest', label: 'x', tests: 10, pass: 8, fail: 0, cancelled: 0, skipped: 2, todo: 0 };
  assert.equal(DEFAULT_THRESHOLD, 0.2);
  assert.deepEqual(evaluate([at]), []);
  assert.equal(evaluate([{ ...at, pass: 7, skipped: 3 }]).length, 1);
  assert.equal(evaluate([at], { threshold: 0 }).length, 1);
});

test('input with no summary warns', () => {
  const w = evaluate(parseSummaries('npm ERR! something went wrong\n'));
  assert.equal(w.length, 1);
  assert.match(w[0], /no test summary found/);
});

test('per-test TAP skip directives are not mistaken for a summary', () => {
  const tap = 'ok 1 - s # SKIP\nok 2 - t # TODO\n# Subtest: x\n';
  assert.deepEqual(parseSummaries(tap), []);
});

test('bad arguments are rejected', () => {
  assert.throws(() => parseArgs(['--threshold', '2']), /0 to 1/);
  assert.throws(() => parseArgs(['--threshold', 'x']), /0 to 1/);
  assert.throws(() => parseArgs(['--nope']), /unknown option/);
  assert.throws(() => parseArgs(['a', 'b']), /one input file/);
});

test('CLI reads stdin and honours --strict exit codes', () => {
  const warn = spawnSync(process.execPath, [SCRIPT], { input: PR34_VITEST, encoding: 'utf8' });
  assert.equal(warn.status, 0);
  assert.match(warn.stdout, /WARNING @scribe\/api/);
  const strict = spawnSync(process.execPath, [SCRIPT, '--strict'], { input: PR34_VITEST, encoding: 'utf8' });
  assert.equal(strict.status, 1);
  const ok = spawnSync(process.execPath, [SCRIPT, '--strict'], { input: VITEST_CLEAN, encoding: 'utf8' });
  assert.equal(ok.status, 0);
  const missing = spawnSync(process.execPath, [SCRIPT, '/nonexistent/skip-guard.log'], { encoding: 'utf8' });
  assert.equal(missing.status, 2);
});
