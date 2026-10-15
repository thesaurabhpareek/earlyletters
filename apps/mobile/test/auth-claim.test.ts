/**
 * BL-347 claim gate (F02-REQ-019, F02 6.2 step 6): local letters move to an
 * account only after the masked-email screen and a tap. claim.logic.ts decides
 * when the screen is needed; auth-store.ts keeps the sync layer blind until
 * the claim is settled. Also A-REQ-033 with the gate in place.
 * Fixtures: the fictional family Asha only.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { currentAuthUserId, onSignedIn, publishAuth, publishClaim, syncAllowed } from '../src/lib/auth/auth-store';
import { claimDecision, maskEmail } from '../src/lib/auth/claim.logic';
import { authReducer, initialAuthState, type AuthState } from '../src/lib/auth/machine.logic';

const ASHA_PARENT = '11111111-1111-4111-8111-111111111111';
const ASHA_COPARENT = '22222222-2222-4222-8222-222222222222';

afterEach(() => {
  publishAuth({ status: 'signedOut' });
});

describe('claim.logic: when the claim screen is needed', () => {
  const base = { userId: ASHA_PARENT, owner: null, confirmedFor: null, hasUnclaimedData: true };

  it('[F02-REQ-019] a phone with letters no account owns asks before anything moves', () => {
    expect(claimDecision(base)).toBe('ask');
  });

  it('[F02-REQ-019] settled when this account already owns the letters, or the person already tapped', () => {
    expect(claimDecision({ ...base, owner: ASHA_PARENT })).toBe('settled');
    expect(claimDecision({ ...base, confirmedFor: ASHA_PARENT })).toBe('settled');
  });

  it('[F02-REQ-019] a tap for one account does not carry over to another', () => {
    expect(claimDecision({ ...base, confirmedFor: ASHA_COPARENT })).toBe('ask');
  });

  it('[F02-REQ-019] nothing to move means no screen', () => {
    expect(claimDecision({ ...base, hasUnclaimedData: false })).toBe('settled');
  });

  it('letters owned by another account stay put: re-ownership refuses (AccountMismatchError), so no screen', () => {
    expect(claimDecision({ ...base, owner: ASHA_COPARENT })).toBe('settled');
  });

  it('[F02-REQ-019] the screen shows a masked address, never the whole one', () => {
    expect(maskEmail('asha.parent@example.invalid')).toBe('a***@example.invalid');
    expect(maskEmail(' A@example.invalid ')).toBe('A***@example.invalid');
    expect(maskEmail('abc123@privaterelay.appleid.com')).toBe('a***@privaterelay.appleid.com');
    expect(maskEmail(null)).toBeNull();
    expect(maskEmail('no-at-sign')).toBeNull();
    expect(maskEmail('@example.invalid')).toBeNull();
    expect(maskEmail('asha@')).toBeNull();
  });
});

describe('auth-store: the sync layer sees an account only after the claim', () => {
  const ready: AuthState = { status: 'ready', userId: ASHA_PARENT, sync: 'on' };

  it('[F02-REQ-019] SIGNED_IN alone runs no re-ownership; the tap runs it once', () => {
    const claims: string[] = [];
    const off = onSignedIn((id) => claims.push(id));
    publishAuth({ status: 'checkingConsent', userId: ASHA_PARENT, method: 'email' });
    publishAuth(ready);
    expect(claims).toEqual([]);
    expect(syncAllowed()).toBe(false);
    publishClaim(ASHA_PARENT); // Keep them here
    expect(claims).toEqual([ASHA_PARENT]);
    expect(currentAuthUserId()).toBe(ASHA_PARENT);
    expect(syncAllowed()).toBe(true);
    // Supabase repeats SIGNED_IN on foreground and refresh: still once.
    publishAuth({ ...ready });
    publishClaim(ASHA_PARENT);
    expect(claims).toEqual([ASHA_PARENT]);
    off();
  });

  it('[F02-REQ-019] consent comes first: a claim for an account still in consent does not start sync', () => {
    publishAuth({ status: 'needsConsent', userId: ASHA_PARENT, method: 'apple', steps: ['sensitive'] });
    publishClaim(ASHA_PARENT);
    expect(syncAllowed()).toBe(false);
  });

  it('[F02-REQ-019] a claim for one account is not a claim for the next one signed in', () => {
    publishAuth(ready);
    publishClaim(ASHA_PARENT);
    publishAuth({ status: 'ready', userId: ASHA_COPARENT, sync: 'on' });
    expect(currentAuthUserId()).toBeNull();
    expect(syncAllowed()).toBe(false);
  });

  it('[F02-REQ-019] signing out clears the claim', () => {
    publishAuth(ready);
    publishClaim(ASHA_PARENT);
    publishAuth({ status: 'signedOut' });
    publishAuth(ready);
    expect(currentAuthUserId()).toBeNull();
  });

  it('[A-REQ-033] Apple revoked at launch: a claimed account keeps syncing until its letters are up, then signs out', () => {
    let s: AuthState = authReducer(initialAuthState, { type: 'RESTORED', userId: ASHA_PARENT });
    publishAuth(s);
    publishClaim(ASHA_PARENT); // owner already this account
    s = authReducer(s, { type: 'GATE_LOADED', gate: { termsCurrent: true, ageAttested: true, sensitiveData: true, contentAllowed: true }, sensitiveDeclined: false });
    s = authReducer(s, { type: 'SIGN_OUT_REQUESTED', reason: 'apple_revoked', pendingUploads: 3 });
    publishAuth(s);
    expect(s.status).toBe('signingOut');
    expect(syncAllowed()).toBe(true); // the queue drains first
    s = authReducer(s, { type: 'UPLOADS_DRAINED' });
    publishAuth(s);
    expect(syncAllowed()).toBe(false);
    s = authReducer(s, { type: 'SIGNED_OUT' });
    publishAuth(s);
    expect(s).toEqual({ status: 'signedOut' });
  });

  it('[A-REQ-033] an unclaimed account has nothing queued, so a revoked credential signs out at once', () => {
    let s: AuthState = { status: 'ready', userId: ASHA_PARENT, sync: 'on' };
    publishAuth(s);
    // The provider passes 0 pending uploads while unclaimed (session-provider requestSignOut).
    s = authReducer(s, { type: 'SIGN_OUT_REQUESTED', reason: 'apple_revoked', pendingUploads: 0 });
    expect(s).toMatchObject({ status: 'signingOut', waitingForUploads: false });
  });
});
