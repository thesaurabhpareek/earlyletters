# Early Letters: Motion System

v0.1, 2026-10-01. Extends `DESIGN_LANGUAGE.md` section 8 and `tokens.motion`; contradicts neither. **(opinion)** marks judgement. Apple first, Android later, one codebase (Reanimated 4.5.1, Expo Router 57, RN 0.86.3).

## 1. Benchmark

| App | Pattern | Communicates | Verdict | Src |
|---|---|---|---|---|
| Airbnb | Declared shared element: tagged view animates between screens | Same thing, closer | **Adopt** for chapter and letter open | M1 |
| Apple Journal | Cards scroll behind a fixed "+", blurring as they leave | Capture is always there | **Adapt** fixed Speak/Type; **avoid** blur | M2, M3 |
| Photos Memories | Ken Burns pan/zoom, mood titles | Cinematic memory | **Avoid**: zoom is what Reduce Motion removes | M4, M3 |
| Apple Books | Page turn: Slide (default), Curl, None | Physical book, user's choice | **Adapt**: slide/fade, no curl | M5 |
| Books Read Aloud | Media overlays map audio clip ranges to text spans; CSS highlight; word or sentence | Voice and text are one | **Adopt** timing model | M6 |
| Read-along (PubCoder) | Phrase highlight default; word-level is "heavier cognitive load" | Effortless following | **Adapt**: word wash with minimum dwell | M7 |
| Voice Memos | Live scrolling waveform | Signal level | **Avoid** (founder rule) | (observed) |
| Live Activities | Animations max 2 s; move existing elements, don't rebuild | Honest, glanceable | **Adopt** 2 s ceiling | M8 |
| Watch Breathe / Calm | Shape grows on inhale; Calm paces 4, 6, 8 breaths/min | Slow is calm | **Adapt** idle glow | M9, M10 |
| Headspace | Breathe along to clouds, waves, a sleeping cat | Softness | **Adapt**: one living element in empty states | M11 |
| Duolingo | Rive state machines; visemes timed to audio | Characters react | **Adapt** audio-timed sync; **avoid** characters, confetti, streaks, badges | M12 |
| Things 3 | To-do expands into a card in place; haptics on drag | Objects, not rows | **Adopt** in-place expansion | M13 |
| Apple HIG | Purposeful, brief, cancellable; little motion on frequent actions | Restraint | **Adopt** as law | M2 |
| Material 3 | 50 to 1000 ms; standard easing `(0.2,0,0,1)`; spatial springs damping 0.9, stiffness 1400/700/300 | Android feel | **Adopt** as cross-check | M14 |

## 2. Principles

| # | Principle | Do | Don't |
|---|---|---|---|
| 1 | **Motion follows the voice.** Continuous motion only from a real signal. | Glow tracks amplitude; highlight tracks the audio clock. | Decorative loops while recording or listening. |
| 2 | **Controls never animate in.** | Save, Play, Speak/Type opaque and hittable from frame 1. | Fade in Save; stagger the twins. |
| 3 | **Saves are instant; animation is the receipt.** | Commit, haptic, then animate. | Await an animation before commit. |
| 4 | **Interruptible.** Any tap ends a sequence (M2). | Springs from current value; tap-to-skip. | Block input mid-transition. |
| 5 | **Quiet joy.** | A soft wash and a sentence. | Confetti, counters, streaks, sound. |
| 6 | **Same code, native chrome.** | Our motion in Reanimated; tabs, sheets, back stay native. | Re-create the iOS sheet spring on Android. |

## 3. Token additions (in `tokens.ts` since Oct 3 2026)

All of the block below now lives in `tokens.motion` (plus `press`, `exitMs`, `easing`, `hardCeilingMs`, `emptyBreathMs`, `drawMs`), and `packages/design-tokens/test/tokens.test.ts` checks the 2 s ceiling, that the 6-item stagger fits under 900 ms and that every spring has a damping ratio of at least 0.9. `lib/motion.ts` reads them; screens never type a duration or spring. Implemented: `useMotion()` (`spring`, `fade`, `enter`, `exit`, `layout`), `usePressScale()` (`components/motion/press.ts`), `DrawOnPath` (`components/motion/draw-on.tsx`, 5h), `Breathe` (`components/motion/breathe.tsx`, 5j). Still hardcoded and owned elsewhere: the `B` constants in `components/capture/listening-aura.tsx` (equal to `tokens.motion.breath`; its owner should switch to the token).

