import { describe, expect, it } from 'vitest';
import {
  EMPTY_CATALOGUE,
  lastLetterKind,
  layeredSelector,
  recencyBand,
  selectLayered,
  selectNotificationKey,
  type LayerCatalogue,
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
