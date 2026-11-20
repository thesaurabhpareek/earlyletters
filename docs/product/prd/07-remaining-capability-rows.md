# NS-07: Remaining rows of the capability map (NX-42): quiet days (C5), the printable book (C28), the label guard (G11), and what is cited or parked

Status: CURRENT (LOCKED rev 2) | 20 Nov 2026 | Owner: `product` (CPO role) | Replaces: none | Load when: building or testing NS-07 (C5, C28, G11).

Status detail: Locked v1.0, 20 Nov 2026 (council round 2). Changes after lock need a PR that lists every changed id.

Author: `product` (CPO lens). Rank 7 of 7. Index: `README.md`. Earlier: Draft v1, 11 Nov 2026. Ruled 20 Nov (Karma, council round 2): T2, T3 (stored copy), T4, T5, D2, D3, D13.

Source: `docs/roadmap/next/03-requirements/NX-42-capability-map.md` on branch `docs/nav-tabs-requirements-10nov` (head `d80db1f2`), rows C1 to C46, and the gaps G1 to G11 in `FEATURE-GAP-AND-WEDGE-10nov.md`. Requirement files named as "cited" were not all opened; each such cite is UNVERIFIED for content where marked. Several live on branches, not on `develop`. Code facts below were read on `develop` at `697233d35` on 20 Nov 2026.

This file holds three specified cards (C5, C28, G11), each with the full card shape and its own `**Label effect.**` line, plus the disposition table and the parked rows.

## 1. How each row was handled

- Cited: a requirement already exists. No new text. The citation is the deliverable.
- Specified here: a card follows (sections 3, 4 and 5).
- Parked with a default: not specifiable now. Section 6 says why and what would reopen it.

## 2. Disposition of every row

| Row | Capability | Outcome | Where |
|---|---|---|---|
| C1 | Capture | Cited | F04 |
| C2 | Review and faithful edit | Cited | F06 |
| C3 | Waiting drafts and held letters | Cited | F04; F14-REQ-041 |
| C4 | Prompts and Another thought | Cited | F13 |
| C5 | Not much today | Specified here | section 3 |
| C6 | Age and stage | Cited | F03, F12, F13-REQ-003 |
| C7 | Catch-up letters | Cited (branch) | NX-27, on `docs/execution-tracker-8nov`; UNVERIFIED on `develop` |
| C8 | Memories on Home | Cited (branch) | NX-43, R1 to R14; NS-23 replaces the built "A month ago" card |
| C9 | Plus line on Home | Cited | F14-REQ-040 |
| C10 to C12 | Book by month, letter page, Read together | Cited | F09, F08, F10 |
| C13 | Find | Specified | NS-02 |
| C14 | Firsts | Specified | NS-06 Part A |
| C15, C16 | Several books, hide and delete | Cited | F12, F17, NX-04 |
| C17 to C19 | Photo, date and place chips, library chooser | C17 specified; C18, C19 cited | NS-01; NX-39 P1, P2a |
| C20 to C22 | Suggested days, video, occasions | Cited | NX-39 P2b, P3, P4a |
| C23 | Co-parent sharing | Cited | F11; NS-25; the co-parent backlog rows |
| C24 | Shared voice, close family | Parked | section 6.1 |
| C25 | Plus | Cited | F14; `08-plus-and-billing-trust.md` |
| C26 | Gifts and lifetime | Parked | section 6.2 |
| C27 | Export everything | Cited | F15 |
| C28 | A printable book file | Specified (structure; layout numbers wait for proof books) | section 4 |
| C29, C30 | Backup, sync and new phone | Cited (branch) | NX-34; F16; NS-08, NS-10 |
| C31 to C36, C38 to C42 | Account, lock, privacy, delete, safety, languages, dictionary, reminders, appearance, analytics | Cited | F02, NX-31, NX-32, F17, NX-08, F20, F07, F13, NX-35, F18 |
| C37 | Help, support, legal | Cited (branch) | F20; NX-16; UNVERIFIED content |
| C43 | App-interface localisation | Parked | section 6.3 |
| C44, C45, C46 | First run, store and web, alerts and switches | Cited | F01, F03, NX-31, NX-40, F21, NX-24, NX-17, F19 |
| Share one letter | (new row, NAV-TAB-ROLES G-3) | Specified | NS-05 |
| Sealed letter | PRD F41; research gap G5 | Specified | NS-06 Part B |
| Quick capture | Research gap G6 | Specified (conditional) | NS-04, NS-06 Part C |
| G7 | Weekly list for family | Parked | section 6.4 |
| G8 | Choose who sees each letter | Parked | section 6.5 |
| G9 | Bring letters in from another app | Parked | section 6.6 |
| G10 | Gifts | Same as C26 | section 6.2 |
| G11 | The privacy label as a release gate | Specified | section 5 |

---

## 3. C5: "Not much today" (a quiet day, a requirement for what ships)

