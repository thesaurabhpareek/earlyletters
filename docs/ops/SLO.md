# Release health SLO and the day 1, 3 and 7 report (BL-439)

Owner: `ops` (the BACKLOG row's Owner is `platform`, the backlog name for the `ops` seat, `agents/roster.json` `backlog_owner_names`). Ruling: CR-169 in `docs/agents/cto/RULINGS.md`. Row: BL-439 in `docs/BACKLOG.md`. Runbook: `docs/ops/RELEASE.md` (G5 row in 1.3, sections 7.1 and 7.2). Record: `docs/release/1.0.0.md` (the row "Health report days 1, 3 and 7").

Labels: **Sourced** means the number is written in a file named beside it. **UNVERIFIED** means no file in the repo states it; the founder or the CPO sets it.

## 1. What this is

After the first store release, the release issue gets a health report on day 1, day 3 and day 7. The report compares App Store Connect numbers with the G5 thresholds below and ends in one recommendation: continue, pause, or hotfix.

Who reads what: the founder reads or exports the numbers from App Store Connect (his account). No key, password or export goes in chat or in the repo. `ops` writes the report from the numbers he gives. A blank stays blank until he supplies it; nothing is estimated (`docs/release/AUTOMATION.md` line 301: whether the API exposes crash-free rates is UNVERIFIED, so the read is manual).

Note on the name "G5": PRD gate G5 (`docs/product/prd/14-test-plan.md`, `docs/product/prd/22-final-holistic-spec.md` section 6) is the privacy label and claims check before release. The after-release health gate in `docs/ops/RELEASE.md` 1.3 is also called G5. This file is the second one. Both must hold.

## 2. Thresholds

| Measure | Threshold | Source | Status |
|---|---|---|---|
| Crash-free sessions | 99.8 percent or more | `docs/ops/RELEASE.md` 1.3 (G5 row) and 5.4 | Sourced |
| Crash-free users | 99.5 percent or more | `docs/ops/RELEASE.md` 1.3 (G5 row) | Sourced |
| Data-loss report | none | `docs/ops/RELEASE.md` 1.3 (G5 row) | Sourced |
| Open S0 | pause on any one | `docs/ops/RELEASE.md` 1.3 and 7.2 | Sourced |
| S0 definition | a letter lost or changed, data exposed, anything created after an under-18 answer, consent bypassed | `docs/qa/DEVICE_TEST_PLAN.md` line 16 | Sourced |
| Open S1 | none at the submission gate (G4); after release, any open S1 is listed and decided in the report | G4: `docs/ops/RELEASE.md` 1.3; after release: this file | Gate sourced; after-release handling UNVERIFIED |
| S1 definition | not stated in the repo; severities run S0 to S3 (TDD 07 11.3) | `docs/qa/DEVICE_TEST_PLAN.md` line 16 | UNVERIFIED |
| Early release to all (phased updates only) | G5 holds for 3 days | `docs/ops/RELEASE.md` 7.2 (marked "A: our rule") | Sourced, an assumption of ours |
| Watch window | days 1 to 7 | `docs/ops/RELEASE.md` 1.3 and the release PR template | Sourced |
| Minimum sessions or users before a rate counts | not stated; proposed 1000 sessions and 200 users | none | UNVERIFIED (proposal) |
| Hotfix trigger beyond S0 (for example a rate under threshold with no single cause) | not stated | none | UNVERIFIED |

Phased release is not available for a first release (`docs/ops/RELEASE.md` 7.1; CR-169). Version 1.0.0 goes to everyone at once, so there is nothing to pause in App Store Connect. For updates (1.0.1 and later) phased release is on and the App Store Connect pause applies (pauses can total 30 days, `docs/ops/RELEASE.md` 7.2).

Proposal (no source in the repo): the minimum-sample line is 1000 sessions and 200 users at the time of the read. UNVERIFIED, founder or CPO to confirm or change. Each rate has its own denominator: the session rate counts only when sessions meet 1000, the user rate only when users meet 200. A rate whose own minimum is met is decisive; a rate that is unread or below its minimum is skipped, and the other rate still decides. Until the founder or CPO sets the minimums, these two figures are the working proposal.

## 3. Recommendation rules

Rules marked **Proposal (no source in the repo)** are ours, not rules; the founder or CPO confirms them. Only the thresholds in section 2 and "pause on any S0" come from `docs/ops/RELEASE.md` and CR-169.

Applied in this order; the first that matches wins. The S0 rule is first because it needs no rate.

1. Any open S0: **Pause** (pause on any S0 is sourced: `docs/ops/RELEASE.md` 1.3 and 7.2). Needs no rate. Proposal (no source in the repo): a data-loss report counts the same; a hotfix (`docs/ops/RELEASE.md` 1.4, expedited review for S0 only, 7.3); the founder told the same day.
2. A rate that counts (its own minimum met, section 2) is under its threshold (sessions under 99.8 percent, or users under 99.5 percent): **Pause** for updates (`docs/ops/RELEASE.md` 7.2 states this). Proposal (no source in the repo): for 1.0.0, "pause" means stop promoting, stop inviting, turn off what a kill switch can (`docs/ops/RELEASE.md` section 9); and a hotfix if the cause is in our code.
3. **Insufficient data: keep watching, do not pause or hotfix on a rate.** Applies when rules 1 and 2 did not match and at least one rate does not count (`not read yet`, or below its own minimum). Proposal (no source in the repo). An open S1, if any, is named and owned in the report.
4. Both rates count and meet their thresholds, and an S1 is open. Proposal (no source in the repo): **Continue**, with the S1 named and an owner; the founder decides whether an S1 alone needs a hotfix.
5. Both rates count and meet their thresholds, no S0, no S1: **Continue**. Proposal (no source in the repo) as a stated outcome.

### Worked scenarios (examples, not data)

Each row follows from the rules above and the proposed minimums (1000 sessions, 200 users; UNVERIFIED, founder to confirm). Where a row does not state a figure, it is not read.

| Case | Inputs | Rule | Outcome |
|---|---|---|---|
| Day 1 | 40 sessions, 1 crash; users not read; no S0 | 3 (sessions under 1000, users unread) | Keep watching; no pause, no hotfix |
| Day 2 | S0 data-loss report; no rates read | 1 | Pause; hotfix proposed; founder told |
| Day 3 | 1500 sessions at 99.1 percent; 200 or more users; no S0 | 2 (sessions rate counts, under 99.8) | Pause (updates) or hold promotion (1.0.0); hotfix if the cause is ours |
| Day 7 | 3000 sessions at 99.9 percent; users at or above 200 and at or above 99.5 percent; no S0, no S1 | 5 | Continue |

Test failures go to their owner agent; security findings go to `security`. Hotfix steps are `docs/ops/RELEASE.md` 1.4. `ops` submits and deploys nothing: store accounts are the founder's.

## 4. Report template

Post one comment on the release issue per report. Copy the block, fill the blanks, and write `not read yet` where the founder has not supplied a value. Never put a name, entry text, transcript or child detail in a report (CLAUDE.md privacy rules); use counts and issue numbers.

```
Release health report: day <1 | 3 | 7>
Version: <x.y.z>      Build: <from docs/release/1.0.0.md>
Released to all on: <date, from App Store Connect>
Read by: <founder>    Read on: <date>
Source: App Store Connect > <screen the founder read>

1. Numbers (App Store Connect; the founder reads, no estimates)
| Measure | Threshold | Reading | Sessions or users behind it | Met? |
|---|---|---|---|---|
| Crash-free sessions | 99.8% or more | ____ | ____ | yes / no / not read |
| Crash-free users | 99.5% or more | ____ | ____ | yes / no / not read |
| Top crash cause | n/a | <symbol or issue> ____ | ____ | n/a |

2. Open severities (GitHub issues with a severity label)
| Severity | Count | Issue numbers | Owner |
|---|---|---|---|
| S0 | ____ | ____ | ____ |
| S1 | ____ | ____ | ____ |

3. Data-loss reports (support inbox and issues): ____ (count, issue numbers)

4. Changes since the last report: <new build, kill switch change, fix merged, or none>

5. Recommendation (SLO.md section 3): <Insufficient data, keep watching | Continue | Pause | Hotfix | Pause and hotfix>
   Rule that applied: <1 | 2 | 3 | 4 | 5>
   Why, in one line: ____
   Next report: day <3 | 7 | closing>
   Needs the founder: <yes, what | no>

6. Not known: <every blank above, and why>
```

### Day by day

| Report | Add to the block |
|---|---|
| Day 1 | The first read. If sessions are too few to judge, say so and write the count; do not round a rate up. |
| Day 3 | The change since day 1. For an update with phased release: G5 held for 3 days means the founder may release to all early (`docs/ops/RELEASE.md` 7.2). |
| Day 7 | Close the watch. State the final recommendation and tick "After release: G5 watch for 7 days" in the release PR template (`docs/ops/RELEASE.md`, end of the template). Link the report in `docs/release/1.0.0.md`. |

## 5. Ledger (filled after release)

| Report | Posted on | Issue comment link | Sessions | Users | S0 | S1 | Recommendation |
|---|---|---|---|---|---|---|---|
| Day 1 | ____ | ____ | ____ | ____ | ____ | ____ | ____ |
| Day 3 | ____ | ____ | ____ | ____ | ____ | ____ | ____ |
| Day 7 | ____ | ____ | ____ | ____ | ____ | ____ | ____ |

## 6. Open questions for the founder or the CPO

1. What does S1 mean, in one line?
2. Does an open S1 alone trigger a hotfix after release, yes or no?
3. Is 1000 sessions and 200 users the right minimum-sample line, or what number?
4. Is a data-loss report a pause on its own, yes or no?
5. For 1.0.0, is "stop promoting and stop inviting" the right meaning of pause, yes or no?
6. Is the day 1 read at a fixed hour, and which?
