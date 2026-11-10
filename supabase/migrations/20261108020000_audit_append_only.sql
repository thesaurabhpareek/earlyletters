-- BL-585 (DATA-06): the audit and consent tables refuse rewrites and truncation. Before this file
-- audit_events had no row guard at all (20261002020000_data_governance.sql:310), and
-- policy_acceptances and ops.audit_log had no BEFORE TRUNCATE trigger, unlike subscription_consents
-- (20261016001000_subscription_status.sql:474) and escrow_unwraps. TRUNCATE fires no row trigger,
-- so a row guard alone never stopped it; and every API role already lacks the privilege
-- (20261023050000, 20261023060000), so what these guards add is protection from the owner's own
-- paths: a migration, a SECURITY DEFINER function, or the SQL Editor.
--
-- PENDING: not yet applied. Apply after 20261108010000 (or after 20261028010000 if the files
-- between are not merged yet; they touch different objects), following supabase/APPLY.md (section
-- "File 31"). Never edits an earlier file. Refuses a second run (55000).
-- Fenced, cco_review tier (CR-27, compliance/FENCE.json): it adds a trigger to the consent record table.
--
-- ROLLBACK: drop trigger audit_events_guard on public.audit_events;
--           drop trigger audit_events_no_truncate on public.audit_events;
--           drop trigger policy_acceptances_no_truncate on public.policy_acceptances;
--           drop trigger audit_log_no_truncate on ops.audit_log;
--           drop function public.audit_events_guard(), public.audit_events_no_truncate(),
--             public.policy_acceptances_no_truncate(), ops.audit_log_no_truncate();
--           re-run purge_due from 20261023020000.
--
-- What changes:
--   1. audit_events rows are append-only (SCIMM), with the two documented exceptions:
--        UPDATE  only finalize_account_deletion's pseudonymisation: actor_id set to null, or
--                subject_id set to null on a 'profile' or 'membership' row, every other column
--                unchanged (finalize_account_deletion, 20261003020000:167-168).
--        DELETE  only while app.retention_purge is on: purge_due's 24-month retention.
--   2. purge_due (redefined from 20261023020000; the one change is marked "20261108020000") turns
--      app.retention_purge on before its audit_events delete instead of after it. The same
--      transaction-local setting already covers policy_acceptances, so nothing else is let through.
--   3. TRUNCATE is refused (SCIMM) on audit_events, policy_acceptances and ops.audit_log, for
--      every role including the owner, as on subscription_consents.
-- ops.audit_log's row guard (20261004200000) already refuses UPDATE and any DELETE outside
-- ops_retention; it is unchanged.
--
-- Grants: the four trigger functions are executable by no API role (revoked from PUBLIC and the
-- three roles). purge_due keeps its grant to service_role. No table grant changes.
-- New SQLSTATEs: none (SCIMM is in use since 20261004200000). Tests:
-- supabase/tests/audit_append_only.test.mjs. Fictional family "Asha" only (CLAUDE.md).

-- --- 0. Run once -----------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_trigger where tgname = 'audit_events_guard' and tgrelid = 'public.audit_events'::regclass) then
    raise exception '20261108020000 is already applied (audit_events_guard exists); do not run it again' using errcode = '55000';
  end if;
end;
$$;

-- --- 1. audit_events rows ----------------------------------------------------
create or replace function public.audit_events_guard()
returns trigger language plpgsql set search_path = pg_catalog, public, pg_temp as $$
begin
  if tg_op = 'DELETE' then
    if current_setting('app.retention_purge', true) is not distinct from 'on' then
      return old;
    end if;
    raise exception 'audit_events rows are append-only' using errcode = 'SCIMM';
  end if;
  -- finalize_account_deletion: the purged person's id leaves the actor or the subject, nothing else.
  if (new.id, new.at, new.actor_kind, new.action, new.subject_type, new.child_id, new.detail)
       is not distinct from (old.id, old.at, old.actor_kind, old.action, old.subject_type, old.child_id, old.detail)
     and (new.actor_id is not distinct from old.actor_id or (new.actor_id is null and old.actor_id is not null))
     and (new.subject_id is not distinct from old.subject_id
          or (new.subject_id is null and old.subject_id is not null and old.subject_type in ('profile', 'membership')))
     and (new.actor_id, new.subject_id) is distinct from (old.actor_id, old.subject_id) then
    return new;
  end if;
  raise exception 'audit_events rows are append-only' using errcode = 'SCIMM';
end;
$$;
create trigger audit_events_guard before update or delete on public.audit_events
  for each row execute function public.audit_events_guard();

-- --- 2. TRUNCATE ------------------------------------------------------------
create or replace function public.audit_events_no_truncate()
returns trigger language plpgsql set search_path = pg_catalog, public, pg_temp as $$
begin
  raise exception 'audit_events rows are append-only' using errcode = 'SCIMM';
end;
$$;
create trigger audit_events_no_truncate before truncate on public.audit_events
  for each statement execute function public.audit_events_no_truncate();

create or replace function public.policy_acceptances_no_truncate()
returns trigger language plpgsql set search_path = pg_catalog, public, pg_temp as $$
begin
  raise exception 'policy_acceptances rows are append-only' using errcode = 'SCIMM';
end;
$$;
create trigger policy_acceptances_no_truncate before truncate on public.policy_acceptances
  for each statement execute function public.policy_acceptances_no_truncate();

