// Proposed workflow patches stay applicable while they wait (BL-2133, from BL-409; LEGAL-REQ-051).
//
// A workflow change is a proposal under docs/ops/proposed/ until someone with an account that can write .github/ applies
// it (CR-22, D-124; agent sessions cannot). A patch that nobody
// applies for a week quietly stops applying, and the first person to find out is the one who tries. This module is the
// check that finds out first.
//
// Invariant: the patch is data. We parse its text with a small pure parser and compare it with the tracked tree read
// through `git ls-tree` and `git archive` (HEAD, extracted under the OS temp dir). We never run `git apply`, never touch
// a worktree, and never execute anything the patch contains. Failure mode it stops: a patch that creates a file that now
// exists, edits a file that is gone, or carries context lines that no longer match, sitting "ready to apply" for months.
//
// Run by hand: node scripts/ci/proposed-patch-applies.mjs <patch> [<patch> ...]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const HUNK = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

/** Strip the a/ or b/ prefix from a ---/+++ or diff --git path. /dev/null stays null. */
function stripSide(p, side) {
  if (p === '/dev/null') return null;
  if (p.startsWith('"')) throw new Error(`quoted path not supported: ${p}`);
  const tab = p.indexOf('\t');
  const clean = tab >= 0 ? p.slice(0, tab) : p;
  if (!clean.startsWith(`${side}/`)) throw new Error(`path without the ${side}/ prefix: ${p}`);
  return clean.slice(2);
}

/**
 * Parse a git-format patch into files and hunks. Throws on anything it does not understand (binary patches, quoted
 * paths, a hunk whose line counts disagree with its header), because a check that guesses is a check that passes.
 */
export function parsePatch(text) {
  const lines = text.split('\n');
  if (lines.length && lines[lines.length - 1] === '') lines.pop();
  const files = [];
  let cur = null;
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('diff --git ')) {
      cur = { oldPath: null, newPath: null, kind: 'modify', hunks: [] };
      const m = /^diff --git a\/(\S+) b\/(\S+)$/.exec(line);
      if (!m) throw new Error(`cannot read diff header: ${line}`);
      cur.oldPath = m[1];
      cur.newPath = m[2];
      files.push(cur);
      i++;
      continue;
    }
    // A plain unified diff (no `diff --git` line) starts each file at its `--- ` line.
    if (line.startsWith('--- ') && lines[i + 1]?.startsWith('+++ ') && (!cur || cur.hunks.length > 0)) {
      const oldP = stripSide(line.slice(4), 'a');
      const newP = stripSide(lines[i + 1].slice(4), 'b');
      cur = { oldPath: oldP, newPath: newP, kind: oldP === null ? 'create' : newP === null ? 'delete' : 'modify', hunks: [] };
      files.push(cur);
      i += 2;
      continue;
    }
    if (!cur) {
      i++; // preamble (a mail header or a comment) before the first diff
      continue;
    }
    if (line.startsWith('new file mode')) cur.kind = 'create';
    else if (line.startsWith('deleted file mode')) cur.kind = 'delete';
    else if (line.startsWith('rename from ')) { cur.kind = 'rename'; cur.oldPath = line.slice(12); }
    else if (line.startsWith('rename to ')) cur.newPath = line.slice(10);
    else if (line.startsWith('copy from ')) { cur.kind = 'copy'; cur.oldPath = line.slice(10); }
    else if (line.startsWith('copy to ')) cur.newPath = line.slice(8);
    else if (line.startsWith('GIT binary patch') || line.startsWith('Binary files ')) throw new Error(`binary patch not supported: ${cur.newPath}`);
    else if (line.startsWith('--- ')) {
      const p = stripSide(line.slice(4), 'a');
      if (p === null && cur.kind !== 'create') throw new Error(`--- /dev/null on a file not marked new: ${cur.newPath}`);
      if (p !== null) cur.oldPath = p;
    } else if (line.startsWith('+++ ')) {
      const p = stripSide(line.slice(4), 'b');
      if (p === null && cur.kind !== 'delete') throw new Error(`+++ /dev/null on a file not marked deleted: ${cur.oldPath}`);
      if (p !== null) cur.newPath = p;
    } else if (line.startsWith('@@')) {
      const m = HUNK.exec(line);
      if (!m) throw new Error(`cannot read hunk header: ${line}`);
      const hunk = {
        oldStart: Number(m[1]), oldCount: m[2] === undefined ? 1 : Number(m[2]),
        newStart: Number(m[3]), newCount: m[4] === undefined ? 1 : Number(m[4]),
        lines: [], oldNoNewline: false, newNoNewline: false,
      };
      i++;
      let seenOld = 0;
      let seenNew = 0;
      while (i < lines.length && (seenOld < hunk.oldCount || seenNew < hunk.newCount || lines[i].startsWith('\\'))) {
        const l = lines[i];
        if (l.startsWith('\\')) {
          const prev = hunk.lines[hunk.lines.length - 1];
          if (!prev) throw new Error(`"\\ No newline" with no line before it in ${cur.newPath}`);
          // git takes the marker only on the last line of a side: the end of the hunk, or a removed line with only added
          // lines after it. Anywhere else the patch is corrupt.
          const remainingOld = hunk.oldCount - seenOld;
          const remainingNew = hunk.newCount - seenNew;
          const lastOfSide = (remainingOld === 0 && remainingNew === 0) || (prev.op === '-' && remainingOld === 0);
          if (!lastOfSide) throw new Error(`"\\ No newline" in the middle of a hunk in ${cur.newPath ?? cur.oldPath}`);
          if (prev.op !== '+') hunk.oldNoNewline = true;
          if (prev.op !== '-') hunk.newNoNewline = true;
          i++;
          continue;
        }
        const op = l[0];
        if (op !== ' ' && op !== '-' && op !== '+') break;
        hunk.lines.push({ op, text: l.slice(1) });
        if (op !== '+') seenOld++;
        if (op !== '-') seenNew++;
        i++;
      }
      if (seenOld !== hunk.oldCount || seenNew !== hunk.newCount) {
        throw new Error(`hunk ${line} in ${cur.newPath ?? cur.oldPath} has ${seenOld} old and ${seenNew} new lines`);
      }
      cur.hunks.push(hunk);
      continue;
    }
    if (/^[ +-]/.test(line) && !line.startsWith('--- ') && !line.startsWith('+++ ')) {
      throw new Error(`diff line outside any hunk in ${cur.newPath ?? cur.oldPath}: a hunk header undercounts its lines`);
    }
    i++;
  }
  if (files.length === 0) throw new Error('no file diffs found in the patch');
  return files;
}

