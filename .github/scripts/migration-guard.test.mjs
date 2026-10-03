// Tests for the migration guard. Run: node --test .github/scripts/
// Each test builds a throwaway git repository, so nothing touches this repo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, renameSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runGuard,
  resolveTrustedRef,
  parseExceptions,
  SCRIPT,
  MANIFEST,
  EXCEPTIONS,
  DIR,
} from './migration-guard.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const GUARD_SOURCE = readFileSync(join(HERE, 'migration-guard.mjs'), 'utf8');
const M1 = '20260930000000_asha_core.sql';
const M2 = '20261001000000_asha_hardening.sql';

function repo(t) {
  const dir = mkdtempSync(join(tmpdir(), 'guard-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const git = (...args) =>
    execFileSync('git', ['-c', 'user.name=Asha Test', '-c', 'user.email=asha@example.test', ...args], {
      cwd: dir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  const write = (path, text) => {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  };
  const remove = (path) => rmSync(join(dir, path));
  const commit = (msg) => {
    git('add', '-A');
    git('commit', '-q', '--allow-empty', '-m', msg);
    return git('rev-parse', 'HEAD');
  };
  const blob = (path) => git('hash-object', join(dir, path));
  git('init', '-q', '-b', 'main');
  return { dir, git, write, remove, commit, blob };
}

// A base branch where M1 and M2 are applied. withScript puts the guard (and an
// optional exception list) on the base, like develop after this change lands.
function seed(t, { withScript = true, exceptions } = {}) {
  const r = repo(t);
  r.write(DIR + M1, 'create table asha_letters (id uuid primary key);\n');
  r.write(DIR + M2, 'alter table asha_letters enable row level security;\n');
  r.write(MANIFEST, `# applied\n${M1}\n${M2}\n`);
  if (withScript) r.write(SCRIPT, GUARD_SOURCE);
  if (exceptions !== undefined) r.write(EXCEPTIONS, exceptions);
  const base = r.commit('base');
  r.git('checkout', '-q', '-b', 'feature');
  return { ...r, base };
}

const guard = (r, extra = {}) => runGuard({ base: 'main', head: 'HEAD', cwd: r.dir, ...extra });

// ---------------------------------------------------------------- existing rules

test('no base commit (new branch) is a pass', (t) => {
  const r = seed(t);
  assert.equal(guard(r, { base: '0000000000000000000000000000000000000000' }).ok, true);
  assert.equal(guard(r, { base: '' }).ok, true);
});

test('untouched applied migrations pass, and a later new migration passes', (t) => {
  const r = seed(t);
  r.write(DIR + '20261002000000_asha_more.sql', 'select 1;\n');
  r.commit('add later migration');
  const out = guard(r);
  assert.deepEqual(out.errors, []);
  assert.equal(out.ok, true);
});

test('editing an applied migration fails', (t) => {
  const r = seed(t);
  r.write(DIR + M2, 'alter table asha_letters disable row level security;\n');
  r.commit('edit applied');
  const out = guard(r);
  assert.equal(out.ok, false);
  assert.match(out.errors.join('\n'), new RegExp(`${M2}: edited, but it has been applied`));
});

test('deleting an applied migration fails (and the manifest then points at nothing)', (t) => {
  const r = seed(t);
  r.remove(DIR + M1);
  r.commit('delete applied');
  const msg = guard(r).errors.join('\n');
  assert.match(msg, new RegExp(`${M1}: deleted or renamed`));
  assert.match(msg, new RegExp(`${M1}: listed in .* but missing`));
});

test('renaming an applied migration fails', (t) => {
  const r = seed(t);
  renameSync(join(r.dir, DIR + M1), join(r.dir, DIR + '20261005000000_asha_core.sql'));
  r.commit('rename applied');
  assert.match(guard(r).errors.join('\n'), new RegExp(`${M1}: deleted or renamed`));
});

test('removing a line from the applied list fails', (t) => {
  const r = seed(t);
  r.write(MANIFEST, `${M1}\n`);
  r.commit('drop manifest line');
  assert.match(guard(r).errors.join('\n'), new RegExp(`${M2}: removed from`));
});

test('a new migration that sorts before the newest applied one fails', (t) => {
  const r = seed(t);
  r.write(DIR + '20261000000000_asha_early.sql', 'select 1;\n');
  r.commit('early migration');
  assert.match(guard(r).errors.join('\n'), /sorts before the newest applied one/);
});

// ---------------------------------------------------------------- the single exception

test('the exception allows exactly the listed file at exactly the listed blob', (t) => {
  const r = seed(t, { exceptions: '' });
  // Write the reconciled content, take its blob, then put the entry on the base.
  const reconciled = 'alter table asha_letters enable row level security; -- as applied\n';
  r.git('checkout', '-q', 'main');
  r.write(EXCEPTIONS, '');
  const tmp = join(r.dir, 'reconciled.tmp');
  writeFileSync(tmp, reconciled);
  const sha = r.git('hash-object', tmp);
  rmSync(tmp);
  r.write(EXCEPTIONS, `# reviewed\n${M2}@${sha}\n`);
  r.commit('reviewed exception on base');
  r.git('checkout', '-q', 'feature');
  r.git('merge', '-q', 'main');
  r.write(DIR + M2, reconciled);
  r.commit('reconcile M2 with what was applied');
  const out = guard(r);
  assert.deepEqual(out.errors, []);
  assert.match(out.notes.join('\n'), /allowed by the reviewed exception/);

  // Any further edit of the same file fails again, with a hint.
  r.write(DIR + M2, reconciled + '-- one more line\n');
  r.commit('edit again');
  const again = guard(r);
  assert.equal(again.ok, false);
  assert.match(again.errors.join('\n'), /only covers blob/);
});

function withBaseException(t, file, content) {
  const tmp = mkdtempSync(join(tmpdir(), 'blob-'));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  writeFileSync(join(tmp, 'f'), content);
  const sha = execFileSync('git', ['hash-object', join(tmp, 'f')], { encoding: 'utf8' }).trim();
  return { sha, r: seed(t, { exceptions: `${file}@${sha}\n` }) };
}

test('the exception does not cover deleting the file', (t) => {
  const { r } = withBaseException(t, M2, 'whatever\n');
  r.remove(DIR + M2);
  r.write(MANIFEST, `${M1}\n${M2}\n`);
  r.commit('delete excepted file');
  assert.match(guard(r).errors.join('\n'), new RegExp(`${M2}: deleted or renamed`));
});

test('the exception does not cover other applied files', (t) => {
  const content = 'create table asha_letters (id uuid primary key, kind text);\n';
  const { r } = withBaseException(t, M2, content);
  r.write(DIR + M1, content); // same bytes, but M1 has no exception
  r.commit('edit M1');
  assert.match(guard(r).errors.join('\n'), new RegExp(`${M1}: edited`));
});

test('malformed or duplicate exception lines fail', () => {
  const sha = 'a'.repeat(40);
  assert.equal(parseExceptions(`${M2}@${sha}\n# note\n`).errors.length, 0);
  assert.equal(parseExceptions(`${M2}@${sha}`).entries.get(M2), sha);
  assert.match(parseExceptions(`${M2}\n`).errors[0], /malformed/);
  assert.match(parseExceptions(`${M2}@${sha.slice(1)}\n`).errors[0], /malformed/);
  assert.match(parseExceptions(`*@${sha}\n`).errors[0], /malformed/);
  assert.match(parseExceptions(`${M2}@${sha}\n${M2}@${'b'.repeat(40)}\n`).errors[0], /more than once/);
});

// ---------------------------------------------------------------- base-ref execution

test('a pull request cannot grant itself an exception: the list is read from the base', (t) => {
  const r = seed(t, { exceptions: '' });
  r.write(DIR + M2, 'alter table asha_letters disable row level security;\n');
  r.write(EXCEPTIONS, `${M2}@${r.blob(DIR + M2)}\n`);
  r.commit('edit applied and add own exception');
  const out = guard(r);
  assert.equal(out.trusted, 'main');
  assert.equal(out.ok, false);
  assert.match(out.errors.join('\n'), new RegExp(`${M2}: edited`));
});

test('a pull request cannot remove a base exception to break the gate for others', (t) => {
  const content = 'alter table asha_letters enable row level security; -- applied\n';
  const { r } = withBaseException(t, M2, content);
  r.write(DIR + M2, content);
  r.write(EXCEPTIONS, '# emptied by the PR\n');
  r.commit('reconcile and empty list in head');
  assert.equal(guard(r).ok, true); // base list still applies
});

test('trusted ref: base when it has the guard, else the fallback, else head (bootstrap)', (t) => {
  const r = seed(t, { withScript: false });
  // develop-like fallback branch that has the guard
  r.git('checkout', '-q', '-b', 'develop', 'main');
  r.write(SCRIPT, GUARD_SOURCE);
  r.commit('guard on develop');
  r.git('checkout', '-q', 'feature');
  assert.deepEqual(resolveTrustedRef({ base: 'main', head: 'HEAD', fallback: 'develop', cwd: r.dir }), {
    ref: 'develop',
    bootstrap: false,
  });
  assert.deepEqual(resolveTrustedRef({ base: 'main', head: 'HEAD', cwd: r.dir }), { ref: 'HEAD', bootstrap: true });
  assert.deepEqual(resolveTrustedRef({ base: 'develop', head: 'HEAD', fallback: 'main', cwd: r.dir }), {
    ref: 'develop',
    bootstrap: false,
  });
  const out = guard(r);
  assert.equal(out.trusted, 'HEAD');
  assert.match(out.notes.join('\n'), /bootstrap/);
});

test('release PR shape: base without the guard, exception read from the fallback branch', (t) => {
  // main predates the guard; develop carries the reconciled M2 plus the reviewed entry.
  const r = seed(t, { withScript: false });
  r.git('checkout', '-q', '-b', 'develop', 'main');
  r.write(DIR + M2, 'alter table asha_letters enable row level security; -- as applied\n');
  r.write(SCRIPT, GUARD_SOURCE);
  r.write(EXCEPTIONS, `${M2}@${r.blob(DIR + M2)}\n`);
  r.commit('develop');
  const out = runGuard({ base: 'main', head: 'develop', fallback: 'develop', cwd: r.dir });
  assert.deepEqual(out.errors, []);
  assert.equal(out.trusted, 'develop');
});

test('CLI runs from a copy outside the checkout and honours GUARD_TRUSTED_REF', (t) => {
  // This is how the workflow runs it: the script is extracted from the trusted
  // ref into a temp folder, so the pull request's copy is never executed.
  const r = seed(t, { exceptions: '' });
  r.write(DIR + M2, 'alter table asha_letters disable row level security;\n');
  r.write(EXCEPTIONS, `${M2}@${r.blob(DIR + M2)}\n`);
  r.write(SCRIPT, '// weakened by the pull request\nprocess.exit(0);\n');
  r.commit('weaken guard, edit applied');
  const outside = mkdtempSync(join(tmpdir(), 'guard-bin-'));
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  writeFileSync(join(outside, 'migration-guard.mjs'), r.git('show', `main:${SCRIPT}`) + '\n');
  const run = spawnSync(process.execPath, [join(outside, 'migration-guard.mjs'), 'main', 'HEAD'], {
    cwd: r.dir,
    encoding: 'utf8',
    env: { ...process.env, GUARD_TRUSTED_REF: 'main' },
  });
  assert.equal(run.status, 1, run.stdout + run.stderr);
  assert.match(run.stderr, new RegExp(`${M2}: edited`));
});
