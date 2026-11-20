import { describe, expect, it } from 'vitest';
import {
  EVENING_FROM_MINUTES,
  FLOOR_KEYS,
  eligibleFloorIndexes,
  floorIndexOfKey,
  selectFloorOnly,
  selectNotificationKey,
} from '../src/notification-key';

const MORNING = 7 * 60;
const EVENING = 20 * 60 + 30;

describe('NS-48 phase 1: the key function', () => {
  it('[NS-48-R1] same inputs same key; every key it returns is one of the floor keys', () => {
    for (const minutesOfDay of [MORNING, 12 * 60, EVENING_FROM_MINUTES - 1, EVENING_FROM_MINUTES, EVENING]) {
      for (let slotOrdinal = 0; slotOrdinal < 400; slotOrdinal++) {
        const a = selectNotificationKey({ slotOrdinal, minutesOfDay });
        expect(selectNotificationKey({ slotOrdinal, minutesOfDay })).toBe(a);
        expect(FLOOR_KEYS).toContain(a);
      }
    }
  });

  it('[NS-48-R32] selection is stateless: a pure function of the slot and the day part, with no stored last key', () => {
    const first = Array.from({ length: 30 }, (_, i) => selectNotificationKey({ slotOrdinal: i, minutesOfDay: EVENING }));
    // Asking in another order, or again, changes nothing: there is nothing remembered between calls.
    const reversed = Array.from({ length: 30 }, (_, i) => selectNotificationKey({ slotOrdinal: 29 - i, minutesOfDay: EVENING })).reverse();
    expect(reversed).toEqual(first);
  });

  it('[NS-48-R23] from 17:00 the key is the built rotation, slot ordinal modulo 8', () => {
    for (let slotOrdinal = 0; slotOrdinal < 64; slotOrdinal++) {
      expect(floorIndexOfKey(selectNotificationKey({ slotOrdinal, minutesOfDay: EVENING }))).toBe(slotOrdinal % 8);
    }
  });

  it('[NS-48-R12] before 17:00 no evening-worded variant is chosen, including the built 8', () => {
    expect(eligibleFloorIndexes(EVENING_FROM_MINUTES - 1)).toEqual([0, 2, 4, 5, 7]);
    expect(eligibleFloorIndexes(EVENING_FROM_MINUTES)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    for (let slotOrdinal = 0; slotOrdinal < 200; slotOrdinal++) {
      const index = floorIndexOfKey(selectNotificationKey({ slotOrdinal, minutesOfDay: MORNING }));
      expect([1, 3, 6]).not.toContain(index);
    }
  });

  it('[NS-48-R14] no key repeats within the pool length, in the morning pool and the evening pool', () => {
    for (const [minutesOfDay, size] of [[MORNING, 5], [EVENING, 8]] as const) {
      for (let start = 0; start < 40; start++) {
        const keys = Array.from({ length: size }, (_, i) => selectNotificationKey({ slotOrdinal: start + i, minutesOfDay }));
        expect(new Set(keys).size).toBe(size);
      }
    }
  });

  it('[NS-48-R15] the floor always answers: negative, huge or fractional input, any minute of the day, never throws', () => {
    for (const slotOrdinal of [-5, -1, 0, 1.5, 1e12, Number.MAX_SAFE_INTEGER, Number.NaN]) {
      for (let minutesOfDay = 0; minutesOfDay < 24 * 60; minutesOfDay += 15) {
        const key = selectFloorOnly({ slotOrdinal, minutesOfDay });
        expect(FLOOR_KEYS).toContain(key);
      }
    }
    expect(FLOOR_KEYS).toHaveLength(8);
    expect(floorIndexOfKey('nope')).toBeNull();
  });

  it('[NS-48-R33] every reminder hour in the window has at least one eligible floor variant', () => {
    for (let minutesOfDay = 7 * 60; minutesOfDay <= 21 * 60 + 30; minutesOfDay += 15) {
      expect(eligibleFloorIndexes(minutesOfDay).length).toBeGreaterThan(0);
    }
  });
});
