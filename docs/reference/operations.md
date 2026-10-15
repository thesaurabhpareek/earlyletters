---
title: Operations
owner: reference-docs
covers: [.github/**, agents/roster.json, apps/mobile/eas.json, apps/mobile/scripts/**]
verified_at: b513056
verified_on: 2026-10-15
---

# Operations: CI, releases, environments, agents

How code is checked, how builds and database changes are released, which secrets exist (by name only), and the agent team in brief. Verified at `b513056`: `develop` at `d74e860` plus the documentation-leads commit, which adds two agents to `agents/roster.json`; nothing else on this page differs from `develop`.

## Workflows

<!-- facts:workflows -->
| Workflow | Name | Runs on |
|---|---|---|
| `.github/workflows/agents-check.yml` | Agents check | pull_request, push |
| `.github/workflows/agents.yml` | Agents | schedule, workflow_dispatch |
| `.github/workflows/ci.yml` | CI | pull_request, push |
| `.github/workflows/claude.yml` | Claude | issue_comment, pull_request_review_comment, pull_request_review, issues |
| `.github/workflows/db-cli.yml` | DB CLI | pull_request, workflow_call |
| `.github/workflows/deploy-db.yml` | Deploy database | push |
| `.github/workflows/migration-guard.yml` | Migration guard | pull_request, push |
| `.github/workflows/nightly.yml` | Nightly | schedule, workflow_dispatch |
| `.github/workflows/testflight.yml` | testflight | workflow_dispatch |
<!-- /facts:workflows -->

| Workflow | What it does | Required for merge |
|---|---|---|
| `ci.yml` | On every PR and on pushes to `develop` and `main`: install, then in parallel content rules plus `npm test`, `npm run test:db` (PGlite), Deno tests for Edge Functions and ops scripts, typecheck of packages and `apps/mobile`. A `required` job sums them up. Verifier fuzz runs with a fixed seed (`SCRIBE_FUZZ_SEED`) | Yes (`required`) |
| `migration-guard.yml` | Fails a change that edits, renames or deletes an applied migration, removes a line from `.github/migrations-applied.txt`, or adds a migration that sorts before the newest applied one (`.github/scripts/migration-guard.mjs`) | Yes |
| `db-cli.yml` | On PRs touching `supabase/**`: real Supabase CLI stack, `db reset` from every migration, `db lint`, then the PGlite suite. Also called by Nightly | No |
| `nightly.yml` | 10:23 UTC daily: verifier fuzz with a random seed and 10x runs, then the `db-cli` checks | No |
| `deploy-db.yml` | Staging on a push to `main` that changes migrations; production on a `db-v*` tag behind the `production` Environment. Never edits `migrations-applied.txt` | No; never run ([backend.md](backend.md#how-deploys-work)) |
| `testflight.yml` | Manual, on `develop` or an `ios-v*` tag: typecheck, tests, preflight, then an EAS build with the `testflight` profile, optionally submitted | No; never run |
| `agents.yml` | Every 30 minutes the dispatcher assigns work and starts up to six agents. Skipped entirely unless the repository variable `AGENTS_ENABLED` is `true` | No |
| `agents-check.yml` | Roster, charters, memory files and dispatcher tests stay consistent | No |
| `claude.yml` | `@claude` in an issue or PR comment, for the repository owner only | No |

Branch protection steps and the required check names: `.github/README.md`. Actions are pinned to commit SHAs in the database workflows (comments in each file).

## Branches and release lanes

From `CLAUDE.md`, `docs/release/TESTFLIGHT.md` and the workflows:

| Lane | Source | How | State |
|---|---|---|---|
| Feature work | Short branches (`feat/`, `fix/`, `chore/`, `docs/`, `exp/`) into `develop` by PR | CI plus migration guard | In use |
| TestFlight (internal) | `develop` | EAS profile `testflight`: store distribution, `EXPO_PUBLIC_APP_ENV=preview`, so the bundle id ends in `.preview`; server features and analytics off | No build made yet (`TESTFLIGHT.md`) |
| App Store | An `ios-v<major>.<minor>.<patch>` tag | EAS profile `production`; `app.config.ts` says not to upload it until the publisher domain is final | Not started |
| Database | `main`, then a `db-v*` tag | `deploy-db.yml` | Target projects do not exist yet (`docs/ops/DEPLOY.md`) |

`main` is always releasable (`CLAUDE.md`). Before a TestFlight build, `npm run preflight:testflight -w @scribe/mobile` (`apps/mobile/scripts/preflight-testflight.mjs`) checks configuration and prints WARN and UNVERIFIED lines; it needs no secrets. Build profiles in full: [mobile-app.md](mobile-app.md#build-profiles-and-switches).

`docs/release/journey/` is generated: 20 journeys of screenshots and step JSON from the web end-to-end flows (`apps/mobile/e2e-web`), with critiques and a PDF (`docs/release/journey/INDEX.md`).

## Environments and secrets

Names only, from `docs/ops/SECURITY.md`, `docs/ops/DEPLOY.md`, `apps/mobile/app.config.ts` and the workflow files. No value is recorded anywhere in the repo.

| Where | Names | Used by |
|---|---|---|
| EAS build env (non-secret, in `eas.json`) | `EXPO_PUBLIC_APP_ENV`, `EXPO_PUBLIC_SERVER_FEATURES`, `EXPO_PUBLIC_ANALYTICS` | The app build |
| EAS environment variables (not set in any profile) | `EXPO_PUBLIC_DOCS_BASE_URL`, `EXPO_PUBLIC_SUPABASE_URL` and key, `EXPO_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Signed documents host; server and analytics features |
| GitHub repository secret | `EXPO_TOKEN` | `testflight.yml` |
| GitHub Environment secrets | `SUPABASE_DB_URL_STAGING`, `SUPABASE_DB_URL_PROD` | `deploy-db.yml` |
| GitHub agent secrets and variables | `OPENROUTER_API_KEY`, `AGENTS_APP_CLIENT_ID`, `AGENTS_APP_PRIVATE_KEY`, `ANTHROPIC_API_KEY`, `CLAUDE_CODE_OAUTH_TOKEN`; variables `AGENTS_ENABLED`, `AGENTS_PAUSED` | `agents.yml`, `claude.yml` |
| Supabase Edge Function secrets | `PURGE_WORKER_SECRET`, `RESEND_API_KEY`, `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID`, `POSTHOG_HOST`, `TOKEN_KEK` (versioned), Apple sign-in key names | `purge-worker`, `analytics-forget` |
| Supabase Vault | `project_url`, `publishable_key`, `purge_worker_secret` | `supabase/cron/purge-worker.sql` |
| Founder's machine only | Pack signing key and key id for `scripts/packs/publish.ts` | Signing manifests and documents |

There is deliberately no `SUPABASE_ACCESS_TOKEN` in CI (POPS-04 in `docs/ops/DEPLOY.md`). Rotation steps: `docs/ops/SECURITY.md` section 2. Incident and deletion runbooks: `docs/ops/runbooks/`.

## Agent harness

A dispatcher in plain code (`scripts/agents/dispatch.mjs`) runs role agents from GitHub Actions; they open pull requests into `develop` and never merge. Everything else, including how agents keep context and spend: [`docs/agents/HARNESS.md`](../agents/HARNESS.md), rules in `docs/agents/OPERATING_MODEL.md`, decisions ADR 0018 to 0020.

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
