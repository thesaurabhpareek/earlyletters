#!/usr/bin/env node
// Checks docs/DECISIONS.md for three things (HV2-B12). Advisory: exit 0 unless --strict.
//   1. AMENDED  A later entry says it amends or supersedes D-x, but D-x's index row has
//               no "Amended by D-y" (or "Superseded by D-y") marker. Known case: D-100 and
//               D-101 against D-121.
//   2. CAPACITY An entry dated after the freeze (D-130: Tue 3 Nov 2026, 5:00 AM PT, 13:00 UTC)
//               has no "- **Capacity:**" line. Only checked once the field is adopted: any
//               entry already carries a Capacity line, or --capacity-adopted is passed.
//   3. DUPLICATE A D id is defined twice in the file (advisory). COLLISION: a patch adds an id the
//               file has, or two patches add the same id (always exit 1). Patches are unified diffs of open PRs (--patch <file>, repeatable).
//
//   node scripts/agents/decisions-check.mjs [--file docs/DECISIONS.md] [--patch pr557.diff ...]
//        [--capacity-adopted] [--strict] [--json]
// Exit: 0 clean or advisory, 1 findings with --strict (a patch collision always exits 1), 2 usage error.
import { readFileSync, existsSync } from "node:fs";

export const FREEZE_UTC = "2026-11-03T13:00:00Z";
export const FREEZE_DATE = "2026-11-03";

const ROW = /^\| *(D-\d{3}) *\|(.*)\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*$/;
const HEAD = /^#{2,4} +(D-\d{3})\b/;
const IDS = /D-\d{3}/g;

