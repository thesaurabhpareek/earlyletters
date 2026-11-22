# Journeys and device run sheets, one per store build

Owner: qa. Written 20 Nov 2026. Docs only: no phone was touched, no build was made. Tags: [V] verified (file, line or command), Rec = proposal with its basis, [U] unverified.
Sources: `14-test-plan.md` sections 2 to 6 (locked, `450bcb4a`); `17-engineering-project-plan.md` sections 3a to 3c on branch `docs/engineering-project-plan-20nov` (the build cut is the founder's call: Q1 and Q2 there); `docs/qa/DEVICE_TEST_PLAN.md`, `docs/qa/run-sheets/README.md`, `docs/qa/evidence/TEMPLATE.md`, `apps/mobile/e2e/` (kill harness and Maestro flows).
Row ids point to the four `TEST-CASE-CATALOGUE-*.md` files; the rule names (C-nn) are in `CHECKS-AND-BALANCES.md`.

## 0. How a sheet is used

- **Who runs it.** The founder, on his phones, with qa's sheet (`14-test-plan.md:26`, device level [V]). Agents cannot hold a phone. Agents write the sheet, build the simulator flows and read the evidence file the founder or a helper fills in.
- **Where the result goes.** One evidence file per session at `docs/qa/evidence/<date>-<build>-<phone>.md`, copied from `docs/qa/evidence/TEMPLATE.md` [V]. A session with two phones is one file named after phone A (template comment [V]).
- **Asha only.** Every device row runs on a separate install signed in to a test account that holds only the fictional Asha book. No run sheet, screenshot, recording, log, trace or note carries a real name, letter, picture or voice (`14-test-plan.md:90`, ruled 20 Nov [V]). The identity rules of `docs/qa/run-sheets/README.md` (drill phones only, drill accounts only, the check before the first step) apply to every sheet below [V].
- **Pass, miss, waive.** Each step records PASS, MISS or NOT RUN with the build fingerprint. A P0 row may be waived by the founder in writing only when no suitable phone was available, never for a lost letter or recording, a leak off the phone, a name or letter words on a lock screen, or a guilt or count line; every waiver goes in the build record (`14-test-plan.md:98` [V]). Needs founder confirmation: my reading that this makes the two-phone rows (NS-09-R8, NS-10-R1, R6) unwaivable, because they are loss or leak class. A MISS on a speed or accessibility number holds its feature (NS-34-R2).
- **A device pass does not replace a unit test.** The sheet proves what only a phone shows. Where a unit test is a stand-in it says `[stand-in]` (C-10).

## 1. Phones and the minimum set

| Code | Phone | Why | Needed for |
|---|---|---|---|
| A | iPhone SE (3rd generation), newest iOS it takes | smallest screen, slowest chip (`14-test-plan.md:84` [V]) | every speed, AX5, one-hand and memory row |
| B | A phone on iOS 17 | lowest supported iOS (14:85 [V]) | upgrade, VoiceOver, notifications |
| C | A current large iPhone, latest iOS | largest layout, newest system behaviour | layout, Live Photo, picker |
| D | A second phone on the same account | sync, new phone, seals, let go on a second phone | J-N2, J-N14, NS-09-R8, NS-10-R1, R6 |
| E | An iPad | App Review runs the iPhone app on iPad | launch and layout only |

Which phones the founder holds is not recorded (`14-test-plan.md:83` [V]). He says which he has before the first sheet; buying one is his decision. Rec, the smallest set that still covers every P0 device row: A plus D (any two phones, one of them the smallest he owns). With fewer than two phones the two-phone rows cannot run and, being a leak or loss class, cannot be waived: they hold the build (the founder confirms this reading).

Settings to walk on every phone that has them (`14-test-plan.md:92` [V]): largest accessibility text size with Bold Text, VoiceOver, Voice Control, Switch Control, Reduce Motion, Increase Contrast, Smart Invert, dark mode, Low Power Mode, airplane mode where a step says so.

## 2. Sheet S-0: setup, once per build and phone (15 minutes [E])

| Step | Do | Expect |
|---|---|---|
| 0.1 | Check the phone is a drill phone: Settings, Account says signed out or a drill account; the Book lists only Asha (run-sheets README, check 3 [V]) | If not: stop |
| 0.2 | Install the build (TestFlight or EAS), note marketing version, build number and commit from Settings, About | Both in the evidence header |
| 0.3 | Sign in as drill account A on phone A (and B on phone D only where a step says so) | Asha book present, no real family detail |
| 0.4 | Seed the Asha fixture: 5 letters for the new-phone rows; for performance rows the seeded 1,000-letter, 300-picture book (the helper is `apps/mobile/test/helpers/store-fixture.ts` for tests; the on-phone seed route is not written: GAP, below) | Counts match the sheet's header |
| 0.5 | Read the build's flags from the preflight output (`apps/mobile/scripts/preflight-testflight.mjs`, `preflight-production.mjs` [V]) and write them in the evidence header | A flag on in `production` with an open P0 on its card stops the run (G6) |

GAP S0-1: no documented way to seed 1,000 Asha letters and 300 pictures on a phone. Rec: a development-only seed route behind `EXPO_PUBLIC_E2E=1` (the e2e seam file `src/dev/e2e-seams.ts` is the existing pattern [V, kill harness header]), written by `mobile`, never compiled into `testflight` or `production`; B-8 of that harness already requires no seam string in those bundles [V, `ci/kill-harness.yml.example`].

## 3. Sheet S-13: the Build 13 cut (keeping and the floor)

Rows from the plan's Q1 default: BL-922 (NS-10-R0), BL-925 and BL-926 (NS-09-R4a, R4b), BL-928 (NS-33-R1, R2, R4), BL-961 (NS-10-R3), P-4a (NS-09-R6, not built) and BL-966's NS-32-R12 test; BL-967 and P-9 have merged, so the reminder rows below are regression checks [V, `17-engineering-project-plan.md:284`, D9, refreshed to 458fae46]. Whether these hold the cut is the founder's decision (Q1); this sheet covers them either way. Phones: A, D, and B if he has it.

| Step | Journey and rows | Phone, settings | Steps | Expected | Run by |
|---|---|---|---|---|---|
| 3.1 | J-N1; NS-09-R1, R2, R3, R9 | A; airplane mode off | Record 20 s of Asha speech (scripted line, read by an adult). On Review choose Let it go and confirm. Kill the app from the switcher at once. Reopen twice | Confirmation defaults to keep and says the take cannot be brought back; after relaunch the take is gone from Home and Where your letters live; the recorder folder holds none of it (inspect via `apps/mobile/e2e/bin/inspect-container.sh` [V, file listing]) | founder; qa reads the container output |
| 3.2 | NS-09-R4a, R4b | A; VoiceOver on | Force a failed delete with the e2e seam (development build only), then Let it go | The not-gone line shows once for that take; VoiceOver announces it after the screen settles | founder on an e2e build |
| 3.3 | NS-09-R8 | A and D, same account | Let go a held synced take on A; open D after sync; relaunch D | D holds neither the row nor the audio | founder; stand-in unit test also exists |
| 3.4 | J-N2; NS-10-R1, R0, R6 (S1-204) | D new phone, A has 5 letters | Sign in on D with consent outstanding; wait up to 10 s | The consent sheet or held screen within 10 s; never the child step; after consent every letter's words show; no page says a recording is on this phone; restore plus sign-in shows each letter once | founder |
| 3.5 | NS-10-R3, R5 | A signed in as account A; D or A signs in as B | Sign out A, sign in B on the same phone | B sees none of A's letters, recordings or child name; no claim screen offers A's letters | founder |
| 3.6 | J-N21; NS-08-R6 | A; backup off | Settings, sign out | The sheet says recordings stay on this phone; after sign-out every recording still plays | founder |
| 3.7 | NS-33-R4, R7 | A; AX5 plus Bold Text | Home, Listen Ready, Review, Book, letter page | No control under 44 pt; no text cut; Speak reachable without scrolling | founder; photos in evidence (Asha only) |
| 3.8 | NS-33-R5 | A; Reduce Motion on | Walk every screen 30 s each, screen record | No moving loop | founder |
| 3.9 | J-N20; NS-33-R6 | A; VoiceOver only, eyes off | Start, stop, review, undo a small fix, Keep | Done without sighted help; start and stop announced within 1 s | founder |
| 3.10 | NS-33-R9, R10 | A; Voice Control, then Switch Control | Say every visible label on the five screens; scan with Switch Control | Every control responds | founder |
| 3.11 | J-N24, J-N4, J-N22, J-N26; NS-13 never-list rows | A; reminders on, default settings, over a week | Collect every notification the phone shows; lock the phone each time | No child name, no letter words, no count of days, no due date, no Plus, price or Keep step; no body repeats twice running | founder collects, qa reads |
| 3.11b | NS-09-R6 (P1, P-4a not built) | A | Fail a delete on 3 launches (e2e seam), open Where your letters live | A stuck line and Remove now; K3: the card says Storage, the built screen differs, product rules | founder after P-4a lands |
| 3.12 | J-N17 (CI, not a phone) | CI | `npm test -w packages/content` and the string sweep | No count, fear word, gendered word or banned punctuation | CI |
| 3.13 | Kill harness (50 runs) when capture, store or erase changed | Mac with Xcode, e2e simulator build | `node apps/mobile/e2e/kill/run-kill-harness.mjs --mode dl02 --udid <UDID> --app <App.app> --runs 50` [V, header] | Exit 0 (every run kept its letter or take exactly once; self-check caught every plant) | founder, on his Mac (agents cannot) |

## 4. Sheet S-14: the Build 14 candidate (photo, Find, Share, reminders, letter page)

Rec: photo and Find merge dark and Build 14 turns them on after the counsel read (17:282, D7 [V], plan refreshed to 458fae46). Phones: A, C, D, B.

| Step | Journey and rows | Phone, settings | Steps | Expected | Run by |
|---|---|---|---|---|---|
| 4.1 | J-N9; NS-01-R4, R16a to R16c, R36, R52; NS-36-R1a to R1c | C | Add a picture to a letter, delete the letter, restore it, delete again and wait past the window with the e2e clock seam | The picture follows each step; after purge no file remains in `Library/Application Support/photos/` or `Caches/` (inspect-container) ; export holds it | founder; qa reads container |
| 4.2 | NS-01-R2, R22, R17c | C | Tap the photo start; pick a Live Photo | The system picker opens with no permission question; only the still is kept | founder |
| 4.3 | NS-01-R17b, R46 | C; slow network then airplane | Pick an iCloud-only picture; cancel; again offline | Progress shows, Cancel ends the wait at once; offline gives one calm line and the capture continues | founder |
| 4.4 | NS-01-R13a, R13b | C; App lock on | Show a picture, go to the app switcher; cold open | The switcher snapshot shows an opaque box; no picture draws before unlock | founder (photo of the switcher with Asha only) |
| 4.5 | NS-01-R39, R20c | A; AX3 and AX5 | Listen Ready with a picture; the letter page | Thumbnail at most 88 pt; Speak, Type, Change on screen; one column at AX5 | founder |
| 4.6 | J-N10; NS-02-R2, R12, R22, R35, R36 (S1-205) | A; seeded 1,000 letters, airplane mode | Type 3 characters, open a result, go Back; hide the letter | First row within 300 ms p95 over 20 runs of 20 queries; Back keeps the query; the hidden letter is no longer found; no network call | founder; numbers from the e2e timing seam |
| 4.7 | NS-02-R20, NS-37-R6 | A; Instruments memory | 1,200 letters, 300 pictures, one search | Peak memory within 50 MB of baseline; Book under 150 MB | qa on the founder's Mac |
| 4.8 | J-N13; NS-37-R1, R7 | A; seeded book | Scroll the Book for 30 s with Instruments Animation Hitches | No frame over 16.7 ms | founder with qa |
| 4.9 | J-N11; NS-05 rows | C; Messages and Mail | Share one letter with and without the picture | The text equals the kept words in the fixed wrapper, nothing added; no audio; the picture, if sent, is `letter-photo.jpg` with no metadata; `tmp/share` empty after | founder |
| 4.10 | J-N8; NS-11-R23 | C | Save a copy to Files in birthday week | The slip appears once and does not return; the copy equals Take the book with you | founder |
| 4.11 | J-N3, J-N5; NS-13-R1, R7, R9, R16 | B; set an hour; change time zone; revoke permission | Wait for the hour; fly across zones (set zone manually); revoke in iOS Settings | One reminder within 5 minutes; none between 21:30 and 07:00 local; tap lands on Home within 2 s; revoked schedules nothing | founder |
| 4.12 | J-N12, J-N15; NS-21-R5, R8, NS-33-R3 | A; AX5 plus Bold; VoiceOver | Open a letter | Heading, list, Share, Delete in order; rows at least 56 pt; page interactive within 300 ms p95 (card number is PROPOSED) | founder |
| 4.13 | J-N6; NS-14 rows | A | Two books: switch on Home, speak, keep | The letter files to the chosen book; a waiting draft stays with its child | CI flow, device spot check |
| 4.14 | J-N19; NS-13-R12, NS-11-R8, NS-23-R8 | A | Quiet a book | No reminder, no slip, no past letter for it; unquiet brings them back | founder |
| 4.15 | J-N25; NS-02-R47, NS-24-R10, NS-11-R12 | A | Use the e2e plan seam to lapse the plan | Every past letter opens, plays, is found, is in Save a copy; only Keep of a new letter meets the gate | founder |
| 4.16 | J-N18 (CI) | CI | Canary text through the Find query, typed day, typed name and picture words | Not in logs, crash reports, URLs, notifications | CI |
| 4.17 | NS-23-R11 | A; App lock on | Background the app on Home with a past-letter card | The switcher snapshot of Home shows no letter fragment | founder |
| 4.18 | NS-22-R2 | A; AX5 | Book header | Header controls 44 pt or more, fixed order | founder |
| 4.19 | Upgrade and export round trip (store candidate list, `14-test-plan.md:42` [V]) | A; Build 13 installed with the seeded 1,000-letter Asha book | Install the candidate over it; export on the old and new schema | Every letter, recording and picture present; migration 10 to 11 changed no row | founder; qa reads the export with `apps/mobile/e2e/bin/inspect-export.sh` [V] |

## 5. Sheet S-15 and later: seals, Firsts, hands-free, reading back

Rec: Build 15 carries Firsts and seals (17:489 [V]). Rows are written ahead so the sheet is not new work later.

| Step | Journey and rows | Phone, settings | Steps | Expected | Run by |
|---|---|---|---|---|---|
| 5.1 | J-N14; NS-36-R3, NS-06-B1b | A and D, set to different zones (UTC-8 and UTC+14) | Seal a letter for a day; check both phones at the instant | It opens at the same instant on both; a zone change moves nothing | founder |
| 5.2 | NS-06-B8, B8b, B16 | A (author), D (other member) | Set D's clock forward; pull before and after the instant | D receives nothing before; the letter once after; clock change does not open it | founder |
| 5.3 | J-N16, J-N23; NS-17-R5, R7 | A; English-only build | Record in a language that is not offered | The letter is kept, no invented words; one tap marks it; the words leave view; the audio stays | founder with a speaker of the language |
| 5.4 | NS-04-R7 | A, spike build only | 200 trigger fires | 0 recordings start without the tap on Ready | founder; spike bundle id only |
| 5.5 | NS-06-C9 | A, spike build | Call, Siri, alarm during a doorway take | The take is held, not lost | founder |
| 5.6 | J-N27; NS-32-R4 | A | A trial ending and a reminder due the same day (e2e clock seam) | The plan notice arrives on time | founder |
| 5.7 | NS-08-R6 flip-build rows | A, D | Only if the founder flips backup | Rows in catalogue D marked flip build | founder |

## 6. Journey index J-N1 to J-N27 (from `14-test-plan.md:51-77` [V])

| Id | Priority | Sheet step | CI part today |
|---|---|---|---|
| J-N1 | P0 | 3.1 | kill harness dl02 (3.13) |
| J-N2 | P0 | 3.4 | none (two phones) |
| J-N3 | P1 | 4.11 | planner unit tests with an injected clock |
| J-N4 | P0 | 3.11 | NS-13-R18 unit with an injected clock |
| J-N5 | P1 | 4.11 | planner unit |
| J-N6 | P0 | 4.13 | e2e-web flow (to write) |
| J-N7 | P1 | none yet | integration (day set, both days shown, export has both): GAP, no sheet step needed |
| J-N8 | P1 | 4.10 | none |
| J-N9 | P0 | 4.1 | store tests NS-36-R1a to R1c |
| J-N10 | P0 | 4.6 | find tests; airplane step on the phone |
| J-N11 | P0 | 4.9 | NS-05-R4a 20 fixtures |
| J-N12 | P1 | 4.12 | a11y unit tests |
| J-N13 | P1 | 4.8 | none |
| J-N14 | P0 | 5.1 | NS-06-B1b with a clock and zone injected |
| J-N15 | P1 | 3.8 | Reduce Motion unit tests |
| J-N16 | P0 | 5.3 | NS-17 unit and gate evidence |
| J-N17 | P0 | 3.12 | content rules (CI) |
| J-N18 | P0 | 4.16 | canary tests (CI) |
| J-N19 | P0 | 4.14 | NS-13-R12, NS-23-R8 unit |
| J-N20 | P1 | 3.9 | none |
| J-N21 | P0 | 3.6 | `ns08-sign-out-keeps-recordings.test.ts` [V] |
| J-N22 | P0 | 3.11 | NS-13-R11 unit |
| J-N23 | P0 | 5.3 | NS-17-R5 unit |
| J-N24 | P0 | 3.11 | `reminders-never-list.test.ts` [V] |
| J-N25 | P0 | 4.15 | NS-02-R47 and others |
| J-N26 | P0 | 3.11 | NS-13-R10 unit |
| J-N27 | P0 | 5.6 | NS-32-R4 unit |

Journeys whose real time is weeks (J-N4) run as unit tests on the planner with an injected clock, plus a device spot check that the first scheduled notes appear (`14-test-plan.md:45` [V]).

## 7. Simulator flows that already exist, and how they relate

- `apps/mobile/e2e-web/` holds 24 flow files named `j01` to `j22` (`j03` has four) (first run, under 18, children, Tonight, voice capture, review, typed, quiet day, book, letter, read together, Plus, reminders, recordings, export, settings, family, dark mode, errors, crash, co-parent, sign in) [V, file listing]. These are an older numbering. They are not the `J-N` journeys; keep both names visible in titles to avoid confusion (Rec).
- `apps/mobile/e2e/flows/` holds Maestro flows `E2E-01` to `E2E-17` [V, file listing]; E2E-15 is the AX5 smoke with screenshots for a human look, the VoiceOver walk stays manual (`e2e/README.md` row E2E-15 [V]). The P0 nightly set is E2E-01, 03, 12, 13, 17 (README "The P0 nightly set" [V]).
- Rec: each new P0 journey gets a flow only when a simulator can show it (J-N6, J-N7, J-N9 without the picker). A flow that needs the system picker or share sheet stays a phone step.

## 8. Gaps and what the founder must supply

| Id | Gap | Rec default | Owner |
|---|---|---|---|
| S0-1 | No on-phone seed of 1,000 letters and 300 pictures | Development-only seed route behind `EXPO_PUBLIC_E2E` | `mobile` |
| S0-2 | Which phones the founder holds | He says before the first sheet | founder |
| S0-3 | No XCUITest accessibility audit harness (NS-33-R16) | Accessibility Inspector by hand per candidate, recorded as `[stand-in]` | `qa`, `design-systems` |
| S0-4 | Two-phone rows need two phones and two drill Apple accounts | Use drill accounts A and B of the run-sheets README | founder |
| S0-5 | A second language speaker for J-N16 and J-N23 | The founder or a family member reads an Asha script in the language | founder |
| S0-6 | Time-zone steps need a way to move the clock | Settings, General, Date and Time manually; for seals the e2e clock seam | `mobile` |
| S0-7 | The kill harness needs a Mac with Xcode and the e2e build wiring line (`RA-20-18`) | Wiring line is present: `useE2eSeams()` at `apps/mobile/src/app/_layout.tsx:153`, import at :44 [V]. The founder runs it on his Mac | founder |

## 9. Samples checked for this file

Cites sampled: 24 (the 14-test-plan and plan-17 line cites by script, the rest by file listing); held 24. Not verified: any device behaviour (no phone available), whether `inspect-container.sh` runs on the current build, the exact on-phone location of `Library/Application Support/photos/` in a release build [U], and the run-sheets README rules beyond its first 30 lines.
