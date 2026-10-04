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

Rules the workflows enforce:
- Every deploy job has `permissions: contents: read` and checks out without persisting credentials.
- Each environment has its own concurrency group (`deploy-db-staging`, `deploy-db-production`) with `cancel-in-progress: false`, so a running push is never cancelled halfway.
- The only credential is one Postgres connection URL per environment, stored as an Environment secret. There is no `SUPABASE_ACCESS_TOKEN` anywhere (POPS-04), so CI cannot create, delete, pause or reconfigure projects, and cannot run `supabase link` or `supabase config push`.
- The production job refuses a tag whose commit is not on `main`.
- After a push, the job prints (and writes to the run summary) every migration file not yet listed in `.github/migrations-applied.txt`. It never edits that file. A pull request records them (see "After a deploy").
- The Supabase CLI is pinned to 2.119.0 in all three workflows, installed by `supabase/setup-cli` pinned to the v3.0.1 commit. Bump both deliberately.

Why the staging trigger is not a `paths:` filter: `deploy-db.yml` triggers on every push to `main` and on `db-v*` tags, and a small `migrations changed` job diffs the push for `supabase/migrations/`. This keeps tag pushes from ever being filtered out by a path rule.

## Environments

| Environment | Supabase project | Supabase org | GitHub Environment | Secret |
|---|---|---|---|---|
| Local | the CLI stack from `supabase/config.toml` (`project_id = "scribe"`) | none | none | none |
| Staging | `scribe-staging` (**does not exist yet**) | "Early Letters" (**does not exist yet**) | `staging` | `SUPABASE_DB_URL_STAGING` |
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
   - Deployment branches and tags: "Selected branches and tags", add branch `main`.
   - Environment secret `SUPABASE_DB_URL_STAGING` = the staging session pooler URL.
   - No reviewers needed.
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

Not verified: no workflow has run on GitHub, and `supabase start` / `db reset` / `db lint` could not run here (no Docker daemon in the build environment).
