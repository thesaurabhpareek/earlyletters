// Tests for the agent dispatcher's pure logic. Run: node --test scripts/agents/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  ROOT, parseBacklog, eligibility, primaryOwner, takenIds, queueFor, ownerMap,
  loadRoster, readState, writeState, standingChanged,
} from "./lib.mjs";
import { summarize } from "./receipt.mjs";
import { tally, newTotals, opencodeConfig } from "./run-opencode.mjs";
import { salvagePlan } from "./salvage.mjs";

const FIXTURE = `
## M1. Guardrails

#### BL-001 Point CLAUDE.md at the backlog
- Status: ready. Mode: agent. Owner: QA engineer. Milestone: M1.
- Satisfies: none.

#### BL-002 Traceability check
- Status: done (commit abc; remote apply is BL-015). Mode: agent. Owner: QA engineer. Milestone: M1.

#### BL-004 Continuous integration [Critical]
- Status: ready. Mode: agent. Owner: QA engineer. Milestone: M1, week 1. Depends on: BL-002.

#### BL-112 Fix migration: parent-only invites [Critical]
- Status: ready. Mode: agent (pair review; \`approve-migration\`). Owner: data architect. Depends on: BL-004. Size: M.

#### BL-117 CI security scans [High]
- Status: blocked (BL-002). Mode: agent. Owner: security engineer. Milestone: M1. Size: M.

#### BL-118 Waits on Apple
- Status: blocked (Apple review). Mode: agent. Owner: mobile engineer.

#### BL-120 Waits on two tasks
- Status: blocked (BL-002, BL-004). Mode: agent. Owner: mobile engineer, design systems.

#### BL-103 App Store Connect setup
- Status: blocked (BL-100, BL-101). Mode: human (agent prepares the checklist). Owner: founder, payments engineer.

## M2. Next
#### BL-130 Needs a decision
- Status: needs-decision (D-032). Mode: agent. Owner: speech engineer.
`;

const tasks = parseBacklog(FIXTURE);
const byId = new Map(tasks.map((t) => [t.id, t]));

test("parses ids, titles, sections and status fields", () => {
  assert.equal(tasks.length, 9);
  const t = byId.get("BL-112");
  assert.equal(t.title, "Fix migration: parent-only invites [Critical]");
  assert.equal(t.section, "M1. Guardrails");
  assert.equal(t.status, "ready");
  assert.equal(t.mode, "agent");
  assert.deepEqual(t.owners, ["data architect"]);
  assert.deepEqual(t.dependsOn, ["BL-004"]);
  assert.equal(byId.get("BL-130").section, "M2. Next");
  assert.match(byId.get("BL-001").block, /Satisfies: none/);
});

test("statuses with parentheses and periods inside them parse", () => {
  const t = byId.get("BL-002");
  assert.equal(t.status, "done");
  assert.match(t.statusText, /remote apply is BL-015/);
  assert.equal(byId.get("BL-103").mode, "human");
  assert.deepEqual(byId.get("BL-103").owners, ["founder", "payments engineer"]);
});

test("eligibility follows the backlog rules", () => {
  assert.deepEqual(eligibility(byId.get("BL-001"), byId), { ok: true });
  assert.equal(eligibility(byId.get("BL-004"), byId).ok, true, "depends on a done task");
  assert.match(eligibility(byId.get("BL-112"), byId).reason, /depends on BL-004/);
  assert.equal(eligibility(byId.get("BL-117"), byId).ok, true, "blocked only by a done task");
  assert.match(eligibility(byId.get("BL-118"), byId).reason, /non-backlog/);
  assert.match(eligibility(byId.get("BL-120"), byId).reason, /blocked by BL-004/);
  assert.match(eligibility(byId.get("BL-103"), byId).reason, /mode human/);
  assert.match(eligibility(byId.get("BL-130"), byId).reason, /needs-decision/);
});

test("the first agent owner wins and founder is skipped", () => {
  const owners = new Map([["mobile engineer", "mobile"], ["design systems", "design-systems"], ["payments engineer", "payments"]]);
  assert.equal(primaryOwner(byId.get("BL-120"), owners), "mobile");
  assert.equal(primaryOwner(byId.get("BL-103"), owners), "payments");
});

test("open PR branches and titles mark tasks as taken", () => {
  const taken = takenIds([
    { head: { ref: "fix/db-bl-112-invite-roles" }, title: "BL-112: Fix" },
    { head: { ref: "agent/qa/trace" }, title: "BL-004: CI" },
    { head: { ref: "feat/x" }, title: "unrelated" },
  ]);
  assert.deepEqual([...taken].sort(), ["BL-004", "BL-112"]);
});

