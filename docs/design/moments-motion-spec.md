# Moments motion spec: the flight, the tab, the cards, Reduce Motion and the frame budget

Status: PROPOSED (a design spec for `mobile`; it edits no PRD, token or code). Rulings it applies are quoted from `docs/design/moments-design-closure.md` (DC-n, G-nn) and carry their status there.
Date: 21 Nov 2026
Owner: `design-systems` (animation and motion lead seat)
Load when: you build or review any motion in the Moments tab, the pick host sheet, the Start hand-off or the Undo row.

## 0. Honest limits and how to read this

- I am a role a Claude session plays. I ran nothing on a phone and nothing in a simulator. Every statement about a frame, a decode, a layer order or a touch on an iPhone SE 3 is UNVERIFIED until a device row (DM-11, DM-12, DM-13, G7) or the spike in section 5.6 is run.
- Labels used here: VERIFIED (I read it in the repo or a page this session), RULED (the closure or a founder decision settles it), PROPOSED (my design choice), ASSUMED (a number or behaviour I chose or inferred, with the row that tunes it), UNVERIFIED (nobody has seen it on a device), DROPPED (an earlier draft rule that no longer stands).
- Sources read this session: `moments-design-closure.md` (merged, #1367); `docs/product/moments-tab/EXPERIENCE-AND-MOTION.md` (EXP, the v3 spec); `docs/design/MOTION.md`; `packages/design-tokens/src/tokens.ts` and its motion tests; `apps/mobile/test/tab-bar.test.ts`; `apps/mobile/src/lib/transitions.logic.ts`; `apps/mobile/src/components/app-lock/app-lock-layer.tsx`; `docs/tdd/01-mobile-client.md` line 530; `docs/engineering/readiness-20nov/performance/MEASUREMENT-PLAN.md`; PRD 28 rows R144 to R146, O-27, O-58; and the full text of the superseded drafts A1 to A5 (PR #1277, branch `docs/moments-motion`, head 0e218ada) and T1 to T5 (PR #1278, branch `docs/moments-transitions`, head 180198a4), fetched through the REST API. This spec does not depend on either PR merging. I read A1, A3, A4, A5 and T1 closely; A2, T2, T3, T4 and T5 I read by headings and the numbers cited here, not line by line. Anything I say about them is limited to that.
- Apple's hitch bands (section 7.3) were read on Apple's Tech Talk 10855 page this session. Nothing else here comes from an Apple page; what is said about Apple's picker is EXP's text and is UNVERIFIED.
- Words in quotes are placeholders for `content`. Fictional family Asha only. No new analytics event, log line or marker is added by any motion here (EXP 4.12; O-38 and O-49 stay No).

## 1. What the superseded drafts still say, against v3

A1 to A5 and T1 to T5 were written when Moments was the landing tab and the picker was a different route. v3 (EXP, the closure, PRD 28 after the fix pass) changed that. Restated, row by row, so nobody has to open the old PRs.

| Old rule | What it said | Status against v3 |
|---|---|---|
| A1-R1 | Nothing over 900 ms in a sequence, no single move over 420 ms, a tap lands on the end state | STANDS. It is PRD R144 and `motion.sequenceMaxMs`. Section 2 |
| A1-R2, R3 | Cold launch only; a hero arrival (`heroEnter` 420 ms) once per install | CHANGED. O-26 (RULED): A1's tokens, `enter` and `staggerMs`, first three blocks, once per install. No `heroEnter` (A3's 12 pt and 420 ms hit the single-move cap) |
| A1-R4 | Controls opaque and hittable from frame 1 | STANDS (MOTION principle 2; R144) |
| A1-R5, R21 | No counting, no badge, no dot, no motion that attracts | STANDS (R4, R52, DC-4: the tab bar never carries a badge) |
| A1-R6, R8, R9 | Pictures still; images load with no layout move; the list never jumps under the thumb | STANDS (PRD R146). Section 3.5 |
| A1-R7 | Springs never overshoot | STANDS, and made true by measurement not by clamp alone. Section 2.2 |
| A1-R10 | Switch and refresh cross-fade at `swapMs` | STANDS for the switch (EM-15). The refresh of a written prompt is not in v3 (no pull to refresh, EXP 5.8) |
| A1-R11, A3-R10, R16 | Grant and Not now are one calm change of one length | STANDS as EM-16, 590 ms. Section 4.1 |
| A1-R12, A2 | Static placeholders, no spinner, no shimmer | STANDS. Section 3.5 |
| A1-R13, A4 M3 to M10 | Card to capture is the platform's rise (write) or the table's dissolve (talk); option B carries the photo 320 ms | CHANGED. A card now opens the host sheet (EM-01) and Start is the only hand-off to capture (EM-07). A4's option B is the same idea moved to the tray tiles (DC-3). The question card and an age day with no picture still open capture directly (G-02), so M3, M4 stand for that path only. Section 3.4 |
| A1-R15 | One loop at most | STANDS. Moments has no loop at all |
| A1-R16, R17, A5 section 3 | One reader for Reduce Motion; Reduce Transparency and Increase Contrast adaptations | STANDS. Section 6 |
| A1-R24, A5 section 4 | No frame over 16.7 ms on an iPhone SE 3; 120 Hz is no worse than 60 Hz | STANDS. It is DM-12. Section 7 |
| A3 V0 examples (three examples settle in turn, a crescent draws 1200 ms) | | DROPPED. C-45 left one example in ACC-0 and a 1200 ms drawing breaks the 900 ms cap (the drawing in MOTION 5h is not a Moments move) |
| A3 "example expand" | Height 280 ms | DROPPED with the examples; the one example does not expand |
| T1-R7 | A tab switch is the platform cut; nothing of ours moves | STANDS. Section 3.1 |
| T1-R8 | Moments gets its own lamp row | CHANGED. O-25 (RULED): plain paper, no lamp on the tab or its cards. Section 3.1 |
| T1-R9 | One first-view settle per session | CHANGED to once per install (O-26) |
| T1-R10 | Mounting never blocks the swap | STANDS. Section 3.1 |
| T1-R13, R14, A1-R13 | Moments to Home to start a letter (J4 kept); capture from Moments (J4 reversed) | DROPPED. v3 starts a letter from a card through the host sheet and Start (EM-07), or directly for a card with no picture (G-02) |
| T1-R13 arrival wash on Home | `accentSoft` wash after a silent swap | DROPPED for Moments (nothing is highlighted on arrival, G-09) |
| T1-R17 to R19 | No badge or dot | STANDS |
| T1-R20 to R23 | State restore through a Moments visit | STANDS in intent; not restated here (a `mobile` row, not motion) |
| T1-R30 to R36 | Links and notification landings | CHANGED. G-09 and O-22: by kind, scroll 0, no card highlighted, focus on the heading. Section 3.1 |
| T1-R37 | One Reduce Motion table | STANDS, rebuilt in section 6 |

