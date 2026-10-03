# Data Steward: inputs for the coordinator

## Principles

1. Deny by default: every table, view, function and sequence starts closed to clients and is opened on purpose, with an allow and a deny test.
2. The database is the authority for ownership and immutability; `raw_transcript` never changes and a purged id never comes back.
3. Applied migrations are frozen; every schema change is a new file that reaches production only through CI on a tag (D-041).
4. One machine-checked inventory: every column, store, bucket, SDK and analytics property is classified L1 to L4 and in the data map, or CI fails.
5. Retention and validation fail closed and run as code with tests, never as reminders; fixtures use only the fictional Asha family.

## Enforcement map

| Rule id | Level | Enforced by | Status | Gap id |
|---|---|---|---|---|
| DB-R01 | MUST | review; proposed check in `structure.test.mjs` | not yet | WS-03 |
| DB-R02 | MUST | review; `packages/analytics/test/domain.test.ts` | pending PR #31 | CORE-05 |
| DB-R04 | MUST | `supabase/tests/structure.test.mjs` trigger-order pin | pending PR #26 | DB-10 |
| DB-R05 | MUST | review | enforced by review | none |
| DB-R06 | MUST | `is_valid_client_uuid7` (children); entry check + `hardening.test.mjs` | partly on develop (pending file 6); entries pending PR #32 | DB-15 |
| DB-R07 | MUST NOT | `access_matrix.test.mjs` | enforced on develop | none |
| DB-R08 | MUST | `migration-guard.yml` / `migration-guard.mjs` | enforced on develop; guard-from-base pending PR #30 | CI-09 |
| DB-R09 | MUST | `deploy-db.yml` on tag | not yet | CI-03, WS-14 |
| DB-R10 | MUST NOT | `[DB-16]` check in `hardening.test.mjs` | pending PR #32 | DB-16 |
| DB-R11 | MUST | `npm run test:db` in `ci.yml`; label gate `fence.yml` | tests on develop; label pending PR #30 | CI-01, CI-11 |
| DB-R12 | MUST | `classification.test.mjs` (RLS on); allow/deny coverage by review | partly on develop | DB-18 |
| DB-R13 | MUST | revokes + `[DB-01]` tests; `grants.test.mjs` view sweep | pending PR #32, PR #26 | DB-01 |
| DB-R14 | MUST | revoke blocks in migrations; anon-executable sweep; sequence revoke | functions on develop; sweep pending PR #26; sequences pending PR #32 | PDB-02 |
| DB-R15 | MUST | `search_path = pg_catalog, public` rewrite; catalog check proposed | pending PR #32; check not yet | DB-11 |
| DB-R16 | MUST | DB-R13 tests; review | pending PR #32 | DB-01 |
| DB-R17 | MUST | `entries_guard_immutable`; `rls.test.mjs`, `data_governance.test.mjs` | enforced on develop (test harness) | none |
| DB-R18 | MUST | `entries_guard_immutable`; `SCTMB` test | enforced on develop (server); device gap | MOB-03, WS-09 |
| DB-R19 | MUST | `SCPRG` check; day 1 and day 61 tests | pending PR #32 | DB-02 |
| DB-R20 | MUST NOT | review; cascade allowlist test proposed | not yet | DB-17, DB-03 |
| DB-R21 | MUST | `perf.test.mjs` seq-scan and p95 budget; full index | enforced on develop; index pending PR #32 | DB-06 |
| DB-R23 | MUST | `server_seq` + tombstone pull | not yet | DB-08, D-023 |
| DB-R24 | MUST | `SCCFG` tests; env settings check | pending PR #32; per-env check not yet | DB-07, DB-18 |
| DB-R25 | MUST | migrator `user_version`; tombstone refusal; parity test | migrator on develop; refusal pending PR #29; parity not yet | CORE-03, WS-09 |
| DQ-R01 | MUST | `classification.test.mjs` | enforced on develop | none |
| DQ-R02 | MUST | `docs/legal/data-map.yaml` | not yet | PDATA-05, WS-19 |
| DQ-R03 | MUST | `scripts/check-data-map.mjs` in CI | not yet | WS-19 |
| DQ-R05 | MUST | CHECK constraints; API validation (chapter 02) | partly on develop | PAPI (packages/api) |
| DQ-R06 | MUST | `validate.ts` fail-closed + tests | pending PR #31 | PDATA-03 |
| DQ-R07 | MUST NOT | `SCCFG` tests; device not-null | pending PR #32; device not yet | DB-07, MOB-02 |
| DQ-R08 | MUST | fixture tests; scheduled invariant job | fixtures on develop; schedule not yet | PDATA-06 |
| DQ-R09 | MUST | `domain.test.ts` | pending PR #31 | CORE-05 |
| DQ-R11 | MUST | `purge_due()` + `purge_batching.test.mjs` | DB clocks on develop (pending files) | DB-13 |
| DQ-R12 | MUST | cron + `purge-worker` + page | not yet | PDATA-02 |
| DQ-R13 | MUST | device purge job | not yet | PPRIV-01, WS-09 |
| DQ-R14 | MUST | date indexes; 7-year clock or table removal | not yet | DB-13 |
| DQ-R15 | MUST NOT | review; runbooks | not yet | WS-18 |
| DQ-R16 | MUST | path CHECK constraints + storage policies | enforced on develop for `entry-photos` | PDATA-09 |
| DQ-R17 | MUST | bucket from queue row | not yet | PDATA-09 |
| DQ-R18 | MUST | `catalog.test.ts`; `schema-version.test.ts` | partly on develop; bump pending PR #31 | PDATA-10 |
| DQ-R19 | MUST | allowlist in `validate.ts` | enforced on develop | none |
| DQ-R20 | MUST | review; fixture canary proposed | not yet (review only) | PDATA-01 |
| DQ-R21 | MUST | quarterly restore drill (DATA-REQ-031) | not yet | WS-18 |

## Review paths

- `supabase/migrations/**`
- `supabase/tests/**`
- `supabase/APPLY.md`
- `.github/migrations-applied.txt`
- `apps/mobile/src/lib/db/**`
- `apps/mobile/src/lib/store.ts`
- `packages/analytics/**`
- `packages/core/src/domain.ts`
- `docs/legal/data-map.yaml`
- `scripts/check-data-map.mjs`

## Open questions for the founder

1. D-023 sync engine: approve outbox plus cursor pull by 16 Oct so `server_seq` and tombstone pull (DB-R23) can be specified?
2. `entries.author_id` and `children.created_by` cascades: switch to `restrict` once the deletion flow is the only path (DB-17)?
3. When a contributor leaves, are their letters kept or tombstoned? This sets DB-R20's allowlist.
4. Retrofit ordered trigger prefixes onto applied triggers in a pending file, or apply the prefix only to new triggers?
5. Where should the scheduled invariant checks run (pg_cron or Edge Function), and who is paged?
6. Should the real-data fixture canary deny-list live in a GitHub secret rather than the public repo?
