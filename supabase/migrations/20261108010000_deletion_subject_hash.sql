-- BL-578 (DATA-05; PRIV-R21 retention): a completed account deletion keeps the person's peppered
-- subject_hash on its deletion_requests row, so the request id in the receipt email still leads to
-- that person's pseudonymised consent rows for the 3 years they are kept. Before this file
-- finalize_account_deletion nulled profile_id and kept no hash; the only link was the raw id in
-- purge_ledger, trimmed after 60 days (purge_due step 5), so from day 61 the request id found nothing.
--
-- PENDING: not yet applied. Apply after 20261108000000 (or after 20261028010000 if that one is not
-- merged yet; the two touch different objects), following supabase/APPLY.md (section "File 30").
-- Never edits an earlier file. Refuses a second run (55000).
-- Fenced, cco_review tier (CR-27, compliance/FENCE.json): it reads the consent record table.
--
-- ROLLBACK: drop function public.ops_deletion_consent_records(uuid);
--           drop index public.policy_acceptances_subject_idx;
--           re-run finalize_account_deletion from 20261003020000;
--           alter table public.deletion_requests drop column subject_hash;
--           (the request ids of deletions completed meanwhile then find nothing after day 60 again)
--
-- What changes:
--   1. deletion_requests.subject_hash (L3, 32 bytes): sha256(profile id || app.consent_pepper), the
--      same input and pepper as policy_acceptances_pseudonymise (20261015010000) and
--      subscription_consents_pseudonymise (20261016001000), so one value matches the person's rows
--      in both consent tables. Set by finalize_account_deletion on the request it completes and on
--      the person's earlier completed or cancelled requests, at the moment profile_id is nulled.
--      Kept with the row: purge_due deletes completed requests after 3 years, the same span as
--      the consent rows, so the link lasts exactly as long as what it leads to.
--   2. finalize_account_deletion (redefined from 20261003020000) fails closed (55000, nothing
--      changed) when the pepper is missing or shorter than 32 characters, like the pseudonymise
--      triggers: an empty pepper would make the hash guessable from the account id. Otherwise
--      unchanged; search_path is now pg_catalog, public, pg_temp.
--   3. public.ops_deletion_consent_records(p_request uuid) returns jsonb, service_role only: the
--      request's kind, status and dates, and the person's rows in policy_acceptances and
--      subscription_consents (without profile_id and subject_hash), matched by subject_hash after
--      completion or by profile_id before it. An unknown id or a book request is P0002. The caller
--      (an ops runbook) writes its own ops.audit_log row through ops_audit_write, as the other ops
--      reads do.
--   4. An index on policy_acceptances (subject_hash) for pseudonymised rows, for that lookup
--      (a rare ops read; the table only grows, 3 years of rows after each deletion).
--
-- Grants: the new function is executable by service_role only (grants.mjs SERVICE_ROLE_FUNCTIONS).
-- No table grant changes. New SQLSTATEs: none. Tests: supabase/tests/deletion_subject_hash.test.mjs.
-- Fictional family "Asha" only (CLAUDE.md).

-- --- 0. Run once -----------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_attribute
              where attrelid = 'public.deletion_requests'::regclass and attname = 'subject_hash' and not attisdropped) then
    raise exception '20261108010000 is already applied (deletion_requests.subject_hash exists); do not run it again' using errcode = '55000';
  end if;
end;
$$;

-- --- 1. The column and the index -------------------------------------------
alter table public.deletion_requests add column subject_hash bytea check (octet_length(subject_hash) = 32);
comment on column public.deletion_requests.subject_hash is
  'L3 pseudonymised person id (peppered SHA-256, same as policy_acceptances), set at completion (BL-578)';
create index policy_acceptances_subject_idx on public.policy_acceptances (subject_hash) where subject_hash is not null;

-- --- 2. finalize_account_deletion keeps the hash -----------------------------
create or replace function public.finalize_account_deletion(p_request uuid, p_receipt jsonb)
returns void language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_uid uuid;
  v_pepper text := coalesce(current_setting('app.consent_pepper', true), '');
  v_hash bytea;
begin
  select profile_id into v_uid from deletion_requests where id = p_request and kind = 'account' and status = 'executing' for update;
  if not found then raise exception 'request not executing' using errcode = 'SCDEL'; end if;
  if exists (select 1 from profiles where id = v_uid) then
    raise exception 'auth user still exists' using errcode = 'SCDEL';
  end if;
  -- 20261108010000: the request keeps the same peppered hash as the consent rows (BL-578).
  if char_length(btrim(v_pepper)) < 32 then
    raise exception 'app.consent_pepper is missing or shorter than 32 characters; set it before finishing deletions (supabase/APPLY.md step 6)'
      using errcode = '55000';
  end if;
  v_hash := case when v_uid is null then null else sha256(convert_to(v_uid::text || v_pepper, 'UTF8')) end;
  insert into purge_ledger (entity_type, entity_id) values ('profile', v_uid::text) on conflict do nothing;
  update audit_events set actor_id = null where actor_id = v_uid;
  update audit_events set subject_id = null where subject_id = v_uid and subject_type in ('profile', 'membership');
  update entry_versions set superseded_by = null where superseded_by = v_uid;
  update entries set reviewed_by = null where reviewed_by = v_uid;
  update deletion_requests set profile_id = null, subject_hash = v_hash
    where profile_id = v_uid and status in ('completed', 'cancelled');
  update deletion_requests
    set status = 'completed', completed_at = now(), profile_id = null, subject_hash = coalesce(v_hash, subject_hash),
        receipt = coalesce(p_receipt, '{}'::jsonb)
    where id = p_request;
  insert into audit_events (actor_id, actor_kind, action, subject_type, subject_id)
    values (null, 'system', 'account_deletion_completed', 'deletion_request', p_request);
end;
$$;
revoke execute on function public.finalize_account_deletion(uuid, jsonb) from public, anon, authenticated;

-- --- 3. The lookup by request id ---------------------------------------------
create or replace function public.ops_deletion_consent_records(p_request uuid)
returns jsonb language plpgsql stable security definer set search_path = pg_catalog, public, pg_temp as $$
declare r deletion_requests%rowtype;
begin
  select * into r from deletion_requests where id = p_request and kind = 'account';
  if not found then
    raise exception 'no account deletion request with that id' using errcode = 'P0002';
  end if;
  return jsonb_build_object(
    'request_id', r.id, 'status', r.status, 'requested_at', r.requested_at, 'completed_at', r.completed_at,
    'pseudonymised', r.subject_hash is not null,
    'policy_acceptances', coalesce((
      select jsonb_agg(to_jsonb(a) - 'profile_id' - 'subject_hash' order by a.accepted_at, a.id)
        from policy_acceptances a
       where (r.subject_hash is not null and a.subject_hash = r.subject_hash)
          or (r.profile_id is not null and a.profile_id = r.profile_id)), '[]'::jsonb),
    'subscription_consents', coalesce((
      select jsonb_agg(to_jsonb(s) - 'profile_id' - 'subject_hash' order by s.id)
        from subscription_consents s
       where (r.subject_hash is not null and s.subject_hash = r.subject_hash)
          or (r.profile_id is not null and s.profile_id = r.profile_id)), '[]'::jsonb));
end;
$$;
revoke execute on function public.ops_deletion_consent_records(uuid) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.ops_deletion_consent_records(uuid) to service_role';
    execute 'grant execute on function public.finalize_account_deletion(uuid, jsonb) to service_role';
  end if;
end;
$$;
