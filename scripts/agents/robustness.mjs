// Robustness hooks for the dispatcher (RB-29, integrator). One module so that
// dispatch.mjs, which runs on import and cannot be unit-tested, keeps four small
// call sites. It joins four independent modules to the dispatcher:
//   gates.mjs       diff sanity, before an agent PR is treated as ready for review
//   provenance.mjs  commit trailers on every agent PR
//   sla.mjs         unanswered handoffs, by age
//   stale.mjs       quiet open PRs
// Contract: ctx = { repo, now, env, trust, openPRs, handoffs, agentOfPR, gh, ghAll }.
// Design, switches and the failure each one prevents: docs/agents/hardening/integration.md.
//
// Invariants:
//  - Every switch defaults to the safest behaviour: report on the board, change nothing.
//    Only AGENTS_GATES=enforce alters dispatch (see attentionReasons, blocksReview).
//  - Nothing here writes to GitHub. The board write is dispatch's own.
//  - A hook that throws is skipped and named on the board. A broken hook must never stop
//    the dispatcher, because the dispatcher is how agents get work and how the board refreshes.
//  - Text that came from GitHub passes through oneLine before it reaches the board.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib.mjs";
import { oneLine } from "./hardening.mjs";
import { checkDiff, explain } from "./gates.mjs";
import { classify as classifyCommit } from "./provenance.mjs";
import { handoffSla } from "./sla.mjs";
import { plan as stalePlan, summary as staleSummary } from "./stale.mjs";

/** Each switch: allowed values, first is the default. Anything else falls back to the default. */
export const SWITCHES = Object.freeze({
  AGENTS_GATES: ["warn", "off", "enforce"],
  AGENTS_PROVENANCE: ["warn", "off"],
  AGENTS_SLA: ["report", "off"],
  AGENTS_STALE: ["report", "off"],
});

export const ALLOW_FILE = join("docs", "agents", "hardening", "diff-allow.json");
const MAX_LINES = 10;

export function config(env = {}) {
  const out = {};
  for (const [name, allowed] of Object.entries(SWITCHES)) {
    const v = String(env[name] ?? "").trim().toLowerCase();
    out[name] = allowed.includes(v) ? v : allowed[0];
  }
  return out;
}

