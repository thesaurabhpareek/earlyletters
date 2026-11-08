# Pipeline test for build 9, Sun 8 Nov 2026

Owner: ops. Status: **At risk, one open question, no known blocker in the repository.** Everything the repository controls is green on `develop` at `f18864a2`. Three things that decide whether the run goes through cannot be seen from an agent sandbox (the `testflight` environment and its secret, the Expo credentials and quota, Apple). Section 3 lists them; the checklist in section 5 lets the founder close each one in about 10 minutes before dispatching.

Nothing was dispatched, built or uploaded. No workflow file was edited. No secret value was read or written.

## 1. Result in one table

| Check | Result | How |
|---|---|---|
| `testflight.yml` static read | OK, two notes (2.1) | read the file at `f18864a2` |
| `npm ci` | PASS | local, Node 22.23.4 (workflow uses Node 22) |
| `npm run typecheck` | PASS, exit 0 | local |
| `npm test` | PASS, exit 0 | local: apps/mobile 194 files and 3731 tests, then 23 files / 283 tests (1 skipped), 9 / 129, 10 / 287, 12 / 185 |
| `preflight:testflight --profile testflight` | PASS: 0 FAIL, 2 WARN, 3 UNVERIFIED, 58 PASS, 0 founder steps missing | local |
| `preflight:testflight --profile preview` | PASS: 0 FAIL, 2 WARN, 6 UNVERIFIED, 59 PASS | local |
| `.github/scripts/seam-guard.mjs --profile testflight` and `--profile preview` | PASS both: bundle clean, none of 10 seam identifiers | local |
| `scripts/release/doctor.ts` (no live variables) | PASS: 0 FAIL, 1 WARN, 2 UNVERIFIED | local |
| `develop` required checks | `applied migrations unchanged`, `required`, `compliance-fence` | `gh api` branch protection, enforced for admins |
| Last `ci.yml` runs on `develop` | head `f18864a2` was still running at 08:36 UTC; the run before it (`9b202f67`) succeeded; two runs in between were cancelled by newer pushes | `gh run list` |
| `testflight` environment, its protection, `EXPO_TOKEN` | **UNVERIFIED** (proxy refuses these endpoints) | section 3 |
| Prior dispatch of `testflight.yml` | **None.** 14 runs ever, all `pull_request` and all skipped; 0 `workflow_dispatch` runs | `gh api .../workflows/testflight.yml/runs` |

An earlier pass in this session used a stale `origin/develop` (`29dcd7d8`). All results above were rerun on `f18864a2`; the four commits between them touch none of `testflight.yml`, `eas.json`, `app.config.ts` or `package-lock.json`.

Local results are a proxy for the workflow's steps on `ubuntu-latest`, not proof of them. The local machine is Linux with Node 22.23.4; the runner image will differ.

## 2. What was checked

### 2.1 `testflight.yml`, read at `f18864a2`

| Item | Finding |
|---|---|
| Trigger | `workflow_dispatch` with `profile` (choice `testflight`, `preview`; default `testflight`) and `submit` (boolean; default true). The `pull_request` trigger (path: this file) builds nothing. |
| Branch gate | job `if` allows `refs/heads/develop` or an `ios-v*` tag. The environment's deployment refs allow `develop` only, so **dispatch on `develop`**; a tag run would be refused (known, open, in the file header). |
| Environment | `testflight`, named once, on the `build` job. A missing environment would be created with no protection (SR-11), which is why section 5 checks it first. |
| Secret | `EXPO_TOKEN` read from `secrets.EXPO_TOKEN`, in the last step only. The step stops with a plain message if it is empty and never prints it. |
| eas-cli | pinned `EAS_CLI_VERSION: 24.10.0`, the same value as `release-ios.yml` line 46 and as the runbook commands. Run as `npx --yes eas-cli@24.10.0`. |
| Inputs | passed through `env` (`PROFILE`, `SUBMIT`), not into script text. `case` rejects any other profile in three places. |
| Step order | checkout, setup-node (22, npm cache), `npm ci`, typecheck, `npm test`, preflight, seam guard (B-8), then the EAS build as the only step with the token. The token is never in scope while repository code runs. |
| Actions | pinned to commit SHAs with the tag in a comment. |
| Concurrency | group `testflight`, `cancel-in-progress: false`: a second dispatch waits, it does not cancel. |
| Timeout | 75 minutes for the job. `--wait` makes the job wait for the EAS build, so a long EAS queue counts against it. |
| Submit | `--auto-submit` when `submit` is true; needs `ascAppId` (present in `eas.json` for both `testflight` and `preview`, doctor PASS) and an App Store Connect API key held by EAS (UNVERIFIED). |

