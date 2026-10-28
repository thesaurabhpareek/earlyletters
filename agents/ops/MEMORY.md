# Memory: Platform and Reliability Engineer (ops)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet.

## Current focus
- Re-chartered 13 Oct 2026 (ADR 0022, D-090): release mechanics moved to `release`. I own CI, `eas.json`, environments, SLOs and health reports. Backlog: BL-439.

## Facts about this codebase (with paths)
- `docs/ops/**` except `docs/ops/RELEASE.md` and `docs/ops/proposed/release-*` (both `release`), including `docs/ops/proposed/` for workflow changes the founder applies (the Claude GitHub App cannot edit `.github/workflows/`).
- `scripts/**`, except `scripts/agents/**`, `scripts/trace.mjs` and `scripts/release/**`.
- `apps/mobile/eas.json` (moved from `mobile` on 13 Oct 2026, D-090).
- `.github/README.md` documentation.
- Base branch is `develop`; `main` is releasable. CI: `.github/workflows/ci.yml` (`required` job) and the migration guard.

## Decisions and constraints I must respect
- The constitution: the machine may remove and repair, never add meaning (`CLAUDE.md`).
- No entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`, LEGAL-REQ-014).
- Fixtures use the fictional family "Asha" only.
- The Claude GitHub App cannot edit workflows; propose patches in `docs/ops/proposed/`.
- G5 thresholds (TDD 07 9.1): crash-free sessions 99.8 percent, users 99.5 percent; pause phased release on any S0.
- EAS Free plan: 15 iOS builds a month (expo.dev/pricing, 3 Oct 2026); Starter $19 a month plus usage.

## Open threads
- None yet.

## Lessons
- None yet.
