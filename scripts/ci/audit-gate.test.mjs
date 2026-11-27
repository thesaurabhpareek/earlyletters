// node --test scripts/ci/audit-gate.test.mjs (wired into the root `npm test` list).
// Offline: every report comes from a fixture under scripts/ci/fixtures/audit/ or stdin; nothing here runs npm audit.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { DEFAULT_IGNORE, advisories, checkIgnore, gate, main, parseReport, readIgnore } from './audit-gate.mjs';

const fixture = (name) => fileURLToPath(new URL(`./fixtures/audit/${name}`, import.meta.url));
const load = (name) => JSON.parse(readFileSync(fixture(name), 'utf8'));
const TODAY = '2026-11-24';
const NONE = { ignore: [] };

/** Runs main() with captured output, never touching the real stdin or the network. */
function run(args, stdin = '') {
  const out = [];
  const code = main(['--today', TODAY, ...args], { stdin: () => stdin, log: (l) => out.push(l), error: (l) => out.push(l) });
  return { code, text: out.join('\n') };
}

test('[SEC-R08] the gate passes on a report with no advisory', () => {
  assert.equal(gate(load('clean.json'), NONE, { today: TODAY }).ok, true);
  assert.equal(run(['--input', fixture('clean.json'), '--ignore', fixture('ignore-valid.json')]).code, 0);
});

test('[SEC-R08] a high advisory that is not on the ignore list fails', () => {
  const r = gate(load('high.json'), NONE, { today: TODAY });
  assert.equal(r.ok, false);
  assert.deepEqual(r.blocking.map((a) => a.id), ['GHSA-86w9-cpqp-85rv']);
  assert.equal(run(['--input', fixture('high.json'), '--ignore', fixture('missing.json')]).code, 1);
});

test('[SEC-R08] the high advisory passes when it is on the list with a future expiry', () => {
  const r = gate(load('high.json'), load('ignore-valid.json'), { today: TODAY });
  assert.deepEqual([r.ok, r.errors], [true, []]);
  assert.equal(run(['--input', fixture('high.json'), '--ignore', fixture('ignore-valid.json')]).code, 0);
});

test('[SEC-R08] an expired ignore entry fails, even with no advisory in the report', () => {
  const r = gate(load('high.json'), load('ignore-expired.json'), { today: TODAY });
  assert.equal(r.ok, false);
  assert.match(r.errors.join('\n'), /GHSA-86w9-cpqp-85rv: expired on 2026-02-01/);
  assert.equal(gate(load('clean.json'), load('ignore-expired.json'), { today: TODAY }).ok, false);
});

test('[SEC-R08] an ignore entry with no reason fails', () => {
  const r = gate(load('high.json'), load('ignore-reasonless.json'), { today: TODAY });
  assert.equal(r.ok, false);
  assert.match(r.errors.join('\n'), /GHSA-86w9-cpqp-85rv: no reason/);
});

test('[SEC-R08] an entry with no id or no expiry fails, and so does a duplicate', () => {
  const errs = checkIgnore({ ignore: [{ reason: 'r', expires: '2099-01-01' }, { id: 'GHSA-2222-3333-4444', reason: 'r' }] }, TODAY);
  assert.match(errs.join('\n'), /entry 1: no advisory id/);
  assert.match(errs.join('\n'), /GHSA-2222-3333-4444: no expiry date/);
  const dup = { id: 'GHSA-2222-3333-4444', reason: 'r', expires: '2099-01-01' };
  assert.match(checkIgnore({ ignore: [dup, dup] }, TODAY).join('\n'), /listed twice/);
  assert.match(checkIgnore({}, TODAY)[0], /no "ignore" array/);
});

test('[SEC-R08] moderate advisories are below the default high level', () => {
  const report = load('high.json');
  delete report.vulnerabilities['node-forge'];
  assert.equal(gate(report, NONE, { today: TODAY }).ok, true);
  assert.equal(gate(report, NONE, { today: TODAY, level: 'moderate' }).ok, false);
});

test('[SEC-R08] an unknown severity blocks instead of passing (fail closed)', () => {
  const report = load('high.json');
  report.vulnerabilities['node-forge'].via[0].severity = 'severe';
  assert.equal(gate(report, NONE, { today: TODAY }).ok, false);
});

test('[SEC-R08] the gate fails closed on an npm error, empty input, non-JSON input and a wrong report shape', () => {
  assert.match(gate(load('npm-error.json'), NONE, { today: TODAY }).errors[0], /npm audit reported an error: ENOAUDIT/);
  assert.throws(() => parseReport(''), /empty input/);
  assert.throws(() => parseReport('npm ERR! network'), /not JSON/);
  assert.equal(gate({ auditReportVersion: 1, vulnerabilities: {} }, NONE, { today: TODAY }).ok, false);
  assert.equal(run([], '').code, 1);
});

test('[SEC-R08] a nonzero npm exit with no advisory in the report fails', () => {
  assert.equal(gate(load('clean.json'), NONE, { today: TODAY, npmExit: 1 }).ok, false);
  assert.equal(gate(load('high.json'), load('ignore-valid.json'), { today: TODAY, npmExit: 1 }).ok, true);
});

test('[SEC-R08] the report names advisory ids and package names only, never titles, URLs or reasons', () => {
  const { text } = run(['--input', fixture('high.json'), '--ignore', fixture('ignore-expired.json')]);
  assert.match(text, /GHSA-86w9-cpqp-85rv/);
  assert.match(text, /node-forge/);
  assert.doesNotMatch(text, /Example title|https?:|Build tool only/);
});

test('[SEC-R08] a missing ignore file is an empty list; an ignore file that is not JSON fails', () => {
  assert.deepEqual(readIgnore(fixture('missing.json')).ignore, []);
  assert.throws(() => readIgnore(fixture('../../audit-gate.mjs')), /not valid JSON/);
  assert.match(DEFAULT_IGNORE.replaceAll('\\', '/'), /\/\.github\/audit-ignore\.json$/);
});

test('[SEC-R08] advisories are counted once by id; a string in via is not an advisory', () => {
  const ids = advisories(load('high.json')).map((a) => `${a.id} ${a.package} ${a.severity}`);
  assert.deepEqual(ids, ['GHSA-86w9-cpqp-85rv node-forge high', 'GHSA-vcc3-ghjq-m6fr query-string moderate']);
});

test('[SEC-R08] the command line reads the report from stdin and exits 1 on a blocking advisory', () => {
  const script = fileURLToPath(new URL('./audit-gate.mjs', import.meta.url));
  const args = [script, '--today', TODAY, '--ignore', fixture('missing.json')];
  const input = readFileSync(fixture('high.json'), 'utf8');
  assert.throws(() => execFileSync(process.execPath, args, { input, stdio: 'pipe' }), (e) => e.status === 1);
  const ok = execFileSync(process.execPath, [...args.slice(0, 3), '--ignore', fixture('ignore-valid.json')], { input, encoding: 'utf8' });
  assert.match(ok, /audit gate: ok/);
});
