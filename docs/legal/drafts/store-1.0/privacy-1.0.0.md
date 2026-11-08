---
title: Early Letters Privacy Policy
document: privacy
version: 1.0.0
status: draft-for-counsel
review: DRAFT for counsel and founder review (D-125). Written by an AI drafting agent, with no legal review. Not legal advice. Every [COUNSEL Q] and [FOUNDER] mark is open and must be resolved and removed before publishing.
scope: the Early Letters app for iPhone, version 1.0 from the App Store (build 12, EAS production profile with server features on against the production Supabase project), and earlyletters.com with its email list
source: docs/legal/beta/privacy-0.9.0.md (published 0.9.0, the servers-on test text), with Plus, account deletion and the public release added from docs/legal/privacy-policy.md 3.0.0; checked against the code on develop at 1189fdff
supersedes: privacy 0.9.0 (proposed; see the PR body)
proposed_url: https://earlyletters.com/legal/privacy/1.0.0
last_updated: 2026-11-08
---

> **DRAFT for counsel review. Not legal advice.** This banner, the frontmatter `review:` line and every bracketed mark come out before publishing.
>
> **True only if build 12 is made with:** `EXPO_PUBLIC_SERVER_FEATURES=on`, `EXPO_PUBLIC_ANALYTICS=off`, `EXPO_PUBLIC_STATUS_REPORT=off`, `EXPO_PUBLIC_ENGLISH_ONLY=on`, `EXPO_PUBLIC_ACCOUNT_DELETION=on`, no Google or passkey variables, and `EXPO_PUBLIC_BACKUP` as founder decision F-8 says. On 8 Nov `apps/mobile/eas.json` `production` still writes servers `off`, and no production Supabase project is shown (gap map section 0). The deletion and keeping periods in section 8 are true only once the purge worker and its schedule run on the production project (gap map S-54).

# Early Letters Privacy Policy

Version 1.0.0. Effective [effective date].

Early Letters keeps letters to your child, in your own words and voice. Parents speak or type letters to their child. This policy explains what Early Letters collects, how we use it, who can see it, how long we keep it, and the choices you have. It covers the Early Letters app for iPhone from the App Store, and our website, earlyletters.com, with its email list.

## The short version

- You can write and keep letters on your iPhone without an account. If you sign in and agree to sync, your letters and your child's details are also kept on our servers, so they reach your other iPhone and your child's other parent.
- Your recordings stay on your iPhone and in your own iPhone backup. [F-8: or, if backup ships, "are copied to us only if you turn on backup, encrypted on your phone first", section 5.]
- Your voice is turned into text on your iPhone. No audio or text is sent to anyone to be turned into text.
- Letters on our servers are not end-to-end encrypted, so we could read them. We do so only in the cases in section 4.
- We do not sell your information, show ads, track you or use your letters to train machine learning models.
- The app sends no usage analytics and no crash reports of its own.
- Apple sells Plus. Our servers do not receive your purchases.
- You can delete your account in the app. Section 8 says what is deleted and when.

## 1. Who we are

Early Letters is published by [legal name] ("we", "us"), the Seller named on the App Store. Write to us at hello@earlyletters.com or [mailing address]. [COUNSEL Q S-7 (packet Q47, Q1): individual or entity, and whether a legal name and postal address must appear. Founder decision F-2. 0.9.0 said only "its founder".]

## 2. What we collect, and why

| What | When | Why |
|---|---|---|
| **Your account:** your email address; your name, if Apple shares it; the name you sign your letters with; a random account ID; that you confirmed you are 18 or older; the versions of our Terms and of the health details agreement (section 10) you accepted or declined, and when | When you sign in | To sign you in, keep your book in sync, and keep a record of what you agreed to |
| **Sign-in details:** if you use Sign in with Apple, Apple's ID for you and a token Apple gives us, which we store encrypted; if you use an email link or code, the code is sent to your email | When you sign in | To sign you in, and to tell Apple to end the connection when you delete your account (section 8) |
| **Your book:** for each child, a name or nickname, and a birthday or a due date; your list of names and words | When you sign in and agree to sync | So the book reaches your other iPhone and your child's other parent |
| **Your letters:** the words you speak or type, the original transcript, each small fix the app made, your own changes, the final text, earlier versions of a changed letter, and letters waiting for you to keep them | When you sign in and agree to sync | The same |
| **Book sharing:** who belongs to each book and when they joined; invitations you send, kept as a code we cannot read back | When you invite or join | So two parents can share one book |
| **Emails you send us** | When you write to us | To answer you |
| **Technical details:** your IP address and device type, seen by our providers when the app connects | Every connection | To deliver the service and keep it secure (section 6) |

