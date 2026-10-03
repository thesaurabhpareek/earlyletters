# .github

CI, review rules and branch protection for `thesaurabhpareek/earlyletters`.

| File | What it does |
|---|---|
| `workflows/ci.yml` | On every pull request and every push to `develop` and `main`: install (cached by `package-lock.json`), then in parallel: `npm test` (content rules included), `npm run test:db`, typecheck for every workspace (`apps/mobile` with `npx tsc --noEmit`), lint (skipped with a notice until a root `lint` script exists), `expo config --type public` for `apps/mobile`, and the tests for the scripts in this folder. A `required` job sums them up. Every job has a timeout; the longest path is 9 minutes. |
| `workflows/migration-guard.yml` | Fails a change that edits, renames or deletes a migration listed in `migrations-applied.txt`, removes a line from that list, or adds a migration that sorts before the newest applied one. Runs the guard and reads its exception list from a trusted ref, never from the pull request (see below). |
| `workflows/security.yml` | gitleaks over the full history (config `gitleaks.toml`), and `npm audit --omit=dev --audit-level=high` through `scripts/audit-gate.mjs` with the dated ignore list `audit-ignore.json`. Also weekly on Mondays. Not part of `required`. |
| `workflows/fence.yml` | The agent fence (D-041): fails a pull request that touches `supabase/**`, `.github/**` or auth code unless it has the `approve-migration` label. Advisory until branch protection exists (see below). |
| `dependabot.yml` | Weekly update pull requests into `develop`: npm (Expo and React Native packages grouped) and GitHub Actions (SHA pins). |
| `migrations-applied.txt` | The migrations applied to the live database. Add a line in the same PR that records applying one (see `supabase/APPLY.md`). |
| `migration-exceptions.txt` | Reviewed exceptions to the applied-migration rule, one `file@blob-sha` per line. Today: only `20261001000000_scribe_hardening.sql`, reconciled with what was applied in commit 3730551. |
| `scripts/migration-guard.mjs` | The guard itself. Run it locally with `node .github/scripts/migration-guard.mjs origin/develop`. Tests: `node --test .github/scripts/migration-guard.test.mjs`. |
| `scripts/audit-gate.mjs` | Applies the ignore list to `npm audit --json`. Locally: `npm audit --omit=dev --json \| node .github/scripts/audit-gate.mjs`. Tests: `node --test .github/scripts/audit-gate.test.mjs`. |
| `actions/setup` | Node 22 plus the cached `node_modules`, or `npm ci` on a cache miss. |
| `CODEOWNERS` | Review routing. One placeholder owner today; comments name the reviewer each area needs later. |
| `pull_request_template.md` | The checklist from `CLAUDE.md`. |

Every third-party action is pinned to a full commit SHA with the tag in a comment (`actions/checkout` v7.0.1, `actions/setup-node` v7.0.0, `actions/cache` v6.1.0, all on the Node 24 runtime). Runners are pinned to `ubuntu-24.04`, so the `ubuntu-latest` move does not change CI without a pull request. Dependabot proposes SHA bumps.

The verifier fuzz test runs with a fixed seed in CI (`SCRIBE_FUZZ_SEED`). To replay a failure, run
`SCRIBE_FUZZ_SEED=<seed> SCRIBE_FUZZ_RUNS=<n> npm test -w @scribe/core` with the values the failure printed.

## The migration guard: trusted ref and exceptions

A pull request could otherwise weaken its own gate by editing the guard (CI-09). So the workflow:

1. Picks the trusted ref: the pull request base when it has `scripts/migration-guard.mjs`, otherwise `origin/develop`. The only base without the guard today is `main`, for the release pull request from `develop`. If neither has it (only possible before this folder lands), it falls back to the change itself and prints a warning.
2. Copies the guard out of the trusted ref with `git show` into `$RUNNER_TEMP` and runs that copy. The pull request's copy is never executed.
3. The guard reads `migration-exceptions.txt` from the same trusted ref, so a pull request cannot add its own exception, and cannot remove one to break the gate for others.

