---
title: Early Letters Privacy Policy
version: 2.1.0
status: draft-for-counsel
effective_date: TBD
last_updated: 2026-10-15
owner: founder
published_at_url: https://earlyletters.com/privacy
---

# Early Letters Privacy Policy

Version 2.1.0. Effective [effective date].

This policy explains what Early Letters collects, how we use it, who can see it, and the choices you have. It covers the Early Letters app for iPhone and our website, earlyletters.com.

## 1. Who we are

Early Letters is run by [legal name], an individual based in California ("we", "us"). Write to us at hello@earlyletters.com or [mailing address].

## 2. What we collect

**Your account.** If you sign in, we keep your email address, your name if Apple shares it, a random account ID, your confirmation that you are 18 or older, the versions of our Terms and this policy you accepted, the agreements you gave or withdrew in the app, and a record of the devices that have signed in to your account.

**Your book.** For each child: a name or nickname, and a birthday or due date. Your letters: the words you speak or type, the original transcript, each small fix the app made, and the final text. Your list of names and words. All of this is kept on your phone. When you sign in and agree to sync, it is also kept on our servers so it can reach your other devices and your co-parent.

**Your recordings.** Recordings are kept on your phone, and in your phone's own iPhone backup if you use one. They are copied to our servers only if you turn on recording backup, and then only in encrypted form (section 4).

**Plus.** Apple handles payment. If you have an account, the app tells us your plan, your trial end date, your renewal date and whether you have cancelled, so we can send renewal reminders. When you first subscribe, we also record which plan and offer you chose, which version of our Subscription Terms you saw, and when. We never receive your card details or receipts.

**Emails and support.** The emails we send you, and anything you write to us.

**Technical details.** When the app or website connects to our providers, they see your IP address and device type, as any website does. If you allow notifications, we keep a notification token for your device.

**What we do not collect.** We do not collect your location, contacts, photos, advertising ID or payment details. The app sends us no usage analytics or crash reports. We never create a voiceprint or any other biometric identifier. Your settings and reminder times stay on your phone.

**How speech becomes text.** The app turns your voice into text on your phone. No audio or text is sent to any outside speech or AI service. The app fixes only small slips, such as a stray "um" or a misheard name, and you can undo every fix. It never rewrites your words.

## 3. Who can see your letters

- **You.** A letter is private to you until you add it to a child's book.
- **Your co-parent.** A child's book can have at most two parents. The other parent can read the letters in that book. They cannot see your original transcripts, your fixes or your recordings, and they cannot change or delete your letters.
- **Us.** Letters on our servers are not end-to-end encrypted, so we could read them. We do so only if you ask us for help, to deal with a security problem or misuse of the service, or when the law requires it. Today only the founder has that access.
- **Others.** No one else, unless a valid legal process requires it. We push back on requests that are too broad and, where the law allows, we tell you first.

If a co-parent leaves a book, letters already on their phone or in an export stay with them. We cannot reach those copies.

## 4. Recording backup and the recovery key

Recording backup is free and off until you turn it on. When it is on:

- Each recording is encrypted on your phone before it is uploaded. The encrypted copy is stored with Cloudflare R2.
- The key that opens your recordings is kept on your own Apple devices, through your iCloud Keychain.
- We also keep a sealed copy of that key, so you can get your recordings back on a new phone even if your old phone is gone. Only our recovery service can open it, and only to send the key to a phone signed in to your account.
- Before it does, we email you and alert your other signed-in devices, then wait one day, or three days if you have another device that has not approved the request. You can stop a request from the email or from any of your devices.
- Every use of the recovery key is logged, and we email you each time. We use it only to restore your recordings to your own phone, to replace the key, or when the law requires it. We tell you about a legal request unless the law forbids it.
- We never listen to your recordings, sell them or use them to train models.

The master key behind the recovery service is kept offline, sealed, and checked every quarter. Someone holding that key and a copy of our systems could open the backups without the recovery service, which is why so few people can reach it. If you prefer that no copy of your recordings is held by us, leave backup off.

## 5. How we use your information

We use it to keep your book and sync it; to back up and restore recordings when you turn that on; to sign you in and keep your account secure, including telling you when a new device signs in; to tell you when your co-parent adds a letter; to send Plus reminders; to answer your messages; and to meet our legal duties. We may count how the service is used in totals, such as letters per week, but never report on one family.

