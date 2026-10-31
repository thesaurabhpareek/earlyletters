---
title: Early Letters Privacy Policy
version: 2.1.1
status: draft-for-counsel
effective_date: TBD
last_updated: 2026-10-31
owner: founder
published_at_url: https://earlyletters.com/privacy
---

# Early Letters Privacy Policy

Version 2.1.1. Effective [effective date].

Early Letters is the baby memory book you fill by talking. Parents speak or type letters to their child. This policy explains what Early Letters collects, how we use it, who can see it, and the choices you have. It covers the Early Letters app for iPhone and our website, earlyletters.com.

## 1. Who we are

Early Letters is run by [legal name], an individual based in California ("we", "us"). Write to us at hello@earlyletters.com or [mailing address].

## 2. What we collect

**Your account.** If you sign in, we keep your email address, your name if Apple shares it, the name you sign your letters with, a random account ID, your confirmation that you are 18 or older, the version of our Terms you accepted, and the agreements you gave or withdrew in the app.

**Your book.** For each child: a name or nickname, and a birthday or due date. Your letters: the words you speak or type, the original transcript, each small fix the app made, and the final text. Your list of names and words. All of this is kept on your phone. When you sign in and agree to sync, it is also kept on our servers so it can reach your other devices and your co-parent.

**Your recordings.** Recordings are kept on your phone, and in your phone's own iPhone backup if you use one. Today they are not copied to our servers. Once recording backup is available, they will be copied only if you turn it on, and only in encrypted form (section 4).

**Plus.** Apple handles payment and tells the app on your phone whether you have Plus. Our servers do not receive your purchases, your card details or your receipts.

**Emails and support.** The emails we send you, and anything you write to us. If you ask on our website to hear when the app is ready, we keep your email address for that until you unsubscribe.

**Technical details.** When the app or website connects to our providers, they see your IP address and device type, as any website does.

**What we do not collect.** We do not collect your location, contacts, photos, advertising ID or payment details. In no current build does the app send us usage analytics or crash reports (D-095). We never create a voiceprint or any other biometric identifier. Your reminder times stay on your phone. Your choices for each book, such as whether it appears in reminders, are kept with your book.

**How speech becomes text.** The app turns your voice into text on your phone. No audio or text is sent to any outside service to be turned into text. The app fixes only small slips, such as a stray "um" or a misheard name, and you can undo every fix. It never rewrites your words.

## 3. Who can see your letters

- **You.** A letter is private to you until you add it to a child's book.
- **Your co-parent.** A child's book can have at most two parents. The other parent can read the letters in that book. They cannot see your original transcripts, your fixes or your recordings, and they cannot change or delete your letters.
- **Us.** Letters on our servers are not end-to-end encrypted, so we could read them. We do so only if you ask us for help, to deal with a security problem or misuse of the service, or when the law requires it. Today only the founder has that access.
- **Others.** No one else, unless a valid legal process requires it. We push back on requests that are too broad and, where the law allows, we tell you first.

If a co-parent leaves a book, letters already on their phone or in an export stay with them. We cannot reach those copies.

## 4. Recording backup and the recovery key

Recording backup is not available yet. When it is, it will be free and off until you turn it on, and it will work like this:

- Each recording is encrypted on your phone before it is uploaded. The encrypted copy is stored with Supabase.
- The key that opens your recordings is kept on your own Apple devices, in your iCloud Keychain.
- We also keep a copy of that key, sealed with our recovery key, so you can get your recordings back on a new phone without your old one.
- Our recovery service uses the recovery key for three things only: to send your key to a new phone signed in to your account, to replace the recovery key with a new one, and to answer a valid legal request.
- Before it sends your key to a new phone, we email you and wait one day, or three days if you have another device that uses backup. A device that has used backup for at least 7 days can approve the request sooner. You can stop a request from the email, or from another of your devices that uses backup.
- Each time our recovery service uses the recovery key, the use is logged and we email you. The one exception is a legal request that the law forbids us to tell you about.
- We never listen to your recordings, sell them or use them to train models.

The sealed keys and the encrypted recordings are stored with Supabase. The recovery key is held online only by our recovery service, which runs in its own separate Supabase project, and on two sealed paper copies kept offline in different places. We check those seals every quarter. Someone who had the recovery key and a copy of our stored data could open the backups without the recovery service, and so without a log entry or an email. If you would rather we held no copy of your recordings, leave backup off.

## 5. How we use your information

We use it to keep your book and sync it; to sign you in and keep your account secure; to send the emails the service needs, such as sign-in codes and deletion notices; to remind you, on your phone, before Plus renews; to answer your messages; and to meet our legal duties. We may count how the service is used in totals, such as letters per week, but never report on one family.

We never:

