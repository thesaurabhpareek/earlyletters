#!/usr/bin/env node
// Path freezes, enforced in code (retro H2; IMP-16, panel 02 finding 9).
// A freeze lives in `agents/freeze.json` on the integration branch:
//   { "freezes": [ { "id": "F-1", "globs": ["supabase/**"], "until": "2026-11-05",
//                    "reason": "...", "decided_by": "D-120" } ] }
// `until` is exclusive, like `paused_until` in pause.mjs: a freeze with until
// 2026-11-05 lifts at 00:00 UTC on 5 Nov. A full ISO time is also accepted.
//
// Two gates use it:
// 1. The dispatcher (hook contract, like pause.mjs):
//      ctx = { now, freezes, byId, prFiles, openPRs }
//    blockedReason(ctx, agent, work) refuses `task` work whose backlog entry names a
//    frozen path, and `maintain` work on a PR that changes a frozen path. Reviews,
//    handoffs, digests and standing duty are not refused (they name no paths; the
//    push gate below still applies to anything they push). boardLines(ctx) lists
//    the active freezes. An unreadable or invalid freeze file fails closed: task
//    and maintain work are refused until it is fixed.
// 2. Before a push or PR, read only:
//      node scripts/agents/freeze.mjs [--base origin/develop] [--files a,b] [--now <iso>]
//    reads the freeze file from the BASE ref (so a branch cannot lift its own
//    freeze), compares the branch's changed paths, prints every match with the
//    freeze reason and exits 1. Exit 0 when nothing is frozen.
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { globToRegExp } from "./lib.mjs";

export const FREEZE_FILE = "agents/freeze.json";
const D_ID = /^D-\d{3,}$/;
const GATED = new Set(["task", "maintain"]);

function untilDate(v) {
  if (typeof v !== "string") return undefined;
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00:00Z` : v;
  if (!/^\d{4}-\d{2}-\d{2}T/.test(iso)) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Parse the freeze file text. Returns { freezes, errors }; any error means the file must not be trusted. */
export function parseFreezeFile(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return { freezes: [], errors: [`${FREEZE_FILE} is not valid JSON (${e.message})`] };
  }
  if (!raw || !Array.isArray(raw.freezes)) return { freezes: [], errors: [`${FREEZE_FILE} needs a "freezes" list`] };
  const errors = [];
  const freezes = [];
  raw.freezes.forEach((f, i) => {
    const where = `freeze ${f?.id ?? `#${i + 1}`}`;
    const bad = [];
    if (!Array.isArray(f?.globs) || !f.globs.length || !f.globs.every((g) => typeof g === "string" && g.trim() && !g.startsWith("/"))) {
      bad.push("globs must be a non-empty list of repo-relative globs");
    }
    const until = untilDate(f?.until);
    if (!until) bad.push("until must be YYYY-MM-DD or an ISO time");
    if (typeof f?.reason !== "string" || !f.reason.trim()) bad.push("reason is required");
    if (typeof f?.decided_by !== "string" || !D_ID.test(f.decided_by)) bad.push("decided_by must be a decision id like D-120");
    if (bad.length) errors.push(`${where}: ${bad.join("; ")}`);
    else freezes.push({ id: f.id ? String(f.id) : `#${i + 1}`, globs: f.globs, until, untilText: f.until, reason: f.reason.trim(), decided_by: f.decided_by });
  });
  return { freezes, errors };
}

/**
 * Load the freeze file. `fromBase()` returns the text on the integration branch or
 * null; `fromLocal()` the checkout's copy or null. The base copy wins.
 * Returns { freezes, errors, source }.
 */
export function loadFreezes({ fromBase = () => null, fromLocal = () => null } = {}) {
  let text = null;
  let source = "none";
  try { text = fromBase(); if (text != null) source = "base"; } catch { text = null; }
  if (text == null) {
    try { text = fromLocal(); if (text != null) source = "local"; } catch { text = null; }
  }
  if (text == null) return { freezes: [], errors: [], source };
  return { ...parseFreezeFile(text), source };
}

export function isActive(freeze, now) {
  return new Date(now) < freeze.until;
}

export function activeFreezes(freezes, now) {
  return (freezes ?? []).filter((f) => isActive(f, now));
}

/** Changed files that match an active freeze: [{ path, freeze }]. */
export function frozenFiles(files, freezes, now) {
  const out = [];
  for (const f of activeFreezes(freezes, now)) {
    const res = f.globs.map(globToRegExp);
    for (const p of files ?? []) if (res.some((r) => r.test(p))) out.push({ path: p, freeze: f });
  }
  return out;
}

const staticPart = (s) => s.split(/[*?]/)[0];

/**
 * Does a path named in a task (a file, a directory or a glob) overlap a frozen glob?
 * Deliberately broad: a directory that contains frozen files counts.
 */
export function mentionOverlaps(mention, glob) {
  const m = mention.replace(/\/+$/, "");
  const re = globToRegExp(glob);
  if (re.test(m) || re.test(`${m}/x`)) return true;
  const sg = staticPart(glob);
  const sm = staticPart(m);
  if (sg.startsWith(`${m}/`)) return true;
  if (/[*?]/.test(m)) return sg.startsWith(sm) || sm.startsWith(sg);
  return false;
}

