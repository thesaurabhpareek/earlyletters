// Tests for the agent workflow gates. Run: node --test scripts/workflows.test.mjs
// The workflow files are PARSED as YAML; their `run:` blocks are executed with bash -eo pipefail
// (the runner default plus pipefail), with the env the step itself declares. Where the step needs
// the network (gh, git fetch) a stub stands in. These tests do NOT prove GitHub evaluates the
// `${{ }}` expressions the way the tests set the env, or that the REST/GraphQL calls behave:
// that needs a real run. WF_AGENTS / WF_GUARD point the tests at a mutated copy of a workflow.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, writeFileSync, mkdirSync, cpSync, existsSync, chmodSync, rmSync, statSync, symlinkSync, renameSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const guardPath = process.env.WF_GUARD ?? path.join(root, ".github/workflows/agent-pr-guard.yml");
const agentsPath = process.env.WF_AGENTS ?? path.join(root, ".github/workflows/agents.yml");
const guardText = readFileSync(guardPath, "utf8");
const agentsText = readFileSync(agentsPath, "utf8");

async function loadYaml(text) {
  try { const y = await import("yaml"); return (y.parse ?? y.default.parse)(text); } catch { /* fall through */ }
  const r = spawnSync("python3", ["-I", "-c", "import sys,json,yaml;print(json.dumps(yaml.safe_load(sys.stdin.read())))"], { input: text, encoding: "utf8" });
  assert.equal(r.status, 0, "no YAML parser available (node 'yaml' or python3 PyYAML): " + r.stderr);
  return JSON.parse(r.stdout);
}
const guard = await loadYaml(guardText);
const agents = await loadYaml(agentsText);
// YAML 1.1 parsers turn the key `on` into true.
const triggers = (d) => d.on ?? d[true];
const stepsOf = (doc, job) => doc.jobs[job].steps;
const step = (doc, job, name) => {
  const s = stepsOf(doc, job).find((x) => x.name === name);
  assert.ok(s, `step "${name}" not found`);
  return s;
};
const stripComments = (t) => t.split("\n").filter((l) => !/^\s*#/.test(l)).join("\n");

/** Env a step declares; `${{ }}` values come from `exprs`, a missing one fails the test. */
function stepEnv(s, exprs = {}, extra = {}) {
  const env = {};
  for (const [k, v] of Object.entries(s.env ?? {})) {
    const val = String(v);
    if (val.includes("${{")) {
      assert.ok(k in exprs, `test has no value for ${k} = ${val}`);
      env[k] = exprs[k];
    } else env[k] = val;
  }
  return { PATH: process.env.PATH, HOME: os.tmpdir(), ...env, ...extra };
}
// Run a step's script with the flags the step declares in `shell:` (the runner default for an
// implicit shell on Linux is `bash -e {0}`).
const shellArgs = (shell) => (shell ? String(shell).split(/\s+/).slice(1).filter((t) => t !== "{0}") : ["-e"]);
const bash = (script, env, cwd, shell) => spawnSync("/usr/bin/bash", [...shellArgs(shell), "-c", script], { env, cwd, encoding: "utf8" });
// Every temp directory lives under ONE per-run root (under TMPDIR), removed when the process exits.
const RUN_ROOT = mkdtempSync(path.join(os.tmpdir(), "wf-test-"));
process.on("exit", () => rmSync(RUN_ROOT, { recursive: true, force: true }));
const tmp = (p) => mkdtempSync(path.join(RUN_ROOT, p));
const HEX = "a".repeat(40);

// ---------------------------------------------------------------- guard: triggers and trust
test("guard: runs on pull_request_target with the full types list", () => {
  const t = triggers(guard);
  assert.ok(t.pull_request_target, "must be pull_request_target (the workflow copy on the base branch runs)");
  assert.equal(t.pull_request, undefined);
  for (const ty of ["opened", "synchronize", "reopened", "edited", "labeled", "unlabeled", "ready_for_review", "converted_to_draft"]) assert.ok(t.pull_request_target.types.includes(ty), ty);
});
test("guard: never checks out or runs PR head code; only the base sha is checked out", () => {
  const checkouts = stepsOf(guard, "guard").filter((s) => String(s.uses ?? "").startsWith("actions/checkout@"));
  assert.equal(checkouts.length, 1);
  assert.equal(checkouts[0].with.ref, "${{ github.event.pull_request.base.sha }}");
  assert.equal(checkouts[0].with["persist-credentials"], false);
  const code = stripComments(guardText);
  assert.doesNotMatch(code, /pull_request\.head\.repo|refs\/pull\/\$\{\{|merge_commit_sha|\/merge\b/);
  assert.doesNotMatch(code, /git (checkout|switch|merge|rebase|cherry-pick)\b/);
  for (const m of code.matchAll(/github\.event\.pull_request\.head\.([a-z_.]+)/g)) assert.ok(["sha", "ref"].includes(m[1]), "head field used: " + m[1]);
  for (const s of stepsOf(guard, "guard")) if (s.with?.ref) assert.doesNotMatch(String(s.with.ref), /head|merge/);
});
test("guard: pinned actions, read-only permissions, no secrets, no PR text", () => {
  for (const s of stepsOf(guard, "guard")) if (s.uses) assert.match(s.uses, /@[0-9a-f]{40}$/, s.uses);
  assert.deepEqual(guard.permissions, { contents: "read", "pull-requests": "read" });
  const code = stripComments(guardText);
  assert.doesNotMatch(code, /\$\{\{\s*secrets\./);
  assert.doesNotMatch(code, /pull_request\.(title|body)/);
});

// ---------------------------------------------------------------- guard: scope step
const withJobEnv = (s) => ({ ...s, env: { ...guard.jobs.guard.env, ...(s.env ?? {}) } });
const scopeStep = withJobEnv(step(guard, "guard", "Read the event"));
const guardEnvExprs = { PR_NUMBER: "7", PR_BASE_SHA: HEX, PR_BASE_REF: "develop", PR_HEAD_SHA: HEX, PR_BRANCH: "feat/x", PR_AUTHOR: "asha", PR_AUTHOR_TYPE: "User", PR_LABELS: "", NON_AGENT_BOTS: "dependabot[bot]" };
function scopeOf(over = {}) {
  const dir = tmp("scope-");
  const out = path.join(dir, "out");
  writeFileSync(out, "");
  const r = bash(scopeStep.run, stepEnv(scopeStep, { ...guardEnvExprs, ...over }, { GITHUB_OUTPUT: out }), dir, scopeStep.shell);
  return { status: r.status, scope: /in_scope=(\w+)/.exec(readFileSync(out, "utf8"))?.[1], err: r.stderr };
}
test("scope: a human PR with no labels (empty join) is out of scope and passes", () => {
  assert.deepEqual({ ...scopeOf(), err: undefined }, { status: 0, scope: "no", err: undefined });
});
test("scope: branch prefix, bot author or label each put a PR in scope", () => {
  assert.equal(scopeOf({ PR_BRANCH: "agent/product/x" }).scope, "yes");
  assert.equal(scopeOf({ PR_AUTHOR: "agents[bot]" }).scope, "yes");
  assert.equal(scopeOf({ PR_LABELS: "bug,Agent:product" }).scope, "yes");
});
test("scope: an author type of Bot is in scope even if the login does not end [bot]; the branch prefix is case-insensitive", () => {
  assert.equal(scopeOf({ PR_AUTHOR: "svc-account", PR_AUTHOR_TYPE: "Bot" }).scope, "yes");
  assert.equal(scopeOf({ PR_AUTHOR: "svc-account", PR_AUTHOR_TYPE: "User" }).scope, "no");
  assert.equal(scopeOf({ PR_BRANCH: "Agent/product/x" }).scope, "yes");
  assert.equal(scopeOf({ PR_BRANCH: "AGENT/product/x" }).scope, "yes");
});
test("scope: NON_AGENT_BOTS (default dependabot[bot]) is out of scope; other bots stay in scope", () => {
  assert.equal(scopeOf({ PR_AUTHOR: "dependabot[bot]" }).scope, "no");
  assert.equal(scopeOf({ PR_AUTHOR: "Dependabot[bot]" }).scope, "no");
  assert.equal(scopeOf({ PR_AUTHOR: "renovate[bot]" }).scope, "yes");
  assert.equal(scopeOf({ PR_AUTHOR: "renovate[bot]", NON_AGENT_BOTS: "dependabot[bot],renovate[bot]" }).scope, "no");
  assert.equal(scopeOf({ PR_AUTHOR: "agents[bot]", NON_AGENT_BOTS: "dependabot[bot]" }).scope, "yes");
});
test("scope: an agent/ branch or agent:* label is in scope whoever the author is, even a listed bot", () => {
  assert.equal(scopeOf({ PR_AUTHOR: "dependabot[bot]", PR_BRANCH: "agent/ops/x" }).scope, "yes");
  assert.equal(scopeOf({ PR_AUTHOR: "dependabot[bot]", PR_LABELS: "agent:ops" }).scope, "yes");
});
test("scope: the guard step defaults NON_AGENT_BOTS to dependabot[bot]", () => {
  assert.match(String(guard.jobs.guard.env.NON_AGENT_BOTS), /vars\.NON_AGENT_BOTS \|\| 'dependabot\[bot\]'/);
});
test("scope: empty or malformed event data fails closed, including the author type and base ref", () => {
  for (const k of ["PR_NUMBER", "PR_BASE_SHA", "PR_BASE_REF", "PR_HEAD_SHA", "PR_BRANCH", "PR_AUTHOR", "PR_AUTHOR_TYPE"]) assert.equal(scopeOf({ [k]: "" }).status, 1, k);
  assert.equal(scopeOf({ PR_HEAD_SHA: "main" }).status, 1);
  assert.equal(scopeOf({ PR_BASE_SHA: HEX + "; id" }).status, 1);
});
test("scope: an agent PR must target develop or main (a retarget fires edited and re-runs this)", () => {
  assert.equal(scopeOf({ PR_BRANCH: "agent/ops/x", PR_BASE_REF: "develop" }).status, 0);
  assert.equal(scopeOf({ PR_BRANCH: "agent/ops/x", PR_BASE_REF: "main" }).status, 0);
  assert.equal(scopeOf({ PR_BRANCH: "agent/ops/x", PR_BASE_REF: "release/1" }).status, 1);
  assert.equal(scopeOf({ PR_AUTHOR: "agents[bot]", PR_BASE_REF: "fix/x" }).status, 1);
  assert.equal(scopeOf({ PR_BASE_REF: "fix/stack" }).status, 0, "a non-agent PR may target any branch");
});

// ---------------------------------------------------------------- guard: step wiring
const IN_SCOPE = "steps.scope.outputs.in_scope == 'yes'";
function stubDir(files) {
  const d = tmp("stub-");
  for (const [rel, content] of Object.entries(files)) {
    const f = path.join(d, rel);
    mkdirSync(path.dirname(f), { recursive: true });
    writeFileSync(f, content);
    chmodSync(f, 0o755);
  }
  return d;
}
const recorder = (file) => `import { writeFileSync } from "node:fs"; writeFileSync(${JSON.stringify(file)}, JSON.stringify(process.argv.slice(2))); `;
test("guard: the pathguard step is not skipped for in-scope PRs and binds every argument to the event data", () => {
  const s = withJobEnv(step(guard, "guard", "Path guard"));
  assert.equal(s.if, IN_SCOPE);
  const rec = path.join(tmp("rec-"), "argv.json");
  const cwd = stubDir({ "scripts/agents/pathguard.mjs": recorder(rec) });
  const env = stepEnv(s, { ...guardEnvExprs, PR_LABELS: "", PR_BRANCH: "agent/ops/t1", PR_AUTHOR: "agents[bot]", PR_AUTHOR_TYPE: "Bot", PR_BASE_SHA: "b".repeat(40), PR_HEAD_SHA: "c".repeat(40), AGENTS_BOT_LOGINS: "agents[bot]" });
  Object.assign(env, { PR_LABELS: "", PR_BRANCH: "agent/ops/t1", PR_AUTHOR: "agents[bot]", PR_AUTHOR_TYPE: "Bot", PR_BASE_SHA: "b".repeat(40), PR_HEAD_SHA: "c".repeat(40) });
  const r = bash(s.run, env, cwd, s.shell);
  assert.equal(r.status, 0, r.stderr);
  const argv = JSON.parse(readFileSync(rec, "utf8"));
  const flag = (n) => argv[argv.indexOf(`--${n}`) + 1];
  assert.deepEqual(["labels", "branch", "author", "author-type", "base", "head"].map(flag), ["", "agent/ops/t1", "agents[bot]", "Bot", "b".repeat(40), "c".repeat(40)]);
  assert.equal(argv.length, 12, "no other arguments");
});
test("guard: the cap step is not skipped and really invokes guard-open-prs with --max 16 and the repo", () => {
  const s = withJobEnv(step(guard, "guard", "Open agent PR cap"));
  assert.equal(s.if, IN_SCOPE);
  const rec = path.join(tmp("rec-"), "argv.json");
  const cwd = stubDir({ "scripts/agents/guard-open-prs.mjs": recorder(rec) });
  const r = bash(s.run, stepEnv(s, { ...guardEnvExprs, GH_TOKEN: "t", AGENTS_BOT_LOGINS: "" }, { GITHUB_REPOSITORY: "o/r" }), cwd, s.shell);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(JSON.parse(readFileSync(rec, "utf8")), ["--max", "16", "--repo", "o/r"]);
  assert.equal(guard.jobs.guard.steps.filter((x) => x.if !== IN_SCOPE && x.name !== "Read the event").length, 0, "every later step is gated on scope only");
});
test("guard: the PR head sha is verified against the event (mismatch fails, match passes)", () => {
  const s = step(guard, "guard", "Fetch the PR head as git objects only");
  const run = (revParse) => {
    const bin = stubDir({ git: `#!/bin/sh\nif [ "$1" = rev-parse ]; then echo ${revParse}; fi\nexit 0\n` });
    return bash(s.run, stepEnv(s, {}, { PR_NUMBER: "7", PR_HEAD_SHA: HEX, PATH: bin + ":" + process.env.PATH }), bin, s.shell);
  };
  assert.equal(run(HEX).status, 0);
  assert.notEqual(run("d".repeat(40)).status, 0);
  assert.match(s.run, /refs\/pull\/\$\{PR_NUMBER\}\/head:refs\/remotes\/pr\/head/);
});

// ---------------------------------------------------------------- agents.yml: gating and sources
const run = (name) => step(agents, "run", name);
test("agents.yml: AGENTS_ENABLED gates the plan job, the run job needs it, triggers are only schedule and dispatch", () => {
  assert.equal(agents.jobs.plan.if, "vars.AGENTS_ENABLED == 'true'");
  assert.deepEqual([].concat(agents.jobs.run.needs), ["plan"]);
  assert.match(agents.jobs.run.if, /needs\.plan\.outputs\.count != '0'/);
  assert.deepEqual(Object.keys(triggers(agents)).sort(), ["schedule", "workflow_dispatch"]);
  assert.doesNotMatch(String(agents.jobs.run.if), /\|\|/);
});
test("agents.yml: BASE_SHA comes from the recorded base step, and the trusted scripts are that commit", () => {
  const rec = run("Record the base commit");
  assert.equal(rec.id, "base");
  assert.match(rec.run, /echo "sha=\$\(git rev-parse HEAD\)" >> "\$GITHUB_OUTPUT"/);
  assert.ok(stepsOf(agents, "run").indexOf(rec) < stepsOf(agents, "run").findIndex((x) => x.name === "Agent (OpenCode)"), "recorded before the model runs");
  for (const n of ["Gate the branch and the paths", "Fetch trusted post-run scripts"]) assert.equal(run(n).env.BASE_SHA, "${{ steps.base.outputs.sha }}");
  assert.match(run("Fetch trusted post-run scripts").run, /tarball\/\$\{BASE_SHA\}/);
  assert.doesNotMatch(run("Fetch trusted post-run scripts").run, /tarball\/develop/);
});
test("agents.yml: salvage only after the gate, with the replace/ref re-clean and a HEAD check", () => {
  const s = run("Save unfinished work");
  assert.equal(s.if, "always() && steps.gate.outputs.ok == 'true'");
  assert.equal(s.env.GIT_NO_REPLACE_OBJECTS, "1");
  assert.match(s.run, /rm -rf \.git\/refs\/replace/);
  assert.match(s.run, /rev-parse HEAD\)" = "\$GATED_HEAD"/);
  assert.match(s.run, /\$RUNNER_TEMP\/trusted\/scripts\/agents\/salvage\.mjs/);
  assert.doesNotMatch(stripComments(agentsText), /node scripts\/agents\/(salvage|receipt)\.mjs/);
});
test("agents.yml: the post-run steps run with a clean environment and absolute tool paths", () => {
  for (const n of ["Gate the branch and the paths", "Save unfinished work", "Fetch trusted post-run scripts"]) {
    const s = run(n);
    for (const k of ["BASH_ENV", "ENV", "LD_PRELOAD", "NODE_OPTIONS"]) assert.equal(s.env[k], "", `${n}: ${k}`);
    assert.match(s.shell, /--noprofile --norc/);
  }
  for (const m of ["/usr/bin/gh", "/usr/bin/tar", "/bin/rm", "/bin/mkdir"]) assert.ok(run("Fetch trusted post-run scripts").run.includes(m), m);
  assert.match(run("Gate the branch and the paths").run, /unset GIT_DIR[^\n]*GIT_EXEC_PATH[^\n]*GIT_ASKPASS/);
});

// ---------------------------------------------------------------- label step
const labelStep = run("Open the PR and label it");
test("label step: handle from matrix.agent, runs only after gate and salvage, allow-list labels, paginated", () => {
  assert.equal(labelStep.if, "always() && steps.gate.outputs.ok == 'true' && steps.salvage.outcome == 'success'");
  assert.equal(labelStep.env.AGENT, "${{ matrix.agent }}");
  assert.equal(labelStep.env.WANT, "${{ format('agent:{0}', matrix.agent) }}");
  assert.match(labelStep.run, /--paginate/);
  assert.match(labelStep.run, /per_page=100/);
  assert.match(labelStep.run, /-X PUT[^\n]*issues\/\$\{num\}\/labels/);
  assert.doesNotMatch(labelStep.run, /-X DELETE[^\n]*\/labels/);
  assert.doesNotMatch(stripComments(JSON.stringify(labelStep)), /pull_request|github\.event/);
});
// A gh stub that answers from JSON fixtures and runs the REAL jq expression the step passes with --jq,
// so the policy fields (.user.login, .base.ref, .draft, the marker) are read by the step's own jq.
// The PR list answers depend on the query: a dropped `head=` filter or `state=open` returns 77 and 78.
function labelRun({ remote = HEX, existing = "", prs = {}, reviewers = {}, teams = {}, assignees = {}, failReady = false, mergeError = "", branch = "agent/ops/t1-x", author = "agents[bot]", headSha = HEX } = {}) {
  const dir = tmp("label-");
  const log = path.join(dir, "calls.log");
  const gh = path.join(dir, "gh");
  const j = (f, o) => writeFileSync(path.join(dir, f), JSON.stringify(o));
  j("ref.json", { object: { sha: remote } });
  j("list.json", existing.split("\n").filter(Boolean).map((n) => ({ number: Number(n) })));
  j("extra.json", [{ number: 77 }, { number: 78 }]);
  j("created.json", { number: 99 });
  for (const n of new Set([...existing.split("\n").filter(Boolean), "99"])) {
    const pr = prs[n] ?? { login: "x", type: "User", base: "develop", draft: true, body: "" };
    j(`pr-${n}.json`, { user: { login: pr.login, type: pr.type }, base: { ref: pr.base }, head: { ref: "wrong-head-ref" }, draft: pr.draft, body: pr.body });
    j(`rev-${n}.json`, { users: (reviewers[n] ?? []).map((l) => ({ login: l })), teams: (teams[n] ?? []).map((t) => ({ slug: t })) });
    j(`issue-${n}.json`, { assignees: (assignees[n] ?? []).map((l) => ({ login: l })), user: { login: "wrong" } });
  }
  if (mergeError) writeFileSync(path.join(dir, "merge-error"), mergeError);
  writeFileSync(gh, `#!/bin/bash
echo "$*" >> ${log}
D=${dir}
expr=""; a=("$@"); for ((i=0;i<\${#a[@]};i++)); do [[ "\${a[i]}" == "--jq" ]] && expr="\${a[i+1]}"; done
q() { /usr/bin/jq -r "$expr" "$D/$1"; }
if [[ "$1 $2" == "pr merge" && -f $D/merge-error ]]; then cat $D/merge-error >&2; exit 1; fi
if [[ "$1 $2" == "pr ready" && "${failReady}" == "true" ]]; then exit 1; fi
[[ -z "$expr" ]] && { [[ "$*" == *"-X POST"*"/pulls "* ]] && echo 99; exit 0; }
case "$*" in
  *git/ref/heads*) q ref.json;;
  *"-X GET"*pulls*) if [[ "$*" == *"state=open"* && "$*" == *"head=o:${branch}"* ]]; then q list.json; else q extra.json; fi;;
  *"-X POST"*pulls*) q created.json;;
  *requested_reviewers*) q rev-$(echo "$*" | sed -E 's#.*pulls/([0-9]+)/.*#\\1#').json;;
  *"/issues/"*) q issue-$(echo "$*" | sed -E 's#.*issues/([0-9]+).*#\\1#').json;;
  *"/pulls/"*) q pr-$(echo "$*" | sed -E 's#.*pulls/([0-9]+).*#\\1#').json;;
esac
exit 0
`);
  chmodSync(gh, 0o755);
  const script = labelStep.run.replace("GH=/usr/bin/gh", `GH=${gh}`);
  assert.notEqual(script, labelStep.run, "the GH= line moved");
  const vals = { GH_TOKEN: "t", AGENT: "ops", AUTHOR: author, BRANCH: branch, HEAD_SHA: headSha, SUBJECT: "did a thing", RUN_URL: "u", WANT: "agent:ops" };
  const r = bash(script, stepEnv(labelStep, vals, { ...vals, GITHUB_REPOSITORY: "o/r", GITHUB_REPOSITORY_OWNER: "o" }), dir, labelStep.shell);
  return { r, calls: existsSync(log) ? readFileSync(log, "utf8").trim().split("\n") : [] };
}
const MARK = "<!-- agents-workflow -->\nOpened by the workflow";
const pr = (o) => ({ login: "someone", type: "User", base: "develop", draft: true, body: "", ...o });
// A body holds a newline, so a logged call can span two lines: join continuation lines.
const patchOf = (x, n) => {
  const i = x.calls.findIndex((c) => c.includes(`-X PATCH repos/o/r/pulls/${n} `));
  if (i < 0) return undefined;
  let t = x.calls[i];
  for (let k = i + 1; k < x.calls.length && !/^(api|pr) /.test(x.calls[k]); k++) t += " " + x.calls[k];
  return t;
};
const putOf = (x, n) => x.calls.filter((c) => c.includes(`-X PUT repos/o/r/issues/${n}/labels`));
test("label step: a branch on GitHub that is not the checked commit opens nothing and labels nothing", () => {
  const x = labelRun({ remote: "e".repeat(40) });
  assert.notEqual(x.r.status, 0);
  assert.equal(x.calls.length, 1);
});
test("label step: a branch outside agent/<handle>/ or a head sha that is not 40 hex is refused before any call", () => {
  for (const b of ["feat/x", "agent/other/x", "agent/ops"]) { const x = labelRun({ branch: b }); assert.notEqual(x.r.status, 0, b); assert.equal(x.calls.length, 0, b); }
  for (const h of ["xyz", "A".repeat(40), "a".repeat(39), ""]) { const x = labelRun({ headSha: h }); assert.notEqual(x.r.status, 0, h); assert.equal(x.calls.length, 0, h); }
});
test("label step: no existing PR opens a draft into develop with head=<branch>, and sets exactly the two labels", () => {
  const x = labelRun({});
  assert.equal(x.r.status, 0, x.r.stderr);
  const post = x.calls.find((c) => /-X POST repos\/o\/r\/pulls /.test(c));
  assert.ok(post && post.includes("-f head=agent/ops/t1-x") && post.includes("-f base=develop") && post.includes("draft=true"), post);
  const put = putOf(x, 99);
  assert.equal(put.length, 1);
  assert.match(put[0], /-f labels\[\]=agent:ops -f labels\[\]=from:agent$/);
});
test("label step: the PR query keeps its head filter and state=open and is paginated", () => {
  const x = labelRun({ existing: "12", prs: { 12: pr({ login: "agents[bot]", body: MARK }) } });
  assert.equal(x.r.status, 0, x.r.stderr);
  assert.ok(!x.calls.some((c) => /\b(77|78)\b/.test(c)), x.calls.join("\n"));
  assert.ok(x.calls.find((c) => c.includes("-X GET")).includes("--paginate"));
});
test("label step policy: a PR the workflow did not create, with a base other than develop, is fully reset", () => {
  const x = labelRun({ existing: "12", prs: { 12: pr({ base: "feature" }) }, reviewers: { 12: ["rev1"] }, teams: { 12: ["team1"] }, assignees: { 12: ["asg1"] } });
  assert.equal(x.r.status, 0, x.r.stderr);
  const patch = patchOf(x, 12);
  assert.match(patch, /base=develop/);
  assert.match(patch, /title=ops: did a thing/);
  assert.match(patch, /body=<!-- agents-workflow -->/);
  assert.match(patch, /maintainer_can_modify=false/);
  assert.match(putOf(x, 12)[0], /-f labels\[\]=agent:ops -f labels\[\]=from:agent$/);
  assert.ok(x.calls.some((c) => c.startsWith("pr merge 12 --disable-auto") && c.includes("--repo o/r")));
  assert.ok(!x.calls.some((c) => c.startsWith("pr ready")), "already a draft: no conversion");
  assert.ok(!x.calls.some((c) => c.includes("-X POST repos/o/r/pulls ")), "no second PR");
});
test("label step policy: a draft is not converted again, a non-draft is (with --repo)", () => {
  const draft = labelRun({ existing: "12", prs: { 12: pr({ draft: true }) } });
  assert.ok(!draft.calls.some((c) => c.startsWith("pr ready")));
  const live = labelRun({ existing: "12", prs: { 12: pr({ draft: false }) } });
  assert.ok(live.calls.some((c) => c === "pr ready 12 --undo --repo o/r"), live.calls.join("\n"));
});
test("label step policy: reviewers, teams and assignees are removed separately, from paginated reads", () => {
  const cases = [
    [{ reviewers: { 12: ["u1", "u2"] } }, [/-X DELETE repos\/o\/r\/pulls\/12\/requested_reviewers .*reviewers\[\]=u1 .*reviewers\[\]=u2/], [/team_reviewers/, /\/assignees/]],
    [{ teams: { 12: ["t1"] } }, [/-X DELETE repos\/o\/r\/pulls\/12\/requested_reviewers .*team_reviewers\[\]=t1/], [/ reviewers\[\]=/, /\/assignees/]],
    [{ assignees: { 12: ["a1"] } }, [/-X DELETE repos\/o\/r\/issues\/12\/assignees .*assignees\[\]=a1/], [/requested_reviewers .*-X DELETE|-X DELETE .*requested_reviewers/]],
    [{}, [], [/-X DELETE/]],
  ];
  for (const [extra, want, notWant] of cases) {
    const x = labelRun({ existing: "12", prs: { 12: pr({}) }, ...extra });
    assert.equal(x.r.status, 0, x.r.stderr);
    const text = x.calls.join("\n");
    for (const w of want) assert.match(text, w);
    for (const n of notWant) assert.doesNotMatch(text, n);
    assert.ok(x.calls.filter((c) => /requested_reviewers|issues\/12 /.test(c) && !c.includes("-X DELETE")).every((c) => c.includes("--paginate")), "reads are paginated");
  }
});
test("label step policy: title and body of a legitimate PR (workflow-made, or already on develop) are left alone", () => {
  for (const p of [pr({ login: "agents[bot]", body: MARK }), pr({ login: "someone" }), pr({ login: "agents[bot]", draft: false })]) {
    const x = labelRun({ existing: "12", prs: { 12: p } });
    assert.equal(x.r.status, 0, x.r.stderr);
    const patch = patchOf(x, 12);
    assert.match(patch, /base=develop/);
    assert.match(patch, /maintainer_can_modify=false/);
    assert.doesNotMatch(patch, /title=|body=/, JSON.stringify(p));
    assert.equal(putOf(x, 12).length, 1);
  }
  // identity and marker both needed: the login comes from .user.login (not .user.type, not the issue's user), the base from .base.ref (not .head.ref)
  for (const p of [pr({ login: "someone", base: "feature", body: MARK }), pr({ login: "agents[bot]", base: "feature", body: "no marker" }), pr({ login: "someone", type: "Bot", base: "feature", body: MARK }), pr({ login: "agents[bot]", base: "feature", body: "a workflow thing, no marker" })]) {
    assert.match(patchOf(labelRun({ existing: "12", prs: { 12: p } }), 12), /title=/, JSON.stringify(p));
  }
  assert.doesNotMatch(patchOf(labelRun({ existing: "12", prs: { 12: pr({ login: "agents[bot]", type: "Bot", base: "develop", body: MARK }) } }), 12), /title=/);
  // workflow-made (login AND marker) but on a foreign base: only the base is reset, the text stays
  assert.doesNotMatch(patchOf(labelRun({ existing: "12", prs: { 12: pr({ login: "agents[bot]", type: "User", base: "feature", body: MARK }) } }), 12), /title=|body=/);
});
test("label step: labels are PUT before anything that can fail; a failed draft conversion fails the step loudly", () => {
  const x = labelRun({ existing: "12", prs: { 12: pr({ draft: false }) }, failReady: true });
  assert.notEqual(x.r.status, 0);
  assert.match(x.r.stderr, /FAILED: .*pr ready 12 --undo/);
  assert.equal(putOf(x, 12).length, 1, "labels were set");
  assert.ok(x.calls.findIndex((c) => c.includes("-X PUT")) < x.calls.findIndex((c) => c.startsWith("pr ready")));
});
test("label step: 'auto-merge is not enabled' from gh pr merge --disable-auto is tolerated; any other error fails loudly", () => {
  for (const m of ["GraphQL: Auto merge is not enabled for this pull request", "auto-merge is not allowed for this repository"]) {
    const x = labelRun({ existing: "12", prs: { 12: pr({}) }, mergeError: m });
    assert.equal(x.r.status, 0, m + x.r.stderr);
  }
  const bad = labelRun({ existing: "12", prs: { 12: pr({}) }, mergeError: "HTTP 502 bad gateway" });
  assert.notEqual(bad.r.status, 0);
  assert.match(bad.r.stderr, /FAILED: pr merge --disable-auto/);
  assert.equal(putOf(bad, 12).length, 1);
});

// ---------------------------------------------------------------- gate, in a real repo with the real pathguard
const gateStep = run("Gate the branch and the paths");
function gate({ branch, change, agent = "product", baseSha, setup, stubPathguard, extraEnv = {}, mutate } = {}) {
  const gs = mutate ? mutate(structuredClone(gateStep)) : gateStep;
  const dir = tmp("gate-");
  const work = path.join(dir, "work");
  const temp = path.join(dir, "temp");
  mkdirSync(work); mkdirSync(temp); mkdirSync(path.join(temp, "trusted"));
  for (const d of ["scripts", "agents"]) cpSync(path.join(root, d), path.join(temp, "trusted", d), { recursive: true });
  if (stubPathguard) writeFileSync(path.join(temp, "trusted/scripts/agents/pathguard.mjs"), stubPathguard);
  const clean = { PATH: process.env.PATH, HOME: dir, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1" };
  const g = (...a) => spawnSync("git", a, { cwd: work, encoding: "utf8", env: clean });
  g("init", "-q", "-b", "develop");
  writeFileSync(path.join(work, "README.md"), "x\n");
  g("add", "-A"); g("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "base");
  const base = g("rev-parse", "HEAD").stdout.trim();
  if (branch) g("checkout", "-q", "-b", branch);
  const ctx = { dir, work, temp, base, g, clean };
  const sres = setup ? setup(ctx) : undefined;
  if (sres?.baseSha) baseSha = sres.baseSha;
  if (change) { mkdirSync(path.dirname(path.join(work, change)), { recursive: true }); writeFileSync(path.join(work, change), "y\n"); }
  const out = path.join(dir, "out");
  writeFileSync(out, "");
  const env = stepEnv(gs, { AGENT: agent, BASE_SHA: baseSha ?? base, AUTHOR: "agents[bot]", GIT_CONFIG_GLOBAL: path.join(temp, "gitconfig-trusted") },
    { GITHUB_OUTPUT: out, RUNNER_TEMP: temp, GITHUB_REPOSITORY: "o/r", GITHUB_RUN_ID: "42", HOOK_FLAG: path.join(dir, "hook-ran"), FSMON_FLAG: path.join(dir, "fsmon-ran"), PG_ARGV: path.join(dir, "pg-argv.json"), ...(typeof extraEnv === "function" ? extraEnv(ctx) : extraEnv) });
  Object.assign(env, { AGENT: agent, BASE_SHA: baseSha ?? base, AUTHOR: "agents[bot]", GIT_CONFIG_GLOBAL: path.join(temp, "gitconfig-trusted") });
  const r = bash(gs.run, env, work, gs.shell);
  const lines = readFileSync(out, "utf8").split("\n").filter(Boolean);
  const o = Object.fromEntries(lines.map((l) => l.split(/=(.*)/s).slice(0, 2)));
  return { r, o, lines, ...ctx, branchNow: g("symbolic-ref", "--short", "HEAD").stdout.trim() };
}

test("gate: a clean agent branch with an allowed change passes, with one ok= line", () => {
  const x = gate({ branch: "agent/product/t1-x", change: "docs/BACKLOG.md" });
  assert.equal(x.r.status, 0, x.r.stderr + x.r.stdout);
  assert.equal(x.o.ok, "true");
  assert.equal(x.o.branch, "agent/product/t1-x");
  assert.equal(x.lines.filter((l) => l.startsWith("ok=")).length, 1);
  assert.match(x.r.stdout, /crosscheck ok: 1 path\(s\) evaluated per commit, 1 in the net diff/);
});
test("gate: any other branch name is moved to agent/<handle>/wip-<run> before the push", () => {
  for (const b of ["feat/anything", "develop", "agent/other/x", "agent/product/../x", "agent/product/x.lock"]) {
    const x = gate({ branch: b === "develop" ? null : b, change: "docs/BACKLOG.md" });
    assert.equal(x.r.status, 0, b + x.r.stderr);
    assert.equal(x.o.branch, "agent/product/wip-42", b);
    assert.equal(x.branchNow, "agent/product/wip-42", b);
  }
});
test("gate: a change outside the lane is refused; one ok=false line", () => {
  const x = gate({ branch: "agent/product/t1-x", change: ".github/workflows/ci.yml" });
  assert.notEqual(x.r.status, 0);
  assert.deepEqual(x.lines, ["ok=false"]);
});
test("gate: nothing beyond the base commit is not an error and not ok", () => {
  const x = gate({ branch: "agent/product/t1-x" });
  assert.equal(x.r.status, 0);
  assert.deepEqual(x.lines, ["ok=false"]);
});
test("gate: a handle that is not plain fails closed", () => {
  const x = gate({ branch: "agent/product/x", change: "docs/BACKLOG.md", agent: "Product; id" });
  assert.notEqual(x.r.status, 0);
  assert.deepEqual(x.lines, ["ok=false"]);
});
test("gate: a base sha that is not 40 hex characters fails closed", () => {
  for (const bad of ["xyz", "", "A".repeat(40), "a".repeat(39), "main"]) {
    const x = gate({ branch: "agent/product/x", change: "docs/BACKLOG.md", baseSha: bad });
    assert.notEqual(x.r.status, 0, JSON.stringify(bad));
    assert.deepEqual(x.lines, ["ok=false"], JSON.stringify(bad));
  }
});

test("gate: planted hooks, hooksPath and fsmonitor in .git are not run", () => {
  const x = gate({
    branch: "agent/product/t1-x", change: "docs/BACKLOG.md",
    setup: ({ work, g, dir }) => {
      const hooks = path.join(work, ".git/hooks");
      mkdirSync(hooks, { recursive: true });
      for (const h of ["post-commit", "pre-commit", "commit-msg", "reference-transaction", "post-checkout"]) { writeFileSync(path.join(hooks, h), '#!/bin/sh\ntouch "$HOOK_FLAG"\n'); chmodSync(path.join(hooks, h), 0o755); }
      const other = path.join(dir, "otherhooks"); mkdirSync(other);
      writeFileSync(path.join(other, "post-commit"), '#!/bin/sh\ntouch "$HOOK_FLAG"\n'); chmodSync(path.join(other, "post-commit"), 0o755);
      g("config", "core.hooksPath", other);
      writeFileSync(path.join(dir, "fsm.sh"), '#!/bin/sh\ntouch "$FSMON_FLAG"\n'); chmodSync(path.join(dir, "fsm.sh"), 0o755);
      g("config", "core.fsmonitor", path.join(dir, "fsm.sh"));
    },
  });
  assert.equal(x.r.status, 0, x.r.stderr);
  assert.equal(x.o.ok, "true");
  assert.equal(existsSync(path.join(x.dir, "hook-ran")), false, "a planted hook ran");
  assert.equal(existsSync(path.join(x.dir, "fsmon-ran")), false, "the planted fsmonitor ran");
  assert.doesNotMatch(readFileSync(path.join(x.work, ".git/config"), "utf8"), /fsmonitor|hooksPath/);
});

// S1: the verified exploit. R touches .github/ (not allowed); Rb is a benign twin; refs/replace maps R to Rb,
// and .git/info/exclude hides .github/. Old gate: pathguard saw Rb and the push would deliver R.
function replaceExploit(extra = () => {}) {
  return ({ work, g, base, clean }) => {
    const cmd = (args, input) => spawnSync("git", args, { cwd: work, encoding: "utf8", env: { ...clean, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" }, input }).stdout.trim();
    const tree = (file, content) => {
      const idx = path.join(work, ".git/tmp-index");
      const e = { ...clean, GIT_INDEX_FILE: idx };
      spawnSync("git", ["read-tree", base], { cwd: work, env: e });
      const blob = cmd(["hash-object", "-w", "--stdin"], content);
      spawnSync("git", ["update-index", "--add", "--cacheinfo", `100644,${blob},${file}`], { cwd: work, env: e });
      return spawnSync("git", ["write-tree"], { cwd: work, env: e, encoding: "utf8" }).stdout.trim();
    };
    const R = cmd(["commit-tree", tree(".github/workflows/evil.yml", "run: curl evil\n"), "-p", base, "-m", "real"]);
    const Rb = cmd(["commit-tree", tree("docs/BACKLOG.md", "benign\n"), "-p", base, "-m", "twin"]);
    cmd(["update-ref", "refs/heads/agent/product/t1-x", R]);
    cmd(["reset", "-q", "--hard", R]);
    cmd(["replace", R, Rb]);
    cmd(["reset", "-q"]); // index := the (replaced) HEAD tree; the real files stay in the work tree, hidden by info/exclude
    mkdirSync(path.join(work, ".git/info"), { recursive: true });
    writeFileSync(path.join(work, ".git/info/exclude"), ".github/\n");
    extra({ work, cmd, R, Rb });
    return { R, Rb };
  };
}
test("gate (S1): git replace + info/exclude cannot show pathguard a benign twin of the pushed commit", () => {
  let ids;
  const x = gate({ branch: "agent/product/t1-x", setup: (c) => { ids = replaceExploit()(c); } });
  assert.notEqual(x.r.status, 0, "the gate passed an exploit\n" + x.r.stdout);
  assert.deepEqual(x.lines, ["ok=false"]);
  assert.equal(x.g("rev-parse", "HEAD").stdout.trim(), ids.R, "HEAD is the real commit");
  assert.match(x.r.stderr, /pathguard refused|workflows|\.github/);
});
test("gate (S1): the replace ref is also stripped from packed-refs", () => {
  let ids;
  const x = gate({ branch: "agent/product/t1-x", setup: (c) => { ids = replaceExploit(({ work, cmd }) => { cmd(["pack-refs", "--all"]); })(c); } });
  assert.notEqual(x.r.status, 0);
  assert.deepEqual(x.lines, ["ok=false"]);
  assert.ok(ids);
});
// The stubs export gitHistory, the function the cross-check imports from the trusted pathguard.
const histStub = (paths, extra = "") => `${extra}export function gitHistory() { return { commits: 1, files: ${JSON.stringify(paths.map((p) => ({ path: p })))}, merges: [], shas: [] }; }\nif (process.argv.length > 2) process.exit(0);\n`;
test("gate: the cross-check fails when the net diff has a path pathguard did not evaluate; extra evaluated paths are fine", () => {
  const no = gate({ branch: "agent/product/t1-x", change: "docs/BACKLOG.md", stubPathguard: histStub(["docs/OTHER.md"]) });
  assert.notEqual(no.r.status, 0);
  assert.deepEqual(no.lines, ["ok=false"]);
  assert.match(no.r.stderr, /did not evaluate/);
  const yes = gate({ branch: "agent/product/t1-x", change: "docs/BACKLOG.md", stubPathguard: histStub(["docs/BACKLOG.md", "docs/REVERTED.md"]) });
  assert.equal(yes.r.status, 0, yes.r.stderr);
  assert.equal(yes.o.ok, "true");
});
test("gate: a pathguard module that exits 0 when imported cannot skip the cross-check", () => {
  const x = gate({ branch: "agent/product/t1-x", change: "docs/BACKLOG.md", stubPathguard: `export function gitHistory() { return { files: [{ path: "docs/BACKLOG.md" }] }; }\nprocess.exit(0);\n` });
  assert.notEqual(x.r.status, 0);
  assert.deepEqual(x.lines, ["ok=false"]);
});
test("gate (S1, honest limit): with the replace defences AND the .git/info cleanup removed the real exploit passes and the cross-check does NOT catch it; those three do the work", () => {
  const dropBoth = (st) => {
    // Removing only the replace defences is not enough for the exploit: the removed .git/info/exclude
    // is what makes the hidden files show up as dirty, and the gate then commits them where pathguard
    // sees them. So the .git/info cleanup is a third layer.
    st.run = st.run.replace("/bin/rm -rf .git/hooks .git/info .git/refs/replace .git/shallow", "/bin/rm -rf .git/hooks .git/shallow").replace("/bin/mkdir .git/hooks .git/info", "/bin/mkdir -p .git/hooks .git/info");
    delete st.env.GIT_NO_REPLACE_OBJECTS;
    return st;
  };
  const x = gate({ branch: "agent/product/t1-x", setup: replaceExploit(), mutate: dropBoth });
  assert.equal(x.o.ok, "true", "if this starts failing, the cross-check got stronger: update the claim in the notes\n" + x.r.stderr);
  const withDefences = gate({ branch: "agent/product/t1-x", setup: replaceExploit() });
  assert.deepEqual(withDefences.lines, ["ok=false"]);
});
test("gate: a range that adds a file and then removes it again is decided by pathguard, not by the cross-check", () => {
  const x = gate({
    branch: "agent/product/t1-x",
    setup: ({ work, g }) => {
      const id = ["-c", "user.name=t", "-c", "user.email=t@t"];
      mkdirSync(path.join(work, "docs"), { recursive: true });
      writeFileSync(path.join(work, "docs/BACKLOG.md"), "x\n"); g("add", "-A"); g(...id, "commit", "-q", "-m", "add");
      g("rm", "-q", "docs/BACKLOG.md"); g(...id, "commit", "-q", "-m", "remove");
    },
  });
  const pg = spawnSync("node", [path.join(x.temp, "trusted/scripts/agents/pathguard.mjs"), "--labels", "agent:product", "--branch", "agent/product/t1-x", "--author", "agents[bot]", "--author-type", "Bot", "--base", x.base, "--head", "HEAD"], { cwd: x.work, encoding: "utf8", env: x.clean });
  assert.equal(x.o.ok === "true", pg.status === 0, `gate ok=${x.o.ok} but pathguard exit ${pg.status}: ${pg.stderr}${x.r.stderr}`);
  assert.doesNotMatch(x.r.stderr, /did not evaluate/);
  if (pg.status === 0) assert.match(x.r.stdout, /0 in the net diff/);
});

test("gate (F1): a maintain-mode branch that is behind the base still passes (same range as pathguard)", () => {
  const x = gate({
    branch: "agent/product/t1-x",
    setup: ({ work, g }) => {
      const id = ["-c", "user.name=t", "-c", "user.email=t@t"];
      mkdirSync(path.join(work, "docs"), { recursive: true });
      writeFileSync(path.join(work, "docs/BACKLOG.md"), "agent\n");
      g("add", "-A"); g(...id, "commit", "-q", "-m", "agent work");
      g("checkout", "-q", "develop");
      writeFileSync(path.join(work, "other.txt"), "develop moved\n");
      g("add", "-A"); g(...id, "commit", "-q", "-m", "develop moves on");
      const baseSha = g("rev-parse", "HEAD").stdout.trim();
      g("checkout", "-q", "agent/product/t1-x");
      return { baseSha };
    },
  });
  assert.equal(x.r.status, 0, x.r.stderr + x.r.stdout);
  assert.equal(x.o.ok, "true");
  assert.match(x.r.stdout, /crosscheck ok: 1 path\(s\) evaluated per commit, 1 in the net diff/);
});

// GIT_GRAFT_FILE lie: E adds a forbidden file, R removes it again. With a graft that gives R the parent
// BASE, pathguard sees one benign commit and the net diff is benign, while the push delivers E and R.
function graftExploit({ work, g, base, dir }) {
  const id = ["-c", "user.name=t", "-c", "user.email=t@t"];
  mkdirSync(path.join(work, ".github/workflows"), { recursive: true });
  writeFileSync(path.join(work, ".github/workflows/evil.yml"), "run: evil\n");
  g("add", "-A"); g(...id, "commit", "-q", "-m", "E");
  g("rm", "-q", "-r", ".github");
  mkdirSync(path.join(work, "docs"), { recursive: true });
  writeFileSync(path.join(work, "docs/BACKLOG.md"), "benign\n");
  g("add", "-A"); g(...id, "commit", "-q", "-m", "R");
  const R = g("rev-parse", "HEAD").stdout.trim();
  writeFileSync(path.join(dir, "grafts"), `${R} ${base}\n`);
}
test("gate (M3): a GIT_GRAFT_FILE injected through GITHUB_ENV cannot hide a forbidden commit from pathguard", () => {
  const x = gate({ branch: "agent/product/t1-x", setup: graftExploit, extraEnv: (c) => ({ GIT_GRAFT_FILE: path.join(c.dir, "grafts") }) });
  assert.notEqual(x.r.status, 0, "the gate passed with a graft file honoured\n" + x.r.stdout);
  assert.deepEqual(x.lines, ["ok=false"]);
  assert.match(x.r.stderr, /pathguard refused/);
});
test("gate (M3): commit-graph and multi-pack-index files are deleted", () => {
  const x = gate({
    branch: "agent/product/t1-x", change: "docs/BACKLOG.md",
    setup: ({ work, g }) => { g("commit-graph", "write", "--reachable"); g("repack", "-adq"); g("multi-pack-index", "write"); },
  });
  assert.equal(x.r.status, 0, x.r.stderr);
  assert.equal(existsSync(path.join(x.work, ".git/objects/info/commit-graph")), false);
  assert.equal(existsSync(path.join(x.work, ".git/objects/pack/multi-pack-index")), false);
});
test("gate (F3): a symlinked .git fails closed", () => {
  const x = gate({
    branch: "agent/product/t1-x", change: "docs/BACKLOG.md",
    setup: ({ work, dir }) => { const real = path.join(dir, "realgit"); renameSync(path.join(work, ".git"), real); symlinkSync(real, path.join(work, ".git")); },
  });
  assert.notEqual(x.r.status, 0);
  assert.deepEqual(x.lines, ["ok=false"]);
});
test("gate (F3): pathguard is called with the agent label, the branch, the bot author and --author-type Bot", () => {
  const stub = `import { writeFileSync } from "node:fs";\nexport function gitHistory() { return { files: [{ path: "docs/BACKLOG.md" }] }; }\nif (process.argv.length > 2) { writeFileSync(process.env.PG_ARGV, JSON.stringify(process.argv.slice(2))); process.exit(0); }\n`;
  const x = gate({ branch: "agent/product/t1-x", change: "docs/BACKLOG.md", stubPathguard: stub });
  assert.equal(x.r.status, 0, x.r.stderr);
  const argv = JSON.parse(readFileSync(path.join(x.dir, "pg-argv.json"), "utf8"));
  const flag = (n) => argv[argv.indexOf(`--${n}`) + 1];
  assert.deepEqual(["labels", "branch", "author", "author-type", "base"].map(flag), ["agent:product", "agent/product/t1-x", "agents[bot]", "Bot", x.base]);
});

// ---------------------------------------------------------------- M2: salvage only pushes the gated commit
const salvageStep = run("Save unfinished work");
function salvageAfterGate(mutate) {
  const x = gate({ branch: "agent/product/t1-x", change: "docs/BACKLOG.md" });
  assert.equal(x.o.ok, "true", "the gate must pass first: " + x.r.stderr);
  const marker = path.join(x.dir, "pushed");
  writeFileSync(path.join(x.temp, "trusted/scripts/agents/salvage.mjs"), `import { writeFileSync } from "node:fs"; writeFileSync(${JSON.stringify(marker)}, "pushed");\n`);
  mutate?.(x);
  const env = stepEnv(salvageStep, { GH_TOKEN: "t", AGENT: "product", JOURNAL: "1", REASON: "success", GATED_HEAD: x.o.head, GATED_BRANCH: x.o.branch, GIT_CONFIG_GLOBAL: path.join(x.temp, "gitconfig-trusted") },
    { RUNNER_TEMP: x.temp, GITHUB_RUN_ID: "42", GITHUB_REPOSITORY: "o/r" });
  Object.assign(env, { GATED_HEAD: x.o.head, GATED_BRANCH: x.o.branch, GIT_CONFIG_GLOBAL: path.join(x.temp, "gitconfig-trusted") });
  const r = bash(salvageStep.run, env, x.work, salvageStep.shell);
  return { r, pushed: existsSync(marker), x };
}
test("salvage step (M2): right after the gate it runs salvage", () => {
  const s = salvageAfterGate();
  assert.equal(s.r.status, 0, s.r.stderr);
  assert.equal(s.pushed, true);
});
test("salvage step (M2): a file created after the gate stops the push and fails the job", () => {
  const evil = (x) => { mkdirSync(path.join(x.work, ".github/workflows"), { recursive: true }); writeFileSync(path.join(x.work, ".github/workflows/evil.yml"), "run: evil\n"); };
  const s = salvageAfterGate(evil);
  assert.notEqual(s.r.status, 0);
  assert.equal(s.pushed, false);
});
test("salvage step (M2): a modified tracked file, a moved HEAD or a switched branch stops the push", () => {
  const id = ["-c", "user.name=t", "-c", "user.email=t@t"];
  const mods = {
    modified: (x) => writeFileSync(path.join(x.work, "docs/BACKLOG.md"), "changed after the gate\n"),
    moved: (x) => { writeFileSync(path.join(x.work, "docs/BACKLOG.md"), "moved\n"); x.g("add", "-A"); x.g(...id, "commit", "-q", "-m", "after"); },
    branch: (x) => { x.g("checkout", "-q", "-b", "agent/product/other"); },
  };
  for (const [k, m] of Object.entries(mods)) {
    const s = salvageAfterGate(m);
    assert.notEqual(s.r.status, 0, k);
    assert.equal(s.pushed, false, k);
  }
});

// ---------------------------------------------------------------- F2: a failing guard fails its step
test("guard (F2): a failing Path guard or cap step exits non-zero, with no continue-on-error and no `|| true`", () => {
  for (const [name, script] of [["Path guard", "scripts/agents/pathguard.mjs"], ["Open agent PR cap", "scripts/agents/guard-open-prs.mjs"]]) {
    const s = withJobEnv(step(guard, "guard", name));
    const cwd = stubDir({ [script]: "process.exit(1);\n" });
    const r = bash(s.run, stepEnv(s, { ...guardEnvExprs, GH_TOKEN: "t", AGENTS_BOT_LOGINS: "" }, { GITHUB_REPOSITORY: "o/r" }), cwd, s.shell);
    assert.equal(r.status, 1, name);
    assert.equal(s["continue-on-error"], undefined, name);
    assert.doesNotMatch(s.run, /\|\||;\s*true|\bexit 0\b/, name);
  }
  assert.doesNotMatch(stripComments(guardText), /continue-on-error/);
  assert.doesNotMatch(stripComments(agentsText), /continue-on-error/);
});

// ---------------------------------------------------------------- F3: the rest of the wiring
test("guard (F3): job id and name stay agent-pr-guard; the event fields come from the right payload keys", () => {
  assert.equal(Object.keys(guard.jobs).join(), "guard");
  assert.equal(guard.jobs.guard.name, "agent-pr-guard");
  const e = guard.jobs.guard.env;
  assert.equal(e.PR_NUMBER, "${{ github.event.pull_request.number }}");
  assert.equal(e.PR_BASE_SHA, "${{ github.event.pull_request.base.sha }}");
  assert.equal(e.PR_BASE_REF, "${{ github.event.pull_request.base.ref }}");
  assert.equal(e.PR_HEAD_SHA, "${{ github.event.pull_request.head.sha }}");
  assert.equal(e.PR_BRANCH, "${{ github.event.pull_request.head.ref }}");
  assert.equal(e.PR_AUTHOR, "${{ github.event.pull_request.user.login }}");
  assert.equal(e.PR_AUTHOR_TYPE, "${{ github.event.pull_request.user.type }}");
  assert.equal(e.PR_LABELS, "${{ join(github.event.pull_request.labels.*.name, ',') }}");
});
test("agents.yml (F3): gate and trusted-fetch steps run `if: always()`; env sources are the run context, not model output", () => {
  assert.equal(run("Gate the branch and the paths").if, "always()");
  assert.equal(run("Fetch trusted post-run scripts").if, "always()");
  assert.equal(run("Gate the branch and the paths").env.AGENT, "${{ matrix.agent }}");
  assert.equal(run("Gate the branch and the paths").env.AUTHOR, "${{ format('{0}[bot]', matrix.engine == 'opencode' && steps.app.outputs.app-slug || 'claude') }}");
  assert.equal(run("Save unfinished work").env.GATED_HEAD, "${{ steps.gate.outputs.head }}");
  assert.equal(run("Save unfinished work").env.GATED_BRANCH, "${{ steps.gate.outputs.branch }}");
  assert.equal(labelStep.env.HEAD_SHA, "${{ steps.gate.outputs.head }}");
  assert.equal(labelStep.env.BRANCH, "${{ steps.gate.outputs.branch }}");
});
test("trusted step (F3): extracts the base commit's scripts read-only; a bad sha or a missing script fails", () => {
  const t = run("Fetch trusted post-run scripts");
  const build = (files) => {
    const d = tmp("tarsrc-");
    for (const f of files) { mkdirSync(path.dirname(path.join(d, "repo-x", f)), { recursive: true }); writeFileSync(path.join(d, "repo-x", f), "//\n"); }
    const tgz = path.join(d, "t.tgz");
    spawnSync("tar", ["-czf", tgz, "-C", d, "repo-x"]);
    return tgz;
  };
  const go = (files, sha) => {
    const d = tmp("trusted-");
    const gh = path.join(d, "gh");
    writeFileSync(gh, `#!/bin/sh\ncat ${build(files)}\n`); chmodSync(gh, 0o755);
    const script = t.run.replace("/usr/bin/gh", gh);
    assert.notEqual(script, t.run);
    const r = bash(script, stepEnv(t, { GH_TOKEN: "t", BASE_SHA: sha }, { RUNNER_TEMP: d, GITHUB_REPOSITORY: "o/r", GH_TOKEN: "t", BASE_SHA: sha }), d, t.shell);
    return { r, d };
  };
  const all = ["scripts/agents/salvage.mjs", "scripts/agents/pathguard.mjs", "scripts/agents/receipt.mjs"];
  const ok = go(all, HEX);
  assert.equal(ok.r.status, 0, ok.r.stderr);
  assert.equal(statSync(path.join(ok.d, "trusted/scripts/agents/pathguard.mjs")).mode & 0o222, 0, "read-only");
  assert.notEqual(go(all, "develop").r.status, 0);
  assert.notEqual(go(all, "").r.status, 0);
  assert.notEqual(go(all.slice(0, 2), HEX).r.status, 0);
});

// ---------------------------------------------------------------- round 3: data-driven bindings
test("shell flags: every post-run step declares -eo pipefail (the guards rely on -e)", () => {
  for (const n of ["Fetch trusted post-run scripts", "Gate the branch and the paths", "Save unfinished work", "Open the PR and label it", "Run receipt"]) {
    assert.match(String(run(n).shell), /^\/usr\/bin\/bash --noprofile --norc -eo pipefail \{0\}$/, n);
  }
  assert.deepEqual(shellArgs(gateStep.shell), ["--noprofile", "--norc", "-eo", "pipefail"]);
  assert.deepEqual(shellArgs(undefined), ["-e"]);
});

const UNSET_REQUIRED = [
  "GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_OBJECT_DIRECTORY", "GIT_ALTERNATE_OBJECT_DIRECTORIES", "GIT_EXEC_PATH", "GIT_ASKPASS", "GIT_SSH", "GIT_SSH_COMMAND",
  "GIT_TEMPLATE_DIR", "GIT_NAMESPACE", "GIT_COMMON_DIR", "GIT_PREFIX", "GIT_REPLACE_REF_BASE", "GIT_CONFIG_PARAMETERS", "GIT_CEILING_DIRECTORIES", "LD_LIBRARY_PATH",
  "GIT_GRAFT_FILE", "GIT_SHALLOW_FILE", "GIT_LITERAL_PATHSPECS", "GIT_ICASE_PATHSPECS", "GIT_GLOB_PATHSPECS", "GIT_NOGLOB_PATHSPECS", "GIT_ATTR_SOURCE", "EMAIL",
  "HTTPS_PROXY", "HTTP_PROXY", "ALL_PROXY", "https_proxy", "http_proxy", "all_proxy", "NODE_EXTRA_CA_CERTS", "SSL_CERT_FILE", "SSL_CERT_DIR",
  "GIT_TRACE", "GIT_TRACE2", "GIT_TRACE_PACKET", "GIT_TRACE2_EVENT", "GIT_AUTHOR_NAME", "GIT_AUTHOR_EMAIL", "GIT_AUTHOR_DATE", "GIT_COMMITTER_NAME", "GIT_COMMITTER_EMAIL", "GIT_COMMITTER_DATE",
];
const PREBLANKED = ["BASH_ENV", "ENV", "LD_PRELOAD", "NODE_OPTIONS"];
for (const [label, st] of [["gate", gateStep], ["salvage", salvageStep]]) {
  test(`${label} step: every variable in the required unset list is gone before git or node run (probe, one table)`, () => {
    const lines = st.run.split("\n");
    const lastUnset = lines.map((l, i) => (l.trim().startsWith("unset ") ? i : -1)).filter((i) => i >= 0).pop();
    assert.ok(lastUnset >= 0, "no unset line");
    const dir = tmp("probe-");
    const probe = path.join(dir, "env.txt");
    const script = lines.slice(0, lastUnset + 1).join("\n") + `\n/usr/bin/env > ${JSON.stringify(probe)}\n`;
    const inject = Object.fromEntries(UNSET_REQUIRED.map((k) => [k, "/nonexistent-" + k]));
    const exprs = { AGENT: "product", BASE_SHA: HEX, AUTHOR: "a[bot]", GIT_CONFIG_GLOBAL: path.join(dir, "g"), GH_TOKEN: "t", JOURNAL: "1", REASON: "success", GATED_HEAD: HEX, GATED_BRANCH: "agent/product/x" };
    const env = { ...stepEnv(st, exprs, { GITHUB_OUTPUT: path.join(dir, "out"), GITHUB_RUN_ID: "1", GITHUB_REPOSITORY: "o/r", RUNNER_TEMP: dir }), ...inject };
    writeFileSync(path.join(dir, "out"), "");
    const r = bash(script, env, dir, st.shell);
    assert.equal(r.status, 0, r.stderr);
    const seen = new Set(readFileSync(probe, "utf8").split("\n").map((l) => l.split("=")[0]));
    for (const k of UNSET_REQUIRED) assert.equal(seen.has(k), false, `${k} survived the unset list in the ${label} step`);
    for (const k of PREBLANKED) assert.equal(st.env[k], "", `${label}: ${k} is not blanked by the step env`);
  });
}

// What the gate's clean-up removes: plant each target, run the gate, assert it is gone.
const PLANT = (work, dir) => ({
  ".git/shallow": () => writeFileSync(path.join(work, ".git/shallow"), HEX + "\n"),
  ".git/grafts": () => writeFileSync(path.join(work, ".git/grafts"), HEX + "\n"),
  ".git/config.worktree": () => writeFileSync(path.join(work, ".git/config.worktree"), "[core]\n\tfsmonitor = true\n"),
  ".git/commondir": () => writeFileSync(path.join(work, ".git/commondir"), "../elsewhere\n"),
  ".git/gitdir": () => writeFileSync(path.join(work, ".git/gitdir"), "/elsewhere\n"),
  ".git/objects/info/alternates": () => { mkdirSync(path.join(work, ".git/objects/info"), { recursive: true }); writeFileSync(path.join(work, ".git/objects/info/alternates"), "/elsewhere/objects\n"); },
  ".git/objects/info/http-alternates": () => { mkdirSync(path.join(work, ".git/objects/info"), { recursive: true }); writeFileSync(path.join(work, ".git/objects/info/http-alternates"), "http://x/\n"); },
  ".git/objects/info/commit-graph": () => { mkdirSync(path.join(work, ".git/objects/info"), { recursive: true }); writeFileSync(path.join(work, ".git/objects/info/commit-graph"), "junk"); },
  ".git/objects/info/commit-graphs": () => { mkdirSync(path.join(work, ".git/objects/info/commit-graphs"), { recursive: true }); writeFileSync(path.join(work, ".git/objects/info/commit-graphs/commit-graph-chain"), "junk"); },
  ".git/objects/pack/multi-pack-index": () => { mkdirSync(path.join(work, ".git/objects/pack"), { recursive: true }); writeFileSync(path.join(work, ".git/objects/pack/multi-pack-index"), "junk"); },
  ".git/objects/pack/pack-x.bitmap": () => { mkdirSync(path.join(work, ".git/objects/pack"), { recursive: true }); writeFileSync(path.join(work, ".git/objects/pack/pack-x.bitmap"), "junk"); },
  ".git/hooks/post-commit": () => { mkdirSync(path.join(work, ".git/hooks"), { recursive: true }); writeFileSync(path.join(work, ".git/hooks/post-commit"), "#!/bin/sh\n"); },
  ".git/info/exclude": () => { mkdirSync(path.join(work, ".git/info"), { recursive: true }); writeFileSync(path.join(work, ".git/info/exclude"), "docs/\n"); },
  ".git/info/grafts": () => { mkdirSync(path.join(work, ".git/info"), { recursive: true }); writeFileSync(path.join(work, ".git/info/grafts"), HEX + "\n"); },
  ".git/refs/replace/x": () => { mkdirSync(path.join(work, ".git/refs/replace"), { recursive: true }); writeFileSync(path.join(work, ".git/refs/replace", HEX), HEX + "\n"); },
});
const GATE_TARGETS = Object.keys(PLANT("", ""));
test("gate step: every .git clean-up target is gone after the gate, and the trusted global gitconfig is truncated", () => {
  let plantedAt;
  const x = gate({
    branch: "agent/product/t1-x", change: "docs/BACKLOG.md",
    setup: ({ work, dir, temp }) => {
      const plants = PLANT(work, dir);
      for (const f of Object.values(plants)) f();
      writeFileSync(path.join(work, ".git/packed-refs"), `# pack-refs with: peeled fully-peeled sorted \n${HEX} refs/replace/${HEX}\n`);
      mkdirSync(temp, { recursive: true });
      writeFileSync(path.join(temp, "gitconfig-trusted"), "[core]\n\tsshCommand = evil\n");
      plantedAt = work;
    },
  });
  assert.equal(x.r.status, 0, x.r.stderr);
  for (const t of GATE_TARGETS) {
    if (t === ".git/hooks/post-commit" || t === ".git/info/exclude" || t === ".git/info/grafts") assert.equal(existsSync(path.join(plantedAt, t)), false, t);
    else assert.equal(existsSync(path.join(plantedAt, t)), false, t);
  }
  assert.doesNotMatch(readFileSync(path.join(plantedAt, ".git/packed-refs"), "utf8") ?? "", /refs\/replace/);
  assert.equal(statSync(path.join(x.temp, "gitconfig-trusted")).size, 0, "the global gitconfig was not truncated");
});
const SALVAGE_TARGETS = [".git/refs/replace/x", ".git/info/grafts", ".git/shallow", ".git/grafts", ".git/objects/info/commit-graph", ".git/objects/info/commit-graphs", ".git/objects/pack/multi-pack-index", ".git/objects/pack/pack-x.bitmap"];
test("salvage step: its own re-clean removes the same kinds of targets, and still runs salvage", () => {
  const s = salvageAfterGate((x) => {
    const plants = PLANT(x.work, x.dir);
    for (const t of SALVAGE_TARGETS) plants[t]();
    writeFileSync(path.join(x.work, ".git/packed-refs"), `# pack-refs with: peeled fully-peeled sorted \n${HEX} refs/replace/${HEX}\n`);
    s_work = x.work;
  });
  assert.equal(s.r.status, 0, s.r.stderr);
  assert.equal(s.pushed, true);
  for (const t of SALVAGE_TARGETS) assert.equal(existsSync(path.join(s_work, t)), false, t);
  assert.doesNotMatch(readFileSync(path.join(s_work, ".git/packed-refs"), "utf8"), /refs\/replace/);
});
let s_work;
test("salvage step: REASON comes from the engine outcome and salvage.mjs gets --agent, --journal, --run-id and --reason", () => {
  assert.equal(salvageStep.env.REASON, "${{ matrix.engine == 'claude-code' && steps.claude.outcome || steps.opencode.outcome }}");
  assert.equal(salvageStep.env.AGENT, "${{ matrix.agent }}");
  const x = gate({ branch: "agent/product/t1-x", change: "docs/BACKLOG.md" });
  const argvFile = path.join(x.dir, "salvage-argv.json");
  writeFileSync(path.join(x.temp, "trusted/scripts/agents/salvage.mjs"), `import { writeFileSync } from "node:fs"; writeFileSync(${JSON.stringify(argvFile)}, JSON.stringify(process.argv.slice(2)));\n`);
  const vals = { GH_TOKEN: "t", AGENT: "product", JOURNAL: "17", REASON: "failure", GATED_HEAD: x.o.head, GATED_BRANCH: x.o.branch, GIT_CONFIG_GLOBAL: path.join(x.temp, "gitconfig-trusted") };
  const r = bash(salvageStep.run, stepEnv(salvageStep, vals, { ...vals, RUNNER_TEMP: x.temp, GITHUB_RUN_ID: "42", GITHUB_REPOSITORY: "o/r" }), x.work, salvageStep.shell);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(JSON.parse(readFileSync(argvFile, "utf8")), ["--agent", "product", "--journal", "17", "--run-id", "42", "--reason", "failure"]);
});

test("trusted step: each of salvage.mjs, pathguard.mjs and receipt.mjs missing from the tarball fails the step", () => {
  const t = run("Fetch trusted post-run scripts");
  const all = ["scripts/agents/salvage.mjs", "scripts/agents/pathguard.mjs", "scripts/agents/receipt.mjs"];
  for (const missing of all) {
    const d = tmp("trusted2-");
    mkdirSync(path.join(d, "repo-x/scripts/agents"), { recursive: true });
    for (const f of all.filter((f) => f !== missing)) writeFileSync(path.join(d, "repo-x", f), "//\n");
    const tgz = path.join(d, "t.tgz");
    spawnSync("tar", ["-czf", tgz, "-C", d, "repo-x"]);
    const gh = path.join(d, "gh");
    writeFileSync(gh, `#!/bin/sh\ncat ${tgz}\n`); chmodSync(gh, 0o755);
    const r = bash(t.run.replace("/usr/bin/gh", gh), stepEnv(t, { GH_TOKEN: "t", BASE_SHA: HEX }, { RUNNER_TEMP: d, GITHUB_REPOSITORY: "o/r", GH_TOKEN: "t", BASE_SHA: HEX }), d, t.shell);
    assert.notEqual(r.status, 0, missing);
  }
});

test("guard: the concurrency group is per PR, the checkout is a full clone, the cap step's token is the read-only github.token", () => {
  assert.match(guard.concurrency.group, /github\.event\.pull_request\.number/);
  assert.equal(guard.concurrency["cancel-in-progress"], true);
  const co = stepsOf(guard, "guard").find((x) => String(x.uses ?? "").startsWith("actions/checkout@"));
  assert.equal(co.with["fetch-depth"], 0);
  assert.equal(step(guard, "guard", "Open agent PR cap").env.GH_TOKEN, "${{ github.token }}");
});
test("scope: NON_AGENT_BOTS is folded to lower case on both sides", () => {
  assert.equal(scopeOf({ PR_AUTHOR: "dependabot[bot]", NON_AGENT_BOTS: "DependaBot[BOT], Renovate[Bot]".replace(", ", ",") }).scope, "no");
  assert.equal(scopeOf({ PR_AUTHOR: "RENOVATE[bot]", NON_AGENT_BOTS: "DependaBot[BOT],Renovate[Bot]" }).scope, "no");
  assert.equal(scopeOf({ PR_AUTHOR: "other[bot]", NON_AGENT_BOTS: "DependaBot[BOT],Renovate[Bot]" }).scope, "yes");
});
test("label step: its AUTHOR expression is the gate's, so the workflow identity matches", () => {
  assert.equal(labelStep.env.AUTHOR, gateStep.env.AUTHOR);
});

test("package.json: root npm test runs this suite, the agents suite and keeps develop's compliance suite", () => {
  const t = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).scripts.test;
  for (const p of ["scripts/trace.test.mjs", "scripts/workflows.test.mjs", "scripts/agents/*.test.mjs", "compliance/**/*.test.mjs", "scripts/trace.mjs --no-write"]) assert.ok(t.includes(p), p);
});
