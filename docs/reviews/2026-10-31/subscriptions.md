# Subscriptions and offer codes: independent review (31 Oct 2026)

Scope: Plus subscription management and promo or offer codes on `develop` (worktree `wt-val`). Read only, apart from this file.
Read: CLAUDE.md, DECISIONS D-053, D-077, D-080, D-081, D-082, D-083, D-121 to D-126, ADR 0013, `docs/emails/COMPLIANCE.md`, `docs/store/*`, `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md`, `docs/legal/terms-of-service.md`, `docs/legal/subscription-terms.md`.
Traced: `apps/mobile/modules/scribe-store/**`, `apps/mobile/src/lib/billing/**`, `app/settings/plus.tsx`, `components/settings/plan.logic.ts`, `components/child/plus-gate*.ts(x)`, `app/plus/confirmed.tsx`, `storekit/EarlyLetters.storekit`, `packages/content/src/features/billing.en.ts`, `packages/content/src/pricing.ts`, `packages/content/src/emails/billing.en.ts`, `packages/emails/src/templates/billing/*`, `packages/api/src/server/subscription-status.ts`, `supabase/functions/subscription-status`.

Labels: **V** verified by reading the code or doc named, or by a test run. **I** inferred (legal reading, Apple behaviour not run on a device, or intent).

## Tests run (V)

| Suite | Result |
|---|---|
| `apps/mobile` billing, plan, plus-gate, settings-p6b, native-guards, keep-step and related (18 files) | 350 passed |
| `packages/content` `test/pricing.test.ts` | 5 passed |
| `packages/api` `test/server-contracts.test.ts` | 47 passed |
| `packages/emails` (all) | 34 passed |
| `packages/core` plan | 79 passed |

All green. The tests do not read `docs/legal/*.md` for prices or for what Plus adds, which is how SUB-01 and SUB-02 got through.

## Product ids and prices (V)

| Where | Monthly | Annual | Trial | Family Sharing |
|---|---|---|---|---|
| `apps/mobile/src/lib/billing/config.ts:12` | `plus.monthly` | `plus.annual` | not in app (D-083) | n/a |
| `apps/mobile/storekit/EarlyLetters.storekit` | `plus.monthly` $4.99 P1M | `plus.annual` $49.99 P1Y | P1M / P2M free | true / true |
| `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md:16-20` | $4.99 | $49.99 | 1 / 2 months | On; grace 16 days |
| `packages/content/src/pricing.ts` (website, pages) | $4.99 | $49.99 | first month / first 2 months | |
| `packages/emails/src/templates/fixtures.ts:46` | | $49.99 | | |
| `docs/DECISIONS.md` D-082 | $4.99 | $49.99 | 1 / 2 months | On |
| **`docs/legal/terms-of-service.md:237`** (14.2) | **$3.99** | **$29.99** | 1 / 2 months | |
| **`docs/legal/subscription-terms.md:32-33`** | **$3.99** | **$29.99** | 1 / 2 months | |
| `docs/legal/compliance-register.md:40`, `docs/adr/0013-apple-native-subscriptions.md:20-21`, `docs/legal/COUNSEL_PACKET.md:14`, `.claude/agents/payments.md:22` | $3.99 | $29.99 | | |

Product ids agree everywhere (`billing-plan.test.ts` pins code, StoreKit file and the ASC doc together). Prices agree everywhere except the legal documents and four internal references, which still carry the D-012 prices that D-082 replaced. The in-app copy names no amount (D-083, `pricing.test.ts`), and the store listing (`docs/store/app-store.md`, `packages/content/src/store.en.ts`) names none either.

## Findings

### SUB-01 Blocker: Terms and Subscription Terms state the old prices (V)
- **Evidence:** `docs/legal/terms-of-service.md:237` "US $3.99 a month ... or US $29.99 a year"; `docs/legal/subscription-terms.md:32-33` the same. StoreKit, ASC click-path, website and D-082 say $4.99 and $49.99. The store sheet links `brand.web.terms` (`actions.ts` `storeSheetOptions`), so the page a buyer opens from Apple's sheet would name a price lower than Apple charges. That is a 17602(a)(1) "clear and conspicuous" problem and a 3.1.2 / 2.3.1 metadata problem.
- **Fix:** in both documents replace $3.99 with $4.99 and $29.99 with $49.99 (bump versions: ToS 1.5.0 to 1.6.0, Subscription Terms 1.4.0 to 1.5.0, and `SUBSCRIPTION_TERMS_DOC_VERSION` in `config.ts:36` in the same PR; `billing-status-report.test.ts:238` will force it). Same edit in `compliance-register.md:40`, ADR 0013 lines 20-21 (with a "superseded by D-082" note), `COUNSEL_PACKET.md:14` and `.claude/agents/payments.md:22`. Then extend `packages/content/test/pricing.test.ts` to scan `docs/legal/terms-of-service.md` and `docs/legal/subscription-terms.md` for `\$\d+\.\d{2}` and require each amount to be `PLUS_PRICE.monthly` or `PLUS_PRICE.yearly`. Legal text is founder-merged (D-125 item 5), so this goes to the founder and counsel.

