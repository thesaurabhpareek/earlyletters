/**
 * Plus actions, all on Apple's own sheets (ADR 0013): the subscription store
 * view, Restore (AppStore.sync), Manage subscription and the refund request.
 * Each re-reads StoreKit afterwards so usePlan() updates at once.
 */
import { Linking } from 'react-native';
import { brand } from '@scribe/brand';
import { tokens } from '@scribe/design-tokens';
import { ScribeStore, type OfferCodeOutcome, type RefundOutcome, type StoreSheetOptions, type StoreSheetOutcome } from '../../../modules/scribe-store';
import { APPLE_MANAGE_SUBSCRIPTIONS_URL, APPLE_REPORT_A_PROBLEM_URL, PLUS_PRODUCT_IDS } from './config';
import { billingCopy } from './copy';
import { getPlan, refreshPlan, storeViewSupport } from './plan-store';
import { plusOn } from './plan.logic';

/** What Apple's store view shows above the plans. Words from billing copy; links and colours from brand and tokens. */
export function storeSheetOptions(): StoreSheetOptions {
  const s = billingCopy.store;
  return {
    productIds: [...PLUS_PRODUCT_IDS],
    title: s.title,
    subtitle: s.subtitle,
    features: [...s.features],
    notes: [s.promise, s.renewal, s.cancel, s.family],
    termsUrl: brand.web.terms,
    privacyUrl: brand.web.privacy,
    accentLight: tokens.light.accent,
    // Empty on purpose: Apple's filled buttons put white text on the tint, and
    // the dark-mode brand accent is too light for that. Dark mode keeps the system tint.
    accentDark: '',
    backgroundLight: tokens.light.bg,
    backgroundDark: tokens.dark.bg,
  };
}

let presenting = false;

/** Opens Apple's subscription store view. Resolves when it closes. */
export async function presentPlusStore(): Promise<StoreSheetOutcome> {
  if (!ScribeStore || storeViewSupport() !== 'available') return 'unavailable';
  if (presenting) return 'busy';
  presenting = true;
  try {
    const { outcome } = await ScribeStore.presentSubscriptionStore(storeSheetOptions());
    await refreshPlan();
    // A purchase can land just after the sheet closes (Ask to Buy, slow network): trust StoreKit.
    return plusOn(getPlan(), new Date().toISOString()) ? 'purchased' : outcome;
  } catch {
    return 'unavailable';
  } finally {
    presenting = false;
  }
}

export type RestoreResult = 'restored' | 'nothing' | 'cancelled' | 'failed' | 'unavailable';

/** Restore purchases: Apple asks the person to sign in, so call only from a tap. */
export async function restorePurchases(): Promise<RestoreResult> {
  if (!ScribeStore) return 'unavailable';
  try {
    const synced = await ScribeStore.sync();
    await refreshPlan();
    if (plusOn(getPlan(), new Date().toISOString())) return 'restored';
    if (synced === 'cancelled') return 'cancelled';
    return synced === 'synced' ? 'nothing' : 'failed';
  } catch {
    return 'failed';
  }
}

/** Manage or cancel: Apple's sheet in one tap, or Apple's web page when the sheet cannot open (LEGAL-REQ-048). */
export async function manageSubscription(): Promise<void> {
  let shown = false;
  try {
    shown = (await ScribeStore?.showManageSubscriptions()) === 'shown';
  } catch {
    shown = false;
  }
  if (!shown) {
    try {
      await Linking.openURL(APPLE_MANAGE_SUBSCRIPTIONS_URL);
    } catch {
      // Nothing else to open; the Plan screen still names the path in Settings.
    }
  }
  await refreshPlan();
}

/**
 * Apple's offer code sheet (D-081: codes come from Apple, never a code system of ours).
 * Resolves when the sheet has been shown. A redeemed code arrives as an entitlement
 * update through the StoreKit listener (plan-store), so Plus turns on by itself; watch
 * usePlan().plusOn. Needs an iOS build with the native function: an older dev client
 * without it answers 'unavailable'.
 */
export async function redeemOfferCode(): Promise<OfferCodeOutcome> {
  const store = ScribeStore;
  if (!store || typeof store.presentOfferCodeRedeemSheet !== 'function') return 'unavailable';
  let outcome: OfferCodeOutcome = 'failed';
  try {
    outcome = await store.presentOfferCodeRedeemSheet();
  } catch {
    outcome = 'failed';
  }
  await refreshPlan();
  return outcome;
}

/** Apple's refund request sheet; Apple's web page when the sheet cannot open. */
export async function requestRefund(): Promise<RefundOutcome> {
  let outcome: RefundOutcome = 'unavailable';
  try {
    outcome = (await ScribeStore?.beginRefundRequest([...PLUS_PRODUCT_IDS])) ?? 'unavailable';
  } catch {
    outcome = 'failed';
  }
  if (outcome === 'unavailable' || outcome === 'failed') {
    try {
      await Linking.openURL(APPLE_REPORT_A_PROBLEM_URL);
    } catch {
      // Leave the outcome as it is.
    }
  }
  await refreshPlan();
  return outcome;
}
