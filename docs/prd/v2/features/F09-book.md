# F09 The book: month chapters, Before You, cards

| | |
|---|---|
| Release | v1.0 gate (search: v1.0 P1, first to cut) |
| Priority and rank | P0, rank 5 (`05-feature-map.md` section 2) |
| Personas | P1, P2, P3, P4, P6 |
| Existing IDs | B-REQ-002, B-REQ-005, B-REQ-011, B-REQ-014, B-REQ-015, B-REQ-016, B-NFR-007, C-REQ-010, C-REQ-011, C-REQ-012, C-REQ-015, PRD-REQ-004, PRD-REQ-011, PRD-REQ-012, DATA-REQ-010, DATA-REQ-011, DATA-REQ-013, DATA-REQ-015, D-027, D-028, D-084, D-085, K-09, BL-034, BL-035, BL-134, BL-151, BL-156, BL-160, BL-258, BL-264, BL-265, BL-266 |
| Depends on | F03 (child, birthday or due date, signature), F04 (save, backdating, `occurred_precision`), F06 (Review destination), F08 (player), F11 (co-parent letters), F13 (notifications), F16 (sync) |
| Status | Draft V2, 3 Oct 2026. Reconciled on 13 Oct 2026 with D-084 (quiet-day rows), D-085 (Recently deleted shelf) and the code on `develop`. Revised 14 Oct 2026 after critique round 1: Quiet this book, the preterm reminders question, multilingual reading, no empty-month rows, M14 pass (disposition in `reviews/DISPOSITION-C.md`) |

## 1. Why

- [S] All 6 chronology reviews in R2's sample are complaints: feeds out of order, missed days hard to add, a fee to backdate (R2 section 0 item 6, theme T25).
- [S] Backdated entries sort wrongly in 23snaps; Tinybeans and Apple Journal users ask for easier backdating (R1 F09; R1-S10, R1-S2, R1-S5).
- [F] No product R1 opened files letters into month-of-age chapters; only Tiny Treasures tags age (R1 F09; R1-S67). Several products count streaks (Apple Journal, Calm, Tell Me Your Story) (R1-S5, R1-S48, R1-S21).
- [S] Unfilled baby books feel like failure; blank books are reported at 14 months, 19 months and nearly 3 years (UR S24, S26). An empty month must read as an invitation, not a gap.
- [S] Legacy for future generations is the most common Remento and Storyworth praise (25 of 84, R2 T23). The book is what P6 reads; it has to make sense by age without the app.
- [S] Preterm parents asked for adjusted dates (R2 T28; R2-S2, R2-S14). Pregnancy pages are praised (R2-S15).
- [D] A quiet day is a mark, not a letter: "Not much today" stores a mark with no words; the Book shows an unsigned "A quiet day" row with the date; marks never count, print, play or move into the book (D-084, `_AUTHORING.md` M10). Built in commit f4cdbc3 (`components/book/quiet-day.logic.ts`, `quiet-day-row.tsx`, `chapters.ts`).
- [D] Deleting asks first, then the letter waits 30 days on a Recently deleted shelf with its recording; Erase now and the launch purge erase it for good, recording first (D-085, M11). Built in commit 6482cd3 (`app/settings/recently-deleted.tsx`, `components/book/confirm-sheet.tsx`, `shelf.logic.ts`, `lib/capture/erase.ts`).

## 2. Who

| Persona | Moment | Holding, feeling, short of | What F09 must do |
|---|---|---|---|
| P1 Evening parent | After the baby is down; opens the Book to see what is there | Phone, one hand, dim room; short of time; fears feeling behind | Newest chapter on top, letters in the order things happened, nothing that counts what is missing |
| P2 Co-parent | Reads more than writes [A] (R2 section 5, P2) | Their own letters plus the other parent's, possibly in a language they do not read [A] (R3 DX-10, DX-29) | See both parents' in-book letters, each signed; never the other's private letters; told plainly which language a letter is in and who can read it aloud |
| P3 Expecting parent | Third trimester | A due date, no birthday | Before You chapter, no countdown, no due-date card (B-REQ-015) |
| P4 Multilingual family | Letters in Hindi, Arabic, Mandarin and English in one month | Mixed scripts | Each letter in its own script and its own stored direction in the same chapter, read by VoiceOver in its own language; never translated |
| A family in a hard time | A NICU stay, or a loss | A book that keeps talking about the child | One self-serve control that quiets every message about this child for this person, with no reason asked and no loss words (R3 DX-05, DX-18) |
| P6 Future reader | Shared reading at 2 to 5; handover at 18 | The app or the export | A book by month of age, each letter dated and signed |

## 3. What we are solving

**Outcome:** every letter lands in the chapter for the month of the child's life it is about, the book shows what exists without ever counting what does not, and it reads the same in every script.

| Metric | Target | How measured | Consent caveat |
|---|---|---|---|
| Letters filed in the wrong chapter | 0 in the age-math property test (10,000 random birth and moment dates) | CI, `packages/core` | None, test |
| Backdated letters share | Set after 8 weeks of cohorts | `letter_saved` with a new `backdated` bool property (F04 owns the event) | Opt-in only (D) |
| Book opens per weekly active parent | Set after cohorts | `book_opened` | Opt-in only |
| 60-letter chapter render | p95 500 ms on SE 3 | Performance run, 200 samples (PRD 7.1) | None |
| Gap or count copy in Book strings | 0 | Content rules test (C-REQ-005, C-REQ-015) | None |

## 4. Scope

**In v1.0**
- Month-of-age chapters from the birthday, newest first; Before You for letters dated before birth or written in due-date mode.
- Ordering by the date of the moment (`occurred_on`), then `captured_at`; month-precision letters (`occurred_precision = month`, F04-REQ-015) handled.
- Free backdating at save (F04) and "Change the date" on your own saved letters (new here).
- In book versus private: the author's choice; co-parent letters per F11 (no approval between parents, F11-REQ-010).
- Signatures frozen at save ("From Papa").
- Quiet-day rows (D-084): one unsigned "A quiet day" row per marked day, hidden on a day that also has a letter; never counted in a chapter line, never in the printable book, never in Read together, never movable into the book; removable.
- No row for an empty past month. One action at the end of the book, "Add a letter about an earlier month", until Study 1 tests the alternatives (R3 DX-35). The current month's open card stays.
- Quiet this book: per person, per child, self-serve from the book menu; stops reminders, prompts, month and birthday messages, milestone and birthday cards for that child for that person; letters untouched; reversible (R3 DX-05).
- When a birth date replaces a due date and is 21 or more days early, one neutral question about reminders, default off (R3 DX-18).
- Multilingual reading: the letter's stored direction, a language label and an ask line for a reader who does not share the language, `accessibilityLanguage` per letter, per-script line heights (R3 DX-10, DX-20, DX-21).
- Quiet milestone cards (C-REQ-010), birthday and month-age cards in the book (C-REQ-011 book half; notifications are F13), pause celebrations (C-REQ-012), never-celebrated list (C-REQ-015).
- Hidden books (B-REQ-014) and the Hidden books list.
- Mixed scripts and right-to-left letters in one chapter.
- Confirm before delete, undo, the Recently deleted shelf with Restore and Erase now, and the 30-day launch purge (DATA-REQ-010, D-085).
- Large-book reading: 60 letters per chapter budget; five years of chapters.
- Search on the device, P1 (cut first if late).

