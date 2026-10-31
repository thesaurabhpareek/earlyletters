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
import { deniedBy, denyOnly, isPush } from "./opencode-matcher.mjs";
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
// One faithful matcher (opencode-matcher.mjs, shared with opencode-deny.test.mjs). Round 6: the model does not
// push, so every command with git and push in it is denied now. Recordings of pushes were made under older
// rule sets and cannot be compared to the real binary any more: they are the documented exception
// (isPush), checked only for "denied now". Every other command is still compared for equality.
const denied = deniedBy(Object.entries(opencodeConfig().permission.bash));

// Recorded as RAN under d060a36f (fixture left untouched); the round 2 patterns now cover them.
const FIXED = ["git -C . push origin develop", "git push -u origin develop", "git push --set-upstream origin main", "git push  origin  develop",
  "git -c core.x=1 push origin develop", "gh -R a/b pr merge 1", "gh api repos/a/b/issues -f title=x", "gh api graphql -f query=mutation"];

test("hardened deny: the glob matcher used here agrees with the real binary on every recorded command it did not leak", () => {
  for (const [cmd, res] of Object.entries(hardened)) {
    if (FIXED.includes(cmd)) continue;
    // Incidentally matched by " develop*" now; not a promise (substitution is a known bypass shape).
    if (cmd === "git push origin $(echo develop)") continue;
    if (isPush(cmd)) { assert.ok(denied(cmd), `${cmd}: pushes are denied now; the recording is not comparable`); continue; }
    assert.equal(denied(cmd), res === "blocked", cmd);
  }
});

