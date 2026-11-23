# Review opens on a quiet default (spec, 23 Nov 2026)

Status: PROPOSED, for the Chief Design Officer and Karma to read. Owner: `product`. Backlog rows: BL-1710 (this spec), BL-1788 (the one line under each Keep button, written with it so Review is touched once). Source findings: NEU-010 and PER1-004 in `docs/design/review-2026-11-22/`, with the exec review's evidence ruling in section 13.5 and 13.5a item 4 of `DESIGN-BACKLOG.md`. Screen spec it adjusts: A-S07 in `docs/design/e2e/A-capture/DESIGN.md`.

Evidence limit: this is a reading of source on `origin/develop` at `29ea7945e` (23 Nov 2026), mainly `apps/mobile/src/app/review.tsx` lines 880 to 905 and 1000 to 1200, `review-view.logic.ts` and `packages/content/src/strings.en.ts`. No phone or simulator was run, the SE 3 sitting (BL-1705, BL-1700) has not happened and has no named operator (D-169, item 4), and the five-parent check (BL-1714, PRD 28 O-01, due 24 Nov) has not run. The row asked for the spec to wait for BL-1705; I wrote the default from the code and the sitting amends it (section 8). Nothing here says Review was tested on a device.

## 1. What changes, and what does not

A tired parent has just spoken a letter and wants to put the phone down. Review should show her words, tell her small fixes were marked, and offer Keep. Every control stays; only the default weight changes (NEU-010). Nothing is removed, no fix is hidden from the words (the marks in the letter stay where they are), and no step is added to Keep.

## 2. What Review shows today

From the code, for a spoken letter whose words are ready, top to bottom:

1. The one-time note "Please have a read" with "Got it" (`review.firstNote`, shown until dismissed).
2. The stop line when a take ended early.
3. The letter sheet: the "To {child}" and day lines, then the words with the machine's marks (struck for taken out, dotted for changed).
4. The view control, "With small fixes | Exactly as said", a full-width 44 pt pill pair. It shows whenever the machine proposed at least one fix (`showViewControl`, `review-view.logic.ts` line 36).
5. The count line: "{count} small fixes" as a tappable row that folds the fix rows (`review.tsx` lines 1119 to 1138), or a static sentence when there are none.
6. The fix rows, folded until the count row is tapped.
7. "Change words", a quiet small button.
8. The picture block, then Let it go (not read for this spec; unchanged).
9. The pinned footer: "Add to {child}'s book" as the primary, "Keep private" as a quiet button. At accessibility text sizes the footer is placed inside the scroll instead of pinned (`review.tsx` lines 1186 to 1194).

Other Review states (waiting for words, short take, empty take, typed letter, a letter whose words arrived later, save failed, development sample words, the Plus sheet at the Keep gate) are not changed by this spec.

## 3. The quiet default

For a spoken letter with words ready, Review opens showing:

- the letter sheet with its marks, as now;
- one line under the words, the count row, saying how many small fixes there are and that they are marked (section 4);
- the primary Keep, "Add to {child}'s book", and the quiet "Keep private", each with one plain line saying what it changes (section 5);
- Play and Close in the top bar, as now.

One tap away, behind the count row: the view control "With small fixes | Exactly as said", the fix rows, and "Change words". Tapping the row opens all three together and tapping it again folds them. The count row is the only new disclosure and it already exists as a control.

Rules for the fold:

- The count row exists whenever the machine proposed at least one fix, because the view control is only shown then (`showViewControl`). So after a parent chooses "Exactly as said", or puts every fix back, the row is still there and she can get back.
- When the machine proposed no fix (a short clean letter, a language with no fix rules, a typed letter), there is nothing to fold. "Change words" stays visible where it is today, as one quiet button.
- The marks in the words are never folded. VoiceOver still reaches each fix by its row and by the mark.
- The fold does not remember its state across Reviews. A new Review opens folded. If a parent opens it, it stays open until she leaves that Review.
- Keep does not read the fold. Keep, Keep private and the Plus gate behave exactly as now (D-082, D-083; `review.tsx` header comment).
- "One Keep" means one primary button. There is no third destination button and no merged button, because Keep private is a separate choice (PER1-004).

