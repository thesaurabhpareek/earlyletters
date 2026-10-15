-- peek_invite (server half of BL-322, security review H2) with BL-334 (the consent
-- pepper fails closed), in one file (PRD V2 08-delivery.md section 6.3, S02 wave 1).
--
-- PENDING: not yet applied. Apply after 20261015000000_v1_gate_membership_sync_hardening.sql,
-- following supabase/APPLY.md (section "Files 13 to 16"). Never edits an
-- earlier file; policy_acceptances_pseudonymise is redefined from 20261002020000
-- and ops_deletion_sla from 20261004200000.
--
-- Both sections are ported from branch auto/2026-10-05-fixes, commit d1cbddb,
-- file 20261005100000_db_fix_privacy_limits.sql sections 5 and 6 (gaps G-12 and
-- G-13), per docs/agents/PORT_MAP_2026-10-13.md section 5. The only change is the
-- search_path rule (pg_catalog, public, pg_temp; see 20261015000000 section 7).
--
-- G-12  The consent pepper fails closed (TDD 05 X-12, BL-334, LEGAL-REQ-009,
--       DATA-REQ-006): deleting a profile that has policy acceptances raises
--       55000 when app.consent_pepper is missing or shorter than 32 characters,
--       so the account deletion stops and retries instead of storing reversible
--       hashes. consent_pepper_ready() (service role) says whether it is set,
--       without revealing it. The founder sets the pepper in FT-10 (APPLY.md
--       step 6) before any deletion runs. ops_deletion_sla() (from
--       20261004200000) gains consent_pepper_missing so the purge worker alerts
--       with the cause (pepper_missing) instead of a generic retry.
-- G-13  peek_invite(p_token) for "ask before joining" (review H2; BL-322 app part
--       by S04): before accepting, returns {"inviter": <the inviter's sign-off
--       name for that book, or null>, "role": "parent" | "contributor"}, plus
--       "joined": true when the caller already accepted this invite. Never the
--       child's name, ids or any book data (PRD V2 08 section 9, S02 row: "only
--       the inviter's sign-off name before consent"). Signed-in only, works
--       before consent, same errors as accept_child_invite (SCINV, SCCAP),
--       counts in the membership bucket. A family (contributor) invite is
--       SCINV with detail role_disabled while app.contributors_enabled is off,
--       the same answer accept gives from 20261015020000 (F11-REQ-003, D4).
--
-- New SQLSTATEs: none (55000 for the pepper is a standard code, service paths only).
-- Reused: SCRAT, SCINV, SCCAP, SCANO.

-- ─── 1. G-12: the consent pepper fails closed ────────────────────────────
-- From 20261002020000. The hash input is unchanged (id || pepper as set), so
-- hashes stay comparable with any made before.
create or replace function public.policy_acceptances_pseudonymise()
returns trigger language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_pepper text := coalesce(current_setting('app.consent_pepper', true), '');
begin
  if not exists (select 1 from policy_acceptances where profile_id = old.id) then
    return old;
  end if;
  if char_length(btrim(v_pepper)) < 32 then
    raise exception 'app.consent_pepper is missing or shorter than 32 characters; set it before deleting accounts (supabase/APPLY.md step 6)'
      using errcode = '55000',
            hint = 'alter database postgres set app.consent_pepper = ''<openssl rand -hex 32>''; then retry the deletion';
  end if;
  update policy_acceptances
     set subject_hash = sha256(convert_to(old.id::text || v_pepper, 'UTF8')),
         pseudonymised_at = now(),
         profile_id = null
   where profile_id = old.id;
  return old;
end;
$$;

-- Service role (APPLY.md checks, ops health): true when the pepper is usable. Never returns it.
create or replace function public.consent_pepper_ready()
returns boolean language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select char_length(btrim(coalesce(current_setting('app.consent_pepper', true), ''))) >= 32;
$$;

