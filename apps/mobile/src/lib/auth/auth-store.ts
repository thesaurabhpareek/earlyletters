/**
 * The auth state for code outside React (the sync engine, the store's
 * re-ownership step, analytics). The session provider is the only writer.
 *
 * Contract for the sync agent:
 *   - start syncing only while `syncAllowed()` is true; stop when it turns false;
 *   - call `registerUploadQueue()` so sign-out waits for queued letters
 *     (PRD A F6.4, A-REQ-033);
 *   - `onSignedIn()` fires once per new session (re-own local rows, then
 *     create_first_run_children; A-REQ-015);
 *   - `onInviteAccepted()` fires with the joined book's id (fetch it into the
 *     local store so the invitee sees the book).
 *
 * Account confirmation (security review H1, account-confirm.logic.ts): a
 * session whose account does not own this phone's letters yet is hidden from
 * that contract until the person taps "Yes, this is me". Until then
 * `currentAuthUserId()` is null, `syncAllowed()` is false and `onSignedIn` has
 * not fired, so nothing claims or uploads a letter. `getAuthSnapshot()` and
 * `subscribeAuth()` still show the raw state (screens, analytics).
 */
import { needsAccountConfirm } from './account-confirm.logic';
import { authUserId, canSync, initialAuthState, type AuthState } from './machine.logic';

let snapshot: AuthState = initialAuthState;
const listeners = new Set<(s: AuthState) => void>();
const signedInListeners = new Set<(userId: string) => void>();
const acceptedListeners = new Set<(childId: string) => void>();
const confirmed = new Set<string>();
/** The user the signed-in listeners last heard about (null after sign-out). */
let announced: string | null = null;
/** Who owns this phone's letters (sync.ownerId); registered by the session provider. Null: nobody yet. */
let readOwner: () => string | null = () => null;

export function getAuthSnapshot(): AuthState {
  return snapshot;
}

export function subscribeAuth(listener: (s: AuthState) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function ownerNow(): string | null {
  try {
    return readOwner();
  } catch {
    return null;
  }
}

/** The session's user still has to confirm the account before this phone's letters join it. */
export function accountConfirmPending(): boolean {
  return needsAccountConfirm(authUserId(snapshot), ownerNow(), confirmed);
}

/** The signed-in user's id once confirmed for this phone, or null (local-only, or waiting for "Yes, this is me"). */
export function currentAuthUserId(): string | null {
  return accountConfirmPending() ? null : authUserId(snapshot);
}

/** True only when consent is complete on the server and the account is confirmed (or a sign-out waits for uploads). */
export function syncAllowed(): boolean {
  return canSync(snapshot) && !accountConfirmPending();
}

function announce(): void {
  const user = currentAuthUserId();
  if (user === announced) return;
  announced = user;
  if (user) signedInListeners.forEach((l) => l(user));
}

/** Provider only. */
export function publishAuth(next: AuthState): void {
  snapshot = next;
  if (!authUserId(next)) confirmed.clear();
  listeners.forEach((l) => l(next));
  announce();
}

/** Provider only: how to read the owner of this phone's letters. */
export function setOwnerReader(read: () => string | null): void {
  readOwner = read;
}

/** Provider only: the person tapped "Yes, this is me" for the signed-in account. */
export function confirmAccount(userId: string): void {
  if (authUserId(snapshot) !== userId) return;
  confirmed.add(userId);
  listeners.forEach((l) => l(snapshot));
  announce();
}

/** Fires when a session for a (new) user appears on this phone, including at launch. */
export function onSignedIn(listener: (userId: string) => void): () => void {
  signedInListeners.add(listener);
  return () => {
    signedInListeners.delete(listener);
  };
}

export function onInviteAccepted(listener: (childId: string) => void): () => void {
  acceptedListeners.add(listener);
  return () => {
    acceptedListeners.delete(listener);
  };
}

/** family/invites.ts only. */
export function publishInviteAccepted(childId: string): void {
  acceptedListeners.forEach((l) => l(childId));
}

// ── Upload queue probe (owned by the sync agent) ─────────────────────────
export interface UploadQueueProbe {
  /** Letters, books and settings written on this phone and not yet on the server. */
  pendingCount(): number | Promise<number>;
  /** Called whenever the queue becomes empty. Returns an unsubscribe. */
  onDrained(listener: () => void): () => void;
}

let probe: UploadQueueProbe | null = null;

export function registerUploadQueue(p: UploadQueueProbe): () => void {
  probe = p;
  return () => {
    if (probe === p) probe = null;
  };
}

/** 0 when no sync engine is registered (nothing can be queued for the server then). */
export async function pendingUploads(): Promise<number> {
  try {
    return probe ? await probe.pendingCount() : 0;
  } catch {
    return 0;
  }
}

export function onUploadsDrained(listener: () => void): () => void {
  return probe ? probe.onDrained(listener) : () => {};
}
