-- invite_redeem_by_code: the one SQL call the invite-redeem Edge Function makes
-- (packages/api/src/server/family.ts, RedeemByCodeArgs; review B N8 on #138;
-- BL-334; F11-REQ-007; B-NFR-004). Until this file the function answered 503 on
-- every code, because it called an RPC that no migration created.
--
-- PENDING: not yet applied. Apply after 20261023060000_explicit_grants.sql,
-- following supabase/APPLY.md. Never edits an earlier file.
--
-- ROLLBACK: drop function public.invite_redeem_by_code(uuid, text, bytea, text[], text[], text[]);
--           drop table public.invite_redeem_failures;   (typed codes then answer 503 again)
--
-- What it does, in ONE transaction, so parallel guesses cannot all pass the
-- gate before a failure is recorded, and a failure is committed before the
-- answer leaves:
--   1. Locks each subject hash (pg_advisory_xact_lock, in sorted order, so two
--      callers cannot deadlock). A subject with no row yet still serialises.
--   2. Gate: counts failures in the last hour for the person (10), the device
--      (10), the client address (30, skipped when the platform gave none) and
--      the whole service (1,000). A limited caller gets {"outcome":"limited",
--      "scope":...} and is neither looked up nor counted. The global count is
--      read plainly and written as one insert, never as a shared counter row.
--   3. Looks the code up. mode "peek" reads what a person sees before agreeing
--      (the inviter's sign-off and the role, plus "joined" while the caller is
--      still a member), the same checks as peek_invite. Mode "accept" runs
--      accept_child_invite_by_code inside a sub-block, so its errors come back
--      as data and the failure count is not rolled back with them.
--   4. A wrong, expired, used, revoked or closed code, or a person already in
--      the book, is "unusable" and counted under the first subject of each
--      array and under the global subject. SCCAP and SCCON (the book is full,
--      consent is missing) mean the code was right: "refused", not counted.
--
-- Each subjects array holds the subject's hash under the current key and, in
-- the first hour after a key rotation, under the previous key too: failures
-- are counted over all of them and recorded under the first.
--
-- Only hashes are stored (never a code, a user id, a device id or an address),
-- with no link to a profile, so account deletion has nothing to remove. Rows
-- older than 2 hours are deleted as failures are recorded.
--
-- Executable by service_role only (the access_matrix rule from review B N8).
-- New SQLSTATEs: none. Reused: SCINV, SCCAP, SCCON.

-- A second run by hand is refused (`supabase db push` never re-runs a file).
do $$
begin
  if to_regclass('public.invite_redeem_failures') is not null then
    raise exception '20261028010000 is already applied; do not run it again' using errcode = '55000';
  end if;
end;
$$;

-- ─── 1. The failure record ───────────────────────────────────────────────
create table public.invite_redeem_failures (
  id bigint generated always as identity primary key,
  scope text not null check (scope in ('user', 'device', 'ip', 'global')),
  subject text not null check (char_length(subject) <= 128),
  at timestamptz not null default now()
);
create index invite_redeem_failures_subject_idx on public.invite_redeem_failures (scope, subject, at);
create index invite_redeem_failures_at_idx on public.invite_redeem_failures (at);
alter table public.invite_redeem_failures enable row level security;   -- no policies: the function only
revoke all on public.invite_redeem_failures from public, anon, authenticated, service_role;
revoke all on sequence public.invite_redeem_failures_id_seq from public, anon, authenticated, service_role;
comment on table public.invite_redeem_failures is
  'One row per counted wrong guess at an invite code (hashed subjects only). Written only by invite_redeem_by_code(); rows older than 2 hours are removed as new ones are written.';
comment on column public.invite_redeem_failures.id is 'L2 row number of an operational record';
comment on column public.invite_redeem_failures.scope is 'L2 user, device, ip or global';
comment on column public.invite_redeem_failures.subject is 'L3 keyed hash (rotating key) of a person id, device id or client address; empty for global; never a raw id';
comment on column public.invite_redeem_failures.at is 'L2 when the guess failed';