We never:

- sell your information or share it for advertising;
- show ads or use tracking tools;
- use your letters, recordings or names to train machine learning models;
- imitate your voice or anyone's voice;
- put letter text or names in a notification or an email subject;
- build profiles of you or your child.

## 6. Who helps us run Early Letters

| Company | What it does for us |
|---|---|
| Supabase | Our database, sign-in and server functions, including the recovery service. United States |
| Cloudflare R2 | Stores encrypted recording backups and delivers speech packs |
| Resend | Sends our emails |
| Vercel | Hosts our website |

Each acts only on our instructions, under a written contract, and may not sell your information or use it to train models. Some speech model files are downloaded straight from Hugging Face, a public model library, which sees your IP address and the file requested.

Apple provides Sign in with Apple, App Store purchases, iCloud Keychain, iPhone backups and notification delivery under its own terms and privacy policy.

The current list is at https://earlyletters.com/subprocessors. We will update it before a new provider receives letters or recordings.

## 7. How long we keep things, and deleting

We keep your book and recording backups until you delete them or your account. We never delete them because you stopped using the app or ended Plus.

- **A letter.** Deleting a letter moves it to Recently deleted for 30 days, so you can restore it. Then it is erased.
- **Your account.** Delete it in the app (Settings, Your data), or email us from the address on your account. You have 30 days to change your mind. We then erase your information from our live systems within 31 days of your request, from our backups within 38 days, and our providers erase it within 45 days. Our email provider keeps each email it sends for 30 days.
- **Shared books.** Deleting your account removes your letters from every book. A book you share stays with your co-parent. A book where you are the only parent is deleted.
- **Recordings.** Before your backup is deleted, the app offers to bring any recording that exists only in the backup to your phone.
- **Plus.** Deleting your account does not cancel Plus. Cancel it in your Apple Account.

After your account is deleted we keep only: records of what you agreed to, including when you subscribed (3 years, without your name or email); activity and recovery-key logs, which hold no content (24 months, without your name or email); a record that the deletion happened (3 years); a scrambled copy of your email if you unsubscribed, so we never email you again; and, if a subscription you bought is still active, your email, plan and renewal date until it ends, so we can still send renewal reminders. Security logs are kept 12 months. Support emails are kept 2 years after your last message.

You can export your letters and the recordings on your phone at any time, free, in Settings, Your data.

## 8. Children

Early Letters is for adults. You must be 18 or older to use it. The app asks before first use and stops if the answer is no. Children do not use the app or sign in, and we do not knowingly collect information from children. What we hold about a child comes from the parents and is used only to keep that child's book. If we learn that someone under 18 has an account, we will close it.

## 9. Health details

Letters can mention health, and a due date shows a pregnancy. We treat everything in a letter as private. Before your book first syncs, we ask for your agreement in a separate step, and you can withdraw it at any time in Settings, Privacy. If you do, syncing stops and we offer to delete what was synced. We never use health details for advertising, and we never try to work out anything about anyone's health.

## 10. Your rights

Wherever you live in the United States, you can ask to see, export, correct or delete your information, and you can withdraw an agreement you gave. Most of this is in the app. Otherwise, email hello@earlyletters.com. We may confirm it is you by sending a code to the email on your account. We reply within 45 days, and may extend once by 45 days if we tell you why. You can use an authorized agent. If we refuse a request, reply with "Appeal" in the subject and we will look again; if we still refuse, we will tell you how to contact your state attorney general. We will never treat you differently for using these rights.

**California.** We do not sell or share personal information, and we have not done so in the past 12 months. We use sensitive information only to provide the service. We honor Global Privacy Control signals. Section 2 lists what we collect, and section 6 who receives it.

## 11. Security

Traffic is encrypted in transit, and data on our servers is encrypted at rest. Every database request passes access rules that are tested for each role. Invite links are single use and expire after 7 days. Access to our systems is limited to the founder and protected by two-factor authentication. No system is perfectly secure. If a breach affects your information, we will tell you and the authorities as the law requires.

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
| 2.1.0 | 2026-10-15 | Covers accounts, sharing a book with a co-parent, recording backup with a recovery key, and Plus reminders. |
