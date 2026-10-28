// Reviewer calibration signal (verdicts.mjs). Run: node --test 'scripts/agents/*.test.mjs'
import { test } from "node:test";
import assert from "node:assert/strict";
import { boardLines, parseVerdict, redTeamRows, refresh, summarize, FETCH_BUDGET, CLOSED_EVERY_MS } from "./verdicts.mjs";

const roster = { founder: "asha-founder", trusted_bots: ["claude[bot]"] };
const sha = (n) => String(n).padStart(4, "0").repeat(10);
const at = (i) => new Date(Date.UTC(2026, 9, 1) + i * 3600_000).toISOString();
const review = (headSha, verdict, i, user = { login: "claude[bot]", type: "Bot" }) => ({
  user, author_association: "NONE", submitted_at: at(i), state: "COMMENTED",
  body: `<!-- red-team:${headSha} -->\nVerdict: ${verdict}\n\n1. supabase/migrations/x.sql:12 something.`,
});
const pr = (n, u = at(n)) => ({ number: n, head: { sha: sha(n) }, updated_at: u });

/** A fake GitHub: reviews per PR number, and a closed-PR list. Counts calls. */
function fakeGh(reviewsByPr, closed = []) {
  const calls = { ghAll: [], gh: [] };
  return {
    calls,
    ghAll: (path) => { calls.ghAll.push(path); return reviewsByPr[Number(path.match(/pulls\/(\d+)\/reviews/)[1])] ?? []; },
    gh: (path) => { calls.gh.push(path); return closed; },
  };
}
const ctxFor = (gh, openPRs, state = {}, now = at(500)) => ({ state, now: new Date(now), repo: "o/r", roster, env: {}, openPRs, ...gh });

test("verdict is the second line of a body that starts with the red-team marker", () => {
  assert.deepEqual(parseVerdict(`<!-- red-team:${sha(1)} -->\nVerdict: ship\nfine`), { sha: sha(1), verdict: "ship" });
  assert.equal(parseVerdict(`<!-- red-team:${sha(1)} -->\r\nVerdict: Fix first\r\n`).verdict, "fix first");
  assert.equal(parseVerdict(`<!-- red-team:${sha(1)} -->\n**Verdict:** founder decision`).verdict, "founder decision");
  assert.equal(parseVerdict(`<!-- red-team:${sha(1)} -->\nLooks fine to me.`).verdict, "unclear");
  assert.equal(parseVerdict(`Quoting: <!-- red-team:${sha(1)} -->\nVerdict: ship`), undefined, "marker must open the body");
  assert.equal(parseVerdict(`<!-- steward:${sha(1)} -->\nVerdict: ship`), undefined);
  assert.equal(parseVerdict(undefined), undefined);
});

test("a verdict-shaped review from an untrusted account is not counted", () => {
  const trust = { founder: "asha-founder", appClientId: "", bots: new Set(["claude[bot]"]) };
  const rows = redTeamRows([
    review(sha(1), "ship", 1, { login: "stranger", type: "User" }),
    review(sha(1), "fix first", 2),
    review(sha(1), "fix first", 3, { login: "asha-founder", type: "User" }),
  ], trust);
  assert.deepEqual(rows.map((r) => r[1]), ["fix first", "fix first"]);
});

test("board shows the mix of the last 20 and warns after 15 or more without ship", () => {
  // 25 reviews on 5 PRs: one old ship, then 24 without ship (20 fix first, 4 founder decision).
  const byPr = {};
  for (let i = 0; i < 25; i++) {
    const n = 1 + (i % 5);
    const v = i === 0 ? "ship" : i % 6 === 0 ? "founder decision" : "fix first";
    (byPr[n] ??= []).push(review(sha(n), v, i));
  }
  const g = fakeGh(byPr);
  const lines = boardLines(ctxFor(g, [1, 2, 3, 4, 5].map((n) => pr(n))));
  assert.equal(lines[0], "- **Red-team verdicts, last 20 of 25 seen:** ship 0, fix first 16, founder decision 4.");
  assert.equal(lines[1], '- **Calibration note:** 24 red-team reviews in a row without a "ship" verdict. This is a signal for the founder, not a target for the reviewer: each PR is judged on its own. Only the calibration set (docs/agents/hardening/reviewer-calibration.md, not built yet) can tell a strict reviewer from a broken one.');
  assert.doesNotMatch(lines[1], /should|must|too strict|pass more/i, "the note states facts and does not nudge the reviewer");
  assert.equal(lines.length, 2);
});

