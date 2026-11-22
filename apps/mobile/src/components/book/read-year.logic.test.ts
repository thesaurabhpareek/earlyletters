/** Read the year back (NS-24, BL-947). Fictional family "Asha" only. */
import { describe, expect, it } from 'vitest';
import type { Entry } from '@/lib/store';
import { copy, fill } from '@/lib/copy';
import { monthDay } from './shelf.logic';
import { endOfYearLine, lettersInYear, monthsHintFor, readTheYearOn, yearKeyOf, yearLabel, yearRows } from './read-year.logic';

const L = (id: string, occurredOn: string, extra: Record<string, unknown> = {}): Entry =>
  ({ id, kind: 'letter', occurredOn, inBook: true, transcriptStatus: 'ready', ...extra }) as unknown as Entry;
const asha = { name: 'Asha', birthday: '2025-03-10' };
const today = '2026-11-22';

describe('year boundaries [NS-24-R5]', () => {
  it('runs birthday to the day before the next birthday; earlier is Before You', () => {
    expect(yearKeyOf(asha, '2025-03-09')).toBe('before');
    expect(yearKeyOf(asha, '2025-03-10')).toBe('y1');
    expect(yearKeyOf(asha, '2026-03-09')).toBe('y1');
    expect(yearKeyOf(asha, '2026-03-10')).toBe('y2');
  });
  it('clamps a 29 February birthday', () => {
    expect(yearKeyOf({ birthday: '2024-02-29' }, '2025-02-28')).toBe('y2');
  });
});

describe('years offered [NS-24-R4] [NS-24-R6]', () => {
  it('offers only years that have letters, newest first', () => {
    const rows = yearRows([L('a', '2025-04-01'), L('b', '2026-05-01'), L('c', '2025-01-01')], asha, today);
    expect(rows.map((r) => r.key)).toEqual(['y2', 'y1', 'before']);
    expect(yearRows([], asha, today)).toEqual([]);
  });
  it('offers Before You only for a due-date-only book', () => {
    const rows = yearRows([L('a', '2026-12-01'), L('b', '2026-01-01')], { name: 'Asha', birthday: null }, today);
    expect(rows.map((r) => r.key)).toEqual(['before']);
    expect(rows[0].line).toBeNull();
  });
  it('gives Before You no date range even when there is a birthday', () => {
    expect(yearRows([L('a', '2025-01-01')], asha, today)[0].line).toBeNull();
  });
  it('shows a closed year range and a year in progress ending today', () => {
    const rows = yearRows([L('a', '2025-04-01'), L('b', '2026-05-01')], asha, today);
    expect(rows[1].line).toBe(fill(copy.book.monthRange, { a: monthDay('2025-03-10'), b: monthDay('2026-03-09') }));
    expect(rows[0].line).toBe(fill(copy.book.monthRange, { a: monthDay('2025-03-10'), b: monthDay(today) }));
  });
});

describe('year by about-day [NS-24-R7]', () => {
  it('uses occurredOn, not capturedAt', () => {
    const e = L('a', '2025-04-01', { capturedAt: '2026-08-01T10:00:00.000Z' });
    expect(yearRows([e], asha, today).map((r) => r.key)).toEqual(['y1']);
  });
});

describe('only their words, skips private and waiting [NS-24-R3]', () => {
  it('leaves out private, waiting and quiet-day marks, oldest first', () => {
    const entries = [L('b', '2025-06-01'), L('a', '2025-04-01'), L('p', '2025-05-01', { inBook: false }), L('w', '2025-05-02', { transcriptStatus: 'waiting' }), L('q', '2025-05-03', { kind: 'not_much' })];
    // The order the screen relies on: input order kept (newest first), which its .reverse() turns oldest first.
    expect(lettersInYear(entries, asha, 'y1').map((e) => e.id)).toEqual(['b', 'a']);
    expect(yearRows([L('p', '2025-05-01', { inBook: false })], asha, today)).toEqual([]);
  });
});

describe('year names, existing keys only (E-17)', () => {
  it('keys years 1 to 5, then year n, and Year n with no name', () => {
    expect(yearLabel('y1', 'Asha')).toBe(fill(copy.book.years.y1, { child: 'Asha' }));
    expect(yearLabel('y5', 'Asha')).toBe(fill(copy.book.years.y5, { child: 'Asha' }));
    expect(yearLabel('y6', 'Asha')).toBe(fill(copy.book.years.yN, { child: 'Asha', n: 6 }));
    expect(yearLabel('y2', '')).toBe(fill(copy.book.years.noName, { n: 2 }));
    expect(yearLabel('before', 'Asha')).toBe(copy.book.beforeYouChapter);
  });
  it('ends a year on its own line', () => {
    expect(endOfYearLine('y1', 'Asha')).toBe(fill(copy.readTogether.endOfYear, { label: fill(copy.book.years.y1, { child: 'Asha' }) }));
    expect(endOfYearLine('before', 'Asha')).toBe(copy.readTogether.endOfBefore);
  });
});

describe('flag and hint', () => {
  it('is off unless set to 1', () => {
    expect(readTheYearOn(undefined)).toBe(false);
    expect(readTheYearOn('0')).toBe(false);
    expect(readTheYearOn('1')).toBe(true);
  });
  it('uses the years hint only when year rows exist', () => {
    expect(monthsHintFor(false, 'plain')).toBe('plain');
    expect(monthsHintFor(true, 'plain')).toBe(copy.book.monthsHintWithYears);
  });
});
