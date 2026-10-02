-- DRAFT. Not applied. Do not move into supabase/migrations/ until reviewed.
-- Data governance: deletion, retention, legal holds, audit, policy acceptances,
-- integrity guards. Implements DATA-REQ-### in docs/legal/DELETION_AND_EXPORT_SPEC.md.
-- Additive only: never edits an applied migration.
--
-- Builds on 20260930000000_scribe_core.sql and 20261001000000_scribe_hardening.sql.
-- Coordinates with Section B's planned migration (children.deleted_at, leave_child,
-- remove_child_member) and the compliance register (policy_acceptances documents).
-- Where B's migration lands first, keep the `if not exists` guards and drop duplicates.
--
-- Custom SQLSTATEs (PowerSync uploadData must treat these as PERMANENT, not retry):
--   SCIMM immutable column changed     SCTMB illegal tombstone transition
--   SCLPG last parent cannot leave     SCDEL deletion rule violated
--   SCPTH photo path outside its entry's folder

-- ─── 0. Fix: deleting the book creator's account must not delete the book ──
-- Today children.created_by is ON DELETE CASCADE, so when the parent who created
-- a book deletes their account, the whole book (including the co-parent's and
-- grandparents' letters) is cascaded away. DATA-REQ-012.
alter table public.children alter column created_by drop not null;
alter table public.children drop constraint if exists children_created_by_fkey;
alter table public.children add constraint children_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete set null;

alter table public.children add column if not exists deleted_at timestamptz;
alter table public.children add column if not exists deletion_request_id uuid;

-- Clients may not tombstone, restore or re-own a book directly (children_member_update
-- lets any member update the row, including contributors).
create or replace function public.children_guard()
returns trigger language plpgsql set search_path = public, pg_catalog as $$
begin
  if current_user in ('authenticated', 'anon') and (
       new.deleted_at is distinct from old.deleted_at
    or new.deletion_request_id is distinct from old.deletion_request_id
    or new.created_by is distinct from old.created_by) then
    raise exception 'children: use request_book_deletion() / cancel_book_deletion()' using errcode = 'SCDEL';
  end if;
  return new;
end;
$$;
create trigger children_guard before update on public.children
  for each row execute function public.children_guard();

create or replace function public.child_is_live(p_child uuid)
returns boolean language sql stable security definer set search_path = public, pg_catalog as $$
  select exists (select 1 from children where id = p_child and deleted_at is null);
$$;

-- ─── 1. Entries: tombstone reasons, content hash, scoped photo paths ───────
alter table public.entries add column if not exists deleted_reason text
  check (deleted_reason in ('user', 'account_deletion', 'book_deletion', 'leave', 'move', 'support'));
alter table public.entries add column if not exists raw_sha256 bytea;

-- Backfill before the guard below makes raw_sha256 immutable.
update public.entries set raw_sha256 = sha256(convert_to(raw_transcript, 'UTF8')) where raw_sha256 is null;
update public.entries set deleted_reason = 'user' where deleted_at is not null and deleted_reason is null;

alter table public.entries add constraint entries_tombstone_pair
  check ((deleted_at is null) = (deleted_reason is null));
-- A photo must live in its own entry's folder; otherwise an author could point
-- photo_path at another family's object and entry_photos_read would expose it.
alter table public.entries add constraint entries_photo_path_scoped
  check (photo_path is null or photo_path like (child_id::text || '/' || author_id::text || '/%')) not valid;

create or replace function public.entries_before_insert()
returns trigger language plpgsql set search_path = public, pg_catalog as $$
begin
  new.raw_sha256 := sha256(convert_to(new.raw_transcript, 'UTF8'));
  if new.deleted_at is not null then
    -- Created and deleted offline before the first sync: tombstone starts now.
    new.deleted_at := now();
    new.deleted_reason := 'user';
  else
    new.deleted_reason := null;
  end if;
  return new;
end;
$$;
create trigger entries_insert_guard before insert on public.entries
  for each row execute function public.entries_before_insert();

-- Replaces the core guard (same trigger name keeps pointing at this function).
create or replace function public.entries_guard_immutable()
returns trigger language plpgsql set search_path = public, pg_catalog as $$
declare
  v_client boolean := current_user in ('authenticated', 'anon');
begin
  if new.raw_transcript is distinct from old.raw_transcript
     or new.captured_at is distinct from old.captured_at
     or new.author_id is distinct from old.author_id
     or new.child_id is distinct from old.child_id
     or new.engine_version is distinct from old.engine_version
     or new.created_at is distinct from old.created_at
     or new.raw_sha256 is distinct from old.raw_sha256 then
    raise exception 'entries: raw_transcript, raw_sha256, captured_at, created_at, author_id, child_id and engine_version are immutable'
      using errcode = 'SCIMM';
  end if;

  if old.deleted_at is null and new.deleted_at is not null then
    -- Tombstone. The clock is the server's: a client cannot back-date to force an early purge.
    new.deleted_at := now();
    if v_client or new.deleted_reason is null then new.deleted_reason := 'user'; end if;
  elsif old.deleted_at is not null and new.deleted_at is null then
    if v_client then
      raise exception 'entries: use restore_entry() to restore a deleted entry' using errcode = 'SCTMB';
    end if;
    new.deleted_reason := null;
  elsif old.deleted_at is not null then
    -- Deletion wins over a concurrent offline edit (DATA-REQ-043).
    new.deleted_at := old.deleted_at;
    new.deleted_reason := old.deleted_reason;
    if v_client and (new.final_text is distinct from old.final_text
                     or new.in_book is distinct from old.in_book
                     or new.machine_edits is distinct from old.machine_edits
                     or new.photo_path is distinct from old.photo_path) then
      raise exception 'entries: a deleted entry cannot be edited; restore it first' using errcode = 'SCTMB';
    end if;
  elsif new.deleted_reason is not null then
    new.deleted_reason := null;
  end if;
  return new;
end;
$$;

-- Versions now also keep machine_edits and who superseded the old state, so an
-- edit-list change without a text change is still reversible (DATA-REQ-041).
alter table public.entry_versions add column if not exists machine_edits jsonb;
alter table public.entry_versions add column if not exists superseded_by uuid;

create or replace function public.entries_record_version()
returns trigger language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  if new.final_text is distinct from old.final_text
     or new.in_book is distinct from old.in_book
     or new.machine_edits is distinct from old.machine_edits then
    insert into entry_versions (entry_id, final_text, in_book, machine_edits, superseded_by)
      values (old.id, old.final_text, old.in_book, old.machine_edits, auth.uid());
  end if;
  return new;
end;
$$;

-- Book view hides letters of a book that is being deleted.
drop policy if exists entries_select on public.entries;
create policy entries_select on public.entries for select to authenticated using (
  author_id = (select auth.uid())
  or (in_book and deleted_at is null and public.is_child_member(child_id) and public.child_is_live(child_id))
);

create index if not exists entries_tombstone_idx on public.entries (deleted_at) where deleted_at is not null;

-- ─── 2. Legal holds (service role only; no user policies) ─────────────────
create table public.legal_holds (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('profile', 'child', 'entry')),
  scope_id uuid not null,
  reason_code text not null check (reason_code in
    ('litigation', 'law_enforcement_preservation', 'regulator', 'safety_investigation', 'other')),
  matter_ref text not null check (char_length(matter_ref) between 1 and 80), -- ticket id, never content
  placed_by text not null check (char_length(placed_by) <= 80),
  placed_at timestamptz not null default now(),
  review_by date not null,
  released_at timestamptz,
  released_by text
);
create index legal_holds_active_idx on public.legal_holds (scope, scope_id) where released_at is null;

