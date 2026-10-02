---
title: Early Letters Privacy Policy
version: 1.0.0
status: draft-for-counsel
effective_date: TBD
owner: founder
reviewers: outside privacy counsel (TBD)
---

> **Drafting notice.** This document was drafted by an AI (Claude) acting as privacy counsel and privacy engineer, for review by a licensed attorney. It is not legal advice and must not be published until counsel has reviewed it. Text in square brackets like [CN-4] points to a numbered note for counsel in Appendix A; remove those tags, Appendix A and this notice before publishing. Placeholders in braces ({COMPANY_LEGAL_NAME}, {COMPANY_ADDRESS}, {PRIVACY_EMAIL}) must be filled in.

# Early Letters Privacy Policy

Version 1.0.0. Effective date: TBD.

Early Letters is a memory book you fill by talking. Parents and close family speak or type notes and letters to a child. This policy explains what we collect, why, who helps us run the service, how long we keep things, and the choices you have. We have tried to write it the way we write everything else: plainly.

## The short version

- **Your words stay yours.** We never sell your data, never share it for advertising, and never use your letters, recordings or photos to train AI models.
- **Recordings stay on your phone by default.** They leave your phone only if you turn on backup, ask for help with transcription, or a family member sends one from the web page. Backups are encrypted on your phone before upload.
- **Transcription happens on your phone.** If your phone can't do it, we ask before sending any audio to an outside service, and that service does not keep it.
- **Letter text syncs to our servers** so your family can read the book and you can get it back on a new phone. It is protected by access rules and encryption at rest, but it is not end-to-end encrypted, so we could technically read it. We only do so in the narrow cases described in section 7.
- **Analytics are off until you say yes,** and they never include content: no letter text, no names, no recordings, no child details.
- **You can export or delete everything, any time, for free.**

## 1. Who we are

Early Letters is run by {COMPANY_LEGAL_NAME}, a California company at {COMPANY_ADDRESS} ("we", "us"). We decide how and why your information is used, so we are responsible for it. Reach us at {PRIVACY_EMAIL}. [CN-1]

## 2. What this policy covers

This policy covers:

- the Early Letters app for iPhone (and for Android when it launches),
- the family contribution web page that grandparents and other family can use without the app,
- our website and waitlist.

It does not cover Apple, Google or other companies you deal with directly, such as when you buy through the App Store or sign in with Apple or Google. Their own privacy policies apply to what they collect.

Early Letters is for adults. You must be 18 or older to create an account or write in a book, and we ask you to confirm this when you create an account or send a letter from the web page. A book is *about* a child, but the child does not use Early Letters. See section 12.

## 3. What we collect

We collect only what the book needs. Many things never leave your phone. The table shows where each kind of information lives.

| What | Examples | Where it comes from | Where it lives |
|---|---|---|---|
| Account | Email address; name from Sign in with Apple (if you share it); a random account ID; which sign-in methods you linked; the version of the Terms and this policy you accepted, and when | You, Apple or Google when you sign in | Your phone and our database |
| Your profile | Display name, what the child calls you ("Papa", "Nani"), optional photo, languages you speak with the child, Hindi script preference, what matters to you, reminder and appearance settings | You | Your phone and our database (languages, goals and preferences in an owner-only table) |
| Child profile | Child's name or nickname, birthday or due date (or month only), optional photo, book theme | You | Your phone and our database |
| Letters and notes | The words you speak or type, the original transcript (kept unchanged), each small fix the app made and whether you kept it, the final text, the date, whether it is in the book, sealed-until date | You | Your phone and our database once you sign in |
| Recordings | The audio of spoken letters | You | **Your phone only**, unless you turn on backup, use server transcription, or contribute from the web page (see section 4) |
| Photos | A photo you attach to a letter or profile | You | Your phone and our private storage |
| Names and words | Spellings for names, nicknames, places and home words, and how the microphone tends to mishear them | You, and the app (from your profile) | Your phone and our database |
| Family and invites | Who is in the book, their role and relationship ("Nani"), invites you send (we keep only a scrambled fingerprint of each invite link, never the link itself), approvals | You and your family | Our database |
| Web contributions | A family member's name and relationship, their recording (encrypted in their browser before upload) or typed letter, and a private return link (stored only as a scrambled fingerprint) | The family member | Our database and private storage |
| Purchases | Whether a book has Plus, product, trial and renewal dates, refunds. We never see your card details. | Apple or Google, through RevenueCat | RevenueCat and our database |
| App usage (only if you agree) | Which screens and features are used, as counts and categories (for example "letter saved, spoken, 1 to 2 minutes"), app version, device model and OS version, a random analytics ID | The app, after you say yes | PostHog |
| Crash reports (only if you agree) | Technical details of a crash or error, with letter text, names and links removed before sending | The app, after you say yes | Sentry |
| Support cards | That the app showed a support card, and when. Never the words that led to it. | The app | Your phone only [CN-10] |
| Support messages | What you write to us, and the app version and plan state if you choose to include them | You | Our email provider |
| Encryption keys | Keys that lock your recording backups | The app | Your iCloud Keychain, your family members' devices, and (in Standard backup mode) a locked copy on our servers. See section 11. |

