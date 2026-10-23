# Monetisation

Plus: what it gates, prices, how it is sold through Apple, purchase rules, renewal notices and consent records.

### ADR-0007 Payments: RevenueCat for digital; card payments for printed books via Lulu
- **Source:** `docs/adr/0007-payments-and-print.md` (Accepted, 2026-10-01; status note 3 Oct: digital half superseded by ADR 0013)
- **Decided:** RevenueCat for every digital purchase, modelled as entitlements; printed books paid by card or Apple Pay outside in-app purchase, submitted to the Lulu Print API by an Edge Function; no US external purchase links for digital goods in v1.
- **Why:** the founder should not maintain receipt validation; App Review 3.1.3(e) requires non-IAP payment for physical goods.
- **Alternatives:** expo-iap alone (we would build validation and entitlement sync); selling printed books through IAP (not allowed under 3.1.3(e)).
- **Door:** two-way: nothing was built on RevenueCat, and print is roadmap only
- **Reversal cost:** low: the digital half is already replaced; the print half is unbuilt
- **Revisit when:** market: print becomes a launch (D-010); platform: Android billing needs a decision (D-001 keeps RevenueCat as the likely Android-time option)
- **Review by:** on trigger
- **Status:** amended by ADR-0013
- **As built:** not built (no RevenueCat, no print path)

