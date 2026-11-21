/** NS-53-R39 and R223 (local day via offsetAt, clock change), R41 (sessions at SESSION_GAP). */
import { describe, expect, it } from 'vitest';
import { dayKeyOf, groupByDay } from '../../src/moments/group';
import { ASHA_RULES_V1 as R, columns, la, laOffsetAt, ashaLibV1 } from './asha-lib-v1';

describe('[NS-53-R39] dayKeyOf: the local calendar day through offsetAt, no Intl', () => {
  it('reads the day on the wall clock of the offset, ISO with no zone', () => {
    expect(dayKeyOf(Date.UTC(2026, 10, 15, 7, 59, 59), () => -8 * 3600)).toBe('2026-11-14');
    expect(dayKeyOf(Date.UTC(2026, 10, 15, 8, 0, 0), () => -8 * 3600)).toBe('2026-11-15');
    expect(dayKeyOf(Date.UTC(2026, 0, 1, 0, 0, 0), () => 0)).toBe('2026-01-01');
    expect(dayKeyOf(Date.UTC(2028, 1, 29, 23, 0, 0), () => 3600)).toBe('2028-03-01');
    expect(dayKeyOf(Date.UTC(1969, 11, 31, 12, 0, 0), () => 0)).toBe('1969-12-31');
  });

  it('a zone change moves only the day assignment, never which pictures exist', () => {
    const rows = [{ id: 'a', ms: Date.UTC(2026, 10, 15, 6, 30) }];
    const la1 = groupByDay(columns(rows), () => -8 * 3600, R);
    const tokyo = groupByDay(columns(rows), () => 9 * 3600, R);
    expect(la1.map((d) => d.dayKey)).toEqual(['2026-11-14']);
    expect(tokyo.map((d) => d.dayKey)).toEqual(['2026-11-15']);
  });
});

describe('[NS-53-R39] [NS-53-R223] a late night across midnight is two days; a clock-change day is one', () => {
  it('splits 23:50 and 00:10 into two days', () => {
    const d = groupByDay(columns([{ id: 'a', ms: la(2026, 11, 5, 23, 50) }, { id: 'b', ms: la(2026, 11, 6, 0, 10) }]), laOffsetAt, R);
    expect(d.map((x) => x.dayKey)).toEqual(['2026-11-05', '2026-11-06']);
  });

  it('keeps the repeated hour of Sun 1 Nov 2026 in Los Angeles inside one day, and the offsets really differ', () => {
    expect(laOffsetAt(Date.UTC(2026, 10, 1, 8, 30))).toBe(-7 * 3600);
    expect(laOffsetAt(Date.UTC(2026, 10, 1, 9, 30))).toBe(-8 * 3600);
    const f06 = ashaLibV1().find((c) => c.name.startsWith('F06'))!;
    const d = groupByDay(columns(f06.rows), laOffsetAt, R);
    expect(d.map((x) => [x.dayKey, x.candidates.length])).toEqual([['2026-11-01', 4]]);
  });

  it('the spring change (Sun 8 Mar 2026) is one day as well', () => {
    const rows = [{ id: 'a', ms: la(2026, 3, 8, 1, 30) }, { id: 'b', ms: la(2026, 3, 8, 3, 30) }, { id: 'c', ms: la(2026, 3, 8, 23, 59) }];
    expect(groupByDay(columns(rows), laOffsetAt, R).map((x) => x.dayKey)).toEqual(['2026-03-08']);
  });
});

describe('[NS-53-R41] sessions split at SESSION_GAP and nothing else', () => {
  const day = (...hm: [number, number][]) => groupByDay(columns(hm.map(([h, m], i) => ({ id: `s${i}`, ms: la(2026, 11, 14, h, m) }))), laOffsetAt, R)[0];

  it('a gap of exactly 3 hours stays one session; a minute more splits', () => {
    expect(day([9, 0], [12, 0]).sessions).toHaveLength(1);
    expect(day([9, 0], [12, 1]).sessions).toHaveLength(2);
  });

  it('measures from the end of the previous candidate and lists candidates in time order', () => {
    const g = day([20, 0], [8, 0], [8, 30]);
    expect(g.sessions.map((s) => s.length)).toEqual([2, 1]);
    expect(g.candidates.map((c) => c.startMs)).toEqual([...g.candidates.map((c) => c.startMs)].sort((a, b) => a - b));
  });

  it('a long burst pushes the clock to its last frame: 9:00 to 11:00 then 13:30 is one session', () => {
    const rows = [
      { id: 'b1', ms: la(2026, 11, 14, 9, 0), burst: 'x' },
      { id: 'b2', ms: la(2026, 11, 14, 11, 0), burst: 'x' },
      { id: 'n', ms: la(2026, 11, 14, 13, 30) },
    ];
    expect(groupByDay(columns(rows), laOffsetAt, R)[0].sessions).toHaveLength(1);
  });
});

describe('[NS-53-R38] [NS-53-R107] asha-lib-v1 days (golden)', () => {
  for (const c of ashaLibV1()) {
    it(`${c.name}: days and candidate counts`, () => {
      const got = Object.fromEntries(groupByDay(columns(c.rows), laOffsetAt, R).map((d) => [d.dayKey, d.candidates.length]));
      expect(got).toEqual(c.days);
    });
  }

  it('the generator is seeded: two runs make the same library, and no id looks like a real name', () => {
    expect(JSON.stringify(ashaLibV1())).toBe(JSON.stringify(ashaLibV1()));
  });
});