-- ─── 2. The call ─────────────────────────────────────────────────────────
create or replace function public.invite_redeem_by_code(
  p_user uuid, p_mode text, p_code_hash bytea,
  p_user_subjects text[], p_device_subjects text[], p_ip_subjects text[])
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  c_window constant interval := interval '1 hour';
  c_user_limit constant int := 10;
  c_device_limit constant int := 10;
  c_ip_limit constant int := 30;
  c_global_limit constant int := 1000;
  v_subj text;
  v_inv child_invites%rowtype;
  v_child uuid;
  v_role text;
  v_name text;
  v_joined boolean := false;
  v_unusable boolean := false;
  v_unusable_detail text;
  v_state text;
  v_msg text;
  v_detail text;
begin
  -- Contract breaks are errors (the function answers "unavailable"), not outcomes.
  if p_user is null or p_mode is null or p_mode not in ('peek', 'accept')
     or p_code_hash is null or octet_length(p_code_hash) <> 32
     or coalesce(cardinality(p_user_subjects), 0) = 0 or coalesce(cardinality(p_device_subjects), 0) = 0
     or p_ip_subjects is null
     or exists (select 1 from unnest(p_user_subjects || p_device_subjects || p_ip_subjects) s
                 where s is null or s = '' or char_length(s) > 128) then
    raise exception 'user, mode, a 32-byte code hash, and non-empty person and device subjects are required' using errcode = '22023';
  end if;

  -- Serialise every subject, in one fixed order.
  for v_subj in select distinct s from unnest(p_user_subjects || p_device_subjects || p_ip_subjects) s order by s loop
    perform pg_advisory_xact_lock(hashtextextended('invite_redeem:' || v_subj, 0));
  end loop;

  -- The gate. A limited caller is not looked up and not counted.
  if (select count(*) from invite_redeem_failures
       where scope = 'user' and subject = any (p_user_subjects) and at > now() - c_window) >= c_user_limit then
    return jsonb_build_object('outcome', 'limited', 'scope', 'user');
  end if;
  if (select count(*) from invite_redeem_failures
       where scope = 'device' and subject = any (p_device_subjects) and at > now() - c_window) >= c_device_limit then
    return jsonb_build_object('outcome', 'limited', 'scope', 'device');
  end if;
  if cardinality(p_ip_subjects) > 0 and (select count(*) from invite_redeem_failures
       where scope = 'ip' and subject = any (p_ip_subjects) and at > now() - c_window) >= c_ip_limit then
    return jsonb_build_object('outcome', 'limited', 'scope', 'ip');
  end if;
  if (select count(*) from invite_redeem_failures
       where scope = 'global' and at > now() - c_window) >= c_global_limit then
    return jsonb_build_object('outcome', 'limited', 'scope', 'global');
  end if;

  if not exists (select 1 from profiles where id = p_user) then
    v_unusable := true;
  elsif p_mode = 'accept' then
    begin
      v_child := public.accept_child_invite_by_code(p_user, p_code_hash);
      select i.role into v_role from child_invites i
       where i.child_id = v_child and i.accepted_by = p_user
       order by i.accepted_at desc limit 1;
      return jsonb_build_object('outcome', 'accepted', 'child_id', v_child, 'role', v_role);
    exception when others then
      get stacked diagnostics v_state = returned_sqlstate, v_msg = message_text, v_detail = pg_exception_detail;
      if v_state = 'SCINV' then
        v_unusable := true;
        -- already_member by an explicit check, not by the inner message text: the newest open invite
        -- for this code (as accept_child_invite_by_code picks it) is in a live book this person is in.
        select * into v_inv from child_invites i
         where i.code_hash = p_code_hash and i.accepted_at is null and i.revoked_at is null and i.expires_at > now()
         order by i.created_at desc limit 1;
        if found and public.child_is_live(v_inv.child_id)
           and exists (select 1 from child_members where child_id = v_inv.child_id and profile_id = p_user) then
          v_unusable_detail := 'already_member';
        end if;
      elsif v_state in ('SCCAP', 'SCCON') then
        return jsonb_build_object('outcome', 'refused', 'sqlstate', v_state, 'detail', v_detail);
      else
        raise exception '%', v_msg using errcode = v_state, detail = v_detail;
      end if;
    end;
  else
    -- peek: the same checks as peek_invite, nothing written but a failure count.
    select * into v_inv from child_invites i
     where i.code_hash = p_code_hash and i.accepted_by = p_user
       and exists (select 1 from child_members m where m.child_id = i.child_id and m.profile_id = p_user)
     order by i.accepted_at desc limit 1;
    if found then
      v_joined := true;
    else
      select * into v_inv from child_invites i
       where i.code_hash = p_code_hash and i.accepted_at is null and i.revoked_at is null and i.expires_at > now()
       order by i.created_at desc limit 1;
      if not found or not public.child_is_live(v_inv.child_id) then
        v_unusable := true;
      elsif exists (select 1 from child_members where child_id = v_inv.child_id and profile_id = p_user) then
        v_unusable := true;
        v_unusable_detail := 'already_member';
      elsif v_inv.role = 'contributor' and not public.contributors_enabled() then
        v_unusable := true;
      elsif not exists (select 1 from child_members
                         where child_id = v_inv.child_id and profile_id = v_inv.invited_by and role = 'parent') then
        v_unusable := true;
      elsif v_inv.role = 'parent'
            and (select count(*) from child_members where child_id = v_inv.child_id and role = 'parent') >= public.max_parents_per_book() then
        return jsonb_build_object('outcome', 'refused', 'sqlstate', 'SCCAP', 'detail', public.max_parents_per_book()::text);
      end if;
    end if;
    if not v_unusable then
      -- The inviter's sign-off for this book (as peek_invite and sync_pull list members). Never the child's name.
      select coalesce(pp.signs_as,
                      (select i.signs_as from child_invites i
                        where i.child_id = v_inv.child_id and i.accepted_by = v_inv.invited_by
                        order by i.accepted_at desc limit 1),
                      pr.signs_as)
        into v_name
        from profiles pr
        left join child_member_prefs pp on pp.child_id = v_inv.child_id and pp.profile_id = pr.id
       where pr.id = v_inv.invited_by;
      return jsonb_build_object('outcome', 'peek', 'inviter', v_name, 'role', v_inv.role)
             || case when v_joined then jsonb_build_object('joined', true) else '{}'::jsonb end;
    end if;
  end if;

  -- Unusable: count it, in this transaction, before the answer leaves.
  -- The purge below takes row locks outside the subject locks, so two callers with different subjects
  -- can pick the same stale rows. skip locked makes the second skip them instead of waiting in a
  -- different order (SQLSTATE 40P01 would roll back this failure insert and answer 503, uncounted).
  insert into invite_redeem_failures (scope, subject) values ('user', p_user_subjects[1]), ('device', p_device_subjects[1]), ('global', '');
  if cardinality(p_ip_subjects) > 0 then
    insert into invite_redeem_failures (scope, subject) values ('ip', p_ip_subjects[1]);
  end if;
  delete from invite_redeem_failures
   where id in (select id from invite_redeem_failures where at < now() - interval '2 hours' order by at limit 200
                 for update skip locked);
  return jsonb_build_object('outcome', 'unusable', 'detail', v_unusable_detail);
end;
$$;

-- ─── 3. Privileges ───────────────────────────────────────────────────────
revoke execute on function public.invite_redeem_by_code(uuid, text, bytea, text[], text[], text[]) from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.invite_redeem_by_code(uuid, text, bytea, text[], text[], text[]) to service_role';
  end if;
end;
$$;
