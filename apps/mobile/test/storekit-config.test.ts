/**
 * SUB-11 (comms validation, 31 Oct 2026): the local StoreKit file matches App Store Connect where it can
 * (docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md): billing grace on, one free-month offer code for local redeem
 * testing, and the Terms in the policies Apple's sheet links. Prices and ids are pinned in billing-plan.test.ts.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { brand } from '@scribe/brand';

type Sub = Record<string, unknown> & { productID: string; codeOffers: Array<Record<string, unknown>> };
const file = JSON.parse(readFileSync(join(__dirname, '..', 'storekit', 'EarlyLetters.storekit'), 'utf8')) as {
  appPolicies: { eula: string; policies: Array<{ policyURL: string }> };
  settings: Record<string, unknown>;
  subscriptionGroups: Array<{ subscriptions: Sub[] }>;
};

describe('[SUB-11] StoreKit test file', () => {
  it('has billing grace on, as App Store Connect does (16 days, D-048)', () => {
    expect(file.settings._billingGracePeriodEnabled).toBe(true);
  });

  it('has one free-month code offer on Plus Monthly, so Redeem a code can be tried in Xcode', () => {
    const subs = file.subscriptionGroups[0].subscriptions;
    const offers = subs.flatMap((s) => s.codeOffers.map((o) => ({ id: s.productID, ...o })));
    expect(offers).toHaveLength(1);
    expect(offers[0]).toMatchObject({ id: 'plus.monthly', paymentMode: 'free', subscriptionPeriod: 'P1M' });
  });

  it('names the Terms of Service and keeps the privacy policy', () => {
    expect(file.appPolicies.eula).toContain(brand.web.terms);
    expect(file.appPolicies.policies.map((p) => p.policyURL)).toContain(brand.web.privacy);
  });
});
