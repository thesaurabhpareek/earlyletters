/**
 * Age math on the awkward days (packages/core/src/age.ts; B-NFR-007, C-REQ-011):
 * month ends, leap days, year ends, the day of birth, the day before it, and
 * the labels parents read. Dates are calendar days with no time zone, so every
 * expectation here is worked out by hand from the calendar, not from Date.
 * Fictional family "Asha" (born 2025-04-12) only.
 */
import { describe, expect, it } from 'vitest';
import { ageLabel, ageOn, chapterOf, dateline, isBeforeBirth } from '../src';

const ASHA = '2025-04-12';

describe('ageOn: month anniversaries on short months', () => {
  it.each([
    // born Jan 31: the February anniversary is clamped to the 28th (C-REQ-011)
    ['2027-01-31', '2027-02-27', { months: 0, weeks: 3, days: 27 }],
    ['2027-01-31', '2027-02-28', { months: 1, weeks: 0, days: 28 }],
    ['2027-01-31', '2027-03-01', { months: 1, weeks: 0, days: 29 }],
    ['2027-01-31', '2027-03-30', { months: 1, weeks: 4, days: 58 }],
    ['2027-01-31', '2027-03-31', { months: 2, weeks: 0, days: 59 }],
    // born Aug 31: September has 30 days
    ['2026-08-31', '2026-09-29', { months: 0, weeks: 4, days: 29 }],
    ['2026-08-31', '2026-09-30', { months: 1, weeks: 0, days: 30 }],
    ['2026-08-31', '2026-10-01', { months: 1, weeks: 0, days: 31 }],
    ['2026-08-31', '2026-10-30', { months: 1, weeks: 4, days: 60 }],
    ['2026-08-31', '2026-10-31', { months: 2, weeks: 0, days: 61 }],
  ])('born %s, on %s', (birth, on, expected) => {
    expect(ageOn(birth, on)).toEqual(expected);
  });

  it.each([
    // born on a leap day
    ['2024-02-29', '2024-03-28', { months: 0, weeks: 4, days: 28 }],
    ['2024-02-29', '2024-03-29', { months: 1, weeks: 0, days: 29 }],
    ['2024-02-29', '2025-02-28', { months: 12, weeks: 0, days: 365 }],
    ['2024-02-29', '2025-03-01', { months: 12, weeks: 0, days: 366 }],
    ['2024-02-29', '2026-02-28', { months: 24, weeks: 0, days: 730 }],
    ['2024-02-29', '2028-02-29', { months: 48, weeks: 0, days: 1461 }],
  ])('leap-day birthday %s, on %s', (birth, on, expected) => {
    expect(ageOn(birth, on)).toEqual(expected);
  });

  it('crosses a year end the way a calendar does', () => {
    expect(ageOn('2025-12-15', '2026-01-14')).toEqual({ months: 0, weeks: 4, days: 30 });
    expect(ageOn('2025-12-15', '2026-01-15')).toEqual({ months: 1, weeks: 0, days: 31 });
    expect(ageOn('2025-12-31', '2026-01-31')).toEqual({ months: 1, weeks: 0, days: 31 });
    expect(ageOn('2025-12-31', '2026-02-28')).toEqual({ months: 2, weeks: 0, days: 59 });
  });

  it('the first birthday is 12 months on the day and 11 months and 4 weeks the day before', () => {
    expect(ageOn(ASHA, '2026-04-12')).toEqual({ months: 12, weeks: 0, days: 365 });
    expect(ageOn(ASHA, '2026-04-11')).toEqual({ months: 11, weeks: 4, days: 364 });
  });

  it('the day of birth is day 0; the day before is before birth, with the deficit in days', () => {
    expect(ageOn(ASHA, ASHA)).toEqual({ months: 0, weeks: 0, days: 0 });
    expect(ageOn(ASHA, '2025-04-11')).toEqual({ months: 0, weeks: 0, days: -1 });
    expect(ageOn(ASHA, '2024-04-12')).toEqual({ months: 0, weeks: 0, days: -365 });
  });

  it('ignores a time suffix: a letter dated 23:59 is the same day', () => {
    expect(ageOn(ASHA, '2026-04-12T23:59:59.999Z')).toEqual(ageOn(ASHA, '2026-04-12'));
    expect(ageOn(`${ASHA}T00:00:00Z`, '2026-04-12')).toEqual(ageOn(ASHA, '2026-04-12'));
  });

  it('refuses dates that are not YYYY-MM-DD', () => {
    for (const bad of ['12/04/2025', '2025-4-12', '', 'yesterday', '20250412']) {
      expect(() => ageOn(bad, '2026-04-12'), bad).toThrow(/Invalid ISO date/);
      expect(() => ageOn(ASHA, bad), bad).toThrow(/Invalid ISO date/);
    }
  });

  it('over two years from birth: days rise by one, months never fall, weeks stay 0 to 4, and a month turns only on the 12th', () => {
    let prev = ageOn(ASHA, ASHA);
    for (let d = 1; d <= 730; d++) {
      const on = new Date(Date.UTC(2025, 3, 12 + d)).toISOString().slice(0, 10);
      const age = ageOn(ASHA, on);
      expect(age.days, on).toBe(prev.days + 1);
      expect(age.months, on).toBeGreaterThanOrEqual(prev.months);
      expect(age.weeks, on).toBeGreaterThanOrEqual(0);
      expect(age.weeks, on).toBeLessThanOrEqual(4);
      if (age.months !== prev.months) {
        expect(age.months, on).toBe(prev.months + 1);
        expect(on.slice(8), on).toBe('12');
        expect(age.weeks, on).toBe(0);
      }
      prev = age;
    }
    expect(prev).toEqual({ months: 24, weeks: 0, days: 730 });
  });
});

