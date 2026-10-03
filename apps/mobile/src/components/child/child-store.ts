/**
 * Book/Family/Settings helpers on top of A's store (src/lib/store.ts, see src/lib/README.md).
 * Only typed preference accessors and authorship helpers live here; all data access is A's.
 */
import { currentUserId, getSetting, setSetting, type Child, type Entry } from '@/lib/store';

export type Appearance = 'system' | 'light' | 'dark';
export type ReadingSize = 'standard' | 'large' | 'largePrint';
export type ReminderCadence = 'off' | 'weekly' | 'fewTimes' | 'everyEvening';

/** Before sign-in every entry on this phone was written by this phone's user. */
export function isOwnEntry(e: Entry): boolean {
  const me = currentUserId();
  return !e.authorId || !me || e.authorId === me;
}

/** Signature frozen at save time, else this child's name for the current user. */
export function authorOf(e: Entry, child: Child): string {
  return e.authorSignsAs ?? child.signsAs;
}

export function getAppearance(): Appearance {
  const v = getSetting('appearance');
  return v === 'light' || v === 'dark' ? v : 'system';
}
export const setAppearance = (v: Appearance) => setSetting('appearance', v);

export function getReadingSize(): ReadingSize {
  const v = getSetting('readingSize');
  return v === 'large' || v === 'largePrint' ? v : 'standard';
}
export const setReadingSize = (v: ReadingSize) => setSetting('readingSize', v);

export function getReminderCadence(): ReminderCadence {
  const v = getSetting('reminders.cadence');
  return v === 'off' || v === 'weekly' || v === 'everyEvening' ? v : 'fewTimes';
}
export const setReminderCadence = (v: ReminderCadence) => setSetting('reminders.cadence', v);

export const getRemindersPaused = () => getSetting('reminders.paused') === 'on';
export const setRemindersPaused = (v: boolean) => setSetting('reminders.paused', v ? 'on' : 'off');
