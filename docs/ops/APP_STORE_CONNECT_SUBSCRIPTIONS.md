# App Store Connect: setting up Plus (founder click-path and device run sheet)

Owner: founder (Account Holder) for the clicks; stream S06 (payments) for this page. Rewritten 15 Oct 2026 for the alpha (D-106: a TestFlight build with server features on, against staging, Thu 29 Oct 2026) on the membership model (D-082, D-083, D-103) and the status report (D-080, D-081). Replaces the 3 Oct version, whose review notes still described the old Add a child and Read together gates and whose device checks reused the ids D-7 to D-10.

Time: about 75 minutes of clicking for steps 1 to 8, plus Apple's waiting times (the Paid Apps agreement, up to 1 hour for products and offers to reach the sandbox, up to 24 hours for a grace-period change). The device run sheet (step 11) is about 3 hours over two days.

**How to read the labels.** **V** means checked on a developer.apple.com page on 15 Oct 2026; the page is named in the step (all under App Store Connect Help unless marked StoreKit). **U** means not checked: this session cannot open appstoreconnect.apple.com itself, so a button label or a screen may differ. Where Apple's screen and this page disagree, follow Apple's screen and tell S06 so the page is fixed.

## What you are creating

The alpha builds use the bundle id `com.earlyletters.scribe.preview` and its own App Store Connect app record ("Early Letters Preview", `docs/release/TESTFLIGHT.md` step 2). Products live on an app record, so **create everything below on the `.preview` record**. The production record `com.earlyletters.scribe` gets the same setup later, when the store submission is re-planned (step 10).

| | Value | Must match |
|---|---|---|
| Subscription group | Reference name `Plus`, display name `Plus` | `APP_STORE_PLUS.group` in `packages/content/src/pricing.ts`; `apps/mobile/storekit/EarlyLetters.storekit` |
| Monthly | Product ID `plus.monthly`; reference name `Plus Monthly`; 1 month; US $4.99; free 1-month introductory offer; display name `Plus Monthly`; description `Keep adding letters, billed monthly` | `PLUS_PRODUCT_IDS` in `apps/mobile/src/lib/billing/config.ts`; `APP_STORE_PLUS.monthly`; the StoreKit file; D-082 |
| Annual | Product ID `plus.annual`; reference name `Plus Annual`; 1 year; US $49.99; free 2-month introductory offer; display name `Plus Annual`; description `Keep adding letters, billed yearly` | same; display names per D-077 |
| Level | Both on the same level, so switching is a crossgrade | Apple's level rules (step 3.8) |
| Family Sharing | On for both. It cannot be turned off later | D-080 (a co-parent gets Plus through Apple Family Sharing) |
| Billing Grace Period | 16 days, All Renewals, Production and Sandbox | D-048 |
| Availability | United States only | LEGAL-REQ-058; Subscription Terms |

`apps/mobile/test/billing-plan.test.ts` fails if the StoreKit file, the product ids, the prices, the trials or these names drift apart. Prices are never in the app: Apple's subscription view shows the storefront price and shows a free trial only to people who are eligible (D-083).

**What you do not create.** No App Store Server Notifications URL, no In-App Purchase key, no App Store Connect API key for purchases, no RevenueCat account (D-053). The only purchase-derived thing our server sees is the D-080 status report the app sends itself (plan, trial end, renewal date, cancelled flag, a salted reference and the environment), never a receipt, transaction id or price.

## Step 1. The Paid Apps agreement (Account Holder only)

1. Sign in at appstoreconnect.apple.com and select **Business** at the top of the page. **V** (Sign and update agreements)
2. On the **Agreements** tab, find the **Paid Apps** row and click **View and Agree to Terms**. Read and accept the terms, then click **Agree**. You may be asked for a two-factor code. You can download a copy. **V** (same page)
3. Under **Business**, add your bank account and tax information when App Store Connect asks for them. **U** for the exact screens; use your legal name exactly as on the developer account.

