/**
 * Settings > Account's rows for each account state (EXPERIENCE_PASS S56, package P8a; components/auth/account-view.logic.ts),
 * driven through the real state machine (lib/auth/machine.logic.ts, S01's), so the states are the ones the app reaches.
 *
 * S56: "Sign out never drops a queued letter: it waits for the outbox (F16) and says so." The waiting itself is the
 * machine's (test/auth-machine.test.ts); "says so" is this: while the outbox drains, the Sign out row is the waiting
 * line, and only then. LEGAL-REQ-006: "Agree and sync" is offered only to a person who declined, and it opens the
 * sensitive-data step (account.tsx); it is never a one-tap consent.
 */
import { describe, expect, it } from 'vitest';
import { accountView } from '../src/components/auth/account-view.logic';
import { authReducer, initialAuthState, type AuthEvent, type AuthState, type SyncGate } from '../src/lib/auth/machine.logic';

const U = '11111111-1111-4111-8111-111111111111';
const FULL: SyncGate = { termsCurrent: true, ageAttested: true, sensitiveData: true, contentAllowed: true };
const run = (events: AuthEvent[], from: AuthState = initialAuthState) => events.reduce(authReducer, from);
const ready = () => run([{ type: 'RESTORED', userId: U }, { type: 'GATE_LOADED', gate: FULL, sensitiveDeclined: false }]);

describe('[S56] the Sign out row says when it is waiting for queued letters', () => {
  it('signed in with nothing queued: Sign out, ready', () => {
    expect(accountView(ready(), false).signOut).toBe('ready');
  });

  it('a sign-out with letters still queued: the waiting line, and sync still on', () => {
    const waiting = authReducer(ready(), { type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: 2 });
    expect(waiting.status).toBe('signingOut');
    const view = accountView(waiting, false);
    expect(view.signOut).toBe('waiting');
    expect(view.sync).toBe('on');
  });

  it('once the outbox has drained the row stops saying it is waiting, and the sign-out finishes', () => {
    const waiting = authReducer(ready(), { type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: 1 });
    const drained = authReducer(waiting, { type: 'UPLOADS_DRAINED' });
    expect(accountView(drained, false).signOut).toBe('closing');
    expect(accountView(authReducer(drained, { type: 'SIGNED_OUT' }), false).signOut).toBe('ready');
  });

  it('a sign-out with nothing queued never says it is waiting', () => {
    const now = authReducer(ready(), { type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: 0 });
    expect(accountView(now, false).signOut).toBe('closing');
  });
});

describe('[S56] [S55] the Sync rows', () => {
  it('consent missing: "Not set up yet" and Finish setting up, never Agree and sync', () => {
    const missing = run([{ type: 'RESTORED', userId: U }, { type: 'GATE_LOADED', gate: { ...FULL, termsCurrent: false, contentAllowed: false }, sensitiveDeclined: false }]);
    expect(missing.status).toBe('needsConsent');
    expect(accountView(missing, false)).toMatchObject({ sync: 'waiting', finishSetup: true, offerSync: false });
  });

  it('the claim screen never answered (BL-347): "Not set up yet" and Finish setting up', () => {
    expect(accountView(ready(), true)).toMatchObject({ sync: 'waiting', finishSetup: true, offerSync: false });
  });

  it('declined ("Keep on this phone"): Off, and Agree and sync is offered, which opens the sensitive-data step', () => {
    const declined = run(
      [
        { type: 'RESTORED', userId: U },
        { type: 'GATE_LOADED', gate: { ...FULL, sensitiveData: false, contentAllowed: false }, sensitiveDeclined: false },
        { type: 'CONSENT_RECORDED', step: 'sensitive', accepted: false },
      ],
    );
    expect(declined).toMatchObject({ status: 'ready', sync: 'off' });
    expect(accountView(declined, false)).toMatchObject({ sync: 'off', finishSetup: false, offerSync: true });
  });

  it('on: On, and nothing else to do', () => {
    expect(accountView(ready(), false)).toEqual({ sync: 'on', finishSetup: false, offerSync: false, signOut: 'ready' });
  });

  it('offline at launch: waiting for a connection', () => {
    const offline = run([{ type: 'RESTORED', userId: U }, { type: 'GATE_UNAVAILABLE' }]);
    expect(accountView(offline, false)).toMatchObject({ sync: 'unknown', offerSync: false, finishSetup: false });
  });
});
