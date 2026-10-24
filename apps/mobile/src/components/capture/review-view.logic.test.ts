import { tokens } from '@scribe/design-tokens';
import { describe, expect, it } from 'vitest';
import {
  BUTTON_MAX_CHARS,
  SIGN_IN_AFTER_BOOK_MS,
  addButtonLabel,
  arrivalParams,
  countLine,
  fixesInForce,
  letterHeader,
  rowShows,
  savePrimaryLabel,
  savedMoment,
  setAsideAtSave,
  showViewControl,
  signInAfterLandingMs,
  spokenSeparator,
  viewFromSetting,
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