**Later**
- Year One cover and celebration, On this day (C-REQ-013, C-REQ-014): F47.
- Filters (`book.filters.*` exist in content): v1.1.
- Themes and photos (B-REQ-019, B-REQ-024): F46.
- Sealed letters (B-REQ-018): F41.
- Preterm adjusted age display: v1.1 candidate, not v1.0 [R] (Q2; F30 candidates).

**Never**
- Streaks, letter counts per author, comparisons between months or authors, missed-day counts (CLAUDE.md content rules; C-REQ-015).
- Due-date countdown or due-date card (B-REQ-015).
- Any reorder, summary, translation or rewrite of a letter (constitution).
- Algorithmic layouts that drop or crop words (R1 F09, Qeepsake complaint).

## 5. Market reference

| Product | What it does | Does it work? (evidence) | What customers say | Our call |
|---|---|---|---|---|
| Qeepsake | Entries flow into a journal; books laid out by algorithm [F] R1-S1, R1-S56 | 4.9 (15K) | Layouts cannot be adjusted; one-line answers waste pages [S] R1-S56 | **Avoid** fixed layouts [R] |
| Tinybeans | Automatic date-based organisation [F] R1-S2 | 4.9 (104K) | Backdating through the camera roll is slow [S] R1-S2 | **Match** auto-filing, make backdating one tap [R] |
| 23snaps | Galleries and timeline [F] R1-S10 | 4.8 (11K) | Backdated entries sort wrongly [S] R1-S10 | **Avoid**: file by the moment's date [R] |
| Tiny Treasures | Age-tagged messages [F] R1-S67 | 5.0 (7) | n/a | **Innovate** with true month chapters [R] |
| Apple Journal | Calendar and map views; streaks and statistics [F] R1-S5 | 4.8 (327K) | Users want better backdating [S] R1-S5 | **Avoid** streaks [R] |
| From, Mama | Chronological timeline by child and date [F] R1-S20 | 4.9 (48) | n/a | Neutral |
| Gap | No product R1 opened shows empty months; several count streaks [F] R1-S5, R1-S48, R1-S21 | n/a | n/a | **Innovate**: empty months exist, quiet, never counted [R] |

## 6. Experience

### 6.1 Entry points

| Entry | Where | Notes |
|---|---|---|
| Book tab | `(tabs)/book.tsx` | Opens on the active child (PRD-REQ-012) |
| After save | Review success | Letter is already in place with the arrival wash (COMPONENTS 2.5) |
| Milestone card | Inline in the Book | Once per reader (C-REQ-010) |
| Month-age or birthday notification | F13 | Opens the Book at that chapter |
| Settings > Children > Hidden books | `settings/children/*` | Read-only view of a hidden book |
| Settings > Your data > Recently deleted | new route `settings/recently-deleted.tsx` | Author's own tombstoned letters |

### 6.2 Happy path

1. **Open the Book.** Parent taps Book. App shows `book.title` ("{child}'s book"), the switcher (`children.switcher.label`), Read together if any letter is in the book (`readTogether.title`), then chapters newest first. System reads `listBookRows(childId)` (new, TDD 01 3.8): id, `occurred_on`, `occurred_precision`, `captured_at`, kind, `final_text`, `in_book`, `author_signs_as`, `author_id`, audio presence; never `raw_transcript` or `machine_edits`.
2. **Chapters.** Each chapter header shows the title (`book.chapterTitle` "Month {month}", `book.chapterNewborn` for month 0, `book.beforeYouChapter`) and one line: what exists and who wrote it ("3 letters · From Mama, Papa"). The count line names only kinds present (`countLine` in `components/book/chapters.ts`); it never names a per-author number (C-REQ-015).
3. **This month.** If the current month has no letters yet, a card above the list shows `book.thisMonthLabel`, `book.empty.chapterTitle` ("Month {month} is open.") and `book.empty.chapterBody`. Today this exists in `book.tsx` (the `currentEmpty` card). Tapping it opens Tonight with the child preset.
4. **Earlier months.** Past months with no letters get no row, no header and no gap (R3 DX-35: a range row names the months a parent missed). At the end of the book, after the oldest chapter, one text button `book.earlierMonth.cta` (new, "Add a letter about an earlier month") opens a sheet listing Before You, The first weeks and Month 1 to the current month; picking one opens capture with `occurredOn` preset to the first day of that month of age and `occurredPrecision = month` (F04 entry table). Study 1 compares this with no action and with the range row (Q1).
5. **Read a letter.** Tap a card (`LetterCard`). `letter/[id].tsx` shows the dateline (`letterDateline` in `lib/dates.ts`), the text at the reader's size (`reader.sizes.*`) in the letter's stored direction (6.3 "Direction"), the signature at the letter's end edge (`book.signature` "From {signsAs}"), provenance (`book.provenance.*`), and the recording line or player (F08). When the letter's language is not one of the reader's own letter languages, a small `AppNote` line above the text reads `book.letterLanguage` (new, "In {language}"), and when this phone also has no recording of it, a second line `book.askToRead` (new, "Ask {signsAs} to read this one with you.") (R3 DX-10). Both need the letter language to be readable by members, which F11 and F16 own (request; until then neither line shows).
6. **Change the date (own letter).** New action `book.entryMenu.changeDate` (new) opens the F04 date sheet (day or month tab). Saving writes `occurred_on` and `occurred_precision` as a new version (the server versions `occurred_on` changes, migration `20261003000000_security_and_family.sql`). The letter moves to its chapter with a 200 ms cross-fade.
7. **Add to book or make private (own letter).** Existing actions `book.entryMenu.moveToBook` and `makePrivate` call `setEntryInBook`. Toasts `review.destination.addedToast` and `privateToast`.
8. **Delete (own letter, D-085).** `book.entryMenu.deleteButton` opens a confirm sheet whose large button is "Keep it" (`components/book/confirm-sheet.tsx`). Confirming writes a tombstone; the undo toast stays until dismissed (`UndoToast`, BL-264). The letter, with its recording, waits on the Recently deleted shelf.
9. **Recently deleted (D-085).** Settings > `settings.delete.recentlyDeleted` (row with `shelfHelp`, `app/settings/index.tsx`) lists own deleted letters, newest deletion first (`listDeleted`). Each row shows the first words (`firstWords`, up to 90 characters), the letter's date, the day it was deleted and the day it will be erased, once, in the phone's own day; nothing counts down (`shelfRow`). A letter waiting for words or with no words shows no excerpt.
10. **Restore.** Restore (`undeleteEntry`) puts the letter back exactly as it was, to the book or private as before, with a toast. With sync on, the change goes out as an `entry.restore` outbox op, never as `deleted_at = NULL` (`lib/sync/outbox.ts`).
11. **Erase now.** Asks once, then erases the recording and its listening copy and then the row (`eraseDeletedLetter`). If the file will not go, the row stays for a retry.
12. **Launch purge.** At launch, after the capture sweep and never during a recording, letters deleted 30 or more days ago are erased the same way (`purgeShelfAtLaunch`). No purge while the phone clock is earlier than the last launch; no local purge in a build where sync is on (the server owns the clock, DELETION_AND_EXPORT_SPEC 2.2 step 7).
13. **Quiet-day rows (D-084).** A day marked with "Not much today" shows one small unsigned row: the date and `book.quietDay.label` ("A quiet day"), VoiceOver `book.quietDay.a11y` ("{date}. A quiet day, kept."). The row is hidden when the same day has a letter or note (`visibleInBook`). A chapter of only quiet days has no author line, and the chapter count line never counts marks (`countLine` filters them). Remove this mark (`book.quietDay.remove`) deletes it with `book.quietDay.removedToast`.
14. **Milestones.** On the save that reaches a C-REQ-010 milestone, the next Book open shows one inline card at that letter (`moments.*`), once per reader, no modal, push, sound or confetti. "Lovely" (`moments.dismissButton`) dismisses it for good.
15. **Birthday and month-age in the book.** On a monthly birthday the new chapter's header settles in (MOTION `gentle`); on the 12, 24, 36, 48 and 60 month birthdays one card opens that chapter (new `moments.birthdayInBook`: "{child} turned {years}.", where `years` is whole years, 1 to 5, with no unit word: "Asha turned 1.", "Asha turned 2." R3 DX-36). No card when celebrations are paused or the book is quieted for this person and child (C-REQ-012, step 18).
16. **Search (P1).** A search field above the chapters. Results list matching letters in chapter order with the match in context; empty result shows `book.empty.searchTitle`.
17. **A birth date replaces a due date (preterm and NICU, R3 DX-18).** When a parent sets a birth date on a book that had a due date, and the birth date is 21 or more days before the due date [A: threshold to confirm with a clinician, BL-105], one sheet asks once, on that parent's phone: title `book.birth.remindersTitle` (new, "Reminders for {child}"), body `book.birth.remindersBody` (new, "You can start gentle reminders now, or leave them off and turn them on from {child}'s book whenever you like."), primary `book.birth.remindersLater` (new, "Leave them off for now"), secondary `book.birth.remindersNow` (new, "Start them now"). Later turns off "Include {child} in my reminders" for this person (`children.settings.remindersLabel`, exists), which also stops month and birthday messages (`remindersHelp`). The other parent sees the same question once when they next open the book. The sheet never names the reason. Chapters follow the birth date; corrected age is not shown at v1.0 (Q2).
18. **Quiet this book (R3 DX-05).** The book header menu (an overflow button beside the child switcher) holds `book.menu.quiet` (new, "Quiet this book"). It opens a `Sheet`: title `book.quiet.title` (new, "Quiet {child}'s book for you?"), body `book.quiet.body` (new, "No reminders, prompts, month or birthday messages, or milestone cards about {child}, for you. Every letter stays just as it is, and nothing changes for anyone else. You can turn this off from this menu any time."), primary `book.quiet.confirm` (new, "Quiet it"), secondary `common.cancelButton`. No reason is asked. On confirm: this person's "Include {child} in my reminders" turns off, "Pause celebrations for {child}" turns on, Tonight shows no prompt card while this child is active (Speak and Type stay), milestone and birthday cards stop, and a `Toast` says `book.quiet.doneToast` (new, "Quiet for you."). The menu item becomes `book.menu.unquiet` (new, "Turn messages back on"), which restores the earlier switch values. It works offline and syncs only to this person's own devices. The same action as a notification action is a request to the F13 owner. Hide this book (F12, both parents) stays as it is; support's S-1 path is for the human conversation, not the switch (F20).

