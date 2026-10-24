---
chapter: 11
title: Release engineering
owner: principal-architect
reviewers: [security-architect, compliance-engineer]
status: adopted
last_reviewed: 2026-10-17
applies_to: scripts/release/github-settings.ts (GitHub settings), apps/mobile/version.json, apps/mobile/store.config.json, apps/mobile/eas.json, apps/mobile/app.config.ts (version, updates, runtimeVersion), packages/content/src/store*.ts, packages/content/src/release-notes*.ts, docs/release/<x.y.z>.md, docs/ops/RELEASE.md, scripts/release/**, .github/workflows/release*.yml, .eas/**
---

# 11. Release engineering

## Purpose

A family trusts the app with words they cannot say again. A release must never lose a letter, must reach people in small steps, and must be stoppable without waiting for App Review. This chapter covers branches, versions, builds, store metadata, OTA updates and the release gates. The decision record is ADR 0022 and the founder's per-release steps are in `docs/ops/RELEASE.md`. Kill switches and remote config are CODE-R19; old builds and contracts are API-R11 and API-R12; release health is OBS-R11.

## Principles

1. **Build once, promote the same binary.** What we tested is what we submit.
2. **The branch decides what is in the binary; remote config decides what is on.**
3. **Agents prepare, CI executes, the founder approves.** No agent holds a store or build credential, and approvals come from an account no agent can use (ADR 0026 decision 1).
4. **Every release has one record** a person can read in two minutes.
5. **Small steps out, fast way back.** Phased release and kill switches; OTA updates only after v1.0 (D-091).

## Rules

### Branches and versions

**REL-R01 (MUST)** A release is cut as `release/<major>.<minor>` from `main` at feature freeze. It takes only fixes, each first merged to `develop` and then cherry-picked (upstream first) by the coordinator; a fix for code that exists only on the release branch says so in its PR. *Why:* the release branch must not move under testing; `develop` must not lose the fix. *Enforced by:* a branch ruleset on `release/*` with no bypass that blocks force pushes and deletion (founder setup, FT-20, REL-R19; REL-G3). Who may push is process (the coordinator, COORDINATION section 1): every session uses the owner account, so no setting can tell them apart (SECURITY SR-3). The cut also needs `main` and `develop` on one lineage first (ADR 0022, 17 Oct amendment; ADR 0026 decision 4).

**REL-R02 (MUST)** The marketing version lives only in `apps/mobile/version.json`, is read by `app.config.ts`, and is shared by iOS and Android. MINOR is bumped on `develop` before the release PR that leads to a cut, PATCH for each fix release on that branch, MAJOR only by founder decision. *Why:* one source, no drift between platforms. *Enforced by:* not yet (REL-G1).

**REL-R03 (MUST NOT)** Nobody sets an iOS build number or Android versionCode by hand. EAS remote versioning with `autoIncrement` owns them (`appVersionSource: "remote"`). *Why:* App Store Connect rejects a reused build number; two humans or agents bumping by hand collide. *Enforced by:* `eas.json` review; not yet a check (REL-G1).

**REL-R04 (MUST NOT)** A published tag never moves, and a tag points at the commit of the exact build that was released. *Why:* what Apple reviewed and what we tagged must be the same code. *Enforced by:* a tag ruleset on `ios-v*` and `db-v*` restricting updates and deletions, with no bypass (founder setup, FT-20, REL-R19; REL-G3); `release-ios.yml` refuses a release tag without an RC tag on the same commit. The build number is recorded in the release record, never in the tag (REL-R03).

### Builds and promotion

**REL-R05 (MUST)** Store builds come only from `.github/workflows/release-ios.yml` on an `ios-v<x.y.z>-rc.<n>` tag pushed by the coordinator on `release/*`, using the `production` profile. Preview-lane builds (`testflight` profile, `.preview` record) are for testers and are never submitted. No agent-run store build. A manual store build is an exception: only when the workflow cannot run, with the founder's written approval and the reason recorded in the release record (`docs/ops/RELEASE.md` 3.4). *Why:* every store binary must be traceable to a commit and a green gate (COORDINATION section 6). *Enforced by:* the workflow checks tag, `version.json` and branch agree (BL-437); the `app-store` environment holds the only store-lane token.

**REL-R06 (MUST)** The build submitted for review is the release candidate that ran in the production record's TestFlight and passed the RC device checks (FT-39), identified by build number in the release record. After the freeze, C1 preview builds are made from the RC tag, so families test the RC's commit (ADR 0022 decision 5). *Why:* build once, promote the same binary (TDD 07 9.1 G3, G4). *Enforced by:* release record review (founder).

**REL-R07 (MUST)** A store build fails its gate when any of these fail: the `required` checks; download size over 40 MB; a placeholder value (`example.com`, scaffold scheme, scaffold icon); a missing privacy manifest entry; an `EXPO_PUBLIC_E2E` handler reachable; release notes missing for a version after the first. The full G2 to G4 lists are TDD 07 9.1; this rule is the automated subset. *Why:* each is a known rejection or a known incident (TDD 07 10.1, TDD 10 risk 4). *Enforced by:* partly: `release-ios.yml` checks (BL-437); size, privacy manifest and E2E-handler checks not yet.

### Store metadata

**REL-R08 (MUST)** All store text (name, subtitle, description, keywords, promotional text, What's New, review notes, URLs, category) lives in `packages/content` and is generated into `apps/mobile/store.config.json`. Nobody edits listing text only in App Store Connect. *Why:* voice rules and claims checks apply to store copy (PRIV-R17); the repo is the record. *Enforced by:* content rules test; not yet the generator (BL-436).

**REL-R09 (MUST)** Store text is checked against Apple's limits (name and subtitle 30 characters, promotional text 170, description and What's New 4,000, keywords 100 bytes) and contains no beta wording (D-060, guideline 2.2). *Why:* the upload fails or the review rejects. *Enforced by:* the content rules test on develop.

**REL-R10 (MUST)** Every version after the first (App Store Connect has no What's New for a first version) has customer release notes, keyed by version in `packages/content`, written for families (what changed for them, never internal ids), and, whenever the app offers sign-in, the review notes carry a working demo account (guideline 2.1; v1.0 has no sign-in, so none). *Why:* customers read What's New; reviewers cannot test sign-in without an account. *Enforced by:* not yet (BL-436).

**REL-R11 (SHOULD)** Screenshots use only the fictional Asha family, meet the 6.9 inch size (1320 x 2868 portrait or another accepted size, PNG or JPEG, no alpha, 1 to 10), and are listed with the screens they show (in the release record until BL-438 adds a list file). The release record has a screenshots current or stale line, checked by hand until there is a two-week train. *Why:* privacy rules; stale screenshots misrepresent the app (guideline 2.3). *Enforced by:* not yet (BL-438).

### Features, OTA and rollback

**REL-R12 (SHOULD)** Each release has `docs/release/<version>.md`: version and build numbers, what is in it (PRs), remote-config keys and their state, migrations it needs in production first, customer notes, known issues, gate evidence links, and the rollback plan. *Why:* one place to decide go, stop or roll back. *Enforced by:* not yet (BL-438).

**REL-R13 (MUST)** Unfinished work on a release branch is reverted or ships dark with its bundled default off in the signed config document (D-066, D-068). A feature never depends on a remote value being reachable to stay off. *Why:* config may not load; the default is what users get. *Enforced by:* review; CODE-R19.

**REL-R14 (MUST)** When `expo-updates` is in a build (not in v1.0, D-091), an OTA update follows TDD 01 3.10: JS, asset and copy fixes only, never new collection, destinations, SDKs, permissions, pricing text or features (guideline 2.5.2); it applies on the next cold start; it passes the same gates as a binary and needs founder approval; after launch it starts at 10 percent or less. *Why:* DPLA 3.3.1(B) allows interpreted code only within the app's purpose; privacy labels must stay true. *Enforced by:* review until `expo-updates` exists; the OTA job is added with it.

**REL-R15 (MUST)** Migrations a release needs reach production (D-041; `deploy-db.yml`, merged in PR #36, deploys production on a `db-v*` tag) before the binary is released, and are expand-only until the oldest supported build no longer needs the old shape (API-R11; `minSupportedVersion` in the signed config, not yet enforced by the app). *Why:* builds in the field cannot be recalled. *Enforced by:* release record review; DB-R09.

**REL-R16 (MUST)** Phased release is on for every App Store update (Apple offers it only for updates; v1.0 is released manually; kill switches work only when the build carries the signing key, FT-16). It is paused on any S0, or when crash-free sessions fall below 99.8 percent or crash-free users below 99.5 percent (TDD 07 9.1 G5). *Why:* 7 days of 1 to 50 percent exposure is our only binary brake. *Enforced by:* founder in App Store Connect; health report (OBS-R11).

### Credentials and pipelines

**REL-R17 (MUST)** The store-lane `EXPO_TOKEN` and the review contact (`ASC_REVIEW_CONTACT_JSON`) are environment secrets of the GitHub environment `app-store` (the approver account as the only reviewer, REL-R20; only `ios-v*` tags and `release/*` branches), used only by `release-ios.yml`. The App Store Connect API key lives in EAS credentials; the Play service account (later) the same way. No agent, charter, brief or memory file holds or prints their values; naming them in a workflow or script is fine. *Why:* SEC-R04; principle 16; repository secrets reach a workflow run on any branch a writer pushes. *Enforced by:* the environment (founder setup, FT-20; REL-G3); gitleaks; review of `.github/**`.

**REL-R18 (MUST NOT)** No pipeline outside `.github/workflows/` builds, submits or publishes the app. `.eas/**` stays absent unless an ADR changes this, and is fenced like `.github/**`. *Why:* one gate system. *Enforced by:* not yet: fence path (REL-G2).

**REL-R19 (MUST)** The GitHub settings the pipeline relies on (environments and their reviewers and refs, branch protection on `develop` and `main`, release rulesets) are defined in `scripts/release/github-settings.ts`. They change only through a PR to that file, then the founder's `--apply`, and `--verify` passes after every change. *Why:* a setting nobody can read back is not a control, and the owner account in every agent session can change settings (SECURITY SR-5). *Enforced by:* the script's tests and the founder's read-back (pending PR #236); the scheduled drift job later (RA-20-12).

**REL-R20 (MUST)** Every environment that holds a store, TestFlight-tester, database or packs credential has the approver account as its only required reviewer, with prevent self-review on and administrator bypass off, and is created with its rules before any workflow names it or any secret is added. Agent sessions never approve a deployment, change a setting, or add a secret or variable. *Why:* agent sessions act as the founder's account, so an approval by that account proves nothing; a workflow that names a missing environment creates it unprotected (SECURITY SR-11). *Enforced by:* the environment rules once AF-02 is done (founder setup); written rule until then.

**REL-R21 (MUST NOT)** A build with server features on reaches nobody outside the founder's family (internal groups "Founder" and "Family") before the R-17 security sign-off is recorded in `docs/DECISIONS.md`. *Why:* D-100's gate; friends would sign in to a server the security review has not passed. *Enforced by:* by hand in App Store Connect during the alpha, with automatic distribution off (ADR 0026 decision 6); the `testers` environment's `R17_PASSED` check later (RA-20-07).

**REL-R22 (MUST)** The store listing promises only what the submitted build switches on: no sharing, invite or co-parent claim while its production profile has server features off. *Why:* guideline 2.3.1; a listing that describes a feature the build hides is rejected or misleads families. *Enforced by:* `store-config.ts --assert-shippable`, run by the metadata job before every push (BL-436 and BL-437 branches).

## How to apply it

The lanes at a glance (ADR 0022 decision 1, D-106, ADR 0026 decision 6):

| Lane | Profile and record | Started by | Approved by | Who can install it |
|---|---|---|---|---|
| Preview, servers off | `testflight`, `.preview` | `testflight.yml` dispatch on `develop`, or the founder's computer | approver (`testflight`), until AF-21 | internal groups; "Friends" after Beta App Review |
| Preview, servers on (alpha) | `preview`, `.preview`, against staging | the same | the same | "Founder" and "Family" only, until REL-R21 allows "Friends" |
| Store | `production`, `com.earlyletters.scribe` | an `ios-v<x.y.z>-rc.<n>` tag on `release/*` | approver (`app-store`) | the production record's internal group, then App Review |

- **A preview-lane build (the alpha, C0, C1).** Follow `docs/release/TESTFLIGHT.md` and `docs/release/AUTOMATION.md` 2.3. Profiles `testflight` (servers off) and `preview` (servers on, against staging, D-106). Add the build to groups by hand with automatic distribution off; "Friends" only after REL-R21 allows it.
- **Before the first secret, or after any settings change.** The founder runs `npx tsx scripts/release/github-settings.ts --approver <login> --verify` from their own computer and fixes any drift line before going on (REL-R19). An agent that sees a settings problem reports it; it never fixes it in Settings.
- **Cutting a release and shipping a hotfix.** Follow `docs/ops/RELEASE.md`. Before the first cut, `main` and `develop` must share one lineage (RA-20-01).
- **A change to store text.** Edit `packages/content/src/store.en.ts`, regenerate `apps/mobile/store.config.json` in the same PR, and run `--assert-shippable` (REL-R08, REL-R22). The PR says which build the text is for.
- A PR that needs to reach a release branch: merge to `develop` first and label it `release:<major>.<minor>`; the `release` agent lists it in the release record and the coordinator cherry-picks (agents may only base PRs on `develop` today).
- A PR that changes a screen shown in a store screenshot: say so in the PR body; the release record's screenshot list (REL-R11) picks it up.

- **A new workflow that needs a secret.** Add its environment to `github-settings.ts` in its own PR first; the founder applies and verifies it; only then does the workflow PR that names it merge, and only then is the secret added (REL-R19, REL-R20).
- **After a release.** Push `ios-v<x.y.z>` on the released RC's commit, set the record's status line to released, and start the day 1, 3 and 7 health report (REL-R16, BL-439).
- **Tags under prevent self-review.** The approver never pushes an RC or `db-v*` tag: a user who starts a deployment cannot approve it (SECURITY SR-3). The coordinator pushes; the approver checks the ref, the commit and `.github/` before approving (SECRETS_REVIEW section 5).

## Exceptions

- A settings change during an incident (for example removing a leaked secret or turning an environment's reviewer back on) may be made in Settings first; the PR to `github-settings.ts` and a passing `--verify` follow the same day (REL-R19).
- A fix for code that exists only on the release branch goes to the release branch directly, in a PR the coordinator opens; the PR says why.
- An S0 hotfix may skip the C1 soak with founder approval recorded in the release record; it never skips C0 and the required checks.

## Open questions

- Lineage: when `main` is merged into `develop` (RA-20-01, after the alpha), and whether the website then moves to its own repository so `main` holds only released app code. Decide before the first `release/*` cut.
- The approver account and agents: once agents stop holding the owner credential (AF-27), REL-R01 and REL-R04 can gain real "who may create" rules. Revisit then.
- Android: Play closed-test plan (12 testers for 14 days on a personal account) and whether to use Play staged rollouts at 10 percent steps. Decide before BL-311.
- Build-aware flags: config keys (D-066, D-068) are not build-aware today. Recommendation: an optional `min_build` per key in the signed config document, so a flag can turn on only for builds that contain the feature. Decide before the first post-launch train.

## References

- ADR 0022; ADR 0026 (proposed); `docs/release/AUTOMATION.md`; `docs/security/SECRETS_REVIEW.md` (PR #206); TDD 01 3.9 and 3.10; TDD 07 9.1, 10.1, 11; TDD 10 section 3; D-041, D-045, D-060, D-066, D-068, D-089 to D-092, D-100, D-106, D-107.
- Where the cited files are on 17 Oct 2026: ADR 0022, D-089 to D-092, `docs/release/1.0.0.md` (#108) and `docs/ops/RELEASE.md` (#111) are on `develop`. Still open: `apps/mobile/version.json`, `apps/mobile/store.config.json` and `scripts/release/store-config.ts` in PR #109 (BL-436); `.github/workflows/release-ios.yml` in PR #110 (BL-437); `scripts/release/github-settings.ts` in PR #236; the D-100 amendments in PR #227. This chapter should merge after #109 and #110.
- Expo app versions, runtime versions, rollouts, EAS Metadata, EAS Submit (docs.expo.dev, opened 3 Oct 2026).
- Apple text limits, screenshot specifications, phased release, App Review Guidelines 2.1, 2.2, 2.3, 2.5.2, DPLA 3.3.1(B) (developer.apple.com, opened 3 Oct 2026).
