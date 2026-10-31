// Tests for the agent workflow gates. Run: node --test scripts/workflows.test.mjs
// They pull the `run:` blocks out of the workflow files and execute them with bash, so the
// shell the runner will use is the shell under test. They do NOT prove GitHub evaluates the
// `${{ }}` expressions the way these tests set the env: that needs a real run.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, writeFileSync, mkdirSync, cpSync, readFileSync as rf } from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const guardYml = readFileSync(path.join(root, ".github/workflows/agent-pr-guard.yml"), "utf8");
const agentsYml = readFileSync(path.join(root, ".github/workflows/agents.yml"), "utf8");

/** The `run: |` block of the step with this `name:` (literal block scalar only). */
function runBlock(yml, stepName) {
  const lines = yml.split("\n");
  const i = lines.findIndex((l) => l.trim() === `- name: ${stepName}`);
  assert.ok(i >= 0, `step ${stepName} not found`);
  const r = lines.findIndex((l, k) => k > i && /^\s+run: \|\s*$/.test(l));
  assert.ok(r > i, `no run block in ${stepName}`);
  const indent = lines[r + 1].match(/^\s*/)[0].length;
  const out = [];
  for (let k = r + 1; k < lines.length && (lines[k].trim() === "" || lines[k].match(/^\s*/)[0].length >= indent); k++) out.push(lines[k].slice(indent));
  return out.join("\n");
}
const sh = (script, env, cwd) => spawnSync("bash", ["-c", script], { env: { PATH: process.env.PATH, HOME: os.tmpdir(), ...env }, cwd, encoding: "utf8" });

const HEX = "a".repeat(40);
const scopeOf = (over) => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "scope-"));
  const out = path.join(dir, "out");
  writeFileSync(out, "");
  const r = sh(runBlock(guardYml, "Read the event"), { PR_NUMBER: "7", PR_BASE_SHA: HEX, PR_HEAD_SHA: HEX, PR_BRANCH: "feat/x", PR_AUTHOR: "asha", PR_LABELS: "", GITHUB_OUTPUT: out, ...over }, dir);
  return { status: r.status, scope: /in_scope=(\w+)/.exec(readFileSync(out, "utf8"))?.[1] };
};

test("guard scope: a human PR with no labels (empty join) is out of scope and passes", () => {
  assert.deepEqual(scopeOf({}), { status: 0, scope: "no" });
});
test("guard scope: branch prefix, bot author or label each put a PR in scope", () => {
  assert.equal(scopeOf({ PR_BRANCH: "agent/product/x" }).scope, "yes");
  assert.equal(scopeOf({ PR_AUTHOR: "agents[bot]" }).scope, "yes");
  assert.equal(scopeOf({ PR_LABELS: "bug,Agent:product" }).scope, "yes");
});
test("guard scope: a bot PR with no labels is in scope (it will fail pathguard as unlabelled)", () => {
  assert.equal(scopeOf({ PR_AUTHOR: "dependabot[bot]", PR_LABELS: "" }).scope, "yes");
});
test("guard scope: empty or malformed event data fails closed", () => {
  for (const k of ["PR_NUMBER", "PR_BASE_SHA", "PR_HEAD_SHA", "PR_BRANCH", "PR_AUTHOR"]) assert.equal(scopeOf({ [k]: "" }).status, 1, k);
  assert.equal(scopeOf({ PR_HEAD_SHA: "main" }).status, 1);
  assert.equal(scopeOf({ PR_BASE_SHA: HEX + "; id" }).status, 1);
});