/** Waivers for the diff gate, from a file in the checkout (so only a merged change can add one). */
export function loadAllow(root = ROOT) {
  const p = join(root, ALLOW_FILE);
  if (!existsSync(p)) return [];
  try {
    const v = JSON.parse(readFileSync(p, "utf8"));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

// ---------- gates ----------

const gateCache = new WeakMap();
/** Diff-sanity flags for one PR, once per dispatcher run. */
export function gateFlags(ctx, pr, allow = loadAllow()) {
  const key = ctx.openPRs;
  if (!gateCache.has(key)) gateCache.set(key, new Map());
  const cache = gateCache.get(key);
  if (!cache.has(pr.number)) {
    const files = ctx.ghAll(`/repos/${ctx.repo}/pulls/${pr.number}/files`, { allowFail: true }) ?? [];
    cache.set(pr.number, checkDiff(files, { allow }));
  }
  return cache.get(pr.number);
}

const gated = (ctx, pr) => ctx.agentOfPR(pr) !== undefined && config(ctx.env).AGENTS_GATES !== "off";

/** Reasons that send the PR's own agent back to fix it. Only in enforce mode; otherwise none. */
export function attentionReasons(ctx, pr) {
  try {
    if (config(ctx.env).AGENTS_GATES !== "enforce" || !gated(ctx, pr)) return [];
    const flags = gateFlags(ctx, pr);
    return flags.length ? [`diff sanity: ${explain(flags).slice(0, 3).join("; ")}. Fix it, or say in the PR body why it is intended and ask the coordinator for a waiver`] : [];
  } catch {
    return [];
  }
}

/** True when enforce mode holds this PR back from reviewers: no red-team run is spent on a damaged diff. */
export function blocksReview(ctx, pr) {
  return attentionReasons(ctx, pr).length > 0;
}

// ---------- provenance ----------

/** Commits of one agent PR that miss the Agent trailer or name another agent. Merge commits are skipped. */
export function provenanceGaps(ctx, pr) {
  const handle = ctx.agentOfPR(pr);
  const commits = ctx.ghAll(`/repos/${ctx.repo}/pulls/${pr.number}/commits`, { allowFail: true }) ?? [];
  const gaps = [];
  let checked = 0;
  for (const c of commits) {
    if ((c.parents ?? []).length > 1) continue;
    checked++;
    const r = classifyCommit({ hash: c.sha, subject: String(c.commit?.message ?? "").split("\n")[0], date: c.commit?.author?.date, body: c.commit?.message ?? "" });
    if (!r.agent) gaps.push({ sha: String(c.sha).slice(0, 7), why: r.agentMalformed ? "malformed Agent trailer" : "no Agent trailer" });
    else if (r.agentHandle !== handle) gaps.push({ sha: String(c.sha).slice(0, 7), why: `Agent trailer names ${oneLine(r.agentHandle, 30)}, PR label is ${oneLine(handle, 30)}` });
    else if (!r.coAuthoredBy || !r.claudeSession) gaps.push({ sha: String(c.sha).slice(0, 7), why: "Agent trailer present; Co-Authored-By or Claude-Session missing" });
  }
  return { checked, gaps };
}

// ---------- sla ----------

export function slaReport(ctx) {
  return handoffSla((ctx.handoffs ?? []).map((h) => ({ issue: h.issue, comments: h.comments })), ctx.trust, ctx.now);
}

// ---------- stale ----------

/** Plan over all open PRs. The activity time is the head commit date, which a label sweep cannot move. */
export function stalePlanFor(ctx) {
  const prs = ctx.openPRs.map((pr) => {
    const c = ctx.gh(`/repos/${ctx.repo}/commits/${pr.head.sha}`, { allowFail: true });
    const at = c?.commit?.committer?.date;
    return at ? { ...pr, last_activity_at: at } : pr;
  });
  const held = String(ctx.env.AGENTS_STALE_HELD ?? "").split(",").map((s) => Number(s.trim())).filter(Number.isInteger);
  return stalePlan(prs, { now: ctx.now.toISOString(), held });
}

// ---------- board ----------

/** The board section. Always names the switches, so a reader can see what is on. */
export function boardLines(ctx) {
  const cfg = config(ctx.env);
  const lines = ["## Robustness checks", "", `Switches: ${Object.entries(cfg).map(([k, v]) => `\`${k}=${v}\``).join(", ")}. Only \`AGENTS_GATES=enforce\` changes what agents are assigned; everything else reports. Design: docs/agents/hardening/integration.md.`];
  const run = (name, on, fn) => {
    if (!on) return;
    try { lines.push(...fn()); } catch (e) { lines.push(`- ${name}: skipped, hook error (${oneLine(e?.message, 80)})`); }
  };
  run("diff sanity", cfg.AGENTS_GATES !== "off", () => {
    const hits = ctx.openPRs.filter((pr) => ctx.agentOfPR(pr)).map((pr) => [pr, gateFlags(ctx, pr)]).filter(([, f]) => f.length);
    if (!hits.length) return ["- Diff sanity: no agent PR has an emptied, deleted, shrunk, renamed-over or binary file."];
    const out = [`- Diff sanity (${cfg.AGENTS_GATES === "enforce" ? "enforced: the agent is sent back to fix it" : "warn only"}): ${hits.length} agent PR${hits.length === 1 ? "" : "s"} flagged.`];
    for (const [pr, f] of hits.slice(0, MAX_LINES)) out.push(`  - #${pr.number} (\`${oneLine(ctx.agentOfPR(pr), 30)}\`): ${explain(f).slice(0, 3).join("; ")}`);
    return out;
  });
  run("provenance", cfg.AGENTS_PROVENANCE !== "off", () => {
    const rows = [];
    let commits = 0;
    for (const pr of ctx.openPRs.filter((p) => ctx.agentOfPR(p))) {
      const { checked, gaps } = provenanceGaps(ctx, pr);
      commits += checked;
      if (gaps.length) rows.push(`  - #${pr.number} (\`${oneLine(ctx.agentOfPR(pr), 30)}\`): ${gaps.slice(0, 3).map((g) => `${g.sha} ${g.why}`).join("; ")}${gaps.length > 3 ? `; and ${gaps.length - 3} more` : ""}`);
    }
    return [`- Provenance (warn only, never blocks): ${rows.length} of the open agent PRs have commit trailer gaps, over ${commits} commits.`, ...rows.slice(0, MAX_LINES)];
  });
  run("handoff SLA", cfg.AGENTS_SLA !== "off", () => {
    const { entries, counts } = slaReport(ctx);
    const out = [`- Handoff SLA: ${counts.ok} ok, ${counts.escalate} escalate (5 days or more), ${counts.expire} expire (14 days or more). Report only: nothing is commented or closed.`];
    for (const e of entries.filter((x) => x.class !== "ok").slice(0, MAX_LINES)) out.push(`  - #${e.issue} waiting on \`${oneLine(e.to, 30)}\` for ${e.ageDays}d (${e.class})`);
    return out;
  });
  run("stale PRs", cfg.AGENTS_STALE !== "off", () => {
    const rows = stalePlanFor(ctx);
    const out = [`- Stale PRs (report only; the 14/21/30 day thresholds are a proposal awaiting the founder): ${JSON.stringify(staleSummary(rows))}. Quiet time runs from the head commit date, because the 28 Oct label backfill reset updated_at on every open PR.`];
    for (const r of rows.filter((x) => ["stale", "decision-needed", "close-candidate"].includes(x.state)).slice(0, MAX_LINES)) out.push(`  - #${r.number}: ${r.ageDays}d quiet, ${r.state}, ${r.action}`);
    return out;
  });
  return lines;
}
