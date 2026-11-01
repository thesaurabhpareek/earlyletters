#!/usr/bin/env node
// TODAY page: what needs the founder, in 15 lines or fewer (harness v2, HV2-B07, requirement HV2-005).
// Design: docs/agents/harness-v2/FOUNDER-PAGE-AND-CLAIMS.md section 2 (PR #551).
//
//   node scripts/status/today.mjs [--repo owner/name] [--trust login,login] [--now ISO]
//                                 [--dates docs/release/dates.json] [--claims docs/agents/CLAIMS.md]
//                                 [--decisions docs/DECISIONS.md]
//
// Run by hand. Only GET requests, through `gh api`; nothing is written anywhere, no model is used.
// Output holds numbers, ids matched by a fixed pattern and fixed words only. It never prints a PR
// title, a comment, a branch or a label name: those are untrusted text.
// Reuses scripts/status/page.mjs (buildModel, collect, founderLine) and scripts/founder/check.mjs
// (runChecks). Line 14 uses scripts/agents/board-check.mjs when it is on this branch.
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { buildModel, collect, founderLine, ghGet as ghGetSync, MAX_LINES } from "./page.mjs";
import { runChecks, ghGet as ghGetAsync, DEFAULT_REPO } from "../founder/check.mjs";

export const VALID_HOURS = 6;
export const WIP_OPEN_LIMIT = 25;
export const WIP_OWNER_LIMIT = 3;
const H = 3600_000;
const D = 24 * H;
const SHORT = "fewer than 2 counted passes"; // the wording founderLine uses; a test pins it
const nums = (list, max) => list.slice(0, max).map((n) => `#${n}`).join(", ") + (list.length > max ? `, +${list.length - max} more` : "");
const utc = (t) => new Date(t).toISOString().slice(0, 16).replace("T", " ") + " UTC";

/** Dates file to `[{label, date}]`, labels cut to a safe alphabet. Pure. */
export function parseDates(json) {
  let doc;
  try { doc = typeof json === "string" ? JSON.parse(json) : json; } catch { return undefined; }
  if (!Array.isArray(doc?.dates)) return undefined;
  return doc.dates
    .map((d) => ({ label: String(d?.label ?? "").replace(/[^A-Za-z0-9 /-]/g, "").trim().slice(0, 24), date: String(d?.date ?? "") }))
    .filter((d) => d.label && /^\d{4}-\d{2}-\d{2}$/.test(d.date) && !Number.isNaN(Date.parse(d.date)));
}

/** Whole UTC days from the day of `now` to `date`; negative when passed. Pure. */
export const daysUntil = (date, now) => Math.round((Date.parse(date) - Date.parse(new Date(now).toISOString().slice(0, 10))) / D);

