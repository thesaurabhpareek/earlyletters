# Offer codes: free months for early testers, neighbours and friends

Status: runbook and design, 4 Oct 2026. Nothing here is live: the app is not in the App Store and the in-app subscription flow is not built yet (BL-213). Facts below come from Apple's pages linked at the end; anything not on those pages is marked **unverified**.

## What the founder asked for
"A simple feature to add an offer code that gives you a better offer, for example 6 months free for neighbours and friends as early testers."

## The rule that decides the design
Apple App Review Guideline 3.1.1: apps "may not use their own mechanisms to unlock content or functionality, such as license keys, augmented reality markers, QR codes ... etc." Plus is a subscription sold only through the App Store (D-001, ADR 0013). So a code system we build ourselves, where typing a code in our app switches Plus on, risks rejection. **Use Apple's offer codes.** They live in App Store Connect, Apple redeems them, and our server learns of a redemption through the App Store Server Notification `OFFER_REDEEMED` (already in the ADR 0013 notification list). No code, no database table and no secret of ours is involved.

## What an Apple offer code can do (from Apple's help page)
- Gives a **free** or discounted price for a chosen duration (choices: Pay as you go, Pay up front, Free). **The page does not list the available durations. Whether exactly 6 months is offered must be checked in App Store Connect when the offer is created. Unverified.**
- Eligibility, any combination: new subscribers, existing subscribers, expired subscribers. For friends who have never subscribed, choose new subscribers.
- Two kinds of code:
  - **Custom codes**: a name you choose, up to 64 characters, no special characters (for example `NEIGHBOURS`). Expiry date optional; you can set a maximum number of redemptions. Good for a group of friends.
  - **One-time-use codes**: unique codes, batches of 500 to 25,000, expire after at most 6 months from creation. Good when each person must have their own.
- One code per offer per customer. Up to 1 million codes per app per quarter. Up to 10 active offers per subscription at a time.
- Codes can take up to an hour to become redeemable. They expire at 12:00 a.m. Pacific time on the expiry date.
- Redeemable by a link or inside the app (iOS 14 or later), if the app supports the StoreKit redemption method.
- Sandbox codes exist for testing (10 to 10,000 codes), on iOS 16.3 or later.

## What the person must be told, because the free period ends
An offer-code free period on an auto-renewing subscription **converts to a paid subscription at the normal price when it ends, unless the person cancels first** (Apple's trial-style disclosure rule, Guideline 3.1.2(a), asks the app to state the duration and any downstream charge). **Whether Apple lets you switch off conversion for an offer code is unverified: check in App Store Connect.** Until confirmed, tell every tester in plain words:
> "Your free months are a gift. When they end, Plus renews at the normal price unless you turn off renewal in your iPhone's Settings, under your name, then Subscriptions. We will remind you before."

Our own renewal reminders (Subscription Terms, notices) must apply to offer-code subscribers too. **Unverified**: whether the notification schedule in DECISIONS (trial notice windows) covers an offer-code free period; engineering must confirm when BL-213 is built.

## Steps for the founder (after the app and Plus exist in App Store Connect)
1. In App Store Connect open the app, then its subscription (the menu names move; use Apple's guide, linked below).
2. Create an offer: type **Free**, the duration Apple allows closest to 6 months, eligibility **New subscribers**.
3. Choose **custom code** (one group) or **one-time-use codes** (one per person). For custom: a name, an expiry date, and a maximum number of redemptions (set it, so a shared code cannot spread).
4. Wait up to an hour.
5. Give people the redemption link Apple shows on the offer page, or the code plus these words: "Open Early Letters, Settings, Plan, Redeem a code."
6. Watch redemptions in App Store Connect. Our server sees `OFFER_REDEEMED`.

## What engineering builds (when BL-213 starts; not done)
1. **Redeem a code** row in Settings > Plan and a quiet link on the Plus sheet. It calls StoreKit's offer-code redemption sheet (expo-iap has no entry in the app's package.json today; whether its current release exposes the sheet call is **unverified**, check before choosing).
2. After the sheet closes, refresh the entitlement from the App Store (the sheet has no callback; Apple's transaction updates carry the result).
3. Server: map `OFFER_REDEEMED` and the following `SUBSCRIBED` or `DID_RENEW` notices to the entitlement with its real end date. Entitlement source stays Apple; there is no code table of ours.
4. Copy (content package): the row label, one line about the free period converting, no countdown or pressure. Rules in CLAUDE.md apply.
5. Analytics: one content-free event, `offer_code_redeemed` (no code, no account detail).
6. Tests: entitlement from an `OFFER_REDEEMED` fixture; sandbox code redemption on a device.

## Before the app is in the store: early testers
Offer codes need the subscription in App Store Connect and an app a person can install. For neighbours and friends before launch, the route is TestFlight invitations; whether TestFlight testers need a code at all (Plus in TestFlight runs in the sandbox, free) is **unverified**. The founder should confirm with a test build before promising anything to testers.

## Decisions this needs
- Founder: the offer length and who gets it; whether friends are told about conversion in advance (recommended: yes).
- Counsel: offer-code wording in the Subscription Terms (added in the pricing documents).

## Apple sources
- Set up offer codes: https://developer.apple.com/help/app-store-connect/manage-subscriptions/set-up-subscription-offer-codes/
- Supporting offer codes in your app: https://developer.apple.com/documentation/storekit/supporting-offer-codes-in-your-app
- App Review Guidelines, 3.1.1 and 3.1.2: https://developer.apple.com/app-store/review/guidelines/
