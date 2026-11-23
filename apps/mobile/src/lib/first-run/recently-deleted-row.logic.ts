/**
 * BL-776 (CPO-10 option a): first run's first screen shows the existing Recently deleted row while a deleted book
 * waits, so a person whose only book was deleted can reach Restore after a cold start. Pure; the screen reads the count.
 */
export const RECENTLY_DELETED_HREF = '/settings/recently-deleted';

/** Only on the welcome, and only while at least one deleted book waits (none deleted, erased now or past day 30: no row). */
export function recentlyDeletedRowShown(input: { step: string; deletedBookCount: number }): boolean {
  return input.step === 'welcome' && input.deletedBookCount > 0;
}
