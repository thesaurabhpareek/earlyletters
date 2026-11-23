/**
 * Moments occasions (NS-53, Wave A PR 4): the dates we know. Birthday, month day, typed day, ticked day, a first the
 * parent marked, and civic holidays by date. Fictional family Asha, born Sat 12 Apr 2025. Test names carry the row id.
 */
import { describe, expect, it } from 'vitest';
import { holidaysOn, HOLIDAY_KEYS } from '../../src/moments/holidays';
import { occasionsOn, reasonFor, type MarkedDay } from '../../src/moments/occasions';

const BIRTH = '2025-04-12';
const ctx = (over: Partial<Parameters<typeof occasionsOn>[1]> = {}) => ({ birth: BIRTH, marked: [], holidayRegion: null, ...over });
const reasons = (day: string, c = ctx()) => occasionsOn(day, c).map((h) => h.reason);

describe('[NS-53-R19] a typed day', () => {
  const typed: MarkedDay = { kind: 'typed', date: '2026-11-21', ref: 'note-1' };
  it('exists on its date only, carrying the local reference and no words', () => {
    expect(occasionsOn('2026-11-21', ctx({ marked: [typed] }))).toEqual([{ reason: 'RSN-MARKED', source: 'S1', ref: 'note-1' }]);
  });
  it('is gone the day after and the day before', () => {
    expect(reasons('2026-11-22', ctx({ marked: [typed] }))).toEqual([]);
    expect(reasons('2026-11-20', ctx({ marked: [typed] }))).toEqual([]);
  });
  it('never recurs next year, even when someone sets everyYear on it', () => {
    expect(reasons('2027-11-21', ctx({ marked: [{ ...typed, everyYear: true }] }))).toEqual([]);
  });
});

describe('[NS-53-R20] a ticked day and a first', () => {
  const ticked: MarkedDay = { kind: 'ticked', date: '2026-12-05', ref: 'day-a' };
  it('shows only on its date, with source S2', () => {
    expect(occasionsOn('2026-12-05', ctx({ marked: [ticked] }))).toEqual([{ reason: 'RSN-MARKED', source: 'S2', ref: 'day-a' }]);
    expect(reasons('2026-12-06', ctx({ marked: [ticked] }))).toEqual([]);
  });
  it('recurs each year only when the parent chose every year (default off)', () => {
    expect(reasons('2027-12-05', ctx({ marked: [ticked] }))).toEqual([]);
    expect(reasons('2027-12-05', ctx({ marked: [{ ...ticked, everyYear: true }] }))).toEqual(['RSN-MARKED']);
  });
  it('a first is RSN-FIRST on its date and on each anniversary only when every year', () => {
    const first: MarkedDay = { kind: 'first', date: '2025-09-01', ref: 'first-1', everyYear: true };
    expect(reasons('2025-09-01', ctx({ marked: [first] }))).toEqual(['RSN-FIRST']);
    expect(reasons('2026-09-01', ctx({ marked: [first] }))).toEqual(['RSN-FIRST']);
    expect(reasons('2026-09-01', ctx({ marked: [{ ...first, everyYear: false }] }))).toEqual([]);
  });
  it('an every-year mark does not show in a year before its own date', () => {
    expect(reasons('2026-12-05', ctx({ marked: [{ ...ticked, date: '2027-12-05', everyYear: true }] }))).toEqual([]);
  });
  it('a 29 Feb mark recurs on 28 Feb in a common year, the planner rule', () => {
    const m: MarkedDay = { kind: 'ticked', date: '2028-02-29', ref: 'x', everyYear: true };
    expect(reasons('2029-02-28', ctx({ marked: [m] }))).toEqual(['RSN-MARKED']);
    expect(reasons('2029-03-01', ctx({ marked: [m] }))).toEqual([]);
  });
});