/** Parse DECISIONS.md text into rows (index table) and entries (### sections). */
export function parseDecisions(text) {
  const lines = text.split("\n");
  const rows = [];
  const entries = [];
  let cur = null;
  lines.forEach((line, i) => {
    const r = ROW.exec(line);
    if (r) rows.push({ id: r[1], text: r[2], date: r[3], line: i + 1 });
    const h = HEAD.exec(line);
    if (h) {
      cur = { id: h[1], line: i + 1, update: /^#{2,4} +D-\d{3} +\(update/i.test(line), body: [] };
      entries.push(cur);
    } else if (cur) {
      if (/^(---\s*$|\||## )/.test(line)) cur = null; // an entry ends at a rule, a table or a section heading
      else cur.body.push(line);
    }
  });
  return { rows, entries };
}

/** Ids an entry says it amends or supersedes: its Amends/Supersedes fields and "Amends D-x, D-y" phrases. */
export function amendTargets(entry) {
  const found = new Set();
  const add = (s) => (s.match(IDS) || []).forEach((id) => id !== entry.id && found.add(id));
  for (const line of entry.body) {
    const field = /^- \*\*(Amends|Supersedes)[^:]*:\*\*(.*)$/.exec(line);
    if (field) add(field[2]);
    for (const m of line.matchAll(/\b(?:Amends|Supersedes)\s+((?:D-\d{3}(?:\s*(?:,|and|to)\s*)?)+)/g)) add(m[1]);
  }
  return [...found];
}

const hasMarker = (rowText, by) => new RegExp(`(?:amended|superseded) by[^|]*\\b${by}\\b`, "i").test(rowText);

export function checkAmended({ rows, entries }) {
  const rowOf = new Map(rows.map((r) => [r.id, r]));
  const out = [];
  for (const e of entries) {
    for (const target of amendTargets(e)) {
      const row = rowOf.get(target);
      if (row && !hasMarker(row.text, e.id)) {
        out.push({ kind: "AMENDED", id: target, by: e.id, line: row.line, message: `${target} (row line ${row.line}) is amended or superseded by ${e.id} (line ${e.line}) but has no "Amended by ${e.id}" marker` });
      }
    }
  }
  return out.sort((a, b) => a.id.localeCompare(b.id) || a.by.localeCompare(b.by));
}

export function capacityAdopted({ entries }, forced = false) {
  return forced || entries.some((e) => e.body.some((l) => /^- \*\*Capacity:\*\*/.test(l)));
}

export function checkCapacity(parsed, { adopted = false, freezeDate = FREEZE_DATE } = {}) {
  if (!capacityAdopted(parsed, adopted)) return [];
  const dateOf = new Map(parsed.rows.map((r) => [r.id, r.date]));
  const out = [];
  for (const e of parsed.entries) {
    const date = dateOf.get(e.id);
    if (!date || date <= freezeDate) continue;
    if (!e.body.some((l) => /^- \*\*Capacity:\*\*/.test(l))) {
      out.push({ kind: "CAPACITY", id: e.id, line: e.line, message: `${e.id} (${date}) is dated after the freeze and has no Capacity line` });
    }
  }
  return out;
}

/** D ids a unified diff adds as an index row or a heading. */
export function patchIds(diffText) {
  const ids = new Set();
  for (const l of diffText.split("\n")) {
    if (!l.startsWith("+") || l.startsWith("+++")) continue;
    const s = l.slice(1);
    const m = /^\| *(D-\d{3}) *\|/.exec(s) || HEAD.exec(s);
    if (m) ids.add(m[1]);
  }
  return [...ids];
}

export function checkDuplicates({ rows, entries }, patches = []) {
  const out = [];
  const dupIn = (list, what) => {
    const seen = new Map();
    for (const x of list) seen.set(x.id, [...(seen.get(x.id) || []), x.line]);
    for (const [id, ls] of seen) if (ls.length > 1) out.push({ kind: "DUPLICATE", id, message: `${id} has ${ls.length} ${what} (lines ${ls.join(", ")})` });
  };
  dupIn(rows, "index rows");
  dupIn(entries.filter((e) => !e.update), "headings"); // "### D-023 (update)" is a follow-up note, not a second definition
  const inFile = new Set([...rows, ...entries].map((x) => x.id));
  const claims = new Map();
  for (const p of patches) {
    for (const id of patchIds(p.text)) {
      if (inFile.has(id)) out.push({ kind: "COLLISION", id, message: `${id} is added by ${p.name} but already defined in the file` });
      claims.set(id, [...(claims.get(id) || []), p.name]);
    }
  }
  for (const [id, names] of claims) {
    if (names.length > 1) out.push({ kind: "COLLISION", id, message: `${id} is added by more than one patch: ${names.join(", ")}` });
  }
  return out;
}

export function run({ text, patches = [], adopted = false }) {
  const parsed = parseDecisions(text);
  return [...checkDuplicates(parsed, patches), ...checkAmended(parsed), ...checkCapacity(parsed, { adopted })];
}

function main(argv) {
  const opts = { file: "docs/DECISIONS.md", patches: [], strict: false, json: false, adopted: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--file") opts.file = argv[++i];
    else if (a === "--patch") opts.patches.push(argv[++i]);
    else if (a === "--strict") opts.strict = true;
    else if (a === "--json") opts.json = true;
    else if (a === "--capacity-adopted") opts.adopted = true;
    else { console.error(`unknown argument: ${a}`); return 2; }
  }
  for (const f of [opts.file, ...opts.patches]) if (!f || !existsSync(f)) { console.error(`missing file: ${f}`); return 2; }
  const findings = run({ text: readFileSync(opts.file, "utf8"), patches: opts.patches.map((f) => ({ name: f, text: readFileSync(f, "utf8") })), adopted: opts.adopted });
  if (opts.json) console.log(JSON.stringify(findings, null, 2));
  else {
    for (const f of findings) console.log(`${f.kind}: ${f.message}`);
    console.log(findings.length ? `${findings.length} finding(s).` : "No findings.");
  }
  const dup = findings.some((f) => f.kind === "COLLISION");
  return dup || (opts.strict && findings.length) ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main(process.argv.slice(2)));
