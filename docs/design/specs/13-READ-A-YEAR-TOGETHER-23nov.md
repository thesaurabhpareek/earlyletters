# Read a year together, and Read from here (spec, 23 Nov 2026)

Status: PROPOSED, for the Chief Design Officer and Karma to read. Owner: `product`. Backlog rows: BL-1735 (this spec), BL-1792 (builds "Read from here" from it). Source findings: CDO-B-045 and PER3-007 in `docs/design/review-2026-11-22/` (cited, not copied). Product rules it sits inside: NS-24 and NS-22 in `docs/product/prd/10-reading-and-family.md`; screens B-S07, B-S19, B-S20 in `docs/design/e2e/B-book-and-reading/DESIGN.md` and their words in `WORDS.md`.

Evidence limit: everything below is a reading of source on `origin/develop` at `29ea7945e` (23 Nov 2026). No phone, simulator or SE 3 sitting was run, and nothing here says a screen was tested on a device. Where a fact is a guess it is marked UNVERIFIED.

## 1. What "Read a year together" is

A grandparent or a parent opens the Book, taps "Go to a month", and sees a group called "Read a year together" above the months. It has one row per year of {child}'s life that has letters: "{child}'s first year", "{child}'s second year", and "Before You" for letters dated before the birth. Tapping a row opens Read together at the first letter of that year. The pages turn oldest first, as Read together always does. The last page is that year's last letter. After it comes one closing page that says the year is finished, with "Close the book" and "Read it again".

That is the whole feature. It adds no summary, highlight, count, recap or "year in review" (NS-24 section 3, NS-24-R2). Reading stays free for every letter, on a lapsed plan too (D-082, D-083, NS-24-R10).

## 2. What is already built, and what is not

The review that filed CDO-B-045 said the year view "does not exist in the app". That is out of date. On `29ea7945e` the following exist, behind the flag `EXPO_PUBLIC_READ_THE_YEAR`, which `apps/mobile/test/g6-production-flags-off.test.ts` (line 38) lists among the card flags that must be off in production:

| Part | Where | State |
|---|---|---|
| Year keys, labels, row dates, year filter, end-of-year line | `apps/mobile/src/components/book/read-year.logic.ts`, tests in `read-year.logic.test.ts` | built, tested as logic |
| Year rows in the Months sheet, above the months | `apps/mobile/src/components/book/months-sheet.tsx`; wired at `apps/mobile/src/app/(tabs)/book.tsx` lines 168 to 169 and 544 | built, flag off |
| Read together over one year, end line | `apps/mobile/src/app/read-together.tsx` lines 55 (`year` param), 67, 143 | built, flag off |
| Words | `packages/content/src/strings.en.ts`: `book.years.*`, `book.monthsHintWithYears`, `readTogether.endOfYear`, `readTogether.endOfBefore` | exist, marked PROPOSED in a comment |

Not built, and what this spec settles: the end-of-year behaviour for a year still running (section 4), "Read from here" (section 5), and which build turns the flag on (section 8, question 1). Whether a screen-level test covers the wiring from a year row to the screen is UNVERIFIED: I read the logic test, not a screen test.

## 3. The list order (the BL-1792 gate)

PER3-007 assumed the list "ends oldest first" and said it did not read the order. I read it.

- `listEntriesForChild` (`apps/mobile/src/lib/store.ts`) calls `listForChild`, which returns letters newest first: `ORDER BY occurred_on DESC, captured_at DESC, id DESC` (`apps/mobile/src/lib/db/repos/entries.ts` line 179, in `listForChild`).
- Read together reverses that list (`read-together.tsx` line 67, `.reverse()`), so it plays oldest first. The assumption holds.
- The Months sheet lists months newest first and the year rows newest first (`read-year.logic.ts` `yearRows`, sorted by year number descending). The Book is newest first.
- So a later letter in a long book is up to N minus 1 "Next letter" taps from the start, which is the finding.

## 4. End of the year

| State | What the parent sees at the end | Why |
|---|---|---|
| A year that has finished (its last day is before today) | The closing page with `readTogether.endOfYear` ("That was {label}.") where `{label}` is the row's name; "Close the book"; "Read it again". Same page layout and motion as the end of the book | built, NS-24 section 4 step 4 |
| Before You | The closing page with `readTogether.endOfBefore` | built, NS-24-R5 |
| The year still running (its row date range ends today, `yearRows` clamps the end to today) | The end-of-book closing page (`readTogether.endOfBook`), not `endOfYear` | "That was Asha's third year" says the year is over while more letters can still be added. Default, product's call; content may reword the line |
| Any year, "Read it again" | Returns to the year's first letter. It does not widen to the whole book | built: `onAgain` calls `go(0)` on the year's list |
| Any year, "Close the book" | Back to the Book where the parent left it, with the sheet closed | built: `router.back()` |

