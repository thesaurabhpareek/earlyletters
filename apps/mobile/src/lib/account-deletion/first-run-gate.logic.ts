/**
 * What the first-run gate decides on each render, as one pure function, so it is tested in Node without a screen
 * (test/account-deletion-gate.test.ts). use-first-run-gate.ts reads the inputs (the note, the book, the session, the
 * route) and acts on the answer; it decides nothing itself.
 *
 *  - `screen`, `request`  what to draw (open-request.ts chooseScreen). `request` is the note that counts, never the raw
 *    stored one: not another account's, not a cancelled wait that has run out.
 *  - `leave`              the book is back after the deletion screen was up: go to the Book. Only while the welcome, or
 *    the sign-in sheet over it, is in front (welcomeMayLeave): a book that arrives while the invite and join sheet is on
 *    top must not pull it away (S59, P8b; the same allow-list FirstRun uses).
 *  - `clear`              the stored note is one the phone no longer counts (open-request.ts noteIsDead). The caller
 *    removes it from an effect, never during render.
 *  - `refreshWithBook`    a book is listed, an open request is still noted, and an account is signed in: ask the server
 *    once, in the background, so a note whose request was cancelled elsewhere does not sit there unseen until the day
 *    the book is lost (a plain sync brought it back; recordBookBack clears only a cancelled wait).
 */
import { welcomeMayLeave } from '@/components/family/welcome-handoff.logic';
import { chooseScreen, countedNote, noteIsDead, type OpenRequest, type PhoneScreen } from './open-request';

export interface GateInputs {
  hasBook: boolean;
  hasDeletedBook: boolean;
  /** The stored note, as parsed. */
  note: OpenRequest | null;
  nowMs: number;
  signedIn: boolean;
  /** The session's user (authUserId of the auth state), known from checkingConsent on; null signed out. */
  userId: string | null;
  /** The server has been asked since this screen opened (answered, failed or timed out). */
  checked: boolean;
  /** The server said, since this screen opened, that the request is open. */
  confirmed: boolean;
  /** The deletion screen has been up since this screen opened. */
  wasDeletion: boolean;
  pathname: string;
}

export interface GateDecision {
  screen: PhoneScreen;
  request: OpenRequest | null;
  leave: boolean;
  clear: boolean;
  refreshWithBook: boolean;
  /** The deletion screen is up on this render (the caller remembers it for the next). */
  deletionShown: boolean;
}

export function decideGate(i: GateInputs): GateDecision {
  const base = chooseScreen({
    hasBook: i.hasBook, note: i.note, nowMs: i.nowMs, signedIn: i.signedIn, hasDeletedBook: i.hasDeletedBook,
    checked: i.checked, userId: i.userId, confirmed: i.confirmed,
  });
  const counted = countedNote(i.note, i.userId, i.nowMs);
  // The deletion screen was up and the book has come back: the screen stays until the route has gone to the Book, so the
  // welcome is not drawn for a frame in between.
  const leaving = base === 'app' && i.wasDeletion;
  const open = counted !== null && counted.state !== 'cancelled';
  return {
    screen: leaving ? 'deletion' : base,
    request: leaving ? { state: 'cancelled', at: new Date(i.nowMs).toISOString() } : base === 'deletion' ? counted : null,
    leave: leaving && welcomeMayLeave('welcome', i.pathname),
    clear: noteIsDead({ note: i.note, nowMs: i.nowMs, signedIn: i.signedIn, userId: i.userId, checked: i.checked, confirmed: i.confirmed }),
    refreshWithBook: i.hasBook && i.signedIn && open,
    deletionShown: base === 'deletion',
  };
}
