// Handoff SLA (RB-17). Pure: data in, data out. It never calls GitHub, never
// comments and never closes anything; the integrator decides what to do with
// the result (docs/agents/hardening/handoff-sla.md).
//
// Failure it prevents: a handoff nobody answers sits open forever and the board
// only counts it. This lists each unanswered recipient with its age and class.

import { isTrusted, parseHandoff, parseReply, handoffTargets, startsWithMarker } from "./lib.mjs";

export const ESCALATE_DAYS = 5;
export const EXPIRE_DAYS = 14;
const DAY_MS = 86_400_000;

/** ok under 5 whole days, escalate from 5, expire from 14. Whole days, rounded down, so day 5 starts at exactly 120 hours. */
export function classifyAge(days) {
  if (days >= EXPIRE_DAYS) return "expire";
  if (days >= ESCALATE_DAYS) return "escalate";
  return "ok";
}

/**
 * Unanswered recipients of one handoff issue, one entry per recipient.
 * Counts only if the issue author is trusted AND its body starts with the
 * handoff marker (a quoted or forged marker is ignored). A recipient is waiting
 * until it posts a trusted `handoff-reply` marker comment newer than the latest
 * trusted non-reply message; the clock runs from that message (or issue creation),
 * so a follow-up restarts the wait, matching pendingTargets in lib.mjs.
 * `comments` may be unsorted; they are ordered by created_at here.
 */
export function openHandoffs(issue, comments, trust, now = new Date()) {
  if (!issue || issue.pull_request || issue.state === "closed") return [];
  if (!isTrusted(issue, trust)) return [];
  if (!startsWithMarker(issue.body, "<!-- handoff ") || !parseHandoff(issue.body)) return [];
  const sorted = [...(comments ?? [])]
    .filter((c) => isTrusted(c, trust))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const out = [];
  for (const to of handoffTargets(issue)) {
    let since = new Date(issue.created_at);
    let replied;
    for (const c of sorted) {
      const at = new Date(c.created_at);
      const r = startsWithMarker(c.body, "<!-- handoff-reply ") ? parseReply(c.body) : undefined;
      if (r) {
        if (r.from === to) replied = at;
      } else if (at > since) since = at;
    }
    if (replied && replied >= since) continue;
    const days = Math.max(0, Math.floor((now - since) / DAY_MS));
    out.push({
      issue: issue.number, from: parseHandoff(issue.body).from, to, kind: parseHandoff(issue.body).kind,
      waitingSince: since.toISOString(), ageDays: days, class: classifyAge(days),
    });
  }
  return out;
}

/** Many issues at once: `items` is [{ issue, comments }]. Oldest wait first. */
export function handoffSla(items, trust, now = new Date()) {
  const entries = items.flatMap(({ issue, comments }) => openHandoffs(issue, comments, trust, now));
  entries.sort((a, b) => b.ageDays - a.ageDays || a.issue - b.issue || a.to.localeCompare(b.to));
  const counts = { ok: 0, escalate: 0, expire: 0 };
  for (const e of entries) counts[e.class]++;
  return { entries, counts };
}
