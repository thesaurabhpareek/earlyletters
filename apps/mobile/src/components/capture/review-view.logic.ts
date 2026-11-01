/**
 * The Review trust model as pure functions (D-086, debate Q-013 edit-trust-and-words).
 *
 * One control, "With small fixes | Exactly as said", is both the view and the choice for this letter, until it is
 * saved. Choosing "Exactly as said" never throws a fix away: the fixes stay in the screen's state, so the choice is
 * reversible (the old one-way "Undo every fix" is gone). What is saved is derived from the view.
 */
import type { Edit } from '@scribe/core';
import { wordsCopy } from '@scribe/content';
import { tokens } from '@scribe/design-tokens';
import { copy, fill } from '@/lib/copy';

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

/* ------------------------------------------------------------------ */
/* The letter sheet and the saved moment (EXPERIENCE_PASS S17, S21, P4b) */
/* ------------------------------------------------------------------ */

/**
 * The letter sheet's header row, from the website's ProofLetter (S17): "To Asha · Month 7" on the left (the first
 * weeks and Before You by name), "From Mama" on the right, both in letterDateline caps. `month` is the month of age
 * the letter files into (components/book/chapters `monthFor`): null before birth, 0 the first weeks. VoiceOver never
 * hears the "·": each side has a spoken form ("To Asha, Month 7").
 */
export function letterHeader(input: { childName: string; signsAs: string; month: number | null }): {
  to: string;
  toSpoken: string;
  from: string;
} {
  const r = copy.review;
  const to =
    input.month === null
      ? fill(r.headerToBefore, { child: input.childName })
      : input.month === 0
        ? fill(r.headerToNewborn, { child: input.childName })
        : fill(r.headerTo, { child: input.childName, month: input.month });
  return { to, toSpoken: spokenSeparator(to), from: fill(copy.common.signature, { signsAs: input.signsAs }) };
}

/**
 * "To Asha · Month 7" read aloud as "To Asha, Month 7": the separator (a middle dot with a space on each side, as the
 * content strings write it) becomes a pause, never a word. A middle dot inside a name ("Marcel·la") is left alone.
 */
export function spokenSeparator(text: string): string {
  return text.replace(/\s+·\s+/g, ', ');
}

/**
 * Button labels are 22 characters or fewer with the Asha fixtures (packages/content/test/rules.test.ts). Counted in
 * UTF-16 code units, the same measure as the rules test: cautious for scripts with combining marks, a little generous
 * for wide scripts. A label that runs long wraps; it never clips (button.tsx).
 */
export const BUTTON_MAX_CHARS = 22;

/** "Add to Asha's book", or "Add to the book" when the filled label would pass 22 characters (a long or two-word name, S17). */
export function addButtonLabel(childName: string): string {
  const full = fill(copy.review.destination.addButton, { child: childName });
  return full.length <= BUTTON_MAX_CHARS ? full : copy.review.destination.addButtonShort;
}

/**
 * A typed letter's words as they are kept: exactly as typed, trimmed at the ends and nothing else (S19 "typed words are
 * never touched by the machine"; F04-REQ-012, F06-REQ-037). No character is swapped: a curly apostrophe, an em dash,
 * curly quotes and an ellipsis character stay as the keyboard wrote them.
 */
export function typedFinalText(raw: string): string {
  return raw.trim();
}

/**
 * Whether Review holds changes the person made that are not on the phone yet: their own words from Change words, a fix
 * they put back, or the other view ("Exactly as said" when Review opened with the small fixes, or back). A draft stores
 * them (SR-C-06, lib/capture/review-persist.logic.ts); a letter whose words arrived later, and sample words, do not, so
 * there Close must not say "Saved on this phone" while any is there (P4 critics' pass S1; #289 lens B).
 */
export function reviewHasOwnChanges(input: { userText: string | null; applied: number; proposed: number; view: ReviewView; openedView: ReviewView }): boolean {
  return input.userText !== null || input.applied < input.proposed || input.view !== input.openedView;
}

/** Where the primary keeps the letter: the book, or after a save that did not work, where the person chose (S17). */
export function primaryDestination(input: { saveFailed: boolean; lastInBook: boolean }): boolean {
  return input.saveFailed ? input.lastInBook : true;
}

/**
 * Review's heading: "Read it back" for a letter with a recording; for a letter that was only typed, Write's own name
 * for it ("Your letter"), so a typed letter that comes back to Review (a failed save, the Plus sheet after a one-tap
 * keep, a held letter) keeps the shape it came from and never reads "Read it back" (S20; coordinator's condition on
 * 5.8 row 5a).
 */
export function reviewHeading(input: { typedOnly: boolean }): string {
  return input.typedOnly ? copy.write.label : copy.review.title;
}

/**
 * The primary after a save that did not work (S17): "Try again" for that attempt, with "Your words are still here.
 * That did not work this time." directly above it. The letter itself is never touched.
 */
export function savePrimaryLabel(input: { childName: string; saveFailed: boolean }): string {
  return input.saveFailed ? copy.common.tryAgainButton : addButtonLabel(input.childName);
}

export type SavedKind = 'book' | 'private' | 'voice';

/**
 * The saved moment's chip and line (S21, MOTION 5e). In the book: the chip names the real month ("Kept in Month 7",
 * "Kept in the first weeks", "Kept in Before You") and the line says "Added to Asha's book." with a check. Kept
 * private: the chip "Kept just for you." with the lock, no line. A recording kept before its words: the lock chip
 * "Recording kept on this phone." (true at this moment: a backup upload, when backup is on, comes after the save),
 * or, when its words are on their way, "Your voice is kept. The words will follow."
 */
