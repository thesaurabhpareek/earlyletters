# F09 The book: month chapters, Before You, cards

| | |
|---|---|
| Release | v1.0 gate (search: v1.0 P1, first to cut) |
| Priority and rank | P0, rank 5 (`05-feature-map.md` section 2) |
| Personas | P1, P2, P3, P4, P6 |
| Existing IDs | B-REQ-002, B-REQ-005, B-REQ-011, B-REQ-014, B-REQ-015, B-REQ-016, B-NFR-007, C-REQ-010, C-REQ-011, C-REQ-012, C-REQ-015, PRD-REQ-004, PRD-REQ-011, PRD-REQ-012, DATA-REQ-010, DATA-REQ-011, DATA-REQ-013, DATA-REQ-015, D-027, D-028, K-09, BL-034, BL-035, BL-134, BL-151, BL-156, BL-160, BL-258, BL-264, BL-265, BL-266 |
| Depends on | F03 (child, birthday or due date, signature), F04 (save, backdating, `occurred_precision`), F06 (Review destination), F08 (player), F11 (co-parent letters), F13 (notifications), F16 (sync) |
| Status | Draft V2, 3 Oct 2026 |

## 1. Why

- [S] All 6 chronology reviews in R2's sample are complaints: feeds out of order, missed days hard to add, a fee to backdate (R2 section 0 item 6, theme T25).
- [S] Backdated entries sort wrongly in 23snaps; Tinybeans and Apple Journal users ask for easier backdating (R1 F09; R1-S10, R1-S2, R1-S5).
- [F] No product R1 opened files letters into month-of-age chapters; only Tiny Treasures tags age (R1 F09; R1-S67). Several products count streaks (Apple Journal, Calm, Tell Me Your Story) (R1-S5, R1-S48, R1-S21).
- [S] Unfilled baby books feel like failure; blank books are reported at 14 months, 19 months and nearly 3 years (UR S24, S26). An empty month must read as an invitation, not a gap.
- [S] Legacy for future generations is the most common Remento and Storyworth praise (25 of 84, R2 T23). The book is what P6 reads; it has to make sense by age without the app.
- [S] Preterm parents asked for adjusted dates (R2 T28; R2-S2, R2-S14). Pregnancy pages are praised (R2-S15).

## 2. Who

| Persona | Moment | Holding, feeling, short of | What F09 must do |
|---|---|---|---|
| P1 Evening parent | After the baby is down; opens the Book to see what is there | Phone, one hand, dim room; short of time; fears feeling behind | Newest chapter on top, letters in the order things happened, nothing that counts what is missing |
| P2 Co-parent | Reads more than writes [A] (R2 section 5, P2) | Their own letters plus the other parent's | See both parents' in-book letters, each signed; never the other's private letters |
| P3 Expecting parent | Third trimester | A due date, no birthday | Before You chapter, no countdown, no due-date card (B-REQ-015) |
| P4 Multilingual family | Letters in Hindi, Arabic, Mandarin and English in one month | Mixed scripts | Each letter in its own script and direction in the same chapter; never translated |
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
- Empty months as a quiet invitation, never counted.
- Quiet milestone cards (C-REQ-010), birthday and month-age cards in the book (C-REQ-011 book half; notifications are F13), pause celebrations (C-REQ-012), never-celebrated list (C-REQ-015).
- Hidden books (B-REQ-014) and the Hidden books list.
- Mixed scripts and right-to-left letters in one chapter.
- Delete, undo, Recently deleted, restore (DATA-REQ-010).
- Large-book reading: 60 letters per chapter budget; five years of chapters.
- Search on the device, P1 (cut first if late).

