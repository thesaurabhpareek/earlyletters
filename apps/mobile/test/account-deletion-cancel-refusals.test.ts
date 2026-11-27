/// <reference types="node" />
/**
 * CDesO-58 and CDesO-59: what the Delete account hook does with each refused Cancel deletion. The limit and a cancel
 * still refused for auth keep their own reason, so each page picks its line (delete-account.logic cancelFailureLine);
 * a cancel that finds the deletion executing shows no failure and moves the page to its executing state, with the
 * phone's note written as a status read writes it. Fictional family "Asha" only (CLAUDE.md).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  cancelDeletion: vi.fn(),
  recordStatus: vi.fn(),
  recordCancelled: vi.fn(),
  bookVisible: true,
  // One auth object for every render, as the provider gives: a new client each render would re-run the page's read.
  auth: { client: { rpc: () => undefined }, signedIn: true, configured: true, state: { status: 'signedIn' }, signOut: () => undefined },
}));

vi.mock('react', async () => (await import('./helpers/mini-react')).reactStandIn);
vi.mock('@/lib/analytics', () => ({
  analytics: { track: vi.fn() },
  analyticsIdsForDeletion: vi.fn(),
  forgetAnalyticsIds: vi.fn(),
  forgetAnalyticsIdsSome: vi.fn(),
  withdrawAnalytics: vi.fn(),
}));
vi.mock('@/lib/auth/machine.logic', () => ({ authUserId: () => 'user-asha' }));
vi.mock('@/lib/auth/session-provider', () => ({
  useAuth: () => h.auth,
}));
vi.mock('@/lib/billing', () => ({ usePlan: () => ({ details: { status: 'none' } }) }));
vi.mock('@/lib/store', () => ({
  bookVisibleNow: () => h.bookVisible,
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
  loadStatus: () => Promise.resolve({ ok: true, value: { state: 'scheduled', requestId: 'req-asha', scheduledFor: '2026-12-27T00:00:00Z' } }),
  requestDeletion: vi.fn(),
  retryForget: () => Promise.resolve(),
}));
vi.mock('../src/lib/account-deletion/note-store', () => ({
  recordCancelled: () => h.recordCancelled(),
  recordRequested: vi.fn(),
  recordStatus: (...a: unknown[]) => h.recordStatus(...a),
}));

import { useAccountDeletion } from '../src/lib/account-deletion/use-account-deletion';
import { renderHook } from './helpers/mini-react';

/** Lets the page's own read on mount land first, so the cancel's answer is the last word. */
const settled = () => new Promise((res) => setTimeout(res, 0));

const EXECUTING = { state: 'executing', requestId: 'req-asha', scheduledFor: '2026-12-27T00:00:00Z' } as const;

beforeEach(() => {
  h.cancelDeletion.mockReset();
  h.recordStatus.mockReset();
  h.recordCancelled.mockReset();
  h.bookVisible = true;
});

describe('CDesO-58 and CDesO-59: a refused Cancel deletion in the hook', () => {
  it('[CDesO-58] the daily limit keeps its own reason, so the page shows cancelLimited, not cancelFailed', async () => {
    h.cancelDeletion.mockResolvedValue({ ok: false, reason: 'limited' });
    const run = renderHook(() => useAccountDeletion());
    await settled();
    await expect(run.result.current.cancel()).resolves.toBe(false);
    expect(run.result.current.error).toBe('limited');
    expect(run.result.current.cancelled).toBe(false);
    expect(h.recordCancelled).not.toHaveBeenCalled();
    run.unmount();
  });

  it('[CDesO-59 case 1] a cancel still refused for auth keeps `auth`, so a signed-in page says nothing has changed', async () => {
    h.cancelDeletion.mockResolvedValue({ ok: false, reason: 'auth' });
    const run = renderHook(() => useAccountDeletion());
    await settled();
    await expect(run.result.current.cancel()).resolves.toBe(false);
    expect(run.result.current.error).toBe('auth');
    run.unmount();
  });

  it('[CDesO-59 case 3] executing is no failure: the status moves to executing and the note is written as a read writes it', async () => {
    h.cancelDeletion.mockResolvedValue({ ok: false, reason: 'executing', status: EXECUTING });
    const run = renderHook(() => useAccountDeletion());
    await settled();
    await expect(run.result.current.cancel()).resolves.toBe(false);
    expect(run.result.current.error).toBeNull();
    expect(run.result.current.status).toEqual(EXECUTING);
    expect(run.result.current.busy).toBe(false);
    expect(h.recordStatus).toHaveBeenCalledWith(EXECUTING, 'user-asha');
    // Under a second account on the owner's phone the note is the owner's, and is left alone (HO-911).
    h.recordStatus.mockReset();
    h.bookVisible = false;
    await run.result.current.cancel();
    expect(h.recordStatus).not.toHaveBeenCalledWith(EXECUTING, expect.anything());
    run.unmount();
  });
});
