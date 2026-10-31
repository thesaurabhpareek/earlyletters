// Lane health (owner: ops). Every dispatcher run records a tick per lane, and the
// board flags a lane that has gone quiet. Contract: pure functions over ctx.
//   ctx = { state, now, runId, LOCAL, env, roster }
// A lane is `actions` for GitHub Actions runs; for --local runs it is the
// AGENTS_LANE env var (set by each scheduled task), or `local` when unset.
// Dry runs tick too, but a dry run never writes the board, so nothing persists.
// Design: docs/agents/hardening/lanes-and-review-churn.md.

/** A lane silent for longer than this is flagged on the board. */
export const QUIET_MS = 8 * 3_600_000;
/** A lane silent for longer than this is dropped from the state (flagged until then). */
export const FORGET_MS = 14 * 86_400_000;

/** The lane this run belongs to. Names are cleaned so they are safe in Markdown. */
export function laneName(ctx) {
  if (!ctx.LOCAL) return "actions";
  const raw = String(ctx.env?.AGENTS_LANE ?? "").trim();
  const clean = raw.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  return clean || "local";
}

/** Record this dispatcher run in the board state. */
export function recordTick(ctx) {
  ctx.state.lanes ??= {};
  ctx.state.lanes[laneName(ctx)] = { at: ctx.now.toISOString(), run: String(ctx.runId ?? "") };
  for (const [name, t] of Object.entries(ctx.state.lanes)) {
    const at = Date.parse(t?.at);
    if (!Number.isFinite(at) || ctx.now - at > FORGET_MS) delete ctx.state.lanes[name];
  }
}

/** "5m", "3h 20m", "2d 4h". */
export function ago(ms) {
  const m = Math.max(0, Math.floor(ms / 60_000));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ${m % 60}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

const utc = (iso) => `${iso.slice(0, 16).replace("T", " ")} UTC`;

/** Board lines about lane health ([] when there is nothing to say). */
export function boardLines(ctx) {
  const lanes = Object.entries(ctx.state.lanes ?? {}).filter(([, t]) => Number.isFinite(Date.parse(t?.at)));
  if (!lanes.length) return [];
  const lines = ["## Lanes", ""];
  for (const [name, t] of lanes.sort(([a], [b]) => a.localeCompare(b))) {
    const age = ctx.now - Date.parse(t.at);
    const when = utc(new Date(Date.parse(t.at)).toISOString());
    lines.push(age > QUIET_MS
      ? `- \`${name}\`: **quiet since ${when}** (${ago(age)} ago); check its scheduled task.`
      : `- \`${name}\`: last tick ${when} (${ago(age)} ago).`);
  }
  return lines;
}
