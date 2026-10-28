// Tests for stale.mjs. Fixtures only: no network. RB-18 rules: 14/21/30 day
// thresholds (proposal), exemptions, dry-run only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ageDays, classify, plan, markdownTable } from "./stale.mjs";

const NOW = "2026-10-28T12:00:00Z";
const daysAgo = (d, extraMs = 0) => new Date(new Date(NOW).getTime() - d * 86_400_000 - extraMs).toISOString();
const pr = (number, days, extra = {}) => ({
  number, title: `PR ${number}`, draft: false, labels: [], user: { login: "agent" },
  base: { ref: "develop" }, head: { ref: `wip/${number}` }, created_at: daysAgo(days + 5), updated_at: daysAgo(days), ...extra,
});
const stateOf = (p, opts = {}) => classify(p, { now: NOW, openPrs: [p], ...opts }).state;

test("boundary days: 13 ok, 14 stale, 20 stale, 21 decision-needed, 29 decision-needed, 30 close-candidate", () => {
  const want = { 0: "ok", 13: "ok", 14: "stale", 20: "stale", 21: "decision-needed", 29: "decision-needed", 30: "close-candidate", 90: "close-candidate" };
  for (const [d, s] of Object.entries(want)) assert.equal(stateOf(pr(1, Number(d))), s, `day ${d}`);
});

test("a PR one second short of 14 days is still fresh; whole days are floored", () => {
  assert.equal(ageDays(pr(1, 14, { updated_at: daysAgo(14, -1000) }), NOW), 13);
  assert.equal(stateOf(pr(1, 14, { updated_at: daysAgo(14, -1000) })), "ok");
});

test("future updated_at counts as 0 days, not negative", () => {
  assert.equal(ageDays(pr(1, 0, { updated_at: daysAgo(-3) }), NOW), 0);
});

test("unreadable updated_at throws rather than silently classifying ok", () => {
  assert.throws(() => ageDays({ number: 9, updated_at: "nope" }, NOW), /unreadable/);
});

test("needs:founder and hold labels exempt, with string or object labels", () => {
  assert.equal(stateOf(pr(1, 40, { labels: [{ name: "needs:founder" }] })), "exempt");
  assert.equal(stateOf(pr(1, 40, { labels: ["hold"] })), "exempt");
  assert.equal(stateOf(pr(1, 40, { labels: [{ name: "agent:product" }] })), "close-candidate");
});

test("stacked PR is exempt while its base branch is another open PR's head", () => {
  const parent = pr(10, 5);
  const child = pr(11, 40, { base: { ref: parent.head.ref } });
  const res = classify(child, { now: NOW, openPrs: [parent, child] });
  assert.equal(res.state, "exempt");
  assert.match(res.reason, /stacked on open PR #10/);
});

test("stacked exemption ends once the base PR is no longer open", () => {
  const child = pr(11, 40, { base: { ref: "wip/10" } });
  assert.equal(classify(child, { now: NOW, openPrs: [child] }).state, "close-candidate");
});

test("a PR is never stacked on itself", () => {
  const p = pr(12, 40, { base: { ref: "wip/12" } });
  assert.equal(classify(p, { now: NOW, openPrs: [p] }).state, "close-candidate");
});

test("held list exempts #109 #110 #112 regardless of age and takes priority", () => {
  const prs = [109, 110, 112, 113].map((n) => pr(n, 45));
  const rows = plan(prs, { now: NOW, held: [109, 110, 112] });
  assert.deepEqual(rows.filter((r) => r.state === "exempt").map((r) => r.number).sort(), [109, 110, 112]);
  assert.equal(rows.find((r) => r.number === 113).state, "close-candidate");
  assert.match(rows.find((r) => r.number === 109).reason, /held list/);
});

test("drafts are classified by age like other PRs and flagged in the table", () => {
  const rows = plan([pr(1, 25, { draft: true })], { now: NOW });
  assert.equal(rows[0].state, "decision-needed");
  assert.equal(rows[0].draft, true);
  assert.match(markdownTable(rows), /\| 25 \| yes \| decision-needed/);
});

test("plan is dry-run: input is not mutated and every action is a 'would' statement", () => {
  const prs = [pr(1, 15), pr(2, 22), pr(3, 31), pr(4, 1)];
  const before = JSON.stringify(prs);
  const rows = plan(prs, { now: NOW });
  assert.equal(JSON.stringify(prs), before);
  const acts = Object.fromEntries(rows.map((r) => [r.number, r.action]));
  assert.match(acts[1], /^would add label stale/);
  assert.match(acts[2], /^would ask/);
  assert.match(acts[3], /branch kept/);
  assert.equal(acts[4], "none");
});

test("table sorts oldest first and survives pipes in titles", () => {
  const rows = plan([pr(1, 2, { title: "a | b" }), pr(2, 30)], { now: NOW });
  assert.equal(rows[0].number, 2);
  assert.ok(!/a \| b/.test(markdownTable(rows)));
});

test("RB-29: updated_at inside the 28 Oct backfill window is unknown, not ok, without a commit date", () => {
  const reset = { ...pr(7, 0), updated_at: "2026-10-28T05:39:00Z" };
  assert.equal(classify(reset, { now: "2026-10-29T00:00:00Z" }).state, "unknown");
});

test("RB-29: a real activity time overrides the reset updated_at", () => {
  const reset = { ...pr(8, 0), updated_at: "2026-10-28T05:39:00Z", last_activity_at: "2026-09-20T00:00:00Z" };
  assert.equal(classify(reset, { now: "2026-10-29T00:00:00Z" }).state, "close-candidate");
  const fresh = { ...reset, last_activity_at: "2026-10-28T20:00:00Z" };
  assert.equal(classify(fresh, { now: "2026-10-29T00:00:00Z" }).state, "ok");
});

test("RB-29: the backfill rule ends by itself once the reset has aged past the stale threshold", () => {
  const reset = { ...pr(9, 0), updated_at: "2026-10-28T05:39:00Z" };
  assert.equal(classify(reset, { now: "2026-11-11T05:39:00Z" }).state, "stale");
});
