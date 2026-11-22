# P3 critics' pass: Tonight and prompts (go/no-go B2-10)

Wednesday 28 October 2026. The experience critics' pass over package P3 of `docs/design/EXPERIENCE_PASS_2026-10.md` (v1.3): section 4 S09 (Tonight) and S33 (Not much today, kept), section 6 "P3 Tonight and prompts", 5.8 rows 1, 2, 3a and 6 as they touch Tonight, journeys J04 and J08, and the prompt library in `packages/content/src/prompts.ts` with its selection rules in `packages/core/src/prompts.ts`. Read against `develop` at **2833def**. P3 (#221, 83dd882) is merged; every P3 file and every file cited below is identical at 817879d (where the pass began) and at 2833def (the commits since are P8c-lite #358, a test fix #362 and docs #363 and #366). Every file:line below holds at 2833def. This pass critiques; it changes no app code, test or copy.

## 0. Verdict for B2-10 (P3's share)

**Signed.** There are no Must items. Five Should items for the coordinator to fix or rule before the freeze (S1 to S5, section 2); the phone checks in section 7 go on the build 2 run sheet. S1 and S2 are the two a parent can meet on the first night.

Tonight is calm and plain. One question, large, on lamp-lit paper; the greeting in two tones; one letter-shaped card for each unfinished letter with the person's own first words, never a count; Speak and Type as equal twins in the thumb zone; "Not much today" as one quiet link that becomes "A quiet day, kept." with Undo and a lower light. The cards read the draft's own fields and say what is true about them. "A month ago" brings back the newest kept letter of 28 to 35 days and never a private one, a count or a gap. Nothing on Tonight writes meaning, counts, scolds or shapes a word.

The two places Tonight is not yet right are at the edges of who uses it. At accessibility text sizes the pinned buttons take nearly half of the screen at AX3 and more than half at AX5, and the one question is scrolled away behind them (S1). And a book started with "Not here yet" opens on Tonight with prompts about the baby's hands and the first day home, before the baby is born, under a dateline that does not name the child (S2).

| Rank | Count |
|---|---|
| Must before build 2 | 0 |
| Should before build 2 | 5 |
| Later | 8 |
| Accept as built | 15 |

