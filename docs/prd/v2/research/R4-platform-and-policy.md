# R4 Platform and policy fact base

Status: desk research, 3 Oct 2026, complete with gaps listed in section 11. Author: platform research agent. Branch `docs/prd-v2`.

**This is research, not legal advice.** Statements about laws summarise public text and legal commentary so counsel can check them quickly. Every legal reading marked Inferred is "for counsel".

Labels: **Verified** = read on the cited page today. **Unverified** = could not open or confirm. **Inferred** = this author's reasoning from verified facts. **[R]** = consequence for the spec.

## 0. Bottom line

| # | Finding | [R] Spec consequence |
|---|---|---|
| 1 | The device alone can read Plus state: `Transaction.currentEntitlements` (iOS 15) lists active and grace-period subscriptions, and `RenewalInfo` gives renewal date, will-renew, grace and price-increase status on device (R4-S2, R4-S3). Offline freshness is Unverified. | F14 can show "Renews on {date}" and gate Plus with no server. Spike offline behaviour. |
| 2 | SubscriptionStoreView exists from iOS 17, shows names, prices, purchase button and Terms and Privacy buttons, and takes our marketing content (R4-S1). Apple does not say it satisfies any disclosure rule. `expo-iap` (MIT) does not export it, but its source exposes `ownershipTypeIOS`, `renewalInfoIOS`, manage, refund, sync and intro eligibility (R4-S67 to R4-S69). | `expo-iap` for StoreKit calls plus one small native Expo module for the view; our disclosure text goes in its marketing slot (LEGAL-REQ-046). |
| 3 | Family Sharing is per product, turned on in App Store Connect, and **cannot be turned off** (R4-S17). It covers one Apple Family, same home country, six people. The co-parent sees Plus in their own `currentEntitlements` with `ownershipType` family shared (R4-S6, R4-S18). | Co-parent Plus only inside one Apple Family. ADR 0013's "Family Sharing off" must change. Founder accepts a one-way door. |
| 4 | Apple's own pages do not say Apple reminds subscribers before a trial ends or an annual renewal. Apple does notify on price increases and billing failures (R4-S12, R4-S15, R4-S19, R4-S22). | Do not rely on Apple for trial or renewal notices (collision C1). |
| 5 | California ARL as amended: 2-month trial needs a notice 3 to 21 days before it ends; annual plan needs a notice 15 to 45 days before each renewal; annual reminder (statute text limits it to annual agreements); express consent records 3 years (R4-S26, R4-S27). No authority found on whether app-store billing moves these duties to Apple. | Counsel question C1 before F14 is final. Notice options are listed in section 10. |
| 6 | FTC 2024 Click-to-Cancel rule was vacated 8 July 2025; the 1973 rule (prenotification plans only) is in force; a new ANPRM opened March 2026; ROSCA still applies (R4-S33 to R4-S35). | ROSCA baseline: clear terms, express consent, simple cancel. No federal pre-renewal notice today. |
| 7 | Texas SB 2420 is **in force** (Fifth Circuit stay 10 June 2026; Supreme Court refused to vacate 6 July 2026). Utah moved to 6 May 2027, Louisiana to 1 July 2027, California AB 1043 starts 1 Jan 2027 (R4-S44, R4-S47, R4-S49, R4-S52, R4-S53). Declared Age Range needs iOS 26; the eligibility check needs iOS 26.2 (R4-S38, R4-S40). | Keep our 18+ gate for everyone; call Declared Age Range where `isEligibleForAgeFeatures` is true; block under 18. |
| 8 | Guidelines: in-app account deletion mandatory (5.1.1(v)); Sign in with Apple satisfies 4.8 next to Google; regulated or sensitive-data apps should come from a legal entity (5.1.1(ix)); no "For Kids" wording (5.1.4); no hidden features and every feature named in review notes (2.3.1(a)); no downloaded code that changes features (2.5.2) (R4-S55). | Individual account is a risk to raise (C6). Packs must stay pure data. Remote flags only switch reviewed features. |
| 9 | Apple-hosted asset packs need iOS 26 (`AssetPackManager`), a StoreKit downloader extension, and allow 200 packs and 200 GB per app (R4-S63 to R4-S65). No Expo module found. `expo-widgets` in SDK 57 covers Lock Screen widgets and Live Activities (R4-S61). | v1.0 ships the CDN path (D-046) for iOS 17 to 25; Apple hosting is a later spike for iOS 26 and later. Lock-screen widget and recording Live Activity are reachable from Expo. |
| 10 | Supabase passkeys are experimental (docs dated 2 Oct 2026), not GA (R4-S59). Many sign-in, privacy manifest, notification and widget facts could not be read because the fetch proxy rate-limited (section 11). | Passkeys stay optional. Agents must verify those items against installed packages and current docs before coding. |

## 1. StoreKit 2

### 1.1 API facts

