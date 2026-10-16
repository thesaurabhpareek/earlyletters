# AL-03 Kill the app during save, and while recording

> **Drill identities first.** Follow `README.md` "Drill identities": drill child Asha, drill accounts only, never the family book. Do the drill-phone check (rule 3) in AL-03.0, before AL-03.1: a kill test on a phone with a real book puts real letters at risk.

| | |
|---|---|
| Proves | Atomic local save: every kill ends with exactly one entry whose recording matches its hash, or an intact draft with its file; nothing lost, nothing doubled (DATA-REQ-048, F04-REQ-024, F04-REQ-004, F04-REQ-009). Never waived (07 section 5.3: "kill during save 500 of 500 and 50 of 50"). Alpha plan item 9 |
| Builds | Build 1: the 10-run hand subset before Family and Friends get it (after F12). Build 2: the 50-run SE 3 subset at F25 (a family helper can run it). The 500-run Simulator gate from the freeze commit is S19's kill harness (`apps/mobile/e2e/kill/`, not built yet: see below) |
| Plan | **Plus on**: the sandbox trial from AL-09.2, or a development build with the StoreKit file (AL-09, Builds row) if the products are not in the sandbox yet; the evidence rows then say "StoreKit file". On Free the third letter kept opens the Keep sheet, so from run 3 on Save would open the sheet and no save would be killed |
| Phones and accounts | Drill phone only: Phone A (SE 3). No sign-in needed on build 1; on build 2, signed out or a drill account |
| Time | Build 1 subset (10 + 10 + 10 runs) about 45 min. Build 2: 50 kills during save (25 typed in AL-03.1, 25 spoken in AL-03.2) about 100 min and 50 kills while recording about 150 min (07 section 2.7 budget), about 4 h in all, which is more than the 2.5 h founder step F25 holds, so a helper runs it [E] |
| Needs first | The drill-phone check passed; Plus on (Plan row): check Settings > Plan says Plus is on before run 1; AL-02 done (a model on the phone helps but is not needed); the phone charged; Low Power off; a tally sheet (paper is fine) |
| Record in | the session's evidence file, rows AL-03.0 to AL-03.4, with the tallies |

How to kill by hand: swipe up from the bottom edge and hold to open the app switcher, then swipe the app's card up. Hand timing cannot hit a millisecond offset, so vary it on purpose: kill at once, after about half a second, after about one second, and so on in turn. Write the run number on the tally before each kill.

## Steps

| # | Do | Expected | Capture |
|---|---|---|---|
| AL-03.0 | The drill-phone check (`README.md` rule 3) on Phone A. Then Settings > Plan. | The phone passes, and Plan shows Plus on (Plan row). If the check fails, **stop**: no kill runs on this phone. If Plus is off, do not start: from run 3 on, Save would open the Keep sheet and no save would be killed | pass or stop; Plus on (yes or no; "StoreKit file" if so) |
| AL-03.1 | Kill during save, typed (DL-02 by hand). Type a two-word line (`Asha run 7`, with the run number), tap Save, kill. Relaunch. Repeat 10 times (build 1) or 25 times (build 2). | After every relaunch the letter is in the Book exactly once, or it is still a draft on Tonight with its text. Never missing, never twice | Tally: runs, kept as letter, kept as draft, lost (must be 0), doubled (must be 0) |
| AL-03.2 | Kill during save, spoken. Speak 10 s, Finish, on Review tap Save (or Keep my voice), kill. Relaunch. Repeat 10 times (build 1) or 25 times (build 2), varying the delay. | Every take is either a letter with its recording or a draft waiting on Tonight; each plays. Nothing lost or doubled | Tally as AL-03.1, plus "does not play" (count) |
| AL-03.3 | Kill while recording (DL-01 by hand). Speak, kill at a different point each run between about 10 s and 60 s. Relaunch. Repeat 10 times (build 1) or 50 times (build 2). | Every take is offered on Tonight after relaunch, never deleted. At least 49 of 50 play to within about 5 s of the kill point; a take that will not open is kept and listed in Settings > Recordings, never shown as ready (F08-REQ-019) | Tally: runs, kept, playable, lost (must be 0) |
| AL-03.4 | After the last run, Settings > Export your book, airplane mode. | The export finishes and its manifest check passes in the app (the app re-reads every file); the letter count matches the tallies | Letters in the export (from the export screen) |

## Pass rule

AL-03.0 passes, and lost = 0 and doubled = 0 in every row. For the alpha go (item 9) build 2 needs 50 of 50 kept for the kills during save (AL-03.1 plus AL-03.2) and 50 of 50 kept for the kills while recording (AL-03.3), plus the 500-of-500 Simulator report for each.

## Stop rule

One lost or doubled letter is S0. Stop at once, do not reinstall or export over it, note the run number and what was on screen, and file the issue. The phone stays as it is until S10 (capture) and S03 (local store) have looked.

## The 500-run Simulator gate

`docs/release/ALPHA_PLAN.md` (PR #152) asks S19 for a DL-01 and DL-02 harness on a macOS runner (`apps/mobile/e2e/kill/`), running 500 of 500 each from the freeze commit; the alpha plan holds its dates. It is **not built** in the pull request that added this sheet (#176). It needs: an e2e simulator build (TESTID_REQUESTS.md request B-1), a way to kill at a random 0 to 400 ms after Save (`xcrun simctl terminate` from the host while a Maestro flow taps Save), and a macOS runner or the founder's Mac overnight (alpha plan risk 9; workflow file by request to S20). Until it exists, alpha item 9 cannot pass.
