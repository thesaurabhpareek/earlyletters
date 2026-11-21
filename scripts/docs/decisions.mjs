#!/usr/bin/env node
// Keeps the decision register (docs/decisions/) complete and its index current.
// Owner: the decision-records agent. The dated log stays docs/DECISIONS.md
// (coordinator); ADRs stay docs/adr/. The register adds what neither holds:
// door type, reversal cost, revisit triggers, as-built status, and decisions
// that were made in issues, PRs or chats and never got a D-id.
//
//   node scripts/docs/decisions.mjs --check     # gaps and errors (the daily worklist)
//   node scripts/docs/decisions.mjs --write     # regenerate docs/decisions/INDEX.md
//   node scripts/docs/decisions.mjs --check --json
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, today } from "./lib.mjs";

export const FIELDS = ["Source", "Decided", "Why", "Door", "Reversal cost", "Revisit when", "Status", "As built"];
export const OPTIONAL = ["Alternatives", "Review by", "Also", "Decided by", "Date"];
export const DOORS = ["one-way", "two-way", "one-way after launch"];
export const TRIGGERS = ["scale", "market", "law", "customer", "cost", "platform", "technology", "team", "none"];
const STATUS = /^(in force|proposed|parked|open|retired|(amended|superseded) by (\S+))/i;
const ID = /^(D-\d{3}|ADR-\d{4}|BRIEF-\d{8}-\d+|R-\d{3})$/;
// Only backticked text under a repository folder is checked as a path; branch names like release/1.0 are not.
const REPO_DIRS = /^(\.github|\.claude|agents|apps|docs|experiments|packages|packs|scripts|supabase)\//;

// ---------- sources ----------

