# NS-04: Hands-free capture (a time-boxed research spike, not a feature)

Status: CURRENT (LOCKED rev 2) | 20 Nov 2026 | Owner: `product` (CPO role) | Replaces: none | Load when: running the NS-04 spike.

Status detail: Locked v1.0, 20 Nov 2026 (council round 2). Changes after lock need a PR that lists every changed id.

Author: `product` (CPO lens). Rank 4 of 7 (closed X1: after the family pilot is under way). Index: `README.md`. Earlier: Draft v1, 11 Nov 2026. Ruled 20 Nov (Karma, council round 2): T5 (no dates or build numbers), D3 (no system intelligence donation), D13 (device evidence on an Asha-only install).

This card defines a spike: questions, a time box and exit criteria. It promises no feature and no build. If the spike passes a trigger, `product` writes NS-04b from its findings, and NS-06 Part C carries the build rows.

Tags: EVIDENCE = repo file read in the session that wrote the line. HYPOTHESIS = about parents. UNVERIFIED = not read or not run. PROPOSED = a number `product` proposes. Nothing was run on a device. Everything about Expo, iOS App Intents, widgets, Control Center controls, the Action Button and background audio is UNVERIFIED; the spike exists to settle it.

## 1. Who and when

- A parent holding a baby or carrying a toddler, often at night, who has a sentence they want to keep and no free hand. HYPOTHESIS; no parent evidence exists. The research file (`FEATURE-GAP-AND-WEDGE-10nov.md`) says one competitor sells one-handed use and one ships quick-capture widgets (UNVERIFIED: pages read by another agent, no product run).
- A parent who cannot easily use a touch screen. Voice Control and Switch Control are an accessibility question the spike also answers (Q7).
- Not a driver. No driving use is designed for, tested or promoted (Q9, Q13).
- Who runs the spike: one `mobile` engineer and `security-architect`, on a throwaway branch, on test phones holding only the fictional Asha book (ruling D13).

## 2. Why

- The job: "I go to {brand.name} with my hands full, holding {child}, to start telling a letter without touching the screen much, so that the thing I wanted to say is still there when I can speak."
- What goes wrong today: the Lock Screen and Home Screen widget was a P1 in F04 and was cut from 1.0 (F04 row 51; WP-F04-12). F04 records App Intents as "needs a native module and a spike" and Siri and Shortcuts as a v1.1 candidate, with no Expo path found on SDK 57 (F04 sections 5 and 6; UNVERIFIED there).
- Why a spike and not a requirement: `NX-39-R51` says the built plist has no WidgetKit target, no share extension, no notification extension and no app group; `NX-39-R4` says no `UIBackgroundModes`. A widget, a control, or recording with the screen off could break both. Guessing here is the expensive error.
- Evidence tag: HYPOTHESIS for the parent need; EVIDENCE for the plist rules (NX-39 as cited).

## 3. What, and Not in scope

What: answer Q1 to Q15 below on real phones in 5 working days, and write one findings file.

The single capture entry rule: hands-free is a way to reach Home's one capture entry, not a second capture path (design spec `05-HANDS-FREE-CAPTURE-STATES-11nov.md`: unlock first, doorways open Ready and add no behaviour, no auto-stop on silence). Every trigger (the four doorway names: `widget`, `controlCenterControl`, `actionButton`, `siri`) lands in the same Listen screen Home opens, in the Ready state (`/listen?entry=widget` today). One recording function: `startCapture({source})`, where `source` is Home or a doorway name (design spec 06 section 12 step 0; navigation test N3). A second start is refused while a take is active (F04-U23). A hands-free start never keeps a letter: it always ends as a draft, "Waiting to be kept", until the parent keeps it from Review with the words on screen (D-103).

Questions (answer form: Yes, No, or Yes with a stated cost):

