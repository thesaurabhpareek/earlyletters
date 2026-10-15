/**
 * Plus through Apple only, checked on this device (ADR 0013; founder decision 3).
 *
 *   startPlus()            boot: StoreKit listener, foreground re-read (wire in app/_layout.tsx)
 *   usePlan()              screens: PlanView, details, plusOn, Plan screen line, store support
 *   keepLetterGate()       decideKeepLetter for the Keep step (D-082, D-083): 2 free letters, then Plus
 *   hasPlus(), isJoinedBook(child)   replacements for the old store.ts stubs
 *   lettersKeptNow(), eraseLetterLedger()  the letter ledger (letter-ledger.ts); Erase everything clears it
 *   presentPlusStore()     Apple's SubscriptionStoreView (asks for the acknowledgment after a purchase)
 *   plan reminders         plan-reminders.ts (started by startPlus), cards via usePlanNoticeCard() (BL-342)
 *   configureOwnLettersQuery(q)   the M17 own-letters count (own-letters.ts; query from S03)
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
  configureOwnLettersQuery,
  ledgerViewer,
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
  type KeepGateOptions,
} from './gates';
export { countsAtKeep, isOwn, type KeepFacts, type LedgerViewer, type OwnLettersQuery } from './own-letters';
export { acknowledgment, noticeText, type Acknowledgment } from './plan-notices.logic';
export { acknowledgmentPending, acknowledgmentShown, requestAcknowledgment, subscribeAcknowledgment } from './acknowledgment';
export { SUBSCRIPTION_TERMS_DOC_VERSION, termsShownVersion } from './terms-version';
export { syncLedger } from './letter-ledger';
export { manageSubscription, presentPlusStore, redeemOfferCode, requestRefund, restorePurchases, storeSheetOptions, type RestoreResult } from './actions';
export { EMPTY_PLAN, localDateOf, planLine, plusOn, type PlanDetails, type PlanLine, type PlanState } from './plan.logic';
