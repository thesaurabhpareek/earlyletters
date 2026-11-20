# Memory: Data Architect (Supabase) (data-architect)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet.

## Current focus
- (20 Nov) BL-868 first: the export spec edit (stripped copy only, at `photos/<entry_id>/<media_id>.<ext>`) that gates BL-933; the founder merges it (CR-62 item 3, D-125). Then BL-944 (pair, wave 3) and the cards NS-15 and NS-36. ADR 0028 is on `develop` (#797, e9dca86c).
- Older rows that sat here were seeded on 3 Oct and not re-checked; confirm a row's status by id before taking it.

## New scope (20 Nov 2026)
Decisions and facts that bind Build 13 work; re-check each against `develop` before you act on it.
- The new-scope pack is on `develop` at 697233d3 (#829): `docs/product/VISION.md`, `docs/product/prd/` 00 to 15 (cards NS-01 to NS-37), plan 13, test plan 14, the rank (`docs/roadmap/next/20-final-stack-rank-and-sizing-19nov.md`), rows BL-923 to BL-949; rows from wave 2 on wait under a founder hold until the founder approves the requirements, and Karma releases them by one status-change PR (`docs/product/prd/13-engineering-plan.md` section 6) (verified 2026-11-20).
- No autonomous lane runs: `agents.yml` is `disabled_manually` with 0 runs (Actions API) and every run is an interactive Claude session using the charter as a subagent (`docs/agents/HARNESS.md` lines 11 and 17); `AGENTS_ENABLED` not verified (verified 2026-11-20).
- ADR 0028 is accepted under CR-62 (`docs/agents/cto/RULINGS.md:570`): D1 a picture is `Library/Application Support/photos/<media_id>.jpg` with an `entry_media` row (local migration 11); D3a the seal clock is `seal_opens_at` plus `seal_opens_on`, written once, and `seal_cleared_at`, all L4; D4 Find reads the instant. The ADR file is on `develop` (`docs/adr/0028-photo-seal-find-on-device-data.md`, #797 merged as e9dca86c); its status line still says Proposed and CR-62 is the acceptance record (verified 2026-11-20).
- Local migration 11 (`entry_media`) ships unconditionally, outside `EXPO_PUBLIC_PHOTOS`: gating it would stop a phone that moves from a switched-on build to a switched-off one (CR-64 (#852); #835 body) (verified 2026-11-20).
- Phone migrations are append-only, one transaction per step with `PRAGMA user_version` (`apps/mobile/src/lib/db/migrations.ts:1-14`); upgrade tests seed the previous version with Asha data (`apps/mobile/test/migrations.v9.test.ts`); a new column needs a row in `docs/legal/DATA_CLASSIFICATION.md` 4.5 (verified 2026-11-20).
- BL-846 (local schema for media, ready) overlaps #835 (migration 11, `entry_media`): ask Karma before taking it (verified 2026-11-20).
- Memory Library rows (BL-841 to BL-881, also labelled M15) are after Build 13 as a whole, except what NS-01 needs: NS-01 is NX-39 P0, one picture per letter, already in Build 13 (`docs/product/prd/README.md:42`). A row that serves an NS-01 acceptance row is Build 13 work, for example BL-868 (NS-01-R14), BL-852 and BL-870 (NS-01-R15) (verified 2026-11-20).
- BL-931 is the nine-PR photo stack: #834 (merged), #841 (merged, 1513b265), #842, #835 to #840 (verified 2026-11-20).
- The picker is Apple's `PHPickerViewController` in our `scribe-photo` module, never `expo-image-picker`, which calls `AVCaptureDevice.requestAccess` and `PHPhotoLibrary.requestAuthorization` in every build; with no purpose strings App Store processing can return ITMS-90683 (CR-65 (#852); #833 comment 7026600796) (verified 2026-11-20).
- A counted review has line 1 `## Review A|B at <40-hex head sha>: PASS`, or `: PASS WITH NOTES` with `Must fix: none` in the body; CHANGES, FAIL and BLOCKED do not count (CR-63). Karma merges (D-132); `review-gate` skill (verified 2026-11-20).

## Facts about this codebase (with paths)
- `supabase/migrations/**`: new files only.
- `supabase/tests/**` policy and access tests (the harness files belong to `qa`).
- The schema columns of the data inventory, `docs/legal/DATA_CLASSIFICATION.md` section 4 (inventory of record while BL-016 is deferred, `docs/BACKLOG.md` BL-016). Classification decisions belong to `privacy` (verified 2026-11-20).
- Base branch is `develop`; `main` is releasable. CI: `.github/workflows/ci.yml` (`required` job) and the migration guard.

## Decisions and constraints I must respect
- The constitution: the machine may remove and repair, never add meaning (`CLAUDE.md`).
- No entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`, LEGAL-REQ-014).
- Fixtures use the fictional family "Asha" only.
- D-041: migrations only from CI on a tag; supabase PRs need red-team review; the `approve-migration` label is retired and no workflow reads it (D-117, `docs/DECISIONS.md:843`) (verified 2026-11-20).
- Applied migrations are listed in `.github/migrations-applied.txt` and are never edited.

## Open threads
- None yet.

## Lessons
- None yet.
