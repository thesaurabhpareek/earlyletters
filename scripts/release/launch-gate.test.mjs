// BL-1480: the release-candidate tag precondition (docs/ops/proposed/release-ios-launch-gate.md).
import test from "node:test";
import assert from "node:assert/strict";
import { decideLaunchGate, gate } from "./launch-gate.mjs";

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
