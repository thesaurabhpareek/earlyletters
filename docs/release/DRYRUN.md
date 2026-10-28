# Release pipeline dry run (RB-15a)

Status: 28 Oct 2026. Owner: ops (plan), coordinator (runs tiers 0 and 1), founder (tiers 2 and 3). Task A22 of the robustness push.

**Held PRs.** PR #109 (BL-436, version metadata, branch `feat/release-version-metadata`), PR #110 (BL-437, `release-ios.yml`, branch `ci/release-ios-workflow`) and PR #112 (release-engineering chapter and agents, branch `chore/release-agents`) are open and held on 28 Oct. None is on `develop`. **This plan applies once all three have merged.** Until then it is a reading of the files on those branches (heads `eee38eb7` for #109 and `dad0acdf` for #110), not a procedure anyone can run. Re-read the workflow on `develop` after the merge and re-check every row marked V below; a changed line makes that row I.

Marks: **V** = read in a file or run in this session. **I** = inferred, not run. **U** = could not verify.

Inputs read: `release-ios.yml` at `origin/ci/release-ios-workflow`, `.github/workflows/testflight.yml`, `docs/ops/RELEASE.md`, `docs/release/AUTOMATION.md`, `docs/release/TESTFLIGHT.md`, `docs/release/1.0.0.md`, ADR 0022, `apps/mobile/eas.json`.

## 0. What a dry run can and cannot be (read this first)

1. **The RC tag path is the store lane, not the preview lane.** `release-ios.yml` builds the `production` profile (bundle id `com.earlyletters.scribe`, the production App Store Connect record) and uses `--auto-submit` (V, workflow `build` job; ADR 0022 decision 1, V). The preview lane (`testflight` and `preview` profiles, `.preview` bundle id) is a different workflow, `testflight.yml`. So "the pipeline in the preview lane" is covered in pieces: the shared steps run in tiers 0, 1 and 2 below, and the tag-specific steps cannot be run without a real tag (tier 3).
2. **`testflight.yml` refuses `ios-v*` tags in practice.** Its job `if` admits them, but the `testflight` environment admits branch `develop` only (V, comment in `testflight.yml`). Do not try to run an RC tag through it. This conflicts with ADR 0022 decision 5 and RELEASE.md, which say C1 preview builds run `testflight.yml` on the latest RC tag; the workflow is the evidence here and the ADR looks stale (I), so the ADR or the environment needs a decision before the first RC.
3. **Tags never move and cannot be deleted** (CLAUDE.md; ADR 0022 decision 4; the `ios-v*` ruleset has no bypass per the Proposed amendment (ADR 0022 decision 8 as written allows founder bypass), V in `release-ios.yml` header, I for the live ruleset because none exists on 27 Oct per `docs/release/1.0.0.md` section 5). A tag pushed for rehearsal stays for good, and its number is spent. There is no "delete the test tag" step in this plan, by design.
4. **A manual `job=checks` run does not run `classify`** (V: `classify` has `if: github.event_name == 'push'`). So the tag name, `version.json` and release-branch checks, and the `docs/release/<x.y.z>.md` check, are not exercised by tier 1. Tier 0 covers them locally.
5. **Nothing here ships anything** in tiers 0 and 1. Tier 2 uploads a `.preview` build to the preview record's internal TestFlight (the founder's call, and the same as alpha build 1). Tier 3 is optional and irreversible.

## 1. Prerequisites, by owner

Agents and the coordinator can do the "repo" rows. Every "founder-only" row needs an Apple, Expo or GitHub-settings login that no agent holds, and agents never touch secrets, EAS or App Store accounts.

