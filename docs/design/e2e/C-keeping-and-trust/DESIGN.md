# Area C. Keeping and trust: end-to-end design

Status: DRAFT v1, reconciled with MOTION.md and WORDS.md (section 11), for Karma's reconciliation, 20 Nov 2026. Design lead, area C (design-systems role, Claude session). Docs only; nothing here was run on a phone.
Motion (`MOTION.md`) and words (`WORDS.md`) in this folder key to the ids below. Ids are stable; a new screen takes the next number, never a reused one.
Prototype: `PROTOTYPE.html` in this folder (self-contained, light and dark, text-size toggle to AX5, state switcher per screen).

Sources, in the order of the brief: the locked cards `08-keeping-and-trust.md` (NS-08 to NS-12), `07-remaining-capability-rows.md` section 4 (NS-07 C28), `11-foundations.md` (NS-36), `10-reading-and-family.md` (NS-21, NS-22, NS-23 where they touch Me), `06-firsts-sealed-letter-quick-capture.md` (D6 and B25 lines), `01-photo-with-a-letter.md` (R29 to R31), under `00-product-frame.md`; `14-test-plan.md` journeys J-N1, J-N2, J-N8, J-N9, J-N19, J-N21, J-N25; `16-council-review-round-2.md` (T2, T4, D1, D6, D7, D8, D12, D13). Engineering: `13-engineering-plan.md`, the plan in PR #847 (`17-engineering-project-plan.md`, read 20 Nov through `gh api`), backlog rows BL-922, BL-925, BL-926, BL-942, BL-961, BL-963, BL-965, BL-973, BL-976 to BL-979, BL-985, BL-987, and `/home/claude/review/eng/C-platform-quality-delivery.md` (ADR proposals 0029, 0031, 0033, 0037; error code sets 4.2). The app as built on this worktree: `app/settings/*.tsx`, `app/(tabs)/you.tsx`, `lib/provenance.ts`, `lib/export/device.ts`, `lib/store.ts`, and the strings in `packages/content/src`.

Words in quotes below are the strings that exist today (by key) or intent for `content`; every new string is a PROPOSED key owned by `WORDS.md`, and the founder approves words before any build outside his family shows them.

---

## 0. Principles for this area (what every screen here does)

1. **Truth before comfort.** Every line about where a letter, a recording or a picture is must be true at the moment it shows. While backup is off, nothing implies a recording survives the loss of the phone (NS-08-R7). No "backed up", "never lose", "safe in the cloud", "protect your memories", "forever".
2. **Keeping is never gated.** Save a copy, the printable book, earlier versions, Recently deleted, erase and account deletion work in every plan state, signed out, offline (where local) and under every kill switch that is not their own (T2; LEGAL-REQ-040; NS-11-R12; C28-7; NS-12-R5).
3. **The safe choice is the default.** Every destructive confirm puts Keep (or Cancel) first and as the VoiceOver escape action; the destructive button is never filled at rest unless a typed word has armed it (built pattern in delete account).
4. **No celebration, no counts.** No confetti, no badge, no "3 of 12", no "x letters missing", no count of what did not arrive (NS-11-R5; C28-5; NS-10 unhappy paths).
5. **Paper, not alarm.** Errors use the caution token with a WarningCircle glyph and words, never red, never colour alone. Destructive actions use `destructive` with a label word.
6. **Same component, more states.** Every screen below reuses a built component first (ListRow, ListSection, Button, Card, StateScreen, ConfirmSheet, Sheet, Toast, BookCover, ErrorLine, AppNote). Three new components are proposed in section 6, each justified.

---

## 1. Screen and state inventory

| Id | Screen | Built today | Card source |
|---|---|---|---|
| C-S01 | Me (Look after), the tab root | `app/settings/index.tsx` via `(tabs)/you.tsx` | frame 4; NS-11-R1; NS-22-R3; D1; BL-927/928 heading |
| C-S02 | Account (sign-in method, sign out, sign out of other phones) | `app/settings/account.tsx` | D1; NS-08-R6, R15; NS-09-R12 |
| C-S03 | Sign-out sheet (the D1 sheet) | native `Alert` in account.tsx (replaced) | D1; NS-08-R6; NS-01-R30; X4 |
| C-S04 | Save a copy (the one export screen) | `app/settings/export.tsx` | NS-11; NS-07 C28-1; NS-10-R4b; NS-36-R2 |
| C-S05 | Making the printable book (PDF) | none | NS-07 C28 |
| C-S06 | Home slip: Save a copy in the birthday week | none (slip 3 of the registry) | NS-11-R2 to R4, R7, R8, R13 to R15, R22 |
| C-S07 | Which book (chooser sheet) | none | NS-11-R14; C28 happy path step 1 |
| C-S08 | Where your letters live | `app/settings/where-letters-live.tsx` | NS-08-R7, R8; NS-10 claims |
| C-S09 | Letter page: where the recording is (provenance line) | `letter/[id].tsx:436` | NS-08 design inputs, R20; NS-10-R1 |
| C-S10 | Opening your book (new phone, returning account) | `components/onboarding/new-phone-screens.tsx` (shared with E-S09) | NS-10-R0, R2, R8, R9, R11, R12 |
| C-S11 | Returning consent sheet and the "not agreed" screen | `app/(auth)/sign-in/consent.tsx` (shared with E-S07) | NS-10-R0, R4a, R4b, R7 |
| C-S12 | Book-level new phone line | none (top of the Book list, B-S01) | NS-10-R13 |
| C-S13 | Earlier versions (list) | none | NS-12-R1, R4, R7, R8 |
| C-S14 | An earlier version (read-only, Restore, Remove) | none | NS-12-R2, R3, R6 |
| C-S15 | A book in Me (details, Quiet this book, Hide this book, Delete this book) | `app/settings/children/[id].tsx` | NS-22-R3, R7; F12-REQ-011; BL-985 |
| C-S16 | Hidden books | `app/settings/children/hidden.tsx` | NS-22; F09-REQ-016 |
| C-S17 | Recently deleted | `app/settings/recently-deleted.tsx` | NS-21-R7b; NS-36-R1a to R1c; NS-06-B25 |
| C-S18 | Storage (languages, a recording still on this phone, space) | `app/settings/storage.tsx` | NS-09-R6; NS-11-R20 |
| C-S19 | Erase everything on this phone | `app/settings/erase.tsx` | D1; NS-36 erase row; NS-01-R52 |
| C-S20 | Delete account | `app/settings/delete-account.tsx` | D6; NS-01-R31; NS-10-R4a; NS-08-R16 |
| C-S21 | Recording backup (flip-only states; absent today) | `app/settings/backup.tsx` (flag off) | NS-08 sections 4, 5, 12, 15 |
| C-S22 | Delete this book | `app/settings/children/delete-book.tsx` | F17 6.2 D (built); NS-36 |

State suffixes on every screen: `.default`, `.empty`, `.loading`, `.offline`, `.error-<code>`, `.killswitch`, `.lapsed`, `.second-account`, `.signedout`, `.ax5`, `.vo` (VoiceOver order), `.dark`. Screen-specific states are listed per screen in section 3 and in the table in section 4.

