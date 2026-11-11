# NS-04: Hands-free capture (a time-boxed research spike, not a feature)

Status: Draft v1, 11 Nov 2026 (UTC). Docs only. Author: `product`. Rank 4 of 7 (closed X1: after the family pilot is under way). Index: `README.md`.
This file defines a spike: questions, a time box and exit criteria. It promises no feature and no build number. If the spike passes, a separate PRD is written from its findings.

Tags: EVIDENCE = repo file read this session. HYPOTHESIS = about parents. UNVERIFIED = not read or not run. I ran nothing on a device. Everything about Expo, iOS App Intents, widgets, Action Button and background audio is UNVERIFIED here; the spike exists to settle it.

## 1. Job to be done

I go to Early Letters with my hands full, holding {child}, to start telling a letter without touching the screen, so that I do not lose the thing I wanted to say.

## 2. Who and when

- A parent holding a baby or carrying a toddler, often at night, who has a sentence they want to keep. HYPOTHESIS. No parent evidence exists; the research file (`FEATURE-GAP-AND-WEDGE-10nov.md`, 10 Nov 2026) says one competitor sells one-handed use (Chatbooks [P11]) and one ships quick-capture widgets (Lumelo [P16]). UNVERIFIED: store and web pages read by another agent, no product run.
- A parent who cannot easily use a touch screen. Voice Control and Switch Control are an accessibility question the spike also answers (Q7).
- Not a driver. No driving use is designed for, tested or promoted (Q9).

## 3. The single capture entry rule

Hands-free is a way to reach Home's one capture entry, not a second capture path. It is aligned with `docs/design/specs/05-HANDS-FREE-CAPTURE-STATES-11nov.md` (PR #794): unlock first, doorways open Ready and add no behaviour, no auto-stop on silence. Every trigger (the four doorway names used in the design specs and the navigation test: `widget` for Home Screen and Lock Screen, `controlCenterControl`, `actionButton`, `siri`) must land in the same Listen screen Home opens today, in the Ready state (F04 widget row: `/listen?entry=widget`). One recording function: `mobile` first consolidates every start into a single `startCapture({source})` whose `source` is Home or one of the four doorway names (design spec 06 section 12, step 0; navigation test N3 depends on it). A second start is refused while a take is active (F04-U23). A hands-free start never keeps a letter: the letter always ends as a draft, "Waiting to be kept", until the parent keeps it from Review with the words on screen (D-103).

## 4. Why a spike, not a requirement

- The Lock Screen and Home Screen widget was a P1 in F04 and was cut from 1.0 (F04 row 51; WP-F04-12). F04 records App Intents as "needs a native module and a spike" and "Siri and Shortcuts" as a v1.1 candidate, with no Expo path found on SDK 57 (F04 sections 5 and 6; R4 section 9, Unverified).
- `NX-39-R51` says the built plist has no WidgetKit target, no share extension, no notification extension and no app group. `NX-39-R4` says no `UIBackgroundModes` in a build where P2c is off. A widget, a control or a recording that continues with the screen off could break both. The spike must say which, and what each costs.
- Before writing requirements we need answers; guessing here is the expensive error.

## 5. Questions the spike answers

Each question has an owner and a form of answer: Yes, No, or Yes with a stated cost.

| Id | Question | Answer form |
|---|---|---|
| Q1 | Can an App Shortcut or App Intent "Start a letter" ship from Expo SDK 57 with a config plugin and no ejection? Does it open the Listen Ready state? | Yes/No, plus the package or native target needed |
| Q2 | What does the intent do on a locked phone? Design default (design spec 05, Q1): unlock first, then Ready; no take starts from a locked screen. The spike confirms what iOS allows and what the parent must do (Face ID, tap). | Behaviour table |
| Q3 | Can the Action Button on supported iPhones run the intent (UNVERIFIED: Apple behaviour not read)? Which models? Headphone play/pause as Pause or Finish is out of scope (design Q2; UNVERIFIED that iOS delivers it to a recording app). | Yes/No, model list from Apple's page read at the time |
| Q4 | Can an iOS 18 Control Center control (`controlCenterControl`) start the Ready state (UNVERIFIED: Apple behaviour not read)? Does it need a WidgetKit extension target and, if so, an app group? | Yes/No, entitlements list |
| Q5 | Can recording continue with the screen off, or must the screen stay on? What does iOS require for that (a background audio mode; UNVERIFIED, Apple rules not read)? | Yes/No, required plist and entitlement keys |
| Q6 | How does a parent know recording started or stopped when they cannot look? Tone, haptic, spoken word? Which are allowed under VOICE.md and the content rules? | Options with a recommendation |
| Q7 | Do iOS Voice Control and Switch Control already operate Speak, Stop and Keep? | Pass/fail per control on the shipped build |
| Q8 | Closed, not a spike question: a take never stops on silence (design spec 05, HF-R4). The quiet-stretch line "Still here" appears after 8 seconds below -50 dB, as `listen.tsx` does today (design Q5 keeps 8 s; HYPOTHESIS). The spike only checks the line still shows with the screen locked after unlock. | Pass/fail |
| Q9 | How is use while driving kept out of scope in code, copy and the store listing? | Statement and checklist item |
| Q10 | What does each trigger add to the privacy label, the plist purpose strings and the App Review notes? | A table: trigger, plist/entitlement delta, label delta |

