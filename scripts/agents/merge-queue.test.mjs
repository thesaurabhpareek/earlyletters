// Tests for merge-queue.mjs. A fake API is injected: no network, no gh, no real repo state.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildQueue, parseReview, parseClaims, parseArgs, formatTable } from "./merge-queue.mjs";

const OLD = "c5cfa0cfaa96a0ba97ca5f34629747ab0badf438";
const HEAD = "a83634ced2a5ecf32717bf833f941b892fc660b9";
const NOW = new Date("2026-11-09T12:00:00Z");
const ago = (min) => new Date(NOW - min * 60000).toISOString();
const review = (lens, sha, extra = "", author_association = "MEMBER") => ({ body: `## Review ${lens} at ${sha}: PASS\n${extra}`, author_association });
const run = (id, name, conclusion, status = "completed") => ({ id, name, status, conclusion });
const good = [run(1, "required", "success"), run(2, "compliance-fence", "success"), run(3, "applied migrations unchanged", "success")];
const PROT = { required_status_checks: { contexts: ["applied migrations unchanged", "required", "compliance-fence"] } };

function fake({ comments = [], runs = good, pushedMin = 60, state = "clean", extraPrs = [], calls = [], files = ["docs/x.md"], protection = PROT } = {}) {
  return async (path, opts = {}) => {
    calls.push({ path, method: opts.method });
    const p = path.split("?")[0];
    if (p.endsWith("/pulls")) return [{ number: 7, draft: false, head: { sha: HEAD }, base: { ref: "develop" } }, { number: 8, draft: true, head: { sha: OLD }, base: { ref: "develop" } }, ...extraPrs];
    if (p.includes("/branches/") && p.endsWith("/protection")) { if (!protection) throw new Error("403"); return protection; }
    if (p.endsWith("/pulls/7/files")) return files.map((filename) => ({ filename }));
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
  const r = await verdict({ comments, runs: [run(1, "required", "success"), run(3, "applied migrations unchanged", "success")] });
  assert.equal(r.verdict, "WAIT-CI");
  assert.equal(r.checks["compliance-fence"], "missing");
});

test("queued and in_progress are counted separately; unfinished required is WAIT-CI", async () => {
  const comments = [review("A", HEAD), review("B", HEAD)];
  const runs = [run(1, "required", null, "in_progress"), run(2, "compliance-fence", "success"), run(3, "applied migrations unchanged", "success"), run(4, "lint", null, "queued")];
  const r = await verdict({ comments, runs });
  assert.deepEqual([r.verdict, r.checks.queued, r.checks.inProgress], ["WAIT-CI", 1, 1]);
});

test("a failed required check is CI-FAIL; a newer rerun wins over an older failure", async () => {
  const comments = [review("A", HEAD), review("B", HEAD)];
  assert.equal((await verdict({ comments, runs: [run(1, "required", "failure"), run(2, "compliance-fence", "success"), run(3, "applied migrations unchanged", "success")] })).verdict, "CI-FAIL");
  const rerun = [run(1, "required", "failure"), run(5, "required", "success"), run(2, "compliance-fence", "success"), run(3, "applied migrations unchanged", "success")];
  assert.equal((await verdict({ comments, runs: rerun })).verdict, "READY");
});

test("dirty is DIRTY; unstable is allowed; blocked is WAIT-CI", async () => {
  const comments = [review("A", HEAD), review("B", HEAD)];
  assert.equal((await verdict({ comments, state: "dirty" })).verdict, "DIRTY");
  assert.equal((await verdict({ comments, state: "unstable" })).verdict, "READY");
  assert.equal((await verdict({ comments, state: "blocked" })).verdict, "WAIT-CI");
});

test("every request is a GET on a repo path; output never contains Authorization", async () => {
  const calls = [];
  const rows = await buildQueue({ api: fake({ comments: [review("A", HEAD), review("B", HEAD)], calls }), now: NOW });
  assert.ok(calls.length > 0 && calls.every((c) => c.method === "GET" && c.path.startsWith("repos/")));
  const out = formatTable(rows) + JSON.stringify(rows);
  assert.doesNotMatch(out, /authorization|bearer|token/i);
});

test("required contexts come from branch protection; an extra context must be green", async () => {
  const comments = [review("A", HEAD), review("B", HEAD)];
  const protection = { required_status_checks: { contexts: ["required", "extra gate"] } };
  const r = await verdict({ comments, protection });
  assert.equal(r.verdict, "WAIT-CI");
  assert.deepEqual(r.required, ["required", "extra gate"]);
});

