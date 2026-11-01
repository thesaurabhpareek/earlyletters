// Tests for the review gate core (HV2-001, HV2-002; REVIEW-GATE.md sections 2 and 6).
// Real fixtures keep the header line, ids and times of the comments on PRs 460, 524, 506, 504,
// 512 and 494 (pulled with gh api); every body is a neutral stub. Hostile cases are built inline.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { decide } from "./decide.mjs";

const fx = (n) => JSON.parse(readFileSync(new URL(`./fixtures/pr-${n}.json`, import.meta.url), "utf8"));
const OWNER = "thesaurabhpareek";
const HEAD = "1a2b3c4d5e".repeat(4); // a fictional 40-hex head
const OTHER = "9f8e7d6c5b".repeat(4);
const STUB = "\n\nStub body for a test.";
const T0 = Date.parse("2026-11-01T10:00:00Z");
let nextId = 1;
const at = (sec) => new Date(T0 + sec * 1000).toISOString();
const post = (header, sec, extra = {}) => ({ id: nextId++, user: { login: OWNER, type: "User" }, created_at: at(sec), updated_at: at(sec), body: header + STUB, ...extra });
const A = (sha, v = "PASS", sec = 0) => post(`## Review A at ${sha}: ${v}`, sec);
const B = (sha, v = "PASS", sec = 0) => post(`## Review B at ${sha}: ${v}`, sec);
const run = (comments, sec = 1000, extra = {}) => decide({ headSha: HEAD, comments, now: at(sec), ...extra });
const text = (r) => r.reasons.join("\n");

test("two full-sha passes, window over: success, names sha and both verdicts", () => {
  const r = run([A(HEAD, "PASS", 0), B(HEAD, "PASS WITH NOTES", 10)]);
  assert.equal(r.state, "success");
  assert.match(r.description, /A PASS, B PASS WITH NOTES on 1a2b3c4/);
  assert.match(r.description, /not approval/);
  assert.ok(r.description.length <= 140);
});

test("RG-5: pending for 180 s after the newest comment, success at 180 s", () => {
  const cs = [A(HEAD, "PASS", 0), B(HEAD, "PASS", 10)];
  assert.equal(run(cs, 11).state, "pending");
  assert.equal(run(cs, 189).state, "pending");
  assert.equal(run(cs, 190).state, "success");
  assert.equal(decide({ headSha: HEAD, comments: cs, now: at(40), pendingSeconds: 30 }).state, "success");
});

test("RG-1: missing lens fails; no comments fails", () => {
  assert.equal(run([A(HEAD)]).state, "failure");
  assert.match(text(run([A(HEAD)])), /no counted Review B/);
  assert.match(text(run([])), /no counted Review A or Review B/);
});

test("RG-3: a later FAIL cancels a pass; a later pass replaces the FAIL", () => {
  const r = run([A(HEAD, "PASS", 0), B(HEAD, "PASS", 1), B(HEAD, "FAIL", 50)]);
  assert.equal(r.state, "failure");
  assert.match(text(r), /Review B on 1a2b3c4: latest is FAIL/);
  assert.equal(run([A(HEAD, "PASS", 0), B(HEAD, "FAIL", 1), B(HEAD, "PASS", 50)]).state, "success");
});

test("RG-4: a pass on another sha does not bind to the head (new commit voids old passes)", () => {
  const r = run([A(OTHER), B(OTHER)]);
  assert.equal(r.state, "failure");
  assert.match(text(r), /history/);
});

test("RG-2: short shas never count, and are reported as short sha", () => {
  for (const len of [7, 8, 12, 39]) {
    const r = run([A(HEAD.slice(0, len)), B(HEAD.slice(0, len))]);
    assert.equal(r.state, "failure", `len ${len}`);
    assert.match(text(r), new RegExp(`short sha: Review A at ${HEAD.slice(0, len)} is ${len} characters`));
  }
});

test("RG-2: a short pass beside a full pass on the other lens still fails for the short one", () => {
  const r = run([A(HEAD), B(HEAD.slice(0, 7))]);
  assert.equal(r.state, "failure");
  assert.match(text(r), /no counted Review B/);
  assert.match(text(r), /short sha/);
});

test("RG-2: 40-hex that differs in the last character does not count", () => {
  const off = HEAD.slice(0, 39) + "c";
  const r = run([A(off), B(off)]);
  assert.equal(r.state, "failure");
  assert.doesNotMatch(text(r), /short sha/);
});

