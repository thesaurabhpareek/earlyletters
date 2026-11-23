/**
 * The bar and the decision rule of the Moments real-library harness (BL-1449, PR 3b, NS-53-R205, R281).
 * Written and committed BEFORE the harness that reads it exists, as R281 asks: the bar cannot be
 * moved after a run. Source: docs/product/prd/28-moments-tab.md section 7.2a ("Junk bar", "The experiment").
 * A change here is a spec change, a bump of MOMENTS_RULES_VERSION, and a founder-visible diff.
 */

/** The grid of section 7.2a. MIN_SPAN is in hours; the rest are in the units of rules.ts. */
export const GRID = {
  minSpanHours: [1, 2, 3],
  nearSeconds: [5, 10, 20],
  nearGroupMax: [30, 60, 120],
  placeRareShare: [0.1, 0.15, 0.25],
} as const;

/** A cell is eligible only with at least this many qualifying days in every 14, and zero wrong reasons. */
export const MIN_QUALIFYING_PER_14_DAYS = 3;
export const MAX_WRONG_REASONS = 0;

/** The junk bar (P6, R60): share of qualifying days the parent marked junk. Counted before any use of "Not this one". */
export const JUNK_BAR = { beforeNotThisOne: 3 / 10, afterNotThisOne: 2 / 10 } as const;

/**
 * Decision rule: among eligible cells take the lowest junk share; ties go to the larger MIN_SPAN.
 * A tie that remains after that is not named in 7.2a; this file breaks it by the smaller
 * nearSeconds, then nearGroupMax, then placeRareShare, so the same input always picks the same cell.
 */
export const DECISION_RULE =
  'lowest junk share among cells with >= 3 of 14 days qualifying and 0 wrong reasons; ties to the larger MIN_SPAN';
