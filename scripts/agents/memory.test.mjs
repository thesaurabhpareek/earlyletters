// Memory loop tests (owner: ai-eng-lead). Run: node --test 'scripts/agents/*.test.mjs'
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { briefLines, learnedFrom, isCarried, countLines, MEMORY_LIMIT } from "./memory.mjs";

const HANDLE = "mobile";
function fixture(memory) {
  const ROOT = mkdtempSync(join(tmpdir(), "memloop-"));
  if (memory !== undefined) {
    mkdirSync(join(ROOT, "agents", HANDLE), { recursive: true });
    writeFileSync(join(ROOT, "agents", HANDLE, "MEMORY.md"), memory);
  }
  return ROOT;
}
const entry = (learned, created_at = "2026-10-15T10:00:00Z") => ({
  created_at,
  body: `<!-- journal run:r1 agent:${HANDLE} -->\n**Mode:** task BL-101\n**Did:** x\n**PRs:** none\n**Next:** y\n**Learned:** ${learned}\n**Founder:** none`,
});
const MEM = "# Memory\n\n- Fuzz runs default to 10,000 (packages/core/test/verify.fuzz.test.ts:35, verified 2026-10-03).\n";

test("inline and bulleted Learned lines are both read; none and meta notes are skipped", () => {
  assert.deepEqual(learnedFrom(entry("none").body), []);
  assert.deepEqual(learnedFrom(entry("None.").body), []);
  assert.deepEqual(learnedFrom("**Did:** x"), []);
  assert.deepEqual(
    learnedFrom(entry("Flows under `e2e/flows` can lag gates. Check `lib/billing/gates.ts` first. MEMORY.md not edited this run.").body),
    ["Flows under `e2e/flows` can lag gates.", "Check `lib/billing/gates.ts` first."]);
  const bullets = "**Learned:**\n- Founder PRs cite WS ids, not BL ids.\n- Workflows added in a PR run only on that PR\n  until they merge.\n\n**Founder:** none";
  assert.deepEqual(learnedFrom(bullets), ["Founder PRs cite WS ids, not BL ids.", "Workflows added in a PR run only on that PR until they merge."]);
});

test("a lesson is carried when five consecutive words of it are in memory, ignoring case and markdown", () => {
  assert.equal(isCarried("Fuzz runs default to 10,000 in CI too.", MEM), true, "extra words after a copied phrase still match");
  assert.equal(isCarried("**Fuzz runs default to** `10,000`.", MEM), true);
  assert.equal(isCarried("The suite says fuzz runs default to 10,000 here", MEM), true, "a prefix does not hide a copied phrase");
  assert.equal(isCarried("Fuzzing uses ten thousand runs by default", MEM), false, "known miss: paraphrase");
  assert.equal(isCarried("`packages/core/test/verify.fuzz.test.ts`", MEM), true, "a short lesson matches as whole words");
  assert.equal(isCarried("verify.fuzz.test.ts", MEM), false, "a path tail is not a whole word");
});

test("uncarried lessons produce the section, newest first, at most five, deduplicated", () => {
  const ROOT = fixture(MEM);
  try {
    const recent = [
      entry("- L1 alpha beta gamma delta.\n- L2 alpha beta gamma delta.\n- L3 alpha beta gamma delta.", "2026-10-10T00:00:00Z"),
      entry("- L4 alpha beta gamma delta.\n- L5 alpha beta gamma delta.\n- L6 alpha beta gamma delta.\n- L1 alpha beta gamma delta.", "2026-10-12T00:00:00Z"),
    ];
    const lines = briefLines({ ROOT, handle: HANDLE, recent });
    assert.equal(lines[0], "## Carry into memory");
    assert.equal(lines.at(-1), "", "section ends with a blank line before the next heading");
    const items = lines.filter((l) => l.startsWith("- ("));
    assert.equal(items.length, 5);
    assert.match(items[0], /^- \(2026-10-12\) L4/);
    assert.equal(lines.filter((l) => l.includes("L1 alpha")).length, 1);
    assert.ok(lines.includes("- and 1 more in your journal entries above."));
    assert.ok(lines.some((l) => l.includes(`add each durable one to \`agents/${HANDLE}/MEMORY.md\` in the same PR`)));
    assert.ok(lines.some((l) => l.includes("If a lesson is not durable, say so in your journal.")));
  } finally { rmSync(ROOT, { recursive: true, force: true }); }
});