describe('[NS-53-R18] several Today sources, strongest first', () => {
  it('orders typed day, birthday, ticked day, month day, holiday', () => {
    // 12 Apr 2026 is the first birthday; add a typed and a ticked mark on it.
    const marked: MarkedDay[] = [
      { kind: 'ticked', date: '2026-04-12', ref: 'b' },
      { kind: 'typed', date: '2026-04-12', ref: 'a' },
    ];
    expect(occasionsOn('2026-04-12', ctx({ marked })).map((h) => `${h.source}:${h.reason}`)).toEqual(['S1:RSN-MARKED', 'S3:RSN-BIRTHDAY', 'S2:RSN-MARKED']);
    // A month day and a holiday together (12 Nov 2026 is month 19; Veterans Day is 11 Nov, so use born on the 11th).
    expect(reasons('2026-11-11', ctx({ birth: '2025-04-11', holidayRegion: 'US' }))).toEqual(['RSN-MONTHDAY', 'RSN-HOLIDAY']);
  });
  it('two ticked days on one date name both, in the order given', () => {
    const marked: MarkedDay[] = [
      { kind: 'ticked', date: '2026-12-25', ref: 'one' },
      { kind: 'ticked', date: '2026-12-25', ref: 'two' },
    ];
    expect(occasionsOn('2026-12-25', ctx({ marked })).map((h) => h.ref)).toEqual(['one', 'two']);
  });
  it('is the same whatever order the marks arrive in', () => {
    const a: MarkedDay = { kind: 'ticked', date: '2026-12-25', ref: 'one' };
    const b: MarkedDay = { kind: 'ticked', date: '2026-12-25', ref: 'two' };
    expect(occasionsOn('2026-12-25', ctx({ marked: [b, a] }))).toEqual(occasionsOn('2026-12-25', ctx({ marked: [a, b] })));
  });
});

describe('[NS-53-R21] [NS-53-R34] no birth date or before the birth', () => {
  it('has no birthday or month day with no birth date', () => {
    expect(reasons('2026-04-12', ctx({ birth: null }))).toEqual([]);
  });
  it('has none before the birth, on the birth day itself, or one day after', () => {
    expect(reasons('2025-03-12', ctx())).toEqual([]);
    expect(reasons('2025-04-12', ctx())).toEqual([]);
    expect(reasons('2025-04-13', ctx())).toEqual([]);
  });
  it('still shows the parent own marks and holidays before the birth', () => {
    expect(reasons('2024-12-25', ctx({ marked: [{ kind: 'ticked', date: '2024-12-25', ref: 'x' }] }))).toEqual(['RSN-MARKED']);
    expect(reasons('2025-01-01', ctx({ holidayRegion: 'US' }))).toEqual(['RSN-HOLIDAY']);
  });
});