- sell your information or share it for advertising;
- show ads or use tracking tools;
- use your letters, recordings or names to train machine learning models;
- imitate your voice or anyone's voice;
- put letter text in a notification or an email;
- build profiles of you or your child.

Reminders on your phone show your child's name only if you turn that on. An invitation to share a book names the parent who sent it.

## 6. Who helps us run Early Letters

| Company | What it does for us |
|---|---|
| Supabase | Our database, sign-in, file storage and server functions, including the recovery service |
| Cloudflare R2 | Delivers the app's settings and the language and speech files it downloads |
| Resend | Sends our emails |
| Vercel | Hosts our website |

Each acts only on our instructions, under a written contract, and may not sell your information or use it to train models. Some speech model files are downloaded straight from Hugging Face, a public model library, which sees your IP address and the file requested.

Apple provides Sign in with Apple, App Store purchases and iPhone backups under its own terms and privacy policy.

The current list is at https://earlyletters.com/subprocessors. We will update it before a new provider receives letters or recordings.

## 7. How long we keep things, and deleting

We keep your book until you delete it or your account. We never delete them because you stopped using the app or ended Plus.

- **A letter.** Deleting a letter moves it to Recently deleted for 30 days, so you can restore it. Then it is erased.
- **Your account.** Delete it in the app (Settings, Your data), or email us from the address on your account. You have 30 days to change your mind. We then erase your information from our live systems within 31 days of your request, apart from the book entry described under "Letters of someone who left a book" below, from our backups within 38 days, and our providers erase it within 45 days. Our email provider keeps each email it sends for 30 days.
- **Shared books.** Deleting your account removes your letters from every book. A book you share stays with your co-parent. A book where you are the only parent is deleted, except for the entry described next.
- **Letters of someone who left a book.** If a parent left a book, or their joining was undone, before the other parent deleted the book or their own account, that person's letters, their letters waiting to be kept, and any recording backup of theirs are not deleted with it. They stay theirs. To label those letters we keep the book's entry, with the child's name, birth date and due date, and we clear its nickname, photo and other details. Nothing in the app can read that entry today; it will be shown only to the person whose letters remain, once the app can list books they have left. We delete it when nothing of theirs is left in it.
- **Plus.** Deleting your account does not cancel Plus. Cancel it in your Apple Account.

After your account is deleted, we keep only these, and none of them holds your letters or recordings:

- records of what you agreed to, for 3 years, without your name or email;
- activity logs, and the log of each use of the recovery key, for 24 months, without your name or email;
- a record that the deletion happened, for 3 years;
- security logs, for 12 months;
- emails you sent us, for 2 years after your last message.

You can export your letters and the recordings on your phone at any time, free, in Settings, Your data.

## 8. Children

Early Letters is for adults. You must be 18 or older to use it. The app asks before first use and stops if the answer is no. Children do not use the app or sign in, and we do not knowingly collect information from children. What we hold about a child comes from the parents and is used only to keep that child's book. If we learn that someone under 18 has an account, we will close it.

## 9. Health details

Letters can mention health, and a due date shows a pregnancy. We treat everything in a letter as private. Before your book first syncs, we ask for your agreement in a separate step, and you can withdraw it at any time in Settings, Privacy. If you do, syncing stops and we offer to delete what was synced. We never use health details for advertising, and we never try to work out anything about anyone's health.

## 10. Your rights

Wherever you live in the United States, you can ask to see, export, correct or delete your information, and you can withdraw an agreement you gave. Most of this is in the app. Otherwise, email hello@earlyletters.com. We may confirm it is you by sending a code to the email on your account. We reply within 45 days, and may extend once by 45 days if we tell you why. You can use an authorized agent. If we refuse a request, reply with "Appeal" in the subject and we will look again; if we still refuse, we will tell you how to contact your state attorney general. We will never treat you differently for using these rights.

**California.** We do not sell or share personal information, and we have not done so in the past 12 months. We use sensitive information only to provide the service. We honor Global Privacy Control signals. Section 2 lists what we collect, and section 6 who receives it.

## 11. Security

Traffic is encrypted in transit, and data on our servers is encrypted at rest. Access rules limit every database request to what that person may see. Invite links are single use and expire after 7 days. Access to our systems is limited to the founder and protected by two-factor authentication. No system is perfectly secure. If a breach affects your information, we will tell you and the authorities as the law requires.

## 12. Where Early Letters is offered

The app is offered only on the United States App Store, and your information is stored in the United States.

## 13. Changes to this policy

If we make a change that matters to how your information is used, we will tell you in the app and by email at least 30 days before it takes effect, and ask for your agreement where the law requires.

If we ever close Early Letters, we will tell you at least 90 days ahead and keep export working the whole time.

## 14. Contact

[legal name], [mailing address]. hello@earlyletters.com.

