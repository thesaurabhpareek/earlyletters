---
title: Early Letters in-app and store disclosures
version: 1.4.0
status: draft-for-counsel
effective_date: TBD
last_updated: 2026-10-03
owner: founder
related: terms-of-service.md (1.5.0), subscription-terms.md (1.4.0), packages/content/VOICE.md, docs/legal/memos/lawyer-1.md, docs/legal/memos/q-003-subscription-notices.md
---

> **Drafting notice.** This document was drafted by an AI (Claude) for review by a licensed attorney. It is not legal advice. Notes for counsel appear as **[COUNSEL: ...]**. From 1.4.0 the live strings are in `packages/content` (the single home of every user-facing word); this file records which disclosure each one makes and why, and quotes them as they stood on 3 Oct 2026.

# In-app and store disclosures

The short disclosure strings (early version label, the "it can make mistakes" note, Plus disclosures and reminders, sign-in acceptance, trust lines, store listing), with where each one appears and which legal text backs it. Strings live in `packages/content` so the content rule tests run on them: straight quotes, no em dashes, en dashes, ellipsis characters or emoji. `{child}`, `{price}`, `{date}` and `{cancelBy}` are placeholders filled at runtime. Prices and trial lengths always come from Apple's offer through StoreKit, never from code. `{cancelBy}` is the trial or period end minus 24 hours, shown as a calendar date.

**Voice note.** The brief's example used "We tidy small slips". VOICE.md bans words that suggest software "tidied" a letter, so these strings say "fix small slips" instead, which matches story 2 ("We fix slips of the tongue.").

## 1. Early version label

| Key (packages/content) | Where it appears | String (3 Oct 2026) |
|---|---|---|
| `settings` about `beta.label` | Settings > Help and Legal > About, under the app name and version | Early version |
| `settings` about `beta.body` | Same screen, below the label | {app} is an early version, and it can make mistakes. Some things may change. Export a copy of your letters now and then. |

Rules: show the label quietly (caption style, no badge colour). Never show it on Tonight, Listening, Review or the Book. The store listing never says "beta" (D-060; App Review 2.2). Remove the label in the same release as Terms Section 16.4. The beta ends only when the founder says so (PRD.md K-13).

## 2. "It can make mistakes" note

| Key | Where it appears | String | Chars |
|---|---|---|---|
| `review.firstNote.title` | One-time card at the top of Review, the first time a spoken letter is transcribed on this install | Please have a read | 18 |
| `review.firstNote.body` | Same card | We fix small slips, like "um" and repeats. We can also mishear a word or a name. Please read it before you save. | 112 |
| `review.firstNote.dismiss` | Card button | Got it | 6 |
| `help.mistakes` | Settings > Help and Legal > How transcription works (always available) | Your words are kept as you said them. We can mishear, so read each letter and fix anything we got wrong. | 104 |

Rules: shown once per install, after the first transcript appears and before the first save, so it is seen at the right moment without blocking. It never returns as a nag. It never appears for typed letters. (A web contributor version waits for the web contribution page, which is later than v1.0, D-055.)

**[COUNSEL: The note supports Terms Section 11.5 (user reviews and is responsible). It deliberately does not say "not a medical or legal record" in the product, because that line would read as alarming at a tender moment; that limit lives in the Terms (11.6, 20.3). Confirm this is acceptable.]**

## 3. Plus: Apple's subscription screen, our marketing content, and reminders

From 1.4.0 the purchase screen is Apple's own `SubscriptionStoreView` (ADR 0013, D-053). Apple renders each plan's name, period and localized price, the free trial for eligible people, one subscribe button per plan (so neither is preselected), Restore, and the Terms and Privacy links, which point at https://earlyletters.com/terms and https://earlyletters.com/privacy. We supply only the marketing content above the plans.

