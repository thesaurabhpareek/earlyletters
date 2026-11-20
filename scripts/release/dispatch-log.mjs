#!/usr/bin/env node
// Build dispatch log (HV2-B34, owner: ops). One append-only table in docs/release/DISPATCH-LOG.md.
// Each build dispatch records workflow, full 40-char sha, actor and time. The script refuses a
// second open dispatch for the same build. It writes that one file and starts nothing.
//
// Usage:
//   node scripts/release/dispatch-log.mjs add --build <id> --workflow <file.yml> --sha <40 hex> --actor <name> [--time <ISO UTC>] [--note <text>] [--verify-sha] [--repo owner/name]
//   node scripts/release/dispatch-log.mjs close --build <id> --outcome success|failed|cancelled|superseded --actor <name> [--time <ISO UTC>] [--note <text>]
//   node scripts/release/dispatch-log.mjs list [--open] [--build <id>]
//   node scripts/release/dispatch-log.mjs check
//
// Security: --verify-sha is one GET through `gh api` (REST; GraphQL is blocked). No token is read
// or printed. All input is validated (ASCII, no pipe, no newline) before it reaches the file.
import { execFile } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_REPO = "thesaurabhpareek/earlyletters";
export const LOG_FILE = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "docs", "release", "DISPATCH-LOG.md");
export const OUTCOMES = ["success", "failed", "cancelled", "superseded"];
const HEADER = "| Seq | Build | Event | Workflow | Sha | Actor | Time (UTC) | Note |";
const SEP = "|---|---|---|---|---|---|---|---|";
const TIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const SHA_RE = /^[0-9a-f]{40}$/;
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const WORKFLOW_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*\.ya?ml$/;
const ASCII_CELL = /^[\x20-\x7e]*$/;

const fail = (m) => { throw new Error(m); };

/** Parse every data row of the table. Throws on a malformed row. */
export function parseLog(text) {
  const lines = String(text).replace(/\r/g, "").split("\n");
  const at = lines.findIndex((l) => l.trim() === HEADER);
  if (at < 0) fail("dispatch log: table header not found");
  if (lines[at + 1]?.trim() !== SEP) fail("dispatch log: table separator missing");
  const rows = [];
  for (let i = at + 2; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") continue;
    if (!line.startsWith("|")) fail(`dispatch log: line ${i + 1} is not a table row (the table must be last)`);
    const cells = line.replace(/^\||\|\s*$/g, "").split("|").map((c) => c.trim());
    if (cells.length !== 8) fail(`dispatch log: line ${i + 1} has ${cells.length} cells, expected 8`);
    const [seq, build, event, workflow, sha, actor, time, note] = cells;
    if (!/^\d+$/.test(seq)) fail(`dispatch log: line ${i + 1} bad Seq`);
    if (!ID_RE.test(build)) fail(`dispatch log: line ${i + 1} bad Build`);
    if (event !== "dispatch" && !OUTCOMES.some((o) => event === `close-${o}`)) fail(`dispatch log: line ${i + 1} bad Event`);
    if (!WORKFLOW_RE.test(workflow)) fail(`dispatch log: line ${i + 1} bad Workflow`);
    if (!SHA_RE.test(sha)) fail(`dispatch log: line ${i + 1} sha must be 40 lowercase hex characters`);
    if (!ID_RE.test(actor)) fail(`dispatch log: line ${i + 1} bad Actor`);
    if (!TIME_RE.test(time)) fail(`dispatch log: line ${i + 1} bad Time`);
    rows.push({ seq: Number(seq), build, event, workflow, sha, actor, time, note });
  }
  rows.forEach((r, i) => { if (r.seq !== i + 1) fail(`dispatch log: Seq must run 1, 2, 3 without gaps (row ${i + 1} has ${r.seq})`); });
  return rows;
}

/** Open dispatches: a dispatch row with no later close row for the same build. Check also fails on a close with nothing open. */
export function openDispatches(rows) {
  const open = new Map();
  for (const r of rows) {
    if (r.event === "dispatch") {
      if (open.has(r.build)) fail(`dispatch log: build ${r.build} has two open dispatches (rows ${open.get(r.build).seq} and ${r.seq})`);
      open.set(r.build, r);
    } else {
      if (!open.has(r.build)) fail(`dispatch log: row ${r.seq} closes build ${r.build}, which has no open dispatch`);
      open.delete(r.build);
    }
  }
  return open;
}

function cell(name, v, re) {
  const s = String(v ?? "");
  if (!ASCII_CELL.test(s) || s.includes("|")) fail(`${name} must be printable ASCII with no pipe`);
  if (re && !re.test(s)) fail(`${name} is not valid: ${s || "(empty)"}`);
  return s;
}

