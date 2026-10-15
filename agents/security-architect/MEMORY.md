# Memory: Identity and Security Architect (security-architect)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever.

Seeded 2026-10-03 from the compendium drafting run. Lines marked (15 Oct) were re-checked against `develop` at `0c71ea9` (after #4 and #39 merged). Every other line is as of 3 Oct: re-verify it before acting on it.

## Current focus
- Chapters 05 (IAM) and 06 (SEC) drafted 2026-10-03. Biggest gaps: branch protection off (CI-01), agent write connectors (PINF-01), no member removal or role change (PSEC-01), DB-01 view writes fixed only in PR #32.

## Facts about this codebase (with paths)
- Roles: `child_members.role in ('parent','contributor')`, default 'parent' in `supabase/migrations/20260930000000_scribe_core.sql:48-54` (applied file; the default is a trap).
- `profiles.id references auth.users(id) on delete cascade` (`scribe_core.sql:19`): dashboard user delete cascades letters (DB-17).
- (15 Oct) Applied migrations: only files 1 and 2 (`.github/migrations-applied.txt`). Files 3 to 12 are pending; live prod lacks every fix in them (DB-03).
- Guards in `20261003000000_security_and_family.sql`: `is_anonymous()` (line 55), `require_user()` (SQLSTATE SCANO for anonymous), restrictive `*_no_anonymous` policies (lines 80-103), parent-only `create_child_invite` (line 317), `accept_child_invite` refuses role change and self-accept (line 366).
- `require_content_consent()` checks terms, `age_attested` and sensitive-data (same file, about line 197); raises SCCON.
- Last parent cannot leave: `child_members_guard`, SCLPG (`20261002020000_data_governance.sql:354`).
- Invite hashes purged 90 days after `coalesce(revoked_at, accepted_at, expires_at)` (`20261003020000_purge_batching.sql:137`).
- Access matrix `supabase/tests/access_matrix.test.mjs`: personas A, B, N, C, W (anonymous member), anon; structural checks: unlisted callable function, anon execute, definer without search_path, RPC without `require_user()`, table without restrictive anonymous policy.
- PR #32 (`fix/db-pending-hardening`) adds `book_children` view (contributors: name, nickname, birth month and day) and revokes view writes (DB-01).
- PR #30 (`ci/hardening`) adds `fence.yml` (pull_request_target, reads file list only), `security.yml` (gitleaks 8.30.1 checksum-verified, npm audit gate), `dependabot.yml`, `audit-ignore.json` (4 Expo build-tool advisories, expire 2027-01-03), SHA pins.
- (15 Oct) Harness workflows pin `actions/checkout` and `actions/setup-node` by SHA; `anthropics/claude-code-action@v1` and `actions/create-github-app-token@v3` are still tag pins.
- `claude.yml` acts only on `author_association == 'OWNER'`; `isFounderComment` in `scripts/agents/lib.mjs`. (15 Oct) Agent messages and verdicts count only from `isTrusted` authors (#39).
- (15 Oct) Auth code lives in `apps/mobile/src/lib/auth`; `expo-secure-store` and `@supabase/supabase-js` are `apps/mobile` dependencies. BL-347 and BL-330 fixes are open PR #139 (founder merge).
- Deep-link scheme is `scribe` (`scheme` in `packages/brand/index.ts`).
- PR #27 (merged 4 Oct) adds `com.apple.developer.default-data-protection` = `NSFileProtectionCompleteUntilFirstUserAuthentication` in `app.config.ts`.
- Missing on 3 Oct: `docs/security/threat-model.md`, `security_events` table, `book_access` table. (15 Oct) `SECURITY.md` and `docs/ops/SECRETS.md` arrive with PR #35.

## Decisions and constraints I must respect
- D-044: v1.0 sign-in is Apple plus email link and code; Google in v1.1 (BRIEF decision 4 lists Google; open question to founder).
- D-041: `supabase/**` and auth PRs need independent review plus founder's `approve-migration` label.
- D-039: contributors never see due date or birth year. D-026: no adult age stored. D-020: invite hash 90-day retention.
- BRIEF decision 17: user JWTs only; no service keys in the app.

## Open threads
- Founder: can one parent remove the other (WS-02)? Repo private (CI-04)? Pause agent runs and remove connectors (PINF-01)? Scheme rename (DOC-17)?

## Lessons
- WebFetch needs a URL from a prior WebSearch result in this harness; search first, then fetch.
