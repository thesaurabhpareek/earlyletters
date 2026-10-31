---
title: Early Letters Plus Subscription Terms
version: 4.0.0
status: draft-for-counsel
effective_date: TBD
last_updated: 2026-10-31
owner: founder
shown_at: Plus marketing content above Apple's subscription screen (link), Settings > Plan, earlyletters.com
---

> **Drafting notice.** This document was drafted by an AI (Claude) for review by a licensed attorney. It is not legal advice and is not ready to publish. Placeholders appear in curly braces. Notes for counsel appear as **[COUNSEL: ...]** and must be removed before publication. The reminder and record-keeping position is in `docs/legal/memos/q-003-subscription-notices.md`; open questions are numbered in `docs/legal/COUNSEL_PACKET.md` (Q8).

# Early Letters Plus: Subscription Terms

This is the short summary of Plus. It is part of the Early Letters Terms of Service (https://earlyletters.com/terms), Section 14.

## What stays free

Your first two letters are free. Every letter you keep stays yours to read, play and export, with or without Plus. If you never subscribe, or stop later, every letter and recording you kept stays yours to read, play and export, and every book you already have stays readable. Read together and starting a book for another child do not need Plus.

## What Plus adds

- Keep adding letters to every book, as many as you like.

A letter counts when you keep it, spoken or typed, in the book or private. Drafts, takes you do not keep, quiet-day marks and edits do not count, and a letter you delete still counts. The two free letters are one allowance across all your books. The full counting rules are in the Terms of Service, Section 14.1.

**[COUNSEL: Must match the marketing content above Apple's store view (`packages/content/src/features/billing.en.ts`, `billingCopy.store.features`, `subtitle` and `promise`) at every release (Apple 3.1.2(c)). 4.0.0 replaces the 1.4.0 list (Read together after 3 free sessions; books for more children) with the D-082 and D-083 model; the bullet is `billingCopy.store.features[0]` word for word and "What stays free" opens with `billingCopy.store.promise` word for word. The review (SUB-02) also asks for a content rule test that pins this bullet to `billingCopy.store.features`; that test lives in `packages/content/test` (copy lane), not here. 1.3.0 also listed encrypted backup and extra themes and covers; neither ships in v1.0 (D-053, D-059, D-085).]**

## Plans

| Plan | Price | Billed | Free trial for new subscribers |
|---|---|---|---|
| Plus Monthly | US $4.99 | Every month | 1 month |
| Plus Annual | US $49.99 | Every year | 2 months |

Apple's subscription screen shows the price, the length of any free trial and when it ends before you subscribe, and those are the terms that apply to you. One free trial per person across both plans, as Apple decides. If you are not eligible, no trial is shown. Plus is offered in the United States.

## Automatic renewal

- **Your plan renews automatically** at the end of each period, and at the end of your free trial, at the price shown when you subscribed, until you cancel.
- **When you are charged:** at the end of your free trial, then at the start of each new month or year. With no free trial, you are charged when you confirm the purchase.
- **Who charges you:** Apple, through your Apple Account. Apple handles every payment, renewal, cancellation and refund. We never see your card details, and we do not receive your purchase records.

## How to cancel

Cancel at any time:
- **On your iPhone:** Settings, tap your name, Subscriptions, Early Letters, Cancel Subscription.
- **In Early Letters:** Settings, Plan, Manage subscription. This opens Apple's own subscription screen, with nothing in between.

To avoid the next charge, cancel at least 24 hours before your free trial or current period ends. Plus keeps working until then. Deleting the app or your account does not cancel your plan.

## Receipts and reminders

- **Apple** sends its own receipts and subscription emails to your Apple Account. Apple's receipt shows the amount you were charged.
- **The app**, on an iPhone signed in to the Apple Account that subscribed, tries to remind you before a free trial ends, before an annual plan renews, and once a year for every plan, with the date and how to cancel. The reminders do not state the price: Apple's subscription screen shows it before you subscribe, and Apple's receipt has it. Reminders come as notifications if you allow them, and as a note in the app the next time you open it. A reminder can come late or not at all, so the dates in Settings, Plan and Apple's receipts are the ones to go by. Settings, Plan always shows when your trial ends or your plan renews.
- **Right after you subscribe**, the app shows what you agreed to, with a button to save a copy for yourself.
- **We do not email you about Plus yet.** If you delete the app or turn its notifications off, the app's reminders stop, but Apple keeps billing until you cancel. Before our reminder emails start, we will update these terms. They will go only to the email address of a signed-in account, for a plan bought with that person's own Apple Account, and will state the plan, its price and how often you are charged, the date your trial ends or your plan renews, the last day to cancel and how to cancel.

## Price changes

We may change the price of Plus for new subscribers. While your subscription continues, you keep the price you already pay. We will not renew a plan you have at a higher price.

## Sharing Plus with your family

Plus belongs to the Apple Account that subscribed and works on any iPhone signed in to it. Apple Family Sharing is on, so the people in your Apple family group, including a co-parent in that group, get Plus too. A co-parent outside your Apple family group needs their own subscription.

## Gifts

Gifts of Plus are not available yet. When they are, a gift of a year of Plus is paid once and never renews or charges anyone again.

## Refunds

Apple handles refunds: reportaproblem.apple.com, or Settings, Plan, Request a refund in Early Letters, which opens Apple's refund screen. Unless the law or Apple's policy says otherwise, there are no partial refunds for unused time. A refund never changes your letters, recordings or books.

## If Plus ends

Your books, letters and recordings stay, to read, play and export. Keeping another letter needs Plus again.

## Questions

{PUBLISHER_LEGAL_NAME}, {CONTACT_ADDRESS}, hello@earlyletters.com

[Terms of Service](https://earlyletters.com/terms) | [Privacy Policy](https://earlyletters.com/privacy)

**[COUNSEL: Store and law checklist for the purchase screen itself, not only this page. The purchase screen is Apple's `SubscriptionStoreView` (ADR 0013): Apple renders each plan's name, period, localized price and any free trial for eligible people, one subscribe button per plan (no plan preselected), Restore, and the Terms and Privacy links (pointed at earlyletters.com). We add only the marketing content above the plans (what Plus adds, the free-forever promise, renewal and how to cancel, Family Sharing; `billingCopy.store`).
(1) Apple DPLA Schedule 2 section 3.8(b) and App Review 3.1.2: title, length, price, and in-app links to the Privacy Policy and Terms of Use. Met by Apple's component plus our links; verify on device.
(2) California Business and Professions Code 17602 as amended by AB 2863, New York GBL 527-a, Utah Code 13-70, Virginia 59.1-207.46, Massachusetts 940 CMR 38.00, the NYC rule and ROSCA: clear and conspicuous auto-renewal terms near the purchase button, price after the trial, express affirmative consent, a retained acknowledgment, notice windows, records of consent. How each is met with no server, and the residual gaps (app deleted, notifications off, Massachusetts monthly receipts, per-person consent records held only by Apple): Q-003 memo sections 4 to 6 and questions C-1 to C-11.
(3a) Changed in 4.0.0 (review SUB-01 to SUB-03; D-080, D-083, D-121): the app's reminders no longer promise "the price after", because D-083 keeps prices out of app copy and the reminder and note strings name none; they are described as best effort, as the in-app confirmation says; the D-080 reminder emails are described as not sent yet, because the first store build (D-121) sends no email. California 17602(b)(1) and (b)(2) ask for the amount and frequency of charges (`docs/emails/COMPLIANCE.md` 5.1); in the first store build nothing from us states the amount, and whether Apple's own messages meet those windows and contents is **Unverified**. Open for the founder and counsel before submission (SUB-03; Terms Section 14 counsel note, 4.0.0; COUNSEL_PACKET Q8 and F14 Q-C1).
(3) "Receipts and reminders" replaces 1.3.0's "Reminders from us" (email and in-app on fixed day counts) and the consent-record sentence ("we keep a record ... and send you a copy by email"). Both promised things no server of ours can do (D-053). Day counts are deliberately not promised here; the app runs the D-022 windows (memo section 5).
(4) "Price changes" relies on choosing "keep current price for existing subscribers" in App Store Connect for every price change (memo C-9).
(5) PRD C-REQ-022: neither plan preselected; full price, period, renewal and how to cancel visible at default text size and at the largest Dynamic Type size. Apple's component handles the plans; our marketing content must wrap, never truncate.
(6) The voice guide allows the word "trial" only in store-required disclosure; this page uses "free trial" because it is the disclosure. Keep straight quotes and no dashes.
(7) Google Play lines were removed: Android and Play Billing are v1.1 or later (D-059) and App Review 2.3.10 bars other platforms' names in iOS-facing text.
Sources: Terms of Service Appendix A; Q-003 memo sources. Reviews: docs/legal/memos/lawyer-1.md, docs/legal/memos/q-003-subscription-notices.md.]**

## Changelog

| Version | Date | Status | Changes |
|---|---|---|---|
| 4.0.0 | 2026-10-31 | draft-for-counsel | Prices and Plus aligned with founder decision D-082, D-083 and the StoreKit setup (review `docs/reviews/2026-10-31/subscriptions.md` SUB-01, SUB-02; clause list in `docs/legal/CHANGES-2026-10-31.md`). Plans: US $4.99 a month and US $49.99 a year, replacing $3.99 and $29.99; trials unchanged (1 and 2 months). What stays free and What Plus adds: first two letters free, then Plus to keep adding letters, in the words of `billingCopy.store`; Read together and new books free; how letters count. If Plus ends: rewritten to match. Receipts and reminders: the app's reminders give the date and how to cancel, not the price, and may not arrive; reminder emails described as not sent yet (D-121), with their contents (SUB-03 left open for counsel). Version 4.0.0 because 1.5.0, 2.0.0, 3.0.0 and 3.1.0 were used by unmerged drafts on other branches and a number is never reused (POLICY_VERSIONING 2.4). Classification: major (POLICY_VERSIONING 2.1 item 6). Pre-publication draft, no users bound. `SUBSCRIPTION_TERMS_DOC_VERSION` in `apps/mobile/src/lib/billing/config.ts` must move to 4.0.0 in the same pull request (app lane). |
| 1.4.0 | 2026-10-03 | draft-for-counsel | Alignment with D-053 and ADR 0013 (Apple only, checked on the device, Family Sharing on) and D-059. What Plus adds: only Read together after 3 free sessions per book and books for more children (encrypted backup, extra themes and covers removed). "Reminders from us" by email replaced by "Receipts and reminders" (Apple's receipts, on-device reminders, in-app acknowledgment with Save a copy; no email; Q-003 memo). Consent-record email removed. Existing subscribers keep their price. New "Sharing Plus with your family" (Family Sharing on). Google Play lines removed. URLs and support address filled (D-063). Pre-publication draft, no users bound; if 1.3.0 had been published this would be major (POLICY_VERSIONING 2.1 item 6). |
| 1.3.0 | 2026-10-03 | draft-for-counsel | Alignment with PRD.md 1.3 (founder decisions of 3 Oct): Plus is sold and managed only through Apple at launch (ADR 0013); Google Play lines apply once Android ships; gifts marked not available yet (P1); provider is an individual ({PUBLISHER_LEGAL_NAME}, {CONTACT_ADDRESS}; D-004). Reminder wording already matches the K-38 windows. Pre-publication draft, no users bound; minor. |
| 1.2.0 | 2026-10-02 | draft-for-counsel | Product alignment with PRD.md 1.2: "listening" becomes "playing your recordings" (K-11); Read together free sessions and the books-for-more-children rule as decided by the founder on 2 Oct (PRD-REQ-015, PRD-REQ-020). Pre-publication draft, no users bound; minor (clarifies free scope). |
| 1.1.0 | 2026-10-02 | draft-for-counsel | Consumer-law review: filled the Plus feature list from PRD C 4.1; trial terms follow what the app shows (the trial experiment varies length); consent record and emailed copy; no obstacles to cancelling; reminder windows aligned to Terms 14.6; opt-in for price increases; gifts never renew. Pre-publication draft; if published over 1.0.0 this would be major (POLICY_VERSIONING 2.1 item 6). |
| 1.0.0 | 2026-10-02 | draft-for-counsel | First draft, prepared by Claude for counsel review, from the pricing decision of 1 Oct 2026. |
