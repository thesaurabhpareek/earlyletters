#!/usr/bin/env node
// One task source (harness package H6, retro IMP-19 and IMP-43).
//
// The dispatcher reads only docs/BACKLOG.md, while the build streams work from
// the PRD V2 work-package tables in docs/prd/v2/features/F*.md. This module
// reads both into one normalised task list and flags tasks that look open but
// that a merged pull request, a decision, or a linked task already closed.
// It only reads files (and, with --gh, makes GET calls). It never writes.
//
//   node scripts/agents/tasks.mjs                 # summary of both sources
//   node scripts/agents/tasks.mjs --json          # the full normalised list
//   node scripts/agents/tasks.mjs --merged prs.json   # flag against a saved list of merged PRs
//   node scripts/agents/tasks.mjs --gh            # fetch recent merged PRs read-only with `gh`
//
// Dispatch wiring (not done here; see docs/agents/TASK_SOURCE.md):
//   const tasks = dispatchView(loadTasks({ mergedPRs }));
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, parseBacklog, loadRoster, repoSlug, gh } from "./lib.mjs";

export const BL_ID = /\bBL-\d{3}\b/g;
export const WP_ID = /\bWP-F\d{2}-[A-Za-z0-9]+\b/g;
const ANY_ID = /\b(?:BL-\d{3}|WP-F\d{2}-[A-Za-z0-9]+)\b/g;

const ids = (text, re) => [...new Set([...(text ?? "").matchAll(re)].map((m) => m[0]))];

// ---------- status and mode ----------

/** Statuses a task can still be worked on in. */
export const OPEN_STATUSES = new Set(["ready", "blocked", "needs-founder", "needs-decision", "in-progress", "in-review", "not-built", "partly-built", "not-run", "unknown"]);
/** Statuses that mean nothing is left to build. */
export const CLOSED_STATUSES = new Set(["done", "built", "superseded", "deferred", "removed"]);

/**
 * Normalise a PRD V2 work-package status cell. The cells are free text
 * ("Partly built: ...", "Built (checked 27 Oct, ...)", "Removed from v1.0 (D-055)"),
 * so only the opening words decide, and anything unrecognised is "unknown".
 */