| Item | Verified fact | Min OS | Source | [R] Spec consequence |
|---|---|---|---|---|
| SubscriptionStoreView | SwiftUI view that merchandises the auto-renewable subscriptions in one group: localized names, descriptions, prices and a purchase button. Loads products itself from a group ID or product IDs. Orders options by group rank when built from a group ID. | iOS 17.0 | R4-S1 | Meets D-040 (iOS 17). Needs a native SwiftUI host; not a JS component (see section 2). |
| SubscriptionStoreView: policies | Shows Terms of Service and Privacy Policy buttons automatically from App Store Connect metadata; `subscriptionStorePolicyDestination(url:for:)` points them at our URLs. | iOS 17.0 | R4-S1 | Set /terms and /privacy in App Store Connect and pass both URLs. |
| SubscriptionStoreView: customisation | Background via `containerBackground` (placement `subscriptionStoreHeader`); custom marketing content view (initialisers with `marketingContent:`); per-option icon (`subscriptionStoreControlIcon`); control styles (`subscriptionStoreControlStyle`, for example `PickerSubscriptionStoreControlStyle`); auxiliary buttons via `storeButton(_:for:)` (Close shown by default; restore and others configurable); `subscriptionStoreSignInAction`. WWDC26 added `preferredSubscriptionPricingTerms` for monthly-with-12-month-commitment plans. | iOS 17.0 (pricing terms iOS 26.4) | R4-S1, R4-S13 | Our copy (what Plus includes, trial end date, cancel wording) goes in the marketing content slot. Price, period and button are Apple's. |
| SubscriptionStoreView: required disclosures | Apple's page lists what the view shows (names, descriptions, prices, policy buttons). It does not state that the view satisfies guideline 3.1.2(c), Schedule 2 of the DPLA, or any state law. | n/a | R4-S1 | **Inferred:** do not assume the view covers LEGAL-REQ-046. Add our own text in the marketing slot: renews automatically, trial length and first charge date, how to cancel. Counsel to confirm. |
| `Transaction.currentEntitlements` | Emits the latest transaction for each auto-renewable subscription whose renewal state is `subscribed` or `inGracePeriod`. Refunded or revoked products do not appear. | iOS 15.0 | R4-S2 | Plus gate = any verified entitlement in the Plus group. Grace period counts as Plus (matches D-048). |
| `currentEntitlement(for:)`, `currentEntitlements(for:)` | Listed under Deprecated on the Transaction page. | iOS 15.0 | R4-S4 | Use the unscoped `currentEntitlements` sequence and filter by product or group. |
| Offline behaviour | Apple's `currentEntitlements` page does not say whether the sequence works offline. `AppStore.sync()` page says StoreKit keeps transactions and status up to date automatically and makes them available at first launch after reinstall. | n/a | R4-S2, R4-S8 | **Unverified** offline. Spike on a device in airplane mode; keep a last-known plan state on device as a fallback. |
| Transaction fields | `expirationDate`, `purchaseDate`, `originalPurchaseDate`, `ownershipType`, `offer` (type, payment mode, ID), `revocationDate`, `revocationReason`, `isUpgraded`, `subscriptionGroupID`, `appAccountToken`, `environment`, `storefront`, `price`, `currency`, `reason`, `subscriptionStatus`. `offerType`, `offerID` are deprecated in favour of `offer`. | iOS 15.0 (some fields back-deployed) | R4-S5 | Trial detection uses `offer.type` and `offer.paymentMode`, not deprecated `offerType`. |
| `ownershipType` | Says whether the user purchased the product or has it through Family Sharing. Values per type `Transaction.OwnershipType`. | iOS 15.0 | R4-S6 | A co-parent's entitlement shows `familyShared`. The app can tell the purchaser from the family member. |
| `RenewalInfo` on device | Fields include `willAutoRenew`, `renewalDate`, `expirationReason`, `isInBillingRetry`, `gracePeriodExpirationDate`, `priceIncreaseStatus`, `offer` (offer applying at next renewal), `renewalPrice`, `currency`, `autoRenewPreference`, `recentSubscriptionStartDate`, `eligibleWinBackOfferIDs`, `appAccountToken`, `signedDate`. Reached through `Product.SubscriptionInfo.Status.renewalInfo`. | iOS 15.0; `renewalDate` back-deployed before iOS 17 | R4-S3, R4-S7 | **Yes, on device, no server of ours:** the app can read trial end (`expirationDate` of a transaction whose `offer` is the free intro offer), next renewal date (`renewalDate`), and whether it will renew (`willAutoRenew`). Freshness without network is Unverified (see Offline). |
| `renewalDate` meaning | Always present for auto-renewables, even expired; the expiry of the latest purchase including renewals; may be in the past. | iOS 15.0 | R4-S7 | Settings > Plan can show "Renews on {date}" only when `willAutoRenew` is true and the date is in the future. |
| `AppStore.showManageSubscriptions(in:)` | Presents the same manage sheet as Settings > Apple Account > Subscriptions; view, upgrade, downgrade, cancel. SwiftUI has `manageSubscriptionsSheet(isPresented:)`. Not supported for iOS apps running on Apple silicon Macs. | iOS 15.0 | R4-S9 | LEGAL-REQ-048 "Manage or cancel" button calls this. Keep the web fallback for Mac and error cases. |
| `Transaction.beginRefundRequest(in:)` and static `beginRefundRequest(for:in:)` | Presents Apple's refund request sheet for a transaction in a window scene; returns a `RefundRequestStatus`. | iOS 15.0 | R4-S4 | C-REQ-029 stays: Settings > Plan "Request a refund" opens Apple's sheet. Apple decides. |
| `AppStore.sync()` | Forces a refresh from the App Store. Shows a system sign-in prompt, so call only on an explicit user tap. Normally not needed: entitlements exist at first launch after reinstall. | iOS 15.0 | R4-S8 | "Restore purchases" button calls `sync()` only on tap; never on launch. |
| Intro offer eligibility | `Product.SubscriptionInfo.isEligibleForIntroOffer(for: groupID)` returns true if the customer can get an intro offer on any subscription in the group. May return true even when no intro offer is configured. | iOS 15.0 | R4-S10 | Show "free for 1 month / 2 months" only when eligible and the product actually has an intro offer (C-REQ-022 stays). |
| Billing Grace Period | Choices 3, 16 or 28 days (monthly and yearly get the full length; weekly capped at 6). Can apply to all renewals, including free intro offers moving to paid, or only paid-to-paid. Subscriber keeps access while Apple retries. | n/a (App Store Connect setting) | R4-S11 | D-048 16 days is an available value. Founder picks "all renewals" or "paid to paid" in App Store Connect; spec should say which. |
| Billing retry | Apple tries to recover a failed renewal for 60 days. Since iOS 16.4 a system sheet appears in the app at launch to update the payment method. | iOS 16.4 for the sheet | R4-S12 | No custom billing-problem screen needed; do not block the system sheet. |
| Price increases | Two kinds: needs consent, and no consent needed. Apple notifies by email, push and in-app message. No-consent increases since May 2022 are allowed at most once a year and within US$5 and 50% (US$50 and 50% for annual), where local law allows. `priceIncreaseStatus` on device: `noIncreasePending`, `pending`, `agreed`. | iOS 15.0 | R4-S14, R4-S15, R4-S12 | We do not need our own price-increase email to make the increase work. Whether California's 7 to 30 day notice still binds us is a counsel question (section 3). |
| Offer codes | Work for all IAP types; auto-renewable offer codes since iOS 14.2. In-app redemption via SwiftUI `offerCodeRedemption(options:isPresented:onCompletion:)` or UIKit `AppStore.presentOfferCodeRedeemSheet(from:options:)`. Up to 10 active offers, 1,000,000 codes per app per quarter. Redemptions outside the app arrive in `Transaction.updates`. | iOS 14.2 (subscriptions) | R4-S16 | Optional in v1.0. If used, the app must listen to `Transaction.updates` from launch. |

### 1.2 Family Sharing for auto-renewable subscriptions

| Item | Verified fact | Source | [R] Spec consequence |
|---|---|---|---|
| How to enable | App Store Connect > app > Monetization > Subscriptions > select subscription > Family Sharing > Turn On > Confirm. Per product. | R4-S17 | Founder turns it on for both Plus products before submission. ADR 0013 design point 1 says "Family Sharing off"; this contradicts brief B2 and must change. |
| Can it be turned off | No. Once on for a product, it cannot be turned off. | R4-S17, R4-S18 | One-way door. To stop sharing later you need new products in a new group, which resets every subscriber. Founder decision, flag in F14. |
| Existing subscribers | Users who subscribed before sharing was enabled must opt in from their manage subscriptions page. Apple pushes a notice to subscribers whose settings do not share by default. Users can turn sharing off in subscription settings at any time. | R4-S17, R4-S12 | Turn sharing on before launch so no subscriber predates it. The purchaser can still stop sharing; the co-parent then loses Plus. |
| Group size | Developer docs say the purchaser plus up to five family members (R4-S18, R4-S12); App Store Connect help says up to six family members (R4-S17); Apple Media Services Terms say up to six members of a Family, same Home Country (R4-S19). | R4-S17, R4-S18, R4-S19 | Same total: six people in one Apple Family group. Co-parents must be in the same Apple Family and the same home country. |
| How it appears on device | Each family member gets their own transactions; no special logic. The shared transaction appears with `ownershipType` = family shared. | R4-S18, R4-S6 | The co-parent's `currentEntitlements` on their own phone contains Plus. No server needed. |
| Revocation | If the purchaser leaves the family, gets a refund, or stops sharing, access should stop immediately. Server side this is the `REVOKE` notification. On device, StoreKit 2 transactions carry `revocationDate` and `revocationReason` (refund or revoked from Family Sharing); refunded or revoked products drop out of `currentEntitlements`. | R4-S18, R4-S5, R4-S2, R4-S20 | Re-check `currentEntitlements` on launch, on foreground and on `Transaction.updates`. |
| Display duty | Apple asks apps to tell users when a product supports Family Sharing (`Product.isFamilyShareable`). | R4-S18 | Paywall copy: "Share Plus with your co-parent through Apple Family Sharing" only when `isFamilyShareable` is true. |
| Server notification on family gain | A family member gaining access sends `SUBSCRIBED` (`INITIAL_BUY` or `RESUBSCRIBE`) on the server channel. | R4-S20 | Not used (no endpoint by B2). Listed for completeness. |

### 1.3 What Apple itself tells subscribers

| Event | What Apple's own pages say | Source | [R] |
|---|---|---|---|
| Free trial about to end | No Apple page found that says Apple emails or notifies a subscriber before a free trial converts. Apple's cancel-a-subscription page and the Media Services Terms tell the user to cancel at least 24 hours before the trial ends. | R4-S21, R4-S19 | **Unverified that Apple sends any pre-trial reminder.** Treat as: Apple sends none. |
| Annual renewal coming | No Apple page found that says Apple emails before an annual renewal. The Media Services Terms say subscriptions renew until cancelled and the charge happens no more than 24 hours before the new period. | R4-S19 | **Unverified.** Treat as: Apple sends none. |
| Price increase | Apple sends email, push and in-app messages before an increase; some increases need opt-in. | R4-S12, R4-S15 | Apple covers the price-increase notice channel. |
| Billing problem | During the 60-day retry window Apple tells customers by email, push and an App Store banner; in-app system sheet on iOS 16.4 and later. | R4-S22, R4-S12 | Apple covers billing-failure messaging. |
| Purchase receipt | Apple's refund page tells users to search email for "receipt from Apple", which shows Apple emails receipts. Content of the receipt (whether it carries renewal terms and cancel steps) not verified. | R4-S23 | **Unverified** whether Apple's receipt satisfies the ARL acknowledgment. Counsel. |
| Family Sharing | Apple pushes a notice that a subscription can be shared to subscribers whose settings do not share by default. | R4-S12 | None. |

