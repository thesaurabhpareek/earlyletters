# Moments tab: motion principles (A1)

Status: PROPOSED, 21 Nov 2026. Author: animation lead A1 of 5. Branch `wip/moments-a1`. Docs only. Nothing here is built, and nothing here has been seen on a device.

Where this doc disagrees with another doc, it says so and marks it **RECONCILE**. It does not change a ruling by itself.

## 1. Purpose and scope

This doc says how motion works in the new Moments tab: what moves, what never moves, how long, on which curve, and what happens under Reduce Motion. It also says how motion helps a tired parent holding a phone in one hand.

It covers:
- the tab as the default landing tab (cold launch, warm return, switching tabs);
- the value showcase before photo access, the plain ask, Not now, and the states after: allowed, Limited, declined, denied;
- the two parts, For you and Recent, and the switch between them;
- the day cards (collage, compose button), the written-prompt cards, the refresh control, the "a year ago" card;
- loading, empty and error states;
- the hand-off from a card to Write (capture).

It does not cover: A2 to A5 (other animation leads, their own scopes), the transitions between screens in detail (transition leads own those; this doc only states the motion rules they must keep), words (content), layout and visual design (the design concept), or whether we use Route A or Route B (feasibility). Where the route changes motion, the doc says so.

The shape of this doc follows the founder's direction: learn from what the screenshots do and do it in a smarter way for this product. For motion, "smarter" means quieter. Apple-style journaling pickers lean on collage, maps and colour. We keep to paper, and we never move to celebrate or to count.

## 2. Inputs read

Read this session, in a clone of the repo on `develop`:

| Input | Path or id | Used for |
|---|---|---|
| Brief of record | `/home/claude/moments-brief.md` | scope, constitution, privacy, reversals |
| Motion system v0.2 | `docs/design/MOTION.md` (268 lines, all of it) | principles 1 to 6, sections 4, 5a to 5m, 6 haptics, 7 performance |
| Design language v2 | `docs/design/DESIGN-LANGUAGE-V2-21nov.md` (sections 4.6, rules, glass limits, checks) | `motion.heroEnter`, `motion.symbol`, glass and fallback rules, the gate |
| Component specs | `docs/design/COMPONENTS.md` (0.3 motion, Card, EmptyState, Lamp, CardSource, PageTurn rows) | which MOTION rule each component uses |
| Tokens | `packages/design-tokens/src/tokens.ts` lines 305 to 385 (`motion`) | what already exists |
| Open PRs | `gh api repos/thesaurabhpareek/earlyletters/pulls?state=open` | #1264 (Home engagement wheel) is open; #773 (first-run story cards animation feasibility) is open |

Not read, so not relied on: PR #1264's content, the Moments concept, feasibility and privacy docs (not found as open PRs or `wip/moments-*` branches when I looked). **Assumption:** the concept doc will put For you and Recent under one top switch, with day cards as paper cards with a collage and a compose button. If the concept doc differs, reconcile in section 8 (open question Q1). I did not open the founder's screenshots. They are not needed for motion rules and they hold real family details.

Not re-fetched this session: the Apple, Reanimated and Material pages that `MOTION.md` cites (M2, M14, M15). I rely on `MOTION.md` for them and mark such claims "per MOTION.md". Apple's own picker animations: **UNVERIFIED**, not observed.

## 3. How motion works in this tab

### 3.1 The one idea

Moments is a quiet shelf of paper. Things sit still. Motion is for four jobs only: say where you went, say what you just did, bring a state change in softly, and keep your place. It never says "look at this", "well done" or "more".

### 3.2 Six rules (MOTION principles, applied)

