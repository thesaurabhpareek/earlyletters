-- Family cap, letter language, idempotency keys and server rate limits.
--
-- PENDING: not yet applied. Apply after 20261004300000_insights_aggregates.sql,
-- following supabase/APPLY.md (section "File 20261005000000"). Additive only:
-- never edits an earlier file; functions below are redefined with
-- CREATE OR REPLACE (same signatures, so grants are kept).
--
-- 1. At most two parents per book (DECISIONS D-069, recommended; pm-2 FAM-11).
--    create_child_invite(p_child, 'parent', ...) and accept_child_invite refuse
--    with SQLSTATE SCCAP when the book already has app.max_parents_per_book
--    parents (database setting, default 2, valid 1 to 10; anything else reads
--    as 2). A further parent is added only by support (service role), never
--    through an invite. Both functions lock the book row first, so two
--    invitees accepting at once cannot make a third parent.
--    Membership (PRD B F7, F8; DELETION_AND_EXPORT_SPEC 2.4, 2.5; TDD 02 2.4):
--      leave_child(p_child, p_keep_in_book default true)  any member leaves;
--        "take my letters out" sets them out of the book (never deleted).
--        The last parent of a live book gets SCLPG (unchanged guard).
--      remove_child_member(p_child, p_member, p_set_aside default false)
--        either parent removes a family member, alone, no veto; their letters
--        stay unless p_set_aside (then set aside, never deleted). A parent is
--        never removed by the other parent (42501): only their own leave_child.
--      Photos: an author can no longer rename their object into another
--      family's book folder (security review L2).
--      Listing members needs nothing new: child_members is readable by members
--      and sync_books() / sync_pull() return the member list.
--      When a parent stops being a member (leave, removal by support, "delete
--      the book" with a co-parent), their unaccepted invites to that book are
--      revoked, and accept_child_invite refuses an invite whose maker is no
--      longer a parent of the book.
-- 2. entries.language: the spoken-letter language, one of the seven v1.0 codes
--    (packages/core/src/lang/types.ts LANGUAGE_CODES), nullable, L4
--    (DATA_CLASSIFICATION: a person's language). Written by the author only
--    (RLS on entries; a client change of it needs current consent, like any
--    content write). Author-only on reads: sync_pull returns it on the caller's
--    own letters; book_entries does not carry it, so co-parents and family never
--    receive it, not even for in-book letters (decision in APPLY.md). sync_push
--    accepts it in a new field group "language", applied only when the op's
--    data carries the key, so older apps never clear it. insights.language_mix
--    now reads it with static SQL; the k = 10 merge rule is unchanged.
-- 3. Idempotency keys (ADR 0017 rule 3 and section 6): create_child_invite and
--    record_policy_act read the `idempotency-key` request header (a UUID; the
--    app already sends it). One row per (person, key) in public.idempotency_keys
--    for 24 hours. A repeat with the same key and the same arguments replays the
--    first result without a second write; the same key with other arguments is
--    22023. No header: behaviour as before. A malformed key: 22023.
--    Invite tokens are never stored (only their hash), so an invite replay
--    issues a fresh token for the SAME invite row: the token in the lost first
--    response stops working. Reuse a key only to retry a call whose response
--    never arrived.
-- 4. Server rate limits (ADR 0017 section 4; brief decision 17):
--      request_account_deletion  5 new requests per person per rolling 24 h
--      cancel_account_deletion   5 cancellations per person per rolling 24 h
--        (a repeat that returns the open request, or a cancel with nothing to
--        cancel, is free; the 30-day grace makes a one-day wait harmless)
--      record_policy_act         60 recorded acts per person per hour and 200 per
--        rolling 24 h (the contract said "rpc" but nothing enforced it; rows are
--        append-only for the account's life plus 3 years); p_rendered_sha256
--        must be 32 bytes
--      accept_child_invite       120 per person per hour (bucket "membership")
--      policy_actions_needed     60 per person per hour (was client only)
--      leave_child, remove_child_member  120 per person per hour (TDD 02 4.1)
--      sync_pull 120 and sync_push 60 per minute: unchanged numbers, but the
--        counters were writable by their owner (FOR ALL own-row policy), so a
--        modified client could reset its own limit. Counters now change only
--        through public.rate_hit() (security definer); clients keep read access.
--
-- New SQLSTATE: SCCAP  the book already has the most parents allowed (detail:
--   the limit). The app tells the person; never retried.
-- Reused: SCRAT (rate limited), SCINV, SCPAR, SCLPG, SCCON, SCANO, 22023, 42501, P0002.

-- ─── 0. Shared helpers ───────────────────────────────────────────────────
-- D-069: parents per book. Read at call time, so a change needs no migration:
--   alter database postgres set app.max_parents_per_book = '3';
create or replace function public.max_parents_per_book()
returns int language sql stable set search_path = public, pg_catalog as $$
  select case when s ~ '^[0-9]{1,2}$' and s::int between 1 and 10 then s::int else 2 end
    from (select coalesce(nullif(btrim(current_setting('app.max_parents_per_book', true)), ''), '2') as s) x;
$$;

-- Per-person fixed windows in sync_rate_windows (now the counters for every
-- server-side per-person limit). The window starts at the first hit and resets
-- when it has passed. Over the limit raises SCRAT, which rolls back the hit.
alter table public.sync_rate_windows drop constraint if exists sync_rate_windows_bucket_check;
alter table public.sync_rate_windows add constraint sync_rate_windows_bucket_check
  check (bucket in ('pull', 'push', 'policy_actions', 'membership'));
-- Counters are written only by rate_hit() and sync_housekeeping(); people may read their own.
revoke insert, update, delete, truncate on public.sync_rate_windows from anon, authenticated;

create or replace function public.rate_hit(p_bucket text)
returns void language plpgsql volatile security definer set search_path = public, pg_catalog as $$
declare
  v_uid uuid := public.require_user();
  v_limit int;
  v_window interval;
  v_hits int;
begin
  select l.lim, l.win into v_limit, v_window
    from (values ('pull', 120, interval '1 minute'),
                 ('push', 60, interval '1 minute'),
                 ('policy_actions', 60, interval '1 hour'),
                 ('membership', 120, interval '1 hour')) as l(bucket, lim, win)
   where l.bucket = p_bucket;
  if not found then
    raise exception 'unknown rate bucket' using errcode = '22023';
  end if;
  insert into sync_rate_windows as w (profile_id, bucket, window_start, hits) values (v_uid, p_bucket, now(), 1)
  on conflict (profile_id, bucket) do update
     set hits = case when w.window_start <= now() - v_window then 1 else w.hits + 1 end,
         window_start = case when w.window_start <= now() - v_window then now() else w.window_start end
  returning hits into v_hits;
  if v_hits > v_limit then
    raise exception 'too many requests' using errcode = 'SCRAT';
  end if;
end;
$$;

-- ─── 1. Idempotency keys (ADR 0017 rule 3) ───────────────────────────────
create table public.idempotency_keys (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  idem_key uuid not null,
  fn text not null check (fn in ('create_child_invite', 'record_policy_act')),
  request_sha256 bytea not null,
  result jsonb check (result is null or (jsonb_typeof(result) = 'object' and octet_length(result::text) <= 256)),
  created_at timestamptz not null default now(),
  primary key (profile_id, idem_key)
);
create index idempotency_keys_created_idx on public.idempotency_keys (created_at);
alter table public.idempotency_keys enable row level security;   -- no policies: functions only
revoke all on public.idempotency_keys from public, anon, authenticated;
comment on table public.idempotency_keys is
  'Idempotency keys of write RPCs (ADR 0017): one row per person and key for 24 hours; results hold ids only, never tokens or text.';

-- The `idempotency-key` request header (PostgREST puts request headers, with
-- lower-case names, in the request.headers setting as JSON). Null when absent.
create or replace function public.request_idempotency_key()
returns uuid language plpgsql stable set search_path = public, pg_catalog as $$
declare
  v_headers text := nullif(current_setting('request.headers', true), '');
  v_key text;
begin
  if v_headers is null then
    return null;
  end if;
  begin
    v_key := nullif(btrim(v_headers::jsonb ->> 'idempotency-key'), '');
  exception when others then
    return null;                                  -- not a JSON object: no key
  end;
  if v_key is null then
    return null;
  end if;
  if v_key !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception 'idempotency-key must be a UUID' using errcode = '22023';
  end if;
  return v_key::uuid;
end;
$$;

-- Claims the request's key for this person and function. Returns null when the
-- call should run (no key, a new key, or a key older than 24 hours) and the
-- stored result when it is a repeat. Same key, other arguments: 22023.
-- The claim and the call's own writes commit or roll back together, and a
-- concurrent repeat waits on the key, then replays.
create or replace function public.idempotency_claim(p_uid uuid, p_fn text, p_request jsonb)
returns jsonb language plpgsql volatile set search_path = public, pg_catalog as $$
declare
  v_key uuid := public.request_idempotency_key();
  v_hash bytea;
  r idempotency_keys%rowtype;
begin
  if v_key is null then
    return null;
  end if;
  v_hash := sha256(convert_to(p_fn || ':' || coalesce(p_request::text, 'null'), 'UTF8'));
  insert into idempotency_keys (profile_id, idem_key, fn, request_sha256) values (p_uid, v_key, p_fn, v_hash)
  on conflict (profile_id, idem_key) do nothing;
  if found then
    return null;
  end if;
  select * into r from idempotency_keys where profile_id = p_uid and idem_key = v_key for update;
  if r.created_at <= now() - interval '24 hours' then
    update idempotency_keys set fn = p_fn, request_sha256 = v_hash, result = null, created_at = now()
     where profile_id = p_uid and idem_key = v_key;
    return null;
  end if;
  if r.fn <> p_fn or r.request_sha256 <> v_hash then
    raise exception 'idempotency key reused for a different request' using errcode = '22023';
  end if;
  if r.result is null then
    raise exception 'idempotent request still in progress' using errcode = '40001';   -- retry
  end if;
  return r.result;
end;
$$;

-- Stores the result (ids only) for the request's key; nothing without a key.
create or replace function public.idempotency_store(p_uid uuid, p_fn text, p_result jsonb)
returns void language plpgsql volatile set search_path = public, pg_catalog as $$
declare v_key uuid := public.request_idempotency_key();
begin
  if v_key is not null then
    update idempotency_keys set result = p_result where profile_id = p_uid and idem_key = v_key and fn = p_fn;
  end if;
end;
$$;

-- ─── 2. Two parents per book, leaving and removing (D-069) ───────────────
-- Returns the raw token once; only its SHA-256 is stored. Changes from
-- 20261003000000: the parent cap (SCCAP), the idempotency key, and the book row
-- locked FOR NO KEY UPDATE (serialises invites, acceptances, leaving and
-- removal per book without blocking letter writes).
create or replace function public.create_child_invite(p_child uuid, p_role text, p_signs_as text default null)
returns text language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  v_uid uuid := public.require_user();
  v_signs text := nullif(btrim(p_signs_as), '');
  v_replay jsonb;
  v_inv child_invites%rowtype;
  v_token text;
  v_id uuid;
begin
  if p_role is null or p_role not in ('parent', 'contributor') then
    raise exception 'invite role must be parent or contributor' using errcode = 'SCINV';
  end if;
  if not public.is_child_parent(p_child) then
    raise exception 'only a parent can invite' using errcode = 'SCPAR';
  end if;
  perform 1 from children where id = p_child and deleted_at is null for no key update;
  if not found then raise exception 'book is deleted' using errcode = 'SCDEL'; end if;

  v_replay := public.idempotency_claim(v_uid, 'create_child_invite', jsonb_build_array(p_child, p_role, v_signs));
  if v_replay is not null then
    -- A retry of a call whose response was lost: same invite, fresh token.
    select * into v_inv from child_invites where id = (v_replay ->> 'invite')::uuid for update;
    if not found or v_inv.accepted_at is not null or v_inv.revoked_at is not null or v_inv.expires_at <= now() then
      raise exception 'the invite made by this request is closed; make a new one' using errcode = 'SCINV';
    end if;
    perform public.require_content_consent();
    v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
    update child_invites set token_hash = sha256(convert_to(v_token, 'UTF8')) where id = v_inv.id;
    return v_token;
  end if;

  if p_role = 'parent'
     and (select count(*) from child_members where child_id = p_child and role = 'parent') >= public.max_parents_per_book() then
    raise exception 'this book already has the most parents allowed'
      using errcode = 'SCCAP', detail = public.max_parents_per_book()::text;
  end if;
  perform public.require_content_consent();
  if (select count(*) from child_invites where child_id = p_child and created_at > now() - interval '24 hours') >= 20
     or (select count(*) from child_invites where invited_by = v_uid and created_at > now() - interval '24 hours') >= 20 then
    raise exception 'too many invites today' using errcode = 'SCRAT';
  end if;
  -- 244 random bits from two v4 UUIDs; core Postgres, no extension needed.
  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into child_invites (child_id, invited_by, token_hash, role, signs_as, expires_at)
    values (p_child, v_uid, sha256(convert_to(v_token, 'UTF8')), p_role, v_signs,
            now() + case p_role when 'parent' then interval '7 days' else interval '14 days' end)
    returning id into v_id;
  perform public.idempotency_store(v_uid, 'create_child_invite', jsonb_build_object('invite', v_id));
  perform public.audit('invite_created', 'membership', v_id, p_child, jsonb_build_object('role', p_role));
  return v_token;
end;
$$;

-- Changes from 20261003000000: a rate limit (bucket "membership"), the book row
-- locked before the invite row (the same order as every other membership
-- change), the parent cap (SCCAP), and an invite whose maker is no longer a
-- parent of the book is refused (security review H2: a stale link from a parent
-- who left made a stranger a parent).
create or replace function public.accept_child_invite(p_token text)
returns uuid language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  v_uid uuid := public.require_user();
  v_hash bytea := sha256(convert_to(coalesce(p_token, ''), 'UTF8'));
  v_child uuid;
  v_inv child_invites%rowtype;
begin
  perform public.rate_hit('membership');
  select child_id into v_child from child_invites where token_hash = v_hash;
  if not found then raise exception 'invite not found' using errcode = 'SCINV'; end if;
  perform 1 from children where id = v_child for no key update;
  select * into v_inv from child_invites where token_hash = v_hash for update;
  if not found then raise exception 'invite not found' using errcode = 'SCINV'; end if;
  -- Same person retrying after a lost response: idempotent.
  if v_inv.accepted_by = v_uid then return v_inv.child_id; end if;
  if v_inv.accepted_at is not null then raise exception 'invite already used' using errcode = 'SCINV'; end if;
  if v_inv.revoked_at is not null then raise exception 'invite revoked' using errcode = 'SCINV'; end if;
  if v_inv.expires_at < now() then raise exception 'invite expired' using errcode = 'SCINV'; end if;
  if not public.child_is_live(v_inv.child_id) then raise exception 'invite not found' using errcode = 'SCINV'; end if;
  -- No role change through invites (covers the inviter accepting their own link).
  if exists (select 1 from child_members where child_id = v_inv.child_id and profile_id = v_uid) then
    raise exception 'already a member of this book' using errcode = 'SCINV';
  end if;
  if not exists (select 1 from child_members
                  where child_id = v_inv.child_id and profile_id = v_inv.invited_by and role = 'parent') then
    raise exception 'invite not found' using errcode = 'SCINV';
  end if;
  if v_inv.role = 'parent'
     and (select count(*) from child_members where child_id = v_inv.child_id and role = 'parent') >= public.max_parents_per_book() then
    raise exception 'this book already has the most parents allowed'
      using errcode = 'SCCAP', detail = public.max_parents_per_book()::text;
  end if;
  perform public.require_content_consent();
  insert into child_members (child_id, profile_id, role) values (v_inv.child_id, v_uid, v_inv.role);
  update child_invites set accepted_by = v_uid, accepted_at = now() where id = v_inv.id;
  perform public.audit('member_joined', 'membership', v_uid, v_inv.child_id, jsonb_build_object('role', v_inv.role));
  return v_inv.child_id;
end;
$$;

-- A parent who stops being a member takes their open invites with them, on every
-- path (leave_child, the direct own-row delete, request_book_deletion with a
-- co-parent, support). Skipped inside cascades from a purged book or a deleted
-- account, where the invites go anyway.
create or replace function public.child_members_revoke_invites()
returns trigger language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  if old.role = 'parent'
     and exists (select 1 from children where id = old.child_id)
     and exists (select 1 from profiles where id = old.profile_id) then
    update child_invites set revoked_at = now()
     where child_id = old.child_id and invited_by = old.profile_id and accepted_at is null and revoked_at is null;
  end if;
  return null;
end;
$$;
create trigger child_members_revoke_invites after delete on public.child_members
  for each row execute function public.child_members_revoke_invites();

-- Any member leaves a book (PRD B F7; DELETION_AND_EXPORT_SPEC 2.4). "Take my
-- letters out" (p_keep_in_book = false) takes the caller's letters in this book
-- out of it and withdraws any sent to the parents; nothing is deleted, and the
-- leaver can still read, export and delete their own letters. Never
-- consent-gated (LEGAL-REQ-009). Idempotent: 'not_member' once already gone.
create or replace function public.leave_child(p_child uuid, p_keep_in_book boolean default true)
returns text language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_uid uuid := public.require_user();
begin
  perform public.rate_hit('membership');
  if not exists (select 1 from child_members where child_id = p_child and profile_id = v_uid) then
    return 'not_member';
  end if;
  perform 1 from children where id = p_child for no key update;
  if not coalesce(p_keep_in_book, true) then
    update entries set in_book = false, approval = 'not_needed', reviewed_by = null, reviewed_at = null
     where child_id = p_child and author_id = v_uid and deleted_at is null
       and (in_book or approval <> 'not_needed');
  end if;
  -- The last parent of a live book gets SCLPG (child_members_guard); the whole call rolls back.
  delete from child_members where child_id = p_child and profile_id = v_uid;
  return 'left';
end;
$$;

-- Either parent removes a family member, alone (D-069, FAM-11 item 8: no veto).
-- Their letters stay in the book unless p_set_aside, which sets their pending and
-- added letters aside (never deleted; a parent can add them back). Parents are
-- equals (PRD B F8): a parent is never removed by the other parent; only their
-- own leave_child ends their membership. Idempotent: 'not_member' once gone.
create or replace function public.remove_child_member(p_child uuid, p_member uuid, p_set_aside boolean default false)
returns text language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  v_uid uuid := public.require_user();
  v_role text;
begin
  perform public.rate_hit('membership');
  if not public.is_child_parent(p_child) then
    raise exception 'only a parent can remove a family member' using errcode = 'SCPAR';
  end if;
  perform 1 from children where id = p_child for no key update;
  if p_member is null or p_member = v_uid then
    raise exception 'use leave_child to leave a book' using errcode = '22023';
  end if;
  select role into v_role from child_members where child_id = p_child and profile_id = p_member;
  if not found then
    return 'not_member';
  end if;
  if v_role = 'parent' then
    raise exception 'a parent leaves a book only by their own choice' using errcode = '42501';
  end if;
  if coalesce(p_set_aside, false) then
    update entries set approval = 'set_aside', in_book = false, reviewed_by = v_uid, reviewed_at = now()
     where child_id = p_child and author_id = p_member and deleted_at is null and approval in ('pending', 'added');
  end if;
  delete from child_members where child_id = p_child and profile_id = p_member;   -- audit: member_removed
  return 'removed';
end;
$$;

-- Photos (security review L2): renaming an object may not move it into a book the
-- author does not belong to, or into a deleted book; the same rule as uploads.
alter policy entry_photos_author_update on storage.objects
  using (bucket_id = 'entry-photos' and (storage.foldername(name))[2] = (select auth.uid())::text)
  with check (bucket_id = 'entry-photos' and (storage.foldername(name))[2] = (select auth.uid())::text
              and public.is_child_member(((storage.foldername(name))[1])::uuid)
              and public.child_is_live(((storage.foldername(name))[1])::uuid)
              and public.can_write_content());

-- ─── 3. Rate limits on account deletion, consent acts and policy reads ────
-- Counts come from the requests themselves (rolling 24 hours, exact).
create index if not exists deletion_requests_profile_idx on public.deletion_requests (profile_id, requested_at)
  where profile_id is not null;

-- Changes from 20261003000000: at most 5 new requests per person per rolling 24 h
-- (SCRAT). A repeat while a request is open returns it and is never limited.
create or replace function public.request_account_deletion(p_source text, p_had_active_subscription boolean default null)
returns table (request_id uuid, scheduled_for timestamptz)
language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  v_uid uuid := public.require_user();
  v_id uuid;
  v_when timestamptz;
  v_entries int;
  v_books int;
begin
  if p_source is null or p_source not in ('ios', 'android', 'web') then
    raise exception 'source must be ios, android or web' using errcode = '22023';
  end if;
  select d.id, d.scheduled_for into v_id, v_when from deletion_requests d
    where d.profile_id = v_uid and d.kind = 'account' and d.status in ('scheduled', 'held', 'executing');
  if found then return query select v_id, v_when; return; end if;

  if (select count(*) from deletion_requests d
       where d.profile_id = v_uid and d.kind = 'account' and d.requested_at > now() - interval '24 hours') >= 5 then
    raise exception 'too many deletion requests today' using errcode = 'SCRAT';
  end if;

  v_when := now() + interval '30 days';
  insert into deletion_requests (kind, profile_id, status, source, scheduled_for, had_active_subscription)
    values ('account', v_uid, 'scheduled', p_source, v_when, p_had_active_subscription)
    returning id into v_id;

  update entries set deleted_at = now(), deleted_reason = 'account_deletion'
    where author_id = v_uid and deleted_at is null;
  get diagnostics v_entries = row_count;

  update children c set deleted_at = now(), deletion_request_id = v_id
    where c.deleted_at is null
      and exists (select 1 from child_members m where m.child_id = c.id and m.profile_id = v_uid and m.role = 'parent')
      and not exists (select 1 from child_members m where m.child_id = c.id and m.role = 'parent' and m.profile_id <> v_uid);
  get diagnostics v_books = row_count;

  insert into deletion_request_steps (request_id, step)
    select v_id, s from unnest(array['storage_objects', 'apple_token_revoke', 'posthog',
      'email_provider', 'receipt_email', 'auth_user', 'powersync_verify']) s;
  if v_books > 0 then
    insert into deletion_request_steps (request_id, step) values (v_id, 'contributor_export_notice');
  end if;

  perform public.audit('account_deletion_requested', 'deletion_request', v_id, null,
    jsonb_build_object('entries', v_entries, 'books', v_books, 'source', p_source));
  return query select v_id, v_when;
end;
$$;

-- Changes from 20261003000000: at most 5 cancellations per person per rolling
-- 24 h (SCRAT). Nothing to cancel returns false and is never limited.
create or replace function public.cancel_account_deletion()
returns boolean language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_uid uuid := public.require_user(); v_id uuid;
begin
  select id into v_id from deletion_requests
    where profile_id = v_uid and kind = 'account' and status in ('scheduled', 'held') for update;
  if not found then return false; end if;
  if (select count(*) from deletion_requests d
       where d.profile_id = v_uid and d.kind = 'account' and d.cancelled_at > now() - interval '24 hours') >= 5 then
    raise exception 'too many cancellations today' using errcode = 'SCRAT';
  end if;
  update deletion_requests set status = 'cancelled', cancelled_at = now() where id = v_id;
  update entries set deleted_at = null where author_id = v_uid and deleted_reason = 'account_deletion';
  update children set deleted_at = null, deletion_request_id = null where deletion_request_id = v_id;
  delete from deletion_request_steps where request_id = v_id;
  perform public.audit('account_deletion_cancelled', 'deletion_request', v_id, null);
  return true;
end;
$$;

-- Changes from 20261003000000: the idempotency key (a repeat returns the first
-- act's id and records nothing new; p_client_recorded_at is left out of the
-- comparison because a retry stamps a new device time), at most 60 recorded acts
-- per person per hour and 200 per rolling 24 hours (SCRAT), and
-- p_rendered_sha256 must be 32 bytes when given (22023).
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
) returns uuid language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_ver policy_versions%rowtype; v_id uuid; v_ctx jsonb := coalesce(p_context, '{}'::jsonb); v_replay jsonb;
begin
  if auth.uid() is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  if public.is_anonymous() and p_method is distinct from 'web_contributor_page' then
    raise exception 'anonymous sessions may only record the web contributor notice' using errcode = 'SCANO';
  end if;
  if p_method = 'support_assisted' then raise exception 'support-assisted acts are recorded by the service role'; end if;
  if jsonb_typeof(v_ctx) <> 'object'
     or exists (select 1 from jsonb_object_keys(v_ctx) k
                 where k not in ('auth', 'age_attested', 'age_signal', 'scope', 'crash', 'usage',
                                 'product', 'intro_offer', 'storefront', 'mode')) then
    raise exception 'context keys are allowlisted' using errcode = '22023';
  end if;
  if v_ctx ? 'age_attested' and v_ctx -> 'age_attested' <> 'true'::jsonb then
    raise exception 'age_attested can only be true' using errcode = '22023';
  end if;
  if p_rendered_sha256 is not null and octet_length(p_rendered_sha256) <> 32 then
    raise exception 'rendered_sha256 must be a SHA-256 (32 bytes)' using errcode = '22023';
  end if;
  v_replay := public.idempotency_claim(auth.uid(), 'record_policy_act',
    jsonb_build_array(p_document, p_version, p_action, p_method, p_surface, p_app_version, p_platform, p_locale,
                      encode(p_rendered_sha256, 'hex'), v_ctx));
  if v_replay is not null then
    return (v_replay ->> 'id')::uuid;
  end if;
  -- Rows are append-only and kept for the account's life plus 3 years, so both an
  -- hourly and a daily ceiling (security review M3).
  if (select count(*) from policy_acceptances a
       where a.profile_id = auth.uid() and a.accepted_at > now() - interval '1 hour') >= 60
     or (select count(*) from policy_acceptances a
          where a.profile_id = auth.uid() and a.accepted_at > now() - interval '24 hours') >= 200 then
    raise exception 'too many policy acts' using errcode = 'SCRAT';
  end if;
  select * into v_ver from policy_versions where document = p_document and version = p_version;
  if not found then raise exception 'unknown document version'; end if;
  if v_ver.new_users_from > now() then raise exception 'version not yet published'; end if;
  -- Accepting a superseded version is refused so stale clients cannot pin old terms.
  if p_action = 'accept' and exists (
       select 1 from policy_versions n
        where n.document = p_document and n.new_users_from <= now()
          and (n.major, n.minor, n.patch) > (v_ver.major, v_ver.minor, v_ver.patch)
          and n.requires_reconsent) then
    raise exception 'a newer version requires acceptance';
  end if;
  if p_client_recorded_at is not null and p_client_recorded_at > now() + interval '5 minutes' then
    p_client_recorded_at := null;  -- device clock in the future; keep server time only
  end if;
  insert into policy_acceptances (profile_id, document, version, action, method, surface,
                                  client_recorded_at, app_version, platform, locale, rendered_sha256, context)
  values (auth.uid(), p_document, p_version, p_action, p_method, p_surface,
          p_client_recorded_at, p_app_version, p_platform, p_locale, p_rendered_sha256, v_ctx)
  returning id into v_id;
  perform public.idempotency_store(auth.uid(), 'record_policy_act', jsonb_build_object('id', v_id));
  return v_id;
end;
$$;

-- Changes from 20261003000000: 60 calls per person per hour (SCRAT), and VOLATILE
-- because counting writes (PostgREST runs STABLE functions read-only). The app
-- calls it with POST (supabase-js rpc) and falls back to policy_versions on error.
create or replace function public.policy_actions_needed()
returns table (document text, version text, effective_at timestamptz, summary text)
language plpgsql volatile security definer set search_path = public, pg_catalog as $$
declare v_uid uuid := public.require_user();
begin
  perform public.rate_hit('policy_actions');
  return query
  with docs as (
    select d.key from policy_documents d
     where d.needs_affirmative_act and d.key in ('terms', 'contributor-notice')  -- consents are offered, not demanded
  ), newest as (
    select distinct on (v.document) v.document, v.version, v.effective_at, v.summary
      from policy_versions v join docs on docs.key = v.document
     where v.new_users_from <= now()
     order by v.document, v.major desc, v.minor desc, v.patch desc
  ), mine as (
    select distinct on (a.document) a.document, a.version, a.action
      from policy_acceptances a
     where a.profile_id = v_uid and a.action in ('accept', 'decline', 'withdraw')
     order by a.document, a.accepted_at desc
  )
  select n.document, n.version, n.effective_at, n.summary
    from newest n
    left join mine m on m.document = n.document
    left join policy_versions mv on mv.document = m.document and mv.version = m.version
   where m.document is null
      or m.action <> 'accept'
      or exists (select 1 from policy_versions r
                  where r.document = n.document and r.effective_at <= now()
                    and r.requires_reconsent and r.major > mv.major);
end;
$$;

-- ─── 4. entries.language (author-only, L4) ───────────────────────────────
alter table public.entries add column if not exists language text;
alter table public.entries add constraint entries_language_code
  check (language is null or language in ('en', 'hi', 'es', 'zh', 'fr', 'ar', 'pt'));

-- Client changes to a letter's language: the author only (RLS already says so;
-- this also covers any future policy), current consent (it is personal data,
-- like the words), and never on a deleted letter (restore it first).
create or replace function public.entries_language_guard()
returns trigger language plpgsql set search_path = public, pg_catalog as $$
begin
  if current_user in ('authenticated', 'anon') and new.language is distinct from old.language then
    if old.author_id is distinct from auth.uid() then
      raise exception 'only the author sets a letter''s language' using errcode = '42501';
    end if;
    if old.deleted_at is not null then
      raise exception 'entries: a deleted entry cannot be edited; restore it first' using errcode = 'SCTMB';
    end if;
    perform public.require_content_consent();
  end if;
  return new;
end;
$$;
create trigger entries_language_guard before update on public.entries
  for each row execute function public.entries_language_guard();

-- sync_pull: unchanged from 20261004100000 except (a) the caller's own letters
-- carry "language" (others' rows come from book_entries, which has no language
-- column), and (b) the rate window goes through rate_hit().
create or replace function public.sync_pull(p_since jsonb default '{}'::jsonb, p_limit int default 200)
returns jsonb language plpgsql volatile security definer set search_path = public, pg_catalog
  set plan_cache_mode = force_generic_plan as $$
declare
  v_uid uuid := public.require_user();
  v_snap pg_snapshot := pg_current_snapshot();
  v_xmin xid8 := pg_snapshot_xmin(v_snap);
  v_xmax xid8 := pg_snapshot_xmax(v_snap);
  c_zero constant uuid := '00000000-0000-0000-0000-000000000000';
  c_mod constant numeric := 281474976710656;   -- 2^48
  v_since jsonb := coalesce(p_since, '{}'::jsonb);
  v_reqs jsonb;
  v_req jsonb;
  v_epoch int;
  v_epoch_at timestamptz;
  v_budget int;
  v_live uuid[] := '{}';
  b record;
  k text;
  v_cur text;
  v_after_x xid8;
  v_after_i uuid;
  v_fresh boolean;
  v_repull boolean;
  v_access text;
  v_meta jsonb;
  v_hash text;
  v_rows jsonb;
  v_n int;
  v_last_x xid8;
  v_last_i uuid;
  v_more boolean;
  v_any_more boolean := false;
  v_cursor text;
  v_check boolean;
  v_digest jsonb;
  v_book jsonb;
  v_books jsonb := '[]'::jsonb;
  v_gone jsonb := '[]'::jsonb;
begin
  if p_limit is null or p_limit not between 1 and 500 then
    raise exception 'limit must be 1 to 500' using errcode = '22023';
  end if;
  if jsonb_typeof(v_since) <> 'object' then
    raise exception 'since must be an object' using errcode = '22023';
  end if;
  v_reqs := coalesce(v_since -> 'books', '{}'::jsonb);
  if jsonb_typeof(v_reqs) <> 'object' or (select count(*) from jsonb_object_keys(v_reqs)) > 100 then
    raise exception 'books must be an object with at most 100 books' using errcode = '22023';
  end if;

  perform public.rate_hit('pull');                -- 120 per minute per person (SCRAT)

  select e.epoch, e.started_at into v_epoch, v_epoch_at from sync_epochs e order by e.epoch desc limit 1;
  if jsonb_typeof(v_since -> 'epoch') is not null and jsonb_typeof(v_since -> 'epoch') <> 'null'
     and (v_since ->> 'epoch') is distinct from v_epoch::text then
    return jsonb_build_object('reset', true, 'reason', 'epoch', 'epoch', v_epoch, 'epoch_started_at', v_epoch_at);
  end if;

  -- Validate every request; a cursor ahead of the server means the database went back in time.
  for k, v_req in select key, value from jsonb_each(v_reqs) loop
    begin
      perform k::uuid;
      if jsonb_typeof(v_req) <> 'object' then raise exception 'bad request'; end if;
      v_cur := nullif(v_req ->> 'cursor', '');
      if v_cur is not null then
        if array_length(string_to_array(v_cur, ':'), 1) <> 2 then raise exception 'bad cursor'; end if;
        v_after_x := split_part(v_cur, ':', 1)::xid8;
        v_after_i := split_part(v_cur, ':', 2)::uuid;
      end if;
    exception when others then
      raise exception 'bad book request' using errcode = '22023';
    end;
    if v_cur is not null and v_after_x > v_xmax then
      return jsonb_build_object('reset', true, 'reason', 'cursor_ahead', 'epoch', v_epoch, 'epoch_started_at', v_epoch_at);
    end if;
  end loop;

  v_budget := p_limit;
  for b in
    select c.id, m.role, c.family_can_read
      from child_members m
      join children c on c.id = m.child_id and c.deleted_at is null
     where m.profile_id = v_uid
     order by m.joined_at, c.id
  loop
    v_live := v_live || b.id;
    v_req := v_reqs -> (b.id::text);
    v_access := case when b.role = 'parent' then 'parent'
                     else 'contributor:' || case when b.family_can_read then 'reads' else 'own' end end;
    v_repull := coalesce(v_req ? 'access' and (v_req ->> 'access') is distinct from v_access, false);
    v_cur := case when v_repull then null else nullif(v_req ->> 'cursor', '') end;
    v_fresh := v_cur is null;
    v_after_x := case when v_fresh then '0'::xid8 else split_part(v_cur, ':', 1)::xid8 end;
    v_after_i := case when v_fresh then c_zero else split_part(v_cur, ':', 2)::uuid end;

    -- Book settings and members. D-039: family members get the birthday's month and day only.
    select jsonb_build_object(
             'role', b.role,
             'name', c.name,
             'nickname', c.nickname,
             'date_of_birth', case when b.role = 'parent' then c.date_of_birth end,
             'birthday_md', to_char(c.date_of_birth, 'MM-DD'),
             'due_date', case when b.role = 'parent' then c.due_date end,
             'family_can_read', c.family_can_read,
             'created_by_me', c.created_by is not distinct from v_uid,
             'my_signs_as', coalesce(mp.signs_as,
                                     (select i.signs_as from child_invites i
                                       where i.child_id = c.id and i.accepted_by = v_uid
                                       order by i.accepted_at desc limit 1)),
             'include_in_reminders', coalesce(mp.include_in_reminders, true),
             'members', coalesce((
               select jsonb_agg(jsonb_build_object(
                        'profile_id', mm.profile_id,
                        'role', mm.role,
                        'is_me', mm.profile_id = v_uid,
                        'joined_at', mm.joined_at,
                        'signs_as', coalesce(pp.signs_as,
                                             (select i.signs_as from child_invites i
                                               where i.child_id = c.id and i.accepted_by = mm.profile_id
                                               order by i.accepted_at desc limit 1),
                                             pr.signs_as))
                        order by mm.joined_at, mm.profile_id)
                 from child_members mm
                 left join child_member_prefs pp on pp.child_id = mm.child_id and pp.profile_id = mm.profile_id
                 left join profiles pr on pr.id = mm.profile_id
                where mm.child_id = c.id), '[]'::jsonb))
      into v_meta
      from children c
      left join child_member_prefs mp on mp.child_id = c.id and mp.profile_id = v_uid
     where c.id = b.id;
    v_hash := md5(v_meta::text);

    v_rows := '[]'::jsonb;
    v_n := 0;
    if v_budget = 0 then
      v_more := true;
      v_cursor := v_cur;
    else
      -- Own letters whole (any state); others' through book_entries (B F9 and the K-09 column allowlist).
      select coalesce(jsonb_agg(x.j order by x.sx, x.id), '[]'::jsonb), count(*),
             (array_agg(x.sx order by x.sx desc, x.id desc))[1],
             (array_agg(x.id order by x.sx desc, x.id desc))[1]
        into v_rows, v_n, v_last_x, v_last_i
        from (
          select p.sync_xid as sx, p.id,
                 case when p.author_id = v_uid then
                   jsonb_build_object(
                     'id', p.id, 'child_id', p.child_id, 'author_id', p.author_id,
                     'author_signs_as', p.author_signs_as, 'kind', p.kind, 'occurred_on', p.occurred_on,
                     'captured_at', p.captured_at, 'capture_mode', p.capture_mode, 'edit_level', p.edit_level,
                     'prompt_key', p.prompt_key, 'prompt_library_version', p.prompt_library_version,
                     'engine_version', p.engine_version, 'raw_transcript', p.raw_transcript,
                     'machine_edits', p.machine_edits, 'final_text', p.final_text, 'in_book', p.in_book,
                     'sounds_like_me', p.sounds_like_me, 'approval', p.approval, 'photo_path', p.photo_path,
                     'audio_kept_on_device', p.audio_kept_on_device, 'language', p.language, 'created_at', p.created_at,
                     'updated_at', p.updated_at, 'deleted_at', p.deleted_at, 'own', true)
                 else
                   (select to_jsonb(be) - 'search' from book_entries be where be.id = p.id) || jsonb_build_object('own', false)
                 end || jsonb_build_object('v', p.sync_xid::text) as j
            from (
              select e.* from entries e
               where e.child_id = b.id
                 and (e.sync_xid, e.id) > (v_after_x, v_after_i)
                 and e.sync_xid < v_xmin
                 and (e.author_id = v_uid or exists (select 1 from book_entries be where be.id = e.id))
               order by e.sync_xid, e.id
               limit v_budget
            ) p
        ) x;
      v_more := v_n = v_budget;
      v_budget := v_budget - v_n;
      v_cursor := case when v_more then v_last_x::text || ':' || v_last_i::text
                       else v_xmin::text || ':' || c_zero::text end;
    end if;
    v_any_more := v_any_more or v_more;

    v_book := jsonb_build_object('id', b.id, 'access', v_access, 'repull', v_repull, 'meta_hash', v_hash,
                                 'rows', v_rows, 'cursor', v_cursor, 'more', v_more);
    if (v_req ->> 'meta') is distinct from v_hash then
      v_book := v_book || jsonb_build_object('meta', v_meta);
    end if;

    if not v_more then
      v_check := v_fresh or v_n > 0 or not (coalesce(v_req, '{}'::jsonb) ? 'have')
                 or coalesce((v_req ->> 'verify')::boolean, false) or coalesce((v_req ->> 'ids')::boolean, false)
                 or exists (select 1 from entries e
                             where e.child_id = b.id and (e.sync_xid, e.id) > (v_after_x, v_after_i) and e.sync_xid < v_xmin);
      if v_check then
        select jsonb_build_object('n', count(*),
                                  'sum', (coalesce(sum(('x' || right(replace(s.id::text, '-', ''), 12))::bit(48)::bigint), 0) % c_mod)::bigint)
          into v_digest
          from (select e.id from entries e where e.child_id = b.id and e.author_id = v_uid
                union all
                select be.id from book_entries be where be.child_id = b.id and be.author_id <> v_uid) s;
      else
        v_digest := v_req -> 'have';
      end if;
      v_book := v_book || jsonb_build_object('visible', v_digest);
      if coalesce((v_req ->> 'ids')::boolean, false) then
        v_book := v_book || jsonb_build_object('ids', coalesce((
          select jsonb_agg(s.id order by s.id)
            from (select e.id from entries e where e.child_id = b.id and e.author_id = v_uid
                  union all
                  select be.id from book_entries be where be.child_id = b.id and be.author_id <> v_uid) s), '[]'::jsonb));
      end if;
    end if;
    v_books := v_books || jsonb_build_array(v_book);
  end loop;

  -- Books the phone asked about that the caller no longer reads: left, removed, or
  -- deleted. Only the caller's own letters still come down (for example the
  -- tombstones of "delete my letters and leave").
  for k, v_req in select key, value from jsonb_each(v_reqs) where key::uuid <> all(v_live) order by key loop
    v_cur := nullif(v_req ->> 'cursor', '');
    v_after_x := case when v_cur is null then '0'::xid8 else split_part(v_cur, ':', 1)::xid8 end;
    v_after_i := case when v_cur is null then c_zero else split_part(v_cur, ':', 2)::uuid end;
    v_rows := '[]'::jsonb;
    v_n := 0;
    if v_budget = 0 then
      v_more := true;
      v_cursor := v_cur;
    else
      select coalesce(jsonb_agg(x.j order by x.sx, x.id), '[]'::jsonb), count(*),
             (array_agg(x.sx order by x.sx desc, x.id desc))[1],
             (array_agg(x.id order by x.sx desc, x.id desc))[1]
        into v_rows, v_n, v_last_x, v_last_i
        from (
          select p.sync_xid as sx, p.id,
                 jsonb_build_object(
                   'id', p.id, 'child_id', p.child_id, 'author_id', p.author_id,
                   'author_signs_as', p.author_signs_as, 'kind', p.kind, 'occurred_on', p.occurred_on,
                   'captured_at', p.captured_at, 'capture_mode', p.capture_mode, 'edit_level', p.edit_level,
                   'prompt_key', p.prompt_key, 'prompt_library_version', p.prompt_library_version,
                   'engine_version', p.engine_version, 'raw_transcript', p.raw_transcript,
                   'machine_edits', p.machine_edits, 'final_text', p.final_text, 'in_book', p.in_book,
                   'sounds_like_me', p.sounds_like_me, 'approval', p.approval, 'photo_path', p.photo_path,
                   'audio_kept_on_device', p.audio_kept_on_device, 'language', p.language, 'created_at', p.created_at,
                   'updated_at', p.updated_at, 'deleted_at', p.deleted_at, 'own', true,
                   'v', p.sync_xid::text) as j
            from (
              select e.* from entries e
               where e.child_id = k::uuid and e.author_id = v_uid
                 and (e.sync_xid, e.id) > (v_after_x, v_after_i)
                 and e.sync_xid < v_xmin
               order by e.sync_xid, e.id
               limit v_budget
            ) p
        ) x;
      v_more := v_n = v_budget;
      v_budget := v_budget - v_n;
      v_cursor := case when v_more then v_last_x::text || ':' || v_last_i::text
                       else v_xmin::text || ':' || c_zero::text end;
    end if;
    v_any_more := v_any_more or v_more;
    v_gone := v_gone || jsonb_build_array(jsonb_build_object(
      'id', k,
      'reason', case when exists (select 1 from child_members m join children c on c.id = m.child_id
                                   where m.child_id = k::uuid and m.profile_id = v_uid and c.deleted_at is not null)
                     then 'deleted' else 'not_member' end,
      'rows', v_rows, 'cursor', v_cursor, 'more', v_more));
  end loop;

  return jsonb_build_object('reset', false, 'epoch', v_epoch, 'epoch_started_at', v_epoch_at,
                            'books', v_books, 'gone', v_gone, 'more', v_any_more);