The one-time note "Please have a read" is not changed here (section 7, question 2).

## 4. The line about small fixes, and the evidence for "every"

The row asked this spec to settle whether every `verifyEdits` change is visibly marked before any line says "every". It is not settled in the way the line wants, so the line must not say "every".

What the code shows (the 23 Nov trace, `DESIGN-BACKLOG.md` 13.5a item 4, read again here only where I cite a line):

- Every applied edit becomes a segment (`packages/core/src/pipeline.ts` lines 323 to 345) and is drawn in the words (`apps/mobile/src/components/capture/transcript.tsx`) and listed as a fix row (`review.tsx` lines 1140 to 1155). So the count in "{count} small fixes" is the number of marks the parent can see. UNVERIFIED visually for a `paragraph` edit, whose change is whitespace only; it still gets a fix row.
- Some changes to the words are not edits and carry no mark: dashes become commas, curly quotes become straight, an ellipsis character becomes three dots, non-breaking spaces become spaces, double spaces collapse (`normalizeFinal` in `packages/core/src/text.ts` lines 166 to 189, applied at `pipeline.ts` lines 272 and 301), and non-speech tags such as `[BLANK_AUDIO]` are stripped before the transcript is stored (`stripNonSpeech`, `text.ts` lines 207 to 221). This also applies in "Exactly as said".
- The founder locked the reply on 22 Nov (D-169, item 2): "Every change is marked" is reworded to "every word we change" through BL-1711, with content rules, CLO and privacy review, and counsel when engaged. Nothing ships in a store build before that review.

So the evidence for "every" is: true for edits, false for character normalisation, and the wider line is held under BL-1711. The rule for this spec:

- The line under the words may say that the fixes it counts are marked, and nothing wider. It is bound to the count: it describes the marks that exist.
- It does not use "every", "all", "nothing else changed", "exactly as you said" or any word that says the letter was not otherwise changed.
- Illustrative shape, words by `content`: "2 small fixes, marked in your words." The existing `review.changesLabel` and `changesLabelOne` are the count; `content` decides whether the marked clause is added to them or sits in a hint.
- When BL-1711 clears, `content` may widen the line. That is a separate content change.

The label "Exactly as said" also overclaims, because the same normalisation runs under it. That is existing text and belongs to BL-1711, not to this spec.

## 5. The line under each Keep button (hand-off to BL-1788)

PER1-004: she cannot tell what each button changes. `content` writes one plain line per button; this section gives the facts and the limits. The facts are from code and decisions; `privacy` checks them against the PRD privacy rows before the words merge.

| Button | What it changes, today | Source |
|---|---|---|
| Add to {child}'s book | The letter is in the book and Read together plays it. Anyone the book is shared with can read it. In a store build nobody else is shared with, because no co-parent door is in a store build | `readableInBook` (`quiet-day.logic.ts` line 53); D-161, D-162 |
| Keep private | The letter is kept in the Book for the writer, marked with a "Private" chip, and left out of Read together and out of any sharing | `letter-card.tsx` line 149; `readableInBook` |

Limits for the words:

- Do not mention a printed book. D-010 says digital only in v1, so the printed-book clause in PER1-004 and the BL-1788 row cannot be true yet and is dropped.
- Do not say who else can read it in a way that is false for a one-parent phone. Say what the button does to the letter, not about people who are not there. The two-parent audience line is BL-1819.
- One sentence each, no "we", nothing that says or implies the app wrote or shaped anything, and the content rules (no dashes, curly quotes, ellipsis characters or emoji; `{child}` for the child; no counting of gaps).
- `listen.audience` ("Only you, until you add it to the book.") stays; the new lines do not repeat it word for word.

Placement: under its own button, in the same footer, in `footnote` size and muted tone. In the save-failed state the primary reads "Try again" and the caution line already sits above it; the lines are not shown in that state. At accessibility text sizes the footer is already inside the scroll (section 2, item 9), so the lines scroll with it. For VoiceOver the button's hint carries the same words once and the visible line is not read a second time. Whether the footer pushes the words off screen at the largest text size cannot be known until a simulator or device run, so it is a check for the BL-1700 sitting and the build row, not a claim here.

## 6. Requirements

