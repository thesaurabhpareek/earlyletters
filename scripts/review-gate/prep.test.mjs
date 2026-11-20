// Tests for prep.mjs (HV2-B36). A fake API is injected: no network, no gh, no real repo state.
// The fictional family is Asha; no real family data appears here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { prep, parseReview, reviewState, ciState, parseArgs, FULL_SHA } from "./prep.mjs";

const OLD = "c5cfa0cfaa96a0ba97ca5f34629747ab0badf438";
const HEAD = "a83634ced2a5ecf32717bf833f941b892fc660b9";
const rev = (lens, sha, verdict = "PASS", extra = "", assoc = "MEMBER", id = 1) => ({ id, body: `## Review ${lens} at ${sha}: ${verdict}\n${extra}`, author_association: assoc, created_at: `2026-11-20T10:00:${String(id).padStart(2, "0")}Z` });
const run = (id, name, conclusion, status = "completed") => ({ id, name, status, conclusion });
const green = [run(1, "required", "success"), run(2, "compliance-fence", "success"), run(3, "applied migrations unchanged", "success")];
const PROT = { required_status_checks: { contexts: ["applied migrations unchanged", "required", "compliance-fence"] } };
const FILES = [
  { filename: "scripts/review-gate/prep.mjs", additions: 120, deletions: 0 },
  { filename: "package-lock.json", additions: 500, deletions: 3 },
  { filename: "docs/asha-notes.md", additions: 4, deletions: 1 },
];

function fake({ sha = HEAD, movedTo = null, comments = [], runs = green, protection = PROT, calls = [] } = {}) {
  let pullReads = 0;
  return async (path) => {
    calls.push(path);
    const p = path.split("?")[0];
    if (p.endsWith("/pulls/9")) return { title: "feat: Asha fixture", draft: true, mergeable_state: "clean", base: { ref: "develop" }, changed_files: 3, head: { sha: ++pullReads > 1 && movedTo ? movedTo : sha } };
    if (p.endsWith("/branches/develop/protection")) { if (!protection) throw new Error("403"); return protection; }
    if (p.endsWith(`/commits/${sha}/check-runs`)) return { check_runs: runs };
    if (p.endsWith("/pulls/9/files")) return FILES;
    if (p.endsWith("/issues/9/comments")) return comments;
    throw new Error(`unexpected ${path}`);
  };
}
const go = (o) => prep({ api: fake(o), pr: 9 });

test("both reviews at head and CI green: prints the full sha and the paste-ready ask, exit 0", async () => {
  const { lines, exitCode } = await go({ comments: [rev("A", HEAD), rev("B", HEAD, "PASS", "", "OWNER", 2)] });
  const out = lines.join("\n");
  assert.equal(exitCode, 0);
  assert.match(out, new RegExp(`head sha: ${HEAD}\\n`));
  assert.match(out, new RegExp(`^Merge #9 at ${HEAD}$`, "m"));
  assert.match(out, /^Recommendation: /m);
  for (const c of ["required=success", "compliance-fence=success", "applied migrations unchanged=success"]) assert.ok(out.includes(c), c);
  assert.match(out, /diff stat: 3 files, \+624 -4/);
  assert.ok(!out.includes("package-lock.json  +"), "lockfile is not listed under files to read");
  assert.ok(out.indexOf("scripts/review-gate/prep.mjs") < out.indexOf("docs/asha-notes.md"), "largest first");
});

test("a head sha that is not 40 chars exits 1 and prints no ask", async () => {
  const { lines, exitCode } = await go({ sha: HEAD.slice(0, 39) });
  assert.equal(exitCode, 1);
  assert.ok(!lines.join("\n").includes("Merge #9"));
  assert.ok(!FULL_SHA.test(HEAD.slice(0, 39)));
  assert.ok(!FULL_SHA.test(HEAD.toUpperCase()));
});

