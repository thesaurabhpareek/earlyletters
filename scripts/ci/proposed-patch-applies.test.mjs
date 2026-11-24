// BL-2133 (from BL-409; LEGAL-REQ-051): the proposed accessibility-evidence workflow patch still applies to the
// tracked tree, and the check fails on a patch edited to touch a missing path.
// Run: node --test scripts/ci/proposed-patch-applies.test.mjs
//
// The patches are read as data (scripts/ci/proposed-patch-applies.mjs): no `git apply`, no worktree, nothing from a
// patch is run. To guard another proposal, add its path to GUARDED once `git apply --check` passes for it on develop.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, checkPatch, checkPatchFile, parsePatch, trackedTree } from './proposed-patch-applies.mjs';

const A11Y = 'docs/ops/proposed/workflows/a11y-evidence.patch';
const GUARDED = [A11Y];

/** An in-memory tree for the pure checks: { path: content }. */
const memTree = (files) => ({ exists: (p) => Object.hasOwn(files, p), read: (p) => files[p] });
const check = (patch, files) => checkPatch(parsePatch(patch), memTree(files));

const MODIFY = [
  'diff --git a/w.yml b/w.yml',
  'index 1111111..2222222 100644',
  '--- a/w.yml',
  '+++ b/w.yml',
  '@@ -2,3 +2,3 @@',
  ' b',
  '-c',
  '+C',
  ' d',
  '',
].join('\n');

for (const p of GUARDED) {
  test(`[BL-2133] ${p} applies to the tracked tree (context matches, created files do not exist)`, () => {
    const { files, problems } = checkPatchFile(p);
    assert.ok(files.length > 0, 'the patch has at least one file diff');
    assert.deepEqual(problems, [], `the proposal has rotted; refresh it:\n${problems.join('\n')}`);
  });
}

test('[BL-2133] the a11y patch creates exactly .github/workflows/a11y-evidence.yml and nothing else', () => {
  const files = parsePatch(fs.readFileSync(path.join(REPO_ROOT, A11Y), 'utf8'));
  assert.deepEqual(files.map((f) => [f.kind, f.newPath]), [['create', '.github/workflows/a11y-evidence.yml']]);
});

test('[BL-2133] every third-party action in the a11y patch is pinned to a full 40-character commit sha', () => {
  const text = fs.readFileSync(path.join(REPO_ROOT, A11Y), 'utf8');
  const uses = [...text.matchAll(/^\+\s*-?\s*uses:\s*(\S+)/gm)].map((m) => m[1]);
  assert.ok(uses.length >= 3, 'checkout, setup-node and upload-artifact are present');
  for (const u of uses) assert.match(u, /^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/, `${u} is not pinned to a commit sha`);
});

test('[BL-2133] the doc opens with the exact apply command for this patch', () => {
  const doc = fs.readFileSync(path.join(REPO_ROOT, 'docs/ops/proposed/ax5-evidence.md'), 'utf8');
  const top = doc.split('\n').slice(0, 12).join('\n');
  assert.ok(top.includes(`git apply --check ${A11Y} && git apply ${A11Y}`), 'apply command near the top');
});

test('[BL-2133] the check fails on the a11y patch edited to change a path that does not exist', () => {
  const text = fs.readFileSync(path.join(REPO_ROOT, A11Y), 'utf8');
  const missing = '.github/workflows/no-such-workflow-bl2133.yml';
  // Turn the creation into an edit of a missing file: drop the new-file header, point both sides at the missing path.
  const edited = text
    .replace('new file mode 100644\n', '')
    .replace('--- /dev/null', `--- a/${missing}`)
    .replaceAll('.github/workflows/a11y-evidence.yml', missing)
    .replace(/^@@ -0,0 \+1,(\d+) @@/m, '@@ -1,0 +1,$1 @@');
  const files = parsePatch(edited);
  const tree = trackedTree(files.flatMap((f) => [f.oldPath, f.newPath]));
  try {
    const problems = checkPatch(files, tree);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /no-such-workflow-bl2133\.yml: the patch changes it, but it does not exist/);
  } finally {
    tree.dispose();
  }
});

