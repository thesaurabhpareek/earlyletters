# Test plan 05: design and accessibility (Build 13 and the locked pack)

Owner agent: design-systems (test cases only, no code). Date: 20 Nov 2026. Base sha: 3e16f6a2 (branch docs/test-plan-build-13).
Sources read: brief `/home/claude/tp/brief.md`; `docs/design/e2e/INDEX.md` (sections 1, 2 A, 6, 7, 8 read; section 3 to 5 skimmed), `RULINGS-20nov.md`, `IA-AUDIT.md` (sections 0 to 2), `E-foundations-and-system-states/DESIGN.md` (section 2 rule 8, headings); `docs/product/prd/11-foundations.md` (NS-33, NS-34, NS-35, NS-37 rows), `10-reading-and-family.md` (NS-21 rows), `19-from-download-to-first-letter.md`, `21-days-cultural-photos-home.md`, `27-photo-moments-and-media.md` (a11y and copy rows only), `01-photo-with-a-letter.md` (NS-01-R41), `14-test-plan.md` (gates, settings list, section 7), `23-dependency-map-and-plan.md`, `18-errata-after-lock.md` (E17, E41, E42, E53); quality: `JOURNEYS-AND-DEVICE-SHEETS.md`, `TEST-CASE-CATALOGUE-A` and `-C`; tests: `packages/design-tokens/test/*`, `apps/mobile/test/{a11y-headings,a11y-ax5,toast-large-text,tab-bar,design-system-gaps,navigation-one-entry,start-capture,lamp,theme-leaks,no-system-indexing,listen-voiceover}.test.ts`, `packages/content/test/rules.test.ts`.
Not read: the five area `WORDS.md`, `MOTION.md`, prototypes, `COMPONENTS.md`, `MOTION.md` (docs/design), NS-01 to NS-20 rows other than R41, PRD functions files.
Counts: rows read 66 (NS-33 16, NS-34 7, NS-35 7, NS-21 17, NS-37 1, cards 19/21/27 design and copy rows 17, NS-01-R41 1); design-pack checks without a card row 12 (cite rulings, E DESIGN rule 8, or IA test ids; titles PROPOSED). Cases written: 71. By status: BUILT 2, PARTIAL 13, GAP 24, DEVICE 27, DOC 5, UNVERIFIED 0 (counted from the Status column).
Unverified: ruling 37 and INDEX name `docs/design/system/MOTION.md`, `COMPONENTS.md`, `tokens.v2.json`; none exists in this worktree (`ls docs/design/system` fails; no tokens.v2.json anywhere). Every case that needs them says so. No test was run; no mutant was applied (mutants are designs). Drop tags: card 21 release cut (A Build 13, B conditional, C after 1.0, D = card 19 stack); NS-21 drop not stated on the card (see Questions).

Levels: U unit, I integration, S source scan (positive control needed), C content rule, J journey, D device, P process. Fixture family: Asha only. Device rows use the sheet shape of `JOURNEYS-AND-DEVICE-SHEETS.md` section 3 (Step | Journey and rows | Phone, settings | Steps | Expected | Run by); the sheet is in section 7 below.

## 1. NS-33 everyone can use it (card 11, Drop A, all P0 unless shown)

