import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  EMPTY_CATALOGUE,
  FLOOR_KEYS,
  lastLetterKind,
  layeredSelector,
  recencyBand,
  selectLayered,
  selectNotificationKey,
  type KeyInput,
  type LayerCatalogue,
  type LayerKey,
} from '../src';

const EVENING = 20 * 60;
const MORNING = 9 * 60;
// Test-only keys: no parent-facing words exist for these layers yet.
const CAT: LayerCatalogue = {
  recency: {
    r1: [{ key: 'ntc.r1.a', evening: false }, { key: 'ntc.r1.b', evening: true }],
    r2: [{ key: 'ntc.r2.a', evening: false }],
    r3: [{ key: 'ntc.r3.a', evening: false }],
    r4: [{ key: 'ntc.r4.a', evening: false }],
  },
  kind: { spoke: [{ key: 'ntc.kind.spoke', evening: false }], typed: [{ key: 'ntc.kind.typed', evening: false }] },
};

describe('NS-48 recency and last-letter layers (pure)', () => {
  it('[NS-48-R3] recency bands follow the day gap: r1 next day, r2 2-6, r3 7-14, r4 15-35, none after', () => {
    const band = (gap: number) => recencyBand(100 + gap, 100);
    expect([1, 2, 6, 7, 14, 15, 35, 36].map(band)).toEqual(['r1', 'r2', 'r2', 'r3', 'r3', 'r4', 'r4', null]);
  });

  it('[NS-48-R3] an anchor after the fire date is clamped (never a negative gap); unknown inputs give no band', () => {
    expect(recencyBand(100, 105)).toBe('r1');
    expect(recencyBand(100, null)).toBeNull();
    expect(recencyBand(100, undefined)).toBeNull();
    expect(recencyBand(Number.NaN, 100)).toBeNull();
    expect(recencyBand(100, Number.NaN)).toBeNull();
  });

  it('[NS-48-R3] a key for an r1 date never comes from the r4 pool, and the same inputs give the same key', () => {
    const r1 = Array.from({ length: 12 }, (_, i) => selectLayered({ slotOrdinal: i, minutesOfDay: EVENING, recency: 'r1' }, CAT));
    expect(r1.every((k) => k?.startsWith('ntc.r1.'))).toBe(true);
    expect(selectLayered({ slotOrdinal: 3, minutesOfDay: EVENING, recency: 'r4' }, CAT)).toBe('ntc.r4.a');
    const again = Array.from({ length: 12 }, (_, i) => selectLayered({ slotOrdinal: i, minutesOfDay: EVENING, recency: 'r1' }, CAT));
    expect(again).toEqual(r1);
  });

  it('[NS-48-R27] last letter kind: spoken is spoke; typed, mixed and a note are typed; a quiet-day mark is not a letter', () => {
    expect(lastLetterKind('spoken', 'letter')).toBe('spoke');
    expect(lastLetterKind('typed', 'letter')).toBe('typed');
    expect(lastLetterKind('mixed', 'letter')).toBe('typed');
    expect(lastLetterKind('spoken', 'note')).toBe('typed');
    expect(lastLetterKind('spoken', 'not_much')).toBeNull();
    expect(lastLetterKind('other', 'letter')).toBeNull();
  });

  it('[NS-48-R5] the last-letter layer applies only within 6 days; older letters fall to recency', () => {
    const k = (recency: 'r1' | 'r2' | 'r3' | 'r4') => selectLayered({ slotOrdinal: 0, minutesOfDay: EVENING, recency, lastKind: 'spoke' }, CAT);
    expect(k('r1')).toBe('ntc.kind.spoke');
    expect(k('r2')).toBe('ntc.kind.spoke');
    expect(k('r3')).toBe('ntc.r3.a');
    expect(k('r4')).toBe('ntc.r4.a');
  });

  it('[NS-48-R5] an unknown kind (first and small have no flag yet) falls to recency, then to the floor', () => {
    expect(selectLayered({ slotOrdinal: 0, minutesOfDay: EVENING, recency: 'r2', lastKind: null }, CAT)).toBe('ntc.r2.a');
    expect(selectLayered({ slotOrdinal: 0, minutesOfDay: EVENING, lastKind: 'spoke' }, CAT)).toBeNull();
  });

  it('a key that names the evening is not chosen before 17:00', () => {
    const picks = Array.from({ length: 6 }, (_, i) => selectLayered({ slotOrdinal: i, minutesOfDay: MORNING, recency: 'r1' }, CAT));
    expect(picks.every((k) => k === 'ntc.r1.a')).toBe(true);
  });

  it('with no catalogue the layered selector is the floor, whatever the layers say', () => {
    const sel = layeredSelector(EMPTY_CATALOGUE);
    for (let slot = -3; slot < 20; slot++) {
      for (const minutesOfDay of [MORNING, EVENING]) {
        const base = { slotOrdinal: slot, minutesOfDay };
        expect(sel({ ...base, recency: 'r1', lastKind: 'spoke' })).toBe(selectNotificationKey(base));
      }
    }
  });
});