export function wpStatus(text) {
  const t = (text ?? "").trim().toLowerCase().replace(/^[`*_]+/, "");
  if (!t || t === "n/a") return "unknown";
  if (/^(partly|partially|part built)\b/.test(t)) return "partly-built";
  if (/^not built|^not started|^not done/.test(t)) return "not-built";
  if (/^not run/.test(t)) return "not-run";
  if (/^built|^done|^shipped|^merged/.test(t)) return "built";
  if (/^removed|^dropped|^cut/.test(t)) return "removed";
  if (/^superseded/.test(t)) return "superseded";
  if (/^deferred|^later|^moved to/.test(t)) return "deferred";
  if (/^blocked/.test(t)) return "blocked";
  if (/^in review|^in-review/.test(t)) return "in-review";
  return "unknown";
}

/** Normalise a Mode cell from either source to agent, pair, human or unknown. */
export function normMode(text) {
  const t = (text ?? "").trim().toLowerCase();
  if (/^agent\s+(plus|and|with)\s+human/.test(t)) return "pair";
  const m = t.match(/^(agent|pair|human|founder)\b/);
  if (!m) return "unknown";
  return m[1] === "founder" ? "human" : m[1];
}

// ---------- BACKLOG ----------

/** Backlog tasks in the shared shape. Reuses lib.mjs parseBacklog so both readers agree. */
export function backlogTasks(text, file = "docs/BACKLOG.md") {
  return parseBacklog(text).map((t) => {
    const done = t.block.match(/^- Done when:\s*(.+)$/m);
    const status = t.status || "unknown";
    return {
      id: t.id,
      source: "backlog",
      file,
      line: t.line,
      title: t.title,
      status,
      statusText: t.statusText ?? "",
      mode: t.mode ?? "unknown",
      owners: t.owners ?? [],
      dependsOn: t.dependsOn ?? [],
      blockers: t.blockers ?? [],
      doneWhen: done ? done[1].trim() : "",
      links: [],
      block: t.block,
    };
  });
}

// ---------- PRD V2 work packages ----------

/** Split one markdown table row into trimmed cells. Escaped pipes stay in the cell. */
export function splitRow(line) {
  const inner = line.trim().replace(/^\|/, "").replace(/\|\s*$/, "");
  return inner.split(/(?<!\\)\|/).map((c) => c.trim());
}

/** Map a header row to known column keys by the start of each header name. */
function columnMap(headers) {
  const keys = {};
  headers.forEach((h, i) => {
    const n = h.toLowerCase();
    const set = (k) => { if (keys[k] === undefined) keys[k] = i; };
    if (n === "wp") set("id");
    else if (n.startsWith("scope")) set("title");
    else if (n.startsWith("done when")) set("doneWhen");
    else if (n.startsWith("depends")) set("dependsOn");
    else if (n.startsWith("mode")) set("mode");
    else if (n.startsWith("status")) set("status");
    else if (n === "bl") set("bl");
    else if (n.startsWith("owner") && !n.startsWith("owns")) set("owner");
    else if (n.startsWith("stream")) set("owner");
    else if (n.startsWith("owns")) set("paths");
    else if (n.startsWith("device")) set("device");
  });
  return keys;
}

/**
 * Parse every work-package table in one feature file. A table counts when its
 * first header cell is exactly "WP"; columns are found by name, so a column
 * added, removed or reordered (open PR #239 edits these files) does not break
 * parsing. Rows whose first cell is not a WP id are skipped and counted.
 */
export function workPackageTasks(text, file) {
  const lines = text.split("\n");
  const tasks = [];
  const skipped = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*\|/.test(lines[i])) continue;
    const headers = splitRow(lines[i]);
    if (headers[0] !== "WP" || !/^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] ?? "")) continue;
    const col = columnMap(headers);
    let j = i + 2;
    for (; j < lines.length && /^\s*\|/.test(lines[j]); j++) {
      const cells = splitRow(lines[j]);
      const cell = (k) => (col[k] === undefined ? "" : (cells[col[k]] ?? ""));
      const id = cell("id").replace(/[`*]/g, "");
      if (!/^WP-F\d{2}-[A-Za-z0-9]+$/.test(id)) {
        skipped.push({ file, line: j + 1, reason: "first cell is not a WP id" });
        continue;
      }
      const modeText = cell("mode");
      const statusText = cell("status");
      // No Status column (F14, F18 to F21 on develop): a Mode cell that reads
      // like a status ("Built; human apply", "Done") is used instead.
      let status = col.status !== undefined ? wpStatus(statusText) : "unknown";
      if (col.status === undefined && normMode(modeText) === "unknown") status = wpStatus(modeText);
      const depText = cell("dependsOn");
      tasks.push({
        id,
        source: "prd-v2",
        file,
        line: j + 1,
        title: cell("title"),
        status,
        statusText: col.status !== undefined ? statusText : "",
        mode: normMode(modeText),
        owners: cell("owner") ? [cell("owner").toLowerCase()] : [],
        dependsOn: ids(depText, ANY_ID).filter((x) => x !== id),
        blockers: [],
        doneWhen: cell("doneWhen"),
        links: ids(`${cell("bl")} ${modeText}`, BL_ID),
        block: lines[j],
      });
    }
    i = j - 1;
  }
  return { tasks, skipped };
}

// ---------- decisions ----------

/** Rows of the decision table in docs/DECISIONS.md: `| D-### | text | status | ...`. */
export function parseDecisions(text) {
  const out = [];
  for (const line of (text ?? "").split("\n")) {
    const m = line.match(/^\|\s*(D-\d{3})\s*\|/);
    if (!m) continue;
    const cells = splitRow(line);
    out.push({ id: m[1], text: cells.slice(1).join(" | ") });
  }
  return out;
}

/**
 * Premises that a decision reversed. A ready task whose text still states one
 * is flagged. Kept as data so the product lane can add rows after a decision.
 * D-100 (docs/DECISIONS.md, decided 13 Oct 2026, confirmed 15 Oct): server
 * features are on in v1.0.
 */
export const REVERSED_PREMISES = [
  { decision: "D-100", pattern: /server features (?:are )?off (?:for|in) v1\.0|\bon-device v1\.0\b/i },
];

const CLOSING_WORDS = /\b(supersed\w*|replac\w*|clos\w*|retir\w*|remov\w*|drop\w*|cancel\w*|done)\b/i;

/**
 * Does a closing word share a clause with `id` in this decision text? Clauses
 * end at ";" or "|" or a full stop followed by a space, so a decision that
 * mentions a task in one clause and "removed" in another does not count.
 */
export function clauseCloses(text, id) {
  for (const clause of (text ?? "").split(/;|\||\.\s/)) {
    if (ids(clause, ANY_ID).includes(id) && CLOSING_WORDS.test(clause)) return true;
  }
  return false;
}

// ---------- staleness flags ----------

const RANGE = /\b(?:BL-\d{3}|WP-F\d{2}-[A-Za-z0-9]+)\s+(?:to|-)\s+(?:BL-\d{3}|WP-F\d{2}-[A-Za-z0-9]+|-?\d+)\b/g;
const DELIVERS = /\b(implement\w*|port(?:s|ed)?|ship(?:s|ped)?|clos(?:e|es|ed)|fix(?:es|ed)?|resolv\w*|deliver\w*)\b/i;

