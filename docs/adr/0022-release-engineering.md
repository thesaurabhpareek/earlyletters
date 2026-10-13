# ADR 0022: Release engineering for the mobile app

- **Status:** Accepted, 2026-10-13 (founder accepted the release-engineering recommendations of 3 Oct and asked for them to be documented). Recorded as D-089 to D-092. Decision 9 changes one of those recommendations and waits for the founder's OK (D-091).
- **Deciders:** founder.
- **Builds on:** the TestFlight lane (PR #100: `docs/release/TESTFLIGHT.md`, `.github/workflows/testflight.yml`), D-041, D-060, D-065, D-066, D-068, D-083 (US storefront only), the on-device v1.0 (PR #54).
- **Amends:** `docs/agents/COORDINATION.md` section 6 (what a release tag means); FT-44 in `docs/FOUNDER_TASKS.md` (tag the release candidate, not the final version, before submission); TDD 07 10.1 (`rc/*` branches become `release/*` branches plus RC tags).
- **Runbook:** `docs/release/RELEASE.md`. **v1.0 record and readiness:** `docs/release/1.0.0.md`.

## Context

Calendar (ROADMAP 2.1): C0 internal TestFlight Wed 14 Oct, Beta App Review Thu 15 Oct, C1 families 19 to 29 Oct, feature freeze Mon 26 Oct, submit Mon 2 Nov, release on approval (planned Mon 16 Nov). v1.0 is on this phone only: no accounts, sign-in or sync (PR #54).

What exists:
- A TestFlight lane (PR #100, merged 13 Oct): a `testflight` EAS profile that builds the `.preview` bundle id so the permanent production id is not spent by test builds, `npm run preflight:testflight`, a manual `testflight.yml` workflow, `docs/release/TESTFLIGHT.md`.
- Store text in `packages/content/src/store.en.ts`, checked by the content rules test (App Store limits, no beta wording, D-060); `scripts/brand/screenshots.mts` makes the 6.9 and 6.5 inch frames; `scripts/size/measure.ts` checks the 40 MB budget (D-065).
- `version: '1.0.0'` typed into `app.config.ts`; EAS remote build numbers (`appVersionSource: "remote"`, `autoIncrement`).

What is missing: a defined path from a frozen tree to the binary Apple reviews, one place for the version, store metadata the pipeline can push, and a rule for what a release tag means.

Constraints checked on 3 Oct 2026 against official pages (sources at the end):
- The repository is private on GitHub Free: no branch protection, no environment secrets, no required reviewers on private repositories. Gates must work without them.
- `eas submit` uploads to TestFlight; it never submits for App Review. EAS Metadata is beta and cannot upload screenshots. Free EAS: 15 iOS builds a month.
- Apple: a first version has no What's New and no phased release. Only promotional text changes without a new version.

## Decision

1. **Two lanes, two App Store Connect records.**
   - *Preview lane* (C0, C1, every build before freeze): the `testflight` profile, bundle id `com.earlyletters.scribe.preview`, built from `develop` by `testflight.yml` or a computer, exactly as `docs/release/TESTFLIGHT.md` says. Nothing changes there.
   - *Store lane* (release candidates and the App Store): the `production` profile, bundle id `com.earlyletters.scribe`, built only from release-candidate tags on a release branch.
2. **Release branch at freeze.** On Mon 26 Oct the coordinator cuts `release/1.0` from `main` (after the release PR from `develop`). It takes fixes only: each merged to `develop` first, then cherry-picked by the coordinator. Android ships from the same branch later.
3. **One version.** `MAJOR.MINOR.PATCH` lives only in `apps/mobile/version.json`, read by `app.config.ts`, shared by iOS and Android. MINOR is bumped on `develop` before a release PR; PATCH only on the release branch. Build numbers come only from EAS.
4. **Tags.** `ios-v<x.y.z>-rc.<n>` on a `release/*` commit builds a release candidate (`release-ios.yml`) and uploads it to the production record's internal TestFlight. `ios-v<x.y.z>` is pushed on the same commit as the RC Apple approved, after release; it publishes the GitHub Release. Only the coordinator pushes tags; tags never move.
5. **Build once, promote.** The RC that passed the release-candidate device checks (FT-39) is the binary submitted (FT-45). Nothing is rebuilt for submission. C1 families test preview-lane builds of the same code; the RC itself gets the internal smoke and FT-39 on the founder's phones.
6. **Store metadata as code.** `scripts/release/store-config.ts` generates `apps/mobile/store.config.json` (EAS Metadata) from `packages/content`; the review contact and demo details are added from a secret at push time and never committed. Screenshots come from `scripts/brand/screenshots.mts` and are uploaded by hand.
7. **What is in, what is on.** The release branch decides what code is in the binary; the signed config document (D-066, D-068) decides what is switched on. Unfinished work is reverted on the branch or ships with its bundled default off.
8. **Gates without paid GitHub features.** The approval is the coordinator pushing a tag or the founder starting a workflow by hand; agents can do neither. `EXPO_TOKEN` and the review contact are repository secrets; the App Store Connect API key and signing credentials live in EAS credentials.
9. **Over-the-air updates are not in v1.0** (changes the 3 Oct recommendation; founder OK needed, D-091). On 3 Oct OTA looked cheap insurance. Since then v1.0 became on-device only (PR #54), the store submission plans "Data Not Collected" (D-088), and submission is three weeks away. `expo-updates` would add a network call on every launch (a new data-map destination whose privacy-label answer counsel would need to confirm) and a policy to review in that window. Fixes ship as PATCH builds, with expedited review for an S0. Revisit for v1.1 with sign-in.
10. **After launch:** a two-week train, phased release on every update, release notes per version in `packages/content`.

## Alternatives considered

| Option | Why not |
|---|---|
| Release from `main` with tags only | Freezes `main` for review and the buffer weeks. |
| One lane (production record for C0 and C1 too) | Workable, but undoes the preview lane already built and checked by its own preflight; a second record costs nothing. |
| Build on every push to `release/*` | Spends free builds on cherry-pick bursts; breaks "builds only from tags". |
| GitHub Environments with required reviewers | Not available on private repositories on GitHub Free. |
| EAS Workflows, fastlane | A second pipeline outside our checks; a Ruby toolchain for a once-per-release upload. |
| OTA in v1.0 | See decision 9. |

## Consequences

- Coordinator per release: cut the branch, cherry-pick, push RC tags, push the release tag. Founder: create the production App Store Connect record, run the metadata job, upload screenshots, FT-39, submit, release.
- About 4 production builds in the freeze window plus preview builds; within EAS Free for October if preview builds stay under about 10.
- Two TestFlight records for v1.0. After launch the preview record stays for internal builds.
- Android adds `android-v*` tags, a Play service account secret and the 14-day closed test for personal accounts.

## Sources (opened 3 Oct 2026)

- https://docs.expo.dev/build-reference/app-versions/ ; https://docs.expo.dev/eas/metadata/ ; https://docs.expo.dev/eas/metadata/schema/ ; https://docs.expo.dev/submit/ios/ ; https://expo.dev/pricing
- https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information/ ; https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases/ ; https://developer.apple.com/app-store/review/guidelines/
- https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments
- https://support.google.com/googleplay/android-developer/answer/14151465
