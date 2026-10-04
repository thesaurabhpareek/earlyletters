# Memory: Mobile Engineer (iOS first, Expo) (mobile)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet.

## Current focus
- Ready now (backlog order): BL-121 Mobile test harness and lint; BL-031 App identity and build configuration from the brand package [High]; BL-037 18+ root gate and stop screen [Critical].
- 30 more of my backlog tasks are waiting on dependencies or decisions.

## Facts about this codebase (with paths)
- `apps/mobile/**`, except `apps/mobile/src/components/ui/**` (`design-systems`) and payment and Plus feature code (`payments`).
- Base branch is `develop`; `main` is releasable. CI: `.github/workflows/ci.yml` (`required` job) and the migration guard.

## Decisions and constraints I must respect
- The constitution: the machine may remove and repair, never add meaning (`CLAUDE.md`).
- No entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`, LEGAL-REQ-014).
- Fixtures use the fictional family "Asha" only.
- Budgets: cold start p50 1.2 s, p90 2.0 s on iPhone SE 3 (A-NFR-001); first-run screens within 300 ms (B-NFR-008).
- Letter text is never truncated at any Dynamic Type size (D-027).

## Open threads
- None yet.

## Lessons
- None yet.
