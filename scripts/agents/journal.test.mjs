// readJournal (hardening.mjs): reads both ends of a long journal thread, fails closed when
// the comment count cannot be read, and says how many comments it did not read.
import test from "node:test";
import assert from "node:assert/strict";
import { readJournal } from "./hardening.mjs";

/** A fake gh that honours real per_page / page paging over `all` and counts calls. */
function fakeGh(all, { countFails = false, failPage } = {}) {
  const calls = [];
  const gh = (path) => {
    calls.push(path);
    if (/\/issues\/7$/.test(path)) return countFails ? null : { comments: all.length };
    const m = /\/issues\/7\/comments\?per_page=(\d+)&page=(\d+)/.exec(path);
    if (!m) return null;
    if (failPage && Number(m[2]) === failPage) return null;
    const per = Number(m[1]), page = Number(m[2]);
    return all.slice((page - 1) * per, page * per);
  };
  return { gh, calls };
}
const mk = (n, tag = "c") => Array.from({ length: n }, (_, i) => ({ id: `${tag}${i}`, body: `${tag}${i}` }));
const read = (all, o) => { const f = fakeGh(all, o); return { ...readJournal({ gh: f.gh, repo: "o/r", num: 7 }), calls: f.calls }; };

test("short thread: every comment is read, in order, nothing is reported missing", () => {
  const all = mk(250);
  const r = read(all);
  assert.deepEqual(r.comments.map((c) => c.id), all.map((c) => c.id));
  assert.equal(r.unreadable, false);
  assert.equal(r.notRead, 0);
});

test("a note at position 1 followed by 1,500 comments is read (first pages)", () => {
  const all = [{ id: "note", body: "founder note" }, ...mk(1500, "spam")];
  const r = read(all);
  assert.ok(r.comments.some((c) => c.id === "note"));
  assert.equal(r.total, 1501);
  assert.ok(r.calls.filter((c) => c.includes("/comments?")).length <= 10, "at most the old cap of 10 pages");
  assert.equal(r.notRead, 1501 - r.comments.length);
  assert.ok(r.notRead > 0);
});

test("a note at the end of 1,500 comments is read (last pages)", () => {
  const all = [...mk(1500, "spam"), { id: "note", body: "founder note" }];
  const r = read(all);
  assert.ok(r.comments.some((c) => c.id === "note"));
});

test("a note in the middle is NOT read, and the gap is reported with its size", () => {
  const all = [...mk(500, "a"), { id: "note", body: "middle" }, ...mk(700, "b")];
  const r = read(all);
  assert.ok(!r.comments.some((c) => c.id === "note"));
  assert.equal(r.total, 1201);
  assert.equal(r.notRead, 300);
});

test("pages are not read twice: ends that overlap are deduplicated by comment id", () => {
  const all = mk(950);
  const f = fakeGh(all);
  // Force overlapping ends: first=7, last=7 over 10 pages.
  const r = readJournal({ gh: f.gh, repo: "o/r", num: 7, first: 7, last: 7 });
  const ids = r.comments.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.length, 950);
  assert.equal(r.notRead, 0);
});

test("the count cannot be read: unreadable, no comments, never an oldest-first guess", () => {
  const f = fakeGh(mk(5), { countFails: true });
  const r = readJournal({ gh: f.gh, repo: "o/r", num: 7 });
  assert.equal(r.unreadable, true);
  assert.deepEqual(r.comments, []);
  assert.ok(!f.calls.some((c) => c.includes("/comments")), "no comment page was requested");
  for (const bad of [{ comments: "many" }, { comments: NaN }, {}, null]) {
    const r2 = readJournal({ gh: (p) => (/\/issues\/7$/.test(p) ? bad : []), repo: "o/r", num: 7 });
    assert.equal(r2.unreadable, true, JSON.stringify(bad));
  }
});

test("a failed page does not drop the pages already read; the failed page count is reported", () => {
  const all = mk(300);
  const r = read(all, { failPage: 2 });
  assert.equal(r.unreadable, false);
  assert.equal(r.failedPages, 1);
  assert.deepEqual(r.comments.map((c) => c.id), [...all.slice(0, 100), ...all.slice(200)].map((c) => c.id));
  assert.equal(r.notRead, 100);
});

test("every page failing is unreadable", () => {
  const r = readJournal({ gh: (p) => (/\/issues\/7$/.test(p) ? { comments: 250 } : null), repo: "o/r", num: 7 });
  assert.equal(r.unreadable, true);
  assert.deepEqual(r.comments, []);
});

test("the comment count is validated: only a finite non-negative integer or a digit string is accepted", () => {
  const ok = (v) => readJournal({ gh: (p) => (/\/issues\/7$/.test(p) ? { comments: v } : []), repo: "o/r", num: 7 });
  for (const bad of [null, "", false, true, [], [3], NaN, Infinity, -1, 1.5, "1.5", "-2", " 3", "3 ", "0x10", "1e2", {}, undefined]) {
    assert.equal(ok(bad).unreadable, true, JSON.stringify(bad) + String(bad));
  }
  for (const good of [0, "0", 5, "5"]) assert.equal(ok(good).unreadable, false, String(good));
});

test("zero comments is readable and empty", () => {
  const r = read([]);
  assert.equal(r.unreadable, false);
  assert.deepEqual(r.comments, []);
});

test("dedupe by comment id: a comment that shows up on two pages (comments added between calls) is kept once", () => {
  const mkc = (i) => ({ id: `c${i}`, body: `c${i}` });
  const page = { 1: Array.from({ length: 100 }, (_, i) => mkc(i)), 2: [mkc(99), ...Array.from({ length: 99 }, (_, i) => mkc(100 + i))], 3: [mkc(198), mkc(199), mkc(200)] };
  const r = readJournal({ gh: (p) => (/\/issues\/7$/.test(p) ? { comments: 250 } : page[Number(/&page=(\d+)/.exec(p)?.[1])] ?? null), repo: "o/r", num: 7 });
  const ids = r.comments.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.length, 201);
  assert.equal(r.notRead, 49);
});

test("comments without an id are never merged with each other", () => {
  const r = readJournal({ gh: (p) => (/\/issues\/7$/.test(p) ? { comments: 3 } : [{ body: "a" }, { body: "a" }, { body: "a" }]), repo: "o/r", num: 7 });
  assert.equal(r.comments.length, 3);
});