**What stays on your iPhone only.** Your recordings [F-8]; your answer to the age question; reminder times, whether reminders show your child's name, and the app lock setting; your plan details from Apple; the count of letters you have kept (section 7); the downloaded speech model and language files.

**What we do not collect.** Your location, contacts, photos, camera, advertising ID or payment details. No usage analytics or crash reports from the app. We never create a voiceprint or any other biometric identifier. If you turn on the app lock, Face ID or your passcode is checked by iOS, and the app receives only a yes or no.

**How speech becomes text.** The app turns your voice into text on your iPhone. No audio or text is sent to any outside service to be turned into text. The app fixes only small slips, such as a stray "um" or a name spelled your way, and you can undo every fix. It never rewrites your words.

## 3. Without an account

You can use the app without signing in. Then your book stays on your iPhone, and we receive nothing about it. Section 6 still applies to the files the app downloads.

## 4. Who can see your letters

- **You.** A letter is private to you until you add it to a child's book. Your original transcripts and fixes are visible only to you.
- **Your child's other parent.** A book can have at most two parents. The other parent can read the letters in that book. They cannot see your original transcripts, your fixes or your recordings, and they cannot change or delete your letters. Leaving a book, and undoing a join, are not in the app yet.
- **Us.** Letters on our servers are not end-to-end encrypted, so we could read them. We do so only if you ask us for help, to deal with a security problem or misuse of the service, or when the law requires it. Only the founder has that access.
- **Others.** No one else, unless a valid legal process requires it. We push back on requests that are too broad and, where the law allows, we tell you first.

Letters already on the other parent's iPhone, or in an export, stay with them. We cannot reach those copies.

## 5. Recordings and backup

[FOUNDER DECISION F-8. Choose one text. Option A matches `eas.json` today and the gap map (backup off in every profile, phone half not shown as built).]

[Option A, backup off:] Recordings are kept on your iPhone, and in your own iPhone backup if you use one. They are not copied to our servers. Your iPhone backup is Apple's service, under Apple's terms. Restoring a book from it has not been tested for this version, so please also export a copy now and then (section 9).

[Option B, only if build 12 sets `EXPO_PUBLIC_BACKUP=on`: Privacy 3.0.0 section 4 as drafted (encrypted on the phone, stored with Supabase, a recovery key we hold, one-day or three-day wait before a new phone receives the key, a logged and emailed use). That needs the escrow project, its secrets and restore drill DL-03 first, and adds Audio Data and Device ID to the App Store answers. COUNSEL Q S-22 (packet Q42, Q45).]

## 6. Who helps us run Early Letters

We checked each role against the app and server code. Each acts only to provide its service to us.

| Company | What it does for us | What it receives |
|---|---|---|
| Supabase (United States region) | Our database, sign-in and sessions, and the server functions that redeem invitations, store the Sign in with Apple token, and carry out account deletion | Your account, your book and letters once you sync, and the IP address and device details of each request. Its sign-in log may hold IP addresses |
| Resend | Sends sign-in codes and links, and the emails about deleting your account; receives mail sent to our address; stores our website's email list | Your email address and the email it sends. It keeps each sent email for 30 days |
| Cloudflare (R2) | Serves the app's signed settings and language files from packs.earlyletters.app | Your IP address, the file asked for, the app's version and a random number made fresh for each request |
| Vercel | Hosts our website, including the pages a sign-in link or an invitation opens if the app does not | Your IP address and browser type. An invitation's code stays in the part of the link your browser does not send |

**Hugging Face**, a public model library, serves the speech model files straight to the app, after you choose to download them. It sees your IP address and the file asked for, under its own terms. It is not our provider and receives nothing else.

**Apple** provides Sign in with Apple, App Store purchases and iPhone backup under its own terms and privacy policy. If you turned on Share with App Developers in your iPhone's settings, Apple may share crash reports and usage statistics with us.

