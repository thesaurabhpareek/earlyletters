/**
 * Prompt selection (packages/core/src/prompts.ts): the band edges, the kind
 * order, the fallback chain when a kind or band has no prompt, the recent-key
 * window and the two-in-three preference for age-specific openings. The text
 * lives in @scribe/content; this pins the logic over a small fictional library.
 *
 * Also pinned here (P3 critics' pass, 28 Oct 2026): a book before the birth is offered the `before` set and nothing
 * else (S2), and "Another thought" never shows the prompt that is on screen again (S4). The same two rules are run
 * over the real library in packages/content/test/prompts.preBirth.test.ts.
 */
import { describe, expect, it } from 'vitest';
import { AVOID_RECENT, bandFor, GAP_DAYS, kindFor, MIN_ALTERNATIVES, renderTemplate, selectPrompt, type Prompt, type PromptBand, type SelectInput } from '../src';

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

/* ------------------------------------------------------------------ */
/* S2: a book before the birth                                         */
/* ------------------------------------------------------------------ */

const BEFORE: Prompt[] = [
  { key: 'b.1', text: 'What does an ordinary day look like these weeks?', band: 'before', kind: 'opening' },
  { key: 'b.2', text: 'Where did the name {child} come from?', band: 'before', kind: 'opening' },
  { key: 'b.3', text: 'What do you hope {child} gets to love?', band: 'before', kind: 'opening' },
  { key: 'b.4', text: 'What does your home sound like these days?', band: 'before', kind: 'opening' },
];
const WITH_BEFORE: Prompt[] = [...LIB, ...BEFORE];
const preBirth: SelectInput = { ...base, ageMonths: 0, beforeBirth: true };

