-- BL-1499 (BL-244b, API-R10): the NOT NULL, foreign key and shape CHECK errors on the four content tables, answered without the row.
--
-- PENDING: not yet applied. Applying it is the founder's step (D-041, CR-73). Apply after 20261121040000 (supabase/APPLY.md, File 40).
-- ROLLBACK (forward-fix only): drop trigger children_validate_shape on public.children and drop function public.children_validate_shape();
-- the CHECKs stay and keep refusing, as before, with the row in DETAIL.
--
-- Which paths can echo. Postgres prints "Failing row contains (...)" (NOT NULL, CHECK) and "Key (...)=(...)" (foreign key) only to a role
-- that is not subject to row level security on the table. A caller that is (authenticated, through the Data API or through sync_push,
-- which is SECURITY INVOKER) gets the bare message and no DETAIL, and the server log has none either. So the echo is reachable only
-- from code that runs as the table owner: a SECURITY DEFINER function. Every function in every schema that writes entries, held_drafts,
-- children or dictionary_terms was read, and each violation below was tried in PGlite with a Devanagari value
-- (supabase/tests/value_free_validation.test.mjs, VF-9 to VF-12):
--
--   REACHABLE, closed here (children, written by definer RPCs; the row printed carries name and nickname, L4):
--     children_has_date           public.book_update: {"date_of_birth": null} on a book with no due date
--     children NOT NULL           public.book_update: {"family_can_read": null} (the other writers coalesce name; created_at,
--                                 updated_at and book_look have defaults, id comes from create_child_row)
--     children_photo_path_scoped  public.ops_set_child_photo_path (service_role, called by the purge worker with a path it builds)
--   A trigger answers each with the same SQLSTATE and constraint name the CHECK carried, and a fixed message that names the table and
--   the rule. The CHECKs stay as the last line.
--
--   UNREACHABLE, no trigger needed (each is pinned by a test; a new writer or a new grant fails VF-9 and VF-10 until it is classified):
--     entries, held_drafts   every write by a client runs as authenticated (direct insert or update on the column grants, or sync_push
--                            and sync_private.held_upsert, both INVOKER): RLS is on, so no row or key is printed (VF-11). The
--                            definer writers (delete_entry, restore_entry, review_family_letter, withdraw_family_letter, leave_child,
--                            remove_child_member, undo_parent_join, sync_private.erase_entry, request_*_deletion, cancel_*_deletion,
--                            finalize_account_deletion) set constants or values they validated first (review_family_letter refuses any
--                            other decision with 22023 before it writes).
--     foreign keys           entries and held_drafts: the RLS check and held_upsert's own parent check run before the key is checked
--                            and need the book and the author to exist (VF-11, a made-up child or author is refused 42501). children:
--                            created_by is the caller (require_user) and deletion_request_id is set by the deletion functions from a
--                            row they just made. Not reachable with a value a person controls.
--     children enum shape    book_look: no writer changes it (default 'classic').
--     dictionary_terms       no role holds any privilege on it and no function writes it (20261023060000): every attempt stops at 42501
--                            before a constraint is looked at (VF-10).
--   Not in scope, and still open: a date or boolean that does not parse ("invalid input syntax for type date") echoes the text
--   from the cast in book_update and sync_push's first-run path. That is a cast, not a constraint, on a birthday and not a letter.
--
-- Function: SECURITY INVOKER (it reads only NEW), search_path pinned to pg_catalog, public, pg_temp, EXECUTE revoked from PUBLIC, anon,
-- authenticated and service_role (a trigger does not need the writer to hold EXECUTE). No entry in supabase/tests/grants.mjs: no API
-- role runs it. No table, column, CHECK or table grant changes; no new column, so nothing to classify. Existing rows are never
-- rewritten; the trigger is BEFORE INSERT OR UPDATE per row and tests only NEW. Its name sorts after children_validate_limits.
-- Budget: three null tests and one regex match on a short value per written children row (a book is written a few times in its life).
-- New SQLSTATEs: none (23502 and 23514, as before). Tests: supabase/tests/value_free_validation.test.mjs. Fictional family "Asha" only.

create or replace function public.children_validate_shape()
returns trigger language plpgsql set search_path = pg_catalog, public, pg_temp as $$
begin
  if new.family_can_read is null then
    raise exception 'children: family_can_read is required' using errcode = '23502', table = 'children', column = 'family_can_read';
  end if;
  if new.date_of_birth is null and new.due_date is null then
    raise exception 'children: a birthday or a due date is needed' using errcode = '23514', constraint = 'children_has_date';
  end if;
  if new.photo_path is not null and new.photo_path !~ ('^' || new.id::text || '/[0-9a-f-]{36}\.(jpg|jpeg|heic|png)$') then
    raise exception 'children: photo_path is not an allowed path' using errcode = '23514', constraint = 'children_photo_path_scoped';
  end if;
  return new;
end;
$$;

drop trigger if exists children_validate_shape on public.children;
create trigger children_validate_shape before insert or update on public.children
  for each row execute function public.children_validate_shape();

revoke execute on function public.children_validate_shape() from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'revoke execute on function public.children_validate_shape() from anon, authenticated, service_role';
  end if;
end;
$$;
