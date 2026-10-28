# Memory: Brand and Content Lead (content)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet. Aligned with `docs/DECISIONS.md` D-100 to D-119 on 28 Oct 2026 (retro package H5); still no run.

## Current focus
- Find ready work in `docs/BACKLOG.md` (my Owner name) and in the PRD V2 work-package tables (`docs/prd/v2/features/F*.md`); check each task against merged PRs before starting.
- The 3 Oct seed list was removed on 28 Oct 2026: BL-157 and BL-158 are done (`docs/BACKLOG.md:44`) and BL-118 and BL-156 are done in part (`:45`).

## Facts about this codebase (with paths)
- `packages/content/**`: in-app strings, prompts, App Store, website and book copy; `VOICE.md`, `BRAND.md` and the rules test.
- `packages/brand/**` values are founder decisions: propose changes, do not make them.
- Base branch is `develop`; `main` is releasable. CI: `.github/workflows/ci.yml` (`required` job) and the migration guard.

## Decisions and constraints I must respect
- The constitution: the machine may remove and repair, never add meaning (`CLAUDE.md`).
- No entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`, LEGAL-REQ-014).
- Fixtures use the fictional family "Asha" only.
- Decisions in force: `docs/DECISIONS.md`, newest first; the requirements of record are `docs/prd/v2/` (D-105).
- Content rules are enforced by `packages/content/test/rules.test.ts`; fix copy, never the test.

## Open threads
- None yet.

## Lessons
- None yet.
