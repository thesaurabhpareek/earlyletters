/// <reference types="node" />
/**
 * Review B on #879 (BL-961, `[X4-R1]`): the store's lists are empty for another account, so its session reaches
 * /onboarding, where useFirstRunGate used to clear the owner's account-deletion note as "another account's"
 * (use-first-run-gate.ts clear effect) and ask the server as the other account, rewriting the note (recordStatus).
 * The owner's note must survive the other account's whole session. Runs the hook on the mini React stand-in with the
 * real note-store over a fake settings table, as test/account-deletion-gate-hook.test.ts does. Fictional "Asha" only.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  settings: new Map<string, string>(),
  listeners: new Set<() => void>(),
  auth: { state: { status: 'signedOut' }, signedIn: false, client: null } as Record<string, unknown>,
  snapshot: { status: 'signedOut' } as Record<string, unknown>,
  loadStatus: vi.fn(),
  recordStatusCalls: 0,
  clearCalls: 0,
}));

vi.mock('react', async () => (await import('./helpers/mini-react')).reactStandIn);
vi.mock('expo-router', () => ({ router: { replace: () => undefined }, usePathname: () => '/onboarding' }));
vi.mock('@/lib/auth/session-provider', () => ({ useAuth: () => h.auth }));
vi.mock('@/lib/auth/auth-store', () => ({ getAuthSnapshot: () => h.snapshot, currentAuthUserId: () => null }));
vi.mock('@/lib/sync', () => ({ syncNow: () => Promise.resolve(null) }));
vi.mock('@/lib/store', () => {
  const notify = () => h.listeners.forEach((l) => l());
  return {
    getSetting: (k: string) => h.settings.get(k) ?? null,
    setSetting: (k: string, v: string) => void (h.settings.set(k, v), notify()),
    deleteSetting: (k: string) => void (h.settings.delete(k), notify()),
    listChildren: () => [], // what the store answers another account (lib/store.ts shown)
    localSqlDb: () => ({ get: () => null }),
    subscribeTo: (_t: unknown, l: () => void) => (h.listeners.add(l), () => void h.listeners.delete(l)),
  };
});
vi.mock('../src/lib/account-deletion/api', () => ({ loadStatus: (...a: unknown[]) => h.loadStatus(...a) }));
vi.mock('../src/lib/account-deletion/note-store', async (orig) => {
  const real = await orig<typeof import('../src/lib/account-deletion/note-store')>();
  return {
    ...real,
    recordStatus: (...a: Parameters<typeof real.recordStatus>) => (h.recordStatusCalls++, real.recordStatus(...a)),
    clearDeadNote: (judged: string | null) => (h.clearCalls++, real.clearDeadNote(judged)),
  };
});

import { useFirstRunGate } from '../src/lib/account-deletion/use-first-run-gate';
import { OPEN_REQUEST_KEY } from '../src/lib/account-deletion/open-request';
import { SYNC_SETTING } from '../src/lib/sync/outbox';
import { renderHook } from './helpers/mini-react';

const A = '0192f0aa-0000-7000-8000-0000000000a1';
const B = '0192f0aa-0000-7000-8000-0000000000b2';
const NOW = '2026-11-20T09:00:00.000Z';
const A_NOTE = JSON.stringify({ state: 'scheduled', requestId: 'req-a', scheduledFor: '2026-12-19T09:00:00.000Z', userId: A });

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW));
  h.settings.clear();
  h.listeners.clear();
  h.recordStatusCalls = 0;
  h.clearCalls = 0;
  h.loadStatus.mockReset();
  h.loadStatus.mockResolvedValue({ ok: true, value: { state: 'none' } });
  h.settings.set(SYNC_SETTING.owner, A);
  h.settings.set(OPEN_REQUEST_KEY, A_NOTE);
});
afterEach(() => vi.useRealTimers());

describe('[X4-R1] the owner\'s account-deletion note survives another account\'s session', () => {
  it('B signed in on A\'s phone: the note is not cleared, the server is not asked as B, nothing is rewritten', async () => {
    const state = { status: 'ready', userId: B, sync: 'on' };
    h.auth = { state, signedIn: true, client: { rpc: () => undefined } };
    h.snapshot = state;
    const run = renderHook(() => useFirstRunGate());
    await vi.advanceTimersByTimeAsync(5000);
    expect(h.loadStatus).not.toHaveBeenCalled();
    expect(h.recordStatusCalls).toBe(0);
    expect(h.clearCalls).toBe(0);
    expect(h.settings.get(OPEN_REQUEST_KEY)).toBe(A_NOTE);
    run.unmount();
  });

  it('A signed in: the hook still asks and reads as before (the guard is for another account only)', async () => {
    const state = { status: 'ready', userId: A, sync: 'on' };
    h.auth = { state, signedIn: true, client: { rpc: () => undefined } };
    h.snapshot = state;
    const run = renderHook(() => useFirstRunGate());
    await vi.advanceTimersByTimeAsync(0);
    expect(h.loadStatus).toHaveBeenCalledTimes(1);
    run.unmount();
  });
});
