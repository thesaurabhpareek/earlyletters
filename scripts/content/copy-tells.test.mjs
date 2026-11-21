import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { RULES, stringsIn, compare, baselineGrowth } from "./copy-tells.mjs";

const SCRIPT = fileURLToPath(new URL("./copy-tells.mjs", import.meta.url));

const hits = (t) => RULES.filter(([, re]) => re.test(t)).map(([r]) => r);

test("flags stiff and stagey lines", () => {
  assert.deepEqual(hits("The download did not finish."), ["uncontracted"]);
  assert.ok(hits("One note from us, then Apple asks.").includes("stage-managed"));
  assert.ok(hits("Your voice, kept").includes("slogan-kept"));
  assert.ok(hits("Please try again.").includes("please-open"));
});

test("leaves plain human lines alone", () => {
  assert.deepEqual(hits("That didn't save. Your recording is still here."), []);
  assert.deepEqual(hits("To make sure it's you, we'll email this address a link."), []);
});

test("extracts string values, not keys or imports", () => {
  const out = stringsIn("x.ts", "import a from 'some-module-name';\nexport const c = { title: 'Say a few words', 'quoted key here': 'Tap Save' };");
  assert.deepEqual(out.map((s) => s.text), ["Say a few words", "Tap Save"]);
});

test("compare reports growth and new entries only", () => {
  const now = new Map([["a\tr", 3], ["b\tr", 1]]);
  const base = new Map([["a\tr", 3]]);
  assert.deepEqual(compare(now, base), [["b\tr", 0, 1]]);
});

test("softener flags the Just X tell and leaves time and degree words alone", () => {
  for (const t of ["Just say a few words.", "Talk for a minute. Just tell it.", "You just listen and keep it.", "Simply tap Save.", "Add it quickly."]) {
    assert.ok(hits(t).includes("softener"), t);
  }
  for (const t of ["You signed in just now.", "Your letter is here just as it is.", "What just happened?", "Saved just before you left.", "Not just yet.", "Kept just for you.", "Just now"]) {
    assert.ok(!hits(t).includes("softener"), t);
  }
});

test("baselineGrowth rejects a higher count, a new entry or a higher total", () => {
  const committed = new Map([["a\tr", 2], ["b\tr", 1]]);
  assert.deepEqual(baselineGrowth(new Map([["a\tr", 2], ["b\tr", 0]]), committed), []);
  assert.deepEqual(baselineGrowth(new Map([["a\tr", 3], ["b\tr", 1]]), committed), [["a\tr", 2, 3]]);
  assert.deepEqual(baselineGrowth(new Map([["a\tr", 2], ["c\tr", 1]]), committed), [["c\tr", 0, 1]]);
  assert.deepEqual(baselineGrowth(new Map([["a\tr", 2]]), null), []);
});

// The shrink-only promise, end to end on a throwaway tree.
function fixture(strings) {
  const root = mkdtempSync(join(tmpdir(), "copy-tells-"));
  mkdirSync(join(root, "packages/content/src"), { recursive: true });
  mkdirSync(join(root, "apps/mobile/src"), { recursive: true });
  const body = strings.map((t, i) => `  k${i}: "${t}",`).join("\n");
  writeFileSync(join(root, "packages/content/src/x.en.ts"), `export const x = {\n${body}\n};\n`);
  return root;
}
const run = (root, ...args) => spawnSync("node", [SCRIPT, ...args], { env: { ...process.env, COPY_TELLS_ROOT: root }, encoding: "utf8" });
const baselinePath = (root) => join(root, "packages/content/copy-tells-baseline.txt");
const git = (root, ...a) => execFileSync("git", ["-C", root, "-c", "user.email=t@example.com", "-c", "user.name=t", ...a], { stdio: "ignore" });

test("--check fails when a finding is added, and passes at baseline", () => {
  const root = fixture(["The download did not finish.", "Saved."]);
  try {
    assert.equal(run(root, "--update-baseline").status, 0);
    assert.equal(run(root, "--check").status, 0);
    writeFileSync(join(root, "packages/content/src/x.en.ts"), 'export const x = { a: "The download did not finish.", b: "We did not save that." };\n');
    const r = run(root, "--check");
    assert.equal(r.status, 1);
    assert.match(r.stderr, /uncontracted\s+1 -> 2/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("--update-baseline refuses to grow and leaves the file as it was", () => {
  const root = fixture(["The download did not finish."]);
  try {
    assert.equal(run(root, "--update-baseline").status, 0);
    const before = readFileSync(baselinePath(root), "utf8");
    writeFileSync(join(root, "packages/content/src/x.en.ts"), 'export const x = { a: "The download did not finish.", b: "We did not save that." };\n');
    const r = run(root, "--update-baseline");
    assert.equal(r.status, 1);
    assert.match(r.stderr, /Refusing to grow/);
    assert.equal(readFileSync(baselinePath(root), "utf8"), before);
    // A gain is allowed: fix the lines and the baseline can come down.
    writeFileSync(join(root, "packages/content/src/x.en.ts"), 'export const x = { a: "The download didn\'t finish." };\n');
    assert.equal(run(root, "--update-baseline").status, 0);
    assert.equal(readFileSync(baselinePath(root), "utf8").trim(), "");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a baseline file raised above the committed one is rejected by --check and --update-baseline", () => {
  const root = fixture(["The download did not finish."]);
  try {
    assert.equal(run(root, "--update-baseline").status, 0);
    git(root, "init", "-q");
    git(root, "add", "-A");
    git(root, "commit", "-q", "-m", "baseline");
    // Hand-raise the count so a new tell would hide under it.
    writeFileSync(baselinePath(root), "packages/content/src/x.en.ts\tuncontracted\t5\n");
    for (const flag of ["--check", "--update-baseline"]) {
      const r = run(root, flag);
      assert.equal(r.status, 1, flag);
      assert.match(r.stderr, /higher than the one committed at HEAD/, flag);
    }
    // Lowering it is fine.
    writeFileSync(baselinePath(root), "");
    writeFileSync(join(root, "packages/content/src/x.en.ts"), 'export const x = { a: "The download didn\'t finish." };\n');
    assert.equal(run(root, "--check").status, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
