// Tests for the eval runner. Toy tasks only: no network, no model calls.
import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { discoverTasks, main, parseArgs, runTask, validateTask } from "./runner.mjs";
import { summarizeClass, summarizeTrials } from "./stats.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "test-fixtures", "tasks");
const CAND = (f) => `node ${join(HERE, "test-fixtures", "candidates", f)}`;
const scratch = () => mkdtempSync(join(tmpdir(), "evalrunner-test-"));
const one = (id) => discoverTasks(ROOT, { taskFilter: id })[0];
const quiet = () => {};

// ---- statistics ----

test("pass@1, pass@k and pass^k from k trials: a mixed record is reachable but not reliable", () => {
  const s = summarizeTrials(["pass", "fail", "pass"]);
  assert.equal(s.pass_at_1, 2 / 3);
  assert.equal(s.pass_at_k, true);
  assert.equal(s.pass_hat_k, false);
});

test("all-pass is reliable, and all-fail over 3 trials is flagged as a possibly broken task or grader", () => {
  assert.equal(summarizeTrials(["pass", "pass", "pass"]).pass_hat_k, true);
  const z = summarizeTrials(["fail", "fail", "fail"]);
  assert.equal(z.pass_at_k, false);
  assert.ok(z.flags.includes("all-fail-check-task-and-grader"));
});

test("unknown trials are neither pass nor fail: excluded from pass@1, and leave undecided metrics unresolved", () => {
  const s = summarizeTrials(["pass", "unknown", "fail"]);
  assert.equal(s.pass_at_1, 0.5);
  assert.equal(s.unknown, 1);
  const onlyUnknown = summarizeTrials(["unknown", "unknown", "unknown"]);
  assert.equal(onlyUnknown.pass_at_1, null);
  assert.equal(onlyUnknown.pass_at_k, null);
  assert.equal(onlyUnknown.pass_hat_k, null);
  assert.equal(summarizeTrials(["pass", "pass", "unknown"]).pass_hat_k, null);
  assert.equal(summarizeTrials(["pass", "unknown", "fail"]).pass_hat_k, false);
  assert.equal(summarizeTrials(["unknown", "unknown", "unknown"]).flags.includes("all-fail-check-task-and-grader"), false);
});

test("class rollup uses tasks as the unit and counts unresolved tasks", () => {
  const c = summarizeClass([summarizeTrials(["pass", "pass"]), summarizeTrials(["fail", "fail"]), summarizeTrials(["unknown", "unknown"])]);
  assert.equal(c.tasks, 3);
  assert.equal(c.pass_at_1, 0.5);
  assert.equal(c.pass_at_k, 0.5);
  assert.equal(c.unresolved_tasks, 1);
  assert.equal(c.unknown_trials, 2);
});

// ---- discovery ----

