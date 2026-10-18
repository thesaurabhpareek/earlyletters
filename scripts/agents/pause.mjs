// Scope control and review drift (owner: chief-of-staff). Contract:
//   ctx = { state, now, roster, openPRs, prFacts, agentOfPR }
/** Why this agent may not take this work right now, or "" when it may. */
export function blockedReason(ctx, agent, work) { return ""; }
/** Board lines, for example PRs fixed since their last review ([] when none). */
export function boardLines(ctx) { return []; }
