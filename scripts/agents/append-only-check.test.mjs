// Tests for append-only-check.mjs (HV2-B35). The diff is injected: no git, no network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { checkDiff, parseList, parseArgs, main, formatFindings, DEFAULT_LIST } from "./append-only-check.mjs";

const R = "docs/agents/cto/RULINGS.md";
const LISTED = [R, "docs/release/BUILD_GATE_2026-11-08.md"];

const append = `diff --git a/${R} b/${R}
index 1111111..2222222 100644
--- a/${R}
+++ b/${R}
@@ -40,0 +41,3 @@
+### CR-99 New ruling
+- Ruling: yes.
+- Door: two-way.
`;
const edit = `diff --git a/${R} b/${R}
index 1111111..2222222 100644
--- a/${R}
+++ b/${R}
@@ -12 +12 @@
-- Ruling: no.
+- Ruling: yes.
@@ -30,2 +30,0 @@
-### CR-3 old heading
-- Tier: T1.
`;

test("pure addition to a listed file is clean", () => {
  assert.deepEqual(checkDiff(append, LISTED), []);
});

test("an edited and a removed line in a listed file are flagged with old line numbers", () => {
  const f = checkDiff(edit, LISTED);
  assert.equal(f.length, 1);
  assert.equal(f[0].file, R);
  assert.equal(f[0].count, 3);
  assert.deepEqual(f[0].samples.map((s) => s.line), [12, 30, 31]);
  assert.match(f[0].samples[0].text, /Ruling: no\./);
});

test("deletions in an unlisted file are ignored", () => {
  const d = edit.replaceAll(R, "docs/other.md");
  assert.deepEqual(checkDiff(d, LISTED), []);
});

test("a deleted line that starts with dashes is not read as a file header", () => {
  const d = `diff --git a/${R} b/${R}
--- a/${R}
+++ b/${R}
@@ -5,2 +5,0 @@
---- a/docs/other.md
----
`;
  const f = checkDiff(d, LISTED);
  assert.equal(f[0].count, 2);
  // and an added line that looks like a header does not hide a later deletion
  const d2 = `diff --git a/x.md b/x.md
--- a/x.md
+++ b/x.md
@@ -1,0 +2,1 @@
+--- a/${R}
diff --git a/${R} b/${R}
--- a/${R}
+++ b/${R}
@@ -3 +3,0 @@
-gone
`;
  assert.equal(checkDiff(d2, LISTED)[0].count, 1);
});

test("deleting a listed file, an empty listed file, or renaming it away is flagged", () => {
  const del = `diff --git a/${R} b/${R}
deleted file mode 100644
index 1111111..0000000
--- a/${R}
+++ /dev/null
@@ -1,2 +0,0 @@
-a
-b
`;
  assert.deepEqual(checkDiff(del, LISTED).map((f) => f.kind).sort(), ["file-deleted", "lines"]);
  const empty = `diff --git a/docs/release/BUILD_GATE_2026-11-08.md b/docs/release/BUILD_GATE_2026-11-08.md
deleted file mode 100644
index e69de29..0000000
`;
  assert.equal(checkDiff(empty, LISTED)[0].kind, "file-deleted");
  const ren = `diff --git a/${R} b/docs/agents/cto/MOVED.md
similarity index 100%
rename from ${R}
rename to docs/agents/cto/MOVED.md
`;
  assert.equal(checkDiff(ren, LISTED)[0].kind, "renamed-away");
});

test("a new file with the listed name is not a deletion", () => {
  const add = `diff --git a/${R} b/${R}
new file mode 100644
--- /dev/null
+++ b/${R}
@@ -0,0 +1,2 @@
+a
+b
`;
  assert.deepEqual(checkDiff(add, LISTED), []);
});

test("empty and missing diff are clean", () => {
  assert.deepEqual(checkDiff("", LISTED), []);
  assert.deepEqual(checkDiff(undefined, LISTED), []);
});

test("output strips control characters from a deleted line", () => {
  const d = `diff --git a/${R} b/${R}\n--- a/${R}\n+++ b/${R}\n@@ -1 +1,0 @@\n-bad\u001b[31mred\u0007\n`;
  const text = formatFindings(checkDiff(d, LISTED));
  assert.ok(!/[\u0000-\u0008\u000b-\u001f]/.test(text));
  assert.match(text, /bad\[31mred/);
});

test("parseList: shipped list is valid and names the rulings doc; bad lists are refused", () => {
  const files = parseList(readFileSync(DEFAULT_LIST, "utf8"));
  assert.ok(files.includes(R));
  for (const bad of ["not json", "{}", '{"files":[]}', '{"files":["../x.md"]}', '{"files":["/etc/x"]}', '{"files":[1]}', '{"files":["a//b"]}']) {
    assert.throws(() => parseList(bad), /append-only list/);
  }
});

test("parseArgs refuses option-looking refs and unknown flags", () => {
  assert.throws(() => parseArgs(["--base", "--output=x"]), /plain git refs/);
  assert.throws(() => parseArgs(["--nope"]), /unknown argument/);
  assert.equal(parseArgs([]).base, "origin/develop");
});

test("main exit codes: 0 clean, 1 deletion, 2 cannot run", async () => {
  const quiet = { out: () => {}, err: () => {} };
  assert.equal(await main([], { diff: append, ...quiet }), 0);
  const errs = [];
  assert.equal(await main([], { diff: edit, out: () => {}, err: (s) => errs.push(s) }), 1);
  assert.match(errs[0], /FAIL/);
  assert.equal(await main(["--list", "/nonexistent/list.json"], { diff: append, ...quiet }), 2);
  assert.equal(await main(["--base", "-x"], { diff: append, ...quiet }), 2);
});

test("end to end in a temp git repo: git diff base...head sees a deletion and an append", async () => {
  const dir = mkdtempSync(join(tmpdir(), "aoc-"));
  const git = (...a) => execFileSync("git", ["-C", dir, "-c", "user.email=t@example.com", "-c", "user.name=t", ...a], { encoding: "utf8" });
  git("init", "-q", "-b", "base");
  git("config", "commit.gpgsign", "false");
  writeFileSync(join(dir, "rec.md"), "one\ntwo\nthree\n");
  git("add", "."); git("commit", "-q", "-m", "base");
  git("checkout", "-q", "-b", "pr");
  writeFileSync(join(dir, "rec.md"), "one\nthree\nfour\n");
  git("commit", "-q", "-am", "edit");
  const diff = git("diff", "--no-color", "--unified=0", "base...pr");
  const f = checkDiff(diff, ["rec.md"]);
  assert.equal(f[0].count, 1);
  assert.equal(f[0].samples[0].text, "two");
});
