# Memory: Quality Engineer (qa)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet.

## Current focus
- (20 Nov) BL-929 (small-phone run sheet, ready), BL-930 (pair with `product`), BL-948 (one device row per journey, after BL-929), and the BL-928 device row (VoiceOver and AX5 on three screens). Device rows owed: S1-204, S1-205, S1-135, the backup drill (`14-test-plan.md` section 8).
- Older rows that sat here were seeded on 3 Oct and not re-checked; confirm a row's status by id before taking it.

## New scope (20 Nov 2026)
Decisions and facts that bind Build 13 work; re-check each against `develop` before you act on it.
- The new-scope pack is on `develop` at 697233d3 (#829): `docs/product/VISION.md`, `docs/product/prd/` 00 to 15 (cards NS-01 to NS-37), plan 13, test plan 14, the rank (`docs/roadmap/next/20-final-stack-rank-and-sizing-19nov.md`), rows BL-923 to BL-949; #843 (open) releases the rows held for the founder's approval (verified 2026-11-20).
- No autonomous lane runs: `agents.yml` is `disabled_manually` with 0 runs (Actions API) and every run is an interactive Claude session using the charter as a subagent (`docs/agents/HARNESS.md` line 11); `AGENTS_ENABLED` not verified (verified 2026-11-20).
- P0 rows (`docs/product/prd/14-test-plan.md` section 7) block any build outside the founder's family; each needs a test and a backlog row before its card's flag turns on (RR-3) (verified 2026-11-20).
- Test titles carry the requirement id in brackets so `scripts/trace.mjs` finds them; a test against a stand-in says so and its row stays "partly built" (`docs/product/prd/14-test-plan.md` intro and section 2) (verified 2026-11-20).
- Only `startCapture({source})` starts a letter (`apps/mobile/src/lib/capture/start-capture.ts:24`; #828, 5f5dfaf4; NS-35); `apps/mobile/test/navigation-one-entry.test.ts` fails on any other push of `/listen` or `/write` (verified 2026-11-20).
- A let-go draft never leaves its recording: Review's Let it go and Listen's Discard both go through `letItGo` (mark `discarding`, delete the file, finish) and the launch sweep finishes a draft left `discarding` (`apps/mobile/src/lib/capture/let-it-go.logic.ts`, `sweep.ts` `finishLetGo`; #832, 5dc025d3) (verified 2026-11-20).
- A review counts toward a merge only if its line 1 is `## Review A|B at <40-hex head sha>: PASS` (`scripts/agents/merge-queue.mjs:72`); Karma merges (D-132); `review-gate` skill (verified 2026-11-20).

## Facts about this codebase (with paths)
- Test infrastructure: `supabase/tests/harness.mjs` and `supabase/tests/run.mjs` (the harness only; policy tests belong to `data-architect`), shared test helpers such as `apps/mobile/test/helpers/`.
- `scripts/trace.mjs` and `docs/TRACE.md` (BL-002).
- `.github/pull_request_template.md` and `docs/tdd/07-quality-test-strategy.md` follow-ups.
- CI changes are proposed, not made: the Claude GitHub App cannot edit `.github/workflows/`. Write a patch under `docs/ops/proposed/` and flag it for the founder.
- Base branch is `develop`; `main` is releasable. CI: `.github/workflows/ci.yml` (`required` job) and the migration guard.

## Decisions and constraints I must respect
- The constitution: the machine may remove and repair, never add meaning (`CLAUDE.md`).
- No entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`, LEGAL-REQ-014).
- Fixtures use the fictional family "Asha" only.
- CI stays under 10 minutes (`.github/README.md`).
- The Claude GitHub App cannot edit workflows; propose patches in `docs/ops/proposed/`.

## Open threads
- None yet.

## Lessons
- None yet.