**What we do not collect.** We do not ask for or collect the child's gender, surname, birth weight or place of birth, your location, your contacts, your advertising identifier, or payment card details. We do not use session replay or record what is on your screen. "Say the name three times" recordings are used once on your phone to learn how a name is misheard, then deleted. They are never uploaded.

## 4. How transcription works

1. **On your phone, by default.** The app downloads an open-source speech recognition model (Whisper) once, and turns your speech into text on the phone. No audio leaves the phone for this.
2. **Server transcription, only if you agree.** Some phones can't run the model, or you may want text before the model has downloaded. In that case the app asks first. If you say yes, we send that recording through our own server to a speech recognition service (Groq, or DeepInfra as a backup) and get the text back. These services are set up so they do not keep your audio or text after answering, and their terms forbid using it to train models (see section 8). Your choice is saved and you can change it in Settings, Privacy. If you say no, everything still works on the phone. [CN-6]
3. **Fixes are small and visible.** The app only repairs microphone and grammar slips, like a misheard name or a stray "um". It never adds meaning. The original transcript is kept unchanged, and you can undo any fix.
4. **Optional editing help (not on at launch).** We may later offer an optional step where a hosted open model suggests more small fixes. If we do, we will ask you first, send only text (never audio), and the same no-retention and no-training terms will apply. We will update this policy before turning it on.

## 5. Why we use information

| Purpose | Information used | Legal basis, where a law asks for one (for example GDPR or UK GDPR) |
|---|---|---|
| Keep your book, sync it across your phones and share it with the family you invite | Account, profiles, letters, photos, family, recordings you back up | Performing our contract with you |
| Transcribe and repair speech | Recordings, names and words | Contract; your consent for server transcription |
| Sign you in and keep the account secure | Account, device tokens, sign-in logs | Contract; legitimate interest in security |
| Send letters from family to the right book | Invites, return links, web contributions | Contract with the parent; legitimate interest of the family member in contributing |
| Reminders and family-letter notifications | Settings, child's month of age | Contract. Reminders are scheduled on your phone and carry no letter text. |
| Plus subscriptions, trials, notices and refunds | Purchases, email address | Contract; legal obligation (renewal notices) |
| Understand which features help, and fix problems | App usage, crash reports | Your consent, which you can withdraw in Settings at any time. Contains no content. [CN-5] |
| Show a support card when a letter suggests someone may need help | Runs on your phone over the letter text; nothing about it is sent to us | Not applicable: processed on your phone only [CN-10] |
| Answer support requests | Support messages | Contract; legitimate interest |
| Comply with law and protect people | Whatever is relevant to a valid legal request or safety case | Legal obligation; vital interests |

We do not use information about a child for anything except building that child's book. We do not use it for marketing, ever.

## 6. What never happens

- We do not sell personal information, and we do not "share" it for cross-context behavioral advertising, as California law defines those words.
- We have no advertising, no ad networks and no tracking SDKs. We do not track you across other apps or websites, so the app never shows Apple's tracking prompt.
- We do not use your letters, transcripts, recordings, photos or names to train AI models, and we do not let our service providers do so. [CN-7]
- Analytics and crash reports never contain letter text, transcripts, recordings, photos, child names, your email or invite links.
- We never put letter text in notifications.
- We never rewrite your words. Machine fixes are limited to removing or repairing slips, and each one is recorded and reversible.
- We do not build profiles about you or your child, and we make no automated decisions that affect your rights.

## 7. Who can see your letters

**Your family.** Letters are private to you until you add them to the book. Co-parents can read letters in the book. Family members you invite can read their own letters, and other letters in the book only if a parent turns on "Family can read the book" (off by default). Family letters go into the book only when a parent approves them. Sealed letters show only "A sealed letter from Papa" to others until their date. A seal is a privacy lock in the app, not encryption.

