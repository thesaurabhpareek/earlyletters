#!/usr/bin/env node
// BL-583 (DATA-02): one applied-migrations record per hosted project.
//
// The old guard (.github/scripts/migration-guard.mjs) reads one flat list. Staging got files 1 to 27 on
// 2 Nov while the list still names two, so an applied file could be edited and the guard stayed green.
// This module reads one list per project (.github/migrations-applied/<project>.txt) and treats a file as
// applied if ANY project has it. It falls back to the old flat file (project "early-letters") while the
// folder does not exist, so it can land before the founder moves the lists.
//
//   node scripts/guards/migrations-record.mjs guard <base-ref> [head-ref]
//        The pull request check. Fails on: an applied file edited, renamed or deleted; a line removed from
//        any list; a listed file missing from supabase/migrations; a new file that sorts at or before the
//        newest applied version of any project.
//   <rows of schema_migrations.version> | node scripts/guards/migrations-record.mjs staging [--project staging]
//        The deploy check. Fails if a version the project reports is not in that project's list.
//
// Output is file names and versions only (timestamps and slugs): no row, URL or key. Exit 0 ok, 1 a
// problem, 2 usage.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const RECORD_DIR = '.github/migrations-applied';
export const LEGACY_FILE = '.github/migrations-applied.txt';
export const LEGACY_PROJECT = 'early-letters';
export const MIGRATIONS_DIR = 'supabase/migrations/';

export const parseList = (text) => text.split('\n').map((l) => l.replace(/#.*/, '').trim()).filter(Boolean);

/** All names across projects, and the newest one. */
export function union(records) {
  const all = new Set(Object.values(records).flat());
  return { all, newest: [...all].sort().at(-1) ?? '' };
}

/**
 * records: { project: [file names] } before and after the change.
 * changes: [{ status: 'A' | 'M' | 'D', name }] for supabase/migrations (renames already split).
 * exists: (name) => whether the file exists at the head.
 */
export function checkChange({ before, after, changes, exists }) {
  const errors = [];
  const applied = union({ ...before, ...after });
  for (const [project, names] of Object.entries(before)) {
    for (const f of names) {
      if (!(after[project] ?? []).includes(f)) errors.push(`${f}: removed from the ${project} list. Applied migrations stay listed forever.`);
    }
  }
  for (const [project, names] of Object.entries(after)) {
    for (const f of names) {
      if (!exists(f)) errors.push(`${f}: listed for ${project} but missing from ${MIGRATIONS_DIR}.`);
    }
  }
  const where = (name) => Object.entries({ ...before, ...after }).filter(([, l]) => l.includes(name)).map(([p]) => p).sort();
  for (const { status, name } of changes) {
    if (applied.all.has(name) && status !== 'A') {
      errors.push(`${name}: ${status === 'D' ? 'deleted or renamed' : 'edited'}, but it has been applied (${[...new Set(where(name))].join(', ')}). Write a new migration instead.`);
    }
    if (status === 'A' && name.endsWith('.sql') && !name.includes('/') && !applied.all.has(name) && name <= applied.newest) {
      errors.push(`${name}: new migration sorts before the newest applied one (${applied.newest}). Give it a later timestamp.`);
    }
  }
  return errors;
}

const versionOf = (name) => name.split('_')[0];

/** versions: what schema_migrations holds on the project. list: that project's recorded file names. */
export function checkProjectVersions({ project, versions, list }) {
  const recorded = new Set(list.map(versionOf));
  const missing = [...new Set(versions)].filter((v) => !recorded.has(v)).sort();
  return missing.map((v) => `${v}: applied on ${project} but not in its list. Open a PR that adds the file to ${RECORD_DIR}/${project}.txt.`);
}

export function parseVersions(text) {
  const out = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (!/^[0-9]{8,14}$/.test(line)) throw new Error('A line is not a migration version (digits only).');
    out.push(line);
  }
  return out;
}

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

function recordsAt(ref) {
  let names = [];
  try {
    names = git('ls-tree', '--name-only', `${ref}:${RECORD_DIR}/`).split('\n').filter((n) => n.endsWith('.txt'));
  } catch { /* folder absent */ }
  if (names.length) {
    return Object.fromEntries(names.map((n) => [n.slice(0, -4), parseList(git('show', `${ref}:${RECORD_DIR}/${n}`))]));
  }
  try {
    return { [LEGACY_PROJECT]: parseList(git('show', `${ref}:${LEGACY_FILE}`)) };
  } catch {
    return {};
  }
}

export function runGuard(base, head = 'HEAD') {
  if (!base || /^0+$/.test(base)) return { code: 0, lines: ['migrations record: no base commit (new branch); nothing to compare.'] };
  const from = git('merge-base', base, head).trim();
  const before = recordsAt(from);
  const after = recordsAt(head);
  const changes = git('diff', '--name-status', '--no-renames', from, head, '--', MIGRATIONS_DIR)
    .split('\n').filter(Boolean).map((l) => {
      const [status, path] = l.split('\t');
      return { status, name: path.slice(MIGRATIONS_DIR.length) };
    });
  const exists = (name) => {
    try { git('cat-file', '-e', `${head}:${MIGRATIONS_DIR}${name}`); return true; } catch { return false; }
  };
  const errors = checkChange({ before, after, changes, exists });
  if (errors.length) return { code: 1, lines: [`migrations record: ${errors.length} problem(s)`, ...errors.map((e) => `- ${e}`)] };
  const { all } = union({ ...before, ...after });
  return { code: 0, lines: [`migrations record: ok (${all.size} applied migration(s) across ${Object.keys({ ...before, ...after }).length} project list(s) untouched).`] };
}

export function runStaging(project, stdinText, readList) {
  let versions;
  try { versions = parseVersions(stdinText); } catch (e) { return { code: 2, lines: [`migrations record: ${e.message}`] }; }
  if (!versions.length) return { code: 1, lines: [`migrations record: ${project} reported no versions. A push that applied nothing is not a pass.`] };
  const errors = checkProjectVersions({ project, versions, list: readList(project) });
  if (errors.length) return { code: 1, lines: [`migrations record: ${errors.length} version(s) not recorded`, ...errors.map((e) => `- ${e}`)] };
  return { code: 0, lines: [`migrations record: ok (${new Set(versions).size} version(s) on ${project}, all recorded).`] };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, ...rest] = process.argv.slice(2);
  let result;
  if (cmd === 'guard') {
    result = runGuard(rest[0], rest[1]);
  } else if (cmd === 'staging') {
    const i = rest.indexOf('--project');
    const project = i >= 0 ? rest[i + 1] : 'staging';
    if (!/^[a-z0-9-]{1,40}$/.test(project ?? '')) result = { code: 2, lines: ['migrations record: --project must be a list name.'] };
    else result = runStaging(project, readFileSync(0, 'utf8'), (p) => parseList(readFileSync(`${RECORD_DIR}/${p}.txt`, 'utf8')));
  } else {
    result = { code: 2, lines: ['usage: migrations-record.mjs guard <base> [head] | staging [--project name] < versions'] };
  }
  (result.code ? console.error : console.log)(result.lines.join('\n'));
  process.exit(result.code);
}
