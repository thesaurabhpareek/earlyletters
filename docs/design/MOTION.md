# Early Letters: Motion System

v0.2, 2026-10-16 (v0.2, the experience pass P1: lamp scenes in 5k, the screen-transition standard in 5l, the page turn in 5m, the `file`, `pageTurn`, `cover` and `cardToPage` tokens, `breathIdleMs` 7500). Extends `DESIGN_LANGUAGE.md` section 8 and `tokens.motion`; contradicts neither. **(opinion)** marks judgement. Apple first, Android later, one codebase (Reanimated 4.5.1, Expo Router 57, RN 0.86.3).

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

All of the block below now lives in `tokens.motion` (plus `press`, `exitMs`, `easing`, `hardCeilingMs`, `emptyBreathMs`, `drawMs`), and `packages/design-tokens/test/tokens.test.ts` checks the 2 s ceiling, that the 6-item stagger fits under 900 ms, that the saved moment and the page turn fit the sequence, and that every spring has a damping ratio of at least 0.9. `lib/motion.ts` reads them; screens never type a duration or spring. Implemented: `useMotion()` (`spring`, `fade`, `enter`, `exit`, `leave`, `layout`), `routeTransitions` / `useRouteTransitions()` and `useSheetMotion()` (5l), `useUnlitRoom()` (5k), `usePressScale()` (`components/motion/press.ts`), `DrawOnPath` and `DrawOnStrokes` (`components/motion/draw-on.tsx`, 5h), `Breathe` (`components/motion/breathe.tsx`, 5j), `PageTurn` (5m), `CardSource` and `CardToPage` (`components/motion/card-transition.tsx`, 5f), `ExcerptFade` (`components/motion/excerpt-fade.tsx`, static). Still hardcoded and owned elsewhere: the `B` constants in `components/capture/listening-aura.tsx` (package P4 switches them to `tokens.motion.breath` and `breathIdleMs`).

