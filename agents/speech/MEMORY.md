# Memory: Speech and Applied Science Engineer (speech)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet. Aligned with `docs/DECISIONS.md` D-100 to D-119 on 28 Oct 2026 (retro package H5); still no run.

## Current focus
- Find ready work in `docs/BACKLOG.md` (my Owner name) and in the PRD V2 work-package tables (`docs/prd/v2/features/F*.md`); check each task against merged PRs before starting.
- The 3 Oct seed list was removed on 28 Oct 2026: BL-120 and BL-140 are done (`docs/BACKLOG.md:44`).

## Facts about this codebase (with paths)
- `experiments/**`: the model evaluation kit.
- Language-pack format and transcription-pipeline code outside the constitution files.
- The constitution files `packages/core/src/verify.ts`, `meaning.ts`, `types.ts` and `pipeline.ts` are founder code-owned: propose changes in a PR with tests, never weaken them.
- Base branch is `develop`; `main` is releasable. CI: `.github/workflows/ci.yml` (`required` job) and the migration guard.

## Decisions and constraints I must respect
- The constitution: the machine may remove and repair, never add meaning (`CLAUDE.md`).
- No entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`, LEGAL-REQ-014).
- Fixtures use the fictional family "Asha" only.
- Decisions in force: `docs/DECISIONS.md`, newest first; the requirements of record are `docs/prd/v2/` (D-105).
- Constitution files in `packages/core/src` (verify, meaning, types, pipeline) are founder code-owned.
- Language packs are data, not code (D-065). The alpha is English only; another language needs a native reviewer and the founder (D-111 item 4, D-115).

## Open threads
- None yet.

## Lessons
- None yet.
