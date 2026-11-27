// BL-2133 (from BL-409; LEGAL-REQ-051): the proposed accessibility-evidence workflow patch still applies to the
// tracked tree, and the check fails on a patch edited to touch a missing path.
// Run: node --test scripts/ci/proposed-patch-applies.test.mjs
//
// The patches are read as data (scripts/ci/proposed-patch-applies.mjs): no `git apply`, no worktree, nothing from a
// patch is run. Every `.patch` in docs/ops/proposed/workflows/ is guarded, so a proposal cannot rot unseen: the commit
// that applies one (or finds it applied) deletes the patch and marks its doc applied (docs/ops/proposed/workflows-retired.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { REPO_ROOT, checkPatch, checkPatchFile, parsePatch, trackedTree } from './proposed-patch-applies.mjs';

const A11Y = 'docs/ops/proposed/workflows/a11y-evidence.patch';
const TESTFLIGHT = 'docs/ops/proposed/workflows/testflight-checks-job.patch';
const WORKFLOW_PROPOSALS = 'docs/ops/proposed/workflows';
const GUARDED = fs.readdirSync(path.join(REPO_ROOT, WORKFLOW_PROPOSALS)).filter((n) => n.endsWith('.patch')).sort().map((n) => `${WORKFLOW_PROPOSALS}/${n}`);

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
    assert.deepEqual(problems, [], `the proposal no longer applies. If it was applied, delete the patch and mark its doc applied in the same commit (docs/ops/proposed/workflows-retired.md); otherwise refresh it against develop:\n${problems.join('\n')}`);
  });
}

test('[BL-2133] every workflow proposal patch is guarded, and the a11y patch is one of them', () => {
  assert.ok(GUARDED.includes(A11Y));
  assert.ok(GUARDED.includes(TESTFLIGHT), 'the testflight checks-job proposal (CR-233) is guarded');
  assert.ok(GUARDED.length >= 2, `found ${GUARDED.length} patches; the folder listing failed or the patches are gone`);
});

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

test('[BL-2133] parser: git apply anchors, a hunk at line 1 matches only at the top, one with no trailing context only at the end', () => {
  const file = { 'w.yml': 'a\nb\nc\nd\ne\nf\n' };
  const top = ['--- a/w.yml', '+++ b/w.yml', '@@ -1,2 +1,3 @@', ' c', '+X', ' d', ''].join('\n');
  assert.match(check(top, file)[0], /hunk at line 1 does not match/, 'context found lower down is not the top');
  const notEnd = ['--- a/w.yml', '+++ b/w.yml', '@@ -2,2 +2,2 @@', ' b', '-c', '+C', ''].join('\n');
  assert.match(check(notEnd, file)[0], /hunk at line 2 does not match/, 'no trailing context must sit at the end');
  const atEnd = ['--- a/w.yml', '+++ b/w.yml', '@@ -5,2 +5,2 @@', ' e', '-f', '+F', ''].join('\n');
  assert.deepEqual(check(atEnd, file), []);
});

test('[BL-2133] parser: the final newline must agree with the "No newline at end of file" marker', () => {
  const noNl = { 'n.yml': 'a\nb\nc' };
  const withNl = { 'n.yml': 'a\nb\nc\n' };
  const marked = ['--- a/n.yml', '+++ b/n.yml', '@@ -2,2 +2,2 @@', ' b', '-c', '\\ No newline at end of file', '+C', '\\ No newline at end of file', ''].join('\n');
  const unmarked = ['--- a/n.yml', '+++ b/n.yml', '@@ -2,2 +2,2 @@', ' b', '-c', '+C', ''].join('\n');
  assert.deepEqual(check(marked, noNl), []);
  assert.match(check(marked, withNl)[0], /does not match/);
  assert.deepEqual(check(unmarked, withNl), []);
  assert.match(check(unmarked, noNl)[0], /does not match/);
});

test('[BL-2133] parser: hunks must come in file order, and a short hunk header is an error, not a skipped line', () => {
  const file = { 'w.yml': 'a\nb\nc\nd\ne\nf\n' };
  const h1 = ['@@ -1,2 +1,2 @@', '-a', '+A', ' b'];
  const h2 = ['@@ -4,3 +4,3 @@', ' d', '-e', '+E', ' f'];
  const head = ['--- a/w.yml', '+++ b/w.yml'];
  assert.deepEqual(check([...head, ...h1, ...h2, ''].join('\n'), file), []);
  assert.equal(check([...head, ...h2, ...h1, ''].join('\n'), file).length, 1, 'out of order fails closed');
  assert.throws(() => parsePatch([...head, '@@ -4,2 +4,2 @@', ' d', '-e', '+E', ' f', ''].join('\n')), /outside any hunk/);
});

