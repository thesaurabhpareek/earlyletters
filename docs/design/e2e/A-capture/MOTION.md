# Area A. Capture: motion (MOTION LEAD)

Status: DRAFT for reconciliation, 20 Nov 2026. Docs only. Keyed to the screen ids in `DESIGN.md` (A-S01 to A-S15, fixed by the design lead). State names below are the ones this file needs; where `DESIGN.md` names a state differently, the design file wins and this file follows in the reconciliation pass.

Prototype: `MOTION-PROTOTYPE.html` in this folder plays every moment marked "proto" below, with a Reduce Motion toggle, light and dark, and a log of the timeline and haptics outside the phone.

Sources, in order (BRIEF section 1): the locked cards NS-01, NS-04, NS-06 Part C, NS-07 C5, NS-09, NS-14 to NS-17, NS-19, NS-33, NS-34, NS-35; `14-test-plan.md` (J-N1, J-N6, J-N15, J-N20, J-N23); `16-council-review-round-2.md` (T4, D2, D3); `docs/design/MOTION.md` v0.2 (sections 2, 4, 5a to 5e, 5i to 5l, 6, 7); `docs/design/SOUND.md`; `packages/design-tokens/src/tokens.ts` (`motion`); the built code read on 20 Nov: `app/(tabs)/index.tsx`, `app/listen.tsx`, `app/review.tsx`, `app/write.tsx`, `components/capture/{listening-aura,listen-meter.logic,listen.logic,start-tick.logic,saved-moment}.ts(x)`, `components/ui/{toast,toast.logic}.ts(x)`, `lib/transitions.logic.ts`, `lib/motion.ts`, `lib/haptics.shared.ts`. The photo stack (#834 to #840) is not on this worktree; its motion is taken from the card and design spec 01.

Nothing here was run on a phone. Timings are the tokens; device truth comes from BL-929's run sheet.

## 1. The rules for this area

1. **Motion follows the voice** (MOTION principle 1). The only continuous motion in area A is the listening glow on Listen, driven by the microphone level. Nothing else loops on a capture screen.
2. **Controls never animate in** (principle 2, 5.8 rule 3). Speak, Type, Start from a photo, the red circle, Pause, Finish, Let it go, Keep, Undo: opaque and hittable from their first frame. A control that changes state (enabled, label) changes in one frame.
3. **Saves are instant; animation is the receipt** (principle 3). Keep commits, then the haptic, then the moment. Let it go deletes, then the haptic, then the room leaves.
4. **Calm and quick.** Every transition is 300 ms or less, except four named exceptions in section 2, each with its card or house reason.
5. **Interruptible.** A tap during any sequence lands on its end state (5.8 rule 5). Nothing blocks input.
6. **No celebration, no ceremony** (frame section 5; MOTION principle 5). No confetti, burst, check-mark drawing, bounce, counter, streak, badge, sparkle, "flying letter", shredder or fall-away. Keep and Let it go are plain.
7. **Reduce Motion** (MOTION 4; NS-01-R20d; NS-33-R5): nothing travels, nothing scales, no loop runs; every move becomes a fade of 200 ms (`fadeMs`) or less; the glow becomes the static 2 pt ring; the lamp jumps to its level.
8. **Never sound-only, never motion-only meaning.** Every state a parent needs (recording, paused, kept, waiting) is said in text and shape too (NS-33-R12).

## 2. Tokens used (copied from `tokens.motion`; nothing new)

| Token | Value | Used for |
|---|---|---|
| `fadeMs` | 200 | Reduce Motion fade; fades paired with a move; picture arriving |
| `exitMs` | 160 | anything leaving (a line, a prompt, a toast) |
| `enter` | dy 8, 280 ms, easing (0.2, 0, 0, 1) | content entering (never controls) |
| `staggerMs`, `staggerMax` | 30, 6 | Home's cold-launch lines |
| `swapMs` | 150 | words replaced in place (a line, a toast over a toast, a picture over a picture) |
| `route.dissolveMs` | 280 | Home to Listen, Listen to Review, Review out |
| `lamp.leaveMs`, `lamp.returnMs` | 160, 280 | Home's lamp leaving under Listen and Review, and coming back |
| `lamp.arriveMs`, `lamp.dimTo` | 1200, 0.7 | first lit room after a cold launch; the quiet-day dim (exception E-c) |
| `press` | scale 0.97 (controls), 0.98 (cards), opacity 0.9, on `snappy` | press feedback |
| `snappy`, `standard`, `gentle` | k 520 c 46; k 260 c 30; k 90 c 18 (mass 1) | press; sheets and layout; the saved card |
| `breath` | dbFloor -55, dbCeil -10, gamma 0.6, attack 80, release 400, scaleMax 0.18, opacity 0.18 to 0.40, idleAfter 600 | the listening glow |
| `breathIdleMs` | 7500 | idle breath while listening and quiet |
| `file` | chipAt 250, moveAt 550, dy 24, scale 0.9 | the kept moment |
| `sequenceMaxMs`, `hardCeilingMs` | 900, 2000 | the kept moment's soft and hard ceilings |
| `newMarkMs` | 1600 | the arrival wash on the Book (area B draws it) and the Put it back wash |

**The four exceptions to the 300 ms ceiling** (each keeps Reduce Motion rules):

| # | Exception | Why it may run longer |
|---|---|---|
| E-a | The listening glow (MA-15) | Continuous, driven only by the voice (MOTION 5b); release 400 ms after the take |
| E-b | The kept moment, Keep to the Book (MA-39) | NS-34 names it: "Review to the Book after Keep" within 900 ms, and "the visible save hand-off" within 2,000 ms |
| E-c | Lamp light: Home's cold-launch arrival (1.2 s) and the quiet-day dim to 0.7 (1.2 s) | Ambient light, not a transition (MOTION 5k); opacity only; jumps under Reduce Motion. No card says so: Card gap CG-5 |
| E-d | The 1.6 s `accentSoft` wash on a span put back on Review (MA-31) | A locator for what changed (MOTION 5d), not a reward; static then fades under Reduce Motion |

## 3. Moments, by screen

Columns: **Id** (MA-nn) | **Where** (screen and state id) | **Trigger** | **What moves, how long, on what** | **Reduce Motion** | **Haptic** (intent from `lib/haptics.shared.ts`: tap, press, soft, success, warning; iOS / Android per MOTION 6) | **Proto** (plays in the prototype).

Paper sounds (SOUND.md) are off by default and not bundled today; where a sound would pair, the haptics table in section 6 says which.

### A-S01 Home (Say)

| Id | Where | Trigger | What moves | Reduce Motion | Haptic | Proto |
|---|---|---|---|---|---|---|
| MA-01 | A-S01.default (cold launch) | First frame after a cold launch, including recovery to Home after a kill (E-S19) | Dateline, greeting, the typed-day line when present (NS-18 landing), prompt, then slips and waiting cards `enter` (8 pt rise and fade, 280 ms, standard easing), 30 ms apart, at most 6 staggered, all done under 450 ms. Speak, Type, Start from a photo, Not much today and the Plus line are static from frame 1. Lamp arrives over `arriveMs` (E-c) | One 200 ms fade of the content; lamp at its level at once | none | yes |
| MA-02 | A-S01.default (return) | Back from Listen, Review, Write, the picker, a sheet, a tab switch, a warm resume | Nothing moves (5.8 rule 2). The lamp returns over `returnMs` 280 | Lamp jumps | none | yes (in MA-12, MA-40) |
| MA-03 | A-S01.default | Another thought | Old prompt leaves: up 8 pt and out over `exitMs` 160. New prompt: fade in over `fadeMs` 200 with an 8 pt rise, starting at 80 ms (when the old is half gone): ends at 280 ms. Changed from built (360 ms; Engineering gap EG-7) | Old out 160 ms fade, new in 200 ms fade from 80 ms, no travel | tap | yes |
| MA-04 | A-S01.default to A-S01.quietKept | Not much today | Within 100 ms (NS-07 C5 3.4 step 2): the link fades out over `exitMs`; "A quiet day, kept." with its inline Undo fades in over `fadeMs` from 80 ms, in the link's place. Speak and Type do not move. Evening only: the lamp dims to `dimTo` over 1.2 s (E-c) | Same fades; lamp jumps | soft | yes |
| MA-05 | A-S01.quietKept to A-S01.default | Undo on the quiet line | Line out over `exitMs`; link back over `fadeMs` from 80 ms; lamp back to its level over 1.2 s (E-c). The quiet Undo has no stated seconds, so it is not a T4 timer: it stays while Home stays (NS-07 C5 3.6) | Fades; lamp jumps | tap | yes |
| MA-06 | A-S01.default to A-S02.open | "For Asha" (whose book, NS-14) | Our `Sheet` rises on `standard`; scrim fades `fadeMs`. Home keeps its lamp and pauses its breath (MOTION 5i) | Sheet and scrim fade 200 ms, no travel | none (a sheet opening) | yes |
| MA-07 | A-S02.open to A-S01.default | A child chosen | Radio mark changes in one frame. Sheet lowers on `standard`. On Home, in place: the switcher label, the dateline, the prompt (age-chosen) and the waiting cards of that child cross-fade over `swapMs` 150. No stagger, no slide, the capture cluster does not move. VoiceOver focus returns to the switcher, which reads the new name | Sheet fades; the same 150 ms cross-fades | tap (on the choice) | yes |
| MA-08 | A-S01 slips | A slip dismissed (a slip of area B or C on Home) | Slip fades out over `exitMs`; the list closes its gap on `standard` layout | Fade, gap closes at once | none | no |
| MA-09 | A-S01 system lines | Offline, low storage, remote pause line appears or clears (E-S15) | Line fades in or out over `fadeMs` in its reserved place; nothing pulses or repeats | Same | none | no |

### A-S03 Apple's photo picker (system surface)

| Id | Where | Trigger | What moves | Reduce Motion | Haptic | Proto |
|---|---|---|---|---|---|---|
| MA-10 | A-S01 to A-S03 | Start from a photo | The system picker sheet, the system's own motion. Home keeps its light and pauses its breath, as under any sheet. Nothing of ours moves | System's reduced transition | none (navigation; the picker's own taps are Apple's) | no |
| MA-11 | A-S03 to A-S01 | Cancel in the picker | System dismiss; Home exactly as before, nothing moves, no message (NS-01-R4) | System | none | no |
| MA-12a | A-S03.downloading | An iCloud-only picture (NS-01-R17b) | Progress is the system's determinate progress; if our own line shows, its fill moves only with real bytes (a signal), never an indeterminate loop. Cancel is static | No loop in any mode; fill steps | none | no |

### A-S04 Listen, Ready

| Id | Where | Trigger | What moves | Reduce Motion | Haptic | Proto |
|---|---|---|---|---|---|---|
| MA-12 | A-S01 to A-S04 / A-S05 | Speak on Home | Route dissolve `route.dissolveMs` 280 (`fullScreenModal`, `fade`). Home's lamp leaves over `leaveMs` 160 (Listen is an unlit room). On Listen the heading block ("To Asha", audience line, prompt) `enter`s once (280 ms). The red circle, Pause, Finish and the Let it go slot are in place from frame 1 | Dissolve 200 ms; heading fades, no rise; lamp jumps | press on Speak (counts as the take's start tick, `start-tick.logic`) | yes |
| MA-13 | A-S14 to A-S04.fromDoorway | A doorway (widget, control, Action Button, Siri) after unlock | Cold launch: Ready is the first frame, complete; no route move, no stagger, no lamp (unlit room). Warm: the same dissolve as MA-12. Never a start tick: arrival is navigation (NS-06-C1, NS-35). VoiceOver focus on the heading (NS-06 C6) | Cold: nothing; warm: 200 ms dissolve | none | yes |
| MA-14p | A-S03 to A-S04.withPicture | A picture picked (photo-first, NS-01 happy path step 3) | Picker dismisses (system). Listen dissolves in (280). The thumbnail box (flat `surface`, 1 pt hairline frame, `radius.sm`, at most 160 pt tall; 88 pt from AX3, NS-01-R39) is in place from the first frame, so Speak, Type and Change never move. When the picture decodes (budget p95 1,000 ms from picker close) it fades into the box over `fadeMs`. No scale, no zoom, no Ken Burns, no blur-up | Dissolve 200 ms; picture fades 200 ms (a fade is allowed, NS-01-R20d) | none | yes |
| MA-14c | A-S04.withPicture | Change (before speaking) | Picker as MA-10; on return the new picture cross-fades over the old inside the same box over `swapMs`. The box keeps its height; the picture fits uncropped (NS-01-R42) | Same 150 ms cross-fade | none | yes |
| MA-14f | A-S04.photoFailed, A-S04.photoOffline | Picture cannot be opened, or iCloud offline (NS-01-R46) | The box's content cross-fades to the one calm line over `swapMs`; if the box closes, its gap closes on `standard`. Capture goes on | Fade; gap closes at once | none (no error buzz, no sound: CG-6) | yes |
| MA-16 | A-S04.primer, .micOff, .micBusy, .full | A start meets the primer or a blocker | The room hands off to the state screen: room fades out over 140 ms, state screen fades in over 120 ms from 80 ms (`CARD_TO_PAGE.handOff` shape, 200 ms total). Built: instant swap (EG-8) | Same (fades only) | none on the state; press on Try again or Continue (a new start, `start-tick.logic`) | yes |
| MA-17 | A-S04 to A-S06 | Type instead | `router.replace` to Write: the platform sheet rise | System's reduced transition | none | no |

