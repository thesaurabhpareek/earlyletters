# Memory: Design Systems and Accessibility Lead (design-systems)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet.

## Current focus
- (20 Nov) BL-927 first (the accessibility audit note under `docs/design/reviews/`; BL-928 waits on it), then the one-page delta that opens BL-938 (after #798 lands). Cards: NS-11, NS-14, NS-21, NS-22, NS-33.
- Older rows that sat here were seeded on 3 Oct and not re-checked; confirm a row's status by id before taking it.

## New scope (20 Nov 2026)
Decisions and facts that bind Build 13 work; re-check each against `develop` before you act on it.
- The new-scope pack is on `develop` at 697233d3 (#829): `docs/product/VISION.md`, `docs/product/prd/` 00 to 15 (cards NS-01 to NS-37), plan 13, test plan 14, the rank (`docs/roadmap/next/20-final-stack-rank-and-sizing-19nov.md`), rows BL-923 to BL-949; #843 (open) releases the rows held for the founder's approval (verified 2026-11-20).
- No autonomous lane runs: `agents.yml` is `disabled_manually` with 0 runs (Actions API) and every run is an interactive Claude session using the charter as a subagent (`docs/agents/HARNESS.md` line 11); `AGENTS_ENABLED` not verified (verified 2026-11-20).
- Tabs are Home, Book and Me in every build; no build shows a co-parent "coming soon" surface; a co-parent surface shows only with server features on in an alpha (`visibleCoParentDoors`, `apps/mobile/src/lib/family/entry.logic.ts:74`). D-161 and D-162 (`docs/DECISIONS.md`; #827, merged as d5a2676b on 20 Nov) (verified 2026-11-20).
- The Photos lens control uses radio semantics (`ChoiceGroup` segmented or `ChipGroup`), not Buttons in a tab list (NS-33-R3; BL-931 slice 5, #840) (verified 2026-11-20).
- Only `startCapture({source})` starts a letter (`apps/mobile/src/lib/capture/start-capture.ts:24`; #828, 5f5dfaf4; NS-35); `apps/mobile/test/navigation-one-entry.test.ts` fails on any other push of `/listen` or `/write` (verified 2026-11-20).
- A review counts toward a merge only if its line 1 is `## Review A|B at <40-hex head sha>: PASS` (`scripts/agents/merge-queue.mjs:72`); Karma merges (D-132); `review-gate` skill (verified 2026-11-20).

## Facts about this codebase (with paths)
- `packages/design-tokens/**` (one source for iOS and web; the generated CSS in `dist/` is committed).
- `apps/mobile/src/components/ui/**`: shared components.
- `docs/design/**`.
- Base branch is `develop`; `main` is releasable. CI: `.github/workflows/ci.yml` (`required` job) and the migration guard.

## Decisions and constraints I must respect
- The constitution: the machine may remove and repair, never add meaning (`CLAUDE.md`).
- No entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`, LEGAL-REQ-014).
- Fixtures use the fictional family "Asha" only.
- WCAG 2.2 AA, Dynamic Type to AX5, 44 pt targets, Reduce Motion (LEGAL-REQ-051).
- Components: React Native Reusables with Uniwind (ADR 0101).

## Open threads
- None yet.

## Lessons
- None yet.