create or replace function ops.audit_log_no_truncate()
returns trigger language plpgsql set search_path = pg_catalog, ops, pg_temp as $$
begin
  raise exception 'ops.audit_log is append-only' using errcode = 'SCIMM';
end;
$$;
create trigger audit_log_no_truncate before truncate on ops.audit_log
  for each statement execute function ops.audit_log_no_truncate();

revoke execute on function public.audit_events_guard(), public.audit_events_no_truncate(),
  public.policy_acceptances_no_truncate(), ops.audit_log_no_truncate() from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'revoke execute on function public.audit_events_guard(), public.audit_events_no_truncate(), '
         || 'public.policy_acceptances_no_truncate(), ops.audit_log_no_truncate() from anon, authenticated, service_role';
  end if;
end;
$$;

-- --- 3. purge_due: the retention switch covers the audit delete ---------------
create or replace function public.purge_due(p_now timestamptz default now(), p_limit int default 500)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  r record;
  v_children int := 0;
  v_entries int := 0;
  v_accounts int := 0;
  v_kept int := 0;          -- 20261023010000
  v_removed int := 0;       -- 20261023010000
  v_keep uuid[];            -- 20261023010000
  v_cutoff timestamptz := p_now - interval '30 days';
  v_limit int := greatest(coalesce(p_limit, 500), 1);
begin
  -- 1. Books tombstoned for 30 days.
  for r in
    select c.id from children c
    where c.deleted_at is not null and c.deleted_at < v_cutoff
      and c.purged_at is null                                   -- 20261023010000: not a kept book
      and not public.book_purge_held(c.id)                      -- 20261023020000: every row the purge deletes
    order by c.deleted_at
    limit v_limit
    for update skip locked
  loop
    update deletion_requests set status = 'completed', completed_at = p_now
      where kind = 'book' and child_id = r.id and status in ('scheduled', 'held', 'executing');
    -- 20261023010000: a former member's letters, held drafts and recordings stay theirs.
    v_keep := public.book_kept_authors(r.id);
    if cardinality(v_keep) > 0 then
      perform public.purge_book_keep_authors(r.id, v_keep, 'child_purge', null);
      perform public.audit('book_purged', 'child', r.id, r.id, jsonb_build_object('kept_authors', cardinality(v_keep)));
      v_kept := v_kept + 1;
    else
      perform public.enqueue_storage_purge('entry-photos', r.id::text || '/', true, 'child_purge');
      insert into purge_ledger (entity_type, entity_id)
        select 'entry', e.id::text from entries e where e.child_id = r.id on conflict do nothing;
      insert into purge_ledger (entity_type, entity_id) values ('child', r.id::text) on conflict do nothing;
      delete from children where id = r.id;   -- cascades members, prefs, invites, entries, versions, terms
      perform public.audit('book_purged', 'child', r.id, r.id);
    end if;
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

  -- 2b. 20261023010000: a kept book goes once no letter, held draft or recording of its kept
  --     authors is left (they erased them, or their account went), as step 1 purges a book.
  for r in
    select c.id from children c
    where c.purged_at is not null
      and not exists (select 1 from entries e where e.child_id = c.id)
      and not exists (select 1 from held_drafts h where h.child_id = c.id)
      and not exists (select 1 from audio_blobs b where b.child_id = c.id)
    order by c.purged_at
    limit v_limit
    for update skip locked
  loop
    -- 20261023020000: the hold check (it was is_held('child') only, in the query) runs here, for a book
    -- this step would remove, not for every kept book that still has letters (review B on #251).
    continue when public.book_purge_held(r.id);
    perform public.enqueue_storage_purge('entry-photos', r.id::text || '/', true, 'child_purge');
    insert into purge_ledger (entity_type, entity_id) values ('child', r.id::text) on conflict do nothing;
    delete from children where id = r.id;   -- cascades the kept authors' book keys, terms, markers and erasure records
    perform public.audit('book_purged', 'child', r.id, r.id, jsonb_build_object('kept_book_emptied', true));
    v_removed := v_removed + 1;
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
  delete from deletion_requests where status in ('completed', 'cancelled')
    and coalesce(completed_at, cancelled_at) < p_now - interval '3 years';
  perform set_config('app.retention_purge', 'on', true);
  delete from audit_events where at < p_now - interval '24 months';   -- 20261108020000: under the switch
  delete from policy_acceptances where pseudonymised_at < p_now - interval '3 years';
  perform set_config('app.retention_purge', 'off', true);

  -- 5. Housekeeping.
  delete from purge_ledger where purged_at < p_now - interval '60 days';
  delete from storage_purge_queue where done_at is not null and done_at < p_now - interval '7 days';

  perform public.audit('purge_run', 'system', null, null,
    jsonb_build_object('books', v_children, 'entries', v_entries, 'accounts_due', v_accounts,
                       'books_kept', v_kept, 'kept_removed', v_removed));
  return jsonb_build_object('books', v_children, 'entries', v_entries, 'accounts_due', v_accounts,
                            'books_kept', v_kept, 'kept_removed', v_removed,
                            'more', v_children >= v_limit or v_entries >= v_limit or v_accounts >= v_limit or v_removed >= v_limit);
end;
$$;
revoke execute on function public.purge_due(timestamptz, int) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.purge_due(timestamptz, int) to service_role';
  end if;
end;
$$;
