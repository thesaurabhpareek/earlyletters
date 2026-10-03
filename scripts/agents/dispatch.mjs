#!/usr/bin/env node
// The dispatcher: decides what every agent works on next. Plain code, no model.
// Run by .github/workflows/agents.yml every 30 minutes, and by the founder's
// scheduled Claude task as a fallback lane (`--local --top 1 --claim`).
//
//   node scripts/agents/dispatch.mjs                 # GitHub Actions mode
//   node scripts/agents/dispatch.mjs --dry-run       # print the plan, write nothing
//   node scripts/agents/dispatch.mjs --local --top 1 --claim
//        local mode: no Actions API (running jobs are inferred from claims)
//
// Env: GH_TOKEN, GITHUB_REPOSITORY, GITHUB_RUN_ID, GITHUB_OUTPUT,
//      HAS_MODEL_KEY ("true" when ANTHROPIC_API_KEY is set), AGENTS_PAUSED,
//      ONLY_AGENT, FORCE_TASK, FORCE_MODE.
import { appendFileSync } from "node:fs";
import { join } from "node:path";
import {
  ROOT, loadRoster, ownerMap, parseBacklog, eligibility, primaryOwner, takenIds,
  readState, writeState, repoSlug, gh, ghAll, labelNames, agentOfPR, readText, todayUTC,
  isFounderComment,
} from "./lib.mjs";
import { ensureLabels, ensureJournals, ensureBoard, findBoard } from "./bootstrap.mjs";

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n) => {
  const i = argv.indexOf(n);
  return i >= 0 ? argv[i + 1] : undefined;
};
const DRY = flag("--dry-run");
const LOCAL = flag("--local");
const TOP = Number(opt("--top") ?? Infinity);
const CLAIM = !LOCAL || flag("--claim");
const env = process.env;

const roster = loadRoster();
const repo = repoSlug(roster);
const now = new Date();
const today = todayUTC(now);
const runId = env.GITHUB_RUN_ID ?? `local-${now.getTime()}`;

// ---------- gather ----------

if (!DRY) {
  ensureLabels(repo, roster);
}
const journals = DRY
  ? ensureJournals(repo, roster, { dryRun: true }).byHandle
  : ensureJournals(repo, roster).byHandle;
const board = DRY ? findBoard(repo) : ensureBoard(repo).board;

const state = readState(board?.body);
if (state.day !== today) {
  state.day = today;
  state.runs = {};
}
state.runs ??= {};
state.claims ??= {};

const tasks = parseBacklog(readText(join(ROOT, "docs", "BACKLOG.md")));
const byId = new Map(tasks.map((t) => [t.id, t]));
const owners = ownerMap(roster);

const openPRs = ghAll(`/repos/${repo}/pulls?state=open`);
const taken = takenIds(openPRs);

const running = LOCAL ? new Set() : runningAgents();

// Drop claims that have ended: their job is no longer running (Actions mode)
// or they are older than the agent's timeout plus grace (both modes).
const grace = (roster.limits.claim_grace_minutes ?? 20) * 60_000;
for (const [handle, c] of Object.entries(state.claims)) {
  const agent = roster.agents.find((a) => a.handle === handle);
  const ageMs = now - new Date(c.at);
  const expired = !agent || ageMs > (agent.timeout_minutes * 60_000 + grace);
  const finished = !LOCAL && c.source === "actions" && !running.has(handle) && ageMs > 10 * 60_000;
  if (expired || finished) delete state.claims[handle];
}
const claimedTasks = new Set(Object.values(state.claims).map((c) => c.task).filter(Boolean));

// ---------- per-PR facts (lazy, cached) ----------

