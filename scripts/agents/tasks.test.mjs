// One task source tests (harness package H6). Run: node --test scripts/agents/tasks.test.mjs
// Fixtures are excerpts copied from develop at 6bfb94a9: docs/BACKLOG.md lines
// 127 to 128, 491 to 495 and 676 to 679; docs/prd/v2/features/F16-sync.md
// lines 418 to 422 and the WP-F16-13 row; F14-plus.md lines 530 to 534;
// F06-faithful-edit.md lines 483 to 485. The merged PR is #121 (title, merge
// time and one body sentence; no author). Nothing here touches the network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eligibility } from "./lib.mjs";
import {
  backlogTasks, workPackageTasks, wpStatus, normMode, splitRow, parseDecisions, clauseCloses,
  staleFlags, looksReady, loadTasks, dispatchView, takenTaskIds,
} from "./tasks.mjs";

const BACKLOG = [
  "# Backlog (v1.0)",
  "",
  "## Plus and billing",
  "",
  "#### BL-342 Plan reminders on the device, the trial timeline and \"Save a copy\" (new; FUTURE G-12 pulled into v1.0) [Critical]",
  "- Status: ready. Mode: agent. Owner: payments engineer (`src/lib/billing`), reminders owner. Size: S (about 2 to 3 engineer-days, Q-003 memo).",
  "- Why v1.0: Subscription Terms 1.4.0 (\"Receipts and reminders\") and in-app disclosures 1.4.0 now promise that the app reminds before a trial ends, before an annual renewal and once a year, and shows what was agreed right after subscribing with a button to save a copy. Without this task those sentences are false at launch. Legal-alignment's position memo (`docs/legal/memos/q-003-subscription-notices.md`) is the default unless counsel objects by Fri 23 Oct (FT-33).",
  "- Satisfies: LEGAL-REQ-046 to -049 as amended by legal-alignment; D-022 windows (kept as data); replaces BL-212 and BL-218.",
  "- Scope: on phones where the subscription is `purchased` (not `familyShared`), schedule local notifications and an in-app card at the D-022 targets from `currentEntitlements` expiration, `RenewalInfo.willAutoRenew` and the introductory-offer type; recompute on every launch and every `Transaction.updates` event; cancel when auto-renew is off; a trial timeline in the store view's marketing content; after purchase, a confirmation sheet with the renewal terms, cancel-by date and how to cancel, and \"Save a copy\" through the share sheet (nothing leaves the phone). Pure planner with tests (leap day, 31-day months, DST, trials of 31 and 32 days, cancel after scheduling). Copy in `packages/content`. Device check in FT-39.",
  "",
  "## Release engineering",
  "",
  "#### BL-440 Store description matches the on-device v1.0 [Critical] (new, D-089)",
  "- Status: ready. Mode: agent. Owner: content.",
  "- Scope: `packages/content/src/store.en.ts`: the description says \"Invite your co-parent to the same book. You each sign your own letters\" and \"Only you and the people you invite can read your book\", and `whatsNewV1` says \"write together with your co-parent\". v1.0 shows co-parent sharing as coming soon (PR #54). Say what v1.0 does; regenerate `docs/store/app-store.md` and `apps/mobile/store.config.json`.",
  "- Done when: a content rules case rejects invite and write-together promises in `storeListing` while server features are off for v1.0; nothing is pushed to App Store Connect before this lands (guideline 2.3.1).",
  "",
  "#### BL-005 Founder setup for the workflow",
  "- Status: needs-founder (FT-20). CI exists (BL-004). Remaining: branch protection on `develop` and `main` requiring the `required` job; labels `inbox`, `bug`, `idea`, `beta`, `S0` to `S3`, `approve-migration`; accept ADR 0011.",
].join("\n");

