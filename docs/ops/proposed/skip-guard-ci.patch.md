# Proposed CI wiring: skip guard and the new test files (HV2-B20 part a)

Status: proposal, 1 Nov 2026, for the founder to apply on or after 10 Nov (D-124, CR-22). Nothing under `.github/` or in `package.json` is changed by this pull request.

Base for line numbers: `origin/develop` at `246debbd`. The PRs named below are open drafts; apply a row only after its PR merges, or `npm test` fails on a missing file.

## 1. Root `npm test` line (package.json, line 11)

Current:

```
"test": "npm run test --workspaces --if-present && node --test scripts/trace.test.mjs \"compliance/**/*.test.mjs\" && node scripts/trace.mjs --no-write",
```

Proposed, once every row of the table in section 2 has merged (drop the paths of PRs that have not):

```
"test": "npm run test --workspaces --if-present && node --test scripts/trace.test.mjs scripts/qa/evidence-check.test.mjs scripts/ci/workflow-lint.test.mjs scripts/ci/skip-guard.test.mjs scripts/ci/pipeline-ledger.test.mjs scripts/release/checklist-check.test.mjs scripts/review-gate/decide.test.mjs scripts/status/today.test.mjs \"compliance/**/*.test.mjs\" && node scripts/trace.mjs --no-write",
```

Paths were read from each PR's file list with `gh api repos/thesaurabhpareek/earlyletters/pulls/<n>/files` (1 Nov 2026).

## 2. Test files added by open PRs

| Test path | Added by | In root `npm test` today? | Action |
|---|---|---|---|
| `scripts/ci/workflow-lint.test.mjs` | #553 (HV2-B11) | no | add |
| `scripts/trace.test.mjs` (modified; `--scope b1` cases) | #556 (HV2-B10) | yes, already listed | none |
| `scripts/release/checklist-check.test.mjs` | #558 (HV2-B01) | no | add |
| `scripts/review-gate/decide.test.mjs` | #559 (HV2-B06) | no | add |
| `scripts/qa/evidence-check.test.mjs` | #560 (HV2-B02) | #560 adds it to package.json itself | none beyond merging #560; keep it in the line above |
| `scripts/ci/pipeline-ledger.test.mjs` | #563 (HV2-B03) | no | add |
| `scripts/agents/board-check.test.mjs` | #564 (HV2-B04, B08) | no, but `agents-check.yml:36` runs `node --test 'scripts/agents/*.test.mjs'` on changes under `scripts/agents/**` | none needed; leave out of the root line |
| `scripts/status/today.test.mjs` | #565 (HV2-B07) | no | add |
| `scripts/ci/skip-guard.test.mjs` | #566 (HV2-B09) | no | add |

PRs #561 and #562 change only docs (`docs/release/TESTFLIGHT.md`, `docs/release/SECRETS.md`, `docs/agents/BOARD.md`); they add no test file.

Merge conflict to expect: #560 edits the same `package.json` line. Whoever merges second rebases; the result is the section 1 line.

Pre-existing, not part of this batch: `scripts/qa/skip-guard.test.mjs` (the warn-only guard), `scripts/status/page.test.mjs`, `scripts/guards/docs-leak-guard.test.mjs` and `scripts/founder/check.test.mjs` exist on develop and are not in the root line. Whether another workflow runs them: U (I did not grep every workflow for each). Say so if you want them added.

## 3. CI jobs for the skip guard (`.github/workflows/ci.yml`)

