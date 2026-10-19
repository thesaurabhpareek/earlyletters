// Tests for the npm audit gate. Run: node --test .github/scripts/audit-gate.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { gate, advisories, parseReport, checkReport } from './audit-gate.mjs';

const adv = (name, id, severity) => ({ source: 1, name, url: `https://github.com/advisories/${id}`, severity, title: `${name} issue` });
const META = { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 }, dependencies: {} };
const clean = () => ({ auditReportVersion: 2, vulnerabilities: {}, metadata: META });
const report = (...list) => ({
  auditReportVersion: 2,
  metadata: META,
  vulnerabilities: Object.fromEntries(
    list.map((a) => [a.name, { severity: a.severity, via: [a] }]).concat([['expo', { severity: 'high', via: ['braces'] }]]),
  ),
});
const entry = (id, pkg, expires = '2027-01-03') => ({ id, package: pkg, reason: 'build tool', added: '2026-10-03', expires });
const today = '2026-10-03';

test('ignored advisories pass; strings in via are not counted twice', () => {
  const r = gate(report(adv('braces', 'GHSA-vfj7-8cjw-p6xm', 'high')), { ignore: [entry('GHSA-vfj7-8cjw-p6xm', 'braces')] }, { today });
  assert.equal(r.ok, true);
  assert.equal(r.found.length, 1);
});

test('a new high advisory fails', () => {
  const r = gate(report(adv('left-pad', 'GHSA-2222-3333-4444', 'high')), { ignore: [] }, { today });
  assert.equal(r.ok, false);
  assert.match(r.errors[0], /left-pad GHSA-2222-3333-4444/);
});

test('moderate advisories are below the high gate', () => {
  assert.equal(gate(report(adv('x', 'GHSA-2222-3333-4444', 'moderate')), { ignore: [] }, { today }).ok, true);
  assert.equal(gate(report(adv('x', 'GHSA-2222-3333-4444', 'moderate')), { ignore: [] }, { today, level: 'moderate' }).ok, false);
});

test('an expired or incomplete ignore entry fails', () => {
  const a = adv('braces', 'GHSA-vfj7-8cjw-p6xm', 'high');
  assert.match(gate(report(a), { ignore: [entry(a.url.slice(-19), 'braces', '2026-10-02')] }, { today }).errors[0], /expired/);
  assert.match(gate(report(a), { ignore: [{ id: 'GHSA-vfj7-8cjw-p6xm', package: 'braces' }] }, { today }).errors[0], /missing "reason"/);
});

test('entries no longer reported are flagged as stale', () => {
  const r = gate(clean(), { ignore: [entry('GHSA-vfj7-8cjw-p6xm', 'braces')] }, { today });
  assert.deepEqual(r.stale, ['GHSA-vfj7-8cjw-p6xm']);
});

test('the committed ignore list is well formed and dated', () => {
  const file = JSON.parse(readFileSync(new URL('../audit-ignore.json', import.meta.url), 'utf8'));
  const ids = file.ignore.map((e) => e.id).sort();
  assert.deepEqual(ids, ['GHSA-86w9-cpqp-85rv', 'GHSA-vcc3-ghjq-m6fr', 'GHSA-vfj7-8cjw-p6xm', 'GHSA-w5hq-g745-h8pq']);
  for (const e of file.ignore) {
    assert.match(e.added, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(e.expires, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(e.expires > e.added);
    assert.ok(e.reason.length > 20);
  }
  assert.equal(advisories(report()).length, 0);
});

// Fail closed (red-team finding 3): an audit that did not run is not clean.
const ok = { ignore: [] };

test('a clean, well formed report passes', () => {
  assert.equal(gate(clean(), ok, { today }).ok, true);
  assert.equal(gate(clean(), ok, { today, npmExit: 0 }).ok, true);
});

test('a report with an error key fails, even with vulnerabilities present', () => {
  const r = gate({ ...clean(), error: { code: 'ENOAUDIT', summary: 'audit endpoint returned an error' } }, ok, { today });
  assert.equal(r.ok, false);
  assert.match(r.errors[0], /npm audit reported an error: ENOAUDIT/);
  assert.equal(gate({ error: 'offline' }, ok, { today }).ok, false);
});

test('a report without vulnerabilities fails', () => {
  const { vulnerabilities, ...rest } = clean();
  const r = gate(rest, ok, { today });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => /no "vulnerabilities" object/.test(e)));
  assert.equal(gate({ ...clean(), vulnerabilities: [] }, ok, { today }).ok, false);
  assert.equal(gate({ ...clean(), vulnerabilities: null }, ok, { today }).ok, false);
});

test('a report without auditReportVersion 2 or metadata counts fails', () => {
  const { auditReportVersion, ...noVersion } = clean();
  assert.match(gate(noVersion, ok, { today }).errors[0], /auditReportVersion/);
  assert.equal(gate({ ...clean(), auditReportVersion: 1 }, ok, { today }).ok, false);
  const { metadata, ...noMeta } = clean();
  assert.match(gate(noMeta, ok, { today }).errors[0], /metadata.vulnerabilities/);
  assert.deepEqual(gate({}, ok, { today }).errors.length, 3);
});

test('non-object JSON fails', () => {
  for (const v of [null, [], 'ok', 0, true]) assert.equal(gate(v, ok, { today }).ok, false, JSON.stringify(v));
  assert.deepEqual(checkReport(clean()), []);
});

test('empty input and unparseable JSON throw', () => {
  assert.throws(() => parseReport(''), /empty input/);
  assert.throws(() => parseReport('  \n'), /empty input/);
  assert.throws(() => parseReport('{"auditReportVersion": 2,'), /not JSON/);
  assert.throws(() => parseReport('npm ERR! code ENOTFOUND'), /not JSON/);
  assert.deepEqual(parseReport(JSON.stringify(clean())), clean());
});

test('a nonzero npm exit that no advisory explains fails', () => {
  const r = gate(clean(), ok, { today, npmExit: 1 });
  assert.equal(r.ok, false);
  assert.match(r.errors[0], /exited 1 but reported no advisory at or above high/);
  assert.equal(gate(report(adv('x', 'GHSA-2222-3333-4444', 'moderate')), ok, { today, npmExit: 1 }).ok, false);
});

test('a nonzero npm exit explained by ignored advisories passes', () => {
  const a = adv('braces', 'GHSA-vfj7-8cjw-p6xm', 'high');
  assert.equal(gate(report(a), { ignore: [entry('GHSA-vfj7-8cjw-p6xm', 'braces')] }, { today, npmExit: 1 }).ok, true);
});

test('the CLI fails closed on empty input, bad JSON, an error report and a bad --npm-exit', () => {
  const script = fileURLToPath(new URL('./audit-gate.mjs', import.meta.url));
  const ignore = fileURLToPath(new URL('../audit-ignore.json', import.meta.url));
  const run = (input, extra = []) => {
    try {
      execFileSync(process.execPath, [script, '--ignore', ignore, ...extra], { input, stdio: 'pipe' });
      return 0;
    } catch (e) {
      return e.status;
    }
  };
  assert.equal(run(''), 1);
  assert.equal(run('not json'), 1);
  assert.equal(run(JSON.stringify({ error: { code: 'E500', summary: 'registry down' } })), 1);
  assert.equal(run(JSON.stringify({ message: 'ok' })), 1);
  assert.equal(run(JSON.stringify(clean()), ['--npm-exit', 'x']), 1);
  assert.equal(run(JSON.stringify(clean()), ['--npm-exit', '1']), 1);
  assert.equal(run(JSON.stringify(clean()), ['--npm-exit', '0']), 0);
});
