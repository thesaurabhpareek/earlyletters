# Database deploy pipeline

For the founder and anyone changing `supabase/`. Written 3 Oct 2026 (WS-14). Decision: D-041 (two Supabase projects; migrations reach them only from CI). Findings: CI-03 (no `config.toml`), POPS-04 (no account access token in CI), DB-04 (manual apply conflicts with D-041).

**Status: nothing here has run yet.** The two target projects do not exist, the GitHub Environments and secrets do not exist, and no workflow in this document has run on GitHub. The first section lists what the founder must create.

Labels used below: **Verified** means checked on 3 Oct 2026 against the source or page named; **Assumed** means not checked in this session.

## The pipeline at a glance

| Stage | Trigger | Workflow | What runs | Touches a hosted database |
|---|---|---|---|---|
| Pull request | PR that changes `supabase/**` | `.github/workflows/db-cli.yml` | `supabase start`, `supabase db reset --local`, `supabase db lint --local --level error --fail-on error`, `npm run test:db` | No |
| Nightly | 10:23 UTC daily, or by hand | `.github/workflows/nightly.yml` | Verifier fuzz with a random seed (100000 runs), then the same checks as `db-cli.yml` | No |
| Staging | Push to `main` that changes `supabase/migrations/**` | `.github/workflows/deploy-db.yml`, job `deploy to staging` | `supabase db push --dry-run`, then `supabase db push` | `scribe-staging` |
| Production | Push of a tag `db-v*` that points at a commit on `main` | `.github/workflows/deploy-db.yml`, job `deploy to production` | Waits for approval in the `production` Environment, then dry run, then push | `scribe-prod` |
| Staging, from `develop` | Push to `develop` that changes `supabase/migrations/**` (RA-20-04) | `.github/workflows/deploy-db.yml`, job `deploy to staging` | The same dry run and push as from `main`, after the `staging` reviewer approves; then the smoke's database checks | `scribe-staging` |
| Edge Functions | Push to `develop` that changes a function's code, or a manual run on `develop` | `.github/workflows/deploy-functions.yml`, jobs `what to deploy`, then `deploy to staging` | Waits in `staging`; checks staging has every migration on `develop`, deploys every function except `escrow` from `develop`'s tip, checks the function list, then the smoke's health checks (see "Edge Functions to staging") | Reads `supabase_migrations.schema_migrations` only |

Rules the database workflows enforce (`deploy-functions.yml` has its own, in "Edge Functions to staging", and is the one workflow that holds an access token):
- Every deploy job has `permissions: contents: read` and checks out without persisting credentials.
- Each environment has its own concurrency group (`deploy-db-staging`, `deploy-db-production`) with `cancel-in-progress: false`, so a running push is never cancelled halfway.
- The only credential is one Postgres connection URL per environment, stored as an Environment secret. There is no `SUPABASE_ACCESS_TOKEN` anywhere (POPS-04), so CI cannot create, delete, pause or reconfigure projects, and cannot run `supabase link` or `supabase config push`.
- The production job refuses a tag whose commit is not on `main`.
- After a push, the job prints (and writes to the run summary) every migration file not yet listed in `.github/migrations-applied.txt`. It never edits that file. A pull request records them (see "After a deploy").
- The Supabase CLI is pinned to 2.119.0 in all four workflows (`db-cli.yml`, `nightly.yml`, `deploy-db.yml`, `deploy-functions.yml`), installed by `supabase/setup-cli` pinned to the v3.0.1 commit. Bump both deliberately.

Why the staging trigger is not a `paths:` filter: `deploy-db.yml` triggers on every push to `main` and on `db-v*` tags, and a small `migrations changed` job diffs the push for `supabase/migrations/`. This keeps tag pushes from ever being filtered out by a path rule.

## Environments

| Environment | Supabase project | Supabase org | GitHub Environment | Secret |
|---|---|---|---|---|
| Local | the CLI stack from `supabase/config.toml` (`project_id = "scribe"`) | none | none | none |
| Staging | `scribe-staging` (**does not exist yet**) | "Early Letters" (**does not exist yet**) | `staging` | `SUPABASE_DB_URL_STAGING`; for the smoke and the functions also `SUPABASE_STAGING_URL`, `SUPABASE_STAGING_PUBLISHABLE_KEY`, `SUPABASE_STAGING_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN_STAGING` (see "The content-free smoke" and "Edge Functions to staging") |
| Production | `scribe-prod` (**does not exist yet**) | "Early Letters" (**does not exist yet**) | `production` | `SUPABASE_DB_URL_PROD` |

