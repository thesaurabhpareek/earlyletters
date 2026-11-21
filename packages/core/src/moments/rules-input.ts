/**
 * The rule values PR 2 reads (spec 7.2 and 7.2a), as a flat interface. Values live in PR 1's
 * `rules.ts` under `MOMENTS_RULES_VERSION`; PR 2 never hardcodes one. All PROPOSED, ASSUMED.
 */
export interface GroupingRules {
  /** Gap from the previous frame at most this joins a near-duplicate group (10). */
  readonly NEAR_SECONDS: number;
  /** A group closes when its span from the first frame would exceed this (60). */
  readonly NEAR_GROUP_MAX_SECONDS: number;
  /** A gap above this between candidates splits sessions (3 hours). */
  readonly SESSION_GAP_SECONDS: number;
  /** Span rule: first to last candidate at least this (2 hours). */
  readonly MIN_SPAN_SECONDS: number;
  /** Hours rule: this many candidates in a day qualify on their own (5). */
  readonly BUSY_DAY: number;
  /** Candidates needed for a busy day under either predicate (4, the count of "4 within 3 hours"). */
  readonly BUSY_HOURS_COUNT: number;
  /** Hours rule: BUSY_HOURS_COUNT candidates starting within this window (3 hours). */
  readonly BUSY_HOURS_WITHIN_SECONDS: number;
  /** One rules field, two predicates (EX-ENG-6 pattern); the PR 3b harness picks. */
  readonly BUSY_RULE: 'span' | 'hours';
}
