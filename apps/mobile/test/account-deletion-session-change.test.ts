/// <reference types="node" />
/**
 * Review follow-up on #2166 and #2191: a failed Cancel deletion's error belongs to the session it was pressed in. When the
 * person signs out and back in on the same mounted page, the Delete account hook drops it, and counts the change in
 * `session`, so neither page draws the old "not clear yet" line again. The cancel is sent as the page's session user, so
 * api.ts can check a refreshed session is still that user before its one resend (CDesO-59). Fictional family "Asha" only.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

type Auth = { client: unknown; signedIn: boolean; configured: boolean; state: { status: string; userId?: string }; signOut: () => void };

const client = { rpc: () => undefined };
const signedIn = (userId: string): Auth => ({ client, signedIn: true, configured: true, state: { status: 'signedIn', userId }, signOut: () => undefined });
const SIGNED_OUT: Auth = { client, signedIn: false, configured: true, state: { status: 'signedOut' }, signOut: () => undefined };

const h = vi.hoisted(() => ({
  cancelDeletion: vi.fn(),
  status: { ok: true, value: { state: 'scheduled', requestId: 'req-asha', scheduledFor: '2026-12-27T00:00:00Z' } } as unknown,
  auth: null as unknown,
}));

vi.mock('react', async () => (await import('./helpers/mini-react')).reactStandIn);
vi.mock('@/lib/analytics', () => ({
  analytics: { track: vi.fn() },
  analyticsIdsForDeletion: vi.fn(),
  forgetAnalyticsIds: vi.fn(),
  forgetAnalyticsIdsSome: vi.fn(),
  withdrawAnalytics: vi.fn(),
}));
vi.mock('@/lib/auth/machine.logic', () => ({ authUserId: (s: { userId?: string }) => s.userId ?? null }));
vi.mock('@/lib/auth/session-provider', () => ({ useAuth: () => h.auth }));
vi.mock('@/lib/billing', () => ({ usePlan: () => ({ details: { status: 'none' } }) }));
vi.mock('@/lib/store', () => ({
  bookVisibleNow: () => true,
  currentUserId: () => 'user-asha',
  deleteSetting: vi.fn(),
  getSetting: () => null,
  setSetting: vi.fn(),
  listEntriesForChild: () => [],
  uuidv7: () => 'id-1',
}));
vi.mock('../src/lib/account-deletion/api', () => ({
  cancelDeletion: (...a: unknown[]) => h.cancelDeletion(...a),
  forgetAnalytics: vi.fn(),
  loadBooks: () => Promise.resolve({ ok: true, value: [] }),
  loadStatus: () => Promise.resolve(h.status),
  requestDeletion: vi.fn(),
  retryForget: () => Promise.resolve(),
}));
vi.mock('../src/lib/account-deletion/note-store', () => ({ recordCancelled: vi.fn(), recordRequested: vi.fn(), recordStatus: vi.fn() }));

import { useAccountDeletion } from '../src/lib/account-deletion/use-account-deletion';
import { renderHook } from './helpers/mini-react';

const settled = () => new Promise((res) => setTimeout(res, 0));

beforeEach(() => {
  h.cancelDeletion.mockReset();
  h.status = { ok: true, value: { state: 'scheduled', requestId: 'req-asha', scheduledFor: '2026-12-27T00:00:00Z' } };
  h.auth = signedIn('user-asha');
});

describe('[BL-491] a failed Cancel deletion does not outlive its session (review follow-up on #2166)', () => {
  it('signing out and back in on the same page clears the failed press, and counts the session', async () => {
    h.cancelDeletion.mockResolvedValue({ ok: false, reason: 'offline' });
    const run = renderHook(() => useAccountDeletion());
    await settled();
    expect(run.result.current.session).toBe(0);
    await run.result.current.cancel();
    expect(run.result.current.error).toBe('offline');

    h.auth = SIGNED_OUT;
    run.rerender();
    expect(run.result.current.error).toBeNull();
    expect(run.result.current.session).toBe(1);

    h.auth = signedIn('user-asha');
    run.rerender();
    await settled();
    // The same person again, and the page's read went through: no error is left from the press before the sign-out.
    expect(run.result.current.error).toBeNull();
    expect(run.result.current.session).toBe(2);
    run.unmount();
  });

  it('an auth answer that lands after the refresh signed the person out is dropped on the next sign-in (CDesO-59)', async () => {
    let answer: (v: unknown) => void = () => undefined;
    h.cancelDeletion.mockReturnValue(new Promise((res) => (answer = res)));
    const run = renderHook(() => useAccountDeletion());
    await settled();
    const pressed = run.result.current.cancel();
    // supabase-js emits SIGNED_OUT from inside refreshSession, before the cancel resolves.
    h.auth = SIGNED_OUT;
    run.rerender();
    answer({ ok: false, reason: 'auth' });
    await pressed;
    expect(run.result.current.signedIn).toBe(false);

    h.auth = signedIn('user-asha');
    run.rerender();
    await settled();
    expect(run.result.current.error).toBeNull();
    run.unmount();
  });

  it('a read that fails after the new sign-in is that session\'s own error, and the session has moved on', async () => {
    h.cancelDeletion.mockResolvedValue({ ok: false, reason: 'failed' });
    const run = renderHook(() => useAccountDeletion());
    await settled();
    await run.result.current.cancel();
    const pressedIn = run.result.current.session;
    h.auth = SIGNED_OUT;
    run.rerender();
    h.status = { ok: false, reason: 'offline' };
    h.auth = signedIn('user-asha');
    run.rerender();
    await settled();
    expect(run.result.current.error).toBe('offline');
    // The pages tie "a cancel was pressed" to the session, so this read's failure is not shown as the old press's.
    expect(run.result.current.session).not.toBe(pressedIn);
    run.unmount();
  });
});

describe('[CDesO-59 case 1] the cancel is sent as the page\'s session user (review follow-up on #2191)', () => {
  it('hands cancelDeletion the signed-in user, so its one resend can check the refreshed session is the same person', async () => {
    h.cancelDeletion.mockResolvedValue({ ok: true, value: true });
    const run = renderHook(() => useAccountDeletion());
    await settled();
    await run.result.current.cancel();
    expect(h.cancelDeletion).toHaveBeenCalledWith(client, 'user-asha');
    run.unmount();
  });
});
