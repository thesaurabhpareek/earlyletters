#!/usr/bin/env node
// The activity ledger: one JSON line per thing an agent did or said, rebuilt
// from GitHub (the only store). Sources: journal entries, run receipts,
// handoffs opened, handoff replies, red-team reviews and steward reviews.
// Only trusted authors count unless --all is given (untrusted rows are marked).
//
//   node scripts/agents/ledger.mjs --since 2026-10-03            # JSONL to stdout
//   node scripts/agents/ledger.mjs --since 2026-10-03 --agent privacy
//   node scripts/agents/ledger.mjs --since 2026-10-03 --summary  # counts per agent and kind
import { writeFileSync } from "node:fs";
import {
  loadRoster, repoSlug, ghAll, trustContext, isTrusted, parseHandoff, parseReply,
} from "./lib.mjs";

/** Classify one comment, review or issue body into a ledger row, or undefined. Pure. */
export function classify(item, { trusted, source }) {
  const body = item.body ?? "";
  const at = item.submitted_at ?? item.created_at;
  const url = item.html_url;
  const base = { at, url, trusted, author: item.user?.login };
  let m;
  if ((m = body.match(/<!-- journal run:(\S+) agent:([a-z0-9-]+) -->/))) {
    const mode = body.match(/\*\*Mode:\*\*\s*(.+)/)?.[1]?.trim();
    return { ...base, kind: "journal", agent: m[2], run: m[1], detail: mode };
  }
  if ((m = body.match(/<!-- receipt run:(\S+) agent:([a-z0-9-]+) cost:([0-9.]+) -->/))) {
    return { ...base, kind: "receipt", agent: m[2], run: m[1], cost_usd: Number(m[3]) };
  }
  if ((m = body.match(/<!-- red-team:([0-9a-f]{7,40}) -->/))) {
    return { ...base, kind: "red-team-review", agent: "red-team", sha: m[1], verdict: verdictOf(body) };
  }
  if ((m = body.match(/<!-- steward:([a-z0-9-]+):([0-9a-f]{7,40}) -->/))) {
    return { ...base, kind: "steward-review", agent: m[1], sha: m[2], verdict: verdictOf(body) };
  }
  const r = parseReply(body);
  if (r) return { ...base, kind: "handoff-reply", agent: r.from, status: r.status };
  if (source === "issue") {
    const h = parseHandoff(body);
    if (h) return { ...base, kind: "handoff", agent: h.from, to: h.to, handoff_kind: h.kind, title: item.title };
  }
  return undefined;
}

function verdictOf(body) {
  return (body.match(/Verdict:\s*([a-z ]+)/i)?.[1] ?? "").trim().toLowerCase() || undefined;
}

export function summarize(rows) {
  const out = {};
  for (const r of rows) {
    out[r.agent] ??= {};
    out[r.agent][r.kind] = (out[r.agent][r.kind] ?? 0) + 1;
  }
  return out;
}

function main() {
  const argv = process.argv.slice(2);
  const opt = (n, d = "") => {
    const i = argv.indexOf(`--${n}`);
    return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : d;
  };
  const since = opt("since", new Date(Date.now() - 86_400_000).toISOString().slice(0, 10));
  const until = opt("until");
  const only = opt("agent");
  const all = argv.includes("--all");
  const roster = loadRoster();
  const repo = repoSlug(roster);
  const trust = trustContext(roster, process.env);
  const sinceIso = since.includes("T") ? since : `${since}T00:00:00Z`;

  const rows = [];
  const add = (item, source) => {
    const trusted = isTrusted(item, trust);
    if (!trusted && !all) return;
    const row = classify(item, { trusted, source });
    if (row) rows.push(row);
  };
  for (const c of ghAll(`/repos/${repo}/issues/comments?since=${sinceIso}&sort=created`, { allowFail: true })) add(c, "comment");
  for (const i of ghAll(`/repos/${repo}/issues?state=all&labels=handoff&since=${sinceIso}`, { allowFail: true })) {
    if (new Date(i.created_at) >= new Date(sinceIso)) add(i, "issue");
  }
  // Pull request reviews are not issue comments; read them for PRs updated in the window.
  const prs = ghAll(`/repos/${repo}/pulls?state=all&sort=updated&direction=desc`, { allowFail: true })
    .filter((p) => new Date(p.updated_at) >= new Date(sinceIso));
  for (const p of prs) {
    for (const r of ghAll(`/repos/${repo}/pulls/${p.number}/reviews`, { allowFail: true })) {
      if (new Date(r.submitted_at) >= new Date(sinceIso)) add(r, "review");
    }
  }

  const out = rows
    .filter((r) => !only || r.agent === only)
    .filter((r) => !until || r.at < (until.includes("T") ? until : `${until}T23:59:59Z`))
    .sort((a, b) => a.at.localeCompare(b.at));
  const text = argv.includes("--summary")
    ? JSON.stringify(summarize(out), null, 2)
    : out.map((r) => JSON.stringify(r)).join("\n");
  if (opt("out")) writeFileSync(opt("out"), text + "\n");
  else console.log(text);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
