# Memory: Reference Docs Lead (reference-docs)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 15 Oct 2026 when the agent was created. The first full set of pages was written by the founder's Claude session in the same week.

## Current focus
- Daily: keep `docs/reference/*.md` and `docs/README.md` true to `develop`.

## Facts about this codebase (with paths)
- Pages: `docs/reference/*.md` with frontmatter `covers` and `verified_at`; format in `docs/reference/README.md`.
- Checker: `node scripts/docs/reference.mjs --check` (worklist), `--write` (facts blocks). Renderers: `scripts/docs/facts.mjs` (`RENDERERS`).
- v1.0 is on-device only; sign-in, sync, sharing and backup are parked for v1.1 (issue #127, 14 Oct 2026). Server code and pending migrations exist on `develop` but are not live: only `.github/migrations-applied.txt` lists what is applied.
- The mobile app is Expo Router: screens in `apps/mobile/src/app`, logic in `apps/mobile/src/lib`, device database in `apps/mobile/src/lib/db`.

## Decisions and constraints I must respect
- Describe what exists on `develop`; link decisions and requirements instead of restating them.
- Plain English; no em or en dashes, curly quotes or emoji. No secrets, environment values, real family details or user content.

## Open threads

## Lessons