Notes, neither blocking:
1. **The first token check comes last.** If `EXPO_TOKEN` is missing, the run spends the install, typecheck and the full test suite (tens of minutes on a runner; local `npm test` took about 15 minutes here) and then fails at the final step. Section 5 checks the secret's name before dispatch. A proposal to fail earlier belongs in `docs/ops/proposed/` after 9 Nov, since `.github` is frozen tonight.
2. **The run needs a reviewer click if the environment has a required reviewer** (the TESTFLIGHT.md design). The job waits at "Waiting for review" until the founder approves it in the Actions run page. This is expected, not a hang.

### 2.2 Local runs against `origin/develop` at `f18864a2`

Commands, in the workflow's order, from the repository root:

```
npm ci
npm run typecheck
npm test
npm run preflight:testflight -w @scribe/mobile -- --profile testflight   # and --profile preview
node .github/scripts/seam-guard.mjs --profile testflight                 # and --profile preview
npx tsx scripts/release/doctor.ts
```

Preflight WARN lines (both profiles), unchanged from TESTFLIGHT.md and not new:
- Apple's processing email after upload is the final check of required-reason declarations (ITMS-91053, go/no-go B1-10). Read that email after the upload.
- `ExpoFileSystem.framework` has no privacy manifest. Act only if the upload email names it.

Preflight UNVERIFIED lines: the EAS `preview` environment holding no `EXPO_PUBLIC_E2E` and no Google client id (the build itself would refuse the first, B-9); the signed pack manifest being served by the live host (`npx tsx scripts/packs/publish.ts verify` checks it from a computer with network); the stripped local-network keys in the built Release app (only an inspected build shows this).

Doctor WARN: the `production` profile sets `channel` without `expo-updates`, so `eas build --profile production --non-interactive` would stop. Neither alpha profile uses `production`. Not relevant to build 9; relevant to the store build.

Doctor ran without `EXPO_TOKEN` and the `ASC_API_*` variables, so it did not check the Expo login or the App Store Connect key. With them set on the founder's Mac it does (section 5, step 7).

One local note: running two `expo export` jobs at once (a test run and the seam guard) collided on `/tmp/metro-cache` and failed the seam guard once. That is a local artefact of running them in parallel; the workflow runs them in sequence, and both pass when run alone.

### 2.3 Live GitHub state (REST, read only)

| Item | State |
|---|---|
| Default branch | `develop` |
| `testflight.yml` | registered, state `active`, workflow id 402268598 |
| Runs of `testflight.yml` | 14, all `pull_request`, all `skipped` (the job `if` skips them). **0 dispatches.** |
| `develop` protection | required status checks `applied migrations unchanged`, `required`, `compliance-fence` (not strict); 0 required approving reviews; admins included; no force push, no deletion |
| Rulesets | two active: "Copilot review for main and develop" and "Protect long-lived branches" (contents not read) |

## 3. UNVERIFIED: cannot be seen from here

