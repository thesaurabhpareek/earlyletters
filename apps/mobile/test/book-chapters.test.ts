/// <reference types="node" />
/**
 * The Book's month openers and Read together's dateline (EXPERIENCE_PASS S26, S30; package P5). Fictional family
 * "Asha" only: Mama and Papa.
 */
import { describe, expect, it, vi } from 'vitest';

// child-store reads the native store; the signature rule it provides is the only part used here.
vi.mock('@/components/child/child-store', () => ({ authorOf: (e: { authorSignsAs?: string }, c: { signsAs: string }) => e.authorSignsAs ?? c.signsAs }));

import { en } from '@scribe/content';
import {
  bookChapters,
  chapterTitle,
  currentChapterKey,
  fromLine,
  groupChapters,
  monthRange,
  monthSpan,
  monthStart,
  openerOf,
  readingDateline,
  spokenLine,
} from '../src/components/book/chapters';
import type { Child, Entry } from '../src/lib/store';

// Born 13 March 2026: Month 7 runs from 13 October to 12 November.
const ASHA: Child = { id: 'child-asha', name: 'Asha', birthday: '2026-03-13', dueDate: null, signsAs: 'Mama', remindersOn: true, familyCanRead: false };
const EXPECTING: Child = { ...ASHA, id: 'child-expecting', birthday: null, dueDate: '2026-12-01' };
const base = { captureMode: 'typed', editLevel: 'verbatim', promptKey: null, engineVersion: 3, machineEdits: [], soundsLikeMe: null, childId: ASHA.id } as const;
const letter = (id: string, occurredOn: string, extra: Partial<Entry> = {}): Entry =>
  ({ ...base, id, kind: 'letter', occurredOn, capturedAt: `${occurredOn}T19:00:00.000Z`, rawTranscript: 'You laughed.', finalText: 'You laughed.', inBook: true, ...extra }) as Entry;

describe('month ranges (book.monthRange, S26)', () => {
  it('fills {a} to {b} with the first and last day of the month of age, never a raw placeholder', () => {
    expect(en.book.monthRange).toBe('{a} to {b}');
    expect(monthSpan(ASHA, 7)).toEqual({ start: '2026-10-13', end: '2026-11-12' });
    expect(monthRange(ASHA, 7, 'en-US')).toBe('October 13 to November 12');
    expect(monthRange(ASHA, 7, 'en-GB')).toBe('13 October to 12 November');
    for (let m = 0; m < 24; m++) expect(monthRange(ASHA, m, 'en-US')).not.toMatch(/[{}]/);
  });

  it('the first weeks start on the birthday; Before You has no range', () => {
    expect(monthSpan(ASHA, 0)).toEqual({ start: '2026-03-13', end: '2026-04-12' });
    expect(monthRange(ASHA, null)).toBeNull();
    expect(monthRange(EXPECTING, 0)).toBeNull();
  });

  it('counts months the way the age does, clamped in short months (born January 31)', () => {
    expect(monthStart('2026-01-31', 1)).toBe('2026-02-28');
    expect(monthStart('2024-01-31', 1)).toBe('2024-02-29');
    expect(monthSpan({ birthday: '2026-01-31' }, 0)).toEqual({ start: '2026-01-31', end: '2026-02-27' });
    expect(monthSpan({ birthday: '2026-11-15' }, 1)).toEqual({ start: '2026-12-15', end: '2027-01-14' });
  });
});

describe('chapters and the current month (S26)', () => {
  it('marks the month the child is in today, and gives every chapter its range', () => {
    const chapters = bookChapters([letter('l2', '2026-10-14'), letter('l1', '2026-09-20')], ASHA, '2026-10-20', 'en-US');
    expect(chapters.map((c) => [c.key, c.current, c.range])).toEqual([
      ['m7', true, 'October 13 to November 12'],
      ['m6', false, 'September 13 to October 12'],
    ]);
  });

  it('a current month with no letters yet opens the book on its own, with nothing counted', () => {
    const chapters = bookChapters([letter('l1', '2026-09-20')], ASHA, '2026-10-20', 'en-US');
    expect(chapters[0]).toMatchObject({ key: 'm7', current: true, data: [], countLine: '', fromLine: '' });
    const o = openerOf(chapters[0]);
    expect(o).toMatchObject({ kicker: en.book.thisMonthLabel, numeral: '7', line: '', lit: true });
    expect(o.a11yLabel).toBe('This month, Month 7. October 13 to November 12');
    expect(chapters[1].current).toBe(false);
  });

  it('an empty book stays empty (the empty state shows, not a lone month)', () => {
    expect(bookChapters([], ASHA, '2026-10-20')).toEqual([]);
  });

  it('while expecting, Before You is the current chapter', () => {
    expect(currentChapterKey(EXPECTING, '2026-10-20')).toBe('before');
    const [ch] = bookChapters([letter('b1', '2026-10-01', { childId: EXPECTING.id })], EXPECTING, '2026-10-20');
    expect(ch).toMatchObject({ key: 'before', current: true, range: null, title: en.book.beforeYouChapter });
  });
});

