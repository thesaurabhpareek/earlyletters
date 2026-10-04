-- Plus is Apple only and checked on the device: no server entitlement state.
-- Founder decision 3 (docs/agents/BRIEF-2026-10-03.md, 3 Oct 2026) and
-- docs/adr/0013-apple-native-subscriptions.md as decided.
--
-- PENDING: not yet applied. Apply after 20261003020000_purge_batching.sql
-- (it replaces functions created in 20261003010000 and 20261003020000).
--
-- What this removes
--  * The App Store entitlement ledger added on 3 Oct: tables store_subscriptions,
--    store_notifications and app_account_tokens; functions apply_store_transaction,
--    my_app_account_token, get_plan_state, has_plus, book_has_plus and their
--    helper store_environment_allowed. No server of ours sees purchases: there
--    is no App Store Server Notifications endpoint and no appAccountToken.
--  * The server Plus rule on new books (SQLSTATE SCPLS). create_child and
--    create_first_run_children never refuse a book for Plus. The device decides
--    with packages/core/src/plan.ts from StoreKit 2 Transaction.currentEntitlements.
--
-- What stays
--  * create_child(p_id, p_name, p_date_of_birth, p_due_date): device UUIDv7,
--    idempotent retry, a birthday or a due date, consent gate (SCCID, SCDEL,
--    SCCON, 22023 unchanged).
--  * create_first_run_children(p_children): the one-time first-run batch (1 to 6
--    children, all or nothing, replay-safe) still closes profiles.first_run_closed_at,
--    which sync_books() reports as first_run_open.
--
-- Trade-off (recorded in ADR 0013): Plus is enforced on the device only. A
-- modified client can start more books or more Read together sessions. Every
-- Plus feature in v1.0 runs on the phone and costs nothing on the server (no
-- audio upload in v1.0, brief decision 9), so there is nothing server-side to
-- protect. When a server-cost Plus feature ships (backup upload), its endpoint
-- will need its own proof; see ADR 0013 "Revisit when".
--
-- New SQLSTATEs: none. Retired: SCPLS (clients must keep tolerating it from an
-- older server until every environment has this migration).

-- ─── 1. create_child without the Plus rule ──────────────────────────────
-- The shared body loses p_free: nothing is gated on the server any more.
create or replace function public.create_child_row(p_uid uuid, p_id uuid, p_name text, p_date_of_birth date,
                                                   p_due_date date)
returns uuid language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_creator uuid; v_found boolean;
begin
  if not public.is_valid_client_uuid7(p_id) then
    raise exception 'child id must be a UUIDv7 made on the device' using errcode = 'SCCID';
  end if;
  select created_by, true into v_creator, v_found from children where id = p_id;
  if v_found then
    -- Retry of the same create (lost response, re-sync): idempotent.
    if v_creator = p_uid then return p_id; end if;
    raise exception 'child id already in use' using errcode = 'SCCID';
  end if;
  if exists (select 1 from purge_ledger where entity_type = 'child' and entity_id = p_id::text) then
    raise exception 'this book was deleted' using errcode = 'SCDEL';
  end if;
  if p_name is null or char_length(btrim(p_name)) not between 1 and 60 then
    raise exception 'name must be 1 to 60 characters' using errcode = '22023';
  end if;
  if p_date_of_birth is null and p_due_date is null then
    raise exception 'a birthday or a due date is needed' using errcode = '22023';
  end if;
  if p_date_of_birth > current_date + 1 or p_date_of_birth < date '1900-01-01'
     or p_due_date > current_date + 310 or p_due_date < current_date - 400 then
    raise exception 'date out of range' using errcode = '22023';
  end if;
  insert into children (id, name, date_of_birth, due_date, created_by)
    values (p_id, btrim(p_name), p_date_of_birth, p_due_date, p_uid);
  insert into child_members (child_id, profile_id, role) values (p_id, p_uid, 'parent');
  update profiles set first_run_closed_at = coalesce(first_run_closed_at, now()) where id = p_uid;
  return p_id;
end;
$$;

create or replace function public.create_child(p_id uuid, p_name text, p_date_of_birth date default null,
                                               p_due_date date default null)
returns uuid language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_uid uuid := public.require_user();
begin
  -- One person's creates stay serialised (a retry racing the first call returns the same id).
  perform 1 from profiles where id = v_uid for update;
  if not exists (select 1 from children where id = p_id and created_by = v_uid) then
    perform public.require_content_consent();
  end if;
  return public.create_child_row(v_uid, p_id, p_name, p_date_of_birth, p_due_date);
end;
$$;

-- p_children: [{"id": uuidv7, "name": text, "date_of_birth": date|null, "due_date": date|null}], 1 to 6.
-- The first-run batch: the call closes profiles.first_run_closed_at. A retry of the
-- same batch returns the same ids; a batch is all or nothing.
create or replace function public.create_first_run_children(p_children jsonb)
returns uuid[] language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  v_uid uuid := public.require_user();
  v_ids uuid[] := '{}';
  r record;