create or replace function public.is_held(p_scope text, p_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_catalog as $$
  select exists (select 1 from legal_holds where scope = p_scope and scope_id = p_id and released_at is null);
$$;

create or replace function public.entry_is_held(p_entry uuid)
returns boolean language sql stable security definer set search_path = public, pg_catalog as $$
  select exists (
    select 1 from entries e
    where e.id = p_entry
      and (public.is_held('entry', e.id) or public.is_held('profile', e.author_id) or public.is_held('child', e.child_id))
  );
$$;

-- ─── 3. Audit log: who did what to which id, never content ────────────────
create table public.audit_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor_id uuid,                      -- nulled when the actor's account is purged
  actor_kind text not null check (actor_kind in ('user', 'system', 'support')),
  action text not null check (action in (
    'entry_deleted', 'entry_restored', 'purge_run',
    'book_deletion_requested', 'book_deletion_cancelled', 'book_purged',
    'left_book', 'member_removed',
    'account_deletion_requested', 'account_deletion_cancelled', 'account_deletion_completed',
    'export_created', 'legal_hold_placed', 'legal_hold_released', 'support_access', 'restore_replayed')),
  subject_type text check (subject_type in
    ('entry', 'child', 'membership', 'profile', 'deletion_request', 'export', 'legal_hold', 'system')),
  subject_id uuid,
  child_id uuid,
  -- enums, counts and hashes only; small by construction
  detail jsonb not null default '{}'::jsonb
    check (jsonb_typeof(detail) = 'object' and octet_length(detail::text) <= 512)
);
create index audit_events_actor_idx on public.audit_events (actor_id, at);
create index audit_events_child_idx on public.audit_events (child_id, at);

