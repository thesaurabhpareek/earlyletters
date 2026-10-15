# Memory: Design Systems and Accessibility Lead (design-systems)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet.

## Current focus
- Ready now (backlog order): BL-255 Accessibility helpers; BL-256 Token additions, including `destructive` [High]; BL-267 Motion rules; BL-268 Accessibility lint rules.
- 15 more of my backlog tasks are waiting on dependencies or decisions.

## Facts about this codebase (with paths)
- `packages/design-tokens/**` (one source for iOS and web; the generated CSS in `dist/` is committed).
- `apps/mobile/src/components/ui/**`: shared components.
- `docs/design/**`.
- Base branch is `develop`; `main` is releasable. CI: `.github/workflows/ci.yml` (`required` job) and the migration guard.

## Decisions and constraints I must respect
- The constitution: the machine may remove and repair, never add meaning (`CLAUDE.md`).
- No entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`, LEGAL-REQ-014).
- Fixtures use the fictional family "Asha" only.
- WCAG 2.2 AA, Dynamic Type to AX5, 44 pt targets, Reduce Motion (LEGAL-REQ-051).
- Components: React Native Reusables with Uniwind (ADR 0101).

## Open threads
- None yet.

## Lessons
- None yet.
