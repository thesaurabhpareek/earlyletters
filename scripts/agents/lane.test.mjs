// Lane health: ticks per lane, and a flag when a lane goes quiet. Run: node --test 'scripts/agents/*.test.mjs'
import { test } from "node:test";
import assert from "node:assert/strict";
import { recordTick, boardLines, laneName, ago } from "./lane.mjs";

const at = (iso) => new Date(iso);
const ctx = (over = {}) => ({ state: {}, now: at("2026-10-18T12:00:00Z"), runId: "r1", LOCAL: false, env: {}, roster: {}, ...over });

test("the lane is actions in Actions mode, else AGENTS_LANE, else local", () => {
  assert.equal(laneName(ctx({ LOCAL: false, env: { AGENTS_LANE: "mac-4h" } })), "actions");
  assert.equal(laneName(ctx({ LOCAL: true, env: { AGENTS_LANE: "mac-4h" } })), "mac-4h");
  assert.equal(laneName(ctx({ LOCAL: true, env: {} })), "local");
  assert.equal(laneName(ctx({ LOCAL: true, env: { AGENTS_LANE: "  " } })), "local");
  assert.equal(laneName(ctx({ LOCAL: true, env: { AGENTS_LANE: "cloud `x` | y" } })), "cloud-x-y", "Markdown-unsafe characters are cleaned");
});

test("recordTick stores { at, run } per lane and keeps other lanes", () => {
  const c = ctx({ LOCAL: true, env: { AGENTS_LANE: "cloud-4h" }, runId: "local-1" });
  c.state.lanes = { actions: { at: "2026-10-18T11:30:00Z", run: "999" } };
  recordTick(c);
  assert.deepEqual(c.state.lanes["cloud-4h"], { at: "2026-10-18T12:00:00.000Z", run: "local-1" });
  assert.deepEqual(c.state.lanes.actions, { at: "2026-10-18T11:30:00Z", run: "999" });
});

test("recordTick forgets a lane silent for more than 14 days, and bad entries", () => {
  const c = ctx();
  c.state.lanes = { old: { at: "2026-10-03T11:00:00Z", run: "x" }, recent: { at: "2026-10-05T12:00:00Z", run: "y" }, junk: { at: "never" } };
  recordTick(c);
  assert.deepEqual(Object.keys(c.state.lanes).sort(), ["actions", "recent"]);
});

test("boardLines is empty when no lane has ticked", () => {
  assert.deepEqual(boardLines(ctx()), []);
  assert.deepEqual(boardLines(ctx({ state: { lanes: {} } })), []);
});

test("boardLines lists each lane in UTC with its age and flags one quiet for more than 8 hours", () => {
  const c = ctx({ state: { lanes: {
    actions: { at: "2026-10-18T11:48:00Z", run: "1" },
    "cloud-4h": { at: "2026-10-15T09:10:00Z", run: "2" },
    edge: { at: "2026-10-18T04:00:00Z", run: "3" },
  } } });
  assert.deepEqual(boardLines(c), [
    "## Lanes",
    "",
    "- `actions`: last tick 2026-10-18 11:48 UTC (12m ago).",
    "- `cloud-4h`: **quiet since 2026-10-15 09:10 UTC** (3d 2h ago); check its scheduled task.",
    "- `edge`: last tick 2026-10-18 04:00 UTC (8h 0m ago).",
  ]);
});

test("a dispatcher tick shows on the board of the same run", () => {
  const c = ctx({ LOCAL: true, env: { AGENTS_LANE: "mac" } });
  recordTick(c);
  assert.deepEqual(boardLines(c), ["## Lanes", "", "- `mac`: last tick 2026-10-18 12:00 UTC (0m ago)."]);
});

test("ago formats minutes, hours and days, never negative", () => {
  assert.equal(ago(-5000), "0m");
  assert.equal(ago(59 * 60_000), "59m");
  assert.equal(ago(200 * 60_000), "3h 20m");
  assert.equal(ago(52 * 3_600_000), "2d 4h");
});
