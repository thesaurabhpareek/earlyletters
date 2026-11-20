# Memory: Mobile Engineer (iOS first, Expo) (mobile)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet.

## Current focus
- (20 Nov) Build 13 in wave order (`docs/product/prd/13-engineering-plan.md` section 4): wave 1 BL-922, BL-926 (after BL-925), BL-928 (after BL-927), BL-931 photo stack (Karma), #798 Find, #758 notification budget; wave 2 BL-932, BL-933 (after BL-868), BL-937, BL-943; later BL-938, BL-939, BL-941, BL-942, BL-945, BL-946, BL-947.
- Older rows that sat here were seeded on 3 Oct and not re-checked; confirm a row's status by id before taking it.

## New scope (20 Nov 2026)
Decisions and facts that bind Build 13 work; re-check each against `develop` before you act on it.
- The new-scope pack is on `develop` at 697233d3 (#829): `docs/product/VISION.md`, `docs/product/prd/` 00 to 15 (cards NS-01 to NS-37), plan 13, test plan 14, the rank (`docs/roadmap/next/20-final-stack-rank-and-sizing-19nov.md`), rows BL-923 to BL-949; #843 (open) releases the rows held for the founder's approval (verified 2026-11-20).
- No autonomous lane runs: `agents.yml` is `disabled_manually` with 0 runs (Actions API) and every run is an interactive Claude session using the charter as a subagent (`docs/agents/HARNESS.md` line 11); `AGENTS_ENABLED` not verified (verified 2026-11-20).
- Tabs are Home, Book and Me in every build; no build shows a co-parent "coming soon" surface; a co-parent surface shows only with server features on in an alpha (`visibleCoParentDoors`, `apps/mobile/src/lib/family/entry.logic.ts:74`). Recorded as D-161, D-162 in #827, open; until it merges D-160 on `develop` still allows "coming soon" (verified 2026-11-20).
- Only `startCapture({source})` starts a letter (`apps/mobile/src/lib/capture/start-capture.ts:24`; #828, 5f5dfaf4; NS-35); `apps/mobile/test/navigation-one-entry.test.ts` fails on any other push of `/listen` or `/write` (verified 2026-11-20).
- A let-go draft never leaves its recording: Review's Let it go and Listen's Discard both go through `letItGo` (mark `discarding`, delete the file, finish) and the launch sweep finishes a draft left `discarding` (`apps/mobile/src/lib/capture/let-it-go.logic.ts`, `sweep.ts` `finishLetGo`; #832, 5dc025d3) (verified 2026-11-20).
- The photo picker is `PHPickerViewController` presented by our `scribe-photo` module, never `expo-image-picker`, which calls `AVCaptureDevice.requestAccess` and `PHPhotoLibrary.requestAuthorization` in every build; with no purpose strings App Store processing can return ITMS-90683 (Karma's ruling of 20 Nov on #833; BL-931) (verified 2026-11-20).
- Local migration 11 (`entry_media`) ships unconditionally, outside `EXPO_PUBLIC_PHOTOS`: gating it would stop a phone that moves from a switched-on build to a switched-off one (Karma's ruling in #835's body; #835 open) (verified 2026-11-20).
- ADR 0028 is accepted under CR-62 (`docs/agents/cto/RULINGS.md:570`): D1 a picture is `Library/Application Support/photos/<media_id>.jpg` with an `entry_media` row (local migration 11); D3a the seal clock is `seal_opens_at` plus `seal_opens_on`, written once, and `seal_cleared_at`, all L4; D4 Find reads the instant. The ADR file is only on #797's branch (verified 2026-11-20).
- The photo work is nine stacked PRs, each on the slice below: #834, #841, #842, #835 to #840 (#833 closed under the picker ruling). BL-931 still says eight, #833 to #840 (verified 2026-11-20).
- P0 rows (`docs/product/prd/14-test-plan.md` section 7) block any build outside the founder's family; each needs a test and a backlog row before its card's flag turns on (RR-3) (verified 2026-11-20).
- Memory Library rows (BL-841 to BL-881, also labelled M15) are after Build 13 as a whole (`docs/product/prd/README.md` ground rules), except rows the new-scope files cite by id (BL-868) (verified 2026-11-20).
- Build 13 is one photo per letter and no video (`docs/product/prd/README.md` ground rules). BL-846 and BL-847 (ready and blocked, Memory Library) overlap #835 and BL-931: ask Karma before taking them (verified 2026-11-20).
- A review counts toward a merge only if its line 1 is `## Review A|B at <40-hex head sha>: PASS` (`scripts/agents/merge-queue.mjs:72`); Karma merges (D-132); `review-gate` skill (verified 2026-11-20).

## Facts about this codebase (with paths)
- `apps/mobile/**`, except `apps/mobile/src/components/ui/**` (`design-systems`) and payment and Plus feature code (`payments`).
- Base branch is `develop`; `main` is releasable. CI: `.github/workflows/ci.yml` (`required` job) and the migration guard.

## Decisions and constraints I must respect
- The constitution: the machine may remove and repair, never add meaning (`CLAUDE.md`).
- No entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`, LEGAL-REQ-014).
- Fixtures use the fictional family "Asha" only.
- Budgets: cold start p50 1.2 s, p90 2.0 s on iPhone SE 3 (A-NFR-001); first-run screens within 300 ms (B-NFR-008).
- Letter text is never truncated at any Dynamic Type size (D-027).

## Open threads
- None yet.

## Lessons
- None yet.
