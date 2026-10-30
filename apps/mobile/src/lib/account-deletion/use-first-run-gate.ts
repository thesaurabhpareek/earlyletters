/**
 * useFirstRunGate(): what the root of the app shows when the phone lists no book (open-request.ts has the rule and the
 * reason). The first-run route (app/onboarding.tsx) asks it before it draws anything, so every way to the welcome
 * passes through it: a cold launch with no book, Tonight, the Book tab and the Family tab (each redirects there), and a
 * sign-in on another phone.
 *
 * Network: nothing at launch and nothing awaited. The local note is read at once (SQLite, synchronous). Only a signed-in
 * phone with no book asks the server once, in the background, whether a request is open (`deletion_requests`, the
 * caller's own rows); an answer is written to the note and the screen follows it. If a book on this phone was just
 * closed by the server and nothing is known yet, a moment of paper stands in for the welcome (at most CHECK_CAP_MS).
 */
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useAuth } from '@/lib/auth/session-provider';
import { getSetting, listChildren, localSqlDb, subscribeTo } from '@/lib/store';
import { loadStatus, type DeletionClient } from './api';
import { recordBookBack, recordStatus } from './note-store';
import { chooseScreen, OPEN_REQUEST_KEY, parseOpenRequest, type OpenRequest, type PhoneScreen } from './open-request';

/** How long the paper stands in for the welcome while the server is asked. A slow or offline answer ends it. */
export const CHECK_CAP_MS = 3000;

const subscribe = (onChange: () => void) => subscribeTo(['settings', 'children'], onChange);
const readRaw = (): string | null => getSetting(OPEN_REQUEST_KEY);
const readHasBook = (): boolean => listChildren().length > 0;
const readHasDeletedBook = (): boolean => localSqlDb().get<{ x: number }>("SELECT 1 AS x FROM children WHERE server_state = 'deleted' LIMIT 1") !== null;

export type FirstRunGate = { screen: PhoneScreen; request: OpenRequest | null };

export function useFirstRunGate(): FirstRunGate {
  const auth = useAuth();
  const raw = useSyncExternalStore(subscribe, readRaw, readRaw);
  const hasBook = useSyncExternalStore(subscribe, readHasBook, readHasBook);
  const hasDeletedBook = useSyncExternalStore(subscribe, readHasDeletedBook, readHasDeletedBook);
  const note = useMemo(() => parseOpenRequest(raw), [raw]);
  const [checked, setChecked] = useState(false);
  const wasDeletion = useRef(false);

  // Signed in, no book: ask the server once whether a request is open. A phone that signs in again, and another phone
  // of the same account, find it here. A failed or slow read changes nothing.
  const client = auth.signedIn ? (auth.client as unknown as DeletionClient | null) : null;
  useEffect(() => {
    if (!client || hasBook) return;
    let live = true;
    const cap = setTimeout(() => live && setChecked(true), CHECK_CAP_MS);
    void loadStatus(client).then((s) => {
      if (!live) return;
      if (s.ok) recordStatus(s.value);
      setChecked(true);
    });
    return () => {
      live = false;
      clearTimeout(cap);
    };
  }, [client, hasBook]);

  // The book is back: a cancelled wait is over.
  useEffect(() => {
    if (hasBook && note?.state === 'cancelled') recordBookBack();
  }, [hasBook, note]);

  const screen = chooseScreen({ hasBook, note, nowMs: Date.now(), signedIn: auth.signedIn, hasDeletedBook, checked });
  if (screen === 'deletion') wasDeletion.current = true;
  // The deletion screen was up and the book has come back: the screen stays until the route has gone to the Book, so
  // the welcome is not drawn for a frame in between.
  const leaving = screen === 'app' && wasDeletion.current;
  useEffect(() => {
    if (leaving) router.replace('/book');
  }, [leaving]);

  if (leaving) return { screen: 'deletion', request: { state: 'cancelled', at: new Date().toISOString() } };
  return { screen, request: screen === 'deletion' ? note : null };
}
