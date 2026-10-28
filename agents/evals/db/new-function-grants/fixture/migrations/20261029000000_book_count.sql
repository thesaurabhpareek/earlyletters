-- Purpose: a count of the people in a book, for the family screen. Not applied yet (not in applied.txt).
-- Rollback: drop function public.child_book_members(uuid).
create function public.child_book_members(p_child uuid) returns int
language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select case when public.is_child_member(p_child)
              then (select count(*)::int from public.child_members where child_id = p_child) end $$;
