# Area E. Foundations and system states: motion

Status: DRAFT v4, 20 Nov 2026 (v4 adds section 4y: moments for card 19, the days and Home-today cards, and the round 2 media states; first Keep haptic conflict X-2 in DESIGN section 17). Motion lead, area E. Keyed to the design system v2 motion file (`docs/design/system/MOTION.md`: primitives `m.*`, transitions `T-*`, haptics `H-*`; section 4z here) and re-keyed to `DESIGN.md` (design lead, area E) section 4 inventory: screens `E-S01` to `E-S26`, their per-screen state names, the waiting rule (DESIGN section 2 rule 5), the render classes R0 to R6 and the cross-area catalogue `E-ST01` onward (DESIGN section 6). Ids in this file (`MP-nn`, `E-Mnn`) are stable; no id is reused.

Play every move in `MOTION-PROTOTYPE.html` (this folder): each primitive and each area E moment, with toggles for Reduce Motion, dark, Reduce Transparency and a slow-motion switch for review.

**Design system v2 (Karma, 20 Nov).** The shared motion primitives are owned by `docs/design/system/MOTION.md` (design-systems motion lead; brief `docs/design/system/BRIEF.md`). Section 2 of this file is **input to that file, not a competing standard**; the system file has already keyed every `MP-nn` to its names (its section 4b, copied in 2b here). Areas A to D use the system names, never `MP-nn`. Where the system file differs from a row below, the system file wins: section 4z lists every `E-Mnn` with its system name and each v2 change, and the rows in section 4 describe the build as it is today plus area E's needs.

Sources, in order (BRIEF section 1): the locked cards (mainly `11-foundations.md` NS-33 and NS-34, `08-keeping-and-trust.md` NS-10, the frame `00` principle 6 and section 5, and every card's Reduce Motion row), `14-test-plan.md` J-N15, `16-council-review-round-2.md` T4; engineering input `/home/claude/review/eng/B-mobile-client.md` (section 7 risk 9); house design `docs/design/MOTION.md` v0.2, `SOUND.md`, `tokens.motion` in `packages/design-tokens/src/tokens.ts`, `apps/mobile/src/lib/motion.ts`, `lib/transitions.logic.ts`, `lib/haptics.shared.ts`, `components/motion/*`, and the built screens named per row; the design system v2 brief section 1 (Expo `expo-glass-effect` facts) and section 3 (material policy). History used where a card agrees: `docs/design/specs/FIRST-RUN-MOTION-SPEC-10nov.md` (superseded parts in section 8).

## 0. How to read this file

- `MP-nn` is a working name for a motion primitive (section 2). Areas A to D key to the system file's names; no area (this one included) types a new duration, spring or easing in a screen: it goes to the system file as a proposed token (section 7).
- `E-Mnn` is one transition or feedback moment in area E (section 4), keyed to `E-Snn.<state>` with DESIGN.md's state names. Where DESIGN.md routes a state to another area's screen (E-S09 to C-S10 and C-S11; E-S17 to A-S04), the row names that screen.
- Every number is a token from `tokens.motion` (named in backticks) or a proposed token (section 7). A raw number appears only where it quotes code that already types it (flagged as a gap).
- RM = Reduce Motion. LPM = Low Power Mode. VO = VoiceOver. RT = Reduce Transparency.

## 1. The laws (all areas)

From MOTION.md sections 2 and 5l and DESIGN.md section 2, restated as the rules every area signs up to:

1. **Calm and quick.** No single move longer than 300 ms (v2 `motion.capMs`). The named exceptions are the system file's section 5 list, and only those (v2 replaces this file's v1 list): among them the lamp arrival 1200 once per cold launch (the lamp is kept, ruling 31), `m.mark` 1600, `m.draw` 1200 in first run only, `m.keep` 600 to the Book. A sequence settles within `sequenceMaxMs` (v2: 600, was 900). In-room lamp changes of 1200 (E-M09, E-M10, E-M13) are not on the v2 list: see 4z.
2. **Controls never animate in.** Buttons, fields and links are opaque and hittable from the first frame of every screen, sheet and state. Only content (words, drawings, cards) enters. One exception, as built (`lock-offer.tsx`): controls that can only exist after an async answer arrive by MP-06 into a slot reserved from frame 1 (E-M08b, E-M21).
3. **Commit first, then the receipt.** No save, sign-in, purchase or retry waits on an animation.
4. **Interruptible.** A tap during any move lands on its end state. Springs start from where the value is.
5. **Quiet joy, no ceremony.** No confetti, counters, ticking numbers, streaks, badges, check-mark animations, pulses, shakes or flashes. Nothing celebrates sign-in, Plus or an update.
6. **Problems arrive like any other content.** An error, outage, offline, pause, plan lapse or low-storage state uses the same arrive and swap moves as everything else: no shake, no red flash, no slide from an edge, no bounce, no haptic, no sound. There is no global offline banner (DESIGN rule 1): a state shows in place, where the parent touched a server action.
7. **The waiting rule** (DESIGN rule 5, NS-34): 0 to 350 ms nothing changes; 350 ms to 10 s a breathing state (MP-17) with no count and no spinner; at 10 s the slow or held state with a way forward. A tap still answers at once (MP-01 within one frame, MP-18 busy words).
8. **Loops are opacity only, front screen only, and stop** under RM, LPM (gap G-EM1), in the background, when the screen is not focused, and when a sheet covers it (NS-33-R5, NS-34 section 3, J-N15). At most one loop on screen.
9. **Native first.** Tabs, pushes, system sheets, alerts, Apple's sign-in and Apple's subscription sheet are the platform's own, including the platform's reduced transition under RM.
10. **One RM mechanism.** Screens never read the setting; they use `useMotion()`, `useReducedMotion()`, `useSheetMotion()` and `useRouteTransitions()` (`lib/motion.ts`). Under RM every movement becomes one opacity fade of `fadeMs` (200 ms) run with `ReduceMotion.Never`; decoration does not run; nothing jumps on content that carries meaning.
11. **Two screens of words are never on top of each other mid-move** (`HAND_OFF` 0.35): the leaving words go first.
12. **Glass never fades to nothing.** A Liquid Glass surface never animates its opacity to 0 (Expo: it stops rendering); it animates `glassEffectStyle` between `regular` and `none`, and only its content and the scrim fade (section 2a).

## 2. Motion primitives: input to `docs/design/system/MOTION.md`

This table records what the built code does today (file and line) and what area E needs. It is input to the system file and is re-keyed to the system's names at the next pass (2b).

### 2a. Glass rules (design system v2 brief, sections 1 and 3)

- Glass layer surfaces area E draws or relies on: the tab bar (system native tabs), the Keep gate sheet (E-S10) and every `ui/sheet.tsx` sheet (E-S25), the undo toast, navigation and toolbar buttons (ModalHeader Close on E-S04 to E-S06). Content layer, never glass: every StateScreen and PlainScreen state (E-S01 recovery, E-S06 verifying and refused, E-S13, E-S14, E-S20, A-S04.full), first run's paper rooms (E-S02, E-S03, E-S08), Plus in Me and Plus confirmed (grouped lists and text), the SystemLine (E-S15), placeholders (MP-19), the held letter card on the sheet.
- Every "fade" of a glass surface in this file (MP-05 on the toast, MP-10 under RM, E-M30 to E-M36, E-M90) means: the glass animates `glassEffectStyle` `regular` to `none` (or back) with `animate` and `animationDuration` from the same token; the surface's content and the scrim change opacity. Under RT or before iOS 26 the surface is a solid token surface with a hairline border, and a plain opacity fade is fine.
- `isLiquidGlassAvailable()` ignores accessibility settings, so the RT read (`AccessibilityInfo.isReduceTransparencyEnabled()`) sits beside the RM read in `lib/motion.ts` (gap G-EM8).
- Glass morphs (a control growing into a sheet, controls merging in a `GlassContainer`) are the system file's; area E adds none.
- Native tabs (`expo-router/unstable-native-tabs`) would replace the JS tabs (E-M80): the swap, selection and minimise-on-scroll are then the system's; the lamp rule still applies to the content under the bar.

### 2b. Key to the system primitive names (from system MOTION.md section 4b)

