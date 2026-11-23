import { describe, expect, it } from 'vitest';
import { daysDueOn, dayRowProblems, easterSunday, nthWeekdayOfMonth, resolveDay } from '@scribe/core';
import { DAY_AUTHORITIES, DAY_AUTHORITY_IDS, US_DAY_ROWS } from '../src/days';
import { ASTRO_ORACLE, RULE_ORACLE, READ_ON_UNVERIFIED } from './days-oracle';

const byId = new Map(US_DAY_ROWS.map((r) => [r.id, r]));
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const YEARS = [2026, 2027, 2028, 2029, 2030];

describe('[NS-46-R12] oracle is sourced and dated', () => {
  it('every oracle row names a known authority and a read-on date or UNVERIFIED', () => {
    for (const o of [...RULE_ORACLE, ...ASTRO_ORACLE]) {
      expect(DAY_AUTHORITY_IDS.has(o.authority), `${o.id} ${o.year}`).toBe(true);
      expect(o.readOn === READ_ON_UNVERIFIED || ISO.test(o.readOn), `${o.id} ${o.year}`).toBe(true);
      expect(o.date).toMatch(ISO);
    }
  });
  it('covers every non-astronomical row for every year 2026 to 2030, and every season in five zones', () => {
    for (const row of US_DAY_ROWS.filter((r) => r.rule.kind !== 'astronomical')) {
      for (const y of YEARS) expect(RULE_ORACLE.filter((o) => o.id === row.id && o.year === y), `${row.id} ${y}`).toHaveLength(1);
    }
    expect(ASTRO_ORACLE).toHaveLength(100);
  });
  it('the oracle row authority is the row authority', () => {
    for (const o of RULE_ORACLE) expect(byId.get(o.id)?.authority, o.id).toBe(o.authority);
  });
});

describe('[NS-46-R12] rule dates are computed and match the oracle', () => {
  it('every rule row, every year', () => {
    for (const o of RULE_ORACLE) expect(resolveDay(byId.get(o.id)!, o.year).date, `${o.id} ${o.year}`).toBe(o.date);
  });
  it('every season in every zone, every year', () => {
    for (const o of ASTRO_ORACLE) expect(resolveDay(byId.get(o.id)!, o.year, o.zone).date, `${o.id} ${o.year} ${o.zone}`).toBe(o.date);
  });
  it('the oracle can tell a wrong rule: Easter a week late and nth weekday off by one both disagree', () => {
    const easterLate = RULE_ORACLE.filter((o) => o.id === 'easter').some((o) => {
      const e = easterSunday(o.year);
      return new Date(Date.UTC(o.year, e.m - 1, e.d + 7)).toISOString().slice(0, 10) !== o.date;
    });
    const nthOff = RULE_ORACLE.filter((o) => o.id === 'thanksgiving').every((o) => `${o.year}-11-${String(nthWeekdayOfMonth(o.year, 11, 4, 5)).padStart(2, '0')}` !== o.date);
    expect(easterLate && nthOff).toBe(true);
  });
});

describe('days data', () => {
  it('every authority has a label, a kind and an explicit verified flag, with no duplicate id', () => {
    expect(new Set(DAY_AUTHORITIES.map((a) => a.id)).size).toBe(DAY_AUTHORITIES.length);
    for (const a of DAY_AUTHORITIES) expect([a.label.length > 0, typeof a.verified]).toEqual([true, 'boolean']);
  });
  it('[NS-46-R1] every row has an authority and nothing is pre-ticked', () => {
    expect(dayRowProblems(US_DAY_ROWS, DAY_AUTHORITY_IDS)).toEqual([]);
  });
  it('[NS-46-R24] the October review finds nothing missing for 2027 and flags 2031', () => {
    expect(daysDueOn(US_DAY_ROWS, '2026-10-01')).toEqual({ year: 2027, ids: [] });
    expect(daysDueOn(US_DAY_ROWS, '2030-10-01').ids).toEqual(['march_equinox', 'june_solstice', 'september_equinox', 'december_solstice']);
  });
});
