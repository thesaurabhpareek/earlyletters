// BL-583 (DATA-02): the three acceptance lines of the backlog item, against a throwaway git repo.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { checkChange, checkProjectVersions, parseVersions, runStaging } from './migrations-record.mjs';

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations-record.mjs');
const A = '20260930000000_scribe_core.sql';
const B = '20261001000000_scribe_hardening.sql';
const C = '20261028010000_invite_redeem_by_code.sql';

function repo(lists) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mrec-'));
  const g = (...a) => execFileSync('git', ['-C', root, ...a], { stdio: 'ignore' });
  g('init', '-q', '-b', 'main');
  g('config', 'user.email', 'a@example.com');
  g('config', 'user.name', 'a');
  fs.mkdirSync(path.join(root, 'supabase/migrations'), { recursive: true });
  fs.mkdirSync(path.join(root, '.github/migrations-applied'), { recursive: true });
  for (const f of [A, B, C]) fs.writeFileSync(path.join(root, 'supabase/migrations', f), `-- ${f}\n`);
  for (const [p, names] of Object.entries(lists)) fs.writeFileSync(path.join(root, '.github/migrations-applied', `${p}.txt`), names.join('\n') + '\n');
  g('add', '-A'); g('commit', '-q', '-m', 'base');
  g('checkout', '-q', '-b', 'change');
  return { root, g };
}
const guard = (root) => spawnSync('node', [script, 'guard', 'main', 'HEAD'], { cwd: root, encoding: 'utf8' });

test('[BL-583] a PR that edits a file applied only on staging fails the guard', () => {
  const { root, g } = repo({ 'early-letters': [A], staging: [A, B, C] });
  fs.appendFileSync(path.join(root, 'supabase/migrations', C), 'select 1;\n');
  g('commit', '-qam', 'edit');
  const r = guard(root);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /invite_redeem_by_code.*edited.*staging/);
});

test('[BL-583] a new file that sorts before staging\'s newest applied version fails the guard', () => {
  const { root, g } = repo({ 'early-letters': [A, B], staging: [A, B, C] });
  fs.writeFileSync(path.join(root, 'supabase/migrations/20261015000000_late.sql'), 'select 1;\n');
  g('add', '-A'); g('commit', '-qm', 'add');
  const r = guard(root);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /20261015000000_late.sql.*sorts before the newest applied one \(20261028010000/);
});

test('[BL-583] a later new file passes, and so does a PR that adds a line to a list', () => {
  const { root, g } = repo({ 'early-letters': [A, B], staging: [A, B, C] });
  fs.writeFileSync(path.join(root, 'supabase/migrations/20261101000000_next.sql'), 'select 1;\n');
  g('add', '-A'); g('commit', '-qm', 'add');
  assert.equal(guard(root).status, 0);
});

test('[BL-583] removing a line from any list, or listing a missing file, fails the guard', () => {
  const { root, g } = repo({ staging: [A, B, C] });
  fs.writeFileSync(path.join(root, '.github/migrations-applied/staging.txt'), `${A}\n${B}\n20261101000000_ghost.sql\n`);
  g('commit', '-qam', 'shrink');
  const r = guard(root);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /removed from the staging list/);
  assert.match(r.stderr, /ghost.*missing/);
});

test('[BL-583] before the lists move, the old flat file still guards (project early-letters)', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mrec-'));
  const g = (...a) => execFileSync('git', ['-C', root, ...a], { stdio: 'ignore' });
  g('init', '-q', '-b', 'main'); g('config', 'user.email', 'a@example.com'); g('config', 'user.name', 'a');
  fs.mkdirSync(path.join(root, 'supabase/migrations'), { recursive: true });
  fs.mkdirSync(path.join(root, '.github'), { recursive: true });
  fs.writeFileSync(path.join(root, 'supabase/migrations', A), 'x\n');
  fs.writeFileSync(path.join(root, '.github/migrations-applied.txt'), `# c\n${A}\n`);
  g('add', '-A'); g('commit', '-q', '-m', 'base'); g('checkout', '-q', '-b', 'change');
  fs.appendFileSync(path.join(root, 'supabase/migrations', A), 'y\n');
  g('commit', '-qam', 'edit');
  assert.equal(guard(root).status, 1);
});

test('[BL-583] deploy check: a version on staging missing from its list fails', () => {
  assert.deepEqual(checkProjectVersions({ project: 'staging', versions: ['20260930000000', '20261028010000'], list: [A] }),
    ['20261028010000: applied on staging but not in its list. Open a PR that adds the file to .github/migrations-applied/staging.txt.']);
  const bad = runStaging('staging', '20260930000000\n20261028010000\n', () => [A]);
  assert.equal(bad.code, 1);
  assert.equal(runStaging('staging', '20260930000000\n20261001000000\n', () => [A, B]).code, 0);
});

test('[BL-583] deploy check: no versions, or a line that is not a version, is never a pass', () => {
  assert.equal(runStaging('staging', '', () => [A]).code, 1);
  assert.equal(runStaging('staging', 'postgres://user:pw@host/db\n', () => [A]).code, 2);
  assert.throws(() => parseVersions('abc'));
});

test('[BL-583] checkChange names every project that lists an edited file', () => {
  const errors = checkChange({ before: { a: [A], b: [A] }, after: { a: [A], b: [A] }, changes: [{ status: 'M', name: A }], exists: () => true });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /a, b/);
});
