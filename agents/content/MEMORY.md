# Memory: Brand and Content Lead (content)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet.

## Current focus
- Ready now (backlog order): BL-118 Content rule additions and claims registry [High]; BL-157 Lock-screen-safe notification copy; BL-156 Content and localisation debt; BL-158 Help: "If you are struggling" row; BL-273 Accessibility statement.
- 2 more of my backlog tasks are waiting on dependencies or decisions.

## Facts about this codebase (with paths)
- `packages/content/**`: in-app strings, prompts, App Store, website and book copy; `VOICE.md`, `BRAND.md` and the rules test.
- `packages/brand/**` values are founder decisions: propose changes, do not make them.
- Base branch is `develop`; `main` is releasable. CI: `.github/workflows/ci.yml` (`required` job) and the migration guard.

## Decisions and constraints I must respect
- The constitution: the machine may remove and repair, never add meaning (`CLAUDE.md`).
- No entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`, LEGAL-REQ-014).
- Fixtures use the fictional family "Asha" only.
- Content rules are enforced by `packages/content/test/rules.test.ts`; fix copy, never the test.

## Open threads
- None yet.

## Lessons
- None yet.