describe('[S2] selectPrompt: a book before the birth gets the before set, and only that', () => {
  it('bandFor never returns the before band: it is a signal, not an age', () => {
    for (let m = -5; m < 200; m++) expect(bandFor(m)).not.toBe('before');
  });

  it('every kind of night, every seed: only before prompts, never a newborn or any-age opening', () => {
    const kinds: Partial<SelectInput>[] = [
      {},
      { daysSinceLastEntry: 9 },
      { daysSinceLastEntry: null },
      { hardStretch: true },
      { together: true },
      { role: 'contributor', daysSinceLastEntry: 9 },
    ];
    for (const k of kinds) {
      for (let d = 0; d < 60; d++) {
        const p = selectPrompt({ ...preBirth, ...k, seed: `2026-10-${d}` }, WITH_BEFORE);
        expect(p.band, JSON.stringify(k)).toBe('before');
      }
    }
  });

  it('the age is not read: any ageMonths gives the same prompt before the birth', () => {
    for (let d = 0; d < 20; d++) {
      const seed = `s${d}`;
      const keys = new Set([0, 3, 16, 70].map((ageMonths) => selectPrompt({ ...preBirth, ageMonths, seed }, WITH_BEFORE).key));
      expect(keys.size).toBe(1);
    }
  });

  it('a born child is never offered a before prompt, at any age, kind or fallback', () => {
    const born = (over: Partial<SelectInput>) => ({ ...base, ...over });
    for (const ageMonths of [0, 2, 5, 16, 40, 70]) {
      for (const k of [{}, { daysSinceLastEntry: 9 }, { hardStretch: true }, { together: true }, { role: 'contributor' as const }]) {
        for (let d = 0; d < 40; d++) {
          expect(selectPrompt(born({ ageMonths, ...k, seed: `s${d}` }), WITH_BEFORE).band).not.toBe('before');
          // beforeBirth: false is the same as absent
          expect(selectPrompt(born({ ageMonths, ...k, beforeBirth: false, seed: `s${d}` }), WITH_BEFORE).key).toBe(selectPrompt(born({ ageMonths, ...k, seed: `s${d}` }), WITH_BEFORE).key);
        }
      }
    }
    // even at the last resort, when no opening fits a born child at all: the before prompts are openings too, and are
    // still not what a child who is here is offered
    const gapOnly: Prompt[] = [LIB[5], ...BEFORE];
    for (let d = 0; d < 40; d++) expect(selectPrompt({ ...base, ageMonths: 70, seed: `s${d}` }, gapOnly).key).toBe('g.any.1');
    const lean: Prompt[] = [LIB[0], ...BEFORE];
    for (let d = 0; d < 40; d++) expect(selectPrompt({ ...base, ageMonths: 70, seed: `s${d}` }, lean).key).toBe('o.any.1');
  });

  it('adding the before set changes nothing for a born child: the same prompt, night after night', () => {
    for (let d = 0; d < 60; d++) {
      const input = { ...base, seed: `n${d}`, recentKeys: d % 2 ? ['o.13.1'] : [] };
      expect(selectPrompt(input, WITH_BEFORE).key).toBe(selectPrompt(input, LIB).key);
      expect(selectPrompt({ ...input, daysSinceLastEntry: 9 }, WITH_BEFORE).key).toBe(selectPrompt({ ...input, daysSinceLastEntry: 9 }, LIB).key);
    }
  });

  it('a library with no before prompt (an old server bundle) behaves as it did: the age band decides', () => {
    for (let d = 0; d < 20; d++) {
      const p = selectPrompt({ ...preBirth, seed: `s${d}` }, LIB);
      expect(['any', '0-3']).toContain(p.band);
    }
  });

  it('a before prompt of another kind is served on that kind of night: the set may grow its own gap prompts', () => {
    const lib: Prompt[] = [...WITH_BEFORE, { key: 'b.gap', text: 'Tell {child} one small thing.', band: 'before', kind: 'gap' }];
    for (let d = 0; d < 20; d++) {
      expect(selectPrompt({ ...preBirth, daysSinceLastEntry: 9, seed: `s${d}` }, lib).key).toBe('b.gap');
      expect(selectPrompt({ ...preBirth, daysSinceLastEntry: 1, seed: `s${d}` }, lib).kind).toBe('opening');
    }
  });

  it('avoids recent before prompts like any other, and serves one when all are recent', () => {
    const recent = ['b.1', 'b.2', 'b.3'];
    for (let d = 0; d < 40; d++) expect(selectPrompt({ ...preBirth, seed: `s${d}`, recentKeys: recent }, WITH_BEFORE).key).toBe('b.4');
    const all = BEFORE.map((p) => p.key);
    for (let d = 0; d < 10; d++) expect(all).toContain(selectPrompt({ ...preBirth, seed: `s${d}`, recentKeys: all }, WITH_BEFORE).key);
  });

  it('is deterministic per night: the same seed gives the same prompt', () => {
    const a = selectPrompt({ ...preBirth, seed: 'x' }, WITH_BEFORE);
    expect(selectPrompt({ ...preBirth, seed: 'x' }, WITH_BEFORE)).toBe(a);
    const keys = new Set(Array.from({ length: 40 }, (_, d) => selectPrompt({ ...preBirth, seed: `d${d}` }, WITH_BEFORE).key));
    expect(keys.size).toBeGreaterThan(1);
  });
});

/* ------------------------------------------------------------------ */
/* S4: "Another thought" never shows the same prompt                   */
/* ------------------------------------------------------------------ */

/** A library shaped like the real one: pools of 6 per age band, 10 any-age openings, 7 gap prompts, 8 before prompts. */
function shapedLibrary(): Prompt[] {
  const out: Prompt[] = [];
  const add = (n: number, kind: Prompt['kind'], band: PromptBand) => {
    for (let i = 0; i < n; i++) out.push({ key: `${kind}.${band}.${i}`, text: `${kind} ${band} ${i}`, band, kind });
  };
  add(10, 'opening', 'any');
  for (const b of ['0-3', '4-6', '7-9', '10-12', '13-18', '19-24', '25-36', '37-60'] as const) add(6, 'opening', b);
  add(8, 'opening', 'before');
  add(7, 'gap', 'any');
  add(9, 'hard', 'any');
  add(12, 'family', 'any');
  add(2, 'together', '0-3');
  return out;
}

