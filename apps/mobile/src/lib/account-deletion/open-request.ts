/**
 * The open deletion request, as this phone remembers it, and the choice it makes (coordinator D-117; critics' pass
 * 30 Oct 2026, M1). Pure (no React Native): test/account-deletion-gate.test.ts runs it in Node.
 *
 * Why it exists. A request for a sole parent's account tombstones her book on the server with the rest of her letters.
 * The next pull then returns that book as gone ("deleted"), the phone stops listing it, and with no listed book the app
 * showed the first-run welcome: no Settings, no Delete account, no "Cancel deletion", although the scheduled page, the
 * toast and the server's email all say she can cancel. A co-parent's book is not tombstoned (the book stays with the
 * other parent), so only a sole parent met it.
 *
 * The rule. While a request is open and the phone lists no book, the app shows the deletion screen (one title, the
 * date, "Cancel deletion", a way to sign out) in place of the welcome, from every way in: a launch, Tonight, the Book
 * and Family tabs, and a sign-in on another phone. The welcome, and its "Begin the book", are never offered then: a
 * book made over an open request would be listed, and Settings would be reachable by accident.
 *
 * The note is a short value in the device settings (the local database): the state of the request and, while it is
 * open, its id and date, all from the server's own answers. It holds no letter, no name and nothing about a child. It is
 * written when a request is made and when the Delete account page or the deletion screen reads the open request from
 * the server (`deletion_requests`, own rows by RLS), cleared when a read finds none or a cancel goes through, and never
 * sent anywhere.
 */
import { accountDeletionCopy as c } from './copy';
import type { FlagStore } from './api';
import type { ServerStatus } from './logic';

/** The settings key (docs/legal/DATA_CLASSIFICATION.md 4.5). */
export const OPEN_REQUEST_KEY = 'accountDeletion.openRequest';

export type OpenRequest =
  | { state: 'scheduled' | 'held'; requestId: string; scheduledFor: string }
  | { state: 'executing'; requestId: string }
  /** Cancelled at `at`, and the book has not come back yet: the next pull brings it, and until then this is not the welcome. */
  | { state: 'cancelled'; at: string };

/** How long a cancelled phone waits for its book before it is just a phone with no book (the next pull is seconds away). */
export const CANCELLED_WAIT_MS = 15 * 60_000;

const isId = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 64;

/** The stored value, or null when there is none or it is not one of the shapes above (a bad value is no note). */
export function parseOpenRequest(raw: string | null): OpenRequest | null {
  if (!raw) return null;
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  if (o.state === 'cancelled' && typeof o.at === 'string' && !Number.isNaN(Date.parse(o.at))) return { state: 'cancelled', at: o.at };
  if (o.state === 'executing' && isId(o.requestId)) return { state: 'executing', requestId: o.requestId };
  if ((o.state === 'scheduled' || o.state === 'held') && isId(o.requestId) && typeof o.scheduledFor === 'string' && !Number.isNaN(Date.parse(o.scheduledFor))) {
    return { state: o.state, requestId: o.requestId, scheduledFor: o.scheduledFor };
  }
  return null;
}

export function readOpenRequest(store: Pick<FlagStore, 'get'>): OpenRequest | null {
  return parseOpenRequest(store.get(OPEN_REQUEST_KEY));
}

/** Writes the note, or clears it for null. Writes only when the value changes, so a read that finds the same thing is silent. */
export function writeOpenRequest(store: FlagStore, next: OpenRequest | null): void {
  const before = store.get(OPEN_REQUEST_KEY);
  if (next === null) {
    if (before !== null) store.remove(OPEN_REQUEST_KEY);
    return;
  }
  const raw = JSON.stringify(next);
  if (before !== raw) store.set(OPEN_REQUEST_KEY, raw);
}

/** What the server says about the person's open request, as a note. */
export function openRequestOf(status: ServerStatus): OpenRequest | null {
  if (status.state === 'none') return null;
  if (status.state === 'executing') return { state: 'executing', requestId: status.requestId };
  return { state: status.state, requestId: status.requestId, scheduledFor: status.scheduledFor };
}

/**
 * The note after a read of the server's open request that succeeded.
 *  - A request found replaces the note.
 *  - None found, and the note said a request was open: it was closed since (cancelled on another phone). A phone with a
 *    book has nothing more to wait for. A phone without one has its book coming back with the next pull, so it waits,
 *    as it does after its own cancel, and is never the welcome in between.
 *  - None found, and no open note: nothing (a cancelled note is left to the wait that it is).
 */
