# NS-34 SE3 Speed: does it feel quick on the smallest phone

> **Drill identities first.** Follow `README.md` "Drill identities": drill child Asha, no real letter on the phone. This sheet only taps, scrolls and watches; it deletes nothing. Do the drill-phone check (`README.md` rule 3) before step SE3.0.

| | |
|---|---|
| Proves | NS-34-R2 (a miss holds its feature), NS-34-R5 (the numbers below, read on an iPhone SE 3rd generation), NS-34-R6 (markers carry an event name and a number only). Backlog: BL-929 (this sheet), BL-1862 |
| Targets | The wording proposed in `docs/qa/NS-34-TARGETS.md` for `docs/prd/v2/06-nfr.md` rows 42 and 216. BL-930 has not merged it: `docs/prd/v2/06-nfr.md:42` and `:216` still carry the old wording. If BL-930 lands first, the rows win over this table. FOUNDER 1 to 3 in that file are still open: where a step below says "stand-in", the count is not a final answer |
| Build | Video rows (SE3.1 to SE3.6, SE3.8): the preview build (release JavaScript, `.preview` bundle id) installed from the EAS link (`docs/qa/DEVICE_TEST_PLAN.md:62`, P-03). Frame rows (SE3.7): a Release build signed for development from the founder's Mac (`docs/tdd/new-scope/11-foundations.md` section 4: Instruments cannot attach to a TestFlight build; that is unverified, try it first and write down what happens) |
| Plan | Free, 0 letters kept for SE3.1 to SE3.5 (the third kept letter opens the Keep sheet, `README.md` rule 5). Plus on only if a step says so |
| Phones | Phone A: iPhone SE (3rd generation). Phone B: any second phone that films at 240 fps (slow-motion video). Phone B is only a camera |
| Time | about 3 hours with the stand-in counts [E] |
| Record in | `docs/qa/evidence/<YYYY-MM-DD>-<x.y.z(n)>-se3.md`, copied from `docs/qa/evidence/TEMPLATE.md`, one row per SE3 step below (`README.md` in that folder: units kept, screenshots and videos never committed) |

## What is measurable today, and what is not

Read this before you start. Three things the design assumed are not in the build yet, so every number is read by hand.

- **The markers exist but nothing calls them.** `apps/mobile/src/lib/perf/markers.ts` defines `mark(event, ms)` (`:41`). The only files that mention `lib/perf` are `markers.ts` itself and `apps/mobile/test/perf-markers.test.ts`. No screen calls `mark`, so the ring is empty in every build. The file says so at `markers.ts:9-11`.
- **There is no export button.** `exportRun` (`markers.ts:67`) is called only by the test. Nothing writes `perf-<UTC start>-<counter>.json` on a phone.
- **There is no `perf` build profile.** `apps/mobile/eas.json` has `development`, `e2e`, `preview`, `production` and `testflight` (lines 8, 22, 40, 55, 70); none sets `EXPO_PUBLIC_PERF`. Unless `EXPO_PUBLIC_PERF` is literally `on`, `mark` does nothing (`markers.ts:42`).

So today: the Result column of every row is read from video or Instruments. The "Marker later" column says which event will give the same number once a build wires it, so the sheet does not change shape then. When markers land, add a row to the evidence file for the marker number next to the video number; keep both for the first run.

What a marker is, from the code (so the evidence stays content-free):
- Ten event names only: `launch_first_frame`, `launch_interactive`, `speak_tap_to_mic`, `save_commit`, `book_first_render`, `book_scroll_hitch`, `find_first_row`, `copy_decode`, `migration`, `index_rebuild` (`markers.ts:15-26`).
- One number of milliseconds, never negative, never a string (`markers.ts:43`). The ring keeps the last 2,000 (`markers.ts:33`).
- The run header is five plain tokens: `model`, `ios`, `version`, `build`, `fingerprint` (`markers.ts:31`). A value with a space, a slash or a quote is refused (`markers.ts:61`, `:69`).
- File name `perf-<YYYYMMDDTHHMMSSZ>-<counter>.json` (`markers.ts:72-74`).
- Frame hitches are never a marker: a JavaScript marker cannot see a UI-thread frame (`docs/engineering/readiness-20nov/performance/MEASUREMENT-PLAN.md` section 4, "Timing source"). `book_scroll_hitch` is a count the Book would report; the gate number is from Instruments.

## Before the first step