for (const cmd of FIXED) {
  test(`deny globs now block "${cmd}" (it RAN on the real binary under d060a36f)`, () => {
    assert.equal(hardened[cmd], "ran", "fixture is the old recording");
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

// ---- Round 3: W1 final patterns (98dcbf84), re-run on the real binary ----

const final = outcomesOf("final-deny-matrix");
const GRAPHQL_COMMENT = "gh pr comment 1 --body 'ran gh api graphql locally'";
// Round 7: the gh denies are whitespace tolerant (`gh*secret*`), so a command line that has the word secret in it is
// denied even in a quoted body. The real binary ran this one under the old anchored pattern; over-blocking is accepted now.
const OVERBLOCKED = "gh pr create --title 'fix main page' --body 'no secret here'";

test("round 7: a body that mentions a denied word is over-blocked on purpose (use --body-file)", () => {
  assert.equal(final[OVERBLOCKED], "ran", "fixture is the old recording");
  assert.ok(denied(OVERBLOCKED));
  assert.ok(!denied("gh pr create --title 'fix main page' --body-file /tmp/body.md"));
});

test("final deny: the glob matcher agrees with the real binary on all 58 recorded commands", () => {
  // 98dcbf84 recording. Round 3 changed the patterns on purpose for the false positives, the
  // graphql comment and the accidental substitution match, so those rows are expected to differ.
  const changedOnPurpose = new Set([...MUST_ALLOW, GRAPHQL_COMMENT, OVERBLOCKED, "git push origin $(echo develop)"]);
  for (const [cmd, res] of Object.entries(final)) {
    if (changedOnPurpose.has(cmd)) continue;
    if (isPush(cmd)) { assert.ok(denied(cmd), cmd); continue; } // documented exception: see the comment at the top of this section
    assert.equal(denied(cmd), res === "blocked", cmd);
  }
  assert.equal(Object.keys(final).length, 58);
});

test("final deny: the commands that RAN under d060a36f are now blocked by the real binary", () => {
  for (const c of [...FIXED, "git push origin $(echo develop)", "git -C . push -u origin develop", "git -c core.x=1 push origin main",
    "gh api -F x=1 repos/a/b/issues", "gh api --field x=1 repos/a/b/issues", "gh api --input body.json repos/a/b/issues"]) {
    assert.equal(final[c], "blocked", c);
  }
});

test("final deny: shell indirection still runs on the real binary (tripwire, not a boundary)", () => {
  for (const c of ["FOO=1 git push origin develop", "sh -c 'git push origin develop'", "B=develop; git push origin $B", "sh push.sh",
    "env git push origin develop", "git push origin HEAD:'develop'"]) assert.equal(final[c], "ran", c);
});

// Must-allow commands whose text merely contains develop or main. The real binary blocked all but
// one under 98dcbf84 ("git*push*/main*" and friends are substring matches).
const MUST_ALLOW = ["git push origin feat/maintenance", "git push origin docs/mainline-notes", "git push -u origin agent/product/main-page",
  "git push origin test/injection-lane", "git push origin fix/developer-docs", "git push origin agent/qa/develop-notes",
  "git commit -m 'document the push to main page'"];

test("final deny: commands without develop or main as a branch are not blocked", () => {
  for (const c of ["git push origin test/injection-lane", "git push origin agent/qa/hardening", "git push -u origin HEAD", "git log --oneline --grep=push"]) {
    assert.equal(final[c], "ran", c);
  }
});

// These were false positives under 98dcbf84 (recorded in final-deny-matrix). The git patterns are now
// W2's tighter set, which the real binary allowed in tighter-deny-matrix. The assertions below check
// the current DENY_PATTERNS through the offline matcher plus that recording; W2 re-runs the live engine.
for (const cmd of MUST_ALLOW) {
  test(`must-allow is not blocked: "${cmd}"`, () => {
    assert.equal(tighter[cmd], "ran", "recorded on the real binary with the tighter set");
    // Round 5 policy: only `git push [-u] origin agent/*` stays allowed; other pushes and any git command
    // containing "push" are denied on purpose (documented in integration-notes.md).
    if (isPush(cmd)) assert.ok(denied(cmd), "round 6: the model does not push, so every push is denied");
    else assert.equal(denied(cmd), false, "round 7: a command that only mentions push is allowed again");
  });
}

test("must-allow: a gh comment that mentions graphql is not blocked, a real graphql call is", () => {
  assert.ok(!denied("gh pr comment 1 --body 'ran gh api graphql locally'"));
  assert.ok(denied("gh api graphql -f query=q"));
  assert.ok(denied("gh -R a/b api graphql -f query=q"));
});

test("current DENY_PATTERNS still block every protected-branch, force and delete case the real binary blocked", () => {
  for (const [cmd, res] of Object.entries(tighter)) {
    if (res === "blocked" && cmd !== GRAPHQL_COMMENT) assert.ok(denied(cmd), cmd);
  }
  for (const c of ["git push origin HEAD:develop", "git push origin develop", "git push origin HEAD:main", "git push origin main",
    "git push -u origin HEAD:refs/heads/develop", "git push origin +develop", "git push origin test/x:develop", "git -C . push origin develop",
    "git -c core.x=1 push origin develop", "git push -u origin develop", "git push --set-upstream origin main", "git push  origin  develop",
    "git push --force origin x", "git push origin --delete foo", "git push origin :foo", "git -C . push -u origin develop"]) {
    assert.ok(denied(c), c);
  }
});

// Candidate tighter git patterns, recorded on the real binary in tighter-deny-matrix (W1's gh and
// other patterns unchanged). The branch must be a whole token, so substrings do not match.
const tighter = outcomesOf("tighter-deny-matrix");
const tighterGit = () => {
  const out = [];
  for (const p of ["git push", "git -C* push", "git -c* push"]) {
    out.push(`${p} --force*`, `${p}*--force*`, `${p}* -f*`, `${p}*--delete*`, `${p}* +*`, `${p}* :*`);
    for (const b of ["develop", "main"]) {
      out.push(`${p}* ${b}`, `${p}* ${b} *`, `${p}*:${b}`, `${p}*:${b} *`, `${p}*:refs/heads/${b}`, `${p}*:refs/heads/${b} *`, `${p}* refs/heads/${b}`);
    }
  }
  return out;
};
const tighterDenied = (cmd) => {
  // The frozen candidate git set plus the CURRENT non-git patterns (those that do not mention git or push).
  const pats = [...tighterGit(), ...runner.DENY_PATTERNS.filter((p) => !runner.GIT_DENY.includes(p))];
  return deniedBy(denyOnly(pats))(cmd);
};

test("tighter candidate: the real binary allows every must-allow command and still blocks protected-branch pushes", () => {
  for (const c of MUST_ALLOW) assert.equal(tighter[c], "ran", c);
  for (const c of ["git push origin HEAD:develop", "git push origin develop", "git push origin HEAD:main", "git push origin main",
    "git push -u origin HEAD:refs/heads/develop", "git push origin +develop", "git push origin test/x:develop", "git -C . push origin develop",
    "git -c core.x=1 push origin develop", "git push -u origin develop", "git push --set-upstream origin main", "git push  origin  develop",
    "git push --force origin x", "git push origin --delete foo", "git push origin :foo", "gh -R a/b pr merge 1"]) {
    assert.equal(tighter[c], "blocked", c);
  }
});

test("tighter candidate: the matcher agrees with the real binary on all 58 commands", () => {
  // The graphql comment row was recorded with the old unanchored gh pattern; it is anchored now (not run live).
  for (const [cmd, res] of Object.entries(tighter)) if (cmd !== GRAPHQL_COMMENT && cmd !== OVERBLOCKED) assert.equal(tighterDenied(cmd), res === "blocked", cmd);
});
