/**
 * The auth state for code outside React (the sync engine, the store's
 * re-ownership step, analytics). The session provider is the only writer.
 *
 * Contract for the sync agent:
 *   - start syncing only while `syncAllowed()` is true; stop when it turns false;
 *   - call `registerUploadQueue()` so sign-out waits for queued letters
 *     (PRD A F6.4, A-REQ-033);
 *   - `onSignedIn()` fires once per account this phone's letters may belong
 *     to (re-own local rows, then create_first_run_children; A-REQ-015);
 *   - `onInviteAccepted()` fires with the joined book's id (fetch it into the
 *     local store so the invitee sees the book).
 *
 * Claim gate (BL-347, security review H1 step 4, F02-REQ-019): a session alone
 * is not enough. `currentAuthUserId()`, `syncAllowed()` and `onSignedIn()` see
 * an account only after the provider calls `publishClaim()` for it: when the
 * person tapped Keep them here on the screen with the masked account email, or
 * when there was nothing to move (claim.logic.ts). Until then the sync layer
 * behaves as signed out, so no letter changes owner and nothing uploads.
 */
import { authUserId, canSync, initialAuthState, type AuthState } from './machine.logic';

let snapshot: AuthState = initialAuthState;
/** The account the provider cleared for the sync layer on this phone. */
let claimedFor: string | null = null;
/** The account the sync layer was last told about (onSignedIn). */
let exposed: string | null = null;
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

/** The account the sync layer may act for, or null (local-only, or the claim screen not yet answered). */
export function currentAuthUserId(): string | null {
  const user = authUserId(snapshot);
  return user && user === claimedFor ? user : null;
}

/** True only when consent is complete on the server and the claim is settled (or a sign-out waits for uploads). */
export function syncAllowed(): boolean {
  return canSync(snapshot) && currentAuthUserId() !== null;
}

function emit(): void {
  listeners.forEach((l) => l(snapshot));
  const user = currentAuthUserId();
  if (user !== exposed) {
    exposed = user;
    if (user) signedInListeners.forEach((l) => l(user));
  }
}

/** Provider only. */
export function publishAuth(next: AuthState): void {
  snapshot = next;
  if (!authUserId(next)) claimedFor = null;
  emit();
}

/** Provider only: the claim is settled for this account (or null when it is not). */
export function publishClaim(userId: string | null): void {
  claimedFor = userId;
  emit();
}

/** Fires when the sync layer may act for a (new) account on this phone, including at launch. */
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
