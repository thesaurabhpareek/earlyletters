# First-run story cards: animation feasibility (10 Nov 2026)

Author: mobile (animation engineer role, read-only phase). Status: draft for Karma. Nothing was installed or built; every number is read from the repo or marked UNVERIFIED or "unmeasured guess".
Feeds: journey lead (structure), motion designer (timing, owns tokens), product, qa. I do not decide scope tiers; I say what each tier costs.

## 1. Bottom line
- Story-style cards (progress bar, tap zones, hold to pause, auto-advance) are buildable on what the app already ships: Reanimated, Gesture Handler, react-native-svg, expo-haptics, expo-blur, expo-glass-effect. No new native module is needed for tier B.
- Tier C art (rich illustration, video, Lottie, Skia) is where a new dependency or a large asset set would appear. Both need a Karma decision (section 6).
- The real risk to Build 12 is not animation. It is the files: #764, #738 and #724 all edit `onboarding.tsx` and `lib/first-run/*`. The story intro should be a new route/component that those files only link to (section 9).

## 2. What the app already has (read from the repo)
`apps/mobile/package.json`:
| Need | Present | Version |
|---|---|---|
| Animation | react-native-reanimated, react-native-worklets | 4.5.1, 0.10.1 |
| Gestures | react-native-gesture-handler | ~2.32.0 |
| Vector drawing | react-native-svg | 15.15.4 |
| Haptics | expo-haptics | ~57.0.3 |
| Blur, glass | expo-blur ~57.0.3, expo-glass-effect ~57.0.4 | |
| Sheets | @gorhom/bottom-sheet | ^5.2.14 |
| Native UI | @expo/ui | ~57.0.21 |
| Router | expo-router, react-native-screens | ~57.0.24, ~4.26.0 |
| Core | expo 57.0.26, react-native 0.86.3, react 19.2.3 | |
| Safe area | react-native-safe-area-context | ~5.7.0 |

Not present: Skia, Lottie, Rive, expo-linear-gradient, expo-video, **expo-image**. Discrepancy: `docs/design/COMPONENTS.md` lines 434 and 577 say expo-image is "already installed"; `package.json` has no `expo-image` and `grep` finds no import in `apps/mobile/src`. Treat the docs as wrong until `design-systems` confirms. Images today are plain RN `Image` or SVG.

Existing motion code (all Reanimated, all on tokens):
- `src/lib/motion.ts`: `useMotion()` returns `reduced`, `spring`, `fade`, `enter(i)`, `exit`, `leave`, `layout`. `useReducedMotion()` is one shared subscription to `AccessibilityInfo` (it reads once, then listens to `reduceMotionChanged`). `isReducedMotion()` is the synchronous read. Reduce Motion rule: movement becomes a paired 200 ms fade (`ReduceMotion.Never` on the fade).
- `src/components/motion/`: `draw-on.tsx` (strokeDashoffset line drawing, drawn complete under Reduce Motion), `breathe.tsx`, `page-turn.tsx` (a `Gesture.Pan`), `card-transition.tsx`, `press.ts`, `excerpt-fade`.
- `src/components/ui/lamp.tsx`: the one light that persists through first run (persistKey "firstRun"); onboarding already uses it.
- `src/components/onboarding/`: `welcome-lockup`, `promise-sample`, each with a `*.logic.ts` pure half. `src/components/app-lock/` has `layer.logic.ts` plus `lock-offer.tsx`.
- Tokens: `packages/design-tokens/src/tokens.ts` motion block: fadeMs 200, exitMs 160, enter {dy 8, 280 ms}, staggerMs 30, staggerMax 6, sequenceMaxMs 900, hardCeilingMs 2000, `cover` {holdMs 300, dx 8} ("book cover opening in first run").
- Haptics: five intents (`tap press soft success warning`), 100 ms throttle, "a haptic always accompanies a visible change". Story advance should be `tap` at most; the existing rule says no haptics during scroll/navigation, so default to none on auto-advance.
- Decisions that bind this work: ADR 0101 item 5 and COMPONENTS.md line 83: "No Lottie or Rive in v1", Reanimated only. MOTION.md section 9 says if a designer timeline is ever needed, choose `.lottie` (Apache-2.0). Any Lottie or Skia use therefore reopens an ADR.
- Onboarding today (`src/app/onboarding.tsx`, 599 lines): five steps `welcome, promise, child, signsAs, finish` held in local `useState`, exit-then-enter hand-off (`exitMs`), VoiceOver focus to each heading, `useFocusOnMount`. No gesture handling of its own.

