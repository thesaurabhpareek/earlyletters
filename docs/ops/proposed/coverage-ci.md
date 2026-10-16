# Proposed CI job: coverage that cannot fall silently

Status: proposal, 16 Oct 2026. Nothing under `.github/` is changed by this pull request (another agent owns the workflows). The owner of `.github/workflows/ci.yml` can paste the job below as is.

## What exists after this pull request

- `npm run test:coverage` at the repo root runs every workspace's `vitest.coverage.config.ts` one after another (`scripts/coverage/run.mjs`) and prints one merged table (`scripts/coverage/report.mjs`).
- Each workspace also has its own `npm run test:coverage -w <workspace>`.
- v8 provider (`@vitest/coverage-v8` 3.2.7, the same version as the installed vitest), `all: true` so a file no test imports counts at 0%, AST-aware remapping so branch and function counts are real for untested files.
- Thresholds per workspace equal to the baseline measured on 16 Oct 2026 (`docs/qa/COVERAGE.md`). A workspace below any of its four numbers fails the run and the run exits 1.
- Reports: `coverage/coverage-summary.json` (machine), `coverage/lcov.info` (editors, PR annotations), text summary on stdout. `coverage/` is gitignored.

## The job

Add to `.github/workflows/ci.yml` next to `unit`, and add `coverage` to the `needs` list of `required` once it has been green for a week (until then it reports without blocking):

```yaml
  coverage:
    name: coverage (no workspace may fall below its baseline)
    needs: install
    runs-on: ubuntu-latest
    # Instrumented runs take about 2.5 times as long as `npm test`; mobile is the long pole.
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup
      - name: Coverage, every workspace, thresholds enforced
        run: npm run test:coverage -- --files 25
      - name: Summary on the run page
        if: always()
        run: node scripts/coverage/report.mjs --files 25 >> "$GITHUB_STEP_SUMMARY"
      - name: Keep the reports for 14 days
        if: always()
        uses: actions/upload-artifact@v4
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

1. A threshold is the number measured the day it was set, never a round number below it.
2. When a pull request raises a workspace's coverage, the same pull request may raise its thresholds (`vitest.coverage.config.ts`); a reviewer asks for it when the rise is over one point.
3. A pull request may never lower a threshold to pass. If coverage must fall (code moved to a `.tsx` screen, a module deleted together with its tests), the pull request says why in its description and a reviewer approves the new number explicitly.
4. The denominator is fixed in the configs: tests, `.d.ts`, generated output, goldens, end-to-end harnesses, command-line scripts, React screens (`.tsx`), Expo Router routes and native adapters are excluded. Changing an exclude list is reviewed like a threshold change.

## Cost

About 6 to 8 minutes on a 2-core runner in parallel with `unit`, so the critical path grows by about 2 minutes (TDD 07 section 10 budget: under 10 minutes). If that is too much: run `coverage` on pushes to `develop` and on pull requests that touch `apps/**` or `packages/**`, and keep `unit` as the only per-PR test job.

## Known slow tests under coverage

| Test | Plain | Instrumented | Handling |
|---|---|---|---|
| `apps/mobile/test/billing-plan-reminders.test.ts` "a synthetic year" | about 70 s (own timeout 120 s) | about 170 s | Left out of the coverage run only (`testNamePattern` in `apps/mobile/vitest.coverage.config.ts`). Its owner can add a sample-size knob (like `SCRIBE_FUZZ_RUNS`) and the skip can go. |
| `apps/mobile/test/decode-uri-component-shim.test.ts` (loads `metro.config.js`) | about 2 s | over 5 s | 30 s per-test timeout in every coverage config (`INSTRUMENTED` in `scripts/coverage/preset.ts`). |
| `apps/mobile/test/sync-e2e.test.ts` (PGlite, 120 s `beforeAll`) | about 20 s | 60 s to over 120 s on a loaded machine | Runs as is; flaky only when the runner is shared with other jobs. Do not run `coverage` on the same runner as `db`. |
