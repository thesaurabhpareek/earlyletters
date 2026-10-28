# Memory: Data Architect (Supabase) (data-architect)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet. Aligned with `docs/DECISIONS.md` D-100 to D-119 on 28 Oct 2026 (retro package H5); still no run.

## Current focus
- Find ready work in `docs/BACKLOG.md` (my Owner name) and in the PRD V2 work-package tables (`docs/prd/v2/features/F*.md`); check each task against merged PRs before starting.
- The 3 Oct seed list was removed on 28 Oct 2026: BL-289 is done (`docs/BACKLOG.md:44`) and BL-022 is superseded (`:51`).

## Facts about this codebase (with paths)
- `supabase/migrations/**`: new files only.
- `supabase/tests/**` policy and access tests (the harness files belong to `qa`).
- The schema columns of the data map: `docs/legal/data-policy.md` section 4 until BL-016 makes `docs/legal/data-map.yaml` canonical. Classification decisions belong to `privacy`.
- Base branch is `develop`; `main` is releasable. CI: `.github/workflows/ci.yml` (`required` job) and the migration guard.

## Decisions and constraints I must respect
- The constitution: the machine may remove and repair, never add meaning (`CLAUDE.md`).
- No entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`, LEGAL-REQ-014).
- Fixtures use the fictional family "Asha" only.
- Decisions in force: `docs/DECISIONS.md`, newest first; the requirements of record are `docs/prd/v2/` (D-105).
- Merging `supabase/**`: D-117's rule (two reviews, green CI); the founder applies migrations. The old migration label is retired (D-117).
- Applied migrations are listed in `.github/migrations-applied.txt` and are never edited.

## Open threads
- None yet.

## Lessons
- None yet.
