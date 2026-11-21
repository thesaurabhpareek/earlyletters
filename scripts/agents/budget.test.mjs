// Usage budget across lanes (H3). Fixtures only, no network. Run: node --test 'scripts/agents/*.test.mjs'
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  loadBudget, validateBudget, activeProfile, effective, laneOfRun, usageFromRows,
  usageFromComments, canRun, blockedReason, _resetTick,
} from "./budget.mjs";
import { loadRoster } from "./lib.mjs";

const NOW = new Date("2026-10-28T15:00:00Z");
const DAY = "2026-10-28";
const cfg = () => ({
  version: 1,
  daily_total: { runs: 10, cost_usd: 20 },
  reserved_interactive_share: 0.5,
  lanes: {
    interactive: { interactive: true },
    actions: { runs: 4, cost_usd: 8 },
    local: { runs: 3, cost_usd: 6 },
    "sched-4h": { runs: 3, cost_usd: 6 },
    "docs-daily": { runs: 1, cost_usd: 2 },
    "prd-daily": { runs: 1, cost_usd: 2 },
  },
  profiles: {
    "freeze-week": {
      reserved_interactive_share: 0.8,
      lanes: { actions: { runs: 1 }, "docs-daily": { runs: 0 }, "prd-daily": { runs: 0, cost_usd: 0 } },
    },
  },
  profile_windows: [],
});
const row = (run, cost, at = `${DAY}T10:00:00Z`, agent = "qa") => ({ kind: "receipt", run, agent, at, cost_usd: cost });
const usage = (rows, c = cfg()) => usageFromRows(rows, c, DAY);
const verdict = (lane, rows, extra = {}) => canRun(lane, { config: extra.config ?? cfg(), usage: usage(rows, extra.config ?? cfg()), now: extra.now ?? NOW, ...extra });

test("the committed agents/budget.json is valid and stays within the roster's daily cap", () => {
  const b = loadBudget();
  assert.deepEqual(validateBudget(b), []);
  assert.ok(b.daily_total.runs <= loadRoster().limits.max_runs_per_day_total, "budget total must not exceed roster limits.max_runs_per_day_total");
  assert.ok(b.profiles["freeze-week"], "a freeze-week profile exists");
  assert.ok(Object.values(b.lanes).some((l) => l.interactive), "an interactive lane exists");
});

test("validation catches bad shares, unknown profile lanes and windows without a D-id", () => {
  const c = cfg();
  c.reserved_interactive_share = 1.5;
  c.profiles["freeze-week"].lanes.ghost = { runs: 1 };
  c.profile_windows = [{ profile: "freeze-week", from: "2026-11-03", until: "2026-11-02", reason: "" }];
  const errors = validateBudget(c).join("\n");
  assert.match(errors, /reserved_interactive_share/);
  assert.match(errors, /lane "ghost" is not in lanes/);
  assert.match(errors, /from must be before until/);
  assert.match(errors, /reason is required/);
  assert.match(errors, /decided_by must be a D-id/);
});

test("run ids map to lanes; unknown shapes are unattributed", () => {
  const c = cfg();
  assert.equal(laneOfRun("18734455120", c), "actions");
  assert.equal(laneOfRun("local", c), "local");
  assert.equal(laneOfRun("local-1730120000000", c), "local");
  assert.equal(laneOfRun("docs-daily~2026-10-28", c), "docs-daily");
  assert.equal(laneOfRun("interactive~session-a", c), "interactive");
  assert.equal(laneOfRun("nolane~x", c), "unattributed");
  assert.equal(laneOfRun("sched-12345", c), "unattributed", "a sched- stamp that is neither shape is unattributed");
  assert.equal(laneOfRun("abc", c), "unattributed");
});

test("scheduled run ids: sched-<YYYYMMDDHHMM> is sched-4h, sched-<YYYYMMDD> is docs-daily", () => {
  const c = cfg();
  assert.equal(laneOfRun("sched-202610281345", c), "sched-4h");
  assert.equal(laneOfRun("sched-20261028", c), "docs-daily");
  const noLanes = { ...c, lanes: { actions: c.lanes.actions } };
  assert.equal(laneOfRun("sched-202610281345", noLanes), "unattributed", "only mapped when the lane is configured");
  assert.equal(laneOfRun("sched-20261028", noLanes), "unattributed");
});

