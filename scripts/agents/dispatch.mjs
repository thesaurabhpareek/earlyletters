#!/usr/bin/env node
// The dispatcher: decides what every agent works on next. Plain code, no model.
// Run by .github/workflows/agents.yml every 30 minutes, and by the founder's
// scheduled Claude task as a fallback lane (`--local --top 1 --claim`).
//
//   node scripts/agents/dispatch.mjs                 # GitHub Actions mode
//   node scripts/agents/dispatch.mjs --dry-run       # print the plan, write nothing
//   node scripts/agents/dispatch.mjs --board-only     # refresh the board, assign nothing
//   node scripts/agents/dispatch.mjs --local --top 1 --claim
//        local mode: no Actions API (running jobs are inferred from claims)
//
// Env: GH_TOKEN, GITHUB_REPOSITORY, GITHUB_RUN_ID, GITHUB_OUTPUT, AGENTS_PAUSED,
//      ONLY_AGENT, FORCE_TASK, FORCE_MODE, and which engines can run:
//      HAS_OPENROUTER_KEY + HAS_AGENTS_APP (opencode), HAS_ANTHROPIC_KEY (claude-code),
//      and whose comments count as agent messages: AGENTS_APP_CLIENT_ID, AGENTS_BOT_LOGINS.
import { appendFileSync } from "node:fs";
import { join } from "node:path";
import {
  ROOT, loadRoster, ownerMap, parseBacklog, eligibility, primaryOwner, takenIds,
  readState, writeState, repoSlug, gh, ghAll, labelNames, agentOfPR, readText, todayUTC,
  isFounderComment, standingChanged, trustContext, isTrusted, pendingTargets, handoffSettled,
  matchingPaths, stewardVerdict,
} from "./lib.mjs";
import { ensureLabels, ensureJournals, ensureBoard, findBoard } from "./bootstrap.mjs";

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n) => {
  const i = argv.indexOf(n);
  return i >= 0 ? argv[i + 1] : undefined;
};
const DRY = flag("--dry-run");
const BOARD_ONLY = flag("--board-only");
const LOCAL = flag("--local");
const TOP = Number(opt("--top") ?? Infinity);
const CLAIM = !LOCAL || flag("--claim");
const env = process.env;

const roster = loadRoster();
const repo = repoSlug(roster);
const trust = trustContext(roster, process.env);
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
state.standing ??= {};

const tasks = parseBacklog(readText(join(ROOT, "docs", "BACKLOG.md")));
const byId = new Map(tasks.map((t) => [t.id, t]));
const owners = ownerMap(roster);

const openPRs = ghAll(`/repos/${repo}/pulls?state=open`);
const taken = takenIds(openPRs);

// Open handoffs (agent-to-agent messages, docs/agents/AGENT-COMMS.md). Only
// issues opened by a trusted identity count; anything else is ignored.
const handoffs = ghAll(`/repos/${repo}/issues?state=open&labels=handoff`, { allowFail: true })
  .filter((i) => !i.pull_request && isTrusted(i, trust))
  .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  .map((issue) => {
    const comments = ghAll(`/repos/${repo}/issues/${issue.number}/comments`, { allowFail: true });
    return { issue, comments, pending: pendingTargets(issue, comments, trust) };
  });
const inbox = (handle) => handoffs.filter((h) => h.pending.includes(handle));

const running = LOCAL ? new Set() : runningAgents();
const developSha = gh(`/repos/${repo}/branches/${roster.base_branch}`, { allowFail: true })?.commit?.sha ?? "";

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
  const all = [...reviews, ...comments];
  const redTeam = all.find((c) => isTrusted(c, trust) && (c.body ?? "").includes(`red-team:${sha}`));
  const redVerdict = redTeam ? (redTeam.body.match(/Verdict:\s*([a-z ]+)/i)?.[1] ?? "").trim().toLowerCase() : undefined;
  const stewardFix = roster.agents
    .filter((a) => a.kind === "steward")
    .filter((a) => stewardVerdict(all, a.handle, sha, trust)?.startsWith("fix"))
    .map((a) => a.handle);
  const facts = { sha, failing, pending, founderNew, changesRequested, redTeam: !!redTeam, redVerdict, all, stewardFix };
  prCache.set(pr.number, facts);
  return facts;
}

const filesCache = new Map();
function prFiles(pr) {
  if (!filesCache.has(pr.number)) {
    filesCache.set(pr.number, ghAll(`/repos/${repo}/pulls/${pr.number}/files`, { allowFail: true }).map((f) => f.filename));
  }
  return filesCache.get(pr.number);
}

