---
title: Early Letters Privacy Policy
document: privacy
version: 1.0.0
status: PROPOSED, draft for exec-team review (D-168, D-172). Not reviewed yet. The exec team is not a lawyer.
review: PROPOSED draft written by an AI drafting agent (`legal`). It is not legal advice and says nothing is compliant. "Counsel" in this file means the exec team's own review (D-172), which is not a licensed lawyer. Every [EXEC-TEAM COUNSEL Q] and [FOUNDER] mark is open and must be resolved and removed before publishing.
scope: the Early Letters app for iPhone, version 1.0 from the App Store (EAS production profile: servers and accounts on; analytics, backup, photos and Google sign-in off), and earlyletters.com with its email list
source: docs/legal/drafts/store-1.0/privacy-1.0.0.md at PR #672 head 28ae44e9a3f4e5ef5ac871e8a0e1301856a5f580 (itself from docs/legal/beta/privacy-0.9.0.md and docs/legal/privacy-policy.md 3.0.0), rebased on the build as it ships; checked against develop at 079cb892d. Claim-by-claim backing: docs/ops/proposed/policy-1-0-0-rows.md
supersedes: PR #672's privacy draft (the coordinator closes #672 once this PR has two counted reviews); privacy 0.9.0 once published (proposed)
proposed_url: https://earlyletters.com/legal/privacy/1.0.0
last_updated: 2026-11-23
---

> **PROPOSED. Draft for exec-team review. Not legal advice. Not a lawyer's text.** This banner, the frontmatter `review:` line and every bracketed mark come out before publishing.
>
> **True only for a build made with the `production` profile in `apps/mobile/eas.json` as it reads on develop at 079cb892d:** `EXPO_PUBLIC_SERVER_FEATURES=on`, `EXPO_PUBLIC_BACKUP=off`, `EXPO_PUBLIC_STATUS_REPORT=off`, `EXPO_PUBLIC_ANALYTICS=off`, `EXPO_PUBLIC_ACCOUNT_DELETION=on`, `EXPO_PUBLIC_ENGLISH_ONLY=on`, and none of `EXPO_PUBLIC_PHOTOS`, `EXPO_PUBLIC_MOMENTS_TAB`, `EXPO_PUBLIC_PASSKEYS` or `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` set. The deletion and keeping periods in section 8 are true only once the purge worker and its schedule run on the production project (not verified here; FOUNDER_QUEUE row 5 and `supabase/APPLY.md` steps 6, 7 and 15). If analytics (D-163, BL-1886), backup, the photo library or Google sign-in is switched on, this text is wrong and a new version is needed first.

# Early Letters Privacy Policy

Version 1.0.0. Effective [effective date].

Early Letters keeps letters to your child, in your own words and voice. Parents speak or type letters to their child. This policy explains what Early Letters collects, how we use it, who can see it, how long we keep it, and the choices you have. It covers the Early Letters app for iPhone from the App Store, and our website, earlyletters.com, with its email list.

## The short version

- You can write and keep letters on your iPhone without an account. If you sign in and agree to sync, your letters and your child's details are also kept on our servers, so they reach your other iPhone.
- Your recordings stay on your iPhone and in your own iPhone backup. We do not back them up for you.
- This version does not read your photos.
- Your voice is turned into text on your iPhone. No audio or text is sent to anyone to be turned into text.
- Letters on our servers are not end-to-end encrypted, so we could read them. We do so only in the cases in section 4.
- We do not sell your information, show ads, track you or use your letters to train machine learning models.
- The app sends no usage analytics and no crash reports of its own. [EXEC-TEAM COUNSEL Q: D-163 will turn analytics on in production once its gate clears (BL-1886); that needs a new major version of this policy and the `analytics` consent first.]
- Apple sells Plus. Our servers do not receive your purchases.
- You can delete your account in the app. Section 8 says what is deleted and when.

## 1. Who we are

Early Letters is published by [legal name] ("we", "us"), the Seller named on the App Store. Write to us at hello@earlyletters.com or [mailing address]. [EXEC-TEAM COUNSEL Q S-7 (packet Q47, Q1): individual or entity (D-134 reads individual), and whether a legal name and postal address must appear. Founder decision F-2. 0.9.0 said only "its founder".]

## 2. What we collect, and why