test("RG-2: upper case 40-hex head sha counts", () => {
  assert.equal(run([A(HEAD.toUpperCase()), B(HEAD.toUpperCase())]).state, "success");
});

test("a FAIL at a short sha still blocks (only passes need the full sha)", () => {
  const r = run([A(HEAD), B(HEAD), B(HEAD.slice(0, 7), "FAIL", 50)]);
  assert.equal(r.state, "failure");
  assert.match(text(r), /Review B on 1a2b3c4: latest is FAIL/);
});

test("a FAIL naming another sha is history and does not block", () => {
  assert.equal(run([A(HEAD), B(HEAD), B(OTHER, "FAIL", 50)]).state, "success");
});

test("non-pass verdict words: CHANGES, MERGE AFTER FIX, CONDITIONAL never count and block", () => {
  for (const v of ["CHANGES", "MERGE AFTER FIX", "CONDITIONAL", "UNCLEAR"]) {
    const r = run([A(HEAD), B(HEAD), B(HEAD, v, 50)]);
    assert.equal(r.state, "failure", v);
  }
});

test("FAIL with no sha blocks only if posted after the head commit", () => {
  const fail = post("## Review B: FAIL", 100);
  const base = [A(HEAD, "PASS", 0), B(HEAD, "PASS", 1), fail];
  assert.equal(run(base).state, "failure"); // no headCommittedAt: fail safe
  assert.equal(run(base, 1000, { headCommittedAt: at(50) }).state, "failure");
  assert.equal(run(base, 1000, { headCommittedAt: at(200) }).state, "success"); // posted before the head
});

test("an unreadable lens letter blocks both until both pass later", () => {
  const f = post(`## Review C at ${HEAD}: FAIL`, 50);
  const r = run([A(HEAD), B(HEAD), f]);
  assert.equal(r.state, "failure");
  assert.match(text(r), /Review A.*blocks both/);
  assert.equal(run([A(HEAD), B(HEAD), f, A(HEAD, "PASS", 60)]).state, "failure");
  assert.equal(run([A(HEAD), B(HEAD), f, A(HEAD, "PASS", 60), B(HEAD, "PASS", 61)]).state, "success");
});

test("RG-6: other logins and bots never count", () => {
  const other = (c) => ({ ...c, user: { login: "someone-else", type: "User" } });
  const bot = (c) => ({ ...c, user: { login: OWNER, type: "Bot" } });
  const app = (c) => ({ ...c, user: { login: "github-actions[bot]", type: "Bot" } });
  assert.equal(run([other(A(HEAD)), B(HEAD)]).state, "failure");
  assert.equal(run([bot(A(HEAD)), B(HEAD)]).state, "failure");
  assert.equal(run([app(A(HEAD)), B(HEAD)]).state, "failure");
  // and a non-owner FAIL cannot block (it could not be trusted either way)
  assert.equal(run([A(HEAD), B(HEAD), other(B(HEAD, "FAIL", 50))]).state, "success");
  assert.equal(decide({ headSha: HEAD, comments: [other(A(HEAD)), other(B(HEAD))], now: at(1000), owner: "someone-else" }).state, "success");
});

test("hostile: a pass copied from another PR is ignored; a FAIL copied from another PR is ignored", () => {
  const copy = post(`PR #166 at ${HEAD}: PASS`, 0);
  assert.equal(run([copy, B(HEAD)], 1000, { prNumber: 200 }).state, "failure");
  const forgedFail = post(`## Review A of #166 at ${HEAD}: FAIL`, 50);
  assert.equal(run([A(HEAD), B(HEAD), forgedFail], 1000, { prNumber: 200 }).state, "success");
});

test("hostile: stop phrases in the first 15 lines void a pass", () => {
  for (const line of ["Please do not merge this yet.", "Request changes on the second item.", "This is not mergeable."]) {
    const c = { ...A(HEAD), body: `## Review A at ${HEAD}: PASS\n\n${line}` };
    const r = run([c, B(HEAD)]);
    assert.equal(r.state, "failure", line);
  }
});

