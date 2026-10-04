/**
 * usePlan mapping (ADR 0013): StoreKit 2 on the device -> the plan engine's
 * PlanView -> decide(). Pure logic only; the native module and Apple's sheets
 * are checked on a device (docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md, sandbox list).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_READ_TOGETHER_FREE_TRIES, planActive } from '@scribe/core';
import { describe, expect, it } from 'vitest';
import type { NativeEntitlementSnapshot, NativeStatus, NativeTransaction } from '../modules/scribe-store/types';
import { periodOf, PLUS_PRODUCT_IDS } from '../src/lib/billing/config';
import { billingCopy } from '../src/lib/billing/copy';
import {
  countsAsFreeSession,
  EMPTY_PLAN,
  freeSessionsFrom,
  isAnyBirthdayToday,
  isJoinedBook,
  localDateOf,
  parsePlanCache,
  planFromSnapshot,
  planLine,
  plusOn,
  readTogetherDecision,
  sameEntitlements,
  sanitizeSnapshot,
  serializePlanCache,
  sessionsFrom,
  startBookDecision,
  startedBookCount,
  type BookFacts,
  type GateContext,
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

  it('grace without a date from Apple: on until the next check (one day)', () => {
    const p = planFromSnapshot(snap([tx({ expiresAt: at(-1) })], [status({ expiresAt: at(-1), state: 'inGracePeriod' })]));
    expect(p.view.effectiveUntil).toBe(at(1));
  });

  it('Apple still lists a subscription past its end (renewal not on this phone yet): on for a day, not called a payment problem', () => {
    const p = planFromSnapshot(snap([tx({ expiresAt: at(-0.5) })]));
    expect(p.view.state).toBe('active');
    expect(plusOn(p, NOW)).toBe(true);
    expect(plusOn(p, at(1.5))).toBe(false);
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
});

const ACTIVE = planFromSnapshot(snap([tx()])).view;
const SHARED = planFromSnapshot(snap([tx({ ownership: 'familyShared' })])).view;
const LAPSED = planFromSnapshot(snap([], [status({ state: 'expired', expiresAt: at(-5) })])).view;
const FREE = EMPTY_PLAN.view;
const started: BookFacts = { birthday: '2025-04-12' };
const joinedBook: BookFacts = { birthday: '2025-02-01', createdByMe: false };
const ctx = (over: Partial<GateContext> = {}): GateContext => ({ now: NOW, today: '2026-10-03', plan: FREE, books: [], ...over });

describe('start_book through decide() (PRD-REQ-015)', () => {
  it('the first book is free', () => {
    expect(startBookDecision(ctx())).toEqual({ kind: 'allow', via: 'free_book' });
  });

  it('a second book offers Plus, and never asks to sign in first (Plus belongs to the Apple Account)', () => {
    expect(startBookDecision(ctx({ books: [started] }))).toEqual({ kind: 'offer', trigger: 'second_child', needsSignIn: false });
  });

  it('[PRD-REQ-015] co-parent books never count toward the free book', () => {
    expect(isJoinedBook(joinedBook)).toBe(true);
    expect(isJoinedBook(started)).toBe(false);
    expect(startedBookCount([joinedBook, joinedBook])).toBe(0);
    expect(startBookDecision(ctx({ books: [joinedBook] }))).toEqual({ kind: 'allow', via: 'free_book' });
    expect(startBookDecision(ctx({ books: [joinedBook, started] })).kind).toBe('offer');
  });

  it('a book in the delete window does not count', () => {
    expect(startBookDecision(ctx({ books: [{ ...started, deleted: true }] }))).toEqual({ kind: 'allow', via: 'free_book' });
  });

  it('own Plus or Family Sharing Plus starts any number of books', () => {
    expect(startBookDecision(ctx({ plan: ACTIVE, books: [started, started, started] }))).toEqual({ kind: 'allow', via: 'plus_own' });
    expect(startBookDecision(ctx({ plan: SHARED, books: [started] }))).toEqual({ kind: 'allow', via: 'plus_own' });
  });

  it('lapsed Plus: existing books untouched, the next one offers Plus', () => {
    expect(startBookDecision(ctx({ plan: LAPSED, books: [started, started] }))).toEqual({ kind: 'offer', trigger: 'second_child', needsSignIn: false });
  });

  it('[C-REQ-023] on a birthday nothing is sold', () => {
    expect(startBookDecision(ctx({ books: [{ birthday: '2025-10-03' }] }))).toEqual({ kind: 'quiet', reason: 'birthday' });
  });
});

describe('read_together through decide() (PRD-REQ-020)', () => {
  const rt = (over: Partial<GateContext> & { sessionsUsed?: number; freeSessions?: number; book?: BookFacts | null } = {}) =>
    readTogetherDecision({ ...ctx(over), book: over.book === undefined ? started : over.book, sessionsUsed: over.sessionsUsed ?? 0, freeSessions: over.freeSessions ?? 3 });

  it('three free sessions per Free book, then Plus', () => {
    expect(rt({ sessionsUsed: 0 })).toEqual({ kind: 'allow', via: 'try', triesLeft: 3 });
    expect(rt({ sessionsUsed: 2 })).toEqual({ kind: 'allow', via: 'try', triesLeft: 1 });
    expect(rt({ sessionsUsed: 3 })).toEqual({ kind: 'offer', trigger: 'read_together', needsSignIn: false });
  });

  it('Plus, own or through Family Sharing, opens it in every book, joined ones included', () => {
    expect(rt({ plan: ACTIVE, sessionsUsed: 9 })).toEqual({ kind: 'allow', via: 'plus_own' });
    expect(rt({ plan: SHARED, sessionsUsed: 9, book: joinedBook })).toEqual({ kind: 'allow', via: 'plus_own' });
  });

  it('only a free try counts as a used session', () => {
    expect(countsAsFreeSession(rt({ sessionsUsed: 1 }))).toBe(true);
    expect(countsAsFreeSession(rt({ plan: ACTIVE }))).toBe(false);
    expect(countsAsFreeSession(rt({ sessionsUsed: 3 }))).toBe(false);
  });

  it('a contributor is never sold Plus', () => {
    expect(rt({ sessionsUsed: 3, book: { ...started, role: 'contributor' } })).toEqual({ kind: 'quiet', reason: 'contributor' });
  });

  it('free sessions: remote config may raise the reviewed default, never lower it', () => {
    expect(freeSessionsFrom(undefined)).toBe(DEFAULT_READ_TOGETHER_FREE_TRIES);
    expect(freeSessionsFrom(5)).toBe(5);
    expect(freeSessionsFrom(0)).toBe(3);
    expect(freeSessionsFrom(-1)).toBe(3);
    expect(freeSessionsFrom('9')).toBe(3);
    expect(rt({ sessionsUsed: 3, freeSessions: freeSessionsFrom(5) })).toEqual({ kind: 'allow', via: 'try', triesLeft: 2 });
  });

  it('stored counts are read safely', () => {
    expect(sessionsFrom(null)).toBe(0);
    expect(sessionsFrom('2')).toBe(2);
    expect(sessionsFrom('-4')).toBe(0);
    expect(sessionsFrom('abc')).toBe(0);
  });
});

describe('birthdays', () => {
  it('a birthday, not the day of birth, and never a due date', () => {
    expect(isAnyBirthdayToday([{ birthday: '2025-10-03' }], '2026-10-03')).toBe(true);
    expect(isAnyBirthdayToday([{ birthday: '2026-10-03' }], '2026-10-03')).toBe(false);
    expect(isAnyBirthdayToday([{ birthday: null }], '2026-10-03')).toBe(false);
    expect(isAnyBirthdayToday([{ birthday: '2025-10-03', deleted: true }], '2026-10-03')).toBe(false);
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

  it('founder prices and free trials: $3.99 a month with 1 month free, $29.99 a year with 2 months free', () => {
    const byId = Object.fromEntries(file.subscriptionGroups[0].subscriptions.map((s) => [s.productID as string, s]));
    expect(byId['plus.monthly']).toMatchObject({ displayPrice: '3.99', recurringSubscriptionPeriod: 'P1M' });
    expect(byId['plus.monthly'].introductoryOffer).toMatchObject({ paymentMode: 'free', subscriptionPeriod: 'P1M', numberOfPeriods: 1 });
    expect(byId['plus.annual']).toMatchObject({ displayPrice: '29.99', recurringSubscriptionPeriod: 'P1Y' });
    expect(byId['plus.annual'].introductoryOffer).toMatchObject({ paymentMode: 'free', subscriptionPeriod: 'P2M', numberOfPeriods: 1 });
    expect(periodOf('plus.monthly')).toBe('month');
    expect(periodOf('plus.annual')).toBe('year');
  });
});

describe('what the store view promises', () => {
  // D-073 (founder, 3 Oct 2026, evening): the owner's encrypted backup ships in v1.0, as part of Plus. It
  // supersedes D-059's "no audio upload", so backup is now something the store view may list. Themes and
  // covers still are not in v1.0.
  it('[App Review 3.1.2] lists only what v1.0 ships (backup per D-073; no extra themes yet)', () => {
    const said = billingCopy.store.features.join(' ');
    expect(said).not.toMatch(/theme|cover/i);
    expect(said).toMatch(/backup/i);
    expect(said).toMatch(/Read together/);
    expect(said).toMatch(/more children/);
  });

  it('never states a price or trial length itself (Apple shows the storefront price and eligibility)', () => {
    const all = JSON.stringify(billingCopy);
    expect(all).not.toMatch(/\$\d|\d+(\.\d+)? ?(USD|dollars)|1 month free|2 months free/i);
  });
});