### 6.3 Age math, dates and ordering rules

| Rule | Behaviour | Verified source |
|---|---|---|
| Dates | `occurred_on`, birthday and due date are calendar dates (`YYYY-MM-DD`) with no time zone; age math uses UTC day numbers so no date shifts west of Greenwich | `packages/core/src/age.ts` header and `dayNumber` |
| Which date a letter gets | The local calendar date on the author's phone when the draft started (`todayISO(new Date(draft.createdAt))` in `review.tsx`); a recording begun at 23:58 and saved at 00:04 keeps the earlier date | `apps/mobile/src/app/review.tsx` line 236 |
| Travel and other time zones | The date is fixed at capture and never recomputed; a co-parent in another zone sees the same date | Inferred from date-only columns |
| Chapter | `chapterOf(birthday, occurred_on)` = whole calendar months; month 0 is "The first weeks" | `age.ts` |
| Born on the 29th to 31st | Anniversary clamps to the last day of short months: born 31 Jan, 28 Feb is month 1; born 31 May, 30 Jun is month 1 and 31 Jul is month 2 | Run on 3 Oct 2026 against `age.ts` |
| Born on 29 Feb | 28 Feb counts as the anniversary in non-leap years (2025-02-28 is month 12) | Same run |
| Before You | `monthFor` returns null when there is no birthday or the date is before it | `components/book/chapters.ts` |
| Order | Chapters newest first; inside a chapter newest first by `occurred_on`, then `captured_at` | `listEntriesForChild` ORDER BY in `lib/store.ts` |
| Month precision | A letter with `occurred_precision = month` stores the first day of that month of age (F04-REQ-015). It sorts as the oldest letter of its chapter, and its dateline reads "Sometime in Month {month}" (new `book.dateline.monthOnly`) instead of a day | F04 section 6.2 E |
| Direction | Each letter renders in its stored `base_direction` (F04 11.3): `rtl` for Arabic letters, and for typed letters whose right-to-left letters outnumber left-to-right ones; otherwise `ltr`. The whole letter block, its paragraphs and its signature follow it; Latin names and digits inside an Arabic letter keep their own order through the Unicode bidi rules. The chrome stays left to right (English UI, B4) | R3 DX-20; F04 11.3 |
| Line height per script | Letter text uses `letterBody` (Literata 20/32) for Latin; Devanagari, Arabic and Han runs get their own line-height tokens (new: `letterBodyDevanagari`, `letterBodyArabic`, `letterBodyHan`, values [A] 20/36, 20/36, 20/34 until design systems sets them from AX5 snapshots) so stacked marks never clip | R3 DX-21; DESIGN_LANGUAGE type table |
| Month precision, Before You | Stores the day before the birthday (or before the due date while expecting) with precision `month`; dateline reads `book.beforeYouChapter` with no day [R]; confirm with the F04 owner (Q5) | new |
| Birth date entered later | Chapters recompute from `occurred_on` and the new birthday. A letter dated after the real birth but written in due-date mode moves out of Before You into its month. Letters before birth stay in Before You (B-REQ-005) | B F2 step 3 |
| Due date passes, no birth | Nothing changes in the Book; no card or line mentions it (B-REQ-015) | B-REQ-015 |
| Defect found | `letterDateline` uses the due date as the age anchor, so a letter dated after the due date of a child not yet marked born reads "Asha is 4 days old" (core `dateline('2026-10-05','Asha','2026-10-01')`, run 3 Oct). Fix: with no birthday, the age sentence is always the before-birth sentence | `lib/dates.ts` line 60 |

### 6.4 Unhappy paths and edge cases

