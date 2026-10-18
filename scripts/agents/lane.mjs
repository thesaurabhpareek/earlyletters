// Lane health (owner: ops). Every dispatcher run records a tick per lane, and the
// board flags a lane that has gone quiet. Contract: pure functions over ctx.
//   ctx = { state, now, runId, LOCAL, env, roster }
/** Record this dispatcher run in the board state. */
export function recordTick(ctx) {}
/** Board lines about lane health ([] when there is nothing to say). */
export function boardLines(ctx) { return []; }
