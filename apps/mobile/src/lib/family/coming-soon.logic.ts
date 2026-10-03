/**
 * "Tell me when it's here" on the co-parent coming-soon presentation: a local
 * flag on this phone only. No network, no account, no analytics event. The v1.1
 * build reads it to show a quiet "Writing together is here" note once
 * (docs/backlog/future/06-coparent-sharing-v1-1.md, acceptance criteria).
 *
 * Pure: the settings store is passed in, so Node tests use a Map.
 */
export const COPARENT_NOTIFY_KEY = 'family.coParentNotify';

export interface SettingsLike {
  getSetting(key: string): string | null;
  setSetting(key: string, value: string): void;
}

/** The day (YYYY-MM-DD) the person asked, or null. A day, never a time: nothing finer is needed. */
export function coParentNotifyRequestedOn(store: Pick<SettingsLike, 'getSetting'>): string | null {
  const v = store.getSetting(COPARENT_NOTIFY_KEY);
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

export function hasRequestedCoParentNotify(store: Pick<SettingsLike, 'getSetting'>): boolean {
  return coParentNotifyRequestedOn(store) !== null;
}

/** Idempotent: a second tap keeps the first day. */
export function requestCoParentNotify(store: SettingsLike, now: Date): string {
  const existing = coParentNotifyRequestedOn(store);
  if (existing) return existing;
  const day = now.toISOString().slice(0, 10);
  store.setSetting(COPARENT_NOTIFY_KEY, day);
  return day;
}
