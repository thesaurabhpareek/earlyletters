/**
 * Where the signing key file may live (docs/ops/PACKS_HOSTING.md, step 1).
 *
 * The key file must never be inside anything git could commit or push. A
 * text comparison of paths is not enough (review of #162): a symlinked
 * folder, a different letter case on a case-insensitive disk (macOS default,
 * Windows) or a second checkout of the repo all get past it. So the path is
 * resolved to its real location first and refused when it is inside:
 *  1. this repo's working tree, or any of its `git worktree` checkouts;
 *  2. this repo's git directory (the common dir, shared by all worktrees);
 *  3. any git working tree or git directory at all (a second clone, a
 *     dotfiles repo), asked of git itself from the file's own folder.
 * On a case-insensitive file system the comparison ignores letter case.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, parse, relative, resolve, sep } from 'node:path';

export type Git = (cwd: string, args: string[]) => string | null;

/** Runs git and returns its trimmed stdout, or null when git fails or is missing. */
export const runGit: Git = (cwd, args) => {
  try {
    return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 10_000 }).trim();
  } catch {
    return null;
  }
};

/** The real, absolute path (symlinks resolved), or the resolved path when it does not exist. */
export function realPath(p: string): string {
  try {
    return realpathSync.native(p);
  } catch {
    return resolve(p);
  }
}

function flipCase(s: string): string {
  return [...s].map((c) => (c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase())).join('');
}

/**
 * Whether the file system holding `dir` ignores letter case: the same folder
 * reached with every letter of its name flipped is the same file (inode). A
 * name with no letters says nothing, so then the platform default decides
 * (case-insensitive on macOS and Windows).
 */
export function caseInsensitiveAt(dir: string): boolean {
  const real = realPath(dir);
  const { base } = parse(real);
  const flipped = join(dirname(real), flipCase(base));
  if (flipped !== real) {
    try {
      const a = statSync(real);
      const b = statSync(flipped);
      return a.ino === b.ino && a.dev === b.dev;
    } catch {
      return false;
    }
  }
  return process.platform === 'darwin' || process.platform === 'win32';
}

/** True when `child` is `parent` or inside it. Both must be real absolute paths. */
export function isInside(child: string, parent: string, caseInsensitive: boolean): boolean {
  const c = caseInsensitive ? child.toLowerCase() : child;
  const p = caseInsensitive ? parent.toLowerCase() : parent;
  if (c === p) return true;
  const rel = relative(p, c);
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel) && !rel.split(sep).includes('..');
}

/** Every root a key file must stay out of, for the repo at `root`: its worktrees and its git common dir, real paths. */
export function protectedRoots(root: string, git: Git = runGit): string[] {
  const roots = new Set<string>([realPath(root)]);
  const list = git(root, ['worktree', 'list', '--porcelain']);
  for (const line of (list ?? '').split('\n')) if (line.startsWith('worktree ')) roots.add(realPath(line.slice('worktree '.length)));
  // --path-format needs git 2.31; older git prints the common dir relative to `root`.
  const common = git(root, ['rev-parse', '--path-format=absolute', '--git-common-dir']) ?? git(root, ['rev-parse', '--git-common-dir']);
  if (common) roots.add(realPath(isAbsolute(common) ? common : join(root, common)));
  return [...roots];
}

export interface KeyFileCheck {
  /** Why the file may not be used, or null when it may. */
  problem: string | null;
  /** The real path that was checked. */
  real: string;
}

/**
 * Checks a `--key-file` path. `root` is this repo's root. Refuses a missing
 * file, a file inside the repo or any of its checkouts or its git directory,
 * and a file inside any other git working tree or git directory.
 */
export function checkKeyFile(file: string, root: string, opts: { git?: Git; caseInsensitive?: (dir: string) => boolean } = {}): KeyFileCheck {
  const git = opts.git ?? runGit;
  const ci = opts.caseInsensitive ?? caseInsensitiveAt;
  if (!existsSync(file)) return { problem: `--key-file ${file} does not exist.`, real: resolve(file) };
  const real = realPath(file);
  const folder = dirname(real);
  const insensitive = ci(folder);
  const advice = 'Keep the signing key outside every git checkout, for example ~/.config/early-letters/signing.env (chmod 600), or export EL_SIGNING_KEY and EL_SIGNING_KEY_ID from your password manager instead.';
  for (const r of protectedRoots(root, git)) {
    if (isInside(real, r, insensitive || ci(r))) {
      return { problem: `--key-file ${file} is inside this repository (${r}${real !== resolve(file) ? `, reached through ${file}` : ''}). ${advice}`, real };
    }
  }
  // Any other repository: ask git from the file's own folder (a second clone, a dotfiles repo in your home folder).
  const inside = git(folder, ['rev-parse', '--is-inside-work-tree', '--is-inside-git-dir']);
  if (inside && inside.split('\n').some((l) => l.trim() === 'true')) {
    const top = git(folder, ['rev-parse', '--show-toplevel']) ?? folder;
    return { problem: `--key-file ${file} is inside a git repository (${top}). ${advice}`, real };
  }
  return { problem: null, real };
}
