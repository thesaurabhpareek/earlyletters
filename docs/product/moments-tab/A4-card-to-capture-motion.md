# Moments tab: card to capture motion (A4)

Status: PROPOSED, 21 Nov 2026. Author: animation lead A4 of 5. Branch `wip/moments-a4`. Docs only. Nothing here is built. Nothing here has been seen on a device or a simulator.

Where this doc disagrees with another doc it says so and marks it **RECONCILE**. It does not change a ruling by itself.

## 1. Purpose and scope

A parent sees a moment card (a day of photos, a typed occasion, a written prompt, a year ago from our own letters). They tap it. They land in capture, to talk or to write, with the photo or the occasion already there. This doc says how that move feels: what travels, how long, on which curve, what happens if they let go halfway, what the photo does while they record, how they come back, and what each motion does under Reduce Motion.

In scope:
- the tap on a card (or its compose button) and the arrival in capture (talk and write);
- whether a shared-element style carry of the photo is feasible in Expo SDK 57 with Reanimated and Expo Router, and what is verified;
- timings, curves, interruption, the swipe-down and back gesture;
- the photo while recording or typing;
- the return after Keep, and the return when the parent leaves without keeping;
- Reduce Motion for every motion, the 120 Hz budget, the content rules.

Out of scope: the card's own motion in the tab (A1), the tab switch and cold launch (A1, transition leads), the permission flow, the day card layout (design concept), words (content), how the photo is stored (feasibility, privacy). Other animation leads A2, A3 and A5 have their own scopes; where a duration clashes, `tokens.motion` wins.

The shape of this doc follows the founder's direction: do what the screenshots do in a smarter way. For this move, "smarter" means the photo is simply there when you arrive, and nothing flies, bounces or counts. Early Letters has one idea Apple-style pickers do not: the parent's own words are the product, so the photo is company for the words and never the star.

## 2. Inputs read

