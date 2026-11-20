# NS-46 to NS-50 review: testability and traceability (qa lens)

Status: WORKING-INPUT (record; findings applied in the cards; do not load) | 20 Nov 2026 | Owner: the review role named in the file | Replaces: none | Load when: auditing where a finding came from; otherwise do not load.

Reviewer: `qa` role (a Claude session, not a licensed professional). Written 20 Nov 2026 (UTC), branch `docs/locked-pack-inputs-20nov`. Docs only. Nothing was run: no test, no simulator, no CI job. Function files used: `functions/quality.md` (FR-QAL), `functions/reliability.md` (FR-REL). Fictional family Asha only.

## 0. What I read, and what I did not

Read in full: `ns46-50/BRIEF.md`, `21-days-cultural-photos-home.md` (all five cards), `functions/quality.md` lines 1 to 473 (sections 1 to 7, Annex A, Annex B; Annexes C to I not read), `functions/reliability.md`, `functions/BRIEF.md`, `18-errata-after-lock.md` row E18, GAP-LOG blocks R-IA, N, CB, DL (lines 415 to 458), `14-test-plan.md` lines 40, 96, 137.

Read in code (grep and partial reads only): `packages/content/test/rules.test.ts` (lines 1 to 175, 260 to 310, 950 to 1000), `packages/content/test/support/copy-surfaces.ts` (1 to 60), `packages/content/src/index.ts`, `packages/content/BRAND.md` (86 to 96), `VOICE.md` (60 to 75, 155 to 175), `packages/content/src/helplines.ts` (255 to 265), `apps/mobile/src/lib/capabilities.ts:258-268`, `supabase/migrations` (grep for faith, tradition, country), `apps/mobile/src` (grep for `setChildQuiet`, `FRAME-SLIP`, slip registry).

Outside sources read this session (20 Nov 2026):
- https://developer.apple.com/documentation/journalingsuggestions/journalingsuggestionspicker.md : availability "iOS: 17.2.0 -"; the first time the picker appears a modal sheet introduces it; the system shares only the chosen suggestion with the app.
- https://developer.apple.com/forums/thread/746843 : a developer-forum thread (not Apple documentation), so treat as UNVERIFIED: the framework is not in the Simulator SDK; on iPad a device build can still crash at launch unless the framework is weak-linked and a runtime check is added.

Not read, so UNVERIFIED: `docs/design/e2e/IA-AUDIT.md` (worktree not present), the function files DAY, CUL, NTC, PHS, any e2e DESIGN.md, `apps/mobile/src/lib/reminders/planner.ts` body, `docs/privacy/DATA_CLASSIFICATION.md`, how NS-37-R4 backup exclusion is proven today, `claims-capabilities.test.ts` body. I did not verify any holiday date, Apple rule or law.

## 1. Count check against the card's own Trace table

I counted the rows in the card by script (ids `NS-46-R` to `NS-50-R`, Priority cell).

| Card | Rows | P0 | P1 | P2 | Card's Trace table | Match |
|---|---|---|---|---|---|---|
| NS-46 | 28 | 14 | 13 | 1 | 14 / 13 / 1 | yes |
| NS-47 | 27 | 17 | 9 | 1 | 17 / 9 / 1 | yes |
| NS-48 | 27 | 11 | 15 | 1 | 11 / 15 / 1 | yes |
| NS-49 | 27 | 17 | 9 | 1 | 17 / 9 / 1 | yes |
| NS-50 | 12 | 4 | 7 | 1 | 4 / 7 / 1 | yes |
| Total | 121 | 63 | 53 | 5 | | |

Counts are right. Two label problems inside them (finding F-12): NS-47-R17, R18 and R25 are written "P1 (b)". RR-4 says a legal or store duty is P0, so either the label or the reason is wrong. Moving them makes 66 P0.

## 2. How each P0 row can be proven (proposal for the engineer who writes the test)

Key as `functions/quality.md` 3c: C = unit or integration test in CI; S = source or rules scan in CI; D = device only; E = a dated record that must exist; P = process no test proves.

| Card | P0 rows and proposed proof |
|---|---|
| NS-46 (14) | C: R4, R5, R7, R8, R14, R25. C+S: R2, R16, R19, R27. S: R17, R22. C+D: R13 (tap to landing under 2 s on SE 3). E: R23 (tradition review and source licence; no test can prove it) |
| NS-47 (17) | C: R1, R2, R4 (plus lint), R5, R7, R8, R9, R15, R16, R21. S: R3, R11. C+D: R6 (backup exclusion), R12, R13 (lock screen). S+E: R22 (claims rows). E: R23 (label re-run) |
| NS-48 (11) | C: R1, R2, R3, R5, R8, R9, R11, R21, R26. S: R10. S+P: R4 (banned words by scan, meaning by a human read) |
| NS-49 (17) | C: R3, R13, R21, R24. S: R23, R25, R26. S+D: R6, R10. C+D: R7, R9, R11, R12, R19. S+E: R15 (entitlement). E: R16, R27 |
| NS-50 (4) | C: R2, R3, R8. C+P: R11 (the "strip is not built before T3" half is a research gate, not a test) |

