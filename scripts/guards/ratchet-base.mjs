// The one rule for "a list that only shrinks" (BRIEF CI-PIN section 10; CR-71 A5). Pure: no network, no write.
// The list lives in a tracked file; this module reads the BASE branch's copy and says what a test may do.
//
//   push to develop or main        -> { kind: 'push' }          (no base ref, one commit deep: the compare is not run)
//   base copy found                -> { kind: 'base', text }
//   base ref found, file missing   -> { kind: 'new-file' }      (the PR that introduces the list has nothing to compare)
//   base ref not fetched           -> { kind: 'absent', required } (required is true when RATCHET_BASE_REQUIRED=1: the caller FAILS)
import { execFileSync } from 'node:child_process';

const git = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

/** The base branch copy of `path`. `env` and `run` are injectable for tests. Never throws. */
export function baseCopy(path, { env = process.env, run = git, cwd = process.cwd() } = {}) {
  if (env.GITHUB_EVENT_NAME === 'push') return { kind: 'push' };
  const ref = `origin/${env.GITHUB_BASE_REF || 'develop'}`;
  const required = env.RATCHET_BASE_REQUIRED === '1';
  try {
    run(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`], cwd);
  } catch {
    return { kind: 'absent', required, ref };
  }
  try {
    return { kind: 'base', text: run(['show', `${ref}:${path}`], cwd), ref };
  } catch {
    return { kind: 'new-file', ref };
  }
}

/** Entries of a list file: one per line, blank lines and `#` comments ignored. */
export const listEntries = (text) => text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));

/** Lines present more often in `now` than in `base` (a multiset difference). Empty means the list did not grow. */
export function grown(baseText, nowText) {
  const have = new Map();
  for (const l of listEntries(baseText)) have.set(l, (have.get(l) ?? 0) + 1);
  const added = [];
  for (const l of listEntries(nowText)) {
    const n = have.get(l) ?? 0;
    if (n > 0) have.set(l, n - 1);
    else added.push(l);
  }
  return added;
}
