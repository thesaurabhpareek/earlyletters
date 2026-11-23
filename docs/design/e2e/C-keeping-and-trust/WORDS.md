# Area C. Keeping and trust: every word

Status: DRAFT, reconciled once with `DESIGN.md` (its full version of 20 Nov, journeys J-C01 to J-C15, gaps G1 to G14, E1 to E14). Content design lead, area C. 20 Nov 2026.
Keyed to the screen and state ids in `DESIGN.md` (C-S01 to C-S22). Where DESIGN.md gives words as intent, the words here replace them; where the two differ, section "Reconciliation with DESIGN.md" at the end says which and why.

Sources read this session: `BRIEF.md`; cards 08 (NS-08 to NS-12), 07 section 4 (C28), 11 (NS-36), 10 (NS-21, NS-22), 06 Part B (seals, D6), 01 (NS-01-R29 to R32); 16 (T1 to T5, D1 to D13); `VOICE.md`, `BRAND.md`, `test/rules.test.ts`, `test/support/copy-surfaces.ts`; `strings.en.ts`, `features/auth.en.ts`, `features/account-deletion.en.ts`, `features/export.en.ts`, `features/backup.en.ts`, `pages.en.ts`; `apps/mobile/src/app/settings/account.tsx` (the sign-out alert as built). Nothing was run on a phone.

## 0. How to read this file

- **Status** column: `EXISTING` (a key on `develop`, reused as is), `CHANGED (PROPOSED)` (an existing key with new words), `PROPOSED` (a new key). Every PROPOSED and CHANGED line waits for the founder's word approval before any build outside his family shows it (BRIEF section 2). Lines that state a fact about where data is, or about deletion, also go to `legal` for the claims registry (marked `CLAIM`).
- **Key** paths: `en.` is `packages/content/src/strings.en.ts`; `auth.`, `accountDeletion.`, `export.`, `backup.` are the `features/*.en.ts` copies; `pages.` is `pages.en.ts`.
- **VO** is the VoiceOver label, then the hint after a slash. **VC** is the Voice Control name, which always equals the visible label (NS-33). A dash in a cell means "same as the text" or "none".
- Placeholders: `{child}`, `{signsAs}`, `{date}`, `{size}`, `{a}`, `{b}`, all already in use. No new placeholder is added to `authCopy` or `accountDeletionCopy` (their surface tests fix the allowed set).
- Picture words: "picture" for what the parent added; "stored copy" only where the file itself is meant (T3). "Photos" is never used in `authCopy` or `accountDeletionCopy` (both surfaces ban it) and is kept only as the name of the Photos lens.
- "Printable", never "print-ready"; and never the bare verb "print" (the K-32 pattern in `rules.test.ts:398` matches "print", "printed", "printing").

---

## C-S01. Me (Look after)

