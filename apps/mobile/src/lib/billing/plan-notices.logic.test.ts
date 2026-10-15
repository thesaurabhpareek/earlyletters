/**
 * Plan reminders and the acknowledgment, from the StoreKit snapshot to the words (BL-342;
 * WP-F14-06, WP-F14-07). Pure logic; the sheets and notifications are checked on a device.
 */
import { PLUS_PRICE, billingCopy } from '@scribe/content';
import { planNotices, type PlanNoticeKind } from '@scribe/core/src/plan-notices';
import { describe, expect, it } from 'vitest';
import type { NativeEntitlementSnapshot, NativeStatus, NativeTransaction } from '../../../modules/scribe-store/types';
import { acknowledgment, noticeSubscriptionOf, noticeText, parseSeen, planNameOf, priceLineOf, serializeSeen } from './plan-notices.logic';
import { planFromSnapshot, sanitizeSnapshot } from './plan.logic';

const NOW = '2027-06-01T17:00:00.000Z';
const at = (days: number) => new Date(Date.parse(NOW) + days * 86_400_000).toISOString();
const tx = (over: Partial<NativeTransaction> & Record<string, unknown> = {}): NativeTransaction => ({
  productId: 'plus.annual',
  expiresAt: at(61),
  purchasedAt: NOW,
  ownership: 'purchased',
  environment: 'production',
  isTrial: true,
  isUpgraded: false,
  ...over,
});
const snap = (t: NativeTransaction, statusOver: Partial<NativeStatus> = {}): NativeEntitlementSnapshot => ({
  entitlements: [t],
  statuses: [{ ...t, state: 'subscribed', willAutoRenew: true, ...statusOver }],
  checkedAt: NOW,
});
const planOf = (s: NativeEntitlementSnapshot) => planFromSnapshot(sanitizeSnapshot(s));
const kindsOf = (s: NativeEntitlementSnapshot) => planNotices({ now: NOW, timeZone: 'America/Los_Angeles', subscription: noticeSubscriptionOf(planOf(s)) }).map((n) => n.kind);

describe('from the StoreKit snapshot to the planner', () => {
  it('an annual introductory trial: free period from the purchase and trial dates, long windows', () => {
    const p = planOf(snap(tx()));
    expect(p.details.freePeriod).toEqual({ offerType: 'introductory', days: 61 });
    expect(kindsOf(snap(tx()))).toEqual(['trial_long', 'trial_final']);
  });

  it('[F14-REQ-044] a free offer code reported by the native module keys the windows on its own length, not the product', () => {
    const code = tx({ productId: 'plus.monthly', isTrial: false, expiresAt: at(92), freeOffer: { type: 'code', days: 92 } });
    const p = planOf(snap(code));
    expect(p.details.freePeriod).toEqual({ offerType: 'code', days: 92 });
    expect(kindsOf(snap(code))).toEqual(['trial_long', 'trial_final']);
  });

  it('junk offer fields are dropped, never thrown on', () => {
    const p = planOf(snap(tx({ isTrial: false, freeOffer: { type: 'bogus', days: -3 }, originalPurchasedAt: 'not a date' })));
    expect(p.details.freePeriod).toBeNull();
    expect(p.details.subscribedSince).toBeNull();
  });

  it('[F14-REQ-006] Family Sharing plans no reminders', () => {
    expect(kindsOf(snap(tx({ ownership: 'familyShared' })))).toEqual([]);
  });

  it('renewal off plans none', () => {
    expect(kindsOf(snap(tx(), { willAutoRenew: false }))).toEqual([]);
  });

  it('a monthly paid plan with its original purchase date gets the yearly reminder', () => {
    const m = tx({ productId: 'plus.monthly', isTrial: false, expiresAt: at(20), purchasedAt: at(-10), originalPurchasedAt: '2026-06-10T17:00:00.000Z' });
    expect(kindsOf(snap(m))).toEqual(['anniversary']);
  });
});

