---
title: Early Letters in-app and store disclosures
version: 1.5.0
status: draft-for-counsel
effective_date: TBD
last_updated: 2026-10-15
owner: founder
related: terms-of-service.md (1.6.0), subscription-terms.md (1.5.0), privacy-policy.md (1.5.0), docs/prd/v2/features/F08-recordings.md (6.5, 6.7), F14-plus.md (6.6), F17-settings-privacy.md (6.2 B, 8.3), F21-store-web.md (6.5), packages/content/VOICE.md, docs/legal/memos/lawyer-1.md, docs/legal/memos/q-003-subscription-notices.md
---

> **Draft for counsel review, not legal advice.** This document was drafted by an AI (Claude) as drafting support, for review by a licensed attorney. Notes for counsel appear as **[COUNSEL: ...]**. From 1.4.0 the live strings are in `packages/content` (the single home of every user-facing word); this file records which disclosure each one makes and why. Version 1.5.0 proposes the server-on v1.0 wording (M14, M16; D-089, D-091) for counsel; where a string changes, the table gives the 3 Oct text and the proposed text. The content lane (S16) owns the final strings in `packages/content`; this lane does not edit them. Nothing here ships until counsel approves it (M16: "counsel approves every backup line before it ships").

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
| `review.firstNote.body` | Same card | We take out small slips, like an um or a repeat, and mark each one. Tap a mark to see it and put it back. We can mishear a name, so please read it before you save. | 163 |
| `review.firstNote.dismiss` | Card button | Got it | 6 |
| `help.mistakes` | Settings > Help and Legal > How transcription works (always available) | Your words are kept as you said them. We can mishear, so read each letter and fix anything we got wrong. | 104 |

**[LEGAL-ALIGNMENT: text changed 4 Oct 2026 under D-086 (debate Q-013 edit-trust-and-words); it now says what the app does and how to undo it. Needs a read by legal-alignment before it ships: it is disclosure text. The onboarding promise body (`onboarding.promise.body`) changed in the same decision.]**

Rules: shown once per install, after the first transcript appears and before the first save, so it is seen at the right moment without blocking. It never returns as a nag. It never appears for typed letters. (A web contributor version waits for the web contribution page, which is later than v1.0, D-055.)

**[COUNSEL: The note supports Terms Section 11.5 (user reviews and is responsible). It deliberately does not say "not a medical or legal record" in the product, because that line would read as alarming at a tender moment; that limit lives in the Terms (11.6, 20.3). Confirm this is acceptable.]**

## 3. Plus: Apple's subscription screen, our marketing content, and reminders

From 1.4.0 the purchase screen is Apple's own `SubscriptionStoreView` (ADR 0013, D-053). Apple renders each plan's name, period and localized price, the free trial for eligible people, one subscribe button per plan (so neither is preselected), Restore, and the Terms and Privacy links, which point at https://earlyletters.com/terms and https://earlyletters.com/privacy. We supply only the marketing content above the plans.

