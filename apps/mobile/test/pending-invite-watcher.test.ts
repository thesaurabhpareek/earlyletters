/// <reference types="node" />
/**
 * The launch watcher for a saved invite token (A-REQ-028), with the one join-door rule applied (lens A on #720, 11 Nov
 * 2026): it opens /invite only where this build has the flow (inviteDestination 'invite_link': servers on AND an alpha
 * build). In a servers-on store build with a token left in the Keychain it pushes nothing and drops the token. The
 * component runs on a small stand-in for React's hooks (test/helpers/mini-react.ts) with the router, the Keychain item
 * and the two build switches replaced by a few lines each. Fictional family "Asha" only (CLAUDE.md).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  pathname: '/',
  navKey: 'root' as string | undefined,
  serverFeatures: true,
  alpha: true,
  /** The saved token, as readPendingInvite answers it. */
  saved: null as { token: string; receivedAt: number } | null,
  push: vi.fn(),
  clear: vi.fn(),
  read: vi.fn(),
}));

vi.mock('react', async () => (await import('./helpers/mini-react')).reactStandIn);
vi.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => h.push(...a) },
  usePathname: () => h.pathname,
  useRootNavigationState: () => (h.navKey ? { key: h.navKey } : undefined),
}));
vi.mock('../src/lib/capabilities', () => ({ serverFeaturesEnabled: () => h.serverFeatures }));
vi.mock('../src/lib/billing/alpha', () => ({
  get PLUS_ALPHA() {
    return h.alpha;
  },
}));
vi.mock('../src/lib/family/pending-invite', () => ({
  readPendingInvite: (...a: unknown[]) => h.read(...a),
  clearPendingInvite: (...a: unknown[]) => h.clear(...a),
}));

import { PendingInviteWatcher } from '../src/lib/family/pending-invite-watcher';
import { renderHook } from './helpers/mini-react';

const TOKEN = { token: 'a'.repeat(43), receivedAt: 1 };
const settle = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  h.pathname = '/';
  h.navKey = 'root';
  h.serverFeatures = true;
  h.alpha = true;
  h.saved = TOKEN;
  h.push.mockReset();
  h.clear.mockReset();
  h.clear.mockResolvedValue(undefined);
  h.read.mockReset();
  h.read.mockImplementation(async () => h.saved);
});

describe('[A-REQ-028] the pending-invite watcher and the join-door rule', () => {
  it('with the flow (servers on, an alpha build) and a saved token: opens /invite once, and keeps the token for the join sheet', async () => {
    renderHook(() => PendingInviteWatcher());
    await settle();
    expect(h.push).toHaveBeenCalledTimes(1);
    expect(h.push).toHaveBeenCalledWith('/invite');
    expect(h.clear).not.toHaveBeenCalled();
  });

  it('a servers-on STORE build with a token left in the Keychain: pushes nothing and drops the token', async () => {
    h.alpha = false;
    renderHook(() => PendingInviteWatcher());
    await settle();
    expect(h.push).not.toHaveBeenCalled();
    expect(h.read).not.toHaveBeenCalled();
    expect(h.clear).toHaveBeenCalledTimes(1);
    expect(h.clear).toHaveBeenCalledWith();
  });

  it('servers off (any build): pushes nothing and drops the token', async () => {
    for (const alpha of [true, false]) {
      h.push.mockReset();
      h.clear.mockClear();
      h.serverFeatures = false;
      h.alpha = alpha;
      renderHook(() => PendingInviteWatcher());
      await settle();
      expect(h.push, `alpha ${alpha}`).not.toHaveBeenCalled();
      expect(h.clear, `alpha ${alpha}`).toHaveBeenCalledTimes(1);
    }
  });

  it('with the flow but no saved token, or already on the invite screen: nothing is pushed and nothing is dropped', async () => {
    h.saved = null;
    renderHook(() => PendingInviteWatcher());
    await settle();
    expect(h.push).not.toHaveBeenCalled();
    h.saved = TOKEN;
    h.pathname = '/invite';
    renderHook(() => PendingInviteWatcher());
    await settle();
    expect(h.push).not.toHaveBeenCalled();
    expect(h.clear).not.toHaveBeenCalled();
  });

  it('waits for the navigator, and looks once', async () => {
    h.navKey = undefined;
    const run = renderHook(() => PendingInviteWatcher());
    await settle();
    expect(h.push).not.toHaveBeenCalled();
    expect(h.read).not.toHaveBeenCalled();
    h.navKey = 'root';
    run.rerender();
    await settle();
    run.rerender();
    await settle();
    expect(h.push).toHaveBeenCalledTimes(1);
  });
});
