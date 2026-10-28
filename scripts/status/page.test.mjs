// Fixture tests for the founder page. No network: `collect` gets a fake GET.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  founderClasses, sameSha, parseLens, PASSING, verdictsOf, buildModel, renderPage, renderFounderList, collect, MAX_LINES, EXTRA_SLOTS,
} from "./page.mjs";

const NOW = "2026-10-28T12:00:00Z";
const ago = (h) => new Date(Date.parse(NOW) - h * 3600_000).toISOString();
const ME = new Set(["owner"]);
const HEAD = "a1b2c3d4e5f60718293a4b5c6d7e8f9012345678";
const OLD = "9f8e7d6c5b4a39281706f5e4d3c2b1a098765432";
const c = (body, h, who = "owner") => ({ body, created_at: ago(h), user: { login: who } });

test("founder-class path matching follows D-117 classes", () => {
  assert.deepEqual(founderClasses(["supabase/migrations/2026_x.sql"]), ["database"]);
  assert.deepEqual(founderClasses(["apps/mobile/src/lib/auth/apple.ts", "apps/mobile/src/app/(auth)/sign-in/code.tsx"]), ["auth"]);
  assert.deepEqual(founderClasses(["packages/core/src/plan.ts"]), ["payments"]);
  assert.deepEqual(founderClasses([".github/workflows/ci.yml", "apps/mobile/eas.json"]), ["release config"]);
  assert.deepEqual(founderClasses(["packages/core/src/verify.ts"]), ["engine"]);
  assert.deepEqual(founderClasses(["packages/core/src/age.ts", "docs/supabase/notes.md", "apps/mobile/src/lib/authors.ts"]), []);
  assert.deepEqual(founderClasses(["packages/core/src/types.ts", "supabase/tests/x.mjs"]), ["database", "engine"]);
});

test("sha comparison is a prefix match of at least 7", () => {
  assert.ok(sameSha("a1b2c3d", HEAD));
  assert.ok(sameSha(HEAD, "A1B2C3D4"));
  assert.ok(!sameSha("a1b2c3", HEAD));
  assert.ok(!sameSha(OLD.slice(0, 7), HEAD));
  assert.ok(!sameSha(undefined, HEAD));
});

test("lens verdicts parse the repo's heading habits", () => {
  assert.deepEqual(parseLens("## Review A (database and privacy) at 97b50e1: PASS WITH NOTES", 178), { verdict: "PASS WITH NOTES", sha: "97b50e1" });
  assert.deepEqual(parseLens("PR #179 at df2991c: PASS", 179), { verdict: "PASS", sha: "df2991c" });
  assert.deepEqual(parseLens("## Review: PASS (head `1a11c9a5775dbc6b69be1f7231d1c77baca3e00c`)", 201).sha, "1a11c9a5775dbc6b69be1f7231d1c77baca3e00c");
  assert.equal(parseLens("## Reviewer W re-check at c903b53: FAIL, 1 blocking issue", 205).verdict, "FAIL");
  assert.deepEqual(parseLens("## Reviewer C (code correctness)\n\nVerdict: BLOCKING\n", 192), { verdict: "BLOCKING", sha: undefined });
  assert.equal(parseLens("PR #166 at 0c87a0c: PASS WITH NOTES", 182), undefined, "a copy of another PR's verdict");
  assert.equal(parseLens("<!-- merge-train -->\nPASS", 1), undefined);
  assert.equal(parseLens("Fixed in ea0affb: red-team findings 2 and 3.", 30), undefined);
  assert.equal(parseLens("## Review B (product fit, content and voice)", 170), undefined, "no verdict, no row");
  // Negations and change requests are not approval (independent reviews of #339, 28 Oct).
  assert.equal(parseLens("## Review A at 1a2b3c4: DO NOT MERGE", 310).verdict, "DO NOT MERGE");
  assert.equal(parseLens("## Review B at 1a2b3c4: do not  merge until fixed", 310).verdict, "DO NOT MERGE");
  assert.equal(parseLens("## Review A at 1a2b3c4: don't merge", 310).verdict, "DO NOT MERGE");
  assert.equal(parseLens("## Review A at 1a2b3c4: not a pass, 2 issues", 310).verdict, "FAIL");
  assert.equal(parseLens("## Lens B verdict at 1a2b3c4: not mergeable", 310).verdict, "DO NOT MERGE");
  assert.equal(parseLens("## Review A at 1a2b3c4: PASS, ready to merge", 310).verdict, "PASS");
  const v = (t) => parseLens(`## Review A (accuracy) at 97b50e1: ${t}`, 310)?.verdict;
  for (const t of ["REQUEST CHANGES, then merge", "should not merge", "must not merge", "cannot merge yet", "not ready to merge", "merge blocked"]) {
    assert.ok(!PASSING.has(v(t)), `${t} must not pass`);
  }
  for (const t of ["cannot pass", "won't pass", "unable to pass", "needs work before merge", "CHANGES REQUESTED", "NOT APPROVED", "reject", "hold"]) {
    assert.ok(!PASSING.has(v(t)), `${t} must not pass`);
  }
  assert.equal(v("REQUEST CHANGES, then merge"), "CHANGES NEEDED");
  assert.equal(v("should not merge"), "DO NOT MERGE");
  assert.equal(v("cannot pass"), "FAIL");
  assert.equal(v("PASS WITH NOTES"), "PASS WITH NOTES");
  assert.equal(v("MERGE AFTER FIX"), "MERGE AFTER FIX");
  assert.equal(v("lgtm"), undefined, "unknown wording is no verdict");
  // The habit on #359 and #360: verdict clause, then a sentence that says nothing is blocking.
  assert.equal(parseLens("Review lens A (security), head a109a7b. Verdict: PASS WITH NOTES. No blocking finding.", 359).verdict, "PASS WITH NOTES");
  assert.equal(parseLens("Review lens B, delta at fbf28ab. Verdict: PASS WITH NOTES. No Must.", 359).verdict, "PASS WITH NOTES");
  assert.equal(parseLens("Review lens B, head a109a7b. Verdict: REQUEST CHANGES, then merge. Two Musts.", 359).verdict, "CHANGES NEEDED");
});

