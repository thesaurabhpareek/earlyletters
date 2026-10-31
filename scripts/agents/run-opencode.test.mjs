// Tests for the OpenCode runner's pure logic. Run: node --test scripts/agents/run-opencode.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  opencodeConfig, DENY_PATTERNS, ENV_ALLOWLIST, buildChildEnv, stopReason, killTree, makeStopper, tally, newTotals,
} from "./run-opencode.mjs";

const globToRe = (g) => new RegExp("^" + g.split("*").map((x) => x.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$");
const denied = (cmd) => {
  let action = "allow";
  for (const [p, v] of Object.entries(opencodeConfig().permission.bash)) if (globToRe(p).test(cmd)) action = v; // last match wins
  return action === "deny";
};

test("child env drops every secret that is not on the allowlist", () => {
  const fake = {
    PATH: "/usr/bin", HOME: "/home/runner", LANG: "C.UTF-8", RUNNER_TEMP: "/tmp/r",
    OPENROUTER_API_KEY: "canary-openrouter", GH_TOKEN: "canary-gh",
    ANTHROPIC_API_KEY: "canary-anthropic", CLAUDE_CODE_OAUTH_TOKEN: "canary-oauth",
    GITHUB_TOKEN: "canary-github", AWS_SECRET_ACCESS_KEY: "canary-aws", SUPABASE_SERVICE_ROLE_KEY: "canary-srk",
    ACTIONS_RUNTIME_TOKEN: "canary-runtime", ACTIONS_ID_TOKEN_REQUEST_TOKEN: "canary-oidc",
  };
  const env = buildChildEnv(fake, { OPENCODE_CONFIG: "/tmp/r/opencode.json" });
  const blob = JSON.stringify(env);
  for (const leaked of ["canary-anthropic", "canary-oauth", "canary-github", "canary-aws", "canary-srk", "canary-runtime", "canary-oidc"]) {
    assert.ok(!blob.includes(leaked), `${leaked} must not reach the model's shell`);
  }
  assert.equal(env.OPENROUTER_API_KEY, "canary-openrouter", "engine needs its provider key");
  assert.equal(env.GH_TOKEN, "canary-gh", "gh and git need the App token");
  assert.equal(env.PATH, "/usr/bin");
  assert.equal(env.OPENCODE_CONFIG, "/tmp/r/opencode.json");
  assert.ok(Object.keys(env).every((k) => ENV_ALLOWLIST.includes(k) || k === "OPENCODE_DISABLE_PROJECT_CONFIG"));
});

test("child env turns off repo-level OpenCode config so the checkout cannot loosen permissions", () => {
  assert.equal(buildChildEnv({}).OPENCODE_DISABLE_PROJECT_CONFIG, "1");
  // a caller cannot be tricked by a source env that sets it to something else
  assert.equal(buildChildEnv({ OPENCODE_DISABLE_PROJECT_CONFIG: "0" }).OPENCODE_DISABLE_PROJECT_CONFIG, "1");
});

test("deny list has parity with the Claude Code arm and covers bypass shapes", () => {
  const mustDeny = [
    "git push origin develop", "git push origin main", "git push origin HEAD:develop", "git push origin HEAD:main",
    "git push origin HEAD:refs/heads/develop", "git push origin HEAD:refs/heads/main",
    "git push --force-with-lease origin feat/x", "git push origin feat/x --force-with-lease", "git push origin +develop",
    "git push origin +feat/x", "git push origin --delete feat/x", "git push origin :feat/x", "git push -f origin feat/x",
    "gh pr merge 12", "gh pr merge --squash 12", "gh pr merge 12 --admin", "gh pr close 12", "gh pr review 12 --approve",
    "gh workflow run agents.yml", "gh workflow disable agents.yml", "gh secret set X", "gh auth login",
    "gh api -X PUT repos/o/r/branches/develop/protection", "gh api repos/o/r/branches/develop/protection",
    "gh api --method PATCH repos/o/r", "gh api -XDELETE repos/o/r/git/refs/heads/develop",
    "gh api repos/o/r/rulesets", "gh api repos/o/r/actions/secrets/KEY",
  ];
  for (const c of mustDeny) assert.ok(denied(c), `should deny: ${c}`);
});

test("deny list covers option, -C/-c, -R and implicit-write spellings (round 2)", () => {
  for (const c of ["git -C . push origin develop", "git -c core.x=1 push origin main", "git push -u origin develop",
    "git push --set-upstream origin main", "git push  origin  develop", "gh -R a/b pr merge 1", "gh --repo a/b secret set X",
    "gh api repos/a/b/issues -f title=x", "gh api repos/a/b/issues -F n=1", "gh api graphql -f query=q"]) {
    assert.ok(denied(c), `should deny: ${c}`);
  }
  // known bypass shapes are NOT claimed: the list is a tripwire
  assert.ok(!denied("FOO=1 git push origin develop"));
  assert.ok(!denied("sh -c 'git push origin develop'"));
  assert.ok(!denied("env git push origin develop"));
  // PR bodies that merely mention words are not blocked
  assert.ok(!denied('gh pr create --title x --body "rotate the secret and variable names"'));
});

test("deny list does not block normal agent work", () => {
  const mustAllow = [
    "git push -u origin agent/qa/opencode-runner-hardening", "git push origin agent/qa/wip-42", "git status",
    "gh pr create --title x --body y", "gh pr create --fill", "gh pr view 12", "gh pr list --label agent:qa",
    "gh api repos/o/r/pulls/12/comments", "gh issue comment 5 --body hi", "npm test",
  ];
  for (const c of mustAllow) assert.ok(!denied(c), `should allow: ${c}`);
  assert.equal(Object.keys(opencodeConfig().permission.bash)[0], "*", "catch-all first so specific denies win");
  assert.equal(new Set(DENY_PATTERNS).size, DENY_PATTERNS.length, "no duplicate patterns");
});

test("budget stop fires at the cap and before a likely overshoot", () => {
  const opts = { budget: 1, maxTurns: 80, model: "openrouter/x/y" };
  const t = newTotals();
  tally(t, { type: "step_finish", part: { cost: 0.4 } });
  assert.equal(stopReason(t, opts), null);
  tally(t, { type: "step_finish", part: { cost: 0.4 } });
  // 0.8 spent, dearest step 0.4: the next step would breach $1, so stop now
  assert.equal(stopReason(t, opts), "error_max_budget_usd");
  const exact = { ...newTotals(), cost: 1, steps: 3 };
  assert.equal(stopReason(exact, opts), "error_max_budget_usd", "reaching the cap exactly stops (old code needed > cap)");
});

test("step cap stops at the limit, not one past it, and blind paid runs stop early", () => {
  const opts = { budget: 100, maxTurns: 3, model: "openrouter/x/y" };
  assert.equal(stopReason({ ...newTotals(), steps: 2, cost: 0.01 }, opts), null);
  assert.equal(stopReason({ ...newTotals(), steps: 3, cost: 0.01 }, opts), "error_max_turns");
  const blind = { ...newTotals(), steps: 5 };
  assert.equal(stopReason(blind, { ...opts, maxTurns: 80 }), "error_cost_not_reported");
  assert.equal(stopReason(blind, { ...opts, maxTurns: 80, model: "openrouter/x/y:free" }), null);
});

test("stop signals the whole process group, escalates to SIGKILL, and keeps the first reason", () => {
  const calls = [];
  const killFn = (pid, sig) => calls.push(["group", pid, sig]);
  const child = { pid: 4321, kill: (sig) => calls.push(["child", sig]) };
  const timers = [];
  const setTimer = (fn, ms) => { timers.push({ fn, ms }); return { unref() {} }; };
  const state = { subtype: "success" };
  const stop = makeStopper(child, state, { killFn, setTimer, graceMs: 5000 });
  stop("error_max_budget_usd");
  stop("error_max_turns");
  assert.equal(state.subtype, "error_max_budget_usd", "first reason wins");
  assert.deepEqual(calls[0], ["group", -4321, "SIGTERM"], "negative pid targets the group");
  assert.equal(timers[0].ms, 5000);
  timers[0].fn();
  assert.deepEqual(calls.find((c) => c[2] === "SIGKILL"), ["group", -4321, "SIGKILL"]);
  assert.ok(!calls.some((c) => c[0] === "child"), "direct child kill not needed when the group signal works");
});

test("killTree falls back to the direct child when the group signal fails", () => {
  const calls = [];
  const child = { pid: 99, kill: (sig) => calls.push(sig) };
  killTree(child, "SIGTERM", () => { throw new Error("ESRCH"); });
  assert.deepEqual(calls, ["SIGTERM"]);
  const noPid = { kill: (sig) => calls.push(sig + "-nopid") };
  killTree(noPid, "SIGKILL", () => assert.fail("must not signal a group without a pid"));
  assert.deepEqual(calls, ["SIGTERM", "SIGKILL-nopid"]);
  // a child whose kill also throws must not crash the runner
  killTree({ pid: 1, kill: () => { throw new Error("gone"); } }, "SIGTERM", () => { throw new Error("gone"); });
});
