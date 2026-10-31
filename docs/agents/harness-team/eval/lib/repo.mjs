// Worktrees, installs, diffs and edits for one task run.
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { git, gitOk, sh } from './util.mjs';

/** A fresh detached worktree at `sha`. */
export function makeWorktree(repo, sha, label) {
  const root = process.env.EVAL_WORK_DIR || join(tmpdir(), 'scribe-eval');
  mkdirSync(root, { recursive: true });
  const dir = mkdtempSync(join(root, `${label}-`));
  const r = git(['-C', repo, 'worktree', 'add', '--detach', '--force', dir, sha]);
  if (r.code !== 0) throw new Error(`worktree add ${sha} failed: ${r.stderr.trim()}`);
  return dir;
}

export function removeWorktree(repo, dir) {
  git(['-C', repo, 'worktree', 'remove', '--force', dir]);
}

/** Find-and-replace edits; each `find` must occur exactly once. */
export function applyEdits(wt, edits) {
  for (const e of edits) {
    const p = join(wt, e.file);
    const text = readFileSync(p, 'utf8');
    const n = text.split(e.find).length - 1;
    if (n !== 1) throw new Error(`edit on ${e.file}: expected 1 match, found ${n}`);
    writeFileSync(p, text.replace(e.find, () => e.replace));
  }
}

/** Apply the task's setup edits and commit them, so the agent's diff is measured from the set-up state. */
export function setup(wt, task) {
  if (!task.setup?.length) return;
  applyEdits(wt, task.setup);
  gitOk(['-C', wt, 'add', '-A']);
  gitOk(['-C', wt, '-c', 'user.name=eval', '-c', 'user.email=eval@invalid', 'commit', '-q', '--no-verify', '-m', `eval setup ${task.id}`]);
}

const nodeModuleDirs = (dir) =>
  sh(`find . -path ./.git -prune -o -type d -name node_modules -prune -print`, { cwd: dir }).stdout.split('\n').filter(Boolean);

/**
 * Install dependencies. EVAL_INSTALL=ci runs `npm ci --ignore-scripts` in every worktree (slow, exact).
 * EVAL_INSTALL=link (default) installs once per lockfile hash into a cache and copies node_modules in with
 * hard links (Linux) or clones (macOS APFS), falling back to a plain copy. Workspace symlinks are relative,
 * so they resolve inside the new worktree.
 */
export function install(wt, log) {
  const mode = process.env.EVAL_INSTALL || 'link';
  if (mode === 'none') return { mode, ms: 0 };
  const ci = () => sh('npm ci --ignore-scripts --no-audit --no-fund', { cwd: wt, timeoutMs: 900_000 });
  if (mode === 'ci') {
    const r = ci();
    if (r.code !== 0) throw new Error(`npm ci failed: ${r.stderr.slice(-800)}`);
    return { mode, ms: r.ms };
  }
  const lock = readFileSync(join(wt, 'package-lock.json'));
  const key = createHash('sha256').update(lock).digest('hex').slice(0, 16);
  const cache = join(process.env.EVAL_CACHE_DIR || join(tmpdir(), 'scribe-eval-cache'), key);
  const t0 = Date.now();
  if (!existsSync(join(cache, '.complete'))) {
    log?.(`  installing for lockfile ${key} (first use)`);
    const r = ci();
    if (r.code !== 0) throw new Error(`npm ci failed: ${r.stderr.slice(-800)}`);
    mkdirSync(cache, { recursive: true });
    for (const d of nodeModuleDirs(wt)) copyTree(join(wt, d), join(cache, d));
    writeFileSync(join(cache, '.complete'), new Date().toISOString());
    return { mode: 'link:fresh', ms: Date.now() - t0 };
  }
  for (const d of nodeModuleDirs(cache)) copyTree(join(cache, d), join(wt, d));
  return { mode: 'link:cached', ms: Date.now() - t0 };
}

function copyTree(from, to) {
  mkdirSync(dirname(to), { recursive: true });
  for (const cmd of [`cp -al "${from}" "${to}"`, `cp -cR "${from}" "${to}"`]) {
    if (sh(cmd).code === 0) return;
    sh(`rm -rf "${to}"`);
  }
  cpSync(from, to, { recursive: true, verbatimSymlinks: true });
}

/** Everything the agent changed relative to HEAD (base or setup commit), including new files. */
export function captureDiff(wt) {
  gitOk(['-C', wt, 'add', '-A']);
  const status = gitOk(['-C', wt, 'diff', '--cached', '--name-status', '--no-renames', 'HEAD']);
  const files = status.split('\n').filter(Boolean).map((l) => {
    const [st, ...rest] = l.split('\t');
    return { status: st, path: rest.join('\t') };
  });
  const patch = gitOk(['-C', wt, 'diff', '--cached', '--no-renames', '-U0', 'HEAD']);
  const added = {};
  const removed = {};
  let cur = null;
  for (const line of patch.split('\n')) {
    if (line.startsWith('+++ ')) { cur = line.slice(4).replace(/^b\//, ''); continue; }
    if (line.startsWith('--- ')) continue;
    if (!cur) continue;
    if (line.startsWith('+')) (added[cur] ||= []).push(line.slice(1));
    else if (line.startsWith('-')) (removed[cur] ||= []).push(line.slice(1));
  }
  const fullPatch = gitOk(['-C', wt, 'diff', '--cached', '--no-renames', 'HEAD']);
  gitOk(['-C', wt, 'reset', '-q']);
  const nAdded = Object.values(added).reduce((a, l) => a + l.length, 0);
  const nRemoved = Object.values(removed).reduce((a, l) => a + l.length, 0);
  return { files, added, removed, nAdded, nRemoved, patch: fullPatch };
}

/** The task's known-good change: the real PR's diff, or the task folder's reference edits and files. */
export function applyReference(repo, wt, task, taskDir) {
  if (task.ref) {
    const args = ['-C', repo, 'diff', '--binary', task.base, task.ref];
    if (task.ref_paths) args.push('--', ...task.ref_paths);
    const patch = gitOk(args);
    const r = git(['-C', wt, 'apply', '--whitespace=nowarn', '-'], { input: patch });
    if (r.code !== 0) throw new Error(`reference patch did not apply: ${r.stderr.trim()}`);
  }
  if (task.reference_edits) applyEdits(wt, task.reference_edits);
  for (const [src, dest] of Object.entries(task.reference_files || {})) {
    mkdirSync(dirname(join(wt, dest)), { recursive: true });
    writeFileSync(join(wt, dest), readFileSync(join(taskDir, src)));
  }
}

/** Files the grader adds after the agent's diff is captured: tests from the real PR, or from the task folder. */
export function placeHidden(repo, wt, task, taskDir) {
  for (const p of task.hidden_from_ref || []) {
    const content = git(['-C', repo, 'show', `${task.ref}:${p}`]);
    if (content.code !== 0) throw new Error(`hidden file ${p} not at ${task.ref}`);
    mkdirSync(dirname(join(wt, p)), { recursive: true });
    writeFileSync(join(wt, p), content.stdout);
  }
  for (const [src, dest] of Object.entries(task.hidden_from_task || {})) {
    mkdirSync(dirname(join(wt, dest)), { recursive: true });
    writeFileSync(join(wt, dest), readFileSync(join(taskDir, src)));
  }
}

export const rel = (wt, p) => relative(wt, p);
