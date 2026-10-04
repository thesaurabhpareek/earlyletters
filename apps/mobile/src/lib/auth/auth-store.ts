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
 */
import { authUserId, canSync, initialAuthState, type AuthState } from './machine.logic';

let snapshot: AuthState = initialAuthState;
const listeners = new Set<(s: AuthState) => void>();
const signedInListeners = new Set<(userId: string) => void>();
const acceptedListeners = new Set<(childId: string) => void>();

export function getAuthSnapshot(): AuthState {
  return snapshot;
}

export function subscribeAuth(listener: (s: AuthState) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The signed-in user's id, or null (local-only). */
export function currentAuthUserId(): string | null {
  return authUserId(snapshot);
}

/** True only when consent is complete on the server (or a sign-out waits for uploads). */
export function syncAllowed(): boolean {
  return canSync(snapshot);
}

/** Provider only. */
export function publishAuth(next: AuthState): void {
  const prevUser = authUserId(snapshot);
  snapshot = next;
  listeners.forEach((l) => l(next));
  const user = authUserId(next);
  if (user && user !== prevUser) signedInListeners.forEach((l) => l(user));
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