Read this session, in a clone of `develop` (nothing from the founder's screenshots was opened or copied):

| Input | Path or id | Used for |
|---|---|---|
| Brief of record | `/home/claude/moments-brief.md` | scope, constitution, privacy, reversals |
| A1 motion principles | branch `wip/moments-a1`, `docs/product/moments-tab/A1-motion-principles.md` (380 lines, whole) | six rules, allowed list, R13 (card to capture is the platform's), R1 to R24 |
| Design language v2 | `docs/design/DESIGN-LANGUAGE-V2-21nov.md` (rules, 4.6, glass limits, D-098 iOS 17.0) | glass limits, `motion.heroEnter`, `glassFallback`, minimum iOS |
| Motion system | `docs/design/MOTION.md` (sections 5b, 5e, 5f, 5l route table, 7 performance, 8 shared-element state) | tokens, route table rows 1 to 5, 120 Hz rule, the measured-rect transition |
| Tokens | `packages/design-tokens/src/tokens.ts` `motion` block | every number below |
| Versions | `apps/mobile/package.json`: expo ~57.0.26, expo-router ~57.0.24, react-native 0.86.3, react-native-reanimated 4.5.1, react-native-screens ~4.26.0, react-native-worklets 0.10.1 | feasibility |
| Reanimated shared element docs | https://docs.swmansion.com/react-native-reanimated/docs/shared-element-transitions/overview (fetched this session, summarising tool) | feasibility |
| Expo zoom transition docs | https://docs.expo.dev/router/advanced/zoom-transition/ (fetched this session, summarising tool) | feasibility |
| Other wip branches | `git ls-remote` shows `wip/moments-a1` to `a3`, `d1` to `d5`, `p1` to `p5`. I read A1 only | scope edges |

Not read, so not relied on: the Moments concept, feasibility and privacy docs, PR #1264, A2, A3, A5, SOUND.md, the capture screen source. **Assumptions:** (a) a day card has one compose control that starts capture, and the card body opens the same; (b) capture has two modes, talk (route `listen`) and write (route `write`), as in MOTION 5l rows 1 to 3; (c) the photo or occasion is handed over as a reference the parent already chose (a picked photo, a Limited-access photo, or a typed occasion). Reconcile in section 9 if the concept doc differs.

## 3. The move in one picture

Plain words, as a parent would feel it:

1. I press the card. It dips a touch, like paper under a finger.
2. Capture rises (write) or the room dissolves in (talk). It is the same rise or dissolve as the rest of the app. Nothing grows out of the card.
3. The photo is already on the page in its place, small and still, with the date or the occasion I typed beside it. I did not wait for it.
4. I talk or type. The photo does not move, glow or react to my voice.
5. I keep it. The existing saved moment plays (MOTION 5e). I land where the app already sends me (section 8), and the card I came from shows, quietly, that a letter is there.

If I change my mind, I swipe down or press the close control. The card is exactly where I left it, the list has not moved, and nothing says I did not finish.

## 4. Feasibility: can the photo travel as a shared element?

### 4.1 What is VERIFIED this session (read, with source)

| Fact | Source |
|---|---|
| Reanimated shared element transitions are "on by default" from Reanimated 4.8 and newer. For 4.2 to 4.7 there is "an experimental version behind" the feature flag `ENABLE_SHARED_ELEMENT_TRANSITIONS`. | Reanimated docs page above, via the fetch summary |
| iOS and Android are supported. Web is not: shared views appear in place with no transition. | same |
| On Android, `react-native-screens` 4.28 or newer is advised; older versions "can crash at startup". | same |
| The page's example uses a native stack navigator. The page says a separate "Screens and boundaries" page covers stacks, tabs, nested navigators and modals. **That page and the "Limitations and troubleshooting" page were not read.** | same |
| Expo Router `Link.AppleZoom` and `Link.AppleZoomTarget`: iOS only, iOS 18 or later, SDK 55 and later. The API is alpha and "subject to breaking changes". | Expo zoom docs above, via the fetch summary |
| The zoom transition works with `fullScreenModal`. `usePreventZoomTransitionDismissal` has no effect on modal screens. It works only in the router's built-in Stack, wants a `Link` with `asChild`, and the page advises against using it on screens with a header. Open and dismiss can take about 1 second (an upstream `react-native-screens` issue). | same |
| The Expo page does not mention Reduce Motion. | same |
| This repo pins Reanimated 4.5.1, react-native-screens ~4.26.0 and worklets 0.10.1. | `apps/mobile/package.json` |
| The repo's own record (MOTION section 8, "verified 2026-10-01") says Reanimated `sharedTransitionTag` was experimental behind the flag, native stack only, no tabs, "not recommended for production", "Not in v1". It rates `Link.AppleZoom` alpha, iOS 18 and later, "iOS enhancement after SDK 58 test", and records an SDK 57 bug where the source card freezes if the list scrolls during dismiss. The measured-rect transition (5f) is "v1 default". | `docs/design/MOTION.md` section 8 |
| The measured-rect transition is built in the repo: `CardSource`, `CardText`, `CardToPage` in `components/motion/card-transition.tsx`, with `CARD_TO_PAGE` in `lib/transitions.logic.ts`, tested ms by ms. | `docs/design/MOTION.md` 5f and the intro |

### 4.2 What this means (my reading, not a source)

- **Reanimated 4.8 changed the story since the repo's note.** The repo is on 4.5.1, so the experimental flag path applies to us today. Moving to 4.8 or newer removes the flag, but it is a dependency upgrade across Reanimated, worklets and react-native-screens that the SDK 57 line may not allow. **UNVERIFIED:** whether Reanimated 4.8 is compatible with Expo SDK 57 and RN 0.86.3. Read the compatibility table first. MOTION section 8 should be re-checked against the 4.8 docs; its "not recommended for production" line is dated 1 Oct 2026 and may be stale for 4.8 and later (**RECONCILE**, owner: design systems).
- **The Moments tab sits inside tabs, and capture is a modal.** The repo record says native stack only, no tabs. Whether a shared tag can cross from a tab screen to a modal on the root stack is exactly what the unread "Screens and boundaries" page covers. **UNVERIFIED, so no requirement may depend on it.**
- **`Link.AppleZoom` is iOS 18 and later, alpha.** D-098 sets the minimum at iOS 17.0, so iOS 17 gets a plain fallback in any case. Alpha status and the freeze bug mean it is not a v1 path. It also zooms the whole card, which is the "card growing into a page" look A1 asked us not to use here (A1 R13).
- **The measured-rect transition (5f) is the only path we already own on both platforms.** It carries words today. Carrying a photo thumbnail is the same mechanism with an image instead of words. It needs a transparent modal with `animation: 'none'`, which is a different route presentation from the `write` rise and the `listen` dissolve. That is a real cost: it changes the route table row and its tests.

### 4.3 Decision (PROPOSED)

| Option | What the parent sees | Cost | Verdict |
|---|---|---|---|
| A. Platform transition, photo is there on arrival | The platform rise or the dissolve. The photo is already in place in capture, from the same cached thumbnail, so there is no flash and no wait. | None new. Uses `routeTransitions` rows `write` and `listen`. Matches A1 R13. | **v1 default** |
| B. Measured-rect carry of the photo only | The card's photo lifts and settles into capture's photo slot. | New route presentation for capture from Moments, new carry component, a bound on the card's frame. Needs device proof. | Spike after v1; ship only if it passes the gate |
| C. Reanimated shared tag | The photo flies natively. | Version upgrade, flag, tab-to-modal behaviour unread. | Not proposed. Re-open only after the unread docs are read and a device spike passes |
| D. `Link.AppleZoom` | The card zooms into capture. | Alpha, iOS 18 plus, freeze bug, grows a card into a page | Not proposed for this move |

The founder asked for a premium feel. Option A is premium in the way a paper object is: it is calm, instant, and never in the way. B is offered because a photo that lands in its place is a nice finishing touch, and the parent's words are not moved by it. It must earn its place by passing the gate in section 10.

## 5. Motion spec table

All numbers are existing tokens unless marked NEW. No duration is typed in a screen; screens read `useMotion()` and `useRouteTransitions()`. Every spring has a damping ratio of at least 0.9 (existing token test), so nothing overshoots or bounces. "RM" is Reduce Motion. "Test" layers: U unit, C component, E device or simulator run, S source scan, R review.

| # | Trigger | From | To | Duration | Curve | RM variant | Test |
|---|---|---|---|---|---|---|---|
| M1 | Finger down on card | card at rest | card scale 0.98, opacity up to 0.9 | until released, settles about 250 ms | `snappy` | opacity only, no scale | C |
| M2 | Finger down on compose button | button at rest | button scale 0.97; the card does not scale | as M1 | `snappy` | opacity only | C |
| M3 | Release, mode write | Moments tab | capture (write) | the platform's rise; we set no number | platform | the platform's own reduced form; if none, `fadeMs` 200 | E, C (route row) |
| M4 | Release, mode talk | Moments tab | capture (talk) | `route.dissolveMs` 280 | table `listen`: `fullScreenModal`, fade | `fadeMs` 200 | U, C |
| M5 | Capture mounts | no photo | photo present in its slot from the first frame | 0 (no entrance) | none | none | C (photo opaque at t=0) |
| M6 | Capture mounts, words block | none | prompt or occasion line and the input or mic in place | content enters at most with `enter` (dy 8, 280 ms), controls never | `easing` | 200 ms fade, no dy | C |
| M7 | Lamp on arrival | none | room light for `write`, as in table | `lamp.arriveMs` 1200 for first lit room, else `returnMs` 280 | linear | lamp still, final state | C |
| M8 | Recording starts | photo at rest | photo at rest (no change) | 0 | none | none | C, S |
| M9 | Keyboard opens in write | photo at full slot | photo at compact size (see 6.4), words never reflowed by the motion | `standard` layout move, about 400 ms | `LinearTransition` on `standard` | instant | C, E |
| M10 | Option B only: release | card photo rect | capture photo slot | NEW `motion.momentCarry.durationMs`, proposed 320, under the 420 single-move cap | `easing` (bezier [0.2, 0, 0, 1]) | none; M3 or M4 applies | U, E |
| M11 | Swipe down on write | capture | follows finger | follows finger | native | native | E |
| M12 | Release of a swipe | partial position | back to capture, or on to the tab | native, interruptible | native | native | E |
| M13 | Close control pressed | capture | Moments tab, scroll kept | same as M3 or M4 reversed | platform or `route.dissolveMs` | `fadeMs` | C, E |
| M14 | Keep pressed | capture | the saved moment | `fileIntoMonthPlan()` up to `sequenceMaxMs` 900 | as MOTION 5e | as 5e | U (existing) |
| M15 | Return lands (section 8) | route out | Moments tab with scroll and part kept | per 5a and 5l | per table | `fadeMs` | C, E |
| M16 | Return, the source card | card without a letter mark | same card with a static mark that a letter is attached | `fadeMs` 200, in place, only if the card is on screen at the time | linear | same (opacity only) | C |
| M17 | Photo fails to load in capture | placeholder | stays placeholder | none | none | none | C |

## 6. Design

### 6.1 The tap

**MT-A4-R1. The card answers the finger and then gets out of the way.**
As a parent with a baby on one arm I want the card to feel pressed and then I want to be in capture.
Given a moment card. When I put a finger on it, or on its compose button. Then it takes the press feedback tokens (card 0.98 or control 0.97, on `snappy`) at once, and no motion waits for a server, a library read or a decode before it starts.
Test: C (press scale values from `tokens.motion.press`), S (no raw scale value in the card).

**MT-A4-R2. A double tap opens one capture.**
Given a card. When I tap twice quickly, or tap the card and its compose button together. Then capture opens once, carrying one photo or occasion, and the second tap does nothing and does not queue a second route.
Test: C (route push called once; the guard is keyed on the route, not a timer), E.

**MT-A4-R3. Talk or write, one rule.**
Given a card whose compose control starts capture. When I tap it. Then it opens the mode the parent last used on Home (**UNVERIFIED** that Home stores this; if not, the default is the one Home's primary control opens), and capture offers the other mode in one tap on arrival. Talk uses the table's `listen` dissolve, write uses the `write` rise.
Test: C (route name per mode), R. Open question Q1.

### 6.2 The arrival

**MT-A4-R4. The platform makes the move; the photo is just there.**
As a parent I want to start talking, not watch an effect.
Given I release a tap on a card. When capture opens (v1, option A). Then the move is the route table's own (`write`: platform rise; `listen`: `route.dissolveMs` 280, fade), no part of the card grows into the page, and the photo is rendered in capture's photo slot from the first frame, from the same thumbnail the card used, at the slot's final size. There is no placeholder flash, no fade-in of the photo, and no layout shift.
Test: C (photo node opaque and at final frame on first render), E (device, slow-mo capture), R. **RECONCILE** with A1 R13: this keeps it.

**MT-A4-R5. The photo needs no network and no wait.**
Given the card's thumbnail is in memory. When capture mounts. Then the photo is the same decoded image. Given it is not (cold, evicted). Then the slot shows the paper-tone placeholder at final size and the image fades in over `fadeMs` (200 ms), as in A1 R8, and nothing else on the screen moves when it arrives. No shimmer.
Test: C (height equal before and after), S (no shimmer).

**MT-A4-R6. The words are in place before the parent needs them.**
Given the card carried a typed occasion or one of our written prompts. When capture opens. Then that line is on the page in its own place, as static text, with no typing effect, no reveal word by word and no cross-fade between a card version and a page version. Content may enter with `enter` (dy 8, 280 ms) on cold paths only, and no control ever enters (A1 R4).
Test: C, S (no typewriter, no `withSequence` on text), R.

**MT-A4-R7. Nothing is carried that the parent did not choose.**
Given the card was made from a library moment. When capture opens. Then only the photo or photos the parent tapped, and a label they typed or chose, are shown. No machine title, caption, place or person guess appears, and none animates in. (Constitution.)
Test: R with content and privacy, S.

**MT-A4-R8. Option B, if built, carries one thing and is calm.**
Given option B passes the gate (section 10). When the parent releases a tap, motion is on, and the card's photo rect was measured on touch-down. Then the photo alone moves from the card's rect to capture's photo slot over `momentCarry.durationMs` (proposed 320 ms) on `easing`, the page's words and controls are present and still, the leaving tab fades with the table's veil (`lamp.leaveMs` 160), nothing is scaled past its final size, and no spring overshoots. Given no measured rect, another column or type size, a changed scroll, or Reduce Motion. Then option A applies and nothing else changes.
Test: U (a timeline in `transitions.logic.ts`, stepped ms by ms like `CARD_TO_PAGE`), E (device), R. **RECONCILE** with the transition leads: it needs a route table row.

**MT-A4-R9. Reduce Motion: no flight, no rise.**
Given Reduce Motion is on, also if it turns on while the app is open. When I release a tap. Then nothing slides, scales or flies. The move is the table's reduced form (one `fadeMs` 200 ms each way). The photo is in place from the first frame. The lamp is still.
Test: C (set the flag, assert no transform style on any element in the move), S (no direct `AccessibilityInfo` read in these screens; components read `useMotion()`), E (toggle live).

### 6.3 Interruption, swipe down and back

**MT-A4-R10. Every motion can be interrupted and lands honestly.**
Given a move is playing. When the parent taps, swipes or presses close. Then springs start from the current value, nothing snaps back to the start, a tap during the rise lands on the end state, and no input is blocked for more than the move's own length (never over 420 ms for one move).
Test: C, E (tap at 50 ms and at 200 ms into the move).

**MT-A4-R11. Swipe down follows the finger, and the words are safe.**
Given write capture (the platform sheet). When I drag down. Then the sheet follows my finger natively. If I have typed or recorded anything, release past the edge asks me what to do using the app's existing guard for leaving capture (**UNVERIFIED**: what that guard is today; read the capture screen before build), and my words are never lost by an accidental swipe. If I have not, it just closes. A swipe is never the only way out: the close control does the same.
Test: E (swipe with text, swipe without), C (guard present), R.

**MT-A4-R12. Talk has no swipe, and a clear way out.**
Given talk capture (`fullScreenModal`, fade, no swipe-to-dismiss). When I want to leave. Then the close control and the existing "Let it go" are present from the first frame, and the dissolve back is the table's `route.dissolveMs` (280 ms).
Test: C, E.

**MT-A4-R13. A back swipe from the edge does not strand me.**
Given I started a letter from a card. When I use the edge back gesture, the hardware back (Android, later) or the system dismiss. Then I return to the Moments tab at the same scroll position and the same part (For you or Recent), with no entrance replay, the source card unchanged, and no message that I did not finish. (A1 R9.)
Test: C (scroll offset equal before and after), E.

**MT-A4-R14. The list does not jump after capture.**
Given I come back by any route. When the tab shows again. Then the content on screen keeps its position, no card is added or removed above the viewport in a way that shifts it, and nothing animates in except the single in-place mark in M16.
Test: C (anchor logic), E (a library change during capture).

### 6.4 The photo while I talk or write

**MT-A4-R15. While recording, the photo is still company.**
As a parent I want the photo to help me remember, not to perform.
Given talk capture with a photo. When recording starts, runs and ends. Then the photo stays at one size and one place, with no zoom, pan, Ken Burns, parallax, crossfade between photos, video autoplay, glow, pulse or reaction to my voice. It sits clear of the listening glow, which belongs to the mic (MOTION 5b). It takes no glass, no blur and no shadow animation.
Test: S (no `withRepeat`, no scale or translate on the image, no blur), C, R.

**MT-A4-R16. Several photos or a video are a quiet, static set.**
Given the card carried more than one photo, or a video. When capture is open. Then they sit as a still strip. Moving between them is the parent's own swipe or tap and each change is an instant swap or a `swapMs` 150 ms cross-fade, never a slide or auto-advance. A video shows its length as static text and does not play unless the parent presses play (and, if built, that play control is the platform's).
Test: S, C, R. No number counts up. Where a count is a plain fact (the length of a clip), it is static text.

**MT-A4-R17. In write, the photo makes room and never covers words.**
Given write capture. When the keyboard opens, or text grows past the visible area, or Dynamic Type is at AX5, or the phone is an iPhone SE 3 (375 by 667 pt). Then the photo goes to its compact size (the one tall enough for a 44 pt target to expand it), the move is a layout move on `standard` (about 400 ms, no overshoot) or instant under Reduce Motion, the words and the caret are never covered, letter text is never truncated or clipped, and font size never animates. Tapping the photo opens it full size with the platform's own viewer or a plain cross-fade; it does not grow out of place.
Test: E (SE 3, AX5, Bold Text), C, R. (D-027.)

**MT-A4-R18. If the photo cannot be shown, the letter still works.**
Given the photo was deleted, is in the cloud and not on the phone, or the permission changed to Limited and the photo is no longer allowed. When capture opens or is open. Then the slot shows a plain static paper placeholder with a short plain line (words by content), no spinner, no shake, no red, and recording and writing work as normal. Nothing in the move changes. Text is not the only signal; the placeholder has a label for VoiceOver.
Test: C, E (delete a photo, change the permission, mid-session).

### 6.5 The return

**MT-A4-R19. Keep is the one celebration, and it is the existing one.**
Given I press Keep. When the letter is committed. Then the saved moment (MOTION 5e) plays as it does everywhere else, the `success` haptic plays (existing, owned by the save flow), and nothing new is added for letters that began on Moments: no confetti, no sound, no count, no "your Nth letter", no badge, no ring. We celebrate what exists, in the parent's own words and photo.
Test: U (existing `fileIntoMonthPlan()` unchanged), S (no counter or badge), R.

**MT-A4-R20. Where I land after Keep.**
Given a letter begun from a Moments card. When the saved moment ends. Then the app lands where MOTION 5a and row 5 say (the Book, on the new letter, its lamp returning). Given the parent then opens the Moments tab. Then the source card shows a static mark that a letter is attached to it (words by content), appearing in place over `fadeMs` (200 ms) only if the card is on screen at that moment, and with no motion at all if it is not.
**RECONCILE** (open question Q2): the brief asks for a "return to the tab after save". MOTION 5a and 5l row 5 land on the Book. Returning to the tab where the parent started is arguably calmer for a daily-return loop. Changing it is a transition-lead and founder decision; this doc does not change the ruling. If the ruling changes, the same `fileIntoMonthPlan()` timeline applies and the landing is Moments with M16, and the Book's arrival wash does not play.
Test: C (landing route), E.

**MT-A4-R21. No gaps, no nagging.**
Given a card whose letter was not kept, or a photo not used. When I return. Then nothing records, shows or animates that I did not finish: no "unfinished" mark, no shake, no pulse, no reminder dot, no "pick up where you left off" banner, no count of cards left. A card with no letter is just a card.
Test: S (no unread or unfinished state read by the card), R. This protects "celebrate what exists, never count gaps".

### 6.6 Accessibility, performance and privacy

**MT-A4-R22. VoiceOver and focus through the move.**
Given VoiceOver is on. When the parent opens capture, closes it, or keeps. Then the card announces one plain action ("Write a letter" or "Talk", words by content), capture is modal (`accessibilityViewIsModal`, `aria-modal`) while it is up, the tab behind hides from the accessibility tree and takes no touches (as `useHiddenBehindCardPage()` does for 5f), focus moves to capture's heading or its first control when it has arrived, the photo has a label the parent chose or a plain neutral one (never a guess of what is in it), any carried copy of the photo is hidden, and on return focus goes to the card it came from.
Test: C (accessibility tree), E (VoiceOver pass on device).

**MT-A4-R23. Every motion here has a non-motion form.**
Given Reduce Motion, Reduce Transparency or Increase Contrast. When any row of section 5 would play. Then the form in the RM column is used, our own glass controls take the solid `glassFallback`, the lamp is off, and no motion depends on blur. Motion never carries meaning alone: the kept mark in M16 is also text.
Test: C, E (simulator and device), R. (A-NFR, WCAG 2.2 AA, HIG Motion per DESIGN-LANGUAGE-V2.)

**MT-A4-R24. 60 and 120 Hz budget.**
Given an iPhone SE 3 (60 Hz) and a ProMotion phone (up to 120 Hz). When the move runs, including the press, the rise or dissolve, M9 and, if built, M10. Then continuous motion runs on the UI thread, only transform and opacity animate (the layout move in M9 is the one MOTION 7 exception), no frame exceeds 16.7 ms on the SE 3 (the existing gate) and the target on a 120 Hz phone is 8.3 ms, `CADisableMinimumFrameDurationOnPhone = true` is set (MOTION 7 rule 4) and all smoothing uses `dt`. The photo is decoded at its display size, once, before the tap if the card shows it, and never at full resolution on the main path.
Test: E (device frame capture on both; a simulator number is not device evidence). **UNVERIFIED** until measured. I will not state a measured frame time; none exists.

**MT-A4-R25. Privacy of the move.**
Given a log, a crash report or an analytics event. When the move plays, fails or is interrupted. Then nothing records a photo, filename, album, place, date, or the child's name. Motion flags stay on the device. No analytics event is added for the move. The card-to-capture hand-off passes a reference held in memory, never a path or an identifier in a route parameter that could reach a log (**UNVERIFIED**: how the router logs params; check before build).
Test: S (allowlist unchanged), R with privacy.

## 7. Timings, curves and why

| Move | Time | Why |
|---|---|---|
| Press | about 250 ms, `snappy` | already the app's feel |
| Talk arrival | 280 ms, fade | the table's `route.dissolveMs`; a voice room does not slide |
| Write arrival | the platform's rise | native first (MOTION principle 4); we add no number |
| Photo (option A) | 0 ms | nothing to wait for |
| Photo carry (option B) | 320 ms proposed, bezier [0.2, 0, 0, 1] | inside the 420 ms single-move cap and 900 ms sequence ceiling; a guess to be tuned on a device (Q5) |
| Photo compact on keyboard | about 400 ms, `standard` | existing layout move |
| Return mark | 200 ms, linear opacity | `fadeMs` |
| Saved moment | up to 900 ms | existing, not ours to change |

Curves: timed moves use the one `easing` bezier; layout moves use `standard`; press uses `snappy`. A fade is linear opacity. No new spring. Exits are quicker than entries (`exitMs` 160). A cross-fade of two screens of words never shows both above a quarter of their strength (the MOTION hand-off rule).

Proposed tokens (to design systems, with their tests, in `packages/design-tokens/src/tokens.ts`): `motion.momentCarry: { durationMs }` and a `routeTransitions` row `capture-from-moment`, both only if option B proceeds. Nothing else is new.

## 8. Edge and unhappy paths

- **Library permission changes while capture is open (iOS Limited, Settings):** the photo may no longer be allowed. R18 holds. Capture does not close and no motion plays.
- **App goes to the background while recording:** the move does not replay on return. Loops stop on background (MOTION 7 rule 5). Safety of the recording is the capture owner's, not this doc's.
- **Phone call or system sheet interrupts:** nothing of ours moves behind a system alert.
- **Low memory:** the thumbnail may be dropped; R5 placeholder applies; no spinner.
- **Slow device or slow decode:** the press feedback still plays at once (R1). If the route cannot present within a frame budget, it presents without the carry (option A), never later with it.
- **Card scrolled or its data changed between touch-down and release:** the measured rect is stale; option B is skipped (R8), option A plays.
- **Rotation (iPad later) or another column width:** option B is skipped; option A plays.
- **Route A (Apple's system picker):** the sheet is Apple's. We write no motion over it. When it closes and the parent chooses a photo, capture opens as in option A and the photo appears as in R5. **UNVERIFIED:** how Apple's sheet moves; not observed.
- **Route B (our PhotoKit read):** this doc applies as written.
- **Android later:** same code, press scale not Material ripple (COMPONENTS), no `Link.AppleZoom`; shared tag needs `react-native-screens` 4.28 or newer per the Reanimated docs (above), so the pin must move before any shared-tag use there.
- **iOS 17 (minimum, D-098):** option A only. Option D (zoom) would be absent below iOS 18 anyway.
- **Tab bar:** under the tab, the move uses the root stack. The tab bar is the system's and is not painted by us. Whether the system tab bar (SDK 58 spike) changes how a modal covers it is **UNVERIFIED** and is the transition leads' check.
- **Web preview:** the native stack does not animate there (MOTION 5l note); the photo is in place; no shared transition on web (Reanimated docs).

## 9. Constitution, privacy and accessibility checks

| Check | Result |
|---|---|
| The machine never adds meaning | No machine title, caption, place or person guess travels or animates (R7); nothing types itself (R6) |
| No counts, gaps, streaks, points, badges | R16, R19, R21; no counter, ring, dot or "unfinished" state anywhere |
| Never implies AI writes | no sparkle, shuffle, assembling effect; the photo is a still |
| No fear, guilt or loss | leaving capture shows nothing about unfinished work (R21) |
| Never gender the child | no string is written here; content uses `{child}` |
| Privacy | R25; nothing leaves the phone from the library; no photo detail in logs |
| WCAG 2.2 AA and HIG Motion | purposeful, brief, cancellable, never the only signal (per DESIGN-LANGUAGE-V2 table); Reduce Motion in every row (R9, R23) |
| Dynamic Type to AX5, letter text never truncated (D-027) | R17 |
| 44 pt targets, VoiceOver order, colour not alone | R1, R12, R17, R18, R22 |
| Reduce Motion, Reduce Transparency, Increase Contrast, light and dark | R9, R23; glass only on controls, solid `glassFallback`; photo on paper |
| iPhone SE 3 gate | R17, R24 |
| Placeholder words never ship | no strings are written in this doc; every parent-facing line is "words by content" |

## 10. Open questions

| # | Question | Recommended default | Deadline |
|---|---|---|---|
| Q1 | Which capture mode does a card open: the last used, or a fixed one, or a two-button choice on the card? | last used on Home, with the other one tap away; confirm with the product leads | before design handoff to `mobile` |
| Q2 | After Keep, land on the Book (ruling today) or back on Moments? | keep the ruling (Book) for 1.x; test return-to-tab with real parents; the founder owns a change | before the route table is edited |
| Q3 | Build option B (photo carry) at all? | not in the first build; run a device spike (SE 3 and a ProMotion phone, AX5, Reduce Motion) after v1 passes its gate | after v1 |
| Q4 | Upgrade Reanimated to 4.8 or later to drop the flag path? | no change for this move; re-read the compatibility table and the unread "Screens and boundaries" and "Limitations" pages first | with the dependency owner |
| Q5 | `momentCarry.durationMs` value | 320 as a start, to be tuned on a device; do not set before measurement | first device run |
| Q6 | Does the compact photo in write expand to a viewer, and which one? | platform viewer or plain cross-fade, never a grow | design concept review |
| Q7 | What is the existing guard on leaving capture with words typed? | read the capture screen first; R11 assumes one exists | before build |
| Q8 | Does the capture screen get a lamp scene when opened from Moments? | the same as from Home (`write` scene in the table); no new scene | with A1 and the transition leads |

## 11. Dependencies

- Transition leads: route table rows for capture from the Moments tab (`write` and `listen` stay; a row only for option B); reconcile R13 of A1 with R4 here, and Q2.
- A1: R9 (no jump), R13 (platform rise), R4 (controls from frame 1); this doc adds only what happens after the tap.
- Design systems: tokens `momentCarry` and the route row, only if option B proceeds, with tests.
- Design concept: card layout, photo slot size, compact size, Q6.
- Feasibility: Route A or B for the photo reference (R25).
- Privacy and constitution: R7, R25, route params.
- Content: all parent-facing lines (the neutral photo label, "Write a letter" and "Talk", the placeholder line, the kept mark). No strings are written here.
- `mobile`: build against `useMotion()` and `useRouteTransitions()`; no raw duration, colour or size.
- A2, A3, A5: if one sets a different duration for the same move, tokens win.

## 12. What is VERIFIED, UNVERIFIED and a guess

**VERIFIED (read this session):**
- Reanimated shared element docs: on by default from 4.8, experimental behind `ENABLE_SHARED_ELEMENT_TRANSITIONS` for 4.2 to 4.7, iOS and Android, not web, Android advised `react-native-screens` 4.28 or newer. Source: https://docs.swmansion.com/react-native-reanimated/docs/shared-element-transitions/overview, read through a summarising fetch tool.
- Expo zoom transition: iOS 18 plus, SDK 55 plus, alpha, Stack only, advise against headers, works with `fullScreenModal`, about 1 s latency noted. Source: https://docs.expo.dev/router/advanced/zoom-transition/, same tool.
- `apps/mobile/package.json` versions (expo ~57.0.26, expo-router ~57.0.24, RN 0.86.3, Reanimated 4.5.1, screens ~4.26.0, worklets 0.10.1).
- `docs/design/MOTION.md` sections 5f, 5l (route table), 7, 8 and `packages/design-tokens/src/tokens.ts` `motion` (values in section 5 and 7).
- `docs/product/moments-tab/A1-motion-principles.md` on `wip/moments-a1`, whole.
- `git ls-remote` listing of `wip/moments-*` branches.

**UNVERIFIED:**
- That Reanimated 4.8 or newer is compatible with Expo SDK 57 and RN 0.86.3, and whether the repo's "not recommended for production" note is stale.
- Whether a shared tag can cross from a tab screen to a root-stack modal (the unread "Screens and boundaries" page).
- The summaries above came through a summarising tool and are not a full read of either page.
- The `Link.AppleZoom` SDK 57 freeze bug (relied on from MOTION 8, not re-fetched).
- The rise duration of the platform's modal; how Apple's picker moves; the existing guard on leaving capture; Home's last-used mode; how the router logs params; SOUND.md; PR #1264; the concept, feasibility and privacy docs; A2, A3, A5.
- All frame times, feel and contrast. Nothing was run on a device or a simulator. No measured number is quoted.

**Guess (design judgement, labelled):**
- Option A as the v1 default and option B as a later spike.
- 320 ms for the photo carry.
- That returning to the tab calms the daily loop (Q2).
- That a still photo is better company than a reactive one while recording.
- That the kept mark on the source card is wanted at all; content and the concept doc may drop it.
