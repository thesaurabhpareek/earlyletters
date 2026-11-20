# Memory: Analytics Engineer (analytics)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet.

## Current focus
- (20 Nov) No Build 13 row is yours; BL-856 (Memory Library) and BL-895 (first-run stories, blocked) wait.
- Older rows that sat here were seeded on 3 Oct and not re-checked; confirm a row's status by id before taking it.

## New scope (20 Nov 2026)
Decisions and facts that bind Build 13 work; re-check each against `develop` before you act on it.
- The new-scope pack is on `develop` at 697233d3 (#829): `docs/product/VISION.md`, `docs/product/prd/` 00 to 15 (cards NS-01 to NS-37), plan 13, test plan 14, the rank (`docs/roadmap/next/20-final-stack-rank-and-sizing-19nov.md`), rows BL-923 to BL-949; rows from wave 2 on wait under a founder hold until the founder approves the requirements, and Karma releases them by one status-change PR (`docs/product/prd/13-engineering-plan.md` section 6) (verified 2026-11-20).
- No autonomous lane runs: `agents.yml` is `disabled_manually` with 0 runs (Actions API) and every run is an interactive Claude session using the charter as a subagent (`docs/agents/HARNESS.md` lines 11 and 17); `AGENTS_ENABLED` not verified (verified 2026-11-20).
- Opt-in analytics is off through 1.0 (D-124; `docs/product/prd/README.md` ground rules) (verified 2026-11-20).
- `capture_started` is sent only by `startCapture`, with `source: 'tonight'`, never the control (`apps/mobile/src/lib/capture/start-capture.ts:7-8, 28-30`); the catalog's capture area has eight events (`packages/analytics/src/catalog.ts:444-528`) (verified 2026-11-20).
- BL-931 is the nine-PR photo stack: #834 (merged), #841, #842, #835 to #840 (verified 2026-11-20).
- The picker is Apple's `PHPickerViewController` in our `scribe-photo` module, never `expo-image-picker`, which calls `AVCaptureDevice.requestAccess` and `PHPhotoLibrary.requestAuthorization` in every build; with no purpose strings App Store processing can return ITMS-90683 (CR-65, pending) (verified 2026-11-20).
- A counted review has line 1 `## Review A|B at <40-hex head sha>: PASS`, or `: PASS WITH NOTES` with `Must fix: none` in the body; CHANGES, FAIL and BLOCKED do not count (CR-63). Karma merges (D-132); `review-gate` skill (verified 2026-11-20).

## Facts about this codebase (with paths)
- `packages/analytics/**` (catalog, schema, validation, consent, PostHog client).
- `docs/analytics/**`, except `docs/analytics/decision-science/**` (`decision-science`).
- Base branch is `develop`; `main` is releasable. CI: `.github/workflows/ci.yml` (`required` job) and the migration guard.

## Decisions and constraints I must respect
- The constitution: the machine may remove and repair, never add meaning (`CLAUDE.md`).
- No entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`, LEGAL-REQ-014).
- Fixtures use the fictional family "Asha" only.
- Opt-in PostHog plus server aggregates, content-free (BRIEF decision 12).

## Open threads
- None yet.

## Lessons
- None yet.
