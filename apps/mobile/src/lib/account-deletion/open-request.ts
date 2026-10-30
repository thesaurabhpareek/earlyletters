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
 * open, its id and date, and the id of the account it was made for, all from the server's own answers. It holds no
 * letter, no name and nothing about a child. It is written when a request is made and when the Delete account page or
 * the deletion screen reads the open request from the server (`deletion_requests`, own rows by RLS), never sent
 * anywhere, and it ends in these ways:
 *  - a read finds no request open (cleared; or, on a phone that has a book the server closed, the "cancelled" wait);
 *  - a cancel goes through;
 *  - another account signs in on the phone (a note belongs to the account that was asked, see noteOfAccount);
 *  - its date has passed by more than NOTE_GRACE_MS and the phone cannot confirm the request is still open: after the
 *    purge the account no longer exists, no read can succeed, and nothing else would ever end the note (noteIsStale).
 */
import { accountDeletionCopy as c } from './copy';
import type { FlagStore } from './api';
import type { ServerStatus } from './logic';

/** The settings key (docs/legal/DATA_CLASSIFICATION.md 4.5). */
export const OPEN_REQUEST_KEY = 'accountDeletion.openRequest';

export type OpenRequest =
  | { state: 'scheduled' | 'held'; requestId: string; scheduledFor: string; userId?: string }
  /** `scheduledFor` is the request's date (the server's row always has one); it is what dates a note that is still executing. */
  | { state: 'executing'; requestId: string; scheduledFor?: string; userId?: string }
  /** Cancelled at `at`, and the book has not come back yet: the next pull brings it, and until then this is not the welcome. */
  | { state: 'cancelled'; at: string; userId?: string };

/** How long a cancelled phone waits for its book before it is just a phone with no book (the next pull is seconds away). */
export const CANCELLED_WAIT_MS = 15 * 60_000;

/**
 * How long past its date an open note still counts when the phone cannot ask the server. The purge worker runs at the
 * date and a run takes up to 24 hours (the deletion screen's own "This can take up to a day"); twice that leaves no
 * doubt that a note older than this describes a request that is over: the account was purged, or the date was long ago
 * released. A request the server still reports open is never judged by this: the read confirms it (see `confirmed`).
 */
