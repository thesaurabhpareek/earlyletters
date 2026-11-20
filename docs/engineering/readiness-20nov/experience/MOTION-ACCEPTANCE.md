# 2. Motion acceptance: every move, how to prove it (deliverable 2 of 4)

Owner `design-systems` (RD-B, 20 Nov 2026). Docs only. Sources: v2 `docs/design/system/MOTION.md` ("v2 MOTION", `docs/e2e-ux-20nov` at `9e78eecd`, 396 lines, read in full [V]); the five area MOTION.md files (read A in part: sections 8 to 10; E by headings; B, C, D by INDEX ids only); the five MOTION-PROTOTYPE.html files (grepped for constants, not played [U]); `tokens.ts` and `lib/motion.ts` on develop `16e61549`. The motion standard is v2 MOTION; where an area file or prototype disagrees, v2 wins (v2 MOTION line 6 [V]) and the difference is in section 8.

Test levels: **U** unit test on spec constants (Node, vitest, no React Native); **W** Reanimated worklet or logic test (`*.logic.ts` plans, as `test/transitions.test.ts` does today [V name]); **S** source scan; **J** simulator journey (Maestro in `apps/mobile/e2e/flows`); **D** device row on an iPhone SE 3 (60 Hz) and the oldest iOS 26 phone the team has. No test here reads or plays a real letter; fixtures are Asha.

## 1. What is on develop today (so the gap is exact)

| Fact | Where | Status |
|---|---|---|
| Springs: snappy 520/46, standard 260/30 (response 0.40 s), gentle 90/18 | `tokens.ts:305,307,309` [V] | v2 changes standard to 0.30 s (439/38.5) and retires gentle |
| Timings: fade 200, exit 160, enter 280 + dy 8, swap 150, stagger 30 (max 6), `sequenceMaxMs` 900, `hardCeilingMs` 2000, `newMarkMs` 1600, `drawMs` 1200 | `tokens.ts:317-330,354` [V] | v2: sequence 600, add `capMs` 300 |
| Single motion API: `useMotion`, `useReducedMotion`, `springConfig`, `layoutSpring` | `lib/motion.ts:62,81,87,92` [V] | v2 adds `m.*` names, `useReduceTransparency`, `useLowPowerMode`, `glassStyle` |
| Springs use `ReduceMotion.System` on the config; timings use `Never` | `lib/motion.ts:83,102-108` [V] | v2 says never rely on the system jump (v2 MOTION 3 [V]); the hook swaps to a fade first |
| Token tests: 2 s ceiling, 900 ms sequence, spring damping, targets, idle breath rate | `tokens.test.ts:172-225` [V] | none checks a per-move 300 ms cap or named exceptions |
| 23 source files call `withTiming` or `withSpring` | `git grep -l` count [V] | no scan forbids a literal duration |
| Literal motion numbers outside tokens | `letter/[id].tsx:104` REST_OUT_MS 96; `join-ask.tsx:64` SWEEP_MS 1400; `onboarding.tsx:387,392,397,564` offsets 120/150/180/200; `draw-on.tsx:22` bezier(0.45,0,0.2,1); `join-ask.tsx:78` and `breathe.tsx:31` inOut easings [V] | the allow-list for the scan in section 7 |
| Retired-by-v2 code still present | `breathe.tsx` (8 s loop), `book.tsx:515` gentle `Settle`, `book-cover.tsx:121` cover hold, `state-screen.tsx:21,112` Breathe, `button.tsx:162` ActivityIndicator | ENG-M13 |
| No glass code | `GlassSurface` 0 files; `expo-glass-effect` in `package.json:34` [V] | EX-12 N |

## 2. Primitives: one row per `m.*` (v2 MOTION 4 and 8)

"Never animates" and "Test" columns are mine; the rest quote v2 MOTION. Cap column: v2 MOTION 5, `motion.capMs` 300 unless named.