Totals of the 63: C 32, C+D 9, S 12, S+D 2, S+E 2, E 4, S+P 1, C+P 1. So 59 rows have a CI part, 11 have a device part, 4 are a record only (NS-46-R23, NS-47-R23, NS-49-R16, NS-49-R27), 2 contain a process half. FR-QAL-03 applies to the 4 record rows: trace accepts them only with a dated path that exists. Proposed path: the gate record of FR-CMP-11 (`docs/legal/evidence/store/<version>-<build>/gates.md`, as cited by quality.md, not re-read).

## 3. Row counts against gates G0 to G6 (`14-test-plan.md` line 96)

| Gate | What it needs | State for these 121 rows |
|---|---|---|
| G0 trace sees NS ids; every P0 has a test and a backlog row | 63 P0 test titles and 63 backlog links | Test titles exist as strings in the card (all start `[NS-4x-Rn]`, good). Backlog links: none. The card says "new rows needed (no id invented)" for every area; only prerequisites BL-537, BL-961, BL-963, BL-966, BL-982, BL-985 exist. `trace.mjs` still reads `docs/prd/v2` (quality.md FR-QAL-02). So G0 is open for all 63 |
| G1 on-device data rules (ADR 0028, PR #797) | NS-47 store is class L4 on the phone | Rows that need it: NS-47-R1, R6, R10, R16; NS-46-R6 |
| G2 counsel reads | NS-46-R23 (source licence), NS-47 (CUL-Q5 to Q7, Q11, Q-DAY-6), NS-49-R16, R27 (copy and DPLA) | 4 P0 record rows plus the P1 NS-47-R14. All E-kind |
| G3 founder approves words | every `days.*`, `culture.*`, `ntc.*`, `features.photos.suggestions.*` key | The card says words are intent only. No test checks "founder approved"; propose an `approved` flag per key family in the gate record |
| G4 every P0 device row passes | the 11 D-part rows plus J-CUL-01, NTC-T24, device runs on iOS 17.1, 17.2 and 26 (NS-49 section 13) | J-CUL-01 and NTC-T24 are named in the cards but have no id in `14-test-plan.md` section 4 (J-N1 to J-N27; quality.md proposes J-N28 to J-N36 for card 19). Need J-N37 to J-N39 (F-14). Pass 5 "old17" (quality.md Annex B) is the only pass that carries iOS 17.0 and 17.1; without such a phone the NS-49 launch-safety row (F-06) cannot pass |
| G5 label and claims match the build | NS-47-R22, R23, NS-49-R15, R27 | 4 rows, all record or scan. The two cards that say "Label effect: none" (NS-46, NS-48, NS-50) have no re-run row of their own; NS-46 points at NS-47-R23. Acceptable |
| G6 no `production` flag on while its card has an open P0 | `EXPO_PUBLIC_DAYS`, `EXPO_PUBLIC_SUGGESTIONS` (PROPOSED), `killSwitches.libraryDays` (PROPOSED) | No row tests "production profile has the flag off". Only NS-49-R26 does this, and only for the level 3 spike. NS-46 section 10 says `EXPO_PUBLIC_DAYS` "ships on once copy and counsel gates pass", which is a G6 rule restated without a check. See F-13 |

## 4. Findings

Format: id, card and row, problem, evidence, severity, proposed change. P0 blocks build, P1 fix before build, P2 note.

### F-01 (P0) All five cards: the content rules test will not read the new strings
- Evidence: `rules.test.ts:97-98` builds `IN_APP` from `en`, `permissions`, `features`, onboarding stories, helplines and feature-local app `copy.ts` files; `EVERY` adds emails. `packages/content/src/index.ts` exports no `days`, `culture` or `ntc` family. The notification-only rules key on path regexes: the exclamation budget at `rules.test.ts:161` (`en.notifications` and `features.reminders.neutral|together`), the 40 and 110 character limit at `:266-269`, and the rhythm scope at `:296`. A new `packages/content/src/days/` or `notifications.catalogue.en.ts` (NS-46 section 10, NS-48 section 10) matches none of these unless it is exported under `en` or `features` and under those path prefixes.
- Effect: CLAUDE.md says content rules are enforced by that file. As drawn, NS-48-R10 and NS-46-R17 would be satisfied by tests that never see the strings, which is a green that proves nothing.
- Only `features.photos.suggestions.*` (NS-49) is covered by the general rules, because `features` is in `IN_APP`. The notification-specific limits still would not apply to anything under it, which is correct for a start label.
- Proposed row, NS-48-R28, P0 (a): "Given every key in `days.lock.*`, `days.landing.*`, `ntc.*` and `notifications.dayNames.*`, When `rules.test.ts` runs, Then each key is in `EVERY` and in the notification scope (zero exclamation marks, 40 and 110 limits, rhythm and gap rules), and a drift test fails if a key family exists in `packages/content/src` that is not in `ALL`." Title: `[NS-48-R28] every notification key is under the notification rules`. Owner `content` with `qa`. The same drift test serves NS-46, NS-47, NS-49.

### F-02 (P1) NS-47 section 16, NS-48-R10: "note" is a reserved word
- Evidence: `BRAND.md:92-93`: a short piece someone makes is a "note" ("Only ever something a person makes"); what we send is "reminder" or "message", and "note" is listed as the word not to use for it. Card intent strings: `culture.ask.question` "Would you like a note on days that matter to your family?" and `notifications.dayNames.switch` "Show the day's name in the note". NS-48-R10 itself bans "note" for an app message. The cards' prose uses "note" for a notification throughout, which is fine in a spec only if BRAND.md's internal-terms table says so (CLAUDE.md, CR-25).
- Proposed: intent words become "a reminder on days that matter to your family?" and "Show the day's name in the reminder"; add "library day", "days store", "catalogue key", "slip" to the internal-terms table in the same PR. I found no regex in `rules.test.ts` that enforces the glossary row for "note" (I read lines 950 to 1000 only), so add one over the notification scope as part of NS-48-R28.

### F-03 (P1) NS-46-R17: the rule list contradicts two offered days
- Evidence: R17 bans "a relationship word" in any `days.*` key. Q-FD-3 and DL-1 offer Mother's Day and Father's Day; a `days.name.*` key for them contains one. Likewise "Eid Mubarak" style names would trip the banned "Mubarak", and Pentecost, Ash Wednesday and Good Friday are names, not greetings.
- Existing rules do not have these patterns either (no "Happy", "Merry", "Blessed", "celebrate" or "gather" regex found in `rules.test.ts`), and the existing `FEAR` pattern (`:182`, "die, dead, death, passed away") would reject a day name such as "Day of the Dead"; DAY's `days.excluded` probably holds those, UNVERIFIED.
- Proposed R17 wording: scope the ban list to `days.landing.*`, `days.lock.*`, `days.picker.*`, `days.nextYear.*` and `days.door.*`; `days.name.*` gets a separate rule (no greeting, no "your", no digit except inside a name from an allowlist). Each new regex gets a positive and negative self-test as the daily-rhythm rule does at `rules.test.ts:306-312`, so the checker is itself tested. Define "a digit outside a date" in the row.

### F-04 (P0) NS-46-R8, R11 and NS-47-R8: real traditions in fixtures next to Asha
- Evidence: the card's conventions (line 17) say "No fixture pairs a real tradition with Asha". NS-47-R8 and section 13 say synthetic keys only. But NS-46-R8 names fixtures "14 Feb 2029 and 16 May 2027" (Valentine's Day with Ash Wednesday; Pentecost with Eid al-Adha, section 5 line 126). A planner or store test that ticks those ids on a book whose child is Asha is exactly that pairing.
- Proposed R8 wording: planner, store, landing, lock-screen and Home tests use a synthetic table (`zz-test-day-a`, `zz-test-day-b`, authority `zz-test-authority`, one `precision: about` row with two authority dates). Real day rows appear only in the content-data tests (R1, R12, R18, R24), which hold no family and no child. Add to the Asha catalogue (quality.md Annex E, not read) a synthetic-days fixture module in `apps/mobile/test/helpers/`.
- Also (P2): R11 quotes "23 Sep 2027 06:02 UTC" as the equinox. R1 forbids dates written from memory; the row needs a named source for the astronomical oracle, or the test must compute it in a way that does not depend on the code under test.