| What | When | Why |
|---|---|---|
| **Your account:** your email address; your name, if Apple shares it; the name you sign your letters with; a random account ID; the versions of our Terms and of the health details agreement (section 10) you accepted or declined, and when | When you sign in | To sign you in, keep your book in sync, and keep a record of what you agreed to |
| **Sign-in details:** if you use Sign in with Apple, Apple's ID for you and a token Apple gives us, which we store encrypted; if you use an email link or code, the code is sent to your email | When you sign in | To sign you in, and to tell Apple to end the connection when you delete your account (section 8) |
| **Your book:** for each child, a name or nickname, and a birthday or a due date; your list of names and words | When you sign in and agree to sync | So the book reaches your other iPhone |
| **Your letters:** the words you speak or type, the original transcript, each small fix the app made, your own changes, the final text, earlier versions of a changed letter, and letters waiting for you to keep them | When you sign in and agree to sync | The same |
| **Book membership:** who belongs to each book (today, you) and when you joined | When you sign in and agree to sync | So the book is yours across your iPhones |
| **Emails you send us** | When you write to us | To answer you |
| **Technical details:** your IP address and device type, seen by our providers when the app connects | Every connection | To deliver the service and keep it secure (section 6) |

**What stays on your iPhone only.** Your recordings; your answer to the age question and the time you ticked the agreement box; reminder times, whether reminders show your child's name, and the app lock setting; your plan details from Apple; the count of letters you have kept (section 7); the downloaded speech model and language files.

**What we do not collect.** Your location, contacts, photos, camera, advertising ID or payment details. This version has no photo feature and does not read your photo library. No usage analytics or crash reports from the app. We never create a voiceprint or any other biometric identifier. If you turn on the app lock, Face ID or your passcode is checked by iOS, and the app receives only a yes or no.

**How speech becomes text.** The app turns your voice into text on your iPhone. No audio or text is sent to any outside service to be turned into text. The app fixes only small slips, such as a stray "um" or a name spelled your way, and you can undo every fix. It never rewrites your words.

## 3. Without an account

The app starts at a Welcome that asks you to sign in, and offers a local start with no account (`packages/content/src/strings.en.ts` `localStart`; D-160). On the local start your book stays on your iPhone, and we receive nothing about it. Section 6 still applies to the files the app downloads.

## 4. Who can see your letters

- **You.** A letter is private to you. Your original transcripts and fixes are visible only to you.
- **Sharing with another parent.** This version of the app has no way to invite or join another parent (D-162). If it comes, we will publish a new version of this policy first, with what the other parent can and cannot see. [EXEC-TEAM COUNSEL Q: the 8 Nov draft described a two-parent book. The invite and join code exists on the server (`supabase/functions/invite-redeem`), but no button reaches it in a store build (`apps/mobile/src/lib/family/entry.logic.ts`, `visibleCoParentDoors`). If a link someone sends you is opened, the app goes Home and keeps no token. Confirm this policy should say nothing more until BL-882 to BL-889 ship.]
- **Us.** Letters on our servers are not end-to-end encrypted, so we could read them. We do so only if you ask us for help, to deal with a security problem or misuse of the service, or when the law requires it. Only the founder has that access.
- **Others.** No one else, unless a valid legal process requires it. We push back on requests that are too broad and, where the law allows, we tell you first.

Copies in an export you make stay with whoever you gave them to. We cannot reach those copies.

## 5. Recordings and backup

Recordings are kept on your iPhone, and in your own iPhone backup if you use one. They are not copied to our servers. Your iPhone backup is Apple's service, under Apple's terms. Restoring a book from it has not been tested for this version, so please also export a copy now and then (section 9). [Backing: `EXPO_PUBLIC_BACKUP=off` in the `production` profile. If backup ships, this section and the `backup` consent are a new major version (POLICY_VERSIONING 2.1 items 1 and 5). EXEC-TEAM COUNSEL Q S-22 (packet Q42, Q45) is closed by this choice for 1.0.0 only.]

## 6. Who helps us run Early Letters

We checked each role against the app and server code. Each acts only to provide its service to us.

| Company | What it does for us | What it receives |
|---|---|---|
| Supabase (United States region) | Our database, sign-in and sessions, and the server functions that store the Sign in with Apple token and carry out account deletion | Your account, your book and letters once you sync, and the IP address and device details of each request. Its sign-in log may hold IP addresses |
| Resend | Sends sign-in codes and links, and the emails about deleting your account; receives mail sent to our address; stores our website's email list | Your email address and the email it sends. It keeps each sent email for 30 days |
| Cloudflare (R2) | Serves the app's signed settings and language files from packs.earlyletters.app | Your IP address, the file asked for, the app's version and a random number made fresh for each request |
| Vercel | Hosts our website, including the page a sign-in link opens if the app does not | Your IP address and browser type |