The current live project `early-letters` (ref `fpkxggtzwoumdghwzlsl`, us-west-1, org "ParentingApp") is **slated for retirement, pending the founder's decision**. Nothing in this pipeline points at it. Until it is retired, `supabase/APPLY.md` remains its manual process, and `.github/migrations-applied.txt` still describes it (2 of 7 files applied there). Both new projects are built clean from the migrations by CI, never by pasting SQL or inserting rows into `supabase_migrations.schema_migrations` by hand.

`supabase/config.toml` configures only the local stack. Hosted settings (auth providers, SMTP, redirect URLs) are set in each project's dashboard, because applying `config.toml` to a hosted project (`supabase config push`) needs the account token that POPS-04 rules out.

## Founder steps (one time)

Do these in order. None of them can be done by CI or by an agent.

### 1. Supabase

1. Create the organisation "Early Letters". Turn on 2FA for your account (BL-106).
2. Create `scribe-staging` and `scribe-prod` in that organisation. Pick one US region for both (the brief asks for one region near US users; `early-letters` uses us-west-1). Whether production goes on Pro is an open founder decision; PITR (see "Rollback") needs Pro or higher.
3. In each project's SQL Editor, run `show server_version;`. The major version must equal `major_version` in `supabase/config.toml` (17). If it differs, change `config.toml` in a PR before the first deploy.
4. Store each project's database password in your password manager.
5. Copy each project's **session pooler** connection string (Connect > Session pooler). It looks like
   `postgresql://postgres.<project-ref>:<password>@aws-<n>-<region>.pooler.supabase.com:5432/postgres`.
   Percent-encode any special characters in the password (the CLI requires a percent-encoded URL).
   - Use the session pooler, not the direct connection: direct connections are IPv6 unless the project buys the IPv4 add-on, and GitHub Actions only accepts IPv4. **Verified** (Supabase docs "Connecting to Postgres" and "Supabase and your network: IPv4 and IPv6 compatibility").
   - Use session mode (port 5432), not transaction mode (6543), for migrations. **Assumed** best practice: migrations run DDL in one session.
   - The URL uses the `postgres` role, which owns the schema. A narrower deploy role is not possible today because migrations create and alter objects owned by `postgres`.

### 2. GitHub Environments and secrets

Settings > Environments.

1. **`staging`**
   - Deployment branches and tags: "Selected branches and tags", add branches `main` and `develop`.
   - Environment secret `SUPABASE_DB_URL_STAGING` = the staging session pooler URL.
   - Required reviewers: you, while staging holds the alpha's real letters (D-106, `docs/ops/ENVIRONMENTS.md`), so a manual run from `develop` waits for your approval. Leave "Prevent self-review" off while you are the only reviewer.
2. **`production`**
   - Required reviewers: you. Leave "Prevent self-review" off while you are the only reviewer, or nobody can approve.
   - Deployment branches and tags: "Selected branches and tags", add a **tag** rule `db-v*`. Remove any branch rule.
   - Environment secret `SUPABASE_DB_URL_PROD` = the production session pooler URL.
3. Do **not** create repository-level secrets with these names. Environment secrets are released only to a job that names the environment, and for production only after you approve the run.
4. Create both Environments before the first migration reaches `main`. If a workflow names an Environment that does not exist, GitHub creates it without any protection (**Assumed**, standard GitHub behaviour), and the job then fails on the missing secret check.
5. Required reviewers on Environments for a **private** repository may need a paid GitHub plan (**Assumed**, not checked; the repo is public today and the GitHub Pro decision is open).

### 3. Protect the tags

Settings > Rules > Rulesets > New tag ruleset:
- Target tags matching `db-v*`.
- Restrict creations, updates and deletions; bypass list: repository admin (you).

This stops anyone else from creating a production tag. The production Environment's reviewer approval is the second gate.

### 4. Per-environment database settings