### SUB-02 Blocker: Terms describe the wrong product (what Plus gates) (V)
- **Evidence:** `terms-of-service.md:231-235` (14.1) and `subscription-terms.md:21-24` say Plus adds "Read together after 3 free sessions" and "Books for more children". D-082/D-083 and the store sheet (`billing.en.ts:28-31`) say: two free letters, then Plus to keep adding letters; Read together and new books are free. The Subscription Terms' own counsel note says it must match `billingCopy.store.features` at every release (Apple 3.1.2(c)).
- **Fix:** rewrite 14.1 and the "What stays free / What Plus adds" sections to the D-082 model in the same words as `billingCopy.store.subtitle`, `features[0]` and `promise`. Add a content rule test that the Subscription Terms "What Plus adds" bullets equal `billingCopy.store.features`.

### SUB-03 High: The first store build has no 17602(b) notice that names the amount (V for code, I for law)
- **Evidence:** D-121 ships the first binary with `EXPO_PUBLIC_STATUS_REPORT=off` (`apps/mobile/eas.json:18`) and nobody has an email (D-125 item 7, Q-C1). The email scheduler WP-F14-16 is "Not built" (`docs/prd/v2/08-delivery.md:1069`); nothing in `supabase/functions` sends any billing template. The only notices are local notifications and an in-app note, and by D-083 they never name a price: `billing.en.ts:138-141` ("Plus is free until {date}, then it renews unless you cancel."). COMPLIANCE 5.1 reads 17602(b)(1) (trial over 31 days, which the annual 2-month trial is) and (b)(2) (annual renewal) as requiring "the amount and frequency of charges". Terms 14.6 (`terms-of-service.md:251`) also promises that "Each reminder gives the date, the price after, and how to cancel", which the app does not do.
- **Fix:** a founder plus counsel call before submission, one of: (a) let the trial-long and annual-long reminders, the in-app note and the purchase confirmation state the price and period from StoreKit's `Product.displayPrice` and `subscription.subscriptionPeriod` (a narrow D-083 exception; add `displayPrice` to the snapshot in `ScribeStoreModule.swift` `describe` via `Product.products(for:)`; the amount then comes from Apple, never typed); or (b) counsel confirms in writing that Apple's own renewal emails satisfy (b)(1)/(b)(2) and Terms 14.6 drops "the price after". Either way, align Terms 14.6 with what ships.

### SUB-04 Medium: Purchase acknowledgment shows only on the store-sheet path, and omits the amount (V code, I law)
- **Evidence:** the confirmation (`/plus/confirmed`, the 17602(a)(3) retained acknowledgment per `billing.en.ts:156-161`) opens only from `presentPlusStore` (`actions.ts:73`). An Ask to Buy approval, a code redeemed in the app or in the App Store, or a purchase made on another iPhone with the same Apple Account turns Plus on through the listener with no acknowledgment. The confirmation text never states the amount (D-083), although the acknowledgment must carry the automatic renewal offer terms (17601(b) includes the charge).
- **Fix:** in `plan-store.ts` `accept`, when the plan moves from not own-Plus to own-Plus and no confirmation has been shown for that `originalPurchasedAt`, set a pending flag that `PlanNoticeHost` turns into the confirmation on the next foreground; store the shown key in settings. Amount: as SUB-03 option (a), or counsel accepts Apple's receipt.

### SUB-05 Medium: Free periods from offer codes are treated as paid on the phone (V)
- **Evidence:** `ScribeStoreModule.swift` reports `offerType` and `freePeriod`, but `plan.logic.ts:101-116` (`transactionOf`) drops both, and `isTrial` is true only for introductory offers. A code that gives free months shows "Plus renews on {date}" (not "free until"), gets no trial-end reminder, and a free period over 31 days gets no 17602(b)(1) notice. The status-report path handles it (`status-report.logic.ts:213`), but that is off in the first binary. Redeem is reachable in v1.0 (SUB-06).
- **Fix:** copy `offerType` and `freePeriod` in `transactionOf`; in `planFromSnapshot` set `state = 'trial'` when `best.tx.isTrial || best.tx.freePeriod`; add tests in `billing-plan.test.ts` and `billing-plan-reminders.test.ts` for an `offer_code` free period of 1 and 3 months. Or: do not create free-period offer codes until this lands (note it in the ASC doc, step 7).

