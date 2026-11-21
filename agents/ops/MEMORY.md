# Memory: Release and Operations Engineer (ops)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet.

## Current focus
- (20 Nov) My backlog owner name is `platform` (`agents/roster.json`); ready rows include BL-864 (plist and preflight lint) and BL-897. Release tooling and CI are mine for Build 13 (`13-engineering-plan.md` section 2).

## New scope (20 Nov 2026)
Decisions and facts that bind Build 13 work; re-check each against `develop` before you act on it.
- The new-scope pack is on `develop` at 697233d3 (#829): `docs/product/VISION.md`, `docs/product/prd/` 00 to 15 (cards NS-01 to NS-37), plan 13, test plan 14, the rank (`docs/roadmap/next/20-final-stack-rank-and-sizing-19nov.md`), rows BL-923 to BL-949; rows from wave 2 on wait under a founder hold until the founder approves the requirements, and Karma releases them by one status-change PR (`docs/product/prd/13-engineering-plan.md` section 6) (verified 2026-11-20).
- No autonomous lane runs: `agents.yml` is `disabled_manually` with 0 runs (Actions API) and every run is an interactive Claude session using the charter as a subagent (`docs/agents/HARNESS.md` lines 11 and 17); `AGENTS_ENABLED` not verified (verified 2026-11-20).
- BL-931 is the nine-PR photo stack: #834 (merged), #841 (merged, 1513b265), #842, #835 to #840 (verified 2026-11-20).
- The picker is Apple's `PHPickerViewController` in our `scribe-photo` module, never `expo-image-picker`, which calls `AVCaptureDevice.requestAccess` and `PHPhotoLibrary.requestAuthorization` in every build; with no purpose strings App Store processing can return ITMS-90683 (CR-65 (#852); #833 comment 7026600796) (verified 2026-11-20).
- Local migration 11 (`entry_media`) ships unconditionally, outside `EXPO_PUBLIC_PHOTOS`: gating only the CREATE would leave a phone whose first version-11 build had the switch off without the table, so every eraser and Keep would need guards and a second create; ADR 0028 D1 and CR-62 ship it with photos; NS-01-R19 keeps the data rights working with the switch off (CR-64 (#852)) (verified 2026-11-20).
- The default branch is `develop` (repos API), not `main` as the 28 Oct box in `docs/agents/HARNESS.md` says (verified 2026-11-20).
- A counted review has line 1 `## Review A|B at <40-hex head sha>: PASS`, or `: PASS WITH NOTES` with `Must fix: none` in the body; CHANGES, FAIL and BLOCKED do not count (CR-63). Karma merges (D-132); `review-gate` skill (verified 2026-11-20).

## Facts about this codebase (with paths)
- `docs/ops/**`, including `docs/ops/proposed/` for workflow changes the founder applies (the Claude GitHub App cannot edit `.github/workflows/`).
- `scripts/**`, except `scripts/agents/**` and `scripts/trace.mjs`.
- `.github/README.md` documentation.
- Base branch is `develop`; `main` is releasable. CI: `.github/workflows/ci.yml` (`required` job) and the migration guard.

## Decisions and constraints I must respect
- The constitution: the machine may remove and repair, never add meaning (`CLAUDE.md`).
- No entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`, LEGAL-REQ-014).
- Fixtures use the fictional family "Asha" only.
- The Claude GitHub App cannot edit workflows; propose patches in `docs/ops/proposed/`.

## Open threads
- None yet.

## Lessons
- None yet.
