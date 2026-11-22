/**
 * Comms validation 31 Oct 2026: the Plan screen's own-purchase rows (SUB-07) and Manage for a Family Sharing member
 * (SUB-08). docs/reviews/2026-10-31/subscriptions.md.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ownSubscription, planScreen } from '../src/components/settings/plan.logic';
import type { PlanDetails } from '../src/lib/billing/plan.logic';

type Status = PlanDetails['status'];
const longDate = (ymd: string) => ymd;
const base = { line: { kind: 'on' } as const, plusOn: true, storeSupport: 'available' as const, noteLines: [], longDate };

describe('[SUB-07] refund and save-a-copy rows need a subscription that still exists', () => {
  it('shows them for the person\'s own trial, active, grace or retry subscription', () => {
    for (const status of ['trial', 'active', 'grace', 'billing_retry'] as Status[]) {
      expect(ownSubscription({ status, ownership: 'purchased' }), status).toBe(true);
    }
  });

  it('hides them after an expiry or a refund, with no subscription, and for Family Sharing', () => {
    for (const status of ['expired', 'refunded', 'revoked', 'none'] as Status[]) {
      expect(ownSubscription({ status, ownership: 'purchased' }), status).toBe(false);
    }
    expect(ownSubscription({ status: 'active', ownership: 'familyShared' })).toBe(false);
  });

  it('the screen uses it, not a status check of its own', () => {
    const src = readFileSync(join(__dirname, '..', 'src', 'app', 'settings', 'plus.tsx'), 'utf8');
    expect(src).toMatch(/const ownPurchase = ownSubscription\(plan\.details\);/);
  });
});

describe('[SUB-08] Manage is not offered to a Family Sharing member', () => {
  it('hides Manage for familyShared and keeps the shared line in the status', () => {
    const shared = planScreen({ ...base, details: { status: 'active', period: 'month', ownership: 'familyShared' } });
    expect(shared.manage).toBe(false);
    expect(shared.status?.subtitle).toMatch(/Family Sharing/);
  });

  it('keeps Manage for the person\'s own subscription, including Apple\'s billing retry', () => {
    expect(planScreen({ ...base, details: { status: 'active', period: 'year', ownership: 'purchased' } }).manage).toBe(true);
    expect(planScreen({ ...base, plusOn: false, line: { kind: 'retry' }, details: { status: 'billing_retry', period: 'month', ownership: 'purchased' } }).manage).toBe(true);
  });
});

describe('[SUB-12] offer code comments cite the Apple-only decision, not D-081 (purchase consent records)', () => {
  it('no offer code comment cites D-081', () => {
    const files = ['modules/scribe-store/ios/ScribeStoreModule.swift', 'src/lib/billing/actions.ts', 'src/app/settings/plus.tsx'];
    for (const f of files) {
      const lines = readFileSync(join(__dirname, '..', f), 'utf8').split('\n');
      const bad = lines.filter((l) => /offer code|redemption/i.test(l) && /D-081/.test(l));
      expect(bad, f).toEqual([]);
    }
  });
});