test("a review at an older sha is stale: exit 1, no ask", async () => {
  const { lines, exitCode } = await go({ comments: [rev("A", OLD), rev("B", HEAD, "PASS", "", "MEMBER", 2)] });
  assert.equal(exitCode, 1);
  const out = lines.join("\n");
  assert.match(out, /STALE REVIEW: Review A/);
  assert.ok(!out.includes("Merge #9 at"));
});

test("a short sha in the review header does not count", async () => {
  const short = { id: 1, body: `## Review A at ${HEAD.slice(0, 12)}: PASS`, author_association: "MEMBER" };
  const { lines, exitCode } = await go({ comments: [short, rev("B", HEAD, "PASS", "", "MEMBER", 2)] });
  assert.equal(exitCode, 0);
  assert.match(lines.join("\n"), /A none at head/);
  assert.match(lines.join("\n"), /No founder ask yet: Review A not counted/);
});

test("a commenter who is not OWNER, MEMBER or COLLABORATOR is ignored", async () => {
  const { lines } = await go({ comments: [rev("A", HEAD, "PASS", "", "NONE"), rev("B", HEAD, "PASS", "", "MEMBER", 2)] });
  assert.match(lines.join("\n"), /No founder ask yet/);
  assert.match(lines.join("\n"), /not OWNER, MEMBER or COLLABORATOR/);
});

test("newest verdict per lens decides; an open Must fix takes a pass away", async () => {
  assert.equal(reviewState([rev("A", HEAD, "PASS", "", "MEMBER", 1), rev("A", HEAD, "CHANGES", "", "MEMBER", 2)], HEAD).A, false);
  assert.equal(reviewState([rev("A", HEAD, "CHANGES", "", "MEMBER", 1), rev("A", HEAD, "PASS", "", "MEMBER", 2)], HEAD).A, true);
  assert.equal(reviewState([rev("A", HEAD, "PASS", "Must fix: the Asha fixture is wrong")], HEAD).A, false);
  assert.equal(reviewState([rev("A", HEAD, "PASS WITH NOTES", "Must fix: none")], HEAD).A, true);
  assert.equal(parseReview(`intro\n## Review A at ${HEAD}: PASS`), null, "must be the first line");
});

test("a red or missing required context means no ask", async () => {
  const red = [run(1, "required", "failure"), run(2, "compliance-fence", "success")];
  const { lines, exitCode } = await go({ runs: red, comments: [rev("A", HEAD), rev("B", HEAD, "PASS", "", "MEMBER", 2)] });
  assert.equal(exitCode, 0);
  const out = lines.join("\n");
  assert.match(out, /required=failure/);
  assert.match(out, /applied migrations unchanged=missing/);
  assert.match(out, /a required context is not success/);
  assert.equal(ciState([run(1, "required", "failure"), run(5, "required", "success")]).required, "success", "newest run wins");
});

test("head moving while the helper runs exits 1 and prints no ask", async () => {
  const { lines, exitCode } = await go({ movedTo: OLD, comments: [rev("A", HEAD), rev("B", HEAD, "PASS", "", "MEMBER", 2)] });
  assert.equal(exitCode, 1);
  assert.match(lines.join("\n"), /HEAD MOVED/);
  assert.ok(!lines.join("\n").includes("Merge #9 at"));
});

test("only GET-style reads: every path is a repos/ read, protection failure falls back with a note", async () => {
  const calls = [];
  const { lines } = await go({ calls, protection: null, comments: [rev("A", HEAD), rev("B", HEAD, "PASS", "", "MEMBER", 2)] });
  assert.ok(calls.every((c) => c.startsWith("repos/thesaurabhpareek/earlyletters/")));
  assert.match(lines.join("\n"), /protection read failed/);
});

test("parseArgs", () => {
  assert.deepEqual(parseArgs(["12"]), { pr: 12, repo: "thesaurabhpareek/earlyletters" });
  assert.throws(() => parseArgs([]));
  assert.throws(() => parseArgs(["12", "--repo", "../x"]));
  assert.throws(() => parseArgs(["abc"]));
});