| # | Prerequisite | Needed for | Owner | Evidence it exists |
|---|---|---|---|---|
| P1 | #109, #110 and #112 merged to `develop` | everything below | founder merges (agents never merge) | `git log origin/develop` shows them; `apps/mobile/version.json` and `.github/workflows/release-ios.yml` present on `develop` |
| P2 | `release-ios.yml` on the default branch (`main` today; AF-05 moves it to `develop`) | the Actions tab "Run workflow" button for tier 1 | founder (AF-05, default branch) | the workflow appears in the Actions tab. V that the default branch is `main` on 28 Oct (`gh api repos/thesaurabhpareek/earlyletters`). I that dispatch needs the file on the default branch (stated in `testflight.yml` and `docs/release/1.0.0.md`; not re-tested) |
| P3 | A non-empty `TRUSTED_SIGNING_KEYS` in `packages/api/src/keys.ts` (FT-16, D-115) | `checks` passes | founder generates keys (`node scripts/packs/keygen.mjs`, own terminal); a PR commits the public halves | V: it has 0 entries on `develop` and on the #110 branch (ran the check) |
| P4 | Expo account, project created, `extra.eas.projectId` and `owner` in `apps/mobile/app.config.ts` (BL-339, FT-17) | tier 2 and tier 3 builds | founder creates the project; a small PR adds the two values | V: neither is in `app.config.ts` on the #110 branch (grep) |
| P5 | GitHub Environment `testflight` (branch `develop` only) with secret `EXPO_TOKEN` from an Expo robot user, created before the first run | tier 2 | founder (`npx tsx scripts/release/github-settings.ts --approver <login>`, then `--apply`, then `--verify`; secret by hand) | `--verify` prints "Settings match the spec" (V in TESTFLIGHT.md step 6; script not run here) |
| P6 | EAS credentials for the `.preview` id: distribution certificate, profile, and an App Store Connect API key with role App Manager stored in EAS | tier 2 | founder | `eas credentials` on the founder's computer lists them (I) |
| P7 | `.preview` App Store Connect record, its numeric Apple ID in `eas.json` as `submit.testflight.ios.ascAppId` (and `submit.preview...`), a "Family" internal group with automatic distribution off | tier 2 with submit | founder creates the record; a PR adds the id | V: `eas.json` `submit.*` are `{}` today |
| P8 | Tier 3 only: GitHub Environment `app-store` (approver account as only reviewer, prevent self-review on, admin bypass off, refs `ios-v*` and `release/*` only) with secrets `EXPO_TOKEN` and `ASC_REVIEW_CONTACT_JSON`; rulesets on `ios-v*` and `release/*`; created BEFORE the workflow merges | tier 3 | founder (FT-20; #236) | V: required by the header of `release-ios.yml`; none exist on 27 Oct (`docs/release/1.0.0.md` section 5) |
| P9 | Tier 3 only: production App Store Connect record, `submit.production.ios.ascAppId` in `eas.json`, production signing credentials in EAS | tier 3 build job | founder | V: `submit.production` is `{}` today |
| P10 | Tier 3 only: a `release/1.0` branch cut from `main` (needs the one-lineage merge, ADR 0026 decision 4, Proposed) | tier 3 | coordinator, after founder approval | V: `main` and `develop` share history only to 3 Oct (ADR 0022 17 Oct amendment) |

## 2. The ordered steps

Run a tier only when its prerequisites hold. Stop at the first red row and record it (section 5).

### Tier 0: local, no secrets, no network (agent or coordinator)

On a clean checkout of merged `develop`, Node 22, after `npm ci`. Each command is what the `checks` job runs (V, workflow) so a local pass predicts the workflow.

| Step | Command | Expected today | Expected once P3 is done |
|---|---|---|---|
| 0.1 | `npm test` and `npm run typecheck` | green (ci.yml gates this) | green |
| 0.2 | `npx tsx scripts/release/store-config.ts --check` | exit 0 (V, ran on the #110 head) | exit 0 |
| 0.3 | `npx tsx scripts/release/store-config.ts --assert-shippable` | exit 1: the description promises an invite, a co-parent in the same book, and writing the book together while production has server features off (V, ran on the #110 head). In `checks` this step is `continue-on-error`, so it only warns; in the `metadata` job it blocks | exit 0 only after BL-440 changes the copy or D-100 turns server features on |
| 0.4 | `grep -rnE "example\.com|com\.example\." packages/brand/index.ts apps/mobile/app.config.ts` | no output, exit 1 (the check passes when nothing matches; V ran) | same |
| 0.5 | `node .github/scripts/seam-guard.mjs --profile production` | pass (script is on `develop`, V; the run itself I) | pass |
| 0.6 | `npx tsx -e "import { TRUSTED_SIGNING_KEYS as k } from './packages/api/src/keys'; console.log(k.length)"` | prints 0, which the workflow treats as a failure (V ran) | prints 2 or more |
| 0.7 | `node -p "require('./apps/mobile/eas.json').build.production.env?.EXPO_PUBLIC_DOCS_BASE_URL ?? ''"` | prints `https://packs.earlyletters.app` (V, read) | same |
| 0.8 | Classify rehearsal, below | see below | see below |

**0.8 Classify rehearsal.** The `classify` step is plain bash. Copy the `run:` block of the step "Tag, version.json and branch agree" into a file, then run it in a scratch clone (never your working clone, and never push) with `TAG`, `GITHUB_SHA` and `GITHUB_OUTPUT` set. Make the release branch visible with `git update-ref refs/remotes/origin/release/1.0 HEAD` and a throwaway local tag with `git tag ios-v1.0.0-rc.1` in the scratch clone only. Results from the run on the #110 head (V, all ran):

| Case | Result |
|---|---|
| `ios-v1.0.0-rc.1`, no `origin/release/1.0` ref | exit 1, "must point at a commit on release/1.0" |
| same, with `origin/release/1.0` | exit 0, `kind=rc version=1.0.0` |
| `ios-v1.0-rc.1` | exit 1, "is not ios-v<x.y.z>-rc.<n> or ios-v<x.y.z>" |
| `ios-v1.1.0-rc.1` while `version.json` says 1.0.0 | exit 1, "tag says 1.1.0 but ... says 1.0.0" |
| `ios-v1.0.0` with no RC tag on the commit | exit 1, "no ios-v1.0.0-rc.<n> tag on this commit" |
| `ios-v1.0.0` with a local `ios-v1.0.0-rc.1` on the commit | exit 0, `kind=release` |
| `ios-v1.0.0-rc.1` with only `origin/release/ios-v1.0` | exit 1: the existing branch name does not match (see F-3) |

### Tier 1: workflow dry run on GitHub, no tag, no environment, no secret, no build (coordinator)

Needs P1, P2, P3.

1. Actions > Release iOS > Run workflow, branch `develop` (or the release branch once it exists), input `job` = `checks`. (V: `workflow_dispatch` offers `metadata` and `checks`; the `metadata` option does nothing off a `release/*` branch and needs the environment, so never pick it for a dry run.)
2. Expected jobs (V, from the `if` conditions): `classify` skipped; `checks (G2)` runs; `build` skipped (it needs a successful `classify`); `github-release` skipped; `metadata` skipped.
3. Expected result **today**: `checks` red at "The RC can verify signed documents" because `TRUSTED_SIGNING_KEYS` is empty (V, step text and 0 keys). The step before it, "Listing promises nothing the build switches off", is `continue-on-error`, so it shows a warning annotation at most (V). With P3 done, expect green with a seam-guard pass and no `EXPO_PUBLIC_DOCS_BASE_URL` warning.
4. Duration: the job has a 15 minute limit (V); the whole run should be about as long as the `ci.yml` test job (I, not measured).
5. Cleanup: none. No tag, no deployment, no secret. The run log is the evidence.

### Tier 2: preview-lane build through the shared EAS plumbing (founder-only)

This is alpha build 1 (`docs/release/TESTFLIGHT.md` step 5), used here as the rehearsal of `EXPO_TOKEN`, non-interactive credentials, `--auto-submit` and `ascAppId`. It differs from the store lane in three ways: environment `testflight` not `app-store`, profile `testflight` not `production`, and `--wait` not `--no-wait` (V: both workflow files). It spends one of the 15 monthly EAS Free iOS builds (ADR 0022 consequences, V).

Needs P1 to P7 (P1 only for the checks). Steps:

1. On the founder's computer: `npx tsx scripts/release/doctor.ts --live` with `EXPO_TOKEN` and the `ASC_API_*` variables set; expect exit 0 (documented in TESTFLIGHT.md step 5; not run by anyone yet, so I).
2. Actions > testflight > Run workflow, branch `develop`, profile `testflight`, submit ticked. The `testflight` environment's reviewer approves.
3. Expected: typecheck, tests, preflight, seam guard B-8, then `eas build ... --non-interactive --wait --auto-submit` (V). Green means a build finished and was submitted. The build appears in the `.preview` record's TestFlight after Apple processing (10 to 15 minutes, an Expo-documented figure cited in RELEASE.md; not re-checked).
4. Record: the EAS build URL, the build number (remote counter), the run URL, the commit.
5. Abort: cancel the Actions run before the build step, or cancel the build on expo.dev (founder). A finished build cannot be un-built; expire it in TestFlight (founder). Nothing in the repo changes.

### Tier 3: a real RC tag, approval rejected (founder decision, irreversible, optional)

Only if tiers 0 to 2 are green and the founder wants proof of `classify`, the `app-store` gate and the tag trigger on GitHub itself. It needs P1 to P10.

**Tag names (ADR 0022 decision 4, V; regex in `classify`, V).** RC: `ios-v<major>.<minor>.<patch>-rc.<n>`, for example `ios-v1.0.0-rc.1`. Release: `ios-v<major>.<minor>.<patch>`, pushed on the same commit as the RC Apple approved. `<n>` starts at 1 and counts up per version. The tag, `apps/mobile/version.json` and `release/<major>.<minor>` must agree. No `ios-v1.0.0-test`, no `-dryrun`, no `-rc` without a number: all fail `classify` and still leave the tag behind.

**Number policy.** A rehearsal burns a real number. If the rehearsal tag is `ios-v1.0.0-rc.1` and its build is rejected, the first real RC is `rc.2`. Write that in `docs/release/1.0.0.md` so nobody reads a gap as a lost build. The coordinator pushes the tag from a founder-credential session (ADR 0022 decision 4; the harness App cannot).

Steps:

1. Coordinator: confirm `git rev-parse origin/release/1.0` equals the commit to tag; confirm `docs/release/1.0.0.md` is current.
2. Coordinator: `git tag ios-v1.0.0-rc.1 <sha>` and `git push origin ios-v1.0.0-rc.1`.
3. Expected: `classify` green (`kind=rc`, `version=1.0.0`); `checks` green (needs P3); `build` pauses for the `app-store` reviewer.
4. **Founder, approver account: Reject the deployment.** Rejecting means the `build` job never starts, no `EXPO_TOKEN` is issued to it, and no production build or upload happens (I: this is GitHub's documented environment behaviour; U for this repo until it is seen once). The run ends red on `build`. That red is the expected result, not a failure of the plan.
5. Do not approve unless you intend to ship an RC to the production record's internal TestFlight. Approving runs the build with `--auto-submit` on the production profile (V).
6. The `ios-v1.0.0` release path (`github-release`, `docs/release/1.0.0.md` as notes) is never rehearsed by pushing a tag: it publishes a GitHub Release. Cover it only with the tier 0 classify cases (V ran) and by reading `gh release create "$TAG" --verify-tag --title "iOS $VERSION" --notes-file "docs/release/$VERSION.md"`.
7. The `metadata` job (store text push) is not rehearsed. Its inputs are checked by tier 0 steps 0.2 and 0.3; its secret `ASC_REVIEW_CONTACT_JSON` shape is validated by `scripts/release/with-review-contact.ts` (V read).

## 3. Abort and clean up

| Situation | What to do | What remains |
|---|---|---|
| Tier 0 or 1 red | Fix the cause in a PR, rerun. No state to clean | Nothing |
| Tier 1 run started on the wrong ref | Cancel the run in the Actions tab | Nothing |
| Tier 2 started by mistake | Cancel the run, or the EAS build on expo.dev (founder) | A cancelled build still counts against the monthly allowance if it started (I) |
| Tier 3 tag pushed on the wrong commit | Do NOT delete or move it (rulesets forbid it, and tags never move). Reject the `app-store` approval. Push `rc.<n+1>` on the right commit | The old tag, permanently; note it in `docs/release/<x.y.z>.md` |
| Tier 3 approved by mistake | Founder cancels the EAS build on expo.dev at once; if it already uploaded, expire that build in the production record's TestFlight (founder) | The tag and the build number |
| A concurrency queue builds up | `release-ios-<ref>` has `cancel-in-progress: false` (V), so queued runs wait. Cancel them by hand | Nothing |
| Secret exposed in a log | Stop. Hand to `security`; rotate in Expo or GitHub (founder). Agents never rotate secrets | n/a |

Cleanup that agents may do: remove scratch clones and local throwaway tags from tier 0. Cleanup agents must not do: touch tags on `origin`, environments, secrets, EAS or App Store Connect.

## 4. Evidence to record

Paste into `docs/release/1.0.0.md` section on the dry run, or the tracking issue, never into chat only. Do not paste tokens, keys, contact details, tester emails or any family detail; use run URLs and ids.

- Date, the `develop` sha, and the sha of `release-ios.yml` that was run.
- Tier 0: the command, exit code and first error line for each of 0.1 to 0.8 (the classify table above, re-run on the merged file).
- Tier 1: run URL, job list with each job's conclusion, the text of any red step, the annotations (warnings count too).
- Tier 2: run URL, EAS build URL, build number, TestFlight processing time, whether `--auto-submit` reached App Store Connect.
- Tier 3: tag name, `classify` and `checks` conclusions, the `app-store` approval screen with the reject decision.
- For every failure: which row of section 5 it matched, or "new" if none.

## 5. Where the workflow could fail on first run

Read from `release-ios.yml` at `dad0acdf` unless noted. Order is the order a run reaches them.

| ID | Where | Failure | Mark | Fix and owner |
|---|---|---|---|---|
| F-1 | Trigger | Manual run: "Run workflow" is absent until `release-ios.yml` is on the default branch (`main` today) | V that the default is `main`; I that dispatch needs it there | Founder: AF-05, or merge the workflow to `main` |
| F-2 | Trigger | A push of any `ios-v*` tag runs the workflow, including a mistyped one; `classify` rejects it, but the tag stays | V | Coordinator: type tags from the table in tier 3; never from memory |
| F-3 | `classify`, branch check | The only release branch that exists is `origin/release/ios-v1.0`. The check needs a remote branch named exactly `release/<major>.<minor>` (`origin/release/1\.0$`). Ran it: an RC tag on a commit that is on `release/ios-v1.0` fails | V (ran) | Coordinator cuts `release/1.0`; founder settles the fate of `release/ios-v1.0` (FT-20 raises it; `github-settings.ts` flags it) |
| F-4 | `classify`, branch check | `git branch -r --contains` only sees branches fetched by checkout; `fetch-depth: 0` is set (V). If the tag commit is on `release/1.0` but that branch was just created and is not on origin yet, it fails | V for the depth, I for the timing | Coordinator: push the branch, then the tag |
| F-5 | `classify`, version | Tag version must equal `apps/mobile/version.json`. After #109, `version.json` is `1.0.0`. A PATCH bump on the release branch without the tag following fails | V (ran) | Coordinator bumps `version.json` on the release branch first (RELEASE.md section on patch releases, V) |
| F-6 | `classify`, release kind | `ios-v<x.y.z>` needs an `ios-v<x.y.z>-rc.<n>` tag on the same commit, else fails | V (ran) | Coordinator pushes the release tag on the RC commit only |
| F-7 | `classify`, release kind | `docs/release/<x.y.z>.md` must exist. `1.0.0.md` exists on `develop` (V). A new version without its record fails, after the tag is pushed | V | Coordinator adds the record on the release branch before the first RC (RELEASE.md 1.2) |
| F-8 | `checks`, signing keys | `TRUSTED_SIGNING_KEYS` has 0 entries on `develop` and the #110 head, so the step exits 1 | V (ran) | Founder: FT-16 keys, then a PR (P3). Largest known first-run blocker |
| F-9 | `checks`, tests | `npm test` and `npm run typecheck` must pass on the tagged commit. A red `develop` blocks the RC | V (step read), I (current state) | Owner agent of the failing test |
| F-10 | `checks`, store config | `store-config.ts --check` fails if `apps/mobile/store.config.json` is stale against `packages/content` or `version.json`. Passes on the #110 head | V (ran) | Rerun `store-config.ts` after any content change (content owner) |
| F-11 | `checks`, listing promises | `--assert-shippable` fails today (3 server-only claims) but the step is `continue-on-error`, so tier 1 and the RC run stay green with a warning, while the **metadata job will fail on the same check** | V (ran) | Founder decision on BL-440: change the copy or turn server features on. Content owner |
| F-12 | `checks`, placeholder scan | Passes today (no match in `packages/brand/index.ts` or `app.config.ts`). It scans only those two files, so a placeholder elsewhere (store text, `eas.json`) is not caught | V (ran, read) | Not blocking. Widen later via a PR to the workflow, reviewed independently |
| F-13 | `checks`, seam guard | If `.github/scripts/seam-guard.mjs` is absent the step warns and passes. It is on `develop` today, so it will run. `--profile production` is accepted by the script | V (read) | None |
| F-14 | `checks`, docs base | Warning only if `EXPO_PUBLIC_DOCS_BASE_URL` leaves `eas.json`; it is set today | V | None |
| F-15 | `checks`, setup action | Uses `./.github/actions/setup`, which restores a node_modules cache or runs `npm ci`. Fine for a job without secrets; `build` uses `npm ci` and no cache by design | V | None |
| F-16 | `build`, environment | The `app-store` environment must exist with the approver as reviewer BEFORE the workflow merges; a run naming a missing environment creates it unprotected (SR-11). Does not exist on 27 Oct | V (workflow header; 1.0.0.md) | Founder: P8 |
| F-17 | `build`, reviewer | Every RC build waits for the approver account. Nobody approving leaves the run waiting (not red) until GitHub times it out | V (header), I (timeout behaviour) | Founder |
| F-18 | `build`, secret name | First step fails if `EXPO_TOKEN` is empty. The secret must be on the `app-store` environment, and named exactly `EXPO_TOKEN`; a token stored only on `testflight` is not visible here | V | Founder: P8 |
| F-19 | `build`, project link | `eas build` stops until `extra.eas.projectId` (and `owner`) are in `app.config.ts`; neither is, in either branch | V for the config (grep), I for the stop (TESTFLIGHT.md states it for eas-cli 24.10.0) | Founder gives the id; mobile PR (P4) |
| F-20 | `build`, credentials | `--freeze-credentials` with `--non-interactive` fails if production signing credentials are not already in EAS | V (flags read in eas-cli 24.10.0), I (failure text) | Founder: first production credentials set up on their computer (P9) |
| F-21 | `build`, flags | `--auto-submit`, `--what-to-test`, `--freeze-credentials`, `--message` and `--no-wait` all exist in eas-cli 24.10.0 (read `build/commands/build/index.js` from the npm tarball). `--what-to-test` errors without `--auto-submit`; the workflow passes both | V | None |
| F-22 | `build`, auto-submit | `submit.production` in `eas.json` is `{}` (no `ascAppId`). Non-interactive submit needs the Apple ID of the production record and an App Store Connect API key in EAS, else the submit step on EAS fails or creates a "Team (Expo)" TestFlight group that auto-distributes (TESTFLIGHT.md step 5) | V for `{}`, I for the exact failure | Founder: P9, create the "Family" group first |
| F-23 | `build`, `--no-wait` | The job ends green as soon as EAS accepts the build. A later build or submit failure shows only on expo.dev, not in Actions. Green does not mean "in TestFlight" | V (flag), I (consequence) | Coordinator: always confirm on expo.dev and in TestFlight; record the build URL |
| F-24 | `build`, time and cost | Uses 15 minutes of Actions at most; the EAS build queues at low priority on Free, one concurrent, 45 minute timeout, within the 15 builds a month shared by both lanes | V (ADR 0022 consequences, read 15 Oct) | Count builds before tier 3 |
| F-25 | `build`, build number | `autoIncrement` with `appVersionSource: remote` means EAS owns build numbers; the first RC after tier 2 continues the counter. Nothing in the repo to set | V (eas.json) | None |
| F-26 | `github-release` | `gh release create --verify-tag` needs the tag to exist (it does) and `contents: write` (set on the job, V). The notes file is the release record `docs/release/<x.y.z>.md`, a status document, so the public Release page will show it verbatim | V | Coordinator: reread `1.0.0.md` for public suitability before the release tag |
| F-27 | `metadata` | Runs only from a `release/*` branch via manual dispatch; needs `ASC_REVIEW_CONTACT_JSON` with firstName, lastName, email, phone in `+` international form, copyright; fails on any missing field, and (when production server features are on) without `demoUsername` and `demoPassword` or if the notes say "no sign-in". Also fails on the F-11 check | V | Founder: secret in the `app-store` environment (P8) |
| F-28 | Whole workflow | Pins: actions by SHA, `EAS_CLI_VERSION` 24.10.0 equal to `testflight.yml`. `testflight.yml` pins different action SHAs and versions than `release-ios.yml`'s `checkout`; harmless but two places to update | V | Bump together (comment in both files) |
| F-29 | Process | #109, #110 and #112 are held. If #110 merges before #112, `docs/ops/RELEASE.md` cites REL-R05 in a chapter that does not exist yet | V (RELEASE.md line 119) | Merge order is the founder's; note it |

## 6. Pass and fail table

Fill the right column during the run. A tier passes only when every row passes; do not skip rows to reach the next tier.

| # | Check | Pass looks like | Fail looks like | Result | Evidence |
|---|---|---|---|---|---|
| 0.1 | `npm test`, `npm run typecheck` | exit 0 | any red | | |
| 0.2 | `store-config.ts --check` | exit 0 | stale file message | | |
| 0.3 | `store-config.ts --assert-shippable` | exit 0, or exit 1 recorded as a known warning (F-11) | exit 1 and nobody has recorded why | | |
| 0.4 | placeholder grep | no match | any match | | |
| 0.5 | seam guard, production | exit 0 | exit 1 | | |
| 0.6 | trusted signing keys count | 2 or more | 0 (known blocker today, F-8) | | |
| 0.7 | docs base URL in `eas.json` | URL printed | empty | | |
| 0.8 | classify rehearsal: all 7 cases give the result in the table | 6 outcomes as listed, branch case passes once `release/1.0` exists | a case differs from the table | | |
| 1.1 | `job=checks` dispatch starts | run appears | button missing (F-1) | | |
| 1.2 | job set | only `checks (G2)` runs | `build` or `metadata` starts | | |
| 1.3 | `checks (G2)` | green; warnings listed | red | | |
| 2.1 | doctor `--live` | exit 0 | any FAIL | | |
| 2.2 | `testflight.yml` run | green | red at the EXPO_TOKEN, credentials or preflight step | | |
| 2.3 | build in TestFlight | present after processing | absent after 60 minutes | | |
| 3.1 | `classify` on the RC tag | green, `kind=rc` | red | | |
| 3.2 | `checks` on the RC tag | green | red | | |
| 3.3 | `build` gated | waiting for the approver, then rejected, no EAS build created | starts without approval | | |
| 3.4 | no ship | no new build on the production record | a build appears | | |

Overall: pass = tiers 0 and 1 green, tier 2 green, and tier 3 either green through step 3.3 or consciously skipped with the reason recorded. Fail = anything else. After a pass, F-3, F-8, F-16 to F-22 are the rows most likely to move from "possible" to "seen"; update the table with what actually happened.

## 7. What this plan did not verify

- No GitHub Actions run of `release-ios.yml` has happened; every statement about GitHub or EAS behaviour at run time is I or U unless a row says V.
- EAS and App Store Connect behaviour (credentials in non-interactive mode, the `Team (Expo)` group, auto-submit with `--no-wait`) is taken from `docs/release/TESTFLIGHT.md` and the eas-cli 24.10.0 package, not from an account.
- The reject-the-approval behaviour in tier 3 has not been seen on this repository.
- The live GitHub rulesets and environments were not queried; they are taken from `docs/release/1.0.0.md` of 27 Oct.
- Any workflow change (for example widening the placeholder scan, F-12) is out of scope here and needs a proposed patch under `docs/ops/proposed/` and independent review.
