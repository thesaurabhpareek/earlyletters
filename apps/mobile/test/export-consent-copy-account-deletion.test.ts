/// <reference types="node" />
/**
 * [BL-528][CPrivO-21] Asking to delete the account deletes this phone's copy of the consent record
 * (export/consent-copy.logic.ts), whatever the book list shows; a request the server refused leaves it. The export
 * keeps no copy while the request is open (export/device.ts). Fictional family "Asha" only (CLAUDE.md).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ settings: new Map<string, string>(), requestDeletion: vi.fn(), bookVisible: true }));

vi.mock('react', async () => (await import('./helpers/mini-react')).reactStandIn);
vi.mock('@/lib/analytics', () => ({ analytics: { track: vi.fn() }, analyticsIdsForDeletion: vi.fn(), forgetAnalyticsIds: vi.fn(), forgetAnalyticsIdsSome: vi.fn(), withdrawAnalytics: () => Promise.resolve() }));
vi.mock('@/lib/auth/machine.logic', () => ({ authUserId: () => 'user-asha' }));
vi.mock('@/lib/auth/session-provider', () => ({
  useAuth: () => ({ client: { rpc: () => undefined }, signedIn: true, configured: true, state: { status: 'signedIn' }, signOut: vi.fn() }),
}));
vi.mock('@/lib/billing', () => ({ usePlan: () => ({ details: { status: 'none' } }) }));
vi.mock('@/lib/store', () => ({
  bookVisibleNow: () => h.bookVisible, currentUserId: () => 'user-asha', listEntriesForChild: () => [], uuidv7: () => 'id-1',
  getSetting: (k: string) => h.settings.get(k) ?? null, setSetting: (k: string, v: string) => void h.settings.set(k, v), deleteSetting: (k: string) => void h.settings.delete(k),
}));
vi.mock('../src/lib/account-deletion/api', () => ({
  cancelDeletion: vi.fn(), forgetAnalytics: () => Promise.resolve(), retryForget: () => Promise.resolve(), requestDeletion: (...a: unknown[]) => h.requestDeletion(...a),
  loadBooks: () => Promise.resolve({ ok: true, value: [] }), loadStatus: () => Promise.resolve({ ok: true, value: { state: 'none' } }),
}));
vi.mock('../src/lib/account-deletion/note-store', () => ({ recordCancelled: vi.fn(), recordRequested: vi.fn(), recordStatus: vi.fn() }));

import { useAccountDeletion } from '../src/lib/account-deletion/use-account-deletion';
import { CONSENT_COPY_KEY } from '../src/lib/export/consent-copy.logic';
import { renderHook } from './helpers/mini-react';

const OTHER = 'child.bornCardHidden.asha';
// Unmounted even when an assertion fails, so a failing run ends instead of re-rendering forever.
let unmount: (() => void) | null = null;
const mount = () => ((r) => ((unmount = r.unmount), r))(renderHook(() => useAccountDeletion()));
afterEach(() => void (unmount?.(), (unmount = null)));

beforeEach(() => {
  h.settings = new Map([[CONSENT_COPY_KEY, '{"v":1,"account_id":"user-asha"}'], [OTHER, '2026-03-01']]);
  h.requestDeletion.mockReset().mockResolvedValue({ ok: true, value: { requestId: 'req-1', scheduledFor: '2027-04-14T00:00:00Z' } });
  h.bookVisible = true;
});

describe('[BL-528][CPrivO-21] the account-deletion request deletes the copy', () => {
  it('a request the server accepted removes the copy and nothing else', async () => {
    const run = mount();
    await expect(run.result.current.request()).resolves.toBe(true);
    expect([...h.settings.keys()]).toEqual([OTHER]);
  });

  it('also when the book list is hidden (the open-request note is not written then, the copy still goes)', async () => {
    h.bookVisible = false;
    const run = mount();
    await expect(run.result.current.request()).resolves.toBe(true);
    expect(h.settings.has(CONSENT_COPY_KEY)).toBe(false);
  });

  it('a request the server refused keeps it', async () => {
    h.requestDeletion.mockResolvedValue({ ok: false, reason: 'offline' });
    const run = mount();
    await expect(run.result.current.request()).resolves.toBe(false);
    expect(h.settings.has(CONSENT_COPY_KEY)).toBe(true);
  });
});
