/**
 * Plus through Apple only, checked on this device (ADR 0013; founder decision 3).
 *
 *   startPlus()            boot: StoreKit listener, foreground re-read (wire in app/_layout.tsx)
 *   usePlan()              screens: PlanView, details, plusOn, Plan screen line, store support
 *   startBookGate()        decide() for starting another book; newChildNeedsPlus() for yes or no
 *   hasPlus(), isJoinedBook(child)   replacements for the old store.ts stubs
 *   presentPlusStore()     Apple's SubscriptionStoreView
 *   restorePurchases(), manageSubscription(), requestRefund()   Apple's sheets
 *
 * Read together allowance: src/lib/read-together.ts.
 */
export { PLUS_PRODUCT_IDS, periodOf } from './config';
export { billingCopy } from './copy';
export { getPlan, refreshPlan, startPlus, storeViewSupport, subscribePlan } from './plan-store';
export { usePlan, type UsePlan } from './use-plan';
export { allBookFacts, bookFactsOf, gateContext, hasPlus, isJoinedBook, newChildNeedsPlus, startBookGate } from './gates';
export { manageSubscription, presentPlusStore, requestRefund, restorePurchases, storeSheetOptions, type RestoreResult } from './actions';
export { EMPTY_PLAN, localDateOf, planLine, plusOn, type PlanDetails, type PlanLine, type PlanState } from './plan.logic';
