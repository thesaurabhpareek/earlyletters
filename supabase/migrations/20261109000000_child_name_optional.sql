-- A child's name is optional on the server; the date stays required.
-- NX-31 R3 and R28, founder decision of 9 Nov 2026 ("name optional, date required").
--
-- PENDING: not yet applied. Apply after every earlier file, following supabase/APPLY.md,
-- from CI on a tag only (D-041). Needs red-team review and the founder's approve-migration
-- label. Never edits an earlier file. No data migration: no existing row changes.
--
-- ROLLBACK (only while no book has an empty name; otherwise first set those names to a
-- value the person chose, never a placeholder):
--   alter table public.children drop constraint children_name_check;
--   alter table public.children add constraint children_name_check
--     check (char_length(name) between 1 and 60);
--   and re-create create_child_row from the 20261004000000_plus_on_device_only.sql definition
--   but WITH `set search_path = pg_catalog, public, pg_temp` (that file has `public,
--   pg_catalog`, no pg_temp, which the pg_temp_search_path tests refuse), then re-run:
--   revoke all on function public.create_child_row(uuid, uuid, text, date, date)
--     from public, anon, authenticated, service_role;
--
-- VERIFY AFTER APPLY (the drop below is "if exists": a hosted project whose check had a
-- different name would keep the old rule AND gain the new one, and an empty name would
-- still fail with 23514 after a "successful" apply). Run in the SQL Editor:
--   select conname, pg_get_constraintdef(oid) from pg_constraint
--    where conrelid = 'public.children'::regclass and contype = 'c';
-- It must show children_name_check with exactly `CHECK ((char_length(name) <= 60))` and no
-- other check on the name column (children_nickname_check is a different column). If an older name check is listed, drop it by its name.
--
-- Decision: empty string, not NULL. The column stays NOT NULL and may hold '' (length 0 to
-- 60). The phone's own table is `name TEXT NOT NULL` and stores '' for no name, so the same
-- value travels both ways with no translation and no second "absent" state. NULL would add
-- a branch to every reader (sync pull, export, book list, dictionary) for no gain. The
-- fallback shown for an empty name ("your child") is display only; it is never stored.
--
-- What changes:
--   1. children_name_check: char_length(name) <= 60 (was between 1 and 60).
--   2. create_child_row, the one function that validated the name. create_child and
--      create_first_run_children (and so the sync ops book.create and book.first_run) call
--      it and validate nothing themselves, so they need no new definition. A name of spaces
--      or a missing name is stored as ''. More than 60 characters is still refused (22023).
--      A birthday or a due date is still required (22023); each refusal has its own message.
--   3. book_update writes the name straight to the column, so a later edit may now set or
--      clear it; the table check still stops 61 characters (23514). Not redefined.
--
-- Access: unchanged. create_child_row stays callable by no client role. search_path is
-- pinned with pg_temp last (20261028000000). No new function, table or column, so nothing
-- is added to supabase/tests/grants.mjs; the classification of children.name (L4 child
-- name, class S) is unchanged.
-- Plan and lock: ALTER TABLE ... ADD CONSTRAINT takes one short ACCESS EXCLUSIVE lock and
-- scans children once (a table of books, not entries); the new check is looser, so no row
-- can fail it.

alter table public.children drop constraint if exists children_name_check;
alter table public.children add constraint children_name_check check (char_length(name) <= 60);

-- From 20261004000000: the name rule only.
create or replace function public.create_child_row(p_uid uuid, p_id uuid, p_name text, p_date_of_birth date,
                                                   p_due_date date)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare v_creator uuid; v_found boolean; v_name text := coalesce(btrim(p_name), '');
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
  if char_length(v_name) > 60 then
    raise exception 'name must be at most 60 characters' using errcode = '22023';
  end if;
  if p_date_of_birth is null and p_due_date is null then
    raise exception 'a birthday or a due date is needed' using errcode = '22023';
  end if;
  if p_date_of_birth > current_date + 1 or p_date_of_birth < date '1900-01-01'
     or p_due_date > current_date + 310 or p_due_date < current_date - 400 then
    raise exception 'date out of range' using errcode = '22023';
  end if;
  insert into children (id, name, date_of_birth, due_date, created_by)
    values (p_id, v_name, p_date_of_birth, p_due_date, p_uid);
  insert into child_members (child_id, profile_id, role) values (p_id, p_uid, 'parent');
  update profiles set first_run_closed_at = coalesce(first_run_closed_at, now()) where id = p_uid;
  return p_id;
end;
$$;

-- Same grants as before, stated again so this file is the whole picture: no client role.
revoke all on function public.create_child_row(uuid, uuid, text, date, date) from public, anon, authenticated, service_role;
