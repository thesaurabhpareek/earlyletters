#!/usr/bin/env node
// Dry-run classifier for open PRs that have gone quiet (RB-18).
//
// It never calls GitHub and never mutates anything: it takes PR objects from the
// REST API (pulls list) and returns a plan plus a markdown table. A human or a
// later, separately reviewed step decides whether to act on the plan. The branch
// is never deleted, even for a close candidate.
//
// The 14/21/30 day thresholds are a PROPOSAL awaiting founder confirmation, not
// decided policy. Keep them in THRESHOLDS so changing them is one edit.
//
//   gh api "repos/OWNER/REPO/pulls?state=open&per_page=100" --paginate > prs.json
//   node scripts/agents/stale.mjs prs.json --held 109,110,112 [--now 2026-10-28T12:00:00Z]
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const THRESHOLDS = { stale: 14, decision: 21, close: 30 };
export const EXEMPT_LABELS = ["needs:founder", "hold"];
const DAY_MS = 86_400_000;

// Whole days since the last update. Floored, so day 14 starts at exactly 14 x 24h:
// a PR updated 13d 23h ago is still fresh. A future updated_at (clock skew) is 0.
export function ageDays(pr, now) {
  const ms = new Date(now).getTime() - new Date(pr.updated_at).getTime();
  if (!Number.isFinite(ms)) throw new Error(`PR #${pr.number}: unreadable updated_at or now`);
  return Math.max(0, Math.floor(ms / DAY_MS));
}

const labelNames = (pr) => (pr.labels ?? []).map((l) => (typeof l === "string" ? l : l.name));

// Stacked means the base branch is the head branch of another PR that is still
// open. Once that PR merges or closes it leaves the open list, so the exemption
// ends by itself and the PR is judged on its own age.
function stackedOn(pr, openPrs) {
  const base = pr.base?.ref;
  if (!base) return null;
  const parent = openPrs.find((o) => o.number !== pr.number && o.head?.ref === base);
  return parent ? parent.number : null;
}

export function classify(pr, { now, held = [], openPrs = [pr] } = {}) {
  const age = ageDays(pr, now);
  const labels = labelNames(pr);
  const row = { number: pr.number, title: pr.title ?? "", author: pr.user?.login ?? "", draft: Boolean(pr.draft), ageDays: age };
  const heldSet = new Set(held.map(Number));
  if (heldSet.has(pr.number)) return { ...row, state: "exempt", reason: "on the held list" };
  const label = EXEMPT_LABELS.find((l) => labels.includes(l));
  if (label) return { ...row, state: "exempt", reason: `labelled ${label}` };
  const parent = stackedOn(pr, openPrs);
  if (parent) return { ...row, state: "exempt", reason: `stacked on open PR #${parent}` };
  // Drafts are classified like any other PR: a quiet draft is still clutter in
  // the queue. The table marks them so a reviewer can weigh that.
  let state = "ok";
  if (age >= THRESHOLDS.close) state = "close-candidate";
  else if (age >= THRESHOLDS.decision) state = "decision-needed";
  else if (age >= THRESHOLDS.stale) state = "stale";
  return { ...row, state, reason: "" };
}

const WOULD = {
  stale: "would add label stale",
  "decision-needed": "would ask for a keep-or-close decision",
  "close-candidate": "would propose closing (branch kept)",
};

export function plan(prs, { now, held = [] } = {}) {
  const rows = prs.map((pr) => classify(pr, { now, held, openPrs: prs }));
  return rows
    .map((r) => ({ ...r, action: WOULD[r.state] ?? "none" }))
    .sort((a, b) => b.ageDays - a.ageDays || a.number - b.number);
}

export function markdownTable(rows) {
  const esc = (s) => String(s).replace(/\|/g, "/").replace(/\s+/g, " ").trim();
  const out = ["| PR | Days quiet | Draft | State | Note | Dry-run action |", "|---|---|---|---|---|---|"];
  for (const r of rows) {
    out.push(`| #${r.number} ${esc(r.title).slice(0, 60)} | ${r.ageDays} | ${r.draft ? "yes" : "no"} | ${r.state} | ${esc(r.reason)} | ${r.action} |`);
  }
  return out.join("\n");
}

export function summary(rows) {
  const c = {};
  for (const r of rows) c[r.state] = (c[r.state] ?? 0) + 1;
  return c;
}

function main(argv) {
  const file = argv.find((a) => !a.startsWith("--"));
  const opt = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
  const prs = JSON.parse(readFileSync(file ?? 0, "utf8"));
  const held = (opt("--held") ?? "").split(",").filter(Boolean).map(Number);
  const now = opt("--now") ?? new Date().toISOString();
  const rows = plan(prs, { now, held });
  console.log(`Measured at ${now}. Dry run: nothing was changed.\n`);
  console.log(markdownTable(rows));
  console.log(`\n${JSON.stringify(summary(rows))}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