export function savedMoment(input: { kind: SavedKind; childName: string; month: number | null; keptForWords?: boolean }): {
  chip: string;
  lock: boolean;
  line: string | null;
} {
  const d = copy.review.destination;
  if (input.kind === 'voice') {
    return { chip: input.keptForWords ? wordsCopy.pack.keptToast : d.voiceOnlyToast, lock: true, line: null };
  }
  if (input.kind === 'private') return { chip: d.privateToast, lock: true, line: null };
  const chip = input.month === null ? d.filedChipBefore : input.month === 0 ? d.filedChipNewborn : fill(d.filedChip, { month: input.month });
  return { chip, lock: false, line: fill(d.addedToast, { child: input.childName }) };
}

/**
 * The Book route's params after a save (5.8 row 5): `arrived=<entry id>`, the contract P5's Book reads and clears
 * (it lands on the card under its opener and washes it once). `secondFree=1` on the second kept letter: the Book shows
 * "That was your second free letter." as its own toast after the landing, once, with no action (S21, D-082).
 */
export function arrivalParams(input: { entryId: string; secondFree: boolean }): { arrived: string; secondFree?: '1' } {
  return input.secondFree ? { arrived: input.entryId, secondFree: '1' } : { arrived: input.entryId };
}

/** The saved moment, said once: the chip, a pause, then the line ("Kept in Month 7. Added to Asha's book."). */
export function momentAnnouncement(chip: string, line: string | null): string {
  return line ? `${chip}. ${line}` : chip;
}

/** With a screen reader on, the saved moment holds at least this long, so its announcement is heard before the Book. */
export const SCREEN_READER_HOLD_MS = 3000;
/** And at most this long while it waits for the announcement to end (a slow speech rate), then the Book anyway. */
export const SCREEN_READER_HOLD_MAX_MS = 8000;

/**
 * Where the system says when the screen reader has finished the moment's sentence (TDD 09 2.2, "until the
 * announcement ends"): `heard` once iOS's announcementFinished came for it, `waiting` on iOS before that, `noSignal`
 * where no such event fires (the web preview, Android), which keeps the 3 s hold.
 */
export type AnnouncementEnd = 'heard' | 'waiting' | 'noSignal';

/**
 * When the saved moment hands over to the Book, from the commit: the timeline's end; with a screen reader on, at
 * least 3 s, and while iOS has not yet said the sentence is finished, up to about 8 s (P4 critics' pass S6). A tap
 * still skips at any time.
 */
export function savedMomentDoneMs(input: { dismissAtMs: number; screenReader: boolean; announcement?: AnnouncementEnd }): number {
  if (!input.screenReader) return input.dismissAtMs;
  const floor = Math.max(input.dismissAtMs, SCREEN_READER_HOLD_MS);
  return input.announcement === 'waiting' ? Math.max(floor, SCREEN_READER_HOLD_MAX_MS) : floor;
}

/**
 * How long the saved moment still waits, `elapsedMs` after the commit, with what is known about the screen reader
 * now. Asked again whenever that changes: on Review's path the moment mounts at the commit, before the system has
 * said whether VoiceOver is on, so the first answer can be "off" for a few milliseconds. When "on" arrives, the
 * moment still holds about 3 s from the commit, on both paths.
 */
export function savedMomentLeaveInMs(input: { dismissAtMs: number; screenReader: boolean; elapsedMs: number; announcement?: AnnouncementEnd }): number {
  return Math.max(0, savedMomentDoneMs(input) - input.elapsedMs);
}

/**
 * Whether Write's sheet may be swiped away (S19): not while words are on screen that the last write could not put
 * on this phone. Close stays open in the same case; both work again after the next write that goes through.
 */
export function writeSwipeAllowed(input: { text: string; writeFailed: boolean }): boolean {
  return !(input.writeFailed && input.text.trim().length > 0);
}

/** What one write of Write's words did: the draft it wrote to, and the autosave line to show (null: unchanged). */
export type WriteResult = { ok: boolean; draftId: string | null; saveState: 'saved' | 'failed' | null };

/**
 * One write of Write's words to this phone (S19): the first words create the typed draft, later ones update it.
 * A write that throws (a full disk) answers "failed": "Not saved yet" shows, and Close, Android's back and the
 * swipe hold the sheet open. The next write that goes through answers "saved", which releases all three. Empty
 * words with no draft yet write nothing and change nothing.
 */
export function writeWords(io: { create: (value: string) => string; update: (draftId: string, value: string) => void }, draftId: string | null, value: string): WriteResult {
  try {
    if (!draftId) {
      if (!value.trim()) return { ok: false, draftId: null, saveState: null };
      return { ok: true, draftId: io.create(value), saveState: 'saved' };
    }
    io.update(draftId, value);
    return { ok: true, draftId, saveState: 'saved' };
  } catch {
    return { ok: false, draftId, saveState: 'failed' };
  }
}

/** 5.8 row 5b: the first-letter sign-in sheet rises 600 ms after the Book is on screen, so the letter is seen first. */
export const SIGN_IN_AFTER_BOOK_MS = 600;

/** From the moment Review leaves for the Book: its dissolve (the route's own length), then 600 ms on the Book. */
export function signInAfterLandingMs(reduced: boolean): number {
  return (reduced ? tokens.motion.fadeMs : tokens.motion.route.dissolveMs) + SIGN_IN_AFTER_BOOK_MS;
}
