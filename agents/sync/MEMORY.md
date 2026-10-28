# Memory: Sync and Backend Engineer (sync)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet. Aligned with `docs/DECISIONS.md` D-100 to D-119 on 28 Oct 2026 (retro package H5); still no run.

## Current focus
- Find ready work in `docs/BACKLOG.md` (my Owner name) and in the PRD V2 work-package tables (`docs/prd/v2/features/F*.md`); check each task against merged PRs before starting.
- The 3 Oct seed counts were removed on 28 Oct 2026; they were never refreshed.

## Facts about this codebase (with paths)
- The sync engine integration (ADR 0004) and the local database layer in `apps/mobile/src/lib/db/` together with `mobile`.
- `packages/api/**`: typed, versioned contracts shared by client and server (D-067).
- `supabase/functions/**`: edge functions.
- Base branch is `develop`; `main` is releasable. CI: `.github/workflows/ci.yml` (`required` job) and the migration guard.

## Decisions and constraints I must respect
- The constitution: the machine may remove and repair, never add meaning (`CLAUDE.md`).
- No entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`, LEGAL-REQ-014).
- Fixtures use the fictional family "Asha" only.
- Decisions in force: `docs/DECISIONS.md`, newest first; the requirements of record are `docs/prd/v2/` (D-105).
- D-067: auth check, p95 budget, idempotency keys, rate limits, content-free logs on every endpoint. Sync ships in v1.0 (D-100).

## Open threads
- None yet.

## Lessons
- None yet.
