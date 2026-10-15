/**
 * Plan reminders and the acknowledgment, pure part (BL-342; WP-F14-06, WP-F14-07; F14 6.6).
 * No React Native: unit-tested in plan-notices.logic.test.ts.
 *
 *   noticeSubscriptionOf(plan)   the StoreKit plan -> the planner's input (packages/core plan-notices.ts)
 *   noticeText(notice, plan)     title and body of a notification or card (billingCopy.notices)
 *   acknowledgment(plan)         the five items of the acknowledgment sheet and its "Save a copy" text
 *
 * The price shown is the plan's published price (F14 6.6 rule 5; CATALOG section 7 `{price}`),
 * from packages/content pricing.ts. Apple's storefront price is not read on the device today.
 */
import { brand } from '@scribe/brand';
import { PLUS_PRICE, billingCopy } from '@scribe/content';
import { renderTemplate } from '@scribe/core';
import type { PlanNoticeSubscription, PlannedPlanNotice } from '@scribe/core/src/plan-notices';
import { longDate } from '../dates';
import type { PlanState } from './plan.logic';

type Period = 'month' | 'year';

/** The planner's input from this phone's plan. null: nothing to remind about. */
export function noticeSubscriptionOf(plan: PlanState): PlanNoticeSubscription | null {
  const d = plan.details;
  if (!d.ownership || d.status === 'none') return null;
  return {
    ownership: d.ownership,
    state: d.status,
    period: d.period,
    periodEnd: d.periodEnd,
    willAutoRenew: d.willAutoRenew,
    freePeriod: d.freePeriod,
    subscribedSince: d.subscribedSince,
  };
}

/** "Plus Annual" (D-077). */
export function planNameOf(period: Period | null): string {
  return period === 'month' ? billingCopy.planName.month : billingCopy.planName.year;
}

/** "$49.99 a year": the published price of the plan (pricing.ts). */
export function priceLineOf(period: Period | null): string {
  return period === 'month'
    ? renderTemplate(billingCopy.priceLine.month, { price: PLUS_PRICE.monthly })
    : renderTemplate(billingCopy.priceLine.year, { price: PLUS_PRICE.yearly });
}

/** YYYY-MM-DD of an instant on this phone. */
function localDay(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const dateOf = (iso: string, locale?: string) => longDate(localDay(iso), locale);

export interface NoticeText {
  title: string;
  body: string;
}

/** The words of one plan reminder: transactional, no child, no letter, no offer (F14-REQ-009). */
export function noticeText(n: PlannedPlanNotice, period: Period | null, locale?: string): NoticeText {
  const c = billingCopy.notices;
  const values = {
    name: planNameOf(period),
    price: priceLineOf(period),
    date: dateOf(n.periodEnd, locale),
    cancelBy: n.cancelBy ? dateOf(n.cancelBy, locale) : '',
  };
  const pick = n.kind.startsWith('trial')
    ? { title: c.trialTitle, body: c.trialBody }
    : n.kind === 'anniversary'
      ? { title: c.anniversaryTitle, body: c.anniversaryBody }
      : { title: c.renewalTitle, body: c.renewalBody };
  return { title: renderTemplate(pick.title, values), body: renderTemplate(pick.body, values) };
}

export interface Acknowledgment {
  /** Lines in order: dates and price, renewal, cancel-by, how to cancel, the letters promise, the terms link. */
  lines: string[];
  /** The text "Save a copy" shares (title, lines, terms URL). */
  shareText: string;
  /** False when this phone has no own purchase to describe (Family Sharing, Free). */
  hasPurchase: boolean;
}

/**
 * The acknowledgment after a purchase or a free period starts, and the Plan screen's "Your Plus
 * terms" (C-REQ-024 phone half): the terms, the first (or next) charge date, the price after,
 * the cancel-by date and how to cancel.
 */
export function acknowledgment(plan: PlanState, locale?: string): Acknowledgment {
  const a = billingCopy.ack;
  const s = billingCopy.store;
  const d = plan.details;
  const own = d.ownership === 'purchased' && (d.status === 'trial' || d.status === 'active' || d.status === 'grace');
  const terms = `${a.termsLink} ${brand.web.terms}`;
  if (!own || !d.periodEnd) {
    const lines = [a.noDates, s.cancel, s.promise, terms];
    return { lines, shareText: [a.title, ...lines].join('\n\n'), hasPurchase: false };
  }
  const values = {
    name: planNameOf(d.period),
    price: priceLineOf(d.period),
    date: dateOf(d.periodEnd, locale),
    cancelBy: d.cancelBy ? dateOf(d.cancelBy, locale) : '',
  };
  const free = d.status === 'trial' || d.freePeriod !== null;
  const lines = [
    ...(free ? [renderTemplate(a.freeUntil, values), renderTemplate(a.firstCharge, values)] : [renderTemplate(a.nextCharge, values)]),
    renderTemplate(a.renews, values),
    ...(d.cancelBy && d.willAutoRenew !== false ? [renderTemplate(a.cancelBy, values)] : []),
    s.cancel,
    s.promise,
    terms,
  ];
  return { lines, shareText: [a.title, ...lines].join('\n\n'), hasPurchase: true };
}

// ── Seen cards (device setting, notice ids only) ─────────────────────────

/** Device settings key for dismissed plan cards: notice ids only (`plan.<kind>.<date>`), no content (L1). */
export const PLAN_CARDS_SEEN_KEY = 'plus.noticesSeen';
const SEEN_KEPT = 12;

export function parseSeen(raw: string | null | undefined): Set<string> {
  if (!raw) return new Set();
  try {
    const v = JSON.parse(raw) as unknown;
    return new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.startsWith('plan.')).slice(-SEEN_KEPT) : []);
  } catch {
    return new Set();
  }
}

export function serializeSeen(seen: Set<string>): string {
  return JSON.stringify([...seen].slice(-SEEN_KEPT));
}
