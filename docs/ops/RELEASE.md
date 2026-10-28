# Release train: from a merged wave to the App Store

Owner: qa-e2e (writer) for the coordinator, who runs the train, and the founder, who approves every irreversible step (COORDINATION section 1). Version 1.3, 15 Oct 2026: ported to `develop` from Line B (`d1cbddb`, port map #117), marked for the on-device v1.0, amended for the founder's release decisions D-089 to D-092 (ADR 0022) by the release-engineering thread, then revised for the `app-store` environment gate and the 15 Oct reviews; where this file and ADR 0022 differed, ADR 0022 is what the founder approved. Rows that name files, sections or test rows that exist only on `auto/2026-10-05-fixes` (Line B) say so.
Inputs: `docs/agents/COORDINATION.md` 6, `docs/DECISIONS.md` (D-004, D-041, D-045, D-053, D-060, D-064 to D-067), `docs/ROADMAP.md` 2.1, `docs/FOUNDER_TASKS.md`, TDD 07 sections 9 to 11, `supabase/APPLY.md`, `scripts/packs/publish.ts` and ADR 0016 section 7, `docs/ops/AUTH_SETUP.md`, `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md`, `docs/ops/APP_SIZE.md`, `docs/legal/app-store-privacy-labels.md`, `docs/store/app-store.md`, `docs/qa/DEVICE_TEST_PLAN.md` 1.1.

**Scope changed on 15 Oct (D-100, D-101, D-106).** This file was written for an on-device v1.0. v1.0 now has server features on behind the R-17 gate, the date moves, and a servers-on TestFlight alpha against staging comes first (target Thu 29 Oct; #152, `docs/release/AUTOMATION.md`). So:
- Every row marked **v1.1** below (sign-in setup, database migrations, Edge Functions, the demo account, the co-parent exit) **applies to the v1.0 store release**.
- Rows that say v1.0 has no sign-in, no account or no server (5.2 step 4, 5.3 step 3, 6.4, 6.8, section 10's opening line) are superseded for the store release.
- The alpha runs on the preview lane; this train's store lane starts once the submission date is set.
- The cut from `main` (1.1) needs the one-lineage merge first (ADR 0022, 17 Oct amendment; ADR 0026 decision 4, Proposed).

Labels: **V** verified on a vendor page on the date given (sources at the end); **A** assumption, check when you get there; **F** fact found in this repo. Apple's and Expo's screens move; if a label below differs, follow the screen and fix this file.

## 0. The train on one page

```
wave branch auto/<date>-<topic>  --(coordinator: all checks green)-->  develop
preview lane (C0, C1): develop  --(testflight.yml, `testflight` profile, .preview record)-->  TestFlight  (docs/release/TESTFLIGHT.md)
store lane:  develop  --(release PR, founder approves FT-44, Mon 26 Oct)-->  main  --(coordinator cuts)-->  release/1.0
release/1.0  --(tag ios-v1.0.0-rc.<n>)-->  release-ios.yml: checks, EAS production build, TestFlight internal on the production record
release candidate  --(FT-39, DEVICE_TEST_PLAN, section 6 checklist)-->  submit that same build, manual release
approved and released  -->  tag ios-v1.0.0 on the RC's commit  -->  GitHub Release from docs/release/1.0.0.md
alongside, never inside the binary:  migrations (APPLY.md order, founder)  |  packs, config, content (scripts/packs, founder's key)
```

Dates for v1.0 (ROADMAP 2.1): C0 Wed 14 Oct, Beta App Review submitted Thu 15 Oct, C1 Mon 19 Oct, feature freeze Mon 26 Oct, C1 exit and counsel sign-off Thu 29 Oct, release candidate `ios-v1.0.0-rc.<n>` from `release/1.0` by Fri 30 Oct, submit Mon 2 Nov (Fri 6 Nov latest), release planned Mon 16 Nov with 9 to 20 Nov as the buffer.

Who does what:

| Step | Who | Never |
|---|---|---|
| Code, tests, docs on a wave branch | agents | agents never commit, push, build, submit, publish or apply (COORDINATION 6) |
| Merge to `develop`, open the release PR, tag, run builds and submissions | coordinator | no build from an untagged commit for the App Store, or for TestFlight after the alpha (the two alpha builds come from `develop`, `docs/release/TESTFLIGHT.md`) |
| Approve the release PR, the submission, live migrations, pack and config publishing, legal text going public | founder | no secret in a chat, issue, repo or email (FOUNDER_TASKS) |

## 1. Branches, tags and CI gates

### 1.1 Branches (F: COORDINATION 6, CLAUDE.md)
- `main`: always releasable; changes only through a release PR from `develop` (or a hotfix PR, 1.4) that the founder approves.
- `develop`: integration. Each agent wave lands on `auto/<date>-<topic>` first; the coordinator runs every check and merges.
- Human branches: `feat/<area>-<what>`, `fix/<what>`, `chore/<what>`, `docs/<what>`, `exp/<what>`. One concern per pull request.
- `release/<major>.<minor>` (D-089): the coordinator cuts `release/1.0` from `main` at feature freeze (proposed: Tue 3 Nov, 13:00 UTC, which is 5:00 AM PT; D-089 planned Tue 27 Oct; proposed until the founder confirms), right after the release PR. It takes fixes only: merged to `develop` first, labelled `release:1.0`, then cherry-picked by the coordinator. `develop` stays open: 1.0.x fixes land there first and are cherry-picked, and v1.1 work continues. The branch stays for 1.0.x hotfixes.

### 1.2 Tags (F: CLAUDE.md, COORDINATION 6)
- `ios-v<x.y.z>-rc.<n>` on a `release/<major>.<minor>` commit builds a release candidate: `release-ios.yml` checks that the tag, `apps/mobile/version.json` (after #109; until then `apps/mobile/app.config.ts:162`) and the branch agree, runs the tests, then the EAS production build with auto-submit to TestFlight (3.4). Coordinator only: `git tag -a ios-v1.0.0-rc.1 -m "Early Letters 1.0.0 rc.1" && git push origin ios-v1.0.0-rc.1`.
- `ios-v<x.y.z>` is pushed after Apple approves and the founder releases, on the same commit as the released RC. The workflow refuses it without an RC tag on that commit and a release record `docs/release/<x.y.z>.md`, then publishes the GitHub Release from the record.
- Tags never move and are never reused (D-089). The tag's version equals `apps/mobile/version.json` (after #109; until then `apps/mobile/app.config.ts:162`); the build number is not in the tag (2.2).

### 1.3 CI gates (F: `.github/workflows/ci.yml`, `migration-guard.yml`; TDD 07 9.1)

| Gate | When | Must pass | Status today |
|---|---|---|---|
| G0 pull request | every PR to `develop` or `main` | `required` (install, `npm test` with content rules, `npm run test:db`, `npm run test:functions`, typecheck incl. `apps/mobile` `tsc`) and `applied migrations unchanged` | built (F) |
| G1 `main` | merge to `main` | G0 on the merge commit | built (F); branch protection is FT-20 |
| G2 internal TestFlight | any build to C0 | G1, `node apps/mobile/e2e/bin/lint-flows.mjs`, DEVICE_TEST_PLAN TF-04 smoke on the SE 3 | Maestro suite not runnable yet (seams and some testIDs missing, `apps/mobile/e2e/TESTID_REQUESTS.md`); until then G2 is the manual smoke |
| G3 external TestFlight | first C1 build, then every C1 build | G2, the C1 column of DEVICE_TEST_PLAN's ordered checklist, in particular TF-10 (privacy manifest) and TF-11 (no analytics host) once #123 merges; **v1.1:** S1-08b (hijack fix; a Line B row, G-01, parked with sign-in) and the staging deletion run (`docs/ops/README.md` step 7) | manual |
| G4 submission | `ios-v*` tag | G3, every PRD 6 line with evidence on SE 3 and a current iPhone, kill during save 500 times, S1-17 for every listed language, section 6 checklist, no open S0 or S1 | manual |
| G5 after release | phased release days 1 to 7 | crash-free sessions 99.8% and users 99.5% (App Store Connect metrics), no data-loss report; pause on any S0 | manual |

The macOS E2E job is a sketch (`apps/mobile/e2e/ci/ios-e2e.yml.example`), not enabled; the coordinator moves it to `.github/workflows/` when the seams exist.

### 1.4 Hotfix (D-089)
1. Fix merged to `develop` first (upstream first), labelled `release:<major>.<minor>`.
2. Coordinator cherry-picks it onto `release/<major>.<minor>` and bumps PATCH in `apps/mobile/version.json` (after #109; until then `apps/mobile/app.config.ts:162`) there only (never on `develop`).
3. Push the next RC tag (`ios-v1.0.1-rc.1`); same gates; TF-04 smoke; submit that build; ask for an expedited review if it fixes a critical bug (7.3). No OTA in v1.0 (D-091, section 8).
4. After release, tag `ios-v1.0.1` on the RC's commit.

## 2. Versions and build numbers

### 2.1 What each number is
| Number | Where | Who changes it |
|---|---|---|
| Marketing version (`CFBundleShortVersionString`, Android `versionName`) | `apps/mobile/version.json`, read by `app.config.ts` (D-089, BL-436) (after #109; until then `apps/mobile/app.config.ts:162`) | MINOR: a PR on `develop` before the release PR; PATCH: the coordinator on the release branch (1.4) (V: Expo "App version management": set it explicitly for each store release) |
| Build number (`CFBundleVersion`) | EAS servers | EAS, automatically (2.2) |
| Runtime version | not used: no `expo-updates` in v1.0 (D-091, section 8) | n/a |

### 2.2 Remote build numbers (F: `eas.json`)
`cli.appVersionSource` is `remote` and the `production` profile has `autoIncrement: true` (F). EAS stores the iOS build number and bumps it on every production build, which avoids the common rejection for a duplicate build number (V: Expo "App version management", remote version source recommended from EAS CLI 12). Never set `ios.buildNumber` in `app.config.ts`. To see or set it: `npx eas-cli@24.10.0 build:version:get -p ios` and `build:version:set` (A: command names from the EAS CLI reference).

## 3. EAS: project, profiles, variables, image

### 3.1 `eas init` (once; founder, FT-17)
```bash
cd apps/mobile
npx eas-cli@24.10.0 login           # Expo account with two-factor (FT-02)
npx eas-cli@24.10.0 init            # creates or links the EAS project for slug "scribe"
```
`eas init` creates or links a project (V: EAS CLI reference, flags `--id`, `--force`, `--non-interactive`). Our config is dynamic (`app.config.ts`, F), so EAS cannot write the id into it by itself (A: Expo forum "EAS project ID with dynamic configuration"). The founder sends the printed `projectId` to the coordinator, who adds it in `app.config.ts` as `extra.eas.projectId` (and `owner`) in a PR (BL-339, TESTID_REQUESTS B-6). Re-run `npx eas-cli@24.10.0 init --id <projectId>` on any new machine.

### 3.2 Profiles (F: `eas.json` today; requests from TESTID_REQUESTS B-1 to B-3)

| Profile | Bundle id | Distribution | Use | Status |
|---|---|---|---|---|
| `development` | `com.earlyletters.scribe.dev` | internal (ad hoc, registered devices) | dev client on the founder's phones; device spikes with Instruments (S1-17) | exists |
| `preview` | `com.earlyletters.scribe.preview` | store | alpha build 2, servers on against staging (`docs/release/TESTFLIGHT.md`, #145); StoreKit products only after TESTFLIGHT step 2.5 | exists |
| `production` | `com.earlyletters.scribe` | store (default) | release candidates (internal TestFlight on the production record) and the App Store | exists, `autoIncrement: true` |
| `testflight` | `com.earlyletters.scribe.preview` | store | C0 and C1 (preview lane, `docs/release/TESTFLIGHT.md`) | exists on `develop` (PR #100) |
| `e2e` | `.preview` | simulator, `withoutCredentials` | Maestro suite (`EXPO_PUBLIC_E2E=1`) | requested (B-1) |
| `development-simulator` | `.dev` | simulator | Maestro authoring loop | requested (B-2) |

Requested change for every iOS profile (B-3): `"ios": { "image": "sdk-57" }`. Today `sdk-57` is `macos-tahoe-26.5-xcode-26.6`, while `latest` has moved on and Xcode 27 images exist (`macos-tahoe-26.6-xcode-27.0` is `sdk-58`) (V: Expo "Build server infrastructure", opened 13 Oct 2026). Pinning keeps the v1.0 build on the Xcode the app was tested with. Xcode 26 meets Apple's upload minimum (V: Apple "Upcoming requirements": since 28 Apr 2026, apps uploaded must be built with Xcode 26 or later and the iOS 26 SDK).

Requested submit profile (A: values come from the founder after FT-08):
```json
"submit": {
  "production": {
    "ios": { "ascAppId": "<Apple ID number of the app, App Store Connect > App Information>", "appleTeamId": "<Team ID>", "groups": ["Release candidates"] }
  }
}
```
`ascAppId` and `appleTeamId` are documented `submit.production.ios` keys, and `groups` adds the build to TestFlight internal groups (V: Expo "Configure with eas.json"). On the production record that group is `Release candidates` (the founder's phones, for TF-04 and FT-39); C0 runs on the `.preview` record (5.2). Neither id is a secret, but they are written only after the founder confirms them.

### 3.3 Build variables
Public values only (`EXPO_PUBLIC_*`), per environment, set by the founder in EAS (FT-17), never in the repo: `npx eas-cli@24.10.0 env:set --name <NAME> --value <value> --environment production --visibility plaintext` (V: Expo "Environment variables"), and the profile names its environment (`"environment": "production"`). For v1.0 the production build needs only `EXPO_PUBLIC_APP_ENV=production`, `EXPO_PUBLIC_SERVER_FEATURES=off` (both in `eas.json`) and `EXPO_PUBLIC_DOCS_BASE_URL` for signed packs and config (FT-16; `docs/release/TESTFLIGHT.md`). **v1.1:** AUTH_SETUP section 8 plus `EXPO_PUBLIC_EMAIL_OTP_LENGTH=8` (G-05), and `EXPO_PUBLIC_POSTHOG_KEY` and `EXPO_PUBLIC_POSTHOG_HOST` once FT-24 is done. The Supabase **secret** key never goes into EAS.

### 3.4 The build (from an RC tag)
Pushing `ios-v<x.y.z>-rc.<n>` runs `.github/workflows/release-ios.yml` (BL-437): tag, version and branch checks, `npm test`, typecheck, store metadata drift, placeholder scan, a trusted signing key in `packages/api/src/keys.ts` (and a warning if `eas.json` has no `EXPO_PUBLIC_DOCS_BASE_URL`), then, after the founder approves the run in the `app-store` environment, `eas build --platform ios --profile production --non-interactive --freeze-credentials --no-wait --auto-submit`. The build runs on EAS; the upload to TestFlight follows when it finishes. Whether `--auto-submit` still submits after the CLI exits with `--no-wait` is Unverified: on the first RC, watch the build page on expo.dev for the linked submission and record what happened in `docs/release/1.0.0.md`. The checks run `npm test` and typecheck but not `test:db` or `test:functions`: v1.0 runs no server code. It needs the environment and secrets in 3.5, `owner` and `extra.eas.projectId` in `app.config.ts`, production signing credentials in EAS (sign the first production build once from a computer, 4) and `submit.production.ascAppId` (3.2).

By hand only as an exception: if the workflow cannot run and the founder approves it in writing, recorded in `docs/release/<x.y.z>.md` with the reason (REL-R05 in `docs/engineering/11-release-engineering.md`, which lands with PR #112; until then this file is the rule):
```bash
git switch --detach ios-v1.0.0-rc.1
cd apps/mobile
npx eas-cli@24.10.0 build --platform ios --profile production      # store build, build number bumped by EAS
npx eas-cli@24.10.0 submit --platform ios --latest                   # uploads to App Store Connect (TestFlight)
```
`eas submit` uploads the build; it shows in TestFlight after processing (V: Expo "Submit to the Apple App Store", "usually 10-15 minutes"). Record the build id, build number and commit in `docs/release/<x.y.z>.md`.

Build budget (D-092): EAS Free gives 15 iOS builds a month, shared by both lanes, at low priority with one build at a time. Plan about 4 RC builds in the freeze window plus one preview build per RC for C1 (ADR 0022 decision 5), and keep other preview builds that month to about 7. If queue time holds up an RC, move to Starter for that month (D-092).

After the freeze, C1 builds come from `testflight.yml` run on the latest RC tag, so families test the RC's commit in the preview record.

Store text: `apps/mobile/store.config.json` is generated from `packages/content` (`npx tsx scripts/release/store-config.ts`, BL-436). Whoever changes the source regenerates it in the same PR; the drift test in `npm test` fails otherwise. The founder runs `release-ios.yml` by hand from the release branch with `job: metadata`. The job refuses any other ref, refuses a listing that promises sharing while server features are off (BL-440), waits for the founder's approval in the `app-store` environment, adds the review contact and copyright from the secret, and runs `eas metadata:push`. GitHub shows the Run workflow button only for workflows on the default branch, so the job is available once the release PR has merged to `main` (V: GitHub docs, per the 15 Oct review). EAS Metadata cannot upload screenshots: upload them by hand (6.3).

### 3.5 Release secrets and the gate (ADR 0022 decision 8; FT-20)
The repository is public, so GitHub Free includes environments with required reviewers, environment secrets, deployment tag and branch rules, and rulesets (V: GitHub "Deployments and environments" and "About rulesets", per the 15 Oct review; `deploy-db.yml` already uses an environment).

What stands (ADR 0022 decision 8, founder, 15 Oct):
- Environment `app-store`: the founder is the required reviewer; deployment rules allow tag `ios-v*` and branch `release/*` only. The `build` and `metadata` jobs run in it, so each RC build and each metadata push waits for the founder's approval, and a run on any other ref never gets the secrets.
- Rulesets: tag `ios-v*` and branch `release/*`, restricting creations, updates and deletions, with repository admins as the only bypass. The coordinator pushes tags from a founder-credential session; the agent harness's App cannot.
- Limit: every Claude session runs on the founder's GitHub account, which is an admin. The rulesets and the approval stop the harness App and anyone without admin rights. A session on the founder's credentials is held by the written rule (COORDINATION.md) and by the founder seeing each approval request.

Proposed (17 Oct, not decided; ADR 0026 decision 1, Proposed; SR-3 and SR-11 in `docs/security/SECRETS_REVIEW.md`, on #206). It takes effect when the founder accepts ADR 0026 decision 1; until then the 15 Oct gate above stands:
- Environment `app-store`: the approver account (a second account only the founder holds) is the only required reviewer, with prevent self-review on and admin bypass off; the same deployment rules. Create it with `scripts/release/github-settings.ts` (on #236; FT-20) before `release-ios.yml` merges, because a run that names a missing environment creates it unprotected (SR-11).
- Rulesets, for immutability only (SR-3): `ios-v*` and `db-v*` tags cannot be moved or deleted, and `release/*` cannot be force-pushed or deleted; no bypass list. They do not decide who may create a tag, because every session uses the same account; the approver's click is the control.
- Limit: the founder's account still owns the repository and can change these settings back; `github-settings.ts --verify` (on #236) reads them back, and the durable fix is a founder decision after the alpha (AF-27 in `docs/release/AUTOMATION.md`).

| Name (environment secret of `app-store`) | What | Used by |
|---|---|---|
| `EXPO_TOKEN` | Expo robot token used only for the store lane (FT-17); a robot token needs `owner` in app config | RC build, metadata push |
| `ASC_REVIEW_CONTACT_JSON` | `{"firstName","lastName","email","phone","copyright"}`. `phone` is international format with a leading `+`. `copyright` becomes `apple.copyright`, for example "2026" and the publisher's legal name, which is never in code (D-004). Optional `notes` overrides `storeListing.reviewNotes`; `demoUsername`, `demoPassword` and `demoRequired` only if a demo account exists (v1.1) | metadata push |

A malformed secret fails with a fixed message and is never echoed to the public log. The App Store Connect API key and signing credentials stay in EAS credentials (4), never in GitHub.

## 4. Signing with an individual developer account

- **Account:** the founder's individual Apple Developer Program membership (D-004, D-064). Only the Account Holder accepts agreements, sets up Paid Apps, tax and bank (APP_STORE_CONNECT_SUBSCRIPTIONS step 1); the seller name on the App Store is the founder's legal name (D-004).
- **Let EAS manage the credentials.** On the first `eas build`, sign in with the Apple Account when asked; EAS creates and stores the distribution certificate and one provisioning profile per bundle id (V: Expo "App credentials": the three iOS credentials are the distribution certificate, provisioning profiles and push notification keys; profiles expire after 12 months, which does not affect apps already on the store; a new one is made on the next `eas build`). Inspect with `npx eas-cli@24.10.0 credentials -p ios`.
- **Capabilities:** EAS enables the entitlements in the config on the App ID during the build (Sign in with Apple, Associated Domains; DEVICE_TEST_PLAN S1-06 turns that Assumption into V). Check the App ID in Certificates, Identifiers & Profiles after the first build (AUTH_SETUP 2.1).
- **No push key.** The app schedules only local notifications (reminders and plan reminders) and never asks for a push token (no `getDevicePushTokenAsync` or `getExpoPushTokenAsync` in `apps/mobile`). expo-notifications' own plugin, which prebuild applies because the package is installed, writes `aps-environment`; `app.config.ts` removes it, so no remote push entitlement is configured (F: `expo prebuild` and `expo config --type introspect` show no `aps-environment`; `apps/mobile/test/config.test.ts` checks the introspected entitlements of every profile and the preflight checks the generated ones; A: confirm no `aps-environment` in the built entitlements, TF-10 step (a)). `eas.json` sets `cli.promptToConfigurePushNotifications: false`, so an interactive `eas build` does not offer to create a push key (eas-cli 24.10.0, `IosCredentialsProvider.js`); if it ever asks "Would you like to set up Push Notifications for your project?", answer No.
- **Internal builds** (`development`) are ad hoc: each iPhone is registered first (`npx eas-cli@24.10.0 device:create`), then a new build includes it (DEVICE_TEST_PLAN P-02).
- **App Store Connect API key for `eas submit`:** made through `eas credentials` (App Store Connect: Manage your API Key) so later submissions are non-interactive (V: Expo "Submit to the Apple App Store"); creating team keys is an Account Holder or Admin action (A). It never leaves EAS and the founder's password manager.
- **The Sign in with Apple `.p8` key** used by the purge worker (and, from v1.1, by the `apple-token` Edge Function parked on Line B, G-03) is a different key with a different job (AUTH_SETUP 2.4, SECURITY.md 5; Line B's AUTH_SETUP 2.7 describes `apple-token`). It is not a signing credential.
- **If the account later moves to an organisation** (D-004 triggers), Apple's app transfer applies; signing assets are re-created in the new team (DECISIONS D-004 point 5).

## 5. TestFlight

C0 and C1 run on the preview lane (`testflight` profile, `.preview` App Store Connect record; `docs/release/TESTFLIGHT.md`, PR #100), so test builds never spend the permanent production id. Release candidates from `release/1.0` go to the production record's internal group for TF-04 and FT-39 before submission (D-089). The rest of this section applies to both records.

### 5.1 Facts that shape the plan (V: Apple App Store Connect Help and Expo "TestFlight", opened 13 Oct 2026)
| | Internal (C0) | External (C1) |
|---|---|---|
| Who | up to 100 App Store Connect users on the team | up to 10,000 people by email or public link |
| Review | none; available after processing | Beta App Review for the first build of each version; later builds may not need a full review |
| Required test information | none | beta app description, feedback email (and contact information) |
| Build life | 90 days from upload | 90 days |
| Other | an internal group must exist before an external one; up to six builds to TestFlight App Review in 24 hours | testers need the TestFlight app |
Purchases in TestFlight run in the sandbox; subscriptions renew every day, up to six times in a week (V: "Subscription renewal rate in TestFlight").

### 5.2 C0: internal testing (from Wed 14 Oct)
1. App Store Connect > Users and Access: add each founding-family adult as a user with the least role that allows TestFlight (A: "Customer Support" or "Developer"; check what the screen offers). An internal tester must be an App Store Connect user (V). If that is too much access for someone, put them in the C1 external group instead.
2. TestFlight > Internal Testing > group `C0 family`; turn on automatic distribution (A: optional).
3. Each build: `eas submit` (3.4), wait for processing, run TF-04 (15-minute smoke) on the SE 3 before telling the family.
4. Tester note (first build, by email outside TestFlight): what to try, that letters stay on their phone and in their own iPhone backup, "please don't send screenshots of letters through TestFlight feedback; use Settings, Help instead", and that this build can make mistakes (D-060 in-app note). TDD 07 OQ-4 is still open: TestFlight screenshot feedback can carry letter text.

### 5.3 C1: external testing through Beta App Review (submit Thu 15 Oct, start Mon 19 Oct)
1. Before submitting: the legal pages are live at the URLs the app links to (FT-31) and TF-10 shows a complete privacy manifest. **v1.1:** the AASA file serves `/i` with the fragment pattern (AUTH_SETUP 5.2), and the sign-in security fixes G-01 to G-04 are in the build with S1-08b passed.
2. TestFlight > External Testing > new group `C1 families` (an internal group must already exist, V).
3. Test Information: beta app description (a family memory journal you fill by talking; no health service; matches D-004 positioning), feedback email `hello@earlyletters.com`, contact details, and privacy policy URL (A: asked for external testing). No review sign-in for v1.0: there is no account (6.4).
4. Add the build to the group and submit for review. At most six builds per 24 hours (V). The first build of the version gets a full review (V); plan for about a day (A; App Review generally reviews 90% of submissions within 48 hours, V: "App Review" page).
5. When approved, invite the 15 to 25 families by email (FT-26, FT-32), never a public link before submission (D-045).
6. Never call the build "beta" in App Store text; TestFlight's own description is fine (D-060).

### 5.4 Cohort exits
As DEVICE_TEST_PLAN TF-09: C0 to C1 needs no open S0, crash-free sessions 99.5% or more, S1-13 passed, TF-04 green; C1 to submission needs no open S0 or S1, crash-free sessions 99.8% or more, no fidelity complaint traced to a machine edit, (**v1.1:** one co-parent pair through the invite unaided), S1-17 accepted for every listed language, size under 40 MB, section 6 complete.

## 6. Submission checklist (FT-43, FT-45)

Tick every line in the release PR's description with the evidence file it rests on. Anything unticked stops submission.

### 6.1 Privacy: labels, manifest, policy
- [ ] App Privacy answers entered from `docs/legal/app-store-privacy-labels.md` 1.2 with the Q-005 answer applied in 1.2, 1.4 and 3.3 together (legal owner and counsel, FT-33).
- [ ] The section 5 consistency checklist in that file is complete for this exact build (no new SDK, no audio upload, no photos, no crash SDK, `child-input` flag off).
- [ ] TF-10 passed on this build: `PrivacyInfo.xcprivacy` in the app matches labels 3.3 (declared in `apps/mobile/app.config.ts` on `develop`; Line B's `privacy-manifest.ts` is G-23 in the port map, #117), every listed SDK carries its own, no ITMS-91053 email after upload. Apple rejects uploads that use required-reason APIs without declared reasons (labels doc 3.1, V there).
- [ ] Privacy Policy URL in App Store Connect is `https://earlyletters.com/privacy` and serves the version the app links to; the Consumer Health Data Privacy Policy link is in the description (G-21).

### 6.2 Age rating: override to 18+
- [ ] App Information > Age Ratings > Set Up Age Ratings: answer the questionnaire truthfully (no mature content), then in **Age Categories and Override** choose **Override to Higher Age Rating** and select **18+**, Save (V: Apple "Set an app age rating"; ratings are 4+, 9+, 13+, 16+, 18+). Required here because our Terms require adults: "If your app has a EULA with minimum age requirements exceeding Apple's calculated rating, you must override" (V, same page). The override applies in every region; content descriptions still reflect the questionnaire (V).
- [ ] Not in the Kids Category; category **Lifestyle**, never Health or Medical (D-004 point 4, PRD 6.7).

### 6.3 Listing, territory, screenshots
- [ ] Listing text from `docs/store/app-store.md`: no "beta" (D-060, rules test), only the languages that passed FT-34, no printed-book claim (K-32), no other platform named (2.3.10).
- [ ] Availability: United States only (LEGAL-REQ-058), for the app and both subscriptions.
- [ ] Screenshots from a release build with the fictional family only (FT-38, BL-340): 1 to 10 iPhone screenshots; supply the 6.9-inch size (1260 x 2736, 1290 x 2796 or 1320 x 2868 portrait) or the 6.5-inch size (1284 x 2778); iPad screenshots are not required because the app does not run natively on iPad (`supportsTablet: false`, F) (V: Apple "Screenshot specifications").
- [ ] Each subscription has its review screenshot and is attached to this version (the first subscription ships with an app version, APP_STORE_CONNECT_SUBSCRIPTIONS step 8).

### 6.4 App Review information
- [ ] **Contact information** (name, email, phone in international format) and **Notes** (at most 4,000 bytes) (V: Apple "Platform version information"). Both are pushed by the metadata job (3.4): contact from `ASC_REVIEW_CONTACT_JSON`, notes from `storeListing.reviewNotes` in `packages/content` (BL-341 finishes them).
- [ ] **No demo account for v1.0.** v1.0 is on this phone only: no sign-in, account or sync (PR #54), so "Sign-in required" is No. The notes say so. If sign-in ships (v1.1), the demo-account plan returns: a non-expiring account on production with the fictional family "Asha" only, kept between versions.
- [ ] Notes cover: a family memory journal parents fill by talking or typing; everything stays on the phone; answer Yes to the 18+ question; how to reach Plus (BL-341); speech models and language packs download as data checked against a signed manifest and contain no code (guideline 2.5.2, V); a birthday or due date files letters by month and nothing is a health service (D-004 5.1.1(ix) positioning). Describe every feature specifically; generic notes are rejected under 2.3.1(a) (V).

### 6.5 Export compliance (encryption)
- [ ] `ITSAppUsesNonExemptEncryption` is `false` in the build's Info.plist (done on `develop` by PR #100 as `ios.config.usesNonExemptEncryption: false`). Set it to NO only if the app, including its libraries, uses no encryption or only exempt encryption; without the key App Store Connect asks the export compliance questions on every upload (V: Apple `ITSAppUsesNonExemptEncryption`). Encryption built into the operating system, such as HTTPS through `URLSession`, is typically exempt; proprietary encryption is not (V: Apple "Complying with Encryption Export Regulations").
- [ ] Founder confirms the facts before the key is set (F, checked 13 Oct): the app uses HTTPS (system networking), the Keychain and iOS Data Protection, SHA-256 hashing (CryptoKit in `scribe-audio`, `expo-crypto`) and Ed25519 signature **verification** of packs and config (`@noble/ed25519` in `packages/api`). No app-level encryption of user content ships in v1.0 (the AES-GCM wrapping of Apple tokens runs in an Edge Function on the server, not in the app). Authentication, hashing and signature checks are generally exempt (A: confirm against Apple's "Determine and upload app encryption documentation" page and with counsel if unsure). If any of this changes (for example encrypted backup, ADR 0006), revisit.
- [ ] Apple notes that apps using exempt encryption may still owe a year-end self-classification report to the US government (V: same Apple page, links the BIS guidance). Founder asks counsel whether it applies (A: US-only distribution may change the answer); add to FT-47's counsel batch.

### 6.6 Content rights
- [ ] App Information > Content Rights: answer whether the app "contain[s], show[s], or access[es] third-party content" (V: Apple "App information"). Our answer (A, founder confirms): the app shows the user's own content; bundled fonts (Literata, Mukta, Tiro Devanagari Hindi, OFL) and the open speech models (licences in ADR 0015, listed in Settings, Licences) are used under their licences. If the screen asks yes or no, answer **No** unless counsel reads "third-party content" to include the model weights, in which case **Yes** with the licences as the basis.

### 6.7 Release option
- [ ] Version Release: **Manually release this version** (status becomes Pending Developer Release after approval, V: Apple "Platform version information"). For 1.0 phased release does not exist (section 7).

### 6.8 The binary
- [ ] The submitted build is the release candidate from `ios-v1.0.0-rc.<n>` on `release/1.0` that passed FT-39, built with the `production` profile and the pinned image (3.2); its build number is in `docs/release/1.0.0.md` (D-089).
- [ ] App size: largest variant download under 40 MB from App Store Connect's numbers or the App Thinning Size Report (`npx tsx scripts/size/measure.ts --thinning-report ...`, `docs/ops/APP_SIZE.md`; DEVICE_TEST_PLAN TF-01).
- [ ] The production bundle has no e2e seam strings (`grep -c e2eSeed main.jsbundle` is 0, TESTID_REQUESTS B-8) and no `example.com`.
- [ ] **v1.1 only** (v1.0 runs no server): production Supabase has every migration through the newest the build needs (section 10), the beta or 1.0.0 policy versions, the pepper set, functions deployed (`purge-worker`, `analytics-forget`, `config`, `content`; plus `apple-token` once G-03 is ported from Line B, it is not on `develop`).
- [ ] The public signing key in `packages/api/src/keys.ts` is the founder's real key (BL-335), and the config, manifest and content published with it are live (section 9).

## 7. Release and phased release

### 7.1 Version 1.0.0
Phased release is available only for version updates, not for the first release (V: Apple "Release a version update in phases"). So 1.0.0 goes to everyone at once, by hand, on the planned day (Mon 16 Nov), after the launch-week switches (FT-49). Watch App Store Connect crashes and the support inbox for the first 48 hours (G5).

### 7.2 Updates (1.0.1 and later): phased by default
- Choose **Phased Release for Automatic Updates** on the version page before submitting (V: "Platform version information"). Apple releases to 1%, 2%, 5%, 10%, 20%, 50% and 100% of people with automatic updates on, over 7 days; anyone can still download it by hand at any time (V: "Release a version update in phases").
- Pause on any S0 or a crash-free rate under the G5 numbers. Pauses can total 30 days, any number of times (V). Release to all users early only when G5 holds for 3 days (A: our rule).
- Phased release does not limit who gets server-side changes (config, packs, migrations); stage those separately (sections 9 and 10).

### 7.3 Expedited review
For a critical bug fix, request an expedited review (V: Apple "App Review": "fixing a critical bug in your app"). Use it for S0 only.

## 8. Over-the-air (OTA) policy

No OTA in v1.0 (D-091, founder, 13 Oct 2026).

- **v1.0 ships with no OTA JavaScript updates.** `expo-updates` is not a dependency (F: `apps/mobile/package.json`), and no `runtimeVersion` is configured. `eas.json` on `develop` sets a `channel` on every profile; without `expo-updates` a channel does nothing. Every code change is a new binary through this train. Reasons: TDD 07 9.1 requires the same gates for an OTA as for an external build; App Review guideline 2.5.2 forbids downloading code that changes features (V); and the founder's quality bar favours one reviewed binary per change.
- **What does change without a release** (decision 16, D-066, ADR 0016): signed, versioned data only: remote config and kill switches, pack manifests and language packs, prompts, tips and story cards. Never anything that changes data collection, the paywall, the 18+ gate or consent (ADR 0016 5.3). These go through section 9.
- **If OTA is adopted later** (a decision entry first): add `expo-updates` with a `runtimeVersion` policy so an update only reaches binaries with matching native code (V: Expo "Runtime versions"); publish per channel (`production`) with a rollout percentage, starting at 10% (V: Expo "Rollouts": `eas update --rollout-percentage`, revert with `eas update:revert-update-rollout`); run G3 on the exact update bundle; never change consent, gate, paywall or data collection by OTA; sign updates (Expo code signing) (A: not configured).

## 9. Packs, remote config and content publishing

D-115: the founder creates and holds the signing keys and publishes on one computer with `scripts/packs/publish.ts`: `release` (English only by default), then `upload` and `verify`, with the private key outside the repo. No CI job reads the signing or upload secrets, and the coordinator never holds a key (COORDINATION 6, ADR 0016 7). The runbook is `docs/ops/PACKS_HOSTING.md`; steps 2 and 3 below are `publish.ts`'s development-only path, which overwrites without `upload`'s checks. The secret key lives only in the founder's password manager.

1. Once: `node scripts/packs/keygen.mjs`, then `node scripts/packs/keygen.mjs --backup`; both public key lines go into `packages/api/src/keys.ts` (BL-335) **before** the first TestFlight build, or no phone trusts anything published (FT-16).
2. Each publish, on the founder's machine:
   ```bash
   # the key file of PACKS_HOSTING step 1, outside every checkout; never `export` the key (it stays in ~/.zsh_history)
   npx tsx scripts/packs/publish.ts packs   --key-file ~/.config/early-letters/signing.env --base-url https://packs.<Q-001 host> --min-app 1.0.0
   npx tsx scripts/packs/publish.ts config  --key-file ~/.config/early-letters/signing.env [--kill <switch>] [--unkill <switch>]
   npx tsx scripts/packs/publish.ts content --key-file ~/.config/early-letters/signing.env
   ```
   The script validates every text pack, writes `dist/packs/`, signs the manifest, config and content, checks each signature the way a phone does, bumps each document's version by one and rewrites `supabase/functions/{config,content}/published.ts`. It uploads and deploys nothing; it prints the commands (F: `scripts/packs/publish.ts`).
3. Run the printed upload commands (`wrangler r2 object put` up to 300 MB, `rclone copyto` above, F) and deploy: `npx supabase functions deploy config --no-verify-jwt --use-api` and the same for `content`.
4. Commit the changed `published.ts` and `scripts/packs/remote-config.json` in a PR the same day: git history is the audit log of what was served (C-NFR-009).
5. Staging first, then production, with one phone checking each (DEVICE_TEST_PLAN S1-16 for packs; a kill switch reaches an open app within about 5 minutes, ADR 0016 6).
6. Kill switches available today (F: `remote-config.json`): `sync`, `invites`, `photos`, `packDownloads`, `serverContent`. `readTogetherFreeSessions` may only be raised (D-009). `forceReauthEpoch` signs everyone out once (G-06; use only for a security incident).

## 10. Database migrations: apply order (v1.1)

Not run for v1.0: the on-device build makes no Supabase call (PR #54). This section is the plan for when server features turn on.


The founder applies live migrations by hand, staging first, in `supabase/APPLY.md` order; each applied file is added to `.github/migrations-applied.txt` in a PR, and an applied file is never edited (F: COORDINATION 6, migration guard). D-041's "migrations only from CI on a tag" is built: `.github/workflows/deploy-db.yml` (PR #36) applies migrations to staging and, on a `db-v*` tag, to production through the `db-production` environment (#236). Follow APPLY.md for anything that workflow does not cover.

| Order | File | APPLY.md | Needed by |
|---|---|---|---|
| 1, 2 | `20260930000000_scribe_core`, `20261001000000_scribe_hardening` | applied | n/a |
| 3, 4 | `20261002010000_entries_select_policy`, `20261002020000_data_governance` | steps 1 to 5; **step 6 pepper before anything deletes** | every build |
| 5 to 7 | `20261003000000_security_and_family`, `20261003010000_children_and_entitlements`, `20261003020000_purge_batching` | steps 8 to 13 (policy versions first) | every build |
| 8 to 11 | `20261004000000_plus_on_device_only`, `20261004100000_sync_engine`, `20261004200000_ops_deletion_worker`, `20261004300000_insights_aggregates` | steps 14 to 16 | every build |
| 12 | `20261005000000_family_cap_language_idempotency` | steps 17 to 19 | **must be live before a fix-wave build talks to the project**: the build sends sync field group `language`, which older servers refuse (mobile-fix, BOARD 21:41) |
| 13 | `20261005100000_db_fix_privacy_limits` (**Line B only**: on `auto/2026-10-05-fixes`, not on `develop`; G-08 to G-13, parked) | Line B's APPLY.md steps 20 to 22 (pepper check first); `develop`'s APPLY.md ends at step 19 | the fix-wave build (`peek_invite` for ask-before-joining, G-02). Needs a new timestamp after PR #32's files and the `approve-migration` label when ported |
| 14 | `20261005200000_insights_differencing` (**Line B only**, G-20, parked) | no APPLY.md section on either line (platform-fix's text is with the coordinator) | insights only; not blocking a build |

Rules for a release:
- Migrations go out **before** the build that needs them, never after; every file so far is additive for older builds (APPLY.md "App compatibility" notes).
- Staging gets the same files a day before production; DEVICE_TEST_PLAN runs against staging.
- A migration that a live build cannot survive needs a new binary first and a written two-step plan; none exists today.
- Production for C0 was due Tue 13 Oct (FT-23); production uses a new pepper and its own secrets.

## 11. Rollback, by layer

| Layer | How to undo | Time | Notes |
|---|---|---|---|
| App Store binary | There is no rollback to an older binary. Pause the phased release (updates only, 7.2), fix forward with a higher version and request an expedited review (7.3). For a release that must stop being downloaded, remove the app from sale in App Store Connect Pricing and Availability (A: menu name) | hours to days | Keep each release small for this reason |
| TestFlight build | Expire the build in TestFlight; testers keep what they installed until it expires (A) | minutes | |
| Behaviour that has a kill switch | `publish.ts config --kill <switch>`, deploy `config` | about 5 minutes to open apps (ADR 0016 6) | Sync off never deletes anything on phones |
| Remote config, content, pack manifest | Phones refuse a lower version (F: G-18 also refuses a different body at the same version), so "rollback" means re-signing the previous content at version + 1 and deploying | minutes | Old pack files stay on R2 at immutable paths, so a manifest can point back at them |
| Database | Fix forward. Each APPLY.md section has a tested rollback for its own file where one is safe; restore from backup only per `docs/ops/runbooks/restore-drill.md`, then `sync_begin_epoch` so phones re-upload | hours | Never edit an applied file |
| Edge Functions | `npx supabase functions deploy <name>` from the previous tag's commit | minutes | |
| Website, AASA, legal pages | Website thread redeploys the previous version on Vercel (A: instant rollback); a broken AASA stops universal links for up to about a day while Apple's CDN refreshes (AUTH_SETUP 5.2) | minutes, plus CDN | Coordinate on the board first (COORDINATION 6) |

## 12. Per-release checklist (copy into the release PR)

```markdown
Release ios-vX.Y.Z (RC tag ios-vX.Y.Z-rc.N, build N), commit <sha> on release/X.Y
- [ ] develop green (G0) and merged; release PR approved by the founder; release branch cut; RC tag pushed; record docs/release/X.Y.Z.md current
- [ ] v1.1 and later: migrations needed by this build are live on staging and production (RELEASE 10); migrations-applied.txt updated
- [ ] Packs, config, content published and committed if changed (RELEASE 9)
- [ ] EAS production build from the RC tag (release-ios.yml), approved in the app-store environment, image sdk-57; build number recorded
- [ ] Store text pushed (metadata job) after BL-440; screenshots uploaded
- [ ] Size: largest download under 40 MB (APP_SIZE)
- [ ] TF-04 smoke on SE 3; TF-10 privacy manifest; TF-03 update over the previous build
- [ ] DEVICE_TEST_PLAN items for this milestone, including S2-17 (plan reminders, D-094) and TF-11 (no analytics host, D-095) once #123 merges: evidence file <path>
- [ ] Submission checklist RELEASE 6.1 to 6.8 (first version and any version that changes data collection, age rating, screenshots or subscriptions)
- [ ] Release option: manual (1.0) or phased (updates)
- [ ] After release: tag ios-vX.Y.Z on the RC's commit; G5 watch for 7 days; DECISIONS go/no-go note (coordinator)
```

## Facts and assumptions

| Statement | Status |
|---|---|
| Age rating values 4+, 9+, 13+, 16+, 18+; Override to Higher Age Rating; a EULA with a higher minimum age requires the override | V, Apple "Set an app age rating", opened 13 Oct 2026 |
| Phased release: 7 days, 1/2/5/10/20/50/100%, pauses up to 30 days, updates only, manual downloads always possible | V, Apple "Release a version update in phases", 13 Oct 2026 |
| `ITSAppUsesNonExemptEncryption` NO skips the questionnaire; OS-provided HTTPS is typically exempt; self-classification report may apply | V, Apple developer documentation, 13 Oct 2026 |
| Screenshot sizes and counts; iPad screenshots only if the app runs on iPad | V, Apple "Screenshot specifications", 13 Oct 2026 |
| App Review information fields, demo account must not expire, notes 4,000 bytes; Manual / Automatic / Automatic no earlier than | V, Apple "Platform version information", 13 Oct 2026 |
| TestFlight limits (100 internal, 10,000 external, 90 days, Beta App Review for the first build, internal group first, six builds per 24 h) | V, Apple App Store Connect Help and Expo "TestFlight", 13 Oct 2026 |
| TestFlight subscriptions renew daily up to 6 times; Sandbox Apple Account renewal rates 3/5/30/60 minutes | V, Apple, 13 Oct 2026 |
| App Review reviews 90% of submissions within 48 hours; expedited review for critical bug fixes | V, Apple "App Review" page, 13 Oct 2026 |
| Guideline 2.5.2 and 2.3.1(a) wording | V, App Review Guidelines, 13 Oct 2026 |
| Uploads need Xcode 26 and the iOS 26 SDK since 28 Apr 2026 | V, Apple "Upcoming requirements", 13 Oct 2026 |
| EAS image aliases `sdk-57` = `macos-tahoe-26.5-xcode-26.6`; Xcode 27 images exist | V, Expo "Build server infrastructure", 13 Oct 2026 |
| `appVersionSource: remote` with `autoIncrement` | V, Expo "App version management" |
| `eas init` flags; `eas env:set ... --visibility plaintext`; submit keys `ascAppId`, `appleTeamId`, `groups` | V, Expo EAS CLI reference, "Environment variables", "Configure with eas.json" |
| EAS-managed iOS credentials; provisioning profiles expire after 12 months without affecting live apps | V, Expo "App credentials" |
| EAS Update rollouts and runtime versions | V, Expo docs (only relevant if OTA is adopted) |
| Dynamic config needs `extra.eas.projectId` added by hand | A (Expo forum) |
| Internal testers' minimum App Store Connect role | A |
| App Review cannot receive an email code; notes plus a watched inbox is acceptable | A |
| Content Rights answer for open model weights and OFL fonts | A, founder and counsel |
| Remove from sale menu path; Vercel instant rollback; TestFlight expiry effect on installed builds | A |
| `release` and `-rc.<n>` tag naming | proposal (coordinator decides) |

## Sources (opened 13 Oct 2026)

- Apple, Set an app age rating: https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating
- Apple, Release a version update in phases: https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases
- Apple, ITSAppUsesNonExemptEncryption: https://developer.apple.com/documentation/bundleresources/information-property-list/itsappusesnonexemptencryption
- Apple, Complying with Encryption Export Regulations: https://developer.apple.com/documentation/security/complying-with-encryption-export-regulations
- Apple, Overview of export compliance: https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance
- Apple, Screenshot specifications: https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications
- Apple, Platform version information: https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information
- Apple, App information (content rights, age rating, category): https://developer.apple.com/help/app-store-connect/reference/app-information/app-information
- Apple, TestFlight overview: https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview
- Apple, Invite external testers: https://developer.apple.com/help/app-store-connect/test-a-beta-version/invite-external-testers
- Apple, Subscription renewal rate in TestFlight: https://developer.apple.com/help/app-store-connect/test-a-beta-version/subscription-renewal-rate-in-testflight
- Apple, Test in-app purchases: https://developer.apple.com/help/app-store-connect/test-in-app-purchases-main/test-in-app-purchases
- Apple, App Review: https://developer.apple.com/distribute/app-review/
- Apple, App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple, Upcoming requirements: https://developer.apple.com/news/upcoming-requirements/
- Expo, eas.json reference: https://docs.expo.dev/eas/json/
- Expo, Build server infrastructure: https://docs.expo.dev/build-reference/infrastructure/
- Expo, App version management: https://docs.expo.dev/build-reference/app-versions/
- Expo, Submit to the Apple App Store: https://docs.expo.dev/submit/ios/ and TestFlight: https://docs.expo.dev/submit/testflight/
- Expo, Environment variables: https://docs.expo.dev/eas/environment-variables/
- Expo, App credentials: https://docs.expo.dev/app-signing/app-credentials/
- Expo, EAS CLI reference (`eas init`, `eas update:rollback`): https://docs.expo.dev/eas/cli/
- Expo, Runtime versions and Rollouts: https://docs.expo.dev/eas-update/runtime-versions/ , https://docs.expo.dev/eas-update/rollouts/
- Expo forum, EAS project ID with dynamic configuration: https://forums.expo.dev/t/eas-project-id-with-dynamic-configuration/66158