end;
$$;

-- sync_push: unchanged from 20261004100000 except (a) a fifth field group
-- "language", applied only when data carries the "language" key (so an older app
-- that never sends it cannot clear it; with no "changed" list every group is
-- meant, as before), and (b) the rate window goes through rate_hit().
create or replace function public.sync_push(p_ops jsonb)
returns jsonb language plpgsql volatile security invoker set search_path = public, pg_catalog
  set plan_cache_mode = force_generic_plan as $$
declare
  v_uid uuid := public.require_user();
  c_groups constant text[] := array['text', 'in_book', 'sounds_like_me', 'occurred_on', 'language'];
  v_epoch_at timestamptz;
  o jsonb;
  d jsonb;
  v_op uuid;
  v_type text;
  v_id uuid;
  v_changed text[];
  v_known timestamptz;
  v_deleted boolean;
  cur record;
  v_exists boolean;
  v_apply boolean;
  v_conflict boolean;
  v_new boolean;
  v_res jsonb;
  v_results jsonb := '[]'::jsonb;
  v_code text;
  v_detail text;
  v_ids uuid[];
begin
  if jsonb_typeof(p_ops) is distinct from 'array' or jsonb_array_length(p_ops) > 50 then
    raise exception 'push takes 0 to 50 ops' using errcode = '22023';
  end if;
  if octet_length(p_ops::text) > 262144 then
    raise exception 'push batch is over 256 KB' using errcode = '22023';
  end if;

  perform public.rate_hit('push');                -- 60 per minute per person (SCRAT)

  select e.started_at into v_epoch_at from sync_epochs e order by e.epoch desc limit 1;

  for o in select value from jsonb_array_elements(p_ops) loop
    v_res := '{}'::jsonb;
    begin
      if jsonb_typeof(o) is distinct from 'object' then
        raise exception 'op must be an object' using errcode = '22023';
      end if;
      v_op := (o ->> 'op')::uuid;
      v_type := o ->> 'type';
      v_id := (o ->> 'id')::uuid;
      d := coalesce(o -> 'data', '{}'::jsonb);
      if v_op is null or v_id is null or v_type is null or jsonb_typeof(d) <> 'object' then
        raise exception 'op, type, id and data are required' using errcode = '22023';
      end if;

      -- Idempotency key first: a retry of an applied op changes nothing and reports the current state.
      insert into sync_op_receipts (op_id, profile_id) values (v_op, v_uid) on conflict (op_id) do nothing;
      v_new := found;

      if not v_new then
        v_res := jsonb_build_object('dup', true);
        if v_type like 'entry.%' then
          v_res := v_res || coalesce(
            (select jsonb_build_object('entry', jsonb_build_object(
                      'id', e.id, 'v', e.sync_xid::text, 'updated_at', e.updated_at, 'deleted_at', e.deleted_at,
                      'in_book', e.in_book, 'approval', e.approval))
               from entries e where e.id = v_id),
            jsonb_build_object('missing', true));
        end if;
      else
        case v_type
        when 'entry.upsert', 'entry.reupload' then
          if o ? 'changed' then
            if jsonb_typeof(o -> 'changed') <> 'array' then
              raise exception 'changed must be an array' using errcode = '22023';
            end if;
            v_changed := array(select jsonb_array_elements_text(o -> 'changed'));
            if not v_changed <@ c_groups then
              raise exception 'unknown field group' using errcode = '22023';
            end if;
          else
            v_changed := c_groups;
          end if;
          select e.sync_xid, e.updated_at, e.deleted_at, e.sync_restored_from into cur
            from entries e where e.id = v_id;            -- RLS: the caller's own letters only
          v_exists := found;
          v_apply := true;
          v_conflict := false;
          v_deleted := false;
          if v_type = 'entry.reupload' then
            v_known := (o ->> 'known_at')::timestamptz;
            if v_known is null then
              raise exception 'known_at is required for a re-upload' using errcode = '22023';
            end if;
            v_deleted := coalesce((d ->> 'deleted')::boolean, false);
            v_changed := c_groups;
            if v_exists then
              v_apply := case when cur.sync_restored_from is not null then v_known > cur.sync_restored_from
                              else cur.updated_at < v_epoch_at and v_known > cur.updated_at end;
            end if;
          elsif v_exists and nullif(o ->> 'base', '') is not null then
            v_conflict := cur.sync_xid > (o ->> 'base')::xid8;
          end if;

          if v_apply then
            if v_type = 'entry.reupload' then
              perform set_config('scribe.sync_reupload', 'on', true);
              if v_exists and cur.deleted_at is not null and not v_deleted then
                perform public.restore_entry(v_id);
              end if;
            end if;
            if not (v_exists and v_type = 'entry.reupload' and cur.deleted_at is not null and v_deleted) then
              insert into entries as e (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode,
                                        edit_level, prompt_key, engine_version, raw_transcript, machine_edits,
                                        final_text, in_book, sounds_like_me, author_signs_as, audio_kept_on_device,
                                        deleted_at, language)
              values (v_id, (d ->> 'child_id')::uuid, v_uid, d ->> 'kind', (d ->> 'occurred_on')::date,
                      (d ->> 'captured_at')::timestamptz, d ->> 'capture_mode', coalesce(d ->> 'edit_level', 'clean'),
                      d ->> 'prompt_key', (d ->> 'engine_version')::int, d ->> 'raw_transcript',
                      coalesce(d -> 'machine_edits', '[]'::jsonb), d ->> 'final_text',
                      coalesce((d ->> 'in_book')::boolean, false), (d ->> 'sounds_like_me')::boolean,
                      nullif(d ->> 'author_signs_as', ''), coalesce((d ->> 'audio_kept_on_device')::boolean, false),
                      case when v_deleted then now() end, nullif(d ->> 'language', ''))
              on conflict (id) do update set
                final_text = case when 'text' = any(v_changed) then excluded.final_text else e.final_text end,
                machine_edits = case when 'text' = any(v_changed) then excluded.machine_edits else e.machine_edits end,
                edit_level = case when 'text' = any(v_changed) then excluded.edit_level else e.edit_level end,
                in_book = case when 'in_book' = any(v_changed) then excluded.in_book else e.in_book end,
                sounds_like_me = case when 'sounds_like_me' = any(v_changed) then excluded.sounds_like_me else e.sounds_like_me end,
                occurred_on = case when 'occurred_on' = any(v_changed) then excluded.occurred_on else e.occurred_on end,
                language = case when 'language' = any(v_changed) and d ? 'language' then excluded.language else e.language end,
                -- Never changed: passed through so entries_guard refuses a different value (SCIMM).
                raw_transcript = excluded.raw_transcript,
                captured_at = excluded.captured_at,
                child_id = excluded.child_id,
                engine_version = excluded.engine_version
              where (e.final_text, e.machine_edits, e.edit_level, e.in_book, e.sounds_like_me, e.occurred_on,
                     e.raw_transcript, e.captured_at, e.child_id, e.engine_version, e.language)
                    is distinct from
                    (case when 'text' = any(v_changed) then excluded.final_text else e.final_text end,
                     case when 'text' = any(v_changed) then excluded.machine_edits else e.machine_edits end,
                     case when 'text' = any(v_changed) then excluded.edit_level else e.edit_level end,
                     case when 'in_book' = any(v_changed) then excluded.in_book else e.in_book end,
                     case when 'sounds_like_me' = any(v_changed) then excluded.sounds_like_me else e.sounds_like_me end,
                     case when 'occurred_on' = any(v_changed) then excluded.occurred_on else e.occurred_on end,
                     excluded.raw_transcript, excluded.captured_at, excluded.child_id, excluded.engine_version,
                     case when 'language' = any(v_changed) and d ? 'language' then excluded.language else e.language end);
            end if;
            if v_type = 'entry.reupload' then
              if v_exists and cur.deleted_at is null and v_deleted then
                perform public.delete_entry(v_id);
              end if;
              update entries set sync_restored_from = v_known
               where id = v_id and sync_restored_from is distinct from v_known;
              perform set_config('scribe.sync_reupload', 'off', true);
            end if;
          end if;
          v_res := jsonb_build_object('applied', v_apply, 'conflict', v_conflict, 'entry',
            (select jsonb_build_object('id', e.id, 'v', e.sync_xid::text, 'updated_at', e.updated_at,
                                       'deleted_at', e.deleted_at, 'in_book', e.in_book, 'approval', e.approval)
               from entries e where e.id = v_id));

        when 'entry.delete' then
          if exists (select 1 from entries e where e.id = v_id) then
            perform public.delete_entry(v_id);
            v_res := jsonb_build_object('entry',
              (select jsonb_build_object('id', e.id, 'v', e.sync_xid::text, 'updated_at', e.updated_at,
                                         'deleted_at', e.deleted_at, 'in_book', e.in_book, 'approval', e.approval)
                 from entries e where e.id = v_id));
          else
            v_res := jsonb_build_object('missing', true);
          end if;

        when 'entry.restore' then
          if exists (select 1 from entries e where e.id = v_id) then
            perform public.restore_entry(v_id);
            v_res := jsonb_build_object('entry',
              (select jsonb_build_object('id', e.id, 'v', e.sync_xid::text, 'updated_at', e.updated_at,
                                         'deleted_at', e.deleted_at, 'in_book', e.in_book, 'approval', e.approval)
                 from entries e where e.id = v_id));
          else
            v_res := jsonb_build_object('missing', true);
          end if;

        when 'book.first_run' then
          v_ids := public.create_first_run_children(d -> 'children');
          v_res := jsonb_build_object('books', to_jsonb(v_ids));

        when 'book.create' then
          perform public.create_child(v_id, d ->> 'name', (d ->> 'date_of_birth')::date, (d ->> 'due_date')::date);
          v_res := jsonb_build_object('book', jsonb_build_object('id', v_id));

        when 'book.update' then
          if exists (select 1 from jsonb_object_keys(d) x
                      where x not in ('name', 'nickname', 'date_of_birth', 'due_date', 'family_can_read')) then
            raise exception 'unknown book field' using errcode = '22023';
          end if;
          if not exists (select 1 from children c where c.id = v_id) then
            raise exception 'book not found' using errcode = 'P0002';
          end if;
          update children c set
            name = case when d ? 'name' then d ->> 'name' else c.name end,
            nickname = case when d ? 'nickname' then nullif(btrim(d ->> 'nickname'), '') else c.nickname end,
            date_of_birth = case when d ? 'date_of_birth' then (d ->> 'date_of_birth')::date else c.date_of_birth end,
            due_date = case when d ? 'due_date' then (d ->> 'due_date')::date else c.due_date end,
            family_can_read = case when d ? 'family_can_read' then (d ->> 'family_can_read')::boolean else c.family_can_read end
          where c.id = v_id
            and (c.name, c.nickname, c.date_of_birth, c.due_date, c.family_can_read) is distinct from
                (case when d ? 'name' then d ->> 'name' else c.name end,
                 case when d ? 'nickname' then nullif(btrim(d ->> 'nickname'), '') else c.nickname end,
                 case when d ? 'date_of_birth' then (d ->> 'date_of_birth')::date else c.date_of_birth end,
                 case when d ? 'due_date' then (d ->> 'due_date')::date else c.due_date end,
                 case when d ? 'family_can_read' then (d ->> 'family_can_read')::boolean else c.family_can_read end);
          v_res := jsonb_build_object('book', jsonb_build_object('id', v_id));

        when 'prefs.upsert' then
          if exists (select 1 from jsonb_object_keys(d) x where x not in ('signs_as', 'include_in_reminders')) then
            raise exception 'unknown preference' using errcode = '22023';
          end if;
          insert into child_member_prefs as p (child_id, profile_id, signs_as, include_in_reminders)
          values (v_id, v_uid, nullif(btrim(d ->> 'signs_as'), ''), coalesce((d ->> 'include_in_reminders')::boolean, true))
          on conflict (child_id, profile_id) do update set
            signs_as = case when d ? 'signs_as' then excluded.signs_as else p.signs_as end,
            include_in_reminders = case when d ? 'include_in_reminders' then excluded.include_in_reminders
                                        else p.include_in_reminders end
          where (p.signs_as, p.include_in_reminders) is distinct from
                (case when d ? 'signs_as' then excluded.signs_as else p.signs_as end,
                 case when d ? 'include_in_reminders' then excluded.include_in_reminders else p.include_in_reminders end);
          v_res := jsonb_build_object('prefs', jsonb_build_object('child_id', v_id));

        else
          raise exception 'unknown op type' using errcode = '22023';
        end case;
      end if;
      v_results := v_results || jsonb_build_array(jsonb_build_object('op', v_op, 'ok', true) || v_res);
    exception when others then
      get stacked diagnostics v_code = returned_sqlstate, v_detail = pg_exception_detail;
      if v_code = 'SCCON' then
        -- Ops before this one are kept; this one and the rest wait for consent.
        return jsonb_build_object('results', v_results, 'paused', true, 'stopped', false, 'consent', v_detail);
      end if;
      if left(v_code, 2) in ('40', '53', '55', '57', '58', 'XX') then
        return jsonb_build_object('results', v_results, 'paused', false, 'stopped', true, 'code', v_code);
      end if;
      v_results := v_results || jsonb_build_array(
        jsonb_build_object('op', left(o ->> 'op', 36), 'ok', false, 'code', v_code)
        || case when v_code = 'SCDEL' and v_detail = 'purged' then jsonb_build_object('gone', true) else '{}'::jsonb end);
    end;
  end loop;

  -- Trim the caller's own old receipts (bounded; sync_housekeeping covers people who stopped syncing).
  delete from sync_op_receipts r
   where r.op_id in (select x.op_id from sync_op_receipts x
                      where x.profile_id = v_uid and x.applied_at < now() - interval '30 days'
                      order by x.applied_at limit 100);
  return jsonb_build_object('results', v_results, 'paused', false, 'stopped', false);