const prCache = new Map();
function prFacts(pr) {
  if (prCache.has(pr.number)) return prCache.get(pr.number);
  const sha = pr.head.sha;
  const checks = gh(`/repos/${repo}/commits/${sha}/check-runs?per_page=100`, { allowFail: true })?.check_runs ?? [];
  const failing = checks
    .filter((c) => c.status === "completed" && ["failure", "timed_out", "action_required"].includes(c.conclusion))
    .map((c) => c.name)
    .filter((n) => !/^agent /.test(n) && n !== "plan");
  const pending = checks.some((c) => c.status !== "completed");
  const commit = gh(`/repos/${repo}/commits/${sha}`, { allowFail: true });
  const headAt = new Date(commit?.commit?.committer?.date ?? pr.updated_at);
  const reviews = ghAll(`/repos/${repo}/pulls/${pr.number}/reviews`, { allowFail: true });
  const comments = ghAll(`/repos/${repo}/issues/${pr.number}/comments`, { allowFail: true });
  const founderNew = [...reviews, ...comments].filter(
    (c) => isFounderComment(c, roster) && new Date(c.submitted_at ?? c.created_at) > headAt,
  );
  const changesRequested = reviews.some(
    (r) => isFounderComment(r, roster) && r.state === "CHANGES_REQUESTED" && new Date(r.submitted_at) > headAt,
  );
  const redTeam = [...reviews, ...comments].find((c) => (c.body ?? "").includes(`red-team:${sha}`));
  const redVerdict = redTeam ? (redTeam.body.match(/Verdict:\s*([a-z ]+)/i)?.[1] ?? "").trim().toLowerCase() : undefined;
  const facts = { sha, failing, pending, founderNew, changesRequested, redTeam: !!redTeam, redVerdict };
  prCache.set(pr.number, facts);
  return facts;
}

function attentionReasons(pr) {
  if (labelNames(pr).includes("needs:founder")) return [];
  const f = prFacts(pr);
  const reasons = [];
  if (f.failing.length) reasons.push(`failing checks: ${f.failing.join(", ")}`);
  if (f.changesRequested) reasons.push("founder requested changes");
  else if (f.founderNew.length) reasons.push("founder commented after the last commit");
  if (f.redVerdict?.startsWith("fix")) reasons.push("red team: fix first");
  return reasons;
}

// ---------- plan ----------

const totalCap = roster.limits.max_runs_per_day_total;
const usedToday = () => Object.values(state.runs).reduce((s, n) => s + n, 0);
let slots = Math.min(
  TOP,
  Math.max(0, roster.limits.max_parallel - running.size),
  Math.max(0, totalCap - usedToday()),
);

const paused = String(env.AGENTS_PAUSED ?? "").toLowerCase() === "true";
const noKey = !LOCAL && String(env.HAS_MODEL_KEY ?? "").toLowerCase() !== "true";
const status = paused ? "paused (repository variable AGENTS_PAUSED is true)"
  : noKey ? "waiting for the ANTHROPIC_API_KEY secret"
  : "running";

const rows = [];
const assignments = [];
const reviewTargets = openPRs
  .filter((pr) => agentOfPR(pr) && agentOfPR(pr) !== "red-team" && !pr.draft)
  .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
const sensitive = (pr) => /supabase|auth|sign-?in|migration/i.test(`${pr.title} ${pr.head.ref}`);