The behaviour is built (EVIDENCE: `components/book/quiet-day.logic.ts` `newQuietMark`, `markOn`, `visibleInBook`; Home's `keepNotMuch` and `undoNotMuch` in `app/(tabs)/index.tsx:226-236`; strings `notMuch.button`, `notMuch.savedToast` "A quiet day, kept.", `notMuch.undo`, `book.quietDay.label` "A quiet day" in `packages/content/src/strings.en.ts:330-336, 543-545`). This card turns D-084 into testable rows; each test is new until a trace shows an existing one.

### 3.1 Who and when

A parent at the end of a day with nothing to say, or no energy to say it, who opens Home and wants the day to count as part of the book without words and without guilt.

### 3.2 Why

- Job: "I go to Home on a quiet day to mark the day without words, so that the book has the day and I feel no pressure."
- What goes wrong without it: the parent either forces a sentence or closes the app feeling they missed a day; both are the gap-counting the constitution forbids.
- Evidence: D-084 (founder decision); built.

### 3.3 What, and Not in scope

What: one tap on "Not much today" on Home (a capture mode of Home's one entry, `startCapture({ source: 'notMuchToday' })`, rule P1) stores a mark with no words, no recording and no sentence, for the active book and today's local date. The Book shows "A quiet day" with the date, unsigned, only on a day with no words (`visibleInBook`). Undo is offered in place.

Not in scope: any sentence the app writes for the parent; a count or run of quiet days; a quiet day in Read together, print, Find, Share, Firsts, seals or Home memories; a picture on a quiet day; a quiet day shown to the other parent.

### 3.4 Happy path

1. On Home, the parent taps "Not much today" (VoiceOver hint: "Marks today without writing anything.").
2. Within 100 ms the link fades and the line "A quiet day, kept." with Undo appears in place; a soft haptic; VoiceOver announces the line.
3. The parent leaves Home; the Book shows "A quiet day" on today's date if today has no words.
4. If the parent later keeps a letter today, the quiet-day row stops showing (the day has words).

### 3.5 Unhappy paths and edge cases

| Case | Behaviour |
|---|---|
| A second tap the same day in the same book | No-op; no second mark (`markOn`) |
| Two phones of the same author tap on the same day | Two rows may reach both phones by sync; the Book shows at most one quiet-day row per author, book and local day (C5-10) |
| Undo | The mark is deleted (tombstoned like any entry) and no row shows (C5-6) |
| Words kept later the same day | The quiet row hides (C5-11) |
| Two books | The mark goes to the active book only (C5-7) |
| Local save fails | The standard save error; Home stays; nothing half-written |
| A time zone change after tapping | The mark keeps its `occurred_on` date; it never moves |
| The other parent | Never sees it: the mark is saved with `inBook: false` and is not served through `book_entries` (C5-8) |

### 3.6 Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | The link is present on Home from the first day; no explanation sheet |
| Empty | A book with no letters can have quiet days; the Book shows them by date, unsigned |
| Many (1,000 letters, 300 pictures) | No effect; `visibleInBook` is linear and unit-timed |
| Offline | Works; own rows sync later to the author's other phones |
| Slow | Saved and line visible within 100 ms (06-nfr 2.2) |
| Failed | Standard save error |
| Interrupted (call, Siri, alarm, the baby) | The mark is one write; the Undo line stays while Home stays |
| App killed mid-flow | Written in one transaction or not at all |
| App updated mid-flow | No change; old template sentences are never shown (`migrations.ts` blanks them; screens decide by `kind`) |
| Low storage (under 1 GB, under 50 MB) | Under 50 MB: the standard save error |
| Low Power Mode and low battery | No change |
| Two books | Active book only (C5-7) |
| Two parents | Each author's own; never shown to the other (C5-8) |
| Expecting parent (due date only) | A quiet day files into Before You by date |
| Multilingual (Devanagari, RTL, CJK) | No words; the date uses the device locale |
| AX5 and Bold Text on SE 3 | The link and the kept line wrap; Undo stays 44 pt and visible |
| VoiceOver | Announces "A quiet day, kept."; the Book row reads "{date}. A quiet day, kept." (`book.quietDay.a11y`) |
| Voice Control and Switch Control | "Not much today" and "Undo" are commands and scannable |
| Reduce Motion | The fade uses Reduce Motion's fade (`index.tsx:223-224`) |
| Dark mode and Increase Contrast | Tokens only |
| Plan lapsed | Works; a quiet day never counts toward the allowance |
| Signed out | Works on the local book (D1) |
| Second account on the same phone | Account B sees none of A's quiet days (C5-12) |
| New phone | The author's quiet days arrive with their own rows through sync |

### 3.7 Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-07-C5-1 | Given Home, When the parent taps "Not much today", Then the book stores a mark with `kind = 'not_much'`, `final_text` empty, no recording and no sentence; the Book shows "A quiet day" with the date, unsigned (D-084) | P1 | `[NS-07-C5-1] a quiet day stores no text` |
| NS-07-C5-2 | Given a quiet day, Then it does not count toward the allowance (D-083, D-103), cannot carry a picture (NS-01-R25), cannot be marked a first (NS-06-A6), cannot be sealed (NS-06-B10), cannot be shared (NS-05-R7), is not found by Find (NS-02) and is not a Home memory or past letter (NX-43-R9, NS-23) | P1 | `[NS-07-C5-2] a quiet day is outside every other feature` |
| NS-07-C5-3 | Given quiet days, Then no screen, notification, export file name or PDF shows a count or a run of them | P0 (a) | `[NS-07-C5-3] quiet days are never counted` |
| NS-07-C5-4 | Given Read together and any PDF book, Then quiet days never appear (D-084) | P1 | `[NS-07-C5-4] quiet days stay out of Read together and the PDF` |
| NS-07-C5-5 | Given one tap, Then the mark is written and Home shows the kept line with no dialog; a second tap the same day in the same book on the same phone is a no-op | P1 | `[NS-07-C5-5] one tap, no dialog, no duplicate` |
| NS-07-C5-6 | Given "A quiet day, kept." with Undo, When Undo is tapped while the line is shown (it stays while Home stays; T4 is met because the line has no timer), Then no quiet-day row shows in the Book for that day | P1 | `[NS-07-C5-6] Undo leaves no quiet day` |
| NS-07-C5-7 | Given two books, When the parent taps "Not much today", Then the mark goes to the active book only, one per book per local day | P1 | `[NS-07-C5-7] a quiet day belongs to the active book` |
| NS-07-C5-8 | Given two parents in one book, Then each author's quiet days are their own and are never shown on the other parent's phone (saved with `inBook: false`; not served by `book_entries`). Changed from the round-1 proposal of one unsigned row per author in a shared view, which the code does not do | P1 | `[NS-07-C5-8] the other parent never sees a quiet day` (SQL test plus phone test) |
| NS-07-C5-9 | Given consecutive quiet days, Then each renders as its own row with no run visual, connecting line or grouping | P0 (a) | `[NS-07-C5-9] consecutive quiet days are not drawn as a run` |
| NS-07-C5-10 | Given two marks by one author for one book and one local day (two phones), Then the Book shows one quiet-day row for that day (display rule; no data change) | P1 | `[NS-07-C5-10] two phones never show two quiet rows for one day` |
| NS-07-C5-11 | Given a day with a quiet mark and a kept letter or note, Then the Book shows the letter and no quiet-day row for that day (`visibleInBook`) | P1 | `[NS-07-C5-11] a day with words hides its quiet mark` |
| NS-07-C5-12 | Given account A signed out and account B signed in on the same phone, Then B sees none of A's quiet days (D1, X4) | P0 (a) | `[NS-07-C5-12] a second account sees no quiet days of the first` |
| NS-07-C5-13 | Given a tap, Then the mark is saved and the kept line is visible within 100 ms (06-nfr 2.2, F04-REQ-016) | P1 | `[NS-07-C5-13] a quiet day is kept in 100 ms` (component test) |

### 3.8 Non-functional budgets

| Line | Budget |
|---|---|
| Latency (p95 on SE 3) | Saved and line visible within 100 ms (C5-13) |
| Memory | No change |
| On-device storage | One row per quiet day, under 1 KB |
| Battery | Under the measurable step |
| Offline | Works |
| Accessibility | VoiceOver hint and announcement; AX5 wrap; 44 pt Undo; no timer on the Undo line |
| Localisation | Date from `Intl.DateTimeFormat`; no words to localise beyond the fixed strings |
| Privacy (log canary) | Nothing new logged |

### 3.9 State space

| Case | Expected | Test |
|---|---|---|
| Author's second phone | Receives the author's own quiet marks; display dedupe | C5-10 |
| Another member's phone | Never receives them | C5-8 |
| Second account on this phone | None of A's | C5-12 |
| Offline | Works; queues | C5-1 |
| Retry after a lost answer | One row per op id (existing push idempotency) | sync suite |
| Sign out | Stays on the phone (D1) | `[X4-R1]` |
| Account deletion | Purged with the author's entries | purge tests |
| Kill switch `serverFeaturesEnabled()` off | Local only | C5-1 |
| Remote pause | None: capture has no switch (LEGAL-REQ-040) | n/a |
| Plan lapse | Works; never counted | C5-2 |

### 3.10 Data and engineering

Existing fields only: `entries.kind = 'not_much'` (`scribe_core.sql:124`), `occurred_on`, `in_book = false`, `final_text = ''`, `raw_transcript = ''` (`quiet-day.logic.ts:16-33`). No migration, no sync change, no export change (export already carries `kind: not_much`; golden fixtures). Modules touched: `components/book/quiet-day.logic.ts` (C5-10 display dedupe by author, book and day), its tests. Flag: none (built). Error codes: none new.

### 3.11 Data inventory

No new or newly used data. The mark is an `entries` row (L3 date, no words), synced to the author's phones only, deleted with the letter rules, exported as `kind: not_much`.

### 3.12 Door lines

Records: the mark, on the parent's own row. No PRIV-R21 row, because this is a parent's own entry, not an agreement.

### 3.13 Threats

n/a because no trust boundary is crossed: the mark has no words and never reaches another person.

### 3.14 Never (rulings D2 and D3)

n/a for D2 because a quiet day has no text field. D3: no quiet day is donated to Spotlight, Siri or App Intents (`[X6-R1]`). The app never writes a sentence for the parent.

### 3.15 Design inputs

States: the link on Home; the kept line with Undo (light, dark, AX5); the Book row "A quiet day" with the date, unsigned; consecutive quiet days as separate rows. No new component.

### 3.16 Content inputs

Built strings stand. Banned: "you missed", "skipped", "only", any count, any streak or run word, any line implying the app wrote something.

### 3.17 Legal, privacy and compliance

None beyond D-084. **Label effect.** None: the mark is User Content already declared and carries no words.

### 3.18 Claims

Enables: "On a quiet day, one tap keeps the day without words." Forbids: any count, streak or "never miss a day".

### 3.19 Free or Plus

Free and never counted toward the allowance (D-083, D-103). Ruled 20 Nov (T2): free in 1.0.x stays free; public copy says nothing either way.

### 3.20 Measures with analytics off

None needed; it is built. Support tally category "a quiet day showed up wrong" (target 0).

### 3.21 Dependencies and gates

None; the rows are tests of built behaviour plus the C5-10 display rule.

### 3.22 Open questions

None.

---

## 4. C28: A printable book file (structure only; layout numbers wait for proof books)

Source: the exec record (Q2, Q4 rank 2): a print-ready export spec only (BK-13); proof from two print-on-demand services; a revenue decision no earlier than the BK-14 go/no-go and after the entity question. Print is a separate purchase outside Plus (closed X3). Nothing here sells, ships or promises a printed book (BRAND.md: "Not promised in v1.0"). Parent-facing name: "Printable book (PDF)" (PROPOSED). Changed 20 Nov: "print-ready" fails `packages/content/test/rules.test.ts` [K-32] (`PRINT` pattern at `:397-398`), while "printable" passes by that test's own case (`:411`). No exemption to K-32.

### 4.1 Who and when

A parent, often near a birthday, who wants a file a relative or a local print shop can turn into a paper book of the year, from what the family already kept.

### 4.2 Why

- Job: "I go to Export to get a file my family can print, so that a paper book can be made from what we kept."
- What goes wrong today: the existing PDF book (in the export ZIP, `book/<child>.pdf`, rendered at the device's paper size, `lib/export/device.ts:259-266`) is made for reading on a screen, uses the system font stack (`build.logic.ts:380`), and is not laid out for a print shop.
- Evidence: HYPOTHESIS for demand; exec record for the plan.

### 4.3 What, and Not in scope

What: one extra file on the Export screen, a printable PDF of one book, with embedded licensed fonts, the parent's pictures as their stored copies (ruling T3), and a provisional square page.

Not in scope: ordering, prices, a partner, a seller, shipping, a cover designer, a QR code, links, a page count, "pages left", any upscaling of pictures, any page about empty months, any generated caption, summary or highlights page.

### 4.4 Happy path

1. Me, then Export; the parent chooses "Printable book (PDF)" and a book.
2. A progress view shows while the file is made; the screen stays awake only while generating.
3. The file is written to the app's temporary folder and handed to the share sheet (save to Files, AirDrop, Mail).
4. The share sheet completes; the temporary file is deleted.

### 4.5 Unhappy paths and edge cases

| Case | Behaviour |
|---|---|
| Not enough space for the file | Export's disk check (F15-REQ-010) with the estimate; the screen says how much space is needed |
| App killed while generating | No partial file is left; the next launch's sweep removes temp files (C28-11) |
| A picture's stored copy is under 2,550 px on its long side | Used at its own size; no upscaling; no message about quality (C28-8) |
| A picture file is missing on this phone | The letter prints without it; no placeholder |
| Sealed letters before they open | Omitted from this file (C28-4) |
| Quiet days | Omitted (C28-4) |
| Low Power Mode | One line that it may take longer (intent: "This may take a little longer while Low Power Mode is on."); not blocked |
| Mixed scripts | Each script in an embedded licensed font; no missing-glyph boxes (C28-13) |
| The parent cancels | Generation stops; no file kept |
| Two books | One file per chosen book |

### 4.6 Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | The option sits beside the existing exports; no promotion |
| Empty | A book with no kept letters: the option is absent |
| Many (1,000 letters, 300 pictures) | Allowed; progress shown; budgets in 4.8 are for 240 letters and 50 pictures; larger books scale linearly and stay under the 150 MB peak (C28-10) |
| Offline | Works; no network |
| Slow | Progress within 500 ms of the tap; never a blank wait |
| Failed | A failed render leaves no file and says it could not be made, with Try again |
| Interrupted (call, Siri, alarm, the baby) | Generation continues if iOS allows; if the app is suspended and killed, C28-11 |
| App killed mid-flow | No partial file (C28-11) |
| App updated mid-flow | As killed |
| Low storage (under 1 GB, under 50 MB) | Disk check before writing; under the estimate plus 200 MB it does not start |
| Low Power Mode and low battery | Line that it may take longer; not blocked |
| Two books | One file per book |
| Two parents | The file holds the letters this parent can read in the book (own and the other parent's visible letters), never private letters of the other parent |
| Expecting parent (due date only) | Before You letters print under that heading |
| Multilingual (Devanagari, RTL, CJK) | Fixture PDFs: text layer equals the words; RTL pages right to left per letter (C28-3, C28-13) |
| AX5 and Bold Text on SE 3 | The Export screen wraps; the PDF itself is fixed layout |
| VoiceOver | Option, progress and result announced; progress has a text value |
| Voice Control and Switch Control | Commandable and scannable |
| Reduce Motion | Progress without animation loops |
| Dark mode and Increase Contrast | Screen follows tokens; the PDF is always light |
| Plan lapsed | Works (C28-7) |
| Signed out | Works on the local book (D1) |
| Second account on the same phone | Only the signed-in account's books (C28-17) |
| New phone | Pictures that stayed on the old phone are absent; the file says nothing about them |

### 4.7 Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-07-C28-1 | Given the Export screen with `EXPO_PUBLIC_PRINT_READY` on, Then it offers one extra file named "Printable book (PDF)" (PROPOSED) beside the existing ones, with no price, order button, seller or partner name; every string passes [K-32] | P1 | `[NS-07-C28-1] Export offers a printable file and sells nothing` |
| NS-07-C28-2 | Given the PDF, Then every page carries only text the parent said or typed, the parent's pictures (stored copies) and the app's fixed unsigned words (month headings, a title page); no generated caption, summary or highlights page | P0 (a) | `[NS-07-C28-2] the book holds only the parent's words and pictures` |
| NS-07-C28-3 | Given the PDF text layer, Then it equals the letters' `final_text` in book order, for 20 fixtures including Devanagari, Arabic and Chinese | P0 (a) | `[NS-07-C28-3] the text layer equals the words` |
| NS-07-C28-4 | Given quiet days, Then they do not appear (D-084); given sealed letters before they open, Then their words do not appear (FS-R11); the author's own data export (ZIP) is the file that carries a sealed letter whole | P0 (a) | `[NS-07-C28-4] quiet days and closed seals stay out` |
| NS-07-C28-5 | Given empty months, Then no page, heading or line mentions them, and no page count or "pages left" appears | P0 (a) | `[NS-07-C28-5] gaps are not shown or counted` |
| NS-07-C28-6 | Given the file, Then it has no external links, trackers or QR code (a QR needs hosted audio: not before NS-03 and NS-05 Level 3) | P1 | `[NS-07-C28-6] no links and no QR` |
| NS-07-C28-7 | Given a lapsed plan or a used allowance, Then the file can be made; it is never gated | P1 | `[NS-07-C28-7] the printable file is never gated` |
| NS-07-C28-8 | Given a picture whose stored copy is under 2,550 px on its long side, Then the file uses it at its own size, adds no upscaling and shows no message about quality | P1 | `[NS-07-C28-8] no upscaling and no quality message` |
| NS-07-C28-9 | Given a book of 240 letters with 50 pictures, Then the file is made within 60 s on an SE 3 (PROPOSED; the existing PDF book's budget is 30 s for 240 letters without pictures, 06-nfr 2.5), with progress shown within 500 ms of the tap | P1 | `[NS-07-C28-9] 240 letters with 50 pictures in 60 s` (device) |
| NS-07-C28-10 | Given the same book, Then peak memory while generating stays under 150 MB (06-nfr 2.5) | P1 | `[NS-07-C28-10] generation stays under 150 MB` (Instruments) |
| NS-07-C28-11 | Given the app is killed while generating, Then no partial file remains after the next launch (as NS-11-R9) | P0 (a) | `[NS-07-C28-11] a kill leaves no partial file` |
| NS-07-C28-12 | Given the share sheet completes (saved, sent, cancelled or failed), Then the temporary PDF is deleted in its completion handler; a launch sweep is the backstop; the file sits in the app's tmp folder with complete file protection and is excluded from backup (as NS-05-R10a to R10c) | P0 (a) | `[NS-07-C28-12] the temporary PDF never stays` |
| NS-07-C28-13 | Given the PDF, Then every font is embedded and subset from faces bundled under SIL OFL 1.1 (Literata, Tiro Devanagari, Mukta per `components/ui/fonts.ts`, plus an OFL face for Arabic and CJK, UNVERIFIED which is bundled), and the fixture PDFs show 0 missing-glyph boxes; no system font is embedded | P0 (b) | `[NS-07-C28-13] fonts are embedded, licensed and complete` |
| NS-07-C28-14 | Given Low Power Mode on, Then the generating view shows one line that it may take longer, and generation is not blocked | P1 | `[NS-07-C28-14] Low Power Mode is said, not blocked` |
| NS-07-C28-15 | Given generation, Then the screen is kept awake only while generating and released at the end, on cancel or on failure (06-nfr 10) | P1 | `[NS-07-C28-15] the screen sleeps again after generating` |
| NS-07-C28-16 | Given no proof-book numbers yet, Then pages are 8.5 x 8.5 inches (PROPOSED, provisional; founder default) and the file's layout version is marked provisional in its metadata title, never in the parent's words | P1 | `[NS-07-C28-16] provisional square page` |
| NS-07-C28-17 | Given account A signed out and account B signed in on the same phone, Then B's printable file holds only B's books (D1, X4) | P0 (a) | `[NS-07-C28-17] a second account prints only its own books` |
| NS-07-C28-18 | Given two parents in a book, Then the file holds the letters this parent can read in the Book and never the other parent's private letters | P0 (a) | `[NS-07-C28-18] the printable file holds only what this parent can read` |
| NS-07-C28-19 | Given a letter marked as a first (NS-06 A), Then its label shows above the letter, and nothing counts firsts | P1 | `[NS-07-C28-19] first labels print above their letters, uncounted` |

Not specified, because the numbers come from proof books: trim size, margins, bleed, page count limit, cover. Default: the two proof books set them, and `product` adds them here with the proof's date. Until then C28-1 to C28-19 are testable and the final layout is not.

### 4.8 Non-functional budgets

| Line | Budget |
|---|---|
| Latency (p95 on SE 3) | 240 letters with 50 pictures within 60 s (PROPOSED); progress within 500 ms |
| Memory | Under 150 MB peak (06-nfr 2.5) |
| On-device storage | The PDF in tmp only, deleted at completion; the disk check needs the estimate plus 200 MB (F15-REQ-010) |
| Battery | Screen awake only while generating; Low Power Mode line |
| Offline | Works |
| Accessibility | Export screen at AX5; progress has a text value; VoiceOver announces start and end |
| Localisation | Each script in an embedded licensed font; RTL letters right to left; dates from `Intl.DateTimeFormat` |
| Privacy (log canary) | No letter text, child name, file path or file name in logs |

### 4.9 State space

| Case | Expected | Test |
|---|---|---|
| Second phone | Prints what that phone holds | C28-3 |
| Second account on this phone | Own books only | C28-17 |
| Offline | Works | C28-9 |
| Retry after a lost answer | n/a: no server call | n/a |
| Sign out | Works on the local book (D1) | C28-17 |
| Account deletion | After the erase nothing remains to print | erase tests |
| Kill switch `serverFeaturesEnabled()` off | No change | C28-9 |
| Remote pause | None: export keeps working under every switch (LEGAL-REQ-040; `kill-switches.ts` header). Rollback is the build flag | n/a |
| Plan lapse | Works | C28-7 |

### 4.10 Data and engineering

- Fields: none new. Reads `final_text`, `occurred_on`, the signature, first labels (when NS-06 A ships), `entry_media` stored copies (NS-01).
- Migrations, sync, export schema: none (the file is a separate output, not part of the ZIP format).
- Modules: `lib/export/print-pdf.ts` (CTO pass), reusing `build.logic.ts` letter ordering and `renderPdf` (`device.ts:259`) with a print page size and `@font-face` rules pointing at the bundled faces; `packages/content` strings; the Export screen.
- Flag: `EXPO_PUBLIC_PRINT_READY` (internal name; parent-facing words never say "print-ready"). Remote pause: none (4.9).
- Error codes: `print_pdf_failed`, `print_pdf_disk_full` (both leave 0 files; never logged with a path).
- Rollout: preview and TestFlight; production after the CLO's font-licence evidence (C28-13) and the device rows. Rollback: flag off in the next build.
- Order: after NS-01 (stored copies) ships; the roadmap holds the date (T5). Native fonts already ship, so no new native build is needed unless a new face is bundled.

### 4.11 Data inventory

| Field | Class | Where | Synced | Retention clock | Deletion path | Export | Log exclusion |
|---|---|---|---|---|---|---|---|
| Temporary printable PDF | L4 (words, pictures, child name on the title page) | phone tmp, complete protection, excluded from backup | No | Until the share sheet completes, or the next launch | Completion handler; launch sweep (C28-12) | It is an export | Path and name never logged |

### 4.12 Door lines

- Shown: the option, the progress view, the share sheet.
- Records: nothing. No PRIV-R21 row, because exporting one's own book is not an agreement.
- Never: a destination, an order, a partner, a count of pages or files.
- Decline: do not make the file.

### 4.13 Threats

| Asset | Threat | Control | Test |
|---|---|---|---|
| The whole book (L4) | The temp file stays on the phone or in a backup | Completion-handler delete, sweep, protection, backup exclusion | C28-12 |
| Other parent's private letters | Printed by the other parent | Same visibility as the Book | C28-18 |
| Sealed words | Printed before the day | One visibility function (NS-06-B6) | C28-4 |

### 4.14 Never (rulings D2 and D3)

D3: the file is never donated to Spotlight, Siri or App Intents (`[X6-R1]`). D2: n/a because no text field is added. No generated words of any kind (C28-2).

### 4.15 Design inputs

States: the option in Export; progress; Low Power Mode line; failure with Try again; the share sheet. The PDF: title page (book name as the parent set it, "From {signsAs}"), month headings, letters with their pictures, first labels above letters. Square page, provisional. Pictures never cropped to fill.

### 4.16 Content inputs

Intent: "Printable book (PDF)"; "Making your book"; "This may take a little longer while Low Power Mode is on."; "The book could not be made this time." Banned (K-32 and voice): print-ready, printed, order, hardcover, photo book, any partner name, pages left, any count, any loss word.

### 4.17 Legal, privacy and compliance

Counsel packet 1.5.0; counsel must confirm: Q11 (a print partner later is a processor), Q47 (publisher identity before any print sale). CLO: NEEDS EVIDENCE that the bundled OFL faces may be embedded in user-made PDFs (OFL 1.1 is understood to allow documents; UNVERIFIED) and which face covers Arabic and CJK. K-32 stands; no exemption.

**Label effect.** None: the file stays on the phone until the parent sends it with their own share sheet.

### 4.18 Claims

Enables: "A free printable PDF of the book." Forbids: "order", "printed", "hardcover", "print-ready", any partner name (K-32), "photo book".

### 4.19 Free or Plus

Free. What a family kept stays theirs to export (D-082). Ruled 20 Nov (T2): free in 1.0.x stays free; public copy says nothing either way. A later printed book from a partner would be a separate purchase outside Plus (closed X3), not this file.

### 4.20 Measures with analytics off

Tester question (fixed wording, x of n, D5): "Did you make the printable book file this month (yes or no)?" Proof-book read-out when the founder spends on proofs.

### 4.21 Dependencies and gates

NS-01 stored copies (ruling T3 sets their size); NS-06 A for labels (optional); the CLO font evidence; proof books for final layout (founder spend, OQ-1); device rows C28-9, C28-10 on an Asha-only install (D13).

### 4.22 Open questions

See section 7 (OQ-1, OQ-4).

---

## 5. G11: The privacy label as a release gate (a CI guard)

### 5.1 Who and when

The founder at the moment of merging a PR that, without anyone noticing, would make the App Store privacy label untrue. Also every agent session, which posts as the founder.

### 5.2 Why

- Job: "I go to a PR to merge it, so that what we tell parents in the label stays true."
- What goes wrong today: a label change needs a recorded founder decision (D-125) and a label edit, but nothing checks that a diff which sends new data off the phone carries both. Evidence: the research file notes that a clean privacy label is a competitive fact only while we keep it; the exec record says a hosted recording flips Audio Data to collected and linked.

### 5.3 What, and Not in scope

What: a guard script `scripts/guards/label-effect.mjs` (name proposed; `scripts/guards/` exists on `develop` with `docs-leak-guard.mjs`) and a CI job, with three checks: data leaving the phone (G11-1), every card states its label effect (G11-2), new SDKs, entitlements or usage strings (G11-3).

Not in scope: deciding the label; editing `docs/legal/app-store-privacy-labels.md`; replacing the founder's merge as the real gate.

### 5.4 Happy path

1. A PR into `develop` runs CI; the guard reads the diff and the PR body.
2. If the diff adds data leaving the phone, a new tracking or crash SDK, or a new entitlement or usage string, the guard checks for a recorded decision and a label-file change.
3. It also checks every NS card in `docs/product/prd/*.md` has its label line.
4. Pass: exit 0. Fail: exit non-zero with one line per finding naming the file and the missing item.

### 5.5 Unhappy paths and edge cases

| Case | Behaviour |
|---|---|
| The PR body names a D-id that does not exist on the base branch | Fail |
| The D-id exists but its text does not mention the privacy label | Fail |
| The decision exists but `app-store-privacy-labels.md` is unchanged | Fail |
| A session writes a matching decision line in the same PR | The guard reads `DECISIONS.md` from the base branch, so a decision added in the same PR does not count; residual risk: a session can merge a decision first, so the founder's merge stays the real gate (stated in the guard's README) |
| A docs-only PR | G11-2 only |
| A card file names a range of cards in its title | The title is not a card; only single-id headings and Parts are (G11-2) |

### 5.6 Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | The first run on `develop` must pass: every locked card carries its label line |
| Empty | An empty diff passes |
| Many (1,000 letters, 300 pictures) | n/a because the guard reads diffs, not data |
| Offline | n/a because the guard runs in CI |
| Slow | Finishes within 30 s on a 400-line diff (PROPOSED) |
| Failed | A guard crash fails the job (never a silent pass) |
| Interrupted (call, Siri, alarm, the baby) | n/a because the guard has no screen |
| App killed mid-flow | n/a |
| App updated mid-flow | n/a |
| Low storage (under 1 GB, under 50 MB) | n/a |
| Low Power Mode and low battery | n/a |
| Two books | n/a |
| Two parents | n/a |
| Expecting parent (due date only) | n/a |
| Multilingual (Devanagari, RTL, CJK) | n/a; the guard reads ASCII markers |
| AX5 and Bold Text on SE 3 | n/a because the guard has no screen |
| VoiceOver | n/a |
| Voice Control and Switch Control | n/a |
| Reduce Motion | n/a |
| Dark mode and Increase Contrast | n/a |
| Plan lapsed | n/a |
| Signed out | n/a |
| Second account on the same phone | n/a |
| New phone | n/a |

### 5.7 Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-07-G11-1 | Rewritten 20 Nov as G11-1a to G11-1c (CISO: a PR-body D-id alone is a policy, not a control); id kept | n/a | none |
| NS-07-G11-1a | Given a diff fixture that adds a network call carrying letter text, a recording, a picture or a child name, or a server table, column, bucket or function for them, When the guard runs, Then it exits non-zero unless all of these hold: the PR body names a D-id; that D-id exists in `docs/DECISIONS.md` on the base branch; its text names the privacy label; and `docs/legal/app-store-privacy-labels.md` changes in the same PR | P0 (b) | `[NS-07-G11-1a] an unrecorded data-leaving diff fails` (Node test over diff fixtures) |
| NS-07-G11-1b | Given the same fixture with all four conditions met, Then the guard exits 0 | P1 | `[NS-07-G11-1b] a recorded label change passes` |
| NS-07-G11-1c | Given a diff that adds none of those, Then the guard exits 0 whatever the PR body says | P1 | `[NS-07-G11-1c] an ordinary diff passes` |
| NS-07-G11-2 | Rewritten 20 Nov (X8, F11). Given `docs/product/prd/*.md`, When the guard runs, Then every card is followed, before the next card heading, by a line starting `**Label effect.**` or `Label effect:`; a card is a heading of level 1 or 2 whose text starts with one id `NS-` plus two digits (a title naming a range, such as "NS-08 to NS-12", is not a card), or a `## Part` heading inside such a file, in which case each Part needs its own line | P1 | `[NS-07-G11-2] every card states its label effect` (Node test over the folder) |
| NS-07-G11-3 | Given a diff that adds an analytics, crash-reporting or ads SDK to `apps/mobile/package.json`, a new entitlement, or a new `NS*UsageDescription` or other Info.plist usage string in `app.config.ts`, Then the guard exits non-zero unless the G11-1a conditions hold for it | P0 (b) | `[NS-07-G11-3] a new SDK, entitlement or usage string needs a recorded decision` |
| NS-07-G11-4 | Given the guard's README, Then it states that a session can still record a matching decision before the PR, so the founder's merge remains the real gate | P1 | `[NS-07-G11-4] the guard states its residual risk` (doc check) |
| NS-07-G11-5 | Given any PR into `develop`, Then the guard runs as a CI job; a guard error fails the job | P1 | `[NS-07-G11-5] the guard runs on every PR` |

### 5.8 Non-functional budgets

Latency: under 30 s per run (PROPOSED). Memory, storage, battery, offline, accessibility, localisation: n/a because this is a CI script. Privacy: the guard prints file paths and ids only, never diff content.

### 5.9 State space

n/a because no sync, account or notification is touched.

### 5.10 Data and engineering

Files: `scripts/guards/label-effect.mjs`, its test, fixtures, a README, a CI job in `.github/workflows/`. Owners: `security-architect` and `compliance-engineer` (size S [E]). No app flag; no remote key; no migration. Rollback: remove the job.

### 5.11 Data inventory

None.

### 5.12 Door lines

n/a: no person acts in the app.

### 5.13 Threats

| Asset | Threat | Control | Test |
|---|---|---|---|
| The privacy label's truth | A data-leaving diff merges without a decision or label edit | G11-1a | Fixtures |
| The guard itself | A session satisfies it by writing a decision first | Base-branch read; founder merge is the real gate | G11-4 |
| Hidden collection | An SDK or entitlement added quietly | G11-3 | Fixtures |

### 5.14 Never (rulings D2 and D3)

n/a because the guard stores no parent's words.

### 5.15 Design inputs

n/a: no screen.

### 5.16 Content inputs

n/a: no parent-facing words.

### 5.17 Legal, privacy and compliance

Q54 (App Privacy answers) is the label the guard protects; counsel must confirm the label itself, not the guard. D-125 (founder merges legal texts).

**Label effect.** None: the guard changes no data flow.

### 5.18 Claims

Enables nothing public. Forbids claiming the label is "verified automatically".

### 5.19 Free or Plus

n/a.

### 5.20 Measures with analytics off

The guard's own CI history: number of runs that failed and were fixed (a count of runs, not of people).

### 5.21 Dependencies and gates

Every locked card carries its label line before the guard turns on (this lock). The guard runs before the first build that turns on any NS card whose label effect is not "None" (order only, T5).

### 5.22 Open questions

See section 7 (OQ-2).

---

## 6. Parked with a default

| Id | Row | Why not now | Reopened by | Default |
|---|---|---|---|---|
| 6.1 | C24 Shared voice and close family (F31, F32) | Needs audio to leave the phone (NS-03, NS-05) and a contributor model; F32 has an open draft-count edge (DR-16); counsel (D-050, LEGAL-REQ-035; Q48) | NS-03 GO and the security and counsel reads | Later; no copy promises it |
| 6.2 | C26 and G10 Gifts and lifetime | "Gift" is a banned word at v1.0 (BRAND.md glossary); no requirement file; Apple in-app purchase rules not read | Founder names a release; counsel read | Not written, not built |
| 6.3 | C43 App-interface localisation | English only (D-121); a language ships only after its gate passes with a native reviewer | A language passing its evidence gate | Not written |
| 6.4 | G7 A weekly list of new letters for family | Needs a family audience (6.1). Only a plain list of letters with no new sentence would be allowed; a summary is forbidden | NS-05 Level 3 live | Not written; no recaps in any form |
| 6.5 | G8 Choose who sees each letter | Part of hosted-link design (NS-05 Level 3); per-letter and author-chosen is a guard in NS-05 | NS-05 Level 3 requirement | Default nobody; never default on |
| 6.6 | G9 Bring in letters from another app | Other apps' export formats UNVERIFIED; voice-memo import is NX-27 (UNVERIFIED on `develop`) | A parent study showing arrivals with history | Not written |

**Label effect.** None for parked rows until built.

## 7. Open questions

| Id | Question | Owner | Default if unanswered |
|---|---|---|---|
| OQ-1 | Spend the proof-book amount in the exec record on two proof books? | Founder | No spend; C28's final layout numbers stay open FOUNDER-ANSWERED 20 Nov, default accepted (CL-005, default as stated in the row and in GAP-LOG Closures) |
| OQ-2 | Who writes the label guard, and when? | `security-architect`, `compliance-engineer` | Built (size S) and running in CI before the first build that turns on any NS card whose label effect is not "None"; until it merges, G11-1a is a PR-checklist line and the row is "partly built" (RR-8) FOUNDER-ANSWERED 20 Nov, default accepted (CL-005, default as stated in the row and in GAP-LOG Closures) |
| OQ-3 | Re-check of branch-only cites | `product` | The next backlog PR replaces "branch" with the merged path for each FOUNDER-ANSWERED 20 Nov, default accepted (CL-005, default as stated in the row and in GAP-LOG Closures) |
| OQ-4 | Page size before proof books | Founder | 8.5 x 8.5 inches, marked provisional (C28-16) CLOSED 20 Nov, see GAP-LOG Closures CL-006: 8.5 x 8.5 in, marked provisional |

Not fully testable: C28 layout (trim, bleed) until proof books exist; every "Cited" row's content is UNVERIFIED where marked; parked rows have no acceptance criteria by design.
