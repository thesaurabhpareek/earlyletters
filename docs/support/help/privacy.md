# Your privacy

Your letters are yours. Here is what happens to them, plainly.

## The short version

- We never sell your data. We never use it for ads. We never use your letters, recordings or photos to train machine learning models.
- Your letters are private to you until you add them to {child}'s book.
- Your recordings stay on your phone.
- Your words are turned into text on your phone.
- Usage and crash reports are off until you say yes, and they never include your letters, recordings, photos or anyone's names.
- You can export your book and delete your own letters, any time, free.

## Who can read your letters

**You.** Every letter you write, private or in the book.

**Your co-parent.** The letters that are in {child}'s book. A letter you keep private stays with you, and you can add it to the book later.

**Only you** can see the words exactly as they first came out, and the small fixes made to them. Your co-parent sees the letter as you kept it.

Each child's book has its own list of people. Inviting someone to one book does not open the others.

## Where your letters live

On your phone first. When you sign in, we ask before anything you write is first stored on our servers, because letters can hold private things, like health details about you or {child}.

- **Agree and sync,** and your book is kept safe on our servers in the United States. Your co-parent can read it, and a new phone can bring it back.
- **Keep on this phone,** and nothing you write is sent to us. Syncing and sharing with your co-parent stay off until you change your mind.

You can change this any time in Settings, Privacy.

Letters on our servers are protected by access rules and encrypted at rest. They are not end-to-end encrypted, which is what lets your co-parent and your next phone read them. So a very small number of people who run Early Letters could, in principle, read them. We look only if you ask us to when you need help, to deal with a security problem or serious misuse, or when the law requires it.

## Your recordings

Each recording stays on the phone it was made on, with its letter. It is not sent to us.

Your iPhone's own backup, such as iCloud Backup, may include what the app keeps on your phone. That backup is in your Apple account, not ours. To keep a copy of your recordings anywhere you like, export your book.

We never make a voiceprint. Recordings are kept so your family can hear them, and that is all.

## Usage and crash reports

They help us find what is broken. They stay off until you say yes, and nothing in the app depends on them. When they are on, they hold counts and screen names, like "a letter was saved", and never what you wrote or said. Turn them on or off in Settings, Privacy.

## Notifications

Notifications never show what anyone wrote. They leave out {child}'s name on your lock screen unless you turn names on in Settings, Privacy.

## No ads, no tracking

There are no ads and no ad networks in Early Letters. We do not follow you across other apps or websites, so the app never asks to track you.

## Who uses Early Letters

Early Letters is for adults. A book is about a child, and the child does not use the app.

## Your choices

| You want to | Where |
|---|---|
| Export your book | Settings, Your data, Export everything |
| Delete a letter, a book or your account | Settings, Your data. See [Deleting and exporting](deleting-and-exporting.md). |
| Stop syncing | Settings, Privacy, Sync and family sharing |
| Turn usage and crash reports on or off | Settings, Privacy |
| Show or hide names in notifications | Settings, Privacy |
| Ask a privacy question, or ask for a copy, a correction or deletion | Email {PRIVACY_EMAIL} |

We reply to privacy requests within 45 days, and usually much sooner.

## The full policy

Our Privacy Policy is at https://earlyletters.com/privacy, and our Consumer Health Data Privacy Policy is at https://earlyletters.com/health-privacy. The companies that help us run Early Letters are listed at https://earlyletters.com/subprocessors.

## Writing to us

You never need to send your letters, recordings or {child}'s name to get help. If you would like us to look at something in your book, we will ask you first.

---

## Reviewer notes (remove before publishing)

**Built today (develop at 3688796):** the app keeps everything on the phone and has no account, sync or analytics. `settings.privacyLine` ("Private by default. You decide what goes in the book.") ships. Settings, Privacy is not built yet.

**To build:** BL-114 and the sensitive-data consent screen (`sensitiveConsent.*`), analytics consent (`analyticsConsent.*`, PRD-REQ-016 to 018), lock-screen names toggle (C-REQ-009, D-025: off by default, raised to v1.0), BL-159 Settings information architecture, BL-150 export.

**Matches the Privacy Policy draft 1.3.0** (sections 3, 6, 7, 9, 12, 13, 14) except where the brief of 3 Oct narrows v1.0:
- *Recordings.* The policy's short version and section 7 describe encrypted backup, Standard and Vault modes and family playback. Brief decision 9 says no audio upload in v1.0, so this article says recordings stay on the phone. If D-032 (shared voice) is approved, or backup ships in v1.0, update the "Your recordings" section. The iPhone backup line comes from policy section 9; whether recordings are in the device backup depends on D-033 (recommended, not decided).
- *Cloud transcription.* Policy section 4 applies from v1.1 (policy section 2 says so).
- *Family members.* Co-parent only at v1.0 (brief decision 5), so "Family can read the book" and family approvals are left out.
- *Support cards.* Policy sections 3, 5, 10 and 13 describe on-device support cards. Brief decision 9 and D-034 ship a static row instead unless a clinician signs off by 20 Nov. Nothing here mentions cards.

**Claims that depend on engineering or counsel (do not publish until true):**
- "Train machine learning models" follows `sensitiveConsent.use`. Policy CN-7: PowerSync has no written no-training clause. That is a launch gate if PowerSync is used (K-39 recommends not using it).
- The narrow staff-access cases come from policy section 7 and `site.faq`. The policy also says each access is logged and reviewed, which needs the access log in CN-8. I left the logging line out until it exists.
- "We reply within 45 days" is policy section 14. Policy section 20 also promises a reply to any message within 10 business days.
- The legal page URLs are from brief decision 13. Confirm they are live before publishing.

**Voice:** brief decision 11 asks for privacy said calmly, never fearfully, without over-explaining. The not-end-to-end-encrypted paragraph is kept because K-21 and the claims registry require that honesty.
