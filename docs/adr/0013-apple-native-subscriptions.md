# ADR 0013: Plus through Apple only, checked on the device (StoreKit 2 and Apple's SubscriptionStoreView, no server)

Status: **Accepted, decided by the founder** (brief decision 3, `docs/agents/BRIEF-2026-10-03.md`, 3 Oct 2026). This version records the decision as made and the implementation chosen for it.
Date: 2026-10-03.
Supersedes: the earlier draft of this ADR (StoreKit 2 with App Store Server Notifications V2, the App Store Server API and a server entitlement ledger), and the digital-purchase half of ADR 0007 (RevenueCat). ADR 0007's printed-book half stays as future roadmap (PRD K-32).
Related: TDD 08 (payments; its server, notice and RevenueCat sections are superseded by this ADR, see "What changes elsewhere"), `packages/core/src/plan.ts` (the rules engine, unchanged), `supabase/migrations/20261004000000_plus_on_device_only.sql`, `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md`.

Evidence labels: **V** verified on a page, package or file opened on 3 Oct 2026; **U** unverified; **E** our estimate.

## Decision

1. **Apple only, out of the box.** Plus is two auto-renewable subscriptions in one App Store subscription group. Apple sells, renews, cancels and refunds them. There is no RevenueCat, no web purchase and no third-party billing brand anywhere.
2. **Apple's own paywall.** The app presents Apple's `SubscriptionStoreView` (StoreKit, iOS 17+; **V**, developer.apple.com/documentation/storekit/subscriptionstoreview) as a sheet, from a small local Expo module, `apps/mobile/modules/scribe-store`. Apple renders the plans, the localized prices and periods, the free trial for people who are eligible, the subscribe buttons, Restore, Terms and Privacy, and Close. We add only the marketing content above the plans (what Plus adds, the free-forever promise, renewal and how to cancel, Family Sharing) and the brand tint.
3. **Checked on the device, no server.** The entitlement is `Transaction.currentEntitlements` on the phone (**V**: "the latest transaction for each auto-renewable subscription that has a RenewalState of subscribed or inGracePeriod"; refunded and revoked ones do not appear). The module also listens to `Transaction.updates` from launch and finishes verified transactions (**V**: Apple asks apps to listen from launch or miss Ask to Buy, renewals and purchases made elsewhere). Restore is `AppStore.sync()`, manage or cancel is `AppStore.showManageSubscriptions(in:)`, and a refund request is `Transaction.beginRefundRequest(for:in:)` (all iOS 15+, **V**). No server of ours sees a purchase: no App Store Server Notifications endpoint, no App Store Server API call, no In-App Purchase key, no `appAccountToken`. The entitlement tables and functions added on 3 Oct are dropped (migration `20261004000000_plus_on_device_only.sql`), and the server never refuses a book for Plus (`SCPLS` retired).
4. **Co-parent through Family Sharing.** Family Sharing is on for both products, so a co-parent in the same Apple family gets Plus as their own (`ownershipType == familyShared`) entitlement. Once on, Family Sharing cannot be turned off (**V**, App Store Connect Help, "Turn on Family Sharing for In-App Purchases").
5. **Products** (founder prices, US storefront at launch):

| Product id | Duration | Price | Introductory offer | Family Sharing |
|---|---|---|---|---|
| `plus.monthly` | 1 month | US $3.99 | Free, 1 month, new subscribers | On |
| `plus.annual` | 1 year | US $29.99 | Free, 2 months, new subscribers | On |

Group reference name and display name: "Plus". Both products at the same level of service (a crossgrade). One introductory offer per person per group (**V**, App Store Connect Help, introductory offers), so nobody gets a second trial by switching plans. Product ids are permanent once created; ids carry no price so a price change never needs a new product. The ids live in `apps/mobile/src/lib/billing/config.ts` and `apps/mobile/storekit/EarlyLetters.storekit`, and a unit test keeps the two equal.

## Options considered (client side)

