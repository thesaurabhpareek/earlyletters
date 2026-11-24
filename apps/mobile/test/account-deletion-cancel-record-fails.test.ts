/// <reference types="node" />
/**
 * BL-494 review follow-up: a cancel the server accepted stays a cancel when the phone cannot write its own note
 * (recordCancelled throws, for example a locked database). The press returns true, the screen shows the cancelled
 * state, and nothing rejects unhandled. Fictional family "Asha" only (CLAUDE.md).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  recordCancelled: vi.fn(),
  cancelDeletion: vi.fn(),
  bookVisible: true,
}));

vi.mock('react', async () => (await import('./helpers/mini-react')).reactStandIn);
vi.mock('@/lib/analytics', () => ({
  analytics: { track: vi.fn() },
  analyticsIdsForDeletion: vi.fn(),
  forgetAnalyticsIds: vi.fn(),
  withdrawAnalytics: vi.fn(),
}));
vi.mock('@/lib/auth/machine.logic', () => ({ authUserId: () => 'user-asha' }));
vi.mock('@/lib/auth/session-provider', () => ({
  useAuth: () => ({ client: { rpc: () => undefined }, signedIn: true, configured: true, state: { status: 'signedIn' }, signOut: vi.fn() }),
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
  loadStatus: () => Promise.resolve({ ok: true, value: { state: 'none' } }),
  requestDeletion: vi.fn(),
  retryForget: () => Promise.resolve(),
}));
vi.mock('../src/lib/account-deletion/note-store', () => ({
  recordCancelled: () => h.recordCancelled(),
  recordRequested: vi.fn(),
  recordStatus: vi.fn(),
}));

import { useAccountDeletion } from '../src/lib/account-deletion/use-account-deletion';
import { renderHook } from './helpers/mini-react';

beforeEach(() => {
  h.recordCancelled.mockReset();
  h.cancelDeletion.mockReset().mockResolvedValue({ ok: true, value: undefined });
  h.bookVisible = true;
});

describe('BL-494 point 5: the cancel path catches a failed record', () => {
  it('a recordCancelled that throws does not fail the press or reject', async () => {
    h.recordCancelled.mockImplementation(() => {
      throw new Error('database is locked');
    });
    const run = renderHook(() => useAccountDeletion());
    await expect(run.result.current.cancel()).resolves.toBe(true);
    expect(h.recordCancelled).toHaveBeenCalledTimes(1);
    expect(run.result.current.cancelled).toBe(true);
    expect(run.result.current.error).toBeNull();
    expect(run.result.current.busy).toBe(false);
    run.unmount();
  });

  it('a recordCancelled that works is still called once, and a hidden book does not call it', async () => {
    const run = renderHook(() => useAccountDeletion());
    await expect(run.result.current.cancel()).resolves.toBe(true);
    expect(h.recordCancelled).toHaveBeenCalledTimes(1);
    h.bookVisible = false;
    await run.result.current.cancel();
    expect(h.recordCancelled).toHaveBeenCalledTimes(1);
    run.unmount();
  });
});
