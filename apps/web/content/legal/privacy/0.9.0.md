---
title: Early Letters Privacy Policy (test version)
document: privacy
version: 0.9.0
status: draft-for-counsel
review: Test version for family testers. Written without legal review; every legal reading in it is for counsel to confirm before 1.0.0. Not legal advice.
source: docs/legal/privacy-policy.md 3.0.0, cut to what the second TestFlight build does
url: https://earlyletters.com/legal/privacy/0.9.0
---

# Early Letters Privacy Policy

Version 0.9.0, a test version.

**This is a test version of our Privacy Policy, for family members testing the Early Letters app through Apple's TestFlight. It has not had a full legal review yet. A reviewed version will replace it, and we will tell you in the app before it applies to you.**

This policy describes the second test build, the one with our servers on, and applies when that build is available to you. The first test build, with servers off, keeps everything on your phone. Where something is planned but not in the app yet, it says so.

Early Letters keeps letters to your child, in your own words and voice. Parents speak or type letters to their child. This policy explains what Early Letters collects, how we use it, who can see it, and the choices you have. It covers the test versions of the Early Letters app for iPhone that we share through TestFlight, and our website, earlyletters.com, with its email list.

## Which test builds this covers

- **The first test build.** There is no sign-in. Your letters and recordings stay on your phone, except anything you choose to send as TestFlight feedback, such as a screenshot, and the app sends nothing about them to us. The parts of this policy about our servers do not apply to it.
- **The second test build.** When it is available, you can sign in, sync your book to our test server, and share a book with your child's other parent. Recordings are not uploaded.

**Not in the app yet.** None of these is in any test build: recording backup, buying Plus, usage analytics or crash reporting by the app, a check of your country at sign-up, sign-in with any service other than Apple or email, and a switch in the app to withdraw your agreement to sync. If one of them is added, we will update this policy first.

## 1. Who we are

Early Letters is run by its founder ("we", "us"). Write to us at hello@earlyletters.com.

## 2. What we collect

**Your account (second test build).** If you sign in, we keep your email address, your name if Apple shares it, the name you sign your letters with, a random account ID, your confirmation that you are 18 or older, the version of our Terms you accepted, and the agreements you gave or declined.

**Your book.** For each child: a name or nickname, and a birthday or due date. Your letters: the words you speak or type, the original transcript, each small fix the app made, and the final text. Your list of names and words. All of this is kept on your phone. When you sign in and agree to sync, it is also kept on our test server so it can reach your other phone and your co-parent.

**Your recordings.** Recordings are kept on your phone, and in your phone's own iPhone backup if you use one. They are not copied to our servers in any test build.

**Emails and support.** The emails we send you, and anything you write to us. If you join the list on our website to hear when the app is ready, we keep your email address. If you unsubscribe, we keep the address marked as unsubscribed, only so that we never email you again.

**TestFlight.** Apple runs TestFlight. If you send feedback through TestFlight, Apple sends us your name, your email address, details about your phone (such as its model, iOS version, battery, free space, network type, language and time zone), what you write and any screenshot you attach. If the app crashes, TestFlight may send us a crash report. A screenshot shows whatever is on your screen, so please choose a screen without your letters, and leave your child's name and your letters' words out of what you write. People on our testing team (the founder and the family members who test) can see feedback sent through TestFlight and the name and email address of each tester.

**Technical details.** When the app or website connects to our providers, they see your IP address and device or browser type, as any website does. When you join or leave our email list, the website holds your IP address in memory for up to 10 minutes to block automated requests, and does not save it.

**What we do not collect.** We do not collect your location, contacts, photo library, advertising ID or payment details. The app sends us no usage analytics or crash reports of its own. We never create a voiceprint or any other biometric identifier. Your reminder times stay on your phone. Your choices for each book, such as whether it appears in reminders, are kept with your book. The website uses no cookies and no analytics, and loads nothing from other sites. If you press its sound button, your browser remembers whether sound is on; that stays in your browser.