/** A path the patch names must stay inside the repo: relative, no `..`, no backslash, no empty segment. */
export function unsafePath(p) {
  return path.isAbsolute(p) || p.includes('\\') || p.split('/').some((s) => s === '..' || s === '' || s === '.' || s.toLowerCase() === '.git');
}

/** Split file text into lines, remembering whether it ended with a newline. */
function fileLines(text) {
  const endsWithNewline = text.endsWith('\n');
  const body = endsWithNewline ? text.slice(0, -1) : text;
  return { lines: body === '' ? [] : body.split('\n'), endsWithNewline };
}

function matchesAt(fileArr, pre, at) {
  if (at < 0 || at + pre.length > fileArr.length) return false;
  for (let k = 0; k < pre.length; k++) if (fileArr[at + k] !== pre[k]) return false;
  return true;
}

/**
 * Check parsed files against a tree: { exists(path) -> boolean, read(path) -> string }. Returns a list of problems,
 * one string each; an empty list means every path and every context line is consistent with the tree. Like `git apply`
 * without fuzz: a hunk may sit at another line (an offset) but its context must match exactly, a hunk at line 0 or 1
 * must match at the top and one with no trailing context at the end, and the final newline must agree. One deliberate
 * difference: hunks must come in file order (git accepts them out of order; no diff tool writes them that way). It is
 * meant to be stricter than `git apply --check`, never looser, and is checked against git by hand, not in the test; it
 * does not model whitespace options, mode changes or binary patches (those it refuses).
 */
