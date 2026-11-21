// Lens reviews (lens.mjs). Run: node --test 'scripts/agents/*.test.mjs'
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildBrief, ciState, lensMarker, lensRecords, lensRows, lensState, mergeCheck, parseFindings, parseLens, statusLine, verdictWord } from "./lens.mjs";
import { parseVerdict } from "./verdicts.mjs";

// Real lens comments on merged PRs #276, #284, #290, #293 and #303, read with
// `gh api repos/thesaurabhpareek/earlyletters/issues/<n>/comments` on 28 Oct 2026.
// Author names are removed (every one was posted from the founder account; here
// "founder-account"). Bodies are cut to the heading and the lines the parser reads;
// long lines end in "[cut]". Rows: [pr, created_at, body].
const REAL = [
  [276, "2026-10-24T08:02:00Z", "## Review A (Metro resolution and the guard test), head 640bc4d\n\n**Verdict: PASS WITH NOTES.** Nothing blocks. The rename fixes the launch crash: I checked it with Metro's own resolver and with a fresh iOS export using [cut]\n### Findings\n\n**Blocking:** none.\n\n**Medium: a type-only export fools the export check.** `apps/mobile/test/platform-split.test.ts:50-67` (`exportNames`) records names only, never whether a [cut]"],
  [276, "2026-10-24T08:07:50Z", "## Reviewer B (billing code paths, tests, docs): PASS WITH NOTES\n\nReviewed head `640bc4d` against develop `d49bd8e` in a clean worktree. Nothing blocks a merge. The rename restores the real ledger and status report modules [cut]"],
  [284, "2026-10-24T10:30:52Z", "## Review A (Actions correctness and security), PR #284 at 35e1d79: PASS WITH NOTES\n\nNothing blocks. Every item in the brief checks out, and the PR's own run is green. The `launch` job matches kill-harness.yml's `release-launch` assertion [cut]"],
  [284, "2026-10-24T10:32:43Z", "## Review B (what the check proves, failure modes, cost, docs), PR #284 at 35e1d79: PASS WITH NOTES\n\nNothing blocks. The `launch` job would have gone red on every mobile pull request from 4 Oct until #276. I found no way for it to pass when the app never [cut]"],
  [290, "2026-10-27T20:19:32Z", "## Review A (correctness, tests, mutants), PR #290 at 236e827: PASS WITH NOTES\n\nNothing blocks. The cut rule is sound: the runs always join to the final text byte for byte, and no letter or digit ever crosses a cut. Every mark whose [cut]"],
  [290, "2026-10-27T20:31:04Z", "## Review B (Review display, constitution, spec), PR #290 at 236e827: PASS WITH NOTES\n\nNothing blocks. The fix is display only and does what the critics' re-check asked, and Review now reads as the saved letter in every case I rendered."],
  [293, "2026-10-27T20:41:06Z", "## Review B (ADR, evidence, device plan, release docs), PR #293 at f54c0e4: FAIL\n\nTwo items block. Both are text fixes, and the flip itself (one line plus its test) is sound.\n- **B1:** the record says ADTS starts at build 2. Build 1 has not been cut, and it will be cut from develop after this merge.\n- **B2:** the ADR's checks section still says V1, V2 and V3 gate the flip, while its Status records the flip with V1's speech half and V3's Mac half still open.\n### Blocking\n\n**B1. The record says ADTS starts at build 2, but build 1 is cut from develop after this merge.**\n**B2. ADR 0027's checks section contradicts its Status.**\n### Medium\n\n- **M1. The revert rule is not complete everywhere someone would look at the freeze.**"],
  [293, "2026-10-27T20:46:17Z", "## Review A (code and tests), PR #293 at f54c0e4: PASS WITH NOTES\n\nNothing blocks. The PR does what it says and nothing else."],
  [293, "2026-10-27T21:58:09Z", "## Review B delta re-check, PR #293 at fab871a (f54c0e4..fab871a): FAIL\n\nOne item blocks, and it is a single phrase. B1, B2 and M1 are fixed at every line I listed, the merge is clean, and the smoke on f54c0e4 is all green."],
  [293, "2026-10-27T22:01:48Z", "## Review B delta re-check, PR #293 at 4ea7fe0 (fab871a..4ea7fe0): PASS\n\nThe one blocking phrase is fixed, and nothing else moved."],
  [293, "2026-10-27T22:02:25Z", "## Review A delta re-check, PR #293 at 4ea7fe0 (f54c0e4..4ea7fe0): PASS\n\n**What moved.** The head moved twice while I re-checked: first to fab871a, then to 4ea7fe0. Since f54c0e4 there are three commits:"],
  [293, "2026-10-27T22:09:22Z", "## Review B delta re-check, PR #293 at 48d49bb (4ea7fe0..48d49bb): PASS\n\n**The merge, 84ee507.** It adds only the branch's own changes on top of develop 1c6795b."],
  [303, "2026-10-28T02:01:31Z", "## Review A (security, correctness, mutants), PR #303 at b7e8d0f: PASS WITH NOTES\n\nNothing blocks.\n### Low\n**L1. An unreadable `.p8` crashes the run and prints no findings.**\n\n**L2. The bearer token is not in the redaction list** (line 158)."],
  [303, "2026-10-28T02:03:48Z", "## Review B (founder-facing behaviour, runbook fit, docs), PR #303 at b7e8d0f: PASS WITH NOTES\n\nNothing here blocks a merge. The doctor is read-only and safe, and it does what the PR body says. The notes are about runbook fit:"],
  [303, "2026-10-28T02:21:23Z", "<!-- agent:release -->\nNew head 081b18b (pushed on top of b7e8d0f, no rebase). All eight points, in the order asked:\n1. **Unreadable key, or a folder:** read through an injected `readKey` inside a `try`; a clean `FAIL [apple] ... could not be read as a file`, with no path [cut]"],
  [303, "2026-10-28T02:47:15Z", "## Review A delta re-check, PR #303 at 081b18b (b7e8d0f..081b18b): PASS\n\nMy items are fixed. `081b18b` is one fast-forward commit on `b7e8d0f` (4 files, +279 -83, no `.github/` path). I drove every new error path with fictional [cut]"],
  [303, "2026-10-28T02:49:42Z", "## Review B delta re-check, PR #303 at 081b18b (b7e8d0f..081b18b): FAIL\n\nThe FAIL rests on one point, and the fix is one line. The doctor and the preflight still disagree when `ascAppId` is missing: the doctor fails it, the [cut]"],
  [303, "2026-10-28T02:55:55Z", "<!-- agent:release-engineering -->\nLens B fix pushed at 2d36097 (one commit on 081b18b, no rebase)."],
  [303, "2026-10-28T03:21:55Z", "## Review B delta re-check, PR #303 at 2d36097 (081b18b..2d36097): PASS\n\nThe blocking finding is fixed. Without `--live`, a missing `ascAppId` is now a WARN in the doctor, and I ran both tools on this tree: the doctor and the [cut]"],
  [303, "2026-10-28T03:25:04Z", "## Review A delta re-check, PR #303 at 2d36097 (081b18b..2d36097): PASS\n\nThis covers the head as I fetched it: `2d36097` is one fast-forward commit on `081b18b`, touching 2 files (+9 -4) and no `.github/` path. The [cut]"],
  [303, "2026-10-28T03:27:25Z", "<!-- agent:release-engineering -->\nPushed e44e4f5 (one commit on 2d36097, no rebase; comments, docs and tests only)."],
  [303, "2026-10-28T03:55:11Z", "## Review A final check, PR #303 at e44e4f5 (2d36097..e44e4f5): PASS\n\n`e44e4f5` is one fast-forward commit on `2d36097` (4 files, +19 -4, no `.github/` path)."],
];
// Merged heads, from `gh api repos/.../pulls/<n>` (head.sha).
const MERGED = { 276: "640bc4d590b98406cc6ab33d73969374b66ec9d2", 284: "35e1d79fe468df581ccf484a281070f8fd8393bc", 290: "236e827cf6135ac53cbe9b5bc1102aea9b5e84e3", 293: "48d49bb396973719598ae9479e415e03a7ae9b4a", 303: "e44e4f5cfe866bc2088ba8ffa6c99bacbc998bd5" };
const trust = { founder: "founder-account", appClientId: "", bots: new Set(["claude[bot]"]) };
const comments = (pr) => REAL.filter((r) => r[0] === pr).map(([, at, body], i) => ({ id: i, created_at: at, body, user: { login: "founder-account", type: "User" }, author_association: "OWNER" }));
const recs = (pr) => lensRecords(comments(pr), { pr, trust });