/** Repo paths a backlog entry names in backticks (`docs/x.md`, `supabase/migrations/`, `plan.ts:38`). */
export function taskPaths(task) {
  const out = new Set();
  for (const [, raw] of String(task?.block ?? "").matchAll(/`([^`\s]+)`/g)) {
    const p = raw.replace(/:\d+(?:[-,]\d+)*$/, "").replace(/^\.\//, "");
    const looksPath = /^[\w.@*?[\]-]+(?:\/[\w.@*?[\]-]*)+$/.test(p) || /^[\w.-]+\.[a-z][a-z0-9]{0,4}$/.test(p);
    if (looksPath && !/^https?:/.test(p)) out.add(p);
  }
  return [...out];
}

/** Matches between task paths and active freezes: [{ path, freeze }]. */
export function frozenMentions(paths, freezes, now) {
  const out = [];
  for (const f of activeFreezes(freezes, now)) {
    for (const p of paths) if (f.globs.some((g) => mentionOverlaps(p, g))) out.push({ path: p, freeze: f });
  }
  return out;
}

export function describe(match) {
  const f = match.freeze;
  return `\`${match.path}\` is frozen until ${f.untilText} by ${f.decided_by} (${f.reason})`;
}

/** Why this work may not be handed out, or "" when it may. */
export function blockedReason(ctx, agent, work) {
  if (!work || !GATED.has(work.mode)) return "";
  const fz = ctx.freezes ?? { freezes: [], errors: [] };
  if (fz.errors?.length) return `freeze file invalid, so ${work.mode} work is refused until it is fixed: ${fz.errors[0]}`;
  let matches = [];
  if (work.mode === "task") matches = frozenMentions(taskPaths(ctx.byId?.get(work.task)), fz.freezes, ctx.now);
  else if (work.pr) {
    const pr = (ctx.openPRs ?? []).find((p) => String(p.number) === String(work.pr));
    matches = pr && ctx.prFiles ? frozenFiles(ctx.prFiles(pr), fz.freezes, ctx.now) : [];
  }
  if (!matches.length) return "";
  const more = matches.length > 1 ? ` and ${matches.length - 1} more` : "";
  return `frozen: ${work.label ?? work.mode}: ${describe(matches[0])}${more}`;
}

/** Board lines: active freezes and any problem with the file ([] when there is nothing to say). */
export function boardLines(ctx) {
  const fz = ctx.freezes ?? { freezes: [], errors: [] };
  const active = activeFreezes(fz.freezes, ctx.now);
  if (!active.length && !fz.errors?.length) return [];
  const lines = ["## Freezes", ""];
  for (const e of fz.errors ?? []) lines.push(`- **Freeze file invalid (task and maintain work refused):** ${e}`);
  for (const f of active) {
    lines.push(`- ${f.id}: ${f.globs.map((g) => `\`${g}\``).join(", ")} until ${f.untilText} (${f.decided_by}: ${f.reason})`);
  }
  if (fz.source === "local") lines.push("- Note: read from the local checkout, not the integration branch.");
  return lines;
}

/** The checkout's copy of the freeze file, or null. */
export function readLocalFreeze(root) {
  const p = join(root, FREEZE_FILE);
  return existsSync(p) ? readFileSync(p, "utf8") : null;
}

// ---------- CLI: the push and PR gate ----------

function git(args, cwd) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

/** Run the gate. Returns { code, lines }. Never writes anything. */
export function runGate({ base = "origin/develop", files, now = new Date(), cwd = process.cwd() } = {}) {
  const fz = loadFreezes({
    fromBase: () => {
      try { return git(["show", `${base}:${FREEZE_FILE}`], cwd); } catch { return null; }
    },
  });
  const lines = [];
  if (fz.errors.length) {
    lines.push(`Refused: the freeze file on ${base} is invalid, so no change can be checked.`, ...fz.errors.map((e) => `- ${e}`));
    return { code: 1, lines };
  }
  const changed = files ?? git(["diff", "--name-only", "--no-renames", `${base}...HEAD`], cwd).split("\n").filter(Boolean);
  const hits = frozenFiles(changed, fz.freezes, now);
  if (!hits.length) {
    lines.push(`No frozen paths changed (${changed.length} files checked against ${activeFreezes(fz.freezes, now).length} active freezes on ${base}).`);
    return { code: 0, lines };
  }
  lines.push(`Refused: ${hits.length} changed path${hits.length === 1 ? "" : "s"} frozen on ${base}. Do not push or open a PR; ask the founder.`);
  for (const h of hits) lines.push(`- ${describe(h)}`);
  return { code: 1, lines };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
  const files = opt("--files")?.split(",").map((s) => s.trim()).filter(Boolean);
  const now = opt("--now") ? new Date(opt("--now")) : new Date();
  const { code, lines } = runGate({ base: opt("--base") ?? "origin/develop", files, now });
  (code ? console.error : console.log)(lines.join("\n"));
  process.exit(code);
}
