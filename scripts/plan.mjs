#!/usr/bin/env node
/**
 * Release plan generator and checker. Reads docs/BACKLOG.md (the single source of truth for tasks) and
 * docs/release/overlay.json (new tasks and status overrides that are not yet in the backlog), and writes
 *   docs/release/plan.json   machine-readable plan: tasks, dependency levels, waves, assignees
 *   docs/release/PLAN.md     human-readable view of the same
 * Usage:  node scripts/plan.mjs            write both files
 *         node scripts/plan.mjs --check    fail (exit 1) if the files are stale or the graph is broken
 *         node scripts/plan.mjs --next [n] print the next n startable agent tasks (default 5), disjoint areas first
 * No dependencies. Never edits the backlog. Task ids, owners and statuses come from the backlog text.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BACKLOG = join(ROOT, 'docs/BACKLOG.md');
const OVERLAY = join(ROOT, 'docs/release/overlay.json');
const AGENTS = join(ROOT, 'docs/release/agents.json');
const OUT_JSON = join(ROOT, 'docs/release/plan.json');
const OUT_MD = join(ROOT, 'docs/release/PLAN.md');

const overlay = existsSync(OVERLAY) ? JSON.parse(readFileSync(OVERLAY, 'utf8')) : { tasks: [], overrides: {} };
const agents = JSON.parse(readFileSync(AGENTS, 'utf8'));

/** First word of a status: ready, blocked, done, in-review, needs-decision, superseded, deferred. */
const statusWord = (s) => (/^[a-z-]+/.exec(s.trim()) ?? [''])[0];

