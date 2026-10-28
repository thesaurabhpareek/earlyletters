#!/usr/bin/env node
// Eval runner (RB-10e). Dependency-free. Makes no model calls: the engine under
// test is whatever `--candidate <cmd>` runs. See README.md for the contracts.
import { spawnSync } from "node:child_process";
import {
  cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { MARK } from "./grade-host.mjs";
import { pct, summarizeClass, summarizeTrials, tri } from "./stats.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const HOST = join(HERE, "grade-host.mjs");
export const DEFAULT_ROOT = resolve(HERE, "../../../agents/evals");
const REQUIRED = ["task.md", "grader.mjs", "meta.json"];
const META_FIELDS = ["id", "class", "source", "roles", "k"];

const q = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

// ---------- discovery ----------

function hasSymlink(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isSymbolicLink()) return p;
    if (e.isDirectory()) {
      const r = hasSymlink(p);
      if (r) return r;
    }
  }
  return null;
}

/** Find tasks under <root>/<class>/<task>/. Problems make a task `malformed`, never silently skipped. */
export function discoverTasks(root, { classFilter, taskFilter } = {}) {
  const tasks = [];
  if (!existsSync(root)) return tasks;
  for (const cls of readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()) {
    if (classFilter && cls !== classFilter) continue;
    for (const id of readdirSync(join(root, cls), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()) {
      if (taskFilter && id !== taskFilter) continue;
      const dir = join(root, cls, id);
      const problems = [];
      for (const f of REQUIRED) if (!existsSync(join(dir, f))) problems.push(`missing ${f}`);
      for (const d of ["fixture", "reference"]) {
        if (!existsSync(join(dir, d)) || !lstatSync(join(dir, d)).isDirectory()) problems.push(`missing ${d}/`);
        else {
          const link = hasSymlink(join(dir, d));
          if (link) problems.push(`symlink in ${d}/ (${link.slice(dir.length + 1)})`);
        }
      }
      let meta = null;
      if (existsSync(join(dir, "meta.json"))) {
        try {
          meta = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8"));
          for (const f of META_FIELDS) if (!(f in meta)) problems.push(`meta.json lacks "${f}"`);
          if (meta.id !== undefined && meta.id !== id) problems.push(`meta.id "${meta.id}" differs from directory "${id}"`);
          if (meta.class !== undefined && meta.class !== cls) problems.push(`meta.class "${meta.class}" differs from directory "${cls}"`);
          if ("k" in meta && !(Number.isInteger(meta.k) && meta.k >= 1 && meta.k <= 50)) problems.push("meta.k must be an integer 1..50");
          if ("roles" in meta && !Array.isArray(meta.roles)) problems.push("meta.roles must be an array");
          if ("source" in meta && (typeof meta.source !== "string" || !meta.source.trim())) problems.push("meta.source must be a non-empty string");
        } catch (e) {
          problems.push(`meta.json is not valid JSON (${e.message})`);
        }
      }
      tasks.push({
        id, class: cls, dir, meta, malformed: problems,
        taskMd: join(dir, "task.md"), graderPath: join(dir, "grader.mjs"),
        fixtureDir: join(dir, "fixture"), referenceDir: join(dir, "reference"),
      });
    }
  }
  return tasks;
}

// ---------- one trial, one fresh directory ----------

/** Make trialdir/work (a copy of fixture/, optionally overlaid with reference/) and trialdir/task.md. */
function prepareTrial(task, { overlayReference = false, tmpBase } = {}) {
  const trialDir = mkdtempSync(join(tmpBase || tmpdir(), "evaltrial-"));
  const workdir = join(trialDir, "work");
  cpSync(task.fixtureDir, workdir, { recursive: true });
  if (overlayReference) cpSync(task.referenceDir, workdir, { recursive: true, force: true });
  // task.md lives beside, not inside, the workdir so the candidate cannot alter what the grader tree sees.
  const taskMd = join(trialDir, "task.md");
  cpSync(task.taskMd, taskMd);
  return { trialDir, workdir, taskMd };
}

/** Grade a workdir in a child process. Never throws; returns {outcome, reason}. */
export function gradeWorkdir(task, workdir, { graderTimeoutMs = 30000 } = {}) {
  const r = spawnSync(process.execPath, [HOST, task.graderPath, workdir], {
    encoding: "utf8", timeout: graderTimeoutMs, maxBuffer: 8 * 1024 * 1024,
  });
  if (r.error || r.signal) return { outcome: "error", reason: `grader process failed (${r.error ? r.error.code || r.error.message : r.signal})` };
  const line = (r.stdout || "").split("\n").reverse().find((l) => l.startsWith(MARK));
  if (!line) return { outcome: "error", reason: `grader produced no result (exit ${r.status})` };
  let msg;
  try { msg = JSON.parse(line.slice(MARK.length)); } catch { return { outcome: "error", reason: "grader result is not JSON" }; }
  if (!msg.ok) return { outcome: "error", reason: `grader threw: ${msg.error}` };
  const g = msg.result;
  if (!g || typeof g !== "object" || typeof g.reason !== "string") return { outcome: "error", reason: "grader must return { pass: boolean, reason: string, unknown?: boolean }" };
  if (g.unknown === true) return { outcome: "unknown", reason: g.reason };
  if (typeof g.pass !== "boolean") return { outcome: "error", reason: "grader result lacks boolean pass" };
  return { outcome: g.pass ? "pass" : "fail", reason: g.reason };
}

export function runCandidateTrial(task, cmd, trial, { tmpBase, keep, candidateTimeoutMs = 600000, graderTimeoutMs } = {}) {
  const t = prepareTrial(task, { tmpBase });
  try {
    const env = {
      ...process.env, EVAL_TASK_MD: t.taskMd, EVAL_WORKDIR: t.workdir, EVAL_TASK_ID: task.id,
      EVAL_CLASS: task.class, EVAL_TRIAL: String(trial), EVAL_K: String(task.meta.k),
    };
    const c = spawnSync(`${cmd} ${q(t.taskMd)} ${q(t.workdir)}`, {
      shell: true, cwd: t.workdir, env, encoding: "utf8", timeout: candidateTimeoutMs, maxBuffer: 16 * 1024 * 1024,
    });
    const candidate = { exit: c.status, timed_out: Boolean(c.error && c.error.code === "ETIMEDOUT") };
    // Outcome-based: grade whatever state the workdir is in, even after a crash or timeout.
    return { trial, ...gradeWorkdir(task, t.workdir, { graderTimeoutMs }), candidate };
  } finally {
    if (!keep) rmSync(t.trialDir, { recursive: true, force: true });
  }
}

export function runSideTrial(task, side, { tmpBase, graderTimeoutMs } = {}) {
  const t = prepareTrial(task, { overlayReference: side === "reference", tmpBase });
  try {
    return gradeWorkdir(task, t.workdir, { graderTimeoutMs });
  } finally {
    rmSync(t.trialDir, { recursive: true, force: true });
  }
}

// ---------- modes ----------

/** A task is sound only if it fails raw, passes with reference, and the grader is repeatable. */
export function validateTask(task, { trials = 3, ...opts } = {}) {
  if (task.malformed.length) return { id: task.id, class: task.class, status: "broken", reasons: task.malformed.map((p) => `malformed: ${p}`), raw: [], reference: [] };
  const raw = Array.from({ length: trials }, () => runSideTrial(task, "raw", opts));
  const ref = Array.from({ length: trials }, () => runSideTrial(task, "reference", opts));
  const reasons = [];
  for (const [name, rs, want, wrong] of [
    ["raw fixture", raw, "fail", "passes on the raw fixture (trivially solved, or grader too lax)"],
    ["reference", ref, "pass", "fails with reference applied (unsolvable, or grader too strict)"],
  ]) {
    const kinds = new Set(rs.map((r) => r.outcome));
    if (kinds.has("error")) reasons.push(`grader error on ${name}: ${rs.find((r) => r.outcome === "error").reason}`);
    else if (kinds.size > 1) reasons.push(`flaky grader on ${name}: got ${rs.map((r) => r.outcome).join(",")}`);
    else if (kinds.has("unknown")) reasons.push(`grader returned unknown on ${name}: ${rs[0].reason}`);
    else if (!kinds.has(want)) reasons.push(`${wrong}`);
  }
  return { id: task.id, class: task.class, status: reasons.length ? "broken" : "ok", reasons, raw, reference: ref };
}

export function runTask(task, cmd, opts = {}) {
  const k = opts.k ?? task.meta.k;
  const trials = Array.from({ length: k }, (_, i) => runCandidateTrial(task, cmd, i + 1, opts));
  const summary = summarizeTrials(trials.map((t) => t.outcome));
  return { id: task.id, class: task.class, k, source: task.meta.source, roles: task.meta.roles, ...summary, trials };
}

// ---------- reports ----------

const esc = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");

export function renderValidateMarkdown(report) {
  const out = [`# Eval task validation`, ``, `Root: \`${report.root}\`. ${report.ok_count} ok, ${report.broken_count} broken.`, ``,
    `| Class | Task | Raw fixture | Reference | Status | Notes |`, `|---|---|---|---|---|---|`];
  const sides = (rs) => (rs.length ? rs.map((r) => r.outcome).join(",") : "n/a");
  for (const t of report.tasks) out.push(`| ${t.class} | ${t.id} | ${sides(t.raw)} | ${sides(t.reference)} | ${t.status.toUpperCase()} | ${esc(t.reasons.join("; "))} |`);
  return out.join("\n") + "\n";
}

export function renderRunMarkdown(report) {
  const out = [`# Eval run`, ``, `Root: \`${report.root}\`. Candidate: \`${report.candidate}\`. ${report.tasks.length} tasks.`, ``,
    `## Per class`, ``, `| Class | Tasks | pass@1 | pass@k | pass^k | Unresolved tasks | Unknown trials | Error trials |`, `|---|---|---|---|---|---|---|---|`];
  for (const [cls, s] of Object.entries(report.classes)) out.push(`| ${cls} | ${s.tasks} | ${pct(s.pass_at_1)} | ${pct(s.pass_at_k)} | ${pct(s.pass_hat_k)} | ${s.unresolved_tasks} | ${s.unknown_trials} | ${s.error_trials} |`);
  out.push(``, `## Per task`, ``, `| Class | Task | k | Pass | Fail | Unknown | Error | pass@1 | pass@k | pass^k | Flags |`, `|---|---|---|---|---|---|---|---|---|---|---|`);
  for (const t of report.tasks) out.push(`| ${t.class} | ${t.id} | ${t.k} | ${t.pass} | ${t.fail} | ${t.unknown} | ${t.error} | ${pct(t.pass_at_1)} | ${tri(t.pass_at_k)} | ${tri(t.pass_hat_k)} | ${esc(t.flags.join(", "))} |`);
  if (report.skipped.length) {
    out.push(``, `## Skipped (malformed)`, ``);
    for (const s of report.skipped) out.push(`- ${s.class}/${s.id}: ${esc(s.problems.join("; "))}`);
  }
  out.push(``, `pass@k: at least one of k trials passed. pass^k: all k passed. Unknown and error trials are excluded from pass@1 and make pass@k or pass^k "unresolved" when they decide the answer.`);
  return out.join("\n") + "\n";
}

// ---------- CLI ----------

export function parseArgs(argv) {
  const o = { mode: null, root: DEFAULT_ROOT, out: null, candidate: null, k: null, validateTrials: 3, keep: false };
  const need = (i) => { if (argv[i + 1] === undefined) throw new Error(`${argv[i]} needs a value`); return argv[i + 1]; };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--validate") o.mode = "validate";
    else if (a === "--candidate") { o.mode = "candidate"; o.candidate = need(i); i++; }
    else if (a === "--root") { o.root = resolve(need(i)); i++; }
    else if (a === "--class") { o.class = need(i); i++; }
    else if (a === "--task") { o.task = need(i); i++; }
    else if (a === "--out") { o.out = resolve(need(i)); i++; }
    else if (a === "--k") { o.k = Number(need(i)); i++; }
    else if (a === "--validate-trials") { o.validateTrials = Number(need(i)); i++; }
    else if (a === "--candidate-timeout") { o.candidateTimeoutMs = Number(need(i)) * 1000; i++; }
    else if (a === "--grader-timeout") { o.graderTimeoutMs = Number(need(i)) * 1000; i++; }
    else if (a === "--keep") o.keep = true;
    else throw new Error(`unknown argument ${a}`);
  }
  if (!o.mode) throw new Error("choose --validate or --candidate <cmd>");
  for (const [n, v] of [["--k", o.k ?? 1], ["--validate-trials", o.validateTrials]]) if (!Number.isInteger(v) || v < 1) throw new Error(`${n} must be a positive integer`);
  return o;
}

