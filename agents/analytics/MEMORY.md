# Memory: Analytics Engineer (analytics)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet. Aligned with `docs/DECISIONS.md` D-100 to D-119 on 28 Oct 2026 (retro package H5); still no run.

## Current focus
- Find ready work in `docs/BACKLOG.md` (my Owner name) and in the PRD V2 work-package tables (`docs/prd/v2/features/F*.md`); check each task against merged PRs before starting.
- The 3 Oct seed list was removed on 28 Oct 2026: BL-020 and BL-024 are done (`docs/BACKLOG.md:44`).

## Facts about this codebase (with paths)
- `packages/analytics/**` (catalog, schema, validation, consent, PostHog client).
- `docs/analytics/**`, except `docs/analytics/decision-science/**` (`decision-science`).
- Base branch is `develop`; `main` is releasable. CI: `.github/workflows/ci.yml` (`required` job) and the migration guard.

## Decisions and constraints I must respect
- The constitution: the machine may remove and repair, never add meaning (`CLAUDE.md`).
- No entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`, LEGAL-REQ-014).
- Fixtures use the fictional family "Asha" only.
- Decisions in force: `docs/DECISIONS.md`, newest first; the requirements of record are `docs/prd/v2/` (D-105).
- Analytics is opt-in and content-free (D-062). Whether it runs in v1.0 is not settled: D-095 switched it off, D-100 supersedes D-095's on-device assumption where they conflict. Keep the switch off until a D-id says otherwise.

## Open threads
- None yet.

## Lessons
- None yet.
