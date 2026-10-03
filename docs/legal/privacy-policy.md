---
title: Early Letters Privacy Policy
version: 1.4.0
status: draft-for-counsel
effective_date: TBD
last_updated: 2026-10-03
owner: founder
reviewers: outside privacy counsel (TBD)
published_at_url: https://earlyletters.com/privacy (D-063)
---

> **Drafting notice.** This document was drafted by an AI (Claude) acting as privacy counsel and privacy engineer, for review by a licensed attorney. It is not legal advice and must not be published until counsel has reviewed it. Text in square brackets like [CN-4] points to a numbered note for counsel in Appendix A; remove those tags, Appendix A and this notice before publishing. Placeholders in braces ({PUBLISHER_LEGAL_NAME}, {CONTACT_ADDRESS}) must be filled in. Every open question is also numbered in `docs/legal/COUNSEL_PACKET.md`. The privacy review for version 1.1.0 is `docs/legal/memos/lawyer-2.md`; version 1.4.0 aligns the policy with the founder decisions of 3 Oct 2026 (D-051 to D-070).

# Early Letters Privacy Policy

Version 1.4.0. Effective date: TBD.

Early Letters is a memory book you fill by talking. Parents speak or type notes and letters to a child. This policy explains what we collect, why, who helps us run the service, how long we keep things, and the choices you have. We have tried to write it the way we write everything else: plainly.

## The short version

- **Your letters and recordings are private.** We never sell them, never use them for ads and never use them to train machine learning models. We never imitate your voice.
- **Your recordings stay on your phone.** We do not upload, back up or transcribe recordings on our servers. They leave your phone only if you export or share them yourself, or in your phone's own backup if you use one.
- **Transcription happens on your phone.** The app turns your voice into text on the phone itself. No audio is sent to us or to anyone else for this.
- **Letter text syncs to our servers** once you sign in and agree, so your co-parent can read the book and you can get it back on a new phone. It is protected by access rules and encryption at rest, but it is not end-to-end encrypted, so we could technically read it. We only do so in the narrow cases in section 7.
- **Analytics are off until you say yes,** and they never include content: no letter text, recordings, names or birthdays.
- **Plus is between you and Apple.** Apple handles payment; we never see your card or your purchase records.
- **We never make a voiceprint.** We don't use your voice to identify you or anyone else.
- **You can export your book and delete your letters or your account, any time, for free.**

## 1. Who we are

Early Letters is made and run by {PUBLISHER_LEGAL_NAME}, an individual based in California ("we", "us"). Our contact address is {CONTACT_ADDRESS}. We decide how and why your information is used, so we are responsible for it. Reach us at hello@earlyletters.com. [CN-1]

## 2. What this policy covers

This policy covers the Early Letters app for iPhone and our website at earlyletters.com.

Some features are planned for later versions and are not part of Early Letters today: other family members writing to the book, a family web page, family members hearing each other's recordings, backup of recordings, cloud transcription, photos, and an Android app. Before any of them arrives, we will update this policy, and where a change affects how your information is used, we will tell you first (section 19). [CN-20]

It does not cover Apple, Google or other companies you deal with directly, such as when you subscribe through the App Store or sign in with Apple or Google. Their own privacy policies apply to what they collect.

Early Letters is for adults. You must be 18 or older to use it at all, including on your phone without an account. The app asks before you can use it, and if the answer is no it stops and keeps nothing. We ask you to confirm your age again when you create an account. A book is *about* a child, but the child does not use Early Letters. You can keep a book for more than one child; each child has their own book. See section 12.

Health information has its own short policy, our Consumer Health Data Privacy Policy at https://earlyletters.com/health-privacy. It sits alongside this one.

## 3. What we collect

We collect only what the book needs. Much of it never leaves your phone. The table shows where each kind of information lives.

