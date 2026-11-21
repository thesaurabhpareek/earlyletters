/// <reference types="node" />
/**
 * HO-911 (E49, E54; `[X4-R1]`, NS-10-R3): Delete account under a second account leaves the owner's note. Account B opens
 * Settings, Delete account on a phone that holds A's book and A's scheduled deletion note; the server says "none" for B.
 * The note is A's and must be byte-identical afterwards. B still gets B's own screen (status is read), and with one
 * account the note is written as before. Runs the hook on the mini React stand-in with the real note-store over a fake
 * settings table. Fictional "Asha" only.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bookVisibleTo } from '../src/lib/auth/account-scope.logic';

const h = vi.hoisted(() => ({
  settings: new Map<string, string>(),
  owner: null as string | null,
  ownerUnreadable: false,
  auth: {} as Record<string, unknown>,
  snapshot: { status: 'signedOut' } as Record<string, unknown>,
  loadStatus: vi.fn(),
}));

vi.mock('react', async () => (await import('./helpers/mini-react')).reactStandIn);
vi.mock('@/lib/auth/session-provider', () => ({ useAuth: () => h.auth }));
vi.mock('@/lib/auth/auth-store', () => ({ getAuthSnapshot: () => h.snapshot, currentAuthUserId: () => null }));
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
  requestDeletion: () => Promise.resolve({ ok: false, reason: 'failed' }),
  cancelDeletion: () => Promise.resolve({ ok: false, reason: 'failed' }),
  forgetAnalytics: () => Promise.resolve(),
}));
vi.mock('@/lib/store', async () => {
  const { authUserId } = await import('../src/lib/auth/machine.logic');
  const currentUserId = () => {
    if (h.ownerUnreadable) throw new Error('settings unreadable');
    return h.owner;
  };
  return {
    getSetting: (k: string) => h.settings.get(k) ?? null,
    setSetting: (k: string, v: string) => void h.settings.set(k, v),
    deleteSetting: (k: string) => void h.settings.delete(k),
    listChildren: () => [],
    listEntriesForChild: () => [],
    localSqlDb: () => ({ get: () => null }),
    uuidv7: () => 'id',
    currentUserId,
    // The same rule as lib/store.ts bookVisibleNow: fail closed on an unreadable owner.
    bookVisibleNow: () => {
      const sessionUser = authUserId(h.snapshot as never);
      if (!sessionUser) return true;
      try {
        return bookVisibleTo({ owner: currentUserId(), sessionUser });
      } catch {
        return false;
      }
    },
  };
});

import { OPEN_REQUEST_KEY } from '../src/lib/account-deletion/open-request';
import { useAccountDeletion } from '../src/lib/account-deletion/use-account-deletion';
import { renderHook } from './helpers/mini-react';

const A = '0192f0aa-0000-7000-8000-0000000000a1';
const B = '0192f0aa-0000-7000-8000-0000000000b2';
const A_NOTE = JSON.stringify({ state: 'scheduled', requestId: 'req-a', scheduledFor: '2099-12-19T09:00:00.000Z', userId: A });

function signIn(userId: string) {
  const state = { status: 'ready', userId, sync: 'on' };
  h.auth = { state, signedIn: true, configured: true, client: { rpc: () => undefined }, signOut: () => undefined };
  h.snapshot = state;
}

beforeEach(() => {
  h.settings.clear();
  h.owner = A;
  h.ownerUnreadable = false;
  h.loadStatus.mockReset();
  h.loadStatus.mockResolvedValue({ ok: true, value: { state: 'none' } });
  h.settings.set(OPEN_REQUEST_KEY, A_NOTE);
});

describe('[NS-10-R3][X4-R1] Delete account under a second account leaves the owner\'s note', () => {
  it('B signed in on A\'s phone: refresh on mount leaves A\'s note byte-identical, and B still sees B\'s own status', async () => {
    signIn(B);
    const run = renderHook(() => useAccountDeletion());
    await vi.waitFor(() => expect(run.result.current.status).toEqual({ state: 'none' }));
    expect(h.loadStatus).toHaveBeenCalledTimes(1);
    expect(h.settings.get(OPEN_REQUEST_KEY)).toBe(A_NOTE);
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
    expect(JSON.parse(h.settings.get(OPEN_REQUEST_KEY) ?? 'null')).toMatchObject({ userId: A, requestId: 'req-a' });
    run.unmount();
  });

  it('fails closed: when the owner cannot be read, nothing is written', async () => {
    signIn(B);
    h.ownerUnreadable = true;
    const run = renderHook(() => useAccountDeletion());
    await vi.waitFor(() => expect(run.result.current.status).toEqual({ state: 'none' }));
    expect(h.settings.get(OPEN_REQUEST_KEY)).toBe(A_NOTE);
    run.unmount();
  });

  it('one account (A signed in, A owns the phone): the note is written as before (the server says none, the note goes)', async () => {
    signIn(A);
    const run = renderHook(() => useAccountDeletion());
    await vi.waitFor(() => expect(run.result.current.status).toEqual({ state: 'none' }));
    expect(h.settings.has(OPEN_REQUEST_KEY)).toBe(false);
    run.unmount();
  });
});
