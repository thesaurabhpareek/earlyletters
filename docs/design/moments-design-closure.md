# Moments design closure: rulings and completeness audit

Status: RULED (design items). The additions in section 3 were folded into `docs/product/prd/28-moments-tab.md` section 22d by `product` on 21 Nov 2026 (ids NS-53-G01 to NS-53-G10, with the review notes N1 to N4 and the corrections listed in section 4); where this file and the PRD differ, the PRD wins
Date: 21 Nov 2026
Author: Chief Design Officer (Claude role), with Karma (CTO) in the same session
Scope: every design item left OPEN in PRD 28 sections 21 to 23, `docs/product/moments-tab/EXPERIENCE-AND-MOTION.md` (EXP) and the prototype notes, plus an audit of what a build needs.

## 0. Honest limits and how to read this

- I am a role a Claude session plays. I tested nothing on a phone. Every statement about Apple's picker or a frame budget is UNVERIFIED until a device row (DM-01 to DM-13, G5, G7) is run by the founder or a device operator.
- Founder words, 21 Nov 2026: "Decide all open with exec, and make sure all requirements are closed as well as all designs." Later the same day: "I agree with all your recommendations. Continue. Approved." The founder decided four items himself: DC-1 for the never-asked state only, DC-2, DC-3 (the value, and O-27 confirmed in chat on 21 Nov 2026 by "Yes lock those decisions", as relayed to `product` in the brief for the folding PR), and DC-5; they are marked FOUNDER-DECIDED. The rest are RULED (by CDesO, or by Karma and the CPO where DC-1 says so). Anything that changes what a user is promised stays founder-only under CR-73; none of the rulings below adds a promise, and DC-5 only raises privacy.
- Consulted in writing before ruling: the CPO and Privacy reviews in `docs/product/moments-tab/exec-review/` (cpo.md, privacy.md, ciso.md), read in this session. I did not get a live answer from either seat; where I overrule an earlier agent's text I say so.
- Ids `DC-n` are local to this file. Entering them in `docs/agents/exec/RULINGS.md` as `CDesO-<n>` is done at merge, after checking the log and open PRs for the next free number.
- Status words in section 2: SPECIFIED (cited), UNVERIFIED (specified, not seen on a device), GAP (no spec text; section 3 supplies it).
- Content rules hold for every string named here: no em or en dashes, curly quotes, ellipsis characters or emoji; `{child}` only; no streak, point, badge or gap count. All words are placeholders for `content`.

## 1. Rulings

### DC-1 Door in the never-asked state (O-56). FOUNDER-DECIDED for ACC-0; the Recent foot (ACC-2) is RULED by Karma and the CPO
- Options: (a) a quiet "Choose pictures" text row below the ask card, never beside it, never inside the primer (EXP 2.2, EXH-DES-15); (b) only after the parent has answered (R270, D2, EXH-CPO-1); (c) in the ask card as a third button.
- Ruling: (a), as the founder decided ("door below the ask card in the never-asked state"). ACC-1, ACC-3, ACC-4, ACC-5 and flag-off keep the door as the first row. ACC-2: the door is the last row of Recent. This part is RULED by Karma (CTO) and the CPO, not decided by the founder: his words covered only the never-asked state (R270 said not on ACC-2). Never a third button, never in the primer, never in a notification.
- Applied by `product` as row edits in PRD 28: R270 and D2 are amended to this text; R106, R120, R253 take EXP 12 as written. G4 task T4 still compares door shown against door hidden, as evidence, not as a gate.
- Risk vs return: risk that the door takes some yes answers and cannot be measured (EXP 4.12, no event; O-38 and O-49 stay No). Return: the tab works for a parent who is not ready to answer, and the first thing a parent who says no sees works.
- Way back: one constant in the tab's state table; a content-only change. Two-way.
- Challenger (CPO, EXH-CPO-1): "the door takes yes answers and we cannot measure it." Answered: the five-parent T4 and the diary measure it by asking; we do not add telemetry to answer a design doubt (O-38 stays No).
- Source: EXP 2.2, 7.4; PRD 14.1 and 23 (O-56); R270; ciso and cpo reviews.