| Option | What it is | Why not chosen, or why chosen |
|---|---|---|
| **A. Local Expo module + SubscriptionStoreView (chosen)** | About 530 lines of Swift (comments included) in `modules/scribe-store/ios`, Apple frameworks only (StoreKit, SwiftUI). A 50-line Android stub in Kotlin | Apple renders the paywall and its disclosures, so guideline 3.1.2 rests on Apple's component instead of ours. No third-party code, nothing extra in the binary beyond our Swift. Every API it calls was checked in Apple's documentation (section "Evidence") |
| B. `expo-iap` 5.8.2 (MIT; npm, published 30 Sep 2026, **V**) | General StoreKit 2 and Play Billing wrapper (openiap) | Does not expose SubscriptionStoreView (**V**, searched the installed package). We would build and maintain our own paywall and its 3.1.2 disclosures, and ship the `openiap` pod and Play Billing code we do not use. Already in `apps/mobile/package.json` (uncommitted); recommended for removal |
| C. `react-native-iap` 16.7.2 (MIT; npm, 30 Sep 2026, **V**) | Same family, Nitro modules | No SubscriptionStoreView (**V**, searched the published tarball); adds `react-native-nitro-modules` |
| D. `@expo/ui` 57.0.21 SwiftUI | Expo's SwiftUI bridge | No StoreKit views (**V**, searched the installed package). Its extending API (**V**, docs.expo.dev v57 "Registering custom SwiftUI views") could host the store view inline inside a React Native screen; a modal sheet is what the gates need, and it would add the ExpoUI pod as a dependency of this module. Kept as the route if we ever want the store inline |
| E. RevenueCat | Hosted subscriptions | Excluded by the decision |

## How it works

**Module surface** (`modules/scribe-store/index.ts`): `storeViewSupport()`, `presentSubscriptionStore(options)` (resolves `purchased`, `dismissed`, `busy` or `unavailable` when the sheet closes), `currentEntitlements(productIds)`, the `onEntitlementsChanged` event (no payload beyond a reason), `showManageSubscriptions()`, `sync()`, `beginRefundRequest(productIds)`, `startTransactionListener()`. What crosses into JavaScript is product ids, dates and flags only: no transaction id, receipt or account id (DATA_CLASSIFICATION L2). The refund request looks up its own transaction inside Swift.

**Sheet.** A clear full-screen hosting controller carries a real SwiftUI `.sheet`, so the store view's own Close button and swipe-to-dismiss work and report back once. Style `.buttons` (one subscribe button per plan, so no plan is preselected, PRD C-REQ-022), `.subscriptionStoreButtonLabel(.multiline)`, Restore, policies and Close visible, Terms and Privacy pointed at `brand.web.terms` and `brand.web.privacy`. Purchases from the store view arrive through `Transaction.updates` (**V**, "By default, transactions from successful in-app store view purchases will be emitted from Transaction.updates"), so we keep Apple's default error alerts and the listener closes the sheet with `purchased`.

**Plan on the phone** (`apps/mobile/src/lib/billing`): `planFromSnapshot` maps entitlements and subscription statuses to the engine's `PlanView` (trial, active, grace, billing retry, expired, revoked) and to Plan screen details; the last snapshot is cached in device settings (`plus.cache`) so Plus shows at once and offline. `usePlan()` exposes it; `startBookGate()` and `readTogetherGate()` call `decide()` unchanged. Engine inputs that change with this decision: `signedIn` is always true (Plus belongs to the Apple Account, so buying needs no sign-in with us; TDD 08 R-1 no longer applies), `coveredByOtherParent` is always false (a co-parent's Plus arrives through Family Sharing as their own), and sandbox and Xcode transactions count (on the device a verified sandbox transaction exists only in TestFlight, development builds and App Review, which purchases in the sandbox; refusing it would show the reviewer a paid Plus that does nothing). Read together's free sessions come from remote config, which may only raise the reviewed default of 3.

