# Pipeline ledger: has each release workflow ever really run?

Owner: ops, built under qa's backlog item HV2-B03 (`docs/agents/harness-v2/BACKLOG.md`; design `docs/agents/harness-v2/EVIDENCE-AND-GREEN.md` section 3; acceptance HV2-011).

**Why it exists.** A workflow can end with a green `success` and still have skipped the one step that does the work. The retro found 5 of 5 `testflight.yml` runs skipped (per the harness v2 design, not re-counted here). "Green" is then not evidence that the release path ever ran. This ledger answers one question per release workflow: when was the last run in which the work step really succeeded, or `never`.

**What counts.** A run counts only if its conclusion is `success` and every step listed for that workflow ran and succeeded. A skipped step, or a step missing from the run's jobs, means the run does not count.

| Workflow | Step that must succeed |
|---|---|
| `testflight.yml` | Build on EAS (`.github/workflows/testflight.yml:116`) |
| `release-ios.yml` | Build and auto-submit |
| `deploy-db.yml` | Push |
| `deploy-functions.yml` | Deploy |

The list is in `RELEASE_WORKFLOWS` in `scripts/ci/pipeline-ledger.mjs`. A test compares each name with the workflow file, so a renamed step fails the test. Step names for the last three were read from the files on `develop` on 1 Nov 2026; `deploy-db.yml` has a `Push` step in both its staging and production jobs, so a staging push counts for the ledger (U: whether that is the right bar for production is the founder's call).

## How to run it

```
node scripts/ci/pipeline-ledger.mjs            # print the table
node scripts/ci/pipeline-ledger.mjs --write    # also update the block below
node scripts/ci/pipeline-ledger.mjs --strict   # exit 1 if any workflow is "never"
```

It uses `gh api` on two REST paths (`/repos/{o}/{r}/actions/workflows/{file}/runs` and `/repos/{o}/{r}/actions/runs/{id}/jobs`), read-only. GraphQL is not used. It needs `gh` logged in with read access to Actions; it never prints a token. By hand until a cron exists; a scheduled run with a read-only `GITHUB_TOKEN` would be a workflow change, which is a proposal under `docs/ops/proposed/` for the founder, not part of this item.

Limits: it reads at most 3 pages of 100 runs per workflow (`--max-pages`) and at most 30 job lookups (`--max-job-lookups`); when either limit is hit the row says so. A `never` means never within the runs read; if a row says "never in the runs checked", some success runs were not opened and the answer is not final (raise `--max-job-lookups`; it opens runs one by one, so 60 lookups per workflow takes a few minutes). Tests: `node --test scripts/ci/pipeline-ledger.test.mjs` (fixtures, no network; not part of root `npm test`).

## Ledger

<!-- ledger:begin -->
Generated 2026-11-01T10:13:06.835Z for thesaurabhpareek/earlyletters by scripts/ci/pipeline-ledger.mjs (REST, read-only).

| Workflow | Last real success | Real | Skipped | Failed | Success runs not checked | Runs read |
|---|---|---|---|---|---|---|
| testflight.yml | never | 0 | 14 | 0 | 0 | 14 |
| release-ios.yml | never | 0 | 0 | 0 | 0 | 0 |
| deploy-db.yml | never in the runs checked | 0 | 60 | 12 | 174 | 246 (job lookups capped) |
| deploy-functions.yml | never in the runs checked | 0 | 60 | 0 | 19 | 79 (job lookups capped) |

A run is real only if its conclusion is success and every listed step succeeded (not skipped, not absent). Steps required: testflight.yml: Build on EAS; release-ios.yml: Build and auto-submit; deploy-db.yml: Push; deploy-functions.yml: Deploy.
<!-- ledger:end -->
