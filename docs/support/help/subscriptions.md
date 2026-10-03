# Plus and your Apple subscription

Writing, reading, playing your recordings, export and family letters are free, always. Plus adds a few extras. You buy it, change it, cancel it and ask for refunds through Apple, using your Apple Account.

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

Plus belongs to the Early Letters account you started it from. Restore will not move it to a different Early Letters account.

## If a payment does not go through

Plus keeps working for a while, so you have time to update your payment details in your Apple Account. Your letters are fine.

## If Plus ends

Your books, letters and recordings stay. Every book stays open for writing, reading and export. Read together returns to its free sessions, and your book goes back to the standard look. Nothing you wrote changes.

## Price changes

We never raise your price unless you agree first. Apple asks you before any new price applies.

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
- Cancel steps: support.apple.com/118428 could not be opened in this run. The steps follow Subscription terms "How to cancel". The "no Cancel button means already cancelled" line is Apple's usual guidance but Unverified here. Check both on a device.

**Founder decision needed:**
1. **Family Sharing.** Brief decision 3 says Family Sharing is on and is how a co-parent gets Plus. ADR 0013, BL-103, ROADMAP week 3, TDD 08 and PRD C 4.2 say off, and Terms 14.12 says not available at launch. PRD C 4.2 cites Apple: once it is turned on, it cannot be turned off. If it stays off, remove "Sharing Plus with your co-parent" and say how the co-parent is covered (PRD K-28: Plus per account through the server, which brief decision 3 removes).
2. **Encrypted backup.** The Subscription terms list it first among Plus features. Brief decision 9 says no audio upload in v1.0, so this article leaves it out. `legal` should align the terms and the Plus sheet (Apple 3.1.2(c) requires the Plus sheet to describe exactly what you get).
3. **Reminders before a free trial ends.** The Subscription terms promise reminders by email and in the app (California and other auto-renewal laws, K-38). With no server of ours seeing purchases (brief decision 3), we cannot send email reminders tied to a trial. The article promises only that Settings, Plan shows the date. `legal` and `product` must decide how the legal reminders are met before launch.

**Other sources:** prices and free trial lengths from brief decision 3 and Subscription terms 1.3.0; "Plus keeps working until then" and "We never raise your price unless you agree" from Subscription terms; grace period from C-REQ-027 and D-048 (16 days, recommended; the article gives no number); restore never moves an active plan between accounts from D-047 and PRD-REQ-022; account needed to buy from PRD-REQ-022; lapse from C 4.3 and C-REQ-028.

**Voice:** the content team keeps "trial" for store-required disclosure (Subscription terms counsel note 5). This article uses "free trial" because parents search for it and it explains the disclosure. `content` may prefer otherwise.

**Never:** the article does not promise a refund, and it sends every refund and cancellation to Apple (support charter).
