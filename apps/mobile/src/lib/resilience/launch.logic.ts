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

/**
 * What the launch hook does with an open: run it, set the status to what it found (so 'ok' is what lets the app take
 * over, and 'recovery' is what puts the recovery screen up), and hand the answer back to the caller (Try again uses it).
 * Never throws. Every result is set, the good one as much as the bad one.
 */
export function openForLaunch(open: () => Pick<OpenStoreResult, 'ok' | 'newer' | 'error'>, setStatus: (status: LaunchStatus) => void): LaunchStatus {
  const found = attemptOpen(open);
  setStatus(found);
  return found;
}

/** How long "Trying again" shows before the open runs. The open itself takes a few milliseconds, so without a beat the busy words would never be seen. */
export const RETRY_BEAT_MS = 500;

/**
 * What the one line under the hint says. There is one slot, not one per button: the newest answer takes it, so an
 * older answer (the book did not open, or an export's result) can never sit in front of a newer one.
 */
export type RecoveryLine = 'none' | 'stillClosed' | 'exportNothing' | 'exportFailed';

/** What Export what is readable came back with: the outcomes of recovery-export.ts `RecoveryExportOutcome` (tsc fails at the screen if that file returns one that is not listed here). */
export type ExportOutcome = 'shared' | 'nothing' | 'failed';

/**
 * What the recovery screen shows about its two buttons (S51). The hook's status is 'recovery' before a tap and 'recovery'
 * after a tap that failed, so the status alone cannot say a tap was answered: the screen keeps this view as well.
 */
export interface RecoveryView {
  /** Try again is working: its words say "Trying again" and it ignores taps. */
  trying: boolean;
  /** Export is working: its words say so and it ignores taps. */
  exporting: boolean;
  /** The line under the hint: the newest answer from either button. */
  line: RecoveryLine;
  /**
   * Which failed open this is. Never shown to anyone and never put in a sentence. It makes the second failure a
   * different state from the first, and keys the line, so a screen reader announces it on every tap, not only the first.
   */
  round: number;
}

export const RECOVERY_START: RecoveryView = { trying: false, exporting: false, line: 'none', round: 0 };

/** Try again was tapped: the button turns busy at once and the last answer goes, so the next one is a new line. */
export function retryTapped(view: RecoveryView): RecoveryView {
  return { ...view, trying: true, line: 'none' };
}

/** The open ran. Worked: nothing to say, the app takes over. Did not work: the line, under a new round. It replaces whatever the export said meanwhile. */
export function retryResult(view: RecoveryView, status: LaunchStatus): RecoveryView {
  return status === 'ok' ? { ...view, trying: false, line: 'none' } : { ...view, trying: false, line: 'stillClosed', round: view.round + 1 };
}

/** Export was tapped: the button turns busy and the last answer goes. The round stays, so the next failed open is still a new one. */
export function exportTapped(view: RecoveryView): RecoveryView {
  return { ...view, exporting: true, line: 'none' };
}

/** The export ended. Its result (or none, when it went to the share sheet) replaces the line, even an "it did not open" that arrived while it worked. */
export function exportResult(view: RecoveryView, outcome: ExportOutcome): RecoveryView {
  const line: RecoveryLine = outcome === 'nothing' ? 'exportNothing' : outcome === 'failed' ? 'exportFailed' : 'none';
  return { ...view, exporting: false, line };
}

/** What the recovery screen needs from outside, so its sequencing runs the same in a test as on a phone. */
export interface RecoveryDeps {
  /** Waits that long (setTimeout on a phone). */
  wait: (ms: number) => Promise<void>;
  /** Opens the store again and says what it found (the hook's `retry`). */
  open: () => LaunchStatus;
  /** Runs Export what is readable. */
  runExport: () => Promise<ExportOutcome>;
  /** False once the screen has gone: nothing is drawn after that. */
  isLive: () => boolean;
  /** Applies one pure step to the screen's view. */
  update: (step: (view: RecoveryView) => RecoveryView) => void;
}

/**
 * The two taps of the recovery screen, in order. A tap on a button that is already working is ignored (two taps inside
 * one frame arrive before the busy state is drawn, so the button's own `disabled` is not enough). Nothing here throws:
 * an open or an export that throws is a failed one, and the button is never left busy.
 */
export function createRecoveryActions(deps: RecoveryDeps): { tryAgain: () => Promise<void>; exportReadable: () => Promise<void> } {
  let retrying = false;
  let exporting = false;

  const tryAgain = async (): Promise<void> => {
    if (retrying) return;
    retrying = true;
    try {
      deps.update(retryTapped);
      await deps.wait(RETRY_BEAT_MS);
      if (!deps.isLive()) return;
      let found: LaunchStatus;
      try {
        found = deps.open(); // 'ok' lets the app take over, and this screen goes
      } catch {
        found = 'recovery';
      }
      if (!deps.isLive()) return;
      deps.update((view) => retryResult(view, found));
    } finally {
      retrying = false;
    }
  };

  const exportReadable = async (): Promise<void> => {
    if (exporting) return;
    exporting = true;
    try {
      deps.update(exportTapped);
      let outcome: ExportOutcome;
      try {
        outcome = await deps.runExport();
      } catch {
        outcome = 'failed';
      }
      if (!deps.isLive()) return;
      deps.update((view) => exportResult(view, outcome));
    } finally {
      exporting = false;
    }
  };

  return { tryAgain, exportReadable };
}
