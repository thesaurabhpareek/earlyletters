-- Data governance: deletion, retention, legal holds, audit, policy acceptances,
-- author-only raw transcripts, per-child settings, integrity guards, and an
-- L1 to L4 classification comment on every column in `public`.
--
-- PENDING: not yet applied to the live project. Apply after
-- 20261002010000_entries_select_policy.sql, following supabase/APPLY.md.
-- Promoted from supabase/migrations/drafts/20261002000000_data_governance.sql
-- (reviewed and fixed 2 Oct 2026). Additive only: never edits an applied migration.
--
-- Implements DATA-REQ-### (docs/legal/DELETION_AND_EXPORT_SPEC.md), PRD K-06
-- (drop safety_events), K-09 (raw transcript author-only), K-12 (per-child
-- settings), K-15 / LEGAL-REQ-001 (policy_acceptances, from POLICY_VERSIONING.md
-- section 7.2), K-22 / DATA-REQ-012 (no cascade across authors), and PRD 7.10
-- (classification; definitions in docs/legal/DATA_CLASSIFICATION.md).
--
-- Fixes against the draft:
--  * entry_photos_read used a subquery on `entries` under the caller's RLS; with
--    author-only entries it would hide in-book photos from co-parents. Now a
--    security-definer helper (can_read_entry_photo).
--  * photo_path must be exactly {child_id}/{author_id}/{entry_id}.{jpg|jpeg|heic|png}.
--  * children_guard also stops contributors changing book settings (K-12: parents only).
--  * safety_events dropped instead of purged (K-06); purge_due no longer touches it.
--  * policy_acceptances defined here (the draft deferred it), with pseudonymised_at
--    and a 3-year retention purge in purge_due (DATA-REQ-064).
--  * finalize_account_deletion also nulls entry_versions.superseded_by.
--  * new security-definer functions are revoked from anon and, where internal,
--    from authenticated.
--
-- Custom SQLSTATEs (PowerSync uploadData must treat these as PERMANENT, not retry):
--   SCIMM immutable column changed     SCTMB illegal tombstone transition
--   SCLPG last parent cannot leave     SCDEL the book or letter is deleted
--   SCPAR parents only                 SCACD an account deletion is pending (cancel it to restore)
--   SCPRG this id was purged and can never come back
--   SCCFG server setting missing (ops alert, not a client error)
-- Review fixes on 3 Oct 2026 (WS-01): DB-01 view write grants revoked, DB-02 purged
-- entry ids refused (SCPRG) and entry/book ledger rows kept, DB-06/DB-14 indexes,
-- DB-07 pepper fails closed, DB-09 SCDEL split, DB-11 search_path order, PDB-02 sequences.

-- ─── 0. Deleting the book creator's account must not delete the book ─────
-- children.created_by was ON DELETE CASCADE: when the parent who created a book
-- deleted their account, the whole book (including the co-parent's and family
-- letters) cascaded away. DATA-REQ-012, PRD K-22.
alter table public.children alter column created_by drop not null;
alter table public.children drop constraint if exists children_created_by_fkey;
alter table public.children add constraint children_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete set null;

alter table public.children add column if not exists deleted_at timestamptz;
alter table public.children add column if not exists deletion_request_id uuid;

-- Book-level settings (K-12 "Book (shared)" scope; parents change them).
alter table public.children add column if not exists nickname text check (char_length(nickname) <= 30);
alter table public.children add column if not exists due_date date;
alter table public.children add column if not exists photo_path text;
alter table public.children add column if not exists book_look text not null default 'classic'
  check (book_look ~ '^[a-z][a-z0-9_]{0,23}$');
alter table public.children add column if not exists family_can_read boolean not null default false;
alter table public.children add column if not exists hidden_at timestamptz;
alter table public.children add constraint children_photo_path_scoped
  check (photo_path is null or photo_path ~ ('^' || id::text || '/[0-9a-f-]{36}\.(jpg|jpeg|heic|png)$'));

create or replace function public.is_child_parent(p_child uuid)
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
  select exists (select 1 from child_members
                 where child_id = p_child and profile_id = auth.uid() and role = 'parent');
$$;

-- Clients may not tombstone, restore or re-own a book directly, and only parents
-- may change book settings (children_member_update lets any member update).
create or replace function public.children_guard()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin
  if current_user in ('authenticated', 'anon') then
    if new.deleted_at is distinct from old.deleted_at
       or new.deletion_request_id is distinct from old.deletion_request_id
       or new.created_by is distinct from old.created_by then
      raise exception 'children: use request_book_deletion() / cancel_book_deletion()' using errcode = 'SCTMB';
    end if;
    if not public.is_child_parent(old.id) then
      raise exception 'children: only a parent can change book settings' using errcode = 'SCPAR';
    end if;
  end if;
  return new;
end;
$$;
create trigger children_guard before update on public.children
  for each row execute function public.children_guard();

create or replace function public.child_is_live(p_child uuid)
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
  select exists (select 1 from children where id = p_child and deleted_at is null);
$$;

-- ─── 1. Entries: tombstone reasons, content hash, scoped photo paths ───────
alter table public.entries add column if not exists deleted_reason text
  check (deleted_reason in ('user', 'account_deletion', 'book_deletion', 'leave', 'move', 'support'));
alter table public.entries add column if not exists raw_sha256 bytea;
-- Signature at save time ("Papa"), so a later rename never rewrites old letters
-- (mirrors apps/mobile/src/lib/store.ts entries.author_signs_as).
alter table public.entries add column if not exists author_signs_as text check (char_length(author_signs_as) <= 30);

-- Backfill before the guard below makes raw_sha256 immutable.
update public.entries set raw_sha256 = sha256(convert_to(raw_transcript, 'UTF8')) where raw_sha256 is null;
update public.entries set deleted_reason = 'user' where deleted_at is not null and deleted_reason is null;

alter table public.entries add constraint entries_tombstone_pair
  check ((deleted_at is null) = (deleted_reason is null));
