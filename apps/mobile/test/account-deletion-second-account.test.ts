/// <reference types="node" />
/**
 * HO-911 (E49, E54; `[X4-R1]`, NS-10-R3): Delete account under a second account leaves the owner's note. Account B opens
 * Settings, Delete account on a phone that holds A's book and A's scheduled deletion note; the server says "none" for B.
 * The note is A's and must be byte-identical afterwards, whether the screen reads the status, B asks for a deletion or
 * B cancels one. B still gets B's own screen (status is read), and with one account the note is written as before.
 * Runs the hook on the mini React stand-in over the REAL store (node:sqlite), auth-store and note-store, so the guard is
 * the app's own `bookVisibleNow()`. Fictional "Asha" only.
 */
import { randomBytes } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthState } from '../src/lib/auth/machine.logic';
import * as auth from '../src/lib/auth/auth-store';
import { OPEN_REQUEST_KEY } from '../src/lib/account-deletion/open-request';
import { useAccountDeletion } from '../src/lib/account-deletion/use-account-deletion';
import * as store from '../src/lib/store';
import { takeOwnership } from '../src/lib/sync/ownership';
import { renderHook } from './helpers/mini-react';
import { nodeDb } from './helpers/node-db';

const h = vi.hoisted(() => ({
  auth: {} as Record<string, unknown>,
  loadStatus: vi.fn(),
  requestDeletion: vi.fn(),
  cancelDeletion: vi.fn(),
}));

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(randomBytes(n)) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));
vi.mock('react', async () => (await import('./helpers/mini-react')).reactStandIn);
vi.mock('@/lib/auth/session-provider', () => ({ useAuth: () => h.auth }));
vi.mock('@/lib/sync', () => ({ syncNow: () => Promise.resolve(null) }));
vi.mock('@/lib/billing', () => ({ usePlan: () => ({ details: { status: 'none' } }) }));
vi.mock('@/lib/analytics', () => ({
  analytics: { track: () => undefined },
  analyticsIdsForDeletion: () => [],
  forgetAnalyticsIds: () => undefined,
  withdrawAnalytics: () => Promise.resolve(),
}));
vi.mock('../src/lib/account-deletion/api', () => ({
  loadStatus: (...a: unknown[]) => h.loadStatus(...a),
  loadBooks: () => Promise.resolve({ ok: true, value: [] }),
  retryForget: () => Promise.resolve(),
  requestDeletion: (...a: unknown[]) => h.requestDeletion(...a),
  cancelDeletion: (...a: unknown[]) => h.cancelDeletion(...a),
  forgetAnalytics: () => Promise.resolve(),
}));

const A = '0192f0aa-0000-7000-8000-0000000000a1';
const B = '0192f0aa-0000-7000-8000-0000000000b2';
const A_NOTE = JSON.stringify({ state: 'scheduled', requestId: 'req-a', scheduledFor: '2099-12-19T09:00:00.000Z', userId: A });
let n = 0;
const id7 = () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}`;


function signIn(userId: string) {
  const state: AuthState = { status: 'ready', userId, sync: 'on' };
  h.auth = { state, signedIn: true, configured: true, client: { rpc: () => undefined }, signOut: () => undefined };
  auth.publishAuth(state);
}

beforeEach(async () => {
  auth.publishAuth({ status: 'signedOut' });
  const { db } = nodeDb();
  expect(store.openStore({ open: () => ({ db, close: () => {} }), now: () => '2026-11-20T09:00:00.000Z', newId: () => id7() }).ok).toBe(true);
  // A's book on this phone, claimed by A, and A's scheduled deletion note.
  store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' });
  takeOwnership(store.localSqlDb(), A, { now: '2026-11-20T09:00:00.000Z', newId: id7 });
  store.setSetting(OPEN_REQUEST_KEY, A_NOTE);
  h.loadStatus.mockReset();
  h.loadStatus.mockResolvedValue({ ok: true, value: { state: 'none' } });
  h.requestDeletion.mockReset();
  h.requestDeletion.mockResolvedValue({ ok: true, value: { requestId: 'req-b', scheduledFor: '2099-12-20T09:00:00.000Z' } });
  h.cancelDeletion.mockReset();
  h.cancelDeletion.mockResolvedValue({ ok: true, value: undefined });
});

const note = () => store.getSetting(OPEN_REQUEST_KEY);

describe('[NS-10-R3][X4-R1] Delete account under a second account leaves the owner\'s note', () => {
  it('B signed in on A\'s phone: refresh on mount leaves A\'s note byte-identical, and B still sees B\'s own status', async () => {
    signIn(B);
    const run = renderHook(() => useAccountDeletion());
    await vi.waitFor(() => expect(run.result.current.status).toEqual({ state: 'none' }));
    expect(h.loadStatus).toHaveBeenCalledTimes(1);
    expect(note()).toBe(A_NOTE);
    run.unmount();
  });

  it('a userId change (B signs in under a mounted screen) runs refresh again and still leaves A\'s note', async () => {
    signIn(A);
    h.loadStatus.mockResolvedValue({ ok: true, value: { state: 'scheduled', requestId: 'req-a', scheduledFor: '2099-12-19T09:00:00.000Z' } });
    const run = renderHook(() => useAccountDeletion());
    await vi.waitFor(() => expect(h.loadStatus).toHaveBeenCalledTimes(1));
    h.loadStatus.mockResolvedValue({ ok: true, value: { state: 'none' } });
    signIn(B);
    run.rerender();
    await vi.waitFor(() => expect(h.loadStatus).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(run.result.current.status).toEqual({ state: 'none' }));
    expect(JSON.parse(note() ?? 'null')).toMatchObject({ userId: A, requestId: 'req-a' });
    run.unmount();
  });

  it('fails closed: when the owner cannot be read, nothing is written', async () => {
    signIn(B);
    const get = vi.spyOn(store.localSqlDb(), 'get').mockImplementation(() => {
      throw new Error('settings unreadable');
    });
    const run = renderHook(() => useAccountDeletion());
    await vi.waitFor(() => expect(run.result.current.status).toEqual({ state: 'none' }));
    get.mockRestore();
    expect(note()).toBe(A_NOTE);
    run.unmount();
  });

  it('B asks to delete B\'s account: B\'s screen shows it, A\'s note is left alone', async () => {
    signIn(B);
    const run = renderHook(() => useAccountDeletion());
    await vi.waitFor(() => expect(run.result.current.status).toEqual({ state: 'none' }));
    expect(await run.result.current.request()).toBe(true);
    expect(h.requestDeletion).toHaveBeenCalledTimes(1);
    expect(run.result.current.status).toMatchObject({ state: 'scheduled', requestId: 'req-b' });
    expect(note()).toBe(A_NOTE);
    run.unmount();
  });

  it('B cancels B\'s request: A\'s note is left alone', async () => {
    signIn(B);
    const run = renderHook(() => useAccountDeletion());
    await vi.waitFor(() => expect(run.result.current.status).toEqual({ state: 'none' }));
    expect(await run.result.current.cancel()).toBe(true);
    expect(note()).toBe(A_NOTE);
    run.unmount();
  });

  it('one account (A signed in, A owns the phone): the note is written as before (the server says none, the note goes)', async () => {
    signIn(A);
    const run = renderHook(() => useAccountDeletion());
    await vi.waitFor(() => expect(run.result.current.status).toEqual({ state: 'none' }));
    expect(note()).toBeNull();
    run.unmount();
  });
});
