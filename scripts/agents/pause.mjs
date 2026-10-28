// Scope control and review drift (owner: chief-of-staff). Contract:
//   ctx = { state, now, roster, openPRs, prFacts, agentOfPR, env, repo, ghAll, labelNames }
// Design and operating rules: docs/agents/hardening/scope-and-drift.md.
//
// blockedReason: a roster agent with `paused_until: "YYYY-MM-DD"` takes no new
// `task` or `standing` work while now < that date (00:00 UTC). Maintain, review,
// handoff, steward-review and digest work still run, so paused agents keep
// fixing their open PRs and answering other agents. The pause lapses on its own.
// A founder-forced run (FORCE_TASK with ONLY_AGENT naming the agent) is not blocked.
//
// boardLines: an "Awaiting re-review" section listing open agent PRs whose head
// has no red-team review but an older head does. A PR whose current head is
// recorded in state.reviewfp[<pr>].carried (reviewfp.mjs: the same changes as a
// head the red team reviewed) is left out, because the red team is not
// re-assigned to it; the board's fingerprint section shows it instead. Labels are
// shown as they are; this module never changes labels. At most one reviews call
// per PR per head, cached in ctx.state.drift, and at most MAX_FETCHES uncached
// calls per tick.
import { isTrusted, trustContext } from "./lib.mjs";

const NEW_WORK = new Set(["task", "standing"]);
export const MAX_FETCHES = 8;
const RED_TEAM = /^<!-- red-team:([0-9a-f]{7,40}) -->/;

/** The pause date as a Date, or undefined when unset or not a valid YYYY-MM-DD. */
export function pauseDate(agent) {
  const v = agent?.paused_until;
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Why this agent may not take this work right now, or "" when it may. */
export function blockedReason(ctx, agent, work) {
  if (!agent || !work || !NEW_WORK.has(work.mode)) return "";
  const until = pauseDate(agent);
  if (!until || !(new Date(ctx.now) < until)) return "";
  const env = ctx.env ?? {};
  const only = String(env.ONLY_AGENT ?? "").split(",").map((s) => s.trim());
  if (env.FORCE_TASK && only.includes(agent.handle)) return "";
  const why = String(agent.paused_reason ?? "").trim();
  return `paused until ${agent.paused_until}${why ? ` (${why})` : ""}; fixes, reviews and handoffs still run`;
}

/** The newest trusted red-team review of a head other than `sha`, or null. */
export function olderRedTeam(reviews, sha, trust) {
  let best = null;
  for (const r of reviews ?? []) {
    const m = (r.body ?? "").trimStart().match(RED_TEAM);
    if (!m || !isTrusted(r, trust) || sha.startsWith(m[1])) continue;
    const at = r.submitted_at ?? r.created_at ?? "";
    if (!best || at > best.at) {
      const verdict = (r.body.match(/Verdict:\s*([a-z ]+)/i)?.[1] ?? "").trim().toLowerCase();
      best = { sha: m[1], verdict, at };
    }
  }
  return best;
}

/** Board lines, for example PRs fixed since their last review ([] when none). */
export function boardLines(ctx) {
  const state = ctx.state ?? {};
  const cache = (state.drift ??= {});
  const trust = trustContext(ctx.roster ?? {}, ctx.env ?? {});
  const labels = ctx.labelNames ?? ((pr) => (pr.labels ?? []).map((l) => (typeof l === "string" ? l : l.name)));
  const agentPRs = (ctx.openPRs ?? []).filter((pr) => ctx.agentOfPR(pr));
  const open = new Set(agentPRs.map((pr) => String(pr.number)));
  for (const n of Object.keys(cache)) if (!open.has(n)) delete cache[n];

  let fetches = 0;
  let deferred = 0;
  const rows = [];
  for (const pr of [...agentPRs].sort((a, b) => a.number - b.number)) {
    const sha = pr.head?.sha ?? "";
    if (!sha || ctx.prFacts(pr).redTeam) continue;
    if (state.reviewfp?.[pr.number]?.carried?.sha === sha) continue; // same changes as a reviewed head: never re-assigned
    const key = String(pr.number);
    let entry = cache[key];
    if (!entry || entry.head !== sha) {
      if (fetches >= MAX_FETCHES) { deferred++; continue; }
      fetches++;
      const reviews = ctx.ghAll(`/repos/${ctx.repo}/pulls/${pr.number}/reviews`, { allowFail: true }) ?? [];
      const prior = olderRedTeam(reviews, sha, trust);
      entry = cache[key] = { head: sha, prior: prior ? { sha: prior.sha, verdict: prior.verdict } : null };
    }
    if (!entry.prior) continue;
    const review = labels(pr).filter((n) => n.startsWith("review:"));
    const shown = review.length ? review.map((n) => `\`${n}\``).join(", ") : "no review label";
    const verdict = entry.prior.verdict ? `, verdict "${entry.prior.verdict}"` : "";
    rows.push(`- #${pr.number} (\`${ctx.agentOfPR(pr)}\`): last red-team review on ${entry.prior.sha.slice(0, 7)}${verdict}; head is now ${sha.slice(0, 7)}. Carries ${shown}.`);
  }
  if (!rows.length && !deferred) return [];
  const lines = ["## Awaiting re-review", ""];
  lines.push(...rows);
  if (deferred) lines.push(`- ${deferred} more PR(s) not checked this tick (lookup limit ${MAX_FETCHES}); next tick continues.`);
  lines.push("- Labels are shown as they stand. They change only when the red team reviews the new head; no agent relabels another agent's PR.");
  return lines;
}