create or replace function public.audit(p_action text, p_subject_type text, p_subject uuid, p_child uuid, p_detail jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = public, pg_catalog as $$
  insert into audit_events (actor_id, actor_kind, action, subject_type, subject_id, child_id, detail)
  values (auth.uid(), case when auth.uid() is null then 'system' else 'user' end,
          p_action, p_subject_type, p_subject, p_child, coalesce(p_detail, '{}'::jsonb));
$$;

create or replace function public.entries_audit()
returns trigger language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  if old.deleted_at is null and new.deleted_at is not null and new.deleted_reason = 'user' then
    perform public.audit('entry_deleted', 'entry', new.id, new.child_id);
  elsif old.deleted_at is not null and new.deleted_at is null and auth.uid() is not null then
    perform public.audit('entry_restored', 'entry', new.id, new.child_id);
  end if;
  return null;
end;
$$;
create trigger entries_audit after update on public.entries
  for each row execute function public.entries_audit();

-- ─── 4. Last-parent guard and membership audit ───────────────────────────
create or replace function public.child_members_guard()
returns trigger language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  if old.role = 'parent'
     and exists (select 1 from children c where c.id = old.child_id and c.deleted_at is null)
     and not exists (select 1 from child_members m
                     where m.child_id = old.child_id and m.role = 'parent' and m.profile_id <> old.profile_id) then
    raise exception 'the last parent cannot leave a book; delete the book instead' using errcode = 'SCLPG';
  end if;
  return old;
end;
$$;
create trigger child_members_guard before delete on public.child_members
  for each row execute function public.child_members_guard();

create or replace function public.child_members_audit()
returns trigger language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  if auth.uid() is null then return null; end if;   -- cascades and service jobs log elsewhere
  if auth.uid() = old.profile_id then
    perform public.audit('left_book', 'membership', old.profile_id, old.child_id, jsonb_build_object('role', old.role));
  else
    perform public.audit('member_removed', 'membership', old.profile_id, old.child_id, jsonb_build_object('role', old.role));
  end if;
  return null;
end;
$$;
create trigger child_members_audit after delete on public.child_members
  for each row execute function public.child_members_audit();

-- ─── 5. Deletion requests ────────────────────────────────────────────────
create table public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('account', 'book')),
  profile_id uuid,                    -- no FK: outlives the auth user; nulled on completion
  child_id uuid,                      -- book requests only; no FK: the book is purged
  status text not null default 'scheduled'
    check (status in ('scheduled', 'cancelled', 'held', 'executing', 'completed', 'failed')),
  source text not null check (source in ('ios', 'android', 'web', 'support')),
  requested_at timestamptz not null default now(),
  scheduled_for timestamptz not null,
  cancelled_at timestamptz,
  executing_at timestamptz,
  completed_at timestamptz,
  had_active_subscription boolean,    -- as reported by RevenueCat on the device at request time
  receipt jsonb not null default '{}'::jsonb check (octet_length(receipt::text) <= 2048),
  constraint deletion_requests_kind_child check ((kind = 'book') = (child_id is not null))
);
create unique index deletion_requests_one_active on public.deletion_requests
  (profile_id, kind, coalesce(child_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where status in ('scheduled', 'held', 'executing');
create index deletion_requests_due_idx on public.deletion_requests (scheduled_for) where status = 'scheduled';

alter table public.children add constraint children_deletion_request_fk
  foreign key (deletion_request_id) references public.deletion_requests(id) on delete set null;

create table public.deletion_request_steps (
  request_id uuid not null references public.deletion_requests(id) on delete cascade,
  step text not null check (step in (
    'storage_objects', 'apple_token_revoke', 'revenuecat', 'posthog', 'email_provider',
    'contributor_export_notice', 'receipt_email', 'auth_user', 'powersync_verify')),
  status text not null default 'pending' check (status in ('pending', 'done', 'failed', 'not_applicable')),
  attempts int not null default 0,
  last_error_code text check (char_length(last_error_code) <= 40),   -- HTTP status or error class only
  updated_at timestamptz not null default now(),
  primary key (request_id, step)
);

-- Request account deletion. Idempotent: a second call returns the open request.
create or replace function public.request_account_deletion(p_source text, p_had_active_subscription boolean default null)
returns table (request_id uuid, scheduled_for timestamptz)
language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_when timestamptz;
  v_entries int;
  v_books int;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select d.id, d.scheduled_for into v_id, v_when from deletion_requests d
    where d.profile_id = v_uid and d.kind = 'account' and d.status in ('scheduled', 'held', 'executing');
  if found then return query select v_id, v_when; return; end if;

  v_when := now() + interval '30 days';
  insert into deletion_requests (kind, profile_id, status, source, scheduled_for, had_active_subscription)
    values ('account', v_uid, 'scheduled', p_source, v_when, p_had_active_subscription)
    returning id into v_id;

  -- The author's own words leave every view now; restorable until execution.
  update entries set deleted_at = now(), deleted_reason = 'account_deletion'
    where author_id = v_uid and deleted_at is null;
  get diagnostics v_entries = row_count;

  -- Books where they are the only parent go with the account (B-REQ-016).
  -- Books with another parent stay with that parent.
  update children c set deleted_at = now(), deletion_request_id = v_id
    where c.deleted_at is null
      and exists (select 1 from child_members m where m.child_id = c.id and m.profile_id = v_uid and m.role = 'parent')
      and not exists (select 1 from child_members m where m.child_id = c.id and m.role = 'parent' and m.profile_id <> v_uid);
  get diagnostics v_books = row_count;

  insert into deletion_request_steps (request_id, step)
    select v_id, s from unnest(array['storage_objects', 'apple_token_revoke', 'revenuecat', 'posthog',
      'email_provider', 'receipt_email', 'auth_user', 'powersync_verify']) s;
  if v_books > 0 then
    insert into deletion_request_steps (request_id, step) values (v_id, 'contributor_export_notice');
  end if;

  perform public.audit('account_deletion_requested', 'deletion_request', v_id, null,
    jsonb_build_object('entries', v_entries, 'books', v_books, 'source', p_source));
  return query select v_id, v_when;
end;
$$;

create or replace function public.cancel_account_deletion()
returns boolean language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select id into v_id from deletion_requests
    where profile_id = v_uid and kind = 'account' and status in ('scheduled', 'held') for update;
  if not found then return false; end if;
  update deletion_requests set status = 'cancelled', cancelled_at = now() where id = v_id;
  update entries set deleted_at = null where author_id = v_uid and deleted_reason = 'account_deletion';
  update children set deleted_at = null, deletion_request_id = null where deletion_request_id = v_id;
  delete from deletion_request_steps where request_id = v_id;
  perform public.audit('account_deletion_cancelled', 'deletion_request', v_id, null);
  return true;
end;
$$;

-- Delete a book. Sole parent: the book is scheduled for purge in 30 days.
-- With a co-parent: equals rule (B F8, B-REQ-016) - only the caller's own
-- letters are removed and the caller leaves; the book stays.
create or replace function public.request_book_deletion(p_child uuid, p_source text)
returns text language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if not exists (select 1 from child_members where child_id = p_child and profile_id = v_uid and role = 'parent') then
    raise exception 'only a parent can delete a book' using errcode = 'SCDEL';
  end if;
  if exists (select 1 from child_members where child_id = p_child and role = 'parent' and profile_id <> v_uid) then
    update entries set deleted_at = now(), deleted_reason = 'book_deletion'
      where child_id = p_child and author_id = v_uid and deleted_at is null;
    delete from child_members where child_id = p_child and profile_id = v_uid;
    return 'left_and_removed_own_letters';
  end if;
  if exists (select 1 from children where id = p_child and deleted_at is not null) then
    return 'book_scheduled';                                  -- idempotent
  end if;
  insert into deletion_requests (kind, profile_id, child_id, status, source, scheduled_for)
    values ('book', v_uid, p_child, 'scheduled', p_source, now() + interval '30 days') returning id into v_id;
  update children set deleted_at = now(), deletion_request_id = v_id where id = p_child;
  if exists (select 1 from child_members where child_id = p_child and role = 'contributor') then
    insert into deletion_request_steps (request_id, step) values (v_id, 'contributor_export_notice');
  end if;
  perform public.audit('book_deletion_requested', 'child', p_child, p_child);
  return 'book_scheduled';
end;
$$;

create or replace function public.cancel_book_deletion(p_child uuid)
returns boolean language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_uid uuid := auth.uid(); v_req uuid;
begin
  if not exists (select 1 from child_members where child_id = p_child and profile_id = v_uid and role = 'parent') then
    raise exception 'only a parent can restore a book' using errcode = 'SCDEL';
  end if;
  select deletion_request_id into v_req from children where id = p_child and deleted_at is not null for update;
  if not found then return false; end if;
  -- A book deleted as part of an account deletion comes back only by cancelling that request.
  if exists (select 1 from deletion_requests where id = v_req and kind = 'account') then
    raise exception 'cancel the account deletion to restore this book' using errcode = 'SCDEL';
  end if;
  update children set deleted_at = null, deletion_request_id = null where id = p_child;
  update deletion_requests set status = 'cancelled', cancelled_at = now() where id = v_req and status in ('scheduled', 'held');
  perform public.audit('book_deletion_cancelled', 'child', p_child, p_child);
  return true;
end;
$$;

-- Delete one of your own letters. Works even after you left or were removed
-- from the book (entries_author_update requires membership). Idempotent.
create or replace function public.delete_entry(p_entry uuid)
returns boolean language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  if not exists (select 1 from entries where id = p_entry and author_id = auth.uid()) then
    raise exception 'entry not found' using errcode = 'P0002';
  end if;
  update entries set deleted_at = now(), deleted_reason = 'user' where id = p_entry and deleted_at is null;
  return true;
end;
$$;

-- Restore one of your own letters from Recently deleted. Idempotent.
create or replace function public.restore_entry(p_entry uuid)
returns boolean language plpgsql security definer set search_path = public, pg_catalog as $$
declare v entries%rowtype;
begin
  select * into v from entries where id = p_entry for update;
  if not found or v.author_id is distinct from auth.uid() then
    raise exception 'entry not found' using errcode = 'P0002';
  end if;
  if v.deleted_at is null then return true; end if;
  if v.deleted_reason = 'account_deletion' then
    raise exception 'cancel the account deletion to restore these letters' using errcode = 'SCDEL';
  end if;
  if not public.child_is_live(v.child_id) then
    raise exception 'restore the book first' using errcode = 'SCDEL';
  end if;
  update entries set deleted_at = null where id = p_entry;
  return true;
end;
$$;

-- ─── 6. Purge machinery (service role only) ──────────────────────────────
-- Storage objects must be deleted through the Storage API, not SQL (SQL delete
-- orphans the file). SQL enqueues; the `purge-worker` Edge Function drains.
create table public.storage_purge_queue (
  id bigint generated always as identity primary key,
  bucket_id text not null,
  object_path text not null,          -- exact path, or a folder prefix ending in '/'
  is_prefix boolean not null default false,
  reason text not null check (reason in ('entry_purge', 'child_purge', 'account_purge', 'export_expiry', 'orphan')),
  request_id uuid references public.deletion_requests(id) on delete set null,
  enqueued_at timestamptz not null default now(),
  attempts int not null default 0,
  done_at timestamptz,
  unique (bucket_id, object_path)
);

-- Ids of purged things (ids and id-only paths, never content). Re-applied after
-- any database restore (DATA-REQ-030). The worker also appends each day's rows
-- to an object in the private `ops-ledger` bucket, which DB restores do not touch.
create table public.purge_ledger (
  entity_type text not null check (entity_type in ('entry', 'child', 'profile', 'storage_object')),
  entity_id text not null,
  purged_at timestamptz not null default now(),
  primary key (entity_type, entity_id)
);

create or replace function public.purge_due(p_now timestamptz default now())
returns jsonb language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  r record;
  v_children int := 0;
  v_entries int := 0;
  v_accounts int := 0;
  v_cutoff timestamptz := p_now - interval '30 days';
begin
  -- 1. Books tombstoned for 30 days.
  for r in
    select c.id from children c
    where c.deleted_at is not null and c.deleted_at < v_cutoff
      and not public.is_held('child', c.id)
      and not exists (select 1 from entries e where e.child_id = c.id
                      and (public.is_held('entry', e.id) or public.is_held('profile', e.author_id)))
    for update skip locked
  loop
    insert into storage_purge_queue (bucket_id, object_path, is_prefix, reason)
      values ('entry-photos', r.id::text || '/', true, 'child_purge') on conflict do nothing;
    insert into purge_ledger (entity_type, entity_id)
      select 'entry', e.id::text from entries e where e.child_id = r.id on conflict do nothing;
    insert into purge_ledger (entity_type, entity_id) values ('child', r.id::text) on conflict do nothing;
    update deletion_requests set status = 'completed', completed_at = p_now
      where kind = 'book' and child_id = r.id and status in ('scheduled', 'held', 'executing');
    delete from children where id = r.id;   -- cascades members, invites, entries, versions, terms
    perform public.audit('book_purged', 'child', r.id, r.id);
    v_children := v_children + 1;
  end loop;

  -- 2. Letters tombstoned for 30 days.
  for r in
    select e.id, e.photo_path from entries e
    where e.deleted_at is not null and e.deleted_at < v_cutoff and not public.entry_is_held(e.id)
    for update skip locked
  loop
    if r.photo_path is not null then
      insert into storage_purge_queue (bucket_id, object_path, reason)
        values ('entry-photos', r.photo_path, 'entry_purge') on conflict do nothing;
    end if;
    -- When audio_blobs lands (ADR 0006), enqueue its ciphertext object here too
    -- and delete the wrapped file key row in the same transaction (crypto-shred).
    insert into purge_ledger (entity_type, entity_id) values ('entry', r.id::text) on conflict do nothing;
    delete from entries where id = r.id;    -- cascades entry_versions
    v_entries := v_entries + 1;
  end loop;

  -- 3. Account requests that are due: hand to the deletion worker, unless held.
  update deletion_requests d
    set status = case when public.is_held('profile', d.profile_id) then 'held' else 'executing' end,
        executing_at = p_now
    where d.kind = 'account' and d.status = 'scheduled' and d.scheduled_for <= p_now;
  get diagnostics v_accounts = row_count;
  update deletion_requests d set status = 'executing', executing_at = p_now
    where d.status = 'held' and d.kind = 'account' and not public.is_held('profile', d.profile_id)
      and d.scheduled_for <= p_now;

  -- 4. Short-lived records (privacy-policy section 10; DATA-REQ-060..062).
  delete from child_invites where expires_at < p_now - interval '90 days';
  delete from safety_events where created_at < p_now - interval '12 months';
  delete from audit_events where at < p_now - interval '24 months';
  delete from deletion_requests where status in ('completed', 'cancelled')
    and coalesce(completed_at, cancelled_at) < p_now - interval '3 years';

  -- 5. Housekeeping.
  delete from purge_ledger where purged_at < p_now - interval '60 days';
  delete from storage_purge_queue where done_at is not null and done_at < p_now - interval '7 days';

  perform public.audit('purge_run', 'system', null, null,
    jsonb_build_object('books', v_children, 'entries', v_entries, 'accounts_due', v_accounts));
  return jsonb_build_object('books', v_children, 'entries', v_entries, 'accounts_due', v_accounts);
end;
$$;

-- Called by the deletion worker when a request reaches `executing`, before it
-- deletes Storage objects and the auth user (Supabase refuses to delete a user
-- who still owns Storage objects).
create or replace function public.prepare_account_purge(p_request uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_uid uuid; v_entries int; v_books int;
begin
  select profile_id into v_uid from deletion_requests where id = p_request and kind = 'account' and status = 'executing' for update;
  if not found then raise exception 'request not executing' using errcode = 'SCDEL'; end if;
  if public.is_held('profile', v_uid)
     or exists (select 1 from entries e where e.author_id = v_uid
                and (public.is_held('entry', e.id) or public.is_held('child', e.child_id))) then
    update deletion_requests set status = 'held' where id = p_request;
    return jsonb_build_object('held', true);
  end if;

  -- Books where the caller became sole parent during the grace period.
  update children c set deleted_at = now(), deletion_request_id = p_request
    where c.deleted_at is null
      and exists (select 1 from child_members m where m.child_id = c.id and m.profile_id = v_uid and m.role = 'parent')
      and not exists (select 1 from child_members m where m.child_id = c.id and m.role = 'parent' and m.profile_id <> v_uid);

  -- Every folder the author could have written to.
  insert into storage_purge_queue (bucket_id, object_path, is_prefix, reason, request_id)
    select distinct 'entry-photos', x.child_id::text || '/' || v_uid::text || '/', true, 'account_purge', p_request
    from (select child_id from entries where author_id = v_uid
          union select child_id from child_members where profile_id = v_uid) x
    on conflict do nothing;
  -- Books deleted with the account: whole folders (contributors were offered export).
  insert into storage_purge_queue (bucket_id, object_path, is_prefix, reason, request_id)
    select 'entry-photos', c.id::text || '/', true, 'account_purge', p_request
    from children c where c.deletion_request_id = p_request
    on conflict do nothing;

  insert into purge_ledger (entity_type, entity_id)
    select 'entry', id::text from entries where author_id = v_uid on conflict do nothing;
  delete from entries where author_id = v_uid;
  get diagnostics v_entries = row_count;

  insert into purge_ledger (entity_type, entity_id)
    select 'child', id::text from children where deletion_request_id = p_request on conflict do nothing;
  delete from children where deletion_request_id = p_request;
  get diagnostics v_books = row_count;

  return jsonb_build_object('entries', v_entries, 'books', v_books);
end;
$$;

-- Called after the auth user is deleted (profiles and everything keyed to it cascade).
create or replace function public.finalize_account_deletion(p_request uuid, p_receipt jsonb)
returns void language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_uid uuid;
begin
  select profile_id into v_uid from deletion_requests where id = p_request and kind = 'account' and status = 'executing' for update;
  if not found then raise exception 'request not executing' using errcode = 'SCDEL'; end if;
  if exists (select 1 from profiles where id = v_uid) then
    raise exception 'auth user still exists' using errcode = 'SCDEL';
  end if;
  insert into purge_ledger (entity_type, entity_id) values ('profile', v_uid::text) on conflict do nothing;
  update audit_events set actor_id = null where actor_id = v_uid;
  update audit_events set subject_id = null where subject_id = v_uid and subject_type in ('profile', 'membership');
  update deletion_requests set profile_id = null where profile_id = v_uid and status in ('completed', 'cancelled');
  update deletion_requests
    set status = 'completed', completed_at = now(), profile_id = null, receipt = coalesce(p_receipt, '{}'::jsonb)
    where id = p_request;
  insert into audit_events (actor_id, actor_kind, action, subject_type, subject_id)
    values (null, 'system', 'account_deletion_completed', 'deletion_request', p_request);
end;
$$;

-- ─── 7. Policy acceptances ─────────────────────────────────────────────
-- Owned by docs/legal/POLICY_VERSIONING.md (policy_documents, policy_versions,
-- policy_acceptances with pseudonymisation on profile delete, record_policy_act).
-- Not redefined here. DATA-REQ-064 only fixes its retention (life of account + 3 years).

-- ─── 8. RLS ──────────────────────────────────────────────────────────────
alter table public.legal_holds enable row level security;          -- no policies: service role only
alter table public.audit_events enable row level security;
alter table public.deletion_requests enable row level security;
alter table public.deletion_request_steps enable row level security; -- no policies
alter table public.storage_purge_queue enable row level security;  -- no policies
alter table public.purge_ledger enable row level security;         -- no policies

create policy audit_events_own on public.audit_events for select to authenticated
  using (actor_id = (select auth.uid()));
create policy deletion_requests_own on public.deletion_requests for select to authenticated
  using (profile_id = (select auth.uid()));
-- No update/delete policies anywhere above: records are append-only for users.

-- ─── 9. Function privileges ──────────────────────────────────────────────
revoke execute on function public.children_guard() from public, anon, authenticated;
revoke execute on function public.entries_before_insert() from public, anon, authenticated;
revoke execute on function public.entries_audit() from public, anon, authenticated;
revoke execute on function public.child_members_guard() from public, anon, authenticated;
revoke execute on function public.child_members_audit() from public, anon, authenticated;
revoke execute on function public.audit(text, text, uuid, uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.is_held(text, uuid) from public, anon, authenticated;
revoke execute on function public.entry_is_held(uuid) from public, anon, authenticated;
revoke execute on function public.purge_due(timestamptz) from public, anon, authenticated;
revoke execute on function public.prepare_account_purge(uuid) from public, anon, authenticated;
revoke execute on function public.finalize_account_deletion(uuid, jsonb) from public, anon, authenticated;

revoke execute on function public.child_is_live(uuid) from public, anon;
revoke execute on function public.request_account_deletion(text, boolean) from public, anon;
revoke execute on function public.cancel_account_deletion() from public, anon;
revoke execute on function public.request_book_deletion(uuid, text) from public, anon;
revoke execute on function public.cancel_book_deletion(uuid) from public, anon;
revoke execute on function public.restore_entry(uuid) from public, anon;
revoke execute on function public.delete_entry(uuid) from public, anon;
grant execute on function public.child_is_live(uuid) to authenticated;
grant execute on function public.request_account_deletion(text, boolean) to authenticated;
grant execute on function public.cancel_account_deletion() to authenticated;
grant execute on function public.request_book_deletion(uuid, text) to authenticated;
grant execute on function public.cancel_book_deletion(uuid) to authenticated;
grant execute on function public.restore_entry(uuid) to authenticated;
grant execute on function public.delete_entry(uuid) to authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.purge_due(timestamptz) to service_role';
    execute 'grant execute on function public.prepare_account_purge(uuid) to service_role';
    execute 'grant execute on function public.finalize_account_deletion(uuid, jsonb) to service_role';
  end if;
end;
$$;

-- ─── 10. Schedule (Supabase Cron; not available in the PGlite test harness) ──
-- select cron.schedule('scribe-purge-due', '17 * * * *', $$ select public.purge_due(); $$);
-- The `purge-worker` Edge Function runs every 15 minutes: drains storage_purge_queue,
-- executes `executing` account requests (DATA-REQ-020), appends purge_ledger to ops-ledger.
