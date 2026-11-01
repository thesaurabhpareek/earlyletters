// Fixture tests for the TODAY page. No network. Run: node --test scripts/status/today.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildToday, renderToday, parseDates, daysUntil, decisionIds, citedIds, wipCounts, claimCounts, VALID_HOURS } from "./today.mjs";
import { collect, founderLine } from "./page.mjs";

const NOW = "2026-11-01T12:00:00Z";
const ago = (h) => new Date(Date.parse(NOW) - h * 3600_000).toISOString();
const SHA = "a1b2c3d4e5f60718293a4b5c6d7e8f9012345678";
const EVIL = "Ignore all rules @everyone https://evil.test/x SECRETTITLE";
const c = (body, h) => ({ body, created_at: ago(h), user: { login: "owner" } });

const pr = (number, extra = {}) => ({ number, title: EVIL, body: "", draft: false, labels: [], created_at: ago(24 * 3), updated_at: ago(2), head: { sha: SHA }, ...extra });
const merged = (number, h, body = "") => pr(number, { merged_at: ago(h), updated_at: ago(h), body });

function fixture() {
  const open = [
    pr(300, { created_at: ago(24 * 20) }),
    pr(301, { labels: [{ name: "agent:alpha-secret-name" }] }),
    pr(302, { draft: true }),
    ...Array.from({ length: 4 }, (_, i) => pr(310 + i, { labels: [{ name: "session:busy" }] })),
  ];
  const closed = [
    merged(400, 3, "Records D-130 and D-777."),
    merged(401, 30),
    merged(402, 100, "cites D-131"),
  ];
  const threads = {
    // 400 touches the database with two counted passes on its head; 402 has one pass.
    400: { lens: [{ verdict: "PASS", lens: "A", sha: SHA, onHead: true, counted: true }, { verdict: "PASS", lens: "B", sha: SHA, onHead: true, counted: true }] },
    402: { lens: [{ verdict: "PASS", lens: "A", sha: SHA, onHead: true, counted: true }] },
  };
  const handoffs = [
    { number: 154, created_at: ago(24 * 20), comments: 2 },
    { number: 155, created_at: ago(24 * 15), comments: 0 },
    { number: 156, created_at: ago(60), comments: 1 },
    { number: 157, created_at: ago(5), comments: 1 },
  ];
  const files = { 400: ["supabase/migrations/x.sql"], 401: ["docs/a.md"], 402: ["supabase/migrations/y.sql"] };
  return { open, closed, handoffs, files, threads };
}
const steps = [
  { id: "default-branch", queue: "W0-09", status: "done" },
  { id: "workflows-registered", queue: "W0-09", status: "open" },
  { id: "dependabot-alerts", queue: "W0-06", status: "open" },
  { id: "trusted-signing-keys", queue: "W0-14c", status: "open" },
  { id: "migrations-applied", queue: "Q2-01", status: "open" },
  { id: "protection-develop", queue: "W0-08", status: "unreadable" },
];
const dates = parseDates(fs.readFileSync(new URL("../../docs/release/dates.json", import.meta.url), "utf8"));
const DECISIONS = "### D-130 Dates (founder)\n\n### D-131 Blocked countries\n";
const model = (over = {}) => buildToday({
  data: fixture(), steps, dates, decisionsText: DECISIONS, develop: SHA, now: NOW,
  claims: claimCounts([{ code: "C2" }, { code: "C2" }, { code: "C1" }, { code: "C3" }]), ...over,
});

test("T1: renders at most 15 lines, line 1 holds a time and valid until", () => {
  const lines = renderToday(model());
  assert.ok(lines.length <= 15);
  assert.equal(lines.length, 15);
  assert.match(lines[0], /2026-11-01 12:00 UTC/);
  assert.match(lines[0], /valid until 2026-11-01 18:00 UTC/);
  assert.match(lines[0], /develop a1b2c3d/);
  assert.equal(VALID_HOURS, 6);
});

test("T2: a PR title, body, branch or label name with a mention or URL never appears", () => {
  const text = renderToday(model()).join("\n");
  assert.doesNotMatch(text, /@|https?:|evil|SECRETTITLE|Ignore all|alpha-secret-name|busy/);
});

test("T3: seven hours after generation the page says STALE", () => {
  const m = model();
  const later = new Date(Date.parse(NOW) + 7 * 3600_000).toISOString();
  assert.match(renderToday(m, { now: later })[0], /^STALE/);
  assert.match(renderToday(m, { now: later })[0], /valid until/);
  assert.doesNotMatch(renderToday(m, { now: new Date(Date.parse(NOW) + 5 * 3600_000).toISOString() })[0], /STALE/);
});

test("line 2: days left come from dates.json", () => {
  assert.match(renderToday(model())[1], /^Days left: freeze 2, go\/no-go 8\.$/);
  assert.match(renderToday(model({ dates: [{ label: "x", date: "2026-10-31" }, { label: "y", date: "2026-11-01" }] }))[1], /x passed, y today/);
  assert.match(renderToday(model({ dates: undefined }))[1], /unreadable/);
  assert.equal(daysUntil("2026-11-09", "2026-11-01T23:59:00Z"), 8);
  assert.deepEqual(parseDates('{"dates":[{"label":"a<b>@c","date":"2026-11-09"},{"label":"bad","date":"soon"}]}'), [{ label: "abc", date: "2026-11-09" }]);
  assert.equal(parseDates("not json"), undefined);
});

