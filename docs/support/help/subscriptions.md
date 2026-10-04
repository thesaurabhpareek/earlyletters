# Plus and your Apple subscription

Writing, reading, playing your recordings, export and writing with your co-parent (version 1.1) are free, always. Plus adds a few extras. You buy it, change it, cancel it and ask for refunds through Apple, using your Apple Account.

## What Plus adds

- **Read together** whenever you like, after the first 3 times in each book.
- **Books for more children.** Your first book is always free. So are twins or more you add together when you first set up, and (from version 1.1) a book you joined as a co-parent does not count as your free book.

## What stays free, with or without Plus

Every letter you write, every recording you play, export, and (from version 1.1) writing with your co-parent. If you never subscribe, or stop later, everything you made stays yours to read, play and export. Every book you already have stays open for writing.

## Plans and free trials

| Plan | Price in the US | Free trial for new subscribers |
|---|---|---|
| Plus Monthly | $3.99 a month | 1 month |
| Plus Annual | $29.99 a year | 2 months |

Before you subscribe, Apple's subscription screen shows each plan's price and any free trial you can have. Apple decides who can have a free trial. If no free trial is shown, you are not eligible for one.

Plus belongs to the Apple Account that buys it. You do not need to sign in to Early Letters to start it.

Plus can be added on iOS 17 or later.

## When you are charged

Plus renews on its own until you cancel. With a free trial, Apple charges you when the free trial ends. Without one, Apple charges you when you confirm. After that, Apple charges you at the start of each month or year.

While Plus is on, Settings, Plan shows when your free trial ends, or when your plan renews. During a free trial it also shows the last day to cancel so you pay nothing.

## How to cancel

Cancel any time, at least 24 hours before your free trial or your current month or year ends. Plus keeps working until then.

**In Early Letters:** Settings, Plan, **Manage subscription**. Apple's own subscription screen opens.

**On your iPhone:**

1. Open the Settings app.
2. Tap your name.
3. Tap Subscriptions.
4. Tap Early Letters.
5. Tap Cancel Subscription.

If there is no Cancel Subscription button, your plan is already cancelled and will not renew.

**Deleting the app, or your account, does not cancel Plus.** Cancel with Apple as above.

## Refunds

Apple handles every refund for App Store purchases. We cannot give or promise a refund, and Apple decides each request.

**In Early Letters:** Settings, Plan, **Request a refund**. Apple's refund screen opens. This button shows for the person who bought Plus.

**On the web:**

1. Sign in to reportaproblem.apple.com with your Apple Account.
2. Tap "I'd like to", then choose "Request a refund".
3. Choose the reason, then choose Next.
4. Choose Early Letters Plus, then choose Submit.

You can check the status of your request on the same site.

A refund never changes your letters or recordings. If Apple gives a refund, Plus ends and your book carries on as a free book.

## Sharing Plus with your co-parent

> **Version 1.1.** Co-parent sharing is not in this version yet. Plus can still be shared through Apple Family Sharing, which is Apple's feature. Whether it needs anything from Early Letters at v1.0 is for `payments` to confirm before this section is published.

Plus can be shared through Apple Family Sharing. When you and your co-parent are in the same Family Sharing group, your co-parent gets Plus too, at no extra cost.

**If you have not set up Family Sharing:** open the Settings app, tap your name, tap Family, then follow the steps to invite your co-parent.

**To share your subscriptions with your family:** open the Settings app, tap your name, tap Subscriptions, tap Manage Family Access, then turn on Share Eligible Subscriptions.

Then your co-parent opens Early Letters. Settings, Plan says "Shared with you through Apple Family Sharing." If Plus does not show, tap **Restore purchases** in Settings, Plan.

If you are not in the same Family Sharing group, your co-parent can still write, read, play recordings and export, free.

## A new phone

Plus comes with your Apple Account. Sign in to the same Apple Account on your new phone and open Early Letters. If Plus does not show, go to Settings, Plan and tap **Restore purchases**.

## If a payment does not go through

Plus keeps working for a while, so you have time to update your payment details in your Apple Account. If Apple still cannot take the payment, the Plus extras pause until it can. Your letters are fine.

## If Plus ends

Your books, letters and recordings stay. Every book stays open for writing, reading and export, including books you started for more children. Read together returns to its free times. Nothing you wrote changes.

## Price changes

We never raise your price unless you agree first.

## Gifts

Gifts of Plus are not available yet.

## Questions

