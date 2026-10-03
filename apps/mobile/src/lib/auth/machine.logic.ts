/**
 * The account state machine (PRD A F3 to F6, TDD 04 3.2.2). Pure: no React
 * Native, no Supabase, so test/auth-machine.test.ts runs it in Node. The
 * session provider (session-provider.tsx) feeds it events from Supabase Auth,
 * the sign-in screens and the consent sheets, and renders from its state.
 *
 * Local-first: before an account exists the app is fully usable
 * (`signedOut`). Signing in never deletes or blocks local letters. Syncing
 * starts only in `ready` with `sync: 'on'`, which needs a current Terms
 * acceptance with the age attestation and sensitive-data consent on the server
 * (LEGAL-REQ-001, -002, -006; `my_sync_gate()`). Declining sensitive-data keeps
 * an adult signed in with letters on this phone (`sync: 'off'`).
 *
 * Nothing here holds an email address, a token or a name (LEGAL-REQ-014).
 */

export type AuthMethod = 'apple' | 'google' | 'email' | 'passkey';

/** The sheets shown after sign-in, in order. 'age' only when Terms are current but the attestation is missing. */
export type ConsentStep = 'terms' | 'age' | 'sensitive';

/** What `my_sync_gate()` returns, camel-cased. */
export interface SyncGate {
  termsCurrent: boolean;
  ageAttested: boolean;
  sensitiveData: boolean;
  contentAllowed: boolean;
}

export type AuthErrorKind =
  | 'cancelled'
  | 'network'
  | 'expired'
  | 'wrong_code'
  | 'code_paused'
  | 'rate_limited'
  | 'invalid_email'
  | 'not_available'
  | 'provider'
  | 'session_expired'
  | 'under_18'
  | 'consent_unavailable'
  | 'unknown';

export type SignOutReason = 'user' | 'apple_revoked' | 'switch_account';

/** 'on': sync may run. 'off': signed in, letters stay on this phone. 'unknown': not checked yet (offline at launch). */
export type SyncMode = 'on' | 'off' | 'unknown';

export type AuthState =
  | { status: 'restoring' }
  | { status: 'signedOut'; error?: AuthErrorKind }
  | { status: 'signingIn'; method: AuthMethod }
  | { status: 'awaitingCode'; sentAt: number; error?: AuthErrorKind }
  | { status: 'checkingConsent'; userId: string; method: AuthMethod | null }
  | { status: 'needsConsent'; userId: string; method: AuthMethod | null; steps: ConsentStep[]; error?: AuthErrorKind }
  | { status: 'ready'; userId: string; sync: SyncMode }
  | { status: 'signingOut'; userId: string; reason: SignOutReason; waitingForUploads: boolean; sync: SyncMode };

export type AuthEvent =
  /** Session read from the Keychain at launch (never waits for the network). */
  | { type: 'RESTORED'; userId: string | null }
  | { type: 'START'; method: AuthMethod }
  | { type: 'CANCELLED' }
  | { type: 'FAILED'; error: AuthErrorKind }
  | { type: 'EMAIL_SENT'; at: number }
  /** A session now exists (provider token exchange, email link or code, passkey). */
  | { type: 'SIGNED_IN'; userId: string; method: AuthMethod | null }
  | { type: 'GATE_LOADED'; gate: SyncGate; sensitiveDeclined: boolean }
  /** The gate could not be read (offline, server error). Signed in, sync waits. */
  | { type: 'GATE_UNAVAILABLE' }
  | { type: 'CONSENT_RECORDED'; step: ConsentStep; accepted: boolean }
  | { type: 'CONSENT_FAILED'; error: AuthErrorKind }
  | { type: 'SIGN_OUT_REQUESTED'; reason: SignOutReason; pendingUploads: number }
  | { type: 'UPLOADS_DRAINED' }
  | { type: 'SIGNED_OUT' }
  /** The refresh token was rejected or revoked elsewhere. Local letters stay; the queue is kept. */
  | { type: 'SESSION_LOST' };

export const initialAuthState: AuthState = { status: 'restoring' };

/**
 * Consent steps still needed. The Terms sheet carries the 18+ confirmation
 * line, so it records the attestation too; the separate 'age' sheet appears
 * only when Terms are already current without it. A recorded decline of
 * sensitive-data is respected: the person turns sync on from Settings.
 */
export function consentSteps(gate: SyncGate, sensitiveDeclined: boolean): ConsentStep[] {
  const steps: ConsentStep[] = [];
  if (!gate.termsCurrent) steps.push('terms');
  else if (!gate.ageAttested) steps.push('age');
  if (!gate.sensitiveData && !sensitiveDeclined) steps.push('sensitive');
  return steps;
}

function afterGate(s: { userId: string; method: AuthMethod | null }, gate: SyncGate, declined: boolean): AuthState {
  const steps = consentSteps(gate, declined);
  if (steps.length > 0) return { status: 'needsConsent', userId: s.userId, method: s.method, steps };
  return { status: 'ready', userId: s.userId, sync: gate.contentAllowed ? 'on' : 'off' };
}