| Primitive | Trigger | Duration and easing | Properties | Must not animate | Reduce Motion | Haptic | Test |
|---|---|---|---|---|---|---|---|
| `m.tap` | press-in on a content-layer control | `spring.snappy` (0.28 s); scale 0.97 control, 0.98 card | transform scale | glass controls (they use `m.tap.glass`, never both) | opacity 0.9 over 90 ms (`tap.rmMs`) | none | U constants; W `usePressScale` RM branch; S no `m.tap` on `GlassView` |
| `m.tap.glass` | press of a glass control | system | none of ours | our scale | system | none | S: `isInteractive` set, no press scale in same component |
| `m.select` | choice, lens, toggle, radio, Reading Size step | indicator `spring.snappy`; colours `swapMs` 150 | indicator transform; colour | font size | indicator jumps | `H-select` | W; J: switch lens, assert checked state in one frame under RM |
| `m.move` | reflow, inline card expands | `spring.standard` 0.30 s via layout transition | sibling frames | text inside the block | final layout next frame | none | S: `LinearTransition` only through `lib/motion.ts` |
| `m.enter` | content arrives | 280 ms, `easing.standard` | opacity 0 to 1, y +8 to 0 | controls (EX-16) | fade 200, no travel | none | U; J: a button is hittable on frame 1 of every screen |
| `m.enter.group` | cold launch and first show per session only | 280 + 5 x 30 = 430 ms | per item `m.enter`, first 6 | any return, tab switch | one 200 ms fade | none | U (430); J: second visit has no stagger |
| `m.exit` | content leaves | 160 ms, `easing.exit` | opacity, y to -8 or +8 | none | opacity 160 | none | U |
| `m.fade` | crossfade, and the RM form of everything | 200 ms; outgoing gone at 35 percent (`handOff` 0.35) | opacity | two screens of words overlapping | it is the form | none | U on `HAND_OFF`; W |
| `m.swap` | words replaced in the same box | 150 ms | crossfade; box resizes at the end | box size during swap | same | none | U; J Another thought |
| `m.sheet` | sheet present or dismiss | system | system | custom sheet background | system reduced | none | S: no `gorhom` in iOS sheets once ENG-M5 lands; D |
| `m.sheet.own` | only where a native sheet cannot be used | rise `spring.standard`, leave 160 | transform, scrim opacity | glass opacity | glass style or solid fade 200, no travel | none | S list of exceptions is a constant, count asserted |
| `m.glass` | glass shows, hides, changes shape | style 0.25 s (`glass.styleS`) | `glassEffectStyle` only | glass opacity or size, ever | style change kept, no travel | none | S: no opacity on `GlassView` ancestors; D under RM/RT/IC |
| `m.push` | stack push, pop | system | system | none | system | none | D |
| `m.cover` | Listen, Review, Read together in and out | 280 ms dissolve (`cover.dissolveMs`) | opacity | swipe-down while recording | 200 ms | none | U 280; D measured real length (BL-929) |
| `m.zoom` | letter card to page and back | hold 136; growth `spring.standard`; veil 160 in, 280 out; words carried whole; content from 60 percent | paper frame and radius; veil opacity | the words (no scale, blur, size) | `m.fade` 200 each way | none | W `CARD_TO_PAGE` plan on new spring; D (card to page within 900 ms) |
| `m.keep` | Keep | t0 line + haptic; t120 card down 24 and exit; t400 Review fade; t600 Book | opacity, y | counters, stamps, check draw | line 200; Review fade at 400; mark static then fades | `H-success` at t0 after commit | W timeline (replaces `fileIntoMonthPlan`); J: letter in Book within 2000 ms (NS-34) |
| `m.mark` | new or restored letter | 1600 ms, `easing.standard` | tint opacity behind words | the words | tint shown static, same fade | none | U 1600 |
| `m.pageTurn` | Read together next and back | `pageTurn.dx` 24; exit 160; arrive `spring.standard`; finger follow | transform x, opacity | words | `m.fade` 200, no follow | none | W `pageTurnPlan`, `swipeOutcome` (fraction 0.25, velocity 600) |
| `m.list.insert` / `.remove` | row appears or leaves | enter 280 / exit 160 + `m.move` | opacity (remove: no slide) | neighbours' text | row fade; others jump | none | J: Undo delete |
| `m.progress` | measured progress (export, download) | 200 ms linear per update | scaleX | speed up near end | jumps to each value | none | U `progress.settleMs`; W |
| `m.progress.wait` | unmeasurable wait | system indicator or 1400 ms sweep | sweep x | any loop under RM or LPM | none: busy words stand still | none | S: no `withRepeat` outside named loops; D LPM |
| `m.signal` | recording, listening | follows the voice; idle 7500 ms; attack 80, release 400 | glow scale 0.18 max, opacity 0.18 to 0.4 | anything else on a recording screen | static ring; opacity steps at most once per 400 ms | none | W `auraRunsFrames`; U signal block; D under RM |
| `m.follow` | Read together wash and scroll | wash `spring.snappy`; scroll 450 ms; line change 80 out/in | wash x and width | words | wash jumps; scroll pages | none | W `highlight.*` |
| `m.instant` | recording state, privacy cover on, scheme, text size | 0 ms | none | any transition | same | none | S: no timing calls in those handlers; J: A-MO-5 |
| `m.step` | first-run step, sheet next page | exit 160 then enter 280 = 440 | opacity, y | controls | fade out 200 then in 200 | none | U (each part under cap); W `stepMotion` |
| `m.draw` | first run only, once per install | 1200 ms pen ease | `strokeDashoffset` | any problem screen, any milestone | drawn complete | none | S: `DrawOnStrokes` default `animate={false}` |
| `m.toast` | undo toast in and out | glass style 0.25 s; rise 8 pt on `spring.snappy`; words `m.enter`; hold 4000 for non-action toasts only | glass style, y, words | glass opacity; a fourth glass surface | no rise | none | W `toast.logic.ts`; U; J; D (EX-14) |
| `m.minimize` | Book scroll only | system | system | Home and Me | system | none | D |