-- A photo must be its own entry's object; otherwise an author could point
-- photo_path at another family's object and the read policy would expose it.
-- NOT VALID: existing rows are checked by APPLY.md step 4 before VALIDATE.
alter table public.entries add constraint entries_photo_path_scoped
  check (photo_path is null
         or photo_path ~ ('^' || child_id::text || '/' || author_id::text || '/' || id::text || '\.(jpg|jpeg|heic|png)$')) not valid;

-- Security definer so it can read purge_ledger, which has no client policies.
-- Replaced in 20261003010000 (adds the UUIDv7 and captured_at checks).
create or replace function public.entries_before_insert()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  -- DB-02: a purged letter never comes back, even from a stale device's upsert.
  if exists (select 1 from purge_ledger where entity_type = 'entry' and entity_id = new.id::text) then
    raise exception 'entries: this letter was deleted for good' using errcode = 'SCPRG';
  end if;
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
returns trigger language plpgsql set search_path = pg_catalog, public as $$
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

-- Versions also keep machine_edits and who superseded the old state, so an
-- edit-list change without a text change is still reversible (DATA-REQ-041).
alter table public.entry_versions add column if not exists machine_edits jsonb;
alter table public.entry_versions add column if not exists superseded_by uuid;

create or replace function public.entries_record_version()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
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

create index if not exists entries_tombstone_idx on public.entries (deleted_at) where deleted_at is not null;
-- DB-06: a full (non-partial) index on child_id, for the children FK cascade and
-- purge_due's per-book scans, which also see tombstoned rows.
create index if not exists entries_child_occurred_idx on public.entries (child_id, occurred_on);
-- DB-14: entries_book_idx (child_id, occurred_on) where deleted_at is null is covered
-- by entries_child_occurred_idx and entries_book_page_idx.
drop index if exists public.entries_book_idx;
-- Book list and chapter pages: newest first within one child, live in-book letters only.
create index if not exists entries_book_page_idx on public.entries (child_id, occurred_on desc, captured_at desc)
  where in_book and deleted_at is null;
-- Photo read policy looks entries up by object path.
create index if not exists entries_photo_path_idx on public.entries (photo_path) where photo_path is not null;

-- ─── 1a. Raw transcripts are author-only (PRD K-09, B-NFR-003) ─────────────
-- The entries table is readable only by the author (all columns, any state).
-- Everyone else reads book letters through book_entries, which omits
-- raw_transcript, raw_sha256, machine_edits, stt_meta and deleted_reason.
-- Drops cover both states of the live project (pending 20261002010000 applied or not).
drop policy if exists entries_select on public.entries;
drop policy if exists entries_author_select on public.entries;
drop policy if exists entries_book_select on public.entries;
create policy entries_select on public.entries for select to authenticated
  using (author_id = (select auth.uid()));

-- Security-barrier view owned by the migration role, so it reads entries
-- without the caller's RLS and applies its own rule. Supabase advisor 0010
-- (security definer view) is expected here; see APPLY.md.
create view public.book_entries with (security_barrier = true) as
select e.id, e.child_id, e.author_id, e.author_signs_as, e.kind, e.occurred_on, e.captured_at,
       e.capture_mode, e.edit_level, e.prompt_key, e.prompt_library_version, e.engine_version,
       e.final_text, e.in_book, e.photo_path, e.audio_kept_on_device, e.sounds_like_me,
       e.created_at, e.updated_at, e.deleted_at, e.search
  from public.entries e
 where e.author_id = (select auth.uid())
    or (e.in_book and e.deleted_at is null
        -- The caller's live books, found from their memberships (index on profile_id),
        -- so cost tracks the caller's books, not the number of families.
        and e.child_id in (select m.child_id from public.child_members m
                             join public.children c on c.id = m.child_id and c.deleted_at is null
                            where m.profile_id = (select auth.uid())));
-- DB-01: Supabase grants insert/update/delete on new views to the API roles. The
-- view is auto-updatable and runs as its owner, so a write through it would skip
-- RLS, the tombstone rules and the audit log. Read-only for everyone.
revoke all on public.book_entries from public, anon;
revoke insert, update, delete, truncate, references, trigger on public.book_entries from authenticated;
grant select on public.book_entries to authenticated;
comment on view public.book_entries is
  'Book letters for members without the author''s working material (raw transcript, its hash, machine edits, STT metadata). PRD K-09.';

-- Photos: own folder, or the photo of a live in-book letter in a live book you belong to.
create or replace function public.can_read_entry_photo(p_name text)
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
  select exists (
    select 1 from entries e
     where e.photo_path = p_name and e.in_book and e.deleted_at is null
       and exists (select 1 from child_members m where m.child_id = e.child_id and m.profile_id = auth.uid())
       and exists (select 1 from children c where c.id = e.child_id and c.deleted_at is null));
$$;
drop policy if exists entry_photos_read on storage.objects;
create policy entry_photos_read on storage.objects for select to authenticated using (
  bucket_id = 'entry-photos'
  and ((storage.foldername(name))[2] = (select auth.uid())::text or public.can_read_entry_photo(name))
);

-- ─── 1b. Per-child settings (PRD K-12, PRD-REQ-013) ───────────────────────
-- Book (shared): columns on children above (parents only, children_guard).
-- Parent, per family member per child: auto-add their letters.
alter table public.child_members add column if not exists auto_add_letters boolean not null default false;

-- Person, per child: each member for themselves.
create table public.child_member_prefs (
  child_id uuid not null,
  profile_id uuid not null,
  signs_as text check (char_length(signs_as) <= 30),
  include_in_reminders boolean not null default true,
  celebrations_paused boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (child_id, profile_id),
  -- Leaving or removal deletes the member's prefs for that child.
  foreign key (child_id, profile_id) references public.child_members(child_id, profile_id) on delete cascade
);
create index child_member_prefs_profile_idx on public.child_member_prefs (profile_id);
create trigger child_member_prefs_touch before update on public.child_member_prefs
  for each row execute function public.touch_updated_at();

create or replace function public.set_member_auto_add(p_child uuid, p_member uuid, p_on boolean)
returns boolean language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if not public.is_child_parent(p_child) then
    raise exception 'only a parent can change auto-add' using errcode = 'SCPAR';
  end if;
  update child_members set auto_add_letters = p_on where child_id = p_child and profile_id = p_member;
  return found;
