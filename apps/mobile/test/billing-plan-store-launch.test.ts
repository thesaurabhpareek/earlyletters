/**
 * The plan store at launch (lib/billing/plan-store.ts), with a fake ScribeStore native module.
 *
 *  - RT-OFC-06 / RT-SUB-13 (JavaScript half): startPlus starts the native transaction listener (which, in Swift, also
 *    walks Transaction.unfinished, finishes each verified one and sends one "update"), reads StoreKit's entitlements
 *    at once, and re-reads on every onEntitlementsChanged. It never calls AppStore.sync at launch: that asks the person
 *    to sign in, so it runs only from Restore. The Swift half is a Device check (Xcode Transaction Manager).
 *  - RT-PAY-17: planReadiness waits for the first read, bounded, then says what the plan rests on.
 * Nothing here talks to a server. Fictional Asha family only (no family data at all here).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PLAN_CACHE_KEY } from '../src/lib/billing/config';

const NOW = '2026-11-01T12:00:00.000Z';
const PLUS = {
  entitlements: [{ productId: 'plus.monthly', expiresAt: '2026-12-01T00:00:00.000Z', purchasedAt: '2026-11-01T00:00:00.000Z', ownership: 'purchased', environment: 'production', isTrial: false, isUpgraded: false }],
  statuses: [],
  checkedAt: NOW,
};

const h = vi.hoisted(() => {
  const listeners = new Map<string, () => void>();
  const h = {
    settings: new Map<string, string>(),
    listeners,
    store: null as null | Record<string, ReturnType<typeof vi.fn>>,
    make() {
      return {
        storeViewSupport: vi.fn(() => 'available'),
        startTransactionListener: vi.fn(),
        currentEntitlements: vi.fn(async () => PLUS_SNAPSHOT()),
        sync: vi.fn(async () => 'synced'),
        addListener: vi.fn((name: string, fn: () => void) => {
          listeners.set(name, fn);
          return { remove: () => listeners.delete(name) };
        }),
      };
    },
  };
  return h;
});
// The hoisted fake calls this lazily (in beforeEach, after this module ran): a fresh copy of the snapshot each read.
function PLUS_SNAPSHOT() {
  return JSON.parse(JSON.stringify(PLUS));
}

vi.mock('../modules/scribe-store', () => ({
  get ScribeStore() {
    return h.store;
  },
}));
vi.mock('react-native', () => ({ AppState: { addEventListener: () => ({ remove: () => {} }) } }));
vi.mock('../src/lib/store', () => ({
  getSetting: (k: string) => h.settings.get(k) ?? null,
  setSetting: (k: string, v: string) => void h.settings.set(k, v),
}));
vi.mock('../src/lib/billing/plan-reminders', () => ({ startPlanReminders: () => () => {} }));
vi.mock('../src/lib/capabilities', () => ({ capabilities: { statusReport: false } }));

async function freshStore() {
  vi.resetModules();
  return import('../src/lib/billing/plan-store');
}

beforeEach(() => {
  h.settings.clear();
  h.listeners.clear();
  h.store = h.make();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('[RT-OFC-06, RT-SUB-13] at launch the JavaScript side syncs with StoreKit on the phone', () => {
  it('starts the transaction listener, reads the entitlements at once, and never calls AppStore.sync', async () => {
    const ps = await freshStore();
    const stop = ps.startPlus();
    expect(h.store!.startTransactionListener).toHaveBeenCalledTimes(1);
    expect(h.store!.currentEntitlements).toHaveBeenCalledTimes(1);
    await ps.refreshPlan();
    expect(ps.getPlan().view.state).toBe('active');
    expect(h.store!.sync).not.toHaveBeenCalled(); // Restore only: it asks the person to sign in
    stop();
  });

  it('re-reads whenever Swift reports a change (the "update" after finishing unfinished transactions)', async () => {
    const ps = await freshStore();
    const stop = ps.startPlus();
    await ps.refreshPlan();
    expect(h.listeners.has('onEntitlementsChanged')).toBe(true);
    h.listeners.get('onEntitlementsChanged')!();
    await ps.refreshPlan();
    expect(h.store!.currentEntitlements).toHaveBeenCalledTimes(2);
    stop();
  });
});

describe('[RT-PAY-17] planReadiness: what the plan rests on when a gate asks', () => {
  it('a read that lands within the wait: read', async () => {
    const ps = await freshStore();
    expect(await ps.planReadiness(1000)).toBe('read');
    expect(ps.getPlan().view.state).toBe('active');
    // After the first read it answers at once, without another read.
    expect(await ps.planReadiness(1000)).toBe('read');
    expect(h.store!.currentEntitlements).toHaveBeenCalledTimes(1);
  });

  it('StoreKit slow and nothing cached: none after the bounded wait, never longer', async () => {
    vi.useFakeTimers();
    h.store!.currentEntitlements.mockImplementation(() => new Promise(() => {}));
    const ps = await freshStore();
    const answer = ps.planReadiness(1000);
    await vi.advanceTimersByTimeAsync(1000);
    expect(await answer).toBe('none');
  });

  it('StoreKit slow with a snapshot cached from an earlier read: cached, and the cached Plus is what the gate sees', async () => {
    vi.useFakeTimers();
    h.settings.set(PLAN_CACHE_KEY, JSON.stringify({ v: 1, s: PLUS }));
    h.store!.currentEntitlements.mockImplementation(() => new Promise(() => {}));
    const ps = await freshStore();
    const answer = ps.planReadiness(1000);
    await vi.advanceTimersByTimeAsync(1000);
    expect(await answer).toBe('cached');
    expect(ps.getPlan().view.state).toBe('active');
  });

  it('StoreKit fails with nothing cached: none (the gate then holds the letter)', async () => {
    h.store!.currentEntitlements.mockRejectedValue(new Error('storekit'));
    const ps = await freshStore();
    expect(await ps.planReadiness(1000)).toBe('none');
  });

  it('no StoreKit on this device: no_store, at once', async () => {
    h.store = null;
    const ps = await freshStore();
    expect(await ps.planReadiness(1000)).toBe('no_store');
  });
});
