// Run: node --test agents/evals/calibration/score.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadKey, matches, scoreReview, scoreAll } from "./score.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const key = loadKey();

test("calibration set: 6 defective + 2 clean patches, each with a key entry and a patch file", () => {
  const names = Object.keys(key.patches);
  assert.equal(names.filter((n) => key.patches[n].verdict === "ship").length, 2);
  assert.equal(names.filter((n) => key.patches[n].verdict === "fix first").length, 6);
  for (const n of names) assert.ok(existsSync(join(HERE, "patches", `${n}.patch`)), n);
  assert.deepEqual(readdirSync(join(HERE, "patches")).map((f) => f.replace(/\.patch$/, "")).sort(), names.sort());
  for (const [n, e] of Object.entries(key.patches)) {
    assert.equal(e.defects.length > 0, e.verdict === "fix first", `${n}: defects iff fix first`);
    for (const d of e.defects) assert.ok(d.start <= d.end && d.description && key.severities.includes(d.severity), d.id);
  }
});

test("match is on file and line overlap, not wording; the slack is two lines", () => {
  const d = { file: "a/b.ts", start: 10, end: 12 };
  assert.equal(matches({ file: "a/b.ts", line: 11 }, d), true);
  assert.equal(matches({ file: "./a/b.ts", line: 14 }, d), true);
  assert.equal(matches({ file: "a/b.ts", line: 15 }, d), false);
  assert.equal(matches({ file: "a/b.ts", line: 1, end_line: 10 }, d), true);
  assert.equal(matches({ file: "a/c.ts", line: 11 }, d), false);
  assert.equal(matches({ file: "a/b.ts", line: 15 }, d, 3), true);
});

test("duplicates count once; nits are not false positives; unmatched majors are", () => {
  const r = scoreReview({ patch: "d6-privacy-leak", verdict: "fix first", findings: [
    { file: "apps/mobile/src/lib/transcription-queue/index.ts", line: 486, severity: "blocker" },
    { file: "apps/mobile/src/lib/transcription-queue/index.ts", line: 487, severity: "major" },
    { file: "apps/mobile/src/lib/transcription-queue/index.ts", line: 10, severity: "nit" },
    { file: "apps/mobile/src/lib/transcription-queue/index.ts", line: 10, severity: "major" },
  ] }, key);
  assert.deepEqual([r.found, r.falsePositives, r.verdictCorrect], [1, 1, true]);
});

test("a reviewer that ships everything scores 0 recall and half the verdicts wrong; one that blocks everything fails the clean two", () => {
  const all = (verdict) => Object.keys(key.patches).map((patch) => ({ patch, verdict, findings: [] }));
  const ships = scoreAll(all("ship"), key);
  assert.deepEqual([ships.recall, ships.verdictAccuracy], [0, 0.25]);
  const blocks = scoreAll(all("fix first"), key);
  assert.deepEqual([blocks.recall, blocks.verdictAccuracy, blocks.cleanShipped], [0, 0.75, 0]);
});

test("worked example in README: 4 of 6 found, 2 false positives, 6 of 8 verdicts right", () => {
  const res = scoreAll(JSON.parse(readFileSync(join(HERE, "example", "worked-example.findings.json"), "utf8")), key);
  assert.equal(res.rows.reduce((n, r) => n + r.found, 0), 4);
  assert.equal(res.falsePositives, 2);
  assert.equal(res.verdictAccuracy, 0.75);
  assert.equal(res.cleanShipped, 1);
  assert.deepEqual(res.missingPatches, []);
});

test("bad input fails loudly: unknown patch, bad verdict, duplicate patch, unknown severity", () => {
  assert.throws(() => scoreReview({ patch: "nope", verdict: "ship", findings: [] }, key), /unknown patch/);
  assert.throws(() => scoreReview({ patch: "c1-trust-tests", verdict: "maybe", findings: [] }, key), /verdict/);
  assert.throws(() => scoreReview({ patch: "c1-trust-tests", verdict: "ship", findings: [{ file: "x", line: 1, severity: "huge" }] }, key), /severity/);
  const r = { patch: "c1-trust-tests", verdict: "ship", findings: [] };
  assert.throws(() => scoreAll([r, r], key), /twice/);
  assert.deepEqual(scoreAll([r], key).missingPatches.length, 7);
});

// The key's line numbers are post-image lines; prove each range touches a line the patch adds, so a
// stale key (after a re-pin) fails here rather than silently scoring a reviewer wrong.
function addedLines(patchText) {
  const out = new Map(); // file -> Set of post-image line numbers
  let file = null, n = 0;
  for (const l of patchText.split("\n")) {
    const f = l.match(/^\+\+\+ b\/(.*)$/);
    if (f) { file = f[1]; out.set(file, new Set()); continue; }
    const h = l.match(/^@@ -\d+(?:,\d+)? \+(\d+)/);
    if (h) { n = Number(h[1]); continue; }
    if (!file || !n) continue;
    if (l.startsWith("+")) { out.get(file).add(n); n++; } else if (l.startsWith(" ")) n++;
  }
  return out;
}

test("every key range covers a line its patch adds", () => {
  for (const [name, e] of Object.entries(key.patches)) {
    const added = addedLines(readFileSync(join(HERE, "patches", `${name}.patch`), "utf8"));
    for (const d of e.defects) {
      const lines = added.get(d.file);
      assert.ok(lines, `${d.id}: patch does not touch ${d.file}`);
      assert.ok([...lines].some((l) => l >= d.start && l <= d.end), `${d.id}: range ${d.start}-${d.end} adds no line`);
    }
  }
});
