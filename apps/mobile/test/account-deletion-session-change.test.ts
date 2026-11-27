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

describe('[review Shoulds on #2217] a cancel answer that lands after the session ended changes nothing in the new one', () => {
  it('a late `failed` after a sign-out and sign-in as the same person sets no error in the new session', async () => {
    let answer: (v: unknown) => void = () => undefined;
    h.cancelDeletion.mockReturnValue(new Promise((res) => (answer = res)));
    const run = renderHook(() => useAccountDeletion());
    await settled();
    const pressed = run.result.current.cancel();
    h.auth = SIGNED_OUT;
    run.rerender();
    h.auth = signedIn('user-asha');
    run.rerender();
    await settled();
    expect(run.result.current.session).toBe(2);
    answer({ ok: false, reason: 'failed' });
    expect(await pressed).toBe(false);
    // Without the drop, the Delete account page drew "Nothing has changed." under this session's date for a press whose
    // outcome is unknown (`cancelTried` is false there, so the page fell to failureLine).
    expect(run.result.current.error).toBeNull();
    expect(run.result.current.outcomeUnknown).toBe(false);
    expect(run.result.current.status).toEqual({ state: 'scheduled', requestId: 'req-asha', scheduledFor: '2026-12-27T00:00:00Z' });
    run.unmount();
  });

  it('a late `executing` or success for another account is not drawn as the new account\'s state', async () => {
    for (const late of [
      { ok: false, reason: 'executing', status: { state: 'executing', requestId: 'req-asha' } },
      { ok: true, value: true },
    ]) {
      let answer: (v: unknown) => void = () => undefined;
      h.cancelDeletion.mockReturnValue(new Promise((res) => (answer = res)));
      h.auth = signedIn('user-asha');
      h.status = { ok: true, value: { state: 'scheduled', requestId: 'req-asha', scheduledFor: '2026-12-27T00:00:00Z' } };
      const run = renderHook(() => useAccountDeletion());
      await settled();
      const pressed = run.result.current.cancel();
      h.auth = SIGNED_OUT;
      run.rerender();
      h.status = { ok: true, value: { state: 'scheduled', requestId: 'req-other', scheduledFor: '2027-01-05T00:00:00Z' } };
      h.auth = signedIn('user-other');
      run.rerender();
      await settled();
      answer(late);
      await pressed;
      expect(run.result.current.status, late.ok ? 'success' : 'executing').toEqual({ state: 'scheduled', requestId: 'req-other', scheduledFor: '2027-01-05T00:00:00Z' });
      expect(run.result.current.cancelled).toBe(false);
      run.unmount();
    }
  });

  it('an answer in the session it was pressed in still lands', async () => {
    h.cancelDeletion.mockResolvedValue({ ok: false, reason: 'failed' });
    const run = renderHook(() => useAccountDeletion());
    await settled();
    await run.result.current.cancel();
    expect(run.result.current.error).toBe('failed');
    run.unmount();
  });
});

describe('[CDesO-64] the hook keeps an "outcome unknown" mark for the session user', () => {
  it('is set by a cancel that ends offline or failed, and kept through a later auth refusal', async () => {
    for (const reason of ['offline', 'failed'] as const) {
      h.cancelDeletion.mockResolvedValueOnce({ ok: false, reason }).mockResolvedValueOnce({ ok: false, reason: 'auth' });
      const run = renderHook(() => useAccountDeletion());
      await settled();
      expect(run.result.current.outcomeUnknown).toBe(false);
      await run.result.current.cancel();
      expect(run.result.current.outcomeUnknown, reason).toBe(true);
      // An auth refusal read nothing, so the earlier press is still unsettled.
      await run.result.current.cancel();
      expect(run.result.current.error).toBe('auth');
      expect(run.result.current.outcomeUnknown, reason).toBe(true);
      run.unmount();
    }
  });

  it('an auth refusal with no earlier unknown press sets no mark (CDesO-59 stands)', async () => {
    h.cancelDeletion.mockResolvedValue({ ok: false, reason: 'auth' });
    const run = renderHook(() => useAccountDeletion());
    await settled();
    await run.result.current.cancel();
    expect(run.result.current.error).toBe('auth');
    expect(run.result.current.outcomeUnknown).toBe(false);
    run.unmount();
  });

  it('is cleared by a cancel that succeeds, `executing` or `limited`', async () => {
    for (const settles of [
      { ok: true, value: true },
      { ok: false, reason: 'executing', status: { state: 'executing', requestId: 'req-asha' } },
      { ok: false, reason: 'limited' },
    ]) {
      h.cancelDeletion.mockResolvedValueOnce({ ok: false, reason: 'failed' }).mockResolvedValueOnce(settles);
      const run = renderHook(() => useAccountDeletion());
      await settled();
      await run.result.current.cancel();
      expect(run.result.current.outcomeUnknown).toBe(true);
      await run.result.current.cancel();
      expect(run.result.current.outcomeUnknown, JSON.stringify(settles)).toBe(false);
      run.unmount();
    }
  });

  it('is cleared by a status read that goes through, and kept by one that fails', async () => {
    h.cancelDeletion.mockResolvedValue({ ok: false, reason: 'offline' });
    const run = renderHook(() => useAccountDeletion());
    await settled();
    await run.result.current.cancel();
    expect(run.result.current.outcomeUnknown).toBe(true);
    // A read that fails settles nothing: re-run the page's load by a token change of the same client (a new client).
    h.status = { ok: false, reason: 'offline' };
    h.auth = { ...signedIn('user-asha'), client: { rpc: () => undefined } };
    run.rerender();
    await settled();
    expect(run.result.current.outcomeUnknown).toBe(true);
    h.status = { ok: true, value: { state: 'scheduled', requestId: 'req-asha', scheduledFor: '2026-12-27T00:00:00Z' } };
    h.auth = { ...signedIn('user-asha'), client: { rpc: () => undefined } };
    run.rerender();
    await settled();
    expect(run.result.current.outcomeUnknown).toBe(false);
    run.unmount();
  });

  it('goes with the session: a sign-out drops it', async () => {
    h.cancelDeletion.mockResolvedValue({ ok: false, reason: 'failed' });
    const run = renderHook(() => useAccountDeletion());
    await settled();
    await run.result.current.cancel();
    expect(run.result.current.outcomeUnknown).toBe(true);
    h.auth = SIGNED_OUT;
    run.rerender();
    expect(run.result.current.outcomeUnknown).toBe(false);
    run.unmount();
  });
});
