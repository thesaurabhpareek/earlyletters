# Your privacy

Your letters are yours. Here is what happens to them, plainly.

## The short version

- Your letters and recordings are private. We never sell them, never use them for ads and never use them to train machine learning models.
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

You can change this any time in Settings, Privacy, **Sync and family sharing**. If you turn it off, syncing stops and we offer to delete what already synced.

Letters on our servers are protected by access rules and encrypted at rest. They are stored so that your co-parent and your next phone can read them, which also means the few people who run Early Letters could open them. We look only if you ask us to when you need help, to deal with a security problem or serious misuse, or when the law requires it.

## Your recordings

Each recording stays on the phone it was made on, with its letter. It is not sent to us.

Your iPhone's own backup, such as iCloud Backup, may include what the app keeps on your phone. That backup is in your Apple account, not ours. To keep a copy of your recordings anywhere you like, export your book.

We never imitate your voice. Your original recording is always kept exactly as you made it. We never make a voiceprint: recordings are kept so they can be played, and that is all.

## Usage and crash reports

They help us find what is broken. They stay off until you say yes, and nothing in the app depends on them. When they are on, they say which screens you open and what happened, like "a letter was saved", and never what you wrote or said. Turn them on or off in Settings, Privacy, **Share usage and crash reports**.

## Notifications

Notifications never show what anyone wrote. They leave out {child}'s name on your lock screen unless you turn on **Names in notifications** in Settings, Reminders.

## No ads, no tracking

There are no ads and no ad networks in Early Letters. We do not follow you across other apps or websites, so the app never asks to track you.

## Who uses Early Letters

Early Letters is for adults. A book is about a child, and the child does not use the app.

## Your choices

| You want to | Where |
|---|---|
| Export your book | Settings, Export your book |
| Delete a letter, a book or your account | See [Deleting and exporting](deleting-and-exporting.md). Your account: Settings, Delete account. |
| Stop syncing | Settings, Privacy, Sync and family sharing |
| Turn usage and crash reports on or off | Settings, Privacy, Share usage and crash reports |
| Show or hide names in notifications | Settings, Reminders, Names in notifications |
| Ask a privacy question, or ask for a copy, a correction or deletion | Email {PRIVACY_EMAIL} |

We reply to privacy requests within 45 days, and usually much sooner.

## The full policy

Our Privacy Policy is at https://earlyletters.com/privacy, and our Consumer Health Data Privacy Policy is at https://earlyletters.com/health-privacy. The companies that help us run Early Letters are listed at https://earlyletters.com/subprocessors. In the app, Settings, Privacy opens each of them.

## Writing to us

You never need to send your letters, recordings or {child}'s name to get help. We look at something in your book only if you ask us to.

---

## Reviewer notes (remove before publishing)

**Built on develop (7cc43b1):**
- Settings, Privacy: `apps/mobile/src/app/settings/privacy.tsx` lines 50 to 64 ("Share usage and crash reports"; "Sync and family sharing", whose help text says turning it off stops syncing and offers to delete what already synced, `strings.en.ts` line 681; links to the Privacy Policy, Consumer Health Data Privacy Policy, subprocessors and Terms).
- The sync question after sign-in: `sensitiveConsent.*` (`strings.en.ts` lines 699 to 708: "Agree and sync", "Keep on this phone", "You can change this any time in Settings, Privacy"). Nothing syncs before it is accepted (`docs/ops/AUTH_SETUP.md` lines 263 and 264).
- Names in notifications: a switch in Settings, Reminders (`apps/mobile/src/app/settings/reminders.tsx` lines 209 to 214), off by default (`apps/mobile/src/lib/reminders/prefs.ts` line 35, D-025).
- The promise: `trust.promise` and `trust.voice` (`strings.en.ts` lines 958 and 962) are used word for word in the short version and "Your recordings" (D-061: one promise, said the same way everywhere).

**Changed in this review:** the first bullet and the voice line now use the app's own promise words (D-061). Paths follow the build: names in notifications live in Settings, Reminders, not Settings, Privacy; export and account deletion are their own rows in Settings, not under "Your data".

**Matches the Privacy Policy draft 1.3.0** (sections 3, 6, 7, 9, 12, 13, 14; unchanged on develop) except where the founder's decisions of 3 Oct narrow v1.0. These are hand-offs to `legal` to update the policy:
- *Recordings.* The policy's short version and section 7 describe encrypted backup, Standard and Vault modes and family playback. D-059 says no audio upload in v1.0 and answers D-032, so this article says recordings stay on the phone. The iPhone backup line comes from policy section 9, and the D-033 copy is settled (DECISIONS.md lines 378 and 393).
- *Cloud transcription.* Policy section 4 applies from v1.1 (policy section 2 says so).
- *Family members.* Co-parent only at v1.0 (D-055), so "Family can read the book" and family approvals are left out.
- *Support cards.* Policy sections 3, 5, 10 and 13 describe on-device support cards. D-059 answers D-034: a static "If you are struggling" row ships instead. Nothing here mentions cards.

**Claims that depend on engineering or counsel (do not publish until true):**
- "Never used to train machine learning models" follows `trust.promise`. Policy CN-7 was about PowerSync, which D-023 (Decided) replaces with our own sync on Supabase, so that launch gate no longer applies. Counsel should still confirm every subprocessor's terms.
- The narrow staff-access cases come from policy section 7 and `site.faq`. The policy also says each access is logged and reviewed. `ops.audit_log` (`supabase/migrations/20261004200000_ops_deletion_worker.sql` line 11) now records runbook access, but that migration is not applied yet and I found no review process. The logging line stays out until both exist.
- "We reply within 45 days" is policy section 14. Policy section 20 also promises a reply to any message within 10 business days.
- The legal page URLs are D-063 and `packages/brand` (`web.privacy`, `web.healthPrivacy`, `web.subprocessors`). Confirm they are live before publishing.

**Voice:** D-061 (brief decision 11) asks for privacy said calmly, never fearfully, without over-explaining. The paragraph about who could open letters on our servers stays, because K-21 and the claims registry require that honesty. It no longer uses the words "end-to-end": the D-061 rule in `packages/content/test/rules.test.ts` line 268 bans them in product copy, and the website FAQ (`packages/content/src/site.en.ts` line 78) says the same thing without them. A macro can still answer "Is it end-to-end encrypted?" with a plain no.
