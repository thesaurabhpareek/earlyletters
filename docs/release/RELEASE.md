# Releasing the app

How a version of Early Letters goes from `develop` to the App Store. Decision: ADR 0022 (D-089). Gates: TDD 07 9.1 is authoritative; the table below abridges it. Preview-lane builds (C0, C1): `docs/release/TESTFLIGHT.md`. The v1.0 record and readiness list: `docs/release/1.0.0.md`. **Coordinator** is the session that may push and tag (COORDINATION section 1); **Founder** is you.

Status 13 Oct 2026: `.github/workflows/release-ios.yml` exists on branch `ci/release-ios-workflow` and has never run. It needs `EXPO_TOKEN`, the production App Store Connect record and signing credentials in EAS (`docs/release/1.0.0.md` section 1).

## Two lanes

| | Preview lane | Store lane |
|---|---|---|
| For | C0, C1, any build before freeze | Release candidates and the App Store |
| EAS profile | `testflight` | `production` |
| Bundle id | `com.earlyletters.scribe.preview` | `com.earlyletters.scribe` (permanent from the first upload) |
| Built from | `develop`, by `testflight.yml` (manual) or a computer | `ios-v<x.y.z>-rc.<n>` tags on `release/*`, by `release-ios.yml` |
| Testers | C0 internal, C1 external (Beta App Review) | Founder's phones (internal), then App Review |

## Shape

```
feature PRs -> develop --(release PR)--> main
                  |                        \
                  |                         release/1.0      cut Mon 26 Oct (freeze)
     preview builds for C0 and C1             |  ios-v1.0.0-rc.1 -> checks, production build, TestFlight (internal)
     (testflight.yml, .preview record)        |  fixes cherry-picked from develop, ios-v1.0.0-rc.2 ...
                                              |  RC that passed FT-39 -> App Review (Mon 2 Nov) -> release
                                              +- ios-v1.0.0 on that RC's commit -> GitHub Release
                                              +- release/1.0 stays open for 1.0.1
```

| Item | Rule |
|---|---|
| Version | `apps/mobile/version.json`, shared by iOS and Android. MINOR bumped on `develop` before the release PR; PATCH bumped only on the release branch. |
| Build number | EAS remote, auto-incremented. Never by hand. |
| Tags | `ios-v<x.y.z>-rc.<n>` builds a candidate; `ios-v<x.y.z>` marks the released one. Coordinator only. Never moved or reused. |
| Record | `docs/release/<x.y.z>.md`; the GitHub Release is generated from it. |

## Gates (TDD 07 9.1, abridged; the TDD is authoritative)

| Gate | When | Must pass | Automated by `release-ios.yml` |
|---|---|---|---|
| G0 | every PR | PR CI | |
| G1 | merge to `main` | G0 on the merge commit | |
| G2 | internal TestFlight | G1, nightly green once BL-275 lands, manual smoke on D1 | RC tag: tag, `version.json` and branch agree; `npm test`; typecheck; store metadata matches content; no placeholder identity |
| G3 | external TestFlight (preview lane) | P0 LEGAL-REQ and DATA-REQ tests for shipped scope, privacy labels and manifest diffed, VoiceOver script | |
| G4 | submission | 76 PRD section 6 lines on D1 and D2, device budgets, kill-during-save 500x, M-01 to M-09, no open S0 or S1; C1 exit (FT-40) | release tag needs an RC tag on the same commit and a release record |
| G5 | after release | v1.0: manual release with kill switches ready (no phased release for a first version). Updates: phased release; crash-free sessions 99.8 percent, users 99.5 percent; pause on any S0 | |

Download size under 40 MB (D-065): `scripts/size/measure.ts --ipa` on each RC, by hand.

## Cutting a release (Mon 26 Oct for 1.0)

1. `release` agent updates `docs/release/<x.y.z>.md`: PRs in, config switched on, screenshots, gate status.
2. For 1.1 and later: PR on `develop` bumping MINOR in `version.json`; `content` adds release notes for the version in `packages/content`.
3. **Coordinator** opens the release PR `develop` to `main`; **Founder** approves (FT-44).
4. **Coordinator** creates `release/<major>.<minor>` from that `main` commit and pushes `ios-v<x.y.z>-rc.1`.
5. The workflow runs the checks and starts the EAS build with auto-submit to TestFlight; it does not wait for the build. Record the build number from expo.dev in the release record.

## Shipping it

6. **Founder** FT-39 on the RC: device budgets, kill-during-save, StoreKit checks, durability drill.
7. **Founder** runs `release-ios.yml` by hand with `job: metadata` to push store text (`eas metadata:push`, review contact from the secret); uploads screenshots from `scripts/brand/screenshots.mts` (EAS Metadata cannot); works through "Before submission" in `docs/store/app-store.md` and FT-43.
8. **Founder** FT-45: submits that RC build, manual release selected.
9. On approval **Founder** releases; **Coordinator** pushes `ios-v<x.y.z>` on the RC's commit. The workflow checks it and publishes the GitHub Release from the record.
10. `ops` posts the day 1, 3 and 7 health report from App Store Connect crash numbers the founder pastes (no crash SDK in v1.0).

## Hotfix

1. Fix merged to `develop`, labelled `release:<major>.<minor>`, listed in the record.
2. **Coordinator** cherry-picks it onto the release branch, bumps PATCH in `version.json` there only, and pushes the next RC tag.
3. Same gates. For an S0 the founder may skip external soak with a note in the record; checks and the device smoke are never skipped. Ask Apple for expedited review if families are affected.

## Stopping a bad release

Fastest first: a kill switch in the signed config document (D-066, D-068; today `sync`, `invites`, `photos`, `packDownloads`, `serverContent` in `packages/api/src/remote-config.ts`) -> pause phased release (updates only) -> hotfix with expedited review. Kill switches reach phones only when the build carries the signing key and the documents host (FT-16, `EXPO_PUBLIC_DOCS_BASE_URL`); without them a build has no remote stop at all. `minSupportedVersion` exists in the config schema but nothing in the app enforces it yet, so it cannot force an update. There is no binary rollback and no OTA in v1.0 (D-091).

## Secrets (repository secrets while the repo is private on GitHub Free)

| Name | What | Used by |
|---|---|---|
| `EXPO_TOKEN` | Expo robot token (FT-17); a robot token needs `owner` in app config | RC build, metadata push |
| `ASC_REVIEW_CONTACT_JSON` | `{"firstName","lastName","email","phone","demoRequired"}` and, only if a demo account ever exists, `demoUsername` and `demoPassword` | metadata push |

The App Store Connect API key and signing credentials live in EAS credentials, never in GitHub.

## Release record template

```
# <x.y.z> (iOS)
- Branch: release/<major>.<minor>   RC tags: <list>   Build: <n>   Status: preparing | cut | RC | in review | released | paused
- In it: <PR list>
- Cherry-picks waiting: <PRs labelled release:<major>.<minor> not yet on the branch>
- Config switched on for this version: <key = value, owner>
- Release notes: <packages/content key, or "first version: none">
- What to Test (TestFlight): <2 to 4 lines>
- Screenshots: current | regenerate (<screens>)
- Known issues: <list>
- Gate evidence: <links>
- Rollback plan: <kill switch / pause / hotfix>
```
