# 4. Firsts, sealed letters and quick capture

Status: DRAFT, 11 Nov 2026 (UTC). Docs only. Author: `design-systems`. Index, tags and the 12-line review: `NEW-SCOPE-INDEX-11nov.md`. Sources: NX-44 Firsts (PR #790 head `d80db1f2`, a PROPOSAL; its FD-1 says "Default if no answer: not built"); DEBATES.md lines 82, 104 and 105 on sealed letters and quick-capture surfaces (EVIDENCE: pm-3 owns sealed letters; pm-1 owns quick-capture surfaces); `USER_RESEARCH.md` R21 and `COMPETITIVE_RESEARCH.md` line 179 (a competitor offers sealed letters; I did not open the sources behind them).

Three parts, one pattern. Parts A and B are enrichers: they add to a letter that exists, in Review or on the letter page. Part C says quick capture is not a second entry. Nothing here may add a control that starts a letter outside Home (J3).

## A. Firsts

### A1. Job

One sentence: I mark a letter as a first, in my own words. (11 words, verb "mark".) A first is a mark on a letter, never a letter. The founder has not asked for Firsts by name (NX-44); the brand rules make milestone features risky (NX-44 section 1). Everything below follows NX-44's non-goals: no suggested list, no typical age, no count, no badge, no machine detection, no machine label, no notification, no analytics.

### A2. Where

| Place | Control | Notes |
|---|---|---|
| Review (end of Home's capture) | A `Toggle` row "This was a first" with a `TextField` that appears when on | The quickest place: the parent has just said it |
| Letter page (Book) | Same row in the "Add to this letter" group | Marks a letter already kept |
| Book, Firsts lens | Reads only | Absent until one letter is marked (NX-44 R4) |
| Home | None | Home never suggests, prompts or counts firsts |

### A3. Layout

Review and letter page (inside the existing scroll, after the words and photos, before Keep):

```
 [ ] This was a first                  <- Toggle row, 56 pt
 -- when on --
 What was it?  (optional)              <- label above the field
 [ ................................ ]  <- TextField, 40 characters, no placeholder examples
```

- No placeholder text like "first word" or "first steps" (NX-44 R3: nothing suggested). The label above the field is plain: it asks for the parent's words and says they may leave it empty.
- Empty label is allowed. At 40 characters the field stops; it says nothing about a limit beyond the stop (NX-44 U2).
- Typing and dictation are the parent's (that iOS dictation sends no text to us beyond the field, and any dictation-to-server path Apple uses, are UNVERIFIED; handed to `privacy`). No autocomplete, no autocorrect (`autoCorrect` off), no predictive row suggestions (UNVERIFIED that iOS lets an app turn off the QuickType bar; `autoCorrect={false}` and `spellCheck={false}` are the known props).
- Turning it off removes the mark and the label with a `Toast` "Undo" (NX-44 R2).

### A4. The Firsts lens

`LensRow`: "Months", "Photos" (if any), "Firsts" (only if one is marked). A letter card in this lens shows the label as the first line (type `label`), then the date line, then the opening words as kept. No count anywhere: not in the lens label, not in VoiceOver, not in export file names (NX-44 R5). Newest first. No empty state exists because the lens is absent when empty.

### A5. States

| State | Behaviour |
|---|---|
| None marked | No Firsts lens, no hint, no empty state (NX-44 H3) |
| Label empty | Card shows its normal first line (NX-44 U1) |
| Marked, then unmarked | Disappears from the lens with Undo; if it was the last, the lens row loses the item without a message |
| Letter deleted | Mark goes with it; Recently deleted restores both (NX-44 U3) |
| Offline, signed out | Works on the phone (NX-44 U5) |
| Sync conflict | Later write wins for mark and label only (NX-44 U4) |
| Error saving | `ErrorLine` plus "Try again" (slot); the letter is not affected |
| Another parent's letter | The toggle is absent (own letters only, HYPOTHESIS; defer to F11 on conflict, as NX-44 R9) |

### A6. Motion

Toggle: system. Label field: `enter` 8 pt, 280 ms; Reduce Motion `fadeMs`. Marked card in the lens: no celebration, no stamp, no animation of any kind (NX-44 non-goal: no celebration animation that rewards marking). The only visible change is the row itself.

## B. Sealed letters

### B1. Job

One sentence: I keep a letter closed until a day I choose. (10 words, verb "keep closed".) The founder has not asked for this by name in the documents I read; it is a competitor feature and a research request (EVIDENCE as cited above). It is the highest-risk item in this spec because of the brand rules and the truth rule, so it is shelved by default (Q2).

### B2. The rules that shape it

1. **Time and love, never endings.** The legacy rule: "Legacy is about love and time, never endings" (CLAUDE.md). A seal opens on a date or on the child's age. It is never described as for after the parent is gone, never "in case", never a will.
2. **No countdown.** The sealed row shows the opening date only. Never "42 days left", never a progress ring, never a count of sealed letters (celebrate what exists; never count gaps).
3. **Truth.** The words are on the phone. Unless the seal is real cryptography with a key the app cannot read, the honest promise is "hidden in the Book until", not "locked" or "sealed forever". The word "sealed" in the UI is a content and counsel decision (COUNSEL-READ); the design works with any single word. A seal never stops the parent opening the letter early (the author may unseal, DEBATES line 105) and says so.
4. **The words are untouched.** Sealing changes how a letter is shown, not what it says. `raw_transcript` and the kept text are not altered (constitution). Hidden does not mean encrypted; any claim beyond hidden needs `security` and `privacy`.
5. **Not a place to start.** A seal is added to a letter, in Review or on the letter page. There is no "write a sealed letter" button.

### B3. Where

| Place | Control |
|---|---|
| Review | A row "Close this letter until a day" with a `DateField`, or a choice "until {child} is {age}" computed from the birthday (age math in `packages/core`) |
| Letter page | Same row in "Add to this letter" |
| Book | A `SealedRow` in the month it belongs to, showing the date line and the opening day only; no words, no photo, no recording control |
| Home | On the opening day, the one memory slot may show it (Q4); never before |

### B4. Layout

Review row:

```
 Close this letter until a day            <- ListRow, chevron, 56 pt
   (a Sheet opens)
   Opens on  [ 12 Jun 2044 ]    or    [ Choose an age ]
   You can open it any time.              <- plain line (slot)
   [ Done ]
```

In the Book:

```
 SAT 14 OCT                         From {signsAs}
 A closed letter. Opens 12 Jun 2044.        <- one line, no words, no glyph that implies danger
 [ Open it now ]                            <- quiet, 44 pt
```

- The letter card for a sealed letter is flat (a row, not a raised card), because a raised card means a letter you can read here (NAV-TAB-ROLES R1).
- "Open it now" asks once ("Open this letter early?") with a `Dialog` whose default button is Cancel; opening removes the seal permanently for that letter and the letter reads normally.
- Voice: the sealed row never names what the letter is about.

### B5. Components

`SealedRow` (NEW, a `ListRow` variant with a quiet Phosphor `Envelope` glyph, decorative), `DateField` (exists in ML), `Dialog` (COMPONENTS 2.13), `Sheet`, `Button quiet`. No new tokens.

### B6. States

| State | Behaviour |
|---|---|
| No sealed letters | The row is only in Review and the letter page; the Book shows nothing about seals |
| Date in the past or today | The seal is not offered (the picker minimum is tomorrow); the letter opens now |
| Opening day arrives | The letter becomes a normal letter at local midnight of the chosen date; no push, no badge (a reminder is a Q4 opt-in); if the app is open, it updates on the next read |
| Clock set back or time zone change | The date uses the local date at read time (`roomClock`, as NX-43 U6); a letter never opens early because of a time zone shift (UNVERIFIED how `roomClock` behaves) |
| Find, lenses, recordings list, Share | A sealed letter contributes nothing to any of them until it opens (FS-R10); its photos are not in the Photos lens, its first label is not in the Firsts lens, its photo descriptions and label are not searched |
| Share | Not offered (03 section 4) |
| Read together | Skipped until open |
| Export | Included as data with its seal date (the person's own data, PRIV; the PDF book omits the words of a sealed letter until open: Q5) |
| Co-parent, handover at 18 | Sealed letters open at handover (DEBATES line 82); the flow is pm-2 and pm-3's, not designed here |
| Offline, signed out | Works on the phone |
| Backup/sync | A sealed letter's words sync like any letter; hidden is a display rule (UNVERIFIED how it interacts with the other parent's phone: they would see the words unless the seal syncs too; must be answered by `data-architect` before any build) |

### B7. Motion

Row appears with `enter`; Reduce Motion `fadeMs`. Opening early or on the day: a `fadeMs` cross-fade from the closed row to the card. No envelope-opening animation, no confetti, no sound. (The calm brand does not reward.)

## C. Quick capture is not a second entry

### C1. Decision

"Quick capture" means the shortest path from a cold open, the Lock Screen, a widget or a hardware control to a letter in progress. All of these open Home's capture in its Ready state (spec 5). None creates a letter itself, none has its own behaviour, and none appears as a control on Book or Me.

| Surface | Status | Source |
|---|---|---|
| Home screen (Speak, Type, Not much today, Start from a photo) | The entry | spec 1, 5 |
| Home Screen and Lock Screen widget | P1 in F04, "first to cut"; opens `/listen?entry=widget` in Ready; static, no child name, no data (F04-REQ-020) | F04 lines 51 and 118 (EVIDENCE) |
| Siri and App Shortcuts, Action button, Control Center control | v1.1 candidate; no Expo path found; native module and spike needed (F04 line 69, UNVERIFIED) | F04 |
| Apple Watch | Not designed; pm-1's (DEBATES line 93) | |

### C2. What the navigation test treats as an entry

Define an **entry** as a UI control inside the app's tab screens that calls the capture start function (`startCapture`). OS surfaces and deep links reach the same function through one routed doorway to Home and are listed in the test's allow-list with their name; a new one fails the test until `design-systems` adds it (06 section 10).

### C3. A first, quickly?

No separate quick capture for firsts. A parent who has just said the first words of a first laugh turns the toggle on in Review (A2), which takes one tap. A "Say a first" button on Home would be a second verb on the capture cluster and would ask the parent to decide before they speak what it will be (HYPOTHESIS: more thinking than a tired parent wants).

## D. Copy slots (for `content`)

| Slot | Intent | Limits and rules |
|---|---|---|
| `firsts.toggle` | "This was a first" row | NX-44 R1 words are content's |
| `firsts.labelLabel` | Label above the label field | Asks for their words; optional; no examples |
| `firsts.undoToast` | After unmarking | Uses the existing Undo word |
| `firsts.lens` | Lens name | One glossary word; no count |
| `firsts.cardA11y` | Card name: "{label}. {date}." | No count |
| `firsts.saveError`, `.retry` | Error | |
| `seal.row` | Row in Review and letter page | 28 characters or fewer; never "lock", "secret" or a promise of security unless true |
| `seal.sheetTitle`, `.opensOn`, `.chooseAge`, `.openAnytime` | Seal sheet | "Time, not endings"; no "when I am gone" or any loss word |
| `seal.bookLine` | "A closed letter. Opens {date}." | No countdown, no count |
| `seal.openNow`, `.openNowConfirmTitle`, `.openNowConfirmBody`, `.openNowConfirmButton` | Early open | Confirm default is Cancel |
| `seal.homeOpened` | The Home slot on the day it opens | One line; the parent's words only appear when they tap |
| `capture.quick.*` | Widget names and descriptions | Static; no child name (F04-REQ-020) |

Door lines.
- Firsts. Shown: the toggle and optional field. Records: one boolean and up to 40 characters on the letter, on the phone and with the letter on sync and in export. Never: a list, a count, a notice, an analytics event. Decline: do not mark; unmark in one tap (NX-44 section 8, EVIDENCE).
- Seal. Shown: the row, the date or age, and the line that the parent can open it any time. Records: a seal date on the letter; where it is stored and whether it syncs is for `data-architect` (UNVERIFIED). Never: a countdown, a count, a push about it by default, any claim of secrecy the build cannot back. Decline: no seal; open early in one tap.

## E. Requirements (working ids FS-R#)

| Id | Requirement | Proof |
|---|---|---|
| FS-R1 | Firsts follow NX-44 R1 to R12 unchanged, with the control placed in Review and on the letter page only | per NX-44 |
| FS-R2 | No count. Given any number of firsts or seals, Then no screen, VoiceOver string, export file name or notification contains a count of them | grep test on strings; device |
| FS-R3 | Nothing offered. Given Home, Then no firsts prompt and no seal prompt appears. The one exception is `seal.homeOpened`: on the day a seal ends, the memory slot may show that letter once (Q4) | navigation test; device |
| FS-R10 | A sealed letter contributes nothing. Given a sealed letter, Then until it opens it adds nothing to the Photos lens, the Firsts lens, the recordings list, a first label, a photo description, Find, Share, Read together, or the PDF book; its row shows the date only. When it opens, it appears in each at once. Closing a letter removes it from each at once | unit tests per surface; device |
| FS-R4 | Enrich only. Given Review or a letter page, When a parent marks a first or seals, Then that letter changes and no letter is created | unit test |
| FS-R5 | Seal is display only and truthful. Given a sealed letter, Then its words and recording are unchanged and the UI says "hidden" or an approved word, never a stronger one than the build supports | `security`, `privacy`, `legal` |
| FS-R6 | No countdown. Given a sealed row, Then it shows a date and nothing that counts down | device; content rules |
| FS-R7 | Opens by itself, never early by accident. Given the chosen day, Then the letter opens at local midnight of that date, not before, whatever the time zone | unit test with clock injection |
| FS-R8 | Quick capture surfaces reach one function. Given any doorway, Then it opens Home's Ready state and the navigation test lists it | navigation test |
| FS-R9 | Accessibility. Toggle announces its state; the seal sheet is readable at AX5 with the date field not truncated; the closed row reads "A closed letter, opens {date}" and does not mention content | device |

## F. The 12-line job-clarity review

| # | Firsts | Seal | Quick capture |
|---|---|---|---|
| J1 | Pass: "I mark a letter as a first, in my own words." | Pass: "I keep a letter closed until a day I choose." | Pass: "I start a letter by talking with one touch." |
| J2 | Pass: enricher, not a tab verb | Pass | Pass: it is Home's Say |
| J3 | Pass: no starter | Pass: no starter | Pass: doorways only, allow-listed |
| J4 | Pass: a letter | Pass: a letter | Pass: a letter |
| J5 | Pass: toggle names it | Pass: the row names the act | Open: widget wording is content's |
| J6 | Pass | Pass | Pass: one action |
| J7 | Pass: lens is the Book's | Pass: Home slot only on the day | Pass |
| J8 | Pass: absent until used | Pass: absent until used | Pass |
| J9 | Pass: A5 | Pass: B6 | Open: spec 5 |
| J10 | Open: words are content's, no count, no suggestion | Open: "sealed" and "closed" need counsel | Open |
| J11 | Open: device | Open: device | Open |
| J12 | Open: without it Find and months carry the job (NX-44 FD-1) | Open: without it a parent writes a letter and just does not open it | Pass: without it a take needs the app opened by hand |

## G. Open design questions, each with a default

| # | Question | Default |
|---|---|---|
| Q1 | Build Firsts? (NX-44 FD-1) | No before a five-parent study; this spec is the design if yes |
| Q2 | Build sealed letters? | No in Build 13. Needs a decision from the founder, the truth rule, and `data-architect` on whether the seal syncs |
| Q3 | If built, "Firsts" as the lens name? | The word is `content`'s; it is already the founder's/NX-44's working word |
| Q4 | A reminder on the opening day | None. The Home slot on that day is the only surface |
| Q5 | Does the PDF book show a sealed letter before it opens? | No; it shows the closed line only |
| Q6 | May a seal be chosen "until {child} is {age}"? | Yes, as an age picker; the date is computed and shown |

## H. UNVERIFIED

Competitor behaviour (not opened); any founder wish for seals (none found); how `roomClock` handles clock changes; whether the seal can be made non-bypassable (it cannot with plain local storage; not promised); whether iOS lets the app suppress QuickType suggestions; the widget and intent paths on SDK 57 (F04 says UNVERIFIED); F11 co-parent visibility rules.