```ts
motion: { ...existing,
  fadeMs: 200,                        // = reduceMotion.durationMs
  enter: { dy: 8, durationMs: 280 },  // easing bezier(0.2,0,0,1), M3 standard
  staggerMs: 30, staggerMax: 6,
  sequenceMaxMs: 900,                 // under Live Activities' 2 s
  newMarkMs: 1600,                    // accentSoft wash on a new letter
  breath: { dbFloor: -55, dbCeil: -10, gamma: 0.6, attackMs: 80, releaseMs: 400,
            scaleMax: 1.18, opacityMin: 0.18, opacityMax: 0.40, idleAfterMs: 600, idleScale: 1.05 },
  highlight: { leadMs: 50, minDwellMs: 120, lineAnchor: 0.4, followResumeMs: 4000 },
}
```

Android cross-check (M14): `snappy` (damping ratio ~1.0) ≈ M3 fast spatial, `standard` (0.93) ≈ default spatial but softer, `gentle` (0.95) ≈ slow spatial. Springs ship unchanged on Android: one brand feel **(opinion)**.

## 4. Reduce Motion: one mechanism

- `useReducedMotion()` returns the value at app start (M15), so also subscribe to `AccessibilityInfo` `reduceMotionChanged` (M16). Android reports true when animator scale is off; RN documents the developer switch, and Accessibility "Remove animations" sets the same scale **(verify on device)**.
- Reanimated's default `ReduceMotion.System` makes springs and timings **jump** to the end (M15). A jump is not our fallback: movement keeps `System`, plus a paired opacity fade via `withTiming(v, { duration: fadeMs, reduceMotion: ReduceMotion.Never })`.
- One hook, `useMotion()` → `{ reduced, spring(token), fade() }`. Components never read the setting directly.

## 5. Signature moments

`S`/`St`/`G` = snappy/standard/gentle springs. RM = Reduce Motion fallback. Transform and opacity unless noted. Android = identical code unless stated.

### (a) App open, book cover
- Cold launch only; warm resume does nothing. Tonight renders complete; only dateline, greeting, prompt card `enter` (opacity 0→1, y 8→0, 30 ms stagger, under 400 ms). Speak/Type static.
- First Book tab view per session: child's-name cover settles, opacity 0.6→1, y 6→0, `G`. No curl.
- Haptic none. RM: one 200 ms fade. Android: keep the Android 12+ splash icon static.

### (b) Breathing listening glow
- Input: recorder metering (dBFS, 20 Hz, expo-audio; **confirm Android parity in the audio spike**) into shared value `db`.
- Per frame in `useFrameCallback`:
  1. `a = clamp((db + 55) / 45, 0, 1) ** 0.6` (quiet speech still moves it).
  2. Asymmetric smoothing: `tau = a > s ? 80 : 400`; `s += (a - s) * (1 - exp(-dt / tau))`. Uses `dt`, so 60 and 120 Hz match.
  3. `scale = 1 + 0.18 s`, `opacity = 0.18 + 0.22 s`.
  4. Idle: when `s < 0.05` for 600 ms, weight `w` ramps to 1 over 600 ms; `b = 0.5 - 0.5 cos(2πt / breathIdleMs)`; `scale = max(1 + 0.18 s, 1 + 0.05 w b)`. Speech always wins; a pause never looks broken.
- Visual: pre-rendered 240 pt radial PNG in `recording` colour behind the 120 pt mic disc; no per-frame gradient, no Skia.
- Haptic: `recordStart` before the audio session activates, `recordStop` after it ends (iOS mutes haptics during recording unless explicitly allowed).
- RM: static 2 pt ring; opacity steps 0.2/0.3/0.4 at `s` 0.15/0.5, 200 ms fades, max one change per 400 ms; label "Listening".