| ID | Trigger | System behaviour | What the person sees | Recovery | Test |
|---|---|---|---|---|---|
| F09-U01 | Offline | Book reads local SQLite only; never waits on network | Full book | n/a | `[F09-REQ-001]` airplane-mode E2E |
| F09-U02 | Book opens with 5 years of letters (1,200) | `SectionList` virtualises; chapters render on demand; switch to FlashList if a 60-letter chapter misses p95 500 ms (TDD 01 3.8) | Smooth scroll | n/a | Perf run with 1,200-letter fixture |
| F09-U03 | App killed during "Change the date" | Date change is one local transaction; either old or new date | Letter in one chapter, never two or none | Retry | Kill test 50 of 50 |
| F09-U04 | Co-parent changes their letter's date while I read | Pull updates the row; chapters regroup on the next render | Letter moves; reading view stays on the letter | n/a | Two-phone test |
| F09-U05 | Duplicate taps on Delete | Second tap ignored while the tombstone write runs | One toast | n/a | Unit |
| F09-U06 | Restore offline | Queued `restore_entry()`; local row shows restored with "Not sent yet" | Letter back in its chapter | Syncs later | `[DATA-REQ-010]` offline variant |
| F09-U07 | Restore conflicts with server purge (offline past day 30) | Server returns not found; local row removed on sync; told once | "This letter could not come back." (new `settings.delete.restoreGone`) | None | Integration |
| F09-U08 | Local undelete sets `deleted_at = NULL`, which the server refuses (`SCTMB`, DATA-REQ-013) | Restore must call `restore_entry()`, never a raw update; current `undeleteEntry` in `store.ts` is replaced | n/a | n/a | `[DATA-REQ-013]` sync test |
| F09-U09 | Low storage | Book is read-only work; no new files | Normal book | n/a | n/a |
| F09-U10 | VoiceOver | Chapter header is a header with title and line; card is one element with the A11y label in `letter-card.tsx`; the end-of-book earlier-month action reads as a button | Spoken | n/a | V1 manual script |
| F09-U11 | AX5 text | Letter text uncapped (D-027); card excerpt 2 lines with full label; header line wraps | No truncation of letters | n/a | Snapshot at AX5 (BL-266) |
| F09-U12 | Reduce Motion | Arrival wash and chapter settle become 200 ms fades | Calm | n/a | V6 script |
| F09-U13 | Arabic letter beside English letters, including an Arabic letter that starts with "Asha," or a date | The letter's stored `base_direction` sets `writingDirection` for the whole block (not the first strong character, R3 DX-20); card and signature alignment follow the letter; chrome stays left to right; the text element carries `accessibilityLanguage` from the letter language so VoiceOver uses that language's voice | Right-aligned Arabic letter between left-aligned English ones; the Latin name sits inside it in reading order | n/a | `apps/mobile/test/letter-text.test.ts` (new) with the fixture "Arabic letter starting with a Latin name"; render fixture with Arabic, Hindi, Chinese and English in one chapter; VoiceOver script V1b |
| F09-U26 | A co-parent opens a letter in a language they did not choose for their own letters, with no recording on their phone | `book.letterLanguage` and `book.askToRead` above the text (step 5); nothing is translated | "In Hindi" and "Ask Papa to read this one with you." | Read together with the author (F10) | `apps/mobile/test/letter-language-label.test.ts` (new) |
| F09-U27 | Quiet this book on, then a monthly birthday, a reminder slot and a milestone arrive | Nothing is scheduled or shown for that child for this person; the other parent is unaffected | Nothing | Turn messages back on | `apps/mobile/test/reminders-planner.test.ts` (new case); `apps/mobile/test/book-quiet.test.ts` (new) |
| F09-U28 | Birth date set 21 or more days before the due date, then the app is killed before the sheet is answered | The question shows once more on next open of the book; never a third time | The reminders sheet | Leave them off for now | `apps/mobile/test/book-birth-sheet.test.ts` (new) |
| F09-U29 | Quiet this book while offline | Applies at once on this phone; syncs to this person's other devices later | Toast | n/a | Same test, offline variant |
| F09-U14 | Script with no bundled font (Arabic, Chinese) | System font fallback; Devanagari uses Tiro (DESIGN_LANGUAGE 3) | Correct glyphs, never boxes | Install the language pack adds the reading font (F05) | Glyph coverage test |
| F09-U15 | Other parent's private letter | Never on this phone (F11-REQ-009) | Not shown | n/a | Visibility fixtures |
| F09-U16 | Hidden book | Not in the switcher; notifications cleared on every member device within one sync (B-REQ-014); visible read-only in Hidden books | `children.settings.hiddenTitle` list | `children.settings.showButton` | `[B-REQ-014]` |
| F09-U17 | Signed out (no account) | Book works on this phone; author id null counts as own (`isOwnEntry`) | Full book | n/a | Unit |
| F09-U18 | Lapsed or Free | Book never calls the plan engine (`read` is `FreeForever` in `packages/core/src/plan.ts`) | No Plus UI | n/a | Static import test |
| F09-U19 | Account deleted elsewhere | F17 flow: one local export, then wipe (DATA-REQ-023) | Notice | Export | F17 |
| F09-U20 | Two children | Every query scoped by `child_id`; switching re-runs only the Book query | Other book in 300 ms | n/a | E2E-06 |
| F09-U21 | Birthday changed in Settings | Chapters recompute; no letter's `occurred_on` changes | Letters regroup | n/a | Property test |
| F09-U22 | Letter dated in the future (clock wrong) | F04 bounds the picker to today; a synced future date files by its date and is not shown above the current month card | Normal chapter | Author changes the date | Unit |
| F09-U23 | Voice-only letter (`transcriptStatus = 'waiting'`) | Card shows `book.waitingForWords` ("A recording, waiting for its words.", exists) as an `AppNote` until words arrive | The card with the recording line | Words later or type | Existing card code |
| F09-U24 | Search with Chinese characters | FTS `unicode61` does not split Chinese (no spaces); query with CJK characters uses a substring scan over this child's `final_text` instead | Matches found | n/a | Search fixture |
| F09-U25 | Milestone reached on a co-parent's phone | Milestones are per reader: each reader sees each card once on their own device | One card each | n/a | Unit |

### 6.5 Screen states

Components from `docs/design/COMPONENTS.md`: `EmptyState` (2.15), `StateScreen` and `InlineState` (2.15a), `LetterCard` (2.5), `AppNote` and `QuietDayRow` (2.5b), `MonthChapterHeader` (2.20), `Sheet` (2.12), `Toast` (2.14).

| Screen | Empty | Loading | Error | Offline | AX5 (SE 3) | VoiceOver |
|---|---|---|---|---|---|---|
| Book | `EmptyState` with `book.empty.bookTitle`, `.bookBody`, `.bookCta` | None for local reads; a book over 500 letters renders the current chapter first (TDD 01 3.8) | Database could not open: `errors.launch.*` `StateScreen` (exists) | Identical; nothing waits on sync | Cards show 2 lines with full labels; headers wrap; letters never truncate (D-027) | Chapter header is a header; each card one element; the end-of-book action is a button |
| Current month | Open card `book.thisMonthLabel`, `book.empty.chapterTitle`, `.chapterBody` | n/a | n/a | Identical | Wraps | Read as one element |
| Letter view | n/a | n/a | Not found (deleted elsewhere): `errors.notFoundPage.*` `StateScreen`; recording missing: F08 line | Identical | Text uncapped; dateline wraps; language lines wrap | Dateline, language line, text (in its own language voice), signature, provenance, recording |
| Hidden books | `children.settings.hiddenEmpty` | n/a | n/a | Identical | Rows wrap | List of buttons |
| Recently deleted | No rows: the screen says nothing is waiting (`settings.delete.*`, exists) | n/a | Erase failed: the row stays and says it will try again | Identical | Rows two lines | Each row: first words, deleted day, erase day |
| Quiet this book sheet | n/a | n/a | n/a | Identical; syncs later | Buttons stack | Title focused first |
| Birth reminders sheet | n/a | n/a | n/a | Identical | Buttons stack | Title focused first; no countdown |

