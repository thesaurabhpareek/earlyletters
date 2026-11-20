# Test plan for the new scope (with the quality role)

Status: CURRENT | Updated: 20 Nov 2026 | Load when: you need journeys, the device matrix, the G0 to G6 gates or the P0 register for NS-01 to NS-52.

Status: Locked v1.0, 20 Nov 2026 (council round 2). Changes after lock need a PR that lists every changed id.

For `qa` and every engineer. Each card's acceptance rows are its unit and integration tests; this file adds what sits above them: the journeys a parent takes, the order we test in, what blocks a store build, the device matrix and the P0 register. Test titles carry the requirement id in brackets, for example `[NS-09-R1]`.

**Traceability gap (must close first).** `scripts/trace.mjs` today matches only `X-REQ-nnn` and `X-NFR-nnn` ids and reads `docs/prd/v2`, so no NS or NX id is traced yet (CTO pass, 20 Nov). Draft PR #819 is to be reworked to read `docs/product/prd` and ratchet NS P0 rows. Gate G0: no NS flag turns on in any build outside the founder's family until trace sees NS ids and every P0 row has a test and a backlog row (RR-3).

## 1. Priority

| Priority | Means | Blocks |
|---|---|---|
| P0 | A promise breaks if it fails: a letter or recording lost, a word changed, a charge or paywall out of place, something leaves the phone that should not, a count or guilt line, a child's name on a lock screen | Any build to anyone outside the founder's family |
| P1 | A parent is stuck or misled, but nothing is lost | A store build |
| P2 | Rough, but works | Nothing; tracked |

## 2. Levels and who runs them

| Level | What | Where | Who |
|---|---|---|---|
| Unit | Pure rules (one per acceptance row) | CI, Node | the engineer |
| Integration | Store, sync, export, index together on fixtures (the family Asha) | CI | the engineer, `qa` reviews |
| Source checks | Rules a scan can prove: no capture start outside Home, no count in strings, no network call in Find | CI | `qa` |
| Content rules | Every new string | CI | `content` |
| Journey | One parent's whole path on a simulator | CI where possible | `qa` |
| Device | What only a phone shows: speed, VoiceOver, AX5, notifications, time zones, two phones, kill during save | The founder's phones, from one run sheet per build | the founder with `qa`'s sheet |

A test that runs against a stand-in says so in its title and the row stays "partly built" until a real run passes.

## 3. Order

1. P0 unit and source checks for each card, written before or with the code (a test that fails on the old code).
2. Integration over the Asha fixtures, including 1,000 letters and 300 pictures.
3. Journeys in section 4.
4. The device run sheet, once per build, P0 rows first.
5. Regression, in this sequence:

| When | Run |
|---|---|
| Every PR | `npm test`, `npm run typecheck`, content rules, the trace ratchet on NS P0 rows (once G0 lands); `npm run test:db` when `supabase/**` changes; `npm run test:functions` when functions change |
| Every merge to develop | The full suite plus the simulator flows; the kill harness (50 runs) when capture, store or erase changes |
| Every store candidate | Device P0 rows first; an upgrade from the last store build with a seeded 1,000-letter Asha book; an export round trip on the previous and the new schema; preflight for production flags; a privacy label and claims diff |
| Monthly | The full device plan |

Journeys that would need weeks of real time (J-N4: reminders slow then stop) run as unit tests on the planner with an injected clock, plus one device spot check that the first scheduled notes appear.

## 4. Journeys

