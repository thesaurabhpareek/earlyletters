/**
 * A joined book on its way to this phone, after the join sheet was closed before it arrived (EXPERIENCE_PASS_2026-10
 * S59; critics' pass S2). Pure so it is tested in Node (test/join-wait.test.ts); the welcome reads it through
 * components/family/join-wait.tsx.
 *
 * On a fresh install the join sheet sits over first run's welcome, so Close before the book arrives shows the
 * welcome. While the book is on its way the welcome says so in one line and hides "Begin the book", so the person
 * does not start a second book of their own by mistake. There is no dead end: if the book has not come within
 * JOIN_WAIT_MS, or sync cannot reach the server, the welcome says it has not reached this phone yet, offers Try
 * again (a sync), and brings "Begin the book" back. Once the book is here the welcome hands over to the Book
 * (welcome-handoff.logic.ts). Only the book's id, the child's name for the line and the time are held, in memory.
 */
import { familyCopy } from '@scribe/content';
import { renderTemplate } from '@scribe/core';
import type { SyncPhase } from '@/lib/sync/types';

export interface JoinWait {
  childId: string;
  /** The child's name, for the line; the join sheet's own. */
  name: string;
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

export function welcomeJoinView(i: { wait: JoinWait | null; bookHere: boolean; phase: SyncPhase | null; now: number }): WelcomeJoinView {
  if (!i.wait || i.bookHere) return { line: null, begin: true, retry: false };
  const stalled = (i.phase !== null && STALLED.has(i.phase)) || i.now - i.wait.since >= JOIN_WAIT_MS;
  const a = familyCopy.accept;
  return stalled
    ? { line: renderTemplate(a.joinedNotYet, { child: i.wait.name }), begin: true, retry: true }
    : { line: renderTemplate(a.joinedWaiting, { child: i.wait.name }), begin: false, retry: false };
}

/** The wait the join sheet leaves for the welcome. One at a time; a newer join replaces it. */
export function createJoinWaitStore() {
  let wait: JoinWait | null = null;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  return {
    get: (): JoinWait | null => wait,
    /** The joined view while the book is not on this phone yet. A name is needed for the line; without one, nothing. */
    start(childId: string, name: string | null, now: number = Date.now()): void {
      if (!name) return;
      if (wait && wait.childId === childId && wait.name === name) return;
      wait = { childId, name, since: now };
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
