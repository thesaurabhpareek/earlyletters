// Tests for merge-queue.mjs. A fake API is injected: no network, no gh, no real repo state.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildQueue, parseReview, parseClaims, parseArgs } from "./merge-queue.mjs";

const OLD = "c5cfa0cfaa96a0ba97ca5f34629747ab0badf438";
const HEAD = "a83634ced2a5ecf32717bf833f941b892fc660b9";
const NOW = new Date("2026-11-09T12:00:00Z");
const ago = (min) => new Date(NOW - min * 60000).toISOString();
const review = (lens, sha, extra = "") => ({ body: `## Review ${lens} at ${sha}: PASS\n${extra}` });
const run = (id, name, conclusion, status = "completed") => ({ id, name, status, conclusion });
const good = [run(1, "required", "success"), run(2, "compliance-fence", "success")];

function fake({ comments = [], runs = good, pushedMin = 60, state = "clean", extraPrs = [], calls = [] } = {}) {
  return async (path) => {
    calls.push(path);
    const p = path.split("?")[0];
    if (p.endsWith("/pulls")) return [{ number: 7, draft: false, head: { sha: HEAD }, base: { ref: "develop" } }, { number: 8, draft: true, head: { sha: OLD }, base: { ref: "develop" } }, ...extraPrs];
    if (p.endsWith("/pulls/7")) return { mergeable_state: state };
    if (p.endsWith("/issues/7/comments")) return comments;
    if (p.endsWith(`/commits/${HEAD}/check-runs`)) return { check_runs: runs };
    if (p.endsWith(`/commits/${HEAD}`)) return { commit: { committer: { date: ago(pushedMin) } } };
    throw new Error(`unexpected ${path}`);
  };
}
const verdict = async (opts, quietMinutes = 10) => {
  const rows = await buildQueue({ api: fake(opts), now: NOW, quietMinutes });
  assert.equal(rows.length, 1, "draft PR is skipped");
  return rows[0];
};

test("both reviews at head, checks green, quiet: READY", async () => {
  const r = await verdict({ comments: [review("A", HEAD), review("B", HEAD)] });
  assert.equal(r.verdict, "READY");
  assert.equal(r.head, HEAD);
  assert.equal(r.pushAgeMinutes, 60);
});

test("review at an old sha is STALE-REVIEW", async () => {
  const r = await verdict({ comments: [review("A", OLD), review("B", OLD)] });
  assert.equal(r.verdict, "STALE-REVIEW");
  const half = await verdict({ comments: [review("A", HEAD), review("B", OLD)] });
  assert.equal(half.verdict, "STALE-REVIEW");
});

test("no review at all is NEEDS-REVIEW; a short sha does not count", async () => {
  assert.equal((await verdict({ comments: [] })).verdict, "NEEDS-REVIEW");
  const short = { body: `## Review A at ${HEAD.slice(0, 12)}: PASS` };
  assert.equal((await verdict({ comments: [short, review("B", HEAD)] })).verdict, "NEEDS-REVIEW");
});

test("words like failure, unless, until in the first 15 lines do not change the reading", async () => {
  const noise = Array.from({ length: 15 }, (_, i) => `line ${i}: no failure unless fixed until later`).join("\n");
  const r = await verdict({ comments: [review("A", HEAD, noise), review("B", HEAD, noise)] });
  assert.equal(r.verdict, "READY");
  assert.deepEqual(parseReview(`## Review A at ${HEAD}: PASS\r\nfailure`), { lens: "A", sha: HEAD });
  assert.equal(parseReview(`intro\n## Review A at ${HEAD}: PASS`), null, "must be the first line");
  assert.equal(parseReview(`## Review A at ${HEAD}: FAIL`), null);
});

test("head pushed 2 minutes ago is WAIT-QUIET; passes with --quiet-minutes 1", async () => {
  const comments = [review("A", HEAD), review("B", HEAD)];
  assert.equal((await verdict({ comments, pushedMin: 2 })).verdict, "WAIT-QUIET");
  assert.equal((await verdict({ comments, pushedMin: 2 }, 1)).verdict, "READY");
});

test("missing compliance-fence is WAIT-CI", async () => {
  const comments = [review("A", HEAD), review("B", HEAD)];
  const r = await verdict({ comments, runs: [run(1, "required", "success")] });
  assert.equal(r.verdict, "WAIT-CI");
  assert.equal(r.checks["compliance-fence"], "missing");
});

test("queued and in_progress are counted separately; unfinished required is WAIT-CI", async () => {
  const comments = [review("A", HEAD), review("B", HEAD)];
  const runs = [run(1, "required", null, "in_progress"), run(2, "compliance-fence", "success"), run(3, "lint", null, "queued")];
  const r = await verdict({ comments, runs });
  assert.deepEqual([r.verdict, r.checks.queued, r.checks.inProgress], ["WAIT-CI", 1, 1]);
});

test("a failed required check is CI-FAIL; a newer rerun wins over an older failure", async () => {
  const comments = [review("A", HEAD), review("B", HEAD)];
  assert.equal((await verdict({ comments, runs: [run(1, "required", "failure"), run(2, "compliance-fence", "success")] })).verdict, "CI-FAIL");
  const rerun = [run(1, "required", "failure"), run(5, "required", "success"), run(2, "compliance-fence", "success")];
  assert.equal((await verdict({ comments, runs: rerun })).verdict, "READY");
});

test("dirty is DIRTY; unstable is allowed; blocked is WAIT-CI", async () => {
  const comments = [review("A", HEAD), review("B", HEAD)];
  assert.equal((await verdict({ comments, state: "dirty" })).verdict, "DIRTY");
  assert.equal((await verdict({ comments, state: "unstable" })).verdict, "READY");
  assert.equal((await verdict({ comments, state: "blocked" })).verdict, "WAIT-CI");
});

test("only GET-style reads: every path is a repo read, nothing else is called", async () => {
  const calls = [];
  await buildQueue({ api: fake({ comments: [], calls }), now: NOW });
  assert.ok(calls.length > 0 && calls.every((c) => c.startsWith("repos/")));
});

test("claims are read from table rows and by-lines; flags parse", async () => {
  const claims = parseClaims("| #7 | ops | 2026-11-09 |\nclaimed #9 by @mobile\nno number here @x\n");
  assert.deepEqual(claims, { 7: "ops", 9: "mobile" });
  const rows = await buildQueue({ api: fake({ comments: [] }), now: NOW, claims });
  assert.equal(rows[0].claim, "ops");
  assert.deepEqual(parseArgs(["--json", "--quiet-minutes", "3", "--only", "ready"]), { json: true, quietMinutes: 3, only: "READY", repo: "thesaurabhpareek/earlyletters" });
  assert.throws(() => parseArgs(["--merge"]));
});