/** D- ids written as headings in DECISIONS.md. Pure. */
export const decisionIds = (text) => new Set([...String(text ?? "").matchAll(/^#{2,4}\s+(D-\d{2,4})\b/gm)].map((m) => m[1]));

/** D- ids cited in the title or body of PRs, matched by pattern only. Pure. */
export const citedIds = (prs) => [...new Set((prs ?? []).flatMap((p) => `${p.title ?? ""}\n${p.body ?? ""}`.match(/\bD-\d{2,4}\b/g) ?? []))]
  .sort((a, b) => Number(a.slice(2)) - Number(b.slice(2)));

/** Open PRs: counts only. Owner labels are `agent:<handle>` or `session:<slug>`; their names are not kept. Pure. */
export function wipCounts(open) {
  const per = new Map();
  for (const p of open ?? []) {
    if (p.draft) continue;
    for (const l of p.labels ?? []) if (/^(agent|session):/.test(String(l?.name ?? l))) per.set(String(l?.name ?? l), (per.get(String(l?.name ?? l)) ?? 0) + 1);
  }
  return {
    open: (open ?? []).length,
    drafts: (open ?? []).filter((p) => p.draft).length,
    ownersOver: [...per.values()].filter((n) => n > WIP_OWNER_LIMIT).length,
  };
}

/**
 * Pure: the TODAY model from fetched data.
 * input: { data (page.mjs collect), steps (check.mjs results), claims, dates, decisionsText, develop, now }
 * claims: { counts: {C1, C2, C3, C4} } | { missing: "board-check" | "file" } | undefined
 */
export function buildToday({ data, steps, claims, dates, decisionsText, develop, now }) {
  const base = buildModel(data, now);
  const short = base.founder.filter((p) => founderLine(p).includes(SHORT));
  const cited = citedIds(data.closed);
  const known = decisionIds(decisionsText);
  return {
    generated: base.now,
    develop: String(develop ?? "").slice(0, 7),
    dates: dates === undefined ? undefined : dates.map((d) => ({ label: d.label, days: daysUntil(d.date, now) })),
    steps: steps && {
      open: [...new Set(steps.filter((s) => s.status === "open").map((s) => s.queue))],
      unreadable: steps.filter((s) => s.status === "unreadable").length,
    },
    handoffs: base.handoffs,
    founder: { total: base.founder.length, short: short.length, newestShort: short[0] && { number: short[0].number, classes: short[0].classes } },
    merged24: base.merged24,
    waiting: base.waiting.map((p) => ({ number: p.number, age: p.age })),
    old14: base.old14,
    wip: wipCounts(data.open),
    claims,
    decisions: decisionsText === undefined ? undefined : { cited: cited.length, missing: cited.filter((id) => !known.has(id)) },
  };
}

/** Pure: at most 15 lines. Line 1 carries the generation time and expiry; past expiry it says STALE. */
export function renderToday(m, { now = m.generated } = {}) {
  const gen = Date.parse(m.generated);
  const until = gen + VALID_HOURS * H;
  const stale = new Date(now).getTime() > until;
  const L = [];
  L.push(stale
    ? `STALE: TODAY generated ${utc(gen)}, valid until ${utc(until)}, which has passed. Run it again. develop ${m.develop || "unknown"}.`
    : `TODAY generated ${utc(gen)}, valid until ${utc(until)}. develop ${m.develop || "unknown"}.`);
  L.push(m.dates === undefined ? "Days left: dates.json unreadable."
    : m.dates.length ? `Days left: ${m.dates.map((d) => (d.days < 0 ? `${d.label} passed` : d.days === 0 ? `${d.label} today` : `${d.label} ${d.days}`)).join(", ")}.` : "Days left: no dates set.");
  L.push(!m.steps ? "Founder steps: not read."
    : `Founder steps open: ${m.steps.open.length}${m.steps.open.length ? `. First: ${m.steps.open.slice(0, 3).join(", ")}` : ""}.`);
  L.push(!m.steps ? "Founder steps unreadable: not read."
    : m.steps.unreadable ? `Founder steps unreadable: ${m.steps.unreadable}. Run node scripts/founder/check.mjs locally.` : "Founder steps unreadable: 0.");
  L.push(m.handoffs.length
    ? `Handoffs over 48 h: ${m.handoffs.length}. Oldest: ${m.handoffs.slice(0, 6).map((h) => `#${h.number} (${h.age} d)`).join(", ")}${m.handoffs.length > 6 ? ", more" : ""}.`
    : "Handoffs over 48 h: 0.");
  L.push(`Handoffs 14 days or more: ${m.handoffs.filter((h) => h.age >= 14).length}.`);
  L.push(`Founder-class merges in 7 days: ${m.founder.total}. ${SHORT[0].toUpperCase()}${SHORT.slice(1)} on the merged head: ${m.founder.short}.`);
  L.push(m.founder.newestShort ? `Newest short of 2: #${m.founder.newestShort.number}, ${m.founder.newestShort.classes.join(", ")}.` : "Newest short of 2: none.");
  L.push("Review gate: not built (HV2-B06). Nothing counts it yet.");
  L.push(`Merged in 24 h: ${m.merged24.length}${m.merged24.length ? `. ${nums(m.merged24, 6)}` : ""}.`);
  L.push(m.waiting.length ? `Waiting for review: ${m.waiting.length}. Oldest #${m.waiting[0].number}, ${m.waiting[0].age} d.` : "Waiting for review: 0.");
  L.push(`Open PRs over 14 days: ${m.old14} (target 0 after the sweep).`);
  const w = m.wip;
  const red = w.open > WIP_OPEN_LIMIT || w.ownersOver > 0;
  L.push(`WIP ${red ? "RED" : "ok"}: ${w.open} open (${w.drafts} drafts), limit ${WIP_OPEN_LIMIT}; ${w.ownersOver} owner label(s) over ${WIP_OWNER_LIMIT} non-draft.`);
  const c = m.claims;
  L.push(!c ? "Claims: not read."
    : c.missing === "board-check" ? "Claims: board-check is not on this branch yet."
    : c.missing ? "Claims: CLAIMS.md not read."
    : `Claims: expired ${c.counts.C2}, closed-PR ${c.counts.C1}, overlapping ${c.counts.C3}, unreadable ${c.counts.C4}.`);
  L.push(!m.decisions ? "Decisions: DECISIONS.md not read."
    : `Decisions cited in 7-day merges: ${m.decisions.cited}; not in DECISIONS.md: ${m.decisions.missing.length}${m.decisions.missing.length ? `. ${m.decisions.missing.slice(0, 6).join(", ")}` : ""}.`);
  return L.slice(0, MAX_LINES);
}

/** Counts per code from board-check findings. Pure. */
export function claimCounts(findings) {
  const counts = { C1: 0, C2: 0, C3: 0, C4: 0 };
  for (const f of findings) if (f.code in counts) counts[f.code]++;
  return { counts };
}

async function readClaims(file, repo, now) {
  let mod;
  try { mod = await import("../agents/board-check.mjs"); } catch { return { missing: "board-check" }; }
  let text;
  try { text = fs.readFileSync(file, "utf8"); } catch { return { missing: "file" }; }
  const get = ghGetAsync();
  return claimCounts(await mod.checkClaims(mod.parseClaims(text), { now, getPr: (n) => get(`repos/${repo}/pulls/${n}`) }));
}

async function main(argv) {
  const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
  const root = new URL("../../", import.meta.url);
  const at = (p) => fileURLToPath(new URL(p, root));
  const repo = opt("repo", process.env.GITHUB_REPOSITORY || DEFAULT_REPO);
  const trusted = new Set(opt("trust", repo.split("/")[0]).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean));
  const now = opt("now", new Date().toISOString());
  const tryRead = (f) => { try { return fs.readFileSync(f, "utf8"); } catch { return undefined; } };
  const data = collect(ghGetSync, { repo, now, trusted, all: true });
  let develop;
  try { develop = ghGetSync(`/repos/${repo}/commits/develop`)?.sha; } catch { /* line 1 says unknown */ }
  let steps;
  try { steps = await runChecks(ghGetAsync(), repo); } catch { /* line 3 says not read */ }
  const m = buildToday({
    data, steps, develop, now,
    claims: await readClaims(opt("claims", at("docs/agents/CLAIMS.md")), repo, now),
    dates: parseDates(tryRead(opt("dates", at("docs/release/dates.json")))),
    decisionsText: tryRead(opt("decisions", at("docs/DECISIONS.md"))),
  });
  console.log(renderToday(m).join("\n"));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main(process.argv.slice(2));