test("parses each real verdict shape: lens, head, delta base and verdict", () => {
  const all = Object.fromEntries([276, 284, 290, 293, 303].map((n) => [n, recs(n).map((r) => `${r.lens} ${r.head}${r.base ? ` ${r.base}..` : ""} ${r.verdict}`)]));
  assert.deepEqual(all[276], ["A 640bc4d pass with notes", "B 640bc4d pass with notes"], "heading with head, and a Verdict line; Reviewer B with 'Reviewed head' in the body");
  assert.deepEqual(all[284], ["A 35e1d79 pass with notes", "B 35e1d79 pass with notes"]);
  assert.deepEqual(all[290], ["A 236e827 pass with notes", "B 236e827 pass with notes"], "'Review display' in B's scope does not confuse the lens or the verdict");
  assert.deepEqual(all[293], ["B f54c0e4 fail", "A f54c0e4 pass with notes", "B fab871a f54c0e4.. fail", "B 4ea7fe0 fab871a.. pass", "A 4ea7fe0 f54c0e4.. pass", "B 48d49bb 4ea7fe0.. pass"]);
  assert.equal(all[303].length, 7, "the two fixer notes (<!-- agent:... -->) are not verdicts");
  assert.deepEqual(all[303].slice(-1), ["A e44e4f5 2d36097.. pass"], "a 'final check' heading counts");
  assert.ok(recs(303).every((r) => r.source === "heading" && r.trusted && r.author === "founder-account"));
});