### DC-2 Host sheet layout (O-53 and O-57). FOUNDER-DECIDED: Layout B
- Options: A (Apple's bars both hidden); B (top bar kept, bottom bar hidden); C (Apple's picker as its own sheet, no inline host, no tray for Apple's picks).
- Ruling: build Layout B. The founder approved B. Build rule, so engineering never reopens it: `PICKER_BARS` is one constant of three values (`both-hidden`, `bottom-hidden`, `none`), default `bottom-hidden`. A is allowed only when DM-02 shows Albums, Options, the privacy badge, the first-show panel and continuous selection reachable with both bars hidden; never hide Options. C is taken when any of these hold: DM-02 fails the B list; DM-11 (SE 3 memory) fails; DM-09 shows the cover cannot hide Apple's view in the switcher (a parent's picks must not be dropped by a background event, so there is no dismiss-and-drop fallback in B or A; G-01 is reconciled to this). C is the same route and frame with the inline host off. Review B note N1: `PICKER_BARS` selects the configuration of a new embedded-picker view; it is not a flag on `pickOne`, so Layout C is the only layout buildable today.
- Risk vs return: risk is that Apple's top bar carries an Add we cannot hide (then Start stays primary and Add is a second route to one `AttachRequest`, EXP 4.8). Return: Apple's own Cancel and Albums stay, less custom chrome to fail at AX5.
- Way back: change one constant; C is the shipped fallback today.
- Challenger (design-systems): "A is cleaner." Answered: clean is taste; B keeps Apple's controls where Apple tests them, and A needs a device matrix we do not have.
- Source: EXP 4.8, 9.2; PRD 23 (O-53, O-57).

### DC-3 Start hand-off flight and the token (O-27 and O-58). Value and O-27 FOUNDER-DECIDED, flight default RULED
- Options: (a) no flight, a 200 ms cross-fade; (b) tray tiles fly into capture's slots in 320 ms; (c) flight only for our own tiles, not Apple's picks.
- Ruling: the founder approved `motion.carry` { ms: 320 }. It lands in `packages/design-tokens/src/tokens.ts` with tests (a timeline test stepped ms by ms on three phone sizes, as `transitions.test.ts` does). Flight (b) is default OFF until DM-11 and DM-12 pass, then ON (the founder confirmed O-27 on 21 Nov 2026 by "Yes lock those decisions"); while it is off the hand-off is (a). It needs a root-level overlay (Review B note N4). Reduce Motion never flies. The 160 ms leave runs in parallel, so the sequence is 320 ms, under the 420 single-move and 900 total caps.
- Risk vs return: risk is dropped frames on an iPhone SE 3 (UNVERIFIED, DM-12). Return: the founder's "these came with you" feel, only where a parent just placed real tiles. Nothing else in Moments flies.
- Way back: `carryMs` read behind one boolean; false gives the cross-fade. Two-way.
- Challenger (CPO, R144 text): "an option that carries one thing is off by default." Answered: the default stays off, as the CPO asked, until the device rows pass; then it turns on, which is the founder's confirmed choice.
- Source: EXP 5.4, 6 (EM-07); PRD 23 (O-27, O-58), 14.5 R144.

