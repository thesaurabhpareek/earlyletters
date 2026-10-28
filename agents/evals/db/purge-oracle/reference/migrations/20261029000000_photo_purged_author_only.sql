-- Purpose: photo_entry_is_purged was executable by every signed-in user with any text, and read purge_ledger
-- across all authors, so it told a stranger whether a letter id had been erased. Answer only for the author
-- of the erased letter, inside the author's own folder. Policies are unchanged: they already require folder 2
-- to be the caller, so they still get the answer they need. Rollback: restore the previous body.
create or replace function public.photo_entry_is_purged(p_name text) returns boolean
language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select auth.uid() is not null
     and split_part(p_name, '/', 2) = auth.uid()::text
     and exists (select 1 from public.purge_ledger
                  where author_id = auth.uid() and p_name like '%/%/%' || entry_id::text || '%') $$;
