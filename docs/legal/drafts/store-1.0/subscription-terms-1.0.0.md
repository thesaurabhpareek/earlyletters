---
title: Early Letters Plus Subscription Terms
document: auto-renewal-terms
version: 1.0.0
status: draft-for-counsel
review: DRAFT for counsel and founder review (D-125). Written by an AI drafting agent, with no legal review. Not legal advice. Every [COUNSEL Q] and [FOUNDER] mark is open and must be resolved and removed before publishing.
scope: Plus in the Early Letters app for iPhone, version 1.0 from the App Store (build 12, EAS production profile, server features on, status report off)
source: docs/legal/subscription-terms.md 4.1.0 (0.9.0 had no Plus text: "Plus is not part of this test"); checked against the code on develop at 1189fdff
proposed_url: https://earlyletters.com/legal/subscription-terms/1.0.0
last_updated: 2026-11-08
---

> **DRAFT for counsel review. Not legal advice.** This banner, the frontmatter `review:` line and every bracketed mark come out before publishing. Prices and free periods are D-082; they must match App Store Connect for `plus.monthly` and `plus.annual` on the day of publishing. "Our servers do not receive your purchases" is true only while `EXPO_PUBLIC_STATUS_REPORT` is off (founder decision F-9).

# Early Letters Plus: Subscription Terms

Version 1.0.0. Effective [effective date].

