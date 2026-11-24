// Tests for docs/backlog/RANK.md: parsing, dispatch order and the check.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, cpSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parseBacklog, parseRank, orderByRank, queueFor, loadRank, ROOT } from "./lib.mjs";
import { checkRankRows, checkRank } from "./rank-check.mjs";
import { check } from "./check.mjs";

const row = (id, status = "ready", owner = "qa engineer", extra = "") =>
  `#### ${id} Task ${id}\n- Status: ${status}. Mode: agent. Owner: ${owner}. Milestone: M1. Size: S. Depends on: none.${extra}\n`;
const tasks = parseBacklog(`## Sec\n\n${[row("BL-010"), row("BL-020"), row("BL-030"), row("BL-040", "done"), row("BL-050", "superseded"), row("BL-060")].join("\n")}`);
const owners = new Map([["qa engineer", "qa"]]);
const table = (lines) => `# Rank\n\n| Rank | Id | Tier | Why |\n|---|---|---|---|\n${lines.join("\n")}\n`;

test("parseRank reads the table and reports malformed rows", () => {
  const { rows, errors } = parseRank(table(["| 1 | BL-030 | T0 | first |", "| 2 | BL-010 | T1 | a | b |", "| x | BL-020 | T1 | bad rank |"]));
  assert.deepEqual(rows.map((r) => [r.rank, r.id, r.tier]), [[1, "BL-030", "T0"], [2, "BL-010", "T1"]]);
  assert.equal(rows[1].why, "a | b");
  assert.equal(errors.length, 1);
});

test("parseRank ignores tables that are not the rank table", () => {
  assert.deepEqual(parseRank("| A | B |\n|---|---|\n| 1 | BL-010 |\n").rows, []);
});

test("orderByRank puts ranked rows first in rank order, then the rest in file order", () => {
  const rows = [{ rank: 1, id: "BL-060" }, { rank: 2, id: "BL-020" }];
  assert.deepEqual(orderByRank(tasks, rows).map((t) => t.id), ["BL-060", "BL-020", "BL-010", "BL-030", "BL-040", "BL-050"]);
  assert.deepEqual(orderByRank(tasks, []).map((t) => t.id), tasks.map((t) => t.id));
});

test("queueFor orders by rank but keeps every eligibility rule", () => {
  const rows = [{ rank: 1, id: "BL-060" }, { rank: 2, id: "BL-040" }, { rank: 3, id: "BL-020" }];
  // BL-040 is done (never eligible), BL-060 is taken, BL-020 is claimed: ranking does not override any of it.
  assert.deepEqual(queueFor("qa", tasks, owners, new Set(["BL-060"]), new Set(["BL-020"]), rows).map((t) => t.id), ["BL-010", "BL-030"]);
  assert.deepEqual(queueFor("qa", tasks, owners, new Set(), new Set(), rows).map((t) => t.id), ["BL-060", "BL-020", "BL-010", "BL-030"]);
  assert.deepEqual(queueFor("qa", tasks, owners, new Set()).map((t) => t.id), ["BL-010", "BL-020", "BL-030", "BL-060"]);
});

test("a ranked row for a task that is not eligible does not jump the queue", () => {
  const t = parseBacklog(`## S\n\n${row("BL-010")}\n${row("BL-020", "ready", "qa engineer", " ")}\n${row("BL-030", "ready", "someone else")}`);
  const rows = [{ rank: 1, id: "BL-030" }, { rank: 2, id: "BL-020" }];
  assert.deepEqual(queueFor("qa", t, owners, new Set(), new Set(), rows).map((x) => x.id), ["BL-020", "BL-010"]);
});

const good = [
  { rank: 1, id: "BL-030", tier: "T0", line: 5 },
  { rank: 2, id: "BL-010", tier: "T3", line: 6 },
];

test("a clean ranking passes and unranked ready rows only warn", () => {
  const r = checkRankRows(good, tasks);
  assert.deepEqual(r.errors, []);
  assert.equal(r.warnings.length, 1);
  assert.match(r.warnings[0], /2 ready agent rows have no rank.*BL-020, BL-060/);
});

test("duplicate ids, rank gaps and repeated ranks fail", () => {
  assert.match(checkRankRows([...good, { rank: 3, id: "BL-030", tier: "T1", line: 7 }], tasks).errors.join("\n"), /duplicate id/);
  assert.match(checkRankRows([good[0], { ...good[1], rank: 3 }], tasks).errors.join("\n"), /missing 2/);
  assert.match(checkRankRows([good[0], { ...good[1], rank: 1 }], tasks).errors.join("\n"), /rank used more than once: 1/);
  assert.match(checkRankRows([{ ...good[0], rank: 0 }], tasks).errors.join("\n"), /missing 1/);
});

test("unknown tier, unknown id and stale ranks fail", () => {
  assert.match(checkRankRows([{ ...good[0], tier: "T4" }], tasks).errors.join("\n"), /unknown tier "T4"/);
  assert.match(checkRankRows([{ ...good[0], id: "BL-999" }], tasks).errors.join("\n"), /BL-999 is not in docs\/BACKLOG.md/);
  assert.match(checkRankRows([{ ...good[0], id: "BL-040" }], tasks).errors.join("\n"), /stale rank, BL-040 is done/);
  assert.match(checkRankRows([{ ...good[0], id: "BL-050" }], tasks).errors.join("\n"), /stale rank, BL-050 is superseded/);
});

test("shape errors from parseRank fail the check", () => {
  const { rows, errors } = parseRank(table(["| 1 | nope | T0 | x |"]));
  assert.equal(checkRankRows(rows, tasks, errors).errors.length > 0, true);
});

test("the repository's docs/backlog/RANK.md passes", () => {
  const { errors } = checkRank(ROOT);
  assert.deepEqual(errors, []);
  assert.ok(loadRank(ROOT).rows.length > 0);
});

test("check.mjs fails when RANK.md is stale", () => {
  const root = mkdtempSync(join(tmpdir(), "rank-"));
  for (const d of ["agents", ".claude", "docs"]) cpSync(join(ROOT, d), join(root, d), { recursive: true, filter: (s) => !/docs\/(backlog|agents|ops)\//.test(s) || /docs\/BACKLOG/.test(s) });
  mkdirSync(join(root, "docs", "backlog"), { recursive: true });
  writeFileSync(join(root, "docs", "backlog", "RANK.md"), table(["| 1 | BL-9999 | T0 | not a task |"]));
  const res = check(root);
  assert.ok(res.errors.some((e) => /BL-9999 is not in docs\/BACKLOG.md/.test(e)), res.errors.join("\n"));
});