Cross-area keys: B-S02 (the Book's end menu with Quiet and Hide) is area B's and calls the same store functions as C-S15; B-S21 (the past-letters switch) and D-S06 (Reminders) are rows inside C-S01 drawn by their areas; B-S22 (the sealed row with no words) sits inside C-S17; E-S07 and E-S09 share components with C-S11 and C-S10 (E owns first run; C owns every NS-10 state); E-S18 (account mismatch) is the system side of `C-S01.second-account`; A-S11 (Let it go confirm) feeds C-S18's stuck-recording row.

---

## 2. Journeys (numbered flows)

Notation: `screen.state` then the action. "Back" is the system back. Every journey runs at default size and at AX5, light and dark, in the prototype.

### J-C01. Save a copy from Me (NS-11, J-N8 second half; NS-36-R2)

Happy path:
1. `C-S01.default`: tap "Save a copy" (section "Keeping your book"). Two taps from the tab (NS-11-R1).
2. `C-S04.default`: the book cover (thumb), the one sentence of what the copy holds, the "What is inside" rows (letters, recordings on this phone, pictures when photos are on, the book to read on screen, the data file), the privacy line ("as private as where you put it", intent), the last-prepared line, and the primary "Save a copy" pinned in the bottom third, 56 pt.
3. Tap Save a copy. If App lock is on, the system asks first (built `confirmForExport`). `C-S04.running` appears within 500 ms (NS-11-R24): phase line, a stepped bar with a text value, Stop. Screen kept awake only while running (R19).
4. `C-S04.ready`: "Your copy is ready." heading, the privacy line, primary "Save or share".
5. The iOS share sheet (system). The parent picks Files, iCloud Drive or AirDrop.
6. Completed: `C-S04.saved`: one line "Saved. The copy on this phone has been cleared away." (built `afterShare`, adjusted by content), the temp ZIP is deleted (R23), the slip state for every book becomes `saved` for this year (R3).

Unhappy paths:
- U1 Share sheet cancelled: `C-S04.cancelled`: back on Save a copy, "Not saved. Make the copy again any time." Nothing marked done (R16); the temp ZIP is deleted (R23); the slip can still show this year.
- U2 Destination refuses (Files or iCloud Drive full): the destination's own error over the share sheet; on return `C-S04.cancelled` as U1 (R16).
- U3 Not enough space (estimate plus 200 MB, F15-REQ-010, R20): the copy does not start. `C-S04.error-lowSpace`: caution card "This phone needs more free space first." with the amount needed ("About {size} more is needed.", PROPOSED) and "Open Storage" secondary; primary "Try again".
- U4 Too big for one file: `C-S04.error-tooBig` (built): "This book is too big for one file" and "Write to us".
- U5 Other failure: `C-S04.error-other` (built): "The copy did not finish. Your letters and recordings are all still here." and "Try again".
- U6 Stopped by the parent: `C-S04.stopped`: "Stopped. Nothing was saved." and "Save a copy".
- U7 Interrupted (call, Siri, the baby; app to background): the export continues while iOS allows; on return it shows `running` or `ready`. If iOS suspended and killed the app: next launch deletes the temp ZIP (R23); Save a copy opens at `C-S04.stopped-by-close`: "The last copy stopped when the app closed. Nothing was saved." (R9: says it stopped; never half-made).
- U8 Low Power Mode or battery under 20%: `C-S04.lowPower`: one muted line above the button, "A large copy may take a while in Low Power Mode." Not blocked (R17).
- U9 Empty book (no kept letter): `C-S04.empty`: the built `emptyNote` and a disabled-looking outline button with the reason above it (never a dead button without words).
- U10 New phone, some recordings elsewhere: `C-S04.newPhone`: the recordings row reads "Every recording on this phone" (already true by wording); no count of the absent ones (NS-11 unhappy row 3).
- U11 Signed out, lapsed, second account, kill switch: the same screen, unchanged (R12, R21; R22 for B's slip state; export has no remote pause).
- U12 Declined Terms on a new phone with nothing here: `C-S04.nothingHere`: "Your book is on your other phone. This phone has no letters to copy yet." (NS-10-R4b).

### J-C02. The birthday-week slip (NS-11 slip, J-N8, J-N19)

Happy path:
1. In the 7 days after {child}'s birthday (PROPOSED window), with at least 1 kept letter, no higher slip due, the book not quiet or hidden, and the flag on: Home shows `C-S06.default` in the slip place (A-S01): one card, one line ("A year of letters to {child}. Save a copy, yours to keep.", intent), the card is the tap, a small "Not now" text button.
2. Tap the card: `C-S04.default` (same function as Me, R6a).
3. Save as J-C01. The slip does not return this year (R3).

Unhappy paths and rules:
- U1 "Not now": the slip leaves (exit motion per MOTION.md); state `dismissed` for this year; no toast, no undo (dismissing a suggestion loses nothing).
- U2 A higher slip is due (a waiting card, the seal-opened line): this slip waits; at most one slip shows (R4, `[FRAME-SLIP]`).
- U3 Due date only, or no kept letter: no slip (R7; first-use row).
- U4 Quiet or hidden book: no slip for it (R8, P0, J-N19).
- U5 Two books, different birthdays in one week: one at a time, earlier birthday first (R15).
- U6 Twins, same birthday: one slip naming both, `C-S06.twins` ("A year of letters to {child} and {child2}."), leading to `C-S07` only if the founder keeps the chooser (see card gap G3); default leads straight to C-S04 because the copy holds every book.
- U7 29 February: in a non-leap year the window starts 28 February (R13).
- U8 Time zone change: local date rules.
- U9 Second account: B never sees A's slip state (R22).
- U10 `EXPO_PUBLIC_SAVE_A_COPY` off: no slip; the Me row stays.
- U11 AX5: the slip's line wraps; "Not now" moves under the line, 44 pt; the slip is one VoiceOver element with a custom action "Not now".

### J-C03. The printable book (NS-07 C28)

Happy path:
1. `C-S04.default` with `EXPO_PUBLIC_PRINT_BOOK` on (internal flag name per eng proposal; card's `EXPO_PUBLIC_PRINT_READY`) and at least one book with a kept letter: a second section "Printable book (PDF)" with one row per book (one book: one row "Printable book (PDF)"; two books: `C-S07` opens on tap). No price, order, partner, page count (C28-1).
2. Tap: `C-S05.making`: the book cover, "Making your book" heading, stepped progress with text value, Stop. Progress within 500 ms (C28-9); screen awake only while making (C28-15).
3. `C-S05.ready`: "Your printable book is ready." and "Save or share". Share sheet. On completion or cancel the temp PDF is deleted in the completion handler (C28-12); return to C-S04.

Unhappy paths:
- U1 Not enough space: `C-S05.error-print_pdf_disk_full`: "This phone needs about {size} more free space to make the book." (C28 unhappy row 1 says how much), "Open Storage", "Try again". No file made.
- U2 Render failed: `C-S05.error-print_pdf_failed` (also covers eng codes `pdf_render_failed`, `font_missing`): "The book could not be made this time." and "Try again". No file left (C28 failed row).
- U3 Cancel (Stop): generation stops; no file kept; back to C-S04 with no line.
- U4 Low Power Mode: `C-S05.lowPower`: "This may take a little longer while Low Power Mode is on." (C28-14).
- U5 App killed while making: no partial file after next launch (C28-11); no line on return (nothing was promised).
- U6 Empty book: its row is absent (C28 empty row), not disabled.
- U7 Sealed letters before their day, quiet days, empty months: omitted silently (C28-4, C28-5); no line says anything is left out.
- U8 Pictures under 2,550 px or missing on this phone: used as they are or left out; no message (C28-8; new-phone row).
- U9 Second account, two parents: only what this parent can read in this account's books (C28-17, R18).
- U10 Share failed (`share_failed`): back to `C-S05.ready` with "That did not go through. Save or share again." (eng code; temp file kept only until the screen is left).

### J-C04. Sign out with the book kept on the phone (D1, NS-08-R6, J-N21)

Happy path:
1. `C-S01.default` signed in: tap the account card (top).
2. `C-S02.default`: the method line ("Signed in with Apple"), Sync row, Sign out of other phones, and "Sign out" at the end of the page.
3. Tap Sign out: `C-S03.default` opens (a sheet, not a native alert, so it can hold the D1 sentences at AX5 and name pictures): heading "Sign out on this phone?"; the D1 lines: "Your letters and recordings stay on this phone. Anyone who opens the app here can read them. Use Erase everything to remove them." (intent; once photos are on: "letters, recordings and pictures", NS-01-R30); buttons "Stay signed in" (filled, first, default, escape), "Sign out" and "Sign out and erase this phone" (F6 variant `three`, see section 11).
4. Tap Sign out. If nothing is waiting: signed out; `C-S01.signedout` (the signed-out card, Plan, books, and "Erase everything on this phone" now present in Your letters, see card gap G2).
5. Every recording file is still on the phone (R6; J-N21).

Unhappy paths:
- U1 Letters (or a discard, NS-09-R12) still to send: `C-S02.waiting`: "Your newest letters are still on their way. This phone signs out once they are sent." (built `signOutWaiting`) with a static indicator and "Sign out now" quiet (built path; then `signOutEarly` line on the signed-out card).
- U2 Offline while waiting: the waiting line stays; nothing is lost; "Sign out now" holds the ops for this account (NS-09-R12; NS-08-R15 at the flip).
- U3 Cancel ("Stay signed in"): nothing changes; no PRIV-R21 row (door line).
- U4 Forced re-auth (remote `forceReauthEpoch`): same sign-out path, no sheet; Me shows the signed-out card with "Sign in again" (built).
- U5 Kill switch `serverFeaturesEnabled()` off: no account card, so no sign-out (the build is local).
- U6 Second account then signs in: see J-C05.

### J-C05. A second account on the same phone (X4-R1, NS-10-R3, R5, NS-11-R22, NS-01-R29)

1. A signed out (J-C04). B signs in on this phone (E-S04 to E-S07).
2. B never sees A's letters, recordings, pictures, child name, slip state, Find rows or reminders; no claim screen offers A's letters (R5). B lands on B's own book (it arrives as J-C06) or, with no book, "No book here yet".
3. `C-S01.second-account`: Me shows only B's books. No row names or counts A's book. A's local book is held and locked (ADR 0031 proposal), and returns when A signs in again, or goes when Erase everything runs.
4. Save a copy, Printable book and Storage act on B's books only (C28-17).
Design decision: Me shows nothing about A's book, not even a neutral "another account's letters are on this phone" line, because the line itself would disclose to B that A's book exists. Erase everything's screen (C-S19) says it removes every book on this phone, including books of other accounts (PROPOSED line; see G2).

### J-C06. A new phone (NS-10, J-N2)

Happy path:
1. Sign in on the new phone (E-S04 to E-S06).
2. If a Terms version is outstanding: `C-S11.default` (the consent sheet with its versioned links, Agree and Not now). Agree writes one PRIV-R21 row, surface `returning_consent_sheet` (idempotent, R7).
3. `C-S10.opening`: "Opening your book." and "Your letters are coming across." (built keys), the static moon drawing under Reduce Motion, no count, no spinner, at most 10 s (R0).
4. The Book (B-S01) with the words that arrived and `C-S12.default` at the top: "Your words are here. Recordings stay on the phone that made them." (intent, NS-10 happy path 4) with a close button. Shown once until dismissed (R13); no per-card warnings.
5. A letter page (B-S08): its provenance line `C-S09.notHere` ("Recording not on this phone"), and no play button (R1).

Unhappy paths:
- U1 Consent outstanding at relaunch (killed on the sheet, or a Terms bump): `C-S10.held`: "Finish setting up to open your book." with "Finish setup" (primary, reopens C-S11) and "Try another way" (quiet). Never the child step (R0; BL-922).
- U2 Declined ("Not now" on C-S11): `C-S11.declined`: "Your book stays in your account. Nothing comes to this phone until you agree." with "Read and agree" (primary), "Save a copy" (to C-S04, or C-S04.nothingHere), "Delete account" (to C-S20, works without agreeing, R4a), "Sign out". Nothing downloads or uploads.
- U3 No network: `C-S10.offline`: "Opening your book needs a connection." and "Connect to the internet, then tap Try again." (built), "Try again". Never an empty book.
- U4 Slow (10 s pass, book still arriving): the Book shows what arrived with `C-S12.arriving` at the top: "More letters are on their way." (R2; replaces S17 2.5's "no line", card wins); it changes to `C-S12.default` when the pull completes.
- U5 Account truly has no book: `C-S10.noBook`: "No book here yet" and "Did you use a different way to sign in last time?" (built), "Try another way", "Start a book" (once; BL-922 removes the duplicate).
- U6 Wrong account: `C-S10.wrongAccount`: "You signed in with {method}." (R12; never the full email), "Sign out and try another way" primary, "Start a book here" quiet.
- U7 Account deleted on the other phone while waiting: `C-S10.deletedElsewhere`: "This account was deleted on another phone." with "Back to start" (R9; no code).
- U8 Kill switch at sign-in (`serverFeaturesEnabled()` off or `killSwitches.sync`): the local book only, never the held screen (R8); no C-S12 line (nothing arrived).
- U9 Lapsed plan: every letter arrives and opens (R10); no Plus line here.
- U10 Restore from an iCloud device backup then sign-in: each letter once (R6); nothing to show.
- U11 A lost `sync_books` answer: the wait continues from where it was, never restarts at zero (R11).
- U12 Low storage under 50 MB: the existing storage card (E-S17) shows; text keeps arriving.

### J-C07. Erase everything on this phone (D1, NS-36, NS-01-R52)

Happy path (a phone that never signed in, or signed out):
1. `C-S01.signedout` or `C-S01.local`: "Erase everything on this phone" (destructive row, last in Your letters).
2. `C-S19.default`: heading "What is erased", the body, the notes (on this phone only; exports and iPhone backups not changed; your free letters start again; Plus not cancelled when it will renew; spoken language stays), the "Save a copy first?" card with "Save a copy", and the destructive outline "Erase everything".
3. `C-S19.confirm`: ConfirmSheet "Erase everything on this phone?" / "This cannot be undone." with "Keep everything" (default, first) and "Erase".
4. `C-S19.erasing`: StateScreen loading "Erasing", no way out until it ends.
5. The app returns to the start (E-S02); VoiceOver hears "Everything on this phone is erased."

Unhappy paths:
- U1 A file would not go: `C-S19.error-failed` (built `failed`): try again now, or the next launch finishes it.
- U2 Killed mid-erase: the erase mark finishes at next launch (built `resumeEraseAtLaunch`).
- U3 Signed in (deep link): `C-S19.signedin`: "This phone is signed in. Sign out first, or delete your account in Me." (built key `signedIn` adjusted by content).
- U4 Signed out after syncing (A's letters are also in A's account): `C-S19.signedoutSynced`: the body says the account keeps its letters ("This removes every book, letter, recording and picture from this iPhone. Letters saved to an account stay in that account until it is deleted.", PROPOSED; replaces "We hold no copy", which is false here). See G2.

### J-C08. Delete account (D6, NS-01-R31, NS-10-R4a, NS-08-R16 at the flip)

Happy path:
1. `C-S01.default` signed in: "Delete account" (its own section).
2. `C-S20.what`: "What happens": the intro, one line per book (built per-book lines), the D6 line when the parent has a letter hidden until a day ("Letters you have hidden until a day are deleted too, and never open.", intent), the pictures line once photos are on ("Pictures stay on each phone until that phone is erased.", NS-01-R31, replacing `pages.en.ts:240`'s claim), the copies line, the "Keep a copy first" card (Save a copy, same function R6a), the Plus card only when Plus will renew, Continue.
3. `C-S20.confirm`: heading, body with the date, typed field "Type delete to confirm", "Keep my account" (default, escape) and "Delete account" (armed only when "delete" is typed).
4. `C-S20.scheduled`: the date, "Cancel deletion" bordered, "Sign out of this phone" (native confirm says the request stays open).

States added in reconciliation: `C-S20.loading` (the page reads its per-book lines; a still line, never a spinner loop, MOTION M-C55) and `C-S20.sending` (after Delete account, the button holds its place with a static busy label, MOTION M-C58).

Unhappy paths:
- U1 Offline: `C-S20.error-offline` (built `errors.offline`): "Nothing has changed. Deleting an account needs a connection."
- U2 Server failed: `C-S20.error-failed`: "That did not go through. Nothing has changed."
- U3 Executing: `C-S20.executing`.
- U4 Signed out: `C-S20.signedout`: the built signed-out line (`signedOut.body`).
- U5 Not configured (kill path): `C-S20.notConfigured` (built line with the support address).
- U6 Declined Terms on a new phone: reached from `C-S11.declined`; works without agreeing (R4a). The Me row's visibility must not depend on consent (engineering gap E8).
- U7 Cancel within 30 days: `C-S20.cancelled` toast "Deletion cancelled. Your letters and books are back, just as they were." (built).

### J-C09. Earlier versions of my own words (NS-12; flag `EXPO_PUBLIC_EARLIER_VERSIONS`, PROPOSED)

Happy path:
1. The author's letter page (B-S08), "This letter" list: the row "Earlier versions" appears only with 2 or more versions and only for the author (R1, R8).
2. `C-S13.default`: the kept-until-removed line at the top ("Earlier versions of your words are kept until you remove them.", intent, R7), then rows by date only, newest first, at most 20 (R4), "Show all" when there are more. Never the word "original".
3. Tap a row: `C-S14.default`: the date as heading, the words read-only in the letter serif with the letter's `base_direction`, then "Use these words" (Restore, primary) and "Remove this version" (destructive text button).
4. Restore: no confirm (nothing is lost: the current words become a version too, R2). The page returns to the letter with a toast "These words are back. The words before are in Earlier versions." (intent). No undo control: the earlier list is the undo, and the toast holds no action, so T4 does not apply.
5. Remove: `C-S14.confirmRemove` ConfirmSheet "Remove this version?" / "It cannot be brought back. Your words as heard stay." with "Keep it" (default) and "Remove". Then back to C-S13 with the row gone; toast "Version removed." (R6).

Unhappy paths:
- U1 Offline: `C-S13.offline`: versions already on the phone, or `C-S13.offlineNone` "Earlier versions show when you are online."; Restore and Remove still act and queue (card); no extra line.
- U2 Slow (over 1 s): `C-S13.loading`: one quiet line "Getting earlier versions." (no spinner loop under Reduce Motion).
- U3 Fetch failed: `C-S13.error-fetch_failed`: "Earlier versions could not be shown just now. Your words are unchanged." and "Try again".
- U4 Kill switch (`serverFeaturesEnabled()` off) or remote pause (`killSwitches.earlierVersions`, PROPOSED): the row shows only if versions are on the phone; with the pause on the row is absent (can only hide).
- U5 Not the author, or 1 version: the row is absent, not disabled (R1, R8).
- U6 Restore while the other phone edits: the words conflict rules apply; the conflict copy goes where it goes today; no new line.
- U7 Sign out: cached versions cleared (PROPOSED in card).

### J-C10. Quiet this book and Hide this book (F12-REQ-011, NS-22-R3, R7, BL-985, J-N19)

Happy path (from Me; area B draws the same from the Book's end menu B-S02):
1. `C-S01.default`: tap the book row.
2. `C-S15.default`: details; Reminders for this book; then a "When it is a hard time" style group without that heading (no loss words): "Quiet this book" switch row with its footer ("No reminders, birthday notes, Save a copy or past letters for {child}'s book. Your letters stay as they are.", intent); "Hide this book" row (two or more books); "Delete this book" (never-signed-in phone only, as built).
3. Quiet on: switch moves; no toast; the Home slip and past letters for this book stop (NS-11-R8, NS-23-R8), reminders stop (NS-13).
4. Quiet off (Unquiet): the same switch.
5. Hide: ConfirmSheet (plain, not destructive, as built) "Hide this book" / built `hideBody`, Cancel first. The book leaves the lists; Me shows "Hidden books" (C-S16).
6. `C-S16`: each hidden book with "Show this book again".

Unhappy paths:
- U1 The quiet write fails: the switch returns to its old position and one line under it: "That did not change. Try again." (NS-22 failed row). Engineering gap E7 (setChildQuiet returns nothing today).
- U2 One book only: Hide is absent (as built, `listChildren().length > 1`), Quiet present. See G6.
- U3 Two parents: per person; the other parent sees no change (NS-22).
- U4 Signed out, lapsed, kill switch, second account: works on this phone; B sees only B's books.

### J-C11. Recently deleted (NS-21-R7b, NS-36-R1a to R1c, NS-06-B25)

1. A letter is deleted from its page (B-S15). `C-S01` "Recently deleted".
2. `C-S17.default`: the help line ("Letters you delete wait here for 30 days."), deleted books first as one card each, then letter cards (two-line excerpt, who from, "Deleted {date}. Kept here until {date}."), each with Restore and Erase now (local builds).
3. Restore: the letter, its picture, its first and its Find row return together (NS-36-R1b); toast "Back in {child}'s book." with "Open" (T4 timing for the toast's action).
4. Erase now: ConfirmSheet "Erase this letter now?" / "The letter and its recording are erased for good." with "Keep it" default; then toast "Letter erased."

States: `.empty` ("No deleted letters."), `.sealed` (B-S22: a row with the chosen day and no words; Restore and Erase now as usual), `.book` (a deleted book card with "Restore the book"), `.synced` (no Erase now in a sync build, as built S63), `.error-erase_failed` (built toast "The letter was not erased. It is still in Recently deleted."), `.error-book_erase_failed` (built).

### J-C12. A recording that is still on this phone (NS-09-R6; P-4 has no backlog row)

1. After a Let it go whose file delete has failed on 3 launches (A-S11 feeds this), `C-S18.stuck`: Storage gets a group at the top, "Recordings", with one row per stuck recording: "One recording is still on this phone" (intent; no date, no name, no text) and a "Remove now" button 44 pt.
2. Remove now succeeds: the row leaves (exit per MOTION.md); no toast, no celebration.
3. Remove now fails again: `C-S18.stuckAgain`: the row stays, the same line; no error word (NS-09 row "Remove now fails again").
4. Low storage: a stuck file is the first item named (PROPOSED in the card); the existing low-storage line (E-S17) leads here.

### J-C13. Where your letters live and the recording's place (NS-08-R7, R8, R20; NS-10)

1. `C-S01`: "Where your letters live".
2. `C-S08.default` (sync build, backup off): On this phone (built synced line); If you get a new phone: iPhone backup row (Apple help link), Save a copy row (last prepared date or "Save a copy any time."), and the keep-safe line (NS-08-R8, see G1): "A copy you save and your iPhone's own backup are the two copies of your recordings that you keep." (intent; content words it). The "Encrypted backup: Not in this version" row is removed while backup is off (G9).
3. `C-S09` on each letter page (owned here as a row; drawn inside B-S08): the provenance line with five states (four of the card plus the built co-parent state), each a full-width line that wraps, with its own VoiceOver phrase (R20):
   - `C-S09.onPhone`: "Recording kept on this phone" (built).
   - `C-S09.notHere`: "Recording not on this phone" (built in the reader; letter page uses it after NS-10).
   - `C-S09.otherParent`: "Recording kept on {signsAs}'s phone" (built).
   - `C-S09.backedUp` (flip only): "Recording kept on this phone and backed up" (built key `recordingBackedUp`, shown only when the server confirms).
   - `C-S09.arriving` (flip only): "Recording on its way to this phone" (intent).
   - Typed letters: no recording clause (built).

### J-C14. Recording backup, at the flip only (NS-08 sections 4, 5, 12)

Today: `C-S21.absent`: no row in Me, no screen, no line anywhere (R5, R7). Designed now so the later build invents nothing:
1. After the first kept spoken letter (PROPOSED), once, never in first run: `C-S21.consent` sheet with the door lines (what is uploaded, the escrow sentence in D-102 wording, the Privacy section 4 versioned link), "Back up my recordings" and "Not now" as two equal labelled buttons, visible at the end at AX5 after scrolling.
2. On: Me shows "Back up my recordings: On"; `C-S21.on` with "Backing up" or "Backed up {date}", "Backs up on Wi-Fi", "Backup will carry on later." (built keys), never a percentage.
3. States: `.queued` (offline, Low Power Mode), `.retrying` (no blame; after repeated failure "This recording is on this phone only for now.", PROPOSED, NS-08 failed row), `.quota` (Keep never blocked, nothing charged; built `quotaReached` reviewed by content), `.killswitch` (`killSwitches.backupUploads`: "Backup will carry on later."), `.lapsed` (unchanged, free, R17), `.signedout` (uploads stop), `.withdraw` (ConfirmSheet "Stop backing up?" saying server copies are deleted on the published clock, D12; the built `offBody` contradicts D12, see G10).

### J-C15. Delete this book (built; never-signed-in phone)

`C-S15` "Delete this book" -> `C-S22.exportFirst` ("You can export everything first, free." with Save a copy) -> `C-S22.confirm` (typed "delete", "Keep the book" default) -> the book is in Recently deleted (toast "{child}'s book is in Recently deleted."). Unchanged except the export button label (one name, "Save a copy", G4) and the PDF line.

---

## 3. Screens: layout, components, states

All sizes are design-token values: gutters `space.5` (20 pt) on settings pages, section gap `space.7` (28 pt), row min height 44 pt (`target.min`), primary button 56 pt (`target.primary`), radius `md` 14 for cards and list groups, `pill` for buttons. Type: page titles `title1` (Literata Medium 28), section headers in title-style capitalisation (`subhead` muted, not upper-cased; system grouped list style, design system v2 brief section 1), row titles `label` (Mukta Medium 18), row subtitles `subhead` muted, notes `footnote` muted, letter words `letterBody` (Literata 20/32). Colours by token only; the prototype copies the light, dark and Increase Contrast values from `packages/design-tokens/src/tokens.ts`.

AX5 rule for every list row in this area (ListRow at accessibility sizes): the title wraps without truncation; a trailing value moves under the title, left-aligned, muted; the chevron stays at the trailing edge, vertically centred; destructive rows keep their word. Buttons stack full width with 12 pt between them, primary first in reading order.

### C-S01 Me (Look after)

Default layout (SE 3, 375 pt):
```
Me                                     (title1, level 1 heading = tab label)
[ Signed in with Apple            > ]  account card (or signed-out card)
[ Plan                    Free    > ]
Books
[ Asha's book                     > ]
[ Add a book                      > ]
[ Hidden books                    > ]  (only while one is hidden)
Writing
[ Spoken language                 > ]
[ Your words                      > ]
[ Reminders           Weekly      > ]  (D-S06)
[ Past letters on Home     (o)      ]  (B-S21)
[ Appearance          System      > ]
Keeping your book
[ Save a copy                     > ]  (one row, NS-11-R1)
[ Where your letters live         > ]
Your letters
[ Recently deleted                > ]
[ Storage                         > ]
[ Erase everything on this phone  > ]  (signed out or never signed in)
Privacy and security
[ App lock               Off      > ]
[ Privacy                         > ]
[ Delete account                  > ]  (signed in, own section)
Help and legal, then About (as built)
```
Change from built: a "Me" heading (BL-927/928); a new section "Keeping your book" holding the one export row (renamed "Save a copy") and Where your letters live (moved from Your letters); Erase everything also shown when signed out after a sign-in (G2, E1); the Back up row absent while backup is off (as built); no co-parent caption (the 11 Nov "coming soon" caption is superseded by the frame and the brief).

States: `.default` (signed in), `.signedout` (signed-out card with Sign in; Erase present), `.local` (no sign-in build: "On this phone" card, no Delete account), `.second-account` (B's books only, nothing of A's), `.killswitch` (servers off: as `.local`; Delete account absent; every keeping row present), `.lapsed` (Plan row "Free" with its line; every keeping row works; no gate in this area), `.offline` (no row changes; rows that need the network say so on their own screens), `.ax5`, `.vo`, `.dark`.
VoiceOver order: heading "Me", account card, Plan, then each section title (as heading) and its rows top to bottom. Voice Control names equal visible titles.
Components: ListSection, ListRow, ToggleRow, SignedOutCard (all built).
Integration: NS-11-R1, NS-22-R3 (Hide in Me), D1; BL-942 (Save a copy row), BL-927/928 (heading), BL-985 (Quiet), BL-961 (Erase after sign-out); flags: `EXPO_PUBLIC_ACCOUNT_DELETION`, `capabilities.backup`; kill switch: none of its own; data read: children, plan, auth state, sync owner; module: `app/settings/index.tsx`, `components/settings/settings-home.logic.ts`.

### C-S02 Account

Layout as built: method line, Sync row, "Finish setup" when consent is outstanding, "Sign out other devices" with its footer, then "Sign out" alone at the end. `.waiting` replaces the Sign out row with the waiting line and a static indicator (no loop under Reduce Motion) and "Sign out now". `.offline`: Sign out of other devices disabled with its reason as the footer ("Needs a connection."). AX5: rows wrap; Sign out stays 44 pt.
Integration: D1, NS-08-R6, R15 (flip), NS-09-R12; module `app/settings/account.tsx`, `lib/auth/session-provider.tsx` (`signOut({ scope: 'local' })`), `signOutWouldWait`.

### C-S03 Sign-out sheet (new use of the built Sheet)

F6 Confirmation sheet, variant `three`. Why not the native alert: the D1 text is three sentences and must not truncate at AX5 (alerts clip long bodies at the largest sizes on SE 3 and cannot hold the pictures clause cleanly). The built `Sheet` at medium detent, scrolling at AX5.
```
Sign out on this phone?                       (title2, heading)
Your letters and recordings stay on this      (body)
phone. Anyone who opens the app here can
read them. Use Erase everything to remove
them.
[        Stay signed in        ]  filled lg, first, default (F6 safe choice)
           Sign out               plain (not destructive: nothing is deleted)
   Sign out and erase this phone  destructive text (F6 `three`; signs out, then C-S19 confirm)
```
States: `.default`, `.photos` (names pictures, NS-01-R30), `.waiting` (after Sign out, if ops are pending, the sheet closes and C-S02.waiting shows), `.ax5` (the two buttons stack under the scrolled text and stay reachable), `.vo` (heading, body, Stay signed in, Sign out; escape gesture = Stay signed in), `.dark`.
Integration: D1, NS-08-R6 (P0), NS-01-R30, X4; BL-961 (words via BL-965); no flag; no kill switch; records nothing (door line).

### C-S04 Save a copy

Default layout:
```
< Me            Save a copy
          [ book cover, thumb ]
A copy of your book, yours to keep. It is     (body)
made on this phone and goes only where you
send it.
What is inside
[doc]  Every letter, as text
[mic]  Every recording on this phone
[img]  Every picture's stored copy            (photos on)
[book] The book to read on screen, by month   (renamed, G8)
[db]   A data file with your words as heard
       and every small fix
Printable book (PDF)                          (flag on, a book with letters)
[ Asha's book                           > ]
Last prepared November 3                      (footnote)
...
[            Save a copy               ]      primary 56 pt, bottom third
```
At AX5 on SE 3: the sentence wraps; the cover moves below the sentence at half size; "What is inside" rows wrap; the primary button is pinned at the bottom of the screen above the home indicator (a sticky footer), so it is visible without scrolling (NS-11 design input; device row). The Printable section sits after the button in reading order at AX5.
States: `.default`, `.running` (phase line with live region polite, stepped bar `accent` on `line`, value as percent text for VoiceOver only, Stop secondary), `.ready` (CheckCircle glyph plus words, privacy line, Save or share), `.saved`, `.cancelled`, `.stopped`, `.stopped-by-close`, `.lowPower`, `.empty`, `.nothingHere`, `.newPhone`, `.error-lowSpace`, `.error-tooBig`, `.error-other`, `.lapsed` (identical to default), `.signedout` (identical), `.second-account` (B's books), `.killswitch` (identical: export has no remote pause, LEGAL-REQ-040), `.ax5`, `.vo`, `.dark`.
VoiceOver: heading "Save a copy", the sentence, "What is inside" heading and rows, Printable heading and rows, last prepared, the button. Start and finish announced (NS-11 VoiceOver row) through the app's announce gate.
Components: BookCover, ListSection, ListRow, A1 Button, F3 Progress (linear), the built FailureCard, N3 Toolbar (bottom).
Integration: NS-11-R1, R5, R6a, R6b, R9 to R12, R16 to R21, R23, R24; NS-10-R4b; NS-36-R2; C28-1; BL-942, BL-933 (pictures in 1.7.0), BL-973; flags `EXPO_PUBLIC_SAVE_A_COPY` (slip only; the screen is always there), `EXPO_PUBLIC_PRINT_BOOK`; kill switch: none (a right); codes: `ExportLowSpaceError` (lowSpace), `ExportTooLargeError` (tooBig), other, `ExportCancelledError` (stopped), `share_cancelled`, `share_failed`, `temp_cleanup_failed` (never shown; sweep backstop); data read: every book on this phone for this account, `lastExportedAt`; written: `lastExportedAt` (after completion only, G4), `copySlip.<child id>.<year>` = saved; module `lib/export/*`, `app/settings/export.tsx`.

### C-S05 Making the printable book

A pushed page (not a sheet) so it survives the app going to background: cover, "Making your book" (title2), the stepped bar with a text value, the Low Power line when on, Stop. `.ready`: "Your printable book is ready." and Save or share. Errors in the FailureCard: `.error-print_pdf_disk_full` (with size), `.error-print_pdf_failed`, `.error-share_failed`. The PDF itself is always light (C28 dark row); the screen follows tokens.
Integration: C28-1 to C28-19; BL-973; ADR 0037 proposal; flag `EXPO_PUBLIC_PRINT_BOOK` (card: `EXPO_PUBLIC_PRINT_READY`); kill switch: none by card (eng proposes `killSwitches.printBook`, which would hide the row only); module `lib/export/print-pdf.ts`.

### C-S06 Home slip: Save a copy

A card in the slip place on Home (A-S01 owns placement): `surfaceRaised`, radius `md`, 16 pt padding, `callout` line, a small BookOpen glyph decorative (hidden from VoiceOver), "Not now" quiet text button at the trailing bottom. The whole card is the tap (opens C-S04). One VoiceOver element: label = the line, hint "Opens Save a copy.", custom action "Not now"; the visible "Not now" is also a button for Voice Control and Switch Control.
AX5: the line wraps to as many lines as it needs; "Not now" drops to its own line, 44 pt high.
States: `.default`, `.twins`, `.dismissed` (gone), `.quiet` (absent), `.expecting` (absent), `.flagOff` (absent), `.second-account` (absent for A's state), `.ax5`, `.vo`, `.dark`.
Integration: NS-11-R2 to R4, R7, R8, R13 to R15, R22; `[FRAME-SLIP]` slot 3; BL-942, BL-963 (registry, ADR 0033 proposal); flag `EXPO_PUBLIC_SAVE_A_COPY`; data `copySlip.<child id>.<year>` (shown, dismissed, saved), account-scoped (E10).

### C-S07 Which book

Sheet with one row per book (name only, no counts), and for twins a first row "Both books" (only for the slip route if the chooser is kept). Cancel at top leading. AX5: rows wrap. Used by the printable book with two or more books.
Integration: NS-11-R14; C28 happy path 1.

### C-S08 Where your letters live

As built, with three changes: the keep-safe line (NS-08-R8, G1) as the footer of "If you get a new phone"; the Save a copy row renamed and leading to C-S04; the "Encrypted backup / Not in this version" row removed while backup is off (G9). The orphan and unplayable lines stay as built (only above 0; they are facts about this phone, not gap counts of the book).
States: `.default` (sync build), `.local` (build without servers: "Your letters and recordings are kept on this iPhone."), `.signedout` (the local line; never says "not sent to us" for a phone that synced, built rule), `.flip` (backup row returns with On or Off), `.ax5`, `.vo`, `.dark`.
Integration: NS-08-R7 (P0), R8; NS-10 claims; module `components/settings/where-live.logic.ts`.

### C-S09 Provenance line on the letter page

The existing footnote line under the letter (`letter.provenance`): "Spoken, with small fixes. Recording kept on this phone." The place clause follows the five states in J-C13. Full width, wraps at AX5, `footnote` with `textMuted`, no icon as the only signal (a glyph may sit beside but is hidden from VoiceOver), never colour-coded. VoiceOver reads the whole line as one phrase.
Integration: NS-08-R20 (flip), design inputs; NS-10-R1; `lib/provenance.ts` (`provenanceLine` gains the not-here and arriving clauses; today a pulled letter shows no place, which is true but silent: the card asks for "not on this phone").

### C-S10 Opening your book

StateScreen (built), centred, 20 pt gutters, `title2` heading, `body` sentence, the moon line drawing (static under Reduce Motion). Actions stack below at every size (primary then quiet), 56 pt and 44 pt.
States: `.opening` (no buttons; polite live region, announced once), `.held`, `.offline`, `.noBook`, `.wrongAccount`, `.deletedElsewhere`, `.killswitch` (never shown: goes to the local book, R8), `.ax5` (actions stack, 44 pt min), `.vo` (heading, sentence, actions), `.dark`.
Integration: NS-10-R0, R2, R8, R9, R11, R12; BL-922, BL-978; `lib/first-run/route.logic.ts`, `gate.logic.ts`, `use-new-phone.ts`; kill switch `killSwitches.sync`; no error code shown (card).

### C-S11 Returning consent sheet and "not agreed"

The consent sheet is E-S07's component with surface `returning_consent_sheet` (records a PRIV-R21 row with every field). "Not now" leads to `C-S11.declined`, a pushed page: heading "Your book stays in your account", the sentence, then four stacked actions: "Read and agree" (primary), "Save a copy", "Delete account", "Sign out". AX5: the four stack; nothing hides below a fold without scroll affordance.
Integration: NS-10-R0, R4a, R4b, R7; door lines (Decline); BL-978, BL-987 (does `sync_pull` serve rows while consent is outstanding; default no pull).

### C-S12 Book-level new phone line

Plain text at the top of the Book list (above the first month), `callout`, `textMuted`, 20 pt gutters, with a close button (X glyph, 44 pt target, label "Close"). Not a card. Shown once per phone per account until closed (R13). `.arriving` replaces the text while the pull runs past 10 s (R2) and has no close button (it ends by itself). `.dismissed`: the line is gone and the list closes the gap (MOTION M-C29). Read once by VoiceOver in list order.
Integration: NS-10-R2, R13; data `newPhoneLine.dismissed` (L2, phone, account-scoped, E9); BL-978. Supersedes S17 2.3 (no dismiss) and 2.5 (no arriving line).

### C-S13 Earlier versions and C-S14 An earlier version

C-S13: pushed page, title "Earlier versions", the kept line as `subhead` muted, a ListSection of dated rows (`Intl.DateTimeFormat` long date and time, e.g. "November 12, 9:14 PM"), "Show all" row after 20. AX5: dates wrap.
C-S14: pushed page; "Words from {date}" as the `title2` heading; words in `letterBody` on `surfaceRaised`, read-only, selectable, writing tools irrelevant (no field); the N3 bottom toolbar with "Use these words" (primary) and "Remove this version" (destructive text button, 44 pt). VoiceOver: heading, the words, "Use these words, button. Makes these the letter's words. The words now become an earlier version.", "Remove this version, button. Removes it for good.".
Integration: NS-12-R1 to R8; BL-979 (blocked on counsel Q51, Q32, Q48); RPC `entry_versions_list` and a remove RPC with grants; flag `EXPO_PUBLIC_EARLIER_VERSIONS` (PROPOSED); remote pause `flags.versions` (card) or `killSwitches.earlierVersions` (eng); codes PROPOSED `fetch_failed`, `offline` (never shown as codes).

### C-S15 A book in Me

As built (details, born card, reminders switch, book row, Hide, Delete this book) plus the Quiet switch row placed directly above Hide, inside the same section, with its footer. `.quiet` (switch on), `.error-quiet_write_failed` (one line under the row in caution with WarningCircle), `.oneBook` (Hide absent), `.local` (Delete this book present), `.ax5`, `.vo`, `.dark`.
Integration: F12-REQ-011 (P0), NS-22-R3, R7; BL-985; `setChildQuiet`, `hideChild`; L2 phone-only settings.

### C-S16 Hidden books

As built: one row per hidden book with "Show this book again". `.empty` never shown (the Me row is absent when none is hidden).

### C-S17 Recently deleted

As built (shelf cards, Restore, Erase now, toasts) plus `.sealed` from B-S22 (no words, the chosen day only) and pictures returning with their letters (NS-36-R1b). Undo-style toasts follow T4 (open until VoiceOver has read them plus their seconds; with Switch Control until the parent moves on; BL-954).

### C-S18 Storage

As built (speech languages, downloads, cellular) with a new first group "Recordings" only while a stuck recording exists: one row per stuck recording with Remove now (Button `quiet` size `sm`, 44 pt hit area). `.stuck`, `.stuckAgain`, `.lowSpace` (the existing card leads here; the stuck rows first), `.ax5` (Remove now under the line), `.vo`, `.dark`.
Integration: NS-09-R6, R15; P-4 (no BL row, E3); `discard.failures.<draft id>` read; module `app/settings/storage.tsx`, the launch sweep.

### C-S19 Erase everything on this phone

As built: heading, body, notes, "Save a copy first?" card, destructive outline button, ConfirmSheet, Erasing StateScreen. Changes: the export button label becomes "Save a copy" (G4); `.signedoutSynced` body variant (G2); a line naming pictures once photos are on; available when signed out after a sign-in (E1).

### C-S20 Delete account

As built (what, confirm, scheduled, executing, signed out, not configured, errors) with two new lines on `.what`: the D6 sealed-letters line (only when the parent has a letter hidden until a day) and the pictures line (NS-01-R31, once photos are on). The export card's button calls the same export (R6a) and reads "Save a copy".

### C-S21 Recording backup (flip only)

Designed, not built. Consent sheet with two equal buttons; status page with a status line and a cellular switch; Stop backing up with a ConfirmSheet. No lock, shield or vault imagery; no progress percentage; no "bank-level".

### C-S22 Delete this book

As built; label change only.

---

## 4. State and error table (every code this area's cards name)

| Code or state | Where | What the parent sees (intent; WORDS.md owns the words) | Action | Card row |
|---|---|---|---|---|
| `ExportLowSpaceError` (estimate plus 200 MB) | C-S04.error-lowSpace | needs more free space, with the amount | Open Storage, Try again | NS-11-R20 |
| `ExportTooLargeError` | C-S04.error-tooBig | too big for one file | Write to us | built (S43) |
| export other | C-S04.error-other | did not finish; everything still here | Try again | NS-11 failed |
| `ExportCancelledError` | C-S04.stopped | stopped, nothing saved | Save a copy | NS-11-R9 |
| killed mid-export | C-S04.stopped-by-close | stopped when the app closed | Save a copy | NS-11-R9, R23 |
| `share_cancelled` | C-S04.cancelled | not saved | Save a copy | NS-11-R16 |
| `share_failed` | C-S04/C-S05 ready | did not go through | Save or share | eng 4.2 |
| destination full | system, then C-S04.cancelled | the destination's own error | as cancelled | NS-11-R16 |
| `temp_cleanup_failed` | never shown | nothing | sweep | NS-11-R23, C28-12 |
| `print_pdf_disk_full` | C-S05.error | needs about {size} more | Open Storage, Try again | C28 unhappy 1 |
| `print_pdf_failed` (`pdf_render_failed`, `font_missing`) | C-S05.error | could not be made this time | Try again | C28 failed |
| Low Power Mode | C-S04.lowPower, C-S05.lowPower | may take a while | none | NS-11-R17, C28-14 |
| consent outstanding | C-S10.held | finish setting up | Finish setup, Try another way | NS-10-R0 |
| declined Terms | C-S11.declined | book stays in your account | Read and agree, Save a copy, Delete account, Sign out | NS-10-R4a, R4b |
| no network at arrival | C-S10.offline | needs a connection | Try again | NS-10 offline |
| slow arrival | C-S12.arriving | more on their way | none | NS-10-R2 |
| no book | C-S10.noBook | no book here yet | Try another way, Start a book | NS-10 |
| wrong account | C-S10.wrongAccount | you signed in with {method} | Sign out and try another way | NS-10-R12 |
| deleted elsewhere | C-S10.deletedElsewhere | deleted on another phone | Back to start | NS-10-R9 |
| `serverFeaturesEnabled()` off | C-S10.killswitch, C-S01.killswitch | local book, no held screen | none | NS-10-R8 |
| `killSwitches.sync` | as above for pulls; discard queued | nothing | none | NS-10, NS-09-R10 |
| sign-out pending ops | C-S02.waiting | newest letters on their way | Sign out now | NS-09-R12, NS-08-R15 |
| `owner_mismatch` | C-S01.second-account | only B's books; nothing of A's | none | X4-R1 |
| erase failed | C-S19.error-failed | did not finish; try again or it finishes next open | Try again | built |
| account deletion offline | C-S20.error-offline | nothing changed; needs a connection | Try again | built |
| account deletion failed | C-S20.error-failed | did not go through; nothing changed | Try again | built |
| erase-now failed | C-S17 toast | not erased; still in Recently deleted | Erase now again | built |
| stuck recording | C-S18.stuck | one recording still on this phone | Remove now | NS-09-R6 |
| quiet write failed | C-S15.error | did not change | Try again | NS-22 failed |
| versions fetch failed | C-S13.error | could not be shown; words unchanged | Try again | NS-12 failed |
| versions offline, none cached | C-S13.offlineNone | show when online | none | NS-12 offline |
| backup states (flip) | C-S21 | see J-C14 | see J-C14 | NS-08 |

Plan lapse: no state in this area changes (T2; NS-11-R12, C28-7, NS-12-R5, NS-10-R10, NS-08-R17). Pictures flag off or `killSwitches.photos` on: picture rows leave C-S04 "What is inside", while export and erase still handle every picture file (NS-01-R19).

---

## 5. Integration map (by screen)

| Screen | Card rows | Backlog | Flag | Kill switch / pause | Error codes | Data read | Data written | Engineering module |
|---|---|---|---|---|---|---|---|---|
| C-S01 | NS-11-R1, NS-22-R3, D1 | BL-942, BL-927/928, BL-985, BL-961 | `EXPO_PUBLIC_ACCOUNT_DELETION`, `capabilities.backup` | none | none | children, plan, auth, sync owner | none | `app/settings/index.tsx`, `settings-home.logic.ts` |
| C-S02, C-S03 | D1, NS-08-R6, R15, NS-09-R12, NS-01-R30 | BL-961, BL-965 | none | `forceReauthEpoch` (remote) | none | pending uploads and discards | session cleared (local) | `account.tsx`, `session-provider.tsx` |
| C-S04 | NS-11-R1, R5, R6a, R6b, R9 to R12, R16 to R24; NS-10-R4b; NS-36-R2, R5 | BL-942, BL-933 | none on the screen | none (LEGAL-REQ-040) | low space, too big, other, cancelled, share codes | all books, letters, files, pictures | `lastExportedAt`, `copySlip.*`, temp ZIP | `lib/export/*`, `export.tsx` |
| C-S05 | C28-1 to C28-19 | BL-973 | `EXPO_PUBLIC_PRINT_BOOK` (card `_PRINT_READY`) | eng `killSwitches.printBook` (proposal) | `print_pdf_failed`, `print_pdf_disk_full`, `share_*` | one book's visible letters, stored copies, first labels | temp PDF | `lib/export/print-pdf.ts` |
| C-S06, C-S07 | NS-11-R2 to R4, R7, R8, R13 to R15, R22 | BL-942, BL-963 | `EXPO_PUBLIC_SAVE_A_COPY` | none | none | birthday, quiet, hidden, kept count (boolean), slip state | `copySlip.<child>.<year>` | Home slip registry (ADR 0033) |
| C-S08 | NS-08-R7, R8 | BL-965 (words) | `capabilities.sync`, `capabilities.backup` | none | none | sync status, last export, orphans | none | `where-live.logic.ts` |
| C-S09 | NS-08-R20, NS-10-R1 | BL-978, BL-937 | none (flip: `EXPO_PUBLIC_BACKUP`) | `killSwitches.backupUploads` at flip | none | `audioUri`, author, capture mode | none | `lib/provenance.ts` |
| C-S10, C-S11, C-S12 | NS-10-R0 to R14 | BL-922, BL-978, BL-987 | none | `serverFeaturesEnabled()`, `killSwitches.sync` | none shown | `sync_books`, watermark, consent gate | PRIV-R21 row, `newPhoneLine.dismissed` | `lib/first-run/*`, Book header |
| C-S13, C-S14 | NS-12-R1 to R8 | BL-979 | `EXPO_PUBLIC_EARLIER_VERSIONS` | `flags.versions` / `killSwitches.earlierVersions` | fetch failed | `entry_versions` (author) | new version; removal | letter page list (NS-21), new RPCs |
| C-S15, C-S16 | F12-REQ-011, NS-22-R3, R7 | BL-985 | none | none | quiet write failed | `Child.quiet`, hidden flag | same | `children/[id].tsx`, `store.ts` |
| C-S17 | NS-21-R7b, NS-36-R1a to R1c, NS-06-B25, NS-01-R16b | BL-954 (undo timing) | none | `killSwitches.photos` hides nothing here | erase failed | deleted letters and books | restore, erase | `recently-deleted.tsx`, `shelf.logic.ts` |
| C-S18 | NS-09-R6, R15 | P-4 (no row) | none | none (deletion never pausable, R17) | none shown | `discard.failures.*` | file delete | `storage.tsx`, launch sweep |
| C-S19 | D1, NS-36, NS-01-R52 | BL-961 | none | none | erase failed | everything local | erase mark | `erase.tsx`, `lib/erase-everything.ts` |
| C-S20 | D6, NS-01-R31, NS-10-R4a, NS-08-R16, NS-06-B18 | BL-965 | `EXPO_PUBLIC_ACCOUNT_DELETION` | server | offline, failed | books, roles, seals (boolean) | deletion request | `lib/account-deletion/*` |
| C-S21 | NS-08 (flip rows) | BL-976 | `EXPO_PUBLIC_BACKUP` (off) | `killSwitches.backupUploads`, `.escrow` | none new | backup status | consent row (flip) | `lib/backup/*` |

---

## 6. Components

Existing, reused: ListSection, ListRow, ToggleRow, Button (primary, secondary, quiet, destructive; sizes sm and lg), Card, Sheet, ConfirmSheet (`components/book/confirm-sheet`), StateScreen, Toast (with T4 timing via BL-954), BookCover, FailureCard (export), ErrorLine, AppNote, SignedOutCard, TextField.

New, proposed (each justified; specs go to `COMPONENTS.md` when built):
1. **Bottom actions: v2 N3 Toolbar (bottom), not a new component.** `Stack.Toolbar placement="bottom"` with one `prominent` item (glass layer). At AX3 and above any item whose label is a sentence moves into the content as an A1 `lg` button pinned in the bottom third (COMPONENTS N3), which is how NS-11's "action visible at AX5 without scrolling" is met. My earlier name StickyActionFooter is withdrawn (v2 retires `StickyFooter`). Used by C-S04, C-S05, C-S14, C-S11.declined, C-S20.
2. **SlipCard (proposed as a v2 C1 Letter card variant `slip`, or its own component if Karma prefers).** Content layer, never glass. The one Home slip shell for the registry (ADR 0033): card is the tap, one line, one optional quiet dismiss, one VoiceOver element with a custom action. Why: four slip types (A, B, C) would otherwise each draw their own card; the registry test needs one renderer. Shared with B-S17 and B-S18; area C proposes it, area A places it.
3. **InlineNote (with dismiss) (v2 has no match: F2 Banner is for system conditions and has no close; proposed as an F2 variant `note` with a close action, or a new C-level component).** Content layer. A plain text line at the top of a list with an optional 44 pt close button, no card chrome. Why: C-S12 must be "one line at the top until dismissed" and not a card (NS-10 design input); AppNote has no dismiss and is for a letter's own small line.

Not proposed: a progress ring, a lock or shield glyph, a count badge, any celebration.

---

## 6a. Materials (design system v2 policy, applied)

Source: `docs/design/system/BRIEF.md` section 3 (decided by Karma with the Chief Design Officer role, 20 Nov). Names follow `docs/design/system/COMPONENTS.md`, `FOUNDATIONS.md`, `tokens.v2.json` and `MOTION.md` once they land; the names below are this file's working names and are reconciled to those in Karma's pass.

| Surface in area C | Layer | Material |
|---|---|---|
| Tab bar (Me selected) | glass | system native tabs, regular |
| Navigation bar back and title buttons on every pushed page (C-S02 to C-S22) | glass | system navigation bar; scroll edge effect over the list |
| Settings lists: C-S01, C-S02, C-S04 rows, C-S08, C-S13, C-S15 to C-S20 | content | system grouped list (inset grouped), paper and `surfaceRaised` tokens, never glass |
| Sign-out sheet C-S03, every ConfirmSheet (erase, erase now, remove version, hide, stop backup), Which book C-S07, the consent sheet C-S11 and backup consent C-S21 | glass | system sheet (regular); half sheets inset from the edge; more opaque at full height; confirmation sheets originate from the control that opened them |
| Undo and outcome toasts in C-S17, C-S14 | glass | the undo toast surface (regular) |
| Bottom actions (C-S04, C-S05, C-S14, C-S11.declined, C-S20) | glass | v2 N3 Toolbar (bottom), one `prominent` item; at AX3+ sentence labels become A1 `lg` buttons pinned in content (solid) |
| Home slip C-S06 (SlipCard) | content | a card in the content flow on paper (`surfaceRaised`, hairline in dark); never glass |
| InlineNote C-S12, provenance line C-S09, FailureCard, StateScreen C-S10, error pages | content | paper and ink tokens; no material |
| Progress bars, letter words in C-S14, Recently deleted cards | content | tokens only |

Rules held on every screen here: at most three glass surfaces at once (nav bar, tab bar or toolbar, one sheet or toast); no glass inside glass (a sheet's buttons are plain sheet buttons, not glass capsules on glass); under Reduce Transparency or iOS earlier than 26 each glass surface becomes the solid token surface (`surfaceRaised`) with a `line` hairline, same shape and size; Increase Contrast steps borders and labels to their high-contrast tokens. The prototype renders glass this way (backdrop blur plus translucent token fill, solid with hairline under its Reduce Transparency toggle).

## 7. Accessibility walk (area C, NS-33)

- Dynamic Type to AX5 on 375 pt: every row wraps; no letter text appears in this area except C-S14 (letterBody, never truncated) and C-S17 excerpts (two lines that end in a fade; full words in the label, as built).
- VoiceOver: each page starts at its heading; confirm sheets put the safe choice first and on the escape gesture; progress has a text value and is announced at start and finish only; the new phone line and the slip are each one element.
- Voice Control: names equal visible labels ("Save a copy", "Not now", "Remove now", "Stay signed in", "Use these words").
- Switch Control: every control is a visible labelled button; T4 toast actions stay until the parent moves on.
- Smart Invert: the book cover and picture thumbnails are exempt; nothing else is an image.
- Bold Text: labels hold at Mukta Medium; no truncation.
- Reduce Motion: progress bars step, never animate; StateScreen drawing static; slip and row exits fade (MOTION.md).
- Colour never alone: caution cards carry a glyph and a heading; destructive buttons carry the word; provenance states are words.
- Targets: 44 pt minimum; primary 56 pt.
- Dark and Increase Contrast: token pairs only; `textMuted` 5.51:1 light, 8.01:1 dark; caution 4.75:1 light, 9.90:1 dark.

---

## 8. Specs superseded

- `docs/design/specs/06-HOME-BOOK-ME-IA-11nov.md` 5.1: the co-parent caption in Me (and its sheet, `07-COPARENT-COMING-SOON-11nov.md`) is superseded by the frame (no "coming soon" in any build). The section order is kept, with "Keeping your book" holding Save a copy and Where your letters live.
- `docs/design/specs/S17-NEW-PHONE-SPEC-10nov.md` 2.3 (arrival line not dismissible) and 2.5 (no "still arriving" line): superseded by NS-10-R13 (one line until dismissed) and NS-10-R2 (one line that more are on their way). 2.4's four letter-page cases stay, as C-S09.
- The built native sign-out alert: superseded by C-S03 (D1 text at AX5).

---

## 9. Card gaps (card row, what is missing, proposed default)

| # | Card row | Gap | Proposed default |
|---|---|---|---|
| G1 | NS-08-R8 | Names "the existing keep-safe card (C-REQ-018 Rev)"; it is not built (WP-F08-06 never built), and a Home card would be an unregistered slip | One permanent line on Where your letters live (C-S08), under "If you get a new phone"; no Home card; "shown once" read as "said in one place" |
| G2 | D1 (all cards), NS-08-R6 | The sheet tells the parent to "Use Erase everything", but the built row shows only on a phone that never signed in (`localDeletionAllowed()` is `syncOwner === null`); its body "We hold no copy" is false for a phone that synced | Show Erase everything whenever no one is signed in; body variant for a phone that synced; it also removes books of other accounts held on this phone (ADR 0031 proposal) |
| G3 | NS-11-R14 | Twins slip "leads to a chooser", but the copy is one file holding every book, so there is nothing to choose | Twins slip leads straight to Save a copy; C-S07 is used by the printable book only |
| G4 | NS-11-R3, R16 | "Saved" is not defined against the share sheet; the built code writes `lastExportedAt` before the sheet opens | Saved = the share sheet reports completion; cancel or failure marks nothing; "Last prepared" stays a courtesy date |
| G5 | NS-22 content inputs | Cites "the existing `children.quiet.*` keys"; none exist in `packages/content` (setChildQuiet has no UI and no words) | `content` writes PROPOSED keys (BL-965) |
| G6 | NS-22-R3 | Hide is built only for two or more books; the card does not say what a one-book parent gets | One book: Quiet present, Hide absent (hiding the only book leaves an empty app) |
| G7 | NS-11 content inputs, NS-07 C28 | Three names for one export ("Export your book", "Export everything", "Save a copy") across Me, erase, delete account and the beta note | One parent-facing name, "Save a copy", everywhere; content decides |
| G8 | NS-07 C28 | The ZIP's existing row says "A printable book for each child", while C28 says that PDF is for screens and the new file is the printable one | Rename the ZIP's PDF row ("The book to read on screen"); "Printable" only for C28's file |
| G9 | NS-08-R7, frame rule | Where your letters live shows "Encrypted backup: Not in this version", which reads as a promise of a later version | Remove the row while backup is off |
| G10 | NS-08 door lines, D12 | Built backup strings (`offBody` "What's backed up stays", `sheetNotIncluded` "yet") contradict D12 and imply a future | Rewrite before any flip (content, counsel Q43) |
| G11 | NS-12 | Silent on a Restore confirm and on an undo after Restore or Remove | Restore: no confirm, toast only (nothing lost); Remove: confirm with Keep it default, no undo |
| G12 | NS-08 design inputs | "Four provenance states" omits the built co-parent state ("kept on {signsAs}'s phone") | Five states (C-S09) |
| G13 | NS-10-R4b | Says "export works for what is on this phone" but not where the parent reaches it after declining | The declined screen (C-S11.declined) carries Save a copy and Delete account |
| G14 | NS-11-R2 | Window (7 days after, or the week around) is open | 7 days after (card default) |

## 10. Engineering gaps (and the backlog row they belong to)

| # | Gap | Row |
|---|---|---|
| E1 | Erase everything after sign-out on a synced phone (row visibility, body variant, erasing a held other-account book) | BL-961 (ADR 0031 proposal) |
| E2 | `shareExport` returns nothing; NS-11-R3 and R16 need completed vs cancelled (expo-sharing does not report it; a native activity result is needed) | BL-942 |
| E3 | The Storage stuck-recording row (NS-09-R6) has no backlog row (P-4 "not written" in PR #847) | new row under BL-977 or P-4 |
| E4 | NS-12 has no wave; `killSwitches.earlierVersions` does not exist in `KillSwitchesSchema` | BL-979; ADR 0029 proposal |
| E5 | Print flag name and kill switch (`EXPO_PUBLIC_PRINT_BOOK`, `killSwitches.printBook`) not in the registry | BL-973; ADR 0029 |
| E6 | Low Power Mode detection: no `expo-battery` in `apps/mobile/package.json` | BL-942, BL-973 |
| E7 | `setChildQuiet` returns void; NS-22's failed row needs a result | BL-985 |
| E8 | Delete account row requires `signedIn && accountReady`; a declined-Terms session must still reach it (NS-10-R4a) | BL-978 |
| E9 | `newPhoneLine.dismissed` must be account-scoped so B never inherits A's dismissal | BL-978, BL-961 |
| E10 | `copySlip.<child>.<year>` must be account-scoped (NS-11-R22) | BL-942, BL-961 |
| E11 | Disk-full screens need the needed size as a number in the result (never logged) | BL-942, BL-973 |
| E12 | Sign-out sheet moves from a native alert to a Sheet to hold the D1 text at AX5 | BL-961 |
| E13 | Provenance needs the "not on this phone" clause for a pulled own spoken letter (today it says nothing) | BL-978 |
| E14 | SlipCard (C1 variant) and InlineNote (F2 variant); N3 Toolbar adoption on settings pages (v2 row for `Stack.Toolbar`) | design-systems (v2 rows) |

## 11. Reconciliation with MOTION.md and WORDS.md (20 Nov)

Ids: DESIGN.md ids are the reference. MOTION.md uses a few other state names; Karma's pass renames them to these:

| MOTION.md | DESIGN.md | Note |
|---|---|---|
| `C-S02.signedout` | `C-S01.signedout` | after sign-out the parent is on Me (the signed-out card), not Account |
| `C-S04.shared` | `C-S04.saved` and `C-S04.cancelled` | G4 splits completed from cancelled |
| `C-S05.running` | `C-S05.making` | |
| `C-S10.loading` | `C-S10.opening` | |
| `C-S17.error-eraseKept` | `C-S17.error-erase_failed` | same built toast |
| `C-S20.default`, `C-S20.whatHappens` | `C-S20.what` | step 1 |
| `C-S12.dismissed`, `C-S20.loading`, `C-S20.sending` | adopted as new states here and in the prototype | |

Words: WORDS.md owns every string; the prototype now shows its PROPOSED text. Design changes taken from WORDS.md: the Me section heading is "Keeping your book" (not "Take the book with you": the book does not move to a new phone); the declined screen's button is "Save a copy" (22-character button limit); C-S14's heading is "Words from {date}"; the Me row carries the help line "Every letter, recording and picture, free, any time.".
Not taken, for Karma to settle:
- WORDS.md lists `en.settings.export.exportNudge` as a "Me card while never exported". DESIGN adds no card to Me (a nudge card in Me is a second keep-safe surface, against G1's one place); the line stays as the footer on Save a copy, as built.
- WORDS.md words Quiet as an action ("Turn off Quiet") with toasts. In Me, C-S15 uses a switch whose position is the state, so no toast; the action words and toasts fit the Book's end menu (B-S02, area B).
Material: section 6a applies the design system v2 policy; names will follow `docs/design/system/COMPONENTS.md` once it lands (only BRIEF.md existed at the time of this pass).

v2 component names (from `docs/design/system/COMPONENTS.md`, read after it landed) used in this file and the prototype: N1 Tab bar, N2 Navigation header, N3 Toolbar (bottom), N7 Sheet, A1 Button (styles `prominent`, `glass`, `plain`, `destructive`), C2 Letter page list (holds C-S09 and the Earlier versions row), C8 State screen (C-S10, C-S19.erasing), F1 Undo toast, F2 Banner (C-S04 offline only), F3 Progress (C-S04, C-S05), F6 Confirmation sheet (C-S03 `three`, C-S14, C-S15 hide, C-S17, C-S19, C-S20 `typed`, C-S21, C-S22 `typed`), I5 Toggle (Quiet this book). Changes this caused:
- Confirmation sheets put the safe choice as `filled` `lg` and default, and the destructive choice as `destructive` text (F6); the prototype follows.
- C-S03 is F6 variant `three`: "Stay signed in" (safe, filled), "Sign out", "Sign out and erase this phone" (destructive text, signs out then opens C-S19's confirm). This gives the D1 line's "Use Erase everything" a door in the same sheet and narrows card gap G2 to the body wording. WORDS.md needs one key for the third choice.
- F3 Progress is a 4 pt track with a text value ("About half") announced at most every 10 s.