## 7. Requirements and acceptance criteria

Renamed on 14 Oct 2026 (R5 EQ-05): F09-REQ-020 to F09-REQ-029 replace rows that restated legacy IDs owned by F03, F06, F11, F12, F13 and F17. F09 stays the home of C-REQ-010 and C-REQ-015.

| ID | P | Requirement | Acceptance criteria | Source |
|---|---|---|---|---|
| F09-REQ-020 | P0 | Expecting mode and Before You; transition to born (book slice of B-REQ-005; home F03) | Given due-date mode, When a letter saves, Then it is in Before You. Given a birth date entered, Then letters dated before it stay in Before You and later ones move to their month | B |
| F09-REQ-021 | P0 | No due-date countdown or card in the book (book slice of B-REQ-015; home F13) | Given the due date passed with no birth date, Then no Book card, line or dateline mentions the due date | B |
| F09-REQ-022 | P0 | Private by default; author chooses (book slice of B-REQ-011; home F11) | Given a letter saved without choosing, Then `in_book = false`. Given a private letter, Then no other member's device receives it | B, F11-REQ-009 |
| F09-REQ-023 | P0 | Signature on every letter, frozen at save (book slice of B-REQ-002; home F03) | Given "Papa" at save and a later rename to "Dada", Then the old letter still reads "From Papa" | B, `authorOf` |
| F09-REQ-024 | P0 | Hide a book, as the book shows it (book slice of B-REQ-014; home F12) | Given Asha's book hidden, When any member syncs, Then no Asha notification stays scheduled and Asha is absent from the switcher; Hidden books lists it read-only | B |
| C-REQ-010 | P0 | Quiet milestones | Given the 100th save, When the Book opens, Then the card shows once inline at that letter and never again on that device; no modal, push, sound or haptic beyond the tap | C |
| F09-REQ-025 | P0 | Month-age and birthday in the book (book slice of C-REQ-011; home F13) | Given a birth date on the 31st and a 30-day month, Then the new chapter starts on the 30th. Given the 12th month birthday, Then one `moments.birthdayInBook` card reading "Asha turned 1." opens chapter 12 once per reader; given the 24th, "Asha turned 2." | C; R3 DX-36 |
| F09-REQ-026 | P0 | Pause celebrations per person per child, as the book shows it (book slice of C-REQ-012; home F13) | Given pause on for Mama and Asha, Then Mama sees no milestone or birthday card for Asha and Papa still does | C, PRD-REQ-013 |
| C-REQ-015 | P0 | Never celebrated | Given every `moments.*` and `book.*` string, Then the content test finds no comparatives, per-author counts, streaks or frequency words | C |
| F09-REQ-027 | P0 | Delete and restore from the book (book slice of DATA-REQ-010; home F17) | Given an author deletes offline, When synced 3 days later, Then Recently deleted shows the erase date from the server `deleted_at`. Given Restore, Then `restore_entry()` succeeds and the letter returns to its chapter | DATA spec 2.2 |
| F09-REQ-028 | P0 | Nobody deletes another's words, as the book shows it (book slice of DATA-REQ-015; home F17) | Given a co-parent's letter, Then no Delete, Edit or Change the date action renders, and `delete_entry()` fails | DATA spec |
| F09-REQ-029 | P0 | Working material author-only in the book (book slice of PRD-REQ-004; home F06) | Given the Book query, Then no `raw_transcript` or `machine_edits` column is selected; "Show exactly what I said" renders only on own letters | K-09 |
| F09-REQ-001 | P0 | Chapters by month of age | Given 10,000 random (birthday, date) pairs, Then `chapterOf` equals a reference implementation, months 0 to 72, including births on the 29th, 30th, 31st and 29 Feb | `age.ts` |
| F09-REQ-002 | P0 | Order by the moment | Given letters saved in order C, A, B with `occurred_on` A < B < C, Then the chapter shows C, B, A; ties order by `captured_at` descending | R2 T25 |
| F09-REQ-003 | P0 | Month-precision letters | Given `occurred_precision = month` for Month 3, Then the letter is the last card in Month 3 and its dateline is `book.dateline.monthOnly` with no weekday or day | F04-REQ-015 |
| F09-REQ-004 | P0 | Change the date on own letters | Given own letter in Month 5, When the author picks Month 2, Then it shows in Month 2 within 300 ms, a version row records the change, and the co-parent sees the move within one sync | migration `20261003000000` |
| F09-REQ-005 | P0 | Empty months are never shown as gaps | Given letters in months 1 and 6 only and today in month 8, Then the Book shows, top to bottom: the Month 8 open card, chapter 6, chapter 1, and after it one `book.earlierMonth.cta` button; no row, header or line names months 2 to 5 or 7 | R3 DX-35; 03 principle 4; UR S24 |
| F09-REQ-006 | P0 | Earlier-month action opens backdated capture | Given a tap on `book.earlierMonth.cta` then Month 3, Then capture opens with `occurredOn` = first day of month 3 and `occurredPrecision = month` | F04 entry table |
| F09-REQ-007 | P0 | Dateline with no birthday never states an age | Given a child with a due date only and a letter dated after the due date, Then the dateline reads the date plus the before-birth sentence | `lib/dates.ts` defect |
| F09-REQ-008 | P0 | Mixed scripts and directions | Given one chapter with English, Hindi (Devanagari), Arabic and Mandarin letters, Then each renders `final_text` byte for byte, Arabic paragraphs set `writingDirection: 'rtl'` and right alignment, Devanagari uses Tiro, and no glyph renders as a missing-glyph box | DR-15, F11-REQ-016, BL-265 |
| F09-REQ-009 | P0 | Co-parent letters | Given Papa adds a letter to the book, Then Mama's Book shows it signed "From Papa" with no approval step and `book.recordingElsewhere` when his audio is on his phone | F11-REQ-010, F11-REQ-015 |
| F09-REQ-010 | P0 | Book reads no working material | Given `listBookRows`, Then the SQL selects no `raw_transcript` or `machine_edits` (static SQL check) | TDD 01 3.8 |
| F09-REQ-011 | P0 | Chapter render budget | Given a 60-letter chapter on iPhone SE 3, Then first paint of the chapter p95 500 ms over 200 runs | PRD 7.1 |
| F09-REQ-012 | P0, Rev (D-085) | Recently deleted shelf | Given own deleted letters, Then Settings > Recently deleted lists them newest deletion first with first words, the deletion day and the erase day (deletion plus 30 days, `SHELF_DAYS`), Restore and Erase now; no countdown and no count of what is left; others' letters never appear. Given Erase now confirmed, Then the recording and listening copy are removed before the row and the letter does not return after a relaunch | D-085; DATA spec 2.2 step 4; `store.shelf.test.ts`, `shelf.logic.test.ts` |
| F09-REQ-018 | P0 | Confirm before delete | Given Delete on a letter, Then a sheet asks first with "Keep it" as the large, default button; nothing is deleted until the second tap | D-085; E2E-08 |
| F09-REQ-019 | P0 | Quiet-day rows | Given a quiet-day mark, Then the Book shows one unsigned row with the date and "A quiet day", hidden on a day that has a letter; the chapter count line, the author line, the printable book, Read together and the membership ledger ignore it; it offers no move to the book | D-084; `quiet-day.logic.test.ts` |
| F09-REQ-013 | P0 | Restore goes through the RPC | Given Restore in a sync build, Then the client queues an `entry.restore` op that the server applies through `restore_entry()`, and never sends `deleted_at = NULL` | DATA-REQ-013 |
| F09-REQ-014 | P0 | Book never gated | Given Free, trial, Plus, lapsed, offline, signed out, Then the Book, letter view, date change, delete and restore import nothing from the plan engine | LEGAL-REQ-050 |
| F09-REQ-015 | P1 | Search on this device | Given 1,000 letters, When the parent types 3 or more characters, Then results appear within 300 ms p95 on SE 3, scoped to the active child, own private letters included, others' private never; CJK queries use the substring path | new |
| F09-REQ-016 | P0 | Hidden books read-only | Given a hidden book opened from Hidden books, Then letters read and play; capture entry points are absent; Show this book again restores it to the switcher | B F2 step 4 |
| F09-REQ-017 | P0 | Milestone cards per reader | Given Mama and Papa both open the Book after the 50th letter, Then each sees `moments.letters50` once on their own phone | C-REQ-010 |
| F09-REQ-030 | P0 | Quiet this book | Given Mama quiets Asha's book, Then on Mama's devices 0 reminders, prompts, month or birthday messages and milestone or birthday cards for Asha are scheduled or shown, Papa's schedule is unchanged, every letter is byte-identical, no reason is asked, and Turn messages back on restores the previous switch values. Given the content rules test over `book.quiet.*`, Then no loss, death, grief or absence word appears | R3 DX-05; VOICE.md legacy rule |
| F09-REQ-031 | P0 | Preterm reminders question | Given a due date of 1 Mar and a birth date set to 1 Feb, Then the reminders sheet shows once per parent with Leave them off for now as the primary choice; choosing it turns this person's reminders for the child off. Given a birth date 10 days before the due date, Then no sheet | R3 DX-18; F13 2 |
| F09-REQ-032 | P1 | Language label and ask line | Given the letter language is readable by members (F11 or F16 decision) and is not one of the reader's letter languages, Then `book.letterLanguage` shows above the text; given also no recording on this phone, Then `book.askToRead` shows. Given the reader's languages include it, Then neither shows | R3 DX-10 |
| F09-REQ-033 | P0 | Direction and voice per letter | Given an Arabic letter beginning with a Latin name, Then the block renders right to left from `base_direction`; given any letter, Then its text carries `accessibilityLanguage` equal to the letter language; given AX5 with Devanagari, Arabic and Han fixtures, Then no glyph clips | R3 DX-20, DX-21 |

