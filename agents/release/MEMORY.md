# Memory: Release Engineer (release)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 and refreshed 13 Oct from ADR 0022 and the release fact check. Nothing below comes from a run yet.

## Current focus
- D-089 to D-092 recorded 13 Oct 2026 (D-091, no OTA in v1.0, awaits founder OK). BL-370 (version.json, store.config.json) and BL-371 (release-ios.yml) in review; BL-372 keeps `docs/release/1.0.0.md` current twice a week until release.
- v1.0 calendar (ROADMAP 2.1): C0 14 Oct, C1 19 to 29 Oct (preview lane), freeze and `release/1.0` Mon 26 Oct, submit Mon 2 Nov.

## Facts about this codebase (with paths)
- Version: `apps/mobile/version.json` (1.0.0), read by `app.config.ts` (BL-370). Store text: `packages/content/src/store.en.ts`; `scripts/release/store-config.ts` writes `apps/mobile/store.config.json`.
- My PRs base on `develop` only; cherry-picks into `release/*` are the coordinator's. No What's New and no phased release for the first version (Apple).
- `apps/mobile/eas.json`: `appVersionSource: "remote"`, `production.autoIncrement: true`; `submit.production` empty until the production App Store Connect record exists.
- Builds only from tags: `ios-v<x.y.z>-rc.<n>` builds, `ios-v<x.y.z>` releases (`.github/workflows/release-ios.yml`).
- Bundle id comes from `packages/brand` (`publisher.domain`); it is permanent after the first App Store Connect upload.
- No `expo-updates` in the code and no crash SDK (D-091 proposes no OTA in v1.0, pending the founder's OK); v1.0 is on-device only (PR #54). Two lanes: preview (`testflight` profile, `.preview` record, `docs/release/TESTFLIGHT.md`) and store (`production`, RC tags).

## Decisions and constraints I must respect
- ADR 0022 (accepted): `release/<major>.<minor>` from `main`; build once, promote; Actions orchestrates, EAS builds; no EAS Workflows; private repo on GitHub Free, so no environments or required reviewers: tag pushes by the coordinator are the gate.
- D-060: no beta wording in the store listing. D-041: migrations to prod only from CI on a release tag (PR #36 proposes `db-v*`). D-045: C0 then C1 before submission.
- Apple facts (opened 3 Oct 2026): name and subtitle 30 chars, promo 170, description and What's New 4,000, keywords 100 bytes; 6.9 inch screenshots required (1320 x 2868 and others), 1 to 10, no alpha; phased release 1, 2, 5, 10, 20, 50, 100 percent over 7 days, 30 days pause total.
- Expo facts (opened 3 Oct 2026): `eas submit` does not submit for review; submit `groups` are internal TestFlight groups only; EAS Metadata is beta, App Store only, no screenshots; Free plan has 15 iOS builds a month.
- Submission Mon 11 Jan 2027; freeze week 10 (7 Dec 2026); C0 from week 6 (9 Nov 2026).

## Open threads
- Founder confirms export compliance (`usesNonExemptEncryption: false`) at first upload.

## Lessons
- None yet.