test("unreadable protection falls back to the three contexts and prints a notice", async () => {
  const notices = [];
  const rows = await buildQueue({ api: fake({ comments: [review("A", HEAD), review("B", HEAD)], protection: null }), now: NOW, notices });
  assert.deepEqual(rows[0].required, ["applied migrations unchanged", "required", "compliance-fence"]);
  assert.equal(rows[0].verdict, "READY");
  assert.match(notices[0], /^notice: branch protection/);
});

const MAC = [run(10, "iOS simulator build (no signing)", "success"), run(11, "store-profile Release launch (testflight env, no seam, 20 s)", "success")];

test("lockfile change with a red iOS build is WATCH-RED naming the check", async () => {
  const comments = [review("A", HEAD), review("B", HEAD)];
  const runs = [...good, run(10, "iOS simulator build (no signing)", "failure"), MAC[1]];
  const r = await verdict({ comments, runs, files: ["package-lock.json"] });
  assert.equal(r.verdict, "WATCH-RED iOS simulator build (no signing)");
});

test("native path with macOS checks missing or running is WAIT-CI; green is READY", async () => {
  const comments = [review("A", HEAD), review("B", HEAD)];
  assert.equal((await verdict({ comments, files: ["apps/mobile/app.config.ts"] })).verdict, "WAIT-CI");
  const running = [...good, run(10, "iOS simulator build (no signing)", null, "in_progress"), MAC[1]];
  assert.equal((await verdict({ comments, runs: running, files: ["apps/mobile/ios/Podfile"] })).verdict, "WAIT-CI");
  assert.equal((await verdict({ comments, runs: [...good, ...MAC], files: ["apps/mobile/eas.json"] })).verdict, "READY");
});

test("a PR touching no native path: macOS red or running shows as watch, does not block", async () => {
  const comments = [review("A", HEAD), review("B", HEAD)];
  const runs = [...good, run(10, "iOS simulator build (no signing)", null, "queued"), run(11, "store-profile Release launch (testflight env, no seam, 20 s)", "failure")];
  const r = await verdict({ comments, runs, files: ["docs/a.md", "apps/mobile/src/a.ts"] });
  assert.equal(r.verdict, "READY");
  assert.equal(r.watch.length, 2);
  assert.match(formatTable([r]), /WATCH iOS:pending|WATCH iOS:/);
});

test("READY row ends with the exact founder ask at the full head sha", async () => {
  const rows = await buildQueue({ api: fake({ comments: [review("A", HEAD), review("B", HEAD)] }), now: NOW });
  assert.equal(rows[0].founderAsk, `Merge #7 at ${HEAD}`);
  assert.equal(formatTable(rows).split("\n").at(-1), `Merge #7 at ${HEAD}`);
});

test("claims are read from table rows and by-lines; flags parse", async () => {
  const claims = parseClaims("| #7 | ops | 2026-11-09 |\nclaimed #9 by @mobile\nno number here @x\n");
  assert.deepEqual(claims, { 7: "ops", 9: "mobile" });
  const rows = await buildQueue({ api: fake({ comments: [] }), now: NOW, claims });
  assert.equal(rows[0].claim, "ops");
  assert.deepEqual(parseArgs(["--json", "--quiet-minutes", "3", "--only", "ready"]), { json: true, quietMinutes: 3, only: "READY", repo: "thesaurabhpareek/earlyletters" });
  assert.throws(() => parseArgs(["--merge"]));
});

test("a PASS from NONE, CONTRIBUTOR or FIRST_TIME_CONTRIBUTOR is ignored; trusted ones count", async () => {
  for (const who of ["NONE", "CONTRIBUTOR", "FIRST_TIME_CONTRIBUTOR", null]) {
    const r = await verdict({ comments: [review("A", HEAD, "", who), review("B", HEAD, "", who)] });
    assert.equal(r.verdict, "NEEDS-REVIEW", String(who));
    assert.deepEqual(r.reviews.untrusted, ["A", "B"]);
    assert.match(formatTable([r]), /note: #7 held back/);
  }
  for (const who of ["OWNER", "MEMBER", "COLLABORATOR"]) {
    assert.equal((await verdict({ comments: [review("A", HEAD, "", who), review("B", HEAD, "", who)] })).verdict, "READY", who);
  }
  const mixed = await verdict({ comments: [review("A", HEAD), review("B", HEAD, "", "NONE")] });
  assert.equal(mixed.verdict, "NEEDS-REVIEW");
  const out = formatTable((await buildQueue({ api: fake({ comments: [review("A", HEAD), review("B", HEAD)] }), now: NOW })));
  assert.doesNotMatch(out, /held back/);
});
