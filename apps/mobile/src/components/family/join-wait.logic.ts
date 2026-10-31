/**
 * A joined book on its way to this phone, after the join sheet was closed before it arrived (EXPERIENCE_PASS_2026-10
 * S59; critics' pass S2). Pure so it is tested in Node (test/join-wait.test.ts); the welcome reads it through
 * components/family/join-wait.tsx.
 *
 * On a fresh install the join sheet sits over first run's welcome, so Close before the book arrives shows the
 * welcome. While the book is on its way the welcome says so in one line and hides "Begin the book", so the person
 * does not start a second book of their own by mistake. There is no dead end: if the book has not come within
 * JOIN_WAIT_MS, or sync cannot bring it (not running on this phone, or unable to reach the server), the welcome says
 * it has not reached this phone yet, offers Try again (a sync) while sync can run, and brings "Begin the book" back.
 * Once the book is here the welcome hands over to the Book (welcome-handoff.logic.ts). Only the book's id, the
 * child's name for the line and the time are held, in memory: a relaunch starts without it.
 *
 * The join sheet starts the wait as soon as the join succeeds (app/invite/index.tsx accept), and only over the
 * welcome step, so a Close while joining, or a name that could not be read, still leaves it. It ends when the book
 * is here, when the welcome is no longer the step showing (first run went on or left), or at sign-out.
 */
import { familyCopy } from '@scribe/content';
import { renderTemplate } from '@scribe/core';
import type { SyncPhase } from '@/lib/sync/types';

export interface JoinWait {
  childId: string;
  /** The child's name, for the line, once it is known; without it the line says "The book". */
  name: string | null;
  /** When the wait started, or was retried (epoch ms). */
  since: number;
}

/** How long the welcome waits quietly before it offers Try again and "Begin the book" again. */
export const JOIN_WAIT_MS = 30_000;

/** Sync phases in which the book cannot come down until something changes. */
const STALLED: ReadonlySet<SyncPhase> = new Set<SyncPhase>(['offline', 'auth', 'account_mismatch', 'paused_server', 'paused_consent']);

export interface WelcomeJoinView {
  /** The line under the welcome, or none. */
  line: string | null;
  /** "Begin the book" shows. */
  begin: boolean;
  /** Try again shows. */
  retry: boolean;
}

const NO_WAIT: WelcomeJoinView = { line: null, begin: true, retry: false };

/** The welcome's line: on its way, or not here yet; with the child's name when it is known. */
export function joinWaitLine(name: string | null, state: 'waiting' | 'notYet'): string {
  const a = familyCopy.accept;
  if (!name) return state === 'waiting' ? a.joinedWaitingUnknown : a.joinedNotYetUnknown;
  return renderTemplate(state === 'waiting' ? a.joinedWaiting : a.joinedNotYet, { child: name });
}

export function welcomeJoinView(i: {
  wait: JoinWait | null;
  /** First run's welcome is the step showing (under a sheet or not). */
  onWelcome: boolean;
  bookHere: boolean;
  /**
   * Sync can run on this phone (lib/auth/auth-store.ts syncAllowed: signed in, consent complete, no claim waiting).
   * Without it getSyncStatus() reads "idle" and syncNow() does nothing, so nothing can bring the book.
   */
  syncOn: boolean;
  phase: SyncPhase | null;
  now: number;
}): WelcomeJoinView {
  if (!i.wait || !i.onWelcome || i.bookHere) return NO_WAIT;
  const stalled = !i.syncOn || (i.phase !== null && STALLED.has(i.phase)) || i.now - i.wait.since >= JOIN_WAIT_MS;
  return stalled
    ? { line: joinWaitLine(i.wait.name, 'notYet'), begin: true, retry: i.syncOn }
    : { line: joinWaitLine(i.wait.name, 'waiting'), begin: false, retry: false };
}

/** The wait is over: the book is here, the welcome is no longer the step showing, or the account signed out. */
export function joinWaitEnds(i: { onWelcome: boolean; signedIn: boolean; bookHere: boolean }): boolean {
  return i.bookHere || !i.onWelcome || !i.signedIn;
}

/** Try again starts the quiet wait over only when a sync ran: syncNow() resolves null when sync is not running. */
export function retryRestartsWait(report: unknown): boolean {
  return report !== null && report !== undefined;
}

/** The wait the join sheet leaves for the welcome. One at a time; a newer join replaces it. */
export function createJoinWaitStore() {
  let wait: JoinWait | null = null;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  return {
    get: (): JoinWait | null => wait,
    /** The join went through and the book is not on this phone yet. The same book again keeps its time. */
    start(childId: string, name: string | null, now: number = Date.now()): void {
      if (wait && wait.childId === childId) return;
      wait = { childId, name, since: now };
      emit();
    },
    /** The child's name, read after the join: given to this book's wait only, and never starts one. */
    named(childId: string, name: string | null): void {
      if (!wait || wait.childId !== childId || !name || wait.name === name) return;
      wait = { ...wait, name };
      emit();
    },
    /** Try again: the quiet wait starts over. */
    restart(now: number = Date.now()): void {
      if (!wait) return;
      wait = { ...wait, since: now };
      emit();
    },
    clear(): void {
      if (!wait) return;
      wait = null;
      emit();
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const joinWait = createJoinWaitStore();