export function checkPatch(files, tree) {
  const problems = [];
  const seen = new Set();
  for (const f of files) {
    const target = f.kind === 'delete' ? f.oldPath : f.newPath;
    const bad = [f.oldPath, f.newPath].filter((p) => p && unsafePath(p));
    if (bad.length) {
      for (const p of new Set(bad)) problems.push(`${p}: path leaves the repo or is malformed`);
      continue; // this file only; later files are still checked and reported
    }
    if (seen.has(target)) problems.push(`${target}: changed twice in one patch`);
    seen.add(target);

    if (f.kind === 'create') {
      if (tree.exists(f.newPath)) problems.push(`${f.newPath}: the patch creates it, but it already exists`);
      if (f.hunks.some((h) => h.oldCount !== 0 || h.lines.some((l) => l.op !== '+'))) {
        problems.push(`${f.newPath}: a new file's hunk has context or removed lines`);
      }
      continue;
    }
    if (!tree.exists(f.oldPath)) {
      problems.push(`${f.oldPath}: the patch ${f.kind === 'delete' ? 'deletes' : 'changes'} it, but it does not exist`);
      continue;
    }
    if ((f.kind === 'rename' || f.kind === 'copy') && f.newPath !== f.oldPath && tree.exists(f.newPath)) {
      problems.push(`${f.newPath}: the patch ${f.kind === 'copy' ? 'copies' : 'renames'} onto it, but it already exists`);
    }
    const { lines: fileArr, endsWithNewline } = fileLines(tree.read(f.oldPath));
    if (f.kind === 'delete') {
      const pre = f.hunks.flatMap((h) => h.lines.filter((l) => l.op !== '+').map((l) => l.text));
      const markerSaysNoNewline = f.hunks.some((h) => h.oldNoNewline);
      const newlineAgrees = fileArr.length === 0 || markerSaysNoNewline !== endsWithNewline;
      if (pre.length !== fileArr.length || !matchesAt(fileArr, pre, 0) || !newlineAgrees) {
        problems.push(`${f.oldPath}: the patch deletes it, but its content no longer matches`);
      }
      continue;
    }
    let from = 0;
    for (const h of f.hunks) {
      const pre = h.lines.filter((l) => l.op !== '+').map((l) => l.text);
      // git apply's anchors (apply.c, match_beginning and match_end): a hunk that starts at line 0 or 1 must match at
      // the top of the file, and a hunk with no trailing context line must match at its end.
      let trailing = 0;
      for (let k = h.lines.length - 1; k >= 0 && h.lines[k].op === ' '; k--) trailing++;
      const mustStart = h.oldStart <= 1;
      const mustEnd = trailing === 0;
      const fits = (at) => {
        if (at < from || !matchesAt(fileArr, pre, at)) return false;
        if (mustStart && at !== 0) return false;
        const atEnd = at + pre.length === fileArr.length;
        if (mustEnd && !atEnd) return false;
        // The last preimage line carries a newline unless the hunk says "\ No newline"; the file's last line must agree.
        if (atEnd && pre.length > 0 && h.oldNoNewline === endsWithNewline) return false;
        return true;
      };
      const want = Math.max(0, h.oldStart - 1);
      let at = -1;
      // Nearest fit to the stated line first, then outward, never before the previous hunk's end.
      for (let d = 0; d <= want + fileArr.length; d++) {
        if (fits(want - d)) { at = want - d; break; }
        if (fits(want + d)) { at = want + d; break; }
      }
      if (at < 0) {
        problems.push(`${f.oldPath}: hunk at line ${h.oldStart} does not match the file (context, removed lines, position or final newline)`);
        continue;
      }
      from = at + pre.length;
    }
  }
  return problems;
}

function git(args, opts = {}) {
  const r = spawnSync('git', ['--literal-pathspecs', ...args], { cwd: REPO_ROOT, encoding: opts.encoding ?? 'utf8', maxBuffer: 256 * 1024 * 1024, input: opts.input });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${r.stderr}`);
  return r.stdout;
}

/**
 * The tracked tree at `rev`, for the given paths only: which exist (`git ls-tree`), and their content from a
 * `git archive` extract under the OS temp dir. Call `dispose()` when done. Untracked and modified worktree files are
 * ignored on purpose: the question is whether the patch applies to what is committed.
 */
export function trackedTree(paths, rev = 'HEAD', tarCommand = 'tar') {
  // Unsafe paths never reach git; checkPatch reports them.
  const wanted = [...new Set(paths.filter((p) => p && !unsafePath(p)))];
  const existing = new Set(
    wanted.length ? git(['ls-tree', '-r', '--name-only', '-z', rev, '--', ...wanted]).split('\0').filter(Boolean) : [],
  );
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'proposed-patch-'));
  try {
    if (existing.size) {
      const tarball = git(['archive', '--format=tar', rev, '--', ...existing], { encoding: 'buffer' });
      const r = spawnSync(tarCommand, ['-x', '-f', '-', '-C', dir], { input: tarball });
      if (r.status !== 0) throw new Error(`tar failed: ${r.error?.message ?? r.stderr}`);
    }
  } catch (e) {
    fs.rmSync(dir, { recursive: true, force: true });
    throw e;
  }
  return {
    dir,
    exists: (p) => existing.has(p),
    read: (p) => fs.readFileSync(path.join(dir, p), 'utf8'),
    dispose: () => fs.rmSync(dir, { recursive: true, force: true }),
  };
}

/** Parse one patch file and check it against the tracked tree. Returns { files, problems }. */
export function checkPatchFile(patchPath, rev = 'HEAD') {
  const files = parsePatch(fs.readFileSync(path.resolve(REPO_ROOT, patchPath), 'utf8'));
  const tree = trackedTree(files.flatMap((f) => [f.oldPath, f.newPath]), rev);
  try {
    return { files, problems: checkPatch(files, tree) };
  } finally {
    tree.dispose();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const patches = process.argv.slice(2);
  if (!patches.length) {
    console.error('usage: node scripts/ci/proposed-patch-applies.mjs <patch> [<patch> ...]');
    process.exit(2);
  }
  let bad = 0;
  for (const p of patches) {
    try {
      const { problems } = checkPatchFile(p);
      if (problems.length) { bad++; console.log(`FAIL ${p}\n  ${problems.join('\n  ')}`); } else console.log(`OK   ${p}`);
    } catch (e) {
      bad++;
      console.log(`FAIL ${p}\n  ${e.message}`);
    }
  }
  process.exit(bad ? 1 : 0);
}