function parseBacklog() {
  const lines = readFileSync(BACKLOG, 'utf8').split('\n');
  const tasks = [];
  let milestone = null;
  let cur = null;
  for (const line of lines) {
    const m = /^## (M\d+)\./.exec(line);
    if (m) milestone = m[1];
    const h = /^#### (BL-\d+)\s+(.*)$/.exec(line);
    if (h) {
      cur = { id: h[1], title: h[2].replace(/\s*\[(Critical|High)\]\s*$/, '').trim(), severity: (/\[(Critical|High)\]\s*$/.exec(h[2]) ?? [])[1] ?? null, section: milestone, body: [] };
      tasks.push(cur);
      continue;
    }
    if (/^#{1,3} /.test(line) && !/^#### /.test(line)) cur = null;
    if (cur) cur.body.push(line);
  }
  return tasks.map((t) => {
    const text = t.body.join('\n');
    const meta = /^- Status:.*$/m.exec(text)?.[0] ?? '';
    const status = /Status:\s*(.*?)\.\s+Mode:/.exec(meta)?.[1] ?? /Status:\s*([^.]*)/.exec(meta)?.[1] ?? '';
    const mode = (/Mode:\s*([a-z]+)/.exec(meta) ?? [])[1] ?? null;
    const owner = (/Owner:\s*(.*?)\.\s+(?:Milestone|Size|Depends)/.exec(meta) ?? /Owner:\s*([^.]*)/.exec(meta) ?? [])[1]?.trim() ?? null;
    const ms = (/Milestone:\s*(M\d+)(?:,\s*([^.]*))?/.exec(meta) ?? []);
    const dep = (/Depends on:\s*(.*?)(?:\.\s*$|\.\s+[A-Z]|$)/.exec(meta) ?? [])[1] ?? '';
    const satisfies = (/^- Satisfies:\s*(.*)$/m.exec(text) ?? [])[1] ?? '';
    const scope = (/^- Scope:\s*(.*)$/m.exec(text) ?? [])[1] ?? '';
    return {
      id: t.id,
      title: t.title,
      severity: t.severity,
      milestone: ms[1] ?? t.section,
      timing: ms[2]?.trim() ?? null,
      size: (/Size:\s*([A-Z]+)/.exec(meta) ?? [])[1] ?? null,
      statusRaw: status,
      status: statusWord(status),
      mode,
      owners: owner ? owner.split(/,\s*/).map((o) => o.trim()) : [],
      dependsOn: [...dep.matchAll(/BL-\d+/g)].map((x) => x[0]),
      blockedBy: status.startsWith('blocked') ? [...status.matchAll(/BL-\d+/g)].map((x) => x[0]) : [],
      satisfies: satisfies.slice(0, 240),
      scope: scope.slice(0, 280),
      source: 'backlog',
    };
  });
}

function build() {
  let tasks = parseBacklog();
  for (const t of overlay.tasks) tasks.push({ source: 'overlay', blockedBy: [], dependsOn: [], owners: [], satisfies: '', scope: '', ...t, status: statusWord(t.statusRaw ?? t.status ?? 'ready'), statusRaw: t.statusRaw ?? t.status ?? 'ready' });
  for (const t of tasks) {
    const o = overlay.overrides?.[t.id];
    if (o) Object.assign(t, o, { overridden: true });
  }
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const problems = [];
  const allDeps = (t) => [...new Set([...t.dependsOn, ...t.blockedBy])];
  for (const t of tasks) {
    const closed = ['done', 'superseded', 'deferred'].includes(t.status);
    if (!closed && !t.mode) problems.push(`${t.id}: no Mode parsed`);
    if (!closed && !t.owners.length) problems.push(`${t.id}: no Owner parsed`);
    for (const o of t.owners) if (!closed && !(o in agents.roles)) problems.push(`${t.id}: owner "${o}" has no entry in docs/release/agents.json`);
    for (const d of allDeps(t)) if (!byId.has(d)) problems.push(`${t.id}: depends on unknown ${d}`);
  }
  // levels by dependency depth (done tasks are level 0 and never block)
  const level = new Map();
  const visiting = new Set();
  const lv = (id) => {
    if (level.has(id)) return level.get(id);
    if (visiting.has(id)) { problems.push(`cycle through ${id}`); return 0; }
    visiting.add(id);
    const t = byId.get(id);
    const deps = t ? allDeps(t).filter((d) => byId.has(d) && byId.get(d).status !== 'done') : [];
    const l = t?.status === 'done' ? 0 : 1 + Math.max(0, ...deps.map(lv));
    visiting.delete(id);
    level.set(id, l);
    return l;
  };
  for (const t of tasks) t.level = lv(t.id);
  const dependents = new Map(tasks.map((t) => [t.id, []]));
  for (const t of tasks) for (const d of allDeps(t)) dependents.get(d)?.push(t.id);
  const transitive = (id, seen = new Set()) => { for (const n of dependents.get(id) ?? []) if (!seen.has(n)) { seen.add(n); transitive(n, seen); } return seen; };
  const open = (t) => !['done', 'superseded', 'deferred'].includes(t.status);
  for (const t of tasks) {
    t.unblocks = [...transitive(t.id)].filter((x) => open(byId.get(x))).length;
    const depsDone = allDeps(t).every((d) => byId.get(d)?.status === 'done' || byId.get(d)?.status === 'superseded');
    t.startable = t.status === 'ready' && depsDone;
    t.assignee = assign(t);
  }
  // Agent fence (D-041): until CI (BL-004) and branch protection (BL-005) are done, unattended runs take only
  // tasks under packages/* and docs/. Flag the rest; the founder can still start them attended.
  const fenceOpen = ['BL-004', 'BL-005'].every((id) => byId.get(id)?.status === 'done');
  for (const t of tasks) {
    const text = `${t.title} ${t.scope}`;
    t.touches = [/supabase|migration|\bRLS\b|database|\bDB\b/i.test(text) && 'supabase', /apps\/mobile|mobile app|mobile test|mobile harness/i.test(text) && 'apps/mobile', /apps\/web|website/i.test(text) && 'apps/web', /\bauth(entication)?\b|sign.?in/i.test(text) && 'auth'].filter(Boolean);
    t.fenced = !fenceOpen && t.touches.length > 0;
    t.needsMigrationLabel = t.touches.includes('supabase') || t.touches.includes('auth');
  }
  return { tasks, problems };
}

/** Who does it: a human for mode human, pair for mode pair, otherwise the agent for the first owner role. */
function assign(t) {
  if (!t.mode) return null;
  if (t.mode === 'human') return { kind: 'founder', agent: null };
  const role = t.owners.find((o) => agents.roles[o]) ?? t.owners[0];
  const agent = agents.roles[role]?.agent ?? null;
  const reviewer = agents.reviewer;
  return { kind: t.mode === 'pair' ? 'pair' : 'agent', role, agent, reviewer, support: t.owners.filter((o) => o !== role).map((o) => agents.roles[o]?.agent ?? o) };
}

function summarise({ tasks, problems }) {
  const open = tasks.filter((t) => !['done', 'superseded', 'deferred'].includes(t.status));
  const count = (f) => tasks.filter(f).length;
  const byMs = {};
  for (const t of tasks) (byMs[t.milestone ?? '?'] ??= []).push(t);
  return {
    generatedFrom: 'docs/BACKLOG.md + docs/release/overlay.json',
    totals: { tasks: tasks.length, open: open.length, done: count((t) => t.status === 'done'), startableNow: count((t) => t.startable), agent: count((t) => t.mode === 'agent'), human: count((t) => t.mode === 'human'), pair: count((t) => t.mode === 'pair'), blocked: count((t) => t.status === 'blocked'), needsDecision: count((t) => t.status === 'needs-decision') },
    problems,
    milestones: Object.fromEntries(Object.entries(byMs).map(([k, v]) => [k, { tasks: v.length, done: v.filter((t) => t.status === 'done').length }])),
    tasks,
  };
}

const startableOrder = (a, b) => (b.severity ? 1 : 0) - (a.severity ? 1 : 0) || b.unblocks - a.unblocks || a.id.localeCompare(b.id);

function markdown(p) {
  const out = [];
  out.push('# Release plan, iOS v1.0', '', '> Generated by `node scripts/plan.mjs` from `docs/BACKLOG.md` and `docs/release/overlay.json`. Do not edit by hand; edit the backlog or the overlay and regenerate.', '');
  const t = p.totals;
  out.push(`Tasks ${t.tasks} (${t.done} done, ${t.open} open). Startable now: ${t.startableNow}. By mode: agent ${t.agent}, human ${t.human}, pair ${t.pair}. Blocked ${t.blocked}, needs a decision ${t.needsDecision}.`, '');
  if (p.problems.length) out.push('## Problems found in the plan', '', ...p.problems.map((x) => `- ${x}`), '');
  out.push('## Startable now (agent mode, dependencies done)', '', '| Task | Title | Severity | Milestone | Size | Assignee | Unblocks | Fence |', '|---|---|---|---|---|---|---|---|');
  for (const x of p.tasks.filter((x) => x.startable && x.mode === 'agent').sort(startableOrder)) out.push(`| ${x.id} | ${x.title} | ${x.severity ?? ''} | ${x.milestone} | ${x.size ?? ''} | ${x.assignee?.agent ?? ''} | ${x.unblocks} | ${x.fenced ? 'attended only until BL-004 and BL-005' : ''}${x.needsMigrationLabel ? ' needs approve-migration' : ''} |`);
  out.push('', '## Founder tasks (human mode), in the order they block others', '', '| Task | Title | Milestone | Timing | Unblocks |', '|---|---|---|---|---|');
  for (const x of p.tasks.filter((x) => x.mode === 'human' && !['done', 'superseded'].includes(x.status)).sort((a, b) => b.unblocks - a.unblocks)) out.push(`| ${x.id} | ${x.title} | ${x.milestone} | ${x.timing ?? ''} | ${x.unblocks} |`);
  out.push('', '## Pair tasks (interactive session with the founder)', '', '| Task | Title | Milestone | Unblocks |', '|---|---|---|---|');
  for (const x of p.tasks.filter((x) => x.mode === 'pair' && !['done', 'superseded'].includes(x.status)).sort((a, b) => b.unblocks - a.unblocks)) out.push(`| ${x.id} | ${x.title} | ${x.milestone} | ${x.unblocks} |`);
  out.push('', '## Queue per agent (open tasks, earliest level first)', '');
  const queues = new Map();
  for (const x of p.tasks.filter((x) => x.mode !== 'human' && !['done', 'superseded', 'deferred'].includes(x.status))) {
    const key = x.assignee?.agent ?? 'unassigned';
    if (!queues.has(key)) queues.set(key, []);
    queues.get(key).push(x);
  }
  for (const [agent, list] of [...queues].sort((a, b) => b[1].length - a[1].length)) {
    list.sort((a, b) => a.level - b.level || b.unblocks - a.unblocks || a.id.localeCompare(b.id));
    out.push(`### ${agent} (${list.length})`, '', list.map((x) => `${x.id}${x.startable ? ' (start now)' : ''}${x.mode === 'pair' ? ' (pair)' : ''}`).join(', '), '');
  }
  out.push('', '## Sequence by dependency level', '', 'Level 1 has no open dependencies. A task can start when every task in a lower level that it depends on is done. Within a level, tasks in different areas run in parallel.', '');
  const levels = [...new Set(p.tasks.filter((x) => !['done', 'superseded', 'deferred'].includes(x.status)).map((x) => x.level))].sort((a, b) => a - b);
  for (const l of levels) {
    out.push(`### Level ${l}`, '', '| Task | Title | Mode | Assignee | Status |', '|---|---|---|---|---|');
    for (const x of p.tasks.filter((x) => x.level === l && !['done', 'superseded', 'deferred'].includes(x.status))) out.push(`| ${x.id} | ${x.title} | ${x.mode} | ${x.assignee?.kind === 'founder' ? 'founder' : (x.assignee?.agent ?? '')} | ${x.status} |`);
    out.push('');
  }
  return out.join('\n');
}

const plan = summarise(build());
const json = JSON.stringify(plan, null, 2) + '\n';
const md = markdown(plan) + '\n';
const arg = process.argv[2];
if (arg === '--check') {
  const stale = !existsSync(OUT_JSON) || readFileSync(OUT_JSON, 'utf8') !== json || !existsSync(OUT_MD) || readFileSync(OUT_MD, 'utf8') !== md;
  if (plan.problems.length) console.error(plan.problems.join('\n'));
  if (stale) console.error('docs/release/plan.json or PLAN.md is stale: run node scripts/plan.mjs');
  process.exit(plan.problems.length || stale ? 1 : 0);
} else if (arg === '--next') {
  const n = Number(process.argv[3] ?? 5);
  const picked = [];
  for (const x of plan.tasks.filter((x) => x.startable && x.mode === 'agent').sort(startableOrder)) {
    if (picked.length >= n) break;
    picked.push(x);
  }
  for (const x of picked) console.log(`${x.id}\t${x.severity ?? '-'}\t${x.assignee?.agent ?? '-'}\t${x.fenced ? 'FENCED(attended only)' : 'ok'}\t${x.title}`);
} else {
  writeFileSync(OUT_JSON, json);
  writeFileSync(OUT_MD, md);
  console.log(JSON.stringify(plan.totals), plan.problems.length ? `PROBLEMS: ${plan.problems.length}` : 'no problems');
}