test("sched-4h: its receipts count against its own cap, and AGENTS_LANE=sched-4h is that lane", () => {
  const rows = [row("sched-202610280145", 0.5), row("sched-202610280545", 0.5), row("sched-202610280945", 0.5)];
  const v = verdict("sched-4h", rows);
  assert.equal(v.ok, false);
  assert.match(v.reason, /lane sched-4h: 3 of 3 runs used today/);
  assert.equal(verdict("local", rows).ok, true, "the local lane is not charged for sched-4h runs");
  const docs = verdict("docs-daily", [row("sched-20261028", 1)]);
  assert.equal(docs.ok, false);
  assert.match(docs.reason, /lane docs-daily: 1 of 1 runs used today/);

  _resetTick();
  const ctx = { now: NOW, runId: "local-9", LOCAL: true, env: { AGENTS_LANE: "sched-4h" }, repo: "o/r", roster: { founder: "founder" },
    ghAll: () => [{ user: { login: "founder", type: "User" }, created_at: `${DAY}T05:46:00Z`, html_url: "u",
      body: "<!-- receipt run:sched-202610280545 agent:qa cost:unknown --> Run receipt." }] };
  assert.match(blockedReason(ctx, { handle: "qa" }, { mode: "task" }, { config: cfg() }), /^budget: lane sched-4h: 1 run\(s\) today with unknown cost/);
  _resetTick();
});

test("prd-daily~<YYYYMMDD> is prd-daily; the docs run's per-agent receipts each count", () => {
  const c = cfg();
  assert.equal(laneOfRun("prd-daily~20261028", c), "prd-daily");
  assert.equal(laneOfRun("sched-prd-20261028", c), "unattributed", "the retired sched-prd- shape is not mapped");
  const prd = [row("prd-daily~20261028", 0.4, undefined, "prd-daily")];
  const v = verdict("prd-daily", prd);
  assert.equal(v.ok, false);
  assert.match(v.reason, /lane prd-daily: 1 of 1 runs used today/);
  assert.equal(verdict("docs-daily", prd).ok, true, "the docs lane is not charged for the PRD run");

  // The docs run uses one stamp for both agents; each agent's receipt is a run.
  const docs2 = { ...c, lanes: { ...c.lanes, "docs-daily": { runs: 2, cost_usd: 4 } } };
  const one = [row("sched-20261028", 0.5, undefined, "decision-records")];
  assert.equal(canRun("docs-daily", { config: docs2, usage: usageFromRows(one, docs2, DAY), now: NOW }).ok, true);
  const two = [...one, row("sched-20261028", 0.5, undefined, "reference-docs")];
  const u = usageFromRows(two, docs2, DAY);
  assert.equal(u.lanes["docs-daily"].runs, 2);
  assert.match(canRun("docs-daily", { config: docs2, usage: u, now: NOW }).reason, /lane docs-daily: 2 of 2 runs used today/);

  const freeze = { ...c, profile_windows: [{ profile: "freeze-week", from: "2026-11-02", until: "2026-11-09", reason: "release freeze", decided_by: "D-120" }] };
  const inWeek = new Date("2026-11-03T13:00:00Z");
  const f = canRun("prd-daily", { config: freeze, usage: usageFromRows([], freeze, "2026-11-03"), now: inWeek });
  assert.equal(f.ok, false);
  assert.match(f.reason, /lane prd-daily: 0 of 0 runs used today \(freeze-week profile\)/);
});

test("the committed budget: prd-daily once a day, docs-daily twice, both 0 in freeze week", () => {
  const b = loadBudget();
  assert.equal(b.lanes["prd-daily"].runs, 1);
  assert.ok(b.lanes["prd-daily"].cost_usd <= 2, "conservative cost cap");
  assert.equal(b.profiles["freeze-week"].lanes["prd-daily"].runs, 0);
  assert.equal(laneOfRun("prd-daily~20261028", b), "prd-daily");
  assert.equal(b.lanes["docs-daily"].runs, 2, "the docs run writes one receipt per agent, up to 2 a day");
  assert.equal(b.profiles["freeze-week"].lanes["docs-daily"].runs, 0);
});

test("the committed budget names the sched-4h lane that PR #328's agent-lane prompt sets", () => {
  const b = loadBudget();
  assert.ok(b.lanes["sched-4h"] && !b.lanes["sched-4h"].interactive);
  assert.ok(b.lanes["sched-4h"].runs <= 6, "conservative: at most one run per 4-hourly firing");
  assert.equal(laneOfRun("sched-202610281345", b), "sched-4h");
  assert.equal(laneOfRun("sched-20261028", b), "docs-daily");
});