**People who have left.** If someone leaves or is removed, they can no longer read the book. Recordings they already played may still be on their phone, and backups made before they left stay readable with the keys they already had.

**Us.** Letter text and transcripts are stored on our servers so the book can sync and be shared, and they are not end-to-end encrypted. A very small number of our staff could technically read them. We will look only:

- when you ask us to, for support,
- to investigate a security problem or a serious misuse of the service,
- when the law requires it (see below).

Each access is logged and reviewed. [CN-8]

**Recordings you back up.** Recordings are encrypted on your phone before they are uploaded. In **Standard** backup mode, a locked copy of the key is held on our servers so you can get your recordings back if you lose your phone. This means we could technically open them, under the same narrow conditions. In **Vault** mode, no copy of the key is held by us: only you and the family devices you approve can open them, and if you lose every device and your Recovery Kit, no one can open those backups, including us.

**Legal requests.** We disclose information to authorities only when a valid legal process requires it, and we push back on requests that are too broad. Where the law allows, we tell you first. We will publish how many requests we receive. [CN-9]

## 8. Service providers

We use a small number of companies to run Early Letters. Each one acts on our instructions, under a written contract, and may use your information only to provide its service to us. We require them to protect it at least as well as this policy does. None of them may sell it or use your content to train AI models.

| Provider | What they do for us | What they handle | Where |
|---|---|---|---|
| Supabase | Database, sign-in, file storage, our server functions | Account, profiles, letters, photos, encrypted recordings, family data | United States (us-west-1, California) |
| PowerSync | Keeps the copy on your phone in sync with our database | Copies of the rows you are allowed to see, while syncing | United States |
| Groq; DeepInfra (backup) | Server transcription, only if you agree | The recording sent, briefly, in memory | United States |
| RevenueCat | Manages Plus subscriptions and receipts from Apple and Google | Purchase records linked to a random ID | United States |
| PostHog | Product analytics without content | App usage, random analytics ID | United States |
| Sentry | Crash and error reports, with content removed | Technical crash data | United States |
| Vercel | Hosts our website and the family contribution page | Web requests; encrypted uploads pass through | United States |
| {EMAIL_PROVIDER} | Sends sign-in, trial and renewal emails | Email address, message content we send | {REGION} |

The full list, with each provider's data terms, is at {SUBPROCESSORS_URL}. We will update it at least 30 days before adding a provider that handles letters or recordings. [CN-11]

Apple and Google are not our service providers when you buy through their stores or sign in with them; they act on their own terms. Your iCloud Keychain, which holds your backup key, is part of your own Apple account.

Printed books are not available yet. When they are, a print partner (we expect Lulu) and a card payment provider will receive what is needed to print and ship your order, and we will update this policy before launch.

## 9. Where your information lives

Our servers are in the United States, in California. Recordings and most data from the app stay on your phone unless you sign in or turn on backup. If a family member contributes from outside the United States, their letter is sent to and stored in the United States. See section 17.

## 10. How long we keep things

| Information | How long |
|---|---|
| Letters, recordings, photos and profiles | Until you delete them or your account. Nothing is deleted because a subscription ends. |
| Deleted letters, books and accounts | Kept in Recently deleted for 30 days so you can undo, then permanently erased from our database and storage. Database backups roll off within 7 more days. |
| Earlier versions of a letter's text | As long as the letter exists |
| Recordings on your phone | Until you delete them or the app |
| "Say the name" clips | Deleted right after use, never uploaded |
| Server transcription audio and text | Not stored by the transcription service after the answer is returned |
| Invite and return-link fingerprints | Invites expire after 7 days (14 for family, proposed); fingerprints of used, expired or revoked links are erased after 90 days (proposed) [CN-12] |
| Support card records | Kept on your phone only; never sent to us [CN-10] |
| App usage analytics (if you agreed) | Up to 12 months (proposed) |
| Crash reports | Up to 90 days (proposed) |
| Purchase records | As long as your account exists, then as required for tax and accounting (proposed: 7 years for transaction records only) |
| Consent and policy-acceptance records | Life of the account plus 3 years, to show what you agreed to (proposed) |
| Support emails | 2 years after your last message (proposed) |
| Server logs | Short rolling windows set by our providers; they never contain letter text |

