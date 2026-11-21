/**
 * The days store's public surface (NS-47-R11; ADR 0032 items 3 and 7). Foundation only: read, and the clear order.
 * Ticking, the write queue, `subscribeDays`, the owner key and the claim step are the next PRs.
 * Clear order (item 3): the file goes FIRST and synchronously, before `forgetReminders` and any await.
 */
import { type DaysPort, type DaysRead, expoDaysPort, readDays, removeDays, sweepDaysTemp } from './store-file';

let real: DaysPort | null = null,
  swept = false;
const port = (): DaysPort | null => (real ??= expoDaysPort());

/** The days of `owner` ('local' or an owner key); a file of anyone else reads as empty (fail closed). */
export function loadDays(owner: string): DaysRead {
  try {
    const p = port();
    if (p && !swept) sweepDaysTemp(p), (swept = true);
    return p ? readDays(p, owner) : { state: 'unavailable' };
  } catch {
    return { state: 'unavailable' };
  }
}

function clearFile(): boolean {
  try {
    const p = port();
    return p ? removeDays(p) : true;
  } catch {
    return false;
  }
}
/** Sign-out on any path, or another account signing in (NS-47-R15). Synchronous, never throws. */
export const endDaysSession = (): boolean => clearFile();

/** CODE-R15: callers branch on `code`, never on the message. */
export class DaysStoreError extends Error {
  readonly code = 'days_file_not_removed';
  constructor() {
    super('days_file_not_removed');
    this.name = 'DaysStoreError';
  }
}

/** Erase everything (NS-47-R16). Throws a DaysStoreError when the file stays, so the erase mark stays and the next launch retries. */
export function eraseDaysFile(): void {
  if (!clearFile()) throw new DaysStoreError();
}
