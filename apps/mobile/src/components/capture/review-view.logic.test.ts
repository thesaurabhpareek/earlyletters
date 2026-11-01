import { tokens } from '@scribe/design-tokens';
import { describe, expect, it } from 'vitest';
import {
  BUTTON_MAX_CHARS,
  SCREEN_READER_HOLD_MS,
  SIGN_IN_AFTER_BOOK_MS,
  addButtonLabel,
  arrivalParams,
  countLine,
  fixesInForce,
  letterHeader,
  momentAnnouncement,
  primaryDestination,
  reviewHeading,
  rowShows,
  savePrimaryLabel,
  savedMoment,
  savedMomentDoneMs,
  savedMomentLeaveInMs,
  setAsideAtSave,
  showViewControl,
  signInAfterLandingMs,
  spokenSeparator,
  typedFinalText,
  viewFromSetting,
  writeSwipeAllowed,
  pageEmptinessChanged,
  sheetKeyboardOffset,
  followCaretToEnd,
} from './review-view.logic';

describe('review view (D-086)', () => {
  it('defaults to small fixes, and only an explicit exact setting changes that', () => {
    expect(viewFromSetting(null)).toBe('fixes');
    expect(viewFromSetting('fixes')).toBe('fixes');
    expect(viewFromSetting('exact')).toBe('exact');
  });

  it('round-trips: Exactly as said and back keeps every fix (derived state, nothing thrown away)', () => {
    const applied = [{ n: 1 }, { n: 2 }, { n: 3 }];
    expect(fixesInForce('exact', applied)).toEqual([]);
    expect(fixesInForce('fixes', applied)).toEqual(applied);
    // Toggling does not mutate what the screen holds.
    expect(applied).toHaveLength(3);
  });

  it('counts the fixes set aside by Exactly as said once, at save', () => {
    expect(setAsideAtSave('exact', [1, 2, 3])).toBe(3);
    expect(setAsideAtSave('fixes', [1, 2, 3])).toBe(0);
  });

  it('shows the view control only when something was proposed', () => {
    expect(showViewControl(0)).toBe(false);
    expect(showViewControl(2)).toBe(true);
  });

  it('has three honest zeros and never says "nothing needed fixing" for a language without fix rules', () => {
    expect(countLine({ view: 'fixes', applied: 2, proposed: 2, hasFixRules: true })).toBe('count');
    expect(countLine({ view: 'fixes', applied: 0, proposed: 0, hasFixRules: true })).toBe('none');
    expect(countLine({ view: 'fixes', applied: 0, proposed: 3, hasFixRules: true })).toBe('afterUndo');
    expect(countLine({ view: 'fixes', applied: 0, proposed: 0, hasFixRules: false })).toBe('noRules');
    expect(countLine({ view: 'exact', applied: 4, proposed: 4, hasFixRules: true })).toBe('exact');
  });
});

