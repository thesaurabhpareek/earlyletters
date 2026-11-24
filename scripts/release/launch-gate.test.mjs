// BL-1480: the release-candidate tag precondition (docs/ops/proposed/release-ios-launch-gate.md).
import test from "node:test";
import assert from "node:assert/strict";
import { decideLaunchGate, decideTagCheckedRun, gate } from "./launch-gate.mjs";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, chmodSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const MB = "a".repeat(40);
const AFTER = "b".repeat(40);
const BEFORE = "c".repeat(40);
// isAncestor(mergeBase, sha): true when sha is the merge base or comes after it.
const isAncestor = (mb, sha) => sha === mb || sha === AFTER;
const run = (o) => ({ id: 1, event: "workflow_dispatch", status: "completed", conclusion: "success", head_sha: AFTER, head_branch: "develop", created_at: "2026-11-22T03:00:00Z", ...o });
const decide = (runs, extra = {}) => decideLaunchGate({ runs, mergeBase: MB, isAncestor, ...extra });

test("[BL-1480] the newest develop run at or after the merge base is green: the tag may build", () => {
  assert.equal(decide([run({})]).ok, true);
  assert.equal(decide([run({ head_sha: MB })]).ok, true, "a run on the merge base itself counts");
});

test("[BL-1480] no run at all fails with the named message", () => {
  const r = decide([]);
  assert.equal(r.ok, false);
  assert.match(r.message, /^Release candidate tag refused: no iOS compile run on develop at or after the merge base /);
});

test("[BL-1480] a red, cancelled or timed-out newest run fails", () => {
  for (const conclusion of ["failure", "cancelled", "timed_out", "skipped", "neutral", null]) assert.equal(decide([run({ conclusion })]).ok, false, String(conclusion));
  assert.match(decide([run({ conclusion: "failure" })]).message, /concluded failure/);
});

test("[BL-1480] a run still queued or running fails (not green yet)", () => {
  for (const status of ["queued", "in_progress", "waiting"]) assert.equal(decide([run({ status, conclusion: null })]).ok, false, status);
  assert.equal(decide([run({ status: "in_progress", conclusion: "success" })]).ok, false, "a stale conclusion on an unfinished run");
});

test("[BL-1480] only the newest run counts: an older green does not cover a newer red, and an older red does not block a newer green", () => {
  const green = run({ id: 1, created_at: "2026-11-22T03:00:00Z" });
  const red = run({ id: 2, created_at: "2026-11-22T04:00:00Z", conclusion: "failure" });
  assert.equal(decide([green, red]).ok, false);
  assert.equal(decide([red, green]).ok, false, "order of the list does not matter");
  const redOld = run({ id: 3, created_at: "2026-11-21T04:00:00Z", conclusion: "failure" });
  assert.equal(decide([redOld, green]).ok, true);
});

test("[BL-1480] a green run on a commit before the merge base does not count", () => {
  const r = decide([run({ head_sha: BEFORE })]);
  assert.equal(r.ok, false);
  assert.match(r.message, /no iOS compile run on develop at or after the merge base/);
});

test("[BL-1480] pull_request runs are not develop runs", () => {
  assert.equal(decide([run({ event: "pull_request" })]).ok, false);
});

test("[BL-1480] a missing merge base fails closed", () => {
  assert.equal(decide([run({})], { mergeBase: "" }).ok, false);
  assert.equal(decide([run({})], { mergeBase: undefined }).ok, false);
});

test("[BL-1480] an ancestry check that throws fails closed", () => {
  const r = decide([run({})], { isAncestor: () => { throw new Error("bad object"); } });
  assert.equal(r.ok, false);
});

test("[BL-1480] gate(): API error fails closed, never reads a token or logs more than the run id and conclusion", async () => {
  const bad = await gate({ listRuns: async () => { throw new Error("HTTP 403"); }, mergeBase: async () => MB, isAncestor: async () => true });
  assert.equal(bad.ok, false);
  const good = await gate({ listRuns: async () => [run({})], mergeBase: async () => MB, isAncestor: async (a, b) => isAncestor(a, b) });
  assert.equal(good.ok, true);
  assert.match(good.message, /run 1 .* success/);
});

