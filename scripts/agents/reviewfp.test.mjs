// Review fingerprints: a develop merge does not queue a second red-team review. Run: node --test 'scripts/agents/*.test.mjs'
import { test } from "node:test";
import assert from "node:assert/strict";
import { fingerprint, normalizePatch, equivalentReviewed, recordAssigned } from "./reviewfp.mjs";

// Fixture shaped like PR #38's files page (one Markdown file). After a develop
// merge the hunk header moves (develop added lines above) but the PR's own lines do not.
const PATCH_A = "@@ -0,0 +1,3 @@\n+# Launch plan for Asha's family\n+\n+Week one: invite testers.";
const PATCH_A_MOVED = "@@ -10,0 +12,3 @@\n+# Launch plan for Asha's family\n+\n+Week one: invite testers.";
const PATCH_B = "@@ -0,0 +1,3 @@\n+# Launch plan for Asha's family\n+\n+Week one: invite more testers.";
const file = (filename, patch, extra = {}) => {
  const n = patch.split("\n").filter((l) => l.startsWith("+") || l.startsWith("-")).length;
  return { filename, status: "added", additions: n, deletions: 0, changes: n, sha: "blob1", patch, ...extra };
};
const OWNER = { user: { login: "founder", type: "User" }, author_association: "OWNER" };
const STRANGER = { user: { login: "someone", type: "User" }, author_association: "NONE" };

function world({ files, comments = [], open = [38] }) {
  const calls = [];
  const facts = { all: comments };
  const ctx = {
    state: {},
    now: new Date("2026-10-18T12:00:00Z"),
    repo: "o/r",
    roster: { founder: "founder" },
    env: {},
    openPRs: open.map((number) => ({ number })),
    prFacts: () => facts,
    gh: (path) => { calls.push(path); return typeof files === "function" ? files(path) : files; },
  };
  return { ctx, calls };
}
const pr = (sha) => ({ number: 38, head: { sha } });

test("fingerprint ignores file order and hunk line numbers, but not content", () => {
  const a = fingerprint([file("a.md", PATCH_A), file("b.md", PATCH_B)]);
  assert.match(a, /^[0-9a-f]{40}$/);
  assert.equal(fingerprint([file("b.md", PATCH_B), file("a.md", PATCH_A_MOVED)]), a);
  assert.notEqual(fingerprint([file("a.md", PATCH_B), file("b.md", PATCH_B)]), a);
  assert.notEqual(fingerprint([file("c.md", PATCH_A), file("b.md", PATCH_B)]), a, "the file name counts");
  assert.equal(normalizePatch("@@ -3,7 +4,8 @@ heading\n x"), "@@ heading\n x");
});

test("fingerprint is unknown when the files page cannot be trusted", () => {
  assert.equal(fingerprint(null), undefined, "the call failed");
  assert.equal(fingerprint(Array.from({ length: 100 }, (_, i) => file(`f${i}.md`, PATCH_A))), undefined, "100 files: there may be a second page");
  // Seen on PR #2: licences.json, 4258 added lines, no patch field.
  assert.equal(fingerprint([{ filename: "big.json", status: "added", additions: 4258, deletions: 0, changes: 4258, sha: "x" }]), undefined);
  assert.equal(fingerprint([file("a.md", "@@ -0,0 +1,1 @@\n+one line", { additions: 3, changes: 3 })]), undefined, "patch shorter than its counts");
});

test("binary files (no patch, no changed lines) use status and blob sha", () => {
  const png = (sha) => ({ filename: "icon.png", status: "added", additions: 0, deletions: 0, changes: 0, sha });
  assert.ok(fingerprint([png("aaa")]));
  assert.notEqual(fingerprint([png("aaa")]), fingerprint([png("bbb")]));
});

test("recordAssigned stores { sha, fp } with one files call", () => {
  const { ctx, calls } = world({ files: [file("docs/marketing/LAUNCH_PLAN.md", PATCH_A)] });
  recordAssigned(ctx, pr("s1"));
  assert.deepEqual(ctx.state.reviewfp[38], { sha: "s1", fp: fingerprint([file("docs/marketing/LAUNCH_PLAN.md", PATCH_A)]) });
  assert.deepEqual(calls, ["/repos/o/r/pulls/38/files?per_page=100"]);
  recordAssigned(ctx, undefined);
  recordAssigned(ctx, { number: 39 });
  assert.deepEqual(Object.keys(ctx.state.reviewfp), ["38"]);
});