test("findings keep their id and severity, from both summary bullets and sections", () => {
  const b = recs(293)[0].findings;
  assert.deepEqual(b.map((f) => [f.id, f.severity]), [["B1", "blocking"], ["B2", "blocking"], ["M1", "medium"]], "a summary bullet takes the severity of its later section");
  assert.deepEqual(recs(303)[0].findings.map((f) => [f.id, f.severity]), [["L1", "low"], ["L2", "low"]]);
  const a276 = recs(276)[0].findings;
  assert.equal(a276.length, 1, "'Blocking: none.' is not a finding");
  assert.deepEqual([a276[0].severity, a276[0].title.slice(0, 32)], ["medium", "a type-only export fools the exp"]);
});

test("a verdict on an old head is reported stale: #293 and #303 merged with one lens on the previous head", () => {
  const s293 = lensState(recs(293), MERGED[293]);
  assert.equal(s293.ready, false);
  assert.equal(s293.A.stale, true);
  assert.equal(s293.B.onHead, true);
  assert.deepEqual(s293.reasons, ["lens A: pass is on 4ea7fe0, not the head 48d49bb (stale)"]);
  const s303 = lensState(recs(303), MERGED[303]);
  assert.deepEqual(s303.reasons, ["lens B: pass is on 2d36097, not the head e44e4f5 (stale)"]);
  assert.equal(statusLine(303, s303), "- #303: lens A pass on head; lens B pass on an older head 2d36097 (stale).");
});

test("two passing lenses on the merged head satisfy the rule only with green CI", () => {
  for (const n of [276, 284, 290]) {
    assert.equal(lensState(recs(n), MERGED[n]).ready, true, `#${n}`);
    assert.equal(mergeCheck({ records: recs(n), head: MERGED[n], ci: "success" }).ok, true);
  }
  assert.deepEqual(mergeCheck({ records: recs(290), head: MERGED[290], ci: "pending" }).reasons, ["CI on the head is pending"]);
  assert.deepEqual(mergeCheck({ records: recs(290), head: MERGED[290] }).reasons, ["CI on the head is unknown"]);
  assert.match(statusLine(290, lensState(recs(290), MERGED[290])), /two passes on the head\.$/);
});

test("the newest verdict per lens wins, so a later FAIL on the head blocks", () => {
  const head = MERGED[303];
  const extra = { id: 99, created_at: "2026-10-28T04:00:00Z", user: { login: "founder-account" }, body: `${lensMarker("b", head)}\nVerdict: fail\n## Review B re-check` };
  const r = lensRecords([...comments(303), extra], { pr: 303, trust });
  assert.deepEqual(lensState(r, head).reasons, ["lens B: fail on the head"]);
});

