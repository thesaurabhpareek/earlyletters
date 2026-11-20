// Fixture tests for the go/no-go page checker. No network. Run: node --test scripts/release/go-no-go-check.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { checkPage, loadRulingIds, parsePage, isShipCall, NO_SHIP_CALL_SENTENCE, FUNCTIONS, MAX_WORDS } from "./go-no-go-check.mjs";

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
  assert.deepEqual(run(page({ Legal: { ruling: "CLO-3", status: "pass", source: "docs/agents/exec/RULINGS.md#CLO-3" } })), []);
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

// Table-driven: [label, text, verdict]. Each reject case runs as prose, as a bullet, as a bare table cell
// (through isShipCall) and as the Note cell of a real page (through checkPage). Each accept case runs the same four ways.
const GUARD_CASES = [
  ["reject", "Go: yes"], ["reject", "go: YES"], ["reject", "Go: yes."], ["reject", "Decision - go"], ["reject", "Decision -- go"],
  ["reject", "Decision: go"], ["reject", "Verdict = no go"], ["reject", "Recommendation: ship"], ["reject", "We recommend shipping"],
  ["reject", "We recommend ship"], ["reject", "Recommend ship"], ["reject", "Recommend a go"], ["reject", "Ship it"], ["reject", "SHIP IT!"],
  ["reject", "Ship"], ["reject", "Go"], ["reject", "No-go"], ["reject", "NO-GO"], ["reject", "No go"], ["reject", "**Go**"],
  ["reject", "**Overall:** go"], ["reject", "Overall: no-go"], ["reject", "Result: pass"], ["reject", "Release: approved"], ["reject", "Approved"],
  ["reject", "Approve: yes"], ["reject", "Ship yes"], ["reject", "Shipping: yes"], ["reject", "release-approved"], ["reject", "My ship call is yes"],
  ["accept", "Overall: 3 of 9 devices read"], ["accept", "Result: 3 devices failed"], ["accept", "Goal reached"], ["accept", "Tango"],
  ["accept", "ingot"], ["accept", "gone"], ["accept", "Where to go: docs/qa"], ["accept", "Release: 1.2.0"], ["accept", "Release notes were read on 2026-11-19."],
  ["accept", "We recommend reading docs/qa/ALPHA_GO_NO_GO.md"], ["accept", "Build record: none"], ["accept", "Source: docs/release/go-no-go/2026-11-20-build-12.md"],
  ["accept", "The go-no-go page lists nine rows."], ["accept", "Ruling id: CLO-3"], ["accept", "Shipment tracking is out of scope"], ["accept", "Approval flow read in docs/qa"],
  ["accept", "3 devices read, 6 not read"], ["accept", NO_SHIP_CALL_SENTENCE],
];

test("ship-call guard table: at least 25 labelled cases, each in prose, bullet, table cell and a real page", () => {
  assert.ok(GUARD_CASES.length >= 25);
  assert.ok(GUARD_CASES.filter(([v]) => v === "reject").length >= 12 && GUARD_CASES.filter(([v]) => v === "accept").length >= 12);
  for (const [verdict, text] of GUARD_CASES) {
    // The template sentence is exempt only through checkPage, which strips it once; isShipCall alone sees the raw text.
    const viaFn = text === NO_SHIP_CALL_SENTENCE ? [false, false, false] : [isShipCall(text), isShipCall(`- ${text}`), isShipCall(`| a | b | ${text} |`)];
    const viaPage = [has(run(page({}, text)), "ship-call line"), has(run(page({}, `- ${text}`)), "ship-call line"), has(run(page({ QA: { note: text } })), "ship-call line")];
    for (const hit of [...viaFn, ...viaPage]) assert.equal(hit, verdict === "reject", `${verdict}: ${text}`);
  }
});

test("the exemption: the template sentence passes once, only that sentence, and removing the rule is caught", () => {
  assert.ok(NO_SHIP_CALL_SENTENCE.includes("no ship call"));
  // Without the exemption this sentence is itself a ship-call line, so the exemption does real work.
  assert.equal(isShipCall(NO_SHIP_CALL_SENTENCE), true);
  assert.deepEqual(run(page({}, NO_SHIP_CALL_SENTENCE)), []);
  // Exempt once: the second copy fails, and it fails because it is a copy, not because of other text.
  const twice = run(page({}, `${NO_SHIP_CALL_SENTENCE}\n${NO_SHIP_CALL_SENTENCE}`)).filter((m) => m.includes("ship-call line"));
  assert.equal(twice.length, 1);
  assert.ok(has(run(page({}, `${NO_SHIP_CALL_SENTENCE} Go: yes`)), "ship-call line"));
  const here = dirname(fileURLToPath(import.meta.url));
  const tpl = readFileSync(join(here, "../../docs/release/go-no-go/TEMPLATE.md"), "utf8");
  assert.ok(tpl.includes(NO_SHIP_CALL_SENTENCE), "the template carries the exempt sentence");
});

const SRC_CASES = [
  ["accept", "docs/legal/COUNSEL_PACKET.md; CLO-3", "CLO-3"],
  ["accept", "CLO-3", "CLO-3"],
  ["accept", "docs/agents/exec/RULINGS.md#CLO-3", "CLO-3"],
  ["accept", "docs/legal/COUNSEL_PACKET.md, CLO-3", "CLO-3"],
  ["reject", "docs/legal/COUNSEL_PACKET.md", "CLO-3"],
  ["reject", "docs/legal/COUNSEL_PACKET.md#CLO-33", "CLO-3"],
  ["reject", "docs/legal/COUNSEL_PACKET.md#CLO-3", "CLO-3"],
  ["reject", "docs/qa/ALPHA_GO_NO_GO.md#CLO-3", "CLO-3"],
  ["reject", "docs/legal/XCLO-3.md; docs/qa/ALPHA_GO_NO_GO.md", "CLO-3"],
  ["reject", "docs/legal/COUNSEL_PACKET.md; xCLO-3", "CLO-3"],
  ["reject", "docs/legal/COUNSEL_PACKET.md; clo-3", "CLO-3"],
  ["reject", "docs/legal/COUNSEL_PACKET.md; CLO-3x", "CLO-3"],
  ["reject", "docs/legal/CLO-3/COUNSEL_PACKET.md", "CLO-3"],
];

test("a Legal pass cites the ruling id as its own item in the Source cell: table of cases", () => {
  for (const [verdict, source, ruling] of SRC_CASES) {
    const msgs = run(page({ Legal: { status: "pass", ruling, source } }));
    const bad = has(msgs, "as its own item in the Source cell");
    assert.equal(bad, verdict === "reject", `${verdict}: ${source}`);
  }
  assert.deepEqual(run(page({ Compliance: { status: "pass", ruling: "CCO-1", source: "docs/agents/exec/RULINGS.md#CCO-1" } })), []);
  assert.ok(has(run(page({ Finance: { status: "pass", ruling: "CFO-2", source: "docs/legal/COUNSEL_PACKET.md" } })), "CFO-n"), "CFO-2 is not in the logs");
  assert.deepEqual(run(page({ Legal: { status: "open", ruling: "CLO-3" } })), [], "open needs no source cite");
});
