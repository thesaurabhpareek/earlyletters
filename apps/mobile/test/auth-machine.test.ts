import { AuthRetryableFetchError, createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import {
  authReducer,
  authUserId,
  canSync,
  consentSteps,
  initialAuthState,
  isSignedIn,
  shouldFinishSignOut,
  type AuthEvent,
  type AuthState,
  type SyncGate,
} from '../src/lib/auth/machine.logic';
import { authErrorKind, codeEntryPause, looksLikeEmail, normaliseCode } from '../src/lib/auth/errors.logic';
import { authErrorMessage } from '../src/lib/auth/messages';

const U = '0192f0aa-0000-7000-8000-000000000001';
const OTHER = '0192f0aa-0000-7000-8000-000000000002';
const FULL: SyncGate = { termsCurrent: true, ageAttested: true, sensitiveData: true, contentAllowed: true };
const NEW_ACCOUNT: SyncGate = { termsCurrent: false, ageAttested: false, sensitiveData: false, contentAllowed: false };

const run = (events: AuthEvent[], from: AuthState = initialAuthState): AuthState => events.reduce(authReducer, from);

describe('auth state machine: launch', () => {
  it('[A-REQ-014] no stored session means local-first, signed out, never syncing', () => {
    const s = run([{ type: 'RESTORED', userId: null }]);
    expect(s).toEqual({ status: 'signedOut' });
    expect(canSync(s)).toBe(false);
    expect(isSignedIn(s)).toBe(false);
  });

  it('[A-REQ-032] a stored session restores signed in, then checks consent before any sync', () => {
    const s = run([{ type: 'RESTORED', userId: U }]);
    expect(s).toEqual({ status: 'checkingConsent', userId: U, method: null });
    expect(isSignedIn(s)).toBe(true);
    expect(canSync(s)).toBe(false);
  });

  it('[A-REQ-032] offline at launch: signed in, sync waits (unknown) instead of blocking', () => {
    const s = run([{ type: 'RESTORED', userId: U }, { type: 'GATE_UNAVAILABLE' }]);
    expect(s).toEqual({ status: 'ready', userId: U, sync: 'unknown' });
    expect(canSync(s)).toBe(false);
    const back = authReducer(s, { type: 'GATE_LOADED', gate: FULL, sensitiveDeclined: false });
    expect(back).toEqual({ status: 'ready', userId: U, sync: 'on' });
    expect(canSync(back)).toBe(true);
  });

  it('RESTORED after the machine has moved on is ignored (a deep link signed in first)', () => {
    const s = run([{ type: 'RESTORED', userId: null }, { type: 'START', method: 'apple' }, { type: 'RESTORED', userId: null }]);
    expect(s.status).toBe('signingIn');
  });
});

describe('auth state machine: signing in', () => {
  it('[A-REQ-016] Apple: start, session, consent check', () => {
    const s = run([{ type: 'RESTORED', userId: null }, { type: 'START', method: 'apple' }, { type: 'SIGNED_IN', userId: U, method: null }]);
    expect(s).toEqual({ status: 'checkingConsent', userId: U, method: 'apple' });
  });

  it('[A-REQ-031] a cancel is silent: no error, back to signed out', () => {
    const viaEvent = run([{ type: 'RESTORED', userId: null }, { type: 'START', method: 'google' }, { type: 'CANCELLED' }]);
    expect(viaEvent).toEqual({ status: 'signedOut' });
    const viaFailure = run([{ type: 'RESTORED', userId: null }, { type: 'START', method: 'apple' }, { type: 'FAILED', error: 'cancelled' }]);
    expect(viaFailure).toEqual({ status: 'signedOut' });
  });

  it('[A-REQ-031] a real failure carries its kind for the message', () => {
    const s = run([{ type: 'RESTORED', userId: null }, { type: 'START', method: 'google' }, { type: 'FAILED', error: 'network' }]);
    expect(s).toEqual({ status: 'signedOut', error: 'network' });
  });

  it('[A-REQ-018] email: link sent, then a wrong code keeps the code screen with its message', () => {
    const sent = run([{ type: 'RESTORED', userId: null }, { type: 'START', method: 'email' }, { type: 'EMAIL_SENT', at: 1000 }]);
    expect(sent).toEqual({ status: 'awaitingCode', sentAt: 1000 });
    const wrong = authReducer(sent, { type: 'FAILED', error: 'wrong_code' });
    expect(wrong).toEqual({ status: 'awaitingCode', sentAt: 1000, error: 'wrong_code' });
    const resent = authReducer(wrong, { type: 'EMAIL_SENT', at: 70_000 });
    expect(resent).toEqual({ status: 'awaitingCode', sentAt: 70_000 });
    const inside = authReducer(resent, { type: 'SIGNED_IN', userId: U, method: 'email' });
    expect(inside).toEqual({ status: 'checkingConsent', userId: U, method: 'email' });
  });

  it('[A-REQ-018] "Use a different email" leaves the code screen', () => {
    const s = run([{ type: 'RESTORED', userId: null }, { type: 'START', method: 'email' }, { type: 'EMAIL_SENT', at: 1 }, { type: 'CANCELLED' }]);
    expect(s).toEqual({ status: 'signedOut' });
  });

  it('[A-REQ-024] an expired link opened cold ends signed out with the expiry message', () => {
    const s = run([{ type: 'RESTORED', userId: null }, { type: 'START', method: 'email' }, { type: 'FAILED', error: 'expired' }]);
    expect(s).toEqual({ status: 'signedOut', error: 'expired' });
  });

  it('a repeated SIGNED_IN for the same user (token refresh, foreground) changes nothing', () => {
    const ready = run([{ type: 'RESTORED', userId: U }, { type: 'GATE_LOADED', gate: FULL, sensitiveDeclined: false }]);
    expect(authReducer(ready, { type: 'SIGNED_IN', userId: U, method: null })).toBe(ready);
  });

  it('a different user signing in starts a fresh consent check (never inherits sync)', () => {
    const ready = run([{ type: 'RESTORED', userId: U }, { type: 'GATE_LOADED', gate: FULL, sensitiveDeclined: false }]);
    const s = authReducer(ready, { type: 'SIGNED_IN', userId: OTHER, method: 'passkey' });
    expect(s).toEqual({ status: 'checkingConsent', userId: OTHER, method: 'passkey' });
    expect(canSync(s)).toBe(false);
  });
});

describe('auth state machine: consent after sign-in (LEGAL-REQ-001, -002, -006)', () => {
  it('a new account sees Terms (with the 18+ line) and then sensitive-data, in that order', () => {
    expect(consentSteps(NEW_ACCOUNT, false)).toEqual(['terms', 'sensitive']);
  });

  it('the separate age sheet shows only when Terms are current without the attestation', () => {
    expect(consentSteps({ ...FULL, ageAttested: false, contentAllowed: false }, false)).toEqual(['age']);
    expect(consentSteps({ termsCurrent: false, ageAttested: true, sensitiveData: true, contentAllowed: false }, false)).toEqual(['terms']);
  });

  it('a recorded decline of sensitive-data is not asked again', () => {
    expect(consentSteps({ ...FULL, sensitiveData: false, contentAllowed: false }, true)).toEqual([]);
  });

  it('accepting every step turns sync on; nothing syncs before the last one', () => {
    let s = run([{ type: 'RESTORED', userId: null }, { type: 'START', method: 'apple' }, { type: 'SIGNED_IN', userId: U, method: null }]);
    s = authReducer(s, { type: 'GATE_LOADED', gate: NEW_ACCOUNT, sensitiveDeclined: false });
    expect(s).toEqual({ status: 'needsConsent', userId: U, method: 'apple', steps: ['terms', 'sensitive'] });
    expect(canSync(s)).toBe(false);
    s = authReducer(s, { type: 'CONSENT_RECORDED', step: 'terms', accepted: true });
    expect(s.status === 'needsConsent' && s.steps).toEqual(['sensitive']);
    expect(canSync(s)).toBe(false);
    s = authReducer(s, { type: 'CONSENT_RECORDED', step: 'sensitive', accepted: true });
    expect(s).toEqual({ status: 'ready', userId: U, sync: 'on' });
    expect(canSync(s)).toBe(true);
  });

  it('[PRD A F3.4] declining sensitive-data keeps an adult signed in with letters on this phone', () => {
    const s = run([
      { type: 'RESTORED', userId: U },
      { type: 'GATE_LOADED', gate: { ...FULL, sensitiveData: false, contentAllowed: false }, sensitiveDeclined: false },
      { type: 'CONSENT_RECORDED', step: 'sensitive', accepted: false },
    ]);
    expect(s).toEqual({ status: 'ready', userId: U, sync: 'off' });
    expect(canSync(s)).toBe(false);
    expect(isSignedIn(s)).toBe(true);
  });

  it('closing the Terms sheet ("Not now") leaves Terms needed and sync off', () => {
    const before = run([{ type: 'RESTORED', userId: U }, { type: 'GATE_LOADED', gate: NEW_ACCOUNT, sensitiveDeclined: false }]);
    expect(authReducer(before, { type: 'CONSENT_RECORDED', step: 'terms', accepted: false })).toBe(before);
  });

  it('[LEGAL-REQ-002] answering No on the age sheet ends the session with the under-18 stop', () => {
    const s = run([
      { type: 'RESTORED', userId: U },
      { type: 'GATE_LOADED', gate: { ...FULL, ageAttested: false, contentAllowed: false }, sensitiveDeclined: false },
      { type: 'CONSENT_RECORDED', step: 'age', accepted: false },
    ]);
    expect(s).toEqual({ status: 'signedOut', error: 'under_18' });
  });

  it('a failed consent write stays on the sheet with a message, sync still off', () => {
    const s = run([
      { type: 'RESTORED', userId: U },
      { type: 'GATE_LOADED', gate: NEW_ACCOUNT, sensitiveDeclined: false },
      { type: 'CONSENT_FAILED', error: 'consent_unavailable' },
    ]);
    expect(s.status).toBe('needsConsent');
    expect(s.status === 'needsConsent' && s.error).toBe('consent_unavailable');
    expect(canSync(s)).toBe(false);
  });

  it('a new Terms version found on foreground pauses sync until accepted', () => {
    const ready = run([{ type: 'RESTORED', userId: U }, { type: 'GATE_LOADED', gate: FULL, sensitiveDeclined: false }]);
    const s = authReducer(ready, { type: 'GATE_LOADED', gate: { ...FULL, termsCurrent: false, contentAllowed: false }, sensitiveDeclined: false });
    expect(s).toEqual({ status: 'needsConsent', userId: U, method: null, steps: ['terms'] });
    expect(canSync(s)).toBe(false);
  });
});

describe('auth state machine: signing out never loses a letter (PRD A F6.4, A-REQ-033)', () => {
  const ready = run([{ type: 'RESTORED', userId: U }, { type: 'GATE_LOADED', gate: FULL, sensitiveDeclined: false }]);

  it('with letters still uploading, sign-out waits and sync keeps running', () => {
    const s = authReducer(ready, { type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: 3 });
    expect(s).toEqual({ status: 'signingOut', userId: U, reason: 'user', waitingForUploads: true, sync: 'on' });
    expect(canSync(s)).toBe(true);
    expect(shouldFinishSignOut(s)).toBe(false);
    const drained = authReducer(s, { type: 'UPLOADS_DRAINED' });
    expect(shouldFinishSignOut(drained)).toBe(true);
    expect(canSync(drained)).toBe(false);
    expect(authReducer(drained, { type: 'SIGNED_OUT' })).toEqual({ status: 'signedOut' });
  });

  it('with nothing queued, sign-out finishes at once', () => {
    const s = authReducer(ready, { type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: 0 });
    expect(shouldFinishSignOut(s)).toBe(true);
  });

  it('[A-REQ-033] Apple revoked: the same guard applies', () => {
    const s = authReducer(ready, { type: 'SIGN_OUT_REQUESTED', reason: 'apple_revoked', pendingUploads: 1 });
    expect(s.status === 'signingOut' && s.reason).toBe('apple_revoked');
    expect(s.status === 'signingOut' && s.waitingForUploads).toBe(true);
  });

  it('when sync could never run (consent declined), there is nothing to wait for', () => {
    const local = { status: 'ready', userId: U, sync: 'off' } as const;
    const s = authReducer(local, { type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: 9 });
    expect(shouldFinishSignOut(s)).toBe(true);
  });

  it('[TDD 04 3.2.2] a session revoked elsewhere: signed out with a calm sign-in-again message', () => {
    expect(authReducer(ready, { type: 'SESSION_LOST' })).toEqual({ status: 'signedOut', error: 'session_expired' });
    expect(authReducer(ready, { type: 'SIGNED_OUT' })).toEqual({ status: 'signedOut', error: 'session_expired' });
    expect(authUserId(authReducer(ready, { type: 'SESSION_LOST' }))).toBeNull();
  });
});

describe('auth error kinds', () => {
  it('maps cancels from Apple and passkeys to silence', () => {
    expect(authErrorKind({ code: 'ERR_REQUEST_CANCELED', message: 'The user canceled' }, 'provider')).toBe('cancelled');
    expect(authErrorKind({ error: 'UserCancelled', message: 'x' }, 'passkey')).toBe('cancelled');
  });

  it('maps Supabase Auth codes to messages the screens have', () => {
    expect(authErrorKind({ code: 'otp_expired', status: 403 }, 'code')).toBe('wrong_code');
    expect(authErrorKind({ code: 'otp_expired', status: 403 }, 'link')).toBe('expired');
    expect(authErrorKind({ code: 'over_email_send_rate_limit', status: 429 }, 'send')).toBe('rate_limited');
    expect(authErrorKind({ status: 429 }, 'send')).toBe('rate_limited');
    expect(authErrorKind({ code: 'email_address_invalid', status: 400 }, 'send')).toBe('invalid_email');
    expect(authErrorKind({ code: 'refresh_token_not_found' }, 'link')).toBe('session_expired');
    expect(authErrorKind({ name: 'AuthRetryableFetchError', message: 'Failed to fetch' }, 'send')).toBe('network');
    expect(authErrorKind(new TypeError('Network request failed'), 'provider')).toBe('network');
    expect(authErrorKind({ code: 'something_new' }, 'provider')).toBe('provider');
    expect(authErrorKind({ code: 'something_new' }, 'code')).toBe('unknown');
  });
});

describe('auth error kinds: a server that answered is not a connection that failed (BL-488, A-REQ-031)', () => {
  // The statuses @supabase/auth-js 2.117.2 wraps in AuthRetryableFetchError
  // (node_modules/@supabase/auth-js/src/lib/fetch.ts, NETWORK_ERROR_CODES): 500 to 504 and 520 to 530.
  const SERVER_ERRORS = [500, 501, 502, 503, 504, 520, 521, 522, 523, 524, 525, 526, 527, 528, 529, 530];
  const CONTEXTS = ['send', 'code', 'link', 'provider', 'passkey'] as const;
  const retryable = (status: number) => new AuthRetryableFetchError(`HTTP ${status}`, status);

  it('a thrown error with a 5xx status is never "network": the person is online and the server said no', () => {
    for (const status of SERVER_ERRORS) {
      for (const context of CONTEXTS) {
        expect(authErrorKind(retryable(status), context), `${status} in ${context}`).not.toBe('network');
        // The plain shape too (what a screen test or another client library throws).
        expect(authErrorKind({ name: 'AuthRetryableFetchError', message: 'x', status }, context), `${status} shape in ${context}`).not.toBe('network');
      }
    }
  });

  it('it reads as "That did not work this time", the provider kind for Apple, Google and passkeys, unknown for the email steps', () => {
    for (const status of SERVER_ERRORS) {
      expect(authErrorKind(retryable(status), 'provider'), String(status)).toBe('provider');
      expect(authErrorKind(retryable(status), 'passkey'), String(status)).toBe('provider');
      for (const context of ['send', 'code', 'link'] as const) expect(authErrorKind(retryable(status), context), `${status} in ${context}`).toBe('unknown');
    }
    for (const context of CONTEXTS) expect(authErrorMessage(authErrorKind(retryable(503), context))).toContain('That did not work this time.');
    // The old reading, which a 503 must no longer get.
    expect(authErrorMessage(authErrorKind(retryable(503), 'send'))).not.toMatch(/back online|Sign in/);
  });

  it('a failed fetch is still "network": status 0 (what auth-js gives it) or no status at all', () => {
    for (const context of CONTEXTS) {
      expect(authErrorKind(retryable(0), context), `status 0 in ${context}`).toBe('network');
      expect(authErrorKind({ name: 'AuthRetryableFetchError', message: 'Failed to fetch', status: 0 }, context), `plain 0 in ${context}`).toBe('network');
      expect(authErrorKind({ name: 'AuthRetryableFetchError', message: 'Failed to fetch' }, context), `no status in ${context}`).toBe('network');
      expect(authErrorKind(new TypeError('Network request failed'), context), `TypeError in ${context}`).toBe('network');
    }
    expect(authErrorMessage(authErrorKind(retryable(0), 'send'))).toContain('back online');
    // The line is exactly 500 (BL-488): a status below it keeps the reading it had.
    expect(authErrorKind({ name: 'AuthRetryableFetchError', message: 'x', status: 499 }, 'send')).toBe('network');
  });

  it('holds against the pinned auth-js itself: a 503 answer is not "network", a rejected fetch is, a 429 stays rate_limited', async () => {
    const auth = (fetchImpl: typeof fetch) =>
      createClient('https://asha-fixture.supabase.co', 'sb_publishable_asha_fixture', {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        global: { fetch: fetchImpl },
      }).auth;
    const email = 'asha.parent@example.com';
    const answered = (status: number) => auth(async () => new Response(JSON.stringify({ message: 'Service unavailable' }), { status, headers: { 'content-type': 'application/json' } }));
    const rejected = auth(async () => {
      throw new TypeError('Network request failed');
    });

    const server = (await answered(503).signInWithOtp({ email })).error;
    expect(server).toBeInstanceOf(AuthRetryableFetchError);
    expect(server?.status).toBe(503);
    expect(authErrorKind(server, 'send')).toBe('unknown');

    const gateway = (await answered(502).signInWithOtp({ email })).error;
    expect(authErrorKind(gateway, 'send')).toBe('unknown');

    const offline = (await rejected.signInWithOtp({ email })).error;
    expect(offline).toBeInstanceOf(AuthRetryableFetchError);
    expect(offline?.status).toBe(0);
    expect(authErrorKind(offline, 'send')).toBe('network');

    const limited = (await answered(429).signInWithOtp({ email })).error;
    expect(authErrorKind(limited, 'send')).toBe('rate_limited');
  });
});

describe('code entry (A-REQ-027)', () => {
  const MIN = 60_000;
  it('pauses for 15 minutes after five wrong codes within 15 minutes', () => {
    const t0 = 1_000_000;
    const four = [t0, t0 + MIN, t0 + 2 * MIN, t0 + 3 * MIN];
    expect(codeEntryPause(four, t0 + 4 * MIN).paused).toBe(false);
    const five = [...four, t0 + 4 * MIN];
    expect(codeEntryPause(five, t0 + 4 * MIN)).toEqual({ paused: true, until: t0 + 19 * MIN });
    expect(codeEntryPause(five, t0 + 19 * MIN).paused).toBe(false);
  });

  it('five wrong codes spread over more than 15 minutes do not pause', () => {
    const spread = [0, 4, 8, 12, 16].map((m) => m * MIN);
    expect(codeEntryPause(spread, 16 * MIN).paused).toBe(false);
  });

  it('normalises typed and pasted codes and checks email shape lightly', () => {
    expect(normaliseCode(' 123 456 ')).toBe('123456');
    expect(normaliseCode('123-456')).toBe('123456');
    expect(looksLikeEmail('asha.parent@example.com')).toBe(true);
    expect(looksLikeEmail('asha.parent@example')).toBe(false);
    expect(looksLikeEmail('not an email')).toBe(false);
  });
});