// BL-1323: the FR-NTC rows of the notification catalogue (NS-48 is the source of truth). A seeded property test, no
// dependency: mulberry32 with a fixed seed, so a failure prints its case number and replays exactly.
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const BANDS = ['r1', 'r2', 'r3', 'r4'] as const;
const CASES = 2000;

/** A generated catalogue: any pool may be missing, empty or all evening-worded. */
function genCatalogue(r: () => number): LayerCatalogue {
  const pool = (name: string): LayerKey[] | undefined =>
    r() < 0.15 ? undefined : Array.from({ length: Math.floor(r() * 5) }, (_, i) => ({ key: `ntc.${name}.${i}`, evening: r() < 0.4 }));
  return {
    recency: Object.fromEntries(BANDS.map((b) => [b, pool(b)]).filter(([, p]) => p)),
    kind: Object.fromEntries((['spoke', 'typed'] as const).map((k) => [k, pool(k)]).filter(([, p]) => p)),
  };
}

/** A generated key input, odd values included: negative, fractional and NaN ordinals, every minute of the day. */
function genInput(r: () => number): KeyInput {
  const odd = [-7, -1, 0.5, 1e12, Number.NaN];
  return {
    slotOrdinal: r() < 0.1 ? odd[Math.floor(r() * odd.length)] : Math.floor(r() * 500),
    minutesOfDay: Math.floor(r() * 24 * 60),
    recency: r() < 0.2 ? (r() < 0.5 ? null : undefined) : BANDS[Math.floor(r() * 4)],
    lastKind: r() < 0.3 ? null : r() < 0.5 ? 'spoke' : 'typed',
  };
}

const keysOf = (c: LayerCatalogue) => [...Object.values(c.recency), ...Object.values(c.kind)].flatMap((p) => (p ?? []).map((k) => k.key));

describe('[FR-NTC-01] a pure function in core returns a catalogue key from the inputs (property)', () => {
  it('the same inputs always give the same key, in any call order, and the key is one the catalogue or the floor holds', () => {
    const r = rng(1323_01);
    for (let c = 0; c < 40; c++) {
      const cat = genCatalogue(r);
      const select = layeredSelector(cat);
      const inputs = Array.from({ length: CASES / 40 }, () => genInput(r));
      const forward = inputs.map((i) => select(i));
      // Asked again backwards, through a fresh selector: nothing is remembered between calls or between selectors.
      const again = layeredSelector(cat);
      const backward = [...inputs].reverse().map((i) => again(i)).reverse();
      expect(backward, `catalogue ${c}`).toEqual(forward);
      const allowed = new Set([...keysOf(cat), ...FLOOR_KEYS]);
      for (const k of forward) expect(allowed.has(k), `catalogue ${c} key ${k}`).toBe(true);
    }
  });
});

