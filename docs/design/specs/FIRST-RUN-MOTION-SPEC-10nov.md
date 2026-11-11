# First-run motion spec: story intro, sign-in entry, app lock (10 Nov 2026)

Owner: design-systems (motion). Status: DRAFT for Karma's tier ruling. Docs only; no code, token or dependency changes are made by this PR.
Structure and states belong to the journey lead (`docs/first-run-journey-10nov`, not on origin when this was written: the cards below are my proposal and the journey doc wins on order, count and state names). Words belong to content; every line quoted here is placeholder copy.

## 0. Scope tiers (proposal for Karma)
- A, must-have for Build 12: sign-in entry motion, returning-user entry, lock cover and unlock (all exist or are small), Reduce Motion for each.
- B, stretch behind a flag: the 4-card story intro in section 3 with a Skip from frame 1.
- C, later: richer drawn line animation per card, per-card ambient sound (SOUND.md says none today).
Nothing in A needs a new token. B needs the `story` token block in section 2.

## 1. Principles (from the website and MOTION.md)
How the website moves (read: `apps/web/src/film/Scene.module.css`, `ScrollProgress.module.css`, `components/atmosphere/atmosphere.module.css`, `content/site.ts`): scenes pin one at a time, each scene's first frame equals the last frame of the one before, light is a lamp pool that breathes on an 8.6 s alternate loop (scale 1 to 1.022 and opacity, compositor only), nothing flashes, and under `prefers-reduced-motion` the scenes stop pinning, the progress rail is hidden and content simply flows. The app keeps that character:
1. One lit room. The story sits inside the existing lamp (`persistKey="firstRun"`, MOTION 5k); cards change words, not rooms.
2. Hand-off, not pile-up (MOTION 5l): the leaving words are gone by 35 percent before the next arrive. Never two screens of words at once.
3. Controls never animate in (MOTION principle 2): Skip, Continue, Sign in and Create account are opaque and hittable from frame 1 of every card.
4. Celebrate, never pressure. No countdown language, no "only N left", no pulsing call to action, no bar that fills faster as it nears the end, no streak or progress-guilt effect. The progress segments show where you are in a short tour; they never show what you owe.
5. The app never writes for the parent: no typewriter effect on words presented as the parent's, no "your story is being written" motion. Any sample letter is shown as a still, labelled sample, and its words appear whole (fade), never typed out.
6. Interruptible: any tap, swipe or hold lands on a valid state (MOTION principle 4). Motion only on `transform` and `opacity` (MOTION 7).

## 2. Tokens: reuse first, one proposed block
Existing, used as is (`packages/design-tokens/src/tokens.ts` `motion`, surfaced by `apps/mobile/src/lib/motion.ts`):

| Need | Token / helper |
|---|---|
| Words enter (opacity 0 to 1, y 8 to 0, 280 ms, 30 ms stagger, first 6) | `useMotion().enter(i)`, `enter`, `staggerMs`, `staggerMax`, easing `[0.2,0,0,1]` |
| Words leave (up 8 pt, 160 ms) | `useMotion().leave()`, `exitMs` |
| Card-to-card cross: leave, then enter | `exitMs` 160 + `enter.durationMs` 280 = 440 ms, inside `sequenceMaxMs` 900 |
| Reduce Motion form of any move | `fadeMs` 200, `ReduceMotion.Never` fade |
| Swipe settle, press | `springConfig('snappy')`, `press.scale` 0.97 |
| Screen enter/exit of auth | `route.dissolveMs` 280, `routeTransitions` |
| Lamp arrival on first card | `lamp.arriveMs` 1200 (once, cold launch) |
| Lock cover fade | `fadeMs` (already in `app-lock-layer.tsx`) |
| Lock offer swap | `swapMs` 150 (already in `lock-offer.tsx`) |
| Line drawing (tier C) | `drawMs` 1200 |

Proposed, tier B only, in `tokens.motion` with tests (reason: no token exists for a timed tour, and a progress clock must be linear because an eased bar reads as speeding up or stalling, which is the pressure we avoid):
```
story: { dwellMs: 6000, holdMs: 200, edgeZone: 0.3, linearBar: true }
```
- `dwellMs` 6000: time a card rests before moving on by itself. Reason: 3 to 4 short lines at default size read in under 5 s; 6 s leaves slack. UNVERIFIED as a reading-speed figure: no source read; confirm on device with the run sheet. Never shorten it for larger text, only switch auto-advance off (section 5).
- `holdMs` 200: press longer than this is a hold (pause), shorter is a tap. Reason: no tap/hold threshold exists in the repo's tokens (`highlight.*` is unrelated). UNVERIFIED against iOS's long-press defaults.
- `edgeZone` 0.3: left 30 percent of the card is "back", the rest "forward". Skip and the auth buttons sit outside the zones.
- Bar fill uses a linear timing of `dwellMs`; this is the only linear animation in the app and is a clock, not a transition.