| Key (packages/content) | Where | String (3 Oct 2026) | Disclosure it makes |
|---|---|---|---|
| `billingCopy.store.features` | Above Apple's plans | "Read together whenever you like, after the first 3 times in each book." / "Books for more children. Your first book is always free." | What Plus adds (Apple 3.1.2(c)); must match Subscription Terms "What Plus adds" |
| `billingCopy.store.promise` | Same | Writing, reading, playing your recordings, export and writing with your co-parent are free, always. | Terms 13 |
| `billingCopy.store.renewal` | Same | Plans renew automatically until you cancel. To avoid the next charge, cancel at least 24 hours before a free trial or period ends. | Automatic renewal and cancel timing (CA 17602, ROSCA) |
| `billingCopy.store.cancel` | Same | Cancel any time in Settings, Plan, Manage subscription, or in your Apple Account subscriptions. | How to cancel; names Apple only (App Review 2.3.10) |
| `billingCopy.store.family` | Same | Plus can be shared with your family through Apple Family Sharing. | Terms 14.12 |
| `billingCopy.plan.*` | Settings, Plan | Trial end ("Plus is on, free until {date}."), cancel-by ("Cancel by {cancelBy} and you pay nothing."), renewal date, Manage subscription, Restore purchases, Request a refund, "Apple handles payment for Plus. We never see your card details." | The dates the Terms say Settings, Plan always shows (14.6) |
| `plus.legal.*` (strings.en.ts) | Our own Plus sheet before 3 Oct, if still shown anywhere | renewal lines with prices, cancel line, Terms, Privacy, Subscription terms and Restore links, "By continuing, you agree to the Subscription terms and Terms of Service." | Keep only where they cannot contradict Apple's screen. **Request to the content owner:** `renewAnnual` and `renewMonthly` hard-code "Free for 2 months" and "Free for 1 month"; trial eligibility and length come from Apple's offer, so either remove them or fill the length from StoreKit and show them only when Apple reports eligibility |

**New for 1.4.0 (Q-003 position; strings for the content owner to write, counsel to approve):**

| Moment | Where | What it must say |
|---|---|---|
| Purchase confirmation | Sheet after Apple's sheet closes with `purchased` | Plus is on; the trial end date or first charge date; the price after (StoreKit's localized display price) and period; renews until you cancel; cancel at least 24 hours before; how to cancel; "Save a copy" button (share sheet: Mail to yourself, Files, Notes). This replaces `plus.ack.body` "and the same text in the confirmation email": we send no email |
| Reminder ask | Same sheet, once | "Remind me before the free months end" (only for trials) or "Remind me before Plus renews" (annual). On Yes, the system notification prompt; on Not now, in-app notes only |
| Reminders | Local notification (if allowed) plus a note in Settings, Plan and on next open inside the window | Notification text names no child and no price: "Plus renews on {date}. You can change this in Settings, Plan." (trial: "Your free months end on {date}. ..."). The note in Settings, Plan carries the date, price after, cancel-by date and the Manage subscription button. Fires only on the purchaser's phones (`ownershipType` purchased), in the windows of Q-003 memo section 5 |

Rules:
- Nothing above the plans may make the free period look more prominent than Apple's billed price.
- All our marketing content wraps, never truncates, at the largest Dynamic Type size (PRD C-REQ-022, C-NFR-006).
- The Manage subscription row opens Apple's cancel screen in one tap. No offer, survey or extra screen comes before it.
- **Retired in 1.4.0:** the rule "Log paywall version, product, offer and time for each purchase as proof of consent". No server of ours sees purchases (D-053). Proof of consent is Apple's transaction record plus our per-release evidence pack (POLICY_VERSIONING 8; Q-003 memo C-5).
- This is store-required disclosure text, which VOICE and PRD C section 7 allow to state prices, dates and renewal plainly.

