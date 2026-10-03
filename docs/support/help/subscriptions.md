# Plus and your Apple subscription

Writing, reading, playing your recordings and export are free, always, and so is writing with your co-parent. Plus adds a few extras. You buy it, change it, cancel it and ask for refunds through Apple, using your Apple Account.

## What Plus adds

- **Read together** after your first 3 sessions. The app shows the current number.
- **Books for more children.** The first book you start is free. So are twins or more you add together when you first set up, and a book you joined as a co-parent does not count as your free book.
- **Extra themes and book covers.**

## What stays free, with or without Plus

Every letter you write, every recording you play, export, and writing with your co-parent. If you never subscribe, or stop later, everything you made stays yours to read, play and export. Every book you already have stays open for writing.

## Plans and free trials

| Plan | Price in the US | Free trial for new subscribers |
|---|---|---|
| Plus Monthly | $3.99 a month | 1 month |
| Plus Annual | $29.99 a year | 2 months |

Before you subscribe, the app shows the price, the length of any free trial and the last day to cancel. Those are the terms that apply to you. Apple decides who can have a free trial, one per person. If no free trial is shown, you are not eligible for one.

You need to be signed in to Early Letters to start Plus.

## When you are charged

Plus renews on its own until you cancel. With a free trial, Apple charges you when the free trial ends. Without one, Apple charges you when you confirm. After that, Apple charges you at the start of each month or year.

Settings, Plan in Early Letters always shows when your free trial ends, or when your plan renews.

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

**In Early Letters:** Settings, Plan, **Request a refund**. Apple's refund screen opens.

**On the web:**

1. Sign in to reportaproblem.apple.com with your Apple Account.
2. Tap "I'd like to", then choose "Request a refund".
3. Choose the reason, then choose Next.
4. Choose Early Letters Plus, then choose Submit.

You can check the status of your request on the same site.

A refund never changes your letters or recordings. If Apple gives a refund, Plus ends and your book carries on as a free book.

## Sharing Plus with your co-parent

Plus can be shared through Apple Family Sharing. When you and your co-parent are in the same Family Sharing group, your co-parent gets Plus too, at no extra cost.

**If you have not set up Family Sharing:** open the Settings app, tap your name, tap Family, then follow the steps to invite your co-parent.

**To share your subscriptions with your family:** open the Settings app, tap your name, tap Subscriptions, tap Manage Family Access, then turn on Share Eligible Subscriptions.

Then your co-parent opens Early Letters. If Plus does not show, tap **Restore** in Settings, Plan.

If you are not in the same Family Sharing group, your co-parent can still write, read, play recordings and export, free.

## A new phone

Sign in to Early Letters, then go to Settings, Plan and tap **Restore**. Plus comes back.

## If a payment does not go through

Plus keeps working for a while, so you have time to update your payment details in your Apple Account. Your letters are fine.

## If Plus ends

Your books, letters and recordings stay. Every book stays open for writing, reading and export. Read together returns to its free sessions, and your book goes back to the standard look. Nothing you wrote changes.

## Price changes

We never raise your price unless you agree first.

## Gifts

Gifts of Plus are not available yet.

## Questions

For charges, refunds and your Apple Account, Apple can help: reportaproblem.apple.com. For anything about Early Letters, write to us at {SUPPORT_EMAIL}. We never see your card details, and we never need them.

The full terms are in our Subscription terms, in the app under Settings, Help and Legal.

---

## Reviewer notes (remove before publishing)

**Built today (develop at 3688796):** none of Plus. The app shows "Plus is not open yet" (`childrenExtra.plusNotYet`) at the second-book gate.

**To build:** BL-103 App Store Connect products, BL-213 billing rules, BL-216 Plus sheet, BL-217 purchase consent records, BL-219 Settings, Plan (status and dates, Manage, Restore, Request a refund), BL-220 the account-deletion billing step. In-app Manage and Request a refund use Apple's own sheets (`showManageSubscriptionsIOS`, `beginRefundRequestIOS`; BL-215 spike).

