/**
 * What launch does with the result of opening the local database (store.ts `openStore`).
 * Pure: no React Native. Only codes are ever kept; SQLite's own text can quote values.
 */
import type { OpenStoreResult } from '../store';

export type LaunchStatus = 'ok' | 'recovery';

/**
 * - Opened and migrated: the app.
 * - Open or migration threw (rolled back, file untouched): the recovery screen.
 * - A file from a newer build (`newer`) keeps today's behaviour: it stays open and the app runs,
 *   until the "update the app" screen exists (MOB-09). It is never treated as damage.
 */
export function launchStatus(result: Pick<OpenStoreResult, 'ok' | 'newer' | 'error'>): LaunchStatus {
  if (result.error) return 'recovery';
  return 'ok';
}

/** Runs `open`; anything it throws counts as a failed launch. Never throws, never keeps the message. */
export function attemptOpen(open: () => Pick<OpenStoreResult, 'ok' | 'newer' | 'error'>): LaunchStatus {
  try {
    return launchStatus(open());
  } catch {
    return 'recovery';
  }
}
