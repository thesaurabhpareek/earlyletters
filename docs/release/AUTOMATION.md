# Release automation: the pipeline, the founder setup and the work packages

Status: proposed plan, Fri 16 Oct 2026. Author: release automation lead, for the coordinator to assign. Decision record: [ADR 0024](../adr/0024-release-automation-pipeline.md) (proposed). Builds on ADR 0022 and D-089 to D-092 (release engineering, merged 15 Oct in #108), D-041, D-097, D-100, D-106, D-107. File owner after merge: S20 (`docs/release/**`).

The founder's ask: "setup proper actions and journey to automate everything." This file is the plan only. Nothing here changes a workflow, a secret or a setting; the work packages in section 5 do, each in its owning stream's files, one concern per PR.

Labels, used on every claim about a vendor:
- **[V]** verified on the vendor's own page or source on 16 Oct 2026; the number points at section 9.
- **[R]** a fact in this repository or its GitHub settings, named.
- **[U]** unverified, with what would confirm it.
- **[E]** estimate. **[Rec]** recommendation.

Agents in this sandbox cannot reach expo.dev, docs.expo.dev, appstoreconnect.apple.com, docs.github.com, vercel.com or supabase.com directly. Vendor facts were read from developer.apple.com (reachable), from the vendors' own documentation sources published on GitHub (github/docs, expo/expo, expo/eas-cli, fastlane), from npm package tarballs, and through the Vercel and Supabase documentation tools connected to this workspace. Section 9 says which.

## 0. Read this first

**What changes the plan (found on 16 Oct):**
1. **Dispatch and schedules cannot work today.** The default branch is `main` [R], and `main` holds only `ci.yml`, `migration-guard.yml`, `web.yml` and `web-e2e.yml` [R]. GitHub triggers `workflow_dispatch` and `schedule` only for workflow files on the default branch, and on github.com runs `pull_request_target` from the default branch [V1]. So `testflight.yml` cannot be dispatched by an agent or the founder, `nightly.yml` and `agents.yml` never run on schedule, and PR #30's fence would run a copy that does not exist. The Actions API lists none of `testflight.yml`, `deploy-db.yml`, `nightly.yml` or `agents.yml` [R: list workflows, 16 Oct]. Fix: make `develop` the default branch (founder, one setting; ADR 0024 decision 1).
2. **The Vercel failure on `develop` PRs is a lineage split, not a Vercel bug.** The project builds every branch with root directory `apps/web`; `apps/web` exists only on `main`; the build stops at `build-container-init` with `NOW_SANDBOX_WORKER_ROOTDIR_NOT_EXIST` [R: deployment `dpl_3fbe7smLCY5TzbuQHR8zJLvrm98b`, PR #152]. A `vercel.json` setting cannot help, because Vercel reads it from the root directory of the branch it deploys [V30]. Fix: one founder-merged PR brings `main` into `develop` (the merge-back rule in `docs/DEVELOPMENT.md`, #79).
3. **Most of the store journey is automatable through Apple's API** [V12]: TestFlight groups, Beta App Review, What to Test, build expiry, screenshots, age rating, review submission and phased release. **App Privacy answers are not** (no API resource [V12, V16]; fastlane's action needs an Apple ID session [V29]). They stay a founder step in App Store Connect.
4. **TestFlight feedback is readable by API and by webhook** [V12, V19], and each crash submission carries the tester's `email` and `comment` [V12]. The repository is public, so workflow logs and issues are public. Feedback therefore goes through a **private** repository; public issues get content-free pointers only (section 2.7).
5. **The speech pack pipeline is built** (#162 on #126): key, release, upload, verify, with signing on the founder's computer. This plan adds only a CI upload of documents the founder already signed (section 2.6), so the key never enters CI.
6. **Vercel is on Hobby, which is for non-commercial use** (coordinator, verified 15 Oct [V31]). The site sells a subscription, so Pro is a founder prerequisite. Price: $20 per developer seat a month in third-party reports [U: vercel.com/pricing, not reachable here].

**What runs on its own once this lands, and where the founder clicks:**

```
PR ----------> CI, migration guard, fence, security, web (required checks)                 no click
merge develop -> staging DB and functions ------------------------- staging env ---------- 1 click (approve)
nightly / dispatch -> EAS build -> TestFlight internal "Founder" --- testflight env ------ no click
promote build -> Family, Friends, external + Beta App Review ------- testers env --------- 1 click per promotion
release PR -> release/x.y -> RC tag -> production build ------------ app-store env -------- 1 click per RC
store text, screenshots, submit for review, phased release --------- app-store env -------- 1 click each
signed packs (founder signs on own computer) -> R2 upload ---------- packs env ------------ 1 click
db-v tag -> production DB ------------------------------------------ production env ------- 1 click
website: merge to main (founder) -> Vercel production -------------- the merge is the click
health probes, advisors, feedback pointers, reminders -------------- health env, private repo, no click
```

Agents start every run with the GitHub MCP tools (`actions_run_trigger`, method `run_workflow`) and read results from the run log and job summary (`actions_get`, `get_job_logs`). No agent approves a deployment (section 2.11).

**For the alpha on Thu 29 Oct**, only five items are on the critical path: the default branch (F-01), environments `staging` and `testflight` (F-05), #145 merged (two profiles), staging from `develop` (WP RA-20-04), and the packs host (#162, founder-run is fine). Everything else lands after the alpha in the order of section 6.

## 1. What exists, and what is missing

### 1.1 Workflows on `develop` (c7e08d1) and `main` (69299f8)

| File | Branch | What it does today [R] | Missing for this plan |
|---|---|---|---|
| `ci.yml` | both (develop's is newer) | install with a `node_modules` cache, then `npm test`, `npm run test:db`, `npm run test:functions`, typecheck incl. `apps/mobile`; `required` sums them | Lint, `expo config` check, guard tests and SHA pins are on #30; not enforced: `develop` has no branch protection [R: the GitHub API, quoted in the alpha plan #152 section 3.4] |
| `migration-guard.yml` + `.github/scripts/migration-guard.mjs` | both | fails a PR that edits, renames or deletes an applied migration | Trusted-ref guard and the reviewed exception are on #30 |
| `db-cli.yml` | develop | on `supabase/**` PRs: real Supabase stack, `db reset`, advisory lint, `test:db` | Path-filtered at workflow level, so it cannot be a required check (a path-skipped workflow stays Pending and blocks merging [V8]); move the filter into a job `if:` (a skipped job reports Success [V8]) |
| `deploy-db.yml` | develop | staging on a push to `main` that changes migrations; production on a `db-v*` tag through environment `production`; one session-pooler URL per environment; never edits `migrations-applied.txt` | Staging from `develop` (manual run on branch `chore/staging-from-develop`, no PR yet); staging approval; Edge Functions |
| `nightly.yml` | develop | random-seed verifier fuzz and the real-stack DB checks | Never runs: schedules run only from the default branch [V1] |
| `testflight.yml` | develop (#145 extends) | manual: typecheck, tests, preflight, then `eas build --non-interactive --wait [--auto-submit]`; #145 adds a `profile` input (`testflight` or `preview`) and pins eas-cli 24.10.0 | Cannot be dispatched (not on the default branch [V1]); `EXPO_TOKEN` is a repository secret; no What to Test; no group targeting; no build cap |
| `agents.yml`, `agents-check.yml`, `claude.yml` | develop | agent dispatcher (off until `AGENTS_ENABLED`), roster checks, `@claude` for the owner | `agents.yml` schedule and `claude.yml` (`issue_comment` runs the default branch's file [V1]) need `develop` as default |
| `web.yml`, `web-e2e.yml` | main | website typecheck, tests, two builds; Playwright e2e | Not on `develop`; path-filtered, so not required |
| `.github/actions/setup` | both | Node 22 and the cached `node_modules` | none |

### 1.2 App config and scripts

| Item | Where | State [R] | Missing |
|---|---|---|---|
| `apps/mobile/eas.json` | develop | four profiles, all switches off; `appVersionSource: remote`; empty `submit` profiles | #145: `preview` becomes the servers-on store build against staging; `ascAppId` and `groups` per submit profile wait for the App Store Connect record |
| `apps/mobile/app.config.ts` | develop | bundle id per `EXPO_PUBLIC_APP_ENV` (`.preview` for both alpha profiles), privacy manifest, `usesNonExemptEncryption: false` | `extra.eas.projectId` and `owner` after `eas init` (BL-339); version from `version.json` (#109) |
| `apps/mobile/scripts/preflight-testflight.mjs` | develop, extended on #145 | no-network checks of profile, config, icons, env files, packs, privacy manifest, native project; #145 adds `--profile`, the alpha checks and a FAIL on a Supabase secret key | Called by every build workflow as is; nothing to add |
| `scripts/packs/**`, `docs/ops/PACKS_HOSTING.md` | #162 on #126 | `keygen.mjs`, `publish.ts release | upload | verify | serve`; signing on the founder's computer; R2 upload by SigV4 with a bucket-scoped token; manifest last; nothing deleted | A keyless `assemble` for CI (RA-07-01) |
| `scripts/ops/restore-drill.ts`, `docs/ops/runbooks/*` | develop | restore drill and replay; incident runbooks | A schedule that opens the quarterly drill issue |
| `apps/mobile/e2e/**` | develop; #176 adds the P0 nightly set | Maestro flows, `bin/run-p0-nightly.sh`, `ci/ios-e2e.yml.example` (macOS sketch) | The real workflow file (a request to S20 on #176) |

### 1.3 The branches the brief named

| Branch (PR) | What it already does | What is missing or stale |
|---|---|---|
| `chore/alpha-release-config` (#145, S20, open) | Alpha build 1 (`testflight`, servers off) and build 2 (`preview`, servers on against staging); build flags `EXPO_PUBLIC_BACKUP` and `EXPO_PUBLIC_STATUS_REPORT`; `preflight:alpha`; the 12-step founder table in `docs/release/TESTFLIGHT.md`; `docs/release/ENVIRONMENTS.md` with every value by name and where it lives; the kill path; eas-cli pinned; it already points readers to this file | `EXPO_TOKEN` as a repository secret (this plan moves it to environment `testflight`); `ascAppId` and groups; What to Test from a file |
| `chore/staging-from-develop` (no PR) | `deploy-db.yml` gains a manual run that deploys `develop` to staging and fails on any other ref; production only on a pushed `db-v*` tag | Not opened as a PR; dispatch needs the default-branch fix; no automatic run on merge |
| `ci/release-ios-workflow` (#110, stacked on #109) | `release-ios.yml`: RC tag checks (tag, `version.json` and `release/x.y` agree), production build with `--freeze-credentials --no-wait --auto-submit`, GitHub Release on `ios-v<x.y.z>`, metadata job running `eas metadata:push` with the review contact from a secret; jobs gated by `app-store` | Submit for review, screenshots upload, phased release, external groups; its Run workflow button needs the file on the default branch [V1] |
| `feat/release-version-metadata` (#109, stacked on #108's branch) | `apps/mobile/version.json`, `app.config.ts` reads it, `apps/mobile/store.config.json` generated from `packages/content` with a drift test, a guard that refuses a listing promising sharing while the switch is off (BL-440) | The BL-440 guard predates D-100 (server features on); S16 and S20 re-check it for the server-on listing |
| `docs/release-engineering-v2` (#108) | Merged on 15 Oct (d3a54d3): D-089 to D-092, ADR 0022, `docs/release/1.0.0.md` | Its 1.0 dates predate D-101 and D-106 |
| `docs/release-train-d089` (#111, open) | `docs/ops/RELEASE.md`: the release train, TestFlight facts, submission checklist, rollback by layer, per-release checklist | Written for the on-device v1.0; this plan links it, not copies it |
| `chore/release-plan` (#76, base `release/ios-v1.0`) | The 4 Oct execution plan and operating model, and a journey audit, on the old `main` lineage | Superseded by PRD V2 08 and the alpha plan (#152); not a base for this work |
| `release/ios-v1.0` | A branch at #74 on the `main` lineage, base of #76 | Its name predates ADR 0022's `release/<major>.<minor>`; nothing builds from it; leave it (the coordinator may close #76) |
| `agent/ops/ci-health-release-readiness` (#44, closed) | `docs/ops/CI_HEALTH.md` (162 runs on 3 Oct: green CI median 1 min 36 s; 182 job-minutes, free on a public repo) and `RELEASE_READINESS.md` | A dated report; its method (REST over runs and jobs) is what `health.yml` reuses |
| `ci/hardening` (#30, open) | `fence.yml` (`pull_request_target`, rules read from the base commit, fails closed), `security.yml` (gitleaks with a checksum-pinned binary, `npm audit` through a gate with a dated ignore list), `dependabot.yml` (npm with Expo and React Native grouped, Actions), SHA pins, trusted-ref migration guard | Needs the default-branch fix to run at all; then it is the PR-check backbone |
| `feat/packs-hosting-pipeline` (#162 on #126) | Section 1.2 | Open point: `packs.earlyletters.app` needs `earlyletters.app` as a Cloudflare zone, while D-063 records both domains at Porkbun (founder step F-14) |
| `chore/web-auth-wiring` (#144, `main`) | `/auth/confirm` and the AASA file for the production and `.preview` ids, from `APPLE_TEAM_ID` and `IOS_BUNDLE_ID` | Health probe of the AASA file (section 2.8) |

## 2. The pipeline

### 2.0 GitHub environments

Every environment: **"Allow administrators to bypass configured protection rules" off** (by default administrators can bypass [V2]; turning it off is available on public repositories [V2]). Self-review stays allowed, because the founder is the only reviewer and starts most runs (with "prevent self-review" on, the person who started a run cannot approve it [V2, V3]). Environment secrets reach only jobs that name the environment, and only after approval when one is required [V2].

| Environment | Required reviewer | Deployment refs | Secrets (names only) | Used by |
|---|---|---|---|---|
| `staging` | founder | `develop`, `main` | `SUPABASE_DB_URL_STAGING` (exists in DEPLOY.md), `SUPABASE_ACCESS_TOKEN_STAGING`, `SUPABASE_STAGING_PROJECT_REF` | `deploy-db.yml`, `deploy-functions.yml` |
| `production` | founder | tag `db-v*` | `SUPABASE_DB_URL_PROD` (exists); later `SUPABASE_ACCESS_TOKEN_PROD`, `SUPABASE_PROD_PROJECT_REF` | `deploy-db.yml`, later `deploy-functions.yml` |
| `testflight` | none | `develop`, `release/*`, tag `ios-v*` | `EXPO_TOKEN` (preview lane) | `testflight.yml` |
| `testers` | founder | `develop`, `release/*`, tag `ios-v*` | `ASC_API_KEY_ID`, `ASC_API_ISSUER_ID`, `ASC_API_KEY_P8`; `EXPO_TOKEN` (read only: looks up which profile made a build) | `testflight-testers.yml` |
| `app-store` | founder | tag `ios-v*`, `release/*` (ADR 0022) | `EXPO_TOKEN` (store lane), `ASC_REVIEW_CONTACT_JSON` (ADR 0022), `ASC_API_KEY_ID`, `ASC_API_ISSUER_ID`, `ASC_API_KEY_P8` | `release-ios.yml` |
| `packs` | founder | `develop`, `main` | `PACKS_S3_ENDPOINT`, `PACKS_S3_BUCKET`, `PACKS_S3_ACCESS_KEY_ID`, `PACKS_S3_SECRET_ACCESS_KEY` (names from #162) | `packs-publish.yml` |
| `health` | none | `develop` (the default branch, for schedules) | `HEALTH_STAGING_API_URL`, `SUPABASE_LINT_DB_URL_STAGING` (a read-only role); later the production twins | `health.yml`, `advisors.yml` |

Repository variables (not secret; visible to collaborators, and printed in public logs if echoed, so no project URL or ref goes here): `EAS_CLI_VERSION` (one pin for every workflow; #145 and #110 both pin 24.10.0 today, npm's latest is 24.14.0 of 14 Oct [V28]), `EAS_IOS_BUILD_CAP` (builds a month the automation may start), `NIGHTLY_PROFILE` (`preview` by default), `R17_PASSED` (`true` only after the founder records the R-17 sign-off, D-100), `AGENTS_ENABLED` (exists).

Outside GitHub: EAS holds the signing credentials, the App Store Connect API key EAS Submit uses, and the `EXPO_PUBLIC_*` values (#145 `ENVIRONMENTS.md`). App Store Connect team keys reach every app on the account, whatever their role [V13, V14], so each key has one job and is revoked on its own.

### 2.1 Pull request checks

**`ci.yml`** (exists; #30 extends)
| | |
|---|---|
| Trigger | `pull_request`, push to `develop` and `main` |
| Does | install, then unit and content rules, PGlite database rules, Deno functions, typecheck; #30 adds lint (skips with a notice until a root `lint` script exists), `expo config --type public`, the `.github/scripts` tests, SHA pins, `ubuntu-24.04`. Add `actionlint` over `.github/workflows` [Rec] |
| Inputs, secrets | none |
| Environment | none |
| Owner | S20 |
| Proof | branch protection lists `required`; a planted failing test turns `required` red (S19 evidence file) |

**`migration-guard.yml`, `fence.yml`, `security.yml`** (#30): as section 1.3. `fence` and `applied migrations unchanged` become required; `secrets (full history)` optional; `npm audit (production, high)` stays unrequired so a new advisory never blocks unrelated work (#30 README). Proof: the fence and guard tests on #30 (`fence-paths.test.mjs` runs the step's exact `run:` block against a stub) plus a planted `supabase/**` change without the label failing in a real PR.

**`db-cli.yml`, `web.yml`, `web-e2e.yml`**: move the path filter into a `changes` job and gate the work job with `if:`; then all three can be required, because a skipped job reports Success while a path-skipped workflow stays Pending [V8]. Owner S20. Proof: a docs-only PR shows them green-skipped; a `supabase/**` PR runs the stack.

**The Vercel status on `develop` PRs** (journey item 1):
| Option | Evidence | Verdict |
|---|---|---|
| A. One lineage: merge `main` into `develop` once (RA-20-01) | The error is the missing root directory [R]; `docs/DEVELOPMENT.md` already requires merging `main` back into `develop` (#79) | **[Rec]** durable; previews of `develop` branches then build the site like `main` PRs |
| B. Disable preview deployments (`previewDeploymentsDisabled` in the project API) | Field exists in Vercel's update-project reference [V30] | Stopgap only: also removes previews of website PRs on `main` (CI still builds the site in `web.yml`) |
| C. Ignored Build Step in the dashboard (`commandForIgnoringBuildStep`) | Field exists [V30] | [U] whether it runs before `build-container-init` fails; test by setting it and pushing an empty commit to a `develop`-based PR |
| D. `git.deploymentEnabled` in `vercel.json` | Read from the deployed branch's root directory [V30] | Does not work here (no `apps/web` on `develop`) |

Required checks after RA-20-03 (both `main` and `develop`, via the API in `.github/README.md`), by job name: `required`, `applied migrations unchanged`, `fence`, `supabase start, reset, lint`, `web (typecheck, test, build)`, `web e2e (Chromium)`. The Vercel status stays unrequired.

### 2.2 Merge to `develop`: staging database and Edge Functions (journey item 2)

**`deploy-db.yml`** (exists; RA-20-04)
| | |
|---|---|
| Trigger | push to `develop` or `main` (a `changes` job decides whether `supabase/migrations/**` changed); `workflow_dispatch` on `develop` (branch `chore/staging-from-develop`); push of tag `db-v*` for production |
| Does | waits in `staging` for the founder; dry run; `supabase db push`; lists files not yet in `.github/migrations-applied.txt` in the job summary (never edits it). Production: tag must be on `main`, waits in `production`, dry run, push |
| Inputs | none |
| Secrets | `SUPABASE_DB_URL_STAGING`, `SUPABASE_DB_URL_PROD` |
| Environment | `staging`, `production` (both with the founder as reviewer; DEPLOY.md today says staging needs no reviewer, which changes because staging holds real family letters during the alpha, #145 `ENVIRONMENTS.md`) |
| Owner | S20 (workflow), S02 (migrations), founder (approval) |
| Proof | a dry-run summary on staging naming the files; `test:db` against staging (R-17 item); the coordinator's PR recording `migrations-applied.txt` within a day |

**`deploy-functions.yml`** (new; RA-20-05)
| | |
|---|---|
| Trigger | push to `develop` that changes `supabase/functions/**` (a `changes` job lists the function folders); `workflow_dispatch` with `function` |
| Does | waits in `staging`; for each changed function except `escrow` (D-102: escrow lives in its own project and deploys only by the founder), `supabase functions deploy <name> --project-ref "$SUPABASE_STAGING_PROJECT_REF"` [V32]; prints a content-free summary. Without a token it prints the exact commands for the founder's computer and exits green with a notice |
| Secrets | `SUPABASE_ACCESS_TOKEN_STAGING`, `SUPABASE_STAGING_PROJECT_REF` |
| Environment | `staging` |
| Owner | S20; S07 and S01 own the functions |
| Proof | `curl` of a deployed function's health path in the run; S19 evidence |
| Caveat | Supabase's CI example uses `SUPABASE_ACCESS_TOKEN` [V32]. Classic tokens carry every permission on every organisation and project of the account; scoped tokens (one project, chosen permissions) are in public alpha and may not show for this account [V32]. POPS-04 (no account token in CI) holds until a scoped token limited to `scribe-staging` exists; S01 decides |

Function secrets (`supabase secrets set`) stay founder steps in the dashboard (#145 step 12).

### 2.3 `develop` to TestFlight internal (journey item 3)

**`testflight.yml`** (exists, #145; v2 in RA-20-06)
| | |
|---|---|
| Trigger | `workflow_dispatch` (inputs below) from agents or the founder; `schedule` nightly at 02:17 UTC [Rec] (schedules can be delayed at the top of the hour [V1]), which builds only if app code changed on `develop` since the last successful build |
| Does | typecheck, tests, `preflight:testflight -- --profile <p>`; **build cap**: counts this month's iOS builds with `eas build:list --platform ios --json --non-interactive --limit 100` [V28] and stops with a notice at `EAS_IOS_BUILD_CAP`; then `eas build --platform ios --profile <p> --non-interactive --wait --auto-submit --what-to-test "<text>"` [V28]. The build number comes from EAS (`appVersionSource: remote`, `autoIncrement` [V25]); the text comes from `packages/content` through `apps/mobile/scripts/what-to-test.mjs --profile <p>` (RA-16-01), plus the short commit id. `eas submit` uses `submit.<p>.ios.ascAppId` and `groups: ["Founder"]`, so every build lands in the internal group "Founder" only [V28: `groups` in the submit schema of `@expo/eas-json` 24.9.0, used by eas-cli 24.10.0; `--groups` is internal groups only] |
| Inputs | `profile` (`testflight` or `preview`; the nightly run builds only the profile in `NIGHTLY_PROFILE`, default `preview`, so it spends one build a night), `submit` (default true), `force` (ignore the changed-code test, not the cap) |
| Secrets | `EXPO_TOKEN` (moved from the repository secret #145 uses) |
| Variables | `EAS_CLI_VERSION`, `EAS_IOS_BUILD_CAP`, `NIGHTLY_PROFILE` |
| Environment | `testflight` (no reviewer: internal builds to the founder's own group are not a production action) |
| Owner | S20; S16 for the text |
| Proof | the job summary shows profile, build number and EAS build link; the build shows in TestFlight under "Founder" (founder screenshot kept outside the repo; build number in the S19 evidence file) |
| Prerequisites | founder steps F-10, F-21 to F-26; non-interactive submit needs an App Store Connect API key assigned to the app in EAS and `ascAppId`, or it fails with "App Store Connect API Keys cannot be set up in --non-interactive mode" [V23]; EAS Submit runs on Linux [V23] |

Why "Founder" only: both alpha profiles share the `.preview` App Store Connect record (#145), and "Family" must only ever get a build the founder chose. Automatic distribution stays off on every group [V18].

### 2.4 TestFlight testers: Family, Friends and external groups (journey item 4)

**`testflight-testers.yml`** (new; RA-20-07 with the App Store Connect client in `scripts/release/asc/`)
| | |
|---|---|
| Trigger | `workflow_dispatch` only |
| Inputs | `action` (`add-to-group`, `submit-beta-review`, `expire`, `what-to-test`), `build` (build number or `latest`), `profile`, `group` (`Family`, `Friends` or an external group name) |
| Does | signs a JWT with the team key; resolves the build; refuses a servers-on build (`preview`, or `testflight` after the R-17 flip) for any group but "Founder" and "Family" unless `R17_PASSED` is `true` (D-100, R-17; the job reads the profile EAS recorded for that build number with `eas build:list --app-build-version <n> --json` [V28], never from an input); `add-to-group` adds the build to a beta group [V12]; for an external group it first fills the beta app description and feedback email from `packages/content` (required for external testing [V24]), then `submit-beta-review` creates a Beta App Review submission and polls its state [V12]; `expire` sets `expired: true` on the build [V12]; `what-to-test` updates the beta build localization [V12]. The summary is content-free |
| Secrets | `ASC_API_KEY_ID`, `ASC_API_ISSUER_ID`, `ASC_API_KEY_P8` (team key, role App Manager: external testing and phased release need Account Holder, Admin or App Manager in the UI [V15, V17], and key roles are user roles [V13]); `EXPO_TOKEN` for the profile lookup |
| Environment | `testers` (founder approves each run) |
| Owner | S20 |
| Proof | vitest on recorded fixtures (no network) for every call and for the R-17 refusal; one live run adding a build to "Family", recorded by S19 |

Apple facts that shape it [V17, V24]: an internal group must exist before an external one; external testing allows up to 10,000 testers; the first build submitted for TestFlight review gets a full review, later builds of the same version might not; up to six builds in 24 hours; builds expire 90 days after upload.

### 2.5 App Store release (journey item 5)

**`release-cut.yml`** (new; RA-20-09)
| | |
|---|---|
| Trigger | `workflow_dispatch` with `version` (for example `1.1.0`) |
| Does | opens the release PR on `develop` that bumps `apps/mobile/version.json` and adds `docs/release/<x.y.z>.md` from a template; the founder merges it, then the coordinator opens `develop` into `main`, cuts `release/<x.y>` and pushes `ios-v<x.y.z>-rc.<n>` (ADR 0022) |
| Secrets | the agents GitHub App token (`AGENTS_APP_CLIENT_ID`, `AGENTS_APP_PRIVATE_KEY`, already used by `agents.yml`); a PR opened with `GITHUB_TOKEN` would leave its CI runs waiting for a manual approval [V9] |
| Environment | none (it only opens a PR) |
| Owner | S20 |
| Proof | the PR exists with the bumped version and green CI |

**`release-ios.yml`** (#110; completed in RA-20-08)
| | |
|---|---|
| Trigger | push of `ios-v*` tags; `workflow_dispatch` with `job` from a `release/*` branch |
| Does | today on #110: RC checks, production build, internal TestFlight on the production record, GitHub Release on the final tag, `eas metadata:push`. Added: `screenshots` (uploads the six frames to the version's screenshot sets [V12]), `submit-review` (creates a review submission with the approved RC's App Store version [V12]; release option manual for 1.0), `phased` (`pause`, `resume`, `complete`; updates only, 7 days, pauses up to 30 days in total [V15]) |
| Secrets | `EXPO_TOKEN`, `ASC_REVIEW_CONTACT_JSON`, `ASC_API_KEY_ID`, `ASC_API_ISSUER_ID`, `ASC_API_KEY_P8` |
| Environment | `app-store` (founder approves each job) |
| Owner | S20; S16 for listing text; S17 for privacy answers |
| Proof | a dry-run mode that prints the planned calls; the first RC's record in `docs/release/<x.y.z>.md`; whether `--auto-submit` still submits after `--no-wait` is [U] until the first RC (ADR 0022 notes it) |

Store metadata as code, screenshots and App Privacy: section 3.

### 2.6 Speech packs and signed documents to R2 (journey item 6)

The pipeline is #162. The signing key is made by `node scripts/packs/keygen.mjs` on the founder's computer and lives in the password manager and a file outside the repo; `publish.ts` refuses a key file inside the repo and any key `keys.ts` does not list [R: #162].

**`packs-publish.yml`** (new; RA-20-11 with S07's RA-07-01)
| | |
|---|---|
| Trigger | push to `develop` or `main` that changes `supabase/functions/config/published.ts`, `supabase/functions/content/published.ts` or `packs/**`; `workflow_dispatch` (`dry-run`) |
| Does | waits in `packs`; `publish.ts assemble` (new, keyless) rebuilds `dist/release` from git: the signed manifest, remote config and content bundle exactly as committed in `published.ts` (which holds the signed text [R: #162 `configModule`, `contentModule`]), the text-rules packs rebuilt from `packs/`, the speech models downloaded and checked against `catalog.ts` hashes; checks every signature against `keys.ts` and every file against the signed manifest; then `publish.ts upload` (packs first, manifest last, nothing overwritten or deleted, same-version or older documents refused) and `publish.ts verify` against `https://packs.earlyletters.app` |
| Secrets | `PACKS_S3_*` (bucket-scoped Object Read and Write token, #162 step 4) |
| Environment | `packs` |
| Owner | S20 (workflow), S07 (scripts) |
| Proof | `verify` prints every line ok in the run; S19 records time to words on the SE 3 |

Where signing happens, and the options for the founder:
| Option | How | Key exposure | Speed of a kill switch |
|---|---|---|---|
| **A [Rec]** | Founder signs on own computer (`publish.ts release --key-file ...`), commits `keys.ts` and `published.ts` in a PR (a `supabase/**` path, so a founder merge), CI uploads | Key never leaves the founder's computer | Founder at a computer, then one approval |
| B | Signing key as `EL_SIGNING_KEY` and `EL_SIGNING_KEY_ID` in `packs`; CI signs too | A workflow change merged on an allowed ref can read it; the public half is compiled into every app, so a leak means a new key and an app release (#162 custody section) | One dispatch and one approval, from a phone |
| C | A second key in CI whose `kinds` lists only `remote-config` (the `TrustedKey` entry carries `kinds` [R: `keygen` output line]); manifests and content stay offline | Only config can be forged; it could still flip flags or raise `minSupportedVersion` | Fast for kill switches only |

A leaked bucket token alone cannot make phones accept anything: every document is signature-checked and every pack hash-checked, and phones refuse an older document version [R: #162, G-18]. Its worst case is deleting or withholding files; R2 tokens rotate in the dashboard (#162).

### 2.7 TestFlight feedback and crash reports (journey item 7)

Apple supports it [V12, V19]: the API lists TestFlight crash submissions (with a crash log) and screenshot submissions per app; webhooks can push `BETA_FEEDBACK_CRASH_SUBMISSION_CREATED` and `BETA_FEEDBACK_SCREENSHOT_SUBMISSION_CREATED` (plus build upload and App Store version state events), signed with HMAC-SHA256 in `x-apple-signature` [V12]. Viewing feedback needs Account Holder, Admin, App Manager, Developer or Marketing [V19]. A crash submission's attributes include `comment`, `email`, `deviceModel`, `osVersion`, `locale`, `timeZone`, battery and disk figures [V12]. Separately, `diagnosticSignatures` per build gives aggregated, anonymised crash, hang and disk-write backtraces [V12]; whether TestFlight builds are covered is [U] (confirm on the first build).

The public repository rule: **no tester text, email, screenshot, locale or time zone ever reaches a public issue, a public log or an agent prompt sent to a model provider.** Tester feedback can hold a child's name or a letter's words (TDD 07 OQ-4; CLAUDE.md privacy rules).

**Private route [Rec]:** a private repository, for example `earlyletters-ops` (founder creates it, F-31), runs `testflight-feedback.yml` hourly at :41:
1. polls both app records for new crash and screenshot submissions (key `gha-feedback`, role Developer), remembering the last submission id seen;
2. in the private repository: one issue per submission with build, OS, device model, date and a link to the item in App Store Connect; for crashes the crash log. **Default: the tester's comment and screenshot stay in App Store Connect** (the founder reads them there). Copying the comment into the private issue is a founder opt-in (Tier 2), because GitHub then holds tester text (S17 checks the processor list first);
3. in this public repository: one content-free pointer issue per crash signature, label `testflight-crash`: build number, profile, OS version, device model, exception type and the frames of our own binary after an allowlist parser, and the private issue's number. Screenshot submissions create no public issue;
4. agents triage the pointer (code paths, a fix PR); the founder triages anything that needs the tester's words.

Webhooks would need a public HTTPS receiver holding a GitHub token; polling needs neither. Revisit webhooks for build-state events only.

| | |
|---|---|
| Trigger | `schedule` hourly at :41 (private repo); `workflow_dispatch` |
| Secrets (private repo) | `ASC_FEEDBACK_KEY_ID`, `ASC_FEEDBACK_ISSUER_ID`, `ASC_FEEDBACK_KEY_P8`, `PUBLIC_REPO_ISSUES_TOKEN` (fine-grained token on this repository only, Issues read and write [U: permission names on the token screen]) |
| Owner | S07 (`scripts/ops/testflight-feedback.ts` here, with a test that a pointer can never hold `comment`, `email`, `locale`, `timeZone` or image data); S20 (the workflow template in `docs/release/templates/`); founder (the private repository) |
| Proof | S19 plants a fixture submission whose comment contains "Asha" and asserts the public pointer does not |

### 2.8 Health (journey item 8)

**`health.yml`** (new; RA-20-12 with S07's RA-07-02)
| | |
|---|---|
| Trigger | `schedule` every 15 minutes at :07, :22, :37, :52 (GitHub's shortest interval is 5 minutes and schedules can be delayed or dropped at high load [V10, V1]); `workflow_dispatch` |
| Does | content-free probes: `https://earlyletters.com` (200), `/.well-known/apple-app-site-association` (200, `application/json`, no redirect; #144), `/privacy` and `/terms`; the staging API health path; hourly `publish.ts verify` on the pack host. On failure: open or update one issue per check (title is the check name, body is status code and time only), label `health`; close it when green |
| Secrets | `HEALTH_STAGING_API_URL` (a secret so the log masks it; #145 keeps project values out of the repo) |
| Environment | `health` |
| Owner | S20 (workflow), S07 (probe script and runbook) |
| Proof | a planted wrong URL opens one issue and a fixed one closes it (S19) |

**`advisors.yml`** (new; RA-07-03): weekly and after each staging deploy. Either the Supabase Management API security and performance advisors (`GET /v1/projects/{ref}/advisors/security`, `.../performance`, marked experimental [V32]) with a scoped token, or Supabase's published lint query `splinter.sql` [V33] run with a read-only database role (`SUPABASE_LINT_DB_URL_STAGING`; the role is a migration requested from S02). [Rec] the read-only role: no account token needed. New ERROR or WARN findings open one issue each. Whether the dashboard advisor runs exactly `splinter.sql` is [U].

**Release health**: during a phased release, a daily `release-ios.yml` job `phased-status` reads the phase state [V12] and posts it to the release issue. The G5 crash-free thresholds (`docs/ops/RELEASE.md` 1.3) stay a founder read in App Store Connect: whether the API exposes crash-free rates is [U] (the API's analytics reports are a candidate).

**`ops-reminders.yml`** (new): monthly and quarterly issues with content-free checklists: the restore drill (`docs/ops/runbooks/restore-drill.md`, quarterly), a TestFlight build nearing its 90 days [V24], the App Store Connect keys, R2 token and Expo tokens still needed, `EAS_CLI_VERSION` behind npm's latest.

`nightly.yml` keeps the fuzz and real-stack checks; `ios-e2e.yml` (RA-20-10, from S19's sketch and `run-p0-nightly.sh` on #176) adds the macOS P0 flows nightly. Standard GitHub-hosted runners, macOS included (`macos-26` and `macos-latest` are listed), are free on public repositories [V4, V5]; a GitHub Free account runs at most 5 macOS jobs at once [V6].

### 2.9 Dependency updates and security scanning (journey item 9)

| What | How | Status |
|---|---|---|
| Dependency PRs | `dependabot.yml` on #30: npm weekly into `develop`, Expo and React Native packages grouped, React Native minor and major and React major ignored outside an SDK upgrade, Actions SHA bumps | #30 |
| Dependabot alerts and security updates | Settings, Code security (available for user-owned repositories [V11]) | founder F-08 |
| Secret scanning | runs automatically and free on public repositories [V11]; push protection [U: availability and setting name for this account] | founder F-08 |
| Code scanning | CodeQL default setup (available for public repositories [V11]); covers the TypeScript and the Actions workflows [U: languages detected] | founder F-08 |
| History scan | gitleaks in `security.yml` (#30) | #30 |
| Production audit | `npm audit --omit=dev --audit-level=high` through the audit gate with a dated ignore list (#30) | #30 |
| Pinned tools | every action by SHA (#30); `EAS_CLI_VERSION` one variable; Supabase CLI 2.119.0 (DEPLOY.md) | RA-20-03, RA-20-06 |
| Expo SDK upgrades | a planned PR per SDK, never Dependabot alone (#30 groups) | process |

### 2.10 Rollback, per layer (journey item 10)

| Layer | Fastest undo | Automated by | Time | Notes |
|---|---|---|---|---|
| Server features in a build (`EXPO_PUBLIC_SERVER_FEATURES`) | Build the `testflight` profile while it is still off, promote it, expire the servers-on build | `testflight.yml` (dispatch) then `testflight-testers.yml expire` (founder approves) | an hour or more (EAS queue and Apple processing [U]) | The switch is build-time; a servers-off build constructs no Supabase client (#145 kill path). After the R-17 flip, revert the one line first |
| Staging server | Turn off sign-ups, sign users out, pause the project (#145 kill path) | none by design: no account token in CI (POPS-04) | minutes, founder | Pausing is the only immediate stop of reads; issued access tokens live until expiry [U: one hour default for this project] |
| Remote config kill switches (`sync`, `invites`, `photos`, `packDownloads`, `serverContent`; #138 adds `backupUploads`, `escrow`, `statusReport`) | `publish.ts config --kill <switch>`, sign, commit; `packs-publish.yml` uploads | `packs-publish.yml` | about 5 minutes to open apps after upload (#162) | `sync` and `invites` have no consumers in the alpha (#145); WP-F19-12s and -12f add them (S07) |
| TestFlight build | Expire it [V12] | `testflight-testers.yml expire` | minutes | Effect on installed copies [U] |
| App Store phased release | Pause [V15] | `release-ios.yml phased pause` | minutes | Updates only; 30 days of pauses in total; manual downloads continue [V15] |
| App Store version | No rollback to an older binary; fix forward with expedited review (RELEASE.md 7.3) | `release-ios.yml` on the next RC | hours to days | |
| Website | Roll back to the previous production deployment | Vercel dashboard or `vercel rollback`; the coordinator can request it through the connected Vercel tools with the founder's OK | minutes | Hobby rolls back only to the immediately previous production deployment; Pro to any [V30] |
| Database | Fix forward with a new migration; restore only by `docs/ops/runbooks/restore-drill.md` then `sync_begin_epoch` | `ops-reminders.yml` opens the quarterly drill; the drill itself is founder-run (service-role keys never in CI) | hours | No drills against staging while it holds family letters (#145 `ENVIRONMENTS.md`); "restore to a new project" is [U] (runbook) |
| Packs | Roll forward: last good content at a higher version; `packDownloads` kill switch meanwhile | `packs-publish.yml` | minutes, then phones at their next check (up to 6 hours) | Never delete old versions (#162) |

### 2.11 How agents drive it, and what they never do

- Start: `actions_run_trigger` with `method: run_workflow`, `workflow_id`, `ref` and `inputs`. A workflow must exist on the default branch for dispatch, and once it has run once it can be dispatched on any branch or tag [V1].
- Read: `actions_list` (runs and jobs), `actions_get`, `get_job_logs`. Job summaries carry build numbers, links and verdicts, never secrets, tester text or project URLs.
- Never: approve a deployment, set or read a secret, change an environment, push a tag, or merge founder-class PRs (D-107; COORDINATION section 6). The MCP tools act as the founder's account, so GitHub cannot tell these apart: the rule and the founder's review of each approval request are the control (ADR 0024 consequences; S01 reviews).
- Limits [V6]: a job runs at most 6 hours; a run, including time waiting for approval, at most 35 days.

## 3. Store metadata, screenshots and App Privacy

### 3.1 EAS Metadata or fastlane

| | EAS Metadata | fastlane (`deliver`, `pilot`) |
|---|---|---|
| Status | Beta, subject to breaking changes [V22] | Stable; 2.241.1, Ruby 3.2 or later [V29] |
| Covers | localized info (title, subtitle, description, keywords, release notes, promo text, URLs), categories, copyright, age rating advisory with override, release (automatic date, phased release), review details [V22] | metadata, screenshots, submit for review, phased release, review information, all with an API key [V29: `deliver` options `api_key`, `screenshots_path`, `submit_for_review`, `phased_release`, `app_review_information`] |
| Screenshots | No [V22] | Yes [V29] |
| App Privacy | No | Only with an Apple ID session login, not an API key [V29: `upload_app_privacy_details_to_app_store` calls `Spaceship::ConnectAPI.login(username, ...)`] |
| Credentials | EAS's App Store Connect key; nothing new in GitHub | A team key in GitHub |
| Already in the repo | Yes: `store.config.json` generated from `packages/content` with a drift test (#109), `eas metadata:push` job (#110) | No |
| Toolchain | Node, eas-cli (already pinned) | Ruby and Bundler on the runner |

**Pick: EAS Metadata for store text (ADR 0022 decision 6, kept), and the App Store Connect client (`scripts/release/asc/`, RA-20-07) for screenshots, review submission and phased release.** The client is needed anyway for TestFlight groups, Beta App Review and expiry, which neither EAS command covers, so screenshots and submission add a few calls to one tested client instead of a second toolchain. If the client's screenshot upload slips, `fastlane deliver --skip_metadata --skip_binary_upload` with the same key is the fallback for that one job.

### 3.2 Screenshots without a Mac

| Route | Feasible | Evidence |
|---|---|---|
| **iOS Simulator on a GitHub-hosted macOS runner [Rec]**: an EAS simulator build (`e2e` profile, request B-1), Maestro flows on the fictional family Asha that save one screenshot per store frame (S19), framed by `scripts/brand/screenshots.mts`, uploaded by `release-ios.yml screenshots` | Yes, and free on a public repository | macOS runners listed and free for public repos [V4, V5]; screenshot sets and uploads in the API [V12]; Maestro's screenshot command and the simulator device names are [U] (S19 confirms on the first run; the sketch in `apps/mobile/e2e/ci/ios-e2e.yml.example` already notes the device-name check) |
| Web-preview captures (today's `scripts/brand/capture-store.cjs` on Linux) | Runs, but renders react-native-web, not the iOS app | [U] whether App Review accepts a web render as "the app in use"; keep it for drafts and layout only |
| By hand from a phone | Always works | The founder's time |

Sizes and counts come from Apple's screenshot specification (`docs/ops/RELEASE.md` 6.3; the 6.9-inch set is required unless 6.5-inch is supplied).

### 3.3 App Privacy answers

What the API supports: nothing for App Privacy (no data-usage resource in the App Store Connect API reference [V12]; the App Store Connect help page for app privacy names roles and the duty to keep answers current, and no API [V16]). What stays manual: every answer, entered by the founder (Account Holder, Admin or App Manager [V16]) from S17's worksheet, for the first version and for any build that changes data collection. Automation helps only around it: the preflight compares `PrivacyInfo.xcprivacy` with the expected data types (#145 already warns that the manifest declares no collected data while build 2 syncs), and `release-ios.yml` refuses `submit-review` unless the release record ticks "App Privacy answers match label <version>".

## 4. Founder setup checklist, in order

Times are your hands-on time [E]. "Page" is the official page this plan checked; [U] means the menu path was not read and the screen governs. Steps already in #145's `docs/release/TESTFLIGHT.md` (steps 1 to 12) and the alpha plan (#152, F01 to F27) are referenced, not repeated.

### Phase 0: GitHub, Vercel, Expo, Supabase, Cloudflare (no Apple needed; about 3 hours)

| # | Step | Where | Page |
|---|---|---|---|
| F-01 | Set the default branch to `develop`; then confirm Vercel's production branch is still `main` | GitHub Settings, General, Default branch; Vercel project Settings, Environments, Production | GitHub rule on default branches [V1]; menu paths [U]; whether Vercel follows a default-branch change [U] |
| F-02 | Merge the lineage PR (RA-20-01) after its review | GitHub | [R] `docs/DEVELOPMENT.md` (#79) |
| F-03 | Actions settings: workflow permissions read-only by default; leave "Allow GitHub Actions to create and approve pull requests" off | Settings, Actions, General | [U] labels |
| F-04 | Create the label `approve-migration` (and FT-20's labels) | Issues, Labels | [R] FT-20, #30 README |
| F-05 | Create the seven environments in section 2.0: reviewer (you), deployment branches and tags, administrator bypass off; add each secret only when its work package lands | Settings, Environments | [V2] features; [U] menu labels |
| F-06 | Rulesets: tags `ios-v*` and `db-v*`, branch `release/*`; restrict creations, updates and deletions; repository admin bypass only | Settings, Rules, Rulesets | [V7] available on public repositories; ADR 0022, DEPLOY.md step 3 |
| F-07 | Branch protection on `develop` and `main` with the required checks of section 2.1, after each has run once | Settings, Branches (or the API in `.github/README.md`) | [V7] |
| F-08 | Code security: Dependabot alerts and security updates, CodeQL default setup, secret scanning push protection | Settings, Code security | [V11] availability; push protection [U] |
| F-09 | Upgrade Vercel to Pro | Vercel, team Settings, Billing | Hobby is non-commercial [V31]; price [U] |
| F-10 | Expo: account with two-factor, `eas init`, send the project id (#145 step 3); create a robot or personal access token for CI and put it in `testflight` as `EXPO_TOKEN`, a second one later in `app-store`; delete any repository secret named `EXPO_TOKEN` | expo.dev | CI needs a token in `EXPO_TOKEN` [V23]; robot tokens [U: Expo "programmatic access" page] |
| F-11 | Supabase staging (#145 step 6, FT-10); `SUPABASE_DB_URL_STAGING` into `staging` | supabase.com | DEPLOY.md (verified 3 Oct) |
| F-12 | If your account offers scoped access tokens: one limited to `scribe-staging` with Edge Functions deploy permission, into `staging` as `SUPABASE_ACCESS_TOKEN_STAGING`, and the project ref as `SUPABASE_STAGING_PROJECT_REF`. If not offered, skip: functions deploy from your computer | Supabase, Account, Access tokens | [V32] scoped tokens are public alpha |
| F-13 | After S02's read-only lint role migration is on staging: its connection URL into `health` as `SUPABASE_LINT_DB_URL_STAGING`; the staging API URL as `HEALTH_STAGING_API_URL` | GitHub | [R] RA-07-03 |
| F-14 | Decide the DNS conflict: D-097 puts `packs.earlyletters.app` on Cloudflare R2, which needs `earlyletters.app` as a Cloudflare zone; D-063 records both domains at Porkbun. Then #162's runbook steps 2 to 5 (bucket, custom domain, bucket-scoped token) and the four `PACKS_S3_*` into `packs` | Cloudflare | [R] #162 (R2 facts read 15 Oct as search excerpts) |
| F-15 | Signing keys on your computer only (#162 step 1); the public lines in a PR | your computer | [R] #162 |

### Phase 1: Apple (enrol today; the rest when the account is Active; about 2.5 hours)

| # | Step | Where | Page |
|---|---|---|---|
| F-20 | Enrol as an individual: Apple Account with two-factor, your legal name (it becomes the seller name), legal age; 99 USD a year | developer.apple.com/programs/enroll | [V20]; approval time [U] |
| F-21 | Accept the agreements; Paid Apps, tax and bank for sandbox purchases (FT-06) | App Store Connect, Business | #145 step 2.5 |
| F-22 | Register `com.earlyletters.scribe.preview` (Sign in with Apple, Associated Domains); create the app record; send its Apple ID for `ascAppId` | Developer account, Identifiers; App Store Connect, Apps | #145 step 2; [U] menu paths |
| F-23 | TestFlight internal groups "Founder", "Family", "Friends", automatic distribution off on each | App Store Connect, TestFlight | [V18] (up to 100 internal testers; the automatic distribution checkbox) |
| F-24 | Request App Store Connect API access (Account Holder only), then two team keys: `gha-release`, role App Manager (into `testers` and `app-store` as `ASC_API_KEY_ID`, `ASC_API_ISSUER_ID`, `ASC_API_KEY_P8`); `gha-feedback`, role Developer (into the private repository, F-31). Each private key downloads once and Apple keeps no copy | App Store Connect, Users and Access, Integrations tab, App Store Connect API, Team Keys, Generate API Key | [V13] path and download rule; [V14] access request and all-apps scope; where the issuer ID is shown [U] |
| F-25 | Assign an App Store Connect API key to the app for EAS Submit, from your computer | `eas credentials` > App Store Connect: Manage your API Key > Set up your project to use an API Key for EAS Submit | [V23] |
| F-26 | Make the first build of each bundle id from your computer so EAS creates the certificate and profile (CI builds non-interactively and cannot create them) | your computer | #145 step 5; ADR 0022 |
| F-27 | Set `R17_PASSED=true` only on the day you record the R-17 sign-off (alpha plan F21) | GitHub, Variables | [R] D-100 |

### Phase 2: private feedback route (after the first external testers; about 45 minutes)

| # | Step | Where | Page |
|---|---|---|---|
| F-31 | Create a private repository (for example `earlyletters-ops`); add the feedback workflow from `docs/release/templates/` (RA-20-14); its secrets `ASC_FEEDBACK_*`; a fine-grained token on this repository with Issues read and write as `PUBLIC_REPO_ISSUES_TOKEN` | GitHub | Private Actions minutes count against the plan's quota [V4]; token permission names [U] |
| F-32 | Choose Tier 1 (comments stay in App Store Connect, default) or Tier 2 (comments copied into the private repository) after S17's check | | [R] section 2.7 |

### Phase 3: production (after the post-alpha re-plan, D-106)

| # | Step | Where | Page |
|---|---|---|---|
| F-41 | Production App Store Connect record `com.earlyletters.scribe` (permanent from the first upload); `ascAppId` for `submit.production` | App Store Connect | ADR 0022, `docs/release/1.0.0.md` |
| F-42 | App Privacy answers by hand, from S17's worksheet | App Store Connect, App Privacy | [V16]; not in the API [V12] |
| F-43 | Production Supabase, `SUPABASE_DB_URL_PROD` in `production`, first `db-v*` tag | supabase.com, GitHub | DEPLOY.md |
| F-44 | External testing information (beta app description, feedback email) is filled by `testflight-testers.yml` from `packages/content`; review it once in App Store Connect | App Store Connect, TestFlight | [V24] required for external testing |

## 5. Work packages, by owner stream

Each package is one PR in its stream's files (PRD V2 08 section 3.3 globs). "Founder merge" follows D-107. A request to another stream goes in the PR body under "Requests to other owners".

### S20: release, CI and the website (`.github/**`, `apps/mobile/{eas.json,app.config.ts,package.json}`, `apps/mobile/scripts/**`, `docs/release/**`, `docs/ops/{DEPLOY,APP_SIZE,RELEASE}.md`, `scripts/release/**` from #109)

| ID | What | Files | Needs | Done when (proof) |
|---|---|---|---|---|
| RA-20-01 | Lineage: merge `main` into `develop` (`apps/web`, `web.yml`, `web-e2e.yml`, lockfile union) | the merge | none | a `develop`-based PR shows a green Vercel preview; CI green. Founder merge |
| RA-20-02 | Default-branch follow-through: `.github/README.md`, `docs/release/TESTFLIGHT.md` notes; check the Actions API lists every workflow | `.github/README.md`, `docs/release/**` | F-01 | `testflight.yml`, `deploy-db.yml`, `nightly.yml` appear in the workflow list; one dispatch of `testflight.yml` with `submit: false` |
| RA-20-03 | Land #30; job-level path filters for `db-cli.yml`, `web.yml`, `web-e2e.yml`; `actionlint`; the required-check list | `.github/workflows/**`, `.github/scripts/**`, `.github/README.md`, `.github/dependabot.yml` | RA-20-01 | the checks in section 2.1 are required on both branches (API read-back). Founder merge |
| RA-20-04 | `deploy-db.yml`: `chore/staging-from-develop` plus a push trigger on `develop` behind `staging`; DEPLOY.md | `.github/workflows/deploy-db.yml`, `docs/ops/DEPLOY.md` | F-05, F-11 | dry run and push on staging; summary lists files. Founder merge. **Alpha critical** |
| RA-20-05 | `deploy-functions.yml` (escrow excluded; prints commands without a token) | `.github/workflows/deploy-functions.yml` | F-12 or not | one function deployed to staging and probed |
| RA-20-06 | `testflight.yml` v2: `testflight` environment, `EAS_CLI_VERSION`, nightly eligibility, build cap, What to Test, `groups: ["Founder"]` and `ascAppId` per submit profile | `.github/workflows/testflight.yml`, `apps/mobile/eas.json`, `apps/mobile/scripts/{what-to-test,build-budget}.mjs`, `apps/mobile/test/config.test.ts` | #145, RA-16-01, F-10, F-22, F-25 | a nightly build reaches "Founder" with its What to Test text; the cap stops a run in a test. Founder merge |
| RA-20-07 | `scripts/release/asc/` client (JWT, builds, beta groups, Beta App Review, beta build localizations, screenshots, review submissions, phased release) and `testflight-testers.yml` with the R-17 refusal | `scripts/release/asc/**`, its tests, `.github/workflows/testflight-testers.yml` | F-24 | fixture tests for every call and refusal; one live promotion to "Family". Founder merge |
| RA-20-08 | `release-ios.yml`: land #109, #110, #111 (rebased); jobs `screenshots`, `submit-review`, `phased`, `phased-status`, dry-run mode | `.github/workflows/release-ios.yml`, `docs/release/**` | RA-20-07 | dry run on a test tag prints the planned calls; first RC record. Founder merge |
| RA-20-09 | `release-cut.yml` (version bump PR with the agents App token) | `.github/workflows/release-cut.yml`, `docs/release/templates/release-record.md` | agents App installed | a test run opens a PR with the bump and green CI |
| RA-20-10 | `ios-e2e.yml` on macOS: S19's P0 nightly (#176) and the screenshots job; `e2e` simulator profile | `.github/workflows/ios-e2e.yml`, `apps/mobile/eas.json` | #176, S19 testIDs | a nightly run result and a screenshots artifact (Asha only) |
| RA-20-11 | `packs-publish.yml` | `.github/workflows/packs-publish.yml` | RA-07-01, F-14 | dry run, then upload and `verify` all ok |
| RA-20-12 | `health.yml`, `advisors.yml`, `ops-reminders.yml` | `.github/workflows/{health,advisors,ops-reminders}.yml` | RA-07-02, RA-07-03 | planted failure opens one issue, fix closes it |
| RA-20-13 | Optional, if the founder wants a click on website production: Vercel staged production (`autoAssignCustomDomains` off [V30]) and `web-promote.yml` in a `web-production` environment running `vercel promote` [V30] | `.github/workflows/web-promote.yml` | F-09, a Vercel token | promote and rollback rehearsed on a no-op change |
| RA-20-14 | Docs: cross-links from TESTFLIGHT.md, DEPLOY.md and RELEASE.md to this file; the private feedback workflow template | `docs/release/**`, `docs/ops/DEPLOY.md` | RA-07-04 | links resolve; template passes `actionlint` |

### S07: platform and ops (`scripts/ops/**`, `scripts/packs/**`, `docs/ops/**` except S20's files)

| ID | What | Files | Needs | Done when |
|---|---|---|---|---|
| RA-07-01 | `publish.ts assemble`: the keyless release directory from committed signed documents, rebuilt packs and hash-checked models; refuses on any signature or hash mismatch | `scripts/packs/{publish,release,lib}.ts` and tests (on #162) | #162 | a test proves `assemble` equals a signed `release` byte for byte; a tampered `published.ts` fails |
| RA-07-02 | `scripts/ops/health-probe.ts` (content-free messages; issue de-duplication by title) and `docs/ops/runbooks/health-alert.md` | `scripts/ops/**`, `docs/ops/runbooks/**` | none | unit tests; runbook names who acts |
| RA-07-03 | `scripts/ops/advisors.ts` (pinned `splinter.sql` with a read-only role, or the Management API) and `docs/ops/runbooks/advisor-finding.md`; request the read-only role to S02 | `scripts/ops/**`, `docs/ops/**` | S02 migration | a planted table without row-level security is reported on a local stack |
| RA-07-04 | `scripts/ops/testflight-feedback.ts` (poller, private writer, public pointer with an allowlist scrubber) and `docs/ops/TESTFLIGHT_FEEDBACK.md` | `scripts/ops/**`, `docs/ops/**` | RA-20-07 client | fixture tests: no `comment`, `email`, `locale`, `timeZone` or image ever in a pointer |
| RA-07-05 | One rollback runbook per layer of section 2.10 that names the workflow and the click | `docs/ops/runbooks/**` | the workflows | each runbook rehearsed once (S19 evidence) |

### S19: test gates and evidence (`apps/mobile/e2e/**`, `docs/qa/**`, `scripts/trace.mjs`)

| ID | What | Done when |
|---|---|---|
| RA-19-01 | One evidence file per first green run of every workflow (template on #176): run link, inputs, result | every row of section 2 has its file |
| RA-19-02 | Maestro screenshot flows for the six store frames on the Asha seed | six raw captures per size from `ios-e2e.yml` |
| RA-19-03 | Planted-failure tests: build cap, R-17 refusal, feedback scrubber with "Asha" in the comment, What to Test length, health issue open and close | each fails before its fix and passes after |
| RA-19-04 | The kill harness on macOS (alpha plan item 9) through `ios-e2e.yml` | 500 of 500 recorded |

### S16: store and tester copy (`packages/content/**`)

| ID | What | Done when |
|---|---|---|
| RA-16-01 | `packages/content/src/release/testflight.en.ts`: What to Test per profile (#145's two texts), beta app description, feedback line, external test information | content rules pass; a test caps each text at 4,000 characters [U: Apple's limit not stated in the API reference [V12]] |
| RA-16-02 | Store listing for the server-on build (rework of #129 and the BL-440 guard after D-100) and screenshot captions | `store.config.json` regenerated; drift test green |

### S17: App Privacy and legal (`docs/legal/**`)

| ID | What | Done when |
|---|---|---|
| RA-17-01 | App Privacy worksheet per build that changes data collection (label 1.4.0 draft), with the manifest cross-check | the founder can enter F-42 from it without questions |
| RA-17-02 | Export compliance memo for app-level encryption of recordings (backup, #150) before any build with backup on | counsel's answer recorded; `usesNonExemptEncryption` confirmed or changed (S20) |
| RA-17-03 | Feedback route: whether GitHub may hold tester comments (Tier 2), and the tester notice with S16 | decision recorded before F-32 |

### S01: secrets and permissions review (`docs/security/**`)

| ID | What | Done when |
|---|---|---|
| RA-01-01 | Review before any secret is added: each workflow's `permissions:`, each environment's refs and bypass setting, token scopes (Expo, App Store Connect roles, R2, Supabase, fine-grained GitHub token), `pull_request_target` use in the fence, public-log exposure, and the founder-credential agent risk | `docs/security/RELEASE_SECRETS_REVIEW.md` signed; findings fixed in S20's PRs |

## 6. Order and dependencies

```
now      F-01 default branch, F-03..F-08 GitHub settings, F-09 Vercel Pro, F-20 Apple enrolment
         RA-01-01 review starts; RA-20-01 lineage PR; RA-20-03 (#30)
Mon 19   F-10 Expo, F-11 staging, F-14 Cloudflare, F-15 keys
Wed 21   RA-20-04 staging from develop (alpha critical); #145 merged; RA-16-01 copy
Fri 23   RA-20-06 testflight v2 (environment, groups, What to Test; nightly may wait); F-21..F-26 when Apple is Active
Thu 29   alpha go/no-go (#152). Packs may be founder-run with #162 for the alpha
after    RA-07-01 + RA-20-11 packs CI; RA-20-07 testers; RA-20-12 + RA-07-02/03 health; RA-07-04 + F-31 feedback;
         RA-20-10 + RA-19-02 macOS e2e and screenshots; RA-20-05 functions; RA-20-08/09 store lane before the freeze
```

Key edges: RA-20-01 before RA-20-03 (web checks need `apps/web`); F-01 before any dispatch; RA-20-07 before RA-20-08, RA-07-04 and the external alpha; RA-07-01 before RA-20-11; RA-01-01 before each secret.

## 7. Risks

| # | Risk | Signal | Mitigation |
|---|---|---|---|
| 1 | Agents act through the founder's GitHub account, so an agent could approve its own deployment and GitHub cannot tell | an approval at a time the founder did not act | Written rule (2.11); approval requests are visible; S01 review; later, a separate identity for agents (the agents App) so "prevent self-review" can be turned on |
| 2 | Public logs leak a value | a project URL or tester detail in a log | secrets for anything masked; content-free summaries; feedback only in a private repository; S19's scrubber tests |
| 3 | Changing the default branch moves something unexpected (Vercel production branch, PR base defaults, scheduled agents) | Vercel shows another production branch; agents start | F-01 checks Vercel; `agents.yml` stays off until `AGENTS_ENABLED` [R] |
| 4 | EAS Free allowance runs out once nightly builds start | the cap notice | `EAS_IOS_BUILD_CAP`; Starter per D-092's trigger |
| 5 | EAS Metadata is beta [V22] | `metadata:push` breaks after an eas-cli bump | one pinned `EAS_CLI_VERSION`; fastlane fallback for one job |
| 6 | Scoped Supabase tokens are public alpha [V32] | the option is not offered | functions from the founder's computer; POPS-04 holds |
| 7 | `--auto-submit` with `--no-wait` and other first-run CLI behaviour is unproven [U] | first RC | dry runs; ADR 0022 notes it; record in the release record |
| 8 | Schedules are delayed or dropped at high load [V1] | missed health runs | off-the-hour minutes; health is coarse by design; an external monitor later [U: vendor and price] |
| 9 | Team API keys reach every app [V14] | a key used outside its job | one key per purpose, revoke on its own, `ops-reminders.yml` review |
| 10 | Both alpha profiles share one App Store Connect record | a servers-on build in "Friends" | automatic distribution off; builds land in "Founder" only; the R-17 refusal in `testflight-testers.yml` |
| 11 | Export compliance changes with app-level encryption | build 2 with backup on | RA-17-02 before the backup flag turns on |
| 12 | App Privacy answers drift from the build | a data type added in code | RA-17-01 worksheet; preflight manifest check; the submit gate in 3.3 |
| 13 | Lineage merge is large and conflicts | RA-20-01 red | do it before more `main`-only website work lands; founder merge in one window |
| 14 | Public-repo schedules turn off after 60 days without activity [V1] | a quiet repository | `ops-reminders.yml` itself counts as activity [U]; check monthly |

## 8. Costs

| Item | Cost | Source |
|---|---|---|
| Apple Developer Program | 99 USD a membership year | [V20] |
| GitHub Actions on this public repository, standard runners incl. macOS | free | [V4, V5]; larger runners are always charged [V4] |
| GitHub Actions in the private feedback repository | the plan's free quota, then billed | [V4]; the quota number [U] |
| EAS Free | 15 iOS builds a month, low priority, one at a time | D-092 (expo.dev/pricing, 3 Oct); [U] today: the page is not reachable here; a search excerpt of it on 16 Oct says the same [S34] |
| EAS Starter | 19 USD a month with 45 USD of build credit | [V27] |
| EAS build prices beyond credit | the docs' examples show 2 USD (medium) and 4 USD (large) per iOS build | [V27] examples; the pricing page governs [U] |
| Our build use | alpha 5 to 7 builds (#152); nightly automation about 15 to 22 a month (one profile, nights after app changes) plus dispatched builds and RCs [E] | [E] |
| Vercel Pro | 20 USD per developer seat a month, with a usage credit | third-party reports [S31]; [U] vercel.com/pricing |
| Supabase | staging on Pro recommended during the alpha (about 25 USD a month) | alpha plan risk 7 [A] |
| Cloudflare R2 | 0 USD at alpha scale | #162 cost section (read 15 Oct) |

## 9. Sources

Read 16 Oct 2026 unless a date is given. "Source" means the vendor's own documentation repository or package, which this sandbox could reach when the web page could not.

- V1. GitHub, Events that trigger workflows (docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows): `workflow_dispatch` and `schedule` need the file on the default branch; after one run, dispatch on any branch or tag by API; `pull_request_target` runs in the default branch's context on github.com; schedules delayed at high load and disabled after 60 days without activity on public repositories. Source: github/docs `content/actions/reference/workflows-and-actions/events-that-trigger-workflows.md`, `data/reusables/actions/branch-requirement.md`, `data/reusables/actions/schedule-delay.md`.
- V2. GitHub, Deployments and environments (docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments): up to six reviewers, prevent self-review, deployment branches and tags, administrators bypass by default and the option to disallow, environment secrets, availability on public repositories. Source: github/docs.
- V3. GitHub, Review deployments (docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/review-deployments). Source: github/docs.
- V4. GitHub, GitHub Actions billing (docs.github.com/en/billing/concepts/product-billing/github-actions): free for public repositories on standard runners; larger runners always charged. Source: github/docs.
- V5. GitHub, GitHub-hosted runners reference: standard runners for public repositories include `macos-latest` (macos-26 arm64), `macos-15`, `macos-14`. Source: github/docs `data/reusables/actions/supported-github-runners.md`.
- V6. GitHub, Actions limits (docs.github.com/en/actions/reference/limits): 6 hours a job, 35 days a run including approval waits, 20 concurrent jobs and 5 macOS on Free. Source: github/docs.
- V7. GitHub, About rulesets and protected branches: available in public repositories on Free. Source: github/docs `data/reusables/gated-features/{repo-rules,protected-branches}.md`.
- V8. GitHub, Troubleshooting required status checks and Skip workflow runs: path-filtered workflows leave checks Pending and block merging; a job skipped by a conditional reports Success. Source: github/docs, found through GitHub code search.
- V9. GitHub, GITHUB_TOKEN: events it creates start no runs, except `workflow_dispatch` and `repository_dispatch`; PRs it opens start runs in an approval-required state. Source: github/docs `data/reusables/actions/actions-do-not-trigger-workflows.md`.
- V10. GitHub, schedule syntax: shortest interval 5 minutes. Source: github/docs `data/reusables/repositories/actions-scheduled-workflow-example.md`.
- V11. GitHub, availability of code scanning (public repositories), secret scanning (automatic and free on public repositories) and Dependabot alerts (user-owned repositories). Source: github/docs `data/reusables/gated-features/`.
- V12. Apple, App Store Connect API reference (developer.apple.com/documentation/appstoreconnectapi): TestFlight (beta groups, beta app review submissions, beta build localizations, beta feedback crash and screenshot submissions with their attributes), builds (`expired`), App Store (app metadata, screenshot sets, age ratings, review submissions, phased releases and `PhasedReleaseState`), webhooks (event types, HMAC `x-apple-signature`), power and performance (diagnostic signatures). No App Privacy or data-usage resource is listed: the API index and the Apps, App Infos, App Store Versions and App Metadata pages were searched. Read from the page data at developer.apple.com.
- V13. Apple, Creating API Keys for App Store Connect API: team and individual keys; key roles are user roles; team keys need an Admin.
- V14. Apple, App Store Connect Help, App Store Connect API: the Account Holder requests access first; team keys apply across all apps.
- V15. Apple, Release a version update in phases: 7 days, pauses up to 30 days in total, Account Holder, Admin or App Manager.
- V16. Apple, Manage app privacy: answers in App Store Connect, kept current by the developer; Account Holder, Admin or App Manager.
- V17. Apple, Invite external testers: up to 10,000; first build gets a full review; six builds in 24 hours; Account Holder, Admin or App Manager.
- V18. Apple, Add internal testers: up to 100; the automatic distribution checkbox.
- V19. Apple, View tester feedback: screenshots, crash comments; webhooks; API; roles.
- V20. Apple, Enrolling (developer.apple.com/programs/enroll/): individual requirements, legal name as seller name, 99 USD a year.
- V21. Apple, Upcoming requirements: uploads built with Xcode 26 or later.
- V22. Expo, EAS Metadata and its schema (docs.expo.dev/eas/metadata/): beta; no screenshot upload; fields covered. Source: expo/expo `docs/pages/eas/metadata/{index,schema}.mdx`.
- V23. Expo, Submit to the Apple App Store (docs.expo.dev/submit/ios/): runs on Linux; `EXPO_TOKEN` in CI; non-interactive needs an assigned API key and `ascAppId`. Source: expo/expo `docs/pages/submit/ios.mdx`.
- V24. Expo, TestFlight (docs.expo.dev/submit/testflight/): internal 100, external 10,000, Beta App Review on the first build of every version, beta app description and feedback email for external testing, 90-day builds, internal group before external, `--groups` and `--what-to-test`. Source: expo/expo `docs/pages/submit/testflight.mdx`.
- V25. Expo, App version management: remote version source recommended from EAS CLI 12. Source: expo/expo.
- V26. Expo, Environment variables: plain text, sensitive, secret. Source: expo/expo.
- V27. Expo, Plans and Usage-based pricing (docs.expo.dev/billing/plans/, usage-based-pricing): Starter 19 USD with 45 USD build credit; example per-build prices. Source: expo/expo.
- V28. eas-cli 24.8.0 and 24.10.0 from npm (flags of `build`, `submit`, `build:list`), `@expo/eas-json` 24.9.0 submit schema (`groups`, `ascAppId`), npm registry release dates (24.14.0 on 14 Oct).
- V29. fastlane source (github.com/fastlane/fastlane): `version.rb` (2.241.1, Ruby 3.2.0 minimum), `deliver/lib/deliver/options.rb`, `upload_app_privacy_details_to_app_store.rb`.
- V30. Vercel documentation (through the Vercel documentation tool): git configuration (`git.deploymentEnabled`), `ignoreCommand`, rollback (Hobby limited to the previous production deployment), `vercel promote` and `--skip-domain`, the update-project REST fields. Deployment and project data read through the Vercel tools.
- V31. Vercel, Fair use guidelines (vercel.com/docs/limits/fair-use-guidelines): Hobby is for non-commercial personal use (coordinator, 15 Oct). Pro price from third-party reports, not Vercel: makerkit.dev/blog/saas/vercel-cost, schematichq.com/blog/vercel-pricing.
- V32. Supabase documentation (through the Supabase documentation tool): Deploy to Production and GitHub Actions for Edge Functions (`SUPABASE_ACCESS_TOKEN`), Personal Access Tokens (classic and scoped, scoped in public alpha), Management API advisors endpoints (experimental).
- V33. supabase/splinter README: `splinter.sql` holds every lint in one query.
- S34. Search excerpt of expo.dev/pricing and docs.expo.dev/billing/plans (16 Oct): Free plan 15 iOS builds a month. Not opened directly.