### 7.1 Test map (P0)

| ID | Test file or run | Exists? |
|---|---|---|
| F09-REQ-001, F09-REQ-002, F09-REQ-003, F09-REQ-005, F09-REQ-020 | `packages/core/test/book.test.ts` (property test, 10,000 pairs) | New |
| F09-REQ-007 | `apps/mobile/test/dates.test.ts` | Exists; case new |
| F09-REQ-004, F09-REQ-006 | `apps/mobile/test/book-date-change.test.ts` | New |
| F09-REQ-008, F09-REQ-033 | `apps/mobile/test/letter-text.test.ts`; device render on SE 3; VoiceOver script V1b | New |
| F09-REQ-009, F09-REQ-022, F09-REQ-028, F09-REQ-029 | `supabase/tests/access_matrix.test.mjs`; `apps/mobile/test/sync-e2e.test.ts` | Exist |
| F09-REQ-010 | `apps/mobile/test/book-query.test.ts` (static SQL check) | New |
| F09-REQ-011 | Perf build run on SE 3 (06 Gate row) | Not run |
| F09-REQ-012, F09-REQ-013, F09-REQ-018, F09-REQ-027 | `apps/mobile/test/store.shelf.test.ts`, `apps/mobile/src/components/book/shelf.logic.test.ts`, `apps/mobile/e2e/flows/E2E-08-delete-and-undo.yaml` | Exist |
| F09-REQ-014 | `apps/mobile/test/billing-plan.test.ts` (static import check) | File exists; case new |
| F09-REQ-016, F09-REQ-024 | `apps/mobile/test/store.child-edit.test.ts` | Exists; cases new |
| F09-REQ-017, C-REQ-010, F09-REQ-025, F09-REQ-026 | `apps/mobile/test/moments.test.ts` | New |
| F09-REQ-019 | `apps/mobile/src/components/book/quiet-day.logic.test.ts`, `apps/mobile/test/quiet-day-book.test.ts` | Exist |
| F09-REQ-021, C-REQ-015 | `packages/content/test/rules.test.ts` | Exists |
| F09-REQ-023 | `apps/mobile/test/store.child-edit.test.ts` (signature frozen) | Exists |
| F09-REQ-030 | `apps/mobile/test/book-quiet.test.ts`; `apps/mobile/test/reminders-planner.test.ts` (no slot for a quieted child); `packages/content/test/rules.test.ts` (no loss words in `book.quiet.*`) | First new; others exist |
| F09-REQ-031 | `apps/mobile/test/book-birth-sheet.test.ts` | New |

## 8. Data, privacy and security

| Data | Level | Where | Who reads | Retention | Leaves the phone |
|---|---|---|---|---|---|
| `entries.occurred_on` | L3 | Local SQLite, Postgres | Author; members when in book | Life of the letter | Syncs (F16) |
| `entries.occurred_precision` (new, F04) | L2 | Local, Postgres | As above | Same | Syncs |
| `entries.final_text`, `author_signs_as` | L4, L3 | Local, Postgres | Author; members when in book | Same | Syncs |
| `children.birthday`, `due_date` | L4 | Local, Postgres | Members (contributors never see the due date, D-039) | Life of the book | Syncs |
| `children.hidden_at` | L2 | Local, Postgres | Members | Same | Syncs |
| Milestone seen flags (new `settings` keys `moments.seen.<childId>.<type>`) | L2 | Local only | This device | Until app delete | Never |
| Quiet this book flag (new, per person per child, in `child_member_prefs`, F12) | L3 [A: it can hint at a hard time; classification row to confirm in `DATA_CLASSIFICATION.md`] | Local; Postgres for this person's own devices | This person only | Until turned off or the book is deleted | Syncs to the person's own devices; never to the other parent; never in analytics |
| `entries.base_direction` (new, F04) | L2 | Local, Postgres | Every reader | Life of the letter | Syncs |
| Search index (new FTS5 table `entries_fts`) | L4 | Local only | This device | Rebuilt from `entries`; rows deleted with the letter and by the purge sweep | Never |