/** D-ids in docs/DECISIONS.md: headings, index rows, and "D-006 to D-014" ranges. */
export function decisionIds(text) {
  const ids = new Set();
  for (const m of text.matchAll(/^### (D-\d{3})\b/gm)) ids.add(m[1]);
  for (const m of text.matchAll(/^\|\s*(D-\d{3})(?:\s+to\s+(D-\d{3}))?\s*\|/gm)) {
    const a = Number(m[1].slice(2));
    const b = m[2] ? Number(m[2].slice(2)) : a;
    for (let i = a; i <= b; i++) ids.add(`D-${String(i).padStart(3, "0")}`);
  }
  return ids;
}

export function adrIds(root = ROOT) {
  const dir = join(root, "docs", "adr");
  if (!existsSync(dir)) return new Set();
  return new Set(readdirSync(dir).map((f) => f.match(/^(\d{4})-.*\.md$/)?.[1]).filter(Boolean).map((n) => `ADR-${n}`));
}

// ---------- register ----------

/** Parse register records: `### <ID> <title>` then `- **Field:** value` lines. */
export function parseRecords(text, file) {
  const out = [];
  let cur = null;
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    const h = line.match(/^### (\S+)\s+(.*)$/);
    if (h) {
      cur = { id: h[1], title: h[2].trim(), file, line: i + 1, fields: {} };
      out.push(cur);
      return;
    }
    if (/^#{1,2} /.test(line)) cur = null;
    const f = cur && line.match(/^- \*\*([A-Za-z ]+):\*\*\s*(.*)$/);
    if (f) cur.fields[f[1].trim()] = f[2].trim();
  });
  return out;
}

export function records(root = ROOT) {
  const dir = join(root, "docs", "decisions", "records");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .flatMap((f) => parseRecords(readFileSync(join(dir, f), "utf8"), `docs/decisions/records/${f}`).map((r) => ({ ...r, area: f.replace(/\.md$/, "") })));
}

const alsoIds = (r) => (r.fields.Also ?? "").split(/[,;\s]+/).map((s) => s.replace(/[`.]/g, "")).filter((s) => ID.test(s));

/** Validate one record. Returns a list of problems. */
export function validate(r, known, now = today()) {
  const p = [];
  const where = `${r.file}:${r.line} ${r.id}`;
  if (!ID.test(r.id)) p.push(`${where}: id must be D-###, ADR-####, BRIEF-YYYYMMDD-n or R-###`);
  for (const f of FIELDS) if (!r.fields[f]) p.push(`${where}: missing **${f}:**`);
  const door = (r.fields.Door ?? "").toLowerCase();
  if (r.fields.Door && !DOORS.some((d) => door === d || door.startsWith(`${d}:`) || door.startsWith(`${d} (`))) {
    p.push(`${where}: Door must start with one of: ${DOORS.join(" | ")}`);
  }
  if (r.fields["Reversal cost"] && !/^(low|medium|high)\b/i.test(r.fields["Reversal cost"])) p.push(`${where}: Reversal cost must start with low, medium or high`);
  const rev = (r.fields["Revisit when"] ?? "").toLowerCase();
  if (r.fields["Revisit when"] && !TRIGGERS.some((t) => new RegExp(`(^|[;,]\\s*)${t}\\b`).test(rev))) {
    p.push(`${where}: Revisit when must name triggers as "<kind>: ..." with kind in ${TRIGGERS.join(", ")}`);
  }
  const s = (r.fields.Status ?? "").match(STATUS);
  if (r.fields.Status && !s) p.push(`${where}: Status must be in force | proposed | parked | open | retired | amended by <ID> | superseded by <ID>`);
  if (s?.[3] && !known.has(s[3].replace(/[.,;:)]+$/, ""))) p.push(`${where}: Status points to ${s[3]}, which is not a known decision`);
  const rb = r.fields["Review by"];
  if (rb && !/^(on trigger|\d{4}-\d{2}-\d{2})/.test(rb)) p.push(`${where}: Review by must be YYYY-MM-DD or "on trigger"`);
  return p;
}

export function check(root = ROOT, now = today()) {
  const recs = records(root);
  const sourceD = decisionIds(existsSync(join(root, "docs", "DECISIONS.md")) ? readFileSync(join(root, "docs", "DECISIONS.md"), "utf8") : "");
  const sourceA = adrIds(root);
  const ids = new Set(recs.map((r) => r.id));
  const covered = new Set([...ids, ...recs.flatMap(alsoIds)]);
  const known = new Set([...covered, ...sourceD, ...sourceA]);
  const errors = [];
  const seen = new Map();
  for (const r of recs) {
    if (seen.has(r.id)) errors.push(`${r.file}:${r.line} ${r.id}: duplicate record (also ${seen.get(r.id)})`);
    seen.set(r.id, `${r.file}:${r.line}`);
    errors.push(...validate(r, known, now));
    if (/^D-/.test(r.id) && sourceD.size && !sourceD.has(r.id)) errors.push(`${r.file}:${r.line} ${r.id}: not in docs/DECISIONS.md (use R-### until the coordinator assigns a D-id)`);
    if (/^ADR-/.test(r.id) && !sourceA.has(r.id)) errors.push(`${r.file}:${r.line} ${r.id}: no such ADR in docs/adr/`);
  }
  const missing = [...sourceD, ...sourceA].filter((id) => !covered.has(id)).sort();
  const due = recs.filter((r) => /^\d{4}-\d{2}-\d{2}/.test(r.fields["Review by"] ?? "") && r.fields["Review by"].slice(0, 10) <= now && /^in force/i.test(r.fields.Status ?? ""));
  const drift = existsSync(join(root, "docs", "decisions")) && readIndex(root) !== renderIndex(recs, now);
  // As-built paths that no longer exist: the decision moved or was removed in code.
  const gone = recs.flatMap((r) =>
    [...(r.fields["As built"] ?? "").matchAll(/`([^`\s*]+\/[^`\s*]+)`/g)]
      .map((m) => m[1].replace(/[#:].*$/, ""))
      .filter((p) => REPO_DIRS.test(p))
      .filter((p) => !existsSync(join(root, p)))
      .map((p) => `${r.id}: ${p}`),
  );
  return { records: recs.length, sources: sourceD.size + sourceA.size, errors, missing, due: due.map((r) => `${r.id} (review by ${r.fields["Review by"]})`), gone, drift };
}

// ---------- index ----------

const cell = (s) => String(s ?? "").replace(/\|/g, "\\|");
const doorOf = (r) => DOORS.slice().sort((a, b) => b.length - a.length).find((d) => (r.fields.Door ?? "").toLowerCase().startsWith(d)) ?? "?";
const link = (r) => `[${r.id}](${r.file.replace("docs/decisions/", "")}#${(r.id + " " + r.title).toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/ /g, "-")})`;
const row = (r) => `| ${link(r)} | ${cell(r.title)} | ${doorOf(r)} | ${cell((r.fields["Reversal cost"] ?? "").split(/[:.]/)[0])} | ${cell((r.fields.Status ?? "").split(/[.;(]/)[0].trim())} | ${cell(r.fields["Review by"] ?? "")} |`;
const HEAD = ["| Decision | Title | Door | Reversal cost | Status | Review by |", "|---|---|---|---|---|---|"];

export function renderIndex(recs, now = today()) {
  const lines = [
    "# Decision register: index",
    "",
    "<!-- Generated by `node scripts/docs/decisions.mjs --write`. Do not edit by hand; edit the records in `records/`. -->",
    "",
    `${recs.length} decisions. Door types: ${DOORS.map((d) => `${recs.filter((r) => doorOf(r) === d).length} ${d}`).join(", ")}. How to read this: [README.md](README.md).`,
    "",
  ];
  const oneWay = recs.filter((r) => doorOf(r) === "one-way" && /^in force/i.test(r.fields.Status ?? ""));
  lines.push("## One-way doors in force", "", "Hard or impossible to undo. Change only with a founder decision and a plan for existing users, data and listings.", "", ...HEAD, ...oneWay.map(row), "");
  const later = recs.filter((r) => doorOf(r) === "one-way after launch" && /^in force/i.test(r.fields.Status ?? ""));
  lines.push("## Two-way today, one-way after launch", "", "Cheap to change now; expensive once real families, data or a store listing depend on them. Decide these before launch.", "", ...HEAD, ...later.map(row), "");
  const soon = recs.filter((r) => /^\d{4}-\d{2}-\d{2}/.test(r.fields["Review by"] ?? "")).sort((a, b) => a.fields["Review by"].localeCompare(b.fields["Review by"]));
  lines.push("## Review dates", "", "Decisions with a dated review, earliest first. Overdue ones are flagged by the daily check.", "", ...HEAD, ...soon.map(row), "");
  const r = recs.filter((x) => x.id.startsWith("R-"));
  lines.push("## Awaiting a D-id", "", "Decided somewhere other than `docs/DECISIONS.md` (an issue, a PR, a chat). The coordinator assigns a D-id; the record is then renamed and keeps its R-id under **Also**.", "", ...HEAD, ...r.map(row), "");
  for (const area of [...new Set(recs.map((x) => x.area))]) {
    lines.push(`## ${area}`, "", ...HEAD, ...recs.filter((x) => x.area === area).map(row), "");
  }
  return lines.join("\n").replace(/\n+$/, "\n");
}

const indexPath = (root) => join(root, "docs", "decisions", "INDEX.md");
const readIndex = (root) => (existsSync(indexPath(root)) ? readFileSync(indexPath(root), "utf8") : "");

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--write")) {
    writeFileSync(indexPath(ROOT), renderIndex(records(ROOT)));
    console.log("wrote docs/decisions/INDEX.md");
  }
  if (argv.includes("--check") || !argv.includes("--write")) {
    const r = check(ROOT);
    if (argv.includes("--json")) console.log(JSON.stringify({ date: today(), ...r }, null, 2));
    else {
      console.log(`${r.records} records; ${r.sources} decisions in DECISIONS.md and docs/adr/.`);
      for (const e of r.errors) console.log(`error: ${e}`);
      if (r.missing.length) console.log(`missing: ${r.missing.length} decisions have no record: ${r.missing.join(", ")}`);
      for (const d of r.due) console.log(`due: ${d}`);
      for (const g of r.gone) console.log(`moved: ${g} no longer exists (update As built)`);
      if (r.drift) console.log("error: INDEX.md is out of date (run --write)");
      if (!r.errors.length && !r.missing.length && !r.due.length && !r.gone.length && !r.drift) console.log("decision register is complete and current");
    }
    if (r.errors.length || r.missing.length || r.drift) process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