const nowIso = (now) => (now ?? new Date()).toISOString().replace(/\.\d{3}Z$/, "Z");

function appendRow(text, row) {
  const body = text.endsWith("\n") ? text : `${text}\n`;
  const cells = [row.seq, row.build, row.event, row.workflow, row.sha, row.actor, row.time, row.note];
  return `${body}| ${cells.join(" | ")} |\n`;
}

/** Returns the new file text. The old text is always an exact prefix of it. */
export function addDispatch(text, { build, workflow, sha, actor, time, note = "" }, now) {
  const rows = parseLog(text);
  const open = openDispatches(rows);
  build = cell("build", build, ID_RE);
  if (open.has(build)) {
    const o = open.get(build);
    fail(`build ${build} already has an open dispatch (row ${o.seq}: ${o.workflow} at ${o.sha} by ${o.actor}, ${o.time}). Close it first.`);
  }
  const row = {
    seq: rows.length + 1, build, event: "dispatch",
    workflow: cell("workflow", workflow, WORKFLOW_RE),
    sha: cell("sha", sha, SHA_RE),
    actor: cell("actor", actor, ID_RE),
    time: cell("time", time ?? nowIso(now), TIME_RE),
    note: cell("note", note),
  };
  return appendRow(text, row);
}

export function closeDispatch(text, { build, outcome, actor, time, note = "" }, now) {
  const rows = parseLog(text);
  const open = openDispatches(rows);
  build = cell("build", build, ID_RE);
  if (!OUTCOMES.includes(outcome)) fail(`outcome must be one of ${OUTCOMES.join(", ")}`);
  const o = open.get(build);
  if (!o) fail(`build ${build} has no open dispatch to close`);
  const row = {
    seq: rows.length + 1, build, event: `close-${outcome}`, workflow: o.workflow, sha: o.sha,
    actor: cell("actor", actor, ID_RE), time: cell("time", time ?? nowIso(now), TIME_RE), note: cell("note", note),
  };
  return appendRow(text, row);
}

/** One GET: the commit must exist and its full sha must equal the one given. */
export async function verifySha(sha, { api = ghApi, repo = DEFAULT_REPO } = {}) {
  let c;
  try { c = await api(`repos/${repo}/commits/${sha}`); } catch { fail(`sha ${sha} could not be read from ${repo} (not found, or the read was refused)`); }
  if (c?.sha !== sha) fail(`sha ${sha} does not match the commit the API returned`);
}

function ghApi(path) {
  return new Promise((resolve, reject) => {
    execFile("gh", ["api", "-X", "GET", path], { maxBuffer: 16 * 1024 * 1024 }, (err, stdout) => {
      if (err) return reject(new Error(`gh api ${path.split("?")[0]} failed`));
      try { resolve(JSON.parse(stdout)); } catch { reject(new Error("gh api: not JSON")); }
    });
  });
}

export function parseArgs(argv) {
  const [cmd, ...rest] = argv;
  const o = { cmd, repo: DEFAULT_REPO, open: false, verifySha: false };
  const valued = { "--build": "build", "--workflow": "workflow", "--sha": "sha", "--actor": "actor", "--time": "time", "--note": "note", "--outcome": "outcome", "--repo": "repo" };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--open") o.open = true;
    else if (a === "--verify-sha") o.verifySha = true;
    else if (valued[a]) { o[valued[a]] = rest[++i]; if (o[valued[a]] === undefined) fail(`${a} needs a value`); }
    else fail(`unknown argument ${a}`);
  }
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(o.repo)) fail("--repo must look like owner/name");
  return o;
}

export async function main(argv = process.argv.slice(2), { file = LOG_FILE, api = ghApi, now, out = console.log } = {}) {
  const o = parseArgs(argv);
  const text = readFileSync(file, "utf8");
  if (o.cmd === "add") {
    if (o.verifySha) await verifySha(o.sha, { api, repo: o.repo });
    writeFileSync(file, addDispatch(text, o, now));
    out(`added dispatch for build ${o.build} at ${o.sha}`);
  } else if (o.cmd === "close") {
    writeFileSync(file, closeDispatch(text, o, now));
    out(`closed build ${o.build}: ${o.outcome}`);
  } else if (o.cmd === "list") {
    const rows = parseLog(text);
    const shown = o.open ? [...openDispatches(rows).values()] : rows;
    for (const r of shown.filter((r) => !o.build || r.build === o.build)) out(`${r.seq} ${r.build} ${r.event} ${r.workflow} ${r.sha} ${r.actor} ${r.time}`);
  } else if (o.cmd === "check") {
    const rows = parseLog(text);
    openDispatches(rows);
    out(`ok: ${rows.length} rows`);
  } else fail("usage: dispatch-log.mjs add|close|list|check (see the header of this file)");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
