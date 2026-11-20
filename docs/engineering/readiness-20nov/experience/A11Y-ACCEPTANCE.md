# 3. Accessibility acceptance: rows, orders, names, settings, and where each is tested (deliverable 3 of 4)

Owner `design-systems` (RD-B, 20 Nov 2026). Docs only. Sources: NS-33 rows R1 to R16 (`docs/product/prd/11-foundations.md:262-276` at `450bcb4a` [V]); `docs/design/specs/NS-33-ACCESSIBILITY-FLOOR-20nov.md` on develop `16e61549` (my earlier spec, read in full [V]); e2e A11y lines in the area DESIGN.md files; system FOUNDATIONS 3.5, 4.3, 4.4, 11 and COMPONENTS 1.3 (read [V]); TDD 11 section 3 (`docs/tdd/new-scope/11-foundations.md:88-112` [V]). Tags and status codes as in `EXPERIENCE-ACCEPTANCE.md`. Test levels: **S** source scan, **U** unit, **J** simulator journey (Maestro), **D** device row.

Standing facts: the WCAG and Apple floor is LEGAL-REQ-051 and A-NFR-005 to 007; Voice Control and Switch Control gate at submission (NS-33 s2 [V]); device rows run on an iPhone SE 3 (375 pt) on the Asha install, iOS 17 and latest (NS-34-R7, R5 [V]); no label may carry the child's name beyond what the screen shows (TDD 11 s3 privacy line [V]).

## 1. Every NS-33 row: owner, level, state on develop