test("usage counts today's receipts once each and splits scheduled from all", () => {
  const u = usage([
    row("1", 1.5), row("1", 1.5), row("2", 0.5),
    row("interactive~a", 3), row("weird", 1),
    row("3", 9, "2026-10-27T23:59:00Z"),
  ]);
  assert.deepEqual(u.lanes.actions, { runs: 2, cost_usd: 2, unknown: 0 });
  assert.deepEqual(u.scheduled, { runs: 3, cost_usd: 3, unknown: 0 }, "unattributed counts in the scheduled pool");
  assert.deepEqual(u.all, { runs: 4, cost_usd: 6, unknown: 0 });
});

test("within budget: a lane may run and the remaining headroom is the tightest cap", () => {
  const v = verdict("actions", [row("1", 1)]);
  assert.equal(v.ok, true);
  assert.deepEqual(v.remaining, { runs: 3, cost_usd: 7 });
});

test("cap reached: the lane's run cap and cost cap each block it", () => {
  const runs = verdict("local", [row("local-1", 0.1), row("local-2", 0.1), row("local-3", 0.1)]);
  assert.equal(runs.ok, false);
  assert.match(runs.reason, /lane local: 3 of 3 runs used today/);
  const cost = verdict("actions", [row("1", 8)]);
  assert.equal(cost.ok, false);
  assert.match(cost.reason, /lane actions: \$8\.00 of \$8\.00 spent today/);
  assert.equal(verdict("local", [row("1", 8)]).ok, true, "another lane's spend does not count against this lane's cap");
});

test("pending runs approved this tick count before their receipts exist", () => {
  const v = verdict("local", [row("local-1", 0.1)], { pending: { runs: 2 } });
  assert.equal(v.ok, false);
  assert.match(v.reason, /3 of 3 runs/);
});

test("reserved share: scheduled lanes together stop at the pool, leaving the rest for interactive work", () => {
  // Pool = floor(10 * 0.5) = 5 runs. Each lane is under its own cap.
  const rows = [row("1", 0.1), row("2", 0.1), row("3", 0.1), row("local-1", 0.1), row("local-2", 0.1)];
  const v = verdict("docs-daily", rows);
  assert.equal(v.ok, false);
  assert.match(v.reason, /scheduled lanes: 5 of 5 runs used today; the other 50% is kept for interactive build work/);
  assert.equal(verdict("interactive", rows).ok, true, "interactive is never blocked");
});

test("reserved share: interactive work past its share makes scheduled lanes yield at the daily total", () => {
  const rows = [row("1", 0.1), ...Array.from({ length: 9 }, (_, i) => row(`interactive~${i}`, 0.1))];
  const v = verdict("local", rows);
  assert.equal(v.ok, false);
  assert.match(v.reason, /daily total: 10 of 10 runs used today, interactive work included/);
  assert.equal(verdict("interactive", rows).ok, true);
});

test("freeze profile: a dated window raises the reserve and cuts lane caps; it lapses on its until date", () => {
  const c = cfg();
  c.profile_windows = [{ profile: "freeze-week", from: "2026-11-02", until: "2026-11-09", reason: "release freeze", decided_by: "D-120" }];
  assert.deepEqual(validateBudget(c), []);
  const inWeek = new Date("2026-11-03T13:00:00Z");
  assert.equal(activeProfile(c, inWeek).name, "freeze-week");
  assert.equal(activeProfile(c, new Date("2026-11-09T00:00:00Z")).name, "normal");
  assert.equal(activeProfile(c, NOW).name, "normal");
  const eff = effective(c, inWeek);
  assert.deepEqual(eff.pool, { runs: 2, cost_usd: 4 });
  assert.equal(eff.lanes.local.runs, 3, "lanes the profile does not name keep their caps");

  const day = "2026-11-03";
  const u = (rows) => usageFromRows(rows, c, day);
  const at = `${day}T12:00:00Z`;
  const docs = canRun("docs-daily", { config: c, usage: u([]), now: inWeek });
  assert.equal(docs.ok, false);
  assert.match(docs.reason, /lane docs-daily: 0 of 0 runs used today \(freeze-week profile\)/);
  const actions = canRun("actions", { config: c, usage: u([row("1", 0.1, at)]), now: inWeek });
  assert.match(actions.reason, /1 of 1 runs.*freeze-week/);
  const pool = canRun("local", { config: c, usage: u([row("1", 0.1, at), row("local-1", 0.1, at)]), now: inWeek });
  assert.equal(pool.ok, false);
  assert.match(pool.reason, /2 of 2 runs used today; the other 80% is kept/);
  assert.equal(canRun("local", { config: c, usage: u([]), now: inWeek, profile: "normal" }).profile, "normal", "an explicit profile wins");
});

