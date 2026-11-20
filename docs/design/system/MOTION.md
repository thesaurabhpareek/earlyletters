# Design system v2: Motion and transitions

Status: DRAFT v1, 20 Nov 2026. Owner: design-systems (motion lead). Brief: `docs/design/system/BRIEF.md`. Karma reconciles and commits.
Scope: the shared motion primitives, the navigation transition map, glass motion, haptics, Reduce Motion, timing caps, what never animates, performance rules, and the disposition of today's motion code and tokens. It changes no card (CR-66). It writes no code: everything to build is in "Engineering rows needed".

**This file is the standard.** It supersedes `docs/design/MOTION.md` v0.2 where they differ (section 13 lists what is kept and what is retired), and it supersedes any shared primitives table in an area file, including section 2 ("MP-nn") of `docs/design/e2e/E-foundations-and-system-states/MOTION.md`. The five area MOTION.md files (`docs/design/e2e/A-*` to `E-*`) must key every row to the primitive names in section 4 (`m.*`) and the transition ids in section 6 (`T-*`). Where an area row and this file disagree, this file wins and the area changes; where an area needs a move this file does not name, the area proposes it to this file, it does not define one. Section 4b maps area E's working ids (`MP-01` to `MP-26`) to the names here.

Conventions: `m.*` is a primitive; `T-*` a navigation transition; `H-*` a haptic; RM = Reduce Motion; RT = Reduce Transparency; IC = Increase Contrast; LPM = Low Power Mode; VO = VoiceOver. Token paths refer to `tokens.motion` in `packages/design-tokens/src/tokens.ts` (today) or to the v2 block in section 13a (proposed). **(opinion)** marks a judgement call. UNVERIFIED marks anything not read this session.

## 1. Sources read this session (20 Nov 2026)

| Id | Source | What it establishes here |
|---|---|---|
| S1 | Apple HIG, Motion (`developer.apple.com/design/human-interface-guidelines/motion`, change log to 9 Sep 2025, "Added guidance for Liquid Glass") | "Add motion purposefully"; "Make motion optional" (never the only signal); "Aim for brevity and precision in feedback animations"; "In apps, generally avoid adding motion to UI interactions that occur frequently"; "Let people cancel motion"; Liquid Glass "responds to direct touch interaction with greater emphasis"; avoid sustained oscillation near 0.2 Hz. |
| S2 | Apple HIG, Playing haptics (same site, `playing-haptics`, change log to 7 May 2024) | "Use system-provided haptic patterns according to their documented meanings"; "Use haptics consistently"; "Prefer using haptics to complement other feedback" and match intensity to the animation; "Avoid overusing haptics"; "Make haptics optional"; haptics must not disrupt the microphone. Meanings: notification success (task completed), warning, error; impact light, medium, heavy, rigid, soft (collisions of UI objects of that weight); selection (a value is changing). |
| S3 | WWDC25 session 219, Meet Liquid Glass (`developer.apple.com/videos/play/wwdc2025/219`) | Lensing; "Instead of fading, Liquid Glass objects materialize in and out by gradually modulating the light bending and lensing"; glass "responds to interaction by instantly flexing and energizing with light" and "illuminates from within", the glow spreading to nearby glass; "Liquid Glass dynamically morphs between the controls in each context"; a menu "simply pops open" from the control, "right where you just tapped"; scroll edge effects; RT makes glass frostier, IC makes it black or white with a contrasting border, "Reduced Motion decreases the intensity of some effects and disables any elastic properties"; clear glass needs a dimming layer. |
| S4 | WWDC25 session 323, Build a SwiftUI app with the new design (`developer.apple.com/videos/play/wwdc2025/323`) | Sheets "can also directly morph out of buttons that present them" (navigation zoom transition from a toolbar item); menus, alerts and popovers "flow smoothly out of liquid glass controls"; "When transitioning to a full height sheet, the glass background gradually transitions, becoming opaque"; partial sheets inset; the tab bar "can be configured to minimize on scroll" and "re-expands when scrolling in the opposite direction"; custom glass morphs need a `GlassEffectContainer` and `glassEffectID`; interactive glass reacts "by scaling, bouncing, and shimmering". |
| S5 | Expo, GlassEffect (`docs.expo.dev/versions/latest/sdk/glass-effect`; the page now shows v58.0.0, the brief read v57) | `glassEffectStyle` 'regular', 'clear', 'none', or `{ style, animate, animationDuration }` (seconds; system default if unset); "Apple does not recommend opacity values below 1 on GlassView or its parent views"; "At very low opacity, the glass effect does not render"; the documented pattern animates a wrapper's opacity only together with switching the style to 'none'; `GlassContainer` `spacing` is "the distance at which glass elements start affecting each other"; `isInteractive`; `isLiquidGlassAvailable()` ignores accessibility, so read `AccessibilityInfo.isReduceTransparencyEnabled()`; falls back to a plain View before iOS 26. |
| S6 | Expo Router, Native tabs (`docs.expo.dev/router/advanced/native-tabs`) | SDK 54 to 57: `expo-router/unstable-native-tabs`; `minimizeBehavior="onScrollDown"`; minimise and scroll-to-top need the ScrollView as the screen's first child, and do not work with `FlatList`; the tab bar height cannot be measured; bottom accessory exists (SDK 55+); on iOS 26 the bar is Liquid Glass and its colour comes from the content behind it. |
| S7 | Expo Router, Zoom transition (`docs.expo.dev/router/advanced/zoom-transition`) | `Link.AppleZoom`: alpha, iOS 18+, SDK 55+, Stack only, avoid screens with a header, "approximately 1 second" delay (upstream), plain render elsewhere; the page says nothing about Reduce Motion. |
| S8 | The brief (BRIEF.md section 1) | Material policy, glass layer list, at most three glass surfaces, RT and pre-iOS 26 fallback, iOS 27 intensity slider (press reports, UNVERIFIED by this file). |
| R1 | Repo, read this session | `docs/design/MOTION.md` v0.2, `SOUND.md`, `specs/FIRST-RUN-MOTION-SPEC-10nov.md`, `tokens.motion` (tokens.ts lines 303 to 375), `lib/motion.ts`, `lib/transitions.logic.ts`, `lib/haptics.ts`, `lib/haptics.shared.ts`, `components/motion/*`, `components/capture/listening-aura.tsx`, `components/family/join-ask.tsx`, `components/ui/{sheet,toast,button,card}.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/book.tsx`, every `haptic(` call site, and the five area MOTION.md drafts as they stood at writing. |

## 2. Principles

1. **Quick.** A move is over before the person has to wait for it. Nothing we draw runs longer than 300 ms unless section 5 names it. Springs are critically damped or nearly so: no visible bounce, no overshoot on anything that carries words (S1 brevity).
2. **Physical.** Things move the way they would if they were objects: from where they are, with momentum from the finger, back along the path they came. A sheet that rose goes down; a card that grew into a page shrinks back into the card; a swipe that is let go early settles back (S1 "realistic feedback motion that follows people's gestures").
3. **Calm.** One thing moves at a time. No loops except a real signal (the voice). No pulsing call to action, no shimmer, no bounce, no shake.
4. **Motion explains where things go, and nothing else.** Every move answers "where did it come from" or "where did it go": a letter kept goes into its month; a page comes out of its card; a sheet comes from the control that opened it. A move that explains nothing is removed.
5. **No celebration and no ceremony.** No confetti, stamps, seals, check-mark draws, glows, counters, cover openings or hold beats. A kept letter is confirmed by being where it belongs, plus one `success` haptic.
6. **Controls never animate in.** Buttons, fields and links are opaque and hittable from the first frame of every screen, sheet and state. Only content enters.
7. **Commit first, then the receipt.** No save, sign-in, purchase, delete or undo waits on an animation; the animation shows a result that has already happened.
8. **Interruptible.** Any tap or gesture lands on the end state of a move in progress; springs start from the current value; nothing blocks input (S1 "Let people cancel motion").
9. **Native first.** Tabs, pushes, sheets, alerts, menus and their Liquid Glass behaviour are the system's. We do not re-time or restyle them. Our own motion is opacity and transform on the content layer, plus three custom moves (`m.zoom`, `m.keep`, `m.pageTurn`).
10. **Glass materialises; it does not fade.** Glass appears and leaves by modulating its lensing (S3), which in Expo means animating `glassEffectStyle`, never opacity (S5). Section 7.
11. **Motion is never the only signal.** Every state a move shows is also in words, focus or an announcement (S1 "Make motion optional").

