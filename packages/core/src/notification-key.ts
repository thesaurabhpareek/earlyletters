/**
 * Which words a reminder carries (NS-48 phase 1). Pure: no clock, no store,
 * no React Native. The planner has already decided that a note is sent, on
 * which day and at what time; this only names which catalogue key supplies
 * its words, so it can never add, remove or move a note.
 *
 * Phase 1 has one layer, the floor: the eight evening variants the app
 * already ships, keyed `floor.0` to `floor.7` in the order of
 * `en.notifications.evening`. The key is a function of the slot ordinal and
 * the day part of the reminder time and nothing else, so there is no stored
 * "last chosen key" and a re-plan on the same inputs picks the same words
 * (NS-48-R32). Recency, last-letter and day layers come later and sit above
 * this floor; they fall back to it.
 *
 * Day part (NS-48-R12): a variant whose words name the evening ("tonight",
 * "The house is quiet", "Before you sleep") is only eligible from 17:00. The
 * test in apps/mobile/test/reminders-key.test.ts checks these flags against
 * the real words, so the list cannot drift from the copy.
 */

/** Local minutes of the day from which evening-worded variants may be chosen. */
export const EVENING_FROM_MINUTES = 17 * 60;

/** Floor variants whose title or body names the evening, by index into the built 8. */
const EVENING_WORDED: readonly number[] = [1, 3, 6];

export const FLOOR_KEYS: readonly string[] = Array.from({ length: 8 }, (_, i) => `floor.${i}`);

export interface KeyInput {
  /** `slotOrdinal(date, weekdays)` of the planner: consecutive nudges get consecutive numbers. */
  slotOrdinal: number;
  /** The reminder time as local minutes of the day. */
  minutesOfDay: number;
}

/** What the planner's `select` seam takes: tests inject their own. */
export type KeySelector = (input: KeyInput) => string;

/** Indexes (into the built 8) that may be chosen at this time of day, in order. */
export function eligibleFloorIndexes(minutesOfDay: number): number[] {
  const evening = !(minutesOfDay < EVENING_FROM_MINUTES);
  return FLOOR_KEYS.map((_, i) => i).filter((i) => evening || !EVENING_WORDED.includes(i));
}

/** The floor key for a key string, or null when it is not one of ours. */
export function floorIndexOfKey(key: string): number | null {
  const i = FLOOR_KEYS.indexOf(key);
  return i < 0 ? null : i;
}

/** The floor alone: rotate through the eligible built variants by slot. Never throws, never empty. */
export const selectFloorOnly: KeySelector = ({ slotOrdinal, minutesOfDay }) => {
  const pool = eligibleFloorIndexes(minutesOfDay);
  const n = Number.isFinite(slotOrdinal) ? Math.floor(slotOrdinal) : 0;
  return FLOOR_KEYS[pool[((n % pool.length) + pool.length) % pool.length]];
};

/** The key for a note the planner has decided to send. Phase 1 is the floor; later layers fall back to it. */
export const selectNotificationKey: KeySelector = (input) => selectFloorOnly(input);
