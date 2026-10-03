-- Bounded purge runs and retry backoff for the purge worker.
--
-- PENDING: not yet applied. Apply after 20261003010000_children_and_entitlements.sql.
--
-- 8. [TDD 02 C8, C9, C11, C16; TDD 05 X-14; DATA-REQ-006]
--  * purge_due(p_now, p_limit) handles at most p_limit books, p_limit letters and
--    p_limit due account requests per call, and returns "more": true when any
--    category hit the limit, so the cron loops (up to 10 calls) instead of one
--    unbounded transaction after an outage. The cron command `select public.purge_due();`
--    is unchanged.
--  * storage_purge_queue gets next_attempt_at and last_error_code;
--    deletion_request_steps gets next_attempt_at. record_purge_attempt() and
--    record_deletion_step() (service role) apply a 1 minute to 6 hour exponential
--    backoff, so the purge worker never hot-loops on a failing object or vendor.
--  * Re-enqueueing a path whose earlier queue row is done re-arms it instead of
--    silently doing nothing.
--  * Invite hashes are kept 90 days after revocation, use or expiry, whichever
--    came first, instead of always after expiry.
--  * App Store notification ledger rows are kept 7 years (transactions, DATA_CLASSIFICATION 2).
--  * finalize_account_deletion also nulls entries.reviewed_by (new column).
--  * (WS-01, 3 Oct 2026) purge_due keeps entry and book ids in purge_ledger for good
--    (DB-02); service-only state errors use 55000 instead of SCDEL (DB-09); API roles
--    hold no sequence privileges (PDB-02).
-- Letters into deleted books are refused in 20261003000000 (entries_family_rules, SCDEL).

alter table public.storage_purge_queue add column if not exists next_attempt_at timestamptz not null default now();
alter table public.storage_purge_queue add column if not exists last_error_code text check (char_length(last_error_code) <= 40);
alter table public.deletion_request_steps add column if not exists next_attempt_at timestamptz not null default now();
create index if not exists storage_purge_queue_due_idx on public.storage_purge_queue (next_attempt_at) where done_at is null;
create index if not exists deletion_request_steps_due_idx on public.deletion_request_steps (next_attempt_at) where status = 'pending';

-- Enqueue, or re-arm a row that was already done.
create or replace function public.enqueue_storage_purge(p_bucket text, p_path text, p_prefix boolean, p_reason text, p_request uuid default null)
returns void language sql security definer set search_path = pg_catalog, public as $$
  insert into storage_purge_queue (bucket_id, object_path, is_prefix, reason, request_id)
  values (p_bucket, p_path, p_prefix, p_reason, p_request)
  on conflict (bucket_id, object_path) do update
    set done_at = null, attempts = 0, next_attempt_at = now(), last_error_code = null,
        reason = excluded.reason, request_id = coalesce(excluded.request_id, storage_purge_queue.request_id)
    where storage_purge_queue.done_at is not null;
$$;

-- Backoff: 1 min x 2^(attempts - 1), capped at 6 hours.
create or replace function public.purge_backoff(p_attempts int)
returns interval language sql immutable set search_path = pg_catalog, public as $$
  select least(interval '6 hours', interval '1 minute' * power(2, greatest(p_attempts, 1) - 1));
$$;

create or replace function public.record_purge_attempt(p_id bigint, p_ok boolean, p_error_code text default null)
returns void language sql security definer set search_path = pg_catalog, public as $$
  update storage_purge_queue
     set attempts = attempts + 1,
         done_at = case when p_ok then now() end,
         last_error_code = case when p_ok then null else left(p_error_code, 40) end,
         next_attempt_at = case when p_ok then next_attempt_at else now() + public.purge_backoff(attempts + 1) end
   where id = p_id;
$$;

-- p_status: 'done', 'not_applicable', 'failed' (terminal, alerts), or 'pending' (retry with backoff).
create or replace function public.record_deletion_step(p_request uuid, p_step text, p_status text, p_error_code text default null)
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if p_status not in ('done', 'not_applicable', 'failed', 'pending') then
    raise exception 'unknown step status' using errcode = '22023';
  end if;
  update deletion_request_steps
     set status = p_status,
         attempts = attempts + 1,
         last_error_code = case when p_status in ('done', 'not_applicable') then null else left(p_error_code, 40) end,
         next_attempt_at = case when p_status = 'pending' then now() + public.purge_backoff(attempts + 1) else next_attempt_at end,
         updated_at = now()
   where request_id = p_request and step = p_step;
  if not found then raise exception 'step not found' using errcode = 'P0002'; end if;
end;
$$;

drop function if exists public.purge_due(timestamptz);

create or replace function public.purge_due(p_now timestamptz default now(), p_limit int default 500)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
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
  delete from store_notifications where received_at < p_now - interval '7 years';

  -- 5. Housekeeping. Entry and book ids stay in the ledger for good (DB-02: a purged
  --    id must never be re-inserted); only person and object-path rows age out.
  delete from purge_ledger where entity_type in ('profile', 'storage_object') and purged_at < p_now - interval '60 days';
  delete from storage_purge_queue where done_at is not null and done_at < p_now - interval '7 days';

  perform public.audit('purge_run', 'system', null, null,
    jsonb_build_object('books', v_children, 'entries', v_entries, 'accounts_due', v_accounts));
  return jsonb_build_object('books', v_children, 'entries', v_entries, 'accounts_due', v_accounts,
                            'more', v_children >= v_limit or v_entries >= v_limit or v_accounts >= v_limit);
end;
$$;

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
  update entries set reviewed_by = null where reviewed_by = v_uid;
  update deletion_requests set profile_id = null where profile_id = v_uid and status in ('completed', 'cancelled');
  update deletion_requests
    set status = 'completed', completed_at = now(), profile_id = null, receipt = coalesce(p_receipt, '{}'::jsonb)
    where id = p_request;
  insert into audit_events (actor_id, actor_kind, action, subject_type, subject_id)
    values (null, 'system', 'account_deletion_completed', 'deletion_request', p_request);
end;
$$;

revoke execute on function public.enqueue_storage_purge(text, text, boolean, text, uuid) from public, anon, authenticated;
revoke execute on function public.purge_backoff(int) from public, anon, authenticated;
revoke execute on function public.record_purge_attempt(bigint, boolean, text) from public, anon, authenticated;
revoke execute on function public.record_deletion_step(uuid, text, text, text) from public, anon, authenticated;
revoke execute on function public.purge_due(timestamptz, int) from public, anon, authenticated;
revoke execute on function public.finalize_account_deletion(uuid, jsonb) from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.purge_due(timestamptz, int) to service_role';
    execute 'grant execute on function public.record_purge_attempt(bigint, boolean, text) to service_role';
    execute 'grant execute on function public.record_deletion_step(uuid, text, text, text) to service_role';
    execute 'grant execute on function public.finalize_account_deletion(uuid, jsonb) to service_role';
  end if;
end;
$$;

-- PDB-02: the API roles hold no sequence privileges (repeated from 20261002020000
-- so the end state does not depend on which sequences earlier files created).
revoke all on all sequences in schema public from public, anon, authenticated;

comment on column public.storage_purge_queue.next_attempt_at is 'L2 system timestamp (retry backoff)';
comment on column public.storage_purge_queue.last_error_code is 'L2 HTTP status or error class';
comment on column public.deletion_request_steps.next_attempt_at is 'L2 system timestamp (retry backoff)';
