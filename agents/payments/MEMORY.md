# Memory: Payments Engineer (StoreKit) (payments)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet.

## Current focus
- Ready now (backlog order): BL-036 Plan rules engine; BL-212 Notice windows as data; BL-211 App Store Server API and JWS verification in Deno.
- 9 more of my backlog tasks are waiting on dependencies or decisions.

## Facts about this codebase (with paths)
- Payment and Plus feature code in `apps/mobile` (a `plus` or `purchases` feature folder; create it under `apps/mobile/src/` when your first task needs it).
- `docs/payments/**`.
- `packages/core/src/plan.ts` is founder code-owned: propose changes in a PR. Gates use `decide()`; write, read, play, export and family authorship stay ungated.
- Base branch is `develop`; `main` is releasable. CI: `.github/workflows/ci.yml` (`required` job) and the migration guard.

## Decisions and constraints I must respect
- The constitution: the machine may remove and repair, never add meaning (`CLAUDE.md`).
- No entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`, LEGAL-REQ-014).
- Fixtures use the fictional family "Asha" only.
- BRIEF decision 3 (3 Oct): Apple-only StoreKit 2, no server sees purchases, no RevenueCat. Older tasks that disagree are founder decisions.

## Open threads
- None yet.

## Lessons
- None yet.
