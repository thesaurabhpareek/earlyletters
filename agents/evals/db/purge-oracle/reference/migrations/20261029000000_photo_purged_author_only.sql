-- Purpose: photo_entry_is_purged told any signed-in person whether a letter id had been erased, because
-- purge_ledger has no author. It now answers true only to the author on record, in the author's own folder:
-- the caller's own erasure record or 'erased' marker answers; the bare ledger counts only for an id nobody
-- else has a trail for (restore replay, where the author's own record is gone). Policies are unchanged.
-- Residual: a ledger-only id answers true to any signed-in person for a path in their own folder.
-- Rollback: restore the previous body of public.photo_entry_is_purged.
create or replace function public.photo_entry_is_purged(p_name text)
returns boolean language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  with t as (
    select (substring(p_name from '^[^/]+/[^/]+/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})'))::uuid as id
  )
  select coalesce(
    split_part(p_name, '/', 2) = auth.uid()::text
    and (select t.id is not null and (
           exists (select 1 from sync_private.entry_erasures x where x.entry_id = t.id and x.author_id = auth.uid())
        or exists (select 1 from public.held_drafts_gone g where g.id = t.id and g.author_id = auth.uid() and g.gone = 'erased')
        or (exists (select 1 from public.purge_ledger l where l.entity_type = 'entry' and l.entity_id = t.id::text)
            and not sync_private.letter_id_taken(t.id, auth.uid()))
         ) from t), false);
$$;
revoke execute on function public.photo_entry_is_purged(text) from public, anon;
grant execute on function public.photo_entry_is_purged(text) to authenticated;