### A-S05 Listen, Recording (the key moments)

**MA-18 Record start** (A-S04.ready or Speak, to A-S05.recording). Proto: yes.

| t (ms from tap) | What happens |
|---|---|
| 0 | Press feedback on the control tapped (Speak, the red circle, or Speak on photo Ready): scale 0.97 on `snappy`, released on lift. Haptic `press` plays now, before the audio session switches (iOS mutes haptics while recording; MOTION 6). Close stops taking touches at once and fades out over `exitMs` (its slot stays, 5.8 rule 3). The Ready hint fades out over `exitMs` |
| 0 to 140 | Paper sounds on only: `record_start` plays, then the 140 ms wait before the recording mode (SOUND 5). Off by default: no wait |
| mic live (budget p95 500 ms from the tap, F04-REQ-023) | The clock slot fades in over `fadeMs` at "0:00". "Listening." fades in over `swapMs`. The glow fades from 0 to its first signal value over `fadeMs`, then follows the voice (MA-19). Pause and Finish become enabled in one frame; Let it go appears in its reserved slot at full strength in one frame (a control) |
| Never | The disc never grows, jumps or pulses; the screen never flashes; no countdown "3, 2, 1" |

Reduce Motion: press feedback is an opacity dip to 0.9 (no scale); Close, hint, clock and line fade as above; instead of the glow, the static 2 pt ring fades in over `fadeMs`.
State in shape and text, not colour (NS-33-R12): Ready is the disc alone with "Tap the red circle and talk."; recording adds the ring (glow or static ring), the clock and "Listening."; paused is the outlined disc with "Paused.".
VoiceOver: no announcement is spoken into a take (B2-21, SR-C-02); see Card gap CG-2 against NS-33-R6.