## 2. Rules every move obeys

### 2.1 Caps and law

All of these are PRD R144 and MOTION 5l and 7 restated; none is new.

1. Every sequence ends within `motion.sequenceMaxMs` (900). No single move exceeds 420 ms. The hard ceiling is `motion.hardCeilingMs` (2000) and nothing here goes near it.
2. A tap lands on the end state at once. Any control is opaque and hittable from the first frame; no control fades, slides or staggers in.
3. Commit first, animate after. Nothing waits for an animation (MOTION principle 3). A haptic never delays a commit.
4. Animate `transform` and `opacity` only. The two exceptions are the ones MOTION 7 already names: the growing paper surface (frame and radius, no children that reflow) and a transitioning card's `borderRadius`. Never font size, shadow, blur or a per-frame gradient. No text is ever scaled.
5. Motion runs on the UI thread in Reanimated 4.5.1 worklets. JS writes targets, never `setState` per frame.
6. Nothing celebrates, counts or attracts. No confetti, no checkmark flourish, no count, no sound, no badge, no tab-bar change.
7. A move is never the only signal. The same meaning is in text and focus (A-NFR-005 to A-NFR-007).
8. Each move reads its Reduce Motion form from one reader, `useMotion()`, never from `AccessibilityInfo` in a screen. A source scan enforces it (section 8.3).

### 2.2 The tokens, and what the spring really does

VERIFIED in `packages/design-tokens/src/tokens.ts` (read this session). Screens type no duration, spring or curve.

| Token | Value | Used here for |
|---|---|---|
| `motion.standard` | stiffness 260, damping 30, mass 1 (ratio 0.93) | card to sheet expand, door rise, gap closing after Not now |
| `motion.snappy` | stiffness 520, damping 46 (ratio 1.01) | tile selection, press |
| `motion.easing` | cubic bezier 0.2, 0, 0, 1 | every timed move: carry, leave, return, Undo |
| `motion.fadeMs` | 200 | scrim, cover, Reduce Motion cross-fade, state swaps |
| `motion.exitMs` | 160 | sheet leave, card leave, Undo row leave |
| `motion.enter` | dy 8, 280 ms | cards entering once, Undo restoring a card |
| `motion.staggerMs`, `staggerMax` | 30, 6 | first view only |
| `motion.swapMs` | 150 | body swap (EM-04), For you and Recent (EM-15) |
| `motion.press` | scale 0.97 control, 0.98 card, opacity 0.9 | press feedback |
| `motion.cardToPage.contentFrom` | 0.6 | body of the sheet fades in from 60 percent of the expand |
| `motion.lamp.returnMs`, `leaveMs` | 280, 160 | the light between tabs (section 3.1) |
| `motion.sequenceMaxMs`, `hardCeilingMs` | 900, 2000 | ceilings |
| `motion.carry` | { ms: 320 } | FOUNDER-APPROVED (O-58, DC-3); not yet in `tokens.ts` (I grepped, it is absent). Section 9 |

What `motion.standard` does when run alone from 0 to 1, computed by me from the token (an analytic damped spring, not a Reanimated run): maximum overshoot 0.035 percent of travel; within 5 percent at 262 ms, within 1 percent at 346 ms, within 0.5 percent at 376 ms. On a 600 pt move that is a 0.2 pt overshoot, below a pixel, and about 3 pt left at 1 percent. Two consequences:

- `overshootClamping: true` (EXP 5.1) is belt and braces, not the thing that removes the bounce; the damping ratio (tested at 0.9 or more) already does. Pass the clamp where the API takes it. If `LinearTransition` in Reanimated 4.5.1 cannot take it (UNVERIFIED), ship without it; the overshoot is sub-pixel.
- "About 400 ms" in EXP is honest only to the 0.5 percent mark. Reanimated ends a spring at its own rest thresholds (ASSUMED: displacement 0.01 and speed 2 by default, which I did not verify for 4.5.1), so the move ends near 350 ms. Either figure is under the 420 ms cap. UNVERIFIED on a device (DM-12).

## 3. The moves

### 3.1 Tab transitions

