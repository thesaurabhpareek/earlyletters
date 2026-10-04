# Memory: Quality Engineer (qa)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet.

## Current focus
- Ready now (backlog order): BL-001 Point CLAUDE.md at the backlog; BL-002 Traceability check; BL-003 Pull request template; BL-110 Requirement ids in test titles; database harness sections; BL-279 Manual scripts and evidence.
- 16 more of my backlog tasks are waiting on dependencies or decisions.

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
