/**
 * NS-53 the teaching verbs (spec 7.4, R54, R55). A closed set of FIVE (D6):
 * "Leave out this picture" and "Use this album" are dropped. Each stores a
 * day key (and, for naming, the parent's own typed words), never a picture or
 * album identifier. A tap, dismissal, scroll or dwell is not a verb.
 */
import type { DayKey } from './types';

export const MOMENT_VERBS = Object.freeze([
  'name_day', 'not_now', 'not_this_one', 'hide_day', 'keep_close',
] as const);
export type MomentVerb = (typeof MOMENT_VERBS)[number];

/** Longest typed day name, in characters (7.4). */
export const LABEL_MAX = 60;

export type MomentAct =
  | { readonly verb: 'name_day'; readonly dayKey: DayKey; readonly label: string }
  | { readonly verb: Exclude<MomentVerb, 'name_day'>; readonly dayKey: DayKey };

export function isMomentVerb(value: unknown): value is MomentVerb {
  return typeof value === 'string' && (MOMENT_VERBS as readonly string[]).includes(value);
}

/** A name is valid when it has a non-blank body of at most `LABEL_MAX` characters (code points). */
export function isValidDayLabel(label: string): boolean {
  const n = Array.from(label).length;
  return label.trim().length > 0 && n <= LABEL_MAX;
}
