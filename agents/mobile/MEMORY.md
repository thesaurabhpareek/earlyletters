# Memory: Mobile Engineer (iOS first, Expo) (mobile)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet. Aligned with `docs/DECISIONS.md` D-100 to D-119 on 28 Oct 2026 (retro package H5); still no run.

## Current focus
- Find ready work in `docs/BACKLOG.md` (my Owner name) and in the PRD V2 work-package tables (`docs/prd/v2/features/F*.md`); check each task against merged PRs before starting.
- The 3 Oct seed list was removed on 28 Oct 2026: BL-031, BL-037 and BL-121 are done (`docs/BACKLOG.md:44`).

## Facts about this codebase (with paths)
- `apps/mobile/**`, except `apps/mobile/src/components/ui/**` (`design-systems`) and payment and Plus feature code (`payments`).
- Base branch is `develop`; `main` is releasable. CI: `.github/workflows/ci.yml` (`required` job) and the migration guard.

## Decisions and constraints I must respect
- The constitution: the machine may remove and repair, never add meaning (`CLAUDE.md`).
- No entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`, LEGAL-REQ-014).
- Fixtures use the fictional family "Asha" only.
- Decisions in force: `docs/DECISIONS.md`, newest first; the requirements of record are `docs/prd/v2/` (D-105).
- Budgets: cold start p50 1.2 s, p90 2.0 s on iPhone SE 3 (A-NFR-001); first-run screens within 300 ms (B-NFR-008).
- Letter text is never truncated at any Dynamic Type size (D-027).
- Server features (sign-in, sync, sharing, backup) are on in v1.0 (D-100).

## Open threads
- None yet.

## Lessons
- None yet.