| Id | Question | Answer form |
|---|---|---|
| Q1 | Can an App Shortcut or App Intent "Start a letter" ship from Expo SDK 57 with a config plugin and no ejection? Does it open the Listen Ready state? | Yes/No, plus the package or native target needed |
| Q2 | What does the intent do on a locked phone? Design default: unlock first, then Ready; no take starts from a locked screen. The spike confirms what iOS allows and what the parent must do (Face ID, tap) | Behaviour table |
| Q3 | Can the Action Button run the intent? Which models? Headphone play or pause as Pause or Finish is out of scope | Yes/No, model list from Apple's page read on the day |
| Q4 | Can a Control Center control (`controlCenterControl`) open Ready? Does it need a WidgetKit extension target and an app group? | Yes/No, entitlements list |
| Q5 | Can recording continue with the screen off, or must the screen stay on? What does iOS require (a background audio mode)? | Yes/No, required plist and entitlement keys |
| Q6 | How does a parent know recording started or stopped without looking? Tone, haptic, spoken word? Which fit VOICE.md and the content rules? | Options with a recommendation |
| Q7 | Do Voice Control and Switch Control already operate Speak, Stop and Keep? | Pass or Fail per control |
| Q8 | Closed, not a spike question: a take never stops on silence (design HF-R4). "Still here" after 8 seconds below -50 dB, as `listen.tsx` does today. The spike only checks the line still shows after unlock | Pass or Fail |
| Q9 | How is use while driving kept out of scope in code, copy and the store listing? | Statement and checklist item |
| Q10 | What does each trigger add to the privacy label, the plist purpose strings and the App Review notes, and does Apple process the parent's audio for that trigger? | Table: trigger, plist and entitlement delta, label delta, Apple processes audio (yes or no) |
| Q11 | For each trigger, which supported iPhones and iOS versions get it? The minimum iOS is 17 (D-040) and the reference phone is the SE 3; Control Center controls are understood to need iOS 18 and the SE 3 has no Action Button (both UNVERIFIED). The SE 3 and iOS 17 rows are required | Table: trigger by model and iOS version |
| Q12 | An incoming call, a Siri request or an alarm arrives during a hands-free take. The take is held, not lost (F04 rules). What happens on return? | Behaviour table |
| Q13 | Driving Focus is on. Can the app see it? If yes, the trigger still opens Ready with no change; no driving claim, ever | Yes/No, with the behaviour |
| Q14 | AirPods connect or disconnect mid-take. Does the route change keep recording? | Yes/No per direction |
| Q15 | Does any doorway expose letters, prompts or a child name as an App Intents entity, to Siri suggestions or to Spotlight? | Yes/No, with the entity list (must be empty, ruling D3) |

Rejected without a spike: auto-stop on silence (a long pause is part of the voice); a take that starts from a locked screen (unlock first); a custom wake word ("Hey {brand.name}"), which needs the microphone listening all the time and contradicts the privacy promise. Apple's own Siri phrase for an App Shortcut is in scope (Q1) because Siri, not our app, listens.

Not in scope: shipping anything; a TestFlight build; any parent seeing the branch; any new permission beyond the microphone (if a trigger needs one, the spike stops at that question and reports); any driving feature; Apple Watch; Android.

## 4. Happy path (the spike)

1. The founder sets the start (OQ-1). Order only (T5): after the family pilot is under way (closed X1). The roadmap holds the date.
2. `mobile` creates `exp/hands-free-spike` from `develop` with a separate bundle id (NS-04-R6).
3. `mobile` installs it on a test phone signed in to a test account holding only the Asha book (D13), and on an SE 3 with iOS 17 if one exists in the lab.
4. Day 1 to 4: Q1 to Q15, each answered in the findings file with device, iOS and package versions.
5. Day 4: `security-architect` reads every plist and entitlement delta (1 day).
6. Day 5: findings filed at `docs/research/spikes/hands-free-findings.md`; hard stop.
7. `product` reads the findings against EX-1 to EX-5 and writes the outcome (section 6, Outcomes).

## 5. Unhappy paths and edge cases

| Case | What happens |
|---|---|
| A trigger needs a new permission | The spike stops at that question and reports; nothing is added |
| A trigger needs an app group or `UIBackgroundModes` | EX-3: the delta is written out and sent to the founder as a decision, not applied (OQ-3 default: no) |
| A trigger cannot reach the SE 3 or iOS 17 | Reported as "not for the floor"; it never blocks parity of the others and never fails the spike alone |
| The spike runs over 5 days | Hard stop; findings filed as they stand, unfinished answers marked Open with UNVERIFIED |
| A prototype leaks into a build | The branch is never merged, never pushed to TestFlight and never shown to a parent (NS-04-R2, R6) |
| The test phone holds a real book | Not allowed: the spike app is a separate bundle id on a test account holding only Asha (D13) |
| Siri mishears the phrase | It opens the app and Ready, never starts a recording by itself |
| The phone is locked with App lock on | App lock (Face ID) still applies before any letter or name shows; the trigger may open only Ready |
| Already recording | A second trigger is refused; no second take (F04-U23) |
| Not enough space | Same as today's capture error state |
| Speech model not ready | The take is kept as a draft with no words; it counts only once words exist and it is kept (D-103) |