[FOUNDER facts to confirm: the production Supabase project is in a US region (gap map: "scribe-prod, US region", not created as of 8 Nov); the Resend account and the hello@ mail route (Resend, or Porkbun forwarding as fallback); Cloudflare log retention for packs.earlyletters.app. COUNSEL Q S-1 (packet Q12, Q11): IP addresses at our host and Hugging Face, and whether each provider needs a written contract or data processing terms. 0.9.0 removed "under a written contract".]

We will update this list before a new provider receives letters or recordings.

## 7. The letter count on your iPhone

Your first 2 letters are free (Subscription Terms). The app stores one number, how many letters you have kept, in the iPhone Keychain. It holds no letter, name or date, and it never leaves your iPhone. iOS keeps Keychain items when an app is deleted, so deleting and reinstalling the app does not reset it. This is how iOS behaves today; Apple does not promise it. The item is set to this device only, so it is not copied to iCloud Keychain. A copy of the same number in the app's own data can reach a new iPhone through your iPhone backup, and the letters you have synced count too. This version has no control to clear the count, and deleting your account does not clear it, because we cannot reach it. [COUNSEL Q S-3 (D-083).]

## 8. How long we keep things, and deleting

We keep your book and letters until you delete them or your account. We never delete them because you stopped using the app or ended Plus.