end;
$$;

-- ─── 1c. Safety tiers stay on the device (PRD K-06, LEGAL-REQ-015) ────────
-- Drops the table, its insert policy and safety_events_author_idx.
drop table if exists public.safety_events;

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
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
  select exists (select 1 from legal_holds where scope = p_scope and scope_id = p_id and released_at is null);
$$;

create or replace function public.entry_is_held(p_entry uuid)
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
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
returns void language sql security definer set search_path = pg_catalog, public as $$
  insert into audit_events (actor_id, actor_kind, action, subject_type, subject_id, child_id, detail)
  values (auth.uid(), case when auth.uid() is null then 'system' else 'user' end,
          p_action, p_subject_type, p_subject, p_child, coalesce(p_detail, '{}'::jsonb));
$$;

create or replace function public.entries_audit()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
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
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
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
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
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
  had_active_subscription boolean,    -- as reported by StoreKit on the device at request time (no server purchase data)
  receipt jsonb not null default '{}'::jsonb check (octet_length(receipt::text) <= 2048),
  constraint deletion_requests_kind_child check ((kind = 'book') = (child_id is not null))
);
create unique index deletion_requests_one_active on public.deletion_requests
  (profile_id, kind, coalesce(child_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where status in ('scheduled', 'held', 'executing');
create index deletion_requests_due_idx on public.deletion_requests (scheduled_for) where status = 'scheduled';

alter table public.children add constraint children_deletion_request_fk
  foreign key (deletion_request_id) references public.deletion_requests(id) on delete set null;
create index if not exists children_deletion_request_idx on public.children (deletion_request_id)
  where deletion_request_id is not null;

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
language plpgsql security definer set search_path = pg_catalog, public as $$
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
  -- Books with another parent stay with that parent, with that parent's and family letters.
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
returns boolean language plpgsql security definer set search_path = pg_catalog, public as $$
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
returns text language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if not exists (select 1 from child_members where child_id = p_child and profile_id = v_uid and role = 'parent') then
    raise exception 'only a parent can delete a book' using errcode = 'SCPAR';
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
returns boolean language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_uid uuid := auth.uid(); v_req uuid;
begin
  if not exists (select 1 from child_members where child_id = p_child and profile_id = v_uid and role = 'parent') then
    raise exception 'only a parent can restore a book' using errcode = 'SCPAR';
  end if;
  select deletion_request_id into v_req from children where id = p_child and deleted_at is not null for update;
  if not found then return false; end if;
  -- A book deleted as part of an account deletion comes back only by cancelling that request.
  if exists (select 1 from deletion_requests where id = v_req and kind = 'account') then
    raise exception 'cancel the account deletion to restore this book' using errcode = 'SCACD';
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
returns boolean language plpgsql security definer set search_path = pg_catalog, public as $$
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
returns boolean language plpgsql security definer set search_path = pg_catalog, public as $$
declare v entries%rowtype;
begin
  select * into v from entries where id = p_entry for update;
  if not found or v.author_id is distinct from auth.uid() then
    raise exception 'entry not found' using errcode = 'P0002';
  end if;
  if v.deleted_at is null then return true; end if;
  if v.deleted_reason = 'account_deletion' then
    raise exception 'cancel the account deletion to restore these letters' using errcode = 'SCACD';
  end if;
  if not public.child_is_live(v.child_id) then
    raise exception 'restore the book first' using errcode = 'SCDEL';
  end if;
  update entries set deleted_at = null where id = p_entry;
  return true;
end;
$$;

-- ─── 6. Policy documents, versions and acceptances (POLICY_VERSIONING.md 7.2) ──
create table public.policy_documents (
  key text primary key check (key ~ '^[a-z][a-z0-9-]{1,40}$'),
  title text not null check (char_length(title) <= 120),
  needs_affirmative_act boolean not null
);

create table public.policy_versions (
  document text not null references public.policy_documents(key),
  version text not null check (version ~ '^[0-9]+\.[0-9]+\.[0-9]+$'),
  major int generated always as (split_part(version, '.', 1)::int) stored,
  minor int generated always as (split_part(version, '.', 2)::int) stored,
  patch int generated always as (split_part(version, '.', 3)::int) stored,
  change_class text not null check (change_class in ('initial', 'major', 'minor', 'patch')),
  requires_reconsent boolean not null,
  published_at timestamptz not null,
  new_users_from timestamptz not null,
  effective_at timestamptz not null,
  content_sha256 bytea not null,          -- sha256 of the published English markdown
  url text not null,                      -- permanent versioned URL
  summary text not null check (char_length(summary) <= 600),  -- plain-language change line
  primary key (document, version),
  check (new_users_from >= published_at),
  check (effective_at >= published_at)
);

-- Versions are immutable; a major change to a document that needs an affirmative act
-- must require re-consent; major changes need 30 days' notice unless counsel approves.
create or replace function public.policy_versions_guard()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
declare v_affirm boolean;
begin
  if tg_op = 'UPDATE' then
    raise exception 'policy_versions rows are immutable; publish a new version';
  end if;
  select needs_affirmative_act into v_affirm from policy_documents where key = new.document;
  if new.change_class = 'major' and v_affirm and not new.requires_reconsent then
    raise exception 'major change to % must require re-consent', new.document;
  end if;
  if new.change_class = 'major' and new.effective_at < new.published_at + interval '30 days'
     and current_setting('app.allow_short_notice', true) is distinct from 'on' then
    raise exception 'major change needs 30 days notice unless counsel approves short notice';
  end if;
  return new;
end;
$$;
create trigger policy_versions_guard before insert or update on public.policy_versions
  for each row execute function public.policy_versions_guard();

-- Append-only record of acts. "user" = profile_id (pseudonymised at deletion),
-- "policy" = document, "version" = version, "accepted_at" = server time of the act.
create table public.policy_acceptances (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  subject_hash bytea,                     -- set when the profile is deleted (pseudonymised retention)
  pseudonymised_at timestamptz,           -- retention clock: rows are deleted 3 years after this
  document text not null,
  version text not null,
  action text not null check (action in ('accept', 'decline', 'withdraw', 'acknowledge')),
  method text not null check (method in (
    'signin_sheet', 'reconsent_sheet', 'consent_sheet', 'settings_toggle',
    'paywall_purchase', 'web_contributor_page', 'web_account_page', 'support_assisted')),
  surface text not null check (surface ~ '^[a-z0-9_.]{1,64}$'),
  accepted_at timestamptz not null default now(),
  client_recorded_at timestamptz,
  app_version text not null check (char_length(app_version) <= 32),
  platform text not null check (platform in ('ios', 'android', 'web')),
  locale text check (locale ~ '^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$'),
  rendered_sha256 bytea,
  context jsonb not null default '{}'::jsonb,  -- enums and ids only
  foreign key (document, version) references public.policy_versions(document, version),
  check (profile_id is not null or subject_hash is not null),
  check (pg_column_size(context) <= 512)
);
create index policy_acceptances_profile_idx on public.policy_acceptances (profile_id, document, accepted_at desc);
create index policy_acceptances_doc_version_idx on public.policy_acceptances (document, version);
create index policy_acceptances_pseudonymised_idx on public.policy_acceptances (pseudonymised_at)
  where pseudonymised_at is not null;
comment on table public.policy_acceptances is
  'Append-only record of acceptance, decline, withdrawal and acknowledgment of versioned legal texts. No IP, no user agent, no free text.';

-- Rows are immutable except the pseudonymisation step and the retention purge.
create or replace function public.policy_acceptances_guard()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin
  if tg_op = 'DELETE' then
    if current_setting('app.retention_purge', true) is distinct from 'on' then
      raise exception 'policy_acceptances rows are append-only';
    end if;
    return old;
  end if;
  if new.profile_id is null and old.profile_id is not null and new.subject_hash is not null
     and (new.id, new.document, new.version, new.action, new.method, new.surface, new.accepted_at,
          new.client_recorded_at, new.app_version, new.platform, new.locale, new.rendered_sha256, new.context)
         is not distinct from
         (old.id, old.document, old.version, old.action, old.method, old.surface, old.accepted_at,
          old.client_recorded_at, old.app_version, old.platform, old.locale, old.rendered_sha256, old.context) then
    return new;
  end if;
  raise exception 'policy_acceptances rows are append-only';
end;
$$;
create trigger policy_acceptances_guard before update or delete on public.policy_acceptances
  for each row execute function public.policy_acceptances_guard();

-- Pseudonymise before the profile row disappears. The pepper is a server-only
-- setting (APPLY.md step 6) so hashes cannot be reversed by guessing UUIDs.
-- DB-07: fails closed. Without a pepper of at least 32 characters no profile can be
-- deleted (SCCFG), rather than silently hashing with an empty pepper. There is no
-- bypass flag; the test suite sets its own test pepper.
create or replace function public.policy_acceptances_pseudonymise()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_pepper text := current_setting('app.consent_pepper', true);
begin
  if v_pepper is null or char_length(v_pepper) < 32 then
    raise exception 'app.consent_pepper is not set (APPLY.md step 6)' using errcode = 'SCCFG',
      hint = 'Ops: set the pepper for this environment; never change it once set.';
  end if;
  update policy_acceptances
     set subject_hash = sha256(convert_to(old.id::text || v_pepper, 'UTF8')),
         pseudonymised_at = now(),
         profile_id = null
   where profile_id = old.id;
  return old;
end;
$$;
create trigger profiles_pseudonymise_acceptances before delete on public.profiles
  for each row execute function public.policy_acceptances_pseudonymise();

-- The only write path for clients.
create or replace function public.record_policy_act(
  p_document text,
  p_version text,
  p_action text,
  p_method text,
  p_surface text,
  p_app_version text,
  p_platform text,
  p_locale text default null,
  p_client_recorded_at timestamptz default null,
  p_rendered_sha256 bytea default null,
  p_context jsonb default '{}'::jsonb
) returns uuid language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_ver policy_versions%rowtype; v_id uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if p_method = 'support_assisted' then
    raise exception 'support-assisted acts are recorded by the service role' using errcode = '22023';
  end if;
  select * into v_ver from policy_versions where document = p_document and version = p_version;
  if not found or v_ver.new_users_from > now() then
    raise exception 'unknown document version' using errcode = 'P0002';
  end if;
  -- Accepting a superseded version is refused so stale clients cannot pin old terms.
  if p_action = 'accept' and exists (
       select 1 from policy_versions n
        where n.document = p_document and n.new_users_from <= now()
          and (n.major, n.minor, n.patch) > (v_ver.major, v_ver.minor, v_ver.patch)
          and n.requires_reconsent) then
    raise exception 'a newer version requires acceptance' using errcode = 'SCVER',
      hint = 'Fetch policy_actions_needed() and show that version.';
  end if;
  if p_client_recorded_at is not null and p_client_recorded_at > now() + interval '5 minutes' then
    p_client_recorded_at := null;  -- device clock in the future; keep server time only
  end if;
  insert into policy_acceptances (profile_id, document, version, action, method, surface,
                                  client_recorded_at, app_version, platform, locale, rendered_sha256, context)
  values (auth.uid(), p_document, p_version, p_action, p_method, p_surface,
          p_client_recorded_at, p_app_version, p_platform, p_locale, p_rendered_sha256, coalesce(p_context, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

create or replace view public.my_policy_state with (security_invoker = true) as
select distinct on (a.document)
       a.document, a.version, a.action, a.accepted_at
  from public.policy_acceptances a
 where a.profile_id = (select auth.uid())
 order by a.document, a.accepted_at desc;

revoke all on public.my_policy_state from public, anon;
revoke insert, update, delete, truncate, references, trigger on public.my_policy_state from authenticated;   -- DB-01
grant select on public.my_policy_state to authenticated;

create or replace function public.policy_actions_needed()
returns table (document text, version text, effective_at timestamptz, summary text)
language sql stable security definer set search_path = pg_catalog, public as $$
  with cur as (
    select distinct on (v.document) v.*
      from policy_versions v join policy_documents d on d.key = v.document
     where d.needs_affirmative_act and v.effective_at <= now()
     order by v.document, v.major desc, v.minor desc, v.patch desc
  ), mine as (
    select distinct on (a.document) a.document, a.version, a.action
      from policy_acceptances a
     where a.profile_id = auth.uid() and a.action in ('accept', 'decline', 'withdraw')
     order by a.document, a.accepted_at desc
  )
  select c.document, c.version, c.effective_at, c.summary
    from cur c left join mine m on m.document = c.document
    left join policy_versions mv on mv.document = m.document and mv.version = m.version
   where c.document in ('terms', 'contributor-notice')   -- consents are offered, not demanded
     and (m.document is null or m.action <> 'accept' or (c.requires_reconsent and mv.major < c.major));
$$;

create or replace function public.has_active_consent(p_profile uuid, p_document text)
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
  select coalesce((
    select a.action = 'accept'
      from policy_acceptances a
      join policy_versions v on v.document = a.document and v.version = a.version
     where a.profile_id = p_profile and a.document = p_document
       and not exists (
         select 1 from policy_versions n
          where n.document = a.document and n.effective_at <= now()
            and n.requires_reconsent and n.major > v.major)
     order by a.accepted_at desc
     limit 1), false);
$$;

-- Document keys (POLICY_VERSIONING.md section 1). Versions are published by the service role.
insert into public.policy_documents (key, title, needs_affirmative_act) values
  ('terms', 'Terms of Service', true),
  ('privacy', 'Privacy Policy', false),
  ('health-privacy', 'Consumer Health Data Privacy Policy', false),
  ('sensitive-data', 'Sensitive data consent', true),
  ('ai-processing', 'Third-party AI processing consent', true),
  ('analytics', 'Usage analytics and crash reporting consent', true),
  ('auto-renewal-terms', 'Plus subscription and automatic renewal terms', true),
  ('contributor-notice', 'Family contributor notice', true),
  ('backup-recovery', 'Backup recovery disclosure', true),
  ('subprocessors', 'Service providers and processors', false),
  ('pledge', 'Shutdown and portability pledge', false),
  ('accessibility', 'Accessibility statement', false),
  ('legal-process', 'Legal process guidelines', false)
on conflict (key) do nothing;

-- ─── 7. Purge machinery (service role only) ──────────────────────────────
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
create index storage_purge_queue_request_idx on public.storage_purge_queue (request_id) where request_id is not null;

-- Ids of purged things (ids and id-only paths, never content). Re-applied after
-- any database restore (DATA-REQ-030).
create table public.purge_ledger (
  entity_type text not null check (entity_type in ('entry', 'child', 'profile', 'storage_object')),
  entity_id text not null,
  purged_at timestamptz not null default now(),
  primary key (entity_type, entity_id)
);

create or replace function public.purge_due(p_now timestamptz default now())
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
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
    delete from children where id = r.id;   -- cascades members, prefs, invites, entries, versions, terms
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

  -- 4. Short-lived records (privacy-policy section 10; DATA-REQ-060, 064, 066).
  --    Safety events: not applicable, no server table (PRD K-06).
  delete from child_invites where expires_at < p_now - interval '90 days';
  delete from audit_events where at < p_now - interval '24 months';
  delete from deletion_requests where status in ('completed', 'cancelled')
    and coalesce(completed_at, cancelled_at) < p_now - interval '3 years';
  perform set_config('app.retention_purge', 'on', true);
  delete from policy_acceptances where pseudonymised_at < p_now - interval '3 years';
  perform set_config('app.retention_purge', 'off', true);

  -- 5. Housekeeping. Entry and book ids stay in the ledger for good (DB-02: a purged
  --    id must never be re-inserted); only person and object-path rows age out.
  delete from purge_ledger where entity_type in ('profile', 'storage_object') and purged_at < p_now - interval '60 days';
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
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_uid uuid; v_entries int; v_books int;
begin
  select profile_id into v_uid from deletion_requests where id = p_request and kind = 'account' and status = 'executing' for update;
  if not found then raise exception 'request not executing' using errcode = '55000'; end if;
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

  -- Every folder the author could have written to (their own subfolder only).
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

  -- Only this author's letters; co-parent and family letters are never touched (DATA-REQ-012).
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
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_uid uuid;
begin
  select profile_id into v_uid from deletion_requests where id = p_request and kind = 'account' and status = 'executing' for update;
  if not found then raise exception 'request not executing' using errcode = '55000'; end if;
  if exists (select 1 from profiles where id = v_uid) then
    raise exception 'auth user still exists' using errcode = '55000';
  end if;
  insert into purge_ledger (entity_type, entity_id) values ('profile', v_uid::text) on conflict do nothing;
  update audit_events set actor_id = null where actor_id = v_uid;
  update audit_events set subject_id = null where subject_id = v_uid and subject_type in ('profile', 'membership');
  update entry_versions set superseded_by = null where superseded_by = v_uid;
  update deletion_requests set profile_id = null where profile_id = v_uid and status in ('completed', 'cancelled');
  update deletion_requests
    set status = 'completed', completed_at = now(), profile_id = null, receipt = coalesce(p_receipt, '{}'::jsonb)
    where id = p_request;
  insert into audit_events (actor_id, actor_kind, action, subject_type, subject_id)
    values (null, 'system', 'account_deletion_completed', 'deletion_request', p_request);
end;
$$;

-- ─── 8. RLS ──────────────────────────────────────────────────────────────
alter table public.legal_holds enable row level security;          -- no policies: service role only
alter table public.audit_events enable row level security;
alter table public.deletion_requests enable row level security;
alter table public.deletion_request_steps enable row level security; -- no policies
alter table public.storage_purge_queue enable row level security;  -- no policies
alter table public.purge_ledger enable row level security;         -- no policies
alter table public.child_member_prefs enable row level security;
alter table public.policy_documents enable row level security;
alter table public.policy_versions enable row level security;
alter table public.policy_acceptances enable row level security;

create policy audit_events_own on public.audit_events for select to authenticated
  using (actor_id = (select auth.uid()));
create policy deletion_requests_own on public.deletion_requests for select to authenticated
  using (profile_id = (select auth.uid()));
-- No update/delete policies above: records are append-only for users.

create policy child_member_prefs_own on public.child_member_prefs for all to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()) and public.is_child_member(child_id));

create policy policy_documents_read on public.policy_documents for select to anon, authenticated using (true);
create policy policy_versions_read on public.policy_versions for select to anon, authenticated using (true);
create policy policy_acceptances_own_read on public.policy_acceptances for select to authenticated
  using (profile_id = (select auth.uid()));
-- No insert/update/delete policies: writes go through record_policy_act (clients)
-- or the service role (publishing, support-assisted, retention purge).

-- ─── 9. Function privileges ──────────────────────────────────────────────
-- DB-11: security-definer functions resolve pg_catalog before public. The two from
-- the applied core file are re-pinned here (alter, not replace: bodies unchanged).
alter function public.handle_new_user() set search_path = pg_catalog, public;
alter function public.is_child_member(uuid) set search_path = pg_catalog, public;

-- Internal: triggers, helpers and service-role jobs.
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
revoke execute on function public.policy_versions_guard() from public, anon, authenticated;
revoke execute on function public.policy_acceptances_guard() from public, anon, authenticated;
revoke execute on function public.policy_acceptances_pseudonymise() from public, anon, authenticated;
revoke execute on function public.has_active_consent(uuid, text) from public, anon, authenticated;

-- Signed-in users (RLS helpers called as the user, and RPCs that check auth.uid()).
revoke execute on function public.child_is_live(uuid) from public, anon;
revoke execute on function public.is_child_parent(uuid) from public, anon;
revoke execute on function public.can_read_entry_photo(text) from public, anon;
revoke execute on function public.set_member_auto_add(uuid, uuid, boolean) from public, anon;
revoke execute on function public.request_account_deletion(text, boolean) from public, anon;
revoke execute on function public.cancel_account_deletion() from public, anon;
revoke execute on function public.request_book_deletion(uuid, text) from public, anon;
revoke execute on function public.cancel_book_deletion(uuid) from public, anon;
revoke execute on function public.restore_entry(uuid) from public, anon;
revoke execute on function public.delete_entry(uuid) from public, anon;
revoke execute on function public.record_policy_act(text, text, text, text, text, text, text, text, timestamptz, bytea, jsonb) from public, anon;
revoke execute on function public.policy_actions_needed() from public, anon;
grant execute on function public.child_is_live(uuid) to authenticated;
grant execute on function public.is_child_parent(uuid) to authenticated;
grant execute on function public.can_read_entry_photo(text) to authenticated;
grant execute on function public.set_member_auto_add(uuid, uuid, boolean) to authenticated;
grant execute on function public.request_account_deletion(text, boolean) to authenticated;
grant execute on function public.cancel_account_deletion() to authenticated;
grant execute on function public.request_book_deletion(uuid, text) to authenticated;
grant execute on function public.cancel_book_deletion(uuid) to authenticated;
grant execute on function public.restore_entry(uuid) to authenticated;
grant execute on function public.delete_entry(uuid) to authenticated;
grant execute on function public.record_policy_act(text, text, text, text, text, text, text, text, timestamptz, bytea, jsonb) to authenticated;
grant execute on function public.policy_actions_needed() to authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.purge_due(timestamptz) to service_role';
    execute 'grant execute on function public.prepare_account_purge(uuid) to service_role';
    execute 'grant execute on function public.finalize_account_deletion(uuid, jsonb) to service_role';
    execute 'grant execute on function public.has_active_consent(uuid, text) to service_role';
  end if;
end;
$$;

-- PDB-02: identity sequences (audit_events, storage_purge_queue) are written only by
-- security-definer code; the API roles get no sequence privileges. Re-checked at the
-- end of 20261003020000_purge_batching.sql.
revoke all on all sequences in schema public from public, anon, authenticated;

-- ─── 10. Classification (docs/legal/DATA_CLASSIFICATION.md) ──────────────
-- Every column in `public` starts with its level: L1 Public, L2 Internal,
-- L3 Confidential (PII), L4 Restricted (encryption required).
-- supabase/tests/classification.test.mjs fails on any column without one.

comment on column public.profiles.id is 'L3 person id (= auth user id)';
comment on column public.profiles.display_name is 'L3 name the person chose';
comment on column public.profiles.signs_as is 'L3 default signature ("Papa")';
comment on column public.profiles.created_at is 'L2 system timestamp';
comment on column public.profiles.updated_at is 'L2 system timestamp';

comment on column public.children.id is 'L3 book id (identifies a child''s book)';
comment on column public.children.name is 'L4 child name';
comment on column public.children.date_of_birth is 'L4 child birthday';
comment on column public.children.created_by is 'L3 person id; null after creator account deletion';
comment on column public.children.created_at is 'L2 system timestamp';
comment on column public.children.updated_at is 'L2 system timestamp';
comment on column public.children.deleted_at is 'L2 book tombstone time (server clock)';
comment on column public.children.deletion_request_id is 'L2 internal request id';
comment on column public.children.nickname is 'L4 child nickname';
comment on column public.children.due_date is 'L4 due date (consumer health data, PRD K-25)';
comment on column public.children.photo_path is 'L3 object path ({child_id}/...), points at L4 photo';
comment on column public.children.book_look is 'L2 theme enum';
comment on column public.children.family_can_read is 'L2 sharing setting';
comment on column public.children.hidden_at is 'L2 hide-book time';

comment on column public.child_members.child_id is 'L3 book id';
comment on column public.child_members.profile_id is 'L3 person id';
comment on column public.child_members.role is 'L3 relation to the child (parent or contributor)';
comment on column public.child_members.joined_at is 'L2 system timestamp';
comment on column public.child_members.auto_add_letters is 'L2 parent setting per family member';

comment on column public.child_member_prefs.child_id is 'L3 book id';
comment on column public.child_member_prefs.profile_id is 'L3 person id';
comment on column public.child_member_prefs.signs_as is 'L3 signature for this child';
comment on column public.child_member_prefs.include_in_reminders is 'L2 reminder setting';
comment on column public.child_member_prefs.celebrations_paused is 'L3 personal setting (may reflect a hard season)';
comment on column public.child_member_prefs.created_at is 'L2 system timestamp';
comment on column public.child_member_prefs.updated_at is 'L2 system timestamp';

comment on column public.child_invites.id is 'L2 internal invite id';
comment on column public.child_invites.child_id is 'L3 book id';
comment on column public.child_invites.invited_by is 'L3 person id';
comment on column public.child_invites.token_hash is 'L3 SHA-256 of the invite token (token itself is L4, never stored)';
comment on column public.child_invites.role is 'L3 relation offered';
comment on column public.child_invites.expires_at is 'L2 system timestamp';
comment on column public.child_invites.accepted_by is 'L3 person id';
comment on column public.child_invites.accepted_at is 'L2 system timestamp';
comment on column public.child_invites.created_at is 'L2 system timestamp';

comment on column public.entries.id is 'L3 letter id (device-generated UUIDv7)';
comment on column public.entries.child_id is 'L3 book id';
comment on column public.entries.author_id is 'L3 person id';
comment on column public.entries.author_signs_as is 'L3 signature at save time';
comment on column public.entries.kind is 'L2 enum';
comment on column public.entries.occurred_on is 'L3 date of the family moment';
comment on column public.entries.captured_at is 'L2 capture timestamp';
comment on column public.entries.capture_mode is 'L2 enum';
comment on column public.entries.edit_level is 'L2 enum';
comment on column public.entries.prompt_key is 'L2 prompt catalogue key';
comment on column public.entries.prompt_library_version is 'L2 version number';
comment on column public.entries.engine_version is 'L2 version number';
comment on column public.entries.raw_transcript is 'L4 content: exact words, author-only (PRD K-09)';
comment on column public.entries.stt_meta is 'L4 content-derived: per-token timestamps, author-only';
comment on column public.entries.machine_edits is 'L4 content: edit list with offsets, author-only';
comment on column public.entries.final_text is 'L4 content: the letter as the book renders it';
comment on column public.entries.in_book is 'L2 flag';
comment on column public.entries.photo_path is 'L3 object path ({child}/{author}/{entry}), points at L4 photo';
comment on column public.entries.audio_kept_on_device is 'L2 flag';
comment on column public.entries.sounds_like_me is 'L2 flag';
comment on column public.entries.created_at is 'L2 system timestamp';
comment on column public.entries.updated_at is 'L2 system timestamp';
comment on column public.entries.deleted_at is 'L2 tombstone time (server clock)';
comment on column public.entries.search is 'L4 content-derived full-text index of final_text';
comment on column public.entries.deleted_reason is 'L2 enum';
comment on column public.entries.raw_sha256 is 'L4 content-derived hash of raw_transcript, author-only';

comment on column public.book_entries.id is 'L3 letter id';
comment on column public.book_entries.child_id is 'L3 book id';
comment on column public.book_entries.author_id is 'L3 person id';
comment on column public.book_entries.author_signs_as is 'L3 signature at save time';
comment on column public.book_entries.kind is 'L2 enum';
comment on column public.book_entries.occurred_on is 'L3 date of the family moment';
comment on column public.book_entries.captured_at is 'L2 capture timestamp';
comment on column public.book_entries.capture_mode is 'L2 enum';
comment on column public.book_entries.edit_level is 'L2 enum';
comment on column public.book_entries.prompt_key is 'L2 prompt catalogue key';
comment on column public.book_entries.prompt_library_version is 'L2 version number';
comment on column public.book_entries.engine_version is 'L2 version number';
comment on column public.book_entries.final_text is 'L4 content';
comment on column public.book_entries.in_book is 'L2 flag';
comment on column public.book_entries.photo_path is 'L3 object path';
comment on column public.book_entries.audio_kept_on_device is 'L2 flag';
comment on column public.book_entries.sounds_like_me is 'L2 flag';
comment on column public.book_entries.created_at is 'L2 system timestamp';
comment on column public.book_entries.updated_at is 'L2 system timestamp';
comment on column public.book_entries.deleted_at is 'L2 tombstone time (author rows only)';
comment on column public.book_entries.search is 'L4 content-derived full-text index';

comment on column public.entry_versions.id is 'L2 internal version id';
comment on column public.entry_versions.entry_id is 'L3 letter id';
comment on column public.entry_versions.final_text is 'L4 content: previous text';
comment on column public.entry_versions.in_book is 'L2 flag';
comment on column public.entry_versions.created_at is 'L2 system timestamp';
comment on column public.entry_versions.machine_edits is 'L4 content: previous edit list';
comment on column public.entry_versions.superseded_by is 'L3 person id; nulled at account deletion';

comment on column public.dictionary_terms.id is 'L2 internal id';
comment on column public.dictionary_terms.owner_id is 'L3 person id';
comment on column public.dictionary_terms.child_id is 'L3 book id';
comment on column public.dictionary_terms.term is 'L4 names and family words';
comment on column public.dictionary_terms.kind is 'L2 enum';
comment on column public.dictionary_terms.heard_as is 'L4 misheard spellings of names';
comment on column public.dictionary_terms.created_at is 'L2 system timestamp';
comment on column public.dictionary_terms.updated_at is 'L2 system timestamp';

comment on column public.legal_holds.id is 'L2 internal id';
comment on column public.legal_holds.scope is 'L2 enum';
comment on column public.legal_holds.scope_id is 'L3 person, book or letter id';
comment on column public.legal_holds.reason_code is 'L3 enum (reveals that a person is subject to legal process)';
comment on column public.legal_holds.matter_ref is 'L3 ticket reference, never content';
comment on column public.legal_holds.placed_by is 'L3 staff identity';
comment on column public.legal_holds.placed_at is 'L2 system timestamp';
comment on column public.legal_holds.review_by is 'L2 date';
comment on column public.legal_holds.released_at is 'L2 system timestamp';
comment on column public.legal_holds.released_by is 'L3 staff identity';

comment on column public.audit_events.id is 'L2 internal id';
comment on column public.audit_events.at is 'L2 system timestamp';
comment on column public.audit_events.actor_id is 'L3 person id; nulled at account deletion';
comment on column public.audit_events.actor_kind is 'L2 enum';
comment on column public.audit_events.action is 'L2 enum';
comment on column public.audit_events.subject_type is 'L2 enum';
comment on column public.audit_events.subject_id is 'L3 subject id (may be a person id; nulled at deletion)';
comment on column public.audit_events.child_id is 'L3 book id';
comment on column public.audit_events.detail is 'L2 enums and counts only (512 bytes max)';

comment on column public.deletion_requests.id is 'L2 request id (appears on receipts)';
comment on column public.deletion_requests.kind is 'L2 enum';
comment on column public.deletion_requests.profile_id is 'L3 person id; nulled on completion';
comment on column public.deletion_requests.child_id is 'L3 book id';
comment on column public.deletion_requests.status is 'L2 enum';
comment on column public.deletion_requests.source is 'L2 enum';
comment on column public.deletion_requests.requested_at is 'L2 system timestamp';
comment on column public.deletion_requests.scheduled_for is 'L2 system timestamp';
comment on column public.deletion_requests.cancelled_at is 'L2 system timestamp';
comment on column public.deletion_requests.executing_at is 'L2 system timestamp';
comment on column public.deletion_requests.completed_at is 'L2 system timestamp';
comment on column public.deletion_requests.had_active_subscription is 'L3 purchase state of a person';
comment on column public.deletion_requests.receipt is 'L2 counts and step outcomes, never content';

comment on column public.deletion_request_steps.request_id is 'L2 request id';
comment on column public.deletion_request_steps.step is 'L2 enum';
comment on column public.deletion_request_steps.status is 'L2 enum';
comment on column public.deletion_request_steps.attempts is 'L2 count';
comment on column public.deletion_request_steps.last_error_code is 'L2 HTTP status or error class';
comment on column public.deletion_request_steps.updated_at is 'L2 system timestamp';

comment on column public.storage_purge_queue.id is 'L2 internal id';
comment on column public.storage_purge_queue.bucket_id is 'L2 bucket name';
comment on column public.storage_purge_queue.object_path is 'L3 object path (contains book and person ids)';
comment on column public.storage_purge_queue.is_prefix is 'L2 flag';
comment on column public.storage_purge_queue.reason is 'L2 enum';
comment on column public.storage_purge_queue.request_id is 'L2 request id';
comment on column public.storage_purge_queue.enqueued_at is 'L2 system timestamp';
comment on column public.storage_purge_queue.attempts is 'L2 count';
comment on column public.storage_purge_queue.done_at is 'L2 system timestamp';

comment on column public.purge_ledger.entity_type is 'L2 enum';
comment on column public.purge_ledger.entity_id is 'L3 id of a purged letter, book, person or object path';
comment on column public.purge_ledger.purged_at is 'L2 system timestamp';

comment on column public.policy_documents.key is 'L1 document key';
comment on column public.policy_documents.title is 'L1 document title';
comment on column public.policy_documents.needs_affirmative_act is 'L1 flag';

comment on column public.policy_versions.document is 'L1 document key';
comment on column public.policy_versions.version is 'L1 semver';
comment on column public.policy_versions.major is 'L1 generated from version';
comment on column public.policy_versions.minor is 'L1 generated from version';
comment on column public.policy_versions.patch is 'L1 generated from version';
comment on column public.policy_versions.change_class is 'L1 enum';
comment on column public.policy_versions.requires_reconsent is 'L1 flag';
comment on column public.policy_versions.published_at is 'L1 date';
comment on column public.policy_versions.new_users_from is 'L1 date';
comment on column public.policy_versions.effective_at is 'L1 date';
comment on column public.policy_versions.content_sha256 is 'L1 hash of the published text';
comment on column public.policy_versions.url is 'L1 permanent URL';
comment on column public.policy_versions.summary is 'L1 plain-language change line';

comment on column public.policy_acceptances.id is 'L2 internal id';
comment on column public.policy_acceptances.profile_id is 'L3 person id ("user"); nulled at deletion';
comment on column public.policy_acceptances.subject_hash is 'L3 pseudonymised person id (peppered SHA-256)';
comment on column public.policy_acceptances.pseudonymised_at is 'L2 retention clock';
comment on column public.policy_acceptances.document is 'L2 document key ("policy")';
comment on column public.policy_acceptances.version is 'L2 document version';
comment on column public.policy_acceptances.action is 'L2 enum';
comment on column public.policy_acceptances.method is 'L2 enum';
comment on column public.policy_acceptances.surface is 'L2 screen id';
comment on column public.policy_acceptances.accepted_at is 'L2 server time of the act';
comment on column public.policy_acceptances.client_recorded_at is 'L2 device time of the act';
comment on column public.policy_acceptances.app_version is 'L2 app version';
comment on column public.policy_acceptances.platform is 'L2 enum';
comment on column public.policy_acceptances.locale is 'L3 device locale (language proxy)';
comment on column public.policy_acceptances.rendered_sha256 is 'L2 hash of the consent text shown';
comment on column public.policy_acceptances.context is 'L2 enums only (product, auth method)';

comment on column public.my_policy_state.document is 'L2 document key';
comment on column public.my_policy_state.version is 'L2 document version';
comment on column public.my_policy_state.action is 'L2 enum';
comment on column public.my_policy_state.accepted_at is 'L2 server time of the act';

-- ─── 11. Schedule (Supabase Cron; not available in the PGlite test harness) ──
-- See APPLY.md step 7:
-- select cron.schedule('scribe-purge-due', '17 * * * *', $$ select public.purge_due(); $$);
-- The `purge-worker` Edge Function runs every 15 minutes: drains storage_purge_queue,
-- executes `executing` account requests (DATA-REQ-020), appends purge_ledger to ops-ledger.
