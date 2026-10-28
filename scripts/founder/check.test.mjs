// Tests for scripts/founder/check.mjs with fixture API responses. Run: node --test scripts/founder/check.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  runChecks, countTrustedKeys, appliedMigrations, exitCode, render, REQUIRED_CHECKS,
} from './check.mjs';

const REPO = 'o/r';
const b64 = (s) => ({ content: Buffer.from(s).toString('base64'), encoding: 'base64' });
const KEYS_EMPTY = `export const TRUSTED_SIGNING_KEYS: readonly TrustedKey[] = [
  // TODO(founder): paste, for example:
  // { keyId: 'el-2026-10', publicKey: '<44>', kinds: ['pack-manifest'] },
];`;
const KEYS_TWO = `export const TRUSTED_SIGNING_KEYS: readonly TrustedKey[] = [
  { keyId: 'el-2026-10', publicKey: 'a', kinds: ['pack-manifest'] },
  { keyId: 'el-2026-10-backup', publicKey: 'b', kinds: ['pack-manifest'] },
];`;
const APPLIED = '# comment\n# more\na.sql\nb.sql\n';
const protection = { required_status_checks: { contexts: [...REQUIRED_CHECKS] }, allow_force_pushes: { enabled: false }, allow_deletions: { enabled: false } };

// Today's state as read on 28 Oct 2026 (shapes as GitHub returns them).
function todayFixtures() {
  return {
    [`repos/${REPO}`]: { status: 200, body: { default_branch: 'main', security_and_analysis: {
      secret_scanning: { status: 'enabled' }, secret_scanning_push_protection: { status: 'enabled' } } } },
    [`repos/${REPO}/vulnerability-alerts`]: { status: 403, body: null },
    [`repos/${REPO}/branches/develop/protection`]: { status: 404, body: { message: 'Branch not protected' } },
    [`repos/${REPO}/branches/main/protection`]: { status: 404, body: { message: 'Branch not protected' } },
    [`repos/${REPO}/rules/branches/develop`]: { status: 200, body: [] },
    [`repos/${REPO}/rules/branches/main`]: { status: 200, body: [{ type: 'deletion' }, { type: 'non_fast_forward' }] },
    [`repos/${REPO}/actions/workflows?per_page=100`]: { status: 200, body: { workflows: [{ path: '.github/workflows/ci.yml' }] } },
    [`repos/${REPO}/contents/packages/api/src/keys.ts?ref=develop`]: { status: 200, body: b64(KEYS_EMPTY) },
    [`repos/${REPO}/contents/.github/migrations-applied.txt?ref=develop`]: { status: 200, body: b64(APPLIED) },
    [`repos/${REPO}/contents/supabase/migrations?ref=develop`]: { status: 200, body: [{ name: 'a.sql' }, { name: 'b.sql' }, { name: 'c.sql' }, { name: 'README.md' }] },
  };
}

function fakeGet(fixtures, calls = []) {
  return async (path, opts) => {
    calls.push({ path, opts });
    return fixtures[path] ?? { status: 404, body: null };
  };
}

const byId = (rs) => Object.fromEntries(rs.map((r) => [r.id, r]));

test('today: default branch, protection, workflows, keys and migrations are open', async () => {
  const r = byId(await runChecks(fakeGet(todayFixtures()), REPO));
  assert.equal(r['default-branch'].status, 'open');
  assert.equal(r['secret-scanning'].status, 'done');
  assert.equal(r['dependabot-alerts'].status, 'unreadable');
  assert.equal(r['protection-develop'].status, 'open');
  assert.match(r['protection-main'].detail, /ruleset rules: deletion, non_fast_forward/);
  assert.equal(r['workflows-registered'].status, 'open');
  assert.match(r['workflows-registered'].detail, /nightly\.yml, testflight\.yml, agents\.yml/);
  assert.equal(r['trusted-signing-keys'].status, 'open');
  assert.match(r['migrations-applied'].detail, /^2 of 3 /);
});

test('everything done reads as done and exits 0', async () => {
  const f = todayFixtures();
  f[`repos/${REPO}`].body.default_branch = 'develop';
  f[`repos/${REPO}/vulnerability-alerts`] = { status: 204, body: null };
  f[`repos/${REPO}/branches/develop/protection`] = { status: 200, body: protection };
  f[`repos/${REPO}/branches/main/protection`] = { status: 200, body: protection };
  f[`repos/${REPO}/actions/workflows?per_page=100`].body.workflows = ['nightly.yml', 'testflight.yml', 'agents.yml'].map((n) => ({ path: `.github/workflows/${n}` }));
  f[`repos/${REPO}/contents/packages/api/src/keys.ts?ref=develop`].body = b64(KEYS_TWO);
  f[`repos/${REPO}/contents/supabase/migrations?ref=develop`].body = [{ name: 'a.sql' }, { name: 'b.sql' }];
  const rs = await runChecks(fakeGet(f), REPO);
  assert.deepEqual(rs.filter((r) => r.status !== 'done'), []);
  assert.equal(exitCode(rs), 0);
});

test('protection without the required checks or with force pushes stays open', async () => {
  const f = todayFixtures();
  f[`repos/${REPO}/branches/develop/protection`] = { status: 200, body: { required_status_checks: { contexts: ['required'] }, allow_force_pushes: { enabled: true } } };
  const r = byId(await runChecks(fakeGet(f), REPO));
  assert.equal(r['protection-develop'].status, 'open');
  assert.match(r['protection-develop'].detail, /applied migrations unchanged/);
  assert.match(r['protection-develop'].detail, /force pushes allowed/);
});

test('a 403 is unreadable, not done; unreadable alone exits 2', async () => {
  const rs = [{ id: 'x', queue: 'W0-08', status: 'unreadable', detail: 'HTTP 403' }, { id: 'y', queue: 'W0-09', status: 'done', detail: '' }];
  assert.equal(exitCode(rs), 2);
  assert.equal(exitCode([...rs, { id: 'z', queue: 'W0-09', status: 'open', detail: '' }]), 1);
  assert.match(render(rs), /^UNREADABLE W0-08  x: HTTP 403/);
});

test('countTrustedKeys ignores commented examples', () => {
  assert.equal(countTrustedKeys(KEYS_EMPTY), 0);
  assert.equal(countTrustedKeys(KEYS_TWO), 2);
  assert.equal(countTrustedKeys('no array here'), null);
});

test('appliedMigrations skips comments and blank lines', () => {
  assert.deepEqual(appliedMigrations(APPLIED), ['a.sql', 'b.sql']);
});

test('checker only reads: every request is a GET path, and the source has no write call', async () => {
  const calls = [];
  await runChecks(fakeGet(todayFixtures(), calls), REPO);
  assert.ok(calls.length >= 10);
  for (const c of calls) assert.equal(c.opts, undefined, `no options (no method or body) for ${c.path}`);
  const src = fs.readFileSync(new URL('./check.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /method:\s*'(POST|PUT|PATCH|DELETE)'|--method',\s*'(POST|PUT|PATCH|DELETE)'|-X\s|graphql/i);
  assert.equal((src.match(/method:\s*'GET'/g) ?? []).length, 1);
  assert.equal((src.match(/'--method', 'GET'/g) ?? []).length, 1);
});