| Key | Status | Text | State | VO / VC | Card row |
|---|---|---|---|---|---|
| `en.tabs.you` | EXISTING | Me | all | "Me" / hint `en.settingsHome.youTabHint` "Settings and account" | frame 4 |
| `en.settingsHome.sections.keep` | PROPOSED | Keeping your book | section heading over Save a copy and Where your letters live | heading | NS-11-R1 (DESIGN.md's section) |
| `en.settingsHome.exportLabel` | CHANGED (PROPOSED) | Save a copy | `.default` | "Save a copy" / "Opens Save a copy." ; VC "Save a copy" | NS-11-R1 (one row, one name) |
| `en.settingsHome.exportHelp` | CHANGED (PROPOSED) | Every letter, recording and picture, free, any time. | `.default` (photos on) | read after the label | NS-11-R1; NS-01-R32 spirit |
| `en.settingsHome.exportHelpNoPictures` | PROPOSED | Every letter and recording, free, any time. | photos off (today's words, kept for the flag-off build) | as above | NS-01-R19 |
| `en.settingsHome.whereLive` | EXISTING | Where your letters live | `.default` | - | NS-08-R7 |
| `en.settingsHome.storageLabel` / `storageHelp` | EXISTING | Storage / Languages and space on this phone. | `.default` | - | NS-09-R6 |
| `en.settings.delete.recentlyDeleted` | EXISTING | Recently deleted | `.default` | - | NS-21-R7b |
| `en.settingsHome.deleteAccountLabel` | EXISTING | Delete account | `.default` (signed in) | - | D6 |
| `en.settings.erase.rowLabel` | EXISTING | Erase everything on this phone | `.signedout` and `.local` (DESIGN E1: also after a sign-in, BL-961) | - | D1 |
| `en.settingsHome.signedOut.body` | EXISTING | Your letters are on this phone. | `.signedout` | - | D1 |
| `en.settings.export.exportNudge` | EXISTING | Save a copy of your book in Files or iCloud Drive. It is yours to keep. | `.default`, Me card while never exported | - | NS-08-R8 (see the keep-safe line in C-S08) |

Why "Save a copy" and not "Take the book with you" (the two names NS-11 offered): "take with you" reads as moving the book, which on a new phone it does not do for recordings or pictures (NS-10 claims). "Save a copy" says what happens and leaves the book where it is. For the same reason DESIGN.md's section heading "Take the book with you" becomes "Keeping your book". J-N8 in `14-test-plan.md` names "Take the book with you"; it should read "Save a copy" (Card gaps, 1).

Plan lapse, kill switch, second account: no word on Me changes; no Plus line sits on any area C screen (T2).

---

## C-S02 and C-S03. Account and the sign-out sheet (D1)

Today the sheet is a native alert (`settings/account.tsx:191-198`); DESIGN.md moves it to the built `Sheet` so the D1 text never clips at AX5 (E12). The body is three keys in one paragraph, so the one key allowed to say "stay on this phone" (`auth.account.signOutBody`, `copy-surfaces.ts:387` `exactly`) holds that sentence alone, and the picture sentence needs no test change.

| Key | Status | Text | State | VO / VC | Card row |
|---|---|---|---|---|---|
| `auth.account.signOut` | EXISTING | Sign out | C-S02 row | VC "Sign out" | D1 |
| `auth.account.signOutTitle` | EXISTING | Sign out on this phone? | C-S03 title | read first | D1 |
| `auth.account.signOutBody` | CHANGED (PROPOSED) `CLAIM` | Your letters and recordings stay on this phone. | C-S03 message, sentence 1 | read in order | D1; NS-08-R6; J-N21 |
| `auth.account.signOutPictures` | PROPOSED `CLAIM` | So do the pictures you added. | C-S03 `.photos`, sentence 2, only when this account has a picture | read in order | NS-01-R30 |
| `auth.account.signOutWho` | PROPOSED `CLAIM` | Anyone who can open the app here can read them. Use Erase everything to remove them. | C-S03 sentence 3 | read in order | D1; NS-08 threat row |
| `auth.account.staySignedIn` | EXISTING | Stay signed in | C-S03 first button, default and escape; C-S02 `.waiting` | VC "Stay signed in" / hint "Closes this. Nothing changes." | NS-08 door "Decline" |
| `auth.account.signOut` | EXISTING | Sign out | C-S03 second button (accent, not destructive: nothing is deleted) | VC "Sign out" / hint "Signs out on this phone. Your book stays here." | D1 |
| `auth.account.signOutHint` | PROPOSED | Signs out on this phone. Your book stays here. | VO hint on the C-S03 Sign out button | - | D1 |
| `auth.account.signOutWaiting` | EXISTING | Your newest letters are still on their way. This phone signs out once they are sent. | C-S02 `.waiting` | announced | NS-08-R15; NS-09-R12 |
| `auth.account.signOutNow` | PROPOSED | Sign out now | C-S02 `.waiting`, quiet button (no key on `develop` for this label) | VC "Sign out now" / hint "Your newest letters wait on this phone and are sent the next time you sign in." | NS-09-R12 |
| `auth.account.signOutOthersOffline` | PROPOSED | Needs a connection. | C-S02 `.offline`, footer under the disabled Sign out other devices | read with the row | DESIGN C-S02 |
| `auth.account.signOutEarly` | EXISTING | Your newest letters are kept on this phone. They are sent the next time you sign in to this account. | C-S02 `.signedout` after an early end | announced | NS-09-R12 |
| `auth.account.signOutOthers` / `signOutOthersHelp` / `signOutOthersDone` | EXISTING | Sign out other devices / Other phones signed in to this account will need to sign in again. / Other devices are signed out. | C-S02 | - | glossary LNG-14 |

Today's `signOutBody` ("Your letters stay on this phone. Sign in again any time.") drops "Sign in again any time." The full message reads, photos on: "Your letters and recordings stay on this phone. So do the pictures you added. Anyone who can open the app here can read them. Use Erase everything to remove them."

Two deliberate departures from the D1 intent, for the founder:
- "Anyone who opens the app here" became "Anyone who can open the app here": the build has App lock (`settings/app-lock.tsx`), and with it on, not anyone who opens the app can read. "Can open" is true either way.
- "Use Erase everything to remove them" is true only if Erase everything shows after a sign-out on a phone that synced. Today it shows only on a phone that never signed in (DESIGN G2, E1, BL-961). The line ships only with that fix; until then it would send the parent to a row that is not there.

`signOutHint` says "Your book stays here" rather than repeating "stay on this phone", which only `signOutBody` may say.

Second account (X4-R1): no words. B never sees A's letters, so nothing names them.

---

## C-S04. Save a copy (the one export screen) (NS-11, NS-36, NS-10-R4b)

| Key | Status | Text | State | VO / VC | Card row |
|---|---|---|---|---|---|
| `en.settings.export.title` | CHANGED (PROPOSED) | Save a copy | title | heading level 1 | NS-11-R1 |
| `en.settings.export.lead` | PROPOSED | A copy of your book, yours to keep, in files that open anywhere. | `.default`, under the cover | read after the heading | NS-11 claims ("in open formats, yours to keep"); one copy holds every book on this phone, so no name |
| `export.screen.includesTitle` | EXISTING | What is inside | `.default` | heading | NS-11 happy path 2 |
| `export.screen.includesLetters` | EXISTING | Every letter, as text | `.default` | - | NS-36-R2 |
| `export.screen.includesRecordings` | EXISTING `CLAIM` | Every recording on this phone, exactly as it was made | `.default`; also true on a new phone (no count of what is elsewhere) | - | NS-11 unhappy "some recordings not here" |
| `export.screen.includesPictures` | PROPOSED `CLAIM` | Every picture you added, as its stored copy | `.default`, photos on | - | NS-11-R10; NS-01-R14 |
| `export.screen.includesBook` | CHANGED (PROPOSED) | The book to read on screen, for each child, by month | `.default` | - | C28; DESIGN G8 ("Printable" only for C28's file) |
| `export.screen.includesData` | EXISTING | A data file with your words as heard, every small fix, and the final text | `.default` | - | NS-12 (versions not exported by default) |
| `export.screen.offlineNote` | CHANGED (PROPOSED) `CLAIM` | It is made on this phone and goes only where you send it. | `.default`, after the lead | - | NS-11 door "we never learn the destination" (today's words, without "export") |
| `en.settings.export.button` | CHANGED (PROPOSED) | Save a copy | primary, bottom third, 56 pt | VC "Save a copy" / hint "Makes the copy, then lets you choose where it goes." | NS-11 design inputs |
| `en.settings.export.preparing` | EXISTING | Gathering every letter. This can take a minute. | `.running` (within 500 ms) | announced at start | NS-11-R24 |
| `export.screen.packing` / `checking` | EXISTING | Packing your letters / Checking every file | `.running` phase line | polite live region; progress value read as text | NS-11-R9 |
| `export.screen.progressA11y` | CHANGED (PROPOSED) | Copy progress | `.running` | label of the progress bar | NS-11 VO row |
| `export.screen.lowPower` | PROPOSED | This may take a little longer while Low Power Mode is on. | `.lowPower` (Low Power Mode or battery under 20%), muted line above the button | read once | NS-11-R17; C28-14 (one line for both screens) |
| `export.screen.cancelButton` | EXISTING | Stop | `.running` | VC "Stop" | NS-11-R9 |
| `en.settings.export.ready` | CHANGED (PROPOSED) | Your copy is ready. | `.ready` heading | announced at finish | NS-11 VO row |
| `export.screen.privacyNotice` | CHANGED (PROPOSED) `CLAIM` | This copy is as private as the place you keep it. | `.default` and `.ready` | - | NS-11 door "as private as where you put it"; DATA-REQ-056 |
| `export.screen.shareButton` | EXISTING | Save or share | `.ready` | VC "Save or share" / hint "Opens the share sheet." | NS-11 happy path 3 |
| `export.screen.afterShare` | CHANGED (PROPOSED) | Saved. The copy on this phone has been cleared away. | `.saved` (the share sheet reported completion, G4) | announced | NS-11-R3, R23 |
| `export.screen.notSaved` | PROPOSED | Not saved. You can make the copy again any time. | `.cancelled` (share cancelled, or the destination refused) | announced | NS-11-R16 |
| `export.screen.shareFailed` | PROPOSED | That did not go through. Save or share again. | `share_failed`, back on `.ready` (C-S04 and C-S05) | announced | DESIGN eng 4.2 |
| `export.screen.cancelled` | CHANGED (PROPOSED) | Stopped. No copy was made. | `.stopped` | announced | NS-11-R9 (not "Nothing was saved", which could read as letters not saved; the same reason today's key gives) |
| `export.screen.stoppedByClose` | PROPOSED | The last copy stopped when the app closed. No copy was made. | `.stopped-by-close` | read on open | NS-11-R9, R23 |
| `en.settings.export.button` | CHANGED (PROPOSED, row above) | Save a copy | `.stopped`, `.stopped-by-close`, `.cancelled`: the same primary | VC "Save a copy" | NS-11-R9 |
| `export.screen.failedTitle` | CHANGED (PROPOSED) | The copy did not finish | `.error-other` | title, no full stop | NS-11 "failed" row |
| `export.screen.failedBody` | CHANGED (PROPOSED) | Nothing was left half-made. Your letters and recordings are all still here. | `.error-other` | - | NS-11-R9 |
| `en.common.tryAgainButton` | EXISTING | Try again | `.error-other`, `.error-lowSpace` | VC "Try again" | - |
| `export.screen.lowSpaceBody` | EXISTING | This phone needs more free space first. | `.error-lowSpace` | - | NS-11-R20 |
| `export.screen.needsSpace` | PROPOSED | This needs about {size} of free space on this phone. | `.error-lowSpace`, second line, when the size is known (E11) | - | NS-11-R20; C28 4.5 row 1 |
| `export.screen.openStorageButton` | PROPOSED | Open Storage | `.error-lowSpace`; C-S05 disk full | VC "Open Storage" | DESIGN U3 |
| `export.screen.tooBigTitle` + `en.settingsHome.helpValue` | EXISTING | This book is too big for one file / Write to us | `.error-tooBig` | - | as built |
| `export.screen.emptyNote` | CHANGED (PROPOSED) | You can save a copy once the book has a letter. | `.empty`, above the button | read before the button | NS-11 "Empty" (`exportEmpty`) |
| `en.settings.export.lastExport` | CHANGED (PROPOSED) | Last prepared {date} | `.default` | - | D-085 (the date a copy was made, not proof it was saved; G4) |
| `en.settings.export.neverExported` | CHANGED (PROPOSED) | No copy made yet | `.default`, never made | - | D-085 |
| `auth.newPhone.declinedNothingHere` | PROPOSED `CLAIM` | There is nothing on this phone to copy yet. Your letters are in your account, and recordings and pictures are on the phone that made them. | `.nothingHere` (from C-S11.declined) | - | NS-10-R4b |

`.newPhone`: no extra line; "Every recording on this phone" is already true and counts nothing (DESIGN U10). `.lapsed`, `.signedout`, `.second-account`, `.killswitch`: the same words.

Removed on purpose: today's `privacyNotice` ("This file holds your letters and recordings, unlocked. Keep it somewhere private.") is replaced by the card's door line, which says the same with no list to keep in step with pictures. "Unlocked" stays in the README, which already says it.

Not words: the share sheet's own errors (Files or iCloud Drive full) are Apple's; on return the screen shows `.cancelled` (NS-11-R16). App lock asks first with the system's own words (built `confirmForExport`).

Kill switch, plan lapse, signed out: the screen is the same (NS-11-R12, R21; export is never paused, LEGAL-REQ-040).

Follow-on sweep, PROPOSED so every door to C-S04 says the same name (one concern, one PR, after the founder approves "Save a copy"):

| Key | Today | Proposed |
|---|---|---|
| `accountDeletion.exportFirst.heading` | Keep a copy first | Save a copy first |
| `accountDeletion.exportFirst.body` | Export everything, free: the book as a PDF, your letters as text and your recordings. | Save a copy of everything, free: the book as a PDF, your letters as text, your recordings and your pictures. |
| `accountDeletion.exportFirst.button` | Export everything | Save a copy |
| `en.settings.erase.exportButton` | Export your book | Save a copy |
| `en.settings.delete.bookExportFirst` | You can export everything first, free. | You can save a copy first, free. |
| `en.settings.about.beta.exportCta` | Export a copy | Save a copy |

---

## C-S05. Making the printable book (PDF) (NS-07 C28)

| Key | Status | Text | State | VO / VC | Card row |
|---|---|---|---|---|---|
| `export.printable.sectionTitle` | PROPOSED | Printable book (PDF) | C-S04 section heading, flag on (DESIGN: `EXPO_PUBLIC_PRINT_BOOK`; card: `EXPO_PUBLIC_PRINT_READY`); absent when no book has a kept letter | heading | C28-1 |
| `export.printable.optionHelp` | PROPOSED | A PDF of one book with its pictures, laid out for paper. Free. | C-S04, under the section heading | read after the heading | C28-1; C28 claims "A free printable PDF of the book." |
| `en.children.switcher.label` | EXISTING | For {child} | C-S04 rows, one per book; one book: the row reads `sectionTitle` | VC "{child}" or "Printable book" / hint "Makes a printable PDF of this book." | C28 happy path 1 |
| `export.printable.rowA11yHint` | PROPOSED | Makes a printable PDF of this book. | VO hint on each row | - | C28 VO row |
| `export.printable.makingTitle` | PROPOSED | Making your book | C-S05 `.making` heading (within 500 ms) | announced at start | C28-9 |
| `export.printable.progressA11y` | PROPOSED | Printable book progress | C-S05 `.making` | progress label with a text value | C28 VO row |
| `export.screen.lowPower` | PROPOSED (shared, C-S04) | This may take a little longer while Low Power Mode is on. | C-S05 `.low` (Low Power Mode) | read once | C28-14 |
| `export.screen.cancelButton` | EXISTING | Stop | C-S05 `.making` | VC "Stop" | C28 "parent cancels" (back to C-S04, no line) |
| `export.printable.ready` | PROPOSED | Your printable book is ready. | C-S05 `.ready` heading | announced at finish | C28 VO row |
| `export.screen.shareButton` | EXISTING | Save or share | C-S05 `.ready` | VC "Save or share" | C28-12 |
| `export.screen.shareFailed` | PROPOSED (shared, C-S04) | That did not go through. Save or share again. | C-S05 `.error-share_failed` | announced | DESIGN U10 |
| `export.printable.failedTitle` | PROPOSED | The printable book was not made | C-S05 `.error-print_pdf_failed` (also `pdf_render_failed`, `font_missing`) | title, no full stop | C28 "Failed" |
| `export.printable.failedBody` | PROPOSED | No file was kept. Try again when you are ready. | C-S05 `.error-print_pdf_failed` | - | C28-11 |
| `en.common.tryAgainButton` | EXISTING | Try again | C-S05 errors | VC "Try again" | C28 "Failed" |
| `export.screen.lowSpaceBody` + `needsSpace` | EXISTING + PROPOSED (shared, C-S04) | This phone needs more free space first. / This needs about {size} of free space on this phone. | C-S05 `.error-print_pdf_disk_full` | - | C28 4.5 row 1 |
| `export.screen.openStorageButton` | PROPOSED (shared, C-S04) | Open Storage | C-S05 `.error-print_pdf_disk_full` | VC "Open Storage" | DESIGN U1 |
| `en.tonight.copySlip.chooserTitle` | PROPOSED (shared, C-S07) | Which book? | C-S07 when two or more books | heading | C28 "Two books" |

Stop and a kill while making show no line on return (DESIGN U3, U5: nothing was promised).

The PDF itself (C28 design inputs; app words only, unsigned, never in the letter's type):

| Key | Status | Text | Where | Card row |
|---|---|---|---|---|
| `export.pdf.coverSubtitleAll` | EXISTING | Letters to {child} | title page | C28-2 |
| `book.signature` (`en.book.signature`) | EXISTING | From {signsAs} | title page and each letter | C28 design inputs |
| `en.book.chapterTitle` | EXISTING | Month {month} | month headings | C28-2 |
| `en.book.chapterNewborn` | EXISTING | The first weeks | first heading | C28-2 |
| Before You heading | EXISTING (B area key) | Before You | expecting parent's letters | C28 "Expecting parent" |

Never on any page or in the option: a price, "order", a partner, a page count, "pages left", empty months, a quality note on a small picture, a word for a sealed or quiet day (C28-2, C28-4, C28-5, C28-8).

---

## C-S06 and C-S07. Home slip in the birthday week, and the twins chooser (NS-11)

| Key | Status | Text | State | VO / VC | Card row |
|---|---|---|---|---|---|
| `en.tonight.copySlip.body` | PROPOSED | Save a copy of {child}'s year, yours to keep. | C-S06 `.default` | one element: label = the line / hint `copySlip.openA11yHint`; custom action "Not now" | NS-11-R2, R4; claims row |
| `en.tonight.copySlip.bodyTwo` | PROPOSED | Save a copy of the year for {a} and {b}, yours to keep. | C-S06 `.twins` (same birthday); leads straight to C-S04 (DESIGN G3) | as above | NS-11-R14 |
| `en.tonight.copySlip.openA11yHint` | PROPOSED | Opens Save a copy. | VO hint on the slip | - | NS-11 VO row |
| `en.common.notNowButton` | EXISTING | Not now | C-S06 quiet text button and custom action; gone for this year | VC "Not now" / hint `copySlip.dismissA11yHint` | NS-11-R3 |
| `en.tonight.copySlip.dismissA11yHint` | PROPOSED | Hides this until next year. | hint on Not now | - | NS-11-R3 |
| `en.tonight.copySlip.chooserTitle` | PROPOSED | Which book? | C-S07 sheet title (the printable book with two or more books; the twins slip only if the founder keeps a chooser, G3) | heading | NS-11-R14; C28 |
| `en.children.switcher.label` | EXISTING | For {child} | C-S07 rows (name only, no counts) | VC "{child}" | NS-11-R14 |
| `en.common.cancelButton` | EXISTING | Cancel | C-S07, top leading | VC "Cancel" | - |

The whole card is the tap, so there is no separate "Save a copy" button key on the slip. `.dismissed`, `.quiet`, `.expecting`, `.flagOff`, `.second-account`: no slip, so no words (R3, R7, R8, R22). Two birthdays in one week: one slip, the earlier first (R15). Leap day: same words (R13). No notification exists for this slip (NS-11 "What").

---

## C-S08. Where your letters live (NS-08-R7, R8; NS-01-R32; NS-10 claims)

Every line here is `CLAIM`. NS-01-R32 checks that these keys name pictures "given photos on in any build"; the test reads the key text, so the words change when the first build with photos on is cut, for every build (Card gaps, 4). Until then today's words stand.

| Key | Status | Text | State | Card row |
|---|---|---|---|---|
| `en.whereLive.title` | EXISTING | Where your letters live | title | - |
| `en.whereLive.onPhoneTitle` | EXISTING | On this phone | section | - |
| `en.whereLive.onPhone` | CHANGED (PROPOSED) | Your letters, recordings and pictures are kept on this iPhone. | servers off, or sync off | NS-01-R32 |
| `en.whereLive.onPhoneSynced` | CHANGED (PROPOSED) | Your letters are kept on this iPhone and on our servers. Your recordings and pictures are kept on this iPhone. | sync on, backup off | NS-01-R32; NS-08-R7 |
| `en.whereLive.newPhoneTitle` | EXISTING | If you get a new phone | section | NS-10 |
| `en.whereLive.newPhoneBody` | PROPOSED | The words of your letters come with you when you sign in. Recordings and pictures are kept on the phone that made them. | sync on, backup off | NS-10 claims; NS-08-R7 |
| `en.whereLive.iphoneBackup.title` | EXISTING | iPhone backup | section | - |
| `en.whereLive.iphoneBackup.body` | CHANGED (PROPOSED) | Includes your recordings and pictures, if iCloud Backup is on. | `.default` | NS-01-R32 (the stored copy is backed up; list and page copies are not, and need not be named) |
| `en.whereLive.iphoneBackup.howTo` / `howToHint` | EXISTING | How to check / Opens Apple's help page. | link | - |
| `en.whereLive.exportEmpty` | EXISTING | Save a copy any time. | never exported | NS-11 |
| `en.settings.export.lastExport` | EXISTING | Last export: {date} | exported before | D-085 |
| `en.whereLive.keepLine` | PROPOSED `CLAIM` | Two copies of your recordings are in your hands: one you make with Save a copy, and your iPhone's own iCloud Backup, if it is on. | `.default`, footer of "If you get a new phone" (DESIGN G1: said in one place, always) | NS-08-R8 (one line, both real copies, no fear word) |
| `en.whereLive.backupTitle` / `backupLater` | EXISTING, not shown | Encrypted backup / Not in this version | removed while backup is off (DESIGN G9: reads as a promise of a later version); returns at `.flip` with On or Off | NS-08-R7 |
| `en.whereLive.footer` | EXISTING | An export is a copy to open and keep. We hold no copy. | footer | CPrivO-4 |

The same facts on Settings, Privacy and the Recordings card, changed with the keys above:

| Key | Status | Text | Card row |
|---|---|---|---|
| `en.settings.privacy.keptOnPhone` | CHANGED (PROPOSED) | Your letters, recordings and pictures are kept on this phone. They are not sent to us. | NS-01-R32 |
| `en.settings.privacy.keptSynced` | CHANGED (PROPOSED) | Your letters are kept on this phone and on our servers, so they reach your other devices. Your recordings and pictures are kept on this phone. | NS-01-R32 |
| `en.settings.privacy.iphoneBackup` | CHANGED (PROPOSED) | Includes your recordings and pictures, if iCloud Backup is on. | NS-01-R32 |
| `en.settings.recordings.onPhoneBody` | CHANGED (PROPOSED) | Recordings and pictures are kept on this phone and in your iPhone's own backup, if you use one. Save a copy any time to keep one of your own. | NS-01-R32 |
| `en.settings.recordings.onPhoneBodyBackupOff` | CHANGED (PROPOSED), flip build only | Recordings and pictures are kept on this phone and in your iPhone's own backup, if you use one. Our encrypted backup can keep the recordings too, so they come back on a new phone. | NS-01-R32; NS-08 (pictures are never uploaded) |
| `auth.sheet.bodies.settings`, `.first_letter`, `auth.account.signedOutBody`, `auth.claim.recordingsNote` | EXISTING, registered | ... Recordings are kept on the phone that made them. | not changed here: registered text is counsel's. Ask `legal` whether a pictures variant ("Recordings and pictures are kept on the phone that made them.") goes to counsel with the R32 set |

The keep-safe card of C-REQ-018 Rev has no key on `develop` (searched `packages/content/src` and `apps/mobile/src`); `whereLive.keepLine` is the proposed one line (Card gaps, 5).

---

## C-S09. Letter page: where the recording is (NS-08 design inputs, R20; NS-10-R1)

Four states, each with its own text and its own spoken phrase, never told by colour or icon alone. Small muted note style, never the letter's serif.

| Key | Status | Text | State | VO | Card row |
|---|---|---|---|---|---|
| `en.book.recordingOnPhone` | EXISTING `CLAIM` | Recording kept on this phone | `.onPhone` | the whole provenance line as one phrase, e.g. "Spoken, with small fixes. Recording kept on this phone." | NS-08 state 1 |
| `en.book.recordingBackedUp` | EXISTING `CLAIM`, flip only | Recording kept on this phone and backed up | `.backedUp`, only after the server confirms | as above | NS-08 state 2; "Slow" row |
| `en.book.recordingArriving` | PROPOSED, flip only | Recording on its way to this phone | `.arriving` | as above | NS-08 state 3; unhappy row 3 |
| `en.book.recordingNotHere` | PROPOSED `CLAIM` | Recording not on this phone | `.notHere` (today on a new phone; same words as `export.reader.recordingNotHere`); no play button | as above | NS-08 state 4; NS-10-R1 |
| `en.book.recordingElsewhere` | EXISTING | Recording kept on {signsAs}'s phone | `.otherParent` | as above | D-059; DESIGN G12 |
| `features.player.notOnPhone` | EXISTING | The recording for this letter is not on this phone. | Read together reaching a `.notHere` letter | announced | NS-08 "never backed up" row, no blame |

Typed letters carry no recording clause (built). Why `.notHere` does not say "kept on the phone that made it": the old phone may be gone, and the card asks for the truth without blame. "Not on this phone" is true in every case.

---

## C-S10, C-S11, C-S12. A new phone (NS-10)

| Key | Status | Text | State | VO / VC | Card row |
|---|---|---|---|---|---|
| `auth.newPhone.loading` / `loadingBody` | EXISTING | Opening your book. / Your letters are coming across. | C-S10 `.opening` (up to 10 s) | read as one, once | NS-10 happy 3 |
| `auth.newPhone.slowTitle` / `slowBody` | EXISTING | Your book is taking a while. / Check your connection, then try again. | C-S10 `.offline` when a pull stalls | - | NS-10 "Failed" |
| `auth.newPhone.offlineTitle` + `auth.offline.body` | EXISTING | Opening your book needs a connection. / Connect to the internet, then tap Try again. | C-S10 `.offline` | - | NS-10 "No network" |
| `auth.outage.retry` | EXISTING | Try again | C-S10 `.offline` | VC "Try again" | NS-10 |
| `auth.newPhone.needsConsentBody` | PROPOSED | Finish setting up to open your book here. | C-S10 `.held` (BL-922) | read before the two actions | NS-10-R0 |
| `auth.account.finishSetup` | EXISTING | Finish setting up | C-S10 `.held`, primary | VC "Finish setting up" | NS-10-R0 |
| `auth.consent.noBook.tryAnother` | EXISTING | Try another way | C-S10 `.held` quiet; `.noBook`; `.wrongAccount` primary (signs out, then back to sign-in) | VC "Try another way" | NS-10-R0, R12 |
| `auth.account.signedInWith.*` | EXISTING | Signed in with Apple / Signed in with Google / Signed in with email | C-S10 `.wrongAccount`, the method line | read first | NS-10-R12 (names the method, never the address; no `{method}` placeholder needed) |
| `auth.newPhone.wrongAccountBody` | PROPOSED | Is this the account you used before? If not, try another way. | C-S10 `.wrongAccount` | - | NS-10 "Wrong account" |
| `auth.newPhone.startHereButton` | PROPOSED | Start a book here | C-S10 `.wrongAccount`, quiet | VC "Start a book here" | DESIGN U6 |
| `auth.consent.noBook.title` / `body` / `startBook` | EXISTING | No book here yet / Did you use a different way to sign in last time? / Start a book | C-S10 `.noBook` | - | NS-10 "truly no book" (not loss words) |
| `accountDeletion.scheduled.heading` / `body` / `cancelButton` | EXISTING | Deletion scheduled / Your account will be deleted on {date}. You can cancel any time before then, here or by signing in again. / Cancel deletion | C-S10 `.deletedElsewhere` while the 30 days run | - | NS-10-R9 (a plain line, no error code) |
| `accountDeletion.open.executingTitle` + `executing` | EXISTING | Deletion in progress / Your account is being deleted now. This can take up to a day. | C-S10 `.deletedElsewhere` once deletion runs | - | NS-10-R9 |
| `auth.newPhone.backToStartButton` | PROPOSED | Back to start | C-S10 `.deletedElsewhere` | VC "Back to start" | DESIGN U7 |
| `auth.newPhone.arrivedPlain` | EXISTING | Your book is here. | first Book after arrival | read once | NS-10 |
| `en.book.newPhoneLine.body` | PROPOSED `CLAIM` | The words of your letters are here. Recordings and pictures are kept on the phone that made them. | C-S12 `.default`, backup off, photos on; once per phone and account until closed | read once in list order | NS-10-R13 |
| `en.book.newPhoneLine.bodyNoPictures` | PROPOSED `CLAIM` | The words of your letters are here. Recordings are kept on the phone that made them. | C-S12 `.default`, photos off | as above | NS-10-R13 |
| `en.common.closeButton` | EXISTING | Close | C-S12 close (X glyph, 44 pt) | VO "Close" / hint "Hides this line." ; VC "Close" | NS-10-R13 |
| `en.book.newPhoneLine.closeA11yHint` | PROPOSED | Hides this line. | VO hint on Close | - | NS-10-R13 |
| `en.book.newPhoneLine.moreComing` | PROPOSED | More letters are on their way. | C-S12 `.arriving` after 10 s; no close button | read once | NS-10-R2 (no count) |
| `auth.consent.terms.*` | EXISTING, registered | (the consent sheet, Agree and Not now) | C-S11 `.default` | - | NS-10 door lines |
| `auth.newPhone.declinedTitle` | PROPOSED | Your book stays in your account | C-S11 `.declined` heading, no full stop | heading | NS-10 door "Decline" |
| `auth.newPhone.declinedBody` | PROPOSED `CLAIM` | Nothing comes to this phone until you agree. You can still save a copy or delete your account here. | C-S11 `.declined` | read before the actions | NS-10-R4a, R4b |
| `auth.newPhone.readAndAgreeButton` | PROPOSED | Read and agree | C-S11 `.declined`, primary (reopens the sheet) | VC "Read and agree" | NS-10 |
| `en.settingsHome.exportLabel` | CHANGED (PROPOSED, C-S01) | Save a copy | C-S11 `.declined` (DESIGN's "Save a copy of what is on this phone" is 36 characters; buttons stop at 22) | VC "Save a copy" | NS-10-R4b; DESIGN G13 |
| `en.settingsHome.deleteAccountLabel` | EXISTING | Delete account | C-S11 `.declined` | VC "Delete account" | NS-10-R4a |
| `auth.account.signOut` | EXISTING | Sign out | C-S11 `.declined` | VC "Sign out" | NS-10 |

Kill switch at sign-in (NS-10-R8): the local book shows; no held screen, so no words. Second account (R3, R5): the claim screen never offers A's letters; existing `auth.claim.*` words apply only to B's own.

Banned here and checked: lost, missing, everything moved, recordings move, nothing is ever lost.

---

## C-S13 and C-S14. Earlier versions (NS-12, D8)

Author only. The row is absent, not disabled, with fewer than two versions.

| Key | Status | Text | State | VO / VC | Card row |
|---|---|---|---|---|---|
| `en.book.versions.rowLabel` | PROPOSED | Earlier versions | "This letter" list row (B-S08) | VC "Earlier versions" / hint `versions.rowA11yHint` | NS-12-R1 |
| `en.book.versions.rowA11yHint` | PROPOSED | Shows the words this letter had before. | VO hint | - | NS-12-R1 |
| `en.book.versions.title` | PROPOSED | Earlier versions | C-S13 title | heading | NS-12-R1 |
| `en.book.versions.keptLine` | PROPOSED `CLAIM` | Earlier versions of your words are kept until you remove them. Exactly what you said stays with the letter either way. | C-S13 `.default`, under the title | read after the heading | NS-12-R7; D8 (the words as heard are never removed) |
| `en.book.versions.rowDate` | PROPOSED | {date} | each row, newest first; `{date}` is the long date and time from `Intl.DateTimeFormat` ("November 12, 9:14 PM") | "{date}. Earlier version." / hint "Opens it." | NS-12-R1 (dates only) |
| `en.book.versions.showAllButton` | PROPOSED | Show all | after 20 rows | VC "Show all" | NS-12-R4 |
| `en.book.versions.loading` | PROPOSED | Finding earlier versions | C-S13 `.loading` after 1 s | announced | NS-12 "Slow" |
| `en.book.versions.offlineNone` | PROPOSED | Earlier versions show when this phone is online. | C-S13 `.offlineNone` (offline, kill switch, signed out, none on the phone) | - | NS-12 "Offline", kill switch |
| `en.book.versions.failed` | PROPOSED | Earlier versions did not open. The letter's words have not changed. | C-S13 `.error-fetch_failed` | - | NS-12 "Failed" |
| `en.common.tryAgainButton` | EXISTING | Try again | C-S13 `.error-fetch_failed` | VC "Try again" | NS-12 |
| `en.book.versions.viewTitle` | PROPOSED | Words from {date} | C-S14 `.default` heading | heading | NS-12 happy 3 |
| `en.book.versions.restoreButton` | PROPOSED | Use these words | C-S14, primary; no confirm (DESIGN G11) | VC "Use these words" / hint `versions.restoreA11yHint` | NS-12-R2 |
| `en.book.versions.restoreA11yHint` | PROPOSED | Makes these the letter's words. The words there now become an earlier version. | VO hint | - | NS-12-R2 |
| `en.book.versions.restoredToast` | PROPOSED | These words are back. The words before are in Earlier versions. | after Restore; no action, so T4 does not apply | announced | NS-12-R2 |
| `en.book.versions.removeButton` | PROPOSED | Remove this version | C-S14, destructive text button | VC "Remove this version" / hint `versions.removeA11yHint` | NS-12-R6 |
| `en.book.versions.removeA11yHint` | PROPOSED | Removes this earlier version. | VO hint | - | NS-12-R6 |
| `en.book.versions.removeTitle` | PROPOSED | Remove this version? | C-S14 `.confirm` | read first | D8 |
| `en.book.versions.removeBody` | PROPOSED `CLAIM` | It is removed here and from your account. The letter keeps the words it has now. This cannot be undone. | confirm | read second | NS-12-R6 |
| `en.book.versions.removeConfirm` | PROPOSED | Remove | C-S14 `.confirm`, second, never the default | VC "Remove" | D8 |
| `en.settings.delete.keepButton` | EXISTING | Keep it | confirm, first and default | VC "Keep it" | D-085 pattern |
| `en.book.versions.removedToast` | PROPOSED | Version removed. | after Remove | announced | NS-12-R6 |
| `en.book.versions.removeQueued` | PROPOSED | Removed here. It leaves your account when this phone is next online. | after Remove offline | announced | NS-12 "Offline" (ops queue) |

Why "Use these words" and not "Restore": the card's word is intent; "Restore" already means bringing back a deleted letter in Recently deleted, and a parent could read it as undoing a deletion. Never "original" for any version (NS-12 design inputs). The current words are not in the list (only earlier versions can be removed). The remove confirm does not say "cannot be brought back" (DESIGN's intent): `removeBody` already ends "This cannot be undone.", the house wording (`settings.erase.confirmBody`).

Second account, co-parent (R8): no row, no words.

---

## C-S15 and C-S16. A book in Me: Quiet this book, Hide this book; Hidden books (NS-22, F12-REQ-011)

NS-22 content inputs name `children.quiet.*` keys; none exists on `develop` (`setChildQuiet` has no screen). Proposed below (Card gaps, 6).

| Key | Status | Text | State | VO / VC | Card row |
|---|---|---|---|---|---|
| `en.children.settings.title` | EXISTING | {child}'s book | C-S15 title | heading | - |
| `en.children.quiet.label` | PROPOSED | Quiet this book | C-S15 switch row (`.default` off, `.quiet` on), directly above Hide; B-S02 end menu item | VO "Quiet this book, switch, off" (system state) / hint `quiet.a11yHint`; VC "Quiet this book" | NS-22-R3 |
| `en.children.quiet.a11yHint` | PROPOSED | Pauses reminders and Home cards for this book. | VO hint | - | NS-22-R3 |
| `en.children.quiet.body` | PROPOSED | No reminders, messages or Home cards for {child}'s book until you turn this off. Nothing in the book changes. | C-S15 footer under the switch | read after the row | NS-22; NS-32-R14; NS-23-R8; NS-11-R8 |
| `en.children.quiet.offButton` | PROPOSED | Turn off Quiet | B-S02 end menu item while quiet (Me uses the switch) | VC "Turn off Quiet" | NS-22-R7 (Card gaps, 6: "Unquiet") |
| `en.children.quiet.failed` | PROPOSED | That did not change. Try again. | C-S15 `.error-quiet_write_failed`, one line under the switch, which returns to its old position | announced | NS-22 "Failed" (E7) |
| `en.book.header.moreA11y` | PROPOSED | More for this book | Book end menu button (icon) | VO label; VC name "More" (`en.book.header.moreVc`, PROPOSED "More") | NS-22 content inputs |
| `en.children.settings.hideLabel` | EXISTING | Hide this book | C-S15 (two or more books, DESIGN G6), end menu; the confirm's title | VC "Hide this book" | NS-22-R3 |
| `en.children.settings.hideBody` | EXISTING | Hiding {child}'s book quiets every reminder and message about {child}. Nothing is deleted. | C-S15 and the Hide confirm body | - | F09 |
| `en.common.cancelButton` | EXISTING | Cancel | Hide confirm, first | VC "Cancel" | as built |
| `en.children.settings.hideShared` | EXISTING | Hiding is only for you. {coParent} still sees {child}'s book as before. | C-S15 with a co-parent | - | B-REQ-014 Rev |
| `en.children.settings.showButton` | EXISTING | Show this book again | C-S16, hidden book menu | VC "Show this book again" | NS-22 "hidden book" |
| `en.children.settings.hiddenTitle` / `hiddenEmpty` | EXISTING | Hidden books / No hidden books. | C-S16 | - | F09 |
| `en.children.settings.hiddenReadOnly` | PROPOSED | This book is hidden. You can read it, and show it again any time. | a hidden book opened from Hidden books | read after the title | NS-22 "hidden book" (F09-REQ-016 read-only) |
| `en.settings.delete.deleteBookRow` | EXISTING | Delete this book | C-S15 | - | F17 |

No toast when Quiet changes (DESIGN J-C10: the switch is the feedback; VoiceOver reads its new state). Banned and checked: no loss word near Quiet (NS-22 section 17: a parent's tool on a hard day). DESIGN's footer intent said "birthday notes"; "note" is only ever something a person makes (BRAND.md glossary), so the footer says "messages".

---

## C-S17. Recently deleted (NS-21-R7b, NS-36-R1a to R1c, NS-06-B25)

| Key | Status | Text | State | Card row |
|---|---|---|---|---|
| `en.settings.delete.recentlyDeleted` / `shelfHelp` / `shelfEmpty` | EXISTING | Recently deleted / Letters you delete wait here for 30 days. / No deleted letters. | title, help, `.empty` | NS-21-R7b |
| `en.settings.delete.deletedOn` / `erasesOn` | EXISTING | Deleted {date} / Kept here until {date} | each row | D-085 |
| `en.settings.delete.sealedRow` | PROPOSED | A letter hidden until {date} | `.sealed`: the chosen day, no words (B-S22 draws the row; reconcile the key with area B) | NS-06-B25; NS-36 "sealed letter deleted" |
| `en.settings.delete.bookCardTitle` / `restoreBookButton` / `bookRestoredToast` | EXISTING | {child}'s book / Restore the book / {child}'s book is back. | `.book` | F17 |
| `en.settings.delete.restoreButton` / `restoredToast` / `restoredToastNoName` / `openButton` | EXISTING | Restore / Back in {child}'s book. / Back in the book. / Open | restore (picture, first and seal return with it) | NS-36-R1b; NS-01-R16b |
| `en.settings.delete.eraseNow` / `eraseNowTitle` | EXISTING | Erase now / Erase this letter now? | - | D-085 |
| `en.settings.delete.eraseNowBody` | CHANGED (PROPOSED) `CLAIM` | The letter, its recording and its picture are erased for good. | letter with a picture | NS-36-R1c |
| `en.settings.delete.eraseNowBodyNoPicture` | PROPOSED | The letter and its recording are erased for good. | letter without a picture (today's words) | as built |
| `en.settings.delete.erasedToast` / `eraseFailedToast` | EXISTING | Letter erased. / The letter was not erased. It is still in Recently deleted. | after Erase now | NS-36 "failed delete" |
| `en.settings.delete.entryTitle` / `entryBody` / `entryConfirm` / `keepButton` / `entryToast` | EXISTING | Delete this letter? / It waits in Recently deleted for 30 days. / Delete letter / Keep it / Letter deleted. | the delete confirm (B area screen, words shared) | NS-36 door "Delete" |
| `en.reader.notFoundDeleted` / `openShelfButton` | EXISTING | It is in Recently deleted. / Open Recently deleted | a letter deleted on another phone | NS-21 |

VO for a sealed row: "A letter hidden until {date}. Deleted {date}." No words of the letter, ever (NS-06-B2).

---

## C-S18. Storage: a recording still on this phone (NS-09-R6)

| Key | Status | Text | State | VO / VC | Card row |
|---|---|---|---|---|---|
| `features.packs.title` | EXISTING | Storage | title | heading | - |
| `en.storage.stuckOne` | PROPOSED `CLAIM` | One recording is still on this phone. | `.stuck` (after 3 launches), one line per recording | read with the button | NS-09-R6 |
| `en.storage.removeNowButton` | PROPOSED | Remove now | `.stuck` | VC "Remove now" / hint "Tries again to remove this recording." | NS-09-R6 |
| `en.storage.recordingsTitle` | PROPOSED | Recordings | `.stuck` group heading, first in Storage, only while a stuck recording exists | heading | NS-09-R6 |
| (same line, no change) | - | One recording is still on this phone. | `.stuckAgain` | - | NS-09 "Remove now fails again" (no error word) |
| `en.review.letGoPending` (A area screen; BL-925 key, owned by `content`) | PROPOSED `CLAIM` | That recording is still on this phone. The app will finish removing it. | Review, once per take | announced after the screen settles | BL-925; NS-09-R4a, R4b |

Banned and checked: failed, error, deleted everywhere, instantly. The BL-925 line avoids "we" (the card's intent said "We will finish removing it"; `rules.test.ts` holds "we" to the sanctioned promises).

---

## C-S19. Erase everything on this phone (D1, NS-36, NS-01-R52)

| Key | Status | Text | State | Card row |
|---|---|---|---|---|
| `en.settings.erase.title` / `heading` | EXISTING | Erase everything on this phone / What is erased | `.default` | - |
| `en.settings.erase.body` | CHANGED (PROPOSED) `CLAIM` | This removes every book, letter, recording and picture from this iPhone, and your settings. We hold no copy. | `.default` on a phone that never signed in (where "We hold no copy" is true) | NS-36 "Erase everything"; NS-01-R52 |
| `en.settings.erase.bodySynced` | PROPOSED `CLAIM` | This removes every book, letter, recording and picture from this iPhone, and your settings. Letters saved to an account stay in that account until it is deleted. | `.signedoutSynced` (signed out on a phone that synced; DESIGN G2, E1) | audit finding, below |
| `en.settings.erase.signedIn` | CHANGED (PROPOSED) | This phone is signed in. Sign out first, or delete your account in Me. | `.signedin` (deep link) | Me replaced Settings as the place (NX-30a) |
| `en.settings.erase.onThisPhone` | EXISTING | This happens on this phone only. Nothing is sent anywhere. | `.default` | as built |
| `en.settings.erase.backups` | EXISTING | Exports you already saved, and backups of this phone such as iCloud Backup, are not changed. | `.default` | pages "What stays" |
| `en.settings.erase.exportFirst` / `exportButton` | EXISTING / CHANGED (PROPOSED, C-S04 sweep) | Save a copy first? / Save a copy | `.default` | NS-11 |
| `en.settings.erase.button` / `confirmTitle` / `confirmBody` / `confirmButton` / `back` | EXISTING | Erase everything / Erase everything on this phone? / This cannot be undone. / Erase / Keep everything | confirm | - |
| `en.settings.erase.busy` / `doneA11y` / `failed` | EXISTING | Erasing / Everything on this phone is erased. / Erasing did not finish. ... | `.loading`, done, `.error` | - |

Audit finding (claims): today's `erase.body` ends "We hold no copy." That is true on a phone that never signed in (the only phone that sees the row today), and false on a signed-out phone whose letters synced, which is where DESIGN G2 and the D1 sign-out line send the parent. `bodySynced` says what is true there. "Every book" includes a book another account left on this phone (J-C05); the line names no account, so B learns nothing about A. For `legal` (claims registry).

---

## C-S20. Delete account (D6, NS-01-R31, NS-10-R4a)

In-app sheet (`accountDeletionCopy`; this surface bans "photos" and allows "we" only in `what.intro` and `what.deletedFamily`):

| Key | Status | Text | State | Card row |
|---|---|---|---|---|
| `accountDeletion.what.intro` | EXISTING `CLAIM` | Deleting your account removes your letters and books from our servers. You have 30 days to change your mind. | step 1 | - |
| `accountDeletion.what.sealed` | PROPOSED `CLAIM` | Letters you hid until a day are deleted too, even if their day has not come. They will not open for anyone. | step 1, only when the account holds one | D6; NS-06-B18 |
| `accountDeletion.what.recordingsAndPictures` | PROPOSED `CLAIM` | Your recordings and pictures are on the phone that made them, not in your account. After you sign out, Erase everything on this phone removes them. | step 1, backup off, photos on | NS-01-R31 |
| `accountDeletion.what.recordingsOnly` | PROPOSED `CLAIM` | Your recordings are on the phone that made them, not in your account. After you sign out, Erase everything on this phone removes them. | step 1, backup off, photos off | NS-08-R7 |
| `accountDeletion.what.onThisPhone` | EXISTING `CLAIM` | On this phone, your letters stay. The ones already saved to your account move to Recently deleted. | step 1 | as built |
| `accountDeletion.what.copies` | EXISTING | A copy you exported stays wherever you saved it. | step 1 | - |
| `accountDeletion.exportFirst.*` | CHANGED (PROPOSED, C-S04 sweep) | Save a copy first / Save a copy of everything, free: ... your recordings and your pictures. / Save a copy | step 1 | NS-36-R2 |
| `accountDeletion.subscription.*` | EXISTING | Your Plus subscription / Deleting your account does not cancel Plus. ... / Manage subscription | step 1 | - |
| `accountDeletion.confirm.*`, `scheduled.*`, `signedOut.*`, `open.*`, `executing` | EXISTING | (as built) | step 2, scheduled, signed out, in progress | NS-10-R4a works without agreeing |
| `accountDeletion.errors.offline` | EXISTING | Nothing has changed. Deleting an account needs a connection. | `.offline`, `.killswitch` | - |
| `accountDeletion.errors.failed` | EXISTING | That did not go through. Nothing has changed. | `.error-delete_failed` | - |

Flip build only (NS-08-R16), PROPOSED, not shown today: `accountDeletion.what.backupPurged` "Recordings in your encrypted backup are deleted with your account." It replaces `recordingsAndPictures`' first clause for recordings once backup is on; written now so the flip does not invent it. It contains no "we" and no claim about the clock (the page holds the clock).

Website deletion page (`pages.en.ts`, section "What is deleted"). Replaces line 240, which says photos are removed from every book: pictures never reach our servers (ADR 0028 D6), so that sentence promises a deletion we cannot perform. `CLAIM`, for `legal` and counsel (packet Q51) before it ships.

| Key | Status | Text |
|---|---|---|
| `pages.deleteAccount.whatIsDeleted[0]` | CHANGED (PROPOSED) | Your letters are removed from our servers and from every book, including a book you share with a co-parent. That book stays with your co-parent, and we let them know that your letters are no longer in it. If you would like them to keep a copy, save a copy of yours first and share it. |
| `pages.deleteAccount.whatIsDeleted[1]` | PROPOSED (new paragraph) | Recordings and pictures are kept on the phone that made them, not on our servers. On the phone where you delete your account, letters saved to your account move to Recently deleted with their recordings and pictures. To remove everything from a phone now, sign out on that phone, then choose "Erase everything on this phone" in Settings, or delete the app. |
| `pages.deleteAccount.whatIsDeleted[2]` | PROPOSED (new paragraph) | Letters you hid until a day are deleted with your account, even if their day has not come, and never open for anyone. |
| `pages.deleteAccount.whatIsDeleted[3]` and `[4]` | EXISTING | (the sole-parent book line and the profile line, unchanged) |

Paragraph [1] says "not on our servers" for recordings because backup is off in every store profile (NS-08-R5). The flip rewrites it in the same PR as the label and policy (NS-08-R4).

---

## C-S21. Recording backup (flip only; absent today) (NS-08)

Nothing here renders while `EXPO_PUBLIC_BACKUP` is off. Existing `backup.*` keys (`features/backup.en.ts`) cover the sheet, the row, and the restore states; the card's door lines are already met by them except two lines, proposed so the flip does not invent them:

| Key | Status | Text | State | Card row |
|---|---|---|---|---|
| `backup.turnOnButton` + `en.common.notNowButton` | EXISTING | Back up my recordings / Not now | `.consent`, two equal buttons | NS-08 door lines |
| `backup.declinedNote` | PROPOSED `CLAIM` | Your recordings are kept on this phone. Nothing is uploaded. | after Not now | NS-08 door "Decline" |
| `backup.lastBackedUp` / `backingUp` / `waitingWifi` / `paused` | EXISTING | Backed up {date} / Backing up / Backs up on Wi-Fi / Backup will carry on later. | `.on`, `.queued`, `.killswitch` | NS-08-R12, R14 |
| `backup.retrying` | PROPOSED `CLAIM` | This recording is on this phone only for now. | `.retrying` after repeated failure | NS-08 "Failed" (no blame) |
| `backup.someKeptHere` | EXISTING | Some recordings stay on this phone and are not in the backup. | Storage after repeated failure | NS-08 "Failed" |
| `backup.quotaReached` | EXISTING | New recordings are not being backed up. Write to us and we'll help. | `.quota` | NS-08-R18 |
| `backup.withdrawTitle` | PROPOSED | Stop backing up? | `.withdraw` | D12 |
| `backup.withdrawBody` | PROPOSED `CLAIM` | New recordings stop backing up, and the copies in your backup are deleted on the schedule in the Privacy Policy. Recordings on this phone are not changed. | `.withdraw` (replaces `offBody`, which says "What's backed up stays" and contradicts D12; DESIGN G10) | D12; NS-08-R19 |
| `backup.withdrawConfirmButton` | PROPOSED | Stop backing up | `.withdraw`, second | NS-08 door "Withdraw" |
| `backup.keepOn` | EXISTING | Keep backup on | `.withdraw`, first and default | - |

Audit notes for the flip (not blocking today, since nothing shows): `backup.sheetNotIncluded` says "yet" (implies a future); `offBody` and `offKeep` contradict D12; `backup.turnOnFailed`, `backup.quotaReached` and others use contractions and "we'll"; the file has no per-surface rule row (`SURFACE_OPT_OUT.backup`). Before the flip, `content` writes that row and re-reads every key against the NS-08 banned list ("backed up" only when the server confirms; never "never lose", "safe in the cloud", "only you can restore", "free backup").

---

## C-S22. Delete this book (built; NS-36)

| Key | Status | Text | State | Card row |
|---|---|---|---|---|
| `en.settings.delete.bookTitle` / `bookUndo` / `bookConfirm` / `bookKeep` / `bookTypeToConfirmLabel` | EXISTING | Delete the whole book? / You have 30 days to change your mind. After that, it cannot be restored. / Delete the book / Keep the book / Type delete to confirm | - | F17 |
| `en.settings.delete.bookBody` | CHANGED (PROPOSED) `CLAIM` | Every letter in {child}'s book will be removed from this phone and from our servers. Every recording and picture will be removed from this phone. | signed in, photos on | NS-36-R1a, R1c |
| `en.settings.delete.bookBodyThisPhone` | CHANGED (PROPOSED) `CLAIM` | Every letter, recording and picture in {child}'s book will be removed from this phone. | never signed in, photos on | NS-36 |
| `en.settings.delete.bookBodyCoParent` | CHANGED (PROPOSED) | {child}'s book stays with your co-parent. Your own letters, recordings and pictures in it will be removed. | with a co-parent | NS-36 |
| `en.settings.delete.bookEraseNowBody` | CHANGED (PROPOSED) | Every letter, recording and picture in it is erased for good. | Recently deleted, book card | NS-36-R1c |
| `en.settings.delete.bookExportFirst` | CHANGED (PROPOSED, sweep) | You can save a copy first, free. | - | NS-11 |

As with C-S08, the picture words land when photos are on in the first build; today's words stand until then.

---

## Errors, by code

Every error says what happened, then what the parent can do; never blame, never fear, never "failed" or "error" on screen. Codes and state ids as in DESIGN.md section 4.

| Code (source) | Screen state | Words (keys) |
|---|---|---|
| `print_pdf_failed` (C28 4.10; eng `pdf_render_failed`, `font_missing`) | C-S05 `.error-print_pdf_failed` | `export.printable.failedTitle` + `failedBody` + `common.tryAgainButton` |
| `print_pdf_disk_full` (C28 4.10) | C-S05 `.error-print_pdf_disk_full` | `export.screen.lowSpaceBody` + `needsSpace` ({size} = estimate plus 200 MB) + `openStorageButton` + Try again |
| `ExportLowSpaceError` (F15-REQ-010) | C-S04 `.error-lowSpace` | `export.screen.lowSpaceBody` + `needsSpace` + `openStorageButton` + Try again |
| `ExportTooLargeError` | C-S04 `.error-tooBig` | `export.screen.tooBigTitle` + `settingsHome.helpValue` |
| export other | C-S04 `.error-other` | `export.screen.failedTitle` + `failedBody` + Try again |
| `ExportCancelledError` | C-S04 `.stopped` | `export.screen.cancelled` + Save a copy |
| killed mid-export | C-S04 `.stopped-by-close` | `export.screen.stoppedByClose` + Save a copy |
| `share_cancelled`, destination full | C-S04 `.cancelled` | `export.screen.notSaved` |
| `share_failed` | C-S04 and C-S05 `.ready` | `export.screen.shareFailed` + Save or share |
| `temp_cleanup_failed` | never shown | none |
| `fetch_failed` (NS-12, PROPOSED in DESIGN) | C-S13 `.error-fetch_failed` | `book.versions.failed` + Try again |
| versions `offline` (never shown as a code) | C-S13 `.offlineNone` | `book.versions.offlineNone` |
| `quiet_write_failed` | C-S15 `.error-quiet_write_failed` | `children.quiet.failed` |
| Let it go file delete (no code shown, NS-09) | Review (A area); C-S18 `.stuck`, `.stuckAgain` | `review.letGoPending`; `storage.stuckOne` + `removeNowButton` |
| `erase_failed`, `book_erase_failed` (built) | C-S17 | `settings.delete.eraseFailedToast`, `bookEraseFailedToast` |
| erase everything did not finish (built) | C-S19 `.error-failed` | `settings.erase.failed` |
| account deletion offline, failed (built) | C-S20 `.error-offline`, `.error-failed` | `accountDeletion.errors.offline`, `.failed` |
| consent outstanding, declined, no network, no book, wrong account, deleted elsewhere | C-S10, C-S11 | see C-S10 to C-S12 above; no code shown (NS-10 section 10) |
| `owner_mismatch` | C-S01 `.second-account` | none: B sees only B's books, and no line names A's |
| sign-in errors (built `auth.errors.*`) | C-S10, C-S11 | as built; no error line says "Your letters are still on this phone" (a new phone reads them) |

## Empty states

| Screen | Words |
|---|---|
| C-S04 `.empty` | `export.screen.emptyNote` |
| C-S04 `.nothingHere` | `auth.newPhone.declinedNothingHere` |
| C-S05, a book with no kept letters | its row absent, no words |
| C-S06 | no slip, no words |
| C-S10 `.noBook` | `auth.consent.noBook.*` |
| C-S13, fewer than two versions | row absent, no words |
| C-S16 | `children.settings.hiddenEmpty` (DESIGN never shows it: the Me row is absent when none is hidden) |
| C-S17 `.empty` | `settings.delete.shelfEmpty` |
| C-S18, nothing stuck | no group, no line |

## Notifications

Area C sends none. Save a copy has no notification (NS-11 "What"); backup has none today, and at the flip the cards name none. Nothing here reaches a lock screen.

---

## Rules run

Every PROPOSED and CHANGED string above was run on 20 Nov through the patterns copied from `packages/content/test/rules.test.ts` and `test/support/copy-surfaces.ts` (a scratch script outside the repo; nothing in the repo changed):

- Characters: no em dash, en dash, curly quote, ellipsis character or emoji; ASCII only.
- FEAR (`:182`), AI (`:189`), rewrite, gap and day-count (`:291-299`), PRINT/K-32 (`:398`), gendered words (`:447`, `:451`), banned edit words (`:959`, `:1066`), internal terms take, entry, draft, pack (`:524-536`), UK spelling (`:1102`).
- `ON_DEVICE_ONLY` (`:1045`): only `auth.account.signOutBody` says "stay on this phone", which is the one key the auth surface allows (`copy-surfaces.ts:387`). No other proposed line says it, "only on this phone", "from this phone", "no one else" or "nothing is sent anywhere".
- "we", "our", "us": none in any proposed `authCopy` or `accountDeletionCopy` key. In `en`, "our" appears only in `whereLive.onPhoneSynced`, `settings.privacy.keptSynced` and `settings.recordings.onPhoneBodyBackupOff`, where today's words already have it. In `pages`, "we" stays as today.
- "photos": none in `authCopy` or `accountDeletionCopy` keys.
- Buttons, 22 characters or fewer with the Asha fixtures: Save a copy (11), Open Storage (12), Use these words (15), Remove this version (19), Remove (6), Show all (8), Remove now (10), Turn off Quiet (14), Sign out now (12), Read and agree (14), Start a book here (17), Back to start (13), Stop backing up (15), Not now (7), Close (5).
- VOICE list: no "safe", no "tidy", no "That did not work this time", no "Here is", no greeting-card endings. "Not now" is reused, not "Skip".
- Loss words from the cards: no "lost", "missing", "lose", "backup" or "protect" on Save a copy; no "backed up" except the flip-only existing key, shown only after the server confirms.

Result: first run 110 strings, 11 hits; after reconciliation 139 strings, 0 non-ASCII characters, 11 hits, each read by hand. No button over 22 characters.
- 1 fixed on the first run: `book.versions.removeBody` said "from this phone" (an `ON_DEVICE_ONLY` phrase); it now says "removed here and from your account".
- 1 sanctioned: `auth.account.signOutBody` ("stay on this phone"), the one key allowed by `copy-surfaces.ts:387`.
- 8 "we", "our" or "us" already in today's words of the same keys (`whereLive.onPhoneSynced`, `settings.privacy.keptOnPhone`, `keptSynced`, `settings.recordings.onPhoneBodyBackupOff`, `settings.erase.body`, `settings.delete.bookBody`) or on the website page, where "we" is the house style. None of those keys is in the P0 `TOUCHED` set, so the P0 "we" rule does not read them; if the PR adds them to `CHANGED`, it must also add them to `P0_WE_ALLOWED`, or the words drop "our servers" (open for the founder).
- 2 "from this phone" in `settings.delete.bookBody` and `bookBodyThisPhone`, as in today's words; same note as above (not in `TOUCHED`).
The script and its output were not kept in the repo (BRIEF section 4: no report files).

---

## Claims check

Each line that makes a promise, and the card section it stays inside.

| Line (key) | Promise | Stays inside |
|---|---|---|
| `auth.account.signOutBody`, `signOutPictures`, `signOutWho` | Signing out keeps letters, recordings and pictures on this phone; anyone who can open the app here can read them | D1; NS-08-R6; NS-01-R30; NS-08 section 19 (no backup claim) |
| `en.settingsHome.exportHelp`, `en.settings.export.lead`, `en.tonight.copySlip.body` | Every letter, recording and picture, free, any time; yours to keep, in files that open anywhere | NS-11 section 19 ("Save a copy of the year, in open formats, yours to keep"); T2 (free in 1.0.x; says nothing about forever) |
| `export.screen.includesRecordings`, `includesPictures` | Every recording on this phone; every picture as its stored copy | NS-11-R10; NS-36-R2; NS-01-R14 |
| `export.screen.privacyNotice`, `offlineNote` | As private as where you keep it; made on this phone, goes only where you send it | NS-11 door lines; section 17 (no safety word, so Q43 not triggered) |
| `export.printable.sectionTitle`, `optionHelp` | A free PDF of one book laid out for paper | C28 section 4.18 ("A free printable PDF of the book"); forbids order, printed, print-ready, partner, photo book: none used |
| `whereLive.*`, `settings.privacy.kept*`, `settings.recordings.onPhoneBody`, `whereLive.newPhoneBody` | Where letters, recordings and pictures are kept; words come to a new phone, recordings and pictures do not | NS-10 section 19 (enables "letters follow you to a new phone"; forbids "everything moves", "recordings move"); NS-08 section 19; NS-01-R32 |
| `whereLive.keepLine` | Two copies the parent controls: Save a copy and iCloud Backup | NS-08-R8 |
| `book.recordingNotHere`, `book.newPhoneLine.*` | The recording is not on this phone; words are here | NS-08 design inputs; NS-10-R1, R13 |
| `book.recordingArriving`, `book.recordingBackedUp`, `backup.declinedNote`, `backup.retrying`, `backup.withdrawBody` | Flip only; withdrawal deletes server copies on the published clock | NS-08 section 19 (enables nothing until the flip); D12 |
| `book.versions.keptLine`, `removeBody` | Earlier versions kept until removed; removed from this phone and the account; what you said stays | NS-12-R7, R6; D8; forbids "full history", "undo anything forever": none used |
| `storage.stuckOne`, `review.letGoPending` | The recording is still on this phone; the app will finish removing it | NS-09 section 19 (forbids "instantly deleted everywhere") |
| `settings.delete.eraseNowBody`, `bookBody*`, `bookEraseNowBody` | Letter, recording and picture erased together | NS-36 section 19 ("Delete a letter and everything with it goes", after R1a to R1d pass; forbids "deleted everywhere instantly") |
| `settings.erase.body`, `bodySynced` | Erase removes every book, letter, recording and picture from this iPhone; "We hold no copy" only where no account ever synced; otherwise account letters stay in the account | NS-36 erase row; NS-01-R52; DESIGN G2 |
| `auth.newPhone.declinedTitle`, `declinedBody`, `declinedNothingHere` | The book stays in the account; nothing comes to this phone until the parent agrees; save a copy and delete account still work | NS-10 door "Decline"; NS-10-R4a, R4b |
| `accountDeletion.what.sealed`, `pages ... [2]` | Hidden-until letters deleted with the account, never opened for anyone | D6; NS-06-B18 |
| `accountDeletion.what.recordingsAndPictures`, `pages ... [1]` | Recordings and pictures are not on our servers; how to remove them from a phone | NS-01-R31; NS-36 (pictures never on the server, R1d); NS-08-R7 (backup off) |
| `children.quiet.body` | No reminders, messages or Home cards for a quiet book | NS-32-R14, NS-13-R12, NS-23-R8, NS-11-R8 (each a P0 row; the line is true only when all four pass) |

Not claimed anywhere in area C: "backed up" (today), "never lose", "safe in the cloud", "only you can restore", "free backup", "backup" on Save a copy, "in case you lose your phone", "protect your memories", "everything moves", "nothing is ever lost", "deleted everywhere instantly", "print-ready", "printed", any count.

---

## Card gaps

DESIGN.md's G1 to G14 stand; the content view of each that touches words is named here, plus the gaps only words reveal.

| # | Card row | What is missing or wrong | Proposed default |
|---|---|---|---|
| W1 | NS-11 section 3; `14-test-plan.md` J-N8 (DESIGN G7) | NS-11 leaves the name to `content` ("Take the book with you" or "Save a copy"); J-N8 already says "Take the book with you" | "Save a copy" everywhere, and "Keeping your book" for the Me section; J-N8 reads "the copy equals the one from Save a copy in Me" |
| W2 | C28 4.4 step 1 | Says "Me, then Export"; NS-11 makes the same screen "Save a copy" | The printable section sits on Save a copy (C-S04) |
| W3 | C28 4.2 (DESIGN G8) | The ZIP already holds "A printable book for each child" | "The book to read on screen, for each child, by month"; README line 97 follows in the same PR |
| W4 | NS-01-R32 | Tests key text "given photos on in any build", so a key cannot switch per flag; a photos-off build would read "pictures" | Change the values when the first build with photos on is cut; a photos-off build that reads "recordings and pictures are kept on this iPhone" is still true. The registered `auth.sheet.bodies.*` lines go to counsel first |
| W5 | NS-08-R8 (DESIGN G1) | The keep-safe card has no key on `develop` | `en.whereLive.keepLine` |
| W6 | NS-22-R7, section 16 (DESIGN G5) | Names `children.quiet.*` keys that do not exist; "Unquiet" reads as "uneasy" in English | `children.quiet.*` as proposed; Me uses a switch, the Book's end menu reads "Turn off Quiet"; R7's test checks the key, not the word |
| W7 | C28-18 | "The letters this parent can read" includes the parent's own private letters, while the ZIP's PDF leaves private letters out (README) | Same as the ZIP's PDF: private letters out, until `product` rules |
| W8 | D1 intent | "Anyone who opens the app here" is untrue with App lock on | "Anyone who can open the app here" |
| W9 | D1 intent (DESIGN G2) | "Use Erase everything" points to a row a synced phone does not show today | The line ships with BL-961 (E1), not before |
| W10 | NS-10 section 5 "Declined" | "The book stays on the server and the parent's other phone": the other phone may not exist | Declined lines say "stays in your account" and "on the phone that made them" |
| W11 | NS-10-R9 | "Account deleted on the other phone": for 30 days it is scheduled, not deleted, and can be cancelled | Show the built scheduled words with Cancel deletion; `executingTitle` once it runs (DESIGN's "This account was deleted on another phone." would be untrue in the 30 days) |
| W12 | NS-09 section 5 intent | "We will finish removing it" uses "we", which the rules test bans outside the promises | "The app will finish removing it." |
| W13 | NS-08 door "Withdraw" (DESIGN G10) | Built `offBody` says what is backed up stays, against D12 | `backup.withdrawBody` |

## Engineering gaps

DESIGN.md's E1 to E14 stand. Words-specific additions:

| # | Backlog row | Gap |
|---|---|---|
| W-E1 | BL-985 (Quiet has a home) | Scope says "using existing keys"; none exist. It needs `children.quiet.*`, approved first (DESIGN G5, BL-965) |
| W-E2 | BL-942 (Save a copy) | The Me row label, section heading and screen keys change in this row's PR; the sweep keys (C-S04 table) go in one `content` PR after approval |
| W-E3 | BL-931 slices / NS-01 content test (R31, R32) | The `pages` deletion paragraphs and the R32 key set ship with the first photos-on build; `content` writes the test cases |
| W-E4 | BL-961 (E12) | The sign-out Sheet joins three keys and adds `signOutPictures` only when this account has a picture |
| W-E5 | NS-08 flip (no row) | A per-surface rule row for `backupCopy` in `copy-surfaces.ts` before the flip (today `SURFACE_OPT_OUT`) |
| W-E6 | BL-942, BL-973 (E11) | `needsSpace` needs `{size}` as a formatted number ("575 MB"), never logged |

---

## Reconciliation with DESIGN.md

Read against DESIGN.md of 20 Nov (609 lines). Ids and states match DESIGN's; where the words differ from DESIGN's intent, these are the words, for these reasons:

| Place | DESIGN intent | WORDS | Why |
|---|---|---|---|
| C-S01 section | Take the book with you | Keeping your book | "Take with you" reads as moving the book; recordings and pictures do not move (NS-10 claims) |
| C-S02 row | Sign out of other phones | Sign out other devices (built) | BRAND.md glossary, LNG-14 |
| C-S03 body | Anyone who opens the app here | Anyone who can open the app here | App lock (W8) |
| C-S04 `.lowPower` | A large copy may take a while in Low Power Mode. | This may take a little longer while Low Power Mode is on. | One line for C-S04 and C-S05 (C28's intent) |
| C-S04 `.stopped`, `.stopped-by-close` | Nothing was saved. | No copy was made. | "Nothing was saved" can read as letters not saved |
| C-S04 `.nothingHere` | Your book is on your other phone. | ...in your account, and recordings and pictures are on the phone that made them. | There may be no other phone (W10) |
| C-S04 `.error-lowSpace` | About {size} more is needed. | This needs about {size} of free space on this phone. | The total is what the parent compares with Settings; either works if E11 gives the number |
| C-S05 `.error-print_pdf_failed` | The book could not be made this time. | The printable book was not made / No file was kept. Try again when you are ready. | VOICE.md: name what did not finish, avoid "this time" |
| C-S06 | A year of letters to {child}. Save a copy, yours to keep. | Save a copy of {child}'s year, yours to keep. | One sentence; leads with the act; twins use `{a}` and `{b}` (no new `{child2}`) |
| C-S08 keep-safe | A copy you save and your iPhone's own backup are the two copies of your recordings that you keep. | Two copies of your recordings are in your hands: one you make with Save a copy, and your iPhone's own iCloud Backup, if it is on. | Names the row and the condition (iCloud Backup may be off) |
| C-S10 `.wrongAccount` | You signed in with {method}. / Sign out and try another way | Signed in with Apple (built) / Try another way | No new placeholder in `authCopy`; the button was 27 characters |
| C-S10 `.deletedElsewhere` | This account was deleted on another phone. | built scheduled or executing words | W11 |
| C-S11 `.declined` | Save a copy of what is on this phone | Save a copy | Buttons stop at 22 characters |
| C-S12 | Your words are here. Recordings stay on the phone that made them. | The words of your letters are here. Recordings and pictures are kept on the phone that made them. | The registered sentence ("are kept on the phone that made them"); "stay on the phone" is the `ON_DEVICE_ONLY` pattern |
| C-S13 `.loading` | Getting earlier versions. | Finding earlier versions | Either works; one of the two, for the founder |
| C-S14 remove confirm | It cannot be brought back. Your words as heard stay. | It is removed here and from your account. The letter keeps the words it has now. This cannot be undone. | Says where it goes (NS-12-R6); the words as heard are named in `keptLine` |
| C-S15 footer | No reminders, birthday notes, Save a copy or past letters | No reminders, messages or Home cards | "note" is only what a person makes (glossary) |
| C-S20 pictures | Pictures stay on each phone until that phone is erased. | `what.recordingsAndPictures` | Also true for recordings while backup is off; says how |

Open for the design lead: C-S04 shows the privacy line on `.default` and `.ready` (both keyed here); C-S07 is keyed for the printable book and for the twins slip only if the founder keeps the chooser (G3).

## Reconciliation 2: final pack (20 Nov), proposed words for the new and changed states

Owner: content. Written by the design lead of area C for `content` to confirm; every line is PROPOSED, intent only, and waits for the founder's word approval. Rules applied: "reminder" never "note" (RV-3), no exclamation marks, "Not today" on a day slip and "Not now" on the Days ask, "photo" one word, no "your religion", "your tradition" or "a day we mark", no count, no gap language. Keys follow the card key families (`days.*`, `culture.*`, `notifications.dayNames.*`).

| Key | Text (intent) | Where | VO / VC | Card row |
|---|---|---|---|---|
| `days.page.title` | Days | C-S24 title and Me row | heading / "Days" | NS-46-R3 |
| `days.section.added` | Days you added | C-S24 heading | heading | NS-46-R38 |
| `days.section.chose` | Days you chose | C-S24 heading | heading | NS-46-R38 |
| `days.browse` | Browse days | C-S24 row, C-S25 title | "Browse days" | NS-46-R3 |
| `days.add` | Add a day | C-S24 row | "Add a day" | NS-18; NS-47 content F11 |
| `days.door.line` | Only on this phone. Used for one thing: finding days for you to pick. Change or clear any time in Me. | DoorNote, C-S24, C-S25 | read first | NS-47-R29 (not final until backup exclusion is confirmed, R6) |
| `days.door.shared` | Anyone who can open this phone can see this list. App lock keeps it private. | C-S24 under the DoorNote (second sentence only while App lock exists) | | NS-47-R29 |
| `days.reminder.consent` | A reminder arrives on that day. Unticking a day or Clear all stops it. | C-S25 while nothing is ticked | | NS-46-R35 |
| `days.remindersOff.line` | Chosen days still send a reminder, even with Reminders off. Stop it by unticking a day. | C-S24 and D-S06 | | NS-46-R35 |
| `days.nextYear.line` | {day}: no date for next year yet. | C-S24 row | part of the row label | NS-46-R15 |
| `days.picker.around` | around {date} | C-S25, C-S26 | "around {date}" | NS-46-R14 |
| `days.picker.whichDate` | Dates differ by country. Which date should we use? | C-S25.whichDate, C-S26.authorities | | NS-46-R14 |
| `days.picker.ownDate` | I will pick my own date | the last option | | NS-46-R14 |
| `days.move` / `days.move.thisYear` / `days.move.always` | Move this date / Just this year / Every year | C-S26 | | NS-46-R14 |
| `days.remove` | Remove | C-S26, swipe action, VoiceOver action | "Remove" | NS-47-R21 |
| `days.clearAll` / `days.clearAll.title` / `days.clearAll.keep` | Clear all / Clear all days you chose? / Keep my days | C-S24, F6 sheet | | NS-47-R21 |
| `days.storeUnavailable.line` / `.retry` | Days you chose could not be shown just now. / Try again | C-S24.store-unavailable | polite, once | NS-46-R40 |
| `days.sessionCleared.line` | Your days were cleared when you were signed out. You can choose days again. | C-S24.sessionCleared | | NS-47-R15 |
| `days.notInSaveCopy` | These days are not part of Save a copy. | C-S24 footnote | | NS-47-R10 (`culture.notInSaveCopy`) |
| `notifications.dayNames.switch` | Show the day's name in notifications | C-S24 | | NS-47-R14 |
| `notifications.dayNames.help` | Anyone who sees your lock screen can read it. | C-S24 under the switch | | NS-47-R14 |
| `notifications.dayNames.appLock` | App lock is on, so notifications stay neutral. | C-S24 reason line while disabled | | NS-47-R12 |
| `culture.ask.question` | Would you like a reminder on the days that matter to your family? | Home ask slip | | NS-47-R32 |
| `culture.ask.choose` / `culture.ask.notNow` | Choose days / Not now | ask slip buttons | | NS-47-R32 |
| `culture.picker.tradition.header` / `.help` | Traditions / Pick any that fit. You can pick more than one. | C-S25 | "Traditions, optional" | NS-47-R30 |
| `culture.picker.country.header` | A country that matters to your family | C-S25 (absent until a second country) | "..., optional" | NS-47-R35 |
| `common.optional` | Optional | beside an optional label | "{label}, optional" | NS-47-R30 |
| `common.notNow` | Not now | first row of an optional group | "Not now" | NS-47-R30 |
| `culture.delete.line` | Days you chose stay on your phones and are cleared with your account. | C-S20.what, only when a day is ticked | | NS-47-R17 (contradiction X1) |
| `culture.signOut.line` | Days you chose on this phone are cleared. | C-S03 `.days` | | FR-CUL-15 |
| `signOut.appLockOffer` | Turn on App lock | C-S03 | "Turn on App lock" | FR-SEC-07 |
| `daySlip.close` | Not today | day slip button | hint "Hides this until tomorrow" | NS-50-R7 |
| `askSlip.notNow.hint` | Closes this question. You can still choose days in Me. | ask slip | | NS-50-R7 |
| `storage.stuck.line` | A recording is still being removed. | C-S18.stuck (one line, never a list or count) | | NS-09-R6, E28 |
| `storage.stuck.again` | The app will finish removing it. | C-S18.stuckAgain | | GAP-LOG C W12 |
| `privacy.withdraw.title` | Stop syncing letters? | C-S23.withdraw | | FR-PRV-01 |
| `privacy.withdraw.stops` / `.stays` | New letters stop syncing, and the other parent stops receiving new letters. / Your book stays on this phone, and letters already on our servers stay until you delete them or your account. | C-S23.withdraw | | FR-PRV-01 (counsel reads) |
| `privacy.withdraw.confirm` / `.cancel` | Stop syncing / Cancel | the two equal buttons | | FR-PRV-01 |
| `me.sessionEnded.line` | You were signed out. Sign in again to carry on. | C-S01.sessionEnded (built `session_expired`) | polite | NS-45-R3 |
| `me.deletedElsewhere.line` | This account was deleted on another phone. You can start a new book here. | C-S01.deletedElsewhere | | NS-45 section 5 |
| `export.ready.fileLine` | Anyone who has this file can read and hear everything in it. | C-S04.ready, C-S05.ready | | FR-SEC-08 |
| `export.parts.ready` | Your copy is ready in {n} parts. Each part opens on its own. | C-S04.ready (parts) | | FR-LCY-21 (the count is of parts, once) |
| `deleteAccount.howLink` | How deleting works | C-S20 link row | link | FR-MSG-34 |
| `me.group.daysAndReminders` | Days and reminders | `.regrouped` working title | heading | RV-3 |
| `me.group.onThisPhone` | On this phone | `.regrouped` working title | heading | R-IA-4 |

Round 2 (pending NS-51 and NS-52, PROPOSED, not counted): `photos.access.title` "Photos access"; `photos.access.door` (what it reads: dates and how many were taken together; stays on the phone; no faces; places off); `photos.access.limited` "Selected photos"; `photos.access.full` "All photos"; `photos.albums.title` "Albums that count"; `photos.pause` "Pause"; `photos.indexing.line` "Looking at the photos on this phone."; `photos.turnOff` "Turn off and remove the list"; `photos.removed.line` "The list is removed from this phone."; `storage.media.title` "Pictures and videos"; `export.inside.videos` "Every video"; `recentlyDeleted.eraseMedia` "The letter, its recording, pictures and videos are erased for good." No line counts pictures or unwritten days, names a place by default, or says what a picture shows.
