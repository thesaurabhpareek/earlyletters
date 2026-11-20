# Memory: Privacy Engineer (privacy)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet.

## Current focus
- (20 Nov) BL-944 (pair with `product` and `data-architect`, wave 3); #799 (the Find inventory row, open; the founder merges legal text, D-125); CR-62 open items 4, 6 and 7 (pictures in the iPhone backup; owner backup and pictures).
- Older rows that sat here were seeded on 3 Oct and not re-checked; confirm a row's status by id before taking it.

## New scope (20 Nov 2026)
Decisions and facts that bind Build 13 work; re-check each against `develop` before you act on it.
- The new-scope pack is on `develop` at 697233d3 (#829): `docs/product/VISION.md`, `docs/product/prd/` 00 to 15 (cards NS-01 to NS-37), plan 13, test plan 14, the rank (`docs/roadmap/next/20-final-stack-rank-and-sizing-19nov.md`), rows BL-923 to BL-949; #843 (open) releases the rows held for the founder's approval (verified 2026-11-20).
- No autonomous lane runs: `agents.yml` is `disabled_manually` with 0 runs (Actions API) and every run is an interactive Claude session using the charter as a subagent (`docs/agents/HARNESS.md` line 11); `AGENTS_ENABLED` not verified (verified 2026-11-20).
- ADR 0028 is accepted under CR-62 (`docs/agents/cto/RULINGS.md:570`): D1 a picture is `Library/Application Support/photos/<media_id>.jpg` with an `entry_media` row (local migration 11); D3a the seal clock is `seal_opens_at` plus `seal_opens_on`, written once, and `seal_cleared_at`, all L4; D4 Find reads the instant. The ADR file is only on #797's branch (verified 2026-11-20).
- Local migration 11 (`entry_media`) ships unconditionally, outside `EXPO_PUBLIC_PHOTOS`: gating it would stop a phone that moves from a switched-on build to a switched-off one (Karma's ruling in #835's body; #835 open) (verified 2026-11-20).
- The photo picker is `PHPickerViewController` presented by our `scribe-photo` module, never `expo-image-picker`, which calls `AVCaptureDevice.requestAccess` and `PHPhotoLibrary.requestAuthorization` in every build; with no purpose strings App Store processing can return ITMS-90683 (Karma's ruling of 20 Nov on #833; BL-931) (verified 2026-11-20).
- A copy of a child's voice leaving the phone needs a `security-architect` read and a counsel read first (closed X2, `docs/product/prd/README.md` ground rules) (verified 2026-11-20).
- Tabs are Home, Book and Me in every build; no build shows a co-parent "coming soon" surface; a co-parent surface shows only with server features on in an alpha (`visibleCoParentDoors`, `apps/mobile/src/lib/family/entry.logic.ts:74`). Recorded as D-161, D-162 in #827, open; until it merges D-160 on `develop` still allows "coming soon" (verified 2026-11-20).
- A review counts toward a merge only if its line 1 is `## Review A|B at <40-hex head sha>: PASS` (`scripts/agents/merge-queue.mjs:72`); Karma merges (D-132); `review-gate` skill (verified 2026-11-20).

## Facts about this codebase (with paths)
- Consent, deletion and export implementation per the DATA-REQs (`docs/legal/DELETION_AND_EXPORT_SPEC.md`), wherever the code lives; `packages/analytics/src/consent.ts` together with `analytics`.
- Classification decisions in the data inventory, `docs/legal/DATA_CLASSIFICATION.md` section 4 (inventory of record while BL-016 is deferred); schema columns belong to `data-architect` (verified 2026-11-20).
- `docs/privacy/**`.
- Base branch is `develop`; `main` is releasable. CI: `.github/workflows/ci.yml` (`required` job) and the migration guard.

## Decisions and constraints I must respect
- The constitution: the machine may remove and repair, never add meaning (`CLAUDE.md`).
- No entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`, LEGAL-REQ-014).
- Fixtures use the fictional family "Asha" only.
- Analytics is opt-in (BRIEF decision 12).
- Requirement documents are never edited; propose changes.

## Open threads
- None yet.

## Lessons
- None yet.