An exception entry is `<file>@<blob sha>`. It allows that one applied file to differ, only while its content is exactly that blob (`git rev-parse <ref>:supabase/migrations/<file>`). Deletes, renames and any later edit still fail. There is no general override. Adding an entry takes its own pull request with a reason in the file and the founder's approve-migration review; it only takes effect once merged into the base.

Note for the release pull request (`develop` into `main`): the base, `main`, predates the guard, so the exception is read from `origin/develop`. Anyone who can push to `develop` can therefore change what the release pull request trusts. Branch protection on `develop` closes that gap.

## The fence and its limitation

`fence.yml` fails when a pull request touches `supabase/**`, `.github/**` or authentication code (any file or folder under `apps/` or `packages/` named `auth`, `session` or `sign-in`) and has no `approve-migration` label. It runs on `pull_request_target`, so the base branch's copy of the workflow is used, and it never checks out pull request code; it only lists the changed files through the API.

What it does not do, until the founder turns on branch protection (CI-01):

- A failing `fence` check does not block a merge. Anyone with write access can still merge, and direct pushes to `develop` or `main` skip pull requests and the fence entirely.
- Anyone with write access can add the label. The label is a signal of the founder's review, not an access control.
- The label must exist in the repository first (Issues, Labels, New label: `approve-migration`). It does not exist yet.

To make it a real gate: create the label, add `fence` to the required checks below, and once a second reviewer exists, require code owner review for `/.github/` and `/supabase/`.

## Branch protection (to apply once the workflows are on GitHub)

The check names below only appear in the settings after each workflow has run once. Open a pull request that adds this folder, let it run, then apply the rules.

Apply to both `main` and `develop`:

1. Require a pull request before merging.
2. Require status checks to pass, and require branches to be up to date before merging. Required checks:
   - `required` (from the CI workflow)
   - `applied migrations unchanged` (from the Migration guard workflow)
   - `fence` (from the Fence workflow)
   - Optional: `secrets (full history)` from the Security workflow. Leave `npm audit (production, high)` unrequired, so a newly published advisory does not block unrelated work; review its weekly run instead.
3. Require conversation resolution before merging.
4. Require linear history.
5. Block force pushes and branch deletion.
6. Approvals: GitHub never lets the author approve their own pull request. While one person owns every area, set required approvals to 0 and leave "Require review from Code Owners" off, or nothing can merge. Turn on 1 approval plus code owner review as soon as a second reviewer exists.
7. Leave "Do not allow bypassing the above settings" off for now, so the owner can recover from a broken CI. Turn it on before the first external contributor.

The same settings through the API (run once per branch, replacing `BRANCH`):

```bash
gh api -X PUT repos/thesaurabhpareek/earlyletters/branches/BRANCH/protection --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "checks": [{ "context": "required" }, { "context": "applied migrations unchanged" }, { "context": "fence" }]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 0,
    "require_code_owner_reviews": false,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "required_linear_history": true,
  "required_conversation_resolution": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

Check it took: `gh api repos/thesaurabhpareek/earlyletters/branches/BRANCH/protection --jq '.required_status_checks.checks'`.

## Keeping CI under 10 minutes

- Timings on 3 Oct 2026 (2-core container): `npm test` about 12 s, `npm run test:db` about 41 s, typecheck about 20 s. `npm ci` cold is 1 to 1.5 minutes; with the `node_modules` cache, seconds.
- If a job nears its timeout, split it rather than raising the timeout. The `db` job can shard by file (`npm run test:db -- perf` alone).
- Nightly and release workflows (Maestro, random-seed fuzz, integration stack) are separate and not required for merging (TDD 07 section 10).

## The audit ignore list

`audit-ignore.json` lists the four advisories reported on 3 Oct 2026, all in Expo build tooling: braces `GHSA-vfj7-8cjw-p6xm`, node-forge `GHSA-86w9-cpqp-85rv`, decode-uri-component `GHSA-vcc3-ghjq-m6fr` and uuid `GHSA-w5hq-g745-h8pq`. Each has a reason, the date added and an expiry (3 Jan 2027). An expired entry fails the gate, and an entry no longer reported is printed so it can be removed. Never run `npm audit fix --force`.