test("queueFor returns only eligible, untaken tasks for the agent", () => {
  const owners = new Map([["qa engineer", "qa"]]);
  const q = queueFor("qa", tasks, owners, new Set(["BL-001"]));
  assert.deepEqual(q.map((t) => t.id), ["BL-004"]);
  const q2 = queueFor("qa", tasks, owners, new Set(), new Set(["BL-004"]));
  assert.deepEqual(q2.map((t) => t.id), ["BL-001"]);
});

test("board state round-trips through the hidden comment", () => {
  const s = { day: "2026-10-03", runs: { qa: 2 }, claims: { qa: { mode: "task", task: "BL-001" } } };
  const body = `# Agent board\n\n${writeState(s)}`;
  assert.deepEqual(readState(body), s);
  assert.deepEqual(readState("no state here"), {});
});

test("the real backlog parses completely and every owner role maps to an agent", () => {
  const text = readFileSync(join(ROOT, "docs", "BACKLOG.md"), "utf8");
  const real = parseBacklog(text);
  const headings = (text.match(/^#### BL-\d{3}/gm) ?? []).length;
  assert.equal(real.length, headings);
  assert.ok(real.every((t) => t.status), "every task has a status");
  const owners = ownerMap(loadRoster());
  const unmapped = new Set(real.flatMap((t) => t.owners ?? []).filter((o) => o !== "founder" && !owners.has(o)));
  assert.deepEqual([...unmapped], []);
});

test("receipts read cost, turns and minutes from the execution log", () => {
  const dir = mkdtempSync(join(tmpdir(), "receipt-"));
  const file = join(dir, "exec.json");
  writeFileSync(file, JSON.stringify([
    { type: "system" },
    { type: "result", subtype: "success", total_cost_usd: 1.2345, num_turns: 31, duration_ms: 754000 },
  ]));
  assert.deepEqual(summarize(file), { model: undefined, cost: 1.2345, turns: 31, minutes: 13, subtype: "success" });
  assert.deepEqual(summarize(join(dir, "missing.json")), {});
});

test("standing duties rerun only when something changed", () => {
  assert.equal(standingChanged(undefined, "abc", 0), true, "first standing run");
  assert.equal(standingChanged({ develop: "abc" }, "abc", 0), false, "nothing new");
  assert.equal(standingChanged({ develop: "abc" }, "def", 0), true, "develop moved");
  assert.equal(standingChanged({ develop: "abc" }, "abc", 1), true, "founder wrote");
});

test("OpenCode events add up to cost, steps and tokens", () => {
  const t = newTotals();
  tally(t, { type: "step_start", part: {} });
  tally(t, { type: "step_finish", part: { cost: 0.012, tokens: { input: 1000, output: 200, reasoning: 50, cache: { read: 9000, write: 0 } } } });
  tally(t, { type: "text", part: { text: "hi" } });
  tally(t, { type: "step_finish", part: { cost: 0.008, tokens: { input: 500, output: 100, reasoning: 0, cache: { read: 4000, write: 0 } } } });
  assert.equal(t.steps, 2);
  assert.equal(Number(t.cost.toFixed(3)), 0.02);
  assert.deepEqual(t.tokens, { input: 1500, output: 350, cacheRead: 13000 });
});

test("OpenCode config never shares sessions and denies founder-only actions", () => {
  const c = opencodeConfig();
  assert.equal(c.share, "disabled");
  assert.equal(c.autoupdate, false);
  for (const p of ["gh pr merge*", "git push --force*", "gh secret*", "git push origin main*"]) {
    assert.equal(c.permission.bash[p], "deny", p);
  }
  assert.equal(Object.keys(c.permission.bash)[0], "*", "catch-all first so specific denies win");
});

test("every agent resolves to an engine, a model and a spend cap", () => {
  const roster = loadRoster();
  for (const a of roster.agents) {
    assert.ok(roster.engines[a.engine], `${a.handle} engine`);
    assert.ok(a.model, `${a.handle} model`);
    assert.ok(a.max_budget_usd > 0, `${a.handle} budget`);
  }
});

test("salvage saves unfinished work to a branch and never to develop or main", () => {
  const base = { handle: "qa", runId: "42" };
  assert.deepEqual(salvagePlan({ ...base, dirty: false, unpushed: false, branch: "develop" }), { action: "none" });
  assert.deepEqual(salvagePlan({ ...base, dirty: true, unpushed: false, branch: "develop" }),
    { action: "save", branch: "agent/qa/wip-42", commit: true, newBranch: true });
  assert.equal(salvagePlan({ ...base, dirty: true, unpushed: false, branch: "main" }).branch, "agent/qa/wip-42");
  assert.deepEqual(salvagePlan({ ...base, dirty: false, unpushed: true, branch: "fix/qa-bl-001-trace" }),
    { action: "save", branch: "fix/qa-bl-001-trace", commit: false, newBranch: false });
});
