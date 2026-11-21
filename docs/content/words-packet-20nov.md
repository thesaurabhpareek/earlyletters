# Founder words packet: the locked pack v1.0 (BL-965, with BL-925)

Status: PROPOSED, 20 Nov 2026. Owner: `content`. Every line waits for the founder's approval, and counsel reads the lines marked in the Counsel column before they ship. Keys land in `packages/content` with the approved words. BL-925's five are in #866 now, beside `listen.discardButton` and `review.shortTake`. Each other key lands in the copy file of the agent building that feature (find, account, the photo stack and the rest), in the PR that wires the screen or just before it (architecture design AP-5; Karma's claim change on board #855, one owner per file). This packet lists those keys and words; it edits no copy file.

**How to answer.** Reply per part, for example "Part 1: approve", or give the row numbers you change and your words. Where a row offers options, A is the recommendation.

**Read for this packet (20 Nov).** The locked cards on `docs/prd-lock-v1-20nov` at `450bcb4a` (section 16, content inputs, and section 19, claims, of each card); plan #847 (`docs/engineering-project-plan-20nov` at `94603780`, sections 2.3, 2.7, 3a and 5.2); the engineering designs for 08 keeping, 09 capture, 10 reading and family, 11 foundations, privacy and architecture (scratchpad drafts, not merged); the product thread's drafts `docs/design/e2e/<area>/WORDS.md` on `docs/e2e-ux-20nov` at `38a614ac` (in progress, called "e2e A" to "e2e E" below); `VOICE.md`, `BRAND.md`, `test/rules.test.ts`, `test/support/copy-surfaces.ts`.

**Columns.** Key: the path the rules test reads (`en.` is `strings.en.ts`; `auth.`, `photos.`, `find.`, `packs.`, `accountDeletion.`, `export.`, `share.` are the feature files; `pages.` is `pages.en.ts`). Rule: what the line meets beyond the rules every line meets (ASCII, no fear, guilt or loss words, no machine-writing words, `{child}` only, no counts, no "we" outside the sanctioned promises). Counsel: what counsel reads for a line that promises something about data, pictures, backup or deletion, else "none". **Differs** rows list the other wording where an e2e draft or a design says it another way. I never pick silently.

**Checked (20 Nov).** Every quoted line in the Words column, the Part 4 lines and both placeholders went into `en` for one run (126 strings, re-run after the reviews). The rules, experience-pass, build12, claims, nameless-child and tab-labels tests passed, 174 of 174. Then a stricter pass: no "we", no edit words, the on-device-only pattern, and each card's own bans. It flagged only rows 2, 15 and 47 (noted on those rows), plus old words shown as "Now:". Nothing from either run is committed.

## Summary

| Part | Build | Lines | Approve first |
|---|---|---|---|
| 1 | 13, before the cut | 26 | 4 lines hold the cut: rows 1, 6, 7 and 8 |
| 2 | 14, when photo, Find, Share and the letter page turn on | 43 | One decision first: "photo" or "picture" (row 27) |
| 3 | 15 and wave 3 | 18 | None yet |
| 4 | Gated or parked | one paragraph per card | None: words wait for their gate |

---

## Part 1. Build 13

### NS-09 Let it go always finishes (BL-925, PR #866; BL-926, BL-977, P-4)