test("discovery finds class/task directories and reports malformed ones instead of skipping them", () => {
  const ids = discoverTasks(ROOT).map((t) => `${t.class}/${t.id}`);
  assert.deepEqual(ids, ["toy/broken-trivial-001", "toy/flaky-grader-001", "toy/good-001", "toy/unknown-001"]);
  const tmp = scratch();
  try {
    mkdirSync(join(tmp, "c", "t1", "fixture"), { recursive: true });
    writeFileSync(join(tmp, "c", "t1", "meta.json"), JSON.stringify({ id: "other", class: "c", k: 0 }));
    const t = discoverTasks(tmp)[0];
    const p = t.malformed.join("|");
    for (const w of ["missing task.md", "missing grader.mjs", "missing reference/", "lacks \"source\"", "differs from directory", "meta.k"]) assert.match(p, new RegExp(w));
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});

// ---- validate mode ----

test("validate: a sound task fails raw and passes with reference", () => {
  const v = validateTask(one("good-001"));
  assert.equal(v.status, "ok");
  assert.deepEqual(v.raw.map((r) => r.outcome), ["fail", "fail", "fail"]);
  assert.deepEqual(v.reference.map((r) => r.outcome), ["pass", "pass", "pass"]);
});

test("validate: a task whose grader passes the raw fixture is reported broken", () => {
  const v = validateTask(one("broken-trivial-001"));
  assert.equal(v.status, "broken");
  assert.match(v.reasons.join(), /passes on the raw fixture/);
});

test("validate: a grader that changes its verdict between identical runs is reported flaky", () => {
  const tmp = scratch();
  process.env.EVAL_FLAKY_COUNTER = join(tmp, "count");
  try {
    const v = validateTask(one("flaky-grader-001"));
    assert.equal(v.status, "broken");
    assert.match(v.reasons.join(), /flaky grader on raw fixture/);
  } finally { delete process.env.EVAL_FLAKY_COUNTER; rmSync(tmp, { recursive: true, force: true }); }
});

test("validate: an unknown verdict on the fixture is broken, not silently ok", () => {
  const v = validateTask(one("unknown-001"));
  assert.equal(v.status, "broken");
  assert.match(v.reasons.join(), /returned unknown/);
});

test("validate: a reference that does not pass is reported as unsolvable", () => {
  const tmp = scratch();
  try {
    cpSync(join(ROOT, "toy", "good-001"), join(tmp, "toy", "good-001"), { recursive: true });
    writeFileSync(join(tmp, "toy", "good-001", "reference", "notes.txt"), "wrong\n");
    const v = validateTask(discoverTasks(tmp)[0]);
    assert.equal(v.status, "broken");
    assert.match(v.reasons.join(), /fails with reference applied/);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});

test("validate: a grader that throws is an error, and a grader returning junk is an error", () => {
  const tmp = scratch();
  try {
    for (const [name, body] of [["throws", `export function grade() { throw new Error("boom"); }`], ["junk", `export function grade() { return { pass: "yes" }; }`]]) {
      cpSync(join(ROOT, "toy", "good-001"), join(tmp, "toy", name), { recursive: true });
      writeFileSync(join(tmp, "toy", name, "grader.mjs"), body);
      writeFileSync(join(tmp, "toy", name, "meta.json"), JSON.stringify({ id: name, class: "toy", source: "synthetic", roles: [], k: 1 }));
    }
    const [junk, throws] = discoverTasks(tmp).map((t) => validateTask(t, { trials: 1 }));
    assert.match(throws.reasons.join(), /grader error on raw fixture: grader threw: boom/);
    assert.match(junk.reasons.join(), /grader error/);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});

test("validate never mutates the committed fixture", () => {
  const f = join(ROOT, "toy", "good-001", "fixture", "notes.txt");
  const before = readFileSync(f, "utf8");
  validateTask(one("good-001"));
  assert.equal(readFileSync(f, "utf8"), before);
});

// ---- candidate mode ----

test("candidate that solves the task: pass@1, pass@k and pass^k all hold across k=3 trials", () => {
  const r = runTask(one("good-001"), CAND("fixer.mjs"));
  assert.equal(r.k, 3);
  assert.equal(r.pass, 3);
  assert.equal(r.pass_hat_k, true);
});

test("candidate that edits nothing fails every trial and is flagged all-fail", () => {
  const r = runTask(one("good-001"), CAND("noop.mjs"));
  assert.equal(r.fail, 3);
  assert.equal(r.pass_at_k, false);
  assert.ok(r.flags.includes("all-fail-check-task-and-grader"));
});

test("candidate with a mixed record: pass@k true but pass^k false", () => {
  const tmp = scratch();
  process.env.EVAL_ALT_COUNTER = join(tmp, "c");
  try {
    const r = runTask(one("good-001"), CAND("alternate.mjs"), { k: 3 });
    assert.deepEqual(r.trials.map((t) => t.outcome), ["pass", "fail", "pass"]);
    assert.equal(r.pass_at_k, true);
    assert.equal(r.pass_hat_k, false);
  } finally { delete process.env.EVAL_ALT_COUNTER; rmSync(tmp, { recursive: true, force: true }); }
});

test("no state leaks between trials: a file left by trial 1 is invisible to trial 2", () => {
  const r = runTask(one("good-001"), CAND("leakprobe.mjs"), { k: 3 });
  assert.equal(r.pass, 0);
});

test("candidate receives the task.md path and workdir as arguments and env, with the workdir as cwd", () => {
  assert.equal(runTask(one("good-001"), CAND("args.mjs"), { k: 1 }).pass, 1);
});

test("unknown grader verdicts are counted separately from fail", () => {
  const r = runTask(one("unknown-001"), CAND("fixer.mjs"));
  assert.equal(r.unknown, 3);
  assert.equal(r.fail, 0);
  assert.equal(r.pass_at_1, null);
  assert.equal(r.pass_at_k, null);
});

test("trial directories are removed after the run", () => {
  const tmp = scratch();
  try {
    runTask(one("good-001"), CAND("fixer.mjs"), { k: 2, tmpBase: tmp });
    assert.deepEqual(readdirSync(tmp), []);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});

test("a candidate command that fails is still graded by outcome", () => {
  const r = runTask(one("good-001"), "false", { k: 1 });
  assert.equal(r.fail, 1);
  assert.equal(r.trials[0].candidate.exit, 1);
});

// ---- CLI ----

test("parseArgs requires a mode and rejects bad numbers and unknown flags", () => {
  assert.throws(() => parseArgs([]), /choose --validate/);
  assert.throws(() => parseArgs(["--validate", "--bogus"]), /unknown argument/);
  assert.throws(() => parseArgs(["--validate", "--k", "0"]), /positive integer/);
  assert.equal(parseArgs(["--candidate", "x y", "--k", "2"]).candidate, "x y");
});

test("main --validate writes JSON and markdown and exits 1 when any task is broken", () => {
  const out = scratch();
  try {
    const code = main(["--validate", "--root", ROOT, "--out", out], quiet);
    assert.equal(code, 1);
    const j = JSON.parse(readFileSync(join(out, "validate.json"), "utf8"));
    assert.equal(j.ok_count, 1);
    assert.equal(j.broken_count, 3);
    assert.match(readFileSync(join(out, "validate.md"), "utf8"), /\| toy \| good-001 \| fail,fail,fail \| pass,pass,pass \| OK \|/);
    assert.equal(main(["--validate", "--root", ROOT, "--task", "good-001", "--out", out], quiet), 0);
  } finally { rmSync(out, { recursive: true, force: true }); }
});

test("main --candidate writes per-task and per-class results as JSON and a markdown table", () => {
  const out = scratch();
  try {
    const code = main(["--candidate", CAND("fixer.mjs"), "--root", ROOT, "--task", "good-001", "--out", out], quiet);
    assert.equal(code, 0);
    const j = JSON.parse(readFileSync(join(out, "run.json"), "utf8"));
    assert.equal(j.classes.toy.pass_hat_k, 1);
    assert.equal(j.tasks[0].pass, 3);
    const md = readFileSync(join(out, "run.md"), "utf8");
    assert.match(md, /\| toy \| good-001 \| 3 \| 3 \| 0 \| 0 \| 0 \| 100% \| yes \| yes \|/);
    assert.ok(!existsSync(join(out, "work")));
  } finally { rmSync(out, { recursive: true, force: true }); }
});

test("main exits 2 when no task matches, and the CLI file runs under node", async () => {
  assert.equal(main(["--validate", "--root", ROOT, "--task", "nope"], quiet), 2);
  const { spawnSync } = await import("node:child_process");
  const out = scratch();
  try {
    const r = spawnSync(process.execPath, [join(HERE, "runner.mjs"), "--validate", "--root", ROOT, "--task", "good-001", "--out", out], { encoding: "utf8" });
    assert.equal(r.status, 0, r.stdout + r.stderr);
  } finally { rmSync(out, { recursive: true, force: true }); }
});

// Requirement: a reference may delete files via _remove.txt (drift-06 needs it), and an entry can never
// reach outside the workdir. Without the deletion the task is unsolvable and validate reports it broken.
test("validate: _remove.txt lets a deletion-only reference pass and cannot delete outside the workdir", () => {
  const base = scratch();
  const root = join(base, "tasks");
  const dir = join(root, "toy", "rm-001");
  mkdirSync(join(dir, "fixture"), { recursive: true });
  mkdirSync(join(dir, "reference"), { recursive: true });
  writeFileSync(join(dir, "task.md"), "Delete a.txt.\n");
  writeFileSync(join(dir, "fixture", "a.txt"), "stale\n");
  writeFileSync(join(dir, "reference", "_remove.txt"), "a.txt\n../outside.txt\n/etc/hostname\n");
  writeFileSync(join(dir, "grader.mjs"),
    'import { existsSync } from "node:fs"; import { join } from "node:path";\n' +
    'export function grade({ workdir }) { return existsSync(join(workdir, "a.txt")) ? { pass: false, reason: "a.txt still there" } : { pass: true, reason: "removed" }; }\n');
  writeFileSync(join(dir, "meta.json"), JSON.stringify({ id: "rm-001", class: "toy", source: "synthetic", roles: ["writer"], k: 1 }));
  const outside = join(base, "outside.txt");
  writeFileSync(outside, "keep\n");
  const v = validateTask(discoverTasks(root, {})[0]);
  assert.equal(v.status, "ok");
  assert.deepEqual(v.reference.map((r) => r.outcome), ["pass", "pass", "pass"]);
  assert.equal(readFileSync(outside, "utf8"), "keep\n");
  rmSync(base, { recursive: true, force: true });
});
