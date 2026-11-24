-- invite_redeem_by_code: the retry shortcut keeps the live-child check and answers the member's
-- current role (BL-1844, follow-up to BL-525 / 20261122300000, review notes on PR #1638).
--
-- PENDING: not yet applied. Apply after 20261122300000_invite_redeem_retry_after_success.sql.
-- Never edits an earlier file: it replaces the function with the same signature.
--
-- Changes, all inside the accept-mode shortcut: (1) it asks child_is_live, so a deleted book does not
-- answer success; (2) it returns the member's current role from child_members, not the invite's role;
-- (1b) the same two rules apply to the answer when the inner accept returns (its own idempotent retry);
-- (3) the advisory locks stay before the shortcut (reason in the body). Nothing else changes.
-- No new object, column or grant: same signature, service_role only (restated below).
--
-- ROLLBACK: re-create the function from 20261122300000_invite_redeem_retry_after_success.sql.
-- Check [U] (hosted, founder): select pg_get_functiondef('public.invite_redeem_by_code(uuid,text,bytea,text[],text[],text[])'::regprocedure) like '%BL-1844%';  -- true

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

  -- A retry after success (BL-525, tightened by BL-1844). A person who already joined by this code and
  -- is still a member of a live book gets the same answer the first call gave, even while a limit is
  -- reached: the code was right, so the retry is neither a guess nor counted. Nothing is written, and
  -- only a person's own joined record is read (the same check accept_child_invite_by_code makes).
  --   Live book: a book that has been deleted does not answer success (child_is_live, as every other
  --   branch asks). It falls through to the gate and then to "unusable", counted like any dead code.
  --   Current role: the role is the member's role now (child_members), not the invite's role at the
  --   time, which can differ after a role change.
  --   Locks: the subject locks above stay BEFORE this check on purpose. A retry that shares a subject
  --   with a first accept still in flight then waits for it and sees its committed join; taking the
  --   locks after the check would let that retry miss the join and be told "limited" at a limit.
  if p_mode = 'accept' then
    select i.child_id, m.role into v_child, v_role
      from child_invites i
      join child_members m on m.child_id = i.child_id and m.profile_id = p_user
     where i.code_hash = p_code_hash and i.accepted_by = p_user
       and public.child_is_live(i.child_id)
     order by i.accepted_at desc limit 1;
    if found then
      return jsonb_build_object('outcome', 'accepted', 'child_id', v_child, 'role', v_role);
    end if;
  end if;

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
      -- BL-1844: accept_child_invite_by_code has its own idempotent retry, which answers a book that has
      -- since been deleted. Here a book that is not live is unusable, and the role is the member's own now.
      if public.child_is_live(v_child) then
        select m.role into v_role from child_members m where m.child_id = v_child and m.profile_id = p_user;
        return jsonb_build_object('outcome', 'accepted', 'child_id', v_child, 'role', v_role);
      end if;
      v_unusable := true;
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

-- ─── Privileges (unchanged: service_role only; restated so this file stands alone) ───
revoke execute on function public.invite_redeem_by_code(uuid, text, bytea, text[], text[], text[]) from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.invite_redeem_by_code(uuid, text, bytea, text[], text[], text[]) to service_role';
  end if;
end;
$$;
