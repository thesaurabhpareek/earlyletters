---
title: Early Letters Privacy Policy
version: 2.0.0
status: draft-for-counsel
effective_date: TBD
last_updated: 2026-10-04
owner: founder
reviewers: outside privacy counsel (TBD)
published_at_url: https://earlyletters.com/privacy
---

# Early Letters Privacy Policy

Version 2.0.0. Effective date: TBD.

Early Letters is a memory book you fill by talking. You speak or type letters to your child. This policy covers the Early Letters app for iPhone and our website, earlyletters.com. It is written for the first version of the app, which keeps everything on your phone.

## The short version

- **Your letters, recordings and your child's details stay on your phone.** We do not receive them.
- **There is no account.** You do not sign in.
- **Speech becomes text on your phone.** No audio is sent anywhere for that.
- **We never sell your information, never use it for ads and never use it to train machine learning models.** We never imitate your voice.
- **Plus is between you and Apple.** Apple takes the payment. We never see your card or your purchase records.
- **The website keeps one thing:** your email address, only if you ask us to tell you when the app is ready.

## 1. Who we are

Early Letters is made by [TODO(founder): legal name], an individual based in California ("we", "us"). Our address is [TODO(founder): mailing address]. Write to us at hello@earlyletters.com.

## 2. What stays on your phone

The app keeps these on your phone and nowhere else:

- your letters: the words you spoke or typed, the original transcript, each small fix the app made, and the final text
- your recordings
- your child's name or nickname, and birthday or due date
- your settings, reminder times and the spellings you teach the app for names and words
- whether Plus is on, as Apple reports it to the app

If you use iPhone backup (iCloud or a computer), your backup may include what the app keeps on the phone. That backup is in your own Apple Account and under your control, not ours.

The app asks for your microphone to record letters, and for notifications if you want reminders. Reminders are set on your phone and never include what you wrote.

## 3. What we receive

**From the app: nothing about your letters.** Three things can still reach someone outside your phone:

- **Speech model files.** To turn your voice into text, the app downloads speech model files from a public file host. The host sees your IP address and which file was asked for, like any website you visit. We do not receive your recordings or words.
- **Usage reports, only if you turn them on.** In Settings, Privacy, you can share simple counts, such as which screens are opened, the app version and device type, with a random ID. They never include letters, recordings, names or birthdays. They are off until you say yes, and you can turn them off at any time. PostHog processes them for us.
- **Purchases.** Apple runs Plus: payment, trials, renewals, cancellation, refunds and Family Sharing. We do not receive your purchase records or payment details.

**From the website.** If you type your email into "tell me when it is ready", we keep that address with our email provider, Resend. We send you a welcome email and one email when the app is ready. Every email has an unsubscribe link. Our website host, Vercel, sees the usual details of a visit, such as your IP address, the page and your browser. We use no ads and no tracking on the site.

**Support.** If you write to us, we keep your message only as long as we need it to help you.

<!-- TODO(founder): confirm which file host the production build downloads speech models from (Hugging Face today; models.earlyletters.com planned) and that EXPO_PUBLIC_DOCS_BASE_URL is set, otherwise the app cannot fetch models. -->
<!-- TODO(founder): confirm EXPO_PUBLIC_POSTHOG_KEY is set in the production EAS environment. If it will not be set for v1.0, delete the usage-reports bullet and the PostHog row in subprocessors.md, and hide the toggle and consent sheet. -->
<!-- TODO(founder): confirm NEXT_PUBLIC_ANALYTICS is unset on Vercel (website analytics are off by default). -->

## 4. How speech becomes text

The app downloads an open-source speech model once and turns your voice into text on your phone. It repairs only microphone and grammar slips, such as a misheard name, a stray "um" or a missing full stop. It never adds meaning. The original transcript is kept unchanged and you can undo any fix. When you type, your keyboard's own autocorrect works as usual and we never rewrite what you typed. Your recording is never altered.

Speech recognition works out which words were said. It does not identify who is speaking and keeps no measurement of your voice.

## 5. What we never do

- We never sell your information, and we never share it for advertising.
- We have no ads and no tracking, so the app never shows Apple's tracking prompt.
- We never use your letters, recordings or names to train machine learning models, and we never imitate a voice.
- We never put your words in notifications.
- We never rewrite your words.
- We never make a voiceprint or any other biometric identifier.

## 6. Who can see your letters

Only people who can open your phone, or your own backup, can see them. We cannot. If you export your book or share a recording, the people you send it to can see it.

Writing together with a co-parent is coming in a later update. Before it arrives we will update this policy and ask you first about anything new we would receive.

## 7. Keeping and deleting

- **Export** your letters and recordings at any time, free, in Settings. The files are plain text and audio.
- **Delete a letter** in the app. It stays in Recently deleted on your phone for 30 days so you can undo it.
- **Delete everything** by deleting the app. That removes what the app keeps on your phone. A copy may remain in an old iPhone backup until your phone replaces it.
- **Email list:** use the unsubscribe link in any email, or write to us and we will delete your address.

## 8. Children

Early Letters is for adults, 18 or older. The app asks your age before you can use it, and stops if the answer is under 18. A book is about a child, but the child does not use the app and we collect nothing from children. The details you enter about your child stay on your phone.

## 9. Your rights

You hold your letters yourself, so most choices are in the app. For anything we hold, such as your website email or a support message, write to hello@earlyletters.com and we will give you a copy, correct it or delete it, free. We aim to reply within 10 business days and always within the time the law sets. We will not treat you differently for asking.

We do not sell or share personal information, as California and other US state privacy laws define those words, and we give these rights to everyone in the United States whether or not a state law requires it. If we say no to a request, you can reply with "Appeal" in the subject and we will look again.

## 10. Where we are

The app is offered only on the United States App Store, and the website is run from the United States. We do not offer the app in the European Economic Area, the United Kingdom or elsewhere.

## 11. Later versions

Sign-in, backup between phones and writing with a co-parent are planned for later. When any of them arrives we will update this policy, tell you before it applies, and ask for your agreement before anything you wrote leaves your phone. We will never apply a less protective policy to what you already made without asking.

## 12. Changes and contact

Each version has a number and an effective date. For a change that matters to how your information is used, we will tell you in the app and by email, where we have your address, at least 30 days ahead. If we ever close Early Letters, we will tell you at least 90 days ahead and keep export working.

[TODO(founder): legal name], [TODO(founder): mailing address]. hello@earlyletters.com.

## Changelog

| Version | Date | Change |
|---|---|---|
| 2.0.0 | 2026-10-04 | Rewritten for the first version of the app, which keeps everything on your phone. |