test("verdict-on-head: latest lens and red-team verdicts against the current head", () => {
  const pr = { number: 7, head: { sha: HEAD } };
  const comments = [
    c(`PR #7 at ${OLD.slice(0, 7)}: FAIL`, 30),
    c(`PR #7 at ${HEAD.slice(0, 7)}: PASS WITH NOTES`, 2),
    c(`PR #7 at ${HEAD.slice(0, 7)}: FAIL`, 1, "stranger"),
  ];
  const reviews = [{ body: `<!-- red-team:${OLD} -->\nVerdict: ship`, submitted_at: ago(5), user: { login: "Owner" } }];
  const v = verdictsOf(pr, comments, reviews, ME);
  assert.equal(v.lens.length, 2, "untrusted author ignored");
  assert.deepEqual(v.lens.at(-1), { verdict: "PASS WITH NOTES", sha: HEAD.slice(0, 7), onHead: true });
  assert.equal(v.lens[0].onHead, false);
  assert.deepEqual(v.red, { verdict: "ship", sha: OLD, onHead: false });
});

function fixture() {
  const pr = (number, createdH, extra = {}) => ({ number, created_at: ago(createdH), updated_at: ago(1), head: { sha: HEAD }, draft: false, ...extra });
  const open = [pr(40, 500), pr(41, 400, { draft: true }), pr(42, 300), pr(43, 200), pr(44, 100), pr(45, 50), pr(46, 10)];
  const closed = [
    pr(50, 30, { merged_at: ago(3) }),
    pr(51, 60, { merged_at: ago(30) }),
    pr(52, 60, { merged_at: ago(100) }),
    pr(53, 60, { merged_at: null }),
    pr(54, 900, { merged_at: ago(200), updated_at: ago(200) }),
  ];
  const handoffs = [
    { number: 60, created_at: ago(24 * 14), comments: 0 },
    { number: 61, created_at: ago(47), comments: 1 },
    { number: 62, created_at: ago(49), comments: 2 },
    { number: 63, created_at: ago(100), comments: 0, pull_request: {} },
  ];
  const files = {
    50: [{ filename: "supabase/migrations/x.sql" }],
    51: [{ filename: "docs/README.md" }],
    52: [{ filename: "packages/core/src/plan.ts" }, { filename: ".github/workflows/ci.yml" }],
  };
  const comments = {
    40: [c(`PR #40 at ${HEAD.slice(0, 7)}: PASS`, 5)],
    50: [c(`## Review A at ${HEAD.slice(0, 7)}: PASS`, 6), c(`## Review B at ${HEAD.slice(0, 7)}: PASS WITH NOTES`, 5)],
    52: [c(`## Review A at ${OLD.slice(0, 7)}: PASS`, 110)],
  };
  const calls = [];
  const get = (path) => {
    calls.push(path);
    const p = path.replace(/[?&]per_page=100&page=\d+$/, "");
    const page = Number(path.match(/page=(\d+)$/)[1]);
    if (page > 1) return [];
    let m;
    if (p.endsWith("/pulls?state=open")) return open;
    if (p.includes("/pulls?state=closed")) return closed;
    if (p.includes("/issues?state=open&labels=handoff")) return handoffs;
    if ((m = p.match(/\/pulls\/(\d+)\/files$/))) return files[m[1]] ?? [];
    if ((m = p.match(/\/issues\/(\d+)\/comments$/))) return comments[m[1]] ?? [];
    if ((m = p.match(/\/pulls\/(\d+)\/reviews$/))) return [];
    throw new Error(`unexpected path ${path}`);
  };
  return { get, calls };
}