describe('[F14-REQ-009] reminder words', () => {
  const kinds: PlanNoticeKind[] = ['trial_week', 'trial_long', 'trial_final', 'annual_renewal_long', 'annual_renewal_short', 'anniversary'];
  for (const kind of kinds) {
    it(`${kind}: the cancel route, the already-cancelled line, the published price, no child and no offer`, () => {
      const n = { id: `plan.${kind}.2027-08-01`, kind, offerType: null, periodEnd: '2027-08-01T17:00:00.000Z', cancelBy: kind === 'anniversary' ? null : '2027-07-31T17:00:00.000Z', window: { from: NOW, to: NOW }, fireAt: NOW, fireLocal: { date: '2027-06-01', hour: 10, minute: 0 }, card: { from: NOW, until: NOW } };
      const period = kind === 'anniversary' ? 'month' : 'year';
      const t = noticeText(n, period, 'en-US');
      expect(t.body).toContain('Settings, Plan, Manage subscription');
      expect(t.body).toContain('If you have already cancelled, there is nothing to do.');
      expect(t.body).toContain(period === 'month' ? PLUS_PRICE.monthly : PLUS_PRICE.yearly);
      expect(`${t.title} ${t.body}`).not.toMatch(/\{\w+\}|free trial|offer|discount|save \d|letter/i);
      if (kind !== 'anniversary') expect(t.body).toContain('July 31, 2027');
    });
  }

  it('plan names are D-077 and prices come from pricing.ts', () => {
    expect(planNameOf('year')).toBe('Plus Annual');
    expect(planNameOf('month')).toBe('Plus Monthly');
    expect(priceLineOf('year')).toBe(`${PLUS_PRICE.yearly} a year`);
  });
});

describe('[C-REQ-024] the acknowledgment (phone half)', () => {
  it('a trial start: terms, first charge date, price after, cancel-by date and how to cancel; Save a copy shares the same text', () => {
    const a = acknowledgment(planOf(snap(tx())), 'en-US');
    expect(a.hasPurchase).toBe(true);
    const text = a.lines.join('\n');
    expect(text).toContain('Plus Annual is free until');
    expect(text).toMatch(/Your first charge is \$49\.99 a year, on \w+ \d+, 2027\./); // first charge date and price after
    expect(text).toContain('renews automatically'); // the terms
    expect(text).toMatch(/cancel by \w+ \d+, 2027\./); // cancel-by date
    expect(text).toContain(billingCopy.store.cancel); // how to cancel
    expect(text).toContain('https://earlyletters.com/terms');
    for (const line of a.lines) expect(a.shareText).toContain(line);
    expect(a.shareText.startsWith(billingCopy.ack.title)).toBe(true);
  });

  it('a paid purchase names the next charge instead of a free period', () => {
    const a = acknowledgment(planOf(snap(tx({ isTrial: false, expiresAt: at(365) }))), 'en-US');
    expect(a.lines[0]).toMatch(/^Plus Annual is on\. Your next charge is \$49\.99 a year, on /);
  });

  it('Family Sharing or Free: no purchase to describe, only where to look and how to cancel', () => {
    const a = acknowledgment(planOf(snap(tx({ ownership: 'familyShared' }))), 'en-US');
    expect(a.hasPurchase).toBe(false);
    expect(a.lines).toContain(billingCopy.ack.noDates);
    expect(a.lines.join(' ')).not.toMatch(/\$\d/);
  });
});

describe('dismissed cards are stored as notice ids only', () => {
  it('keeps only plan ids, at most 12, and reads junk as empty', () => {
    const many = new Set(Array.from({ length: 20 }, (_, i) => `plan.trial_week.2027-01-${String(i + 1).padStart(2, '0')}`));
    const back = parseSeen(serializeSeen(many));
    expect(back.size).toBe(12);
    expect(parseSeen('["a child name", "plan.x"]')).toEqual(new Set(['plan.x']));
    expect(parseSeen('{oops')).toEqual(new Set());
    expect(parseSeen(null)).toEqual(new Set());
  });
});