## 6. Scenario coverage (what the future requirement must cover; the spike tests the rows marked "spike")

| Scenario | Behaviour |
|---|---|
| First use | The trigger opens Ready only after first run is complete; before that it opens the app's first-run screen (spike checks) |
| Empty | No books: the trigger opens Home's normal empty state, never a recording |
| Many (1,000 letters, 300 pictures) | No effect; a trigger reads no letters |
| Offline | Works; capture never needs a network |
| Slow | n/a beyond EX-1's 3 seconds, measured on a cold and a warm app |
| Failed | A trigger that fails opens the app at Home; no take, no error naming the trigger |
| Interrupted (call, Siri, alarm, the baby) | Q12 (spike): the take is held, not lost |
| App killed mid-flow | A take in progress survives as F04 and ADR 0027 already require; the trigger adds nothing |
| App updated mid-flow | A widget or control keeps its static content; no data in it to migrate |
| Low storage (under 1 GB, under 50 MB) | Under 50 MB: today's capture error state; the trigger adds no message of its own |
| Low Power Mode and low battery | The trigger works; recording follows F04's thermal and battery rules |
| Two books | Ready opens with the active book, as Home does (NS-14) |
| Two parents | Each parent's phone has its own triggers; nothing is shared |
| Expecting parent (due date only) | Ready opens with the Before You book as Home does |
| Multilingual (Devanagari, RTL, CJK) | The trigger is static and says no words beyond its fixed label; the label is in the interface language |
| AX5 and Bold Text on SE 3 | Ready already passes AX5 (F04); widget text follows the system's own sizes |
| VoiceOver | Q7 adjacent: Ready is announced on arrival; the trigger's own label is read by iOS |
| Voice Control and Switch Control | Q7 (spike): Pass or Fail per control |
| Reduce Motion | Ready's own rules |
| Dark mode and Increase Contrast | The widget or control follows system appearance |
| Plan lapsed | Works; capture is never blocked (D-082) |
| Signed out | Works on the phone's local book, as Home does (ruling D1) |
| Second account on the same phone | Ready opens for the signed-in account's books only (X4) |
| New phone | Triggers are per phone; the parent adds them again in iOS |

## 7. Acceptance criteria (the spike itself)

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-04-R1 | Given `docs/research/spikes/hands-free-findings.md`, Then it has one section per question Q1 to Q15, each with an `Answer:` line starting with Yes, No, Closed, Open, Options (Q6), Pass or Fail (Q7: one per control) or Table (Q2, Q10, Q11, Q12), a `Device:` line naming model and iOS version, and an `Evidence:` line; an `Answer:` line that starts with Open contains the word UNVERIFIED | P1 | `[NS-04-R1] findings file has Q1 to Q15 in the required form` (Node test parsing the file) |
| NS-04-R2 | Given the branch, Then it contains 0 real family data (the real-family-data hash test passes) and 0 analytics or logs of audio, words or names | P0 (a) | `[NS-04-R2] spike branch holds no real family data` |
| NS-04-R3 | Given the findings file, Then it has `Started:` and `Findings dated:` lines in YYYY-MM-DD and the second is no more than 5 working days after the first | P1 | `[NS-04-R3] findings land within 5 working days` |
| NS-04-R4 | Given every trigger section in the findings, Then it has `Plist delta:`, `Entitlement delta:`, `Label delta:` and `Apple processes audio:` lines, each `none`, `yes`, `no` or a list | P0 (b) | `[NS-04-R4] every trigger states its plist, entitlement, label and audio delta` |
| NS-04-R5 | Given each trigger on the branch, When it fires twice in a row, Then the Listen Ready state opens once and the second start is refused | P0 (c) | `[NS-04-R5] a second trigger start is refused` |
| NS-04-R6 | Given the spike build, Then its bundle id differs from the production bundle id in `packages/brand`, it is signed in only to a test account holding the Asha book, and it is never installed on a phone that holds a real book | P0 (a) | `[NS-04-R6] the spike runs on a separate bundle id and an Asha-only account` (preflight check plus run-sheet line) |
| NS-04-R7 | Given 200 trigger fires across the triggers tested, Then 0 recordings start without the parent's tap on Ready (EX-5) | P0 (a) | `[NS-04-R7] no unmeant recording in 200 fires` (device run) |
| NS-04-R8 | Given the branch source, Then a scan finds no `CSSearchableIndex`, no `isEligibleForSearch`, and no `AppEntity` built over letters, children or prompts (Q15; ruling D3) | P0 (a) | `[NS-04-R8] no letter, child or prompt entity is exposed` (source scan, as `[X6-R1]`) |
| NS-04-R9 | Given the findings, Then Q11 has a row for the iPhone SE 3 and a row for iOS 17 for every trigger | P1 | `[NS-04-R9] the floor rows are present` |

