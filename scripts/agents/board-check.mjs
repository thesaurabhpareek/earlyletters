#!/usr/bin/env node
// Advisory checker for docs/agents/CLAIMS.md (harness v2, HV2-B04, requirement HV2-007).
// It never blocks a merge and never writes anything. GET requests only.
// Run: node scripts/agents/board-check.mjs [--repo owner/name] [--file path] [--json] [--fetch] [--now ISO]
// Auth: by default `gh api --method GET`; --fetch uses Node's fetch with GITHUB_TOKEN or GH_TOKEN.
// Exit: 0 clean, 1 findings (C1, C2, C3, C5), 2 unreadable or malformed (C4, a row missing a field,
// a PR that cannot be read). Exit 2 wins over 1: if the file or the PR state cannot be trusted,
// the findings cannot be either.
//
//   C1 a claim names a PR that is merged or closed
//   C2 a claim has expired
//   C3 two live claims have overlapping globs (conservative; false positives accepted)
//   C4 more than 15 rows, or a row is malformed (missing field, bad time, no globs)
//   C5 a claim expires more than 72 h from now (renewals must stay inside the window)
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { DEFAULT_REPO, ghGet, fetchGet } from '../founder/check.mjs';

export const MAX_ROWS = 15;
export const WINDOW_MS = 72 * 3600_000;
export const COLUMNS = ['id', 'owner session', 'branch', 'PR', 'globs', 'claimed UTC', 'expires UTC', 'note'];
const TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z$/;

/** Rows of the first table in the text that has the CLAIMS header. Pure. */
export function parseClaims(text) {
  const rows = [];
  const problems = [];
  let inTable = false;
  String(text ?? '').replace(/\r\n?/g, '\n').split('\n').forEach((line, i) => {
    if (!/^\|/.test(line)) { if (inTable && line.trim() === '') inTable = false; return; }
    const cells = line.replace(/^\||\|\s*$/g, '').split('|').map((c) => c.trim());
    if (cells[0] === 'id' && cells.length >= 2) { inTable = true; return; }
    if (!inTable || /^-+$/.test(cells[0].replace(/\s/g, ''))) return;
    const at = `line ${i + 1}`;
    if (cells.length !== COLUMNS.length) { problems.push({ code: 'C4', where: at, detail: `${cells.length} fields, expected ${COLUMNS.length}` }); return; }
    const row = Object.fromEntries(COLUMNS.map((c, k) => [c, cells[k]]));
    const missing = COLUMNS.filter((c) => c !== 'note' && !row[c]);
    if (missing.length) { problems.push({ code: 'C4', where: at, detail: `missing ${missing.join(', ')}` }); return; }
    const globs = row.globs.split(',').map((g) => g.trim().replace(/^`|`$/g, '').trim()).filter(Boolean);
    const pr = /^\d+$/.test(row.PR) ? Number(row.PR) : row.PR.toLowerCase() === 'none' ? null : NaN;
    const claimed = TIME.test(row['claimed UTC']) ? Date.parse(row['claimed UTC']) : NaN;
    const expires = TIME.test(row['expires UTC']) ? Date.parse(row['expires UTC']) : NaN;
    const bad = [!globs.length && 'globs', Number.isNaN(pr) && 'PR', Number.isNaN(claimed) && 'claimed UTC', Number.isNaN(expires) && 'expires UTC'].filter(Boolean);
    if (bad.length) { problems.push({ code: 'C4', where: at, detail: `bad ${bad.join(', ')}` }); return; }
    rows.push({ id: row.id, owner: row['owner session'], branch: row.branch, pr, globs, claimed, expires, line: i + 1 });
  });
  return { rows, problems };
}

const WILD = /[*?[{]/;
const prefixOf = (g) => { const k = g.search(WILD); return k < 0 ? g : g.slice(0, k); };

/** Conservative overlap: a literal prefix contains the other; two literals only if equal. Pure. */
export function globsOverlap(a, b) {
  const wa = WILD.test(a), wb = WILD.test(b);
  if (!wa && !wb) return a === b;
  const pa = prefixOf(a), pb = prefixOf(b);
  return pa.startsWith(pb) || pb.startsWith(pa);
}

/** The first overlapping pair of globs between two rows, or undefined. Pure. */
export function overlap(r1, r2) {
  for (const a of r1.globs) for (const b of r2.globs) if (globsOverlap(a, b)) return [a, b];
  return undefined;
}

/**
 * Check parsed rows. `getPr(n)` returns `{status, body}` for GET /pulls/{n}; it is injected so tests
 * use fixtures. Returns findings `{code, id, detail}`; code C4 means unreadable or malformed.
 */
export async function checkClaims({ rows, problems = [] }, { now, getPr }) {
  const t = new Date(now).getTime();
  const out = [...problems.map((p) => ({ code: p.code, id: p.where, detail: p.detail }))];
  if (rows.length + problems.length > MAX_ROWS) out.push({ code: 'C4', id: 'file', detail: `${rows.length + problems.length} rows, limit ${MAX_ROWS}` });
  for (const r of rows) {
    if (r.expires < t) out.push({ code: 'C2', id: r.id, detail: `expired ${new Date(r.expires).toISOString().slice(0, 16)}Z` });
    else if (r.expires - t > WINDOW_MS) out.push({ code: 'C5', id: r.id, detail: 'expires more than 72 h from now' });
    if (r.pr !== null) {
      let res;
      try { res = await getPr(r.pr); } catch { res = { status: 0 }; }
      if (res?.status !== 200 || !res.body) out.push({ code: 'C4', id: r.id, detail: `PR #${r.pr} unreadable (HTTP ${res?.status ?? 0})` });
      else if (res.body.merged || res.body.merged_at) out.push({ code: 'C1', id: r.id, detail: `PR #${r.pr} is merged` });
      else if (res.body.state && res.body.state !== 'open') out.push({ code: 'C1', id: r.id, detail: `PR #${r.pr} is ${res.body.state}` });
    }
  }
  const live = rows.filter((r) => r.expires >= t);
  for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
    const o = overlap(live[i], live[j]);
    if (o) out.push({ code: 'C3', id: `${live[i].id} / ${live[j].id}`, detail: `globs overlap: ${o[0]} and ${o[1]}` });
  }
  return out;
}

export function exitCode(findings) {
  if (findings.some((f) => f.code === 'C4')) return 2;
  return findings.length ? 1 : 0;
}

export function render(findings, rowCount) {
  const head = `CLAIMS.md: ${rowCount} row(s), ${findings.length} finding(s).`;
  return [head, ...findings.map((f) => `${f.code} ${f.id}: ${f.detail}`)].join('\n');
}

async function main(argv) {
  const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
  const repo = opt('repo', DEFAULT_REPO);
  const file = opt('file', new URL('../../docs/agents/CLAIMS.md', import.meta.url));
  const now = opt('now', new Date().toISOString());
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { console.log('CLAIMS.md unreadable'); process.exitCode = 2; return; }
  const get = argv.includes('--fetch') ? fetchGet(process.env.GITHUB_TOKEN || process.env.GH_TOKEN) : ghGet();
  const parsed = parseClaims(text);
  const findings = await checkClaims(parsed, { now, getPr: (n) => get(`repos/${repo}/pulls/${n}`) });
  console.log(argv.includes('--json') ? JSON.stringify(findings, null, 2) : render(findings, parsed.rows.length + parsed.problems.length));
  process.exitCode = exitCode(findings);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main(process.argv.slice(2));