**Later**
- Year One cover and celebration, On this day (C-REQ-013, C-REQ-014): F47.
- Filters (`book.filters.*` exist in content): v1.1.
- Themes and photos (B-REQ-019, B-REQ-024): F46.
- Sealed letters (B-REQ-018): F41.
- Preterm adjusted age display: pending Q2.

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
4. **Earlier empty months.** Consecutive past months with no letters collapse into one quiet row between chapters: "Months 4 to 6" plus "Write about these months" (new keys `book.emptyRange.title`, `book.emptyRange.cta`). No number of letters, no "missed", no colour change. Tapping opens a sheet listing those months; picking one opens capture with `occurredOn` preset to the first day of that month of age and `occurredPrecision = month` (F04 entry table). One month alone uses `book.empty.chapterTitle`.
5. **Read a letter.** Tap a card (`LetterCard`). `letter/[id].tsx` shows the dateline (`letterDateline` in `lib/dates.ts`), the text at the reader's size (`reader.sizes.*`), the signature at the end (`book.signature` "From {signsAs}"), provenance (`book.provenance.*`), and the recording line or player (F08).
6. **Change the date (own letter).** New action `book.entryMenu.changeDate` (new) opens the F04 date sheet (day or month tab). Saving writes `occurred_on` and `occurred_precision` as a new version (the server versions `occurred_on` changes, migration `20261003000000_security_and_family.sql`). The letter moves to its chapter with a 200 ms cross-fade.
7. **Add to book or make private (own letter).** Existing actions `book.entryMenu.moveToBook` and `makePrivate` call `setEntryInBook`. Toasts `review.destination.addedToast` and `privateToast`.
8. **Delete (own letter).** `book.entryMenu.deleteButton`, confirm `settings.delete.entryTitle` and `entryBody`. A tombstone is written; the persistent undo toast stays until dismissed (`UndoToast`, BL-264). The letter appears in Recently deleted with its erase date (server `deleted_at` + 30 days).
9. **Restore.** Settings > Your data > `settings.delete.recentlyDeleted` lists own tombstoned letters; `settings.delete.restoreButton` calls `restore_entry()` online, or queues it offline. The letter returns to its chapter.
10. **Milestones.** On the save that reaches a C-REQ-010 milestone, the next Book open shows one inline card at that letter (`moments.*`), once per reader, no modal, push, sound or confetti. "Lovely" (`moments.dismissButton`) dismisses it for good.
11. **Birthday and month-age in the book.** On a monthly birthday the new chapter's header settles in (MOTION `gentle`); on the 12, 24, 36, 48 and 60 month birthdays one quiet card opens that chapter (new `moments.birthdayInBook`: "{child} turned {n}."). No card when celebrations are paused for this person and child (C-REQ-012).
12. **Search (P1).** A search field above the chapters. Results list matching letters in chapter order with the match in context; empty result shows `book.empty.searchTitle`.

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
| F09-U10 | VoiceOver | Chapter header is a header with title and line; card is one element with the A11y label in `letter-card.tsx`; empty-range row reads as a button | Spoken | n/a | V1 manual script |
| F09-U11 | AX5 text | Letter text uncapped (D-027); card excerpt 2 lines with full label; header line wraps | No truncation of letters | n/a | Snapshot at AX5 (BL-266) |
| F09-U12 | Reduce Motion | Arrival wash and chapter settle become 200 ms fades | Calm | n/a | V6 script |
| F09-U13 | Arabic letter beside English letters | Each paragraph's direction comes from its first strong character (Unicode bidi rule) and sets `writingDirection` per paragraph; card and signature alignment follow the letter, chrome stays left-to-right | Right-aligned Arabic paragraph between left-aligned English ones | n/a | Render fixture with Arabic, Hindi, Chinese, English in one chapter |
| F09-U14 | Script with no bundled font (Arabic, Chinese) | System font fallback; Devanagari uses Tiro (DESIGN_LANGUAGE 3) | Correct glyphs, never boxes | Install the language pack adds the reading font (F05) | Glyph coverage test |
| F09-U15 | Other parent's private letter | Never on this phone (F11-REQ-009) | Not shown | n/a | Visibility fixtures |
| F09-U16 | Hidden book | Not in the switcher; notifications cleared on every member device within one sync (B-REQ-014); visible read-only in Hidden books | `children.settings.hiddenTitle` list | `children.settings.showButton` | `[B-REQ-014]` |
| F09-U17 | Signed out (no account) | Book works on this phone; author id null counts as own (`isOwnEntry`) | Full book | n/a | Unit |
| F09-U18 | Lapsed or Free | Book never calls the plan engine (`read` is `FreeForever` in `packages/core/src/plan.ts`) | No Plus UI | n/a | Static import test |
| F09-U19 | Account deleted elsewhere | F17 flow: one local export, then wipe (DATA-REQ-023) | Notice | Export | F17 |
| F09-U20 | Two children | Every query scoped by `child_id`; switching re-runs only the Book query | Other book in 300 ms | n/a | E2E-06 |
| F09-U21 | Birthday changed in Settings | Chapters recompute; no letter's `occurred_on` changes | Letters regroup | n/a | Property test |
| F09-U22 | Letter dated in the future (clock wrong) | F04 bounds the picker to today; a synced future date files by its date and is not shown above the current month card | Normal chapter | Author changes the date | Unit |
| F09-U23 | Voice-only letter (`transcriptStatus = 'waiting'`) | Card shows `pendingCopy.book.waitingForWords` until words arrive | Kept, honest | Words later or type | Existing card code |
| F09-U24 | Search with Chinese characters | FTS `unicode61` does not split Chinese (no spaces); query with CJK characters uses a substring scan over this child's `final_text` instead | Matches found | n/a | Search fixture |
| F09-U25 | Milestone reached on a co-parent's phone | Milestones are per reader: each reader sees each card once on their own device | One card each | n/a | Unit |

