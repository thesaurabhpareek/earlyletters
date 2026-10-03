# Memory: Data Steward (data-steward)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever.

## Current focus
- Chapters 03 (DB-R01..R25) and 04 (DQ-R01..R21) drafted 2026-10-03. Most enforcement waits on PR #32, #26, #31 and WS-19.

## Facts about this codebase (with paths)
- 7 migrations in `supabase/migrations/`; only files 1-2 are applied (`.github/migrations-applied.txt`). Files 3-7 are pending; WS-01 (PR #32, `fix/db-pending-hardening`) is the serial owner of edits to them.
- File 2 was applied live as `scribe_hardening_indexes_and_grants` (`supabase/APPLY.md`), so live history does not match file names (DB-04).
- No Postgres enum types (`create type`) exist; value sets are CHECK constraints, several unnamed inline (`20260930000000_scribe_core.sql:124-128`).
- Views: `book_entries` (security_barrier, hides author-only columns) and `my_policy_state` (security_invoker). On develop both only revoke from `public, anon` (`data_governance.sql:222,742`): DB-01. PR #32 revokes from `authenticated` too.
- `is_valid_client_uuid7` lives in `20261003010000_children_and_entitlements.sql:57`; entry ids get the check in PR #32 (SCCID).
- Immutability: `entries_guard_immutable` (`data_governance.sql:128-140`); `SCTMB` test at `supabase/tests/data_governance.test.mjs:53`.
- Purge: `purge_due(p_now, p_limit)` in `20261003020000_purge_batching.sql`; cron line is commented out (`data_governance.sql:1271`); `supabase/functions/` does not exist (PDATA-02).
- Classification gate: `supabase/tests/classification.test.mjs` (L1-L4 comment on every public column, L4 content list, L3 person ids, RLS on).
- Perf budgets: `supabase/tests/perf.test.mjs` (`BUDGET_MS`), documented in `supabase/APPLY.md` "Performance budgets".
- Test runner: `supabase/tests/run.mjs` runs every `*.test.mjs` over all migrations in name order.
- PR #26 (`test/db-harness-defaults`) adds `grants.test.mjs` (view/function sweep, EXPECTS WS-01) and `structure.test.mjs` (trigger order pin).
- PR #31 (`fix/analytics-enums-core`) adds `packages/core/src/domain.ts`, fail-closed required props, `schema-version.test.ts`, `domain.test.ts`.
- `docs/legal/data-map.yaml` and `scripts/check-data-map.mjs` exist on no branch (checked all remotes 2026-10-03).
- Device store: `apps/mobile/src/lib/store.ts` (clears `deleted_at` directly at line 547, MOB-03); migrator `apps/mobile/src/lib/db/migrations.ts` (`PRAGMA user_version`); WAL + `synchronous=FULL` in `db/expo-adapter.ts`.
- Storage: only `entry-photos` exists (`scribe_core.sql:291`); path constraints `entries_photo_path_scoped`, `children_photo_path_scoped`.
- Open PR numbers: #25 repo-hygiene, #26 db-harness, #27 mobile-config, #28 unicode, #29 mobile-store-sqldb, #30 ci/hardening, #31 analytics-enums, #32 db-pending-hardening.

## Decisions and constraints I must respect
- D-041: migrations only from CI on a tag; `approve-migration` label is founder-only.
- D-023 (sync engine) is not approved yet; `server_seq` design waits on it. D-024 `book_access` is approved but not built.
- Brief decision 3: server entitlement tables are being removed (PR #32 head commit).
- Fixtures use the Asha family only.

## Open threads
- Proposed checks to build: cascade allowlist (DB-R20), definer search_path catalog check (DB-R15), invariant queries (DQ-R08).

## Lessons
- WebFetch may need user permission; curl through the proxy worked for docs pages.
