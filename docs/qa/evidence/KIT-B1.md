# Build 1 device kit: one sitting on the drill iPhone SE (3rd generation)

Owner: QA. Requirement: HV2-014 (EG-8, EG-9). Design: `docs/agents/harness-v2/EVIDENCE-AND-GREEN.md` section 6. About 3 hours [E], one person, one phone, one evidence file.

This kit orders the sitting. It does not copy the steps: every row below cites a run-sheet or DEVICE_TEST_PLAN id, and the steps, expected results and the numbers each row must carry live there. If a sheet changes, the kit follows the id.

## Before you start

- The phone is the drill SE 3 only. Never the family phone (`docs/qa/run-sheets/README.md` "Drill identities" rule 3). If the check in AL-01.0 fails, this is not a drill phone: stop, change nothing on it, and tell the founder.
- Build 1 is the `testflight` profile with servers off. Sign-in, sync, backup and co-parent drills (AL-04, AL-05, AL-06) are build 2 and are not in this sitting.
- Copy `docs/qa/evidence/TEMPLATE.md` to `docs/qa/evidence/<YYYY-MM-DD>-<x.y.z(n)>-se3.md`. Fill Session, Phones and the "Before the first step" boxes first. Phone B and Phone C rows: delete them.
- Screen recordings and screenshots stay in your own storage. Only their file names go in the file.
- Only the fictional family (Asha, Avi, Mama, Papa) appears anywhere in the file. Tester is initials.
- Keep a watch or the phone's stopwatch handy: many rows need seconds.

## The order

| Step | What | Rows to fill (one row each) | Time [E] | Capture |
|---|---|---|---|---|
| 1 | Smoke: installs, launches, Settings > About shows the build number | `TF-04` (DEVICE_TEST_PLAN "TF-04 Smoke list"; one row for the list, with the items you ran) | 10 min | Screenshot of About |
| 2 | First run | `AL-01.0` to `AL-01.12` (`run-sheets/AL-01-first-run.md`) | 40 min | Screen recording from the 18+ gate to the first saved letter; screenshots of the gate |
| 3 | Record offline | `AL-02.0` to `AL-02.12` (`run-sheets/AL-02-record-offline.md`) | 45 min | Screenshot of the saved letter; App Privacy Report after AL-02 (domains only) |
| 4 | Kill during save, 10-run hand subset | `AL-03.0` to `AL-03.4` (`run-sheets/AL-03-kill-during-save.md`) | 45 min | One screen recording per ten kills |
| 5 | Server switch, part A only | `AL-08.0` to `AL-08.3` (`run-sheets/AL-08-server-kill-switch.md`) | 15 min | The App Privacy Report domain list |
| 6 | Account deletion screens | `AL-07.1` to `AL-07.3` only if Settings shows a Delete account row; otherwise `n/a` with the flag value (`EXPO_PUBLIC_ACCOUNT_DELETION`) as the reason | 10 min | Screenshot of Settings |
| 7 | VoiceOver and display | `S1-23` (VoiceOver walk at AX5, script V-01 to V-10) and `S1-24` (AX5, dark, Low Power, network check) in DEVICE_TEST_PLAN | 30 min | Screenshot names only |

Rows that need the server on (for example a build 1 phone cannot sign in) are `n/a` with the reason "build 1, servers off", or `blocked` with the reason "switch off". Never `fail`.

## The kill tally

AL-03 is a hand subset of 10 runs. After step 4, write one line in the Results section, under the table:

`Kill tally: runs 10, lost 0, doubled 0`

Use the real counts. A run where a letter or recording is lost, doubled or damaged is not a retry: it is an S0 (see Stop below).

## How the sitting ends: pass, fail or stop

The last line of the Sign-off section is `Verdict: pass`, `Verdict: fail` or `Verdict: stop`. Run the checker; it works the verdict out from your rows and refuses the file if your line disagrees.

```bash
node scripts/qa/evidence-check.mjs "docs/qa/evidence/<your file>.md"
```

- **pass**: every row is pass, or n/a with a reason; the kill tally shows lost 0 and doubled 0; no S0 in "Issues filed".
- **fail**: any row is fail. Commit the file anyway; a failure is evidence. Open one `device-fail` issue per failed row, write the issue number in the row's Issue column, and run that row again on the next build in a new file.
- **stop**: any S0 (a letter or recording lost or changed, data seen by the wrong person, anything made after an under-18 answer, a consent skipped). Stop the sitting. Keep the phone as it is for diagnosis and file the issue first. Rows you did not reach are `not run`; the checker allows that only under a stop verdict.

## What the checker refuses

- A required row missing, or a row with an empty Result.
- Result words other than pass, fail, stop, blocked, n/a, not run (so "pass or stop" left from the template is refused).
- pass or fail with an empty Numbers cell; n/a or blocked with no reason; fail with no Issue.
- Email addresses, links, tokens, long hex or base64 strings, user ids, and a person's name that is not Asha, Avi, Mama or Papa, anywhere in the file.
- A Verdict line that is missing or does not match the rows.

It does not judge whether your numbers are right. The S19 reviewer does that in the sign-off.

## What this sitting does not prove

Other iPhones or iOS versions, speech accuracy, StoreKit or money, sign-in, sync, backup, upgrades, 500-run kill robustness, Android, or that this is the build that ships.