test("unknown cost is treated as over budget, for the lane and for the pool", () => {
  const own = verdict("local", [row("local-1", undefined)]);
  assert.equal(own.ok, false);
  assert.match(own.reason, /lane local: 1 run\(s\) today with unknown cost; unknown cost counts as over budget/);
  const pool = verdict("actions", [row("local-1", undefined)]);
  assert.equal(pool.ok, false);
  assert.match(pool.reason, /scheduled pool: 1 run\(s\) today with unknown cost/);
  const unattributed = verdict("actions", [row("mystery", undefined)]);
  assert.equal(unattributed.ok, false, "an unattributed unknown-cost run also blocks");
  const interactive = verdict("actions", [row("interactive~a", undefined)]);
  assert.equal(interactive.ok, false);
  assert.match(interactive.reason, /daily total: 1 run\(s\) today with unknown cost/);
});

test("a lane missing from the config has no budget", () => {
  const v = verdict("mac-4h", []);
  assert.equal(v.ok, false);
  assert.match(v.reason, /lane "mac-4h" is not in agents\/budget.json/);
});

test("receipts are read in receipt.mjs format, trusted authors only; 'cost not reported' is unknown", () => {
  const trust = { founder: "founder", appClientId: "", bots: new Set(["claude[bot]"]) };
  const c = (login, body, type = "User") => ({ user: { login, type }, body, created_at: `${DAY}T09:00:00Z`, html_url: "u" });
  const comments = [
    c("github-actions[bot]", "<!-- receipt run:101 agent:qa cost:1.2500 --> Run receipt: task BL-1, success.", "Bot"),
    c("founder", "<!-- receipt run:local-5 agent:ops cost:unknown --> Run receipt: run, unknown."),
    c("founder", "<!-- receipt run:102 agent:qa cost:0.0000 --> Run receipt. cost not reported."),
    c("outsider", "<!-- receipt run:103 agent:qa cost:99 --> fake"),
    c("founder", "Please run the qa agent."),
  ];
  const u = usageFromComments(comments, trust, cfg(), DAY);
  assert.deepEqual(u.lanes.actions, { runs: 2, cost_usd: 1.25, unknown: 1 });
  assert.deepEqual(u.lanes.local, { runs: 1, cost_usd: 0, unknown: 1 });
  assert.equal(u.all.runs, 3, "the outsider's receipt is ignored");
});

test("blockedReason: one read per tick, counts what it approves, and blocks with a budget reason", () => {
  _resetTick();
  let calls = 0;
  const ctx = {
    now: NOW, runId: "local-1", LOCAL: true, env: { AGENTS_LANE: "local" }, repo: "o/r", roster: { founder: "founder" },
    ghAll: () => { calls++; return []; },
  };
  const agent = { handle: "qa" };
  const work = { mode: "task" };
  const c = cfg();
  assert.equal(blockedReason(ctx, agent, work, { config: c }), "");
  assert.equal(blockedReason(ctx, agent, work, { config: c }), "");
  assert.equal(blockedReason(ctx, agent, work, { config: c }), "");
  assert.match(blockedReason(ctx, agent, work, { config: c }), /^budget: lane local: 3 of 3 runs used today/);
  assert.equal(calls, 1, "receipts are read once per tick");

  _resetTick();
  const actions = { ...ctx, LOCAL: false, runId: "900" };
  assert.equal(blockedReason(actions, agent, work, { config: c }), "", "Actions mode is lane actions");
  const unknownLane = { ...ctx, runId: "local-2", env: { AGENTS_LANE: "mac-4h" } };
  assert.match(blockedReason(unknownLane, agent, work, { config: c }), /not in agents\/budget.json/);
  const bad = { ...c, reserved_interactive_share: 2 };
  assert.match(blockedReason({ ...ctx, runId: "local-3" }, agent, work, { config: bad }), /^budget: agents\/budget.json invalid/);
  _resetTick();
});
