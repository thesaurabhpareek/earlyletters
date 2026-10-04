# Memory: Identity and Security Architect (security-architect)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever.

## Current focus
- Chapters 05 (IAM) and 06 (SEC) drafted 2026-10-03. Biggest gaps: branch protection off (CI-01), agent write connectors (PINF-01), no member removal or role change (PSEC-01), DB-01 view writes fixed only in PR #32.

## Facts about this codebase (with paths)
- Roles: `child_members.role in ('parent','contributor')`, default 'parent' in `supabase/migrations/20260930000000_scribe_core.sql:48-54` (applied file; the default is a trap).
- `profiles.id references auth.users(id) on delete cascade` (`scribe_core.sql:19`): dashboard user delete cascades letters (DB-17).
- Applied migrations: only files 1 and 2 (`.github/migrations-applied.txt`). Files 3 to 7 are pending; live prod lacks every fix in them (DB-03).
- Guards in `20261003000000_security_and_family.sql`: `is_anonymous()` (line 55), `require_user()` (SQLSTATE SCANO for anonymous), restrictive `*_no_anonymous` policies (lines 80-103), parent-only `create_child_invite` (line 317), `accept_child_invite` refuses role change and self-accept (line 366).
- `require_content_consent()` checks terms, `age_attested` and sensitive-data (same file, about line 197); raises SCCON.
- Last parent cannot leave: `child_members_guard`, SCLPG (`20261002020000_data_governance.sql:354`).
- Invite hashes purged 90 days after `coalesce(revoked_at, accepted_at, expires_at)` (`20261003020000_purge_batching.sql:137`).
- Access matrix `supabase/tests/access_matrix.test.mjs`: personas A, B, N, C, W (anonymous member), anon; structural checks: unlisted callable function, anon execute, definer without search_path, RPC without `require_user()`, table without restrictive anonymous policy.
- PR #32 (`fix/db-pending-hardening`) adds `book_children` view (contributors: name, nickname, birth month and day) and revokes view writes (DB-01).
- PR #30 (`ci/hardening`) adds `fence.yml` (pull_request_target, reads file list only), `security.yml` (gitleaks 8.30.1 checksum-verified, npm audit gate), `dependabot.yml`, `audit-ignore.json` (4 Expo build-tool advisories, expire 2027-01-03), SHA pins.
- Harness workflows `agents.yml`, `agents-check.yml`, `claude.yml` still use tag pins (`@v4`, `@v1`, `@v3`).
- `claude.yml` acts only on `author_association == 'OWNER'`; `isFounderComment` in `scripts/agents/lib.mjs:226`.
- No auth code in `apps/mobile/src` yet; no `expo-secure-store` or `@supabase/supabase-js` dependency (2026-10-03).
- Deep-link scheme is `scribe` (`packages/brand/index.ts:48`).
- PR #27 adds `com.apple.developer.default-data-protection` = `NSFileProtectionCompleteUntilFirstUserAuthentication` in `app.config.ts`.
- Missing: `docs/security/threat-model.md`, `docs/ops/SECRETS.md`, `SECURITY.md`, `security_events` table, `book_access` table.

## Decisions and constraints I must respect
- D-044: v1.0 sign-in is Apple plus email link and code; Google in v1.1 (BRIEF decision 4 lists Google; open question to founder).
- D-041: `supabase/**` and auth PRs need independent review plus founder's `approve-migration` label.
- D-039: contributors never see due date or birth year. D-026: no adult age stored. D-020: invite hash 90-day retention.
- BRIEF decision 17: user JWTs only; no service keys in the app.

## Open threads
- Founder: can one parent remove the other (WS-02)? Repo private (CI-04)? Pause agent runs and remove connectors (PINF-01)? Scheme rename (DOC-17)?

## Lessons
- WebFetch needs a URL from a prior WebSearch result in this harness; search first, then fetch.