| What | Examples | Where it comes from | Where it lives |
|---|---|---|---|
| Account | Email address; name from Sign in with Apple or Google (if shared); a random account ID; which sign-in methods you linked; that you confirmed you are 18 or older; the version of the Terms and this policy you accepted, and the consents you gave or withdrew, and when. If you sign in with Apple, a token Apple gives us, kept locked, so we can tell Apple to forget the link when you delete your account | You, Apple or Google when you sign in | Your phone and our database |
| Your profile | Display name, what the child calls you ("Mama", "Papa") | You | Your phone and our database |
| Your settings | The languages you speak letters in, script choice, reminder times, appearance, reading size | You | **Your phone only** (each letter's own language syncs with it, see Letters) |
| Child profiles | For each child: name or nickname, and birthday or due date | You | Your phone, and our database once you sign in and agree to sync |
| Letters | The words you speak or type, the original transcript (kept unchanged), each small fix the app made and whether you kept it, the final text, the date, which child it is for, whether it is in the book, and which language a spoken letter was in | You | Your phone, and our database once you sign in and agree to sync (section 13). A letter's language is visible only to its author, not to your co-parent |
| Recordings | The audio of spoken letters, and any clearer listening copy the app makes of it | You | **Your phone only** (and your phone's own backup, if you use one). Never uploaded to us |
| Names and words | Spellings for names, nicknames, places and home words, and how the microphone tends to mishear them | You | Your phone, and our database when synced |
| Co-parent and invites | Who the parents of each child's book are, and invites you create (we keep only a scrambled fingerprint of each invite link, never the link itself) | You and your co-parent | Our database |
| Plus | Whether Plus is on, its plan, trial and renewal dates, as Apple reports them to the app | Apple, through StoreKit on your phone | **Your phone only.** We do not receive your purchase records |
| App usage (only if you agree) | Which features are used, as counts and categories (for example "letter saved, spoken, 1 to 2 minutes"), how many children's books you have as a range, changes in your Plus state, the language you picked when you set a language or download a language pack, app version, device type and OS version, and a random analytics ID | The app, after you say yes | PostHog |
| Downloads | When you choose a language, the app downloads that language's pack and speech model. The download host sees your IP address and which file was requested, as any website does | The app | The download host's logs (section 8) |
| Support messages | What you write to us, and anything you choose to include | You | Our email |
| Emails we send you | Your email address and the email itself (sign-in links, account and deletion notices) | Us | Our email provider, for 30 days (section 10) |

**What we do not collect.** We do not ask for or collect the child's gender, surname, birth weight or place of birth, your location, your contacts, your advertising identifier, your exact age, photos, or payment card details. On iPhone, Apple may tell the app your age range so we can confirm you are an adult; we use it in the moment and do not store it. We do not use session replay or record what is on your screen. We do not create voiceprints, face templates or any other biometric identifier (section 13). "Say the name three times" recordings are used once on your phone to learn how a name is misheard, then deleted. They are never uploaded.

## 4. How transcription works

1. **On your phone.** The app downloads an open-source speech recognition model once for the languages you choose, and turns your speech into text on the phone. No audio leaves the phone for this. [CN-6]
2. **Fixes are small and visible.** The app only repairs microphone and grammar slips, like a misheard name, a stray "um" or a missing full stop in the style of your language. It never adds meaning. The original transcript is kept unchanged, and you can undo any fix. When you type, your keyboard's own autocorrect works as usual, and we never rewrite what you typed.
3. **Your recording is never altered.** If the app makes a clearer listening copy, it is a separate copy on your phone, and the original is always kept and playable.

Speech recognition works out which words were said. It does not identify who is speaking, tell voices apart, or keep any measurement of your voice. It keeps only the text and the timing of each word.

## 5. Why we use information

| Purpose | Information used | Legal basis, where a law asks for one (for example GDPR or UK GDPR) |
|---|---|---|
| Keep your book, sync it across your phones and share it with your co-parent | Account, profile, child profiles, letters, names and words, co-parent | Performing our contract with you; your consent for sensitive information (section 13) |
| Transcribe and repair speech, on your phone | Recordings, names and words, language settings | Contract. Processed on your phone only |
| Download language packs and speech models | Your choice of language, your IP address (seen by the download host) | Contract |
| Confirm that people who create accounts are adults | Your answer; on iPhone, the age range Apple shares (used in the moment, not stored) | Legal obligation |
| Sign you in and keep the account secure | Account, sign-in logs | Contract; legitimate interest in security |
| Reminders | Your reminder settings, the child's month of age | Contract. Reminders are scheduled on your phone and carry no letter text |
| Plus, and reminders before a trial ends or a plan renews | Plus state from Apple, on your phone | Contract. Checked and scheduled on your phone only |
| Understand which features help, and fix problems | App usage | Your consent, which you can withdraw in Settings at any time. Contains no content |
| Count how Early Letters is used overall, for example letters per week or families per language, only as totals of at least 10 families and never about one person | Letters' dates, kinds and languages, inside our database | Legitimate interest in improving the service; no individual is reported [CN-22] |
| Show "If you are struggling" support resources | Nothing about you: it is a fixed list of resources in Settings | Not applicable |
| Answer support requests | Support messages | Contract; legitimate interest |
| Comply with law and protect people | Whatever is relevant to a valid legal request or safety case | Legal obligation; vital interests |

We do not use information about a child for anything except building that child's book. We do not use it for marketing, ever.

## 6. What never happens

- We do not sell personal information, and we do not "share" it for cross-context behavioral advertising, as California law defines those words.
- We have no advertising, no ad networks and no tracking SDKs. We do not track you across other apps or websites, so the app never shows Apple's tracking prompt.
- We do not use your letters, transcripts, recordings or names to train AI models, and we do not let our service providers do so. [CN-7]
- We never imitate your voice or anyone's voice in your recordings, and we never make a synthetic voice.
- Analytics never contain letter text, transcripts, recordings, names, birthdays, your email or invite links. The only details about children in analytics are how many books you keep, as a range (one, two, three or more), and which child a screen is about by position ("first", "second"), never by name. We do not try to link analytics to your account or to you, and we do not let PostHog do so. [CN-21]
- We never put letter text in notifications.
- We never rewrite your words. Machine fixes are limited to removing or repairing slips, and each one is recorded and reversible.
- We do not create voiceprints or face templates, and we do not use recordings to identify, verify or tell apart the people in them.
- We do not build profiles about you or your child, and we make no automated decisions that affect your rights.

## 7. Who can see your letters

**Your co-parent.** Letters are private to you until you add them to the book. Your co-parent can read letters in the book. Each child's book has its own parents: inviting a co-parent to one child's book does not open the others.

**Your working notes stay yours.** Only the author of a letter can see its original transcript and the list of fixes. Your co-parent sees the final text.

**Recordings.** A recording stays on the phone it was made on. Your co-parent can read your letter but cannot hear your recording through us, because we never receive it.

**People who have left.** If a co-parent leaves a book, they can no longer read it. Letters they already exported stay with them.

**Us.** Letter text and transcripts are stored on our servers so the book can sync, and they are not end-to-end encrypted. A very small number of people (today, only the founder) could technically read them. We will look only:

- when you ask us to, for support,
- to investigate a security problem or a serious misuse of the service,
- when the law requires it (see below).

Each access through our support tools is logged. [CN-8]

**Legal requests.** We disclose information to authorities only when a valid legal process requires it, and we push back on requests that are too broad. Where the law allows, we tell you first. We will publish how many requests we receive. [CN-9]

## 8. Service providers

We use a small number of companies to run Early Letters. Each one acts on our instructions, under a written contract, and may use your information only to provide its service to us. We require them to protect it at least as well as this policy does, and to delete it when we ask. None of them may sell it or use your content to train AI models.

| Provider | What they do for us | What they handle | Where |
|---|---|---|---|
| Supabase | Database, sign-in, our server functions | Account, profile, child profiles, letters and transcripts, names and words, co-parent and invite fingerprints | United States (us-west-1, California) |
| PostHog | Product analytics without content, only if you agree | App usage, random analytics ID | United States |
| Resend | Sends our emails (sign-in links, account and deletion notices) | Email address, the emails we send | United States |
| Vercel | Hosts our website | Website visits | United States |
| Cloudflare (planned download host) | Delivers language packs and speech models | IP address and the file requested; no personal content | Cloudflare's global network |

Some speech models are downloaded straight from their public home on Hugging Face, which sees your IP address and the file requested, the same as any website you visit. [CN-11]

The full list, with each provider's contact details, is at https://earlyletters.com/subprocessors. We will update it at least 30 days before adding a provider that handles letters or recordings. [CN-11]

Apple and Google are not our service providers when you subscribe through the App Store or sign in with them; they act on their own terms. Apple runs Plus purchases, renewals, cancellations and refunds as the seller, and keeps its own records.

Printed books are not available yet. When they are, a print partner and a card payment provider will receive what is needed to print and ship your order, and we will update this policy before launch.

## 9. Where your information lives

Our servers are in the United States, in California. Recordings, your settings and your Plus state stay on your phone. Letter text, child profiles and your account sync to our servers once you sign in and agree.

Your phone's own backups (for example iCloud Backup, or a backup to your computer) include what the app keeps on the phone, including your recordings. Those backups are in your own Apple account and under your control, not ours. Speech models and language packs are not included in your backup; the app downloads them again when needed. [CN-19]

## 10. How long we keep things

| Information | How long |
|---|---|
| Letters, child profiles and your profile | Until you delete them or your account. Nothing is deleted because a subscription ends. |
| Deleted letters, books and accounts | Kept in Recently deleted for 30 days so you can undo. Then erased from our live database within 31 days of your request, from our database backups within 38 days, and by our service providers within 45 days, with one exception: our email provider keeps each email we send for 30 days after sending, so the email confirming that your account was deleted, which we send when deletion completes, stays with it for 30 days after that and is then deleted. [CN-12] |
| Earlier versions of a letter's text | As long as the letter exists |
| Recordings, settings and Plus state on your phone | Until you delete them or the app. When your account deletion completes, the app offers one more export and then clears them |
| "Say the name" clips | Deleted right after use, never uploaded |
| Invite fingerprints | Invites to co-parents expire after 7 days. Fingerprints of used, expired or cancelled invites are erased 90 days later. |
| App usage analytics (if you agreed) | Up to 12 months (proposed) |
| Activity records (for example "a letter was deleted", without any content) | 24 months; when you delete your account they no longer show who you are |
| Security and staff-access logs (sign-in events, our access to accounts through support tools), without content | 12 months |
| The Apple sign-in token | Until your account deletion completes; we then ask Apple to revoke it and delete it |
| Consent and policy-acceptance records | Life of the account plus 3 years, to show what you agreed to. When you delete your account they no longer show your name or email. |
| Records that a deletion happened (dates and counts, no content) | 3 years after it completes |
| Emails we send you | Kept by our email provider for 30 days after sending |
| Support emails | 2 years after your last message (proposed) |
| Server and download logs | Short rolling windows set by our providers; they never contain letter text |

We do not keep purchase records: Apple keeps its own, as the seller.

**When you delete your account** [CN-13]:

- Your letters are removed from every book, including a book you share with a co-parent. That book stays with the co-parent. You can export first.
- A book where you are the only parent is deleted with everything in it.
- Copies your co-parent already exported stay with them.
- We revoke your Sign in with Apple token. Deleting your account does not cancel Plus; cancel it in your Apple Account. If analytics is on, the app resets its analytics ID and asks PostHog to delete the events sent under it. Analytics are not linked to your account, so we can't find them from an email request alone. [CN-18]

## 11. Security

- All traffic is encrypted in transit (TLS).
- Every read and write on our database goes through access rules tested against every role. Your phone syncs through the same rules.
- Data on our servers is encrypted at rest by our hosting provider.
- Recordings never leave your phone through us, so they are never on our servers.
- Invite links are stored only as scrambled fingerprints, expire after 7 days, and can be cancelled. [CN-23]
- Access to our systems is limited to the founder, with two-factor authentication on every account.

No system is perfectly secure. If a breach affects your information, we will tell you and the authorities as the law requires.

## 12. Children's privacy

**Who uses Early Letters.** Early Letters is made for adults: parents. No one under 18 may use it in any way: the app asks your age before first use, and an answer under 18 stops the app before anything is created or kept, on the phone or with us. Children do not sign in, type, or use the app. We do not offer child accounts, and our App Store listing and website speak to parents. Features that would ask a child to speak or type into the app are not available. [CN-2]

**What we hold about a child.** Because a book is about a child, it holds what the parents put into it: the child's name, birthday or due date, and letters that mention the child. A recording may include the child's voice in the background; recordings stay on your phone. We use this only to make that child's book. We never use it for marketing, never sell or share it, and never build a profile of the child.

**Parents are in control.** Only parents can add a child, invite a co-parent, or delete a book. Parents can read and export the book and delete their own letters. Only a sole parent can delete a whole book. No one can edit another person's words.

**COPPA.** The US Children's Online Privacy Protection Act applies to personal information collected online *from* children under 13, or by services directed to them. Early Letters collects information from adults, about a child, and is not directed to children. If we learn that a person under 13 has created an account, we will delete that account. If we learn that anyone under 18 has an account, we will close it and, where the law allows, offer an export. See Appendix A, CN-2, for the full analysis.

**When the child grows up.** Letters are meant to be read and heard for years. Today the child reads them with a parent, or through an export the parent shares. If we ever let a young person sign in to read their own book, we will update this policy and meet the children's privacy laws that apply first.

## 13. Health, voice and other sensitive details

Letters are free-form, so a parent may mention a child's health, a hospital stay, a pregnancy, family beliefs or other sensitive things. We treat everything in a letter as private content: it is protected the same way, never analyzed for advertising, never sent to analytics, and never used to make decisions about you. Our Consumer Health Data Privacy Policy at https://earlyletters.com/health-privacy explains your rights under Washington's My Health My Data Act, Nevada's and Connecticut's consumer health data laws, and similar laws. [CN-3]

- **Due dates.** If you start a book before your child is born, we store the due date. Information about a pregnancy is health information under some state laws. We use it only to date letters and sort the book.
- **Languages.** The languages you speak letters in help the app transcribe you correctly. Your language settings stay on your phone. Each spoken letter records which of the seven languages it was in; that syncs with the letter and only you can see it, not your co-parent. We count families per language only in totals of at least 10. If you agree to analytics, the language you pick when setting a language or downloading a pack is counted, on its own, without your letters or anything about your child. [CN-22]
- **Support resources.** Settings has a fixed "If you are struggling" list of resources. The app does not scan your letters for this.
- **Voice recordings.** Some laws list voice recordings as a kind of biometric data, because a voiceprint could be made from them. We never make one. We don't measure the features of a voice, identify or verify anyone from a recording, or tell speakers apart, and we never imitate a voice. Recordings stay on your phone so your family can hear them. That is all. If this ever changes, we will update this policy and ask for your written consent first. [CN-17]

**Your agreement.** Because letters may hold health and other sensitive details about you and your child, we ask for your agreement in a separate, plain step before anything you write is first synced to your account. If you say no, you can keep using Early Letters on your phone; syncing and writing with a co-parent stay off. You can withdraw your agreement at any time in Settings, Privacy. Syncing then stops, and we offer to delete what you already synced. Letters you keep only on your phone are never sent to us. [CN-16]

## 14. Your choices and rights

Wherever you live in the United States, you can do the following, free of charge.

| You can | How |
|---|---|
| See and download your book | Settings, Your data, Export everything. You get a ZIP with every letter you wrote (original transcript, fixes and final text), the final text of your co-parent's letters in the book, the recordings on your phone, a PDF of the book, and a guide to the formats. Works offline. |
| Correct information | Edit your profile, the child's profile and your own letters in the app. The original transcript of a letter is kept unchanged as part of its history; you can delete the whole letter. |
| Delete a letter, a book or your account | In the app (Settings, Your data), or by email; https://earlyletters.com/delete-account explains how. We keep it in Recently deleted for 30 days, then erase it on the timeline in section 10. |
| Move your data elsewhere | The export uses open formats (JSON, M4A audio, PDF) that other services can read. |
| Turn analytics on or off | Settings, Privacy. They stay off until you say yes, and nothing in the app depends on them. |
| Withdraw your agreement to sync sensitive details | Settings, Privacy (section 13). |
| Hide names on the lock screen | Settings, Privacy. Names are hidden by default. |
| Ask which companies have your information | Email us. We send the list of our service providers, with their contact details. |
| Ask us for a copy, a correction or deletion, or ask a question | Email hello@earlyletters.com. |

**How we handle requests.** We answer within 45 days. If we need longer, we will tell you within those 45 days and finish within 45 more. If you write from the email address on your account, we confirm by sending a sign-in link to that address before acting. You can use an authorized agent; we will ask for proof that you gave them permission. We will never treat you differently for using your rights. If we say no to a request, we will explain why, and you can appeal by replying to our answer with "Appeal" in the subject. We will respond to an appeal within 45 days and, if we still decline, tell you how to contact your state attorney general.

**Your co-parent's letters.** Each letter belongs to the person who wrote it. A parent can't edit or delete another person's words, except by deleting the whole book as its only parent (section 12).

## 15. Notice for California residents

This section is our notice at collection and our privacy policy under the California Consumer Privacy Act as amended by the California Privacy Rights Act (CCPA), and the California Online Privacy Protection Act. [CN-4]

**Categories we collect, in the last 12 months:**

| CCPA category | Examples | Source | Purpose | Disclosed for a business purpose to | Sold or shared | How long we keep it |
|---|---|---|---|---|---|---|
| Identifiers | Email, name, random account and analytics IDs, IP address (in server and download logs) | You; Apple or Google sign-in; your device | Account, sync, support, analytics, downloads | Supabase, Resend, PostHog, Vercel, the download host | No | Life of the account; analytics up to 12 months; logs short windows |
| Customer records (Cal. Civ. Code 1798.80(e)) | Name, email | You | Account | Supabase, Resend | No | Life of the account |
| Commercial information | Changes in your Plus state, only if you agree to analytics | The app | Analytics | PostHog | No | Up to 12 months |
| Internet or other electronic network activity | Feature usage counts | The app, only if you agree | Analytics, fixing problems | PostHog | No | Up to 12 months |
| Audio, electronic, visual or similar information | None: recordings stay on your phone | | | | No | |
| Sensitive personal information | Letter contents (letters to your family, which we are not the intended reader of); information about a child under 16 (name, birthday); a due date | You | Only to provide the book you asked for | Supabase | No | Until you delete them or your account |
| Inferences | None. We do not create profiles. | | | | No | |

We do not collect precise geolocation, government IDs, financial account details, photos or contacts. We do not use recordings to establish anyone's identity, so we do not process biometric information to identify anyone (section 13).

**Sensitive personal information.** We use and disclose sensitive personal information only to provide the service you asked for and for the other purposes the CCPA regulations allow, so the right to limit its use does not need a separate link. We do not use it to infer characteristics about you or your child.

**Do Not Sell or Share.** We do not sell or share personal information, and we have not done so in the past 12 months. We do not knowingly sell or share the personal information of anyone under 16. Because we don't sell or share, there is no opt-out to make, but we still honor Global Privacy Control and similar browser signals as a request to opt out, and confirm it when we receive one.

**Your California rights.** You have the right to know what we collect, use and disclose; to access and get a portable copy; to delete; to correct; to opt out of sale or sharing; to limit use of sensitive personal information; and not to be discriminated against for using these rights. Use the steps in section 14.

**Shine the Light.** We do not disclose personal information to third parties for their own direct marketing.

**Do Not Track.** We do not track you across other sites, so we treat every visitor the same way whether or not the browser sends a Do Not Track signal.

## 16. Other US states

Residents of states with consumer privacy laws (including Colorado, Connecticut, Virginia, Texas, Oregon, Maryland and others) have similar rights to access, correct, delete and port their data, to opt out of sale, targeted advertising and profiling, and to appeal a decision. We do none of the opt-out activities, and we honor the other rights for every US user, whether or not a state law requires it. Use the steps in section 14. [CN-4]

**Sensitive data.** Some states, including Connecticut, require consent before processing sensitive data such as health information. We ask for it as described in section 13, and we process it only as needed to keep and show the book you asked for.

**Consumer health data (Washington, Nevada, Connecticut and similar laws).** See our Consumer Health Data Privacy Policy at https://earlyletters.com/health-privacy. [CN-3]

**Biometric privacy laws (for example Illinois, Texas and Washington).** We do not create or collect biometric identifiers such as voiceprints or face geometry (section 13).

## 17. Outside the United States

**The Early Letters app is offered only in the United States App Store.** We do not offer it in the European Economic Area, the United Kingdom, Switzerland or India, and we do not market to people there. [CN-14]

If you use the app while traveling, what it keeps is stored in the United States, as described above. Before we offer the app outside the United States, or let family members anywhere send letters to a book, we will update this policy with the rights and legal bases that apply (for example under GDPR, UK GDPR or India's Digital Personal Data Protection Act).

## 18. If we close or change hands

If we ever plan to close Early Letters, we will tell you at least 90 days ahead and keep export working the whole time. If another company acquires Early Letters, this policy will still apply to the information we already hold, and we will tell you before any change to how it is used.

## 19. Changes to this policy

Each version has a number and an effective date. Earlier versions are kept at {POLICY_ARCHIVE_URL}. For a small change, we update the number and date. For a change that matters to how your information is used, we tell you in the app and by email at least 30 days before it takes effect, and where the law requires it, we ask for your agreement first. We will never apply a less protective policy to content you already gave us without asking.

## 20. Contact

{PUBLISHER_LEGAL_NAME}, {CONTACT_ADDRESS}. Email hello@earlyletters.com. We read every message and reply within 10 business days, and within the legal deadlines in section 14.

---

## Appendix A. Notes for counsel (remove before publishing)

**CN-1. Controller identity.** Founder decisions D-004 and D-064: the app is published under the founder's individual Apple Developer account, with no LLC for now. The controller is the founder as an individual; the App Store shows the founder's legal name as the seller. Fill {PUBLISHER_LEGAL_NAME} and a {CONTACT_ADDRESS} counsel accepts for an individual (a mailing address rather than a home address, if lawful for each notice). Confirm whether "we" is acceptable for an individual and whether any state law needs a named privacy contact. `packages/brand` holds only a TODO marker for the name (never in code). If an entity is formed later, the controller changes, which is a major change for published users (POLICY_VERSIONING 2.1 item 9) and an app transfer (D-004 point 5). Contact: `hello@earlyletters.com` is live (D-063); DOMAINS.md suggests `privacy@earlyletters.com`. Switch when it exists. COUNSEL_PACKET Q1.

**CN-20. Features after the first version.** Founder decisions of 3 Oct 2026, second round: co-parent only (D-055), no audio upload, family playback or backup in v1.0 (D-059), no cloud transcription (ROADMAP 2.0), no photos (ROADMAP 2.0 section 5 lists none; no photo picker in the app), Android later. Version 1.4.0 removes every v1.0 description of those features (contributors, the web page, backup, Standard and Vault modes, escrow, photos, Groq and DeepInfra, Sentry) and states only what ships. Each feature that ships later adds its text in the same release, and audio upload or cloud transcription is a major change under POLICY_VERSIONING 2.1 item 1 (audio leaving the device for a new purpose), with notice and, for the AI consent, fresh agreement.

**CN-2. COPPA analysis.** Recommendation: COPPA should not apply to v1.0 as designed. Full analysis in `memos/lawyer-2.md` finding M1 and the earlier H5 discussion.
- *Why not.* COPPA covers operators of services directed to children under 13 and operators with actual knowledge that they collect personal information online from a child (FTC COPPA FAQ A.2, A.8 [L1]). Our users are adults; the child never signs in, types or speaks to the app as a user. Information about the child comes from the parent. Read together plays audio to the child and collects nothing. The App Store listing and site are parent-facing (Apple 5.1.4 and 2.3.8 [L5]).
- *2025 amendments.* The amended Rule (effective June 2025, compliance date 22 April 2026) expands "personal information" to include biometric identifiers and adds separate consent for third-party disclosure, a written retention policy and a written security program [L2]. We create no voiceprints. We recommend the written retention policy (`data-policy.md`) and security program as good practice.
- *What would trigger COPPA (kept out of v1.0):* child sign-in or child accounts; the `together` prompts, "Write one together" and sibling letters behind the `child-input` flag (off in production until counsel's written opinion, LEGAL-REQ-059); a web contribution link reaching an under-13 relative (no web page in v1.0); interactive features aimed at the child.
- *A baby's voice in the background* of a parent's letter is information about a child provided by the parent, not collected from the child; in v1.0 it never leaves the phone. Counsel to confirm in writing. COUNSEL_PACKET Q4.
- *Age assurance.* Texas SB 2420 and California AB 1043 (from 1 Jan 2027 a developer must request the OS or store age signal at download and launch; a signal is actual knowledge). The 18+ gate and Declared Age Range handling are LEGAL-REQ-002 and D-026. COUNSEL_PACKET Q5.

**CN-3. Consumer health data.** Letters, transcripts and due dates can contain consumer health data; the separate Consumer Health Data Privacy Policy is `consumer-health-data-notice.md` (key `health-privacy`, URL https://earlyletters.com/health-privacy). Washington's "homepage" includes any web page where personal information is collected and a mobile app's download page [L9], so the link must appear on the website and the App Store listing. COUNSEL_PACKET Q2, Q3.

**CN-4. CCPA applicability.** The CCPA applies to a "business" with annual gross revenue over $26,625,000 (adjusted from 1 January 2025 [L3]), or that buys, sells or shares personal information of 100,000+ consumers or households, or gets 50%+ of revenue from selling or sharing. We do not sell or share, and revenue will be far below the threshold, so the CCPA likely does not apply yet. We comply voluntarily because (a) it is the brand promise, (b) CalOPPA applies regardless (Unverified in this pass), and (c) since 1 January 2026 the CCPA regulations treat personal information of consumers under 16 as sensitive where the business has actual knowledge of age (11 CCR 7001(bbb) [L4]). Confirm 7027(m) purposes so no "Limit" link is needed. Connecticut applies to any controller that processes sensitive data from 1 July 2026 (register CR-020). COUNSEL_PACKET Q20.

**CN-6. Third-party AI.** None in v1.0. Apple 5.1.2(i) requires clear disclosure and explicit permission before sharing personal data with third-party AI [L5]; that consent sheet, the `ai-processing` document and LEGAL-REQ-004 bind when cloud transcription ships (v1.1).

**CN-7. No-training promise.** Every processor that holds content in v1.0 is Supabase, whose terms forbid training on customer data (subprocessors.md [V2]). PostHog's DPA forbids subprocessors training on our data and receives no content. Resend receives email addresses and our own email text, never letters (confirm its terms, subprocessors.md gap 7). PowerSync is not used (D-023), which closes the 1.3.0 launch gate. Sentry is not in the v1.0 app.

**CN-8. Staff access.** Text is not end-to-end encrypted. The service role can read entries. Ops scripts write one `ops.audit_log` row before reading anyone's data (SECURITY.md 1.4, LEGAL-REQ-025), but reads through the Supabase dashboard SQL editor are not logged until database-level auditing exists (pm-5, `05-trust-platform-insights.md` section 7). The sentence says "through our support tools" for that reason; confirm or soften further. COUNSEL_PACKET Q21.

**CN-9. Transparency reporting.** We committed to publishing request counts. Confirm whether to keep this commitment for an individual publisher. COUNSEL_PACKET Q21.

**CN-10. Safety events.** Decided (PRD K-06, LEGAL-REQ-015): no server table for safety tiers. In v1.0 there is no safety classifier at all (D-059; a static "If you are struggling" row instead). The drop of `public.safety_events` is in `20261002020000_data_governance.sql`, still **Pending** on the live project (`supabase/APPLY.md`; `.github/migrations-applied.txt` lists only the first two migrations). **Do not publish until that migration is applied to the production project** (or production is created fresh from all migrations, D-041).

**CN-11. Download host and subprocessor notice.** DEBATES Q-001 (packs and model hostname) is with the founder; Cloudflare R2 is the candidate host, and DOMAINS.md section 6 lists alternatives. Upstream speech models are fetched from pinned Hugging Face revisions (`apps/mobile/src/lib/models/catalog.ts`); our own builds (the Hindi model) from our host. Both hosts see an IP address together with a file name that reveals the language chosen. That is why the policy names them even though they receive no content. Confirm whether an IP plus a language-specific file name is "personal information" that needs more than this disclosure (COUNSEL_PACKET Q12). The 30-day notice before adding a content processor must match what our vendors give us (PostHog 14 days, Vercel "from time to time" with a 5-day objection window).

**CN-12. Retention periods marked "proposed" and the email exception.** These are proposals, not current behavior, except the 31 / 38 / 45 day deletion clock (PRD K-23, DATA-REQ-036) and the 7-day invite expiry with the 90-day fingerprint rule (K-18, D-020). New in 1.4.0: Resend keeps message data for 30 days (Verified per `docs/ops/runbooks/incident-notification.md`); the purge worker sends the completion email at execution (about day 30 after the request), so that email exists at Resend until about day 60, past the 45-day processor promise. The sentence now states the exception instead of promising 45 days. Alternatives: no completion email (Apple does not require one), or a completion email that contains no personal data beyond the address (it already has none), or a provider with shorter retention. Confirm. COUNSEL_PACKET Q13.

**CN-13. Account deletion and shared books.** Decided for v1 (PRD K-22): account deletion removes the user's own letters from every book. The cascade fix (`children.created_by on delete set null`, DATA-REQ-012) is in the pending governance migration; section 10 is accurate only after it is applied (CN-10).

**CN-14. Launch geography.** US storefront only (LEGAL-REQ-058). With no web contribution page in v1.0, the DPDP and GDPR questions about overseas grandparents move to the release that adds family members (COUNSEL_PACKET Q22).

**CN-16. Sensitive-data consent and withdrawal.** Placement decided (PRD K-15): one plain screen after account creation and before the first sync; the server refuses content writes without it (`can_write_content()`, SQLSTATE `SCCON`, migration 20261003000000). Questions: Connecticut's reported 15-day stop-processing rule on revocation (Unverified), and Washington's separate sharing consent (D-050; with co-parent only, sharing is with a second parent of the same child). COUNSEL_PACKET Q2.

**CN-17. Biometrics.** The CCPA lists "voice recordings, from which an identifier template ... can be extracted", but only for characteristics used or intended to establish identity [L10]. Washington's MHMDA lists voice recordings in "biometric data" [L9]. Recordings never leave the phone in v1.0, which narrows the question to what we would hold later. The engineering guardrail is LEGAL-REQ-019, and the trust line "we never imitate your voice" (D-061) extends it to synthesis.

**CN-18. Analytics deletion.** The analytics ID is random and never stored with the account, which is why analytics may be "not linked" (Q-005). Account deletion sends the IDs the phone kept to the stateless `analytics-forget` function at request time (TRACKING_PLAN 7); deletion requested by email cannot reach analytics, and section 10 says so.

**CN-19. Device backups.** D-033: recordings live in a backed-up app directory so the user's own iCloud backup includes them; speech models are excluded. "Stays on your phone" claims are about our servers; section 9 discloses the user's own device backups.

**CN-21. Analytics linkage (DEBATES Q-005).** The sentence "We do not try to link analytics to your account or to you, and we do not let PostHog do so" is the public no-reidentification commitment that option (a) of Q-005 needs. It is true either way and stays even if counsel chooses "Linked" on the label. See `app-store-privacy-labels.md` 1.3 for the analysis. COUNSEL_PACKET Q7.

**CN-23. Invite link format and Apple token (security review 2026-10-04).** The independent review (`docs/reviews/2026-10-04-security-privacy.md`) found (M2) that invite tokens travel in the URL path (`https://earlyletters.com/i/<token>`), so 1.3.0's claim that they travel "in the part of the link that servers don't log" was false; 1.4.0 drops it. Restore the claim only after the link moves to a fragment (`/i#t=<token>`) and the website stops logging `/i/*`. It also found (H3) that Sign in with Apple refresh tokens are not yet captured, so deletion cannot revoke them: sections 3 and 10 describe the token and its revocation and are true only once the `apple-token` capture ships (SECURITY.md 5). If it does not ship before submission, remove those two sentences and treat it as an App Review 5.1.1(v) blocker. COUNSEL_PACKET Q23.

**CN-22. Language in analytics and on the server (DEBATES Q-004).** Since migration `20261005000000` (db-followup, 3 Oct 2026), `entries.language` stores each letter's spoken language (one of seven codes, L4), author-only on reads (`book_entries` omits it), and `insights.language_mix` counts families per language with k = 10. The analytics catalogue also sends one of the seven codes on `language_set` and `pack_download` only, after opt-in (TRACKING_PLAN 6.2). PRD 7.10 classifies a person's languages as L4, and a language can be a proxy for national origin or ethnicity. Section 13 discloses it. If counsel says no, the analytics owner removes `lang` (one line each) and this sentence goes. COUNSEL_PACKET Q6.

## Appendix B. Sources

Repository sources (read 3 October 2026): `docs/DECISIONS.md` (D-051 to D-070); `docs/agents/BRIEF-2026-10-03.md`; `docs/ROADMAP.md` 2.0; `docs/adr/0013`, `0015`; `docs/analytics/TRACKING_PLAN.md` sections 0, 6, 7, 10; `docs/ops/SECURITY.md`, `DOMAINS.md`, `runbooks/incident-notification.md`; `supabase/APPLY.md`, `.github/migrations-applied.txt`; `supabase/functions/purge-worker/account.ts`; `apps/mobile/src/lib/models/catalog.ts`; `packages/content/src/strings.en.ts` (`trust`), `permissions.en.ts`, `features/billing.en.ts`; `packages/brand/index.ts`. Earlier inputs (2 October 2026): `docs/ARCHITECTURE.md`; `docs/adr/0001` to `0010`; PRD A to C; the other `docs/legal` drafts.

External sources (opened 2 October 2026 unless marked):

- [L1] FTC, Complying with COPPA: Frequently Asked Questions (A.2, A.8, D.1, D.4, F.6, H.1): https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions
- [L2] Hunton Andrews Kurth, FTC Publishes Final COPPA Rule Amendments: https://www.hunton.com/privacy-and-information-security-law/ftc-publishes-final-coppa-rule-amendments
- [L3] California Privacy Protection Agency, 2025 adjustments to CCPA monetary thresholds: https://cppa.ca.gov/announcements/2024/20241217.html
- [L4] Latham and Watkins, Navigating New Obligations Under the CCPA's Updated Regulations (11 CCR 7001(bbb), 7025(c)(6), 7150): https://www.lw.com/en/insights/navigating-new-obligations-under-the-ccpa-updated-regulations ; also Osano, 2026 CCPA amendments: https://www.osano.com/articles/2026-ccpa-amendments
- [L5] Apple, App Review Guidelines 5.1.1(i), 5.1.1(v), 5.1.2(i), 5.1.4: https://developer.apple.com/app-store/review/guidelines/
- [L6] Cooley, Washington State's My Health My Data Act FAQ, Part One: https://cdp.cooley.com/washington-states-my-health-my-data-act-faq-part-one-applicability-and-scope/
- [L7] Legal 500, India's DPDP Act and the DPDP Rules, 2025: https://www.legal500.com/intelligence/india/privacy/india's-digital-personal-data-protection-act-and-the-dpdp-rules-2025-phased-commencement-core-obligations-and-a-board-ready-compliance-strategy
- [L8] Supabase, Backups (Pro plan keeps 7 days of daily backups): https://supabase.com/docs/guides/platform/backups
- [L9] Washington RCW 19.373.010, .020, .030, .040: https://app.leg.wa.gov/RCW/default.aspx?cite=19.373
- [L10] Cal. Civ. Code 1798.140, via Justia: https://law.justia.com/codes/california/code-civ/division-3/part-4/title-1-81-5/section-1798-140/
- [L11] Kelley Drye, FAQs on the Digital Age Assurance Act (AB 1043), opened 3 October 2026 (secondary): https://www.kelleydrye.com/viewpoints/blogs/ad-law-access/faq-digital-age-assurance-act-california-youth-safety-on-the-internet
- Vendor data terms: see `docs/legal/subprocessors.md`, Appendix.

Unverified in this pass: CalOPPA Do Not Track requirement; CTDPA 15-day revocation rule; Illinois BIPA and Texas CUBI statutory text; Supabase encryption-at-rest details; PostHog retention default; Cloudflare R2 and Hugging Face log retention.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.4.0 | 2026-10-03 | Alignment with the founder decisions of 3 Oct 2026, second round. No audio leaves the phone (short version, sections 3, 4, 7, 9, 11, 15; D-059): backup, Standard and Vault modes, escrow, family playback, web uploads and cloud transcription (Groq, DeepInfra) removed. Co-parent only (sections 2, 7, 12, 14; D-055). No photos in v1.0. Plus checked on the phone; no purchase records on our servers (sections 3, 5, 8, 10, 15; D-053, ADR 0013). Sign-in: Apple, Google, email link (section 3; D-054). Language settings kept on the phone; each letter's language syncs, author-only (`entries.language`, migration 20261005000000); k-anonymised aggregate counts disclosed (section 5); one language code in opt-in analytics (sections 3, 13; Q-004). Never imitate your voice (short version, 6, 13; D-061). Providers: PowerSync, Sentry, Groq, DeepInfra removed; Resend named; Cloudflare (planned download host, Q-001) and Hugging Face (model downloads) disclosed (section 8; subprocessors 1.3.0). Deletion: the email provider's 30-day copy of the completion email stated as an exception to the 45-day processor clock (section 10, CN-12). Purchase-record and crash-report rows removed; Apple sign-in token and deletion-record rows added (section 10). Static "If you are struggling" resources replace the on-device support card (section 13; D-059). Real URLs and hello@earlyletters.com (D-063). Analytics no-reidentification commitment (section 6, CN-21; Q-005). Invite-link "servers don't log" claim removed and Apple-token sentences made conditional on the capture shipping (security review M2 and H3, CN-23). Body version line corrected (it said 1.1.0). Pre-publication draft, no users bound; if 1.3.0 had been published, the removals would narrow what we describe and the analytics language disclosure would be a minor addition; counsel to classify. |
| 1.3.0 | 2026-10-03 | Alignment with PRD.md 1.3 (founder decisions of 3 Oct). Provider is the founder as an individual (section 1, CN-1; placeholders renamed). RevenueCat removed: purchases come from Apple's App Store under a random ID (section 3, processors table, section 10 deletion, CCPA table; ADR 0013). Section 2 notes that the family web page and cloud transcription arrive after the first version (CN-20). Section 10 lists the 12-month security and staff-access log clock beside 24-month activity records (D-021). Pre-publication draft, no users bound; if published, the controller change would be major and the rest minor. |
| 1.2.0 | 2026-10-02 | Product alignment with PRD.md 1.2 (founder decision 2 Oct, K-07): no use of any kind under 18, including local use; age asked before first use (intro, section 12). CN-10 points at the promoted governance migration. Pre-publication draft, no users bound; minor (clarifies a narrower audience, adds protection). |
| 1.1.0 | 2026-10-02 | Privacy review (`memos/lawyer-2.md`). Short version: "by default" on transcription, recovery-key qualifier, no-voiceprint line, deletion line narrowed to "your book" and "your own letters" (PRD K-29). Sections 3 and 5: 18+ confirmation and age signal, per-child profiles, Plus per account, analytics child-count range. Section 7: author-only transcripts (K-09), per-child family lists, how family hear recordings, Standard-mode web playback unlock. Section 10: published deletion clock (31 / 38 / 45 days, K-23), decided invite expiry (K-18), activity records, account-deletion effects on shared and sole-parent books (K-22), analytics deletion limits. Section 11: web uploads no longer described as unreadable to us. Section 12: parent-control sentence corrected (K-10), child-input features unavailable, under-18 closure. Section 13: biometric statement, consent placement and withdrawal in Settings. Section 14: export scope, web deletion page, request extension, provider list on request. Section 15: retention per category, letters as communications, biometric sentence corrected. Section 16: biometric and CHD pointers. Health notice renamed Consumer Health Data Privacy Policy. Pre-publication draft, no users bound; if 1.0.0 had been published this would be major under POLICY_VERSIONING 2.1 item 4 (narrower deletion statement). |
| 1.0.0 | 2026-10-02 | First draft for counsel review. |
