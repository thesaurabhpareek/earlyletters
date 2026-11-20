# BRIEF CI-COV: the coverage job (G9): refresh the 16 Oct floors, pin the proposal, make it blocking after a green week

Re-open every file:line before relying on it. Cites at `origin/develop` 16e61549, 20 Nov 2026 about 18:50 UTC. Tags [V] [E] [U].

**Blocked until: the founder pastes the job into `ci.yml` (workflow edit; two reviews). The proposal exists (`docs/ops/proposed/coverage-ci.md`, 16 Oct); it is five weeks old, uses unpinned `actions/checkout@v4`, `actions/upload-artifact@v4` and `ubuntu-latest`, and its floors predate the new-scope code.** Founder-only: the paste, making `coverage` a needed job of `required` after a week green.

```
BRIEF CI-COV                                      Filled by: ops (RD-H3) 20 Nov 2026 18:50 UTC
Agent: ops   Lane: Pack 10   Build: any   Wave: 2

1. GOAL: When a pull request lowers any workspace's coverage below its floor, the `coverage` job fails and the run page shows one merged table; coverage never stands in for a trace row.

2. CARD ROWS and TEST TITLES: docs/qa/COVERAGE.md (numbers of 16 Oct on d1b23ce [V]; follow-ups BL-441, BL-442, BL-443), gate G9 (CODE-QUALITY-GATES.md G9, #930). No NS row.
   Tests: scripts/coverage has no test file [V ls of scripts/coverage: preset.ts, report.mjs, run.mjs]; add apps/mobile/test/coverage-preset.test.ts `[G9] every workspace floor is a whole number and no floor is above its measured value`
   (reads preset.ts and the committed measured numbers in `docs/ops/coverage-measured.json`: one number per workspace and the Actions run id that produced it. SOURCE AND ORDER: no agent can produce these (the sandbox cannot run the instrumented suite, and the coverage job does not run until the founder pastes the workflow). So PR 1 ships the test with the file absent and the test prints `coverage floors: no measured file yet, not checked` and passes; PR 2, after the founder's paste and its first green run, adds the file from that run's summary, with the run id. The test then fails if a floor is above its number, if the run id is missing, and (when `RATCHET_BASE_REQUIRED=1`, same variable and per-event rules as BRIEF CI-PIN section 10) if any number in the file is higher than the base branch's copy without a new run id, so the same PR cannot raise the measure to justify a floor; coverage output itself is gitignored and is never read; a later PR that raises a floor also updates this file from a fresh measured run). Red today: no such test. The job itself is proved by its first CI run.

3. FILES
   Touch: scripts/coverage/preset.ts (floors; only after a measured run), docs/ops/proposed/coverage-ci.md (pin SHAs, runner image, timeout), docs/qa/COVERAGE.md (the measured table; qa's file: coordinate),
          apps/mobile/test/coverage-preset.test.ts (new), docs/agents/checkins/ops-rd-h3-cov.md
   Never: `.github/workflows/ci.yml`; lowering a floor to pass; the `coverage/` output (gitignored).
   Shared file: BRIEF CI-PIN pins the same actions; reuse its SHAs, do not resolve twice.

4. READING PACK: Pack 10 item 1; docs/ops/proposed/coverage-ci.md (all); docs/qa/COVERAGE.md; scripts/coverage/preset.ts (floors and per-file globs); CODE-QUALITY-GATES.md G9 and G3 (coverage never replaces the trace ratchet).

5. CODE ENTRY POINTS (verified at 16e61549)
   apps/mobile/package.json:92   `"test:coverage": "vitest run --config vitest.coverage.config.ts"`; root package.json:12 `test:coverage` -> scripts/coverage/run.mjs
   scripts/coverage/preset.ts:23-29   Thresholds {statements, branches, functions, lines}; per-file floors keyed by glob (`verify.ts`, `plan.ts`)
   docs/ops/proposed/coverage-ci.md:25-45  the job; "About 6 to 8 minutes on a 2-core runner" and "critical path grows by about 2 minutes"
   Known slow tests under coverage: billing-plan-reminders (70 s plain, 170 s instrumented), sync-e2e (PGlite)

6. DATA AND SECURITY: no data class. The artifact `coverage` holds file paths and percentages, no content. `permissions: contents: read`. Boundary: none new.

7. LIBRARIES: `@vitest/coverage-v8` is already installed (3.2.7 per the proposal [V in doc, U in lockfile: re-check]). None new.
8. BUDGETS: the whole CI path under 10 minutes (ci.yml header :1-5); this job runs in parallel with `unit` (about 3 minutes); its own timeout 15 minutes in the proposal. If it exceeds 10 minutes of the critical path, split mobile, do not raise a timeout.

9. ACCEPTANCE: (a) a measured run on CI (the sandbox cannot: 8 mobile files fail on missing modules) pasted as the new table; (b) floors 1 to 2 points under it; (c) per-file floors for new verified paths only once they exist on develop (the photo derivative code is in the unmerged stack #835 to #840, not on develop [V ls lib/photos: baker.ts, files.ts, types.ts];
   `lib/reminders/planner.ts` and `session.ts` exist); (d) the proposal pinned. Done also means the test is red when a floor is set above the measured value.

10. PR BREAKDOWN: PR 1 proposal refresh + test ~100 lines, 3 files | PR 2 floors after the first CI measure ~40 lines | base develop | job not running until pasted.

11. LENSES: A qa, B principal-architect; mobile reads (the test and the coverage floors under apps/mobile/**).

12. ORDER: after the founder pastes (one sitting with CI-PIN, CI-LINT). Blocking only after a week green. Blocked by the founder.

13. DONE: [ ] focused test; [ ] `npm test` baseline; [ ] ASCII; [ ] PR body per HARNESS-RUN with `needs:founder`; [ ] journal #22; [ ] check-in.

14. ONLY A PHONE CAN PROVE: nothing.

15. STOP AND ASK: coverage falls on a safety path (`verify.ts`, `plan.ts`): that is the owner's, not a floor change; the job exceeds the 10-minute path; a floor needs to drop.

16. HARNESS: journal #22; marker `<!-- journal run:sess-20261120-ops-cov agent:ops -->`; branch chore/ops-coverage-job-refresh; labels agent:ops, from:agent, needs:founder.
```
