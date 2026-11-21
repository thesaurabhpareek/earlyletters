/**
 * The moment engine (NX-39 v2 R15, BL-859). Plain {day, cityKey} metadata in,
 * moments with reason codes out. Rules-based date-gap clustering: no machine
 * learning, no faces, no scenes, no ranking. Fixtures use the fictional family "Asha".
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  buildMoments,
  dayKeyAt,
  MOMENT_REASONS,
  RULE_VERSION,
  type MomentItem,
} from '../src/moments';

const ASHA_HOME = 'asha-city-a';
const ASHA_TRIP = 'asha-city-b';
const item = (day: string, cityKey: string | null = null): MomentItem => ({ day, cityKey });
const range = (m: { startDay: string; endDay: string }) => `${m.startDay}..${m.endDay}`;

/** Deterministic shuffle so a failure is reproducible. */
function shuffled<T>(xs: readonly T[], seed: number): T[] {
  const out = [...xs];
  let s = seed >>> 0;
  for (let i = out.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

const ASHA_TRIP_ITEMS: MomentItem[] = [
  item('2026-03-02', ASHA_HOME),
  item('2026-03-06', ASHA_TRIP),
  item('2026-03-06', ASHA_TRIP),
  item('2026-03-07', ASHA_TRIP),
  item('2026-03-09', ASHA_TRIP),
  item('2026-03-10'),
  item('2026-03-20', ASHA_HOME),
  item('2026-03-20', ASHA_HOME),
  item('2026-03-20', ASHA_HOME),
];

describe('[NX-39-R15] the same {day, cityKey} list always makes the same moments, with reason codes and no forbidden import', () => {
  it('turns the Asha fixture into the expected moments with reason codes', () => {
    const moments = buildMoments(ASHA_TRIP_ITEMS, RULE_VERSION);
    expect(moments.map(range)).toEqual(['2026-03-06..2026-03-10', '2026-03-20..2026-03-20']);
    expect(moments[0]).toEqual({
      startDay: '2026-03-06',
      endDay: '2026-03-10',
      cityKey: ASHA_TRIP,
      reasons: ['DAY_RUN', 'SAME_CITY', 'NO_PLACE_JOINED', 'MIN_ITEMS_MET'],
      ruleVersion: RULE_VERSION,
    });
    // One day with three items passes on items alone.
    expect(moments[1]).toEqual({
      startDay: '2026-03-20',
      endDay: '2026-03-20',
      cityKey: ASHA_HOME,
      reasons: ['MIN_ITEMS_MET'],
      ruleVersion: RULE_VERSION,
    });
  });

  it('reason codes come only from the closed enum, in a fixed order, and never empty', () => {
    expect([...MOMENT_REASONS]).toEqual(['DAY_RUN', 'SAME_CITY', 'NO_PLACE_JOINED', 'MIN_ITEMS_MET']);
    for (const m of buildMoments(ASHA_TRIP_ITEMS, RULE_VERSION)) {
      expect(m.reasons.length).toBeGreaterThan(0);
      for (const r of m.reasons) expect(MOMENT_REASONS).toContain(r);
      const idx = m.reasons.map((r) => MOMENT_REASONS.indexOf(r));
      expect([...idx].sort((a, b) => a - b)).toEqual(idx);
    }
  });

  it('is deterministic over 100 shuffles of the input', () => {
    const want = buildMoments(ASHA_TRIP_ITEMS, RULE_VERSION);
    for (let seed = 1; seed <= 100; seed++) {
      expect(buildMoments(shuffled(ASHA_TRIP_ITEMS, seed), RULE_VERSION)).toEqual(want);
    }
  });

  it('is idempotent: a second run is equal, the input is not touched, and the moments survive being re-run on their own days', () => {
    const frozen = Object.freeze(ASHA_TRIP_ITEMS.map((i) => Object.freeze({ ...i })));
    const first = buildMoments(frozen, RULE_VERSION);
    expect(buildMoments(frozen, RULE_VERSION)).toEqual(first);
    const covered = frozen.filter((i) => first.some((m) => i.day >= m.startDay && i.day <= m.endDay));
    expect(buildMoments(covered, RULE_VERSION)).toEqual(first);
  });

  it('is monotone: adding place-free items, or items in a city the day already has, never uncovers a day', () => {
    const base = buildMoments(ASHA_TRIP_ITEMS, RULE_VERSION);
    const coveredBy = (ms: typeof base, day: string) => ms.some((m) => day >= m.startDay && day <= m.endDay);
    const additions: MomentItem[] = [
      item('2026-03-06'),
      item('2026-03-07', ASHA_TRIP),
      item('2026-03-08'), // fills the one-day gap
      item('2026-03-02'), // a day that was not a moment
      item('2026-03-21'),
      item('2026-03-12'),
    ];
    let items = [...ASHA_TRIP_ITEMS];
    let before = base;
    for (const add of additions) {
      items = [...items, add];
      const after = buildMoments(items, RULE_VERSION);
      for (const m of before) {
        for (const day of [m.startDay, m.endDay]) expect(coveredBy(after, day)).toBe(true);
      }
      before = after;
    }
  });

  it('allows a gap of one empty day and splits at two', () => {
    expect(buildMoments([item('2026-04-01'), item('2026-04-03')], RULE_VERSION).map(range)).toEqual(['2026-04-01..2026-04-03']);
    expect(buildMoments([item('2026-04-01'), item('2026-04-04')], RULE_VERSION)).toEqual([]);
  });

  it('needs two active days or three items', () => {
    expect(buildMoments([item('2026-04-01')], RULE_VERSION)).toEqual([]);
    expect(buildMoments([item('2026-04-01'), item('2026-04-01')], RULE_VERSION)).toEqual([]);
    expect(buildMoments([item('2026-04-01'), item('2026-04-02')], RULE_VERSION)).toHaveLength(1);
    expect(buildMoments([item('2026-04-01'), item('2026-04-01'), item('2026-04-01')], RULE_VERSION)).toHaveLength(1);
  });

  it('joins neighbouring days that share a city key or where either has none, and splits different cities', () => {
    expect(buildMoments([item('2026-05-01', 'a'), item('2026-05-02', 'a')], RULE_VERSION)).toHaveLength(1);
    expect(buildMoments([item('2026-05-01', 'a'), item('2026-05-02')], RULE_VERSION)).toHaveLength(1);
    expect(buildMoments([item('2026-05-01'), item('2026-05-02', 'b')], RULE_VERSION)).toHaveLength(1);
    const split = buildMoments(
      [item('2026-05-01', 'a'), item('2026-05-01', 'a'), item('2026-05-01', 'a'),
       item('2026-05-02', 'b'), item('2026-05-02', 'b'), item('2026-05-02', 'b')],
      RULE_VERSION,
    );
    expect(split.map(range)).toEqual(['2026-05-01..2026-05-01', '2026-05-02..2026-05-02']);
  });

  it('a flight day with two cities joins the side it shares and keeps no single city key when both appear', () => {
    const flight = buildMoments(
      [item('2026-06-01', ASHA_HOME), item('2026-06-02', ASHA_HOME), item('2026-06-02', ASHA_TRIP), item('2026-06-03', ASHA_TRIP)],
      RULE_VERSION,
    );
    expect(flight).toHaveLength(1);
    expect(flight[0]!.cityKey).toBeNull();
    expect(flight[0]!.reasons).toContain('SAME_CITY');
  });

  it('empty input, null and empty-string places, and bad days', () => {
    expect(buildMoments([], RULE_VERSION)).toEqual([]);
    const nulls = buildMoments([item('2026-07-01', null), item('2026-07-02', ''), item('2026-07-03')], RULE_VERSION);
    expect(nulls).toEqual([
      { startDay: '2026-07-01', endDay: '2026-07-03', cityKey: null, reasons: ['DAY_RUN', 'NO_PLACE_JOINED', 'MIN_ITEMS_MET'], ruleVersion: RULE_VERSION },
    ]);
    const bad = buildMoments([item('2026-02-30'), item('not a day'), item('2026-07-01'), item('2026-07-02')], RULE_VERSION);
    expect(bad.map(range)).toEqual(['2026-07-01..2026-07-02']);
  });

  it('one huge day is one moment and does not blow up', () => {
    const huge = Array.from({ length: 50_000 }, () => item('2026-08-15', ASHA_HOME));
    expect(buildMoments(huge, RULE_VERSION)).toEqual([
      { startDay: '2026-08-15', endDay: '2026-08-15', cityKey: ASHA_HOME, reasons: ['MIN_ITEMS_MET'], ruleVersion: RULE_VERSION },
    ]);
  });

  it('crosses month, year and leap-day boundaries', () => {
    expect(buildMoments([item('2027-12-31'), item('2028-01-01')], RULE_VERSION).map(range)).toEqual(['2027-12-31..2028-01-01']);
    expect(buildMoments([item('2028-02-28'), item('2028-03-01')], RULE_VERSION).map(range)).toEqual(['2028-02-28..2028-03-01']);
    expect(buildMoments([item('2027-02-27'), item('2027-03-02')], RULE_VERSION)).toEqual([]);
  });

  it('refuses a rule version it does not implement', () => {
    expect(() => buildMoments([], RULE_VERSION + 1)).toThrow(/rule version/i);
  });

  it('output holds only a day range, a city key, reasons and the rule version: no counts, no ids, no times', () => {
    const [m] = buildMoments(ASHA_TRIP_ITEMS, RULE_VERSION);
    expect(Object.keys(m!).sort()).toEqual(['cityKey', 'endDay', 'reasons', 'ruleVersion', 'startDay']);
  });

  it('imports nothing and touches no clock, locale, randomness, network or storage (import-graph test)', () => {
    const src = readFileSync(new URL('../src/moments.ts', import.meta.url), 'utf8');
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(code).not.toMatch(/^\s*import\s/m);
    expect(code).not.toMatch(/\brequire\s*\(/);
    expect(code).not.toMatch(/\bimport\s*\(/);
    for (const banned of [
      /Date\.now/, /new Date\(\s*\)/, /Math\.random/, /\bIntl\b/, /toLocale/, /\bfetch\b/, /XMLHttpRequest/,
      /\bperformance\b/, /\bprocess\b/, /\bglobalThis\b/, /localStorage/, /sqlite/i, /AsyncStorage/, /react-native/,
      /\bcrypto\b/, /setTimeout|setInterval/,
    ]) {
      expect(code, String(banned)).not.toMatch(banned);
    }
  });
});

describe('[NX-39-R5] the day rule is one function, with midnight, DST and flight-day fixtures', () => {
  it('buckets an instant into the phone zone day using the offset passed in', () => {
    const t = Date.UTC(2026, 2, 6, 23, 30); // 2026-03-06 23:30 UTC
    expect(dayKeyAt(t, 0)).toBe('2026-03-06');
    expect(dayKeyAt(t, 60)).toBe('2026-03-07'); // 00:30 next day, a photo near midnight
    expect(dayKeyAt(t, -480)).toBe('2026-03-06');
  });

  it('midnight belongs to the new day, the last millisecond to the old', () => {
    expect(dayKeyAt(Date.UTC(2026, 0, 1, 0, 0, 0, 0), 0)).toBe('2026-01-01');
    expect(dayKeyAt(Date.UTC(2025, 11, 31, 23, 59, 59, 999), 0)).toBe('2025-12-31');
  });

  it('follows a DST change when the caller passes the offset in force at that instant', () => {
    // US spring forward, 8 Mar 2026: PST (-480) becomes PDT (-420) at 10:00 UTC.
    expect(dayKeyAt(Date.UTC(2026, 2, 8, 9, 59, 59), -480)).toBe('2026-03-08');
    expect(dayKeyAt(Date.UTC(2026, 2, 9, 7, 30, 0), -420)).toBe('2026-03-09');
    expect(dayKeyAt(Date.UTC(2026, 2, 9, 7, 30, 0), -480)).toBe('2026-03-08'); // the wrong offset would land a day early
  });

  it('a flight day keeps each photo on the day of the offset passed for it', () => {
    const departLocal = dayKeyAt(Date.UTC(2026, 5, 1, 20, 0), -420); // 13:00 in Los Angeles
    const arriveLocal = dayKeyAt(Date.UTC(2026, 5, 2, 20, 0), 330); // 01:30 next day in India
    expect([departLocal, arriveLocal]).toEqual(['2026-06-01', '2026-06-03']);
  });

  it('handles pre-epoch and far-future instants and rejects non-finite input', () => {
    expect(dayKeyAt(Date.UTC(1969, 11, 31, 23, 0), 0)).toBe('1969-12-31');
    expect(dayKeyAt(Date.UTC(2100, 1, 28, 12, 0), 0)).toBe('2100-02-28'); // 2100 is not a leap year
    expect(() => dayKeyAt(Number.NaN, 0)).toThrow(/instant/i);
    expect(() => dayKeyAt(0, Number.POSITIVE_INFINITY)).toThrow(/offset/i);
  });
});