test("untrusted authors, copies from another PR and the same reviewer twice do not count", () => {
  const head = MERGED[290];
  const outsider = comments(290).map((c) => ({ ...c, user: { login: "stranger", type: "User" }, author_association: "NONE" }));
  assert.deepEqual(lensState(lensRecords(outsider, { pr: 290, trust }), head).reasons, ["lens A: no verdict", "lens B: no verdict"]);
  assert.equal(parseLens(REAL.find((r) => r[0] === 284)[2], 290), undefined, "a #284 verdict pasted on #290");
  const same = ["a", "b"].map((l, i) => ({ id: i, created_at: `2026-10-28T0${i}:00:00Z`, user: { login: "founder-account" }, body: `${lensMarker(l, head)}\nVerdict: pass\nReviewer: session_SAMEONE123` }));
  assert.deepEqual(lensState(lensRecords(same, { pr: 290, trust }), head).reasons, ["lens A and lens B name the same reviewer (not independent)"]);
  assert.equal(lensState(lensRecords(same, { pr: 290, trust: () => false }), head).A, undefined, "a predicate (H1's trust) can be injected");
});

test("the marker format: same family as verdicts.mjs, never read as a red-team verdict", () => {
  const sha = "a".repeat(39) + "1";
  const body = `${lensMarker("A", sha, "b".repeat(39) + "2")}\nVerdict: pass with notes\n## Review A delta re-check`;
  assert.deepEqual(({ ...parseLens(body, 1), findings: undefined }), { lens: "A", head: sha, base: "b".repeat(39) + "2", verdict: "pass with notes", reviewer: undefined, findings: undefined, source: "marker" });
  assert.equal(parseVerdict(body), undefined);
  assert.equal(parseLens(`<!-- red-team:${sha} -->\nVerdict: ship`, 1), undefined);
  assert.equal(parseLens(`${lensMarker("b", sha)}\nLooks fine.`, 1).verdict, "unclear");
  assert.equal(parseLens("## Notes on the review process", 1), undefined);
  assert.deepEqual(lensRows(recs(290)), [["236e827", "pass with notes", "2026-10-27T20:19:32Z", "A"], ["236e827", "pass with notes", "2026-10-27T20:31:04Z", "B"]]);
});

test("verdict words: earliest wins, blocking words mean fail", () => {
  assert.equal(verdictWord("FAIL, 1 blocking issue; would pass with notes after"), "fail");
  assert.equal(verdictWord("changes needed"), "fail");
  assert.equal(verdictWord("PASS WITH NOTES"), "pass with notes");
  assert.equal(verdictWord("passes nothing"), undefined);
  assert.deepEqual(parseFindings("### Low\n**L1. x**\n### What I checked\n**Q9. y**").map((f) => f.severity), ["low", undefined]);
});

test("the brief names the head, the lens checks and the exact output lines, and caps the file list", () => {
  const head = MERGED[303];
  const files = Array.from({ length: 50 }, (_, i) => `scripts/x${i}.mjs`);
  const b = buildBrief({ lens: "b", pr: 303, title: "chore(release): doctor", head, base: "2d36097aa4e3326cd297d4747dbc817cb6688507", files });
  assert.match(b, /^# Lens B review delta re-check: PR #303 at e44e4f5/);
  assert.ok(b.includes(`<!-- lens:b:${head} base:2d36097aa4e3326cd297d4747dbc817cb6688507 -->\nVerdict: pass | pass with notes | fail`));
  assert.match(b, /git diff 2d36097\S* e44e4f5/);
  assert.match(b, /constitution/);
  assert.match(b, /## Files \(50, first 40 shown\)/);
  assert.ok(!b.includes("scripts/x40.mjs"));
  const a = buildBrief({ lens: "A", pr: 1, head, files: [] });
  assert.match(a, /mutate one line per behaviour/);
  assert.doesNotMatch(a, /delta/);
  assert.throws(() => buildBrief({ lens: "C", pr: 1, head }), /lens must be A or B/);
  assert.doesNotMatch(a + b, /[\u2013\u2014\u2018\u2019\u201C\u201D\u2026]/, "content rules");
});

test("CI state from check runs", () => {
  assert.equal(ciState(undefined), "unknown");
  assert.equal(ciState([]), "unknown");
  assert.equal(ciState([{ status: "completed", conclusion: "success" }, { status: "completed", conclusion: "skipped" }]), "success");
  assert.equal(ciState([{ status: "in_progress" }, { status: "completed", conclusion: "success" }]), "pending");
  assert.equal(ciState([{ status: "in_progress" }, { status: "completed", conclusion: "failure" }]), "failure");
  assert.equal(ciState([{ status: "completed", conclusion: "success" }, { status: "completed", conclusion: "cancelled" }]), "cancelled", "a cancelled run proves nothing; it is not green and not a failure");
});