## 3. Navigation transitions T-* (v2 MOTION 6, 17 rows)

Every route takes one presentation from `routeTransitions` (`lib/transitions.logic.ts`); the test asserts each root route has a T-id and that no screen passes its own `animation`.

| T-id | Presentation | RM | Test |
|---|---|---|---|
| T-TAB | native tabs, no content animation | same | D (JS tabs on develop; native is DS2-10) |
| T-MIN | `minimizeBehavior="onScrollDown"`, Book only; needs a ScrollView first child, not `FlatList` (S6) | system | D spike first (ENG-M3) |
| T-PUSH | native push | system | D |
| T-SHEET | `formSheet` with detents; glass by iOS | system | S + D |
| T-MENU | native menu | system | D |
| T-ALERT | native alert or action sheet; `H-warning` after a destructive confirm | system | J |
| T-COVER | `fullScreenModal`, `fade`, 280 | 200 | W (`routeTransitions` row), D |
| T-ZOOM | transparentModal + `CardToPage` | `m.fade` | W, D |
| T-KEEP | `m.keep` | line fade, Review at 400 | W |
| T-GATE | `T-SHEET`, held card `m.enter` | system | J |
| T-STEP | `m.step` 440 total | fade out then in | W |
| T-PAGE | `m.pageTurn` | `m.fade` | W |
| T-LOCK | cover on `m.instant`; unlock `m.fade` 200 | same | J |
| T-LAUNCH | matched first frame; `m.enter.group` content only | one fade | D (cold start p50 1.2 s) |
| T-RESUME | nothing re-enters | same | J: background and return, assert no enter |
| T-SYSLINE | line `m.enter`; content `m.move` | line fades, layout instant | J |
| T-INLINE, T-SLIP | in area C and A files only (`INDEX.md:265-282` [V]) | per area | [U] v2 does not define them: gap, see section 8 |

## 4. Haptic pairing (v2 MOTION 9)

| Id | Plays for | Test |
|---|---|---|
| H-select (`tap`) | choice picked; Reading Size step; speed step; Put it back; Undo | S: call sites listed in a constant |
| H-press (`press`) | record start (before the audio session) and stop (after); Speak, Type start | U `recording-haptics.test.ts` exists [V name] |
| H-soft (`soft`) | Not much today kept; custom long-press | S |
| H-success | letter kept (after commit, before first animated frame); export finished; joined a book | U A-MO-6 |
| H-warning | destructive confirmed: Let it go, Delete, Erase, Delete account, Leave | S |
| none | scroll, tab, push, sheet, menu, toast, glass morph, page turn, progress, Continue, Back, errors | S: ENG-M10 trims `success` from the call sites it names (v2 MOTION ENG-M10) |

