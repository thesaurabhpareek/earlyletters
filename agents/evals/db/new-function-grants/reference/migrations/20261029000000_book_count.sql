-- Purpose: a count of the people in a book, for the family screen. Not applied yet (not in applied.txt).
-- Grants live here, in the function's own migration: default privileges are reset, and PUBLIC would otherwise
-- let anon call it. Rollback: drop function public.child_book_members(uuid).
create function public.child_book_members(p_child uuid) returns int
language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select case when public.is_child_member(p_child)
              then (select count(*)::int from public.child_members where child_id = p_child) end $$;
revoke execute on function public.child_book_members(uuid) from public;
grant execute on function public.child_book_members(uuid) to authenticated;