Exit criteria. The spike passes a trigger when all five hold:

| Id | Criterion | How measured |
|---|---|---|
| EX-1 | From the trigger to the Ready state in 3 seconds or less (PROPOSED), counted from the moment the phone is unlocked, 10 tries, 9 succeed, on each test phone | Stopwatch on the device, recorded in the findings |
| EX-2 | A trigger opens Ready and does not start recording; recording starts only on the parent's tap on Ready, never on a schedule, never from a locked screen, never in the background without the OS microphone indicator | Walk-through and log canary |
| EX-3 | The plist and entitlement delta contains no app group, no `UIBackgroundModes` and no location, or the delta is written out and sent to the founder as a decision, not applied | `security-architect` read |
| EX-4 | The letter ends as a draft; 0 keeps happen without Review (D-103); a second start is refused | Test on the branch (NS-04-R5) |
| EX-5 | 0 recordings started without the parent's tap on Ready in 200 trigger fires across the triggers tested | NS-04-R7 |

A trigger that cannot reach the reference phone (SE 3, iOS 17) is reported as "not for the floor" and never blocks parity: the others may still pass.

Outcomes:

| Outcome | When | Next |
|---|---|---|
| GO | At least one trigger passes EX-1 to EX-5 | `product` writes NS-04b for that trigger only, with Shown, Records, Never and Decline lines for anything it adds; NS-06 Part C carries the build rows |
| PARTIAL | A trigger works but needs a plist change that NX-39-R4 or R51 forbids | Founder decision with the cost; default: no change, trigger not built |
| NO-GO | No trigger passes, or every path needs a background audio mode | Findings filed; NX-42 row G6 closed as "not now" with the reason; Voice Control (Q7) fixes are still logged as accessibility work (NS-33) |

## 8. Non-functional budgets

| Line | Budget |
|---|---|
| Latency (p95 on SE 3) | EX-1: trigger to Ready 3 s or less after unlock (PROPOSED); Ready to microphone live stays F04-REQ-023's p95 500 ms |
| Memory | A widget or control extension, if any, holds no letter data; its memory is iOS's limit (UNVERIFIED) |
| On-device storage | None added by a trigger |
| Battery | No background listening; a static widget refreshes never or on iOS's schedule with no data |
| Offline | Works |
| Accessibility | Q7; every trigger has an iOS-provided label |
| Localisation | The fixed trigger label is a `packages/content` string in the interface language |
| Privacy (log canary) | 0 audio, words or names in any log on the branch (NS-04-R2) |

## 9. State space

n/a for the spike, which touches no sync, account or notification. For NS-04b, the scenario rows in section 6 (signed out, second account, plan lapsed, new phone) become RR-5 rows; the kill switch has no effect because a trigger is local; a doorway's own remote removal is NS-06-C8.

## 10. Data and engineering

- Branch `exp/hands-free-spike`, never merged, never on TestFlight (CTO pass). Separate bundle id (NS-04-R6).
- Fields, migrations, sync groups, export: none.
- Modules touched on the branch only: `lib/capture/start-capture.ts` (`source` values), a config plugin or native target per trigger, `app.config.ts` plist entries.
- Flags and remote pause keys: none for the spike. The later build uses `EXPO_PUBLIC_QUICK_CAPTURE` (NS-06 Part C).
- Error codes: none.
- Cost: 5 `mobile` days plus 1 `security-architect` day. Each native build counts against D-092 (15 iOS builds a month on EAS Free).
- Rollback: delete the branch.

## 11. Data inventory

None. The spike adds no data. If Q1 to Q5 show a trigger needs an app group, the findings list what would live there (the answer must be "nothing L3 or L4").

## 12. Door lines

n/a for the spike: it has no parent. NS-04b writes Shown, Records, Never and Decline for each trigger it specifies. A plain setting (adding a widget in iOS) is "Records: on the phone only; no PRIV-R21 row, because this is a setting".

## 13. Threats

| Asset | Threat | Control | Test |
|---|---|---|---|
| L4 data in an app-group container | An extension process reads letters, names or audio | No app group (EX-3); default no | `security-architect` read; NS-06-C3 preflight later |
| Microphone | A trigger records without the parent's tap | EX-2, EX-5 | NS-04-R7 |
| Letter text, child name, prompts | Donated to Siri, Spotlight or an App Intents entity | Q15; ruling D3 | NS-04-R8 |
| Real family data on a test phone | A real book is read, recorded or shown in a screenshot or trace | Asha-only install, separate bundle id (D13) | NS-04-R6, R2 |

