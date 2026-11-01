/// <reference types="node" />
/**
 * Change the date and month-only letters (F09-REQ-003, F09-REQ-004 logic half; F04-REQ-015 rules; RT-BK-05, SR-C-10):
 * the date sheet's choices, what each choice stores, the month-only dateline, and the Book filing a moved letter in its
 * new chapter. The store half (one write, the outbox, the ledger) is in store.letter-date.test.ts. Fictional family
 * "Asha" only: Mama and Papa.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/child/child-store', () => ({ authorOf: (e: { authorSignsAs?: string }, c: { signsAs: string }) => e.authorSignsAs ?? c.signsAs }));

import { en } from '@scribe/content';
import { groupChapters } from '../src/components/book/chapters';
import {
  dayBounds,
  entryDateline,
  entryDatelineA11y,
  hasMonthTab,
  initialPick,
  isUnchanged,
  monthChoiceDay,
  monthChoices,
  monthOnlyDateline,
  movedToast,
  resolvePick,
  yearsBefore,
} from '../src/components/book/date-change.logic';
import type { Child, Entry } from '../src/lib/store';

// Born 13 March 2026; on 3 October 2026 Asha is in Month 6.
const ASHA: Child = { id: 'child-asha', name: 'Asha', birthday: '2026-03-13', dueDate: null, signsAs: 'Mama', remindersOn: true, familyCanRead: false };
const EXPECTING: Child = { ...ASHA, id: 'child-expecting', birthday: null, dueDate: '2026-12-01' };
const TODAY = '2026-10-03';
const base = { captureMode: 'typed', editLevel: 'verbatim', promptKey: null, engineVersion: 3, machineEdits: [], soundsLikeMe: null, childId: ASHA.id } as const;
const letter = (id: string, occurredOn: string, extra: Partial<Entry> = {}): Entry =>
  ({ ...base, id, kind: 'letter', occurredOn, capturedAt: `${occurredOn}T19:00:00.000Z`, rawTranscript: 'You laughed.', finalText: 'You laughed.', inBook: true, occurredPrecision: 'day', ...extra }) as Entry;
const newestFirst = (es: Entry[]) => [...es].sort((a, b) => (a.occurredOn === b.occurredOn ? b.capturedAt.localeCompare(a.capturedAt) : b.occurredOn.localeCompare(a.occurredOn)));

describe('[F04-REQ-015] the month tab', () => {
  it('lists Before You, The first weeks and Month 1 to this month, oldest first', () => {
    const rows = monthChoices(ASHA, TODAY);
    expect(rows.map((r) => r.label)).toEqual(['Before You', 'The first weeks', 'Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6']);
    expect(rows.map((r) => r.key)).toEqual(['before', 'm0', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6']);
  });

  it('a month stores the first day of that month of age; Before You the day before the birthday', () => {
    const day = Object.fromEntries(monthChoices(ASHA, TODAY).map((r) => [r.key, r.occurredOn]));
    expect(day).toMatchObject({ before: '2026-03-12', m0: '2026-03-13', m2: '2026-05-13', m6: '2026-09-13' });
    expect(monthChoices(ASHA, TODAY).every((r) => r.occurredOn <= TODAY)).toBe(true);
  });

  it('months that start on the 31st clamp to short months (born 31 January)', () => {
    expect(monthChoiceDay('2026-01-31', 1)).toBe('2026-02-28');
    expect(monthChoiceDay('2024-01-31', 1)).toBe('2024-02-29');
    expect(monthChoiceDay('2026-01-31', null)).toBe('2026-01-30');
  });

  it('is hidden for a child not born yet', () => {
    expect(hasMonthTab(EXPECTING)).toBe(false);
    expect(monthChoices(EXPECTING, TODAY)).toEqual([]);
    expect(resolvePick(EXPECTING, { precision: 'month', key: 'm0' }, TODAY)).toBeNull();
  });
});

describe('[F04-REQ-015] the day tab', () => {
  it('runs from 3 years before the birthday to today, never a future day (F04-U36)', () => {
    expect(dayBounds(ASHA, TODAY)).toEqual({ min: '2023-03-13', max: TODAY });
    expect(resolvePick(ASHA, { precision: 'day', occurredOn: '2026-10-04' }, TODAY)).toBeNull();
    expect(resolvePick(ASHA, { precision: 'day', occurredOn: '2023-03-12' }, TODAY)).toBeNull();
    expect(resolvePick(ASHA, { precision: 'day', occurredOn: '2023-03-13' }, TODAY)).toEqual({ occurredOn: '2023-03-13', precision: 'day' });
    expect(resolvePick(ASHA, { precision: 'day', occurredOn: 'yesterday' }, TODAY)).toBeNull();
  });

  it('while expecting, runs from 3 years before the due date', () => {
    expect(dayBounds(EXPECTING, TODAY)).toEqual({ min: '2023-12-01', max: TODAY });
  });

  it('a leap day steps back to 28 February', () => {
    expect(yearsBefore('2028-02-29', 3)).toBe('2025-02-28');
  });
});

describe('the sheet opens on the letter\'s own date, and Save waits for a change', () => {
  it('a day letter opens on its day; a month letter on its month', () => {
    expect(initialPick(ASHA, letter('a', '2026-08-20'))).toEqual({ precision: 'day', occurredOn: '2026-08-20' });
    expect(initialPick(ASHA, letter('b', '2026-06-13', { occurredPrecision: 'month' }))).toEqual({ precision: 'month', key: 'm3' });
  });

  it('the same date and precision is no change; the same day as a month is a change', () => {
    const e = letter('a', '2026-08-13');
    expect(isUnchanged(e, { occurredOn: '2026-08-13', precision: 'day' })).toBe(true);
    expect(isUnchanged(e, resolvePick(ASHA, { precision: 'month', key: 'm5' }, TODAY))).toBe(false);
    expect(isUnchanged(e, null)).toBe(true);
  });
});

describe('[F09-REQ-003] month-only dateline', () => {
  it('reads "Sometime in Month {month}", with no weekday and no day', () => {
    expect(en.book.dateline.monthOnly).toBe('Sometime in Month {month}');
    const e = letter('a', '2026-06-13', { occurredPrecision: 'month' });
    expect(entryDateline(ASHA, e)).toBe('Sometime in Month 3');
    expect(entryDatelineA11y(ASHA, e)).toBe('Sometime in Month 3');
    expect(entryDateline(ASHA, e)).not.toMatch(/day|13|2026/);
  });

  it('names the first weeks and Before You by their chapter names', () => {
    expect(monthOnlyDateline(ASHA, '2026-03-13')).toBe('Sometime in the first weeks');
    expect(monthOnlyDateline(ASHA, '2026-03-12')).toBe('Before You');
    expect(monthOnlyDateline(EXPECTING, '2026-09-01')).toBe('Before You');
  });

  it('a day letter keeps its full day', () => {
    expect(entryDateline(ASHA, letter('a', '2026-09-29'))).toMatch(/Tuesday/);
  });

  it('a month letter is the last card of its chapter (the oldest)', () => {
    const entries = newestFirst([
      letter('a', '2026-06-20'),
      letter('b', '2026-07-01'),
      letter('m', '2026-06-13', { occurredPrecision: 'month', capturedAt: '2026-10-01T19:00:00.000Z' }),
    ]);
    const m3 = groupChapters(entries, ASHA).find((c) => c.month === 3)!;
    expect(m3.data.map((e) => e.id)).toEqual(['b', 'a', 'm']);
  });
});

describe('[F09-REQ-004] a moved letter files into its new chapter', () => {
  it('Month 5 to Month 2: the letter leaves chapter 5 and is the only letter in chapter 2; the Book reorders', () => {
    const before = [letter('x', '2026-08-20'), letter('y', '2026-09-20')];
    expect(groupChapters(newestFirst(before), ASHA).map((c) => c.key)).toEqual(['m6', 'm5']);
    const to = resolvePick(ASHA, { precision: 'month', key: 'm2' }, TODAY)!;
    expect(to).toEqual({ occurredOn: '2026-05-13', precision: 'month' });
    const after = newestFirst([{ ...before[0], ...{ occurredOn: to.occurredOn, occurredPrecision: to.precision } }, before[1]]);
    const chapters = groupChapters(after, ASHA);
    expect(chapters.map((c) => c.key)).toEqual(['m6', 'm2']);
    expect(chapters[1].data.map((e) => e.id)).toEqual(['x']);
    expect(chapters[1].data[0].finalText).toBe('You laughed.');
    expect(movedToast(ASHA, to.occurredOn)).toBe('Moved to Month 2.');
  });

  it('a day before the birthday files into Before You', () => {
    const to = resolvePick(ASHA, { precision: 'day', occurredOn: '2026-02-01' }, TODAY)!;
    expect(groupChapters([letter('x', to.occurredOn)], ASHA).map((c) => c.key)).toEqual(['before']);
    expect(movedToast(ASHA, to.occurredOn)).toBe('Moved to Before You.');
  });
});

describe('VoiceOver hears "When was this?" once (Review B on #513)', () => {
  it('the title carries it; the tabs and the picker have their own labels', () => {
    const src = readFileSync(join(__dirname, '../src/components/book/date-sheet.tsx'), 'utf8');
    expect(src.match(/\bd\.label\b/g)).toEqual(['d.label']); // the Sheet title only
    expect(src).toContain('label={d.tabsLabel}');
    expect(src).toContain('<DateField label={d.dayLabel}');
    expect([en.review.date.tabsLabel, en.review.date.dayLabel]).toEqual(['Day or month', 'Day']);
    expect(en.review.date.tabsLabel).not.toBe(en.review.date.label);
  });
});
