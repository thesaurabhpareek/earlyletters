/**
 * The open-request note on this phone, with the few things that follow a change to it (open-request.ts has the rule).
 * One place, so the Delete account page, the deletion screen and the first-run gate all write it the same way.
 * Needs the app's store and sync (React Native), so it is not in the Node-tested pure module; test/account-deletion-note-store.test.ts
 * runs it in Node with those three modules replaced.
 *
 * The account a note is written for is the session's own user (`signedInUserId`: the auth state's user id, known from the
 * moment a session exists), never `currentAuthUserId()`, which is null while consent or the claim is pending: a note
 * written then would name no account, and another account signing in on the phone could inherit it.
 */
import { getAuthSnapshot } from '@/lib/auth/auth-store';
import { authUserId } from '@/lib/auth/machine.logic';
import { deleteSetting, getSetting, listChildren, localSqlDb, setSetting } from '@/lib/store';
import { syncNow } from '@/lib/sync';
import type { FlagStore } from './api';
import type { ServerStatus } from './logic';
import { noteAfterCancel, noteAfterRead, OPEN_REQUEST_KEY, readOpenRequest, writeOpenRequest, type OpenRequest } from './open-request';

/** The device settings, as the account-deletion code reads and writes them. */
export const deviceFlags: FlagStore = { get: getSetting, set: setSetting, remove: deleteSetting };

const hasBook = (): boolean => listChildren().length > 0;

/** A book on this phone that the server has closed (server_state 'deleted'): the one thing a cancel brings back. */
export function phoneHasDeletedBook(): boolean {
  return localSqlDb().get<{ x: number }>("SELECT 1 AS x FROM children WHERE server_state = 'deleted' LIMIT 1") !== null;
}

/** The account signed in on this phone now, even while consent or the claim is pending; null when signed out. */
export function signedInUserId(): string | null {
  return authUserId(getAuthSnapshot());
}

/** A phone that is waiting for its book (cancelled here or elsewhere) pulls at once instead of waiting for the next trigger. */
function pullIfWaiting(before: OpenRequest | null, after: OpenRequest | null): void {
  if (after?.state === 'cancelled' && before?.state !== 'cancelled') void syncNow().catch(() => undefined);
}

/**
 * A read of the server's open request that succeeded. `askedAs` is the account that asked (read before the request was
 * sent): an answer that comes back after another account has signed in is not that account's, and is dropped.
 */
export function recordStatus(status: ServerStatus, askedAs: string | null): void {
  const userId = signedInUserId();
  if (askedAs && askedAs !== userId) return;
  const before = readOpenRequest(deviceFlags);
  const after = noteAfterRead(before, status, { hasBook: hasBook(), hasDeletedBook: phoneHasDeletedBook(), nowIso: new Date().toISOString(), userId });
  writeOpenRequest(deviceFlags, after);
  pullIfWaiting(before, after);
}

/** The server answered a request: it is open until the date. */
export function recordRequested(r: { requestId: string; scheduledFor: string }): void {
  const userId = signedInUserId();
  writeOpenRequest(deviceFlags, { state: 'scheduled', requestId: r.requestId, scheduledFor: r.scheduledFor, ...(userId ? { userId } : {}) });
}

/** A cancel went through. */
export function recordCancelled(): void {
  const before = readOpenRequest(deviceFlags);
  const after = noteAfterCancel({ hasBook: hasBook(), userId: signedInUserId() }, new Date().toISOString());
  writeOpenRequest(deviceFlags, after);
  pullIfWaiting(before, after);
}

/** The phone lists a book again: a cancelled wait is over. */
export function recordBookBack(): void {
  const before = readOpenRequest(deviceFlags);
  if (before?.state === 'cancelled') writeOpenRequest(deviceFlags, null);
}

/**
 * Removes a note the phone no longer counts (open-request.ts noteIsDead). `judged` is the stored value that was judged,
 * as read: if the note has changed since (an answer from the server landed in between), it is left alone.
 */
export function clearDeadNote(judged: string | null): void {
  if (judged !== null && getSetting(OPEN_REQUEST_KEY) === judged) deleteSetting(OPEN_REQUEST_KEY);
}
