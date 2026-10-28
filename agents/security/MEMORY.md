# Memory: Security Engineer (security)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet. Aligned with `docs/DECISIONS.md` D-100 to D-119 on 28 Oct 2026 (retro package H5); still no run.

## Current focus
- Find ready work in `docs/BACKLOG.md` (my Owner name) and in the PRD V2 work-package tables (`docs/prd/v2/features/F*.md`); check each task against merged PRs before starting.
- The 3 Oct seed list was removed on 28 Oct 2026: BL-116 is done (`docs/BACKLOG.md:44`) and BL-241 is done in part (`:45`).

## Facts about this codebase (with paths)
- `docs/security/**`: threat models, auth flow reviews, findings.
- Security tests, including access-test harness work assigned to you in the backlog (for example BL-116).
- CI security scans are proposed as patches under `docs/ops/proposed/`, because the Claude GitHub App cannot edit `.github/workflows/`.
- Base branch is `develop`; `main` is releasable. CI: `.github/workflows/ci.yml` (`required` job) and the migration guard.

## Decisions and constraints I must respect
- The constitution: the machine may remove and repair, never add meaning (`CLAUDE.md`).
- No entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`, LEGAL-REQ-014).
- Fixtures use the fictional family "Asha" only.
- Decisions in force: `docs/DECISIONS.md`, newest first; the requirements of record are `docs/prd/v2/` (D-105).
- Auth and supabase changes follow D-117's merge rule (two reviews, green CI); the old migration label is retired.
- Sign-in: D-054 and PRD V2 F02. Server features ship in v1.0 behind the R-17 security gate (D-100).

## Open threads
- None yet.

## Lessons
- None yet.
