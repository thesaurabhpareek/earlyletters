-- BL-577, the server half (PRIV-R21, docs/engineering/07-privacy-engineering.md): a consent
-- record says which build drew the screen, which major OS it ran on, which words were shown and
-- in which language.
--
-- PENDING: not yet applied. Apply after 20261028010000_invite_redeem_by_code.sql, following
-- supabase/APPLY.md (section "File 29"). Never edits an earlier file. Refuses a second run (55000).
-- Fenced, cco_review tier (CR-27, compliance/FENCE.json): it names the consent record table and its RPC.
--
-- ROLLBACK (only before any row carries the new columns; they are part of a legal record):
--   drop trigger policy_acceptances_sheet_fields on public.policy_acceptances;
--   drop function public.policy_acceptances_sheet_fields();
--   then re-run the record_policy_act and policy_acceptances_guard definitions from
--   20261005000000 and 20261002020000, and drop the two columns.
--
-- What changes:
--   1. Two new columns on policy_acceptances, both L2 (PRIV-R21 table):
--        app_build  the EAS build number (iOS CFBundleVersion, Android versionCode), digits and
--                   at most two dots, 32 characters at most. app_version stays the marketing
--                   version, so build 1 and build 2 of "1.0.0" can be told apart.
--        os_major   the major OS version only (for example 17), 1 to 999. Never the minor, the
--                   device model or anything else that narrows a person down.
--      locale now means the language of the text shown, not the phone's setting (comment below).
--   2. record_policy_act takes p_app_build and p_os_major, appended with defaults null. The old
--      11-argument function is dropped first and the new one created in its place, so PostgREST
--      never sees two candidates for the same named arguments (PGRST203). Every call today's app
--      makes (named arguments, apps/mobile/src/lib/auth/consent.ts) still resolves and records.
--      The idempotency fingerprint is unchanged for a call without the new fields, so a retry
--      made across the deploy still replays.
--   3. Sheet methods (signin_sheet, consent_sheet, reconsent_sheet) need rendered_sha256 and
--      locale (23502), enforced by a BEFORE INSERT trigger on the table, for every writer:
--        - always, when the row carries app_build (the shared record builder, BL-577's app half,
--          sends it; a builder-era client cannot leave the hash or the language out);
--        - for every row, once the database setting app.consent_fields_required is 'on'
--          (APPLY.md file 29). Off until no build without the builder is in use; then the
--          founder turns it on and an old build's sheet act is refused instead of recorded thin.
--      Why a trigger and not a CHECK ... NOT VALID: NOT VALID skips only the existing rows at
--      creation. Postgres checks the constraint on every new row version, including the UPDATE
--      that pseudonymises a row at account deletion (policy_acceptances_pseudonymise), so every
--      build 1 sheet row with no hash would make its owner's account deletion fail. The
--      constraint could also never be validated while those rows are kept (3 years after
--      deletion), and a CHECK cannot read the setting that lets old builds through until they
--      are retired. An INSERT-only trigger binds new rows only and leaves pseudonymisation alone.
--   4. policy_acceptances_guard (from 20261002020000) also freezes app_build and os_major: the
--      pseudonymisation step may change only profile_id, subject_hash and pseudonymised_at.
--
-- Grants: record_policy_act executable by authenticated only, as before (its owner-defined
-- revoke from PUBLIC, anon and service_role is repeated because the function is new). The trigger
-- function is executable by nobody but the owner. No table grant changes (grants.mjs unchanged).
-- New SQLSTATEs: none (23502 and 23514 are Postgres's own). Tests:
-- supabase/tests/consent_record_fields.test.mjs. Fictional family "Asha" only (CLAUDE.md).

-- --- 0. Run once -----------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_attribute
              where attrelid = 'public.policy_acceptances'::regclass and attname = 'app_build' and not attisdropped) then
    raise exception '20261108000000 is already applied (policy_acceptances.app_build exists); do not run it again' using errcode = '55000';
  end if;
end;
$$;

-- --- 1. Columns -------------------------------------------------------------
alter table public.policy_acceptances
  add column app_build text check (char_length(app_build) <= 32 and app_build ~ '^[0-9]{1,10}(\.[0-9]{1,10}){0,2}$'),
  add column os_major smallint check (os_major between 1 and 999);
comment on column public.policy_acceptances.app_build is 'L2 EAS build number that drew the screen (PRIV-R21, BL-577)';
comment on column public.policy_acceptances.os_major is 'L2 major OS version only, for example 17 (PRIV-R21, BL-577)';
comment on column public.policy_acceptances.locale is 'L3 language of the text shown, not the phone setting (PRIV-R21, BL-577)';

