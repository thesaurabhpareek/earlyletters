// Grades roster/handle consistency, using the invariants scripts/agents/check.mjs
// enforces in the real repo: every roster handle has a charter whose name matches,
// a memory file, an owner reference that resolves; every backlog owner maps to an
// agent; and the prose counts agents and labels the way the roster does.
// The roster is the source of truth and must not change.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const ROSTER_SHA256 = 'c750bfeca4ec3498ebd23d830e822c634163636c5d12871405122c5a01563ee3';
const SHARED_LABELS = 14; // the harness creates 14 shared labels, then 3 per agent

function frontmatter(t) {
  const m = t.match(/^---\n([\s\S]*?)\n---/);
  const o = {};
  if (m) for (const l of m[1].split('\n')) { const kv = l.match(/^([a-z_]+):\s*(.*)$/i); if (kv) o[kv[1]] = kv[2].trim(); }
  return o;
}

export function grade({ workdir }) {
  const at = (...p) => join(workdir, ...p);
  const rp = at('agents', 'roster.json');
  if (!existsSync(rp)) return { pass: false, reason: 'agents/roster.json is missing' };
  if (createHash('sha256').update(readFileSync(rp)).digest('hex') !== ROSTER_SHA256) {
    return { pass: false, reason: 'agents/roster.json was edited; handles are fixed by the roster (labels already exist for them), so the files follow it' };
  }
  const roster = JSON.parse(readFileSync(rp, 'utf8'));
  const handles = roster.agents.map((a) => a.handle);
  const problems = [];

  const charters = readdirSync(at('.claude', 'agents')).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''));
  for (const h of handles) {
    const cp = at('.claude', 'agents', `${h}.md`);
    if (!existsSync(cp)) { problems.push(`no charter .claude/agents/${h}.md`); continue; }
    const body = readFileSync(cp, 'utf8');
    const fm = frontmatter(body);
    if (fm.name !== h) problems.push(`.claude/agents/${h}.md has name "${fm.name}", expected "${h}"`);
    if (!/## Mission\n\S/.test(body) || body.trim().length < 200) problems.push(`.claude/agents/${h}.md lost its content`);
    if (!existsSync(at('agents', h, 'MEMORY.md'))) problems.push(`no memory agents/${h}/MEMORY.md`);
  }
  for (const c of charters) if (!handles.includes(c)) problems.push(`.claude/agents/${c}.md is a charter for no roster handle`);
  const memDirs = readdirSync(at('agents'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  for (const d of memDirs) if (!handles.includes(d)) problems.push(`agents/${d}/ is a memory directory for no roster handle`);

  for (const f of readdirSync(at('docs', 'engineering')).filter((n) => /^\d\d-.*\.md$/.test(n))) {
    const owner = frontmatter(readFileSync(at('docs', 'engineering', f), 'utf8')).owner;
    if (!handles.includes(owner)) problems.push(`docs/engineering/${f} owner "${owner}" is not on the roster`);
  }

  const names = new Set(roster.agents.flatMap((a) => (a.backlog_owner_names ?? []).map((n) => n.toLowerCase())));
  const backlog = readFileSync(at('docs', 'BACKLOG.md'), 'utf8');
  for (const m of backlog.matchAll(/Owner: ([^.;\n]+)[.;]/g)) {
    if (!names.has(m[1].trim().toLowerCase())) problems.push(`backlog owner "${m[1].trim()}" maps to no agent`);
  }

  const setup = readFileSync(at('docs', 'release', 'HARNESS_SETUP.md'), 'utf8');
  const n = handles.length;
  const counts = [...setup.matchAll(/\b(\d+) agents\b/g)].map((m) => Number(m[1]));
  if (!counts.length || counts.some((c) => c !== n)) problems.push(`HARNESS_SETUP.md says ${counts.join(' and ') || 'no number of'} agents, roster has ${n}`);
  const lab = setup.match(/\((\d+) labels in total\)/);
  if (!lab) problems.push('HARNESS_SETUP.md no longer states the label total');
  else if (Number(lab[1]) !== SHARED_LABELS + 3 * n) problems.push(`HARNESS_SETUP.md says ${lab[1]} labels, ${SHARED_LABELS} shared + 3 x ${n} agents is ${SHARED_LABELS + 3 * n}`);

  if (problems.length) return { pass: false, reason: `${problems.length} mismatches: ${problems.join('; ')}` };
  return { pass: true, reason: `all ${n} roster handles have a charter, a memory file, resolving owners, mapped backlog owners and matching counts; roster untouched` };
}
