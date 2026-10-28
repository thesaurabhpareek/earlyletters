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

export function blockedReason(agent, now) {
  const until = agent.paused_until;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(until ?? '')) return null;
  return now < Date.parse(`${until}T00:00:00Z`) ? `paused until ${until}` : null;
}