## Changelog

| Version | Date | Change |
|---|---|---|
| 2.1.1 | 2026-10-31 | Patch, wording only (review `docs/reviews/2026-10-31/language.md` LNG-36): the opening line uses the product descriptor ("the baby memory book you fill by talking") and drops "notes", which v1.0 does not make. No change to what we collect or do. Version 2.1.1 because 1.5.0, 2.0.0 and 2.1.0 were used by unmerged drafts on other branches (POLICY_VERSIONING 2.4). The drafting notice at the top still must be removed before publication, as it says. |
| 2.1.0 | 2026-10-16 | Covers accounts, sharing a book with a co-parent, how recording backup and the recovery key will work, and Plus reminders. |
| 1.4.0 | 2026-10-03 | Alignment with the founder decisions of 3 Oct 2026, second round. No audio leaves the phone (short version, sections 3, 4, 7, 9, 11, 15; D-059): backup, Standard and Vault modes, escrow, family playback, web uploads and cloud transcription (Groq, DeepInfra) removed. Co-parent only (sections 2, 7, 12, 14; D-055). No photos in v1.0. Plus checked on the phone; no purchase records on our servers (sections 3, 5, 8, 10, 15; D-053, ADR 0013). Sign-in: Apple, Google, email link (section 3; D-054). Language settings kept on the phone; each letter's language syncs, author-only (`entries.language`, migration 20261005000000); k-anonymised aggregate counts disclosed (section 5); one language code in opt-in analytics (sections 3, 13; Q-004). Never imitate your voice (short version, 6, 13; D-061). Providers: PowerSync, Sentry, Groq, DeepInfra removed; Resend named; Cloudflare (planned download host, Q-001) and Hugging Face (model downloads) disclosed (section 8; subprocessors 1.3.0). Deletion: the email provider's 30-day copy of the completion email stated as an exception to the 45-day processor clock (section 10, CN-12). Purchase-record and crash-report rows removed; Apple sign-in token and deletion-record rows added (section 10). Static "If you are struggling" resources replace the on-device support card (section 13; D-059). Real URLs and hello@earlyletters.com (D-063). Analytics no-reidentification commitment (section 6, CN-21; Q-005). Invite-link "servers don't log" claim removed and Apple-token sentences made conditional on the capture shipping (security review M2 and H3, CN-23). Body version line corrected (it said 1.1.0). Pre-publication draft, no users bound; if 1.3.0 had been published, the removals would narrow what we describe and the analytics language disclosure would be a minor addition; counsel to classify. |
| 1.3.0 | 2026-10-03 | Alignment with PRD.md 1.3 (founder decisions of 3 Oct). Provider is the founder as an individual (section 1, CN-1; placeholders renamed). RevenueCat removed: purchases come from Apple's App Store under a random ID (section 3, processors table, section 10 deletion, CCPA table; ADR 0013). Section 2 notes that the family web page and cloud transcription arrive after the first version (CN-20). Section 10 lists the 12-month security and staff-access log clock beside 24-month activity records (D-021). Pre-publication draft, no users bound; if published, the controller change would be major and the rest minor. |
| 1.2.0 | 2026-10-02 | Product alignment with PRD.md 1.2 (founder decision 2 Oct, K-07): no use of any kind under 18, including local use; age asked before first use (intro, section 12). CN-10 points at the promoted governance migration. Pre-publication draft, no users bound; minor (clarifies a narrower audience, adds protection). |
| 1.1.0 | 2026-10-02 | Privacy review (`memos/lawyer-2.md`). Short version: "by default" on transcription, recovery-key qualifier, no-voiceprint line, deletion line narrowed to "your book" and "your own letters" (PRD K-29). Sections 3 and 5: 18+ confirmation and age signal, per-child profiles, Plus per account, analytics child-count range. Section 7: author-only transcripts (K-09), per-child family lists, how family hear recordings, Standard-mode web playback unlock. Section 10: published deletion clock (31 / 38 / 45 days, K-23), decided invite expiry (K-18), activity records, account-deletion effects on shared and sole-parent books (K-22), analytics deletion limits. Section 11: web uploads no longer described as unreadable to us. Section 12: parent-control sentence corrected (K-10), child-input features unavailable, under-18 closure. Section 13: biometric statement, consent placement and withdrawal in Settings. Section 14: export scope, web deletion page, request extension, provider list on request. Section 15: retention per category, letters as communications, biometric sentence corrected. Section 16: biometric and CHD pointers. Health notice renamed Consumer Health Data Privacy Policy. Pre-publication draft, no users bound; if 1.0.0 had been published this would be major under POLICY_VERSIONING 2.1 item 4 (narrower deletion statement). |
| 1.0.0 | 2026-10-02 | First draft for counsel review. |
