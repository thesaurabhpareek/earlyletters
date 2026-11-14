// Tests for charter-lint.mjs. Fixtures only: temp folders, no network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { lintCharter, lintCharters, decisionRows, missingScriptCitations, BASELINE } from "./charter-lint.mjs";

const DECISIONS = [
  "| ID | Decision | Status | Proceed? | Date |",
  "|---|---|---|---|---|",
  "| D-082 | Plus membership: first 2 letters free, then Plus at the founder's finalised prices | Decided (founder) | Yes | 2026-10-04 |",
  "| D-100 | Server features are on in v1.0: sign-in, sync, co-parent sharing, encrypted recording backup, status report and reminder emails | Decided | Yes | 2026-10-13 |",
].join("\n");

const GOOD = [
  "---",
  "name: payments",
  "description: Payments engineer. Apple-only subscriptions with StoreKit 2.",
  "model: inherit",
  "---",
  "## You read first",
  "- `docs/DECISIONS.md`, newest first. Prices and plans: D-082 and D-103.",
].join("\n");

const rules = (found) => found.map((f) => f.rule).sort();

function repo(files) {
  const dir = mkdtempSync(join(tmpdir(), "charter-lint-"));
  for (const [p, t] of Object.entries(files)) {
    mkdirSync(join(dir, p, ".."), { recursive: true });
    writeFileSync(join(dir, p), t);
  }
  return dir;
}

test("a charter that cites D-ids and DECISIONS.md passes", () => {
  assert.deepEqual(lintCharter(GOOD, DECISIONS), []);
});

test("a stale price fails (the payments charter case from retro panel 02 finding 3)", () => {
  const stale = `${GOOD}\n- Prices: $3.99 a month with a 1-month free trial, $29.99 a year.`;
  const found = lintCharter(stale, DECISIONS);
  assert.ok(found.some((f) => f.rule === "price" && f.line === 8));
  assert.ok(lintCharter(`${GOOD}\n- Plus costs 4.99 a month.`, DECISIONS).some((f) => f.rule === "price"));
});

test("dates fail in every common shape", () => {
  for (const d of ["the founder decision of 3 Oct overrides", "decided Oct 3, 2026", "since 2026-10-03"]) {
    assert.deepEqual(rules(lintCharter(`${GOOD}\n- ${d}.`, DECISIONS)), ["date"], d);
  }
  // Numbers that are not dates pass.
  assert.deepEqual(lintCharter(`${GOOD}\n- 44 pt targets, p95 200 ms, CI under 10 minutes.`, DECISIONS), []);
});

test("copying eight words of a decision fails and names the D-id", () => {
  const copied = `${GOOD}\n- Server features are on in v1.0: sign-in, sync, co-parent sharing.`;
  const found = lintCharter(copied, DECISIONS);
  assert.equal(found.length, 1);
  assert.equal(found[0].rule, "decision-text");
  assert.match(found[0].why, /D-100/);
  // Seven words is a pointer, not a copy.
  assert.deepEqual(lintCharter(`${GOOD}\n- Server features are on in v1.0 (D-100).`, DECISIONS), []);
});

test("retired sources fail: the latest BRIEF, BRIEF decision N, approve-migration", () => {
  assert.deepEqual(rules(lintCharter(`${GOOD}\n- The latest \`docs/agents/BRIEF-*.md\`, decision 3.`, DECISIONS)), ["retired"]);
  assert.deepEqual(rules(lintCharter(`${GOOD}\n- Analytics is opt-in (BRIEF decision 12).`, DECISIONS)), ["retired"]);
  assert.deepEqual(rules(lintCharter(`${GOOD}\n- Needs the founder's \`approve-migration\` label.`, DECISIONS)), ["retired"]);
});

test("a charter that never names docs/DECISIONS.md fails", () => {
  assert.deepEqual(rules(lintCharter("---\nname: x\ndescription: d\n---\nBody.", DECISIONS)), ["cite"]);
});

test("frontmatter: only the description is linted", () => {
  const fm = "---\nname: x\ndescription: Plus at $4.99.\nmodel: inherit\n---\n`docs/DECISIONS.md`";
  assert.deepEqual(rules(lintCharter(fm, DECISIONS)), ["price"]);
});

test("decision index rows parse, including ranges", () => {
  const rows = decisionRows(`${DECISIONS}\n| D-006 to D-014 | Earlier decisions | Decided | Yes |`);
  assert.deepEqual(rows.map((r) => r.id), ["D-082", "D-100", "D-006 to D-014"]);
});

test("lintCharters: errors outside the baseline, warnings inside it, and a passing baseline entry is reported", () => {
  const dir = repo({
    "docs/DECISIONS.md": DECISIONS,
    ".claude/agents/payments.md": `${GOOD}\n- $3.99 a month.`,
    ".claude/agents/legacy.md": "---\nname: legacy\ndescription: d\n---\n$29.99 a year",
    ".claude/agents/fixed.md": GOOD,
  });
  const baseline = { ".claude/agents/legacy.md": "open PR #1", ".claude/agents/fixed.md": "was stale" };
  const { errors, warnings } = lintCharters(dir, { baseline });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /payments\.md:8: charter-lint price/);
  assert.ok(warnings.some((w) => /legacy\.md:5: charter-lint price.*baselined: open PR #1/.test(w)));
  assert.ok(warnings.some((w) => /fixed\.md: passes charter-lint; remove it from BASELINE/.test(w)));
});

test("lintCharters: works without DECISIONS.md or a charters folder", () => {
  assert.deepEqual(lintCharters(repo({ "x.md": "" }), { baseline: {} }), { errors: [], warnings: [] });
  const { errors } = lintCharters(repo({ ".claude/agents/a.md": GOOD }), { baseline: {} });
  assert.deepEqual(errors, []);
});

test("BASELINE keys are charter paths with a reason", () => {
  for (const [k, v] of Object.entries(BASELINE)) {
    assert.match(k, /^\.claude\/agents\/[a-z0-9-]+\.md$/);
    assert.ok(typeof v === "string" && v.length > 5);
  }
});

test("missingScriptCitations: a harness doc citing a missing script fails; existing and (planned) pass", () => {
  const dir = repo({
    "scripts/agents/dispatch.mjs": "",
    "docs/agents/HARNESS.md": [
      "Run `node scripts/agents/dispatch.mjs`.",
      "Then `scripts/agents/gates.mjs` checks the diff.",
      "Later: `scripts/agents/freeze.mjs` (planned).",
      "Tests: `node --test scripts/agents/*.test.mjs`.",
    ].join("\n"),
    ".claude/agents/qa.md": "See scripts/agents/ghost.mjs",
    "agents/qa/MEMORY.md": "scripts/agents/dispatch.mjs",
    "docs/other/README.md": "scripts/agents/elsewhere.mjs is out of scope",
  });
  const errs = missingScriptCitations(dir);
  assert.equal(errs.length, 2);
  assert.match(errs.find((e) => e.includes("HARNESS")), /docs\/agents\/HARNESS\.md:2: cites scripts\/agents\/gates\.mjs/);
  assert.ok(errs.some((e) => /\.claude\/agents\/qa\.md:1: cites scripts\/agents\/ghost\.mjs/.test(e)));
});