| # | Do | Expected | Capture |
|---|---|---|---|
| SE3.0a | Drill-phone check on Phone A (`README.md` rule 3). Install the build on Phone A signed in to nothing (these rows need no account). Open it, answer the 18+ question, make the child `Asha` (birthday about 6 months ago, signature `Mama`), and keep the Asha letters that `docs/qa/DEVICE_TEST_PLAN.md` P-08 scripts, read by a consenting adult. | The Book holds only Asha and scripted letters. No real letter on the phone | pass or stop |
| SE3.0b | Fill the header of the evidence file: model (iPhone SE 3rd generation), iOS version, marketing version and build from Settings > About, the commit from the EAS build page, battery percent, thermal state in words (nominal, fair, serious, critical; iOS reports no temperature). The marker header uses the same five facts: model, iOS, version, build, fingerprint (`markers.ts:31`); the EAS fingerprint is on the EAS build page [unverified: where the page shows it]. | Header complete | the header row |
| SE3.0c | Protocol, from `docs/prd/v2/06-nfr.md:11` (section 0, "Device run protocol"): phone unplugged, brightness at 50%, room temperature, thermal state nominal at the start, 2 minutes idle between runs. A run during which a call or a notification arrives is thrown away and repeated, never averaged in (`MEASUREMENT-PLAN.md` section 4, "Run protocol"). Do the whole sheet at iOS 17 on one SE 3 and again on the latest iOS (a second SE 3, or after an update; the founder says first which phones he holds, `11-foundations.md` section 4). | Settings written in the evidence file: Dark on/off, text size default, Bold Text off, Reduce Motion off, Low Power off, Wi-Fi on | the settings line |

## How to read a number from video

Phone B films Phone A at 240 fps. One frame is 1000 / 240 = 4.17 ms (4 and 1/6 exactly). Count in frames; the ms is frames multiplied by 1000 / 240.
1. Put Phone B on a stand or a stack of books, the SE 3's screen and your finger both in frame.
2. Start slow-motion video on Phone B. Tap on Phone A. Stop the video.
3. Open the clip on Phone B, step one frame at a time. Start frame: the first frame where the fingertip touches the glass. End frame: the first frame where the screen shows the new state (named per step).
4. Number = (end frame minus start frame) multiplied by 1000 / 240 (4.17 ms per frame). Write the frame count as well as the ms. Hitches (frames over 16.7 ms) are never read from the 240 fps clip: a clip cannot show a UI-thread frame time; they come from Instruments only (SE3.7).
5. Name the clip `se3-<step>-<n>` and keep it in your own storage. Write only that name in the evidence file.

Frames at 240 fps for the targets below (ms = frames x 1000 / 240): 100 ms is 24 frames (100.0 ms); 350 ms is 84 (350.0); 900 ms is 216 (900.0); 2,000 ms is 480 (2,000.0); 16.7 ms is 4 (16.7).

## Steps

Samples: the card asks for 200 per metric (`docs/prd/v2/06-nfr.md:9`, section 0, "Samples"); by hand that is not reachable for rows SE3.1 to SE3.6. Until the founder accepts a stand-in in writing (FOUNDER 1 in `NS-34-TARGETS.md`), use the proposal: 200 taps for SE3.1, 20 runs for each of SE3.2 to SE3.6, and write "stand-in" in the evidence row. An unmeasured row is "not measured" with its reason, and it holds its feature (`11-foundations.md` rules, R2).

