-- BL-1572: raise the server length checks on children.name and the four signs_as columns, so the phone can count graphemes only.
--
-- Purpose. The phone counts a typed name or signature in graphemes (packages/core/src/length.ts), at most 16 code points a
-- character. The server counted code points: children.name <= 60 and the four signs_as columns <= 30, so a 30-character Devanagari
-- name (about 90 code points) was refused or cut short. The ceilings become 960 (name: 60 x 16) and 480 (signs_as: 30 x 16) code
-- points. Product rules (60 and 30 characters) stay in the app; the server holds only a loose backstop.
-- Raised: children.name 60 -> 960; profiles.signs_as, child_member_prefs.signs_as, child_invites.signs_as and
-- entries.author_signs_as 30 -> 480. NOT changed: children.nickname (30), the one other short text; not in the BL-1572 scope.
--
-- Where the limit lives, all five places (the old limit left in any one would still refuse):
--   1. the CHECK constraints (children_name_check and the four *_signs_as_check, same names);
--   2. the value-free BEFORE triggers of 20261121040000 (children_validate_limits, entries_validate_limits), which run before the
--      CHECKs and shadow them; re-created with the new numbers, same name, same fixed messages, same SQLSTATE 23514;
--   3. create_child_row (20261109000000), which refuses a long name with 22023 before the insert; re-created, only the number changes.
--   book_update and create_first_run_children carry no length test of their own: the table check and trigger stop them.
--
-- Ordering. Apply after 20261123100000 (File 46, sync_pull_consent_gate). Not applied. Applying it to a hosted project is the
-- founder's step (D-041, CR-73), from a CI tag run. The app does not change until then. If this merges after the main cut, it ships
-- in a later tag.
-- Rollback (forward-fix only; never edit this file once applied). Restoring the old numbers is safe only if no row is over the old
-- limits (children.name 60, the four signs_as columns 30). A NOT VALID check skips the scan at apply time, but it and the old
-- BEFORE triggers still test the row on every later INSERT or UPDATE, so a row over the old limit would refuse every update of
-- that row, even of an unrelated column: the book could not be renamed, edited or synced. Words are never cut (the constitution).
-- So: do not restore the old triggers or checks while any row is above the old limits. Either keep the new limits (the default:
-- they are looser, so they cannot fail old data) or first fix those rows by a decision of the data architect, then restore the
-- old numbers in the five places above.
--
-- Safety. The new limits are looser, so no stored row can fail them. DROP and ADD CONSTRAINT take one short ACCESS EXCLUSIVE lock
-- and scan the table once; run in one transaction so no write sees neither check. No new object, column or grant (the functions keep
-- their grants: create or replace keeps them, and create_child_row is restated). Nothing new to classify: same columns, same classes.
-- Budget: one char_length per limited column per written row (as before); no query, no index.
-- Errors stay value-free (BL-244): fixed message, no DETAIL. Tests: supabase/tests/entry_length_checks.test.mjs.

-- --- 1. the CHECK constraints ---------------------------------------------------------------------------------------------
-- Drop by what the constraint reads, not by an assumed name: the inline checks of the first migrations carry generated names.
do $$
declare
  t record;
  c record;
begin
  for t in select * from (values
      ('public.profiles'::regclass, 'signs_as', 'profiles_signs_as_check', 480),
      ('public.child_member_prefs'::regclass, 'signs_as', 'child_member_prefs_signs_as_check', 480),
      ('public.child_invites'::regclass, 'signs_as', 'child_invites_signs_as_check', 480),
      ('public.entries'::regclass, 'author_signs_as', 'entries_author_signs_as_check', 480),
      ('public.children'::regclass, 'name', 'children_name_check', 960)
    ) as v(rel, col, conname, lim)
  loop
    for c in
      select k.conname from pg_constraint k
       where k.conrelid = t.rel and k.contype = 'c'
         and k.conkey = array[(select a.attnum from pg_attribute a where a.attrelid = t.rel and a.attname = t.col)]
    loop
      execute format('alter table %s drop constraint %I', t.rel, c.conname);
    end loop;
    execute format('alter table %s add constraint %I check (char_length(%I) <= %s)', t.rel, t.conname, t.col, t.lim);
  end loop;
end $$;

-- --- 2. the value-free triggers (bodies as in 20261121040000; only the two numbers change) -----------------------------------
create or replace function public.entries_validate_limits()
returns trigger language plpgsql set search_path = pg_catalog, public, pg_temp as $$
begin
  if char_length(new.final_text) > 20000 then
    raise exception 'entries: final_text is over its limit' using errcode = '23514', constraint = 'entries_final_text_length';
  end if;
  if char_length(new.raw_transcript) > 40000 then
    raise exception 'entries: raw_transcript is over its limit' using errcode = '23514', constraint = 'entries_raw_length';
  end if;
  if char_length(new.author_signs_as) > 480 then
    raise exception 'entries: author_signs_as is over its limit' using errcode = '23514', constraint = 'entries_author_signs_as_check';
  end if;
  if new.author_edits is not null and octet_length(new.author_edits::text) > 65536 then
    raise exception 'entries: author_edits is over its size limit' using errcode = '23514', constraint = 'entries_author_edits_shape';
  end if;
  if new.locked_spans is not null and octet_length(new.locked_spans::text) > 16384 then
    raise exception 'entries: locked_spans is over its size limit' using errcode = '23514', constraint = 'entries_locked_spans_shape';
  end if;
  return new;
end;
$$;

create or replace function public.children_validate_limits()
returns trigger language plpgsql set search_path = pg_catalog, public, pg_temp as $$
begin
  if char_length(new.name) > 960 then
    raise exception 'children: name is over its limit' using errcode = '23514', constraint = 'children_name_check';
  end if;
  if char_length(new.nickname) > 30 then
    raise exception 'children: nickname is over its limit' using errcode = '23514', constraint = 'children_nickname_check';
  end if;
  return new;
end;
$$;

-- --- 3. create_child_row (body as in 20261109000000; only the name limit changes) ---------------------------------------------
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
  if char_length(v_name) > 960 then
    raise exception 'name must be at most 960 characters' using errcode = '22023';
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
