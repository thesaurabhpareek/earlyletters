# Memory: Privacy Engineer (privacy)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet.

## Current focus
- No backlog task is ready for this role yet; standing duties apply.
- 9 more of my backlog tasks are waiting on dependencies or decisions.

## Facts about this codebase (with paths)
- Consent, deletion and export implementation per the DATA-REQs (`docs/legal/DELETION_AND_EXPORT_SPEC.md`), wherever the code lives; `packages/analytics/src/consent.ts` together with `analytics`.
- Classification decisions in the data map (`docs/legal/data-policy.md` section 4; schema columns belong to `data-architect`).
- `docs/privacy/**`.
- Base branch is `develop`; `main` is releasable. CI: `.github/workflows/ci.yml` (`required` job) and the migration guard.

## Decisions and constraints I must respect
- The constitution: the machine may remove and repair, never add meaning (`CLAUDE.md`).
- No entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`, LEGAL-REQ-014).
- Fixtures use the fictional family "Asha" only.
- Analytics is opt-in (BRIEF decision 12).
- Requirement documents are never edited; propose changes.

## Open threads
- None yet.

## Lessons
- None yet.
