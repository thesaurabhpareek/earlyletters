import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintPaths } from './workflow-lint.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const fx = (n) => join(here, 'fixtures', 'workflow-lint', n);
const repo = join(here, '..', '..');
const shape = (fs) => fs.map((f) => `${f.line}:${f.rule}`);

test('pinned workflow passes', () => assert.deepEqual(lintPaths([fx('good-pinned.yml')]), []));

test('planted tag pin and short sha fail with line numbers; full sha passes', () => {
  assert.deepEqual(shape(lintPaths([fx('bad-tag-pin.yml')])), ['7:pin', '9:pin']);
});

test('pull_request_target with base checkout and env interpolation passes', () => {
  assert.deepEqual(lintPaths([fx('good-prt-base.yml')]), []);
});

test('planted pull_request_target head checkout fails', () => {
  assert.deepEqual(shape(lintPaths([fx('bad-prt-head.yml')])), ['10:prt']);
});

test('planted interpolation and gh pr checkout fail', () => {
  assert.deepEqual(shape(lintPaths([fx('bad-prt-interp.yml')])), ['8:prt', '9:prt']);
});

test('same checkout ref is fine when the trigger is not pull_request_target', () => {
  const src = `on: [pull_request]\njobs:\n  a:\n    steps:\n      - uses: actions/checkout@${'a'.repeat(40)}\n        with:\n          ref: \${{ github.event.pull_request.head.sha }}\n`;
  // lintText is exercised through a fixture-free inline check
  return import('./workflow-lint.mjs').then(({ lintText }) => assert.deepEqual(lintText('x.yml', src), []));
});

test('CLI exits 1 on a failing fixture and 0 on a clean one', () => {
  const run = (f) => spawnSync('node', [join(here, 'workflow-lint.mjs'), fx(f)], { encoding: 'utf8' });
  assert.equal(run('bad-prt-head.yml').status, 1);
  assert.match(run('bad-tag-pin.yml').stdout, /bad-tag-pin\.yml:7: pin:/);
  assert.equal(run('good-pinned.yml').status, 0);
});

// Expected current output on develop (60136e51): 17 tag pins, no prt findings. Once the founder applies
// the pins (HV2-B20) this stays green because every finding must be in this list.
const KNOWN = new Set([
  'ci.yml:31', 'ci.yml:32', 'ci.yml:38', 'ci.yml:55', 'ci.yml:70', 'ci.yml:81', 'ci.yml:92',
  'migration-guard.yml:20', 'migration-guard.yml:23',
  'web-e2e.yml:43', 'web-e2e.yml:45', 'web-e2e.yml:50', 'web-e2e.yml:61', 'web-e2e.yml:77',
  'web.yml:52', 'web.yml:54', 'web.yml:61',
]);
test('real workflows: only the 17 known tag pins, no pull_request_target finding', () => {
  const wf = join(repo, '.github', 'workflows');
  const fs = lintPaths([wf]);
  assert.deepEqual(fs.filter((f) => f.rule === 'prt'), []);
  const unknown = fs.map((f) => `${f.file.split('/').pop()}:${f.line}`).filter((k) => !KNOWN.has(k));
  assert.deepEqual(unknown, []);
  assert.ok(fs.length <= 17);
});
