# SE 3 simulated sitting: record and run sheet (BL-1700, BL-1705, BL-1786)

Owner: qa (handle `qa`; the Mac session that fills the cells is the `qa` agent's, and who has the Mac is named under BL-1977, not here). Decision: D-172 (23 Nov 2026), exec ruling 12: run the sitting as a simulation, label every result "simulated", make no on-device claim. Related: `docs/qa/DEVICE_TEST_PLAN.md` (the real-device plan, which this does not replace), `docs/qa/run-sheets/NS-34-SE3-SPEED.md` (the real SE 3 speed sheet, still a device job), `docs/design/review-2026-11-22/` (persona findings BL-1786 re-rates).

## Read this first

- Every reading in this file is **simulated** or **read from source**. None is an on-device result. A simulator is not an iPhone SE 3: timing, memory, thermal state and speech-model speed read from it are not evidence for the SE 3 gate (D-172).
- No store listing, screenshot, release note or doc may say the app was "tested on" an iPhone SE 3 or "passed on device". A result of `simulated: held` below means only that the layout and flow check held in the simulator at the SE 3 screen size and the stated text size, nothing more. It is never a release-note word.
- **State of this file: the sitting has NOT been run.** The runner that wrote this file is Linux and has no Xcode or iOS Simulator (`xcrun` is absent). So the only filled-in numbers are in section 2, and they are read from source code, not from a run. Every result cell in sections 3 to 6 reads `not run` until a Mac agent session fills it in and changes this paragraph.
- The 27 Nov gate question (BL-1700 Done when) is therefore **not yet answered with this file**. See section 7.

## 1. Setup for the Mac session (what "simulated" means here)

| Item | Value |
|---|---|
| Simulator device | iPhone SE (3rd generation), 4.7 inch, 375 x 667 pt |
| Build | `development` or `preview` simulator build of the commit under test; write the short SHA |
| Text size | Default for the default-size rows; AX5 (Settings, Accessibility, Display and Text Size, Larger Text, Larger Accessibility Sizes, slider at its end; font scale 3.571, `docs/design/specs/NS-33-ACCESSIBILITY-FLOOR-20nov.md:23`) for the AX5 rows |
| Data | Drill child Asha, letters scripted for Asha only (`docs/qa/run-sheets/README.md` "Drill identities"); never a real letter or name |
| Plan | Free, alpha allowance as in NS-34-SE3-SPEED "Plan" row |
| Every row | Result is one of: `simulated: held`, `simulated: failed (ticket #)`, `not run, needs the device`, `not run, not reached`. Never a bare "pass" |

What the simulator can back, and what it cannot:

| Can back (label "simulated") | Cannot back (record "not run, needs the device") |
|---|---|
| Layout and fit at 375 x 667 pt: what is on screen, what scrolls, what wraps | Voice Control (not available in the simulator) |
| AX5 and Bold Text layout, Reduce Motion, Dark appearance | VoiceOver speech and its gestures: the Simulator does not run VoiceOver; Accessibility Inspector can read each element's label, role, hint and focus order, and that is the most this sitting claims, labelled "Inspector read" |
| Element labels, roles, hints, focus order, and hit-area size (the 44 pt measure) via Accessibility Inspector | A real lock screen, the side button mid-take, auto-lock behaviour |
| Step and tap counts for a path | A call, Siri or a maps voice alert over a take; headphone and route changes; a whispered take at pillow distance; night brightness; the commute cases |
| Contrast audit from Accessibility Inspector | Timing, memory, thermal, battery, speech-model speed (any number read is "simulated" and supports no gate) |
| Kill and relaunch (a simulated kill, as in `docs/qa/evidence/README.md` "sim-kill") | Microphone quality; the on-device speech model's real accuracy |

## 2. BL-1705: first-letter step count (read from source; confirm in the simulator)

Status: **read from source code, not yet confirmed in a simulator run.** Step count is a count of screens and taps on the path as built. It is not a timing and supports no timing claim anywhere (D-169 item 1, D-172). No time column is filled; the simulated stopwatch column stays `not run`.

Path counted: servers-off or local start (a person who taps "Begin the book" signed out), one child, a first-time install, microphone permission not yet asked, English. Source: `apps/mobile/src/app/onboarding.tsx` (`ORDER` at line 100: welcome, promise, child, signsAs, finish), `apps/mobile/src/lib/first-run/route.logic.ts`, `apps/mobile/src/app/listen.tsx` (`start`, the primer phase).

| # | Screen or state | Taps on the shortest path | Source note | Simulated time (mm:ss.s) |
|---|---|---|---|---|
| 1 | Welcome | 1 (Begin the book) | `onboarding.tsx` welcome step; sign-in and join are separate quiet buttons, not required | not run |
| 2 | Promise | 1 (Continue) | `ORDER[1]` | not run |
| 3 | Child | 3 (focus the name field; "Born today" chip; Continue), plus typing the name | `birthday` starts `null` (line 186) so a date must be set; Continue waits until name and date are valid (`firstRunChildBlock`) | not run |
| 4 | Signs as | 2 (an example chip; Continue), or typing a name | `checkSignsAs(signsAs).ok` is required (line 359); `signsAs` starts empty | not run |
| 5 | Finish ("The book is open") | 1 (Continue) | `finish()` makes the book and `router.replace('/')`; the speech-download card is offered, not required | not run |
| 6 | Home | 1 (Speak) | Speak and Type are the pinned pair on Home | not run |
| 7 | Microphone primer | 1 (Continue) | shown once, before iOS asks (`listen.tsx` `start`, `out.kind === 'primer'`; PER1-019, SR-C-05) | not run |
| 8 | iOS microphone prompt | 1 (Allow), a system dialog | counted as a tap and a screen state | not run |
| 9 | Listen, recording | 0 | the first spoken word is recorded from here | not run |

Totals as read from source: **11 taps, 9 screens or states, plus typing one child's name and, if the signs-as line is typed, that too**, from first open to the first recorded word.

Not counted, and left as labelled gaps:
- The account-first path (server features on, sign-in required, Build 12 `production`, D-160): sign-in screens, the email code and the arrival line add steps. Not counted here because the source read above is the local start. Counting it needs the simulator with the staging switch on and a drill account: `not run`.
- Whether the primer really shows on a fresh simulator install, and whether the date field needs more than the "Born today" chip when the child is not newborn (a birthday months ago is more taps, PER4-017): `not run`.
- Any time. The simulated stopwatch is to be recorded with Simulator at default text and then AX5; both labelled "simulated", neither an SE 3 timing.

## 3. BL-1700: sitting one, the SE 3 profile at AX5

Screens that gate the build (exec review tiering): Listen, Review, Keep. Settings routes and the rest may trail (BL-1704).

| Row | Check | At default size | At AX5 | Bold Text | Evidence name |
|---|---|---|---|---|---|
| S1-1 | Welcome, Promise, Child, Signs as, Finish: nothing clipped, Continue reachable, heading read first | not run | not run | not run | |
| S1-2 | Home: Speak and Type reachable, drafts scroll above them | not run | not run | not run | |
| S1-3 | Listen, primer (PER1-013): the room fits on 375 x 667 pt with a three-line prompt; both 56 pt buttons and Let it go on screen | not run | not run | not run | |
| S1-4 | Listen, recording: clock, line, Pause and Finish present and reachable | not run | not run | not run | |
| S1-5 | Review: the words, Keep, and undo reachable | not run | not run | not run | |
| S1-6 | Keep sheet and the title focus on open | not run | not run | not run | |
| S1-7 | Book list and a letter row | not run | not run | not run | |
| S1-8 | Letter page and Read together (rows in section 5) | not run | not run | not run | |
| S1-9 | 44 pt hit-area measure on the controls named in BL-1702 (child switcher, audio player, Listen) with Accessibility Inspector | not run | not run | not run | |
| S1-10 | Contrast audit (Accessibility Inspector) on the six screens above, light and dark | not run | not run | not run | |

## 4. BL-1700: sitting two, VoiceOver and Voice Control, as far as a simulator goes

| Row | Check | Result |
|---|---|---|
| V1 | Accessibility Inspector reads a label, role and hint for every control on Listen, Review, Keep and the Book | not run (label this "Inspector read", never "VoiceOver passed") |
| V2 | Focus order on Listen, Review and the Keep sheet is the visual order | not run (Inspector read) |
| V3 | VoiceOver speech, rotor, two-finger scrub (escape) as scripted at `docs/qa/DEVICE_TEST_PLAN.md:317` | not run, needs the device |
| V4 | Voice Control stops a take | not run, needs the device |
| V5 | Bold Text on: nothing clipped (this one the simulator can show) | not run |

BL-1717 interruptions script (a call, Siri, a lock, a route change, a kill, during a take and during Keep):

| Interruption | During a take | During Keep | Result |
|---|---|---|---|
| A call | | | not run, needs the device |
| Siri | | | not run, needs the device |
| Lock or side button | | | not run, needs the device |
| Route change (headphones) | | | not run, needs the device |
| Kill and relaunch | simulated kill is possible | simulated kill is possible | not run |

## 5. BL-1786: persona ids, and which the simulator can reach

Rule: the findings file re-rates an id only where the simulator can show it. A reading is "simulated". An id the simulator cannot reach is listed `not run, needs the device` and keeps the rating it has. No id is raised to P1 on a reading alone (BL-1786 Problem line). Subjects below are the first words of the persona files' own rows.

| Id | Subject | Reachable in the simulator | Result |
|---|---|---|---|
| PER1-001 | Listen, Pause: auto-lock ends the take | no (lock is hardware behaviour) | not run, needs the device |
| PER1-002 | Listen, side button mid-take | no | not run, needs the device |
| PER1-005 | Night brightness, white Listen room | partly: Dark appearance layout yes; brightness no | not run (layout), needs the device (brightness) |
| PER1-006 | Whispered take, "Still here" line at pillow distance | no | not run, needs the device |
| PER1-007 | A long silent take | partly: the screen and the clock yes; battery and the real run no | not run |
| PER1-013 | Listen fit on 375 x 667 pt with a prompt | yes | not run |
| PER1-019 | Microphone primer shows once, before iOS asks | yes (fresh install) | not run |
| PER4-001 | Listen start cue; what VoiceOver says | cue and label via Inspector only | not run (Inspector read); the spoken cue needs the device |
| PER4-002 | Focus after Start, Pause and Finish | no (needs VoiceOver) | not run, needs the device |
| PER4-003 | Mid-take: can she learn "am I still recording" | label via Inspector only | not run (Inspector read); spoken behaviour needs the device |
| PER4-005 | Review arrival focus | no (needs VoiceOver); this is the arrival check BL-1794 needs | not run, needs the device |
| PER4-012 | Sheet focus return after close | no (needs VoiceOver) | not run, needs the device |
| PER4-017 | Birthday date field with a baby born months ago | tap count yes; VoiceOver use no | not run |
| PER4-021 | Book row label | label text via Inspector only | not run (Inspector read) |
| PER2-014 | Commute: the take stops when the phone does | no (call, maps alert, lock are hardware) | not run, needs the device |
| PER3-005 | Read together fixed at Large print | yes | not run |
| PER3-006 | Read together page buttons at AX5 | yes | not run |
| PER3-007 | Read together opens at the oldest letter | yes (tap count) | not run |
| PER3-008 | Finding Play at AX5 | yes | not run |
| PER3-009 | Letter page top bar and Back at AX5 | yes | not run |
| PER3-010 | Play control size | yes (Inspector hit area) | not run |
| PER3-011 | Player scrub versus tap while scrolling | partly: mouse is not a thumb | not run, needs the device |
| PER5-018 | Moments photo journey as a whole | no (unbuilt screens and copy; nothing to walk) | not run, not reached |

Script items with no simulator route, recorded now so they are never read as passed: side-button press mid-take, whispered take at pillow distance, night brightness, headphone routes, the commute cases, a long silent take's battery use.

The optional "From Mama" line at Review (tappable, owner default, typed name, fixed after Keep) is not a default and is not run.

## 6. Accessibility Nutrition Labels: what a simulated sitting may support

Today's draft (`docs/store/app-store-connect-1.0.md` section 5): Dark Interface is the only one drafted; everything else stays unclaimed until an audit passes. This file changes none of that. It records the most a simulated run could back, for the exec-team review to rule on (not legal advice; Claude roles).

| Label | Can the simulator back it | Position |
|---|---|---|
| Dark Interface | yes, the layout in Dark appearance (if section 3 rows hold in Dark) | not declared until the device walk passes (CDesO-22); a simulated reading is evidence for the exec review only |
| Reduced Motion | yes, the setting exists in the simulator (if the Reduce Motion rows hold) | not declared until the device walk passes (CDesO-22); a simulated reading is evidence for the exec review only |
| Sufficient Contrast | yes, Accessibility Inspector audit (if S1-10 holds in light and dark) | not declared until the device walk passes (CDesO-22); a simulated reading is evidence for the exec review only |
| Differentiate Without Color | partly (setting yes, whole-app audit is a read; only after an audit read of every common task) | not declared until the device walk passes (CDesO-22); a simulated reading is evidence for the exec review only |
| VoiceOver | no | not declared: the simulator does not run it |
| Voice Control | no | not declared |
| **Larger Text** | not declared from a simulation | **Not declared (exec ruling 7).** An AX5 layout run in a simulator does not back it; it waits for a device sighting |

The task brief that created this file cites exec rulings 7 and 12; I did not find a repo copy of either in `docs/agents/exec/RULINGS.md` or `docs/DECISIONS.md` (D-172 is the closest text). The Larger Text line follows the brief. Ruling CDesO-22 in `docs/agents/exec/RULINGS.md` says no label is declared until the device walk passes (BL-948); this file does not override it, and no row above reads softer. A simulated reading is evidence for the exec review only.

## 7. Questions the file must answer when it is run

1. The 27 Nov gate question (BL-1700): does a simulated pass exist for Listen, Review and Keep at the SE 3 size and AX5? Answer: `not answered, sitting not run`.
2. Does a simulated reading keep DSR-024 at P1 or make it P0? For the exec-team review to rule; named here, not decided. Until then: P1 as filed.
3. The BL-1794 arrival check (PER4-005): `not reached` in a simulator; stays a device item.
4. Each failure becomes its own ticket (BL-1700 Scope), with the persona or row id in the title. None yet.

## 8. Findings

None. No run has happened. Filing of failures starts when a Mac session fills sections 2 to 5.

## 9. How this file is closed

A Mac agent session with Xcode: boots the SE 3 simulator, follows sections 1 to 5, replaces each `not run` it can honestly replace, keeps the rest as written, updates the paragraph "State of this file" in Read this first, and files the evidence names (screens and recordings are never committed, `docs/qa/evidence/README.md`). The real SE 3 sittings (`NS-34-SE3-SPEED.md`, `DEVICE_TEST_PLAN.md`) stay open as the device job and are not satisfied by this file.
