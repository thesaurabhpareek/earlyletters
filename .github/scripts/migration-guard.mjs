#!/usr/bin/env node
// Fails if a change touches a migration that has already been applied to the
// live database (CLAUDE.md: "never edit a migration that has been applied").
//
// Usage: node migration-guard.mjs <base-ref> [head-ref]
//   base-ref  the branch or commit the change is compared with (PR base, or the
//             commit before a push); head-ref defaults to HEAD.
// Needs full history (actions/checkout with fetch-depth: 0).
//
// Trust model (CI-09): CI runs the copy of this file that is on the base ref,
// not the one in the pull request, so a pull request cannot weaken its own
// gate. The reviewed exception list (CI-02) is also read from the base ref, so
// a pull request cannot grant itself an exception either.
//
// Trusted ref: the base ref when it has this script. If it does not (a branch
// that predates the guard, today only `main`), the fallback ref is used
// (GUARD_FALLBACK_REF, `origin/develop` in CI). Only if neither has the script
// are the head copies used, with a warning (bootstrap). The workflow picks the
// script copy with the same rule; see .github/workflows/migration-guard.yml.
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const SCRIPT = '.github/scripts/migration-guard.mjs';
export const MANIFEST = '.github/migrations-applied.txt';
export const EXCEPTIONS = '.github/migration-exceptions.txt';
export const DIR = 'supabase/migrations/';

const parse = (text) =>
  text
    .split('\n')
    .map((l) => l.replace(/#.*/, '').trim())
    .filter(Boolean);

// One entry per line: `<migration file name>@<40-hex git blob sha>`.
// The entry allows exactly that file to differ from its applied version, and
// only while its content is exactly that blob. Any further edit fails again.
const EXCEPTION_LINE = /^([0-9]{14}_[a-z0-9_]+\.sql)@([0-9a-f]{40})$/;

export function parseExceptions(text) {
  const entries = new Map();
  const errors = [];
  for (const line of parse(text)) {
    const m = EXCEPTION_LINE.exec(line);
    if (!m) {
      errors.push(`${EXCEPTIONS}: malformed entry "${line}". Expected <file>.sql@<40-hex blob sha>.`);
      continue;
    }
    if (entries.has(m[1])) {
      errors.push(`${EXCEPTIONS}: ${m[1]} is listed more than once.`);
      continue;
    }
    entries.set(m[1], m[2]);
  }
  return { entries, errors };
}

const gitIn = (cwd) => (...args) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

const hasPath = (git, ref, path) => {
  if (!ref) return false;
  try {
    git('cat-file', '-e', `${ref}:${path}`);
    return true;
  } catch {
    return false;
  }
};

// The first of base, fallback that carries the guard script; else head.
export function resolveTrustedRef({ base, head = 'HEAD', fallback, cwd = process.cwd() }) {
  const git = gitIn(cwd);
  for (const ref of [base, fallback]) {
    if (hasPath(git, ref, SCRIPT)) return { ref, bootstrap: false };
  }
  return { ref: head, bootstrap: true };
}

export function runGuard({ base, head = 'HEAD', fallback, trusted, cwd = process.cwd() }) {
  const out = { ok: true, errors: [], notes: [] };
  if (!base || /^0+$/.test(base)) {
    out.notes.push('no base commit (new branch); nothing to compare.');
    return out;
  }

  const git = gitIn(cwd);
  const existsAt = (ref, path) => hasPath(git, ref, path);
  const readAt = (ref, path) => (existsAt(ref, path) ? git('show', `${ref}:${path}`) : '');
  const blobAt = (ref, path) => (existsAt(ref, path) ? git('rev-parse', `${ref}:${path}`).trim() : '');

  if (!trusted) {
    const r = resolveTrustedRef({ base, head, fallback, cwd });
    trusted = r.ref;
    if (r.bootstrap) {
      out.notes.push(
        `bootstrap: neither ${base} nor the fallback ref has ${SCRIPT}, so the exception list is read from ${head}. ` +
          'This only happens until the guard is on the base branch.',
      );
    }
  }
  out.trusted = trusted;
  const { entries: exceptions, errors: exceptionErrors } = parseExceptions(readAt(trusted, EXCEPTIONS));
  out.errors.push(...exceptionErrors);

  const from = git('merge-base', base, head).trim();
  const before = parse(readAt(from, MANIFEST));
  const after = parse(readAt(head, MANIFEST));
  const applied = new Set([...before, ...after]);
  const newest = [...applied].sort().at(-1) ?? '';

  for (const f of before) {
    if (!after.includes(f)) out.errors.push(`${f}: removed from ${MANIFEST}. Applied migrations stay listed forever.`);
  }
  for (const f of after) {
    if (!existsAt(head, DIR + f)) out.errors.push(`${f}: listed in ${MANIFEST} but missing from ${DIR}.`);
  }

  // --no-renames so a rename shows as delete + add and both sides are checked.
  const diff = git('diff', '--name-status', '--no-renames', from, head, '--', DIR);
  for (const line of diff.split('\n').filter(Boolean)) {
    const [status, path] = line.split('\t');
    const name = path.slice(DIR.length);
    if (applied.has(name) && status !== 'A') {
      const allowed = exceptions.get(name);
      if (status === 'M' && allowed && blobAt(head, path) === allowed) {
        out.notes.push(`${name}: edited, allowed by the reviewed exception ${name}@${allowed.slice(0, 12)}.`);
        continue;
      }
      const hint = allowed && status === 'M' ? ` Its reviewed exception only covers blob ${allowed.slice(0, 12)}.` : '';
      out.errors.push(
        `${name}: ${status === 'D' ? 'deleted or renamed' : 'edited'}, but it has been applied. Write a new migration instead.${hint}`,
      );
    }
    if (status === 'A' && name.endsWith('.sql') && !name.includes('/') && !applied.has(name) && name <= newest) {
      out.errors.push(`${name}: new migration sorts before the newest applied one (${newest}). Give it a later timestamp.`);
    }
  }

  out.from = from;
  out.applied = applied.size;
  out.ok = out.errors.length === 0;
  return out;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const [base, head = 'HEAD'] = process.argv.slice(2);
  const r = runGuard({
    base,
    head,
    fallback: process.env.GUARD_FALLBACK_REF || undefined,
    trusted: process.env.GUARD_TRUSTED_REF || undefined,
  });
  for (const n of r.notes) console.log(`migration guard: ${n}`);
  if (!r.ok) {
    console.error(`migration guard: ${r.errors.length} problem(s)\n- ${r.errors.join('\n- ')}`);
    process.exit(1);
  }
  if (r.from) {
    console.log(
      `migration guard: ok (${r.applied} applied migration(s) checked; compared ${r.from.slice(0, 12)}..${head}; ` +
        `exceptions read from ${r.trusted}).`,
    );
  }
}
