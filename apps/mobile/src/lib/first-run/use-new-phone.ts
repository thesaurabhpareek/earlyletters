/**
 * The clock and the one question for "Opening your book" (NX-36-S17 Tier 0; new-phone.logic.ts decides). A phone with a
 * ready, sync-on session and no book asks `readAccountBooks` (bounded at 10 s, fail-safe to `unknown`) EVERY time the
 * route mounts or is retried, and never stores the answer, so a kill and relaunch asks again and nothing goes stale.
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
import { OPENING_WAIT_MS, openingView, retriesOnReconnect, type OpeningView } from './new-phone.logic';

export interface NewPhone {
  /** null: not applicable (no account question to ask), the route behaves as before. */
  view: OpeningView | null;
  /** Ask again and nudge the pull (Try again, and the connection returning). */
  retry: () => void;
  /** "Start a book" on the No book here yet screen: the person chose to begin one. */
  startBook: () => void;
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
  // The engine's status, read and followed only while active.
  const [sync, setSync] = useState<SyncStatus | null>(null);
  const [, tick] = useState(0);

  useEffect(() => {
    if (!active) return;
    setSync(getSyncStatus());
    return subscribeSyncStatus(setSync);
  }, [active]);

  useEffect(() => {
    if (!active || !o.client) return;
    setWait({ began: Date.now(), baseline: getSyncStatus().lastSyncedAt });
    setKind(null);
    let alive = true;
    void readAccountBooks(o.client).then((k) => alive && setKind(k));
    void syncNow();
    const t = setTimeout(() => tick((n) => n + 1), OPENING_WAIT_MS + 50);
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

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const startBook = useCallback(() => setKind('new'), []);

  if (!active) return { view: null, retry, startBook };
  // The first active render: the question goes out in the effect that follows, so this frame is the loading screen.
  if (!wait) return { view: 'opening', retry, startBook };
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
  return { view, retry, startBook };
}