| Case | Row | Exact title | Lvl | Pri | Drop | Fixture, act, assert | Mutant | Lane | Status (file) |
|---|---|---|---|---|---|---|---|---|---|
| D01 | NS-33-R1 | `[NS-33-R1] letter page heading` | U | P0 | A | Read `letter/[id].tsx`: dateline is the only `asHeading={1}`, label unchanged. Rotor level read on SE 3 recorded `[stand-in]` (ruling 29) | Drop `asHeading={1}` from the dateline | design-systems | BUILT (a11y-headings.test.ts:35); row stays partial until the rotor read (D63) |
| D02 | NS-33-R2 | `[NS-33-R2] Me heading matches tab` | U | P0 | A | Read `(tabs)/_layout.tsx` block for `you`: title and tab label use `t.you`, no `headerTitle` | Add `headerTitle: copy.settings.title` | design-systems | BUILT (a11y-headings.test.ts:56) |
| D03 | NS-33-R3 | `[NS-33-R3] lens is a choice, not tabs` | S | P0 | A | Render lens (#840): one radiogroup, exactly one selected; scan src for `tablist` = 0 | Make the lens `role="tablist"` | design-systems | GAP (no test cites it; lens not found in src this run, UNVERIFIED whether #840 merged) |
| D04 | NS-33-R4 | `[NS-33-R4] AX5 on SE 3` | S | P0 | A | Scan Home, Listen, Review, Book, letter page: no `numberOfLines` without the AX guard, no `adjustsFontSizeToFit`, no `allowFontScaling={false}`, no `size="sm"` IconButton, no Chip | `numberOfLines={1}` on the Home greeting | design-systems | PARTIAL (a11y-ax5.test.ts:73, :94; toast-large-text.test.ts:24); the measured 44 pt and no-truncation half is D (D05) |
| D05 | NS-33-R4 | `[NS-33-R4] AX5 on SE 3` (device half) | D | P0 | A | Step 3.7 below: AX5 on SE 3, five screens, measure each control, read each line in full | Fixed-height row round a Text | design-systems | DEVICE |
| D06 | NS-33-R5 | `[NS-33-R5] no loops under Reduce Motion` | S | P0 | A | PROPOSED proxy: every `withRepeat` or `loop(` in `apps/mobile/src` sits in a file that reads `useReducedMotion` (today breathe.tsx, join-ask.tsx; positive control: a planted file with `withRepeat` and no read) | Add a `withRepeat` in a file with no reduce read | design-systems | GAP (lamp.test.ts:99 covers the lamp only) |
| D07 | NS-33-R5 | `[NS-33-R5] no loops under Reduce Motion` (device half) | D | P0 | A | Step 3.8: Reduce Motion on, each screen 30 s, screen recording; includes system spinners (Button, auth) | Loop with `reduceMotion: ReduceMotion.Never` and no guard | design-systems | DEVICE |
| D08 | NS-33-R6 | `[NS-33-R6] VoiceOver core loop` | D | P0 | A | Step 3.9: SE 3, VoiceOver, eyes off: start, stop, review, undo a fix, Keep; stopwatch start and stop announce <= 1 s | Remove the stop announce | design-systems | DEVICE (listen-voiceover.test.ts holds announcements quiet while recording; it proves silence, not the 1 s) |
| D09 | NS-33-R7 | `[NS-33-R7] AX5 with Bold Text` | D | P0 | A | Step 3.7 again with Bold Text on: Home, Review, Book, letter page pass D05 | Fixed-height row | design-systems | DEVICE |
| D10 | NS-33-R8 | `[NS-33-R8] contrast` | U | P0 | A | tokens: every text pair on `bg`, `surface`, `surfaceRaised` >= 4.5:1 in light, dark, and each with Increase Contrast; add the pair rows for the four screens | Lighten `textMuted` one step | design-systems | PARTIAL (tokens.test.ts:90 to :115, atmosphere.test.ts:97; none cites the id, no per-screen pair list) |
| D11 | NS-33-R8 | `[NS-33-R8] contrast` (device half) | D | P0 | A | Increase Contrast on, light then dark: Accessibility Inspector contrast on Home, Review, Book, letter page | Token edited, device only | design-systems | DEVICE |
| D12 | NS-33-R9 | `[NS-33-R9] Voice Control labels` | S | P0 | A | PROPOSED proxy: on the five screens, every Button/Pressable with visible text has `accessibilityLabel` equal to or starting with it; planted mismatch is caught | `accessibilityLabel="Go"` on a button reading "Keep" | design-systems | GAP |
| D13 | NS-33-R9 | `[NS-33-R9] Voice Control labels` (device half) | D | P0 | A | Step 3.10: Voice Control, Show names; say each visible label | Same | design-systems | DEVICE |
| D14 | NS-33-R10 | `[NS-33-R10] Switch Control reach` | D | P0 | A | Step 3.10: Switch Control item scan reaches every control on the five screens. PROPOSED scan: no `accessible={false}` on a Pressable | `accessible={false}` on Keep | design-systems | DEVICE (proxy GAP) |
| D15 | NS-33-R11 | `[NS-33-R11] Smart Invert ignores pictures` | S | P1 (guards NS-01-R41, NS-49-R30, NS-51-R34, NS-52-R28 pictures) | A | Scan: `PhotoFrame`, thumbnails and the brand mark set `accessibilityIgnoresInvertColors`; positive control: planted image without it | Remove the prop from PhotoFrame | design-systems | GAP (red today: grep finds 0 uses in `apps/mobile/src`) |
| D16 | NS-33-R12 | `[NS-33-R12] recording state not colour alone` | U | P0 | A | Render Listen recording: a text label and a shape (not only terracotta); assert both nodes exist | Remove the "Recording" word, keep the disc | design-systems | GAP |
| D17 | NS-33-R13 | `[NS-33-R13] tab bar large content` | S | P1 | A | tab-bar scan: every tab button spreads `LARGE_CONTENT(title)` | Remove the spread | design-systems | PARTIAL (tab-bar.test.ts:44 asserts it; title does not cite the id) |
| D18 | NS-33-R14 | `[NS-33-R14] Bold Text on custom fonts` | D | P1 | A | Bold Text on SE 3: Mukta and Literata heavier; Tiro stays Regular (E17); fixture: letter page with Devanagari line | none (device) | design-systems | DEVICE (NEEDS EVIDENCE per card) |
| D19 | NS-33-R15 | `[NS-33-R15] undo windows wait for VoiceOver` | U | P0 | A | Fake timers: VoiceOver on, undo window = seconds + read time; Switch Control: open until move on | Fixed `setTimeout(seconds)` | mobile | GAP |
| D20 | NS-33-R16 | `[NS-33-R16] automated audit` | D | P0 | A | Accessibility Inspector audit by hand at AX5 per named screen, zero critical, marked `[stand-in]`; not CI (E42, BL-162 PROPOSED) | none | design-systems | DEVICE (never claimed green until an XCUITest target exists) |

## 2. NS-34 quick on the smallest phone (card 11, Drop A)

| Case | Row | Exact title | Lvl | Pri | Drop | Fixture, act, assert | Mutant | Lane | Status (file) |
|---|---|---|---|---|---|---|---|---|---|
| D21 | NS-34-R1 | `[NS-34-R1] run sheet recorded` | P | P1 | A | `docs/qa/evidence/<date>-<build>-se3.md` has met or missed for every section 3 number (screen change <= 100 ms, controls by 350 ms, no frame > 16.7 ms, loops opacity-only and off under Reduce Motion and Low Power Mode, iPad smoke) | Blank cell | qa | DOC (evidence dir holds TEMPLATE.md, KIT-B1.md only) |
| D22 | NS-34-R2 | `[NS-34-R2] a miss holds the feature` | P | P0 (c) | A | Run sheet row with MISS has an open BL row and its flag off in `eas.json` (preflight reads evidence; PROPOSED) | MISS row, flag on | qa | DOC |
| D23 | NS-34-R5 | `[NS-34-R5] runs on Asha only` | S | P0 (a) | A | `no-real-family-data` over tracked files incl. `docs/qa/evidence/*`; plant a real-looking name in an evidence file | Add a non-Asha name to a sheet | qa | PARTIAL (no-real-family-data.test.ts reads `git ls-files`; title does not cite id; hash-only list) |
| D24 | NS-34-R6 | `[NS-34-R6] markers content-free` | S | P0 (a) | A | Scan perf marker names and payloads for path, text, name fields; positive control with a planted `path` | Add `path` to a marker | analytics | GAP (no perf markers in src, grep found none) |
| D25 | NS-34-R3 / R4 / R7 | `[NS-34-R3] run sheet provenance` | P | P1 | A | Evidence front matter holds model, iOS (17 and latest), fingerprint; file name pattern | Missing fingerprint | qa | DOC |

## 3. NS-35 only Home starts a letter (card 11, Drop A)

| Case | Row | Exact title | Lvl | Pri | Drop | Fixture, act, assert | Mutant | Lane | Status (file) |
|---|---|---|---|---|---|---|---|---|---|
| D26 | NS-35-R1 | `[NS-35-R1] only Home starts` | S | P0 (c) | A | Navigation scan: nothing outside Home calls `startCapture` or pushes `/listen` or `/write` | Push `/write` from Book empty state | mobile | PARTIAL (navigation-one-entry.test.ts:209 "[IA-N3]", :221 "[IA-N5]"; title does not cite NS-35-R1) |
| D27 | NS-35-R3 | `[NS-35-R3] doorways land, never start` | U | P0 (c) | A | Fixtures: notification tap and link; route is Home or reading screen, recorder never armed | Arm Listen in the notification handler | mobile | GAP |
| D28 | NS-35-R4 | `[NS-35-R4] extensions are doorways` | S | P0 (c) | A | Scan share extension, notification actions, intents: none calls recorder or `store.keep` | Call keep from an action | mobile | GAP |
| D29 | NS-35-R5 | `[NS-35-R5] closed source list` | U | P1 (store rule guard for D26) | A | Add a source handler without a list entry in `start-capture.logic.ts`; test fails | Handler only | mobile | PARTIAL (start-capture.test.ts:33 "the list is closed"; no id) |
| D30 | NS-35-R7 | `[NS-35-R7] no microphone from outside` | U | P0 (a) | A | Spy on mic port; arrive via `resilience/start-intent.ts` cold open; port untouched | Request mic in start-intent | mobile | PARTIAL (resilience.test.ts imports start-intent; no id, mic spy not seen) |

## 4. NS-21 letter page (card 10, Drop A; sheet S-14 step 4.12)

| Case | Row | Exact title | Lvl | Pri | Drop | Fixture, act, assert | Mutant | Lane | Status (file) |
|---|---|---|---|---|---|---|---|---|---|
| D31 | NS-21-R4 | `[NS-21-R4] headings for the rotor` | U | P0 (b) | A | Dateline heading 1, list title heading 2 (`asHeading={2}`); level read on device `[stand-in]` (ruling 29) | List title as plain Text | design-systems | PARTIAL (a11y-headings.test.ts:35 covers dateline only; list title level 2 not asserted) |
| D32 | NS-21-R9 | `[NS-21-R9] private always shows its row` | U | P0 (a) | A | Asha book, one adult, private letter: "Who can read it" row present | Hide when one adult | design-systems | GAP |
| D33 | NS-21-R11 | `[NS-21-R11] no author controls on another's letter` | U | P0 (a) | A | Other parent's Asha letter: Who can read it, Sealed until, Earlier versions, Delete all absent from tree | Show Delete to non-author | design-systems | GAP |
| D34 | NS-21-R12 | `[NS-21-R12] writing tools off on the words sheet` | S | P0 (a) | A | Words sheet field sets writing tools off, or a `production` profile that shows the sheet fails | Remove the prop | mobile | GAP (no-system-indexing.test.ts:22 notes it open; no title cites it) |
| D35 | NS-21-R13 | `[NS-21-R13] no system donation from the letter page` | S | P0 (a) | A | X6 scan includes `letter/[id].tsx`: no NSUserActivity, Spotlight, Siri | Add `NSUserActivity` search | security | PARTIAL (no-system-indexing.test.ts:315 and :357 cite [X6-R1], scan covers src; no NS-21 cite) |
| D36 | NS-21-R14 | `[NS-21-R14] VoiceOver order` | U | P1 (completes R4) | A | Order: dateline, words, Play, Share, list title, rows, Delete | Move Share below the list | design-systems | GAP |
| D37 | NS-21-R5 | `[NS-21-R5] rows at AX5 on SE 3` | D | P1 (guards D31) | A | Step 4.12: AX5 plus Bold, each row >= 56 pt, nothing cut | Fixed 44 pt row | design-systems | DEVICE |

## 5. Design rows in cards 19, 21 and 27 (assistive settings, copy, signals)

| Case | Row | Exact title | Lvl | Pri | Drop | Fixture, act, assert | Mutant | Lane | Status (file) |
|---|---|---|---|---|---|---|---|---|---|
| D38 | NS-40-R13 | `[NS-40-R13] the age screen works with VoiceOver and at AX5` | D | P0 (b) | D | Sheet step 5.1: focus on the question, two answers read as a choice of two, Continue reachable at AX5 | Answers as two plain buttons | design-systems | DEVICE |
| D39 | NS-41-R22 | `[NS-41-R22] sign-in works with VoiceOver and at AX5` | D | P0 (b) | D | Heading takes focus, code field one element with length, error announced once, actions above keyboard | Error announced twice | design-systems | DEVICE |
| D40 | NS-42-R15 | `[NS-42-R15] the agreement line is visible at AX5` | D | P0 (b) | D | AX5 on SE 3: agreement line and both links visible above Agree without scrolling past | Move the line below the button | design-systems | DEVICE |
| D41 | NS-43-R13 | `[NS-43-R13] the first book at AX5 and with VoiceOver` | D | P0 (b) | D | Asha book form: every field, choice, reason read in order, nothing cut | Fixed-height field row | design-systems | DEVICE |
| D42 | NS-45-R18 | `[NS-45-R18] leaving works with VoiceOver and at AX5` | D | P0 (b) | D | Sign-out sheet, two deletion steps, scheduled screen: all reachable and in order | Hide step 2 action below fold | design-systems | DEVICE |
| D43 | NS-44-R12 | `[NS-44-R12] the first letter is quiet` | U | P0 (a) | D | First Keep with words: success haptic once (ruling 33 list), no confetti, badge, count, streak | Add a second haptic or a count line | mobile | GAP (recording-haptics.test.ts exists, no id; ruling 33 list test not found) |
| D44 | NS-46-R26 | `[NS-46-R26] Days page works with assistive settings` | D | P0 (b) | B | C-S24 to C-S26 at AX5 plus Bold, VoiceOver, Voice Control, Switch Control: 44 pt, row reads "{name}, around {date}" | Row split into two elements | design-systems | DEVICE |
| D45 | NS-47-R25 | `[NS-47-R25] the ask and lists work with assistive settings` | D | P0 (b) | B | Ask slip, C-S25, C-S24: "Not now" same size as primary, lists flat, nothing truncates | "Not now" as a text link | design-systems | DEVICE |
| D46 | NS-47-R29 | `[NS-47-R29] call-out visible, static and first` | U | P0 (a) | B | Render ask slip and C-S25: `DoorNote` not collapsible, not dismissible, no glass, first in reading order | Add a dismiss control | design-systems | GAP (component not in src, UNVERIFIED) |
| D47 | NS-49-R9 | `[NS-49-R9] the phone's title is never stored unless the parent takes it` | U | P0 (a) | B | "From your phone: {title}" shows a glyph plus words, field starts empty, Clear is 44 pt | Prefill the field | design-systems | GAP |
| D48 | NS-49-R17 | `[NS-49-R17] assistive settings work` | D | P0 (b) | B | Suggestions choice and one-photo sheet at AX5, VoiceOver, Voice Control, Switch Control | Thumbnails 40 pt | design-systems | DEVICE |
| D49 | NS-50-R12 | `[NS-50-R12] slip motion with Reduce Motion and VoiceOver` | D | P1 (rulings 31, 36) | A/B (UNVERIFIED) | Cold launch `m.enter.group`; Reduce Motion: `m.fade` <= 200 ms or jump; SE 3 row for OQ-H1 prompt jump | Slide under Reduce Motion | design-systems | DEVICE |
| D50 | NS-50-R14 | `[NS-50-R14] day slip anatomy and labels` | U | P1 | A/B (UNVERIFIED) | Slip is one non-interactive element "{name}. {line}", custom dismiss action, separate 44 pt button | Nest a Pressable inside | design-systems | GAP |
| D51 | NS-51-R34 | `[NS-51-R34] assistive settings work` | D | P0 (b) | C | Asha pictures: "Picture 1 of 5", never described, thumbnails ignore invert, 44 pt | Describe a picture in the label | design-systems | DEVICE |
| D52 | NS-52-R28 | `[NS-52-R28] assistive settings work` | D | P0 (b) | C | "Picture 2 of 4" or "Video, 42 seconds"; optional "Describe this picture" holds only typed words | Fill alt text from the machine | design-systems | DEVICE |
| D53 | NS-46-R19 | `[NS-46-R19] the app never says a day is missing` | C | P0 (a) | B | Rules test over real `days.*` keys: no "missing", "complete your list", count of ticked days | Add "{n} days ticked" | content | GAP (rules.test.ts has no days rule; keys UNVERIFIED) |
| D54 | NS-46-R22 | `[NS-46-R22] no look-back and no count` | C | P0 (a) | B | Day note title, body, landing: no "last year", "again", "another", no digit count | "Another year of {day}" | content | GAP |
| D55 | NS-48-R4 | `[NS-48-R4] no gap in the words` | C | P0 (a) | B | Reminder copy r1 to r4: no gap, count, comparison, judgement | "It has been {n} days" | content | PARTIAL (rules.test.ts:316 "[C-REQ-005]" counts days, runs, gaps in reminder strings; not NS-48 keys) |
| D56 | NS-47-R38 | `[NS-47-R38] no day name beside a child name on a lock screen` | C | P0 (a) | B | Enumerate lock-screen strings; none holds a day name and `{child}`; neutral body has no `{child}` (ruling 3) | `{child}` in `days.lock.body.neutral` | content | GAP |

## 6. Design pack: states, tokens, motion, copy (no card row of its own; titles PROPOSED, priority P1 unless a cited row sets it)

| Case | Row | Exact title | Lvl | Pri | Drop | Fixture, act, assert | Mutant | Lane | Status (file) |
|---|---|---|---|---|---|---|---|---|---|
| D57 | E DESIGN 2 rule 8 | `[DS-STATE-1] every IA screen at AX5 content scrolls, primary pinned` (PROPOSED) | D | P1 | A | Sheet step 6.1: for each screen id in INDEX 2 (A 18, B 26, C 27, D 27, E 32) render default, empty, loading, error, offline, partial at AX5 on SE 3; list pass or miss per id | Truncate one title | design-systems | DEVICE |
| D58 | E DESIGN 2 rule 8; NS-33-R4 | `[DS-STATE-2] no state names a number or a gap` (PROPOSED) | C | P1 | A | Rules test over every WORDS.md key for the states of INDEX section 2: no count, "behind", "missed" | "You have 3 drafts" | content | PARTIAL (rules.test.ts:182 guilt, :289 streaks and gaps; WORDS.md keys not in `packages/content` yet, UNVERIFIED) |
| D59 | NS-37-R1 | `[NS-37-R1] Book scroll with pictures` | D | P1 | A | Step 6.3: Asha book 1,000 letters, 300 pictures, Instruments Animation Hitches 30 s: no frame > 16.7 ms; also Book empty (0), 1 and 50 letters | Decode full size in the list | mobile | DEVICE (no hitch test in repo) |
| D60 | Ruling 30; NS-33-R8 | `[DS-TOK-1] glassFallback pair tests` (PROPOSED) | U | P1 | A | `glassFallback` dark `#282421` text pairs >= 4.5:1; edge `line` hairline 3:1, HC edge `controlBorder` | Use `surfaceRaised` with no edge | design-systems | GAP (token absent in `tokens.ts`) |
| D61 | Ruling 27; NS-01-R41 | `[NS-01-R41] pictures have a hairline frame` | U | P2 | A | `mediaFrame` dark `#716A62` vs `bg` and `surface` >= 3:1; light equals `line`; same name in native and web CSS | Light uses `bg` | design-systems | GAP (token absent) |
| D62 | Rulings 26, 28 | `[DS-TOK-2] spring.standard 0.30 s and glass dim 35 percent` (PROPOSED) | U | P1 | A | `spring.standard` response 0.30 s (439 / 38.5), `glass.dim` 0.35; critical-damping test (tokens.test.ts:218) still green | Leave 260 / 30 | design-systems | GAP (tokens.ts:307 still 260 / 30, response 0.4) |
| D63 | Ruling 29; NS-33-R1 | `[NS-33-R1] letter page heading` (device read) | D | P0 | A | Step 6.4: VoiceOver rotor Headings on letter page; record level and `[stand-in]`; "This letter" is level 2 | none | design-systems | DEVICE |
| D64 | CLAUDE.md "one source for iOS and web" | `[DS-TOK-3] token drift between iOS and web` (PROPOSED) | U | P1 | A | Every colour, radius, size, duration in `tokens.native.css` equals the `tokens.web.css` value and `tokens.ts`; no hex in `apps/mobile/src` | Edit `dist` by hand | design-systems | PARTIAL (tokens.test.ts:62, :65 sync; brand-parity.test.ts:39; theme-leaks.test.ts:54 no hex; per-value native-vs-web compare absent) |
| D65 | Ruling 31; NS-34 sec 3; NS-33-R5 | `[DS-MOT-1] loops opacity-only, off under Reduce Motion, Reduce Transparency, Increase Contrast, Low Power Mode` (PROPOSED) | U | P1 | A | Lamp: each of four switches stops it; breathe.tsx and every loop: also Low Power | Skip Low Power check | design-systems | PARTIAL (lamp.test.ts:93, :99 cover Reduce Motion, Transparency, Contrast; Low Power only in lamp.tsx; breathe.tsx reads none) |
| D66 | Ruling 33 | `[DS-MOT-2] success haptic call sites are the MOTION list` (PROPOSED) | S | P1 | A | Scan `haptic(` call sites against a committed list; Keep once, E-S10, lock offer, Show again, cancel: none | Add a haptic to Cancel | mobile | GAP |
| D67 | NS-33-R8 | `[DS-TOK-4] dark mode and Increase Contrast sheet` (PROPOSED) | D | P1 | A | Step 6.2: dark, then light, with Increase Contrast, Reduce Transparency; glass screens use fallback; colour never sole signal (recording, errors) | Glass over picture with no dim | design-systems | DEVICE |
| D68 | NS-34 sec 3 iPad smoke | `[NS-34-R1] run sheet recorded` (iPad row) | D | P1 | A | Step 6.5: iPad phone E, iPhone app: capture, Keep, read; layout not clipped, 44 pt kept | none | qa | DEVICE |
| D69 | NS-34 sec 3 Low Power | `[DS-MOT-3] Low Power Mode` (PROPOSED) | D | P1 | A | Step 6.6: Low Power on SE 3, lamp and loops stop, Listen still records | Loop ignores Low Power | design-systems | DEVICE |
| D70 | Rulings 25, 34 | `[DS-VIS-1] before and after screenshots for v2 radii and Home glyph` (PROPOSED) | P | P1 | A | Token PR holds Asha screenshots: A-S01, B-S01, B-S08, E-S01 to E-S08, light and dark; `moon.stars` mapping row | PR without screenshots | design-systems | DOC |
| D71 | INDEX 6.1, 8 | `[DS-IDX-1] INDEX rebuilds clean` (PROPOSED) | P | P1 | A | `python3 -I docs/design/e2e/tools/build-index.py --check` passes; 0 motion keys in 0 rows; ASCII only | Rename a state in DESIGN only | design-systems | DOC |

## 7. Device sheet for these rows (shape of JOURNEYS-AND-DEVICE-SHEETS.md; Asha install; evidence `docs/qa/evidence/<date>-<build>-se3.md`)

| Step | Journey and rows | Phone, settings | Steps | Expected | Run by |
|---|---|---|---|---|---|
| 3.7 | D05, D09; NS-33-R4, R7 | A (SE 3); AX5 + Bold Text | Home, Listen Ready, Review, Book, letter page | No control under 44 pt, no text cut, Speak reachable without scrolling | founder |
| 3.8 | D07; NS-33-R5 | A; Reduce Motion | 30 s per screen, screen record | No moving loop | founder |
| 3.9 | D08; NS-33-R6 | A; VoiceOver | Start, stop, review, undo, Keep | No sighted help; announces <= 1 s | founder |
| 3.10 | D13, D14 | A; Voice Control then Switch Control | Say every label; scan | Every control responds | founder |
| 5.1 | D38 to D42 | A; VoiceOver then AX5 | First run E-S03 to E-S08, sign-in, agreements, leave | Order, focus, no truncation | founder |
| 5.2 | D44, D45, D48 | A; AX5 + Bold, VC, SC | Days, ask slip, suggestions | 44 pt, flat lists | founder |
| 6.1 | D57 | A; AX3 and AX5 | Each state of INDEX 2 (empty, loading, error, offline, partial, long text) | Nothing cut, primary pinned | founder + design-systems |
| 6.2 | D67; NS-33-R8 | A, C; dark, Increase Contrast, Reduce Transparency | Home, Review, Book, glass controls over a picture | Contrast holds, fallback shows | founder |
| 6.3 | D59; NS-37-R1 | A; seeded 1,000 letters, 300 pictures | Scroll Book 30 s | No frame > 16.7 ms | qa on Mac |
| 6.4 | D63 | A; VoiceOver rotor | Letter page | Level recorded `[stand-in]` | design-systems |
| 6.5 | D68 | E (iPad) | Capture, Keep, read | Smoke passes | founder |
| 6.6 | D69 | A; Low Power | Home, Listen | Loops stop | founder |

## Order of build
1. D15 (Smart Invert scan, red today) and D06, D12, D16, D24 source scans: pure source, no device, Drop A, close the P0 floor before G4. Each needs a positive control.
2. D10, D60 to D62 token tests with the tokens PR (rulings 25 to 30); contrast must fail first on a planted pair.
3. D03, D19, D26 to D28, D30, D32, D33, D36: mobile unit rows for Build 13 and 14, gate G0 (every P0 has a test).
4. Content rows D53 to D56 and D58 before Drop B words land.
5. Device sheet steps 3.7 to 3.10 and 6.x on the SE 3 before any store build (G4); D38 to D42 only when card 19 (Drop D) ships; D51 and D52 with Drop C.

## Risks
- Source scans pass on the wrong thing: a11y-ax5.test.ts scans a fixed route list; a new screen is silently outside it. Add the screen list from INDEX 2 as the scan input.
- `[stand-in]`: the heading level (D01, D31, D63), the audit (D20) and the iPad row are not proof until a device read; G4 must not count them green.
- Missing fixtures: no 1,000-letter Asha seed route on phone (sheet S0-1); no perf markers (D24); no XCUITest target.
- Tokens named in rulings (mediaFrame, glassFallback, spring 0.30 s) are not in code, so tests written first will be red; that is intended, but pair tests need the exact surfaces from DS2-01.
- Contrast tests use token pairs, not rendered pixels: a glass surface over a picture is not proved by them.
- Frame time and Low Power are device-only; a fake clock cannot prove 16.7 ms.

## Questions for the owner
1. `docs/design/e2e/RULINGS-20nov.md` row 37 and `INDEX.md` section 8 item 5: `docs/design/system/MOTION.md`, `COMPONENTS.md` and `tokens.v2.json` are named as the only timing source; none is in this tree. Which branch holds them?
2. `11-foundations.md` section 3 (NS-34 targets): "no UI-thread frame over 16.7 ms" has no row id; the sheet uses NS-37-R1 (P1). Which id owns the motion budget, and is P1 right for a promise on the card?
3. NS-33-R4 and R7 say "the four screens" (Home, Review, Book, letter page); R9 and R10 and sheet 3.7 say five (Listen added). Which set does R4 gate?
4. NS-21 (card 10) states no drop; sheet S-14 puts it in Build 14, plan 23 line 165 does not list it. NS-50 also has no drop tag in the part of card 21 I read. Please confirm drops for D31 to D37, D49, D50.
5. `INDEX.md` section 6.3 item 4 says the first-Keep haptic is unresolved; ruling 33 keeps one success (NS-44-R12). Is INDEX stale?
6. `INDEX.md` section 7 says NS-51 and NS-52 cards are not on disk; `27-photo-moments-and-media.md` exists. INDEX proposed ids (A-S16 to A-S18, E-S32, C-S27, D-S27) need re-keying; and the Photos permission journey is drawn in four places with no surviving id (INDEX 7 "Overlap to settle").
7. `NS-46-R26` and `NS-47-R25` (P0): the Drop B subset list in card 21 (line 619) names R1, R4, R6 to R9, R11, R15, R16 only. Do these accessibility rows gate Drop B or only the full unit?
8. Low Power Mode: card 11 line 366 says loops stop under it; `breathe.tsx` reads no Low Power state. Is breathe retired by ruling 31 (retire `Breathe` in waiting states) so D65 only covers the lamp?
9. Ruling 37 says prototype timings are not specs; E prototype lamp 9000 ms equals `tokens.ts` `lamp.breathMs: 9000`. Is the token the intended value or a coincidence?
