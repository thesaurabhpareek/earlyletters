# BRIEF CI-Q1: measure the macOS launch job first (queue option Q1; no spend)

Re-open every file:line before relying on it. Cites at `origin/develop` 16e61549, 20 Nov 2026 about 18:50 UTC. Tags [V] [E] [U].

**Blocked until: the founder (or a session allowed to dispatch) runs the workflow once and, for the full timing summary, pastes a small patch to `ios-compile.yml` (workflow edit). Public repository: Actions minutes are free [V release-ios.yml header]; no spend. Option without any edit: run the same `xcodebuild` on the founder's Mac with `-showBuildTimingSummary` (BRIEF steps below).** Founder-only: the dispatch click or the Mac run, the paste. Q5 (a second runner pool) is spend and is not in this brief.

```
BRIEF CI-Q1                                       Filled by: ops (RD-H3) 20 Nov 2026 18:50 UTC
Agent: ops   Lane: Pack 10   Build: none (CI speed)   Wave: 1

1. GOAL: When one `store-profile Release launch` run has been measured, a short report says whether the 16 to 17 minutes of `xcodebuild` come from `expo prebuild --clean` defeating the restored DerivedData, from a cache restored by prefix, or from compiling Pods and the app target, with numbers.

2. CARD ROWS and TEST TITLES: NFR T-01, T-02 (CI time rows, NFR-BUDGETS.md #928); no card row. Tests: none (a measurement). Proof: `docs/ops/ci-queue-q1-measurement.md` with run ids and per-step minutes.
   Baseline today [V, gh api, 20 Nov]: 14 successful runs of `launch`: run 13.6 to 31.1 min, median 22.6; queue wait 0 to 155.4 min, median 37.5; xcodebuild 15.7 to 17.1 min of 26 (runs 44776672118, 44754043961); DerivedData restored by prefix (restore-keys), not exact key.

3. FILES
   Touch: docs/ops/ci-queue-q1-measurement.md (new), docs/ops/proposed/workflows/ios-compile-timing.patch (new), scripts/ops/ci-timing.mjs (new, read-only reader of `gh api`; H10 in MEASUREMENT-PLAN) with scripts/ops/ci-timing.test.mjs,
          docs/agents/checkins/ops-rd-h3-q1.md
   Never: .github/workflows/**; any build on a paid runner; scripts/agents/**.

4. READING PACK: Pack 10 items 1, 6; MEASUREMENT-PLAN.md section 6 (#929); HARNESS-GAPS.md H5 (#918); ios-compile.yml lines 323-324 (macos-26, 90-minute timeout), 363-365 (`expo prebuild ... --clean`), 393-424 (restore and xcodebuild).

5. CODE ENTRY POINTS (verified at 16e61549)
   .github/workflows/ios-compile.yml:41 `workflow_dispatch` (no inputs); :35-40 PR paths: apps/mobile/**, packages/**, package-lock.json
   .github/workflows/ios-compile.yml:365  `npx expo prebuild --platform ios --no-install --clean` in the Release job
   .github/workflows/ios-compile.yml:395-402  restore-only of DerivedData; key hashes package-lock.json, app.config.ts, modules/**; restore-keys prefix
   .github/workflows/ios-compile.yml:414  the xcodebuild command; log to $RUNNER_TEMP/xcodebuild-release.log, uploaded only `if: failure()` (:496-504)
   .github/workflows/kill-harness.yml:208-214 the step that SAVES the same key: `actions/cache@` (restore plus post-job save), on schedule (cron :65) and PRs touching capture paths. NOTE: MEASUREMENT-PLAN.md cites :264 for this; :264 saves the kill app, not DerivedData [V]. Correct it when #929 is next pushed. The workflow's own header (ios-compile.yml:20-23) says a dispatch on develop seeds the DEBUG caches pull requests read; the Release restore at :393-400 is restore-only, so a dispatch does not seed it.

6. DATA AND SECURITY: no data class. Logs hold compiler output and paths, no content. `contents: read`. Boundary: none new. The patch adds no secret and no permission.

7. LIBRARIES: none.
8. BUDGETS: T-01 PR CI path under 10 minutes (ci.yml:1-5); the macOS launch is not a required check (branch protection requires `required`, `applied migrations unchanged`, `compliance-fence` [V gh api]).

9. ACCEPTANCE: the patch adds to the Release `xcodebuild`: `-showBuildTimingSummary`; before and after `du -sh "$RUNNER_TEMP/DerivedData"`; a step that prints whether the restore was an exact hit (`steps.<id>.outputs.cache-hit`); upload of the log `if: always()` on dispatch runs only.
   The report answers three questions with one number each: seconds in `prebuild`, seconds in xcodebuild with and without a restored cache (two dispatches: one after the nightly saved the exact key, one on a forced miss), and the Pods share of compile time.
   Done also means the reader script prints the same medians as above from `gh api` (test with a recorded JSON fixture).

10. PR BREAKDOWN: PR 1 reader script + test ~110 lines, 2 files; PR 2 patch + report template ~80 lines, 3 files | base develop | nothing runs until the founder pastes the patch.

11. LENSES: A security-architect (workflow patch), B principal-architect.

12. ORDER: first of the queue briefs; before BRIEF CI-Q2, whose choices follow its result. Blocked by the founder for one dispatch (or one Mac run).

13. DONE: [ ] `node --test scripts/ops/ci-timing.test.mjs`; [ ] ASCII; [ ] PR body per HARNESS-RUN with `needs:founder`; [ ] journal #22; [ ] check-in.

14. ONLY THE FOUNDER CAN PROVE: the dispatch result (agents may not be allowed to dispatch: [U]); a Mac run needs his Mac and Xcode 26.6 (the image's Xcode, `XCODE_VERSION` in the workflow).

15. STOP AND ASK: the run needs a paid runner; the measurement needs a secret; results contradict MEASUREMENT-PLAN section 6 (say so, do not hide).

16. HARNESS: journal #22; marker `<!-- journal run:sess-20261120-ops-q1 agent:ops -->`; branch chore/ops-ci-queue-q1-measure; labels agent:ops, from:agent, needs:founder.
```
