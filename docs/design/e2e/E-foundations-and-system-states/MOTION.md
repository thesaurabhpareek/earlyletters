# Area E. Foundations and system states: motion

Status: DRAFT v1, 20 Nov 2026. Motion lead, area E. Keyed to the screen ids in `DESIGN.md` (skeleton of 20 Nov: `E-S01` to `E-S23` and the state suffixes `.default`, `.loading`, `.empty`, `.offline`, `.error-<code>`, `.killswitch`, `.paused-<switch>`, `.lapsed`, `.second-account`, `.ax5`, `.vo`, `.dark`). Re-key pass: when DESIGN.md adds journeys and per-screen states, every `E-Mnn` row below keeps its id and gains the new state names; no id is reused.

Play every move in `MOTION-PROTOTYPE.html` (this folder): each primitive and each area E moment, with a Reduce Motion toggle, light and dark, and a slow-motion switch for review.

Sources, in order (BRIEF section 1): the locked cards (mainly `11-foundations.md` NS-33 and NS-34, `08-keeping-and-trust.md` NS-10, the Plus rows in `00` principle 6 and every card's Reduce Motion row), `14-test-plan.md` J-N15, `16-council-review-round-2.md` T4; engineering input `/home/claude/review/eng/B-mobile-client.md` (risk 9); house design `docs/design/MOTION.md` v0.2, `SOUND.md`, `tokens.motion` in `packages/design-tokens/src/tokens.ts`, `apps/mobile/src/lib/motion.ts`, `lib/transitions.logic.ts`, `lib/haptics.shared.ts`, `components/motion/*`, and the built screens named per row. History used where a card agrees: `docs/design/specs/FIRST-RUN-MOTION-SPEC-10nov.md` (what it says that is superseded is listed in section 8).

## 0. How to read this file

- `MP-nn` is a working name for a motion primitive (section 2). Section 2 is input to `docs/design/system/MOTION.md`, which owns the shared primitives; areas A to D key to the system file's names, and no area (this one included) defines a new duration, spring or easing in a screen: it goes to the system file as a proposed token (section 7).
- `E-Mnn` is one transition or feedback moment in area E (section 4), keyed to an `E-Snn.<state>`.
- Every number is a token from `tokens.motion` (named in backticks) or a proposed token (section 7). No row types a raw number that is not a token, except where it quotes code that already does so (flagged as a gap).
- RM = Reduce Motion. LPM = Low Power Mode. VO = VoiceOver.

## 1. The laws (all areas)

From MOTION.md section 2 and 5l, restated as the rules every area signs up to:

1. **Calm and quick.** No single move longer than 300 ms. Named exceptions, all already tokens and all decorative or sanctioned by MOTION.md: lamp arrival and in-room light change `lamp.arriveMs` 1200; the new-letter wash `newMarkMs` 1600; draw-on `drawMs` 1200; the save hand-off (about 1.1 s, under `hardCeilingMs` 2000); empty and loading breath `emptyBreathMs` 8000 and lamp breath `lamp.breathMs` 9000 (loops, opacity only). Any sequence of moves stays under `sequenceMaxMs` 900.
2. **Controls never animate in.** Buttons, fields and links are opaque and hittable from the first frame of every screen, sheet and state. Only content (words, drawings, cards) enters.
3. **Commit first, then the receipt.** No save, sign-in, purchase or retry waits on an animation.
4. **Interruptible.** A tap during any move lands on its end state. Springs start from where the value is.
5. **Quiet joy, no ceremony.** No confetti, counters, ticking numbers, streaks, badges, check-mark animations, pulses, shakes or flashes. Nothing celebrates sign-in, Plus or an update.
6. **Problems arrive like any other content.** An error, outage, offline, pause, plan lapse or low-storage state uses the same arrive and swap moves as everything else: no shake, no red flash, no slide from the top, no bounce, no haptic, no sound.
7. **Loops are opacity only, front screen only, and stop** under RM, LPM (see section 9, gap G-E1), in the background, when the screen is not focused, and when a sheet covers it (NS-33-R5, NS-34 section 3, J-N15). At most one loop on screen.
8. **Native first.** Tabs, pushes, system sheets, alerts, Apple's sign-in and Apple's subscription sheet are the platform's own, including the platform's reduced transition under RM.
9. **One RM mechanism.** Screens never read the setting; they use `useMotion()`, `useReducedMotion()`, `useSheetMotion()` and `useRouteTransitions()` (`lib/motion.ts`). Under RM every movement becomes one opacity fade of `fadeMs` (200 ms) run with `ReduceMotion.Never`; decoration does not run at all; nothing jumps on content that carries meaning.
10. **Two screens of words are never on top of each other mid-move** (`HAND_OFF` 0.35): the leaving words go first.

## 2. Motion primitives: input to `docs/design/system/MOTION.md`

**Status of this section (20 Nov, Karma's redirect).** The shared motion primitives are owned by the design system v2 (`docs/design/system/MOTION.md`, design-systems motion lead; brief `docs/design/system/BRIEF.md`). This table is **input to that file, not a competing standard**: it records what the built code does today (with file and line) and what area E needs. Areas A to D key to the system's primitive names, not to `MP-nn`. When the system file lands, every `MP-nn` below and every `E-Mnn` row in section 4 is re-keyed to the system's names (column "System primitive" below, filled at the final pass); where the two differ, the system file wins and the difference is listed in section 8.

### 2a. Glass rules that change the moves below (design system v2 brief, section 3; Expo SDK 57 `expo-glass-effect`)

- Glass layer surfaces in area E: the tab bar (system native tabs), the Keep gate sheet and every `ui/sheet.tsx` sheet, the undo toast, navigation and toolbar buttons. Content layer (never glass): every MP-14 screen (errors, outage, kill switch, update required, not found, second account), first run's paper rooms, Plus confirmed's terms, the system line (E-S15) and placeholders (MP-19).
- **Never animate a glass view's opacity to 0** (Expo: a glass view at opacity 0 stops rendering). Wherever a row below says "fade" for a glass surface (MP-05 toast exit, MP-10 sheet under RM, E-M30 to E-M35), the glass itself animates `glassEffectStyle` from `regular` to `none` (with `animate` and `animationDuration` set from the same token), and only the surface's content and the scrim change opacity. Under Reduce Transparency or before iOS 26 the surface is solid tokens, so an opacity fade is fine there.
- Glass morphs between shapes (a control growing into a sheet, controls merging in a `GlassContainer`) are the system file's to define; area E uses none of its own.
- Native tabs (`expo-router/unstable-native-tabs`) would replace the JS tabs (E-M80): the swap and the bar's own glass, including minimise on scroll, are then the system's; the lamp rule still applies to the content under it.

Easing for every timed move: `easing` = cubic-bezier(0.2, 0, 0, 1) (M3 standard), exported as `STANDARD_EASING`. Springs: `snappy` (stiffness 520, damping 46, mass 1; ratio 1.0), `standard` (260, 30, 1; 0.92), `gentle` (90, 18, 1; 0.95).

| Id | Name | Use for | What moves | Duration or spring | RM substitute | Haptic | Built in | Never |
|---|---|---|---|---|---|---|---|---|
| MP-01 | Press, control | every Button, IconButton, chip, row that acts | scale 1 to `press.scale` 0.97 on press-in, back on release | `snappy` spring | opacity to `press.opacity` 0.9 over 90 ms, no scale (90 ms is hardcoded: gap G-E3) | none by default; only an outcome passes `haptic` (MP-H) | `usePressScale('control')`, `components/motion/press.ts`; `Button` | delay the action until the press finishes |
| MP-02 | Press, card | pressable cards (letter card, slip, held card) | scale to `press.cardScale` 0.98; held through card-to-page (MOTION 5f) | `snappy` | as MP-01 | none | `usePressScale('card')`, `PressHoldContext` | pop back before the page opens |
| MP-03 | Enter | content arriving: words, a line, a card, a toast | opacity 0 to 1, y `enter.dy` 8 to 0 | `enter.durationMs` 280, `staggerMs` 30 for the first `staggerMax` 6; item 7 on gets no entrance | one fade `fadeMs` 200, no travel, no stagger | none | `useMotion().enter(i)` | controls; re-entering on a return or tab switch; typewriter effect on any words |
| MP-04 | Leave | a step's words going up and on | opacity 1 to 0, y 0 to -8 | `exitMs` 160 | fade `exitMs` 160 | none | `useMotion().leave()` | leave controls |
| MP-05 | Exit | transient UI going away: toast, inline card, a line | opacity to 0, y down a little | `exitMs` 160 | fade `fadeMs` 200 | none | `useMotion().exit()` | exit faster than one frame (a cut reads as broken) |
| MP-06 | Swap in place | words replaced where they stand: a status line changing, an error line updating, a toast over a toast, a busy label | cross-fade old out, new in, same box | `swapMs` 150 | same (it is already a fade) | none | `FadeIn/FadeOut.duration(swapMs)` in toast.tsx, lock-offer.tsx, onboarding.tsx | shake, colour flash, width animation |
| MP-07 | Step hand-off | one step to the next inside one room (first run, consent steps, a sheet's next page) | MP-04 then MP-03; the lamp does not change room | 160 + 280 = 440 ms | leave fade `fadeMs`, then arrive fade `fadeMs`, no stagger (`stepMotion(true)`) | none (Continue and Back are navigation) | `stepMotion()` in `transitions.logic.ts`; `app/onboarding.tsx` | slide the whole screen; two steps' words visible together |
| MP-08 | Dissolve | full-screen rooms with no change of shape (Listen, Review, Read together) | platform cross-dissolve | `route.dissolveMs` 280 | `fadeMs` 200 | none | `routeTransitions`, move `dissolve` | |
| MP-09 | Push and back | Settings and Me pages | platform push, including swipe back | platform | platform's reduced transition | none | move `push` | custom push curves |
| MP-10 | Our sheet | `ui/sheet.tsx` and the Keep sheet | sheet rises from below, scrim fades in; room keeps its lamp and pauses its breath | `standard` spring up; out on `exitMs` | sheet and scrim fade `fadeMs`, no travel | none on open or close | `useSheetMotion()`, `Sheet`, `plus-gate.tsx` | sheet content adding its own stagger (except one held card, E-M30) |
| MP-11 | System modal | `(auth)`, `invite`, `plus/confirmed`, Apple sign-in, Apple's subscription sheet, share sheet, photo picker | the platform's rise | platform | platform | none | move `sheet` (empty options) | restyle or re-time a system sheet |
| MP-12 | Cut | first run route (`onboarding`), redirects that must never slide | nothing | 0 | same | none | move `cut` | |
| MP-13 | Reflow | a line or inline card inserted into or taken out of a column; siblings move | siblings' layout on a spring; the inserted item uses MP-03 or MP-05 | `standard` (`layoutSpring`) | no reflow animation (instant), the inserted item still fades `fadeMs` | none | `useMotion().layout()` | animate text size, font size or a text block's height |
| MP-14 | Block arrive | a full-screen state: error, outage, kill switch, update required, not found, second account held, launch recovery | the whole block fades in once | `fadeMs` 200 (always runs; it is its own RM form) | same | none | `StateScreen` ARRIVE | lamp, draw-on or breath on a problem screen |
| MP-15 | Cover | privacy cover and app lock | on: drawn at once; off (unlock): fades | on 0 ms; off `fadeMs` 200 | same | none | `PrivacyCover`, `app-lock-layer.tsx` | a fade in (the app switcher snapshot would catch the book) |
| MP-16 | Lamp | lit rooms only (gate, welcome, form, finish, Home, Book, write) | one radial pool, opacity only | arrive `lamp.arriveMs` 1200 (first lit room after cold launch; also an in-room change of scene or intensity); return `lamp.returnMs` 280; leave `lamp.leaveMs` 160; breath `lamp.breathMs` 9000 to `breathOpacityMin` 0.88 | jumps to its level, still; no breath | none | `Lamp`, `LampView`, `useUnlitRoom()`, `persistKey` `firstRun` and `tabs` | on any screen that records, plays a voice, sells (Keep sheet, Plus) or reports a problem (MP-14 screens, system line) |
| MP-17 | Breathe | the one drawing in an empty or loading state (moon, envelope) | opacity 1 to 0.85 and back | `emptyBreathMs` 8000 full cycle, sine | off: drawing shown still at full opacity | none | `Breathe` (`components/motion/breathe.tsx`) | wrap text or a control; run on a problem screen; run with another loop on screen |
| MP-18 | Busy in a control | a button whose action is running (sign in, retry, restore, purchase hand-off) | label stays; an activity indicator sits in the button; other buttons on the screen disable at once | indicator: platform; label change if any: MP-06 | **target**: no indicator; the label swaps to its busy words (MP-06) and stays static. **Built**: `ActivityIndicator` spins under RM too (gap G-E2, breaks NS-33-R5) | none | `Button loading` (`components/ui/button.tsx:162`) | full-screen blocking spinner; a spinner with no accessible name; a busy state with no time-out (see MP-23) |
| MP-19 | Placeholder (proposed) | a region whose data is local but not ready at first frame (a long list after a cold start, a plan status) | nothing for `loading.placeholderAfterMs` (proposed 350); then static placeholder shapes fade in `fadeMs`; real content replaces them with MP-06 | as stated | same (already fades only) | none | not built (no skeleton exists in `apps/mobile/src`); new, in `components/ui` | shimmer, sweep, pulse or any loop on placeholders; placeholders for a region that has an empty state (show the empty state instead) |
| MP-20 | Wash | a newly arrived letter in the Book; a restored span in Review | `accentSoft` background fades out | `newMarkMs` 1600 | shown static, then fades | none (the save already gave `success`) | Book arrival, Review put-back | on anything that is not a person's letter (never on Plus, sign-in, update) |
| MP-21 | Draw once | single-weight line drawings that appear once per reader | `strokeDashoffset` | `drawMs` 1200, then text MP-03 | drawn complete; text fades `fadeMs` | none | `DrawOnPath`, `DrawOnStrokes` | repeat; draw on a problem screen |
| MP-22 | Signature moves (reference only) | save into the month, card to page, page turn, listening glow, read-together highlight | as MOTION.md 5b, 5c, 5e, 5f, 5g, 5m | their tokens (`file`, `cardToPage`, `pageTurn`, `breath`, `highlight`) | as MOTION.md | as MOTION.md 6 | `fileIntoMonthPlan`, `CardToPage`, `PageTurn` | a second implementation in any area |
| MP-23 | Timed lines and undo windows | toasts, undo lines, busy states that wait on a network | a toast without an action leaves after 4000 ms (hardcoded default, gap G-E4) with MP-05; with an action it stays until used, closed, swiped or the screen changes; undo windows follow T4 through one helper (BL-954) | T4: the stated seconds, or until VO has finished the line plus those seconds, whichever is later; with Switch Control, until the parent moves on | same | `tap` on Undo | `Toast`, `toast.logic.ts`; helper BL-954 | a dead Undo still on screen; a toast closing while VO reads it; any visible countdown |
| MP-24 | Announce and focus | every state change the eye would catch | not motion: VO hears it | arrival of a screen or block: focus to its heading; a new line: one polite announcement; a "still working" line: at most once a minute (NS-33 Slow row; proposed `a11y.repeatGapMs` 60000) | same | none | `announce()`, `useFocusOnMount()` | announce over a playing voice (NS-33 section 5); move focus for a toast |
| MP-25 | Follow the finger | swipe to dismiss a toast, page turn, story swipe | element follows the finger; past the threshold it goes, else settles | settle `snappy`; thresholds `SWIPE` (0.25 width, 600 pt/s) for pages; toast 40 pt or 600 pt/s (hardcoded, gap G-E4) | no follow; a swipe past the threshold triggers the fade form; every gesture has a button | none | `swipeOutcome()`, toast pan | a gesture with no button |
| MP-26 | Scheme change | light, dark, Increase Contrast, Bold Text, text size | nothing animates; the next frame is in the new scheme; the lamp re-renders at its level with no arrival | 0 | same | `tap` on the Appearance choice | `useTheme()` | cross-fade a whole screen; animate font size (MOTION 5i: text cross-fades `swapMs` only for Reading Size) |

### 2b. Key to the system primitive names

Filled at the final pass from `docs/design/system/MOTION.md`. Until then each `MP-nn` stands for the system primitive that does the same job; a row marked "pending" has no system name yet.

| Working id | System primitive name | Glass note |
|---|---|---|
| MP-01, MP-02 | pending | glass buttons: the system's own press (interactive glass) replaces the scale where the control is a `GlassView` with `isInteractive` |
| MP-03, MP-04, MP-05, MP-06, MP-07 | pending | MP-05 on the glass toast: `glassEffectStyle` to `none`, never opacity 0 |
| MP-08, MP-09, MP-11, MP-12 | pending | system transitions |
| MP-10 | pending | glass sheet; under RM animate `glassEffectStyle`, fade only content and scrim |
| MP-13 to MP-21, MP-23 to MP-26 | pending | content layer, no glass |
| MP-22 | MOTION.md 5b to 5m (house) | area A and B |

### MP-H. Haptics (shared, from `lib/haptics.shared.ts` and MOTION.md 6)

A haptic marks an outcome the person caused, never a navigation and never a system state. Five intents only:

| Intent | iOS | Android | Where (as built) | Area E use |
|---|---|---|---|---|
| `tap` | `selectionAsync` | `Segment_Tick` | a choice picked (age pills, consent answers, Appearance, chips), Undo, Put it back, Reading Size | E-S03, E-S07, E-S11, E-S12, E-S21 |
| `press` | `impactAsync(Light)` | `Context_Click` | record start and stop, Speak and Type | none |
| `soft` | `impactAsync(Soft)` | `Long_Press` | long press, "Not much today" | none |
| `success` | `notificationAsync(Success)` | `Confirm` | a letter kept; also, as built: the book opens at the end of first run (`onboarding.tsx:234`), Plus turned on in the Keep sheet (`plus-gate.tsx:114`), app lock turned on (`lock-offer.tsx:54`) | E-M09, E-M33, E-M64 (see card gap K-3) |
| `warning` | `notificationAsync(Warning)` | `Reject` | a destructive act confirmed (Delete, Let it go) | none in E |

Never in area E: a haptic on an error, outage, offline, kill switch, pause, lapse, update, low storage, second account, sign-in success, Continue, Back, Close, Skip, a tab change, a sheet opening, a toast showing. `success` and `warning` are never throttled; `tap`, `press`, `soft` are throttled to one per 100 ms. A haptic always goes with a visible change (iOS mutes the Taptic Engine in LPM).

### MP-S. Sound

Paper sounds are off by default (SOUND.md 2). Area E plays none. SOUND.md's `gentle_error` (with a `notificationAsync(Error)` haptic) is reserved for "failures the person can fix now" such as a photo that did not attach (area A); it is not used for any area E state, because every area E state is a system condition, not the person's act (law 6). `invite_accepted` belongs to area D.

## 3. What never animates (area E)

- No shake, wobble or red flash on a wrong code, a failed sign-in, a failed purchase, an outage or an error.
- No pulse, glow or breathing on a call to action: See Plus, Update, Try again, Sign in, Continue.
- No ticking numbers: the email resend wait says "in a minute" and re-renders once when it passes (built, `code.tsx:94`); no trial-days counter; no letters-left counter; no storage gauge that animates down.
- No confetti, check mark draw, stamp, seal or glow on sign-in, the book opening, Plus starting, a restore, or an update.
- No spinner as a screen; no shimmer; no indeterminate bar that eases. A progress bar appears only for real measured progress (area C export) and moves linearly with it.
- No lamp and no breath on the Keep sheet, Plus in Me, Plus confirmed, any MP-14 screen or the system line.
- No banner sliding down from the top or up from the bottom for offline, outage, pause, update or storage; the line appears in place (E-M40).
- No auto-dismiss of an error line or a system line while its condition holds.
- No motion that suggests the app is writing: no typewriter, no word-by-word reveal of anything presented as a parent's words, including sample letters in first run.

## 4. Area E moments, keyed to screens

Each row: trigger; what moves; timing (tokens); RM; haptic; never. "As built" means the code already does it and this file confirms it.

### E-S01 Launch and boot

| Id | State | Trigger | What moves | Timing | RM | Haptic | Notes and never |
|---|---|---|---|---|---|---|---|
| E-M01 | `E-S01.default` | cold launch, splash hides (`SplashScreen.hideAsync`, `_layout.tsx:179`) | cut from splash to first frame; the first frame draws the mark where the splash drew it (PrivacyCover's 96 pt mark is the splash size) so nothing jumps | 0 | same | none | Whether expo-splash-screen's fade option exists in SDK 57 is UNVERIFIED; recommend no fade, the matched first frame is the transition |
| E-M02 | `E-S01.default` then Home | cold launch with a book | MOTION 5a: Home renders complete; dateline, greeting, prompt MP-03 with stagger (under 400 ms); a waiting card ("Recorded before the app closed.") is the next stagger item; capture cluster static; lamp MP-16 arrive 1200 | as stated | one fade `fadeMs`; lamp still at level | none | warm resume does nothing (E-M70) |
| E-M03 | `E-S01.default` then first run | cold launch, no book | lamp `gate` scene arrives 1200; the mark fades `fadeMs`; the age question MP-03 at index 2 (60 ms); controls static | as stated | fades; lamp still | none | as built (`age-gate-screen.tsx`) |
| E-M04 | `E-S01.error-launch` (launch recovery) | local database could not open | `PlainScreen`: no motion at all (no providers, by design) | 0 | same | none | as built |
| E-M05 | `E-S01.error-launch`, Try again | tap | MP-18 on Try again for `RETRY_BEAT_MS` 500 (a code constant, not a token: gap G-E5), then the app opens (E-M02) or the result line swaps in (MP-06) and is announced each time | 500, 150 | busy word static (no indicator) | none | never a shake on the second failure |

### E-S02 Welcome, E-S03 Age gate, E-S08 First book (first run as built)

One lit room, `persistKey="firstRun"`, route move `cut`. The story intro (BL-893, NX-40, cited by card 07 C44) is not built; if it ships, it follows FIRST-RUN-MOTION-SPEC-10nov sections 3 to 5 with three cards and the changes in section 8 here.

| Id | State | Trigger | What moves | Timing | RM | Haptic | Notes and never |
|---|---|---|---|---|---|---|---|
| E-M06 | `E-S03.default` to `E-S03.stop` | age answer No, then Continue | the question and answers MP-04; the stop line MP-06 in the same room; lamp unchanged | 160, then 200 (`SWAP_IN` is `fadeMs` here) | fades | `tap` on the answer only | no red, no shake; same mark, same place |
| E-M07 | `E-S03` to `E-S02` | Continue with Yes | gate words MP-04; lamp cross-fades from the centred `gate` pool (0.6) to the top `welcome` pool (1.0) over `lamp.arriveMs`; welcome words arrive | 160; 1200 | lamp jumps to welcome level; words fade | none | the paper is never unlit in between |
| E-M08 | `E-S02.default` | welcome arrives | lockup fades `fadeMs` (`welcome-lockup.tsx`); hero, body, free line MP-03 at 120, 150, 180 ms; the sign-in doorway at 200 ms (hardcoded `enterAt` delays, gap G-E6); Continue and sign-in buttons static from frame 1; welcome lamp breathes | as stated | one fade each, no delays | none | |
| E-M09 | `E-S02` to `E-S08` steps to finish | Continue on each step (`promise`, `child`, `signsAs`, `finish`) | MP-07 per step; lamp dims from welcome 1.0 to `form` 0.5 over 1200 on the first form step, rises to `finish` 1.0 over 1200 on the last; on finish the cover holds `cover.holdMs` 300 then cross-fades to the flyleaf with `cover.dx` 8 on `standard` | 440 per step; 1200 lamp | step fades; lamp jumps; cover cross-fades `fadeMs`, no shift | `success` once when finish is reached (as built) | Continue and Back silent; typed name on the cover after a pause with no per-letter motion (as built) |
| E-M10 | `E-S08` field errors (`.error-name-length` and like) | typing past a limit or invalid | the hint line swaps (MP-06), polite live region | 150 | same | none | no shake; the field keeps its value |
| E-M11 | finish to Home | "The book is open." then Continue | tabs join the stack in the same render; Home's lamp starts at first run's last light and settles to its daypart over `lamp.returnMs`; Home content MP-03 once (this is Home's first show) | 280; 280 | lamp at level; one fade | none | no tab bar flashes between (R1, `tabsInStack`) |

### E-S04 to E-S07 Sign in

The `(auth)` group is a system modal (MP-11). Its screens have no entrance of their own (as built, `sign-in/index.tsx:17`).

| Id | State | Trigger | What moves | Timing | RM | Haptic | Notes and never |
|---|---|---|---|---|---|---|---|
| E-M12 | `E-S04.default` | sign-in opened (Welcome, Me, consent no-book) | platform modal rise; content static | platform | platform | none | no lamp, no illustration |
| E-M13 | `E-S04.loading` | provider tap (Apple, email) | MP-18 on that button; the others disable at once; Apple's own button and passkey cannot hold an indicator: the busy line under the ways in swaps in (MP-06) | 150 | busy word static | `tap` (the provider buttons' own, as built) | Apple's sheet is the system's |
| E-M14 | `E-S04.error-<code>` (cancelled, network, service) | provider returns an error | busy ends at once; the error line MP-03 under the ways in, announced once; focus stays | 280 | fade 200 | none | cancelled by the person: no line, nothing moves |
| E-M15 | `E-S04` to `E-S05` to `E-S06` | Continue with email, code sent | native stack push inside the modal (MP-09) | platform | platform | none | |
| E-M16 | `E-S06.error-code` | wrong or expired code | the line under the field swaps (MP-06); field keeps the digits selected for retyping | 150 | same | none | no shake, no red flash; the resend wait never ticks (as built) |
| E-M17 | `E-S06.default` resend available | the minute passes | "Send a new email" enables in place (no animation), the recovery set appears with MP-03 and is announced once (as built `announceResend`) | 280 | fade | none | no countdown |
| E-M18 | `E-S07` steps | answer to Terms, sensitive data, age | step out and in by opacity only, `fadeMs` (`consent.tsx` STEP_IN/OUT); the answer being recorded keeps its look with MP-18 | 200 + 200 | same | `tap` on an answer; Continue silent | |
| E-M19 | `E-S07` to the book (success) | consent recorded | the modal dismisses (platform); under it E-M11 or the returning-account path E-M20 | platform | platform | none | no celebration, no haptic for an account |

### E-S09 Opening your book (returning account, new phone; card NS-10; shared with C-S10)

| Id | State | Trigger | What moves | Timing | RM | Haptic | Notes and never |
|---|---|---|---|---|---|---|---|
| E-M20 | `E-S09.loading` | sign-in found an account with a book elsewhere | MP-14 block; the moon MP-17 breathes; no button, no count, no spinner (as built, `new-phone-screens.tsx`) | 200; 8000 loop | moon still (card 08: "indicator is static") | none | no progress bar: we cannot measure it |
| E-M21 | `E-S09.loading` held past 10 s (NS-10-R0) | timer | "Finish setup" and "Try another way" arrive by MP-06 into a slot reserved from frame 1 (no reflow of the words above); announced once | 150 | same | none | the controls cross-fade once because they arrive after an async read (same exception as `lock-offer.tsx`); never pulse |
| E-M22 | `E-S09.offline`, `.error-<code>`, `.second-account` | read fails | MP-06 to the warm error block in the same screen; moon stops breathing (problem screen) | 150 | same | none | |
| E-M23 | `E-S09` to Home | book arrives | Home under it is already rendered; the block MP-05, Home lamp returns 280; Home content does not re-enter | 160; 280 | fade; lamp at level | none | `.killswitch` (NS-10-R8): never shown; local book only |

### E-S10 The Keep gate (the one gate), E-S11 Plus in Me, E-S12 Plus confirmed

| Id | State | Trigger | What moves | Timing | RM | Haptic | Notes and never |
|---|---|---|---|---|---|---|---|
| E-M30 | `E-S10.default`, `.lapsed` | Keep in Review when the allowance is used (`keepSheetFor`) | the Keep sheet (glass layer, v2 brief section 3) rises over Review (MP-10: `SlideInDown` springified with `standard`), scrim fades in; the held letter card (content layer, on the sheet) MP-03 at index 0 with its static -2 deg tilt (0 deg at accessibility sizes, `heldCardTilt`); title, words and both buttons static from frame 1 | `standard`; 280 | no travel: glass `glassEffectStyle` none to regular over `fadeMs` (never opacity on the glass), scrim and card fade `fadeMs`; Reduce Transparency: solid sheet fades | none (opening is navigation) | no lamp, no lockup animation, no price or trial animation, no pulsing See Plus, no count of what is left |
| E-M31 | `E-S10` See Plus | tap | Apple's subscription sheet (MP-11) over the Keep sheet | platform | platform | none | |
| E-M32 | `E-S10.offline` | See Plus with no connection | Apple's sheet is not opened; the offline note swaps in under the buttons (MP-06), read in order | 150 | same | none | the note is never red |
| E-M33 | `E-S10` Plus on | purchase returns active | `success` (as built); Apple's sheet closes; `/plus/confirmed` rises (MP-11); on Done the Keep sheet is gone and Review is as it was; the person taps Keep and the save runs MOTION 5e | platform; then 5e | as 5e RM | `success` once | no confetti; the letter is not kept for them (they tap Keep) |
| E-M34 | `E-S10` Keep it here for now | tap | sheet exits (MP-05, `SlideOutDown` over `exitMs`); Review closes (MP-08); Home shows the waiting card already in place; the held note toast MP-03 | 160; 280; 280 | fades | none | the waiting card does not enter or wash: it is not new to the parent |
| E-M35 | `E-S10` dismissed (VO escape, Android back, scrim) | gesture | sheet exits (MP-05); Review unchanged | 160 | fade 200 | none | |
| E-M36 | `E-S10.hold` (Plus not known yet, RT-PLS-10) | Keep while the plan status is unknown | no sheet; Review closes (MP-08); the held note toast | 280 | fade | none | never a spinner while the plan is read |
| E-M37 | `E-S11.default`, `.loading`, `.lapsed`, `.error-<code>` | Me, Plan opened (MP-09) | rows static; plan status not ready at first frame: MP-19 for the status row only; Restore MP-18; its result MP-06 | 350 then 200; 150 | same | `tap` (as built, `settings/plus.tsx:95`) | no lamp; the plan date never counts down |
| E-M38 | `E-S12.default` | purchase confirmed | native modal (MP-11); content static (a record of terms, not a moment) | platform | platform | `tap` on Save a copy and the reminder ask (as built) | no enter stagger, no wash, no success haptic here (E-M33 already gave it) |

### E-S13 Global fault, E-S14 Outage and kill switch, E-S20 Not found, E-S16 Update required, E-S18 Second account

| Id | State | Trigger | What moves | Timing | RM | Haptic | Notes and never |
|---|---|---|---|---|---|---|---|
| E-M50 | `E-S13.default` | unhandled throw, error boundary | `PlainScreen` cut in; no motion (by design: no providers) | 0 | same | none | |
| E-M51 | `E-S13` Try again, Go to Home | tap | the app mounts afresh: cold-launch rules (E-M02), lamp arrives as a first lit room | as E-M02 | as E-M02 | none | |
| E-M52 | `E-S14.offline`, `E-S14.error-outage`, `E-S14.killswitch` | sign-in or first run cannot reach the service; `serverFeaturesEnabled()` off where a screen needs it | MP-14 block; lamp underneath leaves over `lamp.leaveMs` (a problem screen is an unlit room); focus to the heading, title announced | 200; 160 | fade; lamp off at once | none | no breath, no draw-on |
| E-M53 | `E-S14.offline` to `.error-outage` (or back) | the read changes | MP-06 on title, body and icon; announced again | 150 | same | none | |
| E-M54 | `E-S14` Try again | tap | MP-18; on success the Welcome returns: block MP-05, lamp returns 280, welcome words MP-03 (no lamp arrival again; same `firstRun` key) | 160; 280 | fades | none | |
| E-M55 | `E-S20.default` | a link that leads nowhere | MP-14 | 200 | same | none | |
| E-M56 | `E-S16.default` (update required) | remote minimum version above this build | MP-14 block over everything (no lamp); Update opens the App Store (system) | 200 | same | none | no pulse on Update |
| E-M57 | `E-S18.second-account` | a different account signs in on a phone with another account's book (X4, D1) | MP-14 held block with Sign out only; nothing from the first book is drawn, not even during a transition | 200 | same | none | Sign out runs E-M12 path in reverse: modal dismiss, then first run by cut (MP-12) |

### E-S15 The system line (offline, remote pause, low storage, update available), E-S17 Low storage

One line, one at a time, in its slot in place (the design lead places it). It never covers a control and never moves a control under a finger.

| Id | State | Trigger | What moves | Timing | RM | Haptic | Notes and never |
|---|---|---|---|---|---|---|---|
| E-M40 | `E-S15.offline`, `.paused-<switch>`, `.update-available`, `E-S17.low-1gb` arrive | condition starts and holds for `systemLine.showAfterMs` (proposed 2000; offline only, so a blink of the radio shows nothing) | content below reflows (MP-13); the line fades in (MP-03 with dy 0 is not needed: use `fadeMs`); one polite announcement | `standard`; 200 | instant reflow; fade 200 | none | no slide from the top edge, no icon spin, no colour pulse |
| E-M41 | a different condition replaces the current one | priority change | MP-06 on the words; the line keeps its box | 150 | same | none | never two lines stacked |
| E-M42 | condition ends | connection back for `systemLine.hideAfterMs` (proposed 1000), pause lifted, storage freed, update installed | line MP-05, then reflow MP-13; no "back online" toast | 160; `standard` | fade; instant | none | |
| E-M43 | a remote pause hides a surface (`.paused-<switch>`, for example `killSwitches.bookSearch`, `killSwitches.photos`) | config arrives | the surface is removed at the next focus of its screen, not while the person is looking at it or pressing it; if removed in view: MP-05 then MP-13 | 160 | fade; instant | none | the pause never stops reading, export or erase (LEGAL-REQ-040 as carded) |
| E-M44 | `E-S17.low-50mb` (stop) | free space under 50 MB at a start | our Sheet (MP-10) with the plain explanation; Speak's own press already happened (MP-01) and gave its `press` haptic before the check, if the check runs after the tap | `standard` | fade | no extra haptic | never `warning` haptic; never red |

### E-S19 Interruption and recovery, E-S22 App lock, E-S21 Appearance

| Id | State | Trigger | What moves | Timing | RM | Haptic | Notes and never |
|---|---|---|---|---|---|---|---|
| E-M70 | app goes inactive or background (call, Siri, alarm, switcher) | AppState | with app lock on: `PrivacyCover` drawn at once (MP-15 on); every loop pauses (lamp breath, MP-17); nothing else moves | 0 | same | none | no fade in of the cover |
| E-M71 | app returns (warm resume) | AppState active | nothing re-enters (MOTION 5a, 5l rule 2); loops resume from where they were; VO focus returns to the same element (NS-33 Interrupted row) | 0 | same | none | no Home stagger on warm resume |
| E-M72 | `E-S19` relaunch after kill mid-flow | cold launch | E-M02, with the waiting card as the next stagger item; VO lands on Home's heading (NS-33 Killed row) | as E-M02 | as E-M02 | none | the waiting card has no wash |
| E-M73 | `E-S22.default` unlock | Face ID passes | cover fades out `fadeMs` over an already rendered room (as built) | 200 | same | none | no check mark, no haptic |
| E-M74 | `E-S22` Face ID cancelled or failed | system | lock stays; its line swaps (MP-06); focus to Unlock | 150 | same | none | no shake, no red |
| E-M75 | lock offer after first run | `lock-offer.tsx` | the card cross-fades in and out at `swapMs` (as built) | 150 | same | `success` when turned on (as built) | declining moves exactly as accepting |
| E-M76 | `E-S21` scheme change | Light, Dark or System picked | MP-26: next frame in the new scheme; lamp at its level for the scheme | 0 | same | `tap` | no whole-screen cross-fade |

### Tabs (all areas; E owns the rule)

| Id | Trigger | What moves | Timing | RM | Haptic | Never |
|---|---|---|---|---|---|---|
| E-M80 | tap Home, Book or Me | the native swap with no animation (JS tabs today, `app/(tabs)/_layout.tsx`; on native tabs with Liquid Glass the bar's selection and minimise-on-scroll are the system's, v2 brief section 3); the arriving tab's lamp starts at the light the last tab left and settles to its own over `lamp.returnMs` (`persistKey="tabs"`); Me has no lamp (it fades the light out over `lamp.leaveMs`) | 0; 280 | lamp jumps to level | none | content re-entering, a tab badge, a bounce on the icon, a sliding indicator |
| E-M81 | tap the tab already selected | the platform's scroll to top | platform | platform (UNVERIFIED that JS tabs honour RM here; check on a phone) | none | |
| E-M82 | first Book view per session | MOTION 5a: cover settles opacity 0.6 to 1, y 6 to 0 on `gentle` (area B owns) | `gentle` | one fade 200 | none | |

## 5. Loading, slow and placeholders (all areas)

Every wait falls in one of four bands. The bands are the same for every area; only area E defines them.

| Band | Wait | What the parent sees | Motion |
|---|---|---|---|
| L0 | under `loading.placeholderAfterMs` (proposed 350; NS-34 "controls usable by 350 ms") | the screen with its controls, and the region blank on paper | none (a placeholder that flashes for 100 ms is worse than none) |
| L1 | 350 ms until ready | static placeholders for the region only (MP-19), or, for a whole-screen wait, the state screen loading form (MP-14 plus MP-17) | fade in 200; content replaces by MP-06 |
| L2 | past `loading.slowLineAfterMs` (proposed 4000) | one "still working" line under the region (words: content lead) | MP-03; announced politely, at most once a minute (MP-24) |
| L3 | a network wait with no answer at about 15 s (BL row on `delete-account.tsx`, critics' L7) | the offline or error state for that region | MP-06 into the error words; busy ends |

Local reads (Home, the Book, a letter, Find) should never pass L0 on an SE 3 (NS-34, NS-37); L1 and L2 exist for network reads (plan status, sign-in, new phone, sync pulls) and for the very first open of a large book. Find never shows a spinner (NS-02 Slow row).

## 6. Area E motion for the accessibility walk and the run sheet (E-S23)

Rows to add to the device walk (BL-948, BL-984) and the SE 3 run sheet (BL-929):

1. J-N15 / NS-33-R5: with RM on, visit every E screen and state in DESIGN.md; nothing moves in a loop. Today this fails on any busy button (G-E2).
2. With LPM on: the lamp breath and MP-17 stop (fails today, G-E1).
3. Every MP-14 screen: no lamp, no breath; heading focused on arrival; announced once.
4. Wrong email code, cancelled Face ID, failed restore, offline See Plus: no shake, no red, no haptic.
5. The Keep sheet: buttons hittable on frame 1 (tap during the rise lands); under RM no travel.
6. Toasts and undo lines: with VO, the window outlives the reading (T4, NS-33-R15); with Switch Control, it stays until the parent moves on.
7. Tabs: no content re-enters; lamp never cuts to dark and back.
8. NS-34 timing: a screen change starts within 100 ms; controls usable by 350 ms; named hand-offs under `sequenceMaxMs`; the save hand-off under `hardCeilingMs`; no frame over 16.7 ms during E-M02, E-M09, E-M30 and E-M80.
9. Warm resume after a call during first run: same step, same light, no re-entry; after a kill: lands on the step's heading (first run) or Home's heading.

## 7. Proposed token additions (input to `docs/design/system/MOTION.md` and `tokens.v2.json`; none changes an existing value)

The system file decides the names; these are area E's needs.

```ts
motion: { ...existing,
  press: { scale: 0.97, cardScale: 0.98, opacity: 0.9, reducedMs: 90 },   // G-E3: the RM press dip, today typed in press.ts:46
  toast: { holdMs: 4000, dismissDy: 40, dismissVelocity: 600 },            // G-E4: toast.tsx default and swipe thresholds
  loading: { placeholderAfterMs: 350, slowLineAfterMs: 4000 },             // MP-19, section 5
  systemLine: { showAfterMs: 2000, hideAfterMs: 1000 },                    // E-M40, E-M42
}
a11y: { repeatGapMs: 60000 }                                               // MP-24, NS-33 Slow row ("once a minute")
```

Reasons and sources: `placeholderAfterMs` matches the NS-34 line "controls usable by 350 ms"; `slowLineAfterMs` 4000 is a proposal (no source read this session, UNVERIFIED; tune on the SE 3); `showAfterMs` and `hideAfterMs` are proposals to stop the line flapping on a weak signal (UNVERIFIED; tune on a phone in a lift). `RETRY_BEAT_MS` 500 (`launch.logic.ts:41`) may stay a module constant: it is a reading beat, not a motion. The welcome's 120/150/180/200 ms offsets (G-E6) should become `enter(i)` indices so they come from `staggerMs`. The 10 Nov `story` block stays proposed and unchanged, used only if BL-893 ships. Tests to add in `packages/design-tokens/test/tokens.test.ts`: `placeholderAfterMs` at most 350; every new duration under `hardCeilingMs`; `reducedMs` at most `fadeMs`.

## 8. Superseded or changed from the history specs

- FIRST-RUN-MOTION-SPEC-10nov section 3: the four-card storyboard is three cards (CTO ruling 11 Nov); card 4's month-chip wash is withdrawn. The story intro is unbuilt (BL-893).
- FIRST-RUN-MOTION-SPEC-10nov section 6, "an in-button spinner that is replaced by a static 'Working' word under Reduce Motion": kept as the target (MP-18) but it is not built; listed as G-E2.
- FIRST-RUN-MOTION-SPEC-10nov section 6, "the last card or Skip to auth entry ... `route.dissolveMs`": superseded by the built route table, where `onboarding` is a `cut` and `(auth)` is a system modal (MOTION 5l, `transitions.logic.ts:45,55`).
- MOTION.md 5k "Low Power Mode is not read": the card wins (NS-34 section 3, "stop under Reduce Motion and Low Power Mode"); listed as G-E1.
- MOTION.md 5h table of haptics lists `success` for "Save letter" only; the code also plays it on three more outcomes (MP-H). Recorded here; MOTION.md 6 needs the rows (card gap K-3).
- SOUND.md `gentle_error`: not used in area E (MP-S).

## 9. Card gaps

| # | Card row | What is missing | Proposed default |
|---|---|---|---|
| K-1 | NS-33-R5, J-N15 ("no moving loop under Reduce Motion") | Silent on busy indicators inside controls; the platform spinner is a loop | Under RM, no indicator; the label swaps to its busy words (MP-18) |
| K-2 | NS-34 section 3 (loops stop under LPM) and NS-33 Low Power row | MOTION.md 5k says LPM is not read; nothing in the code reads it | Read LPM and stop the lamp breath and MP-17 (G-E1) |
| K-3 | 00 frame section 5 ("no celebration"); MOTION 6 | Which outcomes earn `success` beyond a kept letter is not carded; the code plays it for the book opening, Plus on and app lock on | Keep those four outcomes (each is the person's own act); never on sign-in, restore or update; MOTION.md 6 table gains the three rows |
| K-4 | NS-10-R0 ("held screen ... within 10 s") | How the two actions arrive at 10 s | MP-06 into a reserved slot (E-M21) |
| K-5 | 00 frame section 5 "Slow" and "app updated between two steps" | No card says when a placeholder or a "still working" line shows, or how an update-available state looks in motion | Section 5 bands; E-M40 for update available; E-M56 for update required |
| K-6 | Every card's kill switch and pause rows (X5) | Silent on when a paused surface disappears | At the next focus of its screen, never under a finger (E-M43) |
| K-7 | NS-33-R15 (T4) vs built `Toast` | The built toast with an action never times out (stricter than T4, fine) but its action can expire first (BL-954's dead Undo) | One helper; the toast and the action expire together with MP-05 (BL-954) |

## 10. Engineering gaps

| # | Gap | Where | Backlog row |
|---|---|---|---|
| G-E1 | No Low Power Mode hook; `Breathe` and the lamp breath keep running in LPM | `lib/motion.ts` (add `useLowPowerMode`; `expo-battery` exposes it but is not installed, D-065; eng input B section 7 risk 9) | BL-984 (NS-33 floor) or a new row under bucket E |
| G-E2 | `Button` `loading` renders `ActivityIndicator` under RM (a moving loop) and the indicator has no busy words | `components/ui/button.tsx:162` | BL-984; owner design-systems (components/ui) |
| G-E3 | RM press dip duration typed as 90 | `components/motion/press.ts:46` | design-systems token task |
| G-E4 | Toast default 4000 ms and swipe thresholds 40 and 600 typed in the component | `components/ui/toast.tsx:56,90` | design-systems token task |
| G-E5 | `RETRY_BEAT_MS` 500 is a constant outside tokens | `lib/resilience/launch.logic.ts:41` | none needed (reading beat); noted only |
| G-E6 | Welcome entrance offsets 120, 150, 180, 200 typed in the screen | `app/onboarding.tsx:387-564` | design-systems token task |
| G-E7 | No placeholder component (MP-19) and no system line component (E-S15, E-M40 to E-M43) | `components/ui` | needs a row (design lead names it in DESIGN.md); BL-978 covers only the new-phone Book-level line |
| G-E8 | No update-required or update-available surface (E-S16) | none | needs a row |
| G-E9 | Splash hide fade: whether expo-splash-screen SDK 57 offers it is UNVERIFIED | `app/_layout.tsx:179` | none; keep the cut |

## 11. Reconciliation notes for the design and content leads

- `E-S09` and area C's `C-S10` are the same screen (Opening your book). E-M20 to E-M23 hold for both; area C's MOTION.md should cite them, not restate them.
- Area A's `A-S13` hands to the Keep sheet: area A owns Keep's press and the save (MOTION 5e); area E owns E-M30 to E-M36 from the first frame of the sheet.
- Area D's `D-S24` (plan date line in Me, Plan) sits inside `E-S11`: no motion beyond E-M37.
- State names used here that DESIGN.md does not yet list: `E-S01.error-launch`, `E-S03.stop`, `E-S10.hold`, `E-S15.update-available`, `E-S17.low-1gb`, `E-S17.low-50mb`, `E-S06.error-code`. The design lead's names win at the re-key pass.
- Busy words (MP-18 under RM), the "still working" line (L2), and every system line are words for the content lead; this file only times them.