### DC-4 Tab position (O-01; with O-06). RULED
- Options: (a) Home, Moments, Book, Me with Home as landing; (b) Moments as landing; (c) Moments centre of five tabs.
- Ruling: (a). One constant, `initialRouteName`, decides landing, so (b) is a one-line change if the five-parent default-tab check (R7, diary) says at least four of five would open Moments first. (c) stays rejected: no honest fifth destination. O-06 (one quiet Home line after the first kept letter, once, never back after a tap or dismissal): yes, as PRD 4.5 says, set in the existing footer slot of Home, text row, no badge.
- Risk vs return: risk that a parent who wished for Moments first sees it one tap away. Return: a new parent opens to Speak, the 2 a.m. job, and the tab bar never carries a badge.
- Way back: change the constant and R1's test. Two-way.
- Challenger (founder's first message, Moments as default): "it was my first wish." Answered: kept as the one test we run, and it costs one constant to honour.
- Source: PRD 4.1, 4.2, R1, R7; cpo.md O-01 line.

### DC-5 App-switcher cover for Moments with App lock off. FOUNDER-DECIDED
- Founder words: "app-switcher cover ON for the Moments tab when app lock is off". Recorded as his decision of 21 Nov 2026.
- Options: (a) follow App lock exactly (R232 as written, so no cover with the lock off); (b) cover the whole app always; (c) a scoped cover on the Moments tab and every Moments sheet whatever App lock says (R102 "with or without App lock").
- Ruling: (c). Read in code: `coverShown(s)` returns `s.enabled && (s.locked || s.phase !== 'active')`, so today there is no cover when the lock is off. R102 and R232 therefore disagree; R102 wins. Spec text is G-01 in section 3. Home, Book and Me are unchanged (no new promise).
- Risk vs return: risk is a brief cover flash on a notification pull-down (accepted: a cut, no fade). Return: a day name or thumbnail is never in the switcher snapshot of a borrowed unlocked phone.
- Way back: remove the scoped mount; the lock's own cover is untouched. Two-way.
- Challenger (CISO, ciso.md 114: "whether App lock is on by default is not stated"): answered: the cover does not depend on it.
- Source: PRD R102, R232, G7; `apps/mobile/src/lib/app-lock/machine.ts` (coverShown); `privacy-cover.tsx`.

### DC-6 The set-aside word on the card face (O-59), and the card target model. RULED
- Options: (a) "Not now" on the face, effect "until the next local day" (R28); (b) "Not this one" on the face (never again); (c) both on the face.
- Ruling: (a). The word and the effect agree, which is what "Not now" promises; "Not this one" (never in For you or Recent), "Hide this day" and "Hide this place" stay in the card menu, each with Undo. `content` owns the final word and may change it without a design change; if `content` picks (b), the effect changes with it and the Undo copy follows. Target model: the lead tile and Continue open the sheet; the text block is not a target; Continue and Not now stack at AX1 and above. This settles R211 ("single target") against R186, R212 and R156: R186 wins, R211's clause is struck.
- Risk vs return: risk is a parent who expects "Not now" to mean never. Return: one tap, honest, and the weight equal to Continue (EXH-DES-9). Undo never times out (EXP 5.7).
- Way back: a content key and one effect constant.
- Challenger (privacy.md, a picture on a card the parent did not want): "Not now only hides until tomorrow." Answered: the menu has "Not this one" one tap further, and T10 asks parents whether one is enough.
- Source: EXP 2.3; PRD R28, R186, R211, R212; privacy.md 189.

### DC-7 The smaller open design items. RULED
Each row has three or more options; way back for all is a one-line constant or content key (two-way); all are doc and test-build safe.

| Item | Options | Ruling | Risk vs return | Challenger and answer | Source |
|---|---|---|---|---|---|
| O-17 where "Choose which pictures" sits | head of Recent; foot of Recent; the Settings row only | Foot of Recent in ACC-3 only, a different kind of row from the door, labels differing by more than one word | Risk: found late. Return: never mistaken for the door | privacy.md: "two controls, distinct labels"; answered by T11 | EXP 2.2; EXH-PRV-6 |
| O-22 where a notification tap lands | all to Home; all to Moments; by kind | By kind: `typedDay`, `birthday`, `monthAge` to Moments, `evening` to Home; scroll 0, no card highlighted (G-09) | Risk: two landings. Return: each fact on one tab (R5) | CPO: one-owner rule; answered by R5 | PRD 13.4, R265 |
| O-24 haptics | none; as 14.3 (`selection` on Another thought, `tap` on tile and Undo, Keep `success`); more | As 14.3; `SOUND.md` is read by `design-systems` before sign-off, as the PRD asks. No sound anywhere in Moments | Risk: a haptic muted in Low Power Mode (nothing depends on one). Return: quiet, existing intents only | Sound owner: "SOUND.md unread"; answered: precondition, not a design change | PRD 14.3, EXP 5.9 |
| O-25 lamp scene or plain paper | lamp scene; plain paper; lamp on the ask card only | Plain paper (and the lamp stays off every Moments card; Increase Contrast shows none anyway) | Risk: plainer. Return: text on paper at 4.5:1 in every mode (D-110) | Brand: "lamp is the product's warmth"; answered: warmth is the paper and the type | PRD 14.1 |
| O-26 first-view settle | A1 (8 pt, 30 ms, under 400 ms); A3 (12 pt, 420 ms); none | A1's tokens: the existing `enter` and `staggerMs`; first three blocks, once per install | Risk: none. Return: no new token | Motion: A3 felt richer; answered: 420 ms hits the single-move cap | PRD 14.2, EM-17 |
| O-34 place line | every card; only away from home; never | Only when away (R63), a 44 pt target (R195); hidden by "Hide places" (R232) | Risk: a stay away from home is read as watching; G4 asks. Return: no home name | CLO/privacy: home place is a computed attribute; answered by R249 | PRD R63, R195 |
| O-43 For you and Recent | a two-part switch; one scrolling page with a Recent section; tabs inside the tab | Keep the switch, never stacked at AX1 (R211); it states its selection ("For you, selected") | Risk: a hidden second part. Return: For you stays a finished set, not a feed | Design review EX-DES-8 (opinion): one page; answered: R10 and R177 depend on the switch | EXP 6 (EM-15) |

### DC-8 Items decided elsewhere or out of my lane
- Analytics enum for `source: moment` and for how a letter was started (O-38, O-49): FOUNDER-DECIDED "no" ("analytics enum no"). Nothing in this file adds an event; EXP 4.12 stands.
- O-19 after Keep: Book (A4-R20, R216), CTO with privacy; I concur and the prototype stays labelled as different.
- O-62 one picture or six: scope, CPO. Design is neutral: the tray is a row of fixed 44 pt tiles and holds one to six unchanged.
- O-28, O-41 (name and store frames), O-48, O-55 (words and claims): founder, counsel and `content`. Design supplies only the frame check that hides the tab bar in store shots (R194).

## 2. Design completeness audit

Status: S = SPECIFIED, U = specified but UNVERIFIED on device, GAP = section 3 supplies text. Every U row needs a device or operator row; I have none.

### 2.1 Screens and states

| Item | Status | Where, or what is missing |
|---|---|---|
| Tab shell: heading, job line, paper bar, no badge | U | EXP 2.1; R1 to R4. Bar fit at AX5 and Large Content Viewer (R3, R215) never seen on a phone; A11Y audit FE-1 (tab label cap) |
| ACC-0 never asked, door below the ask card | S | EXP 2.2, 2.7, DC-1 |
| ACC-1 Not now, ACC-3 Limited, ACC-4 Denied, ACC-5 Restricted, flag off | S, U | EXP 2.2; R75, R287; R213 slow scan line. Device: G7 |
| ACC-2 For you (up to four cards) and Recent | S, U | EXP 2.2, 2.4; R210. Recent "Earlier" month list screen has no layout: GAP G-07 |
| Quiet, hidden, hard-stretch, expecting-only book; granted with no days | S | EXP 2.2 last rows; R253, R14 |
| Day card with a picture | S, U | EXP 2.3, 2.7; R186; AX1 stack R211 as amended by DC-6 |
| Card with no picture (age day, typed day, question, occasion with no pictures) | GAP | G-02 |
| Card VoiceOver structure, Voice Control names, target model | GAP | G-04 (PRD 14.1 says "not settled") |
| Ask card (variant C text, equal pair) | S | EXP 2.2, 7.3; R71 |
| Primer sheet: layout default and AX5 | GAP | PRD 8.1a gives words and steps only: G-05 |
| Undo control (placement, size, persistence) | GAP | EXP 5.7 gives behaviour, not place: G-03 |
| Never-asked, denied, limited rows and calm lines | S | EXP 2.2; R76, R287 |
| Me: Photos access row, Hide places, hidden list, Start again | GAP | R78, R65, R232 name the rows, not the screen: G-08 |
| Arrival by notification or `scribe://moments` | GAP | R265 says what lands, not the screen state: G-09 |
| Home pointer, once | S | PRD 4.5; DC-4 |
| Host sheet frame: heading, Not now, tray, Start, surround, hairline | S, U | EXP 4.2 to 4.6; DM-07, DM-08 |
| Day sheet our tiles (96 pt, ring plus check plus spoken state) | S, U | PRD 14.1; R276 |
| Enlarge of one picture (close, focus, AX) | GAP | R276 says "plain full-width enlarge"; no focus or close spec: G-10 |
| Apple picker hand-off: mount after settle, paper cover, hard cut on Start, Not now, inactive | U | EXP 4.7; DM-09, DM-10 |
| Layouts A, B, C and the rule | S, U | EXP 4.8; DC-2. B is built; DM-02 decides A or C |
| Apple's first-show panel and badge unobscured | U | EXP 7.3, 4.2; DM-08 |
| Over the limit, iCloud arrival, picker failure, revoke while open, offline, unreadable file, duplicate pick | S, U | EXP 8 rows 1 to 10; DM-03, DM-11 |
| Switcher snapshot and App lock for Moments and the sheet | GAP | R102 and R232 disagree; DC-5, G-01 |
| Door verb in tab, day sheet and capture Add | S | EXP 2.2, 3; R270 |
| Capture with chosen pictures (slots, strip) | S, U | PRD 14.2 "Photos during capture"; A4-R15 to R18 |

### 2.2 Motion, accessibility and budgets

| Item | Status | Where, or what is missing |
|---|---|---|
| Motion map EM-01 to EM-17, each with a Reduce Motion and VoiceOver form | S, U | EXP 6. Frame time on an SE 3 and a 120 Hz phone: DM-12 |
| EM-07 flight with `motion.carry` 320 | U | DC-3; token to land with tests |
| Reduce Motion as one table, one reader | S | R144, EXP 5 |
| Reduce Transparency, Increase Contrast, dark: tab and sheet | U | DM-13; D-110 contrast; `mediaFrame` outline |
| Dynamic Type AX1 and above: card stack, one-column tiles, one-row foot | S, U | EXP 4.9; R211, R276, R293 |
| AX5 with Bold Text on an SE 3: primer, ask card, Recent, Earlier list, Me rows | GAP (primer, Earlier, Me), U (rest) | G-05, G-07, G-08; DM-07, S1-23 |
| VoiceOver: heading first, focus after each change, switch state spoken | S, U | R153, R155, EXP 6 VO column; the walk S1-23 not run |
| Voice Control, Switch Control, Full Keyboard Access on cards | GAP (labels), S (R150) | G-04 |
| Task completion through Apple's picker at AX5 (VO, VC, Switch) | U | R293, DM-07; public claim withheld if it fails |
| SE 3 layout budget (first screen above the fold) | GAP | G-06 |
| SE 3 performance budget: no frame over 16.7 ms, memory with thumbnails | U | EXP 5.1, DM-11, DM-12; A1-R24 |
| Haptics and sound | S | PRD 14.3; DC-7 |
| No counts, gaps, streaks, badges, machine titles | S | R4, R52, G6 content test |
| Store screenshots hide the tab bar and the picker body | S | R194, EXP 10 |

## 3. Proposed additions for each GAP (concrete and testable)

Layers are the PRD's (L0 unit, L2 component, L3 baseline on an iPhone SE 3 and iPhone 16, L4 audit, L5 device). Numbers marked ASSUMED are tuned at the named device row.

### G-01 Scoped switcher cover (DC-5; amends R232, keeps R102)
- Given the Moments tab or any Moments sheet (`moments/pick`, the primer, the day sheet, the enlarge) is the focused route, and App lock is off, When the app state becomes `inactive` or `background`, Then `PrivacyCover` mounts on top at once in the same frame with no fade, reading only the app name for VoiceOver (`appLock.coverLabel`), before the OS takes its snapshot; no thumbnail, date, place, reason, typed word or Apple's picker view is visible beneath it.
- Given the app returns to `active`, Then the cover is removed in the next frame with no animation and focus returns to the element that had it.
- Given any other tab is focused and App lock is off, Then no cover mounts (no change to Home, Book, Me, and no new promise).
- Given App lock is on, Then the existing lock layer governs and the scoped cover never doubles it (one cover mounted, test by count).
- Given the picker sheet is open, Then the picks are held in memory, and the paper cover of EXP 4.7 item 5 is this same component, not a second one. If DM-09 shows the cover cannot hide Apple's view in the snapshot, DC-2 decides: Layout C is taken (Apple's picker is its own sheet, no inline host, no tray for Apple's picks), so no parent's picks are held in our frame; a pick is never dropped by a background event under B or A (the earlier text here, "dismiss and drop the picks", is withdrawn because it contradicted DC-2). Review B note N2: the cover needs its own focused-route signal and boot wiring beside `AppLockLayer`.
- Test: L0 `shouldCoverMoments(route, appState, lockEnabled)` truth table (3 routes by 3 states by 2 lock settings, 18 rows); L2 mount count is 1; L5 G7 row: switcher snapshot with lock off on the tab, the day sheet and the picker, with a still photo for the record only.

### G-02 A card with no picture
- Given a card of kind age day, typed day, question, public holiday, or an occasion with no pictures, Then it uses the day card anatomy without the lead tile: reason line (kicker), date heading, optional occasion or parent label, optional "A letter is here" row, then Continue and Not now at 48 pt ASSUMED (44 pt minimum, R156), equal in size, width and outline.
- Given Continue or the card's heading area is tapped on such a card, Then the expand origin is the card's own measured frame (an empty paper surface, nothing carried); if it is not measured, the door's rise (EXP 5.2); Reduce Motion is the 200 ms cross-fade of EXP 5.1.
- Given a question card, Then Continue opens capture directly, with no pick sheet, and "Another thought" swaps the words in place with a short cross-fade (A2-R23 to R26).
- No tile means no blank box: the card is shorter, never padded to the height of a picture card (L3 baseline: height of a no-picture card at default size is at most 60 percent of a picture card on the SE 3 ASSUMED, tuned at the card sort).
- Test: L0 card model kinds to anatomy table; L3 baselines per kind at default and AX5; L4 name per G-04.

### G-03 Undo control
- Given Not now or any card menu verb is tapped, Then one Undo row appears in the tab, pinned above the tab bar, full width less a 16 pt ASSUMED page margin, paper `surface` with a `line` hairline, no shadow, 44 pt minimum height, one line "Set aside" (content key) with a text button "Undo" at the trailing edge (leading at AX1 and above, stacked, still 44 pt minimum).
- It never times out and no tap elsewhere removes it (the earlier "3 further taps" clause is withdrawn: it contradicted "never times out" and EXP 5.7). It never covers a card action: the scroll content gets a bottom inset equal to the row height plus 8 pt ASSUMED while it shows. A second set-aside replaces the row, and Undo then returns only the latest card; earlier ones are in Me with "Start again" (R54).
- It leaves only on Undo, on a second set-aside (replaced), on a tab switch, or on leaving the tab; leaving never changes the effect.
- Pinned-bar check at AX5 (PRD 15: a pinned control stays under a quarter of the screen): on an iPhone SE 3 (667 pt high) at AX5 with Bold Text the pinned Undo row, stacked, is at most 25 percent of the screen height (166 pt); if it is taller, it is not pinned: it sits as the first row of the scroll content instead, with the same words and the same 44 pt targets.
- Undo returns the card to its slot with `enter` (8 pt, 280 ms, the existing tokens) and plays `tap`; Reduce Motion a 200 ms fade, no haptic dependence. VoiceOver: "Set aside" politely on arrival, "Back where it was" on Undo, focus to the restored card.
- Test: L2 inset applied; L3 at AX5 the row stacks, does not cover Continue, and the pinned height is at most 25 percent of the screen on the SE 3; L4 reachable by Switch Control; L5 S1-23 walk.

### G-04 Card accessibility structure and Voice Control (settles PRD 14.1 "not settled"; DC-6)
- Given a card, Then its accessibility elements, in order, are: (1) the information group, one non-actionable element named by R214 (reason, date, place when shown, the parent's own label); (2) Continue; (3) Not now; (4) the menu button. The lead tile is not a separate stop (it duplicates Continue) but still opens the sheet by touch. Four stops a card, at most 16 in For you.
- Given Voice Control, Then each control's accessible name begins with its visible label (WCAG 2.5.3 Label in Name): "Continue" with the date in a hint, never a name that omits the word on screen; the numbers overlay disambiguates repeated names.
- Custom actions on the information group: "Not this one", "Hide this place", "Name this day", each also a visible menu item. No gesture without a button (R150).
- Given the ask card, Then it is one container with two buttons of equal weight, each named by its visible label (the words are `content`'s; "Show days" and "Not now" are placeholders).
- Test: keyed on the visible label, never on a typed-in name: L2 reads the visible text of each control from its content key (the string the screen draws) and asserts the control's `accessibilityLabel` starts with it, for every card control and the ask card's two buttons, so a copy change by `content` cannot break the test and a name that drops the word on screen always does; L4 element order for 6 card kinds; L5 S1-23 with VoiceOver, Voice Control and Switch Control.

### G-05 Primer sheet layout
- Given the parent taps "Show days", Then the primer rises as a sheet over the tab: grabber hidden, content scrolls, title (our words), the one sentence (variant A), the policy link, one disclosure "What this means" holding Shown, Records, Never, Decline (R218), then Continue and Not now, equal in size and weight (R71), 56 pt tall ASSUMED, side by side at default and stacked Continue first from AX1.
- At AX5 on an SE 3 the sheet is a full-height scroll; Continue and Not now sit at the end of the scroll, not pinned, so no pinned bar covers more than 25 percent of the screen (PRD 15); every line wraps, none truncates; the disclosure opens in place.
- Not now and swipe-down are equal and final: the tab shows ACC-1 with the move of EM-16 (590 ms in all, ASSUMED until DM-12; Reduce Motion 200 ms cross-fade). Apple's alert is never shown by a gesture other than Continue.
- Test: L3 at default, AX3, AX5, light and dark; L4 VoiceOver reads title, sentence, disclosure state, then the buttons; L5 DM-07.

### G-06 SE 3 first-screen budget (iPhone SE 3, 375 by 667 pt, default text size)
- Given the tab in ACC-0, ACC-1, ACC-2 (For you), ACC-4 and ACC-5, Then the heading, the job line, and the first card's date heading plus both of its action buttons are fully visible without scrolling; in ACC-0 the ask card's two buttons are visible after at most one real card.
- At AX1 and above, only the heading and the first card's reason and date need to be visible, and the ask card is never more than one card from the top (R211).
- Performance: no frame over 16.7 ms (the 60 Hz budget; the 120 Hz budget is DM-12's) during EM-01, EM-12 and a fling of Recent on the SE 3 (DM-12); tray thumbnails 44 pt fixed with at most 6 decoded at once ASSUMED, tuned at DM-11; if DM-11 fails, the tray has no thumbnails and EM-07 does not fly.
- Test: L3 baselines per state with a frame assertion `maxY(Continue, Not now) <= tabBarTop`; L5 DM-11 and DM-12.

### G-07 The "Earlier" month list (R210)
- Given Recent shows its newest 14 days (ASSUMED), Then one quiet text row "Earlier" follows, 44 pt minimum, no number, no count; tapping pushes one plain screen of month rows, newest first, each a text row with the month and year only (no count of days); a month opens the same day cards under one heading.
- AX5: rows are single column, wrap, 56 pt minimum ASSUMED; the back control is the platform's. No pull to refresh, no spinner; a flat paper tile while a month reads (A1-R12). VoiceOver: the screen has one heading; each row reads "March 2026, button".
- Test: L2 rows without digits other than the year; L3 default and AX5; L4 names.

### G-08 Me: Moments settings
- Given Me, Then one group named for the feature (content key) holds, in this order: Photos access (on or off in words, never by colour alone, R78; Turn off removes the on-phone data at once), Hide places (a switch, off by default, R232), Hidden days and places (opens a list with Remove on each and one "Start again", behind App lock when it is on, R65), Reminders if shipped. Every row at least 56 pt ASSUMED, one line at default, wrapping at AX5, state spoken ("On", "Off").
- Turn off asks nothing and shows no count of what was removed; one calm line after. No red; Turn off is a text row, not destructive (it stores nothing).
- Test: L3 at AX5, L4 states spoken, L2 Turn off empties the moments file (R115).

### G-09 Arrival by notification or `scribe://moments`
- Given a tap on `typedDay`, `birthday` or `monthAge`, or the link, When the app opens, Then the Moments tab shows at scroll 0, For you selected, no card highlighted or scrolled to (nothing draws attention to one card), and VoiceOver focus lands on the heading. With App lock on, the lock comes first and the tab shows after unlock with the same state; `evening` lands on Home. With the flag off every route falls back to Home (R1).
- Test: L2 routing table by kind; L5 cold-start tap (G7).

### G-10 Enlarge of one picture (R276)
- Given a tile is tapped for enlarge, Then one picture shows at full width on paper, with a Close text control of at least 44 pt at the top, trailing at default and its own row at AX1; no swipe, pinch, pan or play in v1; a video shows its poster; the open uses the door's rise and Reduce Motion the 200 ms cross-fade. Nothing is drawn over the picture except the one allowed duration mark (R208).
- Closing returns VoiceOver focus to the tile; Escape gesture equals Close; Full Keyboard Access: Escape closes. Not while the sheet's picks are being changed: enlarging never selects.
- Test: L2 focus return, L3 default and AX5, L4 label (date and file kind only, no machine description, R154).

## 4. What remains

- GAPs: none left without text. G-01 to G-10 are folded into PRD 28 section 22d (NS-53-G01 to NS-53-G10) together with the PRD row edits of DC-1 (R106, R120, R253, R270, D2), DC-3 (R144) and DC-6 (R211). Corrections made at the fold: DC-1's ACC-2 door is RULED, not FOUNDER-DECIDED; DC-3's flight is default OFF until DM-11 and DM-12 pass, then ON; G-01 and DC-2 agree on a DM-09 failure (Layout C); G-03's Undo no longer leaves on taps; G-04's test is keyed on the visible label; unmarked numbers carry ASSUMED. This file edits no token or code.
- Not closed by design and not a design gap: every U row above needs a phone (DM-01 to DM-13, G5, G7, S1-23). Until run, no accessibility claim for starting from a picture is made (R293).
- Token: `motion.carry` { ms: 320 } is approved and lands with its tests in the Start hand-off PR (PRD 19.4 row 19c).
- Hand-offs: `product` (PRD edits, done in PRD 22d), `mobile` (G-01 scoped cover, PR 6b; constants `PICKER_BARS`, `initialRouteName`, `carryMs`), `content` (set-aside word, G-03, G-05, G-07, G-08 strings), `qa` (device rows).

Signed: Chief Design Officer (Claude role)
