# NS-53 Moments tab: executive review, Design (CDesO)

Reviewer: Chief Design Officer (Claude role). Date: 21 Nov 2026.
Reviewed: `docs/product/prd/28-moments-tab.md` on `wip/moments-prd` (commit 5bebd892, 1187 lines, NS-53-R1 to R191), section 25.2 questions; the interactive prototype `docs/design/moments-tab/prototype/` on `wip/moments-d7`; against `DESIGN_LANGUAGE.md`, `DESIGN-LANGUAGE-V2-21nov.md`, `A11Y-AND-TYPE-AUDIT-20nov.md`, `MOTION.md`, `SOUND.md`, `packages/content/VOICE.md` and `packages/design-tokens/src/tokens.ts`.
Binding rulings of 21 Nov, accepted as given: library read ships in the first release; places and special occasions are in; faces and people are out; the machine never writes the parent's words.

## Verdict: ACCEPT-WITH-CHANGES

The spec is calm in intent and unusually honest about its limits: paper-first content, glass kept off cards, no counts or streaks, a "Not now" that is final and equal in weight to the yes, a no-permission path that is a working tab, and every motion given a Reduce Motion form. I would be glad to ship this tab. It will not feel beautiful and unfussy yet, because the spec asks one card to carry too many controls, three levels of dismissal, a first screen that buries its own ask, and a places promise the first release cannot keep at the level the prototype draws.

Conditions (all three BLOCKERs must close before the requirements are called done; the MAJORs before G4 and G5 run):

1. Close EX-DES-1, EX-DES-2 and EX-DES-3 in the PRD text and redraw the prototype for EX-DES-3, so the founder and the five parents judge what the build can actually show.
2. Set the Recent size and the AX1 and above card form as design decisions now (EX-DES-4, EX-DES-5), not as numbers the G1 performance spike will "find".
3. Cut the card to one tap target and a short verb list (EX-DES-6, EX-DES-7) before any L3 screenshot baseline is recorded, because every baseline recorded on the heavy card will be thrown away.

Counts: 3 BLOCKER, 10 MAJOR, 8 MINOR (21 findings).

## What was and was not verified

- Read in full: the PRD (all 1187 lines). Read: the prototype README and its source (`moments-prototype.html`, 93 KB) by grep and by section, including tokens, card builders, menu, pick sheet, glass counter and size scaling.
- NOT run: I did not open the prototype in a browser and saw no screenshot of it. Every statement about what it draws comes from its source. Nothing was seen on a phone, an iPhone SE 3 or in VoiceOver. Findings about AX5, VoiceOver and motion are judgments from specs and tokens, not device evidence, and the G5 pass is the real test.
- Standards named here (HIG, WCAG) are as quoted in the repo's own audits, not re-read this session. Apple's journaling suggestions behaviour is UNVERIFIED by me; the PRD's leads read it.
- Note for the PRD: section 28 says D7 was "not found". `wip/moments-d7` exists and holds the prototype. Section 28 and the section 27 VERIFIED list should be updated.

## Answers to the section 25.2 questions