/** True for a task the dispatcher could hand out now if nothing else stops it. */
export function looksReady(t) {
  if (t.mode !== "agent") return false;
  if (t.source === "backlog") return t.status === "ready";
  return t.status === "not-built" || t.status === "partly-built" || t.status === "not-run";
}

/**
 * Flag ready-looking tasks that something already closed. Each flag:
 * { id, kind, evidence, strength } where kind is merged-pr, decision,
 * reversed-premise or linked-task, and strength is "strong" (title, branch or
 * decision row, a premise, or a PR body sentence that says it implements,
 * ports, ships, closes, fixes, resolves or delivers the id) or "weak" (any
 * other mention, or a linked task). BL-342 shipped in #121, whose body says
 * "Ported from ... BL-342", so it is strong.
 */
export function staleFlags(tasks, { mergedPRs = [], decisions = [], premises = REVERSED_PREMISES } = {}) {
  const flags = [];
  const prIndex = new Map();
  for (const pr of mergedPRs) {
    if (!pr?.merged_at) continue;
    const add = (text, strength) => {
      // Ids that bound a range ("BL-370 to BL-434") name a block of new
      // tasks, usually in the PR that created them, so they count as weak.
      const ranged = new Set(ids([...text.matchAll(RANGE)].map((m) => m[0]).join(" "), ANY_ID));
      for (const id of ids(text, ANY_ID)) {
        const s = ranged.has(id) ? "weak" : strength;
        const list = prIndex.get(id) ?? [];
        const prev = list.find((x) => x.pr.number === pr.number);
        if (!prev) list.push({ pr, strength: s });
        else if (s === "strong") prev.strength = "strong";
        prIndex.set(id, list);
      }
    };
    add(`${pr.title ?? ""} ${pr.head?.ref ?? ""} ${(pr.head?.ref ?? "").replace(/\bbl-(\d{3})\b/gi, "BL-$1")}`, "strong");
    // A body sentence that says the PR implements, ports, ships, closes,
    // fixes, resolves or delivers the id is strong; any other mention is weak.
    for (const sentence of (pr.body ?? "").split(/(?<=\.)\s+|\n/)) {
      add(sentence, DELIVERS.test(sentence) ? "strong" : "weak");
    }
  }
  for (const t of tasks) {
    if (!looksReady(t)) continue;
    const hits = prIndex.get(t.id) ?? [];
    // When any merged PR is a strong match, weak mentions add nothing.
    const strong = hits.filter((h) => h.strength === "strong");
    for (const h of strong.length ? strong : hits) {
      flags.push({
        id: t.id,
        kind: "merged-pr",
        strength: h.strength,
        evidence: `#${h.pr.number} merged ${String(h.pr.merged_at).slice(0, 10)}: ${h.pr.title ?? ""}`.trim(),
      });
    }
    for (const d of decisions) {
      if (clauseCloses(d.text, t.id)) {
        flags.push({ id: t.id, kind: "decision", strength: "strong", evidence: `${d.id} names ${t.id}: ${d.text.slice(0, 120)}` });
      }
    }
    const text = `${t.title}\n${t.doneWhen}\n${t.block}`;
    for (const p of premises) {
      const m = text.match(p.pattern);
      if (m) flags.push({ id: t.id, kind: "reversed-premise", strength: "strong", evidence: `states "${m[0]}", reversed by ${p.decision}` });
    }
    // Cross-source, one direction only: a ready BL task named by a work
    // package that is built. The other direction (an open WP naming a done BL
    // task) is normal, because WPs are the deltas still owed on top of a BL
    // task (WP-F06-02 to -05 on top of BL-120), so it is not flagged.
    if (t.source !== "backlog") continue;
    for (const other of tasks) {
      if (other === t || other.source !== "prd-v2") continue;
      if (other.links.includes(t.id) && other.status === "built") {
        flags.push({ id: t.id, kind: "linked-task", strength: "weak", evidence: `${other.id} (${other.file}:${other.line}) is ${other.status}` });
      }
    }
  }
  return flags;
}

// ---------- loading ----------

