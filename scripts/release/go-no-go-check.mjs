#!/usr/bin/env node
// Go/no-go page checker (HV2-B43). Reads a filled page and checks its form. It writes nothing.
//
//   node scripts/release/go-no-go-check.mjs [--root DIR] [--now ISO] [--template] [page.md ...]
//
// With no page given it reads every `docs/release/go-no-go/*.md` except TEMPLATE.md and README.md.
// `--template` checks the structure of the template (placeholders allowed).
//
// What a clean run means: the page is well formed. Every row has a mark, a source that exists,
// a date, a status and ruling ids that exist on this checkout. It does not mean the build is ready,
// and it cannot tell whether a source says what the row claims. A person reads the page.
//
// The page never holds the ship call. The founder makes it in chat. A line that looks like one
// ("Decision:", "Verdict:", "Overall:", "Ship:") is an error.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Nine functions, in the order of HV2-B43 in docs/agents/harness-v2/LIFECYCLE.md.
export const FUNCTIONS = ["QA", "Security", "Privacy", "Compliance", "Legal", "Marketing claims", "Support", "Finance", "Design"];
export const COLUMNS = ["Function", "Role", "Source", "Date read", "Mark", "Status", "Ruling id", "Note"];
export const MARKS = ["verified", "unverified", "founder-held"];
export const STATUSES = ["pass", "open", "fail", "n/a"]; // the status words of docs/qa/ALPHA_GO_NO_GO.md
// These rows may read pass only with a ruling id from the matching role: a Claude role's reading
// of a source is not counsel's advice (docs/agents/exec/COUNCIL.md section 5).
export const RULING_PREFIX_FOR_PASS = { Legal: "CLO-", Compliance: "CCO-", Finance: "CFO-" };
// About 5 minutes of reading at 200 words a minute (an estimate, not measured).
export const MAX_WORDS = 900;
export const MAX_LINES = 60;

const ID = /^(?:(?:CTO|CPO|CDesO|CMO|CBO|CFO|CLO|CCO|CPrivO|CISO|CDO|CAIO)-\d+|CR-\d+|D-\d+)$/;
const SHIP_CALL = /^\s*(?:[-*]\s*)?\**(decision|verdict|overall|ship|go\/no-go|result)\**\s*:/i;
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s);
const placeholder = (s) => /<[^>]*>/.test(s) || s === "";

/** Ids of the three logs on this checkout: exec rulings, CTO rulings, founder decisions. */
export function loadRulingIds(root) {
  const ids = new Set();
  const read = (rel) => (existsSync(join(root, rel)) ? readFileSync(join(root, rel), "utf8") : null);
  const exec = read("docs/agents/exec/RULINGS.md");
  const cto = read("docs/agents/cto/RULINGS.md");
  const dec = read("docs/DECISIONS.md");
  for (const text of [exec, cto]) {
    for (const m of (text ?? "").matchAll(/^#{2,3}\s+([A-Za-z]+-\d+)\b/gm)) ids.add(m[1]);
  }
  for (const m of (dec ?? "").matchAll(/^\|\s*(D-\d+)\s*\|/gm)) ids.add(m[1]);
  return { ids, missing: [["docs/agents/exec/RULINGS.md", exec], ["docs/agents/cto/RULINGS.md", cto], ["docs/DECISIONS.md", dec]].filter(([, t]) => t === null).map(([p]) => p) };
}

/** Page text without HTML comments (the how-to block), keeping line numbers by blanking. */
export function stripComments(text) {
  return text.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, " "));
}

/** The table rows, the header values and the line numbers. */
export function parsePage(text) {
  const lines = stripComments(text).split("\n");
  const rows = [];
  let headerSeen = false;
  lines.forEach((line, i) => {
    if (!/^\s*\|/.test(line)) return;
    const cells = line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
    if (/^[-: ]+$/.test(cells.join("")) && cells.every((c) => /^:?-+:?$/.test(c))) return; // separator
    if (!headerSeen && cells[0] === COLUMNS[0]) { headerSeen = true; rows.push({ line: i + 1, header: true, cells }); return; }
    rows.push({ line: i + 1, header: false, cells });
  });
  const field = (name) => {
    const re = new RegExp(`^\\s*${name}\\s*:\\s*(.*)$`, "im");
    const m = lines.join("\n").match(re);
    return m ? m[1].trim() : undefined;
  };
  return { lines, rows, commit: field("Commit"), readOn: field("Read on")?.split(/\s+/)[0] };
}