test("a develop merge with the same changes counts as reviewed", () => {
  const { ctx, calls } = world({ files: [file("docs/marketing/LAUNCH_PLAN.md", PATCH_A_MOVED)], comments: [{ ...OWNER, body: "<!-- red-team:s1 -->\nVerdict: ship" }] });
  ctx.state.reviewfp = { 38: { sha: "s1", fp: fingerprint([file("docs/marketing/LAUNCH_PLAN.md", PATCH_A)]) } };
  assert.equal(equivalentReviewed(ctx, pr("s2")), true);
  assert.equal(equivalentReviewed(ctx, pr("s2")), true);
  assert.equal(calls.length, 1, "one files call per PR per run");
});

test("new changes since the review mean a new review", () => {
  const { ctx } = world({ files: [file("docs/marketing/LAUNCH_PLAN.md", PATCH_B)], comments: [{ ...OWNER, body: "<!-- red-team:s1 -->\nVerdict: ship" }] });
  ctx.state.reviewfp = { 38: { sha: "s1", fp: fingerprint([file("docs/marketing/LAUNCH_PLAN.md", PATCH_A)]) } };
  assert.equal(equivalentReviewed(ctx, pr("s2")), false);
});

test("no shortcut without a trusted red-team review of the recorded head, or with an unknown fingerprint", () => {
  const fp = fingerprint([file("x.md", PATCH_A)]);
  const cases = [
    { name: "no review posted", comments: [], rec: { sha: "s1", fp } },
    { name: "untrusted author", comments: [{ ...STRANGER, body: "<!-- red-team:s1 -->" }], rec: { sha: "s1", fp } },
    { name: "review of another head", comments: [{ ...OWNER, body: "<!-- red-team:s0 -->" }], rec: { sha: "s1", fp } },
    { name: "fingerprint unknown at assignment", comments: [{ ...OWNER, body: "<!-- red-team:s1 -->" }], rec: { sha: "s1", fp: null } },
  ];
  for (const c of cases) {
    const { ctx, calls } = world({ files: [file("x.md", PATCH_A)], comments: c.comments });
    ctx.state.reviewfp = { 38: c.rec };
    assert.equal(equivalentReviewed(ctx, pr("s2")), false, c.name);
    assert.equal(calls.length, 0, `${c.name}: no files call`);
  }
  const { ctx } = world({ files: null, comments: [{ ...OWNER, body: "<!-- red-team:s1 -->" }] });
  ctx.state.reviewfp = { 38: { sha: "s1", fp } };
  assert.equal(equivalentReviewed(ctx, pr("s2")), false, "files call failed now");
});

test("no files call for PRs without state, or at the reviewed head itself", () => {
  const { ctx, calls } = world({ files: [file("x.md", PATCH_A)], comments: [{ ...OWNER, body: "<!-- red-team:s1 -->" }] });
  assert.equal(equivalentReviewed(ctx, pr("s1")), false);
  ctx.state.reviewfp = { 38: { sha: "s1", fp: "f" } };
  assert.equal(equivalentReviewed(ctx, pr("s1")), false);
  assert.equal(calls.length, 0);
});

test("entries for PRs that are no longer open are pruned", () => {
  const { ctx } = world({ files: [file("x.md", PATCH_A)], open: [38] });
  ctx.state.reviewfp = { 12: { sha: "a", fp: "f" }, 38: { sha: "s1", fp: "f" } };
  equivalentReviewed(ctx, pr("s2"));
  assert.deepEqual(Object.keys(ctx.state.reviewfp), ["38"]);
  ctx.state.reviewfp[12] = { sha: "a", fp: "f" };
  recordAssigned(ctx, pr("s3"));
  assert.deepEqual(Object.keys(ctx.state.reviewfp), ["38"]);
});