### F-05 (P0) NS-46-R25, NS-48-R21, NS-50-R8: three P0 rows depend on a quiet-book reader that does not exist
- Evidence: in my grep of `apps/mobile/src`, `setChildQuiet` appears only at `store.ts:390` (its definition); the planner reads `lastOwnSaveAt` and `plannerChildren` (`scheduler.ts:30`, `:124`). Card conflict 6 and errata E16 say the same. Reliability FR-REL cites `prefs.ts:115-116` (not re-read).
- Effect: these three rows go red the day they are written and stay red until BL-985. That is correct for TDD, but the card lists no ordering.
- Proposed: add the planner input contract to the rows, so the test is written against the planner's input type and not against UI: "`plan(input)` takes each book's `quiet` and `included` flags; a quiet or hidden book is absent from the sources, names, age bands and kinds." Title stays. Mark all three "blocked by BL-985" in section 22 of each card, and let `qa` own a single shared quiet fixture (Asha plus a second fictional child, one quiet, one included).

### F-06 (P0) NS-49-R5, R18: a launch crash is not covered by "absent where it cannot work"
- Evidence: Apple documents the picker as iOS 17.2 and later (source above). Our floor is 17.0 (`app.config.ts:44`, per the card). The forum thread (UNVERIFIED as Apple guidance) reports that on devices where the framework is absent the app can crash at launch unless the framework is weak-linked, and that it is not in the Simulator SDK. R5 tests that the choice is hidden, which a JS test can do, but not that the app launches at all on 17.0 or 17.1 or on an iPad.
- Proposed new row NS-49-R28, P0 (c): "Given a build that includes the suggestions module, When it launches on iOS 17.0 or 17.1 and on an iPad in compatibility mode, Then it reaches Home with the choice absent and no crash." Proof D (pass 5 old17 and pass 8 ipad of quality.md Annex B, evidence file per FR-QAL-07) plus a build-config scan (S) that the framework is weak-linked. If no 17.0 or 17.1 phone exists the row is "not run" and G4 does not pass (FR-QAL-07, FR-QAL-23 treats a crash at launch as the loss case).

