#!/usr/bin/env node
/**
 * PR size check (CODE-R02, CODE-G1; BRIEF CI-PRSIZE): at most 400 changed lines and 20 files per pull request.
 *
 *   node scripts/guards/pr-size.mjs --base origin/develop [--head HEAD]
 *   env: PR_BODY (the body: untrusted, read from the environment only), PR_NUMBER, GITHUB_REPOSITORY,
 *        GITHUB_REPOSITORY_OWNER (the only person whose label counts), GH_TOKEN (read-only, for the label events)
 *
 * Prints `lines 312 / 400, files 11 / 20` on every run. Exit 0 pass, 1 over the limit with no proof, 2 could not run.
 * Counting: `git diff --numstat -M base...head`; binary files count 0; docs text counts (only doc IMAGES are excluded).
 * Excluded, by exact rule (EXCLUDE below): the lockfile, `__fixtures__` folders, the golden corpora listed in
 * GOLDEN_DIRS, `generated` folders and images under docs/. Excluded lines are printed. They are capped at 2,000 (the lockfile
 * alone at 10,000, a tool's output): above its cap a kind counts again, so a folder cannot hide code.
 * Exception: the label `size:accepted` applied by the repository owner (read from the issue events; a label by
 * anyone else is ignored and printed) AND a body line `Size exception: <reason>`.
 */
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const MAX_LINES = 400;
export const MAX_FILES = 20;
export const MAX_EXCLUDED_LINES = 2000;
export const MAX_LOCK_LINES = 10000;
export const LABEL = 'size:accepted';
/** Golden corpora, by directory prefix. A new corpus is a reviewed edit to this list. */
export const GOLDEN_DIRS = ['apps/mobile/test/__golden__/', 'packages/core/test/golden/'];
/** Each entry is tested on its own (pr-size.test.mjs). */
export const EXCLUDE = [
  ['the lockfile', (p) => p === 'package-lock.json' || p.endsWith('/package-lock.json')],
  ['a __fixtures__ folder', (p) => p.split('/').includes('__fixtures__')],
  ['a listed golden corpus', (p) => GOLDEN_DIRS.some((d) => p.startsWith(d))],
  ['a generated folder', (p) => p.split('/').includes('generated')],
  ['an image under docs', (p) => p.startsWith('docs/') && /\.(?:png|jpe?g|gif|webp|svg)$/i.test(p)],
];

/** `git diff --numstat -M` text to rows. Binary (`-`) is 0. A rename `a => b` or `d/{a => b}/f` is read as its new path. */
export function parseNumstat(text) {
  const rows = [];
  for (const line of text.split('\n')) {
    const m = /^(\d+|-)\t(\d+|-)\t(.+)$/.exec(line);
    if (!m) continue;
    let path = m[3];
    if (path.includes(' => ')) path = path.includes('{') ? path.replace(/\{[^}]* => ([^}]*)\}/, '$1').replace(/\/\//g, '/') : path.split(' => ')[1];
    rows.push({ path, lines: (m[1] === '-' ? 0 : +m[1]) + (m[2] === '-' ? 0 : +m[2]) });
  }
  return rows;
}

export function measure(rows) {
  let lines = 0, files = 0, excluded = 0, lock = 0, other = 0;
  const why = new Map();
  const kindOf = (path) => EXCLUDE.find(([, f]) => f(path));
  for (const r of rows) {
    const rule = kindOf(r.path);
    if (!rule) { lines += r.lines; files += 1; continue; }
    excluded += r.lines;
    if (rule === EXCLUDE[0]) lock += r.lines; else other += r.lines;
    why.set(rule[0], (why.get(rule[0]) ?? 0) + r.lines);
  }
  // Above its cap a kind counts again (with its files), so nothing can be hidden by a name.
  const lockOver = lock > MAX_LOCK_LINES, otherOver = other > MAX_EXCLUDED_LINES;
  for (const r of rows) {
    const rule = kindOf(r.path);
    if (rule && ((rule === EXCLUDE[0] && lockOver) || (rule !== EXCLUDE[0] && otherOver))) { lines += r.lines; files += 1; }
  }
  return { lines, files, excluded, capped: lockOver || otherOver, why };
}

/** True when the newest `size:accepted` event is a `labeled` by `owner`. Events are oldest first, as GitHub returns them. */
export function ownerAccepted(events, owner) {
  const mine = events.filter((e) => (e.event === 'labeled' || e.event === 'unlabeled') && e.label?.name === LABEL);
  const last = mine[mine.length - 1];
  return Boolean(last && last.event === 'labeled' && owner && last.actor?.login === owner);
}
export const hasExceptionLine = (body) => /^Size exception:\s*\S/m.test(body ?? '');

/** The verdict: `{ ok, lines: [...] }` of printable lines. No value from the body is printed. */
export function evaluate({ rows, events = [], body = '', owner = '' }) {
  const m = measure(rows);
  const out = [`lines ${m.lines} / ${MAX_LINES}, files ${m.files} / ${MAX_FILES}`];
  if (m.excluded) out.push(`excluded ${m.excluded} lines (${[...m.why].map(([k, v]) => `${k}: ${v}`).join('; ')})${m.capped ? `: over ${MAX_EXCLUDED_LINES}, counted` : ''}`);
  if (m.lines <= MAX_LINES && m.files <= MAX_FILES) return { ok: true, lines: out };
  const labelled = events.some((e) => e.event === 'labeled' && e.label?.name === LABEL);
  const byOwner = ownerAccepted(events, owner);
  if (labelled && !byOwner) out.push(`the ${LABEL} label was not applied by the repository owner, ignored`);
  if (byOwner && hasExceptionLine(body)) return { ok: true, lines: [...out, 'size exception accepted by the owner'] };
  out.push(byOwner ? 'FAIL: the label is there but the body has no "Size exception: <reason>" line' : `FAIL: over the limit; only the owner's ${LABEL} label plus a "Size exception:" line passes`);
  return { ok: false, lines: out };
}

const run = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

export function main(argv = process.argv.slice(2), env = process.env, exec = run) {
  const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
  try {
    const rows = parseNumstat(exec('git', ['diff', '--numstat', '-M', `${opt('--base', 'origin/develop')}...${opt('--head', 'HEAD')}`]));
    let events = [];
    if (env.PR_NUMBER && env.GITHUB_REPOSITORY) {
      // Read-only: a GET of the issue events. `gh api` with any field flag would turn into a POST, so none is passed.
      const raw = exec('gh', ['api', '--paginate', `repos/${env.GITHUB_REPOSITORY}/issues/${env.PR_NUMBER}/events`, '--jq', '.[]|select(.event=="labeled" or .event=="unlabeled")|tojson']);
      events = raw.split('\n').filter(Boolean).map((l) => JSON.parse(l));
    }
    const r = evaluate({ rows, events, body: env.PR_BODY ?? '', owner: env.GITHUB_REPOSITORY_OWNER ?? '' });
    process.stdout.write(`${r.lines.join('\n')}\n`);
    return r.ok ? 0 : 1;
  } catch (e) {
    process.stderr.write(`pr-size could not run: ${String(e.message).split('\n')[0]}\n`);
    return 2;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main());