/** Open PRs this steward should review: they touch its review paths and lack its verdict for the head commit. */
function stewardTargets(agent) {
  return openPRs
    .filter((pr) => !pr.draft && agentOfPR(pr) !== agent.handle)
    .filter((pr) => matchingPaths(prFiles(pr), agent.review_paths).length)
    .filter((pr) => !stewardVerdict(prFacts(pr).all, agent.handle, pr.head.sha, trust))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

function attentionReasons(pr) {
  if (labelNames(pr).includes("needs:founder")) return [];
  const f = prFacts(pr);
  const reasons = [];
  if (f.failing.length) reasons.push(`failing checks: ${f.failing.join(", ")}`);
  if (f.changesRequested) reasons.push("founder requested changes");
  else if (f.founderNew.length) reasons.push("founder commented after the last commit");
  if (f.redVerdict?.startsWith("fix")) reasons.push("red team: fix first");
  if (f.stewardFix.length) reasons.push(`steward fix first: ${f.stewardFix.join(", ")}`);
  return reasons;
}

// ---------- plan ----------

const totalCap = roster.limits.max_runs_per_day_total;
const usedToday = () => Object.values(state.runs).reduce((s, n) => s + n, 0);
let slots = BOARD_ONLY ? 0 : Math.min(
  TOP,
  Math.max(0, roster.limits.max_parallel - running.size),
  Math.max(0, totalCap - usedToday()),
);

const paused = String(env.AGENTS_PAUSED ?? "").toLowerCase() === "true";
const yes = (v) => String(v ?? "").toLowerCase() === "true";
// What each engine still needs before it can run (empty = ready). The local
// lane runs inside a Claude session, so engines do not apply there.
const engineNeeds = {
  opencode: [!yes(env.HAS_OPENROUTER_KEY) && "the OPENROUTER_API_KEY secret", !yes(env.HAS_AGENTS_APP) && "the agents GitHub App"].filter(Boolean),
  "claude-code": [!yes(env.HAS_ANTHROPIC_KEY) && "the ANTHROPIC_API_KEY secret"].filter(Boolean),
};
const needsFor = (agent) => (LOCAL && !BOARD_ONLY ? [] : engineNeeds[agent.engine] ?? [`engine ${agent.engine}`]);
const noKey = roster.agents.every((a) => needsFor(a).length);
const status = paused ? "paused (repository variable AGENTS_PAUSED is true)"
  : noKey ? `waiting for ${[...new Set(roster.agents.flatMap(needsFor))].join(" and ")}`
  : "running";

const rows = [];
const assignments = [];
const reviewTargets = openPRs
  .filter((pr) => agentOfPR(pr) && agentOfPR(pr) !== "red-team" && !pr.draft)
  .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
const sensitive = (pr) => /supabase|auth|sign-?in|migration/i.test(`${pr.title} ${pr.head.ref}`);

// ONLY_AGENT: a comma-separated list of handles to assign; everyone else still appears on the board.
const only = env.ONLY_AGENT ? new Set(env.ONLY_AGENT.split(",").map((s) => s.trim()).filter(Boolean)) : null;

for (const agent of roster.agents) {
  const h = agent.handle;
  const mine = openPRs.filter((pr) => agentOfPR(pr) === h);
  const queue = tasks.filter(
    (t) => primaryOwner(t, owners) === h && !taken.has(t.id) && !claimedTasks.has(t.id) && eligibility(t, byId).ok,
  );
  const row = { agent, open: mine.length, queue: queue.length, inbox: inbox(h).length, now: "" };
  rows.push(row);

  const claim = state.claims[h];
  if (running.has(h) || claim) {
    const c = claim ?? {};
    row.now = `working: ${describe(c) || "run in progress"}`;
    continue;
  }
  const runsToday = state.runs[h] ?? 0;
  if (runsToday >= agent.daily_runs) { row.now = `idle: used ${runsToday}/${agent.daily_runs} runs today`; continue; }
  const needs = needsFor(agent);
  if (slots <= 0 || paused || needs.length || (only && !only.has(h))) {
    row.now = `ready: ${nextWork(agent, mine, queue)?.label ?? "standing duty"}${needs.length && !paused ? ` (needs ${needs.join(" and ")})` : ""}`;
    continue;
  }

  const work = env.FORCE_TASK && only?.has(h)
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
    engine: agent.engine,
    engine_version: roster.engines?.[agent.engine]?.version ?? "",
    model: agent.model,
    max_turns: agent.max_turns,
    timeout: agent.timeout_minutes,
    budget: agent.max_budget_usd,
    effort: agent.effort,
  };
  assignments.push(a);
  slots--;
  state.runs[h] = runsToday + 1;
  if (CLAIM) {
    state.claims[h] = { mode: a.mode, task: a.task, pr: a.pr, at: now.toISOString(), run: runId, source: LOCAL ? "local" : "actions" };
  }
  if (a.task && a.mode === "task") claimedTasks.add(a.task);
  if (a.mode === "digest") state.lastDigest = today;
  if (a.mode === "standing") state.standing[h] = { develop: developSha, at: now.toISOString() };
  row.now = `starting: ${work.label}`;
}