| Key (packages/content) | Where | String (3 Oct 2026) | Disclosure it makes |
|---|---|---|---|
| `billingCopy.store.features` | Above Apple's plans | 3 Oct: "Read together whenever you like, after the first 3 times in each book." / "Books for more children. Your first book is always free." **Proposed (1.5.0):** "Keep every new letter, after your first 2." | What Plus adds (Apple 3.1.2(c)); must match Subscription Terms 1.5.0 "What Plus adds" (M1, M2; D-082, D-083) |
| `billingCopy.store.promise` | Same | 3 Oct: "Writing, reading, playing your recordings, export and writing with your co-parent are free, always." **Proposed (1.5.0):** "Every letter you write stays yours to read, play and export, with or without Plus." | Terms 1.6.0 section 13.3 (R4 PT-13; M1) |
| `billingCopy.store.renewal` | Same | Plans renew automatically until you cancel. To avoid the next charge, cancel at least 24 hours before a free trial or period ends. | Automatic renewal and cancel timing (CA 17602, ROSCA) |
| `billingCopy.store.cancel` | Same | Cancel any time in Settings, Plan, Manage subscription, or in your Apple Account subscriptions. | How to cancel; names Apple only (App Review 2.3.10) |
| `billingCopy.store.family` | Same | Plus can be shared with your family through Apple Family Sharing. | Terms 14.12 |
| `billingCopy.plan.*` | Settings, Plan | Trial end ("Plus is on, free until {date}."), cancel-by ("Cancel by {cancelBy} and you pay nothing."), renewal date, Manage subscription, Restore purchases, Request a refund, "Apple handles payment for Plus. We never see your card details." | The dates the Terms say Settings, Plan always shows (14.6) |
| `plus.legal.*` (strings.en.ts) | Our own Plus sheet before 3 Oct, if still shown anywhere | renewal lines with prices, cancel line, Terms, Privacy, Subscription terms and Restore links, "By continuing, you agree to the Subscription terms and Terms of Service." | Keep only where they cannot contradict Apple's screen. **Request to the content owner:** `renewAnnual` and `renewMonthly` hard-code "Free for 2 months" and "Free for 1 month"; trial eligibility and length come from Apple's offer, so either remove them or fill the length from StoreKit and show them only when Apple reports eligibility |

**[COUNSEL: 1.5.0 changes for the membership and the status report. "Free, always" is withdrawn (M1, D-082); the replacement is R4 PT-13's scoped sentence. Read together and books for more children leave Plus (M2). D-083 forbids price, "free trial" or "we will email you" in our app copy outside store-required disclosure; Apple's view carries price and trial. `plus.legal.renewAnnual` and `renewMonthly` still hard-code trial lengths (request to S16 from 1.4.0 stands).]**

**Confirmation and reminders (1.4.0 Q-003 position, updated in 1.5.0 for D-080 and D-081; strings for the content owner to write, counsel to approve):**

| Moment | Where | What it must say |
|---|---|---|
| Purchase confirmation | Sheet after Apple's sheet closes with `purchased` | Plus is on; the trial end date or first charge date; the price after (StoreKit's localized display price) and period; renews until you cancel; cancel at least 24 hours before; how to cancel; "Save a copy" button (share sheet: Mail to yourself, Files, Notes). **1.5.0:** signed in, the same terms also arrive by email within 1 hour (`trial-started` or `plus-started`, D-080, F14 6.6); the sheet may say so only in store-required disclosure (D-083). Signed out, no email is sent and the sheet is the only acknowledgment (F14 Q-C1, Q-C2) |
| Reminder ask | Same sheet, once | "Remind me before the free months end" (only for trials) or "Remind me before Plus renews" (annual). On Yes, the system notification prompt; on Not now, in-app notes only |
| Reminders | Local notification (if allowed) plus a note in Settings, Plan and on next open inside the window | Notification text names no child and no price: "Plus renews on {date}. You can change this in Settings, Plan." (trial: "Your free months end on {date}. ..."). The note in Settings, Plan carries the date, price after, cancel-by date and the Manage subscription button. Fires only on the purchaser's phones (`ownershipType` purchased), in the windows of F14 6.6 (keyed on the free period and offer type, R4 PT-10) |
| Reminder emails (new in 1.5.0) | Email to the account address, signed in, purchaser only | Templates in `packages/content/src/emails/billing.en.ts` (S16 and the email lane). Each carries the date, the plan's published price (`{price}`, US only), the cancel-by date, how to cancel, and "If you have already cancelled, there is nothing to do." (D-080 rule). No child name, no letter text, no offer. Sent only for `environment = production`. Never a push and an email on the same day for the same notice (F14 6.6 phone rule 6) |
| Redeem a code (new in 1.5.0) | Settings, Plan | One row opening Apple's redemption sheet (M5, D-052 main). No code system of ours |