### ADR-0013 Plus through Apple only, checked on the device
- **Source:** `docs/adr/0013-apple-native-subscriptions.md` (Accepted, decided by the founder, brief decision 3, 2026-10-03)
- **Decided:** Plus is two auto-renewable subscriptions in one App Store group, sold through Apple's own `SubscriptionStoreView` from a local Expo module. The entitlement is `Transaction.currentEntitlements` on the phone; restore, manage and refund are Apple's sheets. No server sees a purchase, and the server never refuses a book for Plus. Family Sharing is on for both products. Product ids `plus.monthly` and `plus.annual` carry no price.
- **Why:** Apple renders the paywall and its disclosures, so guideline 3.1.2 rests on Apple's component; no third-party code; every API checked in Apple's documentation.
- **Alternatives:** `expo-iap` 5.8.2 (no SubscriptionStoreView); `react-native-iap` 16.7.2 (same); `@expo/ui` SwiftUI (no StoreKit views); RevenueCat (excluded by the decision).
- **Door:** one-way after launch: becomes one-way once the products and Family Sharing setting are created in App Store Connect (not yet; FT-01 enrolment is pending and `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` is a to-do). Apple does not allow Family Sharing to be turned off once enabled, and product ids are permanent once created (ADR 0013 decision items 4 and 5)
- **Reversal cost:** low today; high once created: then changing the product ids or Family Sharing means new products and moving live subscribers
- **Revisit when:** platform: a Plus feature with a server cost ships (backup upload), needing server proof of Plus; law: counsel decides auto-renewal notices or the consent record must come from us; platform: Android ships (all three from the ADR's "Revisit when")
- **Review by:** on trigger
- **Status:** amended by D-080; D-082 changes the prices and what Plus gates
- **As built:** `apps/mobile/modules/scribe-store/ios/ScribeStoreModule.swift`, `apps/mobile/src/lib/billing/config.ts`, `apps/mobile/storekit/EarlyLetters.storekit`

### D-001 Plus ships in v1.0, sold and managed only through the App Store
- **Source:** `docs/DECISIONS.md` D-001 (Decided, founder, 2026-10-03; tooling recommended in ADR 0013)
- **Decided:** auto-renewable subscriptions in one App Store group, sold, managed, cancelled and refunded only through Apple, with App Store Server Notifications V2 to an Edge Function for verification. Prices at the time: $3.99 a month with a 1-month free trial; $29.99 a year with a 2-month free trial.
- **Why:** the founder's direction ("via Apple subscription management to keep it Apple focused"); one fewer processor, DPA, SDK and console; $0 vendor cost; every cancel and refund path is Apple's own screen.
- **Alternatives:** ship 1.0 free and add Plus in 1.1 (rejected by the founder); annual only with no trial (kept as a schedule cut); RevenueCat (kept as fallback and likely Android option).
- **Door:** one-way after launch: once subscribers exist in Apple billing, moving them to another processor needs every one of them to resubscribe
- **Reversal cost:** high: after launch, a processor change means new products, user communication and lost subscribers
- **Revisit when:** platform: Android ships and needs Google Play Billing
- **Review by:** on trigger
- **Status:** amended by D-053; D-082 replaces the prices
- **As built:** `apps/mobile/src/lib/billing/config.ts`

### D-009 Read together: 3 free sessions per Free book, then Plus
- **Source:** `docs/DECISIONS.md` "Earlier founder decisions carried forward" D-009 (Decided, founder, 2026-10-01/02); PRD-REQ-020
- **Decided:** Read together gives 3 free sessions per Free book, then needs Plus; the number is remote config.
- **Why:** not recorded in the source
- **Door:** two-way: replaced before launch
- **Reversal cost:** low: no subscriber depends on it
- **Revisit when:** none expected: superseded
- **Review by:** on trigger
- **Status:** superseded by D-082
- **As built:** not built as a gate; D-083 makes Read together free for letters that exist

### D-012 Plus prices, trials, lifetime later, Plus per account
- **Source:** `docs/DECISIONS.md` "Earlier founder decisions carried forward" D-012 (Decided, founder, 2026-10-01/02); PRD K-28, C-REQ-021
- **Decided:** Plus $3.99 a month (1-month trial) or $29.99 a year (2-month trial); lifetime about $99.99 later; Plus per account, with books inheriting it from any parent.
- **Why:** not recorded in the source
- **Door:** one-way after launch: prices for existing subscribers are hard to change once they subscribe
- **Reversal cost:** low today: replaced before launch
- **Revisit when:** none expected: superseded
- **Review by:** on trigger
- **Status:** superseded by D-082
- **As built:** not built at these prices; `packages/content/src/pricing.ts` holds the D-082 prices
- **Also:** D-080 amends the co-parent coverage part (Plus reaches a co-parent only through Apple Family Sharing)

### D-022 Auto-renewal notice windows: strictest-state table
- **Source:** `docs/DECISIONS.md` D-022 (Recommended, counsel confirms the table, proceed: yes, 2026-10-03)
- **Decided:** the server sends acknowledgment, trial, annual renewal, anniversary and price-increase notices inside fixed hard windows (table in the source); a missed window pages the founder instead of sending late; a cancelled renewal skips pending notices.
- **Why:** the only schedule inside the California, New York, Virginia, Utah and Massachusetts windows at once (Lawyer 1 H1); it keeps the Terms' "16 to 21 days" promise.
- **Alternatives:** K-04 as written (breaks Virginia and the Terms promise).
- **Door:** one-way after launch: the windows are promised in the Terms and Subscription Terms once published
- **Reversal cost:** medium: the windows are data (one row per counsel change), but changing a published promise needs new legal text
- **Revisit when:** law: counsel changes any window or a state changes its auto-renewal law
- **Review by:** 2026-12-01
- **Status:** amended by D-080. Code shipped ahead of the log: merged PR #121 ships on-device plan reminders and a purchase confirmation under D-094 (Decided, delegated by founder, 15 Oct).
- **As built:** not built: no server sees purchases in v1.0; on-device plan reminders exist in `apps/mobile/src/lib/billing/plan-reminders.ts` (PR #121, under D-094)
- **Also:** D-053 says these windows no longer apply to a server we do not have (DEBATES Q-003); D-080 gives the server a data source again

### D-036 Purchase rules: account first, contributors never offered, no double offers
- **Source:** `docs/DECISIONS.md` D-036 (Recommended, proceed: yes, 2026-10-03)
- **Decided:** a purchase requires a signed-in account; contributors never see the Plus sheet; nobody is offered Plus in a book already covered by the other parent.
- **Why:** Plus is account-scoped (K-28); auto-renewal notices need an email; a contributor's Plus would cover no book.
- **Door:** two-way: purchase-flow rules are code
- **Reversal cost:** low: code only
- **Revisit when:** none expected: replaced by Apple-only Plus
- **Review by:** on trigger
- **Status:** superseded by ADR-0013
- **As built:** not built: ADR 0013 sets `signedIn` always true (Plus belongs to the Apple Account) and `coveredByOtherParent` always false

### D-037 Read together counter on the device in v1.0
- **Source:** `docs/DECISIONS.md` D-037 (Recommended, proceed: yes, 2026-10-03)
- **Decided:** count free Read together sessions per book on the device, only when highlighted playback starts in try mode; a reinstall resets it; a server counter in v1.1.
- **Why:** TDD 08 2.4 versus TDD 01 OQ-12; the local count is enough for a no-cost feature at launch.
- **Door:** two-way: replaced before launch
- **Reversal cost:** low: nothing depends on it
- **Revisit when:** none expected: superseded
- **Review by:** on trigger
- **Status:** superseded by D-083
- **As built:** not built: D-083 makes Read together free for letters that exist

### D-047 Restore never moves an active plan between accounts
- **Source:** `docs/DECISIONS.md` D-047 (Recommended, proceed: yes, 2026-10-03)
- **Decided:** if an App Store `originalTransactionId` is already bound to another account with an active plan, restore does not move it; otherwise restore binds it to the current account.
- **Why:** a shared family iPad would otherwise move Plus between parents' accounts silently (TDD 08 4.8, F-14).
- **Door:** two-way: replaced before anything was built
- **Reversal cost:** low: nothing built
- **Revisit when:** none expected: replaced by on-device entitlements
- **Review by:** on trigger
- **Status:** superseded by ADR-0013
- **As built:** not built: ADR 0013 has no server binding; Plus belongs to the Apple Account on the phone

### D-048 Apple Billing Grace Period on, 16 days
- **Source:** `docs/DECISIONS.md` D-048 (Recommended, proceed: yes, 2026-10-03; Apple's available lengths unverified, TDD 08 4.6)
- **Decided:** turn on Billing Grace Period in App Store Connect, 16 days if offered.
- **Why:** not recorded in the source
- **Door:** one-way after launch: once subscribers are in a grace period, changing it affects live billing; whether Apple lets the setting be switched off again was not verified in the sources
- **Reversal cost:** low: an App Store Connect setting, if Apple allows the change
- **Revisit when:** platform: Apple's offered grace lengths differ from 16 days
- **Review by:** 2026-11-15
- **Status:** in force
- **As built:** a founder setting in App Store Connect, described in `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md`; not yet confirmed as set

### D-049 Purchase consent records: one completed row per original transaction
- **Source:** `docs/DECISIONS.md` D-049 (Recommended, counsel confirms, proceed: yes, 2026-10-03)
- **Decided:** a `started` row at purchase start and exactly one `completed` row per original transaction, reconciled from the App Store notification.
- **Why:** not recorded in the source beyond TDD 08 4.2 and C-4
- **Door:** two-way: replaced before it was built
- **Reversal cost:** low: nothing built
- **Revisit when:** none expected: superseded
- **Review by:** on trigger
- **Status:** superseded by D-081
- **As built:** not built

### D-053 Payments: Apple only, on device; Family Sharing on
- **Source:** `docs/DECISIONS.md` D-053 (Decided, founder, 2026-10-03; supersedes D-001's server half)
- **Decided:** StoreKit 2 with Apple's subscription screen, restore and manage sheets and `currentEntitlements`; no server sees purchases; Family Sharing on; $3.99 a month with 1 month free, $29.99 a year with 2 months free. Plus gated Read together after 3 free sessions per book, and books for more children. Server entitlement tables removed (migration 20261004000000); server code never enforces Plus.
- **Why:** not recorded in the source beyond the founder brief (decision 3: "Apple only, out of the box")
- **Door:** one-way after launch: becomes one-way once the products and Family Sharing setting are created in App Store Connect (not yet; FT-01 enrolment is pending). Family Sharing cannot be turned off once enabled on a subscription (ADR 0013 decision item 4)
- **Reversal cost:** low today; high once created: Family Sharing is then permanent, and prices and gates for existing subscribers are hard to change
- **Revisit when:** platform: a Plus feature with server cost ships; law: counsel requires server-side notices or consent records
- **Review by:** on trigger
- **Status:** amended by D-082; D-080 amends "no server sees purchases"
- **As built:** `supabase/migrations/20261004000000_plus_on_device_only.sql`, `apps/mobile/modules/scribe-store/ios/ScribeStoreModule.swift`, `apps/mobile/src/lib/billing/gates.ts`
- **Also:** BRIEF-20261003-3

### D-077 Plan display names: Plus Monthly and Plus Annual
- **Source:** `docs/DECISIONS.md` D-077 (Recommended, coordinator default, proceed: yes, 2026-10-03; answers CONSISTENCY_AUDIT F-5)
- **Decided:** App Store Connect display names are exactly "Plus Monthly" and "Plus Annual", matching the subscription terms; copy says "Plus".
- **Why:** not recorded in the source beyond CA-030
- **Door:** two-way: display names can be edited in App Store Connect (unlike product ids)
- **Reversal cost:** low: an App Store Connect edit and a copy change
- **Revisit when:** none expected
- **Review by:** on trigger
- **Status:** in force
- **As built:** `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md`, `packages/content/src/features/billing.en.ts`

### D-080 The app reports subscription status only, so we can send the auto-renewal reminders
- **Source:** `docs/DECISIONS.md` D-080 (Decided, founder, 2026-10-03 19:30 UTC; amends D-001, D-022, D-049, D-012)
- **Decided:** the app reports only plan, trial end, renewal date and a cancelled flag to our server, on purchase and on each launch, read from StoreKit 2; never payment data or receipts. Purpose: the reminder emails California Bus. and Prof. Code 17602 requires and Terms 14.6 promises. A co-parent gets Plus only through Apple Family Sharing. The status is deleted with the account.
- **Why:** without any server signal the D-022 emails had no trigger, and the Terms promised reminders the system could not send (LGL-01). Status only is the smallest data flow that keeps that promise.
- **Alternatives:** in-app local notifications only (counsel unsure it meets 17602); App Store Server Notifications and RevenueCat (rejected by brief decision 3).
- **Door:** one-way after launch: a published data flow in the Privacy Policy, and families' reminder emails depend on it
- **Reversal cost:** medium: removing it needs Privacy Policy and Terms changes and another way to meet 17602
- **Revisit when:** law: counsel confirms Apple's own emails or local notifications meet 17602 (COUNSEL_PACKET); platform: v1.1 server release starts
- **Review by:** on trigger
- **Status:** in force: D-100 (founder, merged 16 Oct) ships the status report in v1.0; until then merged PR #121 ships on-device plan reminders under D-094
- **As built:** not built on `develop`; on-device reminders in `apps/mobile/src/lib/billing/plan-reminders.ts` stand in (PR #121)

### D-081 Purchase consent records (supersedes D-049)
- **Source:** `docs/DECISIONS.md` D-081 (Recommended, counsel confirms, proceed: yes, 2026-10-03)
- **Decided:** the first D-080 status report after a purchase also carries the consent facts: product, offer type, Subscription Terms version shown and the time. One record per original purchase, kept for the life of the account plus 3 years, pseudonymised at deletion. No receipt, payment data or transaction id in clear.
- **Why:** D-049 relied on App Store notifications, which D-053 removes; Cal. Bus. and Prof. Code 17602(a)(6) still asks for proof of consent (legal review LGL-04).
- **Door:** one-way after launch: consent records kept for the life of the account plus 3 years are a legal record once collected
- **Reversal cost:** medium: changing retention of collected consent records needs counsel and a Privacy Policy change
- **Revisit when:** law: counsel answers the 17602(a)(6) proof-of-consent question
- **Review by:** on trigger
- **Status:** parked: depends on D-080, which needs a server
- **As built:** not built

### D-082 Plus membership: first 2 letters free, then Plus
- **Source:** `docs/DECISIONS.md` D-082 (Decided, founder, 2026-10-04); PR #96, PR #133
- **Decided:** Plus is a membership. The first 2 letters per account are free; after that, adding letters needs Plus. Existing letters always stay readable, playable and exportable. One membership covers the book. $4.99 a month with a 1 month free trial, or $49.99 a year with a 2 month free trial. Apple in-app purchase only; offer codes from Apple; Family Sharing on.
- **Why:** not recorded in the source; the source gives the arithmetic (the yearly plan is about ten months' price for twelve months).
- **Door:** one-way after launch: prices and the free allowance for existing subscribers are hard to change once people subscribe (an increase needs Apple's consent flow)
- **Reversal cost:** medium: before launch, a price is an App Store Connect edit; after launch, existing subscribers keep their terms or must consent
- **Revisit when:** customer: C1 beta results on the 2-letter gate; no conversion threshold is set in any source, and the founder or the decision-science agent should set one before C1 starts; law: counsel answers on trial and renewal wording (D-083)
- **Review by:** 2027-01-15
- **Status:** in force
- **As built:** `packages/content/src/pricing.ts`, `apps/mobile/src/lib/billing/letter-ledger.ts`, `apps/mobile/src/lib/billing/gates.ts`

### D-083 Open edges of the membership model
- **Source:** `docs/DECISIONS.md` D-083 (Decided, delegated by the founder to the CTO, 2026-10-04; debate Q-013); PR #96
- **Decided:** a letter counts when it is kept (spoken or typed, Book or private, including a voice letter kept without words); drafts, quiet-day marks, edits and restores do not; a deleted letter still counts. One pool of 2 free letters across all books. Read together is free for letters that exist. Erase everything resets the count. The count is held on the device (Keychain, mirrored in the database) so a reinstall does not reset it. Monthly and annual are shown equally, neither preselected; US storefront only; no price, "free trial" or "we will email you" in app copy.
- **Why:** not recorded in the source beyond debate Q-013
- **Door:** one-way after launch: the count lives in each family's Keychain, so changing what counts later needs a migration on their devices
- **Reversal cost:** medium: code plus a device-side ledger migration; counsel must confirm the Keychain count
- **Revisit when:** law: counsel answers on the Keychain count and trial wording; platform: App Review raises guideline 3.1.2(a)
- **Review by:** on trigger
- **Status:** amended by D-103: a voice letter kept without words no longer counts at once, and only your own letters count
- **As built:** `apps/mobile/src/lib/billing/letter-ledger.native.ts`, `apps/mobile/src/lib/db/repos/ledger.ts`

### D-094 Plan reminders and the purchase confirmation ship in v1.0, as a courtesy
- **Source:** `docs/DECISIONS.md` D-094 (Decided, delegated by founder, 2026-10-15; needs counsel: COUNSEL_PACKET C-1 to C-3 and Q37); PR #122 (merged 15 Oct 2026); PR #121 (merged 15 Oct 2026)
- **Decided:** v1.0 ships on-device plan reminders (local notifications in the Q-003 windows, on the purchaser's phones only, never through Family Sharing) and, after a new purchase, a confirmation of what was agreed with "Save a copy". They follow D-083: no price, "free trial", "free months" or "we will email you" in app copy. Reminders are a courtesy, not a guaranteed delivery: the app and the Subscription Terms say they can come late or not at all, and that Settings, Plan and Apple's receipts hold every date.
- **Why:** not recorded in the source
- **Door:** one-way after launch: once the Subscription Terms describe the reminders and families receive them, removing them changes a published promise
- **Reversal cost:** medium: code plus a Subscription Terms change and counsel review
- **Revisit when:** law: counsel answers COUNSEL_PACKET C-1 to C-3 and Q37; platform: a server release brings back the D-080 reminder emails
- **Review by:** on trigger
- **Status:** in force: needs counsel; the Subscription Terms wording is requested on open PR #81, whose 3.0.0 text does not yet call reminders a courtesy (per the source); device test row S2-17 is in `docs/qa/DEVICE_TEST_PLAN.md` (PR #123, merged 16 Oct 2026)
- **As built:** `apps/mobile/src/lib/billing/plan-reminders.ts`, `apps/mobile/src/app/plus/confirmed.tsx`
- **Also:** stands in for the D-080 server reminder emails while v1.0 has no server

### D-103 Counting the free letters
- **Source:** `docs/DECISIONS.md` D-103 (Decided, founder, 2026-10-13, PRD V2 M17); PR #128 (merged 16 Oct 2026)
- **Decided:** a letter counts toward the 2 free letters (D-082) only when you are its author, its words exist, and you keep it from Review with the words on screen. The other parent's synced letters never count. A voice-only letter saved before its speech model arrives is kept safely and counts only once its words exist and you keep it from Review. The ledger still never decreases, and Erase everything still resets it.
- **Why:** not recorded in the source
- **Door:** one-way after launch: the count is a rule paying families rely on, and the ledger never decreases
- **Reversal cost:** medium after launch: a ledger change and user communication; low before launch
- **Revisit when:** customer: families report a letter counted that they did not expect; platform: App Review questions the free-letter count
- **Review by:** on trigger
- **Status:** in force: D-109 (F8) adds that a typed letter meets condition (c) when kept on Write with the words on screen
- **As built:** `apps/mobile/src/lib/billing/letter-ledger.ts`
- **Also:** amends D-083