/** Read both sources from a repo checkout. `mergedPRs` and `decisions` are optional. */
export function loadTasks({ root = ROOT, mergedPRs = [], decisions } = {}) {
  const warnings = [];
  const tasks = [];
  const blPath = join(root, "docs", "BACKLOG.md");
  if (existsSync(blPath)) tasks.push(...backlogTasks(readFileSync(blPath, "utf8")));
  else warnings.push("docs/BACKLOG.md not found");
  const featDir = join(root, "docs", "prd", "v2", "features");
  if (existsSync(featDir)) {
    for (const f of readdirSync(featDir).filter((n) => /^F\d+.*\.md$/.test(n)).sort()) {
      const rel = relative(root, join(featDir, f));
      const { tasks: wp, skipped } = workPackageTasks(readFileSync(join(featDir, f), "utf8"), rel);
      tasks.push(...wp);
      for (const s of skipped) warnings.push(`${s.file}:${s.line}: ${s.reason}`);
    }
  } else warnings.push("docs/prd/v2/features not found");
  const seen = new Map();
  for (const t of tasks) {
    if (seen.has(t.id)) warnings.push(`${t.id} appears twice: ${seen.get(t.id)} and ${t.file}:${t.line}`);
    else seen.set(t.id, `${t.file}:${t.line}`);
  }
  if (decisions === undefined) {
    const dPath = join(root, "docs", "DECISIONS.md");
    decisions = existsSync(dPath) ? parseDecisions(readFileSync(dPath, "utf8")) : [];
  }
  const flags = staleFlags(tasks, { mergedPRs, decisions });
  const byTask = new Map();
  for (const f of flags) byTask.set(f.id, [...(byTask.get(f.id) ?? []), f]);
  for (const t of tasks) t.flags = byTask.get(t.id) ?? [];
  return { tasks, flags, warnings };
}

/**
 * Records in the shape lib.mjs eligibility() and queueFor() expect. Built,
 * done, superseded and removed become "done" so dependencies on them resolve;
 * an open work package becomes "ready"; a task with a strong flag becomes
 * "stale", which eligibility() refuses with "status stale". `refuse` is
 * "strong" (default), "any" (weak flags too) or "none".
 */
export function dispatchView(loaded, { refuse = "strong" } = {}) {
  const list = Array.isArray(loaded) ? loaded : loaded.tasks;
  return list.map((t) => {
    let status = t.status;
    if (t.source === "prd-v2") {
      if (CLOSED_STATUSES.has(status) && status !== "deferred") status = "done";
      else if (looksReady(t)) status = "ready";
    }
    const flags = (t.flags ?? []).filter((f) => refuse === "any" || (refuse === "strong" && f.strength === "strong"));
    if (flags.length) status = "stale";
    return { ...t, status };
  });
}

/**
 * Task ids taken by open PRs: BL ids (as lib.mjs takenIds) plus WP ids.
 * Branch names are lower case, so a WP id is matched to `knownIds` without
 * regard to case ("wp-f08-b5a" is WP-F08-B5a); unknown ones are upper-cased.
 */
export function takenTaskIds(openPRs, knownIds = []) {
  const canon = new Map([...knownIds].map((id) => [id.toUpperCase(), id]));
  const taken = new Set();
  for (const pr of openPRs) {
    const s = `${pr.head?.ref ?? ""} ${pr.title ?? ""}`;
    for (const m of s.matchAll(/bl-(\d{3})/gi)) taken.add(`BL-${m[1]}`);
    for (const m of s.matchAll(/\bwp-f\d{2}-[a-z0-9]+\b/gi)) {
      const up = m[0].toUpperCase();
      taken.add(canon.get(up) ?? up);
    }
  }
  return taken;
}

// ---------- CLI ----------

function main(argv) {
  const has = (n) => argv.includes(n);
  const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
  let mergedPRs = [];
  if (opt("--merged")) mergedPRs = JSON.parse(readFileSync(opt("--merged"), "utf8"));
  else if (has("--gh")) mergedPRs = fetchMerged();
  const loaded = loadTasks({ mergedPRs });
  if (has("--json")) {
    process.stdout.write(JSON.stringify(loaded.tasks.map(({ block, ...t }) => t), null, 2) + "\n");
    return;
  }
  const count = (src) => loaded.tasks.filter((t) => t.source === src);
  for (const src of ["backlog", "prd-v2"]) {
    const ts = count(src);
    const ready = ts.filter(looksReady);
    console.log(`${src}: ${ts.length} tasks, ${ready.length} ready for an agent, ${ready.filter((t) => t.doneWhen).length} of those with Done when`);
  }
  console.log(`merged PRs checked: ${mergedPRs.length}${mergedPRs.length ? "" : " (pass --merged <file> or --gh to check against merged PRs)"}`);
  for (const f of loaded.flags) console.log(`FLAG ${f.id} [${f.kind}, ${f.strength}] ${f.evidence}`);
  for (const w of loaded.warnings) console.log(`warning: ${w}`);
}

/** Read-only: merged PRs into develop and main, via `gh api` GET (lib.mjs gh). */
function fetchMerged() {
  const repo = repoSlug(loadRoster());
  const out = [];
  for (const base of ["develop", "main"]) {
    for (let page = 1; page <= 5; page++) {
      const list = gh(`/repos/${repo}/pulls?state=closed&base=${base}&per_page=100&page=${page}`) ?? [];
      out.push(...list.filter((p) => p.merged_at).map((p) => ({ number: p.number, title: p.title, body: p.body, merged_at: p.merged_at, head: { ref: p.head?.ref } })));
      if (list.length < 100) break;
    }
  }
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main(process.argv.slice(2));
