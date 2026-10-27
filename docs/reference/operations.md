---
title: Operations
owner: reference-docs
covers: [.github/**, agents/roster.json, apps/mobile/eas.json, apps/mobile/scripts/**]
verified_at: 1c6795b
verified_on: 2026-10-27
---

# Operations: CI, releases, environments, agents

How code is checked, how builds and database changes are released, which secrets exist (by name only), and the agent team in brief. Verified at `develop` `1c6795b`. Who may merge what is D-107 and D-117 in the [decision register](../decisions/INDEX.md). The release lanes follow ADR 0022 and the alpha profiles D-106; the proposed release automation (ADR 0026, `docs/release/AUTOMATION.md`) is only partly on `develop` (no `release-ios.yml` yet).

## Workflows

<!-- facts:workflows -->
| Workflow | Name | Runs on |
|---|---|---|
| `.github/workflows/agents-check.yml` | Agents check | pull_request, push |
| `.github/workflows/agents.yml` | Agents | schedule, workflow_dispatch |
| `.github/workflows/ci.yml` | CI | pull_request, push |
| `.github/workflows/claude.yml` | Claude | issue_comment, issues |
| `.github/workflows/db-cli.yml` | DB CLI | pull_request, workflow_call |
| `.github/workflows/deploy-db.yml` | Deploy database | push, workflow_dispatch |
| `.github/workflows/deploy-functions.yml` | Deploy functions | push, workflow_dispatch |
| `.github/workflows/deploy-scripts.yml` | deploy scripts | pull_request |
| `.github/workflows/ios-compile.yml` | iOS compile | pull_request, workflow_dispatch |
| `.github/workflows/kill-harness.yml` | Kill harness (DL-01, DL-02) | pull_request, workflow_dispatch, schedule |
| `.github/workflows/migration-guard.yml` | Migration guard | pull_request, push |
| `.github/workflows/nightly.yml` | Nightly | schedule, workflow_dispatch |
| `.github/workflows/testflight.yml` | testflight | workflow_dispatch |
<!-- /facts:workflows -->

| Workflow | What it does | Required for merge |
|---|---|---|
| `ci.yml` | On every PR and on pushes to `develop` and `main`: install, then in parallel content rules plus `npm test` (which still runs when content rules fail), `npm run test:db` (PGlite; 15 minute limit, the plan checks seed 250 families x 400 letters and check no p95 budget, D-114), Deno tests for Edge Functions and ops scripts, typecheck of packages and `apps/mobile`, and the seam guard (below). A `required` job sums them up. Verifier fuzz runs with a fixed seed (`SCRIBE_FUZZ_SEED`) | Yes (`required`) |
| `seam-guard` job in `ci.yml` | Release check B-8: no e2e seam code in any bundle that can reach TestFlight or the App Store. Its own tests run on every PR; the exports of each store profile in `eas.json` (about four minutes) run only when the diff touches a path that can reach the bundle (`seam-guard.mjs --changed-since`), plus an e2e positive control. `testflight.yml` runs the same script before EAS | Yes (inside `required`) |
| `migration-guard.yml` | Fails a change that edits, renames or deletes an applied migration, removes a line from `.github/migrations-applied.txt`, or adds a migration that sorts before the newest applied one (`.github/scripts/migration-guard.mjs`) | Yes |
| `db-cli.yml` | On PRs touching `supabase/**`: real Supabase CLI stack, `db reset` from every migration, `db lint`, then the PGlite suite twice: without Supabase's automatic grants, and again with the old ones (`SCRIBE_DEFAULT_GRANTS=legacy`). Also called by Nightly | No |
| `nightly.yml` | 10:23 UTC daily: verifier fuzz with a random seed and 10x runs (both fuzz test files), the `db-cli` checks, `perf` (plans and p95 budgets at 1,000 families x 400 letters; a red from budgets alone is advisory, D-114) and `legacy-grants`. A `report` job opens one `nightly` issue when a scheduled run is red, comments on it while red, and closes it on green; it holds only `issues: write` and writes the run link and job names, no content. GitHub fires the schedule only once the file is on the default branch | No |
| `deploy-db.yml` | Staging on a push to `develop` that changes migrations (a manual run on `develop` only), then the content-free staging smoke with `--db-only`; production on a `db-v*` tag on `main` behind the `db-production` Environment (named so it is not Vercel's `Production`). A push to `main` deploys nothing to a database (R-019, #205). Never edits `migrations-applied.txt` | No; never run ([backend.md](backend.md#how-deploys-work)) |
| `deploy-functions.yml` | On a push to `develop` that changes function code or its deploy rules (or a manual run on `develop`): deploys every Edge Function at `develop`'s tip to staging, except `escrow`, after staging has every migration; checks each is active, then the health smoke. Waits in the `staging` Environment; without `SUPABASE_ACCESS_TOKEN_STAGING` it deploys nothing. Plan and checks: `.github/scripts/functions-deploy.mjs` | No; never run |
| `deploy-scripts.yml` | On PRs that can change what `functions-deploy.mjs` decides: its tests, read-only, no secrets | No (path-filtered) |
| `testflight.yml` | Manual, on `develop`, with a `profile` choice: `testflight` (alpha build 1, servers off) or `preview` (alpha build 2, servers on against staging). Typecheck, tests, preflight for that profile, the seam guard, then an EAS build with a pinned `eas-cli`, optionally submitted. It runs in the `testflight` Environment, which holds `EXPO_TOKEN` and admits `develop` only; a run on an `ios-v*` tag passes the job's `if` but is refused by that rule until the founder decides where release candidates build | No; never run |
| `ios-compile.yml` | On PRs that change `apps/mobile` or `packages`: a `launch` job builds the store profile's JavaScript in Release for the simulator, installs it and fails if the app is gone 20 s later (this would have caught the build-1 launch crash, #276). A `compile` job builds the iOS project for the simulator without signing, only when native files change. macOS runner, no secrets; `sim-crash-report.sh` prints why an app stopped | No |
| `kill-harness.yml` | The kill drills DL-01 (kill while recording) and DL-02 (kill during save) on a macOS simulator, with a planted-failure self-check first. A smoke run on PRs that touch the harness or the ADTS code; nightly sizes on a schedule; gate sizes (500 kills, B2-11) by manual dispatch. Its `release-launch` job repeats the store-launch check on dispatch and schedule. No secrets | No |
| `agents.yml` | Every 30 minutes the dispatcher assigns work and starts up to six agents. Skipped entirely unless the repository variable `AGENTS_ENABLED` is `true` | No |
| `agents-check.yml` | Roster, charters, memory files and dispatcher tests stay consistent | No |
| `claude.yml` | `@claude` in an issue or an issue or PR comment, for the repository owner's own typing only (not posted through a GitHub App). Hardened (ADR 0026 decision 3): only `issue_comment` and `issues: opened` events (review events removed), a pull request whose head is a fork is refused, `npm ci` instead of a restored `node_modules`, every action pinned to a commit SHA | No |

Branch protection steps and the required check names: `.github/README.md`. Actions are pinned to commit SHAs in the database workflows (comments in each file).

## Branches and release lanes

From `CLAUDE.md`, ADR 0022 (`docs/adr/0022-release-engineering.md`), `docs/release/TESTFLIGHT.md` and the workflows:

| Lane | Source | How | State |
|---|---|---|---|
| Feature work | Short branches (`feat/`, `fix/`, `chore/`, `docs/`, `exp/`) into `develop` by PR | CI plus migration guard | In use |
| TestFlight (alpha, D-106) | `develop` | Two EAS profiles, both store distribution, `EXPO_PUBLIC_APP_ENV=preview` (bundle id ends in `.preview`), analytics, backup and status report off, `EXPO_PUBLIC_ENGLISH_ONLY=on`: `testflight` is build 1 (server features off), `preview` is build 2 (server features on, against staging, values from the EAS `preview` environment). A third profile, `e2e`, is a simulator build with the test seams, never uploaded | No build made yet (`TESTFLIGHT.md`) |
| App Store | A `release/<major>.<minor>` branch cut from `main` at freeze, with fixes cherry-picked from `develop`; an `ios-v<x.y.z>-rc.<n>` tag builds a candidate, and `ios-v<x.y.z>` marks the one released (D-089, ADR 0022) | EAS profile `production`; `app.config.ts` says not to upload it until the publisher domain is final. The store workflow (BL-437) and the version file (BL-436) are in open PRs #110 and #109, so no workflow on `develop` builds from an RC tag | Not started: `release/1.0` not cut, no RC tags (`docs/release/1.0.0.md`) |
| Database and Edge Functions | Staging from `develop`; production from a `db-v*` tag on `main` (first used at AF-42, after the alpha) | `deploy-db.yml`, `deploy-functions.yml` (staging only) | Target projects do not exist yet (`docs/ops/DEPLOY.md`) |

`main` is always releasable (`CLAUDE.md`). There are no over-the-air updates in v1.0: fixes ship as new builds (D-091). Release record and readiness for v1.0: `docs/release/1.0.0.md`. Before a TestFlight build, `npm run preflight:testflight -w @scribe/mobile` (build 1) or `npm run preflight:alpha -w @scribe/mobile` (build 2, `--profile preview`) (`apps/mobile/scripts/preflight-testflight.mjs`) checks configuration and prints PASS, WARN, FAIL and UNVERIFIED lines, then the founder steps from `TESTFLIGHT.md` still open; it needs no secrets and goes offline. It fails when the profile's server switch, English-only switch or build flags are not as the alpha needs, when a store profile sets `EXPO_PUBLIC_E2E`, when a Google client id is present, when an `EXPO_PUBLIC_` value in the shell is a Supabase secret key, when the generated privacy manifest differs from the config, and, since D-115, when `packages/api/src/keys.ts` has no trusted signing key or no signed pack manifest is published (`PACK_MANIFEST` is `null` in `supabase/functions/config/published.ts`), because without them the build cannot transcribe. It also checks that the generated native project sets `ios.deploymentTarget` 17.0 (D-098). Build profiles in full: [mobile-app.md](mobile-app.md#build-profiles-and-switches).

`docs/release/journey/` is generated: 20 journeys of screenshots and step JSON from the web end-to-end flows (`apps/mobile/e2e-web`), with critiques and a PDF (`docs/release/journey/INDEX.md`).

## Environments and secrets

Names only, from `docs/ops/SECURITY.md`, `docs/ops/DEPLOY.md`, `apps/mobile/app.config.ts` and the workflow files. No value is recorded anywhere in the repo.

| Where | Names | Used by |
|---|---|---|
| EAS build env (non-secret, in `eas.json`) | `EXPO_PUBLIC_APP_ENV`, `EXPO_PUBLIC_SERVER_FEATURES`, `EXPO_PUBLIC_BACKUP`, `EXPO_PUBLIC_STATUS_REPORT`, `EXPO_PUBLIC_ANALYTICS`, `EXPO_PUBLIC_DOCS_BASE_URL` (since #126); `EXPO_PUBLIC_ENGLISH_ONLY` in the two alpha profiles; `EXPO_PUBLIC_E2E` in the `e2e` profile only | The app build; the signed documents host |
| EAS environment variables (not set in any profile) | `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (build 2), optional `EXPO_PUBLIC_EMAIL_OTP_LENGTH`, `EXPO_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` (neither alpha build offers Google; the preflight fails if one is set) | Server, analytics and Google sign-in features |
| GitHub Environment secret | `EXPO_TOKEN` in the `testflight` Environment (develop only). An interim repository secret of the same name is to be deleted after the first green run | `testflight.yml` |
| GitHub Environment secrets | `SUPABASE_DB_URL_STAGING`, and `SUPABASE_DB_URL_PROD` in `db-production`; in `staging` also `SUPABASE_STAGING_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN_STAGING`, `SUPABASE_STAGING_URL`, `SUPABASE_STAGING_PUBLISHABLE_KEY` | `deploy-db.yml`, `deploy-functions.yml`, the staging smoke |
| GitHub agent secrets and variables | Secrets `OPENROUTER_API_KEY`, `AGENTS_APP_PRIVATE_KEY`, `ANTHROPIC_API_KEY`, `CLAUDE_CODE_OAUTH_TOKEN`; repository variables `AGENTS_APP_CLIENT_ID`, `AGENTS_BOT_LOGINS`, `AGENTS_ENABLED`, `AGENTS_PAUSED` | `agents.yml`, `claude.yml`, `scripts/agents/lib.mjs` |
| Supabase Edge Function secrets | `PURGE_WORKER_SECRET`, `RESEND_API_KEY`, `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID`, `POSTHOG_HOST`, `TOKEN_KEK` (versioned), Apple sign-in key names | `purge-worker`, `analytics-forget` |
| Supabase Vault | `project_url`, `publishable_key`, `purge_worker_secret` | `supabase/cron/purge-worker.sql` |
| Founder's machine only | Pack signing key and key id (`EL_SIGNING_KEY`, `EL_SIGNING_KEY_ID`, or a `--key-file` outside every git tree); the upload variables `PACKS_S3_ENDPOINT`, `PACKS_S3_BUCKET`, `PACKS_S3_ACCESS_KEY_ID`, `PACKS_S3_SECRET_ACCESS_KEY`, `PACKS_S3_REGION` | `scripts/packs/publish.ts` (release, upload, verify; [speech-and-languages.md](speech-and-languages.md#language-packs)). `scripts/packs/secret-scan.mjs` fails a commit or test run that finds either secret in git |

There is deliberately no `SUPABASE_ACCESS_TOKEN` in CI (POPS-04 in `docs/ops/DEPLOY.md`). Rotation steps: `docs/ops/SECURITY.md` section 2. Incident and deletion runbooks: `docs/ops/runbooks/`.

## Agent harness

A dispatcher in plain code (`scripts/agents/dispatch.mjs`) runs role agents from GitHub Actions; they open pull requests into `develop` and never merge. Everything else, including how agents keep context and spend: [`docs/agents/HARNESS.md`](../agents/HARNESS.md), rules in `docs/agents/OPERATING_MODEL.md`, decisions ADR 0018 to 0021. Five **stewards** (department `standards`, kind `steward`) own the engineering compendium in `docs/engineering/` and review pull requests that touch their paths; delivery agents build (ADR 0021, `docs/agents/OPERATING_MODEL.md` section 1). The two documentation agents, `decision-records` and `reference-docs`, run daily and keep `docs/decisions` and `docs/reference` current (`agents/roster.json`).

<!-- facts:agents -->
| Handle | Title | Kind | Department |
|---|---|---|---|
| `red-team` | Principal Reviewer (red team) | reviewer | quality |
| `product` | Product Manager | planner | product |
| `decision-records` | Decision Records Lead | worker | operations |
| `reference-docs` | Reference Docs Lead | worker | operations |
| `qa` | Quality Engineer | worker | quality |
| `mobile` | Mobile Engineer (iOS first, Expo) | worker | engineering |
| `data-architect` | Data Architect (Supabase) | worker | data |
| `security` | Security Engineer | worker | engineering |
| `privacy` | Privacy Engineer | worker | engineering |
| `speech` | Speech and Applied Science Engineer | worker | applied-science |
| `sync` | Sync and Backend Engineer | worker | engineering |
| `payments` | Payments Engineer (StoreKit) | worker | engineering |
| `design-systems` | Design Systems and Accessibility Lead | worker | design |
| `analytics` | Analytics Engineer | worker | data |
| `content` | Brand and Content Lead | worker | brand |
| `principal-architect` | Principal Architect | steward | standards |
| `data-steward` | Data Steward | steward | standards |
| `security-architect` | Identity and Security Architect | steward | standards |
| `compliance-engineer` | Privacy and Compliance Engineer | steward | standards |
| `ai-eng-lead` | AI-Assisted Engineering Lead | steward | standards |
| `decision-science` | Decision Scientist | worker | data |
| `legal` | Legal Drafting (counsel-facing) | worker | legal |
| `marketing` | Growth and Marketing Lead | worker | growth |
| `support` | Customer Support Lead | worker | support |
| `ops` | Release and Operations Engineer | worker | operations |
| `chief-of-staff` | Chief of Staff | digest | operations |
<!-- /facts:agents -->

## Where to look next

| Question | Doc |
|---|---|
| How to build for TestFlight | `docs/release/TESTFLIGHT.md` |
| How database deploys work | `docs/ops/DEPLOY.md`, `supabase/APPLY.md` |
| Secrets, keys, least privilege | `docs/ops/SECURITY.md` |
| Domains, universal links, auth setup | `docs/ops/DOMAINS.md`, `docs/ops/AUTH_SETUP.md` |
| App size budget | `docs/ops/APP_SIZE.md` |
