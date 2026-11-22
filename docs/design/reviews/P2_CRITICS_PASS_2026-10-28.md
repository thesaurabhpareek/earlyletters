# P2 critics' pass: first run and the age question (go/no-go B2-10)

Wednesday 28 October 2026. The experience critics' pass over package P2 of `docs/design/EXPERIENCE_PASS_2026-10.md` (v1.3): section 2.3 and section 4 S01 to S08 (the age question, the stop screen, the welcome, the promise, who the book is for, what the child calls you, the language sheet, the book is open), section 6 "P2 First run and the age question", journeys J01 (steps J01-01 to J01-17), J02 and J03-01, and 5.8 row 13 as it touches the welcome. Read against `develop` at **2833def**. P2 (#220, 922c360) is merged; every P2 file and every file cited below is identical at 817879d (where the pass began) and at 2833def (the commits since are P8c-lite #358, a test fix #362 and docs #363 and #366). Every file:line below holds at 2833def. This pass critiques; it changes no app code, test or copy.

## 0. Verdict for B2-10 (P2's share)

**Signed.** There are no Must items. Four Should items for the coordinator to fix or rule before the freeze (S1 to S4, section 2), and the phone checks in section 7 go on the build 2 run sheet. S1 is one constant.

P2 is the best-finished package in the pass. The parent opens the app to one lit room and one neutral question; the two answers are equal, nothing is preselected, a No leaves the room exactly as it was and says one plain sentence, and nothing about the law is dressed up. The welcome is one logo, one line of what the book is, and one button. The promise shows a small fix on a fictional sentence instead of describing one, and the two marks really come from the engine. The name, birthday and signature steps never explain themselves; the book cover takes the name and the signature, opens on "The book is open.", and the one ask about the speech download is a quiet card with one filled button on the screen. The light never goes out between the gate and Tonight (measured, section 6), and no frame of the tabs shows between the gate and the welcome (R1 of #220 is closed). Nothing on these screens writes meaning.

| Rank | Count |
|---|---|
| Must before build 2 | 0 |
| Should before build 2 | 4 |
| Later | 8 |
| Accept as built | 17 |

The four to rule first: **S1** (the cover hides on every iPhone the moment the keyboard rises, the constant is still 640 and the spec says 480), **S2** (a first name of ten or more letters breaks mid-word on the first-run cover), **S3** (the name is typed in the app's sans, not the book's title face), **S4** (on an iPhone SE the book-is-open step's one primary button sits partly below the fold).

## 1. How this was looked at

- A scratch worktree at 817879d (develop then), `node_modules` as symlinks to the main checkout's (no `npm ci`), the three web exports built fresh by the e2e global setup (`.web-dist`, the seeded one and the server-on one).
- The P2 journeys with the preinstalled Chromium, one worker, `JOURNEY_SHOTS=1`: **j01, j02, j03-child-editing and j03-children: 8 tests, 7 passed.** The eighth, J01 (the long one: 18 recorded steps at 3x), hit the 90 s per-test limit on its last step, once on a machine at load 50 and again on a rerun at load 12; with screenshots off and the limit raised it passes, **J01, J01b, J01c and J01d: 4 of 4 in 33 s**. Every assertion in J01 had already passed when the limit hit, so it is a time budget, not a product fault (L7). j04 and j08 (P3's) are in the P3 document.
- Scratch probes (never committed) against patched copies of the web build, in `/tmp/cr-p23/`: a font scale reported to the app (so `useIsLargeText()` and `useIsAccessibilitySize()` branches run: xxxLarge 1.353, AX3 2.643, AX5 3.571, from `a11y.logic.ts` `FONT_SCALE`) with every px font size scaled by the same multiplier and the token caps applied (hero and display 1.6, title1 1.8, title2 2.0, letterDateline 2.4, numeral 1.4; the cover's text is pinned at 1x by `maxFontSizeMultiplier` in `book-cover.tsx:204`, so its clipping in the emulation is not reported); dark mode (`prefers-color-scheme`); Reduce Motion (`prefers-reduced-motion`); an iPhone SE size (375 by 667) and the 17 Pro (402 by 874); frame-logged hand-offs (every animation frame, section 6); the stop screen at default, dark and AX5; the server-on build for the welcome's two doors. Accessibility text sizes are an approximation, not iOS Dynamic Type.
- Screenshots stay in the session scratchpad, not in git (COORDINATION section 8): `/tmp/claude-0/-home-user-earlyletters/9c7d4e54-75ea-5024-8f40-e18f5142ba43/scratchpad/cr-p23-shots/` (first-run frames per size and scheme: `default-*`, `dark-*`, `ax3-*`, `ax5-*`, `xxx-*`, `se-*`, `reduce-*`, `stop-*`, `on-*`) and the journey frames in `.../scratchpad/cr-p23/docs/release/journey/screens/`.
- Read: CLAUDE.md, the spec sections above and 5.8, DESIGN_LANGUAGE 2b, 3, 8, 9, 11, MOTION 5k, `packages/content` VOICE.md and BRAND.md, every string these screens read (`ageGate`, `onboarding`, `speechConsentCopy`, `speechSettingsCopy`, `languageCopy`, `review.removedWordsA11y`), the code of every P2 file, the bodies of #220 and #238, and P2-V's requests R1 to R8.

The web preview is a stand-in. It has no haptics, no VoiceOver, no iOS keyboard (so the cover rule cannot run), no native compact date picker (a web date input stands in, and at AX5 it overflows the right edge, which is the web control, not the product), no speech model plan beyond the catalog's 575 MB, no StoreKit. Where that limits a finding, the finding says so; section 7 lists every check left for a phone.

## 2. Findings, ranked

### Must before build 2

None.

### Should before build 2

**S1. The cover steps aside on every iPhone while the name is typed.** (#220 R6, #238 "Follow-up for P2's owner, not in this PR": never done.)
- Spec: S05 Visual (line 311): "With the keyboard up and under 480 pt of free height, the cover hides, so the name field stays in view ... 407 pt on an iPhone SE, 538 on a 17 Pro, 610 on a Pro Max; so the SE hides the cover and the Pro and Pro Max keep it"; S05 acceptance (line 323): "hides when the keyboard leaves less than 480 pt of free height, so the name field stays in view on an SE, a 17 Pro and a Pro Max".
- Built: `COVER_MIN_FREE_HEIGHT = 640` (`apps/mobile/src/app/onboarding.tsx:80`, comment "so the form never scrolls"), `showCover = keyboard === 0 || windowHeight - keyboard >= COVER_MIN_FREE_HEIGHT` (`:154`), used for both steps' covers (`:341`, `:428`). P2-V's own numbers (407, 538, 610) are all under 640, so the cover hides on all three phones. No test pins the number (`grep` over `apps/mobile/test`). The web has no keyboard events, so every web frame shows the cover and J01 cannot see this (unverified on a phone; the arithmetic is the evidence).
- A parent: taps the name field, the keyboard rises, the cover leaves, the title runs full width, and the one object of first run is not there while the name goes in. It returns when the keyboard drops, already carrying the name. Nothing is lost; the moment the spec calls "the cover appears and takes the name" is not seen live.
- Fix: `COVER_MIN_FREE_HEIGHT = 480` and the comment to "so the name field stays in view" (P2-V's one line), then the device check D1 on an SE and a 17 Pro.

**S2. A first name of ten or more letters breaks mid-word on the first-run cover.**
- Spec: S05 Visual (line 311): "the child's name set live in Literata Medium 17 pt, centred, at most three lines, ending in a fade"; DESIGN_LANGUAGE 9: a name "at 17 pt on the smallest cover, smaller (down to the 13 pt floor) when a word would otherwise break, then it wraps at spaces, then it ends in a fade".
- Built: the 88 by 116 `sm` cover (`apps/mobile/src/components/book/book-cover.logic.ts:17`) sets a single long word at the 13 pt floor and, when it still does not fit, breaks it between letters. Measured on the web build with the bundled Literata: "Alexandrina" draws as "Alexandrin" over "a", "Christopher" as "Christophe" over "r", "Maximilia" over "n", "Wilhelmina Rose" as "Wilhelmin" over "a Rose" (`cover-alexandrina.png`). The 132 pt cover on the book-is-open step is wider and was not measured with these names (unverified).
- A parent: types a real, common name and the book's title shows a stranded last letter on the cover they are about to hand their child. The 60-character acceptance ("fits in three lines with a fade") passes; that test does not cover one long word.
- Fix (a call for the spec owner and P1): let the floor go to 12 pt for a single word wider than the cover, or use the 96 pt cover of Add a child and Export, and add one single-word name of eleven letters to `book-cover.test.ts`. Check D1 on a phone, since iOS text measurement may differ from the web's.

**S3. The child's name is typed in the app's sans, not the book's title face.**
- Spec: S05 Visual (line 311): "The name field uses the letter face (Literata 22 pt), because it is the book's title; labels stay Mukta." P2's own request R3 asked P1 for this option.
- Built: P1 added it (`TextField` `face="serif"`, `apps/mobile/src/components/ui/text-field.tsx:59`, used by the invite screens), but the first-run name fields pass no `face` (`apps/mobile/src/app/onboarding.tsx:349-376`). In every frame the cover shows "Asha" in the serif and the field above it shows "Asha" in Mukta (`default-07-child-ready.png`).
- A parent: sees the same name in two faces one inch apart on the screen whose point is that the name is the book's title.
- Fix: `face="serif"` on the name `TextField` (and the extra-name rows), the same edit as S1.

**S4. On an iPhone SE, the book-is-open step's one primary button sits partly below the fold.**
- Spec: S08 Visual (line 387): "'Write the first one' full width at the bottom"; DESIGN_LANGUAGE 1 principle 2: primary actions in the bottom third.
- Built: the step's content and "Write the first one" scroll together (`onboarding.tsx:284`, the step container at `:295`, the button at `:509`), so the button follows whatever sits above it. Measured on the web build at 375 by 667: the button spans 637 to 693, so 26 of its 56 pt are below the bottom edge, and a real SE also gives 20 pt at the top to the status bar; at AX3 on the SE it is 720 pt below the fold; on the 17 Pro it is at 794 to 850 as designed.
- A parent on an SE: arrives at the emotional peak and sees "Write the first one" cut off at the bottom of the screen; the page scrolls, so nothing is lost, but the one button the screen is for is not whole.
- Fix: keep the button outside the scroller (a pinned footer, as the other steps already look when they fit), so only the cover, the line and the speech card scroll above it; or lower the cover to its `sm` size on short screens.

### Later

| # | Spec line | Built (2833def) | What a parent meets | Fix |
|---|---|---|---|---|
| L1 | S04 Copy (258): `body2` is "the sanctioned promise word for word, then the two other claims" | "We never rewrite your words, shorten them or write for you." sits directly above a specimen with two words struck out (`strings.en.ts:80`) | "shorten them" next to two words taken out; the hint and the marks explain it, and #238 ruled the line, but a skeptical parent may read the two together | recorded for the founder and counsel; a ruling, not a change here; ask one tester on the build 2 run sheet |
| L2 | S05 Visual (311): "Born today becomes a chip beside the date control" | "Birthday" is both a choice chip and the row label under it (`onboarding.tsx:384-396`; `default-07-child-ready.png`) | the same word twice, one above the other | the row label for a born child can be dropped (the chip says it); the due date keeps its own label |
| L3 | S07 (354): "Seven languages, one check" | build 2 is `EXPO_PUBLIC_ENGLISH_ONLY=on` (the two alpha profiles in `eas.json`): the sheet lists English alone with "Other languages are coming in a later update." (`language-picker.logic.ts:29-37`, `language.en.ts:64`); J01-15 records the full build | the first-run "Spoken language" row opens a one-choice list; the web journey shows something the testers will not see | check D8 on the build 2 binary; P7 records the alpha sheet |
| L4 | 5.8 principle 8 (66): "after a kill or crash, put people back where they were" | first run lives in `useState` only (`onboarding.tsx:127-138`): a kill mid-first-run returns to the welcome, the gate stays passed (`ageGate.passed`) | a typed name and signature are typed again | unverified (not killed); decide whether first run is worth restoring; a few taps lost |
| L5 | S03 Visual (233): "Begin the book" full width, 56 pt, bottom | at AX5 the welcome's hero and body run to three screens and "Begin the book" is below them (`ax5-03-welcome.png`; the page scrolls) | a grandparent scrolls to the one button | acceptable now; a pinned primary (S4's fix) would shorten the scroll |
| L6 | S04 Visual (269): "Tapping one puts the word back ... and shows the review toast 'Put back.' with 'Undo'" | "Put back." and Undo take the hint's place under the card until Undo (`promise-sample.tsx:130-145`) | no toast on a screen with a CTA; a calmer result | accept; spec line to match (section 5) |
| L7 | `support/journey.ts:98` and `j01-first-run.flow.ts` | with `JOURNEY_SHOTS=1` at 3x, J01's 18 steps exceed the 90 s per-test limit on a 4 CPU machine under load (twice); without shots 33 s | P7's journey re-run fails on the last step | raise the per-test timeout for j01 in `playwright.config.ts` or per test; P7 |
| L8 | S06 Copy (341): "Add what {child} call you to continue." for twins | "Choose Asha and Dev's birthday to continue." and the three-name form "Asha, Dev and Nina's birthday" (`onboarding.tsx:243`, `strings.en.ts` `needBirthday`) | reads fine for two names; a possessive after a list is slightly stiff | content owner may prefer "Choose the birthday to continue." for more than one name |

### Accept as built

| # | What | Ruling |
|---|---|---|
| A1 | S01: the room, mark, one question in `display`, two equal pills, Continue as an outline until an answer (`age-gate-screen.tsx:98-143`, `:153-190`) | Accept. Nothing preselected, no body line; the question is a heading and the pills are a radio group in the web tree (`radiogroup` named by the question, two `radio`s, "Continue" disabled). Dark and AX5 hold (`dark-01-gate.png`, `ax5-01-gate.png`: pills stack, Yes first, Continue in view). |
| A2 | S01 legal neutrality (2.3 line 95; LEGAL-REQ-002) | Accept. Yes and No are identical before and after a choice; answering No changes nothing in the room (`stop-no-selected.png`, `stop-screen.png`); the only stored values are `ageGate.passed` and `ageGate.stoppedAt` (unchanged `lib/age-gate.logic.ts`). |
| A3 | S02 stop screen: same lamp, same mark, one `title1` line, no way forward, then "I answered by mistake" after 24 hours (`age-gate-screen.tsx:126-139`) | Accept. J02 passes (stop, reload still stopped, 25 hours on, the question again empty). Default, dark and AX5 hold; the line is a heading and a polite live region and is announced (`:66-68`). |
| A4 | S01 to S03 light: no frame of unlit paper and no frame of the tabs between the gate and the welcome | Accept. Frame-logged: 0 frames with the tab bar, the lamp never below 0.6 in total (R1 and R8 of #220 are closed); about 0.4 s of lit paper with no words between the question leaving and the welcome arriving, by design (section 6). |
| A5 | S03 welcome: one registry lockup, the descriptor in `hero`, the voice line, the free line, one button; the two doors only with server features on | Accept. `welcome-lockup.tsx` carries the brand name as its label and nothing is typed. In the server-on build the doors are quiet 44 pt buttons side by side at 402 pt (806 to 850) and stack at AX5 (`on-welcome.png`, `on-ax5-welcome.png`); "I was invited" opens the join sheet. With server features off both are hidden (J01). |
| A6 | S04: the specimen is the real engine's output (`promise-sample.logic.ts`, `cleanSpoken` with `verifyEdits`), set in Mukta, unsigned, with no `{child}` | Accept. Tapping a mark puts the word back and Undo returns it (J01). The sentence is one accessible element reading "Today, Taken out: um, you Taken out: you held the spoon all by yourself." with the put-back and Undo as actions. 71 words on screen (the DOM shows 74 because each struck word is drawn twice and Back counts), against "about 70" (278). |
| A7 | S04 motion and Reduce Motion: strikes draw 400 ms apart; under Reduce Motion they are complete from the first frame and the step is one 200 ms fade | Accept (`reduce-promise-120ms.png`). |
| A8 | S05 reason line: quiet until the waiting Continue is tapped, then the mark on its own chip, focus to the empty field; no help line justifies a field | Accept. J01 asserts it; the warning mark sits on a chip, never caution on lit paper (D-110). The date block starts empty ("Choose a date"; no default). |
| A9 | S05 limit: 60 characters, "A name can have up to 60 characters." | Accept. J01 pastes 90 and keeps 60 with the line. |
| A10 | S06: one signature preview on the cover ("From Mama"), no subtitle, no language footer, twins agree in number | Accept (`default-09-signs-mama.png`; J01d: "What do Asha and Nila call you?" and "Add what Asha and Nila call you to continue."). |
| A11 | S08: the cover opens, one filled button, a quiet card with a bordered "Download on Wi-Fi" and a quiet "Not now", then one line | Accept. "Your voice is kept either way." after Not now; nothing downloads before the tap; no card when the model is on the phone (code). |
| A12 | The step hand-off: the leaving step's words go first, then the next | Accept (P2-V's 0 overlap frames in 48 changes; not re-measured here). |
| A13 | Dark mode on every P2 screen | Accept (`sheet-dark1`: gate, welcome, promise, child, finish). The lamp is a subtle warm pool, the pills and the specimen card keep their edges, the reversed lockup and mark read. |
| A14 | Text size: gate stacks at AX; welcome, promise, child, signature and finish reflow with no clipped words at AX3 and AX5 (cover text is pinned) | Accept, with L5 and S4 (scroll to the button). |
| A15 | Contrast on these screens | Accept. The lit rooms carry the reading colours only; the one status colour on a lit room is the reason line's warning mark, on its own surface; disabled Continue is `textMuted` on an outline, not a pale fill. |
| A16 | The words | Accept. Every string comes from `packages/content`; the only "we" is the sanctioned "We never rewrite your words, shorten them or write for you."; nothing genders Asha; no count, streak or gap; nothing says software wrote, fixed up or improved anything. |
| A17 | P2's declared departures (#220 R1 to R8) | R1 and R8 closed (A4); R2 closed; R3 closed by P1 (see S3); R4 is P8a's; R5 ruled in #238 (71 words, L1); R6 open (S1); R7 on the run sheet (D10). |

## 3. The departures #220 declared

| # | Departure or request | Ruling | Where |
|---|---|---|---|
| R1, R8 | The first run passed through the tabs, and Tonight's lamp started from 0 | Closed, measured | A4 |
| R3 | A serif face for the name field and a cross-fade on the cover's foot line | The foot line cross-fades; the face exists but is not used | S3 |
| R5 | 74 words against "about 60" | Ruled: about 70, 71 as built | A6 |
| R6 | The 640 pt cover rule | Open: the spec moved to 480 (#238), the code did not | S1 |
| R7 | An invite link on a fresh install shows the join sheet after Yes | Not exercised here (needs the mock server and a signed link); on the run sheet | D10 |
| Spec departure | The put-back line replaces the toast | Accept | L6 |

## 4. Every recorded gap, ruled

| Source | Item | Ruling |
|---|---|---|
| #220 R6, #238 follow-up | `COVER_MIN_FREE_HEIGHT` 640 against 480 | Should (S1) |
| #220 P2-V notes 3, 4, 6 ("open for a later round") | not enumerated in the PR body | not found in the thread the pass could read; the coordinator to say whether they are still wanted (unverified) |
| #220 "needs a phone" items | VoiceOver on the gate, date focus, native picker, haptics, the model-on-phone case | carried into section 7, none dropped |
| #238 | "If a later round does reword either icon row, counsel should see that diff" | no reword here; none proposed |

## 5. Spec-owner changes

Each row changes a line in `docs/design/EXPERIENCE_PASS_2026-10.md` to match what was built and accepted, or to the fix a Should item proposes.

| Spec line | Says now | Proposed wording | Because |
|---|---|---|---|
| S04 Visual, 269 | "shows the review toast 'Put back.' with 'Undo'" | "shows 'Put back.' with Undo in place of the hint under the card, until Undo" | L6 |
| S05 Visual, 311 | "At most three lines, ending in a fade" | add: "a single word that is still wider than the cover at the 13 pt floor sets the floor to 12 pt, or the cover is the 96 pt size" (the spec owner's pick) | S2 |
| S05 Visual, 311 | the date row | add: "a born child's date row carries no second 'Birthday' label" | L2 |
| S07 (354) | "Seven languages, one check" | add: "in the alpha profiles the sheet lists English alone with `languageCopy.picker.englishOnly`" | L3 |
| S08 Visual, 387 | "'Write the first one' full width at the bottom" | add: "pinned below the scrolling step, so it is whole on an iPhone SE" | S4 |

## 6. Measurements (web build, headless Chromium, 60 fps unless stated)

Frame-logged in the page from the tap. "Gate words" and "welcome words" are the visible opacity of the question and of the descriptor.

| Hand-off | What was measured |
|---|---|
| Yes, Continue (gate to welcome) | gate words fully gone 296 ms after the tap (160 ms exit from 138 ms); welcome words first visible at about 700 ms, at 1.0 by 955 ms; the lamp cross-fades from the gate's pool (0.6) to the welcome's from about 560 to 1,520 ms; 0 frames with the tab bar; about 0.4 s of lit paper with no words between the two |
| "Write the first one" (finish to Tonight) | Tonight on screen 459 ms after the tap; the finish lamp (1.0) hands to Tonight's morning lamp (0.7) by 768 ms; the lamp's two layers never sum below 0.7 (two frames show one layer at 0 while the other is rising, which is the cross-fade, not unlit paper) |
| Reduce Motion, promise | content one 200 ms fade, the two strikes complete in the first frame (`reduce-promise-120ms.png`) |

Text size (emulated): the gate keeps Continue on screen at AX5 with the pills stacked (`ax5-01-gate.png`); the promise scrolls 934 pt at AX3 and 2,222 pt at AX5; the finish step on an SE puts the primary at 637 to 693 of 667 (S4).

## 7. What could not be seen on the web: device checks

Each is a two-minute procedure on a phone with the build 2 binary. Mark each Pass or Fail on the run sheet.

- **D1. The cover while the name is typed (S1, S2).** On an iPhone SE and a 17 Pro: fresh install, Yes, Begin the book, That sounds right. Tap the name field and type "Maximilian". Pass: the cover stays beside the title and shows the name live on the 17 Pro (hides on the SE, after the fix); the name never breaks inside a word. Fail: the cover leaves as the keyboard rises, or "Maximilia" over "n" shows.
- **D2. VoiceOver on the gate (A1, A3).** Turn VoiceOver on, launch fresh. Pass: focus lands on "Are you 18 or older?", then a group with "Yes, radio button" and "No, radio button", then "Continue, dimmed"; after No and Continue it says "Early Letters is currently for adults 18 and over" once and focus is not lost. Fail: the group is read without roles or the stop line is silent or read twice.
- **D3. VoiceOver on the promise (A6).** On the promise screen, swipe to the sample. Pass: one element reads the whole sentence with "Taken out: um," and "Taken out: you"; swipe up or down offers "Put it back: um," and the action puts the word back and says "Put back." Fail: the marks are separate stops or are not offered.
- **D4. Haptics.** A selection on Yes or No, on a chip, on a put-back; none on Continue or Back; one success when "The book is open." appears. Pass: exactly those.
- **D5. Dynamic Type.** Settings, Accessibility, Larger Text, Larger Accessibility Sizes at AX3 then AX5, on an SE and a 17 Pro: gate, welcome, promise, child, signature, finish. Pass: nothing is clipped, Continue and "Begin the book" are reachable by scrolling, the gate's pills stack. Fail: any word cut or a button unreachable.
- **D6. The native date picker (A8).** On the child step type a name, leave the date empty, tap the waiting Continue. Pass: the reason line shows its mark and VoiceOver focus or the picker's focus moves to the date control; "Born today" fills it. The compact iOS picker is not testable on the web.
- **D7. The speech card (A11).** On the finish step tap "Download on Wi-Fi" on cellular only, then on a phone with under 575 MB free. Pass: it waits for Wi-Fi with "Getting ready. It waits for Wi-Fi." and no download starts; with low space the card shows the space line and no button.
- **D8. The language sheet in build 2 (L3).** On the signature step tap "Spoken language". Pass: English alone with "Other languages are coming in a later update." and one check.
- **D9. Light across first run.** Watch gate to welcome to child to finish to Tonight in a dim room. Pass: the light never goes out and never jumps; Increase Contrast shows plain paper. The web measured no unlit frame; a phone must confirm.
- **D10. An invite link on a fresh install (#220 R7).** Tap an invite link before the first launch. Pass: the question first, then the join sheet after Yes. Fail: the join sheet before the question.

## 8. The constitution and the content rules, checked

- Nothing on these screens writes, rewrites, summarizes or shapes a person's words. The specimen is a fictional sentence the engine cleaned, with both edits marked and reversible; putting both back yields the raw words (`promise-sample.logic.ts`, `promise-sample.test.ts`).
- Every string comes from `packages/content`; the name is `{app}` (`app.welcome.title` is only the lockup's label). No em dash, en dash, curly quote, ellipsis character or emoji on any first-run screen (checked in the web text of the first-run frames, and by the content tests). The only "we" is "We never rewrite your words, shorten them or write for you." (the sanctioned promise). Nothing genders the child; "your child" fills `{child}` before a name exists.
- No streaks, points, counts or gaps; "Your first two letters are free." is D-082's one line.
- No entry text, transcript, audio or child name in analytics, logs or crash reports: first run sends nothing (analytics are off in these builds; `track('child_added', ...)` carries counts and a boolean only, `onboarding.tsx:231`).
- This document uses the fictional family Asha and the sample names "Christopher", "Maximilian" and "Alexandrina" only as typed test strings; no real family details.

## 9. Coordinator's rulings

None yet. Counts above are the critics' ranks as written on 28 October.