## 7. Requirements and acceptance criteria

| ID | P | Requirement | Acceptance criteria | Source |
|---|---|---|---|---|
| B-REQ-005 | P0 | Expecting mode and Before You; transition to born | Given due-date mode, When a letter saves, Then it is in Before You. Given a birth date entered, Then letters dated before it stay in Before You and later ones move to their month | B |
| B-REQ-015 | P0 | No due-date countdown or card | Given the due date passed with no birth date, Then no Book card, line or dateline mentions the due date | B |
| B-REQ-011 | P0 | Private by default; author chooses | Given a letter saved without choosing, Then `in_book = false`. Given a private letter, Then no other member's device receives it | B, F11-REQ-009 |
| B-REQ-002 | P0 | Signature on every letter, frozen at save | Given "Papa" at save and a later rename to "Dada", Then the old letter still reads "From Papa" | B, `authorOf` |
| B-REQ-014 | P0 | Hide a book | Given Asha's book hidden, When any member syncs, Then no Asha notification stays scheduled and Asha is absent from the switcher; Hidden books lists it read-only | B |
| C-REQ-010 | P0 | Quiet milestones | Given the 100th save, When the Book opens, Then the card shows once inline at that letter and never again on that device; no modal, push, sound or haptic beyond the tap | C |
| C-REQ-011 | P0, Rev (book half) | Month-age and birthday in the book | Given a birth date on the 31st and a 30-day month, Then the new chapter starts on the 30th. Given the 12th month birthday, Then one `moments.birthdayInBook` card opens chapter 12 once per reader | C |
| C-REQ-012 | P0 | Pause celebrations per person per child | Given pause on for Mama and Asha, Then Mama sees no milestone or birthday card for Asha and Papa still does | C, PRD-REQ-013 |
| C-REQ-015 | P0 | Never celebrated | Given every `moments.*` and `book.*` string, Then the content test finds no comparatives, per-author counts, streaks or frequency words | C |
| DATA-REQ-010 | P0 | Delete and restore | Given an author deletes offline, When synced 3 days later, Then Recently deleted shows the erase date from the server `deleted_at`. Given Restore, Then `restore_entry()` succeeds and the letter returns to its chapter | DATA spec 2.2 |
| DATA-REQ-015 | P0 | Nobody deletes another's words | Given a co-parent's letter, Then no Delete, Edit or Change the date action renders, and `delete_entry()` fails | DATA spec |
| PRD-REQ-004 | P0 | Working material author-only | Given the Book query, Then no `raw_transcript` or `machine_edits` column is selected; "Show exactly what I said" renders only on own letters | K-09 |
| F09-REQ-001 | P0 | Chapters by month of age | Given 10,000 random (birthday, date) pairs, Then `chapterOf` equals a reference implementation, months 0 to 72, including births on the 29th, 30th, 31st and 29 Feb | `age.ts` |
| F09-REQ-002 | P0 | Order by the moment | Given letters saved in order C, A, B with `occurred_on` A < B < C, Then the chapter shows C, B, A; ties order by `captured_at` descending | R2 T25 |
| F09-REQ-003 | P0 | Month-precision letters | Given `occurred_precision = month` for Month 3, Then the letter is the last card in Month 3 and its dateline is `book.dateline.monthOnly` with no weekday or day | F04-REQ-015 |
| F09-REQ-004 | P0 | Change the date on own letters | Given own letter in Month 5, When the author picks Month 2, Then it shows in Month 2 within 300 ms, a version row records the change, and the co-parent sees the move within one sync | migration `20261003000000` |
| F09-REQ-005 | P0 | Empty months invite, never count | Given letters in months 1 and 6 only and today in month 8, Then the Book shows, top to bottom: the Month 8 open card, a Month 7 row, chapter 6, a "Months 2 to 5" row, chapter 1, a "The first weeks" row; each row carries `book.emptyRange.cta`; no digit in any row refers to a number of letters | R1 F09, UR S24 |
| F09-REQ-006 | P0 | Empty range opens backdated capture | Given a tap on "Months 2 to 5" then Month 3, Then capture opens with `occurredOn` = first day of month 3 and `occurredPrecision = month` | F04 entry table |
| F09-REQ-007 | P0 | Dateline with no birthday never states an age | Given a child with a due date only and a letter dated after the due date, Then the dateline reads the date plus the before-birth sentence | `lib/dates.ts` defect |
| F09-REQ-008 | P0 | Mixed scripts and directions | Given one chapter with English, Hindi (Devanagari), Arabic and Mandarin letters, Then each renders `final_text` byte for byte, Arabic paragraphs set `writingDirection: 'rtl'` and right alignment, Devanagari uses Tiro, and no glyph renders as a missing-glyph box | DR-15, F11-REQ-016, BL-265 |
| F09-REQ-009 | P0 | Co-parent letters | Given Papa adds a letter to the book, Then Mama's Book shows it signed "From Papa" with no approval step and `book.recordingElsewhere` when his audio is on his phone | F11-REQ-010, F11-REQ-015 |
| F09-REQ-010 | P0 | Book reads no working material | Given `listBookRows`, Then the SQL selects no `raw_transcript` or `machine_edits` (static SQL check) | TDD 01 3.8 |
| F09-REQ-011 | P0 | Chapter render budget | Given a 60-letter chapter on iPhone SE 3, Then first paint of the chapter p95 500 ms over 200 runs | PRD 7.1 |
| F09-REQ-012 | P0 | Recently deleted screen | Given own tombstoned letters, Then Settings > Your data > Recently deleted lists them newest first with "Erased on {date}" and Restore; others' letters never appear | DATA spec 2.2 step 4 |
| F09-REQ-013 | P0 | Restore goes through the RPC | Given Restore, Then the client calls `restore_entry()` (or queues it) and never writes `deleted_at = NULL` | DATA-REQ-013 |
| F09-REQ-014 | P0 | Book never gated | Given Free, trial, Plus, lapsed, offline, signed out, Then the Book, letter view, date change, delete and restore import nothing from the plan engine | LEGAL-REQ-050 |
| F09-REQ-015 | P1 | Search on this device | Given 1,000 letters, When the parent types 3 or more characters, Then results appear within 300 ms p95 on SE 3, scoped to the active child, own private letters included, others' private never; CJK queries use the substring path | new |
| F09-REQ-016 | P0 | Hidden books read-only | Given a hidden book opened from Hidden books, Then letters read and play; capture entry points are absent; Show this book again restores it to the switcher | B F2 step 4 |
| F09-REQ-017 | P0 | Milestone cards per reader | Given Mama and Papa both open the Book after the 50th letter, Then each sees `moments.letters50` once on their own phone | C-REQ-010 |