| Id | Where | Trigger | What moves | Reduce Motion | Haptic | Proto |
|---|---|---|---|---|---|---|
| MA-19 | A-S05.recording | The voice (continuous, E-a) | Glow behind the 120 pt disc: scale 1 + 0.18 s, opacity 0.18 + 0.22 s, where s is the smoothed level (attack 80 ms, release 400 ms, `dt`-based, UI thread). After 600 ms of quiet an idle breath (7.5 s cycle) ramps in. **Proposed (NS-34 "loops change opacity only"): the idle breath moves opacity only**, between 0.18 and about 0.27; scale follows the voice only. Built today it also scales to 1.05 (EG-3) | Static 2 pt ring; opacity steps 0.2 / 0.3 / 0.4 at levels 0.15 / 0.5, 200 ms fades, at most one change per 400 ms; never a loop | none (nothing vibrates between start and stop) | yes |
| MA-20 | A-S05.stillHere | Quiet over 8 s | "Listening." cross-fades to "Still here." over `swapMs`, and back when the voice returns. No pulse, no nudge | Same | none | yes |
| MA-21 | A-S05.recording | Each second | The clock's digits change in place (tabular figures, `textMuted`). No rolling digits, no ring, no bar | Same | none | yes |
| MA-22 | A-S05.recording to A-S05.paused | Pause | Disc fill cross-fades to the outlined disc over `swapMs`; glow settles to its paused dim (0.12) over `fadeMs` (built: jumps, EG-5); "Paused." cross-fades in; the button's label changes to "Keep talking" in one frame | Ring fades to its paused value 200 ms | none (MOTION 6; supersedes spec 05 H5's stop cue on pause) | yes |
| MA-23 | A-S05.paused to A-S05.recording | Keep talking | The reverse; the glow resumes from rest with the voice | Same | none | yes |