## 14. Never (rulings D2 and D3)

Never: no letter text, child name, picture or prompt is donated to Core Spotlight, `NSUserActivity` search, Siri suggestions or an App Intents entity (`[X6-R1]`, NS-04-R8). A Siri phrase or App Shortcut opens the app; it never carries the parent's words as a parameter. No always-on microphone, no background listening, no wake word. No automatic title, summary or caption of a hands-free recording. D2 (writing tools) is n/a because the spike adds no text field.

## 15. Design inputs

Design spec 05 states. The spike adds none to draw; it reports what iOS shows (lock-screen unlock prompts, the microphone indicator, the Control Center tile) as screenshots from the Asha install only (D13).

## 16. Content inputs

The trigger label (intent: "Start a letter"); the Siri phrase (intent: "Start a letter in {brand.name}"). Banned: "while driving", "hands-free while you drive", any count of hands-free use, "nothing leaves your phone" near a Siri trigger (Siri sends the parent's spoken phrase to Apple, not to us). `content` writes; the founder approves.

## 17. Legal, privacy and compliance

- Apple: 2.5.19 (no hidden or undocumented features; research notes 20 Nov) means a trigger exists in a store build only when documented in the Notes for Review. Siri and App Intents rules: UNVERIFIED; read on the day of the spike and cited with the date.
- Counsel: none for the spike. A trigger that adds a plist purpose string or label line goes to Q54 (App Privacy answers) in NS-04b; counsel must confirm.
- D13: device evidence on an Asha-only install.

**Label effect.** None from the spike. Each trigger's label effect is a required line in the findings (NS-04-R4), and NS-04b carries it.

## 18. Claims

Enables: nothing public. Forbids: "hands-free", "while driving", "voice-activated", "always listening", "nothing leaves your phone" next to any Siri trigger.

## 19. Free or Plus

Capture is never blocked and never in Plus. Ruled 20 Nov (T2): anything that ships free in the 1.0.x line stays free; public copy says nothing either way. A hands-free draft waits as any draft does; Keep after the allowance (D-082) is the one gate.

## 20. Measures with analytics off

None for the spike; the findings file is the measure. For a later build: tester question, fixed wording, "Did you start a letter without unlocking and tapping Speak this week (yes or no)?", reported as x of n (never a percentage under 20), numbers only in the founder's private sheet (D5).

## 21. Dependencies and gates

F04 (Ready state, F04-U23), `NX-39-R4` and `R51` (plist rules), `apps/mobile/scripts/preflight-testflight.mjs`, D-103, D-040, the design consolidation of `startCapture({source})` (step 0, N3), Expo SDK 57 docs and Apple developer pages read on the day. Gate for any build: a GO outcome, then NS-04b, then NS-06 Part C. Order: after the family pilot is under way (closed X1); the roadmap holds the date (T5).

Risks:

| Risk | Mitigation |
|---|---|
| A widget or control forces an app group | EX-3: delta is a founder decision, default no |
| Hands-free is read as permission to record in unsafe places | Q9, Q13 and the copy rule |
| Screen-off recording needs a background audio mode and App Review friction | NO-GO or PARTIAL; default no |
| Spike time runs over | Hard stop on day 5 |
| A prototype leaks into a build | Branch never merged (NS-04-R2, R6) |

## 22. Open questions

| Id | Question | Owner | Default if unanswered |
|---|---|---|---|
| OQ-1 | Which engineer and which 5 days? | Founder (start), `mobile` | `mobile`; the founder sets the start; the roadmap holds the date CLOSED 20 Nov, see GAP-LOG Closures CL-002 |
| OQ-2 | Which phones? | Founder, `qa` | A lab test phone and an SE 3 on iOS 17, both signed in to an Asha-only test account (D13); never the founder's own phone with the family book CLOSED 20 Nov, see GAP-LOG Closures CL-002 |
| OQ-3 | Is a plist or entitlement change ever acceptable? | Founder with `security-architect` | No. A change is listed and the trigger is not built CLOSED 20 Nov, see GAP-LOG Closures CL-002 |

Not fully testable: every EX line needs a real iPhone; Q2 to Q5, Q8 and Q11 to Q15 are UNVERIFIED until the spike runs; the 3-second line is a proposal.