/** What a person sees pressing "Another thought" n times: each press leaves the prompt on screen out of the next draw. */
function presses(input: SelectInput, library: readonly Prompt[], n: number, exclude: boolean): string[] {
  let shown = selectPrompt(input, library).key;
  const seen = [shown];
  for (let i = 1; i <= n; i++) {
    shown = selectPrompt({ ...input, seed: `${input.seed}:${i}`, excludeKeys: exclude ? [shown] : [] }, library).key;
    seen.push(shown);
  }
  return seen;
}
const repeats = (keys: string[]) => keys.filter((k, i) => i > 0 && k === keys[i - 1]).length;

describe('[S4] selectPrompt: a press of "Another thought" never shows the prompt that was on screen', () => {
  const lib = shapedLibrary();
  const ages = [0, 2, 5, 8, 11, 16, 22, 30, 50, 70];

  it('over 60 days of 12 presses, at every age, in the opening and the gap kind: no immediate repeat', () => {
    let presses_ = 0;
    for (const ageMonths of ages) {
      for (const daysSinceLastEntry of [1, 9]) {
        for (let day = 0; day < 60; day++) {
          const keys = presses({ ...base, ageMonths, daysSinceLastEntry, seed: `2026-10-${day}` }, lib, 12, true);
          expect(repeats(keys), `${ageMonths} months, ${daysSinceLastEntry} days, day ${day}: ${keys.join(' ')}`).toBe(0);
          presses_ += keys.length - 1;
        }
      }
    }
    expect(presses_).toBe(ages.length * 2 * 60 * 12);
  });

  it('before the birth too: the pool is the 8 before prompts and no press repeats', () => {
    for (const daysSinceLastEntry of [null, 1, 9]) {
      for (let day = 0; day < 60; day++) {
        const keys = presses({ ...preBirth, daysSinceLastEntry, seed: `d${day}` }, lib, 12, true);
        expect(repeats(keys)).toBe(0);
        for (const k of keys) expect(k.startsWith('opening.before.')).toBe(true);
      }
    }
  });

  it('the test has teeth: without the exclusion the gap kind repeats on about one press in seven', () => {
    let total = 0;
    let same = 0;
    for (let day = 0; day < 60; day++) {
      const keys = presses({ ...base, daysSinceLastEntry: 9, seed: `2026-10-${day}` }, lib, 12, false);
      total += keys.length - 1;
      same += repeats(keys);
    }
    expect(same / total).toBeGreaterThan(0.08);
    expect(same / total).toBeLessThan(0.22);
  });

  it('keeps the kind: the gap pool has 7, so 6 remain and a press stays a gap prompt', () => {
    for (let day = 0; day < 60; day++) {
      const first = selectPrompt({ ...base, daysSinceLastEntry: 9, seed: `d${day}` }, lib);
      const next = selectPrompt({ ...base, daysSinceLastEntry: 9, seed: `d${day}:1`, excludeKeys: [first.key] }, lib);
      expect(next.kind).toBe('gap');
      expect(next.key).not.toBe(first.key);
    }
  });

  it(`fewer than ${MIN_ALTERNATIVES} left after the exclusion: the pool is widened with the openings that fit the child`, () => {
    const small: Prompt[] = [
      { key: 'g.1', text: 'a', band: 'any', kind: 'gap' },
      { key: 'g.2', text: 'b', band: 'any', kind: 'gap' },
      { key: 'o.any', text: 'c', band: 'any', kind: 'opening' },
      { key: 'o.13', text: 'd', band: '13-18', kind: 'opening' },
      { key: 'o.0', text: 'e', band: '0-3', kind: 'opening' },
    ];
    const input = { ...base, ageMonths: 16, daysSinceLastEntry: 9 };
    const keys = new Set<string>();
    for (let d = 0; d < 80; d++) {
      const p = selectPrompt({ ...input, seed: `d${d}`, excludeKeys: ['g.1'] }, small);
      expect(p.key).not.toBe('g.1');
      expect(p.key).not.toBe('o.0'); // a newborn opening does not fit a 16 month old
      keys.add(p.key);
    }
    // g.2 alone is fewer than 3: the 16 month old's openings joined it
    expect([...keys].sort()).toEqual(['g.2', 'o.13', 'o.any']);
    // The first draw of a night (no exclusion) is not widened: a pool of 2 is still the gap kind
    for (let d = 0; d < 40; d++) expect(selectPrompt({ ...input, seed: `d${d}` }, small).kind).toBe('gap');
  });

  it(`${MIN_ALTERNATIVES - 1} left is still fewer than ${MIN_ALTERNATIVES}: widened with the openings that fit`, () => {
    const three: Prompt[] = [
      ...Array.from({ length: 3 }, (_, i): Prompt => ({ key: `g.${i}`, text: 'g', band: 'any', kind: 'gap' })),
      { key: 'o.any', text: 'c', band: 'any', kind: 'opening' },
      { key: 'o.13', text: 'd', band: '13-18', kind: 'opening' },
      { key: 'o.0', text: 'e', band: '0-3', kind: 'opening' },
    ];
    const keys = new Set<string>();
    for (let d = 0; d < 120; d++) keys.add(selectPrompt({ ...base, ageMonths: 16, daysSinceLastEntry: 9, seed: `d${d}`, excludeKeys: ['g.0'] }, three).key);
    expect([...keys].sort()).toEqual(['g.1', 'g.2', 'o.13', 'o.any']);
  });

  it(`exactly ${MIN_ALTERNATIVES} left is enough: nothing is widened`, () => {
    const four: Prompt[] = [
      ...Array.from({ length: 4 }, (_, i): Prompt => ({ key: `g.${i}`, text: 'g', band: 'any', kind: 'gap' })),
      { key: 'o.any', text: 'c', band: 'any', kind: 'opening' },
    ];
    for (let d = 0; d < 60; d++) {
      const p = selectPrompt({ ...base, daysSinceLastEntry: 9, seed: `d${d}`, excludeKeys: ['g.0'] }, four);
      expect(p.kind).toBe('gap');
      expect(p.key).not.toBe('g.0');
    }
  });

  it('an exclusion that is not in the pool changes nothing; several exclusions all hold', () => {
    for (let d = 0; d < 40; d++) {
      const input = { ...base, seed: `d${d}` };
      expect(selectPrompt({ ...input, excludeKeys: ['not-a-key'] }, LIB).key).toBe(selectPrompt(input, LIB).key);
      expect(['o.any.1', 'o.any.2']).not.toContain(selectPrompt({ ...input, excludeKeys: ['o.any.1', 'o.any.2'], recentKeys: [] }, LIB).key);
    }
  });

  it('when only the excluded prompt exists it is served rather than nothing', () => {
    const one: Prompt[] = [{ key: 'only', text: 'x', band: 'any', kind: 'opening' }];
    expect(selectPrompt({ ...base, excludeKeys: ['only'] }, one).key).toBe('only');
    expect(selectPrompt({ ...preBirth, excludeKeys: ['only'] }, one).key).toBe('only');
  });

  it('the exclusion beats the recency preference: a fresh prompt is not worth a repeat', () => {
    const two: Prompt[] = [
      { key: 'a', text: 'a', band: 'any', kind: 'opening' },
      { key: 'b', text: 'b', band: 'any', kind: 'opening' },
    ];
    // both are recent, one is on screen: the other is served
    for (let d = 0; d < 20; d++) expect(selectPrompt({ ...base, ageMonths: 70, seed: `d${d}`, recentKeys: ['a', 'b'], excludeKeys: ['a'] }, two).key).toBe('b');
  });
});
