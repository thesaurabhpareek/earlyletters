/** NS-53-R40 and R281(a): which days qualify, both span predicates behind one rules field. */
import { describe, expect, it } from 'vitest';
import { KIND_VIDEO } from '../../src/moments/columns';
import { groupByDay } from '../../src/moments/group';
import { qualifyDay, qualifies } from '../../src/moments/qualify';
import type { GroupingRules } from '../../src/moments/rules-input';
import { ASHA_RULES_V1 as R, ashaLibV1, columns, la, laOffsetAt, type Row } from './asha-lib-v1';

const D = (h: number, m: number) => la(2026, 11, 14, h, m);
const day = (rows: Row[], rules: GroupingRules = R) => groupByDay(columns(rows), laOffsetAt, rules)[0];
const frames = (...t: number[]): Row[] => t.map((ms, i) => ({ id: `q${i}`, ms }));

describe('[NS-53-R281] span rule (default): busy only with two sessions or a span of MIN_SPAN', () => {
  it('4 candidates spanning 2 hours 5 minutes in one session qualify on the span rule', () => {
    const g = day(frames(D(9, 0), D(9, 40), D(10, 20), D(11, 5)));
    expect(g.sessions).toHaveLength(1);
    expect(qualifyDay(g, R)).toEqual(['span']);
  });

  it('4 candidates spanning 1 hour 40 minutes do not', () => {
    expect(qualifyDay(day(frames(D(9, 0), D(9, 30), D(10, 0), D(10, 40))), R)).toEqual([]);
  });

  it('a span of exactly MIN_SPAN qualifies', () => {
    expect(qualifies(day(frames(D(9, 0), D(9, 30), D(10, 0), D(11, 0))), R)).toBe(true);
  });

  it('4 candidates in two sessions qualify on sessions even inside a short span rule value', () => {
    const g = day(frames(D(9, 0), D(9, 5), D(13, 0), D(13, 5)), { ...R, MIN_SPAN_SECONDS: 99 * 3600 });
    expect(qualifyDay(g, { ...R, MIN_SPAN_SECONDS: 99 * 3600 })).toEqual(['sessions']);
  });

  it('a burst of 5 pictures in ten minutes is one candidate and never busy; 5 spread frames at 10 minutes are not either', () => {
    expect(qualifies(day(frames(D(9, 0), D(9, 10), D(9, 20), D(9, 30), D(9, 40))), R)).toBe(false);
  });

  it('under the span rule BUSY_DAY alone does not qualify, and 3 candidates over 6 hours do not', () => {
    expect(qualifies(day(frames(D(9, 0), D(9, 10), D(9, 20), D(9, 30), D(9, 40))), R)).toBe(false);
    expect(qualifies(day(frames(D(8, 0), D(11, 0), D(14, 0))), R)).toBe(false);
  });
});

describe('[NS-53-R281] BUSY_HOURS rule (the other predicate, same rules field)', () => {
  const H: GroupingRules = { ...R, BUSY_RULE: 'hours' };
  it('4 candidates within 3 hours qualify; 4 within 3 hours 1 minute do not', () => {
    expect(qualifyDay(day(frames(D(9, 0), D(10, 0), D(11, 0), D(12, 0)), H), H)).toEqual(['busy-hours']);
    expect(qualifyDay(day(frames(D(9, 0), D(10, 0), D(11, 0), D(12, 1)), H), H)).toEqual([]);
  });
  it('5 candidates qualify on BUSY_DAY in any spread, 4 spread over a day do not', () => {
    expect(qualifyDay(day(frames(D(8, 0), D(10, 59), D(14, 0), D(17, 0), D(20, 0)), H), H)).toEqual(['busy-day']);
    expect(qualifies(day(frames(D(8, 0), D(11, 1), D(14, 2), D(17, 3)), H), H)).toBe(false);
  });
  it('the sliding window finds a dense run later in the day', () => {
    expect(qualifies(day(frames(D(6, 0), D(15, 0), D(15, 20), D(16, 0), D(17, 0)), H), H)).toBe(true);
  });
});

describe('[NS-53-R40] other ways a day qualifies, and the lone picture that does not', () => {
  it('a hearted picture, a video, an occasion and a day kept close each qualify alone; a lone ordinary picture does not', () => {
    expect(qualifyDay(day([{ id: 'h', ms: D(9, 0), heart: true }]), R)).toEqual(['heart']);
    expect(qualifyDay(day([{ id: 'v', ms: D(9, 0), kind: KIND_VIDEO, durationMs: 9000 }]), R)).toEqual(['video']);
    const lone = day(frames(D(9, 0)));
    expect(qualifyDay(lone, R)).toEqual([]);
    expect(qualifyDay(lone, R, { occasion: true })).toEqual(['occasion']);
    expect(qualifyDay(lone, R, { keptClose: true })).toEqual(['kept-close']);
  });

  it('a heart on a near-duplicate frame still counts for the day', () => {
    expect(qualifies(day([{ id: 'a', ms: D(9, 0) }, { id: 'b', ms: D(9, 0) + 3000, heart: true }]), R)).toBe(true);
  });
});

describe('[NS-53-R40] [NS-53-R107] asha-lib-v1 qualifying days (golden)', () => {
  for (const c of ashaLibV1()) {
    it(`${c.name}: qualifying days`, () => {
      const q = groupByDay(columns(c.rows), laOffsetAt, R).filter((d) => qualifies(d, R)).map((d) => d.dayKey);
      expect(q).toEqual(c.qualifying);
    });
  }
});
