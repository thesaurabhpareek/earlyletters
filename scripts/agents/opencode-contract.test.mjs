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
import * as runner from "./run-opencode.mjs";
const { tally, newTotals, opencodeConfig } = runner;

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

// ---- Deny globs, replayed from runs of the real binary ----

const outcomesOf = (name) =>
  Object.fromEntries(
    load(name)
      .filter((e) => e.type === "tool_use" && e.part.state.input.command)
      .map((e) => [e.part.state.input.command, e.part.state.status === "error" ? "blocked" : "ran"]),
  );

// Baseline: opencodeConfig() as on develop f94e76d0, before the hardening branch.
test("baseline deny (develop f94e76d0): globs named in the old config blocked, refspec forms ran", () => {
  const o = outcomesOf("deny-matrix");
  for (const c of ["git push origin develop", "git push origin main", "git push --force origin x", "gh pr merge 1 --squash",
    "cd /tmp && gh pr merge 1", "gh pr close 2", "gh api -X DELETE repos/a/b"]) assert.equal(o[c], "blocked", c);
  for (const c of ["git push origin HEAD:main", "git push -u origin HEAD:refs/heads/develop", "git -C . push origin develop",
    "git push origin test/x", "gh pr create --fill"]) assert.equal(o[c], "ran", c);
  assert.equal(load("denied-push-merge").find((e) => e.part?.state?.input?.command === "git push origin HEAD:develop").part.state.status, "completed");
});

// Hardened: DENY_PATTERNS / buildChildEnv from origin/fix/opencode-runner-hardening d060a36f,
// run through the real binary opencode-ai 1.18.34. opencode matches the whole command string
// (and each segment of a && / ; / | compound) against the glob, "*" being any run of characters.
const hardened = outcomesOf("hardened-deny-matrix");

test("hardened deny: protected-branch pushes in every refspec form are blocked by the real binary", () => {
  for (const c of ["git push origin HEAD:develop", "git push origin develop", "git push origin HEAD:main", "git push origin main",
    "git push -u origin HEAD:refs/heads/develop", "git push origin +HEAD:develop", "git push origin +develop",
    "git push origin test/x:develop"]) assert.equal(hardened[c], "blocked", c);
});

test("hardened deny: force, lease, delete, merge, close, workflow and gh api writes are blocked by the real binary", () => {
  for (const c of ["git push --force origin x", "git push --force-with-lease origin x", "git push origin --delete foo", "git push origin :foo",
    "gh pr merge 1", "gh pr merge 1 --squash", "cd /tmp && gh pr merge 1", "gh pr close 2", "gh workflow run ci.yml",
    "gh api -X DELETE repos/a/b", "gh api -X POST repos/a/b/issues", "gh api -X PUT repos/a/b/x",
    "gh api repos/a/b/branches/develop/protection"]) assert.equal(hardened[c], "blocked", c);
});

test("hardened deny: ordinary work still runs (no over-blocking)", () => {
  for (const c of ["git status", "git push origin test/x", "gh pr create --fill", "gh api repos/a/b/pulls", "git push origin HEAD:refs/heads/release"]) {
    assert.equal(hardened[c], "ran", c);
  }
});

// Shell indirection cannot be covered by globs. These RAN against the real binary: it is the
// documented reason branch protection and the App token scope are the real controls.
test("hardened deny: shell indirection to push develop is NOT blocked (tripwire, not a boundary)", () => {
  for (const c of ["FOO=1 git push origin develop", "sh -c 'git push origin develop'", "B=develop; git push origin $B",
    "git push origin $(echo develop)", "sh push.sh", "env git push origin develop", "git push origin HEAD:'develop'"]) {
    assert.equal(hardened[c], "ran", c);
  }
});

// Spelling variants a glob could cover. They ran today; the todo tests check the config and flip
// to real passes when DENY_PATTERNS covers them. After that, refresh the fixture and move them up.
const patterns = () => runner.DENY_PATTERNS ?? Object.entries(opencodeConfig().permission.bash).filter(([, v]) => v === "deny").map(([k]) => k);
const globToRe = (g) => new RegExp("^" + g.split("*").map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$", "s");
const denied = (cmd) => cmd.split(/&&|\|\||;|\|/).map((s) => s.trim()).some((seg) => patterns().some((g) => globToRe(g).test(seg)));

test("hardened deny: the glob matcher used here agrees with the real binary on every recorded command", {
  todo: runner.DENY_PATTERNS ? false : "run-opencode.mjs on this branch predates DENY_PATTERNS; passes once the hardening branch is merged",
}, () => {
  for (const [cmd, res] of Object.entries(hardened)) assert.equal(denied(cmd), res === "blocked", cmd);
});

for (const cmd of ["git -C . push origin develop", "git push -u origin develop", "git push --set-upstream origin main", "git push  origin  develop",
  "git -c core.x=1 push origin develop", "gh -R a/b pr merge 1", "gh api repos/a/b/issues -f title=x", "gh api graphql -f query=mutation"]) {
  test(`[expected failure] deny globs block "${cmd}"`, {
    todo: `STILL RUNS on the real binary (opencode-ai 1.18.34, hardening d060a36f): ${cmd}. Owner: run-opencode.mjs DENY_PATTERNS.`,
  }, () => {
    assert.equal(hardened[cmd], "blocked");
    assert.ok(denied(cmd));
  });
}

// ---- Project config and child env, from the real binary ----

const statuses = (name) => load(name).filter((e) => e.type === "tool_use").map((e) => [e.part.state.input.command, e.part.state.status]);

test("project config: a repo opencode.json that allows the denied commands is ignored with OPENCODE_DISABLE_PROJECT_CONFIG=1", () => {
  assert.deepEqual(statuses("project-config-disabled"), [["gh pr merge 1", "error"], ["git push origin develop", "error"]]);
});

test("project config: without the flag the same repo opencode.json DOES override the deny rules", () => {
  assert.deepEqual(statuses("project-config-enabled"), [["gh pr merge 1", "completed"], ["git push origin develop", "completed"]]);
});

test("child env: the model's shell sees only the allowlist plus engine variables, no planted canary secrets", () => {
  const out = load("child-env").find((e) => e.type === "tool_use").part.state.output;
  const names = out.split("\n").filter(Boolean).map((l) => l.split("=")[0]);
  for (const n of ["GH_TOKEN", "OPENROUTER_API_KEY", "OPENCODE_DISABLE_PROJECT_CONFIG"]) assert.ok(names.includes(n), n);
  for (const n of ["CANARY_AWS_SECRET_ACCESS_KEY", "ANTHROPIC_API_KEY", "SUPABASE_SERVICE_ROLE_KEY", "GITHUB_TOKEN", "AGENT_APP_PRIVATE_KEY", "NPM_TOKEN"]) {
    assert.ok(!names.includes(n), n);
  }
  assert.ok(!/canary/i.test(out));
});
