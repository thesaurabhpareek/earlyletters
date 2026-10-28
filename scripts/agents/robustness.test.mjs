// Unit tests for robustness.mjs (RB-29): switch parsing and fail-open behaviour.
import { test } from "node:test";
import assert from "node:assert/strict";
import { config, boardLines, attentionReasons } from "./robustness.mjs";

test("RB-29: unset or invalid switches take the safest default", () => {
  assert.deepEqual(config({}), { AGENTS_GATES: "warn", AGENTS_PROVENANCE: "warn", AGENTS_SLA: "report", AGENTS_STALE: "report" });
  assert.equal(config({ AGENTS_GATES: "ENFORCE " }).AGENTS_GATES, "enforce");
  assert.equal(config({ AGENTS_GATES: "yes" }).AGENTS_GATES, "warn");
});

test("RB-29: a throwing hook is named on the board and does not throw", () => {
  const ctx = { env: {}, now: new Date(), openPRs: [{ number: 1, head: { sha: "x" } }], agentOfPR: () => "mobile",
    ghAll: () => { throw new Error("boom"); }, gh: () => null, handoffs: [], trust: {} };
  const text = boardLines(ctx).join("\n");
  assert.match(text, /diff sanity: skipped, hook error \(boom\)/);
  assert.match(text, /Handoff SLA/);
});

test("RB-29: warn mode never adds an attention reason", () => {
  const ctx = { env: {}, openPRs: [], agentOfPR: () => "mobile", ghAll: () => { throw new Error("must not be called"); } };
  assert.deepEqual(attentionReasons(ctx, { number: 1 }), []);
});