-- The alert path for the fail-closed pepper. Deleting the sign-in user goes through
-- Supabase Auth, which reports the trigger's 55000 as a generic database error, so
-- the worker could only say "step retrying". The SLA report now names the cause:
-- consent_pepper_missing is 1 while the pepper is not usable and an account
-- deletion is waiting or running (the purge worker's pepper_missing alert).
-- From 20261004200000 plus that one key.
create or replace function public.ops_deletion_sla(p_now timestamptz default now())
returns jsonb language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select jsonb_build_object(
    'tombstones_overdue',
      (select count(*) from entries e where e.deleted_at < p_now - interval '31 days' and not public.entry_is_held(e.id))
      + (select count(*) from children c where c.deleted_at < p_now - interval '31 days' and not public.is_held('child', c.id)),
    'requests_executing_over_24h',
      (select count(*) from deletion_requests where status = 'executing' and executing_at < p_now - interval '24 hours'),
    'requests_executing_over_7d',
      (select count(*) from deletion_requests where status = 'executing' and executing_at < p_now - interval '7 days'),
    'steps_failed',
      (select count(*) from deletion_request_steps s join deletion_requests d on d.id = s.request_id
        where s.status = 'failed' and d.status in ('scheduled', 'held', 'executing')),
    'steps_retrying',
      (select count(*) from deletion_request_steps s join deletion_requests d on d.id = s.request_id
        where s.status = 'pending' and s.attempts >= 5 and d.status in ('scheduled', 'held', 'executing')),
    'queue_stuck',
      (select count(*) from storage_purge_queue where done_at is null and enqueued_at < p_now - interval '24 hours'),
    'queue_attempts_high',
      (select count(*) from storage_purge_queue where done_at is null and attempts >= 10),
    'scheduled_overdue',
      (select count(*) from deletion_requests where status = 'scheduled' and scheduled_for < p_now - interval '1 day'),
    'holds_past_review',
      (select count(*) from legal_holds where released_at is null and review_by < p_now::date),
    'purge_run_age_minutes',
      (select floor(extract(epoch from p_now - max(at)) / 60)::int from audit_events where action = 'purge_run'),
    'consent_pepper_missing',
      (case when not public.consent_pepper_ready()
                 and exists (select 1 from deletion_requests
                              where kind = 'account' and status in ('scheduled', 'held', 'executing'))
            then 1 else 0 end));
$$;

-- ─── 2. G-13: look at an invite before joining ───────────────────────────
-- Server config read at call time (F11 D4, F11-REQ-003): family invites are off
-- unless the setting says on. Used here and by every invite function in
-- 20261015020000. Turn on with: alter database postgres set app.contributors_enabled = 'on';
create or replace function public.contributors_enabled()
returns boolean language sql stable set search_path = pg_catalog, public, pg_temp as $$
  select lower(coalesce(nullif(btrim(current_setting('app.contributors_enabled', true)), ''), 'off')) in ('on', 'true', '1');
$$;

-- Same checks, in the same order, as accept_child_invite (20261005000000), but
-- nothing is written except the rate counter, and no consent is needed: the
-- person decides whether to join before agreeing to anything. A call that ends
-- in an error rolls its counter hit back with it (Postgres has no autonomous
-- writes); a token has 244 random bits, so guessing is not the risk this limits.
create or replace function public.peek_invite(p_token text)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_uid uuid := public.require_user();
  v_inv child_invites%rowtype;
  v_name text;
  v_joined boolean := false;
begin
  perform public.rate_hit('membership');
  select * into v_inv from child_invites where token_hash = sha256(convert_to(coalesce(p_token, ''), 'UTF8'));
  if not found then raise exception 'invite not found' using errcode = 'SCINV'; end if;
  if v_inv.accepted_by = v_uid then
    v_joined := true;
  else
    if v_inv.accepted_at is not null then raise exception 'invite already used' using errcode = 'SCINV'; end if;
    if v_inv.revoked_at is not null then raise exception 'invite revoked' using errcode = 'SCINV'; end if;
    if v_inv.expires_at < now() then raise exception 'invite expired' using errcode = 'SCINV'; end if;
    if not public.child_is_live(v_inv.child_id) then raise exception 'invite not found' using errcode = 'SCINV'; end if;
    if exists (select 1 from child_members where child_id = v_inv.child_id and profile_id = v_uid) then
      raise exception 'already a member of this book' using errcode = 'SCINV';
    end if;
    if v_inv.role = 'contributor' and not public.contributors_enabled() then
      raise exception 'family invites are not available in this version' using errcode = 'SCINV', detail = 'role_disabled';
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
  end if;
  -- The inviter's sign-off for this book: their own setting for it, else the
  -- signature they joined with, else their profile default (as sync_pull lists members).
  select coalesce(pp.signs_as,
                  (select i.signs_as from child_invites i
                    where i.child_id = v_inv.child_id and i.accepted_by = v_inv.invited_by
                    order by i.accepted_at desc limit 1),
                  pr.signs_as)
    into v_name
    from profiles pr
    left join child_member_prefs pp on pp.child_id = v_inv.child_id and pp.profile_id = pr.id
   where pr.id = v_inv.invited_by;
  return jsonb_build_object('inviter', v_name, 'role', v_inv.role)
         || case when v_joined then jsonb_build_object('joined', true) else '{}'::jsonb end;
end;
$$;

-- ─── 3. Privileges ───────────────────────────────────────────────────────
revoke execute on function public.consent_pepper_ready() from public, anon, authenticated;
revoke execute on function public.contributors_enabled() from public, anon, authenticated;
revoke execute on function public.policy_acceptances_pseudonymise() from public, anon, authenticated;
revoke execute on function public.peek_invite(text) from public, anon;
grant execute on function public.peek_invite(text) to authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.consent_pepper_ready() to service_role';
  end if;
end;
$$;
