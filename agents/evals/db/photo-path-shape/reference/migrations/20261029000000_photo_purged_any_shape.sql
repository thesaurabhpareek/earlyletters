-- Purpose: the erased-letter check matched only `child/author/uuid.ext`. Objects named `uuid.x.jpg`, `uuid`,
-- `uuid-1.jpg` or `sub/uuid.jpg` were equally orphaned and never purged. Match the letter id anywhere after the
-- two leading folders instead. Same signature, so both policies pick it up. Not measured: one ledger scan per
-- insert or rename, as before. Rollback: restore the previous body (anchored regex) with create or replace.
create or replace function public.photo_entry_is_purged(p_name text) returns boolean
language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select exists (select 1 from public.purge_ledger where p_name like '%/%/%' || entry_id::text || '%') $$;
