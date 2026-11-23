-- BL-1537 (BL-244c, API-R10): a date or boolean that does not parse, answered without the text.
--
-- PENDING: not yet applied. Applying it is the founder's step (D-041, CR-73). Apply after 20261122000000 (supabase/APPLY.md, File 42).
-- ROLLBACK (forward-fix only): re-create public.book_update from 20261109000000 and public.create_first_run_children from
-- 20261015000000, then drop sync_private.safe_date(text) and sync_private.safe_bool(text).
--
-- The leak. 20261122000000 (File 41) left one echo open: a date or boolean that does not parse. Postgres puts the text in the message,
-- "invalid input syntax for type date: <text>", and in the server log, with SQLSTATE 22007 (date) or 22P02 (boolean). Reproduced
-- (supabase/tests/value_free_validation.test.mjs, VF-15): public.book_update with {"date_of_birth": "<text>"} (or due_date,
-- family_can_read) and public.create_first_run_children with a bad date_of_birth or due_date, called directly. The text is the caller's
-- own, returned to the caller, but it is a birthday field and it reaches the log.
-- sync_push is not an echo: its per-op handler answers the SQLSTATE only and a caught PL/pgSQL error is not logged. Its book.update and
-- book.first_run ops reach the two functions above and are fixed with them; its book.create cast and its entry and held casts sit
-- inside that handler (VF-15 shows the answer carries the code and no text).
--
-- The fix. sync_private.safe_date(text) and sync_private.safe_bool(text) parse with the same cast inside an exception block that
-- catches class 22 (data exception) only, and re-raise with that SQLSTATE and a fixed message ("invalid date", "invalid boolean"):
-- the code the client maps today does not change (22007 and 22P02 for the cases tried, 22008 for a date out of range) and the cast's
-- own error is caught, so it is never logged. A null stays null. book_update and create_first_run_children use them in place of the
-- raw casts; create_first_run_children reads the two dates as text from jsonb_to_recordset and parses them in its loop.
-- Bodies are otherwise those of 20261109000000 and 20261015000000.
--
-- Grants. Both helpers are SECURITY INVOKER (they read nothing), STABLE, search_path pinned to pg_catalog, public, pg_temp. EXECUTE is
-- revoked from PUBLIC and anon and granted to authenticated, because sync_private is called by invoker code (sync_push). No new
-- table, column or CHECK; no column to classify. book_update and create_first_run_children keep their grants (restated below).
-- Budget: one subtransaction per cast, on a book write (a few times in a book's life) and at most 6 books per first run. Not a read path.
-- New SQLSTATEs: none. Tests: VF-13 to VF-17. Fictional family "Asha" only.

create or replace function sync_private.safe_date(p_text text)
returns date language plpgsql stable security invoker set search_path = pg_catalog, public, pg_temp as $$
begin
  return p_text::date;
exception when data_exception then
  raise exception 'invalid date' using errcode = sqlstate;
end;
$$;

create or replace function sync_private.safe_bool(p_text text)
returns boolean language plpgsql stable security invoker set search_path = pg_catalog, public, pg_temp as $$
begin
  return p_text::boolean;
exception when data_exception then
  raise exception 'invalid boolean' using errcode = sqlstate;
end;
$$;

revoke execute on function sync_private.safe_date(text), sync_private.safe_bool(text) from public, anon;
grant execute on function sync_private.safe_date(text), sync_private.safe_bool(text) to authenticated;

-- From 20261109000000: the date and boolean casts only.
create or replace function public.book_update(p_child uuid, p_data jsonb)
returns void language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_uid uuid := public.require_user();
  d jsonb := coalesce(p_data, '{}'::jsonb);
begin
  if jsonb_typeof(d) <> 'object' then
    raise exception 'book data must be an object' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_object_keys(d) x
              where x not in ('name', 'nickname', 'date_of_birth', 'due_date', 'family_can_read')) then
    raise exception 'unknown book field' using errcode = '22023';
  end if;
  if p_child is null or not public.is_child_member(p_child) then
    raise exception 'book not found' using errcode = 'P0002';
  end if;
  perform public.require_content_consent();
  if not public.is_child_parent(p_child) then
    raise exception 'children: only a parent can change book settings' using errcode = 'SCPAR';
  end if;
  update children c set
    name = case when d ? 'name' then coalesce(btrim(d ->> 'name'), '') else c.name end,
    nickname = case when d ? 'nickname' then nullif(btrim(d ->> 'nickname'), '') else c.nickname end,
    date_of_birth = case when d ? 'date_of_birth' then sync_private.safe_date(d ->> 'date_of_birth') else c.date_of_birth end,
    due_date = case when d ? 'due_date' then sync_private.safe_date(d ->> 'due_date') else c.due_date end,
    family_can_read = case when d ? 'family_can_read' then sync_private.safe_bool(d ->> 'family_can_read') else c.family_can_read end
  where c.id = p_child
    and (c.name, c.nickname, c.date_of_birth, c.due_date, c.family_can_read) is distinct from
        (case when d ? 'name' then coalesce(btrim(d ->> 'name'), '') else c.name end,
         case when d ? 'nickname' then nullif(btrim(d ->> 'nickname'), '') else c.nickname end,
         case when d ? 'date_of_birth' then sync_private.safe_date(d ->> 'date_of_birth') else c.date_of_birth end,
         case when d ? 'due_date' then sync_private.safe_date(d ->> 'due_date') else c.due_date end,
         case when d ? 'family_can_read' then sync_private.safe_bool(d ->> 'family_can_read') else c.family_can_read end);
end;
$$;

-- From 20261015000000: the two dates are parsed by sync_private.safe_date.
create or replace function public.create_first_run_children(p_children jsonb)
returns uuid[] language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_uid uuid := public.require_user();
  v_ids uuid[] := '{}';
  v_new int;
  r record;
begin
  if jsonb_typeof(p_children) is distinct from 'array'
     or jsonb_array_length(p_children) not between 1 and 6 then
    raise exception 'first run takes 1 to 6 children' using errcode = '22023';
  end if;
  perform 1 from profiles where id = v_uid for update;
  perform public.require_content_consent();
  select count(*) into v_new
    from jsonb_to_recordset(p_children) as x(id uuid)
   where not exists (select 1 from children c where c.id = x.id and c.created_by = v_uid);
  if v_new > 0
     and (select count(*) from children where created_by = v_uid and created_at > now() - interval '24 hours') + v_new > 20 then
    raise exception 'too many new books today' using errcode = 'SCRAT', detail = '20';
  end if;
  for r in select * from jsonb_to_recordset(p_children) as x(id uuid, name text, date_of_birth text, due_date text)
  loop
    v_ids := v_ids || public.create_child_row(v_uid, r.id, r.name, sync_private.safe_date(r.date_of_birth), sync_private.safe_date(r.due_date));
  end loop;
  update profiles set first_run_closed_at = coalesce(first_run_closed_at, now()) where id = v_uid;
  return v_ids;
end;
$$;

-- Same grants as before, stated again: signed-in people only.
revoke execute on function public.book_update(uuid, jsonb), public.create_first_run_children(jsonb) from public, anon;
grant execute on function public.book_update(uuid, jsonb), public.create_first_run_children(jsonb) to authenticated;