test("nothing to carry returns []; missing file, bad input and no journal return []", () => {
  const ROOT = fixture(MEM);
  try {
    assert.deepEqual(briefLines({ ROOT, handle: HANDLE, recent: [entry("none"), entry("Fuzz runs default to 10,000.")] }), []);
    assert.deepEqual(briefLines({ ROOT, handle: HANDLE, recent: [] }), []);
    assert.deepEqual(briefLines({ ROOT, handle: HANDLE, recent: undefined }), []);
    assert.deepEqual(briefLines({ ROOT, handle: "../etc", recent: [entry("new thing here to keep")] }), []);
    assert.deepEqual(briefLines(undefined), []);
    assert.deepEqual(briefLines({ ROOT, handle: HANDLE, recent: [{ body: null }, null, 7] }), []);
  } finally { rmSync(ROOT, { recursive: true, force: true }); }
  const empty = fixture();
  try { assert.deepEqual(briefLines({ ROOT: empty, handle: HANDLE, recent: [entry("a brand new lesson worth keeping")] }), []); }
  finally { rmSync(empty, { recursive: true, force: true }); }
});

test("memory over the line limit is flagged even with nothing to carry; exactly at the limit is not", () => {
  const at = "- x\n".repeat(MEMORY_LIMIT);
  assert.equal(countLines(at), MEMORY_LIMIT);
  assert.equal(countLines("a\nb"), 2);
  assert.equal(countLines(""), 0);
  const ROOT = fixture(at);
  try {
    assert.deepEqual(briefLines({ ROOT, handle: HANDLE, recent: [] }), []);
    writeFileSync(join(ROOT, "agents", HANDLE, "MEMORY.md"), `${at}- y\n`);
    const lines = briefLines({ ROOT, handle: HANDLE, recent: [] });
    assert.equal(lines[0], "## Carry into memory");
    assert.ok(lines.some((l) => l.includes(`is ${MEMORY_LIMIT + 1} lines, over the ${MEMORY_LIMIT}-line limit`)));
  } finally { rmSync(ROOT, { recursive: true, force: true }); }
});

test("long lessons are clipped and output stays ASCII", () => {
  const ROOT = fixture(MEM);
  try {
    const lines = briefLines({ ROOT, handle: HANDLE, recent: [entry(`A ${"very ".repeat(80)}long lesson`)] });
    const item = lines.find((l) => l.startsWith("- ("));
    assert.ok(item.length < 260 && item.endsWith("..."));
    assert.ok(lines.every((l) => /^[\x20-\x7e]*$/.test(l)));
  } finally { rmSync(ROOT, { recursive: true, force: true }); }
});

// ---------- H7: context sections, size budget, carry-over ----------
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { contextLines, carryOver, decisionsSince, registryRows, relevantLessons, keywordsFor, BRIEF_BUDGET } from "./memory.mjs";

const AGENT = { title: "Mobile Engineer (iOS first, Expo)", department: "engineering", backlog_owner_names: ["mobile engineer"] };
const SEEDED = "# Memory\n\n## Open threads\n- None yet.\n\n## Lessons\n- None yet.\n";
const DECISIONS = [
  "| ID | Decision | Status | Proceed? | Date |", "|---|---|---|---|---|",
  "| D-010 | Old call | Decided | Yes | 2026-10-01 |",
  "| D-020 | Expo build profiles set the docs URL | Decided | Yes | 2026-10-20 |",
  "| D-021 | Pack release first | Decided | Yes | 2026-10-22 |",
  "| D-022 | Undated row | Decided | Yes | PRD 1 |",
  "", "### D-021 Pack release first", "| D-021 | repeated later | x | y | 2026-10-23 |"].join("\n");
const LESSONS = "# Lessons\n\n## How to add a lesson\n\n- Search first (mobile).\n\n## 3. Mobile builds\n\n- Expo prebuild drops plist keys a config plugin does not set.\n\n## 4. Database\n\n- Unrelated: postgres temp tables shadow functions.\n";
const REGISTRY = "| Id | Class | Incidents | Detector | Status |\n|---|---|---|---|---|\n| L-01 | Mobile build config drift | none | a test | detected |\n| L-02 | A check that cannot fail | x | control | open |\n| L-03 | Postgres grants | y | grants.mjs | detected |\n";

