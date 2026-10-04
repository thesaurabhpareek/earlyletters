/**
 * The Review trust model as pure functions (D-086, debate Q-013 edit-trust-and-words).
 *
 * One control, "With small fixes | Exactly as said", is both the view and the choice for this letter, until it is
 * saved. Choosing "Exactly as said" never throws a fix away: the fixes stay in the screen's state, so the choice is
 * reversible (the old one-way "Undo every fix" is gone). What is saved is derived from the view.
 */
import type { Edit } from '@scribe/core';

export type ReviewView = 'fixes' | 'exact';

/** Settings key for the default view of new letters ("Word for word" switch). Absent means small fixes. */
export const DEFAULT_VIEW_SETTING = 'review.defaultView';

export function viewFromSetting(value: string | null | undefined): ReviewView {
  return value === 'exact' ? 'exact' : 'fixes';
}

/** The fixes that are in force for a view: none in "Exactly as said", all that were not put back otherwise. */
export function fixesInForce<T>(view: ReviewView, applied: readonly T[]): T[] {
  return view === 'exact' ? [] : [...applied];
}

/**
 * Fixes the parent put back, for `machine_edit_reverted`-style counts at save: the ones tapped one by one are
 * counted as they happen; choosing "Exactly as said" counts the rest as set aside once, at save.
 */
export function setAsideAtSave(view: ReviewView, applied: readonly unknown[]): number {
  return view === 'exact' ? applied.length : 0;
}

/** Whether the view control is shown: only when the machine proposed at least one fix for this letter. */
export function showViewControl(proposed: number): boolean {
  return proposed > 0;
}

export type CountLine = 'count' | 'none' | 'afterUndo' | 'noRules' | 'exact';

/**
 * Which sentence sits under the card. Zero has three honest wordings, and a language with no fix rules never
 * claims "Nothing needed fixing".
 */
export function countLine(input: { view: ReviewView; applied: number; proposed: number; hasFixRules: boolean }): CountLine {
  if (input.view === 'exact') return 'exact';
  if (input.applied > 0) return 'count';
  if (input.proposed > 0) return 'afterUndo';
  return input.hasFixRules ? 'none' : 'noRules';
}

export type RowShows =
  | { kind: 'struck'; text: string } // words taken out: shown struck through
  | { kind: 'change'; from: string; to: string } // a word spelled another way
  | { kind: 'added'; text: string } // punctuation, a break
  | { kind: 'mark' }; // nothing printable (a pure break)

/** What a fix row (and the inline mark) shows for one fix. */
export function rowShows(e: Pick<Edit, 'original' | 'replacement'>): RowShows {
  const from = e.original.trim();
  const to = e.replacement.trim();
  if (from && !to) return { kind: 'struck', text: from };
  if (from && to) {
    // Punctuation riding on a word ("Usher" to "Usher,") reads as an addition, not a change of word.
    const plain = (t: string) => t.replace(/[\p{P}\p{S}]/gu, '');
    if (plain(from) === plain(to) && plain(from) !== '') return { kind: 'added', text: to };
    return { kind: 'change', from, to };
  }
  if (to) return { kind: 'added', text: to };
  return { kind: 'mark' };
}