const F16 = [
  "## 12. Work packages",
  "",
  "| WP | Scope | Stream | Owns files or folders | Depends on | Done when | Mode | Status 13 Oct | Device |",
  "|---|---|---|---|---|---|---|---|---|",
  "| WP-F16-00 | Watermark proof on a real project | S02 with S03 | `experiments/sync-watermark/` | Staging project | Two-connection test on staging proves no skipped row; findings in PR; `[DATA-REQ-005]` | Pair. BL-173 | Partly built: watermark in SQL, PGlite tests green | none |",
  "| WP-F16-01 | Move the sync contract into `packages/api` | S07 | `packages/api/src/sync.ts` (new), its test | Sync ADR | Type tests; the app imports the contract from `packages/api`; `[F16-REQ-028]` | Agent | Not built | none |",
  "| WP-F16-02 | `book_access` table | none | n/a | n/a | n/a | n/a | Removed from v1.0 (D-055; R2 AR-03) | none |",
  "| WP-F16-13 | Erase op for a synced letter (D-085) | S02 server, S03 client | `store.ts` `eraseEntry` sync branch, `lib/sync/outbox.ts`, new migration | WP-F16-06 | `[F16-REQ-024]`; `[LEGAL-REQ-032]`; `[F16-REQ-084]` | Agent, `approve-migration` | Not built | none |",
  "",
  "After the table.",
  "",
].join("\n");

const F14 = [
  "| WP | Scope | Owner | Owns files or folders | Depends on | Done when | Mode |",
  "|---|---|---|---|---|---|---|",
  "| WP-F14-01 | `expo-iap` spike | | | | Superseded: `expo-iap` removed (a66376a); `scribe-store` instead (BL-210) | Done |",
  "| WP-F14-02 | Reminder planner, pure | Payments engineer | New `packages/core/src/plan-notices.ts` and test | none | `[PRD-REQ-003]` synthetic year; `[C-REQ-025]`, `[C-REQ-026]`; `[F14-REQ-044]` | Agent. BL-342 |",
  "| WP-F14-03 | Drop store tables and server Plus checks | Data architect | `supabase/migrations/20261004000000_plus_on_device_only.sql` | none | `[F14-REQ-012]`; applied in staging (FT-10) | Built; human apply |",
  "",
].join("\n");

const F06 = [
  "| WP | Scope | Owner | BL | Owns files or folders | Depends on | Done when (tests that must pass) | Mode | Status 13 Oct | Device |",
  "|---|---|---|---|---|---|---|---|---|---|",
  "| WP-F06-01 | Spike: R-01 fixtures and the 4,000-word timing fixture under Hermes on an SE 3; Unicode property escapes in Hermes | Speech engineer | BL-120 | `docs/qa/evidence/` (session file) | BL-030 dev build | Verdicts for every R-01 fixture equal Node byte for byte, or each difference is listed with its construct; timings recorded | pair (speech engineer, QA engineer) | Not run | S1-18 transcription spot check plus this fixture run (SE 3) |",
  "",
].join("\n");

// PR #121, merged into develop 2026-10-15T06:57:04Z. Body: the third line of
// its description, which is the only place it names BL-342.
const PR_121 = {
  number: 121,
  merged_at: "2026-10-15T06:57:04Z",
  title: "feat(mobile): plan reminders and the purchase confirmation with Save a copy, as a courtesy (G-15)",
  head: { ref: "unverified-branch-name" },
  body: "Implements decision 2 of 15 Oct 2026 (delegated by the founder; recorded in the decisions PR): **plan reminders and the \"Save a copy\" purchase confirmation ship in v1.0.** Ported from `auto/2026-10-05-fixes` (gap **G-15**, Q-003 memo sections 3 and 5, LEGAL-REQ-047, BL-342), adapted to `develop`'s D-082/D-083 membership engine.",
};

const allTasks = () => [
  ...backlogTasks(BACKLOG),
  ...workPackageTasks(F16, "docs/prd/v2/features/F16-sync.md").tasks,
  ...workPackageTasks(F14, "docs/prd/v2/features/F14-plus.md").tasks,
  ...workPackageTasks(F06, "docs/prd/v2/features/F06-faithful-edit.md").tasks,
];
const byId = (list, id) => list.find((t) => t.id === id);