Rejected without a spike: auto-stop on silence (a long pause is part of the voice); a take that starts from a locked screen (unlock first); and a custom wake word ("Hey Early Letters"), which needs the microphone listening all the time and contradicts the privacy promise. Apple's own Siri phrase for an App Shortcut is in scope (Q1) because Siri, not our app, listens.

## 6. Time box and shape

- 5 working days of one `mobile` engineer plus 1 day of `security-architect` for the plist and entitlement review. Hard stop: day 5. No extension without the founder.
- Output: one findings file at `docs/research/spikes/hands-free-findings.md` (answers to Q1 to Q10, with the device, iOS version and package versions tested), and a throwaway branch `exp/hands-free-spike` that is never merged, never pushed to TestFlight and never shown to a parent.
- Test on the founder's iPhone (model and iOS version recorded) and one SE-class phone if available. Use only the fictional family "Asha". No real family details, recordings or names in the branch.
- No new permission is added beyond the microphone for the spike; if a trigger needs one, the spike stops at that question and reports.

## 7. Exit criteria

The spike passes a trigger when all four hold:

| Id | Criterion | How measured |
|---|---|---|
| EX-1 | From the trigger to the Ready state in 3 seconds or less (PROPOSED), counted from the moment the phone is unlocked, on the founder's iPhone, 10 tries, 9 succeed | Stopwatch on the device |
| EX-2 | A trigger opens Ready and does not start recording; recording starts only on the parent's tap on Ready, never on a schedule, never from a locked screen, never in the background without a visible indicator | Walk-through and log canary |
| EX-3 | Plist and entitlement delta contains no app group, no `UIBackgroundModes` and no location, or the delta is written out and sent to the founder as a decision, not applied | `security-architect` read |
| EX-4 | The letter ends as a draft; 0 keeps happen without Review (D-103); a second start is refused | Test on the branch |

Outcomes:

| Outcome | When | Next |
|---|---|---|
| GO | At least one trigger passes EX-1 to EX-4 | `product` writes NS-04b, a requirement for that trigger only, with Shown/Records/Never/Decline lines for any permission it adds |
| PARTIAL | A trigger works but needs a plist change that NX-39-R4 or R51 forbids | Founder decision with the cost; default: no change, trigger not built |
| NO-GO | No trigger passes, or every path needs a background audio mode | Findings filed; the open row in NX-42 (G6) is closed as "not now" with the reason; Voice Control (Q7) improvements are still logged as accessibility fixes |

## 8. Acceptance criteria for the spike itself

| Id | Given, When, Then | Test title |
|---|---|---|
| NS-04-R1 | Given `docs/research/spikes/hands-free-findings.md`, Then it has one section per question Q1 to Q10, each with an `Answer:` line starting with Yes, No, Closed, Open, Options (Q6: followed by the options and a recommendation), Pass or Fail (Q7: one per control, Voice Control and Switch Control) or Table (Q10: followed by the table of trigger, plist and entitlement delta, label delta), a `Device:` line naming model and iOS version, and an `Evidence:` line; an `Answer:` line that starts with Open must contain the word UNVERIFIED. | `[NS-04-R1] findings file has Q1 to Q10 in the required form` (Node test parsing the file) |
| NS-04-R2 | Given the branch, Then it contains 0 real family data (the real-family-data hash test passes) and 0 analytics or logs of audio, words or names. | `[NS-04-R2] spike branch holds no real family data` (`packages/content/test/no-real-family-data.test.ts` run on the branch) |
| NS-04-R3 | Given the findings file, Then it has `Started:` and `Findings dated:` lines in YYYY-MM-DD and the second is no more than 5 working days after the first. | `[NS-04-R3] findings land within 5 working days` (Node test on the two dates) |
| NS-04-R4 | Given every trigger section in the findings, Then it has a `Plist delta:` line, an `Entitlement delta:` line and a `Label delta:` line, each either `none` or a list. | `[NS-04-R4] every trigger states its plist, entitlement and label delta` (Node test on the file) |
| NS-04-R5 | Given each trigger on the branch, When it fires twice in a row, Then the Listen Ready state opens once and the second start is refused. | `[NS-04-R5] a second trigger start is refused` (branch unit test) |