test("hostile: a pass inside a quote, a heading title with brackets, free text and PASS pending never count", () => {
  const bodies = [
    `> ## Review A at ${HEAD}: PASS`,
    `## Review A (correctness) at ${HEAD}: PASS`,
    `Review A at ${HEAD} looks fine to me, PASS`,
    `## Review A at ${HEAD}: PASS pending #306`,
    `## Review A at ${HEAD}: PASS, but not yet`,
  ];
  for (const body of bodies) {
    const r = run([{ ...A(HEAD), body: body + STUB }, B(HEAD)]);
    assert.equal(r.state, "failure", body);
  }
});

test("hostile: CRLF body counts the same as LF", () => {
  const c = { ...A(HEAD), body: `## Review A at ${HEAD}: PASS\r\n\r\nStub body.` };
  assert.equal(run([c, B(HEAD)]).state, "success");
});

test("hostile: an edited comment is a new post (updated_at orders and restarts the window)", () => {
  // B was PASS at t=0, edited to FAIL at t=900: failure.
  const b = { ...B(HEAD, "FAIL", 0), updated_at: at(900) };
  assert.equal(run([A(HEAD, "PASS", 10), b], 2000).state, "failure");
  // A FAIL at t=0 edited into a PASS at t=900 counts as a PASS posted at 900, so the window restarts.
  const a = { ...A(HEAD, "PASS", 0), updated_at: at(900) };
  assert.equal(run([a, B(HEAD, "PASS", 10)], 1000).state, "pending");
  assert.equal(run([a, B(HEAD, "PASS", 10)], 1100).state, "success");
  // An edit that lands after an earlier FAIL ranks after it.
  const f = B(HEAD, "FAIL", 100);
  const edited = { ...B(HEAD, "PASS", 0), updated_at: at(500) };
  assert.equal(run([A(HEAD), f, edited], 2000).state, "success");
});

test("input order does not matter; ties break by id", () => {
  const cs = [B(HEAD, "FAIL", 50), A(HEAD, "PASS", 0), B(HEAD, "PASS", 1)];
  assert.equal(run(cs).state, "failure");
  assert.equal(run([...cs].reverse()).state, "failure");
});

test("RG-8: bad input and thrown errors are failure, never success", () => {
  assert.equal(decide({ headSha: "abc1234", comments: [], now: at(0) }).state, "failure");
  assert.equal(decide({ headSha: HEAD, comments: null, now: at(0) }).state, "failure");
  assert.equal(decide({ headSha: HEAD, comments: [], now: "not a time" }).state, "failure");
  assert.equal(decide({ headSha: HEAD, comments: [], now: at(0), pendingSeconds: "x" }).state, "failure");
  assert.equal(decide({ headSha: HEAD, comments: [{ ...A(HEAD), updated_at: "garbage", created_at: "garbage" }], now: at(0) }).state, "failure");
  assert.equal(decide().state, "failure");
  const evil = { user: { login: OWNER }, get body() { throw new Error("boom"); }, created_at: at(0) };
  const r = decide({ headSha: HEAD, comments: [evil], now: at(1000) });
  assert.equal(r.state, "failure");
  assert.match(text(r), /RG-8/);
});

test("300 comments: pagination is the caller's job, but a long list still decides correctly", () => {
  const noise = Array.from({ length: 300 }, (_, i) => post(`chore: note ${i}`, i - 400));
  const r = run([...noise, A(HEAD, "PASS", -10), B(HEAD, "PASS", -9)], 2000);
  assert.equal(r.state, "success");
  assert.equal(run([...noise, A(HEAD, "PASS", -10)], 2000).state, "failure");
});

test("success never reads as approval and decide has no side effects", () => {
  const cs = [A(HEAD), B(HEAD)];
  const before = JSON.stringify(cs);
  const r = run(cs);
  assert.equal(JSON.stringify(cs), before);
  assert.doesNotMatch(r.description, /approved/i);
});

// ---- real comments (header lines of the originals, bodies stubbed) ----
const real = (n, nowIso, extra = {}) => {
  const f = fx(n);
  return decide({ headSha: f.headSha, comments: f.comments, now: nowIso, prNumber: n, headCommittedAt: f.headCommittedAt, ...extra });
};

test("#460: 7-char passes alone never count (short sha) before the FAILs land", () => {
  const f = fx(460);
  const early = f.comments.slice(0, 2);
  const r = decide({ headSha: f.headSha, comments: early, now: "2026-11-01T05:47:30Z", prNumber: 460 });
  assert.equal(r.state, "failure");
  assert.match(text(r), /short sha: Review B at b9d8175 is 7 characters/);
  assert.match(text(r), /short sha: Review A at b9d8175 is 7 characters/);
});

