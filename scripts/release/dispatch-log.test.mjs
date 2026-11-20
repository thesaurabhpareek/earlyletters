// Tests for dispatch-log.mjs (HV2-B34). No network, no gh: the API is injected; files are temp files.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseLog, openDispatches, addDispatch, closeDispatch, verifySha, parseArgs, main, LOG_FILE } from "./dispatch-log.mjs";

const SHA1 = "a83634ced2a5ecf32717bf833f941b892fc660b9";
const SHA2 = "c5cfa0cfaa96a0ba97ca5f34629747ab0badf438";
const NOW = new Date("2026-11-20T10:00:00.123Z");
const EMPTY = readFileSync(LOG_FILE, "utf8");
const d = (over = {}) => ({ build: "build-3", workflow: "testflight.yml", sha: SHA1, actor: "ops-agent", ...over });

test("the shipped log file parses and has no open dispatch", () => {
  assert.deepEqual(parseLog(EMPTY), []);
  assert.equal(openDispatches(parseLog(EMPTY)).size, 0);
});

test("add appends one row and keeps the old text as an exact prefix", () => {
  const next = addDispatch(EMPTY, d(), NOW);
  assert.ok(next.startsWith(EMPTY));
  const rows = parseLog(next);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], { seq: 1, build: "build-3", event: "dispatch", workflow: "testflight.yml", sha: SHA1, actor: "ops-agent", time: "2026-11-20T10:00:00Z", note: "" });
});

test("a second open dispatch for the same build is refused, and the message names the first", () => {
  const one = addDispatch(EMPTY, d(), NOW);
  assert.throws(() => addDispatch(one, d({ sha: SHA2, actor: "other" }), NOW), /already has an open dispatch.*row 1.*testflight\.yml.*ops-agent/);
});

test("a different build may be open at the same time", () => {
  const one = addDispatch(EMPTY, d(), NOW);
  const two = addDispatch(one, d({ build: "build-4" }), NOW);
  assert.equal(openDispatches(parseLog(two)).size, 2);
});

test("close frees the build; a new dispatch then works", () => {
  const one = addDispatch(EMPTY, d(), NOW);
  const closed = closeDispatch(one, { build: "build-3", outcome: "cancelled", actor: "ops-agent" }, NOW);
  assert.ok(closed.startsWith(one));
  const rows = parseLog(closed);
  assert.equal(rows[1].event, "close-cancelled");
  assert.equal(rows[1].sha, SHA1, "close copies the sha of the dispatch it closes");
  assert.equal(openDispatches(rows).size, 0);
  const again = addDispatch(closed, d({ sha: SHA2 }), NOW);
  assert.equal(parseLog(again).length, 3);
});

test("close with nothing open, or a bad outcome, is refused", () => {
  assert.throws(() => closeDispatch(EMPTY, { build: "build-3", outcome: "success", actor: "x" }, NOW), /no open dispatch/);
  const one = addDispatch(EMPTY, d(), NOW);
  assert.throws(() => closeDispatch(one, { build: "build-3", outcome: "done", actor: "x" }, NOW), /outcome must be one of/);
});

test("sha must be 40 lowercase hex: prefix, uppercase, 41 chars, empty all fail", () => {
  for (const sha of [SHA1.slice(0, 8), SHA1.toUpperCase(), `${SHA1}0`, ""]) {
    assert.throws(() => addDispatch(EMPTY, d({ sha }), NOW), /sha is not valid/);
  }
});

test("fields reject pipes, newlines, non-ASCII and dashes outside ASCII", () => {
  assert.throws(() => addDispatch(EMPTY, d({ note: "a | b" }), NOW), /no pipe/);
  assert.throws(() => addDispatch(EMPTY, d({ note: "a\nb" }), NOW), /printable ASCII/);
  assert.throws(() => addDispatch(EMPTY, d({ note: "a \u2014 b" }), NOW), /printable ASCII/);
  assert.throws(() => addDispatch(EMPTY, d({ actor: "x|y" }), NOW), /actor/);
  assert.throws(() => addDispatch(EMPTY, d({ workflow: "../x.yml" }), NOW), /workflow/);
  assert.throws(() => addDispatch(EMPTY, d({ time: "yesterday" }), NOW), /time/);
});

test("parseLog refuses a gap in Seq, a short row, and a row after prose", () => {
  const one = addDispatch(EMPTY, d(), NOW);
  assert.throws(() => parseLog(one.replace("| 1 |", "| 2 |")), /Seq must run/);
  assert.throws(() => parseLog(`${EMPTY}| 1 | b | dispatch |\n`), /expected 8/);
  assert.throws(() => parseLog(`${one}\nsome prose\n`), /not a table row/);
  assert.throws(() => parseLog("no table here"), /header not found/);
});

test("a hand-edited log with two open dispatches fails check", () => {
  const one = addDispatch(EMPTY, d(), NOW);
  const row = "| 2 | build-3 | dispatch | testflight.yml | " + SHA2 + " | other | 2026-11-20T11:00:00Z | |\n";
  assert.throws(() => openDispatches(parseLog(one + row)), /two open dispatches/);
});

test("verifySha: exists, mismatch and refused reads", async () => {
  await verifySha(SHA1, { api: async (p) => { assert.equal(p, `repos/thesaurabhpareek/earlyletters/commits/${SHA1}`); return { sha: SHA1 }; } });
  await assert.rejects(verifySha(SHA1, { api: async () => ({ sha: SHA2 }) }), /does not match/);
  await assert.rejects(verifySha(SHA1, { api: async () => { throw new Error("404"); } }), /could not be read/);
});