// BL-1574: main(), the part the workflow runs. Stub `gh` and `git` on PATH so no network or real repo is read.
const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "launch-gate.mjs");
function runMain(args, { runs = [], mergeBase = MB, ancestor = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "launch-gate-"));
  try {
    writeFileSync(join(dir, "runs.json"), JSON.stringify({ workflow_runs: runs }));
    // The stubs check their arguments, so main() must ask for develop's runs of ios-compile.yml and the merge base of
    // the --sha commit with origin/develop; any other call exits 3 and the gate fails closed.
    const sha = args[args.indexOf("--sha") + 1];
    writeFileSync(join(dir, "gh"), `#!/bin/sh\n[ "$1" = "api" ] && [ "$2" = "repos/o/r/actions/workflows/ios-compile.yml/runs?branch=develop&per_page=30" ] || exit 3\ncat "${join(dir, "runs.json")}"\n`);
    writeFileSync(join(dir, "git"), `#!/bin/sh\nif [ "$1" = "merge-base" ] && [ "$2" = "--is-ancestor" ]; then exit ${ancestor ? 0 : 1}; fi\n[ "$1" = "merge-base" ] && [ "$2" = "${sha}" ] && [ "$3" = "origin/develop" ] || exit 3\necho ${mergeBase}\n`);
    chmodSync(join(dir, "gh"), 0o755);
    chmodSync(join(dir, "git"), 0o755);
    const r = spawnSync(process.execPath, [SCRIPT, ...args], { env: { ...process.env, PATH: `${dir}:${process.env.PATH}` }, encoding: "utf8", timeout: 20000 });
    return { code: r.status, out: r.stdout, err: r.stderr };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
const USAGE = /usage: launch-gate\.mjs --repo <owner\/name> --sha <40 hex>/;

test("[BL-1574] main(): a missing or bad --repo or --sha exits 2 with the usage line", () => {
  for (const args of [[], ["--sha", AFTER], ["--repo", "o/r"], ["--repo", "o/r", "--sha", "abc"], ["--repo", "not a repo", "--sha", AFTER]]) {
    const r = runMain(args);
    assert.equal(r.code, 2, args.join(" "));
    assert.match(r.err, USAGE);
  }
});

test("[BL-1574] main(): a refused gate exits 1 and prints the ::error:: line", () => {
  const r = runMain(["--repo", "o/r", "--sha", AFTER], { runs: [run({ conclusion: "failure" })] });
  assert.equal(r.code, 1);
  assert.match(r.out, /^::error::Release candidate tag refused: run 1 on b{9} concluded failure/m);
});

test("[BL-1574] main(): no run on or after the merge base exits 1", () => {
  const r = runMain(["--repo", "o/r", "--sha", AFTER], { runs: [run({})], ancestor: false });
  assert.equal(r.code, 1);
  assert.match(r.out, /::error::Release candidate tag refused: no iOS compile run on develop/);
});

test("[BL-1574] main(): an open gate exits 0 with no ::error:: line", () => {
  const r = runMain(["--repo", "o/r", "--sha", AFTER], { runs: [run({})] });
  assert.equal(r.code, 0, r.out + r.err);
  assert.match(r.out, /launch gate open: run 1 on b{9} concluded success/);
  assert.doesNotMatch(r.out, /::error::/);
});

// BL-1594: the tagged commit itself must be the commit a green iOS compile run checked.
const TAG = "d".repeat(40);
const PARENT = "e".repeat(40);
const tagRun = (o) => run({ head_sha: TAG, head_branch: "release/1.0", path: ".github/workflows/ios-compile.yml", ...o });
const tag = (runs) => decideTagCheckedRun({ tagSha: TAG, runs });

test("[BL-1594] a green run on exactly the tagged sha opens", () => {
  const r = tag([tagRun({})]);
  assert.equal(r.ok, true);
  assert.match(r.message, /tagged commit checked: run 1 on d{9} concluded success/);
});

test("[BL-1594] a cherry-pick onto the release branch: only the parent was checked, so it fails", () => {
  const r = tag([tagRun({ head_sha: PARENT })]);
  assert.equal(r.ok, false);
  assert.match(r.message, /no iOS compile run checked the tagged commit d{9}/);
  assert.match(r.message, /on the release branch at the commit to be tagged/);
  assert.doesNotMatch(r.message, /on develop/);
});

test("[BL-1594] a moved or re-made tag: runs on the old sha do not count for the new one", () => {
  assert.equal(decideTagCheckedRun({ tagSha: PARENT, runs: [tagRun({})] }).ok, false);
});

test("[BL-1594] a run of another workflow on the tagged sha does not count", () => {
  assert.equal(tag([tagRun({ path: ".github/workflows/ci.yml" })]).ok, false);
  assert.equal(tag([tagRun({ path: ".github/workflows/not-ios-compile.yml.bak" })]).ok, false);
  assert.equal(tag([tagRun({ path: undefined })]).ok, false, "a run with no path does not count");
  assert.equal(tag([tagRun({ path: null })]).ok, false);
});

test("[BL-1594] only a workflow_dispatch run counts: a pull_request run builds the merge ref, and a skipped job can be green", () => {
  for (const event of ["pull_request", "push", "schedule", undefined]) assert.equal(tag([tagRun({ event })]).ok, false, String(event));
  assert.equal(tag([tagRun({ event: "pull_request", id: 2, created_at: "2026-11-24T05:00:00Z" }), tagRun({ conclusion: "failure" })]).ok, false, "a newer green PR run does not hide a red dispatch");
});

test("[BL-1594] a run on the tagged sha with no start time fails closed, in either list order", () => {
  const green = tagRun({ id: 1 });
  const timeless = tagRun({ id: 2, created_at: undefined, conclusion: "failure" });
  assert.equal(tag([green, timeless]).ok, false);
  assert.equal(tag([timeless, green]).ok, false);
});

test("[BL-1594] a run still queued or in progress fails", () => {
  for (const status of ["queued", "in_progress", "waiting"]) assert.equal(tag([tagRun({ status, conclusion: null })]).ok, false, status);
  assert.match(tag([tagRun({ status: "in_progress", conclusion: null })]).message, /is in_progress, not finished/);
});

test("[BL-1594] two runs on one sha: the newest decides, in either list order", () => {
  const green = tagRun({ id: 1, created_at: "2026-11-24T01:00:00Z" });
  const red = tagRun({ id: 2, created_at: "2026-11-24T02:00:00Z", conclusion: "failure" });
  assert.equal(tag([green, red]).ok, false);
  assert.equal(tag([red, green]).ok, false);
  const redOld = tagRun({ id: 3, created_at: "2026-11-23T01:00:00Z", conclusion: "failure" });
  assert.equal(tag([redOld, green]).ok, true);
});

test("[BL-1594] a red, cancelled, skipped or empty conclusion fails; a missing or malformed tag sha fails closed", () => {
  for (const conclusion of ["failure", "cancelled", "timed_out", "skipped", null]) assert.equal(tag([tagRun({ conclusion })]).ok, false, String(conclusion));
  assert.equal(decideTagCheckedRun({ tagSha: undefined, runs: [tagRun({})] }).ok, false);
  // Each bad sha below is also the head_sha of a green run, so only the sha format check can refuse it.
  for (const bad of ["d".repeat(39), "D".repeat(40), "d".repeat(41), `${"d".repeat(39)}g`, ` ${"d".repeat(39)}`])
    assert.equal(decideTagCheckedRun({ tagSha: bad, runs: [tagRun({ head_sha: bad })] }).ok, false, JSON.stringify(bad));
  assert.equal(tag(undefined).ok, false);
});
