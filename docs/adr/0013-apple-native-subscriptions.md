# ADR 0013: Plus through Apple only, StoreKit 2 direct (expo-iap) with App Store Server Notifications V2 and the App Store Server API

Status: Accepted (founder direction, 3 Oct 2026; implementation choice recommended here, founder may override). Date: 2026-10-03.
Supersedes: the digital-purchase half of ADR 0007 (RevenueCat). ADR 0007's printed-book half stays as future roadmap (PRD K-32).
Related: PRD.md 1.3 K-34, `docs/DECISIONS.md` D-001, TDD 08 (payments), TDD 02 section 2.5 (entitlement tables), TDD 05 section 5.11 (notice engine).

> **Note, 4 Oct 2026 (D-051, D-052):** this ADR's mechanics (Apple-only sale, StoreKit 2, notifications, prices and trials) are unchanged, but Plus is now the membership that unlocks new letters after 2 free per account, not an optional extra. The notification list here already includes `OFFER_REDEEMED`; D-052 relies on it for Apple offer codes (no code table of ours). Note also that `docs/agents/BRIEF-2026-10-03.md` item 3 says no notifications endpoint and no server Plus enforcement, which conflicts with this ADR; unresolved, see that file.

Evidence labels: **V** verified on a page or package opened on 3 Oct 2026; **U** unverified; **E** our estimate.

## Context

The founder decided on 3 Oct 2026 that Plus ships in v1.0 "via Apple subscription management to keep it Apple focused". Read as: auto-renewable subscriptions sold, managed, cancelled and refunded only through the App Store. Pricing is unchanged: `el_plus_monthly_399` ($3.99 a month, 1-month free trial) and `el_plus_annual_2999` ($29.99 a year, 2-month free trial), both Apple introductory offers in one subscription group, US storefront only (LEGAL-REQ-058).

What has to work, whichever tool we use (TDD 08, unchanged): a Plus entitlement per account (K-28) that books inherit from any parent; server enforcement of the additional-book rule (PRD-REQ-015); the California and multi-state auto-renewal notice engine (PRD-REQ-003, LEGAL-REQ-047, K-38); purchase consent records (LEGAL-REQ-049); restore (C-REQ-020); refunds through Apple (C-REQ-029); Billing Grace Period (C-REQ-027); one-tap Manage or cancel (LEGAL-REQ-048); and the keep-and-leave rule that core features never ask the entitlement service (LEGAL-REQ-050).

TDD 08 designed this on RevenueCat with "the webhook is only a doorbell, re-read the subscriber, write a snapshot". This ADR keeps that shape and swaps the source of truth from RevenueCat to Apple's own server APIs.

## Options

### A. StoreKit 2 direct (recommended)
- **Client:** `expo-iap` (MIT), an Expo module with a config plugin, now maintained in the `hyodotdev/openiap` monorepo; npm `expo-iap` 5.8.2 published 30 Sep 2026 (**V**, npm registry). The package exposes `requestPurchase` (with `appAccountToken`), `getActiveSubscriptions`, `currentEntitlementIOS`, `subscriptionStatusIOS`, `isEligibleForIntroOfferIOS`, `showManageSubscriptionsIOS`, `beginRefundRequestIOS`, `getAppTransactionIOS`, `syncIOS` and `finishTransaction` (**V**, read in the published 5.8.2 build). Compatibility with Expo SDK 57 / RN 0.86 is **U** and is the first spike (BL-210). ADR 0007's note that "expo-iap was archived in Aug 2026" referred to the old standalone repository; the package itself is active in the monorepo (**V**). Fallback if the spike fails: `react-native-iap` 16.x from the same monorepo (MIT, Nitro modules; **V** on npm), or a small Expo module over StoreKit 2.
- **Server:** one Edge Function receives **App Store Server Notifications V2** (signed JWS `signedPayload`), verifies the certificate chain to Apple's root, deduplicates on `notificationUUID`, then re-reads the authoritative state with the **App Store Server API** (Get All Subscription Statuses by `originalTransactionId`) and writes the same snapshot rows TDD 08 defined. A nightly and an hourly reconcile use Get Notification History and Get All Subscription Statuses. Apple publishes an official Node library, `@apple/app-store-server-library` 3.1.0 (MIT; **V**, npm), which does JWS verification and API calls; whether it runs unchanged in Supabase's Deno runtime through an `npm:` import is **U** (spike BL-211; fallback is `jose` for JWS verification against Apple Root CA G3 plus plain `fetch` with an ES256 JWT signed by our In-App Purchase key).
- **Account binding:** every purchase passes `appAccountToken` = a random UUID minted server-side per account (`app_account_tokens`), never the profile id, email or analytics id. Apple returns it on every transaction and notification, so the server maps transactions to accounts without any third party.

### B. RevenueCat (ADR 0007, TDD 08 as written)
RevenueCat SDK on the device, RevenueCat receives the App Store notifications and keeps the subscriber record, and calls our webhook; we re-read RevenueCat's REST API.

### C. Hybrid (StoreKit on device, RevenueCat server-only)
Rejected: keeps the vendor and its DPA, saves little code.

## Comparison