test("backlog rows keep lib.mjs parsing and gain source, line and Done when", () => {
  const bl = backlogTasks(BACKLOG);
  assert.deepEqual(bl.map((t) => t.id), ["BL-342", "BL-440", "BL-005"]);
  const t342 = byId(bl, "BL-342");
  assert.equal(t342.source, "backlog");
  assert.equal(t342.status, "ready");
  assert.equal(t342.mode, "agent");
  assert.deepEqual(t342.owners, ["payments engineer", "reminders owner"]);
  assert.equal(t342.doneWhen, "");
  assert.match(byId(bl, "BL-440").doneWhen, /^a content rules case rejects invite/);
  assert.equal(byId(bl, "BL-005").status, "needs-founder");
});

test("WP rows parse from a real F16 excerpt by column name", () => {
  const { tasks, skipped } = workPackageTasks(F16, "docs/prd/v2/features/F16-sync.md");
  assert.deepEqual(skipped, []);
  assert.deepEqual(tasks.map((t) => t.id), ["WP-F16-00", "WP-F16-01", "WP-F16-02", "WP-F16-13"]);
  const w00 = byId(tasks, "WP-F16-00");
  assert.equal(w00.source, "prd-v2");
  assert.equal(w00.line, 5);
  assert.equal(w00.title, "Watermark proof on a real project");
  assert.equal(w00.status, "partly-built");
  assert.equal(w00.mode, "pair");
  assert.deepEqual(w00.links, ["BL-173"]);
  assert.deepEqual(w00.owners, ["s02 with s03"]);
  assert.match(w00.doneWhen, /^Two-connection test on staging/);
  const w01 = byId(tasks, "WP-F16-01");
  assert.equal(w01.status, "not-built");
  assert.equal(w01.mode, "agent");
  assert.equal(looksReady(w01), true);
  assert.equal(byId(tasks, "WP-F16-02").status, "removed");
  assert.deepEqual(byId(tasks, "WP-F16-13").dependsOn, ["WP-F16-06"]);
});

test("tables without a Status column (F14) and with a BL column (F06) parse", () => {
  const f14 = workPackageTasks(F14, "F14.md").tasks;
  assert.equal(byId(f14, "WP-F14-01").status, "built"); // Mode cell "Done"
  assert.equal(byId(f14, "WP-F14-02").status, "unknown"); // Mode "Agent. BL-342": no status to read
  assert.deepEqual(byId(f14, "WP-F14-02").links, ["BL-342"]);
  assert.equal(byId(f14, "WP-F14-03").status, "built"); // "Built; human apply"
  const f06 = workPackageTasks(F06, "F06.md").tasks;
  assert.deepEqual(f06.map((t) => t.id), ["WP-F06-01"]);
  assert.deepEqual(f06[0].links, ["BL-120"]);
  assert.equal(f06[0].status, "not-run");
  assert.equal(f06[0].mode, "pair");
});

test("parsing survives the edits open PR #239 makes: new status wording, added and reordered columns", () => {
  const edited = F16
    .replace("| Not built | none |", "| Built (checked 27 Oct, develop 1c6795b): `packages/api/src/server/sync.ts` | none |")
    .replace("| WP | Scope | Stream |", "| WP | Stream | Scope |")
    .replace(/\| WP-F16-(\d\d) \| ([^|]*) \| ([^|]*) \|/g, "| WP-F16-$1 | $3 | $2 |")
    .replace("| Device |", "| Device | Notes |")
    .replace("| Status 13 Oct |", "| Status 27 Oct |");
  const { tasks } = workPackageTasks(edited, "F16.md");
  assert.equal(tasks.length, 4);
  assert.equal(byId(tasks, "WP-F16-00").title, "Watermark proof on a real project");
  assert.equal(byId(tasks, "WP-F16-01").status, "built");
  assert.equal(byId(tasks, "WP-F16-13").status, "not-built");
});

test("non-WP tables and junk rows are ignored or reported, never thrown", () => {
  const text = "| ID | P | Requirement |\n|---|---|---|\n| F16-REQ-001 | P0 | x |\n\n| WP | Scope |\n|---|---|\n| not an id | x |\n| WP-F99-1 | ok |\n";
  const { tasks, skipped } = workPackageTasks(text, "F99.md");
  assert.deepEqual(tasks.map((t) => t.id), ["WP-F99-1"]);
  assert.equal(tasks[0].status, "unknown");
  assert.equal(tasks[0].mode, "unknown");
  assert.equal(skipped.length, 1);
  assert.deepEqual(workPackageTasks("", "empty.md"), { tasks: [], skipped: [] });
  assert.deepEqual(splitRow("| a | b \\| c | d |"), ["a", "b \\| c", "d"]);
});

