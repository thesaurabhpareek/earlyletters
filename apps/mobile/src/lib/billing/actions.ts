/**
 * Plus actions, all on Apple's own sheets (ADR 0013): the subscription store
 * view, Restore (AppStore.sync), Manage subscription and the refund request.
 * Each re-reads StoreKit afterwards so usePlan() updates at once.
 */
import { router } from 'expo-router';
import { Linking } from 'react-native';
import { brand } from '@scribe/brand';
import { tokens } from '@scribe/design-tokens';
import { ScribeStore, type RefundOutcome, type StoreSheetOptions, type StoreSheetOutcome } from '../../../modules/scribe-store';
import { APPLE_MANAGE_SUBSCRIPTIONS_URL, APPLE_REPORT_A_PROBLEM_URL, PLUS_PRODUCT_IDS } from './config';
import { billingCopy } from './copy';
import { getPlan, refreshDisplayPrices, refreshPlan, storeViewSupport } from './plan-store';
import { reschedulePlanReminders } from './plan-reminders';
import { plusOn, type PlanState } from './plan.logic';

/** Route of the purchase confirmation (app/plus/confirmed.tsx). */
export const CONFIRMATION_ROUTE = '/plus/confirmed';

/** Plus on now through the person's own purchase (not Family Sharing). */
function ownPlusOn(plan: PlanState, now: string): boolean {
  return plusOn(plan, now) && plan.details.ownership === 'purchased';
}

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

/**
 * Opens Apple's subscription store view. Resolves when it closes. After a new
 * purchase of the person's own (G-15), it opens the purchase confirmation
 * (what they agreed to, with Save a copy) and re-plans the plan reminders.
 * `confirm: false` skips the confirmation for a caller that shows its own.
 */
export async function presentPlusStore(opts: { confirm?: boolean } = {}): Promise<StoreSheetOutcome> {
  if (!ScribeStore || storeViewSupport() !== 'available') return 'unavailable';
  if (presenting) return 'busy';
  presenting = true;
  const hadOwn = ownPlusOn(getPlan(), new Date().toISOString());
  void refreshDisplayPrices(); // ready for the confirmation
  try {
    const { outcome } = await ScribeStore.presentSubscriptionStore(storeSheetOptions());
    await refreshPlan();
    const now = new Date().toISOString();
    // A purchase can land just after the sheet closes (Ask to Buy, slow network): trust StoreKit.
    const result: StoreSheetOutcome = plusOn(getPlan(), now) ? 'purchased' : outcome;
    if (result === 'purchased' && !hadOwn && ownPlusOn(getPlan(), now)) {
      void reschedulePlanReminders();
      if (opts.confirm !== false) {
        try {
          router.push(CONFIRMATION_ROUTE);
        } catch {
          // No router (tests, web preview): Settings, Plan has Save a copy too.
        }
      }
    }
    return result;
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