begin
  if jsonb_typeof(p_children) is distinct from 'array'
     or jsonb_array_length(p_children) not between 1 and 6 then
    raise exception 'first run takes 1 to 6 children' using errcode = '22023';
  end if;
  perform 1 from profiles where id = v_uid for update;
  perform public.require_content_consent();
  for r in select * from jsonb_to_recordset(p_children) as x(id uuid, name text, date_of_birth date, due_date date)
  loop
    v_ids := v_ids || public.create_child_row(v_uid, r.id, r.name, r.date_of_birth, r.due_date);
  end loop;
  update profiles set first_run_closed_at = coalesce(first_run_closed_at, now()) where id = v_uid;
  return v_ids;
end;
$$;

drop function if exists public.create_child_row(uuid, uuid, text, date, date, boolean);

-- ─── 2. Server entitlement state, removed ───────────────────────────────
drop function if exists public.apply_store_transaction(uuid, text, text, timestamptz, text, text, uuid, text, text,
  timestamptz, timestamptz, boolean, timestamptz, text);
drop function if exists public.my_app_account_token();
drop function if exists public.get_plan_state();
drop function if exists public.book_has_plus(uuid);
drop function if exists public.has_plus(uuid);
drop function if exists public.store_environment_allowed(text);

drop table if exists public.store_notifications;
drop table if exists public.store_subscriptions;
drop table if exists public.app_account_tokens;

-- ─── 3. Purge without the notification ledger ───────────────────────────
-- Same as 20261003020000_purge_batching.sql, minus the 7-year store_notifications purge.
create or replace function public.purge_due(p_now timestamptz default now(), p_limit int default 500)
returns jsonb language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  r record;
  v_children int := 0;
  v_entries int := 0;
  v_accounts int := 0;
  v_cutoff timestamptz := p_now - interval '30 days';
  v_limit int := greatest(coalesce(p_limit, 500), 1);
begin
  -- 1. Books tombstoned for 30 days.
  for r in
    select c.id from children c
    where c.deleted_at is not null and c.deleted_at < v_cutoff
      and not public.is_held('child', c.id)
      and not exists (select 1 from entries e where e.child_id = c.id
                      and (public.is_held('entry', e.id) or public.is_held('profile', e.author_id)))
    order by c.deleted_at
    limit v_limit
    for update skip locked
  loop
    perform public.enqueue_storage_purge('entry-photos', r.id::text || '/', true, 'child_purge');
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
    order by e.deleted_at
    limit v_limit
    for update skip locked
  loop
    if r.photo_path is not null then
      perform public.enqueue_storage_purge('entry-photos', r.photo_path, false, 'entry_purge');
    end if;
    insert into purge_ledger (entity_type, entity_id) values ('entry', r.id::text) on conflict do nothing;
    delete from entries where id = r.id;    -- cascades entry_versions
    v_entries := v_entries + 1;
  end loop;

  -- 3. Account requests that are due: hand to the deletion worker, unless held.
  update deletion_requests d
    set status = case when public.is_held('profile', d.profile_id) then 'held' else 'executing' end,
        executing_at = p_now
    where d.id in (select x.id from deletion_requests x
                    where x.kind = 'account' and x.status = 'scheduled' and x.scheduled_for <= p_now
                    order by x.scheduled_for limit v_limit for update skip locked);
  get diagnostics v_accounts = row_count;
  update deletion_requests d set status = 'executing', executing_at = p_now
    where d.status = 'held' and d.kind = 'account' and not public.is_held('profile', d.profile_id)
      and d.scheduled_for <= p_now;

  -- 4. Short-lived records (privacy-policy section 10; DATA-REQ-060, 064, 066).
  delete from child_invites where coalesce(revoked_at, accepted_at, expires_at) < p_now - interval '90 days';
  delete from audit_events where at < p_now - interval '24 months';
  delete from deletion_requests where status in ('completed', 'cancelled')
    and coalesce(completed_at, cancelled_at) < p_now - interval '3 years';
  perform set_config('app.retention_purge', 'on', true);
  delete from policy_acceptances where pseudonymised_at < p_now - interval '3 years';
  perform set_config('app.retention_purge', 'off', true);

  -- 5. Housekeeping.
  delete from purge_ledger where purged_at < p_now - interval '60 days';
  delete from storage_purge_queue where done_at is not null and done_at < p_now - interval '7 days';

  perform public.audit('purge_run', 'system', null, null,
    jsonb_build_object('books', v_children, 'entries', v_entries, 'accounts_due', v_accounts));
  return jsonb_build_object('books', v_children, 'entries', v_entries, 'accounts_due', v_accounts,
                            'more', v_children >= v_limit or v_entries >= v_limit or v_accounts >= v_limit);
end;
$$;

-- ─── 4. Privileges ───────────────────────────────────────────────────────
revoke execute on function public.create_child_row(uuid, uuid, text, date, date) from public, anon, authenticated;
revoke execute on function public.purge_due(timestamptz, int) from public, anon, authenticated;
revoke execute on function public.create_child(uuid, text, date, date) from public, anon;
revoke execute on function public.create_first_run_children(jsonb) from public, anon;
grant execute on function public.create_child(uuid, text, date, date) to authenticated;
grant execute on function public.create_first_run_children(jsonb) to authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.purge_due(timestamptz, int) to service_role';
  end if;
end;
$$;