describe('what a fix row shows', () => {
  it('shows a taken-out sound struck through', () => {
    expect(rowShows({ original: ' um', replacement: '' })).toEqual({ kind: 'struck', text: 'um' });
  });
  it('shows a name spelled the way the family spells it as a change', () => {
    expect(rowShows({ original: 'Usher', replacement: 'Asha' })).toEqual({ kind: 'change', from: 'Usher', to: 'Asha' });
  });
  it('shows added punctuation as an addition', () => {
    expect(rowShows({ original: '', replacement: '.' })).toEqual({ kind: 'added', text: '.' });
    expect(rowShows({ original: 'today', replacement: 'today.' })).toEqual({ kind: 'added', text: 'today.' });
  });
  it('shows a grammar slip as a change', () => {
    expect(rowShows({ original: 'she have', replacement: 'she has' })).toEqual({ kind: 'change', from: 'she have', to: 'she has' });
  });
  it('shows a bare break as a mark', () => {
    expect(rowShows({ original: ' ', replacement: '\n\n' })).toEqual({ kind: 'mark' });
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// The letter sheet and the saved moment (EXPERIENCE_PASS_2026-10 S17, S21, package P4b). Fixtures: the fictional
// family Asha only (CLAUDE.md).
// ---------------------------------------------------------------------------------------------------------------------

describe('the letter sheet header (S17)', () => {
  it('names the month the letter files into, the first weeks or Before You, and who it is from', () => {
    expect(letterHeader({ childName: 'Asha', signsAs: 'Mama', month: 7 })).toEqual({ to: 'To Asha · Month 7', toSpoken: 'To Asha, Month 7', from: 'From Mama' });
    expect(letterHeader({ childName: 'Asha', signsAs: 'Mama', month: 0 }).to).toBe('To Asha · The first weeks');
    expect(letterHeader({ childName: 'Asha', signsAs: 'Mama', month: null }).to).toBe('To Asha · Before You');
  });

  it('VoiceOver never hears the separator: "To Asha, Month 4" and "From Mama"', () => {
    const h = letterHeader({ childName: 'Asha', signsAs: 'Mama', month: 4 });
    expect(h.toSpoken).toBe('To Asha, Month 4');
    expect(h.toSpoken).not.toContain('·');
    expect(h.from).not.toContain('·');
    expect(spokenSeparator('To Asha · Before You')).toBe('To Asha, Before You');
  });

  it('a middle dot inside a name (the Catalan l·l) is part of the name, never a pause', () => {
    expect(spokenSeparator('To Asha·la · Month 4')).toBe('To Asha·la, Month 4');
    expect(letterHeader({ childName: 'Asha·la', signsAs: 'Mama', month: 4 }).toSpoken).toBe('To Asha·la, Month 4');
  });
});

describe('the primary button label (S17)', () => {
  it('reads "Add to Asha\'s book", and "Add to the book" whenever the filled label would pass 22 characters', () => {
    expect(addButtonLabel('Asha')).toBe("Add to Asha's book");
    expect("Add to Asha Rose's book".length).toBeGreaterThan(BUTTON_MAX_CHARS);
    expect(addButtonLabel('Asha Rose')).toBe('Add to the book');
    expect(addButtonLabel('Asha Devi')).toBe('Add to the book');
    for (const name of ['Asha', 'Asha Rose', 'Asha Devi', 'Leo']) expect(addButtonLabel(name).length, name).toBeLessThanOrEqual(BUTTON_MAX_CHARS);
  });

  it('after a save that did not work, the primary reads "Try again" for that attempt', () => {
    expect(savePrimaryLabel({ childName: 'Asha', saveFailed: true })).toBe('Try again');
    expect(savePrimaryLabel({ childName: 'Asha', saveFailed: false })).toBe("Add to Asha's book");
  });

  it('"Try again" keeps the letter where the person chose; before a failure the primary is the book', () => {
    expect(primaryDestination({ saveFailed: true, lastInBook: false })).toBe(false);
    expect(primaryDestination({ saveFailed: true, lastInBook: true })).toBe(true);
    expect(primaryDestination({ saveFailed: false, lastInBook: false })).toBe(true);
  });
});

describe('a typed letter (S19, S20)', () => {
  it('is kept exactly as typed: only the ends are trimmed, no character is swapped', () => {
    const smart = 'Asha\u2019s first word \u2014 mama. \u201CMore\u201D she said\u2026';
    expect(typedFinalText(smart)).toBe(smart);
    expect(typedFinalText(`  ${smart}\n`)).toBe(smart);
    expect(typedFinalText('one\n\ntwo')).toBe('one\n\ntwo');
  });

  it('Write swipes away unless words on screen could not be written to the phone', () => {
    expect(writeSwipeAllowed({ text: 'Asha, you sang.', writeFailed: false })).toBe(true);
    expect(writeSwipeAllowed({ text: 'Asha, you sang.', writeFailed: true })).toBe(false);
    expect(writeSwipeAllowed({ text: ' \n ', writeFailed: true })).toBe(true);
    expect(writeSwipeAllowed({ text: '', writeFailed: false })).toBe(true);
  });

  it('Write renders only when the page goes from empty to words or back, never on each keystroke (TestFlight build 1)', () => {
    expect(pageEmptinessChanged('', 'A')).toBe(true);
    expect(pageEmptinessChanged('Asha', '')).toBe(true);
    expect(pageEmptinessChanged('Asha', 'Asha,')).toBe(false);
    expect(pageEmptinessChanged('', ' \n ')).toBe(false);
    expect(pageEmptinessChanged(' ', 'a')).toBe(true);
    // A composing keyboard sends many partial strings; none of them is empty-to-words, so none renders.
    const steps = ['\u0906', '\u0906\u0936', '\u0906\u0936\u093e'];
    expect(steps.slice(1).map((v, i) => pageEmptinessChanged(steps[i], v))).toEqual([false, false]);
  });

  it('the keyboard is measured from the top of the screen, the sheet from its own top: the offset is the sheet\'s top', () => {
    expect(sheetKeyboardOffset(852, 793)).toBe(59);
    expect(sheetKeyboardOffset(667, 667)).toBe(0);
    expect(sheetKeyboardOffset(852, 0)).toBe(0); // not measured yet
    expect(sheetKeyboardOffset(0, 600)).toBe(0);
    expect(sheetKeyboardOffset(700, 720)).toBe(0); // never negative
    expect(sheetKeyboardOffset(852.4, 793.1)).toBe(59);
  });

  it('the page follows the caret only when writing on at the end, never while editing mid-text', () => {
    expect(followCaretToEnd({ selectionEnd: 12, length: 12 })).toBe(true);
    expect(followCaretToEnd({ selectionEnd: null, length: 12 })).toBe(true);
    expect(followCaretToEnd({ selectionEnd: 4, length: 12 })).toBe(false);
  });

  it('back in Review it keeps Write\'s heading, "Your letter"; a letter with a recording reads "Read it back"', () => {
    expect(reviewHeading({ typedOnly: true })).toBe('Your letter');
    expect(reviewHeading({ typedOnly: false })).toBe('Read it back');
  });
});

describe('the saved moment (S21)', () => {
  it('in the book: the chip names the real month, the first weeks or Before You, and the line says where it went', () => {
    expect(savedMoment({ kind: 'book', childName: 'Asha', month: 7 })).toEqual({ chip: 'Kept in Month 7', lock: false, line: "Added to Asha's book." });
    expect(savedMoment({ kind: 'book', childName: 'Asha', month: 0 }).chip).toBe('Kept in the first weeks');
    expect(savedMoment({ kind: 'book', childName: 'Asha', month: null }).chip).toBe('Kept in Before You');
  });

  it('kept private: the lock chip "Kept just for you.", no line', () => {
    expect(savedMoment({ kind: 'private', childName: 'Asha', month: 7 })).toEqual({ chip: 'Kept just for you.', lock: true, line: null });
  });

  it('a recording kept before its words: the lock chip, true at this moment', () => {
    expect(savedMoment({ kind: 'voice', childName: 'Asha', month: 7 })).toEqual({ chip: 'Recording kept on this phone.', lock: true, line: null });
    expect(savedMoment({ kind: 'voice', childName: 'Asha', month: 7, keptForWords: true }).chip).toBe('Your voice is kept. The words will follow.');
  });

  it('never counts anything: no number but the month in any chip or line', () => {
    for (const kind of ['book', 'private', 'voice'] as const) {
      const m = savedMoment({ kind, childName: 'Asha', month: 7 });
      expect(`${m.chip} ${m.line ?? ''}`.replace('Month 7', '')).not.toMatch(/\d/);
    }
  });

  it('VoiceOver hears the chip, then the line, as one announcement; the lock chip alone when there is no line', () => {
    expect(momentAnnouncement('Kept in Month 7', "Added to Asha's book.")).toBe("Kept in Month 7. Added to Asha's book.");
    expect(momentAnnouncement('Kept just for you.', null)).toBe('Kept just for you.');
  });

  it('with a screen reader on, the moment holds about 3 s so the announcement is heard before the Book', () => {
    expect(SCREEN_READER_HOLD_MS).toBe(3000);
    expect(savedMomentDoneMs({ dismissAtMs: 900, screenReader: false })).toBe(900);
    expect(savedMomentDoneMs({ dismissAtMs: 900, screenReader: true })).toBe(3000);
    expect(savedMomentDoneMs({ dismissAtMs: 4000, screenReader: true })).toBe(4000);
  });

  it('asked again later, it still counts from the commit, and never asks for a wait below zero', () => {
    expect(savedMomentLeaveInMs({ dismissAtMs: 900, screenReader: false, elapsedMs: 0 })).toBe(900);
    expect(savedMomentLeaveInMs({ dismissAtMs: 900, screenReader: true, elapsedMs: 30 })).toBe(2970);
    expect(savedMomentLeaveInMs({ dismissAtMs: 900, screenReader: false, elapsedMs: 40 })).toBe(860);
    expect(savedMomentLeaveInMs({ dismissAtMs: 900, screenReader: true, elapsedMs: 3500 })).toBe(0);
  });

  it('lands on the Book with `arrived=<entry id>`, and asks for the second-free toast only on the second letter', () => {
    expect(arrivalParams({ entryId: 'e1', secondFree: false })).toEqual({ arrived: 'e1' });
    expect(arrivalParams({ entryId: 'e1', secondFree: true })).toEqual({ arrived: 'e1', secondFree: '1' });
  });

  it('the first-letter sign-in sheet rises 600 ms after the Book is on screen (5.8 row 5b)', () => {
    expect(SIGN_IN_AFTER_BOOK_MS).toBe(600);
    expect(signInAfterLandingMs(false)).toBe(tokens.motion.route.dissolveMs + 600);
    expect(signInAfterLandingMs(true)).toBe(tokens.motion.fadeMs + 600);
  });
});
