// Trial statistics for the eval runner. Pure functions, no I/O.
//
// Outcomes per trial: "pass", "fail", "unknown" (grader could not decide),
// "error" (grader crashed, timed out or returned a malformed result).
// unknown and error are never counted as pass OR fail: counting them as fail
// would punish the candidate for a grader gap, counting them as pass would
// hide it. They are reported on their own and make the metrics three-valued
// (true, false, or null when the result is not yet determined).

export const OUTCOMES = ["pass", "fail", "unknown", "error"];

/** Summarise the outcomes of k trials of one task. */
export function summarizeTrials(outcomes) {
  const n = outcomes.length;
  const c = Object.fromEntries(OUTCOMES.map((o) => [o, outcomes.filter((x) => x === o).length]));
  const determinate = c.pass + c.fail;
  const undetermined = c.unknown + c.error;

  // pass@1: share of determinate trials that passed.
  const pass_at_1 = determinate === 0 ? null : c.pass / determinate;
  // pass@k: at least one of the k trials passed. A task with no pass but some
  // undetermined trials is unresolved (null), not failed.
  const pass_at_k = c.pass > 0 ? true : undetermined > 0 || n === 0 ? null : false;
  // pass^k: every one of the k trials passed (reliability). One fail settles it
  // as false; otherwise any undetermined trial leaves it unresolved.
  const pass_hat_k = c.fail > 0 ? false : undetermined > 0 || n === 0 ? null : true;

  const flags = [];
  // Anthropic guidance: 0% on many trials usually means a broken task or grader.
  if (c.pass === 0 && c.fail >= 3 && undetermined === 0) flags.push("all-fail-check-task-and-grader");
  if (c.unknown > 0) flags.push("has-unknown");
  if (c.error > 0) flags.push("has-error");
  return { n, ...c, pass_at_1, pass_at_k, pass_hat_k, flags };
}

/** Roll per-task summaries up to one class. Tasks, not trials, are the unit. */
export function summarizeClass(taskSummaries) {
  const tasks = taskSummaries.length;
  const p1 = taskSummaries.map((s) => s.pass_at_1).filter((v) => v !== null);
  const mean = (xs) => (xs.length === 0 ? null : xs.reduce((a, b) => a + b, 0) / xs.length);
  const frac = (key) => {
    const known = taskSummaries.map((s) => s[key]).filter((v) => v !== null);
    return known.length === 0 ? null : known.filter(Boolean).length / known.length;
  };
  return {
    tasks,
    pass_at_1: mean(p1),
    pass_at_k: frac("pass_at_k"),
    pass_hat_k: frac("pass_hat_k"),
    unresolved_tasks: taskSummaries.filter((s) => s.pass_at_k === null || s.pass_hat_k === null).length,
    unknown_trials: taskSummaries.reduce((a, s) => a + s.unknown, 0),
    error_trials: taskSummaries.reduce((a, s) => a + s.error, 0),
  };
}

export const pct = (v) => (v === null ? "n/a" : `${Math.round(v * 1000) / 10}%`);
export const tri = (v) => (v === null ? "unresolved" : v ? "yes" : "no");