test("guard workflow: pinned actions, read-only, no head checkout, no secrets", () => {
  for (const m of guardYml.matchAll(/uses:\s*(\S+)/g)) assert.match(m[1], /@[0-9a-f]{40}$/, m[1]);
  assert.match(guardYml, /permissions:\n  contents: read\n  pull-requests: read\n/);
  assert.doesNotMatch(guardYml, /\$\{\{\s*secrets\./);
  assert.doesNotMatch(guardYml, /pull_request_target/);
  assert.match(guardYml, /ref: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/);
  assert.doesNotMatch(guardYml, /pull_request\.(title|body)/);
});
test("agents.yml: gated by AGENTS_ENABLED, post-run scripts from the trusted copy", () => {
  assert.match(agentsYml, /if: vars\.AGENTS_ENABLED == 'true'/);
  assert.doesNotMatch(agentsYml, /node scripts\/agents\/(salvage|receipt)\.mjs/);
  assert.match(agentsYml, /\$RUNNER_TEMP\/trusted\/scripts\/agents\/salvage\.mjs/);
  assert.match(agentsYml, /\$RUNNER_TEMP\/trusted\/scripts\/agents\/receipt\.mjs/);
});

// The gate step, run in a throwaway repo with the repo's own pathguard as the "trusted copy".
function gate({ branch, change, agent = "product", plant = false }) {
  const dir = mkdtempSync(path.join(os.tmpdir(), "gate-"));
  const work = path.join(dir, "work");
  const temp = path.join(dir, "temp");
  mkdirSync(work); mkdirSync(temp);
  mkdirSync(path.join(temp, "trusted"));
  for (const d of ["scripts", "agents"]) cpSync(path.join(root, d), path.join(temp, "trusted", d), { recursive: true }) // a copy, not a symlink: pathguard.mjs does nothing when run through one;
  const g = (...a) => spawnSync("git", a, { cwd: work, encoding: "utf8", env: { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1" } });
  g("init", "-q", "-b", "develop");
  writeFileSync(path.join(work, "README.md"), "x\n");
  g("add", "-A"); g("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "base");
  const base = g("rev-parse", "HEAD").stdout.trim();
  if (branch) g("checkout", "-q", "-b", branch);
  if (plant) {
    writeFileSync(path.join(work, ".git/hooks/pre-commit"), "#!/bin/sh\ntouch /tmp/hook-ran-$$\n", { mode: 0o755 });
    g("config", "core.fsmonitor", "touch " + path.join(dir, "fsmonitor-ran"));
    g("config", "core.hooksPath", path.join(work, ".git/hooks"));
  }
  if (change) { mkdirSync(path.dirname(path.join(work, change)), { recursive: true }); writeFileSync(path.join(work, change), "y\n"); }
  const out = path.join(dir, "out");
  writeFileSync(out, "");
  const r = sh(runBlock(agentsYml, "Gate the branch and the paths"), {
    AGENT: agent, BASE_SHA: base, AUTHOR: "agents[bot]", GITHUB_OUTPUT: out, RUNNER_TEMP: temp, GITHUB_REPOSITORY: "o/r", GITHUB_RUN_ID: "42",
    GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: path.join(temp, "gitconfig-trusted"), GIT_CONFIG_COUNT: "3",
    GIT_CONFIG_KEY_0: "core.hooksPath", GIT_CONFIG_VALUE_0: "/dev/null", GIT_CONFIG_KEY_1: "core.fsmonitor", GIT_CONFIG_VALUE_1: "false",
    GIT_CONFIG_KEY_2: "core.sshCommand", GIT_CONFIG_VALUE_2: "false",
  }, work);
  const o = Object.fromEntries(readFileSync(out, "utf8").split("\n").filter(Boolean).map((l) => l.split(/=(.*)/s).slice(0, 2)));
  return { r, o, work, dir, branchNow: g("symbolic-ref", "--short", "HEAD").stdout.trim() };
}

test("gate: a clean agent branch with an allowed change passes", () => {
  const x = gate({ branch: "agent/product/t1-x", change: "docs/BACKLOG.md" });
  assert.equal(x.r.status, 0, x.r.stderr + x.r.stdout);
  assert.equal(x.o.ok, "true");
  assert.equal(x.o.branch, "agent/product/t1-x");
});
test("gate: any other branch name is moved to agent/<handle>/wip-<run> before the push", () => {
  for (const b of ["feat/anything", "develop", "agent/other/x", "agent/product/../x", "agent/product/x.lock"]) {
    const x = gate({ branch: b === "develop" ? null : b, change: "docs/BACKLOG.md" });
    assert.equal(x.r.status, 0, b + x.r.stderr);
    assert.equal(x.o.branch, "agent/product/wip-42", b);
    assert.equal(x.branchNow, "agent/product/wip-42", b);
  }
});
test("gate: a change outside the lane is refused and nothing is marked ok", () => {
  const x = gate({ branch: "agent/product/t1-x", change: ".github/workflows/ci.yml" });
  assert.notEqual(x.r.status, 0);
  assert.equal(x.o.ok, "false");
});
test("gate: nothing beyond the base commit is not an error and not ok", () => {
  const x = gate({ branch: "agent/product/t1-x" });
  assert.equal(x.r.status, 0);
  assert.equal(x.o.ok, "false");
});
test("gate: a handle that is not plain, or a bad base sha, fails closed", () => {
  assert.notEqual(gate({ branch: "agent/product/x", change: "docs/BACKLOG.md", agent: "Product; id" }).r.status, 0);
});
test("gate: planted hooks and fsmonitor in .git are not run by the commit", () => {
  const x = gate({ branch: "agent/product/t1-x", change: "docs/BACKLOG.md", plant: true });
  assert.equal(x.r.status, 0, x.r.stderr);
  assert.throws(() => rf(path.join(x.dir, "fsmonitor-ran")), /ENOENT/);
  assert.equal(readFileSync(path.join(x.work, ".git/config"), "utf8").includes("fsmonitor"), false);
});