**Hugging Face**, a public model library, serves the speech model files straight to the app, after you choose to download them. It sees your IP address and the file asked for, under its own terms. It is not our provider and receives nothing else.

**Apple** provides Sign in with Apple, App Store purchases and iPhone backup under its own terms and privacy policy. If you turned on Share with App Developers in your iPhone's settings, Apple may share crash reports and usage statistics with us.

[FOUNDER facts to confirm: the production Supabase project is in a US region (not verified here; the 8 Nov gap map named "scribe-prod, US region"); the Resend account and the hello@ mail route (Resend, or Porkbun forwarding as fallback); Cloudflare log retention for packs.earlyletters.app. EXEC-TEAM COUNSEL Q S-1 (packet Q12, Q11): IP addresses at our host and Hugging Face, and whether each provider needs a written contract or data processing terms. 0.9.0 removed "under a written contract".]

We will update this list before a new provider receives letters or recordings.

## 7. The letter count on your iPhone

Your first 2 letters are free (Subscription Terms). The app stores one number, how many letters you have kept, in the iPhone Keychain. It holds no letter, name or date, and it never leaves your iPhone. iOS keeps Keychain items when an app is deleted, so deleting and reinstalling the app does not reset it. This is how iOS behaves today; Apple does not promise it. The item is set to this device only, so it is not copied to iCloud Keychain. A copy of the same number in the app's own data can reach a new iPhone through your iPhone backup, and the letters you have synced count too. This version has no control to clear the count, and deleting your account does not clear it, because we cannot reach it. [EXEC-TEAM COUNSEL Q S-3 (D-083).]

## 8. How long we keep things, and deleting

We keep your book and letters until you delete them or your account. We never delete them because you stopped using the app or ended Plus.

- **A letter.** Deleting a letter moves it to Recently deleted for 30 days, so you can restore it, and then it is erased from your iPhone and our servers. Erasing a letter at once is not offered while you sync.
- **Your account.** In the app: Settings, Your data, Delete account. [Backing: `packages/content/src/strings.en.ts` (`data: "Your data"`, `deleteAccountLabel: "Delete account"`), and `EXPO_PUBLIC_ACCOUNT_DELETION=on` in the `production` profile. Recheck the path on a device.] Or email us from the address on your account and we will start it by hand. You have 30 days to change your mind, and we email you when you ask, if you cancel, and when it is done. After the 30 days we delete the files we store for you, tell Apple to end Sign in with Apple for Early Letters if you used it, and delete your account and its letters. [Engineering reading of `supabase/functions/purge-worker/account.ts`: storage, Apple token revocation, email provider, completion email, then the account; each step retries for up to 7 days.] We aim to erase your information from our live systems within 31 days of your request, from our backups within 38 days, and our providers erase it within 45 days. Our email provider keeps the completion email, and your address on it, for 30 days after it is sent. [FOUNDER: the 38-day backup figure depends on the Supabase plan and backup choice, which is open (gap map 1.6). EXEC-TEAM COUNSEL Q S-23 (packet Q51).]
- **Your books.** Deleting your account deletes your books and their letters. This version has no sharing with another parent, so no one else's letters are in your books. [EXEC-TEAM COUNSEL Q: the 8 Nov text on shared books and on letters of someone who left a book returns with the co-parent work (D-162, BL-882 to BL-889). The purge code for it exists in `supabase/migrations`; it is not reachable from a store build.]
- **Plus.** Deleting your account or the app does not cancel Plus. Cancel it in Settings, Plan, Manage subscription, or in your iPhone's Settings, your name, Subscriptions.

After your account is deleted, we keep only these, and none holds your letters or recordings:

- records of what you agreed to, without your name or email, for 3 years;
- activity records about your account, without your name or email, for 24 months from when each was made;
- a record that the deletion happened, for 3 years;
- security logs, for 12 months;
- emails you sent us, for 2 years after your last message.