**How speech becomes text.** The app turns your voice into text on your phone. No audio or text is sent to any outside service to be turned into text. The app fixes only small slips, such as a stray "um" or a misheard name, and you can undo every fix. It never rewrites your words.

## 3. Who can see your letters

*This section applies when you sign in and sync, in the second test build. Otherwise only you can see your letters, on your phone.*

- **You.** A letter is private to you until you add it to a child's book.
- **Your co-parent.** A child's book can have at most two parents. The other parent can read the letters in that book. They cannot see your original transcripts, your fixes or your recordings, and they cannot change or delete your letters.
- **Us.** Letters on our servers are not end-to-end encrypted, so we could read them. We do so only if you ask us for help, to deal with a security problem or misuse of the service, or when the law requires it. Only the founder has that access.
- **Others.** No one else, unless a valid legal process requires it. We push back on requests that are too broad and, where the law allows, we tell you first.

If a co-parent leaves a book, letters already on their phone or in an export stay with them. We cannot reach those copies.

## 4. Recording backup

Recording backup is not available yet. It is not in any test build, and no recording is copied to our servers. Before it is offered, we will update this policy and ask for your agreement in the app.

## 5. How we use your information

We use it to keep your book and sync it; to sign you in and keep your account secure; to send the emails the service needs, such as sign-in codes; to answer your messages and your feedback; to fix problems in the test; and to meet our legal duties. If you join our email list, we use your address to send a welcome email and one email when the app is ready. We may count how the service is used in totals, such as letters per week, but never report on one family.

We never:

- sell your information or share it for advertising;
- show ads or use tracking tools;
- use your letters, recordings or names to train machine learning models;
- imitate your voice or anyone's voice;
- put letter text in a notification or an email;
- build profiles of you or your child;
- use what you put in your book, such as your letters, recordings, names or dates, in our marketing, on our website or in the App Store, unless you ask us to and agree in writing for that one use.

Reminders on your phone show your child's name only if you turn that on. An invitation to share a book names the parent who sent it.

## 6. Who helps us run Early Letters

| Company | What it does for us |
|---|---|
| Supabase | Our test server: database, sign-in and server functions |
| GitHub (planned) | Will store the encrypted nightly backup of our test server's database, once that backup is running. Each copy will be kept for 7 days. GitHub will hold only the encrypted file; the key that opens it will stay with us |
| Cloudflare R2 | Delivers the app's settings and the language files it downloads |
| Resend | Sends our emails, may receive mail sent to our address, and stores our email list |
| Vercel | Hosts our website |

Each handles your information only to provide its service to us. The speech model files the test app downloads come straight from Hugging Face, a public model library, which sees your IP address and the file requested.

Apple provides TestFlight, Sign in with Apple and iPhone backups under its own terms and privacy policy.

We will update this list before a new provider receives letters or recordings.

## 7. How long we keep things, and deleting

*The parts about our servers apply when you sign in and sync, in the second test build. Otherwise everything is on your phone and you delete it there. The deletion times and keeping periods below for our servers are planned: they apply once the scheduled deletion on our test server is running.*

We keep your book until you delete it or your account. We never delete it because you stopped using the app.

