// Fixture tests for the go/no-go page checker. No network. Run: node --test scripts/release/go-no-go-check.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { checkPage, loadRulingIds, parsePage, FUNCTIONS, MAX_WORDS } from "./go-no-go-check.mjs";

const SHA = "0123456789abcdef0123456789abcdef01234567";
const NOW = "2026-11-20T12:00:00Z";

// A throwaway checkout holding the files the rows cite and the three logs.
const root = mkdtempSync(join(tmpdir(), "gonogo-"));
const put = (rel, text) => { mkdirSync(dirname(join(root, rel)), { recursive: true }); writeFileSync(join(root, rel), text); };
put("docs/qa/ALPHA_GO_NO_GO.md", "# x\n");
put("docs/legal/COUNSEL_PACKET.md", "# x\n");
put("docs/agents/exec/RULINGS.md", "### CLO-3 A ruling (1 Nov 2026)\n### CCO-1 Another\n");
put("docs/agents/cto/RULINGS.md", "### CR-44 A review binds to the full sha\n");
put("docs/DECISIONS.md", "| D-107 | Merge delegation | Decided | Yes | 2026-10-15 |\n");

const row = (fn, o = {}) => {
  const d = { role: "role", source: "docs/qa/ALPHA_GO_NO_GO.md", date: "2026-11-19", mark: "verified", status: "open", ruling: "-", note: "read", ...o };
  return `| ${fn} | ${d.role} | ${d.source} | ${d.date} | ${d.mark} | ${d.status} | ${d.ruling} | ${d.note} |`;
};
const page = (over = {}, extra = "") => {
  const rows = FUNCTIONS.map((fn) => row(fn, over[fn]));
  return [
    "# Go/no-go for build 12 (testflight)", "", `Commit: ${SHA}`, "Read on: 2026-11-20 (UTC)", "Filled by: a session", "",
    "| Function | Role | Source | Date read | Mark | Status | Ruling id | Note |", "|---|---|---|---|---|---|---|---|", ...rows, "", extra,
  ].join("\n");
};
const run = (text, o = {}) => checkPage(text, { root, now: NOW, ...o }).map((e) => e.message);
const has = (msgs, frag) => msgs.some((m) => m.includes(frag));

test("a well formed page has no errors", () => {
  assert.deepEqual(run(page()), []);
});

test("the shipped template passes in template mode and fails as a filled page", () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const tpl = readFileSync(join(here, "../../docs/release/go-no-go/TEMPLATE.md"), "utf8");
  assert.deepEqual(run(tpl, { template: true }), []);
  assert.ok(run(tpl).length > 0);
});

test("every function needs exactly one row", () => {
  const missing = page().split("\n").filter((l) => !l.startsWith("| Design ")).join("\n");
  assert.ok(has(run(missing), "missing row for Design"));
  assert.ok(has(run(page({}, row("QA"))), 'function "QA" appears twice'));
  assert.ok(has(run(page({}, row("Billing"))), 'unknown function "Billing"'));
});

test("a verified row needs a source that exists and a date", () => {
  assert.ok(has(run(page({ QA: { source: "docs/qa/NOPE.md" } })), "does not exist"));
  assert.ok(has(run(page({ QA: { source: "" } })), "source is empty"));
  assert.ok(has(run(page({ QA: { date: "2026-13-40" } })), "needs the date read"));
  assert.ok(has(run(page({ QA: { date: "2026-11-21" } })), "after the page date"));
  assert.deepEqual(run(page({ QA: { source: "https://github.com/thesaurabhpareek/earlyletters/pull/815" } })), []);
  assert.ok(has(run(page({ QA: { source: "ftp://x/y" } })), "https or a repo path"));
});

test("an unverified or founder-held row cannot read pass or fail and needs a note", () => {
  assert.ok(has(run(page({ Support: { mark: "unverified", status: "pass", source: "-" } })), "cannot read pass"));
  assert.ok(has(run(page({ Finance: { mark: "founder-held", status: "fail", source: "-" } })), "cannot read fail"));
  assert.ok(has(run(page({ Support: { mark: "unverified", status: "open", note: "" } })), "needs a note"));
  assert.deepEqual(run(page({ Support: { mark: "unverified", status: "open", source: "-", date: "-", note: "no docs/support on develop" } })), []);
  assert.ok(has(run(page({ Support: { mark: "guess" } })), "Mark must be one of"));
});

test("n/a needs a reason", () => {
  assert.ok(has(run(page({ Design: { status: "n/a", note: "" } })), "n/a needs a reason"));
});

test("ruling ids must have a known shape and exist on this checkout", () => {
  assert.deepEqual(run(page({ Legal: { ruling: "CLO-3", status: "pass" } })), []);
  assert.deepEqual(run(page({ QA: { ruling: "CR-44, D-107" } })), []);
  assert.ok(has(run(page({ QA: { ruling: "CR-99" } })), "not in the rulings or decisions logs"));
  assert.ok(has(run(page({ QA: { ruling: "ruling 3" } })), "not a known shape"));
});

test("legal, compliance and finance read pass only with a ruling id from that role", () => {
  assert.ok(has(run(page({ Legal: { status: "pass" } })), "pass needs a CLO-n"));
  assert.ok(has(run(page({ Legal: { status: "pass", ruling: "CCO-1" } })), "pass needs a CLO-n"));
  assert.ok(has(run(page({ Compliance: { status: "pass" } })), "pass needs a CCO-n"));
  assert.ok(has(run(page({ Finance: { status: "pass" } })), "pass needs a CFO-n"));
  assert.deepEqual(run(page({ Legal: { status: "open" } })), []);
});

test("the commit is the full 40-character sha and the date is not in the future", () => {
  assert.ok(has(run(page().replace(SHA, SHA.slice(0, 7))), "40-character"));
  assert.ok(has(run(page().replace("2026-11-20 (UTC)", "2026-12-01 (UTC)")), "in the future"));
  assert.ok(has(run(page().replace("Commit:", "Head:")), "40-character"));
});

test("the page never holds a ship call", () => {
  for (const l of ["Decision: go", "Verdict: no-go", "**Overall:** go", "- Ship: yes"]) {
    assert.ok(has(run(page({}, l)), "ship-call line"), l);
  }
});

test("placeholders, non-ASCII and the length cap are errors on a filled page", () => {
  assert.ok(has(run(page({ QA: { note: "<note>" } })), "placeholder"));
  assert.ok(has(run(page({ QA: { note: "read \u2014 ok" } })), "non-ASCII"));
  assert.ok(has(run(page({}, "word ".repeat(MAX_WORDS))), "the cap is"));
});

test("the how-to comment is not counted and does not count as table rows", () => {
  const withComment = page().replace("# Go/no-go", "<!-- | Fake | row |\n" + "word ".repeat(2000) + "-->\n# Go/no-go");
  assert.deepEqual(run(withComment), []);
  assert.equal(parsePage(withComment).rows.filter((r) => !r.header).length, FUNCTIONS.length);
});

test("ruling ids load from the three logs, and a missing log is reported", () => {
  const { ids, missing } = loadRulingIds(root);
  assert.deepEqual([...ids].sort(), ["CCO-1", "CLO-3", "CR-44", "D-107"]);
  assert.deepEqual(missing, []);
  const empty = mkdtempSync(join(tmpdir(), "gonogo-empty-"));
  assert.equal(loadRulingIds(empty).missing.length, 3);
  assert.ok(has(run(page({ QA: { ruling: "CR-44" } }), { root: empty, rulings: undefined }), "cannot check ruling ids"));
});