function nextWork(agent, mine, queue) {
  const h = agent.handle;
  // 1. Fix my own open PRs first.
  for (const pr of mine) {
    const reasons = attentionReasons(pr);
    if (reasons.length) return { mode: "maintain", pr: pr.number, reason: reasons.join("; "), label: `maintain #${pr.number}` };
  }
  // 2. Answer handoffs addressed to me (oldest first). Other agents are waiting.
  const waiting = inbox(h)[0];
  if (waiting) {
    return { mode: "handoff", task: `#${waiting.issue.number}`, reason: waiting.issue.title, label: `handoff #${waiting.issue.number}` };
  }
  // 3. Kind-specific work.
  if (agent.kind === "steward") {
    const pick = stewardTargets(agent)[0];
    if (pick) return { mode: "steward-review", pr: pick.number, reason: pick.title, label: `steward review #${pick.number}` };
  }
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
  // 4. Backlog task, then standing duty, but only if something changed since
  //    this agent's last standing run (saves a run that would find nothing new).
  if (queue.length) return { mode: "task", task: queue[0].id, reason: queue[0].title, label: `task ${queue[0].id}` };
  if (!standingChanged(state.standing[h], developSha, founderNotesSince(h, state.standing[h]?.at))) return undefined;
  return { mode: "standing", label: "standing duty" };
}

function idleReason(agent, mine) {
  if (agent.kind === "digest") return state.lastDigest === today ? "today's digest is done" : "digest not due yet";
  if (mine.length >= agent.wip_limit) return `waiting for founder review (${mine.length}/${agent.wip_limit} open PRs)`;
  if (state.standing[agent.handle]) return "nothing changed since its last standing run";
  return "nothing to do";
}

function founderNotesSince(handle, at) {
  const j = journals.get(handle);
  if (!at || !j?.number) return 0;
  const comments = gh(`/repos/${repo}/issues/${j.number}/comments?since=${at}&per_page=100`, { allowFail: true }) ?? [];
  return comments.filter((c) => isFounderComment(c, roster)).length;
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
    "| Agent | Engine and model | Now | Runs today | Open PRs | Ready tasks | Handoffs waiting |",
    "|---|---|---|---|---|---|---|",
  ];
  for (const r of rows) {
    const j = journals.get(r.agent.handle);
    const name = j ? `[\`${r.agent.handle}\`](${j.html_url})` : `\`${r.agent.handle}\``;
    const engine = `${r.agent.engine}: ${String(r.agent.model).replace(/^openrouter\//, "")}`;
    lines.push(`| ${name} ${r.agent.title} | ${engine} | ${r.now} | ${state.runs[r.agent.handle] ?? 0}/${r.agent.daily_runs} | ${r.open} | ${r.agent.backlog_owner_names.length ? r.queue : "n/a"} | ${r.inbox} |`);
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
  lines.push("", "## Agent conversations", "");
  const pendingAll = handoffs.filter((x) => x.pending.length);
  lines.push(`- **Open handoffs:** ${handoffs.length}; **waiting for a reply:** ${pendingAll.length}.`);
  for (const x of pendingAll.slice(0, 10)) {
    const days = Math.floor((now - new Date(x.issue.created_at)) / 86_400_000);
    lines.push(`- #${x.issue.number} ${x.issue.title} (waiting on ${x.pending.map((p) => `\`${p}\``).join(", ")}, ${days}d)`);
  }
  if (closedHandoffs.length) lines.push(`- Closed this tick (every recipient replied): ${closedHandoffs.map((n) => `#${n}`).join(", ")}`);
  if (!trust.appClientId && trust.bots.size <= 1) lines.push("- Note: neither `AGENTS_APP_CLIENT_ID` nor `AGENTS_BOT_LOGINS` reached the dispatcher, so agent messages from the agents GitHub App are not recognised yet.");
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

// ---------- close settled handoffs ----------

const closedHandoffs = [];
for (const x of handoffs) {
  if (!handoffSettled(x.issue, x.comments, trust, now)) continue;
  closedHandoffs.push(x.issue.number);
  if (DRY) continue;
  gh(`/repos/${repo}/issues/${x.issue.number}/comments`, {
    method: "POST",
    body: { body: "Closed by the dispatcher: every recipient replied at least 48 hours ago. Reopen it, or comment, to continue." },
    allowFail: true,
  });
  gh(`/repos/${repo}/issues/${x.issue.number}`, { method: "PATCH", body: { state: "closed", state_reason: "completed" }, allowFail: true });
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