describe('[FR-NTC-02] the catalogue on or off changes only which key, never whether there is one (property)', () => {
  it('off is the floor exactly; on answers every input the floor answers, and differs from it only where a layer pool answers', () => {
    const r = rng(1323_02);
    const off = layeredSelector(EMPTY_CATALOGUE);
    for (let c = 0; c < 40; c++) {
      const cat = genCatalogue(r);
      const on = layeredSelector(cat);
      for (let n = 0; n < CASES / 40; n++) {
        const input = genInput(r);
        const floor = selectNotificationKey(input);
        expect(off(input), `catalogue ${c} case ${n}`).toBe(floor);
        const key = on(input);
        expect(typeof key === 'string' && key.length > 0).toBe(true);
        const layer = selectLayered(input, cat);
        expect(key, `catalogue ${c} case ${n}`).toBe(layer ?? floor);
      }
    }
  });
});

describe('[FR-NTC-03] every input is computable at plan time: recency is fire date minus anchor date, never a clock read', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('the band depends only on the day difference, whatever the days are', () => {
    const r = rng(1323_03);
    for (let n = 0; n < CASES; n++) {
      const gap = Math.floor(r() * 50) - 5;
      const a = Math.floor(r() * 40_000);
      const shift = Math.floor(r() * 40_000) - 20_000;
      expect(recencyBand(a + gap + shift, a + shift), `gap ${gap}`).toBe(recencyBand(a + gap, a));
    }
  });

  it('the band and the key are the same whatever the clock says when they are asked', () => {
    const r = rng(1323_33);
    const cat = genCatalogue(r);
    const cases = Array.from({ length: 300 }, () => ({ fire: 20_000 + Math.floor(r() * 400), anchor: 20_000 + Math.floor(r() * 400), input: genInput(r) }));
    const ask = () => cases.map(({ fire, anchor, input }) => [recencyBand(fire, anchor), layeredSelector(cat)({ ...input, recency: recencyBand(fire, anchor) })]);
    vi.useFakeTimers();
    vi.setSystemTime(Date.UTC(2026, 0, 1, 3));
    const early = ask();
    vi.setSystemTime(Date.UTC(2031, 6, 15, 22));
    expect(ask()).toEqual(early);
  });
});

describe('[FR-NTC-05] the question follows the last letter kind, within 6 days only', () => {
  const SPLIT: LayerCatalogue = {
    recency: Object.fromEntries(BANDS.map((b) => [b, [{ key: `ntc.${b}`, evening: false }]])),
    kind: { spoke: [{ key: 'ntc.kind.spoke', evening: false }], typed: [{ key: 'ntc.kind.typed', evening: false }] },
  };

  it('days 1 to 6 after a letter take that kind pool and never the other kind; from day 7 the kind shapes nothing', () => {
    const r = rng(1323_05);
    for (let n = 0; n < CASES; n++) {
      const gap = 1 + Math.floor(r() * 35);
      const lastKind = r() < 0.5 ? 'spoke' : 'typed';
      const input = { ...genInput(r), recency: recencyBand(1000 + gap, 1000), lastKind } as KeyInput;
      const key = selectLayered(input, SPLIT);
      expect(key, `gap ${gap} ${lastKind}`).toBe(gap <= 6 ? `ntc.kind.${lastKind}` : `ntc.${recencyBand(1000 + gap, 1000)}`);
    }
  });

  it('the kind is read from the capture mode and entry kind alone: a picture is not a kind (NS-48-R5)', () => {
    expect(lastLetterKind.length).toBe(2);
    for (const mode of ['spoken', 'typed', 'mixed', 'picture', 'photo', 'video']) {
      for (const kind of ['letter', 'note', 'picture', 'photo']) {
        expect(['spoke', 'typed', null]).toContain(lastLetterKind(mode, kind));
      }
    }
  });
});
