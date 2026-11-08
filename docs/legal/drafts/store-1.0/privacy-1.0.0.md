---
title: Early Letters Privacy Policy
document: privacy
version: 1.0.0
status: draft-for-counsel
review: DRAFT for counsel and founder review (D-125). Written by an AI drafting agent, with no legal review. Not legal advice. Every [COUNSEL Q] mark is an open question for counsel and must be resolved and removed before publishing.
scope: the Early Letters app for iPhone, version 1.0 from the App Store (EAS production profile, build 12), and earlyletters.com with its email list
source: docs/legal/privacy-policy.md 3.0.0 and docs/legal/beta/privacy-0.9.0.md (PR #616), cut to what the store build does as the code shows it on develop at caba0215
proposed_url: https://earlyletters.com/legal/privacy/1.0.0
last_updated: 2026-11-08
---

> **DRAFT for counsel review. Not legal advice.** This banner, the frontmatter `review:` line and every `[COUNSEL Q]` mark come out before publishing. Facts are engineering readings of the code on `develop` (`caba0215`) and must be checked against the release build (store compliance review, gate G6).

# Early Letters Privacy Policy

Version 1.0.0. Effective [effective date].

Early Letters keeps letters to your child, in your own words and voice. You speak or type a letter, and it goes into your child's book on your iPhone.

This policy covers the Early Letters app for iPhone, version 1.0, from the App Store, and our website, earlyletters.com, with its email list. [COUNSEL Q S-12: one document for the app and the website, so that /privacy can serve it; see the PR body.]

## The short version

- In this version of the app there is no account and no sign-in. Your book, your letters and your recordings are kept on your iPhone. We do not receive them.
- The app sends us no usage analytics and no crash reports, and it has no advertising or tracking.
- Your voice is turned into text on your iPhone. No audio or text is sent anywhere to be turned into text.
- The app downloads its settings and its speech files from the internet. Those servers see your IP address and which file was asked for (section 5).
- Apple sells Plus and handles payment. We never see your card details.
- One thing stays after you delete the app: the number of letters you have kept, so that deleting and reinstalling does not reset the free letters (section 4).
- If you email us, we receive what you write and your email address (section 7).

## 1. Who we are

Early Letters is published by [legal name] ("we", "us"), the Seller named on the App Store. Write to us at hello@earlyletters.com or [mailing address]. [COUNSEL Q S-7 (packet Q47, Q1): individual or entity, and whether a legal name and postal address must appear here. Founder decision F-2.]

## 2. What this version of the app does not do

In version 1.0 of the app:

- there is no account, no sign-in and no sync, and nothing about your book is stored on our servers;
- your recordings are not copied to us, and there is no backup run by us;
- there is no sharing of a book with another parent;
- there are no usage analytics, no crash reporting of our own, no advertising, no advertising identifier and no tracking;
- the app writes down letters spoken in English only.

If a later version adds any of these, we will publish a new version of this policy before that version of the app is released.

## 3. What stays on your iPhone

These are stored by the app on your iPhone. We do not receive them.

- **Your answer to the age question.** That you said you are 18 or older, or, if you said no, the time you said it, so the app can wait a day before asking again. Never your age or birth date.
- **Each child's book.** A name or nickname, and a birthday or a due date.
- **Your letters.** The words you speak or type, the original transcript, each small fix the app made, and the final text. Letters you keep just for you, out of the book. Letters in Recently deleted.
- **Your recordings.** The recording of each spoken letter, kept as you made it, and a listening copy made from it.
- **Your names and words.** The list you add so names are spelled your way, and how you sign your letters (for example, what Asha calls you).
- **Your settings.** Reminder days and times, whether reminders may show your child's name, whether the app lock is on, and similar choices.
- **Your plan.** What Apple reports to the app about Plus: which plan, its dates, and whether a free period or renewal applies. No card or payment details.
- **The letter count.** How many letters you have kept, in the iPhone Keychain (section 4).
- **Downloaded files.** The speech model, the language files and the app's signed settings. These are public files and say nothing about you.

The app does not ask for your location, contacts, photos or camera. It asks for the microphone when you first record. It uses Face ID or your passcode only if you turn on the app lock, and then it receives only a yes or no from iOS, never your face data.

**Deleting the app** removes everything above from your iPhone, except the letter count (section 4) and any copies you made (section 6).

## 4. The letter count that stays after you delete the app

Your first 2 letters are free (Subscription Terms). To keep that fair, the app stores one number, how many letters you have ever kept, in the iPhone Keychain. The number holds no letter, name, date or identifier.

- iOS keeps Keychain items after an app is deleted, so if you delete and reinstall Early Letters, the count comes back and the free letters are not given again. This is how iOS behaves today; Apple does not promise it, and it could change. [Engineering reading; not checked against an Apple document.]
- The item is set to this device only, so iOS does not copy it to iCloud Keychain or to another iPhone. A copy of the same number is kept in the app's own data on the phone, so it can reach a new iPhone through your iPhone backup (section 6).
- This version of the app has no control to clear the count. Erasing your iPhone with Erase All Content and Settings removes it. We cannot see or reach the count, because it never leaves your phone.

[COUNSEL Q S-3 (D-083): whether a count that survives app deletion, with no in-app way to clear it, needs anything more than this disclosure, including under state deletion rights.]

## 5. What leaves your iPhone, and who receives it

The app connects to these servers, and to no others:

| Server | What the app asks for | What that server sees |
|---|---|---|
| packs.earlyletters.app (ours, run on Cloudflare R2) | The app's signed settings, the list of language files and the English words bundle. The app checks a signature on each before using it. | Your IP address, the file asked for, the app's version and a random number made fresh for each request. Nothing about you or your book. |
| huggingface.co (Hugging Face, a public model library) | The speech model files, only after you choose to download them. They are large, so the app shows the size first and waits for your yes. | Your IP address and the file asked for. The file name shows which model size your iPhone uses. |
| Apple (App Store) | Plus: buying, restoring, managing, refunds and offer codes, all on Apple's own screens. | What Apple's own terms and privacy policy describe. |

We do not keep the IP addresses we see at packs.earlyletters.app, and we do not use them to locate or identify you. [Founder fact to confirm: Cloudflare log retention for this host (review gate G6). COUNSEL Q S-1 (packet Q12): whether the IP address at our host and at Hugging Face is "collection" for this policy and for the App Store label; Hugging Face acts under its own terms, not ours.]

Links in the app open pages in your browser or in Apple's apps, under their own policies: our Terms and this policy on earlyletters.com, Apple's help pages, and Apple's subscription and refund pages.

## 6. Your own copies: iPhone backup and export

- **iPhone backup.** If you use iCloud Backup or back up to a computer, Apple's backup normally includes the app's data on your phone, including your recordings and your letters. That backup is Apple's service, under Apple's terms. We do not receive it. Do not rely on it alone: restoring a book from a backup has not been tested for this version. [COUNSEL Q S-18: wording, given the in-app rule (CCO-8) not to say a backup brings the book back.]
- **Export.** Settings, Your data, Export your book makes a copy of your letters, your recordings and a PDF of the book, free, and hands it to the iOS share sheet. You choose where it goes. The copy is not encrypted by us, and once you send it somewhere, it is under that place's rules.

## 7. Emails you send us

Help in Settings opens your own Mail app with our address, hello@earlyletters.com, and the subject "Help with the app". The app adds nothing else to the email: no letter, no name, no device or usage details. You choose what to write and attach, and nothing is sent until you send it.

When you email us, we receive your email address, your name if your mail app includes it, what you write and anything you attach. Mail to our address is received through our email provider, Resend, and read by the founder. [Founder fact to confirm: the mail route (Resend, or Porkbun forwarding as a fallback, `docs/emails/SECURITY.md` Q1).] We use it only to answer you and fix the problem you tell us about. We keep it for 2 years after your last message, and delete it sooner if you ask. [Founder fact to confirm: no retention mechanism is built; this is done by hand.] Please leave your child's name and your letters out of an email unless you need to include them.

[COUNSEL Q S-2 (packet Q12, D-088): whether support email you choose to send is "collected" for the App Store label. Note: D-088 describes a content-free block (version, build, screen) added to the email; the code adds only the subject.]

## 8. What Apple may share with us

- **Purchases.** Apple tells the app on your phone whether you have Plus. Apple gives us sales and subscription reports in App Store Connect. As we understand them, they are totals and do not name you. [Not checked against Apple's documentation today.]
- **Crash reports and usage statistics.** If you have turned on Share with App Developers in your iPhone's settings (Privacy and Security, Analytics and Improvements), Apple may share crash reports and app usage statistics with us. That is Apple's choice to offer and yours to turn on or off. [COUNSEL Q S-13: whether this needs disclosure here, and whether it changes the App Store privacy answer for this build.]

## 9. How speech becomes text

The app turns your voice into text on your iPhone, using a speech model it has downloaded. No audio or text is sent to any outside service to be turned into text. The app fixes only small slips, such as a stray "um" or a name spelled your way, marks each fix, and lets you undo it. It never rewrites your words. Until the speech model is downloaded, your recordings are kept, and the words follow.

## 10. What we never do

- sell your information or share it for advertising;
- show ads or use tracking tools;
- use your letters, recordings or names to train machine learning models;
- imitate your voice or anyone's voice;
- put the text of a letter in a notification;
- build profiles of you or your child;
- use anything you put in your book in our marketing, unless you ask us to and agree in writing for that one use.

Reminders on your phone show your child's name only if you turn that on.

## 11. Children

Early Letters is for adults. You must be 18 or older to use it. The app asks before first use and stops if the answer is no. Children do not use the app. What the app holds about a child is entered by a parent and stays on the parent's iPhone. We do not knowingly collect information from children. If a child emails us or joins our list, we will delete what we received. [COUNSEL Q S-10 (packet Q45): engineering reading is that COPPA is not engaged by an on-device app for adults with no account; counsel to confirm. COUNSEL Q S-8 (packet Q46, Q5): Texas SB 2420; founder decision F-3.]

## 12. Health details

A letter can mention health, and a due date shows a pregnancy. In this version, all of it stays on your iPhone and we do not receive it. We never use health details for advertising, and we never try to work out anything about anyone's health. If you email us about health, we treat that email as private and use it only to answer you. [COUNSEL Q S-9 (packet Q32): whether a separate consumer health data notice is needed when such data never leaves the phone.]

## 13. Your choices and rights

- **Delete a letter.** It goes to Recently deleted for 30 days, so you can restore it, and is then erased. You can also erase it at once.
- **Delete everything.** Delete the app. This removes your book from the phone, apart from the letter count (section 4) and copies you made (section 6). Export a copy first if you want one.
- **Export.** Free, at any time, in Settings, Your data.
- **Reminders and app lock.** Off until you turn them on, in Settings.
- **What we hold.** We hold no copy of your book, so we cannot show, correct or delete it for you. For anything we do hold, such as emails you sent us or your address on our email list, write to hello@earlyletters.com to see, correct or delete it. We reply within 45 days, and may extend once by 45 days if we tell you why. If we refuse, reply with "Appeal" in the subject and we will look again; if we still refuse, we will tell you how to contact your state attorney general. We will never treat you differently for asking.
- **California.** We do not sell or share personal information, and have not done so in the past 12 months. Because we do not sell, share or track, a Global Privacy Control or Do Not Track signal changes nothing here.

[COUNSEL Q S-21: which state privacy laws apply to a small individual publisher that receives almost no personal data, and whether this section should be framed as a voluntary commitment.]

## 14. Security

Your book is protected by your iPhone: its passcode and iOS data protection. You can add the app lock in Settings, Privacy. Every file the app downloads is checked against a published signature or a fixed fingerprint before it is used. Connections are encrypted. No system is perfectly secure. Because your book is not on our servers, a breach of our systems would not expose it.

## 15. Our website and its email list

- The website uses no cookies and no analytics, and loads nothing from other sites. If you press its sound button, your browser remembers whether sound is on; that stays in your browser.
- If you join the list to hear when the app is ready, we keep your email address, with our email provider Resend, and send a welcome email and one email when the app is ready. If you unsubscribe, we keep the address marked as unsubscribed, only so that we never email you again.
- When you join or leave the list, the website holds your IP address in memory for up to 10 minutes to block automated requests, and does not save it.
- The website is hosted by Vercel, which sees your IP address and browser type, as any web host does.

[These lines are carried from Privacy 0.9.0, where #652's website tests check them against `apps/web`. Re-checked here only for the 10-minute limit (`apps/web/src/lib/notify/handler.ts`).]

## 16. Who helps us

| Company | What it does for us |
|---|---|
| Cloudflare (R2) | Serves the app's settings and language files from packs.earlyletters.app |
| Resend | Sends our emails, receives mail sent to our address, and stores our email list |
| Vercel | Hosts our website |

Hugging Face serves the speech model files directly to the app, under its own terms. Apple provides the App Store, purchases and iPhone backup under its own terms. None of them receives your letters or recordings from us.

## 17. Where Early Letters is offered

The app is offered on the United States App Store only.

## 18. Changes to this policy

We publish every version of this policy at its own address with the date and what changed, and keep earlier versions online. If a later version of the app is going to send anything new from your phone, we will publish an updated policy before that version is released, and ask for your agreement in the app where the law requires. [COUNSEL Q S-14: how 1.0.0 is published under POLICY_VERSIONING 2.4, since build 12 records no consent.]

## 19. Contact

[legal name], [mailing address]. hello@earlyletters.com.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-11-08 | First version for the App Store app (version 1.0): no account, nothing of the book on our servers, the hosts the app contacts, the letter count that survives deleting the app, support email, what Apple may share. Covers the website and its email list. Draft for counsel. |
