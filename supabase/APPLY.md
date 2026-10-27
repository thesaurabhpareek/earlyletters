# Applying pending migrations to the live project

For the founder. Project: `early-letters` (Supabase, us-west-1). Written 2 Oct 2026; steps 8 to 13 added 3 Oct 2026; files 8 to 11 and steps 14 to 18 added 3 Oct 2026 (evening wave).
Nothing here has been run against the live project yet. Do the steps in order; each has a check and a rollback.

## What is applied and what is pending

| Order | File | State | What it does |
|---|---|---|---|
| 1 | `20260930000000_scribe_core.sql` | Applied | Schema, RLS, photo bucket |
| 2 | `20261001000000_scribe_hardening.sql` | Applied 2 Oct as `scribe_hardening_indexes_and_grants` | Function grants, FK indexes |
| 3 | `20261002010000_entries_select_policy.sql` | **Pending** | One SELECT policy on entries instead of two (performance only) |
| 4 | `20261002020000_data_governance.sql` | **Pending** | Deletion, retention, legal holds, audit, policy acceptances, author-only raw transcripts (`book_entries` view), per-child settings, drops `safety_events`, classification comments on every column |
| 5 | `20261003000000_security_and_family.sql` | **Pending** | Anonymous-session guard, server consent gate (Terms + age + sensitive-data), policy notice-window fix (X-01), parent-only invites with explicit role and limits, family approval and visibility (B F9) |
| 6 | `20261003010000_children_and_entitlements.sql` | **Pending** | `create_child` with device UUIDv7 ids and the Plus rule, first-run batch, Apple StoreKit 2 entitlement tables |
| 7 | `20261003020000_purge_batching.sql` | **Pending** | `purge_due` per-run limit, retry backoff columns for the purge worker, invite retention clock |
| 8 | `20261004000000_plus_on_device_only.sql` | **Pending** | Plus checked on the device only: drops the server entitlement tables and the server Plus rule (section "File 20261004000000" below) |
| 9 | `20261004100000_sync_engine.sql` | **Pending** | Sync engine: `sync_pull`, `sync_push`, `sync_books`, op receipts, rate windows, restore epochs, `sync_housekeeping` (step 14) |
| 10 | `20261004200000_ops_deletion_worker.sql` | **Pending** | Schema `ops` (never exposed) and service-only functions for the purge worker, analytics-forget and the ops runbooks (step 15) |
| 11 | `20261004300000_insights_aggregates.sql` | **Pending** | Schema `insights` (never exposed): k-anonymised weekly counts, `insights_reader` role, `public.insights_aggregates(p_weeks)` for the service role and that role only (step 16) |
| 12 | `20261005000000_family_cap_language_idempotency.sql` | **Pending** | Two parents per book, leave and remove, letter language, idempotency keys, server rate limits (section "File 20261005000000") |
| 13 to 16 | `20261015000000` to `20261015030000` | **Pending** | The R-17 gate: BL-331 with BL-332, `peek_invite` with BL-334, WP-F11-01, the v1.0 wire-contract columns (section "Files 13 to 16") |
| 17 | `20261016000000_sync_v1_server.sql` | **Pending** | Sync protocol v1, the server half: words compare and set, held drafts, Erase now, the erasure record, the review mark; schema `sync_private` (never exposed) (section "File 17") |
| 18 | `20261016001000_subscription_status.sql` | **Pending** | The D-080 subscription status report and the D-081 purchase consent record: four tables no client can read, `status_salt()` and `status_report_store(jsonb)`, fail closed on `app.status_report_enabled` (section "File 18") |
| 19 | `20261023000000_backup_server.sql` | **Pending** | Encrypted recording backup and the recovery key (section "File `<timestamp>_backup_server.sql`") |
| 20 | `20261023010000_s02_purge_and_consent_guards.sql` | **Pending** | Consent records append-only for the service role; a former member's letters survive the book purge (section "File 20") |
| 21 | `20261023020000_purge_legal_holds.sql` | **Pending** | Legal holds stop the account purge for every row it would touch (section "File 21") |
| 22 | `20261023030000_held_drafts_write_checks.sql` | **Pending** | Held drafts checked at write time like letters (section "File 22") |
| 23 | `20261023040000_entries_machine_edits_check.sql` | **Pending** | A letter's `machine_edits` must be an array (section "File 23") |
| 24 | `20261023050000_consent_grants_tightening.sql` | **Pending** | The consent tables' grants match their row security (section "File 24") |
| 25 | `20261023060000_explicit_grants.sql` | **Pending** | Every table, view and sequence gets explicit grants; on a new project this is what makes the app work (section "File 25") |
| 26 | `20261027000000_invite_redeem_by_code.sql` | **Pending** | The call `invite-redeem` makes for a typed code: gate, lookup and failure count in one transaction (section "File 26") |

The unapplied draft `20261003041500_sync_cursor_pull.sql` was deleted on 3 Oct 2026: file 9 replaces it (its `sync_books()` moved into file 9). If your SQL editor history shows it was ever run somewhere, tell the coordinator before applying file 9.

Step 4 drops whatever entries SELECT policies exist, so it is correct whether or not step 3 ran. Apply 3 first anyway, so the live history matches the repo. Files 5 to 7 depend on 4 and on each other; apply them in order.

## Before you start (10 minutes)

1. On your Mac, in the repo: `npm install` then `npm run test:db`. Every test file must pass (32 files after file 25; `npm run test:db` lists them). Do not continue if anything fails.
2. In the Supabase dashboard, Database > Backups: confirm a daily backup from the last 24 hours exists. If you want an exact restore point, run `supabase db dump --linked -f backup-2026-10-02.sql` (needs the Supabase CLI linked to the project). Storage files are not in database backups; nothing here touches Storage objects.
3. Pick a quiet time. Today only founder data exists, so there is no user impact, but the app build that reads co-parent letters must switch to `book_entries` (section "App changes") before any co-parent uses it.

## Hosted checks before the first apply

Once per hosted project, in the SQL Editor, before `deploy-db.yml` first applies the pending files. `early-letters` has files 1 and 2 applied; `scribe-staging` and `scribe-prod` start empty (`docs/ops/DEPLOY.md:35-37`). a), b) and c) run on any project, empty or not; d) runs only where files 1 and 2 are applied. Every query only reads and prints counts and names only. Write the answers in the deploy notes. If one differs from the expected answer, stop and ask before applying.

a) The Postgres version, and the defaults the project gives new objects. Supabase stopped granting new tables, sequences and functions in `public` to anon, authenticated and service_role on projects created since 30 May 2026 (the date that matters for staging and production), and does the same on every existing project from 30 Oct 2026 (GitHub discussion supabase 45329; the CLI's `RevokeDefaultDataApiPrivilegesSql`, which matches what Studio runs at project creation). New tables still get TRUNCATE, REFERENCES, TRIGGER and MAINTAIN, and new sequences UPDATE, so the query reads only the privileges that change:
```sql
select current_setting('server_version_num')::int / 10000 as major;   -- 17 (supabase/config.toml)
select count(*) filter (where d.defaclobjtype = 'r' and a.privilege_type = 'SELECT') as tables_select,
       count(*) filter (where d.defaclobjtype = 'S' and a.privilege_type = 'USAGE') as sequences_usage,
       count(*) filter (where d.defaclobjtype = 'f' and a.privilege_type = 'EXECUTE') as functions_execute
  from pg_default_acl d cross join lateral aclexplode(d.defaclacl) a
 where d.defaclnamespace = 'public'::regnamespace and d.defaclrole = 'postgres'::regrole
   and a.grantee in ('anon'::regrole, 'authenticated'::regrole, 'service_role'::regrole);
```
- `3 | 3 | 3`: the old automatic grants. Every pending file applies and works as written. After file 25 every project answers `0 | 0 | 0`, whichever defaults it started with.
- `0 | 0 | 0`: no automatic grants (every project created since 30 May 2026; staging and production are both new projects and will both answer this). Every pending file still applies cleanly, files 1 and 2 included, but none of them grants what the app uses, so afterwards the consent sheets, sync, letters and family reads all get `42501`; the deploy job's smoke fails first (the anonymous `policy_versions` read). On a new project, file 25 (`20261023060000`, section "File 25") is what makes the app work, and the deploy job's smoke is the first thing that fails without it: do not approve the first staging run until file 25 is on `develop`, so one push applies files 1 to 25, and open the project to nobody before it is applied.
- Anything else: stop and ask.

b) Whether the role that applies the migrations sees every Storage object. The legal hold checks (file 21), `ops_storage_residue` and `ops_storage_owned_by` read `storage.objects` as that role (it owns the functions); without BYPASSRLS they find nothing and answer "not held" (review B on #251). Run as that role (the SQL Editor's `postgres` is the role `deploy-db.yml` uses):
```sql
select rolname, rolsuper, rolbypassrls from pg_roles where rolname = current_user;   -- postgres | false | true
select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects' order by 1;
-- an empty project: no rows, or only policies made in the dashboard (write their names down)
-- early-letters (files 1 and 2): entry_photos_author_delete, entry_photos_author_insert, entry_photos_author_update,
-- entry_photos_read, and any made in the dashboard
```
After file 21, on every project, once: `select bool_and(r.rolsuper or r.rolbypassrls) from pg_roles r join pg_proc p on p.proowner = r.oid where p.proname in ('book_purge_held', 'purge_due', 'prepare_account_purge', 'ops_storage_owned_by');` (expect true).

c) The Storage name indexes the hold checks' folder scans use (review B on #251, comment 6376345025, section 2). `storage.objects` exists on every project, empty or not:
```sql
select indexname, indexdef ~ '\(bucket_id, name' as bucket_and_name, indexdef ~ 'text_pattern_ops' as name_prefix
  from pg_indexes where schemaname = 'storage' and tablename = 'objects' order by 1;
-- includes bucketid_objname | true | false and name_prefix_search | false | true
```
If neither a `bucket_and_name` nor a `name_prefix` index is listed, tell the owner before file 21: every purge run would then scan all of `storage.objects` for each book it checks.

d) The Before counts files 20 to 23 ask for (numbers only in the deploy notes), on a project where files 1 and 2 are applied (`early-letters`). On an empty project there is nothing to count: `select count(*) from pg_tables where schemaname = 'public';` is 0, and every one of these counts is 0 by definition.
```sql
select (select count(*) from pg_attribute where attrelid = 'public.children'::regclass and attname = 'purged_at' and not attisdropped) as file_20,   -- 0
       (select count(*) from pg_proc where pronamespace = 'public'::regnamespace and proname = 'book_purge_held') as file_21,                      -- 0
       to_regclass('public.held_drafts') is not null as file_22_table,                                                                            -- false
       (select count(*) from public.entries) as file_23_letters,                                                                                 -- the number of letters
       (select count(*) from public.entries where jsonb_typeof(machine_edits) <> 'array') as file_23_not_array;                                  -- 0
```
If `file_22_table` is true there (file 17 is applied), run File 22's Before counts as well. The last two are File 23's.

## Step 1. Apply the entries policy (pending file 3)

1. Dashboard > SQL Editor > New query. Paste the whole of `supabase/migrations/20261002010000_entries_select_policy.sql` (it has its own `begin` / `commit`). Run.
2. Check:
   ```sql
   select policyname from pg_policies where schemaname = 'public' and tablename = 'entries' order by 1;
   ```
   Expect `entries_author_insert`, `entries_author_update`, `entries_select`.
3. Record it in the migration history so the CLI does not try to re-run it:
   ```sql
   insert into supabase_migrations.schema_migrations (version, name) values ('20261002010000', 'entries_select_policy')
   on conflict do nothing;
   ```

Rollback for step 1 (only if reads break):
```sql
begin;
create policy entries_author_select on public.entries for select to authenticated using (author_id = (select auth.uid()));
create policy entries_book_select on public.entries for select to authenticated
  using (in_book and deleted_at is null and public.is_child_member(child_id));
drop policy entries_select on public.entries;
commit;
```

## Step 2. Pre-flight checks for the governance migration

Run in the SQL Editor and read the numbers. None of these change data.
```sql
-- a) Photo paths that would fail the new scoping rule ({child}/{author}/{entry}.jpg|jpeg|heic|png).
select id, photo_path from public.entries
 where photo_path is not null
   and photo_path !~ ('^' || child_id || '/' || author_id || '/' || id || '\.(jpg|jpeg|heic|png)$');
-- b) Rows in safety_events (the migration deletes the table and its rows, by design: PRD K-06).
select count(*) from public.safety_events;
-- c) Nothing else may already use the new names.
select to_regclass('public.book_entries'), to_regclass('public.policy_acceptances'), to_regclass('public.audit_events');
```
Expect: (a) no rows, (b) any number (they will be erased; they are a health inference we decided not to keep), (c) three nulls. If (a) returns rows, fix or clear those `photo_path` values before step 5; the constraint is added `NOT VALID`, so step 3 still works.

## Step 3. Apply the governance migration (file 4)

1. SQL Editor > New query. Type `begin;` on the first line, paste the whole of `supabase/migrations/20261002020000_data_governance.sql`, and type `commit;` on the last line. Run. If any statement fails, the whole thing rolls back and nothing changes; copy the error and stop.
2. Record it:
   ```sql
   insert into supabase_migrations.schema_migrations (version, name) values ('20261002020000', 'data_governance')
   on conflict do nothing;
   ```

## Step 4. Check the result

```sql
-- Every public column is classified (expect 0).
select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
  join pg_attribute a on a.attrelid = c.oid
 where n.nspname = 'public' and c.relkind in ('r','v') and a.attnum > 0 and not a.attisdropped
   and coalesce(col_description(c.oid, a.attnum), '') !~ '^L[1-4]\M';
-- Every public table has RLS (expect 0).
select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
-- safety_events is gone (expect null).
select to_regclass('public.safety_events');
-- Book creator deletion no longer cascades (expect 'n' = SET NULL).
select confdeltype from pg_constraint where conname = 'children_created_by_fkey';
-- Policy documents seeded (expect 13).
select count(*) from public.policy_documents;
```
Then Dashboard > Advisors > Security and Performance. Expected and accepted:
- **0010 security definer view** on `public.book_entries`. Intentional: the view applies its own membership rule and hides raw transcripts (PRD K-09). `my_policy_state` is `security_invoker` and should not appear.
- **0029 authenticated can execute security definer function** for the RPCs users call: `create_child`, `create_child_invite`, `accept_child_invite`, `request_account_deletion`, `cancel_account_deletion`, `request_book_deletion`, `cancel_book_deletion`, `delete_entry`, `restore_entry`, `set_member_auto_add`, `record_policy_act`, `policy_actions_needed`, and the RLS helpers `is_child_member`, `is_child_parent`, `child_is_live`, `can_read_entry_photo`. Each checks `auth.uid()`.
Anything else new: stop and ask.

## Step 5. Validate the photo path rule

Only after step 2(a) returns no rows:
```sql
alter table public.entries validate constraint entries_photo_path_scoped;
```
Rollback: none needed; if it fails, nothing changed.

## Step 6. Set the consent pepper (before any account deletion runs)

Policy acceptances are kept 3 years after an account is deleted, under a peppered hash of the old user id. Generate a random value once (for example `openssl rand -hex 32`), store it in your password manager, and set it:
```sql
alter database postgres set app.consent_pepper = '<the random value>';
```
Never change it afterwards (old and new hashes would no longer match). Whether Supabase Vault is a better home for it is **Unverified**; the database setting works with the migration as written. Anyone with database owner access can read it, which is acceptable for a pseudonymisation pepper but not for a key.

## Step 7. Schedule the purge

Dashboard > Integrations > Cron (enables `pg_cron`), then:
```sql
select cron.schedule('scribe-purge-due', '17 * * * *', $$ select public.purge_due(); $$);
```
The `purge-worker` Edge Function (Storage deletion and account execution) is not built yet. Until it exists, letters and books are purged from Postgres on time, Storage paths queue up in `storage_purge_queue`, and account requests wait in `executing`. That is safe, but the published 31-day promise needs the worker before the first non-founder deletion.

Rollback: `select cron.unschedule('scribe-purge-due');`

## Step 8. Before files 5 to 7: what must exist first

File 5 turns on a server consent gate: from that moment **no letter, book, dictionary term, per-book setting, invite or photo is accepted** from anyone without a current Terms acceptance carrying `"age_attested": true` and a current `sensitive-data` acceptance. The rejection is SQLSTATE `SCCON`; deletion and tombstones are never blocked. So, in this order:

1. **The app build that talks to files 5 and 6 is ready** (section "App changes for files 5 to 7"). The old `create_child(text, date)` and `create_child_invite(uuid)` are dropped; an older build gets "function does not exist" on those two calls.
2. **Publish the policy versions** the gate reads. Today `policy_versions` is empty, so nobody could pass the gate. Counsel-approved text first; then, per document (`terms`, `sensitive-data`, and `contributor-notice` before the web page), with the real hash and permanent URL:
   ```sql
   insert into public.policy_versions (document, version, change_class, requires_reconsent, published_at, new_users_from, effective_at, content_sha256, url, summary)
   values ('terms', '1.0.0', 'initial', false, now(), now(), now(), decode('<sha256 hex of the published markdown>', 'hex'),
           'https://<domain>/legal/terms/1.0.0', '<one plain-language line>');
   ```
3. **Record your own acceptances** (the only account today), by opening the new app build and accepting the sheets, or as support-assisted acts:
   ```sql
   insert into public.policy_acceptances (profile_id, document, version, action, method, surface, app_version, platform, context)
   values ('<your profile id>', 'terms', '1.0.0', 'accept', 'support_assisted', 'apply_md', 'n/a', 'ios', '{"age_attested": true}'),
          ('<your profile id>', 'sensitive-data', '1.0.0', 'accept', 'support_assisted', 'apply_md', 'n/a', 'ios', '{}');
   ```
4. Pre-flight checks (read only):
   ```sql
   -- a) Books without a birthday or due date (file 6 adds children_has_date NOT VALID; fix these before step 12).
   select id from public.children where date_of_birth is null and due_date is null;
   -- b) Contributors today (expect none). Their existing in-book letters stay readable as they are;
   --    new and edited family letters follow the approval flow.
   select child_id, profile_id from public.child_members where role = 'contributor';
   -- c) Nothing already uses the new names (expect four nulls).
   select to_regclass('public.store_subscriptions'), to_regclass('public.store_notifications'),
          to_regclass('public.app_account_tokens'), to_regproc('public.review_family_letter');
   ```

## Step 9. Apply files 5, 6 and 7

For each file in order: SQL Editor > New query, `begin;` on the first line, paste the whole file, `commit;` on the last line, Run. Any error rolls the whole file back; copy the error and stop. Then record it:
```sql
insert into supabase_migrations.schema_migrations (version, name) values
  ('20261003000000', 'security_and_family'), ('20261003010000', 'children_and_entitlements'), ('20261003020000', 'purge_batching')
on conflict do nothing;   -- run after all three succeeded; or insert one row after each
```
File 5 creates restrictive policies and alters existing ones; it drops no policy, so it does not need the dashboard's drop-policy approval. It drops two functions (`create_child_invite(uuid)`, and in file 6 `create_child(text, date)`; in file 7 `purge_due(timestamptz)`, replaced by `purge_due(timestamptz, int)` with defaults, so the cron command `select public.purge_due();` keeps working).

## Step 10. Check the result

```sql
-- No public function is executable by anon (expect 0).
select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute');
-- Every client-visible table has its restrictive anonymous policy (expect 11).
select count(*) from pg_policies where schemaname = 'public' and permissive = 'RESTRICTIVE' and qual ~ 'is_anonymous';
-- Your own gate (run as yourself from the app, or check the rows): all true.
select * from public.content_gate_state('<your profile id>');
-- The old invite function is gone (expect null).
select to_regprocedure('public.create_child_invite(uuid)');
```
Then repeat the two classification and RLS queries from step 4. Advisors, expected and accepted in addition to step 4's list:
- **0029** for the new RPCs: `create_child(uuid, text, date, date)`, `create_first_run_children`, `create_child_invite(uuid, text, text)`, `revoke_invite`, `review_family_letter`, `withdraw_family_letter`, `my_sync_gate`, `get_plan_state`, `my_app_account_token`, and the helpers `my_role_in`, `my_auto_add_in`, `can_write_content`, `require_content_consent`, `book_has_plus`. Each starts with `require_user()` or answers only for the caller.
- **0010** on `book_entries` (unchanged; the view now applies the B F9 rule).
- Tables with RLS on and no policy (`app_account_tokens`, `store_subscriptions`, `store_notifications`): intentional, service role only.

## Step 11. Settings per environment

- Production: nothing (sandbox App Store notifications are recorded and ignored).
- Development and staging only: `alter database postgres set app.store_environment = 'sandbox';` so TestFlight and sandbox purchases count as Plus there.
- The App Store notification Edge Function (not built yet) calls `apply_store_transaction(...)` with the service role after verifying Apple's JWS; it never stores the signed payload.

## Step 12. Validate the new constraints

Only after step 8 (a) returns no rows:
```sql
alter table public.children validate constraint children_has_date;
alter table public.entries validate constraint entries_approval_book;
```
Rollback: none needed; a failed validate changes nothing.

## Step 13. Purge cron after file 7

The cron command is unchanged. When the `purge-worker` exists it should loop `select public.purge_due();` while the result's `"more"` is true, at most 10 times per run, and report each object and step through `record_purge_attempt(id, ok, error_code)` and `record_deletion_step(request, step, status, error_code)` so retries back off from 1 minute to 6 hours.

## Error codes the app must handle (all files)

| SQLSTATE | Meaning | PowerSync `uploadData` / RPC caller |
|---|---|---|
| `SCCON` | Consent missing: Terms with age attestation, or sensitive-data (detail lists `terms`, `age`, `sensitive-data`) | **Pause** the queue, keep the op, show the consent sheet; resume after the act is recorded |
| `SCANO` | Anonymous session refused | Permanent for that session; the web page goes through its gateway |
| `28000` | Not signed in | Refresh the session |
| `SCRAT` | Too many invites today (20 per book, 20 per parent, rolling 24 h) | Tell the person; retry tomorrow |
| `SCPLS` | Plus needed to start another book | Keep the book on the phone, offer Plus once (TDD 08 2.5) |
| `SCCID` | Child id is not a device UUIDv7, or is someone else's | Permanent; a client bug |
| `SCINV` | Invite cannot be used (role, used, expired, revoked, already a member) | Show the matching invite error |
| `SCAPR` | Client tried to change `approval`, `reviewed_by` or `reviewed_at` | Permanent; drop those columns from uploads |
| `SCIMM`, `SCTMB`, `SCLPG`, `SCDEL`, `SCPAR` | As in step 4 (`SCDEL` now also means "this book is deleted" for new or edited letters; `SCIMM` also covers `profiles.first_run_closed_at`) | Permanent: `rejected_writes` |
| `P0002` | Not found (also when the caller may not see it) | Permanent |
| `22023` | Bad argument (dates, names, decision, context keys, `source = 'support'`) | Permanent; a client bug |

## Rolling back files 5 to 7

Prefer fixing forward. Everything is additive except the dropped functions, which must not come back (`create_child_invite(uuid)` is the privilege escalation; `create_child(text, date)` skips the Plus rule and device ids).
- **Consent gate blocks real people by mistake** (the most likely emergency): neutralise it without dropping anything, then fix forward.
  ```sql
  create or replace function public.require_content_consent() returns void language plpgsql volatile security definer
    set search_path = public, pg_catalog as $$ begin return; end; $$;
  create or replace function public.can_write_content() returns boolean language sql stable security definer
    set search_path = public, pg_catalog as $$ select auth.uid() is not null and not public.is_anonymous(); $$;
  ```
  This also lifts LEGAL-REQ-006 enforcement on the server, so treat it as an incident and restore the real bodies from file 5 the same day.