export function authReducer(state: AuthState, event: AuthEvent): AuthState {
  switch (event.type) {
    case 'RESTORED':
      if (state.status !== 'restoring') return state;
      return event.userId ? { status: 'checkingConsent', userId: event.userId, method: null } : { status: 'signedOut' };

    case 'START':
      if (state.status === 'signedOut' || state.status === 'awaitingCode' || state.status === 'signingIn') {
        return { status: 'signingIn', method: event.method };
      }
      return state;

    case 'CANCELLED':
      if (state.status === 'signingIn' || state.status === 'awaitingCode') return { status: 'signedOut' };
      return state;

    case 'FAILED':
      // A cancel is silent (A-REQ-031): back to signed out with no message.
      if (state.status === 'signingIn') return event.error === 'cancelled' ? { status: 'signedOut' } : { status: 'signedOut', error: event.error };
      // A wrong or expired code keeps the person on the code screen with the message.
      if (state.status === 'awaitingCode') return { ...state, error: event.error };
      return state;

    case 'EMAIL_SENT':
      if (state.status === 'signingIn' && state.method === 'email') return { status: 'awaitingCode', sentAt: event.at };
      if (state.status === 'awaitingCode') return { status: 'awaitingCode', sentAt: event.at };
      return state;

    case 'SIGNED_IN': {
      // Supabase repeats SIGNED_IN for the same user (foreground, refresh); keep the current state.
      if ('userId' in state && state.userId === event.userId && state.status !== 'signingOut') return state;
      if (state.status === 'signingOut' && state.userId === event.userId) return state;
      const method = event.method ?? (state.status === 'signingIn' ? state.method : null);
      return { status: 'checkingConsent', userId: event.userId, method };
    }

    case 'GATE_LOADED':
      if (state.status === 'checkingConsent' || state.status === 'needsConsent') {
        return afterGate(state, event.gate, event.sensitiveDeclined);
      }
      // Re-checked on foreground: a new Terms version or a consent withdrawn elsewhere pauses sync here too.
      if (state.status === 'ready') return afterGate({ userId: state.userId, method: null }, event.gate, event.sensitiveDeclined);
      return state;

    case 'GATE_UNAVAILABLE':
      if (state.status === 'checkingConsent') return { status: 'ready', userId: state.userId, sync: 'unknown' };
      return state;

    case 'CONSENT_RECORDED': {
      if (state.status !== 'needsConsent') return state;
      // An under-18 answer ends the session on this phone; the provider closes the 18+ gate (LEGAL-REQ-002).
      if (event.step === 'age' && !event.accepted) return { status: 'signedOut', error: 'under_18' };
      // Terms are never declined in the UI ("Not now" only closes the sheet), so they stay needed.
      if (event.step === 'terms' && !event.accepted) return state;
      const steps = state.steps.filter((s) => s !== event.step);
      if (steps.length > 0) return { ...state, steps, error: undefined };
      const sync: SyncMode = event.step === 'sensitive' && !event.accepted ? 'off' : 'on';
      return { status: 'ready', userId: state.userId, sync };
    }

    case 'CONSENT_FAILED':
      if (state.status === 'needsConsent') return { ...state, error: event.error };
      return state;

    case 'SIGN_OUT_REQUESTED': {
      if (state.status !== 'ready' && state.status !== 'needsConsent' && state.status !== 'checkingConsent') return state;
      const sync: SyncMode = state.status === 'ready' ? state.sync : 'off';
      // Never discard unsynced letters (PRD A F6.4, A-REQ-033): wait while uploads are queued and sync can run.
      const waiting = event.pendingUploads > 0 && sync !== 'off';
      return { status: 'signingOut', userId: state.userId, reason: event.reason, waitingForUploads: waiting, sync };
    }

    case 'UPLOADS_DRAINED':
      if (state.status === 'signingOut' && state.waitingForUploads) return { ...state, waitingForUploads: false };
      return state;

    case 'SIGNED_OUT':
      if (state.status === 'signedOut') return state;
      if (state.status === 'signingOut') return { status: 'signedOut' };
      if (state.status === 'restoring' || state.status === 'signingIn' || state.status === 'awaitingCode') return { status: 'signedOut' };
      // Signed out without asking (revoked elsewhere): say so calmly.
      return { status: 'signedOut', error: 'session_expired' };

    case 'SESSION_LOST':
      if (isSignedIn(state)) return { status: 'signedOut', error: 'session_expired' };
      return state;
  }
}

/** A session exists on this phone. */
export function isSignedIn(s: AuthState): s is Extract<AuthState, { userId: string }> {
  return s.status === 'checkingConsent' || s.status === 'needsConsent' || s.status === 'ready' || s.status === 'signingOut';
}

export function authUserId(s: AuthState): string | null {
  return isSignedIn(s) ? s.userId : null;
}

/**
 * The one switch the sync engine reads. True only when consent is complete;
 * also true while a requested sign-out waits for queued letters to upload.
 */
export function canSync(s: AuthState): boolean {
  if (s.status === 'ready') return s.sync === 'on';
  if (s.status === 'signingOut') return s.waitingForUploads && s.sync === 'on';
  return false;
}

/** The provider should call Supabase signOut now (nothing left to upload, or sync could never run). */
export function shouldFinishSignOut(s: AuthState): boolean {
  return s.status === 'signingOut' && !s.waitingForUploads;
}

/** Server features (invites, family) need a finished consent. */
export function needsConsent(s: AuthState): boolean {
  return s.status === 'needsConsent';
}
