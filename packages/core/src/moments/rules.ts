// Spec 7.2 and 7.2a: the suggestion rules as DATA. One definition per value (CODE-R13).
// Every number is PROPOSED and ASSUMED: nobody's measurement. PR 3b (the R205 harness) sets
// them by experiment; a change is a one-line diff here, a bump of MOMENTS_RULES_VERSION and
// golden regeneration. All durations are in SECONDS unless the name says otherwise.

export const MOMENTS_RULES_VERSION = 1;

const HOUR = 3600;

/** Recent window in days (7.2, NS-51-R7). */
export const WINDOW_DAYS = 90;
/** Candidates, not frames: a burst or near-duplicate group counts once (R281 b). */
export const BUSY_DAY = 5;
/** The older predicate, kept behind the same rules field: 4 candidates within 3 hours. */
export const BUSY_HOURS = { count: 4, withinSeconds: 3 * HOUR } as const;
/** Span rule: first to last candidate at least this long, or candidates in two sessions. Seconds. */
export const MIN_SPAN = 2 * HOUR;
/** Sessions inside a day split at this gap. Seconds. */
export const SESSION_GAP = 3 * HOUR;
/** Gap from the PREVIOUS item's last frame, never from the first frame. Seconds. */
export const NEAR_SECONDS = 10;
/** Chaining stops: a group closes when its span from its first frame would exceed this. Seconds. */
export const NEAR_GROUP_MAX = 60;
/** A place line shows only when not home and its share of the window's candidates is below this. */
export const PLACE_RARE_SHARE = 0.15;
/** The parent's own junk marks, as a share of days (R281 e, R60). */
export const JUNK_BAR = { beforeNotThisOne: 3 / 10, afterNotThisOne: 2 / 10 } as const;

/** Which busy-day predicate Recent uses (R281 a). PR 3b decides by the lower share of junk days. */
export type SpanPredicate = 'span' | 'busyHours';

export interface MomentsRules {
  readonly version: number;
  readonly windowDays: number;
  readonly busyDay: number;
  readonly busyHours: { readonly count: number; readonly withinSeconds: number };
  readonly minSpan: number;
  readonly sessionGap: number;
  readonly nearSeconds: number;
  readonly nearGroupMax: number;
  readonly placeRareShare: number;
  readonly junkBar: { readonly beforeNotThisOne: number; readonly afterNotThisOne: number };
  readonly spanPredicate: SpanPredicate;
}

export const MOMENTS_RULES: MomentsRules = Object.freeze({
  version: MOMENTS_RULES_VERSION,
  windowDays: WINDOW_DAYS,
  busyDay: BUSY_DAY,
  busyHours: BUSY_HOURS,
  minSpan: MIN_SPAN,
  sessionGap: SESSION_GAP,
  nearSeconds: NEAR_SECONDS,
  nearGroupMax: NEAR_GROUP_MAX,
  placeRareShare: PLACE_RARE_SHARE,
  junkBar: JUNK_BAR,
  spanPredicate: 'span',
});