- **Family visibility**: to go back to the step-4 read model, re-run the `create or replace view public.book_entries` and `can_read_entry_photo` definitions from `20261002020000_data_governance.sql` (keep the trailing `approval` column in the view; a replace cannot drop it). This re-exposes all in-book letters to contributors (B-REQ-011), so only as a short bridge.
- **Anonymous guard**: `drop policy <table>_no_anonymous on public.<table>;` per table (needs the dashboard's approval for policy drops). There is no reason to, since the app never uses anonymous sessions.
- **File 6 entitlement tables**: dropping them loses only data the reconcile job can rebuild from Apple; drop `store_notifications`, `store_subscriptions`, `app_account_tokens` in that order.
- **File 7**: restore the step-4 `purge_due(timestamptz)` body from `20261002020000_data_governance.sql` under that signature and `drop function public.purge_due(timestamptz, int);` The new columns can stay.

## App changes that must ship with or before step 3 reaching real families

- Co-parents and contributors read other people's letters from `book_entries`, not `entries` (the `entries` table now returns only your own letters). PowerSync Sync Streams for members must select from `book_entries` columns; the author's own stream may use `entries`.
- `uploadData` treats SQLSTATEs `SCIMM`, `SCTMB`, `SCLPG`, `SCDEL` and the new `SCPAR` (parents-only book setting) as permanent, not retryable.
- Restoring a deleted letter uses `restore_entry()`; clearing `deleted_at` directly is refused.
- Photo paths must be `{child_id}/{author_id}/{entry_id}.jpg` (or `.jpeg`, `.heic`, `.png`).
- Safety tiers stay in the local database only; there is no server table to write to.

## App changes for files 5 to 7

- Children: `create_child(p_id, p_name, p_date_of_birth, p_due_date)` with the device's UUIDv7 (the same id local letters already use; retries are safe). First run sends every child at once to `create_first_run_children('[{"id", "name", "date_of_birth", "due_date"}]')` (1 to 6; all free, one time). A later child needs Plus (`SCPLS`).
- Invites: `create_child_invite(p_child, p_role, p_signs_as)` with `p_role` `'parent'` or `'contributor'`; only parents see the invite button. `revoke_invite(id)`.
- Family letters: for contributors `in_book = true` means "send to the parents". The server keeps the letter `approval = 'pending'` and `in_book = false` until a parent calls `review_family_letter(id, 'added' | 'set_aside', expected_state)`; show status from `approval`. Never upload `approval`, `reviewed_by` or `reviewed_at`. A contributor takes a letter back with `withdraw_family_letter(id)`. Editing the words of an added family letter returns it to pending unless the parents turned on auto-add for that person.
- Reads: `book_entries` now follows B F9 and has an `approval` column; parents' "Letters from family" reads `approval in ('pending', 'set_aside')`.
- Consent: record `terms` accept with `context = {"age_attested": true, "age_signal": ...}` and `sensitive-data` accept before the first upload; read `my_sync_gate()` to decide which sheet to show; context keys are allowlisted (`auth`, `age_attested`, `age_signal`, `scope`, `crash`, `usage`, `product`, `intro_offer`, `storefront`, `mode`).
- Policy sheet: `policy_actions_needed()` returns the version to show; during a notice window new users get the new version.
- Plus: `my_app_account_token()` gives the UUID to pass as `appAccountToken` to `Product.purchase`; `get_plan_state()` and `book_has_plus(child)` read the result. Account deletion `source` is `ios`, `android` or `web` only.
- PowerSync streams: `book_entries` is a view; the member stream must apply the same B F9 predicate on `entries` (TDD 02 3.2 `book_access`, not built in these files).

## Rolling back step 3 after it committed

Prefer fixing forward with a new migration. Never re-introduce `on delete cascade` on `children.created_by` (it deletes co-parents' letters). If reads break for co-parents and the app cannot ship the `book_entries` change in time, this restores the previous read model without losing any data:
```sql
begin;
drop policy if exists entries_select on public.entries;
create policy entries_select on public.entries for select to authenticated using (
  author_id = (select auth.uid())
  or (in_book and deleted_at is null and public.is_child_member(child_id) and public.child_is_live(child_id)));
drop policy if exists entry_photos_read on storage.objects;
create policy entry_photos_read on storage.objects for select to authenticated using (
  bucket_id = 'entry-photos'
  and ((storage.foldername(name))[2] = (select auth.uid())::text or public.can_read_entry_photo(name)));
commit;
```
This re-exposes other authors' raw transcripts to book members (the K-09 problem); use it only as a short bridge.

Everything else in the migration is additive (new tables, columns, functions, triggers, comments). The one destructive change is dropping `safety_events`; its rows exist only in backups taken before step 3, and restoring them would contradict PRD K-06. A full rollback means restoring the database backup from "Before you start" (Storage is unaffected).

## Performance budgets

`supabase/tests/perf.test.mjs` queries the book as a signed-in co-parent through RLS and `book_entries`; `sync_perf.test.mjs` does the same for the sync RPCs. Both run in two modes (17 Oct 2026, after S20's #214: a slow CI runner had turned `required` red on a docs-only PR):
- **Every pull request** (`npm run test:db`): 250 families x 400 letters (100,000 entries). Every plan check runs: no plan may sequentially scan `entries`, `children` or `child_members`, and each plan must name its index (`entries_book_page_idx` for the book and search reads, `entries_pkey` for one letter, `child_members_profile_idx` for membership, `entries_sync_cursor_idx` for the pull page). The plans are the same as at 1,000 families (compared line by line, costs aside); 100 x 100 is too small (the planner switches to sequential scans). p95 times are printed, not checked.
- **Nightly** (`PERF_BUDGETS=1 npm run test:db:perf`, the `perf` job in `.github/workflows/nightly.yml`, which runs once the default branch is `develop`, AF-05): 1,000 families x 400 letters (400,000 entries, about 390 MB with indexes), every plan check and every p95 budget below. About 1.5 minutes locally.

Times are server-side execution in PGlite (single-threaded WASM Postgres), 200 samples after 20 warm-up queries; native Postgres on Supabase is faster, and the client-side budget including the network is PRD 7.2 (read p95 300 ms). No budget value changed with the split.

| Query | What | Measured p95 (2 Oct 2026) | After file 5 (3 Oct 2026) | Budget p95 |
|---|---|---|---|---|
| `book_page` | 60 newest in-book letters of one book | 6.1 ms | 7.0 ms | 15 ms |
| `book_full` | Every in-book letter of one book (about 356) | 8.5 to 8.8 ms | 9.3 ms | 25 ms |
| `search_common` | Full-text search, common words, one book | 3.8 to 4.0 ms | 4.2 ms | 12 ms |
| `search_rare` | Full-text search, rare word, one book | 3.7 to 3.8 ms | 4.0 ms | 12 ms |
| `letter_member` | One letter through `book_entries` | 1.3 to 1.8 ms | 1.6 ms | 4 ms |
| `letter_author` | One own letter from `entries` (with raw transcript) | 0.9 to 1.2 ms | 1.0 ms | 4 ms |

File 5's `book_entries` keeps the same plan shape (bitmap scan of `entries_book_page_idx`, membership resolved once from `child_members_profile_idx`). A first draft that OR-ed two membership subqueries measured 21 ms p95 on `book_page`; the shipped predicate uses one membership subquery plus a parents-only clause for pending letters. On a busy machine all six numbers move together by up to about 1.5x.

Plans: book and search queries use the new partial index `entries_book_page_idx (child_id, occurred_on desc, captured_at desc) where in_book and deleted_at is null`; membership is resolved once per query from `child_members_profile_idx`, so cost follows the reader's own books, not the number of families. Synthetic letters are about 24 words; real letters are longer, which mainly affects search recheck time. Scale knobs: `PERF_FAMILIES` (default 250, or 1,000 with `PERF_BUDGETS=1`), `PERF_ENTRIES` (400; the sync first page needs at least 200), `PERF_SAMPLES`; `npm run test:db:perf` runs only the two perf tests.

## File 20261004000000_plus_on_device_only.sql (Plus checked on the device, 3 Oct 2026)

Founder decision 3 (Apple only, out of the box, checked on the device, no server) and ADR 0013 as decided. This is file 8: apply it after file 7 (`20261003020000_purge_batching.sql`). It can go in the same session as files 5 to 7; if file 6 (`20261003010000_children_and_entitlements.sql`) was never applied, apply file 6 first and then this file, because this file replaces functions file 6 and file 7 create.

What it does:
- Drops `store_notifications`, `store_subscriptions` and `app_account_tokens`, and the functions `apply_store_transaction`, `my_app_account_token`, `get_plan_state`, `has_plus`, `book_has_plus` and `store_environment_allowed`. Nothing of ours sees purchases: do not create an App Store Server Notifications URL or an In-App Purchase key for this project.
- Redefines `create_child` and `create_first_run_children` without the Plus rule. `create_child_row` loses its `p_free` argument (5 arguments now). `SCPLS` is retired: the server never refuses a book for Plus. The first-run batch still closes `profiles.first_run_closed_at`.
- Redefines `purge_due(timestamptz, int)` without the `store_notifications` retention line. Any later migration that redefines `purge_due` must start from this version.

Before applying in an environment where file 6 already ran, check that the ledger holds nothing worth keeping (it only ever held test purchases, because no notification endpoint was built):
```sql
select (select count(*) from public.store_subscriptions) subs,
       (select count(*) from public.store_notifications) notes,
       (select count(*) from public.app_account_tokens) tokens;
```

Check the result:
```sql
select to_regclass('public.store_subscriptions'), to_regclass('public.store_notifications'), to_regclass('public.app_account_tokens');
-- all three null
select proname from pg_proc where pronamespace = 'public'::regnamespace
   and (proname in ('has_plus', 'book_has_plus', 'get_plan_state', 'my_app_account_token', 'apply_store_transaction', 'store_environment_allowed')
        or prosrc ~ 'SCPLS|store_notifications');
-- no rows
select pg_get_function_identity_arguments('public.create_child_row'::regproc);
-- p_uid uuid, p_id uuid, p_name text, p_date_of_birth date, p_due_date date
select public.purge_due(now(), 1);  -- runs (service role)
```

Settings: `app.store_environment` (Step 11) is no longer read by anything; it can stay set or be reset.

Rollback: re-running file 6's entitlement section restores the empty tables and functions; there is no data to restore. Prefer fixing forward.

App changes that ship with this file:
- The app never calls `my_app_account_token`, `get_plan_state` or `book_has_plus`; Plus comes from StoreKit 2 on the device (`apps/mobile/src/lib/billing`).
- `SCPLS` can still arrive from a server that does not have this file yet. Keep the book on the phone and retry sync later (TDD 08 2.5); never delete or hide it.
- The "Plus" line under "App changes for files 5 to 7" above is replaced by this section.

Trade-off (follows from founder decision 3; recorded in ADR 0013): Plus is enforced on the device only. A modified app could start more books or more Read together sessions than the free allowance. Every Plus feature in v1.0 runs on the phone and costs nothing on the server, so nothing server-side is exposed. A future server-cost Plus feature (backup upload) needs its own check at its own endpoint; see ADR 0013.

## Step 14. Apply files 8 to 11, in filename order

The order is the filename order, the same order `npm run test:db` applies them in:

1. `20261004000000_plus_on_device_only.sql` (file 8, section above)
2. `20261004100000_sync_engine.sql` (file 9)
3. `20261004200000_ops_deletion_worker.sql` (file 10)
4. `20261004300000_insights_aggregates.sql` (file 11)

Same method as step 9 (`begin;` first line, whole file, `commit;` last line; any error rolls the file back: copy it and stop). Record each one:
```sql
insert into supabase_migrations.schema_migrations (version, name) values
  ('20261004000000', 'plus_on_device_only'), ('20261004100000', 'sync_engine'),
  ('20261004200000', 'ops_deletion_worker'), ('20261004300000', 'insights_aggregates')
on conflict do nothing;   -- after all four succeeded; or one row after each
```
Then add the four file names to `.github/migrations-applied.txt` in the same pull request that records the apply.

Check the result:
```sql
-- File 9: the sync RPCs exist and only signed-in people can call them (expect 3 rows, all true / false).
select p.proname, has_function_privilege('authenticated', p.oid, 'execute') signed_in, has_function_privilege('anon', p.oid, 'execute') anon
  from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname in ('sync_pull', 'sync_push', 'sync_books');
-- File 9: the service-only sync functions (expect 2 rows, all false).
select p.proname, has_function_privilege('authenticated', p.oid, 'execute') signed_in
  from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname in ('sync_begin_epoch', 'sync_housekeeping');
-- File 9: the first epoch (expect 1, 'initial').
select epoch, reason from public.sync_epochs;
-- Files 10 and 11: the two private schemas exist and nothing public reaches them (expect false, false).
select has_schema_privilege('authenticated', 'ops', 'usage'), has_schema_privilege('authenticated', 'insights', 'usage');
-- File 11 (service role): counts only, small cells null.
select * from public.insights_aggregates(4) limit 5;
```
Advisors, expected and accepted: **0029** for the security-definer RPCs `sync_pull` and `sync_books` (each starts with `require_user()` and answers only for the caller). `sync_rate_windows` is an unlogged table by design (counters need no crash safety or backup).

Rollback: prefer fixing forward. File 9 adds tables and functions only (plus two columns on `entries` with defaults); file 10 and 11 add their own schemas, which `drop schema ops cascade` / `drop schema insights cascade` remove before any real use.

## Step 15. Settings for files 8 to 11

- **Exposed schemas: `public` only.** Dashboard > Project Settings > Data API > Exposed schemas. Never add `ops`, `insights` or `sync_private` (file 17) (or `graphql_public` unless GraphQL is wanted; the app does not use it). `ops` and `insights` are reached only through service-role functions; `sync_private` only from inside `sync_push`, `sync_pull` and triggers (signed-in people hold usage on it so `sync_push` can run as the caller; exposing it would turn its helpers into RPCs).
- **Sync housekeeping, hourly** (pg_cron, enabled in step 7). It trims op receipts older than 30 days and rate windows older than a day:
  ```sql
  select cron.schedule('scribe-sync-housekeeping', '43 * * * *', $$ select public.sync_housekeeping(); $$);
  ```
  Check after an hour: `select status, start_time from cron.job_run_details where jobid = (select jobid from cron.job where jobname = 'scribe-sync-housekeeping') order by start_time desc limit 3;`
  Rollback: `select cron.unschedule('scribe-sync-housekeeping');`
- **Restore epoch.** After any database restore, before clients reconnect and after the purge-ledger replay, run `select public.sync_begin_epoch('database_restore', '<restore point ISO>');` with the service role (docs/ops/runbooks/restore-drill.md step 4). Phones then re-upload what the restore lost; they never delete anything because of it. The old `app.sync_epoch` database setting from the deleted draft is not read by anything.
- **Purge worker** (file 10): deploy and schedule as in docs/ops/README.md ("Deploy", steps 4 and 5; `supabase/cron/purge-worker.sql`). Keep the hourly `scribe-purge-due` job from step 7 as a backstop.
- **Insights reader** (file 11): the file creates the `insights_reader` role (no login) and grants it to `authenticator` when that role exists. Nothing else to set; the weekly insights run reads with the service role (docs/analytics/INSIGHTS_LOOP.md).
- `app.store_environment` (step 11) is no longer read by anything after file 8.

## Step 16. App changes for files 8 to 11

- Sync (`apps/mobile/src/lib/sync`) calls `sync_pull` and `sync_push` only. It starts after the 18+ gate and only with a signed-in, consented session (`syncAllowed()`), so nothing calls these before step 14.
- Account deletion's "What happens" lines call `sync_books()` (file 9 section 8b).
- The app never calls anything in `ops` or `insights`.


## File 20261005000000_family_cap_language_idempotency.sql (3 Oct 2026, db-followup)

File 12. Apply after file 11 (`20261004300000_insights_aggregates.sql`), in the same way as step 9. It adds and replaces; it drops nothing that holds data. Tests: `db_followup_family_cap`, `db_followup_language`, `db_followup_idempotency_rates` (108 checks), plus new rows in `access_matrix`; `npm run test:db` now runs 15 files.

What it does:
- **Two parents per book (D-069, recommended).** `create_child_invite(p_child, 'parent', ...)` and `accept_child_invite` refuse with `SCCAP` when the book already has `app.max_parents_per_book` parents (default 2). Both lock the book row first, so two people accepting at once cannot make a third parent. A further parent is added only by support (below). Security review H2: an invite whose maker is no longer a parent of the book is refused, and a parent who leaves (any path) has their open invites revoked.
- **Leaving and removing.** `leave_child(p_child, p_keep_in_book default true)` for any member ("take my letters out" takes them out of the book, never deletes them; the last parent gets `SCLPG` as before). `remove_child_member(p_child, p_member, p_set_aside default false)`: either parent removes a family member alone, no veto; their letters stay unless `p_set_aside`, which sets them aside. A parent is never removed by the other parent (`42501`); only their own `leave_child` ends it. Listing members needs nothing new (`child_members` under RLS, `sync_books()`, `sync_pull()` meta).
- **`entries.language`**: one of `en hi es zh fr ar pt` or null, L4, written and read by the author only (decision below). `sync_push` field group `language`; `sync_pull` returns it on the caller's own letters only; `insights.language_mix` now reads it with static SQL (k = 10 unchanged).
- **Idempotency keys** for `create_child_invite` and `record_policy_act`, read from the `idempotency-key` request header (ADR 0017 rule 3). Table `idempotency_keys` (functions only; no client access), 24 hours, trimmed by the hourly `scribe-sync-housekeeping` job (step 15). A repeat with the same key and arguments replays the first result; other arguments with the same key are `22023`. An invite repeat issues a fresh token for the same invite, because tokens are never stored.
- **Server rate limits** (`SCRAT`): `request_account_deletion` 5 new requests and `cancel_account_deletion` 5 cancellations per person per rolling 24 h (a repeat that returns the open request, or a cancel with nothing to cancel, is free); `record_policy_act` 60 per hour and 200 per 24 h; `policy_actions_needed` 60 per hour (it is now VOLATILE because it counts); `accept_child_invite`, `leave_child`, `remove_child_member` 120 per hour together. Sync limits keep their numbers, but the counters (`sync_rate_windows`) are no longer writable by their owner (security review M3: a client could reset its own limit); they change only through `rate_hit()`.
- **Photos** (security review L2): renaming an object can no longer move it into a book the author does not belong to, or into a deleted book.

### Step 17. Before file 12

Read only:
```sql
-- a) Books with more than two parents today (expect none). Nothing changes for them, but they cannot add another parent.
select child_id, count(*) from public.child_members where role = 'parent' group by 1 having count(*) > 2;
-- b) Open invites whose maker is no longer a parent of the book (file 12 refuses them at accept; expect none).
select count(*) from public.child_invites i
 where i.accepted_at is null and i.revoked_at is null and i.expires_at > now()
   and not exists (select 1 from public.child_members m where m.child_id = i.child_id and m.profile_id = i.invited_by and m.role = 'parent');
-- c) The new names are free (expect five nulls).
select to_regclass('public.idempotency_keys'), to_regprocedure('public.leave_child(uuid, boolean)'),
       to_regprocedure('public.remove_child_member(uuid, uuid, boolean)'), to_regprocedure('public.rate_hit(text)'),
       (select attname from pg_attribute where attrelid = 'public.entries'::regclass and attname = 'language' and not attisdropped);
```
App compatibility: no signature changes, so today's build keeps working. `SCCAP` is reachable only through a second co-parent invite, which the app already hides. `sync_pull` rows gain a `language` key that today's build ignores.

### Step 18. Apply file 12

SQL Editor > New query, `begin;` on the first line, the whole file, `commit;` on the last line, Run. Any error rolls the file back; copy it and stop. Then:
```sql
insert into supabase_migrations.schema_migrations (version, name) values ('20261005000000', 'family_cap_language_idempotency')
on conflict do nothing;
```
Add `20261005000000_family_cap_language_idempotency.sql` to `.github/migrations-applied.txt` in the pull request that records the apply.

Check the result:
```sql
select public.max_parents_per_book();                                           -- 2
select p.proname, has_function_privilege('authenticated', p.oid, 'execute') signed_in, has_function_privilege('anon', p.oid, 'execute') anon
  from pg_proc p where p.pronamespace = 'public'::regnamespace
   and p.proname in ('leave_child', 'remove_child_member', 'rate_hit', 'max_parents_per_book', 'request_idempotency_key',
                     'idempotency_claim', 'idempotency_store') order by 1;
-- leave_child, rate_hit, remove_child_member: true / false; the other four: false / false
select has_table_privilege('authenticated', 'public.sync_rate_windows', 'select') reads,
       has_table_privilege('authenticated', 'public.sync_rate_windows', 'delete') resets,
       has_table_privilege('authenticated', 'public.idempotency_keys', 'select') keys;   -- true, false, false
select provolatile from pg_proc where proname = 'policy_actions_needed';         -- v
select insights.language_mix_available();                                       -- true
```
Then repeat the classification and RLS queries from step 4 (expect 0 and 0). Advisors, expected and accepted: **0029** for `leave_child`, `remove_child_member` and `rate_hit` (each starts with `require_user()`); `idempotency_keys` has RLS on and no policy (intentional: functions only).

### Step 19. Settings for file 12

- **Parents per book.** Nothing to set for D-069. If you decide against it, raise the limit (1 to 10; anything else reads as 2):
  ```sql
  alter database postgres set app.max_parents_per_book = '10';
  ```
  Back to the default: `alter database postgres reset app.max_parents_per_book;`. A database setting reaches new connections only; the API's pooled connections pick it up as they are recycled (Assumption: within about 30 minutes; a project restart from the dashboard applies it at once).
- **A further parent through support** (FAM-11, D-069), service role, after verifying the request:
  ```sql
  insert into public.child_members (child_id, profile_id, role) values ('<book id>', '<profile id>', 'parent');
  select public.ops_audit_write('<operator>', 'safety_removal', 'third_parent_added', '<ticket>', '<profile id>', '<book id>');
  ```
  Removing a parent for safety (Terms 9.4) is the same with `delete from public.child_members where child_id = '<book id>' and profile_id = '<profile id>';` and reason `parent_removed`; the last-parent guard still applies, and their open invites are revoked automatically. Service deletes write no `member_removed` row, so the ops audit line is the record.
- **Cron:** nothing new. The hourly `scribe-sync-housekeeping` job now also trims idempotency keys older than 24 hours (its result gains `idempotency_keys`).

### Error codes added or widened by file 12

| SQLSTATE | Where | App |
|---|---|---|
| `SCCAP` (new) | `create_child_invite` with role parent, `accept_child_invite` of a parent invite: the book already has the most parents allowed (detail: the limit) | Tell the person ("This book already has two parents"); never retry |
| `SCRAT` | now also `request_account_deletion`, `cancel_account_deletion`, `record_policy_act`, `policy_actions_needed`, `accept_child_invite`, `leave_child`, `remove_child_member` | Tell the person or skip quietly (`policy_actions_needed` already falls back to `policy_versions`) |
| `22023` | malformed `idempotency-key`, or a key reused with other arguments; `remove_child_member` on yourself | Permanent; a client bug |
| `42501` | `remove_child_member` on a parent | Permanent; the app never offers it |
| `SCINV` | also: a repeat of an invite request whose invite is closed; an invite whose maker left | As today (message says "not found" or "closed") |

### Decision: a letter's language is the author's only

`book_entries` does not carry `entries.language`, so co-parents and family never receive it, even for letters in the book. Why: no v1.0 reader feature needs it (script and direction come from the text itself, `packages/core/src/lang/script.ts`); it is L4 personal data (DATA_CLASSIFICATION, a person's language); and adding it later is one appended view column when a feature needs it (for example a per-letter voice in Read together or print typesetting), whereas taking it back from phones is not possible. The k-anonymised `insights.language_mix` is the only other reader.

### App changes for file 12 (mobile and platform owners)

- **Idempotency keys must survive retries.** `createCoParentInvite` (`lib/family/invites.ts`) and `recordConsentStep` (`lib/auth/consent.ts`) call `idempotencyKey()` inside the request, so every retry carries a new key and the server cannot recognise it. Make the key once per user action and pass the same one to every retry of that action (supabase-js never retries a POST itself).
- **Invites:** map `SCCAP` in `invite-errors.logic.ts` to its own kind and line; packages/api `SQLSTATE_RULES` needs `SCCAP` as `tell_user` with a new code (for example `parents_full`), otherwise it falls to "reject".
- **Family screen:** leaving calls `leave_child(p_child, p_keep_in_book)` (not a direct `child_members` delete, which still works but cannot take letters out); removing a family member calls `remove_child_member(p_child, p_member, p_set_aside)`, offered only for family members.
- **Letter language:** local migration v5 adds `entries.language TEXT` (the app keeps it today only as the device setting `speech.letterLanguage.<id>`); the outbox snapshot sends `language` in `entry.upsert` data and lists `language` in `changed` when it changes; `FieldGroup`/`ALL_GROUPS` in `lib/sync/types.ts` gain `'language'`; the merge stores `language` from own rows only and never expects it on others' rows.
- **packages/api `standards.ts`:** `policyActionsNeeded.rateLimit.enforcedBy` becomes `'rpc'`; add `leaveChild` and `removeChildMember` (`write_rpc`, `natural_id`, 120 per hour per user, `rpc`); ADR 0017 section 6 can close the idempotency and sync-limit gaps.

### Rolling back file 12

Prefer fixing forward. Partial switches, each on its own:
- Parent cap: raise `app.max_parents_per_book` (step 19). No code change.
- Idempotency: `create or replace function public.request_idempotency_key() returns uuid language sql stable set search_path = public, pg_catalog as $$ select null::uuid $$;` makes every call behave as before the file.
- Leaving and removing: `revoke execute on function public.leave_child(uuid, boolean), public.remove_child_member(uuid, uuid, boolean) from authenticated;`

Full rollback (tested in PGlite: afterwards the original sync, security, governance, RLS and classification suites pass, including a third parent): in one transaction,
1. Re-run these `create or replace function` blocks from the earlier files, unchanged: `sync_pull`, `sync_push`, `sync_housekeeping` (file 9, `20261004100000`); `insights._language_counts` (file 11); `create_child_invite`, `accept_child_invite`, `request_account_deletion`, `cancel_account_deletion`, `record_policy_act`, `policy_actions_needed` (file 5, `20261003000000`), and file 5's `alter policy entry_photos_author_update` statement.
2. Then:
```sql
drop trigger entries_language_guard on public.entries;
drop trigger child_members_revoke_invites on public.child_members;
drop function public.entries_language_guard();
drop function public.child_members_revoke_invites();
drop function public.leave_child(uuid, boolean);
drop function public.remove_child_member(uuid, uuid, boolean);
drop function public.rate_hit(text);
drop function public.idempotency_claim(uuid, text, jsonb);
drop function public.idempotency_store(uuid, text, jsonb);
drop function public.request_idempotency_key();
drop function public.max_parents_per_book();
drop table public.idempotency_keys;
drop index if exists public.deletion_requests_profile_idx;
alter table public.entries drop constraint entries_language_code;
alter table public.entries drop column language;          -- erases recorded languages
delete from public.sync_rate_windows where bucket not in ('pull', 'push');
alter table public.sync_rate_windows drop constraint sync_rate_windows_bucket_check;
alter table public.sync_rate_windows add constraint sync_rate_windows_bucket_check check (bucket in ('pull', 'push'));
grant insert, update, delete on public.sync_rate_windows to authenticated;   -- file 9's sync functions write it directly
```
Step 1 must come first: the replaced functions call the objects step 2 drops. The rollback re-opens the client-resettable sync counter and the stale-invite path (security review H2, M3).

## Files 13 to 16: the R-17 gate (15 Oct 2026, stream S02)

Four files, one work package each (PRD V2 `08-delivery.md` section 6.3, S02 wave 1). They are the database half of the R-17 security gate (D-089 in PR #128; PRD V2 09 R-17): nobody outside the family signs in before they are on staging and the shared security review has passed (`docs/security/REVIEW_R17_CHECKLIST.md`). Apply them after file 12, in filename order. Each adds or replaces; none drops a table or a column that holds data.

| Order | File | Work package | What it does |
|---|---|---|---|
| 13 | `20261015000000_v1_gate_membership_sync_hardening.sql` | BL-331 with BL-332 | Family members never read the birth date or due date from the table (column privileges, review M1); the pull digest never reveals private writes (M5); op receipts per person (L1); 20 new books a day, 300 letter deletes or restores an hour, `sync_books` in the pull bucket (M3); the reading views are read-only (PR #32 DB-01: on develop a co-parent could rewrite the other parent's letter through `book_entries`); every function's `search_path` is `pg_catalog, ..., pg_temp` (PR #51 finding 1) |
| 14 | `20261015010000_v1_gate_peek_invite_consent_pepper.sql` | `peek_invite` with BL-334 | `peek_invite(token)`: the inviter's sign-off name and the role, before consent, nothing written (H2); the consent pepper fails closed (`55000`), and `ops_deletion_sla()` names it so the purge worker sends the `pepper_missing` alert |
| 15 | `20261015020000_v1_gate_coparent_invites_undo.sql` | WP-F11-01 | Device-made invite id, token hash and code hash (new `create_child_invite` overload; the 3-argument one stays); family invites off unless `app.contributors_enabled`; second consent behind `app.family_share_consent_required`; `undo_parent_join` for 72 hours; leaving only through `leave_child`; `child_member_prefs.notify_letters`; `accept_child_invite_by_code` for the service role |
| 16 | `20261015030000_v1_wire_contract_columns.sql` | v1.0 wire contract | `entries.occurred_precision`, `base_direction`, `author_edits`, `locked_spans`, `pack_ref` (set once, then immutable); `dictionary_terms.forms`; the sync op parser and pull rows carry them; `prefs.upsert` takes `notify_letters` |

Sections 0 to 4 of file 13 and both sections of file 14 are ported from branch `auto/2026-10-05-fixes` at `d1cbddb` (file `20261005100000_db_fix_privacy_limits.sql`), as `docs/agents/PORT_MAP_2026-10-13.md` section 5 asks. If the coordinator renames the files at merge (08 section 4), use the new names below; the order does not change.

Tests: `v1_gate_hardening`, `v1_gate_limits_peek_pepper`, `v1_gate_search_path`, `v1_gate_coparent`, `v1_wire_contract`, plus new rows in `access_matrix`; `npm run test:db` now runs 20 files.

### How these files reach a project

**Through CI, not the SQL Editor** (D-041, D-089: "migrations are applied to staging, then production, through CI"). `.github/workflows/deploy-db.yml` (PR #36) runs `supabase db push --dry-run` then `supabase db push` with the environment's database URL:
- **Staging (`scribe-staging`)**: the workflow runs on a push to `develop` that changes `supabase/migrations/**`, through the GitHub Environment `staging` (required reviewer), or by a manual run on `develop` to catch up; a push to `main` deploys nothing to a database (`deploy-db.yml`, decided 17 Oct 2026).
- **Production (`scribe-prod`)**: a `db-v*` tag on a commit on `main`, through the GitHub Environment `production` (your approval). Never before staging has run them and the checks in step 21 are green.
- `supabase db push` applies every file the target has not recorded, in filename order, each in its own transaction. On a fresh `scribe-staging` that is files 1 to 16 in one run, so steps 17 and 20 run before the first push, against an empty project they find nothing, and the run stops at the first file that fails, leaving the later ones unapplied.
- Known risk carried from DEPLOY.md: DB-16 (file 3 has its own `begin` / `commit`). The first `db-cli.yml` run on this PR (`supabase db reset` on the real Postgres image) is the first check outside PGlite.
- After each environment: the run summary lists the files to add to `.github/migrations-applied.txt`; record them in a pull request (DEPLOY.md "After a deploy"). From then on the migration guard blocks any edit to them.

If you must apply by hand (an incident, DEPLOY.md "Rollback"), use the SQL Editor as in step 18: `begin;`, the whole file, `commit;`, then insert its version into `supabase_migrations.schema_migrations`. Files 13, 14 and 15 refuse a second run (`55000`, "already applied"); file 16 fails on its first `add constraint` (`42710`). Nothing is changed by a refused run.

### Step 20. Before files 13 to 16 (staging first, then production)

Read only:
```sql
-- a) The new names are free (expect nine nulls).
select to_regprocedure('public.peek_invite(text)'), to_regprocedure('public.invite_token_well_formed(text)'), to_regprocedure('public.undo_parent_join(uuid, uuid)'),
       to_regprocedure('public.book_update(uuid, jsonb)'), to_regprocedure('public.sync_op_claim(uuid)'),
       to_regprocedure('public.consent_pepper_ready()'), to_regprocedure('public.accept_child_invite_by_code(uuid, bytea)'),
       to_regprocedure('public.create_child_invite(uuid, uuid, text, bytea, bytea, text)'),
       (select attname from pg_attribute where attrelid = 'public.entries'::regclass and attname = 'pack_ref' and not attisdropped);
-- b) Open family (contributor) invites (expect 0: no build creates them). After file 15 they cannot be accepted.
select count(*) from public.child_invites where role = 'contributor' and accepted_at is null and revoked_at is null and expires_at > now();
-- c) Functions in public, ops or insights owned by another role or by an extension (expect none; file 13 re-pins only ours,
--    and the sweep test would flag the rest).
select n.nspname, p.proname, pg_get_userbyid(p.proowner) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname in ('public', 'ops', 'insights')
   and (p.proowner <> (select oid from pg_roles where rolname = current_user)
        or exists (select 1 from pg_depend d where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e'));
-- d) The consent pepper is set (step 6). Expect true before any account deletion runs; file 14 refuses deletions without it.
select char_length(btrim(coalesce(current_setting('app.consent_pepper', true), ''))) >= 32 as pepper_ready;
-- e) No letter exists in this project yet (expect 0). Letters, not sync receipts: receipts are trimmed after 30 days,
--    so a project whose phones synced and then went quiet would read 0 there. If not 0, stop and tell S02: letters that
--    left a reader's view before file 13 have no left_*_xid, so that reader's next digest check can miss them (PR #140
--    fresh review N2); the fix is a backfill in a forward migration, or making the first pull after the deploy a verify pull.
select count(*) from public.entries;
```
App compatibility (the build in TestFlight today has the switch off, so nothing calls these yet; for a switch-on build):
- `select *` on `children` is refused (`42501`). The app names its columns (`lib/family/invites.ts` reads `name` only) and reads dates through `sync_books` and `sync_pull`. Any new client code must do the same.
- A direct delete on `child_members` is refused (`42501`). The app has no such call; leaving is `leave_child(p_child, p_keep_in_book)`.
- `sync_pull` own rows gain five keys and others' rows two; `sync_push` accepts them when present and never clears them when absent. Today's sync client ignores keys it does not know.
- Family invites are refused (`SCINV`, detail `role_disabled`). The app creates parent invites only.
- `peek_invite` and `accept_child_invite` refuse a token outside the app's own shape (`isInviteToken`: 32 to 128 URL-safe characters) with `SCINV`. Phones that make their own tokens (file 15) must use at least 128 random bits.
- After someone leaves or is undone, their used token answers `SCINV` ("invite already used"); it never re-joins or answers `joined: true`.

### Step 21. After each environment: check the result

```sql
-- G-08: no API role reads the two dates from the table; names still readable.
select has_column_privilege('authenticated', 'public.children', 'date_of_birth', 'select') dob,
       has_column_privilege('authenticated', 'public.children', 'due_date', 'select') due,
       has_column_privilege('authenticated', 'public.children', 'name', 'select') name;          -- false, false, true
-- DB-01: the reading views are read-only.
select has_table_privilege('authenticated', 'public.book_entries', 'update') upd,
       has_table_privilege('authenticated', 'public.book_entries', 'delete') del,
       has_table_privilege('authenticated', 'public.book_entries', 'select') sel;                -- false, false, true
-- G-10 and F11-REQ-011: no client writes receipts or memberships.
select has_table_privilege('authenticated', 'public.sync_op_receipts', 'insert') receipts,
       has_table_privilege('authenticated', 'public.child_members', 'delete') leave_direct;     -- false, false
-- search_path: every function of ours starts with pg_catalog and ends with pg_temp (expect 0 rows).
select n.nspname, p.oid::regprocedure, p.proconfig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname in ('public', 'ops', 'insights') and p.prokind = 'f'
   and not exists (select 1 from pg_depend d where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e')
   and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c
                    where c ~ '^search_path=(""|pg_catalog(, [a-z_]+)*, pg_temp)$');
-- New RPCs: signed in yes, anon no.
select p.proname, has_function_privilege('authenticated', p.oid, 'execute') signed_in, has_function_privilege('anon', p.oid, 'execute') anon
  from pg_proc p where p.pronamespace = 'public'::regnamespace
   and p.proname in ('peek_invite', 'undo_parent_join', 'book_update', 'sync_op_claim', 'accept_child_invite_by_code',
                     'consent_pepper_ready', 'contributors_enabled', 'invite_policy_checks', 'invite_token_well_formed') order by 1;
-- peek_invite, undo_parent_join, book_update, sync_op_claim: true / false; the other five: false / false
select public.consent_pepper_ready();                       -- as the service role: true (BL-334)
select count(*) from public.entries where occurred_precision is null or base_direction is null;   -- 0
```
Then repeat the classification and RLS queries from step 4 (expect 0 and 0). Supabase advisors, expected and accepted: **0029** (security definer function callable by `authenticated`) for `peek_invite`, `undo_parent_join`, `book_update` and `sync_op_claim`: each starts with `require_user()` and acts only for the caller. **0011** (mutable `search_path`) must now be clear for every function of ours; if it lists one, stop and tell S02.

Then run `npm run test:db` locally against the same commit (it must stay green), and record the four file names in `.github/migrations-applied.txt` through a pull request.

### Step 22. Settings for files 13 to 16

None is required to apply. Each is read at call time (no migration to change it); a database setting reaches new connections only, so pooled API connections pick it up as they are recycled (Assumption, as step 19).
- **Consent pepper** (step 6): must be set before the first account deletion; file 14 makes deletion fail closed without it. Check with `select public.consent_pepper_ready();` as the service role. While it is missing and an account deletion is waiting, the purge worker sends the `pepper_missing` alert (`ops_deletion_sla()` key `consent_pepper_missing`).
- **Family invites** (F11 D4): off. Do not turn on in v1.0 (D-055, B1): `alter database postgres set app.contributors_enabled = 'on';` exists for the v1.1 contributor work only.
- **Second consent at first share** (D-050): off until counsel answers. If counsel says yes: a migration adds the `family-share` row to `policy_documents` and a version, a release turns the sheet on, then `alter database postgres set app.family_share_consent_required = 'on';`.
- **Cron**: nothing new. The hourly `scribe-sync-housekeeping` job (step 15) now trims receipts by person.
- **Known limits, accepted for the gate (PR #140 reviews):** a failed `peek_invite` or `accept_child_invite` rolls its counter hit back with the error, so wrong guesses are not counted; links are safe because tokens are 244 bits (server-made) or 32 random bytes (device-made, F11-REQ-002), and the device rule belongs in the `packages/api` contract (S07) with a test. Typed codes are counted by `invite-redeem` outside the transaction (F11-REQ-007). On a quiet database the pull cursor and row versions follow the database-wide transaction counter (see the file 13 header); the sync ADR decides the fix.

### Error codes added or widened by files 13 to 16

| SQLSTATE | Where | App |
|---|---|---|
| `SCRAT` | now also `create_child` and `create_first_run_children` (21st new book in 24 h, detail `20`), `delete_entry` and `restore_entry` (301st in an hour), `sync_books` (pull bucket), `peek_invite` and `undo_parent_join` (membership bucket). Inside `sync_push` it stops the batch (`stopped: true`, `code: SCRAT`), never rejects an op | Back off and retry; never drop the op |
| `SCINV` detail `role_disabled` | creating, peeking at or accepting a family (contributor) invite | Not reachable from the v1.0 app; show the generic invite error |
| `SCINV` detail `code_taken` / `token_taken` | `create_child_invite(p_invite_id, ...)`: the code or token is in use | Make a new code (or token) and retry with a new invite id |
| `SCCID` | `create_child_invite(p_invite_id, ...)`: the id is not a device UUIDv7, or is in use by another request | Permanent; a client bug |
| `SCCON` detail `family-share` | invite creation while `app.family_share_consent_required` is on | Show the family-share sheet; never drop the request |
| `SCPAR` | `undo_parent_join` by anyone but the parent whose invite was used, or after 72 hours | Hide the undo row after 72 hours |
| `22023` | `undo_parent_join` naming yourself, or no one ("use leave_child to leave a book") | Permanent; a client bug (leaving is `leave_child`) |
| `SCIMM` | a different `pack_ref` on a letter that has one, or clearing it with a direct update. A `sync_push` op that sends `"pack_ref": null` or no `pack_ref` keeps the stored one and saves the rest of the op; a letter without one records it once | Permanent (reject); the client never changes it |
| `42501` | `select *` or a date column on `children`; a direct insert, update or delete on `child_members`, `sync_op_receipts`, `book_entries` | Name columns; use the RPCs |
| `55000` | account deletion while the consent pepper is missing (service paths only); also a second run of file 13, 14 or 15 | Ops alert `pepper_missing` (purge worker, `docs/ops/runbooks/stuck-deletion.md` 7a); the deletion retries |
| `23514` | a new column outside its shape (`occurred_precision`, `base_direction`, `author_edits`, `locked_spans`, `pack_ref`, `dictionary_terms.forms`) | Permanent; a client bug |

### Rolling back files 13 to 16

**Prefer fixing forward** with a new migration (DEPLOY.md "Rollback"). Partial switches, each on its own and each safe:
- Device-made invite ids: `revoke execute on function public.create_child_invite(uuid, uuid, text, bytea, bytea, text) from authenticated;` (the 3-argument overload keeps working).
- The undo: `revoke execute on function public.undo_parent_join(uuid, uuid) from authenticated;`
- Rate limits on books and letter state: none needed in normal use (20 books a day, 300 deletes an hour). If one misfires, raise the number in a forward migration.
- `peek_invite`: `revoke execute on function public.peek_invite(text) from authenticated;` (BL-322's sheet then cannot show the inviter; the app falls back to the generic join line).

A full rollback reopens the review findings these files close (M1, M3, M5, L1, H2's server half, DB-01, the shadowable `search_path`), so it needs your decision and a new review; the gate does not pass without these files. Write it as one reverse migration (one transaction), in this order. Each step names what the next one depends on.

1. **File 16** (erases what was synced into the new columns):
   1. Re-run `entries_guard_immutable` from file 4 (`20261002020000`) and `entries_family_rules` from file 5 (`20261003000000`) first, so no update on `entries` reads one of the five columns after it is gone. Without `entries_family_rules`, every update by a signed-in person (a direct edit or a `sync_push` text edit) fails with `42703` after step 3.
   2. `drop view public.book_entries;` A `create or replace` cannot remove the two appended columns, and the columns cannot be dropped while the view uses them.
   3. Drop the five `entries` columns (`occurred_precision`, `base_direction`, `author_edits`, `locked_spans`, `pack_ref`) and `dictionary_terms.forms`; their check constraints go with them. Then `drop function public.dictionary_forms_valid(jsonb);`
   4. Re-create `book_entries` with `create view` and file 5's (`20261003000000`) definition, then its privileges as file 13 section 6 left them: `revoke all on public.book_entries from public, anon; revoke insert, update, delete, truncate, references, trigger on public.book_entries from authenticated; grant select on public.book_entries to authenticated;` and the view and column comments from files 4 and 5 (`comment on view`, every `comment on column public.book_entries.*`; the classification test fails without them).
   5. Re-run `sync_pull` and `sync_push` from file 13.
2. **File 15**: drop `undo_parent_join`, `accept_child_invite_by_code`, the 6-argument `create_child_invite`, `invite_policy_checks`, `family_share_consent_required`, the `child_invites_live_code_idx` index and the `code_hash` and `notify_letters` columns (file 16's rollback already re-ran a `sync_push` that does not write `notify_letters`); re-create the `child_members_leave` policy and `grant delete on public.child_members to authenticated`; re-run `create_child_invite(uuid, text, text)` and `accept_child_invite` from file 12 and `child_members_audit` from file 4; restore the audit constraint from file 5 after deleting or re-labelling any `member_join_undone` rows (the constraint is checked against existing rows).
3. **File 14**: re-run `policy_acceptances_pseudonymise` from file 4 and `ops_deletion_sla` from file 10 (`20261004200000`); drop `peek_invite`, `invite_token_well_formed(text)`, `consent_pepper_ready`, `contributors_enabled`. The purge worker treats a missing `consent_pepper_missing` key as 0.
4. **File 13**, in this order:
   1. Receipts first: delete duplicate op ids (keep one row per `op_id`), `alter table public.sync_op_receipts drop constraint sync_op_receipts_pkey; alter table public.sync_op_receipts add primary key (op_id);` and **`grant insert, delete on public.sync_op_receipts to authenticated;`**. File 12's `sync_push` runs as the caller and writes and trims receipts itself; without the grant every push fails with `42501` (whole call), which the app treats as a rejection.
   2. `grant select on public.children to authenticated;` (file 12's `sync_push` merges `book.update` in place and reads the two date columns).
   3. Re-run `sync_pull`, `sync_push`, `sync_housekeeping` and `rate_hit` from file 12, `create_child` and `create_first_run_children` from file 8, `delete_entry` and `restore_entry` from file 5, `sync_books` from file 9.
   4. Drop the `entries_unshared` trigger and function, `book_update`, `sync_op_claim`, and the two `left_*_xid` columns.
5. **Last: re-run file 13 section 7** (the `do` block, "search_path: pg_catalog first, pg_temp last"). The `search_path` re-pin is not rolled back: it changes no behaviour and closes a hole. But each function re-run above from an older file comes back with that file's `search_path = public, pg_catalog`: `entries_guard_immutable`, `entries_family_rules`, `sync_pull`, `sync_push`, `sync_books`, `sync_housekeeping`, `rate_hit`, `create_child`, `create_first_run_children`, `delete_entry`, `restore_entry`, `create_child_invite`, `accept_child_invite`, `child_members_audit`, `policy_acceptances_pseudonymise` and `ops_deletion_sla`. The block re-pins them; it changes nothing else and can run any number of times.

After a rollback, some privileges stay tighter than develop's, and that is safe: `anon` has no select on `children` and no writes on `child_members` or `sync_op_receipts`, and `authenticated` has no insert or update on `child_members` (develop's app never uses them; joining and leaving go through the RPCs). `book_entries` and `my_policy_state` stay read-only, on purpose: step 1.4 re-creates `book_entries` without write privileges, and the rollback never re-grants writes on `my_policy_state` (file 13 section 6). On develop a co-parent could rewrite the other parent's letter through `book_entries` (DB-01). The rate-bucket check stays the superset, and file 13's comments stay. Test any rollback in PGlite first (`npm run test:db` on a branch with the reverse migration), and on real PostgreSQL if you can.

## File 17: sync protocol v1, the server half (16 Oct 2026, stream S02)

`20261016000000_sync_v1_server.sql`. The server half of the sync stack (PRs #146, #166, #182; ADR 0025 on that stack), as its handoffs ask: #154 (WP-F16-14 words compare and set, the M17 review mark), #187 (WP-F16-17 held drafts, WP-F16-13 Erase now), #196 (held receipts record `applied_v`; held words compare only when an upload changes them), #197 (`held.discard` with a base, the `erased` marker), #198 (an upload never brings an erased letter back). It builds what the stack's test stand-ins (`apps/mobile/test/helpers/sync-v1-*.sql`) describe, so the stack's tests run against this file instead (they report `standIn`, `heldStandIn` and `eraseStandIn` false). Apply it after file 16. It adds tables, columns, triggers and functions and redefines `sync_push`, `sync_pull`, `entries_set_sync_xid`, `entries_not_purged`, `entries_guard_immutable`, `prepare_account_purge`, `purge_due`, `ops_replay_ledger`, `ops_incident_scope` and `ops_deletion_residue`; it drops nothing that holds data. Reviews K (concurrency) and L (access rules and privacy) on #208 changed it in place before any apply (the fixes are listed in the file's header).

What it adds:
- `entries.text_xid` (the words version) and `entries.words_reviewed_at` (the review mark, author-only, never in `book_entries`); four outcome columns on `sync_op_receipts` (`answer` keeps the flags a repeat of `held.discard`, `entry.erase` or a refused Keep must say again).
- `held_drafts` (author-only, while a parent of the book; no client deletes) and `held_drafts_gone` (markers `discarded`, `kept`, `erased`; definer code only).
- Schema `sync_private`: the receipt, held, Keep and erase helpers, and `entry_erasures`, the record of every letter purged while its book and author exist (ids, the times it left the parents' and the family's view, and times; never trimmed by time, because trimming would let a long-offline phone bring an erased letter back). A pull recomputes a reader's digest for an erasure only when that letter left that reader's view since the cursor.
- Ordering: one push per person at a time (an advisory lock at the top of `sync_push`), and Keep, `held.upsert` and both erase paths serialise on the letter id.
- A Keep that names `held_base` (the held row's last `v` the phone knew; a present null counts as 0) is refused as a words conflict when the held words moved on and differ: no letter, the held row stays, `current` carries the held words. Without the key (an older app) the Keep applies and differing held words go to the letter's `entry_versions`.
- Ids belong to their author: a held draft never takes an id that is a letter or another author's held draft, marker or erasure; erasure refusals read the author's own records; a row's `id` never changes (`SCIMM`).
- Legal holds: a held draft under a hold survives leaving the book and holds account deletion and the book purge. The deletion residue scan reads `sync_private` too.
- `purge_ledger.entity_type` gains `held_draft` (no value removed; #151 adds `audio_blob` the same way, in either order).
- Triggers: on `entries` (the words version, stamped by file 9's row-version trigger, redefined; Keep removes the held row; every purge is recorded), on `held_drafts` (consent gate, the id guard, versions, markers, ledger and the recording's backup), on `child_members` (a leaver's held drafts of that book go, unless under a legal hold).

Tests: `sync_v1_server` (new), new rows in `access_matrix`, the D-023 case in `sync_engine` (words on an older base are now refused; with no base the later arrival still wins), and `sync_private` in the `v1_gate_search_path` sweep; `npm run test:db` now runs 21 files.

### Step 23. Before file 17 (staging first, then production)

**Order for the alpha (D-106; #154 ask 3; your step, through CI as in "How these files reach a project").** `scribe-staging` must hold file 12 (`20261005000000`), files 13 to 16 (PR #140) and file 17, in that order, before the alpha build syncs: the v1 client sends the `language` group, which older servers refuse, and it sends `entry.erase` and the held ops, which an older server answers with `22023` (the phone waits; nothing is lost, but Erase now and held drafts do not reach the server). Production follows only after staging has run them and step 24 is green there.

Read only:
```sql
-- a) The names are free (expect five nulls).
select to_regclass('public.held_drafts'), to_regclass('public.held_drafts_gone'), to_regnamespace('sync_private'),
       (select attname from pg_attribute where attrelid = 'public.entries'::regclass and attname = 'text_xid' and not attisdropped),
       (select attname from pg_attribute where attrelid = 'public.sync_op_receipts'::regclass and attname = 'applied_v' and not attisdropped);
-- b) File 16 is applied (expect 1).
select count(*) from pg_attribute where attrelid = 'public.entries'::regclass and attname = 'pack_ref' and not attisdropped;
```
And in the Dashboard: Project Settings > Data API > Exposed schemas is `public` only (step 15). It must stay so after this file: never add `sync_private`.

### Step 24. After each environment: check the result

```sql
-- sync_private: signed-in people use it, anon cannot; its helpers are not RPCs (expect true, false, 0).
select has_schema_privilege('authenticated', 'sync_private', 'usage') signed_in, has_schema_privilege('anon', 'sync_private', 'usage') anon,
       (select count(*) from pg_proc p where p.pronamespace = 'public'::regnamespace
         and p.proname in ('note_applied', 'dup_outcome', 'held_upsert', 'held_discard', 'erase_entry', 'erase_held')) in_public;
-- The erasure record and the markers: no client reads them (expect false, false).
select has_table_privilege('authenticated', 'sync_private.entry_erasures', 'select') erasures,
       has_table_privilege('authenticated', 'public.held_drafts_gone', 'select') markers;
-- held_drafts: RLS on, four policies, signed in reads and writes but never deletes, anon nothing (expect true, 4, true, false, false).
select c.relrowsecurity, (select count(*) from pg_policies where tablename = 'held_drafts'),
       has_table_privilege('authenticated', 'public.held_drafts', 'insert'), has_table_privilege('authenticated', 'public.held_drafts', 'delete'),
       has_table_privilege('anon', 'public.held_drafts', 'select')
  from pg_class c where c.oid = 'public.held_drafts'::regclass;
-- The ledger kind (expect it to list held_draft and every earlier kind).
select pg_get_constraintdef(oid) from pg_constraint where conname = 'purge_ledger_entity_type_check';
-- The triggers (expect 8 rows; the words version is stamped by file 9's entries_sync_xid, redefined here).
select tgname from pg_trigger where not tgisinternal and tgname in ('entries_note_erasure', 'entries_drop_held',
  'child_members_drop_held', 'held_drafts_consent_gate', 'held_drafts_guard', 'held_drafts_stamp', 'held_drafts_gone_on_delete',
  'held_drafts_gone_on_insert') order by 1;
-- sync_push carries protocol v1 (expect true).
select prosrc like '%conflict_groups%' and prosrc like '%entry.erase%' and prosrc like '%held.upsert%' from pg_proc where proname = 'sync_push';
```
Then repeat step 21's `search_path` query with `sync_private` added to the schema list (expect 0 rows), and the classification and RLS queries from step 4 (expect 0 and 0). Advisors, expected and accepted: none new in `public` (the new definer functions are trigger functions, callable by nobody). If an advisor lists a function in `sync_private` as callable by `authenticated`, that schema is exposed: remove it from the exposed schemas and tell S02.

Then run `npm run test:db` locally against the same commit, and the sync stack's tests (`cd apps/mobile && npx vitest run test/sync-two-phone.test.ts`, once #182 is in the tree), and record the file name in `.github/migrations-applied.txt` through a pull request.

### Step 25. Settings for file 17

None is required to apply. One switch exists:
- **Held-draft sync** (ADR 0025 section 9, the fallback for the alpha): on unless set off. If the held-draft state table is not green in `sync-two-phone` by Fri 23 Oct, build 2 ships with it off: `alter database postgres set app.held_sync = 'off';` (on again: `alter database postgres reset app.held_sync;`). It is read at call time, and a database setting reaches new connections only, so pooled API connections pick it up as they are recycled (Assumption, as step 19). While it is off, the pull sends no `held` section and `held.upsert` and `held.discard` answer `held_off` without changing anything (the phone keeps them queued), so held drafts stay on the phone as in build 1 while letters still sync. Keep and Erase now keep working, including the compare with any held row the server already has. Check with `select current_setting('app.held_sync', true);` (`off`, or empty for on).

No new cron job: receipts are still trimmed by the hourly `scribe-sync-housekeeping` (step 15); `entry_erasures` and the markers are kept on purpose (they go with the book and the person, by foreign key). If you must apply by hand, use the SQL Editor as in step 18; the file refuses a second run (`55000`, "already applied").

### Answers and error codes added or widened by file 17

| Where | Answer | App |
|---|---|---|
| `entry.upsert` with a `base` on an existing letter whose words changed since | `conflict_groups: ['text']` and `current` (the words now, with `v`); the other groups apply | Keep this phone's words as a conflict copy; the letter follows `current` (ADR 0025 section 5) |
| Any `entry.upsert` on words newer than its base | `current` | As above, only when this phone's words are queued |
| A duplicate (same op id) | `applied_v` (the version it wrote), or the refusal and `current` again | Rebase only on `applied_v` |
| `entry.erase` | `erased`; `missing` (no letter, or another person's: the same answer, with nothing locked); `deferred` (legal hold); a repeat says the same | As ADR 0025 section 12 |
| `entry.upsert` that keeps a held draft, onto a letter that already exists (another phone kept it first) | a compare and set against the letter, with `held_base` as `base`: `conflict_groups: ['text']` and `current` (the letter's words); the other groups apply; the first keep's `raw_transcript`, `captured_at`, `engine_version` and `pack_ref` stand (never `SCIMM`); a repeat says the same, with the letter's words now | Keep this phone's words as a conflict copy, the letter follows `current`, and take the letter's `raw_transcript` and `engine_version` from its own pull row (ADR 0025 section 9, table row C) |
| `entry.upsert` that keeps a held draft and carries `held_base` (no `held_base` counts as 0) | when the held words moved on and differ: `applied: false`, `conflict: true`, `conflict_groups: ['text']`, `current` (the held words with `typed_text` and `v`), `held`, no letter; a repeat says the same, with `current` from whatever holds the words now (the held row, else the letter, else null) | Keep this phone's words as a conflict copy, take `current`, send the Keep again with `held_base = current.v` (ADR 0025 section 9) |
| `held.upsert` | `held: {id, v, updated_at}`; `held: null` (kept already); a refusal as above with `typed_text` in `current` | As ADR 0025 section 9 |
| `held.discard` | `{}`; `kept` (newer words since `base`, or a legal hold); `missing`; a repeat says the same | `kept`: the next pull brings it back |
| `held_off` (`ok: true, applied: false`) on `held.upsert` and `held.discard` | `app.held_sync` is `off` (step 25); nothing changed and the op is not claimed | Keep it queued; it goes again, under the same op id, once a pull carries a `held` section |
| `SCDEL` detail `purged` (`gone: true`) | now also any upload (letter or held draft) of an id that was erased or purged: purge_ledger, the erasure record, or an `erased` marker. Never "a base and no row" alone, which a server restore also produces | Permanent: the letter stays in this phone's Recently deleted, or is erased |
| `22023` | a held id that is a letter, or another author's held draft, marker or erasure; a malformed `held` pull request; on an older server, the three new op types | Permanent, except the new op types on an older server: wait and retry |
| `SCCON`, `SCIMM` | now also on `held_drafts` (consent; a second raw transcript, id, author, book or creation time) and on a change of a letter's `id` | As for letters |
| `42501` | `held.upsert` or a held insert by anyone not a parent of the book named, or a direct held insert whose `author_id` is not the caller (whatever the id); a direct delete on `held_drafts`; any read of `held_drafts_gone` or `sync_private.entry_erasures` | Use the ops |

### App and contract changes for file 17

- S03 (#182): delete the three stand-ins and `sync-v1-standin.ts` (the server skips them already). The Keep sends `held_base` (agreed 17 Oct; ADR 0025 section 9).
- S03 (M17): the phone sends `words_reviewed_at` in an `entry.upsert` that changes the words (with `text` in `changed`): the time the author kept the letter with its words on screen, or `null` for machine words still waiting for review. It is stored only with the text group and only when the key is present; own pull rows carry it. Letters written before the phone sends it have none, so `null` means "no mark": the phone's rule for that case is S03's.
- S03 (#182), from the state table (ADR 0025 section 9): `held_base` and `held_v` move only to the words version this phone's own words produced; `applied: false` with no `entry` is a refusal whatever `current` says; after a Keep onto an existing letter the phone takes the letter's `raw_transcript`, `engine_version` and `captured_at` from its own pull row; a `held_off` answer keeps the op queued.
- S07 (`packages/api`): `held_off` (optional boolean) on push results for held ops, `applied_v` (optional string) on push results, `typed_text` on `current` for held answers, `words_reviewed_at` (optional, nullable ISO time) on own rows and on `entry.upsert` data, `held_base` (optional, nullable string) on `entry.upsert`, and the refused Keep answer (`applied: false` with `current` and `held`, no `entry`).
- scripts/ops owner: `parseLedger` (`scripts/ops/lib/drill.ts`) skips every kind but `entry`, `child` and `profile`; `ops_replay_ledger` now replays `held_draft` (and `audio_blob` once #151 is applied).

### Rolling back file 17

Prefer fixing forward. Partial switches, each on its own and each safe:
- Held drafts off: `alter database postgres set app.held_sync = 'off';` (step 25). Held ops answer `held_off` and stay queued on the phone; letters, Keep and Erase now keep working. Prefer it to revoking the table grants, which would make held uploads fail per op with `42501` and turn them into rejected writes.
- The words compare and set, Erase now and the erasure record have no partial switch: fix forward with a migration.

A full rollback, as one reverse migration, in this order: re-run `sync_push` and `sync_pull` from file 16 (the phones then answer every new op with `22023` and wait); re-run `entries_set_sync_xid` and `entries_not_purged` from file 9, `entries_guard_immutable` from file 16, `prepare_account_purge` from file 4, `purge_due` from file 8, and `ops_replay_ledger`, `ops_incident_scope` and `ops_deletion_residue` from file 10; drop the triggers `entries_note_erasure`, `entries_drop_held`, `child_members_drop_held` and the `held_drafts` triggers with their functions; `drop table public.held_drafts, public.held_drafts_gone;` (this deletes held drafts: export them first, or the authors lose them); `drop schema sync_private cascade;` (the erasure record goes, so an erased letter older than 60 days could come back); drop `entries.text_xid`, `entries.words_reviewed_at` and the four receipt columns. If #151 is applied, redefine `backup_entry_exists` with its `entries` check only (drop the `held_drafts` branch, whichever file added it); after the drop every backup check would otherwise fail with `42P01`. Last, re-run file 13 section 7 (the `search_path` block), since the functions re-run from older files come back with their old `search_path`. `purge_ledger_entity_type_check` keeps `held_draft` (removing it would fail on any ledger row of that kind). Test the reverse migration in PGlite first.

## File 18: the subscription status report (S06, PR #178)

`20261016001000_subscription_status.sql` (WP-F14-15b; D-080, D-081). S06's text from PR #178, at the timestamp it took at the merge with develop af53d7c (its placeholder, `20261016000000`, is file 17's version). What it adds: `subscription_salts` (one random 32-byte salt per account), `subscription_status` (one row per account and `sub_ref`, the last report received wins), `subscription_consents` (one per original purchase, append-only, pseudonymised at account deletion with the same pepper and hash as `policy_acceptances`, deleted 3 years later by `subscription_retention_purge`, which the purge worker's daily run calls) and `subscription_report_rates` (30 per person per hour for each RPC). No client can read or write any of them; the two RPCs answer only `{stored, consent}`, never whether a person has Plus (D-080 rule 4). No receipt, transaction id, price, letter, transcript, recording or child name is stored. It re-creates `idempotency_keys_fn_check` with `'status_report_store'` added. Tests: `subscription_status` (new), rows in `access_matrix`, and the `v1_gate_search_path` sweep covers its functions.

**Before.** Every earlier pending file, file 17 included. `app.consent_pepper` set (step 6): an account with consent records cannot be deleted without it (`55000`, like G-12).

**Apply.** After two independent passing reviews on the current head, with green CI, the coordinator merges it into `develop` (D-117), and the founder applies it through `deploy-db.yml`, staging first ("How these files reach a project").

**Turn on** (it fails closed until then, and the phone keeps its report for later): `alter database postgres set app.status_report_enabled = 'on';` Anything else pauses both RPCs again (`SCKIL`, detail `statusReport`, which the `subscription-status` function answers as 503 paused).

**Check** (expect true, true):
```sql
select to_regclass('public.subscription_status') is not null and to_regclass('public.subscription_consents') is not null;
select has_function_privilege('authenticated', 'public.status_report_store(jsonb)', 'execute')
   and not has_function_privilege('anon', 'public.status_report_store(jsonb)', 'execute');
```
Then repeat step 21's `search_path` query (expect 0 rows). Advisors, expected and accepted: **0029** "authenticated can execute security definer function" for `status_salt` and `status_report_store` (both start with `require_user()`); **0008** `rls_enabled_no_policy` for `subscription_salts`, `subscription_status`, `subscription_consents` and `subscription_report_rates` (RLS on and no policy on purpose: functions only). Anything else new: stop and ask.

**Rollback** (before any real purchase only; consent records are legal records), tested in PGlite. One transaction. Resetting the switch means that if file 18 is applied again later, the report stays paused until you turn it on again; a database setting reaches new connections only:
```sql
begin;
alter database postgres reset app.status_report_enabled;
drop trigger if exists profiles_pseudonymise_subscription_consents on public.profiles;
drop function if exists public.status_report_store(jsonb), public.status_salt(), public.subscription_retention_purge(timestamptz);
drop trigger if exists subscription_consents_guard on public.subscription_consents;
drop trigger if exists subscription_consents_no_truncate on public.subscription_consents;
drop function if exists public.subscription_consents_pseudonymise(), public.subscription_consents_guard(), public.subscription_consents_no_truncate(),
  public.subscription_instant(jsonb, boolean), public.subscription_report_switch(), public.subscription_rate_hit(uuid, text);
drop table if exists public.subscription_report_rates, public.subscription_consents, public.subscription_status, public.subscription_salts;
delete from public.idempotency_keys where fn = 'status_report_store';
alter table public.idempotency_keys drop constraint if exists idempotency_keys_fn_check;
alter table public.idempotency_keys add constraint idempotency_keys_fn_check check (fn in ('create_child_invite', 'record_policy_act'));
commit;
```

## File `<timestamp>_backup_server.sql` (S05, PR #151: encrypted recording backup and the recovery key)

S05's text (`docs/ops/BACKUP_RUNBOOK.md` appendix A on `feat/backup-server`), with the real timestamp to be filled in at merge. It is not in this branch; the section is here so the founder has one place for every file.

What it does: the private `entry-audio` bucket and its owner-only policies; tables `backup_devices`, `child_keys`, `audio_blobs`, `backup_usage`, `restore_requests`, `restore_approvals`, `escrow_unwraps` (append-only), `escrow_rotation_notices`, none of them granted to `service_role`; the `backup` policy document; client RPCs `backup_*`; the `escrow_svc` role (created NOLOGIN) with EXECUTE on ten `escrow_*` functions only; service functions `backup_svc_sweep`, `backup_svc_unwraps_between`, `backup_svc_stop`; triggers on `entries`, `profiles` and `deletion_requests` so every deletion path removes backups by exact path; `purge_ledger.entity_type` gains `audio_blob` (no value removed).
Depends on: every earlier file. Needs `app.consent_pepper` set before any account deletion (step 6).
With file 17: either order works (both widen the ledger kinds without dropping any). If #151 is applied before file 17, file 17 adds the held-draft branch to `backup_entry_exists`; if after, #151's own file must carry that branch (request on #151). File 17 calls `backup_forget_entry` from the held-draft delete trigger whenever it exists, and `ops_replay_ledger` replays `audio_blob` once `audio_blobs` exists.
Apply: after two independent passing reviews on the current head, with green CI, the coordinator merges it into `develop` (D-117), and the founder applies it through `deploy-db.yml` (staging from `develop`; production on a `db-v*` tag).
Check (expect each):
```sql
select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relname in ('backup_devices','child_keys','audio_blobs','backup_usage','restore_requests','restore_approvals','escrow_unwraps','escrow_rotation_notices')
   and c.relrowsecurity;                                                        -- 8
select count(*) from information_schema.role_table_grants
 where grantee = 'service_role' and table_name in ('backup_devices','child_keys','audio_blobs','backup_usage','restore_requests','restore_approvals','escrow_unwraps','escrow_rotation_notices');  -- 0
select public, file_size_limit from storage.buckets where id = 'entry-audio';  -- false | 20971520
select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and has_function_privilege('escrow_svc', p.oid, 'execute');   -- 10
select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname like 'escrow\_%'
   and (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute')
        or has_function_privilege('service_role', p.oid, 'execute'));          -- 0
select pg_get_constraintdef(oid) from pg_constraint where conname = 'purge_ledger_entity_type_check';  -- includes 'audio_blob' and every earlier kind
select count(*) from information_schema.columns where table_name = 'child_keys' and column_name = 'key_check';  -- 1
select tgname from pg_trigger where tgname in ('entries_backup_forget','profiles_pseudonymise_escrow_unwraps','deletion_requests_backup_cancel','escrow_unwraps_guard','escrow_unwraps_no_truncate') order by 1;  -- 5 rows
select prosrc like '%held_drafts%' from pg_proc where proname = 'backup_entry_exists';  -- true once file 17 and #151 are both applied
```
Advisors: expect 0029 "authenticated can execute security definer function" for `backup_register_device`, `backup_revoke_device`, `backup_store_key`, `backup_begin`, `backup_confirm`, `backup_discard`, `backup_delete_all`, `backup_pending_requests`, `backup_approve_request`, `backup_cancel_request` and the Storage helpers `backup_object_writable`, `backup_object_readable`. Each starts with `require_user()` or checks `auth.uid()` and `is_anonymous()`. Anything else new: stop and ask.
Settings after apply (off until then, fail closed): `app.backup_enabled`, `app.escrow_enabled`, `app.escrow_key_versions` (docs/ops/BACKUP_RUNBOOK.md B7); `app.escrow_rotation` only during a rotation (section 5).
Rollback (only before any real recording is uploaded; after that, switch off with B7 instead and never drop the tables, because the log must stay 24 months):
```sql
begin;
alter database postgres reset app.backup_enabled; alter database postgres reset app.escrow_enabled;
drop trigger if exists entries_backup_forget on public.entries;
drop trigger if exists profiles_pseudonymise_escrow_unwraps on public.profiles;
drop trigger if exists deletion_requests_backup_cancel on public.deletion_requests;
drop policy if exists entry_audio_owner_insert on storage.objects; drop policy if exists entry_audio_owner_update on storage.objects;
drop policy if exists entry_audio_owner_read on storage.objects; drop policy if exists entry_audio_no_anonymous on storage.objects;
drop table if exists public.escrow_unwraps, public.restore_approvals, public.restore_requests, public.backup_usage,
  public.audio_blobs, public.child_keys, public.backup_devices, public.escrow_rotation_notices cascade;   -- the truncate guard goes with the table
drop function if exists public.backup_switch_on(text), public.backup_escrow_key_trusted(int) cascade;  -- and the other functions of this file
delete from storage.buckets where id = 'entry-audio';   -- only if empty
delete from public.policy_documents where key = 'backup' and not exists (select 1 from public.policy_versions where document = 'backup');
revoke usage on schema public from escrow_svc; drop role if exists escrow_svc;
commit;
```
`purge_ledger_entity_type_check` keeps `audio_blob` (harmless; removing it would fail on any ledger row of that kind). With file 17 applied nothing else is needed: `backup_entry_exists` goes with #151's functions, and file 17's trigger stops calling `backup_forget_entry` once it is gone.

## File 20: purge and consent guards (23 Oct 2026, stream S02)

`20261023010000_s02_purge_and_consent_guards.sql`. Three follow-ups from reviews: review A's re-check on #178 (the consent records), review A's N1 on #151 (a former co-parent's letters and the book purge) and review B's N8 on #138 (`invite_redeem_by_code`). Apply it after `20261023000000_backup_server.sql`. It adds one column, two internal functions and one index, and redefines `purge_due`, `prepare_account_purge`, `ops_deletion_sla`, `child_members_drop_held` and the `held_drafts_author_read` policy; it drops nothing. Tests: `former_member_purge` and `consent_service_role` (new), and new rows in `access_matrix`.

What it changes:
- **Consent records.** `service_role` loses INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES and TRIGGER on `policy_acceptances` and `subscription_consents`, and keeps SELECT. The row guards let a delete through while `app.retention_purge` is on, which any session can set, so before this file the service key could delete every consent record. Every writer is a definer function and keeps working. Support-assisted acts (step 8.3) are recorded from the SQL Editor, as before.
- **A former member's letters stay theirs.** When a book is purged (day 30 after the remaining parent deletes it, or with that parent's account), the letters, held drafts and recording backups of anyone who is no longer a member (they left, their join was undone, or they were removed) stay, with their book key, per-book terms and Storage objects. Everything of the current members goes as before. The `children` row stays, tombstoned, with `purged_at` set and only the name and dates kept, until nothing of theirs is left; then `purge_due` removes it as it removes any book. A book with no former member's rows is purged exactly as before. `purge_due` answers two more keys (`books_kept`, `kept_removed`) and `prepare_account_purge` one (`books_kept`); the purge worker reads only the keys it already knew.
- **Undo** (`undo_parent_join`) no longer deletes the removed parent's held drafts on the server, and an author reads their own held drafts in any book.
- **`invite_redeem_by_code`** does not exist yet; `access_matrix` fails if it is ever created executable by PUBLIC, anon or authenticated, or not executable by `service_role`. File 26 (`20261027000000`) creates it.

**After a database restore** (RB-8, `docs/ops/runbooks/restore-drill.md` Part 2): if the restore point is before an account purge that kept a book for a former member, the replay brings the book back live with the deleted person still its only parent, so deleting their Auth user again fails with `SCLPG` (Auth reports a database error). Nothing is lost and it heals once the restored account request runs: it is `executing` again (or, with a restore point before it started, a past-due `scheduled` request that `purge_due` hands to the worker the same way), and the worker's next run keeps the book for the former member and then deletes the user (`former_member_purge` section 5; during a restore the jobs are paused, so the runbook has the operator start that run).

**Before.** Every earlier file. Read only (expect null, then true):
```sql
select (select attname from pg_attribute where attrelid = 'public.children'::regclass and attname = 'purged_at' and not attisdropped);
select to_regclass('public.audio_blobs') is not null and to_regclass('public.held_drafts') is not null;
```

**Apply.** After two independent passing reviews on the current head, with green CI, the coordinator merges it into `develop` (D-117), and the founder applies it through `deploy-db.yml`, staging first ("How these files reach a project"). The file refuses a second run (`55000`).

**Check** (expect 0, then true, then 0):
```sql
select count(*) from information_schema.role_table_grants
 where grantee = 'service_role' and table_name in ('policy_acceptances', 'subscription_consents') and privilege_type <> 'SELECT';
select has_table_privilege('service_role', 'public.policy_acceptances', 'select') and has_table_privilege('service_role', 'public.subscription_consents', 'select');
select count(*) from pg_proc p where p.proname in ('book_kept_authors', 'purge_book_keep_authors')
   and (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute')
        or has_function_privilege('service_role', p.oid, 'execute'));
```
Then repeat step 21's `search_path` query (expect 0 rows). Advisors: none new expected. Afterwards, `select count(*) from children where purged_at is not null;` counts the books kept for a former member (0 until one is purged).

**Rollback.** Prefer fixing forward. Before any book has been kept (`purged_at` null everywhere), as one transaction (test it in PGlite first): re-run `purge_due` and `prepare_account_purge` from file 17, `ops_deletion_sla` from file 14 (`20261015010000`) and `child_members_drop_held` from file 17; `alter policy held_drafts_author_read on public.held_drafts using (author_id = (select auth.uid()) and public.is_child_parent(child_id));`; `drop function public.purge_book_keep_authors(uuid, uuid[], text, uuid), public.book_kept_authors(uuid);`; `alter table public.children drop column purged_at;`. Do not grant the consent tables back to `service_role`. Once a book has been kept, do not roll back: the old `purge_due` would delete the kept letters with the book row.

## File 21: legal holds stop the account purge (23 Oct 2026, stream S02)

`20261023020000_purge_legal_holds.sql`. Review A's N5 on #248 (comment 6374328519): `prepare_account_purge` checked legal holds only on the deleting person's own letters and held drafts, so a book deleted with the account was purged even under a hold on the book, or with a family member's held letter in it (`purge_due` skipped such a book on day 30, and the worker's `prepare_account_purge` then deleted it in the same hour). Apply it after `20261023010000_s02_purge_and_consent_guards.sql`. It adds one internal function and redefines `purge_due`, `prepare_account_purge` and `ops_deletion_sla`; it adds no column and drops nothing. Tests: `purge_legal_holds` (new) and new rows in `access_matrix`.

What it changes:
- **One rule for every row a purge deletes.** A row is held when a hold names its own id (`entry`: a letter, a held draft, a recording backup), its person (`profile`: the author, a book key's holder) or its book (`child`); a Storage object by the book and person its path names. This is the rule the existing checks already used, now applied to every row. `book_purge_held(child)` (new, callable by no API role and not by `service_role`) answers it for a whole book: the book, its letters, held drafts, recording backups, book keys and the objects in its people's folders, leaving out the rows of its kept authors (`book_kept_authors`), and the objects in its own photo folder (`child-photos/{book}/`, which goes whole even from a kept book) by the person Storage records as their owner. With no unreleased hold at all, the usual state, it and the checks in `prepare_account_purge` answer at once from one probe of `legal_holds`, and step 2b runs it only for a book it would remove (review B on #251).
- **`purge_due`** steps 1 and 2b skip a book `book_purge_held` covers, and purge the rest, as before. Step 1 used to check the book, its letters and its held drafts; step 2b the book only.
- **`prepare_account_purge`** holds the whole request, before anything changes, when a hold covers any row it would delete: as before the person's own letters and held drafts, and now also their recording backups and book keys in a held book (the rule "Delete the backup" uses), their Storage objects in a held book (their folders, and anything the worker's ownership sweep would delete or move, such as a book photo they uploaded), and every book deleted with the account with everyone's rows in it (`book_purge_held`), including a book that became theirs alone during the grace period, which is then not even tombstoned. A kept book's former members' rows are left out (`book_kept_authors`): the purge never deletes them, so a hold on them does not hold the deleting parent's account (review A N2 on #251), while a hold on the book or a current member's row does. `purge_due` steps 1 and 2b and `ops_deletion_sla` use the same rule, so a hold on a former member's own row no longer holds the day-30 book purge either (file 20 held the whole book; that row is kept either way). As before, the answer is `{"held": true}`, the request is `held`, and no SQLSTATE is raised; the worker logs `account.held` and stops. `purge_due` hands a request held by anything but a hold on the person back to the worker each run, which asks again, so the purge resumes on the first run after the hold is released.
- **`ops_deletion_sla`** does not count a tombstoned book that `purge_due` skips for a hold as overdue (it counted one unless the hold named the book itself).
- The kept-author behaviour of file 20 is unchanged, and no function signature changes.

**Before.** Every earlier file. Read only (expect true, then null):
```sql
select exists (select 1 from pg_attribute where attrelid = 'public.children'::regclass and attname = 'purged_at' and not attisdropped);
select to_regprocedure('public.book_purge_held(uuid)');
```

**Apply.** Through `deploy-db.yml`, staging first ("How these files reach a project"). The file refuses a second run, and a run before file 20 (`55000`).

**Check** (expect 0, then true):
```sql
select count(*) from pg_proc p where p.proname = 'book_purge_held'
   and (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute')
        or has_function_privilege('service_role', p.oid, 'execute'));
select has_function_privilege('service_role', 'public.purge_due(timestamptz, int)', 'execute')
   and has_function_privilege('service_role', 'public.prepare_account_purge(uuid)', 'execute')
   and has_function_privilege('service_role', 'public.ops_deletion_sla(timestamptz)', 'execute');
```
Then repeat step 21's `search_path` query (expect 0 rows). Advisors: none new expected. Afterwards, from the SQL Editor (as the owner), `select count(*) from children c where c.deleted_at is not null and c.purged_at is null and public.book_purge_held(c.id);` counts the tombstoned books a hold keeps (the function leaves out a kept book's former members itself, as `purge_due` step 1 does), and `select count(*) from deletion_requests where kind = 'account' and status = 'held';` the account requests waiting on a hold (both 0 while no hold is placed).

**Rollback.** Prefer fixing forward; rolling back brings the gap back. At any time, as one transaction (test it in PGlite first): re-run `purge_due`, `prepare_account_purge` and `ops_deletion_sla` from file 20 (`20261023010000`), then `drop function public.book_purge_held(uuid);` (in that order: the three call it). No data changes either way.

## File 22: held drafts are checked at write time like letters (23 Oct 2026, stream S02)

`20261023030000_held_drafts_write_checks.sql`. Review A's N1 and N2 on #253 (comment 6375873410), and the contract text at `PulledHeldSectionSchema` (`packages/api/src/server/sync.ts`): `held_drafts` had no check on `capture_mode`, `edit_level` or its jsonb layers, and `held.upsert` stored them as sent. The app's pull parser drops a held row it cannot parse and counts it (`held.rejected`), while the server keeps the row and the cursor moves past it, so a new phone, or one after a restore epoch, never shows that draft. The same values in the `current` of a refused `held.upsert` or Keep made the whole push answer invalid, so the refusal the person must resolve never arrived. Apply it after `20261023020000_purge_legal_holds.sql`. It adds five check constraints on `held_drafts`; it redefines no function, adds no column and drops nothing. Tests: `held_drafts_write_checks` (new) and one drift test in `packages/api/test/contract-drift.test.ts` (every closed list and array a pulled held row carries is checked, with exactly the contract's values).

What it changes:
- **The checks `entries` has, as `entries` has them (check constraints), and exactly what the contract accepts for a held row** (`PulledHeldSchema`, `HeldDraftData`): `capture_mode` is `spoken`, `typed` or `mixed` (`held_drafts_capture_mode_check`); `edit_level` is null, `clean` or `verbatim` (`held_drafts_edit_level_check`; a letter's is never null, a held draft may have no words yet); `machine_edits`, `author_edits` and `locked_spans` are each null or a JSON array (`held_drafts_machine_edits_shape`, `held_drafts_author_edits_shape`, `held_drafts_locked_spans_shape`). `kind`, `occurred_precision`, `base_direction` and the sizes were already checked (file 17).
- **How a refusal answers.** A write that fails a check is a check violation, `23514`, the code a letter gets: `sync_push` answers that op `{op, ok: false, code: "23514"}` (no message, no value), changes nothing for it and goes on with the rest of the batch. The phone keeps the draft and the op in `rejected_writes` (`merge.ts`), but nothing is shown yet: the only signal is `SyncStatus.rejected` (`apps/mobile/src/lib/sync/index.ts`), which no screen reads, and held drafts have no rejected state (letters do). WP-F16-01 must surface `SyncStatus.rejected` and give held drafts a rejected state. A direct Data API write is checked the same way. Nothing changes for an op that does not change the words (its words layers are never written) or one whose words are refused as a words conflict (they are not written either). Every `current` built from a held row now parses.
- **Not checked, on purpose**, because the contract does not carry it for a held row: the `entries` size caps on `author_edits` (64 KB) and `locked_spans` (16 KB), and the `entries` checks on `language` and `pack_ref`. A Keep of such a draft still meets the `entries` checks, as before. A jsonb `null` (not SQL null) in a layer is refused, as `entries` refuse it; no client path writes one.
- **Rows already stored are never deleted or changed** (the constitution). Each check is added `NOT VALID`, so every insert and update is checked from then on; then the stored rows it refuses are counted, and it is validated only when that count is 0. The file prints a `NOTICE` for each check it validated and a `WARNING` with the count for each it left `NOT VALID` (counts and check names only, never an id or a value). In its own transaction it holds an ACCESS EXCLUSIVE lock on `held_drafts` until it commits, which blocks reads as well as writes: `add constraint ... not valid` takes that lock, and the count and the `validate constraint` that follow in the same transaction keep it, with up to two scans of the table per check. A `validate constraint` run by hand later takes only SHARE UPDATE EXCLUSIVE, so reads and writes go on while it scans. That by-hand path is the one to prefer for a table with many rows (the Before step's third query says how many). The file as written has no switch to skip its own `validate`, so on such a table apply it at a quiet time, or ask S02 for a variant that only adds the checks `NOT VALID` and leaves the validate to be run by hand. Today the table holds drafts only.

**Before.** Every earlier file. Read only (expect true, then 0, then the number of stored drafts, then five counts, normally all 0):
```sql
select to_regclass('public.held_drafts') is not null and to_regprocedure('public.book_purge_held(uuid)') is not null;
select count(*) from pg_constraint where conrelid = 'public.held_drafts'::regclass
   and conname in ('held_drafts_capture_mode_check', 'held_drafts_edit_level_check', 'held_drafts_machine_edits_shape',
                   'held_drafts_author_edits_shape', 'held_drafts_locked_spans_shape');
select count(*) from public.held_drafts;
select count(*) filter (where capture_mode not in ('spoken', 'typed', 'mixed')) as capture_mode,
       count(*) filter (where edit_level not in ('clean', 'verbatim')) as edit_level,
       count(*) filter (where jsonb_typeof(machine_edits) <> 'array') as machine_edits,
       count(*) filter (where jsonb_typeof(author_edits) <> 'array') as author_edits,
       count(*) filter (where jsonb_typeof(locked_spans) <> 'array') as locked_spans
  from public.held_drafts;
```
Write the five counts in the deploy notes (numbers only).

**Apply.** Through `deploy-db.yml`, staging first ("How these files reach a project"). The file refuses a second run, and a run before file 17 (`55000`).

**Check** (expect five rows, each `true`, except `false` for a check the Before counts showed a stored row fails):
```sql
select conname, convalidated from pg_constraint where conrelid = 'public.held_drafts'::regclass
   and conname in ('held_drafts_capture_mode_check', 'held_drafts_edit_level_check', 'held_drafts_machine_edits_shape',
                   'held_drafts_author_edits_shape', 'held_drafts_locked_spans_shape')
 order by conname;
```
Then repeat step 21's `search_path` query (expect 0 rows; this file adds no function). Advisors: none new expected.

**If a check stayed `NOT VALID`.** A draft stored before the file fails it. Do not delete or edit that row: it is a person's words, and no check is worth losing them. Nothing new can go in, because every new and changed row is checked already. The row stays on the server and in its author's pull, where the app drops and counts it as before (`held.rejected`), and the phone that wrote it still has its own copy. A bad `capture_mode` heals with the author's next upload of that draft, because every upload writes it and the app sends only valid values (`outbox.ts` `heldFromDraft` and `heldFromWaiting`); an upload that keeps the bad value is refused `23514`, and the phone keeps the draft and the op in `rejected_writes` (not shown yet, see "How a refusal answers"). A row that fails one of the four words checks (`edit_level`, `machine_edits`, `author_edits`, `locked_spans`) heals only with an upload that changes the words on the current base: a date-only upload with valid values and a stale words upload both leave the stored words in place, so both are refused `23514`. Until it heals, any edit of that row is refused, and letting it go, Keep and Erase now still work (a delete is never checked). One answer can still carry the bad value until then: a Keep of that draft refused as a words conflict sends the row's words in `current`, which the contract refuses when the failed check is `edit_level` or `machine_edits` (review A N2, as before this file). Run the Before count query again from time to time; once a check's count is 0, validate it (`alter table public.held_drafts validate constraint <name>;`, which only reads) and run the Check again. Report the count to the owner as a number only.

**Rollback.** Prefer fixing forward; rolling back brings the gap back. At any time, as one transaction: `alter table public.held_drafts drop constraint held_drafts_capture_mode_check, drop constraint held_drafts_edit_level_check, drop constraint held_drafts_machine_edits_shape, drop constraint held_drafts_author_edits_shape, drop constraint held_drafts_locked_spans_shape;` No data changes either way.

## File 23: a letter is checked at write time for an array `machine_edits` (24 Oct 2026, stream S02)

`20261023040000_entries_machine_edits_check.sql`. The gap file 22 recorded in its header ("One gap stays in entries"): `entries.machine_edits` is `jsonb not null default '[]'` with no shape check, while `author_edits` and `locked_spans` have one (file 16). `entry.upsert` and `entry.reupload` stored it as sent, and an author could write it straight through the Data API, so a JSON null, an object, a string, a number or a boolean could be stored. The app's pull parser refuses such a letter (`PulledRowSchema`: an array), and because a book's rows are one array, one such letter made the author's whole pull answer invalid, every book in it, on every phone of the author (worse than a held draft, which is dropped and counted). The same value in a `current` built from the letter (a words refusal, `dup_outcome`, and `held_state`'s fallback when no held row is left) made the whole push answer invalid, so the refusal the person must resolve never arrived. Another member's pull never carries `machine_edits`. Apply it after `20261023030000_held_drafts_write_checks.sql`. It adds one check constraint on `entries`; it redefines no function, adds no column and drops nothing. Tests: `entries_machine_edits_check` (new) and one drift test in `packages/api/test/contract-drift.test.ts` (every array a pulled letter row carries has an array check on `entries`).

What it changes:
- **`entries_machine_edits_shape`: `machine_edits` is a JSON array**, exactly what the contract accepts for a letter: any array, no size cap of its own (the push batch's 256 KB cap bounds it) and no check on the elements. No null branch: the column is not null, so a SQL null was refused already (`23502`).
- **How a refusal answers.** A write that fails it is a check violation, `23514`, the code every `entries` check answers: `sync_push` answers that op `{op, ok: false, code: "23514"}` (no message, no value), changes nothing for it (a Keep leaves its held draft as it was) and goes on with the rest of the batch. The row `sync_push` proposes is checked before Postgres meets the stored letter, so an op with a bad `machine_edits` is refused whole even when it does not change the words, as a bad `author_edits` already is. A JSON null in the op is the jsonb value null, not a SQL null: it was stored before this file and is `23514` now. An absent key is `[]`, as before. A direct Data API write of null is `23502`, as before. The app treats both codes as a permanent refusal: the phone keeps the letter and the op in `rejected_writes` and marks the letter `rejected` (`apps/mobile/src/lib/sync/merge.ts`); the letter stays on the phone, but no screen shows that state yet (WP-F16-01). No app path sends anything but an array.
- **Not checked, on purpose.** `entry_versions.machine_edits` and `entries.stt_meta`: no pull, push answer or RPC the app calls carries them, so no value there can make the contract refuse anything.
- **A stored letter that fails the check stops the file; no row is ever deleted or changed** (the constitution). In one statement the file adds the check `NOT VALID`, counts the stored letters it refuses, and validates it when the count is 0 (a `NOTICE` says so). When the count is not 0 it raises `55000` with the count and the check name only (never an id or a value), and the whole file rolls back: no check, no history row, no row changed, so the next `db push` runs it again. It never leaves a failing letter behind a `NOT VALID` check, as file 22 would, because on `entries` such a check refuses every update of that letter, and those updates include the deletion paths: a cancelled account deletion would still be purged on day 30 (`cancel_account_deletion`), another person's account deletion would stick in `executing` after their Auth user is gone (`finalize_account_deletion`), Erase now under a legal hold, the undo of a join, a family letter's review and a book deletion with a co-parent would be refused, and a deleted failing letter could never heal (reviews A and B on #258). Once the file is applied no stored row can fail the check (every insert and update is checked), so no line in `docs/ops/runbooks/stuck-deletion.md` is needed.
- **Locks.** The file holds an ACCESS EXCLUSIVE lock on `entries` until it commits, which blocks every pull and book read as well as writes, with up to two scans of the table (the count and the validate). It waits at most 5 seconds for that lock (`lock_timeout`, set local to the file; files 20 to 22 set none), because while it waits every pull and push queues behind it. The whole file is one transaction under `supabase db push` (the pinned CLI 2.119.0 sends it as one batch, its history insert last) and its main block is one statement anyway. Apply it at a quiet time; the Before step's third query says how many letters there are.

**Before.** Every earlier file. Read only (expect true, then 0, then the number of stored letters, then three counts, each 0):
```sql
select exists (select 1 from pg_constraint where conrelid = to_regclass('public.held_drafts') and conname = 'held_drafts_capture_mode_check');
select count(*) from pg_constraint where conrelid = 'public.entries'::regclass and conname = 'entries_machine_edits_shape';
select count(*) from public.entries;
select count(*) filter (where jsonb_typeof(e.machine_edits) <> 'array') as failing,
       count(*) filter (where jsonb_typeof(e.machine_edits) <> 'array'
                          and exists (select 1 from public.deletion_requests d
                                       where d.profile_id = e.author_id and d.status in ('scheduled', 'held', 'executing'))) as failing_open_deletion,
       count(*) filter (where jsonb_typeof(e.machine_edits) <> 'array'
                          and (e.reviewed_by is not null
                               or exists (select 1 from public.child_members m where m.child_id = e.child_id and m.profile_id <> e.author_id))) as failing_shared
  from public.entries e;
```
Write the three counts in the deploy notes (numbers only). `failing` must be 0: the file refuses otherwise (see "If the count is not 0"). The other two say how urgent a non-zero count is: failing letters whose author has an open deletion request (review A N1; book deletion requests are counted too, on purpose, since a book deletion updates letters as well), and failing letters that another person's action touches, because `reviewed_by` is set or the book has another member who may write in it (review A N2).

**Apply.** Through `deploy-db.yml`, staging first ("How these files reach a project"). The file refuses a second run, a run before file 22, and a run while a stored letter fails the check (all `55000`); a refused run changes nothing and records nothing. A refused file 23 also holds back every later migration in the same `db push`, because the push stops at the first failing file: the operator sees the push fail, and the Before count is the way to avoid it. If it fails with `55P03` (`lock_not_available`, "canceling statement due to lock timeout"), nothing changed and nothing was recorded either: retry the deploy a little later, when fewer pulls are running.

**Check** (expect one row, `true`; the file never commits the check `NOT VALID`):
```sql
select convalidated from pg_constraint where conrelid = 'public.entries'::regclass and conname = 'entries_machine_edits_shape';
```
Then repeat step 21's `search_path` query (expect 0 rows; this file adds no function). Advisors: none new expected.

**If the count is not 0.** The file refuses (`55000`, with the count only) and changes nothing. The letter stays exactly as stored, and its author's pull stays broken as it is today. Escalate to the coordinator with the three counts (numbers only, never an id or a value). Do not edit or delete the row, and do not try to bring the count to 0 yourself: the repair is a decision, never an operator step. Writing `[]` would falsely record that the machine made no edits; the person's words (`final_text`, `raw_transcript`) are never touched; and putting back an earlier array from `entry_versions` is not an operator's call either. The app cannot heal such a letter on its own (review B M1 on #258). Once the decision is carried out, run the Before counts again, then apply.

**Rollback.** Prefer fixing forward; rolling back brings the gap back. At any time: `alter table public.entries drop constraint entries_machine_edits_shape;` (it takes the exclusive lock on `entries` briefly). No data changes either way. The migration history row stays, so `db push` never runs this file again; to add the check back, write a new migration.

## File 24: the consent tables' grants match their row security (24 Oct 2026, stream S02)

`20261023050000_consent_grants_tightening.sql`. Review B on #248 (comment 6374282549), notes G2, G3 and G4. Apply it after `20261023040000_entries_machine_edits_check.sql`. Privileges only: it adds, redefines and drops nothing. Tests: `consent_grants_tightening` (new) and new rows in `access_matrix`.

What it changes:
- **`anon` and `authenticated`** lose INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER and MAINTAIN on `policy_acceptances`, `policy_documents` and `policy_versions`, and `anon` loses SELECT on `policy_acceptances`. Row security already refused every one of these, except TRUNCATE and LOCK, which it never sees, and no code path uses them. `authenticated` keeps SELECT on all three (its own acts through `my_policy_state`, and the published texts); `anon` keeps SELECT on the published texts (the consent sheets before sign-in, the staging smoke).
- **`service_role`** loses MAINTAIN on `policy_acceptances` and `subscription_consents` (an exclusive lock there stalls every consent act). File 20 revoked the rest, and `information_schema.role_table_grants` does not list MAINTAIN, so File 20's check could not see it. It keeps SELECT there, and every right on `policy_documents` and `policy_versions` (publishing).
- MAINTAIN exists from Postgres 17; on an older server those revokes are skipped. Every writer is a definer function and keeps working.
- **Default privileges are not changed.** With the old automatic grants this file removes everything above, and a table a later file creates gets them again. Without them (every project created since 30 May 2026) it removes the TRUNCATE, REFERENCES, TRIGGER and MAINTAIN that new tables still get, and its other revokes change nothing. The file header says what `alter default privileges` would do and why it is not here; "Hosted checks before the first apply" a) shows which world a project is in.

**Before.** Every earlier file. Read only (expect true; then true on a project with the automatic grants, false on one without them, see "Hosted checks before the first apply" a):
```sql
select exists (select 1 from pg_constraint where conrelid = 'public.entries'::regclass and conname = 'entries_machine_edits_shape');
select has_table_privilege('authenticated', 'public.policy_acceptances', 'SELECT');
```

**Apply.** After two independent passing reviews on the current head, with green CI, the coordinator merges it into `develop` (D-117), and the founder applies it through `deploy-db.yml`, staging first ("How these files reach a project"). The file refuses a run before file 23 (`55000`), and a second run on a project with the automatic grants or after file 25 (`55000`); on a project without them, a second run before file 25 is not refused and changes nothing.

**Check** (expect five rows: `anon policy_documents SELECT`, `anon policy_versions SELECT`, `authenticated policy_acceptances SELECT`, `authenticated policy_documents SELECT`, `authenticated policy_versions SELECT`; then 0). On Postgres 15, leave `MAINTAIN` out of both lists:
```sql
select r || ' ' || t || ' ' || p from unnest(array['anon', 'authenticated']) r
  cross join unnest(array['policy_acceptances', 'policy_documents', 'policy_versions', 'subscription_consents']) t
  cross join unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN']) p
 where has_table_privilege(r, 'public.' || t, p) order by 1;
select count(*) from unnest(array['policy_acceptances', 'subscription_consents']) t
 cross join unnest(array['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN']) p
 where has_table_privilege('service_role', 'public.' || t, p);
```
Then repeat step 21's `search_path` query (expect 0 rows; this file adds no function). Advisors: none new expected.

**Rollback.** Prefer not to: it gives back privileges no path uses. If a path turns out to need one, grant that one privilege to that one role in a new file (for example `grant select on public.policy_acceptances to anon;`), never the default ALL.

## File 25: every table, view and sequence gets explicit grants (24 Oct 2026, stream S02)

`20261023060000_explicit_grants.sql`. Lens A on #261 (comment 6378839652): Supabase stopped granting new objects in `public` to anon, authenticated and service_role on projects created since 30 May 2026, and does the same on every project from 30 Oct 2026, and every earlier file that creates a table, sequence or function, 1 and 2 included, relied on those grants. Apply it after `20261023050000_consent_grants_tightening.sql`. Privileges only: no function body, column or row changes. Tests: `explicit_grants` (new), the grant list (`supabase/tests/grants.mjs`) and later-object rows in `access_matrix`, and every test file now runs without the automatic grants by default; `db-cli.yml` also runs them with the old ones (`SCRIBE_DEFAULT_GRANTS=legacy`).

**On a new project this file is what makes the app work.** Without it every earlier file applies cleanly, and then the consent sheets, sync, letters and family reads all answer `42501`. The deploy job's smoke is the first thing that fails: its anonymous `policy_versions` read is refused. In the one push that applies files 1 to 25, the objects of files 1 to 24 have no grants until file 25 commits; nothing calls them in that window.

What it changes:
- **One rule for every grant: a grant exists only where a code path uses it today** (the file header names the path behind each one, file and line). Every table, view and sequence in `public` loses every privilege anon, authenticated, service_role and PUBLIC hold (column grants with it), then gets back exactly that list, which `supabase/tests/grants.mjs` holds for the tests:
  - anon reads `policy_versions`, for the deploy smoke's anonymous read (`scripts/ops/lib/smoke.ts:296`); nothing else;
  - authenticated writes `entries`, `held_drafts` and `child_member_prefs` (select, insert, update; `sync_push` and `held_upsert` run as the caller) and `profiles` (select, update; the sign-off name), and reads `audio_blobs`, `child_members`, `deletion_requests`, `my_policy_state` with `policy_acceptances` behind it, `policy_versions`, `sync_epochs`, `sync_op_receipts`, and the listed columns of `children` and `child_keys`. Book edits go through the definer `book_update()`, so `children` has no UPDATE;
  - service_role holds nothing on any table: every worker and function calls definer RPCs, and publishing and support-assisted acts run in the SQL Editor as the owner;
  - every other table and view, `book_entries` (read by `sync_pull`, a definer) and `dictionary_terms` (the dictionary lives on the device) among them, and every sequence: nobody. A later feature that needs more adds its own grant in its own migration.
- **No TRUNCATE, REFERENCES, TRIGGER or MAINTAIN** for any API role on any table (before, anon and authenticated could truncate 13 tables, `entries` among them, and row security does not see TRUNCATE).
- **Functions end the same in both worlds:** service_role keeps EXECUTE only on the 42 functions an earlier file granted it; the old automatic grants had also given it 86 others that no path calls with the service key.
- **Later objects start from nothing.** `alter default privileges for role postgres in schema public revoke all on tables, sequences, functions from anon, authenticated, service_role`. PUBLIC's EXECUTE on new functions stays (Postgres's default; every file revokes it where it matters).
- A role with no grant now gets `42501` where it used to get no row (anon on everything but `policy_versions`, a member reading `book_entries` or `child_invites` directly, anyone's hard delete of a letter). No app path relies on those empty answers.

**Rule for every later migration (since file 25):** a new table, view, sequence or function in `public` gives anon, authenticated and service_role nothing, because file 25 resets the default privileges. The file that creates it grants exactly what a code path uses today, in that same file, revokes EXECUTE from PUBLIC on a function nobody else may call, and adds the grant to `supabase/tests/grants.mjs` (the access matrix fails otherwise).

**Before.** Only on a project that already has files 1 to 24 (on a first push, which applies files 1 to 25 together, skip it: there is no moment between file 24 and file 25, and on an empty project the first query fails with `42P01`; the Check after the push is the evidence). Read only (expect false, then a number above 0):
```sql
select has_table_privilege('anon', 'public.policy_acceptances', 'TRUNCATE');
select count(*) from pg_default_acl d cross join lateral aclexplode(d.defaclacl) a
 where d.defaclnamespace = 'public'::regnamespace and d.defaclrole = 'postgres'::regrole
   and a.grantee in ('anon'::regrole, 'authenticated'::regrole, 'service_role'::regrole);
```

**Apply.** After two independent passing reviews on the current head, with green CI, the coordinator merges it into `develop` (D-117), and the founder applies it through `deploy-db.yml`, staging first ("How these files reach a project"). On staging and production it must be on `develop` before the first staging run is approved ("Hosted checks before the first apply" a). The file refuses a run before file 24, and a second run (`55000`); the run-once check reads the file's own end state (new tables give the API roles nothing, authenticated reads `entries`, anon cannot truncate it), so an old-grants project whose table defaults were already removed by hand is not mistaken for one where file 25 ran.

**Check** (expect 0, then 0, then true; on Postgres 15 leave `MAINTAIN` out of the first list):
```sql
select count(*) from pg_class c cross join unnest(array['anon', 'authenticated', 'service_role']) r
 cross join unnest(array['TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN']) p
 where c.relnamespace = 'public'::regnamespace and c.relkind in ('r', 'p', 'v', 'm') and has_table_privilege(r, c.oid, p);
select count(*) from pg_default_acl d cross join lateral aclexplode(d.defaclacl) a
 where d.defaclnamespace = 'public'::regnamespace and d.defaclrole = 'postgres'::regrole
   and a.grantee in ('anon'::regrole, 'authenticated'::regrole, 'service_role'::regrole);
select has_table_privilege('anon', 'public.policy_versions', 'SELECT')
   and has_table_privilege('authenticated', 'public.entries', 'INSERT')
   and has_table_privilege('authenticated', 'public.held_drafts', 'UPDATE')
   and has_table_privilege('authenticated', 'public.my_policy_state', 'SELECT')
   and not has_table_privilege('anon', 'public.entries', 'SELECT')
   and not has_table_privilege('authenticated', 'public.children', 'UPDATE')
   and not has_table_privilege('service_role', 'public.policy_acceptances', 'SELECT')
   and not has_column_privilege('authenticated', 'public.children', 'date_of_birth', 'SELECT');
```
Then "Hosted checks before the first apply" a) answers `0 | 0 | 0`, and step 21's `search_path` query gives 0 rows (this file adds no function). The deploy job's smoke: before step 8's versions are published it reports `none published`, which is expected; only `anonymous read refused` (401 or 403) means grants are missing, that is, file 25 is not applied. Advisors: none new expected.

**Rollback.** Prefer fixing forward: a path that turns out to need a grant gets that one grant, to that one role, in a new file, never `grant all`. What a rollback would mean: on a project made with the old automatic grants (`early-letters`), granting SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER and MAINTAIN back on every table to all three roles, the 86 function grants to service_role and the old defaults, which reopens the TRUNCATE gap on 13 tables. On a new project there is nothing to go back to: its defaults never had those grants, and without this file the app cannot read or write at all.

## File 26: invite_redeem_by_code, the call behind a typed invite code (27 Oct 2026, stream S02)

`20261027000000_invite_redeem_by_code.sql`. Before this file the `invite-redeem` Edge Function called an RPC that no migration created (review B N8 on #138 deferred it), so every typed code answered 503 `unavailable`. Links were not affected (`accept_child_invite` and `peek_invite` are separate).

What it adds:
- **`public.invite_redeem_by_code(p_user, p_mode, p_code_hash, p_user_subjects, p_device_subjects, p_ip_subjects)`**, executable by `service_role` only. In one transaction it locks each subject hash, checks the limits (10 failures an hour per person, 10 per device, 30 per address, 1,000 for the whole service), looks the code up and, for a wrong, used, expired, revoked or closed code, writes the failure before the answer leaves. Mode `peek` returns the inviter's sign-off and the role (and `joined` while the caller is a member); mode `accept` runs `accept_child_invite_by_code` and returns the book and role. A full book (`SCCAP`) and missing consent (`SCCON`) come back as `refused` and are not counted. Contract: `packages/api/src/server/family.ts`.
- **`public.invite_redeem_failures`**: hashed subjects and times only, no link to a profile, closed to every role; rows older than 2 hours are deleted as new failures are written.
- Tests: `invite_redeem_by_code` (new), and new rows in `access_matrix` and `explicit_grants` (`supabase/tests/grants.mjs`).

**Apply** after file 25. Adds one table and one function; changes and drops nothing. **Check:** `select proname from pg_proc where proname = 'invite_redeem_by_code';` returns one row, and from the app's invite screen a wrong code answers "not found" instead of "try again later". **Rollback:** `drop function public.invite_redeem_by_code(uuid, text, bytea, text[], text[], text[]); drop table public.invite_redeem_failures;`; typed codes then answer 503 again.
