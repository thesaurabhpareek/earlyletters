# Memory: Payments Engineer (StoreKit) (payments)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet.

## Current focus
- (20 Nov) No Build 13 row is yours; review NS-01-R18 and NS-13-R11 when their PRs open.
- Older rows that sat here were seeded on 3 Oct and not re-checked; confirm a row's status by id before taking it.

## New scope (20 Nov 2026)
Decisions and facts that bind Build 13 work; re-check each against `develop` before you act on it.
- The new-scope pack is on `develop` at 697233d3 (#829): `docs/product/VISION.md`, `docs/product/prd/` 00 to 15 (cards NS-01 to NS-37), plan 13, test plan 14, the rank (`docs/roadmap/next/20-final-stack-rank-and-sizing-19nov.md`), rows BL-923 to BL-949; #843 (open) releases the rows held for the founder's approval (verified 2026-11-20).
- No autonomous lane runs: `agents.yml` is `disabled_manually` with 0 runs (Actions API) and every run is an interactive Claude session using the charter as a subagent (`docs/agents/HARNESS.md` line 11); `AGENTS_ENABLED` not verified (verified 2026-11-20).
- One gate: Keep after the allowance of 2 (D-082); capture is never blocked; no "free forever" (`docs/product/prd/README.md` ground rules) (verified 2026-11-20).
- BL-931 is the nine-PR photo stack: #834 (merged as 76a4a5d7), #841, #842, #835 to #840 (open); #833 closed. The picker is Apple's `PHPickerViewController` in our `scribe-photo` module, never `expo-image-picker`, which calls `AVCaptureDevice.requestAccess` and `PHPhotoLibrary.requestAuthorization` in every build; with no purpose strings App Store processing can return ITMS-90683 (Karma's ruling of 20 Nov on #833) (verified 2026-11-20).
- A review counts toward a merge only if its line 1 is `## Review A|B at <40-hex head sha>: PASS` or `: PASS WITH NOTES`; CHANGES, FAIL and BLOCKED do not count (Karma's ruling of 20 Nov 2026, to be recorded as a CR). Karma merges (D-132). `scripts/agents/merge-queue.mjs:72` counts only `PASS` until his fix merges; `review-gate` skill (verified 2026-11-20).

## Facts about this codebase (with paths)
- Payment and Plus feature code: `apps/mobile/src/app/plus/`, `apps/mobile/src/lib/billing/` (verified 2026-11-20).
- `docs/payments/**`.
- `packages/core/src/plan.ts` is founder code-owned: propose changes in a PR. Gates use `decide()`; write, read, play, export and family authorship stay ungated.
- Base branch is `develop`; `main` is releasable. CI: `.github/workflows/ci.yml` (`required` job) and the migration guard.

## Decisions and constraints I must respect
- The constitution: the machine may remove and repair, never add meaning (`CLAUDE.md`).
- No entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`, LEGAL-REQ-014).
- Fixtures use the fictional family "Asha" only.
- BRIEF decision 3 (3 Oct): Apple-only StoreKit 2, no server sees purchases, no RevenueCat. Older tasks that disagree are founder decisions.

## Open threads
- None yet.

## Lessons
- None yet.