describe('ageLabel: the words parents read', () => {
  it.each([
    [{ months: 0, weeks: 0, days: 0 }, '0 days'],
    [{ months: 0, weeks: 0, days: 1 }, '1 day'],
    [{ months: 0, weeks: 1, days: 7 }, '7 days'],
    [{ months: 0, weeks: 1, days: 13 }, '13 days'],
    [{ months: 0, weeks: 2, days: 14 }, '2 weeks'],
    [{ months: 0, weeks: 4, days: 30 }, '4 weeks'],
    [{ months: 1, weeks: 0, days: 31 }, '1 month'],
    [{ months: 1, weeks: 1, days: 38 }, '1 month and 1 week'],
    [{ months: 2, weeks: 2, days: 75 }, '2 months and 2 weeks'],
    [{ months: 12, weeks: 0, days: 365 }, '12 months'],
    [{ months: 0, weeks: 0, days: -1 }, 'before birth'],
  ])('%j reads "%s"', (age, label) => {
    expect(ageLabel(age)).toBe(label);
  });

  it('matches ageOn on the days the labels change', () => {
    expect(ageLabel(ageOn(ASHA, '2025-05-19'))).toBe('1 month and 1 week');
    expect(ageLabel(ageOn(ASHA, '2025-06-26'))).toBe('2 months and 2 weeks');
    expect(ageLabel(ageOn(ASHA, '2025-04-25'))).toBe('13 days');
    expect(ageLabel(ageOn(ASHA, '2025-04-26'))).toBe('2 weeks');
  });
});

describe('dateline and chapters', () => {
  it('[B-NFR-007] names the weekday from the calendar date alone and capitalises the age sentence', () => {
    expect(dateline('2026-04-12', 'Asha', ASHA)).toBe('Sunday, 12 April 2026. Asha is 12 months old.');
    expect(dateline('2025-04-11', 'Asha', ASHA)).toBe('Friday, 11 April 2025. Before Asha was born.');
    expect(dateline('2025-04-12', 'asha', ASHA)).toBe('Saturday, 12 April 2025. Asha is 0 days old.');
  });

  it('a chapter is the month of age, never below 0, and the due-date months before birth fall in month 0', () => {
    expect(chapterOf(ASHA, '2024-10-01')).toBe(0);
    expect(chapterOf(ASHA, ASHA)).toBe(0);
    expect(chapterOf(ASHA, '2025-05-11')).toBe(0);
    expect(chapterOf(ASHA, '2025-05-12')).toBe(1);
    expect(chapterOf(ASHA, '2026-04-12')).toBe(12);
    expect(chapterOf('2027-01-31', '2027-02-28')).toBe(1);
  });
});

describe('isBeforeBirth: a book that is not born yet (P3 critics\' pass S2)', () => {
  it('no birthday (started with "Not here yet" and a due date) is before the birth, on any day', () => {
    expect(isBeforeBirth(null, '2026-10-28')).toBe(true);
    expect(isBeforeBirth(undefined, '2026-10-28')).toBe(true);
    expect(isBeforeBirth('', '2026-10-28')).toBe(true);
  });

  it('a birthday after the day is before the birth; the day of birth and every day after are not', () => {
    expect(isBeforeBirth(ASHA, '2025-04-11')).toBe(true);
    expect(isBeforeBirth(ASHA, '2024-10-01')).toBe(true);
    expect(isBeforeBirth(ASHA, ASHA)).toBe(false);
    expect(isBeforeBirth(ASHA, '2025-04-13')).toBe(false);
    expect(isBeforeBirth(ASHA, '2026-10-28')).toBe(false);
  });

  it('agrees with ageOn and dateline: "before birth" is exactly a negative number of days', () => {
    for (const on of ['2025-04-10', '2025-04-11', '2025-04-12', '2025-04-13', '2025-05-12', '2026-04-12']) {
      expect(isBeforeBirth(ASHA, on), on).toBe(ageOn(ASHA, on).days < 0);
      expect(ageLabel(ageOn(ASHA, on)) === 'before birth', on).toBe(isBeforeBirth(ASHA, on));
    }
  });
});
