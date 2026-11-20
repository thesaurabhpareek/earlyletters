# BRIEF CI-Q2: cut the macOS launch time and starts: queue options Q2, Q3, Q4 and Q6 (no spend); Q5 is the founder's spend

Re-open every file:line before relying on it. Cites at `origin/develop` 16e61549, 20 Nov 2026 about 18:50 UTC. Tags [V] [E] [U].

**Blocked until: BRIEF CI-Q1 has a result (it says which of Q2 or Q3 is worth building), and the founder applies each workflow patch (`ios-compile.yml` edit; two reviews; security-architect reads `.github/**`). Q5 (a larger macOS runner or a self-hosted Mac) costs money or hardware: founder only; not briefed. Q3 and Q4 weaken or move what the launch check proves: the founder accepts that, in writing, per option.** Founder-only: choosing among Q2, Q3, Q4, Q6; every paste; Q5.

```
BRIEF CI-Q2                                       Filled by: ops (RD-H3) 20 Nov 2026 18:50 UTC
Agent: ops   Lane: Pack 10   Build: none (CI speed)   Wave: 2

1. GOAL: When Q1's numbers are in, the chosen options make the median `launch` run at most 10 minutes of runner time [E, from about 22.6] without the check proving less than it does today for a JS-only change, or the report says honestly which option moved the proof.

2. CARD ROWS and TEST TITLES: NFR T-01, T-02 (#928); HARNESS-GAPS H5 (#918). Tests: a guard test `apps/mobile/test/ios-compile-workflow.test.ts` `[T-02] the launch job keeps its 20 second boot check and its Release configuration`
   (reads the YAML as data so a speed-up cannot drop the proof: asserts `-configuration Release`, the 20 s wait, the log scan). Red on a mutant: delete the `-configuration Release` argument.
   Measured proof per option: before and after minutes on three runs each, in docs/ops/ci-queue-results.md.

3. FILES
   Touch: docs/ops/proposed/workflows/ios-compile-q2.patch, -q3.patch, -q4.patch (one file per option, each applies alone), scripts/ci/ (Q6 helper, see below), apps/mobile/test/ios-compile-workflow.test.ts (new), docs/ops/ci-queue-results.md, docs/agents/checkins/ops-rd-h3-q2.md
   Never: .github/workflows/**; the `compile` (Debug) job's checks; removing the 20 s launch or the Release bundle step; branch protection.
   Shared file: BRIEF CI-PIN edits no line here (ios-compile.yml is already pinned).

4. READING PACK: Pack 10 items 1, 6; MEASUREMENT-PLAN.md section 6 (#929); the result of BRIEF CI-Q1; ios-compile.yml header (:1-30), `changes` (:288-320), `launch` (:321-510); kill-harness.yml:205-215.

5. CODE ENTRY POINTS (verified at 16e61549)
   ios-compile.yml:321-324  job `launch` on macos-26, 90 minute timeout, no `if:` (runs on dispatch too)
   ios-compile.yml:393-402  restore-only DerivedData with restore-keys; :365 prebuild --clean; :414 xcodebuild
   ios-compile.yml:306-311  the `changes` job's native filter (modules/, app.config.ts, apps/mobile/package.json, ios/, package-lock.json, ios-compile.yml): the natural trigger for Q3
   kill-harness.yml:208-214 where the Release DerivedData is saved today (nightly cron :65 and capture-path PRs)
   @expo/fingerprint 0.20.13 is in package-lock.json [V]: a native-inputs hash for Q3 without a new dependency
   ci.yml:13-15 and ios-compile.yml:46-48 already cancel older runs of the same PR

6. DATA AND SECURITY: no data class. Q3 swaps a script-built `main.jsbundle` into a cached `.app`: residual risk that it differs from the bundle Xcode's phase makes [U]; keep the existing seam check and the `launch` log scan on the swapped app.
   Cached artifacts are not secrets, but a cache written by a PR is readable only by that PR (header :20-23) so a PR cannot poison develop's cache [V per the header; GitHub docs not fetched: U]. Boundary: CI integrity (security-architect).

7. LIBRARIES: none new (`@expo/fingerprint` is already installed).
8. BUDGETS: T-01 CI path under 10 minutes; per-option targets from MEASUREMENT-PLAN 6: Q2 xcodebuild 16 to under 6 minutes [E, unproven]; Q3 22 to about 8 [E]; Q4 and Q6 cut starts, not time [E, unknown share].

9. ACCEPTANCE (in order of Rec): Q2 save the Release DerivedData from `launch` on develop (needs a `push: branches: [develop]` trigger or a scheduled dispatch, plus restore+save `actions/cache@` and no `--clean` when an exact hit exists);
   Q3 build the Release `.app` once per native fingerprint on develop, then on a PR with the same fingerprint only bundle the JS and swap it in; Q4 skip drafts: run `launch` on `ready_for_review` and on label, keep cancel-in-progress (the founder's rule stays: green on the head sha at merge);
   Q6 reuse the previous head's result when `git range-diff` is empty (a stack rebased only because its parent merged): a small `scripts/ci/same-diff.mjs` with a test `[T-02] an empty range-diff reuses the result`.
   Done also means each patch alone applies with `git apply --check` and the YAML test stays green; the results file has 3 runs before and after.

10. PR BREAKDOWN: one PR per chosen option (~80 to 140 lines each) | base develop | nothing runs until the founder pastes.

11. LENSES: A security-architect, B principal-architect.

12. ORDER: after BRIEF CI-Q1. Q2 before Q3 (Q3 builds on a saved cache). Q4 and Q6 are independent. Blocked by the founder for choice and paste.

13. DONE: [ ] `npx vitest run apps/mobile/test/ios-compile-workflow.test.ts`; [ ] `npm test` baseline; [ ] ASCII; [ ] PR body per HARNESS-RUN with `needs:founder`; [ ] journal #22; [ ] check-in.

14. ONLY A PHONE CAN PROVE: nothing on a phone; the proof is three CI runs per option. Whether a Release build swapped by script equals Xcode's bundle phase: one comparison of `main.jsbundle` hashes on a Mac [U].

15. STOP AND ASK: an option would make the launch check skip a Release build of changed JS; the cache outgrows the repository limit (GitHub's 10 GB [U]); Q3 needs `--no-clean` behaviour Expo does not support; the founder asks for Q5 (spend).

16. HARNESS: journal #22; marker `<!-- journal run:sess-20261120-ops-q2 agent:ops -->`; branch chore/ops-ci-queue-options; labels agent:ops, from:agent, needs:founder.
```
