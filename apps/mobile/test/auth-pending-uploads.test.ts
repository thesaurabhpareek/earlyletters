/// <reference types="node" />
/**
 * BL-1425: pendingUploads() returns a typed result. A probe that cannot be read is "unknown" and sign-out treats
 * unknown as unsynced (it waits), instead of the old 0 that let sign-out drop letters never uploaded. No probe
 * registered is still a real 0 (nothing can be queued then). cancelSignOutWait() stays the way out of a wait.
 * Fictional family "Asha" only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pendingUploads, registerUploadQueue, resetAuthStoreForTests } from '../src/lib/auth/auth-store';
import { startAppleRevocationWatch } from '../src/lib/auth/apple-revocation.logic';
import { authReducer, shouldFinishSignOut, signOutWouldWait, type AuthState } from '../src/lib/auth/machine.logic';

const READY_ON: AuthState = { status: 'ready', userId: 'user-asha', sync: 'on' };
const probeOf = (pendingCount: () => number | Promise<number>) => ({ pendingCount, onDrained: () => () => {} });
const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');

beforeEach(() => resetAuthStoreForTests());
afterEach(() => resetAuthStoreForTests());

describe('[BL-1425] pendingUploads() is typed, and unknown is unsynced', () => {
  it('a probe that throws reads as unknown, not 0', async () => {
    registerUploadQueue(probeOf(() => { throw new Error('store unreadable'); }));
    expect(await pendingUploads()).toEqual({ kind: 'unknown' });
  });

  it('a probe whose promise rejects reads as unknown too', async () => {
    registerUploadQueue(probeOf(() => Promise.reject(new Error('db closed'))));
    expect(await pendingUploads()).toEqual({ kind: 'unknown' });
  });

  it('no probe still reads 0 pending: nothing can be queued without a sync engine', async () => {
    expect(await pendingUploads()).toEqual({ kind: 'count', n: 0 });
    expect(signOutWouldWait(READY_ON, await pendingUploads())).toBe(false);
  });

  it('a probe that counts gives the count', async () => {
    registerUploadQueue(probeOf(() => 3));
    expect(await pendingUploads()).toEqual({ kind: 'count', n: 3 });
    registerUploadQueue(probeOf(async () => 0));
    expect(await pendingUploads()).toEqual({ kind: 'count', n: 0 });
  });

  it('sign-out with an unknown count waits (sync on), for every reason, and does not finish', async () => {
    registerUploadQueue(probeOf(() => { throw new Error('x'); }));
    const unknown = await pendingUploads();
    expect(signOutWouldWait(READY_ON, unknown)).toBe(true);
    for (const reason of ['user', 'apple_revoked', 'force_reauth'] as const) {
      const s = authReducer(READY_ON, { type: 'SIGN_OUT_REQUESTED', reason, pendingUploads: unknown });
      expect(s).toMatchObject({ status: 'signingOut', waitingForUploads: true });
      expect(shouldFinishSignOut(s)).toBe(false);
    }
  });

  it('with sync off an unknown count does not wait: nothing could ever drain', () => {
    const off: AuthState = { status: 'ready', userId: 'user-asha', sync: 'off' };
    expect(signOutWouldWait(off, { kind: 'unknown' })).toBe(false);
  });

  it('the way out stays: cancelSignOutWait ends an unknown-count wait for a sign-out the person asked for', () => {
    const waiting = authReducer(READY_ON, { type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: { kind: 'unknown' } });
    expect(authReducer(waiting, { type: 'SIGN_OUT_WAIT_CANCELLED' })).toEqual(READY_ON);
  });

  it('a counted zero still ends the sign-out at once', () => {
    const s = authReducer(READY_ON, { type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: { kind: 'count', n: 0 } });
    expect(shouldFinishSignOut(s)).toBe(true);
  });

  it('the Apple revocation path passes an unknown count on, and an unreadable queue never reads as 0', async () => {
    const dispatchSignOut = vi.fn();
    const revoked: Array<() => void> = [];
    startAppleRevocationWatch({
      check: async () => false,
      isAppleSession: async () => true,
      pendingUploads: () => Promise.reject(new Error('queue down')),
      dispatchSignOut,
      onAppActive: () => () => {},
      onAppleRevoked: (l) => (revoked.push(l), () => {}),
      now: () => 5_000_000,
    });
    revoked[0]();
    await vi.waitFor(() => expect(dispatchSignOut).toHaveBeenCalledWith({ kind: 'unknown' }));
  });

  it('the provider: every dispatch passes the typed result on, the poll ends only on a counted zero, no literal 0 but switch_account', () => {
    const p = src('lib/auth/session-provider.tsx');
    expect(p).toMatch(/pendingUploads\(\)\.then\(\(p\) => nothingPending\(p\) && done\(\)\)/);
    expect(p).toMatch(/pendingUploads\(\)\.then\(\(p\) => dispatch\(\{ type: 'SIGN_OUT_REQUESTED', reason: 'force_reauth', pendingUploads: p \}\)\)/);
    expect(p).toMatch(/dispatchSignOut: \(p\) => dispatch\(\{ type: 'SIGN_OUT_REQUESTED', reason: 'apple_revoked', pendingUploads: p \}\)/);
    expect(p.match(/pendingUploads: 0/g)).toHaveLength(1); // switch_account only: it never reads the probe
    expect(p).toMatch(/cancelSignOutWait\(\) \{\s*dispatch\(\{ type: 'SIGN_OUT_WAIT_CANCELLED' \}\);/);
  });
});
