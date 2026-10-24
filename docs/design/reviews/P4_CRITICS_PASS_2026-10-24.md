# P4 critics' pass: capture and Review (go/no-go B2-10)

Saturday 24 October 2026. The experience critics' pass over package P4 of `docs/design/EXPERIENCE_PASS_2026-10.md` (v1.3): section 6 "P4 Capture and Review", journeys J05, J06 and J07, spec ids S11 to S23, section 5.8 rows 1 to 5c, and the P1 rules P4 leans on (the lamp test: no status colour in a lit room; trust copy is never caption; the saved moment and the arrival). Read against `develop` at **11de4f9**, where all of P4 is merged: P4a #271 (8aa7cf2), P4b #274 (e07ea7e), #277 (30f1103) and #279 (11de4f9). Every file:line below is at 11de4f9. This pass critiques; it changes no app code.

## 0. Verdict for B2-10 (P4's share)

**Not signed yet. One item must be fixed before build 2; with it fixed, P4 is signed for build 2**, provided the twelve Should items are fixed or ruled by the coordinator and the device items in section 7 go on the build 2 run sheet.

P4 is close. The parent at night gets one calm room per moment: Listen is still and honest, the three microphone problems name their real causes, the waiting card never pretends software is writing, Review reads as a letter on a sheet with every mark visible from the first frame, a typed letter keeps with one tap, the save commits before anything moves, and the app lands on the Book in about 1.2 s without a frame of Tonight. The failed save, the failed autosave and the stale link all say the words are safe first and give one way on. Nothing on these screens writes meaning.

The one Must is visual but sits on the trust screen: inside the letter, every mark (a struck "um", a struck repeat, the kept name after a misheard one, a word put back) is drawn in the app's own sans face at 16 pt instead of the letter's serif at 20 pt, so the person's own words read as if the app inserted them.

| Rank | Count |
|---|---|
| Must before build 2 | 1 |
| Should before build 2 | 12 |
| Later | 16 |
| Accept as built | 24 |

The three to fix first: **M1** (the marks in the UI face), **S1** (Change words lost on Close while Close says "Saved on this phone"), **S2** (Write's "Add to Asha's book" breaks over two lines at the default text size on every phone).

## 1. How this was looked at

- A scratch worktree at 11de4f9, `npm ci` (exit 0), the web export built fresh by the e2e global setup.
- The P4 Playwright journeys with the preinstalled Chromium, `JOURNEY_SHOTS=1`: **j04, j05, j06, j07 and j09, 26 of 26 passed** (4.7 min). Screenshots at 402 by 874 pt, 3x.
- A scratch probe (never committed) against patched copies of the web build: the screen-reader state the web reports (react-native-web always says "on"), a font scale reported to the app (so `useIsAccessibilitySize()` branches run), and two fault seams (a save that throws, a draft write that throws). Accessibility text sizes were emulated by scaling every px font size by RN's multipliers (`a11y.logic.ts` `FONT_SCALE`: AX3 2.643, AX5 3.571) with the token caps applied (display 1.6, title1 1.8, title2 2.0, letterDateline 2.4, promptHero 1.8, numeral 1.4). Icons keep their size, as Phosphor glyphs do on iOS. This is an approximation, not iOS Dynamic Type.
- Dark mode (`prefers-color-scheme`), Reduce Motion (`prefers-reduced-motion`, which react-native-web reads), and frame-accurate timings logged in the page on every animation frame (section 6).
- `j19-errors.flow.ts` run once to check a request #271 left with P6: it fails (S12).
- Screenshots stay in the session scratchpad, not in git (COORDINATION section 8): `/tmp/claude-0/-home-user-earlyletters/9c7d4e54-75ea-5024-8f40-e18f5142ba43/scratchpad/critics-p4-shots/` (`default/`, `ax3/`, `ax5/`, `dark/`, `probe/`, `frames/`), and the probe's raw results in `/tmp/claude-0/-home-user-earlyletters/9c7d4e54-75ea-5024-8f40-e18f5142ba43/scratchpad/critics-p4-notes/probe-results.jsonl`.
- Read: CLAUDE.md, the spec sections above, MOTION 2, 5b to 5e, 5l and 6, COMPONENTS 0.1, 2.15a, 2.19, DESIGN_LANGUAGE as P4 cites it, TDD 09 sections 2.1 to 2.12, `packages/content` VOICE.md and BRAND.md, every string these screens read, and the bodies, reviews and recorded lists of #271, #274, #277 and #279.

The web preview is a stand-in. It has no haptics, no VoiceOver, no iOS sheet or keyboard, no native stack animation (it unmounts the tabs under a modal), no speech model and no StoreKit. Where that limits a finding, the finding says so; section 7 lists everything left for a phone.

## 2. Findings, ranked

### Must before build 2

**M1. Every mark in the letter is drawn in the app's face, not the letter's.**
- Spec: S17 Visual (line 635): "Then the words in `letterBody`. Marks use the website's grammar at full opacity from the first frame"; VOICE "The app's own words": the Book shows what a person said "in the letter's serif".
- Built: the paragraph is `letterBody` (`apps/mobile/src/components/capture/transcript.tsx:50`), but each mark is a nested `Text` with no variant (`:55`, `:67-77`, `:83-100`, `:122-136`). The ui `Text` gives a nested span with no variant the legacy default (`apps/mobile/src/components/ui/text.tsx:28`, `text-foreground text-base`) and sets its own `fontFamily` from that class (`text.tsx:136-140`, `components/ui/fonts.ts:72-80`), so the span becomes Mukta Regular 16. Measured on the web build: paragraph `Literata-Regular` 20/32, the struck "um," and "you" `Mukta-Regular` 16 px. On iOS a nested Text's own fontFamily and fontSize win over the parent's in the same way. The same spans ignore Reading Size (`scale`).
- A parent: reads their letter in the book's serif with the struck words, the kept name after "Spelled your way" and any word they put back in a smaller UI face. The word Mama put back, or Asha's name spelled Mama's way, looks like an annotation the app wrote in, on the one screen whose job is to prove nothing was. Visible in light and dark (`critics-p4-shots/default/J06-04.png`, `dark/review-put-back.png`). The struck "um," also runs into "today" with no visible space (`default/J06-01.png`).
- Fix: render the mark spans with React Native's own `Text` (or pass `variant="letterBody"` and the paragraph's `scale`) so they inherit the letter face, size, line height and Reading Size, and pin it with a test that every span in `Transcript` carries no face of its own.

