---
title: Plus and billing
owner: reference-docs
covers: [apps/mobile/src/lib/billing/**, apps/mobile/modules/scribe-store/**, apps/mobile/storekit/**, apps/mobile/src/app/settings/plus.tsx, apps/mobile/src/app/plus/**, packages/core/src/plan.ts, packages/content/src/pricing.ts]
verified_at: 1c6795b
verified_on: 2026-10-27
---

# Plus and billing

Plus is a membership sold only through the App Store, with StoreKit 2, and checked **on the phone only**: the phone decides what Plus is, and no receipt or transaction id reaches a server of ours. The one report that does go up is the status report (below), parked behind its own build flag. Reasons: ADR 0013 (`docs/adr/0013-apple-native-subscriptions.md`); the membership rule is D-082, its edges D-083, the purchase confirmation G-15 ([../DECISIONS.md](../DECISIONS.md)).

## The rule in code

| Rule | Where |
|---|---|
| The first 2 letters kept are free, one pool across every book; after that, Keep needs Plus | `packages/core/src/plan.ts` (`DEFAULT_FREE_LETTERS = 2`, `decideKeepLetter`), `apps/mobile/src/lib/billing/gates.ts` (`keepLetterGate`) |
| Remote config may raise the free allowance, never lower it, up to 100 | `packages/core/src/plan.ts` (`MAX_FREE_LETTERS`), `packages/api/src/remote-config.ts` (`BUNDLED_FREE_LETTERS`, `effectiveFreeLetters`), wired in `src/app/_layout.tsx` |
| Capturing, typing, drafts, reading, playing, Read together, exporting and deleting are never gated; starting a book is free | `gates.ts` header, `app/read-together.tsx` header |
| The gate runs at Keep, after the recording is on disk and hashed; on "offer" the draft stays where it is | `gates.ts` `keepLetterGate` |
| The gate asks only when the letter's words are on screen (D-103, M17): a save with no words, or marks alone such as "...", never reads the ledger, never opens the sheet and never counts. "Words" means at least one letter or digit in any script (`hasWords`) | `gates.ts` `keepGateFor`, `letter-ledger.logic.ts` `hasWords` |

`decideKeepLetter` returns `allow` (`via: 'plus_own'` or `'free_letters'`) or `offer` with trigger `keep_letter`. `packages/core/src/plan.ts` also has `decide()` for other gated features (`backup_upload`, `theme_extra`); neither is offered while server features are off. `backup_upload` still answers `offer` with trigger `backup` for a user tap without Plus, while D-111 item 6 (founder, 17 Oct 2026) makes backup free for everyone in v1.0 ([register](../decisions/INDEX.md)). Known contradiction: the backup client is now on `develop` (`lib/backup`) and does not call `decide()`, so nothing offers Plus for backup today, but `plan.ts` and its tests still encode the gate; it should be removed or reworded.

## How Plus is read on the phone

```
StoreKit 2 (Transaction.currentEntitlements, Transaction.updates)
  -> modules/scribe-store (Swift)
  -> lib/billing/plan-store.ts (snapshot, cached in settings "plus.cache")
  -> usePlan() / hasPlus() / keepLetterGate()
```

- **`modules/scribe-store`** (iOS Swift, where `Transaction` always means StoreKit's, a type alias added in #201 so the module compiles with Xcode 26.6; Android stub answering "unavailable"; absent in Expo Go and on web): `startTransactionListener`, `currentEntitlements`, `presentSubscriptionStore` (Apple's SubscriptionStoreView, iOS 17+), `showManageSubscriptions`, `sync` (restore), `presentOfferCodeRedeemSheet`, `beginRefundRequest`, `storeViewSupport`.
- **`lib/billing/plan-store.ts`**: the source of truth is StoreKit on this phone. The last good snapshot is cached in device settings under `plus.cache` (`config.ts` `PLAN_CACHE_KEY`) so Plus shows at once on launch and offline, and a payer is never locked out by a missing network. `startPlus()` at boot starts the listener and re-reads on foreground.
- **`lib/billing/actions.ts`**: `presentPlusStore`, `restorePurchases`, `manageSubscription`, `requestRefund`, `redeemOfferCode`. When a native sheet cannot open, it opens Apple's pages (`APPLE_MANAGE_SUBSCRIPTIONS_URL`, `APPLE_REPORT_A_PROBLEM_URL` in `config.ts`).
- **Server**: no entitlement tables. They were dropped by `supabase/migrations/20261004000000_plus_on_device_only.sql` (pending, like every server migration after the first two). The status report below is a separate, later table set.

## The letter ledger

How "letters kept" is counted so a reinstall cannot reset it (`lib/billing/letter-ledger.ts`, `letter-ledger.logic.ts`, `lib/db/repos/ledger.ts`). The Keychain wiring is `letter-ledger.keychain.ts`, imported once by `lib/billing/index.ts`; its name carries no platform suffix on purpose, because Metro would resolve the plain import to it on a phone (guarded by `test/platform-split.test.ts`):

| Store | Key | Notes |
|---|---|---|
| Keychain | `earlyletters.letters.keptEver` | Through `lib/supabase/secure-storage.ts`, `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` |
| Database mirror | `settings` row `letters.keptEver` | Counted in the same transaction as the save (`saveLetterFromDraft` in `lib/store.ts`) |
| Letters present | `entries` | The third witness. Only letters that count by D-103 (M17): this phone's account's own (or made before any sign-in), with words (`hasWords`), kept from Review with the words on screen (`COUNTED_LETTERS_SQL` in `lib/db/repos/ledger.ts`). The other parent's synced letters never count |

`lettersKept` is the largest of the three. `startLetterLedger()` at boot and `keepLetterGate()` heal it after a reinstall or a backup restore. It holds a number only: no id, hash, timestamp or content. A deleted letter still counts (D-083), and a save that does not count by the rule above changes nothing (`recordKept` in `ledger.ts`). `eraseLetterLedger()` exists for "Erase everything"; no screen calls it on `develop`.

## The Keep step in Review

One function pair wraps every save in Review so the rule lives in one place (`lib/billing/keep-step.ts`): `keepSheetFor(wordsOnScreen)` before the write returns the gate when the Plus sheet must open instead (and writes nothing), and `countAfterSave(wordsOnScreen)` after it copies the count to the Keychain and says whether the "second free letter" line shows. Analytics carry numbers only. A typed letter kept from Write with one tap uses the same step: Write arms the keep for that draft (`lib/capture/keep-intent.ts`, in memory, 5 seconds) and Review runs the gate and the save, so there is one copy of the gate. Import these from `lib/billing/keep-step`, not from the billing index, which stays free of analytics so it can wire the Keychain at startup.

## The status report (parked behind a build flag)

The phone tells our server which plan it has and when it ends, and nothing more: no receipt, no signed transaction, no price, no clear transaction id (D-080; consent record D-081). It is built on `develop` and on only when the build has server features on **and** `EXPO_PUBLIC_STATUS_REPORT=on` (`capabilities.statusReport`); every profile in `apps/mobile/eas.json` has that flag off today, and a remote kill switch can pause it but never start it. Backlog and requirement ids: WP-F14-15a/15b, F14-REQ-014.

| Piece | Where |
|---|---|
| The sender (one flush: salt, a `sub_ref` per own purchase, one POST per changed purchase, idempotency key) | `lib/billing/status-report.ts`, wired in `status-report.app.ts`, loaded by dynamic import from `plan-store.ts` and `actions.ts` |
| What a report holds, who reports (own purchases only, never Family Sharing), what waits on the phone (settings `plus.statusReport`, never the salt or `sub_ref`) | `status-report.logic.ts` |
| `sub_ref`: SHA-256 of the account's salt and the original transaction id, made in Swift so the id never reaches JavaScript. The native call is `statusReportRefs(salt, productIds)`; the Android stub answers an empty list | `modules/scribe-store` |
| The first report after a purchase in the app carries the terms shown (`SUBSCRIPTION_TERMS_DOC_VERSION` in `config.ts`, which a test ties to the version in `docs/legal/subscription-terms.md`) | `actions.ts` `presentPlusStore` |
| Server tables and functions | `20261016001000_subscription_status.sql` (pending), see [data-and-storage.md](data-and-storage.md) |

The native transaction now also reports `offerType` (none, introductory, promotional, offer_code, win_back, other) and `freePeriod`.

## Products and prices

| Product id | Period | Where defined |
|---|---|---|
| `plus.annual` | 1 year | `lib/billing/config.ts` `PLUS_PRODUCT_IDS`, `apps/mobile/storekit/EarlyLetters.storekit` |
| `plus.monthly` | 1 month | same |

Annual is listed first; neither is preselected (`config.ts`). App Store Connect display names and descriptions are `APP_STORE_PLUS` in `packages/content/src/pricing.ts`, mirrored in the StoreKit file ("Plus Annual", "Plus Monthly"; "Keep adding letters, billed ..."); no price or trial is in them. The ids must match App Store Connect exactly (`docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md`).

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
| The Keep gate in Review | `app/review.tsx` renders `PlusGate` (`components/child/plus-gate.tsx`, variant `keep_letter`) when `keepSheetFor` returns an `offer` gate. "Hold" goes back and the draft waits on Tonight; after a purchase the same Review returns and the person taps Keep again |
| `app/plus/confirmed.tsx` | After a new purchase: plan, trial end or renewal date, cancel-by date, how to cancel, Apple's role, Family Sharing. No price. "Save a copy" shares the terms as plain text |
| `PlanNoticeHost` (root layout) | A plan reminder inside the app, once per reminder, on a tab root |

**Plan reminders** (`lib/billing/plan-reminders.ts`, G-15): local notifications with ids starting `plan.`, date triggers, re-planned when StoreKit changes, on foreground and at start. Nothing is scheduled without notification permission; the in-app note still shows. They never touch the evening reminders (`lib/reminders`, ids `el.`).

## Testing

`apps/mobile/test/billing-plan.test.ts`, `billing-ledger.test.ts`, `billing-plan-reminders.test.ts`, `billing-status-report.test.ts`, `keep-step.test.ts`; `packages/core/test` covers `plan.ts`. Device flow `apps/mobile/e2e/flows/E2E-14-restore-purchases.yaml`. Two older device flows still expect gates the code no longer has: `E2E-06-read-together-plus-gate.yaml` (3 free Read together sessions, then Plus) and `E2E-07-add-child-plus-gate.yaml` (a second book needs Plus), also listed that way in `apps/mobile/e2e/README.md`. Sandbox setup: `docs/release/TESTFLIGHT.md` and `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md`.
