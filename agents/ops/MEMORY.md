# Memory: Release and Operations Engineer (ops)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet.

## Current focus
- (20 Nov) My backlog owner name is `platform` (`agents/roster.json`); ready rows include BL-864 (plist and preflight lint) and BL-897. Release tooling and CI are mine for Build 13 (`13-engineering-plan.md` section 2).

## New scope (20 Nov 2026)
Decisions and facts that bind Build 13 work; re-check each against `develop` before you act on it.
- The new-scope pack is on `develop` at 697233d3 (#829): `docs/product/VISION.md`, `docs/product/prd/` 00 to 15 (cards NS-01 to NS-37), plan 13, test plan 14, the rank (`docs/roadmap/next/20-final-stack-rank-and-sizing-19nov.md`), rows BL-923 to BL-949; #843 (open) releases the rows held for the founder's approval (verified 2026-11-20).
- No autonomous lane runs: `agents.yml` is `disabled_manually` with 0 runs (Actions API) and every run is an interactive Claude session using the charter as a subagent (`docs/agents/HARNESS.md` line 11); `AGENTS_ENABLED` not verified (verified 2026-11-20).
- BL-931 is the nine-PR photo stack: #834 (merged as 76a4a5d7), #841, #842, #835 to #840 (open); #833 closed. The picker is Apple's `PHPickerViewController` in our `scribe-photo` module, never `expo-image-picker`, which calls `AVCaptureDevice.requestAccess` and `PHPhotoLibrary.requestAuthorization` in every build; with no purpose strings App Store processing can return ITMS-90683 (Karma's ruling of 20 Nov on #833) (verified 2026-11-20).
- Local migration 11 (`entry_media`) ships unconditionally, outside `EXPO_PUBLIC_PHOTOS`: gating it would stop a phone that moves from a switched-on build to a switched-off one (Karma's ruling in #835's body; #835 open) (verified 2026-11-20).
- The default branch is `develop` (repos API), not `main` as the 28 Oct box in `docs/agents/HARNESS.md` says (verified 2026-11-20).
- A review counts toward a merge only if its line 1 is `## Review A|B at <40-hex head sha>: PASS` or `: PASS WITH NOTES`; CHANGES, FAIL and BLOCKED do not count (Karma's ruling of 20 Nov 2026, to be recorded as a CR). Karma merges (D-132). `scripts/agents/merge-queue.mjs:72` counts only `PASS` until his fix merges; `review-gate` skill (verified 2026-11-20).

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