## 8. Data, privacy and security

| Data | Level | Where | Who reads | Retention | Leaves the phone |
|---|---|---|---|---|---|
| `entries.occurred_on` | L3 | Local SQLite, Postgres | Author; members when in book | Life of the letter | Syncs (F16) |
| `entries.occurred_precision` (new, F04) | L2 | Local, Postgres | As above | Same | Syncs |
| `entries.final_text`, `author_signs_as` | L4, L3 | Local, Postgres | Author; members when in book | Same | Syncs |
| `children.birthday`, `due_date` | L4 | Local, Postgres | Members (contributors never see the due date, D-039) | Life of the book | Syncs |
| `children.hidden_at` | L2 | Local, Postgres | Members | Same | Syncs |
| Milestone seen flags (new `settings` keys `moments.seen.<childId>.<type>`) | L2 | Local only | This device | Until app delete | Never |
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
| `empty_range_opened` (new) | New | `months_bucket` (`1`, `2_3`, `4_plus`) | Do empty months invite backdating |
| `book_search_used` (new) | New | `results_bucket` (`0`, `1_5`, `6_plus`) | Is search worth keeping |

All consent-gated (LEGAL-REQ-003); no query text, dates or names ever.

## 11. How we build it (with the architect)

- **Core.** `packages/core/src/age.ts` stays the single age engine; add `chapterForEntry(child, occurredOn, precision)` and `emptyRanges(chapters, currentMonth)` as pure functions with tests. Fix `letterDateline` in `apps/mobile/src/lib/dates.ts` (no-birthday rule) and add the month-only dateline.
- **Book query.** `listBookRows(childId)` (new, TDD 01 3.8) in the `LocalStore` interface (BL-111), async API off the render path for books over 500 rows (TDD 01 3.8).
- **Screens.** `(tabs)/book.tsx` keeps `SectionList` (exists); add the empty-range row and birthday card. `components/book/chapters.ts` gains precision handling. `letter/[id].tsx` gains Change the date (owner-only, via `isOwnEntry`). New `settings/recently-deleted.tsx`.
- **Script rendering.** One `LetterText` component (TDD 09 7.2 item 5, BL-265): splits Devanagari runs into Tiro, sets `writingDirection` per paragraph (React Native supports `'auto' | 'ltr' | 'rtl'` on iOS, reactnative.dev text style props, opened 3 Oct 2026). Used by card, letter view, Read together (F10) and Review.
- **Restore.** Replace `undeleteEntry` with a `restoreEntry` that queues `restore_entry()`; the UndoToast path uses it too.
- **Search.** FTS5 virtual table with `unicode61` (default tokenizer; separators are space and punctuation, sqlite.org/fts5.html, opened 3 Oct 2026), kept in step by triggers on `entries`; a substring scan for queries containing CJK characters. The trigram tokenizer was rejected: it matches nothing under 3 characters (same page) and most Chinese words are 2 characters [A].
- **Riskiest unknown.** Render cost of mixed-script letters at AX5 inside a 60-letter chapter on SE 3. Spike: WP-F09-01 builds a 60-letter, 4-script fixture and measures before the Book work starts.

