# Area A. Capture: motion (MOTION LEAD)

Status: DRAFT for Karma's reconciliation, 20 Nov 2026. Docs only. Keyed to `DESIGN.md` in this folder: screen ids A-S01 to A-S15, and the canonical state names of its section 9.2. Every row names its design system v2 primitive (`m.*`) and transition (`T-*`) from `docs/design/system/MOTION.md`, which declares itself the standard and wins where this file and it differ; where this area needs something v2 does not name, this file proposes it to v2 (section 12) and does not define a new move.

Prototype: `MOTION-PROTOTYPE.html` in this folder plays every moment marked "proto", with Reduce Motion, dark and slow-motion toggles, and a log of the timeline, haptics and screen-reader events outside the phone.

Sources, in order (BRIEF section 1): the locked cards NS-01, NS-04, NS-06 Part C, NS-07 C5, NS-09, NS-14 to NS-17, NS-19, NS-33, NS-34, NS-35; `14-test-plan.md` (J-N1, J-N6, J-N15, J-N20, J-N23); `16-council-review-round-2.md` (T4, D2, D3); design system v2 `MOTION.md` (sections 2 to 11), `COMPONENTS.md` (A2, A3, C3, F1, F5, F6); `docs/design/MOTION.md` v0.2 where v2 keeps it; `docs/design/SOUND.md`; `tokens.motion` in `packages/design-tokens/src/tokens.ts`; the built code read on 20 Nov: `app/(tabs)/index.tsx`, `app/listen.tsx`, `app/review.tsx`, `app/write.tsx`, `components/capture/{listening-aura,listen-meter.logic,listen.logic,start-tick.logic,saved-moment}`, `components/ui/{toast,toast.logic}`, `lib/transitions.logic.ts`, `lib/motion.ts`, `lib/haptics.shared.ts`. The photo stack (#834 to #840) is not on this worktree; its motion comes from card NS-01 and design spec 01.

Nothing here was run on a phone. Device truth comes from BL-929's run sheet and v2's ENG-M11.

## 1. The rules for this area

1. **Motion follows the voice.** The only continuous motion in area A is the listening aura on Listen (`m.signal`), driven by the microphone level. Nothing else loops on a capture screen.
2. **Recording state is instant** (v2 section 5; A3). Ready to recording, recording to paused and back, Still here, interrupted, stopped: the record control, its label, its colour, the line and the elapsed time change on the frame the recorder reports the state (`m.instant`, glass `animate: false`). Only the aura eases, because it follows the voice.
3. **Controls never animate in.** Speak, Type, Start from a photo, the record control, Pause, Let it go, Keep, Undo: opaque and hittable from their first frame.
4. **Commit first, then the receipt.** Keep commits, then `H-success`, then `m.keep`. Let it go deletes, then `H-warning`, then the room leaves.
5. **Quick.** Every move we draw is 300 ms or less, except v2's named exceptions used here: `m.enter.group` (430), `m.keep` (600 to the Book), `m.mark` (1600), `m.signal` (continuous), and the lamp's cold-launch arrival if the lamp is kept (1200).
6. **Interruptible.** A tap during any move lands on its end state.
7. **No celebration, no ceremony, no counters** (v2 section 11). Keep and Let it go are plain.
8. **Reduce Motion** (v2 section 8; NS-01-R20d; NS-33-R5): nothing travels or scales, no loop runs, every move is a fade of 200 ms or less, the aura is a static ring.
9. **Motion is never the only signal.** Recording, paused, kept and waiting are said in words and shape too (NS-33-R12).
10. **Nothing decodes during recording** (v2 section 12 rule 7): Listen's picture is decoded and on screen before the take can start.

## 2. Values (today's `tokens.motion`, with the v2 names and v2 changes)

| v2 name | Value | Today | Used here for |
|---|---|---|---|
| `spring.snappy` | 0.28 s, 1.0 (520, 46, 1) | `snappy` | `m.tap`, `m.select`, the toast's rise |
| `spring.standard` | 0.30 s, 0.92 (439, 38.5, 1) | `standard` 0.40 s (260, 30): v2 retunes | `m.move` |
| `easing.standard`, `easing.exit` | (0.2, 0, 0, 1); (0.3, 0, 1, 1) | `easing`; exit is new in v2 (its value UNVERIFIED there) | timed enters; exits |
| `fadeMs`, `exitMs`, `swapMs` | 200, 160, 150 | same | `m.fade`, `m.exit`, `m.swap` |
| `enter` | dy 8, 280 ms, stagger 30, first 6 | same | `m.enter`, `m.enter.group` |
| `cover.dissolveMs` | 280 | `route.dissolveMs` | `m.cover` (Listen, Review) |
| `keep` | line at 0, move at 120, dy 24, Review leaves at 400, Book at 600 | `file` (chip 250, move 550, scale 0.9, about 1.1 s): v2 retimes | `m.keep` |
| `markMs` | 1600 | `newMarkMs` | `m.mark` (Put it back; arrival on the Book) |
| `signal.*` | dbFloor -55, dbCeil -10, gamma 0.6, attack 80, release 400, scaleMax 0.18, opacity 0.18 to 0.40, idleAfter 600, idleMs 7500, idleScale 0.05 (this file proposes 0, P-1) | `breath.*`, `breathIdleMs` | `m.signal` |
| `tap` | 0.97 controls, 0.98 cards; RM opacity 0.9 over 90 ms | `press` | `m.tap` |
| `glass.styleS` | 0.25 s | new | `m.glass`, `m.toast` |
| `lamp.leaveMs`, `lamp.returnMs`, `lamp.arriveMs` | 160, 280, 1200 | same; pending FOUNDATIONS (v2 section 10) | Home's light under Listen and Review |

## 3. Moments, by screen

Columns: **Id** | **Where** (canonical state ids) | **Trigger** | **v2** | **What moves** | **Reduce Motion** | **Haptic** (v2 section 9: H-select `tap`, H-press `press`, H-soft `soft`, H-success `success`, H-warning `warning`) | **Proto**.

Paper sounds (SOUND.md) are off by default and not bundled; section 6 says where one would pair.

### A-S01 Home (Say)

| Id | Where | Trigger | v2 | What moves | Reduce Motion | Haptic | Proto |
|---|---|---|---|---|---|---|---|
| MA-01 | A-S01.default, A-S01.waiting, A-S01.typedDay (cold launch, or recovery to Home after a kill, E-S19) | First frame | T-LAUNCH, `m.enter.group` | Dateline, greeting, the typed-day line (part of the prompt block), prompt, then the slip or waiting cards: 8 pt rise and fade, 280 ms, 30 ms apart, first 6 only (430 ms to the last). The capture cluster (A2), Not much today and the Plus line are there from frame 1. Lamp, if kept: arrives over 1200 ms once | One 200 ms fade, no stagger; lamp at its level | none | yes |
| MA-02 | A-S01.* (return) | Back from Listen, Review, Write, the picker, a sheet; a tab switch; a warm resume | T-RESUME | Nothing re-enters. Lamp, if kept, returns over 280 | Lamp at its level | none | yes (in MA-12, MA-40) |
| MA-03 | A-S01.default | Another thought | `m.swap` | The prompt is replaced in place: a 150 ms cross-fade in the same box; the box takes its new height at the end (`m.move`). Built today: exit 160 then enter from 80 (360 ms in all), retired (EG-7) | Same cross-fade; height at once | tap (as built; P-4) | yes |
| MA-04 | A-S01.default to A-S01.quietKept | Not much today | `m.swap` | Within 100 ms (NS-07 C5 3.4): the link's place swaps to "A quiet day, kept." with its Undo, 150 ms cross-fade. Speak and Type never move. Lamp, if kept, evening only: dims to 0.7 over 280 (P-3; built 1200) | Same swap; lamp at its level | soft | yes |
| MA-05 | A-S01.quietKept to A-S01.default | Undo on the quiet line | `m.swap` | The line swaps back to the link; the lamp returns. This Undo has no stated seconds (NS-07 C5 3.6: it stays while Home stays), so it never closes on a timer (CG-9) | Same | tap | yes |
| MA-06 | A-S01.twoBooks to A-S02.default | "For Asha" (NS-14) | T-SHEET, `m.sheet` | The system sheet rises (native `formSheet`, glass by iOS). Home keeps its state; the lamp's breath, if kept, pauses | System reduced transition | none (opening is navigation) | yes (stand-in) |
| MA-07 | A-S02.default to A-S01.twoBooks | A child chosen | `m.select`, `m.sheet`, `m.swap`, `m.fade` | The radio mark moves to the choice; the sheet goes down (system). On Home, in place: the switcher label, the dateline and the prompt cross-fade (`m.swap`, 150); the waiting cards' block hands off (`m.fade`, 200, linear: words). No stagger, no slide; the capture cluster never moves. VoiceOver focus returns to the switcher, which reads the new name | Mark jumps; the same fades | tap | yes |
| MA-08 | A-S01 slip | A slip dismissed (slips of areas B and C sit on Home) | `m.list.remove` | Slip `m.exit` (opacity only), then the space closes (`m.move`) | Fade; space closes at once | none | no |
| MA-09 | A-S01 with E-S15 or E-S17 | Offline, remote pause, low storage line appears or clears | T-SYSLINE | Line `m.enter`, content below `m.move`; leaving: `m.exit` then `m.move`. Never pulses | Line fades; layout at once | none | no |

### A-S03 Apple's photo picker (system)

| Id | Where | Trigger | v2 | What moves | Reduce Motion | Haptic | Proto |
|---|---|---|---|---|---|---|---|
| MA-10 | A-S01 to A-S03.open | Start from a photo | `m.tap.glass` (A4), system presentation | Apple's picker, Apple's motion. Nothing of ours moves | System | none | yes (stand-in) |
| MA-11 | A-S03.open to A-S01 | Cancel | system | Picker dismisses; Home exactly as before, no message (NS-01-R4) | System | none | yes |
| MA-12a | A-S03.downloading | iCloud-only picture (NS-01-R17b) | `m.progress` | The system's determinate progress; if our line shows, its fill moves only with real bytes, 200 ms linear per reading. Never an indeterminate loop | Fill jumps to each reading | none | no |

### A-S04 Listen at Ready, the primer and the start problems

| Id | Where | Trigger | v2 | What moves | Reduce Motion | Haptic | Proto |
|---|---|---|---|---|---|---|---|
| MA-12 | A-S01 to A-S05.recording (Speak) | Speak | T-COVER, `m.cover`, `m.tap.glass` | The glass capsule's own press (system). Listen dissolves in over 280; the record control is in its place from frame 1; the heading block arrives with the dissolve (no separate entrance). Home's lamp, if kept, leaves over 160. Never a morph from the Home cluster into the record control (A2; P-5) | `m.fade` 200 | press on Speak (the take's one start tick, `start-tick.logic`) | yes |
| MA-13 | A-S14 to A-S04.doorway | A doorway (widget, control, Action Button, Siri), after unlock | T-LAUNCH (cold) or T-COVER (warm) | Cold: Ready complete on its first frame (`m.instant`), no stagger, no lamp. Warm: the 280 dissolve. VoiceOver focus on the heading (NS-06 C6) | Cold: nothing; warm: 200 | none (arrival is navigation, NS-35) | yes |
| MA-14p | A-S03 to A-S04.readyPhoto | A picture picked (NS-01 happy path 3) | T-COVER, `m.fade` | Listen dissolves in (280). The photo thumbnail (C3, `ready` variant) holds its box from the first frame: at most 160 pt tall, 88 pt from AX3 (NS-01-R39), fit not crop (R42), so Speak, Type and Change photo never move. When the picture is decoded (p95 1,000 ms from picker close) it fades into the box (`m.fade`, 200). The take cannot start until it is decoded or has failed (v2 section 12 rule 7) | 200 dissolve, 200 fade (allowed, NS-01-R20d) | none | yes |
| MA-14c | A-S04.readyPhoto | Change photo (before speaking) | `m.fade` | After the picker, the new picture cross-fades over the old inside the same box (200); the box keeps its height | Same | none | yes |
| MA-14f | A-S04.photoCouldNotOpen, A-S04.iCloudOffline | The picture cannot be opened, or iCloud offline (NS-01-R46) | `m.swap`, `m.move` | The box's content swaps to the one calm line (150); if the box closes, the space closes (`m.move`). Capture goes on | Swap; space at once | none (no error haptic, v2 section 9; no sound, CG-6) | yes |
| MA-16 | A-S04.ready to A-S04.primer, .denied, .busy, .full | A start meets the primer or a blocker | `m.fade` (hand-off) | The room hands off to the state screen (C8): outgoing gone by 35 percent, incoming from half of that, 200 ms, linear. Built: one-frame swap (EG-8) | Same | none on the state; press on Continue or Try again (a new start) | yes |
| MA-16a | A-S04.lowSpace, A-S05.lowSpace | Under 1 GB | `m.swap` | The hint's place shows the low-space line (150); capture goes on | Same | none | no |
| MA-17 | A-S04 or A-S05 to A-S06 | Type instead | system modal (`router.replace` to Write) | The platform sheet rise | System | none | no |

### A-S05 Listen while recording (the key moments)

**MA-18 Record start** (A-S04.ready, or Speak, to A-S05.recording). v2: `m.tap.glass`, `m.instant`, `m.signal`. Proto: yes.

| t | What happens |
|---|---|
| tap | The control's press: the glass record control's own (system); a content control's `m.tap`. `H-press` now, before the audio session switches (iOS mutes haptics while recording). Paper sounds on only: `record_start`, then 140 ms before the recording mode (SOUND 5) |
| tap to live | `starting`: the label stays, Close stops taking touches; nothing animates while the audio session starts (A3 `starting`) |
| microphone live (p95 500 ms from the tap, F04-REQ-023) | One frame (`m.instant`, glass `animate: false`): the record control becomes the recording capsule with its dot, its word (WORDS.md decides; built "Finish") and the time; Pause is mounted; the line reads "Listening."; Close is gone; Let it go is shown. The aura starts from rest and rises with the voice on its own attack (80 ms): no added fade |
| never | A morph animation, a pulse, a grow, a countdown, a flash |

Reduce Motion: the same instant change; the aura is the static 2 pt ring, shown in the same frame.
State in text and shape, not colour (NS-33-R12): Ready is the circle with the microphone and "Tap the red circle and talk."; recording is the capsule with a filled dot, the word and the time, plus "Listening."; paused is the hollow dot with "Resume" and "Paused.".
VoiceOver: nothing is spoken into a take (SR-C-02, B2-21); see CG-2 against NS-33-R6.

| Id | Where | Trigger | v2 | What moves | Reduce Motion | Haptic | Proto |
|---|---|---|---|---|---|---|---|
| MA-19 | A-S05.recording | The voice | `m.signal` | Glow behind the control: scale 1 + 0.18 s and opacity 0.18 + 0.22 s, s the smoothed level (attack 80, release 400, `dt`-based, UI thread, runs only while recording or releasing). After 600 ms of quiet an idle breath (7.5 s) ramps in. **Proposed (NS-34 "loops change opacity only"; P-1, EG-3): the idle breath moves opacity only**, about 0.18 to 0.27; scale follows the voice only. Built and v2 13a: it also scales to 1.05 | Static 2 pt ring, opacity steps 0.2 / 0.3 / 0.4 at levels 0.15 / 0.5, at most one change per 400 ms, 200 ms fades. Never a loop | none | yes |
| MA-20 | A-S05.recording (Still here) | Quiet for 8 s | `m.instant` | The line reads "Still here." on the next frame, and "Listening." again when the voice returns. No pulse, no nudge | Same | none | yes |
| MA-21 | A-S05.recording | Each second | `m.instant` | The time changes in place (tabular figures). No rolling digits, ring or bar (v2 section 11). VoiceOver hears the time each minute only when not capturing (as built) | Same | none | yes |
| MA-22 | A-S05.recording to paused, and back | Pause, Resume (WORDS.md; built "Keep talking") | `m.instant`, `m.signal` | One frame: the dot goes hollow, the label and line change. The aura settles to its paused value at once (as built). On resume the aura follows the voice again from rest | Ring to its paused value at once | none (nothing between start and stop; supersedes spec 05 H5) | yes |
| MA-23 | A-S05.interrupted to A-S07.interrupted | A call, Siri, an alarm, the app to the background | `m.instant`, T-COVER | Nothing animates in the background. The take is kept; on return Review dissolves in (280) with its stop line already there | 200 | none (iOS cannot play it from the background) | no |

**MA-24 Record stop** (Finish, A-S05.recording to A-S05.finishing, A-S05.saved, A-S07). v2: `m.instant`, `m.signal`, T-COVER. Proto: yes.

| t | What happens |
|---|---|
| tap | The control's press. One frame: the control shows finishing (Stop and Pause off); Let it go is gone (never offer delete while the take is kept, BL-563). The aura releases to rest over `signal.releaseMs` 400 (part of `m.signal`) |
| recorder stopped | `H-press` (the stop tick, after the session ends). Paper sounds on only: `record_stop` |
| then | Review dissolves in (`m.cover`, 280); the aura's release overlaps it and Review never waits on it. Hand-off "Listen to Review" within 900 ms (NS-34) |
| Review settled | Review's title is announced and takes VoiceOver focus (built, at `dissolveMs`) |

Reduce Motion: the ring goes with the 200 ms fade.

### A-S06 Write (Type)

| Id | Where | Trigger | v2 | What moves | Reduce Motion | Haptic | Proto |
|---|---|---|---|---|---|---|---|
| MA-26 | A-S01 to A-S06.default | Type | system modal | The platform sheet rise; Home keeps its state | System | press (a capture starts) | no |
| MA-27 | A-S06.default | Another thought in Write | `m.swap`, `m.move` | The line swaps in place (150); the field follows the height change (`m.move`); the control leaves with `m.exit` at the first character, its space held | Swap; height at once | tap (P-4) | no |
| MA-28 | A-S06.* | "Saved on this phone" after a pause | `m.swap` | The status words swap in place; never blink, never repeat | Same | none | no |
| MA-29 | A-S06 to A-S13 | Add to the book or Keep private | `m.keep` | As MA-39, from the sheet (it holds still until the commit) | As MA-39 | success at the commit | no |

### A-S07 Review and its sheets A-S08 to A-S12

| Id | Where | Trigger | v2 | What moves | Reduce Motion | Haptic | Proto |
|---|---|---|---|---|---|---|---|
| MA-30 | A-S07.writing | Words not ready | `m.swap` | The honest progress line ("Part 2 of 5", a percentage) swaps its words in place. No spinner, shimmer, skeleton or loop (NS-33-R5) | Same | none | yes |
| MA-31w | A-S07.writing to A-S07.default | Words arrive | `m.fade`, `m.move` | The words arrive as one block in place of the progress line (`m.fade` hand-off, 200, linear), then the block takes its height (`m.move`). Never typed out, never per word (v2 section 11; the constitution) | Fade; height at once | none | yes |
| MA-32 | A-S07.default | Fix marks | none | Marks are at final strength on the first frame | Same | none | no |
| MA-33 | A-S07.markOpen | Tap a mark | `m.move`, `m.enter` | The inline card opens under the line (`m.move`); its content enters (280) | Height at once; content fades 200 | tap (as built; P-4) | yes |
| MA-34 | A-S07.putBack | Put it back | `m.swap`, `m.move`, `m.mark` | The said words swap in (150); the paragraph reflows (`m.move`); the restored span carries an `accentSoft` tint fading over 1600 (`m.mark`). "Put back. Undo" has no stated seconds, so no timer | Swap; reflow at once; tint static then fades | tap (and tap on its Undo) | yes |
| MA-35 | A-S07.default | With small fixes / Exactly as said | `m.select`, `m.swap` | The selection indicator moves (`spring.snappy`); the letter's words swap (150). Selection shown by shape and weight | Indicator jumps; swap | tap | no |
| MA-36 | A-S07.playing | Play / Pause on the mini-player | `m.instant`, `m.progress` | The icon changes on the next frame; the position follows the real audio clock (200 ms linear per reading). No waveform | Position jumps per reading | none | no |
| MA-37 | A-S07.default to A-S08.day, back to A-S07.dateSet | Tap the day line (NS-15) | T-SHEET, `m.swap`, `m.enter`, `m.move` | System sheet; the system date control's own feedback. On Save: the day line swaps (150); where the about-day differs, the second line enters (280) and the block grows (`m.move`) | Sheet: system; fades; height at once | none (a system picker plays its own) | no |
| MA-38 | A-S07.default to A-S09.empty or A-S09.recent, back to A-S07.fromSet | From (NS-16) | T-SHEET, `m.select`, `m.swap` | System sheet with the field, the instruction line and the names used before; a name picked: `m.select`; on return the signature line swaps (150) | System; mark jumps; swap | tap on a picked name | no |
| MA-39a | A-S07.anotherLanguageOffer to A-S10.withheld | "This was in another language" (NS-17, D10) | `m.fade`, `m.move` | The words block hands off to the waiting line (`m.fade`, 200, linear); the block takes its height (`m.move`). The player does not move. VoiceOver focus moves to the waiting line, read once. Its Undo (A-S10.withheldUndo) is an F1 window (MA-44) | Fade; height at once | tap | yes |
| MA-39b | A-S10.withheld to A-S06.forTake | Write the words (WORDS.md; card intent "Type the words yourself") | system modal | Write rises as a sheet for this take | System | none | no |
| MA-40p | A-S07.withPhoto | Add a photo on Review | `m.move`, `m.fade` | After the picker, the box opens (`m.move`) and the picture fades in (200); the words above never move | Box at once; fade | none | no |
| MA-41 | A-S07.withPhoto to A-S12.confirm | Change photo on a draft or letter that has one | T-ALERT, `m.fade` | "Use this photo instead?" is the native confirmation (F6 `simple`); "Keep the first" is the default and nothing moves. Confirm: the new picture cross-fades over the first (200), then the undo window opens (MA-44) | System; fade | none on the replace (the toast is the receipt); tap on Undo | yes |
| MA-42 | A-S07.withPhoto to A-S07.photoUndo | Take the photo off | `m.exit`, `m.move` | The picture leaves (`m.exit`, opacity only), the box closes (`m.move`), the undo window opens (MA-44). The file stays until the window closes (NS-01 section 5) | Fade; box at once | none | yes |
| MA-43 | A-S07.photoNeedsWords | Keep with a picture and no words (NS-01-R5a) | none | Nothing. Keep is disabled from its first frame and the reason is a static line. No shake, buzz or bounce (v2 section 11) | Same | none | no |

**MA-39 Keep** (A-S07 or A-S06, to A-S13.saved or A-S13.savedPrivate, to the Book). v2: T-KEEP, `m.keep`, `m.mark`. Proto: yes.

| t (ms from commit) | What happens |
|---|---|
| tap | Keep's press. The Keep gate decides first (D-082): if Plus is needed, T-GATE (A-S13.gate to E-S10, system sheet, the held card `m.enter`) and nothing is written. If Plus is not known yet, the letter is held (A-S13.held): an F1 toast says so and the room leaves (`m.cover`) |
| commit | Local transaction (p95 200 ms). Then `H-success`, once. Paper sounds on only: `sealed`, never while the mini-player plays |
| 0 | The line "Kept in Month 7" (or "Kept just for you.") enters (`m.enter`); the letter card is hidden from VoiceOver and the one sentence is announced |
| 120 | The card moves down 24 pt and leaves (`m.exit`, 160, `easing.exit`) |
| 400 | Review leaves (`m.fade`, 200) over the Book, which is already on the new letter (`arrived=<id>`); the Book's lamp, if kept, returns over 280 |
| 600 | On the Book: the letter in its place, no `m.list.insert`; `m.mark` starts (1600, area B draws it). No tab badge |
| any time | A tap anywhere lands on the Book at once |

VoiceOver: the Book does not take over until the sentence has been said: at least 3 s from the commit and, on iOS, until `announcementFinished` for that sentence, at most about 8 s (built, `savedMomentLeaveInMs`). This is a hold for speech, not a motion beat (P-2).
Reduce Motion: the line fades in (200) at 0, nothing travels, Review fades at 400, the mark is shown static then fades.
Never: a check mark that draws, a stamp or seal, a scale-down of the card, a count ("your 12th letter"), a milestone, a burst, a letter flying to the Book tab, a sound by default. The first letter's Keep is this same moment.

**MA-40 Let it go** (A-S11.confirm from Review, A-S11.confirmListen from Listen, A-S11.confirmPhoto when a picture goes with the draft). v2: T-ALERT, T-COVER, T-RESUME. Proto: yes.

| Step | What happens |
|---|---|
| Tap Let it go | The native confirmation (F6 `simple`), from the control where the platform allows. Its motion is the system's. No haptic on opening. On Listen the take keeps recording behind it and nothing on Listen changes |
| Keep it (the default, NS-09-R9) | The confirmation closes. Nothing else moves |
| Confirm | Marked, file deleted, then the row (NS-09 happy path). `H-warning`, after the session has stopped (on Listen, after the recorder closes). No sound (SOUND: `record_stop` never on Discard) |
| Leave | The room dissolves away (`m.cover`, 280) to Home, where nothing moves (T-RESUME): no toast, no line, no card falling away, no shred, no dust. Nothing is shown except the return (NS-09 step 5) |
| Delete threw (A-S11.notRemoved, NS-09-R4a) | Review stays (DESIGN G-10 = CG-7): Let it go is gone in one frame; the one line enters under the words (`m.enter`), the block grows (`m.move`); the app's small muted voice, no icon, no red, no shake; VoiceOver announces it after it has settled (NS-09-R4b). It never blocks leaving |

Reduce Motion: the system's reduced confirmation; 200 ms fade; "no animation on removal beyond the system's" (NS-09 section 6).

### MA-44 The undo window (ruling T4; F1 Undo toast, `m.toast`)

Applies to every timed Undo in area A: after a confirmed picture replace or take-off (A-S12.undo, A-S07.photoUndo; NS-01-R38a to R38c) and the another-language Undo (A-S10.withheldUndo). Not to the quiet-day Undo (MA-05, CG-9) or Put it back's Undo (MA-34): no stated seconds, so no timer. Proto: yes.

| Phase | v2 | What moves |
|---|---|---|
| Opens | `m.toast` in | The glass materialises by style ('none' to 'regular' over 0.25 s, never by opacity), the capsule rises 8 pt on `spring.snappy`, the words `m.enter`. Over a toast already up: the words `m.swap` and the glass stays; the replaced Undo's chance ends |
| Open | none | **Nothing moves.** No countdown bar, ring, number, pulse or colour change (v2 F1: "never a progress ring or countdown"). Undo is 44 pt and static. Swipe down follows the finger (`toast.dismissDy`, `toast.dismissVelocity`) |
| Undo pressed | `m.fade`, `m.swap` | `H-select`. The picture comes back (`m.fade` in its box, or the box reopens with `m.move`). The toast's words swap to the result line, then it leaves as below. The outcome is announced once |
| Closes | `m.toast` out | Words `m.exit`, glass to 'none' over 0.25 s, then unmount. **Undo works until the toast is fully gone**: the action's expiry is the close time plus the exit, and the Undo leaves the screen and the accessibility tree in the same frame (NS-01-R38b) |

The clock (T4; NS-33-R15; F1 `windowSeconds`):
- The stated seconds (10 for NS-01-R38a) start when the toast has finished materialising (CG-3).
- With VoiceOver on, it cannot close before VoiceOver has finished reading the undo line plus those seconds: on iOS from `announcementFinished` for that sentence (as `saved-moment.tsx` uses); if no event comes within 8 s, from 8 s. Whichever is later wins.
- With Switch Control on, it never closes on time; it closes when the parent moves on: focus leaves the toast or the screen changes (F1's definition, adopted; CG-4).
- Leaving the screen closes it in every mode; an Undo is never carried to another screen.
- App to the background: the clock pauses and resumes on return (CG-3).

Reduce Motion: no rise; the glass style change and word fades only. Reduce Transparency: a solid toast that fades in and out (200 / 160).

## 4. Doorways and hands-free (A-S14, A-S15)

| Id | Where | v2 | What moves | Reduce Motion | Haptic |
|---|---|---|---|---|---|
| MA-45 | A-S14.widget, Control Center control | system | Static (NS-06-C2): no animation, no name, no count; the press is the system's | System | System |
| MA-46 | A-S14.unlock, Siri, Action Button, A-S14.firstRun | system, then MA-13 | System surfaces; the app arrives as MA-13; before first run is complete it arrives on first run (E-S02), never Ready | System | none of ours |
| MA-47 | A-S15.map (hypotheses; NS-04 decides) | `m.instant`, `m.signal` | Knowing start and stop without looking (NS-04 Q6): `H-press` before the microphone opens and after it closes (MA-18, MA-24); the optional paper sounds; never a spoken word during a take. A Live Activity, only if NS-04 passes one: at most 2 s per animation, existing elements only (MOTION v0.2 benchmark), the system timer for elapsed time, never a count | Static | press at start and stop only |

## 5. Parked, drawn only as a rule

- NS-19 Add more to this letter, if taken up: Continue on Home's waiting card opens Listen as MA-12; speaking again is a new take, so `H-press` plays once. On Review the second take's block enters once under the first (`m.enter`); the two never merge, slide together or reflow into one paragraph. No "add audio" on the letter page.

## 6. Haptics and sound in area A

| Moment | v2 id (intent) | Paper sound (off by default) | Never |
|---|---|---|---|
| Speak, Type (a capture starts) | H-press (`press`) | `record_start` for Speak only, then 140 ms before the microphone | Again on the start Speak opened |
| The record control at Ready, Continue after the primer, Try again after a blocker | H-press (one start tick per take) | `record_start` | On a doorway arrival |
| Stop / Finish, after the recorder stops | H-press | `record_stop` | Before the recorder stops; on Pause |
| Pause, Resume, Still here | none | none | Anything between start and stop |
| Not much today | H-soft (`soft`) | none | |
| Undo, Put it back, a child chosen, a name picked, a view chosen, the another-language mark | H-select (`tap`) | none | |
| Another thought, opening a mark, Record again, Try again for words | `tap` as built; not in v2's table (P-4) | none | |
| Keep, after the commit | H-success (`success`) | `sealed`, not while the mini-player plays | Before the commit; again on the Book |
| Let it go, confirmed | H-warning (`warning`) | none | On opening the confirmation; while recording |
| Any error or refusal (a picture that failed, iCloud offline, Keep disabled, a blocker) | none | none (CG-6) | An error haptic |
| Sheets, the picker, covers, tabs, scrolling, typing, playback, the toast appearing | none | none | |

The 100 ms throttle drops ticks, never `success` or `warning`. A haptic always pairs with a visible change.

## 7. What never animates in area A

v2 section 11 in full, and in this area specifically:
- No celebration or ceremony on Keep, the first letter, a quiet day, a picture, a child switch, a doorway or Let it go.
- No counters: no animated letter count, no countdown on an Undo, no "days since", no progress ring around the record control. The elapsed time changes on the next frame.
- No live waveform or equaliser (founder rule).
- No word-by-word typing, shimmer or "writing" effect on waiting or arriving words (constitution).
- No pulse, bounce or glow on Speak, Type, Start from a photo or Not much today; no morph from the Home cluster into the record control.
- No easing of a recording state change.
- No shake or buzz on a disabled or refused control.
- No Ken Burns, parallax, zoom or blur-up on a picture; no picture decoded while recording.
- No loop under Reduce Motion (NS-33-R5) or, once it can be read, Low Power Mode (NS-34; EG-4).

## 8. Reduce Motion and loops register (J-N15, NS-33-R5)

| Loop or continuous motion on an area A screen | Normal | Reduce Motion | Low Power Mode |
|---|---|---|---|
| Home lamp breath (9 s) | v2 proposes to retire it (v2 section 10); if kept, only on Home in front, paused under sheets and the picker | Off | Must stop (NS-34); not read today (EG-4) |
| Listening aura, voice-driven (MA-19) | Only while recording | Static ring, stepped opacity | Voice-driven part stays (it is the signal) |
| Listening idle breath | Opacity only (proposed, P-1) | Off | Must stop (EG-4) |
| Aura release after Stop | 400 ms decay, once | Off | Same |
| `m.mark` after Put it back or Keep | One 1600 ms fade | Static then fades | Same |
| Anything else in area A | None | None | None |

## 9. Performance

- `m.signal` runs in a UI-thread frame callback only while recording or releasing (`auraRunsFrames`); JS writes the level from a 50 ms timer and never re-renders per frame.
- Transform and opacity only; never a glass view's opacity or size.
- While recording: no image decode, font load, route mount, layout transition or glass morph (v2 section 12 rule 7; ENG-M12).
- No frame over 16.7 ms on an SE 3 during any MA moment. Hand-offs within 900 ms (NS-34): Home to Listen, Listen to Review, Review to the Book (`m.keep` reaches it at 600).
- iOS `fullScreenModal` with `fade` cross-dissolves at the platform's own length, not exactly 280 (`transitions.logic.ts`); BL-929 measures the real number.

## 10. Proposed test rows (motion only, each tied to a card row)

| Id | Given, When, Then | Card row |
|---|---|---|
| A-MO-1 | Given Reduce Motion, When each MA moment plays, Then no view's transform changes and every opacity change lasts 200 ms or less (`m.mark` excepted, a single fade) | NS-01-R20d, NS-33-R5 |
| A-MO-2 | Given a 10 s undo window and VoiceOver finishing the line at 6 s, Then Undo works until 16 s plus the exit, and leaves the screen and the accessibility tree in the same frame | NS-01-R38a, R38b, NS-33-R15 |
| A-MO-3 | Given Switch Control on, Then an undo window never closes on time, and closes when focus leaves the toast or the screen changes | NS-01-R38c |
| A-MO-4 | Given Listen recording with the level at silence for 10 s, Then the aura's scale stays 1 and only its opacity moves | NS-34 section 3 |
| A-MO-5 | Given record start, pause, resume and stop, Then the control's label, colour and time change on the frame the recorder reports the state, with no animation scheduled | v2 section 5; NS-33-R12 |
| A-MO-6 | Given Keep, Then `success` is called after the commit resolves and before the first animated frame; given Let it go, `warning` after the recorder has stopped and the delete has been tried | MOTION principle 3; NS-09 |
| A-MO-7 | Given a picture picked, Then the thumbnail box has its final height on the first frame of Ready, and Speak, Type and Change photo keep the same frame before and after the picture decodes; the record start waits until decode ends | NS-01-R39, R42; v2 section 12 rule 7 |

## 11. Superseded (the card, or the v2 standard, wins)

- Design spec 01 section 7 "Thumbnail appears on Ready: `enter` (8 pt, 280 ms)": NS-01 section 15 ("none new beyond existing fades"). Now MA-14p.
- Design spec 01 section 4 "Toast offers Undo for 10 seconds" with a toast that never times out: T4 through F1 (MA-44).
- Design spec 05 H2 "aura wakes", H5 "`recordStop` cue on pause", H10 "`success` haptic when saved": recording state is instant (v2 section 5), nothing plays between start and stop, `success` is Keep's only.
- MOTION v0.2 5e (`file` timings, about 1.1 s): v2 `m.keep` (600 to the Book).
- MOTION v0.2 5c per-word rise: words arrive as a block.
- COMPONENTS (v1) 2.14 "an undo toast persists until dismissed": only for Undos with no stated seconds.
- This file's own first draft (same day): fades on the clock, line and glow at record start and a 200 ms pause fade are withdrawn (v2 section 5); our own sheet rising on `standard` is replaced by native sheets (T-SHEET); Another thought and Not much today use `m.swap`; the quiet-day lamp dim is proposed at 280 (P-3).

## 12. Proposals to the v2 standard (v2 decides; this file does not define moves)

| # | Proposal | Why |
|---|---|---|
| P-1 | `signal.idleScale` 0: the idle breath moves opacity only | Card NS-34 section 3: "Loops change opacity only"; v2 13a keeps 0.05. Where a card speaks, the card wins |
| P-2 | Name the VoiceOver hold in `m.keep`: the Book does not take over until the kept sentence has been said (min 3 s, max about 8 s, as built) | T-KEEP does not mention it; without it VoiceOver users lose the confirmation (NS-33-R6, J-N20) |
| P-3 | Add the quiet-day dim to v2 section 10's lamp moves, at `lamp.returnMs` 280 (built: 1200) | Today it is an unnamed move over the cap |
| P-4 | Add to v2 section 9's H-select list: Another thought, opening a fix mark, Record again, Try again for words (all built with `tap`); or list them in ENG-M10 for removal | v2's table is silent on them |
| P-5 | Confirm that no glass morph joins Home's cluster to Listen's record control (A2 says T-COVER, never a morph; DESIGN 9.5 lists `m.glass` "Speak capsule to record control") | Different containers and screens (v2 section 7 rule 3); recording is immediate |

## 13. Card gaps (cards unchanged; proposed defaults)

| # | Card row | What is missing or in tension | Proposed default |
|---|---|---|---|
| CG-1 | NS-34 section 3 "Loops change opacity only" | The built idle breath on Listen scales (to 1.05) | Opacity-only idle breath (P-1, EG-3) |
| CG-2 | NS-33-R6 "start and stop are announced within 1 s" vs SR-C-02 / B2-21 (VoiceOver never speaks into a take) | The card does not say how start is announced when speech would be recorded | Start: the press tick before the microphone opens, and the record control's value reads "Recording" without being spoken. If `a11y` and the CPO want speech: for VoiceOver users only, announce "Recording." before the microphone opens and open it on `announcementFinished`, at most 1 s. Stop: announced after the recorder stops (allowed today). Needs a ruling |
| CG-3 | NS-01-R38a, T4 | When the seconds start; what happens in the background | From the end of the toast's materialising; the clock pauses while the app is in the background |
| CG-4 | NS-01-R38c, T4 "until the parent moves on" | "Moves on" is not defined in the card | F1's definition: focus leaves the toast or the screen changes (adopted; this file's earlier "locks the phone" dropped, as locking backgrounds the app and pauses the clock) |
| CG-5 | Brief's 300 ms ceiling; NS-07 C5 3.4 | The quiet-day lamp dim (1.2 s) is longer and no card mentions it | 280 (P-3); if the lamp is retired, nothing |
| CG-6 | NS-01 section 5 (calm failure line) vs SOUND.md 4 (`gentle_error` for "a photo that failed to attach", with an Error haptic) | SOUND.md asks for a sound and an Error haptic that v2 section 9 excludes | No sound and no haptic on a picture failure; SOUND.md amended by `design-systems` in a separate docs PR |
| CG-7 | NS-09 step 5 ("nothing is shown except the return") vs NS-09-R4a (the line shows "on that Review visit") | Whether Review stays to show the not-removed line | Review stays (DESIGN G-10 agrees) |
| CG-8 | NS-17 section 4 | No Undo is named for "This was in another language" | DESIGN draws one (A-S10.withheldUndo, G-07): an F1 window; without stated seconds in a card it uses F1's 10 s default |
| CG-9 | NS-07 C5 3.6 ("the Undo line stays while Home stays") vs v2 F1 (the quiet-day kept line is an Undo toast with a T4 window, 10 s default) | Whether the quiet-day Undo closes on a timer | The card wins: the quiet-day Undo stays while Home stays; if drawn as F1, its window is "until Home is left", with no seconds |

## 14. Engineering gaps (the backlog row each belongs to)

| # | Gap | Row |
|---|---|---|
| EG-1 | `Toast` with an action never times out while the photo undo expires: the F1 window (MA-44), with the action's expiry at close plus the exit | BL-954; v2 ENG-M7 |
| EG-2 | Nothing in `apps/mobile/src/lib/a11y*` reads Switch Control; React Native's `AccessibilityInfo` is not known to expose it (UNVERIFIED; v2 F1 says the same). A small native read of `UIAccessibility.isSwitchControlRunning` and its notification is needed | BL-954, BL-984 |
| EG-3 | Idle breath opacity only (`listening-aura.tsx`; `signal.idleScale` 0 with its token test) | no row; proposed under NS-34 next to BL-929, or in v2 ENG-M1 |
| EG-4 | Low Power Mode is not read (`expo-battery`, D-065), so loops cannot stop under it as NS-34 requires | v2 ENG-M8 |
| EG-5 | Recording states on the new record control (A3) with `animate: false`; the built aura already jumps to its paused value (keep) | v2 R9 (COMPONENTS) |
| EG-6 | Listen's picture decoded before the take can start, and Speak disabled until then on photo Ready | v2 ENG-M12, BL-955 |
| EG-7 | Another thought on Home and in Write as `m.swap` (built 360 ms on Home) | no row; small change to `index.tsx`, `write.tsx` under v2 ENG-M2 |
| EG-8 | Listen's primer and blocker screens replace the room in one frame; `m.fade` hand-off | no row; small change to `listen.tsx` |
| EG-9 | The thumbnail box at its final height from the first frame, the picture fading in on decode, fit not crop | BL-956 |
| EG-10 | Child switcher on Home: in-place `m.swap` of the label, dateline and prompt and an `m.fade` of the waiting cards after a choice | BL-941 |
| EG-11 | `m.keep` replacing `fileIntoMonthPlan`, keeping the VoiceOver hold (P-2) | v2 ENG-M6 |