test("#460: B FAIL alone, then both FAILs, fail at merge time (05:50:41)", () => {
  const f = fx(460);
  const one = decide({ headSha: f.headSha, comments: f.comments.slice(0, 3), now: "2026-11-01T05:49:50Z", prNumber: 460 });
  assert.equal(one.state, "failure");
  const r = real(460, f.mergedAt);
  assert.equal(r.state, "failure"); // failure wins over the pending window
  assert.match(text(r), /Review A on b9d8175: latest is FAIL/);
  assert.match(text(r), /Review B on b9d8175: latest is FAIL/);
});

test("#460: if the 7-char passes had been full-sha passes, the later FAILs still decide", () => {
  const f = fx(460);
  const fullPass = f.comments.slice(0, 2).map((c) => ({ ...c, body: c.body.replace("b9d8175:", `${f.headSha}:`) }));
  assert.equal(decide({ headSha: f.headSha, comments: fullPass, now: "2026-11-01T05:52:00Z", prNumber: 460 }).state, "success"); // the #460 hole without later comments
  assert.equal(decide({ headSha: f.headSha, comments: [...fullPass, ...f.comments.slice(2)], now: "2026-11-01T05:52:00Z", prNumber: 460 }).state, "failure");
});

test("#524, #506, #504: lens A at a stale 8-char sha and no lens B fail", () => {
  for (const n of [524, 506, 504]) {
    const f = fx(n);
    const r = real(n, f.mergedAt);
    assert.equal(r.state, "failure", `#${n}`);
    assert.match(text(r), /no counted Review A or Review B/, `#${n}`);
    assert.match(text(r), /history/, `#${n}`);
  }
});

test("#512: success at merge time (07:29:32), pending in the window, failure after the late CHANGES", () => {
  const f = fx(512);
  assert.equal(f.mergedAt, "2026-11-01T07:29:32Z");
  const early = f.comments.slice(0, 2);
  assert.equal(decide({ headSha: f.headSha, comments: early, now: "2026-11-01T06:56:00Z", prNumber: 512 }).state, "pending");
  const atMerge = decide({ headSha: f.headSha, comments: early, now: f.mergedAt, prNumber: 512, headCommittedAt: f.headCommittedAt });
  assert.equal(atMerge.state, "success"); // the documented limit: the gate was green when it merged
  assert.match(atMerge.description, /A PASS, B PASS WITH NOTES on 1451475/);
  const after = real(512, "2026-11-01T07:35:00Z");
  assert.equal(after.state, "failure");
  assert.match(text(after), /Review B on 1451475: latest is CHANGES NEEDED/);
  // the late A PASS at 07:30:36 alone would only restart the window
  const lateA = decide({ headSha: f.headSha, comments: f.comments.slice(0, 3), now: "2026-11-01T07:30:50Z", prNumber: 512 });
  assert.equal(lateA.state, "pending");
});

test("#512: the edited B comment (created 06:54:49, updated 06:54:54) orders by updated_at", () => {
  const f = fx(512);
  assert.notEqual(f.comments[0].created_at, f.comments[0].updated_at);
  assert.equal(decide({ headSha: f.headSha, comments: f.comments.slice(0, 2), now: "2026-11-01T06:58:00Z", prNumber: 512 }).state, "pending");
});

test("#494: 7-char passes fail as short sha (CR-44 clause 2; the earlier design expected success)", () => {
  const r = real(494, fx(494).mergedAt);
  assert.equal(r.state, "failure");
  assert.match(text(r), /short sha: Review B at 975960c is 7 characters/);
});

test("fixtures hold no body text beyond the header line and a stub", () => {
  for (const n of [460, 524, 506, 504, 512, 494]) {
    for (const c of fx(n).comments) {
      const [header, ...rest] = c.body.split("\n");
      assert.match(header, /^## Review [AB] at [0-9a-f]{7,40}: [A-Z ]+$/, `#${n} ${c.id}`);
      assert.match(rest.join("\n").trim(), /^Fixture stub\./, `#${n} ${c.id}`);
      assert.ok(c.body.length < 200);
    }
  }
});
