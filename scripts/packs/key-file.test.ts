/// <reference types="node" />
/**
 * Where the signing key file may live (key-file.ts), run by
 * `npm test -w @scribe/api`. One test per way the first guard of #162 could be
 * bypassed (review A, finding 1): a symlinked folder, a symlinked file, a
 * different letter case on a case-insensitive disk, a second worktree, a
 * second clone, and the git directory itself. Temporary git repos only.
 */
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { caseInsensitiveAt, checkKeyFile, isInside, protectedRoots, realPath } from './key-file';

const REPO = path.resolve(__dirname, '../..');
const tmp = (label: string) => realPath(fs.mkdtempSync(path.join(os.tmpdir(), `el-keyfile-${label}-`)));
const git = (cwd: string, ...args: string[]) => execFileSync('git', ['-C', cwd, '-c', 'user.email=asha@example.invalid', '-c', 'user.name=Asha test', ...args], { stdio: 'ignore' });
const keyLines = 'EL_SIGNING_KEY_ID=el-test\nEL_SIGNING_KEY=placeholder\n';

/** A throwaway repo with one commit (a worktree needs one). */
function repo(label: string): string {
  const dir = tmp(label);
  git(dir, 'init', '-q');
  git(dir, 'commit', '-q', '--allow-empty', '-m', 'init');
  return dir;
}
function keyFileIn(dir: string, name = 'signing.env'): string {
  const f = path.join(dir, name);
  fs.writeFileSync(f, keyLines);
  return f;
}
const flip = (s: string) => [...s].map((c) => (c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase())).join('');

describe('checkKeyFile: a key file outside every git checkout is accepted', () => {
  it('accepts a file in a plain folder, and refuses a missing one', () => {
    const outside = keyFileIn(tmp('outside'));
    expect(checkKeyFile(outside, REPO)).toEqual({ problem: null, real: outside });
    expect(checkKeyFile(path.join(tmp('missing'), 'signing.env'), REPO).problem).toMatch(/does not exist/);
  });
});

describe('checkKeyFile: every bypass of a text comparison is refused', () => {
  it('a file inside the repo, by its own path', () => {
    expect(checkKeyFile(path.join(REPO, 'scripts/packs/remote-config.json'), REPO).problem).toMatch(/inside this repository/);
  });

  it('a symlinked folder outside the repo that points into it', () => {
    const r = repo('symdir');
    keyFileIn(r);
    const link = path.join(tmp('symdir-link'), 'checkout');
    fs.symlinkSync(r, link, 'dir');
    const c = checkKeyFile(path.join(link, 'signing.env'), r);
    expect(c.real).toBe(path.join(r, 'signing.env'));
    expect(c.problem).toMatch(/inside this repository .*reached through/);
  });

  it('a symlinked file outside the repo that points into it', () => {
    const r = repo('symfile');
    const target = keyFileIn(r);
    const link = path.join(tmp('symfile-link'), 'signing.env');
    fs.symlinkSync(target, link, 'file');
    expect(checkKeyFile(link, r).problem).toMatch(/inside this repository/);
  });

  it('a different letter case, where the disk ignores case (macOS and Windows defaults)', () => {
    const r = repo('case');
    const f = keyFileIn(r);
    // The repo root as the founder might type it, in other letters. Linux disks are case-sensitive, so the disk is described to the check.
    const otherCase = path.join(path.dirname(r), flip(path.basename(r)));
    const noGit = () => null;
    expect(checkKeyFile(f, otherCase, { git: noGit, caseInsensitive: () => true }).problem).toMatch(/inside this repository/);
    // On a case-sensitive disk (Linux, CI) the other-case folder is a different folder.
    if (!fs.existsSync(otherCase)) expect(checkKeyFile(f, otherCase, { git: noGit, caseInsensitive: () => false }).problem).toBeNull();
    expect(isInside('/Users/asha/Code/EarlyLetters/signing.env', '/Users/asha/Code/earlyletters', true)).toBe(true);
    expect(isInside('/Users/asha/Code/EarlyLetters/signing.env', '/Users/asha/Code/earlyletters', false)).toBe(false);
    expect(isInside('/Users/asha/Code/earlyletters-keys/signing.env', '/Users/asha/Code/earlyletters', true)).toBe(false);
  });

  it('detects the case behaviour of the disk it runs on', () => {
    const d = tmp('Case-Probe');
    const sensitive = !fs.existsSync(path.join(path.dirname(d), flip(path.basename(d))));
    expect(caseInsensitiveAt(d)).toBe(!sensitive);
  });

  it('a second worktree of the same repo', () => {
    const r = repo('main');
    const wt = path.join(tmp('wt-parent'), 'second');
    git(r, 'worktree', 'add', '-q', '--detach', wt);
    expect(protectedRoots(r)).toContain(realPath(wt));
    expect(checkKeyFile(keyFileIn(wt), r).problem).toMatch(/inside this repository/);
  });

  it('a separate clone, or any other git repository (a dotfiles repo in the home folder)', () => {
    const r = repo('first');
    const other = repo('second-clone');
    const nested = path.join(other, 'config', 'early-letters');
    fs.mkdirSync(nested, { recursive: true });
    const c = checkKeyFile(keyFileIn(nested), r);
    expect(c.problem).toMatch(/inside a git repository/);
    expect(c.problem).toContain(other);
  });

  it('the git directory itself (shared by every worktree)', () => {
    const r = repo('gitdir');
    expect(checkKeyFile(keyFileIn(path.join(r, '.git')), r).problem).toMatch(/inside this repository/);
  });

  it('this repo: its root, its git common dir and its worktrees are all protected', () => {
    const roots = protectedRoots(REPO);
    expect(roots).toContain(realPath(REPO));
    expect(roots.some((p) => p.endsWith(`${path.sep}.git`))).toBe(true);
  });
});

describe('isInside', () => {
  it('is a path comparison, not a prefix comparison', () => {
    expect(isInside('/a/b/c', '/a/b', false)).toBe(true);
    expect(isInside('/a/b', '/a/b', false)).toBe(true);
    expect(isInside('/a/bc', '/a/b', false)).toBe(false);
    expect(isInside('/a', '/a/b', false)).toBe(false);
  });
});
