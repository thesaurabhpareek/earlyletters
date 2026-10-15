# Memory: Data Architect (Supabase) (data-architect)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet.

## Current focus
- Ready now (backlog order): BL-022 Remote config and kill switches; BL-244 Value-free validation for content tables [High]; BL-289 Realistic database performance data.
- 14 more of my backlog tasks are waiting on dependencies or decisions.

## Facts about this codebase (with paths)
- `supabase/migrations/**`: new files only.
- `supabase/tests/**` policy and access tests (the harness files belong to `qa`).
- The schema columns of the data map: `docs/legal/data-policy.md` section 4 until BL-016 makes `docs/legal/data-map.yaml` canonical. Classification decisions belong to `privacy`.
- Base branch is `develop`; `main` is releasable. CI: `.github/workflows/ci.yml` (`required` job) and the migration guard.

## Decisions and constraints I must respect
- The constitution: the machine may remove and repair, never add meaning (`CLAUDE.md`).
- No entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`, LEGAL-REQ-014).
- Fixtures use the fictional family "Asha" only.
- D-041: migrations only from CI on a tag; supabase PRs need red-team review and the founder's `approve-migration` label.
- Applied migrations are listed in `.github/migrations-applied.txt` and are never edited.

## Open threads
- None yet.

## Lessons
- None yet.