### F-07 (P1) NS-49: level 2 cannot run in the Simulator or in Maestro; define the seam
- Evidence: forum thread above (Simulator SDK lacks the framework, UNVERIFIED as Apple text). The card gives `pickSuggestion()` as the native boundary (section 10).
- Effect: R7, R9, R10 (run-time half), R11, R12, R13 and R19 are device-only unless the boundary is a stand-in. quality.md 14 s2 says a stand-in test must say so in its title and its row stays "partly built".
- Proposed row NS-49-R29, P1: "`pickSuggestion()` is the only native boundary and returns a plain object (file URL, title, date, `kind`); a JS stand-in produces Asha fixtures (a JPEG, a HEIC, a Live Photo still, a symlink, a path outside the container, a 0 byte file, a suggestion with no photo, one with three photos); `isAvailable()` is false on Simulator, iPad, Catalyst and below 17.2." Titles of tests that use the stand-in carry `(stand-in)`.
- Add a device row for R19: a real suggestion's returned file passes the validator. A validator that is stricter than Apple's real container passes CI and fails on every phone. "The location Apple provided" is UNVERIFIED in the card, so the stand-in cannot be the only proof.

### F-08 (P1) NS-49-R6, R25: a source scan cannot see a dependency's PhotoKit call
- Evidence: R6 says "the compiled app calls no PhotoKit authorisation function"; R25 says no `PHPhotoLibrary` fetch, no MediaLibrary or camera package. A grep over app code and `modules/scribe-photo` finds our calls, not a call inside a transitive native dependency that Expo autolinking pulls in.
- Proposed: R6 and R25 get two proofs: S (source and `package.json` deny list plus the resolved Info.plist and entitlements for each EAS profile, which a node test can read from the Expo config) and E (an `nm` or strings read of the candidate binary on the macOS runner saved to the gate record). The binary read belongs to the candidate job, not every PR (FR-QAL-10, FR-QAL-19). CI change is a patch in `docs/ops/proposed/`, not made by me.

### F-09 (P1) NS-49-R13: "differ in no byte but pixels" cannot be asserted as written
- The stored copy is stripped and re-encoded by the NS-01 pipeline; two runs with the same input have the same pixels. Export bytes contain ids and times.
- Proposed R13 wording: "Given the same source image delivered by the level 1 stand-in and by the level 2 stand-in, with ids and time from injected sources, Then the stored file bytes, the entry row fields and the Save a copy file bytes are identical." Needs an injected id source and clock (FR-QAL-13).

### F-10 (P1) NS-46-R24 and R12: a date-driven red test and an undefined oracle
- R24 says the build fails when a row's last year is before the next calendar year after the October review date. That test reads the real clock, so it turns red on unrelated PRs on a day nobody chose (it violates "fast, deterministic" in the charter). The repo has this pattern already: `helplines.test.ts:26` fails after `helplinesDueOn()` (`helplines.ts:259`).
- Proposed: keep the pure function `daysDueOn(rows)` and test it with an injected "today" (red and green cases); put the real-date check in a scheduled job that opens an issue in September (proposed patch for `nightly.yml`, which I cannot edit). If the founder wants the red-on-date behaviour as in helplines, say so in the row and put the due date in the failure message. Flagged for decision, Q-QA-3.
- R12 says the test "equals the checked table for 2026 to 2030". The checked table is not defined. An oracle generated from the code under test proves nothing. Proposed: the oracle is a table of dates read from a named authority, committed with source and read-on date (as helplines do), and the test fails if the oracle file has no source.

### F-11 (P1) NS-46-R9, R10: ceiling behaviour has no oracle; time and zone matrix missing
- R9: "Given 60 budgeted notes pending, Then library days respect the ceiling" does not say which notes are dropped. A test cannot assert "respects". Proposed default: the nearest 60 by fire date stay and the plan re-fills at the next re-plan; product to confirm (Q-QA-4).
- R10, R11, NS-48-R3, NS-50-R7 are time rows. Per FR-QAL-13 they need an injected clock and an explicit zone, never the runner's. Matrix for the planner tests: America/Los_Angeles, America/New_York, Australia/Sydney (hemisphere switch, season names), Pacific/Kiritimati (UTC+14) and Pacific/Pago_Pago (UTC-11) for the date line, and one 92 day plan that crosses a DST change (the 09:00 instant moves by one hour, the local time does not). Add "zone changes after "Not now"" for NS-50-R7: the dismissal keyed to the local date must not resurface the slip the same day.
- R10 "92 days ahead" and the 60 pending ceiling are the card's numbers; iOS' own pending limit was not read this session, UNVERIFIED.