### Should before build 2

**S1. Change words, and every put-back, are lost on Close, while Close tells VoiceOver "Saved on this phone".** (#274 "Not done" N1.)
- Spec: S17 States and VOICE's error row: the words are safe first; S18 acceptance (line 655): "the person's edits are stored as theirs".
- Built: the person's own text and put-backs live only in Review's state (`apps/mobile/src/app/review.tsx:194`, `:206`, `:328-349`); Close is `router.back()` with `closeHint={pendingCopy.write.savedOnPhone}` (`review.tsx:715-717`).
- A parent: fixes a misheard name with Change words at 11 pm, the baby stirs, they tap Close. Next time Review shows the machine's version again; a VoiceOver user was told "Saved on this phone". Write got careful guards for exactly this (#279); Review has none.
- Fix: now, drop the hint (or say nothing) while Review holds unsaved changes; before build 3, store the person's text on the draft (a request to S03, as #274 records).

**S2. Write's primary breaks over two lines at the default text size.** (#274 "Not done".)
- Spec: S19 Visual (line 662): the pair "side by side, stacking at accessibility sizes".
- Built: two full-width `lg` buttons in one `ButtonRow` (`apps/mobile/src/app/write.tsx:215-218`); `addButtonLabel` keeps "Add to Asha's book" (18 characters).
- A parent: on every typed letter the main action reads "Add to Asha's / book" in a tall pill beside a one-line "Keep private" (`default/J07-02.png`, `dark/write.png`, at 402 pt; narrower phones are worse).
- Fix: stack the pair as Review's footer does (primary full width, "Keep private" quiet beneath) and change S19's line to match.

**S3. VoiceOver hears struck words as part of the letter, and the fix rows start folded.** (#274 "Not done"; needs a device.)
- Spec: S17 acceptance (line 644): every mark visible, tappable, reversible; COMPONENTS 2.19 A11y: a rotor or row path to every edit; TDD 09 2.1: Review lists every edit as a row because nested spans are not reliably focusable.
- Built: the paragraph is one `Text` with the struck words inside it (`transcript.tsx:50-140`); the rows sit behind the disclosure, closed by default (`review.tsx:211`, `:901`).
- A parent using VoiceOver: hears "Asha, um, today you you held the spoon" and "Usher Asha" as if every word stays, with no cue that some are taken out, unless they find and open "2 small fixes".
- Fix: give the paragraph the words as they will be kept as its accessibility label, with "2 small fixes" as its hint, and open the rows by default while a screen reader is on.

**S4. "With small fixes | Exactly as said" truncates at accessibility sizes.**
- Spec: S17 Visual (line 635): the 44 pt pills under the sheet; COMPONENTS 0.1: at AX5 "rows stack, nothing truncates silently".
- Built: two `flex-1` pills in one row, labels `numberOfLines={2}` (`review.tsx:970-993`, `:989`).
- A parent with large text: at AX3 the first pill reads "With small" and a cut; at AX5 both labels are cut to a few letters (`ax3/review-sheet-bottom.png`, `ax5/review-sheet-bottom.png`). The control that shows exactly what they said becomes unreadable.
- Fix: stack the two options full width at accessibility sizes (`useIsAccessibilitySize()`), with no line limit.

**S5. At AX5, Listen hides that it is recording and cuts the prompt; Write hides the letter.**
- Spec: S11 Visual (line 472): the prompt "at most 3 lines"; F04-REQ-019 and COMPONENTS 0.1: nothing truncates at AX5; TDD 09 2.3.
- Built: Listen's room scrolls with the controls pinned (the #271 B1 fix holds: Pause, Finish and Let it go are all on screen), but the prompt keeps `numberOfLines={3}` (`apps/mobile/src/app/listen.tsx:353`) and the circle, clock and "Listening." sit below the fold (`listen.tsx:340-393`; the room is 443 pt high with 1,321 pt of content). Write keeps the dateline and the full prompt above the field (`write.tsx:194-202`) and its header status sits beside Close in one row (`write.tsx:175-192`).
- A parent at AX5: during a take sees "To Asha", the audience line and "Tell Asha about" cut with an ellipsis, then Pause and Finish; nothing on screen says it is listening until they scroll (`ax5/listen-recording.png`, `ax5/listen-scroll-1.png`). On Write, "Saved on this phone" runs into "Close" (`ax5/write.png`), and with the keyboard up the stacked pair leaves little or no room to see what they type (emulated without a keyboard; a device check).
- Fix: at accessibility sizes keep the clock and the listening line in the pinned area above Pause and Finish, lift the prompt's 3-line cap (it scrolls now), let Write's status line wrap under the header, and check Write at AX5 with the keyboard up on the run sheet.

**S6. The 3 s screen-reader hold is a guess; TDD 09 asks to hold until the announcement ends.** (#279 "For the spec owner".)
- Spec: TDD 09 2.2 (line 100): "hold the dismiss until the announcement ends (`announceForAccessibilityWithOptions({ queue: true })`) when a screen reader is on"; 5.8 rule 5 (line 1792): about 1.2 s, under the 2 s ceiling.
- Built: `SCREEN_READER_HOLD_MS = 3000` (`apps/mobile/src/components/capture/review-view.logic.ts:190`), timed from the commit and again when the screen-reader state arrives (`saved-moment.tsx:109-115`). Measured on the web with a screen reader reported on: the Book 3.34 s after the commit on both paths.
- A parent using VoiceOver at a slow speech rate: "Kept in Month 7. Added to Asha's book." can still be cut off by the Book's screen change; at a fast rate they wait for nothing.
- Fix: hold until iOS's `announcementFinished` for that announcement, with 3 s as the floor and about 8 s as the cap, and a tap still skips; the ruling on the ceilings is in section 4.

**S7. "Long recordings take a little more time." shows on a 2-second recording.**
- Spec: S14 copy (line 537): `review.waitingLong` "after 8 s".
- Built: `WAITING_LONG_MS = 8_000` regardless of length (`apps/mobile/src/components/capture/words-state.logic.ts:39`, `:125`).
- A parent: says one sentence, the first transcription is slow, and the card says long recordings take longer over "0:02" (`default/J05-11.png`). It is not about their letter, so it reads canned (principle 8, honest states).
- Fix: show the line only when the recording is longer than a minute or has more than one part, and change S14's row to say so.

**S8. A mark's card opens after the whole letter, not under its line.** (#274 "Not done".)
- Spec: S17 Motion (line 637) and MOTION 5d: "tapping a mark expands an inline card under its line".
- Built: the card renders after the transcript, inside the sheet (`review.tsx:832-860`), with no scroll to it.
- A parent: on a long letter taps a mark in the first lines and the card opens below the last line, off screen behind the pinned footer; nothing seems to happen.
- Fix: now, scroll the card into view when it opens; later, open it under its own line as specified.

**S9. VoiceOver speech during a take may be recorded into the letter.** (Needs a device; from #271 lens A's note, already on develop.)
- Spec: the constitution (nothing adds words the person did not say); S11.
- Built: "Listening." is announced once the microphone is live (`listen.tsx:164`), and the elapsed time once a minute while recording (`listen.tsx:113-119`, "1 min 0 s recorded"); resume announces "Listening." again (`:256`).
- A parent using VoiceOver through the speaker: their letter may contain "1 min 0 s recorded", and Review would show it as their words.
- Fix: check on a phone with VoiceOver through the speaker; if it is captured, announce nothing while the microphone is live (the clock keeps its label, read on demand).

**S10. "That was your second free letter." never leaves while a screen reader is on.**
- Spec: S21 copy (line 692) and acceptance (line 701): the Book's toast after the landing, "no action, 4 s", once.
- Built: Toast skips its timeout whenever a screen reader is on, action or not (`apps/mobile/src/components/ui/toast.tsx:71-77`); the Book raises it (`app/(tabs)/book.tsx:140-141`). On the web, which always reports a screen reader, it follows the person onto Tonight and sits under the held letter (journey steps J04-08 and J07-10).
- A parent using VoiceOver: the count of free letters stays above the tab bar on every tab until they swipe it away.
- Fix: keep the 4 s timeout for a toast with no action (the time-limit rule exists for Undo); owner P1 (`toast.tsx`).

**S11. The arrival wash did not show on the web at all.** (Needs a device.)
- Spec: S21 (line 694) and acceptance (line 704): the new card "already in place under a 1.6 s `accentSoft` wash"; 5.8 row 5.
- Built: the Book washes the arrived card when it reads `arrived` (`app/(tabs)/book.tsx:133-146`, `components/book/letter-card.tsx:158-174`). On the web the tabs remount after Review leaves and every wash view measured opacity 0 on every frame from the moment the Book was uncovered. On a phone the tabs stay mounted, so the wash starts while Review still covers the Book and up to 280 ms of it is hidden.
- A parent: lands on the Book and the new letter looks like any other; the receipt of the save is missing.
- Fix: check on a phone first; start the wash when the Book is uncovered (after `route.dissolveMs`), owner P5 with P4's `arrived` contract.

**S12. Two requests #271 left with other owners are still open.**
- j19 (P6's flow) still asserts "Ready when you are" and a "Start" button (`apps/mobile/e2e-web/j19-errors.flow.ts:23`, `:27`); run here, it fails, so P7's journey re-run would record a stale Listen. (Its other test, the 404, fails too, for a reason outside P4.)
- `docs/legal/app-store-privacy-labels.md:172` still quotes the old denied text ("Allow the microphone in Settings to speak your letters. Or type instead."), not "The microphone is off. Turn it on in Settings, or type this one."
- A parent never sees either, but the journey record and counsel's record would both say something the app no longer does.
- Fix: P6 updates j19 to "Tap the red circle and talk." and "Start recording"; S17 updates the quote.

### Later

| # | Spec line | Built (11de4f9) | What a parent meets | Fix |
|---|---|---|---|---|
| L1 | S17 Motion (637), MOTION 5d: "Put it back" cross-fades (out 120, in 160 ms) | the word swaps at once, then the 1.6 s wash (`review.tsx:328-339`) | a small jump in the line | build the cross-fade with the inline card (S8) |
| L2 | 5.8 row 1 (1799): one `press` on Speak | Speak plays `press` (`app/(tabs)/index.tsx:289`) and Listen plays it again at start (`listen.tsx:153`) | two taps for one action | skip Listen's start haptic when Speak armed it (`tapped.current`) |
| L3 | S17 Visual (635): 16 pt gutters | Review's sheet sits in 20 pt (`review.tsx:733`); the saved card is centred in 16 pt (`saved-moment.tsx:128`) | the card jumps 4 pt wider as the moment starts | one gutter for both, and S17's number to match |
| L4 | S16 table (585) | the `unreadable` card reads "No words yet for this one" with no Try again (`words-state.logic.ts:204-207`) | "yet" suggests the words may still come on their own | content owner to choose a title for a recording the phone cannot open (#271 N1) |
| L5 | MOTION 3: screens type no duration | a 1600 ms `setTimeout` (`review.tsx:338`), `FadeIn.delay(80).duration(160)` (`:833`), the paused glow `0.12` (`listening-aura.tsx:88`) | nothing visible | read `newMarkMs` and motion tokens; a paused-glow token |
| L6 | MOTION 6: sheet opening and navigation are silent | `haptic('tap')` on opening Whose book (`review.tsx:364`) and on the fixes disclosure (`:884`) | a tap where nothing was decided | drop both |
| L7 | S14 Visual (546): the stop line in `footnote` | `footnote` `textMuted` (`review.tsx:769`), though "Everything before that is kept." is trust copy under P1's floor (`lib/review-layout.logic.ts:27`) | a reassurance in the smallest type | spec owner to rule (section 5 proposes subhead) |
| L8 | S13 (departure 5) | no `error_shown` code for a busy microphone (`components/capture/mic-state.logic.ts`) | nothing | analytics owner adds a `mic_busy` code |
| L9 | #271 request to S20 | the E174.1 comment lists the readers of `Paths.availableDiskSpace` without Listen's check (`src/lib/privacy-manifest.ts:108-112`) | nothing; the declared reason already covers it | S20 adds the reader to the comment |
| L10 | VOICE "Word for word": never "tidy" | journey notes say "what the machine tidied", "the tidy-up", "tidy-ups" (`e2e-web/j06-review.flow.ts:13`, `:32`; `j18-dark-mode.flow.ts:23`) | the founder's journey record uses the banned word | P7 rewords them when it re-runs the journey |
| L11 | S19 (outside P4's copy) | Write's dateline is composed in code and reads "Asha · 0 days" on the day of birth (`write.tsx:164-165`) | "0 days" is cold on the first day home | content owner and P3 choose the first-day dateline; move the format into `packages/content` |
| L12 | S16 (#271 lens A note 1) | "Hear it" stays on an unreadable take (`review.tsx:609`, `:722`) | on a phone the button may do nothing | check on a phone; hide it when the player cannot open the file |
| L13 | S12 (#271 lens A note 2) | no Close and no Let it go while Listen is asking (`components/capture/listen.logic.ts:69`, `:75`) | if a start ever hangs, no way out but closing the app | bring Close back after a few seconds of asking |
| L14 | S19 (#279 "still not held") | a swipe within the 500 ms pause whose unmount write is the first to fail loses those words (`write.tsx:98-107`) | very narrow: a full disk at the moment of a swipe | write synchronously before the sheet can go, when S03 allows |
| L15 | S18 (652): the 2 pt focus ring for Full Keyboard Access | removed; the system's ring is relied on (#274 decision 6) | unknown until a keyboard test | check with Full Keyboard Access on a phone |
| L16 | COMPONENTS 0.1: labels name the thing | the open card's "Close" (`review.tsx:855-857`) has the same name as the header's Close | VoiceOver hears two "Close" buttons | name the card's button for what it closes (a new key) |

### Accept as built

| # | What | Ruling |
|---|---|---|
| A1 | S14: no 1.5 s rule; only a 0-byte take is "Nothing was recorded" (#271 departure 1) | Accept. The spec's rule would tell a parent a 1.2 s take with a word in it holds nothing (principle 8, D-086). Spec line changes (section 5). |
| A2 | S14: the waiting line in `headline`, not `callout` (departure 2) | Accept. It is `InlineState`'s title, the same as every Review state, and reads well at default and AX5 (`ax5/review-waiting.png`). |
| A3 | Record stop plays Light (`press`), not `soft` (departure 3) | Accept. MOTION 6 is the haptics map of record (Light for start and stop); 5.8 row 4 changes. |
| A4 | The waiting card enters at 90 ms, not 80 (departure 4) | Accept. `motion.enter(3)` is the stagger grid; 10 ms is not perceptible and no 80 ms token is wanted. |
| A5 | A busy microphone sends no analytics code (departure 5) | Accept for build 2: no code is better than a wrong one. The code itself is L8. |
| A6 | 5.8 row 5a by another route: Write hands the letter to Review's one Keep step (`lib/capture/keep-intent.ts`) | Accept. D-082's one Keep step, wired once for M17, outranks the motion line. Measured: one tap to the Book in 1.58 s, no Tonight frame (web). The sheet-to-full-screen replace is a device check (section 7). |
| A7 | 5.8 row 5: Review leaves over `route.dissolveMs` (280 ms), not 200 | Accept. 1.20 s from the commit to the Book (web), "about 1.2 s" holds. Spec and MOTION 5e, 5l change. |
| A8 | 5.8 row 5c partial: the Plus gate replaces Review in place | Accept for build 2. The rising sheet with the held letter is P6's S22; "Keep it here for now" returns to Tonight with the letter waiting (J06-15, J07-10). |
| A9 | S19 "Not saved yet" in `text` with a muted WarningCircle, not caution | Accept. Write is lit paper and D-110 keeps status colours off it (`apps/mobile/test/lamp.test.ts`). |
| A10 | S21 lock chips in `subhead`, not `caption` | Accept. P1's trust-copy floor wins ("Kept just for you." is trust copy). |
| A11 | MOTION 5c: words fade in once over `swapMs` (150 ms), not 180 | Accept. Never word by word, never a cursor; the token exists. |
| A12 | S17: the name wash has square ends | Accept. Nested text cannot take a radius. |
| A13 | S18: Done in the header and in the footer that rides above the keyboard | Accept. The same place as an accessory bar with a bigger target, one fewer Done. |
| A14 | Reduce Motion: one 200 ms fade, then the moment holds to 900 ms from the commit | Accept. Nothing travels; the line can be read; 1.25 s from the commit to the Book (web). Spec words it (section 5). |
| A15 | Write after a failed write holds Close, Android's back and the swipe, retries on each; the web's browser back is not held; an allowed swipe goes by the last write (#279) | Accept. Probed: "Not saved yet", Close stays, keep does nothing until the disk is back, then the newest words reach Tonight. The web preview is not the product. |
| A16 | S12: Pause and Finish show dimmed at rest | Accept with a spec line: controls never move (5.8 rule 3). |
| A17 | The landing: `dismissTo('/book', { arrived })` on the book the letter was kept in | Accept. Tonight was never the selected tab between Review and the Book in five frame-logged runs. |
| A18 | The saved moment's timeline (MOTION 5e, `fileIntoMonthPlan`) | Accept. Chip 287 ms after the commit, the card leaving 550 to 900 ms, words never ghosted (`frames/review-sr-off-*.png`). |
| A19 | The failed save | Accept. Probed: "Your words are still here. That did not work this time." directly above "Try again", which kept to the chosen destination ("Kept just for you."); Keep private stays; said aloud (`review.tsx:542-544`). |
| A20 | S23, a stale Review link | Accept. The page drawing, "Nothing to read back here", "Go to the book", Close, no error, at default and AX5. |
| A21 | S11 to S16 states | Accept. Three microphone causes, three screens, no "we"; the language download with at most two controls; the S16 cards with the `unreadable` card #271 added. |
| A22 | Contrast on these screens | Accept. textMuted on surfaceRaised 5.83 (light) and 7.32 (dark); editMark 5.82 and 7.64; caution on paper 4.75; text on accentSoft 12.07 and 11.20; Review is unlit, so its caution line is allowed. |
| A23 | The words | Accept. Every string comes from `packages/content`; no "we" outside the registered first note; nothing genders Asha; nothing says software wrote, fixed up or improved a letter ("Writing down what you said." names transcription); no counting beyond D-082's one "second free letter" (see S10). |
| A24 | #271 spec note 5: a start that throws after `beginTake` keeps an empty take that Tonight shows as "The recording ended before any sound came in." | Accept. Unchanged behaviour, nothing deleted without the person's act. |

## 3. The five departures #271 declared

| # | Departure | Ruling | Where |
|---|---|---|---|
| 1 | S14's 1.5 s rule not built | Accept; S14 changes | A1 |
| 2 | The waiting line in `headline` | Accept; S14 changes | A2 |
| 3 | Record stop Light, not `soft` | Accept; 5.8 row 4 changes | A3 |
| 4 | The card enters at 90 ms, not 80 | Accept; 5.8 row 4 changes | A4 |
| 5 | No analytics code for a busy microphone | Accept for build 2; the code is Later | A5, L8 |

## 4. Every recorded gap, ruled

| Source | Item | Ruling |
|---|---|---|
| #274 Not done | "Put it back" cross-fade and the inline card under its line | Card position: Should (S8, scroll into view now). Cross-fade: Later (L1). |
| #274 Not done | Row 5's 200 ms against the route's 280 ms | Accept (A7); the spec changes. |
| #274 Not done | Row 5c partial | Accept for build 2 (A8); P6's S22. |
| #274 Not done | Write's side-by-side destinations probably wrap | Confirmed at 402 pt; Should (S2). |
| #274 Not done | VoiceOver reads the struck heard word with the kept one | Should (S3), device. |
| #274 Not done | The saved card does not start where the sheet was | Later (L3). |
| #274 Not done | N1: Change words and put-backs live only in Review's state | Should (S1) for the false hint now; the draft field before build 3. |
| #274 For the spec owner | S19 "Not saved yet" colour | Accept (A9). |
| #274 For the spec owner | S21 chips caption against the trust-copy rule | Accept (A10). |
| #274 Decisions | 1 the S20 route; 2 `dismissTo`; 3 the Book's second-free toast; 4 "Not saved yet"; 5 no 80 or 180 ms tokens; 6 the focus ring; 7 square wash | 1 Accept (A6); 2 Accept (A17); 3 Accept, with S10 for its screen-reader timeout; 4 Accept (A9); 5 Accept (A11, A4); 6 Later, device (L15); 7 Accept (A12). |
| #279 For the spec owner | S18 wording | Accept (A13); the wording is in section 5. |
| #279 For the spec owner | The 3 s hold against "until the announcement ends" | The screen-reader hold beats the 1.2 s and 2 s ceilings: those govern motion a sighted person watches, and a person listening needs the sentence finished. But 3 s is a guess; hold until the announcement ends, 3 s floor, about 8 s cap (Should, S6). |
| #279 For the spec owner | S19 needs a state for the held sheet | Accept (A15); the state is in section 5. |
| #279 Still not held | The web's browser back | Accept (A15). |
| #279 Still not held | A swipe within the pause whose unmount write is the first to fail | Later (L14). |
| #279 Still not held | Close retries, an allowed swipe goes by the last write | Accept (A15). |
| #271 Requests | j19 (P6), the legal quote (S17) | Should (S12). |
| #271 Requests | Privacy manifest comment (S20), busy code (analytics) | Later (L9, L8). |
| #271, #274, #279 Needs a device | the lists in each body | Carried into section 7, none dropped. |

## 5. Spec-owner changes

Each row changes a line in `docs/design/EXPERIENCE_PASS_2026-10.md` (or MOTION.md) to match what was built and accepted, or to the fix a Should item proposes. Line numbers are on 11de4f9.

| Spec line | Says now | Proposed wording | Because |
|---|---|---|---|
| S11 Visual, 472 | the prompt "at most 3 lines" | "at most 3 lines at the default text sizes; at accessibility sizes the whole prompt, in the room's scroll" | S5 |
| S12 Visual, 492 | lists the room at rest | add: "Pause and Finish hold their place below the circle, dimmed, so nothing moves when the take starts; no Let it go before a take exists" | A16 |
| S14 copy, 537 | `review.waitingLong` "after 8 s" | "after 8 s, only for a recording over a minute or in more than one part" | S7 |
| S14 Visual, 546 | "the line in `callout`" | "the line in `headline`, the title every Review state card uses" | A2 |
| S14 Visual, 546 | the stop line "in `footnote` `textMuted`" | "in `subhead` `textMuted`: its second sentence is trust copy, and trust copy is never below subhead" | L7 (spec owner's call) |
| S14 Motion, 548 | "each finished part fades in (180 ms, MOTION 5c)" | "the words fade in once over `swapMs` (150 ms) when they arrive, never word by word" | A11 |
| S14 States, 550 | "a take under 1.5 s goes straight to the empty-take state (S16)" | "a take whose file holds no sound (0 bytes) goes straight to the empty-take state; a short take with sound goes through the queue like any other" | A1 |
| S16 table, 585 to 588 | four rows | add a row: "The recording has sound the phone cannot open (the launch sweep's cut-off take) / `errors.transcriptionFailed.title` / `.body` / Keep the recording / Type it instead", as #271 built | A21 |
| S17 Visual, 635 | "16 pt gutters" and the wash "(radius 4)" | "20 pt gutters, the same for the saved card" and "the wash has square ends (nested text takes no radius)" | L3, A12 |
| S17 Visual, 635 | the segmented control | add: "at accessibility sizes the two options stack, full width, with no line limit" | S4 |
| S17 States, 639, and acceptance | nothing for a screen reader | add: "With a screen reader on, the paragraph's label is the words as they will be kept, its hint the fix count, and the fix rows start open" | S3 |
| S18 Visual, 652 | "'Done' sits in the header and in the keyboard accessory bar. The 2 pt focus ring stays for Full Keyboard Access only." | "Done sits in the header and in the footer, which rides above the keyboard. The system draws Full Keyboard Access's focus ring." | A13, L15 |
| S19 copy, 660 | `write.notSaved` "caution, in the same place" | "in `text` with a WarningCircle in `textMuted`, in the same place (Write is lit paper: no status colour, D-110)" | A9 |
| S19 Visual, 662 | "side by side, stacking at accessibility sizes" | "stacked, as Review's footer: 'Add to {child}'s book' full width, 'Keep private' quiet beneath" | S2 |
| S19, new States line | none | "While words are on screen that the last write could not keep, Close, Android's back and the swipe hold the sheet; each tries the write again and closes once it goes through." | A15 |
| S20 Decision, 671, and 5.8 row 5a, 1806 | "the same sequence plays inside Write's sheet" and "the sheet dismisses natively onto the Book" | "Write writes the words and hands the letter to Review's one Keep step (`lib/capture/keep-intent.ts`); Review holds the sheet still, runs the Keep step, plays the saved moment in its full-screen room and lands on the Book. A failed save or the Plus sheet leaves the ordinary Review, headed 'Your letter'." | A6 |
| S21 Visual and motion, 694 | the chip in "`caption`"; "then Review fades out (200 ms)" | "`subhead` (P1's trust-copy floor)"; "then Review fades out over `motion.route.dissolveMs` (280 ms)" | A10, A7 |
| S21 Reduce Motion, 696 | "one 200 ms fade, then the modal dismisses" | "one 200 ms fade; the moment holds until `sequenceMaxMs` (900 ms) from the commit, then the modal dismisses" | A14 |
| S21, new screen-reader line | none | "With a screen reader on, the moment is said once at the commit and holds until that announcement has finished (iOS `announcementFinished`), at least 3 s and at most about 8 s from the commit; a tap still skips." | S6 |
| S21 copy, 692 | `secondFreeNote` "(no action, 4 s)" | add: "4 s with a screen reader on too: the time-limit rule is for toasts with an action" | S10 |
| 5.8 rule 5, 1792 | "about 1.2 s, under the 2 s `hardCeilingMs`" | add: "With a screen reader on, the hand-off waits for the saved moment's announcement (S21); the 1.2 s and 2 s figures are for motion." | S6 |
| 5.8 row 4, 1803 | "`soft` when the take ends"; "the moon card `enter`s at 80 ms" | "`press` (Light) when the take ends (MOTION 6)"; "at 90 ms (`motion.enter(3)`, the stagger step)" | A3, A4 |
| 5.8 row 5, 1805 | "Review fades out (200 ms)" | "Review fades out over `motion.route.dissolveMs` (280 ms): about 1.2 s from the commit to the Book" | A7 |
| 5.8 row 5c, 1808 | "the Plus gate sheet rises over Review" | add: "until P6's S22 ships, the gate replaces Review's content in place; 'Keep it here for now' closes Review back to Tonight" | A8 |
| MOTION 5e and 5l (row 5, rule 5) | "Review fades out (`fadeMs`)"; "about 1.1 s" | "over `route.dissolveMs`"; "about 1.2 s" | A7 |

## 6. Measurements (web build, headless Chromium, 60 fps)

Frame-logged in the page from the tap; "commit" is the first frame the saved moment is on screen.

| Path | Commit | Chip visible | Book uncovered | From commit | Tonight seen between |
|---|---|---|---|---|---|
| Review, screen reader off | 139 ms | 426 ms | 1,336 ms | 1,197 ms | never |
| Write one tap, screen reader off | 354 ms | 640 ms | 1,578 ms | 1,224 ms | never |
| Review, screen reader on | 179 ms | 462 ms | 3,521 ms | 3,342 ms | never |
| Write one tap, screen reader on | 195 ms | 478 ms | 3,535 ms | 3,340 ms | never |
| Review, Reduce Motion, screen reader off | 155 ms | 158 ms | 1,409 ms | 1,254 ms | never |

The web stack does not run the iOS dissolve, so on a phone add up to 280 ms of overlap before the Book is fully clear; it stays under the 2 s ceiling with the screen reader off.

At AX5 (emulated): Listen's pinned Pause, Finish and Let it go end at 848 pt of 874 (all on screen); the saved moment's chip and line sit at 470 to 803 pt (on screen, the #274 2-line excerpt fix holds).

## 7. What we could not see on the web

- **Haptics**: every one (Light at record start and stop, `success` at the commit, `warning` after a confirmed Let it go), and whether iOS mutes them during a take.
- **VoiceOver**: the header read as "To Asha, Month 7" and "From Mama" (react-native-web drops a Text's label, so the web tree shows the dot); struck words inside the paragraph (S3); whether the saved moment is read twice (its Pressable label and the announcement); whether 3 s is enough (S6); where focus lands after Finish; the waiting card announced after the dissolve; whether VoiceOver's own speech is recorded into a take (S9). On the web the invisible header Close and Let it go slot appear in the tree as dimmed buttons, because `accessibilityElementsHidden` is iOS only; check they are hidden on iOS.
- **Dynamic Type**: only emulated here. The AX5 screenshot #271 put on the device run sheet (a take from Tonight with a 3-line prompt on a 6.1-inch iPhone and an SE) is still owed, now with S5's questions.
- **The iOS sheet and keyboard**: Write's page-sheet shape and its lamp under the sheet; the swipe-down hold after a failed write and `gestureCancel` closing once the disk is back; the native replace from Write's sheet to the full-screen Review (a possible Tonight flash, A6); `KeyboardAvoidingView` lifting Review's and Write's footers; the caret staying visible at AX sizes; smart punctuation from the real keyboard.
- **Native transitions and light**: the 280 ms dissolves in and out of Listen and Review, Tonight's lamp leaving and returning (`useUnlitRoom()`), the Book positioned under its opener before its first frame, and the arrival wash (S11).
- **The microphone**: real metering and the aura's release, a call or Siri interrupting a take, leaving the app mid-take, a phone under 50 MB (the web never asks), returning from Settings with the microphone on, the Reduce Motion ring, and Let it go's native confirm (the web shows no Alert).
- **Speech**: the web has no model, so no real take ever gets words; Review with words came only from the seeded Asha letters.
- **Plus**: StoreKit and the real S22 sheet; the web shows "Plus is not available on this device yet."
- **The first-letter sign-in sheet** 600 ms after the Book (5.8 row 5b): the web builds used here run with server features off.
- **Settings the web cannot set**: Increase Contrast, Reduce Transparency, Low Power Mode; Android's back (Android comes later).

## 8. The constitution and the content rules, checked

- The person's words are kept exactly: typed letters are stored as typed (`typedFinalText`, `review-view.logic.ts:125`, #274 B1); spoken words go only through `cleanSpoken` and `verifyEdits`; `rawTranscript: raw` is unchanged; "Exactly as said" shows the raw words and says "Exactly as you said it." only when they are untouched.
- Machine edits are visible and reversible both ways: every mark from the first frame, put back and Undo (J06-03 to J06-07), "Exactly as said" and back. M1 is about the face they are drawn in, S3 about how they are heard.
- Nothing on these screens writes meaning: the header ("To Asha · Month 7", "From Mama"), the chip and the lines are the app's small words in the app's face; the saved card shows the words as kept; Write calls no engine.
- No entry text, transcript, audio or child name in analytics: only `error_shown` codes, `review_action` actions, counts and edit types.
- This document uses the fictional family Asha only, and no em dashes, en dashes, curly quotes, ellipsis characters or emoji.
