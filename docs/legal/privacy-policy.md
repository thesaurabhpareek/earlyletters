---
title: Early Letters Privacy Policy
version: 1.3.0
status: draft-for-counsel
effective_date: TBD
last_updated: 2026-10-03
owner: founder
reviewers: outside privacy counsel (TBD)
---

> **Drafting notice.** This document was drafted by an AI (Claude) acting as privacy counsel and privacy engineer, for review by a licensed attorney. It is not legal advice and must not be published until counsel has reviewed it. Text in square brackets like [CN-4] points to a numbered note for counsel in Appendix A; remove those tags, Appendix A and this notice before publishing. Placeholders in braces ({PUBLISHER_LEGAL_NAME}, {CONTACT_ADDRESS}, {PRIVACY_EMAIL}) must be filled in. The privacy review for version 1.1.0 is `docs/legal/memos/lawyer-2.md`.

# Early Letters Privacy Policy

Version 1.1.0. Effective date: TBD.

Early Letters is a memory book you fill by talking. Parents and close family speak or type notes and letters to a child. This policy explains what we collect, why, who helps us run the service, how long we keep things, and the choices you have. We have tried to write it the way we write everything else: plainly.

## The short version

- **Your words stay yours.** We never sell your data, never share it for advertising, and never use your letters, recordings or photos to train AI models.
- **Recordings stay on your phone by default.** They leave your phone only if you turn on backup, choose cloud transcription, or a family member sends one from the web page. Backups are encrypted on your phone before upload. In Standard backup mode we keep a recovery key so we can help you restore them; in Vault mode we don't.
- **Transcription happens on your phone by default.** If your phone can't do it, we ask before sending any audio to an outside service, and that service does not keep it.
- **Letter text syncs to our servers** once you sign in, so your family can read the book and you can get it back on a new phone. It is protected by access rules and encryption at rest, but it is not end-to-end encrypted, so we could technically read it. We only do so in the narrow cases described in section 7.
- **Analytics are off until you say yes,** and they never include content: no letter text, recordings, photos, names or birthdays.
- **We never make a voiceprint.** We don't use your voice or anyone's face to identify them.
- **You can export your book and delete your own letters, any time, for free.**

## 1. Who we are

Early Letters is made and run by {PUBLISHER_LEGAL_NAME}, an individual based in California ("we", "us"). Our contact address is {CONTACT_ADDRESS}. We decide how and why your information is used, so we are responsible for it. Reach us at {PRIVACY_EMAIL}. [CN-1]

## 2. What this policy covers

This policy covers:

- the Early Letters app for iPhone (and for Android when it launches),
- the family contribution web page that grandparents and other family can use without the app (coming after the first version; at launch, family members write from the app),
- our website and waitlist.

Some features described in this policy arrive after the first version of the app: the family contribution web page and cloud transcription. Until a feature is available, the parts of this policy about it do not apply to you. [CN-20]

It does not cover Apple, Google or other companies you deal with directly, such as when you buy through the App Store or sign in with Apple or Google. Their own privacy policies apply to what they collect.

Early Letters is for adults. You must be 18 or older to use it at all, including on your phone without an account. The app asks before you can use it, and if the answer is no it stops and keeps nothing. We ask you to confirm your age again when you create an account or send a letter from the web page. A book is *about* a child, but the child does not use Early Letters. You can keep a book for more than one child; each child has their own book. See section 12.

Health information has its own short policy, our Consumer Health Data Privacy Policy at {HEALTH_POLICY_URL}. It sits alongside this one.

## 3. What we collect

We collect only what the book needs. Many things never leave your phone. The table shows where each kind of information lives.

| What | Examples | Where it comes from | Where it lives |
|---|---|---|---|
| Account | Email address; name from Sign in with Apple (if you share it); a random account ID; which sign-in methods you linked; that you confirmed you are 18 or older; the version of the Terms and this policy you accepted, and the consents you gave or withdrew, and when | You, Apple or Google when you sign in | Your phone and our database |
| Your profile | Display name, what the child calls you ("Papa", "Nani"), optional photo, languages you speak with the child, Hindi script preference, what matters to you, reminder and appearance settings | You | Your phone and our database (languages, goals and preferences in an owner-only table) |
| Child profiles | For each child: name or nickname, birthday or due date (or month only), optional photo, book theme | You | Your phone and our database |
| Letters and notes | The words you speak or type, the original transcript (kept unchanged), each small fix the app made and whether you kept it, the final text, the date, which child it is for, whether it is in the book, sealed-until date | You | Your phone, and our database once you sign in and agree to sync (section 13) |
| Recordings | The audio of spoken letters | You | **Your phone only**, unless you turn on backup, use cloud transcription, or contribute from the web page (see sections 4 and 7) |
| Photos | A photo you attach to a letter or profile | You | Your phone and our private storage |
| Names and words | Spellings for names, nicknames, places and home words, and how the microphone tends to mishear them | You, and the app (from your profile) | Your phone and our database |
| Family and invites | Who is in each child's book, their role and relationship ("Nani"), invites you send (we keep only a scrambled fingerprint of each invite link, never the link itself), approvals | You and your family | Our database |
| Web contributions | A family member's name and relationship, that they confirmed they are 18 or older, their recording (encrypted in their browser before upload) or typed letter, and a private return link (stored only as a scrambled fingerprint) | The family member | Our database and private storage |
| Purchases | Whether you have Plus, product, trial and renewal dates, refunds, and the store country Apple reports. We never see your card details. | Apple, through the App Store (Google Play when Android launches). Apple tells us the status of your subscription under a random ID, not your name or email | Our database. Apple keeps its own purchase records as the store |
| App usage (only if you agree) | Which features are used, as counts and categories (for example "letter saved, spoken, 1 to 2 minutes"), how many children's books you have as a range, app version, device model and OS version, a random analytics ID | The app, after you say yes | PostHog |
| Crash reports (only if you agree) | Technical details of a crash or error, with letter text, names and links removed before sending | The app, after you say yes | Sentry |
| Support cards | That the app showed a support card, and when. Never the words that led to it. | The app | Your phone only [CN-10] |
| Support messages | What you write to us, and the app version and plan state if you choose to include them | You | Our email provider |
| Encryption keys | Keys that lock your recording backups | The app | Your iCloud Keychain, your family members' devices, and (in Standard backup mode) a locked copy on our servers. See section 11. |