| Id | Journey | Cards | Priority | Device |
|---|---|---|---|---|
| J-N1 | Let go of a take, kill the app midway, reopen: the take is gone and its audio is gone | NS-09 | P0 | yes (kill) |
| J-N2 | New phone: sign in, consent outstanding, reach the book; no page claims a recording is here | NS-10 | P0 | two phones |
| J-N3 | Reminder at the chosen hour, tap, land on the prompt, speak, keep; tomorrow different words | NS-13 | P1 | yes |
| J-N4 | A week of silence: reminders slow then stop; no line counts the gap | NS-13, NS-32 | P0 (guilt line) | yes |
| J-N5 | Fly across time zones: no reminder in the night | NS-13 | P1 | yes |
| J-N6 | Two books: switch on Home, speak, the letter files to the right child; a waiting draft stays with its child | NS-14 | P0 (wrong book) | no |
| J-N7 | Tell a story about last week: set the day, the Book files it there, both days shown, export has both | NS-15 | P1 | no |
| J-N8 | Birthday week: the slip appears once, save a copy to Files, it does not return; the copy equals Take the book with you | NS-11 | P1 | yes (share sheet) |
| J-N9 | Add a picture to a letter, delete the letter, restore it: the picture follows each step; export holds it | NS-01, NS-36 | P0 | yes |
| J-N10 | Find a word, open the letter, Back keeps the search; hide the letter, it is no longer found; no network call | NS-02, NS-36 | P0 (leak) | yes (airplane) |
| J-N11 | Share one letter: the text sent equals the kept words byte for byte, with nothing added | NS-05 | P0 | yes |
| J-N12 | Open a letter at the largest text size with VoiceOver: heading, list, Share, Delete in order; nothing truncated | NS-21, NS-33 | P1 | yes |
| J-N13 | 1,000 letters and 300 pictures: scroll the Book on an SE 3 with no frame over 16.7 ms | NS-37, NS-34 | P1 | yes |
| J-N14 | Seal a letter for a day; check from two time zones that it opens at the same instant | NS-06, NS-36 | P0 | two phones |
| J-N15 | Every screen with Reduce Motion: no moving loop | NS-33, NS-34 | P1 | yes |
| J-N16 | A recording in a language that is not offered: kept, no invented words, the letter says its words are waiting | NS-17 | P0 | yes |
| J-N17 | Sweep every new string: no count, fear word, gendered word or banned punctuation | all | P0 | no |
| J-N19 | Quiet a book: no reminder, no Save a copy slip and no past letter for it; unquiet brings them back | NS-13, NS-11, NS-23 | P0 (loss case) | yes |
| J-N20 | VoiceOver only: start, stop, review, undo a fix and Keep a letter with no sighted help | NS-33 | P1 | yes |
| J-N21 | Sign out with backup off: the sheet says recordings stay on this phone; after sign out every recording is still on the phone | NS-08 | P0 | yes |
| J-N22 | Past the free allowance with no Plus: reminders still arrive by the same rules and never name Plus, a price or the Keep step | NS-13 | P0 | no |
| J-N23 | An English-only build, a take spoken in another language: Review marks it in one tap, the words leave view, the audio stays, nothing is lost | NS-17 | P0 | yes |
| J-N24 | Default settings, reminders on: across a week, no notification shows {child}'s name or any letter words on the lock screen | NS-13 | P0 | yes |
| J-N25 | A plan that has lapsed: every past letter still opens, plays, is found by Find, is in Save a copy and in Read the year back; only Keep of a new letter meets the gate | NS-02, NS-11, NS-24, NS-01 | P0 | no |
| J-N26 | A child with only a due date and reminders on: no notification or prompt mentions the due date or counts days | NS-13 | P0 | no |
| J-N27 | A trial ending and a reminder due the same day: the plan notice arrives on time | NS-32 | P0 | yes |
| J-N18 | Canary text through every new path (Find query, typed day, typed name, picture text): never in logs, crash reports, URLs or notifications | NS-02, NS-16, NS-18, NS-01 | P0 | no |
| J-N28 to J-N36 | First run and account life: fresh install to first kept letter, age No, sign-in kinds, offline start, consent outstanding, second account, kill at each step, third Keep gate and plan lapse, sign out and delete. One line each is in `functions/quality.md` FR-QAL-05 (not copied here) | NS-38 to NS-45 | P0 (c) | per FR-QAL-05 |
| J-N37 (J-CUL-01) | Lock-screen walk for a chosen day: Notification Center, Notification Summary, Apple Watch mirror, CarPlay, Focus summary, Show Previews Never, App lock on and off, names switch on and off; a tapped day note lands on Home (`21` NS-47-R36, NS-46-R13). Gate: the flag does not ship on a simulator's word | NS-46, NS-47, NS-50 | P0 (a) | yes |
| J-N38 (NTC-T24) | One week of reminders on a real phone: no name on the lock screen, Sunday slower than Friday, no note mentions an absence; stat is "x of n" | NS-48 | P0 (a) | yes |
| J-N39 | Picture-first and Suggestions on iOS 17.0, 17.1 (choice absent, app launches), 17.2 and 26 (picker works, Use this keeps only the picture), iPhone app on iPad | NS-49 | P0 (c) | yes (rows in section 5) |

## 5. Device matrix

