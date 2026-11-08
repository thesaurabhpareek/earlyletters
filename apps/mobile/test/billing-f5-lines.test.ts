/// <reference types="node" />
/**
 * Founder decision F5 (1 Nov 2026), "Plus, gently" (proposals/v1-experience/plus.md; PL-3, PL-4, PL-5, PL-8): what a
 * parent reads about Plus, in the store build and in an alpha build. Store build: one honest line at setup, again on
 * Plan while Plus is off and at letter 2; the Settings Plan row says Free, Plus or Plus, shared, with no count; Plan
 * lists what Plus includes before Apple's sheet and, after a lapse, the day Plus ended with no sales sentence. Alpha
 * build (#552): only the note that Plus is not part of this test, and no StoreKit control. Pure rules run here; the
 * screens' use of them is pinned in their source. Fixtures: the fictional family Asha.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { billingCopy, en } from '@scribe/content';
import { plusLineFor } from '../src/lib/billing/alpha';
import { planScreen } from '../src/components/settings/plan.logic';
import { planRow } from '../src/components/settings/settings-home.logic';
import type { PlanLine } from '../src/lib/billing/plan.logic';

const SRC = join(__dirname, '..', 'src');
const code = (rel: string) =>
  readFileSync(join(SRC, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

const F5 = 'Your first two letters are free. After that, Plus keeps the book growing. Reading, listening and your copy stay free.';
const NOTE = billingCopy.alpha.note;
const m = billingCopy.membership;
const longDate = (ymd: string) => ({ '2026-11-13': 'November 13, 2026' })[ymd] ?? ymd;
const off: PlanLine = { kind: 'off' };
type Input = Parameters<typeof planScreen>[0];
const screen = (over: Partial<Input> = {}) =>
  planScreen({ line: off, details: { status: 'none', period: null, ownership: null }, plusOn: false, storeSupport: 'available', noteLines: [], longDate, ...over });
// Noon UTC, so the phone's own date is the 13th in every time zone the test machine may use.
const lapsed = { status: 'expired' as const, period: 'month' as const, ownership: 'purchased' as const, periodEnd: '2026-11-13T12:00:00.000Z' };

describe('[F5, PL-5] the setup line', () => {
  it('the store build says the F5 line at setup, word for word; an alpha build says only the alpha note', () => {
    expect(en.onboarding.welcome.freeLine).toBe(F5);
    expect(m.line).toBe(F5);
    expect(plusLineFor(false, en.onboarding.welcome.freeLine)).toBe(F5);
    expect(plusLineFor(true, en.onboarding.welcome.freeLine)).toBe(NOTE);
    expect(code('app/onboarding.tsx')).toMatch(/plusLineFor\(PLUS_ALPHA, o\.welcome\.freeLine\)/);
  });

  it('letter 2: the toast foretells Plus once, with no action and no count', () => {
    expect(billingCopy.keepGate.secondFreeNote).toBe('That was your second free letter. Whenever you are ready, Plus keeps the book growing.');
    expect(code('app/(tabs)/book.tsx')).toMatch(/if \(secondFree\) toast\.show\(\{ message: billingCopy\.keepGate\.secondFreeNote \}\);/);
  });
});

describe('[F5, PL-3] the Settings Plan row', () => {
  it('store build: Free with the help line while Plus is off; Plus, or Plus, shared, with no help line', () => {
    expect(planRow({ alpha: false, plusOn: false, familyShared: false })).toEqual({ subtitle: en.settingsHome.planHelp, value: 'Free' });
    // Lapsed or Apple retrying a payment: Plus is not on, so the row says Free; the dates are on Plan.
    expect(planRow({ alpha: false, plusOn: false, familyShared: true })).toEqual({ subtitle: en.settingsHome.planHelp, value: 'Free' });
    expect(planRow({ alpha: false, plusOn: true, familyShared: false })).toEqual({ subtitle: undefined, value: 'Plus' });
    expect(planRow({ alpha: false, plusOn: true, familyShared: true })).toEqual({ subtitle: undefined, value: 'Plus, shared' });
  });

  it('alpha build (#552): only the alpha note, and no plan value, whatever the plan', () => {
    for (const plusOn of [false, true]) {
      for (const familyShared of [false, true]) expect(planRow({ alpha: true, plusOn, familyShared })).toEqual({ subtitle: NOTE, value: undefined });
    }
  });

  it('no value holds a digit, a countdown or a price', () => {
    for (const v of Object.values(m.status)) expect(v, v).not.toMatch(/\d|\$|left|until|days?/i);
  });

  it('the row keeps its place and title, and reads the cached plan without asking StoreKit', () => {
    const home = code('app/settings/index.tsx');
    expect(home).toMatch(/<ListRow title=\{h\.planLabel\} subtitle=\{planRowView\.subtitle\} value=\{planRowView\.value\} trailing="chevron" onPress=\{go\(ROUTES\.plan\)\}/);
    expect(home).toMatch(/useSyncExternalStore\(subscribePlan, getPlan, getPlan\)/);
    expect(home).not.toMatch(/usePlan\(|refreshPlan|presentPlusStore|restorePurchases/);
  });
});

describe('[F5, PL-4] Plan', () => {
  it('Plus never had: the F5 line once as the footer, What Plus includes, See what Plus adds', () => {
    const s = screen();
    expect(s.freeLine).toBe(F5);
    expect(s.promise).toBeNull();
    expect(s.includes).toEqual({ title: 'What Plus includes', items: billingCopy.store.features });
    expect(s.seePlans).toEqual({ kind: 'open', title: billingCopy.plan.seePlans });
  });

  it('Plus on: the registered promise, What Plus includes, no F5 line', () => {
    const s = screen({ line: { kind: 'renews', on: '2026-11-13' }, details: { status: 'active', period: 'month', ownership: 'purchased' }, plusOn: true });
    expect(s.promise).toBe(billingCopy.store.promise);
    expect(s.freeLine).toBeNull();
    expect(s.includes?.items).toEqual(billingCopy.store.features);
  });

  it('Plus ended: "Plus ended on {date}. Every letter you kept is still yours.", no sales sentence, Plus can be chosen again', () => {
    const s = screen({ details: lapsed });
    expect(s.status).toEqual({ title: 'Plus', subtitle: 'Plus ended on November 13, 2026. Every letter you kept is still yours.', value: null });
    expect(s.freeLine).toBeNull();
    expect(s.promise).toBeNull();
    expect(s.manage).toBe(false);
    expect(s.seePlans).toEqual({ kind: 'open', title: billingCopy.plan.seePlans });
    // Without an end date from StoreKit there is no date to say: the never-had view, not an ended row with a blank.
    expect(screen({ details: { ...lapsed, periodEnd: null } }).status).toBeNull();
    // Refunded (revoked) is not "ended": nothing ended on a day the person chose.
    expect(screen({ details: { ...lapsed, status: 'revoked' } }).status).toBeNull();
  });

  it('alpha build (#552): only the alpha note: no F5 line, no includes, no promise, no StoreKit control', () => {
    for (const details of [{ status: 'none' as const, period: null, ownership: null }, lapsed]) {
      expect(screen({ details, alpha: true })).toEqual({
        status: null,
        seePlans: { kind: 'unavailable', title: NOTE },
        promise: null,
        freeLine: null,
        includes: null,
        manage: false,
        redeem: false,
        alpha: true,
      });
    }
    const plan = code('app/settings/plus.tsx');
    const alphaBranch = plan.slice(plan.indexOf('if (screen.alpha) {'), plan.indexOf('return (', plan.indexOf('if (screen.alpha) {') + 40));
    expect(alphaBranch).not.toMatch(/includes|freeLine|presentPlusStore|restorePurchases|redeemOfferCode|manageSubscription/);
  });

  it('the screen draws the footer and the includes section from the rules', () => {
    const plan = code('app/settings/plus.tsx');
    expect(plan).toMatch(/footer=\{screen\.freeLine \?\? screen\.promise \?\? undefined\}/);
    expect(plan).toMatch(/\{screen\.includes \? \(\s*<ListSection title=\{screen\.includes\.title\}>/);
  });
});