Throttle: `tap`, `press`, `soft` at most one per 100 ms (v2 MOTION 9 [V]).

## 5. Area moments: how 415 ids become tests

`INDEX.md:290-731` lists 415 motion ids (A 66 `MA-nn`, B 71 `B-Mnn`, C 97 `M-Cnn`, D 85 `D-Mn`, E 96 `E-Mnn`; `INDEX.md:11-16` [V]); 38 are PROPOSED. 142 of 415 name a T-* (415 less the 273 that `INDEX.md:288` counts as native, in place or keyed in prose [V]). Rule: **a motion id is acceptance-complete when its row names a v2 primitive**; the build proves the primitive (section 2), the journey proves the trigger. Proposal (Rec): a generated fixture `apps/mobile/test/fixtures/motion-ids.json` from INDEX section 5 (script `docs/design/e2e/tools/build-index.py` already parses it), and one test `[motion-ids] every motion id keys a v2 primitive` that fails for an id whose primitive is not in `PRIMITIVES`.

Representative rows (all [V] in the area MOTION files unless noted) with their journey assert:

| Id | Moment | Assert |
|---|---|---|
| MA-01 | Home cold launch: dateline, greeting, slip, prompt stagger | 6 items, 30 ms apart, 430 ms; cluster present at frame 1 (J + D) |
| MA-03 | Another thought | 150 ms swap, box height at end (J) |
| MA-12 | Speak to Listen | 280 dissolve, record control present from frame 1, never a morph from the cluster (J) |
| A-MO-1 | RM over all MA moments | no transform changes; every opacity change at most 200 ms except `m.mark` (U/J) |
| A-MO-2 | 10 s undo, VoiceOver finishes at 6 s | Undo works until 16 s plus exit (U on the undo helper) |
| A-MO-3 | Switch Control | window never closes on time (D) |
| A-MO-4 | Silence 10 s | aura scale stays 1, only opacity moves (W) |
| A-MO-5 | Record start, pause, resume, stop | label, colour, time change on the recorder's frame, no animation scheduled (W) |
| A-MO-6 | Keep and Let it go | `success` after commit and before first animated frame; `warning` after recorder stopped (U) |
| A-MO-7 | Picture picked | thumbnail box final height on first frame; record start waits for decode (J) |
| B zoom | Card to page and back | words carried whole; Back returns along the same path; no content re-enters (W + D) |
| E-M30 | Keep gate sheet | content static except the held card `m.enter` (J) |

Sources for A-MO rows: `A MOTION.md:255-266` [V]. B, C, D, E have the same "proposed test rows" sections [U not read in full]; collect them into one table `docs/qa` when the fixture lands.

## 6. Frame and time budgets (what the test asserts)

| Budget | Value | Source | Level |
|---|---|---|---|
| Single move cap | 300 ms (spring counts as its response) | v2 MOTION 5 | U |
| Composite sequence | 600 ms (today 900) | v2 MOTION 5 | U |
| Hard ceiling | 2000 ms | `tokens.ts:328` [V] | U (exists) |
| Named exceptions (complete list) | `m.enter.group` 430, `m.zoom` 600, `m.keep` 600, `m.mark` 1600, `m.follow` scroll 450, `m.signal` loop, `m.progress.wait` 1400 loop, `m.draw` 1200, lamp arrive 1200 if kept | v2 MOTION 5 | U: array `namedExceptions` mirrored in tokens; test fails on any other value over 300 |
| Frames | no UI-thread frame over 16.7 ms on SE 3 (60 Hz) while scrolling the Book or letter page; 8.3 ms on ProMotion | NS-34 s3; v2 MOTION 12 rule 4 | D (Instruments) |
| Screen change starts | within 100 ms of tap; controls usable by 350 ms | NS-34 s3 | D |
| Hand-offs | Home to Listen, Listen to Review, Review to Book, card to page each within 900 ms | NS-34 s3 | D video |
| Keep to Book | within 2000 ms; local commit p95 200 ms | NS-34 s3 | D |
| Loops | one at most on screen; opacity only; stop on blur, background, sheet, RM, LPM | v2 MOTION 12 rule 5; NS-34 s3 | W + D |
| Recording quiet period | no image decode, font load, route mount, list render, layout transition or glass morph while recording | v2 MOTION 12 rule 7 (ENG-M12) | W (scheduler spy) + D |

