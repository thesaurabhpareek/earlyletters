# Memory: Release Engineer (release)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 and refreshed 15 Oct from ADR 0022, the release fact check and the red-team review. Nothing below comes from a run yet.

## Current focus
- D-089 to D-092 recorded 13 Oct 2026 (D-091, no OTA in v1.0, approved 13 Oct). BL-436 (version.json, store.config.json) in review; BL-437 (release-ios.yml) is the coordinator's and founder's, in review; BL-438 keeps `docs/release/1.0.0.md` current twice a week until release.
- v1.0 calendar (ROADMAP section 2): C0 14 Oct, C1 19 to 29 Oct (preview lane), freeze and `release/1.0` Mon 26 Oct, submit Mon 2 Nov. On 15 Oct no build had run on a phone yet, so these move day for day until FT-01, FT-16 and FT-17 are done. PRD V2 (#124, #128) proposes server features in v1.0 and a May 2027 date; check `docs/DECISIONS.md` for which v1.0 stands before planning.

## Facts about this codebase (with paths)
- Version: `apps/mobile/version.json` (1.0.0), read by `app.config.ts` (BL-436). Store text: `packages/content/src/store.en.ts`; `scripts/release/store-config.ts` writes `apps/mobile/store.config.json`.
- My PRs base on `develop` only; cherry-picks into `release/*` are the coordinator's. No What's New and no phased release for the first version (Apple).
- `apps/mobile/eas.json`: `appVersionSource: "remote"`, `production.autoIncrement: true`; `submit.production` empty until the production App Store Connect record exists.
- Builds only from tags: `ios-v<x.y.z>-rc.<n>` builds, `ios-v<x.y.z>` releases (`.github/workflows/release-ios.yml`).
- Bundle id comes from `packages/brand` (`publisher.domain`); it is permanent after the first App Store Connect upload.
- No `expo-updates` in the code and no crash SDK (D-091: no OTA in v1.0); v1.0 is on-device only (PR #54). Two lanes: preview (`testflight` profile, `.preview` record, `docs/release/TESTFLIGHT.md`) and store (`production`, RC tags).

## Decisions and constraints I must respect
- ADR 0022 (accepted): `release/<major>.<minor>` from `main`; build once, promote; Actions orchestrates, EAS builds; no EAS Workflows. The repo is public on GitHub Free, so the gate is the `app-store` environment (founder as required reviewer, store secrets) plus rulesets on `ios-v*` tags and `release/*` branches (decision 8, amended 15 Oct; FT-20).
- D-060: no beta wording in the store listing. D-041: migrations to prod only from CI on a tag (`deploy-db.yml`, merged in PR #36, deploys on `db-v*`). D-045: C0 then C1 before submission.
- Apple facts (opened 3 Oct 2026): name and subtitle 30 chars, promo 170, description and What's New 4,000, keywords 100 bytes; 6.9 inch screenshots required (1320 x 2868 and others), 1 to 10, no alpha; phased release 1, 2, 5, 10, 20, 50, 100 percent over 7 days, 30 days pause total.
- Expo facts (opened 3 Oct 2026): `eas submit` does not submit for review; submit `groups` are internal TestFlight groups only; EAS Metadata is beta, App Store only, no screenshots; Free plan has 15 iOS builds a month.

## Open threads
- Founder confirms export compliance (`usesNonExemptEncryption: false`) at first upload.
- One runbook, mine since D-090: `docs/ops/RELEASE.md` (qa-e2e's train, amended for D-089). Check open branches and `docs/agents/BOARD.md` claims before editing shared files; the coordinator's wave branches append to BOARD.md too.

## Lessons
- None yet.
