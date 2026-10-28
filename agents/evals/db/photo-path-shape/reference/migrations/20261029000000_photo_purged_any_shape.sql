-- Purpose: the erased-letter check matched only `child/author/uuid.ext`. Objects named `uuid.x.jpg`, `uuid`,
-- `uuid-1.jpg` or `sub/uuid.jpg` were equally orphaned and never purged. The uuid is now read as the START of
-- the file name (third folder level), and both Storage policies refuse a path deeper than {book}/{author}/{file}
-- (array_length = 2), so nesting cannot hide an id. The helper stays author-scoped (it answers true only to the
-- author on record, in the author's own folder). Not measured: at most three indexed primary-key lookups per
-- insert or rename; the policies already ran the helper once.
-- Rollback: restore the previous helper body and the two policies without the array_length condition.
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

alter policy entry_photos_author_insert on storage.objects with check (
  bucket_id = 'entry-photos'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and array_length(storage.foldername(name), 1) = 2
  and public.is_child_member(((storage.foldername(name))[1])::uuid)
  and public.child_is_live(((storage.foldername(name))[1])::uuid)
  and public.can_write_content()
  and not public.photo_entry_is_purged(name)
);
alter policy entry_photos_author_update on storage.objects
  using (bucket_id = 'entry-photos' and (storage.foldername(name))[2] = (select auth.uid())::text)
  with check (bucket_id = 'entry-photos' and (storage.foldername(name))[2] = (select auth.uid())::text
              and array_length(storage.foldername(name), 1) = 2
              and public.is_child_member(((storage.foldername(name))[1])::uuid)
              and public.child_is_live(((storage.foldername(name))[1])::uuid)
              and public.can_write_content()
              and not public.photo_entry_is_purged(name));