```ts
motion: { ...existing,
  fadeMs: 200,                        // = reduceMotion.durationMs
  enter: { dy: 8, durationMs: 280 },  // easing bezier(0.2,0,0,1), M3 standard
  staggerMs: 30, staggerMax: 6,
  sequenceMaxMs: 900,                 // under Live Activities' 2 s
  newMarkMs: 1600,                    // accentSoft wash on a new letter
  breathIdleMs: 7500,                 // 8 breaths a minute (was 4000; open question 1, answered)
  file: { chipAtMs: 250, moveAtMs: 550, dy: 24, scale: 0.9 },   // the saved moment (5e)
  pageTurn: { dx: 24 },               // Read together (5m)
  cover: { holdMs: 300, dx: 8 },      // the book cover opening in first run (S08)
  cardToPage: { contentFrom: 0.6, holdMs: 136, clearPt: 24 }, // 5f
  lamp: { arriveMs: 1200, breathMs: 9000, breathOpacityMin: 0.88, dimTo: 0.7, leaveMs: 160, returnMs: 280 },   // 5k, 5l
  route: { dissolveMs: 280 },         // the dissolve into and out of Listen, Review and Read together (5l)
  swapMs: 150,                        // words replaced in place: a toast over a toast, Reading Size
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
  4. Idle: when `s < 0.05` for 600 ms, weight `w` ramps to 1 over 600 ms; `b = 0.5 - 0.5 cos(2πt / breathIdleMs)` with `breathIdleMs` 7500 (8 breaths a minute, 0.13 Hz, under HIG Motion's 0.2 Hz caution); `scale = max(1 + 0.18 s, 1 + 0.05 w b)`. Speech always wins; a pause never looks broken.
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
- In Review (≤ 900 ms): card scales 1→0.9 (`motion.file.scale`), radius `xl`→`md`, `G`; chip "Filed in Month 4" fades in at 250 ms (`file.chipAtMs`); at 550 ms (`file.moveAtMs`) card moves down 24 pt (`file.dy`) and fades (`St`); at `sequenceMaxMs` Review fades out (`fadeMs`) and the app lands on the Book, on the new letter (5l row 5; from Write the sheet dismisses natively onto the Book). Tap skips. The timeline is data: `fileIntoMonthPlan()` in `lib/transitions.logic.ts`.
- Arrival: in the Book, the new card is already in place with an `accentSoft` wash fading over 1.6 s. No tab badge.
- Reanimated shared elements cannot cross tabs (M17); "fold then arrive" reads as one gesture **(opinion)**.
- RM: chip, 200 ms fade, dismiss; arrival wash static then fades.

### (f) Opening a chapter and a letter
- **v1, both platforms: measured-rect transition with the words as the shared element.** Measure the tapped card and its words into a small store (`CardSource` and `CardText`, on touch-down); present the route with `presentation: 'transparentModal'`, `animation: 'none'` (the standard's `cardToPage` move, 5l); `CardToPage` grows one empty paper surface from the source rect to full screen, radius `md`→0, its colour from the card's `surfaceRaised` to the page's `bg`, `St`. The card's words never leave: the page's opening block (`opening`, placed by `PageOpening`: the same dateline and the whole letter) is laid out once at the page's column and carried, whole, from where the card's words sat to where the page puts them, on the same curve. Only the rest of the letter, below the card's lines, cross-fades in from 60% progress (`cardToPage.contentFrom`), clipped to the paper so it never draws past its edge; the card's own fade over the end of its last line gives way to it, and the rest of the page fades in with it. Nothing is scaled, and no frame shows an empty card or page. **The Book leaves the way its lamp leaves a lit room (5l rule 1):** a veil of the page's paper (`bg`), one full-screen layer with no pieces, comes up on a straight line over `lamp.leaveMs` (160 ms) while the card holds for `cardToPage.holdMs` (136 ms); then the paper grows on `St`. So nothing on the Book loses more than a third of its strength in any 50 ms (the rule is at most half), the title and the light take the whole 160 ms, and by the time the paper's edge is `cardToPage.clearPt` (24 pt) past the card, short of the next card's words 28 pt on, the Book is 95 percent gone: no edge ever cuts a legible line, on any phone. No blur, and no dim on top of it (the veil is the dim). On the way back the veil stays until the paper is within `clearPt` of the card again (`clearProgress`), then lifts on a straight line over `lamp.returnMs` (280 ms), the way the lamp comes back; the route leaves when both the paper and the veil are home. Reduce Motion, no measured card, or another column or type size: nothing moves; the Book goes under the same veil, and the whole page fades in over `fadeMs` from when the Book is half gone (80 ms); back, the page fades out over `fadeMs` and the Book returns over `lamp.returnMs` from when the page is half gone (100 ms). A hand-off on straight lines: the two screens' words are never together at more than a quarter of their strength. The timeline is `CARD_TO_PAGE` in `lib/transitions.logic.ts`, and `transitions.test.ts` steps it ms by ms on three phones, both cards, both ways. Because the growing surface has no children, its frame may move (the same exception as the transitioning card radius in section 7).
- **The column contract.** The words stay still only if the page opens in the card's text column and type (same width, line height and gaps), so the lines wrap exactly as on the card. `CardText` and `PageOpening` each give the line height their body renders at (`lineHeightFor`: type, Dynamic Type, Reading Size), and the two must match. Without it (a page at a larger Reading Size than the card, say), without a measured card (a deep link, a cold start), or under Reduce Motion, nothing moves: the Book goes under the veil and the whole page fades in over 200 ms from when the Book is half gone: paper and words together, never paper alone.
- **Screen readers read the letter once.** While the page is up it is modal (`accessibilityViewIsModal`, `aria-modal`) and the Book hides itself (`useHiddenBehindCardPage()` on its root: react-native-screens' transparent modal leaves the presenting screen reachable). The carried copies are hidden, and the page's own opening is hidden while a copy stands in for it. When the page has arrived (carried or faded), focus moves to the element the page gave `focus` (its dateline or heading).
- Dismiss (swipe down, back button, Android back): the words are carried back into the card while it is still visible (the opening is measured again, as the page may have scrolled), else the page fades out over 200 ms and the Book returns from when it is half gone, then `router.back()`.
- Chapter interior: first 6 cards `enter`, 30 ms stagger.
- Haptic none. RM: the hand-off above (the Book under the veil, then the page over 200 ms).

### (g) Read together
- Clock: on each player status update write `{posMs, at, rate}`; per frame `pos = posMs + (now - at) * rate`, re-anchored on update, seek, pause. Speed 0.75x is automatic.
- Word index: binary search of word start times on the UI thread; highlight at `start - 50 ms` **(opinion; tune)**. Words under 120 ms merge with the next so the wash never flickers (M3 warns on fast blinking).
- Layout: words as inline `Text` items in a wrapped row (Latin/Devanagari runs per DESIGN_LANGUAGE), each measured by `onLayout` into a shared rect array; paragraph exposed as one accessibility element. One `accentSoft` wash (radius 4) moves x/width with `S` along a line; on line change it fades out 80 ms and in on the new line, no diagonal slide.
- Line follow: hold the current line at 40% height; beyond ±1 line, UI-thread `scrollTo` over 450 ms, M3 easing. A user drag suspends follow; "Follow along" pill resumes; auto-resume after 4 s idle.
- Haptic none. RM: wash jumps (DESIGN_LANGUAGE spec); scroll pages: line past 75% height jumps to 25%.

### (h) Milestones: first letter, 100 letters, first grandparent letter
- An inline note card in the Book at that letter's place, never a modal. Line drawing (envelope, moon; `react-native-svg`) draws once via `strokeDashoffset` over 1.2 s, then text fades in: "Asha's first letter. From Papa, Month 2." / "One hundred letters for Asha." / "Nani wrote to Asha."
- Once per reader, no sound, no extra haptic (save already gave `success`), no push.
- RM: drawing shown complete, 200 ms text fade.

### (i) Tabs and sheets
- Tabs (JS tabs today; NativeTabs is the recorded next step): the native swap, no custom transition and no haptic. What changes between tabs is the light: the lamps share `persistKey="tabs"`, so the arriving tab starts at the light the last one left and settles to its own over `lamp.returnMs` (5k, 5l row 6).
- Sheets (`ui/sheet.tsx`, @gorhom/bottom-sheet): rise on the `standard` spring. Reduce Motion: our own sheet, so nothing slides; it and its scrim fade in and out over `fadeMs`. The room behind keeps its lamp and pauses its breath while the sheet is up. Sheet content adds no entrance.
- Reading Size: font size never animates; text cross-fades 150 ms, scroll anchored to the 40% paragraph; `selection` haptic per step.
- Push/back: platform default, including Android predictive back.

### (j) Empty states
- One element (moon or envelope) breathes opacity 0.85↔1 over 8 s (Calm's slowest pace, M10), only while focused and app active. Text and action static.
- Off under RM, Low Power Mode (`expo-battery`) and Android animator scale 0.

### (k) Lamp light
- The website's lamp on the app's paper: one warm radial pool (`Lamp`, `components/ui/lamp.tsx`; `LampView` outside a navigator, for the age gate). Never on a screen that records or plays a voice, sells, or reports a problem (principle 1: continuous motion follows a real signal, and this one does not).
- **Scenes** (`tokens.atmosphere.scene`, EXPERIENCE_PASS 5.1 and 5.2). `<Lamp scene="..." />` resolves the anchor, tones, intensity and breath:

| Scene | Where | Anchor (dark geometry; light: Shape, light) | Core, tail | Intensity | Breath |
|---|---|---|---|---|---|
| `gate` | the age question and the stop screen | centre (0.5, 0.42, r 0.8) | gold, amber | 0.6 | still |
| `welcome` | welcome | top (0.5, 0, r 0.95) | gold, amber | 1.0 | breathes |
| `form` | the promise, naming, signing | top | gold, amber | 0.5 | still |
| `finish` | "The book is open." | top | gold, amber | 1.0 | breathes |
| `tonight` | Tonight | top | by daypart (below) | by daypart | breathes |
| `write` | Write | top | gold, amber | 0.5 | still |
| `book` | the Book, behind the header | top | gold, amber | 0.6 | still |
| `family` | the Family tab | top | gold, amber | 0.4 | still |
| `readTogether` | Read together, evening and later only | bottom (0.5, 1, r 0.9) | dusk, dusk | 1.0 | still |

  Tonight's dayparts (`atmosphere.daypart`, the greeting's own keys): early morning and morning gold 0.7; midday and afternoon gold into amber 0.6; evening gold into amber 1.0; night amber into rose 0.9; late night amber into dusk 0.8. Without a scene the lamp is #99's warm pool (gold into amber, breathing), so screens that have not moved to scenes keep their light.
- **Shape, dark.** #99's stops (offsets 0, 0.38, 0.66, 1; opacities 1, 0.45, 0.12, 0) as one smooth curve (a monotone cubic through them, drawn as 21 even stops plus #99's own, so its values are kept exactly and there is no corner to show as a ring); the core tone at the centre turns into the tail tone by the first stop, each at `falloff x peak.dark[tone]`; an ellipse the shape of the screen, at the anchors in the table. The intensity is the layer's opacity, so only opacity ever moves.
- **Shape, light (paper).** The website's lamp on paper: a large, soft, round pool (radius a share of the longer side, the site's vmax) whose core sits above or beside the text block, never on it (`PAPER_ANCHORS` in `lamp.logic.ts`: top (0.5, -0.1, r 1.15), centre (0.5, 0.3, r 0.9), bottom (0.5, 1.1, r 0.95)). Falloff `(1 - t^2)^1.8` drawn as 21 evenly spaced stops, so the curve has no corner (the old four stops showed as rings), and the colour moves from the core tone to the tail tone along the radius, warmer and deeper toward the edge. On paper the dusk is drawn in its paper tone (`tokens.atmosphere.paperTone.dusk` #B881AF, the website's dusk and rose half and half), so late night and Read together stay dim but warm: the website's dusk blue mixed into amber over cream read grey. Over the pool, inside the same layer and in both schemes, the website's film grain (`tokens.atmosphere.grain`, a 128 px tile drawn at 3 pixels per point, 11 KB, signed specks of a few levels; on night paper at `darkOpacity` 0.18, under two levels at its brightest, a dither, not a texture): an 8-bit display shows no rings in the soft tail, and the grain comes and goes with the light.
- **Peaks** (`tokens.atmosphere.peak`): light amber 0.35, gold 0.78, rose 0.17, dusk 0.14 (its paper tone); dark amber 0.18, gold 0.16, rose 0.24, dusk 0.30.
- **Contrast where text sits** (`tokens.atmosphere.onLitPaper`). Dark: every text colour keeps 4.5:1 everywhere. Light: the reading colours (`text`, `textMuted`, `accent`, `focus`) keep 4.5:1 everywhere, even at the core; the status colours (`success`, `caution`, `recording`, `destructive`) keep 4.5:1 outside the core: in a room lit from the top, from 70 percent of the height down (`STATUS_CLEAR_FROM`), where Tonight's "A quiet day, kept." sits; never on the gate or behind Read together's controls (in a card or an inline state they are on their own surface). `packages/design-tokens/test/atmosphere.test.ts` recomputes each peak's limit with a margin; `apps/mobile/test/lamp.test.ts` samples every scene and daypart over the whole screen of three phones the way SVG interpolates it (grain included), and checks each text box measured on the web build (Tonight, the age question, the welcome) in its own colour, under the lamp each screen mounts today and the scene it will move to. A source scan keeps the rule tied to the screens: in every room the lamp may light, and every feature component it renders, a status colour (a `tone`, a `c.` colour, a class, a destructive button, a field's `error`, which TextField draws in `caution`) is allowed only where a measured box below the core, or a surface of its own, is named; the gate and Read together allow none. The old whole-pool cap (light amber 0.12, set by `caution` at the core) read as plain white.
- **Arrive, rise, dim.** Only the first lit room after a cold launch arrives over `lamp.arriveMs` (1.2 s, M3 easing); every later lamp in the session comes up as a return (`lamp.returnMs`, 280 ms), unless it asks to `arrive` (Read together's dusk pool, once per opening; the second parent's first Book). Inside one room, a change of intensity (welcome 1.0 to the form steps 0.5, "Not much today" to `lamp.dimTo` 0.7 of the evening) moves over 1.2 s, and a change that moves the pool cross-fades two layers over 1.2 s: the paper is never unlit in between.
- **persistKey** (two keys, `LAMP_KEYS`). A lamp with the same key that was lit earlier this session mounts at its last level and never arrives again. `firstRun`: the gate and onboarding share one light, and each step rises or dims to its scene over `arriveMs` (the gate's centred pool cross-fades to the welcome's top light). `tabs`: Tonight, the Book and the Family tab; the arriving tab starts at the tone and level the last one left and settles to its own over `returnMs` (Tonight's daypart light to the Book's still 0.6 and the Family tab's 0.4).
- **Unlit rooms** (`useUnlitRoom()` in `lamp.tsx`). A screen with no lamp that covers a lit one (Listen, Review, Read together, the letter page) calls it while focused: every lamp underneath eases to 0 over `lamp.leaveMs` (160 ms) and back over `returnMs` when the cover leaves, so the light never cuts. A lamp in the covering room itself (Read together's dusk pool) is not covered. A sheet is not an unlit room: under it the room keeps its light and pauses its breath. A Settings push slides the lit screen away with its light intact.
- **Breath.** Only where the scene breathes: opacity down 12 % and back over 9 s (`breathMs`; the site's swell is 8.6 s), a Reanimated CSS animation on one wrapper (native, no JS per frame; a real CSS animation on web). Once attached it is paused, not removed, when a still scene follows, so the light never snaps up. No flicker (the site's filament flicker is not ported), no colour drift, no blur. The site's 2 % scale swell is not ported: scaling a full-screen layer dropped frames in a headless-Chromium measurement (12 slow frames in 8 s against none with opacity alone, none under Reduce Motion).
- **Off:** Reduce Motion (no arrival, no rise, no breath, no leave or return: the final state, still, at once), Increase Contrast and Reduce Transparency (plain paper), a screen that is not focused, a sheet over it or the app in the background (the breath pauses). Low Power Mode is not read: that needs `expo-battery`, a new dependency (D-065); the loop is one native opacity animation.
- Ported from the website: the grain (above), because the larger, softer pool showed 8-bit rings without it, and #99's four stops showed faint ones in dark. Not ported: the paper texture and the vignette (the paper token stays the paper).

### (l) Moving between rooms after first run (EXPERIENCE_PASS 5.8)
First run is one lit room (5k, `persistKey="firstRun"`). After it the app is a small house: three rooms you walk between (Tonight, the Book, the Family tab), two rooms you step into where the lights change (Listen, Read together), two pages you hold (Review, full screen, and Write, a sheet), a drawer (Settings) and small asks over a room (sheets). The rules:

1. **The lamp never cuts.** An unlit room covering a lit one fades its lamp over `lamp.leaveMs` (160 ms) and brings it back over `lamp.returnMs` (280 ms) (`useUnlitRoom()`, 5k). Only the first lit room after a cold launch arrives over `arriveMs`; every later entry is a return, except Read together's dusk pool and the second parent's first Book.
2. **Content never re-enters on a return.** Tonight's stagger plays on a cold launch only; a return from Listen, Review, a letter or Settings, and a tab switch, move no content.
3. **Controls are there from the first frame** of every transition (principle 2).
4. **Native first.** Tabs swap with no animation; pushes, sheets and alerts are the platform's. We add opacity on top (the lamp, a dissolve, content entering) and three custom moves: file into month (5e), card to page (5f) and the page turn (5m).
5. **Short and interruptible.** Under `sequenceMaxMs`, except the save-to-Book hand-off (about 1.1 s, under the 2 s `hardCeilingMs`); a tap lands on the end state.
6. **Reduce Motion.** Every custom move is one `fadeMs` cross-fade; the lamp jumps to its level; native pushes and sheets follow the system's own reduced transition; nothing we control slides (our Sheet fades with no travel).

Presentation and animation per route live in one table, `routeTransitions` (`lib/transitions.logic.ts`, exported by `lib/motion.ts`; tested in `apps/mobile/test/transitions.test.ts` and `design-system-gaps.test.ts`). `app/_layout.tsx` reads it through `useRouteTransitions()` for every `Stack.Screen` and types no presentation, animation or duration.

| Row | From, to | Route option (the table) | Built by |
|---|---|---|---|
| 1, 2 | Tonight to Listen and back | `listen`: `fullScreenModal`, `animation: 'fade'`, `route.dissolveMs` (Reduce Motion `fadeMs`) | P1 (table), P3 and P4 (Speak's press, Listen's `useUnlitRoom()` and its words entering) |
| 3 | Listen to Write | `write`: `modal` (the platform's rise); Write's own `write` lamp returns | P4 |
| 4 | Listen to Review, and Tonight's "Read it back" | `review`: `fullScreenModal` (was a page sheet), `animation: 'fade'`, `route.dissolveMs`: a voice room hands to a reading room with no change of shape | P1 (table), P4 |
| 5, 5a | Review or Write to the saved moment to the Book | `fileIntoMonthPlan()`: 5e in Review until `sequenceMaxMs`, Review fades out over `fadeMs`, the Book comes forward on the new letter (`arrived=<entry id>`), its lamp returning, then the 1.6 s wash | P4 (the sequence, the `arrived` param), P5 (the arrival) |
| 6 | Tab switches | none: the native swap; the lamps share `persistKey="tabs"` and settle over `returnMs` | P1 (the lamp), P3, P5, P8b (pass the key) |
| 7 | Book to a letter, and back | `letter/[id]` keeps the platform push until its page mounts `CardToPage`; then the table's `cardToPage` move (`transparentModal`, `animation: 'none'`) and 5f | P5 (asks P1 to flip the row) |
| 8 | The Book or a letter to Read together | `read-together`: `fullScreenModal`, `animation: 'fade'`, `route.dissolveMs`; the dusk pool `arrive`s at night; inside it, the page turn (5m) | P1 (table), P5 |
| 9 | To Settings, and back | none: the native push; the lit screen keeps its light | P6 |
| 10 | Any sheet | sign-in, invites and the purchase confirmation are `modal` in the table; `ui/sheet.tsx` sheets rise on `standard`; the room keeps its light and pauses its breath | P1 (table, Sheet), P8 |
| 11 | Toasts | a toast enters with `enter`, exits with `exit`; a new toast cross-fades over the one on screen (`swapMs`), never stacked (COMPONENTS 2.14) | P1 |
| 12 | Joined to the Book (the second parent) | none: the invite sheet dismisses natively; the Book's lamp `arrive`s, from 0 to 0.6 over `arriveMs` | P8 |

- **Hand-off, not pile-up.** Two screens of words never sit on top of each other mid-move: the page turn's leaving words are gone by 35 % of the way (`HAND_OFF`) and the next ones start as the old are half gone. A plain cross-fade of two text-heavy screens reads as a mess.
- Every number is a token (`fadeMs`, `exitMs`, `enter`, `standard`, `route.dissolveMs`, `lamp.leaveMs`, `lamp.returnMs`, `file`, `pageTurn`, `cardToPage`, `newMarkMs`, `swapMs`, `sequenceMaxMs`).
- On the web preview the native stack does not animate; sheets, the lamp, the page turn and card to page do.

### (m) Read together: the page turn
- `PageTurn` (`components/motion/page-turn.tsx`): "Next letter" moves the page `pageTurn.dx` (24 pt) left over `exitMs` while its words fade early; the next page arrives from 24 pt right on `standard`, starting as the last is half gone. "Back one" reverses it. No curl.
- A horizontal swipe does the same and follows the finger; past a quarter of the width, or flung, it turns, otherwise it settles back on `snappy`. At the first or last letter the page meets a soft edge (a quarter of the travel). Interruptible: springs start from where the page is, and a key that comes back mid-turn simply arrives again.
- The leaving page takes no touches and is hidden from VoiceOver; the buttons stay the screen's own (every gesture has a button).
- Reduce Motion: a 200 ms cross-fade; the page does not follow the finger. Haptic: none (playback has none).

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

1. Answered (EXPERIENCE_PASS S11): `breathIdleMs` is 7500, 8 breaths a minute, Calm's slowest pace (M10). Was 4000 (15 a minute).
2. Confirm expo-audio metering rate and dBFS range on Android.
3. Tune `leadMs` and 120 ms dwell with grandparents at Large Print.

## Sources

M1 [Airbnb: Motion engineering at scale](https://medium.com/airbnb-engineering/motion-engineering-at-scale-5ffabfc878) · M2 [HIG Motion](https://developer.apple.com/design/human-interface-guidelines/motion) · M3 [HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) · M4 [iPhone J.D.: Memories](https://www.iphonejd.com/iphone_jd/2017/10/memories.html) · M5 [MacRumors: Books page turn](https://www.macrumors.com/how-to/re-enable-page-turning-animation-apple-books/) · M6 [Books Asset Guide: Media Overlays](https://help.apple.com/itc/booksassetguide/en.lproj/itcf373ff8f8.html) · M7 [PubCoder Read Aloud](https://docs.pubcoder.com/pubcoder-read-aloud.html) · M8 [HIG Live Activities](https://developer.apple.com/design/human-interface-guidelines/live-activities) · M9 [Apple Watch Breathe](https://support.apple.com/en-gb/guide/watch/apd371dfe3d7/watchos) · M10 [Calm breathing pace](https://support.calm.com/hc/en-us/articles/360000069973-Calm-Breathing-Exercises-How-to-Adjust-Speed-Timers-Haptics-Vibrations) · M11 [Headspace breathing](https://www.headspace.com/meditation/breathing-exercises) · M12 [Duolingo visemes](https://blog.duolingo.com/world-character-visemes) · M13 [MacStories: Things 3](https://www.macstories.net/reviews/things-3-beauty-and-delight-in-a-task-manager/) · M14 [MDC Android Motion](https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md) · M15 [Reanimated accessibility](https://docs.swmansion.com/react-native-reanimated/docs/guides/accessibility/) · M16 [RN AccessibilityInfo](https://reactnative.dev/docs/accessibilityinfo) · M17 [Reanimated SET](https://docs.swmansion.com/react-native-reanimated/docs/shared-element-transitions/overview/) · M18 [Expo zoom transition](https://docs.expo.dev/router/advanced/zoom-transition/) · M19 [expo#50049](https://github.com/expo/expo/issues/50049) · M20 [Expo native tabs](https://docs.expo.dev/router/advanced/native-tabs/) · M21 [Expo modals](https://docs.expo.dev/router/advanced/modals/) · M22 [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/) · M23 [Reanimated feature flags](https://docs.swmansion.com/react-native-reanimated/docs/guides/feature-flags/) · M24 [Rive pricing](https://rive.app/pricing) · M25 [Expo Lottie](https://docs.expo.dev/versions/latest/sdk/lottie/) · M26 [Rive Nitro runtime](https://github.com/rive-app/rive-nitro-react-native) · M27 [LottieFiles blog](https://lottiefiles.com/blog/lottie-animations/lottiefiles-or-rive) · M28 [Unicorn Icons](https://unicornicons.com/blog/lottie-vs-rive-performance). Versions and licences: npm registry, 2026-10-01.