end;
$$;

-- Housekeeping (hourly cron from APPLY.md step 15) also trims idempotency keys after 24 hours.
create or replace function public.sync_housekeeping(p_now timestamptz default now(), p_limit int default 10000)
returns jsonb language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  v_receipts int;
  v_windows int;
  v_keys int;
  v_lim int := greatest(coalesce(p_limit, 10000), 1);
begin
  delete from sync_op_receipts r
   where r.op_id in (select x.op_id from sync_op_receipts x where x.applied_at < p_now - interval '30 days'
                      order by x.applied_at limit v_lim);
  get diagnostics v_receipts = row_count;
  delete from sync_rate_windows where window_start < p_now - interval '1 day';
  get diagnostics v_windows = row_count;
  delete from idempotency_keys k
   where (k.profile_id, k.idem_key) in (select x.profile_id, x.idem_key from idempotency_keys x
                                         where x.created_at < p_now - interval '24 hours'
                                         order by x.created_at limit v_lim);
  get diagnostics v_keys = row_count;
  return jsonb_build_object('receipts', v_receipts, 'rate_windows', v_windows, 'idempotency_keys', v_keys,
                            'more', v_receipts >= v_lim or v_keys >= v_lim);
end;
$$;

-- insights.language_mix (20261004300000) read the column through dynamic SQL
-- while it did not exist. Now it is static; the k = 10 merge in
-- insights.language_mix_rows() is unchanged, and the CASE keeps any code outside
-- the seven in 'other' if the list ever grows. Grants are kept by the replace.
create or replace function insights._language_counts()
returns table (week date, lang text, n bigint)
language sql stable security definer set search_path = insights, public, pg_catalog as $$
  select l.week,
         case when e.language in ('en', 'hi', 'es', 'zh', 'fr', 'ar', 'pt') then e.language else 'other' end,
         count(distinct l.family_key)
    from insights._letters l
    join public.entries e on e.id = l.entry_id
   where e.language is not null
   group by 1, 2