### F-12 (P1) Priority labels and accessibility rows
- NS-47-R17, R18, R25 are "P1 (b)" (see section 1). Fix to P0 or drop "(b)".
- NS-46-R26, NS-47-R25, NS-49-R17, NS-50-R12 are accessibility rows, P1 or P2. FR-QAL-09 (quality.md line 203) treats accessibility on screens in the set as P0 (b), citing FR-CMP-07 and LEGAL-REQ-051 (not re-read by me). Either these new screens are outside that set, which should be said, or the rows follow NS-33-R6 and R12. At minimum, VoiceOver for the Days ask and the lock-screen opt-in (NS-47-R25) should be P0 because a person using VoiceOver would otherwise be asked a faith question they cannot decline: "Not now" has the same size and reach as the primary is the row's own requirement.
- NS-47-R10 (the faith list must not appear in Save a copy) is P1 but the file leaves the phone; FR-QAL-23 lists "a leak off the phone" as non-waivable. Proposed P0 (a). NS-47-R24 (days never on a shared surface, the other parent) is a wrong-person leak; proposed P0 (a).
- NS-46-R28 (remote pause) is P1. DAY-R in the card calls a wrong date "the failure mode with the highest cost to trust", and reliability records no over-the-air update (D-091) so a wrong table cannot be fixed without an App Review pass. The pause is the only fast mitigation, so its test is P0 (a). Existing pattern: `capabilities.ts:268` returns `config?.killSwitches?.[feature] !== true`, so a missing or unreachable remote config leaves the library on. Add to R28: "with no remote config the library stays on; with the key true it is hidden at next focus; with any other value it stays on."

### F-13 (P1) State-space tables name tests that do not prove the row
- Evidence: NS-46 section 9: "Kill switch `serverFeaturesEnabled()` off: `[NS-46-R4]`", "Reminders off: `[NS-46-R4]`", "Plan lapse: `[NS-46-R27]`", "Notifications not allowed: `[NS-46-R10]`". R4 asserts only that no class is added; R27 asserts a note never sells; R10 is time and window. Trace will count each as proving a state it never asserts.
- Proposed new row NS-46-R29, P1: one parametrised test over {server features off, plan lapsed, signed out, reminders off, notifications not allowed, offline} whose title lists every id it proves: `[NS-46-R29][NS-46-R4] library works under every standing state`. Same fix for NS-47 section 9 and NS-50 section 9 "n/a" rows (an "n/a" with a one-line proof by construction is fine; say which).
- Real conflict inside the pack: NS-46 section 9 and section 5 say "Reminders off: library days still come if notifications are allowed" (D W-G7); NS-48 section 9 says "Reminders off or paused: the function is not called; nothing pending" (R2) and section 5 "A parent turns reminders off: nothing is chosen". For a ticked day R8 does call the function. Proposed NS-48 wording: "reminders off: the evening class is not planned; a ticked day still resolves its key." Karma to confirm.
- Also add: a ticked id that is no longer in the table after an app update is dropped without a crash, a phantom note or a line saying it is missing (R19 says the app never says a day is missing). P1 row NS-46-R30.

### F-14 (P1) Device walks and journeys have no ids in the test plan
- J-CUL-01 (NS-47), NTC-T24 (NS-48), slip test T3 and tree test T1 (NS-50) are named; none is in `14-test-plan.md` section 4 or in quality.md's proposed J-N28 to J-N36. Proposed: J-N37 lock-screen walk (Notification Center, Apple Watch mirror, Focus summary, Show Previews Never, App lock on and off, names switch on and off), J-N38 one week of notes on a phone (NTC-T24), J-N39 picture-first and suggestions on iOS 17.1, 17.2, 26 and iPad. T1 and T3 are research, not tests; label them P in the register.
- NS-47 sections 5 and 13 say "UNVERIFIED whether a hidden body shows" on Apple Watch, Notification Center and Focus summary. That uncertainty is the reason J-N37 is a gate row and not an optional walk; do not let the flag ship on the simulator's word.

### F-15 (P1) NS-47-R4: the migration lint as worded fails today
- Evidence: `supabase/migrations` contains `han_traditional` (a language code), `faithful` (constitution wording), and "country" at `20261003010000_children_and_entitlements.sql:382` (a store country code comment). A lint on "tradition", "faith" or "country" without word boundaries and an allowlist is red on the first run.
- Proposed R4 addition: "the lint matches whole words in column, key and setting names (not comments), with a named allowlist (`han_traditional`, `storefront`) that a data-architect owns." Owner `data-architect` for the lint (policy tests are theirs); `qa` for the network-fake half.

### F-16 (P1) NS-47-R5: "a letter from each library day" is a slow test of the wrong thing
- Saving a letter per library day (hundreds of rows) is slow. What matters is that the prompt choice and the synced row do not depend on the day. Proposed: test the prompt selector as a pure function with the day as an ignored input (one case per layer and tone), plus one end-to-end save against the sync stand-in (`apps/mobile/test/helpers/sync-v1-standin.ts`) compared with a control letter. Fast, same coverage of CB-3.