describe('[NS-53-R22] the birthday and the month day follow the planner date rule', () => {
  it('K-BIRTH: Asha first birthday, years counted', () => {
    expect(occasionsOn('2026-04-12', ctx())).toEqual([{ reason: 'RSN-BIRTHDAY', source: 'S3', years: 1 }]);
    expect(occasionsOn('2027-04-12', ctx())[0]).toMatchObject({ reason: 'RSN-BIRTHDAY', years: 2 });
  });
  it('K-AGE: month day on the birth day of the month, months counted, none the next day', () => {
    expect(occasionsOn('2026-11-12', ctx())).toEqual([{ reason: 'RSN-MONTHDAY', source: 'S3', months: 19 }]);
    expect(reasons('2026-11-13', ctx())).toEqual([]);
    expect(reasons('2026-11-11', ctx())).toEqual([]);
  });
  it('the 12th month is the birthday, never also a month day', () => {
    expect(reasons('2026-04-12', ctx())).toEqual(['RSN-BIRTHDAY']);
  });
  it('born on the 31st: the month day clamps to the last day of a short month', () => {
    const c = ctx({ birth: '2025-01-31' });
    expect(occasionsOn('2025-02-28', c)).toEqual([{ reason: 'RSN-MONTHDAY', source: 'S3', months: 1 }]);
    expect(reasons('2025-03-31', c)).toEqual(['RSN-MONTHDAY']);
    expect(reasons('2025-04-30', c)).toEqual(['RSN-MONTHDAY']);
    expect(reasons('2025-04-29', c)).toEqual([]);
    expect(reasons('2025-03-28', c)).toEqual([]);
    expect(occasionsOn('2028-02-29', c)[0]).toMatchObject({ reason: 'RSN-MONTHDAY', months: 37 });
    expect(reasons('2028-02-28', c)).toEqual([]);
  });
  it('born on 29 Feb: the birthday is 28 Feb in a common year and 29 Feb in a leap year', () => {
    const c = ctx({ birth: '2024-02-29' });
    expect(occasionsOn('2025-02-28', c)).toEqual([{ reason: 'RSN-BIRTHDAY', source: 'S3', years: 1 }]);
    expect(reasons('2025-03-01', c)).toEqual([]);
    expect(occasionsOn('2028-02-29', c)).toEqual([{ reason: 'RSN-BIRTHDAY', source: 'S3', years: 4 }]);
    expect(reasons('2028-02-28', c)).toEqual([]);
  });
  it('rejects a date that does not parse with a fixed code that never carries the value', () => {
    let message = '';
    try {
      occasionsOn('2026-02-30', ctx());
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toBe('invalid_iso_date');
    expect(() => occasionsOn('2026-04-12', ctx({ birth: '12/04/2025' }))).toThrow('invalid_iso_date');
  });
});

describe('[NS-53-R42] the one reason when several apply to a date', () => {
  it('follows the closed precedence: marked, first, birthday, month day, holiday', () => {
    expect(reasonFor(['RSN-HOLIDAY', 'RSN-MONTHDAY', 'RSN-BIRTHDAY', 'RSN-FIRST', 'RSN-MARKED'])).toBe('RSN-MARKED');
    expect(reasonFor(['RSN-HOLIDAY', 'RSN-MONTHDAY', 'RSN-BIRTHDAY', 'RSN-FIRST'])).toBe('RSN-FIRST');
    expect(reasonFor(['RSN-HOLIDAY', 'RSN-MONTHDAY', 'RSN-BIRTHDAY'])).toBe('RSN-BIRTHDAY');
    expect(reasonFor(['RSN-HOLIDAY', 'RSN-MONTHDAY'])).toBe('RSN-MONTHDAY');
    expect(reasonFor(['RSN-HOLIDAY'])).toBe('RSN-HOLIDAY');
    expect(reasonFor([])).toBeNull();
  });
});

describe('[NS-53-R18] public holidays by date (O-33: US civic list, PROPOSED)', () => {
  const on = (d: string) => holidaysOn(d, 'US');
  it('finds the fixed and the weekday-rule holidays for 2026', () => {
    expect(on('2026-01-01')).toEqual(['new_years_day']);
    expect(on('2026-01-19')).toEqual(['mlk_day']);
    expect(on('2026-02-16')).toEqual(['presidents_day']);
    expect(on('2026-05-25')).toEqual(['memorial_day']);
    expect(on('2026-06-19')).toEqual(['juneteenth']);
    expect(on('2026-07-04')).toEqual(['independence_day']);
    expect(on('2026-09-07')).toEqual(['labor_day']);
    expect(on('2026-11-11')).toEqual(['veterans_day']);
    expect(on('2026-11-26')).toEqual(['thanksgiving']);
  });
  it('is exact on the neighbouring days and on the other weekdays of the rule', () => {
    for (const d of ['2026-01-12', '2026-01-26', '2026-02-09', '2026-02-23', '2026-05-18', '2026-06-01', '2026-09-14', '2026-11-19', '2026-11-27', '2026-12-31']) expect(on(d)).toEqual([]);
    expect(on('2025-11-27')).toEqual(['thanksgiving']);
    expect(on('2027-05-31')).toEqual(['memorial_day']);
  });
  it('carries no religious or cultural day and no key outside the closed list', () => {
    expect(on('2026-12-25')).toEqual([]);
    expect(HOLIDAY_KEYS).toHaveLength(9);
    expect(HOLIDAY_KEYS.every((k) => /^[a-z_]+$/.test(k))).toBe(true);
  });
  it('has none for a region it has no table for, never a throw', () => {
    expect(holidaysOn('2026-07-04', 'CA' as never)).toEqual([]);
    expect(holidaysOn('2026-07-04', 'constructor' as never)).toEqual([]);
  });
  it('has none with no region, and a per-holiday switch removes that holiday only', () => {
    expect(holidaysOn('2026-07-04', null)).toEqual([]);
    expect(reasons('2026-07-04', ctx({ holidayRegion: 'US' }))).toEqual(['RSN-HOLIDAY']);
    expect(reasons('2026-07-04', ctx({ holidayRegion: 'US', holidaysOff: ['independence_day'] }))).toEqual([]);
    expect(reasons('2026-09-07', ctx({ holidayRegion: 'US', holidaysOff: ['independence_day'] }))).toEqual(['RSN-HOLIDAY']);
    expect(occasionsOn('2026-07-04', ctx({ holidayRegion: 'US' }))[0]).toEqual({ reason: 'RSN-HOLIDAY', source: 'H', holiday: 'independence_day' });
  });
});