| # | Key | Where it shows | Words (A recommended) | Rule | Counsel |
|---|---|---|---|---|---|
| 1 | `en.review.letGoPending` | Review, one muted line under the words, once per recording, when Let it go was confirmed and the phone has not removed the file yet (the row is still marked `discarding`); VoiceOver reads it after the screen settles | A: "This recording is still on this phone. {app} will try again the next time it starts." B: "This recording is still on this phone. {app} will finish removing it." (the card's intent) C: "This recording is not removed yet. {app} tries again each time it opens." (e2e A) | None of NS-09 s16's banned words. A says only what the launch sweep does (`sweep.ts:152-153`). B promises completion, which the code retries but cannot ensure: the counter (R15) and Storage row (R6) are not built, and Remove now can fail again. C's "each time it opens" is more than the sweep does (it runs at launch, not on return from the background) | Claims row (NS-09 s17). Under B, a promise of completion |
| 2 | `en.listen.discardBodyNoUndo` | The Let it go confirmation, Review and Listen; replaces `listen.discardBody`; Keep it stays the default | A: "It will be removed from this phone, and it cannot be brought back." B: "It will be removed, and it cannot be brought back." C: "It will be removed from the phone, and it cannot be brought back." | NS-09-R9; A is the claim s19 enables. A says "from this phone", which the experience pass's on-device-only pattern flags (that pattern covers only that pass's keys); C avoids it | Every option. "Cannot be brought back" meets TDD 08 K2: when the server keeps a let-go held draft (newer words, or a legal hold: `sync_v1_server.sql:782-784`), the phone returns it as ready with its words (`merge.ts:585-591`). It holds once K2 is ruled (counsel Q51(h), #872). B also promises the account copy goes |
| 3 | `en.listen.letGoStuck` | One row per recording whose let-go has not finished after 3 launches (Storage, or Where your letters live: TDD 08 K3) | A: "A recording you let go is still on this phone." B: "One recording is still on this phone." | No count: two rows never both say "One" | Claims row |
| 4 | `en.listen.removeNowButton` | The same row | "Remove now" | 22 characters or fewer | none |
| 5 | `en.listen.removeNowA11yHint` | VoiceOver hint on Remove now | "Tries again to remove this recording." | Says what the button does, never "button" (NS-33) | none |

Differs: e2e A keys row 1 as `review.notRemoved` with option C's words, changes `discardBody` itself to option C's words, and keys rows 3 to 5 under `settingsHome`. e2e C keys row 1 as `review.letGoPending` with "That recording is still on this phone. The app will finish removing it." ("the app" as a name is a glossary ban), and row 3 as `storage.stuckOne` with option B and a heading "Recordings" (which exists: `settingsHome.recordingsLabel`).

### NS-10 A new phone (BL-922 holds the cut; BL-978 by Q1)

| # | Key | Where it shows | Words (A recommended) | Rule | Counsel |
|---|---|---|---|---|---|
| 6 | `auth.newPhone.consentBody` | The held screen (TDD 08 3.2: one screen for a returning account with consent outstanding), above Finish setting up and Try another way | A: "Finish setting up to open your book here." B: "Your book is ready to open once you finish setting up." | NS-10-R0; no loss words ("lost", "missing", "everything moved") | Yes: e2e E marks it for counsel; it says the book opens here |
| 7 | `auth.newPhone.nothingToCopy` | The held screen's export link, when this phone holds nothing (NS-10-R4b) | A: "There is nothing on this phone to copy yet. Your letters are in your account, and recordings are on the phone that made them." B: "There is nothing on this phone to copy yet. Your book is on your other phone." | R4b says the book is elsewhere; A names where each part is | Where data is: claims row; counsel reads (NS-10 s19) |
| 8 | `auth.consent.noBook.tryAnotherA11yHint` | VoiceOver hint on Try another way (held, slow and no-book states) | "Signs out, so you can sign in a different way." | Says the consequence before the tap | none |
| 9 | `en.book.newPhoneLine.moreComing` | The Book, one line at the top while the first pull is still arriving after 10 s; no close button | "More letters are on their way." | NS-10-R2; no count | none |
| 10 | `en.book.newPhoneLine.body` | The Book, one line at the top, backup off, once per phone and account, until closed | "The words of your letters are here. Recordings are kept on the phone that made them." | NS-10-R13; "kept", never "stay" (`whereLive` rule) | Yes: TDD 08 OQ-4 and K9 (packet Q43). Until counsel reads it, only `arrivedPlain` ships |
| 11 | `en.book.newPhoneLine.closeA11yHint` | VoiceOver hint on that line's Close | "Hides this line." | | none |
| 12 | `en.book.recordingNotHere` | Letter page, the recording row, when this phone has no file for a spoken letter | "Recording not on this phone" | NS-10-R1: no page says a recording is here when it is not | Claims row |

Differs:
- Row 6: e2e C writes A under the key `auth.newPhone.needsConsentBody`; e2e E writes B under `consentBody`. B says "ready", which the phone cannot know: the held screen is decided without the network.
- Row 8: e2e E keys the hint `system.a11y.tryAnotherHint`, in a new system copy file.
- Row 7: TDD 08 calls it `exportElsewhere`. e2e C (`declinedNothingHere`) adds "and pictures", which waits for photos (Part 2). e2e C also draws a separate declined state with its own title and body ("Your book stays in your account" / "Nothing comes to this phone until you agree. You can still save a copy or delete your account here."). e2e E has a different title ("Your book is waiting in your account"). TDD 08 draws one screen, so rows 6 and 7 cover it. If design keeps two states, I recommend e2e C's two lines.
- NS-10-R12 (the method line): TDD 08 asks for a new PROPOSED line. e2e C and E reuse `auth.account.signedInWith.*` ("Signed in with Apple"). I agree with reuse: no new words.
- Rows 9 to 12 follow e2e C. TDD 08 names them `more`, `recordingsHere` and a "not on this phone" clause in `provenanceLine`.

### Second account on one phone (BL-961; `[X4-R1]`, NS-10-R3, R5)

| # | Key | Where it shows | Words (A recommended) | Rule | Counsel |
|---|---|---|---|---|---|
| 13 | `accountScope.title` (#871 `apps/mobile/src/components/account/copy.ts`; moves into `packages/content` when approved) | The screen another signed-in account sees on a phone that holds this owner's book (BL-961, PR 2 of 3) | "This phone has a book from another account" | A heading, no full stop. Names nothing of the other account: no name, child, email or letter | Privacy read: it tells the signed-in person that another account's book is on this phone |
| 14 | `accountScope.body`; the button reuses `auth.account.signOut` ("Sign out", exists) | Under the title, then one Sign out button | "It stays closed while you are signed in with this account. Sign out to open it, or to sign in another way." | Promises no other place for the book and says nothing was removed (nothing is) | Privacy read: says the book stays on this phone, closed |

Rows 13 and 14 are #871's words, as BL-961 builds them (head `46608dd4`). My earlier rows, "This phone is set up for a different account." and a "Use another account" button, are withdrawn. #871 says plainly that a book is here, and its one action is the existing Sign out. Differs: e2e E withdrew a screen here (section 5.6): lists filter to the signed-in account's rows and no line appears, because a screen tells that person another book exists. TDD 08 OQ-5 (founder, D1 class) and K8 decide between them; #871 builds the screen, the founder's default.

### Sign-out sheet (ruling D1; NS-08-R6, NS-01-R30; wired by BL-961 or P-6c)

| # | Key | Where it shows | Words (A recommended) | Rule | Counsel |
|---|---|---|---|---|---|
| 15 | `auth.account.signOutBody` (change) | The sign-out sheet, sentence 1 | "Your letters and recordings stay on this phone." Now: "Your letters stay on this phone. Sign in again any time." | D1 intent; the one key allowed to say "stay on this phone" (`copy-surfaces.ts`, `exactly`) | Yes: where data stays |
| 16 | `auth.account.signOutWho` | The same sheet: sentence 2, or sentence 3 when row 51 shows | "Anyone who can open {app} here can read them. Use Erase everything to remove them." | D1 intent; "can open" is true with App lock on | Yes. Ships only once Erase everything shows after a sign-out on a synced phone (e2e C, DESIGN G2) |
| 17 | `auth.account.signOutA11yHint` | VoiceOver hint on Sign out | "Signs out on this phone. Your book stays here." | Same claim as row 15, said in the hint | Yes: where data stays |

Differs: e2e C writes row 16 with "the app"; `{app}` avoids the glossary ban. The picture sentence for this sheet is row 51 (Part 2).

### Lock-screen placeholder (NS-32-R13, NS-13-R33; BL-966 by Q1)

| # | Key | Where it shows | Words (A recommended) | Rule | Counsel |
|---|---|---|---|---|---|
| 18 | `en.notifications.previewPlaceholder` | What iOS shows for any reminder when previews are hidden (category `reminder`) | A: "Something for the book, whenever you have a minute." B: "Something for tonight." | No name, count, day or brand (iOS shows the app's name); under 60 characters; invites | none |
| 19 | `en.notifications.planPreviewPlaceholder` | The same, category `plan` | "A reminder about your plan." | No price or date | none |

Differs: the card's intent is "A note for tonight". "Note" is only something a person makes (glossary), and birthday and typed-day messages do not come at night (e2e D G1, e2e E CG1). TDD 09 names one key, `notifications.previewPlaceholder`. TDD 11 names two (`reminders.previewPlaceholder`, `planReminders.previewPlaceholder`). e2e D names five, one per class: four with A's words and `plan` with row 19's. A category has one placeholder, so two keys are enough.

### Tab jobs and the Me heading (NS-35-R6, navigation test N2 d to f; NS-33-R2, BL-928)

| # | Key | Where it shows | Words | Rule | Counsel |
|---|---|---|---|---|---|
| 20 | `en.tabsJob.home` | The navigation test (spec 06 10.2); VoiceOver at most | "I go to Home to say something to {child}." | Pattern "I go to Home to say", 12 words or fewer | none |
| 21 | `en.tabsJob.book` | The same | "I go to the Book to read {child}'s letters." | Verb "read" | none |
| 22 | `en.tabsJob.me` | The same | "I go to Me to look after my account and books." | Verb "look after" | none |
| 23 | none (NS-33-R2, BL-928) | Me's screen heading | No new words: the heading reads the tab label, "Me" (`tabs.you`). design-systems' NS-33 spec (`docs/design/specs/NS-33-ACCESSIBILITY-FLOOR-20nov.md` section 1, branch `docs/design-bl-927-ns33-floor`) says the same: BL-928 needs no new word | Glossary | none |

Differs, row 21: spec 06 section 1 and the lock README (line 113) say "I go to the Book to read what we kept." The "we" rule keeps "we" to the sanctioned promises, so row 21 says "{child}'s letters". Spec 06 also draws `tabsJob.book` under the Book's title. A first-person line reads oddly there. I recommend the drawn line be its own key, or no line. That choice belongs to `design-systems`. "Home" and "Me" have no BRAND.md glossary row yet. The rows go in a follow-up: `BRAND.md` is outside this run's claim.

### What else Build 13 shows

| # | Line | Status |
|---|---|---|
| 24 | Finish setting up, Try another way, Delete account, No book here yet; and `auth.account.signedInWith.*` ("Signed in with Apple") in a new place, the wrong-account route (NS-10-R12) | Exist on develop (`auth.account.finishSetup`, `auth.consent.noBook.*`, `settingsHome.deleteAccountLabel`, `auth.account.signedInWith.*`). I found no record of the founder's approval for them; the NS-10-R12 placement is new and is yours to see |
| 25 | `settingsHome.exportLabel` "Export your book" on the held screen | Exists. The rename to "Save a copy" is NS-11 (row 75), not Build 13 |
| 26 | `auth.newPhone.arrivedPlain` "Your book is here." | Exists |

---

## Part 2. Build 14 (flags turn on)

### NS-01 Photo with a letter (BL-931 stack, #835 to #842; BL-956)

| # | Key | Where it shows | Words (A recommended) | Rule | Counsel |
|---|---|---|---|---|---|
| 27 | Decision, every photo line | One word for what a parent adds | A: "photo" everywhere a parent reads it. B: "photo" on controls and the lens, "picture" in sentences about keeping and deleting (e2e C; the card's prose) | One term per concept (BRAND.md). A matches iOS Photos and the built start button and lens | none |
| 28 | `photos.capture.startButton` | Home, the quiet start | "Start from a photo" | 22 characters or fewer | none |
| 29 | `photos.capture.change` | Ready and Write | A: "Change photo". Now: "Change" | Voice Control: "Change" is ambiguous next to "Change words" (e2e A W2) | none |
| 30 | `photos.capture.openFailed` | Ready, when the picker gives a file that will not open | "That photo could not be opened. Choose another." | Names what happened, no cause | none |
| 31 | `photos.text.label`, `.optional` | The photo words field | "Words about this photo" with "Optional" | Card intent "A few words about this picture, if you like" is longer; "Optional" says "if you like" | none |
| 32 | `photos.text.hint`, `.placeHint` | Under each field | "Up to 140 characters. Only what you type is kept." / "Up to 60 characters. Only what you type is kept." | NS-01-R21b: nothing is filled in or read from the photo | Claims row (NS-01 s19) |
| 33 | `photos.text.placeLabel` | The place field | "Where was this?" | Card intent "Where, if you like" | none |
| 34 | `photos.book.lens.months`, `.photos` | Book lens | "Months" / "Photos" | Single words | none |
| 35 | `photos.book.lens.groupA11y` | VoiceOver name of the lens group, never drawn (the NS-33 spec section 6 asks #840 for it) | "Show letters by" | Never "button" or "tab" | none |
| 36 | `photos.book.letter.addPhoto`, `.changePhoto` | Letter page | "Add a photo to this letter" / "Change photo" | addPhoto is 26 characters: a row or link, never a button | none |
| 37 | `photos.book.letter.replacePhotoAsk.*` | Before a second photo replaces the first | "Use this photo instead?" / "The first photo stays until you choose." / "Use this photo" / "Keep the first" (the default) | Safe choice is the default (NS-01-R7) | none |
| 38 | `.replacePhotoUndo`, `.removePhoto`, `.removed`, `.undo` | Toasts and the take-off control | "Photo changed." / "Take the photo off" / "Photo taken off." / "Undo" | Undo for 10 s | none |
| 39 | `photos.book.letter.notSaved` | Letter page, when the photo could not be stored | "The photo did not come along with this letter. Your words are kept, and you can add it again." | NS-01-R58; no cause, no blame | none |
| 40 | `photos.review.notStored` | Review, where the photo was | "That photo did not come along. You can add it again." | NS-01-R17a | none |
| 41 | `photos.book.letter.missing`, `.missingRemove` | Letter page, when the file is gone | "Not on this phone any more" / "Remove" | NS-01-R56; no loss word | Claims row (the twin of row 12) |
| 42 | `photos.book.photos.a11yCard` | VoiceOver label of a photo with no words | "Photo with this letter" | NS-01-R9a: fixed, never machine text | none |
| 43 | `photos.a11y.startHint` | Hint on the start | "Opens your photos so you can pick one and then tell {child} about it." | | none |
| 44 | `photos.capture.iCloudProgressA11y` | The progress row while iCloud sends the photo; the system reads the percent | "Getting the photo from iCloud" | One "progress" exemption (README appendix A); no number in the label | none |
| 45 | `photos.capture.iCloudOffline` | When the photo is in iCloud and the phone is offline | "This photo is in iCloud. It needs a connection to come to this phone." | Card intent, in two short sentences | none |
| 46 | `photos.review.needsWords` | Review, beside a dimmed Keep | "Keep is ready once this letter has words." | NS-01-R5a; an invitation, not a block | none |
| 47 | `en.listen.discardBodyPhotoNoUndo` | Let it go on a letter with a photo | "The recording and its photo will be removed from this phone, and they cannot be brought back." | Same shape as row 2 A (and its pattern note) | Claims row |
| 48 | `packs.photosLabel` | Storage, one row with the size (NS-37) | "Photos on this phone" | Card intent "Pictures on this phone"; one size, no count | none |
| 49 | `packs.photosHelp` | Under that row (NS-01 s16) | "Photos are kept on the phone that added them." | Card intent "Pictures stay on the phone"; house rule says "kept" | Yes (ADR 0028 D1) |
| 50 | `en.whereLive.onPhone`, `.onPhoneSynced`, `.iphoneBackup.body`; `en.settings.privacy.keptOnPhone`, `.keptSynced`, `.iphoneBackup`; `en.settings.recordings.onPhoneBody`, `.onPhoneBodyBackupOff` (changes); and `privacy-policy.md:37` (founder, through `legal`) | Where your letters live and Privacy (NS-01-R32) | Each adds photos to the recordings clause, for example "Your letters, recordings and photos are kept on this iPhone." The full set is e2e C, C-S08 | Same sentence shape as today | Yes: NS-01 s16 names R32 for counsel |
| 51 | `auth.account.signOutPhotos` | Sign-out sheet, sentence 2, right after row 15 and before row 16, only when this account has a photo | "So do the photos you added." | D1, NS-01-R30 | Yes |
| 52 | `accountDeletion.what.recordingsAndPhotos` | Delete account, step 1, backup off, photos on | "Your recordings and photos are on the phone that made them, not in your account. After you sign out, Erase everything on this phone removes them." | NS-01-R31; true under ADR 0028 (line 192, Delete account: "The server has no picture") | Yes (packet Q51) |
| 53 | `pages.deleteAccount.whatIsDeleted` (replaces `pages.en.ts:240`) | The website deletion page | Paragraphs [0] and [1] of e2e C, C-S20: letters leave our servers; recordings and photos are kept on the phone that made them. Its paragraph [2] (letters hidden until a day) waits for seals (Part 4): it would promise a feature that is not built | Line 240 promises removing photos we never hold (ADR 0028 D6) | Yes (Q51). The page is live today, so `legal` registers it now, not at Build 14 (PRIV-R17) |

Rows 51 and 52 sit in `authCopy` and `accountDeletionCopy`, whose surface rules ban "photo" today (`copy-surfaces.ts`, the Build 12 rule). The PR that turns photos on changes that rule. Under row 27 B, both rows say "pictures" instead.

### NS-02 Find (#798, BL-952)

| # | Key | Where it shows | Words | Rule | Counsel |
|---|---|---|---|---|---|
| 54 | `find.fieldHint` | VoiceOver and Switch Control hint on the field, drawn nowhere | "A few letters are enough to start looking." | No number (a CJK query matches from one character) | none |
| 55 | `en.book.empty.searchTitle` (change) | The no-match view, its only line | "No letters with that word." Now: "No letters with that word yet." | NS-02-R39 bans "yet" | none |
| 56 | `find.notReady` (change) | While the words are being gathered | "Find is getting ready on this phone." Now: "Find is still getting ready on this phone." | NS-02 s16 bans "still" | none |
| 57 | `find.button`, `.buttonHint`, `.placeholder`, `.fieldLabel`, `.foundA11y`, `.rowA11y`, `.error`, `.retry`, `.clear`, `.cancel` | Book header and the Find screen | As written on #798: "Find" / "Looks for a word in this book's letters." / "Find in {child}'s book" / "Find a letter" / "Letters found" / "{date}. {label}. Opens the letter." / "Find could not look just now." / "Try again" / "Clear" / "Cancel" | No count, no "results" (NS-02-R11, s16) | none |

Differs: e2e E proposes "Find did not work this time. Try again." for `find.error`. #798's line names what did not happen without "work". I keep #798's line. e2e B reuses `common.tryAgainButton` and `common.cancelButton` for `retry` and `cancel`. I agree (same words, one key).

### NS-05 Share one letter, Level 1 (BL-939)

| # | Key | Where it shows | Words (A recommended) | Rule | Counsel |
|---|---|---|---|---|---|
| 58 | `share.letter.action` | Letter page control | A: "Share this letter". B: "Send this letter" | 22 characters or fewer; the verb is `content` with `legal` (NS-05 OQ-6) | `legal` reads the verb |
| 59 | `share.letter.title` | Preview sheet title | "This will be sent" | | none |
| 60 | `share.letter.wordsAlways` | Static row | "The words always go" | Never a switch (R4b) | none |
| 61 | `share.letter.picture` | The one switch | "Include the photo" | Card intent "Include the picture"; row 27 | Q45 (a child's photo leaving the phone) |
| 62 | `share.letter.versionFixes`, `.versionExact` | Which words go | "Sent as it reads in the book, with small fixes." / "Sent exactly as said." | "Exactly" only when the words are untouched (VOICE) | none |
| 63 | `share.letter.whereItGoes` | Above Continue | "It goes only where you send it. Once sent, it cannot be taken back." | NS-05 s16 | Yes: a promise about where data goes |
| 64 | `share.letter.pictureFailed` | In place of the switch | "The photo could not be added this time. The words will still go." | No cause | none |

Differs: e2e D uses `shareCopy.letter.*` and "picture"; the privacy design names `share.preview.*`. Key home is Karma's call.

### NS-21 The letter page reads as one place (BL-937, wave 2)

| # | Key | Where it shows | Words | Rule | Counsel |
|---|---|---|---|---|---|
| 65 | `en.letter.listTitle` | Heading of the list under the letter | "This letter" | NS-21 s16; never "edit", "manage", "settings" | none |
| 66 | `en.letter.rows.dayAbout` | Row 1 | "About {date}" | Shared with NS-15 | none |
| 67 | `en.letter.rows.whoCanRead` | Row 5 | "Who can read it" | | none |
| 68 | `en.letter.whoCanRead.onlyYou`, `.onlyYouHelp` | Value and its help | "Only you" / "Kept out of the book, for you alone." | | Yes: a privacy promise; staff access stays as the Privacy Policy says |
| 69 | `en.letter.whoCanRead.inBook`, `.inBookHelp` | Value and its help | "In the book" / "Everyone who reads {child}'s book can read it." | Names no role (D-161) | Yes: who can read a letter |

Differs: TDD 10 puts these in a new `features/letter-page.en.ts` as `letterPage.*`. e2e B puts them in `strings.en.ts` as `en.letter.*`. Both work. A new feature file needs a `copy-surfaces.ts` row.

---

## Part 3. Build 15 and wave 3 (no approval needed yet)

| # | Card | Key | Words | Rule | Counsel |
|---|---|---|---|---|---|
| 70 | NS-23 | `en.tonight.pastLetter.notTodayButton` | "Not today" | Card intent | none |
| 71 | NS-23 | `en.settings.pastLetters.label` | "Past letters on Home" | Card intent | none |
| 72 | NS-23 | `en.settings.pastLetters.help` | "When today's date matches a letter from an earlier month or year, Home can show it." | Says the rule is the date, never meaning (NS-23 s19) | none |
| 73 | NS-23 | `en.tonight.pastLetter.a11y` | "{date}. {label}. Opens the letter." | Same shape as Find's row | none |
| 74 | NS-22 | `en.book.header.moreA11y` | "More for this book" | Card intent | none |
| 75 | NS-11 | `en.settingsHome.exportLabel`, `en.settings.export.title`, `.button` (changes) | "Save a copy" | One name on every door (TDD 08 K13) | none |
| 76 | NS-11 | `en.settings.export.lead` | "A copy of your book, yours to keep, in files that open anywhere." | Keepsake, never protection (s16) | Claims row (s19) |
| 77 | NS-11 | `en.tonight.copySlip.body`, `.bodyTwo` | "Save a copy of {child}'s year, yours to keep." / "Save a copy of the year for {a} and {b}, yours to keep." | No "backup", no fear | Claims row (the twin of row 76) |
| 78 | NS-11 | `export.screen.lowPower` | "This may take a little longer while Low Power Mode is on." | One line for both export screens | none |
| 79 | NS-11 | `en.tonight.copySlip.chooserTitle` | "Which book?" | | none |
| 80 | NS-11 | `export.screen.privacyNotice` (change) | "This copy is as private as the place you keep it." | | Yes |
| 81 | NS-11 | The rest of the screen's states | e2e C, C-S04 (about 20 lines) | | as marked there |
| 82 | NS-14 | `en.children.switcher.labelBorn`, `.labelDue` | "For your child, born {date}" / "For your child, due {date}" | Never "Child 1" | none |
| 83 | NS-14 | `en.children.switcher.homeA11y` | "For {child}. New letters go to {child}'s book." | | none |
| 84 | NS-15 | `en.book.dateline.aboutSaid` | "About {a}. Said on {b}." | No "backdated", no "late" | none |
| 85 | NS-15 | `en.review.date.changeA11yHint` | "Sets the day this letter is about. The day you said it stays the same." | | none |
| 86 | NS-15 | `en.review.date.notSaved` | "That date did not save. The letter keeps the day it had." | Names what did not finish | none |
| 87 | NS-07 C28 | `export.printable.title`, `.making`, `.failed` | "Printable book (PDF)" / "Making your book" / "The book could not be made this time." | "Printable", never "print-ready" or the bare verb (K-32) | none |

---

## Part 4. Gated or parked: words wait for the gate

- **NS-12 Earlier versions** (counsel Q51, Q32, Q48, and Q108 on #872): e2e C, C-S13 and C-S14 hold about 20 lines. The one counsel reads first: "Earlier versions of your words are kept until you remove them. Exactly what you said stays with the letter either way." (D8).
- **NS-16 Someone else speaks** (wave 5, counsel): the instruction "Ask before you record someone else." and the too-long line. They are e2e A's. D9 makes it an instruction, never an attestation.
- **NS-17 Second spoken language** (gate): "This was in another language" and its hint (e2e A). No "translate", no "detect".
- **NS-18 Typed days** (wave 4): e2e D's lines. One fix before approval: "Your words stay on this phone." should say "are kept on this phone" (house rule). Written that way, it joins the counsel list (where data is).
- **NS-24 Read the year back**: "{child}'s first year", "Before You". No "highlights" or "recap".
- **NS-25 The other parent, in the store app**: waits for counsel Q48, Q49, Q53.
- **NS-06 Firsts, sealed letter, quick capture**: waits for plan #847 Q3 (seals in scope) and counsel's seal questions (card B17: Q20, Q32, Q43, Q48, Q49, Q50, Q54, and Q107 on #872). Seal words stay unwritten until counsel answers.
- **NS-08 flip**: `backup.sheet.otherVoices` and `accountDeletion.what.backupPurged` wait for the flip and the X2 reads.
- **NS-13 neutral pool** (31 lines, R2b): a separate content task after BL-943. Every pool line is tagged "before birth: yes or no" (e2e D G5).

---

## For counsel, in one list
Rows 1, 2, 3, 6, 7, 10, 12, 15, 16, 17, 32, 47, 49, 50, 51, 52, 53, 61, 63, 68, 69, 76, 80, and the NS-12 line in Part 4. Privacy reads rows 13 and 14. Claims rows (PRIV-R17), without a counsel read: 41 and 77. Each says where a letter, recording or photo is, who can read it, or that it is removed.

## For Karma (not words)
- Key homes differ between the designs and the e2e drafts: letter page, share and the placeholders. Rows 18, 19 and 58 to 69 name the choice. (The NS-09 keys follow your claim change: beside `listen.discardButton` and `review.shortTake`.)
- Rows 51 and 52 need the photo ban in `copy-surfaces.ts` lifted for `authCopy` and `accountDeletionCopy` in the PR that turns photos on.
- BRAND.md glossary rows for "Home", "Me" and the row 27 decision follow in a `content` PR. `BRAND.md` is outside this run's claim.
- The NS-09 test is in #866 (`packages/content/test/ns09-copy.test.ts`, under the widened claim).
- Hint keys use the house suffix `A11yHint` (rows 5, 8, 11, 17, 85), as review A asked; e2e A and C use `HintA11y` in places.
