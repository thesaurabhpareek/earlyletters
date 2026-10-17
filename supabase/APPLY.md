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

The unapplied draft `20261003041500_sync_cursor_pull.sql` was deleted on 3 Oct 2026: file 9 replaces it (its `sync_books()` moved into file 9). If your SQL editor history shows it was ever run somewhere, tell the coordinator before applying file 9.

Step 4 drops whatever entries SELECT policies exist, so it is correct whether or not step 3 ran. Apply 3 first anyway, so the live history matches the repo. Files 5 to 7 depend on 4 and on each other; apply them in order.

## Before you start (10 minutes)

1. On your Mac, in the repo: `npm install` then `npm run test:db`. Every test file must pass (20 files after files 13 to 16; `npm run test:db` lists them). Do not continue if anything fails.
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
- **Staging (`scribe-staging`)**: today the workflow runs on a push to `main` that changes `supabase/migrations/**`. PRD V2 08 section 7 moves this to a `workflow_dispatch` from `develop` with the `approve-migration` label (S20, wave 1, not built yet; this PR does not touch `.github/**`). Until S20's change lands, files 13 to 16 reach staging only when a release PR carries them to `main`.
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
-- e) No phone has synced against this project yet (expect 0). If not 0, stop and tell S02: letters that left a
--    reader's view before file 13 have no left_*_xid, so that reader's next digest check can miss them (PR #140
--    fresh review N2); the fix is a backfill in a forward migration, or making the first pull after the deploy a verify pull.
select count(*) from public.sync_op_receipts;
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

After a rollback, some privileges stay tighter than develop's, and that is safe: `anon` has no select on `children` and no writes on `child_members` or `sync_op_receipts`, and `authenticated` has no insert or update on `child_members` (develop's app never uses them; joining and leaving go through the RPCs). The rate-bucket check stays the superset, and file 13's comments stay. Test any rollback in PGlite first (`npm run test:db` on a branch with the reverse migration), and on real PostgreSQL if you can.

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

None. No new cron job: receipts are still trimmed by the hourly `scribe-sync-housekeeping` (step 15); `entry_erasures` and the markers are kept on purpose (they go with the book and the person, by foreign key). If you must apply by hand, use the SQL Editor as in step 18; the file refuses a second run (`55000`, "already applied").

### Answers and error codes added or widened by file 17