One behaviour per id. Given the evidence limit, each has a unit or source-text test as its check; device rows are added when the sitting runs.

| Id | Given, When, Then | Satisfies | Test title |
|---|---|---|---|
| QD-01 | Given a spoken letter with words ready and at least one proposed fix, When Review opens, Then the view control, the fix rows and "Change words" are not visible and the count row is | NEU-010 | `[QD-01] opens folded` |
| QD-02 | Given QD-01, When the count row is tapped, Then the view control, the fix rows and "Change words" are visible and the count row is announced as expanded | NEU-010 | `[QD-02] one tap opens every control` |
| QD-03 | Given the parent chose "Exactly as said", When Review shows, Then the count row is still present | NEU-010 | `[QD-03] way back stays` |
| QD-04 | Given a letter with no proposed fix, When Review opens, Then "Change words" is visible and there is no fold | NEU-010 | `[QD-04] nothing to fold` |
| QD-05 | Given any applied edit, When Review opens folded, Then its mark is in the words | NEU-010, 13.5a item 4 | `[QD-05] marks never folded` |
| QD-06 | Given the count line, When its words are read by the content rules test, Then they contain none of "every", "all", "exactly", "nothing else" | NEU-010, D-169 item 2 | `[QD-06] no wide claim` |
| QD-07 | Given Keep and Keep private, When either is tapped in the folded or open state, Then the result is the same as before this change, including the Plus gate | D-082, D-083 | `[QD-07] keep unchanged` |
| QD-08 | Given the primary and quiet buttons, When Review shows, Then each has one line saying what it changes, and neither mentions a printed book | PER1-004, D-010 | `[QD-08] one line each` |
| QD-09 | Given the save-failed state, When Review shows, Then the lines under the buttons are not shown and the caution line is | PER1-004 | `[QD-09] failed state unchanged` |
| QD-10 | Given a new Review after one where the fold was opened, When it opens, Then it opens folded | NEU-010 | `[QD-10] fold does not persist` |

Door lines (COORDINATION section 10): not needed. Add to the book and Keep private choose where a letter sits; they are not a consent, sign-in, share or deletion, and Review writes no consent row. Never: no entry text, transcript, audio or child name goes to analytics or logs; the existing `review_action` events carry an action name only.

## 7. Open questions

| # | Question | Who | Default if no answer | By |
|---|---|---|---|---|
| 1 | Is folding the view control and "Change words" quiet enough, and does the count row read as a control at the largest text size | Chief Design Officer, then the five-parent check | The fold in section 3 stands | Fri 27 Nov 2026 (the gate date, D-169) |
| 2 | The first-time note is the heaviest thing on a first Review and is also an in-app disclosure (K-14; same words as the web contribution note). Should it get lighter | CLO and `privacy` (it is disclosure text), with the Chief Design Officer | Unchanged. This spec does not touch it | Fri 27 Nov 2026 |
| 3 | Build before or after the SE 3 sitting | Karma | Build after this spec merges, and change it if the sitting disagrees. The sitting has no operator (D-169, item 4), so waiting has no date | Fri 27 Nov 2026 |
| 4 | Wider "every" line | founder and counsel through BL-1711 | Not shipped. Section 4 limits apply | the founder's own 27 Nov counsel date |

No decision reserved for the founder is made here. Question 4 is already the founder's under BL-1711.

## 8. What this does for other rows

- BL-1788 can start from section 5 once this spec is merged and BL-1710 is done. The row's printed-book clause is removed (D-010).
- A mobile build row for sections 3 and 6 is not filed in `docs/BACKLOG.md`. BL-1710 says "product, then mobile". Karma decides whether product files it now or after the sitting.
- BL-1711 is not touched. BL-1793 and BL-1794 (VoiceOver on Review) are not touched; the fold has to keep their order, which is why QD-02 says the row is announced as expanded.

## 9. Not verified

- No device, simulator or SE 3 run. Whether the folded Review feels quieter is a judgment for the five-parent check, not something I measured.
- Items 7 to 9 in section 2 beyond the lines I read, and Let it go, were not read in full.
- The `paragraph` mark's visibility (section 4).
- That `privacy` agrees the two facts in section 5 match the PRD privacy rows. I did not read the privacy rows end to end.
