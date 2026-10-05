/**
 * Plus through Apple only, checked on this device (ADR 0013; founder decision 3).
 *
 *   startPlus()            boot: StoreKit listener, foreground re-read (wire in app/_layout.tsx)
 *   usePlan()              screens: PlanView, details, plusOn, Plan screen line, store support
 *   keepLetterGate()       decideKeepLetter for the Keep step (D-082, D-083): 2 free letters, then Plus
 *   hasPlus(), isJoinedBook(child)   replacements for the old store.ts stubs
 *   lettersKeptNow(), eraseLetterLedger()  the letter ledger (letter-ledger.ts); Erase everything clears it
 *   presentPlusStore()     Apple's SubscriptionStoreView
 *   restorePurchases(), manageSubscription(), requestRefund()   Apple's sheets
 *
 */
export { PLUS_PRODUCT_IDS, periodOf } from './config';
export { billingCopy } from './copy';
export { getPlan, refreshPlan, startPlus, storeViewSupport, subscribePlan } from './plan-store';
export { usePlan, type UsePlan } from './use-plan';
import './letter-ledger.native';
export {
  afterLetterKept,
  allBookFacts,
  eraseLetterLedger,
  bookFactsOf,
  freeLettersAllowance,
  hasPlus,
  isJoinedBook,
  keepLetterGate,
  lettersKeptNow,
  setFreeLettersAllowanceSource,
  startLetterLedger,
  type KeepGate,
} from './gates';
export { syncLedger } from './letter-ledger';
export { manageSubscription, presentPlusStore, redeemOfferCode, requestRefund, restorePurchases, storeSheetOptions, type RestoreResult } from './actions';
export { EMPTY_PLAN, localDateOf, planLine, plusOn, type PlanDetails, type PlanLine, type PlanState } from './plan.logic';