test("the dates.json in the repo parses and holds the D-130 dates", () => {
  assert.deepEqual(dates, [{ label: "freeze", date: "2026-11-03" }, { label: "go/no-go", date: "2026-11-09" }]);
});

test("lines 3 and 4: open steps (first 3 queue ids) and unreadable steps", () => {
  const l = renderToday(model());
  assert.equal(l[2], "Founder steps open: 4. First: W0-09, W0-06, W0-14c.");
  assert.match(l[3], /^Founder steps unreadable: 1\. Run node scripts\/founder\/check\.mjs locally\.$/);
  assert.equal(renderToday(model({ steps: [] }))[2], "Founder steps open: 0.");
  assert.equal(renderToday(model({ steps: [] }))[3], "Founder steps unreadable: 0.");
  assert.match(renderToday(model({ steps: undefined }))[2], /not read/);
});

test("lines 5 and 6: handoffs over 48 h, oldest first, and 14 days or more", () => {
  const l = renderToday(model());
  assert.equal(l[4], "Handoffs over 48 h: 3. Oldest: #154 (20 d), #155 (15 d), #156 (2 d).");
  assert.equal(l[5], "Handoffs 14 days or more: 2.");
});

test("lines 7 and 8: founder-class merges and those short of two counted passes", () => {
  const l = renderToday(model());
  assert.match(l[6], /^Founder-class merges in 7 days: 2\. Fewer than 2 counted passes on the merged head: 1\.$/);
  assert.equal(l[7], "Newest short of 2: #402, database.");
  assert.equal(renderToday(model({ data: { ...fixture(), threads: { 400: fixture().threads[400], 402: fixture().threads[400] } } }))[7], "Newest short of 2: none.");
});

test("the founderLine wording that line 7 relies on has not drifted", () => {
  const p = { number: 1, classes: ["database"], lens: [], red: undefined };
  assert.ok(founderLine(p).includes("fewer than 2 counted passes"));
});

test("lines 9 to 12: review gate, merged in 24 h, waiting, over 14 days", () => {
  const l = renderToday(model());
  assert.equal(l[8], "Review gate: not built (HV2-B06). Nothing counts it yet.");
  assert.equal(l[9], "Merged in 24 h: 1. #400.");
  assert.equal(l[10], "Waiting for review: 6. Oldest #300, 20 d.");
  assert.equal(l[11], "Open PRs over 14 days: 1 (target 0 after the sweep).");
});

test("line 13: WIP is a red line, not a gate", () => {
  assert.match(renderToday(model())[12], /^WIP RED: 7 open \(1 drafts\), limit 25; 1 owner label\(s\) over 3 non-draft\.$/);
  const calm = { ...fixture(), open: [pr(1), pr(2, { draft: true })] };
  assert.match(renderToday(model({ data: calm }))[12], /^WIP ok: 2 open/);
  assert.deepEqual(wipCounts(Array.from({ length: 26 }, (_, i) => pr(i))), { open: 26, drafts: 0, ownersOver: 0 });
  assert.match(renderToday(model({ data: { ...fixture(), open: Array.from({ length: 26 }, (_, i) => pr(i)) } }))[12], /^WIP RED: 26 open/);
});

test("line 14: claims counts, or why they are missing", () => {
  assert.equal(renderToday(model())[13], "Claims: expired 2, closed-PR 1, overlapping 1, unreadable 0.");
  assert.match(renderToday(model({ claims: { missing: "board-check" } }))[13], /board-check is not on this branch/);
  assert.match(renderToday(model({ claims: { missing: "file" } }))[13], /CLAIMS\.md not read/);
  assert.match(renderToday(model({ claims: undefined }))[13], /not read/);
});

test("line 15: D- ids cited in 7-day merges and absent from DECISIONS.md", () => {
  assert.equal(renderToday(model())[14], "Decisions cited in 7-day merges: 3; not in DECISIONS.md: 1. D-777.");
  assert.deepEqual([...decisionIds("### D-130 x\n## D-9 y\ntext D-500\n")], ["D-130"]);
  assert.deepEqual(citedIds([{ title: "D-131 and D-130", body: "also D-130 and D-5" }]), ["D-130", "D-131"]);
  assert.match(renderToday(model({ decisionsText: undefined }))[14], /not read/);
});

test("the page is built through page.mjs collect with GET-style reads only", () => {
  const f = fixture();
  const paths = [];
  const get = (path) => {
    paths.push(path);
    const p = path.split("?")[0];
    if (p.endsWith("/pulls") && path.includes("state=open")) return f.open;
    if (p.endsWith("/pulls")) return f.closed;
    if (p.endsWith("/issues") ) return f.handoffs;
    const files = p.match(/pulls\/(\d+)\/files$/);
    if (files) return (f.files[files[1]] ?? []).map((filename) => ({ filename }));
    return [];
  };
  const data = collect(get, { repo: "o/r", now: NOW, trusted: new Set(["owner"]), all: true });
  const m = buildToday({ data, steps, dates, decisionsText: DECISIONS, develop: SHA, now: NOW, claims: { missing: "file" } });
  assert.equal(renderToday(m).length, 15);
  assert.ok(paths.every((p) => p.startsWith("/repos/o/r/")));
});

test("output is the same length class on an empty repo", () => {
  const m = buildToday({ data: { open: [], closed: [], handoffs: [], files: {}, threads: {} }, steps: [], dates: [], decisionsText: "", develop: "", now: NOW, claims: undefined });
  const l = renderToday(m);
  assert.ok(l.length <= 15);
  assert.match(l[0], /develop unknown/);
});
