# Area B: Book and reading. End-to-end design

Status: DRAFT v2, 20 Nov 2026 (v1 the same day; v2 is the reconciliation pass to the final product pack, section 13).  Design lead, area B (`design-systems` role, one Claude session). Docs only; nothing here was run on a phone. Prototype: `PROTOTYPE.html` in this folder. Motion: `MOTION.md`. Words: `WORDS.md`. Screen ids in section 2 are stable and shared with both.

Final-pack sources added in v2: `22-final-holistic-spec.md`, `21-days-cultural-photos-home.md` (NS-46 to NS-50, final), `19-from-download-to-first-letter.md` (NS-38 to NS-45; nothing in this area was keyed to those ids, so nothing is re-numbered here, and this area draws none of the first-run screens), `GAP-LOG.md` (round 1 and 2 area B rulings, R-IA-1 to R-IA-6, K11 to K17, RV-1 to RV-17), `FUNCTION-TRACE.md` section 6.2, and the reviews `tools/review/ns46-50/{design-systems,content,security,privacy}.md`. Where a ruling and this file differ, the ruling wins and this file changed.

Sources, in the order of BRIEF.md section 1: the locked cards NS-21, NS-22, NS-23, NS-24, NS-29 (`10-reading-and-family.md`), NS-01 (`01`), NS-02 (`02`), NS-06 Parts A and B (`06`), NS-33, NS-36, NS-37 (`11`), under `00-product-frame.md`; `14-test-plan.md` (J-N9, J-N10, J-N12, J-N13, J-N14, J-N15, J-N19, J-N20, J-N25), `16-council-review-round-2.md` (T1 to T5, D1 to D13); `13-engineering-plan.md`; the engineering project plan on PR #847 (`17-engineering-project-plan.md`, read through `gh api` 20 Nov); backlog rows BL-927 to BL-987; the engineering design input `/home/claude/review/eng/C-platform-quality-delivery.md`. House design: `DESIGN_LANGUAGE.md`, `COMPONENTS.md`, `IA.md`, tokens in `packages/design-tokens/src/tokens.ts`. Baseline read on this worktree: `app/(tabs)/book.tsx`, `app/letter/[id].tsx`, `app/read-together.tsx`, `components/book/*`, `components/tonight/resurfaced-card.tsx`, `components/ui/*`.

Tags: [F] read in a file this session. [A] design assumption. PROPOSED: a design default a card leaves open. Every visible word in this file is placeholder intent; the words of record are in `WORDS.md` and need the founder's approval.

Superseded 11 Nov specs (cards win, BRIEF 1.5): spec 04 B4 put "Open it now" on the Book's sealed row and called the row "A closed letter"; NS-06-B2 and B16 put the hidden row in the Book with no action and "hidden until" wording, so Open now moves to the letter page (B-S14). Spec 04 B5 proposed a new `SealedRow` component; NS-06-B15 reuses the letter card, so it is a `LetterCard` variant here. Spec 04 A3 placed the Firsts control "in the letter's action row" (OQ-A2); NS-21 section 3 puts it as row 2 of "This letter". Spec 04 FS-R9 VoiceOver line "A closed letter, opens {date}" is replaced by the card's "hidden until {day}" intent. Spec 01 and 02 agree with the cards where used. DESIGN_LANGUAGE 12 still says "Tonight, Book, Family" tabs and a "One month ago" card: both are history (frame section 4; NS-23).

---

## 1. Rules this area holds (from the frame and rulings)

1. The Book reads; it never starts a letter (NS-35, NS-01-R23). The only way to Home from the Book is the empty Book's button, which switches tabs.
2. A row that does not apply is absent, never disabled (NS-21-R2). A lens with nothing in it does not exist (NS-01-R10c, NS-06-A3). No hint, no empty state, no count for a lens.
3. No count anywhere in this area beyond what is built: no number of results, pictures, firsts, sealed letters, letters in a year (NS-02-R11, NS-01-R11, NS-06-A4, NS-24 content). The built exceptions stay as built and are not extended: Read together's VoiceOver "Letter n of m", and the Months sheet's existing month lines (see card gap G-07).
4. No ceremony: opening a seal, marking a first, finding a letter, or adding a picture never celebrates (frame section 5; NS-06-A11, B4).
5. Undo windows follow T4 through one helper (BL-954): the stated seconds, or VoiceOver finishing the undo line plus those seconds, whichever is later; with Switch Control on, until the parent moves on. The Book's "Letter deleted." Undo is by tap and has no timer (NS-21 section 5, as built).
6. Nothing in this area is behind Plus (T2). Every screen has a `.planLapsed` state that is identical to `.default`.
7. Sign-out keeps the book (D1): `.signedOut` reads every local letter. A second account sees none of the first account's letters, pictures, marks, seals or index (`[X4-R1]`).
8. Writing tools off (D2) on the three letter-adjacent fields this area owns: the words sheet on the letter page, the Firsts label, photo words and place. If React Native cannot switch them off, the field ships with the recorded finding (BL-962), never silently.
9. Nothing donated to Spotlight, Siri or App Intents (D3). No screen here registers an `NSUserActivity`.
10. Pictures ignore Smart Invert and carry a 1 pt hairline frame in `line` in dark and Increase Contrast (NS-01-R40, R41). Every picture blanks to an opaque box when the app goes inactive (NS-01-R13a).
11. AX5 with Bold Text on an iPhone SE 3 (375 x 667 pt): one column, nothing truncates, every target at least 44 pt, letter-page rows at least 56 pt.
12. A day is told one way and only on Home (NS-46, NS-50-R4, RV-6): the Book, the letter page, Find, the lenses, Read together and the past letter never name, mark, filter or link a day the parent ticked or typed (section 12). The Book is a record of what the parent said, not of the calendar the parent chose.
13. A picture letter is a letter with a picture, however it began (NS-49-R2, R13): nothing in this area shows or implies that a picture came from Apple's suggestions, a photo start or Apple's title (section 12b).
14. One owner per fact (IA-AUDIT, R-IA-1): where Home and the Book show the same fact (the age line, the active book, a past letter) they call one function and one component; section 11 lists each and what this area changed.
15. Words: "reminder" for anything the app sends, never "note"; "slip", never "strip"; no exclamation mark; no count of anything (final pack, RV-3, DAT-03).

---

## 2. Screen and state inventory