These are database settings, not migrations, so CI does not apply them. After the first successful push to each project, apply the steps from `supabase/APPLY.md` that still apply: step 6 (consent pepper, a different random value per project, never reused), step 7 (purge cron), step 15 (the hourly `scribe-sync-housekeeping` cron job and the purge worker schedule; Exposed schemas stay `public` only), and step 19 (optional parents-per-book setting). Step 11 (`app.store_environment`) is no longer needed: `20261004000000_plus_on_device_only.sql` removes the store tables.

### 5. Hosted auth (dashboard, per project)

Brief decision 4: Sign in with Apple, Sign in with Google, email magic link, no passwords. Configure these in each project's Authentication settings when the Apple and Google credentials exist (BL-053). `config.toml` holds only disabled local placeholders with `env()` references; no values are in the repo.

## Tagging flow (a normal release)

1. Merge the migration into `develop` through a PR. `db-cli.yml` and `CI` must pass; the fence needs the `approve-migration` label (D-041).
2. Open the release PR from `develop` into `main` and merge it.
3. The push to `main` runs `deploy to staging`: dry run, then push to `scribe-staging`. Read the run summary for the list of files to record.
4. Check staging (the app against staging, Supabase advisors, the checks in `supabase/APPLY.md` that apply to the new files).
5. Open a PR that adds the listed file names to `.github/migrations-applied.txt` (see "After a deploy").
6. Tag the commit on `main` that staging received, and push the tag:
   ```bash
   git fetch origin
   git tag -a db-v2026.10.12.1 -m "DB: <one line>" <commit on origin/main>
   git push origin db-v2026.10.12.1
   ```
   Suggested name: `db-v<year>.<month>.<day>.<n>`. Any name starting with `db-v` triggers the job.
7. Actions > Deploy database > the tag's run: read the dry run in staging's run, then approve the `production` deployment. The job checks the tag is on `main`, runs the dry run, then pushes.
8. If production printed files that staging's PR did not already record, add them in a PR.

`supabase db push` applies every migration the target has not recorded, in file order. If a deploy is queued behind a running one, GitHub keeps one pending run per concurrency group and a newer pending run replaces the older one (**Assumed**, standard GitHub concurrency behaviour). That is harmless here: the next push applies everything pending.

## After a deploy: recording applied migrations

`.github/migrations-applied.txt` is the list the migration guard protects: once a file is listed, any edit, rename or delete fails CI. Record a file as soon as it reaches **staging**, since editing it after that would make staging and the repo disagree.

The workflow prints the list but does not commit it, on purpose:
- the deploy job has read-only permissions and no write token;
- the change goes through review and the migration guard like any other.

Today the file still describes `early-letters` (2 files). On the first staging deploy, all 7 files are applied and listed by the job; the PR that records them adds the 5 missing lines.

## The content-free smoke (RA-07-06, after every staging deploy)

