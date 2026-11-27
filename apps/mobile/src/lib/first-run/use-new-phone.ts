/**
 * The clock and the one question for "Opening your book" (NX-36-S17 Tier 0; new-phone.logic.ts decides). A phone with a
 * ready, sync-on session and no book asks `readAccountBooks` (bounded at 10 s, fail-safe to `unknown`) EVERY time the
 * route mounts or is retried (Try again keeps the 10 second clock running; a lost answer is re-asked once inside it, BL-978a
 * R11), and again, on a new clock, after an invite is joined on this phone (BL-2159, `accountJoined`). It never stores the
 * answer, so a kill and relaunch asks again and nothing goes stale.
 * It reads the sync engine's status (phase, lastSyncedAt) and the connection. It sends only the signed-in session, and
 * records nothing: no analytics event, no storage.
 *
 * Latch: a phone that mounts this with no book keeps holding after the first page lands, until the first pull cycle is
 * done or 10 s have passed. A phone that mounts with a book (every ordinary launch) never asks.
 *
 * With `enabled` false (the server switch off, no sign-in settings, no ready sync-on session) nothing here runs: no
 * question, no sync read or subscription, no timer. The route is then exactly what it was before S17.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getSyncStatus, subscribeSyncStatus, syncNow } from '@/lib/sync';
import type { SyncStatus } from '@/lib/sync/types';
import type { AccountKind } from './account-books.logic';
import { readAccountBooks } from './account-books';
import { accountJoined, joinHandsOver, OPENING_WAIT_MS, openingView, retriesOnReconnect, type OpeningView } from './new-phone.logic';

export interface NewPhone {
  /** null: not applicable (no account question to ask, or a book joined on this phone is here), the route behaves as before. */
  view: OpeningView | null;
  /** Ask again and nudge the pull (Try again, and the connection returning). */
  retry: () => void;
  /** "Start a book" on the No book here yet screen: the person chose to begin one. */
  startBook: () => void;
  /** The account has said it holds a book: only then may the loading screen say the letters are coming across. */
  hasBook: boolean;
}

/** When this wait began and what `lastSyncedAt` was then; null until the question has been asked. */
interface Wait {
  began: number;
  baseline: string | null;
}

export function useNewPhone(o: { enabled: boolean; client: SupabaseClient | null; hasLocalBook: boolean; online: boolean }): NewPhone {
  // Latched at the first render: only a phone that began with no book is waiting for one.
  const waiting = useRef(!o.hasLocalBook);
  const active = o.enabled && waiting.current && !!o.client;
  const [kind, setKind] = useState<AccountKind | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [wait, setWait] = useState<Wait | null>(null);
  // R11: when the first question of this wait went out. Kept across Try again and the one automatic re-ask, so the 10 seconds
  // are never restarted; only the baseline is refreshed. Cleared when nothing is being asked.
  const began = useRef<number | null>(null);
  const reasked = useRef(false);
  // BL-2159 follow-up: an invite was joined on this phone while this was asking. Cleared when nothing is being asked.
  const joinedHere = useRef(false);
  const onlineNow = useRef(o.online);
  onlineNow.current = o.online;
  // The engine's status, read and followed only while active.
  const [sync, setSync] = useState<SyncStatus | null>(null);
  const [, tick] = useState(0);

  useEffect(() => {
    if (!active) return;
    setSync(getSyncStatus());
    return subscribeSyncStatus(setSync);
  }, [active]);

  // Nothing is being asked: the next wait starts its own clock.
  useEffect(() => {
    if (active) return;
    began.current = null;
    reasked.current = false;
    joinedHere.current = false;
  }, [active]);

  useEffect(() => {
    if (!active || !o.client) return;
    began.current ??= Date.now();
    const start = began.current;
    setWait({ began: start, baseline: getSyncStatus().lastSyncedAt });
    setKind(null);
    let alive = true;
    void readAccountBooks(o.client).then((k) => {
      if (!alive) return;
      setKind(k);
      // R11: one automatic re-ask of a lost answer, inside the same window (never a second clock).
      if (k === 'unknown' && onlineNow.current && !reasked.current && Date.now() - start < OPENING_WAIT_MS) {
        reasked.current = true;
        setAttempt((n) => n + 1);
      }
    });
    void syncNow();
    const t = setTimeout(() => tick((n) => n + 1), Math.max(0, start + OPENING_WAIT_MS - Date.now()) + 50);
    return () => {
      alive = false;
      clearTimeout(t);
    };
    // One question per attempt. The client is stable for a session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, attempt]);

  // The connection returns: ask again by itself (the S3 rule), while the answer may still change.
  const wasOnline = useRef(o.online);
  useEffect(() => {
    if (o.online && !wasOnline.current && active && retriesOnReconnect(kind)) setAttempt((n) => n + 1);
    wasOnline.current = o.online;
  }, [o.online, active, kind]);

  // BL-2159: a join on this phone makes the earlier answer wrong ("no book" from before the accept), so ask again. Unlike Try
  // again this starts a new 10 second window: the joined book exists only from the accept on, and keeping the first
  // question's clock would show "taking a while" at once to anyone who read the invite for more than 10 seconds.
  useEffect(() => {
    if (!active) return;
    return accountJoined.subscribe(() => {
      joinedHere.current = true;
      began.current = null;
      reasked.current = false;
      setAttempt((n) => n + 1);
    });
  }, [active]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const startBook = useCallback(() => setKind('new'), []);

  const hasBook = active && kind === 'hasBook';
  if (!active) return { view: null, retry, startBook, hasBook };
  // The first active render: the question goes out in the effect that follows, so this frame is the loading screen.
  if (!wait) return { view: 'opening', retry, startBook, hasBook };
  // A book joined on this phone is here: the join sheet and first run's welcome hand over to the Book (5.8 row 12), so the
  // route stands aside as it did before the re-ask. Leaving for Tonight here would replace the join sheet under the person.
  if (joinHandsOver(joinedHere.current, o.hasLocalBook)) return { view: null, retry, startBook, hasBook };
  const s = sync ?? getSyncStatus();
  const view = openingView({
    kind,
    hasLocalBook: o.hasLocalBook,
    online: o.online,
    syncPhase: s.phase,
    lastSyncedAt: s.lastSyncedAt,
    lastSyncedAtAtStart: wait.baseline,
    elapsedMs: Date.now() - wait.began,
  });
  return { view, retry, startBook, hasBook };
}