| Phone | Why |
|---|---|
| Which phones the founder holds is not recorded. Before the first run sheet, he says which he has; buying one is his decision | |
| iPhone SE (3rd generation) on the newest iOS it takes | the smallest screen and the slowest chip we support |
| A phone on iOS 17.0 or 17.1 | our lowest supported iOS (`IOS_DEPLOYMENT_TARGET = '17.0'`); the Journaling Suggestions picker needs 17.2, so this row proves the app launches with the choice absent (NS-49, `tools/review/ns46-50/qa.md` F-06). An SE 3 on the newest iOS does not cover it. Without such a phone the row is "not run" and G4 does not pass |
| A phone on iOS 17.2 | the first system with the picker; one real suggestion's file passes the validator (the Simulator SDK lacks the framework, UNVERIFIED as Apple text) |
| A phone on iOS 26 | the newest system: journal suggestion notifications of Apple's own, glass fallback by system version |
| A current large iPhone, latest iOS | the largest layout and newest system behaviour |
| A second phone on the same account | sync, new phone, seals, let it go on a second phone |
| An iPad | App Review runs the iPhone app on iPad (DEVICE_TEST_PLAN) |

**Device evidence never touches real family data (ruled 20 Nov).** Every device row runs on a separate install signed in to a test account that holds only the fictional Asha book. No run sheet, screenshot, screen recording, log, performance trace or note carries a real name, letter, picture or voice (CLAUDE.md privacy rules). The `no-real-family-data` test runs on every PR that adds device evidence. Evidence files live at `docs/qa/evidence/<date>-<build>-<phone>.md`.

Settings on every device walk: the largest accessibility text size with Bold Text, VoiceOver, Voice Control, Switch Control, Reduce Motion, Increase Contrast, Smart Invert, dark mode, Low Power Mode, airplane mode where the journey says so.

## 6. What blocks a store build

Gates, in order (these are build and release gates; D-132 in `docs/DECISIONS.md` is the separate merge delegation, two counted reviews and green CI, and does not define G0 to G6): G0 trace sees NS ids (NS-01 to NS-50, and NS-51 and NS-52 when written) and every P0 has a test and a backlog row (781 of the 1,048 P0 rows have no row-level backlog row: `BACKLOG-GAPS.md` section 1, `p0.py --gaps`); G1 the on-device data rules (ADR 0028, PR #797) and the export schema they need are merged; G2 the counsel reads each card names; G3 the founder has approved the words; G4 every P0 device row passes on the candidate, including J-N37 to J-N39 and the iOS 17.0, 17.1, 17.2 and 26 rows; G5 the privacy label and claims inventory match what the build sends; G6 no `production` flag is on while its card has an open P0, proved by a flag-off production build check (a node test over each EAS `production` profile's resolved config: `EXPO_PUBLIC_DAYS`, `EXPO_PUBLIC_SUGGESTIONS` (PROPOSED) and every card flag are off, and no photo-library usage string, PhotoKit call or journaling entitlement is present: NS-49-R15, R25, R26). Until that check exists G6 is checked by hand (`qa.md` section 3, F-13).

Every P0 unit, source and journey test green; every P0 device row run on the candidate. A P0 device row may be waived by the founder in writing only when no suitable phone was available, and never for a lost letter or recording, a leak off the phone, a name or letter words on a lock screen, or a guilt or count line; each waiver is recorded in the build record; the privacy label and claims match what the build sends off the phone; no flag on in `production` whose card has an open P0.

## 7. The P0 register

Rebuilt 20 Nov 2026 from the Priority column of every locked card (`01` to `12`): 296 P0 rows (NS-01 to NS-37, table below). Added 20 Nov, counted by `python3 -I tools/review/p0.py <repo-root>` (register mode, ids per card): card 19 NS-38 to NS-45 96 rows (8, 10, 11, 18, 13, 11, 10, 15); card 21 NS-46 to NS-50 87 rows (22, 27, 13, 21, 4); function files 514; card 27 NS-51 and NS-52 53 rows (27, 26). NS-01 to NS-50 total 481 P0 rows (was 296; 479 before K17 added NS-17-R11 and NS-17-R12), NS-01 to NS-52 total 534, with the function files 1,048 (`p0.py` reads cards 00 to 27, 20 Nov). Superseded: "296 P0 rows" as the pack total -> 479 for NS-01 to NS-50 (p0.py, 20 Nov). The tables for NS-38 to NS-50 are not copied here; the script is the register. CL/K ruling K16 (`GAP-LOG.md`): the 552 P0 figure in `functions/quality.md` is stale and is not published; the total is the one the script prints from every card and all function files, and the 27 rows whose priority cell mentions P0 without starting with it are settled by their owners first. The card is the source of truth; this register is its index. A row is P0 only if its card says so, with an RR-4 reason: (a) a promise in `03-goals-and-principles.md` section 1, (b) a legal or store duty, (c) the core loop. Every other acceptance row is P1 unless its card says P2. When a card changes a row's priority, the same PR regenerates this table (`python3` over the cards' acceptance tables, matching rows whose Priority cell starts `P0`).

