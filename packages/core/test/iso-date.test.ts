/**
 * One date validator for age.ts and child.ts: anchored, range-checked, and an error that never
 * carries the date (a birthday is personal; error text reaches logs and crash reports).
 */
import { describe, expect, it } from 'vitest';
import { InvalidIsoDateError, addDaysISO, ageOn, chapterOf, dateline, daysBetweenISO, isIsoDate, parseIsoDate } from '../src';

const ASHA = '2025-04-12';
const BAD = ['2025-13-45', '2025-00-10', '2025-02-30', '2026-02-29', '2025-04-31', '2025-04-00', '2025-04-12 junk', 'x2025-04-12', '2025-4-12', '', '2025-04-12T', '2025-04-12Tjunk'];

describe('parseIsoDate', () => {
  it('reads a real day, including leap days', () => {
    expect(parseIsoDate('2026-04-12')).toEqual({ y: 2026, m: 4, d: 12 });
    expect(parseIsoDate('2028-02-29')).toEqual({ y: 2028, m: 2, d: 29 });
    expect(parseIsoDate('2000-02-29').d).toBe(29);
  });

  it('rejects out of range, rolled-over and trailing-text dates', () => {
    for (const bad of BAD) expect(() => parseIsoDate(bad), bad).toThrow(InvalidIsoDateError);
    expect(() => parseIsoDate('1900-02-29')).toThrow();
  });

  it('reads a timestamp as its day only when asked', () => {
    expect(parseIsoDate('2026-04-12T23:59:59.999Z', true)).toEqual({ y: 2026, m: 4, d: 12 });
    expect(() => parseIsoDate('2026-04-12T23:59:59.999Z')).toThrow();
    expect(() => parseIsoDate('2026-13-12T00:00:00Z', true)).toThrow();
  });

  it('never puts the value in the error', () => {
    for (const bad of ['2025-13-45', '2019-02-30 Asha']) {
      try {
        parseIsoDate(bad);
        expect.unreachable();
      } catch (e) {
        const err = e as Error;
        expect(err).toBeInstanceOf(InvalidIsoDateError);
        expect(err.message).toBe('invalid_iso_date');
        expect(JSON.stringify(err, Object.getOwnPropertyNames(err))).not.toMatch(/2025|2019|Asha/);
      }
    }
  });
});

describe('age.ts and child.ts agree on what a date is', () => {
  it('ageOn throws for the same dates child.ts rejects', () => {
    for (const bad of BAD) {
      expect(() => ageOn(bad, '2026-04-12'), bad).toThrow(InvalidIsoDateError);
      expect(() => ageOn(ASHA, bad), bad).toThrow(InvalidIsoDateError);
      expect(() => chapterOf(bad, '2026-04-12'), bad).toThrow();
      expect(() => dateline(bad, 'Asha', ASHA), bad).toThrow();
      expect(() => daysBetweenISO(bad, ASHA), bad).toThrow();
      expect(() => addDaysISO(bad, 1), bad).toThrow();
      expect(isIsoDate(bad), bad).toBe(false);
    }
  });

  it('a real day is accepted by both, and a timestamp still reads as its day in age math', () => {
    expect(isIsoDate('2026-04-12')).toBe(true);
    expect(ageOn(ASHA, '2026-04-12').months).toBe(12);
    expect(ageOn(ASHA, '2026-04-12T08:30:00Z')).toEqual(ageOn(ASHA, '2026-04-12'));
  });
});