For charges, refunds and your Apple Account, Apple can help: reportaproblem.apple.com. For anything about Early Letters, write to us at {SUPPORT_EMAIL}. Apple handles payment for Plus. We never see your card details, and we never need them.

Our Subscription terms are part of our Terms of Service. Open them from Settings, **Terms of Service**, or from the links on Apple's subscription screen.

---

## Reviewer notes (remove before publishing)

**Version 1.1 marks (founder decision, v1.0 is on-device only).** Marked above: co-parent writing and joined-book wording, and the Sharing Plus with your co-parent section. Apple purchase, restore, cancel and refund steps do not need an Early Letters account (D-053) and stay as written. **Hold before publishing:** the Plus scope in this article (Read together after 3 free times, books for more children, writing free always) follows D-053 on origin/develop. The 4 Oct membership decision (D-051 in the coordinator's local decision log, not yet on origin/develop) makes Plus the membership that unlocks new letters after 2 free per account, which would change "What Plus adds", "What stays free" and "If Plus ends". It also counts "per account", which needs a way to count on the device when there is no sign-in. Do not publish this article until `product` and `legal` settle that.

**What Plus includes: from D-053 and the shipped code only (develop at 7cc43b1).**
- `docs/DECISIONS.md` line 345, D-053 (Decided, founder): "Plus gates only Read together after 3 free sessions per book, and books for more children". Lines 366 to 369: Plus copy lists only what v1.0 gates.
- `packages/content/src/features/billing.en.ts` lines 20 to 23 (`store.features`, what Apple's subscription screen shows above the plans): "Read together whenever you like, after the first 3 times in each book." and "Books for more children. Your first book is always free." Line 24 (`store.promise`) is the article's opening sentence, word for word.
- `packages/content/src/strings.en.ts` line 790 (`plus.promise`) and line 906 (`settingsHome.planHelp`) say the same two things.
- `apps/mobile/src/lib/billing/plan.logic.ts` lines 20 and 21: "only starting another book and more Read together sessions are gated". The only two gate calls are `feature: 'start_book'` (line 365) and `feature: 'read_together'` (line 381). `apps/mobile/src/lib/billing/gates.ts` lines 48 to 51: existing books are never affected.
- `packages/content/test/rules.test.ts` lines 224 to 229 fail on "theme", "cover" or "backup" in Plus copy.
- `packages/core/src/plan.ts` line 33 still lists `backup_upload` and `theme_extra` as gate types, but nothing in the app offers them. The article does not mention them.

**How Plus works on the device (shipped code).**
- `usePlan()`: `apps/mobile/src/lib/billing/use-plan.ts` lines 21 to 28, from `apps/mobile/src/lib/billing/plan-store.ts` line 87 (`currentEntitlements`). Nothing talks to our server (plan-store.ts lines 1 to 6).
- Plus belongs to the Apple Account, and buying needs no sign-in with us: plan.logic.ts lines 11 and 12; `docs/adr/0013-apple-native-subscriptions.md` line 41; `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` line 100 ("No account with us is needed to subscribe"). So the old line "You need to be signed in to Early Letters to start Plus" is gone, and "A new phone" no longer starts with signing in to Early Letters.
- A co-parent's Family Sharing Plus arrives as their own `familyShared` entitlement: plan.logic.ts lines 13 to 15. The Plan screen shows `billing.plan.shared` (billing.en.ts line 54).
- StoreKit `SubscriptionStoreView`: `apps/mobile/modules/scribe-store/ios/PlusStoreSheet.swift` line 153, with Restore and the Terms and Privacy links visible (lines 158 and 159). It needs iOS 17 (`ScribeStoreModule.swift` lines 32 to 37; `billing.gate.needsNewerIos`, billing.en.ts line 35). Apple's screen shows the price and the free trial only to people who are eligible (`apps/mobile/src/lib/billing/config.ts` lines 6 to 8).
- Settings, Plan: `apps/mobile/src/app/settings/plus.tsx` lines 83 to 121. "See what Plus adds" shows when Plus is off. "Manage subscription" and "Restore purchases" always show. "Request a refund" shows only for the person's own purchase (line 114), so not for Family Sharing.
- Dates: `billing.plan.trial` and `trialCancelBy` (billing.en.ts lines 48 and 49), `renews` (line 50). Grace and billing retry: lines 52 and 53 ("its extras are paused").
- Prices, trials, Family Sharing on, 16-day grace: D-053 and `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` lines 13 to 16.

**Still to do before publishing:** the founder's App Store Connect steps and the device checks D-1 to D-6 in `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md`. Until the products exist, nobody can buy Plus.

**Checked against Apple (opened 3 Oct 2026):**
- Refund steps: support.apple.com/118223, quoted step by step.
- Family Sharing: support.apple.com/108107 ("Add a family member to your shared subscriptions"). Please check the two paths on a current iPhone before publishing, because the page was read through a summarising fetch.
- Cancel steps: support.apple.com/118428, confirmed by the red-team review on 3 Oct 2026 (the five steps, the "no Cancel Subscription button" line, and 24 hours before a free trial ends). I did not reopen it.
- Price changes: App Store Connect Help, "Manage pricing for auto-renewable subscriptions" (opened 3 Oct 2026, re-verified word for word by the red team). Subscribers must consent to an increase only if: "The subscriber is located in a region that requires consent for any price changes"; "The price increase is more than 50% of the current price and the difference in price exceeds approximately US$5 per period for non-annual subscriptions, or US$50 per year for annual subscriptions"; or "The subscriber experienced a price increase for that subscription within the past 12 months." Otherwise: "If none of the criteria apply, Apple will automatically notify subscribers of the price increase with no additional request for consent." Also: "You also have the option to preserve prices for existing subscribers."
- "One free trial per person" (Subscription terms line 37) is not used. Apple decides eligibility, and the article says only that.

**Hand-off to `product`: Plus contents in the PRD.** PRD C line 90 still lists "Extra themes and book covers" as Plus, line 125 says "Themes fall back to default" on lapse, and C-REQ-023 (line 230) names backup and themes as offer moments. D-053 supersedes these. Also D-036 (Recommended, "a purchase needs an account") conflicts with the shipped flow above; ADR 0013 line 41 already records that it no longer applies. BL-103 (`docs/BACKLOG.md` line 69) still says Family Sharing off and uses other product ids.

**Hand-off to `legal`: the terms.**
- D-053 (DECISIONS.md line 368) asks `legal` to drop "encrypted backup" and "extra themes": Subscription terms lines 23 and 26, and Terms of Service 14.1 (line 225).
- Terms of Service 14.12 (line 256) still says Family Sharing is not available at launch.
- Subscription terms line 37 says the date to cancel by is shown before you subscribe. In the shipped flow, Apple's screen shows the price and trial before, and Settings, Plan shows the cancel-by date after (billing.en.ts line 49). Counsel should confirm this meets the auto-renewal disclosure rules.
- The Terms of Service point to the Subscription terms at `{SUBSCRIPTION_TERMS_URL}` (line 41), which has no value in `packages/brand`, and no in-app row opens them. The article sends people to Terms of Service, which says the Subscription terms are part of it (line 225).

**Hand-off to `legal` and `payments`: the price promise.** "We never raise your price unless you agree first" is our own promise (Subscription terms, "Reminders from us", line 61), not Apple's rule. Under Apple's rules above, an increase below the thresholds reaches existing subscribers with notice only. The promise holds only if every future increase uses Apple's option to preserve prices for existing subscribers. `payments` should record that as a rule; `legal` should confirm the wording.

**Still open (legal question, needs an answer before launch): reminders before a free trial ends.** The Subscription terms promise email and in-app reminders (California and other auto-renewal laws, K-38), and an email 7 to 30 days before any price change. With no server of ours seeing purchases (D-053), nothing can send them. This is `docs/agents/DEBATES.md` Q-003 (Open, needs counsel). The article promises only that Settings, Plan shows the dates.

**Closed since the last review:**
- Plus and the Early Letters account (my earlier hand-off to `payments`): answered by the code. Plus follows the Apple Account (plan.logic.ts lines 11 to 15), so D-047's rule about moving Plus between our accounts does not apply on the device.
- `plus.promise` now says "writing with your co-parent" and names the free times per book (strings.en.ts line 790). Hand-off done.
- Family Sharing on: ADR 0013 (line 15), ROADMAP (line 43) and the App Store Connect checklist now agree with D-053.

**Other sources:** "Plus keeps working until then" and the price promise from the Subscription terms; account deletion does not cancel Plus from `accountDeletion.subscription.body`; lapse from C 4.3 and C-REQ-028.

**Voice:** the content team keeps "trial" for store-required disclosure (Subscription terms counsel note 5). This article uses "free trial" because parents search for it. `content` may prefer otherwise.

**Never:** the article does not promise a refund, and it sends every refund and cancellation to Apple (support charter).
