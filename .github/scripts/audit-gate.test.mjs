// Tests for the npm audit gate. Run: node --test .github/scripts/audit-gate.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gate, advisories } from './audit-gate.mjs';

const adv = (name, id, severity) => ({ source: 1, name, url: `https://github.com/advisories/${id}`, severity, title: `${name} issue` });
const report = (...list) => ({
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
  const r = gate({ vulnerabilities: {} }, { ignore: [entry('GHSA-vfj7-8cjw-p6xm', 'braces')] }, { today });
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
