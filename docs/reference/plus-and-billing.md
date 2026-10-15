---
title: Plus and billing
owner: reference-docs
covers: [apps/mobile/src/lib/billing/**, apps/mobile/modules/scribe-store/**, apps/mobile/storekit/**, apps/mobile/src/app/settings/plus.tsx, apps/mobile/src/app/plus/**, packages/core/src/plan.ts, packages/content/src/pricing.ts]
verified_at: d74e860
verified_on: 2026-10-15
---

# Plus and billing

Plus is a membership sold only through the App Store, with StoreKit 2, and checked **on the phone only**: no server of ours sees a purchase. Reasons: ADR 0013 (`docs/adr/0013-apple-native-subscriptions.md`); the membership rule is D-082, its edges D-083, the purchase confirmation G-15 ([../DECISIONS.md](../DECISIONS.md)).

## The rule in code

| Rule | Where |
|---|---|
| The first 2 letters kept are free, one pool across every book; after that, Keep needs Plus | `packages/core/src/plan.ts` (`DEFAULT_FREE_LETTERS = 2`, `decideKeepLetter`), `apps/mobile/src/lib/billing/gates.ts` (`keepLetterGate`) |
| Remote config may raise the free allowance, never lower it, up to 100 | `packages/core/src/plan.ts` (`MAX_FREE_LETTERS`), `packages/api/src/remote-config.ts` (`BUNDLED_FREE_LETTERS`, `effectiveFreeLetters`), wired in `src/app/_layout.tsx` |
| Capturing, typing, drafts, reading, playing, Read together, exporting and deleting are never gated; starting a book is free | `gates.ts` header, `app/read-together.tsx` header |
| The gate runs at Keep, after the recording is on disk and hashed; on "offer" the draft stays where it is | `gates.ts` `keepLetterGate` |

`decideKeepLetter` returns `allow` (`via: 'plus_own'` or `'free_letters'`) or `offer` with trigger `keep_letter`. `packages/core/src/plan.ts` also has `decide()` for other gated features (`backup_upload`, `theme_extra`); neither is offered while server features are off.

## How Plus is read on the phone

```
StoreKit 2 (Transaction.currentEntitlements, Transaction.updates)
  -> modules/scribe-store (Swift)
  -> lib/billing/plan-store.ts (snapshot, cached in settings "plus.cache")
  -> usePlan() / hasPlus() / keepLetterGate()
```

- **`modules/scribe-store`** (iOS Swift; Android stub answering "unavailable"; absent in Expo Go and on web): `startTransactionListener`, `currentEntitlements`, `presentSubscriptionStore` (Apple's SubscriptionStoreView, iOS 17+), `showManageSubscriptions`, `sync` (restore), `presentOfferCodeRedeemSheet`, `beginRefundRequest`, `storeViewSupport`.
- **`lib/billing/plan-store.ts`**: the source of truth is StoreKit on this phone. The last good snapshot is cached in device settings under `plus.cache` (`config.ts` `PLAN_CACHE_KEY`) so Plus shows at once on launch and offline, and a payer is never locked out by a missing network. `startPlus()` at boot starts the listener and re-reads on foreground.
- **`lib/billing/actions.ts`**: `presentPlusStore`, `restorePurchases`, `manageSubscription`, `requestRefund`, `redeemOfferCode`. When a native sheet cannot open, it opens Apple's pages (`APPLE_MANAGE_SUBSCRIPTIONS_URL`, `APPLE_REPORT_A_PROBLEM_URL` in `config.ts`).
- **Server**: none. The server entitlement tables and functions were dropped by `supabase/migrations/20261004000000_plus_on_device_only.sql` (pending, like every server migration after the first two).

## The letter ledger

How "letters kept" is counted so a reinstall cannot reset it (`lib/billing/letter-ledger.ts`, `letter-ledger.logic.ts`, `lib/db/repos/ledger.ts`):

| Store | Key | Notes |
|---|---|---|
| Keychain | `earlyletters.letters.keptEver` | Through `lib/supabase/secure-storage.ts`, `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` |
| Database mirror | `settings` row `letters.keptEver` | Counted in the same transaction as the save (`saveLetterFromDraft`) |
| Letters present | `entries` | The third witness |

`lettersKept` is the largest of the three. `startLetterLedger()` at boot and `keepLetterGate()` heal it after a reinstall or a backup restore. It holds a number only: no id, hash, timestamp or content. A deleted letter still counts (D-083). `eraseLetterLedger()` exists for "Erase everything"; no screen calls it on `develop`.

## Products and prices

| Product id | Period | Where defined |
|---|---|---|
| `plus.annual` | 1 year | `lib/billing/config.ts` `PLUS_PRODUCT_IDS`, `apps/mobile/storekit/EarlyLetters.storekit` |
| `plus.monthly` | 1 month | same |

Annual is listed first; neither is preselected (`config.ts`). The ids must match App Store Connect exactly (`docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md`).

**Prices are never in app code or app copy.** The app shows Apple's own sheet, which carries the storefront's price and trial eligibility (D-083). Two places in the repo hold prices, and they agree:

| File | Monthly | Yearly | Used for |
|---|---|---|---|
| `packages/content/src/pricing.ts` (`PLUS_PRICE`, `PLUS_TRIAL`) | $4.99, first month free | $49.99, first 2 months free | Public copy only: website, store listing, pages |
| `apps/mobile/storekit/EarlyLetters.storekit` | `displayPrice` 4.99, trial `P1M` | `displayPrice` 49.99, trial `P2M` | Local StoreKit testing in Xcode |

The live prices are whatever App Store Connect says; changing one means changing both files and App Store Connect (comment in `pricing.ts`).

## Screens

| Screen | What it shows |
|---|---|
| `app/settings/plus.tsx` (Settings, Plan) | What StoreKit reports on this phone; every money action opens Apple's sheet. The path the legal text names: Settings, Plan, Manage subscription |
| The Keep gate in Review | `app/review.tsx` renders `PlusGate` (`components/child/plus-gate.tsx`, variant `keep_letter`) when `keepLetterGate` returns `offer`. "Hold" goes back and the draft waits on Tonight; after a purchase the same Review returns and the person taps Keep again |
| `app/plus/confirmed.tsx` | After a new purchase: plan, trial end or renewal date, cancel-by date, how to cancel, Apple's role, Family Sharing. No price. "Save a copy" shares the terms as plain text |
| `PlanNoticeHost` (root layout) | A plan reminder inside the app, once per reminder, on a tab root |

**Plan reminders** (`lib/billing/plan-reminders.ts`, G-15): local notifications with ids starting `plan.`, date triggers, re-planned when StoreKit changes, on foreground and at start. Nothing is scheduled without notification permission; the in-app note still shows. They never touch the evening reminders (`lib/reminders`, ids `el.`).

## Testing

`apps/mobile/test/billing-plan.test.ts`, `billing-ledger.test.ts`, `billing-plan-reminders.test.ts`; `packages/core/test` covers `plan.ts`. Device flow `apps/mobile/e2e/flows/E2E-14-restore-purchases.yaml`. Sandbox setup: `docs/release/TESTFLIGHT.md` and `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md`.