test("parseArgs: unknown flag, missing value, bad repo", () => {
  assert.throws(() => parseArgs(["add", "--force"]), /unknown argument/);
  assert.throws(() => parseArgs(["add", "--build"]), /needs a value/);
  assert.throws(() => parseArgs(["list", "--repo", "x"]), /owner\/name/);
});

test("main: add, refuse second add, list --open, close, check, on a temp copy", async () => {
  const f = join(mkdtempSync(join(tmpdir(), "dl-")), "log.md");
  copyFileSync(LOG_FILE, f);
  const out = [];
  const run = (argv) => main(argv, { file: f, now: NOW, out: (s) => out.push(s) });
  await run(["add", "--build", "build-3", "--workflow", "testflight.yml", "--sha", SHA1, "--actor", "ops-agent"]);
  await assert.rejects(run(["add", "--build", "build-3", "--workflow", "testflight.yml", "--sha", SHA2, "--actor", "b"]), /already has an open dispatch/);
  await run(["list", "--open"]);
  assert.match(out.at(-1), /^1 build-3 dispatch testflight\.yml /);
  await run(["close", "--build", "build-3", "--outcome", "success", "--actor", "ops-agent"]);
  await run(["check"]);
  assert.equal(out.at(-1), "ok: 2 rows");
  await run(["add", "--build", "build-9", "--workflow", "testflight.yml", "--sha", SHA2, "--actor", "a"]);
  const text = readFileSync(f, "utf8");
  assert.equal(text.match(/\n\| \d+ \|/g).length, 3);
  await assert.rejects(main(["add", "--build", "b5", "--workflow", "t.yml", "--sha", SHA2, "--actor", "a", "--verify-sha"], { file: f, now: NOW, api: async () => { throw new Error("403"); } }), /could not be read/);
  assert.equal(readFileSync(f, "utf8"), text, "a refused add writes nothing");
});

test("actor is a short handle: letters, digits, hyphen, underscore, 1 to 40", () => {
  addDispatch(EMPTY, d({ actor: "a-".repeat(20) }), NOW);
  for (const actor of ["a-".repeat(20) + "b", "", "Jane Doe", "jane.doe", "jane@x", "caf\u00e9"]) {
    assert.throws(() => addDispatch(EMPTY, d({ actor }), NOW), /actor/, JSON.stringify(actor));
  }
  const one = addDispatch(EMPTY, d(), NOW);
  assert.throws(() => closeDispatch(one, { build: "build-3", outcome: "success", actor: "Jane Doe" }, NOW), /actor/);
});

test("note is capped at 120 characters", () => {
  addDispatch(EMPTY, d({ note: "n ".repeat(60).trim() }), NOW);
  addDispatch(EMPTY, d({ note: "x".repeat(31) + " " + "y ".repeat(44).trim() }), NOW);
  assert.throws(() => addDispatch(EMPTY, d({ note: "a b ".repeat(31) }), NOW), /limit is 120/);
  const one = addDispatch(EMPTY, d(), NOW);
  assert.throws(() => closeDispatch(one, { build: "build-3", outcome: "success", actor: "x", note: "a b ".repeat(31) }, NOW), /limit is 120/);
});

test("note and actor refuse anything that looks like a token", () => {
  const hex = "0123456789abcdef".repeat(2);
  const b64 = "Zm9vYmFyYmF6cXV4" + "Zm9vYmFyYmF6cXV4";
  for (const note of [`key ${hex}`, `key ${b64}`, "ghp_abc", "use github_pat_abc", "sk-abc", "xoxb-1", "see ghp_x"]) {
    assert.throws(() => addDispatch(EMPTY, d({ note }), NOW), /looks like a token/, note);
  }
  assert.throws(() => addDispatch(EMPTY, d({ actor: hex }), NOW), /looks like a token/);
  assert.throws(() => addDispatch(EMPTY, d({ actor: "sk-ops" }), NOW), /looks like a token/);
  addDispatch(EMPTY, d({ note: "task-1 retry after 31 chars " + "a".repeat(31) }), NOW);
});

test("main refuses a bad actor or note and writes nothing", async () => {
  const f = join(mkdtempSync(join(tmpdir(), "dl-")), "log.md");
  copyFileSync(LOG_FILE, f);
  const before = readFileSync(f, "utf8");
  await assert.rejects(main(["add", "--build", "b1", "--workflow", "t.yml", "--sha", SHA1, "--actor", "Jane Doe"], { file: f, now: NOW }), /actor/);
  await assert.rejects(main(["add", "--build", "b1", "--workflow", "t.yml", "--sha", SHA1, "--actor", "ops", "--note", "ghp_x"], { file: f, now: NOW }), /token/);
  assert.equal(readFileSync(f, "utf8"), before);
});

test("the shipped doc states the empty start, the late entry rule and the field rules", () => {
  assert.match(EMPTY, /Starts empty on 20 Nov 2026/);
  assert.match(EMPTY, /not backfilled/);
  assert.match(EMPTY, /late entry/);
  assert.match(EMPTY, /at most 120 characters/);
  assert.match(EMPTY, /ghp_, github_pat_, sk- and xox/);
});
