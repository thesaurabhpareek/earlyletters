# Memory: Security Engineer (security)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever. Keep it under 120 lines.

Seeded on 3 Oct 2026 from `docs/BACKLOG.md` and my charter. Nothing below comes from a run yet.

## Current focus
- Ready now (backlog order): BL-116 Access-test harness: default grants, RLS matrix, upgrade test [High]; BL-241 Security programme documents and runbooks.
- 10 more of my backlog tasks are waiting on dependencies or decisions.

## Facts about this codebase (with paths)
- `docs/security/**`: threat models, auth flow reviews, findings.
- Security tests, including access-test harness work assigned to you in the backlog (for example BL-116).
- CI security scans are proposed as patches under `docs/ops/proposed/`, because the Claude GitHub App cannot edit `.github/workflows/`.
- Base branch is `develop`; `main` is releasable. CI: `.github/workflows/ci.yml` (`required` job) and the migration guard.

## Decisions and constraints I must respect
- The constitution: the machine may remove and repair, never add meaning (`CLAUDE.md`).
- No entry text, transcript, audio or child name in analytics, logs or crash reports (`CLAUDE.md`, LEGAL-REQ-014).
- Fixtures use the fictional family "Asha" only.
- D-041: auth and supabase changes need red-team review and `approve-migration`.
- BRIEF decision 4: Apple, Google and magic link sign-in, no passwords.

## Open threads
- None yet.

## Lessons
- None yet.