These terms are part of the Early Letters Terms of Use, section 8 (https://earlyletters.com/legal/terms/1.0.0). Apple sells and bills Plus. Apple's subscription screen shows the exact price and dates before you subscribe, and those are the terms that apply to you.

## Plans

| Plan | Price | Billed | Free period for people new to Plus |
|---|---|---|---|
| Plus Monthly | US $4.99 | Every month | The first month free |
| Plus Annual | US $49.99 | Every year | The first 2 months free |

The free months are for people new to Plus, once, across both plans, as Apple decides. Switching plans does not give a second free period. If you are not eligible, Apple shows the price with no free period. Plus is offered on the United States App Store and needs iOS 17 or later.

## What is free

Your first 2 letters are free. We may raise that number for everyone; we will not lower it. Every letter you keep stays yours to read, play and export, with or without Plus. If you never subscribe, or Plus ends, every letter and recording you kept stays readable, playable and exportable, and every book stays readable. Starting a book for another child and Read together do not need Plus.

## What Plus adds

- Keep adding letters to every book, as many as you like.

## How letters are counted

- A letter counts when you keep it, spoken or typed, in the book or private.
- A recording kept without words counts once its words are there and you keep it.
- Drafts, recordings you do not keep, quiet-day marks, edits, undo and restore do not count. A letter you delete still counts.
- Only your own letters count. Your co-parent's never do.
- The 2 free letters are one allowance across all your books.
- A letter you cannot keep yet waits on your iPhone, unchanged. After you subscribe, you tap Keep on it.

The count is kept on your iPhone, in the iPhone Keychain, which iOS keeps when an app is deleted, so reinstalling does not give the free letters again. Deleting your account does not reset it. The Privacy Policy, section 7, explains more. [COUNSEL Q S-3 (D-083).]

## Automatic renewal

Your plan renews automatically at the end of each period, and at the end of a free period, at the price shown when you subscribed, until you cancel. Apple charges your Apple Account at the end of the free period, then at the start of each month or year. With no free period, you are charged when you confirm the purchase.

## How to cancel

- **In Early Letters:** Settings, Plan, Manage subscription. This opens Apple's subscription screen.
- **On your iPhone:** Settings, tap your name, Subscriptions, Early Letters, Cancel Subscription. (Apple's steps: https://support.apple.com/HT212052, read 8 Nov 2026.)

Cancel at least 24 hours before your free period or current period ends to avoid the next charge. Plus keeps working until then. Deleting the app or your Early Letters account does not cancel your plan.

## Receipts and reminders

- **Apple** sends its own receipts and subscription emails to your Apple Account. Apple's receipt shows the amount you were charged.
- **The app**, on an iPhone signed in to the Apple Account that subscribed, tries to remind you before a free period ends, before an annual plan renews, and once a year for every plan, with the date and how to cancel. The reminders do not state the price. They come as notifications if you allow them, and as a note in the app the next time you open it. Someone who has Plus through Family Sharing gets none, because they are not billed.
- **Right after you subscribe**, the app shows what you agreed to, with a button to save a copy. Settings, Plan always shows when your free period ends or your plan renews.
- **We do not email you about Plus,** even if you have an Early Letters account. Our servers do not receive your purchases. Before that changes, we will update these terms.

Reminders can arrive late or not at all, for example if the app is deleted or notifications are off. Apple keeps billing until you cancel. The dates in Settings, Plan and in Apple's receipts are the ones to rely on.

## Price changes

We may change the price of Plus for new subscribers. While your subscription continues, you keep the price you already pay. Apple tells you about any price change and asks for your agreement where its rules require.

## Family Sharing

Family Sharing is on. People in your Apple family group get Plus too, including a co-parent in that group. A co-parent outside your Apple family group needs their own plan. You can stop sharing your subscription in your Apple Account settings.

## Offer codes

We may give some people an Apple offer code for free time on Plus. You redeem it in Settings, Plan, Redeem a code, or in the App Store. Apple shows what happens when the free time ends: either Plus ends with no charge, or it renews at the standard price unless you cancel. Each code says which.

## Restore

On a new iPhone, or after reinstalling, Settings, Plan, Restore purchases asks Apple for your plan again. Plus follows your Apple Account, not your Early Letters account.

## Refunds

Apple decides refunds. Ask at reportaproblem.apple.com, or in Early Letters under Settings, Plan, Request a refund. A refund never changes your letters, recordings or books.

## If Plus ends

Your books, letters and recordings stay, to read, play and export. Keeping another letter needs Plus again.

## Questions

[legal name], [mailing address], hello@earlyletters.com

[Terms of Use](https://earlyletters.com/legal/terms/1.0.0) | [Privacy Policy](https://earlyletters.com/legal/privacy/1.0.0)

## For counsel: California auto-renewal points (remove before publishing)

Statute text was not re-read today. Subsections are as `docs/legal/memos/q-003-subscription-notices.md` read Cal. Bus. & Prof. Code 17602 on 3 Oct 2026 (https://law.justia.com/codes/california/code-bpc/division-7/part-3/chapter-1/article-9/section-17602/). The D-022 strictest-state table also applies.

| Point (memo's reading) | What build 12 does | Where | Open |
|---|---|---|---|
| (a)(1) Clear and conspicuous terms before purchase | Apple's sheet shows the price, period and free period. Our notes above Apple's plans state the promise, renewal, cancel and Family Sharing lines (`billing.en.ts` `store`). These terms are linked from the sheet's Terms link only through the Terms of Use, because the sheet takes two links (`storeSheetOptions()`) | `apps/mobile/src/lib/billing/actions.ts` | **S-26:** is a link through the Terms enough, or must the sheet link these terms directly? `plus.legal.subscriptionTermsLink` exists but nothing draws it |
| (a)(2) Affirmative consent | Apple's purchase confirmation | StoreKit | None found |
| (a)(3) Acknowledgment you can keep, with terms, cancellation policy and how to cancel | The confirmation screen with Save a copy. By D-083 it states no price | `apps/mobile/src/app/plus/confirmed.tsx` | **S-4:** with no amount, is it enough? Apple's receipt email has the amount |
| (b)(1)(A) Annual plan free period over 31 days: notice 3 to 21 days before it ends | Phone reminder (`trialLong`) inside a hard window, no amount, best effort | `billing/plan-reminders.logic.ts` | **S-4** (packet Q41 (a), (b), (i)) |
| (b)(2) Annual term: notice 15 to 45 days before renewal | Phone reminder (`annualLong`, `annualShort`), no amount | Same | **S-4** |
| (h) Yearly reminder, in the medium used to sign up | Phone reminder on each anniversary, for monthly plans too | Same | **S-4:** whether an app notification is "the same medium" |
| Cancellation online without obstruction | Settings, Plan, Manage subscription, which opens Apple's sheet, or Apple's web page if the sheet cannot open; Apple's own route as well | `billing/actions.ts` `manageSubscription()` | None found |
| Proof of consent kept 3 years (or 1 year after termination) | No record by us while the status report is off. Apple holds the purchase. With an account, `subscription_consents` exists in the schema but is written only by the status report | `supabase/migrations/20261016001000_subscription_status.sql` | **S-27** (packet Q41 (e)): is Apple's record enough? Founder decision F-9 |
| Price change notice 7 to 30 days before | Apple's price-increase flow; existing subscribers keep their price | Above | None found |

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-11-08 | First version for the App Store app, from draft 4.1.0: our servers do not receive purchases and we do not email about Plus, even with an account; both ways to cancel; restore; the letter count is not reset by deleting the app or the account; the raise-only free allowance. Prices and free periods unchanged (D-082). Draft for counsel. |
