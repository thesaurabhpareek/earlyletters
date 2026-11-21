/**
 * NS-45-R4, card O-18 (security G7, Apple TN3194): Apple says this phone's
 * Apple sign-in was revoked. Two triggers feed one gate: the app coming to the
 * foreground (this gate, asks Apple at most once per MIN_GAP_MS and never twice
 * at once), and Apple's own revocation notification (apple.ts, an event, no
 * read needed).
 * Pure; apple.ts reads the credential state, session-provider.tsx signs out
 * by the R3 rule (after uploads). Never logs or stores the Apple user id.
 */

import type { PendingUploads } from './machine.logic';
export const REVOCATION_MIN_GAP_MS = 60_000;

export type RevocationGate = {
  /** The app came to the foreground. */
  onForeground(): Promise<void>;
};

export function createRevocationGate(deps: {
  check: () => Promise<boolean>;
  onRevoked: () => void | Promise<void>;
  now: () => number;
  minGapMs?: number;
}): RevocationGate {
  const gap = deps.minGapMs ?? REVOCATION_MIN_GAP_MS;
  let last = Number.NEGATIVE_INFINITY;
  let running: Promise<void> | null = null;
  const run = (): Promise<void> => {
    if (running) return running;
    if (deps.now() - last < gap) return Promise.resolve();
    last = deps.now();
    running = deps
      .check()
      .then(async (revoked) => {
        if (revoked) await deps.onRevoked();
      })
      .catch(() => {}) // unknown is not revoked: never sign a person out on a failed read
      .finally(() => {
        running = null;
      });
    return running;
  };
  return { onForeground: run };
}

/**
 * What a signed-in user sets up: the gate, a foreground listener and Apple's
 * notification listener. Returns the function that removes all of them (sign-out).
 * A revocation dispatches the sign-out request with the count of letters still
 * waiting to upload, read at that moment (the R3 rule: sign-out waits for them).
 */
export function startAppleRevocationWatch(deps: {
  check: () => Promise<boolean>;
  /** A revoked Apple ID ends only an Apple session; an email session is never signed out by it. */
  isAppleSession: () => Promise<boolean>;
  pendingUploads: () => Promise<PendingUploads | number>;
  dispatchSignOut: (pendingUploads: PendingUploads | number) => void;
  onAppActive: (listener: () => void) => () => void;
  onAppleRevoked: (listener: () => void) => () => void;
  now: () => number;
}): () => void {
  let alive = true;
  const signOut = async () => {
    if (!(await deps.isAppleSession().catch(() => false))) return;
    // BL-1425: a queue that cannot be read is unknown, which sign-out treats as unsynced.
    const n = await deps.pendingUploads().catch((): PendingUploads => ({ kind: 'unknown' }));
    if (alive) deps.dispatchSignOut(n);
  };
  const gate = createRevocationGate({ check: deps.check, onRevoked: signOut, now: deps.now });
  void gate.onForeground();
  const offApp = deps.onAppActive(() => void gate.onForeground());
  const offApple = deps.onAppleRevoked(() => void signOut());
  return () => {
    alive = false;
    offApp();
    offApple();
  };
}

/** True when the session's sign-in provider is Apple (Supabase `app_metadata.provider`). Email and Google sessions are not. */
export function isAppleSession(session: { user?: { app_metadata?: { provider?: unknown } } } | null | undefined): boolean {
  return session?.user?.app_metadata?.provider === 'apple';
}

/** Calls `listener` each time the app becomes active. `subscribe` is AppState.addEventListener in the app. Returns the remover. */
export function onAppBecameActive(
  subscribe: (event: 'change', handler: (state: string) => void) => { remove: () => void },
  listener: () => void,
): () => void {
  const sub = subscribe('change', (st) => {
    if (st === 'active') listener();
  });
  return () => sub.remove();
}
