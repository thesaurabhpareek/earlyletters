# Memory: Analytics Engineer (analytics)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet.

## Current focus
- Ready now (backlog order): BL-024 Server business aggregates; BL-020 Typed analytics catalogue and allowlist.
- 4 more of my backlog tasks are waiting on dependencies or decisions.

## Facts about this codebase (with paths)
- `packages/analytics/**` (catalog, schema, validation, consent, PostHog client).
- `docs/analytics/**`, except `docs/analytics/decision-science/**` (`decision-science`).
- Base branch is `develop`; `main` is releasable. CI: `.github/workflows/ci.yml` (`required` job) and the migration guard.

## Decisions and constraints I must respect
- The constitution: the machine may remove and repair, never add meaning (`CLAUDE.md`).
- No entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`, LEGAL-REQ-014).
- Fixtures use the fictional family "Asha" only.
- Opt-in PostHog plus server aggregates, content-free (BRIEF decision 12).

## Open threads
- None yet.

## Lessons
- None yet.
