// Diff sanity gate. Run: node --test 'scripts/agents/*.test.mjs'
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkDiff, explain, patchEmpties } from "./gates.mjs";

const SCOPE = "docs/agents/hardening/scope-and-drift.md";
const lines = (n) => Array.from({ length: n }, (_, i) => `-line ${i + 1}`).join("\n");
const file = (over) => ({ filename: "a.md", status: "modified", additions: 0, deletions: 0, changes: 0, ...over });
const kinds = (flags) => flags.map((x) => x.kind);

// Shape of PR #297 commit 00134a04 as `gh api pulls/N/files` reports it: a modified file,
// 0 additions, 32 deletions, a single hunk to +0,0. Real base was 4153 bytes / 32 lines.
const emptiedScope = file({ filename: SCOPE, deletions: 32, changes: 32, patch: `@@ -1,32 +0,0 @@\n${lines(32)}` });

test("emptied: the #297 shape (a doc blanked to 0 bytes) is flagged from the patch alone", () => {
  assert.deepEqual(kinds(checkDiff([emptiedScope])), ["emptied"]);
});

test("emptied: also flagged from the base size when the patch is absent", () => {
  const f = file({ filename: SCOPE, deletions: 32, changes: 32 });
  assert.deepEqual(kinds(checkDiff([f], { baseLines: { [SCOPE]: 32 } })), ["emptied"]);
});

test("emptied is not waived by an ordinary allow entry, only by one that names it", () => {
  const allow = [{ path: SCOPE, reason: "doc merged into chapter 09" }];
  assert.deepEqual(kinds(checkDiff([emptiedScope], { allow })), ["emptied"]);
  assert.deepEqual(checkDiff([emptiedScope], { allow: [{ ...allow[0], flags: ["emptied"] }] }), []);
});

test("patchEmpties reads only the new-side +0,0 header", () => {
  assert.equal(patchEmpties("@@ -1,3 +0,0 @@\n-a"), true);
  assert.equal(patchEmpties("@@ -0,0 +1,3 @@\n+a"), false);
  assert.equal(patchEmpties("@@ -1,3 +1,2 @@\n-a"), false);
  assert.equal(patchEmpties(undefined), false);
});

test("deleted: a removed file is flagged and says its size when known", () => {
  const f = file({ status: "removed", deletions: 12, changes: 12 });
  const flags = checkDiff([f], { baseLines: { "a.md": 12 } });
  assert.deepEqual(kinds(flags), ["deleted"]);
  assert.match(explain(flags)[0], /^a\.md: deleted \(12 lines\)$/);
});

test("shrunk: more than the share (default 50 percent) is flagged, exactly 50 is not", () => {
  const base = { "a.md": 100 };
  assert.deepEqual(kinds(checkDiff([file({ deletions: 51 })], { baseLines: base })), ["shrunk"]);
  assert.deepEqual(checkDiff([file({ deletions: 50 })], { baseLines: base }), []);
  assert.deepEqual(checkDiff([file({ deletions: 60, additions: 20 })], { baseLines: base }), [], "additions count toward the result");
});

test("shrunk: the share is configurable", () => {
  assert.deepEqual(kinds(checkDiff([file({ deletions: 30 })], { baseLines: { "a.md": 100 }, shrinkShare: 0.25 })), ["shrunk"]);
});

test("shrunk: an allow entry with a reason waives it; one without a reason does not", () => {
  const f = file({ filename: "docs/old.md", deletions: 80 });
  const baseLines = { "docs/old.md": 100 };
  assert.deepEqual(checkDiff([f], { baseLines, allow: [{ path: "docs/*.md", reason: "split into two notes" }] }), []);
  assert.deepEqual(kinds(checkDiff([f], { baseLines, allow: [{ path: "docs/*.md", reason: "  " }] })), ["shrunk"]);
  assert.deepEqual(kinds(checkDiff([f], { baseLines, allow: [{ path: "docs/other.md", reason: "x" }] })), ["shrunk"]);
});

test("rename with large rewrite: flagged by share when the base is known, by changed lines otherwise", () => {
  const r = (over) => file({ status: "renamed", filename: "new.md", previous_filename: "old.md", ...over });
  assert.deepEqual(kinds(checkDiff([r({ deletions: 60, additions: 60, changes: 120 })], { baseLines: { "old.md": 100 } })), ["rename_rewrite"]);
  assert.deepEqual(checkDiff([r({ deletions: 5, additions: 5, changes: 10 })], { baseLines: { "old.md": 100 } }), []);
  assert.deepEqual(kinds(checkDiff([r({ changes: 150 })])), ["rename_rewrite"]);
  assert.deepEqual(checkDiff([r({ changes: 0 })]), [], "a pure rename is clean");
});

test("binary: flagged by extension or a binary patch marker, not by a missing patch alone", () => {
  assert.deepEqual(kinds(checkDiff([file({ filename: "assets/logo.png", status: "added", additions: 0 })])), ["binary"]);
  assert.deepEqual(kinds(checkDiff([file({ patch: "Binary files a/x and b/x differ" })])), ["binary"]);
  assert.deepEqual(checkDiff([file({ filename: "big.md", changes: 5000 })]), []);
});

test("mass deletion: more than N removed files raises one PR-level flag", () => {
  const many = (n) => Array.from({ length: n }, (_, i) => file({ filename: `d/${i}.md`, status: "removed", deletions: 1, changes: 1 }));
  assert.equal(checkDiff(many(10)).some((x) => x.kind === "mass_delete"), false);
  const flags = checkDiff(many(11));
  assert.equal(flags.filter((x) => x.kind === "mass_delete").length, 1);
  assert.equal(flags.find((x) => x.kind === "mass_delete").file, null);
  assert.equal(checkDiff(many(3), { massDeleteFiles: 2 }).some((x) => x.kind === "mass_delete"), true);
});

test("a clean diff and bad input give no flags", () => {
  assert.deepEqual(checkDiff([file({ additions: 10, deletions: 2, changes: 12, patch: "@@ -1,5 +1,13 @@\n+x" })], { baseLines: { "a.md": 50 } }), []);
  assert.deepEqual(checkDiff(undefined), []);
  assert.deepEqual(checkDiff([null, {}, { filename: 3 }]), []);
});

test("explain gives one short line per flag, with no code spans or newlines", () => {
  const out = explain([{ kind: "emptied", file: "a`b`\nc.md", detail: "emptied" }, { kind: "mass_delete", file: null, detail: "12 files deleted (limit 10)" }]);
  assert.equal(out.length, 2);
  assert.equal(out[0], "a b c.md: emptied");
  assert.equal(out[1], "12 files deleted (limit 10)");
  assert.deepEqual(explain(undefined), []);
});