function sourceProblems(source, root) {
  const out = [];
  const parts = source.split(";").map((s) => s.trim().replace(/^`|`$/g, "")).filter(Boolean);
  if (parts.length === 0) return ["source is empty"];
  for (const p of parts) {
    if (/^https:\/\/\S+$/.test(p)) continue;
    if (/^[a-z]+:\/\//i.test(p)) { out.push(`source "${p}" must be https or a repo path`); continue; }
    const path = p.replace(/[#:].*$/, "");
    if (!existsSync(resolve(root, path))) out.push(`source path "${path}" does not exist in this checkout`);
  }
  return out;
}

/**
 * Check one page. Returns a list of { line, message }.
 * opts: { root, now (ISO), template (bool), rulings ({ids, missing}) }
 */
export function checkPage(text, opts = {}) {
  const { root = ".", template = false } = opts;
  const now = opts.now ? new Date(opts.now) : new Date();
  const todayUtc = now.toISOString().slice(0, 10);
  const rulings = opts.rulings ?? loadRulingIds(root);
  const errs = [];
  const err = (line, message) => errs.push({ line, message });
  const page = parsePage(text);
  const body = page.lines.join("\n");

  if (/[^\x00-\x7f]/.test(text)) {
    const at = text.split("\n").findIndex((l) => /[^\x00-\x7f]/.test(l)) + 1;
    err(at, "non-ASCII character (the page is ASCII only; no em or en dashes)");
  }
  const words = body.split(/\s+/).filter(Boolean).length;
  const nonBlank = page.lines.filter((l) => l.trim() !== "").length;
  if (words > MAX_WORDS) err(1, `page has ${words} words; the cap is ${MAX_WORDS} (about 5 minutes of reading)`);
  if (nonBlank > MAX_LINES) err(1, `page has ${nonBlank} non-blank lines; the cap is ${MAX_LINES}`);
  page.lines.forEach((l, i) => { if (SHIP_CALL.test(l)) err(i + 1, "a ship-call line: the go or no-go call is the founder's, made in chat, and does not go on this page"); });

  if (!template) {
    if (!/^[0-9a-f]{40}$/.test(page.commit ?? "")) err(1, "Commit must be the full 40-character lowercase sha");
    if (!isDate(page.readOn ?? "")) err(1, "Read on must be a date, YYYY-MM-DD");
    else if (page.readOn > todayUtc) err(1, `Read on ${page.readOn} is in the future`);
  }

  const header = page.rows.find((r) => r.header);
  if (!header) { err(1, "no table with the header Function | Role | Source | Date read | Mark | Status | Ruling id | Note"); return errs; }
  if (header.cells.join("|") !== COLUMNS.join("|")) err(header.line, `table header must be exactly: ${COLUMNS.join(" | ")}`);

  const data = page.rows.filter((r) => !r.header);
  const seen = new Set();
  for (const r of data) {
    if (r.cells.length !== COLUMNS.length) { err(r.line, `row has ${r.cells.length} cells; expected ${COLUMNS.length}`); continue; }
    const [fn, role, source, dateRead, mark, status, ruling, note] = r.cells;
    if (!FUNCTIONS.includes(fn)) { err(r.line, `unknown function "${fn}"`); continue; }
    if (seen.has(fn)) err(r.line, `function "${fn}" appears twice`);
    seen.add(fn);
    if (role === "") err(r.line, `${fn}: Role is empty`);
    if (template) continue; // structure only

    for (const [name, v] of [["Source", source], ["Date read", dateRead], ["Mark", mark], ["Status", status], ["Ruling id", ruling], ["Note", note]]) {
      if (/<[^>]*>/.test(v)) err(r.line, `${fn}: ${name} still holds a placeholder`);
    }
    if (!MARKS.includes(mark)) { err(r.line, `${fn}: Mark must be one of ${MARKS.join(", ")}`); continue; }
    if (!STATUSES.includes(status)) err(r.line, `${fn}: Status must be one of ${STATUSES.join(", ")}`);

    if (mark === "verified") {
      for (const p of sourceProblems(source, root)) err(r.line, `${fn}: ${p}`);
      if (!isDate(dateRead)) err(r.line, `${fn}: a verified row needs the date read, YYYY-MM-DD`);
      else if (page.readOn && dateRead > page.readOn) err(r.line, `${fn}: Date read ${dateRead} is after the page date ${page.readOn}`);
    } else {
      if (status === "pass" || status === "fail") err(r.line, `${fn}: a ${mark} row cannot read ${status}; use open`);
      if (note === "" || note === "-") err(r.line, `${fn}: a ${mark} row needs a note saying what was not read or who holds it`);
    }
    if (status === "n/a" && (note === "" || note === "-")) err(r.line, `${fn}: n/a needs a reason in the note`);

    const idsCited = ruling === "-" || ruling === "" ? [] : ruling.split(",").map((s) => s.trim());
    for (const id of idsCited) {
      if (!ID.test(id)) err(r.line, `${fn}: ruling id "${id}" is not a known shape (for example CLO-3, CR-44, D-107)`);
      else if (rulings.missing.length === 0 && !rulings.ids.has(id)) err(r.line, `${fn}: ruling id ${id} is not in the rulings or decisions logs on this checkout`);
    }
    if (rulings.missing.length && idsCited.length) err(r.line, `${fn}: cannot check ruling ids, missing ${rulings.missing.join(", ")}`);
    const need = RULING_PREFIX_FOR_PASS[fn];
    if (need && status === "pass" && !idsCited.some((id) => id.startsWith(need))) {
      err(r.line, `${fn}: pass needs a ${need}n ruling id (a Claude role's reading of a source is not counsel's advice)`);
    }
  }
  for (const fn of FUNCTIONS) if (!seen.has(fn)) err(header.line, `missing row for ${fn}`);
  return errs;
}

function main(argv) {
  const args = [...argv];
  const take = (flag) => { const i = args.indexOf(flag); if (i < 0) return undefined; return args.splice(i, 2)[1]; };
  const root = resolve(take("--root") ?? ".");
  const now = take("--now");
  const ti = args.indexOf("--template");
  const template = ti >= 0;
  if (template) args.splice(ti, 1);
  let files = args;
  if (files.length === 0) {
    const dir = join(root, "docs/release/go-no-go");
    files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".md") && !["TEMPLATE.md", "README.md"].includes(f)).map((f) => join(dir, f)) : [];
    if (files.length === 0) { console.log("no go/no-go pages to check"); return 0; }
  }
  const rulings = loadRulingIds(root);
  let bad = 0;
  for (const f of files) {
    const errs = checkPage(readFileSync(f, "utf8"), { root, now, template, rulings });
    for (const e of errs) console.log(`${f}:${e.line}: ${e.message}`);
    if (errs.length) bad += errs.length; else console.log(`${f}: form ok (a person still reads it)`);
  }
  return bad ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) process.exit(main(process.argv.slice(2)));
