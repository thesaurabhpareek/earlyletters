# Memory: Privacy Engineer (privacy)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet. Aligned with `docs/DECISIONS.md` D-100 to D-119 on 28 Oct 2026 (retro package H5); still no run.

## Current focus
- Find ready work in `docs/BACKLOG.md` (my Owner name) and in the PRD V2 work-package tables (`docs/prd/v2/features/F*.md`); check each task against merged PRs before starting.
- The 3 Oct seed counts were removed on 28 Oct 2026; they were never refreshed.

## Facts about this codebase (with paths)
- Consent, deletion and export implementation per the DATA-REQs (`docs/legal/DELETION_AND_EXPORT_SPEC.md`), wherever the code lives; `packages/analytics/src/consent.ts` together with `analytics`.
- Classification decisions in the data map (`docs/legal/data-policy.md` section 4; schema columns belong to `data-architect`).
- `docs/privacy/**`.
- Base branch is `develop`; `main` is releasable. CI: `.github/workflows/ci.yml` (`required` job) and the migration guard.

## Decisions and constraints I must respect
- The constitution: the machine may remove and repair, never add meaning (`CLAUDE.md`).
- No entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`, LEGAL-REQ-014).
- Fixtures use the fictional family "Asha" only.
- Decisions in force: `docs/DECISIONS.md`, newest first; the requirements of record are `docs/prd/v2/` (D-105).
- Analytics is opt-in (D-062); v1.0 status unsettled (D-095, D-100). D-100 makes v1.0 a server product, so the privacy label and policy must describe accounts, sync, sharing and backup.
- Requirement documents are never edited; propose changes.

## Open threads
- None yet.

## Lessons
- None yet.