### (c) Speech becoming words
- New partial words: opacity 0→1, y 4→0, 180 ms, M3 standard easing, 30 ms stagger, max 6 per batch. Revised words cross-fade 120 ms in place, never reorder. Old lines exit up by one line height with `St`.
- Motion never suggests the machine is writing (constitution).
- Haptic none. RM: 150 ms opacity only.

### (d) Review: quiet underlines and "put it back"
- Underlines render at final opacity on first frame: information, not decoration.
- Tap a machine edit: an inline card expands under the line (Things, M13), height by `LinearTransition` `St`, content fades in after 80 ms. Shows original vs current and **Put it back**.
- Put it back: original cross-fades in (out 120, in 160 ms), paragraph reflows with `LinearTransition` `St`, restored span gets an `accentSoft` wash fading over 1.6 s. "Put back. Undo" persists until dismissed.
- Haptic `selection`. RM: instant height, 200 ms fades, wash static then fades.

### (e) Save: settling into the month
- Tap Save → local commit → `success` haptic → animate. Never gated.
- In Review (≤ 900 ms): card scales 1→0.9, radius `xl`→`md`, `G`; chip "Filed in Month 4" fades in at 250 ms; at 550 ms card moves down 24 pt and fades (`St`); modal dismisses natively. Tap skips.
- Arrival: in the Book, the new card is already in place with an `accentSoft` wash fading over 1.6 s. No tab badge.
- Reanimated shared elements cannot cross tabs (M17); "fold then arrive" reads as one gesture **(opinion)**.
- RM: chip, 200 ms fade, dismiss; arrival wash static then fades.

### (f) Opening a chapter and a letter
- **v1, both platforms: measured-rect transition.** Measure the tapped card on the UI thread into a shared store; push the route with `presentation: 'transparentModal'`, `animation: 'none'`; its surface animates from the source rect to full screen via translate and scale (not width/height), radius `md`→0, `St`. Content fades in from 60% progress. List behind dims to 0.96; no blur.
- Dismiss (swipe down, back button, Android back): reverse to the rect if the card is still visible, else 200 ms fade, then `router.back()`.
- Chapter interior: first 6 cards `enter`, 30 ms stagger.
- Haptic none. RM: 200 ms cross-fade.

### (g) Read together
- Clock: on each player status update write `{posMs, at, rate}`; per frame `pos = posMs + (now - at) * rate`, re-anchored on update, seek, pause. Speed 0.75x is automatic.
- Word index: binary search of word start times on the UI thread; highlight at `start - 50 ms` **(opinion; tune)**. Words under 120 ms merge with the next so the wash never flickers (M3 warns on fast blinking).
- Layout: words as inline `Text` items in a wrapped row (Latin/Devanagari runs per DESIGN_LANGUAGE), each measured by `onLayout` into a shared rect array; paragraph exposed as one accessibility element. One `accentSoft` wash (radius 4) moves x/width with `S` along a line; on line change it fades out 80 ms and in on the new line, no diagonal slide.
- Line follow: hold the current line at 40% height; beyond ±1 line, UI-thread `scrollTo` over 450 ms, M3 easing. A user drag suspends follow; "Follow along" pill resumes; auto-resume after 4 s idle.
- Haptic none. RM: wash jumps (DESIGN_LANGUAGE spec); scroll pages: line past 75% height jumps to 25%.

### (h) Milestones: first letter, 100 letters, first grandparent letter
- An inline note card in the Book at that letter's place, never a modal. Line drawing (envelope, moon; `react-native-svg`) draws once via `strokeDashoffset` over 1.2 s, then text fades in: "Meera's first letter. From Papa, Month 2." / "One hundred letters for Meera." / "Nani wrote to Meera."
- Once per reader, no sound, no extra haptic (save already gave `success`), no push.
- RM: drawing shown complete, 200 ms text fade.

### (i) Tabs and sheets
- NativeTabs, no custom transition; Liquid Glass on iOS 26, Material tabs on Android (M20).
- `formSheet` with detents: native on iOS; Android bottom sheet, max 3 detents, no grabber, title rendered in content (M21). Sheet content adds no entrance.
- Reading Size: font size never animates; text cross-fades 150 ms, scroll anchored to the 40% paragraph; `selection` haptic per step.
- Push/back: platform default, including Android predictive back.