export function noteAfterRead(current: OpenRequest | null, status: ServerStatus, phone: { hasBook: boolean; nowIso: string }): OpenRequest | null {
  const open = openRequestOf(status);
  if (open) return open;
  if (current?.state === 'cancelled') return current;
  if (current?.state === 'scheduled' || current?.state === 'held') return noteAfterCancel({ hasBook: phone.hasBook }, phone.nowIso);
  return null;
}

/**
 * The note after a cancel went through. With a book listed there is nothing to wait for (a co-parent's book never
 * left), so the note goes. Without one (a sole parent's book comes back with the next pull) the phone waits, and says so.
 */
export function noteAfterCancel(phone: { hasBook: boolean }, nowIso: string): OpenRequest | null {
  return phone.hasBook ? null : { state: 'cancelled', at: nowIso };
}

/** The note as it counts now: a cancelled wait that has outlasted CANCELLED_WAIT_MS no longer holds the welcome back. */
export function liveNote(note: OpenRequest | null, nowMs: number): OpenRequest | null {
  if (note?.state === 'cancelled' && nowMs - Date.parse(note.at) > CANCELLED_WAIT_MS) return null;
  return note;
}

/** The note once the phone lists a book again: a cancelled wait is over; an open request stays (it can still be cancelled). */
export function noteWithBook(note: OpenRequest | null): OpenRequest | null {
  return note?.state === 'cancelled' ? null : note;
}

/**
 * What the phone shows when it opens at the root, or is sent there because it has no book.
 *  - `app`        a book is listed: Tonight and the tabs, as always (a co-parent's phone, a cancelled request).
 *  - `deletion`   no book and a request is open (or just cancelled and the book is on its way back).
 *  - `checking`   no book, signed in, a book on this phone was deleted on the server, and the server has not yet said
 *                 whether a request is open: a moment of paper, not the welcome (another phone of the same account).
 *  - `welcome`    first run: no book, nothing open.
 * `welcome` is never the answer while a note is open.
 */
export type PhoneScreen = 'app' | 'deletion' | 'checking' | 'welcome';

export function chooseScreen(phone: {
  hasBook: boolean;
  note: OpenRequest | null;
  nowMs: number;
  signedIn: boolean;
  /** A book on this phone that the server has closed (server_state 'deleted'). */
  hasDeletedBook: boolean;
  /** The server has been asked about the open request since this screen opened (answered, failed or timed out). */
  checked: boolean;
}): PhoneScreen {
  if (phone.hasBook) return 'app';
  if (liveNote(phone.note, phone.nowMs)) return 'deletion';
  if (phone.signedIn && phone.hasDeletedBook && !phone.checked) return 'checking';
  return 'welcome';
}

export type DeletionAction = 'cancel' | 'signOut' | 'signIn' | 'retry';

/** The deletion screen as data: its words, and which actions it offers (the first is the primary). */
export interface DeletionView {
  title: string;
  body: string;
  actions: DeletionAction[];
  /** The label of each action. */
  labels: Record<DeletionAction, string>;
}

const fillDate = (t: string, date: string) => t.replace('{date}', date);

/**
 * The words and buttons of the deletion screen. `date` is the request's day, already written the way the page writes
 * it. Nothing else is offered: not a book, not Settings, not the welcome.
 */
export function deletionView(
  request: OpenRequest,
  o: { signedIn: boolean; date: string; tryAgainLabel: string },
): DeletionView {
  const labels: Record<DeletionAction, string> = {
    cancel: c.scheduled.cancelButton,
    signOut: c.scheduled.doneButton,
    signIn: c.signedOut.button,
    retry: o.tryAgainLabel,
  };
  switch (request.state) {
    case 'scheduled':
    case 'held':
      return o.signedIn
        ? { title: c.scheduled.heading, body: fillDate(c.scheduled.body, o.date), actions: ['cancel', 'signOut'], labels }
        : { title: c.scheduled.heading, body: fillDate(c.signedOut.scheduledBody, o.date), actions: ['signIn'], labels };
    case 'executing':
      return { title: c.open.executingTitle, body: c.executing, actions: o.signedIn ? ['signOut'] : [], labels };
    case 'cancelled':
      return { title: c.open.restoringTitle, body: c.open.restoringBody, actions: [o.signedIn ? 'retry' : 'signIn'], labels };
  }
}
