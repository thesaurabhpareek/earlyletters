// Contract test: run-opencode.mjs against REAL `opencode run --format json` output.
//
// The fixtures in ./fixtures/opencode were captured from opencode-ai 1.18.34 (the version pinned
// in agents/roster.json) running headless against a local stub OpenAI-compatible server, with a
// dummy API key and no outbound model calls. Paths were rewritten to /work. See
// docs/agents/hardening/opencode-contract.md for how they were made and what they showed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tally, newTotals, opencodeConfig } from "./run-opencode.mjs";

const dir = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "opencode");
const load = (name) =>
  readFileSync(join(dir, `${name}.jsonl`), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const total = (events) => events.reduce(tally, newTotals());
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} is not ${b}`);

test("real events: every line is JSON and the types are the ones the runner reads", () => {
  for (const name of ["denied-push-merge", "unpriced-write", "priced-write", "deny-matrix"]) {
    const types = new Set(load(name).map((e) => e.type));
    for (const t of types) assert.ok(["step_start", "text", "tool_use", "step_finish"].includes(t), `${name}: ${t}`);
    assert.ok(types.has("step_finish"), name);
  }
});

test("real step_finish: cost is a number and tokens use input/output/reasoning/cache.read", () => {
  const finishes = load("priced-write").filter((e) => e.type === "step_finish");
  assert.equal(finishes.length, 3);
  for (const f of finishes) {
    assert.equal(typeof f.part.cost, "number");
    assert.equal(f.part.type, "step-finish");
    for (const k of ["input", "output", "reasoning"]) assert.equal(typeof f.part.tokens[k], "number", k);
    assert.equal(typeof f.part.tokens.cache.read, "number");
    assert.equal(typeof f.part.tokens.cache.write, "number");
  }
  assert.deepEqual(finishes.map((f) => f.part.reason), ["tool-calls", "tool-calls", "stop"]);
});

test("real events: tally() counts one step per step_finish, tool_use and text are not steps", () => {
  const events = load("priced-write");
  assert.equal(events.filter((e) => e.type === "tool_use").length, 2);
  assert.equal(total(events).steps, 3);
});

test("real events: tally() sums the dollar cost opencode computed from the model price", () => {
  // Stub price: input $1 / output $3 / cache read $0.5 per million tokens. Per step the stub
  // reported 1000+100n prompt tokens of which 400 cached, and 200 completion tokens.
  const t = total(load("priced-write"));
  const expect = [0, 100, 200].reduce((s, add) => s + ((600 + add) * 1 + 200 * 3 + 400 * 0.5) / 1e6, 0);
  near(t.cost, expect);
  assert.ok(t.cost > 0);
});

test("real events: input tokens exclude cache reads, so the runner's tokens match opencode's own fields", () => {
  const t = total(load("priced-write"));
  assert.deepEqual(t.tokens, { input: 600 + 700 + 800, output: 600, cacheRead: 1200 });
});

test("real events: a model with no price in the config reports cost 0 (a number, not absent)", () => {
  const events = load("unpriced-write");
  const finishes = events.filter((e) => e.type === "step_finish");
  for (const f of finishes) assert.strictEqual(f.part.cost, 0);
  const t = total(events);
  assert.equal(t.steps, 3);
  assert.equal(t.cost, 0);
  // Tokens are still reported, so only the dollar cap is blind, which is what the runner's
  // "5 steps at zero cost" fail-safe exists for.
  assert.deepEqual(t.tokens, { input: 2100, output: 600, cacheRead: 1200 });
});

test("real events: the zero-cost fail-safe condition in run-opencode.mjs fires after 5 steps", () => {
  // Same predicate as main(): steps >= 5 && cost === 0. Feed the unpriced run twice (6 steps).
  const events = [...load("unpriced-write"), ...load("unpriced-write")];
  const t = newTotals();
  let stoppedAt = 0;
  for (const e of events) {
    tally(t, e);
    if (!stoppedAt && t.steps >= 5 && t.cost === 0) stoppedAt = t.steps;
  }
  assert.equal(stoppedAt, 5);
});

test("real events: a denied tool call is a tool_use with status error and still costs a normal step", () => {
  const events = load("denied-push-merge");
  const denied = events.filter((e) => e.type === "tool_use" && e.part.state.status === "error");
  assert.equal(denied.length, 1);
  assert.equal(denied[0].part.state.input.command, "gh pr merge 1");
  assert.match(denied[0].part.state.error, /rule which prevents you/);
  assert.equal(total(events).steps, 4);
});

// ---- Deny globs, replayed from a run of the real binary with opencodeConfig() ----

const outcomes = () =>
  Object.fromEntries(
    load("deny-matrix")
      .filter((e) => e.type === "tool_use")
      .map((e) => [e.part.state.input.command, e.part.state.status === "error" ? "blocked" : "ran"]),
  );

test("real deny: the commands the globs name are blocked by the real binary", () => {
  const o = outcomes();
  for (const c of [
    "git push origin develop",
    "git push origin main",
    "git push --force origin x",
    "gh pr merge 1 --squash",
    "cd /tmp && gh pr merge 1",
    "gh pr close 2",
    "gh api -X DELETE repos/a/b",
  ]) assert.equal(o[c], "blocked", c);
});

test("real deny: permitted commands run", () => {
  const o = outcomes();
  assert.equal(o["git push origin test/x"], "ran");
  assert.equal(o["gh pr create --fill"], "ran");
  assert.equal(load("denied-push-merge").find((e) => e.part?.state?.input?.command === "git status").part.state.status, "completed");
});

test("real deny: recorded gap, refspec and -C forms of a push to develop or main ran", () => {
  // Documents what the real engine did. If this fails, the fixture was replaced after a fix:
  // update the fixture and drop the todo markers below.
  const o = outcomes();
  assert.equal(o["git push origin HEAD:main"], "ran");
  assert.equal(o["git push -u origin HEAD:refs/heads/develop"], "ran");
  assert.equal(o["git -C . push origin develop"], "ran");
  assert.equal(load("denied-push-merge").find((e) => e.part?.state?.input?.command === "git push origin HEAD:develop").part.state.status, "completed");
});

// opencode matches the whole command string against the glob ("*" = any run of characters).
const globToRe = (g) => new RegExp("^" + g.split("*").map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$");
const denied = (cmd) => Object.entries(opencodeConfig().permission.bash).some(([g, v]) => v === "deny" && globToRe(g).test(cmd));

for (const cmd of ["git push origin HEAD:develop", "git push origin HEAD:main", "git push -u origin HEAD:refs/heads/develop", "git -C . push origin develop"]) {
  test(`[expected failure] deny globs block "${cmd}"`, {
    todo: "KNOWN GAP (real engine, opencode-ai 1.18.34): this command ran. Patterns only match the 'git push origin develop|main' prefix. Owner: run-opencode.mjs (W1). See docs/agents/hardening/opencode-contract.md",
  }, () => {
    assert.ok(denied(cmd));
  });
}
