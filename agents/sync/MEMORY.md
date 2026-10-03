# Memory: Sync and Backend Engineer (sync)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet.

## Current focus
- No backlog task is ready for this role yet; standing duties apply.
- 2 more of my backlog tasks are waiting on dependencies or decisions.

## Facts about this codebase (with paths)
- The sync engine integration (ADR 0004) and the local database layer in `apps/mobile/src/lib/db/` together with `mobile`.
- `packages/api/**`: typed, versioned contracts shared by client and server (BRIEF decision 17). Create it when your first task needs it.
- `supabase/functions/**`: edge functions.
- Base branch is `develop`; `main` is releasable. CI: `.github/workflows/ci.yml` (`required` job) and the migration guard.

## Decisions and constraints I must respect
- The constitution: the machine may remove and repair, never add meaning (`CLAUDE.md`).
- No entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`, LEGAL-REQ-014).
- Fixtures use the fictional family "Asha" only.
- BRIEF decision 17: auth check, p95 budget, idempotency keys, rate limits, content-free logs on every endpoint.

## Open threads
- None yet.

## Lessons
- None yet.