| # | What | Why not visible | If wrong, what happens | Who checks and how |
|---|---|---|---|---|
| U1 | Environment `testflight` exists, admits `develop` only, has the founder as reviewer | the agent proxy refuses `/environments` (HTTP 403) | missing: the run creates it with no protection and then fails at the token check. Wrong branch rule: the run is refused before it starts. | founder, section 5 steps 1 to 3 |
| U2 | Secret `EXPO_TOKEN` exists on the environment (the name only; never open the value) | same refusal for `/secrets` | the run fails at the last step, after the tests | founder, section 5 step 4 |
| U3 | The `EXPO_TOKEN` is valid, belongs to the Developer-role robot user, and can see the project (id `0bc517fb-a526-4f0f-892a-5ab676a86e6b` in `app.config.ts`) | no route to expo.dev | build step fails with an auth or project error | founder, run the doctor with the token (section 5 step 7) |
| U4 | EAS build quota and queue time on the Expo plan | no route to expo.dev | build waits or is refused; 75-minute job limit may be hit by a slow queue | founder, expo.dev billing page (section 5 step 8) |
| U5 | Which App Store Connect API key Expo holds for this project, and its role (App Manager, not Admin) | no route to Expo or Apple | `--auto-submit` fails after a good build, or the key has more power than intended | founder, `eas credentials` (section 5 step 9) |
| U6 | iOS distribution certificate and profile for `com.earlyletters.scribe.preview` are stored in EAS and not expired | no route to Expo or Apple | `--non-interactive` cannot prompt, so the build fails at signing | founder, `eas credentials` (section 5 step 9) |
| U7 | Apple processing of the upload, and the TestFlight "Missing Compliance" or ITMS emails | after the fact | build appears late or is flagged | founder, App Store Connect after the upload |
| U8 | Whether the "Family" group has automatic distribution off | no route to Apple | the new build reaches testers by itself | founder, App Store Connect (section 5 step 10) |
| U9 | That `workflow_dispatch` works for this file at all | never dispatched, 0 runs | no run starts; use the Mac fallback | founder, first dispatch (section 5 steps 12 to 18) |

The earlier builds (1 to 8) are not recorded in this repository. The doc cannot say how they were signed, so U5 and U6 are not inferred from them.

## 4. Risks ranked

| Rank | Risk | Likelihood | Cost | Cover |
|---|---|---|---|---|
| 1 | First-ever dispatch of this workflow (U9) | medium | one wasted run, about 15 to 30 minutes | the fallback in section 6 builds the same commit with the same CLI version |
| 2 | `EXPO_TOKEN` missing, wrong or without access (U2, U3) | medium | tests run first, then failure at the last step | checklist steps 4 and 7 |
| 3 | Non-interactive signing or submit lacks credentials (U5, U6) | medium | build or submit fails after the tests | checklist step 9; if only submit fails, run `submit --latest` on the Mac |
| 4 | EAS queue or quota (U4) | low to medium | run exceeds 75 minutes, or build refused | checklist step 8 |
| 5 | A push to `develop` between this check and the dispatch | medium | the build is not the commit that was checked | checklist step 11: dispatch only after CI is green on the head, and note the SHA |

## 5. Before you dispatch (founder checklist)

Time: about 10 to 15 minutes. One action per line. Do not paste any token into chat, an issue or this repository.

1. Open https://github.com/thesaurabhpareek/earlyletters/settings/environments
2. Click `testflight`.
3. Check "Required reviewers" lists you, and "Deployment branches and tags" shows `develop` only.
4. Under "Environment secrets", check the name `EXPO_TOKEN` is listed. Do not click Update or reveal anything.
5. On your Mac, open a terminal in a checkout of `develop`: `git switch develop && git pull && npm ci`.
6. Set the token without leaving it in history: `read -rs EXPO_TOKEN && export EXPO_TOKEN` and paste the same robot-user token; nothing shows.
7. Run `npx tsx scripts/release/doctor.ts`. Expect exit code 0. Read any FAIL line. This signs in to Expo with the token (U3).
8. Open https://expo.dev, select the project `scribe`, open Billing or Usage, and check there is an iOS build left this month and no outstanding queue (U4).
9. In `apps/mobile` run `npx eas-cli@24.10.0 credentials --platform ios`, choose profile `testflight`, read the screen, and press Ctrl+C to leave without changing anything. Check a distribution certificate and a profile for `com.earlyletters.scribe.preview` that have not expired, and an App Store Connect API key with the role App Manager (U5, U6).
10. Open https://appstoreconnect.apple.com, Apps, the `.preview` app, TestFlight, Internal Testing, "Family". Check "Automatically distribute" is off (U8).
11. Open https://github.com/thesaurabhpareek/earlyletters/commits/develop and note the top commit. Check its CI run is green. Do not merge anything else until the build starts.
12. Open https://github.com/thesaurabhpareek/earlyletters/actions/workflows/testflight.yml
13. Click "Run workflow".
14. Set "Use workflow from" to `develop`.
15. Set "Which alpha build" to `testflight` for build 1, or `preview` for build 2.
16. Leave "Upload to TestFlight after the build finishes" ticked.
17. Click the green "Run workflow" button.
18. Open the new run. If it says "Waiting for review", click "Review deployments", tick `testflight`, click "Approve and deploy".
19. Check the run's commit is the one you noted in step 11.
20. Watch for the order: install, typecheck, tests, preflight, seam check, then "Build on EAS". If one stops before "Build on EAS", the build did not start and nothing was spent on EAS.
21. When "Build on EAS" is running, the log gives an expo.dev build link. The build is done when the job turns green.
22. After the upload, open App Store Connect, TestFlight, and wait for the build to leave "Processing". Read Apple's email for ITMS lines (go/no-go B1-10).
23. Add the build to "Family" only (TESTFLIGHT.md, "Who may have which build").