**MA-24 Record stop** (Finish, A-S05 to A-S07). Proto: yes.

| t | What happens |
|---|---|
| 0 | Press feedback on Finish. Pause and Finish disabled in one frame; Let it go leaves at once (never offer delete while the take is being kept, BL-563). The glow begins its release to rest over `breath.releaseMs` 400 (E-a) |
| recorder stopped | Haptic `press` (the stop tick, after the session ends). Paper sounds on only: `record_stop` |
| then | Route replace to Review: dissolve 280. The glow's release overlaps the dissolve; Review never waits on it. Hand-off "Listen to Review" within 900 ms (NS-34) |
| Review settled (`dissolveMs` after mount) | Review's title is announced and takes VoiceOver focus (built) |

Reduce Motion: the ring fades with the 200 ms dissolve; nothing else.

| Id | Where | Trigger | What moves | Reduce Motion | Haptic | Proto |
|---|---|---|---|---|---|---|
| MA-25 | A-S05.interrupted to A-S07.stoppedBy | A call, Siri, an alarm, the app to the background | Nothing animates in the background. The take is kept; on return Review dissolves in (280) with its one reason line present from the first frame, static | 200 ms dissolve | none (iOS cannot play it from the background) | no |

### A-S06 Write (Type)

| Id | Where | Trigger | What moves | Reduce Motion | Haptic | Proto |
|---|---|---|---|---|---|---|
| MA-26 | A-S01 to A-S06 | Type | Platform sheet rise (`modal`). Home keeps its light and pauses its breath; Write's still `write` lamp returns over `returnMs` | System reduced; lamp jumps | press (a capture starts) | no |
| MA-27 | A-S06 | Another thought in Write | As built: old line out over `exitMs`, new fades in where it stood, the field follows the height change on `standard`; the control fades out at the first character, its space held | Swap at once, no slide | tap | no |
| MA-28 | A-S06 | "Saved on this phone" after a pause | Fades in over `fadeMs`, then stays. Never blinks, never repeats | Same | none | no |
| MA-29 | A-S06 to A-S13 | Add to the book or Keep private | The Keep sequence MA-39 from the sheet (it holds still until the commit) | As MA-39 | success at the commit | no |

### A-S07 Review, and its sheets A-S08 to A-S12

