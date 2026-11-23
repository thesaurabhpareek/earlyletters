# CI queue Q1: what the macOS launch job spends its time on (NFR T-01, T-02; BRIEF CI-Q1)

Status: first measurement, read 21 Nov 2026 about 02:30 UTC with `node scripts/ci/ci-timing.mjs --runs 30 --json` (GET calls only; run ids and minutes, no log text). Public repository: Actions minutes are free, so this costs nothing. The second half of the brief (a dispatch with the timing patch) is the founder's or Karma's to run; I did not dispatch.

## What the 30 newest successful `store-profile Release launch` jobs show (minutes)

| | min | median | max |
|---|---|---|---|
| Queue wait (job created to started) | 0 | 13.0 | 87.1 |
| Run time (started to completed) | 13.2 | 22.1 | 31.3 |
| `expo prebuild --clean` step | 0.0 | 0.1 | 0.2 |
| Restore DerivedData (Release) | 0.2 | 0.5 | 0.7 |
| `pod install` | 0.5 | 0.8 | 1.1 |
| `xcodebuild` (Release) | 8.5 | 14.6 | 19.9 |
| Simulator boot plus the 20 s launch | 2.6 | 4.1 | 10.0 |

Right now: 36 `ios-compile.yml` runs queued and 3 in progress. Reproduce with the command above; the numbers move with every run.

## What it means

1. The `prebuild --clean` step itself costs about 6 seconds, so it is not the time sink. Whether it makes the restored DerivedData useless (new project files, so a near-full recompile) cannot be read from step times: it shows up inside `xcodebuild`, which is the biggest block (median 14.6 of 22.1 minutes, about two thirds of the run).
2. `xcodebuild` runs from 8.5 to 19.9 minutes. A spread that wide on the same job is what a cache that sometimes works looks like, but the data cannot say which runs had an exact hit. That is exactly what `docs/ops/proposed/workflows/ios-compile-timing.patch` adds: the restore's `cache-hit` and matched key, DerivedData size before and after, and `-showBuildTimingSummary` in the run summary, with the log kept on a manual run.
3. For a person waiting on a pull request, the queue is the larger lever today: the median wait (13 minutes) is more than half the median build, the worst wait (87 minutes) is four builds, and 36 runs are queued. Cutting build time shortens the queue as well, because a macOS slot frees sooner. Whether the limit is the account's macOS concurrency, I could not read (needs the account's plan page: [U]).
4. One sample (the newest run read) had even the ubuntu `native files changed?` job wait 9 minutes to start. One sample is not a finding; the reader can be extended to print that wait for every run if Karma wants it.

## What is still open (needs a person)

- Two dispatches with the patch applied: one after the nightly saved the exact key, one on a forced miss. Then fill the three numbers the brief asks for: seconds in prebuild (answered: about 6), xcodebuild with and without a restored exact cache, and the Pods share.
- Q2 (BRIEF CI-Q2) builds on this: Q2 (save the Release DerivedData from `launch` on develop) is worth building only if the two dispatches show a large gap between a hit and a miss.

## The way back

Nothing here runs by itself. The reader is read-only; the patch is not applied until pasted. To undo a paste, `git revert` it.
