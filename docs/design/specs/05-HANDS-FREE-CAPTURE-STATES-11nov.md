# 5. Hands-free capture states

Status: DRAFT, 11 Nov 2026 (UTC). Docs only. Author: `design-systems`. Index, tags and the 12-line review: `NEW-SCOPE-INDEX-11nov.md`. Sources (EVIDENCE only for the lines I read, which are the ones named; the rest of each file is UNVERIFIED): `F04-capture.md` (interruptions line 61; Siri, widget, Live Activity lines 51 to 72; Voice Memos note line 97; widget entry line 118; U08/U09; REQ-040/041), `SOUND.md` (no sound while recording; record start sequence), `COMPONENTS.md` 2.17 ListeningAura and 2.18 CaptureBar, `listen.tsx` (quiet = metering below -50 dB after 8 s), `strings.en.ts` (`tonight.states.*`, `listen.*`). **Scope of this spec after Review B (finding 4).** PRD NS-04 (#795 head `2245c8be`, rank 4) is a five-day time-boxed spike, not a feature: it promises no build and no build number, and PRD NS-06 Part C is likewise untestable before it reports. So the doorways (widget, Control Center control, Action button, Siri) are a spike, not built. Section 3 states H1 to H13 are the in-app take, which exists today in Listen (`listen.tsx`, EVIDENCE by name); those rows stand. Every doorway row (H0 for OS entries, the doorway lines in sections 4, 5 and 9, HF-R1 and HF-R2) is CONDITIONAL on the spike's read-out: nothing in them is built, copied into a ticket or tested until the findings file says Yes for that trigger. The spike's answers (Q1 to Q10) can change them.

This spec designs the states a person sees and hears when their hands are busy, and what each state does with the take. It changes no recording rule.

## 1. Job

One sentence: I start a letter by talking, hands full. (8 words, one verb, "start"; on Home it is a way to Say, so it adds no tab verb.) The states below still hold, pause and finish it. Two kinds of person: the parent whose hands are full (holding a baby, one hand free in the dark, F04 persona P1) and the person who uses Voice Control, Switch Control or VoiceOver. The states are the same for both; the doorways differ.

Hands-free does not mean voice-activated. The app never listens before a person starts a take (PRIV: it "listens only while you record", `listen.primer.body`, EVIDENCE). No wake word. No always-on microphone. Siri or a hardware control may start a take only where the OS invokes the app on a person's own command, and F04 treats those as v1.1 candidates (UNVERIFIED).

## 2. Hard constraints (EVIDENCE unless marked)

| Constraint | Source |
|---|---|
| Recording stops when the app goes to the background or the phone locks; background recording is off | F04 line 71, LEGAL-REQ-011 as quoted there |
| The app keeps the screen awake while recording so Auto-Lock does not end a take | F04 line 97; `useKeepAwakeWhile` in `listen.tsx` (EVIDENCE) |
| No sound while the recorder is armed or recording; start and stop cues play before the microphone opens and after it closes | SOUND.md rule 1, record start sequence |
| A call, Siri, an alarm, a route change finalises the take (it does not resume) | F04 line 538 area |
| Nothing the phone says is recorded: announcements are queued, Listen has no live region while a take is live | F04-REQ-040 |
| Widget entry opens Ready and starts nothing; it shows no child name | F04 line 118, REQ-020 |
| One take is up to 30 minutes | F04 line 92 |

## 3. The state machine

States (a take's life), with the screen, what the person is told and what happens to the audio. Words are the existing `tonight.states.*` and `listen.*` keys where they exist (EVIDENCE) and slots where they do not.

| # | State | Entered by | What the screen shows | What the person hears or feels | The take |
|---|---|---|---|---|---|
| H0 | Not started | Cold open. Widget, Control Center control, Action button and Siri are doorways: CONDITIONAL on the spike | Home as usual; for OS doorways H1 | none | none |
| H1 | Ready | Tap Speak; or an OS doorway | Listen: "To {child}", the red circle, `listen.ready.hint` "Tap the red circle and talk." For a doorway, the screen is the same; nothing records yet | nothing; no sound | none exists |
| H2 | Starting | Tap the circle | Circle presses (`press.scale`), aura wakes | `recordStart` haptic and the soft start cue, then the microphone opens 140 ms later (SOUND.md) | file created; first bytes written |
| H3 | Listening | Microphone open | `ListeningAura` breathing with level; timer; `listen.states.listening` "Listening."; hint "Say it however it comes." | no sound | recording |
| H4 | Quiet stretch | After 8 s with level below -50 dB (as `listen.tsx`) | Same screen; line becomes `stillHere` "Still here. Take your time." The aura breathes idle | none | still recording; never auto-stops (section 5) |
| H5 | Paused | Tap Pause (or a headphone control if the OS delivers it, UNVERIFIED) | Aura frozen and dimmed, "Paused.", button "Keep talking" | `recordStop` cue on pause, haptic only on resume | microphone closed; same file kept |
| H6 | Interrupted | Call, Siri, alarm, other audio, route change, media services reset | On return: Review or the waiting card: "Recorded before the app closed." (existing `tonight.draft.swept`) | the OS's own sound | take finalised and saved as a waiting letter (F04 line 538 area); nothing lost |
| H7 | Backgrounded or locked | Side button, app switch, Auto-Lock after a keep-awake lapse | On return: as H6 | none from us | finalised and saved |
| H8 | Limit reached | 30 minutes | A gentle line (slot) and the screen moves to saving | one cue | finalised and saved |
| H9 | Low space or power | Storage or battery low | A calm line in place of the hint (slot): the take is saved so far | none | finalised and saved |
| H10 | Finishing | Tap Finish | "Saving your words." | `recordStop` cue, `success` haptic when saved | closed |
| H11 | Saved | Write succeeded | "Saved, in your words." then Review; or "Writing down what you said." (existing key; PENDING `content` review: the line can read as a machine writing, index section 8, and CLAUDE.md says never imply AI writes. Not approved here) | | kept as a waiting letter or open in Review |
| H12 | Cannot start | Microphone denied or restricted | `errors.micDenied` with "Type instead" (existing) and a Settings button (UNVERIFIED: the key `errors.micDenied.typeButton` is named in a comment in `strings.en.ts`; I did not read its block) | none | none |
| H13 | Cannot hear | Mic busy on another app, or no input route | `InlineState` in place of the circle (slot) with "Type instead" | none | none |

State H4 never shows how long the quiet has lasted, and no state shows a count of takes, letters or days.

## 4. Wireframes

Ready from a doorway (the same as Ready from Speak; it must look identical so the person trusts it):

```
 To {child}                          [Let it go]
 Tap the red circle and talk.
            (  red circle  )          <- 120 pt disc, 64 pt+ target inside
              or type instead         <- quiet, 44 pt
```

Listening, one hand:

```
 To {child}
 Listening.                  0:42       <- timer is text
 Say it however it comes.
        (  aura breathing  )
 [ Pause ]            [ Finish ]        <- two 64 pt buttons, thumb zone, equal width
```

Interrupted, on return (Home):

```
 Recorded before the app closed.       <- existing waiting row, flat
 SAT 14 OCT  1 min       [ Pick it up ]
```

Placement: Pause and Finish sit in the lower third so a thumb reaches them one-handed on the largest phones (HYPOTHESIS; verify on an iPhone Pro Max and an SE 3). The red circle is centred; a left-handed parent is not penalised because both bottom buttons are full-width halves.

## 5. Design decisions for hands-free (each with its reason)

1. **One tap starts, one tap stops. No countdown.** A "3, 2, 1" is a cost to a tired parent and an implied deadline. The start cue sequence in SOUND.md stays.
2. **No auto-stop on silence.** A long pause is part of the voice ("Pauses are fine", `readyHint`, EVIDENCE). The quiet stretch only changes the line. The take ends on Finish, the 30-minute limit, or an interruption.
3. **Never lose the take.** Every involuntary end (H6 to H9) saves the take as a waiting letter. The person is told once, calmly, on return.
4. **Screen stays awake while recording** and dims only through the OS.
5. **Big, few, fixed controls.** Pause and Finish do not move between states (no layout shift when the line changes). At accessibility sizes they stack, and that is one fixed layout for those sizes, not a move. The only thing that moves is text.
6. **Nothing flashes.** No flash, no loud cue, no sound while recording, so a sleeping baby is not woken (F04 persona P1).
7. **Voice Control and Switch Control work from labels.** Every control is real text: "Speak", "Pause", "Finish", "Keep talking", "Let it go".
8. **Doorways add no behaviour.** A widget, Control Center control or Siri phrase opens Ready. It does not start recording. Starting a take from a locked screen is a separate privacy decision for `legal` and `security` (a take starts a microphone with no unlock; UNVERIFIED how iOS treats it); default: the doorways need the phone unlocked first.
9. **App lock.** If app lock is on, a doorway shows the lock cover first (NX-40 R13 as quoted in NX-43 R10); Ready follows Face ID.

## 6. Components

| Part | Component | Status |
|---|---|---|
| Circle, Pause, Finish, type instead | `CaptureBar` `recording` variant (COMPONENTS 2.18) and `Button` | spec'd; Listen is built (EVIDENCE: `listen.tsx`); confirm they share |
| Aura | `ListeningAura` (2.17) | spec'd; built per its note (UNVERIFIED) |
| Timer and line | `Text` | exists |
| Errors | `InlineState`, `ErrorLine` (2.15a) | exist |
| Ready from a doorway | no new component; the same screen | |

Tokens: `colors.recording` (listening, never an error colour; 5.05 : 1 on bg light, 7.65 dark, EVIDENCE: tokens.ts), `target.capture` 64, `radius.pill`, `space`, `motion.press`, `motion.fadeMs`, `motion.breath`. No new token.

## 7. Motion

| Moment | Motion | Reduce Motion |
|---|---|---|
| Ready to Listening | circle `press`; aura fades in over `fadeMs`; `layout` on `standard` | `fadeMs`, aura is a static 2 pt ring (COMPONENTS 2.17) |
| Aura | breath from voice level (MOTION 5b) | static ring; opacity steps no more than one per 400 ms |
| Pause and resume | aura freezes (`snappy`) | static |
| Line changes (Listening, Still here, Paused) | cross-fade `swapMs` | none |
| Saved to Review | existing route dissolve `route.dissolveMs` 280 | `fadeMs` |

No decorative loop beyond the aura. No pulse on the buttons.

## 8. Dynamic Type and VoiceOver

- AX5: the line and hint wrap and grow; Pause and Finish stack vertically at accessibility sizes (COMPONENTS 2.18) and each stays at least 64 pt; the aura shrinks before text does; nothing is truncated and no state's line is cut. The timer uses the `numeral` family only where a large figure is intended; otherwise `title2`.
- VoiceOver (F04-REQ-040 and REQ-041, EVIDENCE): with VoiceOver on, Speak opens Listen as one element and nothing records until a double tap or Magic Tap. While a take is live the screen exposes exactly one element and focus does not move; no label, hint or value changes; there is no live region; the phone's own announcements are queued and spoken after the take pauses or stops. So the elapsed time (`listen.elapsedA11y`) is not available during a live take for VoiceOver, only after Pause. Magic Tap is the VoiceOver person's Pause and resume (REQ-040 device run names it). This is the hands-free path for VoiceOver users and it already exists in the requirements; this spec adds the states around it (H5, H6, H7) and requires that Finish (and Keep talking) be reachable by VoiceOver, in that order, after Magic Tap pauses (the controls come back into the tree on Pause; UNVERIFIED how Listen does this). Without that, the VoiceOver path could start a take and not end it. Proof: HF-R10. COMPONENTS 2.18 says "announced every minute, not every second" for the recording button; that conflicts with REQ-040 (no announcement during a take). REQ-040 is the P0 requirement and wins; 2.18 needs a docs fix (section 12, Q4).
- Switch Control (VoiceOver off): the scan order follows each wireframe, top to bottom. Ready (H1): Let it go, the red circle, Type instead. Listening and Paused (H3 to H5): Pause (Keep talking when paused), then Finish; "Let it go" is not shown in Listening in this wireframe, so it is not in that order (a Let it go during a live take is an open question, section 12 Q7). If an order changes it changes in the wireframe first. Each target is reachable; Pause and Finish are 64 pt.
- Colour is never the only signal (index section 6). The existing hint "Tap the red circle and talk." names the control by colour alone. The circle's VoiceOver label should not rely on colour (`listen.ready.startA11y`; I did not read its text, UNVERIFIED), and I ask `content` for a PROPOSED wording that adds a shape or position word (for example, the large round button in the middle) to the visible hint or to the label. The decision and the words are `content`'s; the founder's brand glossary fixes "the red circle" as the record control name, so this may need a founder ruling.
- Voice Control: "Tap Pause", "Tap Finish" work; the app does not add its own voice commands.
- Haptics: `recordStart`, `recordStop`, `success` as COMPONENTS 0.2; none while recording.

## 9. Copy slots (for `content`)

Existing (read in `strings.en.ts`, except `errors.micDenied.*`, which I did not read, UNVERIFIED): `tonight.states.{ready, readyHint, listening, listeningHint, stillHere, paused, resumeButton, stopButton, saving, saved, savedLetter, transcribing}`, `listen.{ready.hint, ready.startA11y, toggleA11y, elapsedA11y, discard*, keepButton, primer}`, `tonight.draft.swept`, `errors.micDenied.*`.

New slots:

| Slot | Intent | Limits and rules |
|---|---|---|
| `listen.limit.reached` | H8: the take reached its length and was saved | Calm; no "only" or "limit exceeded"; says it was kept |
| `listen.space.low` | H9: saved so far because the phone is nearly out of room or power | Says it was kept; no fear words |
| `listen.cannotHear.line` and `.typeInstead` | H13 | Says what to do |
| `listen.interrupted.line` | On return after H6/H7 if shown on Listen rather than Home | May reuse `swept` |
| `capture.doorway.ready` | Ready entered from the widget or a control; may equal `listen.ready.hint` | Same words on purpose |
| `capture.doorway.locked` | Shown when app lock covers a doorway | Plain |

Door lines. A microphone is a thing a person agrees to (existing primer, `permissions.microphone`, counsel's wording). This spec adds no new permission and no new consent. Shown: the existing primer, once, on the first Speak. Records: the existing take and permission acts. Never: audio, transcript or child name in analytics, logs, crash reports or the widget (REQ-020). Decline: "Type instead" always present; denying the microphone never blocks typing.

## 10. Requirements (working ids HF-R#)

| Id | Requirement | Proof |
|---|---|---|
| HF-R1 | CONDITIONAL on the NS-04 spike read-out. Doorways start nothing. Given a widget, Control Center control, Action button or Siri doorway, When it opens the app, Then Ready shows and the microphone is closed until the person taps | device; unit test on the route handler |
| HF-R2 | CONDITIONAL on the NS-04 spike read-out for the doorway sources (`widget`, `controlCenterControl`, `actionButton`, `siri`); the in-app sources apply now. One start function. Given any doorway or in-app Speak, Then they call the same capture function with a `source` from this list: `speak`, `type`, `notMuch`, `photoFirst`, `dayCard`, `widget`, `controlCenterControl`, `actionButton`, `siri`; no other tab calls it. Prerequisite: `mobile` consolidates the start (06 section 12, step 0) | navigation test N3 (06 section 10) |
| HF-R3 | No loss. Given a call, Siri, alarm, route change, lock or background during a take, Then the take is saved as a waiting letter and the person sees it on return | device scripts (F04 U08, U09) |
| HF-R4 | No auto-stop on silence. Given 5 minutes of quiet, Then the take continues and the line is still "Still here" | unit test with injected metering |
| HF-R5 | Quiet room. Given a live take, Then the app plays no sound and the saved audio has no cue in it | recorded-file check (SOUND.md test) |
| HF-R6 | Stable controls. Given any state H1 to H5, Then Pause and Finish do not move between states and stay at least 64 pt at every text size; at accessibility sizes they stack in one fixed layout that is the same in every state | device, AX5 |
| HF-R7 | Screen reader. Given VoiceOver on a live take (H3, H4), Then the screen is one element and the Pause and Finish buttons are hidden from the accessibility tree while the take is live (they are visible on screen for touch and Switch Control); they return to the tree, in the order Keep talking then Finish, when Magic Tap pauses (HF-R10), no announcement or label change occurs, and Magic Tap pauses and resumes (F04-REQ-040, 041) | device, VoiceOver |
| HF-R8 | Always a way to type. Given H12 or H13, Then "Type instead" is shown | device |
| HF-R9 | No count, no streak. Given any state, Then no count of takes, no total time, no streak | content rules; review |
| HF-R10 | Finish is reachable after Magic Tap. Given VoiceOver and a take paused by Magic Tap, Then Keep talking and Finish are in the accessibility tree and focusable in that order, and activating Finish saves the take (so a VoiceOver parent can end what they started) | device, VoiceOver (F04-REQ-040 run) |
| HF-R11 | Length limit (H8). Given a take that reaches 30 minutes, Then it is finalised and saved as a waiting letter, `listen.limit.reached` shows once, and nothing is lost | unit test with an injected clock; device |
| HF-R12 | Low space or power (H9). Given low storage or battery during a take, Then the take is saved so far, `listen.space.low` shows once in place of the hint, and the Type route stays available | unit test with injected storage and battery values; device |

## 11. The 12-line job-clarity review

| # | Result | Reason |
|---|---|---|
| J1 | Pass | "I start a letter by talking, hands full." (8 words, one verb) |
| J2 | Pass | Say is Home's verb and no other tab's |
| J3 | Pass | Doorways are allow-listed and reach one function |
| J4 | Pass | A take |
| J5 | Pass | "Tap the red circle and talk." says it |
| J6 | Pass | Red circle in Ready; Finish in Listening |
| J7 | Pass | Listen shows no list |
| J8 | Pass | Ready is whole on day one |
| J9 | Pass | H12, H13 say what to do |
| J10 | Open | Seven new slots (section 9), and `Writing down what you said` is pending content review; `content` answers by Fri 20 Nov 2026 (PROPOSED) |
| J11 | Open | Device with VoiceOver, Switch Control, Voice Control |
| J12 | Pass | Without it a parent must see and touch small controls with busy hands |

## 12. Open design questions, each with a default

| # | Question | Default |
|---|---|---|
| Q1 | May a doorway start a take on the Lock Screen without unlock? | No. Unlock first |
| Q2 | Headphone play/pause as Pause and Finish? | Not promised; UNVERIFIED that iOS delivers it to a recording app. Default: out of scope |
| Q3 | Voice command "stop" | No. No always-on listening |
| Q4 | Fix COMPONENTS 2.18 (announce every minute) to match REQ-040 | Yes, a docs edit in a later PR by `design-systems`; flagged here, not edited |
| Q5 | Is 8 s the right point for "Still here"? | Keep; HYPOTHESIS, no parent evidence |
| Q6 | Siri and Shortcuts in v1.1 | Not designed here; F04 says so |
| Q7 | A Let it go during a live take | Not shown in Listening in this wireframe; the take is ended by Finish and a waiting letter can be let go from Home. Decide on a device whether a live-take Let it go is wanted; default no |

## 13. UNVERIFIED

Everything Apple: Action button, Control Center controls, App Intents, widget interaction on SDK 57, headphone control delivery, behaviour of a take started from a Lock Screen surface; whether `CaptureBar` is the component `listen.tsx` uses (I read `listen.tsx` only by grep); the thumb-reach claim; any reading of F04 beyond the lines named.
