/**
 * The day totals for setup asks (BL-1784), on the phone only (device settings, no text or names).
 * Kept apart from `./index` so the analytics consent sheet can count toward them without an import cycle.
 */
import { getSetting, setSetting } from '@/lib/store';
import { countsAfter, countsFor, type AskKind, type DayCounts } from './next-ask.logic';

export const DAY_KEYS = { day: 'asks.lastAskDay', asks: 'asks.asksToday', osAsks: 'asks.osAsksToday' } as const;

const n = (key: string): number => {
  const v = Number(getSetting(key) ?? '0');
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
};

export function storedDayCounts(): DayCounts {
  return { day: getSetting(DAY_KEYS.day), asks: n(DAY_KEYS.asks), osAsks: n(DAY_KEYS.osAsks) };
}

/** Today's totals: zero once the stored day is not today (reset at local midnight). */
export function todayCounts(now = Date.now()): { asks: number; osAsks: number } {
  return countsFor(storedDayCounts(), now);
}

/** An ask was shown: it counts now. */
export function recordDayAsk(kind: AskKind, now = Date.now()): void {
  const next = countsAfter(storedDayCounts(), kind, now);
  setSetting(DAY_KEYS.day, next.day as string);
  setSetting(DAY_KEYS.asks, String(next.asks));
  setSetting(DAY_KEYS.osAsks, String(next.osAsks));
}
