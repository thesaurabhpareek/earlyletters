/**
 * Prompt selection (packages/core/src/prompts.ts): the band edges, the kind
 * order, the fallback chain when a kind or band has no prompt, the recent-key
 * window and the two-in-three preference for age-specific openings. The text
 * lives in @scribe/content; this pins the logic over a small fictional library.
 */
import { describe, expect, it } from 'vitest';
import { AVOID_RECENT, bandFor, GAP_DAYS, kindFor, renderTemplate, selectPrompt, type Prompt, type SelectInput } from '../src';

const LIB: Prompt[] = [
  { key: 'o.any.1', text: 'What did {child} do today?', band: 'any', kind: 'opening' },
  { key: 'o.any.2', text: 'One small thing about tonight.', band: 'any', kind: 'opening' },
  { key: 'o.13.1', text: 'What does {child} point at now?', band: '13-18', kind: 'opening' },
  { key: 'o.13.2', text: 'A new word this week?', band: '13-18', kind: 'opening' },
  { key: 'o.0.1', text: 'How does {child} sleep?', band: '0-3', kind: 'opening' },
  { key: 'g.any.1', text: 'Tell {child} about today.', band: 'any', kind: 'gap' },
  { key: 'h.any.1', text: 'What would help tonight?', band: 'any', kind: 'hard' },
  { key: 'f.13.1', text: 'What do you notice about {child}?', band: '13-18', kind: 'family' },
  { key: 't.any.1', text: 'Ask {child} what to remember.', band: 'any', kind: 'together' },
  { key: 'o.old', text: 'retired', band: 'any', kind: 'opening', retired: true },
];

const base: SelectInput = { ageMonths: 16, daysSinceLastEntry: 1, hardStretch: false, role: 'parent', together: false, recentKeys: [], seed: '2026-10-03' };

describe('bandFor: the age bands and their edges', () => {
  it.each([
    [-1, '0-3'],
    [0, '0-3'],
    [3, '0-3'],
    [4, '4-6'],
    [6, '4-6'],
    [7, '7-9'],
    [9, '7-9'],
    [10, '10-12'],
    [12, '10-12'],
    [13, '13-18'],
    [18, '13-18'],
    [19, '19-24'],
    [24, '19-24'],
    [25, '25-36'],
    [36, '25-36'],
    [37, '37-60'],
    [60, '37-60'],
    [61, null],
    [120, null],
  ])('%i months is band %s', (months, band) => {
    expect(bandFor(months)).toBe(band);
  });

  it('a fractional age falls in the band of its whole months', () => {
    expect(bandFor(3.9)).toBe('0-3');
    expect(bandFor(12.5)).toBe('10-12');
  });
});

describe('kindFor: the most specific need wins', () => {
  it('hard > together > family > gap > opening, and the gap starts at GAP_DAYS', () => {
    expect(kindFor({ ...base, hardStretch: true, together: true, role: 'contributor', daysSinceLastEntry: 30 })).toBe('hard');
    expect(kindFor({ ...base, together: true, role: 'contributor', daysSinceLastEntry: 30 })).toBe('together');
    expect(kindFor({ ...base, role: 'contributor', daysSinceLastEntry: 30 })).toBe('family');
    expect(kindFor({ ...base, daysSinceLastEntry: GAP_DAYS })).toBe('gap');
    expect(kindFor({ ...base, daysSinceLastEntry: GAP_DAYS - 1 })).toBe('opening');
    expect(kindFor({ ...base, daysSinceLastEntry: null })).toBe('opening');
    expect(kindFor({ ...base, daysSinceLastEntry: 0 })).toBe('opening');
  });

  it('a first-ever night (no last entry) is an opening, never a gap prompt', () => {
    expect(kindFor({ ...base, daysSinceLastEntry: null })).toBe('opening');
    expect(selectPrompt({ ...base, daysSinceLastEntry: null }, LIB).kind).toBe('opening');
  });
});