1. Does 14 give a calm, paper-first feel, and are the final choices where leads disagreed right? Mostly yes. Right: C-18 (A1's 8 pt, 30 ms, under 400 ms tokens), C-19 (do not fix a placeholder grace before the SE 3 run), C-21 (thumbnails in memory only), O-25 (plain paper, no lamp scene), O-27 (no carried picture in v1), the platform cut for tab switches. Wrong or incomplete: C-11 leaves a card with several targets (EX-DES-6); the For you and Recent switch adds state and motion the job does not need (EX-DES-8); glass guidance is inconsistent (EX-DES-18). O-26 can stay closed on A1's tokens.
2. Do place lines and hide-a-place controls feel safe at AX5 on an iPhone SE 3? Not yet. The control is in a menu behind a "More" button, a painful place needs a faster door (EX-DES-10), and the AX1 and above card is undefined (EX-DES-5).
3. Is the minute-by-minute (11) a moment a tired parent would enjoy? The first thirty seconds are good: a real question card first, an ask that waits for a tap. The next sixty are not: three fictional examples sit between the parent and the ask, and the examples rule contradicts itself (EX-DES-2, EX-DES-9).

## Findings

Format: id, severity, requirement ids, finding, proposed change, evidence.

### BLOCKER

**EX-DES-1. BLOCKER. NS-53-R157, R41, R90, R44, section 14.1 and 15, MT-D4-R32.**
Finding: The spec forbids text, chips and buttons over a photo ("no text, chip or button over a photo", R157, 14.1, section 15) and also requires, in the same file, a video length "as text plus a glyph" on a tile (R41), a selection state of "ring, check, spoken state" on photo tiles in the day sheet (R90, 14.1 day sheet), and a selection ring on the 96 pt tiles. A test written from R157 fails the prototype and any build of R41 and R90. As written the spec cannot pass its own L3 check.
Proposed change: Replace the blanket ban with a named, closed exception list. Rule: nothing over a photo except (a) one duration mark on a video tile, and (b) the selection check on a day-sheet tile; each on a solid scrim of the pill token, 24 pt minimum, fixed size, never scaled with Dynamic Type, with the duration also given as text under the tile from AX1 and above. State that no word, place, date, reason line or action ever sits over a photo. Add the pill alpha as a token (the prototype's 0.68 is a PROPOSED value; A2 R12 asks 0.6 or more). Contrast check worked from the prototype value: white on the pill over a pure white photo blends to about 5.7:1, so the exception holds at its worst case.
Evidence: PRD lines 316 (R41), 488 (R90), 776 (R157), 705 (14.1), 767; prototype source `.vpill` (line 144, fixed 13 px, absolute over `.tile`) and `.gt .badge` (line 232, absolute over the photo). Contrast figure is my arithmetic, not a measured screen.

**EX-DES-2. BLOCKER. NS-53-R69, R147, 5.2 (K-EX), section 11, section 8.1 ACC-0.**
Finding: The examples have no consistent rule. K-EX is "shown only until a real card exists" and R69 says examples "disappear the day a real card exists". But K-PROMPT is a real card on every day, for every parent, by R10 and 6.3 ("Question, always"). Read literally the examples never show. Section 11 and 8.1 show them after the real cards, so the intended rule is something else (probably "until a library or marked day exists"). A build team cannot implement R69 as written, and the first-customer screen is undefined.
Proposed change: Define "real card" for this purpose as a library day, a marked or ticked day, a birthday or month day, or a year-ago card; the question card does not count. State that examples show only in ACC-0 and ACC-1 (and the flag-off state), never in ACC-2 to ACC-5. Add the Asha example fixtures to R107.
Evidence: PRD lines 198, 232, 448 (R69), 565 (section 11 row), 403.

**EX-DES-3. BLOCKER (for the prototype as the founder's reference and as the G4 stimulus). NS-53-R61, R63, R64, 7a.1, RV-18, E7, G4.**
Finding: The prototype draws venue-level place lines ("Maple Park", "Lakeside Market", "Nani's garden") on day cards. The first release resolves places from a bundled offline table that gives "a city, region and country; never a street, a venue or a hospital" (7a.1 P-A, R61). The prototype therefore shows a capability the first release does not have, and the card sort in G4 and E7 would test parents' reaction to something the build cannot produce. It also hides the real weakness of the ruling: with the default of showing a place only when the day is away from home (R63, O-34), most of a new parent's daily cards will carry no place at all, and a "Seattle" or "Lisbon" label is a weaker attention driver than the founder's words ("Don't exclude what drives attention") imply. "Nani's garden" is the parent's own place name; it can only appear as a parent-typed label (P-C), never as ours.
Proposed change: (a) Redraw the prototype's place lines at city level, with at least one card at home with no place line, one trip card ("Lisbon, 24 to 26 October") and one parent-typed place label shown as the parent's own words. (b) Add to section 7a.1 an honest sentence for the founder: first-release places are city names that show only when away; they will mostly appear on trips and visits; venue names need P-B and gate G8. (c) Do not run the G4 card sort on the current prototype.
Evidence: prototype README ("a place label (fictional: Maple Park, Lakeside Market, Nani's garden)") and source `DAYS` lines 508 to 511; PRD lines 347 to 352, 388, 390, 1003 (O-34).

### MAJOR

**EX-DES-4. MAJOR. NS-53-R40, R51, R186, 7.2, O-12.**
Finding: "Recent" is promised as bounded, one screen, newest first, no count, but its size has no value: 7.2 says "`RECENT_CAP`, `CANDIDATES`, `MAX_RUN` and `ROTATE_K` have none". The window is 90 days and a day qualifies at 5 pictures or 4 in 3 hours or any heart or video. For a parent of a baby, almost every day clears that bar, so Recent becomes roughly 60 to 90 cards: the camera roll by day, which is the opposite of "pick a day to tell {child} about" and of one screen. The G1 spike measures speed, not taste, so it will not set this number.
Proposed change: Decide the shape now. Recent shows the newest 14 qualifying days as cards under month headings; beyond that, one quiet "Earlier" row opens a month list (a plain list of months, no counts), each month showing the same cards. Treat 14 as ASSUMED and tune it in the card sort, but the structure (finite list, then a door) is a design decision, not a performance number. Raise BUSY_DAY for the card sort if more than half of ten consecutive days qualify.
Evidence: PRD lines 289 to 293, 316, 957 (R186), 712 (14.1 Recent); my reasoning on baby photo volume is a judgment, UNVERIFIED by data.

**EX-DES-5. MAJOR. NS-53-R153, R156, R189, 14.1, 15, MT-D4-R18.**
Finding: The AX1 and above form of the day card is not designed, and the prototype tests a smaller AX5 than the real one. The prototype's "AX5 style" is a 2.4x scale; `A11Y-AND-TYPE-AUDIT-20nov.md` measures AX5 body at 3.571x (18 pt becomes 64.3 pt, about 10 characters a line on an SE 3), and `DESIGN_LANGUAGE.md` line 170 gives AX5 Body as 53/62. A card that is a collage, a reason line, a date, a place line, a parent label, a letter row, a filled button and a More button is several screens tall at that size, and "up to four cards, question last" becomes four or more screens before the question card or the ask. R156 says "layout switches at AX1" without saying to what.
Proposed change: Specify the AX1 and above card: collage becomes one lead tile at full width (the prototype already sets a single column grid), reason line and date stay, place line wraps, the More button and the letter row move into the one card menu, and the card is a single target. Specify that For you at AX1 and above keeps the same order but the ask card (EX-DES-9) is never more than one card from the top. Re-run the prototype at a true 3.571x before the founder judges it. R189's AX5 screenshot per state then tests a defined layout.
Evidence: A11Y audit line 44; DESIGN_LANGUAGE line 170; prototype `#sizes` options "1, 1.4, 2.4" (line 1232) and `.grid` single column at 2.4 (line 226).

**EX-DES-6. MAJOR. NS-53-R13, R15, R158, 5.3, MT-D3, C-11.**
Finding: A card carries up to four tap targets: the whole card (opens the day), a filled "Write about this" button, a "More" button, and a "Read it" link on the letter row. The prototype draws exactly this, with a filled accent button on every day card, so four cards on a screen show four filled buttons. R15 and 5.3 say the whole card is the action and there is "one action" per card; both cannot be true while a filled button repeats the same action. A feed of identical filled buttons is the "fussy" look the founder will see first.
Proposed change: One card, one target. The whole card opens the day sheet; its VoiceOver name states the result ("Choose pictures from Saturday 14 November"); the card has a quiet text-weight verb at its foot only as a visual signifier, not a second target. Filled buttons appear only on the ask card, the primer and the day sheet's start control. Move "Read it" and the dismiss verbs into the one card menu. Custom actions (R158) carry the menu items for VoiceOver, Voice Control and Switch Control.
Evidence: prototype `dayCard` (lines 535 to 541: collage button, More button, `data-readletter`, `.cta` filled) and `.btn` (line 175); PRD lines 202 to 203, 213, 777. Opinion on the look; the one-target rule follows HIG's preference for one clear action per row (UNVERIFIED here, from the skill's cited standards).

**EX-DES-7. MAJOR. NS-53-R28, R29, R54, R55, R56, R57, 7.4, U23 to U25.**
Finding: The teaching verbs and dismissals are too many for one small menu and too similar for a tired parent: "Not today" (R28), "Not this one" (R29), "Hide this day" (listed in Me), "Keep this day close", "Name this day", "Leave out this picture", "Use this album", "Not this place", "Hide this place", each with Undo, a listing in Me and "Start again". Three levels of "go away" (until tomorrow, this day never, hide and list) read as one thing to a parent. The prototype already shows the honest size: its menu has two items.
Proposed change: Launch with four verbs. In the card menu: "Not this one" (this day never again, undoable), "Hide this place" (merges "Not this place" and "Hide this place" into one verb with one effect), and "Name this day". "Leave out this picture" lives only inside the day sheet on a tile. Cut "Not today" (tomorrow's card returns anyway, and the day seed already changes), cut "Hide this day" as a separate verb (same as Not this one), defer "Keep this day close" (no recurrence in v1, so it has no visible effect) and "Use this album" (O-14). Use the platform context menu for the menu if the SDK offers it through the existing component set, since "prefer the boring, native answer" (skill section 3); the prototype's hand-built popover is a prototype artifact. NEEDS EVIDENCE: whether the app's component set already exposes a native menu.
Evidence: PRD lines 273 to 274, 307, 330 to 334, 614 to 616; prototype menu (lines 877 to 887: two items, custom `.menu`).

**EX-DES-8. MAJOR (opinion). NS-53-R10, R26, R177, 5.1, 14.1.**
Finding: The For you and Recent switch costs a segmented control, a tablist for VoiceOver, a cross-fade, per-part scroll memory, a stacked layout at AX1 and its own requirement rows (R177, A1-R10), to separate two lists that a parent reads top to bottom anyway. At AX5 the prototype stacks the control vertically, which takes a quarter of the first screen.
Proposed change (opinion, with a fallback): Replace the switch with one scrolling page: the up to four For you cards, then a plain month-headed "Recent" section. Heading levels give VoiceOver its structure and the page needs no state to restore. If the founder prefers the switch, keep it as specified but never stack it at AX1; use a two-item menu button in the heading instead.
Evidence: PRD lines 181 to 184, 711 to 712, 724, 948; prototype `switchHTML` (line 633) and `.seg` stacked rule (line 154).

**EX-DES-9. MAJOR. NS-53-R71, R147, 8.1 ACC-0, section 11.**
Finding: In the first-open order (real cards, then three labelled Asha examples, then the ask card) the ask is the third block. At default text on an SE 3 that is about two screens down; from AX1 the ask is inline and far below (R71 pins it only up to XL). Three illustrated examples of a fictional family on a new parent's own tab also put a lot of non-parent content on the second tab of a product whose rule is that every word and picture is the parent's. They are inert, labelled and honest, but three is a lot.
Proposed change: Order the first open as: heading and job line; the real For you cards (the question, an age day, a typed day); the ask card; then one example only (it opens in place), shown only until a library or marked day exists (EX-DES-2). Test two against three in the E1 order swap. Keep Not now and the yes equal in weight and size, as specified.
Evidence: PRD lines 403, 565, 709, 753 (R147); prototype value view; check in E1 (line 886).

**EX-DES-10. MAJOR. NS-53-R61, R63, R65, U23, U24, 7a.2.**
Finding: Three weaknesses around the place line. (1) Wrong-city risk: nearest-entry arithmetic on a city table will name a larger city 10 or more km away from a suburb; the radius is ASSUMED, and a confident wrong place reads as the app guessing. (2) The only way to correct or hide a place is the card menu, which is two taps behind a "More" button; for a place the parent is hurt by (U24, a place of loss, a home left) the door must be immediate. (3) No quality bar for places exists in G4 beyond "does not feel like watching".
Proposed change: Make the place line itself a 44 pt target that opens a two-choice sheet ("Hide this place", "Name this day"). Add to G4 a place bar: in the five-parent sort on their own libraries, zero wrong-city labels; any wrong label turns place lines off for that build until the table or radius is fixed. Show no place when the day's pictures sit near a table boundary (two entries within a set distance) instead of choosing the nearer.
Evidence: PRD lines 357 to 361, 613 to 615, 909 (G4); radius ASSUMED at line 357.

**EX-DES-11. MAJOR. NS-53-R42, R44, R51, R60, 7.2, 7.3; Apple suggestions bar.**
Finding: Honest comparison with Apple's journaling suggestions: Apple's picker groups on-device signals this tab has chosen to forgo (people, scenes, workouts, music, venue-level places; UNVERIFIED by me, the PRD's leads read it). Our engine is date, count, heart, video and a city name. It will not match that bar and should not claim to. The danger is a Recent list that looks like Photos' own day view with fewer pictures, which gives a parent no reason to open it. The only quality bar in the spec (R60) is "a true reason for at least four of five cards", which says the cards are not wrong but not that they are worth opening.
Proposed change: Add a second bar to R60 and G4: of the cards shown to each parent from their own library, at least three of five are "a day I would write about". If not met, narrow the qualifying rule (raise the picture threshold, favour hearted and video days) rather than widening it. Say plainly in 7.2 that the first release is a date-and-city engine, so reviewers do not expect an Apple-grade suggestion. Keep the existing strengths: deterministic choice, no scoring from taps, a hearted or attached picture leading the collage.
Evidence: PRD lines 289 to 303, 336 (R60), 909.

**EX-DES-12. MAJOR. NS-53-R122, R53, R77, 8.2 step 5, 10.3.**
Finding: After the parent allows access, "the tab answers the ask by showing the days" with no spinner and no shimmer (A1-R12, 14.2 Loading), but the first scan time on an SE 3 is unknown (G1). If it takes more than about a second, the screen after the system alert shows nothing new, and the parent does not know whether anything happened. R122 forbids a failed-index message and a "nothing found" line, so the one state that needs a word has none.
Proposed change: Define one still state: if days are not ready within 1 s, the ask card is replaced in place by one plain static line from `content` (intent: pictures are being read on this phone, no spinner, no count, no "found") that VoiceOver speaks once and that disappears when the first day arrives. Words are `content`'s; the structure and the 1 s threshold (ASSUMED, tune at G1) are design's. Keep "arrive as one calm move" for the result.
Evidence: PRD lines 417, 582 (R122), 735, 537; prototype has the 590 ms move but no waiting state (README motion table).

**EX-DES-13. MAJOR. NS-53-R154, R63, R16, R153.**
Finding: Information parity for VoiceOver is broken by the new place decision. R154 says a collage or day is one element whose name uses "only the date, the parent's words and file kind, no count, place, person or scene". That was right when no place existed. Now a sighted parent reads "Lisbon" on the card, and a VoiceOver parent does not hear it. The reason line is also not in R154's list although 5.3 and section 15 read it first.
Proposed change: Amend R154 and section 15: the card's accessible name is reason line, date, place line when shown, the parent's own label, and the action in one phrase; the collage still has no machine description of pictures; "no place" in R154 is limited to the collage's own label, not the card. Add the place line to the VoiceOver walk in G5 and to the "Hide this place" custom action.
Evidence: PRD lines 202 to 203, 764, 773 (R154), 390 (R63).

### MINOR

**EX-DES-14. MINOR. NS-53-R3, R145, R180, 4.1, 14.1.**
Finding: Four tab labels at a fixed 13 pt (R3 "13 pt floor") rest on the flagged FE-1 defect (`tabBarAllowFontScaling: false`, hard-coded sizes). The PRD says the bar stays paper in 1.x; `DESIGN-LANGUAGE-V2` plans a system tab bar swap (M3) behind a device spike. The two should not be decided in separate files.
Proposed change: In R3, name the bar that gets the fourth tab (today's paper bar), require `tabLabel` as a token, require the Large Content Viewer on the fourth tab, and state that the M3 swap, if it happens, applies to all four tabs and re-runs the R3 checks.
Evidence: A11Y audit FE-1 (line 137) and "No chrome style" row (line 157); DESIGN-LANGUAGE-V2 lines 76 and 201; PRD line 169.

**EX-DES-15. MINOR. NS-53-R144, R145, 14.2, README motion table.**
Finding: The prototype and the PRD differ on three motion points. First view: the PRD settles at most the first three blocks (14.2) and once per install (R145); the prototype enters the first six cards on every cold launch. Switch and prompt cross-fade: both 150 ms (aligned). Motion budget: both within 900 ms and 420 ms.
Proposed change: Fix the PRD as the reference: first three blocks, once per install; correct the prototype and its README table. Six staggered cards at AX5 means one card is visible and five animate off screen.
Evidence: PRD lines 724, 751; prototype README rows "Cold launch, first six cards enter".

**EX-DES-16. MINOR. NS-53-R48, R108, O-19.**
Finding: R48 says a day that holds a kept letter shows "A letter is here" on its card; R108 says a used day is hidden in the same session after Keep and the parent lands on the Book. The prototype returns to Moments and shows the "A letter is here" row on the source card. These are three different behaviours for one moment, the most emotionally important one.
Proposed change: Pick one and write it once: after Keep the parent lands on the Book (O-19 default); the source day leaves For you for the session; on any later day its card, if it returns in Recent, shows "A letter is here" with the read action. Update the prototype's end state to match.
Evidence: PRD lines 324, 506 (R108), 988 (O-19); prototype `data-letterrow` (line 540) and motion row "Return mark on the card".

**EX-DES-17. MINOR. NS-53-R157, R189, 14.1, section 15.**
Finding: Glass guidance disagrees with itself: 14.1 and R157 say "at most three" glass surfaces; section 15 says "zero own glass recommended". The prototype uses three (close pill, pick footer, mic ring) and counts them. Phones on iOS 17 to 25 (floor 17.0, D-098) see only the solid fallback.
Proposed change: State once: no glass on Moments cards, bar or ask; at most the day sheet's close control and start footer over the photo grid; design and baseline the solid fallback first because most early phones render it, treat glass as the enhancement. Keep the three-surface ceiling as a lint, not a target.
Evidence: PRD lines 705, 768, 776; prototype `updateGlass` (line 1240) and `.glass` (line 214); DESIGN-LANGUAGE-V2 lines 10 to 11, 210.

**EX-DES-18. MINOR. NS-53-R13, section 14.1, README "PROPOSED values".**
Finding: Six values the Moments design relies on are not in `tokens.ts`: `glassFallback`, `highlight`, a `kicker` style (14 pt sans, title case, muted), the video pill alpha, `heroEnter` (12 pt, 420 ms) and `momentCarry` (320 ms). Two are not needed: `heroEnter` conflicts with C-18 (A1's 8 pt, 280 ms), and `momentCarry` is a motion for option B, which is off (O-27). The `kicker` duplicates `letterDateline` (14 pt, 18 line, sans) in size and weight except case.
Proposed change: Add `glassFallback`, `highlight` and the pill alpha to tokens through the normal route with the brand-parity test. Drop `heroEnter` and `momentCarry` from the prototype. Reuse an existing 14 pt style for the reason line unless a device check shows title case is needed.
Evidence: prototype README "What is placeholder"; `tokens.ts` styles (lines 227 to 253); PRD 14.2 and O-26, O-27.

**EX-DES-19. MINOR (opinion). NS-53-R16, R12, 5.3; VOICE.md "The app's own words".**
Finding: The prototype sets the app-computed date heading in the letter's serif (`title2`, Literata) and the parent's own label in sans body. That inverts "Quiet UI, loud letters": the app's computed fact is the loud serif line and the parent's words are the quiet one. `VOICE.md` says the app's own words never sit in the letter's type; a computed date is arguably a fact, not words, and the Book uses serif for month openers, so this is a judgment call.
Proposed change: Date heading in the sans heading style; parent's own label in the letter face so it reads as theirs. Decide once for the card family and record it in the component spec for R13.
Evidence: prototype `.t-title2` (line 52) and `dayCard` (line 538, 539); `DESIGN_LANGUAGE.md` principle 3 (line 11); `VOICE.md` line 41.

**EX-DES-20. MINOR. NS-53-R71, R72, 8.2, 8.5.**
Finding: Before the parent reaches the system alert there are three layers of explanation: the ask card's statement, the primer's sentence with four lines (Shown, Records, Never, Decline), and the system's own purpose string. At 9:40 at night, with one thumb, four lines of privacy text on a sheet is a lot. The lines are required by PRIV-R21, so the content stays; the weight does not have to.
Proposed change: Primer shows the one sentence and the equal Continue and Not now; the four lines sit behind one "What this does" disclosure on the same sheet, collapsed by default, expanded at the parent's tap, and always present in the accessibility tree. Counsel (G2) confirms that a disclosure satisfies the door-lines requirement before this ships.
Evidence: PRD lines 415, 435 to 442, 451; prototype primer (line 332).

**EX-DES-21. MINOR. NS-53-R61, R16, R12, 7a, D-115.**
Finding: The place table is specified in English only. A parent using the Hindi pack sees Devanagari dates and a Latin city name, and a parent-typed label in Devanagari needs the Tiro run size (1.08x, still "tune on device" in `DESIGN_LANGUAGE.md`). Nothing in 7a says whether place names localise.
Proposed change: Add one row: place names ship with the table in the languages the app is released in, or are suppressed in a language without them; a native-script reviewer checks the Devanagari card before the Hindi pack unlocks (skill: D-115).
Evidence: PRD 7a.1 (no language rule); `DESIGN_LANGUAGE.md` line 135; D-115 as cited by the skill (not re-read).

## Not findings (checked, holds)

- Not now and the yes equal in size and weight (R71); the prototype primer uses one `.eq` style for both buttons at 56 pt.
- No count, streak, badge or "you have not" anywhere in the prototype's words that I read; no machine title; the examples are labelled "An example".
- Cards are paper and never glass in the prototype; the tab bar has no badge or dot; contrast uses the real token pairs (muted text 5.11:1 on raised paper in light, 8.01:1 on the dark background, from `tokens.ts` comments).
- Reduce Motion is a documented alternative for every row of the prototype's motion table; every motion is at most 420 ms and ends within 900 ms.
- Haptics (14.3, O-24): the prototype's `selection` haptic on "Another thought" is not covered by `SOUND.md`, whose haptic table lists only recording, Keep and similar events. The haptics and sound owner reads it before sign-off, as O-24 already says.

## Device evidence needed (NEEDS EVIDENCE)

1. SE 3 at 3.571x with Bold Text: the day card as redesigned (EX-DES-5), the ask card position (EX-DES-9), the place sheet (EX-DES-10), the stacked or removed switch (EX-DES-8). Taken by the founder or a device operator; the prototype alone is not evidence.
2. VoiceOver walk of one day card and the place line (EX-DES-13), and of the day sheet with the selection mark.
3. First-scan time after Allow on the 20,000 item library (EX-DES-12), to set the 1 s threshold.

Signed: Chief Design Officer (Claude role). Recorded as a review round for section 25.13; no ruling is made here and nothing in `DECISIONS.md` changes.
