# 4. Design delta: where e2e and system v2 differ from our merged designs and from develop (deliverable 4 of 4)

Owner `design-systems` (RD-B, 20 Nov 2026). Docs only. I decide no word and no design question. A **Conflict** goes to `product` (cards win, CR-66). An **Amendment** is a change engineering makes to its own TDD or code once the design is accepted. Compared: e2e and v2 on `docs/e2e-ux-20nov` at `9e78eecd` (head is now `7e684984`, lines re-checked); our TDDs `docs/tdd/new-scope/09-capture.md`, `10-reading-and-family.md`, `11-foundations.md` on develop `16e61549`; the code on develop; the locked cards at `450bcb4a`. Tags: [V] verified (file:line), [E] estimate with basis, [U] unverified.

## 1. Conflicts for product (each needs a ruling before the build)

| Id | The two things that disagree | Cites | Default I would build until ruled | Needs |
|---|---|---|---|---|
| C-01 | **Where the picture sits on the letter page.** Card NS-01 s3 row 3 and e2e B-S08 put it above the words. Our TDD 10 C2 recommends keeping #839's place, after the words and signature, because `CardToPage` carries the card's words into a measured spot at the top | `B DESIGN.md:326` [V]; `tdd-10:51` [V] | the card (above), then re-test the card-to-page carry with a picture of unknown height (W test on `CARD_TO_PAGE`) | product |
| C-02 | **Undo clock: our TDD 11 contradicts the locked card.** Locked NS-01-R38a: Undo works 10 s, or until VoiceOver has read the line plus 10 s, whichever is later; R38b: when the window closes the Undo control is gone in the same moment, and a toast with an action that never times out is named there as the unmet defect (with `undoPhotoChange` refusing after `expiresAt`); R38c: Switch Control keeps it until the parent moves on. e2e agrees with the card (timed windows, `A DESIGN.md:896-906`; F1 `window`, `COMPONENTS.md:324`). TDD 11 decision 2 builds one clock that never times out and calls R38b true by construction: that is the defect the card names, so it is wrong, and it would also need the 10 s refusal in `undoPhotoChange` removed. The quality catalogue (#926) designs the card's test | `01-photo-with-a-letter.md:167-169` at `450bcb4a` [V]; `A DESIGN.md:896-906` [V]; `COMPONENTS.md:324` [V]; `tdd-11:25` [V]; `toast.tsx:10` [V] | the card: a timed window helper (seconds from the card, VoiceOver-finish aware, Switch Control aware), the Undo control and its accessibility node leave in the same frame, the refusal after `expiresAt` stays. Amend TDD 11 decision 2 | product confirms; cto amends TDD 11 |
| C-03 | **Spinner or words.** `tokens.v2.json` `motion.rules` (Karma, 20 Nov): busy controls show words at every Reduce Motion setting, never a spinner. v2 MOTION `m.progress.wait`: system indicator plus words, words only under RM. E prototype plays an 800 ms spin. Develop's Button shows `ActivityIndicator` | `tokens.v2.json` motion.rules [V]; `v2 MOTION.md:80,87` [V]; `E proto:66` [V]; `button.tsx:162` [V] | words only everywhere (the stricter, matches the ruling) | product, design owner |
| C-04 | **First-run cover opening and the joined cover.** Built and specified 10 Nov (`cover.holdMs` 300); v2 retires it as ceremony. D-S17 draws the arrival without it | `book-cover.tsx:121` [V]; `v2 MOTION.md` section 13 table, row `JoinedCover` [V]; `FIRST-RUN-MOTION-SPEC-10nov.md` on develop [U not re-read] | retire (ENG-M13) | product (founder saw the 10 Nov motion) |
| C-05 | **Bold Text on Devanagari.** NS-33-R14 says Tiro renders heavier; v2 FOUNDATIONS 4.4 says no heavier Tiro exists and leaves it as Q3 | `11-foundations.md:275` (lock) [V]; `FOUNDATIONS.md:327-341,599` [V] | Tiro stays Regular; row R14 reads "Mukta and Literata heavier, Tiro unchanged" | product (card edit) |
| C-06 | **Slip order.** The locked frame card (00 s67) has four ranks: waiting cards, seal-opened line, Save a copy, one past letter. e2e A-S01 draws six (adds a day slip 2b and a Days ask 3b from NS-50, unlocked), and A DESIGN itself says 2b and 3b need a new backlog row. `EXPERIENCE-ACCEPTANCE.md` A-S01 says the same four ranks | `00-product-frame.md:67` at `450bcb4a` [V]; `A DESIGN.md:286-293` [V]; `e2e/BRIEF.md` s2 [V] | four ranks; NS-50 additions wait for a lock | product |
| C-07 | **Toast has no Close.** v2 F1 draws a capsule with Undo and no Close glyph. Develop's toast has Undo and Close, both 44 pt, and our NS-33 spec stacks them at AX5. Switch Control and Voice Control users need a way out that is not a swipe | `COMPONENTS.md:323` [V]; `toast.tsx:14` [V] | keep Close | product and design owner |
| C-08 | **Start from a photo weight.** NS-49-R1 text says "one of the equal starts" in s3 and "never larger than Speak" in R1; design draws it third and quiet. e2e passes this up itself | `A DESIGN.md` section 11.3 item 5 (about line 980) [V] | quiet, third | product |
| C-09 | **Lens "Months" and the Book bar.** NS-22 s3 renames the button to "Go to a month"; develop says "Months"; two "Months" in one bar break Voice Control once #840 lands | `B WORDS.md:457` [V]; `copy.ts:20` [V] | rename (PROPOSED key `en.book.goToMonth.button`) | product and content (a word) |
| C-10 | **Pass-through of e2e's own flags.** A 11.3 lists six contradictions between FR text and cards (FR-OPP-03, FR-OPP-07, FR-OPP-04, NS-50-R3 vs R15, NS-49-R1, FUNCTION-TRACE 6.1); B, C, D, E carry more in `INDEX.md:732-842` | `INDEX.md:732-760` [V] | follow the card; the area file says what it did | product (not re-listed here) |

### Id map (so no file dead-ends)

Other files in this set first used draft ids D-01 to D-08 (and "Delta 8", "Delta 12"). They are now: D-01 = C-01 (picture position); D-02 = AM-06 (AX5 type scale); D-04 = C-02 (undo clock); D-05 = C-03 (spinner or words); D-06 = C-04 (cover opening); D-08 = C-05 (Bold Text on Tiro); Delta 8 = AM-08; Delta 12 = AM-07. Everywhere, use C-nn and AM-nn only. `tokens.ts` and `tokens.test.ts` cites mean `packages/design-tokens/src/tokens.ts` and `packages/design-tokens/test/tokens.test.ts`. The e2e head is now `7e684984`; I re-checked the e2e lines cited in this set against it and none moved (only DESIGN.md and INDEX.md changed, and the cited headings and rows sit on the same lines).

## 2. Amendments for engineering (our docs and code)

| Id | Change | Where | Basis |
|---|---|---|---|
| AM-01 | `tdd-11` R2 says `headerTitle: t.you`; the spec on develop deletes `headerTitle` so one key feeds the bar. TDD should say "delete". | `tdd-11:96` vs NS-33 spec s4 [V] | already built that way on develop |
| AM-02 | Spring `standard` 0.40 s (260/30) to 0.30 s (439/38.5); `m.zoom` and every sheet we still draw retune; `transitions.test.ts` timelines re-run | `tokens.ts:307` [V]; `v2 MOTION.md:45` [V] | v2 timing cap 300 |
| AM-03 | `sequenceMaxMs` 900 to 600; `tokens.test.ts:174` asserts 900 and must change. NS-34 hand-off lines (900 ms, 2000 ms) stay: they are budgets, not move lengths | `tokens.ts:327` [V]; `tokens.test.ts:174` [V] | v2 MOTION 5 |
| AM-04 | Retire `gentle`, `reduceMotion`, `cover`, `emptyBreathMs`, lamp breath (pending lamp ruling), `file` renamed `keep`, `cardToPage` renamed `zoom`, `newMarkMs` renamed `markMs` | `tokens.ts:309-366` [V]; `v2 MOTION.md` 13 table [V] | rename map |
| AM-05 | `Settle` in `book.tsx:515`, `Breathe` in `state-screen.tsx:112`, `WaitingBar` sweep in `join-ask.tsx:78` follow v2 (static, tokenised, off under RM and LPM) | files cited [V] | ENG-M13 |
| AM-06 | Type scaling per Apple style curve (body 56 pt at AX5, today 64) invalidates the width arithmetic in the NS-33 spec s5.1, written on the uniform 3.571 scale | `FOUNDATIONS.md:286-300` [V]; spec 5.1 [V] | DS2-04; redo the AX5 walk after it |
| AM-07 | `useContrastPreference` already reads Increase Contrast (`isDarkerSystemColorsEnabled`) and Reduce Transparency; DS2-08 assumes a native module may be needed. Close DS2-08 as built, keep the device check | `a11y.ts:129-131,145` [V]; `FOUNDATIONS.md` DS2-08 [V] | read the code |
| AM-08 | Colours `success` #3F7A55 to #3B724F, `caution` #94661A to #895E18 (light); radius `md` 14 to 16, `lg` 20 to 24, `xl` 28 to 32; new `target.md` 48, `size.row` 52, `layout.*`; Q2 screenshots before and after (DS2-03) | `tokens.ts:30-31,126-132,382` vs `tokens.v2.json` [V] | every screen changes shape |
| AM-09 | Lens: `ChoiceGroup layout="segmented"`; matches TDD 11 decision 1 and e2e B-S03. No change, listed so nobody builds `tablist` | `tdd-11:24` [V]; `B DESIGN.md:254` [V] | agreement |
| AM-10 | Book list is a `SectionList` (`book.tsx:23,433`); v2 T-MIN needs a ScrollView as first child and notes `FlatList` does not work (S6). A device spike decides; until then the tab bar does not minimise | `v2 MOTION.md:152,190` [V] | ENG-M3 |
| AM-11 | Haptics: `success` trimmed to Keep, export finished, joined; 41 files call `haptic(` today. Behaviour change for parents | `v2 MOTION.md` 9 [V]; grep count [V] | ENG-M10 |
| AM-12 | Sheets: 7 files import `@gorhom/bottom-sheet`; v2 moves iOS sheets to native `formSheet` | grep count [V]; `package.json:7` [V] | ENG-M5, R4 |
| AM-13 | Icons: 47 files import `phosphor-react-native`; v2 wraps SF Symbols with Phosphor fallback; `expo-symbols` is not in `apps/mobile/package.json` (only in the licence list) | grep count [V] | DS2-09; dependency decision (Karma) |
| AM-14 | `sequenceMaxMs`, spring and easing numbers differ in prototypes B, C, D, E from v2 (only A plays v2). Do not use those prototypes as timing truth | `MOTION-ACCEPTANCE.md` 8 | design-systems to refresh the four (Rec) |

## 3. Build first: tokens and components that do not exist in code

Sizes are [E]: engineer-days, basis = rows in FOUNDATIONS 14 (sizes S, M, L there) and COMPONENTS 11, converted S about 1 day, M about 3, L about 5 to 8; plus the code facts above. They are guesses to order the work, not a plan. Order is dependency order.

| # | Item | Today | Needs | Size [E] | Blocks |
|---|---|---|---|---|---|
| 1 | Motion tokens v2 and tests (ENG-M1; MOTION-ACCEPTANCE 7 tests 1 to 3) | old block `tokens.ts:303-375` | rewrite, rename map, `dist/` regen | 3 days | everything in motion |
| 2 | Colour, layout, size, radius, target tokens (DS2-01 to 03, 06) | `tokens.ts` lacks `glassLabel`, `glassFallback`, `glassBorder`, `glassDim`, `mediaSolid`, `onMedia`, `layout.*`, `target.md`, `size.row`, `timer` | add with pair tests; Q2 screenshots | 4 days | glass, photos, Home |
| 3 | `lib/motion.ts` v2 API: `m.*` names, `useReduceTransparency`, `glassStyle(show)`; `useLowPowerMode` blocked on `expo-battery` | `lib/motion.ts:62-157` | extend | 3 days (+1 after D-065) | screens |
| 4 | Text per-style scaling and Bold Text face map (DS2-04, DS2-05) | uniform scale; no Bold Text read (TDD 11 R14 [V]) | `Text` change; four font cuts; size check vs 40 MB | 6 days | AX5 and Bold rows |
| 5 | `Icon` wrapper (DS2-09) | Phosphor in 47 files | `expo-symbols` dependency; mapping table; scan | 4 days | native tabs |
| 6 | `GlassSurface`, `GlassCluster`, `GlassLayer` (DS2-07, R5) | none | RT, IC, pre-26 fallbacks; scans | 5 days + device spike | cluster, toast, header |
| 7 | Native tabs spike then build (DS2-10, ENG-M3) | JS tabs, paper bar | `unstable-native-tabs` (alpha per v2 S6); SectionList question | 2 + 4 days | Book header |
| 8 | Native sheets (ENG-M5, R4); `ConfirmSheet` v2 over the confirm sites | 7 files on gorhom; `ConfirmSheet` exists in `book/` | `formSheet`, detents, move to `ui/` | 6 days | Keep gate, Share, Day |
| 9 | `SystemLine` (E-S15) and `Progress` (F3) | none (0 files [V grep]) | new components with `m.enter`, `m.move` | 3 days | offline, low storage, export |
| 10 | `PhotoFrame` (C3, C4) with Smart Invert off | none | new; both branches ignore invert | 3 days | Photos lens, Review, letter page |
| 11 | `DoorNote`, `Dateline`, slip host + registry (C9, BL-963) | none (0 files [V]) | new; registry as data with test `[FRAME-SLIP]` | 4 days | Home, Days |
| 12 | Toast v2: glass, timed window if C-02 says so, no fourth glass (F1, ENG-M7) | toast built, untimed | per ruling | 3 days | all undo lines |
| 13 | Button v2 and IconButton fold (A1, R6); `TextField` search and compact | `button.tsx` sizes built | codemod of callers | 4 days | glass buttons |
| 14 | Capture cluster and record control on glass (A2, A3, R9) | `index.tsx:244-260` (AUDIT G3 cite, [U]) | after 6, 13 | 4 days | Home |
| 15 | Smart Invert props; Voice Control names fixture; a11y-order fixture; Switch Control probe module; XCUITest audit project | 0 hits for invert [V] | per A11Y-ACCEPTANCE | 2 + 1 + 1 + 2 + 3 days | R9, R10, R11, R16 |
| 16 | Story screen `(dev)/components.tsx` mirroring `REFERENCE.html` (R12) and `REFERENCE.html` motion section (ENG-M15) | none | every component and state, light, dark, RM, RT, IC, AX5 | 5 days | review by design |
| 17 | Device matrix for glass (DS2-12, ENG-M9, ENG-M11) | none | people with phones | 3 days of device time | founder phone time |

Total [E]: about 65 to 75 engineer-days if one person did all of it serially; two lanes (design-systems, mobile) as FOUNDATIONS 14 and COMPONENTS 11 split them can run about half that. This is a rough sum of my own row guesses, not a commitment.

Not in the list because the plan owns it: photos, Find, Days, Share, Sealed, Family screens (cards NS-01, 02, 05, 06, 18, 25, 46 and others). Their component needs are in rows 9 to 14.

## 4. What I could not do or verify

- Did not read every area DESIGN.md section in full (130 ids). Rows built from the inventory are marked "(inv)" in the acceptance files; an implementer reads the section first.
- Did not play any prototype; constants were grepped. Nobody has listened to VoiceOver on a phone for any claim here.
- `easing.exit` value, `UIAccessibility.isSwitchControlRunning` use, whether native `formSheet` can morph from a glass button, and whether iOS suppresses glass style animation under Reduce Motion are unverified in v2 itself.
- NS-50 to NS-52 and the function files are unlocked; rows citing them are PROPOSED and I built no acceptance for them beyond the inventory line.

## 5. Cite log (sampled for this four-file set)

Held means I opened the file at that line or ran the command and the claim matched.

| # | Cite | Held |
|---|---|---|
| 1 | `tokens.ts:305,307,309` springs | yes |
| 2 | `tokens.ts:327-330` sequence, ceiling, newMarkMs | yes |
| 3 | `tokens.ts:382` targets | yes |
| 4 | `tokens.ts:126-132` radii | yes |
| 5 | `tokens.ts:30-31` success, caution | yes |
| 6 | `tokens.test.ts:172-225` motion tests | yes |
| 7 | `a11y-headings.test.ts:35,56` | yes |
| 8 | `a11y-ax5.test.ts:73,94` | yes |
| 9 | `toast-large-text.test.ts:24` | yes |
| 10 | `lib/motion.ts:62,81,83` | yes |
| 11 | `a11y.ts:129-131,145` | yes |
| 12 | `button.tsx:61-64,162,192` | yes |
| 13 | `state-screen.tsx:21,112` Breathe | yes |
| 14 | `toast.tsx:10,14` | yes |
| 15 | `copy.ts:20`, `book.tsx:352` "Months" | yes |
| 16 | `book.tsx:515-516` gentle; `:23,433` SectionList | yes |
| 17 | `book-cover.tsx:121` cover hold | yes |
| 18 | `join-ask.tsx:64,78` sweep | yes |
| 19 | `package.json:7,34` gorhom, glass | yes |
| 20 | `choice-group.tsx:76-80` radiogroup | yes |
| 21 | `lamp.tsx:129` reduced | yes |
| 22 | `letter/[id].tsx:104`, `onboarding.tsx:387-397`, `draw-on.tsx:22` literals | yes |
| 23 | lock `11-foundations.md:262-276` R1 to R16 | yes |
| 24 | `INDEX.md:11-16` counts; `:74-75` B-S25/26; `:288` no-T line | yes (after one correction: 142, not 191) |
| 25 | `A DESIGN.md:896-906` undo table; `:274-293` Home | yes |
| 26 | `v2 MOTION.md:45,125-126,172,178` | yes |
| 27 | `tdd-11:24,25`; `tdd-10:51` | yes |
| 28 | `C proto:287-288,338,380-392`; `D proto:259-263,809`; `E proto:46-47,66,101,105` | yes |
| 29 | `tokens.v2.json` motion.rules, radius, success, caution | yes |
| 30 | `B WORDS.md:31,429,457` | yes |
| 31 | `COMPONENTS.md:45-56,323-324` | yes |
| 32 | `FOUNDATIONS.md:271-277,286-300,327-340` | yes |
| 33 | `B DESIGN.md:254,326,747` | yes |
| 34 | `A proto:147,149`; `B proto:213`; `C proto:148`; `D proto:158,165` | yes (first draft cited B/C/D lines from memory and two were wrong; fixed) |
| 35 | `e2e/BRIEF.md` s2 four slips | yes |
| 36 | grep counts: 41 `haptic(` files, 47 phosphor, 7 gorhom, 23 `withTiming|withSpring` | yes at `16e61549` |

Held: 36 of 36 after correction; 3 first-draft errors found and fixed (the 191 count, two prototype line numbers, one wrong attribution of `toastMs` to B instead of C). `(tabs)/_layout.tsx:57` verified at the end. Sampled but not counted: claims marked [U].