## 7. How motion specs become code (Rec)

Basis: v2 MOTION 13 and 13a already name the tokens; the gap is that nothing fails when a screen types a number.

1. **Tokens (`packages/design-tokens/src/tokens.ts`, ENG-M1), additive first.** Consumers of today's names: `packages/design-tokens/src/build-css.ts:144-146` (emits `--ease-standard`, `--duration-fade`, `--duration-enter` into the committed `dist/` CSS, which `apps/web/src/app/globals.css` uses [U how]) and 53 files under `apps/mobile/src` that mention `tokens.motion` or `motion.` ([V grep]). To stay under CODE-R02 (400 lines, 20 files per PR): PR 1 adds the v2 names beside the old ones and the new tests (tokens only, plus `build-css.ts` and regenerated `dist/`); PR 2 to n move consumers a few files at a time (3 to 8 mobile files per renamed key); the last PR deletes the old names and the retired blocks, and flips `tokens.test.ts:174` from 900 to 600. Never rename and migrate in one PR.
   Block contents: Replace `motion` with the 13a block: `capMs`, `sequenceMaxMs` 600, spring `snappy` and `standard` with `response`, `dampingFraction`, `stiffness`, `damping`, `mass`; `easing.standard` and `easing.exit` as tuples; `tap`, `enter`, `exitMs`, `fadeMs`, `swapMs`, `handOff`, `glass.styleS`, `cover`, `zoom`, `keep`, `markMs`, `pageTurn`, `swipe`, `toast`, `progress`, `loading`, `systemLine`, `signal`, `follow`, `namedExceptions`. Rename map in v2 MOTION 13. The generated CSS in `dist/` is regenerated and committed; `tokens.test.ts:61-66` already fails if it drifts [V].
2. **Test 1, spec constants (`packages/design-tokens/test/motion.test.ts`).** (a) every timed value and spring response is at most `capMs` unless its key is in `namedExceptions`; (b) `namedExceptions` equals the v2 MOTION 5 list, no more; (c) stiffness is within 5 percent of (2 pi / response)^2 and damping within 5 percent of 4 pi x fraction / response (v2's own tolerance, `v2 MOTION.md:347` [V]; I first wrote 4 percent, which was stricter than v2 for no reason. Today's 520/46 against 504/45 is 3.2 and 2.2 percent [E], so it passes); (d) each spring's damping fraction is at least 0.9 (v2's floor; standard is 0.92, snappy 1.0); (e) `sequenceMaxMs` 600 and every composite sum is at most that, except named; (f) `easing.exit` value is marked UNVERIFIED in the test comment until someone checks it (v2 MOTION 3 [V]).
3. **Test 2, no hard-coded motion (`apps/mobile/test/motion-no-literals.test.ts`, S).** Scan `apps/mobile/src` minus `lib/motion.ts`, `components/motion/**`, `*.logic.ts`: fail on `withTiming(` or `withSpring(` or `.duration(` or `.delay(` or `Easing.bezier(` or `withRepeat(` with a numeric literal or a locally declared number constant, and on `FadeIn`, `FadeOut`, `Layout`, `LinearTransition` outside `components/ui`, `components/motion`, `lib/motion.ts`. Start with the allow-list in section 1 (6 sites) and ratchet: the test fails if the list grows, and if a listed site is cleaned the test fails until its line is removed from the list. This is v2 ENG-M2's lint rule delivered as a test, which runs in `npm test` today with no lint plugin.
4. **Test 3, Reduce Motion matrix (W).** For each primitive in `lib/motion.ts` the RM branch returns an opacity-only or no-op plan: loop over `PRIMITIVES` and assert no transform key and no duration over `fadeMs` (except `m.mark`).
5. **Test 4, route table.** `routeTransitions` rows each carry a T-id; no screen sets `animation` itself (S).
6. **Test 5, glass.** `GlassView` ancestors never set opacity under 1 (S, ENG-M4).
7. **One owner.** `design-systems` owns 1 to 3 and 5 to 6; `mobile` owns 4 on its screens. Sizes: [E] test 1 half a day; test 2 one day plus clean-up of 6 sites; test 3 half a day (basis: v2 ENG-M1/M2 sizes not given; my estimate).

