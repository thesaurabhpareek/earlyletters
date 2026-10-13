---
chapter: 11
title: Release engineering
owner: principal-architect
reviewers: [security-architect, compliance-engineer]
status: adopted
last_reviewed: 2026-10-03
applies_to: apps/mobile/version.json, apps/mobile/store.config.json, apps/mobile/eas.json, apps/mobile/app.config.ts (version, updates, runtimeVersion), packages/content/src/store*.ts, packages/content/src/release-notes*.ts, docs/release/<x.y.z>.md, docs/release/RELEASE.md, scripts/release/**, .github/workflows/release*.yml, .eas/**
---

# 11. Release engineering

## Purpose

A family trusts the app with words they cannot say again. A release must never lose a letter, must reach people in small steps, and must be stoppable without waiting for App Review. This chapter covers branches, versions, builds, store metadata, OTA updates and the release gates. The decision record is ADR 0022 and the founder's per-release steps are in `docs/release/RELEASE.md`. Kill switches and remote config are CODE-R19; old builds and contracts are API-R11 and API-R12; release health is OBS-R11.

## Principles

1. **Build once, promote the same binary.** What we tested is what we submit.
2. **The branch decides what is in the binary; remote config decides what is on.**
3. **Agents prepare, CI executes, the founder approves.** No agent holds a store or build credential.
4. **Every release has one record** a person can read in two minutes.
5. **Small steps out, fast way back.** Phased release and kill switches; OTA updates only after v1.0 (D-091).

## Rules

### Branches and versions

**REL-R01 (MUST)** A release is cut as `release/<major>.<minor>` from `main` at feature freeze. It takes only fixes, each first merged to `develop` and then cherry-picked (upstream first) by the coordinator; a fix for code that exists only on the release branch says so in its PR. *Why:* the release branch must not move under testing; `develop` must not lose the fix. *Enforced by:* process (only the coordinator pushes, COORDINATION section 1) while the repo is private on GitHub Free; branch protection when the plan allows it (REL-G3).

**REL-R02 (MUST)** The marketing version lives only in `apps/mobile/version.json`, is read by `app.config.ts`, and is shared by iOS and Android. MINOR moves when a release branch is cut, PATCH for each fix release from that branch, MAJOR only by founder decision. *Why:* one source, no drift between platforms. *Enforced by:* not yet (REL-G1).

**REL-R03 (MUST NOT)** Nobody sets an iOS build number or Android versionCode by hand. EAS remote versioning with `autoIncrement` owns them (`appVersionSource: "remote"`). *Why:* App Store Connect rejects a reused build number; two humans or agents bumping by hand collide. *Enforced by:* `eas.json` review; not yet a check (REL-G1).

**REL-R04 (MUST NOT)** A published tag never moves, and a tag points at the commit of the exact build that was released. *Why:* what Apple reviewed and what we tagged must be the same code. *Enforced by:* the tag workflow takes the build number as input; tag protection (founder setup).

### Builds and promotion

**REL-R05 (MUST)** Store builds come only from `.github/workflows/release-ios.yml` on an `ios-v<x.y.z>-rc.<n>` tag pushed by the coordinator on `release/*`, using the `production` profile. Preview-lane builds (`testflight` profile, `.preview` record) are for testers and are never submitted. No local, manual or agent-run store build. *Why:* every store binary must be traceable to a commit and a green gate (COORDINATION section 6). *Enforced by:* the workflow checks tag, `version.json` and branch agree (BL-371).

**REL-R06 (MUST)** The build submitted for review is the release candidate that ran in the production record's TestFlight and passed the RC device checks (FT-39), identified by build number in the release record. At v1.0, C1 families test preview-lane builds of the same code. *Why:* build once, promote the same binary (TDD 07 9.1 G3, G4). *Enforced by:* release record review (founder).

**REL-R07 (MUST)** A store build fails its gate when any of these fail: the `required` checks; download size over 40 MB; a placeholder value (`example.com`, scaffold scheme, scaffold icon); a missing privacy manifest entry; an `EXPO_PUBLIC_E2E` handler reachable; release notes missing for a version after the first. The full G2 to G4 lists are TDD 07 9.1; this rule is the automated subset. *Why:* each is a known rejection or a known incident (TDD 07 10.1, TDD 10 risk 4). *Enforced by:* partly: `release-ios.yml` checks (BL-371); size, privacy manifest and E2E-handler checks not yet.

### Store metadata

**REL-R08 (MUST)** All store text (name, subtitle, description, keywords, promotional text, What's New, review notes, URLs, category) lives in `packages/content` and is generated into `apps/mobile/store.config.json`. Nobody edits listing text only in App Store Connect. *Why:* voice rules and claims checks apply to store copy (PRIV-R17); the repo is the record. *Enforced by:* content rules test; not yet the generator (BL-370).

**REL-R09 (MUST)** Store text is checked against Apple's limits (name and subtitle 30 characters, promotional text 170, description and What's New 4,000, keywords 100 bytes) and contains no beta wording (D-030, guideline 2.2, pending founder OK). *Why:* the upload fails or the review rejects. *Enforced by:* not yet (BL-370).

**REL-R10 (MUST)** Every version after the first (App Store Connect has no What's New for a first version) has customer release notes, keyed by version in `packages/content`, written for families (what changed for them, never internal ids), and the review notes carry a working demo account (guideline 2.1). *Why:* customers read What's New; reviewers cannot test sign-in without an account. *Enforced by:* not yet (BL-370).

**REL-R11 (SHOULD)** Screenshots use only the fictional Asha family, meet the 6.9 inch size (1320 x 2868 portrait or another accepted size, PNG or JPEG, no alpha, 1 to 10), and are listed in `docs/store/screenshots.json` with the screens they show. The release record has a screenshots current or stale line, checked by hand until there is a two-week train. *Why:* privacy rules; stale screenshots misrepresent the app (guideline 2.3). *Enforced by:* not yet (BL-372).

### Features, OTA and rollback

**REL-R12 (SHOULD)** Each release has `docs/release/<version>.md`: version and build numbers, what is in it (PRs), remote-config keys and their state, migrations it needs in production first, customer notes, known issues, gate evidence links, and the rollback plan. *Why:* one place to decide go, stop or roll back. *Enforced by:* not yet (BL-372).

**REL-R13 (MUST)** Unfinished work on a release branch is reverted or ships dark with its bundled default off in the signed config document (D-066, D-068). A feature never depends on a remote value being reachable to stay off. *Why:* config may not load; the default is what users get. *Enforced by:* review; CODE-R19.

**REL-R14 (MUST)** There is no OTA update in v1.0 (D-091). When `expo-updates` is added, an OTA update follows TDD 01 3.10: JS, asset and copy fixes only, never new collection, destinations, SDKs, permissions, pricing text or features (guideline 2.5.2); it applies on the next cold start; it passes the same gates as a binary and needs founder approval; after launch it starts at 10 percent or less. *Why:* DPLA 3.3.1(B) allows interpreted code only within the app's purpose; privacy labels must stay true. *Enforced by:* nothing to enforce in v1.0; the OTA job is added with `expo-updates`.

**REL-R15 (MUST)** Migrations a release needs reach production (D-041; the `db-v*` tag proposed in PR #36, `deploy-db.yml`) before the binary is released, and are expand-only until the oldest supported build no longer needs the old shape (API-R11; `minSupportedVersion` in the signed config, not yet enforced by the app). *Why:* builds in the field cannot be recalled. *Enforced by:* release record review; DB-R09.

**REL-R16 (MUST)** Phased release is on for every App Store update (Apple offers it only for updates; v1.0 is released manually; kill switches work only when the build carries the signing key, FT-16). It is paused on any S0, or when crash-free sessions fall below 99.8 percent or crash-free users below 99.5 percent (TDD 07 9.1 G5). *Why:* 7 days of 1 to 50 percent exposure is our only binary brake. *Enforced by:* founder in App Store Connect; health report (OBS-R11).

### Credentials and pipelines

**REL-R17 (MUST)** `EXPO_TOKEN` and the review contact (`ASC_REVIEW_CONTACT_JSON`) are repository secrets used only by `release-ios.yml`; the App Store Connect API key lives in EAS credentials; the Play service account (later) the same way. They move to a GitHub Environment when the plan supports environment secrets on private repositories. No agent, charter, brief or memory file references their values. *Why:* SEC-R04; principle 16. *Enforced by:* gitleaks; review of `.github/**`.

**REL-R18 (MUST NOT)** No pipeline outside `.github/workflows/` builds, submits or publishes the app. `.eas/**` stays absent unless an ADR changes this, and is fenced like `.github/**`. *Why:* one gate system. *Enforced by:* not yet: fence path (REL-G2).

## How to apply it

- Cutting a release and shipping a hotfix: follow `docs/release/RELEASE.md`. Preview-lane builds: `docs/release/TESTFLIGHT.md`.
- A PR that needs to reach a release branch: merge to `develop` first and label it `release:<major>.<minor>`; the `release` agent lists it in the release record and the founder cherry-picks (agents may only base PRs on `develop` today).
- A PR that changes a screen listed in `docs/store/screenshots.json`: say so in the PR body; the release record picks it up.

## Exceptions

- A fix for code that exists only on the release branch goes to the release branch directly; the PR says why.
- An S0 hotfix may skip the C1 soak with founder approval recorded in the release record; it never skips C0 and the required checks.

## Open questions

- Android: Play closed-test plan (12 testers for 14 days on a personal account) and whether to use Play staged rollouts at 10 percent steps. Decide before BL-311.
- Build-aware flags: config keys (D-066, D-068) are not build-aware today. Recommendation: an optional `min_build` per key in the signed config document, so a flag can turn on only for builds that contain the feature. Decide before the first post-launch train.

## References

- ADR 0022; TDD 01 3.9 and 3.10; TDD 07 9.1, 10.1, 11; TDD 10 section 3; D-041, D-045, D-060, D-066, D-068, D-089 to D-092.
- Expo app versions, runtime versions, rollouts, EAS Metadata, EAS Submit (docs.expo.dev, opened 3 Oct 2026).
- Apple text limits, screenshot specifications, phased release, App Review Guidelines 2.1, 2.2, 2.3, 2.5.2, DPLA 3.3.1(B) (developer.apple.com, opened 3 Oct 2026).
