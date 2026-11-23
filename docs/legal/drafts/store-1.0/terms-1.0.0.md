---
title: Early Letters Terms of Use
document: terms
version: 1.0.0
status: PROPOSED, draft for exec-team review (D-168, D-172). Not reviewed yet. The exec team is not a lawyer.
review: PROPOSED draft written by an AI drafting agent (`legal`). It is not legal advice and says nothing is compliant. "Counsel" in this file means the exec team's own review (D-172), which is not a licensed lawyer. Every [EXEC-TEAM COUNSEL Q] and [FOUNDER] mark is open and must be resolved and removed before publishing.
scope: the Early Letters app for iPhone, version 1.0 from the App Store (EAS production profile: servers and accounts on; analytics, backup, photos and Google sign-in off), with Plus, and earlyletters.com
source: docs/legal/drafts/store-1.0/terms-1.0.0.md at PR #672 head 28ae44e9a3f4e5ef5ac871e8a0e1301856a5f580 (itself from docs/legal/beta/terms-0.9.0.md and docs/legal/terms-of-service.md 4.1.0), rebased on the build as it ships; checked against develop at 079cb892d. Claim-by-claim backing: docs/ops/proposed/policy-1-0-0-rows.md
supersedes: PR #672's terms draft (the coordinator closes #672 once this PR has two counted reviews); terms 0.9.0 once published (proposed)
proposed_url: https://earlyletters.com/legal/terms/1.0.0
last_updated: 2026-11-23
---

> **PROPOSED. Draft for exec-team review. Not legal advice. Not a lawyer's text.** This banner, the frontmatter `review:` line and every bracketed mark come out before publishing. The build conditions are the same as the Privacy Policy 1.0.0 banner (`production` profile in `apps/mobile/eas.json` on develop at 079cb892d). Section 18 depends on founder decision F-1.

# Early Letters Terms of Use

Version 1.0.0. Effective [effective date].

## The short version

This is a summary. The full terms below are what count.

- Early Letters is for adults, 18 and over. Your child is who the letters are for, not a user.
- Your words and recordings are yours. We use them only to run Early Letters for you.
- We never rewrite your words. The app fixes only small slips, and you can see and undo every fix.
- You can keep letters on your iPhone without an account. Sign in to sync your book to your other iPhone.
- Your first 2 letters are free. After that, keeping a new letter needs Plus. Reading, playing and exporting every letter you keep is free, with or without Plus.
- Apple sells Plus, and it renews automatically until you cancel: in the app in Settings, Plan, Manage subscription, or in your iPhone's Settings, your name, Subscriptions.
- You can delete your account in the app. Deleting the app or your account does not cancel Plus.

## 1. The agreement

1.1 Early Letters is published by [legal name] ("we", "us"), the Seller named on the App Store. Write to us at hello@earlyletters.com or [mailing address]. [EXEC-TEAM COUNSEL Q S-7. Founder decision F-2.]