Tab set (DC-4, RULED): Home, Moments, Book, Me, Home as landing, one constant `initialRouteName`.

- Switching tabs is the platform cut. Nothing of ours moves, no haptic, no sound (MOTION 5i, row 6; T1-R7). Controls are hittable from frame 1.
- The tab bar carries no badge, dot, bounce or icon change, ever (R4, DC-4).
- Mounting Moments never blocks the swap (T1-R10, PROPOSED to stand): on the first visit the heading and the paper are on screen at once, the bar already shows Moments selected, and any content that is not ready arrives by one `fadeMs` fade in place, in the space it will occupy, never above what the parent is looking at (A1-R9). No spinner, no shimmer, no line saying pictures are loading.
- First-view settle (O-26, EM-17): the first three blocks `enter` (8 pt, 280 ms, 30 ms stagger, whole sequence 340 ms), once per install, kept on the device only. Never on a return, a tab switch, a switch between For you and Recent, or a notification landing. Reduce Motion: one 200 ms fade, no travel. Heading is read first.
- Light between tabs. O-25 (RULED) is plain paper: no lamp on the tab or any Moments card. MOTION 5l rule 1 says the lamp never cuts, and the other tabs' lamps share `persistKey="tabs"`. So leaving Home or the Book for Moments must let the old light go, and the return must bring it back. PROPOSED: Moments calls `useUnlitRoom()` while focused, so every lamp eases to 0 over `lamp.leaveMs` (160 ms) and back over `returnMs` (280 ms). ASSUMED to work for sibling tabs; that hook was written for a covering screen (MOTION 5k). UNVERIFIED which of the two the Lamp component does when the arriving tab has no lamp; `mobile` reads `lamp.tsx` and `lamp.logic.ts` first and, if the hook does not fit, says so and the answer is a one-row addition to the lamp table (a `plain` scene at intensity 0), not a new token.
- Re-tapping the current tab scrolls to the top with the platform's own scroll (T1-R11); whether React Navigation's JS tabs do this unaided is UNVERIFIED.
- Arrival by notification or `scribe://moments` (G-09, O-22): typedDay, birthday and monthAge land on Moments at scroll 0 with For you selected and no card highlighted; `evening` lands on Home. No wash, no scroll-to, no card moves. With App lock on the lock comes first. The first-view settle applies only if it has never played.
- The shell test. `apps/mobile/test/tab-bar.test.ts` now declares four routes, `expect(SCREENS).toEqual(['index', 'moments', 'book', 'you'])`, and asserts the bar a build draws is still three while the flag is off: `visibleTabIds(MOMENTS_TAB_ON)` is `['index', 'book', 'you']`. The width test and the `you`-last check stay in step with that. The width arithmetic itself still passes: 320 / 4 = 80 pt and 375 / 4 = 93.75 pt, both over the 44 pt target, and the existing bound allows a label of up to 9 letters at 13 pt (0.62 em per letter is the test's own estimate), so "Moments" at 7 fits. Large Content Viewer and the fixed 13 pt label rule apply to the fourth tab (NX-30a-R4). The widths are arithmetic, not seen; A11Y audit FE-1 (tab label cap) and DM-13 still need a phone.
- Reduce Motion for all of this: tab swap unchanged (it is already a cut); the settle becomes a 200 ms fade; the lamp jumps to its level.

### 3.2 Day-card reveal: how a card and its pictures appear

I read "day-card reveal" as three things, and specify each: arrival on the tab, a picture arriving on a card, and the card opening into the host sheet (3.3).

- Arrival of the card: only the first-view settle above. A card that appears later (a library change, a re-read when the app returns, R77) fades in place over `fadeMs` and only where it cannot move content under the thumb. Nothing inserts above what is on screen (PRD R146). RULED by R146; the fade is PROPOSED.
- A picture on a card: the frame has its final size from frame 1 (a flat paper tile, no shimmer, no pulse, no spinner). When the picture decodes later it fades in over `fadeMs`, once per picture per session (A2-R8, EXP 5.10). When it is available at first layout (a cache hit) it mounts opaque with no fade and no placeholder flash. That removes the need for A1's proposed `placeholderGraceMs` token; I do not propose it. The card's height never changes when pictures arrive.
- Pictures never move: no zoom, pan, parallax, autoplay, Ken Burns or live preview, on press or on scroll. A video shows its length as static text (R208). Smart Invert must not invert photographs (A5 D9; UNVERIFIED for our build).
- Press: a card scales to `press.cardScale` (0.98) and opacity to 0.9 on `snappy` and keeps it until the paper starts to grow, as MOTION 5f does (`PressHoldContext`). Reduce Motion: opacity only.

### 3.3 Card to host sheet and door to host sheet (EM-01, EM-02)

Stated here so the flight has its context; the numbers are EXP 5.1 and 5.2.

- EM-01: one empty paper surface grows from the lead tile's measured frame to the full-height sheet on `motion.standard`, radius `sm` to `xl` at the top corners; the lead picture is carried on the same curve; the rest of the body fades in from 60 percent (`cardToPage.contentFrom`), clipped to the paper; the scrim fades over `fadeMs`. Not now and Start are present from frame 1, revealed by the edge, never faded. About 350 to 400 ms (section 2.2).
- Mount order for Apple's view (EXP 4.7): mounted after the sheet stops, under a still paper cover that fades over 200 ms; Apple's view is never faded, scaled or moved. The cover goes on as a hard cut on Not now, Start, inactive and gesture dismissal. This is DC-2's Layout B at its default; the motion rules hold for A, B and C.
- EM-02: from the door row the sheet rises from the bottom on `standard` (clamped, scrim 200 ms).
- EM-04: body swap fades only our layer over `swapMs`; Apple's view never changes opacity.
- No measured card, a changed column or type size, or a card scrolled away: the door's rise on a normal setting, the cross-fade under Reduce Motion.
- If DM-12 fails EM-01 on the SE 3, the fallback is the 200 ms cross-fade for every device (one code path, the same as "not measured"), not a slower expand.

### 3.4 Start hand-off: the flight (EM-07, DC-3, O-58)

Value FOUNDER-DECIDED (`motion.carry` { ms: 320 }); the flight itself RULED by DC-3: default OFF until DM-11 and DM-12 pass, then ON, only when the tray shows thumbnails.

What a parent sees, when ON:
1. Tap Start. The tray thumbnails (up to 6, one to six unchanged, O-62) stay where they are and the sheet and scrim leave over `exitMs` 160 ms, opacity only, revealing capture, which is already complete underneath with its controls opaque from frame 1.
2. In the same 320 ms each tile moves on `motion.easing` from its tray position to its place in capture: the lead tile to the picture slot, the rest to the strip. All tiles move together: no stagger (a stagger would add time and read as a flourish).
3. At 320 ms the tiles are exactly on their slots, the overlay is gone, the sheet is gone, and focus is on capture's heading. Total 320 ms, with the 160 ms leave running inside it, not after it.

Never both screens of words at once: capture was mounted beneath; only tiles and the leaving sheet move. Capture's own arrival (talk dissolve, write rise) is bypassed on this path because the sheet's leave is the arrival (EXP 5.4).

Reduce Motion, a tray with no thumbnails, an unmeasured destination, or the flag off: no flight. The sheet and scrim fade over `fadeMs` and capture is there with the pictures in their slots from the first frame. Reduce Motion never flies, whatever the flag.

Layer and touch rules (the engineering core of this section):

- Why an overlay at the root. The tiles start in the host sheet's route and land in capture's route. Two routes cannot both own one view, so for those 320 ms the tiles are copies drawn by a layer that belongs to neither. In this app the sheet and capture are presented screens (view controllers on iOS), and a view in the ordinary React tree sits beneath them. The repo already solved this once: the app lock and account layers draw in `FullWindowOverlay` from `react-native-screens` (~4.26, VERIFIED in `app-lock-layer.tsx` and `account-layer.tsx`), "a layer above the presented screens", mounted by the root layout and only while needed. The flight overlay is the same pattern: a `FullWindowOverlay` mounted by the root layout only while a flight plays, with an absolute layer on top of the root on the web preview.
- The overlay is decorative. It is hidden from VoiceOver (`accessibilityElementsHidden`, `importantForAccessibility="no-hide-descendants"`), carries no label, takes no focus, and is not `unstable_accessibilityContainerViewIsModal` (the lock layer is; this one must not be).
- Touches. The overlay should not intercept touches (`pointerEvents="none"`), so capture's controls stay live from frame 1 and any tap ends the flight at its end state (R144). Whether a `FullWindowOverlay` lets touches through, and whether a root-level touch capture can end the plan without eating the tap, is UNVERIFIED; the app-lock text says it "mounts only while needed, so it is never in the way of a touch otherwise", which suggests it can be in the way. If the device shows a tap swallowed during the 320 ms, the flight stays OFF. This is item F4 of DM-12 (section 7.4).
- Order with the privacy cover. The scoped cover (G-01, DC-5) and the app-lock cover must be above the flight. The order of two `FullWindowOverlay` siblings is UNVERIFIED, so the plan does not rely on it: when the app state becomes `inactive` or `background`, or the route stops being focused, the flight jumps to its end state and the overlay unmounts in the same frame, before the OS snapshot. A thumbnail must never be in the switcher snapshot.
- Source frames are measured from the tray on the Start press (a measured-rect store, as `CardSource` does, MOTION 5f). Destination frames are reported by capture's slots once laid out. If a destination has not reported within 100 ms of the tap (the start budget in `docs/tdd/01-mobile-client.md` line 530, VERIFIED: "Start within 100 ms, complete 350 ms"), the flight is skipped for that Start and the cross-fade plays. Nothing ever waits for a flight; the commit is not gated (principle 3).
- Tile rendering. Each tile is the tray's already-decoded thumbnail (no new decode in the flight, and memory stays inside DM-11's number), laid out once at its destination size and moved with `translate` and `scale` (transform only); its radius is interpolated from `sm` to the slot's radius under the existing transitioning-card-radius exception. The tray thumbnail is 44 pt; capture's lead slot is larger. Scaled up, the thumbnail would be soft at landing and then sharpen when the slot's own picture shows. ASSUMED: a single frame of sharpening at 320 ms is acceptable. UNVERIFIED, and F5 of DM-12 looks for it. If it reads as a pop, the fix is the slot's picture shown under the tile and the tile fading out over the last 80 ms (opacity, no new token), not a longer flight.
- Landing. The slot's own picture is hidden (opacity 0) until the last frame, shown in the same frame the overlay unmounts, so the pixels do not double. ASSUMED; UNVERIFIED that the overlay and the slot swap in one frame (a one-frame flash would show at F5).
- Interruption. Any touch, or the app going inactive, jumps the plan to progress 1 and unmounts. Backgrounding mid-flight needs no resume.
- Cap and ceilings. At most 6 tiles fly (the tray limit holds one to six pictures; videos show as still frames). 320 ms is under the 420 ms single-move cap and the 900 ms sequence. If tap-to-first-moving-frame can take the full 100 ms, tap-to-landing is 420 ms, which is the cap; and if the TDD's 350 ms "complete" means from the tap, 100 + 320 would break it. I read "complete 350 ms" as the move's own length (ASSUMED), so the flight (320) fits; DM-12 records tap-to-landing so the reading can be corrected. Flagged for the owner of TDD 01.

