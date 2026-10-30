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

/** How long "Trying again" shows before the open runs. The open itself takes a few milliseconds, so without a beat the busy words would never be seen. */
export const RETRY_BEAT_MS = 500;

/**
 * What the recovery screen shows about Try again (S51). The hook's status is 'recovery' before a tap and 'recovery'
 * after a tap that failed, so the status alone cannot say a tap was answered: the screen keeps this view as well.
 */
export interface RetryView {
  /** The button is working: its words say "Trying again" and it ignores taps. */
  trying: boolean;
  /** The line under the hint after an open that did not work. */
  stillClosed: boolean;
  /**
   * Which failed open this is. Never shown to anyone and never put in a sentence. It makes the second failure a
   * different state from the first, and keys the line, so a screen reader announces it on every tap, not only the first.
   */
  round: number;
}

export const RETRY_START: RetryView = { trying: false, stillClosed: false, round: 0 };

/** The tap: the button turns busy at once and the last answer goes, so the next one is a new line. */
export function retryTapped(view: RetryView): RetryView {
  return { trying: true, stillClosed: false, round: view.round };
}

/** The open ran. Worked: nothing to say, the app takes over. Did not work: the line, under a new round. */
export function retryResult(view: RetryView, status: LaunchStatus): RetryView {
  return status === 'ok' ? { trying: false, stillClosed: false, round: view.round } : { trying: false, stillClosed: true, round: view.round + 1 };
}

/** Another result (the export's) takes the line's place. The round stays, so the next failure is still a new one. */
export function retryLineTaken(view: RetryView): RetryView {
  return { ...view, stillClosed: false };
}