Rules for the closing page: no "On to the next year" button, no "On to Month" button, no count, no ordinal of letters, no sentence the parents did not say apart from the existing page words (NS-24-R2, `WORDS.md` row `nextMonthButton`). A year with one letter is one page and then the closing page. A year row only exists when the year has a letter Read together can play (NS-24-R4), so the closing page is never reached empty.

I changed no requirement. The "year still running" row is new behaviour; it is the one place where this spec adds to NS-24, and it needs no new words because `endOfBook` exists. `endOfBook` currently reads "That's every letter so far." and `WORDS.md` gap G5 already proposes "That is every letter in the book." Wording stays with `content`.

## 5. Read from here

A parent can start Read together at a letter or at a month, so a later letter is not many taps away (PER3-007). Reading starts there and runs oldest first to the end of the book, across month and year boundaries. It does not stop at the end of the month.

Two entry points, both shared with the year rows through one change to Read together: it accepts a letter id, `from`, next to `childId` and `year`.

1. Letter page (B-S08). A first row in the "This letter" list, "Read from here" (words by `content`), with the book glyph used by the year rows, at least 56 pt, one line at default size. Shown on a letter Read together can play: in the book, with words, not waiting, not private (the same filter as `readableInBook`, `quiet-day.logic.ts` line 53). Shown to the other parent on their letters too, since reading is not an editing control. Absent on a private or waiting letter. It starts at that letter.
2. Months sheet (B-S07). Each month row keeps its single tap, which goes to the month as built. Each row gains a visible second control at its trailing edge, "Read from here", a 44 pt minimum target, for sighted touch. At accessibility text sizes the control moves under the row text, full width. For VoiceOver the row stays one element and "Read from here" is an accessibility action on that row, not a separate element; the visible control is hidden from VoiceOver so it is not read twice. A control nested inside a row that is one VoiceOver element would be unreachable, so the action is the VoiceOver path. Voice Control reaching the visible control is UNVERIFIED; if a real-phone check shows it cannot, the control becomes its own labelled element for everyone. It starts at the first playable letter of that month, by about-day then capture time. A month with no playable letter shows no second control.

How it plays:

- The list is the whole book, oldest first, opened at the chosen letter. "Back one" still goes to earlier letters; the progress hairline and the VoiceOver position ("Letter n of m") use the whole book. I chose this over a list cut at the start letter so a grandparent who starts too late can go back without leaving and starting again.
- If `year` and `from` are both present, `year` wins and `from` is ignored. The interface never sends both.
- If the letter id is no longer playable when the screen opens (deleted, made private, words waiting), Read together opens at the first letter and says nothing.
- The closing page is the end-of-book page.

Place in the build order. The letter-page and Read together rows share files, and their file order is BL-1790, BL-1789, BL-1791, BL-1823 (`docs/BACKLOG.md`). BL-1792 goes after BL-1823, last, because it adds a row to the letter page's "This letter" list and a `from` param to Read together, and it must start from the layout those four settle. BL-1798 (the Large print floor, CDesO ruled) builds after BL-1791 and BL-1786. It does not collide with this spec: it changes the reading size of letter text and offers the Aa sheet in Read together; this spec adds a start letter, a row and a control. If both are in flight the only shared file is `read-together.tsx`, so they merge in order, not together.

## 6. Requirements

One behaviour per id. Device column: the check that is run today is a unit or source-text test; the SE 3 sitting (BL-1700) adds device rows later and is not run here.

