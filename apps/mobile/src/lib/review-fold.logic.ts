/**
 * Review's quiet default (spec 14 sections 3 and 5, BL-1984). Pure and tested (test/review-quiet-default.test.ts).
 *
 * A spoken letter with at least one proposed fix opens with the count row and nothing else of the editing controls:
 * the view control "With small fixes | Exactly as said", the fix rows and "Change words" sit behind the count row.
 * The marks in the words are never folded. A screen reader opens it unfolded (QD-11). The fold is a flag on one
 * Review, never stored, so the next Review opens folded again (QD-10). Keep, Keep private and the Plus gate do not
 * read any of this (QD-07). No word is written here: every line comes from `packages/content` through `copy`.
 */
import { tokens } from '@scribe/design-tokens';
import { copy, fill, plural } from '@/lib/copy';
import type { ReviewView } from '@/components/capture/review-view.logic';

/**
 * Whether there is anything to fold. The machine proposed at least one fix and the words are the machine's: a typed
 * letter, words the person wrote themselves, and the editing state have no count row (QD-04: no fix, no fold).
 */
export function foldApplies(input: { typed: boolean; userText: string | null; editing: boolean; proposed: number }): boolean {
  return !input.typed && input.userText === null && !input.editing && input.proposed > 0;
}

/**
 * Whether the three folded controls are showing. `toggled` is what the parent chose on this Review (null: not yet);
 * until she chooses, a screen reader gets it open and everyone else gets it folded. Nothing to fold means open.
 */
export function foldIsOpen(input: { applies: boolean; toggled: boolean | null; screenReader: boolean }): boolean {
  if (!input.applies) return true;
  return input.toggled ?? input.screenReader;
}

/** The value `toggled` takes when the count row is tapped: the opposite of what is showing now. */
export function foldToggledTo(open: boolean): boolean {
  return !open;
}

/** The view control, the fix rows and "Change words" show together, or not at all. */
export function foldedControlsShow(input: { applies: boolean; open: boolean }): boolean {
  return !input.applies || input.open;
}

/** The count row's spoken hint: what a tap does from the state it is in. The open or closed state is spoken by the control. */
export function foldHint(open: boolean): string {
  return open ? copy.review.foldCloseHint : copy.review.foldOpenHint;
}

/**
 * The count row's words. With fixes in force it says they are marked in the words (and nothing wider, QD-06); every
 * other state keeps the line it already had (`other`), so the row is still there after "Exactly as said" or after
 * every fix is put back (QD-03).
 */
export function countRowText(input: { kind: 'count' | 'other'; applied: number; other: string }): string {
  if (input.kind !== 'count') return input.other;
  return plural(input.applied, copy.review.changesMarkedOne, fill(copy.review.changesMarked, { count: input.applied }));
}

/** Which line sits under which Keep button, as the key it comes from. */
export type KeepLineKind = 'add' | 'private';

/** The two lines are not shown after a failed save (the caution line sits above "Try again") or while editing (QD-08, QD-09). */
export function keepLinesShow(input: { saveFailed: boolean; editing: boolean }): boolean {
  return !input.saveFailed && !input.editing;
}

export function keepLine(kind: KeepLineKind): string {
  return kind === 'add' ? copy.review.destination.addLine : copy.review.destination.privateLine;
}

/** The mark card's entry timing (CDESO-3): its token, and with Reduce Motion no delay and the plain fade. */
export function markCardTiming(reduced: boolean): { delayMs: number; ms: number } {
  return reduced ? { delayMs: 0, ms: tokens.motion.fadeMs } : { delayMs: tokens.motion.markCard.delayMs, ms: tokens.motion.markCard.ms };
}