`deploy to staging` in `deploy-db.yml` ends with `node scripts/ops/staging-smoke.ts --db-only` (#202; what each red line means and how to fix it: `docs/ops/runbooks/staging-smoke.md`). `--db-only` keeps it to the checks this job owns: two read-only catalog queries through `psql` (consent pepper length, statement logging, cron jobs). Function health and Auth settings belong to `deploy-functions.yml` and to AF-13, which this job does not deploy. `--db-only` is S07's flag on #202; until #202 carries it, the smoke ignores the unknown flag and runs every check. **A run before AF-13 (Thu 22) is red by design:** the pepper and the cron jobs are founder steps (APPLY 6 and 7), so the first develop run on Wed 21 shows what AF-13 still has to do. It prints statuses and closed values only, never a URL, key, row or table contents, so the run summary can go into a ticket as it is. A red smoke fails the job **after** the push: the migrations are applied, and the red lines say what staging still lacks. On a commit without the script the step fails with "scripts/ops/staging-smoke.ts is not on this commit".

**`psql` on the runner.** The `ubuntu-24.04` image lists PostgreSQL 16 with its client (actions/runner-images, `images/ubuntu/Ubuntu2404-Readme.md`, image 20261012.334.1; **Verified** 16 Oct 2026). The job checks with `command -v psql` and installs Ubuntu's `postgresql-client` (which is `postgresql-client-16` on 24.04) if it is missing. psql 16 against staging's Postgres 17 for two plain read-only queries is **Assumed** fine; the first run shows it. `ubuntu-latest` moves to Ubuntu 26.04 in November 2026 (PostgreSQL 18 there); these workflows name `ubuntu-24.04`, so that change does not reach them.

**Secrets it adds to the `staging` Environment.** Public values, stored as secrets so the logs mask them; no new credential:

| Secret | Value |
|---|---|
| `SUPABASE_STAGING_URL` | `https://<staging ref>.supabase.co` |
| `SUPABASE_STAGING_PUBLISHABLE_KEY` | the staging `sb_publishable_` key the alpha builds use. The smoke refuses secret and service-role keys |
| `SUPABASE_STAGING_PROJECT_REF` | the staging project ref; the smoke refuses a URL or database URL for another project |

`SUPABASE_DB_URL_STAGING` is the one the job already holds. If staging runs the alpha without Sign in with Apple, the `sign-in providers` line of `deploy-functions.yml`'s smoke is red; add `--providers email` there until Apple is configured.

## Edge Functions to staging (`deploy-functions.yml`, RA-20-05)

| | |
|---|---|
| Trigger | A push to `develop` that changes a function's code: its `index.ts` and every file it imports, in `supabase/functions/` or `packages/` (for example `packages/api/src/envelope.ts`). A change to the workflow or to `.github/scripts/functions-deploy.mjs` counts too. Or a manual run (Run workflow) on `develop`, with `function` set to a folder name or `all`; a manual run on any other branch fails. A test file or README next to a function does not count |
| First | the job checks out **`develop`'s tip**, not the pushed commit, and plans again there. Staging must already have every file in `supabase/migrations` on that tip (a read-only `psql` read of `supabase_migrations.schema_migrations`); if not, nothing deploys and the summary lists the missing files: approve the Deploy database run first, then re-run |
| Deploys | every function except `escrow` (D-102: its own project, founder only), one at a time, with `supabase functions deploy <name> --project-ref <ref> --use-api`, plus `--no-verify-jwt` for `config`, `content` and `purge-worker`. A second guard in the Deploy step refuses `escrow`, `escrow-*` and `escrow_*` before any API call. Never `--prune`: a function removed from the repository stays on staging until you delete it. The summary names the deployed commit |
| Then | `supabase functions list -o json` must show each deployed function ACTIVE, on a **higher version** than before the run (a later update time on the same version does not count), and must report the gateway JWT check it was deployed with (a list that does not say fails). Only if every deploy landed and the list confirmed it, the smoke with `--no-db --functions config,content,purge-worker` must get health 200 from each (plus the policy-version and sign-up lines). After any failure the smoke does not run and the summary says why, so a GREEN table never sits under a red job |
| Waits in | `staging` (the approver) |
| Secrets | `SUPABASE_ACCESS_TOKEN_STAGING`, `SUPABASE_STAGING_PROJECT_REF`; `SUPABASE_DB_URL_STAGING` for the read-only migrations check (as PG* variables, never in argv); for the smoke, `SUPABASE_STAGING_URL` and `SUPABASE_STAGING_PUBLISHABLE_KEY` |
| Permissions | `contents: read` |

**Why every function, from `develop`'s tip.** Each run waits for your approval in `staging`. A job joins the concurrency group when it becomes ready, so runs can queue out of push order, and GitHub keeps only the newest pending run: an older pending one is cancelled. Deploying only the pushed commit's changed functions could then put older code on staging last, or drop a change. Each run instead deploys every function at `develop`'s tip when the job starts, so whichever run goes last deploys the newest `develop`, the same way `db push` applies every pending migration. The plan still lists which functions changed.

**Functions after migrations (RA-20-04).** `deploy-db.yml` now also deploys staging on a push to `develop` that changes migrations, behind the same reviewer. When a merge carries both, two runs wait: **approve Deploy database first**. If you approve the functions run first, it stops before deploying anything (staging lacks a migration on `develop`) and you re-run it after the migrations are in.

**Which functions skip the gateway's JWT check, and which the smoke reaches.** `NO_VERIFY_JWT` and `SMOKE_HEALTH` in `.github/scripts/functions-deploy.mjs`. `NO_VERIFY_JWT` must agree with the deploy line in each function's `index.ts` header; if one disagrees, the plan fails and nothing deploys, so a change to a function's gateway check also changes a `.github/**` file. A function with no deploy line keeps the check, with a warning. `analytics-forget`, `apple-token`, `invite-redeem` and `subscription-status` keep the check: their health routes cannot answer without a session, so the function list confirms them instead of the smoke. When S01 or S06 gives one an anonymous health route and `--no-verify-jwt`, add it to both lists in the same PR.

**Without the token.** The job deploys nothing. The run summary is titled "NOT DEPLOYED" and gives the commands to run from your computer, and a warning marks the run. Such a run is never evidence (AUTOMATION.md 2.12, planted failure 1). A change under `supabase/functions/escrow/` is never deployed and the plan says so (planted failure 2).

**The token (AF-06).** `SUPABASE_ACCESS_TOKEN_STAGING` on the `staging` Environment only: the narrowest token that can deploy Edge Functions to the staging project. Classic tokens carry the whole account; scoped tokens are a public alpha (AUTOMATION.md 2.2). This is the one exception to the no-token rule above (POPS-04): it is not in `deploy-db.yml` and not on `production`. CLI 2.119.0 accepts only tokens shaped `sbp_`, `sbp_oauth_` or `sbp_v0_` followed by 40 hex characters and refuses others before calling the API (**Verified** with the binary); whether a scoped token has that shape is **Unverified**.

Rules for the token, in this order:
1. **Set the `staging` reviewer and branch rules first** (founder step 2 above: required reviewer, deployment branches `main` and `develop`), then read them back in Settings > Environments > `staging` (AF-02, AF-07). Only then add the token. A push to `develop` that changes a function's code, which a coordinator merge of `packages/**` can do (D-107), deploys after that reviewer approves, and nothing else stands between such a merge and a project holding the family's letters.
2. **Never fall back to a classic access token** if a scoped one is refused. A classic token reaches every project on the account, production included. Leave the secret unset instead (the run says NOT DEPLOYED and you deploy from your computer), or keep staging in an organization the token cannot leave (AF-06).
3. **Until the approver account exists (AF-02)**, any session holding your GitHub credential can approve as you, so the reviewer is a policy, not a control. Hold the token until AF-02 is in place, or accept that for the alpha.

**Dispatch** needs the workflow on the default branch (`main` today, AF-05). Until then the push trigger on `develop` is the only way it runs; agents never dispatch it (AUTOMATION.md 2.11).

## Rollback

**Fix forward.** A bad migration is undone by a new migration with a later timestamp that reverses or corrects it, deployed through the same pipeline (staging, then a new tag). Never edit or delete an applied migration; the guard blocks it.

Emergency SQL in the dashboard is an incident, not a deploy: if you must run it, write the same change as a migration the same day so the repo, staging and production agree again. `supabase/APPLY.md` has tested emergency snippets (for example neutralising the consent gate).

**Restores.** Daily backups and PITR, per Supabase's backups page (**Verified** 3 Oct 2026 at supabase.com/docs/guides/platform/backups; plans and prices change, so re-check before relying on them):
- Daily backups: Pro keeps 7 days, Team 14, Enterprise up to 30. Free plan projects are told to export their own data with the CLI.
- PITR is an add-on for Pro, Team and Enterprise projects, needs at least the Small compute add-on, and offers 7, 14 or 28 days of retention, listed at $0.137, $0.274 and $0.55 per hour respectively.
- A restore makes the project inaccessible for a time that grows with database size, and everything written after the restore point is lost. Storage objects are not part of database backups (`supabase/APPLY.md`).
- **Unverified:** the monthly cost of Pro plus Small compute plus PITR for `scribe-prod`; work it out from the current pricing page before deciding.

A restore is the last resort. For a schema mistake, a forward-fix migration is faster and loses nothing.

## Known risks before the first deploy

- **DB-16:** `20261002010000_entries_select_policy.sql` has its own `begin` / `commit`. The CLI may run each file inside its own transaction, which could make this file fail or record history wrongly. **Unverified**; the first `db-cli.yml` run on a PR touching `supabase/**` (`supabase db reset`) will show it. If it fails, the fix needs a decision, because the file is listed as applied on `early-letters`.
- **Supabase internals:** the PGlite tests stub parts of Supabase (DB-18). `db-cli.yml` is the first check against the real Supabase Postgres image, so expect its first run to surface issues the PGlite suite cannot.
- **`db lint`** runs at error level only. Warnings are printed but do not fail the job.

## What was verified for this pipeline

| Item | How |
|---|---|
| Every `config.toml` key exists in Supabase CLI v2.119.0 | Read `apps/cli-go/pkg/config/templates/config.toml` at tag v2.119.0 in github.com/supabase/cli |
| `config.toml` parses and validates | Ran CLI 2.119.0 locally: `supabase start` loads and validates the full config before contacting Docker; it got past validation (a deliberately broken copy failed validation). `supabase db push --dry-run --db-url` loaded it and went straight to connecting, with no access token |
| CLI flags used (`db push --dry-run --yes --db-url`, `db lint --local --level --fail-on`, `db reset --local`, `start -x`, `stop --no-backup`) | `--help` of the installed 2.119.0 binary and the v2.119.0 source |
| Exclude names for `supabase start -x` | CLI help and `service-catalog.ts` at v2.119.0 |
| `supabase/setup-cli` v3.0.1 commit `45a513f8c64c0bc8e0e3dfe572b5c95be85f6359` and its `version` input | `git ls-remote` and its `action.yml` at that commit |
| Fuzz seed and run count | `packages/core/test/verify.fuzz.test.ts` reads `SCRIBE_FUZZ_SEED` and `SCRIBE_FUZZ_RUNS`; a random-seed 100000-run pass took about 20 s locally and needs `--testTimeout` (vitest's 5 s default fails it) |
| Workflows | actionlint 1.7.12 with shellcheck 0.10.0: no findings |
| `supabase functions deploy <name> --project-ref --use-api [--no-verify-jwt]` and `supabase functions list --project-ref -o json` in CLI 2.119.0 (16 Oct 2026) | `--help` of the 2.119.0 release binary, and that binary run against a local stand-in for the Management API (`--profile supabase-local`): deploy sends `verify_jwt: false` only with `--no-verify-jwt`; `list -o json` prints only a JSON array (`slug`, `status`, `version`, `updated_at`, `verify_jwt`) on stdout; no token, or a token of the wrong shape, stops before any request |
| The plan's import closure | equals the files the CLI uploads for every function on `develop` with #202, #139 and #178 (the same stand-in run), and equals `deno info --json` (deno 2.9.6) for every function on `develop`; `.github/workflows/deploy-scripts.yml` repeats the `deno info` comparison on every pull request that can change it |
| `deploy-functions.yml` and the smoke steps | each step's script run locally against the stand-in and #202's smoke (its HTTP answers stubbed): green, NOT DEPLOYED, a failed deploy, an unchanged version, a missing health route, missing secrets, a missing script, a manual run on `main` or for `escrow`, and `escrow`, `escrow-keys` or `escrow_v2` reaching the Deploy step (refused before any API call). After the tip rework (17 Oct): the deploy job's steps in order with the stand-in, a local PostgreSQL 16 holding a migration history, and #202's smoke at bb7aa06: green (4 of 4 confirmed, smoke GREEN), staging one migration behind (nothing deployed, the file named, smoke NOT RUN), and an unreachable database. `node --test .github/scripts/functions-deploy.test.mjs`: 28 tests, plus the `deno info` comparison |
| The migrations check | `supabase db push --dry-run` of CLI 2.119.0 against the same local PostgreSQL prints `{"upToDate": ..., "migrations": [...]}`; the script's psql read agrees with it one migration behind, up to date, and on a fresh database |
| `psql` on `ubuntu-24.04` | actions/runner-images `images/ubuntu/Ubuntu2404-Readme.md` and `scripts/build/install-postgresql.sh` (PostgreSQL 16 from the PGDG repository, client included) |

Not verified: no workflow has run on GitHub, and `supabase start` / `db reset` / `db lint` could not run here (no Docker daemon in the build environment). For the smoke and the functions: no run against a real Supabase project (the gateway's answer for a missing function, the pooler accepting psql's read-only transaction, `cron.job` visible to the role in `SUPABASE_DB_URL_STAGING`, and a scoped token working with the CLI are all open until the first staging run).
