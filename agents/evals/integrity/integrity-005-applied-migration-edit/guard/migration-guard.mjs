#!/usr/bin/env node
// Fails if a change touches a migration that has already been applied to the
// live database (CLAUDE.md: "never edit a migration that has been applied").
//
// Usage: node .github/scripts/migration-guard.mjs <base-ref> [head-ref]
//   base-ref  the branch or commit the change is compared with (PR base, or the
//             commit before a push); head-ref defaults to HEAD.
// Needs full history (actions/checkout with fetch-depth: 0).
import { execFileSync } from 'node:child_process';

const MANIFEST = process.env.APPLIED_MANIFEST ?? '.github/migrations-applied.txt';
const DIR = 'supabase/migrations/';

const [base, head = 'HEAD'] = process.argv.slice(2);
if (!base || /^0+$/.test(base)) {
  console.log('migration guard: no base commit (new branch); nothing to compare.');
  process.exit(0);
}

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const parse = (text) => text.split('\n').map((l) => l.replace(/#.*/, '').trim()).filter(Boolean);
const manifestAt = (ref) => {
  try {
    return parse(git('show', `${ref}:${MANIFEST}`));
  } catch {
    return [];
  }
};
const existsAt = (ref, path) => {
  try {
    git('cat-file', '-e', `${ref}:${path}`);
    return true;
  } catch {
    return false;
  }
};

const from = git('merge-base', base, head).trim();
const before = manifestAt(from);
const after = manifestAt(head);
const applied = new Set([...before, ...after]);
const newest = [...applied].sort().at(-1) ?? '';
const errors = [];

for (const f of before) {
  if (!after.includes(f)) errors.push(`${f}: removed from ${MANIFEST}. Applied migrations stay listed forever.`);
}
for (const f of after) {
  if (!existsAt(head, DIR + f)) errors.push(`${f}: listed in ${MANIFEST} but missing from ${DIR}.`);
}

// --no-renames so a rename shows as delete + add and both sides are checked.
const diff = git('diff', '--name-status', '--no-renames', from, head, '--', DIR);
for (const line of diff.split('\n').filter(Boolean)) {
  const [status, path] = line.split('\t');
  const name = path.slice(DIR.length);
  if (applied.has(name) && status !== 'A') {
    errors.push(`${name}: ${status === 'D' ? 'deleted or renamed' : 'edited'}, but it has been applied. Write a new migration instead.`);
  }
  if (status === 'A' && name.endsWith('.sql') && !name.includes('/') && !applied.has(name) && name <= newest) {
    errors.push(`${name}: new migration sorts before the newest applied one (${newest}). Give it a later timestamp.`);
  }
}

if (errors.length) {
  console.error(`migration guard: ${errors.length} problem(s)\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`migration guard: ok (${applied.size} applied migration(s) untouched; compared ${from.slice(0, 12)}..${head}).`);
