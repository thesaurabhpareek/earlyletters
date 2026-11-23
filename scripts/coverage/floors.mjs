// Pure checks on coverage floors (BRIEF CI-COV, gate G9). A floor is a whole number and never above the measured value;
// the measured numbers come from a CI run (docs/ops/coverage-measured.json: one number per workspace and the run id),
// never from this repo's own edit alone. No file or network access here.

export const METRICS = ['statements', 'branches', 'functions', 'lines'];

/**
 * Flatten a workspace's thresholds into `[{ key, metric, floor }]`. `key` is `<workspace>` for the workspace floors and
 * `<workspace>:<glob>` for a per-file floor.
 * @param {string} workspace
 * @param {Record<string, any>} thresholds
 * @returns {Array<{ key: string, metric: string, floor: number }>}
 */
export function flattenFloors(workspace, thresholds) {
  /** @type {Array<{ key: string, metric: string, floor: number }>} */
  const out = [];
  for (const [k, v] of Object.entries(thresholds ?? {})) {
    if (METRICS.includes(k)) out.push({ key: workspace, metric: k, floor: v });
    else if (v && typeof v === 'object') for (const [m, f] of Object.entries(v)) out.push({ key: `${workspace}:${k}`, metric: m, floor: f });
  }
  return out;
}

/** Floors that are not whole numbers between 0 and 100. */
export const notWhole = (floors) => floors.filter((f) => !Number.isInteger(f.floor) || f.floor < 0 || f.floor > 100);

/**
 * Problems with `measured` against `floors`. `measured` is `{ run, numbers: { <key>: { <metric>: n } } }`.
 * `base` is the base branch's copy (or null when it cannot be compared).
 * @param {Array<{ key: string, metric: string, floor: number }>} floors
 * @param {any} measured
 * @param {any} [base]
 * @returns {string[]}
 */
export function measuredProblems(floors, measured, base = null) {
  const out = [];
  if (!measured?.run) out.push('the measured file has no run id');
  for (const f of floors) {
    const n = measured?.numbers?.[f.key]?.[f.metric];
    if (typeof n !== 'number') out.push(`no measured ${f.metric} for ${f.key}`);
    else if (f.floor > n) out.push(`floor ${f.floor} is above the measured ${n} (${f.metric}, ${f.key})`);
  }
  if (base && base.run === measured?.run) {
    for (const [key, ms] of Object.entries(measured?.numbers ?? {})) {
      for (const [m, n] of Object.entries(ms)) if (typeof base.numbers?.[key]?.[m] === 'number' && n > base.numbers[key][m]) out.push(`${m} for ${key} rose without a new run id`);
    }
  }
  return out;
}
