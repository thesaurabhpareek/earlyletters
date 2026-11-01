/**
 * usePlan mapping (ADR 0013): StoreKit 2 on the device -> the plan engine's
 * PlanView -> decide(). Pure logic only; the native module and Apple's sheets
 * are checked on a device (docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md, sandbox list).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { decideKeepLetter, planActive, type PlanView } from '@scribe/core';
import { describe, expect, it } from 'vitest';
import type { NativeEntitlementSnapshot, NativeStatus, NativeTransaction } from '../modules/scribe-store/types';
import { periodOf, PLUS_PRODUCT_IDS } from '../src/lib/billing/config';
import { billingCopy } from '../src/lib/billing/copy';
import { APP_STORE_PLUS } from '../../../packages/content/src/pricing';
import {
  EMPTY_PLAN,
  isJoinedBook,
  localDateOf,
  parsePlanCache,
  planFromSnapshot,
  planLine,
  plusOn,
  sameEntitlements,
  sanitizeSnapshot,
  serializePlanCache,
  STILL_LISTED_MS,
  type BookFacts,
} from '../src/lib/billing/plan.logic';

const NOW = '2026-10-03T12:00:00.000Z';
const at = (days: number) => new Date(Date.parse(NOW) + days * 86_400_000).toISOString();

const tx = (over: Partial<NativeTransaction> = {}): NativeTransaction => ({
  productId: 'plus.monthly',
  expiresAt: at(20),
  purchasedAt: at(-10),
  ownership: 'purchased',
  environment: 'production',
  isTrial: false,
  isUpgraded: false,
  ...over,
});
const status = (over: Partial<NativeStatus> = {}): NativeStatus => ({ ...tx(), state: 'subscribed', willAutoRenew: true, ...over });
const snap = (entitlements: NativeTransaction[], statuses: NativeStatus[] = [], checkedAt = NOW): NativeEntitlementSnapshot => ({
  entitlements,
  statuses,
  checkedAt,
});

describe('planFromSnapshot: StoreKit 2 -> PlanView', () => {
  it('never read StoreKit: Free, nothing locked', () => {
    const p = planFromSnapshot(null);
    expect(p).toBe(EMPTY_PLAN);
    expect(plusOn(p, NOW)).toBe(false);
    expect(planLine(p, NOW)).toEqual({ kind: 'off' });
  });

  it('own monthly subscription: active until the period end, renews', () => {
    const p = planFromSnapshot(snap([tx()], [status()]));
    expect(p.view).toEqual({ state: 'active', effectiveUntil: at(20), verifiedAt: NOW, environment: 'production', isTester: false });
    expect(plusOn(p, NOW)).toBe(true);
    expect(p.details).toMatchObject({ productId: 'plus.monthly', period: 'month', ownership: 'purchased', willAutoRenew: true, cancelBy: at(19) });
    expect(planLine(p, NOW)).toEqual({ kind: 'renews', on: localDateOf(at(20)) });
  });

  it('free trial: trial state, cancel-by 24 hours before it ends', () => {
    const p = planFromSnapshot(snap([tx({ productId: 'plus.annual', isTrial: true, expiresAt: at(60) })], [status({ productId: 'plus.annual', isTrial: true, expiresAt: at(60) })]));
    expect(p.view.state).toBe('trial');
    expect(p.details.period).toBe('year');
    expect(p.details.cancelBy).toBe(at(59));
    expect(planLine(p, NOW)).toEqual({ kind: 'trial', until: localDateOf(at(60)), cancelBy: localDateOf(at(59)) });
  });

  it('cancelled (will not renew): Plus stays on until the end, no cancel-by date', () => {
    const p = planFromSnapshot(snap([tx()], [status({ willAutoRenew: false })]));
    expect(plusOn(p, NOW)).toBe(true);
    expect(p.details.cancelBy).toBeNull();
    expect(planLine(p, NOW)).toEqual({ kind: 'ends', on: localDateOf(at(20)) });
    expect(plusOn(p, at(21))).toBe(false);
  });

  it('[C-REQ-027] billing grace keeps Plus on until Apple\'s grace end', () => {
    const p = planFromSnapshot(snap([tx({ expiresAt: at(-2) })], [status({ expiresAt: at(-2), state: 'inGracePeriod', gracePeriodExpiresAt: at(14) })]));
    expect(p.view.state).toBe('grace');
    expect(p.view.effectiveUntil).toBe(at(14));
    expect(p.details.graceEnd).toBe(at(14));
    expect(plusOn(p, at(13))).toBe(true);
    expect(planLine(p, NOW)).toEqual({ kind: 'grace' });
  });

  it('grace without a date from Apple: on until the next check (at most 7 days, C-NFR-004)', () => {
    const p = planFromSnapshot(snap([tx({ expiresAt: at(-1) })], [status({ expiresAt: at(-1), state: 'inGracePeriod' })]));
    expect(p.view.effectiveUntil).toBe(at(7));
  });

  it('Apple still lists a subscription past its end (renewal not on this phone yet): on for 7 days, not called a payment problem', () => {
    const p = planFromSnapshot(snap([tx({ expiresAt: at(-0.5) })]));
    expect(p.view.state).toBe('active');
    expect(plusOn(p, NOW)).toBe(true);
    expect(plusOn(p, at(1.5))).toBe(true);
    expect(plusOn(p, at(6.9))).toBe(true);
    expect(plusOn(p, at(7))).toBe(false);
  });

  it('[C-NFR-004, RT-SUB-13] offline renewal grace is 7 days, pinned to the PRD line (CR-39: fail open for a payer)', () => {
    expect(STILL_LISTED_MS).toBe(7 * 86_400_000);
    const prd = readFileSync(join(__dirname, '..', '..', '..', 'docs', 'prd', 'C-habits-pricing-settings.md'), 'utf8');
    const line = prd.split('\n').find((l) => l.includes('**C-NFR-004'));
    expect(line).toContain('The last known entitlement is cached for 7 days.');
    // A payer whose renewal has not reached this phone, offline for 6 days after the last read, still has Plus.
    const offline = planFromSnapshot(snap([tx({ expiresAt: at(-0.1) })], [status({ expiresAt: at(-0.1) })]));
    expect(plusOn(offline, at(6))).toBe(true);
    // A fresh read that no longer lists it is Free at once: the 7 days never outlive Apple's answer.
    const lapsed = planFromSnapshot(snap([], [status({ state: 'expired', expiresAt: at(-0.1), willAutoRenew: false })]));
    expect(plusOn(lapsed, NOW)).toBe(false);
  });

  it('[K-28] Family Sharing: the co-parent has Plus as their own entitlement; nothing to cancel or refund', () => {
    const shared = tx({ ownership: 'familyShared' });
    const p = planFromSnapshot(snap([shared], [status({ ownership: 'familyShared' })]));
    expect(plusOn(p, NOW)).toBe(true);
    expect(p.details.ownership).toBe('familyShared');
    expect(p.details.cancelBy).toBeNull();
  });

  it('own purchase and Family Sharing together: the Plan screen shows the own purchase', () => {
    const p = planFromSnapshot(snap([tx({ ownership: 'familyShared', expiresAt: at(300) }), tx({ productId: 'plus.annual', expiresAt: at(40) })]));
    expect(p.details.ownership).toBe('purchased');
    expect(p.details.productId).toBe('plus.annual');
    expect(p.view.effectiveUntil).toBe(at(300));
  });

  it('upgraded and revoked transactions never count', () => {
    expect(plusOn(planFromSnapshot(snap([tx({ isUpgraded: true })])), NOW)).toBe(false);
    expect(plusOn(planFromSnapshot(snap([tx({ revokedAt: at(-1) })])), NOW)).toBe(false);
  });

  it('a verified status that says subscribed counts even if the entitlement list missed it (fail open for payers)', () => {
    expect(plusOn(planFromSnapshot(snap([], [status()])), NOW)).toBe(true);
  });

  it('billing retry outside grace: extras off, the Plan screen says why', () => {
    const p = planFromSnapshot(snap([], [status({ state: 'inBillingRetryPeriod', expiresAt: at(-3) })]));
    expect(p.view.state).toBe('billing_retry');
    expect(plusOn(p, NOW)).toBe(false);
    expect(planLine(p, NOW)).toEqual({ kind: 'retry' });
  });

  it('[C-REQ-029] refunded (revoked by Apple): Free at once', () => {
    const p = planFromSnapshot(snap([], [status({ state: 'revoked', revokedAt: at(-1) })]));
    expect(p.view.state).toBe('revoked');
    expect(plusOn(p, NOW)).toBe(false);
  });

  it('expired: Free, and the Plan screen says off', () => {
    const p = planFromSnapshot(snap([], [status({ state: 'expired', expiresAt: at(-5), willAutoRenew: false })]));
    expect(p.view.state).toBe('expired');
    expect(planLine(p, NOW)).toEqual({ kind: 'off' });
  });

  it('sandbox (TestFlight, App Review) and Xcode purchases count on the device', () => {
    const sandbox = planFromSnapshot(snap([tx({ environment: 'sandbox' })]));
    const xcode = planFromSnapshot(snap([tx({ environment: 'xcode' })]));
    expect(sandbox.view.isTester).toBe(true);
    expect(planActive(sandbox.view, NOW)).toBe(true);
    expect(planActive(xcode.view, NOW)).toBe(true);
  });

  it('[C-NFR-004] a cache read 9 days ago with a period still paid keeps Plus on', () => {
    const p = planFromSnapshot(snap([tx({ expiresAt: at(20) })], [], at(-9)));
    expect(plusOn(p, NOW)).toBe(true);
  });
});

describe('[SUB-05] offer codes: a free period is free, not paid', () => {
  // A redeemed offer code with free months: StoreKit says offerType offer_code, freePeriod true, isTrial false.
  const coded = (months: number, over: Partial<NativeTransaction> = {}) =>
    tx({ isTrial: false, offerType: 'offer_code', freePeriod: true, purchasedAt: at(-1), expiresAt: at(months * 30 - 1), ...over });

  it('1 month and 3 months free from a code: trial, "free until", with the cancel-by day', () => {
    for (const months of [1, 3]) {
      const t = coded(months);
      const p = planFromSnapshot(snap([t], [status(t)]));
      expect(p.view.state, String(months)).toBe('trial');
      expect(p.details.status).toBe('trial');
      expect(planLine(p, NOW)).toEqual({ kind: 'trial', until: localDateOf(t.expiresAt!), cancelBy: localDateOf(at(months * 30 - 2)) });
      expect(plusOn(p, NOW)).toBe(true);
    }
  });

  it('a paid offer-code period (no free period) stays active and "renews"', () => {
    const t = coded(1, { freePeriod: false });
    const p = planFromSnapshot(snap([t], [status(t)]));
    expect(p.view.state).toBe('active');
    expect(planLine(p, NOW)).toMatchObject({ kind: 'renews' });
  });

  it('the native fields survive validation and the device cache; unknown offer kinds read as other', () => {
    const raw = { entitlements: [{ ...coded(3) }, { ...tx({ productId: 'plus.annual' }), offerType: 'something_new', freePeriod: 'yes' }], statuses: [], checkedAt: NOW };
    const clean = sanitizeSnapshot(raw)!;
    expect(clean.entitlements[0]).toMatchObject({ offerType: 'offer_code', freePeriod: true });
    expect(clean.entitlements[1].offerType).toBe('other');
    expect('freePeriod' in clean.entitlements[1]).toBe(false);
    expect(parsePlanCache(serializePlanCache(clean))?.entitlements[0]).toMatchObject({ offerType: 'offer_code', freePeriod: true });
    expect(planFromSnapshot(clean).view.state).toBe('trial');
  });

  it('a snapshot without the fields (an older cache, or before iOS 17.2 for a code) reads as before', () => {
    const p = planFromSnapshot(snap([tx()], [status()]));
    expect(p.view.state).toBe('active');
  });
});

describe('snapshot validation and the device cache', () => {
  it('drops other products and malformed entries, never throws', () => {
    const s = sanitizeSnapshot({
      checkedAt: NOW,
      entitlements: [tx(), { productId: 'someone.else' }, null, 'x', { productId: 'plus.annual', environment: 'moon', ownership: 'x' }],
      statuses: [{ ...status(), state: 'weird' }],
    });
    expect(s?.entitlements.map((e) => e.productId)).toEqual(['plus.monthly', 'plus.annual']);
    expect(s?.entitlements[1]).toMatchObject({ environment: 'production', ownership: 'purchased', isTrial: false });
    expect(s?.statuses[0].state).toBe('unknown');
    expect(sanitizeSnapshot({ entitlements: [] })).toBeNull();
    expect(sanitizeSnapshot(undefined)).toBeNull();
  });

  it('round-trips through the cache; other versions and garbage read as nothing', () => {
    const s = snap([tx()], [status()]);
    expect(parsePlanCache(serializePlanCache(s))).toEqual(s);
    expect(parsePlanCache(JSON.stringify({ v: 2, s }))).toBeNull();
    expect(parsePlanCache('{not json')).toBeNull();
    expect(parsePlanCache(null)).toBeNull();
  });

  it('holds no ids: only product ids, dates and flags', () => {
    const cached = serializePlanCache(snap([tx()], [status()]));
    expect(cached).not.toMatch(/transaction|originalID|appAccountToken|receipt|email/i);
  });

  it('sameEntitlements ignores when StoreKit was read', () => {
    expect(sameEntitlements(snap([tx()], [], NOW), snap([tx()], [], at(1)))).toBe(true);
    expect(sameEntitlements(snap([tx()]), snap([tx({ expiresAt: at(50) })]))).toBe(false);
    expect(sameEntitlements(null, null)).toBe(true);
  });

  it('[G-15] the first purchase date survives the cache and counts as a change (the yearly reminder\'s anniversary)', () => {
    const first = tx({ originalPurchasedAt: at(-400) });
    const s = snap([first], [status()]);
    expect(parsePlanCache(serializePlanCache(s))?.entitlements[0].originalPurchasedAt).toBe(at(-400));
    expect(planFromSnapshot(s).details).toMatchObject({ purchasedAt: at(-10), originalPurchasedAt: at(-400) });
    expect(planFromSnapshot(snap([tx()])).details.originalPurchasedAt).toBeNull();
    // A corrected first-purchase date from StoreKit is a change worth re-caching and re-planning.
    expect(sameEntitlements(s, snap([tx({ originalPurchasedAt: at(-30) })], [status()]))).toBe(false);
    expect(sanitizeSnapshot({ ...s, entitlements: [{ ...first, originalPurchasedAt: 'yesterday' }] })?.entitlements[0].originalPurchasedAt).toBeUndefined();
  });
});

const ACTIVE = planFromSnapshot(snap([tx()])).view;
const SHARED = planFromSnapshot(snap([tx({ ownership: 'familyShared' })])).view;
const LAPSED = planFromSnapshot(snap([], [status({ state: 'expired', expiresAt: at(-5) })])).view;
const FREE = EMPTY_PLAN.view;
const joinedBook: BookFacts = { birthday: '2025-02-01', createdByMe: false };

describe('the Keep gate through decideKeepLetter (D-082, D-083)', () => {
  const keep = (plan: PlanView, lettersKept: number, allowance?: unknown) => decideKeepLetter({ now: NOW, plan, lettersKept, allowance });

  it('two letters are free, the third needs Plus, and it never asks to sign in first (Plus belongs to the Apple Account)', () => {
    expect(keep(FREE, 0)).toEqual({ kind: 'allow', via: 'free_letters', lettersLeft: 2 });
    expect(keep(FREE, 1)).toEqual({ kind: 'allow', via: 'free_letters', lettersLeft: 1 });
    expect(keep(FREE, 2)).toEqual({ kind: 'offer', trigger: 'keep_letter', needsSignIn: false, lapsed: false });
  });

  it('own Plus or Family Sharing Plus keeps any number', () => {
    expect(keep(ACTIVE, 40)).toEqual({ kind: 'allow', via: 'plus_own' });
    expect(keep(SHARED, 40)).toEqual({ kind: 'allow', via: 'plus_own' });
  });

  it('a lapsed member sees the lapsed wording at the limit, and still keeps letters under it', () => {
    expect(keep(LAPSED, 2)).toEqual({ kind: 'offer', trigger: 'keep_letter', needsSignIn: false, lapsed: true });
    expect(keep(LAPSED, 1).kind).toBe('allow');
  });

  it('a birthday does not silence the gate: the person tapped Keep, so it must answer', () => {
    // Nothing in the engine reads a birthday for keep_letter; the old no-offers rule is for nudges only.
    expect(keep(FREE, 2).kind).toBe('offer');
  });

  it('[PRD-REQ-015 superseded] starting a book is free: a joined book or ten books never change the answer', () => {
    expect(isJoinedBook(joinedBook)).toBe(true);
    expect(isJoinedBook({})).toBe(false);
    expect(keep(FREE, 1).kind).toBe('allow');
  });

  it('remote config may raise the allowance, never lower it', () => {
    expect(keep(FREE, 2, 0).kind).toBe('offer');
    expect(keep(FREE, 2, 5)).toEqual({ kind: 'allow', via: 'free_letters', lettersLeft: 3 });
  });
});

describe('products and the StoreKit configuration file', () => {
  const file = JSON.parse(readFileSync(join(__dirname, '..', 'storekit', 'EarlyLetters.storekit'), 'utf8')) as {
    subscriptionGroups: Array<{ name: string; subscriptions: Array<Record<string, unknown> & { introductoryOffer?: Record<string, unknown> }> }>;
  };

  it('one group with exactly the app\'s product ids, Family Sharing on', () => {
    expect(file.subscriptionGroups).toHaveLength(1);
    const subs = file.subscriptionGroups[0].subscriptions;
    expect(subs.map((s) => s.productID).sort()).toEqual([...PLUS_PRODUCT_IDS].sort());
    expect(subs.every((s) => s.familyShareable === true)).toBe(true);
  });

  it('founder prices and free trials: $4.99 a month with 1 month free, $49.99 a year with 2 months free', () => {
    const byId = Object.fromEntries(file.subscriptionGroups[0].subscriptions.map((s) => [s.productID as string, s]));
    expect(byId['plus.monthly']).toMatchObject({ displayPrice: '4.99', recurringSubscriptionPeriod: 'P1M' });
    expect(byId['plus.monthly'].introductoryOffer).toMatchObject({ paymentMode: 'free', subscriptionPeriod: 'P1M', numberOfPeriods: 1 });
    expect(byId['plus.annual']).toMatchObject({ displayPrice: '49.99', recurringSubscriptionPeriod: 'P1Y' });
    expect(byId['plus.annual'].introductoryOffer).toMatchObject({ paymentMode: 'free', subscriptionPeriod: 'P2M', numberOfPeriods: 1 });
    expect(periodOf('plus.monthly')).toBe('month');
    expect(periodOf('plus.annual')).toBe('year');
  });

  it('[D-077, F14-REQ-030] names and descriptions match what App Store Connect gets, within Apple\'s limits, and promise only v1.0', () => {
    const subs = file.subscriptionGroups[0].subscriptions as Array<{ productID: string; referenceName: string; localizations: Array<{ displayName: string; description: string }> }>;
    const byId = Object.fromEntries(subs.map((x) => [x.productID, x]));
    const meta = { 'plus.monthly': APP_STORE_PLUS.monthly, 'plus.annual': APP_STORE_PLUS.annual } as const;
    for (const id of PLUS_PRODUCT_IDS) {
      const want = meta[id];
      expect(byId[id].referenceName).toBe(want.referenceName);
      expect(byId[id].localizations[0]).toMatchObject({ displayName: want.displayName, description: want.description });
      expect(want.displayName.length).toBeGreaterThanOrEqual(2);
      expect(want.displayName.length).toBeLessThanOrEqual(30);
      expect(want.description.length).toBeLessThanOrEqual(45);
      expect(want.description).not.toMatch(/Read together|book|backup|theme|free|\$/i);
    }
    expect(file.subscriptionGroups[0].name).toBe(APP_STORE_PLUS.group.referenceName);
    // The confirmation sheet and the emails name the plan the same way (D-077).
    expect([APP_STORE_PLUS.monthly.displayName, APP_STORE_PLUS.annual.displayName]).toEqual([billingCopy.confirmation.planMonthly, billingCopy.confirmation.planAnnual]);
  });
});

describe('what the store view promises', () => {
  // D-085 amends D-073 for v1.0: our own encrypted backup needs sign-in and a server, which v1.0 does not
  // have, so the store view claims no backup (App Review 3.1.2, 2.3.1). Themes and covers are not in v1.0 either.
  it('[App Review 3.1.2] lists only what v1.0 ships (no backup per D-085; no extra themes yet)', () => {
    const said = billingCopy.store.features.join(' ');
    expect(said).not.toMatch(/theme|cover/i);
    expect(said).not.toMatch(/backup/i);
    // D-082, D-083: Plus lets you keep adding letters. Read together and more books are free now.
    expect(said).toMatch(/keep adding letters/i);
    expect(said).not.toMatch(/Read together|more children|first book/);
    expect(billingCopy.store.promise).not.toMatch(/free, always/i);
  });

  it('never states a price or trial length itself (Apple shows the storefront price and eligibility)', () => {
    const all = JSON.stringify(billingCopy);
    expect(all).not.toMatch(/\$\d|\d+(\.\d+)? ?(USD|dollars)|1 month free|2 months free/i);
  });
});