How the guard reads input: captured log text, `node scripts/ci/skip-guard.mjs --allow docs/qa/skip-allowlist.json <log>...` (`scripts/ci/skip-guard.mjs` header on #566). It wants every log of one run in a single call, because an allowlist entry whose suite is in no log is stale and fails. `ci.yml` runs `npm test` (`unit`, line 62) and `npm run test:db` (`db`, line 73) in separate jobs, so both jobs keep their logs and a third job reads both. The guard needs only checkout and Node 22; it reads workspace `package.json` files and `supabase/tests/*.test.mjs` names, so no install.

These SHAs are copied from pins already on develop (`actions/upload-artifact` and `actions/download-artifact` in other workflows under `.github/`; checkout at `ci.yml:113`; setup-node at `.github/actions/setup/action.yml`). I did not resolve them again through the API (see `sha-pins.md` for why), so they are as good as the existing pins. Note they are newer majors (v7) than the `@v4` tags being replaced; `upload-artifact` v7 and `download-artifact` v7 must be used as a matching pair.

### 3a. Replace the `unit` step at ci.yml:60-62

```yaml
      - name: Engine, verifier fuzz, entitlements, analytics, tokens, experiments
        if: ${{ !cancelled() }}
        run: |
          set -o pipefail
          npm test 2>&1 | tee test.log
      - name: Keep the test log for the skip guard
        if: ${{ !cancelled() }}
        uses: actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9 # v7.0.2
        with:
          name: log-unit
          path: test.log
          retention-days: 3
```

### 3b. Replace the `db` step at ci.yml:72-73

```yaml
      - name: Access rules, governance, classification, performance (PGlite)
        run: |
          set -o pipefail
          npm run test:db 2>&1 | tee db.log
      - name: Keep the test log for the skip guard
        if: ${{ !cancelled() }}
        uses: actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9 # v7.0.2
        with:
          name: log-db
          path: db.log
          retention-days: 3
```

Both `tee` steps keep the runner's exit code through `pipefail`. The artifact steps use `!cancelled()` so a crashed db file still leaves a log; the guard then fails that file for having no summary (EG-2), which is the point.

### 3c. New job, after `seam-guard`

```yaml
  skip-guard:
    name: skipped tests are on the allowlist
    needs: [unit, db]
    if: ${{ !cancelled() }}
    runs-on: ubuntu-latest
    timeout-minutes: 3
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1, as ci.yml:113
        with:
          persist-credentials: false
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0 (as in .github/actions/setup/action.yml)
        with:
          node-version: 22
      - uses: actions/download-artifact@37930b1c2abaa49bbe596cd826c3c89aef350131 # v7.0.0
        with:
          pattern: log-*
          merge-multiple: true
      - run: node --test scripts/ci/skip-guard.test.mjs
      - run: node scripts/ci/skip-guard.mjs --allow docs/qa/skip-allowlist.json test.log db.log
```

If `unit` or `db` is red, a log may be missing and the last step fails on an unreadable input (exit 2). That is a second red on top of the real one, not a false pass.

### 3d. Add to `required` (ci.yml:137)

```yaml
    needs: [install, unit, db, functions, typecheck, seam-guard, skip-guard]
```

Advice: run `skip-guard` as advisory for a week first (leave it out of `needs`), as `docs/ops/proposed/coverage-ci.md` does for coverage, so a log-format surprise cannot block merges.

### 3e. Workflow lint job (from #553), optional, same file

```yaml
  workflow-lint:
    name: workflow lint (sha pins, pull_request_target)
    runs-on: ubuntu-latest
    timeout-minutes: 2
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1, as ci.yml:113
        with:
          persist-credentials: false
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version: 22
      - run: node --test scripts/ci/workflow-lint.test.mjs
      - run: node scripts/ci/workflow-lint.mjs
```

Do not add this job before `sha-pins.md` is applied: on develop it reports 17 `pin` findings and exits 1 (header of `scripts/ci/workflow-lint.mjs` on #553).

## 4. Allowlist

`docs/qa/skip-allowlist.json` (#566) has one entry: `apps/web`, count 1, owner `qa`, expires 2026-12-01 (the paired `it.skipIf(mastersPresent)` at `apps/web/test/brand-assets.test.ts:198`). On 2 Dec 2026 the guard fails until someone renews or removes it. That is by design (EG-3). I did not run the guard against a real full-suite log; see the pull request body.

## 5. Not run

I did not run `npm test` or `npm run test:db` on the merged result (the local install is truncated, see the PR body), did not apply this to any workflow, and did not check how `actions/upload-artifact` behaves when `test.log` is large (U; the unit log is plain text).