**Checked against Apple (opened 3 Oct 2026):**
- Refund steps: support.apple.com/118223, quoted step by step.
- Family Sharing: support.apple.com/108107 ("Add a family member to your shared subscriptions"). The two paths are from that page. Please check them on a current iPhone before publishing, because the page was read through a summarising fetch.
- Cancel steps: support.apple.com/118428 could not be opened in my first run. The red-team review opened it on 3 Oct 2026 and confirmed the five steps, the "no Cancel Subscription button means already cancelled" line, and cancelling at least 24 hours before a free trial ends. I did not reopen it.
- Price changes: developer.apple.com, "Manage pricing for auto-renewable subscriptions" (App Store Connect Help, opened 3 Oct 2026). It says subscribers must consent to an increase only if one of these applies: "The subscriber is located in a region that requires consent for any price changes"; "The price increase is more than 50% of the current price and the difference in price exceeds approximately US$5 per period for non-annual subscriptions, or US$50 per year for annual subscriptions"; or "The subscriber experienced a price increase for that subscription within the past 12 months." Otherwise: "If none of the criteria apply, Apple will automatically notify subscribers of the price increase with no additional request for consent." The same page says: "You also have the option to preserve prices for existing subscribers." Apple's consumer page "About subscription price changes" (support.apple.com/109501) could not be opened: Unverified. So the article no longer says Apple asks before every new price.

**Hand-off to `legal` and `payments`: the price promise.** "We never raise your price unless you agree first" is our own promise (Subscription terms, "Reminders from us"), not Apple's rule. Under Apple's rules above, an increase below the thresholds reaches existing subscribers with notice only. The promise holds only if every future increase uses Apple's option to preserve prices for existing subscribers. `payments` should record that as a rule for any price change; `legal` should confirm the wording. The terms also promise an email 7 to 30 days before any price change, which meets the same problem as item 3 below.

**Hand-off to `payments`: Plus and the Early Letters account.** The first draft said Plus "belongs to the Early Letters account you started it from" and that Restore will not move it (D-047, written for the server-side entitlement that brief decision 3 removes). With the on-device `Transaction.currentEntitlements` check, any rule that ties Plus to one Early Letters account must not block a co-parent's family-shared Plus. I removed the line rather than publish a rule that may not exist. If `payments` confirms both can hold on the device, the line can come back.

**Settled by the brief, other documents to update (hand-offs, not founder decisions):**
1. **Family Sharing.** Brief decision 3 (Decided) turns Family Sharing on, and it is how a co-parent gets Plus. ADR 0013, BL-103, ROADMAP week 3, TDD 08 and PRD C 4.2 still say off, and Terms 14.12 says not available at launch. Hand-off to `product` (PRD, ADR, backlog, roadmap) and `legal` (Terms 14.12). For their notes, PRD C 4.2 cites Apple: once it is turned on, it cannot be turned off.
2. **Encrypted backup.** The Subscription terms list it first among Plus features. Brief decision 9 (Decided) says no audio upload in v1.0, so this article leaves it out. Hand-off to `legal` to align the terms and the Plus sheet (Apple 3.1.2(c) requires the Plus sheet to describe exactly what you get).

**Still open (legal question, needs an answer before launch):**
3. **Reminders before a free trial ends.** The Subscription terms promise reminders by email and in the app (California and other auto-renewal laws, K-38). With no server of ours seeing purchases (brief decision 3), we cannot send email reminders tied to a trial. The article promises only that Settings, Plan shows the date. `legal` and `product` must decide how the legal reminders are met before launch.

**Hand-off to `content`: `plus.promise`.** The string (`packages/content/src/strings.en.ts`, `plus.promise`) says "family letters are free". At v1.0 the only other writer is the co-parent (brief decision 5), so this article now says "writing with your co-parent". `content` should decide whether the string changes too.

**Other sources:** prices and free trial lengths from brief decision 3 and Subscription terms 1.3.0; "Plus keeps working until then" and "We never raise your price unless you agree" from Subscription terms; grace period from C-REQ-027 and D-048 (16 days, recommended; the article gives no number); account needed to buy from PRD-REQ-022; lapse from C 4.3 and C-REQ-028.

**Voice:** the content team keeps "trial" for store-required disclosure (Subscription terms counsel note 5). This article uses "free trial" because parents search for it and it explains the disclosure. `content` may prefer otherwise.

**Never:** the article does not promise a refund, and it sends every refund and cancellation to Apple (support charter).