## 9. Edge cases the future requirement must cover (listed now so the spike tests for them)

| Case | Note |
|---|---|
| Phone locked, app lock on | The app lock (Face ID) still applies before any letter or name shows; the trigger may open only the Ready state. |
| Already recording | Second trigger refused, no second take (F04-U23). |
| Audio route changes (AirPods connect, a call arrives) | The take is held, not lost; resume or stop rules in Q5. |
| Not enough space | Same as today's capture error state. |
| Child name on a static surface | F04-REQ-020: static widget, no child name, no data. Still holds for any control or intent. |
| Speech model not ready | Recording is kept as a draft with no words; the letter counts only once words exist and it is kept (D-103). |
| Siri phrase mishears | Opens the app and the Ready state, never starts a recording by itself. |

Label effect: none from the spike. Each trigger's label effect is a required line in the findings (NS-04-R4).

## 10. Privacy and constitution check

- The machine may remove and repair, never add meaning: hands-free changes how a take starts and stops, never what it says. No automatic title, summary or caption of a hands-free recording.
- No always-on microphone. No background listening. A visible OS microphone indicator stays.
- No streak, count of hands-free letters, or "you recorded N times" anywhere.
- No driving use designed for or promoted (Q9). The store listing and copy never say "while driving".
- Door lines for the future requirement, not for the spike (the spike has no parent): Shown, Records, Never, Decline are written for the trigger in NS-04b if the spike passes.

## 11. Free vs Plus

Hands-free is capture. Free and ungated in any later build; not promised as forever. Capture is never blocked (D-082: allowance 2, planned raise 2, 5, 10; the one gate is Keep after the allowance). A hands-free draft waits as any draft does. What a family kept stays theirs to read, hear and export. No hands-free feature is a Plus feature; Plus copy never mentions it (one gate, closed X3).

## 12. Metrics (content-free)

None for the spike. For a later build, only the content-free events in the analytics allowlist (opt-in, off through 1.0), for example `capture_started` with a source of `shortcut`, `action_button`, `control` or `widget`, if `data-analyst` adds the values. No audio, words, names or locations.

## 13. Dependencies

F04 (capture, Ready state, F04-U23), `NX-39-R4` and `R51` (plist rules), the preflight script (`apps/mobile/scripts/preflight-testflight.mjs`), D-103, Expo SDK 57 docs and Apple developer pages read at the time (cite with the date in the findings).

## 14. Risks

| Risk | Mitigation |
|---|---|
| A widget or control forces an app group | EX-3: delta is a founder decision, default no |
| Hands-free is read as permission to record in unsafe places | Q9 and the copy rule |
| Screen-off recording needs a background audio mode and App Review friction | NO-GO/PARTIAL branch; default no |
| Spike time runs over | Hard stop on day 5 |
| A prototype leaks into a build | Branch never merged; NS-04-R2 |

## 15. Open questions (every one has a default)

| Id | Question | Owner | Default if no answer | By |
|---|---|---|---|---|
| OQ-1 | Which engineer and which 5 days? | Coordinator, `mobile` | Starts the Monday after Build 13 is cut; `mobile` | Fri 20 Nov 2026 |
| OQ-2 | Which iPhone models does the founder test on? | Founder | His phone, plus an SE-class loaner if the lab has one | Before day 1 |
| OQ-3 | Is a plist or entitlement change ever acceptable? | Founder with `security-architect` | No. A change is listed and the trigger is not built. | At the spike read-out |

## 16. Rollout

No flag, no build number, no store text. Findings feed the decision on whether NX-42 row G6 (quick capture) becomes a requirement (see NS-06 section C).

## 17. Not fully testable

Every EX line needs a real iPhone, so the pass lines cannot be proven in CI. Q2 to Q5 and Q8 are UNVERIFIED until the spike runs. The 3-second line is a proposal.
