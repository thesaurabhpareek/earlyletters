# App Store Connect: setting up Plus (founder steps)

Owner: founder (Account Holder). Written 3 Oct 2026 for ADR 0013 (Plus through Apple only, checked on the device, no server).
Time: about 1 hour of clicking, plus Apple's waiting times (bank and tax checks, Small Business Program approval, review).

Labels: **V** checked in Apple's help pages on 3 Oct 2026. **U** not checked; the screen may word it differently. Where Apple's screen and this page disagree, follow Apple's screen and tell the payments engineer so this page is fixed.

## What you are creating

| | Value | Where it must match |
|---|---|---|
| Subscription group | Reference name `Plus`, display name `Plus` | `storekit/EarlyLetters.storekit` |
| Monthly product | Product ID `plus.monthly`, 1 month, US $3.99, free 1-month introductory offer | `apps/mobile/src/lib/billing/config.ts`, the StoreKit file, Subscription Terms |
| Annual product | Product ID `plus.annual`, 1 year, US $29.99, free 2-month introductory offer | same |
| Family Sharing | On for both (cannot be turned off later) | ADR 0013 |
| Billing Grace Period | 16 days, all renewals, production and sandbox | TDD 08 OQ-7 |
| Availability | United States only at launch (LEGAL-REQ-058) | Subscription Terms "Plus is offered in the United States" |

Type the product IDs exactly. A product ID can never be used again once created, even if you delete the product. Prices are never in the app's code: Apple's store view shows the storefront's own price.

What you do **not** create (decision 3): no App Store Server Notifications URL, no In-App Purchase key, no App Store Connect API key for purchases, no RevenueCat account. Nothing of ours receives purchase data.

## Step 1. Paid Apps agreement, tax and banking (Account Holder only)

Products cannot be sold, and in practice do not load in the sandbox either (**U**, widely reported), until this agreement is active.

1. Sign in at appstoreconnect.apple.com and select **Business** at the top of the page. (**V**)
2. On the **Agreements** tab, find the **Paid Apps** row and click **View and Agree to Terms**. Enter the two-factor code if asked, read, and click **Agree**. (**V**) Download a copy for your records.
3. Still under **Business**, add your **bank account** and **tax information**. Apple's guides: "Enter banking information" and "Provide tax information" in App Store Connect Help. As a US individual you complete the US tax form App Store Connect presents (Form W-9 for US persons, **U** for the exact screen). Use your legal name exactly as on the Apple Developer account.
4. Wait until the Paid Apps agreement shows **Active**. Bank and tax checks can take a day or more.

## Step 2. App Store Small Business Program (15% instead of 30%)

1. Open developer.apple.com/app-store/small-business-program and click **Enroll** (developer.apple.com/app-store/small-business-program/enroll). (**V**)
2. Prerequisites: you are the Account Holder and the latest Paid Apps agreement is accepted (step 1). List any associated developer accounts (accounts you own or control); for a single individual account there are none. (**V**)
3. Eligibility: up to US $1 million in proceeds in the prior calendar year; new developers qualify; individuals can enroll. (**V**)
4. The 15% rate starts 15 days after the end of Apple's fiscal month in which you are approved, so enroll well before launch. (**V**)

## Step 3. The subscription group

1. In **Apps**, open the app (bundle ID `com.earlyletters.scribe`).
2. In the sidebar, under **Monetization**, click **Subscriptions**, then the add button **(+)**. (**V**)
3. Reference name: `Plus`. Click **Create**. (**V**) Create only this one group: people can hold one subscription per group, which stops anyone paying twice by accident.
4. In the group, add a **localization** for English (U.S.): display name `Plus`. This is the name people see in their Apple subscriptions list. Do not use HTML, emoji or special characters. (**V** for the rule; **U** for the exact button label)

## Step 4. The two subscriptions

In the `Plus` group, click **Create** (or **+**). For each product: (**V** for the fields)

| Field | Monthly | Annual |
|---|---|---|
| Reference name | `Plus Monthly` | `Plus Annual` |
| Product ID | `plus.monthly` | `plus.annual` |
| Subscription Duration | 1 month | 1 year |
| Subscription Prices | United States, US $3.99 | United States, US $29.99 |
| Availability | United States only | United States only |
| Localization (English U.S.): display name | `Plus Monthly` | `Plus Yearly` |
| Localization: description | `Keep adding letters, billed monthly` | `Keep adding letters, billed yearly` |

