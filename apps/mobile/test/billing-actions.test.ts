/**
 * presentPlusStore() (lib/billing/actions.ts): Apple's subscription store
 * view, and what happens when it closes. After a NEW purchase of the person's
 * own (G-15) it opens the purchase confirmation (/plus/confirmed) and re-plans
 * the plan reminders; a Family Sharing plan, a plan that was already on, a
 * dismissed sheet or a failed one never open it. The native module, the
 * router and the plan store are fakes; Apple's sheet is checked on a device.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { billingCopy } from '@scribe/content';
import type { NativeEntitlementSnapshot, StoreSheetOutcome } from '../modules/scribe-store/types';
import { EMPTY_PLAN, planFromSnapshot, sanitizeSnapshot, type PlanState } from '../src/lib/billing/plan.logic';

const fake = vi.hoisted(() => ({
  plan: null as unknown as PlanState,
  afterSheet: null as unknown as PlanState,
  support: 'available' as 'available' | 'needs_ios_17' | 'unsupported',
  store: {
    presentSubscriptionStore: vi.fn(async (): Promise<{ outcome: StoreSheetOutcome }> => ({ outcome: 'dismissed' })),
  },
  refreshPlan: vi.fn(async () => {
    fake.plan = fake.afterSheet;
  }),
  reschedule: vi.fn(async () => {}),
  router: { push: vi.fn(), navigate: vi.fn(), replace: vi.fn() },
  openURL: vi.fn(async () => {}),
}));

vi.mock('../modules/scribe-store', () => ({ ScribeStore: fake.store }));
vi.mock('../src/lib/billing/plan-store', () => ({
  getPlan: () => fake.plan,
  refreshPlan: fake.refreshPlan,
  storeViewSupport: () => fake.support,
}));
vi.mock('../src/lib/billing/plan-reminders', () => ({ reschedulePlanReminders: fake.reschedule }));
vi.mock('expo-router', () => ({ router: fake.router }));
vi.mock('react-native', () => ({ Linking: { openURL: fake.openURL } }));

import { CONFIRMATION_ROUTE, presentPlusStore, storeSheetOptions } from '../src/lib/billing/actions';

const NOW = Date.parse('2026-12-01T12:00:00.000Z');

function planOf(ownership: 'purchased' | 'familyShared'): PlanState {
  const raw: NativeEntitlementSnapshot = {
    entitlements: [{ productId: 'plus.monthly', expiresAt: '2027-01-01T00:00:00.000Z', purchasedAt: '2026-12-01T00:00:00.000Z', ownership, environment: 'production', isTrial: true, isUpgraded: false }],
    statuses: [{ productId: 'plus.monthly', expiresAt: '2027-01-01T00:00:00.000Z', purchasedAt: '2026-12-01T00:00:00.000Z', ownership, environment: 'production', isTrial: true, isUpgraded: false, state: 'subscribed', willAutoRenew: true }],
    checkedAt: new Date(NOW).toISOString(),
  };
  return planFromSnapshot(sanitizeSnapshot(raw));
}

beforeEach(() => {
  vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
  fake.plan = EMPTY_PLAN;
  fake.afterSheet = EMPTY_PLAN;
  fake.support = 'available';
  fake.store.presentSubscriptionStore.mockReset().mockResolvedValue({ outcome: 'dismissed' });
  fake.refreshPlan.mockClear();
  fake.reschedule.mockClear();
  for (const fn of Object.values(fake.router)) fn.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('[G-15] presentPlusStore opens the confirmation only after a new purchase of one\'s own', () => {
  it('a new purchase: purchased, the confirmation opens, the reminders are re-planned', async () => {
    fake.afterSheet = planOf('purchased');
    fake.store.presentSubscriptionStore.mockResolvedValue({ outcome: 'purchased' });
    expect(await presentPlusStore()).toBe('purchased');
    expect(fake.refreshPlan).toHaveBeenCalledTimes(1);
    expect(fake.router.push).toHaveBeenCalledWith(CONFIRMATION_ROUTE);
    expect(fake.reschedule).toHaveBeenCalledTimes(1);
  });

  it('trusts StoreKit over the sheet: a purchase that lands after the sheet closed still counts', async () => {
    fake.afterSheet = planOf('purchased');
    fake.store.presentSubscriptionStore.mockResolvedValue({ outcome: 'dismissed' });
    expect(await presentPlusStore()).toBe('purchased');
    expect(fake.router.push).toHaveBeenCalledWith(CONFIRMATION_ROUTE);
  });

  it('Plus already on through one\'s own purchase: no second confirmation', async () => {
    fake.plan = planOf('purchased');
    fake.afterSheet = planOf('purchased');
    expect(await presentPlusStore()).toBe('purchased');
    expect(fake.router.push).not.toHaveBeenCalled();
    expect(fake.reschedule).not.toHaveBeenCalled();
  });

  it('Plus through Family Sharing: purchased for the Keep gate, but no confirmation and no reminders (not billed, cannot cancel)', async () => {
    fake.afterSheet = planOf('familyShared');
    expect(await presentPlusStore()).toBe('purchased');
    expect(fake.router.push).not.toHaveBeenCalled();
    expect(fake.reschedule).not.toHaveBeenCalled();
  });

  it('a dismissed sheet with nothing bought: dismissed, nothing opens', async () => {
    expect(await presentPlusStore()).toBe('dismissed');
    expect(fake.refreshPlan).toHaveBeenCalledTimes(1);
    expect(fake.router.push).not.toHaveBeenCalled();
    expect(fake.reschedule).not.toHaveBeenCalled();
  });

  it('a router that cannot push (web preview, tests) does not lose the purchase', async () => {
    fake.afterSheet = planOf('purchased');
    fake.router.push.mockImplementationOnce(() => {
      throw new Error('no navigator');
    });
    expect(await presentPlusStore()).toBe('purchased');
    expect(fake.reschedule).toHaveBeenCalledTimes(1);
  });

  it('is unavailable when the store view cannot open here (older iOS), without touching StoreKit', async () => {
    fake.support = 'needs_ios_17';
    expect(await presentPlusStore()).toBe('unavailable');
    expect(fake.store.presentSubscriptionStore).not.toHaveBeenCalled();
    expect(fake.refreshPlan).not.toHaveBeenCalled();
  });

  it('is unavailable when the native sheet throws, and re-arms for the next tap', async () => {
    fake.store.presentSubscriptionStore.mockRejectedValueOnce(new Error('StoreKit'));
    expect(await presentPlusStore()).toBe('unavailable');
    expect(await presentPlusStore()).toBe('dismissed');
  });

  it('a second tap while the sheet is open is busy, not a second sheet', async () => {
    let close: (v: { outcome: StoreSheetOutcome }) => void = () => {};
    fake.store.presentSubscriptionStore.mockImplementationOnce(() => new Promise((r) => (close = r)));
    const first = presentPlusStore();
    expect(await presentPlusStore()).toBe('busy');
    close({ outcome: 'dismissed' });
    expect(await first).toBe('dismissed');
    expect(fake.store.presentSubscriptionStore).toHaveBeenCalledTimes(1);
  });
});

describe('the store sheet options', () => {
  it('name both Plus products and the legal links, and type no price and no email promise (D-083)', () => {
    const o = storeSheetOptions();
    expect(o.productIds).toEqual(['plus.annual', 'plus.monthly']);
    expect(o.termsUrl).toMatch(/^https:\/\//);
    expect(o.privacyUrl).toMatch(/^https:\/\//);
    // The renewal note mirrors the Subscription Terms' cancel-timing disclosure (docs/legal/in-app-disclosures.md,
    // billingCopy.store.renewal), so it is not held to the Keep gate's "free trial" ban here; counsel owns that sentence.
    expect([o.title, o.subtitle, ...o.features, ...o.notes].join(' ')).not.toMatch(/\$\d|we will email|we'll email/i);
    expect(o.notes).toContain(billingCopy.store.renewal);
  });
});