| Id | Where | Trigger | What moves | Reduce Motion | Haptic | Proto |
|---|---|---|---|---|---|---|
| MA-30 | A-S07.wordsWaiting | Words not ready | The honest progress line ("Part 2 of 5", a download percentage) changes its text in place; no spinner, no shimmer, no skeleton, no loop (NS-33-R5) | Same | none | no |
| MA-31w | A-S07.wordsWaiting to A-S07.default | Words arrive from the queue | The words fade in whole over `swapMs`; the block's height moves on `standard`. Never typed out word by word: motion must never suggest the machine is writing (constitution; MOTION 5c) | Fade; height at once | none | yes |
| MA-32 | A-S07.default | Fix marks | Underlines at final opacity on the first frame (information, not decoration) | Same | none | no |
| MA-33 | A-S07.markOpen | Tap a mark | Inline card opens under the line: height on `standard`, content fades in over 160 ms from 80 ms | Height at once; content fades 200 ms | tap | yes |
| MA-34 | A-S07.putBack | Put it back | Current words out over 120 ms, the said words in over 160 ms; the paragraph reflows on `standard`; the restored span carries an `accentSoft` wash fading over 1.6 s (E-d). "Put back. Undo" persists until dismissed: no stated seconds, so not a T4 timer | Reflow at once; 200 ms fades; wash static, then fades | tap (and tap on its Undo) | yes |
| MA-35 | A-S07.default | With small fixes / Exactly as said | The letter's words cross-fade over `swapMs`. The selected option is shown by shape and weight; no sliding thumb | Same | tap | no |
| MA-36 | A-S07.playing | Play / Pause on the mini-player | Icon changes in one frame; the position moves with the real audio clock (a signal). No waveform, no equaliser bars | Position steps once a second | none (playback has none) | no |
| MA-37 | A-S07 to A-S08 | Tap the dateline (NS-15) | `Sheet` rises on `standard`; the system date control has its own feedback. On Save the sheet lowers; the dateline cross-fades over `swapMs`; when the about-day differs, the "Said on" line fades in over `fadeMs` and the block grows on `standard` | Sheet fades; line fades; height at once | none (not a letter outcome) | no |
| MA-38 | A-S07 to A-S09 | From (NS-16) | The field opens in place (or as a sheet, as DESIGN.md decides): height on `standard`, field and its instruction line fade in together over `fadeMs`; a name used before, picked: its chip shows selected in one frame; the signature line cross-fades over `swapMs` | Height at once; fades | tap on a picked name | no |
| MA-39a | A-S07 to A-S10 | "This was in another language" (NS-17) | The words fade out over `exitMs` (no travel); the "words are waiting" line fades in over `fadeMs` from 80 ms; height on `standard`. The player does not move. VoiceOver focus moves to the waiting line (the focused control's neighbours changed) and it is read once | Fades; height at once | tap | yes |
| MA-39b | A-S10 | Type the words yourself | Editor opens in place: field fades in over `fadeMs`; the keyboard is the system's | Fade | none | no |
| MA-40p | A-S07.withPicture | Add a photo on Review | Picker as MA-10; on return the box opens on `standard` and the picture fades in over `fadeMs`; words above never move | Box at once; picture fades | none | no |
| MA-41 | A-S12.confirm | Change on a letter that has a picture | "Use this photo instead?" sheet rises on `standard`; "Keep the first" is the default. Keep the first: sheet lowers, nothing else moves. Confirm: sheet lowers, the new picture cross-fades over the first over `swapMs`, then the Undo window opens (MA-44) | Sheet fades; cross-fade | none | yes (in MA-44) |
| MA-42 | A-S07.withPicture | Take the photo off | The picture fades out over `exitMs`; the box closes on `standard`; the Undo window opens (MA-44). The file stays until the window closes (NS-01 section 5) | Fade; box closes at once | none (the Undo line is the receipt) | yes (in MA-44) |
| MA-43 | A-S07.keepDisabled | Keep tapped with a picture and no words (NS-01-R5a) | Nothing. Keep is disabled from its first frame and the reason is a static line. No shake, no buzz, no bounce, no tooltip | Same | none | no |

**MA-39 Keep** (A-S07 or A-S06, to A-S13.kept, to the Book). Proto: yes. Exception E-b.

| t (ms from commit) | What happens | Token |
|---|---|---|
| tap | Keep's press feedback; the Keep gate runs first (D-082). If Plus is needed, the gate sheet (E-S10) rises on `standard` and nothing is written; no kept moment | `press`, `standard` |
| commit | Local transaction (p95 200 ms, 06-nfr 2.2). Then haptic `success`. Paper sounds on only: `sealed`, never while the mini-player plays | |
| 0 | The letter card scales 1 to 0.9 and its top radius `xl` to `md`, on `gentle`. The card is hidden from VoiceOver; one sentence is announced ("Kept in Month 7", or "Kept just for you.") | `file.scale`, `gentle` |
| 250 | The chip fades in under the card over `fadeMs` | `file.chipAtMs` |
| 550 | The card moves down 24 pt and fades, over 350 ms, standard easing | `file.moveAtMs`, `file.dy` |
| 900 | Review fades out over `fadeMs`; the Book is underneath on the new letter (`arrived=<id>`), its lamp returning over `returnMs` | `sequenceMaxMs` |
| 1100 | Arrival: the new card is already in place on the Book, with the `accentSoft` wash fading over 1.6 s (area B owns that frame; no tab badge) | `newMarkMs` |
| any time | A tap anywhere skips to the Book | |

VoiceOver: the moment holds until its sentence has been said: at least 3 s from the commit and, on iOS, until `announcementFinished` for that sentence, at most about 8 s (built, `savedMomentLeaveInMs`).
Reduce Motion: at 0 the chip and its line fade in over 200 ms; nothing scales or travels; at 900 Review fades over 200 ms; the Book's wash is static, then fades.
Never: a check mark that draws itself, a count ("your 12th letter"), a milestone in Review, a burst, an envelope flying to the Book tab, a sound by default. The first letter's moment is this same moment (MOTION 5h: milestones belong to the Book, area B).

**MA-40 Let it go** (A-S11, from Listen A-S05 or Review A-S07). Proto: yes.

| Step | What happens |
|---|---|
| Tap Let it go | The confirmation opens (today the system Alert, NS-09 section 15: the existing confirmation sheet). Its own motion is the system's. No haptic on opening. On Listen the take keeps recording behind it: nothing on Listen changes |
| Keep it (the default, NS-09-R9) | The confirmation closes. Nothing else moves |
| Confirm | The draft is marked, the file deleted, then the row (NS-09 happy path). Haptic `warning`, after the session has stopped (on Listen, after the recorder closes). No sound (SOUND: `record_stop` never on Discard) |
| Leave | The room dissolves away (280) to where the parent started (Home). Home moves nothing (MA-02): no toast, no "removed" line, no card falling away, no shredding, no fade-to-dust. Nothing is shown except the return (NS-09 step 5) |
| Delete failed (A-S07.notRemoved, NS-09-R4a) | Review shows the one line under the words: it fades in over `fadeMs` in the app's small muted voice, no icon, no red, no shake; the block grows on `standard`; VoiceOver announces it after the screen has settled (after the fade ends, NS-09-R4b). It never blocks leaving Review. See CG-7 for whether Review stays or leaves first |

Reduce Motion: the system's reduced alert; the 200 ms dissolve; "no animation on removal beyond the system's" (NS-09 section 6).

### MA-44 The undo window (ruling T4), one pattern for every timed Undo in area A

Applies to: Undo after a confirmed picture replace or take-off (A-S12.undo on Review, NS-01-R38a to R38c), and any other Undo whose card states seconds. Not to the quiet-day Undo (MA-05) or Put it back's Undo (MA-34): neither has stated seconds, so they persist until the parent moves on (as built; DESIGN_LANGUAGE 11.5). Proto: yes.

| Phase | What moves | Timing |
|---|---|---|
| Opens | The undo line (a `Toast` with Undo, or the inline line DESIGN.md chooses) enters: 8 pt rise and fade over `enter` 280. If a toast is already up, the words cross-fade in the same box over `swapMs` and the replaced Undo's chance ends (COMPONENTS 2.14) | 280 ms (RM: 200 ms fade) |
| Open | **Nothing moves.** No countdown bar, shrinking ring, ticking number, pulse or colour change: a visible countdown is a counter and hurries the parent. Undo and Close are 44 pt and static | N s, see the clock rule below |
| Undo pressed | Haptic `tap`. The picture comes back: cross-fade over `swapMs` in its box (or the box reopens on `standard`). The line leaves over `exitMs`. The outcome is announced once | 150 ms; 160 ms |
| Closes | The line leaves: fade and 8 pt drop over `exitMs` 160 (RM: 160 ms fade). **Undo stays valid until the line is fully gone**: the action's expiry is the close time plus `exitMs`, so no frame ever shows an Undo that no longer works (NS-01-R38b), and the button is removed from the accessibility tree at the same instant it is removed from the screen | 160 ms |

The clock (T4; NS-33-R15):
- The N seconds (10 for NS-01-R38a) start when the line has finished entering.
- With VoiceOver on, the window cannot close before VoiceOver has finished reading the undo line plus N seconds: on iOS, from the `announcementFinished` event for that sentence (the same signal `saved-moment.tsx` uses); if no event comes within 8 s, from 8 s. Whichever is later wins.
- With Switch Control on, the window does not close on time at all; it closes when the parent moves on (CG-4 proposes what "moves on" means).
- Leaving the screen closes it in every mode; a toast with Undo is never carried to another screen.
- App to the background: the clock pauses and resumes on return (the parent did not see those seconds). PROPOSED; CG-3.

## 4. Doorways and hands-free (A-S14, A-S15)

| Id | Where | What moves | Reduce Motion | Haptic |
|---|---|---|---|---|
| MA-45 | A-S14 widget, Control Center control | Static (NS-06-C2): no animation, no name, no count. The control's press is the system's | System | System |
| MA-46 | A-S14 Siri, Action Button, unlock | System surfaces only; the app arrives as MA-13 | System | none of ours |
| MA-47 | A-S15 (hypotheses, NS-04 findings decide) | How a parent knows a take started or stopped without looking (NS-04 Q6): the start tick before the microphone opens and the stop tick after it closes (MA-18, MA-24); the optional paper sounds `record_start` and `record_stop`; never a spoken word during a take. A Live Activity, if NS-04 ever passes one: at most 2 s per animation, moves existing elements only (MOTION 1, Live Activities), and its clock is the system timer, never a gap count | Static | press at start and stop only |

## 5. Parked, so drawn only as a rule

- NS-19 Add more to this letter, when taken up: Continue on Home's waiting card opens Listen exactly as MA-12; speaking again is a new take, so `press` plays once. On Review the second take's block `enter`s once under the first; the two takes never merge, slide together or reflow into one paragraph. No "add audio" anywhere on the letter page.
- NS-20 (a letter to two books): no motion; not in this area's journeys.

## 6. Haptics in area A (outcome, never navigation: MOTION 6)

| Moment | Intent | iOS / Android | Paper sound (off by default) | Never |
|---|---|---|---|---|
| Speak, Type (a capture starts) | press | `impactAsync(Light)` / `Context_Click` | `record_start` for Speak only, then 140 ms before the microphone | Again on the start Speak opened |
| The red circle, Continue after the primer, Try again after a blocker | press (one start tick per take, `start-tick.logic`) | same | `record_start` | On a doorway arrival |
| Finish (after the recorder stops) | press | same | `record_stop` | Before the recorder stops; on Pause |
| Pause, Keep talking | none | none | none | Anything between start and stop |
| Not much today | soft | `impactAsync(Soft)` / `Long_Press` | none | |
| Another thought, a child chosen, a name picked, a view chosen, a mark opened, Put it back, Undo, Record again, Try again for words, another-language mark | tap | `selectionAsync()` / `Segment_Tick` | none | |
| Keep (after the commit) | success | `notificationAsync(Success)` / `Confirm` | `sealed` (not while the mini-player plays) | Before the commit; a second time on arrival |
| Let it go, confirmed | warning | `notificationAsync(Warning)` / `Reject` | none | On opening the confirmation; while recording |
| A picture fails, iCloud offline, Keep disabled, a blocker screen | none | none | none (CG-6) | An error buzz |
| Sheets, the picker, route changes, tabs, scrolling, typing, playback | none | none | none | |

The 100 ms throttle drops ticks, never `success` or `warning` (`haptics.shared.ts`). A haptic always pairs with a visible change (iOS mutes haptics in Low Power Mode and during dictation).

## 7. What never animates in area A

- No celebration or ceremony on Keep, the first letter, a quiet day, a picture, a child switch, a doorway or Let it go.
- No counters: no animated letter count, no countdown on an Undo, no "days since", no progress ring around the red circle. The recording clock is plain elapsed time in `textMuted`, digits changing in place.
- No live waveform or equaliser (founder rule; MOTION 1, Voice Memos: avoid).
- No word-by-word typing of transcript words, no shimmer over waiting words, no "writing" animation of any kind (constitution).
- No pulse, bounce or glow on Speak, Type, Start from a photo or Not much today to draw a tap; no "attention" animation on a slip or the Plus line.
- No shake or buzz on a disabled or refused control.
- No Ken Burns, parallax, zoom or blur-up on a picture.
- No animated font size, shadow, blur or per-frame gradient (MOTION 7).
- No loop of any kind under Reduce Motion (NS-33-R5) or, once it can be read, Low Power Mode (NS-34; EG-4).

## 8. Reduce Motion and loops register (for J-N15 and NS-33-R5)

| Loop or continuous motion on an area A screen | Normal | Reduce Motion | Low Power Mode |
|---|---|---|---|
| Home lamp breath (`tonight` scene, 9 s, opacity only) | Runs while Home is focused and in front; pauses under sheets and the picker | Off | Should stop (NS-34); not read today (EG-4) |
| Listening glow, voice-driven (MA-19) | Runs only while recording | Static ring, stepped opacity | Voice-driven part stays (it is the signal); idle breath should stop (EG-4) |
| Listening idle breath | Opacity only (proposed, EG-3) | Off | Should stop (EG-4) |
| Glow release after Finish | 400 ms decay, once | Off | Same |
| Put it back wash | One 1.6 s fade, once | Static then fades | Same |
| Anything else | None | None | None |

## 9. Performance (MOTION 7, NS-34)

- The glow runs in a UI-thread frame callback, only while recording or releasing (`auraRunsFrames`); JS writes the level from a 50 ms timer and never re-renders per frame.
- Transform and opacity only; the saved card's radius is the one allowed exception.
- No frame over 16.7 ms on an SE 3 during any MA moment; hand-offs within 900 ms (Home to Listen, Listen to Review, Review to the Book); Keep to the Book showing the letter within 2,000 ms.
- iOS `fullScreenModal` with `fade` cross-dissolves at the platform's own length, not exactly 280 ms (`transitions.logic.ts`, accepted in 5.1); BL-929's run sheet measures the real number.

## 10. Proposed test rows (motion only; titles in the card form, each tied to a card row)

| Id | Given, When, Then | Card row |
|---|---|---|
| A-MO-1 | Given Reduce Motion, When each MA moment plays, Then no view's transform changes and every opacity change lasts 200 ms or less (E-d excepted, a single fade) | NS-01-R20d, NS-33-R5 |
| A-MO-2 | Given an undo window of 10 s and VoiceOver that finishes the line at 6 s, Then Undo works until 16 s plus `exitMs` and is gone from the screen and the accessibility tree at the same instant | NS-01-R38a, R38b, NS-33-R15 |
| A-MO-3 | Given Switch Control on, Then an undo window never closes on time and closes when the parent leaves the screen or activates another control | NS-01-R38c |
| A-MO-4 | Given Listen recording with the level at silence for 10 s, Then the glow's scale stays at 1 and only its opacity moves | NS-34 section 3 (loops opacity only) |
| A-MO-5 | Given Keep, Then the success haptic is called after the commit resolves and before the first animated frame; given Let it go, the warning haptic is called after the recorder has stopped and the file delete has been tried | MOTION principle 3; NS-09 |
| A-MO-6 | Given every A-S01 and A-S05 control, Then its opacity is 1 on the first frame of every transition into its screen | MOTION principle 2 |
| A-MO-7 | Given a picture picked, Then the thumbnail box's height is fixed from the first frame and Speak, Type and Change have the same frame before and after the picture decodes | NS-01-R39, R42 |

## 11. Superseded (the card wins)

- Design spec 01 (11 Nov) section 7, "Thumbnail appears on Ready: `enter` (8 pt, 280 ms)": NS-01 section 15 says "None new beyond existing fades". Now MA-14p: the box is in place, the picture fades.
- Design spec 01 section 4, "Toast offers Undo for 10 seconds" with the toast's never-timing-out behaviour: now T4 through MA-44.
- Design spec 05 (11 Nov) H5, "`recordStop` cue on pause": MOTION 6 and SOUND rule 1 hold: nothing between start and stop. H10 "`success` haptic when saved" at Finish: `success` is Keep's only (MA-39); Finish plays the stop tick.
- COMPONENTS 2.14 "an undo toast persists until dismissed": stands only for Undos with no stated seconds; T4 windows close as MA-44.

## 12. Card gaps (cards unchanged; proposed defaults)

| # | Card row | What is missing or in tension | Proposed default |
|---|---|---|---|
| CG-1 | NS-34 section 3 "Loops change opacity only" | The built idle breath on Listen scales (to 1.05). The card is clear; the code differs | Opacity-only idle breath (MA-19; EG-3) |
| CG-2 | NS-33-R6 "start and stop are announced within 1 s" vs SR-C-02 / B2-21 (VoiceOver never speaks into a take) | The card does not say how start is announced when speech would be recorded | Start: the press tick before the microphone opens is the announcement for VoiceOver users, and the Listen heading's value reads "Recording" without being spoken; if `a11y` and the CPO want speech, announce "Recording." before the microphone opens and open it on `announcementFinished` (at most 1 s), for VoiceOver users only. Stop: announced after the recorder stops (allowed today). Needs a ruling |
| CG-3 | NS-01-R38a, T4 | When the N seconds start, and what happens in the background | From the end of the line's entrance; the clock pauses while the app is in the background |
| CG-4 | NS-01-R38c, T4 "until the parent moves on" | "Moves on" is not defined | Leaves the screen, activates any other control on it, or locks the phone |
| CG-5 | Brief's 300 ms ceiling; NS-07 C5 3.4 | The quiet-day lamp dim (1.2 s) and the cold-launch lamp arrival (1.2 s) are longer; no card mentions them | Keep both as ambient light (E-c), opacity only, off under Reduce Motion; CDO confirms |
| CG-6 | NS-01 section 5 (calm failure line) vs SOUND.md 4 (`gentle_error` for "a photo that failed to attach", paired with an Error haptic) | SOUND.md asks for a sound and an Error haptic the five-intent vocabulary does not have | No sound and no haptic on a picture failure; SOUND.md to be amended by `design-systems` in a separate docs PR |
| CG-7 | NS-09 step 5 ("nothing is shown except the return") vs NS-09-R4a (the line shows "on that Review visit") | Whether Review stays to show the not-removed line or leaves first | Review stays when the delete throws, shows the line (MA-40 last row), Let it go is gone, and the parent leaves by Close; DESIGN.md decides |
| CG-8 | NS-17 section 4 | No Undo is named for "This was in another language" | If DESIGN.md adds one with stated seconds, it is an MA-44 window; if without, it persists until the parent moves on |

## 13. Engineering gaps (the backlog row each belongs to)

| # | Gap | Row |
|---|---|---|
| EG-1 | `Toast` with an action never times out, while the photo undo expires: the shared undo-window helper of MA-44, with the action's expiry at close plus `exitMs` | BL-954 |
| EG-2 | Nothing in `apps/mobile/src/lib/a11y*` reads Switch Control; React Native's `AccessibilityInfo` is not known to expose it (UNVERIFIED). A small native read of `UIAccessibility.isSwitchControlRunning` and its change notification is needed for MA-44 | BL-954, BL-984 |
| EG-3 | Listening idle breath: opacity only (`listening-aura.tsx`, `tokens.motion.breath.idleScale` to 0, with its token test) | no row; proposed under NS-34 next to BL-929 |
| EG-4 | Low Power Mode is not read (MOTION 5k: needs `expo-battery`, D-065), so the Home lamp breath and the idle breath do not stop in Low Power Mode as NS-34 requires | no row; founder dependency decision (D-065) |
| EG-5 | Pause: the glow jumps to its paused value; fade over `fadeMs` | BL-984 (recording state) or a small P4 follow-up |
| EG-6 | Ready to recording: the glow appears at `opacityMin` in one frame; fade from 0 over `fadeMs` | as EG-5 |
| EG-7 | Another thought on Home totals 360 ms; start the new prompt at `exitMs / 2` with `fadeMs` (ends at 280) | no row; small change to `index.tsx` |
| EG-8 | Listen's primer and blocker screens replace the room in one frame; 200 ms hand-off | no row; small change to `listen.tsx` |
| EG-9 | The thumbnail box at a fixed height from the first frame, picture fading in on decode, fit not crop | BL-956 |
| EG-10 | Child switcher on Home: in-place 150 ms cross-fade of the label, dateline, prompt and cards after a choice | BL-941 |