test('[BL-2133] the check fails when a patch creates a file that already exists in the tracked tree', () => {
  const text = fs.readFileSync(path.join(REPO_ROOT, A11Y), 'utf8');
  const files = parsePatch(text.replaceAll('.github/workflows/a11y-evidence.yml', '.github/workflows/ci.yml'));
  const tree = trackedTree(files.flatMap((f) => [f.oldPath, f.newPath]));
  try {
    assert.deepEqual(checkPatch(files, tree), ['.github/workflows/ci.yml: the patch creates it, but it already exists']);
  } finally {
    tree.dispose();
  }
});

test('[BL-2133] positive control: an edit of a real tracked file with true context passes, a stale one fails', () => {
  const rel = '.github/workflows/ci.yml';
  const tree = trackedTree([rel]);
  try {
    const real = tree.read(rel).split('\n');
    const hunk = (ctx) => [
      `diff --git a/${rel} b/${rel}`, `--- a/${rel}`, `+++ b/${rel}`, '@@ -1,2 +1,3 @@', ` ${ctx[0]}`, '+# added', ` ${ctx[1]}`, '',
    ].join('\n');
    assert.deepEqual(checkPatch(parsePatch(hunk([real[0], real[1]])), tree), []);
    const stale = checkPatch(parsePatch(hunk([real[0], `${real[1]} (changed since)`])), tree);
    assert.equal(stale.length, 1);
    assert.match(stale[0], /hunk at line 1 does not match/);
  } finally {
    tree.dispose();
  }
});

test('[BL-2133] parser: a modify hunk matches at its line and at an offset, and not when context changed', () => {
  assert.deepEqual(check(MODIFY, { 'w.yml': 'a\nb\nc\nd\ne\n' }), []);
  assert.deepEqual(check(MODIFY, { 'w.yml': 'x\ny\na\nb\nc\nd\n' }), [], 'offset of two lines is fine');
  assert.match(check(MODIFY, { 'w.yml': 'a\nb\nCHANGED\nd\n' })[0], /hunk at line 2 does not match/);
});

test('[BL-2133] parser: plain unified diffs without a diff --git line are read file by file', () => {
  const plain = MODIFY.split('\n').slice(2).join('\n');
  const files = parsePatch(plain);
  assert.deepEqual(files.map((f) => [f.kind, f.oldPath]), [['modify', 'w.yml']]);
  assert.deepEqual(checkPatch(files, memTree({ 'w.yml': 'a\nb\nc\nd\n' })), []);
});

test('[BL-2133] parser: deletes and renames check the old file', () => {
  const del = ['diff --git a/old.yml b/old.yml', 'deleted file mode 100644', '--- a/old.yml', '+++ /dev/null', '@@ -1,2 +0,0 @@', '-x', '-y', ''].join('\n');
  assert.deepEqual(check(del, { 'old.yml': 'x\ny\n' }), []);
  assert.match(check(del, { 'old.yml': 'x\nz\n' })[0], /content no longer matches/);
  assert.match(check(del, {})[0], /deletes it, but it does not exist/);
  const ren = ['diff --git a/a.yml b/b.yml', 'similarity index 100%', 'rename from a.yml', 'rename to b.yml', ''].join('\n');
  assert.deepEqual(check(ren, { 'a.yml': 'q\n' }), []);
  assert.match(check(ren, { 'a.yml': 'q\n', 'b.yml': 'r\n' })[0], /renames onto it, but it already exists/);
});

test('[BL-2133] parser: refuses what it cannot read rather than guessing', () => {
  assert.throws(() => parsePatch('just words\n'), /no file diffs/);
  assert.throws(() => parsePatch(MODIFY.replace('@@ -2,3 +2,3 @@', '@@ -2,4 +2,3 @@')), /old and .* new lines/);
  assert.throws(() => parsePatch('diff --git a/x b/x\nGIT binary patch\n'), /binary patch not supported/);
});

test('[BL-2133] paths that leave the repo are a problem, not a write', () => {
  const evil = MODIFY.replaceAll('w.yml', '../w.yml');
  assert.match(check(evil, { '../w.yml': 'a\nb\nc\nd\n' })[0], /leaves the repo or is malformed/);
});