export const NOTE_GRACE_MS = 48 * 3_600_000;

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
  const who = isId(o.userId) ? { userId: o.userId } : {};
  const dated = typeof o.scheduledFor === 'string' && !Number.isNaN(Date.parse(o.scheduledFor));
  if (o.state === 'cancelled' && typeof o.at === 'string' && !Number.isNaN(Date.parse(o.at))) return { state: 'cancelled', at: o.at, ...who };
  if (o.state === 'executing' && isId(o.requestId)) return { state: 'executing', requestId: o.requestId, ...(dated ? { scheduledFor: o.scheduledFor as string } : {}), ...who };
  if ((o.state === 'scheduled' || o.state === 'held') && isId(o.requestId) && typeof o.scheduledFor === 'string' && !Number.isNaN(Date.parse(o.scheduledFor))) {
    return { state: o.state, requestId: o.requestId, scheduledFor: o.scheduledFor, ...who };
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

/**
 * What the server says about the person's open request, as a note. `userId` is the account that was asked (when it is
 * known), so a different account that signs in on this phone does not inherit the note.
 */
export function openRequestOf(status: ServerStatus, userId?: string | null): OpenRequest | null {
  const who = userId ? { userId } : {};
  if (status.state === 'none') return null;
  if (status.state === 'executing') return { state: 'executing', requestId: status.requestId, ...(status.scheduledFor ? { scheduledFor: status.scheduledFor } : {}), ...who };
  return { state: status.state, requestId: status.requestId, scheduledFor: status.scheduledFor, ...who };
}

/**
 * Whose note it is. A note belongs to the account that was asked; the account signed in now is `userId` (the session's
 * own user, known from the moment a session exists, even while consent or the claim is pending). Another account's note
 * says nothing about this one, and neither does one that names no account (none is written without one): both count as
 * no note. Signed out (`userId` null) there is no one to compare with, so the note stands: it is how the phone says
 * "sign in to cancel".
 */
export function noteOfAccount(note: OpenRequest | null, userId: string | null | undefined): OpenRequest | null {
  if (!note || !userId) return note;
  return note.userId === userId ? note : null;
}

/** When a note stops counting by itself, as an instant: a cancelled wait, or an open request's date plus the grace. Null: never (undated). */
export function noteExpiresAtMs(note: OpenRequest | null): number | null {
  if (!note) return null;
  if (note.state === 'cancelled') return Date.parse(note.at) + CANCELLED_WAIT_MS;
  return note.scheduledFor ? Date.parse(note.scheduledFor) + NOTE_GRACE_MS : null;
}

/**
 * An open note whose date passed more than NOTE_GRACE_MS ago. It counts only while the server says the request is open
 * (a held request, a purge that has not run); a phone that cannot ask, or is told nothing is open, drops it.
 */
export function noteIsStale(note: OpenRequest | null, nowMs: number): boolean {
  if (!note || note.state === 'cancelled') return false;
  const at = noteExpiresAtMs(note);
  return at !== null && nowMs > at;
}

/**
 * The note after a read of the server's open request that succeeded.
 *  - A request found replaces the note.
 *  - None found, and the note is another account's, or has no account: it says nothing about this one. Gone.
 *  - None found, and a cancelled wait: left to be the wait it is.
 *  - None found, and the note said a request was open for this account, within its date: it was closed since (cancelled
 *    on another phone). A phone with a book has nothing more to wait for. A phone with no book whose own book the
 *    server has closed (`hasDeletedBook`) has that book coming back with the next pull, so it waits, as it does after
 *    its own cancel, and is never the welcome in between. A phone with no such book has nothing coming back: gone,
 *    and the welcome (never "on their way back" when nothing is).
 *  - None found, and the note is past its date by more than the grace: the request is over (the account was purged, or
 *    it was released long ago). Gone, whatever the phone holds.
 *  - None found, and no open note: nothing.
 */
export function noteAfterRead(
  current: OpenRequest | null,
  status: ServerStatus,
  phone: { hasBook: boolean; hasDeletedBook: boolean; nowIso: string; userId?: string | null },
): OpenRequest | null {
  const open = openRequestOf(status, phone.userId);
  if (open) return open;
  const mine = noteOfAccount(current, phone.userId);
  if (mine?.state === 'cancelled') return mine;
  if ((mine?.state === 'scheduled' || mine?.state === 'held') && !noteIsStale(mine, Date.parse(phone.nowIso))) {
    return phone.hasBook || !phone.hasDeletedBook ? null : noteAfterCancel({ hasBook: false, userId: phone.userId }, phone.nowIso);
  }
  return null;
}

/**
 * The note after a cancel went through. With a book listed there is nothing to wait for (a co-parent's book never
 * left), so the note goes. Without one (a sole parent's book comes back with the next pull) the phone waits, and says so.
 */
export function noteAfterCancel(phone: { hasBook: boolean; userId?: string | null }, nowIso: string): OpenRequest | null {
  return phone.hasBook ? null : { state: 'cancelled', at: nowIso, ...(phone.userId ? { userId: phone.userId } : {}) };
}

/** The note as it counts now: a cancelled wait that has outlasted CANCELLED_WAIT_MS no longer holds the welcome back. */
export function liveNote(note: OpenRequest | null, nowMs: number): OpenRequest | null {
  if (note?.state === 'cancelled' && nowMs - Date.parse(note.at) > CANCELLED_WAIT_MS) return null;
  return note;
}

/**
 * The note this phone counts right now, for the account signed in: not another account's, not a cancelled wait that has
 * run out. (A note past its date is judged apart, by `chooseScreen`, because it depends on what the server says.)
 */
export function countedNote(note: OpenRequest | null, userId: string | null | undefined, nowMs: number): OpenRequest | null {
  return liveNote(noteOfAccount(note, userId), nowMs);
}

/**
 * Whether the stored note should be removed, for a place that may write (an effect, a read's answer): never in render.
 * It is removed when it is another account's, when a cancelled wait has run out, or when it is past its date by more
 * than the grace and the phone cannot say it is still open: signed out, or the server has been asked (`checked`) and did
 * not confirm. While the server is still being asked, a signed-in phone keeps it, because the answer may confirm it.
 */
export function noteIsDead(phone: {
  note: OpenRequest | null;
  nowMs: number;
  signedIn: boolean;
  userId?: string | null;
  checked: boolean;
  confirmed: boolean;
}): boolean {
  if (!phone.note) return false;
  if (!countedNote(phone.note, phone.userId, phone.nowMs)) return true;
  return noteIsStale(phone.note, phone.nowMs) && !phone.confirmed && (!phone.signedIn || phone.checked);
}

/** The note once the phone lists a book again: a cancelled wait is over; an open request stays (it can still be cancelled). */
export function noteWithBook(note: OpenRequest | null): OpenRequest | null {
  return note?.state === 'cancelled' ? null : note;
}

/**
 * What the phone shows when it opens at the root, or is sent there because it has no book.
 *  - `app`        a book is listed: Tonight and the tabs, as always (a co-parent's phone, a cancelled request).
 *  - `deletion`   no book and a request is open (or just cancelled and the book is on its way back).
 *  - `checking`   no book, signed in, and the server has not yet said what is true: either a book on this phone was
 *                 deleted on the server, or the note is past its date and only the server can say it is still open.
 *                 A moment of paper, not the welcome (another phone of the same account) and not a stale date.
 *  - `welcome`    first run: no book, nothing open, and no note that still counts.
 * `welcome` is never the answer while a note that counts is open (one that is another account's, or past its date by
 * more than the grace with no word from the server that it is still open, does not count).
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
  /** The account signed in now (the session's user; null signed out). When given, another account's note is no note. */
  userId?: string | null;
  /** Since this screen opened, the server said the request is open. Settles a note that is past its date (a held request). */
  confirmed?: boolean;
}): PhoneScreen {
  if (phone.hasBook) return 'app';
  const note = countedNote(phone.note, phone.userId, phone.nowMs);
  if (note) {
    if (!noteIsStale(note, phone.nowMs) || phone.confirmed) return 'deletion';
    // Past its date: only the server can say it is still open. Signed in, it is being asked; otherwise the note is dead.
    if (phone.signedIn && !phone.checked) return 'checking';
  }
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
      // Nothing can be cancelled any more, so the page only explains; but it is never a dead end: a way out of this
      // phone's session (Sign out), or, signed out, the way back in (Sign in).
      return { title: c.open.executingTitle, body: c.executing, actions: [o.signedIn ? 'signOut' : 'signIn'], labels };
    case 'cancelled':
      return { title: c.open.restoringTitle, body: c.open.restoringBody, actions: [o.signedIn ? 'retry' : 'signIn'], labels };
  }
}