If step 7 or step 9 shows a problem, stop and use section 6 instead of dispatching.

## 6. Fallback: build on your Mac

Use this if the dispatch does not start, `EXPO_TOKEN` or credentials fail, or the queue is too long. It builds the same commit with the same CLI version (`24.10.0`). Source: `docs/release/TESTFLIGHT.md` step 5 and `docs/ops/RELEASE.md` section 4.

1. `git switch develop && git pull && npm ci`
2. `npm run preflight:testflight -w @scribe/mobile` (use `preflight:alpha` for build 2). Expect 0 FAIL.
3. `cd apps/mobile`
4. `npx eas-cli@24.10.0 login` if you are not signed in.
5. `npx eas-cli@24.10.0 build --platform ios --profile testflight` (`--profile preview` for build 2).
6. Prompt answers:

| Prompt | Answer |
|---|---|
| Install expo-updates | **No** (over-the-air updates are not planned; `EXPO_PUBLIC_` values are inlined at build time) |
| Log in to your Apple account | **Yes**, then your Apple ID and the two-factor code |
| Generate a new Apple Distribution Certificate or Provisioning Profile | Yes, only if EAS has none or they expired (step 9 of section 5 shows this) |
| Set up Push Notifications | **No** (plain No, not "No, don't ask again"; the app uses no remote push and must have no push key) |

7. When the build finishes: `npx eas-cli@24.10.0 submit --platform ios --profile testflight --latest` (`--profile preview` for build 2).
8. If submit asks "Generate a new App Store Connect API Key?" answer Yes and choose the role **APP_MANAGER**, never "ADMIN (default)". If it asks "Reuse this App Store Connect API Key?" answer Yes only when the Key ID shown is the App Manager key.
9. If Apple's two-factor prompt expires, repeat the command; EAS keeps the build.
10. If a build succeeded on EAS but the GitHub run failed at submit, do step 7 alone. Do not build again; a second build spends a build number.

Build numbers come from the EAS remote counter (`appVersionSource: remote`, `autoIncrement` on both alpha profiles), so a failed run that reaches EAS may still use a number. Treat a number gap as normal.

## 7. What to do after a failure

| Where it fails | Meaning | Next step |
|---|---|---|
| Before "Build on EAS" | a repository check failed; nothing reached EAS | read the log; test failures go to the owner agent; rerun after a fix on `develop` |
| "EXPO_TOKEN is not set" | U1 or U2 | fix the secret on the `testflight` environment, rerun |
| Expo auth or project error | U3 | recreate the robot-user token, update the secret, rerun |
| Signing error under `--non-interactive` | U6 | run the Mac fallback once; it stores the credentials in EAS |
| Build ok, submit fails | U5 or U8 | `submit --latest` on the Mac |
| Run times out at 75 minutes | U4, queue | check expo.dev; if the build is still running, wait for it there and submit from the Mac |

## 8. Proposals for after 9 Nov (not applied)

1. Add an early step in `testflight.yml` that fails fast when `EXPO_TOKEN` is empty, before `npm ci`, with no secret in the log. File a patch in `docs/ops/proposed/` after the freeze lifts.
2. Run one dispatch of `testflight.yml` with `submit` unticked on a non-release day, so the first real dispatch is not also the release night.
3. Record each build number, commit and EAS build link in this folder after every build, so a gap in numbers can be explained.