export function main(argv, log = console.log) {
  let o;
  try { o = parseArgs(argv); } catch (e) { log(`error: ${e.message}`); log("usage: runner.mjs (--validate | --candidate <cmd>) [--root dir] [--class c] [--task id] [--k n] [--out dir]"); return 2; }
  const out = o.out || join(tmpdir(), "earlyletters-evals");
  mkdirSync(out, { recursive: true });
  const all = discoverTasks(o.root, { classFilter: o.class, taskFilter: o.task });
  if (all.length === 0) { log(`error: no tasks found under ${o.root}`); return 2; }
  const stamp = new Date().toISOString();

  if (o.mode === "validate") {
    const tasks = all.map((t) => validateTask(t, { trials: o.validateTrials, graderTimeoutMs: o.graderTimeoutMs }));
    const broken = tasks.filter((t) => t.status === "broken").length;
    const report = { mode: "validate", generated_at: stamp, root: o.root, ok_count: tasks.length - broken, broken_count: broken, tasks };
    writeFileSync(join(out, "validate.json"), JSON.stringify(report, null, 2) + "\n");
    const md = renderValidateMarkdown(report);
    writeFileSync(join(out, "validate.md"), md);
    log(md); log(`wrote ${join(out, "validate.json")} and validate.md`);
    return broken ? 1 : 0;
  }

  const runnable = all.filter((t) => !t.malformed.length);
  const skipped = all.filter((t) => t.malformed.length).map((t) => ({ id: t.id, class: t.class, problems: t.malformed }));
  const tasks = runnable.map((t) => runTask(t, o.candidate, { k: o.k ?? undefined, keep: o.keep, candidateTimeoutMs: o.candidateTimeoutMs, graderTimeoutMs: o.graderTimeoutMs }));
  const classes = {};
  for (const cls of [...new Set(tasks.map((t) => t.class))]) classes[cls] = summarizeClass(tasks.filter((t) => t.class === cls));
  const report = { mode: "candidate", generated_at: stamp, root: o.root, candidate: o.candidate, classes, tasks, skipped };
  writeFileSync(join(out, "run.json"), JSON.stringify(report, null, 2) + "\n");
  const md = renderRunMarkdown(report);
  writeFileSync(join(out, "run.md"), md);
  log(md); log(`wrote ${join(out, "run.json")} and run.md`);
  return skipped.length ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = main(process.argv.slice(2));