## 3. What Expo SDK 57 supports
I could not open docs.expo.dev from this session (the fetch tool refused the URL), so none of these is read from Expo's pages:
- UNVERIFIED: the SDK 57 bundled version of Reanimated and Gesture Handler (the repo pins 4.5.1 and ~2.32.0 and the `~57` Expo modules, which implies a matching set, but that is inference, not a source).
- UNVERIFIED: Expo Go compatibility of any package here. Irrelevant to Build 12 because the app uses `expo-dev-client` and EAS builds.
- Read in the repo only: MOTION.md cites Expo Lottie (M25), Expo zoom transition (M18) and Expo native tabs (M20) as sources, dated 1 Oct 2026. I did not re-read them.
Action for the founder-visible record: whoever implements should open the Reanimated and Gesture Handler pages on docs.expo.dev and docs.swmansion.com before the first PR and paste the version lines in the PR.

## 4. Recommended approach for story cards
Principle: standard libraries, pure logic in `*.logic.ts`, screen thin (docs/agents role rules and the repo's `*.logic.ts` style).

### 4.1 Structure
- One new route group or modal-free component, e.g. `src/components/first-run-story/` (new folder, no collisions), mounted from a new route `src/app/story.tsx` (new file) that the existing first-run gate may route to later. The story never owns navigation decisions; it calls `onDone('skip' | 'finished')`.
- Cards are a data table (`story-cards.ts`: id, copy key, art key, optional per-card duration), the same shape as `line-art.data.ts`. Copy in a `copy.ts` for the feature folder, moved to `packages/content` by `content`.
- Render one card at a time (not a horizontal ScrollView). Cross-fade/slide via the existing `useMotion()` (`enter`, `leave`). This avoids paging gestures fighting the router and keeps memory flat.

### 4.2 Progress bar
- One segment per card, a Reanimated `useSharedValue` 0..1 for the current segment, driven by `withTiming(1, {duration, easing: linear, reduceMotion: Never})`; earlier segments full, later empty. `useAnimatedStyle` on `scaleX` with `transformOrigin` left (transform-only, no layout, UI thread).
- Segments are decoration plus information: expose one accessibility element, "Step 2 of 4" style via `accessibilityValue`, not four unlabelled views. Wording is `content`'s.

### 4.3 Tap zones and hold to pause
- Gesture Handler `Gesture.Exclusive(longPress, tap)` on a full-card `GestureDetector`: left third = back, right two thirds = next; `Gesture.LongPress().minDuration(~200)` onBegin = pause, onFinalize = resume. Zone choice and hold threshold are unmeasured guesses for the motion designer to set; thresholds belong in tokens, not literals.
- Accessibility wins over gesture: when VoiceOver or Switch Control is on, tap zones are inert and the card shows visible Back / Next / Skip buttons (44 pt, labelled). Skip is always a visible button, never gesture-only. Detect with `AccessibilityInfo.isScreenReaderEnabled()` (the repo has `lib/a11y.ts`, not read in depth by me).
- Also required without any gesture: Dynamic Type up to AX5 must not truncate card text (D-027); long text means the card becomes scrollable and auto-advance is off.

### 4.4 Auto-advance timer (the part worth unit-testing)
Do not use `setInterval` per segment. Model it as a pure state machine and drive time from a single clock:
- State: `{ index, elapsedMs, status: 'running' | 'paused' | 'done', pausedBy: set of 'hold' | 'background' | 'a11y' | 'reduceMotion' | 'interaction' | 'offscreen' }`.
- Events: `tick(dtMs)`, `holdStart/holdEnd`, `appBackground/appActive` (AppState), `reduceMotionChanged`, `screenReaderChanged`, `next`, `back`, `skip`, `focus/blur` (route is not in front, e.g. sign-in pushed on top).
- Rules, each a named test: elapsed never advances while any pause reason is set; returning from background does NOT jump the card forward (elapsed is frozen, not wall-clock); Reduce Motion on means auto-advance off and the progress bar becomes static segments (no fill animation), user taps to advance (an auto-advancing carousel is movement that carries meaning; the repo's rule is Reduce Motion replaces movement with a fade; whether auto-advance itself stays is the motion designer's call, my recommendation is off); screen reader on means off; last card never auto-finishes the story into a login without a visible button (the person must press); `back` on card 0 is a no-op; `next` on the last card emits `finished`.
- Visual progress and logic stay in step by deriving the Reanimated animation from the machine's `elapsedMs` at pause/resume (restart `withTiming` for the remaining duration) rather than trying to pause a running animation. Reanimated has no pause primitive I can cite (UNVERIFIED), so remaining-duration restart is the safe pattern.
- AppState: the repo already uses `AppState` in about ten files (lamp, breathe, listen, consent-ask). Reuse the pattern; wrap in one hook `useStoryClock`.

### 4.5 Gesture conflicts with Expo Router
- iOS edge swipe-back: the story route should set `gestureEnabled: false` (via `routeTransitions` in `transitions.logic.ts`, which `design-systems`/motion own) or be the root of a stack so there is nothing to go back to. Left-zone tap near the edge may otherwise clash with the back swipe. UNVERIFIED on device.
- Vertical pan to dismiss is not needed; do not add one.
- The story sits above the gate stack. If #724/#738 change the stack structure, the story route's presentation option needs a re-check.
- `GestureHandlerRootView` is already provided in `components/ui/provider.tsx`; no new root needed.

## 5. Assets and bundle size
- Current `apps/mobile/assets` is 1.1 MB total (brand icons and splash). Measured with `du`, not installed-binary size.
- Recommended default (tier B): zero raster art. Cards use the existing line-art system (`line-art.data.ts` strokes via `DrawOnStrokes`) plus type, the same restraint as the website scenes and COMPONENTS.md ("no mascot"). Cost: a few KB of path data per card, no new decoder.
- If photography or illustration is wanted (tier C): static PNG or HEIC at 2x/3x per card. Unmeasured guess: 4 to 6 cards x 100 to 250 KB each, under 1.5 MB. With no expo-image, RN `Image` works but has no blurhash placeholder or disk-cache control; add expo-image only if wanted (it is an Expo module in the same SDK family, but it is a native module, so it is a new build, see 6).
- Video or Lottie: not recommended. Video adds expo-video and large files; Lottie adds a native module plus an ADR amendment. Neither fits "calm, fast" at first launch.
- No awaited network or model load on launch (A-NFR-001); all story assets must be bundled, never fetched. First-run screens interactive within 300 ms (B-NFR-008): the first card must render without waiting for fonts beyond what the welcome already needs.
- Remember `whisper.rn` and models dominate install size; art is noise by comparison.

## 6. New dependencies: decision list (founder / Karma)
Any new native module forces a new EAS build and a fresh look at App Review and the privacy manifest (`licences:verify`, required-reason audit by S20 in BOARD).
| Candidate | Why | New native module? | My recommendation |
|---|---|---|---|
| none (tier A and B) | Reanimated + RNGH + SVG suffice | no | Do this for Build 12 |
| expo-image | blurhash, disk cache for photos | yes | Only if tier C art is photographic; Karma decision |
| expo-linear-gradient | soft gradient backgrounds | yes | Avoid; COMPONENTS.md says pre-render radial PNGs, no per-frame gradient |
| @shopify/react-native-skia | shaders, particles | yes, large | No. ADR 0101 and MOTION say no Skia |
| lottie-react-native / .lottie | designer-authored timeline | yes | No for v1; MOTION section 9 names it as the pick if ever needed |
| expo-video | looped video cards | yes | No |
Licences must stay MIT, Apache-2.0, BSD or ISC; I have not checked any candidate's licence this session (UNVERIFIED), except MOTION.md's note that Lottie is Apache-2.0.
Note: the build word is due Wed 11 Nov (unmeasured; may slide). Anything needing a new native module cannot ride on an already-cut Build 12 binary and has to be decided before the build is cut.

## 7. Performance risks, older iPhones
Budgets: cold start p50 1.2 s, p90 2.0 s on iPhone SE 3; warm p50 400 ms; first-run screens interactive in 300 ms. None of these has been measured by me.
- Risk 1, JS thread contention: the story mounting on the cold-start path adds a route and a table. Mitigate by lazy-loading the story route (Expo Router routes are separate modules) and keeping the splash handoff unchanged. Do not touch `_layout.tsx` boot wiring (owned by another task).
- Risk 2, `expo-blur` / `expo-glass-effect` behind moving content: blur is GPU heavy on older phones. Avoid blur under animating progress; use opaque paper-colour surfaces.
- Risk 3, many simultaneous animated nodes: keep to one progress shared value per segment at most, transform and opacity only, no animating `width`, no layout animations on the card container.
- Risk 4, SVG draw-on on every card: `DrawOnStrokes` runs `useAnimatedProps` on JS-bridged SVG props; fine for 1 to 3 paths per card, unmeasured for dense art. Cap stroke count per card in the data table and test it.
- Risk 5, Dynamic Type AX5 re-layout while a timer runs: pause the clock on layout change.
- Risk 6, unmounting: ensure the clock hook clears on blur so the timer does not run under the sign-in screen.
- How to check: no CI can measure frame rate. Add `human` device-check tasks: (a) cold start with story flag on vs off on an iPhone SE 3 or oldest supported phone, 10 runs each, (b) Xcode Instruments Time Profiler / Core Animation FPS over the full story, (c) Reduce Motion, VoiceOver and AX5 pass, (d) background/foreground mid-card, (e) low power mode. Device list and "oldest supported iPhone" are UNVERIFIED (not read this session).

## 8. Testability
Pure logic, unit-testable in vitest with no phone (matches `apps/mobile/test/*.test.ts` style, 223 files today):
- `story-clock.logic.ts`: the state machine in 4.4 (every pause reason, background freeze, reduce-motion off, last-card rule, back at 0, skip, done events). Highest value, about 20 to 30 cases.
- `story-cards.data.ts` validation: card ids unique, copy keys exist in `packages/content`, stroke count cap, card count 3 to 6 (numbers a proposal).
- `story-zones.logic.ts`: x-coordinate to `back | next` given width and RTL (right-to-left languages swap zones; check against the languages in `packs/`).
- `story-progress.logic.ts`: segment fill state for index and elapsed.
- Copy rules already run through `packages/content/test/rules.test.ts` (no em dashes, no fear language, no streaks or counts).
Device-only (record as `human` tasks or Playwright web-flow where it works):
- Real gesture feel (hold, edge-swipe clash), frame rate, haptics, Reduce Motion toggled live, VoiceOver order, AX5 layout, background/foreground. The repo has web e2e (`apps/mobile/e2e-web`, Playwright) which can cover the skip path and sign-in hand-off; custom keyframes already misbehave on web (motion.ts note), so do not assert animation there.

## 9. Engineering breakdown (small PRs)
Sizes are unmeasured guesses (S under half a day, M about a day, L 2 days). Tier follows the brief (A must, B stretch behind a flag, C later); the journey lead and Karma rule the tiers.
| # | PR | Tier | Size | Files (new unless stated) | Owner | Collisions |
|---|---|---|---|---|---|---|
| 1 | Story clock state machine and tests | B | M | `src/components/first-run-story/story-clock.logic.ts`, `test/story-clock.test.ts` | mobile | none |
| 2 | Cards data, zones and progress logic, copy stub | B | S | `story-cards.data.ts`, `story-zones.logic.ts`, `story-progress.logic.ts`, `copy.ts`, tests | mobile; copy to `content` | none |
| 3 | Story UI: progress bar, card, tap zones, hold, buttons, a11y alternative | B | L | `story-screen.tsx`, `progress-bar.tsx`, `useStoryClock.ts`; no new deps | mobile; uses `components/ui/*` read-only | none (new folder) |
| 4 | Route and flag wiring: `src/app/story.tsx`; route option in transitions | B | S | new `story.tsx`; `src/lib/transitions.logic.ts` and `_layout.tsx` are NOT mine to edit without a task that owns them | mobile + whoever owns `_layout` | `_layout.tsx` boot wiring (rule); `transitions.logic.ts` owned by design-systems |
| 5 | Gate hook: send a never-seen device to the story, skip/finish to the auth entry | B | S | `lib/first-run/gate.logic.ts`, `use-first-run-route.ts`, `onboarding.tsx` | mobile | **#764, #738, #724 all edit these**; do after they merge, or add as a second commit on top of the winner; do not branch in parallel |
| 6 | Line-art for cards (SVG stroke tables) | B/C | M each | `components/ui/line-art.data.ts` (design-systems owns `components/ui/**`) | design-systems | none if they own it |
| 7 | Device-check tasks and perf notes | A | S | BACKLOG task rows, `docs/qa` | mobile + qa + human | none |
| 8 | Richer art, photos, optional expo-image | C | M to L | package.json, lockfile, app.config | mobile; Karma decision | new build |
Order: 1, 2, 3 can be built and merged dark (no route links to them) while #764/#738/#724 settle. 4 and 5 are the only risky ones. If the gate is still open on decision day, the story ships off (flag) or not at all; nothing in 1 to 3 changes behaviour, so it is safe to merge anyway.
Tier A (auth entry, returning user, lock offer) does not need any of this and touches the same hot files; I recommend it not wait on the story.

## 10. UNVERIFIED and open questions
UNVERIFIED: SDK 57 bundled versions and Expo docs (page blocked); Reanimated pause support; edge-swipe clash; RTL zones; candidate licences; oldest supported iPhone; all timings and sizes.
Other flag: `apps/web/src/content/site.ts` scenes use the name "Meera" and "Papa" as copy; CLAUDE.md says real family details stay out of code. Not mine to rule on; whoever reuses website scenes in the app should check `no-real-family-data.test.ts`.
Questions (each with my recommendation):
1. Should auto-advance exist at all? Recommend: yes for sighted default, off under Reduce Motion and screen reader, tap-to-advance always works.
2. Is expo-image wanted? Recommend: no for Build 12; line art and type only.
3. Merge the dark PRs 1 to 3 before the gate PRs settle? Recommend: yes.