- **A letter.** Deleting a letter moves it to Recently deleted for 30 days, so you can restore it. Then it is erased. You can also erase it at once.
- **Your account.** Email us from the address on your account and we will start the deletion by hand. If your test build shows Delete account in Settings, you can start it there instead. Once the scheduled deletion on our test server is running, you have 30 days to change your mind. We then erase your information from our live systems within 31 days of your request, apart from the record of the book described under "Letters of someone who left a book" below, from our backups within 38 days, and our providers erase it within 45 days. The exception is our email provider, which keeps each email it sends for 30 days. We send an email when your deletion finishes, so that email, and your address on it, stays with the email provider for up to 30 days after that, about 60 days after your request.
- **Shared books.** Deleting your account removes your letters from every book. A book you share stays with your co-parent. A book where you are the only parent is deleted, except for the record of the book described next.
- **Letters of someone who left a book.** If a parent left a book, or their joining was undone, before the other parent deleted the book or their own account, that person's letters and their letters waiting to be kept are not deleted with it. They stay theirs. To label those letters we keep a record of the book, with the child's name, birth date and due date, and we clear its nickname, photo and other details. Nothing in the app can read that record today. We delete it when nothing of theirs is left in it.
- **When the test ends.** The test server is separate from the App Store version. We will tell you before it is closed. Letters on your phone stay there, and export keeps working.

After your account is deleted, we plan to keep only these, and none of them holds your letters or recordings:

- records of what you agreed to, for 3 years, without your name or email;
- activity logs, for 24 months, without your name or email;
- a record that the deletion happened, for 3 years;
- security logs, for 12 months;
- emails you sent us, for 2 years after your last message.

You can export your letters and the recordings on your phone at any time, free, in Settings, Your data, Export your book. To have your email address removed from our list, email us from that address. To have your TestFlight feedback deleted, ask us at hello@earlyletters.com.

## 8. Children

Early Letters is for adults. You must be 18 or older to use it or to take part in the test. The app asks before first use and stops if the answer is no. Children do not use the app or sign in, and we do not knowingly collect information from children. What we hold about a child comes from the parents and is used only to keep that child's book. If we learn that someone under 18 has an account or joined our list, we will close the account or delete the address.

## 9. Health details

*This section applies when you sign in and sync, in the second test build.*

Letters can mention health, and a due date shows a pregnancy. We treat everything in a letter as private. Before your book first syncs, we ask for your agreement in a separate step. If you choose to keep your book on your phone, syncing and sharing stay off. You can withdraw your agreement at any time by emailing us, and we will do it by hand; the test app shows in Settings, Privacy whether syncing is on, but has no switch to turn it off yet. Withdrawing stops syncing, and we offer to delete what was synced. We never use health details for advertising, and we never try to work out anything about anyone's health.

## 10. Your rights

Wherever you live in the United States, you can ask to see, export, correct or delete your information, and you can withdraw an agreement you gave. Use the control in the app where your build has one; otherwise, email hello@earlyletters.com and we will do it by hand. We may confirm it is you by sending a code to the email on your account. We reply within 45 days, and may extend once by 45 days if we tell you why. You can use an authorized agent. If we refuse a request, reply with "Appeal" in the subject and we will look again; if we still refuse, we will tell you how to contact your state attorney general. We will never treat you differently for using these rights.

**California.** We do not sell or share personal information, and we have not done so in the past 12 months. We use sensitive information only to provide the service. Because we do not sell or share personal information or track you, a Global Privacy Control or Do Not Track signal changes nothing here. Section 2 lists what we collect, and section 6 who receives it.

## 11. Security

Traffic is encrypted in transit, and data on our servers is encrypted at rest. Access rules limit every database request to what that person may see. Invite links are single use and expire after 7 days. Access to our systems is limited to the founder and protected by two-factor authentication. No system is perfectly secure. If a breach affects your information, we will tell you and the authorities as the law requires.

## 12. Where Early Letters is offered

The test is for people in the United States. We plan to store your information in the United States.

## 13. Changes to this policy

The reviewed version of this policy will replace this test version. Before it, or any other change that matters to how your information is used, applies to you, we will tell you in the app, and by email if you have an account, and ask for your agreement where the law requires.

If we ever close Early Letters, we will tell you at least 90 days ahead and keep export working the whole time.

## 14. Contact

hello@earlyletters.com.

## Changelog

| Version | Date | Change |
|---|---|---|
| 0.9.0 | 2026-11-08 | First published version: a test version for family testers of the TestFlight builds. |