## 12. Work packages

| WP | Scope | Owner | Owns files | Depends on | Done when | Mode |
|---|---|---|---|---|---|---|
| WP-F09-01 | Spike: 60-letter 4-script chapter render on SE 3 | Mobile engineer | `apps/mobile/src/dev/book-fixture.ts` (new) | BL-258 | Numbers recorded in PR; decision SectionList or FlashList | pair |
| WP-F09-02 | Age and chapter helpers, empty ranges, precision, property test | Mobile engineer (core) | `packages/core/src/age.ts`, `packages/core/src/book.ts` (new), `packages/core/test/book.test.ts` (new) | none | `[F09-REQ-001]`, `[F09-REQ-002]`, `[F09-REQ-003]`, `[F09-REQ-005]` | agent |
| WP-F09-03 | Dateline fix and month-only dateline | Mobile engineer | `apps/mobile/src/lib/dates.ts`, `apps/mobile/test/dates.test.ts` (new) | WP-F09-02 | `[F09-REQ-007]`, `[F09-REQ-003]` | agent |
| WP-F09-04 | `listBookRows` projection and Book screen wiring (BL-160, BL-034) | Mobile engineer | `apps/mobile/src/lib/store.ts` (or `LocalStore`), `(tabs)/book.tsx`, `components/book/chapters.ts` | BL-111, WP-F09-02 | `[F09-REQ-010]`, `[F09-REQ-011]`, `[F09-REQ-005]`, `[F09-REQ-006]` | agent |
| WP-F09-05 | `LetterText` script runs and direction (BL-265) | Design systems | `apps/mobile/src/components/book/letter-text.tsx` (new), `letter-card.tsx`, `letter/[id].tsx` | BL-258 | `[F09-REQ-008]` render fixture | agent |
| WP-F09-06 | Change the date on own letters | Mobile engineer | `letter/[id].tsx`, `components/book/copy.ts` (new) | F04 date sheet (WP-F04) | `[F09-REQ-004]`, `[DATA-REQ-015]` | agent |
| WP-F09-07 | Delete, undo, Recently deleted, restore RPC (BL-264) | Mobile engineer | `settings/recently-deleted.tsx` (new), `store.ts` restore path | BL-174 | `[DATA-REQ-010]`, `[F09-REQ-012]`, `[F09-REQ-013]`, E2E-08 | agent |
| WP-F09-08 | Milestone and birthday cards, pause rule | Mobile engineer | `components/book/moment-card.tsx` (new) | BL-035 | `[C-REQ-010]`, `[C-REQ-011]`, `[C-REQ-012]`, `[F09-REQ-017]` | agent |
| WP-F09-09 | Hidden books list and read-only view (BL-035) | Mobile engineer | `settings/children/*` | BL-035 | `[B-REQ-014]`, `[F09-REQ-016]` | agent |
| WP-F09-10 | Copy keys into a feature `copy.ts` (BL-156) | Content | `components/book/copy.ts` | none | Content rules pass; C-REQ-015 test | agent |
| WP-F09-11 | Search (P1) | Mobile engineer | `apps/mobile/src/lib/search.ts` (new), local migration, `app.config.ts` (`enableFTS`) | WP-F09-04 | `[F09-REQ-015]` | agent |

## 13. Open questions and assumptions

| # | Question | Who | By | What changes |
|---|---|---|---|---|
| Q1 | Collapse past empty months into one invitation row (spec default) or hide them entirely | Founder | 23 Oct | F09-REQ-005 |
| Q2 | Preterm babies: show an adjusted age line beside the real age in datelines, and should chapters ever follow adjusted age. Spec default: chapters by birth date, no adjusted age at v1.0; a parent-entered "adjusted from {date}" is a v1.1 candidate. Any wording needs a clinician check | Founder, then clinician (BL-105) | 30 Oct | F03, F09 |
| Q3 | Keep the per-chapter count line ("3 letters") or show authors only. Default: keep (DESIGN_LANGUAGE 12), no per-author numbers | Design leads | 16 Oct | `chapters.ts` |
| Q4 | Search at v1.0 (P1) or v1.1 | Founder | Week 6 checkpoint | WP-F09-11 |
| Q5 | Before You month-precision storage date (spec default: day before birth or due date) | F04 owner | 16 Oct | F04-REQ-015 |

| # | Assumption | How we validate |
|---|---|---|
| A1 | A collapsed empty-month row reads as an invitation, not a gap | Study 3 prototype; watch `empty_range_opened` |
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