describe('selectPrompt: fallbacks and freshness', () => {
  it('throws only on an empty or fully retired library', () => {
    expect(() => selectPrompt(base, [])).toThrow(/empty prompt library/);
    expect(() => selectPrompt(base, [LIB[9]])).toThrow(/empty prompt library/);
  });

  it('falls back from the kind to an age opening, then to any opening', () => {
    // family prompts exist only for 13-18: a contributor of a newborn gets an opening that fits a newborn
    const p = selectPrompt({ ...base, role: 'contributor', ageMonths: 1 }, LIB);
    expect(p.kind).toBe('opening');
    expect(['any', '0-3']).toContain(p.band);
    // no gap prompt for this band and none marked any: the opening pool for 25-36 is empty, so any opening
    const noAnyGap = LIB.filter((p) => p.key !== 'g.any.1');
    expect(selectPrompt({ ...base, ageMonths: 30, daysSinceLastEntry: 9 }, noAnyGap).kind).toBe('opening');
    // an age with no band-specific opening at all still gets one
    expect(selectPrompt({ ...base, ageMonths: 70 }, LIB).kind).toBe('opening');
  });

  it(`avoids the ${AVOID_RECENT} most recent keys and no more: the ${AVOID_RECENT + 1}th is eligible again`, () => {
    const others = (n: number) => Array.from({ length: n }, (_, i) => `other.${i}`);
    const picksWith = (recentKeys: string[]) => new Set(Array.from({ length: 60 }, (_, d) => selectPrompt({ ...base, seed: `p${d}`, recentKeys }, LIB).key));
    // 'o.13.2' in position AVOID_RECENT (the last avoided one): never served while others are fresh
    expect(picksWith([...others(AVOID_RECENT - 1), 'o.13.2']).has('o.13.2')).toBe(false);
    // one position further back: eligible again
    expect(picksWith([...others(AVOID_RECENT), 'o.13.2']).has('o.13.2')).toBe(true);
    // the three most recent openings are all avoided while a fresh one exists
    const recent = ['o.any.1', 'o.any.2', 'o.13.1'];
    for (const key of picksWith(recent)) expect(recent).not.toContain(key);
  });

  it('when every prompt of the kind is recent, one is served anyway rather than nothing', () => {
    const all = LIB.filter((p) => p.kind === 'opening').map((p) => p.key);
    const p = selectPrompt({ ...base, recentKeys: all }, LIB);
    expect(p.kind).toBe('opening');
    expect(p.retired).toBeUndefined();
  });

  it('prefers age-specific openings: two nights in three they are the only pool, the third night any opening may come', () => {
    // 2/3 of nights are banded by rule; on the other third half the pool is banded too, so about 5/6 overall.
    let banded = 0;
    const N = 300;
    for (let d = 0; d < N; d++) if (selectPrompt({ ...base, seed: `s${d}` }, LIB).band === '13-18') banded++;
    expect(banded / N).toBeGreaterThan(0.7);
    expect(banded / N).toBeLessThan(0.95);
  });

  it('is deterministic per night and per kind: the same seed gives the same prompt, a new seed may not', () => {
    const a = selectPrompt({ ...base, seed: 'x' }, LIB);
    expect(selectPrompt({ ...base, seed: 'x' }, LIB)).toBe(a);
    const keys = new Set(Array.from({ length: 30 }, (_, d) => selectPrompt({ ...base, seed: `d${d}` }, LIB).key));
    expect(keys.size).toBeGreaterThan(1);
  });

  it('[PRD-REQ-005] together prompts are served only when the caller says the child is present', () => {
    for (let d = 0; d < 30; d++) expect(selectPrompt({ ...base, seed: `t${d}` }, LIB).kind).not.toBe('together');
    expect(selectPrompt({ ...base, together: true }, LIB).kind).toBe('together');
  });
});

describe('renderTemplate', () => {
  it('fills repeated and numeric placeholders, leaves unknown and empty braces visible', () => {
    expect(renderTemplate('{child} and {child}, {n} letters', { child: 'Asha', n: 2 })).toBe('Asha and Asha, 2 letters');
    expect(renderTemplate('{} {child} {Child}', { child: 'Asha' })).toBe('{} Asha {Child}');
    expect(renderTemplate('no placeholders', {})).toBe('no placeholders');
    expect(renderTemplate('{a}{b}', { a: 'x', b: 'y' })).toBe('xy');
  });
});