### F-17 (P1) NS-47-R6: backup exclusion is partly a device fact
- A unit test can assert the store file sits in the excluded location and not in `scribe.db`. Whether an iPhone backup omits it is a device or backup-inspection fact. I did not read how NS-37-R4 proves the same for `photos/*-512.jpg`, UNVERIFIED. Proposed: C (path and flag, using the same list the NS-37-R4 test uses) plus a device row in J-N37; the row's title says which half runs where.

### F-18 (P1) NS-48: determinism, floor and the "catalogue off" seam
- R2 says "catalogue on or off" but section 10 says "Flags and pause keys: none (variety is not a setting)". Name the seam: the planner takes a `select` function; the test injects the floor-only selector. Otherwise the row cannot be written.
- R14 (no repeats, no shape three times in a row over 365 slots per cadence) and R3 (recency bands) are cheap property tests; use a fixed seed `SCRIBE_FUZZ_SEED` and print it on failure (charter). Good as written.
- R4 and R5 are partly human judgement ("never mentions the gap", "never summarises"). A word scan catches listed words only. Label S+P in the register and put the human read into a reviewer sheet signed per release, so the register does not claim a regex proves meaning.
- R12 (no evening words before 17:00): add a test that scans text for evening words against the `evening` tag, so a mis-tagged variant is caught, not only a tagged one.
- R18 "launch floor about 128" is not testable. Give an exact minimum per grid cell (and per layer) as a constant the test reads; 20 cells by 6 is 120, so say what the other 8 are (the built evening 8, per section 3).
- R7 age bands (0 to 2, 3 to 11, 12 to 35, 36 and over months): boundary tests on the fire date, with the age function from `packages/core` (R-IA-1) and injected clocks. Fixture: Asha (born 2025-04-12 per the privacy test header) and a second fictional child; the second name to be taken from the existing Asha twins fixture, which I did not read.

### F-19 (P1) NS-50: the slip registry and `[FRAME-SLIP]` do not exist yet
- Evidence: my grep found no `FRAME-SLIP` in `apps/mobile/src` or `apps/mobile/test`, and no registry file; "Built today" (card section 10) says 2b and 2c do not exist. R1, R5, R10 and R11 are written against a registry that BL-963 has not built.
- Proposed: the slip choice is a pure function `chooseSlip(state, today)` returning at most one rank; R1, R2, R3, R5, R6, R8, R10, R11 are unit tests of it with an injected date. R4 (arrived by tapping a note) is a navigation-parameter test plus one device tap on a real delivered note (J-N37). R9 (switcher snapshot) is device; the E18 behaviour is "built in #838" per errata, not re-verified by me.
- R11 mixes a testable half and a research gate; split into R11a (C: slip-like items at most 1, no screen shows a count) and R11b (P: strip not built before T3).

### F-20 (P2) NS-46-R23: evidence of a tradition-member review can itself be sensitive
- A record naming the reviewer and the tradition reveals a person's faith. Proposed: the gate record holds a pseudonymous reviewer id, the tradition id, the date and "read", with the person's name kept outside the repository. Counsel to confirm (needs a number from legal).