| Working id | System name | v2 change that matters to area E |
|---|---|---|
| MP-01, MP-02 | `m.tap`; glass controls `m.tap.glass` | a glass control runs the system press, not our scale; RM dip token `tap.rmMs` 90 |
| MP-03 | `m.enter`; staggered `m.enter.group` | group only on cold launch or first show |
| MP-04, MP-05 | `m.exit` | new `easing.exit` (UNVERIFIED value) |
| MP-06 | `m.swap` | the box takes its new size at the end with `m.move` |
| MP-07 | `m.step` (T-STEP) | none |
| MP-08 | `m.cover` (T-COVER) | token renamed `cover.dissolveMs` |
| MP-09 | `m.push` (T-PUSH) | none |
| MP-10 | `m.sheet` (T-SHEET, native `formSheet`); `m.sheet.own` while `ui/sheet.tsx` remains | the Keep gate, sign-in and the plan note become native sheets |
| MP-11 | `m.sheet` (system modal) | none |
| MP-12 | `m.instant` | none |
| MP-13 | `m.move` | `spring.standard` 0.30 s (439, 38.5), was 0.40 s |
| MP-14 | `m.fade` | none |
| MP-15 | cover on `m.instant`; unlock `m.fade` (T-LOCK) | none |
| MP-16 | lamp, system section 10 | KEPT as the one named ambient exception (ruling 31: opacity only; off under RM, RT, IC and LPM); `Breathe` retired |
| MP-17 | RETIRED (`Breathe`) (ruling 31, 20 Nov) | waiting states become still; conflicts with DESIGN rule 5's "breathing state" (section 11) |
| MP-18 | `m.progress.wait` in a button, with `m.swap` for the busy words | RM off: system indicator plus busy words; RM: static busy words |
| MP-19 | placeholder: `m.fade` after `loading.placeholderAfterMs` | never a loop |
| MP-20 | `m.mark` | token `markMs` |
| MP-21 | `m.draw` | first run only, default static |
| MP-22 | `m.zoom`, `m.keep`, `m.pageTurn`, `m.signal`, `m.follow` | `m.keep` 600 ms to the Book |
| MP-23 | `m.toast` (glass) | tokens `toast.*` |
| MP-24 | not motion | none |
| MP-25 | finger follow inside `m.pageTurn`, `m.sheet`, `m.toast` | none |
| MP-26 | `m.instant` | none |

### 2c. The primitives

Easing for every timed move: `easing` = cubic-bezier(0.2, 0, 0, 1) (M3 standard, `STANDARD_EASING`). Springs: `snappy` (stiffness 520, damping 46, mass 1; ratio 1.0), `standard` (260, 30, 1; 0.92), `gentle` (90, 18, 1; 0.95).