test('[BL-2133] every bad file in a patch is reported, not only the first', () => {
  const two = [
    'diff --git a/../x b/../x', '--- a/../x', '+++ b/../x', '@@ -1 +1 @@', '-a', '+b',
    'diff --git a/gone.yml b/gone.yml', '--- a/gone.yml', '+++ b/gone.yml', '@@ -1 +1 @@', '-a', '+b', '',
  ].join('\n');
  const problems = check(two, {});
  assert.equal(problems.length, 2);
  assert.match(problems[0], /leaves the repo/);
  assert.match(problems[1], /gone\.yml: the patch changes it, but it does not exist/);
});

test('[BL-2133] unsafe paths never reach git: the tracked tree treats them as absent', () => {
  const tree = trackedTree(['../outside.yml', '/etc/passwd', '--output=x', 'package.json']);
  try {
    assert.equal(tree.exists('../outside.yml'), false);
    assert.equal(tree.exists('/etc/passwd'), false);
    assert.equal(tree.exists('package.json'), true);
  } finally {
    tree.dispose();
  }
});

test('[BL-2133] cases where git refuses and a loose check would not: delete newline, mid-hunk marker, copy target, .git', () => {
  const del = ['diff --git a/d.yml b/d.yml', 'deleted file mode 100644', '--- a/d.yml', '+++ /dev/null', '@@ -1,2 +0,0 @@', '-x', '-y', ''].join('\n');
  assert.match(check(del, { 'd.yml': 'x\ny' })[0], /content no longer matches/, 'file lost its final newline');
  const delNoNl = del.replace('-y\n', '-y\n\\ No newline at end of file\n');
  assert.deepEqual(check(delNoNl, { 'd.yml': 'x\ny' }), []);
  assert.match(check(delNoNl, { 'd.yml': 'x\ny\n' })[0], /content no longer matches/, 'an editor added a final newline');
  const mid = ['--- a/m.yml', '+++ b/m.yml', '@@ -1,3 +1,3 @@', ' a', '\\ No newline at end of file', '-b', '+B', ' c', ''].join('\n');
  assert.throws(() => parsePatch(mid), /in the middle of a hunk/);
  const onRemoved = ['--- a/m.yml', '+++ b/m.yml', '@@ -1,2 +1,2 @@', ' a', '-b', '\\ No newline at end of file', '+B', ''].join('\n');
  assert.deepEqual(check(onRemoved, { 'm.yml': 'a\nb' }), [], 'a marker on the last removed line before added lines is fine');
  const copy = ['diff --git a/a.yml b/b.yml', 'similarity index 100%', 'copy from a.yml', 'copy to b.yml', ''].join('\n');
  assert.deepEqual(check(copy, { 'a.yml': 'q\n' }), []);
  assert.match(check(copy, { 'a.yml': 'q\n', 'b.yml': 'r\n' })[0], /copies onto it, but it already exists/);
  const dotGit = MODIFY.replaceAll('w.yml', '.GIT/config');
  assert.match(check(dotGit, { '.GIT/config': 'a\nb\nc\nd\n' })[0], /leaves the repo or is malformed/);
});

test('[BL-2133] a hunk whose stated line is far past the end still finds its context, and an empty file takes an insert', () => {
  const far = MODIFY.replace('@@ -2,3 +2,3 @@', '@@ -40,3 +40,3 @@');
  assert.deepEqual(check(far, { 'w.yml': 'a\nb\nc\nd\n' }), []);
  const insert = ['--- a/e.yml', '+++ b/e.yml', '@@ -0,0 +1 @@', '+x', ''].join('\n');
  assert.deepEqual(check(insert, { 'e.yml': '' }), []);
});

test('[BL-2133] git pathspec magic in a patch path is read literally, never as a pattern', () => {
  const tree = trackedTree([':(glob)*', ':(top)package.json', '*.json']);
  try {
    assert.equal(tree.exists('package.json'), false, 'no pattern matched a real file');
    assert.equal(fs.readdirSync(tree.dir).length, 0, 'nothing was extracted');
  } finally {
    tree.dispose();
  }
});

test('[BL-2133] the temp dir is removed when the extract fails', () => {
  const before = new Set(fs.readdirSync(os.tmpdir()).filter((n) => n.startsWith('proposed-patch-')));
  assert.throws(() => trackedTree(['package.json'], 'HEAD', 'no-such-tar-bl2133'), /tar failed/);
  const after = fs.readdirSync(os.tmpdir()).filter((n) => n.startsWith('proposed-patch-') && !before.has(n));
  assert.deepEqual(after, []);
});
