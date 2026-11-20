# Memory: Identity and Security Architect (security-architect)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever.

Seeded 2026-10-03 from the compendium drafting run. Lines marked (15 Oct) were re-checked against `develop` at `56ec5b5` (after #4, #39 and #130 merged). Every other line is as of 3 Oct: re-verify it before acting on it.

## Current focus
- Chapters 05 (IAM) and 06 (SEC) drafted 2026-10-03. Biggest gaps: branch protection off (CI-01), agent write connectors (PINF-01), no member removal or role change (PSEC-01), DB-01 view writes fixed only in PR #32.
- (20 Nov) Native-module review of `scribe-photo` (BL-931 slices 2, 2b and 2c: #834, #841, #842) per BL-931 and `13-engineering-plan.md` section 2; the roster does not route `apps/mobile/modules/**` to you. The NS-03 pilot security read (sections 3, 4, 6) has its due date in `docs/product/prd/03-family-hears-it-pilot.md` line 65.

## New scope (20 Nov 2026)
Decisions and facts that bind Build 13 work; re-check each against `develop` before you act on it.
- The new-scope pack is on `develop` at 697233d3 (#829): `docs/product/VISION.md`, `docs/product/prd/` 00 to 15 (cards NS-01 to NS-37), plan 13, test plan 14, the rank (`docs/roadmap/next/20-final-stack-rank-and-sizing-19nov.md`), rows BL-923 to BL-949; rows from wave 2 on wait under a founder hold until the founder approves the requirements, and Karma releases them by one status-change PR (`docs/product/prd/13-engineering-plan.md` section 6) (verified 2026-11-20).
- No autonomous lane runs: `agents.yml` is `disabled_manually` with 0 runs (Actions API) and every run is an interactive Claude session using the charter as a subagent (`docs/agents/HARNESS.md` lines 11 and 17); `AGENTS_ENABLED` not verified (verified 2026-11-20).
- BL-931 is the nine-PR photo stack: #834 (merged), #841, #842, #835 to #840 (verified 2026-11-20).
- The picker is Apple's `PHPickerViewController` in our `scribe-photo` module, never `expo-image-picker`, which calls `AVCaptureDevice.requestAccess` and `PHPhotoLibrary.requestAuthorization` in every build; with no purpose strings App Store processing can return ITMS-90683 (CR-65, pending) (verified 2026-11-20).
- A copy of a child's voice leaving the phone needs a `security-architect` read and a counsel read first (closed X2, `docs/product/prd/README.md` ground rules) (verified 2026-11-20).
- ADR 0028 is accepted under CR-62 (`docs/agents/cto/RULINGS.md:570`): D1 a picture is `Library/Application Support/photos/<media_id>.jpg` with an `entry_media` row (local migration 11); D3a the seal clock is `seal_opens_at` plus `seal_opens_on`, written once, and `seal_cleared_at`, all L4; D4 Find reads the instant. The ADR file is on `develop` (`docs/adr/0028-photo-seal-find-on-device-data.md`, #797 merged as e9dca86c); its status line still says Proposed and CR-62 is the acceptance record (verified 2026-11-20).
- Pictures sit in the iPhone backup and no policy or in-app line says so yet; whether the owner backup carries pictures is open, default no in Build 13 (CR-62 open items 4, 6, 7) (verified 2026-11-20).
- A counted review has line 1 `## Review A|B at <40-hex head sha>: PASS`, or `: PASS WITH NOTES` with `Must fix: none` in the body; CHANGES, FAIL and BLOCKED do not count (CR-63). Karma merges (D-132); `review-gate` skill (verified 2026-11-20).

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
- Deep-link scheme is `scribe` (`scheme` in `packages/brand/index.ts`; line 93 on 15 Oct).
- PR #27 (merged 4 Oct) adds `com.apple.developer.default-data-protection` = `NSFileProtectionCompleteUntilFirstUserAuthentication` in `app.config.ts`.
- Missing on 3 Oct: `docs/security/threat-model.md`, `security_events` table, `book_access` table. (15 Oct) `SECURITY.md` and `docs/ops/SECRETS.md` arrive with PR #35.

## Decisions and constraints I must respect
- D-054 (founder) supersedes D-044: sign-in is Apple, Google and email link; passkeys after sign-in; no passwords (`docs/DECISIONS.md:346`, verified 2026-11-20).
- D-041: `supabase/**` and auth PRs need an independent review; the `approve-migration` label is retired and no workflow reads it (D-117, `docs/DECISIONS.md:843`) (verified 2026-11-20).
- D-039: contributors never see due date or birth year. D-026: no adult age stored. D-020: invite hash 90-day retention.
- BRIEF decision 17: user JWTs only; no service keys in the app.

## Open threads
- Founder: can one parent remove the other (WS-02)? Repo private (CI-04)? Pause agent runs and remove connectors (PINF-01)? Scheme rename (DOC-17)?

## Lessons
- WebFetch needs a URL from a prior WebSearch result in this harness; search first, then fetch.