describe('month openers (S26)', () => {
  it('a month shows the kicker and the numeral; the line joins the count and who wrote it', () => {
    const [, ch] = bookChapters([letter('l3', '2026-10-14'), letter('l2', '2026-09-22'), letter('l1', '2026-09-20')], ASHA, '2026-10-20', 'en-US');
    const o = openerOf(ch);
    expect(o).toMatchObject({ kicker: en.book.monthKicker, numeral: '6', name: null, line: '2 letters · From Mama', lit: false });
    expect(o.range).toBe('September 13 to October 12');
  });

  it('VoiceOver hears "2 letters, from Mama", never the separator', () => {
    const [, ch] = bookChapters([letter('l3', '2026-10-14'), letter('l2', '2026-09-22'), letter('l1', '2026-09-20')], ASHA, '2026-10-20', 'en-US');
    const o = openerOf(ch);
    expect(o.lineSpoken).toBe('2 letters, from Mama');
    expect(o.a11yLabel).toBe('Month 6. 2 letters, from Mama. September 13 to October 12');
    expect(o.a11yLabel).not.toContain('·');
  });

  it('the first weeks and Before You show their name in place of the numeral, with no "Month" kicker', () => {
    const chapters = bookChapters([letter('n1', '2026-03-20'), letter('b1', '2026-03-01')], ASHA, '2026-03-25', 'en-US');
    const [newborn, before] = chapters.map(openerOf);
    expect(newborn).toMatchObject({ kicker: en.book.thisMonthLabel, numeral: null, name: en.book.chapterNewborn, lit: true });
    expect(before).toMatchObject({ kicker: null, numeral: null, name: en.book.beforeYouChapter, range: null, lit: false });
    expect(chapterTitle(0)).toBe(en.book.chapterNewborn);
  });

  it('both parents in one month: "From Mama and Papa" (book.fromTwo), in the order of each one\'s first letter', () => {
    expect(en.book.fromTwo).toBe('From {a} and {b}');
    const month = [letter('l3', '2026-10-18', { authorSignsAs: 'Mama' }), letter('l2', '2026-10-16', { authorSignsAs: 'Papa' }), letter('l1', '2026-10-15', { authorSignsAs: 'Mama' })];
    expect(fromLine(month, ASHA)).toBe('From Mama and Papa');
    const papaFirst = [letter('l3', '2026-10-18', { authorSignsAs: 'Mama' }), letter('l1', '2026-10-14', { authorSignsAs: 'Papa' })];
    expect(fromLine(papaFirst, ASHA)).toBe('From Papa and Mama');
    // Same day: the earlier capture first.
    const sameDay = [letter('a', '2026-10-15', { authorSignsAs: 'Mama', capturedAt: '2026-10-15T21:00:00.000Z' }), letter('b', '2026-10-15', { authorSignsAs: 'Papa', capturedAt: '2026-10-15T08:00:00.000Z' })];
    expect(fromLine(sameDay, ASHA)).toBe('From Papa and Mama');
    const [ch] = groupChapters(month, ASHA);
    expect(openerOf(ch).lineSpoken).toBe('3 letters, from Mama and Papa');
  });

  it('the other parent\'s letter is signed with what the child calls them, and one author keeps "From Papa"', () => {
    expect(fromLine([letter('p1', '2026-10-15', { authorSignsAs: 'Papa' })], ASHA)).toBe('From Papa');
  });
});

describe("Read together's dateline (S30)", () => {
  it('reads "Month 2 · From Mama", "The first weeks · From Mama" and "Before You · From Mama", one shape for all three', () => {
    expect(readingDateline(2, 'Mama').text).toBe('Month 2 · From Mama');
    expect(readingDateline(0, 'Mama').text).toBe('The first weeks · From Mama');
    expect(readingDateline(null, 'Papa').text).toBe('Before You · From Papa');
  });

  it('is heard "Month 4, from Mama", never with the separator', () => {
    expect(readingDateline(4, 'Mama').spoken).toBe('Month 4, from Mama');
    expect(readingDateline(0, 'Mama').spoken).toBe('The first weeks, from Mama');
    for (const m of [null, 0, 1, 12]) expect(readingDateline(m, 'Mama').spoken).not.toContain('·');
    expect(spokenLine('Month 4 · From Mama')).toBe('Month 4, from Mama');
  });

  it('nowReading has its new words, filled, with no placeholder left', () => {
    expect(en.readTogether.nowReading).toBe('Month {month} · From {signsAs}');
    expect(readingDateline(7, 'Mama').text).not.toMatch(/[{}]/);
  });
});