Then:
1. Set both subscriptions to the **same level** in the group, so switching between monthly and yearly is a crossgrade, not an upgrade. (**U**: App Store Connect shows levels on the group page; drag or edit so both are level 1.)
2. Leave the **tax category** as App Store Connect suggests unless your accountant says otherwise. (**V** that it is optional)
3. Click **Save** on each. (**V**)

The descriptions say only what v1.0 has. Do not mention backup or themes until they ship (Apple 3.1.2; the store view and Subscription Terms must match).

## Step 5. Introductory offers (free trials)

For each subscription: (**V**)
1. Open the subscription. Under **Subscription Prices**, click **View all Subscription pricing**, then **Set up Introductory Offer**.
2. Countries or regions: **United States**. Click **Next**.
3. Start date: today. End date: none (leave it open). Click **Next**.
4. Type: **Free**. Duration: **1 Month** for `plus.monthly`, **2 Months** for `plus.annual`. Click **Next**, review, **Confirm**.

Rules worth knowing: each person can have one introductory offer per subscription group, ever, so trying monthly and then yearly does not give a second trial. An offer cannot be edited, only deleted and created again. Changes can take up to an hour to reach the sandbox. (**V**)

The app never says "free" itself: Apple's store view shows the trial only to people who are eligible.

## Step 6. Family Sharing (co-parents get Plus)

For each subscription: (**V**)
1. Open the subscription and scroll to **Family Sharing**.
2. Click **Turn On**, read Apple's terms in the dialog, click **Confirm**.

This cannot be turned off later. It is how a co-parent in the same Apple family gets Plus with no server of ours involved.

## Step 7. Billing Grace Period (Plus stays on while Apple retries a failed payment)

1. In the app's sidebar, click **Subscriptions**. In the **Billing Grace Period** section, click **Set Up Billing Grace Period**. (**V**)
2. Choose **16 days**. (**V** options: 3, 16 or 28 days)
3. Renewal types: **All Renewals** (includes a free trial turning paid). Recommended because Plus costs us nothing to keep on for a few days, and a card problem should not be the moment a parent loses Read together. Choose **Only Paid to Paid Renewals** if you prefer. (**V** for the options)
4. Environments: **Production and Sandbox**. Click **Confirm**. (**V**)

## Step 8. Review information and the screenshot

For each subscription, under **Review Information**: (**V** for the section)
1. **Screenshot**: a screenshot of the Plus store sheet as it appears in the app (take it from a TestFlight build signed in with a sandbox account, or from a local build using the StoreKit file, step 10). The upload control states the size it accepts (**U** for the exact size).
2. **Review notes** (paste and adjust):

> Plus is sold only through Apple's own subscription store view (StoreKit SubscriptionStoreView). To see it: answer Yes to the 18 or older question, create a book, then go to Settings, Children, Add a child (the first book is free; another book is part of Plus), or open Read together in a book more than 3 times. Settings, Plan has Restore purchases, Manage subscription and Request a refund, all Apple's sheets. Writing, reading, playing recordings and export are free and never ask for Plus. No account with us is needed to subscribe. Family Sharing is on.

The first subscription must be submitted together with a new app version, and a new subscription group with at least one of its subscriptions. When you submit the app version, include both subscriptions in the submission (App Store Connect asks you to pick the platform and version for in-app purchases that need one). (**V**)

## Step 9. Sandbox testers