## 8. What the prototypes show that the written MOTION.md does not say

Found by grepping the five MOTION-PROTOTYPE.html files (`scratchpad/proto`, from `docs/e2e-ux-20nov`); I did not play them [U].

1. **Only area A plays v2 values.** A's table has standard spring 439/38.5 and `keep` 0/120/400/600 (`A proto:147` [V]). B (`B proto:213`), C (`C proto:148`), D (`D proto:158`) and E (`E proto:105`) still use standard 260/30 (0.40 s). Anyone comparing a build with those prototypes sees slower moves than v2 allows. E also still has `sequenceMaxMs` 900 (`E proto:101`) and `emptyBreathMs` 8000.
2. **E's prototype keeps retired motion:** a 9000 ms lamp breath loop (`E proto:46-47`) and an 800 ms spinning indicator (`E proto:66-67`, `animation: spin ... infinite`), while `tokens.v2.json` rules say waiting states are still, busy shows words at every RM setting, never a spinner (`motion.rules`, [V]). v2 MOTION 4 `m.progress.wait` says system indicator, words only under RM. Conflict C-03.
3. **System moves are simulated above the cap.** C pushes at 350 and 330 ms and a sheet at 350 (`C proto:287-301,338`); D sheet in at 380 and out at 300, push 350 (`D proto:259-263,809`), with easings (0.25,1,0.5,1) and (0.32,0.72,0,1) that exist in no token. These stand in for system motion, which v2 exempts, but a tester must not read them as our timings. Add a banner line to each prototype, or an `isSystemStandIn` flag (Rec).
4. **Prototype-only values.** A's signal block has `pausedOpacity: 0.12` (`A proto:149` [V]); it appears in neither A MOTION.md nor v2 MOTION (grep 0 hits [V]). The "paused" aura needs a number in `signal.*` or it is invented.
5. **Wait sweep constant.** D names `waitSweepMs 1400` as PROPOSED (`D proto:165`), v2 names it `progress.sweepMs`. Same value, two names.
6. **Toast timing is richer in the C prototype than in v2.** C plays three modes (`C proto:380-392` [V]): a toast with an action and no `windowS` never times out; one with `windowS` runs a T4 window; a toast with no action leaves after `toastMs` 4000 but has no timer while a screen reader runs. v2 MOTION says only "hold 4000 for non-action toasts" and leaves the VoiceOver case out. Develop's action toast never times out (`toast.tsx:10` [V]) and has no timed mode. The "no timer under a screen reader" rule needs a line in v2 MOTION and a test (U on the toast logic).
7. **Glass in prototypes is drawn by `backdrop-filter` styles** (`E proto:57`); CSS cannot show Liquid Glass lensing, so device row ENG-M9 is the only proof of `m.glass`.
8. **Gaps in the written files.** `T-INLINE` and `T-SLIP` exist in area C and A only; v2 MOTION 6 has `T-SLIP`-like behaviour but no row for them (INDEX 4 uses them [V]). Easing `exit` is unverified (v2 MOTION 14). Reading Low Power Mode needs `expo-battery` (D-065, ENG-M8): not a dependency today.

## 9. Not verified here

Real transition lengths of `fullScreenModal` fade (BL-929); whether `glassEffectStyle` animation is reduced by the system under RM; `Link.AppleZoom` (not adopted); the oldest iOS 26 phone is not named; whether the native sheet can morph from a glass header button. All need a device.