| Id | Given, When, Then | Satisfies | Test title |
|---|---|---|---|
| RYT-01 | Given a book with letters in two years and the flag on, When the Months sheet opens, Then "Read a year together" lists those years newest first, then the months, and a year with no playable letter has no row | CDO-B-045, NS-24-R4 | `[RYT-01] year rows newest first, empty year absent` |
| RYT-02 | Given a finished year, When its last letter is turned past, Then the closing page shows `endOfYear` with that year's name, and no next-year or next-month button | CDO-B-045, NS-24 s4 | `[RYT-02] finished year closes on its own line` |
| RYT-03 | Given the year still running, When its last letter is turned past, Then the closing page shows `endOfBook` | CDO-B-045 | `[RYT-03] running year closes on the book line` |
| RYT-04 | Given Before You, When its last letter is turned past, Then the closing page shows `endOfBefore` | NS-24-R5 | `[RYT-04] Before You closing line` |
| RYT-05 | Given a closing page of one year, When "Read it again" is tapped, Then Read together returns to that year's first letter | CDO-B-045 | `[RYT-05] again stays inside the year` |
| RYT-06 | Given a letter page for a playable letter, When "Read from here" is tapped, Then Read together opens on that letter and Back one goes to the one before it | PER3-007 | `[RYT-06] read from a letter` |
| RYT-07 | Given a private or waiting letter, When its letter page opens, Then there is no "Read from here" row | PER3-007, NS-24-R3 | `[RYT-07] no start on an unplayable letter` |
| RYT-08 | Given a month row in the Months sheet, When "Read from here" is tapped, Then Read together opens on that month's first playable letter, and tapping the row body still goes to the month | PER3-007 | `[RYT-08] read from a month` |
| RYT-09 | Given `from` names a letter that is no longer playable, When Read together opens, Then it opens on the first letter with no message | PER3-007 | `[RYT-09] stale start falls back to the first letter` |
| RYT-10 | Given accessibility text sizes, When the Months sheet opens, Then each month's visible "Read from here" is at least 44 pt, and the row is one VoiceOver element whose actions include "Read from here" with the visible control hidden from VoiceOver (if Voice Control cannot reach it on a real phone, it becomes its own labelled element for everyone) | PER3-007 | `[RYT-10] action only for VoiceOver, 44 pt control for touch` |
| RYT-11 | Given a lapsed plan, When any of the above runs, Then it reads in full | D-082, NS-24-R10 | `[RYT-11] free with a lapsed plan` |

Existing requirements this reuses without change: NS-24-R1 to R10 (year boundaries, due-date-only book shows Before You only, year decided by `occurred_on`, call mid-page keeps the page, screen awake while reading).

Door lines (COORDINATION section 10): not needed. Nothing here is a consent, a sign-in, a share or a deletion. Never: no letter text, child name or picture goes to analytics or logs; the existing `trackReadTogetherStarted` carries a count and an access class only. No new data is stored.

## 7. Words

Existing keys, unchanged: `book.years.*`, `book.monthsHintWithYears`, `readTogether.endOfYear`, `readTogether.endOfBefore`, `readTogether.endOfBook`, `readTogether.againButton`, `readTogether.finishButton`. New, written by `content` under BL-1792 and checked by the content rules test: the "Read from here" label and its VoiceOver hint. Intent for the hint: it says where reading will start, in plain words, and uses no count.

One conflict between two design documents, settled here as a default: `WORDS.md` lists `book.monthRange` as each year row's second line, and the FR-DAT-03 row in `DESIGN.md` (B, the file where it actually lives) said "year rows no subtitle", now reworded (CDESO-5). The build shows the date range. I read FR-DAT-03 as banning ordinals and totals, and a date range is neither, so the range stays. The Chief Design Officer may overrule.

## 8. Open questions

| # | Question | Who | Default if no answer | By |
|---|---|---|---|---|
| 1 | Which build turns `EXPO_PUBLIC_READ_THE_YEAR` on? It is a scope and dates call (CR-73), so it is the founder's, on Karma's recommendation | founder | Off in the store build submitted for the 1 Dec cut. On in the first 1.0.x after BL-1792 merges and its tests pass | Fri 27 Nov 2026 (the gate date in D-169) |
| 2 | Placement of "Read from here" in the Months sheet (second control per row) and on the letter page (first row of "This letter") | Chief Design Officer | RULED: section 5 stands; keep 8 pt between the month row's tap area and its Read from here control. BL-1792 starts from it | before BL-1792 is picked up, and no later than Fri 27 Nov 2026 |
| 3 | Closing line for a year still running, and the `endOfBook` reword (gap G5) | `content` | RULED as to limits: running year uses `endOfBook` as built; no wording that says every letter in the book (private and waiting letters are skipped); words stay with content | Fri 27 Nov 2026 |
| 4 | Date range as the year row's second line (section 7) | Chief Design Officer | RULED: keep the range | Fri 27 Nov 2026 |

No question here is reserved for the founder except question 1.

## 9. What this does for other rows

- BL-1792 can start from section 5 once this spec is merged and BL-1735 is done.
- BL-1736 ("Read a year together" exists for a grandparent) is not filed in `docs/BACKLOG.md`; it lives only in the design backlog. Its scope after this spec is smaller than L: the year rows and closing page are built, so what remains is questions 1 and 3, the screen-level tests RYT-01 to RYT-05, and RYT-11. Product files it when Karma asks.

## 10. Not verified

- No device or simulator run. Nothing here is a measurement.
- Whether a screen test covers a year row opening Read together (section 2).
- Whether Read together keeps the screen awake while reading (NS-24-R9 is marked NEEDS EVIDENCE in the PRD and I did not check).
- That `readableInBook` is the only filter between the Months sheet's month rows and what Read together can play. I read the filter and the list call, not every caller.