**[COUNSEL: Covers Apple DPLA Schedule 2 section 3.8(b) and App Review 3.1.2 (mostly through Apple's component), California 17602 (clear and conspicuous terms near the button, price after the trial, express affirmative consent, retained acknowledgment), Massachusetts (calendar date to cancel by: Apple's screen shows the trial; our confirmation sheet states the date), New York, Utah and the NYC rule. Confirm that Apple's purchase confirmation is express affirmative consent to the renewal terms shown above the plans, and that the in-app confirmation with "Save a copy" is a retained acknowledgment (Q-003 memo C-3, C-10).]**

## 3a. Sign-in acceptance (owner: PRD A, A-REQ-034)

| Key (packages/content) | Where it appears | String (3 Oct 2026) |
|---|---|---|
| `auth` sign-in `agreeLine` (`features/auth.en.ts`) | Above the sign-in buttons (Apple, Google, email link) | By continuing, you confirm you are 18 or older and agree to the Terms of Service and Privacy Policy. |
| `trust.signIn.privacy` | Under the buttons | Only you and the people you invite can read your letters. We never sell them or use them for ads. |
| `trust.signIn.email` | Same | We use your email only to sign you in and to write to you about your account. |

Rule: the acceptance stores the Terms version and time (POLICY_VERSIONING section 7). Terms 1.5 and 2.1 rely on this line. A web contributor acceptance line (`web.legal.accept`) waits for the web contribution page (later than v1.0, D-055).

## 3b. Trust lines (D-061)

Said calmly, word for word, in a few set places (`packages/content` `trust`; VOICE.md "How we talk about privacy"). Each is a public claim backed by a fact the Privacy Policy states.

| Key | String (3 Oct 2026) | Backed by |
|---|---|---|
| `trust.promise` (also App Store, website, welcome email) | Your letters and recordings are private. We never sell them, never use them for ads and never use them to train machine learning models. | Privacy Policy short version and 6; Terms 6.2 |
| `trust.short` | Private by default. Never sold, never used for ads. | Same |
| `trust.voice` | We never imitate your voice. Your original recording is always kept exactly as you made it. | Terms 6.2, 11.2; LEGAL-REQ-019; Privacy Policy 13 |
| `trust.firstRecording.body` | Your words are written down on this phone, and the recording stays with your letter. We never imitate your voice or use it to train machine learning models. | No audio leaves the phone in v1.0 (D-059); on-device transcription |
| `permissions.microphone` (NSMicrophoneUsageDescription) | {app} uses the microphone to record the letters you speak to your child. Your recordings stay on this phone. | app-store-privacy-labels.md section 4 |

**[COUNSEL: "Your recordings stay on this phone" is true in v1.0 for our servers (no upload, no backup, no cloud transcription) and is qualified in the Privacy Policy section 9 for the user's own iPhone backup and for exports the user shares. It becomes false the day audio upload or cloud transcription ships, so those features must change the string in the same release (claims registry, LEGAL-REQ-044). COUNSEL_PACKET Q17.]**

## 4. Store listing

| Key | Where it appears | String (3 Oct 2026, `packages/content/src/store.en.ts`) |
|---|---|---|
| Beta line | Not used. D-060 (founder): the store listing never says beta; App Review 2.2 | (none) |
| Subscription paragraph | App Store description, after the feature list | Writing, reading, playing your recordings, export and writing with your co-parent are free, always. Plus is an optional subscription with a free trial: books for more children, and Read together whenever you like after the first 3 times in each book. It renews automatically until you cancel, and works with Family Sharing. |
| Legal links | Last lines of the description | Terms of Use: https://earlyletters.com/terms Privacy Policy: https://earlyletters.com/privacy |

Rules: no "beta" in the app name, subtitle, description or promotional text. The Consumer Health Data Privacy Policy link (https://earlyletters.com/health-privacy) should also appear on the App Store page, because Washington treats an app's download page as a "homepage" (consumer-health-data-notice.md HN-6). **Request to the content owner:** add a third legal line, "Consumer Health Data Privacy Policy: https://earlyletters.com/health-privacy", unless counsel answers COUNSEL_PACKET Q3 otherwise.

## 5. Where each disclosure is backed in the Terms

| Disclosure | Terms of Service section |
|---|---|
| Early version label | 16.4, 20.2 |
| "It can make mistakes" note | 11.4, 11.5, 20.2, 20.3 |
| Plus marketing content, confirmation sheet and reminders | 14, Subscription Terms |
| 18+ acceptance line | 1.5, 2.1 |
| Trust lines | 6.2, 11.2, 12.1 |
| "Export a copy of your letters" | 12.3, 13 |

## Changelog

| Version | Date | Status | Changes |
|---|---|---|---|
| 1.4.0 | 2026-10-03 | draft-for-counsel | Alignment with D-053 (Apple's SubscriptionStoreView; our marketing content only), D-060 ("Early version" label; no store beta line), D-061 (trust lines and microphone string, new section 3b), D-055 (no web contributor strings in v1.0) and the Q-003 position: confirmation sheet with Save a copy, reminder ask and on-device reminders replace the confirmation email and the per-purchase consent log. Strings now quoted from `packages/content` as of 3 Oct. Requests to the content owner: hard-coded trial lengths in `plus.legal.renew*`; CHD policy link in the store description. Pre-publication; minor. |
| 1.3.0 | 2026-10-03 | draft-for-counsel | Alignment with PRD.md 1.3: `plus.legal.cancel` names only Apple (Plus is sold through the App Store only at v1.0, ADR 0013; App Review 2.3.10 bars other platforms' names in iOS copy); `store.description.betaLine` and `store.promotionalText.beta` marked pending D-030 (recommended: TestFlight beta, no store beta line); `web.legal.accept` ships with the web page in v1.1. Patch-level wording; counsel to confirm. |
| 1.2.0 | 2026-10-02 | draft-for-counsel | Product alignment with PRD.md 1.2: `subscriptionLine` uses "playing your recordings" and matches `store.en.ts` (K-11); beta ends only on the founder's decision (K-13). Patch-level wording; counsel to confirm. |
| 1.1.0 | 2026-10-02 | draft-for-counsel | Consumer-law review: paywall strings take trial length and cancel-by date from the store offer; clearer renewal wording; consent line now names automatic renewal; acknowledgment string; prominence, one-tap cancel and consent-log rules; 18+ acceptance strings (3a); store legal-links gap flagged. Beta and mistakes strings unchanged. |
| 1.0.0 | 2026-10-02 | draft-for-counsel | First draft, prepared by Claude for counsel review, at the founder's request. |