### (j) Empty states
- One element (moon or envelope) breathes opacity 0.85↔1 over 8 s (Calm's slowest pace, M10), only while focused and app active. Text and action static.
- Off under RM, Low Power Mode (`expo-battery`) and Android animator scale 0.

## 6. Haptics map

**Policy (Oct 3 2026): a haptic marks an outcome, never a navigation.** `Button` plays no haptic by default; a call site passes `haptic` only where the press is an outcome (Speak / Type start a capture, Save, Delete). Continue, Back, Close, tab changes, sheet opening and scrolling are silent. `success` and `warning` are never dropped by the 100 ms throttle (`lib/haptics.shared.ts`). Android mapping is built (`lib/haptics.android.ts`).

One `haptic(name)` wrapper. Android uses `performAndroidHapticsAsync` (system feedback, no VIBRATE permission), not the Vibrator path (M22).

| Moment | iOS (`expo-haptics`) | Android (`AndroidHaptics`) |
|---|---|---|
| Record start / stop | `impactAsync(Light)` | `Context_Click` |
| Pause / resume | `selectionAsync()` | `Segment_Tick` |
| Save letter | `notificationAsync(Success)` | `Confirm` |
| Discard (confirmed) | `notificationAsync(Warning)` | `Reject` |
| Put it back, pick alternative | `selectionAsync()` | `Segment_Tick` |
| Reading Size, speed | `selectionAsync()` | `Segment_Tick` |
| Long press letter | `impactAsync(Soft)` | `Long_Press` |
| Playback, highlight, milestones, tabs | none | none |

iOS mutes the Taptic Engine in Low Power Mode and during dictation (M22): a haptic always accompanies a visible change.

## 7. Performance rules

1. Continuous motion runs in UI-thread worklets; JS only writes targets, never `setState` per frame.
2. Animate `transform` and `opacity`. Exceptions: highlight wash `width`, transitioning card `borderRadius`.
3. Never animate font size, text block size, shadows, Android `elevation`, blur, per-frame gradients.
4. Set `CADisableMinimumFrameDurationOnPhone = true` in Info.plist for ProMotion 120 Hz; all smoothing uses `dt`.
5. One loop on screen at most; cancel on blur and `AppState` background.
6. No frame over 16.7 ms on iPhone SE (3rd gen) and a mid-tier 60 Hz Android.

## 8. Shared-element transitions: current state

| Option | Status (verified 2026-10-01) | Use |
|---|---|---|
| Reanimated `sharedTransitionTag` | Experimental, static flag `ENABLE_SHARED_ELEMENT_TRANSITIONS` (4.2.0+), "not recommended for production"; iOS and Android; native stack only, no tabs; no custom animation functions; iOS header and native-modal issues (M17, M23) | Not in v1 |
| Expo Router `Link.AppleZoom` | Alpha, iOS 18+ only, SDK 55+; plain render elsewhere; avoid with headers; ~1 s latency on rapid use (M18); SDK 57 bug: source card freezes if list scrolls during dismiss (M19) | iOS enhancement after SDK 58 test |
| Measured-rect transition (5f) | Plain Reanimated + transparent modal, same code both platforms | **v1 default** |
| Fallback | Native push or 200 ms fade | RM, failures |

## 9. Lottie vs Rive vs Reanimated

| | Lottie 7.5.0 | Rive (`@rive-app/react-native` 0.5.1) | Reanimated + react-native-svg |
|---|---|---|---|
| Licence | Apache-2.0 | Runtime MIT; free editor exports show a Rive splash, removal from $9/seat/month (M24) | MIT |
| Expo | In Expo Go (M25) | Dev build, config plugin, Nitro Modules (M26); old `rive-react-native` superseded | Native to stack |
| Platforms | iOS, Android, web | iOS 15.1+, Android 24+ | Both |
| Size | dotLottie "80% smaller" than JSON (vendor, M27); small icons 15 to 80 KB JSON vs 5 to 20 KB .riv (third party, M28) | Smaller, interactive | A path |
| Fit | Designer timelines | Characters, state machines (M12) | Draw-once lines, glow, washes |

**Recommendation: none in v1.** All three illustrated moments are single-weight line drawings, no mascot (DESIGN_LANGUAGE 9): `strokeDashoffset` plus opacity covers them with no new dependency and exact Reduce Motion control. If a designer timeline is ever needed, pick **Lottie (.lottie)**: open format, Apache-2.0, Expo Go, no paid seat. Rive's strength is the characters we chose not to build.

## 9b. Web preview note

Reanimated 4.5.1 on web pins an element to `position: absolute` after any entering animation that is not a stock preset (custom `withInitialValues` or a `Keyframe`). `useMotion().enter()` therefore uses the stock `FadeInDown` on web and the 8 pt rise on native. Do not use custom entering keyframes in screens until this is fixed upstream (COMPONENT_LIBRARY 0.2 item 5).

## 10. Open questions

1. `breathIdleMs` 4000 is 15 breaths/min; Calm's slowest is 8/min (M10). Test 6000 with tired parents.
2. Confirm expo-audio metering rate and dBFS range on Android.
3. Tune `leadMs` and 120 ms dwell with grandparents at Large Print.

## Sources

M1 [Airbnb: Motion engineering at scale](https://medium.com/airbnb-engineering/motion-engineering-at-scale-5ffabfc878) · M2 [HIG Motion](https://developer.apple.com/design/human-interface-guidelines/motion) · M3 [HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) · M4 [iPhone J.D.: Memories](https://www.iphonejd.com/iphone_jd/2017/10/memories.html) · M5 [MacRumors: Books page turn](https://www.macrumors.com/how-to/re-enable-page-turning-animation-apple-books/) · M6 [Books Asset Guide: Media Overlays](https://help.apple.com/itc/booksassetguide/en.lproj/itcf373ff8f8.html) · M7 [PubCoder Read Aloud](https://docs.pubcoder.com/pubcoder-read-aloud.html) · M8 [HIG Live Activities](https://developer.apple.com/design/human-interface-guidelines/live-activities) · M9 [Apple Watch Breathe](https://support.apple.com/en-gb/guide/watch/apd371dfe3d7/watchos) · M10 [Calm breathing pace](https://support.calm.com/hc/en-us/articles/360000069973-Calm-Breathing-Exercises-How-to-Adjust-Speed-Timers-Haptics-Vibrations) · M11 [Headspace breathing](https://www.headspace.com/meditation/breathing-exercises) · M12 [Duolingo visemes](https://blog.duolingo.com/world-character-visemes) · M13 [MacStories: Things 3](https://www.macstories.net/reviews/things-3-beauty-and-delight-in-a-task-manager/) · M14 [MDC Android Motion](https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md) · M15 [Reanimated accessibility](https://docs.swmansion.com/react-native-reanimated/docs/guides/accessibility/) · M16 [RN AccessibilityInfo](https://reactnative.dev/docs/accessibilityinfo) · M17 [Reanimated SET](https://docs.swmansion.com/react-native-reanimated/docs/shared-element-transitions/overview/) · M18 [Expo zoom transition](https://docs.expo.dev/router/advanced/zoom-transition/) · M19 [expo#50049](https://github.com/expo/expo/issues/50049) · M20 [Expo native tabs](https://docs.expo.dev/router/advanced/native-tabs/) · M21 [Expo modals](https://docs.expo.dev/router/advanced/modals/) · M22 [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/) · M23 [Reanimated feature flags](https://docs.swmansion.com/react-native-reanimated/docs/guides/feature-flags/) · M24 [Rive pricing](https://rive.app/pricing) · M25 [Expo Lottie](https://docs.expo.dev/versions/latest/sdk/lottie/) · M26 [Rive Nitro runtime](https://github.com/rive-app/rive-nitro-react-native) · M27 [LottieFiles blog](https://lottiefiles.com/blog/lottie-animations/lottiefiles-or-rive) · M28 [Unicorn Icons](https://unicornicons.com/blog/lottie-vs-rive-performance). Versions and licences: npm registry, 2026-10-01.
