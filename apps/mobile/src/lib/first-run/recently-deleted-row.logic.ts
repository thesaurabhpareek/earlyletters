/**
 * BL-776 (CPO-10 option a): first run's first screen shows the existing Recently deleted row while a deleted book
 * waits, so a person whose only book was deleted can reach Restore after a cold start. Pure; the screen reads the count.
 */
export const RECENTLY_DELETED_HREF = '/settings/recently-deleted';

/**
 * Only on the welcome, while a deleted book (BL-776) or a deleted letter waits (CPrivO-56: the sole parent after the
 * purge, whose only book the pull closed, has no deleted book, only its letters). Nothing waiting: no row.
 */
export function recentlyDeletedRowShown(input: { step: string; deletedBookCount: number; deletedLetterCount: number }): boolean {
  return input.step === 'welcome' && (input.deletedBookCount > 0 || input.deletedLetterCount > 0);
}
