---
chapter: 04
title: Data quality and lifecycle
owner: data-steward
reviewers: [compliance-engineer, security-architect]
status: adopted
last_reviewed: 2026-10-03
applies_to: supabase/**, packages/analytics/**, apps/mobile/src/lib/db/**, apps/mobile/src/lib/store.ts, docs/legal/data-map.yaml, scripts/check-data-map.mjs
---

# 04. Data quality and lifecycle

## Purpose

We promise families that their letters are private, kept as long as they want, and gone when they say so. That promise only holds if we know every place data lives, every value is checked where it enters, and every retention clock is run by code we can test. This chapter covers classification, the data map, validation, quality checks, retention and purge, storage layout, analytics hygiene, test data and backups. The user-facing request process is chapter 08; what may never be logged is chapter 07; schema mechanics are chapter 03.

## Principles

1. **One inventory, checked by a machine.** If a store, column, bucket, SDK or event property is not in the data map, CI fails. *Why:* an unlisted store is a store we forget to delete from.
2. **Classify before you collect.** A field ships with its level (L1 to L4) in the same PR. *Why:* handling, access and retention all follow from the level.
3. **Fail closed at every boundary.** Invalid input is refused or dropped, never coerced or partly sent. *Why:* a stripped-but-sent event or a silently defaulted column hides the bug that matters.
4. **Retention runs itself.** Every clock in the schedule is a job with a test, never a calendar reminder. *Why:* "someone will remember to delete it" is how promises break.
5. **Fake families only.** Fixtures use the fictional Asha family; production data never leaves production. *Why:* real letters are irreplaceable and private.

## Rules

### Classification and the data map

**DQ-R01 (MUST)** Every column of every table and view in `public` carries a `comment on column` starting with `L1`, `L2`, `L3` or `L4`; content and child identity columns are L4 and person ids at least L3. Levels are defined in `docs/legal/DATA_CLASSIFICATION.md` section 1; `privacy` decides the level, the PR author records it. *Why:* handling follows the level. *Enforced by:* `supabase/tests/classification.test.mjs` (develop).

**DQ-R02 (MUST)** `docs/legal/data-map.yaml` is the single inventory of every store: Postgres tables, Supabase Auth, Storage buckets, device SQLite tables and KV/secure storage, files on device, SDKs and processors, analytics properties and log streams, each with level, purpose, owner, retention and deletion path. A PR that adds any of these updates the map. *Why:* DATA-REQ-001; today only Postgres is machine-checked (PDATA-05). *Enforced by:* not yet: WS-19 (`docs/legal/data-map.yaml` and `scripts/check-data-map.mjs` do not exist on develop or in any open PR branch).

**DQ-R03 (MUST)** `scripts/check-data-map.mjs` fails when a Postgres column in the migrations, a device table column, a bucket, or an analytics property in `packages/analytics/src/catalog.ts` is missing from the map, or when a mapped item has no retention or deletion path. *Why:* the inventory must be complete by construction, not by review. *Enforced by:* not yet: WS-19; wiring into `npm test` / CI is a follow-up for `ops`.

**DQ-R04 (SHOULD)** The prose inventory in `DATA_CLASSIFICATION.md` section 4 and `data-policy.md` section 4 is generated from or checked against the map once it exists. *Why:* three hand-kept lists drift (PDATA-05 found 4.7 already contradicts the catalog).

### Validation at boundaries

**DQ-R05 (MUST)** Every input that crosses a trust boundary (RPC arguments, Edge Function bodies, server-delivered content blocks, downloaded pack manifests) is schema-validated before use, and the server re-validates what the client already checked. Database CHECK constraints are the last line, not the only one. *Why:* the device is not trusted (chapter 03 principle 2). *Enforced by:* CHECK and length constraints in migrations (for example `entries_final_text_length`, `20260930000000_scribe_core.sql:144`); API-side validation is chapter 02 (`packages/api`, not yet built).

**DQ-R06 (MUST)** The analytics validator fails closed: an unknown event, or a required property that is missing or invalid, drops the whole event and records a violation without the value. *Why:* PDATA-03, the current validator strips a bad property and still sends the event. *Enforced by:* pending PR #31 (`packages/analytics/src/validate.ts`, `test/analytics.test.ts`); on develop only unknown events and PII-like strings drop the event.

**DQ-R07 (MUST NOT)** Code silently defaults a missing required value (environment setting, pepper, enum, author id). Missing is an error with a code. *Why:* DB-07 consent pepper fell back to `''`; MOB-02 stores `author_id` null locally while the server requires it. *Enforced by:* `SCCFG` tests pending PR #32 (see DB-R24); device side not yet (WS-09).

### Data quality checks

**DQ-R08 (MUST)** Each data invariant is written as a query that returns failing rows, and runs as a test in `supabase/tests/` and, once a scheduled job exists, against staging and production with an alert on any row. Minimum set: no orphan `entries` / `child_members` / `entry_versions`; no live entry in a deleted book; no tombstone older than 30 days that is not held; no `storage_purge_queue` row stuck past its backoff; no purged id present in a live table. *Why:* invariants that only run in CI on fixtures miss production drift; DATA-REQ-036 asks for a page on stale tombstones. *Enforced by:* fixture-level tests exist (`data_governance.test.mjs`, `purge_batching.test.mjs`); scheduled checks not yet (PDATA-06, no monitoring or `ops_health` view).

**DQ-R09 (MUST)** Enum value sets are defined once in `packages/core/src/domain.ts` and imported by analytics and the device store; a test parses the migration CHECK constraints and asserts equality. *Why:* CORE-05, `CAPTURE_MODE` lacked `mixed` so `letter_saved.mode` was silently stripped. *Enforced by:* pending PR #31 (`packages/analytics/test/domain.test.ts`).

**DQ-R10 (SHOULD)** A test compares the device schema (`apps/mobile/src/lib/db/migrations.ts`) with the server columns of synced tables and lists every difference against an allowlist. *Why:* CORE-03 (`birthday` vs `date_of_birth`). *Enforced by:* not yet: WS-09.

### Retention and purge

**DQ-R11 (MUST)** Every retention period in `docs/legal/data-policy.md` section 6 maps to exactly one automated mechanism (`purge_due()`, the `purge-worker` Edge Function, a device purge, or a recorded vendor console setting) and one test that proves an expired record is gone and an unexpired or held one is kept. *Why:* DATA-REQ-006. *Enforced by:* `purge_due(p_now, p_limit)` (`20261003020000_purge_batching.sql`) with tests in `purge_batching.test.mjs` and `data_governance.test.mjs` for database clocks; gaps below.

**DQ-R12 (MUST)** The server purge pipeline is complete end to end before any non-founder data exists: hourly `purge_due()` cron, `purge-worker` Edge Function draining `storage_purge_queue` and processor deletions, and a page when a tombstone passes 31 days. *Why:* PDATA-02, the pipeline stops at a queue; the cron line is commented out (`20261002020000_data_governance.sql:1271`) and `supabase/functions/` does not exist. *Enforced by:* not yet: PDATA-02.

**DQ-R13 (MUST)** The device purges its own tombstones and kept audio on the same clock as the server (30 days after `deleted_at`). *Why:* PPRIV-01, device deletion never purges today. *Enforced by:* not yet: WS-09.

**DQ-R14 (MUST)** Retention deletes have a supporting index on their date column, and records with a legal retention (`store_subscriptions` 7 years per data-policy section 6) have that clock implemented or the table removed. *Why:* DB-13. *Enforced by:* not yet: DB-13; founder decision 3 in `docs/agents/BRIEF-2026-10-03.md` removes the server entitlement tables (PR #32 head commit), which would retire the 7-year row for them.

**DQ-R15 (MUST NOT)** Anyone deletes or edits production rows by hand, outside a named runbook that writes an audit row. *Why:* DATA_CLASSIFICATION section 2 access rules (LEGAL-REQ-025). *Enforced by:* review; runbooks pending WS-18.

### Storage layout

**DQ-R16 (MUST)** Bucket names are kebab-case plural; object paths are `{child_id}/{author_id}/{object_id}.{ext}` with ids only (no names, dates or text), and a path CHECK constraint ties each path column to its bucket layout. *Why:* paths are L3 and drive RLS by folder; free text in a path is L4 in a URL. *Enforced by:* `entries_photo_path_scoped` and `children_photo_path_scoped` constraints (`20261002020000_data_governance.sql:54,106`) and storage policies on `entry-photos` (`20260930000000_scribe_core.sql:291-302`); convention for new buckets by review (PDATA-09 proposal).

**DQ-R17 (MUST)** Storage purge takes the bucket from the queue row, never from a hardcoded name. *Why:* PDATA-09, purge is hardcoded to `entry-photos`. *Enforced by:* not yet: PDATA-09.

### Analytics hygiene

**DQ-R18 (MUST)** Event names are `object_action` in past tense snake_case (`letter_saved`); property names are snake_case with `_bucket` / `_count` suffixes for reductions; enum values are the DB values imported from core (`parent`, not `co_parent`); every event carries a required `schema_version` and a catalog change bumps it. *Why:* PDATA-10, CORE-05. *Enforced by:* catalog shape tests in `packages/analytics/test/catalog.test.ts` (develop); required `schema_version` and hash-forces-bump pending PR #31 (`test/schema-version.test.ts`).

**DQ-R19 (MUST)** Every analytics property is L2 and listed in the catalog; no id other than the random analytics id, no name, date, language name or text. *Why:* DATA_CLASSIFICATION rule 1.1.9 and section 4.7. *Enforced by:* the allowlist in `packages/analytics/src/validate.ts` (PII-like and over-40-character strings drop the event, develop); the content rule is chapter 07.

### Test data, environments, backups

**DQ-R20 (MUST)** Fixtures, seeds, screenshots and perf data use only the fictional Asha family and synthetic generators; no production or real-family data in code, tests, dev or staging, and no copy of production into staging. *Why:* CLAUDE.md privacy rules; PDATA-01 found a real child's details in the repo. *Enforced by:* review; a fixture canary is not yet (proposed: CI grep for a deny-list kept outside the repo, owner `privacy`).

**DQ-R21 (MUST)** Backups are restore-tested quarterly per DATA-REQ-031, including the purge-ledger replay so a restore cannot bring purged letters back; Storage objects are covered separately because database backups do not include them. *Why:* an untested backup is a hope, and a restore that resurrects deleted words breaks the deletion promise. *Enforced by:* not yet: no drill recorded; runbook pending WS-18.

## How to apply it

Adding a field or store:
- [ ] Ask `privacy` for the level if unsure; record it (`comment on column`, data map row).
- [ ] Name the retention clock and the job that enforces it; add the expiry test.
- [ ] Add the deletion path (account deletion, book deletion, letter purge).
- [ ] If it reaches analytics: L2 only, catalog entry, enum from core, bump `schema_version`.

Writing an invariant check (returns failing rows; zero rows passes):

```sql
-- entries in a book that no longer exists or is purged
select e.id from public.entries e
left join public.children c on c.id = e.child_id
where c.id is null or (c.deleted_at is not null and e.deleted_at is null);
```

Review prompts: is it in the map? which clock deletes it? is the validator closed? do fixtures say Asha?

## Exceptions

Only the founder grants an exception, recorded as a `D-###` in `docs/DECISIONS.md` or in the PR body with the founder's approval. Exceptions to classification levels go through `privacy` and counsel first. No exception permits production data in tests.

## Open questions

1. Inactive accounts: no automatic deletion in v1 (data-policy section 6, OQ-11). Counsel to confirm against storage-limitation duties.
2. With server entitlement tables removed (brief decision 3), is any 7-year transaction record left on our side at all? Counsel and founder.
3. Where does the scheduled invariant job run (pg_cron vs Edge Function) and who is paged: `ops` and founder? Depends on PDATA-06.
4. Should the fixture canary deny-list live in a GitHub secret so it never enters the public repo?

## References

Repo:
- `docs/legal/DATA_CLASSIFICATION.md` sections 0 to 4; `docs/legal/data-policy.md` sections 4 and 6; `docs/legal/DELETION_AND_EXPORT_SPEC.md` DATA-REQ-001, -004, -006, -030, -031, -036, -060, -062, -066.
- `supabase/tests/{classification,data_governance,purge_batching}.test.mjs`; `supabase/migrations/20261003020000_purge_batching.sql`.
- `packages/analytics/src/{catalog,validate}.ts`; PR #31 (`fix/analytics-enums-core`); PR #32 (`fix/db-pending-hardening`).
- `docs/DECISIONS.md` D-020, D-021; findings PDATA-02, -03, -05, -09, -10, PPRIV-01, CORE-03, CORE-05, DB-13; workstreams WS-06, WS-09, WS-18, WS-19.

External (checked 2026-10-03):
- Supabase, Database Backups (Pro keeps 7 days of daily backups; Storage objects are not in database backups): https://supabase.com/docs/guides/platform/backups
- dbt, Data tests (a test is a query that returns failing records; zero rows passes): https://docs.getdbt.com/docs/build/data-tests
- PostgreSQL, Row Security Policies (default deny when no policy exists): https://www.postgresql.org/docs/current/ddl-rowsecurity.html