Rules:
- Nothing above the plans may make the free period look more prominent than Apple's billed price.
- All our marketing content wraps, never truncates, at the largest Dynamic Type size (PRD C-REQ-022, C-NFR-006).
- The Manage subscription row opens Apple's cancel screen in one tap. No offer, survey or extra screen comes before it.
- **Restored in 1.5.0 (D-081):** the first status report after a purchase records the product, offer type, the Subscription Terms version shown (`none_outside_app` for a code redeemed outside the app) and the time, one record per original purchase. The per-release evidence pack stays as a second source (POLICY_VERSIONING 8). 1.4.0 had retired the consent log because no server saw purchases (D-053); D-080 and D-081 reverse that for status and consent facts only.
- This is store-required disclosure text, which VOICE and PRD C section 7 allow to state prices, dates and renewal plainly.

**[COUNSEL: Covers Apple DPLA Schedule 2 section 3.8(b) and App Review 3.1.2 (mostly through Apple's component), California 17602 (clear and conspicuous terms near the button, price after the trial, express affirmative consent, retained acknowledgment), Massachusetts (calendar date to cancel by: Apple's screen shows the trial; our confirmation sheet states the date), New York, Utah and the NYC rule. Confirm that Apple's purchase confirmation is express affirmative consent to the renewal terms shown above the plans, and that the in-app confirmation with "Save a copy" is a retained acknowledgment (Q-003 memo C-3, C-10).]**

## 3a. Sign-in acceptance (owner: PRD A, A-REQ-034)

| Key (packages/content) | Where it appears | String (3 Oct 2026) |
|---|---|---|
| `auth` sign-in `agreeLine` (`features/auth.en.ts`) | Above the sign-in buttons (Apple, Google, email link) | By continuing, you confirm you are 18 or older and agree to the Terms of Service and Privacy Policy. |
| `trust.signIn.privacy` | Under the buttons | 3 Oct: "Only you and the people you invite can read your letters. We never sell them or use them for ads." **Proposed (1.5.0):** "Your book is shared only with the co-parent you invite. We don't read it. We never sell your letters or use them for ads." |
| `trust.signIn.email` | Same | 3 Oct: "We use your email only to sign you in and to write to you about your account." **Proposed (1.5.0):** "We use your email to sign you in and to write to you about your account and your Plan." |

**[COUNSEL: 1.5.0. `trust.signIn.privacy` does not hold as an absolute: letter text is not end-to-end encrypted and backup has a recovery key we hold (R4 PT-25; F21 6.5 row 17; M16). The replacement is R4's. `trust.signIn.email` must cover the security emails (new sign-in, restore requests, each use of the recovery key; F02-REQ-017, F08 6.5 C7) and billing reminders (D-080), which "only ... about your account" arguably does not. COUNSEL_PACKET Q17.]**

Rule: the acceptance stores the Terms version and time (POLICY_VERSIONING section 7). Terms 1.5 and 2.1 rely on this line. A web contributor acceptance line (`web.legal.accept`) waits for the web contribution page (later than v1.0, D-055).

## 3b. Trust lines (D-061)

Said calmly, word for word, in a few set places (`packages/content` `trust`; VOICE.md "How we talk about privacy"). Each is a public claim backed by a fact the Privacy Policy states.

| Key | String (3 Oct 2026) | Proposed for the server-on v1.0 (1.5.0) | Backed by |
|---|---|---|---|
| `trust.promise` (also App Store, website, welcome email) | Your letters and recordings are private. We never sell them, never use them for ads and never use them to train machine learning models. | Unchanged, subject to counsel (Q17 (c)) | Privacy Policy short version and 6; Terms 6.2 |
| `trust.short` | Private by default. Never sold, never used for ads. | Unchanged only if counsel accepts "Private by default" with "Your book is shared only with the co-parent you invite. We don't read it." beside it where space allows (R4 PT-25) | Same |
| `trust.voice` | We never imitate your voice. Your original recording is always kept exactly as you made it. | Unchanged | Terms 6.2, 11.2; LEGAL-REQ-019; Privacy Policy 13 |
| `trust.firstRecording.title` | Your voice stays here | Your voice, kept as you made it | F21 6.5 row 18 (R4 PT-01) |
| `trust.firstRecording.body` | Your words are written down on this phone, and the recording stays with your letter. We never imitate your voice or use it to train machine learning models. | Your words are written down on this phone, and the recording is kept with your letter. We never imitate your voice or use it to train machine learning models. | On-device transcription (Privacy Policy 4); the recording is kept with the letter on the phone whatever the backup setting; F08 6.5 claims table row (F08-REQ-037) |
| `permissions.microphone` (NSMicrophoneUsageDescription) | {app} uses the microphone to record the letters you speak to your child. Your recordings stay on this phone. | **{app} uses the microphone to record the letters you speak to your child.** | F08-REQ-036: keep only the first sentence. A purpose string is shown by iOS to every user and must be true whatever their backup setting (R4 PT-01). Must match `packages/content/src/permissions.en.ts` and `apps/mobile/src/lib/permission-copy.ts` (owned by S16 and S20); labels 1.4.0 section 4 |
| `settings.privacy.promise` (new, F17) | none | We never sell your letters, use them for ads or use them to train machine learning models. | F17 6.2 B; F17-REQ-004 (matches `sensitiveConsent.use`); LEGAL-REQ-016 |
| `settings.privacy.staffAccess` (new, F17) | none (the earlier draft said "each one is logged") | We don't look at your letters or listen to your recordings. The few ways we could, and the limits on each, are in our Privacy Policy. | Privacy Policy 1.5.0 section 7; F17 6.2 B, F17-REQ-027; R4 PT-03. Says nothing about logging until database audit, the escrow release check and a written quarterly review are live and counsel approves (F17 8.2 item 6) |
| `sensitiveConsent.body` | (3 Oct text names "the family you choose") | Must name the co-parent (gap G-21, S16). CHD HN-4 proposes: "Letters can hold private things, like health details about you or {child}. To sync your book and share it with your co-parent, we store what you write on our servers. We use it only to keep and show your book. We never sell it, use it for ads or train AI on it. You can change this any time in Settings, Privacy." | CHD 1.3.0 section 4; LEGAL-REQ-006 |
| `settings.privacy.sensitiveOff.*` (new, F17) | none | Includes: "Letters already synced stay on our server, and in {child}'s book for {coParent}, until you delete them or your account." Delete option above Stop syncing | F17 6.2 B step 3; R4 PT-23; CHD 1.3.0 section 4 |
| `coParent.cantTakeBack` (new, F11) | none | "Letters already on {coParent}'s phone or in an export can't be taken back." (R4 PT-15 wording; final words S16) | F11-REQ-027; Terms 1.6.0 8.1, 8.5 |

**[COUNSEL: 1.5.0. The 1.4.0 note said "Your recordings stay on this phone" was true in v1.0 and "becomes false the day audio upload or cloud transcription ships". With owner backup in v1.0 (D-073, M14), that day is v1.0; the microphone string drops its second sentence for every user (F08-REQ-036; R4 PT-01), and no string anywhere says "only you can play them", "only your family's keys", "end-to-end", "lost" or "only copy" (F08 6.7 never-list; M16). The staff line no longer claims logging (F17-REQ-027). COUNSEL_PACKET Q17 (R4 rank 3).]**

## 3c. Recording backup lines (new in 1.5.0)

Proposed first drafts from F08 6.7 (S16 owns the final words; counsel approves every backup line before it ships, M16). Each is a registered claim (LEGAL-REQ-044) with the facts F08 6.5 proves.

| Key | Where | Proposed text | Disclosure it makes and what it rests on |
|---|---|---|---|
| `backup.title`, `backup.turnOnButton` | Settings, Storage and backup; the turn-on sheet | Back up my recordings | Opt-in entry point; off until the owner turns it on (F08 6.5 A1) |
| `backup.sheetTitle` | Turn-on sheet | Back up your recordings | |
| `backup.sheetBody` | Turn-on sheet | Your recordings are encrypted on this phone before they leave it. We keep a recovery key so you can get them back on a new phone. We use it only through our recovery service, which logs every use and emails you each time. We never listen to your recordings, sell them or use them to train models. | The only logging claim allowed in the product, scoped to the recovery service (F17-REQ-027; R8 R2A-01). Rests on the append-only `escrow_unwraps` log, its daily copy outside database backups and an email per use (F08 6.5 C6, C7; F08-REQ-029, -042). The honest limit is in Privacy Policy 1.5.0 section 7 (F08 6.5 C). Breaks if the key is used outside the function without the owner being told, the log stops being append-only, or an email per use stops. Tapping the button records the `backup` consent act (F08-REQ-039) |
| `backup.sheetNotIncluded` | Turn-on sheet | Other family members can't hear your recordings yet. Listening copies stay on this phone. | D-073 (family listening is v1.1); listening copies are never uploaded (F08 section 8) |
| `backup.lastBackedUp` | Settings row | Backed up {date} | Only after `backup_confirm` succeeds (F08 6.5 A6) |
| `backup.restoreWaiting` | New phone | Your recordings will start coming back by {time}. We emailed you to check it's you. If you still have your old iPhone, open the app there to say yes sooner. | 24 h or 72 h hold and email (F08 6.5 C2, C3) |
| `backup.approveTitle`, `.approveBody`, `.approveButton`, `.notMeButton` | Enrolled phones | Is this your new iPhone? / A new iPhone asked for your recordings. / Yes, it's mine / Not me | F08 6.5 C3 |
| `backup.pendingTitle`, `backup.pendingStop` | Settings, Storage and backup | A new iPhone is waiting for your recordings / Stop it | F08 6.5 C3 |
| `stop.pageTitle`, `.pageBody`, `.button`, `.done` | earlyletters.com/stop (web, F21) | Stop this? / If you didn't ask for this, stop it here. We'll cancel the request and sign out every device. / Stop this and sign out everywhere / Done. Every device is signed out. Sign in again with your email or Apple or Google. | Scanner-safe Stop page (F08 6.5 C4; R8 R2A-08) |
| `backup.onlyInBackup`, `backup.bringHere` | Before turning off with delete, and before account deletion | {count} of your recordings are only in your backup right now. / Bring them to this phone | F08 6.5 D1, D2 |
| `backup.offTitle`, `.offKeep`, `.offDelete` | Turn-off sheet | Turn off backup? / Keep what's backed up / Delete the backup | Two equal choices, nothing preselected; withdraw act recorded (F08 6.5 D3) |
| `backup.restoreUnavailable` | New phone | Your recordings will come back when we can reach them. | F08-U19 |
| `backup.quotaReached` | Settings row | New recordings are not being backed up. Write to us and we'll help. | 5 GB per account (F08 6.5 F) |

Never in any backup line: "only you can play them", "only your family's keys", "end-to-end", "lost", "only copy", fear or urgency (F08 6.7; M16; content rules). Whether backup is free or Plus is proposed only (D-093 item 2); no line says either.

**[COUNSEL: Q32 (R4 rank 2). (a) Is `backup.sheetBody` enough notice for a consent act, given the honest limit sits in the Privacy Policy, or should the sheet link to Privacy Policy section 7? (b) Does "We never listen to your recordings" read fairly beside a legal-order use? (c) Is a separate `backup` act needed, or can the sensitive-data consent cover it (F08 Q6)?]**

## 4. Store listing

| Key | Where it appears | String (3 Oct 2026, `packages/content/src/store.en.ts`) |
|---|---|---|
| Beta line | Not used. D-060 (founder): the store listing never says beta; App Review 2.2 | (none) |
| Subscription paragraph | App Store description, after the feature list | 3 Oct: "Writing, reading, playing your recordings, export and writing with your co-parent are free, always. Plus is an optional subscription with a free trial: books for more children, and Read together whenever you like after the first 3 times in each book. It renews automatically until you cancel, and works with Family Sharing." **Proposed (1.5.0):** "Your first 2 letters are free. Plus is a membership with a free trial that lets you keep every new letter after that. Every letter you write stays yours to read, play and export, with or without Plus. Plus renews automatically until you cancel, and works with Family Sharing." |
| Private by default paragraph | App Store description | "Only you and the people you invite can read your book" | **Proposed (1.5.0):** "Your book is shared only with the co-parent you invite. We don't read it." Keep "Private by default" only if counsel accepts it with this sentence beside it (R4 PT-25; F21 6.5 row 17) |
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
| Recording backup lines | 6.2, 12.2; Privacy Policy 7 |
| "Export a copy of your letters" | 12.4, 13 |

## Changelog

| Version | Date | Status | Changes |
|---|---|---|---|
| 1.5.0 | 2026-10-15 | draft-for-counsel | Server-on v1.0 wording proposed for counsel (M14, M16; D-089, D-091). **Microphone purpose string** keeps only its first sentence, dropping "Your recordings stay on this phone." (F08-REQ-036; R4 PT-01). `trust.firstRecording.*` reworded so it holds for backup users (F21 6.5 row 18). `trust.signIn.privacy` and the store "Private by default" paragraph replaced with "Your book is shared only with the co-parent you invite. We don't read it." (R4 PT-25). `trust.signIn.email` widened for security and billing emails (F02-REQ-017; D-080). New rows: `settings.privacy.promise`, `settings.privacy.staffAccess` without a logging claim (F17-REQ-027; R4 PT-03), `sensitiveConsent.body` naming the co-parent (G-21), the withdrawal "stay on our server" line (R4 PT-23), `coParent.cantTakeBack` (R4 PT-15). New section 3c: recording backup lines from F08 6.7, with the one scoped logging claim and the never-list (M16; R8 R2A-01). Plus: "free, always" replaced by the scoped sentence (M1; R4 PT-13); features list is keeping new letters after the first 2 (M1, M2); confirmation email and reminder emails (D-080, F14 6.6); consent record restored (D-081); Redeem a code row (M5). Section 5 references updated to Terms 1.6.0. The 3 Oct strings are kept beside each proposal so the change is visible. Pre-publication; counsel to classify. |
| 1.4.0 | 2026-10-03 | draft-for-counsel | Alignment with D-053 (Apple's SubscriptionStoreView; our marketing content only), D-060 ("Early version" label; no store beta line), D-061 (trust lines and microphone string, new section 3b), D-055 (no web contributor strings in v1.0) and the Q-003 position: confirmation sheet with Save a copy, reminder ask and on-device reminders replace the confirmation email and the per-purchase consent log. Strings now quoted from `packages/content` as of 3 Oct. Requests to the content owner: hard-coded trial lengths in `plus.legal.renew*`; CHD policy link in the store description. Pre-publication; minor. |
| 1.3.0 | 2026-10-03 | draft-for-counsel | Alignment with PRD.md 1.3: `plus.legal.cancel` names only Apple (Plus is sold through the App Store only at v1.0, ADR 0013; App Review 2.3.10 bars other platforms' names in iOS copy); `store.description.betaLine` and `store.promotionalText.beta` marked pending D-030 (recommended: TestFlight beta, no store beta line); `web.legal.accept` ships with the web page in v1.1. Patch-level wording; counsel to confirm. |
| 1.2.0 | 2026-10-02 | draft-for-counsel | Product alignment with PRD.md 1.2: `subscriptionLine` uses "playing your recordings" and matches `store.en.ts` (K-11); beta ends only on the founder's decision (K-13). Patch-level wording; counsel to confirm. |
| 1.1.0 | 2026-10-02 | draft-for-counsel | Consumer-law review: paywall strings take trial length and cancel-by date from the store offer; clearer renewal wording; consent line now names automatic renewal; acknowledgment string; prominence, one-tap cancel and consent-log rules; 18+ acceptance strings (3a); store legal-links gap flagged. Beta and mistakes strings unchanged. |
| 1.0.0 | 2026-10-02 | draft-for-counsel | First draft, prepared by Claude for counsel review, at the founder's request. |