test("status and mode words normalise", () => {
  assert.equal(wpStatus("Partly built: rejected writes stored; no screen"), "partly-built");
  assert.equal(wpStatus("Built in code, device or deploy checks open"), "built");
  assert.equal(wpStatus("Not run; 08 Q8"), "not-run");
  assert.equal(wpStatus("Partly done: library chosen"), "partly-built");
  assert.equal(wpStatus("Partly"), "partly-built");
  assert.equal(wpStatus("Superseded: x"), "superseded");
  assert.equal(wpStatus("something new"), "unknown");
  assert.equal(normMode("Agent plus human. BL-177"), "pair");
  assert.equal(normMode("agent (mobile engineer)"), "agent");
  assert.equal(normMode("Agent, `approve-migration`"), "agent");
  assert.equal(normMode("n/a"), "unknown");
});

test("BL-342, shipped via #121, is flagged strong from the body sentence that ports it", () => {
  const tasks = allTasks();
  const flags = staleFlags(tasks, { mergedPRs: [PR_121], decisions: [] });
  const f = flags.filter((x) => x.id === "BL-342");
  assert.equal(f.length, 1);
  assert.equal(f[0].kind, "merged-pr");
  assert.equal(f[0].strength, "strong");
  assert.match(f[0].evidence, /^#121 merged 2026-10-15/);
  // Without the merged PR, BL-342 is not flagged.
  assert.equal(staleFlags(tasks, { mergedPRs: [], decisions: [] }).some((x) => x.id === "BL-342"), false);
  // An unmerged PR never flags.
  assert.equal(staleFlags(tasks, { mergedPRs: [{ ...PR_121, merged_at: null }] }).some((x) => x.id === "BL-342"), false);
});

test("a body mention without a delivery verb is weak; a title or branch id is strong; a range is weak", () => {
  const tasks = allTasks();
  const pr = (o) => ({ number: 9, merged_at: "2026-10-20T00:00:00Z", title: "x", body: "", head: { ref: "docs/x" }, ...o });
  const weak = staleFlags(tasks, { mergedPRs: [pr({ body: "Related: BL-342 stays on the device plan" })] });
  assert.equal(weak.find((f) => f.id === "BL-342").strength, "weak");
  const title = staleFlags(tasks, { mergedPRs: [pr({ title: "WP-F16-01: sync contract in packages/api" })] });
  assert.equal(title.find((f) => f.id === "WP-F16-01").strength, "strong");
  const branch = staleFlags(tasks, { mergedPRs: [pr({ head: { ref: "feat/billing-bl-342-reminders" } })] });
  assert.equal(branch.find((f) => f.id === "BL-342").strength, "strong");
  const range = staleFlags(tasks, { mergedPRs: [pr({ title: "docs(backlog): new tasks BL-340 to BL-342" })] });
  assert.equal(range.find((f) => f.id === "BL-342").strength, "weak");
});

test("BL-440 is flagged by its reversed premise (D-100); closed and non-agent tasks are never flagged", () => {
  const flags = staleFlags(allTasks(), { mergedPRs: [PR_121] });
  const f440 = flags.filter((x) => x.id === "BL-440");
  assert.equal(f440.length, 1);
  assert.equal(f440[0].kind, "reversed-premise");
  assert.match(f440[0].evidence, /reversed by D-100/);
  for (const id of ["BL-005", "WP-F16-02", "WP-F14-01", "WP-F16-00"]) {
    assert.equal(flags.some((x) => x.id === id), false, id);
  }
});

test("a decision flags only when a closing word shares the clause with the id", () => {
  const decisions = parseDecisions([
    "| D-900 | BL-342 is superseded by the store sheet | Decided | Yes | 2026-10-20 |",
    "| D-901 | the rule stays as built (WP-F16-01 after); delegated call by the coordinator, removed later | Decided | Yes | 2026-10-20 |",
  ].join("\n"));
  assert.deepEqual(decisions.map((d) => d.id), ["D-900", "D-901"]);
  assert.equal(clauseCloses(decisions[0].text, "BL-342"), true);
  assert.equal(clauseCloses(decisions[1].text, "WP-F16-01"), false);
  const flags = staleFlags(allTasks(), { decisions });
  assert.equal(flags.find((f) => f.id === "BL-342").kind, "decision");
  assert.equal(flags.some((f) => f.id === "WP-F16-01"), false);
});

test("a ready BL task named by a built work package is flagged weak; the reverse direction is not", () => {
  const tasks = allTasks();
  const wp = byId(tasks, "WP-F14-02");
  wp.status = "built";
  const flags = staleFlags(tasks, {});
  const f = flags.find((x) => x.id === "BL-342");
  assert.equal(f.kind, "linked-task");
  assert.equal(f.strength, "weak");
  // WP-F06-01 names BL-120; BL-120 being done says nothing about the WP.
  assert.equal(flags.some((x) => x.id === "WP-F06-01"), false);
});

test("loadTasks reads a checkout; dispatchView feeds lib.mjs eligibility unchanged", () => {
  const root = mkdtempSync(join(tmpdir(), "tasks-"));
  try {
    mkdirSync(join(root, "docs", "prd", "v2", "features"), { recursive: true });
    writeFileSync(join(root, "docs", "BACKLOG.md"), BACKLOG);
    writeFileSync(join(root, "docs", "prd", "v2", "features", "F16-sync.md"), F16);
    writeFileSync(join(root, "docs", "prd", "v2", "features", "F14-plus.md"), F14);
    writeFileSync(join(root, "docs", "prd", "v2", "features", "F14-dup.md"), F14);
    writeFileSync(join(root, "docs", "DECISIONS.md"), "| D-100 | Server features are on in v1.0 | Decided | Yes | 2026-10-13 |\n");
    const loaded = loadTasks({ root, mergedPRs: [PR_121] });
    assert.equal(loaded.tasks.filter((t) => t.source === "backlog").length, 3);
    assert.ok(loaded.warnings.some((w) => /WP-F14-01 appears twice/.test(w)));
    assert.equal(byId(loaded.tasks, "BL-342").flags[0].kind, "merged-pr");

    const view = dispatchView(loaded);
    const map = new Map(view.map((t) => [t.id, t]));
    assert.deepEqual(eligibility(map.get("BL-342"), map), { ok: false, reason: "status stale" });
    assert.deepEqual(eligibility(map.get("BL-440"), map), { ok: false, reason: "status stale" });
    assert.equal(map.get("WP-F16-01").status, "ready");
    assert.deepEqual(eligibility(map.get("WP-F16-01"), map), { ok: true });
    assert.equal(map.get("WP-F16-02").status, "done");
    // WP-F16-13 depends on WP-F16-06, which is not in this checkout.
    assert.deepEqual(eligibility(map.get("WP-F16-13"), map), { ok: false, reason: "depends on WP-F16-06" });
    // refuse: "none" leaves flagged tasks as they were.
    assert.equal(dispatchView(loaded, { refuse: "none" }).find((t) => t.id === "BL-342").status, "ready");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("missing sources give warnings, not crashes", () => {
  const root = mkdtempSync(join(tmpdir(), "tasks-empty-"));
  try {
    const loaded = loadTasks({ root });
    assert.deepEqual(loaded.tasks, []);
    assert.equal(loaded.warnings.length, 2);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("takenTaskIds sees BL and WP ids in open PR branches and titles", () => {
  const taken = takenTaskIds([
    { head: { ref: "feat/billing-bl-342-reminders" }, title: "x" },
    { head: { ref: "feat/sync" }, title: "WP-F16-01: contract" },
    { head: { ref: "feat/wp-f08-b5a-queue" }, title: "y" },
  ], ["WP-F08-B5a", "WP-F16-01"]);
  assert.deepEqual([...taken].sort(), ["BL-342", "WP-F08-B5a", "WP-F16-01"]);
});
