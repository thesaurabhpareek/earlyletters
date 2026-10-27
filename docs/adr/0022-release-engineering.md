# ADR 0022: Release engineering for the mobile app

- **Status:** Accepted, 2026-10-13 (founder accepted the release-engineering recommendations of 3 Oct and asked for them to be documented). Recorded as D-089 to D-092. Decision 9 changed one of those recommendations; the founder approved it on 13 Oct (D-091). Amended 15 Oct: decision 8 and the first constraint said the repository was private, which was wrong (it is public); the founder chose the environment and rulesets gate on 15 Oct.
- **Amended 17 Oct (what later decisions change here, and one proposal that is not decided):**
  - **Scope and calendar.** D-100 puts server features in v1.0 behind the R-17 gate, D-101 moves the date, and D-106 adds a servers-on TestFlight alpha against staging first (target Thu 29 Oct). The calendar in Context, the 26 Oct cut and the "on-device" reasons in decision 9 are superseded; decisions 1 to 8 and 10 stand, decision 8 as the founder wrote it on 15 Oct. The alpha uses the preview lane (decision 1). The store lane is used once the submission date is set.
  - **Decision 2 has a prerequisite.** `main` and `develop` share history only up to 3 Oct (`git merge-base` is caf2747); on 17 Oct `main` had 43 commits that `develop` lacks, and a merge conflicts in about 40 files, app screens among them. So the release PR from `develop` to `main`, and the cut from `main`, need the one-lineage merge first (ADR 0026 decision 4, Proposed).
  - **Decision 9.** No OTA in v1.0 stands (D-091). Its on-device reasoning no longer applies; the remaining reasons are one reviewed binary per change and no update-check destination to add to the privacy label. Revisit with the submission re-plan.
  - **Gate (decision 8): a proposal, not decided.** ADR 0026 decision 1 (Proposed) and `docs/security/SECRETS_REVIEW.md` (on #206) propose the approver account as the only reviewer of `app-store`; the "Proposed amendment" paragraph under decision 8 has the detail. It takes effect when the founder accepts ADR 0026 decision 1. Until then decision 8 stands as written on 15 Oct.
- **Deciders:** founder.
- **Builds on:** the TestFlight lane (PR #100: `docs/release/TESTFLIGHT.md`, `.github/workflows/testflight.yml`), D-041, D-060, D-065, D-066, D-068, D-083 (US storefront only), the on-device v1.0 (PR #54).
- **Amends:** `docs/agents/COORDINATION.md` section 6 (what a release tag means); FT-20, FT-39, FT-40, FT-44 and FT-45 in `docs/FOUNDER_TASKS.md` (GitHub settings; the RC is tagged and checked before submission, the version tag follows release); `docs/ROADMAP.md` section 2 weeks 4 and 5 (the tag in freeze week is an RC tag); TDD 01 3.10 items 5 and 6 (no OTA in v1.0; RC tags); TDD 06 RB-4 (no EAS Update rollback and no phased release for v1.0); TDD 07 10.1 (`release.yml` on `ios-v*` tags and `rc/*` branches becomes `release-ios.yml` on RC tags on `release/*` branches).
- **Runbook:** `docs/ops/RELEASE.md` (qa-e2e's release train, ported from Line B and amended for D-089 in #111). **v1.0 record and readiness:** `docs/release/1.0.0.md`.

## Context

Calendar (ROADMAP section 2): C0 internal TestFlight Wed 14 Oct, Beta App Review Thu 15 Oct, C1 families 19 to 29 Oct, feature freeze Mon 26 Oct, submit Mon 2 Nov, release on approval (planned Mon 16 Nov). v1.0 is on this phone only: no accounts, sign-in or sync (PR #54).

What exists:
- A TestFlight lane (PR #100, merged 13 Oct): a `testflight` EAS profile that builds the `.preview` bundle id so the permanent production id is not spent by test builds, `npm run preflight:testflight`, a manual `testflight.yml` workflow, `docs/release/TESTFLIGHT.md`.
- Store text in `packages/content/src/store.en.ts`, checked by the content rules test (App Store limits, no beta wording, D-060); `scripts/brand/screenshots.mts` makes the 6.9 and 6.5 inch frames; `scripts/size/measure.ts` checks the 40 MB budget (D-065).
- `version: '1.0.0'` typed into `app.config.ts`; EAS remote build numbers (`appVersionSource: "remote"`, `autoIncrement`).

What is missing: a defined path from a frozen tree to the binary Apple reviews, one place for the version, store metadata the pipeline can push, and a rule for what a release tag means.

Constraints checked on 3 Oct 2026 against official pages (sources at the end):
- The repository is public on GitHub Free (checked 15 Oct; the 3 Oct text said private, which was wrong). For public repositories GitHub Free includes environments with required reviewers, environment secrets and deployment branch and tag rules, and rulesets, including tag rulesets. `deploy-db.yml` already deploys through the `production` environment (D-041).
- Every Claude session works on the founder's GitHub account, and the agent harness uses a GitHub App token. A ruleset bypass or an environment approval stops the App and anyone else without admin rights; it does not stop a session running on the founder's own credentials. Those sessions are held by the written rule (COORDINATION.md) and by the founder seeing every approval request.
- `eas submit` uploads to TestFlight; it never submits for App Review. EAS Metadata is beta and cannot upload screenshots. Free EAS: 15 iOS builds a month.
- Apple: a first version has no What's New and no phased release. Only promotional text changes without a new version.

## Decision

1. **Two lanes, two App Store Connect records.**
   - *Preview lane* (C0, C1, every build before freeze): the `testflight` profile, bundle id `com.earlyletters.scribe.preview`, built from `develop` by `testflight.yml` or a computer, exactly as `docs/release/TESTFLIGHT.md` says. Nothing changes there.
   - *Store lane* (release candidates and the App Store): the `production` profile, bundle id `com.earlyletters.scribe`, built only from release-candidate tags on a release branch.
2. **Release branch at freeze.** On Mon 26 Oct the coordinator cuts `release/1.0` from `main` (after the release PR from `develop`). It takes fixes only: each merged to `develop` first, then cherry-picked by the coordinator. Android ships from the same branch later.
3. **One version.** `MAJOR.MINOR.PATCH` lives only in `apps/mobile/version.json` (after #109; until then `apps/mobile/app.config.ts:162`), read by `app.config.ts`, shared by iOS and Android. MINOR is bumped on `develop` before a release PR; PATCH only on the release branch. Build numbers come only from EAS.
4. **Tags.** `ios-v<x.y.z>-rc.<n>` on a `release/*` commit builds a release candidate (`release-ios.yml`) and uploads it to the production record's internal TestFlight. `ios-v<x.y.z>` is pushed on the same commit as the RC Apple approved, after release; it publishes the GitHub Release. Only the coordinator pushes tags; tags never move.
5. **Build once, promote.** The RC that passed the release-candidate device checks (FT-39) is the binary submitted (FT-45). Nothing is rebuilt for submission. The RC itself gets the internal smoke and FT-39 on the founder's phones. Before the freeze, C1 families get preview builds from `develop`. After the freeze, `develop` moves on, so each C1 preview build is made by running `testflight.yml` on the latest RC tag (its `if:` already accepts `ios-v*` tags). The families then test the same commit as the RC, in the preview record. This is intended, and it costs one preview build per RC.
6. **Store metadata as code.** `scripts/release/store-config.ts` generates `apps/mobile/store.config.json` (EAS Metadata) from `packages/content`; the review contact and demo details are added from a secret at push time and never committed. Screenshots come from `scripts/brand/screenshots.mts` and are uploaded by hand.
7. **What is in, what is on.** The release branch decides what code is in the binary; the signed config document (D-066, D-068) decides what is switched on. Unfinished work is reverted on the branch or ships with its bundled default off.
8. **Gates on GitHub Free, public repository** (founder, 15 Oct).
   - The `build` and `metadata` jobs of `release-ios.yml` run in the environment `app-store`. The founder is its required reviewer, and its deployment rules allow only tags `ios-v*` and branches `release/*`. Each RC build and each metadata push waits for the founder's approval in GitHub.
   - `EXPO_TOKEN` (for the store lane) and `ASC_REVIEW_CONTACT_JSON` are environment secrets of `app-store`, not repository secrets. A run on any other ref never receives them.
   - A tag ruleset on `ios-v*` and a branch ruleset on `release/*` restrict creation, update and deletion, with only repository admins (the founder) able to bypass. The coordinator pushes tags and cuts the branch from a founder-credential session; the harness App cannot.
   - The App Store Connect API key and signing credentials stay in EAS credentials. The founder sets all of this up in FT-20. Until then the workflow still runs, and the gate is the written rule alone.

   **Proposed amendment (17 Oct, not decided).** Agent sessions act through the founder's account, so the founder's own approval and an admin bypass on a ruleset do not tell an agent from the founder. The proposal: the approver account (a second account only the founder holds) is the only required reviewer of `app-store`, with prevent self-review on and admin bypass off; rulesets have no bypass and only keep `ios-v*`, `db-v*` and `release/*` immutable, and do not restrict who creates a tag, because every session uses the same account, so the approval is the control. The `app-store` environment exists with its rules before `release-ios.yml` merges, because a run that names a missing environment creates it with no protection. `scripts/release/github-settings.ts` (on #236) applies and reads back these settings (FT-20). Sources: ADR 0026 decision 1 (Proposed); SR-3, SR-11 and section 5 of `docs/security/SECRETS_REVIEW.md` (on #206). This takes effect when the founder accepts ADR 0026 decision 1. Until then decision 8 above stands.
9. **Over-the-air updates are not in v1.0** (changes the 3 Oct recommendation; approved 13 Oct, D-091). On 3 Oct OTA looked cheap insurance. Since then v1.0 became on-device only (PR #54), the store submission plans "Data Not Collected" (D-088), and submission is three weeks away. `expo-updates` would add a network call on every launch (a new data-map destination whose privacy-label answer counsel would need to confirm) and a policy to review in that window. Fixes ship as PATCH builds, with expedited review for an S0. Revisit for v1.1 with sign-in.
10. **After launch:** a two-week train, phased release on every update, release notes per version in `packages/content`.

## Alternatives considered

| Option | Why not |
|---|---|
| Release from `main` with tags only | Freezes `main` for review and the buffer weeks. |
| Freeze on `develop`, tag `main`, no release branch for v1.0 (qa-e2e's train, wave 2026-10-13) | Simpler, and the train is otherwise adopted as the runbook. But v1.0.1 work and the fix waves keep landing on `develop` through review (2 to 16 Nov), so the submitted code would have to be protected by freezing everyone. One branch cut at freeze costs the coordinator one command. |
| One lane (production record for C0 and C1 too) | Workable, but undoes the preview lane already built and checked by its own preflight; a second record costs nothing. |
| Build on every push to `release/*` | Spends free builds on cherry-pick bursts; breaks "builds only from tags". |
| Repository secrets and a written rule only (the 3 Oct design) | Any workflow run on any branch a writer pushes can read repository secrets, and agents push branches. Environments and rulesets cost nothing on a public repository. |
| EAS Workflows, fastlane | A second pipeline outside our checks; a Ruby toolchain for a once-per-release upload. |
| OTA in v1.0 | See decision 9. |

## Consequences

- Coordinator per release: cut the branch, cherry-pick, push RC tags, push the release tag. Founder: create the production App Store Connect record, approve each RC build and metadata push in the `app-store` environment, run the metadata job, upload screenshots, FT-39, submit, release.
- About 4 production builds in the freeze window plus one preview build per RC and the preview builds before it; within EAS Free (15 iOS builds a month, shared by both lanes) if preview builds stay under about 7 in the month of the freeze. EAS Free also queues builds at low priority, with one concurrent build and a 45-minute timeout (expo.dev/pricing, read 15 Oct). If queue time ever holds up an RC, that is a second trigger to move to Starter (D-092).
- Two TestFlight records for v1.0. After launch the preview record stays for internal builds.
- Android adds `android-v*` tags, a Play service account secret and the 14-day closed test for personal accounts.

## Sources (opened 3 Oct 2026)

- https://docs.expo.dev/build-reference/app-versions/ ; https://docs.expo.dev/eas/metadata/ ; https://docs.expo.dev/eas/metadata/schema/ ; https://docs.expo.dev/submit/ios/ ; https://expo.dev/pricing
- https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information/ ; https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases/ ; https://developer.apple.com/app-store/review/guidelines/
- https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments ; https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets (both read for decision 8 by the red-team review, 15 Oct)
- https://support.google.com/googleplay/android-developer/answer/14151465
