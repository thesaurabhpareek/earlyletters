# Release automation: the pipeline, the founder setup and the work packages

Status: proposed plan, revision 2 of Fri 16 Oct 2026, after the S19 QA review (PR #185 comment 6222021200) and the S01 security review (comment 6222183586). Author: release automation lead, for the coordinator to assign. Decision record: [ADR 0026](../adr/0026-release-automation-pipeline.md) (proposed; number assigned by the coordinator). Builds on ADR 0022 and D-089 to D-092 (release engineering), D-041, D-097, D-100, D-106, D-107, the PRD V2 delivery plan (`docs/prd/v2/08-delivery.md`, on `develop` since #124) and the alpha plan (#152, founder steps F01 to F27). File owner after merge: S20 (`docs/release/**`).

The founder's ask: "setup proper actions and journey to automate everything." This file is the plan only. Nothing here changes a workflow, a secret or a setting; the work packages in section 5 do, each in its owning stream's files, one concern per PR.

**Read this sentence first.** Every agent session acts through the founder's GitHub account, so GitHub cannot tell an agent's approval from the founder's. Until the approver account in AF-02 exists and is the only required reviewer, **every "the founder approves" in this file is a policy, not an enforced control.**

Labels:
- **[V]** verified by this author on the vendor's own page or source on 16 Oct 2026; the number points at section 9.
- **[V-S01]**, **[V-QA]** verified by the S01 or S19 reviewer on 16 Oct from the source named in their review, not re-read here.
- **[R]** a fact in this repository or its GitHub settings, named.
- **[U]** unverified, with what would confirm it.
- **[A]** an assumption we act on until checked. **[E]** an estimate. **[Rec]** a recommendation.

Agents in this sandbox cannot reach expo.dev, docs.expo.dev, appstoreconnect.apple.com, docs.github.com, vercel.com or supabase.com directly. Vendor facts were read from developer.apple.com (reachable), from the vendors' own documentation sources published on GitHub (github/docs, expo/expo, expo/eas-cli, fastlane), from npm package tarballs, and through the Vercel and Supabase documentation tools connected to this workspace. Section 9 says which.

## 0. Read this first

### 0.1 What changes the plan

1. **Agents act as the founder.** Agent sessions use a token for the founder's own account, approval records carry only the user [V-S01: REST `environment-approvals`], and the founder account owns the repository, so it can re-add itself as a reviewer and bypass rulesets [V-S01]. Fix: a second GitHub account that only the founder holds is the sole required reviewer, with "prevent self-review" on and administrator bypass off (AF-02, section 2.0). Until then the rule "agents never approve" is policy.
2. **Nothing protects `main` or `develop` today** [R: the GitHub API, quoted in #152 section 3.4]. A push to `main` is a website production deploy. Fix: branch protection on both now, with bypass off (AF-03).
3. **Dispatch and schedules cannot work today.** The default branch is `main` [R], and `main` holds only `ci.yml`, `migration-guard.yml`, `web.yml` and `web-e2e.yml` [R]. GitHub triggers `workflow_dispatch` and `schedule` only for files on the default branch, and on github.com runs `pull_request_target` and `issue_comment` from it [V1]. The Actions API listed none of `testflight.yml`, `deploy-db.yml`, `nightly.yml` or `agents.yml` on 16 Oct [R]; on 28 Oct it lists `deploy-db.yml` (it runs on pushes to `develop`) and still none of the other three [R]. So no nightly runs (B2-22 in `docs/qa/ALPHA_GO_NO_GO.md` on #176) and no schedule can run the 500-kill harness. Fix: make `develop` the default branch (AF-05), after hardening `claude.yml`, which goes live at the switch (section 2.11). **30 Oct note:** the Actions API still lists none of `testflight.yml`, `agents.yml` and `nightly.yml` (HTTP 404 for each file name, read 30 Oct) [R]. The interim route, until AF-05, is the PR from branch `chore/workflows-to-main`, which adds only those three files to `main`, byte for byte from `develop` at f04456e (the option `docs/release/HARNESS_SETUP.md` section 1 item 3 names). A dispatch runs the file from the branch chosen (`develop`); a schedule runs the copy on `main`, which drifts from `develop` unless it is copied again after every change to `agents.yml` (every 30 minutes, idle unless `AGENTS_ENABLED` is `true`) or `nightly.yml` (daily at 10:23 UTC). `nightly.yml` calls `db-cli.yml`, which `main` does not have [R], so its schedule cannot run from `main` (how GitHub reports that is [U]) and B2-22 still needs AF-05.
4. **`pull_request_target` is blocked by default in public repositories from Mon 2 Nov 2026** [V34]. The fence in #30 uses it. Fix: an Actions event policy that allows it for `fence.yml` before that date (AF-20).
5. **The Vercel failure on `develop` PRs is a lineage split.** The project builds every branch with root directory `apps/web`, which exists only on `main`; the build stops at `build-container-init` with `NOW_SANDBOX_WORKER_ROOTDIR_NOT_EXIST` [R: deployment `dpl_3fbe7smLCY5TzbuQHR8zJLvrm98b`]. A `vercel.json` cannot help, because Vercel reads it from the branch it builds [V30]. Fix: merge `main` into `develop` once (RA-20-01), after the alpha; the status is noise until then, never a required check.
6. **The store journey is automatable through Apple's API except App Privacy** [V12, V16]; fastlane's App Privacy action needs an Apple ID session [V29].
7. **Tester feedback is private by design.** Crash submissions carry the tester's `email` and `comment` [V12]; the repository and its logs are public. Internal testers can also read every tester's feedback in App Store Connect [V-QA, V-S01]. So: friends join an **external** group, feedback is read in a private repository, and public issues get content-free pointers only (section 2.7).
8. **The agents' connectors reach production-class systems**: the Supabase connector sees every project in its organization and can run SQL and apply migrations, and the Vercel connector can promote and roll back [V-S01, R: tool lists]. Staging holds real family letters during the alpha (#145 `ENVIRONMENTS.md`). Fix: staging and production in a Supabase organization the connector is not authorized for, or the connector read-only and scoped to a development project (AF-06).
9. **Speech packs build on #162**; signing stays on the founder's computer and CI only uploads what the founder signed (section 2.6).
10. **Vercel Hobby is for non-commercial use** [V31]; the site sells a subscription, so Pro is a founder prerequisite (AF-15). Price: [U] (third-party reports say 20 USD per developer seat a month).

### 0.2 The alpha critical path (Thu 29 Oct)

Dates are #152's (section 2.2 there); "window" is the founder's daily merge window. Each row's proof is a row of `docs/qa/ALPHA_GO_NO_GO.md` on #176. Anything not in this table lands after Thu 29. These dates no longer hold (28 Oct: most have passed, and no build exists yet); the dates now proposed, until the founder confirms, are at the top of `docs/release/TESTFLIGHT.md` and `docs/qa/ALPHA_GO_NO_GO.md`.

| # | Item | Owner | Date | Proof |
|---|---|---|---|---|
| 1 | **iOS compile check**: `.github/workflows/ios-compile.yml` on branch `ci/ios-compile-check` (S20; merged in #188, 23 Oct) compiles the app and every Swift module for the Simulator on `macos-26`, no signing, no secrets [R]. Run it on #145 and on #150's head (the never-compiled `scribe-keys`) before build 1 | S20 | merged by Mon 19; green on #150 before Fri 23 | green run links in S19's evidence index |
| 2 | Apple enrolment Active (AF-01 = #152 F01). **Done 29 Oct 2026**: Active, from the founder's own confirmation emails | founder | by Mon 19, latest Fri 23 (past it the alpha moves day for day); done Thu 29 | the Account Holder sees App Store Connect |
| 3 | Expo project id (AF-04 = #152 F02) and its PR | founder, S20 | window 1, Fri 16 | B1-1 |
| 4 | #145 merged (both alpha profiles, preflight, kill path), with the request in RA-20-06a (`environment: testflight`, SHA pins) folded in or deferred | S20, founder | window 1, Fri 16 | B1-1, B1-2 |
| 5 | Approver account and branch protection (AF-02, AF-03) before any secret lands | founder | Fri 16 to Mon 19 | the environment and branch settings read back by API (RA-20-12 drift job later) |
| 6 | App Store Connect record, groups and testers (AF-09 = #152 F08, with "Friends" external) | founder | Mon 19 | B1-1 |
| 7 | The packs signing-keys PR (`packages/api/src/keys.ts`) merged before build 1 and before the freeze commit, so **both** builds carry it | S07, founder | window 3, Tue 20 | B2-8 |
| 8 | First build per app id: build 1 (`.preview`, `testflight` profile) from the founder's computer or #145's workflow (AF-10 = #152 F12) | founder | Tue 20 | B1-1 |
| 9 | Default branch `develop` (AF-05) after RA-20-02a (`claude.yml` hardened) and the Vercel check | S20, founder | by Wed 21 | the Actions API lists `nightly.yml` and `testflight.yml` |
| 10 | Pack host live: DNS and R2 (AF-08 = #152 F09); signed documents uploaded and `publish.ts verify` all ok (AF-12 = #152 F13) | founder | Mon 19, Wed 21 | B2-8 |
| 11 | Staging: `staging` environment (AF-07) and RA-20-04 (migrations from `develop`) | S20, founder | window 4, Wed 21 | the dry-run summary |
| 12 | Staging seeding and functions (AF-13 = #152 F16 and F17): `supabase db push` seeds nothing (`[db.seed] enabled = false` [R: `supabase/config.toml`]), so the pepper (APPLY step 6), the purge cron (7), the beta policy versions `terms` and `sensitive-data` (8) and statement logging off (15) are founder steps; then the function secrets and the deploys of `apple-token`, `purge-worker`, `config` and `content`. Proven by RA-07-06's content-free check: an anonymous read of `policy_versions` lists both versions (anon can read it [R: `20261002020000_data_governance.sql` policy `policy_versions_read`]) and each function's health path answers 200 | founder, S07 | Thu 22 | B2-3, B2-13 |
| 13 | **Kill harness on macOS, B2-11 (never waived)**: a minimal workflow (RA-20-10a: dispatch and a nightly schedule, DL-01 and DL-02 only, the Simulator app built on the runner) and S19's harness (RA-19-04), with S20's `_layout.tsx` seam line (#176 request 3, RA-20-18); nightly runs on `develop` from Thu 22; the 500 of 500 gate run overnight on the freeze commit, Tue 27. Fallback, decided by Wed 21 (AF-14): the founder's Mac. **Gate sizing, measured 24 Oct** (`kill-harness.yml`, #269): DL-02 took 8 to 10 s a launch on the nightly-size run on `develop` (run 40084319361: 76 launches, 70 judged kills plus the self-check, in 675 s), and 16, 20, 24 and 31 s on the cold pull-request smoke runs. The gate's about 706 DL-02 kills project to 100 to 120 minutes in one job, under the 340-minute cap and the 240-minute threshold for a split, so DL-02 stays one job. DL-01 runs four shards of 125 | S20, S19 | merged by Thu 22; gate Tue 27 night | B2-11 harness report |
| 14 | A green scheduled `nightly.yml` within 24 hours of build 2 (B2-22): needs item 9; RA-20-19 makes a red nightly open an issue | S20 | first scheduled run Thu 22; green by Wed 28 | the scheduled run link |
| 15 | The kill-path drill on R1 (B2-14): the switch-off build of the same commit keeps every letter; sign-ups off on staging (AL-08 part B). The full staging stop of section 2.10 is rehearsed separately, on a scratch project before Thu 22 (RA-19-05, AL-10 part A on #204; the Thu 22 line of the critical path) | founder, S19 | Fri 23; the staging stop rehearsal before Thu 22 | AL-08 parts B and C; AL-10 part A (go/no-go B2-23 on #204) |
| 16 | Build 1 through Beta App Review for the external "Friends" group (AF-11) | founder | submitted Tue 20 or Wed 21 | approval email; B1-11 invitation text |
| 17 | **Freeze rule**: no change to a workflow, `eas.json` or `app.config.ts` merges between the freeze (Tue 27, 12:00 UTC) and the go/no-go (Thu 29), except an S0 or S1 fix | coordinator | Tue 27 to Thu 29 | the merge log |

What the alpha does **not** wait for: RA-20-01 (lineage), RA-20-03 (#30 and the required checks), RA-20-06 (the `testflight.yml` v2), the testers workflow, packs CI, health, advisors and feedback automation. During the alpha the founder adds builds to groups by hand in App Store Connect with automatic distribution off; no automation adds a build to "Friends" before the R-17 sign-off (#152 F21).

### 0.3 What runs on its own, and where a human clicks

```
PR -----------> CI, migration guard, fence, security, aggregators (required)        no click
merge develop -> staging DB and functions --------- staging env ------------------ approver: 1 click
dispatch/nightly -> EAS build -> TestFlight "Founder" -- testflight env ---------- approver until AF-21, then none
promote -> Family (internal), Friends (external) + Beta App Review -- testers env  approver: 1 click
release PR -> release/x.y -> RC tag -> production build -- app-store env --------- approver: 1 click per RC
store text, screenshots, submit for review, phased release -- app-store env ------ approver: 1 click each
founder signs packs on own computer -> PR -> R2 upload -- packs env -------------- approver: 1 click
db-v tag -> production DB -------------------------- db-production env ---------- approver: 1 click
website: PR into main ------------------------------ branch protection on main --- approver review, then merge
health, advisors, drift, reminders, feedback pointers -- health env, private repo -- no click
```

"Approver" is the founder signed in as the AF-02 account. Agents start the runs they may start (section 2.11) with `actions_run_trigger` and read results with `actions_get` and `get_job_logs`.

## 1. What exists, and what is missing

Re-read at `develop` b7669ba (16 Oct): since the first revision #111 (`docs/ops/RELEASE.md`), #79 (`docs/DEVELOPMENT.md`), #124 (PRD V2), #157 (board claims) and #183 (backlog owners) merged; nothing under `.github/`, `apps/mobile/eas.json` or `apps/mobile/app.config.ts` changed [R].

### 1.1 Workflows on `develop` and `main` (69299f8)

| File | Branch | What it does today [R] | Missing for this plan |
|---|---|---|---|
| `ci.yml` | both (develop's is newer) | install with a `node_modules` cache, then `npm test`, `npm run test:db`, `npm run test:functions`, typecheck incl. `apps/mobile`; `required` sums them | Lint, `expo config`, guard tests and SHA pins are on #30; not enforced (no branch protection) |
| `migration-guard.yml` | both | fails a PR that edits, renames or deletes an applied migration | Trusted-ref guard and the reviewed exception are on #30 |
| `db-cli.yml` | develop | on `supabase/**` PRs: real stack, `db reset`, advisory lint, `test:db` | Workflow-level path filter: a skipped workflow stays Pending and blocks a required check, so it cannot be required as is [V8] |
| `deploy-db.yml` | develop | staging on a push to `develop` that changes migrations (since #205); production on a `db-v*` tag through `db-production` (#236); never edits `migrations-applied.txt` | A seeding step does not exist by design |
| `nightly.yml` | develop | random-seed fuzz and the real-stack DB checks | Never runs (schedule needs the default branch [V1]); once it runs, RA-20-19 (#272) opens or updates one `nightly` issue on a red scheduled run and closes it on a green one |
| `testflight.yml` | develop (#145, #241) | manual: typecheck, tests, preflight, then `eas build --non-interactive --wait [--auto-submit]`, with a `profile` input and eas-cli pinned at 24.10.0 (#145); the build job runs in Environment `testflight` and reads its `EXPO_TOKEN`, and every action is pinned by SHA (#241, RA-20-06a) | Cannot be dispatched until AF-05 (not on the default branch) [R] |
| `agents.yml`, `agents-check.yml`, `claude.yml` | develop | agent dispatcher (off until `AGENTS_ENABLED`), roster checks, `@claude` for the owner | `claude.yml`'s gate was `author_association == 'OWNER'`, which agent comments also pass [V-S01, R], and its review triggers ran each pull request's own copy of the file with the repository secrets (SECRETS_REVIEW SR-1). RA-20-02a removes the review triggers and adds `performed_via_github_app == null`, the fork-head refusal, SHA pins and `npm ci`; the comment and issue triggers go live when the default branch changes |
| `web.yml`, `web-e2e.yml` | main | website typecheck, tests, two builds; Playwright e2e | Not on `develop`; path-filtered |
| `ios-compile.yml` | develop (#188, #284) | `compile`: prebuild, pod install, Debug `xcodebuild` for the Simulator on `macos-26`, errors as annotations, on native changes. `launch`: the testflight profile's JavaScript in Release, installed on a simulator and launched for 20 s, failing on a fatal exception, a dead process, an unreadable log or no line from the app, on every mobile change (since #284; the check that would have stopped the #276 crash). Path-filtered `pull_request` and dispatch | Path-filtered, so it needs an aggregator before it can be required (2.12) |

### 1.2 App config and scripts

| Item | State [R] | Missing |
|---|---|---|
| `apps/mobile/eas.json` | five profiles (`development`, `e2e`, `preview`, `production`, `testflight`); server features on in `preview` only, the servers-on store build (#145); `appVersionSource: remote`; empty `submit` profiles | `ascAppId` and `groups` wait for the record |
| `apps/mobile/app.config.ts` | bundle id per `EXPO_PUBLIC_APP_ENV`, privacy manifest, `usesNonExemptEncryption: false` | `extra.eas.projectId` and `owner` (BL-339); `version.json` (#109); export compliance re-checked before backup ships (RA-17-02) |
| `apps/mobile/scripts/preflight-testflight.mjs` | no-network checks; #145 adds `--profile` and the alpha checks | none |
| `scripts/release/doctor.ts` (#303) | read-only check of the alpha connections: Expo project id, and owner (a WARN when missing: eas-cli 24.10.0 needs it only below SDK 53), `ascAppId` for `testflight` and `preview`, signing keys only (the preflight's rule; not the published manifest, `PACK_MANIFEST`, so the doctor can exit 0 while the preflight still FAILs), an Expo login, and an App Store Connect key that finds the `.preview` record; exit 0 when nothing is FAIL, 1 otherwise; live checks run whenever their variables are set, `--live` makes a missing one FAIL, and a missing `ascAppId` (a WARN otherwise) FAIL | key role, TestFlight group settings and EAS variable names stay manual (TESTFLIGHT.md); never run against Apple or Expo yet |
| `scripts/packs/**`, `docs/ops/PACKS_HOSTING.md` | #162 on #126: key, `release`, `upload`, `verify`, `serve`; signing on the founder's computer | a keyless `assemble` for CI (RA-07-01) |
| `scripts/ops/restore-drill.ts`, runbooks | restore drill and replay | a drill on a throwaway project (2.10) |
| `apps/mobile/e2e/**` | Maestro flows; #176 adds the P0 nightly set and run sheets | the macOS workflows (RA-20-10a, RA-20-10) |

### 1.3 The branches the brief named

| Branch (PR) | What it already does | What is missing or stale |
|---|---|---|
| `chore/alpha-release-config` (#145, merged 23 Oct) | Alpha build 1 (`testflight`, servers off) and build 2 (`preview`, servers on); build flags; `preflight:alpha`; the 12-step founder table; `docs/release/ENVIRONMENTS.md`; the kill path; eas-cli pinned; points readers to this file | groups and What to Test by hand (fine for the alpha); the `environment:` and its `EXPO_TOKEN` came after it, in #241 |
| `chore/staging-from-develop` (no PR) | `deploy-db.yml` manual run on `develop` only; production only on a pushed `db-v*` tag | Not opened; no run on merge; dispatch needs AF-05 |
| `ci/release-ios-workflow` (#110, on #109) | `release-ios.yml`: RC checks, production build, internal TestFlight, GitHub Release, `eas metadata:push`, all gated by `app-store` | Screenshots, submit for review, phased release |
| `feat/release-version-metadata` (#109) | `version.json`, `store.config.json` from `packages/content` with a drift test, the BL-440 guard | The guard predates D-100; S16 re-checks it |
| `docs/release-engineering-v2` (#108) | merged 15 Oct: D-089 to D-092, ADR 0022, `docs/release/1.0.0.md` | 1.0 dates predate D-101 and D-106 |
| `docs/release-train-d089` (#111) | **merged 16 Oct**: `docs/ops/RELEASE.md` | Written for the on-device v1.0; linked, not copied |
| `chore/release-plan` (#76), `release/ios-v1.0` | 4 Oct plan on the old `main` lineage | Superseded; not a base |
| `agent/ops/ci-health-release-readiness` (#44, closed) | `CI_HEALTH.md` (162 runs on 3 Oct, free on a public repo), `RELEASE_READINESS.md` | Its REST method is reused by the drift job |
| `ci/hardening` (#30, open) | `fence.yml`, `security.yml`, `dependabot.yml`, SHA pins, trusted-ref guard | The 2 Nov `pull_request_target` policy; the label check accepts any `approve-migration` label (2.1) |
| `feat/packs-hosting-pipeline` (#162 on #126) | as 1.2 | `earlyletters.app` must become a Cloudflare zone, while D-063 records both domains at Porkbun (AF-08) |
| `chore/web-auth-wiring` (#144, `main`) | `/auth/confirm` and the AASA file | the health probe (2.8) |

## 2. The pipeline

### 2.0 Accounts, environments and variables

**The approver account (AF-02).** A second GitHub account held only by the founder: passkey sign-in, never connected to claude.ai, any connector, any CLI or any agent machine; added to this repository as a collaborator with Write (reviewers need at least read access [V2]; approving pull requests on protected branches needs write). It is the **only** required reviewer on every environment that has one, with **"Prevent self-review" on** and **"Allow administrators to bypass" off** [V2]. The account agents use is then not a reviewer and cannot approve by UI or API. Scheduled runs take as actor whoever last changed the default branch [V-S01], so the approver is never a run's actor.

**What this does not fix.** The founder account still owns the repository and can change these settings back [V-S01]. The durable fix is that agents stop holding the owner credential: move the repository to a free organization owned by the approver account with agents as Write members, or connect agent sessions as a Write machine user (decision AF-27; whether claude.ai's GitHub connector can bind to a non-owner account is [U]). Until then, a drift job (RA-20-12) compares `GET /repos/{owner}/{repo}/environments` with a committed `.github/environments.expected.json` (reviewers, `prevent_self_review`, branch policies) and opens an issue on any change; the administrator-bypass switch is not in that object [V-S01], so `ops-reminders.yml` asks for a monthly look.

| Environment | Required reviewer | Deployment refs | Secrets (names only) | Variables | Used by |
|---|---|---|---|---|---|
| `staging` | approver | `develop` only (staging follows `develop`; a push to `main` deploys nothing to a database, decided 17 Oct) | `SUPABASE_DB_URL_STAGING` (exists in DEPLOY.md), `SUPABASE_STAGING_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN_STAGING` (only a scoped token, AF-06), `SUPABASE_STAGING_URL` and `SUPABASE_STAGING_PUBLISHABLE_KEY` (RA-07-06's smoke; public values kept as secrets so logs mask them) | | `deploy-db.yml`, `deploy-functions.yml` |
| `db-production` (renamed from `production`, which resolves to Vercel's `Production`: SR-2 in `docs/security/SECRETS_REVIEW.md`, on #206 until it merges) | approver | tag `db-v*` | `SUPABASE_DB_URL_PROD` (exists); later the production twins | | `deploy-db.yml` |
| `testflight` | approver until AF-21 is in force, then none (see below) | **`develop` only**; release candidates build in `app-store` | `EXPO_TOKEN` from an Expo **robot user** with the Developer role (AF-07) | | `testflight.yml` |
| `testers` | approver | `develop` | `ASC_API_KEY_ID`, `ASC_API_ISSUER_ID`, `ASC_API_KEY_P8` holding key `gha-testers`; `EXPO_TOKEN` from a robot user with the Viewer role, for the build lookup [U: whether Viewer is enough] | `R17_PASSED` | `testflight-testers.yml` |
| `app-store` | approver | tag `ios-v*`, `release/*` (ADR 0022) | `EXPO_TOKEN` (store-lane robot), `ASC_REVIEW_CONTACT_JSON` (ADR 0022), `ASC_API_KEY_ID`, `ASC_API_ISSUER_ID`, `ASC_API_KEY_P8` holding key `gha-release` | | `release-ios.yml` |
| `packs` | approver | `develop` only (a second ref would re-push the same version and fail by design) | `PACKS_S3_ENDPOINT`, `PACKS_S3_BUCKET`, `PACKS_S3_ACCESS_KEY_ID`, `PACKS_S3_SECRET_ACCESS_KEY` (#162) | | `packs-publish.yml` |
| `health` | none | `develop` | `HEALTH_STAGING_API_URL`, `SUPABASE_LINT_DB_URL_STAGING` (catalog-only role, 2.8) | | `health.yml`, `advisors.yml` |
| `agents` | none | `develop` | `AGENTS_APP_PRIVATE_KEY`, `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, `CLAUDE_CODE_OAUTH_TOKEN` (moved from repository secrets, which reach a workflow pushed to any branch [V-S01]) | `AGENTS_APP_CLIENT_ID` | `agents.yml`, `claude.yml`, `release-cut.yml` |

Why `testflight` can lose its reviewer later, and what holds it: an Expo token cannot be limited to one profile; a Developer can make builds and manage credentials [V37], so this token is in effect a store-lane token. Its only hard limit is the `develop` ref rule [V-S01: deployment refs match `GITHUB_REF`, and a dispatch runs the workflow file from the chosen ref, so a job `if:` is not a control]. That rule means something only because AF-03 protects `develop` with no bypass and AF-21 routes `.github/**` to the approver through CODEOWNERS, so no workflow change reaches `develop` without the approver. Until AF-21 is in force (after Thu 29), the approver also reviews `testflight`: one click per build, five to seven in the alpha (#152) [Rec]. The remaining risk after AF-21 (a build or credential change made through EAS with this token) is recorded in ADR 0026.

Same secret names in two environments hold different keys (`gha-testers`, `gha-release`), so each revokes alone. App Store Connect team keys reach every app on the account whatever their role [V14]; the stronger option is individual keys of a dedicated App Store Connect user with App Manager access to the two app records only (individual keys carry the user's app access and cannot use the Provisioning endpoints, which this plan does not need [V13]).

Repository variables (visible to collaborators and printed in public logs if echoed, so no project URL or ref goes here): `EAS_CLI_VERSION` (one pin; #145 and #110 pin 24.10.0; npm's latest is 24.14.0 of 14 Oct [V28]), `EAS_IOS_BUILD_CAP`, `NIGHTLY_PROFILE` (`preview` by default), `AGENTS_ENABLED` (exists). `R17_PASSED` moves into the `testers` environment.

Every secret-holding job runs `npm ci` with only setup-node's npm download cache, never the restored `node_modules` of `.github/actions/setup`: that restore skips npm's integrity check, and once `develop` is the default branch any push to it writes the cache other branches read [V-S01].

### 2.1 Pull request checks

Every workflow below sets `permissions: {}` at the top and grants per job only what the Permissions row says [V-S01 rec].

**`ci.yml`** (exists; #30 extends)
| | |
|---|---|
| Trigger | `pull_request`, push to `develop` and `main` |
| Does | unit and content rules, PGlite database rules, Deno functions, typecheck; #30 adds lint, `expo config`, the `.github/scripts` tests, SHA pins, `ubuntu-24.04`; RA-20-03c adds `actionlint` |
| Permissions | `contents: read` |
| Owner | S20 |
| Proof | 2.12 |

**`migration-guard.yml`, `fence.yml`, `security.yml`** (#30). The fence runs on `pull_request_target` and never checks out pull request code; from Mon 2 Nov GitHub blocks that event in public repositories unless an Actions event policy allows it [V34], so AF-20 adds a policy allowing it for `.github/workflows/fence.yml` only (policies can target workflow paths [V-S01]). RA-20-03a also tightens the label check: today any `approve-migration` label counts and survives later pushes; accept it only when the latest `labeled` event's actor is the approver account, `performed_via_github_app` is null and the event is newer than the head commit [V-S01: label events record the app]. Permissions: `contents: read`, `pull-requests: read`.

**Path-filtered checks** (`db-cli.yml`, `web.yml`, `web-e2e.yml`, `ios-compile.yml`): a path-skipped workflow stays Pending and blocks a required check, and a job skipped by a condition reports Success [V8]. So RA-20-03b gives each an aggregator like `ci.yml`'s `required` (`if: always()`; fail unless every `needs.*.result` is `success`, or is an intended skip after the `changes` job succeeded), and the aggregator is the required check. Without it, a failing `changes` job would skip the work and pass.

**The trace gate** from #176 (`node scripts/trace.mjs --check --no-write --json`) runs as a non-required PR job until PRD V2 07 Q8 is answered (RA-20-16).

**The Vercel status on `develop` PRs**:
| Option | Evidence | Verdict |
|---|---|---|
| A. Merge `main` into `develop` once (RA-20-01) | the missing root directory is the error [R]; `docs/DEVELOPMENT.md` requires merging `main` back (#79, merged) | **[Rec]** after Thu 29: it adds `apps/web` to the root `npm test` and typecheck every build runs [V-QA] |
| B. `previewDeploymentsDisabled` in the project | field exists [V30] | stopgap; loses website previews on `main` PRs |
| C. Ignored Build Step | field exists [V30] | [U] whether it runs before `build-container-init` |
| D. `git.deploymentEnabled` in `vercel.json` | read from the deployed branch [V30] | does not work here |

**Branch protection (AF-03, now).** On both branches: require a pull request; require `required` and `applied migrations unchanged` (both already report on every PR [R: #152 check runs]); block force pushes and deletions; **do not allow bypassing** (so founder-credential sessions cannot push directly). On `main` also one approving review, from the approver. On `develop` no approval count (D-107 lets the coordinator merge app code; since 23 Oct, D-117's operating rule also lets the coordinator merge D-107's founder-only paths after two independent passing reviews on the current head and green CI, so AF-21 as written would add a review D-117 does not ask for) until AF-21: CODEOWNERS names the approver for the founder-only paths of D-107 (`supabase/**`, auth, payments, `.github/**`, `apps/mobile/{eas.json,app.config.ts}`, the engine files), and "Require review from Code Owners" turns on. After RA-20-03 the required list grows to `fence` and the four aggregators.

### 2.2 Merge to `develop`: staging database and Edge Functions

**`deploy-db.yml`** (exists; RA-20-04)
| | |
|---|---|
| Trigger | push to `develop` with a `changes` job for `supabase/migrations/**`, which deploys `develop`'s tip (#205). Staging follows `develop` only: a push to `main` deploys nothing to a database (decided 17 Oct). `workflow_dispatch` on `develop` as the catch-up (fails on any other ref, never reaches production; carried into #205 from #158); push of a tag `db-v*` on a commit on `main` for production, first used with AF-42 after the alpha |
| Does | waits in `staging`; dry run; `supabase db push`; lists unrecorded files in the summary. Production: tag on `main`, waits in `db-production`, dry run, push. **It seeds nothing** (`[db.seed] enabled = false` [R]); APPLY steps 6, 7, 8 and 15 stay founder steps (AF-13) |
| Then | RA-07-06's content-free smoke: anonymous read of `policy_versions` lists `terms` and `sensitive-data`; no table contents are printed |
| Permissions | `contents: read` |
| Environment | `staging`, `db-production` (approver; `production` would resolve to Vercel's `Production`, SR-2; DEPLOY.md's "no reviewer for staging" changes because staging holds family letters) |
| Owner | S20; S02 for migrations |
| Proof | 2.12; do the first staging run before staging holds letters (before Thu 22). "`test:db` against staging" means R-17 checklist 1.4 on #140 (PGlite plus `db-cli.yml` at the reviewed commit), not a run that writes to a database holding letters [V-QA]; checklist rows 1.2, 1.3 and 8.8 (advisor export) stay manual for the alpha |

**`deploy-functions.yml`** (new; RA-20-05)
| | |
|---|---|
| Trigger | push to `develop` changing `supabase/functions/**` (a `changes` job lists folders); `workflow_dispatch` with `function` |
| Does | waits in `staging`; deploys each changed function **except `escrow`** (D-102: its own project, founder only) with `supabase functions deploy <name> --project-ref` [V32]; each function's health path must answer 200. Without a token it does not deploy: the summary is titled "NOT DEPLOYED", it emits `::warning::`, prints the commands for the founder's computer, and is never counted as evidence |
| Secrets | `SUPABASE_ACCESS_TOKEN_STAGING` (a scoped token only: classic tokens carry the whole account, scoped tokens are public alpha [V32]; POPS-04 holds otherwise), `SUPABASE_STAGING_PROJECT_REF` |
| Permissions | `contents: read` |
| Owner | S20; S07 and S01 own the functions |

### 2.3 `develop` to TestFlight internal

**For the alpha**: build 1 and build 2 come from #145's `testflight.yml` (or the founder's computer) with the founder adding each build to a group by hand. RA-20-06a, a follow-up after #145 merged without it: the build job runs in `environment: testflight` and every action is pinned by SHA. That workflow is on `develop` (#241). The founder keeps the repository `EXPO_TOKEN`, if one exists, until one dispatch with the environment secret is green, and deletes it in that same window (AF-22).

**`testflight.yml` v2** (RA-20-06, after Thu 29)
| | |
|---|---|
| Trigger | `workflow_dispatch`; `schedule` at 02:17 UTC [Rec] (schedules can be delayed at the top of the hour [V1]), building only if app code changed on `develop` since the last successful build |
| Does | `npm ci` (no restored `node_modules`), typecheck, tests, preflight; **build cap**: counts this month's iOS builds with `eas build:list --platform ios --json --non-interactive --limit 100` [V28] and stops with a notice at `EAS_IOS_BUILD_CAP`, which is set two builds below the plan's allowance; input `kill-path: true` (the `testflight` profile only) skips the cap so the server-features undo of 2.10 can always build; then `eas build ... --non-interactive --wait --auto-submit --what-to-test "<text>"` [V28]. The submit profile has `ascAppId` and `groups: ["Founder"]` [V28: `groups` in `@expo/eas-json` 24.9.0], so builds land in "Founder" only. What to Test is written here and nowhere else: `apps/mobile/scripts/what-to-test.mjs --profile <p>` reads `packages/content` (RA-16-01) |
| Inputs | `profile`, `submit`, `force` (skips the changed-code test, not the cap), `kill-path` |
| Secrets | `EXPO_TOKEN` (robot, Developer) |
| Variables | `EAS_CLI_VERSION`, `EAS_IOS_BUILD_CAP`, `NIGHTLY_PROFILE` |
| Permissions | `contents: read` |
| Environment | `testflight` |
| Owner | S20; S16 for the text |
| Prerequisites | an App Store Connect API key assigned to the app in EAS and `ascAppId`, or non-interactive submit fails [V23]; when `eas credentials` makes that key it offers "ADMIN (default)" and "APP_MANAGER (least privilege for app management)": choose App Manager [V28: eas-cli 24.10.0 `AscApiKeyUtils.js`] |
| Open | whether the cap counts calendar months or Expo billing periods [U: Expo billing page] |

### 2.4 TestFlight testers: Family, Friends and external review

Groups: "Founder" and "Family" are **internal** (App Store Connect users); "Friends" is **external** (email invitation, no App Store Connect account [V24]). Reasons: internal testers can read every tester's feedback and, with the Developer role, add builds to internal groups [V-QA, V-S01]; the feedback key's Developer role is read-only on external groups [V-S01], so it cannot put a servers-on build in front of friends.

**`testflight-testers.yml`** (new; RA-20-07)
| | |
|---|---|
| Trigger | `workflow_dispatch` only, by the founder (2.11) |
| Inputs | `action` (`add-to-group`, `remove-from-group`, `submit-beta-review`, `expire`), `build`, `group` |
| Does | resolves the build; reads its commit from EAS (`eas build:list --app-build-version <n> --json` [V28]; field name [U]) and decides servers-on from **that commit's** `apps/mobile/eas.json` profile env (`EXPO_PUBLIC_SERVER_FEATURES`), failing closed when unknown; refuses a servers-on build for any group but "Founder" and "Family" unless **both** the `testers` variable `R17_PASSED` is `true` and `docs/DECISIONS.md` at the run's commit holds the "R-17 passed" entry (D-100); for "Friends" fills the beta app description and feedback email from `packages/content` (required for external testing [V24]) and creates a Beta App Review submission [V12]; `expire` sets `expired: true` [V12]. Content-free summary |
| Secrets | `gha-testers` (App Manager: external testing needs Account Holder, Admin or App Manager [V17]); the Viewer robot `EXPO_TOKEN` |
| Permissions | `contents: read` |
| Environment | `testers` |
| Owner | S20 |

Apple facts [V17, V24]: an internal group must exist first; up to 10,000 external testers; the first build submitted for TestFlight review gets a full review, later builds of the same version might not; up to six builds in 24 hours; builds expire 90 days after upload.

### 2.5 App Store release

**`release-cut.yml`** (new; RA-20-09): `workflow_dispatch` with `version`; opens the release PR bumping `apps/mobile/version.json` and adding `docs/release/<x.y.z>.md` with the agents App token from the `agents` environment (a PR opened with `GITHUB_TOKEN` leaves its CI runs waiting for approval [V9]). Permissions: `contents: read`.

**`release-ios.yml`** (#110; RA-20-08)
| | |
|---|---|
| Trigger | `ios-v*` tags; `workflow_dispatch` with `job` from `release/*` |
| Does | #110 today: RC checks, production build, internal TestFlight on the production record, GitHub Release, `eas metadata:push`. Added: `screenshots` (uploads the frames to the version's screenshot sets [V12]), `submit-review` (a review submission for the approved RC [V12], refused unless the release record ticks "App Privacy answers match label <version>"), `phased` (`pause`, `resume`, `complete`; updates only, 7 days, 30 days of pauses in total [V15]), `phased-status` |
| Secrets | `EXPO_TOKEN`, `ASC_REVIEW_CONTACT_JSON`, `gha-release` |
| Permissions | `contents: read`; `contents: write` only on the GitHub Release job |
| Environment | `app-store` |
| Tags | the coordinator pushes `ios-v<x.y.z>-rc.<n>` and `db-v*` tags (ADR 0022, DEPLOY.md): the one exception to "agents never push tags" in 2.11. A tag alone does nothing: its build waits in `app-store` or `db-production` for the approver |
| Owner | S20; S16 listing text; S17 privacy answers |

### 2.6 Speech packs and signed documents to R2

The pipeline is #162. The key is made by `node scripts/packs/keygen.mjs` on the founder's computer and lives in the password manager and a file outside the repo; `publish.ts` refuses a key file inside the repo and any key `keys.ts` does not list [R: #162].

**Signing stays on the founder's computer (the only option offered).** The founder runs `publish.ts release --key-file ...`, commits `keys.ts` and `published.ts` (which hold the exact signed text [R: #162 `configModule`, `contentModule`]) in a PR, which is a `supabase/**` path and so an approver-reviewed merge. CI never holds the key. A CI-held key, even one limited to `remote-config`, could raise `minSupportedVersion` and force every installed app to update [V-S01]; it is not offered.

**`packs-publish.yml`** (new; RA-20-11 with RA-07-01)
| | |
|---|---|
| Trigger | push to `develop` changing `supabase/functions/{config,content}/published.ts` or `packs/**`; `workflow_dispatch` (`dry-run`) |
| Does | waits in `packs`; `publish.ts assemble` (new, keyless) rebuilds `dist/release` from git and the catalog hashes, checks every signature against `keys.ts` and every file against the signed manifest, refusing before any upload on a mismatch; then `upload` (manifest last, nothing overwritten or deleted, same-version or older documents refused) and `verify` |
| Secrets | `PACKS_S3_*` |
| Permissions | `contents: read` |
| Proof | 2.12: dry run, then a scratch bucket or #162's local S3 stand-in, before the live host |

A leaked bucket token alone cannot make phones accept anything (signatures, hashes and version rollback protection [R: #162, G-18]); its worst case is withholding or deleting files.

### 2.7 TestFlight feedback and crash reports

Apple supports it [V12, V19]: crash submissions (with a crash log) and screenshot submissions per app, and webhooks for both, signed with HMAC-SHA256 in `x-apple-signature` [V12]. A crash submission's attributes include `comment`, `email`, `deviceModel`, `osVersion`, `locale` and `timeZone` [V12]. `diagnosticSignatures` per build gives anonymised crash, hang and disk-write backtraces [V12]; TestFlight coverage [U].

The rule: **no tester text, email, screenshot, locale, time zone or device detail (device model, OS version or any other attribute of a submission) ever reaches a public issue, a public log, or a prompt sent to a model provider.** Device details never reach the public repository (`docs/legal/TESTFLIGHT_TESTERS.md` section 2, the row for A6): a public issue here is a content-free pointer, never the feedback itself. Other routes for tester text, closed the same way:
- **Inside App Store Connect**: internal testers can read each other's feedback [V-QA, V-S01]. Friends are external; family members get the lowest role the add-tester screen accepts with access to the `.preview` app only [U: which role that is]; the founder records in writing that family members can see each other's feedback; the invitation texts (B1-11, B2-20) add "other testers on the team can see feedback you send through TestFlight" (S16).
- **Email**: testers can always email feedback from the TestFlight app [V-S01]; the external group's feedback address is a dedicated mailbox that no connector in any agent session reads, not `hello@`, which forwards to the founder's inbox (`docs/ops/DOMAINS.md`).
- **GitHub Apps**: the Claude and agents GitHub Apps are installed on selected repositories only, never on the private feedback repository [V-S01].

**Private route [Rec]:** a private repository (AF-26) runs `testflight-feedback.yml` hourly at :41, polling both app records with key `gha-feedback` (Developer, the narrowest role that reads feedback; Marketing also edits App Store details [V-S01]). In that repository: one issue per submission with build, OS, device model, date, the crash log and a link to the item in App Store Connect. By default comments and screenshots stay in App Store Connect; copying comments in is a founder opt-in after S17's check (AF-26). In this repository: one content-free pointer issue per crash signature (build, profile, exception type, our own frames after an allowlist parser, the private issue number; never the OS or the device model, which stay in the private issue), label `testflight-crash`. Screenshot submissions make no public issue. Note: on GitHub Free a private repository owned by a user gets neither environment secrets with reviewers nor secret scanning [V-S01], so its secrets are repository secrets readable by any branch there; only the founder pushes to it.

| | |
|---|---|
| Secrets (private repository) | `ASC_FEEDBACK_KEY_ID`, `ASC_FEEDBACK_ISSUER_ID`, `ASC_FEEDBACK_KEY_P8`, `PUBLIC_REPO_ISSUES_TOKEN` (fine-grained, this repository only, Issues read and write [U: screen names]) |
| Permissions | `issues: write` on the reporting job only |
| Owner | S07 (`scripts/ops/testflight-feedback.ts`, RA-07-04); S20 (template, RA-20-14); founder (the repository) |

### 2.8 Health

**`health.yml`** (new; RA-20-12, RA-07-02)
| | |
|---|---|
| Trigger | `schedule` at :07, :22, :37, :52 (shortest interval 5 minutes; schedules can be delayed or dropped at high load [V10, V1]); `workflow_dispatch` |
| Does | content-free probes: the site (200), `/.well-known/apple-app-site-association` (200, `application/json`, no redirect; #144), `/privacy`, `/terms`, the staging API health path, hourly `publish.ts verify`; the environments drift job (2.0). One issue per failing check (title = check name, body = status code and time), closed when green |
| Secrets | `HEALTH_STAGING_API_URL` |
| Permissions | `contents: read`; `actions: read` for the drift job; `issues: write` on the reporting job |
| Environment | `health` |

**`advisors.yml`** (new; RA-07-03): weekly and after each staging deploy, Supabase's published lint query `splinter.sql` [V33] run as a **catalog-only** role: no SELECT on `public`, `ops`, `insights`, `auth` or `storage`, a `statement_timeout` and a connection limit; S02 adds the role in a migration with a `supabase/tests` case proving that a select from `entries` fails as that role, and S01 signs it before the URL becomes `SUPABASE_LINT_DB_URL_STAGING` [V-QA, V-S01]. The Management API advisors (experimental [V32]) need an account token and are not used. Whether the dashboard advisor runs exactly `splinter.sql` is [U].

**`nightly.yml`** gains a reporting job (RA-20-19): a red nightly opens or updates one `nightly` issue. **`ops-reminders.yml`**: the quarterly restore drill, builds nearing 90 days [V24], key and token reviews, the monthly admin-bypass look, `EAS_CLI_VERSION` behind npm.

Release health: `release-ios.yml phased-status` reads the phase state [V12]; the G5 crash-free thresholds (`docs/ops/RELEASE.md` 1.3) stay a founder read in App Store Connect ([U] whether the API exposes crash-free rates).

### 2.9 Dependency updates and security scanning

| What | How | Status |
|---|---|---|
| Dependency PRs | `dependabot.yml` on #30; add `cooldown: default-days: 7` to the npm entry (the default is 3 days; security updates are not delayed [V-S01]) | #30, RA-20-03a |
| Dependabot alerts and security updates | Settings, Code security (available for user-owned repositories [V11]) | AF-24 |
| Secret scanning and push protection | free and automatic on public repositories [V11]; push protection for users is on by default on public repositories [V-S01] | AF-24 checks it |
| Code scanning | CodeQL default setup, available for public repositories [V11]; covers JavaScript and TypeScript and the Actions workflows [V-S01]; it follows the default branch, so whether `main`'s website code is still scanned after AF-05 is [U] | AF-24 |
| History scan, production audit | gitleaks and the audit gate in `security.yml` (#30) | #30 |
| Pinned tools | every action by SHA, then the Actions setting "Require actions to be pinned to a full-length commit SHA" once `agents.yml` and `claude.yml` are pinned [V-S01]; `EAS_CLI_VERSION`; Supabase CLI 2.119.0 | RA-20-03c, AF-20 |
| Fork pull requests | "Require approval for all external contributors" [V-S01] | AF-20 |

### 2.10 Rollback, per layer, and how each is tested

Until RA-20-07 exists, every TestFlight undo is the App Store Connect click it names.

| Layer | Undo | Tested by | When |
|---|---|---|---|
| Server features in a build | Remove build 2 from "Family" and "Friends", add build 1 (servers off, kept in TestFlight as the fallback; both planned builds carry local schema v8, so a book's signature, reminders and hide hold across the switch, and only a build cut before #166, a v6 build, would need the kept-column reconcile on branch `fix/mobile-rollback-kept-columns`, #266), expire build 2; for a new servers-off build, `testflight.yml` with `kill-path: true` skips the cap, and the cap keeps two builds of headroom | AL-08 parts B and C on R1 (B2-14) | Fri 23 |
| Staging server (Pro) | Paid projects **cannot be paused** [V35]. Stop: (1) Auth sign-ups off and sign users out; (2) **revoke the publishable key the alpha builds use**: publishable keys are created, named and revoked independently [V36], so build 2 uses a named `sb_publishable_` key, never the legacy anon key, and staging deactivates the legacy keys [V36]; the API gateway then refuses every request from installed builds [V36], and a new key needs a new build; (3) rotate any secret key exposed. [U] until rehearsed | Rehearsed on a scratch project | before Thu 22 |
| Edge Functions | Redeploy the previous commit's function | A no-op change deployed and reverted on staging | before Thu 22 |
| Remote config | In the alpha only `packDownloads` works: `sync` and `invites` have no consumers and no signed config reaches a phone before the keys are in a build (#145 kill path item 5). Set it, upload, set it back | Drill on the live host at a quiet hour: no new download starts on the SE 3; record the measured time in place of #162's "about 5 minutes" [U until measured] | Fri 23 |
| Packs | Roll forward to the last good content at a higher version; phones pick it up at their next manifest check ("at most 6 hours while the app is open" [R: #162]) | Scratch-bucket plants (2.12) and the drill above | Fri 23 |
| TestFlight build | Expire [V12] | Expire R1 on the founder's phone after build 2 lands and record what the installed copy does | Tue 27 or Wed 28 |
| Mistaken promotion (the R-17 undo if a servers-on build reaches "Friends") | Remove the build from the group, then expire it | Remove a throwaway build from "Founder" | Wed 21 |
| `R17_PASSED` | Set back to `false` | The live refused run (2.12) before and after | when RA-20-07 lands |
| Default branch (AF-05) | Set back to `main`; check Vercel again | Not rehearsed (a setting) | n/a |
| Database | Fix forward; restore only by `docs/ops/runbooks/restore-drill.md`, then `sync_begin_epoch` | `scripts/ops/restore-drill.ts` on a throwaway project with fictional data (never staging while it holds letters) | by Wed 21 |
| Phased release | Pause [V15] | Dry run of `phased`; first live on 1.0.1 | first update |
| App Store version | Fix forward with expedited review (`docs/ops/RELEASE.md` 7.3) | n/a | n/a |
| `eas metadata:push` | Push the previous tag's `store.config.json` | Metadata job dry run on the release branch [U: whether `metadata:push` has a dry run] | before the first push |
| Screenshots | Re-upload the previous set (kept as a run artifact) | First upload on a version not yet live | before submission |
| Beta App Review or App Review submission | Withdraw or remove from review [U: UI and API path; Apple Help has "Remove a submission from review"] | not rehearsed | n/a |
| Website | Vercel rollback, a founder action (the connector can change production [V-S01]); Hobby rolls back only to the previous production deployment, Pro to any [V30] | One rollback and forward on a no-op deployment after AF-15 | after Pro |

### 2.11 How agents drive it, and what they never do

- **May dispatch**: the coordinator dispatches `testflight.yml` (lands in "Founder" only, within the cap; ADR 0022 has the coordinator run builds) and `release-cut.yml`; any agent may dispatch `ios-compile.yml`, `nightly.yml`, the kill harness, `ios-e2e.yml`, `web-e2e.yml`, `health.yml` and `advisors.yml`.
- **Never dispatch**: `deploy-db.yml`, `deploy-functions.yml`, `packs-publish.yml`, `testflight-testers.yml`, `release-ios.yml` (COORDINATION section 6: agents never deploy, publish or apply migrations). They run on their merge or tag trigger, or by the founder. Changing that needs a decision entry amending COORDINATION section 6.
- **Never**: approve a deployment; set, read or change a secret, an environment or **any repository or environment variable (`R17_PASSED` above all)**; change a setting, ruleset or branch protection; merge founder-class PRs, except the coordinator under D-117's operating rule (the coordinator's, which the founder may reverse): after two independent passing reviews on the current head and green CI (`npm run test:db` green for database pull requests); push tags, except the coordinator's RC and `db-v*` tags in 2.5.
- **Connectors are production credentials.** The Supabase, Vercel and mail connectors in agent sessions bypass every GitHub gate (0.1 item 8). Agents do not use them against staging, production or the founder's inbox; RA-01-01 lists them.
- Read results with `actions_list`, `actions_get`, `get_job_logs`. Summaries carry build numbers, links and verdicts, never secrets, tester text or project URLs. Limits: a job runs at most 6 hours; a run, including approval waits, at most 35 days [V6].

### 2.12 Planted failures, one per gate

Each must fail before its fix and pass after; S19 records each in RA-19-03 and the first green runs in RA-19-01.

| Gate | Plant | Expected |
|---|---|---|
| `ci.yml` `required` | a failing unit test | `required` red, merge blocked |
| Path-filtered aggregators (`db-cli`, `web`, `web-e2e`, `ios-compile`) | (1) a migration that fails `db reset`; (2) a `changes` step that exits 1 | both block the merge (the second is the skipped-job-counts-as-pass case [V8]) |
| `ios-compile.yml` | a Swift syntax error in a scratch PR | red with the file and line annotated |
| `ios-compile.yml` `launch` | a throw at startup in a dev-only file, in a scratch PR | `launch` red with "threw an unhandled JavaScript exception at launch", and the log names the file and line (planted on #285, run 40086594249, 24 Oct: red, the stack symbolicated to `apps/mobile/src/dev/store-ready.ts:8`, the planted throw) |
| Migration guard | an edit to an applied migration | red (#30's tests plus one real PR) |
| Fence | (1) a `supabase/**` change without the label; (2) the label applied by an app-acting session; (3) a push after the label | all red; after Mon 2 Nov the fence still runs |
| `security.yml` | a gitleaks test string on a throwaway branch | `secrets (full history)` red |
| Branch protection | a direct push to `develop` from an agent session | refused |
| Environments | an agent session approving a `staging` run | refused (not a reviewer); drift job opens an issue when a reviewer is changed |
| `deploy-db.yml` | (1) a dispatch on another ref; (2) a rejected `staging` approval; (3) a second run after a deploy | (1) `manual run is on develop` fails; (2) `supabase_migrations.schema_migrations` count unchanged; (3) the dry run lists nothing |
| `deploy-functions.yml` | (1) a run without a token; (2) a change under `supabase/functions/escrow/` | (1) "NOT DEPLOYED" and a warning, not evidence; (2) not deployed |
| `testflight.yml` | (1) cap set to this month's count; (2) `kill-path: true` at the cap; (3) What to Test over 4,000 characters; (4) a dispatch on another ref | (1) stops with a notice; (2) builds; (3) fails before building; (4) gets no secret and fails |
| `testflight-testers.yml` | (1) a `preview` build to "Friends" with `R17_PASSED` unset; (2) `R17_PASSED` true without the decision entry; (3) an unknown commit | all refused, live, once each |
| `release-ios.yml` | (1) an RC tag that disagrees with `version.json`; (2) `submit-review` without the App Privacy tick | both refused |
| `packs-publish.yml` | on a scratch bucket or #162's local S3 stand-in: (1) a `published.ts` whose signature fails; (2) a same-version re-upload | both refused before any upload |
| Kill harness, `ios-e2e.yml` | (1) a broken selector; (2) a skipped P0 flow (exit 3) | both red (S19's rule on #176) |
| `nightly.yml` | a dispatch with `report_issue` on, from a scratch branch whose fuzz test fails; then a dispatch with `report_issue` on from `develop` | one `nightly` issue with the run link and the red job's name, opened by the first dispatch and closed by the second (B2-22). A dispatch with `report_issue` on closes the issue when green whatever its ref, so run the closing dispatch from `develop` only; scheduled runs need no box |
| `health.yml` | a wrong URL | one issue opened, closed when fixed |
| Feedback poller | a fixture submission whose comment contains "Asha" | the public pointer does not contain it |
| Lint role | `select * from entries` as the role | permission denied (S02 test) |

## 3. Store metadata, screenshots and App Privacy

### 3.1 EAS Metadata or fastlane

| | EAS Metadata | fastlane (`deliver`, `pilot`) |
|---|---|---|
| Status | Beta, subject to breaking changes [V22] | Stable; 2.241.1, Ruby 3.2 or later [V29] |
| Covers | localized info, categories, copyright, age rating with override, release (automatic date, phased), review details [V22] | metadata, screenshots, submit for review, phased release, review information, with an API key [V29] |
| Screenshots | No [V22] | Yes [V29] |
| App Privacy | No | Only with an Apple ID session login [V29] |
| Credentials | EAS's App Store Connect key | a team key in GitHub |
| In the repo already | `store.config.json` from `packages/content` with a drift test (#109), `eas metadata:push` (#110) | No |

**Pick: EAS Metadata for store text (ADR 0022 decision 6, kept), and the App Store Connect client in `scripts/release/asc/` (RA-20-07) for screenshots, review submission and phased release**, since the client is needed anyway for TestFlight groups, Beta App Review and expiry. If its screenshot upload slips, `fastlane deliver --skip_metadata --skip_binary_upload` with `gha-release` is the fallback for that one job.

### 3.2 Screenshots without a Mac

| Route | Feasible | Evidence |
|---|---|---|
| **The iOS Simulator on a GitHub-hosted macOS runner [Rec]**: the Simulator app built on the runner (as `ios-compile.yml` does, so no EAS build is spent), Maestro flows on the fictional family Asha (S19), framed by `scripts/brand/screenshots.mts`, uploaded by `release-ios.yml screenshots` | Yes, free on a public repository | macOS runners listed and free [V4, V5]; screenshot sets in the API [V12]; Maestro's screenshot command and the device names [U] |
| Web-preview captures (`scripts/brand/capture-store.cjs`) | Runs, but renders react-native-web | [U] whether App Review accepts it as the app in use; drafts only |
| By hand from a phone | Always | founder time |

### 3.3 App Privacy answers

The API has no App Privacy resource (the API index and the Apps, App Infos, App Store Versions and App Metadata pages were searched [V12]); the help page names the roles and the duty to keep answers current [V16]. Every answer is entered by hand (AF-42) from S17's worksheet (RA-17-01). Automation only surrounds it: the preflight compares `PrivacyInfo.xcprivacy` with the expected data types (#145 already warns that the manifest declares no collected data while build 2 syncs), and `submit-review` refuses without the tick.

## 4. Founder setup checklist, ordered by what it unblocks

`AF-` numbers are new; "= #152 Fxx" means the step is already in the alpha plan and is not repeated here. Minutes are hands-on time [E]. Steps new in this plan add about **2 hours** to #152's 34 founder hours before Thu 29 (AF-02 20, AF-03 10, AF-05 15, AF-06 extras 10, AF-07 20, AF-11 30, AF-14 5, AF-15 10); AF-11 replaces #152 F26's route of adding friends as App Store Connect users.

### Before Thu 29 Oct

| # | Step | Minutes | Unblocks | Page |
|---|---|---|---|---|
| AF-01 | **Done 29 Oct 2026** (Active, from the founder's own confirmation emails). = #152 F01: Apple enrolment as an individual (two-factor Apple Account, legal name as seller name, 99 USD a year) | 45 + Apple's check | every Apple step, both builds | [V20]; approval time [U] |
| AF-02 | **Approver account**: a second GitHub account, passkey only, never connected to claude.ai, a connector, a CLI or an agent machine; invite it as a collaborator (Write). It becomes the only reviewer of each environment as you create them (AF-07, AF-22), with prevent self-review on and administrator bypass off | 20 | enforcement of every approval; precondition for every secret | [V2]; menu labels [U] |
| AF-03 | **Branch protection now** on `develop` and `main` as in 2.1 (require PR, `required` and `applied migrations unchanged`, no force push or deletion, no bypass; `main` also one review by the approver) | 10 | stops direct pushes; gives the `testflight` ref rule meaning | [V7]; `.github/README.md` API call |
| AF-04 | = #152 F02: Expo account, `eas init`, send the project id | 20 | every EAS build | #145 step 3 |
| AF-05 | After RA-20-02a (`claude.yml` hardened) merges: in Vercel confirm the Production Branch is `main`, **then** set GitHub's default branch to `develop`. `web-e2e.yml` loses its Run button until RA-20-01 [V-S01] | 15 | dispatch, the nightly (B2-22), the kill-harness schedule (B2-11), the fence, `@claude` | [V1]; whether Vercel follows the default branch [U] |
| AF-06 | = #152 F04, with three changes: create `scribe-staging` in a **Supabase organization the agents' connector is not authorized for** (the grant is per organization [V-S01]), or reconnect the connector read-only and scoped to a development project [V-S01]; give build 2 a **named publishable key**; deactivate the legacy keys on staging [V36] | 90 + 10 | staging, build 2, the staging stop (2.10) | DEPLOY.md; [V36] |
| AF-07 | Environments `staging` (approver, ref `develop` only: staging follows `develop`, decided 17 Oct) with `SUPABASE_DB_URL_STAGING`, and `testflight` (refs `develop` only; the approver as reviewer until AF-21) with `EXPO_TOKEN` from an Expo **robot user** with the Developer role (never a personal token [V37]). **Keep the repository `EXPO_TOKEN`** until the workflow that reads the environment secret has merged and one dispatch with it is green | 20 | RA-20-04; RA-20-06a | [V2]; [V37] |
| AF-08 | = #152 F09: D-097 (`earlyletters.app` as a Cloudflare zone for R2), decided over D-063 for that domain by D-111 item 3 (17 Oct); `docs/ops/PACKS_HOSTING.md` has the steps | 150 + DNS | keys PR, words in both builds | #162 runbook |
| AF-09 | = #152 F08, changed: internal groups "Founder" and "Family", **external group "Friends"**, automatic distribution off on each [V18]; family as internal testers with the lowest role the screen accepts and access to the `.preview` app only; record in writing that internal testers can read each other's feedback | 45 | builds 1 and 2; Friends safely | [V18]; roles [V-S01, U] |
| AF-10 | = #152 F12, plus: when `eas credentials` creates the App Store Connect key, choose **App Manager**, never the Admin default [V28] | 45 | build 1, every later submit | [V23], [V28] |
| AF-11 | Submit build 1 for **Beta App Review** for "Friends", with the beta app description and feedback line from S16 (RA-16-01) and a dedicated feedback mailbox no connector reads; invite friends by email | 30 + Apple's review | friends on build 1; build 2 for friends after the go/no-go (same version may skip a full review [V17]) | [V17], [V24]; review time [U] |
| AF-12 | = #152 F13: upload the signed documents; `publish.ts verify` all ok | 30 | B2-8 | #162 |
| AF-13 | = #152 F16 and F17: staging seeding (APPLY steps 6, 7, 8, 15) and the function secrets and deploys; then read RA-07-06's check | 120 | sign-in, deletion (B2-3, B2-13) | `supabase/APPLY.md` |
| AF-14 | Decide by Wed 21 who runs the 500-kill harness: the macOS runner (default) or your Mac | 5 | B2-11 | #152 risk 9 |
| AF-15 | Upgrade Vercel to Pro | 10 | commercial use of the site | [V31]; price [U] |

### After Thu 29 Oct

| # | Step | Minutes | Unblocks | Page |
|---|---|---|---|---|
| AF-20 | Actions settings: default workflow permissions read-only; Actions may not create or approve PRs; "Require approval for all external contributors"; an event policy allowing `pull_request_target` for `fence.yml` only, **before Mon 2 Nov or before #30 merges, whichever is first**; "Require actions to be pinned to a full-length commit SHA" once `agents.yml` and `claude.yml` are pinned | 20 | the fence after 2 Nov | [V34], [V-S01] |
| AF-21 | Merge RA-20-17 (CODEOWNERS names the approver for D-107's founder-only paths), then turn on "Require review from Code Owners" on `develop` | 10 | D-107 enforced, not only written (D-117 now lets the coordinator merge these paths; see "Branch protection" in 2.1) | [V7] |
| AF-22 | The remaining environments (`testers`, `app-store`, `packs`, `health`, `agents`) as each package lands, with the secrets of 2.0; delete the repository `EXPO_TOKEN` after one green dispatch of `testflight.yml` with the environment secret (RA-20-06a, #241), as AF-07 and 2.3 say; or now, since nothing on `develop` or `main` reads it and `testflight.yml` has never run, putting the robot token straight into `testflight`, so that the first green run proves the environment secret was read | 30 | RA-20-06, -07, -08, -11, -12 | [V2] |
| AF-23 | Rulesets for tags `ios-v*`, `db-v*` and branch `release/*` | 10 | store lane | [V7] |
| AF-24 | Code security: Dependabot alerts and updates, CodeQL default setup; confirm push protection is on | 10 | 2.9 | [V11], [V-S01] |
| AF-25 | App Store Connect API access (Account Holder), then team keys `gha-testers` (App Manager, `testers`), `gha-release` (App Manager, `app-store`), `gha-feedback` (Developer, private repository); or the stronger option in 2.0 | 30 | RA-20-07, -08, RA-07-04 | [V13], [V14] |
| AF-26 | The private feedback repository; the Claude and agents GitHub Apps on selected repositories only; the fine-grained token; whether comments may be copied in (after RA-17-03) | 45 | RA-07-04 | [V-S01] |
| AF-27 | Decide the durable fix: an organization owned by the approver account, or a Write machine user for agents | 15 | removes the owner credential from agent sessions | [U] connector support |
| AF-28 | `R17_PASSED` in the `testers` environment, only on the day the R-17 sign-off is recorded | 2 | Friends on servers-on builds through the workflow | D-100 |

### Production (after the post-alpha re-plan, D-106)

AF-40 the production record `com.earlyletters.scribe` (permanent from the first upload) and `submit.production.ascAppId`; AF-41 App Privacy answers by hand from S17's worksheet [V16]; AF-42 production Supabase in the same separate organization as staging, `SUPABASE_DB_URL_PROD` in `db-production` (never `production`, SR-2), the first `db-v*` tag; AF-43 review the external test information once.

## 5. Work packages, by owner stream

Each package is one PR in its stream's files (PRD V2 08 section 3.3 globs, on `develop`). A request to another stream goes in the PR body under "Requests to other owners". "Needs" names what must merge first; packages that edit a shared file wait for the listed order (section 6).

### S20: release, CI and the website

Globs: `.github/**` except the harness workflows while the "harness landing" claim is active, `apps/mobile/{eas.json,app.config.ts,package.json}`, `apps/mobile/src/app/_layout.tsx`, `apps/mobile/scripts/**`, `apps/mobile/test/{capabilities,config,release-config}.test.ts`, `docs/release/**` except `journey/**`, `docs/ops/{DEPLOY,APP_SIZE,RELEASE}.md`, `scripts/release/**`.

| ID | What | Needs | Done when | Alpha |
|---|---|---|---|---|
| RA-20-00 | Land `ios-compile.yml` (`ci/ios-compile-check`); run it on #145 and #150 | none | green on `develop` and on #150 | **yes, first** |
| RA-20-02a | Harden `claude.yml`: require `performed_via_github_app == null` on comments and opened issues (the review triggers are removed, SR-1; `assigned` is dropped because it would read the issue's author, not the assigner); refuse a pull request whose head is a fork (the job fails before any checkout or secret); keep `id-token: write` (without a `github_token` input the action trades the run's OIDC token for the Claude GitHub App token); pin every action by SHA; `npm ci` instead of the restored `node_modules` (SR-9) [V-S01] | the harness claim's release of `claude.yml` (coordinator) | the planted agent comment does not start it (checked after AF-05). Merged by the coordinator under D-117 (#272) | **yes, before AF-05** |
| RA-20-04 | `deploy-db.yml`: `chore/staging-from-develop` plus the push trigger on `develop` behind `staging`; DEPLOY.md | AF-07 | 2.12 plants pass. Founder merge | **yes, window 4** |
| RA-20-06a | Done in #241, a follow-up after #145 merged without it: `environment: testflight` on the build job, SHA-pinned actions, `npm ci` without the restored cache | #241 | one green dispatch with the environment secret | **yes** |
| RA-20-10a | Minimal macOS kill-harness workflow: DL-01 and DL-02 only, dispatch and a nightly schedule, the Simulator app built on the runner | RA-19-04, RA-20-18, AF-05 | a nightly run on `develop` from Thu 22; the gate run Tue 27 | **yes** |
| RA-20-18 | The `_layout.tsx` seam line S19 asked for (#176 request 3) | #176 | the harness drives the app | **yes** |
| RA-20-19 | `nightly.yml`: a red run opens one `nightly` issue | AF-05 | 2.12 plant | **yes** |
| RA-20-01 | Lineage: merge `main` into `develop` | after Thu 29 | a green Vercel preview on a `develop` PR; a green EAS build after it. Founder merge | no |
| RA-20-02 | Default-branch follow-through in `.github/README.md` and TESTFLIGHT.md; TESTFLIGHT.md links to RA-16-01's texts in place of #145's copy (one writer) | #145 merged; RA-16-01; the coordinator's release of `.github/README.md` from the harness claim | every workflow listed by the API | no |
| RA-20-03a | Land #30, with the tightened label check and the npm cooldown | AF-20 policy | fence plants pass, including after Mon 2 Nov | no |
| RA-20-03b | Aggregators for `db-cli`, `web`, `web-e2e`, `ios-compile` (both jobs, `compile` and `launch`) | RA-20-01 (for the web checks) | the two plants of 2.12 block merges | no |
| RA-20-03c | `actionlint`, `permissions: {}` defaults, SHA pins everywhere; the required-check list on both branches | RA-20-03a | required checks read back by API | no |
| RA-20-05 | `deploy-functions.yml` | AF-06 token, or none | 2.12 plants pass | no |
| RA-20-06 | `testflight.yml` v2 (2.3) | RA-16-01, AF-10, AF-21 (or nightly builds wait for the approver), AF-22 | a nightly build reaches "Founder" with its text; the cap plants pass | no |
| RA-20-07 | `scripts/release/asc/` client and `testflight-testers.yml` | AF-25 | fixture tests and the three live refusals | no |
| RA-20-08 | `release-ios.yml`: land #109 and #110; the added jobs (#111 already merged) | RA-20-07 | dry run prints the planned calls; first RC record | no |
| RA-20-09 | `release-cut.yml` | the `agents` environment | a test PR with the bump and green CI | no |
| RA-20-10 | Full `ios-e2e.yml` (P0 nightly) and the screenshots job | RA-20-10a; testIDs from the screen owners (`apps/mobile/e2e/TESTID_REQUESTS.md`) | nightly result; a screenshots artifact (Asha only) | no |
| RA-20-11 | `packs-publish.yml` | RA-07-01, AF-22 | scratch plants, then `verify` all ok | no |
| RA-20-12 | `health.yml` (with the drift job), `advisors.yml`, `ops-reminders.yml` | RA-07-02, RA-07-03, the lint role | 2.12 plants | no |
| RA-20-13 | Optional website staged promote (`autoAssignCustomDomains` off and `vercel promote` [V30]) in a `web-production` environment | AF-15 | rehearsed on a no-op change | no |
| RA-20-14 | Docs cross-links; the private feedback workflow template | RA-07-04 | links resolve; `actionlint` passes | no |
| RA-20-16 | Trace gate as a non-required PR job | #176 | runs on every PR | no |
| RA-20-17 | CODEOWNERS proposal naming the approver for D-107's founder-only paths (founder-owned file; D-117 now lets the coordinator merge those paths) | AF-02 | founder merge, then AF-21 | no |

### S07: platform and ops (`scripts/ops/**`, `scripts/packs/**`, `docs/ops/**` except S20's files)

| ID | What | Needs | Done when | Alpha |
|---|---|---|---|---|
| RA-07-06 | `scripts/ops/staging-smoke.ts`: the content-free post-deploy check (anonymous `policy_versions` read lists both versions; function health paths 200) | none | runs green on staging after AF-13 | **yes, Thu 22** |
| RA-07-01 | `publish.ts assemble` (keyless) | #145 and #162 merged; the "packs hosting pipeline agent" claim on `scripts/packs/**` closed | `assemble` equals a signed `release` byte for byte; a tampered `published.ts` fails | no |
| RA-07-02 | `scripts/ops/health-probe.ts` and `docs/ops/runbooks/health-alert.md` | none | unit tests | no |
| RA-07-03 | `scripts/ops/advisors.ts` with a pinned `splinter.sql`; `docs/ops/runbooks/advisor-finding.md`; the lint-role request to S02 | S02 migration and S01 sign-off | a planted table without row-level security is reported on a local stack | no |
| RA-07-04 | `scripts/ops/testflight-feedback.ts` and `docs/ops/TESTFLIGHT_FEEDBACK.md` | RA-20-07 client | the "Asha" plant | no |
| RA-07-05 | One rollback runbook per row of 2.10, naming the click | the rehearsals | each linked to its evidence | no |

### S02 (request): a catalog-only lint role in a new migration, with the `supabase/tests` case that a select from `entries` fails as that role (2.8).

### S19: test gates and evidence (`apps/mobile/e2e/**`, `docs/qa/**`, `scripts/trace.mjs`)

| ID | What | Done when | Alpha |
|---|---|---|---|
| RA-19-04 | The DL-01 and DL-02 kill harness, run by RA-20-10a | 500 of 500 each on the freeze commit (B2-11) | **yes, by Thu 22; gate Tue 27** |
| RA-19-05 | Rehearsals with evidence: the kill path on R1 (B2-14), the staging stop on a scratch project, `packDownloads` on the live host, the restore drill on a throwaway project, the TestFlight expiry check; new rows in `docs/qa/ALPHA_GO_NO_GO.md` on #176 (B2-22 nightly and these) | each rehearsal has an evidence file | **yes** |
| RA-19-01 | One evidence file per first green run of every workflow | every row of section 2 has one | partly |
| RA-19-02 | Maestro screenshot flows on the Asha seed | six raw captures per size | no |
| RA-19-03 | The planted failures of 2.12 | each fails before its fix | partly |

### S16: store and tester copy (`packages/content/**`)

| ID | What | Done when | Alpha |
|---|---|---|---|
| RA-16-01 | `packages/content/src/release/testflight.en.ts`: the two What to Test texts (replacing #145's copy in `docs/release/TESTFLIGHT.md`, which then links here: one writer), the beta app description, the feedback line, the invitation line "other testers on the team can see feedback you send through TestFlight" | content rules pass; each text capped at 4,000 characters by a test [U: Apple's limit is not stated in the API reference [V12]] | **yes, by Mon 19 for AF-11** |
| RA-16-02 | The server-on store listing and screenshot captions | waits for #110 (it edits `store.en.ts`), or #110's copy change moves to S16 | no |

### S17: App Privacy and legal (`docs/legal/**`)

RA-17-01 the App Privacy worksheet per build that changes data collection; RA-17-02 the export compliance memo for app-level encryption of recordings (#150) before any build with backup on; RA-17-03 whether GitHub may hold tester comments; RA-17-04 the feedback visibility of internal testers and the tester notice, with S16 (alpha, by Mon 19).

### S01: secrets and permissions (`docs/security/**`)

RA-01-01, before any secret is added: the approver account and environment settings (read back), branch protection, every workflow's `permissions:`, token scopes (Expo robots, App Store Connect roles, R2, Supabase, fine-grained GitHub token), the `agents` environment, the cache rule, the fence label check, the lint role, and the **connectors as production credentials** (Supabase, Vercel, mail); `docs/security/SECRETS_REVIEW.md` signed.

## 6. Order and dependencies

Dates follow #152 section 2.2. These dates no longer hold (28 Oct: most have passed, and no build exists yet); the proposed dates written inline and at the top of `docs/release/TESTFLIGHT.md` stand until the founder confirms.

```
Fri 16  window 1: #145 (with RA-20-06a if ready), the project-id PR. AF-02, AF-03, AF-04
Mon 19  window 2: RA-20-00 ios-compile, RA-20-02a claude.yml. AF-01 Active (latest Fri 23; done Thu 29), AF-06, AF-08, AF-09;
        RA-16-01 alpha texts, RA-17-04
Tue 20  window 3: the keys PR. AF-10 build 1 (proposed by the coordinator: Mon 26 Oct, until the founder confirms); AF-11 Beta App Review for Friends
Wed 21  window 4: RA-20-04 staging, the R-17 batch. AF-05 default branch (latest), AF-07, AF-12, AF-14;
        restore drill on a throwaway project
Thu 22  window 5: RA-20-10a + RA-19-04 + RA-20-18 kill harness, RA-20-19 nightly report, RA-07-06 smoke.
        AF-13 seeding and functions; first scheduled nightly; staging stop and functions rehearsals done
Fri 23  R1: kill-path drill (B2-14), packDownloads drill; ios-compile green on #150
Mon 26  R-17 sign-off (#152 F21)
Tue 27  freeze 12:00 UTC; 500-kill gate overnight (B2-11); build 2 (proposed: freeze Tue 3 Nov 5:00 AM PT, which is 13:00 UTC because daylight saving time ends Sun 1 Nov; DECISIONS.md D-089, until the founder confirms)
Wed 28  green nightly within 24 h of build 2 (B2-22); TestFlight expiry check
Thu 29  go/no-go (proposed by the coordinator: Thu 5 Nov, until the founder confirms)
after   RA-20-01, RA-20-03a/b/c, AF-20 (before Mon 2 Nov), RA-20-05/06/07/08/09/10/11/12, RA-07-*, AF-21 to AF-28
```

Order for the shared release files: `apps/mobile/eas.json` and `app.config.ts`: #126, #145, the BL-349 PR (before Wed 21), #138 rebased; after Thu 29: #109, RA-20-06, RA-20-10. `scripts/packs/{lib,publish}.ts`: #145 and #162 (via #126), then RA-07-01. `packages/content/src/store.en.ts`: #110, then RA-16-02.

## 7. Risks

| # | Risk | Signal | Mitigation |
|---|---|---|---|
| 1 | Agent sessions approve or change settings as the founder | an approval or setting change the founder did not make | AF-02 (enforced for approvals once in force), AF-03, the drift job, AF-27; until AF-02 it is policy only |
| 2 | Public logs leak a value | a project URL or tester detail in a log | secrets for masked values; content-free summaries; feedback in a private repository; the "Asha" plant |
| 3 | The default-branch switch moves something unexpected | Vercel production branch changes; `claude.yml` answers an agent comment | Vercel checked before the switch; RA-20-02a first; `agents.yml` stays off until `AGENTS_ENABLED` [R] |
| 4 | The fence stops after Mon 2 Nov | fence check missing or blocked | AF-20 policy |
| 5 | Connectors reach staging data | a connector call against staging | AF-06 separate organization or read-only scoping; 2.11 |
| 6 | Internal testers read each other's feedback | a tester reports seeing another's note | Friends external; family consent recorded; invitation line |
| 7 | EAS Free allowance runs out | the cap notice | cap with headroom and `kill-path`; Starter per D-092; Simulator builds on the runner, not EAS |
| 8 | Staging cannot be paused on Pro [V35] | an incident | the revocable named publishable key, rehearsed |
| 9 | Beta App Review for Friends takes longer than planned [U] | no approval by Thu 22 | submit build 1 on Tue 20; friends wait, family proceeds |
| 10 | EAS Metadata is beta [V22] | `metadata:push` breaks after a bump | one pinned `EAS_CLI_VERSION`; fastlane fallback for one job |
| 11 | Scoped Supabase tokens are public alpha [V32] | not offered | functions from the founder's computer; POPS-04 holds |
| 12 | First-run CLI behaviour is unproven (`--auto-submit` with `--no-wait`) [U] | first RC | dry runs; record it |
| 13 | Schedules delayed or dropped [V1] | missed health or nightly runs | off-the-hour minutes; the nightly issue; an external monitor later [U] |
| 14 | Team keys reach every app [V14] | a key used outside its job | one key per job; individual keys option; reviews in `ops-reminders.yml` |
| 15 | Export compliance changes with app-level encryption | build 2 with backup on | RA-17-02 before the backup flag turns on |
| 16 | App Privacy answers drift from the build | a data type added in code | RA-17-01; the preflight; the submit gate |
| 17 | Public-repo schedules stop after 60 days without activity [V1] | a quiet repository | monthly look in `ops-reminders.yml` |

## 8. Costs

| Item | Cost | Source |
|---|---|---|
| Apple Developer Program | 99 USD a membership year | [V20] |
| GitHub Actions here (public), standard runners incl. macOS | free; larger runners always charged | [V4, V5] |
| GitHub Actions in the private feedback repository | the plan's free quota, then billed | [V4]; the quota number [U] |
| EAS Free | 15 iOS builds a month, low priority, one at a time | D-092 (expo.dev/pricing, read 3 Oct); [U] today: page not reachable here; a search excerpt of it on 16 Oct agrees |
| EAS Starter | 19 USD a month with 45 USD of build credit | [V27] |
| EAS build prices beyond credit | the docs' examples: 2 USD (medium) and 4 USD (large) per iOS build | [V27] examples; the pricing page governs [U] |
| Our EAS use | alpha 5 to 7 (#152); nightly about 15 to 22 a month after the alpha [E]; Simulator builds for the harness, e2e and screenshots run on the macOS runner and use none | [E] |
| Vercel Pro | 20 USD per developer seat a month in third-party reports (makerkit.dev, schematichq.com) | [U] vercel.com/pricing |
| Supabase | staging on Pro (about 25 USD a month [A], #152 risk 7) plus the escrow staging project: a paid organization's compute credit covers one project and each additional project starts at about 10 USD a month | [V-QA: Supabase billing FAQ] |
| Cloudflare R2 | 0 USD at alpha scale | #162 cost section (read 15 Oct) |

## 9. Sources

Read 16 Oct 2026 unless a date is given. "Source" means the vendor's own documentation repository or package.

- V1. GitHub, Events that trigger workflows: dispatch and schedule need the file on the default branch; after one run, dispatch on any branch or tag by API; `pull_request_target` and `issue_comment` run from the default branch on github.com; schedules delayed at high load and disabled after 60 days without activity on public repositories. Source: github/docs `content/actions/reference/workflows-and-actions/events-that-trigger-workflows.md`, `data/reusables/actions/{branch-requirement,schedule-delay}.md`.
- V2. GitHub, Deployments and environments: up to six reviewers with at least read access, prevent self-review, deployment branches and tags, administrators bypass by default and the option to disallow, environment secrets, availability on public repositories. Source: github/docs.
- V3. GitHub, Review deployments. Source: github/docs.
- V4. GitHub, GitHub Actions billing: free for public repositories on standard runners; larger runners always charged. Source: github/docs.
- V5. GitHub, GitHub-hosted runners: `macos-latest` (macos-26 arm64), `macos-15`, `macos-14` for public repositories. Source: github/docs `data/reusables/actions/supported-github-runners.md`.
- V6. GitHub, Actions limits: 6 hours a job, 35 days a run including approval waits, 20 concurrent jobs and 5 macOS on Free. Source: github/docs.
- V7. GitHub, rulesets and protected branches on public repositories on Free. Source: github/docs `data/reusables/gated-features/{repo-rules,protected-branches}.md`.
- V8. GitHub, Troubleshooting required status checks and Skip workflow runs: path-filtered workflows stay Pending and block merging; a job skipped by a conditional reports Success. Source: github/docs, through GitHub code search.
- V9. GitHub, GITHUB_TOKEN events start no runs except `workflow_dispatch` and `repository_dispatch`; PRs it opens start runs needing approval. Source: github/docs `data/reusables/actions/actions-do-not-trigger-workflows.md`.
- V10. GitHub, schedule syntax: shortest interval 5 minutes. Source: github/docs.
- V11. GitHub, availability of code scanning, secret scanning and Dependabot alerts. Source: github/docs `data/reusables/gated-features/`.
- V12. Apple, App Store Connect API reference (developer.apple.com/documentation/appstoreconnectapi): TestFlight (beta groups, beta app review submissions, beta build localizations, beta feedback crash and screenshot submissions and their attributes), builds (`expired`), App Store (screenshot sets, age ratings, review submissions, phased releases), webhooks (event types, HMAC), diagnostic signatures. No App Privacy or data-usage resource in the API index or the Apps, App Infos, App Store Versions and App Metadata pages.
- V13. Apple, Creating API Keys for App Store Connect API: team and individual keys; key roles are user roles; the Integrations path; one-time download.
- V14. Apple Help, App Store Connect API: the Account Holder requests access; team keys apply across all apps.
- V15. Apple, Release a version update in phases.
- V16. Apple, Manage app privacy.
- V17. Apple, Invite external testers.
- V18. Apple, Add internal testers.
- V19. Apple, View tester feedback.
- V20. Apple, Enrolling (developer.apple.com/programs/enroll/).
- V21. Apple, Upcoming requirements (Xcode 26).
- V22. Expo, EAS Metadata and its schema. Source: expo/expo `docs/pages/eas/metadata/`.
- V23. Expo, Submit to the Apple App Store. Source: expo/expo `docs/pages/submit/ios.mdx`.
- V24. Expo, TestFlight. Source: expo/expo `docs/pages/submit/testflight.mdx`.
- V25. Expo, App version management. Source: expo/expo.
- V26. Expo, Environment variables. Source: expo/expo.
- V27. Expo, Plans and Usage-based pricing. Source: expo/expo `docs/pages/billing/`.
- V28. eas-cli 24.8.0 and 24.10.0 from npm (flags of `build`, `submit`, `build:list`; `credentials/ios/actions/AscApiKeyUtils.js` offers "ADMIN (default)" and "APP_MANAGER (least privilege for app management)"), `@expo/eas-json` 24.9.0 submit schema, npm release dates.
- V29. fastlane source: `version.rb`, `deliver/lib/deliver/options.rb`, `upload_app_privacy_details_to_app_store.rb`.
- V30. Vercel documentation (the Vercel documentation tool): `git.deploymentEnabled`, `ignoreCommand`, rollback on Hobby, `vercel promote`, `--skip-domain`, the update-project fields; deployment data through the Vercel tools.
- V31. Vercel, Fair use guidelines (vercel.com/docs/limits/fair-use-guidelines): Hobby is for non-commercial personal use (coordinator, 15 Oct).
- V32. Supabase documentation (the Supabase documentation tool): deploying Edge Functions from CI with `SUPABASE_ACCESS_TOKEN`; classic and scoped personal access tokens (scoped in public alpha); the experimental Management API advisors endpoints.
- V33. supabase/splinter README: `splinter.sql`.
- V34. GitHub, Securely using `pull_request_target`: a default policy blocks the event in public repositories; enforced on 2 November 2026; an event policy can allow it. Source: github/docs `content/actions/reference/security/securely-using-pull_request_target.md` and `data/reusables/actions/workflows/pull-request-target-policy.md`.
- V35. Supabase, Project Pausing: "Projects under a paid plan cannot be paused" (Supabase documentation tool).
- V36. Supabase, Migrating to publishable and secret API keys: publishable keys are created, named and revoked independently; legacy keys can be deactivated; the API gateway checks the `apikey` against the project's key list (Supabase documentation tool).
- V37. Expo, Account types and Programmatic access: robot users authenticate only by token and take a role; the Developer role "can create new projects, make new builds, release updates, and manage credentials". Source: expo/expo `docs/pages/accounts/{account-types,programmatic-access}.mdx`.
- V-S01 and V-QA items: the sources the reviewers named in PR #185 comments 6222183586 and 6222021200 (GitHub REST description `environment-approvals`, personal-repository permission levels, workflow execution protections, cache scope rules, Dependabot cooldown, push protection defaults, CodeQL default setup languages; Apple's role permissions table and developer.apple.com/testflight; the Supabase MCP and billing pages).
