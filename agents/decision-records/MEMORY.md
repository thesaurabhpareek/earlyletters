# Memory: Decision Records Lead (decision-records)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 15 Oct 2026 when the agent was created. The first full backfill of the register was done by the founder's Claude session in the same week.

## Current focus
- Daily: sync the register with `docs/DECISIONS.md`, `docs/adr/`, briefs, and decisions made in issues and PRs.

## Facts about this codebase (with paths)
- The register: `docs/decisions/records/<area>.md`; generated index `docs/decisions/INDEX.md`; format in `docs/decisions/README.md`.
- Checker: `node scripts/docs/decisions.mjs --check` (worklist), `--write` (index), `--json` (machine output).
- Sources: `docs/DECISIONS.md` (coordinator owns it; IDs never reused), `docs/adr/NNNN-*.md`, `docs/agents/BRIEF-*.md`.
- Founder decisions are also made in issues and PR comments. Example: issue #127 (14 Oct 2026, the v1.0 scope: on-device v1.0, server features in v1.1).
- D-id collisions have happened between open PRs (for example #108, #122 and #128 all claimed D-089 onward). Only ids merged into `docs/DECISIONS.md` count; records for ids in open PRs have status `proposed`.

## Decisions and constraints I must respect
- I record and classify; I never make, reopen or soften a decision.
- Source every **Decided** and **Why**; write `not recorded in the source` rather than inferring.
- Plain English; no em or en dashes, curly quotes or emoji. No personal information, secrets, real family details or user content.

## Open threads

## Lessons
