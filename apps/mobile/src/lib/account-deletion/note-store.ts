/**
 * The open-request note on this phone, with the few things that follow a change to it (open-request.ts has the rule).
 * One place, so the Delete account page, the deletion screen and the first-run gate all write it the same way.
 * Needs the app's store and sync (React Native), so it is not in the Node-tested pure module.
 */
import { deleteSetting, getSetting, listChildren, setSetting } from '@/lib/store';
import { syncNow } from '@/lib/sync';
import type { FlagStore } from './api';
import type { ServerStatus } from './logic';
import { noteAfterCancel, noteAfterRead, readOpenRequest, writeOpenRequest, type OpenRequest } from './open-request';

/** The device settings, as the account-deletion code reads and writes them. */
export const deviceFlags: FlagStore = { get: getSetting, set: setSetting, remove: deleteSetting };

const hasBook = (): boolean => listChildren().length > 0;

/** A phone that is waiting for its book (cancelled here or elsewhere) pulls at once instead of waiting for the next trigger. */
function pullIfWaiting(before: OpenRequest | null, after: OpenRequest | null): void {
  if (after?.state === 'cancelled' && before?.state !== 'cancelled') void syncNow().catch(() => undefined);
}

/** A read of the server's open request that succeeded. */
export function recordStatus(status: ServerStatus): void {
  const before = readOpenRequest(deviceFlags);
  const after = noteAfterRead(before, status, { hasBook: hasBook(), nowIso: new Date().toISOString() });
  writeOpenRequest(deviceFlags, after);
  pullIfWaiting(before, after);
}

/** The server answered a request: it is open until the date. */
export function recordRequested(r: { requestId: string; scheduledFor: string }): void {
  writeOpenRequest(deviceFlags, { state: 'scheduled', requestId: r.requestId, scheduledFor: r.scheduledFor });
}

/** A cancel went through. */
export function recordCancelled(): void {
  const before = readOpenRequest(deviceFlags);
  const after = noteAfterCancel({ hasBook: hasBook() }, new Date().toISOString());
  writeOpenRequest(deviceFlags, after);
  pullIfWaiting(before, after);
}

/** The phone lists a book again: a cancelled wait is over. */
export function recordBookBack(): void {
  const before = readOpenRequest(deviceFlags);
  if (before?.state === 'cancelled') writeOpenRequest(deviceFlags, null);
}