| Row | What to prove | Level | On develop | Next step (owner) |
|---|---|---|---|---|
| R1 letter page dateline is level 1 | first and only `asHeading={1}` | S + D | Test built (`a11y-headings.test.ts:35` [V]) | VoiceOver rotor row V1 (qa) |
| R2 Me heading equals tab | no `headerTitle` on the Me tab | S + D | Test built (`:56` [V]) | V2; AX5 bar title spill F-3 (design-systems) |
| R3 lens is one choice | `radiogroup` of `radio`, no `tablist` | S + D | Not built: lens not on develop; `ChoiceGroup` ready (`choice-group.tsx:76-80` [V]) | scan `no tablist in src` lands with #840 (mobile) |
| R4 AX5 no cut, no control under 44 | scan plus walk | S + D | Scan built for 4 routes (`a11y-ax5.test.ts:73,94` [V]); toast stacks (`toast-large-text.test.ts:24` [V]); Book bar part open (BL-928 (d)) | walk X1 (qa) |
| R5 no loop under RM | loops register | U + D | P: Button spinner and `Breathe` still loop (`button.tsx:162`, `state-screen.tsx:112` [V]) | ENG-M13 |
| R6 VoiceOver core loop, start/stop within 1 s | device | D | Not run; E2E-15 smoke flow exists (`apps/mobile/e2e/flows/E2E-15-voiceover-smoke.yaml` [V name]) | qa run sheet |
| R7 AX5 + Bold Text | walk | D | Not run (BL-984) | qa |
| R8 contrast under Increase Contrast | tokens plus device | U + D | Tokens tested (`tokens.test.ts:107` [V]) | v2 roles (section 8) |
| R9 Voice Control names | names table | S + D | Not built | section 4 |
| R10 Switch Control reach | no gesture-only action | S + D | Not built | section 5 |
| R11 Smart Invert ignores pictures | `accessibilityIgnoresInvertColors` | S + D | Not built: 0 hits in `apps/mobile/src` [V grep] | PhotoFrame both branches, BookCover symbol, lockup (mobile) |
| R12 recording not colour alone | each Listen phase has a text element naming it | S + D | Text exists (A-S05 line "Listening."); no test | BL-984 (b) |
| R13 tab bar Large Content Viewer | built, regression | S | Built (`(tabs)/_layout.tsx:57` `LARGE_CONTENT(title)` [V]); `button.tsx:192` LCV props [V] | native tabs must keep it (DS2-10) |
| R14 Bold Text on custom fonts | heavier face | D | Not built: no code reads Bold Text (TDD 11 3.2 R14 [V]) | Conflict C-05: Tiro has no heavier cut |
| R15 undo waits for VoiceOver | T4; NS-01-R38a (10 s, or VoiceOver read plus 10 s, whichever is later), R38b (no Undo control outlives its window), R38c (Switch Control until the parent moves on) | U + D | N. `toast.tsx:10` [V] says an action toast never times out; the card names exactly that as the unmet defect (R38b: a toast with an action never times out while `undoPhotoChange` refuses after `expiresAt`, #839 `attach.ts`). Needs a timed window helper (the card's seconds, VoiceOver-finish aware, Switch Control aware) and a test that the Undo control and its accessibility node leave in the same frame as the window closes | Conflict C-02: our TDD 11 decision 2 builds the opposite; the card wins |
| R16 automated audit at AX5, zero critical | XCUITest `performAccessibilityAudit()` | D | No XCUITest target; Maestro only (TDD 11 R16 [V]) | `apps/mobile/a11y-audit/` project (mobile, [E] 2 to 3 days: new native test target) |

## 2. VoiceOver reading order, per screen

Rule: the order below is the area DESIGN.md order (the design wins on order; the card wins on any conflict). Test: **J/D** with VoiceOver, swipe right from the top, record labels. **S proxy (Rec)**: `apps/mobile/test/a11y-order.test.ts` reads a fixture `{screen: [testID,...]}` and checks those testIDs appear in that order in the route file's JSX with comments removed, and that none of them sets an absolute-position wrapper that reorders. This proves source order only; it is a regression guard, not a proof of what VoiceOver reads.

| Screen | Order (first to last) | Source |
|---|---|---|
| A-S01 Home | switcher, dateline, greeting (heading 1), slip (one element "{name}. {line}", action "Not today", then visible "Not today"), typed-day line, prompt, Another thought, Plus line, Speak, Type, Start from a photo, Not much today | A DESIGN A-S01 [V] |
| A-S05 Listening | To {child}, lock line, prompt, clock, line, Pause, Finish, Let it go. Never speaks into the take; labels hold still; "Paused." only after the recorder stops | A DESIGN A-S05 [V] |
| A-S07 Review | Close, Play, "Read it back" (heading), stop line, words card, To {child}, day line, From, letter (one element), view control (radio), fixes count, fix rows, Change words, another language, picture, Change photo, Take the photo off, Let it go, Add to book, Keep private | A DESIGN A-S07 [V] |
| B-S01 Book | title (heading 1), age, switcher, Read together, lens choice ("Show, Months, selected"), Find, Go to a month, More for this book, new-phone line, month headings and cards | B DESIGN B-S01 [V] |
| B-S08 Letter page | dateline (heading 1), picture, words, Play, Share, "This letter" (heading 2), rows in order, Delete | B DESIGN B-S08 [V] |
| B-S19 Read together | page words, Next letter, Back one; position not announced as a count | B DESIGN 550 (VC names) [V]; order [U] |
| E-S10 Keep gate | sheet is modal; title first; held letter; plan; Keep it here for now; escape returns to Review | E DESIGN 568 [V] |
| All other screens | the "VoiceOver order" line in the screen's DESIGN.md section | [U] not collected; 130 ids |

Cross-screen rules: one element per row or card with a composed label; no separator glyphs spoken; "still working" lines polite and at most once a minute (NS-33 s6 [V]); the first heading is the screen's title (EX-03); focus returns to the same element after a call (NS-33 s6 [V]); after an app kill, relaunch lands on Home's heading.

## 3. Dynamic Type to AX5 on an iPhone SE 3 (375 pt)

| Item | Acceptance | Level | State |
|---|---|---|---|
| Setting the size | `apps/mobile/e2e/bin/a11y-sizes.sh ax5` then relaunch (`xcrun simctl ui booted content_size accessibility-extra-extra-extra-large`) [V script] | J | built |
| Layout switch | every switch uses `useIsAccessibilitySize()` (AX1 and up, threshold 1.786; `lib/a11y.logic.ts`) so four screens change together | S | P |
| Letter text | `letterBody`, `signature` and snippets never truncate and never take `maxFontSizeMultiplier` (D-027, EX-02) | S | B (scan) |
| Chrome caps | hero and display 1.6, title1 and promptHero 1.8, title2 2.0, letterDateline 2.4, numeral 1.4 (`tokens.ts` per spec 0.1 [V]) | U | B |
| Controls | at least 44 pt including `hitSlop`; Button `sm` 44, `md` 48, `lg` 56, capture 64 (`button.tsx:61-64` [V]) | S | B |
| Rows | stack value under title from AX1; button pairs stack; footers ride inline after the last item | J + D | P |
| Tab bar | labels do not scale; Large Content Viewer shows them | D | B |
| With Bold Text | repeat the walk (R7) | D | N |
| Walk list | Home waiting state; Review fixes; Book top and inline bar; letter page with player and Aa Large print; sheets (Change the date, Delete) (spec 5.5 [V]) | D | not run |
| **v2 changes the numbers** | v2 scales each token on Apple's own curve (body 56 pt at AX5, today 64; `FOUNDATIONS.md:286-300` [V]). My width checks in the NS-33 spec used today's uniform 3.571 scale; they must be redone after DS2-04 | U + D | Conflict AM-06 |

Test fixture (Rec): the per-token AX table from FOUNDATIONS 4.3 as `packages/design-tokens/test/type-scale.test.ts` (DS2-04 "done when").

## 4. Voice Control names

Rule (EX-05): the accessible name begins with the visible label (WCAG 2.5.3); no two controls on one screen share a name; icon-only controls take a one-word name equal to their Large Content Viewer title. Test (Rec): a fixture `apps/mobile/test/fixtures/voice-names.json` `{screen: [visibleLabel,...]}`, built from the e2e WORDS "VC" column (`B WORDS.md:12` [V] defines it), with a unit test that each screen's names are unique and each equals the key's text, and a device pass saying "Tap <name>" for each.

Known collisions and near-collisions (found by reading, each with a fix already proposed in the design):

| Names | Where | Why it breaks | Design fix | State |
|---|---|---|---|---|
| "Months" (go to a month) and "Months" (lens) | Book bar once #840 lands | two controls named the same in one bar | the button becomes "Go to a month" (`B WORDS.md:31,457` [V]); develop still says "Months" (`components/book/copy.ts:20`, `book.tsx:352` [V]) | N (found on #840; PROPOSED key `en.book.goToMonth.button`) |
| "Not today" (day slip, Open now line) and "Not much today" | Home | similar spoken names | keep words; device check; fallback "Hide for today" PROPOSED (`B WORDS.md:429` G11 [V]) | open (needs content/founder if fallback) |
| "Keep" family: "Add to {child}'s book" and "Keep private" | Review | "Keep" is a prefix of one label only | none needed; confirm on device | D |
| "Let it go" on Review, on Listen and in the confirm | A-S05, A-S07, A-S11 | same name, different screens or a modal over | modal traps focus so only one is live | D |
| "Close" | sheets and headers | Close on a sheet over a screen that has Close | modal rule (EX-04) | D |
| "Share" | letter page and iOS sheet | system's own | none | n/a |
| "Done" vs "Save" in sheets | day sheet, From sheet | two verbs for one act | content decision (do not decide here) | send to content |

Rows reading as icon-only on today's screens: Find, More for this book, IconButton `md` family. Each needs a one-word `accessibilityLabel` (S: no `IconButton` without `accessibilityLabel`; [U] not checked on develop).

## 5. Switch Control

| Row | Acceptance | Level | State |
|---|---|---|---|
| Every control reachable by item scanning (R10) | each glass cluster is one scan group; each row is one item | D | N |
| No gesture-only action | page turn has Next and Back buttons; toast swipe has Close; sheets have Close; "Not today" slip has a visible button as well as the custom action | S + D | P: Read together buttons built; `family.tsx` always has a way to leave (`family.tsx:37` comment [V]) |
| Nothing auto-advances | undo windows end only when the parent moves on (T4); no timer closes a sheet | U + D | P |
| Detecting Switch Control | React Native has no query for it; v2 COMPONENTS R2 asks for a small native module around `UIAccessibility.isSwitchControlRunning` ([U], I did not verify the API name) | S | N; mobile [E] 1 to 2 days (basis: one Swift file, one config plugin) |
| VoiceOver finish detection for T4 | `announcementFinished` is used on develop in 2 files [V grep] | U | P |

## 6. Reduce Motion, Reduce Transparency, Low Power

| Row | Acceptance | Level | State |
|---|---|---|---|
| Reduce Motion | every `m.*` takes its RM form (MOTION-ACCEPTANCE 2); no loop (R5); aura static ring with opacity steps at most once per 400 ms | U + D | P: `useReducedMotion` built (`lib/motion.ts:62` [V]) |
| Reduce Transparency | glass becomes solid token with hairline; hook exists as `reduceTransparency` (`a11y.ts:131,145` [V]) but no glass code reads it | S + D | N |
| Low Power Mode | every loop stops; needs `useLowPowerMode()` and `expo-battery` (D-065); not in `apps/mobile/package.json` [V grep, no match] | D | N (founder or Karma decision on the dependency) |

## 7. Increase Contrast, Smart Invert, Differentiate Without Colour, dark mode

| Row | Acceptance | Level | State |
|---|---|---|---|
| Increase Contrast | every role takes its HC value; text 7:1 for muted and accent on bg, surface, surfaceRaised, accentSoft; control edges 4.5:1; bars go solid | U + D | B for current roles (`tokens.test.ts:107` [V]); v2 adds `glassLabel`, `glassBorder`, `mediaSolid`, `onMedia` (DS2-01) |
| Reading the setting | `isDarkerSystemColorsEnabled` is read on develop (`a11y.ts:129` [V]), so DS2-08's premise ("a small module if RN has no query") is already met (AM-07) | U | B |
| Smart Invert | pictures, thumbnails, viewer, brand lockup, BookCover symbol ignore it; text does not | S + D | N |
| Differentiate Without Colour | selected = fill + 1.5 pt edge + check; recording = shape + word; errors = glyph + words; Waiting chip = text + shape | S + D | P |
| Dark mode | both palettes pass the same pair tests; photos at 92 percent brightness (FOUNDATIONS 11 [V]); hairline frame on pictures; screenshot every state in `ax5`, `dark` | U + D | P: palette tests built; photo brightness N |
| Colour change under v2 | `success` #3F7A55 to #3B724F and `caution` #94661A to #895E18 in light (`tokens.ts:30-31` vs `tokens.v2.json` [V]); re-run pair tests | U | AM-08 |
| Bold Text | face map swaps one step (Mukta 400 to 500, Literata 400 to Medium 500 opsz 30); stage 2 adds cuts (DS2-05) | D | N |

## 8. RTL and Devanagari

| Row | Acceptance | Level | State |
|---|---|---|---|
| Scope | a full RTL interface is out of scope (NS-33 s3 "Not in scope", F44 later [V]); letter words in other scripts must render and read correctly | n/a | rule |
| RTL states drawn | only `B-S05.rtlLabel` and `B-S06.rtlRow` are drawn; B-S01 card, B-S07, B-S08, B-S17, B-S19 list `.rtl` but are not drawn (`B DESIGN.md:747` [V]) | S + D | partial |
| Text direction per run | a letter or label in Arabic sets `writingDirection` and aligns right (`language-row.tsx:105` sets `writingDirection` [V]) | S + D | P |
| Spoken language | letter words carry `accessibilityLanguage` (`language-picker.tsx:177`, `language-row.tsx:105` [V]); the Book and letter page must do the same (NS-33 s6 "Multilingual" [V]) | S | P: not on the letter page [U] |
| Devanagari faces | Mukta covers Latin and Devanagari for UI; Tiro Devanagari Hindi Regular only for letter runs (`FOUNDATIONS.md:271-277` [V]); `fonts.test.ts` checks faces exist | U | B |
| Devanagari at AX5 and Bold | line height 1.5 clears Literata (1.485 em) but Tiro's own metrics are not checked [U]; Bold Text has no heavier Tiro (FOUNDATIONS 4.4 Q3 [V]) | D | open; Conflict C-05 |
| NS-34 scroll run | the Book scroll run includes Devanagari, Arabic, Chinese letters (NS-34 s6 [V]) | D | not run |

## 9. Test-level summary (what each level proves, what only a phone proves)

| Level | Proves | Cannot prove |
|---|---|---|
| S source scan | no truncation props, no `tablist`, headings, names present, `accessibilityIgnoresInvertColors` present, no literal motion | what VoiceOver says, wrapped widths, real contrast of glass |
| U unit | token contrast pairs, type scale table, spring and cap constants, undo helper timing | anything involving the OS settings |
| J simulator | AX5 layout via `a11y-sizes.sh`, journey asserts of states by `testID`, RM states | VoiceOver speech and rotor, Switch Control, Voice Control, Smart Invert (simulator shows the toggle but the walk is manual) |
| D device | VoiceOver order and speed, Voice Control commands, Switch Control, Bold Text, glass under RT/IC, XCUITest audit | nothing (but each costs a person and a phone) |

Founder or counsel: none decided here. Questions with defaults: Q-a11y-1 which accessibility features to declare in the Apple label (default: none until the walk passes, TDD 11 s open questions [V]); Q-a11y-2 whether Bold Text keeps Devanagari in Tiro Regular (default per FOUNDATIONS Q3: stays Regular; product and design to rule).
