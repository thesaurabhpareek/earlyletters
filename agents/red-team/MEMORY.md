# Memory: Principal Reviewer (red team) (red-team)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet.

## Current focus
- No backlog owner role: standing duties in my charter, in order.
- (20 Nov) Reviews that count are lens reviews in the `review-gate` format (D-132). D-041 paths still get your independent review; no row in BL-923 to BL-949 names a `supabase/**` change.

## New scope (20 Nov 2026)
Decisions and facts that bind Build 13 work; re-check each against `develop` before you act on it.
- The new-scope pack is on `develop` at 697233d3 (#829): `docs/product/VISION.md`, `docs/product/prd/` 00 to 15 (cards NS-01 to NS-37), plan 13, test plan 14, the rank (`docs/roadmap/next/20-final-stack-rank-and-sizing-19nov.md`), rows BL-923 to BL-949; #843 (open) releases the rows held for the founder's approval (verified 2026-11-20).
- No autonomous lane runs: `agents.yml` is `disabled_manually` with 0 runs (Actions API) and every run is an interactive Claude session using the charter as a subagent (`docs/agents/HARNESS.md` line 11); `AGENTS_ENABLED` not verified (verified 2026-11-20).
- Tabs are Home, Book and Me in every build; no build shows a co-parent "coming soon" surface; a co-parent surface shows only with server features on in an alpha (`visibleCoParentDoors`, `apps/mobile/src/lib/family/entry.logic.ts:74`). Recorded as D-161, D-162 in #827, open; until it merges D-160 on `develop` still allows "coming soon" (verified 2026-11-20).
- Only `startCapture({source})` starts a letter (`apps/mobile/src/lib/capture/start-capture.ts:24`; #828, 5f5dfaf4; NS-35); `apps/mobile/test/navigation-one-entry.test.ts` fails on any other push of `/listen` or `/write` (verified 2026-11-20).
- A let-go draft never leaves its recording: Review's Let it go and Listen's Discard both go through `letItGo` (mark `discarding`, delete the file, finish) and the launch sweep finishes a draft left `discarding` (`apps/mobile/src/lib/capture/let-it-go.logic.ts`, `sweep.ts` `finishLetGo`; #832, 5dc025d3) (verified 2026-11-20).
- The photo picker is `PHPickerViewController` presented by our `scribe-photo` module, never `expo-image-picker`, which calls `AVCaptureDevice.requestAccess` and `PHPhotoLibrary.requestAuthorization` in every build; with no purpose strings App Store processing can return ITMS-90683 (Karma's ruling of 20 Nov on #833; BL-931) (verified 2026-11-20).
- Local migration 11 (`entry_media`) ships unconditionally, outside `EXPO_PUBLIC_PHOTOS`: gating it would stop a phone that moves from a switched-on build to a switched-off one (Karma's ruling in #835's body; #835 open) (verified 2026-11-20).
- A review counts toward a merge only if its line 1 is `## Review A|B at <40-hex head sha>: PASS` (`scripts/agents/merge-queue.mjs:72`); Karma merges (D-132); `review-gate` skill (verified 2026-11-20).

## Facts about this codebase (with paths)
- `docs/reviews/**`: audit reports and risk tracking.
- Base branch is `develop`; `main` is releasable. CI: `.github/workflows/ci.yml` (`required` job) and the migration guard.

## Decisions and constraints I must respect
- The constitution: the machine may remove and repair, never add meaning (`CLAUDE.md`).
- No entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`, LEGAL-REQ-014).
- Fixtures use the fictional family "Asha" only.
- You are the independent review run D-041 requires for supabase and auth changes.

## Open threads
- None yet.

## Lessons
- None yet.