| # | Do | Expected | Capture | Marker later |
|---|---|---|---|---|
| SE3.1 | **Speak to microphone live.** Home, app already open. Film. Tap Speak. End frame: the first frame showing the recording state. Stop the take and discard it. Repeat 200 times. Do it once cold (app killed from the app switcher, then opened and left 10 s) and once warm, in separate batches of 20 at least. | p95 at or under 500 ms (F04-REQ-023; `11-foundations.md` row 1) | p95 in ms, count, cold or warm, stand-in yes or no, clip names | `speak_tap_to_mic` (`markers.ts:17`) |
| SE3.2 | **Cold start, online and airplane.** Kill from the app switcher, wait 10 s, film, tap the icon. End frame: the first frame where Home takes a tap [unverified: a tap that responds; also try a tap on Speak and note the frame it first reacts]. 20 runs with Wi-Fi on, 20 with airplane mode on. Same method as `docs/qa/DEVICE_TEST_PLAN.md` S1-03 (`:85`). | p50 at or under 1.2 s and p90 at or under 2.0 s (A-NFR-001; `11-foundations.md` row 2) | p50 and p90 in ms for each network state | `launch_first_frame`, `launch_interactive` (`markers.ts:15-16`) |
| SE3.3 | **Warm start.** Home, then the Home button or swipe up to leave (do not kill), wait 10 s, film, tap the icon. End frame as SE3.2. 20 runs. | p50 at or under 400 ms (`11-foundations.md` row 3) | p50 in ms | none listed (the closed list has no warm-start event) |
| SE3.4 | **A screen change starts, and its controls are usable.** For each of: Home to Settings, Home to the Book, opening a Settings screen, opening a sheet from a button. Film. Start frame: the touch. Start-of-change frame: the first frame where anything moves. Usable frame: the first frame after which a tap on the screen's main control responds. 20 runs per screen. | Starts within 100 ms (24 frames); controls usable by 350 ms (84 frames) (proposed row 42) | Two numbers per screen: start ms and usable ms | none listed |
| SE3.5 | **The named hand-offs.** Home to Listen (tap Speak), Listen to Review (finish a take), a Book card to its letter page (tap a card). Film each. End frame: the new screen at rest. 20 runs each. Review to the Book after Keep is SE3.6, not here (FOUNDER 2 in `NS-34-TARGETS.md`, open: the card still lists it in the 900 ms row). | Each finishes within 900 ms, 216 frames (`tokens.motion.sequenceMaxMs`, `packages/design-tokens/src/tokens.ts:386`; tripwire `apps/mobile/test/transitions.test.ts:130`) | One ms per hand-off, p90 | none listed |
| SE3.6 | **The save hand-off.** Free plan with at most 1 letter already kept, so the Keep sheet does not open (`README.md` rule 5). Record a short scripted Asha line, reach Review, film, tap Keep. Start frame: the touch. End frame: the Book shows the new letter and a tap on a card responds. The arrival wash after that is not counted (`NS-34-TARGETS.md` row 42). 20 runs; delete each kept letter afterwards only if it is a drill letter. | Within 2,000 ms, 480 frames (`tokens.motion.hardCeilingMs`, `tokens.ts:387`). The code puts the Book on screen 1,100 ms after the commit (`sequenceMaxMs + fadeMs`, `apps/mobile/src/lib/transitions.logic.ts:167-175`; tripwire `apps/mobile/test/transitions.test.ts:214-216`), so about 1,300 ms from the tap is expected only if the commit takes its p95 target of 200 ms (200 + 1,100; `NS-34-TARGETS.md:25`); the 200 is a target, not a measurement | Tap to Book in ms; also the commit alone is not readable by video: write "not measured until markers" | `save_commit` (`markers.ts:19`) gives the commit, target p95 200 ms (`NS-34-TARGETS.md` row 42) |
| SE3.7 | **Frames over 16.7 ms.** On the Release build from the founder's Mac, open Instruments, choose Animation Hitches, and profile the app on Phone A [unverified: exact menu path and that the dev-signed Release build attaches; the `perf` profile and `asha` seed profile named in `11-foundations.md` do not exist]. For each of: Home (open, idle 10 s); the Book scrolled top to bottom and back at a steady swipe, three times; a letter page opened from the Book and scrolled; each at default text size and again at AX5 (Settings > Accessibility > Display & Text Size > Larger Text, on, slider to the largest). Save the trace in your own storage. | No UI-thread frame over 16.7 ms on Home, Book scroll and the letter page. Fixtures larger than a few Asha letters (a year-5 book, 1,000 letters with 300 pictures) do not exist: write "not measured, fixture missing" for those rows, not a pass | Per screen and text size: longest frame in ms, hitch count, trace file name | `book_scroll_hitch` (`markers.ts:21`), count only |
| SE3.8 | **Loops under Reduce Motion.** Settings > Accessibility > Motion > Reduce Motion on. Visit Home, Listen (start a take, stay quiet 10 s, stop), an empty Book, an empty-state screen, an error or state screen, the invite screen. Watch each for 10 s. Then Reduce Motion off and again Low Power Mode on (Settings > Battery > Low Power Mode) and watch the same screens for 10 s. Journey J-N15 (`docs/product/prd/14-test-plan.md:67`) covers Reduce Motion only; V6 (`docs/prd/v2/07-quality-bar.md:213`) is the only script that covers Low Power Mode. | With Reduce Motion on, nothing loops: no breathing lamp, no sweeping bar, no spinning wheel [a system spinner may still turn: write it down; unverified whether iOS stops it]. With Low Power Mode on, the code has no guard, so a loop that runs is a known miss, recorded as missed, not as a pass (`NS-34-TARGETS.md` row 216 table; `apps/mobile/src/components/ui/lamp.tsx:40-41`). A loop must also change only opacity and stop when the screen is not in front (proposed row 216) | Per screen, Reduce Motion on and Low Power on: moving yes or no, and what moved (in words, no letter text) | none |

## Result words

Per `docs/qa/evidence/README.md`: pass, fail, blocked, n/a, not run. This sheet adds one for the speed rows: **not measured**, with the reason (stand-in count, fixture missing, tool not attached). A missed or not measured row holds its feature until it is fixed or the founder changes the target in writing (`11-foundations.md` rules, R2). Do not average a failed run in; repeat it.

## Where each number is written

One evidence file per session: `docs/qa/evidence/<YYYY-MM-DD>-<x.y.z(n)>-se3.md`. Row IDs `SE3.0a` to `SE3.8`; units in every cell (ms, frames, count); p50, p90 or p95 as the step says; the sample count and "stand-in" where it applies; clip and trace file names only, never the files. Examples in notes use Asha, Avi, Mama and Papa. No entry text, no transcript, no child name other than Asha, no real email, no sign-in code. A failure gets a GitHub issue labelled `beta` and `S0` to `S3`, and its number goes in the row.

## Not in this sheet

Design rows 9 to 16 of `11-foundations.md` section 4 (switch child, Find, battery, memory, download size, thermal, spot runs, iPad smoke) are not read here. Where a step above uses the same word it means only what the step says.

## Before this sheet is first run

- The build must be one the founder installs; installing it and doing the run are the founder's (BL-929). Writing the sheet is not a run.
- Writing the sheet changed no code, no requirement file and no CI file.