When you delete your account, we also ask RevenueCat to delete its record of you and revoke your Sign in with Apple token. A family member's letters that are already in a book stay with that book unless they take them out when they leave; letters you wrote to someone else's book are removed when you delete your account. [CN-13]

## 11. Security

- All traffic is encrypted in transit (TLS).
- Every read and write on our database goes through access rules tested against every role. Your phone's copy is synced through the same rules.
- Data on our servers is encrypted at rest by our hosting provider.
- Recordings are encrypted on your phone with AES-256-GCM before backup. Keys are stored in your iCloud Keychain and on approved family devices, and, in Standard mode only, as a locked copy on our servers.
- Family recordings from the web page are encrypted in the browser before upload, so our servers never receive them in readable form.
- Invite links and return links are stored only as scrambled fingerprints, travel in the part of the link that servers don't log, and expire or can be revoked.
- Our transcription gateway removes your account ID before sending audio, and logs only timing and size, never content.
- Staff access is limited to the founder and named engineers, with two-factor authentication.

No system is perfectly secure. If a breach affects your information, we will tell you and the authorities as the law requires.

## 12. Children's privacy

**Who uses Early Letters.** Early Letters is made for adults: parents and close family. Children do not sign in, type, or use the app. We do not offer child accounts, and our App Store listing and website speak to parents. [CN-2]

**What we hold about a child.** Because a book is about a child, it holds what the adults who love that child put into it: the child's name, birthday or due date, photos, and letters that mention the child. A recording may include the child's voice in the background. All of this is provided by a parent or a family member a parent invited. We use it only to make that child's book. We never use it for marketing, never sell or share it, and never build a profile of the child.

**Parents are in control.** Only parents can add a child, invite family, approve family letters, or delete a book. Parents can review, export or delete everything in their child's book at any time.

**COPPA.** The US Children's Online Privacy Protection Act applies to personal information collected online *from* children under 13, or by services directed to them. Early Letters collects information from adults, about a child, and is not directed to children. If we learn that a person under 13 has created an account or sent a letter, we will delete that account or letter and its recording, and tell the parent who owns the book. See Appendix A, CN-2, for the full analysis.

**When the child grows up.** Letters are meant to be read and heard for years. Today the child reads them with a parent, or through an export the parent shares. If we ever let a young person sign in to read their own book, we will update this policy and meet the children's privacy laws that apply first.

## 13. Health and other sensitive details

Letters are free-form, so a parent may mention a child's health, a hospital stay, a pregnancy, family beliefs or other sensitive things. We treat everything in a letter as private content: it is protected the same way, never analyzed for advertising, never sent to analytics, and never used to make decisions about you.

- **Due dates.** If you start a book before your child is born, we store the due date. Information about a pregnancy is considered health information under some state laws. We use it only to date letters and sort the book. Our separate Consumer Health Data Privacy Notice at {HEALTH_NOTICE_URL} explains your rights under Washington's My Health My Data Act and similar laws. [CN-3]
- **Languages.** The languages you speak with your child help the app transcribe you correctly. We keep them in a table only you can read, and never send them to analytics.
- **Support cards.** If a letter contains words that suggest someone might need support, the app may show a gentle card with resources. This check runs on your phone and never blocks saving. The record that a card was shown stays on your phone. Nothing about it is sent to us, and we never read the words. [CN-10]

**Your agreement.** Because letters may hold health and other sensitive details about you and your child, we ask for your agreement before you start syncing letters to your account, in a separate, plain step. You can withdraw it by deleting your letters or your account; letters you keep only on your phone are never sent to us. [CN-16]

## 14. Your choices and rights

Wherever you live in the United States, you can do the following, free of charge.

| You can | How |
|---|---|
| See and download everything | Settings, Your data, Export everything. You get a ZIP with every letter (original transcript, fixes and final text), every recording on the phone or in backup, a PDF of the book, and a guide to the formats. Works offline. |
| Correct information | Edit your profile, the child's profile and your own letters in the app. The original transcript of a letter is kept unchanged as part of its history; you can delete the whole letter. |
| Delete a letter, a book or your account | In the app (Settings, Your data). We keep it in Recently deleted for 30 days, then erase it. |
| Move your data elsewhere | The export uses open formats (JSON, M4A audio, PDF) that other services can read. |
| Turn analytics and crash reports on or off | Settings, Privacy. They stay off until you say yes, and nothing in the app depends on them. |
| Withdraw consent for server transcription | Settings, Privacy. Future recordings are transcribed on the phone only. |
| Turn off backup, or switch to Vault mode | Settings, Recordings and backup. |
| Hide names on the lock screen | Settings, Privacy. |
| Ask us for a copy, a correction or deletion, or ask a question | Email {PRIVACY_EMAIL}. |

