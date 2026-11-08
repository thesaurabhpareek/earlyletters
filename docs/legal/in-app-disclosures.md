---
title: Early Letters in-app and store disclosures
version: 3.4.0
status: draft-for-counsel
effective_date: TBD
last_updated: 2026-10-31
owner: founder
related: privacy-policy.md (3.0.0), terms-of-service.md (4.1.0), subscription-terms.md (4.1.0), subprocessors.md (2.1.0), app-store-privacy-labels.md (2.1.0), packages/content/VOICE.md
---

# In-app and store disclosures

Drafted for counsel. Not legal advice. The short statements the app, its emails and the App Store listing make about privacy, mistakes, backup and Plus; where each appears; what it must say; and which legal text backs it. The live strings are in `packages/content`, where the content rule tests run on them. This file states what each string must say, not the string itself, so it cannot drift from the copy. Section 3 lists strings in the repo today that say something else; each is a request to the content owner (S16), who owns the words.

## 1. What each disclosure must say (v1.0, option B)

| Disclosure | Where it appears | It must say | Backed by |
|---|---|---|---|
| Early version label | Settings, Help and Legal, About | Early Letters is an early version and can make mistakes; export a copy now and then. Never "beta" in the store listing | Terms 11 |
| "Please have a read" note | Once, on the first spoken letter, before the first keep | We take out small slips and mark each one; we can mishear a name, so read it before you keep it | Terms 6.3 |
| Trust promise | Settings, Privacy (top); website; store listing; welcome email | Your letters and recordings are private; never sold, never used for ads, never used to train machine learning models | Privacy Policy 5; Terms 5.3 |
| Voice line | Where a recording is made or kept | We never imitate your voice; the original recording is kept exactly as made | Privacy Policy 2, 5; Terms 5.3, 6.2 |
| Microphone permission | iOS prompt, shown to every user | What the microphone is for, and nothing about where recordings are kept: a purpose string must be true whatever the person's backup setting | Labels 1.4.0 section 5; F08-REQ-036 |
| Sign-in agreement line | Above the sign-in buttons | By continuing, you confirm you are 18 or older and agree to the Terms of Service and Privacy Policy (versioned links) | Terms 1.3, 2.1; LEGAL-REQ-001 |
| Sign-in privacy line | Under the buttons | Your book is shared only with the co-parent you invite; we don't read it; never sold or used for ads. Not an absolute "only you and the people you invite can read" | Privacy Policy 3; R4 PT-25 |
| Sensitive-data agreement | One screen after a new account, before the first sync | Letters can hold health details about you or {child}; to sync your book and share it with your co-parent we store what you write on our servers; we use it only to keep and show your book; never sold, used for ads or used to train models; how to change it later (build 2 has no withdrawal control, D-128; the sheet must not promise one until it exists); what "Keep on this phone" means | Privacy Policy 9; LEGAL-REQ-006 |
| New-device email (not built; F02-REQ-017) | Sent on every sign-in from a device the account has not used | A new device signed in, when, and a Stop link that signs out everywhere | None yet: the Privacy Policy and Terms add it when it ships (LEGAL-REQ-063) |
| Backup sheet (phone side not built) | Offered once after sign-in, and in Settings, Storage and backup | Encrypted on this phone before it leaves; we keep a recovery key so you can get recordings back on a new phone; our recovery service uses it only to send your key to a new phone, to replace the key, or to answer a valid legal request, logs each use and emails you each time; we never listen to, sell or train on your recordings; other family members cannot hear them yet. One button; the tap is its own agreement | Privacy Policy 4 (which says backup is not available yet until this ships); Terms 7.2; F08 6.7 `backup.sheetBody` |
| Restore waiting, approve and stop | New phone; enrolled phones; Settings, Storage and backup | When recordings will start to come back; that we emailed the owner; Yes, it's mine and Not me; Stop | Privacy Policy 4; F08 6.5 C |
| Backup off (not built) | Settings, Storage and backup | Keep what is backed up, or delete the backup, with nothing preselected; recordings only in backup are brought to the phone first | F08 6.5 D; Privacy Policy 7 adds the line when backup ships |
| Staff access line | Settings, Privacy, footer | We don't look at your letters; the few ways we could are written in the Privacy Policy. Never "every access is logged" until F17 8.2 item 6 (a) to (c) hold | Privacy Policy 3; F17 8.3; R4 PT-03 |
| Keep step and held letter | The save step after the 2 free letters | Plus lets you keep adding letters; this letter waits on this phone (and syncs privately when signed in) and is never discarded. No price, "free trial", "free months" or "we will email you" (D-083) | Terms 8.1; Subscription Terms |
| Plus text above Apple's plans | Apple's subscription view | What Plus adds; every letter you keep stays yours with or without Plus; plans renew until you cancel; cancel at least 24 hours before a period ends; how to cancel; Family Sharing. Apple shows price and trial. Nothing may make the free period look more prominent than Apple's billed amount | Terms 8; Subscription Terms; Apple 3.1.2(c) |
| Purchase confirmation with Save a copy (built, #121) | After Apple's sheet closes with a purchase | Plan; trial end or renewal date; cancel-by date; renews until you cancel; how to cancel; Apple charges and its receipt holds the amount; reminders can come late or not at all; Save a copy. Not met as built if the price after must appear: the build names no amount (D-083); review SUB-04, open for counsel | Subscription Terms "Dates and reminders"; D-094 |
| Plan reminders and in-app note (built, #121) | Local notification on the purchaser's iPhone, if allowed; a note in the app | The date, and where to change or cancel (Settings, Plan). No child name, no letter text, no price. Whether the amount must appear for California 17602(b) is review SUB-03, open for counsel | Subscription Terms "Dates and reminders" |
| Plan reminder emails (not built, WP-F14-16) | Email to the account address of the purchaser | The plan, the published price and period, the trial end or renewal date, the cancel-by date, renews until cancelled, the cancel steps, "If you have already cancelled, there is nothing to do.", and that letters and recordings stay free to read, play and export. No offer | None yet: Subscription Terms "Dates and reminders" adds email when it ships; CATALOG section 7 |
| Delete account screen | Settings, Your data. Hidden in both alpha builds unless the build switch is on (D-129) | What happens per book, including that a former member's letters stay theirs and the book's entry (child's name, birth date and due date) is kept to label them (D-116); export first; Plus is not cancelled (opens Manage subscription); type delete to confirm; the date; what we keep and why (the kept records in Privacy Policy 7). When backup ships: recordings only in backup brought here first | Privacy Policy 7; Terms 10.1; `delete-account-page.md` |
| Store listing legal links | Last lines of the description | Terms of Service and Privacy Policy ("Terms of Service", not "Terms of Use", review LNG-34). A Consumer Health Data Privacy Policy link only if counsel says a separate notice is needed (COUNSEL_PACKET Q32) | Privacy Policy 9 |

## 2. Rules

- Never say "only your family's keys", "only you can play", "end-to-end" about letters or backup, "anonymous", or that we "cannot" read letters or listen to recordings (D-102; F08 6.7; LEGAL-REQ-044).
- Never say recordings "stay on this phone" in any string a person with backup on can see. Say where they are for that person.
- Never claim the local database is encrypted beyond iOS Data Protection (LEGAL-REQ-022(d)).
- Prices and trial lengths appear only in Apple's views and in our emails (from `packages/content/src/pricing.ts`), never typed into app copy (D-083).
- Reminders are always described as a courtesy that can come late or not at all; Settings, Plan and Apple's receipts hold every date (D-094).
- Manage subscription opens Apple's screen in one tap, with nothing in between.
- The store listing never says "beta" (D-060). The in-app early-version note stays.
- Straight quotes, no dashes, ellipsis characters or emoji. `{child}` and `{app}` are filled at run time.

## 3. Strings in the repo today that say something else (requests to S16)

Read on `origin/develop` at 4183844 on 15 Oct 2026, and re-checked at ef79bd3 on 16 Oct 2026 (all still present).

| Key | File | Today | What it must say instead |
|---|---|---|---|
| `permissions.microphone` | `packages/content/src/permissions.en.ts`, `apps/mobile/src/lib/permission-copy.ts` | Ends "Your recordings stay on this phone." | The first sentence only (labels 1.4.0 section 5) |
| `trust.firstRecording.title`, `.body` | `strings.en.ts` | "Your voice stays here"; "the recording stays with your letter" | A line true with backup on, for example "Your voice, kept as you made it" (counsel to approve) |
| `trust.signIn.privacy` | `strings.en.ts` | "Only you and the people you invite can read your letters." | Section 1, sign-in privacy line |
| `trust.short` | `strings.en.ts` | "Private by default." | Keep only with the sign-in privacy line beside it, if counsel accepts (COUNSEL_PACKET Q43) |
| `sensitiveConsent.body` | `strings.en.ts` | "share it with the family you choose" | "share it with your co-parent" (gap G-21) |
| `sensitiveConsent.declineHelp` comment | `strings.en.ts` | "v1.0 has no backup (D-059)" | Backup ships in v1.0; the backup sheet carries its own agreement |
| `keepGate.heldNote` | `features/billing.en.ts` | "This letter is safe on your phone." | "This letter is waiting on this phone." (R4 PT-13) |
| Store listing header comment and "both your voices" | `store.en.ts` | "no backup of our own in v1.0 (D-085)" | Owner backup is v1.0 (D-073, D-100); no family listening claim |
| `settings.privacy.staffAccess` (new) | not yet in content | | Section 1, staff access line |
| `coparent-invite` subject | `packages/content/src/emails/family.en.ts` | "{inviter} invited you to write together" | Consistent with Privacy Policy 5 as drafted ("An invitation to share a book names the parent who sent it"). Optional, from review A on PR #163: a subject without the name. If S16 drops it, Privacy 5 can stay as it is |

## Changelog

| Version | Date | Status | Changes |
|---|---|---|---|
| 3.4.0 | 2026-10-31 | draft-for-counsel | The "Backed by" Terms numbers are back to the plain-form Terms (4.1.0), whose section numbers are the ones 3.1.0 cited. Related versions updated. The Terms and Subscription Terms now carry develop's 4.0.0 content (D-082, D-083) in plain form. Version 3.4.0 because 3.3.0 is used (POLICY_VERSIONING 2.4). Records only. Minor. |
| 3.3.0 | 2026-10-31 | draft-for-counsel | Merge of develop (31 Oct 2026) into the table form of PR #163. Kept #163's must-say table. Took from develop 3.2.0: related versions (Terms 4.0.0, Subscription Terms 4.0.0), the store legal link label "Terms of Service" (review LNG-34), and the open flags on the confirmation and reminder rows (reviews SUB-03, SUB-04: the build names no amount, D-083). Also in 3.3.0: the delete-account row and sensitive-data row no longer imply in-app withdrawal or deletion exists in every build (D-128, D-129), the delete row adds a former member's kept letters (D-116), and the Terms and Subscription Terms are the plain-form 4.1.0 texts. The develop 3.2.0 string quotes are not copied: this file states what each string must say, not the string. Version 3.3.0 because 3.1.0 and 3.2.0 are used (POLICY_VERSIONING 2.4). Minor. |
| 3.2.0 | 2026-10-31 | draft-for-counsel | Section 3 and 4 quotes brought up to the strings on develop for the D-082 membership (store subtitle, features, promise; store listing subscription paragraph and its Terms of Service link label, LNG-34); confirmation and reminder rows marked where the build, under D-083, names no amount (review SUB-02 to SUB-04). Related versions: Terms 4.0.0, Subscription Terms 4.0.0. Version 3.2.0 because 1.5.0, 2.0.0, 3.0.0 and 3.1.0 were used by unmerged drafts on other branches (POLICY_VERSIONING 2.4). Records only; no string changes here. Minor. |
| 3.1.0 | 2026-10-16 | draft-for-counsel | Rewritten for option B (founder, 15 Oct 2026): sign-in lines, sensitive-data agreement naming the co-parent, new-device email, backup sheet and restore lines with the recovery key (D-102), staff access line, Keep step, the purchase confirmation and phone reminders built in #121 (D-094), reminder emails (D-080), delete account screen, and the store legal links (no separate health notice link unless counsel requires one, Q32). References follow the short published drafts of 15 Oct. Keeps the 3.0.0 table form (pull request #81, never merged; superseded): what each string must say, not the string. Section 3 lists the repo strings that say otherwise, as requests to S16. 16 Oct (review of PR #163): new-device email, backup sheet, backup off and reminder emails marked not built; the backup sheet names the three uses of the recovery key; the invite email subject listed. |
| 3.0.0 | 2026-10-04 | not merged | Draft for an on-device v1.0 (pull request #81). The number is retired, not reused. |
| 1.4.0 | 2026-10-03 | draft-for-counsel | Draft for the server version as decided on 3 Oct 2026, quoting the strings of that day. Earlier text and its changelog are in git history. |
| 1.3.0 | 2026-10-03 | draft-for-counsel | Alignment with PRD.md 1.3: `plus.legal.cancel` names only Apple (Plus is sold through the App Store only at v1.0, ADR 0013; App Review 2.3.10 bars other platforms' names in iOS copy); `store.description.betaLine` and `store.promotionalText.beta` marked pending D-030 (recommended: TestFlight beta, no store beta line); `web.legal.accept` ships with the web page in v1.1. Patch-level wording; counsel to confirm. |
| 1.2.0 | 2026-10-02 | draft-for-counsel | Product alignment with PRD.md 1.2: `subscriptionLine` uses "playing your recordings" and matches `store.en.ts` (K-11); beta ends only on the founder's decision (K-13). Patch-level wording; counsel to confirm. |
| 1.1.0 | 2026-10-02 | draft-for-counsel | Consumer-law review: paywall strings take trial length and cancel-by date from the store offer; clearer renewal wording; consent line now names automatic renewal; acknowledgment string; prominence, one-tap cancel and consent-log rules; 18+ acceptance strings (3a); store legal-links gap flagged. Beta and mistakes strings unchanged. |
| 1.0.0 | 2026-10-02 | draft-for-counsel | First draft, prepared by Claude for counsel review, at the founder's request. |