- **A letter.** Deleting a letter moves it to Recently deleted for 30 days, so you can restore it, and then it is erased from your iPhone and our servers. Erasing a letter at once is not offered while you sync.
- **Your account.** In the app: Settings, Your data, Delete account. [Path per `settings/index.tsx` on develop; recheck after the Settings regroup (#614).] Or email us from the address on your account and we will start it by hand. You have 30 days to change your mind, and we email you when you ask, if you cancel, and when it is done. After the 30 days we delete the files we store for you, tell Apple to end Sign in with Apple for Early Letters if you used it, and delete your account and its letters. [Engineering reading of `supabase/functions/purge-worker/account.ts`: storage, Apple token revocation, email provider, completion email, then the account; each step retries for up to 7 days.] We aim to erase your information from our live systems within 31 days of your request, from our backups within 38 days, and our providers erase it within 45 days. Our email provider keeps the completion email, and your address on it, for 30 days after it is sent. [FOUNDER: the 38-day backup figure depends on the Supabase plan and backup choice, which is open (gap map 1.6). COUNSEL Q S-23 (packet Q51).]
- **Shared books.** Deleting your account removes your letters from every book. A book you share stays with the other parent. A book where you are the only parent is deleted, with its letters.
- **Letters of someone who left a book.** If a parent left a book, or their joining was undone, before the other parent deleted the book or their account, that person's letters stay theirs. To label them we keep a record of the book, with the child's name, birth date and due date, and clear its nickname and other details. We delete it when nothing of theirs is left in it.
- **Plus.** Deleting your account or the app does not cancel Plus. Cancel it in Settings, Plan, Manage subscription, or in your iPhone's Settings, your name, Subscriptions.

After your account is deleted, we keep only these, and none holds your letters or recordings:

- records of what you agreed to, without your name or email, for 3 years;
- activity records about your account, without your name or email, for 24 months from when each was made;
- a record that the deletion happened, for 3 years;
- security logs, for 12 months;
- emails you sent us, for 2 years after your last message.

Other keeping periods: invitations are deleted 90 days after they are used, cancelled or expire; records that stop a synced change being applied twice are deleted after 30 days. [Engineering reading of the purge functions in `supabase/migrations`. FOUNDER: the 12-month security log period (D-021) and Supabase's own sign-in log period are not shown in the code (DATA_CLASSIFICATION 4.2, "Unverified").]

## 9. Your copies

Export your letters and the recordings on your iPhone at any time, free, in Settings, Your data, Export your book. The copy goes where you choose with the share sheet, and is not encrypted by us.

## 10. Health details

Letters can mention health, and a due date shows a pregnancy. We treat everything in a letter as private. Before your book first syncs, we ask for your agreement in a separate step. If you say no, syncing stays off and your book stays on your iPhone. You can withdraw your agreement at any time by emailing us, and we will do it by hand: the app shows in Settings, Privacy whether syncing is on, but has no switch to turn it off yet. Withdrawing stops syncing, and we offer to delete what was synced. We never use health details for advertising, and we never try to work out anything about anyone's health. [COUNSEL Q S-9 (packet Q32, Q48): Washington and Connecticut consumer health data rules, and withdrawal by email only.]

## 11. Children

Early Letters is for adults. You must be 18 or older to use it. The app asks before first use and stops if the answer is no. When you sign in, you confirm again that you are 18 or older. Children do not use the app or sign in, and we do not knowingly collect information from children.

What we hold about a child comes from a parent: the child's name or nickname, birthday or due date, and the letters written to them. We use it only to keep that child's book for that child's parents. We never use it for advertising, profiles or marketing, and we never share it with anyone else, except as section 4 says.

If we learn that someone under 18 has an account or joined our list, we will close the account or delete the address. [COUNSEL Q S-10 (packet Q45): engineering reading is that COPPA is not engaged, because the app is for adults and children do not use it, while the app stores a child's details given by a parent. COUNSEL Q S-8 (packet Q46, Q5): Texas SB 2420; founder decision F-3.]

## 12. Your rights

Wherever you live in the United States, you can ask to see, export, correct or delete your information, and you can withdraw an agreement you gave. Use the control in the app where there is one (export, delete account); otherwise email hello@earlyletters.com and we will do it by hand. We may confirm it is you by sending a code to the email on your account. We reply within 45 days, and may extend once by 45 days if we tell you why. You can use an authorized agent. If we refuse a request, reply with "Appeal" in the subject and we will look again; if we still refuse, we will tell you how to contact your state attorney general. We will never treat you differently for using these rights.

**California.** We do not sell or share personal information, and we have not done so in the past 12 months. We use sensitive information only to provide the service. Because we do not sell or share personal information or track you, a Global Privacy Control or Do Not Track signal changes nothing here. Section 2 lists what we collect, and section 6 who receives it. [COUNSEL Q S-21.]

## 13. Security

Traffic is encrypted in transit, and data on our servers is encrypted at rest. Access rules limit every database request to what that person may see. Invitation links work once and expire after 7 days. Access to our systems is limited to the founder and protected by two-factor authentication. No system is perfectly secure. If a breach affects your information, we will tell you and the authorities as the law requires. [FOUNDER facts carried from 0.9.0: encryption at rest on the production project, two-factor on every console. COUNSEL Q S-24 (packet Q23): the security test before outside families sign in (D-125 item 10, R-17 gate not run).]

## 14. Our website and its email list

The website uses no cookies and no analytics, and loads nothing from other sites. If you press its sound button, your browser remembers whether sound is on; that stays in your browser. If you join the list to hear when the app is ready, we keep your email address with Resend and send a welcome email and one email when the app is ready. If you unsubscribe, we keep the address marked as unsubscribed, only so that we never email you again. When you join or leave the list, the website holds your IP address in memory for up to 10 minutes to block automated requests, and does not save it.

## 15. Where Early Letters is offered

The app is offered on the United States App Store, and your information is stored in the United States. [FOUNDER: storefront availability (gap map 1.9) and project region. The country check at sign-up (D-131, D-136) is not built, so this text does not describe one.]

## 16. Changes to this policy

We publish every version at its own address with its date and what changed. Before a change that matters to how your information is used applies to you, we will tell you in the app, and by email if you have an account, and ask for your agreement where the law requires. [COUNSEL Q S-14: no re-consent screen exists in the app; how 1.0.0 replaces 0.9.0 for testers who accepted 0.9.0.]

If we ever close Early Letters, we will tell you at least 90 days ahead and keep export working the whole time.

## 17. Contact

[legal name], [mailing address]. hello@earlyletters.com.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-11-08 | First version for the App Store app, from 0.9.0. Removed: the test-version notice, TestFlight feedback and the test server. Added: Plus is sold by Apple and our servers do not receive purchases; Delete account in the app, with the 30 days, the Apple sign-in revocation and the deletion emails; the letter count kept on the iPhone; the providers' roles and what each receives; Hugging Face and Apple's shared crash data; children's details given by parents; keeping periods for invitations and sync records. Draft for counsel. |
