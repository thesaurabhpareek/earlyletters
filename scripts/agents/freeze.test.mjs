// Path freezes (H2). Pure functions, plus the push gate against a throwaway git
// repository. No network. Run: node --test 'scripts/agents/*.test.mjs'
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseFreezeFile, loadFreezes, activeFreezes, frozenFiles, mentionOverlaps, taskPaths,
  frozenMentions, blockedReason, boardLines, runGate,
} from "./freeze.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const NOW = new Date("2026-11-01T12:00:00Z");
const F = (over = {}) => ({ id: "F-1", globs: ["supabase/migrations/**"], until: "2026-11-05", reason: "build 3 freeze", decided_by: "D-120", ...over });
const file = (...freezes) => JSON.stringify({ freezes });
const parsed = (...freezes) => parseFreezeFile(file(...freezes));

test("the committed freeze file parses and is empty", () => {
  const r = parseFreezeFile(readFileSync(join(HERE, "..", "..", "agents", "freeze.json"), "utf8"));
  assert.deepEqual(r, { freezes: [], errors: [] });
});

test("every field is required and checked", () => {
  assert.equal(parsed(F()).errors.length, 0);
  const bad = parseFreezeFile(file(
    F({ globs: [] }), F({ globs: ["/abs/**"] }), F({ until: "soon" }), F({ reason: " " }), F({ decided_by: "founder" }), F({ decided_by: undefined }),
  ));
  assert.equal(bad.errors.length, 6);
  assert.equal(bad.freezes.length, 0);
  assert.match(parseFreezeFile("{not json").errors[0], /not valid JSON/);
  assert.match(parseFreezeFile("{}").errors[0], /needs a "freezes" list/);
});

test("until is exclusive at 00:00 UTC, and an ISO time is accepted", () => {
  const { freezes } = parsed(F(), F({ id: "F-2", until: "2026-11-01T13:00:00Z" }));
  assert.deepEqual(activeFreezes(freezes, NOW).map((f) => f.id), ["F-1", "F-2"]);
  assert.deepEqual(activeFreezes(freezes, new Date("2026-11-01T13:00:00Z")).map((f) => f.id), ["F-1"]);
  assert.deepEqual(activeFreezes(freezes, new Date("2026-11-05T00:00:00Z")), []);
});

test("a changed file under a frozen glob matches; expired freezes are ignored", () => {
  const { freezes } = parsed(F(), F({ id: "F-old", globs: ["docs/**"], until: "2026-10-30" }));
  const hits = frozenFiles(["supabase/migrations/2026_x.sql", "docs/a.md", "apps/mobile/a.ts"], freezes, NOW);
  assert.deepEqual(hits.map((h) => [h.path, h.freeze.id]), [["supabase/migrations/2026_x.sql", "F-1"]]);
});

test("task mentions overlap a freeze when they are inside it, contain it, or are a glob over it", () => {
  assert.equal(mentionOverlaps("supabase/migrations/x.sql", "supabase/migrations/**"), true);
  assert.equal(mentionOverlaps("supabase/migrations/", "supabase/migrations/**"), true, "the frozen folder itself");
  assert.equal(mentionOverlaps("supabase", "supabase/migrations/**"), true, "a parent folder");
  assert.equal(mentionOverlaps("supabase/*.sql", "supabase/migrations/**"), true, "a glob that reaches it");
  assert.equal(mentionOverlaps("supabase/functions/x.ts", "supabase/migrations/**"), false);
  assert.equal(mentionOverlaps("apps/mobile/src/a.ts", "apps/mobile/src/*.ts"), true);
  assert.equal(mentionOverlaps("apps/mobile/src/lib/a.ts", "apps/mobile/src/*.ts"), false);
});

