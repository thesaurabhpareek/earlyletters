/**
 * Plus product configuration (ADR 0013; docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md).
 * Pure constants, no React Native.
 *
 * The product ids must match App Store Connect and storekit/EarlyLetters.storekit
 * exactly, and can never be reused once created. Prices and trial lengths are
 * NOT here: Apple's store view shows the storefront's own price and the free
 * trial only to people who are eligible.
 */

/** Annual first: the order Apple's store view lists the plans in. Neither is preselected. */
export const PLUS_PRODUCT_IDS = ['plus.annual', 'plus.monthly'] as const;
export type PlusProductId = (typeof PLUS_PRODUCT_IDS)[number];

export function isPlusProduct(id: string): id is PlusProductId {
  return (PLUS_PRODUCT_IDS as readonly string[]).includes(id);
}

/** Billing period of a Plus product, for the Plan screen. */
export function periodOf(id: string | null | undefined): 'month' | 'year' | null {
  if (id === 'plus.monthly') return 'month';
  if (id === 'plus.annual') return 'year';
  return null;
}

/** Apple's own pages, used when a native sheet cannot open (no window scene, Android, Expo Go). */
export const APPLE_MANAGE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';
export const APPLE_REPORT_A_PROBLEM_URL = 'https://reportaproblem.apple.com';

/**
 * Version of docs/legal/subscription-terms.md that the store sheet links to (front matter
 * `version`). The D-081 consent record names it with a hash of the store sheet text
 * (status-report.logic.ts termsVersionOf); test/billing-status-report.test.ts fails when
 * the document's version moves and this does not.
 */
export const SUBSCRIPTION_TERMS_DOC_VERSION = '4.1.0';

/** Device settings key for the last entitlement snapshot (L2: product id, dates, flags; no ids). */
export const PLAN_CACHE_KEY = 'plus.cache';

/** Device settings key prefix for Read together sessions used in try mode, per book. */
export const READ_TOGETHER_SESSIONS_KEY = 'readTogether.sessions';