$$;

-- ─── 5. Privileges ───────────────────────────────────────────────────────
-- Internal: helpers called only from security-definer functions, and triggers.
revoke execute on function public.max_parents_per_book() from public, anon, authenticated;
revoke execute on function public.request_idempotency_key() from public, anon, authenticated;
revoke execute on function public.idempotency_claim(uuid, text, jsonb) from public, anon, authenticated;
revoke execute on function public.idempotency_store(uuid, text, jsonb) from public, anon, authenticated;
revoke execute on function public.child_members_revoke_invites() from public, anon, authenticated;
revoke execute on function public.entries_language_guard() from public, anon, authenticated;

-- RPCs (each starts with require_user()). rate_hit is callable because sync_push
-- runs as the caller; calling it directly only spends the caller's own allowance.
revoke execute on function public.rate_hit(text) from public, anon;
revoke execute on function public.leave_child(uuid, boolean) from public, anon;
revoke execute on function public.remove_child_member(uuid, uuid, boolean) from public, anon;
grant execute on function public.rate_hit(text) to authenticated;
grant execute on function public.leave_child(uuid, boolean) to authenticated;
grant execute on function public.remove_child_member(uuid, uuid, boolean) to authenticated;

-- ─── 6. Classification (docs/legal/DATA_CLASSIFICATION.md) ───────────────
comment on column public.entries.language is
  'L4 spoken-letter language (one of the seven v1.0 codes), author-only: never in book_entries';
comment on column public.idempotency_keys.profile_id is 'L3 person id';
comment on column public.idempotency_keys.idem_key is 'L2 client-made request key (UUID)';
comment on column public.idempotency_keys.fn is 'L2 enum (function name)';
comment on column public.idempotency_keys.request_sha256 is 'L2 hash of the request arguments';
comment on column public.idempotency_keys.result is 'L3 ids of what the first call made (invite id or act id), never tokens or text';
comment on column public.idempotency_keys.created_at is 'L2 system timestamp (rows live 24 hours)';
comment on table public.sync_rate_windows is
  'Per-person request counters for server-side rate limits (sync pull and push, policy reads, membership changes). Written only by rate_hit(); unlogged.';
