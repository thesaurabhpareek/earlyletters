# Area C. Keeping and trust: end-to-end design

Status: DRAFT v2, 20 Nov 2026 (second pass: reconciled to the FINAL product requirements). Design lead, area C (design-systems role, Claude session). Docs only; nothing here was run on a phone. v1 was reconciled with MOTION.md and WORDS.md (section 11); v2 re-keys to the final pack and adds sections 12 to 18 (re-key, function needs accounted for, motion for new states, contradictions, card and engineering gaps, open design questions).
Motion (`MOTION.md`) and words (`WORDS.md`) in this folder key to the ids below. Ids are stable; a new screen takes the next number, never a reused one. v2 adds C-S23 (Privacy), C-S24 (Days), C-S25 (Browse days), C-S26 (Day detail), and states on C-S01 to C-S04, C-S06, C-S10, C-S18 to C-S20.
Prototype: `PROTOTYPE.html` in this folder (self-contained, light and dark, text-size toggle to AX5, state switcher per screen).

What changed in v2, in one paragraph: the final pack put NS-38 to NS-45 in card 19 (NS-45, account life after first run, now owns the sign-out, session-ended, deletion and update-line behaviours drawn on C-S01 to C-S03, C-S19 and C-S20) and added cards 21 and 22 (NS-46 Days, NS-47 optional cultural background and the lock-screen rules, NS-50 Home today). The Me tab is regrouped (adopted for design, built only after tree test T1, R-IA-4), with a fallback place for the Days row before T1. Storage shows one state line, never a list (errata E28). Reminders are "reminders", never "notes". Section 12 lists every old id and what it became.

Sources, in the order of the brief: the locked cards `08-keeping-and-trust.md` (NS-08 to NS-12), `07-remaining-capability-rows.md` section 4 (NS-07 C28), `11-foundations.md` (NS-36), `10-reading-and-family.md` (NS-21, NS-22, NS-23 where they touch Me), `06-firsts-sealed-letter-quick-capture.md` (D6 and B25 lines), `01-photo-with-a-letter.md` (R29 to R31), under `00-product-frame.md`; `14-test-plan.md` journeys J-N1, J-N2, J-N8, J-N9, J-N19, J-N21, J-N25; `16-council-review-round-2.md` (T2, T4, D1, D6, D7, D8, D12, D13). Engineering: `13-engineering-plan.md`, the plan in PR #847 (`17-engineering-project-plan.md`, read 20 Nov through `gh api`), backlog rows BL-922, BL-925, BL-926, BL-942, BL-961, BL-963, BL-965, BL-973, BL-976 to BL-979, BL-985, BL-987, and `/home/claude/review/eng/C-platform-quality-delivery.md` (ADR proposals 0029, 0031, 0033, 0037; error code sets 4.2). The app as built on this worktree: `app/settings/*.tsx`, `app/(tabs)/you.tsx`, `lib/provenance.ts`, `lib/export/device.ts`, `lib/store.ts`, and the strings in `packages/content/src`.

Final-pack sources added in v2 (read 20 Nov on `docs/locked-pack-inputs-20nov`, HEAD cfeca754e): `22-final-holistic-spec.md`; `21-days-cultural-photos-home.md` (NS-46, NS-47, NS-50 rows as final, after the ten reviews); `19-from-download-to-first-letter.md` (NS-45 in full; NS-41 and NS-42 for C-S10 and C-S11); `18-errata-after-lock.md` (E18 blank snapshot, E20 local flag family, E21 kill-switch header, E27 BL-961 dependency, E28 Storage line); `GAP-LOG.md` (K1 to K17, R-IA-1 to R-IA-6, CB-1 to CB-6, DL-1 to DL-10, N-1 to N-8, RV-1 to RV-17); `FUNCTION-TRACE.md` section 6.3 (function needs for area C); `docs/design/e2e/IA-AUDIT.md`; the reviews `tools/review/ns46-50/design-systems.md`, `content.md`, `security.md`, `privacy.md`.

Words in quotes below are the strings that exist today (by key) or intent for `content`; every new string is a PROPOSED key owned by `WORDS.md`, and the founder approves words before any build outside his family shows them. Parent-facing words follow the glossary: "reminder" never "note" for what the app sends (RV-3), "Days you added" and "Days you chose" (never "a day we mark"), "photo" as one word in the picture start, "Not today" on a day slip.

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
| C-S01 | Me (Look after), the tab root; `.default` = groups as built plus the Days row under Reminders (the fallback before tree test T1); `.regrouped` = the IA-AUDIT regroup (after T1) | `app/settings/index.tsx` via `(tabs)/you.tsx` | frame 4; NS-11-R1; NS-22-R3; D1; NS-45-R3, R13; NS-46-R3; R-IA-2, R-IA-4; BL-927/928 heading |
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
| C-S18 | Storage (languages, space, and one state line when a recording is still being removed; never a list, never a count) | `app/settings/storage.tsx` | NS-09-R6 as ruled by errata E28; NS-11-R20 |
| C-S19 | Erase everything on this phone | `app/settings/erase.tsx` | D1; NS-36 erase row; NS-01-R52 |
| C-S20 | Delete account | `app/settings/delete-account.tsx` | D6; NS-01-R31; NS-10-R4a; NS-08-R16 |
| C-S21 | Recording backup (flip-only states; absent today) | `app/settings/backup.tsx` (flag off) | NS-08 sections 4, 5, 12, 15 |
| C-S22 | Delete this book | `app/settings/children/delete-book.tsx` | F17 6.2 D (built); NS-36 |
| C-S23 | Privacy (Me, Privacy) and its sheet `.withdraw` ("Stop syncing letters") | `app/settings/privacy.tsx` (built; withdrawal not built, BL-485) | FR-PRV-01, FR-PRV-33; FR-CMP-16; K9 (id taken by privacy) |
| C-S24 | Days (one page: Days you added, Days you chose, Browse days, the day-name switch, Clear all) | none | NS-46-R3, R26, R40; NS-47-R14, R21, R29; NS-18 (typed days move here, D-S08 and D-S09 reused) |
| C-S25 | Browse days (sheet, with the optional tradition and country pickers and the DoorNote) | none | NS-46-R20, R41; NS-47-R2, R20, R25, R29, R30, R35 |
| C-S26 | Day detail (pushed from C-S24 only: date, Move this date, Remove) | none | NS-46-R14, R15, R26; NS-47-R21 |

State suffixes on every screen: `.default`, `.empty`, `.loading`, `.offline`, `.error-<code>`, `.killswitch`, `.lapsed`, `.second-account`, `.signedout`, `.ax5`, `.vo` (VoiceOver order), `.dark`. Screen-specific states are listed per screen in section 3 and in the table in section 4.