**How we handle requests.** We answer within 45 days. If you write from the email address on your account, we confirm by sending a sign-in link to that address before acting. You can use an authorized agent; we will ask for proof that you gave them permission. We will never treat you differently for using your rights. If we say no to a request, we will explain why, and you can appeal by replying to our answer with "Appeal" in the subject. We will respond to an appeal within 45 days and, if we still decline, tell you how to contact your state attorney general.

**Family members' letters.** Each letter belongs to the person who wrote it. A parent can remove a family letter from the book but can't edit or delete another person's words. A family member who leaves can take their letters out of the book and keep a copy.

## 15. Notice for California residents

This section is our notice at collection and our privacy policy under the California Consumer Privacy Act as amended by the California Privacy Rights Act (CCPA), and the California Online Privacy Protection Act. [CN-4]

**Categories we collect, in the last 12 months:**

| CCPA category | Examples | Source | Purpose | Disclosed for a business purpose to | Sold or shared |
|---|---|---|---|---|---|
| Identifiers | Email, name, random account and analytics IDs | You; Apple or Google sign-in | Account, sync, support, analytics | Supabase, PowerSync, RevenueCat, PostHog, email provider | No |
| Customer records (Cal. Civ. Code 1798.80(e)) | Name, email | You | Account | Supabase, email provider | No |
| Commercial information | Plus purchases, trials, refunds | Apple or Google via RevenueCat | Subscriptions | RevenueCat, Supabase | No |
| Internet or other electronic network activity | Feature usage counts, crash reports | The app | Analytics, fixing problems | PostHog, Sentry | No |
| Audio, electronic, visual or similar information | Recordings you back up or send for transcription; photos | You | The book; transcription | Supabase, Groq or DeepInfra (only with consent), Vercel (encrypted uploads) | No |
| Sensitive personal information | Letter contents; information about a child under 16 (name, birthday, photos); a due date | You | Only to provide the book you asked for | Supabase, PowerSync | No |
| Inferences | None. We do not create profiles. | | | | No |

We do not collect precise geolocation, government IDs, financial account details, biometric information or contacts.

**Sensitive personal information.** We use and disclose sensitive personal information only to provide the service you asked for and for the other purposes the CCPA regulations allow, so the right to limit its use does not need a separate link. We do not use it to infer characteristics about you or your child.

**Do Not Sell or Share.** We do not sell or share personal information, and we have not done so in the past 12 months. We do not knowingly sell or share the personal information of anyone under 16. Because we don't sell or share, there is no opt-out to make, but we still honor Global Privacy Control and similar browser signals as a request to opt out, and confirm it when we receive one.

**Your California rights.** You have the right to know what we collect, use and disclose; to access and get a portable copy; to delete; to correct; to opt out of sale or sharing; to limit use of sensitive personal information; and not to be discriminated against for using these rights. Use the steps in section 14.

**Shine the Light.** We do not disclose personal information to third parties for their own direct marketing.

**Do Not Track.** We do not track you across other sites, so we treat every visitor the same way whether or not the browser sends a Do Not Track signal.

## 16. Other US states

Residents of states with consumer privacy laws (including Colorado, Connecticut, Virginia, Texas, Oregon and others) have similar rights to access, correct, delete and port their data, to opt out of sale, targeted advertising and profiling, and to appeal a decision. We do none of the opt-out activities, and we honor the other rights for every US user, whether or not a state law requires it. Use the steps in section 14. [CN-4]

**Sensitive data.** Some states, including Connecticut, require consent before processing sensitive data such as health information or information about a known child. We ask for it as described in section 13.

**Washington, Nevada and other consumer health data laws.** See our Consumer Health Data Privacy Notice at {HEALTH_NOTICE_URL}. [CN-3]

## 17. Outside the United States

**At launch, the Early Letters app is offered only in the United States App Store.** We do not offer it in the European Economic Area, the United Kingdom, Switzerland or India, and we do not market to people there. [CN-14]

Families travel, though. A grandparent in India or the UK may open an invite link and send a letter from the contribution page. If you do, your name, relationship and letter (and its recording, encrypted in your browser) are sent to and stored in the United States so the child's parents can receive them. You can ask us to see or delete what you sent at {PRIVACY_EMAIL}, and you can take your letters out of the book at any time from your return link.