| Card | P0 rows | Reasons |
|---|---|---|
| NS-01 | NS-01-R4, NS-01-R6, NS-01-R8, NS-01-R9a, NS-01-R9b, NS-01-R13a, NS-01-R13b, NS-01-R14, NS-01-R15, NS-01-R16a, NS-01-R16b, NS-01-R16c, NS-01-R17a, NS-01-R17c, NS-01-R18, NS-01-R21b, NS-01-R22, NS-01-R25, NS-01-R26, NS-01-R27, NS-01-R29, NS-01-R30, NS-01-R31, NS-01-R32, NS-01-R33, NS-01-R35, NS-01-R36, NS-01-R37a, NS-01-R38a, NS-01-R38b, NS-01-R49, NS-01-R50, NS-01-R51, NS-01-R52, NS-01-R55, NS-01-R61, NS-01-R62 | (a) (b) (c) |
| NS-02 | NS-02-R4, NS-02-R5, NS-02-R14, NS-02-R15, NS-02-R16a, NS-02-R16b, NS-02-R16c, NS-02-R16d, NS-02-R18, NS-02-R22, NS-02-R24, NS-02-R25, NS-02-R26, NS-02-R31, NS-02-R44, NS-02-R47, NS-02-R48, NS-02-R49 | (a) (b) (c) |
| NS-03 | NS-03-R1, NS-03-R2, NS-03-R3, NS-03-R4, NS-03-R5, NS-03-R7, NS-03-R8 | (a) (b) |
| NS-04 | NS-04-R2, NS-04-R4, NS-04-R5, NS-04-R6, NS-04-R7, NS-04-R8 | (a) (b) (c) |
| NS-05 | NS-05-R3a, NS-05-R3b, NS-05-R4a, NS-05-R5a, NS-05-R5b, NS-05-R6a, NS-05-R6b, NS-05-R7, NS-05-R10a, NS-05-R10b, NS-05-R12, NS-05-R16a, NS-05-R16b, NS-05-R18, NS-05-R21, NS-05-R25, NS-05-R27 | (a) |
| NS-06 | NS-06-A2a, NS-06-A4, NS-06-A5, NS-06-A13, NS-06-A15, NS-06-A17, NS-06-A22, NS-06-A25, NS-06-B1, NS-06-B1b, NS-06-B2, NS-06-B5, NS-06-B6, NS-06-B8, NS-06-B8b, NS-06-B10, NS-06-B12, NS-06-B16, NS-06-B17, NS-06-B18, NS-06-B20, NS-06-B21, NS-06-B22, NS-06-B23, NS-06-B26, NS-06-C1, NS-06-C2, NS-06-C3, NS-06-C4, NS-06-C7, NS-06-C9 | (a) (b) (c) |
| NS-07 | NS-07-C5-3, NS-07-C5-9, NS-07-C5-12, NS-07-C28-2, NS-07-C28-3, NS-07-C28-4, NS-07-C28-5, NS-07-C28-11, NS-07-C28-12, NS-07-C28-13, NS-07-C28-17, NS-07-C28-18, NS-07-G11-1a, NS-07-G11-3 | (a) (b) |
| NS-08 | NS-08-R4, NS-08-R5, NS-08-R6, NS-08-R7, NS-08-R9, NS-08-R10, NS-08-R11, NS-08-R13, NS-08-R14, NS-08-R16, NS-08-R17, NS-08-R18, NS-08-R19 | (a) (b) (c) |
| NS-09 | NS-09-R1, NS-09-R2, NS-09-R3, NS-09-R4a, NS-09-R4b, NS-09-R7, NS-09-R8, NS-09-R9, NS-09-R10, NS-09-R11, NS-09-R12, NS-09-R14, NS-09-R15 | (a) (b) |
| NS-10 | NS-10-R0, NS-10-R1, NS-10-R3, NS-10-R4a, NS-10-R4b, NS-10-R5, NS-10-R6, NS-10-R8, NS-10-R10 | (a) (b) |
| NS-11 | NS-11-R5, NS-11-R8, NS-11-R10, NS-11-R12, NS-11-R23 | (a) |
| NS-12 | NS-12-R2, NS-12-R3, NS-12-R6, NS-12-R7, NS-12-R8 | (a) (b) |
| NS-13 | NS-13-R3, NS-13-R4, NS-13-R5, NS-13-R6a, NS-13-R6b, NS-13-R10, NS-13-R11, NS-13-R12, NS-13-R13, NS-13-R14, NS-13-R15, NS-13-R18, NS-13-R19, NS-13-R23, NS-13-R24, NS-13-R27, NS-13-R30, NS-13-R31 | (a) (b) |
| NS-14 | NS-14-R3, NS-14-R4, NS-14-R8, NS-14-R11 | (b) (c) |
| NS-15 | NS-15-R4, NS-15-R11, NS-15-R16, NS-15-R18 | (a) (b) |
| NS-16 | NS-16-R3, NS-16-R4, NS-16-R5, NS-16-R6, NS-16-R9, NS-16-R15, NS-16-R16, NS-16-R18 | (a) (b) |
| NS-17 | NS-17-R1, NS-17-R2, NS-17-R3, NS-17-R4, NS-17-R5, NS-17-R6, NS-17-R7, NS-17-R8, NS-17-R10 | (a) (b) |
| NS-18 | NS-18-R3, NS-18-R6, NS-18-R8 | (a) (b) |
| NS-19 | NS-19-R1, NS-19-R4 | (a) |
| NS-21 | NS-21-R4, NS-21-R9, NS-21-R11, NS-21-R12, NS-21-R13 | (a) (b) |
| NS-22 | NS-22-R2, NS-22-R3 | (b) |
| NS-23 | NS-23-R5, NS-23-R8, NS-23-R11, NS-23-R15, NS-23-R17 | (a) |
| NS-24 | NS-24-R2, NS-24-R3, NS-24-R10 | (a) |
| NS-25 | NS-25-R1, NS-25-R2, NS-25-R3, NS-25-R4, NS-25-R6, NS-25-R7, NS-25-R10, NS-25-R12, NS-25-R14, NS-25-R15, NS-25-R16, NS-25-R17, NS-25-R19 | (a) (b) (c) |
| NS-32 | NS-32-R1, NS-32-R1b, NS-32-R4, NS-32-R4b, NS-32-R8, NS-32-R11, NS-32-R12, NS-32-R14 | (a) (b) |
| NS-33 | NS-33-R1, NS-33-R2, NS-33-R3, NS-33-R4, NS-33-R5, NS-33-R6, NS-33-R7, NS-33-R8, NS-33-R9, NS-33-R10, NS-33-R12, NS-33-R15, NS-33-R16 | (b) (c) |
| NS-34 | NS-34-R2, NS-34-R5, NS-34-R6 | (a) (c) |
| NS-35 | NS-35-R1, NS-35-R3, NS-35-R4, NS-35-R7 | (a) (c) |
| NS-36 | NS-36-R1a, NS-36-R1b, NS-36-R1c, NS-36-R1d, NS-36-R2, NS-36-R3, NS-36-R4, NS-36-R5, NS-36-R6, NS-36-R7, NS-36-R8, NS-36-R10, NS-36-R11, NS-36-R12 | (a) (b) |
| NS-37 | NS-37-R2, NS-37-R4, NS-37-R5 | (a) (b) (c) |

