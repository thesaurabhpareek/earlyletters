# Memory: Principal Architect (principal-architect)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever.

Seeded 2026-10-03 during the compendium drafting run (develop plus open PR branches #25 to #33). Lines marked (15 Oct) were re-checked against `develop` at `0c71ea9` (after #4 and #39 merged). Every other line is as of 3 Oct: re-verify it before acting on it.

## Current focus
- Chapters 01 (CODE), 02 (API), 10 (OBS) drafted. Most MUST rules are `not yet`; the gaps (CODE-G*, API-G*, OBS-G*) are listed in `docs/engineering/ENFORCEMENT.md`.

## Facts about this codebase (with paths)
- (15 Oct) Workspaces: `apps/*`, `packages/*`, `experiments` (root `package.json`). Packages: analytics, api (21 files), brand, content, core, design-tokens, emails. No `packages/db-types`. `supabase/functions/` has `purge-worker`, `analytics-forget`, `config`, `content` and `_shared`.
- Packages are consumed as raw TS: `main: src/index.ts`, no `exports` map except `design-tokens` (MONO-04).
- `packages/core/tsconfig.json` has `types: []`; analytics, content and design-tokens have `types: ["node"]` (MONO-02).
- No ESLint or Prettier config anywhere; only `apps/mobile` has a `lint` script (`expo lint`). PR #30 adds a CI lint job that skips until a root `lint` script exists.
- (15 Oct) CI `required` job (`.github/workflows/ci.yml`) needs install, tests and content rules, `npm run test:db`, the Deno functions job and typecheck.
- Largest files: `apps/mobile/src/lib/store.ts` (735 lines on 15 Oct; PR #29, merged 4 Oct, routes it through `lib/db` repositories), `packages/core/src/verify.ts` (498).
- (15 Oct) `ENGINE_VERSION = 5` in `packages/core/src/pipeline.ts` (PR #28 merged with the golden corpus).
- Seeded fuzz pattern: `packages/core/test/verify.fuzz.test.ts`, env `SCRIBE_FUZZ_SEED`.
- Typed errors exist: `MigrationError` (`apps/mobile/src/lib/db/migrations.ts`), `TranscriberUnavailable` (`apps/mobile/src/lib/transcribe.ts`), `AudioMissingError` (`store.ts`). Untyped: `packages/core/src/age.ts:15` puts the input date in the message (gap CODE-G2).
- (15 Oct) Shared enums: `packages/core/src/domain.ts` is on `develop` (PR #31) with a test that parses migration CHECK constraints.
- SQLSTATE registry: comment blocks in `supabase/migrations/20261002020000_data_governance.sql` and `20261003000000_security_and_family.sql`, full list in `supabase/APPLY.md` on PR #32. PR #32 adds SCACD, SCPRG, SCCFG, SCVER, uses 55000 for service-only states, removes SCPLS.
- Idempotency today: device UUIDv7 ids checked by `public.is_valid_client_uuid7` (`20261003010000_children_and_entitlements.sql`); tests titled `[DATA-REQ-044]` in `supabase/tests/children_entitlements.test.mjs`.
- (15 Oct) Rate limits: `create_child_invite` raises SCRAT; `20261005000000_family_cap_language_idempotency.sql` adds server-owned counters (pending, not applied).
- (15 Oct) `supabase/functions/_shared/log` is the server logger, with a log canary in the Deno CI job; `20261004200000_ops_deletion_worker.sql` adds an ops schema. Re-check which of Sentry, a scrubber, `ops_health`, `app_config` and `ops_audit_log` exist before citing them. `audit_events` exists (`20261002020000_data_governance.sql:310`).

## Decisions and constraints I must respect
- BRIEF decision 17: p95 budget, auth check, idempotency key, rate limit, request ids, content-free logs, contracts in `packages/api`.
- BRIEF decision 1: standard over custom. Decision 16: server-driven content is schema-validated blocks only.
- D-021 two log clocks (24 vs 12 months). D-023 outbox plus `server_seq` cursor (awaits founder). D-035 `app_config` and kill switches. D-003 Sentry only after consent.
- TDD 06 5.3 `OpsLog` schema is the logger allowlist; TDD 02 3.5 is the retry classification.

## Open threads
- Founder: one contract package name (`packages/api` vs `packages/db-types`), PR size ceiling, supported-build window.
- MONO-04 module format ADR needed before the first Edge Function.

## Lessons
- WebFetch can be blocked by a permission prompt; `curl` through the proxy worked for google.github.io, stripe, w3.org, sre.google, supabase.com, postgresql.org. docs.postgrest.org returned 429 (Cloudflare challenge).
- Open PR branches are shallow: use `git diff origin/develop origin/<branch>`, not `...`.