test("taskPaths reads backticked repo paths only, dropping line numbers", () => {
  const block = "#### BL-1 x\n- Scope: `apps/mobile/src/lib/billing/`, `packages/core/src/plan.ts:38,45`, `CLAUDE.md`, `RenewalInfo.willAutoRenew`, `currentEntitlements`, `https://x.test/a/b`, `D-022`.";
  assert.deepEqual(taskPaths({ block }), ["apps/mobile/src/lib/billing/", "packages/core/src/plan.ts", "CLAUDE.md"]);
  assert.deepEqual(taskPaths(undefined), []);
});

const ctxWith = (over = {}) => ({
  now: NOW,
  freezes: parsed(F()),
  byId: new Map([
    ["BL-1", { id: "BL-1", block: "- Scope: `supabase/migrations/` new table." }],
    ["BL-2", { id: "BL-2", block: "- Scope: `docs/qa/PLAN.md`." }],
  ]),
  openPRs: [{ number: 7 }],
  prFiles: () => ["supabase/migrations/2026_x.sql", "docs/a.md"],
  ...over,
});

test("blockedReason refuses frozen task and maintain work with the reason, and nothing else", () => {
  assert.equal(
    blockedReason(ctxWith(), {}, { mode: "task", task: "BL-1", label: "task BL-1" }),
    "frozen: task BL-1: `supabase/migrations/` is frozen until 2026-11-05 by D-120 (build 3 freeze)",
  );
  assert.equal(blockedReason(ctxWith(), {}, { mode: "task", task: "BL-2", label: "task BL-2" }), "");
  assert.match(blockedReason(ctxWith(), {}, { mode: "maintain", pr: 7, label: "maintain #7" }), /^frozen: maintain #7: `supabase\/migrations\/2026_x\.sql`/);
  for (const mode of ["review", "steward-review", "handoff", "digest", "standing"]) {
    assert.equal(blockedReason(ctxWith(), {}, { mode, task: "BL-1", pr: 7 }), "", mode);
  }
  assert.equal(blockedReason(ctxWith({ now: new Date("2026-11-06T00:00:00Z") }), {}, { mode: "task", task: "BL-1" }), "", "expired");
});

test("an invalid freeze file fails closed for task and maintain work", () => {
  const ctx = ctxWith({ freezes: parseFreezeFile("{oops") });
  assert.match(blockedReason(ctx, {}, { mode: "task", task: "BL-2" }), /^freeze file invalid/);
  assert.match(blockedReason(ctx, {}, { mode: "maintain", pr: 7 }), /^freeze file invalid/);
  assert.equal(blockedReason(ctx, {}, { mode: "review", pr: 7 }), "");
});

test("loadFreezes prefers the base copy, falls back to the local one, and survives a throwing reader", () => {
  assert.equal(loadFreezes({ fromBase: () => file(F()), fromLocal: () => file() }).freezes.length, 1);
  assert.equal(loadFreezes({ fromBase: () => null, fromLocal: () => file(F()) }).source, "local");
  assert.equal(loadFreezes({ fromBase: () => { throw new Error("x"); }, fromLocal: () => null }).source, "none");
});

test("boardLines lists active freezes and file errors, and is empty otherwise", () => {
  assert.deepEqual(boardLines(ctxWith()), ["## Freezes", "", "- F-1: `supabase/migrations/**` until 2026-11-05 (D-120: build 3 freeze)"]);
  assert.deepEqual(boardLines(ctxWith({ freezes: parsed() })), []);
  assert.deepEqual(boardLines(ctxWith({ now: new Date("2026-12-01T00:00:00Z") })), []);
  assert.match(boardLines(ctxWith({ freezes: parseFreezeFile("[]") })).join("\n"), /Freeze file invalid/);
});

test("frozenMentions reports each overlap", () => {
  const { freezes } = parsed(F());
  assert.deepEqual(frozenMentions(["supabase", "docs/x.md"], freezes, NOW).map((m) => m.path), ["supabase"]);
});

// ---------- the push gate ----------

function repoWithBranch({ baseFreeze, branchFreeze, branchFiles }) {
  const dir = mkdtempSync(join(tmpdir(), "freeze-gate-"));
  const git = (...a) => execFileSync("git", a, { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  git("init", "-q", "-b", "develop");
  git("config", "user.email", "test@example.test");
  git("config", "user.name", "test");
  mkdirSync(join(dir, "agents"));
  if (baseFreeze !== undefined) writeFileSync(join(dir, "agents", "freeze.json"), baseFreeze);
  writeFileSync(join(dir, "README.md"), "x\n");
  git("add", "-A");
  git("-c", "commit.gpgsign=false", "commit", "-q", "-m", "base");
  git("checkout", "-q", "-b", "feature");
  for (const f of branchFiles) {
    mkdirSync(dirname(join(dir, f)), { recursive: true });
    writeFileSync(join(dir, f), "change\n");
  }
  if (branchFreeze !== undefined) writeFileSync(join(dir, "agents", "freeze.json"), branchFreeze);
  git("add", "-A");
  git("-c", "commit.gpgsign=false", "commit", "-q", "-m", "change");
  return dir;
}

test("the gate refuses a branch that changes a frozen path, with the reason", () => {
  const cwd = repoWithBranch({ baseFreeze: file(F()), branchFiles: ["supabase/migrations/2026_x.sql", "docs/a.md"] });
  const r = runGate({ base: "develop", now: NOW, cwd });
  assert.equal(r.code, 1);
  assert.match(r.lines.join("\n"), /Refused: 1 changed path frozen on develop[\s\S]*`supabase\/migrations\/2026_x\.sql` is frozen until 2026-11-05 by D-120 \(build 3 freeze\)/);
});

test("a branch cannot lift its own freeze: the file is read from the base", () => {
  const cwd = repoWithBranch({ baseFreeze: file(F()), branchFreeze: file(), branchFiles: ["supabase/migrations/2026_x.sql"] });
  assert.equal(runGate({ base: "develop", now: NOW, cwd }).code, 1);
});

test("the gate passes when the freeze has expired, when nothing frozen changed, and when the base has no freeze file", () => {
  const cwd = repoWithBranch({ baseFreeze: file(F()), branchFiles: ["supabase/migrations/2026_x.sql"] });
  assert.equal(runGate({ base: "develop", now: new Date("2026-11-05T00:00:00Z"), cwd }).code, 0);
  const other = repoWithBranch({ baseFreeze: file(F()), branchFiles: ["docs/a.md"] });
  assert.match(runGate({ base: "develop", now: NOW, cwd: other }).lines[0], /^No frozen paths changed \(1 files checked against 1 active freezes on develop\)/);
  const none = repoWithBranch({ branchFiles: ["supabase/migrations/2026_x.sql"] });
  assert.equal(runGate({ base: "develop", now: NOW, cwd: none }).code, 0);
});

test("the gate refuses when the base freeze file is invalid, and --files overrides the diff", () => {
  const cwd = repoWithBranch({ baseFreeze: "{bad", branchFiles: ["docs/a.md"] });
  assert.equal(runGate({ base: "develop", now: NOW, cwd }).code, 1);
  const ok = repoWithBranch({ baseFreeze: file(F()), branchFiles: ["docs/a.md"] });
  assert.equal(runGate({ base: "develop", now: NOW, cwd: ok, files: ["supabase/migrations/y.sql"] }).code, 1);
});

test("the CLI exits 1 on a frozen change and 0 otherwise", () => {
  const cwd = repoWithBranch({ baseFreeze: file(F()), branchFiles: ["supabase/migrations/2026_x.sql"] });
  const cli = (args) => spawnSync(process.execPath, [join(HERE, "freeze.mjs"), "--base", "develop", "--now", "2026-11-01T12:00:00Z", ...args], { cwd, encoding: "utf8" });
  const refused = cli([]);
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /Refused/);
  assert.equal(cli(["--files", "docs/a.md"]).status, 0);
});
