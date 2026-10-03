---
chapter: 03
title: Database and schema
owner: data-steward
reviewers: [security-architect, compliance-engineer]
status: adopted
last_reviewed: 2026-10-03
applies_to: supabase/**, apps/mobile/src/lib/db/**, apps/mobile/src/lib/store.ts
---

# 03. Database and schema

## Purpose

The database holds letters a parent can never write again. This chapter makes the schema correct by construction: every row reachable only by the people it belongs to, every write going through a path that keeps `raw_transcript` immutable and tombstones honest, and every rule proven by a test that fails loudly. It covers Postgres in Supabase and the device SQLite mirror. The API contract side (idempotency keys, error mapping, pagination) is chapter 02; the retention schedule is chapter 04; the user-facing deletion process is chapter 08.

## Principles

1. **Deny by default.** A table, view, function or sequence starts with no client access; access is granted on purpose and tested. *Why:* Supabase grants table rights to `anon` and `authenticated` by default, and that is how DB-01 happened.
2. **The database is the authority.** RLS, triggers and RPCs enforce ownership and immutability; the app is a convenience. *Why:* a stale or tampered client must not be able to change someone else's words.
3. **Append, never rewrite history.** Applied migrations are frozen; fixes ship as new files. *Why:* the live migration history is the audit trail of what ran in production.
4. **Deleted means gone, and stays gone.** A purged id can never come back. *Why:* a stale offline phone must not resurrect words a parent chose to delete (DB-02).
5. **Rely on checks, not memory.** Every rule here has a test, a CI job or a named reviewer. *Why:* people and agents forget; the catalog does not.

## Rules

### Naming and types

**DB-R01 (MUST)** Tables are plural `snake_case` in `public`; primary keys are `id uuid`; foreign keys are `<singular>_id`; instants are `<verb>_at timestamptz` (UTC); calendar dates are `<noun>_on date` (or the glossary name `date_of_birth`, `due_date`). *Why:* one shape for humans, generated types and the device mirror. *Enforced by:* review (data-steward); not yet automated: proposed catalog check in `supabase/tests/structure.test.mjs` (pending PR #26 adds the file).

**DB-R02 (MUST)** Closed value sets are `text` columns with a named `CHECK (col in (...))` constraint, not Postgres `create type ... as enum`, and the value list matches `packages/core/src/domain.ts`. *Why:* enum values cannot be dropped in place, and the CHECK list is what the analytics enum test parses. *Enforced by:* review today (no `create type` exists in `supabase/migrations/`); enum equality test pending PR #31 (`packages/analytics/test/domain.test.ts`).

**DB-R03 (SHOULD)** Every new constraint, index and trigger has an explicit name: `<table>_<purpose>` for constraints, `<table>_<cols>_idx` for indexes. *Why:* unnamed inline checks (for example `entries.kind` in `20260930000000_scribe_core.sql:124`) get generated names that differ between environments.

**DB-R04 (MUST)** When more than one trigger with the same timing and event exists on a table, their relative order is pinned by a test, and new triggers that depend on order use a numeric prefix after the table name (`entries_10_guard`, `entries_20_touch`). *Why:* Postgres fires same-kind triggers in name order, so a rename silently reorders rules (DB-10). *Enforced by:* pending PR #26 (`supabase/tests/structure.test.mjs` pins the existing order); prefix convention by review.

**DB-R05 (MUST)** Existing applied names are not renamed for style (`my_sync_gate`, `policy_acceptances.accepted_at`); the meaning is fixed in a glossary instead (`docs/GLOSSARY.md`, planned by WS-17). *Why:* renames of applied objects break clients and history for no safety gain. *Enforced by:* review.

### Identifiers

**DB-R06 (MUST)** Ids of user-created rows (`entries`, `children`) are UUIDv7 generated on the device, and the server refuses a non-v7 id or one whose timestamp is outside `2024-01-01 .. now() + 1 day`. *Why:* offline saves need ids before the network, and v7 keeps index locality; the bound stops junk ids (DB-15). *Enforced by:* `is_valid_client_uuid7` in `20261003010000_children_and_entitlements.sql` (children, pending file); entry check plus `SCCID` tests pending PR #32 (`supabase/tests/hardening.test.mjs`).

**DB-R07 (MUST NOT)** An id is never treated as a secret or as proof of access. *Why:* RFC 9562 section 8 says UUIDs must not be used as security capabilities; every read still goes through RLS. *Enforced by:* `supabase/tests/access_matrix.test.mjs` (wrong-book reads refused).

### Migrations

**DB-R08 (MUST)** Schema changes ship only as new files in `supabase/migrations/`, timestamped after the newest file in `.github/migrations-applied.txt`; an applied file is never edited, renamed or deleted. *Why:* the live history must match the repo (DB-04). *Enforced by:* `.github/workflows/migration-guard.yml` and `.github/scripts/migration-guard.mjs` on develop; the guard runs from the PR head until CI-09 is fixed (pending PR #30).

**DB-R09 (MUST)** Migrations reach staging and production only through CI on a tag (D-041); nobody pastes SQL into a dashboard, and no agent applies a migration anywhere. *Why:* manual paste is how file 2 got a different name live (DB-04). *Enforced by:* not yet: CI-03 / WS-14 (`deploy-db.yml`, `supabase/config.toml` do not exist); `supabase/APPLY.md` is the interim manual process.

**DB-R10 (MUST NOT)** A migration file contains `begin;` or `commit;`. *Why:* the Supabase CLI wraps each file in a transaction (DB-16). *Enforced by:* pending PR #32 (`[DB-16]` check in `supabase/tests/hardening.test.mjs`).

**DB-R11 (MUST)** A PR that adds a migration also updates `supabase/APPLY.md` while it exists, adds tests under `supabase/tests/`, passes `npm run test:db`, and carries the founder's `approve-migration` label before merge. *Why:* D-041 fence. *Enforced by:* `npm run test:db` in `.github/workflows/ci.yml`; label gate not yet (CI-01, CI-11, pending PR #30 `fence.yml`).

### Access: RLS, views, grants, functions

**DB-R12 (MUST)** Every table in `public` has RLS enabled, and every policy has at least one allow and one deny cell in `supabase/tests/access_matrix*.test.mjs`. *Why:* RLS with no policy is default-deny, but a policy with no deny test is an untested hole. *Enforced by:* RLS-on check in `supabase/tests/classification.test.mjs` (develop); allow/deny coverage by review (data-steward), not yet automated.

**DB-R13 (MUST)** Views are read-only to clients: after every `create view` or `create or replace view`, revoke `insert, update, delete, truncate, references, trigger` from `anon`, `authenticated` and `public` in the same file. New views use `security_invoker = true` unless they deliberately hide columns (like `book_entries`), and that exception is commented. *Why:* Supabase views run as their owner and bypass RLS; DB-01 let any member edit others' letters through `book_entries`. *Enforced by:* pending PR #32 (revokes plus `[DB-01]` tests); catalog sweep pending PR #26 (`supabase/tests/grants.test.mjs`, marked EXPECTS WS-01).

**DB-R14 (MUST)** Sequences and functions start closed: `revoke execute ... from public, anon` after every function, and `revoke all on all sequences ... from public, anon, authenticated` in each file that adds a sequence. Trigger and internal functions are also revoked from `authenticated`. *Why:* Postgres grants EXECUTE to PUBLIC on new functions. *Enforced by:* revoke blocks in every migration (for example `20261002020000_data_governance.sql:1004-1032`); anon-executable-is-empty sweep pending PR #26; sequences pending PR #32 (PDB-02).

**DB-R15 (MUST)** Every `security definer` function sets `search_path = pg_catalog, public` (trusted schemas only, `pg_catalog` first), is the smallest function that needs elevated rights, and has a comment saying why it is definer. *Why:* the Postgres docs warn that a writable schema in the path lets a caller mask objects (DB-11). *Enforced by:* pending PR #32 (rewrites and `alter function ... set search_path`); `supabase/tests/access_matrix.test.mjs` (lines 262 to 264) already fails a definer function with no `search_path` on develop; a check of the order (`pg_catalog` first) is not yet: proposed for `structure.test.mjs`.

**DB-R16 (MUST)** Client writes to content go through RPCs or narrowly scoped RLS write policies on the base table; reads go through RLS or a reviewed view. Clients never write through a view. *Why:* one write path keeps triggers, tombstones and the audit log in force. *Enforced by:* DB-R13 tests; review.

### Immutability, tombstones, purge

**DB-R17 (MUST)** `raw_transcript`, `raw_sha256`, `captured_at`, `created_at`, `author_id`, `child_id` and `engine_version` of an entry never change after insert. *Why:* the constitution. *Enforced by:* `entries_guard_immutable` trigger (`20261002020000_data_governance.sql:133-140`) and `supabase/tests/rls.test.mjs` / `data_governance.test.mjs` (develop).

**DB-R18 (MUST)** Deletion is a tombstone first, purge later: the server stamps `deleted_at = now()` whatever the client sends, and only `restore_entry()` clears it; a direct `deleted_at = null` is refused with `SCTMB`. *Why:* the 30-day undo window is a promise (DATA-REQ chapter 2 flows). *Enforced by:* `entries_guard_immutable` (`20261002020000_data_governance.sql:150`) and the `SCTMB` test in `supabase/tests/data_governance.test.mjs:53`. The device store still clears `deleted_at` directly (`apps/mobile/src/lib/store.ts:547`, MOB-03): gap, WS-09.

**DB-R19 (MUST)** A purged entry or book id is refused forever on insert and upsert, by every role including `service_role`, with SQLSTATE `SCPRG`; ledger rows for entries and books are never pruned. *Why:* DB-02. *Enforced by:* pending PR #32 (`entries_before_insert` check; day 1 and day 61 tests in `hardening.test.mjs`).

**DB-R20 (MUST NOT)** A foreign key cascade deletes content across authors, and no cascade may bypass the deletion flow. Deleting an auth user from the dashboard is forbidden by runbook. *Why:* `entries.author_id` and `children.created_by` cascades (`20260930000000_scribe_core.sql:43,123`) let one deletion remove other people's letters (DB-03, DB-17). *Enforced by:* review; not yet: a structure test that lists every `on delete cascade` with an allowlist (DB-17).

### Performance and indexes

**DB-R21 (MUST)** Every RLS predicate column and every foreign key has an index, and a new query class gets a row in the perf budget. *Why:* a missing `entries(child_id)` index made cascades scan the table (DB-06). *Enforced by:* `supabase/tests/perf.test.mjs` (fails on sequential scans of `entries`, `children`, `child_members` and on p95 over budget; develop); full index pending PR #32.

**DB-R22 (SHOULD NOT)** Add an index without a named access pattern; drop redundant ones (DB-14). *Why:* write cost on a write-heavy offline-sync table.

### Sync readiness and environments

**DB-R23 (MUST)** Any table the device pulls has a monotonic `server_seq` set by trigger from a sequence, and deletions stay pullable as tombstones until every device can have seen them. Visibility lives in one predicate (`book_access`, D-024). *Why:* an `updated_at` cursor skips rows written in the same instant (DB-08, D-023). *Enforced by:* not yet: DB-08, D-023 is waiting on the founder; no `server_seq` exists in `supabase/migrations/`.

**DB-R24 (MUST)** Every `app.*` setting a function reads fails closed: missing or too short raises `SCCFG`, with no silent default. *Why:* the consent pepper fell back to `''` (DB-07). *Enforced by:* pending PR #32 (`[DB-07]` tests); an every-environment settings check is not yet (DB-18).

**DB-R25 (MUST)** The device SQLite schema mirrors server column names and types for synced tables (`date_of_birth`, not `birthday`), changes only through versioned migrations in `apps/mobile/src/lib/db/migrations.ts`, and refuses edits to tombstoned rows. *Why:* CORE-03; a mismatch becomes a rejected write at sync time. *Enforced by:* migrator and `PRAGMA user_version` (develop); tombstone refusal pending PR #29; schema parity not yet (WS-09).

## How to apply it

New table checklist:
- [ ] New migration file after the last applied one; no `begin`/`commit`.
- [ ] `alter table ... enable row level security;` plus policies per command.
- [ ] `comment on column` with `L1..L4` for every column (chapter 04, DQ rules).
- [ ] Indexes for every FK and policy column; perf row if a new read path.
- [ ] Allow and deny cells in the access matrix; `npm run test:db` green.
- [ ] Row in `docs/legal/data-map.yaml` once it exists (DQ chapter).

View and definer function pattern:

```sql
create or replace view public.book_entries with (security_barrier = true) as ...;
revoke insert, update, delete, truncate, references, trigger
  on public.book_entries from public, anon, authenticated;

create or replace function public.is_child_parent(p_child uuid)
returns boolean language sql stable security definer
set search_path = pg_catalog, public as $$ ... $$;
-- definer: reads child_members, which members cannot read in full
revoke execute on function public.is_child_parent(uuid) from public, anon;
```

Review prompts for a `supabase/**` PR: does any grant widen? does any cascade cross authors? can a purged id return? can a client set `deleted_at`? is there a deny test?

## Exceptions

Only the founder grants an exception, recorded as a `D-###` in `docs/DECISIONS.md` (standing) or in the PR body with the founder's approval comment (one-off). Exceptions to DB-R13, DB-R15, DB-R17 and DB-R19 are not grantable for content tables.

## Open questions

1. D-023 sync engine (founder by 16 Oct): fixes the shape of `server_seq` and tombstone pull (DB-R23).
2. Should `entries.author_id` keep `on delete cascade` once the deletion flow is the only path, or become `restrict` (DB-17)?
3. Contributor leaves: keep or tombstone their letters (workstreams founder decision 5)? It sets the cascade rule.
4. Should the trigger prefix scheme (DB-R04) be retrofitted to applied triggers via drop/create in a pending file?

## References

Repo:
- `supabase/migrations/*.sql`, `.github/migrations-applied.txt`, `.github/scripts/migration-guard.mjs`, `supabase/APPLY.md` (Performance budgets).
- `supabase/tests/{access_matrix,classification,rls,data_governance,perf}.test.mjs`; PR #32 `hardening.test.mjs`; PR #26 `grants.test.mjs`, `structure.test.mjs`.
- `docs/DECISIONS.md` D-023, D-024, D-039, D-041; `docs/legal/DELETION_AND_EXPORT_SPEC.md` section 2; `docs/tdd/02-sync-backend.md`.
- Architecture review findings DB-01 to DB-18, PDB-02, CORE-03, MOB-03; workstreams WS-01, WS-03, WS-08, WS-09, WS-14.

External (checked 2026-10-03):
- PostgreSQL, CREATE FUNCTION, "Writing SECURITY DEFINER Functions Safely" and default PUBLIC execute: https://www.postgresql.org/docs/current/sql-createfunction.html
- PostgreSQL, Row Security Policies (default deny, owner and BYPASSRLS bypass): https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- PostgreSQL, CREATE TRIGGER (same-kind triggers fire in alphabetical order): https://www.postgresql.org/docs/current/sql-createtrigger.html
- Supabase, Row Level Security (default grants to anon and authenticated; views bypass RLS; `security_invoker`): https://supabase.com/docs/guides/database/postgres/row-level-security
- RFC 9562, UUIDs, sections 5.7 and 8 (UUIDv7 layout; never a security capability): https://www.rfc-editor.org/rfc/rfc9562.html
