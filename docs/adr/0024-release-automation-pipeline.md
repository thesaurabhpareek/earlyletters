# ADR 0024: Release automation pipeline

- **Status:** Proposed, 16 Oct 2026. Each numbered decision takes effect when the founder accepts it (in this PR's review or in writing); decision 1 is a founder setting, not a file change.
- **Deciders:** founder. Reviewers: S01 (secrets and permissions), S20 (release), S07 (ops), S19 (test gates), S17 (privacy).
- **Builds on:** ADR 0022 (release engineering: two lanes, version in `apps/mobile/version.json`, EAS build numbers, RC tags on `release/*`, EAS Metadata for store text, the `app-store` environment, no OTA), D-041 (migrations reach hosted projects only through CI), D-089 to D-092, D-097 (pack host), D-100 (server features on after the R-17 gate), D-106 (alpha against staging), D-107 (founder-only merges and production deploys).
- **Plan and evidence:** `docs/release/AUTOMATION.md` (every workflow, the founder checklist, the work packages, risks, costs and sources). Labels there: [V] verified on the vendor's own page or source, [R] repo fact, [U] unverified.
- **Number:** 0024 is the next id after counting `develop` and open PRs (0021 on #42, 0023 on #139, #146 and #150), as `scripts/agents/next-id.mjs` (#137) counts. The coordinator renumbers at merge if needed.

## Context

The founder asked for "proper actions and journey to automate everything". The sandbox agents work in cannot reach expo.dev or App Store Connect, so every build, submission and store action must run in GitHub Actions, started by an agent through `workflow_dispatch` and read back from run logs. Secrets live only in GitHub environment secrets and EAS. Production actions and real-data actions stay founder-only (D-107), as one approval click.

Facts found on 16 Oct 2026 that shape the design:
1. **The default branch is `main`** [R: repository settings], and `main` holds only `ci.yml`, `migration-guard.yml`, `web.yml` and `web-e2e.yml` [R]. GitHub runs `schedule` and `workflow_dispatch` workflows only when the file exists on the default branch, and runs `pull_request_target` from the default branch on github.com [V: GitHub docs, events that trigger workflows]. So today `testflight.yml` cannot be dispatched, `nightly.yml` and `agents.yml` never run on schedule, and the fence in PR #30 would run main's copy, which does not exist. The Actions API lists none of `testflight.yml`, `deploy-db.yml`, `nightly.yml` or `agents.yml` [R: list workflows, 16 Oct].
2. **The two lineages diverge.** `apps/web` exists only on `main`; the Vercel project's root directory is `apps/web`, so every preview of a `develop`-based branch fails at `build-container-init` with `NOW_SANDBOX_WORKER_ROOTDIR_NOT_EXIST` [R: Vercel deployment `dpl_3fbe7smLCY5TzbuQHR8zJLvrm98b`, PR #152].
3. **App Store Connect API coverage** [V: Apple API reference]: it covers TestFlight groups, Beta App Review submissions, "What to Test" (beta build localizations), build expiry, screenshots, age ratings, review submissions, phased release pause and resume, webhooks, and TestFlight feedback (crash and screenshot submissions, whose attributes include the tester's `email` and `comment`). It has no App Privacy (data usage) resource; fastlane's App Privacy action logs in with an Apple ID session instead of an API key [V: fastlane source].
4. **EAS Metadata is beta and does not upload screenshots** [V: Expo docs source]. `eas submit` takes `--groups` (internal groups) and `--what-to-test`; `eas build` takes `--what-to-test` with `--auto-submit`; both exist in eas-cli 24.8.0 and 24.10.0 [V: npm tarballs].
5. **The repository is public**, so Actions logs and issues are public. TestFlight feedback can carry a child's name or a letter's words (TDD 07 OQ-4).
6. **GitHub Free on a public repository** includes environments with required reviewers, deployment branch and tag rules, an option to stop administrators bypassing protection, rulesets and protected branches; standard hosted runners, macOS included, are free [V: GitHub docs]. By default administrators can bypass environment protection [V].

## Decision

1. **`develop` becomes the default branch** (founder, Settings, General). Schedules, dispatch, the fence and `@claude` then use `develop`'s workflows, where workflow changes land first under review. Vercel's production branch stays `main` (checked after the change).
2. **One lineage.** One founder-merged PR brings `main` into `develop` (the `docs/DEVELOPMENT.md` merge-back rule, #79), so `apps/web` and its workflows exist on both. After that, `main` moves only by release PRs and website hotfixes merged back the same day.
3. **Seven GitHub environments**, each with administrator bypass turned off and deployment refs restricted: `staging` and `production` (database and functions; founder approves), `testflight` (internal builds; no approval), `testers` (Family, Friends and external groups, Beta App Review, expiry; founder approves), `app-store` (ADR 0022; founder approves), `packs` (pack and document upload; founder approves), `health` (read-only probes; no approval). No secret is a repository secret except the agents harness's own.
4. **Internal TestFlight runs on its own.** A merge that changes app code makes `develop` eligible; a nightly run builds one profile (`NIGHTLY_PROFILE`, default `preview`) and any dispatch builds either profile, within a monthly build cap, and `eas submit` adds each build to the internal group "Founder" only. Promotion to "Family", "Friends" or an external group is a dispatched job in `testers` that the founder approves. Servers-on builds go to anyone outside the family only after the founder sets `R17_PASSED` (D-100), and the job refuses otherwise.
5. **Store and TestFlight actions use one small TypeScript App Store Connect client** in `scripts/release/asc/` (JWT from a team API key with the App Manager role, held in `testers` and `app-store`): groups, Beta App Review, What to Test, expiry, screenshots upload, review submission, phased release. Store text stays on EAS Metadata (ADR 0022 decision 6). fastlane is not adopted: a second toolchain (Ruby 3.2 or later) for features one client covers, and its App Privacy path needs an Apple ID session. App Privacy answers stay manual.
6. **Pack signing stays on the founder's computer** (#162). CI never holds the signing key: the founder signs and commits the signed documents (`published.ts`), and `packs-publish.yml` in `packs` rebuilds the unsigned pack files, checks every signature against `keys.ts` and every hash against the signed manifest, then uploads with the bucket-scoped R2 token. Holding the key in CI is the founder's option, not the default.
7. **Tester feedback stays private.** A poller in a private repository reads TestFlight feedback through the API; its logs and stored items never touch the public repository. Public issues carry content-free pointers only (build, OS, device model, exception type and app frames). Never a comment, email or screenshot.
8. **Health is scheduled and content-free**: probes every 15 minutes (GitHub's minimum is 5, and schedules can be delayed [V]), advisors weekly, one issue per failing check, closed when green.

## Alternatives considered

| Option | Why not |
|---|---|
| Keep `main` as default; copy workflow files onto `main` | Every workflow change needs two merges, and `main` is the live website branch; a stale copy on `main` silently governs dispatch, schedules and the fence |
| Fix Vercel with `git.deploymentEnabled` in `vercel.json` | The file is read from the root directory of the branch being deployed; `develop` has no `apps/web`, so there is no file to read |
| Disable Vercel preview deployments (`previewDeploymentsDisabled`) | Works as a stopgap, but loses website previews on `main` PRs; one lineage removes the cause |
| fastlane `deliver` and `pilot` for all store work | Covers metadata, screenshots, submission and phased release with an API key [V: deliver options], but adds Ruby, duplicates the EAS Metadata path already built (#109, #110) and its App Privacy action needs an Apple ID session |
| EAS Workflows instead of GitHub Actions | A second pipeline outside our checks and environments (ADR 0022 rejected it); agents cannot reach expo.dev to read its logs |
| App Store Connect webhooks into GitHub | Needs a public HTTPS receiver holding a GitHub token; polling on a schedule needs neither. Revisit for build-state events |
| Signing key as a CI secret | One leaked workflow on an allowed ref exposes a key compiled into every app; uploads need only the bucket token, and signatures already make a bad upload harmless |
| Feedback text in public issues | The repository is public; tester text can hold a child's name (CLAUDE.md privacy rules) |

## Consequences

- The founder's recurring clicks: approve `staging` deploys after migration merges, approve `testers` promotions and Beta App Review, approve `app-store` jobs, approve `packs` uploads, merge `main`. Everything else runs on schedule or on an agent's dispatch.
- Agents start runs as the founder's GitHub account (MCP tools), so GitHub cannot tell an agent's approval from the founder's. Environments stop the agents' GitHub App and anyone without admin; founder-credential sessions are held by the written rule (COORDINATION section 6) that agents never approve deployments, and by the founder seeing every approval request. S01 reviews this before any secret is added.
- Builds draw on EAS's monthly allowance (D-092). Automatic nightly builds will pass the Free plan's 15 iOS builds a month [U: expo.dev/pricing, not reachable here]; the cap variable stops builds at the limit until the founder moves to Starter ($19 a month with $45 of build credit [V: Expo docs source]).
- Vercel Hobby is for non-commercial use (coordinator, verified 15 Oct, Vercel fair use guidelines); the website advertises a paid product, so Pro is a founder prerequisite.
- Supabase Edge Function deploys from CI need an access token; classic tokens carry the whole account, scoped tokens are in public alpha [V: Supabase docs]. Until a scoped token exists for the founder's account, functions deploy from the founder's computer and CI prints the commands (POPS-04 holds).
- Export compliance (`usesNonExemptEncryption: false`) must be re-assessed before a build ships app-level encryption of recordings (backup, #150) [U: Apple's exemption for operating-system encryption; counsel].

## Sources

The numbered list in `docs/release/AUTOMATION.md` section 9 (read 16 Oct 2026 unless noted).
