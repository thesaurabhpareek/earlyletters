#!/usr/bin/env node
// stack-status (HARNESS-GAPS H3; BRIEF HG-H3, owner: ops). One table row per open pull request whose base is not `develop`:
// its base PR, whether that base merged, mergeable_state, how far it is ahead of and behind its base, and the one next step.
//
//   node stack-status.mjs [--json] [--repo owner/name] [--base develop]
//
// Read-only: every call is a GET through `gh api`; the wrapper builds the argument list itself and refuses `-f`, `-F`,
// `--field`, `--raw-field`, `--input` and any method but GET. No token, header or gh stderr is read or printed. Output is
// PR numbers, branch names and states (public repo data). An unreadable PR prints `unknown`, never "ok". PROPOSAL: the founder
// moves this file to scripts/agents/ (his path) or scripts/ops/; it imports nothing from the repo.
import { execFile } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const DEFAULT_REPO = 'thesaurabhpareek/earlyletters';
const FORBIDDEN = /^(?:-f|-F|--field|--raw-field|--input|-X|--method)(?:=|$)/;

/** Throws on any argument that could make `gh api` write. Used by the real wrapper before anything is spawned. */
export function assertReadOnly(args) {
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '-X' || a === '--method' || a.startsWith('--method=')) {
      const v = a.includes('=') ? a.split('=')[1] : args[i + 1];
      if (v !== 'GET') throw new Error('stack-status is read-only: GET only');
    } else if (FORBIDDEN.test(a)) throw new Error('stack-status is read-only: no field or input flags');
  }
}

/** The real wrapper: api(path) -> parsed JSON. `extra` exists so a test can feed a forbidden flag. */
export function ghApi(path, { extra = [] } = {}) {
  const args = ['api', '-X', 'GET', ...extra, path];
  try { assertReadOnly(args.slice(3)); if (String(path).startsWith('-')) throw new Error('bad path'); } catch (e) { return Promise.reject(e); }
  return new Promise((resolve, reject) => {
    execFile('gh', args, { maxBuffer: 64 * 1024 * 1024 }, (err, stdout) => {
      if (err) return reject(new Error(`gh api ${path.split('?')[0]} failed`));
      try { resolve(JSON.parse(stdout)); } catch { reject(new Error(`gh api ${path.split('?')[0]}: not JSON`)); }
    });
  });
}

async function paged(api, path) {
  const out = [];
  for (let page = 1; page <= 30; page++) {
    const items = await api(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
    out.push(...items);
    if (items.length < 100) break;
  }
  return out;
}

const unknown = 'unknown';
/** A base that is a long-lived branch, not another PR's branch: not a stack. */
const LONG_LIVED = /^(?:main|release\/.+)$/;

/** Rows for every open PR not into `base`. `api` is injected: api(path) -> JSON, GET only. */
export async function buildStacks({ api, repo = DEFAULT_REPO, base = 'develop' }) {
  const get = (p) => api(p, { method: 'GET' });
  const open = await paged(get, `repos/${repo}/pulls?state=open`);
  const byHead = new Map(open.map((p) => [p.head.ref, p]));
  const rows = [];
  for (const p of open.filter((x) => x.base.ref !== base)) {
    const row = { pr: p.number, base: p.base.ref, basePr: null, baseState: unknown, mergeable_state: unknown, ahead_by: unknown, behind_by: unknown, next: unknown, created: p.created_at };
    const parent = byHead.get(p.base.ref);
    try {
      if (LONG_LIVED.test(p.base.ref)) row.baseState = 'long-lived';
      else if (parent) { row.basePr = parent.number; row.baseState = 'open'; row.parentCreated = parent.created_at; }
      else {
        const owner = repo.split('/')[0];
        const closed = await get(`repos/${repo}/pulls?state=closed&head=${owner}:${encodeURIComponent(p.base.ref)}`);
        const hit = closed.find((c) => c.head.ref === p.base.ref);
        if (hit) { row.basePr = hit.number; row.baseState = hit.merged_at ? 'merged' : 'closed'; }
        else row.baseState = 'no PR';
      }
    } catch { /* stays unknown */ }
    try { row.mergeable_state = (await get(`repos/${repo}/pulls/${p.number}`)).mergeable_state ?? unknown; } catch { /* unknown */ }
    try {
      if (p.head.repo?.full_name === repo) {
        const c = await get(`repos/${repo}/compare/${encodeURIComponent(p.base.ref)}...${encodeURIComponent(p.head.ref)}`);
        if (Number.isInteger(c.ahead_by) && Number.isInteger(c.behind_by)) { row.ahead_by = c.ahead_by; row.behind_by = c.behind_by; }
      }
    } catch { /* unknown */ }
    row.next = nextStep(row);
    rows.push(row);
  }
  return rows;
}

export function nextStep(r) {
  if (r.baseState === 'long-lived') return `base ${r.base} is a long-lived branch: not a stack`;
  if (r.baseState === 'open') return `waits for #${r.basePr}`;
  if (r.baseState === 'merged') return 'retarget to develop, then rebuild';
  if (r.baseState === 'closed') return `base #${r.basePr} closed unmerged: ask Karma`;
  if (r.baseState === 'no PR') return `base branch ${r.base} has no PR: ask Karma`;
  return unknown;
}

export function summary(all) {
  const rows = all.filter((r) => r.baseState !== 'long-lived');
  const roots = new Set();
  const by = new Map(rows.map((r) => [r.pr, r]));
  for (const r of rows) { let x = r; for (let i = 0; i < 50 && x.basePr && by.has(x.basePr); i++) x = by.get(x.basePr); roots.add(x.pr); }
  const waiting = rows.filter((r) => r.baseState === 'open' && r.parentCreated).sort((a, b) => a.parentCreated.localeCompare(b.parentCreated))[0];
  return `${roots.size} stack${roots.size === 1 ? '' : 's'}, ${rows.length} stacked PR${rows.length === 1 ? '' : 's'}; oldest unmerged base: ${waiting ? `#${waiting.basePr}` : 'none'}`;
}

export function render(rows) {
  const head = ['PR', 'base ref', 'base PR', 'base state', 'mergeable_state', 'ahead_by', 'behind_by', 'next step'];
  const body = rows.map((r) => [`#${r.pr}`, r.base, r.basePr ? `#${r.basePr}` : '-', r.baseState, r.mergeable_state, String(r.ahead_by), String(r.behind_by), r.next]);
  const w = head.map((h, i) => Math.max(h.length, ...body.map((b) => b[i].length)));
  const line = (c) => c.map((x, i) => x.padEnd(w[i])).join('  ').trimEnd();
  return [line(head), ...body.map(line), '', summary(rows)].join('\n');
}

export async function main(argv = process.argv.slice(2), api = ghApi) {
  const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
  const repo = opt('--repo', DEFAULT_REPO);
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) throw new Error('--repo must look like owner/name');
  const rows = await buildStacks({ api, repo, base: opt('--base', 'develop') });
  process.stdout.write(`${argv.includes('--json') ? JSON.stringify({ rows, summary: summary(rows) }, null, 2) : render(rows)}\n`);
  return 0;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().then((c) => process.exit(c), (e) => { process.stderr.write(`stack-status failed: ${e.message}\n`); process.exit(2); });
