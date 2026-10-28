// Tests for pause.mjs. Fixtures only: no network, no real repository state.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { blockedReason, boardLines, olderRedTeam, pauseDate, MAX_FETCHES } from "./pause.mjs";

const OLD = "c5cfa0cfaa96a0ba97ca5f34629747ab0badf438";
const HEAD = "a83634ced2a5ecf32717bf833f941b892fc660b9";
const roster = { founder: "founder-login", trusted_bots: ["claude[bot]"] };
const paused = { handle: "support", paused_until: "2026-10-30", paused_reason: "alpha stabilisation" };
const ctxAt = (iso, env = {}) => ({ now: new Date(iso), env, roster, state: {} });

test("pause blocks task and standing work before the date", () => {
  for (const mode of ["task", "standing"]) {
    const why = blockedReason(ctxAt("2026-10-18T06:45:00Z"), paused, { mode });
    assert.match(why, /^paused until 2026-10-30 \(alpha stabilisation\)/);
  }
});

test("pause keeps maintain, review, handoff, steward-review and digest work", () => {
  for (const mode of ["maintain", "review", "handoff", "steward-review", "digest"]) {
    assert.equal(blockedReason(ctxAt("2026-10-18T06:45:00Z"), paused, { mode }), "");
  }
});

test("pause lapses on its own at 00:00 UTC on the date", () => {
  assert.notEqual(blockedReason(ctxAt("2026-10-29T23:59:59Z"), paused, { mode: "task" }), "");
  assert.equal(blockedReason(ctxAt("2026-10-30T00:00:00Z"), paused, { mode: "task" }), "");
  assert.equal(blockedReason(ctxAt("2026-11-02T09:00:00Z"), paused, { mode: "standing" }), "");
});

test("no pause field, bad date or missing work means not blocked", () => {
  const ctx = ctxAt("2026-10-18T00:00:00Z");
  assert.equal(blockedReason(ctx, { handle: "mobile" }, { mode: "task" }), "");
  assert.equal(blockedReason(ctx, { handle: "x", paused_until: "30 Oct" }, { mode: "task" }), "");
  assert.equal(blockedReason(ctx, { handle: "x", paused_until: "2026-13-40" }, { mode: "task" }), "");
  assert.equal(blockedReason(ctx, paused, undefined), "");
  assert.equal(pauseDate({ paused_until: "2026-10-30" }).toISOString(), "2026-10-30T00:00:00.000Z");
});

test("reason is optional", () => {
  const why = blockedReason(ctxAt("2026-10-18T00:00:00Z"), { handle: "x", paused_until: "2026-10-30" }, { mode: "task" });
  assert.equal(why, "paused until 2026-10-30; fixes, reviews and handoffs still run");
});

test("a founder-forced run of this agent is not blocked", () => {
  const forced = ctxAt("2026-10-18T00:00:00Z", { FORCE_TASK: "S-12", ONLY_AGENT: "qa, support" });
  assert.equal(blockedReason(forced, paused, { mode: "task" }), "");
  const other = ctxAt("2026-10-18T00:00:00Z", { FORCE_TASK: "S-12", ONLY_AGENT: "qa" });
  assert.notEqual(blockedReason(other, paused, { mode: "task" }), "");
});

test("roster pauses the four writers until 30 Oct with a reason", () => {
  const raw = JSON.parse(readFileSync(join(import.meta.dirname, "..", "..", "agents", "roster.json"), "utf8"));
  const pausedNow = raw.agents.filter((a) => a.paused_until).map((a) => a.handle).sort();
  assert.deepEqual(pausedNow, ["decision-science", "legal", "marketing", "support"]);
  for (const a of raw.agents.filter((x) => x.paused_until)) {
    assert.equal(a.paused_until, "2026-10-30");
    assert.ok(a.paused_reason && a.paused_reason.length <= 120);
    assert.ok(pauseDate(a));
  }
  assert.match(raw.$comment, /paused_until/);
});

// ---------- boardLines ----------

const founderReview = (sha, verdict, at) => ({
  user: { login: "founder-login", type: "User" }, author_association: "OWNER",
  body: `<!-- red-team:${sha} -->\nVerdict: ${verdict}\n\nDetails.`, submitted_at: at, commit_id: sha,
});
const strangerReview = (sha) => ({
  user: { login: "someone", type: "User" }, author_association: "NONE",
  body: `<!-- red-team:${sha} -->\nVerdict: ship`, submitted_at: "2026-10-17T00:00:00Z",
});
const pr = (number, sha, labels, agent = "support") => ({
  number, head: { sha }, labels: [...labels, `agent:${agent}`].map((name) => ({ name })),
});

function boardCtx({ prs, reviews = {}, current = new Set(), state = {} }) {
  const calls = [];
  return {
    calls,
    ctx: {
      state, now: new Date("2026-10-18T06:45:00Z"), env: {}, roster, repo: "o/r", openPRs: prs,
      agentOfPR: (p) => p.labels.map((l) => l.name).find((n) => n.startsWith("agent:"))?.slice(6),
      labelNames: (p) => p.labels.map((l) => l.name),
      prFacts: (p) => ({ redTeam: current.has(p.number) }),
      ghAll: (path) => { calls.push(path); return reviews[path.match(/pulls\/(\d+)/)[1]] ?? []; },
    },
  };
}