**What we do not collect.** We do not ask for or collect the child's gender, surname, birth weight or place of birth, your location, your contacts, your advertising identifier, your exact age, or payment card details. On iPhone, Apple may tell the app your age range so we can confirm you are an adult; we use it in the moment and do not store it. We do not use session replay or record what is on your screen. We do not create voiceprints, face templates or any other biometric identifier (section 13). "Say the name three times" recordings are used once on your phone to learn how a name is misheard, then deleted. They are never uploaded.

## 4. How transcription works

1. **On your phone, by default.** The app downloads an open-source speech recognition model (Whisper) once, and turns your speech into text on the phone. No audio leaves the phone for this.
2. **Cloud transcription, only if you agree.** Some phones can't run the model, or you may want text before the model has downloaded. In that case the app asks first. If you say yes, we send that recording through our own server to a speech recognition service (Groq, or DeepInfra as a backup) and get the text back. These services are set up so they do not keep your audio or text after answering, and their terms forbid using it to train models (see section 8). Your choice is saved and you can change it in Settings, Privacy. If you say no, everything still works on the phone. Letters sent from the family web page are never sent to these services. [CN-6]
3. **Fixes are small and visible.** The app only repairs microphone and grammar slips, like a misheard name or a stray "um". It never adds meaning. The original transcript is kept unchanged, and you can undo any fix.
4. **Optional editing help (not on at launch).** We may later offer an optional step where a hosted open model suggests more small fixes. If we do, we will ask you first, send only text (never audio), and the same no-retention and no-training terms will apply. We will update this policy before turning it on.

Speech recognition works out which words were said. It does not identify who is speaking, tell voices apart, or keep any measurement of your voice. It keeps only the text and the timing of each word, so the book can highlight words as a recording plays.

## 5. Why we use information

| Purpose | Information used | Legal basis, where a law asks for one (for example GDPR or UK GDPR) |
|---|---|---|
| Keep your book, sync it across your phones and share it with the family you invite | Account, profiles, letters, photos, family, recordings you back up | Performing our contract with you; your consent for sensitive information (section 13) |
| Transcribe and repair speech | Recordings, names and words | Contract; your consent for cloud transcription |
| Confirm that people who create accounts or send letters are adults | Your answer; on iPhone, the age range Apple shares (used in the moment, not stored) | Legal obligation |
| Sign you in and keep the account secure | Account, device tokens, sign-in logs | Contract; legitimate interest in security |
| Send letters from family to the right book | Invites, return links, web contributions | Contract with the parent; legitimate interest of the family member in contributing |
| Reminders and family-letter notifications | Settings, child's month of age | Contract. Reminders are scheduled on your phone and carry no letter text. |
| Plus subscriptions, trials, notices and refunds | Purchases, email address | Contract; legal obligation (renewal notices) |
| Understand which features help, and fix problems | App usage, crash reports | Your consent, which you can withdraw in Settings at any time. Contains no content. |
| Show a support card when a letter suggests someone may need help | Runs on your phone over the letter text; nothing about it is sent to us | Not applicable: processed on your phone only [CN-10] |
| Answer support requests | Support messages | Contract; legitimate interest |
| Comply with law and protect people | Whatever is relevant to a valid legal request or safety case | Legal obligation; vital interests |

We do not use information about a child for anything except building that child's book. We do not use it for marketing, ever.

## 6. What never happens

- We do not sell personal information, and we do not "share" it for cross-context behavioral advertising, as California law defines those words.
- We have no advertising, no ad networks and no tracking SDKs. We do not track you across other apps or websites, so the app never shows Apple's tracking prompt.
- We do not use your letters, transcripts, recordings, photos or names to train AI models, and we do not let our service providers do so. [CN-7]
- Analytics and crash reports never contain letter text, transcripts, recordings, photos, names, birthdays, your email or invite links. The only detail about children in analytics is how many books you keep, as a range (one, two, three or more).
- We never put letter text in notifications.
- We never rewrite your words. Machine fixes are limited to removing or repairing slips, and each one is recorded and reversible.
- We do not create voiceprints or face templates, and we do not use recordings or photos to identify, verify or tell apart the people in them.
- We do not build profiles about you or your child, and we make no automated decisions that affect your rights.

## 7. Who can see your letters

**Your family.** Letters are private to you until you add them to the book. Co-parents can read letters in the book. Family members you invite can read their own letters, and other letters in the book only if a parent turns on "Family can read the book" (off by default). Family letters go into the book only when a parent approves them. Sealed letters show only "A sealed letter from Papa" to others until their date. A seal is a privacy lock in the app, not encryption. Each child's book has its own family list: inviting someone to one child's book does not open the others.

**Your working notes stay yours.** Only the author of a letter can see its original transcript and the list of fixes. Everyone else who can read the letter sees the final text and can play the recording if it is available to them.

**Recordings.** A recording that is not backed up stays on the phone it was made on. Family members can play recordings that are backed up, or that were sent from the web page, and a copy may stay on their phone after playing.

**People who have left.** If someone leaves or is removed, they can no longer read the book. Recordings they already played may still be on their phone, and backups made before they left stay readable with the keys they already had.

**Us.** Letter text and transcripts are stored on our servers so the book can sync and be shared, and they are not end-to-end encrypted. A very small number of our staff could technically read them. We will look only:

- when you ask us to, for support,
- to investigate a security problem or a serious misuse of the service,
- when the law requires it (see below).

Each access is logged and reviewed. [CN-8]

**Recordings you back up.** Recordings are encrypted on your phone before they are uploaded. In **Standard** backup mode, a locked copy of the key is held on our servers so you can get your recordings back if you lose your phone, and so family can play recordings on the web page. This means we could technically open them, under the same narrow conditions, and our server does unlock a recording briefly when a family member plays it on the web page. In **Vault** mode, no copy of the key is held by us: only you and the family devices you approve can open them, and if you lose every device and your Recovery Kit, no one can open those backups, including us.

**Legal requests.** We disclose information to authorities only when a valid legal process requires it, and we push back on requests that are too broad. Where the law allows, we tell you first. We will publish how many requests we receive. [CN-9]

## 8. Service providers

We use a small number of companies to run Early Letters. Each one acts on our instructions, under a written contract, and may use your information only to provide its service to us. We require them to protect it at least as well as this policy does, and to delete it when we ask. None of them may sell it or use your content to train AI models.

| Provider | What they do for us | What they handle | Where |
|---|---|---|---|
| Supabase | Database, sign-in, file storage, our server functions | Account, profiles, letters, photos, encrypted recordings, family data | United States (us-west-1, California) |
| PowerSync | Keeps the copy on your phone in sync with our database | Copies of the rows you are allowed to see, while syncing | United States |
| Groq; DeepInfra (backup) | Cloud transcription, only if you agree | The recording sent, briefly, in memory | United States |
| PostHog | Product analytics without content, only if you agree | App usage, random analytics ID | United States |
| Sentry | Crash and error reports, with content removed, only if you agree | Technical crash data | United States |
| Vercel | Hosts our website and the family contribution page | Web requests; encrypted uploads pass through | United States |
| {EMAIL_PROVIDER} | Sends sign-in, trial and renewal emails | Email address, message content we send | {REGION} |

The full list, with each provider's contact details and data terms, is at {SUBPROCESSORS_URL}. We will update it at least 30 days before adding a provider that handles letters or recordings. [CN-11]

Apple and Google are not our service providers when you buy through their stores or sign in with them; they act on their own terms. Your iCloud Keychain, which holds your backup key, is part of your own Apple account.

Printed books are not available yet. When they are, a print partner (we expect Lulu) and a card payment provider will receive what is needed to print and ship your order, and we will update this policy before launch.

## 9. Where your information lives

Our servers are in the United States, in California. Recordings and most data from the app stay on your phone unless you sign in or turn on backup. If a family member contributes from outside the United States, their letter is sent to and stored in the United States. See section 17.

Your phone's own backups (for example iCloud Backup, or a backup to your computer) may include what the app keeps on the phone. Those backups are in your own Apple or Google account and under your control, not ours. [CN-19]

## 10. How long we keep things

