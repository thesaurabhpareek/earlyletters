import { test } from "node:test";
import assert from "node:assert/strict";
import { openHandoffs, handoffSla, classifyAge } from "./sla.mjs";

// Fictional identities only.
const trust = { founder: "owner-asha", appClientId: "", bots: new Set(["agents[bot]"]) };
const NOW = new Date("2026-11-01T12:00:00Z");
const daysAgo = (d, extraMs = 0) => new Date(NOW - d * 86_400_000 - extraMs).toISOString();
const bot = { login: "agents[bot]", type: "Bot" };
const stranger = { login: "stranger", type: "User" };
const mk = (over = {}) => ({
  number: 1, state: "open", created_at: daysAgo(6), user: bot,
  body: "<!-- handoff from:sync to:privacy kind:request -->\nAsk", labels: [{ name: "handoff" }, { name: "to:privacy" }], ...over,
});
const reply = (at, status = "done", from = "privacy", user = bot) =>
  ({ user, created_at: at, body: `<!-- handoff-reply from:${from} status:${status} -->\nok` });

test("classification thresholds: 4 ok, 5 escalate, 13 escalate, 14 expire", () => {
  assert.deepEqual([4, 5, 13, 14].map(classifyAge), ["ok", "escalate", "escalate", "expire"]);
});

test("boundary days are measured from the issue, in whole days", () => {
  for (const [d, cls] of [[4, "ok"], [5, "escalate"], [13, "escalate"], [14, "expire"]]) {
    const [e] = openHandoffs(mk({ created_at: daysAgo(d) }), [], trust, NOW);
    assert.equal(e.ageDays, d); assert.equal(e.class, cls);
  }
  // one minute short of 5 days is still day 4
  const [e] = openHandoffs(mk({ created_at: daysAgo(5, -60_000) }), [], trust, NOW);
  assert.equal(e.class, "ok");
});

test("forged handoff from an untrusted author is ignored", () => {
  assert.deepEqual(openHandoffs(mk({ user: stranger, author_association: "NONE" }), [], trust, NOW), []);
});

test("marker not first: quoted marker in a trusted issue does not count", () => {
  assert.deepEqual(openHandoffs(mk({ body: "see\n<!-- handoff from:sync to:privacy kind:request -->" }), [], trust, NOW), []);
});

test("a trusted reply settles the recipient", () => {
  assert.deepEqual(openHandoffs(mk(), [reply(daysAgo(2))], trust, NOW), []);
});

test("forged reply from an untrusted author does not settle", () => {
  const out = openHandoffs(mk(), [reply(daysAgo(2), "done", "privacy", stranger)], trust, NOW);
  assert.equal(out.length, 1);
});

test("reply marker not first does not settle", () => {
  const c = { user: bot, created_at: daysAgo(2), body: "quote\n<!-- handoff-reply from:privacy status:done -->" };
  assert.equal(openHandoffs(mk(), [c], trust, NOW).length, 1);
});

test("a plain trusted comment (such as 'Done in #208') is not a reply", () => {
  const c = { user: { login: "owner-asha", type: "User" }, author_association: "OWNER", created_at: daysAgo(2), body: "Done in #208" };
  const [e] = openHandoffs(mk(), [c], trust, NOW);
  assert.equal(e.ageDays, 2); // the plain comment restarts the clock
});

test("another recipient's reply does not settle mine; each recipient is its own entry", () => {
  const issue = mk({ body: "<!-- handoff from:sync to:privacy,legal kind:request -->", labels: [{ name: "to:privacy" }, { name: "to:legal" }] });
  const out = openHandoffs(issue, [reply(daysAgo(2), "done", "privacy")], trust, NOW);
  assert.deepEqual(out.map((e) => e.to), ["legal"]);
});

test("a follow-up after the reply reopens and restarts the clock", () => {
  const follow = { user: bot, created_at: daysAgo(1), body: "one more thing" };
  const [e] = openHandoffs(mk(), [reply(daysAgo(3)), follow], trust, NOW);
  assert.equal(e.ageDays, 1);
});

test("closed issues and PRs are skipped; unsorted comments are ordered", () => {
  assert.deepEqual(openHandoffs(mk({ state: "closed" }), [], trust, NOW), []);
  assert.deepEqual(openHandoffs(mk({ pull_request: {} }), [], trust, NOW), []);
  const follow = { user: bot, created_at: daysAgo(3), body: "more" };
  assert.deepEqual(openHandoffs(mk(), [reply(daysAgo(2)), follow], trust, NOW), []);
});

test("handoffSla sorts oldest first and counts classes", () => {
  const r = handoffSla([
    { issue: mk({ number: 2, created_at: daysAgo(4) }), comments: [] },
    { issue: mk({ number: 3, created_at: daysAgo(14) }), comments: [] },
    { issue: mk({ number: 4, created_at: daysAgo(6) }), comments: [] },
  ], trust, NOW);
  assert.deepEqual(r.entries.map((e) => e.issue), [3, 4, 2]);
  assert.deepEqual(r.counts, { ok: 1, escalate: 1, expire: 1 });
});