## 3. Base curves

A spring is specified as response (seconds, the perceptual duration) and damping fraction (1.0 is critically damped), with the Reanimated equivalent for mass 1: stiffness = (2 pi / response)^2, damping = 4 pi x dampingFraction / response. For the timing cap (section 5) a spring counts as its response.

| Curve | Response | Damping fraction | Reanimated (stiffness, damping, mass) | Use | Status |
|---|---|---|---|---|---|
| `spring.snappy` | 0.28 s | 1.0 | 520, 46, 1 (today's values; formula gives 504, 45) | tap feedback, selection indicator, settle after a short drag, read-together wash along a line | KEEP (`motion.snappy`) |
| `spring.standard` | 0.30 s | 0.92 | 439, 38.5, 1 | small moves, reflow, enter travel when a spring is wanted, our sheet where one remains, `m.zoom` growth, page turn arrival | UPDATE: today 0.40 s (260, 30) is over the cap; 0.30 s keeps the same feel, quicker |
| `spring.gentle` | 0.66 s | 0.95 | 90, 18, 1 | none | RETIRE: its only screen use is the Book header settle (`app/(tabs)/book.tsx:515`), which is retired (section 13) |
| `easing.standard` | cubic-bezier(0.2, 0, 0, 1) | | `STANDARD_EASING` | every timed enter, crossfade, swap | KEEP (`motion.easing`) |
| `easing.exit` | cubic-bezier(0.3, 0, 1, 1) | | new | every timed exit (things leaving accelerate away) | NEW. Material 3 "standard accelerate"; value from memory, UNVERIFIED this session; cross-check M14 of MOTION v0.2 |
| `easing.linear` | linear | | | real progress only (`m.progress` determinate), the RM fade where two screens hand off (MOTION v0.2 5f "straight lines") | KEEP (implicit today) |

Springs run with `ReduceMotion.Never` and are replaced by the RM substitute in section 8 through `useMotion()`; Reanimated's own `ReduceMotion.System` jump is never our fallback (MOTION v0.2 section 4, kept).

## 4. Primitives

Every move in the app is one of these, or a named composite of them. Values are tokens; a screen never types a number.

| Name | Use for | What moves | Curve and values | Token (section 13a) | RM substitute | Cap |
|---|---|---|---|---|---|---|
| `m.tap` | Tap feedback on every pressable content-layer surface (button, row that acts, chip, card) | scale to 0.97 (controls) or 0.98 (cards) on press-in, back on release, from the current value | `spring.snappy` | `tap.scale`, `tap.cardScale` | no scale; opacity dips to 0.9 over 90 ms and back | 280 |
| `m.tap.glass` | Tap feedback on a glass control | nothing of ours: `GlassView isInteractive` (or a system glass button) flexes and lights from within (S3, S4) | system | none | system (RM disables elasticity, S3) | system |
| `m.select` | A selection changes: choice group, segmented lens (Months, Photos, Firsts), toggle, radio, Reading Size step | the indicator moves to the new item; the label colours swap | indicator `spring.snappy`; colours `m.swap` | `swapMs` | indicator jumps; colours swap over `swapMs` | 280 |
| `m.move` | A small move inside a screen: reflow when a line is inserted or removed, an inline card expanding under a line, a field hint appearing, a block shifting a few points | layout position and size of siblings (never the text inside) | `spring.standard` via `LinearTransition` | `spring.standard` | no travel: the layout is final on the next frame; anything new uses the RM form of `m.enter` | 300 |
| `m.enter` | Content arriving: words, a line, a card, a block, a state | opacity 0 to 1, y +8 to 0 | 280 ms, `easing.standard` | `enter.dy`, `enter.ms` | opacity only over `fadeMs` 200, no travel | 280 |
| `m.enter.group` | The first content of a screen on cold launch or first show this session, and the first rows of a list's first show | `m.enter` per item, 30 ms apart, first 6 items only; item 7 on arrives with item 6 | as `m.enter` | `enter.staggerMs`, `enter.staggerMax` | one `fadeMs` fade for all, no stagger | 430 (named, section 5) |
| `m.exit` | Content or transient UI leaving: a line, an inline card, a step's words | opacity 1 to 0, y 0 to -8 (going on) or +8 (going back) | 160 ms, `easing.exit` | `exitMs` | opacity only over 160 ms | 160 |
| `m.fade` | Crossfade between two whole states or screens of the content layer; the RM form of every custom move | outgoing opacity 1 to 0, incoming 0 to 1, hand-off: the outgoing is gone by 35 percent, the incoming starts at half of that (`HAND_OFF` 0.35) | 200 ms, linear for screens of words, `easing.standard` otherwise | `fadeMs`, `handOff` | it is the RM form | 200 |
| `m.swap` | Words replaced in place in the same box: a status line, an error line, a busy label, a toast over a toast | crossfade within the box; the box does not resize during the swap (it takes the new size at the end with `m.move`) | 150 ms, `easing.standard` | `swapMs` | same | 150 |
| `m.sheet` | Present and dismiss a sheet | system sheet: rises from the bottom or morphs out of its source glass control (S4); dismiss by swipe follows the finger; glass goes opaque at full height (S4) | system | none | system reduced transition | system |
| `m.sheet.own` | Only where a native sheet cannot be used (to be listed by the components lead; target none on iOS) | sheet rises, scrim fades in | rise `spring.standard`; leave 160 ms `easing.exit`; scrim `fadeMs` | `spring.standard`, `exitMs`, `fadeMs` | no travel: glass style `none` to `regular` animated (section 7) and scrim fade `fadeMs`; under RT the solid sheet fades `fadeMs` | 300 |
| `m.glass` | Glass appearing, leaving, or changing shape: controls merging or splitting inside one `GlassContainer`, a control growing into a larger glass shape, glass appearing over a state change | glass style animates between 'none' and 'regular' or 'clear'; shapes in one container merge by proximity (`spacing`) | `animationDuration` 0.25 s; merge timing is the system's | `glass.styleS` | style change kept (lensing modulation is not travel) **(opinion)**; any position change of the glass is removed; under RT there is no glass: the solid surface uses `m.fade` and `m.move` | 250 |
| `m.push` | Page push and pop inside a stack (Me to its pages, the auth modal's steps) | system push, interactive edge-swipe pop | system | none | system | system |
| `m.cover` | Full-screen cover in and out (Listen, Review, Read together) | platform cross-dissolve of the whole screen | 280 ms | `cover.dissolveMs` (today `route.dissolveMs`) | `fadeMs` 200 | 280 |
| `m.zoom` | A letter card to its letter page, and back (composite, section 6 T-ZOOM) | the card's words carried as one block, a paper surface growing from the card to the page; the Book under a veil | as built in `CardToPage`, growth on `spring.standard`, veil 160 in and 280 out | `zoom.*` (today `cardToPage.*`, `lamp.leaveMs`, `lamp.returnMs`) | `m.fade` hand-off 200 each way | 600 (named) |
| `m.keep` | Keep: Review to the letter in its month in the Book (composite) | commit, `H-success`, Review's card moves down `keep.dy` and fades with `m.exit`; Review leaves with `m.fade`; the Book is already on the new letter, which carries `m.mark` | see section 6 T-KEEP | `keep.*` (today `file.*`) | chip and line fade `fadeMs`, Review fades, mark static then fades | 600 to the Book (named) |
| `m.mark` | The new letter's place in the Book after Keep; a restored span after Put it back | an `accentSoft` tint behind the words fades out | 1600 ms, `easing.standard` | `markMs` (today `newMarkMs`) | tint shown static, then fades the same way (a fade of a tint is not travel) | 1600 (named) |
| `m.pageTurn` | Read together: next and previous letter (composite) | leaving page x -24 over 160 with its words gone early; arriving page from +24 on `spring.standard`; a swipe follows the finger | `pageTurn.dx`, `exitMs`, `spring.standard`, `spring.snappy` for settle-back | `pageTurn.dx`, `swipe.*` | `m.fade` 200; no finger follow | 300 |
| `m.list.insert` | A row appears in a list that is on screen (a letter kept while the Book is visible, Undo of a delete) | the new row `m.enter`; rows below `m.move` to make room | as parts | as parts | the row fades `fadeMs`; the others are in place on the next frame | 300 |
| `m.list.remove` | A row leaves a list on screen (delete, hide, quiet) | the row `m.exit` (opacity only, no slide); rows below `m.move` up after it is gone | as parts | as parts | the row fades `exitMs`; the gap closes on the next frame | 300 |
| `m.progress` | Real, measured progress (export, a download with a size) | a bar's fill by `scaleX` from the left; each new reading eases to its value | 200 ms `easing.linear` per update; never faster near the end | `progress.settleMs` | the fill jumps to each value; the words carry the state | per update 200 |
| `m.progress.wait` | Work with no measurable progress (the book coming down to a new phone; a busy button) | inside a button: the system activity indicator; in a block: a thin bar sweep | system indicator; sweep 1400 ms loop, `easing.standard` | `progress.sweepMs` | no loop at all: the busy words stand still (MP-18 target in area E) | loop (named) |
| `m.signal` | The listening aura: the only continuous motion, because it follows the voice | scale and opacity of a pre-drawn glow from metered level, per frame with `dt` | `motion.breath.*`, idle breath `breathIdleMs` | `signal.*` (today `breath.*`) | static ring, opacity steps at most once per 400 ms with 200 ms fades | loop (named) |
| `m.follow` | Read together: the word wash along a line and the line-follow scroll | wash x and width on `spring.snappy`; line change fades 80 out and in; scroll keeps the line at 40 percent | `highlight.*`; scroll 450 ms `easing.standard` | `follow.*` (today `highlight.*`) | wash jumps; scroll pages at 75 percent to 25 percent | 450 (named) |
| `m.instant` | Recording state changes; the privacy cover going on; scheme change; text size change | nothing: the next frame is the new state | 0 | none | same | 0 |
| `m.step` | A step to the next inside one screen (composite, T-STEP) | words `m.exit`, then the next words `m.enter`; controls stay | 160 then 280 | `exitMs`, `enter.*` | fade out 200, fade in 200 | each part under the cap (440 total, two moves) |
| `m.draw` | A line drawing drawn once, first run only | `strokeDashoffset` per stroke | 1200 ms, pen ease | `drawMs` | drawn complete | 1200 (named) |
| `m.minimize` | Tab bar minimise on scroll (Book only, section 6) | system | system (S4, S6) | none | system | system |
| `m.toast` | The undo toast (glass) in and out (composite) | in: glass style 'none' to 'regular' (`m.glass`) while the toast rises 8 pt on `spring.snappy` and its words `m.enter`; out: words `m.exit`, glass to 'none', then unmount; a new toast over a toast: words `m.swap`, the glass stays | as parts | `glass.styleS`, `toast.*` | no travel; glass style change and word fades only; under RT a solid toast fades `fadeMs` | 280 |

### 4a. Composite moves are recipes, not new curves

`m.zoom`, `m.keep`, `m.pageTurn`, `m.toast`, `m.list.*` are built from the primitives above and live as plans in `lib/transitions.logic.ts` (as `CARD_TO_PAGE`, `fileIntoMonthPlan`, `pageTurnPlan` do today). An area that needs a new composite proposes it here.

### 4b. Key from area E working ids to system names

| Area E id | System name |
|---|---|
| MP-01, MP-02 | `m.tap` (glass controls: `m.tap.glass`) |
| MP-03 | `m.enter`; with stagger, `m.enter.group` |
| MP-04, MP-05 | `m.exit` |
| MP-06 | `m.swap` |
| MP-07 | `m.step` (section 6, T-STEP) = `m.exit` then `m.enter` |
| MP-08 | `m.cover` |
| MP-09 | `m.push` |
| MP-10 | `m.sheet` (native target); `m.sheet.own` while `ui/sheet.tsx` remains |
| MP-11 | `m.sheet` (system modal) |
| MP-12 | `m.instant` (route `cut`) |
| MP-13 | `m.move` |
| MP-14 | `m.fade` (a block arriving whole) |
| MP-15 | cover on: `m.instant`; unlock: `m.fade` |
| MP-16 | lamp moves, section 10 (pending FOUNDATIONS disposition of the lamp) |
| MP-17 | RETIRED (`Breathe`), section 13 |
| MP-18 | `m.progress.wait` (in a button) with `m.swap` for the busy words |
| MP-19 | placeholder: `m.fade` after `loading.placeholderAfterMs`; never a loop |
| MP-20 | `m.mark` |
| MP-21 | `m.draw` (section 5, first run only) |
| MP-22 | `m.zoom`, `m.keep`, `m.pageTurn`, `m.signal`, `m.follow` |
| MP-23 | `m.toast` (timing: `toast.*`, T4 through the undo helper) |
| MP-24 | not motion (announcement and focus); unchanged |
| MP-25 | finger follow inside `m.pageTurn`, `m.sheet`, `m.toast`; settle `spring.snappy` |
| MP-26 | `m.instant` |
| MP-H | section 9 (`H-*`) |

## 5. Timing caps

- **The cap: 300 ms** for any single move we draw (a spring counts as its response). Token `motion.capMs` 300, tested (section 13a).
- **Sequences:** a composite settles within `sequenceMaxMs`, which drops from 900 to **600** ms. `hardCeilingMs` 2000 stays as the absolute ceiling for anything, including named exceptions that end in a still state.
- **Recording state changes are immediate (`m.instant`).** Ready to recording, recording to paused, paused to recording, recording to stopped, and every recording error: the control, its label, its colour and the elapsed time change on the frame the recorder reports the new state. No fade, no morph, no glass animation (`animate: false`). The aura (`m.signal`) may follow the voice; the state itself never eases.
- **System motion is exempt** from our caps (tabs, push, sheets, alerts, menus, glass morph timing, tab bar minimise): we do not re-time it.
- **Named exceptions (the complete list):**

| Name | Length | Why it may exceed 300 ms | Condition |
|---|---|---|---|
| `m.enter.group` | 280 + 5 x 30 = 430 ms to the last item | each item is under the cap; the stagger tells reading order | cold launch or first show per session only; never on a return or a tab switch |
| `m.zoom` | up to 600 ms to settled (hold 136, growth on `spring.standard`, content in from 60 percent) | the move explains where the page came from and returns there | interruptible; RM, no measured card, or a column mismatch: `m.fade` |
| `m.keep` | up to 600 ms from commit to the Book | it shows where the letter went | tap anywhere lands on the Book at once |
| `m.mark` | 1600 ms | a tint fading behind still words; nothing travels | once per kept or restored letter |
| `m.follow` scroll | 450 ms | a long scroll at the speed of reading; shorter reads as a jump | only while the voice plays; a drag suspends it |
| `m.signal` | continuous | follows a real signal | only while recording or listening |
| `m.progress.wait` sweep | 1400 ms loop | indeterminate work | off under RM and LPM |
| `m.draw` | 1200 ms | a line drawing drawn once in first run | first run only, once per install, never on a problem screen, never for a milestone; off under RM |
| lamp arrive (if the lamp is kept) | 1200 ms | the first light of a cold launch | once per cold launch; section 10 |

Anything else over 300 ms is a defect.

## 6. Navigation transition map

Ids are stable; areas key to them. "Return" is always the reverse of the way in, interactive where the system allows it.

| Id | Transition | Where (area screen ids) | Presentation | Motion in | Return | RM | Haptic |
|---|---|---|---|---|---|---|---|
| T-TAB | Tab switch, Home, Book, Me | the three tab roots | native tabs (`expo-router/unstable-native-tabs` in SDK 57) | system: no animation of content; the glass selection moves within the bar (system) | same | same | none |
| T-MIN | Tab bar minimise on scroll | Book (B-S01) and its lens lists only; never Home (the capture cluster and the bar must stay put) and never Me | `minimizeBehavior="onScrollDown"` (S6) | system; re-expands on scroll up (S4) | system | system | none |
| T-PUSH | Push and pop | Me to its pages; settings sub-pages; auth steps inside the auth modal (E-S04 to E-S06) | native stack push | `m.push` | edge swipe or Back | system reduced transition | none |
| T-SHEET | Modal sheet | Whose book (A-S02), Day sheet (A-S08, B-S09), From (A-S09), Go to a month (B-S07), Who can read it (B-S10), Hide until (B-S13), the Keep gate (E-S10), invites, sign in (E-S04 as a modal) | native sheet with detents (`formSheet`), glass background from the system, inset at partial height, opaque at full height (S4) | `m.sheet`; from a glass toolbar or Book header button, the sheet morphs out of that button where the platform supports it (S4; RN support UNVERIFIED, row ENG-M5) | swipe down follows the finger; Done; the sheet returns into its source | system | none (opening is navigation) |
| T-MENU | Button to menu or popover | Book header "More for this book" (B-S02), letter page actions, any overflow | native menu (UIMenu-backed) | system: the bubble opens out of the button (S3) | tap outside; system | system | none from us (the system plays its own on long press) |
| T-ALERT | Confirmation | Let it go (A-S11), Delete (B-S15), Open now (B-S14), replace picture (A-S12) | native alert or action sheet, originating from the control (S4) | system | system | system | `H-warning` only after a destructive choice is confirmed |
| T-COVER | Full-screen cover | Listen (A-S04, A-S05), Review (A-S07), Read together (B-S19) | `fullScreenModal`, `animation: 'fade'` | `m.cover` 280 | `m.cover` 280; no swipe-down dismiss while recording | `m.fade` 200 | record start and stop are `H-press` inside Listen, never on the transition |
| T-ZOOM | Letter card to letter page | Book card (B-S01, B-S04, B-S05) and Home's past letter (B-S17) to the letter page (B-S08) | `transparentModal`, `animation: 'none'`; `CardToPage` draws the move (`m.zoom`) | press held through `cardToPage.holdMs`; veil 160; paper grows on `spring.standard`; words carried whole; the rest of the page `m.enter` from 60 percent | Back or swipe: words carried back into the card if it is still on screen (re-measured), else `m.fade` | `m.fade` hand-off both ways | none |
| T-KEEP | Keep, Review to the Book | A-S07 to A-S13 to B-S01 | composite `m.keep` | t=0 commit; t=0 `H-success`; t=0 "Kept in Month N" line `m.enter`; t=120 card moves down `keep.dy` 24 and `m.exit`; t=400 Review `m.fade`; t=600 the Book is on the new letter (already in place, no `m.list.insert`), `m.mark` starts | n/a | line `m.fade`, Review `m.fade` at 400, mark static then fades | `H-success` once, at commit |
| T-GATE | Keep when the allowance is used | A-S07 to E-S10 | `T-SHEET` | `m.sheet`; content static except the held letter card `m.enter` | swipe down, Keep it here for now | system | none |
| T-STEP | A step to the next inside one screen | first run (E-S02, E-S03, E-S08), consent steps (E-S07), a sheet's next page | in-screen | `m.step`: words `m.exit` 160 then next words `m.enter` 280 (440 total; each part under the cap); controls stay | Back: same, travel reversed | `m.fade` out then in | none (Continue and Back are navigation) |
| T-PAGE | Read together next and previous | B-S19 | in-screen | `m.pageTurn` | same reversed | `m.fade` | none |
| T-LOCK | App lock | E-S22 | overlay | cover on: `m.instant` (privacy); unlock: `m.fade` 200 to a room already rendered (no content re-enters) | n/a | same | none (Face ID is the system's) |
| T-LAUNCH | Cold launch | E-S01 to Home or first run | root | splash to a matched first frame (`m.instant`); then `m.enter.group` on content only | n/a | one `m.fade` | none |
| T-RESUME | Warm resume, return from any cover, tab return | everywhere | n/a | nothing re-enters | n/a | same | none |
| T-SYSLINE | System line in place (offline, pause, update, storage) | E-S15, E-S17 | in-screen | line `m.enter`, content below `m.move` | line `m.exit`, then `m.move` | line fades, layout instant | none |

Rules for the map:
- **Only the screen that moves owns the move.** A route uses one presentation from `routeTransitions` (`lib/transitions.logic.ts`), never a screen-local option.
- **Two screens of words are never on top of each other** mid-move (`HAND_OFF` 0.35, kept).
- **Content never re-enters on a return** (MOTION v0.2 5l rule 2, kept).
- **Zoom choice (decided here):** `m.zoom` stays the measured-rect `CardToPage` on both platforms. Expo's `Link.AppleZoom` is not adopted: it is alpha, adds about a second of delay, must avoid headers, and scales a snapshot, which would scale a letter's words (section 11 forbids it) (S7). Revisit only when it leaves alpha and can carry the words unscaled.

## 7. Glass motion

These rules apply to every `GlassView`, every `GlassContainer` and every system glass surface. The material policy (which surfaces are glass) is the brief's section 3 and FOUNDATIONS.

1. **Never animate a glass view's opacity, or any ancestor's opacity, below 1.** Apple does not recommend it and at very low opacity glass does not render (S5). To show glass, mount it with `glassEffectStyle: 'none'` and set `{ style: 'regular', animate: true, animationDuration: glass.styleS }`; to hide it, set `{ style: 'none', animate: true, animationDuration: glass.styleS }` and unmount after that duration (or, only once the style is 'none', set the wrapper's opacity to 0, the Expo-documented pattern, iOS 26.1+ per S5). This is how glass "materializes in and out" (S3).
2. **Content on glass fades; glass does not.** The words and icons on a glass surface use `m.enter`, `m.exit` and `m.swap` as on any surface; the glass under them uses rule 1.
3. **Morph only inside one `GlassContainer`.** Shapes that should merge or split (the Home capture cluster: Speak, Type, Start from a photo; the Book header controls) live in one container with `spacing` set to the cluster's gap token from FOUNDATIONS, so the system merges them as they approach (S4, S5). No morph across containers. Never glass inside glass, including mid-morph.
4. **Moving glass moves by transform** of the container or by the system. We never animate a glass view's width, height or corner radius per frame from JS; size changes come from the container's merge or from layout settling once (`m.move`).
5. **Interactive glass gets the system's touch response, not ours.** A glass control sets `isInteractive` (or is a system glass button) and does not also run `m.tap`: the glass flexes and lights from the touch point (S3, S4). A content-layer control keeps `m.tap`.
6. **Sheets are the system's.** Native sheets carry their own glass, inset at partial height and turn opaque as they reach full height (S4). We set no custom sheet background, so we never animate one.
7. **Clear glass over a picture** (Review photo, letter page photo, Photos lens viewer) keeps its 35 percent dim layer static; when the picture changes the dim does not animate, the picture crossfades under it with `m.fade`.
8. **At most three glass surfaces on screen** at any frame, counting both ends of a morph. A toast that would make four waits for a glass surface to leave, or takes the place of the one it replaces (`m.swap`).
9. **Reduce Motion:** the system already reduces glass intensity and removes elasticity (S3). We keep rule 1's style animation (it is optical, not travel) **(opinion; check on device, row ENG-M9)** and drop every position change of glass.
10. **Reduce Transparency, or iOS before 26:** there is no glass. The same shape is a solid token surface with a hairline (brief section 3), which may use `m.fade` and `m.move` like any surface. Read `AccessibilityInfo.isReduceTransparencyEnabled()` and listen for changes; `isLiquidGlassAvailable()` does not report it (S5).
11. **Increase Contrast:** no motion change; borders and labels step up (FOUNDATIONS).
12. **Recording:** the recording control becomes glass while recording (brief section 3) with `animate: false` (section 5, recording is immediate).
13. **Tab bar:** native tabs only; minimise on scroll only where T-MIN says. Minimise needs the scroll view as the screen's first child and does not work with `FlatList` (S6), so the Book's list must meet that or minimise stays off (row ENG-M3). The tab bar's height cannot be measured (S6): nothing of ours animates in step with it.
14. **The iOS 27 intensity slider** (brief section 1, UNVERIFIED here): our glass motion must read the same at both ends; nothing of ours compensates for it.

## 8. Reduce Motion

One mechanism (kept from MOTION v0.2 section 4): `useMotion()` and `useReducedMotion()` (which subscribes to `reduceMotionChanged`) in `lib/motion.ts`; no screen reads the setting. Under RM, movement becomes opacity, decoration stops, and nothing that carries meaning jumps.

| Primitive | Normal | Reduce Motion |
|---|---|---|
| `m.tap` | scale 0.97 or 0.98, `spring.snappy` | opacity 0.9 dip over 90 ms (`tap.rmMs`) |
| `m.tap.glass` | system | system |
| `m.select` | indicator springs | indicator jumps; colours `m.swap` 150 |
| `m.move` | `spring.standard` | none (final layout next frame) |
| `m.enter`, `m.enter.group` | fade + 8 pt, 280, stagger | fade 200, no travel, no stagger |
| `m.exit` | fade + 8 pt, 160 | fade 160 |
| `m.fade` | 200 | 200 (it is the substitute) |
| `m.swap` | 150 | 150 |
| `m.sheet`, `m.push`, `m.minimize`, T-MENU, T-ALERT | system | system reduced transition |
| `m.sheet.own` | rise on `spring.standard` | glass style animation and scrim fade 200, no travel; RT: solid sheet fade 200 |
| `m.glass` | style 0.25 s, system morph | style 0.25 s kept, no glass travel |
| `m.cover` | 280 dissolve | 200 |
| `m.zoom` | carry and grow | `m.fade` hand-off 200 each way |
| `m.keep` | move and fade, 600 | line fade 200, Review fade at 400, mark static then fades |
| `m.mark` | 1600 tint fade | same tint, shown static, then the same fade |
| `m.pageTurn` | slide 24 pt with finger follow | `m.fade` 200, no follow |
| `m.list.insert`, `m.list.remove` | row enter or exit + `m.move` | row fade; neighbours jump |
| `m.progress` | eases to each value | jumps to each value |
| `m.progress.wait` | indicator or sweep | none: static busy words |
| `m.signal` | aura follows the voice | static ring, opacity steps (at most one per 400 ms) |
| `m.follow` | wash slides, scroll 450 | wash jumps, scroll pages |
| `m.toast` | glass materialises, rises 8 pt | glass materialises, no rise |
| `m.draw` | 1200 draw | drawn complete |
| `m.instant` | 0 | 0 |

LPM: every loop (`m.progress.wait` sweep, lamp breath if kept) stops under LPM as under RM (card NS-34 section 3 as cited by area E). Reading LPM needs a dependency decision (`expo-battery`, D-065; row ENG-M8).

## 9. Haptics vocabulary

Policy (kept and tightened): **a haptic marks an outcome the person caused, never a navigation, never a system state, and never plays on scroll.** It always accompanies a visible change (S2 "complement other feedback"). Patterns keep Apple's documented meanings (S2). One wrapper, `haptic(intent)` in `lib/haptics.ts`; lint bans `expo-haptics` elsewhere (as built). Throttle: `tap`, `press`, `soft` at most one per 100 ms; `success` and `warning` never dropped (as built).

| Id | Intent (code) | iOS generator | Apple meaning (S2) | Plays for | Android (as built) |
|---|---|---|---|---|---|
| H-select | `tap` | `UISelectionFeedbackGenerator.selectionChanged` | a value is changing | a choice picked in a choice group or segmented lens; Reading Size step; playback speed step; Put it back; Undo | `Segment_Tick` |
| H-press | `press` | `UIImpactFeedbackGenerator(.light)` | collision of small, light UI objects | record start (before the audio session activates) and record stop (after it ends); Speak and Type when they start a capture | `Context_Click` |
| H-soft | `soft` | `UIImpactFeedbackGenerator(.soft)` | collision of soft, flexible UI objects | "Not much today" accepted; a custom long-press that is not a native menu | `Long_Press` |
| H-success | `success` | `UINotificationFeedbackGenerator.success` | a task completed | a letter kept (the commit); an export finished; joined a book (invite accepted, the joiner's device) | `Confirm` |
| H-warning | `warning` | `UINotificationFeedbackGenerator.warning` | a warning of some kind | a destructive act confirmed: Let it go, Delete, Erase, Delete account, Leave a book | `Reject` |
| (none) | `error` | `UINotificationFeedbackGenerator.error` | an error occurred | not in the vocabulary. Errors are shown in words, not felt. Added only if SOUND.md's opt-in `gentle_error` ships, and then only for a failure the person can fix now | (none) |

Never a haptic for: scroll (any), tab switch, tab bar minimise, push, pop, sheet present or dismiss, menu open (the system plays its own on a native long-press menu; never double it), toast appearing, glass morph, page turn, progress updates, Continue, Back, Close, Skip, sign-in success, Plus purchase (StoreKit's sheet is the system's), app lock on or unlock, any error, offline, outage, pause or update state. Never `medium`, `heavy` or `rigid`. **Never while recording** (the microphone would hear it, and iOS mutes the Taptic Engine while recording by default; S2 "don't disrupt the microphone"), and never while a letter is playing. System components (switches, pickers, date wheels, sliders, pull to refresh, context menus) play their own haptics; we never add ours on top.

Today's call sites outside this table (from `grep haptic(` this session) are listed in row ENG-M10 for removal: `success` on account and settings saves (`settings/account.tsx`, `settings/children/[id].tsx`, `settings/children/hidden.tsx`), on delete-account and open-deletion completions (a destructive outcome takes `warning` at confirm, not `success` after), on app lock turned on (`settings/app-lock.tsx`, `lock-offer.tsx`), on Plus turned on (`plus-gate.tsx`), on a new invite created (`invite/new.tsx`), on first-run finish (`onboarding.tsx`) and on adding a child (`add-child-form.tsx`). Each is a setting or a commerce or setup step, not a kept memory; one `success` per kept letter keeps its meaning (S2 "Use haptics consistently"). `press` on starting an export (`settings/export.tsx`) becomes none (the finish is the outcome).

## 10. The lamp (pending FOUNDATIONS)

Whether the lamp light survives v2 is FOUNDATIONS' and AUDIT's call (atmosphere). If it is kept, its motion is: leave 160 (`lamp.leaveMs`) when an unlit cover comes over it, return 280 (`lamp.returnMs`), tab settle 280, arrive 1200 once per cold launch (named exception), opacity only, never on a screen that records, plays, sells or reports a problem, off under RM and RT. **The lamp breath (9 s loop) is retired** **(proposal, Karma rules)**: it is a decorative loop, against principle 3 (loops only for a real signal, which MOTION v0.2's own principle 1 already says). If the founder keeps the breath, it is a named exception that stops under RM, LPM, unfocused, background and under a sheet.

## 11. What never animates

- **The words of a letter.** No typing, no per-word or per-line reveal, no scaling, no blur, no font-size animation, no reflow animation of the text, no colour animation of the words. A letter's words may only move as one whole block with their surface (`m.zoom` carry, `m.pageTurn`, scrolling), and may only appear or leave with that block (`m.enter`, `m.fade`). The read-together wash and `m.mark` are tints behind the words, not the words. Live words while recording (if shown) appear per batch with `m.swap`, no stagger, no travel, so nothing reads as the app writing (constitution). This retires MOTION v0.2 5c's per-word rise.
- **Counts and numbers.** No ticking, rolling or counting up of any number: letter counts, months, ages, elapsed time, storage, prices, trial days. A number changes on the next frame (`m.instant`).
- **Streaks, badges, points, milestones** (they do not exist; nothing may be built to celebrate them). MOTION v0.2 5h (milestone drawings) is retired.
- **Celebrations and ceremony:** confetti, check marks drawing, stamps, seals, glows, pulses, shakes, flashes, cover openings, hold beats, sound with motion.
- **Calls to action:** no pulse, glow, breath or bounce on Speak, Type, See Plus, Update, Try again, Sign in, Continue.
- **Errors and system states:** no shake, red flash, banner sliding from an edge, or bounce. They arrive like any content (`m.enter`, `m.swap`).
- **Recording state** (section 5): immediate.
- **Text size, Reading Size, theme, Increase Contrast, Bold Text:** the next frame is the new state; Reading Size crossfades text with `m.swap` and never animates font size (kept from MOTION v0.2 5i).
- **Glass opacity** (section 7 rule 1).
- **Controls on arrival** (principle 6).
- **Photographs:** no Ken Burns, parallax, zoom or blur-up (kept from MOTION v0.2 benchmark; areas A and B agree).

## 12. Performance rules

1. **UI thread.** Every animation runs in Reanimated 4 worklets or as a native or system animation; JS only sets targets. Never `setState` per frame; never a JS-driven `Animated` loop.
2. **Transform and opacity only**, plus the named exceptions already built: the read-together wash `width`, the `m.zoom` paper's frame and corner radius (a childless surface). Never animate font size, a text block's size, shadows, Android `elevation`, blur, gradients per frame, or a `GlassView`'s opacity or size.
3. **No layout thrash.** `m.move` uses Reanimated layout transitions once per change; no `onLayout` to state to layout loops during a move; measure before the move (as `CardSource` does on touch-down), never during it.
4. **Frame rate.** 120 fps on ProMotion (`CADisableMinimumFrameDurationOnPhone` true, as built in `app.config.ts`), 60 fps elsewhere; every smoothing uses `dt`, never frame counts. No frame over 8.3 ms on ProMotion or 16.7 ms on 60 Hz during any primitive, measured on an iPhone SE (3rd gen) and the oldest physical iPhone on iOS 26 the team has (row ENG-M11).
5. **One loop on screen at most.** Cancel on blur, background, under a sheet, under RM and LPM.
6. **Glass cost.** At most three glass surfaces (brief); one `GlassContainer` per cluster; no glass in list cells (content layer anyway); never glass during a list's scroll-linked animation.
7. **Nothing decodes during recording.** Before record start: Listen's picture (if any) is decoded and on screen, fonts and icons are loaded, the aura's glow image is decoded. While recording: no image decode, no font load, no route mount, no list render, no Lottie or SVG path parse, no layout transition, no glass morph; the aura is the only animation. Sync, analytics flushes and prefetch wait until the take ends (owner: mobile, row ENG-M12).
8. **No animation library beyond what is installed.** Reanimated, react-native-svg, `expo-glass-effect`; no Lottie, Rive or Skia for UI motion (MOTION v0.2 section 9 recommendation kept).
9. **Web preview:** as MOTION v0.2 9b (stock entering presets on web only), kept.

## 13. Mapping from today's motion to the v2 primitives

| Today (file or token) | What it does | Disposition | v2 name and change |
|---|---|---|---|
| `components/motion/press.ts` `usePressScale`, `PressHoldContext` | press scale 0.97 or 0.98 on snappy; RM opacity dip; card press held into the page | KEEP, UPDATE | `m.tap`. Skip on glass controls (`m.tap.glass`); 90 ms RM dip typed at line 46 becomes `tap.rmMs` |
| `components/motion/card-transition.tsx` `CardSource`, `CardText`, `CardToPage`, `useCardToPagePhase`, `useHiddenBehindCardPage` | card grows into the letter page, words carried | KEEP | `m.zoom` (T-ZOOM). Retimed by `spring.standard` 0.30 s; its tests in `transitions.test.ts` rerun on the new spring; the lamp veil timing stays as tokens `zoom.veilInMs` 160, `zoom.veilOutMs` 280 even if the lamp goes |
| `components/motion/excerpt-fade.tsx`, `.logic.ts` | static fade at the end of an excerpt | KEEP | not motion; relocate to `components/ui` **(opinion)** so `components/motion` holds only motion |
| `components/motion/page-turn.tsx` `PageTurn` | read-together page turn with finger follow | KEEP | `m.pageTurn` (T-PAGE), on the new `spring.standard` |
| `components/motion/draw-on.tsx` `DrawOnPath`, `DrawOnStrokes` | strokes draw once over 1200 | UPDATE | `m.draw`: default `animate={false}` (static); animated only in first run, once per install; never on a problem screen; milestone use retired |
| `components/motion/breathe.tsx` `Breathe` (used by `ui/empty-state.tsx`, `ui/state-screen.tsx`) | 8 s opacity loop on an empty-state drawing | RETIRE (proposal) | none: empty and state screens are still. A decorative loop with no signal (principle 3) |
| `components/capture/listening-aura.tsx` | glow from the voice level | KEEP | `m.signal`; tokens renamed `signal.*` |
| `lib/motion.ts` `useMotion`, `useReducedMotion`, `springConfig`, `layoutSpring`, `useSheetMotion`, `useRouteTransitions` | the one motion API | KEEP, UPDATE | export the `m.*` names (for example `motion.enter(i)`, `motion.exit()`, `motion.swap()`, `motion.move()`); add `useReduceTransparency()`, `useLowPowerMode()`, `glassStyle(show)` |
| `lib/transitions.logic.ts` `ROUTES`, `routeTransitions` | route presentation table | KEEP, UPDATE | T-* ids added to rows; `(auth)`, `invite`, `plus/confirmed` and every `ui/sheet.tsx` use move to native `formSheet` (T-SHEET) |
| `fileIntoMonthPlan` | the saved moment, about 1.1 s | UPDATE | `m.keep` (T-KEEP), 600 ms to the Book |
| `stepMotion` | first-run step change | KEEP | `m.step` (T-STEP) |
| `pageTurnPlan`, `swipeOutcome`, `SWIPE`, `HAND_OFF` | page turn plan and thresholds | KEEP | `m.pageTurn`, `swipe.*`, `handOff` |
| `sheetMotion` and `components/ui/sheet.tsx` (@gorhom/bottom-sheet) | our sheet on `standard` | UPDATE, then RETIRE on iOS | native sheets (`m.sheet`); `m.sheet.own` only where the components lead lists a need |
| `components/ui/toast.tsx` | toast enter, exit, swap, swipe; 4000 ms and 40 pt, 600 pt/s typed | UPDATE | `m.toast` on glass (rule 1, never opacity); `toast.holdMs`, `toast.dismissDy`, `toast.dismissVelocity` tokens |
| `components/ui/button.tsx` `loading` (`ActivityIndicator`, spins under RM) | busy control | UPDATE | `m.progress.wait`: no indicator under RM, static busy words (area E G-E2) |
| `components/family/join-ask.tsx` `WaitingBar` (`SWEEP_MS` 1400 typed) | indeterminate sweep | UPDATE | `m.progress.wait` sweep with `progress.sweepMs`; off under RM and LPM |
| `components/family/join-ask.tsx` `JoinedCover`, `BookCover` opening (`cover.holdMs` 300, `cover.dx` 8) | the cover holds then opens to the flyleaf | RETIRE | ceremony: the cover arrives with `m.enter`, already open where the flyleaf is the content |
| `app/(tabs)/book.tsx` `Settle` (header 0.6 to 1, up 6 on `gentle`) | first Book view per session | RETIRE | the Book renders complete; first rows may use `m.enter.group` on cold launch only |
| `app/onboarding.tsx` welcome `enterAt` offsets 120, 150, 180, 200 (typed) | welcome stagger | UPDATE | `m.enter.group` with `enter.staggerMs` |
| `app/(tabs)/_layout.tsx` JS tabs | paper tab bar | UPDATE | native tabs (T-TAB), Liquid Glass; T-MIN on Book only |
| `lib/haptics.ts`, `haptics.shared.ts` | five intents | KEEP, UPDATE | section 9; call sites in ENG-M10 trimmed |
| `ui/lamp.tsx` `Lamp`, `useUnlitRoom`, `lamp.*` | lamp light and its moves | pending FOUNDATIONS | section 10; breath RETIRE (proposal) |
| Token `snappy` | | KEEP | `spring.snappy` |
| Token `standard` | 0.40 s | UPDATE | `spring.standard` 0.30 s (439, 38.5) |
| Token `gentle` | | RETIRE | none |
| Tokens `fadeMs`, `exitMs`, `enter`, `easing`, `staggerMs`, `staggerMax`, `swapMs`, `hardCeilingMs` | | KEEP | same values; `easing` becomes `easing.standard` |
| Token `reduceMotion { type, durationMs }` | duplicate of `fadeMs` | RETIRE | `fadeMs` |
| Token `sequenceMaxMs` 900 | | UPDATE | 600 |
| Token `newMarkMs` | | KEEP (rename) | `markMs` |
| Token `file` | | UPDATE (rename) | `keep` |
| Token `cardToPage` | | KEEP (rename) | `zoom` |
| Token `route.dissolveMs` | | KEEP (rename) | `cover.dissolveMs` (the old `cover` block, the book-cover opening, is retired, so the name is free) |
| Token `cover` (book cover opening) | | RETIRE | none |
| Token `emptyBreathMs` | | RETIRE | none (with `Breathe`) |
| Token `drawMs` | | KEEP | `m.draw` |
| Token `breath`, `breathIdleMs` | | KEEP (rename) | `signal.*` |
| Token `highlight` | | KEEP (rename) | `follow.*` |
| Token `press` | | KEEP (rename) | `tap.*`, plus `rmMs` 90 |
| Token `lamp` | | pending FOUNDATIONS | section 10; `breathMs`, `breathOpacityMin` retire (proposal) |

### 13a. Proposed motion block for `tokens.v2.json` (for the foundations lead to fold in)

```
motion: {
  capMs: 300, sequenceMaxMs: 600, hardCeilingMs: 2000,
  spring: {
    snappy:   { response: 0.28, dampingFraction: 1.0,  stiffness: 520, damping: 46,   mass: 1 },
    standard: { response: 0.30, dampingFraction: 0.92, stiffness: 439, damping: 38.5, mass: 1 }
  },
  easing: { standard: [0.2, 0, 0, 1], exit: [0.3, 0, 1, 1] },
  tap: { scale: 0.97, cardScale: 0.98, rmOpacity: 0.9, rmMs: 90 },
  enter: { dy: 8, ms: 280, staggerMs: 30, staggerMax: 6 },
  exitMs: 160, fadeMs: 200, swapMs: 150, handOff: 0.35,
  glass: { styleS: 0.25 },
  cover: { dissolveMs: 280 },
  zoom: { contentFrom: 0.6, holdMs: 136, clearPt: 24, veilInMs: 160, veilOutMs: 280, capMs: 600 },
  keep: { lineAtMs: 0, moveAtMs: 120, dy: 24, leaveAtMs: 400, bookAtMs: 600 },
  markMs: 1600,
  pageTurn: { dx: 24 },
  swipe: { fraction: 0.25, velocity: 600 },
  toast: { holdMs: 4000, rise: 8, dismissDy: 40, dismissVelocity: 600 },
  progress: { settleMs: 200, sweepMs: 1400 },
  loading: { placeholderAfterMs: 350, slowLineAfterMs: 4000 },
  systemLine: { showAfterMs: 2000, hideAfterMs: 1000 },
  drawMs: 1200,
  signal: { dbFloor: -55, dbCeil: -10, gamma: 0.6, attackMs: 80, releaseMs: 400, scaleMax: 0.18,
            opacityMin: 0.18, opacityMax: 0.4, idleAfterMs: 600, idleScale: 0.05, idleMs: 7500 },
  follow: { leadMs: 50, minDwellMs: 120, lineAnchor: 0.4, followResumeMs: 4000, scrollMs: 450 }
}
```
`toast`, `loading` and `systemLine` values are area E's proposals (its section 7), adopted under these names; `loading.slowLineAfterMs`, `systemLine.*` remain proposals to tune on device. Tests to keep or add in `packages/design-tokens/test/tokens.test.ts`: every spring's response and every timed value at or under `capMs` unless listed in a `namedExceptions` array that mirrors section 5; every spring's damping fraction at least 0.9; `stiffness` and `damping` within 5 percent of the response formula; composites (`keep.bookAtMs`, `zoom.capMs`) at or under `sequenceMaxMs`; nothing over `hardCeilingMs`.

## 14. UNVERIFIED and open questions

UNVERIFIED: `easing.exit` value (M3 standard accelerate, from memory); whether `react-native-screens` in SDK 57 can present a native sheet that morphs out of a glass header button (S4 describes SwiftUI's navigation zoom source); which native menu component the components lead picks (UIMenu-backed); Android behaviour of native `formSheet`; whether `glassEffectStyle` animation is reduced by the system under RM; iOS 27 intensity slider (press reports via the brief); the iOS-mutes-haptics-while-recording behaviour (from MOTION v0.2, not re-read); the expo-glass-effect page now documents SDK 58, and its SDK 57 behaviour is assumed identical.

Open, with recommendations:
1. Lamp breath and `Breathe`: retire (recommended) or keep as named loops? Karma, with the founder if the lamp is in scope.
2. `spring.standard` 0.40 to 0.30 s: retunes `m.zoom` and every sheet we still draw; recommend yes, with the `transitions.test.ts` timelines re-run and a device check of the card-to-page carry at 0.30.
3. `success` trimmed to three outcomes (section 9): recommend yes; area E records the extra call sites as card gap K-3 and must follow this table.

## Engineering rows needed

Proposed backlog rows. Owner `design systems` unless marked `mobile`. Each lands with tests; none changes a card.

| Row | What | Owner | Depends on |
|---|---|---|---|
| ENG-M1 | `tokens.motion` v2 block (section 13a) with renames, `standard` to 0.30 s, `sequenceMaxMs` 600, `gentle`, `reduceMotion`, `cover` (book), `emptyBreathMs` removed; tests for the cap, named exceptions and the spring formula; `dist/` CSS regenerated | design systems | FOUNDATIONS `tokens.v2.json` |
| ENG-M2 | `lib/motion.ts` exposes the `m.*` primitives and `glassStyle(show)`; adds `useReduceTransparency()` (subscribes to changes); one lint rule: no `withSpring`, `withTiming`, `FadeIn*` or `Layout*` outside `components/motion`, `components/ui` and `lib/motion.ts` without a token | design systems | ENG-M1 |
| ENG-M3 | Native tabs (`expo-router/unstable-native-tabs`) replacing JS tabs; T-MIN on the Book only, which needs the Book's list as a first-child ScrollView or a supported list (S6); device spike first (COMPONENT_LIBRARY 0.1) | mobile | FOUNDATIONS tab icons (SF Symbols) |
| ENG-M4 | `GlassSurface` wrapper over `GlassView`: style-only show and hide (section 7 rule 1), `isInteractive` for controls (no `m.tap`), RT and pre-26 solid fallback, IC borders; a test that no glass ancestor has opacity below 1 | design systems | COMPONENTS glass catalogue |
| ENG-M5 | Native sheets (`formSheet` with detents) for every T-SHEET row; spike: morph out of a glass header button; list any sheet that must stay `m.sheet.own` | mobile with design systems | ENG-M4 |
| ENG-M6 | `m.keep` timeline (`keep.*`) replacing `fileIntoMonthPlan`; `m.zoom` and `m.pageTurn` re-run on the new `spring.standard`; `transitions.test.ts` updated | mobile | ENG-M1 |
| ENG-M7 | `m.toast` on glass (style, never opacity), tokens for hold and swipe; at most three glass surfaces enforced in `ToastHost` | design systems | ENG-M4 |
| ENG-M8 | `useLowPowerMode()` (needs a dependency decision, `expo-battery`, D-065); every loop stops under LPM | design systems | Karma on D-065 |
| ENG-M9 | Device check under RM, RT, IC and both themes for every glass primitive; record whether the system already suppresses `glassEffectStyle` animation under RM | design systems | ENG-M4 |
| ENG-M10 | Haptics trimmed to section 9: remove `success` from `settings/account.tsx`, `settings/children/[id].tsx`, `settings/children/hidden.tsx`, `settings/delete-account.tsx` (keep its `warning` at confirm), `components/settings/open-deletion.tsx`, `settings/app-lock.tsx`, `components/app-lock/lock-offer.tsx`, `components/child/plus-gate.tsx`, `invite/new.tsx`, `onboarding.tsx`, `components/child/add-child-form.tsx`; remove `press` from `settings/export.tsx` start; a test listing every allowed call site | mobile | none |
| ENG-M11 | Frame budget runs (SE 3rd gen and the oldest iOS 26 phone) for every primitive and T-row; results in the QA sheet | mobile | ENG-M3 to ENG-M7 |
| ENG-M12 | Recording quiet period: decode Listen's picture, glow image and fonts before record start; defer sync, analytics flush and prefetch until the take ends; a test that no layout transition or glass morph is scheduled while recording | mobile | none |
| ENG-M13 | Retirements: `Breathe` (if ruled), Book `Settle`, cover opening (`cover.holdMs`), milestone draw; `DrawOnStrokes` default `animate={false}`; `Button` `loading` static under RM; `WaitingBar` tokenised and off under RM and LPM; welcome `enterAt` offsets to `m.enter.group` | design systems | ENG-M1 |
| ENG-M14 | Live words while recording (if shown) appear per batch with `m.swap`, no per-word rise or stagger | mobile | ENG-M2 |
| ENG-M15 | `REFERENCE.html` motion section: every `m.*` and T-row playable, with RM, RT, IC, dark and AX5 toggles | design systems (components, with motion) | this file |

## Retired

This file retires, from `docs/design/MOTION.md` v0.2 and the code it describes:
- 5a "the child's-name cover settles" on the first Book view (`Settle` on `gentle`); Tonight naming (now Home).
- 5c per-word rise of live words (now `m.swap` per batch).
- 5e timings (`file.chipAtMs` 250, `file.moveAtMs` 550, `file.scale` 0.9, the 900 ms sequence and about 1.1 s to the Book); replaced by `m.keep`.
- 5h milestones (first letter, 100 letters, first grandparent letter) and their line drawings: counting and ceremony.
- 5i "JS tabs today", and `ui/sheet.tsx` as the default sheet (native sheets now).
- 5j empty-state breath (`Breathe`, `emptyBreathMs`), proposal pending Karma.
- 5k lamp breath (`lamp.breathMs`, `breathOpacityMin`), proposal pending Karma and FOUNDATIONS; the rest of 5k and 5l rule 1 wait on FOUNDATIONS.
- The `gentle` spring, the `reduceMotion` token, the book-cover opening (`cover.holdMs`, `cover.dx`, S08 and `JoinedCover`), and `sequenceMaxMs` 900.
- Section 6 haptics table where it conflicts with section 9 here (the `success` call sites in ENG-M10).
- Section 8 "Expo Router Link.AppleZoom: iOS enhancement after SDK 58 test": decided against for now (section 6 zoom choice).
- From `docs/design/specs/FIRST-RUN-MOTION-SPEC-10nov.md`: the `success` haptic at first-run finish (none), the cover hold, the story card 4 column (already withdrawn 11 Nov); its card motions key to `m.step`, `m.enter`, `m.draw` and `m.progress`, and its progress bar is the one linear clock (`m.progress`), kept.
- From `docs/design/e2e/E-foundations-and-system-states/MOTION.md`: section 2 as a primitives table (now input only; its ids map through section 4b) and its law 1 list of named exceptions (replaced by section 5 here). Its gaps G-E1 to G-E6 are carried in ENG-M8, ENG-M13, section 13a and ENG-M7.

Kept from MOTION v0.2 without change: principles 2 to 6 (folded into section 2), the RM mechanism (v0.2 section 4, here section 8), 5b listening glow (`m.signal`), 5d review underlines and Put it back (on `m.move`, `m.swap`, `m.mark`), 5f card to page (`m.zoom`), 5g read together (`m.follow`), 5l rules 2 to 6, 5m page turn, sections 7, 9 and 9b (folded into section 12).
