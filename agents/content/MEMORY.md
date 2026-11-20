# Memory: Brand and Content Lead (content)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet.

## Current focus
- (20 Nov) BL-925 (the line for a Let it go that did not finish; the founder approves the words), then PROPOSED keys for NS-11, NS-13, NS-23 and NS-05 as their rows open. BL-936 (one roadmap) is a `product` pair in review.
- Older rows that sat here were seeded on 3 Oct and not re-checked; confirm a row's status by id before taking it.

## New scope (20 Nov 2026)
Decisions and facts that bind Build 13 work; re-check each against `develop` before you act on it.
- The new-scope pack is on `develop` at 697233d3 (#829): `docs/product/VISION.md`, `docs/product/prd/` 00 to 15 (cards NS-01 to NS-37), plan 13, test plan 14, the rank (`docs/roadmap/next/20-final-stack-rank-and-sizing-19nov.md`), rows BL-923 to BL-949; #843 (open) releases the rows held for the founder's approval (verified 2026-11-20).
- No autonomous lane runs: `agents.yml` is `disabled_manually` with 0 runs (Actions API) and every run is an interactive Claude session using the charter as a subagent (`docs/agents/HARNESS.md` line 11); `AGENTS_ENABLED` not verified (verified 2026-11-20).
- Tabs are Home, Book and Me in every build; no build shows a co-parent "coming soon" surface; a co-parent surface shows only with server features on in an alpha (`visibleCoParentDoors`, `apps/mobile/src/lib/family/entry.logic.ts:74`). Recorded as D-161, D-162 in #827, open; until it merges D-160 on `develop` still allows "coming soon" (verified 2026-11-20).
- A let-go draft never leaves its recording: Review's Let it go and Listen's Discard both go through `letItGo` (mark `discarding`, delete the file, finish) and the launch sweep finishes a draft left `discarding` (`apps/mobile/src/lib/capture/let-it-go.logic.ts`, `sweep.ts` `finishLetGo`; #832, 5dc025d3) (verified 2026-11-20).
- Internal terms (lens, Photos lens, index, Find as a header action) never reach a parent; `content` names the words (`docs/product/prd/README.md` ground rules; CR-25) (verified 2026-11-20).
- No camera control, camera permission string or "Take a photo" in Build 13 (NS-01-R22) (verified 2026-11-20).
- A review counts toward a merge only if its line 1 is `## Review A|B at <40-hex head sha>: PASS` (`scripts/agents/merge-queue.mjs:72`); Karma merges (D-132); `review-gate` skill (verified 2026-11-20).

## Facts about this codebase (with paths)
- `packages/content/**`: in-app strings, prompts, App Store, website and book copy; `VOICE.md`, `BRAND.md` and the rules test.
- `packages/brand/**` values are founder decisions: propose changes, do not make them.
- Base branch is `develop`; `main` is releasable. CI: `.github/workflows/ci.yml` (`required` job) and the migration guard.

## Decisions and constraints I must respect
- The constitution: the machine may remove and repair, never add meaning (`CLAUDE.md`).
- No entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`, LEGAL-REQ-014).
- Fixtures use the fictional family "Asha" only.
- Content rules are enforced by `packages/content/test/rules.test.ts`; fix copy, never the test.

## Open threads
- None yet.

## Lessons
- None yet.