| Criterion | A. StoreKit 2 direct | B. RevenueCat |
|---|---|---|
| Vendor cost | $0. Apple's commission applies either way (15% under the Small Business Program, which individuals can join; ARCH [S19]) | Free to $2,500 monthly tracked revenue, then 1% of tracked revenue (**V**, revenuecat.com/pricing, 3 Oct 2026). At launch scale this is $0; at $10k MTR about $100 a month (**E**) |
| Privacy | No new processor. Apple is already a party to every purchase as merchant of record. Only the random `appAccountToken` and Apple's own transaction ids exist; nothing new leaves our systems | One more processor holding purchase history keyed by a random id. Its DPA allows internal service improvement (subprocessors.md item 6). Needs a deletion API call at account deletion (LEGAL-REQ-029) and a privacy-label SDK review |
| Vendor count and admin burden | One fewer vendor: no DPA to sign, no console to secure with 2FA and log (LEGAL-REQ-037), no subprocessor notice duty, no SDK in the privacy manifest | Adds all of those |
| Privacy labels | "Purchases: Purchase History, linked, App Functionality" stays (entitlements are mapped to books on our server, K-28). One fewer SDK to audit for device identifiers | Same label, plus RevenueCat SDK checks |
| Engineering effort | TDD 08 estimate (4 to 5 engineer-weeks) plus about 1.5 to 2.5 engineer-weeks (**E**) for: JWS verification, App Store Server API client, notification-type mapping (SUBSCRIBED, DID_RENEW, DID_CHANGE_RENEWAL_STATUS, DID_FAIL_TO_RENEW, GRACE_PERIOD_EXPIRED, EXPIRED, REFUND, REFUND_REVERSED, REVOKE, PRICE_INCREASE, OFFER_REDEEMED, TEST), reconcile, and sandbox versus production environments. The snapshot re-read design means event ordering bugs cannot corrupt state | TDD 08 estimate as written |
| Operational risk | We own correctness. Mitigated by re-reading Apple's state on every notification, `sync_plan()` after purchase, and reconcile jobs | Vendor outage or mapping bug; mitigated the same way |
| Lock-in | None beyond Apple | Medium (entitlement history exportable) |
| Business reporting | App Store Connect Sales and Trends and subscription reports, plus our server aggregates from the entitlement ledger (PRD-REQ-017) | RevenueCat charts as well |
| Android later | Must add Google Play Billing: `expo-iap` already supports Play Billing on the device (**V**, same package), but the server side (Real-time Developer Notifications through Pub/Sub plus the Play Developer API) is new work, about 2 to 3 engineer-weeks (**E**). Alternative at that point: move both stores to RevenueCat | Mostly configuration |
| Fit with the founder's direction | "Apple focused": cancel, refund and manage all live in Apple's own screens; no third-party billing brand anywhere | Neutral |

## Decision

**A. StoreKit 2 direct**, as directed by the founder. The founder can override to B until the server billing tasks start (BL-213, roadmap week 6) at almost no cost; after that a switch costs about one engineer-week of rework (**E**).

### Design (deltas from TDD 08; everything not listed stays as TDD 08 wrote it)

