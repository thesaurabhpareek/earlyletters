# Test plan for the new scope (with the quality role)

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

## 5. Device matrix

| Phone | Why |
|---|---|
| Which phones the founder holds is not recorded. Before the first run sheet, he says which he has; buying one is his decision | |
| iPhone SE (3rd generation) on the newest iOS it takes | the smallest screen and the slowest chip we support |
| A phone on iOS 17 | our lowest supported iOS (an SE 3 on the newest iOS does not cover it) |
| A current large iPhone, latest iOS | the largest layout and newest system behaviour |
| A second phone on the same account | sync, new phone, seals, let it go on a second phone |
| An iPad | App Review runs the iPhone app on iPad (DEVICE_TEST_PLAN) |

**Device evidence never touches real family data (ruled 20 Nov).** Every device row runs on a separate install signed in to a test account that holds only the fictional Asha book. No run sheet, screenshot, screen recording, log, performance trace or note carries a real name, letter, picture or voice (CLAUDE.md privacy rules). The `no-real-family-data` test runs on every PR that adds device evidence. Evidence files live at `docs/qa/evidence/<date>-<build>-<phone>.md`.

Settings on every device walk: the largest accessibility text size with Bold Text, VoiceOver, Voice Control, Switch Control, Reduce Motion, Increase Contrast, Smart Invert, dark mode, Low Power Mode, airplane mode where the journey says so.

## 6. What blocks a store build

Gates, in order: G0 trace sees NS ids and every P0 has a test and a backlog row; G1 the on-device data rules (ADR 0028, PR #797) and the export schema they need are merged; G2 the counsel reads each card names; G3 the founder has approved the words; G4 every P0 device row passes on the candidate; G5 the privacy label and claims inventory match what the build sends; G6 no `production` flag is on while its card has an open P0.

Every P0 unit, source and journey test green; every P0 device row run on the candidate. A P0 device row may be waived by the founder in writing only when no suitable phone was available, and never for a lost letter or recording, a leak off the phone, a name or letter words on a lock screen, or a guilt or count line; each waiver is recorded in the build record; the privacy label and claims match what the build sends off the phone; no flag on in `production` whose card has an open P0.

## 7. The P0 register

Every acceptance row in the cards is P1 unless it is listed here. RR-4 reason: (a) a promise in `03-goals-and-principles.md` section 1, (b) a legal or store duty, (c) the core loop.

| Rows | Reason |
|---|---|
| NS-09-R1 to R4b, R7, R8 | (a) kept and let go are both promises |
| NS-10-R0, R1, R3, R4 | (a) kept; (b) consent and deletion |
| NS-08-R5, R6, R7 | (a) kept; (b) label and claims |
| NS-11-R5 | (a) no counts or fear |
| NS-13-R5, R6a, R6b, R10, R11, R12, R14, R15 | (a) no guilt, no name on the lock screen; (b) no selling in a reminder |
| NS-14-R3, R4 | (c) the letter files in the right book |
| NS-15-R4, R11 | (a) the machine never adds meaning; (b) deletion |
| NS-16-R4, the Never rows | (b) another adult's and a child's data |
| NS-17-R1, R2, R3, R5 | (a) no word the parent did not say |
| NS-21-R4, NS-33-R1 to R8 | (b) accessibility duty (LEGAL-REQ-051) |
| NS-23-R5, R8 | (a) private and sealed letters stay so |
| NS-24-R2, R3 | (a) only the parents' words; privacy |
| NS-25-R1, R2, R3, R6 | (a) private; (b) store rule 2.1(a) |
| NS-32-R1, R4 | (a) no nagging; (b) plan notices |
| NS-35-R1 | (c) one place to start |
| NS-36-R1a to R1c, R3, R5, R6 | (a) yours always, private; (b) deletion and inventory |

Every P0 row needs a test and a backlog row before its card's flag turns on in any build outside the founder's family (RR-3).

## 8. Tests owed today

Device rows not yet run: S1-204 (new phone), S1-205 (Find), S1-135 (reminders), the backup drill. Speed targets: none measured. Accessibility: no device walk on record for the letter page, Me or the Book header.