Cross-cutting P0 tests that every card cites: `[X4-R1]` (a second account never sees, claims or uploads the first account's local letters), `[X6-R1]` (no letter text, child name, picture or prompt donated to system intelligence), `[FRAME-SLIP]` (an unregistered Home slip fails). Every P0 row needs a test and a backlog row before its card's flag turns on in any build outside the founder's family (RR-3). Until gate G0 passes (`scripts/trace.mjs` sees NS ids), traceability of these rows is checked by hand at each candidate.

Test ids the QA review asked for, by card 21 (not repeated: see `tools/review/ns46-50/qa.md` section 4): `[NS-48-R28]` drift test (a content key family in `packages/content/src` that `rules.test.ts` does not read fails the build; today `index.ts` exports no `days`, `culture` or `ntc` family, F-01); FR-CUL rows (`functions/cultural-background-data.md`) and FR-NTC rows (`functions/notification-catalogue.md`) are traced like any FR row; the weak-link launch row for NS-49 (F-06); the quiet-book fixture shared by NS-46-R25, NS-48-R21 and NS-50-R8, blocked by BL-985 (F-05); `[FRAME-SLIP]` stays unbuilt until BL-963 (F-19). Tree test T1 and slip test T3 are research, labelled P, not tests.

## 8. Tests owed today

Device rows not yet run: S1-204 (new phone), S1-205 (Find), S1-135 (reminders), the backup drill. Speed targets: none measured. Accessibility: no device walk on record for the letter page, Me or the Book header.