test("no calibration note when a recent review shipped, or when fewer than 15 reviews exist", () => {
  const recentShip = { 1: Array.from({ length: 18 }, (_, i) => review(sha(1), i === 10 ? "ship" : "fix first", i)) };
  const a = boardLines(ctxFor(fakeGh(recentShip), [pr(1)]));
  assert.equal(a.length, 1);
  assert.match(a[0], /ship 1, fix first 17/);
  const few = { 1: Array.from({ length: 14 }, (_, i) => review(sha(1), "fix first", i)) };
  assert.equal(boardLines(ctxFor(fakeGh(few), [pr(1)])).length, 1);
  const fifteen = { 1: Array.from({ length: 15 }, (_, i) => review(sha(1), "fix first", i)) };
  assert.match(boardLines(ctxFor(fakeGh(fifteen), [pr(1)]))[1], /Calibration note:\*\* 15 red-team reviews in a row without a "ship" verdict/);
});

test("nothing to say when no red-team review is known", () => {
  assert.deepEqual(boardLines(ctxFor(fakeGh({}), [pr(1)])), []);
  assert.deepEqual(boardLines({ state: {} }), [], "no ghAll in ctx");
});

test("a failing GitHub call never breaks the board", () => {
  const ctx = ctxFor({ ghAll: () => { throw new Error("rate limited"); }, gh: () => null }, [pr(1)]);
  assert.deepEqual(boardLines(ctx), []);
});

test("each tick fetches reviews for at most the budget, newest first, and caches per head", () => {
  const open = Array.from({ length: 12 }, (_, i) => pr(i + 1));
  const byPr = Object.fromEntries(open.map((p) => [p.number, [review(p.head.sha, "fix first", p.number)]]));
  const g = fakeGh(byPr);
  const state = {};
  refresh(ctxFor(g, open, state));
  assert.equal(g.calls.ghAll.length, FETCH_BUDGET);
  assert.equal(g.calls.gh.length, 1, "one closed-PR list call");
  assert.match(g.calls.ghAll[0], /pulls\/12\/reviews/, "most recently updated first");
  assert.equal(state.verdicts.unscanned, 12 - FETCH_BUDGET);

  refresh(ctxFor(g, open, state, at(501)));
  refresh(ctxFor(g, open, state, at(502)));
  assert.equal(g.calls.ghAll.length, 12, "the remaining PRs, then nothing new");
  assert.equal(g.calls.gh.length, 1, "closed list is not refetched within its interval");
  assert.equal(state.verdicts.unscanned, 0);

  refresh(ctxFor(g, open, state, at(503)));
  assert.equal(g.calls.ghAll.length, 12, "reviewed heads are never refetched");

  const moved = open.map((p) => (p.number === 3 ? { ...p, head: { sha: "abcdef".repeat(6) + "abcd" } } : p));
  refresh(ctxFor(g, moved, state, at(504)));
  assert.equal(g.calls.ghAll.length, 13);
  assert.match(g.calls.ghAll[12], /pulls\/3\/reviews/, "a moved head is refetched");
});

test("an unreviewed head is rechecked only after the PR is updated", () => {
  const g = fakeGh({ 1: [] });
  const state = {};
  refresh(ctxFor(g, [pr(1, at(1))], state));
  refresh(ctxFor(g, [pr(1, at(1))], state, at(501)));
  assert.equal(g.calls.ghAll.length, 1);
  refresh(ctxFor(g, [pr(1, at(2))], state, at(502)));
  assert.equal(g.calls.ghAll.length, 2);
});

test("recently closed PRs count, are fetched once, and the list call is bounded in time", () => {
  const closed = [pr(40), pr(41)];
  const byPr = { 40: [review(sha(40), "ship", 40)], 41: [review(sha(41), "founder decision", 41)], 1: [review(sha(1), "fix first", 1)] };
  const g = fakeGh(byPr, closed);
  const state = {};
  refresh(ctxFor(g, [pr(1)], state));
  assert.deepEqual(summarize(state.verdicts).counts, { ship: 1, "fix first": 1, "founder decision": 1, unclear: 0 });
  assert.equal(state.verdicts.prs[40].x, 1);
  const before = g.calls.ghAll.length;
  refresh(ctxFor(g, [pr(1)], state, new Date(new Date(at(500)).getTime() + CLOSED_EVERY_MS).toISOString()));
  assert.equal(g.calls.gh.length, 2, "list refreshed after the interval");
  assert.equal(g.calls.ghAll.length, before, "closed PRs already cached are not refetched");
});

test("a PR that closes keeps its verdicts in the window", () => {
  const g = fakeGh({ 7: [review(sha(7), "ship", 7)] });
  const state = {};
  refresh(ctxFor(g, [pr(7)], state));
  refresh(ctxFor(g, [], state, at(501)));
  assert.equal(state.verdicts.prs[7].x, 1);
  assert.equal(summarize(state.verdicts).counts.ship, 1);
});