Apple: "To sell your apps on the App Store or offer In-App Purchases, the Account Holder must sign the Paid Apps Agreement", and it "must be active in order for you to submit or update paid apps and In-App Purchases". **V** (same page). Whether sandbox products load in TestFlight before the agreement is **Active** is **U** (Apple's page does not say; developers widely report that they do not). Do this step first.

## Step 2. The app record

`docs/release/TESTFLIGHT.md` step 2 creates the `.preview` record (S20's runbook). Nothing more is needed for Plus.

The App Store Small Business Program (15% commission) is not needed for TestFlight; enrol before the store launch (developer.apple.com/app-store/small-business-program). **U** for the current terms; the 3 Oct version of this page had them.

## Step 3. The subscription group and the two subscriptions

**3.1 The group.** In **Apps**, open **Early Letters Preview**. In the sidebar, under **Monetization**, click **Subscriptions**, then the add button (**+**). Enter the reference name `Plus` and click **Create**. **V** (Offer auto-renewable subscriptions). Make only this one group: people can hold one subscription per group at a time, which stops anyone paying twice by accident. **V** (Auto-renewable subscription information)

**3.2 The group's display name.** Click the group name. In **Display Name and Description**, click **Add**, choose **English (U.S.)**, enter the display name `Plus`, then click **Add**. **V** for the path (Offer auto-renewable subscriptions). Apple: group display names "must not contain control characters ... or markup language (for example, HTML tags, or Unicode characters, such as emoticons, diacritics, or special characters)". **V** (Auto-renewable subscription information). If the screen offers **App Name Display Options**, keep the app's own name. **U**

**3.3 The monthly subscription.** In the group, click **Create**. Enter reference name `Plus Monthly` and Product ID `plus.monthly`, then click **Create**. **V** (Offer auto-renewable subscriptions)

**3.4 The annual subscription.** In the group, click the add button (**+**). Enter reference name `Plus Annual` and Product ID `plus.annual`, then click **Create**. **V** (same page: **+** once the group has a subscription)

Product ID rules, **V** (In-App Purchase information): letters, numbers, hyphens, periods and underscores, up to 100 characters; "isn't editable after you save"; "can't be reused for another In-App Purchase within the same app, even if you delete the original". Type them exactly. Because the rule is per app, the production record later uses the same two ids.

For **each** of the two subscriptions, open it and do 3.5 to 3.10:

**3.5 Duration.** Under **Subscription Duration**, choose **1 month** (monthly) or **1 year** (annual) and click **Save**. **V** (Offer auto-renewable subscriptions). It cannot be changed after you submit for review. **V** (Auto-renewable subscription information)

**3.6 Availability.** In the **Availability** section, click **Set Up Availability**, select **United States** only, click **Done**. **V** (Set availability for an auto-renewable subscription). Do not set up **Monthly with 12-Month Commitment** (Apple's monthly billing for a yearly commitment, mentioned on the same page); Plus does not use it. If the screen shows **Available for Purchase From** with App Store, Apple Business and Apple School Manager, keep **App Store** only, and if it lets you turn off **Multiseat Purchases**, turn them off: Apple says "If you've enabled multiseat purchases for this subscription, only the group purchaser's access will include Family Sharing". **V** for both quotes (Auto-renewable subscription information; Turn on Family Sharing for In-App Purchases); **U** whether the screen lets you change them.

**3.7 Price.** Scroll to **Subscription Prices** and click **Add Subscription Price**. Choose **United States** and **US $4.99** (monthly) or **US $49.99** (annual); click **See Additional Prices** if it is not in the first list. Click **Next**, review the comparable prices App Store Connect proposes for the other storefronts (they are not sold, since availability is the US only), click **Next**, then **Confirm**. **V** (Manage pricing for auto-renewable subscriptions; the Offer page describes the same step as **Currency** and **Price** menus, so follow the screen). Apple offers "800 price points in each currency"; whether US $49.99 is one of them is **U** until you see it. If it is not, stop and tell the founder thread: do not pick a nearby price (D-082).

**3.8 Level.** Put both subscriptions on the **same level**. Apple: "You can stack subscriptions with equal content but different durations and other similar variables at the same level." **V** (Auto-renewable subscription information). Where the levels are edited (the group page) is **U**.

**3.9 Localization.** In **Display Name and Description**, click **Add**, choose **English (U.S.)**, enter the display name and description from the table above (copy them from `APP_STORE_PLUS` in `packages/content/src/pricing.ts`), click **Add**. **V** for the path (Offer auto-renewable subscriptions). Limits, **V** for In-App Purchases (In-App Purchase information): display name 2 to 30 characters, description at most 45. Ours are 11 to 12 and 34 to 35. The descriptions say only what v1.0 has: keep adding letters (Apple 3.1.2; the Subscription Terms must say the same).

**3.10 Family Sharing.** Scroll to **Family Sharing**, click **Turn On**, review the terms in the dialog, click **Confirm**. Required role: Account Holder or App Manager. "Once you turn on Family Sharing for an In-App Purchases in App Store Connect, you can't turn it off." **V** (Turn on Family Sharing for In-App Purchases)

**3.11 Review information** (needed for the store submission, not for TestFlight). Under **Review Information**, upload a screenshot of Apple's Plus sheet as the app shows it (take it during D-1 in step 11) and paste the review notes from step 9. The screenshot must meet one of the app's screenshot specifications; it can be updated but not removed; review notes may be up to 4000 characters. **V** (In-App Purchase information). Leave the tax category as suggested. **U**

## Step 4. Introductory offers (the free trials)

For each subscription: **V** (Set up introductory offers for auto-renewable subscriptions)
1. **Apps** > the app > sidebar **Subscriptions** > the `Plus` group > the subscription.
2. In **Subscription Prices**, click **View all Subscription pricing**, then **Set up Introductory Offer**.
3. Select **United States**, click **Next**.
4. Start date today, then the end date; click **Next**. Starting today begins the offer at once. **U** whether you may leave the end date open; if the screen needs one, pick the furthest date it allows and diary a check a month before it.
5. Offer type **Free**; duration **1 Month** for `plus.monthly`, **2 Months** for `plus.annual`. Click **Next**, review, click **Confirm**.

Apple's facts, **V** (same page): free-trial durations are 3 days, 1 or 2 weeks, 1, 2, 3 or 6 months, or 1 year, whatever the subscription's own length (so 1 and 2 months both exist); each person can use one introductory offer per subscription group, so trying monthly and then annual gives no second trial; an offer cannot be edited, only deleted and created again; changes can take up to 1 hour to reach the sandbox.

The app never says "free" itself: Apple's sheet shows the trial only to people who are eligible (D-083).

## Step 5. Billing Grace Period

**V** (Enable Billing Grace Period for auto-renewable subscriptions)
1. **Apps** > the app > sidebar **Subscriptions**. In the **Billing Grace Period** section, click **Set Up Billing Grace Period**.
2. Choose **16 days** (it applies to every subscription in the app; for monthly and yearly plans 16 means 16).
3. Renewal types: **All Renewals** ("including free introductory offers and free subscription offers transitioning to paid"). Plus costs us nothing to keep on while Apple retries a card, and a card problem should not be the moment a parent's new letter waits.
4. Environments: **Production and Sandbox Environment**.
5. Click **Confirm**. Changes "can take up to 24 hours to take effect and will only apply to upcoming renewals".

## Step 6. Sandbox testers and a test family

**6.1 Testers.** **V** (Create a Sandbox Apple Account). Required role: Account Holder, Admin, App Manager or Developer.
1. Select **Users and Access** at the top, then **Sandbox** in the top navigation, then the add button (**+**); the first time, **Create Test Accounts**.
2. First and last name; an email address that has never been an Apple Account and never bought anything (plus-addressing of one sandbox mailbox works, for example `you+asha1@yourmail.com`); a strong password; App Store country or region **United States**. Click **Create**.
3. You cannot edit the name, email or password afterwards; you can change the country or region.

Make four (names are only labels; use the fictional Asha family):

| Tester | For | Notes |
|---|---|---|
| `asha1` | D-1, D-2, D-3, D-4 | New, so eligible for the monthly trial |
| `asha2` | D-12, D-5, D-9, D-11 | The annual trial (bought in D-12), then the second iPhone |
| `asha3` | D-10 | Offer code; after its first purchase it is trial-ineligible (C cases) |
| `asha4` | D-6 | Family member who receives Plus |

**6.2 A Sandbox Test Family** (for D-6). **V** (Manage Sandbox Apple Account settings): **Users and Access** > **Sandbox** > **Family Sharing** > **+** (first time **Create Test Family**) > choose `asha1` as organizer > **Next** > choose `asha4` (members must share the organizer's country and belong to one test family) > in **Share Purchases**, allow sharing > **Create**.

**6.3 Renewal speed.** **V** (same page): by default a sandbox month lasts 5 minutes and a year 1 hour, and a subscription "automatically renew[s] up to 12 times before auto-renewal turns off on the thirteenth renewal attempt". To slow it down for D-2 and D-4: **Users and Access** > **Sandbox** > the tester > **Subscription Renewal Rate** > **Renewal every hour** (a month lasts an hour) > **Save**. The same page has **Interrupt Purchases for This Tester** and **Clear Purchase History** (cannot be undone), both used in step 11.

## Step 7. Sandbox offer codes (for D-10)

**V** (Set up subscription offer codes). Required role: Account Holder, Admin, App Manager or Marketing.
1. **Apps** > the app > **Subscriptions** > the group > `plus.monthly`.
2. In **Subscription Prices**, click the add button (**+**), then **Create Offer Codes**.
3. Reference name `alpha-sandbox`. Tick automatic renewal to the standard price (this limits the offer to **Free**). Eligibility **New subscribers**. **Next**; **United States**; **Next**; **Free**, duration **1 Month** (not more than 31 days, until counsel answers Q-C11); **Next**; **Confirm**. The offer cannot be edited afterwards.
4. On the offer, click **Create Sandbox Codes** and make **10** (the minimum; they last up to six months).

Apple: sandbox codes are redeemed "through your Sandbox Account settings on iOS 16.3 ... or later"; real one-time or custom codes can be redeemed only once "your app must be in the Ready for Sale state", so codes for friends wait for the store launch (BL-344). **V** (same page)

## Step 8. On the iPhone

**V** (StoreKit, Testing In-App Purchases with sandbox; App Store Connect Help, Testing subscriptions and In-App Purchases in TestFlight):
1. TestFlight apps "always run in the sandbox environment". Nothing you buy in TestFlight is charged to a card. **V** for the first sentence; **U** for the second as Apple words it (it follows from the sandbox).
2. To use a sandbox tester in a TestFlight build: **Settings** > your name > **Media & Purchases** > **Sign Out**; then **Settings** > **Developer** (shown once Developer Mode is on) > scroll down > **Sandbox Apple Account** > **Sign In**.
3. With your own Apple Account instead, TestFlight renews every subscription "daily, up to 6 times within a 1-week period, regardless of the subscription's duration", then turns auto-renew off. With a sandbox account the sandbox speeds in 6.3 apply. Billing retry can only be tested with a sandbox account.
4. A sandbox tester's settings on the phone: **Settings** > **Developer** > the sandbox account > **Manage** (renewal speed, interrupted purchases, clear purchase history).
5. A sandbox account tests only apps in your own developer account. **V**

## Step 9. Review notes (for the store submission, not the alpha)

Paste and adjust in each subscription's **Review Information** (F14 section 6.8, DR-08):

> Plus is an auto-renewable subscription sold only through Apple's subscription store view (StoreKit SubscriptionStoreView). Each account keeps its first 2 letters free. After that, adding each new letter to a child's book needs Plus. A family adds letters month after month as the child grows; that is the ongoing value. Reading, playing recordings, export, starting books for more children and Read together are free and never ask for Plus, and every letter already kept stays readable, playable and exportable if Plus ends. To see it: answer Yes to 18 or older, add a child, type two letters and save each, then type a third and tap Save. The Keep sheet opens; See Plus opens Apple's subscription view. Settings, Plan has Redeem a code, Restore purchases, Manage subscription and Request a refund, all Apple's sheets. No account with us is needed to subscribe; sign-in is needed only for sync, co-parent sharing and backup (demo account in the app's review notes). Family Sharing is on.

Apple's rule for that submission: "Your first auto-renewable subscription must be submitted with a new app version", together with its group, and you select **Add for Review** on the subscription's page. **V** (Offer auto-renewable subscriptions). TestFlight does not need this. Whether a subscription that was never submitted loads in a TestFlight build once its metadata is complete is **U**; developers report that it does (status **Ready to Submit**).

## Step 10. Later: the production record

When the store submission is re-planned (D-106), repeat steps 3 to 7 on the `com.earlyletters.scribe` record with the same ids, names, prices and offers (ids are unique within an app, **V** step 3.4), then step 3.11 and step 9. The sandbox testers and the test family are account-wide and are reused. **U** whether Apple keeps sandbox purchase history per app.

## Step 11. Device run sheet D-1 to D-12 (WP-F14-12, the founder's run)

Run these on a TestFlight build of the `preview` profile against staging. Sign each row with the date, the build number (TestFlight shows it) and pass or fail; put failures in the PR thread for S06, with a screenshot when there is something to see. Evidence goes in a new file of your own under `docs/qa/evidence/` (S19 owns the template; see `docs/prd/v2/08-delivery.md` section 4). Prepare: steps 1 and 3 to 8 done; one iPhone signed in with the right tester per row; a second iPhone for D-5 and D-6; for D-12, S06's migration applied to staging and the `subscription-status` function deployed there, and a build with `EXPO_PUBLIC_STATUS_REPORT=on` (see "Founder steps for D-12" below). Plan reminders on the phone are a courtesy here (G-15): note what you see, they are not a pass condition. Order: D-1, D-1b, D-2, D-3, D-4 with `asha1`; D-6 with `asha4`; D-12, then D-5, D-9 and D-11 with `asha2`; D-10 with `asha3`; D-7 and D-8 last, on a Free phone.

| ID | Check | Steps | Expected | Proves |
|---|---|---|---|---|
| D-1 | The Keep gate, with words | Fresh install, tester `asha1`. Add Asha. Type a letter and Save; type a second and Save; type a third and Save | After the second: "That was your second free letter." At the third: the Keep sheet (the letter is safe first, then See Plus, Leave it waiting, Redeem a code); no price and no "free trial" in our words. See Plus opens Apple's sheet: two plans as two buttons, neither selected, "1 month free" and "2 months free" shown by Apple, Restore, Terms, Privacy, Close. Close it, tap Leave it waiting: the letter is a draft on Tonight. Screenshot Apple's sheet for step 3.11 | PRD-REQ-024, -025, F14-REQ-001, -028 |
| D-1b | No words, no gate (M17) | Same phone. Record a letter with the speech model not downloaded (or in airplane mode before the model) and save the recording | It saves with no Keep sheet. **Needs** the S11 change in Review that calls `keepGateFor` (requested in PR); until then note what happens | F14-REQ-037, -038 |
| D-2 | Buy the monthly trial | From D-1's Keep sheet, See Plus, choose Plus Monthly, confirm with the sandbox password | Apple's sheet closes; the same Review shows again and you tap Save yourself; the purchase confirmation opens with Save a copy (try it: the share sheet offers Mail, Notes, Files); Settings, Plan: "Plus is on, free until {date}" with a cancel-by date | C-REQ-024 phone half, F14-REQ-002 |
| D-3 | Free paths never ask | On a Free phone with 2 letters: Read together 5 times; add a second child; Export everything | No Plus sheet, ever | F14-REQ-029, PRD-REQ-026 |
| D-4 | Manage and cancel | `asha1`: Settings, Plan, Manage subscription; cancel in Apple's sheet; come back | Apple's sheet opens in one tap; on return Plan says "Plus stays on until {date}. It will not renew." | LEGAL-REQ-048, F14-U27 |
| D-5 | Restore on a second iPhone | Second iPhone, same sandbox tester (`asha2` with an annual trial bought on the first phone). Fresh install, Settings, Plan, Restore purchases | "Plus is on." within 10 seconds, often with no tap at all | C-REQ-020 |
| D-6 | Family Sharing | Second iPhone signed in as `asha4` (in `asha1`'s test family, step 6.2), after `asha1` has bought Plus | Plus is on; Plan says "Shared with you through Apple Family Sharing."; no Request a refund row; in D-12's table, no row from this phone. **U** whether the sandbox shares a TestFlight purchase within a test family | F14-REQ-006 |
| D-7 | Reinstall keeps the count | Free phone with 2 letters kept. Delete the app, reinstall from TestFlight, add a letter with words and Save | The Keep sheet: the 2 free letters did not come back (Keychain count). Apple does not promise Keychain items survive deletion; record what happens | F14-U04, A1 |
| D-8 | Device backup restore | Optional for the alpha. Back up a Free phone with 2 letters, restore the backup to another phone, Save a third letter with words | Letters come back; the third Save shows the Keep sheet | F14-U05 |
| D-9 | Offline | (a) At D-1's Keep sheet, turn on airplane mode, tap See Plus. (b) With Plus on, airplane mode, force-quit, reopen, Save a letter | (a) "Plus needs the internet to start. Your letter stays safe on your phone until then."; nothing lost. (b) Plus still on; the letter saves | F14-U01, F14-U02, F14-REQ-005 |
| D-10 | Redeem a code | Tester `asha3`. Settings, Plan, Redeem a code; enter a sandbox code from step 7 | Apple's code sheet opens; after redeeming, Plus is on without a restart. Apple's `presentOfferCodeRedeemSheet(in:)` has not run on a device before this | PRD-REQ-027 |
| D-11 | Refund and lapse | `asha2` with Plus: Settings, Plan, Request a refund (Apple's sheet opens; cancel it). Then let a sandbox subscription end (cancel and wait one sandbox period, step 6.3) and Save a new letter with words | Refund sheet opens. After the end: every letter, recording and book is where it was and exports; the Keep sheet uses "Plus has ended. Every letter stays yours to read, play and export." | C-REQ-029, F14-REQ-016, PRD-REQ-026 |
| D-12 | Status report against staging | Build with `EXPO_PUBLIC_STATUS_REPORT=on`. (a) Signed out, buy the annual trial as `asha2`; check the table: no row. Sign in; within a minute check again. (b) Cancel in Manage subscription; reopen the app; check again. (c) On the D-6 family phone, sign in and open the app | (a) No row while signed out; after sign-in exactly 1 row in `subscription_status` (`environment = sandbox`, `plan = annual`, `cancelled = false`) and 1 row in `subscription_consents` (`product_id = plus.annual`, `offer_type = introductory`, `terms_version` like `1.4.0+xxxxxxxx`). (b) The same row, `cancelled = true`. (c) No new row. No email arrives for a sandbox purchase (the scheduler is not built yet; when it is, it sends for production only) | F14-REQ-032, -043, -006, LEGAL-REQ-049, F14-REQ-014 |

Also on the same build, not D rows: Apple's sheet and our Keep sheet at the largest Dynamic Type size (Settings, Accessibility, Display and Text Size, Larger Text, AX5) and with VoiceOver (title, body, waiting note, then buttons, in that order); and in dark mode the subscribe buttons are readable.

### Founder steps for D-12 (staging only, never production)

1. Merge order: #138 (S07 contract and function), #145 (S20 build flags), then this PR (S06); each is a founder merge.
2. Apply `supabase/migrations/20261016000000_subscription_status.sql` (renamed by the coordinator to the next free timestamp) to **staging** through `.github/workflows/deploy-db.yml` with the `approve-migration` label, after the earlier pending files, following its section in `supabase/APPLY.md` (sent to S02). Check in the staging SQL editor: `select public.consent_pepper_ready();` is true (an account with consent rows cannot be deleted without the pepper).
3. Deploy the function to staging: `npx supabase functions deploy subscription-status --use-api --project-ref <staging ref>`. No secrets are needed; `KILL_SWITCHES=statusReport` in its secrets stops it.
4. Ask S20 for a preview build with `EXPO_PUBLIC_STATUS_REPORT=on` (it is `off` in every profile today; a request in this PR). Build 1 (`testflight` profile) stays off.
5. To read the result, in the staging SQL editor: `select environment, plan, trial_end, renewal_date, cancelled, reported_at from subscription_status;` and `select product_id, offer_type, terms_version, shown_at from subscription_consents;`. There is no id or price to see, by design.
6. To stop it at once: set `statusReport` true in the signed remote config (`scripts/packs/publish.ts config --kill statusReport`) and `KILL_SWITCHES=statusReport` on the function.

## Step 12. Testing on a Mac without Apple's servers (the StoreKit file)

`apps/mobile/storekit/EarlyLetters.storekit` holds the same group, products, prices, free trials, names and Family Sharing setting (the test in step "What you are creating" keeps them equal). To use it:
1. `cd apps/mobile && npx expo run:ios` once (this generates the `ios/` folder; never edit it by hand).
2. Open `apps/mobile/ios/*.xcworkspace` in Xcode and drag `apps/mobile/storekit/EarlyLetters.storekit` into the project navigator (do not copy it).
3. **Product > Scheme > Edit Scheme > Run > Options > StoreKit Configuration**: choose `EarlyLetters.storekit`. Run.
4. **Debug > StoreKit > Manage Transactions** shows purchases; you can refund, expire, and turn on Ask to Buy, billing issues and grace in the StoreKit file's editor. Repeat steps 2 and 3 after `npx expo prebuild --clean`. **U** for the menu names in your Xcode version.

## Keeping things in sync

- Changing a price: App Store Connect, the StoreKit file and `PLUS_PRICE` in `packages/content/src/pricing.ts` in one pull request (the test checks the StoreKit file), and the Subscription Terms table. Price increases for existing subscribers use only Apple's consent flow (Terms 14.8, F14-REQ-021).
- Changing a name or description: `APP_STORE_PLUS` and the StoreKit file in one pull request, then App Store Connect.
- Adding a product: a new product ID in App Store Connect, then `PLUS_PRODUCT_IDS`, `APP_STORE_PLUS` and the StoreKit file in the same pull request.
- Changing any store sheet text in `billingCopy.store` or the Subscription Terms version changes the terms version the consent record names (`termsVersionOf`, F14-REQ-011); `SUBSCRIPTION_TERMS_DOC_VERSION` in `apps/mobile/src/lib/billing/config.ts` must equal the front matter of `docs/legal/subscription-terms.md` (a test checks).
