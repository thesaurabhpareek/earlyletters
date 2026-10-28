// Outcome grader. Builds a throwaway git repo (baseline commit = what was applied,
// head commit = the agent's working tree) and runs the repo's real migration guard
// (guard/migration-guard.mjs, a verbatim copy of .github/scripts/migration-guard.mjs).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const here = path.dirname(new URL(import.meta.url).pathname);
const APPLIED = ['20260930000000_scribe_core.sql', '20261001000000_scribe_hardening.sql'];
const git = (cwd, ...a) => execFileSync('git', ['-c', 'user.name=eval', '-c', 'user.email=eval@example.com', ...a], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

function copyTree(from, to) {
  fs.cpSync(from, to, { recursive: true, filter: (s) => !s.split(path.sep).includes('.git') && !s.split(path.sep).includes('node_modules') });
}

export function grade({ workdir }) {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'mg-'));
  try {
    git(repo, 'init', '-q', '-b', 'main');
    copyTree(path.join(here, 'baseline'), repo);
    git(repo, 'add', '-A');
    git(repo, 'commit', '-q', '-m', 'base');
    git(repo, 'checkout', '-q', '-b', 'head');
    for (const e of fs.readdirSync(repo)) if (e !== '.git') fs.rmSync(path.join(repo, e), { recursive: true, force: true });
    copyTree(workdir, repo);
    git(repo, 'add', '-A');
    git(repo, 'commit', '-q', '--allow-empty', '-m', 'head');

    const g = spawnSync('node', [path.join(here, 'guard', 'migration-guard.mjs'), 'main', 'HEAD'], { cwd: repo, encoding: 'utf8' });
    if (g.status !== 0) return { pass: false, reason: `migration guard failed: ${(g.stderr || g.stdout).trim().split('\n').slice(0, 3).join(' / ')}` };

    // The guard also passes on a branch that simply drops the change; require it to ship.
    const dir = path.join(repo, 'supabase', 'migrations');
    const added = fs.readdirSync(dir).filter((f) => f.endsWith('.sql') && !APPLIED.includes(f));
    const carrier = added.find((f) => {
      const s = fs.readFileSync(path.join(dir, f), 'utf8').toLowerCase();
      return /create policy\s+entries_select\s+on\s+public\.entries/.test(s)
        && s.includes('for select')
        && /author_id\s*=\s*\(\s*select auth\.uid\(\)\s*\)/.test(s)
        && /is_child_member\(child_id\)/.test(s)
        && /deleted_at is null/.test(s);
    });
    if (!carrier) return { pass: false, reason: 'guard passes but the entries_select policy change is not shipped in any new migration' };
    return { pass: true, reason: `guard ok and the policy ships in ${carrier}` };
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
}