for (const agent of roster.agents) {
  if (env.ONLY_AGENT && env.ONLY_AGENT !== agent.handle) continue;
  const h = agent.handle;
  const mine = openPRs.filter((pr) => agentOfPR(pr) === h);
  const queue = tasks.filter(
    (t) => primaryOwner(t, owners) === h && !taken.has(t.id) && !claimedTasks.has(t.id) && eligibility(t, byId).ok,
  );
  const row = { agent, open: mine.length, queue: queue.length, now: "" };
  rows.push(row);

  const claim = state.claims[h];
  if (running.has(h) || claim) {
    const c = claim ?? {};
    row.now = `working: ${describe(c) || "run in progress"}`;
    continue;
  }
  const runsToday = state.runs[h] ?? 0;
  if (runsToday >= agent.daily_runs) { row.now = `idle: used ${runsToday}/${agent.daily_runs} runs today`; continue; }
  if (slots <= 0 || paused || noKey) { row.now = `ready: ${nextWork(agent, mine, queue)?.label ?? "standing duty"}`; continue; }

  const work = env.FORCE_TASK && env.ONLY_AGENT === h
    ? { mode: env.FORCE_MODE || "task", task: env.FORCE_TASK, label: `${env.FORCE_MODE || "task"} ${env.FORCE_TASK}` }
    : nextWork(agent, mine, queue);
  if (!work) { row.now = `idle: ${idleReason(agent, mine)}`; continue; }

  const a = {
    agent: h,
    mode: work.mode,
    task: work.task ?? "",
    pr: work.pr ? String(work.pr) : "",
    reason: work.reason ?? "",
    journal: String(journals.get(h)?.number ?? ""),
    model: agent.model,
    max_turns: agent.max_turns,
    timeout: agent.timeout_minutes,
  };
  assignments.push(a);
  slots--;
  state.runs[h] = runsToday + 1;
  if (CLAIM) {
    state.claims[h] = { mode: a.mode, task: a.task, pr: a.pr, at: now.toISOString(), run: runId, source: LOCAL ? "local" : "actions" };
  }
  if (a.task) claimedTasks.add(a.task);
  if (a.mode === "digest") state.lastDigest = today;
  row.now = `starting: ${work.label}`;
}

function nextWork(agent, mine, queue) {
  const h = agent.handle;
  // 1. Fix my own open PRs first.
  for (const pr of mine) {
    const reasons = attentionReasons(pr);
    if (reasons.length) return { mode: "maintain", pr: pr.number, reason: reasons.join("; "), label: `maintain #${pr.number}` };
  }
  // 2. Kind-specific work.
  if (agent.kind === "reviewer") {
    const candidates = reviewTargets.filter((pr) => !prFacts(pr).redTeam && !prFacts(pr).pending);
    const pick = candidates.find(sensitive) ?? candidates[0];
    if (pick) return { mode: "review", pr: pick.number, reason: `${agentOfPR(pick)}: ${pick.title}`, label: `review #${pick.number}` };
  }
  if (agent.kind === "digest") {
    const due = state.lastDigest !== today && now.getUTCHours() >= (roster.limits.digest_hour_utc ?? 14);
    return due ? { mode: "digest", label: "digest" } : undefined;
  }
  if (mine.length >= agent.wip_limit) return undefined;
  // 3. Backlog task, then standing duty.
  if (queue.length) return { mode: "task", task: queue[0].id, reason: queue[0].title, label: `task ${queue[0].id}` };
  return { mode: "standing", label: "standing duty" };
}

function idleReason(agent, mine) {
  if (agent.kind === "digest") return state.lastDigest === today ? "today's digest is done" : "digest not due yet";
  if (mine.length >= agent.wip_limit) return `waiting for founder review (${mine.length}/${agent.wip_limit} open PRs)`;
  return "nothing to do";
}

function describe(c) {
  if (!c?.mode) return "";
  return [c.mode, c.task, c.pr ? `#${c.pr}` : ""].filter(Boolean).join(" ") + (c.at ? ` since ${c.at.slice(11, 16)} UTC` : "");
}

// ---------- spend (from run receipts posted today) ----------

function spendToday() {
  const comments = ghAll(`/repos/${repo}/issues/comments?since=${today}T00:00:00Z&sort=created`, { allowFail: true });
  let cost = 0;
  let n = 0;
  for (const c of comments) {
    const m = (c.body ?? "").match(/<!-- receipt run:\S+ agent:\S+ cost:([0-9.]+) -->/);
    if (m) { cost += Number(m[1]); n++; }
  }
  return { cost, n };
}

// ---------- running jobs (Actions API) ----------

function runningAgents() {
  const set = new Set();
  for (const s of ["in_progress", "queued"]) {
    const runs = gh(`/repos/${repo}/actions/workflows/agents.yml/runs?status=${s}&per_page=50`, { allowFail: true })?.workflow_runs ?? [];
    for (const r of runs) {
      if (String(r.id) === String(env.GITHUB_RUN_ID)) continue;
      const jobs = gh(`/repos/${repo}/actions/runs/${r.id}/jobs?per_page=100`, { allowFail: true })?.jobs ?? [];
      for (const j of jobs) {
        const m = j.status !== "completed" && j.name.match(/^agent ([a-z0-9-]+)/);
        if (m) set.add(m[1]);
      }
    }
  }
  return set;
}