| Id | Name | Use for | What moves | Duration or spring | RM substitute | Haptic | Built in | Never |
|---|---|---|---|---|---|---|---|---|
| MP-01 | Press, control | every Button, IconButton, chip, row that acts | scale 1 to `press.scale` 0.97 on press-in, back on release | `snappy` | opacity to `press.opacity` 0.9 over 90 ms, no scale (90 typed in code: G-EM3) | none by default; only an outcome passes `haptic` (MP-H) | `usePressScale('control')` (`components/motion/press.ts`), `Button` | delay the action until the press ends |
| MP-02 | Press, card | pressable cards (letter card, slip, held card) | scale to `press.cardScale` 0.98; held through card-to-page (MOTION 5f) | `snappy` | as MP-01 | none | `usePressScale('card')`, `PressHoldContext` | pop back before the page opens |
| MP-03 | Enter | content arriving: words, a line, a card, a toast | opacity 0 to 1, y `enter.dy` 8 to 0 | `enter.durationMs` 280; `staggerMs` 30 for the first `staggerMax` 6; item 7 on has no entrance | one fade `fadeMs` 200, no travel, no stagger | none | `useMotion().enter(i)` | controls; re-entering on a return or a tab switch; a typewriter effect on any words |
| MP-04 | Leave | a step's words going up and on | opacity 1 to 0, y 0 to -8 | `exitMs` 160 | fade `exitMs` | none | `useMotion().leave()` | controls leaving |
| MP-05 | Exit | transient UI going away: toast, inline line, a block | opacity to 0, y down a little | `exitMs` 160 | fade `fadeMs` 200 | none | `useMotion().exit()` | a cut (reads as broken) |
| MP-06 | Swap in place | words replaced where they stand: a line updating, a busy label, a toast over a toast, a state's title and body | old words fade out while new fade in, same box | `swapMs` 150 | same (already a fade) | none | `FadeIn/FadeOut.duration(swapMs)` in `toast.tsx`, `lock-offer.tsx`, `onboarding.tsx` | shake, colour flash, width animation |
| MP-07 | Step hand-off | one step to the next inside one room (first run, consent steps) | MP-04, then MP-03; the lamp stays in the room | 160 + 280 = 440 ms | fade out `fadeMs`, then fade in `fadeMs`, no stagger (`stepMotion(true)`) | none (Continue and Back are navigation) | `stepMotion()` (`transitions.logic.ts:160`), `app/onboarding.tsx:257-263` | slide the whole screen; two steps' words visible together |
| MP-08 | Dissolve | full-screen rooms with no change of shape (Listen, Review, Read together) | platform cross-dissolve | `route.dissolveMs` 280 | `fadeMs` 200 | none | `routeTransitions`, move `dissolve` | |
| MP-09 | Push and back | Me pages, the sign-in stack inside its modal | platform push, swipe back | platform | platform's reduced transition | none | move `push` | custom push curves |
| MP-10 | Our sheet | `ui/sheet.tsx`, the Keep sheet | the sheet rises from below over a scrim; the room keeps its lamp and pauses its breath | `standard` up; out over `exitMs` | no travel: glass effect style and content fade `fadeMs`, scrim fades | none on open or close | `useSheetMotion()`, `Sheet`, `plus-gate.tsx:187-190` | sheet content adding a stagger (one held card excepted, E-M30) |
| MP-11 | System modal | `(auth)`, `invite`, `plus/confirmed`, Apple sign-in, Apple's subscription sheet, share sheet, photo picker | the platform's rise | platform | platform | none | move `sheet` (empty options) | restyle or re-time a system sheet |
| MP-12 | Cut | the first-run route (`onboarding`), redirects that must never slide | nothing | 0 | same | none | move `cut` | |
| MP-13 | Reflow | a line inserted into or taken out of a column; siblings move | siblings' layout on a spring; the line itself uses MP-03 or MP-05 | `standard` (`layoutSpring`) | instant reflow; the line still fades `fadeMs` | none | `useMotion().layout()` | animating text size, font size or a text block's height |
| MP-14 | Block arrive | a whole-screen state (render classes R4 and the StateScreen half of DESIGN's catalogue) | the block fades in once; focus to its heading; title announced | `fadeMs` 200 (always runs; it is its own RM form) | same | none | `StateScreen` ARRIVE (`state-screen.tsx:67`) | lamp, draw-on or breath on a problem state |
| MP-15 | Cover | privacy cover, app lock | on: drawn at once; off (unlock): fades | on 0; off `fadeMs` | same | none | `PrivacyCover`, `app-lock-layer.tsx:56` | a fade in (the app switcher snapshot would catch the book) |
| MP-16 | Lamp | lit rooms only (gate, welcome, form, finish, Home, Book, write) | one radial pool, opacity only | arrive `lamp.arriveMs` 1200 (first lit room after a cold launch; an in-room change of scene or level); return `lamp.returnMs` 280; leave `lamp.leaveMs` 160; breath `lamp.breathMs` 9000 to `breathOpacityMin` 0.88 | at its level at once, still | none | `Lamp`, `LampView`, `useUnlitRoom()`, `persistKey` `firstRun` and `tabs` | any screen that records, plays a voice, sells (E-S10, E-S11, E-S12) or reports a problem (MP-14 states, SystemLine) |
| MP-17 | Breathe | the one mark or drawing in a waiting state (350 ms to 10 s) or an empty state | opacity 1 to 0.85 and back | `emptyBreathMs` 8000 per cycle, sine | still at full opacity | none | `Breathe` (`components/motion/breathe.tsx`) | wrapping text or a control; a problem state; two loops at once |
| MP-18 | Busy in a control | a button whose action runs (Try again, Sign in, See Plus, Restore, Keep in this account) | the label swaps to its busy words (MP-06), for example "Trying again", "Opening the App Store"; the other buttons on the screen disable at once | `swapMs` 150 | same | none | target; today `Button loading` draws `ActivityIndicator` (`components/ui/button.tsx:162`), which spins under RM too (G-EM2, breaks NS-33-R5) | a spinner (DESIGN rule 5: no spinner); a full-screen blocker; busy with no end (the 10 s rule) |
| MP-19 | Placeholder (proposed) | a region with data still coming after 350 ms (plan status in E-S11, a list after a cold start) | nothing until `loading.placeholderAfterMs` 350 (proposed); then static placeholder shapes fade in `fadeMs`; the real content replaces them by MP-06 | as stated | same | none | not built (no skeleton in `apps/mobile/src`; G-EM7) | shimmer, sweep, pulse or any loop on placeholders; placeholders where an empty state applies |
| MP-20 | Wash | a newly arrived letter in the Book; a restored span in Review | `accentSoft` background fades out | `newMarkMs` 1600 | shown, then fades | none (the save gave `success`) | Book arrival, Review put-back | anything that is not a person's letter (Plus, sign-in, update, a waiting card) |
| MP-21 | Draw once | single-weight line drawings shown once per reader | `strokeDashoffset` | `drawMs` 1200, then text MP-03 | drawn complete; text fades | none | `DrawOnPath`, `DrawOnStrokes` | repeating; a problem state |
| MP-22 | Signature moves (reference) | save into the month, card to page, page turn, listening glow, read-together highlight | MOTION.md 5b, 5c, 5e, 5f, 5g, 5m | `file`, `cardToPage`, `pageTurn`, `breath`, `highlight` | as MOTION.md | MOTION.md 6 | `fileIntoMonthPlan`, `CardToPage`, `PageTurn` | a second implementation |
| MP-23 | Timed lines and undo windows | toasts, undo lines | a toast without an action leaves after 4000 ms (typed default, G-EM4) by MP-05, never while a screen reader runs; with an action it stays until used, closed, swiped or the screen changes; undo windows follow T4 through one helper (BL-954) | T4: the stated seconds, or until VO has read the line plus those seconds, whichever is later; Switch Control: until the parent moves on | same | `tap` on Undo | `Toast` (`toast.tsx:56-77`), helper BL-954 | a dead Undo on screen; any visible countdown |
| MP-24 | Announce and focus | every change the eye would catch | not motion: VO hears it | a new screen or block: focus to its heading, title announced; a new line: one polite announcement; a repeated "still working" line at most once a minute (NS-33 Slow row; proposed `a11y.repeatGapMs` 60000) | same | none | `announce()`, `useFocusOnMount()` | announcing over a playing voice; moving focus for a toast |
| MP-25 | Follow the finger | swipe to dismiss a toast; page turn | follows the finger; past the threshold it goes, else settles | settle `snappy`; pages `SWIPE` (0.25 width, 600 pt/s); toast 40 pt or 600 pt/s (typed, G-EM4) | no follow; a swipe past the threshold runs the fade form | none | `swipeOutcome()`, toast pan | a gesture with no button |
| MP-26 | Scheme change | light, dark, Increase Contrast, Bold Text, text size | nothing animates; the next frame is in the new scheme; the lamp redraws at its level, no arrival | 0 | same | `tap` on the Appearance choice | `useTheme()` | a whole-screen cross-fade; animated font size |

### 2d. Render classes (DESIGN section 6) to motion

| Class | What | Motion |
|---|---|---|
| R0 | silent | none |
| R1 | surface absent | leaves on the next render of its screen, never mid-gesture; if it must go while in view: MP-05 then MP-13 (DESIGN J-E14) |
| R2 | SystemLine in place | E-M40 to E-M43 |
| R3 | toast | MP-03 in, MP-05 out, MP-06 over another, MP-23 timing |
| R4 | StateScreen or InlineState | MP-14 for a screen; MP-06 for an inline state replacing content in its box |
| R5 | sheet | MP-10 (ours) or MP-11 (system) |
| R6 | PlainScreen | none at all (no providers, by design) |

### MP-H. Haptics (today's build; v2 is system MOTION.md section 9, `H-*`)

v2 trims `success` to a kept letter, an export finished and joining a book, and lists every other call site for removal (ENG-M10). In area E that removes the book-opening `success` (E-M09), Plus on (E-M33) and app lock on (E-M75), and the `tap` on Restore (E-M38, not a choice). The table below is today's build; 4z gives the v2 haptic per row.

A haptic marks an outcome the person caused, never a navigation and never a system state. Five intents:

| Intent | iOS | Android | Where (as built) | Area E use |
|---|---|---|---|---|
| `tap` | `selectionAsync` | `Segment_Tick` | a choice picked (age answers, consent answers, Appearance, chips), Undo, Put it back, Reading Size, provider buttons | E-S03, E-S04, E-S07, E-S11, E-S12, E-S21 |
| `press` | `impactAsync(Light)` | `Context_Click` | record start and stop, Speak and Type | none |
| `soft` | `impactAsync(Soft)` | `Long_Press` | long press, "Not much today" | none |
| `success` | `notificationAsync(Success)` | `Confirm` | a letter kept; also, as built: the book opens (`onboarding.tsx:234`), Plus on in the Keep sheet (`plus-gate.tsx:114`), app lock turned on (`lock-offer.tsx:54`) | E-M09, E-M33, E-M75 (card gap K-EM3) |
| `warning` | `notificationAsync(Warning)` | `Reject` | a destructive act confirmed | none in E |

Never in area E: a haptic on an error, outage, offline, pause, lapse, update, low storage, second account, claim, sign-in success, restore, Continue, Back, Close, Got it, a tab change, a sheet opening, a toast showing. `success` and `warning` are never throttled; the others are throttled to one per 100 ms. A haptic always goes with a visible change (iOS mutes the Taptic Engine in LPM).

### MP-S. Sound

Paper sounds are off by default (SOUND.md 2). Area E plays none. `gentle_error` (with a `notificationAsync(Error)` haptic) is for failures the person can fix now, such as a photo that did not attach (area A); no area E state uses it, because each is a system condition, not the person's act (law 6).

## 3. What never animates (area E)

- No shake, wobble or red flash: wrong code, failed sign-in, failed restore, failed purchase, outage, error.
- No pulse, glow or breath on a call to action: See Plus, Update, Try again, Begin the book, Keep in this account.
- No ticking numbers: the email resend wait says "in a minute" and re-renders once when it passes (built, `code.tsx:94`); no trial-days counter; no letters-left counter; no storage gauge running down; dates on Plan are text.
- No confetti, check-mark draw, stamp or glow on sign-in, the book opening, Plus starting, a restore, a claim or an update.
- No spinner as a screen, and no spinner in a waiting state (DESIGN rule 5); no shimmer; no indeterminate bar. A progress bar appears only for real measured progress (area C export) and moves linearly with it.
- No lamp and no breath on E-S10, E-S11, E-S12, any MP-14 state or a SystemLine.
- No banner from an edge for offline, outage, pause, update or storage; a SystemLine appears in place under the control it is about.
- No auto-dismiss of an error line or a SystemLine while its condition holds.
- No motion that suggests the app writes: no typewriter, no word-by-word reveal of anything presented as a parent's words, including the promise sample in first run (E-S08.promise: the sample and its small fix are still; the fix mark fades in once with `fadeMs` at most).
- Nothing of account A's book is ever drawn for account B, not even for one frame of a transition (E-M57).

## 4. Area E moments, keyed to DESIGN.md states

Each row: trigger; what moves; timing (tokens); RM; haptic; notes and never. "As built" means the code does it today and this file confirms it.

### E-S01 Launch and boot

| Id | State | Trigger | What moves | Timing | RM | Haptic | Notes and never |
|---|---|---|---|---|---|---|---|
| E-M01 | `E-S01.default` | splash hides (`_layout.tsx:179`) | cut from splash to the gate's room; the mark sits where the splash drew it (the 96 pt splash mark, as PrivacyCover), so nothing jumps; lamp `gate` (still) arrives over `lamp.arriveMs` | 0; 1200 | lamp at level | none | expo-splash-screen fade option in SDK 57 UNVERIFIED; keep the cut (G-EM9) |
| E-M02 | `E-S01.migrating` | boot passes 350 ms (local migrations after an update, J-E15) | the mark breathes (MP-17); no words, no count | from 350 ms; 8000 loop | mark still | none | ends by the next screen's own arrival; at 10 s (DESIGN rule 5) the recovery path decides, not motion |
| E-M03 | `E-S01.default` to Home | cold launch with a book | MOTION 5a: Home renders complete; dateline, greeting, prompt MP-03 with stagger (under 400 ms); a waiting card is the next stagger item; capture cluster static; Home lamp arrives 1200 | as stated | one fade; lamp at level | none | warm resume moves nothing (E-M71) |
| E-M04 | `E-S01.recovery` | the local database could not open | PlainScreen (R6): no motion at all | 0 | same | none | as built |
| E-M05 | `E-S01.recovery-trying`, `.recovery-stillClosed` | Try again | MP-18: label "Trying again" for `RETRY_BEAT_MS` 500 (code constant, G-EM5), then the app opens (E-M03) or the `stillClosed` line swaps in (MP-06), announced every time | 150; 500 | same | none | no shake on a second miss |
| E-M06 | `E-S01.recovery-exporting`, `-exportNothing`, `-exportFailed` | Export what's readable | MP-18 on Export; the result line MP-06 in the shared slot (newest answer wins) | 150 | same | none | the share sheet is the system's (MP-11) |

### E-S02 Welcome, E-S03 Age gate and stop, E-S08 First book steps (first run as built)

One lit room, `persistKey="firstRun"`, route move `cut`. The story intro (BL-893, NX-40, cited by card 07 C44) is not built and DESIGN.md draws none; `flags.introVariant` changes words only (E-ST15).

| Id | State | Trigger | What moves | Timing | RM | Haptic | Notes and never |
|---|---|---|---|---|---|---|---|
| E-M07 | `E-S03.default` | first run opens | the mark fades `fadeMs` (QuotePair); the question MP-03 at index 2 (60 ms); answers, agreement row, links and Continue static; lamp `gate` centred, still | 200; 280 | fades | none | as built (`age-gate-screen.tsx:25`) |
| E-M08 | `E-S03.reason-noAnswer`, `.reason-noTick` | Continue with an answer or the box missing | the reason line MP-06 into its slot (`SWAP_IN` at `fadeMs`), announced; focus to the box (noTick) | 200 | same | none | never red, never a shake, Continue never disabled |
| E-M09a | `E-S03.stop`, `.stop-after24h` | No, then Continue | question and answers MP-04; the stop line fades into the same room; same mark, same light; "I answered by mistake" after 24 hours is static | 160; 200 | fades | `tap` on the answer only | |
| E-M10 | `E-S03` to `E-S02.default` | Yes, box ticked, Continue | gate words MP-04; the lamp cross-fades from the centred `gate` pool (0.6) to the top `welcome` pool (1.0) over `lamp.arriveMs`, then breathes; welcome words arrive (E-M11) | 160; 1200 | lamp at welcome level; words fade | none | the paper is never unlit in between |
| E-M11 | `E-S02.default`, `.serversOff`, `.alpha` | welcome shows | lockup fades `fadeMs` (`welcome-lockup.tsx`); promise line and `membership.line` MP-03 at 120 and 150 ms; buttons static from frame 1 (typed offsets 120 to 200 ms, G-EM6) | 200; 280 | one fade each, no offsets | none | no price, no trial, nothing pulses on Begin the book |
| E-M08b | `E-S02.restoring` to `.default` | the 10 s restore wait (`RESTORE_WAIT_MS`) ends or the restore answers | the room shows with no buttons; then the buttons arrive by MP-06 into their reserved slot (law 2 exception) | 150 | same | none | the welcome words do not re-enter |
| E-M12 | `E-S02.error-provider`, `.sessionExpired` | sign-in returns an error to the welcome | one inline line above the buttons MP-03, announced; the buttons do not move (slot reserved) | 280 | fade | none | |
| E-M13 | `E-S08.name` to `.date` to `.signsAs` to `.promise` to `.open` (and `.twins`, `.languages`) | Continue | MP-07 per step; on the first form step the lamp dims from welcome 1.0 to `form` 0.5 over `lamp.arriveMs`; the typed name reaches the cover after a pause with no per-letter motion (as built) | 440; 1200 | fades; lamp at level | none (Continue and Back silent) | never two steps' words together |
| E-M14 | `E-S08.name-waiting` | Continue with no name | the `nameRequired` line MP-03 above Continue, announced; focus to the field | 280 | fade | none | no shake |
| E-M09 | `E-S08.open` | "The book is open." reached | the lamp rises from `form` 0.5 to `finish` 1.0 over `lamp.arriveMs` and breathes; the cover holds `cover.holdMs` 300, then cross-fades to the flyleaf with `cover.dx` 8 on `standard` | 1200; 300 + spring | lamp at level; cover cross-fade `fadeMs`, no shift | `success` once (as built) | the only success in first run |
| E-M15 | `E-S08.open` to Home | Continue | the tabs join the stack in the same render (no tab bar flash, `tabsInStack`); Home's lamp starts at first run's last light and settles to its daypart over `lamp.returnMs`; Home content MP-03 once (its first show) | 280; 280 | at level; one fade | none | |

### E-S04 to E-S07 Sign in, E-S24 Claim

The `(auth)` group is a system modal (MP-11). Its screens have no entrance of their own (as built, `sign-in/index.tsx:17`).

| Id | State | Trigger | What moves | Timing | RM | Haptic | Notes and never |
|---|---|---|---|---|---|---|---|
| E-M16 | `E-S04.default` | sign-in opened (Welcome, Me) | platform modal rise; content static | platform | platform | none | no lamp, no illustration |
| E-M17 | `E-S04.busy` | Apple or email tapped | MP-18 on the tapped way; the other disables at once; Apple's own button cannot hold busy words, so the busy line under the ways swaps in (MP-06, as built `index.tsx:134`) | 150 | same | `tap` (as built) | Apple's sheet is the system's |
| E-M18 | `E-S04.error-provider`, `.error-not_available`, `.error-network` | the provider returns an error | busy ends at once; the line in the inline error slot MP-03, announced; focus stays | 280 | fade | none | `.error-cancelled`: nothing moves, nothing shows |
| E-M19 | `E-S04` to `E-S05` to `E-S06` | Continue with email; Send | native push inside the modal (MP-09) | platform | platform | none | |
| E-M20 | `E-S05.sending`, `.error-invalid_email`, `.error-email_wait`, `.offline` | Send | MP-18 on Send ("Sending"); an error line under the field MP-06; the field border changes to `caution` at once with the WarningCircle and words (never colour alone) | 150 | same | none | no shake |
| E-M21b | `E-S06.default` resend available | the minute passes | "Send a new email" enables in place (no animation); the recovery set MP-03, announced once (as built `announceResend`) | 280 | fade | none | no countdown |
| E-M22 | `E-S06.error-wrong_code`, `.error-code_paused`, `.error-rate_limited`, `.error-expired` | a code is refused | the line under the field MP-06; the digits stay | 150 | same | none | no shake, no red flash |
| E-M23 | `E-S06.checking` to `.verifying` | six digits entered | `checking`: MP-18 on Continue; `verifying` after 350 ms: StateScreen loading "Signing you in" (MP-14 with MP-17 on its drawing) | 150; 200 | drawing still | none | no spinner |
| E-M24 | `E-S06.refused-other_phone`, `-other_phone_spent`, `-already_signed_in` | verify refused | MP-06 from the loading block to the warm error block (same StateScreen, so the box stays) | 150 | same | none | |
| E-M25 | `E-S07.loading` to `E-S07.default` | consent read | `loading` (built name `settingUp`) is a StateScreen loading (MP-14, MP-17 after 350 ms); `default` (built name `terms`) replaces it by opacity only, `fadeMs` out then in (as built `consent.tsx:67-68`) | 200 + 200 | same | `tap` on an answer; Continue and Not now silent | |
| E-M26 | `E-S07.declined`, `.error-consent_unavailable` | Not now; the read fails | MP-06 to the declined or error block | 150 | same | none | declined is never styled as a failure |
| E-M27 | `E-S24.default`, `.noEmail`, `.hasBook` | a session meets this phone's rows | pushed in the sign-in stack (MP-09); static | platform | platform | none | never lists a letter |
| E-M28 | `E-S24.waiting` | Keep in this account | MP-18 ("Keeping"); then the modal dismisses (platform) onto Home, which does not re-enter | 150 | same | none | no success haptic: a claim is housekeeping |
| E-M29 | `E-S07` or `E-S24` to the book | consent recorded, claim done | the modal dismisses (platform); under it E-M15 (new book) or Home or the Book as the router says (E-S09) | platform | platform | none | no celebration |

### E-S09 First-run router (alias): C-S10 Opening your book, C-S11 held screen

E-S09 is a decision table; its visible states are area C's screens. Area C's MOTION.md should cite these rows rather than restate them.

| Id | State | Trigger | What moves | Timing | RM | Haptic | Notes and never |
|---|---|---|---|---|---|---|---|
| E-M20o | `C-S10.opening` | a session with a book elsewhere | StateScreen loading (MP-14); after 350 ms the moon breathes (MP-17); no button, no count, no spinner (as built `new-phone-screens.tsx`) | 200; 8000 loop | moon still (card 08: "indicator is static") | none | no progress bar: nothing measures it |
| E-M21 | `C-S10.slow`, C-S11 held screen | 10 s pass (NS-10-R0, DESIGN rule 5) | the two actions ("Finish setup", "Try another way") arrive by MP-06 into a slot reserved from frame 1 (no reflow of the words above); title swaps to the slow words (MP-06); announced once; the moon stops | 150 | same | none | the law 2 exception; never pulse |
| E-M22o | `C-S10.offline`, `.noBook` | the read fails or finds no book | MP-06 to the warm block in the same StateScreen; the moon stops | 150 | same | none | |
| E-M23o | `C-S10.arrived` | the book arrives | the block MP-05; the Book appears under it already rendered (the router lands on the Book); the Book's lamp returns over `lamp.returnMs`; the Book's cover settle (MOTION 5a, area B) plays once as its first view this session | 160; 280 | fade; lamp at level | none | E-S02.serversOff: never shown (NS-10-R8) |

### E-S10 Keep gate sheet, E-S11 Plan in Me, E-S12 Plus confirmed, E-S25 Plan reminder note, E-S26 Home Plus line

| Id | State | Trigger | What moves | Timing | RM | Haptic | Notes and never |
|---|---|---|---|---|---|---|---|
| E-M30 | `E-S10.default`, `.lapsed`, `.fromLetter`, `.needsNewerIos`, `.unavailable` | Keep in Review when the allowance is used (`keepSheetFor`) | the Keep sheet (glass) rises over Review (MP-10, `SlideInDown` springified on `standard`); the scrim fades in; the held letter card (content layer) MP-03 at index 0 with its static -2 deg tilt (0 deg at accessibility sizes, `heldCardTilt`); title, body, note and footer static from frame 1. The state is chosen when the sheet opens | `standard`; 280 | no travel: glass effect style none to regular over `fadeMs`, content, card and scrim fade `fadeMs`; RT: the solid sheet fades | none (opening is navigation) | no lamp, no price or trial motion, no pulsing See Plus, no count |
| E-M31 | `E-S10.opening` | See Plus | MP-18: See Plus reads "Opening the App Store"; then Apple's subscription sheet (MP-11) over the Keep sheet | 150; platform | same | none | |
| E-M32 | `E-S10.offline`, `.fromLetter-offline` | opened offline; or See Plus tapped and the connection is gone | opened offline: drawn in that state (See Plus absent, hold primary), no motion of its own. Connection lost while open: Apple's sheet is not opened; the offline words replace the held note by MP-06 (as built `sheetTap`); the footer does not rearrange under the finger | 150 | same | none | never red |
| E-M33 | `E-S10` Plus on | the purchase returns active | `success` (as built); Apple's sheet closes; `/plus/confirmed` rises (MP-11); on Done the Keep sheet is gone and Review is as it was; the parent taps Keep and MOTION 5e runs | platform; then 5e | 5e's RM | `success` once | no confetti; the letter is not kept for them |
| E-M34 | `E-S10` Keep it here for now | tap | the sheet exits (MP-10 out: `SlideOutDown` over `exitMs`; RM: effect style and content fade); Review closes (MP-08); Home shows the waiting card already in place; the held note toast MP-03 | 160; 280; 280 | fades | none | the waiting card neither enters nor washes |
| E-M35 | `E-S10` dismissed (VO escape, Android back, scrim) | gesture | the sheet exits; Review unchanged | 160 | 200 | none | |
| E-M36 | `E-S10` hold (Plus not known yet, RT-PLS-10) | Keep while the plan is unknown | no sheet; Review closes (MP-08); the held note toast | 280 | fade | none | no spinner while the plan is read |
| E-M37 | `E-S11.free`, `.on`, `.trial`, `.renews`, `.ends`, `.ended`, `.grace`, `.retry`, `.shared`, `.alpha` | Me, Plan opened (MP-09) | grouped list static; if the status is not ready by 350 ms, MP-19 on the status row only | 350 then 200, 150 | same | none | no lamp; dates never count down |
| E-M38 | `E-S11.restoring`, `.restored`, `.restoreNone`, `.restoreFailed` | Restore purchases | MP-18 ("Restoring"); the inline result MP-06 | 150 | same | `tap` (as built `settings/plus.tsx:95`) | no success haptic on restore |
| E-M39 | `E-S11.notificationsOff` | iOS notifications off | the SystemLine (info) under the status row is drawn with the screen; no arrive (E-M40 applies only if it appears while the screen is open) | 0 | same | none | |
| E-M38c | `E-S12.default`, `.withAsk` | purchase confirmed | native modal (MP-11); content static (a record of terms) | platform | platform | `tap` on Save a copy and the reminder ask (as built) | no stagger, no wash, no second success |
| E-M90 | `E-S25.trial`, `.renews`, `.yearly` | next open inside its window, on a calm tab root | our Sheet (MP-10, glass); Got it and Manage subscription static | `standard` | glass effect style and content fade | none | never mid-task; never over a sheet; Got it is silent |
| E-M91 | `E-S26.on`, `.off` | Home shows after the allowance is used | the line is part of Home's first frame; on a cold launch it is in Home's stagger after the prompt; returning from Review it is simply there | as E-M03 | same | none | no enter on a return, no wash, no count, never a slip |

### E-S13 Something broke, E-S14 Sign-in outage and offline, E-S20 Not found

| Id | State | Trigger | What moves | Timing | RM | Haptic | Notes and never |
|---|---|---|---|---|---|---|---|
| E-M50 | `E-S13.boundary`, `.global` | an unhandled throw | PlainScreen (R6) cut in; no motion (by design) | 0 | same | none | |
| E-M51 | `E-S13` Try again, Go to Home | tap | the app mounts afresh: cold-launch rules (E-M03); the lamp arrives as a first lit room | as E-M03 | as E-M03 | none | |
| E-M52 | `E-S14.offline`, `.offline-withLocal`, `.outage`, `.outage-withLocal` | first-run sign-in cannot reach the service, or the 10 s read times out | the welcome's lamp leaves over `lamp.leaveMs` (a problem state is an unlit room); the StateScreen block MP-14; focus to the heading, title announced | 160; 200 | lamp off at once; fade | none | no breath, no draw-on; the envelope drawing is still |
| E-M53 | `E-S14.offline` to `.outage` (or back) | the read changes | MP-06 on title and body; the glyph swaps in the same box; announced again | 150 | same | none | |
| E-M54 | `E-S14` Try again, `.backOnline` | tap; or the connection returns | MP-18 ("Trying again"); on success `backOnline` is an announcement only, then the block MP-05, the lamp returns over `lamp.returnMs` (same `firstRun` key, no second arrival), the welcome words MP-03 | 150; 160; 280 | fades | none | |
| E-M55 | `E-S14` Start on this phone | tap | MP-05 on the block; E-S08.name arrives by MP-07; the lamp returns to `form` 0.5 over `lamp.returnMs` | 160; 280 | fades | none | |
| E-M56 | `E-S20.default` | a link that leads nowhere | StateScreen MP-14; the window drawing is still | 200 | same | none | the address is never shown |

### E-S15 SystemLine, E-S16 App update line, E-S17 Low-storage rules, catalogue E-ST01 to E-ST22

A SystemLine sits under the control it is about (DESIGN E-S15), never at a screen edge; there is no global offline banner.

| Id | State | Trigger | What moves | Timing | RM | Haptic | Notes and never |
|---|---|---|---|---|---|---|---|
| E-M40 | `E-S15.info`, `.waiting`, `.paused`, `.offline`, `.action` arriving | a server action the parent touched answers with a state, or the state starts while its screen is open | if the screen opens in the state: drawn with the screen, no arrive. If it starts while open: content below reflows (MP-13) and the line fades in `fadeMs`; one polite announcement. A connection drop while open shows the offline line only after it holds `systemLine.showAfterMs` (proposed 2000) | `standard`; 200 | instant reflow; fade | none | no slide, no icon spin, no colour pulse; never red |
| E-M41 | a different state replaces the line | priority or state change | MP-06 on the glyph and words; the box stays | 150 | same | none | never two lines stacked for one control |
| E-M42 | the state ends | connection back for `systemLine.hideAfterMs` (proposed 1000), pause lifted, action succeeded | MP-05, then reflow MP-13; no "back online" toast | 160; `standard` | fade; instant | none | |
| E-M43 | E-ST05 to E-ST13c remote pauses (R1) | signed config arrives | the paused surface leaves on the next render of its screen (DESIGN J-E14); if a sheet is already open it keeps its content and shows its paused line on its next server call; if it must leave while in view: MP-05 then MP-13, never under a finger | 160 | fade; instant | none | a pause never removes recording, typing, saving, reading, playback, export or deletion |
| E-M44 | `E-S16.line`, `.absent` | `minSupportedVersion` above this build | the line (action) is drawn at the top of Me with the screen; if config arrives while Me is open: E-M40 without the 2 s wait | 0 or 200 | same | none | never on Home, the Book or a sheet; never blocks; no pulse on Update; the App Store page is the system's |
| E-M45 | `E-S17.under1gb` (on A-S04) | Listen Ready with under 1 GB | the info line is part of Ready's first frame; Speak static | 0 | same | none | recording is not blocked |
| E-M46 | `E-S17.under50mb` (A-S04.full) | Speak with under 50 MB | Listen's Ready swaps to the StateScreen glyph state (MP-06 within Listen, same room; no sheet); Type instead and Try again static | 150 | same | Speak's own `press` already played; nothing more | never `warning`, never red |
| E-M47 | `E-S17.under20mbMidTake` | free space falls under 20 MB while recording | area A owns the stop (record stop tick after the recorder closes, MOTION 6); Review's reason line MP-03 | area A | area A | area A | |
| E-M48 | `E-S17.exportShort` (C-S04, C-S05) | an export estimate over the free space | area C owns; inline MP-06 into the export screen's state box | 150 | same | none | |
| E-M49 | E-ST02 sync waiting, E-ST05 sync paused (Me, Account, Sync row) | the 10 s gate read fails; the sync pause | the row's value swaps (MP-06) | 150 | same | none | nothing on Home or the Book |

### E-S18 Second account on one phone, E-S19 Interruption and recovery

| Id | State | Trigger | What moves | Timing | RM | Haptic | Notes and never |
|---|---|---|---|---|---|---|---|
| E-M57 | `E-S18.signedInB-noBook`, `.signedInB-arriving`, `.backToA` | account B signs in on a phone holding A's rows; or A returns | the lists filter while the sign-in modal still covers them; when the modal dismisses, the room under it already shows only the current account's rows; no row animates out, no list reflows in view | platform | platform | none | not one frame of A's letters is drawn for B (X4-R1); `signedInB-arriving` follows C-S10's rows |
| E-M58 | `E-S18.signedOutA` | sign out (D1) | the sign-out sheet (area C) closes; Me's rows swap to the signed-out title and D1 body (MP-06); the book stays as it was | 150 | same | none | no warning haptic: nothing was deleted |
| E-M70 | `E-S19.call`, `.background` | the app goes inactive | with app lock on, `PrivacyCover` drawn at once (MP-15); every loop pauses (lamp breath, MP-17); nothing else moves | 0 | same | none | no fade in of the cover |
| E-M71 | warm resume | the app is active again | nothing re-enters (MOTION 5a, 5l rule 2); loops resume; VO focus returns to the same element (NS-33 Interrupted row) | 0 | same | none | no Home stagger on a warm resume |
| E-M72 | `E-S19.killedMidTake`, `.killedOnConsent`, `.killedMidPurchase` | relaunch after a kill | cold launch (E-M03): the waiting card is Home's next stagger item; VO lands on Home's heading; a purchase finished by StoreKit shows only on E-S11 (E-M37) | as E-M03 | as E-M03 | none | the waiting card has no wash; `killedOnConsent` lands where the router says (E-S09), with that screen's own arrival |

### E-S21 Appearance, E-S22 App lock cover

| Id | State | Trigger | What moves | Timing | RM | Haptic | Notes and never |
|---|---|---|---|---|---|---|---|
| E-M73 | `E-S22.locked` to unlocked | Face ID passes | the cover fades out over `fadeMs` onto a room already rendered (as built `app-lock-layer.tsx:56`) | 200 | same | none | no check mark |
| E-M74 | `E-S22.failed` | Face ID cancelled or failed | the lock stays; its line MP-06; focus to Unlock | 150 | same | none | no shake, no red; never interrupts a recording |
| E-M75 | lock offer after first run | `lock-offer.tsx` | the card cross-fades in and out at `swapMs` (as built) | 150 | same | `success` when turned on (as built) | declining moves exactly as accepting |
| E-M76 | `E-S21.system`, `.light`, `.dark`, `.noLetter` | a choice tapped | MP-26: the next frame is in the scheme; the preview line redraws with the app | 0 | same | `tap` | no whole-screen cross-fade |

### Tabs (all areas; area E holds the rule)

| Id | Trigger | What moves | Timing | RM | Haptic | Never |
|---|---|---|---|---|---|---|
| E-M80 | tap Home, Book or Me | the native swap with no animation (JS tabs today, `app/(tabs)/_layout.tsx:28`; with native tabs the bar's glass, selection and minimise-on-scroll are the system's); the arriving tab's lamp starts at the light the last tab left and settles over `lamp.returnMs` (`persistKey="tabs"`); Me has no lamp, so the light leaves over `lamp.leaveMs` | 0; 280 | lamp at level | none | content re-entering, a badge, an icon bounce, a sliding indicator |
| E-M81 | tap the selected tab | the platform's scroll to top | platform | platform (UNVERIFIED for JS tabs; check on a phone) | none | |
| E-M82 | first Book view this session | MOTION 5a: the cover settles, opacity 0.6 to 1, y 6 to 0, `gentle` (area B owns) | `gentle` | one fade | none | |

### 4y. Moments added or changed in v2 (20 Nov, re-keyed to card 19 and the final pack)

Keyed to DESIGN.md sections 5, 13 and 15a. Every row names the system transition (`T-*`) and primitive (`m.*`) from `docs/design/system/MOTION.md`, the Reduce Motion behaviour and the haptic. Nothing implies a streak or a count; no moment lasts over 300 ms except the system's named exceptions; every control is hittable from frame 1 (law 2). E-M14 now applies to the twins case only (`E-S08.name-waiting`); the optional name has no reason line and no motion.
| Id | State | Trigger | Transition and primitives | RM | Haptic | Never |
|---|---|---|---|---|---|---|
| E-M100 | `E-S03.platformMinor` | the platform answers under 18 | T-STEP: `m.exit` of the question, `m.fade` of the stop line, same room, same light as E-M09a | `m.fade` only | none | no distinct styling from the stop; nothing about the answer is spoken beyond the stop line |
| E-M101 | `E-S04.refused-region` | the sign-up hook refuses | `m.swap` from the loading block to the warm block in the same StateScreen | same | none | no shake, no red, no Try again |
| E-M102 | `E-S08.name` optional marker; `E-S08.dateWaiting` reasons | step shown; Continue with no date | the "Optional" word is drawn with the label (static); a reason line enters by `m.swap` into its reserved slot, announced once | same | none | no animation of the marker; Continue never disabled |
| E-M103 | `E-S08.open` speech card: ask, downloading, waitingWifi, verifying, stopped, pausedRemote, needsSpace, done | a tap on Download on Wi-Fi; the state changes | `m.swap` between states in one card; `m.progress` only when bytes are measured, otherwise `m.progress.wait`; words never a percentage | same; bar still | none | no count, no "0%", no celebration on done |
| E-M104 | `E-S07.reconsent`, `.sensitive`, `.offline` | a new major Terms version; the second step | T-SHEET (`m.sheet`) over a calm tab root; the step change inside is T-STEP `m.fade`; Agree: `m.progress.wait` in the button | `m.fade` | H-select on an answer only | never mid-gesture; never over a recording |
| E-M105 | `E-S14.signInPaused` | `killSwitches.signIn` and a door tapped | as E-M52: lamp leaves over `lamp.leaveMs`, StateScreen by `m.fade` | lamp at level | none | no text about a switch |
| E-M106 | `E-S16.line` two wordings | config or server answer | `m.swap` on the words in the same box (T-SYSLINE if it appears while Me is open) | same | none | no pulse on Update |
| E-M107 | `E-S18.signedInB-ownerMismatch`, `.signedInB-localOnly`; `E-S24.accountDeleted`, `.methodOnly` | B signs in; the claim path | filtering happens under the modal as E-M57; the localOnly line T-SYSLINE `m.enter`; claim screens T-PUSH, static | `m.fade`; instant | none | no row animates out in view |
| E-M108 | `E-S30`, `E-S31` | tap the link; tap Lines in other countries | T-PUSH; the list is static | platform | none | no motion in the list |
| E-M109 | `E-S03.default` answer pills and tick | tap an answer or the box | `m.select`: the check glyph and weight arrive with the choice | instant | H-select (as today's `tap`) | colour alone never signals the choice |
| E-M110 | E-ST47 server restored | sessions gone after a restore | as E-M58 and E-M49 | same | none | nothing on Home |
| E-M111 | E-ST49 `libraryDays` pause; E-ST54 quiet book; E-ST55 suggestions absent | signed config; focus | `m.fade` 200 on the next render, never mid-gesture (E-M43); the day slip leaves with `m.list.remove` only if it was in view at a day change, no animation otherwise | jump | none | no hole, no badge |
| E-M112 | E-ST50, E-ST51, E-ST57, E-ST60, E-ST67 lines | the condition holds | T-SYSLINE: `m.enter` after `systemLine.showAfterMs` (offline only), `m.move` of content below; leaves by `m.exit` then `m.move` | `m.fade`; instant | none | never red, never a toast |
| E-M113 | E-ST52 quiet day | Home renders on a quiet day | none: the quiet line is part of Home's first frame in place of the prompt block; arrives with Home's `m.enter.group` on a cold launch only | one fade | none | no ceremony, no candle, no tone beyond the words |
Round 2 (media; proposed ids, keyed to `26-founder-direction-photos-library-and-media.md`; re-key to NS-51 and NS-52 row ids when `27-photo-moments-and-media.md` lands):
| Id | State | Trigger | Transition and primitives | RM | Haptic | Never |
|---|---|---|---|---|---|---|
| E-M120 | `E-S32` Photos access primer | a parent-started door | T-SHEET (sheet) or T-PUSH; content static; Continue then iOS's prompt (system) | platform | none | nothing animates in; no picture shown |
| E-M121 | E-ST69 limited, E-ST70 denied | the state is read | drawn with the surface; if it changes while open, `m.swap` on the line | same | none | no nag, no pulse |
| E-M122 | E-ST71 changed in Settings; E-ST78 index off | return to the app; the switch | `m.fade` on the surface at the next focus; the index removal has no animation | jump | none | no "removed" toast with a count |
| E-M123 | E-ST72 iCloud original | a chosen item is not on the phone | `m.progress.wait` on the row (indicator in place, words "Getting it from iCloud"); `m.swap` to the attached thumbnail; the thumbnail arrives by `m.fade` | still indicator | none | no percentage text, no spinner loop beyond the system indicator |
| E-M124 | E-ST73 no space, E-ST74 large video | a refused choice | `m.swap` into the line in place; focus stays | same | none (no `warning`) | no shake, no red, no counter |
Thumbnail cells and the video badge have no motion of their own.

### 4z. Every area E moment keyed to the design system v2

System names from `docs/design/system/MOTION.md` (sections 4 to 9). "v2 change" is what the system file changes from the row in section 4; the system file wins.

| E-M | System transition and primitives | v2 haptic | v2 change |
|---|---|---|---|
| E-M01 | T-LAUNCH: `m.instant` splash to matched frame; lamp arrive (section 10) | none | none |
| E-M02 | T-LAUNCH, W1: the mark | none | mark still (MP-17 retired, proposal) |
| E-M03 | T-LAUNCH: `m.enter.group` | none | none |
| E-M04 | none (PlainScreen) | none | none |
| E-M05, E-M06 | `m.progress.wait` plus `m.swap`; result `m.swap` | none | indicator in the button when RM is off |
| E-M07 | `m.fade` (mark), `m.enter` | none | none |
| E-M08 | `m.swap` | none | none |
| E-M08b | `m.swap` into a reserved slot | none | none |
| E-M09a | T-STEP: `m.exit`, then `m.fade` | H-select on the answer | none |
| E-M10 | T-STEP; lamp change | none | the 1200 ms in-room lamp cross-fade is not a v2 named exception: 280 (`lamp.returnMs`) unless Karma adds it |
| E-M11 | `m.fade` (lockup), `m.enter.group` | none | offsets become `enter.staggerMs` |
| E-M12 | `m.enter` | none | none |
| E-M13 | T-STEP `m.step` | none | lamp dim as E-M10 |
| E-M14 | `m.enter` | none | none |
| E-M09 | T-STEP; lamp change | none (was `success`) | the cover hold and flyleaf opening are RETIRED (ceremony): the open book arrives with `m.enter`; lamp rise as E-M10 |
| E-M15 | T-TAB lamp settle; `m.enter.group` | none | none |
| E-M16 | T-SHEET (sign-in as a native sheet) | none | native `formSheet` |
| E-M17 | `m.progress.wait` plus `m.swap` | H-select today on provider buttons; v2 lists none for sign-in | indicator plus words; RM words |
| E-M18 | `m.enter` | none | none |
| E-M19 | T-PUSH | none | none |
| E-M20 | `m.progress.wait`, `m.swap` | none | as E-M17 |
| E-M21b | `m.instant` enable; `m.enter` | none | none |
| E-M22 | `m.swap` | none | none |
| E-M23 | `m.progress.wait`; `m.fade` block | none | drawing still |
| E-M24 | `m.swap` | none | none |
| E-M25 | `m.fade`; T-STEP inside the sheet | H-select on an answer | none |
| E-M26 | `m.swap` | none | none |
| E-M27 | T-PUSH | none | none |
| E-M28 | `m.progress.wait`, `m.swap`; sheet dismiss | none | none |
| E-M29 | `m.sheet` dismiss; T-RESUME under it | none | none |
| E-M20o | `m.fade` block | none | moon still (MP-17 retired, proposal); card 08 already asks static under RM |
| E-M21 | `m.swap` into a reserved slot | none | none |
| E-M22o | `m.swap` | none | none |
| E-M23o | `m.exit`; lamp return | none | the Book's first-view settle is RETIRED (E-M82) |
| E-M30 | T-GATE: `m.sheet` (native sheet), held card `m.enter` | none | the native sheet replaces `SlideInDown`; its glass, inset and opacity at full height are the system's |
| E-M31 | `m.progress.wait`, `m.swap`; Apple's sheet | none | none |
| E-M32 | `m.swap` | none | none |
| E-M33 | Apple's sheet; T-SHEET; then T-KEEP | none (was `success`; StoreKit's sheet is the system's) | none else |
| E-M34 | `m.sheet` dismiss; T-COVER out; `m.toast` | none | none |
| E-M35 | `m.sheet` dismiss | none | none |
| E-M36 | T-COVER out; `m.toast` | none | none |
| E-M37 | T-PUSH; placeholder `m.fade` | none | none |
| E-M38 | `m.progress.wait`, `m.swap` | none (today `tap`) | ENG-M10 |
| E-M39 | `m.instant` (drawn with the screen) | none | none |
| E-M38c | T-SHEET | H-select on the reminder ask only if it is a choice; Save a copy none | ENG-M10 decides |
| E-M90 | T-SHEET | none | native sheet |
| E-M91 | `m.instant` on return; `m.enter.group` on cold launch | none | none |
| E-M100 to E-M113 | see section 4y: each row names its T-* and m.* | per row | new in v2 |
| E-M120 to E-M124 | see section 4y (round 2, proposed) | none | new in v2 |
| E-M50, E-M51 | none; then T-LAUNCH | none | none |
| E-M52 | `m.fade` block; lamp leave | none | none |
| E-M53 | `m.swap` | none | none |
| E-M54, E-M55 | `m.progress.wait`, `m.exit`, lamp return, `m.enter` / T-STEP | none | none |
| E-M56 | `m.fade` | none | none |
| E-M40 | T-SYSLINE: `m.enter` (line), `m.move` | none | none |
| E-M41 | `m.swap` | none | none |
| E-M42 | T-SYSLINE out: `m.exit`, then `m.move` | none | none |
| E-M43 | `m.list.remove` or next render | none | none |
| E-M44 to E-M46 | `m.instant` or T-SYSLINE; `m.swap` | none (Speak's H-press stays) | none |
| E-M47, E-M48 | area A, area C | as theirs | none |
| E-M49 | `m.swap` | none | none |
| E-M57 | `m.sheet` dismiss over an already filtered room | none | none |
| E-M58 | `m.swap` | none | none |
| E-M70 | T-LOCK cover on `m.instant` | none | none |
| E-M71 | T-RESUME | none | none |
| E-M72 | T-LAUNCH | none | none |
| E-M73 | T-LOCK unlock `m.fade` | none | none |
| E-M74 | `m.swap` | none | none |
| E-M75 | `m.swap` | none (was `success`) | ENG-M10 |
| E-M76 | `m.instant` | H-select | none |
| E-M80 | T-TAB (native tabs); lamp settle | none | native tabs; T-MIN never on Home or Me |
| E-M81 | system | none | none |
| E-M82 | none | none | RETIRED: the Book renders complete |

## 5. Waiting and placeholders (all areas)

DESIGN rule 5 is the law; this table gives its motion.

| Band | Wait | What the parent sees | Motion |
|---|---|---|---|
| W0 | 0 to `loading.placeholderAfterMs` (proposed 350; NS-34 "controls usable by 350 ms") | the screen with its controls; a tapped button shows its busy words at once (MP-18) | none beyond MP-01 and MP-18 |
| W1 | 350 ms to 10 s | a whole-screen wait: the StateScreen loading form with its mark or drawing breathing (MP-14 then MP-17). A region inside a ready screen: static placeholders (MP-19) | fade in 200; content replaces by MP-06 |
| W2 | at `loading.heldAfterMs` (proposed 10000; DESIGN rule 5, NS-10-R0, `RESTORE_WAIT_MS`) | the slow or held state with a way forward | MP-06 into the slot reserved for it (E-M21); the loop stops |
| W3 | a network answer that fails | the offline or error state for that action, in place (R2) or as a block (R4) | MP-06 into the error words; busy ends |

Local reads (Home, the Book, a letter, Find) should never leave W0 on an SE 3 (NS-34, NS-37); W1 to W3 are for network reads and the first open after an update. Find never shows a spinner (NS-02 Slow row).

## 6. Motion rows for the accessibility walk and the run sheet (E-S23)

To add to the device walk (BL-948, BL-984) and the SE 3 run sheet (BL-929), beside DESIGN section 9:

1. J-N15, NS-33-R5: with RM on, visit every E state; nothing moves in a loop. Fails today on any busy button (G-EM2).
2. LPM on: the lamp breath and MP-17 stop. Fails today (G-EM1).
3. Every MP-14 state: no lamp, no breath; heading focused; title announced once.
4. Wrong code, cancelled Face ID, failed restore, See Plus offline: no shake, no red, no haptic.
5. Keep sheet: a tap during the rise lands on a button; under RM nothing travels; under RT the sheet is solid and still fades in; with glass on, the sheet never flashes clear at the start or end of a fade (law 12).
6. Toasts and undo lines: with VO the window outlives the reading (T4, NS-33-R15); with Switch Control it stays until the parent moves on.
7. Tabs: no content re-enters; the light never cuts to dark and back.
8. NS-34 timing: a screen change starts within 100 ms; controls usable by 350 ms; named hand-offs under `sequenceMaxMs`; the save hand-off under `hardCeilingMs`; no frame over 16.7 ms during E-M03, E-M10, E-M13, E-M30 and E-M80.
9. Warm resume after a call during first run: same step, same light, no re-entry; after a kill: the step's heading (first run) or Home's heading.
10. Account B on A's phone: screen-record the sign-in dismiss frame by frame; no frame shows A's letters (E-M57).

## 7. Proposed token additions (input to `docs/design/system/MOTION.md` and `tokens.v2.json`; no existing value changes)

The system file decides names. Area E needs:

```ts
motion: { ...existing,
  press: { scale: 0.97, cardScale: 0.98, opacity: 0.9, reducedMs: 90 },  // G-EM3: today typed in press.ts:46
  toast: { holdMs: 4000, dismissDy: 40, dismissVelocity: 600 },           // G-EM4: today typed in toast.tsx:56,90
  loading: { placeholderAfterMs: 350, heldAfterMs: 10000 },               // DESIGN rule 5; section 5
  systemLine: { showAfterMs: 2000, hideAfterMs: 1000 },                   // E-M40, E-M42
}
a11y: { repeatGapMs: 60000 }                                              // MP-24; NS-33 Slow row
```

Status: the system file's 13a block adopted `toast.*`, `loading.placeholderAfterMs`, `systemLine.*` and `tap.rmMs` under these names. It also carries this file's v1 `loading.slowLineAfterMs` 4000, which v2 here replaces with `loading.heldAfterMs` 10000 to match DESIGN rule 5 and NS-10-R0: the system lead should swap it. `a11y.repeatGapMs` is not in 13a (it is not motion; it may live in an a11y block).

Reasons: `placeholderAfterMs` and `heldAfterMs` are DESIGN rule 5's numbers (350 from NS-34; 10 s from NS-10-R0 and the built `RESTORE_WAIT_MS`); `showAfterMs` and `hideAfterMs` are proposals to stop a line flapping on a weak signal (UNVERIFIED; tune on a phone). `RETRY_BEAT_MS` 500 may stay a module constant (a reading beat). The welcome offsets (G-EM6) should become `enter(i)` indices. Tests for `packages/design-tokens/test/tokens.test.ts`: `placeholderAfterMs` at most 350; every new duration under `hardCeilingMs` except `heldAfterMs` and `repeatGapMs`, which are waits, not moves; `reducedMs` at most `fadeMs`.

## 8. Superseded or changed

- FIRST-RUN-MOTION-SPEC-10nov section 3: four cards became three (CTO, 11 Nov), and the story intro is unbuilt (BL-893); DESIGN.md draws none.
- FIRST-RUN-MOTION-SPEC-10nov section 6, "a quiet in-button spinner ... replaced by a static 'Working' word under Reduce Motion": changed. Busy is words at every setting (MP-18), to meet DESIGN rule 5 (no spinner) and NS-33-R5.
- FIRST-RUN-MOTION-SPEC-10nov section 6, auth entry on `route.dissolveMs`: superseded by the built route table (`onboarding` is a `cut`, `(auth)` a system modal; `transitions.logic.ts:45,55`).
- House MOTION.md 5k, "Low Power Mode is not read": the card wins (NS-34 section 3); G-EM1.
- House MOTION.md 6 lists `success` for a saved letter only; the code plays it for three more outcomes (MP-H, K-EM3).
- SOUND.md `gentle_error`: not used in area E (MP-S).
- By the design system v2 (`docs/design/system/MOTION.md`, sections 5, 9, 10 and 13; proposals there marked so): `Breathe` retired and the lamp kept as the one named ambient exception, ruling 31 (MP-17, E-M02, E-M20o, E-M23); the book-cover opening retired (E-M09, `cover.*`); the Book's first-view settle retired (E-M82, `gentle`); `success` trimmed (E-M09, E-M33, E-M75); `spring.standard` 0.30 s; `sequenceMaxMs` 600; the Keep sheet, sign-in and our sheets become native sheets (T-SHEET); JS tabs become native tabs (T-TAB).
- This file's v1 draft: an "update required" blocking screen and a low-storage sheet are withdrawn to match DESIGN.md (E-S16 is a line in Me; under 50 MB is Listen's StateScreen state); the Opening your book rows moved to C-S10 states; the 4 s slow line became the 10 s held state.

## 9. Card gaps

DESIGN.md's K-E01 to K-E09 stand; these are the motion ones.

| # | Card row | What is missing | Proposed default |
|---|---|---|---|
| K-EM1 | NS-33-R5, J-N15 | silent on busy indicators inside controls; a platform spinner is a loop | busy words, no indicator, at every setting (MP-18) |
| K-EM2 | NS-34 section 3 and NS-33 Low Power row (loops stop under LPM) | nothing reads LPM; house MOTION.md 5k says it is not read | read LPM; stop the lamp breath and MP-17 (G-EM1) |
| K-EM3 | frame 00 section 5 ("no celebration"); MOTION 6 | which outcomes earn `success` beyond a kept letter | keep the four built ones (each the person's own act); never on sign-in, claim, restore or update |
| K-EM4 | NS-10-R0 ("held screen within 10 s") | how the two actions arrive | MP-06 into a reserved slot (E-M21) |
| K-EM5 | X5 pause rows in every card | when a paused surface disappears | on the next render of its screen, never under a finger (E-M43, DESIGN J-E14) |
| K-EM6 | NS-33-R15 (T4) vs the built Toast | the toast with an action never times out (stricter than T4) but its action can expire first (BL-954's dead Undo) | one helper; the toast and the action expire together by MP-05 (BL-954) |

## 10. Engineering gaps

DESIGN.md uses `G-E01` onward; motion gaps are `G-EM`. The system file cites this file's v1 names G-E1 to G-E6: they are G-EM1 to G-EM6 here, and it carries them in ENG-M8 (G-EM1), ENG-M4 and ENG-M7 (G-EM10, G-EM4), ENG-M1 (G-EM3), ENG-M2 and ENG-M8 (G-EM8) and 13a; G-EM2 is its `m.progress.wait` row.

| # | Gap | Where | Backlog row |
|---|---|---|---|
| G-EM1 | no Low Power Mode hook; `Breathe` and the lamp breath run in LPM | `lib/motion.ts` (`useLowPowerMode`; `expo-battery` not installed, D-065; eng input B section 7 risk 9) | BL-984 or a new bucket E row |
| G-EM2 | `Button loading` draws `ActivityIndicator`, a loop under RM, and has no busy words prop | `components/ui/button.tsx:162` | BL-984; owner design-systems |
| G-EM3 | RM press dip typed as 90 | `components/motion/press.ts:46` | design-systems token task |
| G-EM4 | toast default 4000 and swipe thresholds 40 and 600 typed | `components/ui/toast.tsx:56,90` | design-systems token task |
| G-EM5 | `RETRY_BEAT_MS` 500 outside tokens | `lib/resilience/launch.logic.ts:41` | none needed; noted |
| G-EM6 | welcome entrance offsets 120 to 200 typed | `app/onboarding.tsx:387-564` | design-systems token task |
| G-EM7 | no placeholder component (MP-19); SystemLine (DESIGN section 7 item 1) needs E-M40 to E-M42 built in, including the show and hide waits | `components/ui` | the SystemLine row DESIGN proposes |
| G-EM8 | RT is not read beside RM; glass surfaces need it (`isLiquidGlassAvailable()` ignores accessibility settings) | `lib/motion.ts` or `lib/a11y.ts` | design system v2 engineering rows |
| G-EM9 | splash hide fade in SDK 57 UNVERIFIED | `app/_layout.tsx:179` | none; keep the cut |
| G-EM10 | glass surfaces that fade (Keep sheet, Sheet under RM, toast) fade the whole view's opacity today (`plus-gate.tsx:187-190`, `sheet.tsx:94`, `toast.tsx` exit) | those files | design system v2 rows, when the glass surfaces are built |

## 11. Reconciliation

- With DESIGN.md (read 20 Nov, v with sections 0 to 12): every state name in section 4 is DESIGN's. Two ids here are motion-only labels with no DESIGN state: the lock offer (E-M75, built `lock-offer.tsx`, not in DESIGN's inventory) and the Keep sheet's "hold" path (E-M36, RT-PLS-10; DESIGN has no state for it because no sheet shows).
- DESIGN E-S10.offline says See Plus is not drawn; the built `sheetTap` also handles a connection lost after the sheet opened. E-M32 covers both; the design lead may want a state name for the second.
- With area C: E-M20o to E-M23o are C-S10's motion; area C's MOTION.md should cite them.
- With area A: A-S13 hands to the Keep sheet (area A owns Keep's press and the save, MOTION 5e; area E owns the sheet from its first frame). A-S04.lowSpace and A-S04.full take E-M45 and E-M46.
- With area D: D-S24 (plan date line) sits in E-S11; no motion beyond E-M37 and E-M39.
- With WORDS.md: busy words (MP-18: "Trying again", "Opening the App Store", "Sending", "Restoring", "Keeping"), the held-state title (E-M21) and every SystemLine sentence are the content lead's keys; this file times them only. Quoted words here are DESIGN's or placeholders.
- With `docs/design/system/MOTION.md` (read 20 Nov): keyed (2b, 4z). Three points for Karma and the two leads to settle:
  1. **Waiting states.** DESIGN rule 5 asks for "a breathing state" from 350 ms to 10 s; RULED (ruling 31, 20 Nov): `Breathe` is retired in waiting states. The DESIGN rule reads "a still state". Reason: still (no signal behind the loop); a waiting state then reads by its words and the 10 s way forward, which is what NS-10 and NS-34 ask for.
  2. **Busy buttons.** DESIGN rule 5 says "no spinner"; the system's `m.progress.wait` keeps the system activity indicator inside a button when RM is off. Recommendation: busy words at every setting, indicator dropped, because the words already answer the tap and one rule is easier to test; if the indicator stays, it is the system's and stops under RM and LPM.
  3. **In-room lamp changes.** The v2 named-exception list has the lamp arrival only; first run's welcome-to-form dim and form-to-finish rise run 1200 today. Recommendation: settle them over `lamp.returnMs` 280 (within the cap), or name them in system section 5 (the lamp is kept, ruling 31).
- The prototype (`MOTION-PROTOTYPE.html`) plays today's tokens, with a switch for the ruled `spring.standard` 0.30 s (ruling 26); it is a layout reference, never a timing source (ruling 37); retired moves (cover opening, `Breathe`) are labelled as today's build.