| Information | How long |
|---|---|
| Letters, recordings, photos and profiles | Until you delete them or your account. Nothing is deleted because a subscription ends. |
| Deleted letters, books and accounts | Kept in Recently deleted for 30 days so you can undo. Then erased from our live database and storage within 31 days of your request, from our database backups within 38 days, and by our service providers within 45 days. |
| Earlier versions of a letter's text | As long as the letter exists |
| Recordings on your phone | Until you delete them or the app |
| "Say the name" clips | Deleted right after use, never uploaded |
| Cloud transcription audio and text | Not stored by the transcription service after the answer is returned |
| Invite and return-link fingerprints | Invites to co-parents expire after 7 days, and to family after 14 days. Fingerprints of used, expired or revoked links are erased 90 days later. |
| Support card records | Kept on your phone only; never sent to us [CN-10] |
| App usage analytics (if you agreed) | Up to 12 months (proposed) |
| Crash reports (if you agreed) | Up to 90 days (proposed) |
| Activity records (for example "a letter was deleted", without any content) | 24 months; when you delete your account they no longer show who you are |
| Security and staff-access logs (sign-in events, our staff's access to accounts, key unlocks), without content | 12 months |
| Purchase records | As long as your account exists, then as required for tax and accounting (proposed: 7 years for transaction records only) |
| Consent and policy-acceptance records | Life of the account plus 3 years, to show what you agreed to. When you delete your account they no longer show your name or email. |
| Support emails | 2 years after your last message (proposed) |
| Server logs | Short rolling windows set by our providers; they never contain letter text |

**When you delete your account** [CN-13]:

- Your letters, recordings and photos are removed from every book, including a book you share with a co-parent. That book stays with the co-parent. You can export first.
- A book where you are the only parent is deleted with everything in it, including family letters. Each family member is offered a copy of their own letters first.
- Letters you wrote to someone else's book are removed from it.
- Copies that family already saved or played on their own phones stay with them.
- We delete the random ID that links your account to your App Store purchases and revoke your Sign in with Apple token. Apple keeps its own purchase records as the store, and deleting your account does not cancel Plus; cancel it in your Apple Account. If analytics is on, the app resets its analytics ID and asks PostHog to delete the events sent under it. Analytics are not linked to your account, so we can't find them from an email request alone. [CN-18]

## 11. Security

- All traffic is encrypted in transit (TLS).
- Every read and write on our database goes through access rules tested against every role. Your phone's copy is synced through the same rules.
- Data on our servers is encrypted at rest by our hosting provider.
- Recordings are encrypted on your phone with AES-256-GCM before backup. Keys are stored in your iCloud Keychain and on approved family devices, and, in Standard mode only, as a locked copy on our servers.
- Family recordings from the web page are encrypted in the browser before upload, so they arrive at our servers already locked. As with backups, in Standard mode our server can unlock them to restore them or play them on the web page.
- Invite links and return links are stored only as scrambled fingerprints, travel in the part of the link that servers don't log, and expire or can be revoked.
- Our transcription gateway removes your account ID before sending audio, and logs only timing and size, never content.
- Staff access is limited to the founder and named engineers, with two-factor authentication.

No system is perfectly secure. If a breach affects your information, we will tell you and the authorities as the law requires.

## 12. Children's privacy

**Who uses Early Letters.** Early Letters is made for adults: parents and close family. No one under 18 may use it in any way: the app asks your age before first use, and an answer under 18 stops the app before anything is created or kept, on the phone or with us. Children do not sign in, type, or use the app. We do not offer child accounts, and our App Store listing and website speak to parents. Features that would ask a child to speak or type into the app are not available. [CN-2]

**What we hold about a child.** Because a book is about a child, it holds what the adults who love that child put into it: the child's name, birthday or due date, photos, and letters that mention the child. A recording may include the child's voice in the background. All of this is provided by a parent or a family member a parent invited. We use it only to make that child's book. We never use it for marketing, never sell or share it, and never build a profile of the child.

**Parents are in control.** Only parents can add a child, invite family, approve family letters, or delete a book. Parents can read and export the book, choose which family letters are in it, and delete their own letters. Only a sole parent can delete a whole book; because that removes every letter in it, family members are first offered a copy of theirs. Apart from that, no one can edit or delete another person's words.

**COPPA.** The US Children's Online Privacy Protection Act applies to personal information collected online *from* children under 13, or by services directed to them. Early Letters collects information from adults, about a child, and is not directed to children. If we learn that a person under 13 has created an account or sent a letter, we will delete that account or letter and its recording, and tell the parent who owns the book. If we learn that anyone under 18 has an account, we will close it and, where the law allows, offer an export. See Appendix A, CN-2, for the full analysis.

**When the child grows up.** Letters are meant to be read and heard for years. Today the child reads them with a parent, or through an export the parent shares. If we ever let a young person sign in to read their own book, we will update this policy and meet the children's privacy laws that apply first.

## 13. Health, voice and other sensitive details

Letters are free-form, so a parent may mention a child's health, a hospital stay, a pregnancy, family beliefs or other sensitive things. We treat everything in a letter as private content: it is protected the same way, never analyzed for advertising, never sent to analytics, and never used to make decisions about you. Our Consumer Health Data Privacy Policy at {HEALTH_POLICY_URL} explains your rights under Washington's My Health My Data Act, Nevada's and Connecticut's consumer health data laws, and similar laws. [CN-3]

- **Due dates.** If you start a book before your child is born, we store the due date. Information about a pregnancy is health information under some state laws. We use it only to date letters and sort the book.
- **Languages.** The languages you speak with your child help the app transcribe you correctly. We keep them in a table only you can read, and never send them to analytics.
- **Support cards.** If a letter contains words that suggest someone might need support, the app may show a gentle card with resources. This check runs on your phone and never blocks saving. The record that a card was shown stays on your phone. Nothing about it is sent to us, and we never read the words. [CN-10]
- **Voice recordings and photos.** Some laws list voice recordings and images of faces as kinds of biometric data, because a voiceprint or face template could be made from them. We never make one. We don't measure the features of a voice or face, identify or verify anyone from a recording or photo, or tell speakers apart. Recordings are kept so your family can hear them, and photos so they can see them. That is all. If this ever changes, we will update this policy and ask for your written consent first. [CN-17]

**Your agreement.** Because letters may hold health and other sensitive details about you and your child, we ask for your agreement in a separate, plain step before anything you write is first synced to your account. If you say no, you can keep using Early Letters on your phone; syncing, backup and family sharing stay off. You can withdraw your agreement at any time in Settings, Privacy. Syncing then stops, and we offer to delete what you already synced. Letters you keep only on your phone are never sent to us. [CN-16]

## 14. Your choices and rights

Wherever you live in the United States, you can do the following, free of charge.

| You can | How |
|---|---|
| See and download your book | Settings, Your data, Export everything. You get a ZIP with every letter you wrote (original transcript, fixes and final text), the final text of family letters in the book, every recording on the phone or in backup, a PDF of the book, and a guide to the formats. Works offline. |
| Correct information | Edit your profile, the child's profile and your own letters in the app. The original transcript of a letter is kept unchanged as part of its history; you can delete the whole letter. |
| Delete a letter, a book or your account | In the app (Settings, Your data), or on the web at {WEB_DELETION_URL}. We keep it in Recently deleted for 30 days, then erase it on the timeline in section 10. |
| Move your data elsewhere | The export uses open formats (JSON, M4A audio, PDF) that other services can read. |
| Turn analytics and crash reports on or off | Settings, Privacy. They stay off until you say yes, and nothing in the app depends on them. |
| Withdraw your agreement to sync sensitive details | Settings, Privacy, Sync and family sharing (section 13). |
| Withdraw consent for cloud transcription | Settings, Privacy. Future recordings are transcribed on the phone only. |
| Turn off backup, or switch to Vault mode | Settings, Recordings and backup. |
| Hide names on the lock screen | Settings, Privacy. |
| Ask which companies have your information | Email us. We send the list of our service providers, with their contact details. |
| Ask us for a copy, a correction or deletion, or ask a question | Email {PRIVACY_EMAIL}. |

**How we handle requests.** We answer within 45 days. If we need longer, we will tell you within those 45 days and finish within 45 more. If you write from the email address on your account, we confirm by sending a sign-in link to that address before acting. You can use an authorized agent; we will ask for proof that you gave them permission. We will never treat you differently for using your rights. If we say no to a request, we will explain why, and you can appeal by replying to our answer with "Appeal" in the subject. We will respond to an appeal within 45 days and, if we still decline, tell you how to contact your state attorney general.

**Family members' letters.** Each letter belongs to the person who wrote it. A parent can keep a family letter out of the book but can't edit or delete another person's words, except by deleting the whole book as its only parent (section 12). A family member who leaves can take their letters out of the book and keep a copy.

## 15. Notice for California residents

This section is our notice at collection and our privacy policy under the California Consumer Privacy Act as amended by the California Privacy Rights Act (CCPA), and the California Online Privacy Protection Act. [CN-4]

**Categories we collect, in the last 12 months:**

| CCPA category | Examples | Source | Purpose | Disclosed for a business purpose to | Sold or shared | How long we keep it |
|---|---|---|---|---|---|---|
| Identifiers | Email, name, random account and analytics IDs | You; Apple or Google sign-in | Account, sync, support, analytics | Supabase, PostHog, email provider (and PowerSync if we use it) | No | Life of the account; analytics up to 12 months |
| Customer records (Cal. Civ. Code 1798.80(e)) | Name, email | You | Account | Supabase, email provider | No | Life of the account |
| Commercial information | Plus purchases, trials, refunds | Apple, through the App Store | Subscriptions | Supabase | No | Life of the account, then transaction records 7 years (proposed) |
| Internet or other electronic network activity | Feature usage counts, crash reports | The app, only if you agree | Analytics, fixing problems | PostHog, Sentry | No | Up to 12 months (usage) and 90 days (crashes) |
| Audio, electronic, visual or similar information | Recordings you back up or send for transcription; photos | You | The book; transcription | Supabase, Groq or DeepInfra (only with consent), Vercel (encrypted uploads) | No | Until you delete them or your account |
| Sensitive personal information | Letter contents (letters to your family, which we are not the intended reader of); information about a child under 16 (name, birthday, photos); a due date | You | Only to provide the book you asked for | Supabase, PowerSync | No | Until you delete them or your account |
| Inferences | None. We do not create profiles. | | | | No | |

We do not collect precise geolocation, government IDs, financial account details or contacts. We do not use recordings or photos to establish anyone's identity, so we do not process biometric information to identify anyone (section 13).

**Sensitive personal information.** We use and disclose sensitive personal information only to provide the service you asked for and for the other purposes the CCPA regulations allow, so the right to limit its use does not need a separate link. We do not use it to infer characteristics about you or your child.

**Do Not Sell or Share.** We do not sell or share personal information, and we have not done so in the past 12 months. We do not knowingly sell or share the personal information of anyone under 16. Because we don't sell or share, there is no opt-out to make, but we still honor Global Privacy Control and similar browser signals as a request to opt out, and confirm it when we receive one.

**Your California rights.** You have the right to know what we collect, use and disclose; to access and get a portable copy; to delete; to correct; to opt out of sale or sharing; to limit use of sensitive personal information; and not to be discriminated against for using these rights. Use the steps in section 14.

**Shine the Light.** We do not disclose personal information to third parties for their own direct marketing.

**Do Not Track.** We do not track you across other sites, so we treat every visitor the same way whether or not the browser sends a Do Not Track signal.

## 16. Other US states

Residents of states with consumer privacy laws (including Colorado, Connecticut, Virginia, Texas, Oregon, Maryland and others) have similar rights to access, correct, delete and port their data, to opt out of sale, targeted advertising and profiling, and to appeal a decision. We do none of the opt-out activities, and we honor the other rights for every US user, whether or not a state law requires it. Use the steps in section 14. [CN-4]

**Sensitive data.** Some states, including Connecticut, require consent before processing sensitive data such as health information. We ask for it as described in section 13, and we process it only as needed to keep and show the book you asked for.

**Consumer health data (Washington, Nevada, Connecticut and similar laws).** See our Consumer Health Data Privacy Policy at {HEALTH_POLICY_URL}. [CN-3]

**Biometric privacy laws (for example Illinois, Texas and Washington).** We do not create or collect biometric identifiers such as voiceprints or face geometry (section 13).

## 17. Outside the United States

**At launch, the Early Letters app is offered only in the United States App Store.** We do not offer it in the European Economic Area, the United Kingdom, Switzerland or India, and we do not market to people there. [CN-14]

Families travel, though. A grandparent in India or the UK may open an invite link and send a letter from the contribution page. If you do, your name, relationship and letter (and its recording, encrypted in your browser) are sent to and stored in the United States so the child's parents can receive them. You can ask us to see or delete what you sent at {PRIVACY_EMAIL}, and you can take your letters out of the book at any time from your return link.

Before we offer the app outside the United States, we will update this policy with the rights and legal bases that apply there (for example under GDPR, UK GDPR or India's Digital Personal Data Protection Act).

## 18. If we close or change hands

If we ever plan to close Early Letters, we will tell you at least 90 days ahead and keep export working the whole time. If another company acquires Early Letters, this policy will still apply to the information we already hold, and we will tell you before any change to how it is used.

## 19. Changes to this policy

Each version has a number and an effective date. Earlier versions are kept at {POLICY_ARCHIVE_URL}. For a small change, we update the number and date. For a change that matters to how your information is used, we tell you in the app and by email at least 30 days before it takes effect, and where the law requires it, we ask for your agreement first. We will never apply a less protective policy to content you already gave us without asking.

## 20. Contact

{PUBLISHER_LEGAL_NAME}, {CONTACT_ADDRESS}. Email {PRIVACY_EMAIL}. We read every message and reply within 10 business days, and within the legal deadlines in section 14.

---

## Appendix A. Notes for counsel (remove before publishing)

**CN-1. Controller identity (updated 3 Oct 2026).** Founder decision (`docs/DECISIONS.md` D-004): the app is published under the founder's individual Apple Developer account, with no LLC for now. The controller is the founder as an individual; the App Store shows the founder's legal name as the seller. Fill {PUBLISHER_LEGAL_NAME} and a {CONTACT_ADDRESS} counsel accepts for an individual (a mailing address rather than a home address, if lawful for each notice). Confirm whether "we" is acceptable for an individual and whether any state law needs a named privacy contact. `packages/brand` holds only a TODO marker for the name (never in code). If an entity is formed later, the controller changes, which is a major change for published users (POLICY_VERSIONING 2.1 item 9, counsel to classify) and an app transfer (D-004 point 5).

**CN-20. Features after the first version.** PRD.md 1.3 (3 Oct 2026) moved the web contribution page to v1.1 and has no cloud transcription in v1.0. The sentence in section 2 keeps the policy accurate at launch without rewriting every row; when each feature ships, remove its mention from that sentence (minor change). If the founder approves "shared voice" (D-032), recordings of letters in a shared book upload encrypted so family can hear them; the short version, section 4 and Terms 12.1 then change before publication.

**CN-2. COPPA analysis.** Recommendation: COPPA should not apply to v1 as designed, but the margin is product-dependent. Full analysis in `memos/lawyer-2.md` finding H5.

- *Why not.* COPPA covers operators of services directed to children under 13 and operators with actual knowledge that they collect personal information online from a child (FTC COPPA FAQ A.2, A.8 [L1]). Our users are adults; the child never signs in, types or speaks to the app as a user. Information about the child comes from the parent. Under the FAQ, information collected from parents about their children is outside COPPA. Read together plays audio to the child and collects nothing. The App Store listing and site are parent-facing (Apple 5.1.4 and 2.3.8 [L5]); the "kids" keyword and "listen on their own" copy were removed on 2 Oct 2026 (PRD K-20).
- *2025 amendments.* The amended Rule (effective June 2025, compliance date 22 April 2026) expands "personal information" to include biometric identifiers and adds separate consent for third-party disclosure, a written retention policy and a written security program [L2]. We create no voiceprints or other biometric templates; Whisper produces text, not speaker identity. Even though COPPA should not apply, we recommend adopting the written retention policy (`data-policy.md`) and security program as good practice.
- *What would trigger COPPA (kept out of v1):*
  1. Child sign-in or child accounts, including a "read your own book" login before 13.
  2. The `together` prompts ("Ask {child}: ... Keep the answer"), "Write one together" and sibling letters (B-REQ-020). These prompt a child to speak into the app; the audio file with the child's voice is personal information [L1 FAQ F.6], and prompting a child to provide it is "collection" even through a parent's phone. All sit behind the `child-input` flag, off in production until counsel's written opinion (PRD K-19, PRD-REQ-005, LEGAL-REQ-059). Section 12 says these features are not available; that sentence must change if the flag turns on.
  3. A web contribution link forwarded to an under-13 cousin or sibling. The 18+ confirmation on Send (PRD K-07) and the deletion runbook (DATA-REQ-027) are the controls. "Other" relationship free text that signals a child ("big sister") could be actual knowledge; support should treat it as a trigger to ask.
  4. Interactive features aimed at the child (games, voice responses in Read together, child-facing prompts or characters), child-directed marketing, or the Kids category.
  5. The FTC audio-file exception (FAQ F.6 [L1]) does not help us: it covers audio collected only as a replacement for written words and deleted promptly, while we keep audio as a keepsake.
- *A baby's voice in the background* of a parent's letter is information about a child provided by the parent, not collected from the child. We recommend counsel confirm this in writing because it is the one COPPA question every recording raises.
- *Age assurance.* Texas SB 2420 and Apple's age-range requirements reach app developers (compliance register CR-004, CR-005). The 18+ confirmation and Declared Age Range handling are PRD K-07 and LEGAL-REQ-002. Section 12 now also states the under-18 closure rule from Terms 1.5.

**CN-3. Consumer health data.** Resolved in drafting: letters, transcripts and due dates can contain consumer health data; the separate Consumer Health Data Privacy Policy is drafted at `docs/legal/consumer-health-data-notice.md` (document key `health-privacy`). Open items for counsel are in that file's notes (parent consent for a child's data under MHMDA, on-device safety tiering as "collection", separate sharing consent at first invite, homepage links including the App Store page and the web contribution page). Washington's "homepage" includes any web page where personal information is collected and a mobile app's platform or download page [L9], so the link must appear on the website homepage, the contribution page and the App Store listing.

**CN-4. CCPA applicability.** The CCPA applies to a "business" with annual gross revenue over $26,625,000 (adjusted from 1 January 2025 [L3]), or that buys, sells or shares personal information of 100,000+ consumers or households, or gets 50%+ of revenue from selling or sharing. We do not sell or share, and revenue will be far below the threshold at launch, so the CCPA likely does not apply yet. We recommend complying voluntarily (section 15) because (a) it is the brand promise, (b) CalOPPA applies regardless and requires a posted policy and a Do Not Track disclosure (general knowledge, Unverified in this pass), and (c) since 1 January 2026 the CCPA regulations treat personal information of consumers under 16 as sensitive personal information where the business has actual knowledge of age (11 CCR 7001(bbb) [L4]). A child's name and birthday in a book is exactly that, once the CCPA applies. Version 1.1.0 adds the retention period per category that a notice at collection must give. Confirm that use "to provide the service requested" keeps us within the 7027(m) purposes, so no "Limit" link is needed, and whether a risk assessment under 11 CCR 7150 is required once we qualify. Other state laws mostly have 100,000 or 35,000-consumer thresholds, but Connecticut applies to any controller that processes sensitive data from 1 July 2026 (register CR-020). Maryland limits sensitive-data processing to what is strictly necessary for the requested service (Secondary, register CR-022); keeping, syncing and showing letters is that.

**CN-5. Analytics consent.** Resolved (PRD K-01): analytics and crash reporting are opt-in and nothing is sent before a choice (Apple 5.1.1(ii), LEGAL-REQ-003). Remaining: ADR 0008 wording (analytics engineer) and approval of the `analyticsConsent.*` strings (see memo H1).

**CN-6. Third-party AI disclosure and brand voice.** Apple 5.1.2(i) requires clear disclosure and explicit permission before sharing personal data with third-party AI [L5]. The brand voice forbids naming the technology in product copy. This policy names it (sections 4 and 8) because a legal disclosure must be accurate. Confirm the consent sheet wording also satisfies 5.1.2(i) while following the voice guide as far as possible; we recommend the sheet names the provider category ("an outside speech recognition service") and links here. Web contributors' audio is transcribed on a parent's phone (PRD K-09), so section 4 states it never goes to these services.

**CN-7. No-training promise.** Verified as of 2 October 2026 for Supabase, PostHog, Groq, DeepInfra (for the models we use), and Cloudflare. Sentry, PowerSync and Vercel have weaker or silent terms (RevenueCat, also silent, is no longer used, ADR 0013); see subprocessors.md section 4. **Launch gate:** PowerSync holds letter text and has no written no-training clause. Section 6 cannot be published as written until PowerSync confirms in writing or the gap is otherwise closed.

**CN-8. Staff access.** Text is not end-to-end encrypted (ADR 0006). The service role can read entries. The policy commits to logged access. Engineering must build an access log for service-role reads of `entries`, `entry_versions` and storage before launch, or the sentence must be softened.

**CN-9. Transparency reporting.** We committed to publishing request counts. Confirm whether to keep this commitment for a small company.

**CN-10. Safety events.** Decided (PRD K-06, PRD-REQ-006, LEGAL-REQ-015): tiers stay on the device and a new migration drops `public.safety_events`. That migration has not shipped: the core migration still creates the table, and the drop is in `supabase/migrations/20261002020000_data_governance.sql` (promoted from the draft on 2 Oct 2026; it drops the table instead of purging it). That migration is written but not yet applied to the live project (`supabase/APPLY.md`). **Do not publish sections 3, 5, 10 and 13 as written until it is applied.**

**CN-11. Subprocessor notice.** 30 days' notice before adding a provider that handles content. Confirm this matches what our vendors give us (PostHog 14 days, Sentry 30 days, Vercel unspecified "from time to time" with a 5-day objection window).

**CN-12. Retention periods marked "proposed".** These are our proposals, not current behavior. Engineering must implement scheduled purges for invites, return links and consent records (`purge_due()`, DATA-REQ-006). Invite expiry (7 and 14 days) and the 90-day fingerprint rule are now decided (PRD K-18). The 31 / 38 / 45 day deletion clock is the published promise (PRD K-23, DATA-REQ-036).

**CN-13. Account deletion and shared books.** Decided for v1 (PRD K-22): account deletion removes the user's own letters from every book; "leave my letters for {child}" (B-REQ-025) is P2 and would need a licence that survives account deletion and a consent analysis. The cascade bug (`children.created_by on delete cascade`) must be fixed (DATA-REQ-012) before section 10 is accurate. PRD K-10's suggested sentence ("no one can edit or delete another person's words") is not fully accurate, because a sole parent's book deletion removes family letters (DELETION_AND_EXPORT_SPEC 2.4); section 12 says so.

**CN-14. Launch geography.** US only (PRD section 1; LEGAL-REQ-058). The target audience includes Indian diaspora families, so the contribution page will receive letters from grandparents in India and elsewhere. Questions: (a) Does accepting web contributions from India amount to "offering goods or services to Data Principals within India" under section 3 of the DPDP Act [L7]? Core DPDP obligations commence 13 May 2027. (b) Same under GDPR Art. 3(2) and UK GDPR for contributors in the EEA or UK. (c) If yes, do we geo-limit the contribution page, add a notice and consent at the contribution page, or plan for compliance? (d) The DPDP Act defines a child as under 18 and requires verifiable parental consent for a child's data; our "parent provides data about their own child" model should be confirmed before any India launch.

**CN-15. Recording others.** Terms 5.4 (1.2.0) now covers other adults' voices. California Penal Code 632 two-party consent remains general knowledge, Unverified.

**CN-16. Sensitive-data consent and withdrawal.** Placement decided (PRD K-15, PRD-REQ-002): one plain screen after account creation and before the first sync. Withdrawal follows LEGAL-REQ-006 (sync stops; the app offers export and "delete my synced letters"). Two questions: (a) Connecticut's CTDPA reportedly requires a controller to stop processing within 15 days of a consent revocation (Unverified; statute not opened). Continuing to store already-synced letters is processing. If that reading holds, withdrawal must delete the server copy within 15 days rather than only offer to. (b) Washington requires consent to share consumer health data to be separate from consent to collect it, unless sharing is necessary for a service the consumer requested (RCW 19.373.030 [L9]). See the CHD policy notes.

**CN-17. Biometrics.** The CCPA definition of "biometric information" lists "voice recordings, from which an identifier template ... can be extracted", but only as part of characteristics "used or ... intended to be used ... to establish individual identity" [L10]. Washington's MHMDA lists voice recordings and face imagery in "biometric data", which is consumer health data [L9]. Illinois BIPA and Texas CUBI define biometric identifiers as including a "voiceprint" and hand or face geometry (general knowledge, statutes not opened this pass). Version 1.0.0 said "we do not collect biometric information" without qualification; 1.1.0 states precisely what we do not do and treats recordings and photos conservatively in the CHD policy. The engineering guardrail is LEGAL-REQ-019; it should be extended to photos (no face detection, landmarking or recognition, including OS frameworks used for auto-cropping).

**CN-18. Analytics deletion.** The analytics ID is random and never stored with the account (privacy labels 1.3), which is why analytics are "not linked". That also means a server-side account deletion cannot find PostHog events. Engineering: the in-app deletion flow should send the current analytics ID to the deletion function once, in memory only, so PostHog `delete_events` can run; deletion requested by email cannot reach analytics, and section 10 says so.

**CN-19. Device backups.** iOS includes app container files in iCloud and computer backups unless they are marked excluded. "Stays on your phone" claims are about our servers; section 9 discloses the user's own device backups. Engineering decision: whether audio and the local database are excluded from device backup (DATA-REQ line on device backups).

## Appendix B. Sources

Repository sources (read 2 October 2026): `docs/ARCHITECTURE.md`; `docs/adr/0001` to `0010`; `supabase/migrations/20260930000000_scribe_core.sql`, `20261001000000_scribe_hardening.sql`, `20261002010000_entries_select_policy.sql` and `drafts/20261002000000_data_governance.sql`; `docs/prd/PRD.md` (1.1), `A-entry-and-auth.md`, `B-first-run-and-family.md`, `C-habits-pricing-settings.md`; `docs/legal/DELETION_AND_EXPORT_SPEC.md`, `data-policy.md`, `ENGINEERING_REQUIREMENTS.md`, `POLICY_VERSIONING.md`; `docs/research/USER_RESEARCH.md`, `COMPETITIVE_RESEARCH.md`; `packages/content/VOICE.md`, `BRAND.md`, `src/*.en.ts`; `packages/brand/index.ts`.

External sources (opened 2 October 2026):

- [L1] FTC, Complying with COPPA: Frequently Asked Questions (A.2, A.8, D.1, D.4, F.6, H.1): https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions
- [L2] Hunton Andrews Kurth, FTC Publishes Final COPPA Rule Amendments: https://www.hunton.com/privacy-and-information-security-law/ftc-publishes-final-coppa-rule-amendments
- [L3] California Privacy Protection Agency, 2025 adjustments to CCPA monetary thresholds: https://cppa.ca.gov/announcements/2024/20241217.html
- [L4] Latham and Watkins, Navigating New Obligations Under the CCPA's Updated Regulations (11 CCR 7001(bbb), 7025(c)(6), 7150): https://www.lw.com/en/insights/navigating-new-obligations-under-the-ccpa-updated-regulations ; also Osano, 2026 CCPA amendments: https://www.osano.com/articles/2026-ccpa-amendments
- [L5] Apple, App Review Guidelines 5.1.1(i), 5.1.1(v), 5.1.2(i), 5.1.4: https://developer.apple.com/app-store/review/guidelines/
- [L6] Cooley, Washington State's My Health My Data Act FAQ, Part One: https://cdp.cooley.com/washington-states-my-health-my-data-act-faq-part-one-applicability-and-scope/
- [L7] Legal 500, India's DPDP Act and the DPDP Rules, 2025: https://www.legal500.com/intelligence/india/privacy/india's-digital-personal-data-protection-act-and-the-dpdp-rules-2025-phased-commencement-core-obligations-and-a-board-ready-compliance-strategy
- [L8] Supabase, Backups (Pro plan keeps 7 days of daily backups; Storage objects are not in database backups): https://supabase.com/docs/guides/platform/backups
- [L9] Washington RCW 19.373.010 (definitions, including "biometric data", "consumer", "homepage"), 19.373.020 (CHD privacy policy contents and homepage link), 19.373.030 (collection and separate sharing consent), 19.373.040 (rights, deletion from backups within six months, 45 days): https://app.leg.wa.gov/RCW/default.aspx?cite=19.373
- [L10] Cal. Civ. Code 1798.140 (definitions of "biometric information" and "sensitive personal information"), via Justia: https://law.justia.com/codes/california/code-civ/division-3/part-4/title-1-81-5/section-1798-140/
- Vendor data terms: see `docs/legal/subprocessors.md`, Appendix.

Unverified in this pass: CalOPPA Do Not Track requirement; CTDPA 15-day revocation rule; Illinois BIPA and Texas CUBI statutory text; California Penal Code 632; Supabase encryption-at-rest details; PostHog and Sentry retention defaults.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.3.0 | 2026-10-03 | Alignment with PRD.md 1.3 (founder decisions of 3 Oct). Provider is the founder as an individual (section 1, CN-1; placeholders renamed). RevenueCat removed: purchases come from Apple's App Store under a random ID (section 3, processors table, section 10 deletion, CCPA table; ADR 0013). Section 2 notes that the family web page and cloud transcription arrive after the first version (CN-20). Section 10 lists the 12-month security and staff-access log clock beside 24-month activity records (D-021). Pre-publication draft, no users bound; if published, the controller change would be major and the rest minor. |
| 1.2.0 | 2026-10-02 | Product alignment with PRD.md 1.2 (founder decision 2 Oct, K-07): no use of any kind under 18, including local use; age asked before first use (intro, section 12). CN-10 points at the promoted governance migration. Pre-publication draft, no users bound; minor (clarifies a narrower audience, adds protection). |
| 1.1.0 | 2026-10-02 | Privacy review (`memos/lawyer-2.md`). Short version: "by default" on transcription, recovery-key qualifier, no-voiceprint line, deletion line narrowed to "your book" and "your own letters" (PRD K-29). Sections 3 and 5: 18+ confirmation and age signal, per-child profiles, Plus per account, analytics child-count range. Section 7: author-only transcripts (K-09), per-child family lists, how family hear recordings, Standard-mode web playback unlock. Section 10: published deletion clock (31 / 38 / 45 days, K-23), decided invite expiry (K-18), activity records, account-deletion effects on shared and sole-parent books (K-22), analytics deletion limits. Section 11: web uploads no longer described as unreadable to us. Section 12: parent-control sentence corrected (K-10), child-input features unavailable, under-18 closure. Section 13: biometric statement, consent placement and withdrawal in Settings. Section 14: export scope, web deletion page, request extension, provider list on request. Section 15: retention per category, letters as communications, biometric sentence corrected. Section 16: biometric and CHD pointers. Health notice renamed Consumer Health Data Privacy Policy. Pre-publication draft, no users bound; if 1.0.0 had been published this would be major under POLICY_VERSIONING 2.1 item 4 (narrower deletion statement). |
| 1.0.0 | 2026-10-02 | First draft for counsel review. |