Cross-area keys (v2 additions first): A-S01 states `dayToday`, `daysAsk`, `quietDay` are area A's, drawn with the C9 slip host variants `daySlip` (rank 2b) and `askSlip` (rank 3b); C-S06 is the `saveSlip` (rank 3) and section 3 holds the three anatomies side by side; D-S06 loses the typed-day list (it moves to C-S24) and the day-name switch (it lives on C-S24, RV-13); D-S08 and D-S09 are reused unchanged inside C-S24; D-S10 `libraryDay-*` states and the D-S06 denied card are area D's and reused; E-S16.line (update required) and the `session_expired` line sit at the top of C-S01. Earlier keys: B-S02 (the Book's end menu with Quiet and Hide) is area B's and calls the same store functions as C-S15; B-S21 (the past-letters switch) and D-S06 (Reminders) are rows inside C-S01 drawn by their areas; B-S22 (the sealed row with no words) sits inside C-S17; E-S07 and E-S09 share components with C-S11 and C-S10 (E owns first run; C owns every NS-10 state); E-S18 (account mismatch) is the system side of `C-S01.second-account`; A-S11 (Let it go confirm) feeds C-S18's stuck-recording row.

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
- U2 A higher slip is due (a waiting card, the seal-opened line, or a day the parent chose today): this slip waits; at most one slip shows. Final order (NS-50-R5, RV-5): (1) waiting set, (2) seal-opened, (2b) a day the parent chose today, (3) Save a copy, (3b) the Days ask, (4) one past letter. Known cost, accepted in NS-50 section 3: on a day-slip day in the birthday week Save a copy waits for the next Home visit that day or the next day.
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
3. Tap Sign out: `C-S03.default` opens (a sheet, not a native alert, so it can hold the D1 sentences at AX5 and name pictures): heading "Sign out on this phone?"; the D1 lines: "Your letters and recordings stay on this phone. Anyone who opens the app here can read them. Use Erase everything to remove them." (intent; once photos are on: "letters, recordings and pictures", NS-01-R30); buttons "Stay signed in" (filled, first, default, escape), "Sign out" and "Sign out and erase this phone" (F6 variant `three`, see section 11). v2 adds two optional lines and one action (section 3, C-S03): when at least one day is ticked, one line that days chosen on this phone are cleared (FR-CUL-15, NS-47-R15); and while App lock is off, a plain "Turn on App lock" action under the D1 lines (FR-SEC-07).
4. Tap Sign out. If nothing is waiting: signed out; `C-S01.signedout` (the signed-out card, Plan, books, and "Erase everything on this phone" now present in Your letters, see card gap G2).
5. Every recording file is still on the phone (R6; J-N21).

Unhappy paths:
- U1 Letters (or a discard, NS-09-R12) still to send (NS-45 happy path puts the waiting sentence inside the sheet): `C-S03.waiting` swaps the sheet's text to the waiting line with "Stay signed in" first and "Sign out now" quiet; closing it leaves `C-S02.waiting` on the page: "Your newest letters are still on their way. This phone signs out once they are sent." (built `signOutWaiting`) with a static indicator and "Sign out now" quiet (built path; then `signOutEarly` line on the signed-out card).
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
3. `C-S19.confirm`: ConfirmSheet "Erase everything on this phone?" / "This cannot be undone." with "Keep everything" (default, first) and "Erase". After "Erase" the system owner check runs (Face ID or passcode, FR-SEC-06): `C-S19.ownerCheck`; cancelling it returns to the confirm unchanged (`C-S19.ownerCheckCancelled`, no message). A phone with no passcode skips the check (open question OQ-6).
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

1. After a Let it go whose file delete has failed on 3 launches (A-S11 feeds this), `C-S18.stuck`: Storage gets one row at the top: one state line (errata E28: "A recording is still being removed", intent; no date, no name, no text, never a list of recordings, never a count, even when several are stuck) and one "Remove now" button of 44 pt. `Remove now` retries once (NS-09-R6): `C-S18.retrying` holds the button's place with a static busy label.
2. Remove now succeeds: the row leaves (exit per MOTION.md); no toast, no celebration.
3. Remove now fails again: `C-S18.stuckAgain`: the row stays, the same line, VoiceOver re-reads it, and one short in-place line says the app will finish removing it (GAP-LOG C M-5, W12; no "we", no error word).
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

### J-C16. Choose days from the Days page (NS-46, NS-47; flag `EXPO_PUBLIC_DAYS`, pause `killSwitches.libraryDays`)

Happy path:
1. `C-S01.default`: tap "Days" (directly under Reminders before tree test T1; in "Days and reminders" after it). Two taps from the tab. A parent can also arrive from the Home ask slip (A-S01.daysAsk, "Choose days"), which opens the same page.
2. `C-S24.empty`: the DoorNote at the top (never collapsed, never dismissible), then the rows "Browse days" and "Add a day". No heading "Days you chose", no empty-state words, no count (NS-46-R3, R19).
3. Tap "Browse days": `C-S25.default` rises as a sheet over C-S24. DoorNote full form first; the one reminder line ("A reminder arrives on that day. Unticking a day or Clear all stops it.", intent, NS-46-R35) while nothing is ticked; groups in the ruled order (seasonal and shared, family, civic, traditions), at most 5 rows per group with "Show more" (R41 design-set number).
4. Tick Thanksgiving: the row changes (check shape, weight, VoiceOver value "ticked"); `H-select`; no toast, no count (NS-46-R41). If notification permission is undetermined, the first tick makes the one iOS ask after the reminder line (NS-46-R31); a refusal is final and one calm line shows on C-S24.
5. "Done" (or swipe down, the VoiceOver escape gesture, Back: all equal, nothing lost, NS-46 review F47-4). `C-S24.default`: "Days you chose" now lists the day with its date, the day-name switch appears under the list, "Clear all" appears.

Unhappy paths and rules:
- U1 Nothing ticked and the sheet closed: only the `culture.asked` flag is written, with the same value as after "Not now" (NS-47-R2). The browse filter is component state: reopening Browse starts blank.
- U2 A moving day: ticking it shows `C-S25.whichDate`, one inline row "Dates differ by country. Which date should we use?" with one row per authority and "I will pick my own date" (an inline date row, never a second sheet, NS-46-R41); the day shows "around {date}" until chosen; the first authority's date is the default (NS-46-R14).
- U3 No date for next year: the row on C-S24 carries "{day}: no date for next year yet." in `footnote` `textMuted`, no glyph, no count (NS-46-R15).
- U4 Library store unreadable (`days_store_unavailable`): `C-S24.store-unavailable`: typed days stay visible; in the library section one in-place line with "Try again", announced politely once, no red (NS-46-R40). "Browse days" is replaced by that line until it succeeds.
- U5 Notifications not allowed in iOS Settings: ticking still works; the D-S06 `.denied` card is reused (one per screen) saying nothing arrives until notifications are allowed; no promise of delivery (NS-46 section 5). The Days ask slip is not shown when permission is denied (NS-47-R19).
- U6 Reminders switched off: ticked days still send a reminder; one calm line on C-S24 (and one on D-S06) says so and where to stop it (NS-46-R35, Q-FD-21).
- U7 App lock on: the day-name switch is present and disabled with its reason line; the effective value is `stored && !appLockOn`; turning App lock on stores off; turning it off never turns it on (NS-47-R12). State `C-S24.dayNames-appLock`; after App lock goes off the switch reads off with no message (`C-S24.dayNames-released`).
- U8 Quiet book, hidden book, `celebrations_paused`: the Days page itself is unchanged; Home shows no day slip and no reminder is sent (NS-46-R25, R49). C-S24 does not say so (no gap line).
- U9 Pause on (`killSwitches.libraryDays`): at the next focus the library sections, Browse, the switch and Clear all are absent; "Days you added" and "Add a day" stay (typed days are unaffected, NS-46-R28). Never changes under a finger.
- U10 Session ended by the system (not the parent): the store was cleared; the next time C-S24 opens, one calm line says the list was cleared when the session ended and they may choose days again; no count, no "you lost" (NS-47-R15, Q-FD-12). State `C-S24.sessionCleared`.
- U11 Clear all: F6 `explained` sheet "Clear all days you chose?" with the safe choice "Keep my days" filled and default; "Clear all" destructive text; every tick, pending reminder and delivered reminder goes at once (NS-47-R21). No Undo (re-ticking in Browse is the way back); no toast.
- U12 Signed out after a sign-in: the Days row is absent until sign-in (the store is per account and was cleared; see card gap G18). A build with no sign-in at all uses the single local owner and shows the row.
- U13 Second account: B sees nothing of A's days and is never told they existed (NS-47-R15; [X4-R1]).
- U14 Offline, plan lapse, servers off: identical to default; nothing here uses the server (NS-46 section 6).

### J-C17. The optional cultural background (NS-47)

Happy path: the Home ask slip (area A) asks once, in a later sitting after the first kept letter, "Would you like a reminder on the days that matter to your family?" with "Choose days" and "Not now" as two equal `bordered` buttons, stacked. "Choose days" opens C-S24 (empty) and the parent taps Browse (J-C16).
1. In `C-S25.default` the "Traditions" group carries the word "Optional" beside its heading (VoiceOver: "Traditions, optional") and its help line "Pick any that fit. You can pick more than one." The rows are alphabetical, equal visual weight, nothing preselected, no "Eastern" option (NS-47-R20, Q-FD-1). The first row is "Not now", the same row style and size as the others (the decline control of NS-47-R30; it writes nothing and moves focus to the next group).
2. The parent picks a tradition: `C-S25.traditionPicked`. The pick is a browse filter held in memory; that tradition's days come first in the list below (NS-46-R20). Only ticked days are ever stored.
3. The country group ("A country that matters to your family", Optional) is absent, not greyed, until a second country ships (NS-47-R35).
4. A day not on the list: "Add a day" (one door, NS-18's flow, writing tools off on the name field, D2) closes the sheet and opens the add flow on C-S24.

Unhappy paths: "Not now" on the Home slip (final for Home; Me, Days stays reachable); the ask shown on two Home opens without an answer retires to Me (NS-47-R31); a phone whose permission is denied never sees the ask; App Review fallback (CUL-Q8: plain browse-and-tick list, no ask slip, no pickers) is a flag state `C-S25.fallbackNoQuestion` with the same screen minus the Traditions and country groups.
Never shown: any "your religion" or "your tradition" label, any count of ticked days, any default derived from locale, storefront or time zone, a stored "Prefer not to say".

### J-C18. A day's detail (NS-46-R14, R15, R26)

1. `C-S24.default`: tap a row under "Days you chose" (one VoiceOver element "{name}, {date or around date}", chevron hidden).
2. `C-S26.default` (pushed): the day's name as the title, its date ("around {date}" for a moving day), "Move this date" (an inline date row with a choice group under it: "Just this year" selected, "Every year"; stacked at AX1 and above), and "Remove" (destructive text, one tap, no confirm: it unticks and cancels its reminder; Browse re-ticks it).
3. Moving the date records the parent's own date; the table is never edited (DL-3). `C-S26.authorities` shows the same "Which date should we use?" rows where authorities differ.
4. A quiet-tone day (Memorial Day, Veterans Day, Good Friday, Yom Kippur) looks identical here: the tone cannot be seen or changed by the parent (NS-46-R16); no prompt or preview line is drawn.
5. Remove leaves for C-S24 with the row gone (`m.list.remove`). Swipe action on the C-S24 row and a VoiceOver custom action "Remove" do the same.

### J-C19. Withdraw syncing from Privacy (FR-PRV-01, FR-PRV-33, FR-CMP-16)

1. `C-S01.default`: Privacy. `C-S23.consentOn`: the promise line (only while every sentence has a claims row true of that build), where the book is kept, the iPhone backup line, the sensitive-data row now pressable, Who can see it (App lock row, Names in notifications row), What you can do (Save a copy, Recently deleted; Erase everything when no one is signed in), the two documents.
2. Tap the sensitive-data row: `C-S23.withdraw` (a sheet, two taps from Me): what stops (new letters stop syncing; the other parent stops receiving new letters), what stays (the book on this phone; letters already on the server until the parent deletes them or the account), plain rows "Save a copy" and "Delete account", then two equal `bordered` buttons, "Cancel" first and default, "Stop syncing". Cancel changes nothing and records nothing.
3. Stop syncing records one PRIV-R21 row (`withdraw`, `settings_toggle`, `privacy_settings`); the row reads "Not syncing"; Account's Sync row follows. Nothing is deleted by the act. `C-S23.consentOff`: tapping the row offers to agree again through the returning consent sheet (C-S11), default pending ruling (card gap G19). `C-S23.consentWaiting`: the row reads "Waiting" and opens C-S11.

### J-C20. A session that ends, an account that is limited, a deletion elsewhere (NS-45-R3, R13; FR-BKO-26; FR-LCY-19)

- Session ended (revoked refresh, Sign out other devices elsewhere, forced epoch, Apple link revoked): the phone signs out once after uploads; `C-S01.sessionEnded` shows one line at the top of Me, once: "You were signed out. Sign in again to carry on." (built `session_expired`). Home is unchanged; reading, recording and export never wait (NS-45-R3).
- Update required (`minSupportedVersion` or 426): `C-S01.updateRequired` shows E-S16.line at the top of Me only, with "Open the App Store"; never on Home, never blocking (NS-45-R13). One SystemLine per screen: if both apply the update line shows (default; open question OQ-8).
- Suspended or limited account (FR-BKO-26): `C-S02.suspended` shows one neutral line (not "banned", no reason), sync waits, the book stays readable, Save a copy and Delete account stay reachable. No state implies the data is gone.
- Deleted on another phone while this one is signed in (FR-LCY-19, NS-45 section 5): signed out once; `C-S01.deletedElsewhere` shows once "This account was deleted on another phone. You can start a new book here." The whole book stays readable, playable and exportable; unsent letters are kept.
- Restored from a device backup (FR-LCY-09): `C-S01.signedout` reads as normal (the same card as after a sign-out), not as a fault: no caution colour, no glyph.

### J-C21. Delete account, v2 lines (NS-45-R5, K4; FR-PRV-18, FR-LEG-02, NS-47-R17)

`C-S20.what` lists, one line each (nothing truncates at AX5, see section 3): the intro and 30 days; one line per book; hidden-until letters are deleted and never open (D6, only when one exists); pictures and recordings stay on each phone until that phone is erased; the retained-data lines of FR-PRV-18 (the 31, 38 and 45 day clock, the sent-email copy kept to about day 60, the kept-author book entry, saved copies and iPhone backups are the parent's own, consent records kept 3 years, Plus billing continues through Apple); the days line when a day is ticked ("Days you chose stay on your phones and are cleared with your account.", `culture.delete.line`); "Keep a copy first" card; the Plus card only when Plus will renew; and a link row "How deleting works" (the web page `brand.web.deleteAccount`, FR-MSG-34, FR-SUP-14). No order-in-flight line exists in 1.0 (FR-PRT-01: no order feature).

---

## 3. Screens: layout, components, states

All sizes are design-token values: gutters `space.5` (20 pt) on settings pages, section gap `space.7` (28 pt), row min height 44 pt (`target.min`), primary button 56 pt (`target.primary`), radius `md` 14 for cards and list groups, `pill` for buttons. Type: page titles `title1` (Literata Medium 28), section headers in title-style capitalisation (`subhead` muted, not upper-cased; system grouped list style, design system v2 brief section 1), row titles `label` (Mukta Medium 18), row subtitles `subhead` muted, notes `footnote` muted, letter words `letterBody` (Literata 20/32). Colours by token only; the prototype copies the light, dark and Increase Contrast values from `packages/design-tokens/src/tokens.ts`.

AX5 rule for every list row in this area (ListRow at accessibility sizes): the title wraps without truncation; a trailing value moves under the title, left-aligned, muted; the chevron stays at the trailing edge, vertically centred; destructive rows keep their word. Buttons stack full width with 12 pt between them, primary first in reading order.

### C-S01 Me (Look after)

Default layout (`.default`, SE 3, 375 pt; this is the arrangement that ships first, with the Days row in the fallback place):
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
[ Days                            > ]  (C-S24; no value, never a count; fallback place before T1)
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
`.regrouped` layout (adopted for design by R-IA-4 and card 22 section 3; built only after tree test T1 shows it finds each task at least as often as `.default` and not worse on "keep safe" tasks). Working group titles for `content` (RV-3: "reminders", never "notes"):
```
Me
[ Account card ]  [ Plan ]                       (header, no title)
Books           each book, Add a book, Hidden books (only while one is hidden)
Writing         Spoken language, Your words, Appearance
Days and reminders   Reminders, Days, Past letters on Home     (working title, T1 candidate)
Keeping your book    Save a copy, Where your letters live, Recently deleted, Storage
On this phone        App lock, Privacy
(no title, last)     Erase everything on this phone (no one signed in) / Delete account (signed in)
Help and legal       Help (Write to us), If you are struggling, Legal
About                Version
```
Net against `.default`: 0 rows deleted; 9 groups to 9 groups; Reminders, Days and Past letters on Home leave Writing for a group of their own; Storage and Recently deleted join Keeping your book (the old "Your letters" group is absorbed); App lock and Privacy form "On this phone"; the two destructive rows sit together, untitled, last (a title would read as a warning). About 21 rows at default type. Spoken language stays (card 22: "no row is deleted"; the audit's idea of hiding it in English-only builds is not ruled, OQ-3). One tap to any row stays (IA NX-30a); nothing nests. `.default` ships first because the regroup waits for T1; the Days row moves with its page unchanged.

Rows that depend on state: Days is present when `EXPO_PUBLIC_DAYS` is on and (signed in, or a build with no sign-in); absent when signed out after a sign-in (G18). Delete account is present whenever signed in and `EXPO_PUBLIC_ACCOUNT_DELETION` is on, including a declined-Terms session (E8, NS-45-R7). Help and legal is drawn in every state, including "If you are struggling" in every build (FR-LOC-18) and the Help row's "Write to us" (FR-SUP-01).

Change from built: a "Me" heading (BL-927/928); a new section "Keeping your book" holding the one export row (renamed "Save a copy") and Where your letters live (moved from Your letters); Erase everything also shown when signed out after a sign-in (G2, E1); the Back up row absent while backup is off (as built); no co-parent caption (the 11 Nov "coming soon" caption is superseded by the frame and the brief).

States: `.default` (signed in; the fallback grouping), `.regrouped` (after T1), `.sessionEnded` (one line at the top, once, NS-45-R3), `.updateRequired` (E-S16.line at the top, NS-45-R13), `.deletedElsewhere` (one line once, FR-LCY-19), `.signedout` (signed-out card with Sign in; Erase present; also the state after a device restore, which reads as normal, FR-LCY-09), `.local` (no sign-in build: "On this phone" card, no Delete account), `.second-account` (B's books only, nothing of A's), `.killswitch` (servers off: as `.local`; Delete account absent; every keeping row present), `.lapsed` (Plan row "Free" with its line; every keeping row works; no gate in this area), `.offline` (no row changes; rows that need the network say so on their own screens), `.ax5`, `.vo`, `.dark`.
VoiceOver order: heading "Me", account card, Plan, then each section title (as heading) and its rows top to bottom. Voice Control names equal visible titles.
Components: ListSection, ListRow, ToggleRow, SignedOutCard (all built).
Integration: NS-11-R1, NS-22-R3 (Hide in Me), D1; BL-942 (Save a copy row), BL-927/928 (heading), BL-985 (Quiet), BL-961 (Erase after sign-out); flags: `EXPO_PUBLIC_ACCOUNT_DELETION`, `capabilities.backup`; kill switch: none of its own; data read: children, plan, auth state, sync owner; module: `app/settings/index.tsx`, `components/settings/settings-home.logic.ts`.

### C-S02 Account

Layout as built: method line, Sync row, "Finish setup" when consent is outstanding, "Sign out other devices" with its footer, then "Sign out" alone at the end. `.waiting` replaces the Sign out row with the waiting line and a static indicator (no loop under Reduce Motion) and "Sign out now". `.offline`: Sign out of other devices disabled with its reason as the footer ("Needs a connection."). AX5: rows wrap; Sign out stays 44 pt.
v2 states: `.suspended` (FR-BKO-26: one neutral line, an E-S15 SystemLine, no reason and no word like banned; the book stays readable, sync waits, Save a copy and Delete account stay reachable; nothing implies data is gone); `.syncStopped` (after C-S23 withdrawal the Sync row reads "Not syncing"). "Sign out other devices" is the pointer for "someone is in my account" (FR-SUP-13): support never changes sign-in by hand; no new screen.
Integration: D1, NS-45-R1 to R4, R18, NS-08-R6, R15 (flip), NS-09-R12; FR-BKO-26, FR-SUP-13, FR-SEC-12; module `app/settings/account.tsx`, `lib/auth/session-provider.tsx` (`signOut({ scope: 'local' })`), `signOutWouldWait`.

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
v2 additions (inside the same sheet; the D1 lines stay first): when at least one day is ticked, one line "Days you chose on this phone are cleared." (FR-CUL-15; content words it; shown only when true, so it is a build-truth line); while App lock is off and the phone can use it, a plain 44 pt "Turn on App lock" action directly under the D1 lines (FR-SEC-07, FR-SEC-25: offered in Me and here only, nothing at the end of first run); tapping it closes the sheet like "Stay signed in" and opens App lock. Every delivered library-day reminder is dismissed at sign-out (NS-47-R15; no screen).
States: `.default`, `.photos` (names pictures, NS-01-R30), `.days` (the days line), `.appLockOffer`, `.waiting` (NS-45 happy path: after Sign out, if ops are pending, the sheet text swaps to "Your newest letters are still on their way. This phone signs out once they are sent." with "Stay signed in" first and "Sign out now" quiet; closing it leaves C-S02.waiting), `.ax5` (the two buttons stack under the scrolled text and stay reachable), `.vo` (heading, body, Stay signed in, Sign out; escape gesture = Stay signed in), `.dark`.
Integration: D1, NS-45-R1, R2, R18, NS-08-R6 (P0), NS-01-R30, NS-47-R15, X4; FR-PRV-15, FR-SEC-07, FR-CUL-15; BL-961 (words via BL-965); no flag; no kill switch; records nothing (door line).

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
v2 states and lines on `.ready` (C-S04 and C-S05): one `footnote` line "Anyone who has this file can read and hear everything in it." (FR-SEC-08, intent); on C-S05 one plain line saying what the printable file is and is not, with a help link (FR-PRT-02, FR-PRT-03; "Printable", never "print-ready", no order words, FR-PRT-01); in a book whose letters are not English, one line that the app is in English (FR-LOC-13). New `.parts` (FR-LCY-21): above 2 GB the copy is made in parts, each a complete readable archive; `.ready` says once how many parts there are, never a count of what is missing; until the split ships `.error-tooBig` stays and its words say what happens next only if support has a real answer (FR-SUP-07). "What is inside" stays words with no numbers (FR-DAT-13); the copy never says it restores a book (FR-LCY-12). The list of days is not in the copy: that one line lives on C-S24 (NS-47-R10). If FR-PRV-21 takes the manifest option, one line says server-held earlier versions are not in the copy.
Integration: NS-11-R1, R5, R6a, R6b, R9 to R12, R16 to R21, R23, R24; NS-10-R4b; NS-36-R2; C28-1; BL-942, BL-933 (pictures in 1.7.0), BL-973; flags `EXPO_PUBLIC_SAVE_A_COPY` (slip only; the screen is always there), `EXPO_PUBLIC_PRINT_BOOK`; kill switch: none (a right); codes: `ExportLowSpaceError` (lowSpace), `ExportTooLargeError` (tooBig), other, `ExportCancelledError` (stopped), `share_cancelled`, `share_failed`, `temp_cleanup_failed` (never shown; sweep backstop); data read: every book on this phone for this account, `lastExportedAt`; written: `lastExportedAt` (after completion only, G4), `copySlip.<child id>.<year>` = saved; module `lib/export/*`, `app/settings/export.tsx`.

### C-S05 Making the printable book

A pushed page (not a sheet) so it survives the app going to background: cover, "Making your book" (title2), the stepped bar with a text value, the Low Power line when on, Stop. `.ready`: "Your printable book is ready." and Save or share. Errors in the FailureCard: `.error-print_pdf_disk_full` (with size), `.error-print_pdf_failed`, `.error-share_failed`. The PDF itself is always light (C28 dark row); the screen follows tokens.
Integration: C28-1 to C28-19; BL-973; ADR 0037 proposal; flag `EXPO_PUBLIC_PRINT_BOOK` (card: `EXPO_PUBLIC_PRINT_READY`); kill switch: none by card (eng proposes `killSwitches.printBook`, which would hide the row only); module `lib/export/print-pdf.ts`.

### C-S06 Home slip: Save a copy

A card in the slip place on Home (A-S01 owns placement): `surfaceRaised`, radius `md`, 16 pt padding, `callout` line, a small BookOpen glyph decorative (hidden from VoiceOver), "Not now" quiet text button at the trailing bottom. The whole card is the tap (opens C-S04). One VoiceOver element: label = the line, hint "Opens Save a copy.", custom action "Not now"; the visible "Not now" is also a button for Voice Control and Switch Control.
AX5: the line wraps to as many lines as it needs; "Not now" drops to its own line, 44 pt high.
Slip anatomies, side by side (the C9 slip host is area A's; shared with A-S01 and B-S17, B-S18). Same shell for all: content layer, `surfaceRaised`, `radius.md`, 16 pt padding, `callout` in `text`, never glass, at most one slip at a time (NS-50-R11).
| Slip | Rank | Whole card is | Controls | VoiceOver | Dismissal means |
|---|---|---|---|---|---|
| `saveSlip` (this screen) | 3 | the tap (opens C-S04) | quiet "Not now" | one element, label = the line, hint "Opens Save a copy.", custom action "Not now" | gone for the year |
| `daySlip` (NS-50) | 2b | not interactive (no destination) | separate 44 pt "Not today" (its own key); its own row at AX3 and above | one non-interactive element "{name}. {line}", custom action for the dismissal, hint "Hides this until tomorrow", no nested interactive child | leaves until the next local day, no haptic, not an answer to anything |
| `askSlip` (NS-47, rank 3b) | 3b | not interactive | two `bordered` buttons of the same style and size, "Choose days" and "Not now", stacked at every size, neither `filled`; the short DoorNote under the question | question, short call-out, then both buttons; hint on "Not now": "Closes this question. You can still choose days in Me." | final for Home; retires to Me after two unanswered showings |
On an SE 3 at the default text size the ask must leave the prompt's full text visible above the capture cluster, or sit below it (device check, NS-47-R32). Motion for all three: section 15 (T-SLIP). Not promotional: no feature name, "new", count or price (NS-50-R16, FR-MKT-24 as reworded).
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

As built (speech languages, downloads, cellular) with one new row at the top, only while a delete has failed on 3 launches (NS-09-R6; errata E28 overrides v1's "one row per recording"): a single state line, "A recording is still being removed" (intent), with one "Remove now" button (Button `quiet` size `sm`, 44 pt hit area). It is one line and one button however many files are stuck: never a list of recordings, never a count, no date, no name, no text. `Remove now` retries once. States: `.stuck`, `.retrying` (the button keeps its place and shows a static busy label, no spinner; `m.swap`), `.stuckAgain` (the line stays; VoiceOver re-reads it; one short in-place line says the app will finish removing it; no error word), `.lowSpace` (the E-S17 card leads here and the stuck line is first), `.default` (row absent), `.ax5` (the button moves under the line, 44 pt), `.vo`, `.dark`. `storage.tsx`'s comment "letters and recordings never appear here" is amended to "never listed or counted" (E28). The built list of downloads, language rows and the cellular switch are unchanged (FR-REL-37 asks for a size per kind: the existing "Total" and model rows carry it; see section 13).
Integration: NS-09-R6, R15, R17; errata E28 (BL-977 scope gains NS-09-R6); `discard.failures.<draft id>` read; module `app/settings/storage.tsx`, the launch sweep.

### C-S19 Erase everything on this phone

As built: heading, body, notes, "Save a copy first?" card, destructive outline button, ConfirmSheet, Erasing StateScreen. Changes: the export button label becomes "Save a copy" (G4); `.signedoutSynced` body variant (G2); a line naming pictures once photos are on (FR-LEG-02); available when signed out after a sign-in (E1); the body says "every book on this phone" and names none (K-E04, SEC-04: no screen names another account's book or says one exists). v2 states: `.ownerCheck` (after the confirm, the system asks for Face ID or the passcode, FR-SEC-06) and `.ownerCheckCancelled` (back on the confirm, unchanged, no message). The days store is in "everything": no new body line (FR-CUL-16). VoiceOver hears "Everything on this phone is erased." at the end (FR-PRV-34). No rating request, What's New or promotion follows (FR-MKT-23). The case "letters belong to another sign-in" (FR-LCY-10) is not drawn as a screen: see section 15, contradiction X2.

### C-S20 Delete account

As built (what, confirm, scheduled, executing, signed out, not configured, errors) with two new lines on `.what`: the D6 sealed-letters line (only when the parent has a letter hidden until a day) and the pictures line (NS-01-R31, once photos are on). The export card's button calls the same export (R6a) and reads "Save a copy".
v2 (final pack): `.what` is a list of one-line rows in the order of J-C21 (retained-data lines of FR-PRV-18, the days line `culture.delete.line` only when a day is ticked, a link row "How deleting works" to `brand.web.deleteAccount`); `.signedout` carries NS-45's line ("Sign in to delete your account, or to cancel a deletion you started. Letters that are only on this phone stay here until you delete the app.") and the same link; the scheduled screen promises nothing about an email unless one is sent (NS-45-R17; claims row); reachable from C-S11.declined without agreeing (NS-45-R7, E8); no switch may hide it while sign-in is on (NS-45 section 9). Reduce Motion and AX5: the typed-word field and its reason stay above the keyboard; both actions stack and pin (NS-45 section 6). Not drawn in 1.0: a line about an order in flight (FR-PRT-33; no order feature, FR-PRT-01).

### C-S21 Recording backup (flip only)

Designed, not built. Consent sheet with two equal buttons; status page with a status line and a cellular switch; Stop backing up with a ConfirmSheet. No lock, shield or vault imagery; no progress percentage; no "bank-level".

### C-S22 Delete this book

As built; label change only.

### C-S23 Privacy (Me, Privacy; id taken by privacy, K9)

Built page (`app/settings/privacy.tsx`), drawn here for the first time with every state FR-PRV-33 lists. Layout, top to bottom, all content layer, `ListSection` rows:
1. The promise (`trust.promise`), plain text, no icon, only while every sentence has a claims row true of this build (FR-PRV-33).
2. "Where your book is kept": the facts the build allows (`privacyPage()` decides), the iPhone backup line (same words as C-S08).
3. Sync and family sharing (only in a build with sync): the sensitive-data row with its status value, now pressable (it opens the sheet `.withdraw`); help footer. The opt-in usage switch shows only where the build can collect (off through 1.0).
4. "Who can see it": the plain fact for App lock off or on, the App lock row (On or Off, opens App lock), "Names in notifications" (opens Reminders; its help line says it covers the child's name only, days have their own choice on C-S24, NS-47-R14).
5. "What you can do": Save a copy, Recently deleted, Erase everything on this phone (when no one is signed in), and the no-account footer in a local build. No Delete account row (it stays on Me, D-129).
6. The Privacy Policy and the Terms (the two pages the website serves) and, in Legal, the accessibility statement link (FR-CMP-10).
Sheet `.withdraw` ("Stop syncing letters", intent): N7 sheet, content layer buttons on glass sheet (no glass inside glass). Door lines (FR-PRV-01): Shown: what stops, what stays, Save a copy, Delete account. Records: one PRIV-R21 row. Never: a deletion as a side effect; a preselected choice. Decline: Cancel, first and default, records nothing. Two equal `bordered` buttons, stacked at every size, Cancel first; neither is `filled` because this is a consent act of equal weight, not a destructive one. Plain rows "Save a copy" and "Delete account" open C-S04 and C-S20.
States: `.consentOn`, `.consentOff` (row reads "Not syncing"), `.consentWaiting` (opens C-S11), `.signedout`, `.local` (no sync rows), `.serversOff` (same as local; no withdrawal row), `.second-account` (B's facts only), `.withdraw`, `.withdrawn`, `.backgrounded` (blank snapshot, FR-SEC-22), `.ax5` (rows wrap; the sheet scrolls and both buttons stay reachable at the end), `.vo`, `.dark`.
Integration: FR-PRV-01 (P0 (b), Apple 5.1.1(ii)), FR-PRV-33, FR-CMP-16; BL-485; flags none; kill switch: none may hide it; modules `privacy.tsx`, `privacy.logic.ts`, `lib/analytics/privacy-sources.ts`.

### C-S24 Days (Me, Days; NS-46, NS-47)

One page for the typed days of NS-18 and the days the parent ticked from the library (R-IA-2, no second list). Pushed from Me. Before tree test T1 the row sits under Reminders in Me's present group; after T1 in "Days and reminders"; both routes open this page. Content layer; no glass except the system navigation bar.
```
< Me                      Days
[ DoorNote: "Only on this phone. Used for one thing: finding days for you to pick. Change or clear any time in Me." ]
[ "Anyone who can open this phone can see this list. App lock keeps it private." ]   (second sentence only while App lock exists)
[ A reminder arrives on that day. Unticking a day or Clear all stops it. ]           (while nothing is ticked)
Days you added                  (heading)
[ Mum's birthday dinner, Mar 4  > ]      typed days (D-S08 rows)
[ Add a day                        > ]   (D-S09 flow; one door)
Days you chose                  (heading; absent while nothing is ticked)
[ Thanksgiving, Nov 26             > ]
[ Diwali, around Oct 28            > ]   (a moving day says "around")
[ Spring begins: no date for next year yet. ]   (footnote, textMuted, no glyph)
[ Browse days                      > ]   (opens C-S25 as a sheet)
[ Show the day's name in notifications  (o) ]   (only when a day is ticked)
  Anyone who sees your lock screen can read it.
[ Clear all                        ]   (destructive text; only when a day is ticked)
These days are not part of Save a copy.   (footnote)
```
Rules (final pack): the page has no count, no "You mark 7 days", no "complete your list" (NS-46-R3, R19); headings are "Days you added" and "Days you chose" (NS-46-R38); nothing is pre-ticked; the day-name switch lives here, not on Reminders (RV-13, Q-FD-14); the switch is shown only when a day is ticked and is disabled with its reason line while App lock is on (the built `.appLock` pattern, read as "present and not ready"); the DoorNote is first in reading order before any control that records a choice (NS-47-R29). Each day row is one VoiceOver element "{name}, {date or around date}" with the chevron hidden; the no-date line belongs to the row's label (NS-46-R26). A row can be removed by opening it (C-S26), by a swipe action, or by a VoiceOver custom action (NS-47-R21).
AX5: the DoorNote takes the first screenful (it is never collapsed); dates move under names; the switch's label wraps; nothing truncates; Clear all keeps its words at 44 pt.
States: `.default`, `.empty` (no "Days you chose" heading, no words about gaps), `.typedOnly`, `.noDateNextYear`, `.clearConfirm` (F6 `explained`: "Keep my days" filled and default, "Clear all" destructive text), `.store-unavailable` (`days_store_unavailable`: typed days stay; the library section shows one in-place line with Try again, polite once), `.remindersOff` (one calm line: chosen days still send a reminder, and where to stop it), `.notificationsDenied` (D-S06 `.denied` card reused; one per screen), `.dayNames-off`, `.dayNames-on`, `.dayNames-appLock` (disabled, reason line mandatory), `.dayNames-released` (App lock turned off: reads off, no message), `.sessionCleared` (one calm line once, NS-47-R15), `.killswitch` (library sections, Browse, switch and Clear all absent; typed days stay), `.flagOff` (the page holds typed days only, in a build with NS-18 but not the library), `.signedout` (row absent), `.second-account`, `.lapsed`, `.offline` (identical: local), `.backgrounded` (blank snapshot, E18, FR-SEC-22), `.ax5`, `.vo`, `.dark`.
VoiceOver order: page heading, DoorNote, the shared-phone line, the reminder line, "Days you added" heading and rows, Add a day, "Days you chose" heading and rows, Browse days, the switch with its help line, Clear all, the footnote.
Components: ListSection, ListRow, ToggleRow, `DoorNote` (new, section 6), D-S06 denied card, F6 `explained` sheet. Integration: NS-46-R3, R15, R25, R26, R28, R35, R38, R40, R49; NS-47-R10, R14, R15, R21, R26, R29; flags `EXPO_PUBLIC_DAYS` (E20 local family) and `killSwitches.libraryDays` (fail-open); no analytics event (NS-47-R9); data read: the days store (L4, per account, backup-excluded), typed days (`scribe.db`); written: ticks, overrides, `notifications.dayNames`; modules: the days module only reads the store (NS-47-R11), `lib/reminders/prefs.ts`, `app/settings/days.tsx` (PROPOSED).

### C-S25 Browse days (sheet over C-S24; NS-46-R20, R41; NS-47-R2, R20, R25, R30)

N7 sheet at the large detent (full height at AX3 and above); the sheet is the only glass; rows are content layer and plain (no glass inside glass). The exit is the visible "Done"; swipe down, the VoiceOver escape gesture and Back do the same; nothing is lost on any (ticks save as they are made). No second sheet ever opens over it.
Order: DoorNote (full form, first); the reminder line while nothing is ticked; "Seasonal and shared days" (with the hemisphere control: a segmented I4 row of 44 pt or more that stacks at AX1 and above, nothing selected by default, northern names shown, never inferred from time zone or locale); "Family days"; "Civic days" (quiet days show their name only); "Traditions" (the optional picker: heading with the word "Optional", the row "Not now" first, then the alphabetical tradition rows, then that tradition's days first when picked, then the rest alphabetically; "Add a day" closes the sheet and opens the add flow on C-S24); "A country that matters to your family" (Optional; absent until a second country ships). Each group shows at most 5 rows with a "Show more" row (a design-set number; the first view reads as an offer, not a form, NS-46-R41). Rows are I4 `multi`: check shape plus weight, the name, the date in `footnote` `textMuted` ("around 27 November"), role checkbox, VoiceOver "{name}, around {date}, ticked". Group titles are rotor headings; "flat" means one level, no collapsible groups, no tiers, no ordering by size. No "select all". No tradition label on any row (never "your tradition").
Tick feedback: the row changes (`m.select`), `H-select`, a VoiceOver value change; no toast, no count, no "added". A moving day inserts the one inline question row "Dates differ by country. Which date should we use?" under that day, options named by their authority plus "I will pick my own date" (an inline date row, never a sheet). A tradition or country pick is component state only: no route parameter, no setting, no persisted navigation state (NS-47-R2).
States: `.default`, `.hemisphere`, `.traditionPicked`, `.ticked`, `.whichDate`, `.noDateNextYear`, `.unavailable` (store cannot be read: C-S24 shows the line instead; Browse does not open), `.fallbackNoQuestion` (CUL-Q8 fallback: no Traditions or country group), `.country` (second country only), `.offline` (identical), `.backgrounded` (blank), `.ax5` (date under name; hemisphere control stacks; "Done" stays reachable), `.vo`, `.dark`.
Integration: NS-46-R2, R11, R14, R20, R41; NS-47-R2, R20, R25, R29, R30, R35; FR-CUL-02, 10, 20, 21, 22; flag and pause as C-S24; modules: the days module, `app/settings/days-browse.tsx` (PROPOSED).

### C-S26 Day detail (pushed from C-S24 only; NS-46-R14, R15, R26)

Title: the day's name. Rows: the date ("around {date}" when the day moves), "Move this date" (inline date row; under it an I4 choice group, "Just this year" selected by default, "Every year"; stacked at AX1 and above; the move is the parent's own date, the table is never edited), "Remove" (destructive text, one tap, no confirm, no toast; re-ticking is in Browse). Where authorities differ, `.authorities` repeats the "Which date should we use?" rows. No tradition label, no explanation of the day, no prompt or preview line (a quiet-tone day looks identical; the tone is not the parent's to change, NS-46-R16). Writing tools are not relevant (a date field); the Add a day name field in D-S09 carries "Writing Tools: off" (D2, FR-PRV-16).
States: `.default`, `.moving`, `.authorities`, `.noDate` (the no-date line; Move this date stays available to set the parent's own), `.removed` (leaves for C-S24), `.backgrounded` (blank), `.ax5`, `.vo`, `.dark`.
VoiceOver: heading, date, Move this date, the choice group, Remove. Integration: NS-46-R14, R15, R26; NS-47-R21; FR-CUL-20 to 22; same flags.

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
| `days_store_unavailable` (PROPOSED, local) | C-S24.store-unavailable | typed days stay; one in-place line in the library section | Try again | NS-46-R40; NS-47-R6 |
| backup exclusion reads false | C-S24, C-S25 (same code) | nothing is ticked; the same line | Try again | NS-47-R6 |
| `killSwitches.libraryDays` | C-S24.killswitch | library sections, Browse, switch, Clear all absent; typed days stay | none | NS-46-R28 |
| notifications not allowed | C-S24.notificationsDenied | nothing arrives until allowed in Settings; no promise | Open Settings (D-S06 card) | NS-46 section 5 |
| refused iOS ask | C-S24 | one calm line; never asked again | none | NS-46-R31 |
| session ended by the system | C-S24.sessionCleared, C-S01.sessionEnded | list cleared when the session ended; signed out once | Sign in | NS-47-R15; NS-45-R3 |
| `upgrade_required` / below `minSupportedVersion` | C-S01.updateRequired | E-S16.line at top of Me; the book works | Open the App Store | NS-45-R13 |
| suspended account | C-S02.suspended | one neutral line; book readable | Save a copy, Delete account | FR-BKO-26 |
| deleted on another phone (this one signed in) | C-S01.deletedElsewhere | one plain line; book stays | none | NS-45 section 5; FR-LCY-19 |
| owner check cancelled | C-S19.ownerCheckCancelled | back on the confirm, nothing erased, no message | Keep everything, Erase | FR-SEC-06 |
| consent withdrawal | C-S23.withdraw | what stops, what stays | Cancel, Stop syncing | FR-PRV-01 |
| recording still being removed | C-S18.stuck, .retrying, .stuckAgain | one state line, never a list or a count | Remove now | NS-09-R6; E28 |

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
| C-S23 | FR-PRV-01, FR-PRV-33, FR-CMP-16 | BL-485 | none | none may hide it | none | consent status, App lock, names | PRIV-R21 `withdraw` row | `privacy.tsx`, `privacy.logic.ts` |
| C-S24 | NS-46-R3, R15, R25, R26, R28, R35, R38, R40; NS-47-R10, R14, R15, R21, R26, R29 | NR-DAY-10 (new, no id), BL-963 (rank), BL-966, BL-985, BL-961 | `EXPO_PUBLIC_DAYS` | `killSwitches.libraryDays` (fail-open, not deliverable servers-off, RV-10) | `days_store_unavailable` | days store (L4), typed days | ticks, overrides, `notifications.dayNames`, `culture.asked` | days module only (NS-47-R11) |
| C-S25 | NS-46-R2, R11, R14, R20, R41; NS-47-R2, R20, R25, R29, R30, R35 | NR-DAY-10, NR-DAY-03 | as C-S24 | as C-S24 | as C-S24 | library (bundled, one file, NS-46-R48) | ticks only | days module |
| C-S26 | NS-46-R14, R15, R26; NS-47-R21 | NR-DAY-10 | as C-S24 | as C-S24 | none | one tick | override, removal | days module |
| C-S21 | NS-08 (flip rows) | BL-976 | `EXPO_PUBLIC_BACKUP` (off) | `killSwitches.backupUploads`, `.escrow` | none new | backup status | consent row (flip) | `lib/backup/*` |

---

## 6. Components

Existing, reused: ListSection, ListRow, ToggleRow, Button (primary, secondary, quiet, destructive; sizes sm and lg), Card, Sheet, ConfirmSheet (`components/book/confirm-sheet`), StateScreen, Toast (with T4 timing via BL-954), BookCover, FailureCard (export), ErrorLine, AppNote, SignedOutCard, TextField.

New, proposed (each justified; specs go to `COMPONENTS.md` when built):
1. **Bottom actions: v2 N3 Toolbar (bottom), not a new component.** `Stack.Toolbar placement="bottom"` with one `prominent` item (glass layer). At AX3 and above any item whose label is a sentence moves into the content as an A1 `lg` button pinned in the bottom third (COMPONENTS N3), which is how NS-11's "action visible at AX5 without scrolling" is met. My earlier name StickyActionFooter is withdrawn (v2 retires `StickyFooter`). Used by C-S04, C-S05, C-S14, C-S11.declined, C-S20.
2. **SlipCard (proposed as a v2 C1 Letter card variant `slip`, or its own component if Karma prefers).** Content layer, never glass. The one Home slip shell for the registry (ADR 0033): card is the tap, one line, one optional quiet dismiss, one VoiceOver element with a custom action. Why: four slip types (A, B, C) would otherwise each draw their own card; the registry test needs one renderer. Shared with B-S17 and B-S18; area C proposes it, area A places it.
3. **InlineNote (with dismiss) (v2 has no match: F2 Banner is for system conditions and has no close; proposed as an F2 variant `note` with a close action, or a new C-level component).** Content layer. A plain text line at the top of a list with an optional 44 pt close button, no card chrome. Why: C-S12 must be "one line at the top until dismissed" and not a card (NS-10 design input); AppNote has no dismiss and is for a letter's own small line.

4. **DoorNote (NS-47-R29; design-systems review F47-1).** One static content-layer block for a promise a parent must read before choosing: `callout` type, `text` colour (not `textMuted`), on `surface`, `radius.md`, a decorative lock glyph hidden from VoiceOver (a glyph here is decoration, never the signal), never collapsed, never behind an info glyph, never dismissible, never glass, first in reading order before any control that records a choice, wraps at AX5 and never truncates; a short form (one sentence) under the Home ask question and the full form at the top of C-S25 and C-S24. Shared with C-S21 (backup consent door lines), C-S23.withdraw and E-S07; a claims row backs each sentence (NS-47-R22). Not a banner, not an AppNote. Note on the glyph: the area's rule "no lock or shield imagery" (C-S21) is about decoration that implies safety; DoorNote's glyph is optional and the default is none (open question OQ-1).
5. **I4 `multi` list variant (NS-46-R41).** Row of at least 52 pt (`layout.rowMin`, open name request), check shape plus weight, the name, the date in `footnote` `textMuted`, role checkbox with checked state, `m.select` and `H-select` only on a change; AX5 stacks the date under the name; no select-all. COMPONENTS retired multi-select filters; this is a list, not a filter chip.
6. **I1 `optional` slot (NS-47-R30).** The word "Optional" beside a label (never an asterisk, never placeholder-only, never colour alone); VoiceOver "{label}, optional"; the decline control has the same style and size as the accept control and sits in the same stack; nothing preselected; skipping writes nothing and prompts nothing later. Used by C-S25 pickers and the Home ask; E-S08's name field adopts it (area E).
7. **SlipCard variants `saveSlip`, `daySlip`, `askSlip`** (section 3, C-S06). Replaces the single `slip` variant of v1.

Not proposed: a progress ring, a lock or shield glyph as a signal, a count badge, any celebration.

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
- v2 screens (C-S23 to C-S26, A-S01 `dayToday`, `daysAsk`, `quietDay`) join the NS-33-R4, R7, R16 screen set and quality Annex B.3: AX5 with Bold Text on an SE 3, VoiceOver, Voice Control (names equal visible labels: "Browse days", "Done", "Not now", "Not today", "Clear all", "Remove", "Move this date", "Stop syncing"), Switch Control. Every L4 screen (C-S24 to C-S26 and the ask) draws `.backgrounded` blank, with or without App lock (E18, FR-SEC-22). A tick is announced as a value change, never a toast.
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

---

## 12. Re-key to the final pack (v2)

Every screen, state, transition and motion in this file now keys to the final card and row ids. Old keys and what they became:

| Was (v1 keyed to) | Is now | Note |
|---|---|---|
| C-S01 "Your letters" group holds Recently deleted, Storage, Erase | `.default` keeps it (the groups as built) and adds the Days row under Reminders; `.regrouped` (IA-AUDIT, R-IA-4, built only after tree test T1) absorbs it into "Keeping your book" | NS-46-R3 (Days row before T1), card 22 section 3 |
| "Notes and days" (IA-AUDIT working title) | "Days and reminders" (working title for T1) | RV-3: "note" is the glossary word for what a person writes, never for what the app sends |
| Sign-out, session end, deletion, update line keyed to NS-10 and D1 only | NS-45-R1 to R18 (card 19) plus D1, D6 | C-S02, C-S03, C-S19, C-S20, C-S01 states |
| C-S10, C-S11 keyed to NS-10 only | NS-10 plus NS-41 (routing) and NS-42 (consent); E-S09 is an alias of C-S10 and C-S11 (card 19 step table) | one screen, two owners; area C keeps every NS-10 state |
| C-S18 one row per stuck recording | one state line, never a list or count | errata E28 (card wins, CR-66) |
| Slip order (1) (2) (3) (4) | (1) (2) (2b) (3) (3b) (4) | NS-50-R5, RV-5; NS-11-R4 needs the errata row card 21 lists |
| Day-name switch on Reminders (D-S06) | on the Days page, C-S24 | RV-13, NS-47-R14, Q-FD-14 |
| Typed days on Reminders ("Days to remember", D-S06) | on C-S24 ("Days you added") | R-IA-2, CB-2: a ticked day is not a typed day |
| "a day we mark", "a day you type" | "Days you chose", "Days you added" | content F7, NS-46-R38 |
| D-S11 `libraryDay` (a day above the prompt after a tap) | dropped; one way: the day slip however the parent arrives | RV-6, NS-50-R4, Q-FD-25 |
| A day slip "Not now" | "Not today" (own key); "Not now" stays the Days ask's answer | NS-50-R7, content F16 |
| Flags `EXPO_PUBLIC_SAVE_A_COPY`, `_PRINT_BOOK`, `_EARLIER_VERSIONS` | the same names, read as the local (phone-only) flag family that works with servers off | errata E20 |
| `killSwitches.earlierVersions`, `.printBook` | unchanged proposals; plus `killSwitches.libraryDays` (fail-open, hides a phone-only feature, never stops export) | errata E21, RV-10 |
| Blank snapshot only where App lock is on | blank on every L4 screen with or without App lock | errata E18, FR-SEC-22 (C-S24 to C-S26 join the list) |
| Second account: "BL-961 should land" | BL-961 and `[X4-R1]` are gates for NS-46, NS-47, NS-49 (E27) | the Days store is per account and enumerated by BL-961 |

Section 11's reconciliation table with MOTION.md and WORDS.md still stands for the ids it names.

## 13. Function needs accounted for (FUNCTION-TRACE section 6.3)

Each design-needs row the trace assigns to area C (6.3.1), then the FRs that name a screen here with no design-needs row (6.3.2). "Designed" names where; "Gap" is an explicit gap with its id in sections 15 and 16.

### 13.1 Rows filed by the functions

| FR ids | Need (short) | Where designed, or gap |
|---|---|---|
| SUP-01, SUP-17 | Help and legal drawn in every C-S01 state | Designed: section 3 C-S01 (drawn in every state; `.ax5` stacks the Help value under the title); prototype states |
| SUP-07 | `tooBig` words say what happens next | Designed: C-S04 v2 line; only if support has a real answer (gap G26) |
| SUP-20 | Second printable failure offers "Write to us" | Designed: C-S05.error-print_pdf_failed, second failure shows the built "Write to us" button |
| MKT-16, MKT-29 | C-S08 is the source for the privacy frame; words follow the label in force | No change to the screen; C-S08 words are claims-registered; noted in 13.3 |
| (finance, no FR) | C-S18 Storage unchanged | Designed: unchanged except the E28 line |
| DAT-03, DAT-13 | "What is inside" stays words, no numbers | Designed: C-S04 v2 text; no count is added for measurement |
| PRV-01, PRV-33 | Privacy screen C-S23, withdrawal sheet | Designed: C-S23 and `.withdraw`, J-C19; re-agree path is gap G19 |
| PRV-15 | C-S03 as drawn | Designed: C-S03 |
| PRV-15, PRV-34 | `.signedoutSynced`, "every book on this phone", after-erase announcement | Designed: C-S19 |
| PRV-18 | Retained-data lines on C-S20.what, one line each | Designed: J-C21 and C-S20 v2 |
| PRV-21 | Manifest line if server-held versions are not in the copy | Designed as optional (C-S04 v2), only if the option is taken |
| PRV-23 | "Clear the due date" on C-S15 | Gap: not drawn; the founder has not taken PQ-6. Default when taken: one `ListRow` "Clear the due date" under Details, shown only when a birthday exists, F6 `explained` sheet, safe choice default (open question OQ-10) |
| LEG-02 | C-S20 pictures and Find index lines, seals and photos states; C-S19 names pictures | Designed: C-S20 v2, C-S19 v2 (states photos on/off, seals on/off) |
| LEG-12 | No licence text in the PDF; Licences row in Me, Legal | Designed: no change to C-S05; Legal page lists the faces (as built `licenses.tsx`) |
| LEG-09 | Returning consent records with an allowed method | No design change (C-S11 unchanged) |
| LEG-16 | C-S21 consent sheet, decline and withdraw states, drawn now | Designed: J-C14 (unchanged), now using DoorNote |
| CMP-07 | AX5 with Bold Text and VoiceOver walked on C-S20; links announced as links; no truncated agreement text | Designed: C-S20 v2, C-S23 (documents rows are links), section 7 |
| CMP-10, CMP-16, CMP-17 | Accessibility statement link; withdrawal control; Delete account visible in store builds | Designed: C-S23 item 6 (link sits in Legal), `.withdraw`, C-S01 row rule |
| SEC-07, SEC-25 | "Turn on App lock" on the sign-out sheet; App lock offered only in Me and the sheet | Designed: C-S03 `.appLockOffer`; nothing at the end of first run (area E) |
| SEC-06 | Owner check after the Erase confirm; `.ownerCheckCancelled` | Designed: C-S19; no-passcode case is gap G16 |
| SEC-08 | "Anyone who has this file can read and hear everything in it." | Designed: C-S04.ready and C-S05.ready |
| BKO-12, SUP-01, SUP-02 | Help route for a concern: reuse Help and "Write to us" | Designed: no new screen; C-S01 Help row |
| BKO-26 | Suspended account line | Designed: C-S02.suspended, J-C20 |
| LOC-13 | "The app is in English" lines for non-English books on read, export, print | Designed: C-S04 and C-S05 v2 lines (words: content) |
| LOC-15, LOC-16 | Arabic and Chinese font decision for the PDF; Hindi line height and Bold Text | Gap: font choice and size cost are a `design-systems` and `mobile` decision on the PDF template (not on a screen of area C); default: the PDF embeds the faces it needs and C-S05 never shows a missing-glyph state (open question OQ-11) |
| LOC-01, LOC-07, LOC-28 | Settings, Spoken language and Storage language rows in a multi-language build | Designed in part: C-S18 keeps its language rows (sizes, Wi-Fi only, paused, needs newer app, removed); the language list screen is area E (E-ST08); no teaser for a language the build does not hear |
| REL-37 | Size per kind and the actions that free space | Designed: C-S18 (Total, per-model rows as built; the stuck line; Remove now); no new kinds in 1.0 |
| (ai-and-speech) | Me, Languages: one place listing languages that passed | Gap: no Languages screen in area C; the Spoken language page is built and area E owns E-ST08 (open question OQ-3) |
| RSH-10 | Read-aloud cards of C-S03, C-S08, E-S10, D-S02 | Out of design scope (research artefact); C-S03 and C-S08 are drawn at AX5 for it |
| RSH-09 | The printable book as an Asha fixture | Out of design scope; C-S05 uses Asha only |
| QAL-09 | Undo window seconds per toast and sheet in one table | Designed: MOTION.md section 3 (one pattern); C-S17 only toasts with actions (Restore "Open") |
| LCY-10 | A state naming "another sign-in" with Save a copy and Erase everything | Not drawn: contradicts K-E16 and the no-disclosure rule; see contradiction X2 |
| LCY-21 | A split copy state; `tooBig` stops being a dead end | Designed: C-S04 `.parts` |
| LCY-09 | Signed-out after a device restore reads as normal | Designed: C-S01.signedout |
| PRT-02, PRT-03 | One plain line on what the 1.0 file is and is not; help link | Designed: C-S05 v2 |
| PRT-06, PRT-16 | PRT-S01 "A book to hold" entry from C-S04, B-S02, C-S06; year-end slip | Gap by design: print order is not in 1.0 (FR-PRT-01); no entry is drawn; C-S06 has no print line (open question OQ-9) |
| CUL-02, 10, 20, 21, 22 | C-S24 row, list with untick, Browse by tradition and country as flat alphabetical lists, Add a day, Clear all, "not in Save a copy", call-out, states | Designed: C-S24, C-S25, C-S26 (note: "Browse by country" is absent until a second country, NS-47-R35, so one flat list in 1.x) |
| CUL-15 | C-S03: "Days you chose on this phone are cleared" | Designed: C-S03 `.days` |
| CUL-16 | C-S19: the "everything" list includes days | Designed: C-S19 v2 (no new body) |
| CUL-17 | C-S20 line | Designed: J-C21 (`culture.delete.line`; tension in contradiction X1) |
| CUL-10 | C-S04 unchanged; the line lives on C-S24 | Designed |

### 13.2 FRs that name a screen of area C with no design-needs row

| FR id | Design response |
|---|---|
| SUP-13 | C-S02: "Sign out other devices" is the route; support changes nothing by hand (C-S02 v2) |
| SUP-14 | C-S20 v2: Me first, the web page link row, 30 days, Plus cancelled separately |
| MKT-23 | No rating request on C-S19, C-S20 or after Save a copy: a rule for area C (C-S19 v2); the request lives on the Book (area B) |
| MKT-24 | C-S06 is a trust slip, not promotional; the ask slip is the one family question (NS-50-R16) |
| DAT-02 | No screen here asks a research question or prepares a message with counts; "Write to us" uses the fixed subject only |
| PRV-03 | No screen change: `account.json` carries the parent's consent rows |
| PRV-05 | No screen change (purge of never-accepted accounts); C-S11.declined is unchanged |
| PRV-20 | C-S11.declined: nothing pulls while consent is outstanding; Save a copy and Delete account work |
| PRV-27 | C-S10.wrongAccount names the method only, never the address; no full address on any area C screen |
| SEC-04 | C-S19 and C-S01 `.second-account`: no screen names another account or says its book exists |
| SEC-12 | NS-45-R17 emails: no screen change; the scheduled screen promises an email only if one is sent |
| BKO-07 | C-S02: recovery is not in-app; "Sign out other devices" and Apple's recovery are named in help |
| BKO-24 | No screen change (mailbox out-of-office); "If you are struggling" stays in Me |
| BKO-27 | No screen change (content-free email to the account address) |
| MSG-34 | C-S20 v2: one link row "How deleting works" at every place that names the path (C-S20.what, .signedout, C-S11.declined) |
| LOC-10 | C-S01 Spoken language row: its own name first with the English name under it; the interface stays English |
| LOC-14 | C-S18 / E-S08: on a new phone the language is asked again; no line implies the model came with the account |
| LOC-18 | C-S01: "If you are struggling" in every build and state |
| LOC-25 | C-S01 Help: "Write to us"; replies in English (words: content) |
| REL-61 | C-S12 (one line, once) plus C-S09: no new prompt |
| RSH-21 | Research guide rules; no screen change |
| QAL-08 | Glass rules: section 6a (three surfaces maximum, solid fallback); v2 adds no glass toast over a sheet for a tick |
| LCY-04 | No screen: unsent rows are never dropped; Sign out waits (C-S03.waiting) |
| LCY-11 | Claim after deletion is area E's (E-S24); C-S20 and C-S01.deletedElsewhere say a new book can start |
| LCY-12 | C-S04 never says Save a copy restores a book; C-S08.local says only the phone's backup carries the book to a new phone |
| LCY-13 | C-S09 and C-S12 as drawn (words arrive, recordings stay) |
| LCY-19 | C-S01.deletedElsewhere, C-S10.deletedElsewhere, C-S20 |
| LCY-20, LCY-22 | The export's README and `index.html`; no screen change |
| LCY-25 | No delivery to {child}; C-S04 help article only |
| LCY-26 | No new screen; C-S10.wrongAccount and help |
| PRT-01 | No order, print-ready, hardcover or partner word on any area C screen; "Printable book" only for the C28 file |
| PRT-33 | Not drawn in 1.0 (no order feature) |
| CUL-01 | C-S24: the days store is L4, per account, cleared at sign-out and Erase; the screen says so in the DoorNote |
| CUL-03 | C-S15: nothing about tradition on a child or book |
| CUL-07 | C-S10 / claim: a new phone starts with an empty Days list; the ask is not repeated (flag in `settings`) |
| CUL-13 | C-S24: the list shows only on the unlocked phone; blank snapshot; Home names a day only when it is today |
| CUL-26 | C-S24 to C-S25 at AX5 with Bold Text, VoiceOver, Voice Control, Switch Control (section 7) |

### 13.3 Notes on rows with no screen change

MKT-16 and MKT-29: C-S08 is the source frame for the privacy screenshot; its words follow the label in force and are claims-registered (WORDS.md claims check). Marketing frames never show a tradition, a faith day or the ask slip (NS-46-R47): the prototype uses seasonal days only and the fictional family Asha.

## 14. Motion and transitions for new or changed states (v2)

Every row has an `m.*` primitive, a `T-*` transition (v2 `docs/design/system/MOTION.md` ids; PROPOSED ones are marked), a Reduce Motion form, and a haptic. Nothing here animates a count, a streak, a filling calendar or a celebration. All moves are at or under 300 ms except system transitions. MOTION.md carries the same rows as M-C73 to M-C91 with the prototype items.

| Id | Screen.state | Trigger | What moves | `m.*` and `T-*` | Reduce Motion | Haptic |
|---|---|---|---|---|---|---|
| M-C73 | C-S01 to C-S24, C-S26 | Tap Days, or a day row | native push; arriving content in place | `m.push`, T-PUSH | system reduced | none |
| M-C74 | C-S24 to C-S25 | Tap Browse days | the sheet rises (glass); content below unchanged | `m.sheet`, T-SHEET | system reduced | none |
| M-C75 | C-S25.ticked | Tick or untick a day | the check shape and weight change; no toast, no count | `m.select`, T-INLINE (PROPOSED: a state change inside a list row) | indicator jumps; colours `m.swap` 150 | H-select on a change only |
| M-C76 | C-S25.whichDate | Tick a moving day | the one question row opens under the day; rows below move | `m.move` plus `m.enter` (280), T-INLINE | final layout next frame, row fades 200 | none |
| M-C77 | C-S24 row removed | Remove on C-S26, swipe, or custom action | the row `m.exit` (opacity only), rows below `m.move` up; no Undo | `m.list.remove` | row fades 160, gap closes next frame | none |
| M-C78 | C-S24.clearConfirm to `.empty` | Clear all chosen | the F6 sheet leaves; all "Days you chose" rows leave together (no stagger, no count); the switch and Clear all leave with them | `m.sheet` then `m.list.remove` | fade 160, jump | H-warning after the choice, never when the sheet opens |
| M-C79 | C-S24.dayNames-* | Toggle; App lock turns on or off | the switch indicator moves; a reason line is swapped in place | `m.select`; reason `m.swap` 150 | jump; swap | H-select on a toggle |
| M-C80 | C-S24.store-unavailable, .sessionCleared, .remindersOff | the state arises | one in-place line enters in its section; announced politely once | `m.enter`, T-SYSLINE | fade 200 | none |
| M-C81 | A-S01 `daySlip` | cold launch; later visit; "Not today"; day changes | cold launch: `m.enter.group`; later: already in place (T-RESUME); dismissal: `m.list.remove`; a day change removes it with no animation | `m.enter.group`, `m.list.remove`, T-SLIP (PROPOSED composite) | one `m.fade` 200 at most, or a jump | none (NS-50-R7, R12) |
| M-C82 | A-S01 `askSlip` | cold launch; either answer; retire after two showings | as M-C81; retiring to Me animates nothing | as M-C81 | as M-C81 | none |
| M-C83 | C-S23.withdraw | Tap the sensitive-data row; Stop syncing | the sheet rises; on confirm it leaves and the row's value is swapped in place; no toast | `m.sheet`, `m.swap` | system reduced; swap | none (a consent act, not a warning) |
| M-C84 | C-S18.retrying, .stuckAgain | Tap Remove now | the button's label is swapped for a static busy label; on failure it swaps back and the line stays; VoiceOver re-reads the line | `m.swap` 150; `m.instant` for the line | swap | none |
| M-C85 | C-S03.waiting | Sign out with sends pending | the sheet's text is swapped for the waiting line; buttons keep their place | `m.swap` 150 | swap | none |
| M-C86 | C-S19.ownerCheck | After Erase confirm | the system owner check; cancel returns to the confirm with nothing moving | system; `m.instant` | system | H-warning only after the erase is chosen and checked, not at the check |
| M-C87 | C-S01.sessionEnded, .updateRequired, .deletedElsewhere | Me opens after the event | one line `m.enter` at the top; content below `m.move`; dismissal (when allowed) `m.exit` then `m.move` | `m.enter`, T-SYSLINE | fade 200; layout instant | none |
| M-C88 | C-S01.regrouped | Me opens | nothing animates a regroup (the arrangement is static); rows never reorder on screen | `m.instant` | same | none |
| M-C89 | C-S04.parts | the copy is ready in parts | the `.ready` sentence says it once; the same bar and button; no per-part animation | `m.swap` | same | none |
| M-C90 | C-S25.traditionPicked | Pick a tradition | that tradition's days move first in the list; reorder is a cross-fade of the list block, not rows travelling | `m.fade` 200 | jump | H-select |
| M-C91 | C-S23.consentOff | Withdrawn | row value swaps; Account's Sync row follows when next shown | `m.swap` | same | none |

Never animate in this area (v2 additions): a tick that celebrates; a calendar or list filling; any count, ring or badge on Days; a pulse on the DoorNote; the DoorNote collapsing; the ask slip "pulling" attention; hold-to-confirm on Clear all or Stop syncing.

## 15. Contradictions with product rulings (flagged, not resolved)

| # | Where | Contradiction | Design default meanwhile |
|---|---|---|---|
| X1 | NS-47-R17 and `culture.delete.line` ("Days you chose stay on your phones and are cleared with your account") against NS-47-R17's own rule ("this phone clears the store at once"), against NS-45-R10 / C-S20.cancelled ("Your letters and books are back, just as they were") | The line says days "stay" on phones; R17 clears this phone at the request; a cancelled deletion cannot bring the days back, so "just as they were" is false for them | Show the line only when a day is ticked; keep the built cancelled words but do not extend them to days; Karma and `content` rule (G25) |
| X2 | FR-LCY-10 (a screen saying "these letters belong to another sign-in", naming the method) against K-E16 ("no block screen"), FR-SEC-04 (no screen names another account or says another book exists) and this file's J-C05 | Disclosing A's existence to B | Not drawn; C-S10.wrongAccount names only the method B used |
| X3 | NS-11-R4 (locked card 08: four slips) against NS-50-R5 (six ranks) | Card 08 lists the older order | Draw the new order; card 21 already lists the NS-11 errata row |
| X4 | NS-47-R30 (a decline control of the same style in the same stack for every optional question) against NS-46-R41 / review F47-4 (sheet exit is Done; no second control) | A "Not now" row inside C-S25 is a no-op | C-S25 draws a "Not now" first row per optional group (G23) |
| X5 | NS-46-R3 / R-IA-2 (typed days leave the Reminders page) against built NS-18 where they live on Reminders, and builds with the flag off | Two homes in a flag-off build | C-S24 `.flagOff` holds typed days; D-S06 keeps a pointer row "Days" (area D) |
| X6 | IA-AUDIT D-10 (one row in Me and one on Reminders) against NS-46-R3 (one row, in Me) | One row or two | One row in Me (card wins); area D may add a pointer on Reminders |
| X7 | E28 ("never a list of recordings and never a count") against built `storage.tsx` and v1 of this file (a row per recording) | v1 contradicted the card | Corrected in v2 |

## 16. Card gaps and engineering gaps added in v2

| # | Card row | Gap | Proposed default |
|---|---|---|---|
| G15 | SEC-07 | "Under the D1 lines" does not say where an action sits in a sheet whose safe choice must be first | Plain 44 pt action directly under the D1 lines, before the buttons; tapping closes the sheet and opens App lock (OQ-5) |
| G16 | FR-SEC-06 | No owner check is possible on a phone with no passcode | Skip the check; the confirm is the only gate |
| G17 | NS-09-R6 / E28 | Words for several stuck recordings | One line, singular wording, whatever the number |
| G18 | NS-46, NS-47-R15 | Can a signed-out parent (after a sign-in) tick days? The store is per account and cleared at sign-out | Days row absent until sign-in; a build with no sign-in uses the single local owner |
| G19 | FR-PRV-01 | No re-agree path after withdrawal | Tap the row: the returning consent sheet (C-S11) |
| G20 | NS-46-R3 | Days page in a build with NS-18 but not the library | Typed days only (`.flagOff`) |
| G21 | NS-45, E-S16 | Two SystemLines apply at once in Me | The update line wins; the session line shows after it is gone |
| G22 | NS-47-R29 | DoorNote glyph "decorative lock" against the area's no-lock-imagery rule | Default: no glyph (OQ-1) |
| G23 | NS-47-R30 | Decline control in a sheet that has Done | "Not now" first row per optional group |
| G24 | NS-46-R35 | Whether the reminder line repeats after the first tick | Shown whenever nothing is ticked |
| G25 | NS-47-R17 | See X1 | Show only when a day is ticked |
| G26 | FR-LCY-21, SUP-07 | Words under `tooBig` before the split exists | None promising a date; "Write to us" only |

| # | Gap | Backlog row |
|---|---|---|
| E15 | Days page, Browse sheet, Day detail (`app/settings/days*.tsx`), NR-DAY-10 | new row needed (no id above BL-999 invented) |
| E16 | Privacy withdrawal row and sheet | BL-485 |
| E17 | Storage stuck line, `storage.tsx` rule amended | BL-977 (scope gains NS-09-R6, errata E28) |
| E18 | Days store: Application Support, backup exclusion set and read back, fails closed | NR-DAY-03, NS-47-R6, R28 |
| E19 | SlipCard variants `saveSlip`, `daySlip`, `askSlip`; the order as data | BL-963; COMPONENTS C9 |
| E20 | `DoorNote`, I4 `multi`, I1 `optional` | new COMPONENTS rows (design-systems) |
| E21 | Blank snapshot on every L4 screen | FR-SEC-22; BL-961 enumeration |
| E22 | Me regroup after T1 (`settings-home.logic.ts`) | BL-927/928 follow-up |
| E23 | Sign-out sheet additions | BL-961, BL-965 |
| E24 | Owner check before erase (LocalAuthentication) | new row needed |
| E25 | Delivered library-day reminders dismissed at sign-out | BL-961 (pattern `scheduler.ts:336-339`) |
| E26 | Export split above 2 GB | FR-LCY-21 new row |

## 17. Round 2 additions: photo moments, and pictures and videos with a letter

Source: founder direction `26-founder-direction-photos-library-and-media.md` (committed f8eead016). The cards NS-51 (photo moments, library read access) and NS-52 (several pictures and videos with a letter) are being written in `27-photo-moments-and-media.md`, which did not exist when this was written; rows below key to NS-51 and NS-52 by name. Every id here is PROPOSED and flagged: "pending NS-51 or NS-52" means the card has not been read and the founder has not ruled its questions (Q-PM-1 to Q-PM-7). Nothing here changes the constitution: no caption, title, summary or story is written from a picture; no count of pictures or unwritten days is shown; nothing from the library leaves the phone by this design; no face or person matching.

### C-S27 Photos access (PROPOSED; Me, Privacy and security or On this phone)

A pushed page for what the app may read from the Photos library on the phone, drawn so the parent can see and change every choice (NS-51, level 3). Me row: "Photos access" with a value "Off", "Selected photos" (limited) or "All photos" (full); never a count. Absent when the flag is off or the build cannot ask (absent, not greyed). Not in first run.
Layout: DoorNote (full form, first in reading order): what it reads (dates and how many pictures were taken together, nothing about what a picture shows), that it stays on the phone, that no face or person is matched, that place names are off. Then: "Photos the app can see" (an I4 choice: "Selected photos" / "All photos"; "Selected photos" opens the system's own limited-library picker, never ours), "Albums that count" (a multi-select list of the parent's albums, nothing preselected beyond what the parent picks; names are the parent's own and are shown only here), "Pause" (a switch: paused means no new moments and no index changes; the index stays until removed), "Turn off and remove the list" (destructive text, F6 `explained`: safe choice "Keep it on" default). A static line shows while the list is being made ("Looking at the photos on this phone."): no percentage, no count, no spinner loop.
Records and decline (PRIV-R21 door lines, for counsel): Shown: the DoorNote, then the system's own permission alert (its purpose string is the system's and is written by `content` with counsel). Records: on the phone only (the on/off choice, the album choice, the index; class L4). Never: a count of pictures, a place name by default, a picture on a server, a face match, a nudge that describes a picture. Decline: "Not now" is a full answer of equal weight (I1 `optional` pattern); nothing is requested again in the same sitting.
States: `.off`, `.consent` (DoorNote then the system alert), `.limited`, `.full`, `.paused`, `.indexing` (static line), `.albums`, `.turnOffConfirm`, `.removed` (one calm line "The list is removed from this phone."), `.denied` (iOS Settings: the D-S06 `.denied` pattern, "Open Settings"), `.changedInSettings` (the iOS choice changed outside the app: the page reflects it, no alarm), `.flagOff` (absent), `.killswitch` (absent at next focus), `.signedout`, `.second-account` (the index is per account: B sees none of A's, pending NS-51), `.backgrounded` (blank), `.ax5`, `.vo`, `.dark`.
Integration: NS-51 (pending); Q-PM-1 (limited by default), Q-PM-5 (place names off), Q-PM-6 (metadata only), Q-PM-7 (drop C); flag `EXPO_PUBLIC_PHOTO_MOMENTS` (PROPOSED, local family); modules PROPOSED. The Home moment card and its reminder are area A and D (the reminder is one of the existing budgeted classes, neutral words, NS-32).

### Media in Storage (C-S18, PROPOSED states)

`C-S18.media`: a group "Pictures and videos" with size per kind (pictures' stored copies, videos) as phone space only, never a count of items; the existing "Total" row unchanged; a row "Photo moments list" with its size and a "Remove" action (opens the same F6 sheet as C-S27 `.turnOffConfirm`). On `.lowSpace` a stuck recording is still the first item; large videos are named by kind, not by letter. A video's size cap and the per-letter limits (default up to 6 pictures and 2 videos, a founder default, NS-52) are the card's; this screen never shows "3 of 6". Nothing here deletes a letter's media without its own confirm.

### Save a copy, export, printable book (C-S04, C-S05, PROPOSED states)

- C-S04 "What is inside": add a row "Every video" when videos exist and the flag is on; pictures stay "Every picture's stored copy". Words only, no numbers (FR-DAT-13).
- The space estimate (estimate plus 200 MB, NS-11-R20) includes videos; `.error-lowSpace` names the amount; a copy with videos reaches the 2 GB split (`.parts`, FR-LCY-21) far sooner, so the split must ship before video does (engineering gap E27). `.lowPower` and `.running` unchanged; the bar steps by phase, never by items.
- The photo moments list is never in the copy (derived, L4): one line on C-S24's pattern, "The photo moments list is not part of Save a copy." on C-S27, not on C-S04.
- C-S05 Printable book: a video is not printed; a picture taken from a video is the parent's own choice (NS-52, pending). C-S05 draws no line about what is left out (the card says silent omission, C28-4); a QR to a video page is a print, counsel and finance question and is not drawn.
- Recently deleted (C-S17): a deleted letter returns with all its pictures and videos (NS-36-R1b extended), and Erase now erases them with it ("The letter, its recording, pictures and videos are erased for good."; words: content). Delete this book (C-S22) and Erase everything (C-S19) name pictures and videos; the Erase scan covers media and the moments list (FR-PRV-34 extended).
- Delete account (C-S20): pictures and videos stay on each phone until that phone is erased only while media never syncs (Q-PM-3 default: stays on the phone). If the founder rules sync, this line changes to the published deletion clock and C-S08 changes with it (pending Q-PM-3).

### Privacy, backup and provenance wording (PROPOSED)

- C-S23 Privacy: one new fact row "Photo moments" ("Only on this phone." true only while no picture, thumbnail or derived signal is sent; a claims row backs it); the iPhone backup line says pictures and videos are in the phone's own backup as NS-01-R27 states, and that the moments list is not (excluded, as the days store). Both lines are claims-registered and wait for counsel (X2, E23, Q45).
- C-S08 Where your letters live: media added to "On this phone"; with backup off nothing implies a picture or video survives the loss of the phone beyond the phone's own backup and Save a copy (the same truth principle as recordings).
- C-S09 provenance: a picture or video kept only on this phone says so with the same plain voice as recordings (pending NS-52 and Q-PM-3); no new emotional language.
- C-S21 (backup at the flip): media is not in recording backup; the screen says nothing about pictures or videos until a card includes them.

### Motion for round 2 (also in MOTION.md as M-C92 to M-C97)

| Id | State | What moves | `m.*`, `T-*` | Reduce Motion |
|---|---|---|---|---|
| M-C92 | C-S24-style push to C-S27 | native push | `m.push`, T-PUSH | system |
| M-C93 | C-S27.consent | DoorNote is static; the system alert is the system's | none of ours | none |
| M-C94 | C-S27.indexing | one static line; no bar, no count | `m.swap` to `.limited` or `.full` | swap |
| M-C95 | C-S27.paused | the switch moves | `m.select` | jump |
| M-C96 | C-S27.turnOffConfirm to `.removed` | F6 sheet, then the page's line swaps; H-warning after the choice | `m.sheet`, `m.swap` | system, swap |
| M-C97 | C-S18.media | rows are in place; Remove leaves by `m.list.remove` | `m.list.remove` | fade 160 |

Never animate: a moment appearing as a count, pictures "found", an index filling.

### Gaps for round 2

| # | Gap | Proposed default |
|---|---|---|
| G27 | Where "Photos access" sits in Me before and after T1 | `.default`: Privacy and security group; `.regrouped`: On this phone |
| G28 | Whether an index per account is cleared at sign-out (like the days store) | Cleared at sign-out and Erase, per account, L4, excluded from backup (pending NS-51) |
| G29 | Albums that count: whether album names may appear in any state other than C-S27 | Only on C-S27; never in a Home card, a notification, a log or a count |
| G30 | Does "Pause" end by itself | No; it stays until the parent changes it |
| E27 | Export split must ship before video; media in the Erase scan; media sizes per kind in Storage | FR-LCY-21; FR-PRV-34; FR-REL-37 (new rows) |

## 18. Open design questions (each with its default)

| # | Question | Default |
|---|---|---|
| OQ-1 | Does DoorNote carry a decorative lock glyph? The area's rule is no lock imagery that implies safety. | No glyph; words only. Karma rules. |
| OQ-2 | Does the Me regroup (`.regrouped`) replace `.default` after tree test T1, and are the group titles "Days and reminders" and "On this phone" the ones tested? | Yes after T1, working titles as drawn; `content` names them. |
| OQ-3 | Is the Spoken language row hidden in English-only builds, and is there a Languages list screen in Me? | Neither: the row stays (card 22: no row is deleted); the list is area E. |
| OQ-4 | Is the first tick's iOS permission ask preceded only by the inline reminder line, or by a sheet? | Inline line only (no second sheet over Browse, NS-46-R41). |
| OQ-5 | "Turn on App lock" on the sign-out sheet: above or below the three buttons? | Directly under the D1 lines, plain; the safe choice stays the first button. |
| OQ-6 | Owner check before Erase on a phone with no passcode. | Skipped. |
| OQ-7 | Does Clear all offer Undo? | No; Browse re-ticks. A quiet confirm already guards it. |
| OQ-8 | Which Me line wins when update-required and session-ended both apply? | Update required. |
| OQ-9 | Is there any print entry (PRT-S01) drawn in 1.0? | No (no order feature in 1.0). |
| OQ-10 | PQ-6 "Clear the due date" on C-S15. | Not drawn until the founder takes it; the spec is in 13.1. |
| OQ-11 | PDF fonts for Arabic and Chinese, and Hindi line height. | The template embeds the faces it needs; no missing-glyph state is shown; `design-systems` and `mobile` decide the size cost. |
| OQ-12 | The Days row for a signed-out phone after a sign-in. | Absent until sign-in (G18). |
| OQ-13 | Round 2: limited library or full access by default (Q-PM-1), and place names (Q-PM-5). | Limited ("Selected photos") first; place names off; pending NS-51. |
| OQ-14 | Round 2: do pictures and videos sync (Q-PM-3)? | No: they stay on the phone; C-S20 and C-S08 words follow that default. |