function world({ memory = SEEDED, lessons, registry, decisions = DECISIONS } = {}) {
  const ROOT = fixture(memory);
  mkdirSync(join(ROOT, "docs", "agents"), { recursive: true });
  if (decisions !== undefined) writeFileSync(join(ROOT, "docs", "DECISIONS.md"), decisions);
  if (lessons !== undefined) writeFileSync(join(ROOT, "docs", "agents", "LESSONS.md"), lessons);
  if (registry !== undefined) { mkdirSync(join(ROOT, "agents", "lessons"), { recursive: true }); writeFileSync(join(ROOT, "agents", "lessons", "REGISTRY.md"), registry); }
  return ROOT;
}
const LESSON = "Simulator builds need the dev client rebuilt after a plugin change.";

test("a journal lesson reaches the next brief, is carried into MEMORY.md, then shows as memory", () => {
  const ROOT = world();
  try {
    const recent = [entry(LESSON, "2026-10-21T09:00:00Z")];
    let text = contextLines({ ROOT, handle: HANDLE, recent, agent: AGENT, since: "2026-10-21T09:00:00Z" }).join("\n");
    assert.match(text, /## Carry into memory[\s\S]*\(2026-10-21\) Simulator builds need the dev client rebuilt/);
    assert.match(text, /memory\.mjs carry --agent mobile --journal-file/);
    const memPath = join(ROOT, "agents", HANDLE, "MEMORY.md");
    const r = carryOver(readFileSync(memPath, "utf8"), learnedFrom(recent[0].body), { source: "journal #12", date: "2026-10-21", path: "agents/mobile/MEMORY.md" });
    assert.deepEqual(r.added, [LESSON]);
    assert.match(r.diff, /^--- a\/agents\/mobile\/MEMORY\.md\n\+\+\+ b\/agents\/mobile\/MEMORY\.md\n@@ /);
    assert.match(r.diff, /\n-- None yet\.\n\+- Simulator builds .* \(journal #12, 2026-10-21\)\n/);
    assert.match(r.text, /## Open threads\n- None yet\./, "only the Lessons placeholder is replaced");
    writeFileSync(memPath, r.text);
    text = contextLines({ ROOT, handle: HANDLE, recent, agent: AGENT, since: "2026-10-21T09:00:00Z" }).join("\n");
    assert.doesNotMatch(text, /## Carry into memory/);
    assert.match(text, /## Your memory, in short[\s\S]*- In: Lessons\n {2}- Simulator builds need the dev client rebuilt/);
  } finally { rmSync(ROOT, { recursive: true, force: true }); }
});

test("LESSONS.md and REGISTRY.md are optional; when present only relevant lines come in", () => {
  const bare = world();
  try {
    const text = contextLines({ ROOT: bare, handle: HANDLE, recent: [], agent: AGENT, since: "2026-10-21" }).join("\n");
    assert.doesNotMatch(text, /Lessons from other runs|Error classes/);
    assert.match(text, /## Decisions since your last run/);
  } finally { rmSync(bare, { recursive: true, force: true }); }
  const ROOT = world({ lessons: LESSONS, registry: REGISTRY, decisions: undefined });
  try {
    const text = contextLines({ ROOT, handle: HANDLE, recent: [], agent: AGENT, since: "" }).join("\n");
    assert.doesNotMatch(text, /Decisions/, "missing DECISIONS.md drops its section");
    assert.match(text, /- Theme: 3\. Mobile builds\n {2}- Expo prebuild drops plist keys/);
    assert.doesNotMatch(text, /postgres temp tables|Search first/, "irrelevant and housekeeping lines stay out");
    assert.match(text, /- L-01 \(detected\): Mobile build config drift\./);
    assert.match(text, /- L-02 \(open\): A check that cannot fail\./, "open classes always come in");
    assert.doesNotMatch(text, /L-03/);
  } finally { rmSync(ROOT, { recursive: true, force: true }); }
});

test("decisions since the last run: whole days, newest id first, undated and repeated rows skipped", () => {
  assert.deepEqual(decisionsSince(DECISIONS, "2026-10-20T23:59:00Z").map((l) => l.slice(0, 18)), ["- D-021 (2026-10-2", "- D-020 (2026-10-2"]);
  assert.equal(decisionsSince(DECISIONS, "").length, 3, "first run: every dated row");
  assert.deepEqual(decisionsSince(undefined, ""), []);
  assert.deepEqual(relevantLessons(LESSONS, keywordsFor("x", {})), []);
  assert.deepEqual(registryRows("", new Set()), []);
});

test("the size budget holds for every budget, and says what it cut", () => {
  const many = Array.from({ length: 60 }, (_, i) => `| D-${100 + i} | Mobile decision number ${i} ${"word ".repeat(30)} | Decided | Yes | 2026-10-2${i % 9} |`).join("\n");
  const lessons = `## 1. Mobile\n\n${Array.from({ length: 40 }, (_, i) => `- Mobile lesson ${i} ${"detail ".repeat(25)}`).join("\n")}\n`;
  const ROOT = world({ decisions: many, lessons, registry: REGISTRY });
  try {
    const recent = [entry(`- ${LESSON}\n- Another fresh mobile lesson worth keeping.`)];
    for (const budget of [0, 200, 900, 2500, BRIEF_BUDGET, 20000]) {
      const out = contextLines({ ROOT, handle: HANDLE, recent, agent: AGENT, since: "", budget });
      assert.ok(out.join("\n").length + 1 <= Math.max(budget, 1), `budget ${budget}: ${out.join("\n").length + 1}`);
    }
    const text = contextLines({ ROOT, handle: HANDLE, recent, agent: AGENT, since: "" }).join("\n");
    assert.match(text, /^## Carry into memory/, "carry-over comes first");
    assert.match(text, /- and \d+ more not shown \(brief size limits\)\./);
    assert.doesNotMatch(text, /- Theme: [^\n]*\n(?!  - )/, "no theme heading without a lesson under it");
    const tiny = contextLines({ ROOT, handle: HANDLE, recent, agent: AGENT, since: "", budget: 300 }).join("\n");
    assert.match(tiny, /did not fit the brief size budget/);
  } finally { rmSync(ROOT, { recursive: true, force: true }); }
  assert.deepEqual(contextLines(undefined), []);
  assert.deepEqual(contextLines({ ROOT: "/nonexistent", handle: "../x" }), []);
});

test("carry-over: creates the Lessons section, skips carried and repeated lines, refuses past the line limit", () => {
  const r = carryOver("# Memory\n\n- Fuzz runs default to 10,000 here.\n", ["Fuzz runs default to 10,000 here.", "A new one.", "A new one.", "none"], { date: "2026-10-28" });
  assert.equal(r.text, "# Memory\n\n- Fuzz runs default to 10,000 here.\n\n## Lessons\n- A new one. (2026-10-28)\n");
  assert.deepEqual(r.skipped, ["Fuzz runs default to 10,000 here.", "A new one."]);
  assert.equal(carryOver("x\n", []).diff, "");
  const full = `## Lessons\n${"- x\n".repeat(MEMORY_LIMIT - 1)}`;
  const over = carryOver(full, ["One more lesson.", "And another."]);
  assert.equal(over.over, true);
  assert.equal(over.text, full);
});

test("carry CLI prints the diff without writing by default; --write applies it", () => {
  const ROOT = world();
  const file = join(ROOT, "entry.md");
  writeFileSync(file, entry(LESSON).body);
  const cli = (...a) => execFileSync(process.execPath, [join(import.meta.dirname, "memory.mjs"), "carry", "--agent", HANDLE, "--root", ROOT, "--journal-file", file, "--date", "2026-10-28", ...a], { encoding: "utf8" });
  const memPath = join(ROOT, "agents", HANDLE, "MEMORY.md");
  try {
    assert.match(cli(), /\+- Simulator builds[^\n]*\(2026-10-28\)\n[\s\S]*dry run: 1 lesson/);
    assert.equal(readFileSync(memPath, "utf8"), SEEDED, "dry run leaves the file alone");
    assert.match(cli("--write", "--source", "journal #12"), /wrote agents\/mobile\/MEMORY\.md: 1 lesson/);
    assert.match(readFileSync(memPath, "utf8"), /- Simulator builds[^\n]*\(journal #12, 2026-10-28\)\n$/);
    assert.match(cli(), /nothing new to carry/);
  } finally { rmSync(ROOT, { recursive: true, force: true }); }
});
