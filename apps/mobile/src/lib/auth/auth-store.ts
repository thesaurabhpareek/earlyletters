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
 * The H1 fix (BL-347, F02-REQ-019): a session is released to that contract
 * only once consent is complete (`canSync`) AND, when this phone's letters
 * belong to no account yet, the person has tapped "Keep them here" on the
 * claim screen that shows the masked account email (account-claim.logic.ts).
 * Until then `currentAuthUserId()` is null, `syncAllowed()` is false and
 * `onSignedIn` has not fired, so lib/sync never runs `takeOwnership` and
 * nothing uploads. `getAuthSnapshot()` and `subscribeAuth()` still show the raw
 * state, for the screens.
 */
import { needsAccountClaim } from './account-claim.logic';
import { authUserId, canSync, initialAuthState, type AuthState } from './machine.logic';

let snapshot: AuthState = initialAuthState;
const listeners = new Set<(s: AuthState) => void>();
const signedInListeners = new Set<(userId: string) => void>();
const acceptedListeners = new Set<(childId: string) => void>();
/** Users who tapped "Keep them here" in this process. Cleared at sign-out. */
const confirmed = new Set<string>();
/** The user the signed-in listeners last heard about (null after sign-out). */
let announced: string | null = null;

export interface ClaimReaders {
  /** Who owns this phone's letters (lib/store currentUserId); null before the first claim. */
  owner(): string | null;
  /** Whether this phone holds any book or letter. */
  hasLocalData(): boolean;
}

/** Until the provider registers the real readers: nobody owns the phone, and assume letters exist (ask first). */
const ASK_FIRST: ClaimReaders = { owner: () => null, hasLocalData: () => true };
let readers: ClaimReaders = ASK_FIRST;

export function getAuthSnapshot(): AuthState {
  return snapshot;
}

export function subscribeAuth(listener: (s: AuthState) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function safely<T>(read: () => T, fallback: T): T {
  try {
    return read();
  } catch {
    return fallback;
  }
}

/**
 * The signed-in account still has to be confirmed on the claim screen before
 * this phone's letters may join it. Read only while a session exists, so a
 * signed-out phone (and every build with server features off) never touches
 * the store for this.
 */
export function accountClaimPending(): boolean {
  const userId = authUserId(snapshot);
  if (!userId) return false;
  if (confirmed.has(userId)) return false;
  return needsAccountClaim({
    userId,
    owner: safely(() => readers.owner(), null),
    // An unreadable store is "unknown" to the rule, which asks first.
    hasLocalData: safely<boolean | null>(() => readers.hasLocalData(), null),
    confirmed,
  });
}

function released(): string | null {
  return canSync(snapshot) && !accountClaimPending() ? authUserId(snapshot) : null;
}

/**
 * The signed-in user's id once the session is released to sync (consent
 * complete, and the claim confirmed or not needed), or null: local-only,
 * still consenting, consent declined, or waiting for "Keep them here".
 */
export function currentAuthUserId(): string | null {
  return released();
}

/** True only when consent is complete on the server and no claim is pending (or a sign-out waits for uploads). */
export function syncAllowed(): boolean {
  return released() !== null;
}

function announce(): void {
  const user = released();
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

/** Provider only: how to read the owner and the local data (lib/store). Null puts back the ask-first default. */
export function setClaimReaders(next: ClaimReaders | null): void {
  readers = next ?? ASK_FIRST;
}

/** Provider only: the person tapped "Keep them here" for the signed-in account. */
export function confirmAccountClaim(userId: string): void {
  if (authUserId(snapshot) !== userId) return;
  confirmed.add(userId);
  listeners.forEach((l) => l(snapshot));
  announce();
}

/** Tests only (vitest sets VITEST): back to a fresh process. */
export function resetAuthStoreForTests(): void {
  const env = typeof process !== 'undefined' ? process.env : undefined;
  if (!env?.VITEST) throw new Error('resetAuthStoreForTests is for tests only');
  snapshot = initialAuthState;
  confirmed.clear();
  announced = null;
  readers = ASK_FIRST;
  listeners.clear();
  signedInListeners.clear();
  acceptedListeners.clear();
  probe = null;
}

/**
 * Fires when a session for a (new) user is released on this phone, including
 * at launch: after consent, and after the claim screen when one was needed.
 */
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
