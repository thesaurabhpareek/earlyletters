-- Purpose: a rename (Storage move and upsert are an UPDATE) may not land a photo on an erased letter's path.
-- The update policy now carries the same conditions as the insert policy: the path is exactly
-- {book}/{author}/{file} (array_length = 2) and the file is not an erased letter's. Changes no row.
-- Rollback: restate entry_photos_author_update without the last two conditions (as in 20261005000000).
-- Ordering: after the migration that created entry_photos_author_update.
alter policy entry_photos_author_update on storage.objects
  using (bucket_id = 'entry-photos' and (storage.foldername(name))[2] = (select auth.uid())::text)
  with check (bucket_id = 'entry-photos' and (storage.foldername(name))[2] = (select auth.uid())::text
              and array_length(storage.foldername(name), 1) = 2
              and public.is_child_member(((storage.foldername(name))[1])::uuid)
              and public.child_is_live(((storage.foldername(name))[1])::uuid)
              and public.can_write_content()
              and not public.photo_entry_is_purged(name));