| Where | Answer | App |
|---|---|---|
| `entry.upsert` with a `base` on an existing letter whose words changed since | `conflict_groups: ['text']` and `current` (the words now, with `v`); the other groups apply | Keep this phone's words as a conflict copy; the letter follows `current` (ADR 0025 section 5) |
| Any `entry.upsert` on words newer than its base | `current` | As above, only when this phone's words are queued |
| A duplicate (same op id) | `applied_v` (the version it wrote), or the refusal and `current` again | Rebase only on `applied_v` |
| `entry.erase` | `erased`; `missing` (no letter, or another person's: the same answer, with nothing locked); `deferred` (legal hold); a repeat says the same | As ADR 0025 section 12 |
| `entry.upsert` that keeps a held draft and carries `held_base` | when the held words moved on and differ: `applied: false`, `conflict: true`, `conflict_groups: ['text']`, `current` (the held words with `typed_text` and `v`), `held`, no letter; a repeat says the same | Keep this phone's words as a conflict copy, take `current`, send the Keep again with `held_base = current.v` (ADR 0025 section 9) |
| `held.upsert` | `held: {id, v, updated_at}`; `held: null` (kept already); a refusal as above with `typed_text` in `current` | As ADR 0025 section 9 |
| `held.discard` | `{}`; `kept` (newer words since `base`, or a legal hold); `missing`; a repeat says the same | `kept`: the next pull brings it back |
| `SCDEL` detail `purged` (`gone: true`) | now also any upload (letter or held draft) of an id that was erased or purged: purge_ledger, the erasure record, or an `erased` marker. Never "a base and no row" alone, which a server restore also produces | Permanent: the letter stays in this phone's Recently deleted, or is erased |
| `22023` | a held id that is a letter, or another author's held draft, marker or erasure; a malformed `held` pull request; on an older server, the three new op types | Permanent, except the new op types on an older server: wait and retry |
| `SCCON`, `SCIMM` | now also on `held_drafts` (consent; a second raw transcript, id, author, book or creation time) and on a change of a letter's `id` | As for letters |
| `42501` | `held.upsert` or a held insert by anyone not a parent of the book named (whatever the id); a direct delete on `held_drafts`; any read of `held_drafts_gone` or `sync_private.entry_erasures` | Use the ops |

### App and contract changes for file 17

- S03 (#182): delete the three stand-ins and `sync-v1-standin.ts` (the server skips them already). The Keep sends `held_base` (agreed 17 Oct; ADR 0025 section 9).
- S03 (M17): the phone sends `words_reviewed_at` in an `entry.upsert` that changes the words (with `text` in `changed`): the time the author kept the letter with its words on screen, or `null` for machine words still waiting for review. It is stored only with the text group and only when the key is present; own pull rows carry it. Letters written before the phone sends it have none, so `null` means "no mark": the phone's rule for that case is S03's.
- S07 (`packages/api`): `applied_v` (optional string) on push results, `typed_text` on `current` for held answers, `words_reviewed_at` (optional, nullable ISO time) on own rows and on `entry.upsert` data, `held_base` (optional, nullable string) on `entry.upsert`, and the refused Keep answer (`applied: false` with `current` and `held`, no `entry`).
- scripts/ops owner: `parseLedger` (`scripts/ops/lib/drill.ts`) skips every kind but `entry`, `child` and `profile`; `ops_replay_ledger` now replays `held_draft` (and `audio_blob` once #151 is applied).

### Rolling back file 17

Prefer fixing forward. Partial switches, each on its own and each safe:
- Held drafts off: `revoke insert, update on public.held_drafts from authenticated;` (held uploads then fail per op with `42501`; the phone keeps them as rejected writes, so tell S03 first). Everything else keeps working.
- The words compare and set, Erase now and the erasure record have no partial switch: fix forward with a migration.

A full rollback, as one reverse migration, in this order: re-run `sync_push` and `sync_pull` from file 16 (the phones then answer every new op with `22023` and wait); re-run `entries_set_sync_xid` and `entries_not_purged` from file 9, `entries_guard_immutable` from file 16, `prepare_account_purge` from file 4, `purge_due` from file 8, and `ops_replay_ledger`, `ops_incident_scope` and `ops_deletion_residue` from file 10; drop the triggers `entries_note_erasure`, `entries_drop_held`, `child_members_drop_held` and the `held_drafts` triggers with their functions; `drop table public.held_drafts, public.held_drafts_gone;` (this deletes held drafts: export them first, or the authors lose them); `drop schema sync_private cascade;` (the erasure record goes, so an erased letter older than 60 days could come back); drop `entries.text_xid`, `entries.words_reviewed_at` and the four receipt columns. `purge_ledger_entity_type_check` keeps `held_draft` (removing it would fail on any ledger row of that kind). Test the reverse migration in PGlite first.

## File `<timestamp>_backup_server.sql` (S05, PR #151: encrypted recording backup and the recovery key)

S05's text (`docs/ops/BACKUP_RUNBOOK.md` appendix A on `feat/backup-server`), with the real timestamp to be filled in at merge. It is not in this branch; the section is here so the founder has one place for every file.

What it does: the private `entry-audio` bucket and its owner-only policies; tables `backup_devices`, `child_keys`, `audio_blobs`, `backup_usage`, `restore_requests`, `restore_approvals`, `escrow_unwraps` (append-only), `escrow_rotation_notices`, none of them granted to `service_role`; the `backup` policy document; client RPCs `backup_*`; the `escrow_svc` role (created NOLOGIN) with EXECUTE on ten `escrow_*` functions only; service functions `backup_svc_sweep`, `backup_svc_unwraps_between`, `backup_svc_stop`; triggers on `entries`, `profiles` and `deletion_requests` so every deletion path removes backups by exact path; `purge_ledger.entity_type` gains `audio_blob` (no value removed).
Depends on: every earlier file. Needs `app.consent_pepper` set before any account deletion (step 6).
With file 17: either order works (both widen the ledger kinds without dropping any). If #151 is applied before file 17, file 17 adds the held-draft branch to `backup_entry_exists`; if after, #151's own file must carry that branch (request on #151). File 17 calls `backup_forget_entry` from the held-draft delete trigger whenever it exists, and `ops_replay_ledger` replays `audio_blob` once `audio_blobs` exists.
Apply: through `deploy-db.yml` (staging by `workflow_dispatch` with `approve-migration`; production on a `db-v*` tag).
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