The flag. `carryMs` is read behind one boolean, default false; false gives the cross-fade (DC-3's way back). The boolean flips to true in a PR that cites the DM-11 and DM-12 records (section 7.5). It is a constant in code, not a remote flag.

### 3.5 Ask-card dismissal, card Not now, Undo

Ask card (EM-16, A3-R10 and R16, RULED by EXP 6). Whether the parent says Not now or the system returns granted, the same calm change plays, 590 ms in all: the ask and the example leave over 160 ms, the gap closes on `standard`, and the real list enters from 160 ms (up to six cards at 30 ms stagger, 280 ms each; 160 + 280 + 150 = 590). It is one change of one length so that no answer looks like a better answer (EXH-CPO, equal weight). Not now ends in the real list with the door first (DC-1). No shake, no red, no sad drawing. Our motion never plays behind Apple's alert. Reduce Motion: one 200 ms cross-fade, header and switch still. VoiceOver: a line from `content` is announced politely, focus to the new heading.

Card Not now (EM-12, G-03). The card fades over `exitMs` (160 ms); the cards below close the gap on `standard` after the fade, about 350 ms to rest, so the whole is about 510 ms (160 + 350), under 900, no single move over 420. No confetti, no checkmark, no "x set aside", no count. The Undo row (G-03) appears opaque and hittable in the first frame: it is a control and controls never animate in. It leaves over `exitMs` on Undo, tab switch or leaving the tab. It never times out (EXP 5.7). The scroll content's bottom inset changes by the row's height plus 8 pt without animation; if the parent is not at the bottom, nothing moves. PROPOSED (G-03 gives place and behaviour, not motion).
- The gap closing uses a layout animation (`LinearTransition`), the one layout animation Moments is allowed (A5 4.3), because it drives layout on every frame. DM-12 measures it on the SE 3 with cards below that have pictures. If it drops a frame, the gap closes at once and the 160 ms fade stays.
- Reanimated's order of exit and layout animation in 4.5.1 (layout begins after the exit ends) is ASSUMED.
- Reduce Motion: 200 ms fade, gap at once.
- VoiceOver: "Set aside" polite; focus to the next card's heading, or the tab's heading if it was the last.

Undo (EM-13). The card returns to its slot with `enter` (8 pt rise, opacity, 280 ms) and the existing `tap` haptic. Nothing else moves; no stagger, because it is one card (A1-R14 said the same). Reduce Motion: 200 ms fade, no travel. VoiceOver: "Back where it was"; focus to the restored card. A second set-aside replaces the row and Undo returns only the latest (G-03).

Not now on the host sheet (EM-08, EM-09): if the source card is on screen the content fades over 160 ms while the paper returns to the lead tile's frame in 280 ms (`enter.durationMs`, `easing`, no settle, leaving is shorter than arriving), and the lead tile is carried back; else, or with Apple's body showing (cover first, hard cut), the sheet leaves downward over 160 ms. Reduce Motion 200 ms fade. Nothing is announced; focus returns to the opener.

### 3.6 Everything else, in one table

| Id | Move | Time | Reduce Motion |
|---|---|---|---|
| EM-03 | Cover over Apple's view clears | `fadeMs` 200 | same |
| EM-05 | Tile chosen or put back | `snappy`, haptic `tap` | opacity only, no scale |
| EM-06 | Tray changes | none (thumbnail present at once) | same |
| EM-10 | App inactive with the sheet open | hard cut cover | same |
| EM-11 | App lock engages with the sheet open | sheet leaves `exitMs` | 200 ms fade |
| EM-14 | An iCloud pick arrives in the tray | flat box to thumbnail, `fadeMs` | same |
| EM-15 | For you and Recent switch | `swapMs` 150 | same |
| G-01 | Scoped switcher cover on and off | hard cut on, removed next frame, no fade | same |

## 4. Reduce Motion, Reduce Transparency, Increase Contrast and the rest

### 4.1 One table, one reader

Reduce Motion is read once by `useMotion()` (MOTION 4: `useReducedMotion()` returns the value at app start, so it also subscribes to `reduceMotionChanged`). A jump to the end state is not our fallback: movement is replaced by a 200 ms opacity fade, with `reduceMotion: ReduceMotion.Never` on the fade so the system setting does not turn the fade into a jump.

| Move | Normal | Reduce Motion |
|---|---|---|
| Tab swap | platform cut | same |
| Light between tabs | `leaveMs` 160, `returnMs` 280 | jumps to its level, no leave or return |
| First-view settle (EM-17) | `enter`, 30 ms stagger, once | one 200 ms fade |
| Picture arrives | `fadeMs` from flat tile | same (already a fade) |
| Card to sheet (EM-01) | measured-rect expand, about 350 to 400 ms | 200 ms cross-fade: leaving screen over its first 140 ms, arriving over its last 120 ms from 80 ms (`CARD_TO_PAGE.handOff`), no carry |
| Door to sheet (EM-02) | rise on `standard` | 200 ms cross-fade |
| Body swap (EM-04) | `swapMs` | same |
| Tile select (EM-05) | `snappy` | opacity only |
| Start (EM-07) | 160 leave, 320 flight | no flight: 200 ms fade |
| Sheet Not now (EM-08, 09) | 160 fade, 280 return | 200 ms fade |
| Ask card answered (EM-16) | 590 ms | 200 ms cross-fade |
| Card Not now (EM-12) | 160 fade, gap on `standard` | 200 ms fade, gap at once |
| Undo (EM-13) | `enter` 280 | 200 ms fade |
| Scoped cover (G-01) | hard cut | same |

Reduce Motion toggled while the app is open takes effect on the next move; a move in flight finishes at its end state at once. UNVERIFIED on a device (DM-13).

### 4.2 The other settings

- Reduce Transparency and Increase Contrast: the host sheet's paper and the cover are opaque already. The tray's `surface` hairline and `mediaFrame` outline move to `controlBorder` strength under Increase Contrast (`mediaFrame` = `line` under it, VERIFIED in `tokens.ts`). No motion depends on blur. Our one glass control, if any, uses `glassFallback`; EXP's host sheet uses none.
- Dark and light: the flight tiles carry the tray's own outline, so a tile is the same object in both themes. Contrast of the tile outline is a DM-13 check, not a motion rule.
- Dynamic Type to AX5: no letter text is scaled, clipped or reflowed by any move. Font size never animates. Tray tiles are fixed 44 pt and do not scale with type; capture's slots may move at AX, so the flight reads destination frames at the moment of Start, not a constant. If the column or type size changed since the card was measured, the expand falls back to the cross-fade (3.3).
- Low Power Mode and a hot phone: not read (needs `expo-battery`, a new dependency, D-065 per MOTION 5k). The flight is one transform animation of at most 6 tiles. PROPOSED: no extra rule.
- Haptics (O-24, RULED): no new haptic. `tap` for a tile and for Undo, Keep keeps `success`, Start and Not now and every opening are silent. No sound anywhere in Moments. iOS mutes haptics in Low Power Mode, so nothing depends on one.

## 5. Performance budget on the iPhone SE 3

### 5.1 The device

iPhone SE 3rd generation: 375 by 667 pt, 60 Hz, 4 GB RAM (`docs/qa/DEVICE_TEST_PLAN.md` line 44, VERIFIED). It is the reference for every budget. A 120 Hz phone is the second device. A simulator number is never frame evidence (A5 4.2).

### 5.2 Budget

| Budget | Value | Source |
|---|---|---|
| Frame time, SE 3, 60 Hz | 16.7 ms, no frame over | MOTION 7 rule 6; TDD 01 line 530 |
| 120 Hz phone | no frame over 16.7 ms and no more hitches than at 60 Hz. 8.3 ms is not a gate | A5 4.4, ASSUMED until a device shows 8.3 ms is realistic |
| Motion start and finish | starts within 100 ms of the tap; complete 350 ms | TDD 01 line 530; the reading of "complete" is in 3.4 |
| One move | at most 420 ms | PRD R144 |
| One sequence | at most 900 ms | `motion.sequenceMaxMs` |
| Flight | at most 6 tiles, transform and opacity only, no decode inside it | this spec (3.4) |
| Layout animations | one, the gap after Not now | A5 4.3 |
| Loops | none in Moments | this spec |
| Tray thumbnails decoded at once | at most 6, 44 pt fixed | G-06, ASSUMED, tuned at DM-11 |
| First screen | heading, job line, first card's date and both buttons visible without scrolling at default size | G-06 |

If DM-11 fails, the tray has no thumbnails and there is no flight (G-06, DC-2).

### 5.3 What runs where

Scroll offset: native. Opacity and transform worklets: UI thread. The expand's growing surface: frame and radius on the UI thread, laid out once at final size, its contents clipped (UNVERIFIED that Reanimated 4.5.1 holds 60 Hz here on an SE 3, EXP 11 item 3). Image decode: native, never in JS, never in a render. The gap close: UI thread but drives layout (cost of one pass per frame). The flight: UI thread, 6 views.

## 6. Test and measurement plan

### 6.1 Layers

| Layer | What it proves | Cannot prove |
|---|---|---|
| L0 unit (Linux CI, `npm test`) | token values and ceilings; timelines stepped ms by ms; Reduce Motion plan table; flight plan geometry | any frame time or look |
| L2 component | no transform animation under Reduce Motion; hit area and opacity at t = 0; Undo inset; overlay hidden from accessibility; mount count of covers | the compositor, memory |
| L3 baselines (SE 3 and iPhone 16) | our frame at default and AX5, light and dark | motion |
| L4 audit | VoiceOver order, focus after each move, names | feel |
| L5 device (DM rows, G7, S1-23) | frames, memory, layering, touches | nothing is left after it |

Maestro stops at the host sheet and cannot reach inside Apple's view, nor count frames, nor (UNVERIFIED) toggle Reduce Motion in the simulator (A5 7.5).

### 6.2 Unit tests to write first (all L0, for `mobile` and `design-tokens`)

1. In `packages/design-tokens/test/tokens.test.ts`, with the token: `motion.carry.ms` is 320, is at most 420 (the single-move cap, a literal in the test), and `exitMs <= carry.ms` so the leave fits inside the flight. The existing "no timed motion exceeds the 2 s ceiling" test lists durations; add `carry.ms`.
2. `carryPlan` (PROPOSED name, in `lib/transitions.logic.ts` beside `CARD_TO_PAGE`): given source rects, destination rects and elapsed ms, returns each tile's frame. Stepped ms by ms from 0 to 340 on three phones (SE 3 375 by 667, iPhone 16 393 by 852, a large 430 by 932), as `transitions.test.ts` does for `CARD_TO_PAGE`. Asserts: at 0 each tile equals its source; at 320 and after, exactly its destination; progress never decreases; no tile leaves the screen; the overlay is done at 320; a tap at any ms returns the end state; Reduce Motion, flag off, no thumbnails or a missing destination returns no move; at most 6 tiles.
3. The Reduce Motion table in 4.1 as data: every move id has a form, and a test walks the whole table.
4. Timeline ceilings: every Moments move is at most 420 ms and every sequence at most 900 ms (EM-16 is 590, the card Not now about 510, the tab settle 340).
5. `shouldCoverMoments(route, appState, lockEnabled)` truth table (G-01), and that the flight plan ends when the cover condition becomes true.
6. Tab bar: `tab-bar.test.ts` declares four routes and asserts three visible while the flag is off (done with the flag); the flag-on four-tab bar still needs a device check.
7. Source scans on the Moments tree: no `withRepeat`, no progress or activity component, no `shimmer`, no direct `AccessibilityInfo` read, no number literal used as a duration.
8. Easing and duration come from tokens only; no colour or size typed in a screen.

### 6.3 What is a frame drop (the budget, made countable)

- The bar is the repo's: no frame over 16.7 ms on the SE 3 during EM-01, EM-07 and EM-12 (DM-12), and during a fling of Recent (G-06). A frame that misses its 16.7 ms slot is a drop.
- Evidence tools (A5 4.2, MEASUREMENT-PLAN H7 and H8, VERIFIED): Instruments Animation Hitches on a development-signed Release build (Instruments cannot attach to a TestFlight build), or a 240 fps second-phone video, where a frame repeats for roughly 8 video frames (33 ms) when one is dropped (4.2 ms per video frame).
- Why the gate is a count of frames and not the hitch ratio. Apple's Tech Talk 10855, read this session, says under 5 hitch milliseconds per second is good, 5 to 10 is noticeable and should be investigated, and over 10 is severe. A single missed 16.7 ms frame inside a 320 ms move is about 52 hitch ms per second (16.7 / 0.32), deep in the severe band. So any drop in a short move is already severe by Apple's measure; the ratio would not separate one drop from several. It is recorded for information, never as the gate.
- Pass for a motion on a device: 10 counted runs, zero frames over 16.7 ms in every run. Run 1 after install or relaunch is discarded as warm-up and reported (ASSUMED: first-run caches are not the steady state a parent sees; if any parent-facing first run is slow, that is a launch budget, not a motion row). Any counted run with a drop fails the row. This is deliberately the strict reading of MOTION 7; the founder or CTO may loosen it, and I would not.
- Record per run: phone, iOS version, build and fingerprint, motion id, run number, the longest frame in ms, tap to first moving frame in ms, tap to landing in ms. Never record a picture, a filename, a place, a date or a name. Synthetic Asha files only, still photographs of an Instruments trace for the record.

### 6.4 How DM-11 and DM-12 are read

Both are run by the founder or a device operator (EXP 9.2), on an iPhone SE 3 and the newest phone, iOS 17 and the newest OS, light and dark.

DM-11 (memory and time, inline view and tray thumbnails; eight concurrent iCloud picks). The row has no numeric bar in EXP or the closure; these are PROPOSED and ASSUMED until the founder or CTO confirms:

| Reading | Pass |
|---|---|
| Memory warnings and terminations over 10 sessions of the host sheet with Apple's view, 6 tray thumbnails and 8 concurrent iCloud picks | zero warnings, zero terminations |
| Resident memory 5 s after the sheet closes (Instruments Allocations) | back within 20 percent of the level before it opened (ASSUMED) |
| Tray thumbnail for a local pick | visible within 200 ms of the pick (ASSUMED, so the arrival is one `fadeMs`) |
| An iCloud pick | flat box at once; Start never blocked; no spinner |

DM-12 (frame time of EM-01, EM-07 and EM-12; Recent fling) adds four observations for the flight, because they decide whether it may be ON:

| Id | Observation | Pass |
|---|---|---|
| F1 | Longest frame, 10 counted runs each of EM-01, EM-07, EM-12, and a fling of Recent | none over 16.7 ms (SE 3); 120 Hz phone: none over 16.7 ms and no more hitches than the 60 Hz run |
| F2 | Tap to first moving frame, and tap to landing, for EM-07 | first frame within 100 ms; landing at most 420 ms; record both |
| F3 | Overlay layering: tiles visible above the sheet and above capture; never visible in the app switcher snapshot, with App lock on and off | tiles above both; never in the snapshot |
| F4 | A tap on a capture control during the flight | the tap is delivered or the flight ends and the control still works; a swallowed tap fails the flight |
| F5 | The landing: sharpening of a scaled thumbnail, a one-frame flash or doubled picture at the slot swap | none a parent would notice (a judgement call, recorded with 240 fps video) |

### 6.5 The decision (who flips what)

| Result | Decision |
|---|---|
| DM-11 fails | tray has no thumbnails; flag stays off; DC-2 says Layout C |
| DM-11 passes, DM-12 F1 to F5 all pass | flip the flight boolean ON in a PR that cites both records |
| DM-11 passes, EM-07 fails F1 to F5 | flight stays OFF, cross-fade ships; EM-01 and EM-12 judged on their own rows |
| EM-01 fails F1 | the expand falls back to the cross-fade on every device (3.3) |
| EM-12 fails F1 | the gap closes at once, the 160 ms fade stays (3.5) |
| SE 3 passes, 120 Hz phone fails F1 | ON, with the failing frames recorded; fixed on the next cut |
| A move is not measured | OFF or the cross-fade. A claim without a row is not made (R293: no accessibility claim for starting from a picture until DM-07 runs) |

Until DM-12 has been run, nothing in this file is a claim about frames. The founder chose the 320 ms value; the device chooses whether it ships ON.

## 7. Tokens

- Existing only, as section 2.2 lists them.
- `motion.carry` { ms: 320 }: FOUNDER-APPROVED (O-58, DC-3), not yet in `packages/design-tokens/src/tokens.ts`. It lands with tests (6.2 item 1) in the Start hand-off PR; `design-systems` writes it. I did not add it here: this spec edits no token or code. Mobile reads it as `tokens.motion.carry.ms`, behind the flight boolean.
- PROPOSED for `design-tokens`: none. I considered and rejected `motion.moments.placeholderGraceMs` (A1 5.2): the cache-hit rule in 3.2 removes the need. I considered a `motion.moveMaxMs` 420; the cap stays a literal in tests, as it is in R144 today.
- Not tokens, so nothing for `design-tokens`: `overshootClamping` is passed per call; the flight's 6-tile cap and 100 ms start deadline are constants in `transitions.logic.ts` and are named there.
- Outside this spec and still open: `sheetTitle` use of `title2` with `maxScale` 1.4 (EXP 12), a type token, not motion.

## 8. Hand-offs, conflicts found, and what is not verified

### 8.1 Hand-offs

- `mobile`: `PickHostSheet` and the measured-rect expand; the flight (root `FullWindowOverlay`, `carryPlan`, the boolean); the tab (`initialRouteName`, `tab-bar.test.ts` to four tabs); the scoped cover; the Undo row; the unit tests in 6.2. First, the one spike in 8.2.
- `qa`: DM-11 and DM-12 with F1 to F5, the capture sheet for 6.3's per-run record.
- `product`: R144 and O-27 and O-58 in PRD 28 still read "off by default, PROPOSED"; the closure says founder-approved and ON after the device rows. Amend the rows. R211 per DC-6.
- `content`: strings for the Undo row, the ask card, the polite announcements.
- TDD 01 owner: the meaning of "complete 350 ms" (3.4).

### 8.2 The spike before the flight is built (an hour, a Mac and a simulator)

Layering and touch behaviour are not frame evidence, so the simulator can answer them. Build a throwaway screen: a `FullWindowOverlay` mounted by the root layout, a presented transparent route over tabs, and a presented capture route. Answer: (a) is the overlay above both presented screens; (b) do taps reach the screen beneath when `pointerEvents="none"`; (c) can a root touch capture end a plan without eating the tap; (d) is the overlay above or below the app-lock layer; (e) can capture sit beneath the host sheet on the card path (EXP says it is "already mounted beneath", the navigation order for that in Expo Router 57 is UNVERIFIED). If (e) fails for the card path, the flight ships only for Add from capture, where capture is already beneath, and the card path cross-fades. Say so in the PR.

### 8.3 Conflicts and corrections found while writing

1. EXP and the PRD still call the flight off by default; the closure says ON after DM-11 and DM-12. The closure is later and cites the founder. Followed here.
2. `tab-bar.test.ts` declares four routes and three visible with the flag off; the closure (DC-4) has four with it on. Section 3.1.
3. TDD 01's "Start within 100 ms, complete 350 ms" and a 320 ms flight only fit together if "complete" is the move's own length. Section 3.4.
4. O-25 (plain paper) and T1-R8 (a Moments lamp scene) disagree; O-25 wins, and the cost is the light between tabs, section 3.1.
5. EM-16 in EXP names "ask and examples"; C-45 left one example. The 590 ms is carried unchanged because the list's six-card entry sets it, not the examples.
6. EXP 5.1 says the spring "overshoots by about 0.03 percent"; my computation gives 0.035 percent. Same thing; recorded because the clamp is not what removes the bounce.

### 8.4 ASSUMED and UNVERIFIED register

ASSUMED: Reanimated 4.5.1 rest thresholds (about 350 ms to rest); layout animation begins after the exit ends; `LinearTransition` may not take an overshoot clamp; the landing swap happens in one frame; one frame of sharpening is acceptable; "complete 350 ms" means the move's own length; run 1 as warm-up; DM-11 numeric bars (20 percent, 200 ms); 120 Hz bar; at most 6 tiles decoded; Moments' `useUnlitRoom()` fits a sibling tab.
UNVERIFIED: every row in EXP 9.2; layer order of the overlay against presented screens and against the app-lock layer; touch pass-through of `FullWindowOverlay`; whether capture can sit beneath the host sheet on the card path; Reanimated holding 60 Hz on an SE 3 for the expand with clipped contents; the Smart Invert behaviour; React Navigation's re-tap scroll; live toggling of Reduce Motion; what Apple's picker does during our moves (nothing we can read).
Not read in full: A2, T2, T3, T4, T5 (headings and cited numbers only); `DESIGN_LANGUAGE.md`, `SOUND.md` (the closure says `design-systems` reads SOUND.md before sign-off on O-24; I did not this session, so that precondition stays open).