The five to rule first: **S1** (Speak, Type and "Not much today" pin nearly half the screen at AX3 and over half at AX5), **S2** (a book not born yet gets newborn prompts), **S3** (twins have no way to see or switch the book on Tonight; the spec says there is one), **S4** ("Another thought" shows the same thought one press in seven after a few days away), **S5** (J08c, P3's own flow, fails on develop).

## 1. How this was looked at

- A scratch worktree at 817879d (develop then), `node_modules` as symlinks to the main checkout's (no `npm ci`), the three web exports built fresh by the e2e global setup.
- The P3 journeys with the preinstalled Chromium, one worker, `JOURNEY_SHOTS=1`: **j04 (6 tests) and j08 (4 tests): 9 of 10 passed**; J08c fails (S5). J04f ran and passed (a letter held at the Keep step waits on Tonight).
- Scratch probes (never committed) against patched copies of the web build, in `/tmp/cr-p23/`: a font scale reported to the app so `useIsLargeText()` runs and every px font size scaled by the same multiplier with the token caps applied (xxxLarge 1.353, AX3 2.643, AX5 3.571, `a11y.logic.ts` `FONT_SCALE`; hero and display 1.6, title1 1.8, title2 2.0, letterDateline 2.4); dark mode; an iPhone SE size (375 by 667); the fixed clock moved to an evening hour and forward 30 days; a book started with "Not here yet"; one to four drafts (typed and spoken); a name of 60 characters; "Another thought" pressed 24 times; the same selection rules re-run in Node over 60 days, eight ages and both prompt kinds (`shuffle.mjs`; the probe scripts are in `/tmp/cr-p23/probe/`); frame-logged positions of the quiet-day controls; the first-run to Tonight light. Accessibility text sizes are an approximation, not iOS Dynamic Type.
- Screenshots stay in the session scratchpad, not in git (COORDINATION section 8): `/tmp/claude-0/-home-user-earlyletters/9c7d4e54-75ea-5024-8f40-e18f5142ba43/scratchpad/cr-p23-shots/` (`default-t1-*`, `dark-t1-*`, `ax3-t1-*`, `ax5-t1-*`, `se5-t1-*`, `xxx-t1-*`, `d-tonight-4drafts*`, `dax5-*`, `q-*`, `qax5-*`, `m-month-ago.png`, `exp-*`, `ln-*`), and the journey frames in `.../scratchpad/cr-p23/docs/release/journey/screens/`.
- Read: CLAUDE.md, the spec sections above, DESIGN_LANGUAGE 2b, 3, 11, 12, MOTION 5a and 5k, `packages/content` VOICE.md and BRAND.md, every string Tonight reads (`tonight.*`, `notMuch.*`, `book.waitingForWords`, `review.emptyTake.*`), the whole prompt library (103 prompts), the code of every P3 file, and the body of #221 (including its "Known on web" and "Requests" tables).

The web preview is a stand-in. It has no haptics, no VoiceOver, no iOS Dynamic Type, no native sheet under Write, no real kill, no speech model. Where that limits a finding, the finding says so; section 7 lists every check left for a phone.

## 2. Findings, ranked

### Must before build 2

None.

### Should before build 2

**S1. At accessibility text sizes the pinned buttons take over half of Tonight and the question is scrolled away.** (#221 "Known on web", already on its device list.)
- Spec: S09 Visual (445): "Speak and Type: unchanged, identical twins, 64 pt, static"; S09 States (450): "several drafts (scroll above the pinned Speak and Type)"; DESIGN_LANGUAGE 1 principle 6 "Big enough for Nani" and 3 (Scaling for grandparents, item 4): "At accessibility sizes rows stack vertically; letter text never truncates"; 5.8 rule 3: controls there from the first frame.
- Built: the question and the cards scroll (`apps/mobile/src/app/(tabs)/index.tsx:233`) above a footer that is always pinned (`:287-297`): `ButtonRow` stacks Speak and Type full width from xxxLarge up (`apps/mobile/src/components/ui/button.tsx:238`, `lib/a11y.ts:32`), each a `capture` button (icon over label), plus the quiet link or the kept line. Measured on the web build at 402 by 874 (emulated): at AX3 the scroll window is 407 pt for 640 pt of content and the prompt is cut after "night sound" (`ax3-t1-tonight-day0.png`); at AX5 it is 326 pt, the prompt is cut after "middle of the" and "Another thought" is out of view; with four drafts at AX5 the window shows about one eighth of 2,375 pt (`dax5-tonight-4drafts.png`); after "Not much today" at AX5 the kept line (two lines, 64 pt text, Undo) pushes the prompt out entirely (`qax5-kept.png`); on an iPhone SE at AX5 the window is 119 pt of 667 (`se5-t1-tonight-day0.png`, only "Good morning" is visible).
- A parent with large text (the grandparent the design is for): opens Tonight and sees a greeting and two enormous buttons. The one question, and "Another thought", are behind a short window they must scroll, and every unfinished letter is down in the same window. Nothing is lost, and Speak and Type are reachable at once, but the screen's job (the question) is the part hidden.
- Fix: at accessibility sizes (`useIsAccessibilitySize()`) let Speak, Type and the quiet link scroll with the content, after the cards, instead of pinning (the same move P4's pass proposed for Listen); keep them pinned at the default sizes. Then check D1 on an SE and a 17 Pro at AX3 and AX5.

**S2. A book that is not born yet gets newborn prompts and a dateline that does not name the child.**
- Spec: S05 Copy (301): "Letters written before the birth go in Before You."; S09 Copy and Visual (406, 429): "Prompts are already chosen by the child's age (`selectPrompt` with `ageMonths`)" and the dateline "ASHA . 7 MONTHS"; P4's Review header already says "To Asha . Before You" for these letters.
- Built: a child with a due date and no birthday has `childBirthday` null (`apps/mobile/src/lib/store.ts:352`), so `age` is null and Tonight passes `ageMonths: 0` (`index.tsx:168`), which is the 0 to 3 month band (`packages/core/src/prompts.ts:24`). The dateline has no age, so it falls back to the day's date alone, without the child's name (`apps/mobile/src/components/tonight/draft-card.logic.ts:214-218`; `index.tsx:191`). Probed with a due date 60 days ahead: the dateline reads "WEDNESDAY, OCTOBER 28, 2026", and across 14 presses of "Another thought" the prompts included "Who does Asha look like today? Which feature gives it away?", "Tell Asha about the first day home. What do you remember?", "Describe Asha's hands. How small are they next to yours?", "Who came to meet Asha this week? What did they say?" and "What does Asha's face do while sleeping?" (`exp-tonight.png`). The 10 "any age" openings do not help: "What did {child} do today that you want to remember?" and "What does {child} smell like right now?" assume a born child too (`packages/content/src/prompts.ts:11-20`).
- A parent: at 36 weeks (or after a long wait, or a hard pregnancy) opens the book they just made and is asked to describe the baby's hands, the first day home and who came to visit. Nothing is harmful in the words, but every one of them is about a child who is not here yet, in an app that promised a place for letters before the birth.
- Fix: before birth (no birthday, a due date), select from a small set written for it (the content owner writes six to eight that assume no birth: the weeks of waiting, the name, what is hoped for, the house getting ready) and show the dateline with the child's name and the day. Until then, hide the 0 to 3 band and the born-child "any" openings for these books. Add one probe for the pre-birth book to `draft-card.test.ts` and to J04.

**S3. Twins have no way to see or switch the book on Tonight; the spec says there is one.**
- Spec: S09 States (450): "twins (the switcher in the dateline, as today)".
- Built: Tonight has no switcher, and never had one (`git log -S"ChildSwitcher"` finds none on `(tabs)/index.tsx`); the only switcher is on the Book (`apps/mobile/src/app/(tabs)/book.tsx:237`, `components/child/child-switcher.tsx`). Tonight names the active child in the dateline ("ASHA . 7 MONTHS") and Listen says "To Asha", but nothing says a second book exists.
- A parent of twins: to write to Nila they leave Tonight, open the Book, open "Whose book?", choose, and come back: four taps for a thing done nightly. First run gives every twin a book and says so ("Twins or more? Each child gets their own book.").
- Fix: put the switcher in the dateline as the spec says (the dateline is "Asha . 7 months", a quiet control with the same sheet as the Book), shown only with more than one book, and add it to J03's twins step. If the spec owner would rather keep the Book as the one place, change line 450 and say so on Tonight's first run for twins.

**S4. "Another thought" shows the same thought one press in seven after a few days away, and the pool is only seven.**
- Spec: S09 Motion (448): "'Another thought': the old prompt exits (160 ms), the new one enters"; the button is named for a different thought.
- Built: each press draws again from the same pool with a new seed (`index.tsx:107`, `:174`: `seed: today:shuffle`) and no memory of what is showing (`packages/core/src/prompts.ts:91`: `choices[hash(...) % choices.length]`). After five days without a letter the kind becomes `gap` (`prompts.ts:51`, `:68`), which has seven prompts for every age (`packages/content/src/prompts.ts:90-98`), so an immediate repeat is likely. Re-run in Node over 60 days and 12 presses a day (`shuffle.mjs`): a repeat on 13.6 percent of presses with the gap pool, 1.5 to 2 percent with the age bands (pools of 6 to 18); on the web 24 presses of a newborn book showed 13 different prompts and one immediate repeat. A repeat has the same key, so no exit or entry runs: the tap looks dead (`index.tsx:251`).
- A parent: back after a week away (the very case the gap prompts are for), taps "Another thought" and sometimes nothing happens; there are only seven to find, whatever the child's age.
- Fix: pass the prompt on screen (and the ones already shown this evening) as `recentKeys` for a shuffle so one press never repeats, and let the gap kind fall back to the age band so a returning parent still gets age-fitting thoughts; pin both in `packages/core/test`.

**S5. J08c, P3's own flow, fails on develop.**
- Spec: P3 Tests (1946): "j08 asserts 'A quiet day, kept.' and Undo"; section 6 (1837): "the owning package updates [its flow]".
- Built: `getByText('Month 6')` (`apps/mobile/e2e-web/j08-quiet-day.flow.ts:97`) finds nothing since P5's month opener draws "MONTH" and the numeral "6" as separate texts (the failure screenshot, `e2e-web/.results/artifacts/j08-quiet-day...-a-mark-can-be-removed/test-failed-1.png` in the scratch worktree, shows the Book with MONTH, a large 6, the "A quiet day" row for Tuesday, October 27, and the letter cards). Everything else the test asserts after that line is unreached. J08, J08b and J08d pass.
- A parent never sees it; P7's journey re-run would record a failed step for "an older quiet day, shown as a mark" and "Remove this mark, with Undo".
- Fix: assert the numeral and its kicker (for example the `Month` and `6` texts, or the chapter's accessibility label) in `j08-quiet-day.flow.ts:97`; P3 or P7.

### Later

| # | Spec line | Built (2833def) | What a parent meets | Fix |
|---|---|---|---|---|
| L1 | S09 Visual (432), P4 pass L11 | the day-of-birth dateline is "ASHA . 0 DAYS" and the VoiceOver label "Asha, 0 days" (`draft-card.logic.ts:214-218`; `default-t1-tonight-day0.png`) | "0 days" is cold on the first night home | content owner and P3 choose the first-day line ("Born today" already exists as a chip word); the format belongs in `packages/content` |
| L2 | S09 Visual (434): the card's dateline "Tuesday evening, 0:42" | "WEDNESDAY" only, with the length beside it; three drafts of one day carry three identical datelines (`draft-card.logic.ts:108-115`; `d-tonight-4drafts.png`); a draft from six days ago says only its weekday | cards that cannot be told apart by their header; the words below tell them apart | #221's request to the content owner for four time-of-day words is still open |
| L3 | VOICE (mechanics): moments celebrate what exists; S09 (406): prompts are chosen by age only | 13 prompts say "tonight", "right now", "the middle of the night" or "bedtime" and are shown at any hour (for example `packages/content/src/prompts.ts:17-18`, `:23`, `:53`, `:102`, `:107`); the first probe showed "Good morning, Mama." over "What does the middle of the night sound like right now?" | a morning greeting over a night question | tag prompts with a time of day, or word them for any hour; content owner |
| L4 | S33 (921-927), #221 note 6 | the evening light stays at 70 percent for as long as today's quiet mark exists, after the person leaves and comes back (when Undo is gone and the link says "Not much today" again) and after a letter is kept later that evening (`draft-card.logic.ts:241-243`; J08d pins it) | a dim room and a link that offers what is already done | spec owner's call (open since #221): keep, or tie the light to a letter written the same day |
| L5 | S33 Motion (923), #221 "Known on web" | on the web the link jumps from y 748 to 700, over the Speak and Type row, for about 180 ms (150 to 330 ms) while the kept line is already in place at 748 (`p3e.mjs`) | two controls on screen briefly; a web artefact of exiting views, unverified on iOS | check D6; if it shows, one fixed-height slot for link and line (`index.tsx:293-296`) |
| L6 | DESIGN_LANGUAGE 9 (excerpts): "the whole text stays readable to VoiceOver" | each card's label is the date, then the whole letter, then the action (`draft-card.logic.ts:163`, `:203`) | a long draft is read in full before "Pick it up"; swiping on is possible | check D2; consider the action first or a hint |
| L7 | P3 Tests (1946) | "A month ago" has unit tests and no journey step: J04's steps never show the card (it appeared in this pass only after moving the clock 30 days) | the journey record never shows the resurfaced card | P7 adds one step with the clock moved |
| L8 | VOICE: "Tired tonight?" prompts exist | `hardStretch` is the constant `false` (`index.tsx:170`), so the nine `hard` prompts are never selected | the gentlest set is dead | recorded; decide whether a signal exists for it |

### Accept as built

| # | What | Ruling |
|---|---|---|
| A1 | S09: one question on screen, no subtitle, no caps label; the old label is only the prompt's hint (`index.tsx:251-254`) | Accept. J04 asserts it; the screen reads "Good morning, Mama." then the prompt in `promptHero` on the paper with no card (`default-t1-tonight-day0.png`). |
| A2 | S09: one letter-shaped card per draft, newest first, with the person's own first words (raw transcript or typed text as stored), two whole lines and a fade, the state line and the action (`draft-card.logic.ts`, `draft-card.tsx`) | Accept. Probed with four drafts (three typed, one spoken): each card stands alone, no total, "Pick it up" and "Open" and "A recording, waiting for its words." as specified; J04d (two recordings after a relaunch) and J04e (typed mid-sentence) pass. |
| A3 | S09: an empty Type (nothing or only spaces) leaves no empty card | Accept (probed: no card after an empty or whitespace-only Type; a 0.6 s take shows "A recording, waiting for its words." with 0:01). The no-sound card (`review.emptyTake.body`) is unit-tested and was not reproduced on the web. |
| A4 | S09: the held-at-the-Plus-gate state reads `Draft.held` | Accept. J04f passes with the card showing the words as typed; J06 (P4's, not run here) asserts "Waiting to be kept." (unverified in this pass). |
| A5 | S09: the lamp follows the greeting's daypart, still lit from first run | Accept. Measured: first-run "Write the first one" to Tonight 459 ms, the two lamp layers never sum below 0.7; dark mode keeps it a subtle pool (`dark-t1-tonight-day0.png`). |
| A6 | S09: "A month ago" for the newest kept, non-private letter of 28 to 35 days, only when no draft is waiting | Accept. With the clock moved 30 days the card shows the kicker and the letter's first two lines (`m-month-ago.png`); its label is "A month ago. {words}. A letter from {date}. Opens the letter." |
| A7 | S09 Motion: arrivals once per cold launch; Speak and Type never animate in | Accept (`tonightArrival`; code and J04). The web replay after Close noted in #221 is a Reanimated web quirk, unverified on iOS. |
| A8 | S33: the Moon glyph, the line in `text`, Undo beside it; evening lamp to 70 percent over 1.2 s; Undo restores both; a second tap the same day adds nothing | Accept. J08, J08b and J08d pass; the line is `text` colour, not success green; the mark stores no words (`quiet-day.logic.ts`). |
| A9 | S33 accessibility: "A quiet day, kept." announced; the line is also a polite live region for Android | Accept (code `index.tsx:213`, `quiet-day-inline.tsx`); VoiceOver on a phone is D2. |
| A10 | The dateline is read as "Asha, 7 months" and no card or label contains the separator dot (`draft-card.logic.ts:214-218`, `:163`) | Accept (J04 matches `^Asha, 7 months`). |
| A11 | Tap targets: "Another thought" 44 pt, Speak and Type 74 pt, "Not much today" 48 pt, Undo 44 pt | Accept (measured on the web build at 402 by 874). |
| A12 | No count, days-since or streak anywhere on Tonight; the gap-aware prompt selection is invisible | Accept. `daysSinceLastEntry` only changes which prompt is drawn; the 5-day threshold is never shown. |
| A13 | Privacy: cards show only the person's own words on a private surface; "A month ago" never shows a private letter or a quiet-day mark; analytics carry `promptKind` and counts, never text (`index.tsx:225`) | Accept. |
| A14 | The words | Accept. Every string comes from `packages/content`; no "we"; nothing genders Asha; no fear, guilt or loss language; the greeting uses the signature name ("Good evening, Mama."). |
| A15 | Dark mode and contrast | Accept. Tonight is a lit room with reading colours only; the cards sit on their own surface; no status colour on Tonight. |

## 3. What #221 declared

| Item | Ruling | Where |
|---|---|---|
| Pinned controls at accessibility sizes (emulated, device list) | Confirmed on this build | S1 |
| "Not much today" wraps while it fades | Still there on the web; unverified on iOS | L5 |
| "Another thought" moves what was just tapped | Not re-measured; unverified on iOS | D6 |
| The arrival replays after Close (web) | Not re-measured; web artefact | A7 |
| Four time-of-day words, a length for VoiceOver | Open | L2 |
| Spec owner note 6 (the light follows the mark) | Open | L4 |
| S03 note 7 (#182 sets `held` for every held kind) | Works (J04f); the wording "Waiting to be kept." for all three kinds is S03's ruling | A4 |
| Requests to P4, P5, P6, P7, P8 (flows, the Book's and Family tab's lamp) | Out of this pass; the flows P3 owns are S5 | S5 |

## 4. Every recorded gap, ruled

| Source | Item | Ruling |
|---|---|---|
| #221 | pinned controls at AX5 on an SE | Should (S1) |
| #221 | the twins switcher (spec line 450) | Should (S3); the spec line was wrong about "as today" |
| #221 | time-of-day words and the length for VoiceOver | Later (L2, L6) |
| #221 note 6 | the evening light follows the stored mark | Later (L4), spec owner |
| P4 pass L11 | "0 days" on the day of birth, owner P3 and the content owner | Later (L1) |
| #221 needs a device | the list in its body | carried into section 7, none dropped |

## 5. Spec-owner changes

| Spec line | Says now | Proposed wording | Because |
|---|---|---|---|
| S09 States, 450 | "twins (the switcher in the dateline, as today)" | either keep it and build it (S3), or: "twins: Tonight shows the active book's name in the dateline; the Book's switcher changes it" | S3 |
| S09 Copy and Visual, 406 and 429 | prompts "chosen by the child's age" | add: "before the birth (a due date, no birthday) from the pre-birth set, with the dateline naming the child and the day" | S2 |
| S09 Visual, 445 | Speak and Type "unchanged, identical twins, 64 pt, static" | add: "at accessibility sizes they follow the cards and scroll with the page" | S1 |
| S09 Visual, 434 | "Tuesday evening, 0:42" | "the weekday within a week, else the date, with the length beside it" until the time-of-day words exist | L2 |
| S33 Visual, 921 | "It stays until Undo or until the person leaves Tonight." | add the light's rule (L4): "the evening light stays down while today's mark exists" or "returns when the person leaves" | L4 |

## 6. Measurements (web build, headless Chromium, 60 fps unless stated)

| What | Measured |
|---|---|
| Tonight at 402 by 874, default size | Speak and Type 666 to 740 (74 pt tall), "Not much today" 748 to 796, "Another thought" 44 pt; the pinned footer is about 15 percent of the height |
| Scroll window above the pinned footer | default: the whole content fits; xxxLarge: fits; AX3: 407 pt for 640; AX5: 326 pt for 730; four drafts at AX5: 326 pt for 2,375; SE at AX5: 119 pt of 667 |
| "Not much today" exit | the link moves from y 748 to 700 at 150 ms and is gone at 334 ms; the kept line is at 748 from 150 ms (about 180 ms with both on screen); Undo is a 44 pt control from its first frame |
| First run to Tonight | Tonight visible 459 ms after "Write the first one"; lamp layers hand over by 768 ms to 0.7 (morning), never under 0.7 in total |
| "Another thought", 24 presses (newborn book) | 13 distinct prompts, 1 immediate repeat |
| Selection rules in Node, 60 days by 12 presses | immediate repeat: 13.6 percent (gap kind, 7 prompts), 1.5 to 2.0 percent (opening kind, pools of 6 to 18) |

## 7. What could not be seen on the web: device checks

Each is a two-minute procedure on a phone with the build 2 binary. Mark each Pass or Fail on the run sheet.

- **D1. Tonight at large text (S1).** Settings, Accessibility, Larger Text, Larger Accessibility Sizes at AX3, then AX5, on an iPhone SE and a 17 Pro, with one typed draft waiting. Pass: the prompt and "Another thought" are on the first screen and the buttons are reachable by scrolling (after the fix); today, count how much of the screen the buttons take. Fail: the prompt is cut behind pinned buttons.
- **D2. VoiceOver on Tonight (A9, L6).** Swipe through Tonight with a long typed draft and a 2-second recording waiting. Pass: "Asha, 7 months" (no dot), the greeting, the prompt then "A thought to start with", each card as one button; "Not much today" with its hint, and after the tap "A quiet day, kept." said once. Note how long the long draft takes to read before its action (L6).
- **D3. Haptics.** `press` on Speak and Type, `tap` on "Another thought", `soft` on "Not much today", nothing on Undo or a card. Pass: exactly those.
- **D4. The lamp.** Open Write from Tonight: the Tonight light holds and pauses its breath under the sheet and returns on close; come back from Listen: it returns over a third of a second; turn on Increase Contrast: plain paper. The web cannot show the sheet.
- **D5. A real kill.** Record twice, quit the app from the switcher, relaunch. Pass: two cards, newest first, each "A recording, waiting for its words." or its first words.
- **D6. The quiet-day and prompt swaps on iOS (L5).** Tap "Not much today" and "Another thought" with the screen recording on. Pass: no frame where the link sits on top of Speak and Type and nothing shifts by more than a line. Fail: the link jumps as on the web.
- **D7. A book not born yet (S2).** Fresh install, name a child, choose "Not here yet" and a due date, finish first run. Pass: Tonight's prompts and dateline make sense before a birth (after the fix); today, read five presses of "Another thought" and note any that assume a born child.
- **D8. Twins (S3).** Fresh install, add a second name. Pass: Tonight shows a way to see and change the book (after the fix); today, note the taps needed to write to the second child.

## 8. The constitution and the content rules, checked

- Cards show the person's own words as stored: the raw transcript (never the machine's proposed fixes) or what they typed; whitespace is folded for display only (`draft-card.logic.ts:draftWords`). "A month ago" shows the final text of a kept, non-private letter. Nothing on Tonight writes, rewrites, summarizes or shapes a word, and nothing calls an engine.
- "Not much today" stores a mark with no words (D-084); the line "A quiet day, kept." is the app's own small note, unsigned and in `text`; no sentence is written for the person.
- No streaks, points, badges or counts of gaps: Tonight shows no total, no days-since; "A month ago" is never a count. The gap kind of prompt is chosen silently and its words are about now ("What is {child} doing right now, this very minute?"), not about time away.
- No entry text, transcript, audio or child name in analytics, logs or crash reports: `trackCaptureStarted` carries the mode, the source, the prompt kind and indexes only (`index.tsx:225`).
- Never gender the child: every prompt uses `{child}`; no "he", "she", "son" or "daughter" appears in the library (read in full). No em dash, en dash, curly quote, ellipsis character or emoji in any string Tonight reads (checked in the web text of every frame and by the content tests).
- This document uses the fictional family Asha, and the strings "Christopher", "Maximilian" and "Alexandrina" appear only in the P2 document as typed test names.

## 9. Coordinator's rulings

None yet. Counts above are the critics' ranks as written on 28 October.