Nothing in F09 writes analytics content. The FTS table needs `enableFTS` in the expo-sqlite config plugin, which the Expo docs list (expo-sqlite docs, opened 3 Oct 2026); the index sits in `scribe.db` under iOS Data Protection like the rest (PRD 7.10 item 3).

## 9. Non-functional requirements

| Budget | Value | Gate |
|---|---|---|
| Book first render (current chapter visible) | p95 500 ms with 1,200 letters | No (PRD 7.1 lists 60-letter chapter as not a gate) |
| Switch child | p95 300 ms offline | Yes (PRD 7.1) |
| Change date to visible move | p95 300 ms | No |
| Memory with 1,200 letters | Book screen under 120 MB resident [A] | No; measured in BL-044 |
| Accessibility | WCAG 2.2 AA, AX5, VoiceOver (LEGAL-REQ-051); shared rules in `06-nfr.md` | Yes |

## 10. Analytics

| Event | Status | Properties (L2) | Question |
|---|---|---|---|
| `book_opened` | Exists | `child_ordinal`, `letters_bucket`, `member_role` | How often do parents return to read |
| `letter_opened` | Exists | `author_relation`, `has_audio` | Do co-parents read each other's letters |
| `letter_deleted` | Exists | `action`, `destination` | Do people use undo |
| `moment_shown` | Exists | `type` | Which milestones people reach |
| `letter_date_changed` (new) | New | `precision` (`day`, `month`), `direction` (`earlier`, `later`) | Is the date sheet found after save |
| `earlier_month_opened` (new) | New | none | Does the end-of-book action invite backdating |

Quiet this book and the preterm reminders question send no event at all, like the crisis row (F20): a count of people quieting a book could point at a loss.
| `book_search_used` (new) | New | `results_bucket` (`0`, `1_5`, `6_plus`) | Is search worth keeping |

All consent-gated (LEGAL-REQ-003); no query text, dates or names ever.

## 11. How we build it (with the architect)

- **Core.** `packages/core/src/age.ts` stays the single age engine; add `chapterForEntry(child, occurredOn, precision)` and `monthsUpTo(child, today)` (the earlier-month sheet list) as pure functions with tests. Fix `letterDateline` in `apps/mobile/src/lib/dates.ts` (no-birthday rule) and add the month-only dateline.
- **Book query.** `listBookRows(childId)` (new, TDD 01 3.8) in the `LocalStore` interface (BL-111), async API off the render path for books over 500 rows (TDD 01 3.8).
- **Screens.** `(tabs)/book.tsx` keeps `SectionList` (exists); add the end-of-book earlier-month action, the birthday card, the header overflow menu with Quiet this book, and the birth reminders sheet. `components/book/chapters.ts` gains precision handling. `letter/[id].tsx` gains Change the date (owner-only, via `isOwnEntry`). New `settings/recently-deleted.tsx`.
- **Script rendering.** One `LetterText` component (TDD 09 7.2 item 5, BL-265): splits Devanagari runs into Tiro, sets `writingDirection` per paragraph (React Native supports `'auto' | 'ltr' | 'rtl'` on iOS, reactnative.dev text style props, opened 3 Oct 2026). Used by card, letter view, Read together (F10) and Review.
- **Restore.** Replace `undeleteEntry` with a `restoreEntry` that queues `restore_entry()`; the UndoToast path uses it too.
- **Search.** FTS5 virtual table with `unicode61` (default tokenizer; separators are space and punctuation, sqlite.org/fts5.html, opened 3 Oct 2026), kept in step by triggers on `entries`; a substring scan for queries containing CJK characters. The trigram tokenizer was rejected: it matches nothing under 3 characters (same page) and most Chinese words are 2 characters [A].
- **Riskiest unknown.** Render cost of mixed-script letters at AX5 inside a 60-letter chapter on SE 3. Spike: WP-F09-01 builds a 60-letter, 4-script fixture and measures before the Book work starts.

## 12. Work packages

`08-delivery.md` section 3.3 governs file ownership: a path below owned by another stream is a request to that stream (R5 EQ-08).

Status is what `develop` holds on 13 Oct 2026; "Device" names the `docs/qa/DEVICE_TEST_PLAN.md` run owed.

| WP | Scope | Owner | Owns files | Depends on | Done when | Mode | Status 13 Oct | Device |
|---|---|---|---|---|---|---|---|---|
| WP-F09-01 | Spike: 60-letter 4-script chapter render on SE 3 | Mobile engineer | `apps/mobile/src/dev/book-fixture.ts` (new) | BL-258 | Numbers recorded in PR; decision SectionList or FlashList | pair | Not run | SE 3 render timing |
| WP-F09-02 | Age and chapter helpers, empty ranges, precision, property test | Mobile engineer (core) | `packages/core/src/age.ts`, `packages/core/src/book.ts` (new), `packages/core/test/book.test.ts` (new) | none | `[F09-REQ-001]`, `[F09-REQ-002]`, `[F09-REQ-003]`, `[F09-REQ-005]`; `[F09-REQ-020]` | agent | Partly built: month chapters from `packages/core/src/age.ts` and `components/book/chapters.ts`; `packages/core/src/book.ts`, empty ranges and month precision not built | none |
| WP-F09-03 | Dateline fix and month-only dateline | Mobile engineer | `apps/mobile/src/lib/dates.ts`, `apps/mobile/test/dates.test.ts` (new) | WP-F09-02 | `[F09-REQ-007]`, `[F09-REQ-003]`; `[F09-REQ-023]` | agent | Partly built: `lib/dates.ts` one Intl format and `apps/mobile/test/dates.test.ts` exist; month-only dateline not built | none |
| WP-F09-04 | `listBookRows` projection and Book screen wiring (BL-160, BL-034) | Mobile engineer | `apps/mobile/src/lib/store.ts` (or `LocalStore`), `(tabs)/book.tsx`, `components/book/chapters.ts` | BL-111, WP-F09-02 | `[F09-REQ-010]`, `[F09-REQ-011]`, `[F09-REQ-005]`, `[F09-REQ-006]`; `[F09-REQ-009]`, `[F09-REQ-014]`, `[F09-REQ-019]`, `[F09-REQ-022]`, `[F09-REQ-029]` | agent | Partly built: Book reads `listEntriesForChild` with quiet-day filtering (`visibleInBook`); a `listBookRows` projection that excludes working material is not built | none |
| WP-F09-05 | `LetterText` script runs, stored direction, `accessibilityLanguage`, per-script line heights (BL-265) | Design systems | `apps/mobile/src/components/book/letter-text.tsx` (new), `letter-card.tsx`, `letter/[id].tsx`, `packages/design-tokens/src/tokens.ts` (three new type tokens) | BL-258, F04 WP-F04-03 (`base_direction`) | `[F09-REQ-008]`, `[F09-REQ-033]` in `apps/mobile/test/letter-text.test.ts` (new) | agent | Not built (`letter-text.tsx` absent) | Arabic and Devanagari render on device; VoiceOver script V1b |
| WP-F09-12 | Quiet this book and the birth reminders sheet | Mobile engineer | `(tabs)/book.tsx` (header menu), `components/book/quiet-sheet.tsx` (new), `components/book/birth-sheet.tsx` (new), per-person child prefs through F12's `child_member_prefs` (request to S03 and the F12 owner) | F12 WP-F12-02 | `[F09-REQ-030]`, `[F09-REQ-031]` | agent | Not built. Today the per-child switches exist in Settings (`children.settings.remindersLabel`, `celebrationsLabel`) | none |
| WP-F09-13 | Language label and ask line | Mobile engineer | `letter/[id].tsx`, `letter-card.tsx` | F11 or F16 making `entries.language` member-readable | `[F09-REQ-032]` | agent | Not built | none |
| WP-F09-06 | Change the date on own letters | Mobile engineer | `letter/[id].tsx` | F04 date sheet (WP-F04) | `[F09-REQ-004]`, `[F09-REQ-028]` | agent | Not built | none |
| WP-F09-07 | Delete with confirm, undo, Recently deleted shelf, Erase now, purge, restore op; quiet-day rows (BL-264, D-084, D-085) | Mobile engineer | `settings/recently-deleted.tsx` (new), `store.ts` restore path | BL-174 | `[F09-REQ-027]`, `[F09-REQ-012]`, `[F09-REQ-013]`, E2E-08; `[F09-REQ-018]` | agent | Built (D-085, commit 6482cd3): confirm sheet, undo toast, Recently deleted shelf, Restore, Erase now, launch purge; restore in a sync build goes out as `entry.restore`. Quiet-day rows built (D-084, commit f4cdbc3) | DL-04, DL-05 |
| WP-F09-08 | Milestone and birthday cards, pause rule | Mobile engineer | `components/book/moment-card.tsx` (new) | BL-035 | `[C-REQ-010]`, `[F09-REQ-025]`, `[F09-REQ-026]`, `[F09-REQ-017]`; `[F09-REQ-021]` | agent | Not built (`moment-card.tsx` absent) | none |
| WP-F09-09 | Hidden books list and read-only view (BL-035) | Mobile engineer | `settings/children/*` | BL-035 | `[F09-REQ-024]`, `[F09-REQ-016]` | agent | Partly built: Hide this book in `settings/children/[id].tsx`; the read-only Hidden books view not verified | none |
| WP-F09-10 | Copy keys into a feature `copy.ts` (BL-156) | Content | `components/book/copy.ts` | none | Content rules pass; C-REQ-015 test; `[C-REQ-015]` (exists in `packages/content/test/rules.test.ts`) | agent | Partly built: `components/book/copy.ts` exists; `book.quietDay.*` in content | none |
| WP-F09-11 | Search (P1) | Mobile engineer | `apps/mobile/src/lib/search.ts` (new), local migration, `app.config.ts` (`enableFTS`) | WP-F09-04 | `[F09-REQ-015]` | agent | Not built; P1, recommended cut from v1.0 (feature freeze in 08 section 2.1) | SE 3 timing |

