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
