// Spec 6.4a: the closed reason list. 15 in the first release. No RSN-ALBUM (D6, R57 dropped),
// no RSN-SUGGEST (EX-AI-6, EX-CPO-14). A reason outside this list fails the build (R42).
// Words a parent reads live in packages/content (PR 12), never here.

export const REASONS = [
  'RSN-MARKED',
  'RSN-BIRTHDAY',
  'RSN-MONTHDAY',
  'RSN-KEPT',
  'RSN-HEART',
  'RSN-VIDEO',
  'RSN-DAY',
  'RSN-YEAR',
  'RSN-RUN',
  'RSN-PICKED',
  'RSN-PLACE',
  'RSN-HOLIDAY',
  'RSN-FIRST',
  'RSN-LETTER',
  'RSN-QUESTION',
] as const;

export type Reason = (typeof REASONS)[number];

/**
 * Precedence when several reasons apply to one date, strongest first (6.4a). Losing reasons are
 * not shown. Reasons not listed here (year, run, picked, letter, question) belong to their own
 * card kinds and are never in competition on one date.
 */
export const REASON_PRECEDENCE = [
  'RSN-MARKED',
  'RSN-FIRST',
  'RSN-BIRTHDAY',
  'RSN-MONTHDAY',
  'RSN-HOLIDAY',
  'RSN-KEPT',
  'RSN-PLACE',
  'RSN-HEART',
  'RSN-VIDEO',
  'RSN-DAY',
] as const satisfies readonly Reason[];

export function isReason(value: unknown): value is Reason {
  return typeof value === 'string' && (REASONS as readonly string[]).includes(value);
}

/** Lower number wins. Reasons outside the precedence list return null. */
export function reasonRank(reason: Reason): number | null {
  const i = (REASON_PRECEDENCE as readonly Reason[]).indexOf(reason);
  return i < 0 ? null : i;
}