test("olderRedTeam picks the newest trusted review of another head", () => {
  const got = olderRedTeam([
    founderReview("1111111", "fix first", "2026-10-15T00:00:00Z"),
    founderReview(OLD, "fix first", "2026-10-16T00:00:00Z"),
    strangerReview("2222222"),
    founderReview(HEAD, "ship", "2026-10-17T00:00:00Z"),
  ], HEAD, { founder: "founder-login", appClientId: "", bots: new Set() });
  assert.equal(got.sha, OLD);
  assert.equal(got.verdict, "fix first");
});

test("lists a fixed PR with its stale label, without changing anything", () => {
  const prs = [pr(41, HEAD, ["review:changes-needed", "needs:founder"])];
  const { ctx, calls } = boardCtx({ prs, reviews: { 41: [founderReview(OLD, "fix first", "2026-10-16T00:00:00Z")] } });
  const lines = boardLines(ctx);
  assert.equal(lines[0], "## Awaiting re-review");
  const row = lines.find((l) => l.startsWith("- #41"));
  assert.match(row, /`support`/);
  assert.match(row, /c5cfa0c, verdict "fix first"; head is now a83634c/);
  assert.match(row, /Carries `review:changes-needed`\./);
  assert.deepEqual(calls, ["/repos/o/r/pulls/41/reviews"]);
  assert.deepEqual(prs[0].labels.map((l) => l.name), ["review:changes-needed", "needs:founder", "agent:support"]);
});

test("skips PRs reviewed on the current head, never reviewed, or not from agents", () => {
  const prs = [pr(41, HEAD, []), pr(42, "b".repeat(40), []), { number: 43, head: { sha: "c".repeat(40) }, labels: [] }];
  const { ctx, calls } = boardCtx({
    prs, current: new Set([41]),
    reviews: { 42: [strangerReview(OLD)], 43: [founderReview(OLD, "ship", "2026-10-16T00:00:00Z")] },
  });
  assert.deepEqual(boardLines(ctx), []);
  assert.deepEqual(calls, ["/repos/o/r/pulls/42/reviews"]);
});

test("caches by head: one call per PR per head across ticks", () => {
  const state = {};
  const reviews = { 41: [founderReview(OLD, "fix first", "2026-10-16T00:00:00Z")] };
  const first = boardCtx({ prs: [pr(41, HEAD, [])], reviews, state });
  boardLines(first.ctx);
  const second = boardCtx({ prs: [pr(41, HEAD, [])], reviews, state });
  assert.match(boardLines(second.ctx).join("\n"), /Carries no review label/);
  assert.equal(second.calls.length, 0);
  const moved = boardCtx({ prs: [pr(41, "d".repeat(40), [])], reviews, state });
  boardLines(moved.ctx);
  assert.equal(moved.calls.length, 1);
  assert.equal(state.drift["41"].head, "d".repeat(40));
});

test("a head recorded as the same changes as a reviewed head is not awaiting re-review", () => {
  const reviews = { 41: [founderReview(OLD, "ship", "2026-10-16T00:00:00Z")] };
  const state = { reviewfp: { 41: { sha: OLD, fp: "f", carried: { sha: HEAD, verdict: "ship", at: "2026-10-16" } } } };
  const { ctx, calls } = boardCtx({ prs: [pr(41, HEAD, ["review:red-team-ok"])], reviews, state });
  assert.deepEqual(boardLines(ctx), []);
  assert.deepEqual(calls, [], "no reviews call for a PR the red team is not re-assigned to");
  // A newer head without a match is listed again.
  const moved = boardCtx({ prs: [pr(41, "d".repeat(40), ["review:red-team-ok"])], reviews, state });
  assert.match(boardLines(moved.ctx).join("\n"), /^- #41 .*head is now ddddddd/m);
});

test("prunes cache entries for PRs that are no longer open", () => {
  const state = { drift: { 7: { head: "x", prior: null }, 41: { head: HEAD, prior: null } } };
  const { ctx } = boardCtx({ prs: [pr(41, HEAD, [])], state });
  boardLines(ctx);
  assert.deepEqual(Object.keys(state.drift), ["41"]);
});

test("bounds uncached lookups per tick and says so", () => {
  const prs = Array.from({ length: MAX_FETCHES + 3 }, (_, i) => pr(100 + i, `${i}`.padStart(40, "e"), []));
  const reviews = Object.fromEntries(prs.map((p) => [p.number, [founderReview(OLD, "fix first", "2026-10-16T00:00:00Z")]]));
  const { ctx, calls } = boardCtx({ prs, reviews });
  const lines = boardLines(ctx);
  assert.equal(calls.length, MAX_FETCHES);
  assert.ok(lines.some((l) => l.startsWith("- 3 more PR(s) not checked this tick")));
});