**iOS versions.** Expo SDK 57's minimum is iOS 16.4 (**V**, `ExpoModulesCore.podspec`). The store view needs iOS 17, so on 16.x the gate says Plus can be added on iOS 17 or later; Restore, Manage and the entitlement check still work there. Recommendation (coordinator): set the iOS deployment target to 17.0 through `expo-build-properties`, which removes that branch (it drops iPhone 8, 8 Plus and X, which stop at iOS 16).

## Requirements check

| Requirement | How it is met now | Status |
|---|---|---|
| Apple 3.1.2, DPLA Schedule 2 3.8(b): title, length, price, Terms and Privacy links before purchase | Apple's store view shows each plan's name, period and price and the trial for eligible people; our marketing content says what Plus adds; policy buttons open our Terms and Privacy | Met by Apple's component; on-device review needed |
| C-REQ-022 neither plan preselected | `.buttons` style | Met (verify on device) |
| C-REQ-020 Restore | Restore button in the store view; Settings, Plan, Restore purchases calls `AppStore.sync()` | Met |
| LEGAL-REQ-048 manage or cancel in one tap | Settings, Plan, Manage subscription opens Apple's sheet; web fallback `apps.apple.com/account/subscriptions` | Met |
| C-REQ-029 refunds through Apple | Settings, Plan, Request a refund opens Apple's sheet (own purchases only); web fallback `reportaproblem.apple.com` | Met |
| C-REQ-027 billing grace | Grace entitlements are in `currentEntitlements`; turn on Billing Grace Period in App Store Connect | Met with the founder's setup step |
| LEGAL-REQ-050 keep and leave | `FreeForever` features cannot be gated; nothing that exists is ever locked | Met (unchanged) |
| K-28 co-parent | Apple Family Sharing | Met for co-parents in the same Apple family only |
| C-NFR-004 offline and stale | Cached snapshot; a paid period stays on while offline | Met |
| PRD-REQ-015 extra books, server half | Device only | **Changed**: no server enforcement (trade-off below) |
| PRD-REQ-003, LEGAL-REQ-047 auto-renewal notices by email and in-app (trial and renewal windows), acknowledgment email | No server sees purchases, so we cannot email | **Gap** for founder and counsel (below) |
| LEGAL-REQ-049 proof of consent at purchase | No server record | **Gap** for counsel (below) |
| PRD-REQ-017 lifecycle numbers | App Store Connect Sales and Trends and subscription reports only | **Changed** |

## Consequences and trade-offs

- **Plus is enforced on the device only.** A modified app, or a phone clock set back while offline, can reach more books or Read together sessions than the free allowance until StoreKit is read again. Every Plus feature in v1.0 (Read together after the free sessions, books for more children) runs on the phone and costs nothing on the server, and there is no audio upload in v1.0 (brief decision 9). Accepted.
- **Plus belongs to the Apple Account on the phone, not to our account.** Signing in to Early Letters does not carry Plus to a phone with a different Apple Account. A co-parent outside the purchaser's Apple family needs their own subscription. Two parents in one Apple family share one.
- **No subscriber view for us.** Support cannot look a purchase up; the answer is always Apple's (Settings, Plan, Restore and Manage). App Store Connect reports are the only lifecycle numbers.
- **Auto-renewal law duties that assumed our server.** Subscription Terms 1.3.0 promise emails we cannot send without seeing purchases: the acknowledgment with a copy of the terms, trial reminders, renewal reminders and the yearly reminder, and a kept record of consent. Apple sends its own purchase and subscription emails as merchant of record, but what they contain and when is **U** and must not be assumed to satisfy California 17602 or the other state windows. Options, for the founder and counsel: (a) counsel confirms Apple's own emails plus the in-app disclosure are sufficient; (b) the app schedules local notifications and an in-app card from the entitlement's period end (device only, needs notification permission, no email); (c) a small server path later. Until decided, the Subscription Terms "Reminders from us" section and the consent-record sentence are inaccurate.
- **What Plus adds.** The store view lists only what v1.0 ships. Subscription Terms 1.3.0 and in-app strings still list encrypted backup (not in v1.0, D-059) and extra themes and covers (not built). They must match the live sheet before submission (Apple 3.1.2(c); Subscription Terms counsel note).
- **Binary size.** One Swift module and one Kotlin stub; no third-party SDK. `expo-iap` should be removed from `apps/mobile/package.json` so its native code is not linked.
- **Android.** The Kotlin stub answers "unavailable" so JavaScript has one path. Google Play Billing is v1.1 and needs its own decision then.

