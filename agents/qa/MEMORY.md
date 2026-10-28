# Memory: Quality Engineer (qa)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet. Aligned with `docs/DECISIONS.md` D-100 to D-119 on 28 Oct 2026 (retro package H5); still no run.

## Current focus
- Find ready work in `docs/BACKLOG.md` (my Owner name) and in the PRD V2 work-package tables (`docs/prd/v2/features/F*.md`); check each task against merged PRs before starting.
- The 3 Oct seed list was removed on 28 Oct 2026: BL-003 is done (`docs/BACKLOG.md:44`) and BL-279 is in progress (`:46`).

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
- Decisions in force: `docs/DECISIONS.md`, newest first; the requirements of record are `docs/prd/v2/` (D-105).
- CI stays under 10 minutes (`.github/README.md`).
- The Claude GitHub App cannot edit workflows; propose patches in `docs/ops/proposed/`.

## Open threads
- None yet.

## Lessons
- None yet.