Another keeping period: records that stop a synced change being applied twice are deleted after 30 days. [Engineering reading of the purge functions in `supabase/migrations`. FOUNDER: the 12-month security log period (D-021) and Supabase's own sign-in log period are not shown in the code (DATA_CLASSIFICATION 4.2, "Unverified").]

## 9. Your copies

Export your letters and the recordings on your iPhone at any time, free, in Settings, Your data, Export your book. The copy goes where you choose with the share sheet, and is not encrypted by us.

## 10. Health details

Letters can mention health, and a due date shows a pregnancy. We treat everything in a letter as private. Before your book first syncs, we ask for your agreement in a separate step. If you say no, syncing stays off and your book stays on your iPhone. You can withdraw your agreement at any time by emailing us, and we will do it by hand: the app shows in Settings, Privacy whether syncing is on, but has no switch to turn it off yet. Withdrawing stops syncing, and we offer to delete what was synced. We never use health details for advertising, and we never try to work out anything about anyone's health. [EXEC-TEAM COUNSEL Q S-9 (packet Q32, Q48): Washington and Connecticut consumer health data rules, and withdrawal by email only.]

## 11. Children

Early Letters is for adults. You must be 18 or older to use it. The app asks before first use and stops if the answer is no. When you sign in, you confirm again that you are 18 or older. Children do not use the app or sign in, and we do not knowingly collect information from children.

What we hold about a child comes from a parent: the child's name or nickname, birthday or due date, and the letters written to them. We use it only to keep that child's book for you. We never use it for advertising, profiles or marketing, and we never share it with anyone else, except as section 4 says.

If we learn that someone under 18 has an account or joined our list, we will close the account or delete the address. [EXEC-TEAM COUNSEL Q S-10 (packet Q45): engineering reading is that COPPA is not engaged, because the app is for adults and children do not use it, while the app stores a child's details given by a parent. EXEC-TEAM COUNSEL Q S-8 (packet Q46, Q5): Texas SB 2420; founder decision F-3.]

## 12. Your rights

Wherever you live in the United States, you can ask to see, export, correct or delete your information, and you can withdraw an agreement you gave. Use the control in the app where there is one (export, delete account); otherwise email hello@earlyletters.com and we will do it by hand. We may confirm it is you by sending a code to the email on your account. We reply within 45 days, and may extend once by 45 days if we tell you why. You can use an authorized agent. If we refuse a request, reply with "Appeal" in the subject and we will look again; if we still refuse, we will tell you how to contact your state attorney general. We will never treat you differently for using these rights.

**California.** We do not sell or share personal information, and we have not done so in the past 12 months. We use sensitive information only to provide the service. Because we do not sell or share personal information or track you, a Global Privacy Control or Do Not Track signal changes nothing here. Section 2 lists what we collect, and section 6 who receives it. [EXEC-TEAM COUNSEL Q S-21.]

## 13. Security

Traffic is encrypted in transit, and data on our servers is encrypted at rest. Access rules limit every database request to what that person may see. Access to our systems is limited to the founder and protected by two-factor authentication. No system is perfectly secure. If a breach affects your information, we will tell you and the authorities as the law requires. [FOUNDER facts carried from 0.9.0: encryption at rest on the production project, two-factor on every console. EXEC-TEAM COUNSEL Q S-24 (packet Q23): the security test before outside families sign in (D-125 item 10, R-17 gate not run).]

## 14. Our website and its email list

The website uses no cookies and no analytics, and loads nothing from other sites. If you press its sound button, your browser remembers whether sound is on; that stays in your browser. If you join the list to hear when the app is ready, we keep your email address with Resend and send a welcome email and one email when the app is ready. If you unsubscribe, we keep the address marked as unsubscribed, only so that we never email you again. When you join or leave the list, the website holds your IP address in memory for up to 10 minutes to block automated requests, and does not save it.

## 15. Where Early Letters is offered

The app is offered on the United States App Store, and your information is stored in the United States. [FOUNDER: storefront availability (gap map 1.9) and project region. The country check at sign-up (D-131, D-136) is not built (no country check in `apps/mobile/src/lib/auth` or `supabase/functions` on develop at 079cb892d), so this text does not describe one. When it ships, D-136 says to add the IP-based country line.]

## 16. Changes to this policy

We publish every version at its own address with its date and what changed. Before a change that matters to how your information is used applies to you, we will tell you in the app, and by email if you have an account, and ask for your agreement where the law requires. [EXEC-TEAM COUNSEL Q S-14: no re-consent screen exists in the app; how 1.0.0 replaces 0.9.0 for testers who accepted 0.9.0.]

If we ever close Early Letters, we will tell you at least 90 days ahead and keep export working the whole time.

## 17. Contact

[legal name], [mailing address]. hello@earlyletters.com.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-11-23 | First version for the App Store app, from 0.9.0, as PR #672 drafted it on 8 Nov and rebased on the production profile. Removed: the test-version notice, TestFlight feedback and the test server. Added: Plus is sold by Apple and our servers do not receive purchases; Delete account in the app, with the 30 days, the Apple sign-in revocation and the deletion emails; the letter count kept on the iPhone; the providers' roles and what each receives; Hugging Face and Apple's shared crash data; children's details given by parents; keeping periods for sync records. Sharing with another parent, backup, analytics, photos and Google sign-in are not in this version. Proposed, for exec-team review. |