## Revisit when

- A Plus feature with a server cost ships (backup upload). That endpoint then needs its own proof of Plus, for example the app sending StoreKit's signed transaction (JWS) with the request and the endpoint verifying it against Apple's root certificate, statelessly. That is a new ADR.
- Counsel decides auto-renewal notices or the consent record must come from us.
- Android ships.

## What changes elsewhere (owner actions)

- **TDD 08**: sections 2.4 (device state), 2.5 (server rules), 3 (RevenueCat), 4.1 to 4.3 (purchase flow, consent, notice engine), 4.8 and 4.9 (restore transfer rule, deletion) and 7 (I-3, I-8 to I-15) describe server pieces that no longer exist. The engine contract (2.1 to 2.3) and the lapse table (5) stand.
- **Legal**: Subscription Terms (reminders, consent record, what Plus adds), `in-app-disclosures.md` section 3 (`plus.ack.body` email, consent log rule), `ENGINEERING_REQUIREMENTS` LEGAL-REQ-047 and -049, `DATA_CLASSIFICATION`, `DELETION_AND_EXPORT_SPEC` and `data-policy` (no purchase ledger, no `app_account_tokens`), privacy labels (Purchases: no longer linked to the person through our server; counsel to confirm the label).
- **PRD**: PRD-REQ-003, -015 (server half), -017; C-REQ-021 per-account wording becomes per Apple Account with Family Sharing.
- **Analytics**: `TRACKING_PLAN.md` lifecycle totals come from App Store Connect only.
- **App wiring** (coordinator): call `startPlus()` from `app/_layout.tsx`; add a Settings row "Plan" that opens `/settings/plus`; pass the remote config reader to `setReadTogetherFreeSessionsSource`.

## Evidence (all opened 3 Oct 2026)

- Apple developer documentation (JSON of the docs pages): `SubscriptionStoreView` and `init(productIDs:marketingContent:)` iOS 17; `storeButton(_:for:)`, `StoreButtonKind` (`cancellation`, `restorePurchases`, `policies`, `redeemCode`, `signIn`); `subscriptionStorePolicyDestination(url:for:)`; `subscriptionStoreControlStyle(_:)` with `.buttons` (iOS 17); `subscriptionStoreButtonLabel(.multiline)`; `containerBackground(_:for:)` with `.subscriptionStoreFullHeight` (iOS 17); `onInAppPurchaseCompletion` (default behaviour emits to `Transaction.updates`); `Transaction.currentEntitlements`, `Transaction.updates`, `Transaction.latest(for:)`, `ownershipType`, `environment` (iOS 16), `offer` (iOS 17.2) and `offerType` (before 17.2), `revocationDate`, `isUpgraded`, `beginRefundRequest(for:in:)`; `Product.SubscriptionInfo.status(for:)`, `RenewalState`, `RenewalInfo.willAutoRenew` and `gracePeriodExpirationDate`; `AppStore.sync()` (shows a sign-in prompt, call only from a tap), `AppStore.showManageSubscriptions(in:)`.
- App Store Connect Help: subscriptions, introductory offers (free trial durations, one per group), Family Sharing (irreversible), Billing Grace Period (3, 16 or 28 days), sandbox Apple Accounts, Paid Apps agreement, first subscription submitted with a new app version; Small Business Program page (15%, individuals eligible, up to US $1 million proceeds).
- Packages: `expo-iap` 5.8.2 and `@expo/ui` 57.0.21 in `node_modules`; `react-native-iap` 16.7.2 tarball from npm; `ExpoModulesCore.podspec` (iOS 16.4) and the Expo modules Swift and Kotlin APIs in `node_modules/expo-modules-core`.