Before we offer the app outside the United States, we will update this policy with the rights and legal bases that apply there (for example under GDPR, UK GDPR or India's Digital Personal Data Protection Act).

## 18. If we close or change hands

If we ever plan to close Early Letters, we will tell you at least 90 days ahead and keep export working the whole time. If another company acquires Early Letters, this policy will still apply to the information we already hold, and we will tell you before any change to how it is used.

## 19. Changes to this policy

Each version has a number and an effective date. Earlier versions are kept at {POLICY_ARCHIVE_URL}. For a small change, we update the number and date. For a change that matters to how your information is used, we tell you in the app and by email at least 30 days before it takes effect, and where the law requires it, we ask for your agreement first. We will never apply a less protective policy to content you already gave us without asking.

## 20. Contact

{COMPANY_LEGAL_NAME}, {COMPANY_ADDRESS}. Email {PRIVACY_EMAIL}. We read every message and reply within 10 business days, and within the legal deadlines in section 14.

---

## Appendix A. Notes for counsel (remove before publishing)

**CN-1. Controller entity.** `packages/brand/index.ts` still has `TODO Company LLC` and `example.com`. The LLC must be formed and named before App Store submission (the seller name appears on the store page). Confirm whether a privacy contact or DPO-style role needs to be named.

**CN-2. COPPA analysis.** Recommendation: COPPA should not apply to v1 as designed, but the margin is product-dependent.

- *Why not.* COPPA covers operators of services directed to children under 13 and operators with actual knowledge that they collect personal information online from a child (FTC COPPA FAQ A.2, A.8 [L1]). Our users are adults; the child never signs in, types or speaks to the app as a user. Information about the child comes from the parent. Under the FAQ, information collected from parents about their children is outside COPPA. Read together plays audio to the child and collects nothing. The App Store listing and site are parent-facing (Apple 5.1.4 and 2.3.8 [L5]).
- *2025 amendments.* The amended Rule (effective June 2025, compliance date 22 April 2026) expands "personal information" to include biometric identifiers and adds separate consent for third-party disclosure, a written retention policy and a written security program [L2]. We create no voiceprints or other biometric templates; Whisper produces text, not speaker identity. Even though COPPA should not apply, we recommend adopting the written retention policy (section 10) and security program as good practice.
- *What would trigger COPPA (keep these out of v1, or get consent flows first):*
  1. Child sign-in or child accounts, including a "read your own book" login before 13.
  2. Sibling letters (B-REQ-020, P1: "From Asha, with Papa") where an under-13 sibling speaks or types. A child speaking into a parent's phone and the recording being backed up could be collection from a child. Recommend: the parent remains the author, recording stays on device unless the parent backs it up, and counsel reviews before P1 ships.
  3. A web contribution link forwarded to an under-13 cousin or sibling. The relationship chips are adult roles, but "Other" is free text. If a relationship like "big sister" signals a child, we may have actual knowledge. Recommend: Terms require contributors to be 18+, the web page says so, and support has a deletion runbook.
  4. Interactive features aimed at the child (games, voice responses in Read together, child-facing prompts or characters), child-directed marketing, or the Kids category.
  5. The FTC audio-file exception (FAQ F.6 [L1]) does not help us: it covers audio collected only as a replacement for written words and deleted promptly, while we keep audio as a keepsake.
- *Child-directed signals already in the repo.* `packages/content/src/store.en.ts` uses the keyword "kids" and says "let them listen on their own" (compliance register, risk 7). Remove both before submission.
- *Age assurance.* Texas SB 2420 and Apple's age-range requirements now reach app developers (compliance register CR-004, CR-005). The neutral 18+ confirmation in section 2 is the register's LEGAL-REQ-002; confirm it also consumes store age signals.
- *Teen users.* PRD A said "18+, no age gate"; this draft adds the confirmation. A 16 or 17 year old parent is plausible. Confirm whether an age attestation at sign-up is advisable (CCPA under-16 rules, state minor laws).

**CN-3. Consumer health data.** Washington's My Health My Data Act applies to any entity doing business in Washington or targeting Washington consumers, has no revenue threshold, covers "reproductive or sexual health information" and inferences, and carries a private right of action [L6]. Due-date mode stores a pregnancy fact, and letters may mention health. Questions: (a) Is a due date "consumer health data" about the parent? (b) Is collection "necessary to provide a product or service the consumer requested" so that separate consent is not needed, or do we need a separate MHMDA consent at due-date entry? (c) We have drafted placeholders for the separate Consumer Health Data Privacy Notice that the Act requires; it is not yet written. (d) Same review for Nevada SB 370 and Connecticut's consumer health data provisions (Unverified; not researched in this pass). Apple also lists "pregnancy or childbirth information" under Sensitive Info for the App Privacy label (see app-store-privacy-labels.md).

**CN-4. CCPA applicability.** The CCPA applies to a "business" with annual gross revenue over $26,625,000 (adjusted from 1 January 2025 [L3]), or that buys, sells or shares personal information of 100,000+ consumers or households, or gets 50%+ of revenue from selling or sharing. We do not sell or share, and revenue will be far below the threshold at launch, so the CCPA likely does not apply yet. We recommend complying voluntarily (section 15) because (a) it is the brand promise, (b) CalOPPA applies regardless and requires a posted policy and a Do Not Track disclosure (general knowledge, Unverified in this pass), and (c) since 1 January 2026 the CCPA regulations treat personal information of consumers under 16 as sensitive personal information where the business has actual knowledge of age (11 CCR 7001(bbb) [L4]). A child's name and birthday in a book is exactly that, once the CCPA applies. Confirm that use "to provide the service requested" keeps us within the 7027(m) purposes, so no "Limit" link is needed, and whether a risk assessment under 11 CCR 7150 is required once we qualify. Other state laws mostly have 100,000-consumer processing thresholds; confirm when any single state could cross them, and check Texas and Nebraska, whose thresholds work differently (Unverified).

**CN-5. Analytics consent.** PRD A section 7 proposed analytics on by default in the US. This draft follows the compliance register instead (CR-082, LEGAL-REQ-003): Apple 5.1.1(ii) asks for consent to collect usage data "even if such data is considered to be anonymous", so analytics and crash reporting are opt-in and nothing is sent before a choice. ADR 0008 (`defaultOptIn` follows the consent sheet) and PRD A-NFR-002 must be updated to match.

**CN-6. Third-party AI disclosure and brand voice.** Apple 5.1.2(i) requires clear disclosure and explicit permission before sharing personal data with third-party AI [L5]. The brand voice forbids naming the technology in product copy. This policy names it (sections 4 and 8) because a legal disclosure must be accurate. Confirm the consent sheet wording also satisfies 5.1.2(i) while following the voice guide as far as possible; we recommend the sheet names the provider category ("an outside speech recognition service") and links here.

**CN-7. No-training promise.** Verified as of 2 October 2026 for Supabase, PostHog, Groq, DeepInfra (for the models we use), and Cloudflare. Sentry, PowerSync, RevenueCat and Vercel have weaker or silent terms; see subprocessors.md for the gaps and the settings or contract changes needed before we can make this promise without qualification.

**CN-8. Staff access.** Text is not end-to-end encrypted (ADR 0006). The service role can read entries. The policy commits to logged access. Engineering must build an access log for service-role reads of `entries`, `entry_versions` and storage before launch, or the sentence must be softened.

**CN-9. Transparency reporting.** We committed to publishing request counts. Confirm whether to keep this commitment for a small company.

**CN-10. Safety events.** The current schema stores `safety_events` (author ID, tier, time) on the server. A record that a support card was shown to a named author is an identifiable mental-health inference (CCPA sensitive personal information, Connecticut sensitive data, Washington consumer health data, which expressly covers inferences). This draft describes the recommended design: tiers stay on the device, and a new migration drops or de-identifies the server table (compliance register K3, LEGAL-REQ-015). **Do not publish sections 3, 5, 10 and 13 as written until that migration ships**; otherwise they are inaccurate.

**CN-11. Subprocessor notice.** 30 days' notice before adding a provider that handles content. Confirm this matches what our vendors give us (PostHog 14 days, Sentry 30 days, Vercel unspecified "from time to time" with a 5-day objection window).

**CN-12. Retention periods marked "proposed".** These are our proposals, not current behavior. Engineering must implement scheduled purges for invites, return links, safety events and consent records. The 30-day tombstone purge is already in the architecture.

**CN-13. Account deletion and shared books.** PRD B open question 6: when a co-parent deletes their account, their letters leave the shared book. A "leave my letters for {child}" option (P2) would keep another person's content after account deletion, which needs a consent and legal-basis analysis.

**CN-14. Launch geography.** No document decides the storefronts. The draft assumes US only, which matches the trial experiment ("US storefront only") and the US-only data location. The target audience includes Indian diaspora families, so the contribution page will receive letters from grandparents in India and elsewhere. Questions: (a) Does accepting web contributions from India amount to "offering goods or services to Data Principals within India" under section 3 of the DPDP Act [L7]? Core DPDP obligations commence 13 May 2027. (b) Same under GDPR Art. 3(2) and UK GDPR for contributors in the EEA or UK. (c) If yes, do we geo-limit the contribution page, add a notice and consent at the contribution page, or plan for compliance? (d) The DPDP Act defines a child as under 18 and requires verifiable parental consent for a child's data; our "parent provides data about their own child" model should be confirmed before any India launch.

**CN-15. Recording others.** A letter may capture other voices in the room. Consider a Terms clause that authors are responsible for having permission to record others (California Penal Code 632 two-party consent; general knowledge, Unverified).

**CN-16. Sensitive-data consent and companion documents.** Section 13 assumes the separate sensitive-data consent at account creation recommended by the compliance register (CR-020 Connecticut, CR-031 Washington; LEGAL-REQ-006; document key `sensitive-data` in `POLICY_VERSIONING.md`). Placement is a product decision: this draft ties it to the first sync, since letters kept only on the phone never reach us. Also required and not yet drafted: the Consumer Health Data Privacy Policy (`health-privacy`), the contributor notice for the web page (`contributor-notice`), and the backup mode acknowledgment (`backup-recovery`). Versioning, notice and re-consent rules for this policy are defined in `POLICY_VERSIONING.md`; section 19 here is the user-facing summary and must stay consistent with it.

## Appendix B. Sources

Repository sources (read 2 October 2026): `docs/ARCHITECTURE.md`; `docs/adr/0001` to `0010`; `supabase/migrations/20260930000000_scribe_core.sql` and `20261001000000_scribe_hardening.sql`; `docs/prd/A-entry-and-auth.md`, `B-first-run-and-family.md`, `C-habits-pricing-settings.md`; `docs/research/USER_RESEARCH.md`, `COMPETITIVE_RESEARCH.md`; `packages/content/VOICE.md`, `BRAND.md`; `packages/brand/index.ts`.

External sources (opened 2 October 2026):

- [L1] FTC, Complying with COPPA: Frequently Asked Questions (A.2, A.8, D.1, D.4, F.6, H.1): https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions
- [L2] Hunton Andrews Kurth, FTC Publishes Final COPPA Rule Amendments: https://www.hunton.com/privacy-and-information-security-law/ftc-publishes-final-coppa-rule-amendments
- [L3] California Privacy Protection Agency, 2025 adjustments to CCPA monetary thresholds: https://cppa.ca.gov/announcements/2024/20241217.html
- [L4] Latham and Watkins, Navigating New Obligations Under the CCPA's Updated Regulations (11 CCR 7001(bbb), 7025(c)(6), 7150): https://www.lw.com/en/insights/navigating-new-obligations-under-the-ccpa-updated-regulations ; also Osano, 2026 CCPA amendments: https://www.osano.com/articles/2026-ccpa-amendments
- [L5] Apple, App Review Guidelines 5.1.1(i), 5.1.1(v), 5.1.2(i), 5.1.4: https://developer.apple.com/app-store/review/guidelines/
- [L6] Cooley, Washington State's My Health My Data Act FAQ, Part One: https://cdp.cooley.com/washington-states-my-health-my-data-act-faq-part-one-applicability-and-scope/
- [L7] Legal 500, India's DPDP Act and the DPDP Rules, 2025 (notified 13 November 2025; phased commencement; section 3 scope): https://www.legal500.com/intelligence/india/privacy/india's-digital-personal-data-protection-act-and-the-dpdp-rules-2025-phased-commencement-core-obligations-and-a-board-ready-compliance-strategy
- [L8] Supabase, Backups (Pro plan keeps 7 days of daily backups; Storage objects are not in database backups): https://supabase.com/docs/guides/platform/backups
- Vendor data terms: see `docs/legal/subprocessors.md`, Appendix.

Unverified in this pass: CalOPPA Do Not Track requirement; state laws other than California and Washington; California Penal Code 632; Supabase encryption-at-rest details; PostHog and Sentry retention defaults.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-10-02 | First draft for counsel review. |