1. Select **Users and Access** at the top, then **Sandbox** in the top navigation, then **(+)** (the first time: **Create Test Accounts**). (**V**)
2. First and last name, an email address that has never been an Apple Account and never bought anything (plus-addressing works, for example `you+plus1@yourmail.com`), a strong password, App Store country **United States**. Click **Create**. You cannot edit the name, email or password later. (**V**)
3. Make two or three: one for a first-time trial, one to test "no trial" (it already used one), one for Family Sharing tests.
4. On the iPhone: sign in with the sandbox account through the **Sandbox** option in Settings (not your main Apple Account), and turn on Developer Mode for development builds. (**V**) TestFlight builds also purchase in the sandbox (**U** whether TestFlight uses your own Apple Account or the sandbox one on your iOS version; follow Apple's sheet).

Bundle IDs: development and preview builds use `com.earlyletters.scribe.dev` and `.preview` (app.config.ts), which have no products in App Store Connect. Test those with the StoreKit file (step 10). Test real sandbox purchases on TestFlight builds of the production profile, which use `com.earlyletters.scribe`.

## Step 10. Testing on your Mac without Apple's servers (StoreKit file)

`apps/mobile/storekit/EarlyLetters.storekit` holds the same group, products, prices, free trials and Family Sharing setting. To use it:
1. `cd apps/mobile && npx expo run:ios` once (this generates the `ios/` folder; never edit it by hand, it is regenerated).
2. Open `apps/mobile/ios/*.xcworkspace` in Xcode. Drag `apps/mobile/storekit/EarlyLetters.storekit` into the project navigator (do not copy it).
3. **Product > Scheme > Edit Scheme > Run > Options > StoreKit Configuration**: choose `EarlyLetters.storekit`. Run.
4. In Xcode, **Debug > StoreKit > Manage Transactions** shows purchases; you can refund, expire, and turn on Ask to Buy, billing issues and grace in the StoreKit file's editor. Repeat steps 2 and 3 after `npx expo prebuild --clean`.

## Step 11. Device checks before the first submission

Sign the list with the date and build number. Record failures in the payments report.

| # | Check | Expected |
|---|---|---|
| D-1 | Free account with two letters kept, write a third and press Keep | The Keep sheet ("Keep adding to ...'s book", the letter is safe), then "See Plus" opens Apple's sheet: two plans as two buttons, neither selected; "1 month free" or "2 months free" shown for a new sandbox account; Restore, Terms, Privacy and Close visible. The letter is still a draft on Tonight until kept |
| D-2 | Buy the monthly trial | Sheet closes, the same Review shows again (the person taps Keep; it is not kept for them); Settings, Plan says "Plus is on, free until ..." with a cancel-by date |
| D-3 | Read together 5 times on a Free phone with 3 letters | Opens every time, no gate (no session limit, D-082). Starting a second book is free too |
| D-4 | Settings, Plan, Manage subscription | Apple's sheet opens in one tap; cancel there; Plan says "It will not renew" |
| D-5 | Second iPhone, same Apple Account, Restore purchases | "Plus is on." within 10 seconds |
| D-7 | Delete the app and reinstall on the same phone (Free, two letters kept before) | The two free letters do not come back: the third Keep still asks for Plus (Keychain count). **U**: Apple does not guarantee Keychain survival; record what the device does |
| D-8 | Restore an iCloud backup onto another phone | Letters come back; the free count is the larger of the letters present and the saved count, so the gate still asks at the third |
| D-9 | Airplane mode at the Keep sheet | The sheet says Plus needs the internet and keeps the letter; nothing is lost |
| D-10 | Settings, Plan, Redeem a code with a sandbox offer code | Apple's code sheet opens; after redeeming, Plus is on without a restart. **U**: `AppStore.presentOfferCodeRedeemSheet(in:)` was read in Apple's docs on 4 Oct 2026 but has not run on a device |
| D-6 | Family Sharing: second sandbox account in the same family | Plus on; Plan says "Shared with you through Apple Family Sharing"; no refund row |
| D-7 | Request a refund | Apple's refund sheet opens |
| D-8 | Airplane mode, relaunch with Plus on | Plus still on; nothing locked |
| D-9 | Plus expired (StoreKit file: expire) | Existing books, letters, recordings and export all work; a new book shows the gate |
| D-10 | Dynamic Type at the largest size, VoiceOver | Store sheet readable, prices read with their periods (Apple's view) |
| D-11 | Dark mode | Subscribe buttons readable (system tint in dark mode) |
| D-12 | iOS 16 device, if the deployment target stays 16.4 | Gate says Plus can be added on iOS 17 or later; Restore and Manage work |

## Keeping things in sync

- Changing a price: App Store Connect only (and the Subscription Terms table). No app release needed. Price increases for existing subscribers follow Apple's consent flow; never use notice-only increases (Terms 14.8).
- Adding a product: new product ID in App Store Connect, then `PLUS_PRODUCT_IDS` in `config.ts` and the StoreKit file in the same pull request; the unit test checks they match.
- Transferring the app to a company later (D-004): Apple's app transfer moves the subscriptions; nothing server-side needs re-creating because there is none.
