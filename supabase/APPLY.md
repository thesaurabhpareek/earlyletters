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

The unapplied draft `20261003041500_sync_cursor_pull.sql` was deleted on 3 Oct 2026: file 9 replaces it (its `sync_books()` moved into file 9). If your SQL editor history shows it was ever run somewhere, tell the coordinator before applying file 9.

Step 4 drops whatever entries SELECT policies exist, so it is correct whether or not step 3 ran. Apply 3 first anyway, so the live history matches the repo. Files 5 to 7 depend on 4 and on each other; apply them in order.

## Before you start (10 minutes)

1. On your Mac, in the repo: `npm install` then `npm run test:db`. All twelve test files must pass (`access_matrix`, `children_entitlements`, `classification`, `data_governance`, `insights_aggregates`, `ops_deletion_worker`, `perf`, `purge_batching`, `rls`, `security_family`, `sync_engine`, `sync_perf`). Do not continue if anything fails.
2. In the Supabase dashboard, Database > Backups: confirm a daily backup from the last 24 hours exists. If you want an exact restore point, run `supabase db dump --linked -f backup-2026-10-02.sql` (needs the Supabase CLI linked to the project). Storage files are not in database backups; nothing here touches Storage objects.
3. Pick a quiet time. Today only founder data exists, so there is no user impact, but the app build that reads co-parent letters must switch to `book_entries` (section "App changes") before any co-parent uses it.

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

`npm run test:db` includes `supabase/tests/perf.test.mjs`: 1,000 families x 400 letters (400,000 entries, 354 MB with indexes), queried as a signed-in co-parent through RLS and `book_entries`. It fails if any plan sequentially scans `entries`, `children` or `child_members`, or if a p95 exceeds its budget. Times are server-side execution in PGlite (single-threaded WASM Postgres), 200 samples after 20 warm-up queries; native Postgres on Supabase is faster, and the client-side budget including the network is PRD 7.2 (read p95 300 ms).

| Query | What | Measured p95 (2 Oct 2026) | After file 5 (3 Oct 2026) | Budget p95 |
|---|---|---|---|---|
| `book_page` | 60 newest in-book letters of one book | 6.1 ms | 7.0 ms | 15 ms |
| `book_full` | Every in-book letter of one book (about 356) | 8.5 to 8.8 ms | 9.3 ms | 25 ms |
| `search_common` | Full-text search, common words, one book | 3.8 to 4.0 ms | 4.2 ms | 12 ms |
| `search_rare` | Full-text search, rare word, one book | 3.7 to 3.8 ms | 4.0 ms | 12 ms |
| `letter_member` | One letter through `book_entries` | 1.3 to 1.8 ms | 1.6 ms | 4 ms |
| `letter_author` | One own letter from `entries` (with raw transcript) | 0.9 to 1.2 ms | 1.0 ms | 4 ms |

File 5's `book_entries` keeps the same plan shape (bitmap scan of `entries_book_page_idx`, membership resolved once from `child_members_profile_idx`). A first draft that OR-ed two membership subqueries measured 21 ms p95 on `book_page`; the shipped predicate uses one membership subquery plus a parents-only clause for pending letters. On a busy machine all six numbers move together by up to about 1.5x.

Plans: book and search queries use the new partial index `entries_book_page_idx (child_id, occurred_on desc, captured_at desc) where in_book and deleted_at is null`; membership is resolved once per query from `child_members_profile_idx`, so cost follows the reader's own books, not the number of families. Synthetic letters are about 24 words; real letters are longer, which mainly affects search recheck time. Scale knobs: `PERF_FAMILIES`, `PERF_ENTRIES`, `PERF_SAMPLES`; `npm run test:db:perf` runs only this test.

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

- **Exposed schemas: `public` only.** Dashboard > Project Settings > Data API > Exposed schemas. Never add `ops` or `insights` (or `graphql_public` unless GraphQL is wanted; the app does not use it). The private schemas are reached only through service-role functions.
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