## 3. Storyboard, one per card (proposal: 4 cards; journey doc wins)
Card order follows the website's own arc (S01 to S07 in `site.ts`) so the app and site feel like one product. Copy is placeholder; privacy and promise lines are excluded here because the website's "Kept on your iPhone" line is untrue for Build 12 (PRs #768, #769) and counsel has not read any replacement. Do not carry that line into a card.

Common frame (all cards): paper background and lamp from the first frame; progress segments at top (section 4); Skip top right, 48 pt minimum target (CTO ruling 11 Nov), opaque; the card's words in the lower half; no child name (use the `{child}` slot only if the journey doc says the name is known, which at first run it is not).

| t (ms) | Card 1 "A quiet evening" (site S01) | Card 2 "A minute is plenty" (S02, S03) | Card 3 "It stays in your words" (S04) | Card 4 "Month by month" (S06, S07) |
|---|---|---|---|---|
| 0 | Lamp arrives from 0 (`arriveMs` 1200, first launch only). Segment 1 starts. | Previous words leave (160). Lamp holds. | Same. | Same. |
| 0 to 280 | Line 1 enters (`enter(0)`). | Headline `enter(0)`. | Headline `enter(0)`. | Headline `enter(0)`. |
| 30 to 310 | Line 2 `enter(1)`. | Support `enter(1)`. | Support `enter(1)`. | Support `enter(1)`. |
| 300 to 1500 | Still: one drawn window or lamp line (`drawMs` 1200 once, tier C; tier B is a static drawing). | Static speaking circle drawing. It does NOT breathe: Principle 1 of MOTION reserves the glow for a real voice signal. | Two stacked still lines: the spoken sentence and the same sentence with a small underline on one removed filler. The underline fades in once (`fadeMs`), no typing. Label reads as a sample. | Three still month chips; the middle one takes the accent wash once (`newMarkMs` 1600 wash at `fadeMs` in), then rests. |
| rest | Holds until `dwellMs` or tap. | Same. | Same. | Last card: bar fills, then it STOPS. No auto-advance to auth; the choices are already on screen (section 6). |
| exit | words leave 160 | words leave 160 | words leave 160 | content stays; auth buttons are already there |

Card 3 shows an edit as the product really does it (a removal that is reversible); it must not show words added or rewritten. Whether card 3 shows "put it back" is the journey lead's and content's call; the motion is the same fade either way.

## 4. Progress bar
- N segments (one per card), 2 pt tall equivalent, 4 pt gaps, at the top inside the safe area. Visual only: `accessibilityElementsHidden`; VoiceOver instead hears "Card 2 of 3" on the card (words by content).
- Completed segments are full, the current one fills left to right over `dwellMs` with `transform: scaleX` (origin left, compositor only), upcoming are empty. Colours from the semantic tokens (rule `accentSoft` track, `accent` fill); contrast of the fill against the track must be checked in both themes (non-text 3:1, WCAG 1.4.11).
- Pause: during a hold, while the app is inactive or backgrounded, and while Skip or any button is being pressed, the fill freezes (no reset). Resume continues from the same point.
- Going back refills the previous segment from empty (it is a fresh dwell) with no animation of the gap; going forward by tap completes the current segment instantly (no 160 ms ease: instant, the receipt is the card change).
- Last card: the fill reaches full and holds. It never pulses, flashes or reaches "urgent" colour.
- Reduce Motion, VoiceOver, Switch Control, or text size AX1 and larger: no fill animation and no auto-advance. Segments are static (current one full-accent, others empty), cards move only by tap on a visible Next button (section 5). Reason: WCAG 2.2.2 pause/stop/hide for auto-advancing content (rule remembered, UNVERIFIED this session; confirm against W3C page before sign-off).

## 5. Gestures
| Gesture | Behaviour | Reduce Motion / assistive |
|---|---|---|
| Tap right 70 percent | Next card (leave 160, enter 280). Mid-transition tap jumps to the end state of the transition, then it is the next tap. | Cross-fade `fadeMs`. |
| Tap left 30 percent | Previous card, same timings. On card 1, nothing happens (no bounce). | Same. |
| Hold (over `holdMs`) | Pauses the bar. Chrome is NOT hidden on hold (unlike Instagram), because Skip must stay reachable. Release resumes. | No auto-advance, so hold does nothing. |
| Horizontal swipe | The words follow the finger like the page turn (MOTION 5m: 24 pt `pageTurn.dx`, past a quarter width or flung it turns, otherwise settles on `snappy`). | No follow; a swipe past a quarter width triggers one `fadeMs` cross-fade. |
| Swipe down | Nothing (it is not a modal; no dismissal gesture, Skip is the exit). | Same. |
| Skip | Ends the tour from any card: words leave 160, auth entry (section 6) arrives. No confirmation, no "are you sure". | Same. |
Every gesture has a button: visible Back (off on card 1) and Next buttons exist for VoiceOver, Switch Control and Reduce Motion users, 44 pt targets, placed at the bottom, never animated in. VoiceOver focus lands on the card headline after each change and the old card is `aria-hidden` while leaving (as the page turn does).
Haptics: none in the tour. Policy (MOTION 6, `haptics.shared.ts`): a haptic marks an outcome, never a navigation; Continue, Back and Skip are silent.

## 6. Transitions in and out of the tour
- Cold launch to card 1: the splash hands to the lit room; lamp `arrive` once, words enter. First launch only; relaunch before sign-up shows the tour again from card 1 only if the journey doc says so.
- Between cards: leave then enter (440 ms), no slide of the whole screen, lamp unchanged.
- The last card or Skip to auth entry: the route is the root stack's own (`routeTransitions`), `route.dissolveMs` 280, Reduce Motion `fadeMs`. The auth screen shares the lit room, so only words change. This collides with PR #764 (edits `onboarding.tsx`, `gate.logic.ts`, `use-first-run-route.ts`): whichever of the two lands second must add its route rows to `lib/transitions.logic.ts`, not to the screen files.
- Auth entry, A-tier: the two primary choices (Create account, Sign in) and any provider buttons are present from frame 1 and never stagger (principle 3). Only the headline and support line `enter`. Pressing a button uses `press.scale` 0.97 on `snappy`. A pending sign-in swaps the button label in place with `swapMs` 150 and shows a quiet in-button spinner that is replaced by a static "Working" word under Reduce Motion; never a full-screen blocker with motion. An error appears with `enter` and is announced, no shake (shake reads as scolding).
- Provider buttons: which providers exist is the journey lead's list; the repo has `expo-apple-authentication` and `@react-native-google-signin` configured (`app.config.ts`). Apple guideline 4.8 about offering Apple alongside others is UNVERIFIED (not read). Buttons are equal size and weight; motion treats them identically.
- Success: the auth screen leaves with `route.dissolveMs` into the next gate. No celebration confetti, no haptic (the outcome that earns `success` in this app is a saved letter).

## 7. Returning user and app lock
- Returning user, lock off: no tour, no auth screen; the app opens as today (MOTION 5a, cold launch `enter` on Tonight only).
- Lock on, cold start or beyond grace: the cover is drawn at once, no fade in (privacy; `machine.ts`), lock screen shows. The one automatic Face ID ask follows (`shouldAutoPrompt`); the system sheet is not ours to animate.
- Unlock: the layer fades out over `fadeMs` 200 (`app-lock-layer.tsx`, already `ReduceMotion.Never`, so identical under Reduce Motion). Nothing slides, no checkmark animation, no haptic. The room underneath must already be rendered so that the fade reveals it with no content `enter` (rule 2 of MOTION 5l: no content re-enters on a return).
- Failed or cancelled Face ID: the lock screen stays; no shake, no red flash. Text changes by `swapMs` cross-fade; focus goes to Unlock.
- Lock offer (after sign-up, in context): `lock-offer.tsx` already swaps in and out on `swapMs` 150. Keep. It is offered, never required, and declining is a plain, equal-weight button with no motion difference from accepting. Per PRIV-R21 the offer's Shown, Records, Never and Decline lines belong to content and the journey doc, not here.
- Reduce Transparency: the cover and lock backgrounds are opaque paper, never blur (MOTION 7 forbids blur anyway).

## 8. Reduce Motion fallbacks, every animation
| Animation | Normal | Reduce Motion |
|---|---|---|
| Lamp arrival | `arriveMs` 1200 rise | Jumps to level (rule 6 of MOTION 5l) |
| Lamp breath | 9 s opacity loop | Off |
| Words enter | y 8 to 0 + fade, 280 | Fade `fadeMs`, no travel |
| Words leave | up 8 + fade, 160 | Fade `exitMs` |
| Swipe follow | Finger follow, spring settle | No follow; one cross-fade |
| Progress fill | Linear `dwellMs` | Static segments, no auto-advance |
| Line drawing | Draw `drawMs` | Fully drawn, no animation |
| Card 3 underline, card 4 wash | `fadeMs` in / `newMarkMs` wash | Present at once, no fade |
| Press scale | 0.97 on `snappy` | Opacity 0.9 only (`press.opacity`) |
| Auth route | `route.dissolveMs` | `fadeMs` |
| Button pending swap | `swapMs` + spinner | `swapMs` fade, static word |
| Lock cover fade | `fadeMs` | Same (it is the fallback) |
All of these go through `useMotion()` / `useReducedMotion()` (listens to `reduceMotionChanged`); no screen reads the setting itself.

## 9. Performance and devices
- Budget: no frame over 16.7 ms on the oldest 60 Hz supported iPhone (MOTION 7 names iPhone SE 3rd gen as the reference), animating only `transform` and `opacity`, the lamp breath plus the bar (one `scaleX` shared value on the UI thread) are two loops, one over MOTION 7's "one loop on screen" rule, so the lamp breath is paused while the tour is on screen unless the animation engineer measures that both fit. Both are compositor-only, so I expect they do (UNVERIFIED).
- Oldest supported device: `IOS_DEPLOYMENT_TARGET = '17.0'` (`apps/mobile/app.config.ts:44`, D-098). Which iPhones run iOS 17 (A12-era iPhone XS/XR and later) is from memory, UNVERIFIED; no Apple page was read. Measure on the oldest physical phone the team owns, not a simulator. `CADisableMinimumFrameDurationOnPhone` is already true (`app.config.ts:244`); the bar is time-based (`dt`), not frame-counted.
- Frame-drop fallback: if dropped frames are measured on the test phone, the first thing to remove is the lamp breath, then the stagger, never the Skip control.

## 10. Assets and size budget
- No video, no Lottie, no Rive (MOTION 9 recommendation: none in v1). The cards are SVG line drawings through `react-native-svg` (already used by `welcome-lockup.tsx`) with `strokeDashoffset` for the draw, plus tokens and text.
- Budget: each card illustration at most 6 KB of SVG path data, 24 KB for the tour, zero new dependencies, zero network fetches (the tour must work offline and before sign-in). These numbers are my proposal, not a measured limit.
- Drawings follow DESIGN_LANGUAGE (single-weight line, no mascot, no child's face, no photograph of a real family). The sample sentence on card 3 uses the fictional family Asha only, never real details, per CLAUDE.md.

## 11. Motion QA checklist
1. Each card, each theme: Skip reachable and opaque on frame 1; contrast of the bar and Skip passes (text 4.5:1, bar 3:1).
2. Reduce Motion on: no slide, no draw, no fill, no auto-advance; every card reachable by Next/Back buttons. Toggle it mid-tour: state is kept.
3. VoiceOver: order is card position, headline, support, Back, Next, Skip; the leaving card is hidden; focus lands on the new headline.
4. Dynamic Type to AX5: words never truncated, card scrolls if needed, auto-advance off at AX1 and larger, Skip still visible.
5. Hold pauses and resumes at the same fill point; backgrounding mid-card pauses; coming back does not skip a card.
6. Tap during a transition lands on the end state, no half-visible words, no two cards of text at once.
7. Last card: bar stops full, no auto-leave, no pulsing, the auth choices stay put.
8. Swipe past a quarter width turns; short swipe settles on `snappy`; first-card left tap does nothing.
9. Skip from card 1 and from the last card arrives at the same auth entry in the same time.
10. Auth: buttons present from frame 1; pending state announces once; error has no shake.
11. Lock: cover at once on background; unlock fades `fadeMs` with no flash and no content re-enter; cancel leaves the lock with no red.
12. Frame budget on the oldest physical iPhone available: record a trace through card 1 to 3, no frame over 16.7 ms; note device and iOS version in the QA sheet.
13. Low Power Mode and Reduce Transparency: nothing relies on blur or haptics.
14. Words check against the constitution: nothing typed out, nothing counted, no gap or loss language, no emoji, no real family data.

## 12. UNVERIFIED and open questions
UNVERIFIED: oldest iPhone that runs iOS 17; WCAG 2.2.2 wording; Apple 4.8 for Build 12 providers; dwell and hold numbers; SVG size numbers (proposals).
Questions for Karma, each with a recommendation:
1. Ship the tour in Build 12 (B) or only A? Recommend A only, given "word due Wed 11 Nov" is unmeasured.
2. Auto-advance at all? Recommend yes at default settings with every pause mechanism in section 4; if counsel or QA object, switch to tap-only with no change to the storyboard.
3. Four cards or three? RULED 11 Nov (CTO): three. The deck is `story.talk.v1`, `story.exact.v3`, `story.voice.v1`. The storyboard columns above were drawn for four; the "Card 4" column is withdrawn and the last card is card 3 (motion per card is identical). Rework of the table is for the motion owner.
Conflicts: none found, the journey branch was not on origin when written; re-check on its arrival (card count, state names, whether the lock offer lives in the tour). Collision named: PR #764 and the You tab/gate stack (#738, #724) in section 6.