1.2 These Terms are an agreement between you and us about the Early Letters app for iPhone and our website, earlyletters.com (together, the "Service"). Our Privacy Policy (https://earlyletters.com/legal/privacy/1.0.0) and the Plus Subscription Terms (https://earlyletters.com/legal/subscription-terms/1.0.0) are part of them.

1.3 You accept these Terms when you tick the box beside "I agree to the Terms of Service and Privacy Policy" before you begin, and again when you create an account and agree. If you do not agree, please do not use the Service. [Backing: `packages/content/src/strings.en.ts` `beforeBegin.agree`; `apps/mobile/src/lib/agreements.logic.ts`. EXEC-TEAM COUNSEL Q S-15 (D-138 item 3, BL-575): whether the box and the sign-in agreement are enforceable as built, and whether use alone binds someone who never signs in. The 8 Nov draft said the box was not in build 12; it is on develop now, and it records version constants "4.1.0" and "3.0.0" (see `policy-1-0-0-rows.md`, version question).]

## 2. Who can use Early Letters

2.1 You must be 18 or older. If you tell the app you are under 18, it stops. It keeps only the time of that answer, on the phone, so it can wait a day before asking again. If we learn that an account belongs to someone under 18, we will close it. [EXEC-TEAM COUNSEL Q S-8 (packet Q46, Q5): Texas SB 2420. Founder decision F-3.]

2.2 You may start a book for a child only if you are the child's parent or legal guardian, or are expecting the child.

2.3 A child does not use the Service. An adult may read or play letters to a child.

2.4 You confirm you are not in a country under a US government embargo and are not on a US list of restricted parties.

## 3. Your account

3.1 You can write and keep letters on your iPhone without an account. To sync your book to a second iPhone, you need one. You can sign in with Apple, or with a link and code we email you. [Google sign-in is off in this build (D-171).]

3.2 Keep your iPhone and email secure. You are responsible for what happens through your account unless it is our fault. If you think someone else has used your account, tell us right away. You can also turn on the app lock in Settings, Privacy.

3.3 An account is for one person.

## 4. Books

4.1 Each child has their own book.

4.2 A letter is private to its author.

4.3 This version of the app has no way to invite or join another parent (D-162). If it comes, we will publish a new version of these Terms first, with the rules for books shared by two parents. [EXEC-TEAM COUNSEL Q: the 8 Nov draft had 8 clauses on two-parent books, the 72-hour rule, leaving a book and custody disputes (S-25, packet Q50). They are not in this text because no store build reaches them (`apps/mobile/src/lib/family/entry.logic.ts`). They return with BL-882 to BL-889. Counsel packet Q50 stays open until then.]

## 5. Your content

5.1 You own the letters, recordings and other things you create in the Service ("Your Content"), including transcripts and the small fixes to them.

5.2 You let us store, copy, sync, process and display Your Content only to run the Service for you, to keep it secure, to give you support you ask for, and to meet the law.

5.3 We will not sell Your Content, use it for advertising, use it to train machine learning models, imitate any voice in it, or use it in marketing without your written permission. We look at letters only as the Privacy Policy describes.

5.4 If a recording includes other adults, keep it only with their agreement.

5.5 We own the Service itself: the app, its design, the book layouts and our name. You may print and share your own exports for personal and family use.

## 6. Our transcription promise

6.1 We never rewrite your words. The app turns speech into text on your iPhone and may only remove filler sounds, false starts and accidental repeats; spell a name the way your names and words list does; add punctuation and paragraph breaks; and fix a one-word grammar slip.

6.2 It never adds, removes or changes meaning, reorders sentences, summarizes, translates or alters your recording. The original transcript is kept unchanged, and you can see and undo every fix.

6.3 This version writes down English only. Speech recognition can mishear, especially with noise, accents or more than one language. Read each letter before you keep it. Letters are a family keepsake, not a medical, legal or professional record.

## 7. Sync, backup and your own copies

7.1 When you sign in and agree to sync, your letters and your child's details are stored on our servers so they reach your other iPhone. If you do not sign in, or you keep your book on your iPhone, everything stays on your iPhone.

7.2 Recordings are not uploaded in this version. They are kept on your iPhone, and in your own iPhone backup if you use one. [Backing: `EXPO_PUBLIC_BACKUP=off`. If backup ships, this is a new major version.]

7.3 You can export everything at any time, free, in Settings, Your data, Export your book, including after Plus ends. We cannot bring back a recording that was only on an iPhone you no longer have. Please keep your own copy.

## 8. Plus

The Subscription Terms are part of these Terms and say the same as this section in more detail.

8.1 **Your first 2 letters are free.** After that, keeping a new letter needs Plus. A letter counts when you keep it, spoken or typed, in the book or private. A recording kept without words counts once its words are there and you keep it. Drafts, recordings you do not keep, quiet-day marks, edits, undo and restore do not count. A letter you delete still counts. Only your own letters count. The 2 free letters are one allowance across all your books, and the count is kept on your iPhone so that reinstalling the app does not reset it. A letter you cannot keep yet waits on your iPhone, unchanged, for as long as you like. We may raise the number of free letters for everyone; we will not lower it. [EXEC-TEAM COUNSEL Q S-16.]

8.2 **What stays free, for as long as we operate the Service:** keeping your first 2 letters; reading every letter you have kept and playing its recordings; exporting everything, including after Plus ends. Deleting your account is free too. Starting a book for another child does not need Plus.

8.3 **Past letters are never put behind a payment.** If you never subscribe, or Plus ends, every letter and recording you kept stays readable, playable and exportable, and every book stays readable. We will not change section 8.2 or this section for people who already use the Service. [EXEC-TEAM COUNSEL Q S-17 (packet Q40, Q16).]

8.4 **What Plus is.** Plus is an optional subscription. It adds one thing: keep adding letters to every book, as many as you like. The app shows this above Apple's subscription screen before you subscribe.

8.5 **Prices and free periods.** Plus Monthly is US $4.99 a month, with the first month free. Plus Annual is US $49.99 a year, with the first 2 months free. The free months are for people new to Plus, as Apple decides; if you are not eligible, Apple shows the price with no free period. Apple's subscription screen shows the price, any free period and when it ends before you subscribe, and those are the terms that apply to you. Plus is offered in the United States. [EXEC-TEAM COUNSEL Q S-5.]

8.6 **Automatic renewal.** Plus renews automatically at the end of each period, and at the end of a free period, at the price shown when you subscribed, until you cancel. Apple charges your Apple Account.

8.7 **Apple handles billing.** Plus is sold through the App Store, and Apple processes every payment, renewal, cancellation and refund under its own terms. We never see your card details, and our servers do not receive your purchases: the app checks Plus with Apple on your iPhone. [True while `EXPO_PUBLIC_STATUS_REPORT` is off, as it is in the `production` profile.]

8.8 **How to cancel.** You can cancel at any time, in either place:
- In Early Letters: Settings, Plan, Manage subscription. This opens Apple's subscription screen.
- On your iPhone: Settings, tap your name, Subscriptions, Early Letters, Cancel Subscription.

To avoid the next charge, cancel at least 24 hours before a free period or the current period ends. Plus keeps working until then. Deleting the app or your account does not cancel Plus. We never put an offer or extra step between you and cancelling.

8.9 **Receipts and reminders.** Apple sends its own receipts and subscription emails to your Apple Account. On an iPhone signed in to the Apple Account that subscribed, the app tries to remind you before a free period ends, before an annual plan renews, and once a year for every plan, with the date and how to cancel; it does not state the price. Right after you subscribe, the app shows what you agreed to, with a way to save a copy. Reminders can come late or not at all, so Settings, Plan and Apple's receipts are the dates to go by. We do not email you about Plus. [EXEC-TEAM COUNSEL Q S-4 (packet Q41).]

8.10 **Refunds.** Apple decides refunds. Ask at reportaproblem.apple.com, or in Early Letters under Settings, Plan, Request a refund. A refund never changes your letters, recordings or books.

8.11 **Price changes.** We may change the price of Plus for new subscribers. While your subscription continues, we keep the price you already pay. If that ever has to change, Apple will tell you and ask for your agreement where its rules require, and we will update these Terms first.

8.12 **Payment problems.** If a renewal payment fails, Apple may retry and ask you to update your payment details. If it is not fixed, Plus ends, and your letters are untouched.

8.13 **Who Plus covers.** Plus belongs to the Apple Account that subscribed and works on any iPhone signed in to it. Apple Family Sharing is on, so people in your Apple family group get Plus too, including a partner in that group. Signing in to Early Letters with a different Apple Account does not bring Plus with you.

8.14 **Offer codes.** We may give some people an Apple offer code for free time on Plus. You redeem it in Settings, Plan, Redeem a code, or in the App Store. Apple shows what happens when the free time ends.

## 9. Acceptable use

Do not use the Service to break the law; to harass, deceive or impersonate anyone; to post sexual content involving a child or anything that endangers a child; to record people without their permission; to get into accounts or data that are not yours; or to copy, attack or resell the Service. We report apparent child sexual abuse material to the National Center for Missing and Exploited Children as US law requires.

## 10. Ending

10.1 You can stop using the Service or delete your account at any time, in Settings, Your data, Delete account, or by emailing hello@earlyletters.com from the address on your account. Deletion takes effect after 30 days, during which you can change your mind. The Privacy Policy, section 8, says what is deleted and when.

10.2 We may suspend or end your account if you seriously or repeatedly break these Terms, if the law requires it, or if your use puts a child, another person or the Service at real risk. Where we can, we will tell you why first. Your letters stay on your iPhone, and you can still export them.

## 11. An early version

[Founder decision F-6: keep, reword or drop this section, to match the About note in Settings (Apple guideline 2.2).]

Early Letters is new. Features may change, and the app can make mistakes. Tell us about problems at hello@earlyletters.com.

## 12. If we close Early Letters

If we ever close Early Letters, we will tell you at least 90 days ahead, stop new charges, and keep export working the whole time. If someone else takes over the Service, they must keep sections 5.3, 8.3 and this section, or give you the same notice and export.

## 13. Disclaimers

The Service is provided "as is" and "as available". To the extent the law allows, we make no promises beyond these Terms, including implied warranties of merchantability, fitness for a particular purpose and non-infringement. We do not promise that speech recognition will be accurate, that the Service will always be available, or that no data will ever be lost, especially recordings you have not exported. Early Letters is not medical, parenting, legal or safety advice.

## 14. Limits on our liability

14.1 To the extent the law allows, we are not liable for indirect, incidental, special, consequential or punitive damages, or lost profits, and our total liability for all claims about the Service is limited to the greater of what you paid for Plus in the 12 months before the claim, or US $50.

14.2 These limits do not apply to fraud, intentional misconduct, gross negligence, violation of law, death or personal injury caused by our negligence, or anything else the law does not allow us to limit, including under California Civil Code section 1668 and the California Consumers Legal Remedies Act. Some places do not allow some limits, so some may not apply to you. [EXEC-TEAM COUNSEL Q S-11 (packet Q39).]

## 15. If you misuse the Service

If you break section 9 on purpose and someone brings a claim against us because of it, you agree to cover our reasonable costs of that claim, to the extent the law allows.

## 16. Disagreements and governing law

16.1 Please email us first and give us 60 days to put things right. Time limits for a claim pause during those 60 days.

16.2 Either of us may bring an eligible claim in small claims court where you live. Other claims go to the state or federal courts in [county] County, California. Nothing here waives your right to seek public injunctive relief where the law allows it.

16.3 California law governs these Terms, without regard to conflict-of-law rules. You keep the consumer protections of the place where you live that cannot be waived.

## 17. Changes to these Terms

We publish every version at its own address with its date and what changed. Small changes, such as fixing typos, take effect when posted. Before a change that affects your rights, prices or how we use Your Content applies to you, we will tell you in the app, and by email if you have an account, at least 30 days ahead. Export and deletion never depend on accepting new Terms.

## 18. Apple

[Founder decision F-1. With Apple's standard Licensed Application End User License Agreement (https://www.apple.com/legal/internet-services/itunes/dev/stdeula/, not read today), that licence governs your use of the app and these Terms add to it. With a custom licence entered in App Store Connect, it is this section. COUNSEL Q S-6 (packet Q35). The minimum terms below are carried from 0.9.0 and Terms 4.1.0.]

If you got the app from the Apple App Store:

- These Terms are between you and us, not Apple. We, not Apple, are responsible for the app and its content, its maintenance and support, and any warranty, product, legal compliance or intellectual property claims about it.
- Your licence is a non-transferable licence to use the app on Apple devices you own or control, as the Apple Media Services Terms allow, including through Family Sharing.
- If the app fails to meet a warranty, you may tell Apple, and Apple will refund the price you paid for the app, if any. Apple has no other warranty duty for it.
- You confirm you are not in an embargoed country or on a US restricted-party list.
- You must follow any third-party terms that apply, such as your cellular data plan.
- Questions, complaints or claims about the app go to [legal name], [mailing address], hello@earlyletters.com.
- Apple and its subsidiaries are third-party beneficiaries of these Terms and may enforce them against you.

## 19. General

These Terms, the Privacy Policy and the Subscription Terms are the whole agreement. If part is invalid, the rest stays in effect. You may not transfer your rights; we may transfer ours in a sale or merger together with our promises in sections 5.3, 8.3 and 12. If we do not enforce a term right away, we can still enforce it later.

## 20. Contact

[legal name], [mailing address]. hello@earlyletters.com.

California residents: under California Civil Code section 1789.3, you may contact the Complaint Assistance Unit of the Division of Consumer Services of the California Department of Consumer Affairs in writing at 1625 North Market Blvd., Suite N 112, Sacramento, CA 95834, or by telephone at (916) 445-1254 or (800) 952-5210. [Carried from 0.9.0; not re-checked today.]

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-11-23 | First version for the App Store app, from 0.9.0, as PR #672 drafted it on 8 Nov and rebased on the production profile. Removed: the test-version notice, TestFlight and the test server, the 100-letter test allowance, the two-parent book clauses (no store build reaches them, D-162). Added: Plus (section 8) with prices, free periods, renewal, both ways to cancel, refunds and offer codes; Delete account in the app. Proposed, for exec-team review. |
