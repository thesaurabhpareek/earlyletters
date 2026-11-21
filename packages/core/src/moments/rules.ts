/**
 * NS-53 the suggestion rules as data (spec 7.2, 7.2a; R267, R281; CODE-R13: one
 * definition). EVERY value below is PROPOSED and ASSUMED, nobody's measurement.
 * The R205 harness (BL-1449) and the card sort (G4) confirm or replace them in
 * one PR with `MOMENTS_RULES_VERSION` bumped and the goldens regenerated.
 */
export const MOMENTS_RULES_VERSION = 1;

/** Which predicate qualifies a busy day (R281a; EX-ENG-6). PR 2 builds both; the harness chooses. */
export type QualifyPredicate = 'span' | 'busy_hours';

export const RULES = Object.freeze({
  /** Days back from today that Recent looks at (7.2; NS-51-R7). */
  WINDOW_DAYS: 90,
  /** Candidates (a burst or near-duplicate group is one) that make a day busy. */
  BUSY_DAY: 5,
  /** `BUSY_HOURS_COUNT` candidates within `BUSY_HOURS_WITHIN_HOURS` hours. */
  BUSY_HOURS_COUNT: 4,
  BUSY_HOURS_WITHIN_HOURS: 3,
  /** Sessions in a day split at this gap, in hours. */
  SESSION_GAP_HOURS: 3,
  /** First to last candidate at least this long, in hours, qualifies on the span rule. */
  MIN_SPAN_HOURS: 2,
  /** A candidate joins the previous item when its gap to that item's last frame is at most this. */
  NEAR_SECONDS: 10,
  /** A near-duplicate group closes before its span from its first frame would exceed this. */
  NEAR_GROUP_MAX_SECONDS: 60,
  /** A place line shows only when its share of the window's candidates is below this. */
  PLACE_RARE_SHARE: 0.15,
  /** Junk bar the engine must meet before any use of "Not this one", in days of 10 (R281e). */
  JUNK_MAX_BEFORE_VERB: 3,
  /** Repair bar after one use of "Not this one", in days of 10 (R60). */
  JUNK_MAX_AFTER_VERB: 2,
  JUNK_SAMPLE_DAYS: 10,
  /** Which qualification predicate is live. */
  QUALIFY_PREDICATE: 'span' as QualifyPredicate,
  /** R267 switches for the OPEN rows; each reversal is a one-file change plus golden regeneration. */
  LEAVE_OUT_ENABLED: false,
  ALBUMS_ENABLED: false,
  PLACE_ON_EVERY_CARD: false,
} as const);

export type MomentsRules = typeof RULES;
