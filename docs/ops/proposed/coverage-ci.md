# Proposed CI job: coverage that cannot fall silently

Status: proposal, refreshed 21 Nov 2026 (first written 16 Oct). Nothing under `.github/` is changed by this pull request. The refresh pins every action by sha (the same shas `ci.yml` uses on develop after the CI-PIN change: checkout v7.0.1, upload-artifact v7.0.2, both already used by `ios-compile.yml`), moves to `ubuntu-24.04` as the other CI jobs do, and adds the measured-file test of gate G9 (below). It applies to `ci.yml` after the pin PR (#1156) has merged; the shas below are read from `.github/workflows/ios-compile.yml`, not from memory.

**Floors are 16 Oct numbers and predate the new-scope code.** Do not change a floor from this proposal. The sequence is: (1) the founder or Karma pastes the job, advisory; (2) its first green run gives measured numbers; (3) a second PR adds `docs/ops/coverage-measured.json` (one number per workspace and the Actions run id that produced it) and, only then, raises any floor 1 to 2 points under the new number; (4) `coverage` joins `required` after a week green. `apps/mobile/test/coverage-preset.test.ts` enforces that a floor is a whole number and never above the measured value, and prints `coverage floors: no measured file yet, not checked` until step 3.

## What exists after this pull request

- `npm run test:coverage` at the repo root runs every workspace's `vitest.coverage.config.ts` one after another (`scripts/coverage/run.mjs`) and prints one merged table (`scripts/coverage/report.mjs`).
- Each workspace also has its own `npm run test:coverage -w <workspace>`.
- v8 provider (`@vitest/coverage-v8` 3.2.7, the same version as the installed vitest), `all: true` so a file no test imports counts at 0%, AST-aware remapping so branch and function counts are real for untested files.
- Floors per workspace one to two points below the 16 Oct 2026 measurement, plus tighter per-file floors on `packages/core/src/verify.ts` and `plan.ts` (`docs/qa/COVERAGE.md`). A workspace or file below any of its floors fails the run and the run exits 1.
- Reports: `coverage/coverage-summary.json` (machine), `coverage/lcov.info` (editors, PR annotations), text summary on stdout. `coverage/` is gitignored.

## The job

Add to `.github/workflows/ci.yml` next to `unit`, and add `coverage` to the `needs` list of `required` once it has been green for a week (until then it reports without blocking):

```yaml
  coverage:
    name: coverage (no workspace may fall below its baseline)
    needs: install
    runs-on: ubuntu-24.04
    # Instrumented runs take about 2.5 times as long as `npm test`; mobile is the long pole.
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - uses: ./.github/actions/setup
      - name: Coverage, every workspace, thresholds enforced
        run: npm run test:coverage -- --files 25
      - name: Summary on the run page
        if: always()
        run: node scripts/coverage/report.mjs --files 25 >> "$GITHUB_STEP_SUMMARY"
      - name: Keep the reports for 14 days
        if: always()
        uses: actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9 # v7.0.2
        with:
          name: coverage
          retention-days: 14
          path: |
            */*/coverage/coverage-summary.json
            */*/coverage/lcov.info
            experiments/coverage/coverage-summary.json
            experiments/coverage/lcov.info
```

`SCRIBE_FUZZ_SEED` is already pinned at workflow level, so the verifier fuzz runs the same cases under coverage as in `unit`.

## Rules for the thresholds

1. A threshold is a whole number one to two points below the measured value. `verify.ts` and `plan.ts` carry their own per-file floors. Raise a floor by hand when a workspace has stayed two points above it for a month.
2. A pull request may never lower a floor to pass. If coverage must fall (code moved to a `.tsx` screen, a module deleted together with its tests), the pull request says why in its description and a reviewer approves the new number explicitly.
3. The denominator is fixed in the configs: tests, `.d.ts`, generated output, goldens, end-to-end harnesses, command-line scripts, React screens (`.tsx`), Expo Router routes and native adapters are excluded. Changing an exclude list is reviewed like a threshold change.

## Cost

About 6 to 8 minutes on a 2-core runner in parallel with `unit`, so the critical path grows by about 2 minutes (TDD 07 section 10 budget: under 10 minutes). If that is too much: run `coverage` on pushes to `develop` and on pull requests that touch `apps/**` or `packages/**`, and keep `unit` as the only per-PR test job.

## Known slow tests under coverage

| Test | Plain | Instrumented | Handling |
|---|---|---|---|
| `apps/mobile/test/billing-plan-reminders.test.ts` "a synthetic year" | about 70 s (own timeout 120 s) at stride 1; about a third of that at the default stride of 15 | about 170 s at stride 1 | Runs in the coverage run at the default stride (`SCRIBE_REMINDER_STRIDE`, BL-443, #1322); the coverage-only skip is gone. Nightly runs every day (`SCRIBE_REMINDER_STRIDE=1`, #1348). |
| `apps/mobile/test/decode-uri-component-shim.test.ts` (loads `metro.config.js`) | about 2 s | over 5 s | 30 s per-test timeout in every coverage config (`INSTRUMENTED` in `scripts/coverage/preset.ts`). |
| `apps/mobile/test/sync-e2e.test.ts` (PGlite, 120 s `beforeAll`) | about 20 s | 60 s to over 120 s on a loaded machine | Runs as is; flaky only when the runner is shared with other jobs. Do not run `coverage` on the same runner as `db`. |