Ids are `B-Snn`; states are `B-Snn.<state>`. The common suffixes apply to every screen unless the screen says n/a: `.default`, `.empty`, `.many`, `.offline`, `.failed`, `.killSwitch` (`serverFeaturesEnabled()` off), `.pause` (the card's remote pause), `.planLapsed`, `.signedOut`, `.secondAccount`, `.newPhone`, `.twoBooks`, `.twoParents`, `.ax5`, `.voiceOver`, `.dark`, `.increaseContrast`, `.backgrounded` (every screen that shows letter words, a picture or a fragment draws an opaque blank in the switcher snapshot, whether or not App lock is on; FR-SEC-22, E18).

| Id | Screen or surface | Cards | Owner of the route |
|---|---|---|---|
| B-S01 | The Book (tab) with the calm header bar (cover band and inline bar) | NS-22, NS-01 lens, NS-06 A lens, NS-02 entry, NS-37 | B |
| B-S02 | "More for this book" end menu (system menu; fit-to-contents sheet only where the menu cannot carry it, B G-03) | NS-22-R3, R7; F12-REQ-011; F09-REQ-016 | B |
| B-S03 | Lens choice: Months, Photos, Firsts, one radio group | NS-01-R10, R48; NS-06-A3; NS-33-R3 | B |
| B-S04 | Photos lens list | NS-01-R11, R12, R53; NS-37 | B |
| B-S05 | Firsts lens list | NS-06-A3, A4, A15, A24 | B |
| B-S06 | Find mode over the Book | NS-02 | B |
| B-S07 | Go to a month sheet, with year rows | NS-22, NS-24 | B |
| B-S08 | The letter page with the "This letter" list | NS-21, NS-33-R1 | B |
| B-S09 | Day sheet from the letter page (the same `DateSheet` as A-S08) | NS-21 row 1, NS-15 | B entry, A sheet |
| B-S10 | Who can read it sheet | NS-21 row 5, R9 | B |
| B-S11 | Picture on the letter page: add, replace confirm, take off with Undo, words and place sheet, failure lines | NS-01 | B (replace confirm shared with A-S12) |
| B-S12 | Mark a first: the toggle row, label sheet, Undo | NS-06 A | B (Review side is A-S07) |
| B-S13 | Hide until a day: date sheet with the honest limits | NS-06 B | B (Review side is A-S07) |
| B-S14 | Open now confirmation | NS-06-B3 | B |
| B-S15 | Delete confirmation and the Book's "Letter deleted." Undo | NS-21-R7a, R7b; NS-06-B25 | B |
| B-S16 | A hidden (sealed) letter in the Book: the `sealed` card | NS-06-B2 | B |
| B-S17 | One past letter on Home (slip rank 4, the last) | NS-23, NS-50-R5 | B content in A-S01's slip slot; the rank is the registry's (BL-963) |
| B-S18 | Seal-opened line on Home (slip rank 2) | NS-06-B4, NS-50-R5 | B content in A-S01's slip slot |
| B-S19 | Read together (whole book or one year) | NS-24, built `read-together.tsx` | B |
| B-S20 | Read together: end of the year, end of the book | NS-24 | B |
| B-S21 | Me row "Past letters on Home" (switch) | NS-23-R4 | C-S01 owns Me |
| B-S22 | Recently deleted: a sealed letter's row with no words | NS-06-B25 | C-S17 owns the screen |
| B-S23 | Read-along (NS-29): decision record only, not drawn | NS-29 | none |
| B-S24 | Days and the Book: a decision record, no screen (a day is never shown in the Book; section 12) | NS-46-R22, NS-47-R5, NS-50-R4, RV-6 | none |

Cross-area references: C-S09 (the provenance row's words inside B-S08), C-S12 (the Book-level new-phone line inside B-S01), C-S15 and C-S16 (Quiet and Hide in Me; Hidden books opens B-S01.hiddenReadOnly), C-S17 (Recently deleted), A-S01 (Home slip slot), A-S08 (DateSheet), A-S12 (replace confirm), D (Share sheet behind B-S08's Share button), E-S13 to E-S22 (global states that cover this area: fault, outage, system line, low storage, second account, app lock).

---

## 3. Journeys

Numbered flows. Each step names the screen and state. "HP" is a card's happy path; unhappy paths cite the card's table row.

### B-J01 Read a letter from the Book (NS-21 HP 1 to 4; J-N12)
1. B-S01.default: the parent taps a letter card.
2. B-S08.ownSpoken opens (card-to-page, built). VoiceOver lands on the dateline (level 1 heading, NS-21-R4).
3. The parent reads; Play sits after the words (R6b).
4. Scroll: Share alone (R3a); the list "This letter" (level 2 heading) with the rows that apply; Delete last (R3b).
5. Back returns to B-S01 at the same place.
Unhappy: typed letter -> B-S08.ownTyped (no Play, no recording row, "Typed" footnote, R6a). Other parent's letter -> B-S08.otherParent (read-only facts, R11). Words still being made -> B-S08.waiting (day and recording rows only, R10). Words not yet kept -> B-S08.readItBack (built card leads to Review). Recording not on this phone -> B-S08.recordingElsewhere (no Play; row says where, NS-08 words; never an error). Letter deleted on another phone while open -> B-S08.notFound (built S37, with Open Recently deleted when it is there). Held at Keep -> never reaches the Book (it is a waiting card on Home).

### B-J02 Change the day a letter is about (NS-21 HP 5, row 1; NS-15)
1. B-S08.ownSpoken: tap the day row ("About 3 March" with "Said on 9 June" when they differ, NS-15-R3).
2. B-S09.default opens (DateSheet: a day, or a month of age).
3. Save: the sheet closes; the row states the new day; the built toast "Moved to Month 2." shows; the Book files it in its new chapter.
Unhappy: cancel or swipe down -> nothing changes (interrupted: sheet stays open; killed: nothing saved). Local write fails -> B-S09.failed: old day kept, one line (built `errors.generic.title` toast). Expecting parent: a day before the due date files into Before You. Offline: works; queues.

### B-J03 Who can read it (NS-21 row 5, R9)
1. B-S08.ownPrivate (a private letter always shows the row, even with one adult) or B-S08.ownTwoAdults.
2. Tap the row ("Only you") -> B-S10.default: two choices, "Only you" and "In the book", one selected (radio).
3. Choose; the sheet closes; the row states the new value; the change is announced. The other parent is never told a letter became private.
Unhappy: row absent while the book has one adult and the letter is in the book (R2). Failed write -> B-S10.failed: old value kept, one line. Other parent's letter -> no row (R11).

### B-J04 Delete a letter, then Undo (NS-21-R7a, R7b; NS-36-R1a, R1b)
1. B-S08: Delete, last on the page.
2. B-S15.confirm: the built ConfirmSheet, "Keep it" the default (D-085). Warning haptic as built.
3. Delete letter -> back to B-S01, the card leaves its row, B-S15.undo "Letter deleted." with Undo, no timer (built).
4. Undo -> the letter, its picture, first, seal and Find row come back together (NS-36-R1b).
Unhappy: Keep it -> nothing changes. A sealed letter -> same confirm with the seal line (B-S15.confirmSealed); in Recently deleted it shows the day and no words (B-S22). Opened from Home's past letter -> the toast shows over Home (built). Offline -> local tombstone; syncs later.

### B-J05 Quiet this book, Turn Quiet off, Hide (NS-22 HP 3; R3, R7)
1. B-S01.default: tap the end control "More for this book" (last in the bar).
2. B-S02.default: "Quiet this book", "Hide this book" (and "Go to a month" at AX3 and above; and "A book to hold" only where the print flag is on, `.printOn`, FR-PRT-16).
3. Quiet -> sheet closes; a toast states it ("{child}'s book is quiet for you.", WORDS R3); no reminders, Save a copy slip or past letter for this book (J-N19). The bar is otherwise the same.
4. Again: B-S02.quieted offers "Turn Quiet off" (R7; WORDS R2).
5. Hide -> the built Hide confirm (C-S15's body copy `hideBody`) -> Book shows the next book, or the empty Book when none.
Unhappy: failed Quiet write -> B-S02.failed: old state kept, one line. Interrupted: menu closes with the app; nothing changes. Hidden book opened from Hidden books (C-S16) -> B-S01.hiddenReadOnly; the menu offers only "Show this book again". Two parents: Quiet and Hide are per person; nothing is shown to the other parent.

### B-J06 Find a letter by a word (NS-02 HP; J-N10)
1. B-S01.default: tap the magnifier (VoiceOver "Find").
2. B-S06.idle: field focused, keyboard up, nothing drawn below.
3. Type "boat": from the third character B-S06.results; VoiceOver "Letters found", no number.
4. Tap a row -> B-S08. Back -> B-S06.results with "boat" and the same scroll place (R12).
5. Cancel -> B-S01 exactly where it was. A tab switch clears the query.
Unhappy: under 3 characters -> B-S06.short (nothing drawn; a VoiceOver-only hint). No match -> B-S06.noMatch (one line, nothing else). Search fails even on the scan -> B-S06.failed ("Find could not look just now." plus Try again; announced once), with B-S06.failedGettingReady while the index builds. Index missing or untrusted -> the scan answers silently (no state is shown). Interrupted -> query and rows stay. Killed -> query gone. Two books -> only the active book; switcher unreachable while Find is open (R46). CJK -> 1 character starts. Mixed direction -> B-S06.rtlRow. Flag off or `killSwitches.bookSearch` -> B-S01.findOff (no magnifier). Empty book -> no magnifier.

### B-J07 The Photos lens appears, is read, and leaves (NS-01-R10a to R12, R53; J-N9)
1. B-S01.default (no picture): no lens choice.
2. A letter with a picture is kept (area A) -> B-S01.lensPhotos: the choice "Months / Photos" appears under the bar.
3. Tap Photos -> B-S04.default: letters with a picture, newest first, list copy thumbnails, under month openers. No add control, no count.
4. Tap a card -> B-S08.withPicture.
5. The last picture is taken off or its letter deleted -> B-S01: the choice is gone, Months shows, no message (R12).
Unhappy: list copy missing -> B-S04.thumbMissing (card without its thumbnail; regenerated later; no error, NS-37-R3). A sealed letter's picture -> not counted, not listed (R10b). Second phone -> no slot, no lens from that letter (R28). Flag off or `killSwitches.photos` -> B-S01.photosOff (no choice; Months only). Second account -> no lens (R29). AX5 -> B-S04.ax5 thumbnail above the words.

### B-J08 A picture on a kept letter (NS-01 "add later"; R7, R8, R38, R56, R58)
1. B-S08.ownNoPicture: the picture row "Add a photo" (row 3).
2. Apple's picker (A-S03); pick one -> the picture shows above the words; the row now reads "Photo" with Change and Take off.
3. Tap the picture row -> B-S11.actions sheet: "Change photo", "Words about this photo", "Take the photo off".
4. Change -> picker -> B-S11.replaceConfirm "Use this photo instead?" with "Keep the first" as the safe default -> confirm -> B-S11.undo (T4 window).
5. Take off -> removed at once -> B-S11.undo; the file stays until the window closes.
6. Words -> B-S11.words: "A few words about this photo" (140 graphemes) and "Where" (60), both optional; writing tools off.
Unhappy: Cancel in the picker -> nothing, no message. Could not be stored (`unreadable`, `no_space`, `failed`, `photo_bake_timeout`, `photo_reencode_failed`) -> B-S08.photoNotStored: one calm line "The photo did not come along." with "Add a photo" (R58), this session only. iCloud-only offline -> A-S03's line; the letter page unchanged. File missing (deleted outside the app) -> B-S08.photoMissing: "Not on this phone any more" with Remove (author) (R56); gone after the next sweep. Undo after its window -> the control is gone in the same moment (R38b). Other parent's letter -> picture shown if on this phone, no controls (R9c); on another phone, no slot and no message (R28). Quiet day -> no picture row (R25). Pick while App lock is up -> dropped silently (R47).

### B-J09 Mark a first, then unmark (NS-06 A HP; A2a, A2b, A3)
1. B-S08.ownSpoken: row 2 "This was a first" (a switch, off).
2. Turn on -> announced "On"; B-S12.labelSheet opens with one empty field, no placeholder, label "In your words, if you like" (intent).
3. Type or leave empty; Done. The row reads "A first: laughed out loud" (or "A first").
4. B-S01: the card shows the label as its first line; B-S01.lensFirsts: "Firsts" joins the lens choice.
5. B-S05.default: firsts newest first, normal cards, no count.
6. Unmark (switch off) -> one tap clears mark and label -> B-S12.undo with the T4 window.
Unhappy: label at 40 graphemes -> field stops, nothing said (B-S12.atLimit). Failed write -> B-S12.failed: unmarked, standard save line. Quiet day, other parent's letter -> no row (A6, A13). Sealed letter -> the mark counts nowhere until it opens (A15). Last first unmarked -> the lens choice loses Firsts without a message. Flag off -> no row, no lens (marks stay, still sync and export).

### B-J10 Hide a letter until a day, wait, open (NS-06 B HP; J-N14)
1. B-S08.ownSpoken (or Review, A-S07): row 4 "Hide until a day".
2. B-S13.default: the system date picker bounded tomorrow to the 25th birthday (B11); the sentence "Only you can see it until that day."; the three honest limits (time zone, clock, stored like every letter).
3. Hide -> the pair is written; the sheet closes; the row reads "Hidden until 10 January 2027".
4. B-S01.sealedCard: the Book shows the `sealed` card: date line, "Hidden until 10 January 2027", no words, no picture, no first label. Find, lenses, Read together and the past letter skip it.
5. The author can open the page (they are not hidden from): B-S08.sealedAuthor shows the words and the row "Hidden until 10 January 2027"; tapping it offers Open now.
6. B-S14.confirm "Open this letter now? It cannot be hidden again." Cancel is the default. Open -> the row is gone forever; the letter is normal everywhere.
7. Or the instant passes: no notification; B-S01 shows a normal card; on that day only Home may show B-S18 once.
Unhappy: picker never offers today or a past day. App killed across the instant -> opens at next launch, no notice (B24). Offline Open now -> opens here at once; server later (B13). Refused push (`SCSEL`) -> never shown to the author. Quiet day -> no row (B10). Delete -> B-S15.confirmSealed then B-S22. Account deletion before the day -> C-S20 states the sealed letter goes too (D6). Other members -> nothing at all on their phones before the instant. Flag off -> the control is hidden; the hidden card, the page row and Open now stay (B9 last row). Second account -> nothing (B17).

### B-J11 One past letter on Home (NS-23 HP; J-N19)
1. A-S01 with no waiting card (rank 1), no seal opening today (rank 2), no day the parent chose today (rank 2b), no Save a copy (rank 3: the birthday week) and no Days ask (rank 3b) -> B-S17.default in the slip slot, where A-S01 draws it (see the position note in B-S17): the letter's date as kicker, its opening words (2 lines; 4 at accessibility sizes), and a quiet "Not today".
2. Tap the card -> B-S08 for that letter. Back -> Home.
3. Or "Not today" -> the card leaves until local midnight (B-S17.dismissed).
4. B-S21: Me, "Past letters on Home" off -> never shown (B-S17.switchOff). The row sits in Me's "Days and reminders" group after tree test T1 (IA-AUDIT D-06, R-IA-4), beside Reminders and Days; both are Home preferences.
Unhappy: no match -> nothing, no placeholder. Higher slip due (any of ranks 1, 2, 2b, 3, 3b) -> not shown (R6, NS-50-R5); on a day the parent chose, the past letter waits for the next day it matches, never the same day. Quieted or hidden book -> never (R8). App lock on -> snapshot without the fragment (R11). AX5 -> capture actions ride inline above the card (built), fragment up to 4 lines. Flag off -> the built "A month ago" card stays (rollback).

### B-J12 Read the year back (NS-24 HP)
1. B-S01: "Go to a month" (or B-S02 at AX3 and above).
2. B-S07.withYears: a "Read a year together" group above the months: one row per year that has letters ("{child}'s first year", "Before You"), no counts.
3. Tap the year just ended -> B-S19.year: Read together opens at that year's first letter, Large print, oldest first.
4. Turn pages; the last page is the year's last letter -> B-S20.endOfYear -> Close the book -> B-S01.
Unhappy: year with no letters -> no row. Due-date-only -> only Before You. Private, sealed, waiting, hidden -> skipped. Recording not here -> words with "Read this one aloud together" (built line). A call mid-page -> B-S19.interrupted: paused, same page on return (R8). Back mid-year -> B-S01; next start is the year's first letter. Killed -> Home. Flag off -> no year rows. Lapsed plan -> reads in full (R10).

### B-J13 Read together, whole book (built; NS-24 scenario rows)
1. B-S01: Read together (only when a kept letter with words exists).
2. B-S19.default: Large print, oldest first, Back one and Next letter, the 2 pt progress hairline, Keep playing chip.
3. B-S20.endOfBook: the moon is drawn complete; "Close the book", "Read it again".

### B-J14 Go to a month (built, BL-676)
1. B-S01: "Go to a month" -> B-S07.default (months with letters, newest first) -> tap -> the Book cross-fades to that month.

### B-J15 Two books (NS-22, NS-02-R46, NS-01-R60)
1. B-S01.twoBooks: the switcher sits under the title; lenses, Find and the end menu act on the active book.
2. Switch -> the Book cross-fades to the other book (built). Find closes and clears.

### B-J16 System states walk (frame section 5; RR-5 tables)
For each of B-S01, B-S04 to B-S08, B-S17, B-S19: offline (identical; nothing in this area waits on a network), kill switch servers off (identical; only sync stops), plan lapsed (identical), signed out (identical, local book, D1), second account (only its own books; nothing of A's: no lens, mark, seal, index, past letter), new phone (words present; no picture slot; recording row says where; C-S12 line in the Book), low storage (reading unaffected; changes are bytes and still save; under 50 MB no new picture), Low Power Mode (no loops; thumbnail regeneration waits).

---

## 4. Screens

Each screen: purpose, layout at default size (375 pt wide), layout at AX5 with Bold Text on an SE 3, VoiceOver order, states, components (existing first), integration map.

### B-S01 The Book

Purpose: read and hear what is kept. One bar in a fixed order (NS-22).

Layout, default. The cover band (built `CoverBand`, the one lit object, `book` lamp scene):
- Row 1: title "Asha's book" (`display`, level 1 heading) with, on the right, the trailing controls in this order: Find (magnifier `IconButton`, 44 pt; NS-02-R1), Go to a month (`Button` quiet small; label renamed from the built "Months" to "Go to a month", WORDS R1, so it never shares a name with the Months lens), More for this book (`IconButton`, DotsThree glyph, 44 pt). The gear leaves (NS-22-R3, R6).
- Row 2: age line (`callout`).
- Row 3 (two books only): the built `ChildSwitcher`.
- Row 4: Read together (`Button` secondary, full width, as built).
- Row 5 (only when a lens other than Months exists): the lens choice B-S03 (`ChoiceGroup` segmented), under the band, above the first chapter.
- Then the list: month openers and letter cards. NS-22-R1: with no lens choice the first card's top edge is at about y 470 on a 667 pt SE 3; with the lens choice about y 530: both above the fold (measure on device).
- Inline bar after scroll (built `BlurSurface`): title, Find, Go to a month, More for this book; then the compact month. Find shows in the band or the bar, never both (NS-02-R1).

Layout, AX5 plus Bold Text (built stacked band, extended): one column in VoiceOver order: title (wraps), age, switcher, Read together (full width), lens choice (stacks to full-width rows, radio semantics kept), then a trailing row that wraps: Find and More for this book. Go to a month folds into B-S02 from AX3 (NS-22 OQ default). Every control 44 pt or more (R2). The first card is within one screen of scroll (R5).

VoiceOver order: title (heading 1), age, switcher (book name and age), Read together, lens choice ("Show, Months, selected, 1 of 2" style radio), Find, Go to a month, More for this book, new-phone line (C-S12) when present, then month headings and cards.

States:
- `.default`: as above; Months lens.
- `.empty` (= `.firstUse`): title and age only; the closed `BookCover` lg; "The first page is waiting."; the button switches to Home (NS-01-R23a). No Find, lens, Read together, Go to a month (NS-22-R4). More for this book stays (Quiet and Hide apply to an empty book too). [A] see card gap G-02.
- `.many`: unchanged bar; list virtualised; list copies only (NS-37).
- `.lensPhotos`, `.lensFirsts`, `.lensBoth`: the lens choice shows the options that exist.
- `.sealedCard`: B-S16 inside the list.
- `.quieted`: the bar is the same; B-S02 offers Turn Quiet off.
- `.hiddenReadOnly`: opened from Hidden books (C-S16): a pushed page, title, age, Read together, no lens, no Find; letter pages read-only; B-S02 offers only "Show this book again". (Engineering gap E-05: no route today.)
- `.twoBooks`: switcher present.
- `.findOff` (flag off or `killSwitches.bookSearch`): no magnifier; nothing else moves.
- `.photosOff` (flag off or `killSwitches.photos`): no lens choice, no thumbnails; letters read whole.
- `.newPhone`: C-S12's one Book-level line above the first chapter (as built `book.arrivalLine` position); cards without picture slots.
- `.undoDeleted`: B-S15.undo over the list.
- `.dayToday`: a day the parent ticked or typed is today. Identical to `.default`: no mark, line, tint, row or filter in the Book (rule 12, section 12). Listed so a test can render the Book with the days store on and off and expect the same tree.
- `.ratingMoment` (FR-MKT-23, P1 (b), not built): not a screen of ours. It is the one state where code may call Apple's rating request, on the Book after a letter the parent kept by their own act (A-S13 saved), never the first kept letter. Apple draws its own sheet; we draw nothing, add no message, unlock nothing. Every exclusion is a row of the table in section 13 (Read together, a seal-opened day, the Keep gate, errors and the rest). It adds no control, no count and no motion to the Book.
- `.offline`, `.killSwitch`, `.planLapsed`, `.signedOut`: identical to `.default`.
- `.secondAccount`: only account B's books; no lens built from A's letters.
- `.dark`, `.increaseContrast`: the band is solid under Increase Contrast and Reduce Transparency (built); hairline frames on thumbnails.

Components: existing `CoverBand` (gains a Find slot and a menu slot, loses the gear), `IconButton`, `Button`, `ChildSwitcher`, `ChoiceGroup`, `MonthOpener`, `LetterCard` (+ `photo` prop from #840; + `sealed` variant, see section 5), `QuietDayRow`, `BookCover`, `EmptyState`, `BlurSurface`, `Lamp`, `Toast`.

Integration map:
| Item | Value |
|---|---|
| Card rows | NS-22-R1 to R7; NS-01-R10a to R12, R23a, R48; NS-02-R1, R46; NS-06-A3, B2; NS-37-R1, R3, R8; NS-33-R3, R4, R7 |
| Backlog | BL-938 (bar), BL-985 (Quiet home), BL-952 (Find entry), BL-931 slice 5 #840 and BL-956 (lens), BL-932 (list copies), BL-968, BL-970 |
| Flags | none for the bar; `EXPO_PUBLIC_BOOK_SEARCH`, `EXPO_PUBLIC_PHOTOS`, `EXPO_PUBLIC_FIRSTS` (proposed), `EXPO_PUBLIC_SEALED_LETTERS` (proposed) |
| Kill switches | `killSwitches.bookSearch` (in #798 only), `killSwitches.photos` (exists); `serverFeaturesEnabled()` off changes nothing here |
| Error codes shown | none on this screen; a failed Quiet write is B-S02.failed |
| Data read | `entries` via `readableInBook`, `Child.quiet`, `children.hide`, `entry_media` (list copy path), `first_mark`, `first_label`, seal columns |
| Data written | none (Quiet, Hide through B-S02) |
| Modules | `app/(tabs)/book.tsx`, `components/book/cover-band.tsx`, `components/book/letter-card.tsx`, `components/photos/photos-lens.tsx` (#840), `lib/firsts/` (proposed), `lib/seal/` (proposed) |

### B-S02 More for this book

Purpose: Quiet this book and Hide this book within 2 taps of the Book (F12-REQ-011 P0, NS-22-R3).

Layout, default: a fit-to-contents `Sheet` titled "More for this book" (header role) with `ListRow`s: "Quiet this book" (Moon glyph), "Hide this book" (EyeSlash glyph); at AX3 and above, "Go to a month" first. Each row 56 pt. No destructive styling (Hide deletes nothing). The Quiet row's subtitle says what it does (`en.children.quiet.help`).
Layout, AX5: rows grow, titles wrap, footnote wraps; the sheet scrolls.
VoiceOver: sheet title, then rows in order, each a button with its hint.
States: `.default`; `.printOn`; `.quieted` ("Turn Quiet off" replaces Quiet; nothing else changes, R7); `.hiddenReadOnly` (only "Show this book again"); `.ax3` (Go to a month folded in); `.failed` (sheet closes, one toast line "That did not save. {child}'s book is as it was."; old state kept); `.twoParents` (no extra line: per person; the other parent sees no change).
Components: `Sheet`, `ListRow`, `Toast`; Hide reuses C-S15's confirm and words (`children.settings.hideBody`).
System menu first (B G-03, ruled CARD): the target is the system menu (N6, `Stack.Toolbar.Menu`), motion T-MENU. No `platform/action-menu` exists on develop [F], so until it lands (v2 engineering row R3) and wherever the menu cannot carry the content (the subtitle line at AX5), a fit-to-contents `Sheet` of `ListRow`s is the fallback; it wraps at AX5 and keeps 2 taps. This section draws the sheet form; the menu form has the same rows in the same order.
`.printOn` (FR-PRT-16, P2 gated, off in 1.0): a third row "A book to hold" (BookOpenText glyph) opens PRT-S01. Absent, never disabled, when the print flag is off, the book is hidden from this person, or no kept letter can be read (NS-21-R2). Quiet and Hide keep their place first; no price, count or countdown on the row. Entry points for print stay exactly three: C-S04, C-S06 and this row.
Integration: NS-22-R3, R7; F12-REQ-011; F09-REQ-016; BL-985 and BL-938 (see engineering gap E-01); data `Child.quiet` via `setChildQuiet` (`lib/store.ts:390`), `hideChild`; no flag; no kill switch; no error code beyond the generic save line.

### B-S03 Lens choice

Purpose: read the book by month, by picture, or by first. A choice, not tabs (NS-33-R3, NS-01-R48).
Layout, default: `ChoiceGroup` layout `segmented`, label "Show" (VoiceOver group label), options "Months", "Photos" (only with a kept open letter that has a picture), "Firsts" (only with a first). Selected by fill, 1.5 pt accent edge and a check, never colour alone. 44 pt tall. Sits under the cover band, above the first chapter (NS-01 OQ-4 as built in #840).
Layout, AX5: `ChoiceGroup` stacks to full-width rows with a trailing check (built behaviour at large text).
VoiceOver: "Show, radio group"; each "Photos, radio button, 2 of 3", selected stated.
States: `.absent` (only Months exists: no control at all), `.twoOptions`, `.threeOptions`, `.ax5`, `.increaseContrast`.
Components: `ChoiceGroup` (existing). No new component.
Integration: NS-01-R10a to R10c, R12, R48; NS-06-A3; NS-33-R3; BL-956; flags as B-S01; no error codes.

### B-S04 Photos lens

Purpose: the letters that have a picture (NS-01-R11). Reads only.
Layout, default: the Book's own month openers and `LetterCard`s with a 72 pt list-copy thumbnail on the left (fit, uncropped, `radius.sm`, hairline frame in dark), newest first by the letter's date. No add control, no count, no empty state.
Layout, AX5: the thumbnail stacks above the words (as #840), at the card's width up to 160 pt tall; words wrap; nothing truncates.
VoiceOver: each card one element: the date, the opening words, "Photo with this letter" (fixed phrase, or the parent's photo words when present, R21c), "Opens the letter."
States: `.default`, `.one`, `.many` (300 pictures, virtualised, list copies only, R53, NS-37-R1), `.thumbMissing` (card without thumbnail; no error; NS-37-R3), `.ax5`, `.dark`, `.backgrounded` (every picture an opaque `surface` box, R13a), `.locked` (no picture draws before App lock is passed, R13b).
Components: `LetterCard` with `photo` (built in #840), `MonthOpener`, `PhotoFrame` (fit, never cover; R42).
Integration: NS-01-R10b, R11, R12, R13a, R13b, R23b, R40, R41, R53; NS-37-R1, R3, R6 to R8; BL-956, BL-932; `EXPO_PUBLIC_PHOTOS`; `killSwitches.photos`; error codes: `derivative_failed` (proposed, eng input 4.2) is silent; reads `entry_media`, `photos/<media_id>-512.jpg`.

### B-S05 Firsts lens

Purpose: the letters the parent marked as a first (NS-06-A3).
Layout, default: normal `LetterCard`s, newest first, the label as the card's first line (`label` type), then the date line, then the opening words. Under month openers like the Book. No count, no badge, no glyph that reads as an award.
Layout, AX5: label wraps, never truncates (A6 AX5 row).
VoiceOver: card reads label, date, words, "Opens the letter."
States: `.default`, `.labelEmpty` (the letter's own first line leads), `.rtlLabel` (right aligned), `.many` (200 firsts p95 500 ms, A24), `.sealed` (a sealed first is absent until it opens, A15), `.ax5`.
Components: `LetterCard` (first-line slot), `MonthOpener`. No new component.
Integration: NS-06-A3, A4, A11, A15, A17, A24, A25; BL-968; `EXPO_PUBLIC_FIRSTS` (proposed); remote pause none (card A9; engineering gap E-03); no error codes shown; reads `first_mark`, `first_label`.

### B-S06 Find

Purpose: find one letter by a word the parent said or typed (NS-02).
Layout, default: Find lays over the Book (component state, never a route, R25). Top: the field "Find a letter" (`TextField`, full width minus Cancel, autofocused, autocorrect, spell check and content type off, R14) and "Cancel" (`Button` quiet). Below: rows, newest first: date line (`letterDateline`), then the sentence holding the match (`body` serif? no: the letter's words are in the serif, so `letterBody` at 17 pt reading scale is too big for a list; PROPOSED `callout` in Literata via `Text` serif small), matched word underlined and in medium weight (R40), up to about 2 lines with the built `ExcerptFade` at the cut, no ellipsis glyph (R9). Each row 56 pt or more, separated by `line`.
Layout, AX5: field full width; Cancel wraps under it, left aligned, 44 pt; rows one column, date over sentence, sentence up to 5 lines (R42), date never truncates.
VoiceOver: field (label "Find a letter", hint only while under 3 characters, R23), then the announcement "Letters found" once, then each row as one element "{date}. {sentence}. Opens the letter." with the snippet in Unicode isolates (R28, R41), then Cancel.
States:
- `.idle`: field and keyboard, nothing else.
- `.short`: under 3 characters: nothing changes (the hint is VoiceOver-only).
- `.results`: rows.
- `.noMatch`: one line, centred under the field: the reworded `book.empty.searchTitle` without "yet" (R13, R39). Nothing else.
- `.failed`: one line "Find could not look just now." and Try again (`Button` secondary); announced once (R37).
- `.failedGettingReady`: the failed view plus a footnote "Find is getting ready on this phone." only while the index builds (R38; NS-02 s16 bans "still").
- `.rtlRow`: an Arabic sentence shown right to left inside the left-to-right list (R28).
- `.cjk`: one Han character starts a search (R3).
- `.afterBack`: query and scroll position restored (R12).
- `.ax5`, `.dark`, `.increaseContrast` (match by underline and weight only).
- `.offline`, `.killSwitch`, `.planLapsed`, `.signedOut`: identical.
Components: `TextField`, `Button`, `IconButton` (entry), `ExcerptFade`, `FindResultRow` and `FindMode` (built in #798, not on develop; they compose `Text` and `Pressable`, no new primitive).
Integration:
| Item | Value |
|---|---|
| Card rows | NS-02-R1 to R50 (screen-facing: R1, R3, R9 to R14, R21, R23, R25, R28, R32, R37 to R42, R46, R47) |
| Backlog | BL-952 (six PRs; #798), BL-962 (no donation) |
| Flag, pause | `EXPO_PUBLIC_BOOK_SEARCH`; `killSwitches.bookSearch` (added by #798, not on develop) |
| Error codes | Shown: only the `failed` view. Silent: `fts_unavailable`, `index_corrupt`, `rebuild_batch_failed`, `killed` (eng input 4.2), `find_index_rowid`, degraded connection |
| Data | reads `letter_search`, `letter_search_rows`, `searchable_letters`; writes nothing to a letter (R49); settings `find.dirtyAt`, `find.secureDelete` |
| Modules | `lib/find/*`, `components/find/*` (#798) |

### B-S07 Go to a month, with year rows

Purpose: jump to a month (built), and start Read the year back (NS-24).
Layout, default: the built `MonthsSheet` ("Go to a month"). PROPOSED for NS-24: a first group titled "Read a year together" (section header, `caption` caps) with one `ListRow` per year of life that has letters, newest first: "{child}'s first year", "{child}'s second year", "Before You"; trailing a BookOpenText glyph, no subtitle, no count. Then the group "Go to a month" with the built rows (their existing subtitles stay; see card gap G-07).
Layout, AX5: rows wrap; the sheet scrolls (built `BottomSheetScrollView`).
VoiceOver: sheet title, "Read a year together" header, year rows ("Asha's first year. Opens Read together at the first letter of this year."), "Go to a month" header, month rows.
States: `.default` (months only: one year or flag off), `.withYears`, `.expectingOnly` (Before You only, R6), `.ax5`, `.dark`.
Components: `Sheet`, `ListRow`, section headers as in `ListSection`. No new component.
Integration: NS-22 (Go to a month), NS-24-R1, R4 to R7; BL-947 (extend: R4 to R10, engineering gap E-06); `EXPO_PUBLIC_READ_THE_YEAR` (proposed); no kill switch (local); no errors; reads `occurred_on`, `Child.birthday`, `Child.dueDate`; `packages/core` `ageOn`.

### B-S08 The letter page

Purpose: read one letter, and look after it, in one place (NS-21).
Layout, default (top to bottom, the card's text column, no lamp):
1. Top bar (built): Back, "Aa".
2. Dateline (`letterDateline`), now a level 1 heading (NS-21-R4, NS-33-R1).
3. The picture when present, above the words (NS-01 section 3 row 3): page copy, fit, `radius.md`, hairline frame in dark, ignores Smart Invert; VoiceOver label the parent's photo words, else "Photo with this letter" (R9a, R21c); the photo words and place (if typed) in `footnote` under it.
4. The words (`letterBody`, Reading Size applies), signature.
5. Play (`AudioPlayer`, built) for a spoken letter whose recording is on this phone (R6b).
6. Built cards when they apply: words waiting (WaitingCard), Read it back.
7. Typed letters: the "Typed" provenance footnote stays under the words (row 7 rule).
8. Share (`Button` secondary, full width, on its own; NS-05 area D owns the sheet) (R3a).
9. "This letter" (`ListSection` title, level 2 heading) with rows in the fixed order, each a `ListRow` at least 56 pt with a leading glyph and a trailing value or chevron; a row absent when it does not apply:
   1. The day: "About 3 March" and, when different, a second line "Said on 9 June" (NS-15-R3). Author: opens B-S09. Other parent: read-only text row.
   2. A first: "This was a first" switch (author); when on, its label as a second line; tapping the text opens B-S12. Other parent: read-only "A first: {label}" only when marked.
   3. A picture: "Add a photo" (none) or "Photo" with the parent's photo words as its value (has one; Change photo lives in B-S11.actions, WORDS R10). Author only for controls.
   4. Hidden until: "Hide until a day" (author, no seal) or "Hidden until 10 January 2027" (sealed, before the day). Absent once open.
   5. Who can read it: "Only you" or "In the book" (rules in B-J03).
   6. Earlier versions (NS-12, area C, C-S13).
   7. Where the recording is (NS-08 words, area C, C-S09): "Kept on this phone" or where it is.
10. Delete (`Button` destructive tone with a Trash glyph and the word, full width), last on the page, apart from the list (R3b).
11. The "Exactly as said" view switch (built) stays where it is today, under the provenance block; not a list row (card section 3 Not in scope).

Layout, AX5 plus Bold Text on SE 3: one column. The picture's page copy fits the width, up to 60 percent of the screen height. Share full width. Each row grows to fit; title and value stack (value under the title, not trailing), never truncated, at least 56 pt. Delete full width, last.

VoiceOver order (R14): dateline (heading 1), picture (if any), words, Play, Share, "This letter" (heading 2), rows in order, Delete. The built waiting and Read it back cards sit between Play and Share in reading order.

States:
- `.ownSpoken` (all rows that apply), `.ownTyped` (no Play, no recording row), `.otherParent` (read-only: day, first, picture, recording; no Who can read it, Hidden until, Earlier versions, Delete, and no "Exactly as said" or "With small fixes" view switch, which is the author's only; NS-21-R11, FR-AIS-08; NS-21-R11), `.oneRow` (only the day applies: still a titled list), `.waiting` (only the day and recording rows, R10), `.readItBack` (built card), `.ownPrivate` (row 5 shows "Only you" even with one adult, R9), `.recordingElsewhere` (no Play; row 7 says where), `.withPicture` (every picture letter, however it began: a stored copy and nothing else, section 12b; "from a photo start" and "from a suggestion" are not states and are never drawn apart), `.ownNoPicture`, `.photoNotStored` (one line under the words: built `photos.book.letter.notSaved` "The photo did not come along with this letter. Your words are kept, and you can add it again." with "Add a photo"; R58), `.photoMissing` ("Not on this phone any more" in the picture slot, with Remove for the author; R56), `.sealedAuthor` (row 4 "Hidden until {day}"; words shown to the author; a quiet `AppNote` under the dateline "Only you can see this until 10 January 2027." PROPOSED, card gap G-01), `.fromNameFixed` (FR-PRV-22, default until Karma rules; PROPOSED: for a letter someone else spoke (NS-16) the dateline carries the From name; for the author one `footnote` line under it says in plain words that the name on this letter cannot be changed here and that the letter can be deleted; no row, no control other than Delete), `.fromNameChange` (the other branch of the FR: the name in the dateline is a button for the author only, opening a fit-to-contents `Sheet` with one `TextField` using core `checkSignsAs`, writing tools off (D2), and Done; the raw transcript is untouched either way; not a row of "This letter" because there is no From row, B V-2; words by `content`), `.firstMarked`, `.notFound` (built S37), `.failed` (a row's write failed: one toast line, old fact kept), `.ax5`, `.voiceOver`, `.dark`, `.increaseContrast`, `.backgrounded` (picture blanked; every screen showing letter words blanks the switcher snapshot, not only the picture, FR-SEC-22), `.signedOut` (every row works locally), `.planLapsed` (every row works), `.killSwitch` (every row works locally; nothing syncs), `.newPhone` (no picture slot; recording row says where).
Components: `ListSection`, `ListRow`, `Button`, `ConfirmSheet`, `DateSheet`, `Sheet`, `ChoiceGroup` (B-S10), `Toggle` (row 2), `PhotoFrame`, `AudioPlayer`, `AppNote`, `Toast`. No new component (NS-21 design inputs).
Integration:
| Item | Value |
|---|---|
| Card rows | NS-21-R1 to R14; NS-33-R1; NS-01-R7 to R9c, R13a, R16a, R38, R40, R50, R56, R58; NS-06-A1, A2a, A13, B1, B3; NS-15-R1, R3 |
| Backlog | BL-928 (heading), BL-937 (the list), #839 (picture), BL-954 (undo helper), BL-962 (writing tools, donation), BL-968, BL-970, BL-939 (Share, area D), BL-979 (earlier versions, area C) |
| Flags | none for the list; each row's own card flag hides only that row |
| Kill switches | `killSwitches.photos` hides row 3 and the add/change controls (data rights unchanged) |
| Error codes shown | photo `unreadable`, `no_space`, `failed`, `photo_bake_timeout`, `photo_reencode_failed`, `photo_pick_failed` -> the R58 line; missing file -> the R56 line; a failed local write -> the generic save line; `SCSEL` never shown |
| Data read | `entries.*` (`in_book`, `occurred_on`, `occurred_precision`, `captured_at`, `final_text`), `entry_media`, `first_mark`, `first_label`, seal columns, `lib/provenance.ts` |
| Data written | through each row's sheet only |
| Modules | `app/letter/[id].tsx`, `components/photos/letter-photo.tsx` (#839), `lib/firsts/`, `lib/seal/` |

### B-S09 Day sheet (from the letter page)

The built `DateSheet` (`components/book/date-sheet.tsx`), the same sheet A-S08 opens from Review. A day, or a month of age for a born child; Before You for days before birth. Bounded by `BACKDATE_YEARS = 3` (NS-15). States: `.default`, `.monthOnly`, `.beforeBirth`, `.failed` (old day kept; built `errors.generic.title` toast), `.ax5` (system picker in a sheet; scrolls). Integration: NS-21 row 1, NS-15-R1, R3; BL-945; no flag; writes `occurred_on`, `occurred_precision` (field group `occurred_on`).

### B-S10 Who can read it

Purpose: make a letter private or put it in the book, with the state said in words (NS-21 threat row).
Layout: a fit-to-contents `Sheet` titled "Who can read it" with a `ChoiceGroup` list: "Only you", "In the book" (one selected, check and edge, not colour alone), and a footnote for the book choice when a second adult exists (intent from NS-25 door lines; WORDS.md). Choosing applies at once, closes the sheet, announces the new value.
States: `.default`, `.oneAdult` (row shown only for a private letter, R9), `.twoAdults`, `.failed`, `.ax5`.
Note: today the page toggles at once with a toast (`toggleInBook`, [F]); NS-21 HP 5 asks for "one sheet opens; one change". The sheet removes the mis-tap risk named in the card's threat table.
Integration: NS-21 row 5, R9, R11; BL-937; writes `entries.in_book` (field group `in_book`); offline queues; no flag.

### B-S11 Picture on the letter page

Surfaces: the picture slot in B-S08; the actions sheet; the replace confirm; the words and place sheet; the Undo line.
- `.actions`: `Sheet` with `ListRow`s "Change photo", "Words about this photo", "Take the photo off" (Take off is not red: it is undoable).
- `.replaceConfirm`: the shared confirm (A-S12): "Use this photo instead?" with "Keep the first" as the default (R7).
- `.undo`: the toast "Photo taken off." or "Photo changed." with Undo (10 seconds, or VoiceOver's reading plus 10, whichever is later; NS-01-R38a), under the T4 window helper. The untimed way back (FR-CMP-08) is already on the page: when the window has closed the row reads "Add a photo" again and a new pick adds a picture, so no timed control is the only road; when the window closes the toast and its Undo leave together (R38b). With Switch Control, the toast stays until the parent leaves the page (R38c).
- `.words`: `Sheet` with two `TextField`s: "Words about this photo" (optional, 140 graphemes), "Where was this?" (optional, 60), Done (built `photos.text.*` keys on #840, WORDS R11). No placeholder examples. Writing tools, autocorrect and suggestions off (R50, D2).
- `.viewer`: tapping the picture opens the stored-copy viewer (design system v2 C4): the picture fitted on black, Close top right, Change and Take the photo off in a bottom bar; controls are clear glass over a local 35 percent dim; the picture is content. Other parent: Close only.
- `.notStored`, `.missing`: as B-S08 states.
- `.pickFailed`: the picked file could not be opened: one line ("That photo could not be opened. Choose another."), nothing written (R17a).
- `.iCloudDownloading`: an iCloud-only picture downloading with the system progress trait and Cancel (R17b; not met in #837).
- `.iCloudOffline`: iCloud-only and offline: one calm line; the letter unchanged (R46).
- `.ax5`: fields full width, labels above, Done full width.
Integration: NS-01-R7, R8, R9a to R9c, R21a to R21c, R38a to R38c, R50, R54, R56, R58; #839, BL-954, BL-957; `EXPO_PUBLIC_PHOTOS`, `killSwitches.photos`; error codes as B-S08; writes `entry_media` (photo_text, place) on the phone only, never synced (R26).

### B-S12 Mark a first

- Row 2 in B-S08: `ListRow` with a trailing `Toggle` "This was a first" (role switch; announces On or Off; A11). Not a celebration: the system toggle motion only.
- `.labelSheet`: turning on opens a `Sheet` with one `TextField` labelled "In your words, if you like" (intent), empty, no placeholder, no list, no example (A1), Done. The field stops at 40 graphemes and says nothing (A5). Writing tools off (A22).
- `.marked`: the row shows the label as a second line; tap the text part to edit the label (same sheet).
- `.undo`: unmark clears mark and label in one tap (A2a); Undo lasts 10 seconds or VoiceOver's reading plus 10 (A2b); the untimed way back (FR-CMP-08) is the switch itself, always on the page, which marks it again, the label retyped; toast "No longer marked as a first." (intent) with Undo under T4 (A2b).
- `.atLimit`, `.rtl` (label right aligned), `.failed` (unmarked; generic save line), `.ax5` (toggle under the title, full-width row).
- In Review (A-S07) the same row and sheet; a draft's mark waits for Keep (A14).
Integration: NS-06-A1 to A25 (screen: A1, A2a, A2b, A5, A6, A11, A13, A14, A22); BL-968; BL-954; BL-957; `EXPO_PUBLIC_FIRSTS`; field group `first`; no remote pause (card); error: a rejected write (check violation) is the generic save line.

### B-S13 Hide until a day

Layout: `Sheet` titled "Hide until a day" (intent). Body in order: the sentence "Only you can see it until that day." (`body`); the system date picker (inline calendar style, bounded tomorrow to the child's 25th birthday, B11); the honest limits as three short `footnote` lines (`seal.limitZone`: west of here it can open the evening before; `seal.limitClock`: a clock set ahead opens it early on that phone; `seal.limitStored`: hiding keeps it out of sight and it is stored like every other letter, which says "not locked" without the banned word, WORDS G6; and, from FR-LEG-06, a fourth footnote line in the same style that the letter is never sent to anyone while it is hidden, words by `content`, counsel reads; no age preset, no "for when they are 18", a date and nothing else); "Hide it" (`Button` primary, full width, absent until a day is chosen, B G-12 ruled: the picker starts with no day selected); "Not now" (quiet).
AX5: the picker in its own row, full width; lines wrap; buttons full width.
VoiceOver: title, sentence, date picker, the three lines, Hide it, Not now.
States: `.default`, `.daySelected`, `.expecting` (latest day due date plus 25 years), `.noDates` (25 years from today), `.ax5`, `.dark`.
Never: "locked", "secure", "vault", "time capsule", "for when they turn 18" (B16). No countdown anywhere (FS-R6).
Integration: NS-06-B1, B1b, B10, B11, B12 Shown line; BL-969, BL-970; `EXPO_PUBLIC_SEALED_LETTERS`; writes `seal_opens_at`, `seal_opens_on` once, together; client codes `seal_in_past`, `seal_after_limit` are prevented by the picker bounds and never shown; `SCSEL` never shown.

### B-S14 Open now

`ConfirmSheet` (built shape): title "Open this letter now?", body "It cannot be hidden again.", actions "Open now" and "Cancel", Cancel the default and first (B3). After: the row 4 disappears for good; the letter reads normally; a toast is not needed (the page changes in place) [A]. States: `.confirm` (the only drawn state; Cancel default), `.offline` (opens here at once; others later, B13), `.ax5`. Integration: NS-06-B3, B13, B14; BL-970 (engineering gap E-04 on "nulls both columns"); writes the clear request; server stamps `seal_cleared_at`.

### B-S15 Delete and Undo

- `.confirm`: built `ConfirmSheet`: "Delete this letter?", "It waits in Recently deleted for 30 days.", "Delete letter" and "Keep it" (default). Warning haptic as built.
- `.confirmSealed`: the same, plus one line that a hidden letter waits there with its day and no words (NS-06-B25; words in WORDS.md).
- `.undo`: back on the Book, "Letter deleted." with Undo, no timer, until dismissed or the screen changes (built; NS-21 section 5).
- `.overHome`: opened from B-S17, the toast shows over Home (built).
Integration: NS-21-R7a, R7b; NS-36-R1a, R1b; NS-06-B25; NS-01-R16a, R16b; built.

### B-S16 A hidden letter in the Book

Layout: a `LetterCard` variant `sealed`: flat (no elevation, `surface` fill, a 1 pt `controlBorder` edge so it is a shape, not a colour), the date line, then "Hidden until 10 January 2027" in `body` sans, no words, no picture, no first label, no signature line of words; a decorative Envelope glyph (hidden from VoiceOver). It is a button to the author's letter page. 56 pt or more; wraps to two lines at AX5 (B6 AX5 row). Sits in the month of its about-day, like any letter.
VoiceOver: one element "{date}. Hidden until 10 January 2027. Opens the letter." with no hint that reveals words (B6 VoiceOver row).
States: `.default`, `.ax5`, `.dark`, `.increaseContrast`, `.afterOpening` (a normal card, no animation, B4).
Only the author's phones ever draw it. No other member gets a row (B8).
Integration: NS-06-B2, B6, B8, B12, B17, B24; BL-970; visibility through `isVisibleTo` (B6) and `searchable_letters` (NS-02 seal clause).

### B-S17 One past letter on Home (slip rank 4)

Purpose: surface one letter from the Book. It is a surfacing, not a copy: the card is the Book's own `LetterCard` in a `pastLetter` variant (v2 C1), so the Book card, the past letter and a Find row share one excerpt function and one card shape (IA-AUDIT section 11, D-06; the built `ResurfacedCard` is retired).
Layout: in A-S01's single slip slot, `Card` radius md, the accent letter rule on the left, the kicker is the letter's own date (caption caps), then the opening fragment in `letterBody`, 2 lines at default with `ExcerptFade` (R10), and a quiet "Not today" `Button` (small, 44 pt) at the card's foot, right aligned (B G-06). The whole card (minus Not today) is the tap target to the letter. The fragment is the parent's own words only: no picture, no thumbnail, no photo words, no place, no first label, no day name (NS-49-R3, NS-46-R22).
Position note (a contradiction to flag, not resolve; section 14 Q-B1): the earlier drafts drew this card under the prompt and "Another thought". NS-50-R4 says the slot is "directly above the prompt block", and a slot has one position. This file follows the slot wherever A-S01 draws it and draws no position of its own; the prototype keeps the earlier position until A-S01 is re-drawn. At default sizes it never sits between the prompt and the capture controls (actions pinned below the scroll, built).
Rank: the last of the registry (1 waiting set, 2 seal-opened, 2b a day the parent chose today, 3 Save a copy, 3b the Days ask, 4 this card). At most one slip shows; a higher rank hides this one for that visit (NS-23-R6, NS-50-R5). The order is data in one registry (BL-963); no code here compares ranks.
AX5: capture actions ride inline above the card (built `index.tsx:304-305`); fragment up to 4 lines (R10, B V-3); Not today on its own full-width row under the fragment.
VoiceOver: the card is one element, the date then the fragment in the letter's language (R7); then "Not today" as its own button. The hint of Not today says it hides this until tomorrow (the day slip's hint says the same; the Days ask's says it closes the question).
States: `.default`, `.absent` (no match, switch off, a higher slip due, quieted or hidden book), `.higherSlip` (rank 1, 2, 2b, 3 or 3b is due: nothing of this card shows and no space is kept; the letter waits for the next matching day), `.dismissed` (gone until local midnight), `.switchOff`, `.ax5`, `.appLockSnapshot` (no fragment; with every L4 screen blank when inactive, FR-SEC-22), `.dark`, `.flagOff` (built "A month ago" card).
Never: a number of time beyond the date, "since", "missed", "memories", "on this day", a count of letters, the name of a day, a picture or anything about how the letter started.
Integration: NS-23-R1a to R18; NS-49-R3; NS-50-R5; BL-946, BL-963 (slip registry), #721 reconcile; `EXPO_PUBLIC_PAST_LETTER`; settings `home.pastLetters`, `home.pastLetter.dismissedOn`; no errors shown (a pick that throws shows nothing); modules `components/book/letter-card.tsx` (variant), the picker (`from-the-book.logic.ts` or its replacement).

### B-S18 Seal-opened line on Home (slip 2)

Layout: in A-S01's slip slot on the opening day only, at most once: a quiet card in the same shape as B-S17, kicker the letter's own date, one line "A letter you hid until today is open now." (`seal.homeOpened`) and no words of the letter; tap opens the letter (words shown only when the parent taps, B4). Rank 2 of the registry: it outranks a day the parent chose (2b), which waits for the next Home visit that day (NS-50-R5). A "Not now" button sits with it (B W-G13); see section 14 Q-B4 on its key. No glyph that celebrates, and no motion at all: drawn complete, exempt from Home's cold-launch enter (B M-G2, B-motion 2). No rating request is called on this day (FR-MKT-23).
States: `.default`, `.absent` (after it has shown once, or after the day), `.ax5`.
Integration: NS-06-B4, B24; NS-50-R5; BL-963, BL-970; slip registry `seal.homeOpened`.

### B-S19 Read together

Built screen (`read-together.tsx`): chrome-free, Large print, oldest first, page turn, Back one and Next letter at the bottom (stacked at AX sizes, built `turnControls`), 2 pt progress hairline (VoiceOver "Letter n of m", built), Keep playing chip, dusk lamp at night.
NS-24 adds a year range: `.year` opens at the year's first letter and ends at its last; the top bar title reads the year label ("Asha's first year", PROPOSED) instead of "Read together".
States: `.default`, `.year`, `.typed` (built "This one was typed. Read it aloud together."), `.recordingElsewhere` (built line), `.interrupted` (playback paused, same page on return, R8), `.skippedFailedPage` (skipped silently), `.ax5`, `.dark` (bedtime default), `.planLapsed` (full).
Screen awake while a recording plays, released 5 minutes after pause (NS-24-R9; engineering gap E-07).
Integration: NS-24-R1 to R10; built D-082, D-083; BL-947; `EXPO_PUBLIC_READ_THE_YEAR`; reads `readableInBook` (skips private, sealed, waiting, hidden).

### B-S20 End of the year, end of the book

`.endOfBook` (built): the moon drawn complete (B-motion 3), the line "That is every letter in the book." (B W-G5; the built line holds "so far" and "still" until `content` rewords it), "Close the book", "Read it again".
`.endOfYear` (NS-24, PROPOSED): the same layout with a year line "That was {child}'s first year." (intent; the built `endOfMonth` shape), "Close the book", "Read it again". No count, no summary, no highlights, no ordinal ("your first year" as a name is allowed, "the 12th letter" is not; FR-DAT-03, R2). Then the Book.

### B-S21 Me: Past letters on Home

A `Toggle` row in C-S01 (Me). After tree test T1 it sits in the regrouped group "Days and reminders" (working title, RV-3) beside Reminders and Days, because it is a Home preference and not a writing one (IA-AUDIT D-06, R-IA-4); before T1 it stays where C-S01 draws it. The footer is "When today's date matches a letter from an earlier month or year, Home can show it." (`en.settings.pastLetters.help`; replaces the card's intent, which used "on this day", WORDS G4). Default on (NS-23 OQ-2). States: `.on`, `.off`, `.ax5`. Records: on the phone only; no PRIV-R21 row (a setting). Integration: NS-23-R4; BL-946; `home.pastLetters`.

### B-S22 Recently deleted: a hidden letter

In C-S17, a hidden letter's row shows the day it was about and "Hidden until {day}" (intent), the built "Kept here until {date}" line, Restore and Erase now, and no words (NS-06-B25). Restore returns it hidden. C owns the screen; this is the row's content.

### B-S23 Read-along (NS-29)

Not drawn (decision record; "Designers do not draw this until it is reopened" applies to NS-26; NS-29 says what must be true before anyone designs it). Nothing in any build shows a highlight or a "coming soon" line. The built `motion.highlight` token stays unused. Reopen conditions: per-word timings stored on the phone against the raw transcript (BL-986), tester evidence, a ranked slot after NS-24.

---

## 4a. Materials (design system v2 policy, `docs/design/system/BRIEF.md` section 3)

Applied 20 Nov on the coordinator's instruction. Glass is the control and navigation layer only; everything a parent reads is the content layer on paper. Names below follow the v2 brief (`GlassView` regular or clear, `GlassContainer`); where `docs/design/system/COMPONENTS.md` names a component differently, its name wins (section 11).

| Surface | Layer | Material | Notes |
|---|---|---|---|
| Tab bar (Home, Book, Me) | glass | system native tabs | counts as one glass surface on every tab screen |
| B-S01 header controls: Find, Go to a month, More for this book | glass | regular, one `GlassContainer` | capsule icon buttons merged; the title, age and cover band paper are content |
| B-S01 inline bar after scroll | glass | regular (navigation bar) | takes the same three controls; the band's container leaves, so never two |
| B-S01 Read together button, lens choice B-S03 | content | paper, `ChoiceGroup` and secondary `Button` | kept off glass to hold the three-surface limit (tab bar, header cluster, toast) |
| B-S01 to B-S05 letter cards, month openers, sealed card B-S16 | content | paper and `surfaceRaised` | never glass |
| B-S02, B-S07, B-S09 to B-S14 sheets | glass | regular sheet; more opaque at full height | the screen behind is under the scrim; no glass control inside a glass sheet: sheet buttons are solid |
| B-S06 Find bar (field and Cancel) | glass | regular, one container | replaces the header cluster while open; results are content |
| B-S08 top bar (Back, Aa) | glass | regular, one container of two capsules | the page body, list, Share and Delete are content |
| B-S08 picture | content | the picture itself | no control floats over it on this page; if a picture viewer opens, its controls are clear glass with a 35 percent dim |
| B-S15 and B-S11, B-S12 undo toast | glass | regular | one at a time (built toast store) |
| B-S17, B-S18 Home slips | content | `Card` on paper | the capture cluster above is A's glass |
| B-S19 Read together: Close in the top bar, Back one and Next letter at the foot | glass | regular, one container for the two turn buttons | the page is content; dusk lamp stays behind the content, never through glass |
| B-S21 Me row | content | system grouped list | |

Budget check (at most three glass surfaces visible): Book = tab bar, header cluster, toast. Find open = tab bar, Find bar. Letter page = top bar, toast (tab bar hidden on the pushed page as built). A sheet open = the sheet (the rest dimmed). Read together = top bar, turn container.
Fallback: Reduce Transparency or iOS earlier than 26: each glass surface draws `surfaceRaised` with a 1 pt `controlBorder` edge, same shape and size (the prototype's Reduce Transparency toggle shows it). Increase Contrast: borders and labels step to `tokens.highContrast`.

## 5. Components

Existing first. No new component is required by this area. Variants of existing components and slot changes are proposed (v2 adds the `pastLetter` variant and retires `ResurfacedCard`):

| Component | Change | Why | Card |
|---|---|---|---|
| `CoverBand` | Loses the gear slot; gains a `find` slot and a `menu` slot (both `IconButton`) | NS-22 bar order; NS-02-R1 | NS-22, NS-02 |
| `LetterCard` | New variant `sealed` (flat, no words, a date line and one line) | B2 needs a row with no words; reuse beats a new `SealedRow` (spec 04 B5 superseded) | NS-06-B2, B15 |
| `LetterCard` | First-line slot for a Firsts label | A4 step 4 | NS-06-A3 |
| `LetterCard` | New variant `pastLetter` (kicker = the letter's date, 2 lines, 4 at AX, quiet "Not today"); the built `ResurfacedCard` is retired so the Book and Home never carry two letter-card components | NS-23 content and design inputs; IA-AUDIT D-06 (one owner per fact); v2 C1 | NS-23 |
| Excerpt function | One function returns the opening fragment for a Book card, the past letter, and (as the sentence around a match) a Find row; none re-implements trimming or `ExcerptFade` | one owner per fact | NS-23-R10, NS-02-R9 |
| `ageLine` (core, not a component) | The cover band's age line calls the one `ageLine(child, today, { weeks: false })`; Home calls it with weeks (R-IA-1, X9) | one fact, two precisions | NS-22-R1 |
| `MonthsSheet` | A "Read a year together" group above the months | NS-24 entry | NS-24 |
| `ListRow` | A `stacked` layout at accessibility sizes where the value moves under the title (it exists for subtitles; extend to trailing values) | NS-21-R5, no truncation | NS-21 |

Built in open PRs, not on develop, reused as is: `FindMode`, `FindResultRow` (#798), `PhotosLens`, `LetterPhoto`, `PhotoFrame` fit (#839, #840).
Not built: a system action menu (`platform/action-menu`): B-S02 uses a `Sheet` as the fallback and the system menu as the target (B G-03, ruled CARD).

---

## 6. Error codes and unhappy states, one table

| Code or outcome | Source | What the parent sees | Screen state |
|---|---|---|---|
| Search `failed` (scan cannot read) | NS-02 section 10 | "Find could not look just now." and Try again, announced once | B-S06.failed |
| Index not ready, alongside `failed` | NS-02-R38 | "Find is getting ready on this phone." only while true | B-S06.failedGettingReady |
| `fts_unavailable`, `index_corrupt`, `rebuild_batch_failed`, `find_index_rowid`, degraded | NS-02 section 10; eng 4.2 | Nothing; the scan answers | n/a |
| `killed` (Find) | eng 4.2 | No magnifier | B-S01.findOff |
| `photo_pick_failed` (pick outcome `failed`) | NS-01 section 10 | "That photo could not be opened. Choose another." | B-S11.pickFailed |
| `photo_reencode_failed`, `photo_bake_timeout`, commit `unreadable` (`not_jpeg`, `corrupt`, `needs_rotation`), `no_space`, `failed` | NS-01 section 10 | Once, this session: `photos.book.letter.notSaved` with Add a photo | B-S08.photoNotStored |
| `photo_path_refused`, `photo_temp_name_refused`, `picked_file_outside_picker_folder`, `baked_file_outside_folder`, `photos_folder_unknown` | NS-01 section 10 | The same R58 line (0 files, 0 rows) | B-S08.photoNotStored |
| Pick `cancelled` | NS-01 | Nothing | n/a |
| Stored file missing | NS-01-R56 | "Not on this phone any more" and Remove | B-S08.photoMissing |
| iCloud-only picture offline | NS-01-R46 | "This photo is in iCloud and needs a connection." | B-S11.iCloudOffline (A-S03 on the Home path) |
| `derivative_failed` (list or page copy) | NS-37; eng 4.2 | Nothing; card without thumbnail | B-S04.thumbMissing |
| `killSwitches.photos` | NS-01-R19 | Picture surfaces absent; letters read whole | B-S01.photosOff |
| Local write failed (day, who can read it, first, Quiet) | NS-21, NS-22, NS-06 A6 | One line; the old fact kept | `.failed` on B-S09, B-S10, B-S12, B-S02 |
| `SCSEL` (server refused a seal op) | NS-06-B10 | Nothing; the phone keeps its rule | n/a |
| `seal_in_past`, `seal_after_limit` | eng 4.2 | Prevented by the picker; never shown | n/a |
| Undo helper `expired`, `superseded` | eng 4.2; BL-954 | The Undo control leaves with its window; a newer toast replaces an older | B-S11.undo, B-S12.undo |
| Length `too_long` | BL-957 | The field stops; nothing said | B-S12.atLimit, B-S11.words |
| Letter not found (deleted elsewhere) | NS-21 | Built S37 state with Open Recently deleted when there | B-S08.notFound |
| Past-letter pick throws | NS-23 | Nothing; Home unaffected | B-S17.absent |
| Read together page cannot render | NS-24 | Skipped silently | B-S19.skippedFailedPage |
| Global fault, outage, low storage, app lock, second account | area E | E-S13, E-S14, E-S15, E-S17, E-S22, E-S18 | n/a |

---

## 7. Accessibility walk for this area (J-N12, J-N20 slices)

| Check | B-S01 | B-S06 | B-S08 | B-S17 | B-S19 |
|---|---|---|---|---|---|
| Heading | title h1 | n/a (overlay; field first) | dateline h1, list h2 | none (card on Home) | year or "Read together" |
| AX5 SE 3, Bold Text | stacked band, lens rows | Cancel wraps | rows stack, 56 pt | inline actions first | stacked controls |
| Voice Control names | "Find", "Go to a month", "More for this book", "Read together", lens names | "Cancel", "Try again" | each row's visible title; "Share"; "Delete" | the date; "Not today" | "Next letter", "Back one" |
| Switch Control | all in band order | rows scannable | rows in order | card then Not today | as built |
| Reduce Motion | header settle off; cross-fades only | no overlay fade | 200 ms fade card-to-page | no enter | page turn becomes a 200 ms fade |
| Colour not alone | lens selection: check plus edge | match: underline plus weight | private: words, not chip colour | accent rule is a shape | progress is a hairline plus VoiceOver |
| Smart Invert | thumbnails ignore | n/a | picture ignores | n/a | n/a |

---

## 8. Card gaps

| Id | Card row | What is missing or unclear | Proposed default |
|---|---|---|---|
| G-01 | NS-06-B2, B3, NS-21 row 4 | Whether the author's letter page shows the words before the day. B2 says the Book row has no words and "Not in scope: hiding from the author" | The author's page shows the words, the row "Hidden until {day}" and a quiet AppNote line; tapping the row offers Open now (B-S08.sealedAuthor) |
| G-02 | NS-22-R4, F12-REQ-011 | An empty book's header: R4 lists what is absent; it is silent on the end menu | More for this book stays on an empty book (Quiet and Hide apply to it) |
| G-03 | NS-22 section 15 | "The system menu" is named, but no action-menu wrapper exists on develop | A fit-to-contents Sheet of ListRows (B-S02); revisit if `platform/action-menu` lands |
| G-04 | NS-22 section 16 | "the existing `children.quiet.*` keys": no such keys exist in `packages/content` [F grep]; only `children.settings.hideLabel`, `showButton` | `content` adds `children.quiet.*` as PROPOSED keys (BL-965) |
| G-05 | NS-06-B4 | The seal-opened slip's words and whether it names the letter's date | The letter's own date as kicker and one line with no words (B-S18) |
| G-06 | NS-23 section 15 | Placement of the dismiss control | A quiet small button at the card's foot, right aligned; own row at AX sizes |
| G-07 | NS-24 section 16, frame rule on counts | The built Months sheet rows already carry "3 letters, from Mama and Papa" [F `months-sheet.tsx` header]; the new year rows must not count | Year rows carry no subtitle; the month rows stay as built; CPO to rule whether month counts stay (they are facts, DESIGN_LANGUAGE principle 4) |
| G-08 | NS-21 section 4 step 5 | Who can read it today toggles at once; the card says "one sheet opens" | A two-choice sheet (B-S10) |
| G-09 | NS-01 section 3, NS-21 row 3 | Where photo words and place show on the letter page | Footnote under the picture, the parent's words verbatim |
| G-10 | NS-02 section 3 | The type style of the snippet | Literata at `callout` size (the parent's words stay serif), match underlined plus medium weight |
| G-11 | NS-24 section 3 | The Read together title for a year | The year label replaces "Read together" in the top bar |
| G-12 | NS-06-B15 | Whether the date picker starts on a day | No day preselected; Hide it disabled until one is chosen |
| G-13 | NS-21 section 5, COMPONENTS 2.14 | The Book's delete Undo is "by tap, never a timer", while T4 governs other undo windows | Two kinds stay: delete Undo by tap (built), photo and first Undo under T4 |

Rulings since v1 (GAP-LOG round 1 and 2, area B): G-01 ruled CARD (new row NS-06-B27); G-02 DEFAULT held; G-03 ruled CARD (system menu first, sheet only as fallback); G-04 DEFAULT held; G-05, G-06, G-08 to G-11 DEFAULT held; G-07 ruled CARD (facts about what exists may be stated where a parent looks, never on Home, never as progress; year rows carry no subtitle; the Months sheet keeps its built month lines); G-12 ruled DEFAULT with a change here: the seal action is absent until a day is chosen (not disabled); G-13 ruled CARD (two kinds of undo). New card gaps from the final pack are section 14.

## 9. Engineering gaps

| Id | Gap | Backlog row it belongs to |
|---|---|---|
| E-01 | BL-938 says the bar adds nothing and BL-985 puts Quiet only in Me; NS-22-R3 needs Quiet and Hide within 2 taps of the Book through the end menu | BL-938 (add the menu slot and B-S02) |
| E-02 | Photos and Find are on-device; `buildFlagEnabled` would hide them in the `testflight` profile where servers are off (eng input 2.2) | BL-958 (`localFeatureEnabled`) |
| E-03 | Eng input proposes `killSwitches.firsts` and `seals`; cards NS-06 A9 and B9 say no remote pause. The cards win; the eng proposal needs a card change or is dropped | BL-968, BL-970 (record the choice) |
| E-04 | BL-970 says "Open now nulls both columns" and BL-969 names `sealed_until`; NS-06-B1, B3 and ADR 0028 D3a keep the pair and stamp `seal_cleared_at` | BL-969, BL-970 (reword to the card) |
| E-05 | No route reads a hidden book (Hidden books UI is not built; `hiddenTitle` is unused in `apps/mobile/src` [F]) | BL-985 or a new row from `product` (C-S16 with area C) |
| E-06 | BL-947 satisfies NS-24-R1 to R3 only; the card has R4 to R10 (empty year, boundaries, expecting, about-day, interruption, keep-awake, lapsed plan) | BL-947 |
| E-07 | NS-24-R9 keep-awake while reading: no keep-awake call in `read-together.tsx` | BL-987 (fact), then BL-947 |
| E-08 | `killSwitches.bookSearch` exists only in #798, not in `packages/api/src/remote-config.ts` on develop | BL-952 PR 6 |
| E-09 | Lens choice in #840 is a tab list of Buttons | BL-956 |
| E-10 | The Undo toast never times out while photo Undo expires after 10 s | BL-954 |
| E-11 | The past-letter slip needs the slip registry and the #721 reconcile before it renders | BL-963, BL-946 |
| E-12 | `ListRow` has no stacked trailing-value layout at AX sizes | BL-937 (with `design-systems`) |
| E-13 | Writing tools switch for the words sheet, Firsts label, photo words and place may not exist in React Native | BL-962 |

## 10. Reconciliation with MOTION.md, WORDS.md and design system v2

Pass 1, 20 Nov, after reading `MOTION.md` (sections 1 to 13) and `WORDS.md` (sections 1 to 23) in this folder.

**Words.** Every word in this file and the prototype now follows `WORDS.md`: its items R1 to R15 are adopted as written (Go to a month; Turn Quiet off; the Quiet toast and failure lines; "Show letters by"; "Photo with this letter"; "Find is getting ready on this phone."; the Find row label template; "Read a year together" with its hint; the photo words as the picture row's value; the built `photos.text.*` labels; the built `notSaved` line; "Hide it"). Where this file still quotes a line, `WORDS.md` holds the key of record.

**States added from the siblings.** B-S11.pickFailed, B-S11.iCloudDownloading, B-S11.iCloudOffline (WORDS section 23) are now in B-S11, the error table and the prototype. B-S14's one state is renamed `.confirm` (both siblings use it).

**State names the siblings use for moments of a drawn state** (aliases, no new screen; the prototype shows them under each state):

| Sibling name | DESIGN.md state | Note |
|---|---|---|
| B-S01.firstView, B-S01.arrived | B-S01.default | header settle on first view; the new-phone arrival (C-S12) |
| B-S01.undoDelete | B-S01.undoDeleted | same state |
| B-S01.hiddenBook | B-S01.hiddenReadOnly | same state |
| B-S02.ax | B-S02.ax3 | same state |
| B-S03.default, .withPhotos, .withFirsts, .lensAppears, .lensGoes | B-S03.absent, .twoOptions, .threeOptions | lensAppears and lensGoes are the moments between absent and two options (MOTION B-M12, B-M13) |
| B-S04.thumbPending | B-S04.thumbMissing | the box is reserved; the copy arrives at the next mount (MOTION G3) |
| B-S08.default, .carried, .faded | B-S08.ownSpoken | card-to-page moments (MOTION B-M24) |
| B-S08.wordsUnreviewed | B-S08.readItBack | same state |
| B-S12.off | B-S08.ownSpoken row 2 | the switch off |
| B-S17.present, B-S18.present | B-S17.default, B-S18.default | same state |
| B-S19.turning | B-S19.default | the page-turn moment |
| B-S19.newPhone | B-S19.recordingElsewhere | same words, same state |
| B-S20.end, B-S20.month | B-S20.endOfBook; no month end in this area | `endOfMonth` is a built key not reached by any journey here |

**Rulings adopted since pass 1 (GAP-LOG area B motion rulings).** B-motion 1: the lens choice plays `H-select`, the Quiet toast has no `tap` (G5 and G10 withdrawn, E-14 dropped). B-motion 2: the seal-opened line is drawn complete with no enter. B-motion 3: the Book header settle and the end-of-book moon draw are retired; the moon is drawn complete. B-motion 4: the list swap, the picture viewer cover, the dusk lamp timing, the first-seen tint and the inline bar threshold go to v2. B-motion 5: `changeDate` loses its haptic.

**Motion decisions adopted.** MOTION G1, G2 (the seal opens in one frame at the next render; the seal-opened slip is drawn complete), G3, G4 (the lens swap is the month jump's 200 ms out-and-in fade; Months keeps its place), G5 (withdrawn: the lens plays `H-select`), G6, G7 (under Reduce Motion the past letter renders complete, no fade), G8, G9, G10 (withdrawn: no haptic for a setting), G11 (unmark uses an Undo toast).

**Words gaps adopted.** WORDS G4: the Me footer no longer says "on this day". WORDS G5: the built end-of-book line holds "so far" and "still"; the year end uses its own line (`en.readTogether.endOfYear`), and the whole-book end stays as built until `content` rewords it. WORDS G6: the seal sheet's third limit line no longer says "locked" ("Hiding keeps it out of sight. It is stored like every other letter.").

**Design system v2.** `docs/design/system/BRIEF.md` section 3 is applied (section 4a). On 20 Nov at the time of this pass, `COMPONENTS.md`, `FOUNDATIONS.md`, `tokens.v2.json` and `MOTION.md` were not yet in `docs/design/system/`, so this file uses the brief's names (`GlassView` regular and clear, `GlassContainer`) and the current components; Karma maps them to the v2 component names when those files land. The prototype renders glass as a translucent blurred surface and the Reduce Transparency toggle shows the solid fallback.

**Engineering gaps added from the siblings.**

| Id | Gap | Row |
|---|---|---|
| E-14 | Withdrawn (B-motion 1: the lens plays `H-select`; `ChoiceGroup` keeps its `tap`) | none |
| E-15 | One list-swap helper for lenses and the month jump, with Months' place saved per session (MOTION E1) | BL-938 |
| E-16 | `features/firsts.en.ts`, `features/seal.en.ts` and the appendix A scan named in NS-06-A5, A12, B9 are not in `rules.test.ts` (WORDS section 22) | BL-968, BL-970, BL-965 |
| E-17 | Year names need an ordinal lookup, not a sentence built in code (WORDS) | BL-947 |

**Design system v2 COMPONENTS.md (read 20 Nov, late in this pass).** Mapping: B-S01 header = N5 (band content, controls glass); B-S06 = N4 Find bar; B-S02 = N6 menu; sheets B-S07, B-S09, B-S10, B-S13 to B-S15 = N7; cards = C1 (`sealed` and `past letter` are named variants there, matching section 5); letter page list = C2; picture viewer = C4 (added as B-S11.viewer and drawn); toasts = F1; Day sheet = I3; lens choice = I4; first toggle = I5; switcher = I6. Adopted: B-S02 becomes the system menu (`Stack.Toolbar.Menu`, N6) once the Book tab hosts a Stack (v2 engineering row R3); until then the sheet drawn here is the fallback, so card gap G-03 stays open only for that interim. Conflicts where the locked card wins, for Karma to reconcile in v2:

| v2 item | Card row | Conflict | This file keeps |
|---|---|---|---|
| F1 Undo toast: every Undo, including "Letter deleted.", follows the T4 window and then goes | NS-21 section 5 and R7b: the Book offers Undo "by tap, never a timer" | a timer on the delete Undo | delete Undo by tap, no timer; T4 for picture and first Undo (G-13) |
| C2 lists Share and From as rows inside "This letter" | NS-21-R3a: Share is a separate button above the list; section 3 row order has no From row | Share inside the list | Share apart, above the list; the From name (NS-16, area A) shows in the dateline, not as a row |
| C1 at AX5: excerpt two lines | NS-23-R10: past-letter fragment up to 4 lines at accessibility sizes (OQ-3 default 4) | 2 versus 4 | 4 on the past letter; Book cards follow v2 |
| C2 row min height 52 | NS-21-R5: at least 56 pt at AX5 with Bold Text | the default-size value is v2's; the AX5 floor is the card's | 56 pt at AX5 |


---

## 11. One owner per fact: Home and the Book (IA-AUDIT applied, v2)

IA-AUDIT found almost no duplicated information between Home and the Book: the one shared object is a past letter, which is a surfacing of a Book letter, not a copy. The real duplicates were several doors to one function, one fact drawn two ways, and the same thing computed twice. This table lists every fact this area shares with Home, who owns it, and what this pass changed so no fact has two owners. R-IA-1 to R-IA-6 are ruled (GAP-LOG); X-ids are IA-AUDIT section 7.

| Fact | Audit id | On Home | In the Book (this area) | The one owner | What changed here |
|---|---|---|---|---|---|
| The age line | D-05, X9, R-IA-1 | Dateline, months and weeks | Cover band row 2, months only | `ageLine(child, today, { weeks })` in `packages/core` | B-S01 row 2 calls it with weeks off; no screen-local wrapper (`coverAge`, `tonightStageLabel`). The words a parent sees do not change |
| A letter from the Book | D-06, 5.4 | Past letter, slip rank 4 (B-S17) | The letter itself (B-S01 card, B-S08) | The letter row and the Book's `LetterCard` | The slip is a `LetterCard` variant `pastLetter`; `ResurfacedCard` is retired. One excerpt function serves the Book card, the past letter and a Find row (section 5). The Book gets no second "on this day" row (NS-31 is parked; Q-FD-6): the slip is the only surfacing |
| Past letters switch | D-06 | none | none | Me | B-S21 moves into Me's "Days and reminders" group after tree test T1; it is a Home preference |
| Whose book | D-12 | Switcher (A-S02) | Switcher (B-S01 row 3) | `ChildSwitcher`, one store write | Kept: two doors to one function, the same component. Not duplicated data |
| Quiet this book, Hide this book | D-02, X6, X8, R-IA-6 | none (a quiet book shows no slip, no prompt change) | B-S02 | `setChildQuiet` and `hideChild`; one reader `bookIsQuiet(child)` | Kept: the Book's menu and Me's book page (C-S15) are two doors to one state. B-S02 shows the state; it stores nothing of its own. The state is read by the planner, the prompt and the slip registry (BL-985, test T6); this area never infers it |
| Save a copy | D-01 | Slip rank 3 (C-S06) | none | `SaveCopyOffer` and one `lastExport` status (area C) | The Book has no door to Save a copy and this pass adds none. The only export-adjacent door in this area is the print row of B-S02 (`.printOn`, off in 1.0), which opens PRT-S01 |
| Go to a month | none | none | The band button at default sizes; folded into B-S02 from AX3 | B-S01 | One door per size, never both at once |
| Find | none | none | The band or the inline bar, never both (NS-02-R1) | B-S06 | Unchanged |
| Read together | none | none | The band button (whole book) and year rows in B-S07 (one year) | B-S19 | Two entry scopes to one screen, not two screens. The letter page carries none |
| Letter day | none | none (the dateline is today) | B-S08 row 1, B-S09 | `DateSheet` | The same sheet as A-S08: two doors, one component |
| Plan and Plus | D-09 | The Plus line | none (T2: nothing in this area is behind Plus) | billing | Unchanged: the Book never shows a Plus line |
| Month and birthday lines | 5.4 | none (they are reminders) | Month openers | the age function | Unchanged: Home carries no month line, so the Book's openers are the only month heading |
| A day the parent chose | D-10, NS-46, RV-6 | Slip rank 2b, the one way a day shows | nothing | The days store, read only by Home and the planner | Section 12: a day never shows in the Book |
| Counts | G-07, DAT-03 | none | The Months sheet's built month lines (facts) and Read together's VoiceOver position | the Months sheet | Not extended: year rows, openers in a lens, Find, Firsts carry none |
| Recently deleted | none | none | The Undo toast after a delete | C-S17 | The Book owns the Undo (by tap), Me owns the list; the letter's data has one owner (NS-36) |

Duplications removed by this pass: (1) the second letter-card component (`ResurfacedCard`); (2) three ways to trim a fragment; (3) the screen-local age wrappers; (4) a Home preference sitting among writing settings; (5) any chance of a second "on this day" surface in the Book; (6) the possibility of "Go to a month" in both the band and the menu. Not removed because they are doors, not duplicates: the Quiet and Hide doors, the two switchers, the two Read together scopes.

## 12. Days in the Book: the decision, and how a picture letter reads

### 12a. A day the parent ticked or typed does not show in the Book, anywhere

Decision: the Book, the letter page, Find, the lenses, Read together, the Months sheet, the past letter and the export show no library day and no typed day: no label on a card, no mark on a month opener, no "a day you chose" row, no filter, no lens, no count, no link from the day slip. The Book stays exactly the same with the days store on, off or cleared (`B-S01.dayToday` is `.default`). B-S24 records this.

Why, from the final pack:
- One way for a day (RV-6, NS-50-R4): a day shows as one slip on Home and nowhere else. A second rendering in the Book would be a second way.
- No look-back and no trace (NS-46-R22, NS-47-R5): a day reminder never shows what the parent wrote on that day before, and a day leaves no trace in the synced row (`entries.prompt_key` never carries a day). A day label on a Book card would be that trace, read back.
- Faith and origin stay on the phone (NS-47-R1, R4, R6, R15): the days store is local, outside the backup, never exported or synced. The Book is read by the other parent and goes into Save a copy and the printable book. A day mark on a letter would copy a faith day into data that travels.
- The Book is the parent's words (the constitution): a day we suggested is not something the parent said.
- A letter written on a ticked day is not marked as written about it. A parent who writes on Thanksgiving gets an ordinary letter with its date, and may say "Thanksgiving" in their own words, which Find then finds like any word.
- The "on this day" look-back belongs to NS-23 and NS-31, not to the days card (NS-46-R22). It stays one slip on Home (B-S17).

Surface by surface:

| Surface | Shows a day? | What it shows instead |
|---|---|---|
| B-S01 card, month opener, sealed card | No | The letter's own date and words, as always |
| B-S03 lens choice | No `Days` option | Months, Photos, Firsts only |
| B-S06 Find | No | Only the parent's own words and typed photo words, label and place (NS-02-R5); the days store is not an index source |
| B-S07 Go to a month | No | Months and years of the child |
| B-S08 "This letter" | No row | Day row 1 is the day the letter is about (NS-15), a fact the parent set |
| B-S17 past letter | Never names or ranks by a day | Chosen by matching today's calendar date against letter dates (NS-23); the days store is not read |
| B-S19, B-S20 | No | Words only |
| Day slip (Home) | Yes, Home only | Non-interactive; it never opens the Book (a day reminder routes to Home, NS-46-R32) |
| Quiet day (Memorial Day, Veterans Day) | Home only | The Book is unchanged; the quiet line replaces the prompt block on Home (RV-7) |

Alternatives considered and refused: a day label on a letter card; a "Days" lens; a letter-page row "A day you chose"; a Find filter by day; choosing the past letter by a ticked day; a Book line on the day itself. Each adds a second place for one fact and a way for the days store to leave the phone or be inferred from a letter.

Cost, accepted: a parent cannot browse the Book by the days they chose. They keep months, years and Find for their own words. Test (design check, for `qa`): render B-S01, B-S08 and B-S17 with the store empty, with a day ticked today and with a quiet day today; the trees are identical except Home's slip.

### 12b. How a picture letter from NS-49 reads

A letter that began from Start from a photo, from "Pick from recent days" (Apple's suggestions picker) or from "Add a photo" on its page is one thing: a letter with one stored copy of a picture (NS-49-R2, R13). Nothing records how it started, so nothing in this area can show it.

| Surface | What a picture letter shows | What it never shows |
|---|---|---|
| B-S01 card (Months) | The ordinary card; the 72 pt list copy only in the Photos lens (NS-01-R11) | A mark, glyph or kicker for "from your phone" or "from a suggestion" |
| B-S04 Photos lens | Every letter with a picture, newest first, however it began | A group, ribbon or count for suggestion pictures |
| B-S08 page | The picture above the words (fit, uncropped), the parent's photo words and place under it if the parent typed them; row 3 "Photo" | Apple's title as a label, a "From your phone" caption, a suggestion date, a place Apple knew |
| Photo words that began as Apple's title | Only when the parent tapped "Use this" at capture; then they are the parent's own photo words, edited like any (NS-49-R9) and read as the picture's VoiceOver label (NS-01-R21c) | Any marker that they came from Apple |
| B-S06 Find | Finds the parent's photo words and place like any typed words | Apple's title never ranks or indexes unless taken; no picture content is read |
| B-S17 past letter | The fragment of the parent's words only | The picture, a thumbnail, its words or its place (NS-49-R3) |
| B-S19 Read together | Words only, as built (see Q-B3) | A picture, a caption |
| Share and export | Byte-identical to a level 1 letter (NS-49-R13) | Suggestion metadata |
| Switcher snapshot, App lock up | An opaque box where the picture would be (NS-01-R13a) | The picture |
| A suggestion with no photo item | A letter with no picture; reads as any typed or spoken letter | A line about what was left out |

States: no new state. `B-S08.withPicture` and `B-S04.default` cover every picture letter. The words "photo" and "picture" stay as the glossary has them; "journal" never appears (Q-FD-34). Flagged, not resolved: once "Use this" has copied Apple's title into `photo_text`, a reader cannot tell it was Apple's text and not the parent's; design-systems F49-4 asked Karma whether that is acceptable under the constitution reading (section 14, Q-B2).

## 13. Function needs accounted for (FUNCTION-TRACE section 6.2)

Each design-needs row the trace assigns to area B, with where it is designed or an explicit gap. Rows are by FR id; "pending ruling" means the trace marks it "needs Karma ruling" and this file uses its default until then.

| FR | Screen and state | What changed or why nothing did |
|---|---|---|
| FR-MKT-12 | B-S11, B-S04 (A-S03) | No screen change. A store frame shows an illustrated or licensed picture with a rights record in `docs/store/art/`, never a family's photo; the prototype draws shapes only. Gap: the art itself is marketing's, not drawn here |
| FR-MKT-13 | B-S01, B-S05, B-S06 | No count appears on B-S01 openers, B-S05 or B-S06 by construction (month openers carry no count line; the count line lives in the Months sheet B-S07). Rule for frames: never frame B-S07's month lines, or crop above them. No state added |
| FR-MKT-23 | B-S01.ratingMoment (new state) | Drawn as a state with no UI of ours, and the exclusion list as the table below. Not built; P1 (b); pending ruling |
| FR-MKT-24 | B-S17, B-S18 | Both are fixed slip kinds; no promotional, What's New, rating or "try this" slip type exists or is drawn. Added to B-S17 Never and to the registry rule (BL-963 holds the closed list) |
| FR-MKT-03 | B-S19, B-S20 | Frame 5 is B-S19.dark; the year title "Asha's first year" is allowed and drawn; B-S20.endOfYear has no recap and no "year in review". The FAQ rewrite is content's |
| FR-DAT-03 | B-S19, B-S20, B-S07, B-S01 | Rule 3 holds: no ordinal or total. Year rows no subtitle; lens openers no count. The one allowed number is Read together's VoiceOver "Letter n of m" (a position, not a total) |
| FR-PRV-22 | B-S08.fromNameFixed, `.fromNameChange` | Both branches drawn; the plain-line branch is the default until Karma rules (engineering: `author_signs_as` is insert-only today). Pending ruling; words are content's |
| FR-PRV-16 | B-S11.words, B-S12.labelSheet, B-S08.fromNameChange, B-S08 words sheet, B-S06 field | No visual change. Each field's spec states "Writing Tools: off" (table below), so a component swap cannot lose it. If React Native cannot switch it off the field ships with the recorded finding (BL-962) |
| FR-LEG-06 | B-S13, B-S16, B-S22 | B-S13 gains a fourth footnote line (never sent to anyone while hidden); no age preset; a date only. B-S16 and B-S22 hold no words and no countdown (already). Counsel reads |
| FR-LEG-07 | B-S13 | The picker's bounds (tomorrow to the 25th birthday) are drawn; the minors question has no number yet. Gap: counsel's number, not design's |
| FR-CMP-07 | B-S13 | AX5 with Bold Text and VoiceOver order are drawn in B-S13 and walked in section 7; no link or agreement text sits on it, so nothing can truncate or need a link role. The other screens in that row are other areas' |
| FR-CMP-08 | B-S11, B-S12, B-S15 | The untimed way back is on the page itself: "Add a photo" returns when a photo is off, the first switch is always there, and a deleted letter has Recently deleted. Added in B-S11.undo and B-S12.undo. The reviewer's reading of T4 against WCAG 2.2.1 is still open |
| FR-SEC-22 | Every screen here that shows letter words | `.backgrounded` is now a common state of this area (section 2) and drawn blank in the prototype for B-S04, B-S08, B-S17 |
| FR-LOC-13 | B-S01, B-S08 | Gap with a default: reading screens carry no extra line (a line on every read would nag); the frame stays English at 1.0 and the letters' words keep their script and direction. The honest "the app is in English" line belongs to Save a copy, the printable book intro and Me help (area C) and the listing. Q-B5 |
| FR-LOC-15, 16 | B-S04, B-S05, B-S08, B-S17, B-S19, B-S06 | Hindi: the letter words keep Tiro Regular under Bold Text (Foundations Q3); the fragment cut (ExcerptFade, Find sentence, past letter) never falls inside a conjunct or after a virama; line height holds the taller marks to AX5. Arabic and Chinese face choice and its file-size cost: gap, not decided here (Q-B6, default system faces) |
| FR-LOC-17 | B-S01 card, B-S05.rtlLabel, B-S06.rtlRow, B-S07, B-S08, B-S17, B-S19 | One `.rtl` state per listed surface, each drawn once. Gap: only B-S05.rtlLabel and B-S06.rtlRow are drawn today; the rest are listed, not yet drawn. Added to the states list; the walk is a device row. Interface stays left to right; letter paragraphs use automatic direction; the child's name in a year label sits in Unicode isolates |
| FR-AIS-08, FR-AIS-56 (the trace row without an id) | B-S08.otherParent | The "Exactly as said" and "With small fixes" view switch is the author's only; absent for the other parent. Added to the states |
| FR-RSH-07 | B-S12, B-S13, B-S14, B-S16 | The concept walk is B-J09 and B-J10 in the prototype with the limit lines shown as drawn. No change |
| FR-QAL-09 | B-S11, B-S12, B-S15 | The undo seconds, in one table below |
| FR-PRT-06, FR-PRT-16 | B-S02.printOn, PRT-S01 | Entry row drawn (absent when the flag is off). Gap: PRT-S01 is not drawn here (P2 gated, nothing in 1.0, FR-PRT-01) |
| FR-PRT-05, 07 to 15 | PRT-S02, B-S08 | Gap: PRT-S02 is not drawn here. The return path is: a change to a letter from the preview goes to B-S08 and back, and the preview rebuilds (FR-PRT-14); no new B-S08 state is needed |

FRs the trace names for this area with no design-needs row (6.2.2): FR-LEG-01 (B-S11: the policy line is legal's, no visual change), FR-LEG-08 (B-S12, B-S13: the notice at the place of collection is the limit lines and label help already drawn), FR-AIS-07 (B-S08 typed words: no machine edit, no suggestion; the words sheet has no assist control), FR-AIS-31 (the dotted marks are Review's, A-S07; B-S08 shows none), FR-AIS-55 (the writing tools table), FR-RSH-11 (B-S04, B-S06: no change; study stand-ins are labelled), FR-QAL-08 (glass: section 4a holds the three-surface budget and the solid fallback for every glass surface here).

The rating request (FR-MKT-23), exclusion list, for the `.ratingMoment` state:

| Never called | Why |
|---|---|
| First run, the first kept letter, capture, Review, after Let it go | Not a calm moment; not the parent's own act yet |
| A session where the Keep gate showed (E-S10) | Never beside Plus |
| A notification landing, a seal-opened day (B-S18), Read together (B-S19), the Months sheet | The moment is theirs |
| After deletion, erase, sign-out, a plan lapse, any error line | Never at a bad moment |

The undo windows of this area, in one table (FR-QAL-09; the seconds are the cards'):

| Surface | Undo | Window |
|---|---|---|
| B-S11.undo (photo changed, taken off) | by tap | 10 seconds, or VoiceOver's reading plus 10, whichever is later; Switch Control: until the parent moves on (NS-01-R38a to R38c) |
| B-S12.undo (first unmarked) | by tap | the same (NS-06-A2b) |
| B-S15.undo (letter deleted) | by tap | no timer; until dismissed or the screen changes (B V-1, G-13) |

Writing Tools: off, field by field (FR-PRV-16): B-S11.words ("Words about this photo", "Where was this?"); B-S12.labelSheet ("In your words, if you like"); B-S08.fromNameChange (the From name); B-S08's words sheet; B-S06's Find field (autocorrect, spell check and suggestions are off already, R14).

## 14. Card gaps added in v2, contradictions flagged, and open design questions

Card gaps (id, card row, what is missing, proposed default). Marked "pending ruling" in the screen states until ruled.

| Id | Card row | What is missing or unclear | Proposed default |
|---|---|---|---|
| G-14 | NS-50-R4 vs A-S01 and B-S17 | The slip slot is "directly above the prompt block" (NS-50-R4) while A-S01 and the past-letter card sit after "Another thought" | One position for the slot; this file follows A-S01's final drawing and draws none of its own |
| G-15 | NS-23, NS-46-R22 | Whether the past letter may avoid a letter written on a day the parent chose | No: it never reads the days store (section 12a) |
| G-16 | NS-49-R9 | After "Use this" Apple's title is indistinguishable from the parent's words | As the card: it becomes the parent's own text (Q-B2) |
| G-17 | NS-24, NS-01 | Whether Read together shows a picture | Words only, as built (Q-B3) |
| G-18 | FR-PRV-22 | Change the From name, or a plain line | The plain line (`.fromNameFixed`) |
| G-19 | FR-LOC-13 | Where the honest "the app is in English" line shows on reading screens | None on reading screens (Q-B5) |
| G-20 | NS-06-B4, B W-G13, NS-50-R7 | The seal-opened line's "Not now" uses `en.common.notNowButton` (W-G13) while NS-50-R7 reserves that key for the Days ask | Content rules one key; until then the seal line has its own key (Q-B4) |
| G-21 | NS-21, IA-AUDIT D-06 | "Past letters on Home" sits among writing settings in C-S01 | Moves to "Days and reminders" after T1 (B-S21) |
| G-22 | FR-MKT-23 | There is no Book state for the request | `.ratingMoment`, no UI of ours |

Contradictions with a product ruling, flagged and not resolved:
1. NS-50-R4 (slip directly above the prompt) against A-S01 and this area's earlier drawing of B-S17 (below "Another thought"). Karma and area A to settle; G-14.
2. B W-G13 (the seal-opened line carries `en.common.notNowButton`) against NS-50-R7 (that key stays the Days ask's answer). G-20.
3. IA-AUDIT D-02 and R-IA-6 keep Quiet in the Book's end menu, but BL-938 and BL-985 still place it only in Me (E-01); the cards win, as ruled.
4. NS-49-R9 stores Apple's title as the parent's text with no marker; privacy and design asked whether that holds under the constitution reading (F49-4). Not mine to rule.
5. B G-12 now says the seal action is absent until a day is chosen; the prototype and v1 drew it disabled. Changed here to follow the ruling.

Open design questions, each with the default this file uses:

| Id | Question | Default |
|---|---|---|
| Q-B1 | Where does the past letter sit in the single slip slot: above the prompt (NS-50-R4) or below "Another thought"? | Wherever A-S01 draws the slot, for every rank alike CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-105: Defaults stand; Q-B15 resolved by Q-PM-3 Variant A (file held on phone) |
| Q-B2 | Is Apple's title, once taken by "Use this", fine as the parent's own words with no marker? | Yes (as the card); privacy and Karma may reverse CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-035: Never without Use this; once taken it is the parent's own words, no marker; privacy may reverse |
| Q-B3 | Should Read together show the picture? | No: words only, as built; a later row if parents ask CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-105: Defaults stand; Q-B15 resolved by Q-PM-3 Variant A (file held on phone) |
| Q-B4 | Which key does the seal-opened line's "Not now" use? | Its own key, until content rules CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-105: Defaults stand; Q-B15 resolved by Q-PM-3 Variant A (file held on phone) |
| Q-B5 | Is a line about the app being English wanted on reading screens for a non-English book? | No: Save a copy, the printable intro, Me help and the listing carry it CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-105: Defaults stand; Q-B15 resolved by Q-PM-3 Variant A (file held on phone) |
| Q-B6 | Which face for Arabic and Chinese, at what file-size cost? | System faces; no bundled face until the cost is stated CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-105: Defaults stand; Q-B15 resolved by Q-PM-3 Variant A (file held on phone) |
| Q-B7 | Should the Book offer any way to find letters by a day the parent chose? | No (section 12a); reopen only if NS-31 reopens CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-105: Defaults stand; Q-B15 resolved by Q-PM-3 Variant A (file held on phone) |
| Q-B8 | Does "A book to hold" in B-S02 stay under Quiet and Hide, or lead? | Under them; the Book's first jobs are Quiet and Hide CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-105: Defaults stand; Q-B15 resolved by Q-PM-3 Variant A (file held on phone) |
| Q-B9 | Does the Months sheet keep its month lines (facts) given FR-DAT-03? | Yes (B G-07 ruled CARD); no new count anywhere CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-105: Defaults stand; Q-B15 resolved by Q-PM-3 Variant A (file held on phone) |
| Q-B10 | A hidden letter's day in Recently deleted: show the day or only "Hidden"? | Show the day and no words (as NS-06-B25) CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-105: Defaults stand; Q-B15 resolved by Q-PM-3 Variant A (file held on phone) |

---

## 15. Round 2 additions (20 Nov, founder direction 26: photo moments, several pictures and videos with a letter)

Source: `docs/product/prd/26-founder-direction-photos-library-and-media.md` (committed f8eead016). Cards NS-51 (photo moments, level 3) and NS-52 (pictures and videos with a letter) are being written in `27-photo-moments-and-media.md`, which did not exist when this was written, so rows are keyed by card name and the direction's own proposals: up to 6 pictures and 2 videos per letter, video up to 60 seconds with a size cap, no transcription of a video's sound by default, no generated description, no place names by default, the founder confirms. Every id below is PROPOSED and flagged; every number is the direction's default, not a decision. Where 27 lands with different rows or limits, this section is re-keyed and the limits follow it. Nothing here changes a card, and the constitution binds: no caption, title or story from a picture, ever.

What this area owns: reading and playing the media of a letter, the Photos lens, taking media off, deleting a letter with its media, what the Book never does with moments, and the Book's half of Save a copy and Share. Capture, the moments invitation and the picker are area A; Save a copy and export are area C; Share is area D.

### 15a. Reading several pictures and videos with a letter (PROPOSED B-S25, B-S26)

The letter page (B-S08) is still one list. Layout, default: where a letter holds media, they show above the words in the order the parent added them, one `PhotoFrame` per item in a single vertical stack at the page's width (fit, uncropped, `radius.md`, hairline frame in dark, Smart Invert ignored; NS-01-R40, R41). There is no carousel, grid, collage, slideshow or "highlight": a parent reads a letter top to bottom. A video shows its poster frame (a still of the file) with a Play button of 44 pt or more and the system player's own controls once started; it never autoplays and never loops, with or without Reduce Motion. Photo words and place (typed by the parent) sit in `footnote` under the item they belong to, verbatim.
- Layout, AX5 with Bold Text on an SE 3: the same single column; each item fits the width up to 60 percent of the screen height; the Play button stacks under the poster only if it cannot sit on it with a 44 pt target; nothing truncates.
- VoiceOver order: dateline (heading 1), each item in added order (a picture: the parent's photo words if any, else the fixed phrase "Photo with this letter"; a video: the parent's words if any, else "Video with this letter"), the words, Play for the recording, Share, "This letter" (heading 2), rows, Delete. Position inside one letter ("Photo 2 of 4") is a position, not a total; it is the same kind of line as Read together's "Letter n of m" and needs Karma to extend rule 3 to it (section 15f, Q-B11). Nothing is ever described from the picture: no scene, person, place or mood words (constitution; FR-AIS-53).
- One audio at a time: starting a video pauses the letter's recording and the reverse. A video's sound plays only after a tap; the silent switch is the system's.
- Row 3 of "This letter" becomes the media row: "Add a photo or video" (words by `content`) for the author. At the limit the row is absent (NS-21-R2), with one calm `footnote` line in its place saying the letter holds as many as it can (words by `content`; no number); Q-B12 asks if that line is wanted.
- States (PROPOSED): `B-S08.withMedia` (two or more items; `.withPicture` stays the one-picture state), `.withVideo`, `.videoOnly` (a letter with a video and no picture), `.mediaDownloading` (an iCloud-only item: one still line "Getting it from iCloud." with Cancel, no moving indicator, no spinner), `.mediaOffline` (one calm line; the letter unchanged), `.mediaMissing` (as photoMissing: "Not on this phone any more" and Remove, per item), `.mediaTooLarge` or `.mediaTooLong` at the add step (area A owns the wording; the item is not added and the letter is unchanged), `.mediaNotStored` (R58's line, per item), `.otherParentMedia` (shown if on this phone, no controls; no slot if it is on another phone), `.newPhone` (no slot unless media sync, Q-PM-3), `.backgrounded` (every picture and poster is an opaque `surface` box; a playing video pauses and its frame is blanked), `.lowPowerMode` (no poster decoding beyond the visible items), `.reduceMotion` (no change: nothing here moves).
- The viewer (PROPOSED B-S26, extends B-S11.viewer): a tap on an item opens the full-screen viewer on black, Close at top right, Change and Take off (author only) in a bottom bar; swipe or Back and Next controls of 44 pt move between this letter's items. No counter beyond the VoiceOver position. A video in the viewer uses the system player. Controls are clear glass over a local 35 percent dim; the media is content (section 4a).
- Components: `PhotoFrame`, `LetterPhoto` (#839), `AudioPlayer` pattern for the one-audio rule, a `VideoPoster` (PROPOSED, new, justified: no existing component draws a poster with a Play target; it composes `PhotoFrame`, `IconButton` and the system player), `ListRow`, `Sheet`, `Toast`.

The Photos lens (B-S04): a letter with one or more pictures or videos is one card with one list copy, the first item's. No "+3", no stack of thumbnails, no badge: that would be a count (rule 3). A video's list copy is its poster with a quiet Play glyph (a shape, never colour alone, hidden from VoiceOver; the card's label says "Video with this letter" where the first item is a video). A letter with only a video appears in the lens; whether the lens is still named "Photos" is content's (Q-B13; default: "Photos" until content rules, because a lens must keep one stable name per BRAND.md).

Adding, changing, taking off: B-S11 holds. "Take off" and "Change" act on the item the parent tapped, one at a time; each Undo is the 10 second T4 window per item (NS-01-R38a), and the untimed way back is the media row (FR-CMP-08). Reordering is not offered; the order is the order added (Q-B14).

### 15b. Delete, Recently deleted and erase, with media (B-S15, B-S22)

- B-S15.confirm gains one intent line when the letter holds media: its pictures and videos wait in Recently deleted with the letter and go when it goes (words by `content`; no count). Keep it stays the default.
- Delete moves the letter, every picture and video, the first, the seal and the Find row together (NS-36-R1b); Undo by tap brings all of them back. B-S22 (Recently deleted, area C's screen) shows a letter with media as it shows any: the date and "Kept here until {date}", Restore and Erase now; sealed letters show no words and no media.
- Erase now, Erase everything, sign-out and account deletion remove the media files and the list copies from the phone and, if media sync (Q-PM-3), from the server; those lines are area C's (C-S19, C-S20). In this area the only check is that no item or poster survives in a snapshot or a cache after deletion.
- A taken-off item stays on disk only until its Undo window closes (as B-S11.undo).

### 15c. Save a copy, export and Share with media (the Book's half)

The letter page has no export row and this pass adds none (section 11). What the Book must hold true for areas C and D: a media item that is on this phone is in Save a copy and is byte-identical however it began (NS-49-R13 extended), the copy's "What is inside" is words with no numbers (FR-DAT-03), video is not printed (direction 26 section 2), and Share on the letter page (area D's sheet) says in plain words what goes with a letter before it goes. Open for C and D: whether Share sends media and whether a video is a file in Save a copy or a note that it stays on the phone (Q-PM-3, Q-B15). B-S08 draws Share as it is and waits for their answer.

### 15d. How photo moments avoid duplicating Home (NS-51)

NS-51 invites the parent, in the capture area of Home, to write the letter that goes with a moment: a day or a few hours with several of their pictures. That is a way to start a letter, so it lives on Home only (frame: only Home starts a letter) and must not appear in the Book:
- The Book has no "Moments" lens, no list of days with pictures that were not written about, no marker on a month for pictures that exist in the library, no count, and no empty state about pictures (NS-01-R10c; frame "never count gaps"). The Book's Photos lens shows only media attached to a kept letter, never the library.
- Moments are not a slip. Like the picture start of NS-49 they sit in the capture cluster (one start, not two: Start from a photo and any moments entry are the same control, IA-AUDIT section 6), so the slip registry (ranks 1, 2, 2b, 3, 3b, 4) is unchanged and the past letter never competes with a moment.
- The past letter (B-S17) never uses, shows or ranks by a library picture or a moment; it is chosen by the letter's own date (section 12a).
- After a letter is written from a moment, the Book shows an ordinary letter with its attached media and no mark of how it began (section 12b extended: no "from a moment", no album name, no place, no library date).
- A lock-screen nudge for a moment is a budgeted class (NS-32) and a tap routes to Home; it never opens the Book.
- The one place the two meet is "Add a photo or video" on the letter page: it opens the same picker as Home's start, so a parent finds one way to add media and the Book never holds a library browser of its own.

### 15e. Function needs and boundaries for round 2

Mapped to the functions' round 2 addenda when they land: privacy (backgrounded and Smart Invert states above; the App Privacy label and permission strings are not screens here), legal and compliance (counsel's read of a child's video leaving the phone; WCAG 1.2 captions for a family's own video are UNVERIFIED and not decided here, Q-B16), security (a malicious or oversized file is refused at add, not at read; the Book never shows a file name, EXIF or GPS), reliability (iCloud-only and offline states above; no spinner loops), languages (every new string is a PROPOSED key in all packs), print (video not printed; a poster frame in print is the parent's choice at print, not the Book's). Gaps: none of these are drawn beyond what is above because the cards are unwritten.

### 15f. Round 2 open design questions (each with a default)

| Id | Question | Default |
|---|---|---|
| Q-B11 | May "Photo 2 of 4" inside one letter be spoken, as Read together's "Letter n of m" is? | Yes, as a position; Karma extends rule 3 CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-105: Defaults stand; Q-B15 resolved by Q-PM-3 Variant A (file held on phone) |
| Q-B12 | At the media limit, is a calm line wanted where the row was? | Yes, no number CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-105: Defaults stand; Q-B15 resolved by Q-PM-3 Variant A (file held on phone) |
| Q-B13 | Does the Photos lens keep its name when videos join? | Keep "Photos"; content may rename CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-105: Defaults stand; Q-B15 resolved by Q-PM-3 Variant A (file held on phone) |
| Q-B14 | Can the parent reorder media? | No; added order CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-105: Defaults stand; Q-B15 resolved by Q-PM-3 Variant A (file held on phone) |
| Q-B15 | Does Save a copy hold the video file, or only say it stays on the phone? | Area C and the founder (Q-PM-3); the Book assumes the file is held when it is on the phone CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-105: Defaults stand; Q-B15 resolved by Q-PM-3 Variant A (file held on phone) |
| Q-B16 | Do a family's own videos need captions under WCAG 1.2 for this private app? | Not drawn; compliance reads; the video's sound is not transcribed (Q-PM-4 default) CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-049: No; compliance reads WCAG point |
| Q-B17 | Does Read together show media? | Words only, as Q-B3; a later row CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-105: Defaults stand; Q-B15 resolved by Q-PM-3 Variant A (file held on phone) |
| Q-B18 | Moments inside the Book, as a lens? | No (section 15d) CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-105: Defaults stand; Q-B15 resolved by Q-PM-3 Variant A (file held on phone) |
