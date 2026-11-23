# Build gate for the TestFlight alpha build, 8 Nov 2026

Owner: ops. Read-only check of `origin/develop` at `29dcd7d8d46121abeb458737934a576d0350e108` (#574), made on 8 Nov 2026 (UTC). It adds the live state that `docs/release/TESTFLIGHT.md` cannot hold. That page's section "Where build 1 stands (30 Oct 2026)" is out of date: it lists the signing keys, the published manifest, the project id and `ascAppId` as open, and all four are now in the repo (below). Nothing here built, signed, uploaded or dispatched anything.

## Verdict

Configuration is ready: no FAIL from the doctor or from `preflight:testflight`. The first dispatch of `testflight.yml` has never happened, so every step after "Preflight" in the job is untested. The things that can still stop the build are on Expo, Apple and GitHub, where no agent can look. Treat the first run as a trial and expect to read its log.

## Commands run on `origin/develop`

`npx tsx scripts/release/doctor.ts` (static only, no live variables set), exit 0: 5 pass, 1 warn, 2 unverified, 1 not needed, 0 fail.

- `WARN [repo]` eas.json profile "production" sets `"channel": "production"` but expo-updates is not a dependency. Not used by the alpha profiles (`eas.json:54-57`), so it does not matter tonight.
- `UNVERIFIED [expo]` EXPO_TOKEN is not set, so the Expo login was not checked.
- `UNVERIFIED [apple]` ASC_API_KEY_ID, ASC_API_ISSUER_ID, ASC_API_KEY_P8_PATH are not set, so the App Store Connect key was not checked.
- PASS: `extra.eas.projectId`, Expo owner, `submit.testflight` and `submit.preview` `ascAppId` (`eas.json:84-96`), 2 signing keys in `packages/api/src/keys.ts`.

`npm run preflight:testflight -w @scribe/mobile`, exit 0: 58 pass, 0 fail, 2 warn, 3 unverified, 0 founder steps missing, 4 to check by hand.

- `WARN` Apple's processing email after upload is the final check of the required-reason declarations (ITMS-91053, go/no-go B1-10).
- `WARN` expo-file-system 57.0.7 ships `ExpoFileSystem.framework` with no privacy manifest. Act only if the upload email names it.
- `UNVERIFIED` the EAS "preview" environment holds no `EXPO_PUBLIC_E2E` (a run with it would be refused by `app.config.ts`).
- `UNVERIFIED` the EAS "preview" environment holds no `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` or `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
- `UNVERIFIED` a signed pack manifest is in the repo; the script does not go online.
- `CHECK` Steps 1, 2, 4 and 5 (Apple membership, the App Store Connect record and API key in EAS, the R2 host, this run). Step 3 prints DONE.

The workflow runs the preflight as `--profile "$PROFILE"`; this run used the default (`testflight`), the same profile for build 1.

## Live checks over REST

| Check | Result | How |
|---|---|---|
| Default branch | `develop` | `GET /repos/.../` |
| Workflow registered | id 402268598, state active, `.github/workflows/testflight.yml` | `GET /actions/workflows` |
| Runs of `testflight.yml` | 14 in total, all `pull_request`, all `completed/skipped`. Zero `workflow_dispatch` runs. The latest is run 41295408934 (1 Nov, PR "Release: develop into main") | `GET /actions/workflows/402268598/runs` |
| Pack host manifest | `https://packs.earlyletters.app/functions/v1/config/v1/packs` returns HTTP 200, `application/json`, 1448 bytes, last-modified 1 Nov 2026 07:35 UTC | curl |
| Manifest content | `keyId` `el-2026-11`, `version` 1, 3 packs (VAD, whisper small q5_1, whisper large v3 turbo q5_0). It names the same key id and packs as `PACK_MANIFEST` in `supabase/functions/config/published.ts:9` | curl, read |
| `testflight` environment: reviewer, branch rule | NOT VERIFIED. `GET /environments/testflight` returned 403 from the agent proxy ("Access to this GitHub API path is not permitted"). The spec in the repo says branch `develop` only and a reviewer (`scripts/release/github-settings.ts`, `{ name: 'testflight', reviewer: true, refs: [develop] }`). That is a spec, not the live state | blocked |
| Secret `EXPO_TOKEN` exists on the environment | NOT VERIFIED. The environment secrets and the repository secrets endpoints were both refused by the proxy. A value was never read or requested | blocked |
| Build number state | NOT VERIFIABLE from here. `eas.json:4` sets `appVersionSource` remote and `autoIncrement` true on the profile, so EAS holds the counter. The preflight says the first build is 1 unless it was set. `docs/release/TESTFLIGHT.md:20` says no build has been made; nothing seen contradicts that, but nothing seen proves it | Expo unreachable |

## Why testflight.yml has never run on dispatch (RB-15)

Facts: the 14 runs are pull_request runs that the job's `if` skips (`testflight.yml:75`, `if: github.ref == 'refs/heads/develop' || startsWith(github.ref, 'refs/tags/ios-v')`). Their only purpose is to register the workflow with the Actions API (`testflight.yml:13-14`). No one has dispatched it, so nothing so far has exercised the environment gate, `npm ci`, the test run, the seam guard, `EXPO_TOKEN`, EAS credentials or the submit.

What I can say about the reason: the workflow's own header says "NOTHING here has been run" (`testflight.yml:9`) and `TESTFLIGHT.md:56-57` records that a dispatch is "untested" and that the Run workflow button was "unverified". The prerequisites that kept it parked (project id, `ascAppId`, signing keys, published manifest) are now in the repo. Whether the environment, `EXPO_TOKEN`, the EAS iOS credentials and the App Store Connect API key in EAS are in place I cannot see; those were the founder's steps and are the likeliest remaining blockers. This is inference, not an observed failure.

What it means: the first dispatch is the first real test of everything below the Preflight step. Do not assume a green PR check says anything about it.

## What the founder does

1. Merge-complete first. A dispatch builds the tip of `develop` at dispatch time. Dispatch only after the last approved PR has merged and CI on that merge commit is green (`testflight.yml:75`, the run is pinned to the ref's sha at dispatch).
2. Dispatch: `gh workflow run testflight.yml --ref develop -f profile=testflight -f submit=true` (or Actions, testflight, Run workflow, branch `develop`). `TESTFLIGHT.md:57` says to prefer the command, since the button is unverified. Inputs: `testflight.yml:43-52`.
3. Approve the deployment for environment `testflight` when the run shows "Waiting" (`testflight.yml:82`, `environment: testflight`). With no reviewer configured it would instead start at once; with a missing environment GitHub creates it unprotected (`testflight.yml:27-28`). If no approval prompt appears, the reviewer rule is not set; stop and check Settings, Environments.
4. Watch the log. Stop after "Preflight" if anything looks wrong; the build step is the point of no return (it consumes a build number and EAS minutes).
5. In App Store Connect after the upload: wait for processing, read Apple's email for ITMS-91053 (B1-10), then add the build to the "Family" internal group only (`TESTFLIGHT.md:65,147-148`). Never a group with automatic distribution on; both builds share one record.
6. Record the build number and the run URL in the release notes so the next gate can read it.

## What can fail, in job order

| Step | Failure | Line relied on |
|---|---|---|
| Environment gate | Run waits forever if nobody approves; refused if the ref is not `develop` (a tag run is refused by the deployment refs) | `testflight.yml:75-82` |
| `npm ci` | Lockfile or registry trouble | `testflight.yml:92` |
| Typecheck, `npm test` | Any red test blocks the build, including tests from tonight's merges; there is no skip flag | `testflight.yml:95-98` |
| Preflight | Exit 1 on any FAIL. Clean today; a merge that touches `eas.json`, `app.config.ts`, `keys.ts` or `.env*` can change that | `testflight.yml:101-104` |
| Seam guard (B-8) | Fails if the exported bundle carries an e2e seam | `testflight.yml:111-114` |
| Build on EAS, token | `EXPO_TOKEN is not set on the testflight environment`, exit 1 | `testflight.yml:125` |
| Build on EAS, credentials | `--non-interactive` fails if the distribution certificate and profile for `com.earlyletters.scribe.preview` are not in EAS and EAS cannot create them from the API key. The docs mark creation in non-interactive mode as unverified | `testflight.yml:127`, `TESTFLIGHT.md:58` |
| Build on EAS, environment | `EXPO_PUBLIC_E2E` in the EAS `preview` environment makes `app.config.ts` refuse the build | `TESTFLIGHT.md:114` |
| Build on EAS, native | Compile and signing are not proven by any preflight; only EAS can show them | preflight output |
| Submit (`--auto-submit`) | Needs the App Store Connect API key in EAS (role App Manager) and `ascAppId` 6829163677, which is present. A missing key makes the submit fail after a good build | `testflight.yml:128`, `eas.json:84-96`, `TESTFLIGHT.md:36,38` |
| 75 minute limit | EAS queue plus `--wait` can run past it; the job stops, the EAS build may still finish | `testflight.yml:77` |
| Concurrency | One run at a time in group `testflight`, no cancel; a second dispatch queues | `testflight.yml:59-61` |
| After upload | Apple processing or an ITMS email; nothing in the repo can predict it | `TESTFLIGHT.md:194` |

## Not checked

- The environment's reviewer, branch rule and secret names (proxy 403).
- Anything on expo.dev (credentials, API key, `preview` environment variables, build counter) and App Store Connect (record, testers, groups). No agent can reach them (`TESTFLIGHT.md:20`).
- The 40 MB download budget on a real binary (B1-12); the speech model is a downloaded pack, not in the binary.
- Anything on a real device. Green checks are not proof the build works on a phone.
- The `doctor --live` mode, which needs `EXPO_TOKEN` and the `ASC_*` variables.
