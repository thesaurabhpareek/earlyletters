import { describe, expect, it } from 'vitest';
import { ageOn, dateOfAge, daysDueOn, dayRowProblems, easterSunday, instantToLocalDate, nthWeekdayOfMonth, resolveDay, type DayRow } from '../src';

// Synthetic ids only (NS-46-R8): never a real tradition beside the fictional family.
const base = { layer: 'civic', tone: 'bright', precision: 'exact', publicTitleOk: false, preTicked: false, authority: 'zz-test-authority' } as const;
const row = (id: string, rule: DayRow['rule'], over: Partial<DayRow> = {}): DayRow => ({ ...base, id, nameKey: `day.${id}`, rule, ...over });
const AUTH = new Set(['zz-test-authority']);

describe('rules compute dates', () => {
  it('[NS-46-R12] fixed, nth weekday, last weekday', () => {
    expect(resolveDay(row('zz-test-day-a', { kind: 'fixed', month: 7, day: 4 }), 2027).date).toBe('2027-07-04');
    expect(resolveDay(row('zz-test-day-a', { kind: 'nthWeekday', month: 11, weekday: 4, n: 4 }), 2026).date).toBe('2026-11-26');
    expect(resolveDay(row('zz-test-day-a', { kind: 'nthWeekday', month: 5, weekday: 1, n: 'last' }), 2027).date).toBe('2027-05-31');
    expect(nthWeekdayOfMonth(2026, 2, 1, 3)).toBe(16);
  });
  it('[NS-46-R12] computus, with an offset across a month edge', () => {
    expect(easterSunday(2027)).toEqual({ m: 3, d: 28 });
    expect(easterSunday(2028)).toEqual({ m: 4, d: 16 });
    expect(resolveDay(row('zz-test-day-b', { kind: 'easter', offsetDays: -46 }), 2029).date).toBe('2029-02-14');
  });
  it('[NS-46-R12] an astronomical instant reads in the phone zone', () => {
    expect(instantToLocalDate('2027-09-23T06:02:00Z', 'America/New_York')).toBe('2027-09-23');
    expect(instantToLocalDate('2027-09-23T06:02:00Z', 'America/Los_Angeles')).toBe('2027-09-22');
    const r = row('zz-test-day-a', { kind: 'astronomical', instants: { 2027: '2027-09-23T06:02:00Z' } });
    expect(resolveDay(r, 2027, 'America/Los_Angeles').date).toBe('2027-09-22');
    expect(resolveDay(r, 2028).date).toBeNull();
  });
  it('a bad instant or zone throws a fixed code', () => {
    expect(() => instantToLocalDate('not a time', 'UTC')).toThrow('invalid_instant');
    expect(() => instantToLocalDate('2027-01-01T00:00:00Z', 'Nowhere/Land')).toThrow(RangeError);
  });
});

describe('tables and authority (DL-4, NS-46-R1)', () => {
  it('n/r and a date without authority resolve to no date, never a guess', () => {
    const t = row('zz-test-day-a', { kind: 'table', rows: [{ year: 2026, date: 'n/r' }, { year: 2027, date: '2027-03-01' }, { year: 2028, date: '2028-03-01', authority: 'zz-test-authority' }] });
    expect(resolveDay(t, 2026).date).toBeNull();
    expect(resolveDay(t, 2027).date).toBeNull();
    expect(resolveDay(t, 2028).date).toBe('2028-03-01');
  });
  it('[NS-46-R1] a row with no authority fails the build check', () => {
    expect(dayRowProblems([row('zz-test-day-a', { kind: 'fixed', month: 1, day: 1 })], AUTH)).toEqual([]);
    expect(dayRowProblems([row('zz-test-day-a', { kind: 'fixed', month: 1, day: 1 }, { authority: '' })], AUTH)).toEqual(['zz-test-day-a: no authority']);
    const bad = row('zz-test-day-b', { kind: 'table', rows: [{ year: 2026, date: '2026-03-01' }, { year: 2027, date: '2027-02-30', authority: 'zz-test-authority' }] });
    expect(dayRowProblems([bad], AUTH)).toEqual(['zz-test-day-b 2026: date without authority', 'zz-test-day-b 2027: bad date']);
    expect(dayRowProblems([row('zz-test-day-a', { kind: 'fixed', month: 1, day: 1 }, { preTicked: true as unknown as false })], AUTH)).toContain('zz-test-day-a: preTicked');
  });
});

describe('[NS-46-R24] daysDueOn with an injected today', () => {
  const t = row('zz-test-day-a', { kind: 'table', rows: [{ year: 2026, date: '2026-03-01', authority: 'zz-test-authority' }, { year: 2027, date: 'n/r' }] });
  const fixed = row('zz-test-day-b', { kind: 'fixed', month: 1, day: 1 });
  it('red: October reads next year and finds the gap', () => {
    expect(daysDueOn([t, fixed], '2026-10-01')).toEqual({ year: 2027, ids: ['zz-test-day-a'] });
  });
  it('green: before October it reads this year, which is covered; a fixed rule is never due', () => {
    expect(daysDueOn([t, fixed], '2026-09-30')).toEqual({ year: 2026, ids: [] });
  });
});

describe('one age function (ADR E)', () => {
  it('dateOfAge clamps short months and agrees with ageOn', () => {
    expect(dateOfAge('2026-01-31', 1)).toBe('2026-02-28');
    expect(dateOfAge('2027-01-31', 13)).toBe('2028-02-29');
    expect(dateOfAge('2026-05-10', 0)).toBe('2026-05-10');
    for (const [b, mo] of [['2026-01-31', 1], ['2026-03-15', 22], ['2028-02-29', 12]] as const) {
      expect(ageOn(b, dateOfAge(b, mo)).months).toBe(mo);
    }
  });
});