1. **Paper first.** Content is paper and does not move on its own. No auto-playing video, no drifting collage, no parallax, no Ken Burns on a photo (MOTION benchmark: avoid; zoom is what Reduce Motion removes). Glass stays on navigation and controls, never on cards (DESIGN-LANGUAGE-V2).
2. **Never celebratory about counts.** No number counts up or down. No badge, dot, pulse or bounce on the tab for "new moments". No "you have N moments" moment. No ring, bar or fill that shows how much has been found. Where a count is a fact on screen (a video's length), it is plain, static text.
3. **Controls never animate in** (MOTION principle 2). The compose button, the Not now and Allow buttons, the switch and the refresh control are opaque and hittable from the first frame, on every state.
4. **Interruptible, and never between you and the next tap** (principle 4). Any tap lands on the end state. Nothing blocks input.
5. **Motion follows a real signal.** No loops on this tab, except the lamp's existing slow breath where a scene allows it (section 4.7). No shimmer, no pulsing skeleton. A shimmer would read as "the machine is working through your photos". We do not say that and we do not look like it.
6. **Never suggest the machine writes.** Nothing types itself, fills in, "composes" or assembles a title. A day card has no title we made, so there is no title to animate in (constitution; brief, Decisions of record). A parent's own words, once they exist, are never faded, swapped or reflowed for effect.

### 3.3 The tired parent, one hand

Written for the thumb at 11 pm with a baby on the other arm.

- **Nothing moves under the thumb.** When a list updates, rows below the finger do not jump. Insertions above the visible area do not shift what is on screen (scroll anchoring, MT-A1-R9). Images that load do not change a card's height: the collage frame is the same size before and after (R8).
- **One tap, one place.** Compose is a single tap that opens the capture sheet (a native rise). There is no gesture-only path. Every swipe has a button (MOTION 5m rule). No long-press-only action.
- **Short and quiet.** Every move on this tab is 150 to 420 ms, all under the 900 ms sequence ceiling. Most are cross-fades. There is no entrance a parent has to wait for before acting.
- **Your place is kept.** Coming back from capture, from Settings or from another tab restores the scroll position and the part (For you or Recent) with no entrance replay (MOTION 5l rule 2).
- **Reach.** Motion does not change reach, but it must not hide it: the compose button sits on the card, and we do not move it to a corner on scroll. No floating control that hides on scroll and reappears (that is motion that makes a tired parent hunt).
- **No sound, no surprise haptics.** Sound stays off here (SOUND.md: not read this session; assumed unchanged, **UNVERIFIED**). Haptics follow section 6.

## 4. What may move, and what never moves

### 4.1 May move (allowed list)

| # | What | How | Why |
|---|---|---|---|
| 1 | The first view of the tab on a cold launch | `enter` (opacity 0 to 1, y 8 to 0, 280 ms) on at most the first 3 blocks, 30 ms stagger, whole thing under 400 ms | cold launch is the one time the app "opens"; per MOTION 5a |
| 2 | Value showcase hero, first ever view only | `motion.heroEnter` (proposed in DESIGN-LANGUAGE-V2 4.6: dy 12, 420 ms, `standard`), content only | the one warm arrival; once per install |
| 3 | Our illustrated examples (Asha content) | static paper cards by default. Optional: `LineArt` draws once (`drawMs` 1200) on first ever view, then stays complete. Tap skips | it is an example, not a promise (J5) |
| 4 | Switch between For you and Recent | cross-fade `swapMs` (150), no slide, no scroll reset, each part keeps its own scroll position | words replaced in place (MOTION 5i Reading Size precedent) |
| 5 | Thumbnails loading into a collage | fade `fadeMs` (200) from the paper-tone placeholder, only if they were not ready on first paint (R8) | no pop-in |
| 6 | Permission state change (ask to allowed, ask to Not now, allowed to Limited) | in place cross-fade `fadeMs` (200) of the changed block; the tab header and switch do not move | calm, no celebration |
| 7 | Refresh of a written prompt | the prompt text cross-fades in place `swapMs` (150); card height may change only by the layout spring `standard` and only if the text needs another line (R10) | words replaced in place |
| 8 | Press feedback | `press` tokens: control 0.97, card 0.98, on `snappy` | feel of touch |
| 9 | Card to capture | the platform rise for `write` (`modal`), with Write's own lamp returning (MOTION 5l row 3). No card-to-page growth | native first |
| 10 | Day card removal or hide by the parent | exit `exitMs` (160) fade, then the cards below move up with `LinearTransition` on `standard`; "Undo" stays (MOTION 5d precedent) | honest feedback, reversible |
| 11 | Lamp | one still, warm pool behind the tab header where a scene allows (4.7) | tab lamp rule, MOTION 5k |
| 12 | Focus move after a state change | VoiceOver focus moves to the new block's heading, no motion | accessibility |

### 4.2 Never moves

- Photos and video thumbnails: no zoom, pan, parallax, crossfade-between-photos, or auto-advance. No live video preview or autoplay. No animated collage re-layout.
- Any number: no count-up, count-down, tick, odometer, bounce on change.
- The tab bar item: no badge, dot, pulse, bounce, or icon animation to attract. Native tab swap only (MOTION 5i).
- Anything that fills or progresses: no ring, bar, meter, "scanning" sweep, radar or sparkle over a photo or day.
- Machine-made text: there is none to move. A label that the parent typed or chose is never animated in a way that looks like it is being written.
- The compose button and the switch: no entrance, no hide on scroll, no wiggle, no attention pulse.
- Map tiles and place names (if a parent ever types or chooses one): no zoom-in, no fly-over, no pin drop. Static only. (Route A and B do not give us a map by default; the brief says none or parent-typed.)
- Text size: font size never animates (MOTION 5i).
- Blur and shadow: never animated (MOTION 7 rule 3). No blur-in on scroll (MOTION benchmark, Journal "avoid blur").
- Streak, level, reward or "welcome back" flourish of any kind. No confetti, no sound.

### 4.3 States, one by one

| State | What the parent sees move |
|---|---|
| Cold launch, no permission asked yet | value showcase in place; `enter` on the first 3 blocks (R2); hero enter on the very first install view (R3) |
| Warm return, any state | nothing moves; scroll position kept (R9) |
| Plain ask visible | static. Allow and Not now present from frame 1. The system permission alert is native and not ours to animate |
| Tapped Allow, system alert up | nothing of ours moves behind the alert |
| Granted (full) | the ask block cross-fades to the real day cards in place, `fadeMs`. Thumbnails fade in as they load (4.1 row 5). No count, no "found N" |
| Granted (Limited) | same as granted, and a quiet static line about choosing more; the system picker is native |
| Not now | the ask block cross-fades to the value showcase plus whatever real things exist (our prompts, typed days, a year ago from our own letters), `fadeMs`. It must not read as a punishment: no shake, no red, no sad drawing |
| Denied in Settings | static explanation block and a single Settings button; no motion beyond the cross-fade in |
| Loading from the library | static paper placeholders at final size (R8). No shimmer, no spinner over cards. If a wait could pass about a second, show one static plain line (words by content). Do not use a determinate or indeterminate progress ring |
| Empty (nothing yet) | `EmptyState` with its one breath loop only while focused and active; off under Reduce Motion, Low Power Mode (not read today, per MOTION 5k) and animator scale 0. It is the only loop in the tab (MOTION 7 rule 5) |
| Error | static message with a plain action. No shake. No red flash. Text colour is not the only signal |

### 4.4 Cards and scroll

- No scroll-linked effects: no sticky-header collapse animation of our own, no fade of cards as they leave, no scale on enter into view. (Apple Journal fades cards behind a fixed "+" and blurs them; per MOTION benchmark, we adapt the fixed control and avoid the blur.)
- Cards entering the viewport while scrolling do not animate. The `enter` stagger plays only on cold launch, never on scroll, return, or switch.
- The day card is one pressable element (COMPONENTS `Card`). Press scale 0.98 on `snappy`. The compose button inside it is its own control and does not scale the whole card when pressed alone.
- Pull to refresh (if the route needs it): the native control only. We do not restyle it, and it never shows a count.

### 4.5 The switch (For you and Recent)

- Motion: cross-fade `swapMs`, 150 ms, in place. No slide, no page curl, no horizontal pan between the parts. A slide implies a spatial order that is not real.
- Selected state is shown by weight and shape as well as colour (colour is never the only signal).
- Haptic: none (navigation, per MOTION 6 policy). This differs from Reading Size, which is a step choice and uses `selection`.
- Each part keeps its own scroll offset. Switching twice returns the parent to where they were, with no animation of scroll.

### 4.6 Refresh control on a written prompt

The refresh control (founder screenshots show one on Reflection cards) is a choice among our own written prompts, not a regeneration. Motion must not look like generation:
- No spinning icon, no sparkle, no shuffle animation. The icon is static; on press it takes the standard press scale.
- The new prompt fades in place over `swapMs` (150) while the old fades out in the same time (one cross-fade, never both words visible at more than a quarter strength; MOTION 5f hand-off rule).
- Haptic: `selection`, matching "put it back, pick alternative" in MOTION 6. Visible change always accompanies it.
- Under Reduce Motion: the same 150 ms cross-fade is already opacity only; no change.

### 4.7 Lamp

- Moments joins the `tabs` persist key (`LAMP_KEYS`, MOTION 5k), so the arriving tab starts at the light the last one left and settles over `lamp.returnMs` (280 ms). **Proposal:** a new scene `moments` that is still (no breath), intensity 0.5, anchor top, gold into amber. Reason: a breathing lamp behind dense thumbnails competes with them, and a still one is calmer.
- **No lamp** on the value showcase before permission, and none on the ask. MOTION 5k says never on a screen that "sells"; the showcase is a pitch and the ask is a request. A lit room would feel like pressure. **RECONCILE** with the design concept: if it wants the lamp there, it is a design call and A1 will accept a still scene at intensity 0.4 with no breath.
- Off under Reduce Motion (final state, still), Increase Contrast and Reduce Transparency (plain paper), and when not focused.
- Contrast: any status colour on this tab stays outside the lit core (MOTION 5k `onLitPaper`). Day cards sit on their own surface so the rule holds.

### 4.8 Cold launch: Moments is now the landing tab

MOTION 5a today describes Tonight as the cold-launch screen ("Tonight renders complete; only dateline, greeting, prompt card enter"). With Moments as the default landing tab (founder item 2, PROPOSED), that rule moves to Moments. **RECONCILE** (the integrator, Home owner and PR #1264 author must agree): 5a and 5l rule 2 apply to whichever tab is the landing tab. This doc assumes Moments. If Home stays the landing screen, nothing here changes except R2's tab name.

Also: the "first Book tab view per session" cover settle (5a) is unaffected.

## 5. Motion tokens

### 5.1 Use as they are (verified in `packages/design-tokens/src/tokens.ts`)

| Token | Value | Used here for |
|---|---|---|
| `motion.fadeMs` | 200 | state swaps, Reduce Motion, thumbnail fade |
| `motion.swapMs` | 150 | switch cross-fade, prompt refresh |
| `motion.exitMs` | 160 | a hidden card leaving |
| `motion.enter` | dy 8, 280 ms | cold-launch first blocks |
| `motion.staggerMs`, `staggerMax` | 30, 6 | cold-launch stagger (this tab: cap at 3, section 4.1) |
| `motion.easing` | [0.2, 0, 0, 1] | all timed motion |
| `motion.snappy` | stiffness 520, damping 46 | press, small toggles |
| `motion.standard` | stiffness 260, damping 30 | layout moves, sheets |
| `motion.gentle` | stiffness 90, damping 18 | not used on this tab except by existing components |
| `motion.press` | 0.97 control, 0.98 card, opacity 0.9 | press |
| `motion.sequenceMaxMs`, `hardCeilingMs` | 900, 2000 | ceilings (R1) |
| `motion.drawMs` | 1200 | optional one-time line drawing in the showcase |
| `motion.emptyBreathMs` | 8000 | empty state breath |
| `motion.lamp.returnMs` | 280 | tab settle |

Every spring has damping ratio at least 0.9 (existing token test), so there is no overshoot or bounce. That is a requirement here, not a nicety: a bounce on this tab would read as reward.

### 5.2 Proposed additions (PROPOSED, to the design systems lead; tokens.ts and its tests change together)

| Token | Proposal | Reason |
|---|---|---|
| `motion.heroEnter` | `{ dy: 12, durationMs: 420 }` as already proposed in DESIGN-LANGUAGE-V2 4.6; not yet in `tokens.ts` (checked this session) | value showcase first view. Needs adding by T6 |
| `motion.moments.placeholderGraceMs` | a short grace before a placeholder is shown or an image fades. Value: **to be tuned on device, not decided here** (I suggest starting at the press-feedback scale of a card, about 100 ms, and measuring) | avoid a flash of placeholder, then a fade, for images that decode instantly |
| lamp scene `moments` | see 4.7 | tab light |

Nothing else is new. No new spring, no new easing, no new duration over the 900 ms ceiling. Screens type no duration, colour or size (design systems rule); they read tokens through `useMotion()`.

### 5.3 Easing and duration cheat sheet

| Kind | Curve | Duration |
|---|---|---|
| Content entering (cold launch) | bezier `easing` | 280 ms, 30 ms stagger |
| Hero (first install only) | `standard` spring or bezier | 420 ms |
| In-place swap (switch, prompt) | linear opacity | 150 ms |
| State change (ask to cards) | linear opacity | 200 ms |
| Exit | bezier `easing` | 160 ms (exits quicker than entries) |
| Press | `snappy` | about 250 ms, no overshoot |
| Layout move after hide | `LinearTransition` on `standard` | about 400 ms |
| Lamp settle | linear | 280 ms |
| Reduce Motion | opacity only | 200 ms |

## 6. Haptics on this tab

Policy from MOTION 6: a haptic marks an outcome, never a navigation. A haptic always accompanies a visible change.

| Moment | Haptic |
|---|---|
| Tab swap, the switch, opening compose, Allow, Not now | none |
| Refresh a written prompt | `selection` |
| Attach or unattach a picked photo to a letter (if that lives on this tab) | `selection` (**proposal**, review with the haptics owner) |
| Hide a day, with Undo | none on hide; `selection` on Undo |
| Keeping a letter after capture | `success` (existing; owned by the save flow, not this tab) |
| Scroll, loading, thumbnails, permission change | none |

No new haptic names. iOS mutes haptics in Low Power Mode and while dictating, so nothing depends on a haptic alone.

## 7. Requirements

Format: id, user need in plain words, Given/When/Then, test layer. Layers: **U** unit (token or logic test), **C** component test, **E** end to end or device run, **R** review by design systems, **S** source scan. All PROPOSED. No requirement here changes a ruling; the reversals the founder owns are listed in the brief.

**MT-A1-R1. Nothing on this tab takes long.**
As a tired parent I want nothing to make me wait.
Given any motion on the Moments tab. When it plays. Then it ends within `sequenceMaxMs` (900 ms), and no single move is longer than 420 ms. A tap lands on the end state at once.
Test: U (a timeline table in `moments.logic.ts`, like `fileIntoMonthPlan()`, asserted against tokens), C (tap during motion lands on end state).

**MT-A1-R2. Cold launch is the only time content enters.**
Given a cold launch with Moments as the landing tab. When the tab first renders. Then at most the first 3 blocks `enter` (opacity, y 8, 30 ms stagger, whole sequence under 400 ms) and controls are opaque from frame 1. Given a warm return, a tab switch, a return from capture or Settings, a switch between For you and Recent, or scrolling. Then no content enters.
Test: U (stagger count and total), C (return path renders no enter), E (cold versus warm on simulator).

**MT-A1-R3. Hero arrival happens once per install.**
Given the value showcase seen for the first time on this install. When it renders. Then the content block uses `motion.heroEnter` once. Every later view uses R2 only. Under Reduce Motion it is a 200 ms fade.
Test: U (token present and tested), C (flag is stored on the device only; no analytics event for it).

**MT-A1-R4. Controls are there from the first frame.**
Given any state. When the first frame renders. Then Allow, Not now, the switch, the refresh control, and every compose button are opaque and hittable. No control fades, slides, staggers or appears after content.
Test: C (opacity and hit area at t=0 of each state), R.

**MT-A1-R5. No motion celebrates a count, and nothing counts.**
Given any change in the number of days, moments or photos. When the tab updates. Then no number animates, no tab badge or dot appears or pulses, no ring, bar, meter or sweep shows how much was found, and no sound plays.
Test: S (no counter, `withRepeat`, badge, or progress component in the Moments tree), C, R. This also holds for the "scanning" case in R12.

**MT-A1-R6. Photos and video stay still.**
Given a day card with a collage or a video thumbnail. When the card is on screen, scrolled, pressed or opened. Then no zoom, pan, parallax, autoplay, auto-advance or live preview runs. A video shows its length as static text. The only image motion is the fade-in in R8.
Test: S (no Ken Burns, `Video` autoplay, `scale` animation on image), R.

**MT-A1-R7. Springs never overshoot.**
Given any spring used on this tab. When it runs. Then its damping ratio is at least 0.9.
Test: U (existing `tokens.test.ts` check, extended to any new token).

**MT-A1-R8. Images load without moving anything.**
Given a day card whose images are not ready on first paint. When it renders. Then the collage frame has its final size from frame 1 (paper-tone placeholder), the card height does not change when images arrive, and images fade in over `fadeMs` (200 ms). Given images ready on first paint. Then no placeholder flash and no fade (grace per 5.2, tuned on device). No shimmer or pulse at any time.
Test: C (layout height equal before and after), S (no shimmer component), E device.

**MT-A1-R9. The list never jumps under the thumb.**
Given a list the parent is reading or scrolling. When data changes (new day at the top, a day hidden, images loaded, permission changed to Limited). Then the content on screen keeps its position (scroll anchoring), and only the hidden card's exit (R14) and its closing gap move anything. Returning from capture, Settings or another tab restores scroll position and the part (For you or Recent) with no entrance replay.
Test: C (anchor logic), E (device run with a data change during scroll).

**MT-A1-R10. The switch and the refresh are quiet cross-fades.**
Given the For you and Recent switch, or a refresh of a written prompt. When pressed. Then the changed area cross-fades in place over `swapMs` (150 ms), with no slide, shuffle, spin or sparkle, each part keeps its own scroll offset, the switch gives no haptic, the refresh gives `selection`, and the two prompts' words are never visible together above a quarter of their strength.
Test: U (timeline), C (no translate in the style), R.

**MT-A1-R11. Permission changes are calm.**
Given Allow, Not now, Limited or declined or denied. When the state changes. Then the changed block cross-fades in place over `fadeMs` (200 ms), the header and switch stay put, nothing shakes, flashes red or shows a sad drawing, and Not now leads to the showcase plus real things at once. Our motion never plays behind the system alert.
Test: C (each transition), E (simulator with permission states), R.

**MT-A1-R12. Waiting is shown without effects.**
Given the library is being read or a state is empty. When it takes time. Then static placeholders at final size show; no spinner over cards, no shimmer, no progress ring or bar. If a wait could pass about a second, one plain static line is shown (words from content). The only allowed loop is the empty-state breath (R15).
Test: S, C, R.

**MT-A1-R13. Card to capture is the platform's.**
Given a tap on a compose button. When capture opens. Then it uses the `write` route (platform rise, the room's lamp returning), the compose control keeps its press feedback until the rise starts, and there is no card-to-page growth or carried words. Back returns to the same scroll position.
Test: C (route table row), E. **RECONCILE** with the transition leads (route table `routeTransitions`).

**MT-A1-R14. Hiding a day is reversible and soft.**
Given a parent hides or removes a day from view. When confirmed. Then the card leaves over `exitMs` (160 ms), the gap closes with `LinearTransition` on `standard`, "Undo" stays until dismissed, and Undo brings it back at the same place without replaying a stagger.
Test: C, E.

**MT-A1-R15. One loop at most.**
Given any state of the tab. When it is focused. Then at most one loop runs (the empty-state breath, or the lamp's breath if a scene breathes; the `moments` scene is still). All loops stop on blur, app background, and a sheet over the tab.
Test: C (loop count with a spy on `withRepeat` and the CSS animation), S.

**MT-A1-R16. Reduce Motion: one mechanism.**
Given Reduce Motion is on (also if it changes while the app is open). When any motion on this tab would play. Then nothing slides or scales; the lamp is still; the hero and the cold-launch enter become one 200 ms fade; the switch and refresh stay as the opacity cross-fade; line drawings show complete; the empty breath is off. Components read `useMotion()`, never the setting.
Test: C (set the flag, assert no transform animation), S (no direct `AccessibilityInfo` read in the tab), E (toggle live on device).

**MT-A1-R17. Reduce Transparency and Increase Contrast.**
Given either setting. When the tab renders. Then the lamp is off (plain paper), our own glass controls use the solid `glassFallback`, and no motion depends on blur. The system tab bar adapts itself and is not painted by us.
Test: C, E (simulator), R.

**MT-A1-R18. Motion never carries meaning alone.**
Given any state change that matters (granted, declined, hidden, refreshed). When it plays. Then the same meaning is available in text and focus, not only in movement or colour.
Test: R, E (VoiceOver pass).

**MT-A1-R19. VoiceOver and focus.**
Given VoiceOver is on. When a state changes (ask to cards, switch, refresh, hide). Then focus moves to the heading of the new block, the change is announced once in plain words (content owns the strings), the leaving content is hidden from the accessibility tree and takes no touches, and the lamp and any drawing are hidden.
Test: C (accessibility tree), E device.

**MT-A1-R20. Largest text and small phone.**
Given AX5 on an iPhone SE 3 (375 by 667 pt), also Bold Text. When any state animates. Then no letter text is truncated, clipped or reflowed by the motion; font size never animates; targets stay at least 44 pt during and after motion.
Test: E (simulator, SE 3 and the largest iPhone, evidence says simulator or device), R.

**MT-A1-R21. No motion to attract.**
Given the Moments tab item. When anything changes in the library or in our content. Then the tab item does not badge, dot, bounce, glow or change icon. A new day never moves on its own while the tab is on screen except as in R9.
Test: S, R. This also protects the founder's rule: no streaks, points or badges, ever.

**MT-A1-R22. Haptics follow the outcome rule.**
Given the tab. When the parent switches part, opens capture, presses Allow or Not now. Then no haptic plays. Refresh plays `selection`. Nothing plays during scroll, load, or permission change. No new haptic name. Never gated: a haptic never delays a commit.
Test: C (haptic spy), R.

**MT-A1-R23. Privacy of motion.**
Given a log, a crash report or an analytics event. When motion runs or fails (for example an image fails to fade). Then nothing records a photo, a filename, an album, a place, a date, or the child's name. Motion flags (hero seen, Reduce Motion) stay on the device. No analytics event is added for any animation.
Test: S (allowlist unchanged), R with the privacy lead.

**MT-A1-R24. Performance.**
Given the tab on an iPhone SE 3 and a mid-tier 60 Hz Android (when Android is built). When scrolling a list of day cards with images. Then continuous motion runs on the UI thread, only `transform` and `opacity` animate (exceptions per MOTION 7), no frame exceeds 16.7 ms on the SE 3, and images are decoded at display size.
Test: E (device frame capture; a simulator number is not device evidence), S.

## 8. Edge and unhappy paths

- **Reduce Motion turned on mid-session:** subscribe to the change; loops stop at once and the lamp holds its final state (R16).
- **Low Power Mode:** not read today (needs a new dependency, per MOTION 5k). The only loop is a native opacity animation. No change proposed.
- **Permission changed in Settings while the app is in the background:** on return, the new state shows with the R11 cross-fade, no replay of the cold-launch enter.
- **Library change during scroll (iCloud sync, a photo deleted):** R9 holds. A card that disappears just closes its gap with `LinearTransition`; it does not announce itself.
- **Very large library:** no animation of loading progress. Day cards appear in order as ready, with the R8 frame; no stagger.
- **Many images fail to decode:** the placeholder stays static. No retry spinner, no error shake.
- **Interrupted sequence (a tap during the cold launch enter):** springs start from the current value; the tap lands on the end state (R1).
- **Android later:** same code, our press scale not the Material ripple (COMPONENTS), animator scale 0 reports reduced (per MOTION 4, "verify on device").
- **Route A, the system picker:** the sheet is Apple's. Its motion, its collage and its titles are not ours to change, and we write no motion over them. After the sheet closes, the picked photos arrive on our paper as in R8 and the card does not animate in. **UNVERIFIED:** how Apple's sheet moves. This doc does not describe it.
- **Route B, our PhotoKit read:** all of this doc applies as written.

## 9. Constitution, privacy and accessibility checks

| Check | Result |
|---|---|
| The machine never adds meaning | No machine title or caption exists to animate; no typing, building or assembling effect (rule 6, R10) |
| No counts, gaps, streaks, points, badges | R5, R21; no tab badge (also MOTION 5e) |
| Never implies AI writes | refresh is a cross-fade among our own written prompts, no sparkle or shuffle (4.6) |
| No fear, guilt, loss | Not now leads to a calm state; nothing shakes or reddens (R11) |
| Privacy: nothing about a photo in logs or analytics | R23 |
| WCAG 2.2 AA, Apple HIG | motion brief, cancellable, never the only signal (HIG Motion, per DESIGN-LANGUAGE-V2 table, MOTION 2); pause, stop, hide: no content auto-moves more than 5 s except the lamp's decorative opacity breath, which is off under Reduce Motion (**UNVERIFIED** against WCAG 2.2.2 wording; I did not fetch the standard this session) |
| Dynamic Type to AX5, letter text never truncated (D-027) | R20 |
| 44 pt targets, VoiceOver order, colour not alone | R4, R18, R19, R20 |
| Reduce Motion, Reduce Transparency, Increase Contrast, light and dark | R16, R17; contrast on the lamp per MOTION 5k |
| Glass only on navigation and controls, at most three | no card motion needs glass; R17 |

## 10. Open questions

| # | Question | Recommended default | Deadline |
|---|---|---|---|
| Q1 | Does the concept put For you and Recent under a top switch? Does it use a collage that could shift as images load? | top switch; fixed collage frame (R8) | before design handoff to `mobile` |
| Q2 | Is Moments the landing tab for cold-launch motion (4.8)? | yes, per founder item 2; 5a and 5l move with it | when the founder signs the IA reversals |
| Q3 | Lamp on the showcase and ask (4.7)? | no lamp before permission; still scene `moments` after | design concept review |
| Q4 | Optional one-time line drawing in the showcase (4.1 row 3)? | off in v1: static examples are calmer and cost nothing | design concept review |
| Q5 | Placeholder grace value (5.2) | measure on an iPhone SE 3 during the first build; do not set before then | first device run |
| Q6 | Haptic on attach or unattach a photo (section 6) | `selection`; review with the haptics owner | with the attach flow spec |
| Q7 | Can the switch be reached one-handed? It sits at the top of a tall phone. | keep it at the top for v1, and also keep both parts one tap apart; test with real parents; a swipe is optional, never the only path | usability test, before build 1 ships |
| Q8 | Should the pull to refresh exist at all on Route A? | no custom control; native only if the route needs it | feasibility result |

## 11. Dependencies

- Design systems: add `motion.heroEnter`, the `moments` lamp scene and the placeholder grace token with tests (T6).
- Transition leads: route table row for Moments tab (cold launch, tab settle, `write`); RECONCILE 4.8 and R13.
- Design concept doc: states, switch placement, collage layout, lamp choice (Q1, Q3, Q4).
- Feasibility doc: Route A or B, the pull to refresh (Q8).
- Privacy and constitution doc: R23, the allowed label rules.
- Content: strings for the plain wait line and screen reader announcements (R12, R19). No strings are written here.
- `mobile`: build against `useMotion()`, never a raw duration; screens change go to `mobile`, not here.
- A2 to A5: no overlap intended; if another lead sets a different duration for the same move, tokens win.

## 12. VERIFIED, UNVERIFIED, guess

**VERIFIED (read this session):**
- `docs/design/MOTION.md`, whole: principles, section 4, 5a to 5m, 6, 7.
- `packages/design-tokens/src/tokens.ts` `motion` block: values in section 5.1; `heroEnter` is not in it.
- `docs/design/DESIGN-LANGUAGE-V2-21nov.md` 4.6, rules and checks: `motion.heroEnter`, `motion.symbol`, glass limits, D-098.
- `docs/design/COMPONENTS.md` motion rows (Card, EmptyState, Lamp, CardSource, PageTurn, routeTransitions).
- Open PR list: #1264 and #773 exist; no `wip/moments-*` branches yet.

**UNVERIFIED:**
- How Apple's journaling suggestions picker moves (not observed, not fetched).
- The claims in `MOTION.md` that cite Apple, Reanimated and Material pages (relied on, not re-fetched).
- WCAG 2.2.2 wording; SOUND.md content; PR #1264 content; the Moments concept, feasibility and privacy docs.
- Everything about frame time, feel and contrast: nothing was run on a device or a simulator.

**Guess (design judgement, labelled):**
- The 3-block cap on cold-launch enter, the no-lamp-before-permission default, `selection` for attach, the placeholder grace idea, and the claim that a shimmer reads as "the machine is working on my photos". All need a design review and a parent test.