## 2. Expo reachability

Source code read today is the `main` branch of `hyodotdev/openiap` on raw.githubusercontent.com, not the 5.8.2 tarball. The npm entry for `react-native-iap`, openiap.dev and the GitHub repo page returned HTTP 429 from the fetch proxy and were not retried. Before coding, an agent confirms each name in the installed version's `build/*.d.ts` (brief rule).

| Item | Fact | Status | Source | [R] Spec consequence |
|---|---|---|---|---|
| `expo-iap` package | Latest 5.8.2, MIT, repo `github.com/hyodotdev/openiap` folder `libraries/expo-iap`, peer deps `expo` and `react-native` any version. README says the iOS side uses StoreKit 2 through `openiap-apple`. | Verified | R4-S24, R4-S66 | Licence passes the brief's rule. Release date: ADR 0013 records 30 Sep 2026; not re-read today. Expo SDK 57 and RN 0.86 compatibility: Unverified (ADR 0013 spike BL-210). |
| iOS functions in `src/modules/ios.ts` | Exports include `syncIOS`, `isEligibleForIntroOfferIOS`, `subscriptionStatusIOS(sku)`, `currentEntitlementIOS(sku)`, `latestTransactionIOS`, `beginRefundRequestIOS`, `showManageSubscriptionsIOS`, `presentCodeRedemptionSheetIOS`, `getAppTransactionIOS`, `getAllTransactionsIOS`, `getTransactionJwsIOS`, `isTransactionVerifiedIOS`, `deepLinkToSubscriptionsIOS`, plus external purchase functions. | Verified (main branch) | R4-S67 | Covers manage, refund, restore (`syncIOS`), intro eligibility and subscription status. |
| Cross-platform functions in `src/index.ts` | `initConnection`, `fetchProducts`, `getAvailablePurchases`, `getActiveSubscriptions`, `hasActiveSubscriptions`, `requestPurchase`, `finishTransaction`, `restorePurchases`, `purchaseUpdatedListener`, `purchaseErrorListener`, `subscriptionBillingIssueListener`, `getStorefront`, `verifyPurchase`. | Verified (main branch) | R4-S68 | `purchaseUpdatedListener` is where Family Sharing grants and offer codes redeemed outside the app arrive. |
| Types in `src/types.ts` | `PurchaseIOS` has `ownershipTypeIOS`, `expirationDateIOS`, `renewalInfoIOS`, `offerIOS`, `revocationDateIOS`, `appAccountToken`. `RenewalInfoIOS` has `willAutoRenew`, `renewalDate`, `gracePeriodExpirationDate`, `isInBillingRetry`, `priceIncreaseStatus`. `SubscriptionStatusIOS` has `state` and `renewalInfo`. | Verified (main branch) | R4-S69 | Co-parent detection (`ownershipTypeIOS`), trial end and renewal date are reachable from JS with no custom module, if 5.8.2 matches main. |
| Entitlement call underneath | Apple deprecated per-product `Transaction.currentEntitlement(for:)` and kept the `currentEntitlements` sequence (R4-S4). `currentEntitlementIOS(sku)` takes a product id; which Apple call it wraps was not read. | Inferred | R4-S4, R4-S67 | Use `getAvailablePurchases` or `getActiveSubscriptions` for the gate, or confirm in the Swift source that `openiap-apple` iterates `currentEntitlements`. Spike item. |
| SubscriptionStoreView | Not exported by `expo-iap` (`index.ts`, `ios.ts` read). No other Expo or React Native library found that renders it. | Verified absent in expo-iap; others Unverified | R4-S67, R4-S68, R4-S25 | To use Apple's own subscription UI we need a small Expo module of our own (see next row). |
| `@expo/ui` | Already in `apps/mobile/package.json` (`~57.0.21`); `expo-widgets` authors widgets with `@expo/ui/swift-ui` (R4-S61). Whether it includes StoreKit views: not checked. | Repo fact; StoreKit views Unverified | `apps/mobile/package.json`, R4-S61 | Check `@expo/ui` first; if StoreKit views are absent, write the module. |
| Native module needed for SubscriptionStoreView | A Swift Expo module that hosts `SubscriptionStoreView(groupID:)` (iOS 17) as a native view or modal, sets `subscriptionStorePolicyDestination` to /terms and /privacy, shows the restore button with `storeButton`, and renders our marketing content (what Plus includes, trial end date, renews automatically, how to cancel) passed as strings. Purchases made in the view surface through StoreKit's transaction updates, which `expo-iap`'s listener also observes (Inferred; test it). | Apple APIs Verified; design Inferred | R4-S1 | One work package in F14. The rest of StoreKit comes from `expo-iap`. |

## 3. Auto-renewal law

### 3.1 California Automatic Renewal Law (Bus. and Prof. Code 17600 and following), as amended by AB 2863

Statute text read on law.justia.com (2025 code, amended by Stats. 2024 ch. 515). leginfo.legislature.ca.gov refused the fetch (robots.txt); I did not work around it.

| Duty | What the statute says (paraphrase) | Section | Source | [R] |
|---|---|---|---|---|
| Who is bound | A business that makes an automatic renewal or continuous service offer to a consumer in California. | 17602(a) | R4-S26 | See 3.2. |
| Clear terms and consent | Show the renewal terms clearly and conspicuously before the subscription is completed, close to the consent request; get affirmative consent before charging. AB 2863 requires express affirmative consent to the renewal terms. | 17602(a)(1), (a)(2) | R4-S26, R4-S27 | LEGAL-REQ-046 stays. |
| Consent records | Keep proof of consent for 3 years or 1 year after the contract ends, whichever is longer. | AB 2863 | R4-S27, R4-S28 | LEGAL-REQ-049 stays; without a server that sees purchases, the "completed" row cannot be reconciled from Apple notifications (see collision C1). |
| Acknowledgment | Send an acknowledgment with the renewal terms, cancellation policy and how to cancel. | 17602(a)(3) | R4-S26 | Apple's receipt email may or may not carry these. Unverified. |
| Free trial over 31 days | If a free trial or promotional price lasts more than 31 days, notify 3 to 21 days before it ends. | 17602(b)(1) | R4-S26, R4-S27 | Applies to the annual plan's 2-month trial. The monthly plan's 1-month trial is at the 31-day line; a 1-month trial can be 28 to 31 days. **Inferred:** probably outside (b)(1), counsel to confirm. |
| Initial term of a year or more | Notify 15 to 45 days before it renews. | 17602(b)(2) | R4-S26, R4-S27 | Applies to the $29.99 annual plan, every year. |
| Exemption to (b) | Notices in (b) are not required where the contract was not made electronically and the business holds no email, phone or other contact for the consumer. | 17602(b) | R4-S26 | **Inferred:** App Store purchases are electronic, so the exemption likely does not help. Whether "the business" holds the contact is part of the counsel question in 3.2. |
| Price change | Notify 7 to 30 days before a price change, with how to cancel. | 17602(g)(2) | R4-S26 | Apple notifies on price increases (R4-S12, R4-S15). Whether Apple's notice discharges our duty: counsel. |
| Annual reminder | The statute's first sentence limits it to a consumer under an annual automatic renewal or continuous service agreement: once a year, in the same medium the consumer used to sign up, stating the product, frequency and amount of charges, and how to cancel. Some firm summaries describe it as applying to all subscriptions. | 17602(h) | R4-S26; contrast R4-S28, R4-S29 | D-022's "anniversary reminder for monthly plans" may go beyond the statute. Counsel to read (h). "Same medium" for an in-app purchase is arguably in-app. Inferred, for counsel. |
| Online cancellation | If the consumer signed up online, they must be able to cancel online, including by a prominently located direct link or button in the account or device settings. | 17602(d)(1)(A) | R4-S26, R4-S27 | `showManageSubscriptions` in one tap (LEGAL-REQ-048) plus Apple's own Settings path. |
| Operative date | The AB 2863 changes apply to contracts entered into, amended or extended on or after 1 July 2025. | 17602, final subdivision | R4-S26 | Every Early Letters subscription is covered. |

### 3.2 Whether the ARL binds the developer when Apple is merchant of record

