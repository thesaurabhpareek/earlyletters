/**
 * NS-53 the closed reason list (spec 6.4a, R12, R42, R203). 15 reasons in the
 * first release. RSN-SUGGEST (K-SUG not planned, O-32) and RSN-ALBUM (D6, the
 * album chooser is gone) are not in the enum: a reason outside it fails the
 * build. The words live in `packages/content`; these are only the keys.
 */
export const MOMENT_REASONS = Object.freeze([
  'RSN-MARKED', 'RSN-FIRST', 'RSN-BIRTHDAY', 'RSN-MONTHDAY', 'RSN-HOLIDAY', 'RSN-KEPT', 'RSN-PLACE',
  'RSN-HEART', 'RSN-VIDEO', 'RSN-DAY',
  // Not in the precedence list because they come from the kind of card, not from a date's facts.
  'RSN-YEAR', 'RSN-RUN', 'RSN-PICKED', 'RSN-LETTER', 'RSN-QUESTION',
] as const);
export type MomentReason = (typeof MOMENT_REASONS)[number];

/** Precedence when several reasons apply to one date (6.4a). The losers are never shown. */
export const REASON_PRECEDENCE: readonly MomentReason[] = Object.freeze([
  'RSN-MARKED', 'RSN-FIRST', 'RSN-BIRTHDAY', 'RSN-MONTHDAY', 'RSN-HOLIDAY',
  'RSN-KEPT', 'RSN-PLACE', 'RSN-HEART', 'RSN-VIDEO', 'RSN-DAY',
] as const);

export function isMomentReason(value: unknown): value is MomentReason {
  return typeof value === 'string' && (MOMENT_REASONS as readonly string[]).includes(value);
}

/** The one reason that wins among those that apply, or undefined when none of the ranked ones do. */
export function pickReason(applicable: ReadonlySet<MomentReason> | readonly MomentReason[]): MomentReason | undefined {
  const has = new Set<MomentReason>(applicable);
  return REASON_PRECEDENCE.find((r) => has.has(r));
}
