/**
 * useFirstRunGate(): what the root of the app shows when the phone lists no book (open-request.ts has the rule and the
 * reason). The first-run route (app/onboarding.tsx) asks it before it draws anything, so every way to the welcome
 * passes through it: a cold launch with no book, Tonight, the Book tab and the Family tab (each redirects there), and a
 * sign-in on another phone.
 *
 * The decisions are first-run-gate.logic.ts's (pure, tested in Node); this hook reads the inputs and acts on the answer.
 *
 * Network: nothing at launch and nothing awaited. The local note is read at once (SQLite, synchronous). Only a signed-in
 * phone asks the server, in the background, whether a request is open (`deletion_requests`, the caller's own rows), and
 * only once per mount: with no book, or with a book while an open request is still noted (so a note whose request was
 * cancelled elsewhere does not go stale unseen). An answer is written to the note and the screen follows it. If a book
 * on this phone was just closed by the server, or the note is past its date, and nothing is known yet, a moment of paper
 * stands in for the welcome (at most CHECK_CAP_MS).
 *
 * Writes happen in effects, never in render: the stale note is removed there, and a timer re-reads the clock when a
 * cancelled wait (CANCELLED_WAIT_MS) or an open note's grace (NOTE_GRACE_MS) runs out, so the screen does not wait for
 * the next change to the store.
 */
import { router, usePathname } from 'expo-router';
import { useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from 'react';
import { authUserId } from '@/lib/auth/machine.logic';
import { useAuth } from '@/lib/auth/session-provider';
import { getSetting, listChildren, subscribeTo } from '@/lib/store';
import { loadStatus, type DeletionClient } from './api';
import { decideGate, type GateDecision } from './first-run-gate.logic';
import { clearDeadNote, phoneHasDeletedBook, recordBookBack, recordStatus, signedInUserId } from './note-store';
import { noteExpiresAtMs, OPEN_REQUEST_KEY, parseOpenRequest, type OpenRequest, type PhoneScreen } from './open-request';

/** How long the paper stands in for the welcome while the server is asked. A slow or offline answer ends it. */
export const CHECK_CAP_MS = 3000;
/** The longest a timer is set for (setTimeout keeps its delay in 32 bits); a later expiry is re-read when the screen next renders. */
const MAX_TIMER_MS = 2 ** 31 - 1;

const subscribe = (onChange: () => void) => subscribeTo(['settings', 'children'], onChange);
const readRaw = (): string | null => getSetting(OPEN_REQUEST_KEY);
const readHasBook = (): boolean => listChildren().length > 0;

export type FirstRunGate = { screen: PhoneScreen; request: OpenRequest | null };

export function useFirstRunGate(): FirstRunGate {
  const auth = useAuth();
  const pathname = usePathname();
  const raw = useSyncExternalStore(subscribe, readRaw, readRaw);
  const hasBook = useSyncExternalStore(subscribe, readHasBook, readHasBook);
  const hasDeletedBook = useSyncExternalStore(subscribe, phoneHasDeletedBook, phoneHasDeletedBook);
  const note = useMemo(() => parseOpenRequest(raw), [raw]);
  const [checked, setChecked] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [, tick] = useReducer((n: number) => n + 1, 0);
  const wasDeletion = useRef(false);

  // The account signed in: the session's own user, known during checkingConsent too (currentAuthUserId() is null then).
  const userId = authUserId(auth.state);

  const gate: GateDecision = decideGate({
    hasBook, hasDeletedBook, note, nowMs: Date.now(), signedIn: auth.signedIn, userId, checked, confirmed,
    wasDeletion: wasDeletion.current, pathname,
  });
  if (gate.deletionShown) wasDeletion.current = true;

  // Signed in: ask the server once whether a request is open. With no book (a phone that signs in again, another phone
  // of the same account), or with a book and an open request noted (a plain sync may have brought the book back after
  // a cancel elsewhere). A failed or slow read changes nothing but `checked`. The answer is written whether or not this
  // screen is still up: it is the server's word, and recordStatus drops it if another account has signed in meanwhile.
  const client = auth.signedIn ? (auth.client as unknown as DeletionClient | null) : null;
  const wantRead = !hasBook || gate.refreshWithBook;
  useEffect(() => {
    if (!client || !wantRead) return;
    const askedAs = signedInUserId();
    let live = true;
    const cap = setTimeout(() => live && setChecked(true), CHECK_CAP_MS);
    void loadStatus(client).then((s) => {
      clearTimeout(cap);
      if (s.ok) recordStatus(s.value, askedAs);
      if (!live) return;
      if (s.ok && s.value.state !== 'none') setConfirmed(true);
      setChecked(true);
    });
    return () => {
      live = false;
      clearTimeout(cap);
    };
  }, [client, wantRead]);

  // The book is back: a cancelled wait is over.
  useEffect(() => {
    if (hasBook && note?.state === 'cancelled') recordBookBack();
  }, [hasBook, note]);

  // A note the phone no longer counts (another account's, a run-out wait, a date long past that the server did not
  // confirm) is removed here, not in render.
  const clear = gate.clear;
  useEffect(() => {
    if (clear) clearDeadNote(raw);
  }, [clear, raw]);

  // Re-read the clock when the note stops counting by itself (nothing else would re-render the screen then).
  const expiresAt = noteExpiresAtMs(note);
  useEffect(() => {
    if (expiresAt === null) return;
    const delay = expiresAt + 1 - Date.now();
    if (delay <= 0) return;
    const id = setTimeout(tick, Math.min(delay, MAX_TIMER_MS));
    return () => clearTimeout(id);
  }, [expiresAt]);

  // The deletion screen was up and the book has come back: to the Book, but only while the welcome, or the sign-in sheet
  // over it, is in front. The invite and join sheet waits for Open or Close, as it does over the welcome (S59, P8b).
  const leave = gate.leave;
  useEffect(() => {
    if (leave) router.replace('/book');
  }, [leave]);

  return { screen: gate.screen, request: gate.request };
}
