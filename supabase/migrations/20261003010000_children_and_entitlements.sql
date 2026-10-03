-- Children created with device ids, and the letter id and clock checks.
--
-- PENDING: not yet applied. Apply after 20261003000000_security_and_family.sql
-- (it uses require_user(), require_content_consent() and is_anonymous()).
-- The file name keeps "entitlements" so the migration version and history stay
-- stable; it no longer creates any entitlement objects (see below).
--
-- 5. create_child [TDD 02 C4, A-REQ-015, DATA-REQ-044, PRD-REQ-015]:
--    create_child(text, date) is dropped. create_child(p_id, p_name,
--    p_date_of_birth, p_due_date) takes the device's UUIDv7 (version and
--    variant checked, timestamp sane), is idempotent for the same person, and
--    needs a birthday or a due date.
-- 6. Payments (founder decision 3, docs/agents/BRIEF-2026-10-03.md): Apple only,
--    StoreKit 2 on the device (Transaction.currentEntitlements, Family Sharing
--    for the co-parent). No server of ours sees purchases, so this file creates
--    no entitlement tables (app_account_tokens, store_subscriptions,
--    store_notifications were removed before this file was ever applied), no
--    plan RPCs, and the server does not enforce Plus: there is no SCPLS and no
--    first-run free batch.
--
-- New SQLSTATE: SCCID invalid or reused client id (permanent).
-- Review fixes on 3 Oct 2026 (WS-01):
--  * DB-15: letter ids must be device UUIDv7 (SCCID) and captured_at may not be more
--    than a day in the future (22023), checked in entries_before_insert.
--  * DB-02 / DB-09: a purged book id is refused with SCPRG (was SCDEL).

-- ─── 1. Profiles: server-owned columns ──────────────────────────────────
-- profiles_update_self lets a person edit their own row; id and created_at are server-owned.
create or replace function public.profiles_guard()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin
  if current_user in ('authenticated', 'anon')
     and (new.id is distinct from old.id or new.created_at is distinct from old.created_at) then
    raise exception 'profiles: id and created_at are server-owned' using errcode = 'SCIMM';
  end if;
  return new;
end;
$$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.profiles_guard();

-- ─── 2. Children: a birthday or a due date (B-REQ-001) ──────────────────
-- NOT VALID: existing rows are checked by APPLY.md before VALIDATE.
alter table public.children add constraint children_has_date
  check (date_of_birth is not null or due_date is not null) not valid;

-- ─── 3. Client-supplied ids ─────────────────────────────────────────────
-- is_valid_client_uuid7() is defined in 20261003000000_security_and_family.sql
-- (the invite and policy-act RPCs there need it first).

-- Letters (DB-15). Same body as 20261002020000 plus the id and clock checks.
create or replace function public.entries_before_insert()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if not public.is_valid_client_uuid7(new.id) then
    raise exception 'entries: letter id must be a UUIDv7 made on the device' using errcode = 'SCCID';
  end if;
  if new.captured_at > now() + interval '1 day' then
    raise exception 'entries: captured_at is in the future' using errcode = '22023';
  end if;
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

-- ─── 4. create_child ────────────────────────────────────────────────────
drop function if exists public.create_child(text, date);

create or replace function public.create_child(p_id uuid, p_name text, p_date_of_birth date default null,
                                               p_due_date date default null)
returns uuid language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_uid uuid := public.require_user(); v_creator uuid; v_found boolean;
begin
  if not public.is_valid_client_uuid7(p_id) then
    raise exception 'child id must be a UUIDv7 made on the device' using errcode = 'SCCID';
  end if;
  select created_by, true into v_creator, v_found from children where id = p_id;
  if v_found then
    -- Retry of the same create (lost response, re-sync): idempotent.
    if v_creator = v_uid then return p_id; end if;
    raise exception 'child id already in use' using errcode = 'SCCID';
  end if;
  if exists (select 1 from purge_ledger where entity_type = 'child' and entity_id = p_id::text) then
    raise exception 'this book was deleted for good' using errcode = 'SCPRG';
  end if;
  perform public.require_content_consent();
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
    values (p_id, btrim(p_name), p_date_of_birth, p_due_date, v_uid);
  insert into child_members (child_id, profile_id, role) values (p_id, v_uid, 'parent');
  return p_id;
end;
$$;

-- ─── 5. Privileges ───────────────────────────────────────────────────────
revoke execute on function public.profiles_guard() from public, anon, authenticated;
revoke execute on function public.create_child(uuid, text, date, date) from public, anon;
grant execute on function public.create_child(uuid, text, date, date) to authenticated;