1. **Products** (TDD 08 3.1 unchanged): one group "Plus"; `el_plus_monthly_399` with a 1-month free introductory offer; `el_plus_annual_2999` with a 2-month free introductory offer. Experiment arms created but not offered. Family Sharing off. Billing Grace Period on (16 days, D-048). US storefront only.
2. **Tables** (TDD 02 M9 with renames, as written in the pending migration `20261003010000_children_and_entitlements.sql`):
   - `app_account_tokens(profile_id pk, app_account_token uuid unique)`: replaces `rc_app_user_id`. L3. Returned by RPC `my_app_account_token()` the first time a signed-in parent opens the Plus sheet.
   - `store_subscriptions` (one row per `original_transaction_id`; replaces TDD 08's `entitlements`): status (`trial`, `active`, `grace`, `billing_retry`, `expired`, `revoked`, `refunded`), `expires_at`, `grace_expires_at`, `will_renew`, `environment`, `storefront`, `original_purchase_at`, `last_signed_at` (newer Apple state wins). `profile_id` is set null at account deletion, which pseudonymises the purchase ledger (7 years). Written only by `apply_store_transaction()` (service role), called by `appstore-notifications`, `plan-reconcile` and `sync_plan()`.
   - `store_notifications`: one row per `notification_uuid` (replaces `rc_event_id` and TDD 08's `entitlement_events`) with type, subtype, environment, original transaction id, signed time and outcome. Never the raw JWS, price or receipt.
   - `book_has_plus(child)` is computed from `store_subscriptions` of the book's parents (no `book_entitlements` table in the 3 Oct migration); `notice_windows`, `notice_schedule`, `plan_cards`: as TDD 08, still to be built (BL-212, BL-218).
3. **Purchase flow** (TDD 08 4.1 with the source swapped): consent row `started` (LEGAL-REQ-049) then `requestPurchase({sku, appAccountToken})` then, on success, the client sends the signed transaction JWS to `sync_plan()`; the server verifies the JWS, re-reads Get All Subscription Statuses, writes the snapshot and returns plan state; the client calls `finishTransaction` only after the server confirms (so a crash re-delivers the transaction through StoreKit's update listener). The ack email is sent by the notification path, not the client.
4. **Notifications endpoint** `appstore-notifications` (Edge Function): verify JWS chain to the pinned Apple root; reject on bundle id or environment mismatch; record the `notificationUUID` in `store_notifications` (a duplicate returns 200 and changes nothing); map `appAccountToken` (or `originalTransactionId` already known) to the profile; re-read state from the App Store Server API; call `apply_store_transaction()` (newest signed state wins); recompute `notice_schedule`; reconcile the consent row; log request id, notification type and outcome only. Unknown account: store and retry for 24 h (TDD 02 behaviour). Production and Sandbox URLs are both configured in App Store Connect; sandbox entitlements count only for `profiles.is_tester` (TDD 08 F-8).
5. **Reconcile** `plan-reconcile` (pg_cron): hourly for rows with an expiry within 48 h or `updated_at` older than 24 h; nightly for every non-expired row; plus Get Notification History for the last 48 h to catch lost notifications. Alert on more than 1% mismatches.
6. **Restore** (C-REQ-020): `syncIOS()` then `sync_plan()` with the current entitlements. Transfer rule (D-047): if the `originalTransactionId` is already bound to another account with an active plan, do not move it; show the existing "linked to another account" message. Otherwise bind it to the current account.
7. **Manage, cancel, refund**: `showManageSubscriptionsIOS()` in one tap with the `https://apps.apple.com/account/subscriptions` fallback (LEGAL-REQ-048); `beginRefundRequestIOS()` under Settings > Plan (C-REQ-029). Apple decides refunds; REFUND and REVOKE notifications end the entitlement only.
8. **Intro-offer eligibility** from `isEligibleForIntroOfferIOS()` per group; no "free" wording unless eligible (C-REQ-022).
9. **Account deletion** (LEGAL-REQ-029): no third-party deletion call exists any more. We delete the `app_account_tokens` row, set `store_subscriptions.profile_id` to null (pseudonymised ledger), pseudonymise `auto-renewal-terms` acceptances (retention per LEGAL-REQ-033), and show "Deleting your account does not cancel Plus. Billing continues through Apple until you cancel" with the Manage link. Apple keeps its own purchase records as merchant of record; the Privacy Policy says so.
10. **Secrets** (LEGAL-REQ-026): In-App Purchase key (.p8), key id, issuer id, bundle id and the Apple root certificate fingerprint live in Supabase Edge Function secrets; key rotation is a runbook item. The key is created in the publisher's App Store Connect account (individual account, D-004).
11. **Testing** (TDD 08 9.1 with the W suite re-pointed): StoreKit Configuration file for local UI tests; Deno tests replay recorded and synthetic signed notifications (test keys, never Apple's); App Store Server API "Request a Test Notification" against sandbox; the sandbox checklist S-1 to S-10 on device before every build that changes purchase code; the year-long notice clock test is unchanged.
12. **Analytics**: device events unchanged (TDD 08 section 12, after consent only). Lifecycle numbers (trials, conversions, refunds) come from `store_subscriptions`, `store_notifications` and App Store Connect reports, never from device events.

### What changes elsewhere
- PRD-REQ-003 and PRD-REQ-017 cite App Store Server Notifications and the entitlement ledger instead of RevenueCat (PRD 1.3).
- LEGAL-REQ-029, -031, -037, -047, -049, -058 lose their RevenueCat wording (ENGINEERING_REQUIREMENTS 1.1.0).
- `subprocessors.md`, `privacy-policy.md`, `app-store-privacy-labels.md`, `data-policy.md`, `DATA_CLASSIFICATION.md` and `DELETION_AND_EXPORT_SPEC.md` drop RevenueCat as a processor (versions bumped on 3 Oct 2026).
- `docs/analytics/TRACKING_PLAN.md` still names RevenueCat for lifecycle totals; owner action for the analytics engineer.

## Consequences
- One fewer processor and one fewer SDK; no billing brand other than Apple's anywhere in the product.
- About 1.5 to 2.5 extra engineer-weeks of agent-written server code, all of it behind pure, table-driven tests (TDD 08's engine, windows and webhook replay suites carry over).
- We own entitlement correctness. The re-read-on-every-notification design and two reconcile jobs are the controls; the sandbox checklist gates every purchase-code release.
- Android needs its own server integration later (or RevenueCat for both stores at that point). That decision is made at Android planning, not now.
- App transfer to a future organisation account (D-004) needs the In-App Purchase key and notification URLs re-created under the new team; Apple's transfer steps for auto-renewable subscriptions apply (`docs/ROADMAP.md` section 7).

## Alternatives rejected
- **RevenueCat** (option B): lower effort, but adds a processor, a DPA, an SDK and a console, against the founder's "Apple focused" direction. Kept as the documented fallback and as the likely Android-time option.
- **Hybrid** (option C): keeps the vendor without removing much code.
- **Web or external purchase links** (US storefront allows them): out of scope; adds payments, refunds and tax we would own, and review risk.
