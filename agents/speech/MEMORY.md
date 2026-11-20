# Memory: Speech and Applied Science Engineer (speech)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet.

## Current focus
- (20 Nov) No row in BL-923 to BL-949 is yours. NS-17 is wave 5, gated by a native reviewer and the founder; NS-29 read-along is L and needs word timings; word highlight in Read together was deferred to v1.1 (D-059).
- Older rows that sat here were seeded on 3 Oct and not re-checked; confirm a row's status by id before taking it.

## New scope (20 Nov 2026)
Decisions and facts that bind Build 13 work; re-check each against `develop` before you act on it.
- The new-scope pack is on `develop` at 697233d3 (#829): `docs/product/VISION.md`, `docs/product/prd/` 00 to 15 (cards NS-01 to NS-37), plan 13, test plan 14, the rank (`docs/roadmap/next/20-final-stack-rank-and-sizing-19nov.md`), rows BL-923 to BL-949; #843 (open) releases the rows held for the founder's approval (verified 2026-11-20).
- No autonomous lane runs: `agents.yml` is `disabled_manually` with 0 runs (Actions API) and every run is an interactive Claude session using the charter as a subagent (`docs/agents/HARNESS.md` line 11); `AGENTS_ENABLED` not verified (verified 2026-11-20).
- NS-17-R1, R2, R3 and R5 are P0: no word the parent did not say (`docs/product/prd/14-test-plan.md` section 7) (verified 2026-11-20).
- BL-931 is the nine-PR photo stack: #834 (merged as 76a4a5d7), #841, #842, #835 to #840 (open); #833 closed. The picker is Apple's `PHPickerViewController` in our `scribe-photo` module, never `expo-image-picker`, which calls `AVCaptureDevice.requestAccess` and `PHPhotoLibrary.requestAuthorization` in every build; with no purpose strings App Store processing can return ITMS-90683 (Karma's ruling of 20 Nov on #833) (verified 2026-11-20).
- A review counts toward a merge only if its line 1 is `## Review A|B at <40-hex head sha>: PASS` or `: PASS WITH NOTES`; CHANGES, FAIL and BLOCKED do not count (Karma's ruling of 20 Nov 2026, to be recorded as a CR). Karma merges (D-132). `scripts/agents/merge-queue.mjs:72` counts only `PASS` until his fix merges; `review-gate` skill (verified 2026-11-20).

## Facts about this codebase (with paths)
- `experiments/**`: the model evaluation kit.
- Language-pack format and transcription-pipeline code outside the constitution files.
- The constitution files `packages/core/src/verify.ts`, `meaning.ts`, `types.ts` and `pipeline.ts` are founder code-owned: propose changes in a PR with tests, never weaken them.
- Base branch is `develop`; `main` is releasable. CI: `.github/workflows/ci.yml` (`required` job) and the migration guard.

## Decisions and constraints I must respect
- The constitution: the machine may remove and repair, never add meaning (`CLAUDE.md`).
- No entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`, LEGAL-REQ-014).
- Fixtures use the fictional family "Asha" only.
- Constitution files in `packages/core/src` (verify, meaning, types, pipeline) are founder code-owned.
- Language packs are data, not code (BRIEF decision 15).

## Open threads
- None yet.

## Lessons
- None yet.