// ---------- board ----------

function renderBoard() {
  const spend = DRY ? { cost: 0, n: 0 } : spendToday();
  const runUrl = env.GITHUB_RUN_ID
    ? `https://github.com/${repo}/actions/runs/${env.GITHUB_RUN_ID}`
    : "a local dispatcher run";
  const lines = [
    "# Agent board",
    "",
    `Updated ${now.toISOString().slice(0, 16).replace("T", " ")} UTC by ${env.GITHUB_RUN_ID ? `[the dispatcher](${runUrl})` : runUrl}. Status: **${status}**.`,
    `Runs today: **${usedToday()} of ${totalCap}**. Estimated spend today: **$${spend.cost.toFixed(2)}** from ${spend.n} run receipts.`,
    "",
    "| Agent | Now | Runs today | Open PRs | Ready tasks |",
    "|---|---|---|---|---|",
  ];
  for (const r of rows) {
    const j = journals.get(r.agent.handle);
    const name = j ? `[\`${r.agent.handle}\`](${j.html_url})` : `\`${r.agent.handle}\``;
    lines.push(`| ${name} ${r.agent.title} | ${r.now} | ${state.runs[r.agent.handle] ?? 0}/${r.agent.daily_runs} | ${r.open} | ${r.agent.backlog_owner_names.length ? r.queue : "n/a"} |`);
  }
  const forFounder = openPRs.filter((pr) => agentOfPR(pr) && !pr.draft && !attentionReasonsSafe(pr).length);
  const needsFounder = openPRs.filter((pr) => labelNames(pr).includes("needs:founder"));
  const decisions = tasks.filter((t) => t.status === "needs-decision");
  const human = tasks.filter((t) => t.mode === "human" && t.status === "ready");
  lines.push("", "## Needs the founder", "");
  lines.push(`- **PRs ready for your review (${forFounder.length}):** ${forFounder.map((pr) => `#${pr.number} (${agentOfPR(pr)}${redLabel(pr)})`).join(", ") || "none"}`);
  lines.push(`- **PRs blocked on you (${needsFounder.length}):** ${needsFounder.map((pr) => `#${pr.number}`).join(", ") || "none"}`);
  lines.push(`- **Backlog decisions (${decisions.length}):** ${decisions.map((t) => t.id).join(", ") || "none"}`);
  lines.push(`- **Founder tasks ready (${human.length}):** ${human.map((t) => t.id).join(", ") || "none"}`);
  lines.push("", "Pause everything: set the repository variable `AGENTS_PAUSED` to `true`. Change caps and models in `agents/roster.json`.");
  lines.push("", writeState(state));
  return lines.join("\n");
}

function attentionReasonsSafe(pr) {
  try { return attentionReasons(pr); } catch { return []; }
}
function redLabel(pr) {
  const v = prCache.get(pr.number)?.redVerdict;
  return v ? `, red team: ${v}` : "";
}

// ---------- output ----------

const body = renderBoard();
if (!DRY && board) {
  gh(`/repos/${repo}/issues/${board.number}`, { method: "PATCH", body: { body } });
}

const out = JSON.stringify(assignments);
if (env.GITHUB_OUTPUT) {
  appendFileSync(env.GITHUB_OUTPUT, `assignments=${out}\ncount=${assignments.length}\n`);
}
if (env.GITHUB_STEP_SUMMARY) {
  appendFileSync(env.GITHUB_STEP_SUMMARY, body.replace(/<!-- agents-state:[^>]+ -->/, "") + "\n");
}
console.log(DRY ? body.replace(/<!-- agents-state:[^>]+ -->/, "") : `status: ${status}`);
console.log(JSON.stringify(assignments, null, 2));