## 13. Open questions and assumptions

| # | Question | Who | By | What changes |
|---|---|---|---|---|
| Q1 | Past empty months: no rows and one end-of-book action (spec default since 14 Oct, R3 DX-35), a range row, or nothing at all. Study 1 tests the three | Founder, from Study 1 | Before C1 | F09-REQ-005 |
| Q6 | Review the Quiet this book and birth-sheet copy with a perinatal loss and NICU family organisation before C1; do not recruit bereaved parents as test participants (R3) | Founder | Before C1 | `book.quiet.*`, `book.birth.*` |
| Q7 | Should Quiet this book also be offered as a notification action (F13 owns notifications)? Spec default [R]: yes, labelled "Quiet this book" with no child name | F13 owner | Before the F13 stream's first PR | F13 |
| Q2 | Preterm babies: show an adjusted age line beside the real age in datelines, and should chapters ever follow adjusted age. Spec default [R]: chapters by birth date, no adjusted age at v1.0; a parent-entered "adjusted from {date}" is a v1.1 candidate (F30). Any wording needs a clinician check | Founder, then clinician (BL-105) | Before the F09 stream starts | F03, F09, F30 |
| Q3 | Keep the per-chapter count line ("3 letters") or show authors only. Default: keep (DESIGN_LANGUAGE 12), no per-author numbers | Design leads | 16 Oct | `chapters.ts` |
| Q4 | Search at v1.0 (P1) or v1.1 | Founder | Before feature freeze (08 section 2.1) | WP-F09-11 |
| Q5 | Before You month-precision storage date (spec default: day before birth or due date) | F04 owner | 16 Oct | F04-REQ-015 |

| # | Assumption | How we validate |
|---|---|---|
| A1 | One end-of-book action invites backdating without naming missed months | Study 1; watch `earlier_month_opened` |
| A2 | Most Chinese search words are 2 characters, so trigram search is wrong for them | Native reviewer for the Mandarin pack (R-08) |
| A3 | 1,200 letters fit the memory budget | BL-044 device run |

## 14. Sources

- `docs/prd/v2/_AUTHORING.md`; `01-problem.md`; `02-customers.md`; `03-goals-and-principles.md`; `05-feature-map.md`; `09-decisions-and-risks.md` (DR-07, DR-15).
- `docs/prd/PRD.md` 1.3: sections 3.2, 3.3, 6.2, 6.4, 7.1, 7.10, K-09, K-12.
- `docs/prd/B-first-run-and-family.md` F1, F2, F9, B-REQ-002, -005, -011, -014, -015, -016.
- `docs/prd/C-habits-pricing-settings.md` C-REQ-010 to -015.
- `docs/legal/DELETION_AND_EXPORT_SPEC.md` 2.1, 2.2, DATA-REQ-010, -011, -013, -015.
- `docs/DECISIONS.md` D-027, D-028, D-039.
- `docs/tdd/01-mobile-client.md` 3.2, 3.8; `docs/tdd/09-accessibility-design-system.md` 2.1, 7.2; `docs/tdd/07-quality-test-strategy.md` E2E-06, E2E-08.
- `docs/design/DESIGN_LANGUAGE.md` 3, 8, 12; `docs/design/COMPONENTS.md` 2.5, 2.15, 2.20.
- Code: `apps/mobile/src/app/(tabs)/book.tsx`, `apps/mobile/src/app/letter/[id].tsx`, `apps/mobile/src/app/review.tsx`, `apps/mobile/src/components/book/chapters.ts`, `letter-card.tsx`, `apps/mobile/src/lib/dates.ts`, `apps/mobile/src/lib/store.ts`, `packages/core/src/age.ts`, `packages/core/src/plan.ts`, `supabase/migrations/20261003000000_security_and_family.sql`, `packages/content/src/strings.en.ts` (`book.*`, `moments.*`, `children.*`, `settings.delete.*`).
- `docs/prd/v2/features/F04-capture.md` (F04-REQ-015, `occurred_precision`), `F11-co-parent.md` (F11-REQ-009, -010, -015, -016).
- Research: R1 F09 (R1-S1, -S2, -S5, -S10, -S20, -S21, -S48, -S56, -S67); R2 section 0 items 6, 9, themes T23, T25, T28; UR S24, S26.
- Opened 3 Oct 2026: Expo SQLite docs (`enableFTS`), https://docs.expo.dev/versions/latest/sdk/sqlite/; SQLite FTS5, https://www.sqlite.org/fts5.html; React Native text style props, https://reactnative.dev/docs/text-style-props.
