/// <reference types="node" />
/**
 * [BL-597] `forceReauthEpoch` is acted on (LEGAL-REQ-040, F02-REQ-023).
 * Given the epoch raised, when the app next reads remote config, then a signed-in phone signs out locally
 * (after its queued letters are up) and keeps its letters. A phone that is signed out, or that
 * is still restoring a session, does not skip the sign-out by writing the number early.
 * What these tests cannot show: two real phones and a real refresh failing. That is a device row in
 * docs/ops/runbooks/sign-everyone-out.md (NOT RUN).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { authReducer, shouldFinishSignOut, type AuthState } from '../src/lib/auth/machine.logic';
import { decideReauth, parseSeenEpoch, reauthPhaseOf, reauthStep, REAUTH_EPOCH_KEY } from '../src/lib/auth/reauth.logic';

const ready: AuthState = { status: 'ready', userId: '0192f0aa-0000-7000-8000-000000000001', sync: 'on' } as AuthState;
const provider = readFileSync(join(__dirname, '../src/lib/auth/session-provider.tsx'), 'utf8');

describe('[BL-597] decideReauth', () => {
  it('signs a signed-in phone out when the epoch is above the one it last acted on', () => {
    expect(decideReauth({ remoteEpoch: 1, seenEpoch: 0, phase: 'signedIn' })).toBe('sign_out');
    expect(decideReauth({ remoteEpoch: 3, seenEpoch: null, phase: 'signedIn' })).toBe('sign_out');
  });
  it('does nothing at the same or a lower epoch, so it happens once per epoch and a lowered number signs no one out', () => {
    expect(decideReauth({ remoteEpoch: 2, seenEpoch: 2, phase: 'signedIn' })).toBe('none');
    expect(decideReauth({ remoteEpoch: 1, seenEpoch: 2, phase: 'signedIn' })).toBe('none');
    expect(decideReauth({ remoteEpoch: 0, seenEpoch: null, phase: 'signedIn' })).toBe('none');
  });
  it('only notes the number while signed out, never while a session is being restored', () => {
    expect(decideReauth({ remoteEpoch: 5, seenEpoch: 0, phase: 'signedOut' })).toBe('record');
    expect(decideReauth({ remoteEpoch: 5, seenEpoch: 0, phase: 'other' })).toBe('none');
  });
  it('treats a damaged stored note as 0 and refuses a non-integer remote value', () => {
    expect(parseSeenEpoch(null)).toBe(0);
    expect(parseSeenEpoch('abc')).toBe(0);
    expect(parseSeenEpoch('-4')).toBe(0);
    expect(parseSeenEpoch('7')).toBe(7);
    expect(decideReauth({ remoteEpoch: 1.5, seenEpoch: 0, phase: 'signedIn' })).toBe('none');
  });
});

describe('[BL-597] reauthStep: what the provider effect does', () => {
  it('asks for a sign-out and writes NO number at request time (a sign-out that never finished must run again)', () => {
    const step = reauthStep({ remoteEpoch: 4, storedRaw: '3', phase: 'signedIn' });
    expect(step).toEqual({ record: null, signOut: true });
  });
  it('writes the number, and asks for no sign-out, while signed out', () => {
    expect(reauthStep({ remoteEpoch: 4, storedRaw: null, phase: 'signedOut' })).toEqual({ record: 4, signOut: false });
  });
  it('does nothing while restoring or at an epoch already acted on', () => {
    expect(reauthStep({ remoteEpoch: 4, storedRaw: '3', phase: 'other' })).toEqual({ record: null, signOut: false });
    expect(reauthStep({ remoteEpoch: 4, storedRaw: '4', phase: 'signedIn' })).toEqual({ record: null, signOut: false });
    expect(reauthStep({ remoteEpoch: 4, storedRaw: 'junk', phase: 'signedOut' }).record).toBe(4);
  });
  it('a person who signs in by hand has the number noted, so the new session is not signed out', () => {
    expect(reauthStep({ remoteEpoch: 4, storedRaw: null, phase: 'justSignedIn' })).toEqual({ record: 4, signOut: false });
    // and the next look, now plainly signed in, finds nothing to do
    expect(reauthStep({ remoteEpoch: 4, storedRaw: '4', phase: 'signedIn' }).signOut).toBe(false);
  });
  it('maps a hand sign-in to justSignedIn, but a restored session to signedIn', () => {
    expect(reauthPhaseOf('checkingConsent', true, 'signingIn')).toBe('justSignedIn');
    expect(reauthPhaseOf('checkingConsent', true, 'awaitingCode')).toBe('justSignedIn');
    expect(reauthPhaseOf('checkingConsent', true, 'restoring')).toBe('signedIn');
    expect(reauthPhaseOf('ready', true, 'checkingConsent')).toBe('signedIn');
    expect(reauthPhaseOf('signedOut', false, 'signingOut')).toBe('signedOut');
    for (const s of ['restoring', 'signingIn', 'awaitingCode']) expect(reauthPhaseOf(s, false, null)).toBe('other');
  });
});

describe('[BL-597] the sign-out it asks for', () => {
  it('signs out at once during consent checks, since nothing can be queued yet', () => {
    const checking = authReducer({ status: 'restoring' } as AuthState, { type: 'RESTORED', userId: ready.status === 'ready' ? ready.userId : '' });
    expect(checking.status).toBe('checkingConsent');
    const out = authReducer(checking, { type: 'SIGN_OUT_REQUESTED', reason: 'force_reauth', pendingUploads: 3 });
    expect(out.status === 'signingOut' && out.reason).toBe('force_reauth');
    expect(shouldFinishSignOut(out)).toBe(true);
    const needs = { status: 'needsConsent', userId: 'u', method: 'email', steps: ['age'] } as unknown as AuthState;
    const out2 = authReducer(needs, { type: 'SIGN_OUT_REQUESTED', reason: 'force_reauth', pendingUploads: 3 });
    expect(out2.status).toBe('signingOut');
    expect(shouldFinishSignOut(out2)).toBe(true);
  });
  it('waits for queued letters, cannot be cancelled, then finishes', () => {
    const waiting = authReducer(ready, { type: 'SIGN_OUT_REQUESTED', reason: 'force_reauth', pendingUploads: 2 });
    expect(waiting.status === 'signingOut' && waiting.reason).toBe('force_reauth');
    expect(waiting.status === 'signingOut' && waiting.waitingForUploads).toBe(true);
    expect(authReducer(waiting, { type: 'SIGN_OUT_WAIT_CANCELLED' })).toEqual(waiting);
    const drained = authReducer(waiting, { type: 'UPLOADS_DRAINED' });
    expect(shouldFinishSignOut(drained)).toBe(true);
    expect(authReducer(drained, { type: 'SIGNED_OUT' })).toEqual({ status: 'signedOut' });
  });
  it('signs out at once when nothing is queued', () => {
    expect(shouldFinishSignOut(authReducer(ready, { type: 'SIGN_OUT_REQUESTED', reason: 'force_reauth', pendingUploads: 0 }))).toBe(true);
  });
});

describe('[BL-597] the provider reads the epoch and keeps the letters', () => {
  it('reads forceReauthEpoch from remote config and asks for a force_reauth sign-out', () => {
    expect(provider).toContain('useRemoteConfig().forceReauthEpoch');
    expect(provider).toContain("reason: 'force_reauth'");
    expect(provider).toContain('REAUTH_EPOCH_KEY');
    expect(provider).toContain('reauthStep(');
    expect(REAUTH_EPOCH_KEY).toBe('auth.reauth_epoch_seen');
  });
  it('ends the session locally and deletes no letters in the finishing step', () => {
    const finishing = provider.slice(provider.indexOf('const finishing = shouldFinishSignOut(state)'), provider.indexOf('// An under-18 answer'));
    expect(finishing).toContain("signOut({ scope: 'local' })");
    expect(finishing).not.toMatch(/delete|DELETE|wipe|erase|clearAll/);
  });
});