test("collect only reads, and the page fits in 15 lines", () => {
  const { get, calls } = fixture();
  const data = collect(get, { repo: "o/r", now: NOW, trusted: ME });
  assert.ok(calls.every((p) => p.startsWith("/repos/o/r/")));
  assert.ok(!calls.some((p) => /\/files$|\/comments|\/reviews/.test(p) && /\/(53|54)\//.test(p)), "unmerged and older than 7 days skipped");
  assert.ok(!calls.some((p) => /\/(51)\/(comments|reviews)/.test(p)), "non-founder merges need no threads");
  assert.ok(!calls.some((p) => /\/(45|46)\/(comments|reviews)/.test(p)), "threads only for the waiting PRs shown");
  const m = buildModel(data, NOW);
  assert.deepEqual(m.merged24, [50]);
  assert.deepEqual(m.waiting.map((p) => p.number), [40, 42, 43, 44, 45, 46]);
  assert.deepEqual(m.handoffs.map((h) => [h.number, h.age, h.comments]), [[60, 14, 0], [62, 2, 2]]);
  assert.deepEqual(m.founder.map((p) => [p.number, p.classes]), [[50, ["database"]], [52, ["payments", "release config"]]]);
  assert.equal(m.old14, 2);

  const lines = renderPage(m);
  assert.ok(lines.length <= MAX_LINES, lines.join("\n"));
  const text = lines.join("\n");
  assert.match(text, /Merged in the last 24 h: 1\. #50\./);
  assert.match(text, /- #40, 20 d: lens PASS on head; red team none\./);
  assert.match(text, /6 open PRs \(not drafts\), oldest first, first 4 shown/);
  assert.doesNotMatch(text, /#41,/);
  assert.match(text, /Handoffs open over 48 h: 2\. #60 \(14 d, 0 comments\), #62 \(2 d, 2 comments\)\./);
  assert.match(text, /- #50 database: PASS on head; PASS WITH NOTES on head\.\n/);
  assert.match(text, /- #52 payments, release config: PASS on an older head \(fewer than 2 passing on the merged head\)\./);
  assert.match(text, /Open PRs older than 14 days: 2\.$/);
  assert.doesNotMatch(text, /[\u2013\u2014\u2018\u2019\u201C\u201D\u2026]/);
});

test("extra lines hook: at most EXTRA_SLOTS, total never over 15", () => {
  const { get } = fixture();
  const m = buildModel(collect(get, { repo: "o/r", now: NOW, trusted: ME }), NOW);
  m.founder = Array.from({ length: 9 }, (_, i) => ({ number: 100 + i, classes: ["engine"], lens: [] }));
  const lines = renderPage(m, { extraLines: ["Lead time: x", "Stale: y", "dropped"] });
  assert.ok(lines.length <= MAX_LINES);
  assert.equal(lines.filter((l) => /^Lead time|^Stale/.test(l)).length, EXTRA_SLOTS);
  assert.ok(!lines.includes("dropped"));
  assert.equal(lines.at(-1), "Open PRs older than 14 days: 2.");
});

test("founder list mode reads every thread and lists every founder-class merge", () => {
  const { get, calls } = fixture();
  const m = buildModel(collect(get, { repo: "o/r", now: NOW, trusted: ME, all: true }), NOW);
  assert.ok(calls.some((p) => /\/46\/comments/.test(p)));
  const lines = renderFounderList(m);
  assert.equal(lines[0], "Founder-class merges in the 7 days to 2026-10-28 (D-117 paths): 2.");
  assert.deepEqual(lines.slice(1).map((l) => l.match(/^- #(\d+)/)[1]), ["50", "52"]);
});