| Point | Finding | Status |
|---|---|---|
| Statute text | Binds "a business that makes an automatic renewal offer". It does not define "business" in 17601 and does not mention app stores or platforms. | Verified (R4-S26, R4-S30) |
| Apple's role | Apple charges the card, sets the renewal timing (no more than 24 hours before the period), handles cancellation, refunds and price-increase notices (R4-S19, R4-S15). | Verified |
| Case law | Siciliano v. Apple Inc. (Santa Clara Superior Court, 2013-1-CV-257676) was an ARL class action against Apple over auto-renewing subscriptions; reported preliminary settlement of $16.5 million in July 2018. The article found does not say whether developers were also liable. | Verified as reported (R4-S31) |
| Regulator or court guidance on developers using app-store billing | None found. Two developer-facing articles found recommend acting as if bound but cite no authority (R4-S32). | Not found |
| Reading | **Inferred, for counsel:** the developer writes the paywall, sets price and trial, and markets the offer, so a court could treat the developer as a business "making the offer" even though Apple bills. Apple also plausibly qualifies. Both may be bound. Nothing found says Apple's emails satisfy the developer's notice duties, and Apple's own pages do not say Apple sends trial-ending or annual-renewal notices (section 1.3). | Inferred |

### 3.3 Federal: FTC negative option rule and ROSCA (October 2026)

| Item | Finding | Source |
|---|---|---|
| 2024 Click-to-Cancel amendments | Vacated by the Eighth Circuit on 8 July 2025. | R4-S33 |
| What is in force | The original 1973 Negative Option Rule, which covers prenotification plans only and does not reach most modern auto-renewals. The FTC published a notice on 12 Feb 2026 revising the rule to conform to court decisions. | R4-S34, R4-S35, R4-S36 |
| New rulemaking | ANPRM issued 11 to 13 March 2026, asking whether to cover automatic renewals, trial conversions, cancellation, save offers and third-party providers. No NPRM found as of 3 Oct 2026. | R4-S34, R4-S35, R4-S36 |
| Still applies | ROSCA and FTC Act section 5. One firm counts five litigated actions and six settlements since January 2025. | R4-S33, R4-S34 |
| Conflict noted | The FTC rule page summary I read described the 2024 rule as in force. The page lists the 12 Feb 2026 conforming revision and the March 2026 ANPRM, and the firm alerts say the 1973 rule governs. I follow the firm alerts. Counsel to confirm. | R4-S36 |

[R] for the spec: LEGAL-REQ-046 and -048 remain the federal baseline (ROSCA: clear terms, express consent, simple cancellation). No federal pre-renewal notice rule exists today. State law (California, plus New York, Virginia, Utah, Massachusetts in D-022, not re-verified here) drives the notice table.

## 4. Age assurance

### 4.1 Declared Age Range (Apple)

| Item | Verified fact | Min OS | Source | [R] |
|---|---|---|---|---|
| Framework | `DeclaredAgeRange`; needs the `com.apple.developer.declared-age-range` entitlement. Data is declared by the user or a guardian and may be confirmed by payment method, ID or other method; the developer stays responsible for legal compliance. | iOS 26.0 | R4-S37 | iOS 17 minimum (D-040) means the call must be guarded by an OS check. |
| `AgeRangeService.requestAgeRange(ageGates:...)` | Up to three age gates; system shows a sharing prompt; response is `sharing(range)` with `lowerBound`, `upperBound`, declaration type, or declined. The system may override the gates by local rules. | iOS 26.0 | R4-S38 | Call with gate 18. Declined is not proof of adulthood. |
| Declaration types | `selfDeclared`, `guardianDeclared`, `confirmed` (credit card or government ID). Older granular cases deprecated. | iOS 26.0 | R4-S39 | Store nothing (D-026). |
| `isEligibleForAgeFeatures` | True when age assurance laws apply to this user by location and account. | iOS 26.2 | R4-S40 | Gate the regulated flow on this. |
| `requiredRegulatoryFeatures` | Returns a set including `significantAppChangeRequiresParentalConsent` and `significantAppChangeRequiresAdultNotification`. | iOS 26.x (sample needs iOS 26.4 device, Xcode 27) | R4-S41 | Needed only if we ship a "significant change". |
| Significant update acknowledgment | `showSignificantUpdateAcknowledgment(in:updateDescription:)`; PermissionKit for parental approval. Apple's sample blocks an "unverified adult" until they verify. | iOS 26.x | R4-S38, R4-S41 | **Inferred:** an 18+ only app has no minors to seek consent for, but adult-notification may still apply in Utah and Louisiana when we release a significant change. |
| Consent revocation | When a parent revokes consent Apple prevents the app from launching. Apps learn of it through App Store Server Notification `RESCIND_CONSENT`. No on-device API mentioned. | n/a | R4-S42 | Collides with "no App Store Server Notifications endpoint" (collision C4). Low practical impact for an 18+ app. |
| Older OS | Existing accounts on iOS 18 or earlier are not affected. | n/a | R4-S42 | On iOS 17 and 18 our own gate is the only check. |
| Xcode | Apps must be built with Xcode 26 and the iOS 26 SDK since 28 Apr 2026. | n/a | R4-S43 | Expo SDK 57 builds must use Xcode 26 or later; the iOS 26 APIs are reachable at compile time. |

### 4.2 State app store laws, status on 3 Oct 2026