-- --- 2. Sheet acts carry the words and the language -------------------------
create or replace function public.policy_acceptances_sheet_fields()
returns trigger language plpgsql set search_path = pg_catalog, public, pg_temp as $$
begin
  if new.method in ('signin_sheet', 'consent_sheet', 'reconsent_sheet')
     and (new.rendered_sha256 is null or new.locale is null)
     and (new.app_build is not null
          or current_setting('app.consent_fields_required', true) is not distinct from 'on') then
    raise exception 'a sheet act needs rendered_sha256 and locale (PRIV-R21)' using errcode = '23502';
  end if;
  return new;
end;
$$;
revoke execute on function public.policy_acceptances_sheet_fields() from public;
create trigger policy_acceptances_sheet_fields before insert on public.policy_acceptances
  for each row execute function public.policy_acceptances_sheet_fields();

-- --- 3. The row guard freezes the new columns too --------------------------
-- Redefined from 20261002020000; the change (20261108000000) adds app_build and os_major to the
-- columns the pseudonymisation step must leave unchanged, and pins pg_temp last (pg_temp_search_path.test.mjs).
create or replace function public.policy_acceptances_guard()
returns trigger language plpgsql set search_path = pg_catalog, public, pg_temp as $$
begin
  if tg_op = 'DELETE' then
    if current_setting('app.retention_purge', true) is distinct from 'on' then
      raise exception 'policy_acceptances rows are append-only';
    end if;
    return old;
  end if;
  if new.profile_id is null and old.profile_id is not null and new.subject_hash is not null
     and (new.id, new.document, new.version, new.action, new.method, new.surface, new.accepted_at,
          new.client_recorded_at, new.app_version, new.platform, new.locale, new.rendered_sha256, new.context,
          new.app_build, new.os_major)
         is not distinct from
         (old.id, old.document, old.version, old.action, old.method, old.surface, old.accepted_at,
          old.client_recorded_at, old.app_version, old.platform, old.locale, old.rendered_sha256, old.context,
          old.app_build, old.os_major) then
    return new;
  end if;
  raise exception 'policy_acceptances rows are append-only';
end;
$$;

-- --- 4. record_policy_act ---------------------------------------------------
-- Redefined from 20261005000000; the changes (20261108000000): p_app_build and p_os_major, stored
-- as given (the table checks their form, 23514), and in the idempotency fingerprint only when
-- given; search_path pg_catalog, public, pg_temp. Everything else is unchanged.
drop function public.record_policy_act(text, text, text, text, text, text, text, text, timestamptz, bytea, jsonb);
create function public.record_policy_act(
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
  p_context jsonb default '{}'::jsonb,
  p_app_build text default null,
  p_os_major integer default null
) returns uuid language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_ver policy_versions%rowtype; v_id uuid; v_ctx jsonb := coalesce(p_context, '{}'::jsonb); v_replay jsonb;
        v_fingerprint jsonb;
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
  v_fingerprint := jsonb_build_array(p_document, p_version, p_action, p_method, p_surface, p_app_version, p_platform, p_locale,
                                     encode(p_rendered_sha256, 'hex'), v_ctx);
  if p_app_build is not null or p_os_major is not null then
    v_fingerprint := v_fingerprint || jsonb_build_array(p_app_build, p_os_major);
  end if;
  v_replay := public.idempotency_claim(auth.uid(), 'record_policy_act', v_fingerprint);
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
                                  client_recorded_at, app_version, platform, locale, rendered_sha256, context,
                                  app_build, os_major)
  values (auth.uid(), p_document, p_version, p_action, p_method, p_surface,
          p_client_recorded_at, p_app_version, p_platform, p_locale, p_rendered_sha256, v_ctx,
          p_app_build, p_os_major)
  returning id into v_id;
  perform public.idempotency_store(auth.uid(), 'record_policy_act', jsonb_build_object('id', v_id));
  return v_id;
end;
$$;
revoke execute on function public.record_policy_act(text, text, text, text, text, text, text, text, timestamptz, bytea, jsonb, text, integer) from public, anon;
grant execute on function public.record_policy_act(text, text, text, text, text, text, text, text, timestamptz, bytea, jsonb, text, integer) to authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'revoke execute on function public.record_policy_act(text, text, text, text, text, text, text, text, timestamptz, bytea, jsonb, text, integer) from service_role';
    execute 'revoke execute on function public.policy_acceptances_sheet_fields() from anon, authenticated, service_role';
  end if;
end;
$$;
