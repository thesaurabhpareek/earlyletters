/// <reference types="node" />
/**
 * useFirstRunRoute with another account on the phone (BL-961 PR 2; NS-10-R3): the hook reads the owner, the gate holds
 * the other account on `otherAccount`, and that account is never asked for its books (one owner, 08-keeping K8). On the
 * mini React stand-in, as test/use-first-run-route.test.ts runs. Fictional family "Asha" only.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const A = '0192f0aa-0000-7000-8000-0000000000a1';
const B = '0192f0aa-0000-7000-8000-0000000000b2';

const h = vi.hoisted(() => ({
  auth: { state: { status: 'signedOut' }, configured: true, client: {} } as { state: Record<string, unknown>; configured: boolean; client?: unknown; refreshGate?: () => Promise<void> },
  books: [] as unknown[],
  owner: null as string | null,
  ownerReads: 0,
  asked: 0,
}));

vi.mock('react', async () => {
  const m = (await import('./helpers/mini-react')).reactStandIn;
  return { ...m, useCallback: <T,>(fn: T, deps: readonly unknown[]) => m.useMemo(() => fn, deps) };
});
vi.mock('@/lib/auth/session-provider', () => ({ useAuth: () => h.auth }));
vi.mock('@/lib/a11y', () => ({ announce: () => undefined }));
vi.mock('@/lib/store', () => ({
  subscribe: () => () => undefined,
  listChildren: () => h.books,
  currentUserId: () => {
    h.ownerReads += 1;
    return h.owner;
  },
}));
vi.mock('../src/lib/first-run/account-books', () => ({
  readAccountBooks: () => {
    h.asked += 1;
    return new Promise(() => undefined);
  },
}));
vi.mock('@/lib/sync', () => ({
  getSyncStatus: () => ({ phase: 'account_mismatch', lastSyncedAt: null }),
  subscribeSyncStatus: () => () => undefined,
  syncNow: () => Promise.resolve(null),
}));
vi.mock('expo-network', () => ({
  getNetworkStateAsync: async () => ({ isConnected: true, isInternetReachable: true }),
  addNetworkStateListener: () => ({ remove: () => undefined }),
}));

import { setServerFeaturesForTests } from '../src/lib/capabilities';
import { useFirstRunRoute } from '../src/lib/first-run/use-first-run-route';
import { renderHook } from './helpers/mini-react';

const flush = () => new Promise<void>((r) => setTimeout(r, 0));

beforeEach(() => {
  h.auth = { state: { status: 'signedOut' }, configured: true, client: {} };
  h.books = [];
  h.owner = A;
  h.ownerReads = 0;
  h.asked = 0;
  setServerFeaturesForTests(true);
});
afterEach(() => setServerFeaturesForTests(null));

describe('[NS-10-R3] the route holds another account and never asks for its books', () => {
  const statesOfB = [
    { status: 'checkingConsent', userId: B, method: 'email' },
    { status: 'needsConsent', userId: B, method: 'email', steps: ['terms'] },
    { status: 'ready', userId: B, sync: 'on' },
    { status: 'ready', userId: B, sync: 'unknown' },
    { status: 'signingOut', userId: B, reason: 'user', waitingForUploads: false, sync: 'on' },
  ];

  it('A\'s book listed, B signed in: otherAccount, a blank route, nothing begun, no account question', async () => {
    for (const books of [[{ id: 'asha' }], []]) {
      for (const state of statesOfB) {
        h.books = books;
        h.auth = { state, configured: true, client: {} };
        const run = renderHook(() => useFirstRunRoute());
        await flush();
        const where = `${String(state.status)} books:${books.length}`;
        expect(run.result.current, where).toMatchObject({ step: 'otherAccount', screen: 'blank', mayBeginBook: false, arrivedFromAccount: false });
        run.unmount();
      }
    }
    expect(h.asked).toBe(0);
  });

  it('servers off: the owner is never read (the route stays a no-op)', async () => {
    setServerFeaturesForTests(false);
    h.auth = { state: { status: 'ready', userId: B, sync: 'on' }, configured: true, client: {} };
    const run = renderHook(() => useFirstRunRoute());
    await flush();
    expect(run.result.current.step).toBe('unchanged');
    expect(h.ownerReads).toBe(0);
    run.unmount();
  });
});
