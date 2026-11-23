# Area B: Book and reading. Words

Status: DRAFT for founder word approval, 20 Nov 2026 (content design lead, area B). Every string here is keyed to a screen and state id in `DESIGN.md` (this folder). Nothing here is in `packages/content` yet; Karma collects, reconciles and commits.

Sources read for this file: `BRIEF.md`; the locked cards NS-01, NS-02, NS-06 (Parts A and B), NS-21, NS-22, NS-23, NS-24, NS-29 and NS-37; `README.md` appendix A; `16-council-review-round-2.md` (T1 to T5, D1 to D13); `14-test-plan.md` (J-N10, J-N14, J-N19, J-N25); `packages/content/VOICE.md`, `BRAND.md`, `test/rules.test.ts`; `packages/content/src/strings.en.ts`; `apps/mobile/src/components/book/copy.ts`; and the two copy files that exist only on open PR branches: `features/find.en.ts` (PR #798, branch `feat/mobile-find`) and `features/photos.en.ts` (PR #840, branch `feat/mobile-photo-5-lens`).

## 0. How to read this file

- **Status** column: EXISTS (on `develop`, reused as is), BRANCH (in an open PR's copy file, reused as is), CHANGED (an existing key whose words change; the old words are given), PROPOSED (a new key; the founder approves the words before any build outside his family shows them).
- **Key** column: the `packages/content` path. Prefixes: `en.` is `strings.en.ts`; `find.` is `findCopy` (#798); `photos.` is `photosCopy` (#840); `firsts.` and `seal.` are two new feature files PROPOSED here (`features/firsts.en.ts`, `features/seal.en.ts`); `bookCopy.` is the feature-local `components/book/copy.ts` (standing duty: it moves into `en.book` in the same PR that changes it).
- **VO** column: what VoiceOver reads. "label = text" means the visible text is the label. A hint follows "hint:". Keys ending in `A11y` are never drawn.
- **VC** column: the Voice Control name, which always equals the visible label. For an icon-only control, it is the accessibility label, which is also the Large Content Viewer title.
- Screen ids `B-S01` to `B-S23` are `DESIGN.md`'s. State suffixes are `DESIGN.md`'s shared list; where a screen needs its own state, the name is given here and listed in section 23 for the design lead to adopt.
- Dates are never typed in a string. `{date}` is filled by `Intl.DateTimeFormat` in the reader's locale; a sealed letter's day comes from `seal_opens_on`, never from the instant (NS-06 B8 localisation row).
- Every existing string that holds a middle dot is written here as `[middot]`, so this file stays ASCII. The middle dot itself is allowed in copy (the rules test bans dashes, curly quotes, ellipsis characters and emoji, not the dot).
- Placeholders used: `{child}`, `{date}`, `{label}`, `{a}`, `{b}`, `{n}`, `{month}`, `{signsAs}`, `{coParent}`, `{duration}`. All are on the rules test's allowed list; this file adds no new placeholder.

---

## 1. B-S01 The Book, with the calm header bar (NS-22, NS-01 lens, NS-06 A lens, NS-02 entry)

Header order (NS-22 section 3): title, age, child switcher (two books only), Read together, the lens choice, Find, Go to a month, the end menu. The gear leaves the Book (NS-22-R3, R6); `en.settings.title` is no longer read on this screen.

| Key | Status | Text | Where (state) | VO | VC | Card row |
|---|---|---|---|---|---|---|
| `en.book.title` | EXISTS | {child}'s book | B-S01 all states; level 1 heading | label = text, heading | n/a | NS-22 s3 |
| (age line) | EXISTS | from `coverAge`: the age, or `en.book.beforeYouChapter` "Before You" | B-S01 all states | label = text | n/a | NS-22 s6 expecting row |
| `en.children.switcher.label` | EXISTS | For {child} | B-S01.twoBooks | label = text; hint `en.children.switcher.hint` "Switch to another child's book" | For {child} | NS-22 s3 |
| `en.readTogether.title` | EXISTS | Read together | B-S01.default (absent in .empty) | label = text; hint `en.readTogether.subtitle` | Read together | NS-22-R4 |
| `find.button` | BRANCH | Find | B-S01.default (icon; absent in .empty and .pause; .killSwitch changes nothing, Find is local) | label "Find"; hint `find.buttonHint` "Looks for a word in this book's letters." | Find | NS-02-R1 |
| `bookCopy.monthsButton` | CHANGED (was "Months"; moves to `en.book.goToMonth.button`) | Go to a month | B-S01.default; folds into B-S02 at AX3 and above | label = text; hint `bookCopy.monthsHint` | Go to a month | NS-22 s3 ("today Months"). Required, not cosmetic: with the lens on, a button "Months" and a radio "Months" sit in one bar and "Tap Months" becomes ambiguous for Voice Control (section 23, item R1) |
| `en.book.menu.label` | PROPOSED | More for this book | B-S01 all states with a book (icon); also B-S02's sheet title | label = text, button; hint `en.book.menu.labelA11y` (PROPOSED) "Quiet or hide this book." | More for this book | NS-22 s16 |
| `en.book.hiddenNote` | PROPOSED | This book is hidden for you. You can read it here. | B-S01.hiddenReadOnly (opened from Hidden books; read-only) | label = text | n/a | NS-22 s5 hidden row; F09-REQ-016 |

Empty book (B-S01.empty): title and age only, then the built closed cover (NS-22-R4, NS-01-R10c). No Find, lens, Read together or Go to a month; no hint about any of them.

| Key | Status | Text | Where | VO | VC | Card row |
|---|---|---|---|---|---|---|
| `en.book.empty.bookTitle` | EXISTS | The first page is waiting. | B-S01.empty | label = text | n/a | NS-22 s6 first use |
| `en.book.empty.bookBody` | EXISTS | Tell {child} one thing about today. | B-S01.empty | label = text | n/a | as above |
| `en.book.empty.bookCta` | EXISTS | Write a letter | B-S01.empty; switches to the Home tab and calls no capture function | label = text; hint `en.book.empty.bookCtaA11y` (PROPOSED) "Goes to Home." | Write a letter | NS-01-R23a |

Letter cards in the list (built words, reused; listed because the lenses reuse them):

| Key | Status | Text | Where | VO | VC | Card row |
|---|---|---|---|---|---|---|
| `en.book.signature` | EXISTS | From {signsAs} | every card | part of the card's one label | n/a | built |
| `en.book.privateLabel` | EXISTS | Private | a private card | part of the card label | n/a | built |
| `bookCopy.cardVoice` | EXISTS (feature-local; move to `en.book.card.voice`) | Voice {duration} | a card with a recording | `bookCopy.cardVoiceA11y` "Voice recording, {duration}" | n/a | built |
| `bookCopy.nobodySpoke` | EXISTS (feature-local; move to `en.book.nobodySpoke`) | No words in this one. The recording is kept just as it is. | a card whose recording had no talking | label = text | n/a | built |
| `en.book.waitingForWords` | EXISTS | A recording, waiting for its words. | a voice-only letter | label = text | n/a | NS-21 s5 |
| `en.book.quietDay.label` | EXISTS | A quiet day | a quiet-day mark | `en.book.quietDay.a11y` "{date}. A quiet day, kept." | n/a | built |
| `en.reader.openHint` | EXISTS | Opens the letter. | every card's hint | hint | n/a | built |
| `firsts.cardKicker` | PROPOSED | A first | a marked card, in every lens, above the parent's label (small muted app words) | read first in the card label: "A first. {label}. ..." | n/a | NS-06-A3, A11 (never shown by colour alone) |

Month openers under the Photos and Firsts lenses show the month name and date range only (`en.book.monthKicker`, `en.book.chapterTitle`, `en.book.monthRange`, `bookCopy.chapterAge`); no `en.book.chapterLetters` count line, so no count of pictures or firsts can appear (NS-01-R11, NS-06-A4).

## 2. B-S02 "More for this book" end menu (NS-22, F12-REQ-011)

Drawn as a fit-to-contents sheet of rows, not a system menu (DESIGN.md G-03: no action-menu wrapper exists on `develop`). Each row's visible title is its VC name. Key family `en.children.quiet.*` follows NS-22 s16 and F12 D2 (the keys the card cites do not exist yet; DESIGN.md G-04, BL-965).

| Key | Status | Text | Where | VO | VC | Card row |
|---|---|---|---|---|---|---|
| `en.children.quiet.label` | PROPOSED | Quiet this book | B-S02.default | label = text | Quiet this book | NS-22-R3; F12-REQ-011 |
| `en.children.quiet.help` | PROPOSED | Home and reminders stay quiet about {child}, for you. Your letters stay as they are. | B-S02.default, the row's subtitle | read after the row title | n/a | F12-REQ-011 (stops prompts, reminders, month and birthday messages, milestone cards, Read together suggestions, the Save a copy slip and past letters; J-N19) |
| `en.children.quiet.offLabel` | PROPOSED | Turn Quiet off | B-S02.quieted | label = text | Turn Quiet off | NS-22-R7 ("Unquiet"; see card gap G2) |
| `en.children.settings.hideLabel` | EXISTS | Hide this book | B-S02.default, B-S02.quieted | label = text | Hide this book | NS-22-R3 |
| `en.children.settings.showButton` | EXISTS | Show this book again | B-S02.hiddenReadOnly | label = text | Show this book again | NS-22 s5 |
| `bookCopy.monthsButton` | CHANGED (see B-S01) | Go to a month | B-S02.ax3 (folded) | label = text | Go to a month | NS-22 OQ (folds at AX3) |
| `en.children.quiet.quietedToast` | PROPOSED | {child}'s book is quiet for you. | after Quiet | announced once | n/a | F12-REQ-011 |
| `en.children.quiet.offToast` | PROPOSED | Quiet is off for {child}'s book. | after Turn Quiet off | announced once | n/a | NS-22-R7 |
| `en.book.menu.hideTitle` | PROPOSED | Hide {child}'s book? | B-S02 hide confirm sheet | heading | n/a | NS-22-R3 |
| `en.children.settings.hideBody` | EXISTS | Hiding {child}'s book quiets every reminder and message about {child}. Nothing is deleted. | hide confirm, one adult | label = text | n/a | built |
| `en.children.settings.hideShared` | EXISTS | Hiding is only for you. {coParent} still sees {child}'s book as before. | hide confirm, two adults (B-S02.twoParents) | label = text | n/a | NS-22 s6 two parents |
| `en.children.settings.hideLabel` | EXISTS | Hide this book | hide confirm, confirm button | label = text | Hide this book | NS-22-R3 |
| `en.common.cancelButton` | EXISTS | Cancel | hide confirm, safe choice | label = text | Cancel | NS-22 |
| `en.book.menu.hiddenToast` | PROPOSED | {child}'s book is in Hidden books. | after Hide | announced once | n/a | NS-22 s5 |
| `en.children.quiet.saveFailed` | PROPOSED | That did not save. {child}'s book is as it was. | B-S02.failed (a Quiet or Hide write failed) | announced once | n/a | NS-22 s6 failed row |

## 3. B-S03 Lens choice (NS-01-R10, R48; NS-06-A3; NS-33-R3)

One radio group. It exists only when a second lens exists; each lens option exists only when its first letter does (no empty lens, no hint).

| Key | Status | Text | Where | VO | VC | Card row |
|---|---|---|---|---|---|---|
| `en.book.lens.groupA11y` | PROPOSED | Show letters by | B-S03 group label, never drawn | group label; each option reads "{option}, selected" or "{option}" by the radio trait | n/a | NS-01-R48 |
| `photos.book.lens.months` | BRANCH | Months | B-S03.default | label = text, radio | Months | NS-01-R10a |
| `photos.book.lens.photos` | BRANCH | Photos | B-S01.lensPhotos | label = text, radio | Photos | NS-01-R10a, R10c, R12 |
| `firsts.lens` | PROPOSED | Firsts | B-S01.lensFirsts | label = text, radio | Firsts | NS-06-A3 |

The lens disappearing (NS-01-R12, last picture removed) says nothing.

## 4. B-S04 Photos lens and B-S05 Firsts lens (NS-01-R11, NS-37; NS-06-A3)

Both lenses are the Book's own letter cards. No count, no add control, no start (NS-01-R11, R23b; NS-06-A4).

| Key | Status | Text | Where | VO | VC | Card row |
|---|---|---|---|---|---|---|
| `photos.book.photos.a11yCard` | BRANCH | Photo with this letter | B-S04 thumbnail with no photo words; also B-S08 | the picture's label when the parent typed no words; with photo words, the words are the label | n/a | NS-01-R9a, R21c |
| (none) | n/a | A missing list copy shows the card without its thumbnail, with no words | B-S04.thumbMissing | nothing extra | n/a | NS-37-R3 |
| `firsts.cardKicker` | PROPOSED (see B-S01) | A first | B-S05 every card | first in the card label | n/a | NS-06-A3 |

## 5. B-S06 Find mode over the Book (NS-02)

Find strings may not hold a count, "results", "best match", "related", "suggested", "did you mean", "search your recordings", "anything you said", "smart", "AI", "yet", "still" or "missing" (NS-02 s16).

| Key | Status | Text | Where | VO | VC | Card row |
|---|---|---|---|---|---|---|
| `find.placeholder` | BRANCH | Find in {child}'s book | B-S06.idle, field placeholder | not read as the label | n/a | NS-02 s16 |
| `find.fieldLabel` | BRANCH | Find a letter | B-S06 field, never drawn | label | Find a letter (spoken name of the field) | NS-02-R1 |
| `find.fieldHint` | BRANCH (PROPOSED words) | A few letters are enough to start looking. | B-S06.idle and B-S06.short (under 3 characters), VoiceOver and Switch Control only, drawn nowhere | hint | n/a | NS-02-R23 |
| `find.foundA11y` | BRANCH | Letters found | B-S06.results, announced once, no number | announcement | n/a | NS-02-R11 |
| `find.rowA11y` | BRANCH | {date}. {label}. Opens the letter. | B-S06.results, each row (one element; `{label}` is the matched slice as kept, wrapped in Unicode isolates by code) | row label | the row's visible date line | NS-02-R41, R28 |
| `en.book.empty.searchTitle` | CHANGED (was "No letters with that word yet.") | No letters with that word. | B-S06.noMatch, the only line on screen; announced once | label = text | n/a | NS-02-R13, R39 |
| `find.error` | BRANCH | Find could not look just now. | B-S06.failed; announced once | label = text, announced | n/a | NS-02-R37 |
| `find.retry` | BRANCH (same words as `en.common.tryAgainButton`; reuse that key) | Try again | B-S06.failed | label = text | Try again | NS-02-R37 |
| `find.notReady` | CHANGED (was "Find is still getting ready on this phone.") | Find is getting ready on this phone. | B-S06.failedGettingReady, only while the index is not ready (NS-02-R38) | label = text | n/a | NS-02-R38; s16 bans "still" |
| `find.clear` | BRANCH | Clear | B-S06.short and B-S06.results, the field's clear control | label = text | Clear | NS-02 s3 |
| `find.cancel` | BRANCH (same words as `en.common.cancelButton`; reuse that key) | Cancel | B-S06 all states | label = text | Cancel | NS-02-R21 ("Tap Cancel") |

Short query (B-S06.short), offline, two books, plan lapsed, signed out, second account (no Find action), pause on (no Find action): nothing drawn, no words (NS-02-R3, R22, R24, R47; s9 pause row).

## 6. B-S07 Go to a month sheet, with year rows (NS-22, NS-24)

| Key | Status | Text | Where | VO | VC | Card row |
|---|---|---|---|---|---|---|
| `bookCopy.monthsTitle` | EXISTS (move to `en.book.goToMonth.title`) | Go to a month | B-S07 sheet title | heading | n/a | NS-22 |
| `bookCopy.monthsHint` | CHANGED (was "Shows the months that have letters."; only when year rows exist) | Shows the months and years that have letters. | B-S01 Go to a month hint | hint | n/a | NS-24 s3 |
| `bookCopy.monthRowHint` | EXISTS | Goes to this month in the book. | B-S07 month rows | hint | n/a | built |
| `en.book.years.sectionTitle` | PROPOSED | Read a year together | B-S07.withYears, section heading above the year rows | heading | n/a | NS-24 s3 |
| `en.book.years.before` | PROPOSED, same words as `en.book.beforeYouChapter` (reuse that key) | Before You | B-S07 year row for letters before birth | label = text | Before You | NS-24-R5, R6 |
| `en.book.years.y1` | PROPOSED | {child}'s first year | B-S07 year row | label = text | {child}'s first year (filled) | NS-24 s16 |
| `en.book.years.y2` | PROPOSED | {child}'s second year | as above | as above | as above | NS-24 s16 |
| `en.book.years.y3` | PROPOSED | {child}'s third year | as above | as above | as above | NS-24 s16 |
| `en.book.years.y4` | PROPOSED | {child}'s fourth year | as above | as above | as above | NS-24 s16 |
| `en.book.years.y5` | PROPOSED | {child}'s fifth year | as above | as above | as above | NS-24 s16 |
| `en.book.years.yN` | PROPOSED | {child}'s year {n} | year 6 and later (books run on; seals reach the 25th birthday) | as above | as above | card gap G9 |
| `en.book.years.noName` | PROPOSED | Year {n} | any year row when the book has no name (never "your child's first year") | as above | as above | NX-31-R3 pattern |
| `en.book.monthRange` | EXISTS | {a} to {b} | each year row's second line: the birthday and the day before the next one (a year in progress shows its real end day) | read after the row title | n/a | NS-24-R5 |
| `en.book.years.rowA11y` | PROPOSED | Opens Read together at the first letter of this year. | B-S07 year rows, hint | hint | n/a | NS-24 s4 step 3 |

A year with no letters is not offered and nothing says so (NS-24-R4). A due-date-only book offers Before You only (NS-24-R6).

## 7. B-S08 The letter page, "This letter" list (NS-21, NS-33-R1)

VoiceOver order (NS-21-R14): dateline (level 1 heading), words, Play (if any), Share, list title (level 2 heading), rows in order, Delete.

| Key | Status | Text | Where | VO | VC | Card row |
|---|---|---|---|---|---|---|
| (dateline) | EXISTS | the letter's date by `Intl.DateTimeFormat`; `en.book.dateline.monthOnly` "Sometime in Month {month}"; `monthOnlyNewborn` "Sometime in the first weeks"; `beforeBirth` "Before {child} was born." | B-S08 all states | level 1 heading | n/a | NS-21-R4 |
| `en.book.hearLink` | EXISTS | Hear it in {signsAs}'s voice | B-S08.default (spoken, recording on this phone) | label = text | Hear it in {signsAs}'s voice | NS-21-R6b |
| `en.letter.listTitle` | PROPOSED | This letter | B-S08 all states | level 2 heading | n/a | NS-21 s16 |
| `en.letter.rows.dayAbout` | PROPOSED, shared with area A (NS-15); area A's key wins if the words differ | About {date} | row 1, first line | label = text; hint (author only) `en.letter.rows.dayA11y` "Changes the day this letter is about." | About {date} (filled) | NS-21 s3 row 1 |
| `en.letter.rows.daySaid` | PROPOSED, shared with area A (NS-15) | Said on {date} | row 1, second line, only when the two days differ | read after the first line | n/a | NS-15-R3 (area A) |
| `en.book.entryMenu.changeDate` | EXISTS, retired here by `en.letter.rows.day` when BL-937 lands | Change the date | today's row; kept until BL-937 | label = text | Change the date | NS-21 s3 row 1 |
| `firsts.markLabel` | PROPOSED | This was a first | row 2 (B-S08.ownSpoken, .ownTyped), author only, not on a quiet day | label = text, switch; the value (on, off) is announced on change | This was a first | NS-06-A1, A11 |
| (row 3: picture) | BRANCH | see B-S11 | row 3 | | | NS-21 s3 row 3 |
| (row 4: hide until a day) | PROPOSED | see B-S13 and B-S14 | row 4, author only | | | NS-21 s3 row 4 |
| `en.letter.rows.whoCanRead` | PROPOSED | Who can read it | row 5; value `en.letter.whoCanRead.onlyYou` or `.inBook` | "Who can read it, {value}"; hint (author) "Changes who can read this letter." (`en.letter.rows.whoCanReadA11y`) | Who can read it | NS-21 s3 row 5, R9 |
| (row 6: earlier versions) | area C | NS-12 owns the words | row 6 | | | NS-21 s3 row 6 |
| `en.book.recordingOnPhone` | EXISTS | Recording kept on this phone | row 7, spoken letter | label = text | n/a | NS-21 s3 row 7 |
| `en.book.recordingElsewhere` | EXISTS | Recording kept on {signsAs}'s phone | row 7, B-S08.otherParent and B-S08.recordingElsewhere | label = text | n/a | NS-21 s5 |
| `en.book.recordingBackedUp` | EXISTS | Recording kept on this phone and backed up | row 7, only when owner backup is on (NS-08; off today, so never shown in Build 12) | label = text | n/a | NS-21 s3 row 7 |
| `en.book.provenance.typed` | EXISTS | Typed | footnote under a typed letter's words (no recording row) | label = text | n/a | NS-21-R6a |
| `en.book.provenance.spokenFixed` | EXISTS | Spoken, with small fixes | footnote | label = text | n/a | built |
| `en.book.provenance.spokenExact` | EXISTS | Spoken, exactly as said | footnote, only when final equals raw | label = text | n/a | built |
| `en.book.provenance.spokenOther` | EXISTS | Spoken | footnote, the other parent's letter | label = text | n/a | built |
| `en.book.entryMenu.deleteButton` | EXISTS | Delete | B-S08 last control, author only (absent in .otherParent) | label = text | Delete | NS-21-R3b, R11 |
| `en.letter.rows.saveFailed` | PROPOSED | That change did not save. The letter is as it was. | B-S09.failed, B-S10.failed, B-S12.failed, and a failed write from B-S11 or B-S13 (one line for every row) | announced once | n/a | NS-21 s6 failed row |
| `en.reader.notFoundTitle` | EXISTS | This letter is not in the book | B-S08.notFound | heading | n/a | NS-21 s5 |
| `en.reader.notFoundDeleted` | EXISTS | It is in Recently deleted. | B-S08.notFound, only with a copy on the shelf | label = text | n/a | NS-21 s5 |
| `en.reader.openShelfButton` | EXISTS | Open Recently deleted | as above | label = text | Open Recently deleted | NS-21 s5 |
| `en.reader.notFoundCta` | EXISTS | Back to the book | B-S08.notFound | label = text | Back to the book | built |
| `en.book.waitingReady` | EXISTS | Ready to read back | B-S08.readItBack | label = text | Ready to read back | NS-21 s5 |
| `en.errors.transcriptionFailed.title` | EXISTS | No words yet for this one | B-S08.waiting when words failed | heading | n/a | built |
| `en.errors.transcriptionFailed.body` | EXISTS | The recording is kept. | as above | label = text | n/a | built |

Share (above the list, NS-21-R3a) is area D's string (NS-05). Reading size (`en.reader.*`) and the words view switch stay as built.

## 8. B-S09 Day sheet (NS-21 row 1; area A owns NS-15's behaviour)

Reuses the built date sheet: `en.review.date.label` "When was this?", `dayTab` "A day", `monthTab` "A month", `tabsLabel`, `dayLabel`; the toast `en.book.changeDate.movedToast` "Moved to {label}." (all EXISTS). Area A's WORDS.md owns any "said on" line.

## 9. B-S10 Who can read it sheet (NS-21 row 5)

| Key | Status | Text | Where | VO | VC | Card row |
|---|---|---|---|---|---|---|
| `en.letter.whoCanRead.title` | PROPOSED, same words as `en.letter.rows.whoCanRead` (reuse) | Who can read it | B-S10 sheet title | heading | n/a | NS-21 s12 |
| `en.letter.whoCanRead.inBook` | PROPOSED | In the book | option and row value | radio, label = text | In the book | NS-21 s12 |
| `en.letter.whoCanRead.inBookHelp` | PROPOSED | Everyone who reads {child}'s book can read it. | under the option | read after the option | n/a | NS-21 s12 |
| `en.letter.whoCanRead.onlyYou` | PROPOSED | Only you | option and row value | radio, label = text | Only you | NS-21-R9 |
| `en.letter.whoCanRead.onlyYouHelp` | PROPOSED | Kept out of the book, for you alone. | under the option | read after the option | n/a | NS-21 s12 |

The row's new value is announced on change ("Who can read it, Only you"). The other parent is never told (NS-21 s12 Never line); no string here names them.

## 10. B-S11 Picture on the letter page (NS-01)

All BRANCH keys are in `photos.en.ts` on #840 and already marked "PROPOSED, needs word approval"; they are reused as written unless CHANGED.

| Key | Status | Text | Where | VO | VC | Card row |
|---|---|---|---|---|---|---|
| `photos.book.letter.addPhoto` | CHANGED (branch words "Add a photo to this letter") | Add a photo | B-S08.ownNoPicture (row 3, author) and under the R58 line | label = text | Add a photo | NS-01 s4, R58 ("Add a photo"); inside the "This letter" list the longer form repeats the list title |
| `photos.book.letter.rowLabel` | PROPOSED | Photo | B-S08.withPicture row 3; value is the parent's photo words when typed; opens B-S11.actions (author) | "Photo", then the photo words if any | Photo | NS-21 s3 row 3 |
| `photos.book.letter.changePhoto` | BRANCH | Change photo | B-S11.actions | label = text | Change photo | NS-01-R7 |
| `photos.book.letter.replacePhotoAsk.question` | BRANCH | Use this photo instead? | B-S11.replaceConfirm | heading | n/a | NS-01-R7 |
| `photos.book.letter.replacePhotoAsk.body` | BRANCH | The first photo stays until you choose. | as above | label = text | n/a | NS-01-R7 |
| `photos.book.letter.replacePhotoAsk.confirm` | BRANCH | Use this photo | as above | label = text | Use this photo | NS-01-R7 |
| `photos.book.letter.replacePhotoAsk.keep` | BRANCH | Keep the first | as above, the safe default | label = text | Keep the first | NS-01-R7 |
| `photos.book.letter.replacePhotoUndo` | BRANCH | Photo changed. | B-S11.undo, with `photos.book.letter.undo` "Undo" (T4 window) | announced; Undo reachable until the window closes | Undo | NS-01-R38a to R38c |
| `photos.book.letter.removePhoto` | BRANCH | Take the photo off | B-S11.actions | label = text | Take the photo off | NS-01 s3 |
| `photos.book.letter.removed` | BRANCH | Photo taken off. | B-S11.undo, with Undo | as above | Undo | NS-01-R38a |
| `photos.text.label` | BRANCH | Words about this photo | B-S11.words | field label; hint `photos.text.hint` | Words about this photo | NS-01-R21a |
| `photos.text.optional` | BRANCH | Optional | as above | read after the label | n/a | NS-01-R21a |
| `photos.text.hint` | BRANCH | Up to 140 characters. Only what you type is kept. | as above | hint | n/a | NS-01-R21a, R21b |
| `photos.text.placeLabel` | BRANCH | Where was this? | B-S11.words | field label; hint `photos.text.placeHint` | Where was this? | NS-01-R21a |
| `photos.text.placeHint` | BRANCH | Up to 60 characters. Only what you type is kept. | as above | hint | n/a | NS-01-R21a |
| `photos.book.letter.notSaved` | BRANCH | The photo did not come along with this letter. Your words are kept, and you can add it again. | B-S08.photoNotStored (that session only) with `addPhoto` below | label = text | n/a | NS-01-R58 |
| `photos.book.letter.missing` | BRANCH | Not on this phone any more | B-S08.photoMissing (that session only) | label = text | n/a | NS-01-R56 |
| `photos.book.letter.missingRemove` | BRANCH | Remove | as above, author only | label = text; hint `photos.book.letter.missingRemoveA11y` (PROPOSED) "Takes the photo off this letter." | Remove | NS-01-R56 |
| `photos.capture.openFailed` | BRANCH | That photo could not be opened. Choose another. | B-S11.pickFailed (new state; letter-page add; area A shows the same line on Ready) | announced once | n/a | NS-01-R17a |
| `photos.capture.iCloudOffline` | PROPOSED | This photo is in iCloud and needs a connection. | B-S11.iCloudOffline | announced once | n/a | NS-01-R46 (s16 intent) |
| `photos.capture.iCloudProgressA11y` | PROPOSED | Getting the photo from iCloud | B-S11.iCloudDownloading, with the system progress trait and `en.common.cancelButton` | label; value is the system's percent | Cancel | NS-01-R17b; appendix A exemption covers the system progress trait only |

On a second phone, or the other parent's letter, the letter reads whole with no picture slot and no words (NS-01-R28, R9c). Nothing on this screen says where pictures are kept: that line waits for counsel (NS-01 s12 Shown line).

## 11. B-S12 Mark a first (NS-06 Part A)

Firsts strings may not match README appendix A, nor say milestone, track firsts, never miss a first, typical, most babies, or any count (NS-06 A16).

| Key | Status | Text | Where | VO | VC | Card row |
|---|---|---|---|---|---|---|
| `firsts.markLabel` | PROPOSED | This was a first | B-S08 row 2, off and on, and Review (A-S07) | switch; label = text; state announced | This was a first | NS-06-A1, A11 |
| `firsts.labelField` | PROPOSED | In your words, if you like | B-S12.labelSheet, the field's visible label; no placeholder, no example | field label | In your words, if you like | NS-06-A1 |
| `firsts.labelHelp` | PROPOSED | Up to 40 characters. Only what you type is kept. | B-S12.labelSheet and B-S12.atLimit, under the field | hint | n/a | NS-06-A1, A22 (card gap G7) |
| `firsts.unmarkedToast` | PROPOSED | No longer marked as a first. | B-S12.undo, with `en.common.undoButton` "Undo" for the T4 window | announced; then Undo | Undo | NS-06-A2a, A2b |
| `firsts.cardKicker` | PROPOSED | A first | Book cards (B-S01, B-S05); also row 2's read-only text on B-S08.otherParent when the label is empty | read first in the card label | n/a | NS-06-A3, A17 |
| `firsts.rowReadOnly` | PROPOSED | A first: {label} | B-S08.otherParent row 2, and row 2's second line for the author; `{label}` is the parent's typed label | label = text | n/a | NS-21 s5 (read-only facts) |
| `firsts.lens` | PROPOSED | Firsts | B-S03 | radio | Firsts | NS-06-A3 |

At 40 grapheme clusters the field takes no more and draws nothing new (NS-06 A5). A failed write uses `en.letter.rows.saveFailed` (NS-06 A6 failed row says "the standard save error"; this is the letter page's one line).

## 12. B-S13 Hide until a day, B-S14 Open now, B-S16 the hidden row, B-S18 the opened line, B-S22 Recently deleted (NS-06 Part B)

Seal words: never "locked", "unlock", "secure", "vault", "sealed forever", "time capsule", "wax", "delivered to your child", "when they turn 18", any loss or ending word, any countdown. "Seal" and "sealed" are internal and never reach a parent (NS-06 Terms). The words below speak of a day and of opening, which are about time, not endings.

### B-S13 Hide until a day (sheet)

| Key | Status | Text | Where | VO | VC | Card row |
|---|---|---|---|---|---|---|
| `seal.hideButton` | PROPOSED | Hide until a day | B-S08 row 4 (author, own letter, not sealed, not a quiet day) and Review | label = text; hint `seal.hideA11y` "Choose a day for this letter to open." | Hide until a day | NS-06-B1, B16 |
| `seal.sheetTitle` | PROPOSED, same words as `seal.hideButton` (reuse) | Hide until a day | B-S13 title | heading | n/a | NS-06 B15 |
| `seal.dateLabel` | PROPOSED | Opens on | B-S13 the system date picker's label (tomorrow to the 25th birthday) | label | Opens on | NS-06-B11 |
| `seal.body` | PROPOSED | Only you can see it until that day. Then it opens for everyone who reads {child}'s book. | B-S13 | label = text | n/a | NS-06 B12 Shown line ("Only you can see it until that day") |
| `seal.dayFixed` | PROPOSED | The day cannot be changed later. You can open it early at any time. | B-S13 | label = text | n/a | NS-06 B3 (no change of day; Open now) |
| `seal.limitZone` | PROPOSED | It opens at the start of that day where you are now. West of here, that can be the evening before. | B-S13, small | label = text | n/a | NS-06 B12 honest limit 1; B5 travel row |
| `seal.limitClock` | PROPOSED | If this phone's clock is set ahead, it opens early on this phone. | B-S13, small | label = text | n/a | NS-06 B12 honest limit 2; B16 |
| `seal.limitStored` | PROPOSED | Hiding keeps it out of sight. It is stored like every other letter. | B-S13, small | label = text | n/a | NS-06 B12 honest limit 3 ("hidden, not locked"; see card gap G6); counsel Q43 |
| `seal.confirmButton` | PROPOSED | Hide it | B-S13 confirm | label = text | Hide it | NS-06-B1 |
| `en.common.cancelButton` | EXISTS | Cancel | B-S13 | label = text | Cancel | NS-06 B6 interrupted row |
| `seal.hiddenA11y` | PROPOSED | Hidden until {date}. | announced once after Hide it | announcement | n/a | NS-06 B4 |

A day in the past or today is never offered, so no line refuses one. `SCSEL` (a refused push) is never shown (NS-06 B6 failed row). A failed local write uses `en.letter.rows.saveFailed`.

### B-S08 row 4 on a sealed letter, and B-S14 Open now

| Key | Status | Text | Where | VO | VC | Card row |
|---|---|---|---|---|---|---|
| `seal.rowLabel` | PROPOSED | Hidden until | B-S08.sealedAuthor row 4; value `{date}` | "Hidden until {date}" | n/a | NS-21 s3 row 4 |
| `seal.openNowButton` | PROPOSED | Open now | B-S08.sealedAuthor row 4 action | label = text; hint `seal.openNowA11y` "Asks first." | Open now | NS-06-B3 |
| `seal.openNowTitle` | PROPOSED | Open this letter now? | B-S14.confirm | heading | n/a | NS-06 B16 |
| `seal.openNowBody` | PROPOSED | It cannot be hidden again. | B-S14 | label = text | n/a | NS-06-B3 |
| `seal.openNowConfirm` | PROPOSED, same words as `seal.openNowButton` (reuse) | Open now | B-S14 confirm | label = text | Open now | NS-06-B3 |
| `en.common.cancelButton` | EXISTS | Cancel | B-S14, the default | label = text | Cancel | NS-06-B3 (default Cancel) |
| `seal.openedA11y` | PROPOSED | This letter is open now. | announced once after Open now; no toast, no motion | announcement | n/a | NS-06-B3, B4 (no celebration) |

### B-S16 The hidden row in the Book (author's phones only)

| Key | Status | Text | Where | VO | VC | Card row |
|---|---|---|---|---|---|---|
| `seal.bookRow` | PROPOSED | Hidden until {date} | B-S16.default, under the card's own date line; no words, no picture, no first label | label `seal.bookRowA11y` "{label}. Hidden until {date}." (`{label}` is the card's date line, `{date}` the chosen day); hint `en.reader.openHint` "Opens the letter." | the card's date line (filled) | NS-06-B2; B6 VoiceOver row |

Other phones get nothing: no row, no marker, no words (NS-06-B8). No string exists for them, by design.

### B-S18 The opened line on Home (slip 2, opening day only)

| Key | Status | Text | Where | VO | VC | Card row |
|---|---|---|---|---|---|---|
| `seal.homeOpened` | PROPOSED | A letter you hid until today is open now. | B-S18.default, once, on the opening day; kicker is the letter's own date; words show only after the tap | label `seal.homeOpenedA11y` "A letter you hid until today is open now. Opens the letter." | the visible line | NS-06-B4 |
| `en.common.notNowButton` | EXISTS | Not now | B-S18 dismiss | label = text | Not now | NS-06-B4 (shown at most once) |

### B-S22 Recently deleted row (area C's screen; the seal row's words are area B's)

| Key | Status | Text | Where | VO | VC | Card row |
|---|---|---|---|---|---|---|
| `seal.deletedRow` | PROPOSED | A letter hidden until {date} | B-S22 row title; no words | label = text, then the shelf's `en.settings.delete.erasesOn` | n/a | NS-06-B25 |
| `en.settings.delete.entryTitle` | EXISTS | Delete this letter? | B-S15.confirmSealed | heading | n/a | NS-06-B25 |
| `en.settings.delete.entryBody` | EXISTS | It waits in Recently deleted for 30 days. | as above | label = text | n/a | NS-06-B25 |
| `en.settings.delete.keepButton` | EXISTS | Keep it | the default (card gap G3) | label = text | Keep it | NS-21-R7a; NS-06-B25 |
| `en.settings.delete.entryConfirm` | EXISTS | Delete letter | confirm | label = text | Delete letter | NS-21-R7a |
| `seal.accountDeletionLine` | PROPOSED, for area C's delete-account sheet | Letters you hid until a day are deleted too. They do not open for anyone. | area C's account deletion sheet | label = text | n/a | NS-06-B18; ruling D6 |

## 13. B-S15 Delete and the Book's Undo (NS-21-R7)

| Key | Status | Text | Where | VO | VC | Card row |
|---|---|---|---|---|---|---|
| `en.settings.delete.entryTitle` | EXISTS | Delete this letter? | B-S15.confirm | heading | n/a | NS-21-R7a |
| `en.settings.delete.entryBody` | EXISTS | It waits in Recently deleted for 30 days. | B-S15 | label = text | n/a | NS-21-R7b |
| `en.settings.delete.keepButton` | EXISTS | Keep it | B-S15 default | label = text | Keep it | NS-21-R7a |
| `en.settings.delete.entryConfirm` | EXISTS | Delete letter | B-S15 | label = text | Delete letter | NS-21-R7a |
| `en.settings.delete.entryToast` | EXISTS | Letter deleted. | B-S15.undo (on the Book), with `en.common.undoButton` "Undo" by tap, no timer (built) | announced; Undo | Undo | NS-21-R7b |

## 14. B-S17 One past letter on Home (slip 4) and B-S21 the Me switch (NS-23)

The kicker is the letter's own date (no "A month ago", no "A year ago", no "on this day", no "since", no "memories", no count). The fragment is the parent's own words, a verbatim prefix.

| Key | Status | Text | Where | VO | VC | Card row |
|---|---|---|---|---|---|---|
| `en.tonight.resurfaced.kicker` | EXISTS, retired when `EXPO_PUBLIC_PAST_LETTER` is on | A month ago | today's built card only (flag off) | label = text | n/a | NS-23 s3 (replaced) |
| `en.tonight.resurfaced.a11y` | EXISTS, retired with the kicker | A letter from {date}. Opens the letter. | flag off only | label | n/a | NS-23 (replaced) |
| (kicker) | none | the letter's date by `Intl.DateTimeFormat` | B-S17.default | first in the card label | the visible date | NS-23 s16 |
| `en.tonight.pastLetter.a11y` | PROPOSED | {date}. {label}. Opens the letter. | B-S17.default, one element; `{label}` is the verbatim fragment in the letter's language | card label | the visible date | NS-23-R7 |
| `en.tonight.pastLetter.notTodayButton` | PROPOSED | Not today | B-S17.default, the small quiet dismiss | label = text; hint `en.tonight.pastLetter.notTodayA11y` "No past letter on Home until tomorrow." | Not today | NS-23-R14, s16 |
| `en.settings.pastLetters.label` | PROPOSED | Past letters on Home | B-S21, the Me switch | switch; label = text | Past letters on Home | NS-23-R4, s16 |
| `en.settings.pastLetters.help` | PROPOSED | When today's date matches a letter from an earlier month or year, Home can show it. | B-S21 footer | read after the switch | n/a | NS-23 s3 choice rule; s16 bans "on this day" without a glossary entry |

Absent (no match, switch off, dismissed, quieted or hidden book, pick failed): nothing on Home, no placeholder (NS-23 s5, s6). The App lock snapshot shows no fragment (NS-23-R11): no string.

## 15. B-S19 Read together, whole book or one year, and B-S20 its end (NS-24, built `read-together.tsx`)

| Key | Status | Text | Where | VO | VC | Card row |
|---|---|---|---|---|---|---|
| `en.readTogether.title` | EXISTS | Read together | B-S19.default top bar; in B-S19.year the filled year name (`en.book.years.*`) replaces it | heading | n/a | built |
| `en.readTogether.nowReading` | EXISTS | Month {month} [middot] From {signsAs} | B-S19 dateline | read without the dot: "Month 4, from Mama" | n/a | NS-24 s6 VoiceOver |
| `en.readTogether.nowReadingNewborn` | EXISTS | The first weeks [middot] From {signsAs} | as above | as above | n/a | built |
| `en.readTogether.nowReadingBefore` | EXISTS | Before You [middot] From {signsAs} | as above | as above | n/a | built |
| `en.readTogether.positionA11y` | EXISTS | Letter {n} of {count} | B-S19, VoiceOver only (a position within what is read, not a count of gaps) | announced | n/a | NS-24 s6 VoiceOver |
| `en.readTogether.playButton` / `pauseButton` / `replayButton` | EXISTS | Play / Pause / Hear it again | B-S19 | label = text | Play / Pause / Hear it again | built |
| `en.readTogether.nextButton` | EXISTS | Next letter | B-S19 | label = text | Next letter | NS-24 s6 Voice Control |
| `en.readTogether.previousButton` | EXISTS | Back one | B-S19 | label = text | Back one | as above |
| `en.readTogether.autoplayLabel` | EXISTS | Keep playing | B-S19 | switch | Keep playing | built |
| `en.readTogether.noRecording` | EXISTS | This one was typed. Read it aloud together. | B-S19.typed | label = text | n/a | NS-24 s5 |
| `en.readTogether.recordingElsewhere` | EXISTS | {signsAs}'s voice is on their phone. Read this one aloud together. | B-S19.recordingElsewhere, B-S19.newPhone | label = text | n/a | NS-24 s5 |
| `en.readTogether.empty` | EXISTS | Letters you add to the book will be here to read together. | never reached from the Book (Read together is absent on an empty book) | label = text | n/a | NS-22-R4 |
| `en.readTogether.endOfMonth` | EXISTS | That was Month {month}. | B-S20 after a month (built) | label = text | n/a | built |
| `en.readTogether.endOfYear` | PROPOSED | That was {label}. | B-S20.endOfYear; `{label}` is the year row's filled name, "Asha's first year" | label = text | n/a | NS-24 s4 step 4 |
| `en.readTogether.endOfBefore` | PROPOSED | That was every letter from Before You. | B-S20.endOfYear for Before You | label = text | n/a | NS-24-R5 |
| `en.readTogether.endOfBook` | CHANGED (was "That is every letter so far. More are still being written.") | That is every letter in the book. | B-S20.endOfBook | label = text | n/a | NS-24 s4 step 4 reuses it; "so far" and "still" are on the appendix A gap list (card gap G5) |
| `en.readTogether.againButton` | EXISTS | Read it again | B-S20 | label = text | Read it again | built |
| `en.readTogether.finishButton` | EXISTS | Close the book | B-S20 | label = text | Close the book | NS-24 s4 step 4 |
| `en.readTogether.nextMonthButton` | EXISTS | On to Month {month} | B-S20 after a month (built); never at the end of a year | label = text | On to Month {month} | NS-24-R1 (a year ends at its last letter) |

The year view carries no title, summary, highlight, recap or count (NS-24-R2, s14). No moment fires on finishing a year; `en.moments.firstReadTogether` stays as built and is not duplicated.

## 16. B-S23 Read-along (NS-29): decision record only

No strings. When it reopens, any public line must say only what ships: today `rules.test.ts` blocks word-by-word highlighting claims until v1.1.

## 17. Error messages, per code and state

What happened, what the parent can do; never blame, never fear. Codes that show nothing are listed so engineering never invents a line for them.

| Code or state | Screen | What the parent reads | Key |
|---|---|---|---|
| Find view `failed` (even the scan threw) | B-S06.failed, B-S06.failedGettingReady | Find could not look just now. / Try again; while the index is not ready, also: Find is getting ready on this phone. | `find.error`, `en.common.tryAgainButton`, `find.notReady` |
| Find index missing, untrusted, `degraded`, FTS5 absent, integrity failure, `find_index_rowid` | B-S06 | nothing (the scan answers; NS-02-R19, s10) | none |
| `killSwitches.bookSearch` on; `EXPO_PUBLIC_BOOK_SEARCH` off | B-S01 | nothing (no Find action) | none |
| `photo_pick_failed`, `photo_reencode_failed`, `photo_bake_timeout`, `unreadable` (`not_jpeg`, `corrupt`, `needs_rotation`), `failed` | B-S11 at pick | That photo could not be opened. Choose another. | `photos.capture.openFailed` |
| `no_space`, `photo_path_refused`, `photo_temp_name_refused`, `picked_file_outside_picker_folder`, `baked_file_outside_folder`, `photos_folder_unknown` (commit after the pick) | B-S08.photoNotStored | The photo did not come along with this letter. Your words are kept, and you can add it again. (No cause named.) | `photos.book.letter.notSaved` |
| iCloud-only picture, offline | B-S11.iCloudOffline | This photo is in iCloud and needs a connection. | `photos.capture.iCloudOffline` |
| Stored file missing (this session) | B-S08.photoMissing | Not on this phone any more / Remove | `photos.book.letter.missing`, `missingRemove` |
| `killSwitches.photos` on; `EXPO_PUBLIC_PHOTOS` off | B-S01, B-S03, B-S08 | nothing (no lens, no picture controls) | none |
| `SCPHO` (server refuses a picture) | none | nothing (the phone never sends one) | none |
| `SCSEL` (server refuses a seal change) | none | nothing (a rejected write the author never sees; NS-06 B6) | none |
| `22023` on a malformed `seal_since` | none | nothing (sync internal) | none |
| A row's local write failed (day, first, picture words, hide until a day, Open now, who can read it) | B-S09.failed, B-S10.failed, B-S12.failed, B-S11, B-S13 | That change did not save. The letter is as it was. | `en.letter.rows.saveFailed` |
| Quiet or Hide write failed | B-S02.failed | That did not save. {child}'s book is as it was. | `en.children.quiet.saveFailed` |
| Letter not in the book (deleted elsewhere while open) | B-S08.notFound | This letter is not in the book / It is in Recently deleted. / Open Recently deleted / Back to the book | `en.reader.*` |
| Past-letter pick throws | B-S17 | nothing (NS-23 s6) | none |
| A letter cannot render in Read together | B-S19 | nothing; it is skipped (NS-24 s6) | none |
| A screen could not draw | any | area E's `en.errors.crash` | area E |

## 18. Empty states

| Screen | What shows | Key |
|---|---|---|
| B-S01.empty | The first page is waiting. / Tell {child} one thing about today. / Write a letter (moves to Home) | `en.book.empty.bookTitle`, `bookBody`, `bookCta` |
| B-S03, B-S04, B-S05 with 0 pictures or 0 firsts | nothing: no lens, no hint (NS-01-R10c, NS-06-A3) | none |
| B-S06.noMatch | No letters with that word. | `en.book.empty.searchTitle` (CHANGED) |
| B-S07 with no year that has letters | no year rows, no section title | none |
| B-S17 with no match | nothing on Home | none |

## 19. Notifications

Area B sends none. A seal opens with no notification (NS-06-B4, B8 battery row); a past letter never reaches a notification or the lock screen (NS-23 s14); Find, Firsts, lenses and Read the year back send nothing. The existing birthday message (`en.notifications.birthday`, "Happy birthday to {child}" / "A year of letters. Want to read them together today?") is area D's; if it is ever tapped into Read the year back, it carries no child name on a lock screen with previews hidden (area D owns that rule, NS-32).

## 20. Rules run over every new or changed string

Checked by hand against `BRIEF.md` section 2 and `rules.test.ts` (the test itself was not run: these strings are not in `packages/content` yet).

- Characters: ASCII only; no dash, curly quote, ellipsis character or emoji. No exclamation mark (in-app budget untouched).
- Fear, guilt, loss (`FEAR` regex): no match. Seal lines speak of a day and opening; none says last, final, forever, gone, locked or sealed.
- Machine writing (`AI` regex, "rewrit"): no match. No line says the app picks, chooses by meaning, describes or suggests.
- Gender: no pronoun for anyone; `{child}` only. "{signsAs}'s voice is on their phone" is existing and uses "their".
- Gaps and counts: no number of letters, pictures, firsts, days or years in any new string; no "yet", "still", "so far", "missing", "since", "in a row", "progress" (appendix A). `positionA11y` is an existing position line inside Read together.
- Internal words (CR-25): no take, entry, draft, pack, lens, index, seal or sealed in any parent string. "Firsts" is the lens's parent name; "lens" stays in code.
- Buttons (keys ending `Button`, `Cta`, `Action`, at most 22 characters as written and with "Asha"): Go to a month (13), Not today (9), Open now (8), Hide it (7), Hide until a day (16), Write a letter (14). Sheet rows are not button keys but stay short: Quiet this book (15), Turn Quiet off (14), Add a photo (11).
- "we" and "our": none.
- On-device claims (`ON_DEVICE_ONLY`): no new string says letters stay on the phone, "only you can read" or "nobody else". `seal.body` says "Only you can see it until that day", the card's own Shown line, which is true of other people's phones (NS-06-B8) and is in the claims check below.
- Glossary: "letter", "book", "month", "recording", "photo"; "Read together" two words, capital R only; "Before You" as built; no "memory", "moment", "album", "journal", "milestone", "on this day", "chapter".
- US spelling (D-087): no UK forms.
- Placeholders: only `{child}`, `{date}`, `{label}`, `{a}`, `{b}`, `{n}`, `{month}`, `{signsAs}`, `{coParent}`, `{duration}`, all allowed.
- Error and state titles carry no full stop (`seal.openNowTitle`, `en.book.menu.hideTitle` and `photos.book.letter.missing` are a question or a fragment; `find.error` is a body line, not a title).
- Toasts vary their endings (VOICE.md, "kept" in toasts): "... quiet for you.", "Quiet is off ...", "... in Hidden books.", "No longer marked as a first.", "Photo taken off."; none ends in "kept".

## 21. Card gaps

| Id | Card row | What is missing or wrong | Proposed default |
|---|---|---|---|
| G1 | NS-22 s16 | Cites "the existing `children.quiet.*` keys"; none exist on `develop` (also DESIGN.md G-04). F12 D2's proposed text ("No prompts, reminders or notes", "Turn notes back on") uses "notes" for what the app sends, which the glossary bans. | New keys under `en.children.quiet.*` as above; the copy is reviewed with a perinatal loss and NICU organisation before C1 as F12 asks. |
| G2 | NS-22-R7 | "Unquiet" is an English adjective meaning troubled, so "Unquiet this book" (DESIGN.md intent) reads oddly to a tired parent. | "Turn Quiet off", with Quiet as the named state. R7's "no other wording changes" holds. |
| G3 | NS-21-R7a vs NS-06-B5 table and B25 | NS-21 says the delete default is "Keep it" (D-085); NS-06 says "default Cancel" for a sealed letter. | One confirm for every letter: "Keep it" is the default; it is the same safe action. |
| G4 | NS-23 s16 | Bans "on this day" unless the glossary carries it, while its own footer intent says "One letter you made on this day, now and then" (also in DESIGN.md B-S21). | `en.settings.pastLetters.help` states the rule without the phrase. |
| G5 | NS-24 s4 step 4; appendix A | The year view ends on "the existing end of the book", whose words hold "so far" and "still" from the appendix A gap list. Appendix A applies only to the scans it names. | Change `en.readTogether.endOfBook`; add `endOfYear` and `endOfBefore`; propose adding Read together keys to the appendix A scan. |
| G6 | NS-06 B12 vs appendix A seal list | B12 asks `content` to word "hidden in the app, not locked"; appendix A's seal list fails any string with "locked". | `seal.limitStored`: "Hiding keeps it out of sight. It is stored like every other letter." Counsel reads it under Q43. |
| G7 | NS-06 A5, A15 | At 40 graphemes "the field ... says nothing else"; a VoiceOver user then gets no reason the typing stopped. The card also does not say how a mark with an empty label shows in Months, which leaves it signalled by nothing. | An always-present helper (`firsts.labelHelp`, the same shape as the photo fields), and a small "A first" kicker on every marked card (`firsts.cardKicker`), never colour alone. |
| G8 | NS-02-R39 | The built `find.notReady` says "still", which s16 bans. | CHANGED to "Find is getting ready on this phone." |
| G9 | NS-24 s16 | Intent "{child}'s first year" needs ordinals; the card is silent beyond the fifth year and on a book with no name. | Keyed ordinals for years 1 to 5, "{child}'s year {n}" after, "Year {n}" with no name. |
| G10 | NS-02 s16 | Row template "{date}. {sentence}. Opens the letter." uses `{sentence}`, which is not an allowed placeholder; #798 uses `{label}`. | Keep `{label}` (built). |
| G11 | NS-23-R14, s15 | "Not today" sits on Home near "Not much today"; Voice Control may confuse the two spoken names. | Keep the card's words; the device row for NS-33 checks "Tap Not today" and "Tap Not much today" both land. If they do not, "Hide for today" is the fallback (PROPOSED). |
| G12 | NS-01-R11, NS-06-A4 | Silent on the month openers' "{count} letters" line inside a lens, where it could read as a count of pictures or firsts. | Openers under Photos and Firsts show no count line. |
| G13 | NS-06 B4 | The opened line has no dismiss; every slip needs a button for gesture-free users. | `en.common.notNowButton`. |
| G14 | NS-22 s5 | A hidden book opened from Hidden books is read-only, but the card names no line that says so. | `en.book.hiddenNote`. |

## 22. Engineering gaps

| Backlog row | Gap |
|---|---|
| BL-952 (Find) | `find.en.ts` is only on #798; it needs a `features/index.ts` entry and a per-surface row in `rules.test.ts` (P8 rule) or an opt-out with a reason. `find.retry` and `find.cancel` duplicate common keys; drop them for `en.common.*`. R37's announcement is not in #798. |
| BL-931, BL-956 (photos) | `photos.en.ts` is only on #840; same `features/index.ts` and per-surface row. `iCloudOffline`, `iCloudProgressA11y` and `missingRemoveA11y` have no key on the branch. |
| BL-938, BL-985, BL-965 (header, Quiet keys) | `en.children.quiet.help` is the Quiet row's subtitle in B-S02's sheet (`ListRow` subtitle, built). `bookCopy` moves into `en.book` in the same PR (standing duty), with `monthsButton` renamed to "Go to a month". |
| BL-937 (letter page) | Row 3 and the R58 line use "Add a photo" (CHANGED from the branch). One failure line (`en.letter.rows.saveFailed`) for every row write; each row's feature calls it rather than adding its own. |
| BL-968 (Firsts), BL-970 (seals) | New files `features/firsts.en.ts` and `features/seal.en.ts`, each with a per-surface row; appendix A's scan named in NS-06-A5, A12, B9 is not in `rules.test.ts` yet. |
| BL-946 (past letter) | `tonight.resurfaced.*` stays until the flag is removed; then it is deleted, not reused. |
| BL-947 (year) | Year names need an ordinal lookup, not a sentence built in code (s8 localisation). |
| BL-954 (Undo) | `firsts.unmarkedToast`, `photos.book.letter.removed` and `replacePhotoUndo` each follow T4; no Undo control outlives its window. |

## 23. Reconciliation with DESIGN.md

Pass 1 (20 Nov): `DESIGN.md` grew from a skeleton to the full file while this one was written; every state id here now uses its names (B-S01.hiddenReadOnly, .lensPhotos, .lensFirsts; B-S02.quieted, .ax3, .failed; B-S06.idle, .short, .results, .noMatch, .failed, .failedGettingReady; B-S07.withYears; B-S08.ownSpoken, .ownTyped, .ownNoPicture, .withPicture, .otherParent, .readItBack, .waiting, .sealedAuthor, .recordingElsewhere, .notFound, .photoNotStored, .photoMissing; B-S09.failed; B-S10.failed; B-S11.actions, .replaceConfirm, .undo, .words; B-S12.labelSheet, .atLimit, .undo, .failed; B-S14.confirm; B-S15.confirm, .confirmSealed, .undo; B-S16.default; B-S17.default, .dismissed, .switchOff; B-S18.default; B-S19.year; B-S20.endOfYear, .endOfBook).

States this file needs that `DESIGN.md` does not list yet: B-S11.pickFailed, B-S11.iCloudOffline, B-S11.iCloudDownloading (NS-01-R17a, R17b, R46 on the letter-page add path).

Words where `DESIGN.md` carries an intent and this file proposes different words. Once the founder approves, these words are the ones built; the design lead updates the intents and the prototype labels:

| Item | DESIGN.md | WORDS.md | Why |
|---|---|---|---|
| R1 | Go to a month keeps the built "Months" label (B-S01 layout row 1; VC list) | "Go to a month" | NS-22 s3 renames it; with the lens, two controls named "Months" in one bar break Voice Control |
| R2 | "Unquiet this book" | "Turn Quiet off" | card gap G2 |
| R3 | Quiet toast "Quiet for now." | "{child}'s book is quiet for you." | says for whom (Quiet is per person); "for now" hints at a time limit Quiet does not have |
| R4 | Quiet failure "That did not change. Try again." | "That did not save. {child}'s book is as it was." | names what did not finish and what is true (VOICE.md) |
| R5 | Lens group label "Show" | "Show letters by" | VoiceOver hears a whole phrase before "Months, selected" |
| R6 | Photos lens VoiceOver "Has a photo" | "Photo with this letter" (built `photos.book.photos.a11yCard`) | one fixed phrase everywhere (NS-01-R9a) |
| R7 | Index footnote "Still getting ready." | "Find is getting ready on this phone." | NS-02 s16 bans "still"; card gap G8 |
| R8 | Find row VoiceOver "{date}. {sentence}. Opens the letter." | "{date}. {label}. Opens the letter." | `{sentence}` is not an allowed placeholder; built key |
| R9 | Year group "Read a year"; year row hint "Reads this year's letters together." | "Read a year together"; "Opens Read together at the first letter of this year." | names the place it opens |
| R10 | Picture row "Photo" with value "Change" | "Photo" with the parent's photo words as its value; Change photo inside B-S11.actions | a value that is a verb reads as a second button |
| R11 | Picture words sheet "A few words about this photo, if you like", "Where, if you like" | built `photos.text.label` "Words about this photo" with "Optional", `placeLabel` "Where was this?" | the branch words are already in #840 for approval; one set, not two |
| R12 | "The photo did not come along. Your words are kept." | built `photos.book.letter.notSaved` (adds "and you can add it again") | the built line also says what the parent can do |
| R13 | Firsts unmark toast "No longer marked as a first." | same (adopted from DESIGN.md) | clearer than a line that names the lens |
| R14 | Firsts field "In your words, if you like" | same (adopted from DESIGN.md) | echoes "in your own words" |
| R15 | Hide sheet confirm "Hide" | "Hide it" | a whole verb phrase for VoiceOver and Voice Control |
| R16 | Open now confirm "Open it now" | "Open now" | the card's words (NS-06 B16); the row button and the confirm share one Voice Control name |
| R17 | Seal-opened line "Opened today: the letter you kept for today." | "A letter you hid until today is open now." | "kept" is the Keep step's word, and every letter is kept; the parent hid this one |
| R18 | Sealed card VoiceOver "{date}. Hidden until 10 January 2027. Opens the letter." | label "{label}. Hidden until {date}." with the hint "Opens the letter." | two dates need two placeholders; the hint stays a hint |
| R19 | End of book keeps the built "That is every letter so far. More are still being written." | "That is every letter in the book." | card gap G5 |
| R20 | Me footer "One letter you made on this day, now and then." | "When today's date matches a letter from an earlier month or year, Home can show it." | card gap G4 |
| R21 | Recording row "Kept on this phone" (NS-08 words, area C) | built `en.book.recordingOnPhone` "Recording kept on this phone" until area C changes it | one owner; area C's WORDS.md decides |

## 24. Claims check

Lines that make a promise to a parent, and the card Claims section (or ruling) they stay inside. None of these is public copy; no store or website line is proposed here. Any public line ("Find a letter by a word in it, even offline", "Mark a letter as a first, in your own words", "Keep a letter for a day you choose", "Read a year of letters together", "Add a picture to a letter") waits for its claims row and the flag in `production`, as each card says.

| Line | Promise | Stays inside |
|---|---|---|
| `seal.body` "Only you can see it until that day. Then it opens for everyone who reads {child}'s book." | Nobody else's phone holds it before the day; it opens on its own | NS-06 B12 Shown line; B8, B20 (0 rows to others); B18 Claims forbids "locked", "secure", "sealed forever", none used. True on the author's own phone only for people who cannot open the app there; the limits below say so. Counsel Q43 |
| `seal.limitZone`, `seal.limitClock`, `seal.limitStored` | The honest limits | NS-06 B12 (CR-62); B5 travel and clock rows; B13 residual risk (not end-to-end encrypted). Counsel Q43, Q54 |
| `seal.dayFixed` "The day cannot be changed later. You can open it early at any time." | No re-seal, no change of day; Open now always works | NS-06-B3; B9 remote pause row (Open now stays in every build) |
| `seal.accountDeletionLine` "Letters you hid until a day are deleted too. They do not open for anyone." | Deletion before the day means never published | NS-06-B18; ruling D6 |
| `en.children.quiet.help` "Home and reminders stay quiet about {child}, for you. Your letters stay as they are." | What Quiet stops; letters untouched; per person | F12-REQ-011; NS-22 s6 two parents; J-N19 (past letter and Save a copy slip stop too) |
| `en.children.settings.hideBody` (existing) "... Nothing is deleted." | Hide deletes nothing | built; F12 |
| `en.letter.whoCanRead.onlyYouHelp` "Kept out of the book, for you alone." | The other parent cannot read it | NS-21 s12; NS-06-A17 (`book_entries` serves only visible letters). Read with the privacy promise: staff access stays as the Privacy Policy lists |
| `en.letter.whoCanRead.inBookHelp` "Everyone who reads {child}'s book can read it." | Who reads a letter in the book | NS-21 s12; v1.0 family is the co-parent only, and the line names no role |
| `firsts.labelHelp`, `photos.text.hint`, `photos.text.placeHint` "Only what you type is kept." | The app writes no label, photo words or place | NS-06-A22 (writing tools off, ruling D2; if React Native cannot switch them off, this line is not true until `mobile`'s finding is closed, and it ships only after a founder decision); NS-01-R21b, R50 |
| `en.settings.pastLetters.help` | The rule by date, not by meaning | NS-23 s19 forbids "we pick your best letters" and any machine choosing by meaning; none said |
| `find.buttonHint`, `find.fieldHint` | Find looks through the letters' words | NS-02 s19 forbids "search your recordings", "find anything you said", "smart", counts; none said. A word a small fix removed is not found; no line claims it is |
| `photos.book.letter.notSaved` "Your words are kept" | The letter is kept when its picture is not | NS-01-R17a, R58 |
| `en.readTogether.endOfBook` "That is every letter in the book." | Read together read them all | true of what it reads (in-book letters with words); private, sealed and waiting letters are not in the book's reading (NS-24-R3) |

Nothing here promises a backup of pictures, "safe forever", "free forever", a count, or that the app understands a picture or a letter.

## 25. v2 additions from the final pack (20 Nov; all PROPOSED, intent for `content`, founder approves)

Words rules: "reminder" for anything the app sends, never "note"; "slip", never "strip"; no exclamation mark; no count; no "journal", "memory", "moment", "on this day". Strings below are intent, not final copy.

| Key (PROPOSED) | Intent | Where | Row |
|---|---|---|---|
| `en.book.more.printRow` | "A book to hold" | B-S02.printOn (absent when the print flag is off) | FR-PRT-16 |
| `en.book.fromName.fixed` | One plain line: the name on this letter cannot be changed here; the letter can be deleted | B-S08.fromNameFixed | FR-PRV-22 |
| `en.book.fromName.changeTitle` | A short title for the name sheet | B-S08.fromNameChange | FR-PRV-22 |
| `en.seal.limitNever` | It is never sent to anyone while it is hidden | B-S13, fourth footnote line; counsel reads | FR-LEG-06 |
| `en.book.media.add` | "Add a photo or video" | B-S08 media row (round 2) | direction 26 |
| `en.book.media.atLimit` | One calm line, no number | B-S08 where the row was | direction 26 |
| `en.book.media.video` | "Video with this letter" (VoiceOver fallback) | B-S08, B-S04 | direction 26 |
| `en.book.media.deleteLine` | Its pictures and videos wait in Recently deleted with the letter | B-S15.confirm | direction 26 |
| `en.book.media.downloading` | "Getting it from iCloud." | B-S08.mediaDownloading | direction 26 |

No string exists for a day in the Book, because the Book shows none (DESIGN section 12a). No string describes a picture (constitution). The slip words for a day are Home's (`days.landing.*`, area A and NS-46).

Claims check: nothing here makes a public promise beyond the card's; "never sent to anyone while it is hidden" is a promise and stays inside NS-06-B12 once counsel has read it (FR-LEG-06).
