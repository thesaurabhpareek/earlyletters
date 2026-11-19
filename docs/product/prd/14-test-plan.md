# Test plan for the new scope (with the quality role, 19 Nov 2026)

For `qa` and every engineer. Each card's acceptance rows are its unit and integration tests; this file adds what sits above them: the journeys a parent takes, the order we test in, what blocks a store build, and the device matrix. Test titles carry the requirement id in brackets so `scripts/trace.mjs` can find them.

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
5. Regression: the full suite on every change; the device P0 rows on every store candidate.

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
| J-N18 | Canary text through every new path (Find query, typed day, typed name, picture text): never in logs, crash reports, URLs or notifications | NS-02, NS-16, NS-18, NS-01 | P0 | no |

## 5. Device matrix

| Phone | Why |
|---|---|
| iPhone SE (3rd generation), iOS 17 | the smallest screen, the slowest chip we support, our lowest iOS |
| A current large iPhone, latest iOS | the largest layout and newest system behaviour |
| A second phone on the same account | sync, new phone, seals |

Settings on every device walk: the largest accessibility text size with Bold Text, VoiceOver, Reduce Motion, Increase Contrast, dark mode, airplane mode where the journey says so.

## 6. What blocks a store build

Every P0 unit, source and journey test green; every P0 device row run on the candidate or accepted in writing by the founder row by row; the privacy label and claims match what the build sends off the phone; no flag on in `production` whose card has an open P0.

## 7. Tests owed today

Device rows not yet run: S1-204 (new phone), S1-205 (Find), S1-135 (reminders), the backup drill. Speed targets: none measured. Accessibility: no device walk on record for the letter page, Me or the Book header.