| Law | Status | Developer duties (paraphrase) | Source |
|---|---|---|---|
| Texas SB 2420 (App Store Accountability Act) | District court enjoined it in Dec 2025. Fifth Circuit stayed the injunction on 10 June 2026; Apple says it is enforceable for new Texas Apple Accounts from 4 June 2026 (Apple's date). Supreme Court denied the application to vacate the stay on 6 July 2026 (No. 25A1390). Merits appeal pending. **In force.** | Use the app store's age category; get parental consent through the store for minors; notify of significant changes; use age data only for compliance and delete it. Apple asks developers to adopt Declared Age Range, the significant change API, the StoreKit age rating property and the `RESCIND_CONSENT` server notification. Enforcement under Texas DTPA. | R4-S44, R4-S45, R4-S46, R4-S47, R4-S48 |
| Utah SB 142 as amended by HB 498 (2026) | Developer duties delayed to 6 May 2027; AG enforcement removed, private right of action only; existing accounts by 6 May 2028. Apple's Feb 2026 note gave 6 May 2026 (superseded by the amendment). | Use store age signals; parental consent for minors; may ask the store to block minors. | R4-S49, R4-S50, R4-S51 |
| Louisiana HB 570 as amended by HB 977 (signed 15 May 2026) | Delayed to 1 July 2027. Apple's Feb 2026 note gave 1 July 2026 (superseded). | Use store signals; rely on store consent; use the more restrictive age if our data conflicts. | R4-S52, R4-S50 |
| California AB 1043 (Digital Age Assurance Act) | Signed 13 Oct 2025; operative 1 Jan 2027. AG enforcement only; up to $2,500 per affected child (negligent) or $7,500 (intentional). | OS provider sends an age bracket signal; developer requests it at download or launch and treats it as the primary indicator unless clear evidence says otherwise. Civil Code section numbers not confirmed (leginfo refused). | R4-S53, R4-S51 |
| Others | Alabama enacted a similar act in Feb 2026 (per FPF). Not researched further. | Unverified detail | R4-S54 |

[R] **Inferred, for counsel:** an 18+ only app that stops anyone the store marks under 18 is the most conservative reading. Our own gate (LEGAL-REQ-002) plus Declared Age Range where `isEligibleForAgeFeatures` is true meets "use the store's signal". California AB 1043 from 1 Jan 2027 adds a signal request at first launch for California users; whether Apple delivers it through Declared Age Range is Unverified.

## 5. Account and data rules (App Review Guidelines)

Read on the live guidelines page today; the page showed no last-updated date. Latest change found: 6 Feb 2026 (random or anonymous chat now under 1.2) (R4-S55, R4-S56).

| Guideline | Paraphrase | [R] Spec consequence |
|---|---|---|
| 5.1.1(v) Account deletion | If the app supports account creation it must offer account deletion inside the app. Apps may not demand personal data unless core or legally required. | LEGAL-REQ-029 in-app deletion is mandatory. Apple's support page on account deletion (subscriptions, Sign in with Apple revocation) could not be opened (429); see section 7. |
| 5.1.1(i) Privacy policy | Link in App Store Connect and in the app; must say what is collected, how, all uses, that third parties give equal protection, retention and deletion, how to revoke consent. | /privacy link in Settings and on the paywall. |
| 5.1.1(ii) Permission | Consent needed for user or usage data collection, even if anonymous; paid features may not depend on granting it; easy withdrawal. | Supports LEGAL-REQ-003 opt-in analytics and that Plus never needs analytics consent. |
| 5.1.1(ix) Regulated fields | Apps in highly regulated fields (banking, healthcare and others) or that require sensitive user information should come from a legal entity, not an individual. | **Collision C6.** Repo has a /health-privacy page and child data. Whether a baby memory book "requires sensitive user information" is a judgment App Review makes. Counsel and founder (D-004 hedge). |
| 5.1.2(i) Data use, third-party AI | Must disclose sharing with third parties including third-party AI and get explicit permission first; ATT permission needed for tracking. | v1.0 transcribes on device (B4, B7), so nothing goes to third-party AI. If server transcription returns (LEGAL-REQ-004), explicit consent first. |
| 5.1.4 Kids | Care with children's data (COPPA, GDPR). Apps outside the Kids Category may not use "For Kids", "For Children" or child-targeting language in name, subtitle, icon, screenshots or description. | Store copy must target parents ("for parents", "baby book"), never "for kids". F21. |
| 4.8 Login Services | An app using a third-party or social login (Google named) for the primary account must also offer an equivalent service that limits data to name and email, lets users hide their email, and does not collect interactions for ads without consent. Exceptions: own account system only, enterprise or education, government ID, client for a specific third-party service. | Sign in with Apple meets all three features, so Apple plus Google plus email link is compliant. **Inferred:** email magic link is "our own account system" too. |
| 2.5.2 Downloaded code | Apps must be self-contained and may not download, install or execute code that introduces or changes features. | Data packs (JSON rules, tables, prompt text) and ML model weights are data. **Inferred:** allowed if the generic engine ships in the binary and a pack cannot add a feature. No Apple text addresses ML model files directly. Avoid JavaScript in packs and no over-the-air JS bundles that add features. |
| 2.3.1(a) Hidden features | No hidden, dormant or undocumented features; every new feature must be described specifically in Notes for Review (generic notes rejected). | Server-driven content (B14) may change words and order, never switch on unreviewed features. Remote kill switches that turn a reviewed feature off are fine; flags that turn on unreviewed ones are not. List every flag in review notes. |
| 3.1.2(a) Ongoing value | Auto-renewables must give ongoing value, last at least 7 days, and work across the user's devices. | Plus must deliver continuing value (for example sync, multiple books, Read together extras). F14 must state what continues each month. |
| 3.1.2(c) Disclosures | Before asking to subscribe, describe what the user gets for the price and meet DPLA Schedule 2. | Our marketing content inside SubscriptionStoreView carries this. |
| 3.1.1 IAP | Paid features and subscriptions must be sold through in-app purchase. | Matches B2. |
| 2.2 Betas | Betas belong on TestFlight, must be intended for release, testers may not be paid; significant beta updates go to TestFlight review. | Matches B8. "Early version" note in the App Store build is not a beta label; keep the listing free of "beta". |
| Age rating | Updated age rating questions were due 31 Jan 2026; misrating can trigger review action (2.3.6). | Answer the new questionnaire honestly; an 18+ product does not have to be rated 18+ by content, but rating it 18+ makes Apple block minors in Australia, Brazil and Singapore (US-only release makes that moot). |

## 6. Asset delivery and size

| Item | Verified fact | Min OS | Source | [R] Spec consequence |
|---|---|---|---|---|
| Background Assets framework | System-managed downloads of extra assets, optionally hosted by Apple. Asset packs carry a manifest with a download policy: essential (before first launch), prefetch, or on demand. Needs a Background Download app extension. Self-hosting with low-level APIs is also allowed. Must be used only to download assets, never to identify users or for ads. | Framework iOS 16.0 | R4-S63 | Language packs and speech models are a fit ("on demand" policy). |
| Apple-hosted packs | Upload asset packs to App Store Connect and maintain them there like builds; upload before TestFlight or App Store distribution. | n/a | R4-S63 | Packs ship through the same release process as builds. Founder uploads them, or CI with the App Store Connect API (not checked). |
| `AssetPackManager` (managed packs) | Methods include `assetPack(withID:)`, `ensureLocalAvailability(of:)`, `statusUpdates`, `checkForUpdates()`, `remove(assetPackWithID:)`, `url(for:)`, `localSize(...)`, localized packs by language. Apple-hosted packs need StoreKit's `StoreDownloaderExtension`; self-hosted managed packs need `ManagedDownloaderExtension`. | **iOS 26.0** | R4-S64 | Below iOS 26 the managed path does not exist. With D-040 at iOS 17, a CDN path (D-046) is still required for iOS 17 to 25. "Packs deletable in Settings" maps to `remove(assetPackWithID:)` on iOS 26 and later. |
| Size limits | 200 GB total for all asset packs per app; at most 200 packs per app; no per-pack limit stated; email at 80% of the total. | n/a | R4-S65 | Seven languages plus models fit easily. |
| Pricing | The size-limit page and framework page say nothing about cost. | Unverified | R4-S63, R4-S65 | **Unverified** whether hosting is free with membership. |
| Integrity | Apple-hosted packs are delivered by the system; our own SHA-256 manifest check (B13) still applies to the CDN path. Whether Apple signs packs: not stated on pages read. | Unverified | none | Keep SHA-256 verification for both paths. |
| Expo feasibility | No Expo module or config plugin for Background Assets found. The extension is a separate app extension target. `expo-widgets` (section 9) shows Expo config plugins can add extension targets with an App Group. | Inferred | R4-S61 | One spike: a config plugin that adds the downloader extension plus a small module wrapping `AssetPackManager`. Not on the v1.0 critical path. |
| On-Demand Resources | An App Store Connect help page on ODR size limits still exists. Deprecation status not confirmed. | Unverified | R4-S57 | Do not build on ODR. |
| Download size measurement and cellular limit | App Store Connect help "Maximum build file sizes" exists; content not read. Cellular download limit and the per-device app size report not confirmed today. | Unverified | R4-S57 | **Inferred:** measure "download size" per device in App Store Connect for every TestFlight build; confirm the report name before writing acceptance criteria. |

## 7. Sign-in

| Item | What I could establish | Status | Source | [R] |
|---|---|---|---|---|
| Google sign-in on iOS with Supabase | Native flow: get a Google ID token with `@react-native-google-signin/google-signin`, then call `signInWithIdToken`. Needs both a web client ID and an iOS client ID. Nonce is optional: pass the hashed nonce to Google and the plain one to Supabase; a "Skip nonce check" setting exists but is not recommended for production. | Verified | R4-S58 | F02 uses the native ID-token flow with nonce on. Check the library's licence and SDK 57 support before install. |
| Passkeys in Supabase Auth | Docs page dated 2 Oct 2026 labels passkeys **experimental** (API may change). A user must be signed in before registering a passkey. Client minimums: `@supabase/supabase-js` 2.105.0, `supabase-swift` 2.48.0, `supabase_flutter` 2.15.0. Needs a relying party ID (bare domain) and up to 5 origins. Anonymous and SSO users cannot register. Changing the RP ID invalidates passkeys. The changelog title calls it Beta. | Verified | R4-S59 | Not GA. Keep passkeys out of the v1.0 gate or ship behind a flag listed in review notes. RP ID should be earlyletters.com (B11) and must not change. A React Native path needs a native passkey bridge; none checked. |
| Sign in with Apple revocation on deletion | Apple pages "Offering account deletion in your app" and the 2022 "Account deletion requirement starts June 30" news exist; forums discuss the token revoke REST endpoint. Not read today. | Unverified content | R4-S60 | Keep the deletion flow calling Apple's revoke endpoint (TDD / LEGAL-REQ-029); verify the endpoint name from Apple docs before coding. |
| Email magic link and OTP | Not researched today. | Unverified | none | Keep link plus 6-digit code (A-REQ-018) as _AUTHORING B3 says. |
| Guideline 4.8 | Verified, see section 5. | Verified | R4-S55 | Apple plus Google plus email is compliant. |

## 8. Privacy manifest and labels

Not researched today (fetch limits). Everything is **Unverified**.

| Item | Known from guidelines today | [R] |
|---|---|---|
| ATT | 5.1.2(i): ATT permission is needed to track. If we never track (no ad networks, no cross-app linking), no ATT prompt is needed. | Inferred from R4-S55. Do not add the ATT prompt. |
| PrivacyInfo.xcprivacy, required-reason APIs | Not verified today. | Agent must read Apple's current privacy manifest docs and the PostHog and Sentry SDK manifests in the installed versions. |
| PostHog and Sentry declarations | Not verified today. | Same. |

## 9. Notifications, widgets, intents, Live Activities

| Item | What I could establish | Status | Source | [R] |
|---|---|---|---|---|
| `expo-widgets` (SDK 57) | Official Expo package, installed with `npx expo install expo-widgets`; not in Expo Go (development builds only); no alpha or beta label on the page. Supports home screen widgets (small to extra large), Lock Screen accessory widgets (circular, rectangular, inline) and Live Activities (Lock Screen and Dynamic Island). Widgets are written with `@expo/ui/swift-ui` components in a component marked with the `'widget'` directive, which runs in an isolated runtime (no hooks, no async work, no module-scope values). Config plugin in app.json; sets up an App Group automatically. Interactive `Button` controls are supported; a button's `onPress` return value becomes the widget's new props. Live Activities: `start()` with an optional URL that opens the app on tap, `update()`, `getInstances()`, APNs push updates when enabled. Licence not stated on the page. | Verified | R4-S61 | Lock-screen widget "Start a letter" that deep-links into capture, and a Live Activity for an active recording, are both reachable from Expo. Check the licence in the package before install. |
| Control Center controls (iOS 18) | Not mentioned on the SDK 57 widgets page. | Unverified | R4-S61 | Needs a custom native target or a community library; v1.1 candidate. |
| App Intents for Siri and Shortcuts | Not mentioned on the SDK 57 widgets page; Apple pages not read. | Unverified | R4-S61 | Needs a native module; spike. Starting audio recording from an intent has background-audio rules not checked here. |
| Live Activity minimum OS | Expo page references iOS 16 and iOS 17 for some Live Activity features; exact minimum not stated. | Partly verified | R4-S61 | Above or at D-040 floor; fine. |
| Local notification limit (64 pending) | Apple's `UNNotificationRequest` page does not state a limit. | Unverified | R4-S70 | Until verified, schedule no more than 60 reminders at once and re-plan on launch. |
| Time-sensitive interruption level | Not verified today. | Unverified | none | Do not use for reminders until verified. |
| `expo-notifications` | Not read today. | Unverified | none | Agent reads the SDK 57 docs before speccing reminder scheduling. |

## 10. Collisions

Each collision states the founder decision, the rule it meets, and options. Legal readings are Inferred and for counsel.

| ID | Founder decision | Collides with | Evidence | Options for founder and counsel |
|---|---|---|---|---|
| C1 | No server of ours sees purchases; no App Store Server Notifications endpoint (B2). | California ARL notices: 2-month trial notice 3 to 21 days before it ends; annual plan notice 15 to 45 days before renewal; annual reminder; acknowledgment; consent records (LEGAL-REQ-047, -049, D-022). | 17602(a)(3), (b)(1), (b)(2), (h) (R4-S26). Apple's own pages do not say Apple sends trial-ending or annual-renewal reminders (section 1.3). No authority found that Apple's emails discharge the developer's duty (3.2). | A. Device-computed notices: the app reads `renewalDate`, `willAutoRenew`, `expirationDate` and offer type on device and schedules local notifications plus an in-app card. Weakness: a deleted app or a silenced phone gets nothing; no email; "same medium" reading for (h). B. Device reports minimal state to our server: on each launch the app sends `{renewal date, will renew, product, trial flag}` (no receipt, no price) so the server sends emails; this breaks "no server sees purchases" in spirit. C. Restore the server path in ADR 0013 (notifications plus App Store Server API). D. Counsel opines that Apple, as merchant of record, owns the notices and our duty is limited to paywall disclosures and easy cancel. E. Drop the 2-month annual trial (removes the (b)(1) notice); the annual renewal notice still remains. |
| C2 | Co-parent gets Plus through Family Sharing (B2). | Family Sharing needs both parents in the same Apple Family group and the same home country; up to six people; once turned on for a product it cannot be turned off; the purchaser can stop sharing at any time. ADR 0013 says "Family Sharing off". | R4-S17, R4-S18, R4-S19 | A. Accept: K-28 "Plus per account inherited by books" becomes "Plus per Apple Family". Co-parents in different Apple Families (separated parents, or each in their own family) do not get Plus. B. Add a server-side "book has Plus" signal later (needs a server that knows purchases, see C1). C. Explain on the paywall and in F11 that co-parent coverage needs Apple Family Sharing. Founder must accept that turning it on is permanent. Update ADR 0013 design point 1. |
| C3 | On-device-only enforcement; server code does not enforce Plus (B2). | PRD-REQ-015 server rule on extra books; K-28 book inheritance; a family member's Plus applies to anything in the app on their device, not per book. | R4-S2, R4-S18 | A. Accept that the second-child rule and any Plus feature can be bypassed by a modified client; the cost is a few lost subscriptions. B. If a Plus feature uses our server (sync of a second book, storage), that server feature can only check entitlement if the device sends a signed transaction, which B2 forbids. Founder decides whether any server-side Plus feature exists in v1.0. |
| C4 | 18+ gate; Declared Age Range "where required"; no notifications endpoint. | Texas SB 2420 is in force (stay upheld 6 July 2026). Apple's developer steps include the `RESCIND_CONSENT` server notification. Declared Age Range needs iOS 26 (eligibility check iOS 26.2) while D-040 floor is iOS 17. Utah and Louisiana moved to 2027; California AB 1043 from 1 Jan 2027. | R4-S42, R4-S44, R4-S45, R4-S40, R4-S49, R4-S52, R4-S53 | A. Keep our own neutral gate for all users, call Declared Age Range when `isEligibleForAgeFeatures` is true (iOS 26.2 and later), block any under-18 result. Apple blocks launch itself after consent revocation, so the missing endpoint matters little for an 18+ app. B. Counsel confirms that blocking all minors satisfies SB 2420 without parental-consent flows. C. Before 1 Jan 2027, confirm how Apple delivers California's AB 1043 signal. |
| C5 | Apple's own subscription UI (SubscriptionStoreView). | LEGAL-REQ-046 asks for the trial end date and cancel wording next to the button; the view controls price and button layout. `expo-iap` does not export the view; no other Expo library found. | R4-S1, R4-S67 | A. Native Expo module hosting SubscriptionStoreView with our text in the marketing content slot (trial end date computed on device). B. Custom React Native paywall using expo-iap product data (fails "Apple's own UI"). Counsel checks the view's layout meets "clear and conspicuous, close to consent". |
| C6 | Individual Apple Developer account (B12). | 5.1.1(ix): apps in highly regulated fields or that require sensitive user information should come from a legal entity. | R4-S55 | A. Submit as individual and see; risk is a rejection late in the schedule. B. Form an entity before submission (D-004 hedge). Founder and counsel. |
| C7 | Apple-hosted Background Assets preferred (B13). | Managed and Apple-hosted packs (`AssetPackManager`) need iOS 26 versus the iOS 17 floor (D-040); no Expo module found; needs a StoreKit downloader extension target. | R4-S64, section 6 | Ship the CDN path (D-046) for v1.0; add Background Assets later for iOS 26 and later if a spike succeeds. |
| C8 | Restore never moves an active plan between accounts (D-047). | Without a server, the app cannot know a transaction is bound to another Early Letters account. `appAccountToken` is set at purchase and readable on device, but mapping it to an account needs our server. | R4-S5, R4-S3 | A. Drop D-047; Plus follows the Apple Account on the device. B. Keep an on-device check of `appAccountToken` against a token the server gave this account (the server sees the token, not the purchase). Founder. |

## 11. Gaps

| Gap | Why | Who resolves |
|---|---|---|
| Fetch proxy refused (HTTP 429, then asked not to retry): npm `react-native-iap`, openiap.dev, the github.com/hyodotdev/openiap repo page, unpkg `expo-iap` types (raw source files on raw.githubusercontent.com were read instead), Apple StoreKit views list, Apple "Offering account deletion" support page. The Expo widgets page and the asset pack size page were refused at first and read later the same day. | Rate limiting on 3 Oct 2026 | Next research pass or the implementing agent, reading installed sources. |
| leginfo.legislature.ca.gov refused by robots.txt (AB 1043 and ARL bill text). | Site policy | Counsel or a pass using another official mirror. |
| Whether `currentEntitlements` and `Product.SubscriptionInfo.status` work offline and how fresh they are. | Apple pages silent | Device spike in airplane mode. |
| Whether Apple sends any reminder before a free trial ends or an annual renewal. | No Apple page says so | Founder can test with a sandbox or real account; counsel decides relevance. |
| Whether SubscriptionStoreView's content satisfies 3.1.2(c), DPLA Schedule 2, and ARL "clear and conspicuous". | Apple page silent | Counsel plus App Review. |
| expo-iap fields read on the main branch, not the 5.8.2 build; which Apple entitlement call `currentEntitlementIOS` wraps; SDK 57 compatibility. | Read main only | Spike BL-210 reading the installed build. |
| Background Assets pricing and Expo path; ODR status; cellular limit; size report name. | Not stated or fetch refused | Spike and re-read of App Store Connect help. |
| Sign in with Apple token revoke endpoint and Apple's account deletion support page; email magic link and OTP details; a React Native passkey bridge. | Fetch refused or not reached | Implementing agent reads current docs. |
| Privacy manifest required-reason APIs; PostHog and Sentry manifests. | Not reached | Implementing agent. |
| Local notification limit, time-sensitive rules, Control Center controls, App Intents, expo-notifications. | Not reached | Next pass. |
| Other state auto-renewal laws (NY, VA, UT, MA) in D-022. | Not re-verified | Counsel. |

## 12. Sources
| ID | Title | URL | Opened |
|---|---|---|---|
| R4-S1 | Apple, SubscriptionStoreView | https://developer.apple.com/documentation/storekit/subscriptionstoreview.md | 3 Oct 2026 |
| R4-S2 | Apple, Transaction.currentEntitlements | https://developer.apple.com/documentation/storekit/transaction/currententitlements.md | 3 Oct 2026 |
| R4-S3 | Apple, Product.SubscriptionInfo.RenewalInfo | https://developer.apple.com/documentation/storekit/product/subscriptioninfo/renewalinfo.md | 3 Oct 2026 |
| R4-S4 | Apple, Transaction | https://developer.apple.com/documentation/storekit/transaction.md | 3 Oct 2026 |
| R4-S5 | Apple, Transaction properties | https://developer.apple.com/documentation/storekit/transaction-properties.md | 3 Oct 2026 |
| R4-S6 | Apple, Transaction.ownershipType | https://developer.apple.com/documentation/storekit/transaction/ownershiptype-swift.property.md | 3 Oct 2026 |
| R4-S7 | Apple, RenewalInfo.renewalDate | https://developer.apple.com/documentation/storekit/product/subscriptioninfo/renewalinfo/renewaldate.md | 3 Oct 2026 |
| R4-S8 | Apple, AppStore.sync() | https://developer.apple.com/documentation/storekit/appstore/sync().md | 3 Oct 2026 |
| R4-S9 | Apple, AppStore.showManageSubscriptions(in:) | https://developer.apple.com/documentation/storekit/appstore/showmanagesubscriptions(in:).md | 3 Oct 2026 |
| R4-S10 | Apple, isEligibleForIntroOffer(for:) | https://developer.apple.com/documentation/storekit/product/subscriptioninfo/iseligibleforintrooffer(for:).md | 3 Oct 2026 |
| R4-S11 | Apple, Enable Billing Grace Period | https://developer.apple.com/help/app-store-connect/manage-subscriptions/enable-billing-grace-period-for-auto-renewable-subscriptions | 3 Oct 2026 |
| R4-S12 | Apple, Auto-renewable Subscriptions (App Store) | https://developer.apple.com/app-store/subscriptions/ | 3 Oct 2026 |
| R4-S13 | Apple, WWDC26 What's new in In-App Purchase | https://developer.apple.com/videos/play/wwdc2026/210/ | 3 Oct 2026 |
| R4-S14 | Apple, Managing Price Increases for Auto-Renewable Subscriptions | https://developer.apple.com/documentation/storekit/managing-price-increases-for-auto-renewable-subscriptions.md | 3 Oct 2026 |
| R4-S15 | Apple Developer News, Update to subscription notifications (16 May 2022) | https://developer.apple.com/news/?id=tpgp89cl | 3 Oct 2026 |
| R4-S16 | Apple, Supporting offer codes in your app | https://developer.apple.com/documentation/storekit/supporting-offer-codes-in-your-app.md | 3 Oct 2026 |
| R4-S17 | Apple, Turn on Family Sharing for In-App Purchases (App Store Connect Help) | https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/turn-on-family-sharing-for-in-app-purchases | 3 Oct 2026 |
| R4-S18 | Apple, Supporting Family Sharing in your app | https://developer.apple.com/documentation/storekit/supporting-family-sharing-in-your-app.md | 3 Oct 2026 |
| R4-S19 | Apple Media Services Terms and Conditions (US, updated 14 Sep 2026) | https://www.apple.com/legal/internet-services/itunes/us/terms.html | 3 Oct 2026 |
| R4-S20 | Apple, App Store Server Notifications notificationType | https://developer.apple.com/documentation/appstoreservernotifications/notificationtype.md | 3 Oct 2026 |
| R4-S21 | Apple Support, Cancel a subscription from Apple | https://support.apple.com/en-us/118428 | 3 Oct 2026 |
| R4-S22 | Apple Tech Talk, Improve your subscriber retention with App Store features | https://developer.apple.com/videos/play/tech-talks/111386/ | 3 Oct 2026 |
| R4-S23 | Apple Support, Request a refund | https://support.apple.com/en-us/118223 | 3 Oct 2026 |
| R4-S24 | npm registry, expo-iap latest (5.8.2) | https://registry.npmjs.org/expo-iap/latest | 3 Oct 2026 |
| R4-S25 | Callstack, Exposing SwiftUI views to React Native (search result only, not opened) | https://callstack.com/blog/exposing-swiftui-views-to-react-native-an-integration-guide | search 3 Oct 2026 |
| R4-S26 | California Bus. and Prof. Code 17602 (2025, via Justia) | https://law.justia.com/codes/california/code-bpc/division-7/part-3/chapter-1/article-9/section-17602/ | 3 Oct 2026 |
| R4-S27 | Cooley, California ARL amendments take effect 1 July 2025 (4 Jun 2025) | https://www.cooley.com/news/insight/2025/2025-06-04-california-automatic-renewal-law-amendments-take-effect-on-july-1-2025 | 3 Oct 2026 |
| R4-S28 | Fenwick, California tightens requirements for automatically renewing subscriptions (10 Oct 2024) | https://fenwick.com/insights/publications/california-tightens-requirements-for-automatically-renewing-subscriptions | 3 Oct 2026 |
| R4-S29 | Barnes and Thornburg, California expands automatic renewal law (7 Jul 2025) | https://btlaw.com/en/insights/alerts/2025/california-expands-automatic-renewal-law-new-requirements-now-in-effect | 3 Oct 2026 |
| R4-S30 | California Bus. and Prof. Code 17601 (2025, via Justia) | https://law.justia.com/codes/california/code-bpc/division-7/part-3/chapter-1/article-9/section-17601/ | 3 Oct 2026 |
| R4-S31 | Top Class Actions, Siciliano v. Apple auto-renew class action | https://topclassactions.com/lawsuit-settlements/lawsuit-news/apple-auto-renew-app-class-action-lawsuit-moves-forward/ | 3 Oct 2026 |
| R4-S32 | Appbot, Auto-renewal laws for app developers (13 Nov 2025) | https://appbot.co/blog/auto-renewal-laws-app-devs-subscription-compliance/ | 3 Oct 2026 |
| R4-S33 | Crowell, FTC moves to revive Click-to-Cancel after Eighth Circuit vacatur (11 Feb 2026) | https://crowell.com/en/insights/client-alerts/clicking-all-the-right-boxes-ftc-moves-to-revive-click-to-cancel-rule-following-eighth-circuit-vacatur | 3 Oct 2026 |
| R4-S34 | Mondaq, FTC relaunches negative option rulemaking (18 Mar 2026) | https://www.mondaq.com/unitedstates/advertising-marketing-branding/1760248/ftc-relaunches-negative-option-rulemaking-with-new-questions-new-branding | 3 Oct 2026 |
| R4-S35 | Greenberg Traurig, FTC seeks comment on potential updates to Negative Option Rule (16 Mar 2026) | https://www.gtlaw.com/en/insights/2026/3/ftc-seeks-comment-on-potential-updates-to-negative-option-rule | 3 Oct 2026 |
| R4-S36 | FTC, Negative Option Rule page | https://www.ftc.gov/legal-library/browse/rules/negative-option-rule | 3 Oct 2026 |
| R4-S37 | Apple, Declared Age Range framework | https://developer.apple.com/documentation/declaredagerange.md | 3 Oct 2026 |
| R4-S38 | Apple, AgeRangeService | https://developer.apple.com/documentation/declaredagerange/agerangeservice.md | 3 Oct 2026 |
| R4-S39 | Apple, AgeRangeService.AgeRangeDeclaration | https://developer.apple.com/documentation/declaredagerange/agerangeservice/agerangedeclaration.md | 3 Oct 2026 |
| R4-S40 | Apple, isEligibleForAgeFeatures | https://developer.apple.com/documentation/declaredagerange/agerangeservice/iseligibleforagefeatures.md | 3 Oct 2026 |
| R4-S41 | Apple, Implementing age assurance and permissions (sample) | https://developer.apple.com/documentation/declaredagerange/implementing-age-assurance-and-permissions.md | 3 Oct 2026 |
| R4-S42 | Apple, Age assurance developer Q and A | https://developer.apple.com/support/age-assurance/ | 3 Oct 2026 |
| R4-S43 | Apple, Upcoming requirements | https://developer.apple.com/news/upcoming-requirements/ | 3 Oct 2026 |
| R4-S44 | Apple Developer News, Update for apps distributed in Texas (3 Jun 2026) | https://developer.apple.com/news/?id=sg176nne | 3 Oct 2026 |
| R4-S45 | Apple Developer News, Update on age requirements for apps distributed in Texas (23 Dec 2025) | https://developer.apple.com/news/?id=8jzbigf4 | 3 Oct 2026 |
| R4-S46 | Apple Developer News, Next steps for apps distributed in Texas (4 Nov 2025) | https://developer.apple.com/news/?id=2ezb6jhj | 3 Oct 2026 |
| R4-S47 | US Supreme Court docket 25A1390, CCIA v. Paxton (denied 6 Jul 2026) | https://www.supremecourt.gov/search.aspx?filename=/docket/docketfiles/html/public/25a1390.html | 3 Oct 2026 |
| R4-S48 | Morrison Foerster, Texas app store law takes effect after Fifth Circuit stays injunction (updated 10 Jun 2026) | https://www.mofo.com/resources/insights/251111-texas-targets-app-stores-with-new-accountability-law | 3 Oct 2026 |
| R4-S49 | Loeb and Loeb, Update on Utah app store law (1 May 2026) | https://www.loeb.com/en/insights/passle/2026/05/update-on-utah-app-store-law--another-waiting-game | 3 Oct 2026 |
| R4-S50 | Apple Developer News, Age requirements for apps distributed in Brazil, Australia, Singapore, Utah, and Louisiana (24 Feb 2026) | https://developer.apple.com/news/?id=f5zj08ey | 3 Oct 2026 |
| R4-S51 | RecordingLaw, App store age verification laws compared (13 Aug 2026, reviewed 3 Sep 2026) | https://www.recordinglaw.com/us-laws/age-verification-laws/app-store-age-verification-laws/ | 3 Oct 2026 |
| R4-S52 | Alston and Bird, Louisiana delays app store accountability effective date to July 2027 (27 May 2026) | https://www.alstonprivacy.com/louisiana-delays-app-store-accountability-effective-date-to-july-2027/ | 3 Oct 2026 |
| R4-S53 | Alston and Bird, California enacts digital age verification law (23 Oct 2025) | https://www.alstonprivacy.com/california-enacts-digital-age-verification-law/ | 3 Oct 2026 |
| R4-S54 | Future of Privacy Forum, Comparing enacted App Store Accountability Acts (3 Jun 2026) | https://fpf.org/blog/comparing-enacted-app-store-accountability-acts/ | 3 Oct 2026 |
| R4-S55 | Apple, App Review Guidelines | https://developer.apple.com/app-store/review/guidelines/ | 3 Oct 2026 |
| R4-S56 | Apple Developer News, Updated App Review Guidelines (6 Feb 2026) | https://developer.apple.com/news/?id=d75yllv4 | 3 Oct 2026 |
| R4-S57 | developer.apple.com search results (titles only, pages refused 429): Apple-hosted asset pack size limits; WWDC25 Discover Apple-Hosted Background Assets; WWDC26 Unlock in-game content with StoreKit and Background Assets; On-demand resources size limits; Maximum build file sizes | https://developer.apple.com/help/app-store-connect/reference/app-uploads/apple-hosted-asset-pack-size-limits/ ; https://developer.apple.com/videos/play/wwdc2025/325/ ; https://developer.apple.com/videos/play/wwdc2026/378/ ; https://developer.apple.com/help/app-store-connect/reference/app-uploads/on-demand-resources-size-limits ; https://developer.apple.com/help/app-store-connect/reference/app-uploads/maximum-build-file-sizes | search 3 Oct 2026 |
| R4-S58 | Supabase, Login with Google guide | https://supabase.com/docs/guides/auth/social-login/auth-google.md | 3 Oct 2026 |
| R4-S59 | Supabase, Passkey authentication docs (dated 2 Oct 2026); changelog title "Passkeys for Supabase Auth (Beta)" seen in search | https://supabase.com/docs/guides/auth/passkeys ; https://supabase.com/changelog/46458-passkeys-for-supabase-auth-beta | 3 Oct 2026 |
| R4-S60 | Apple, Offering account deletion in your app (refused 429) and News, Account deletion requirement starts June 30 (search result only) | https://developer.apple.com/support/offering-account-deletion-in-your-app/ ; https://developer.apple.com/news/?id=12m75xbj | search 3 Oct 2026 |
| R4-S61 | Expo docs, widgets SDK reference v57 | https://docs.expo.dev/versions/v57.0.0/sdk/widgets/ | 3 Oct 2026 |
| R4-S62 | CCIA, CCIA v. Paxton litigation page | https://ccianet.org/litigation/ccia-v-paxton/ | 3 Oct 2026 |
| R4-S63 | Apple, Background Assets framework | https://developer.apple.com/documentation/backgroundassets.md | 3 Oct 2026 |
| R4-S64 | Apple, AssetPackManager | https://developer.apple.com/documentation/backgroundassets/assetpackmanager.md | 3 Oct 2026 |
| R4-S65 | Apple, Apple-hosted asset pack size limits (App Store Connect Help) | https://developer.apple.com/help/app-store-connect/reference/app-uploads/apple-hosted-asset-pack-size-limits/ | 3 Oct 2026 |
| R4-S66 | openiap, expo-iap README (main branch) | https://raw.githubusercontent.com/hyodotdev/openiap/main/libraries/expo-iap/README.md | 3 Oct 2026 |
| R4-S67 | openiap, expo-iap src/modules/ios.ts (main branch) | https://raw.githubusercontent.com/hyodotdev/openiap/main/libraries/expo-iap/src/modules/ios.ts | 3 Oct 2026 |
| R4-S68 | openiap, expo-iap src/index.ts (main branch) | https://raw.githubusercontent.com/hyodotdev/openiap/main/libraries/expo-iap/src/index.ts | 3 Oct 2026 |
| R4-S69 | openiap, expo-iap src/types.ts (main branch) | https://raw.githubusercontent.com/hyodotdev/openiap/main/libraries/expo-iap/src/types.ts | 3 Oct 2026 |
| R4-S70 | Apple, UNNotificationRequest | https://developer.apple.com/documentation/usernotifications/unnotificationrequest.md | 3 Oct 2026 |
