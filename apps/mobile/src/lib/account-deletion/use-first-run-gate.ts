/**
 * useFirstRunGate(): what the root of the app shows when the phone lists no book (open-request.ts has the rule and the
 * reason). The first-run route (app/onboarding.tsx) asks it before it draws anything, so every way to the welcome
 * passes through it: a cold launch with no book, Tonight, the Book tab and the Family tab (each redirects there), and a
 * sign-in on another phone.
 *
 * The decisions are first-run-gate.logic.ts's (pure, tested in Node); this hook reads the inputs and acts on the answer.
 * test/account-deletion-gate-hook.test.ts runs the hook itself in Node (a small stand-in for React's hooks, see
 * test/helpers/mini-react.ts), so the effects, the timers and the order of things are tested too.
 *
 * Network: nothing at launch and nothing awaited. The local note is read at once (SQLite, synchronous). Only a signed-in
 * phone asks the server, in the background, whether a request is open (`deletion_requests`, the caller's own rows):
 *  - with no book, once per account that is signed in while this screen is up (a phone that signs in again, another
 *    phone of the same account);
 *  - with a book and an open request still noted, once per account per mount (a plain sync may have brought the book
 *    back after a cancel elsewhere, and the note must not go stale unseen). This is its own effect: it must run when the
 *    book arrives while the first read is already done.
 * An answer is written to the note and the screen follows it. If a book on this phone was just closed by the server, or
 * the note is past its date, and nothing is known yet, a moment of paper stands in for the welcome (at most CHECK_CAP_MS).
 *
 * What the server has said belongs to the account that was asked: `answer.for` is that account, and `checked` and
 * `confirmed` count only while the same account is signed in. A read for an earlier account that ends after a later
 * one was asked does not touch it (askServer's `latestAsked`).
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
import { clearDeadNote, phoneHasDeletedBook, recordBookBack, recordStatus } from './note-store';
import { noteExpiresAtMs, OPEN_REQUEST_KEY, parseOpenRequest, type OpenRequest, type PhoneScreen } from './open-request';

/** How long the paper stands in for the welcome while the server is asked. A slow or offline answer ends it. */
export const CHECK_CAP_MS = 3000;
/** The longest a timer is set for (setTimeout keeps its delay in 32 bits); a later expiry is re-read when the screen next renders. */
const MAX_TIMER_MS = 2 ** 31 - 1;

const subscribe = (onChange: () => void) => subscribeTo(['settings', 'children'], onChange);
const readRaw = (): string | null => getSetting(OPEN_REQUEST_KEY);
const readHasBook = (): boolean => listChildren().length > 0;

export type FirstRunGate = { screen: PhoneScreen; request: OpenRequest | null };

/** What the server has said since this screen opened, and for which account. */
export type Answer = { for: string | null; checked: boolean; confirmed: boolean };
const NO_ANSWER: Answer = { for: null, checked: false, confirmed: false };

/**
 * Asks the server whether a request is open, as `askedAs`. The answer is written to the note (recordStatus drops it if
 * another account has signed in meanwhile) whether or not the screen is still up: it is the server's word. A failed or
 * slow read changes nothing but `checked`, and `checked` is set however the write ends, so the paper never stays up.
 * What the screen is told is another matter: `latestAsked` is the account of the newest ask in this mount (set here, at
 * the start of each), and a read for any other account says nothing to the screen when it ends. Otherwise a read that
 * outlives its account would take the answer slot back from the account asked after it, and that account would wait on
 * paper for good (the with-book read has no cleanup at all).
 * Returns what to undo if the effect is torn down before the answer: the cap timer.
 */
function askServer(
  client: DeletionClient,
  askedAs: string,
  setAnswer: (update: (a: Answer) => Answer) => void,
  latestAsked: { current: string | null },
): () => void {
  latestAsked.current = askedAs;
  const say = (p: Partial<Answer>) => {
    if (latestAsked.current !== askedAs) return;
    setAnswer((a) => ({ ...(a.for === askedAs ? a : { for: askedAs, checked: false, confirmed: false }), ...p }));
  };
  const cap = setTimeout(() => say({ checked: true }), CHECK_CAP_MS);
  void loadStatus(client).then((s) => {
    clearTimeout(cap);
    try {
      if (s.ok) recordStatus(s.value, askedAs);
    } catch {
      // The write is best effort (a local database error): the note stays as it was.
    } finally {
      say({ checked: true, confirmed: s.ok && s.value.state !== 'none' });
    }
  });
  return () => clearTimeout(cap);
}

export function useFirstRunGate(): FirstRunGate {
  const auth = useAuth();
  const pathname = usePathname();
  const raw = useSyncExternalStore(subscribe, readRaw, readRaw);
  const hasBook = useSyncExternalStore(subscribe, readHasBook, readHasBook);
  const hasDeletedBook = useSyncExternalStore(subscribe, phoneHasDeletedBook, phoneHasDeletedBook);
  const note = useMemo(() => parseOpenRequest(raw), [raw]);
  const [answer, setAnswer] = useState<Answer>(NO_ANSWER);
  const [, tick] = useReducer((n: number) => n + 1, 0);
  const wasDeletion = useRef(false);
  /** The account for which the with-book read has run in this mount. */
  const refreshedFor = useRef<string | null>(null);
  /** The account of the newest read asked in this mount (either effect); the answer of an earlier account's read is dropped. */
  const latestAsked = useRef<string | null>(null);

  // The account signed in: the session's own user, known during checkingConsent too (currentAuthUserId() is null then).
  // It is also who a read is asked as, read at render time: the auth store's snapshot is published by the provider's
  // effect, which runs after this screen's, so on the first read of a sign-in it still holds the previous state.
  const userId = authUserId(auth.state);
  const checked = answer.for === userId && answer.checked;
  const confirmed = answer.for === userId && answer.confirmed;

  const gate: GateDecision = decideGate({
    hasBook, hasDeletedBook, note, nowMs: Date.now(), signedIn: auth.signedIn, userId, checked, confirmed,
    wasDeletion: wasDeletion.current, pathname,
  });
  wasDeletion.current = gate.wasDeletion;

  const client = auth.signedIn ? (auth.client as unknown as DeletionClient | null) : null;

  // Signed in, no book: ask the server whether a request is open. Again for another account.
  useEffect(() => {
    if (!client || hasBook || !userId) return;
    return askServer(client, userId, setAnswer, latestAsked);
  }, [client, hasBook, userId]);

  // Signed in, a book listed, an open request still noted: ask once. Not undone with the effect (a book arriving, the
  // note being rewritten): the answer is the server's word and is written either way.
  const refreshWithBook = gate.refreshWithBook;
  useEffect(() => {
    if (!client || !refreshWithBook || !userId || refreshedFor.current === userId) return;
    refreshedFor.current = userId;
    askServer(client, userId, setAnswer, latestAsked);
  }, [client, refreshWithBook, userId]);

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
