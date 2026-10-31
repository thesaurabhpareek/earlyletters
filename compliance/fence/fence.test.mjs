// Tests for the compliance fence (CR-23). Uses the real compliance/FENCE.json.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { decide, globToRegExp, protectedPaths } from './fence.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(here, '..', 'FENCE.json'), 'utf8'));
const SHA = 'a'.repeat(40);
const OLD = 'b'.repeat(40);
const OWNER = 'thesaurabhpareek';
const approval = (sha = SHA, login = OWNER, role = 'Karma') => ({ login, body: `Checked the diff.\n## ${role} approval at ${sha}: APPROVED (CR-23)\n${role}` });
const both = (sha = SHA) => [approval(sha, OWNER, 'CCO'), approval(sha)];
const base = { config, labels: [], headSha: SHA, comments: [], trustedLogins: [OWNER, 'claude[bot]'] };
const pr = (files, extra = {}) => decide({ ...base, files: files.map((f) => (typeof f === 'string' ? { filename: f } : f)), ...extra });

test('globs: ** spans folders, * stays in one segment', () => {
  assert.ok(globToRegExp('compliance/**').test('compliance/scripts/x.mjs'));
  assert.ok(globToRegExp('supabase/migrations/*_compliance_*.sql').test('supabase/migrations/20261031000000_compliance_gates.sql'));
  assert.ok(!globToRegExp('supabase/migrations/*_compliance_*.sql').test('supabase/migrations/x/1_compliance_y.sql'));
  assert.ok(!globToRegExp('compliance/**').test('compliance-notes.md'));
});

test('a PR that touches nothing protected passes without labels or approval', () => {
  assert.equal(pr(['apps/mobile/src/app/index.tsx', 'docs/ROADMAP.md']).pass, true);
});

test('every protected path is caught', () => {
  for (const f of ['compliance/README.md', 'compliance/FENCE.json', 'compliance/scripts/regulatory-watch.mjs',
    'supabase/migrations/20261031000000_compliance_gates.sql', 'supabase/tests/compliance_gates.test.mjs',
    '.claude/skills/regulatory-compliance/SKILL.md', '.claude/skills/infosec/SKILL.md',
    '.claude/agents/regulatory-affairs.md', '.github/workflows/compliance-fence.yml']) {
    assert.deepEqual(protectedPaths(config, [{ filename: f }]), [f], f);
  }
});

test('moving a file out of the fence still counts', () => {
  assert.equal(pr([{ filename: 'scripts/x.mjs', previous_filename: 'compliance/scripts/x.mjs' }]).pass, false);
});

test('protected change: fails without the label, without approval, or with both missing', () => {
  const f = ['compliance/scripts/load-geo-ip.mjs'];
  assert.equal(pr(f).pass, false);
  assert.equal(pr(f, { labels: ['agent:regulatory-affairs'] }).pass, false);
  assert.equal(pr(f, { comments: both() }).pass, false);
});

test('protected change: passes with an assigned agent label and both approvals on the head', () => {
  const r = pr(['compliance/scripts/load-geo-ip.mjs'], { labels: ['agent:regulatory-affairs'], comments: both() });
  assert.equal(r.pass, true, r.reasons.join('; '));
});

test('an agent that is not assigned cannot pass, even with approval', () => {
  assert.equal(pr(['compliance/README.md'], { labels: ['agent:mobile'], comments: both() }).pass, false);
});

test('an approval for an older commit does not count after a new push', () => {
  const r = pr(['compliance/README.md'], { labels: ['agent:compliance-engineer'], comments: [approval(OLD, OWNER, 'CCO'), approval(SHA)] });
  assert.equal(r.pass, false);
  assert.match(r.reasons.join(), /older commit/);
});

test('an approval from an untrusted login does not count', () => {
  assert.equal(pr(['compliance/README.md'], { labels: ['agent:compliance-engineer'], comments: [approval(SHA, OWNER, 'CCO'), approval(SHA, 'stranger')] }).pass, false);
});

test('the approval line must stand alone and match exactly', () => {
  const loose = { login: OWNER, body: `I think ## Karma approval at ${SHA}: APPROVED (CR-23) is fine` };
  const noRuling = { login: OWNER, body: `## Karma approval at ${SHA}: APPROVED` };
  assert.equal(pr(['compliance/README.md'], { labels: ['agent:security-architect'], comments: [loose, noRuling] }).pass, false);
});

test('Karma alone, or the CCO alone, is not enough', () => {
  const o = { labels: ['agent:compliance-engineer'] };
  assert.equal(pr(['compliance/README.md'], { ...o, comments: [approval()] }).pass, false);
  assert.equal(pr(['compliance/README.md'], { ...o, comments: [approval(SHA, OWNER, 'CCO')] }).pass, false);
});

test('malformed config or data fails closed', () => {
  assert.equal(decide({ ...base, config: {}, files: [] }).pass, false);
  assert.equal(decide({ ...base, files: [{ filename: 'x' }], headSha: 'nope' }).pass, false);
  assert.equal(decide({ ...base, files: null }).pass, false);
  assert.equal(decide({ ...base, config: { ...config, approvals: {} }, files: [{ filename: 'compliance/x' }], comments: both() }).pass, false);
});

test('CLI: exit 1 on unreadable input, 0 on a clean PR', () => {
  const run = (input) => spawnSync(process.execPath, [join(here, 'fence.mjs')], { input });
  assert.equal(run('not json').status, 1);
  assert.equal(run(JSON.stringify({ ...base, files: [{ filename: 'docs/x.md' }] })).status, 0);
});

test('the fence protects its own config, checker and workflow', () => {
  for (const f of ['compliance/FENCE.json', 'compliance/fence/fence.mjs', '.github/workflows/compliance-fence.yml']) {
    assert.equal(protectedPaths(config, [{ filename: f }]).length, 1, f);
  }
});