### F-21 (P2) NS-47 section 21 and NS-46 section 21: no analytics, so measures are tester sheets
- Fine as drawn. The register should list each sheet as P, with "x of n" results stored as numbers only, under quality.md Annex B evidence rules (Asha install, no tester's faith or origin recorded). No change to the rows.

## 5. Which test layer, per card (unit, db, device, content rule)

| Card | Unit (`npm test`, mobile, core) | db (`npm run test:db`) | Device | Content rule (`packages/content`) |
|---|---|---|---|---|
| NS-46 | planner source `libraryDay`, order, clash, ceilings, time and zone, store ids, no-look-back | none | tap to landing under 2 s on SE 3; hemisphere, zone travel; delivery at 09:00 | `days.*` key rules (F-01, F-03); data tests R1, R12, R18, R24 in `packages/content/test` |
| NS-47 | store, flag, sign-out, erase, claim, export leak, import boundary, analytics allowlist, canary | migration lint only (F-15), owner `data-architect`; no new table so no `grants.mjs` row | lock screen, Notification Center, Watch, Focus, Show Previews, App lock, backup exclusion | `culture.*` keys; call-out claims rows (R22) in `claims-capabilities.test.ts` |
| NS-48 | pure `selectNotificationKey` in `packages/core`; planner volume and budget property tests | none | one week on a phone (NTC-T24) | the main consumer of F-01: every variant, both renderings, 40 and 110, zero exclamation, glossary |
| NS-49 | stand-in logic (copy, strip, delete, validate, label, no mark in export), source scans, config scan | none | everything that touches Apple's picker (F-06, F-07) | `features.photos.suggestions.*` banned words |
| NS-50 | `chooseSlip` pure function, snapshot rule logic | none | tap from note, switcher snapshot, VoiceOver reading, Reduce Motion | none (reuses keys) |

DB layer: none of the five cards adds a table, view or function in `public`, so no `grants.mjs` row and no policy test. I take the card at its word (sections 10 of each); I did not read the migrations beyond the grep above.

## 6. What cannot be proven without a phone

Needs a real iPhone (the Simulator or Maestro cannot show it, or I could not confirm that it can):
1. Apple's suggestions picker, its first-use consent sheet, the empty list, a real suggestion with several photos, a Live Photo still, an iCloud-only photo (NS-49-R7, R9, R11, R19). Simulator SDK lacks the framework (forum, UNVERIFIED).
2. Launch on iOS 17.0, 17.1 and iPad compatibility mode with the module linked (F-06).
3. The lock screen with titles and bodies: neutral and named, App lock on and off, Show Previews Never or When Unlocked, Notification Center, Apple Watch mirror, Focus summary (NS-47-R12, R13; the card itself says UNVERIFIED).
4. Delivery of a note at 09:00 local, tap to landing under 2 s on an SE 3, a tap from a delivered note into Home (NS-46-R13, NS-50-R4).
5. A zone change or flight with a pending library note: whether iOS re-evaluates a calendar trigger on a zone change was not read, UNVERIFIED; add a device row.
6. App-switcher snapshot blank (NS-47-R26, NS-50-R9), VoiceOver, Voice Control, Switch Control, AX5 with Bold Text on an SE 3, Reduce Motion fade.
7. Backup exclusion of the days store (F-17) and entitlement presence in a signed build.
8. Apple's own journal suggestion notification on iOS 26 (NS-49-R20 to R22): spike only.

Everything else can run in CI with injected clocks and zones and the synthetic fixtures below.

## 7. Fixtures (Asha only)

- Child: Asha (born 2025-04-12 per the privacy test header); a second fictional child and one fictional quiet book for R-IA-6 rows. Names from the existing Asha helpers (`apps/mobile/test/helpers/asha-export.ts`, `store-fixture.ts`; contents not read).
- Days: synthetic table only for family-bound tests (F-04): `zz-test-day-a`, `zz-test-day-b`, `zz-test-quiet`, `zz-test-about-two-authorities`, `zz-test-public` (publicTitleOk true), `zz-test-tradition`, `zz-test-country`. Real rows only in content-data tests with no child.
- Canary strings (J-N18 pattern) for tradition, country, day id, suggestion title, place and workout: synthetic words, never a real place or faith.
- Suggestion stand-in files: generated JPEG, HEIC, a Live Photo still, a symlink, an out-of-container path, a 0 byte file; no real photo of a person.
- Clocks and zones: section F-11. Seeds: `SCRIBE_FUZZ_SEED` fixed in CI for the NS-48 property tests.
- Library bundle size and 50 ms planning budget (NS-46 section 8): measured on the SE 3 through the BL-929 sheet, "ASSUMED" figures until then; no CI assertion on wall time (it would be flaky on a shared runner). Assert a count of operations or a size in bytes instead.

## 8. CI budget (10 minutes, `.github/README.md`)

The new tests are pure unit tests with no I/O, so they fit the existing `npm test` jobs (FR-QAL-19). The data tests over the whole library (R1, R12, R18) are linear in the table size (under 100 kB, card). The NS-48 365-slot property tests for each cadence are small. Not in `npm test`: binary scan, XCUITest, device rows. I cannot add CI jobs: any change is a patch under `docs/ops/proposed/` for the founder.

## 9. Good enough, leave alone

- All test titles start with `[NS-4x-Rn]` and every P0 row has one; the Trace table counts match (section 1).
- NS-46-R2 and the build failing on any `preTicked` true: a crisp, cheap test.
- NS-46-R5 contrast of a ticked day recurring against a typed day deleted after delivery: well defined.
- NS-47-R2 "picks are a filter; only ticks are stored": observable by reading the store after each path.
- NS-47-R4 with a network fake counting requests: right layer, once F-15 is fixed.
- NS-47-R9, R15, R16: reuse existing `[X4-R1]`, FR-PRV-34 scan and analytics allowlist tests.
- NS-48-R1, R2, R3, R26: pure function and budget property; the right shape. R26 is correct to make "where is the budget enforced" a precondition.
- NS-49-R10: a source scan that fails on any other `JournalingSuggestion.*` type is cheap and exact.
- NS-49-R25 and R26: negative scans on plist, permissions and EAS profiles, runnable from the Expo config.
- Each card's "Fictional" rule and the `no-real-family-data` hash guard: nothing to add.

## 10. New or changed rows, in one list (for Karma and `product`; ids are card-local, no BL id invented)

| Id | Priority | Card | Row |
|---|---|---|---|
| NS-48-R28 | P0 (a) | NS-48 (all) | Every notification key under the notification rules; drift test (F-01) |
| NS-49-R28 | P0 (c) | NS-49 | Launch on iOS 17.0, 17.1 and iPad with the module linked (F-06) |
| NS-46-R29 | P1 | NS-46 | Parametrised standing-state test listing every id it proves (F-13) |
| NS-46-R30 | P1 | NS-46 | A ticked id absent from the table is dropped silently (F-13) |
| NS-49-R29 | P1 | NS-49 | One native boundary and a labelled stand-in (F-07) |
| NS-46-R8 | change | NS-46 | Synthetic fixtures, no real tradition with Asha (F-04) |
| NS-46-R9 | change | NS-46 | State which notes are dropped at the ceiling (F-11) |
| NS-46-R12 | change | NS-46 | The oracle is a sourced table (F-10) |
| NS-46-R17 | change | NS-46 | Scope the ban list; self-test the patterns (F-03) |
| NS-46-R24 | change | NS-46 | Injected "today"; real-date check in a scheduled job (F-10) |
| NS-46-R28 | P1 to P0 | NS-46 | Remote pause, fail-open default (F-12) |
| NS-47-R4 | change | NS-47 | Lint on whole words in names, with allowlist (F-15) |
| NS-47-R5 | change | NS-47 | Pure selector plus one stand-in save (F-16) |
| NS-47-R6 | change | NS-47 | C plus D halves named (F-17) |
| NS-47-R10, R24 | P1 to P0 | NS-47 | Leaks off the phone and to a second adult (F-12) |
| NS-47-R17, R18, R25 | label | NS-47 | "P1 (b)" is inconsistent with RR-4 (F-12) |
| NS-47 section 16, NS-48-R10 | change | NS-47, NS-48 | "note" is a reserved word (F-02) |
| NS-48-R2, R18 | change | NS-48 | Name the seam; exact floor (F-18) |
| NS-48 section 9 | change | NS-48 | Reminders off versus a ticked day (F-13) |
| NS-49-R6, R25 | change | NS-49 | Binary and dependency scan, not only source (F-08) |
| NS-49-R13 | change | NS-49 | Same input, identical bytes (F-09) |
| NS-50-R11 | split | NS-50 | R11a test, R11b research gate (F-19) |
| J-N37 to J-N39 | P0 (c) | register | Lock-screen walk, one week of notes, picture and suggestions on four systems (F-14) |

## 11. Verdict per card

| Card | Verdict | Required before build |
|---|---|---|
| NS-46 Days we mark | CHANGES | F-01 (new row NS-48-R28), F-03 (R17 scope), F-04 (synthetic fixtures), F-10 (R12 oracle, R24 clock), F-11 (R9 oracle, zones), F-13 (state-space test), F-12 (R28 to P0). Acceptance is otherwise observable and testable |
| NS-47 Cultural background | CHANGES | F-01, F-02 (glossary words), F-04, F-12 (P0 for R10 and R24; fix "P1 (b)"), F-15 (lint), F-16, F-17. The device half (lock screen) is a real gate and cannot be waived (FR-QAL-23) |
| NS-48 Notification catalogue | CHANGES | F-01 (the card's main risk: its rules test does not see its strings), F-02, F-13 (reminders off), F-18. The pure function is the most testable thing in the pack |
| NS-49 Picture-first and suggestions | CHANGES | F-06 (launch safety, new P0 row), F-07 (seam), F-08, F-09. If no phone on iOS 17.0 or 17.1 exists the flag stays off; level 1 is unaffected |
| NS-50 Home today | CHANGES | F-19 (registry does not exist; pure `chooseSlip`; split R11), F-11 (zone and local day), F-05 (R8 blocked by BL-985). Small and testable once the registry exists |

None of the five is BLOCK: no row is untestable in principle, and the biggest gaps (F-01, F-06) have one-row fixes. F-01 and F-06 are P0 and must close before the first flag turns on in any build outside the founder's family (G0).

## 12. Questions for the founder, each with a default

| # | Question | Default |
|---|---|---|
| Q-QA-1 | Do you hold or can you borrow a phone on iOS 17.0 or 17.1, and an iPad? Level 2 cannot be shown safe without one (F-06) | Borrow one. If none, NS-49 level 2 stays off and G4 does not pass for it; level 1 is unaffected |
| Q-QA-2 | May `qa` use synthetic day ids in every family-bound test and keep real days only in content-data tests (F-04)? | Yes |
| Q-QA-3 | Should an out-of-date library table turn the build red on a date (the helplines pattern, `helplines.test.ts:26`), or raise an issue from a scheduled job (F-10)? | Scheduled issue in September; red build only with the due date printed |
| Q-QA-4 | When more than 60 budgeted notes are due, which are kept (F-11)? | The nearest 60 by fire date; later ones return at the next re-plan |
| Q-QA-5 | Are "P1 (b)" rows P0, or is the reason (b) wrong (F-12)? Which of NS-47-R10, R24 and NS-46-R28 are P0? | All three P0; NS-47-R17, R18, R25 P0 (b) |
| Q-QA-6 | Do the new Days and Browse screens fall under the accessibility P0 of FR-QAL-09 (F-12)? | Yes: Days ask, C-S24 to C-S26, A-S16 are in the screen set |
| Q-QA-7 | May the card change the intent words "note" to "reminder" in `culture.ask.question` and the day-name switch (F-02)? | Yes, `content` decides the final words |

## 13. Memory candidates for the main session (not saved by me)

None. Nothing in this task is a durable preference of the user.