### SUB-06 Medium: Offer codes ship in v1.0 while the roadmap says v1.0.1 (V)
- **State:** v1.0 supports them. `ScribeStoreModule.swift:89` calls `AppStore.presentOfferCodeRedeemSheet(in:)`; "Redeem a code" shows in Settings, Plan when Plus is off and the store is available (`plan.logic.ts` `redeem: !input.plusOn && available`; `settings/plus.tsx:226-243`) and on the Keep sheet (`plus-gate.tsx:167`). ROADMAP 121 and FUTURE.md 23 still list offer codes (G-16) for v1.0.1. The comment on the native side says it has not been run on a device (sandbox pass D-10 / S1). No `codeOffers` exist in the StoreKit file, so local Xcode testing cannot redeem anything.
- **Fix:** pick one. Keep it in v1.0 (recommended; it is small and Apple's own): update ROADMAP and FUTURE.md G-16 to "shipped in 1.0", run ASC D-10 on TestFlight before submission, add a `codeOffers` entry (free 1 month) to `EarlyLetters.storekit`, and fix SUB-05. Or hide it: gate both rows on a build flag until v1.0.1.
- **Promotional offers and win-back:** not supported and not planned. Promotional offers need a server signature with an In-App Purchase key, which D-053 rules out. Win-back offers (iOS 18) are recognised in reporting (`offerTypeName`) but none are configured (`winbackOffers: []`) and no doc plans them. CATALOG never-send rules forbid save offers in our emails; an Apple-configured win-back would need a decision record first.

### SUB-07 Low: Refund row stays after a refund or expiry and does nothing visible (V)
- **Evidence:** `settings/plus.tsx:104` `ownPurchase = ownership === 'purchased' && status !== 'none'` is true for `expired` and `revoked`; `requestRefund` answers `none` and the row returns null (`plus.tsx:251`).
- **Fix:** `const ownPurchase = plan.details.ownership === 'purchased' && subscriptionExists(plan.details.status);` (import from `components/settings/plan.logic`).

### SUB-08 Low: Manage row help text for Family Sharing members (V code, I Apple behaviour)
- **Evidence:** `subscriptionExists` shows Manage for a `familyShared` plan with the help "Change or cancel in Apple's subscriptions screen." A family member cannot cancel the organiser's plan.
- **Fix:** hide Manage when `details.ownership === 'familyShared'`, or show `p.shared` as its subtitle.

### SUB-09 Low: Plan names differ between the Plan screen and the confirmation (V)
- **Evidence:** Plan screen uses `HELD.monthly`/`HELD.annual` = "Monthly"/"Yearly" (`plan.logic.ts:35-39`); the confirmation and emails use "Plus Monthly"/"Plus Annual" (D-077). Held for counsel by design.
- **Fix:** the P6 switch named in `HELD` once counsel reads it; track it on the counsel list so it is not forgotten before submission.

### SUB-10 Low: Terms link and consent version point at different documents (V)
- **Evidence:** the store sheet links `brand.web.terms` (Terms of Service, `actions.ts` `storeSheetOptions`), while `config.ts:30-36` says it "links to" `subscription-terms.md` and the D-081 consent record names that version.
- **Fix:** either link `${origin}/subscription-terms` (add `brand.web.subscriptionTerms`; the emails fixture already uses that path) or change the comment and consent record to name the ToS version.

### SUB-11 Low: StoreKit test file gaps (V)
- **Evidence:** `EarlyLetters.storekit`: `_billingGracePeriodEnabled: false` (ASC uses 16 days), `codeOffers: []`, `eula: ""` with only the privacy URL, and no Expo config plugin attaches it to the scheme (manual steps in the ASC doc, step "To use it").
- **Fix:** set grace on, add one code offer, add the terms URL as a policy, and say in `apps/mobile/storekit/README` or the ASC doc that it must be re-attached after each `prebuild --clean` (already says so; keep).

### SUB-12 Low: Wrong decision id in comments (V)
- **Evidence:** `ScribeStoreModule.swift:82` and `actions.ts:121` cite "D-081: codes come from Apple"; that rule is D-082 (D-081 is purchase consent records).
- **Fix:** change both to D-082.

### SUB-13 Info: Stale email copy header (V)
- `packages/content/src/emails/billing.en.ts:3` cites Subscription Terms 1.3.0; current is 1.4.0. Update when SUB-01 bumps it.

## What works (V unless marked)
- StoreKit 2 listener from launch, verified transactions only, finished after delivery; currentEntitlements plus `SubscriptionInfo.status` for grace, retry, expiry and revocation.
- No transaction id or receipt crosses into JavaScript; the status report uses a salted SHA-256 `subRef` made in Swift.
- Apple's `SubscriptionStoreView` with Restore, policies and Close; no plan preselected; marketing lists only what v1.0 gates.
- Manage opens `AppStore.showManageSubscriptions`, falling back to Apple's web page; refund opens `Transaction.beginRefundRequest` for the person's own purchase only, falling back to reportaproblem.apple.com.
- Offline: last good snapshot cached; a payer is not locked out.
- Deployment target is iOS 17.0 (`app.config.ts:44`), so the `needs_ios_17` branch is unreachable in practice.
- Price display and localisation: Apple's sheet shows the storefront price; the app never types one. US storefront only (ASC 3.6).

## Subscription states

"Emails" is what goes out today. In the first store build: none from us (status report off, D-121; scheduler not built). With the status report on: the server stores the status, but still no email until WP-F14-16 is built. Apple sends its own receipts and renewal messages in every case (I).

| State | What StoreKit gives | What the app shows (Settings, Plan; Keep sheet) | Local reminders and notes | Our emails | Label |
|---|---|---|---|---|---|
| New (never subscribed) | no entitlement, no status | No status row; "See what Plus adds", Restore, Redeem a code. Third letter opens the Keep sheet (See Plus, Keep it here for now, Redeem a code) | none | none | V |
| Trial (own) | entitlement, `isTrial` | "Plus is on, free until {date}. Cancel by {date-24h} and you pay nothing." Plan name "Monthly"/"Yearly". Manage, Save a copy, Request a refund. Confirmation screen after buying in the sheet | trialLong (annual, 16-21 d) or trialWeek (monthly, 5-8 d), and trialFinal (4-5 d); no price | none (templates `trial-started`, `trial-ending-*` exist, unsent) | V |
| Active (own, renewing) | entitlement, willAutoRenew true | "Plus renews on {date}." Manage, Save a copy, Refund | annualLong (30-31 d) and annualShort (6-8 d) for annual; yearly note for both | none (`plus-started`, `annual-renewal-*`, `anniversary-reminder` unsent) | V |
| Cancelled, not expired | entitlement, willAutoRenew false | "Plus stays on until {date}. It will not renew." Manage still shown | none (reminders stop when renew is off) | none (`plus-cancelled` unsent) | V |
| Expired | status `expired` | No status row; "See what Plus adds"; Keep sheet uses `lapsedBody` ("Plus has ended..."). Refund row still shows (SUB-07) | none | none (`plus-ended` unsent) | V |
| Billing grace (16 days) | entitlement, `inGracePeriod`, grace end | "There is a problem with the payment for Plus... Plus stays on while Apple tries again." Plus stays on to grace end | none | none | V |
| Billing retry (after grace) | status `inBillingRetryPeriod`, no entitlement | "Apple could not take the payment for Plus, so Plus is paused." Manage shown; See Plus hidden; Keep gated | none | none | V |
| Refunded / revoked | status `revoked` or `revokedAt` | Plus off at once (listener re-reads). No status row; See Plus offered; Refund row still shows (SUB-07) | none | none | V code, I timing |
| Family-shared member | entitlement, ownership `familyShared` | "Plus is on." plus "Shared with you through Apple Family Sharing."; Manage shown (SUB-08); no Refund, no Save a copy, no Remind button | none (purchaser only) | none, ever (only `purchased` reports, D-080) | V code; device D-6 not run here |
| Restored on a new iPhone | entitlements arrive from Apple without a tap, or after Restore (`AppStore.sync`) | "Plus is on." under Restore; plan as for its state. No purchase confirmation (SUB-04). Free-letter count does not carry over unless the Keychain item does (I) | re-planned on that phone | none | V code, I Apple sync timing |
| Offer code redeemed | entitlement, `offerType` `offer_code`, maybe `freePeriod` | Plus on; a free code period shows as "renews on" (SUB-05); no confirmation (SUB-04) | renewal reminders only, not trial ones (SUB-05) | none | V |

## Offer codes: what is needed for v1.0
1. Decide v1.0 or v1.0.1 (SUB-06) and update ROADMAP and FUTURE.md.
2. Fix SUB-05 before creating any free-period code.
3. Create sandbox codes (ASC doc step 7) and run D-10 on TestFlight; add a `codeOffers` entry to the StoreKit file.
4. Show the acknowledgment after a redemption (SUB-04).
5. Apple's sheet API: the code uses `AppStore.presentOfferCodeRedeemSheet(in:)` (iOS 16+). Fine for the iOS 17 target; recheck deprecation when building with the next Xcode (I).
