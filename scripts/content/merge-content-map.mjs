#!/usr/bin/env node
// BL-1992: resolve a merge or rebase conflict in the generated content map by regenerating it, never by hand.
// Usage (in the middle of a conflicted `git merge` or `git rebase`): node scripts/content/merge-content-map.mjs
// Why: the two map files are pure output of export-content-map.mjs, so any conflict in them is noise; the right file is
// whatever the generator writes for the tree after every other conflict is fixed. Hand edits are never needed.
// Invariant kept: it refuses while any other file is still conflicted, because the generator would read conflict markers
// and write a wrong map. It only stages the two map files; it never commits, pushes or changes any other file.
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const MAP_FILES = ['docs/content/map/content-map.csv', 'docs/content/map/content-map.json'];

const git = (cwd, args) => {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${r.stderr.trim()}`);
  return r.stdout;
};

// regenerate(root) must write the two map files for the tree at root. Injectable so the test needs no real tree.
export function resolveContentMap({ cwd = process.cwd(), regenerate = defaultRegenerate, log = console.log } = {}) {
  const root = git(cwd, ['rev-parse', '--show-toplevel']).trim();
  const unmerged = git(root, ['diff', '--name-only', '--diff-filter=U']).split('\n').filter(Boolean);
  const mine = unmerged.filter((f) => MAP_FILES.includes(f));
  const others = unmerged.filter((f) => !MAP_FILES.includes(f));
  if (!mine.length) { log('no conflict in the content map; nothing to do'); return { status: 'clean', others }; }
  if (others.length) {
    log(`other files are still conflicted, fix them first, then run this again:\n  ${others.join('\n  ')}`);
    return { status: 'blocked', others };
  }
  // Take either side so the file has no markers; the generator overwrites it next.
  for (const f of mine) git(root, ['checkout', '--ours', '--', f]);
  regenerate(root);
  git(root, ['add', '--', ...MAP_FILES]);
  log(`regenerated and staged: ${MAP_FILES.join(', ')}. Continue with git merge --continue or git rebase --continue.`);
  return { status: 'resolved', others };
}

function defaultRegenerate(root) {
  const r = spawnSync(process.execPath, [join(root, 'scripts/content/export-content-map.mjs')], { cwd: root, stdio: 'inherit' });
  if (r.status !== 0) throw new Error('export-content-map.mjs failed; the map was not staged');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try { process.exit(resolveContentMap().status === 'blocked' ? 1 : 0); }
  catch (e) { console.error(e.message); process.exit(1); }
}
